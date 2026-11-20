#!/usr/bin/env python3
"""
Xoá các bản ghi ảnh HỎNG (mất file) mà còn bản LÀNH cùng tên, theo ~/Downloads/ics-grid/safe_to_delete.csv.
MẶC ĐỊNH CHỈ XEM TRƯỚC (không xoá). Chỉ xoá thật khi thêm --confirm.

    export ICS_TOKEN='...'
    python3 ics-delete.py                          # xem trước (chỉ đọc)
    python3 ics-delete.py --limit 3 --confirm      # xoá thật 3 ảnh đầu để thử
    python3 ics-delete.py --confirm                # xoá hết

Trước MỖI lần xoá, script kiểm tra lại trực tiếp trên ICS:
  1. bản ghi còn tồn tại và đúng tên;  2. file của nó vẫn đang mất (19002);
  3. bản cùng tên kia vẫn còn file lành.  Thiếu một điều kiện nào thì bỏ qua, không xoá.
Thông tin đầy đủ của ảnh bị xoá được lưu vào backup_deleted.jsonl; nhật ký ở delete_log.csv.
"""
import argparse, csv, getpass, json, os, sys, time, urllib.error, urllib.request

API = 'https://icstestsapi.pls.edu.vn'
ORIGIN = 'https://icstest.pls.edu.vn'
ap = argparse.ArgumentParser()
ap.add_argument('--dir', default='~/Downloads/ics-grid')
ap.add_argument('--api', default=API)
ap.add_argument('--confirm', action='store_true', help='xoá thật (mặc định chỉ xem trước)')
ap.add_argument('--limit', type=int, default=0)
ap.add_argument('--batch', type=int, default=10)
ap.add_argument('--max', type=int, default=300, help='từ chối nếu danh sách xoá dài hơn số này')
ap.add_argument('--delay', type=float, default=0.15)
a = ap.parse_args()

tok = os.environ.get('ICS_TOKEN', '').strip()
tok = tok[7:].strip() if tok.lower().startswith('bearer ') else tok
if not tok:
    sys.exit('Thiếu ICS_TOKEN (export ICS_TOKEN=...)')
S = {'tok': tok}


def call(method, url, body=None, extra=None):
    """Trả (mã, bytes). Không ném lỗi với 4xx; hết token thì hỏi token mới."""
    attempt = 0
    while True:
        h = {'Authorization': 'Bearer ' + S['tok'], 'Accept': '*/*', 'Origin': ORIGIN, 'Referer': ORIGIN + '/'}
        data = None
        if body is not None:
            data = json.dumps(body).encode()
            h['Content-Type'] = 'application/json'
        h.update(extra or {})
        try:
            with urllib.request.urlopen(urllib.request.Request(url, data=data, method=method, headers=h), timeout=60) as r:
                b = r.read(); time.sleep(a.delay); return r.status, b
        except urllib.error.HTTPError as e:
            b = e.read()
            if e.code in (401, 403):
                print(f'\n⚠️  Lỗi {e.code}: token hết hạn. Dán token mới (chữ không hiện), Enter; để trống để thoát.')
                t = getpass.getpass('Token mới: ').strip()
                if not t:
                    sys.exit('Đã dừng. Chạy lại lệnh cũ để tiếp tục (ảnh đã xoá được bỏ qua).')
                S['tok'] = t[7:].strip() if t.lower().startswith('bearer ') else t
                continue
            if e.code < 500 and e.code != 429:
                time.sleep(a.delay); return e.code, b
        except (urllib.error.URLError, TimeoutError, OSError):
            pass
        attempt += 1
        if attempt >= 4:
            sys.exit(f'Lỗi mạng/máy chủ khi gọi {method} {url}')
        time.sleep(2 ** attempt)


def meta(fid):
    code, b = call('GET', f'{a.api}/files/{fid}')
    if code == 200:
        return json.loads(b).get('data')
    return None


def file_state(link):
    if not link:
        return 'missing'
    code, b = call('GET', link, extra={'Range': 'bytes=0-0'})
    if code in (200, 206):
        return 'ok'
    return 'missing' if (code == 404 and b'19002' in b) else f'other{code}'


d = os.path.expanduser(a.dir)
rows = list(csv.DictReader(open(os.path.join(d, 'safe_to_delete.csv'), encoding='utf-8')))
if len(rows) > a.max:
    sys.exit(f'Danh sách có {len(rows)} dòng, lớn hơn --max {a.max}. Kiểm tra lại file hoặc tăng --max.')
log_path = os.path.join(d, 'delete_log.csv')
done = set()
if os.path.exists(log_path):
    done = {r['id'] for r in csv.DictReader(open(log_path, encoding='utf-8')) if r['status'] in ('deleted', 'gone')}
todo = [r for r in rows if r['id'] not in done]
if a.limit:
    todo = todo[:a.limit]
mode = 'XOÁ THẬT' if a.confirm else 'XEM TRƯỚC (không xoá)'
print(f'{mode} · danh sách {len(rows)} · đã xử lý trước đó {len(done)} · lần này {len(todo)}')

newlog = not os.path.exists(log_path)
lf = open(log_path, 'a', newline='', encoding='utf-8')
lw = csv.writer(lf)
if newlog:
    lw.writerow(['id', 'name', 'status', 'detail'])
bf = open(os.path.join(d, 'backup_deleted.jsonl'), 'a', encoding='utf-8')
cnt = {'deleted': 0, 'would': 0, 'skip': 0, 'gone': 0}
queue = []


def flush():
    global queue
    if not queue:
        return
    ids = [r['id'] for r, m in queue]
    if a.confirm:
        for r, m in queue:
            bf.write(json.dumps(m, ensure_ascii=False) + '\n')
        bf.flush()
        code, b = call('POST', f'{a.api}/files/delete-resources', {'file_ids': ids})
        got = set(((json.loads(b).get('data') or {}).get('ids') or [])) if code == 200 else set()
        for r, m in queue:
            ok = r['id'] in got
            lw.writerow([r['id'], r['name'], 'deleted' if ok else 'fail', '' if ok else f'{code} {b[:120]!r}'])
            cnt['deleted' if ok else 'skip'] += 1
            print(('  ĐÃ XOÁ  ' if ok else '  KHÔNG XOÁ ĐƯỢC  ') + r['name'], flush=True)
    else:
        for r, m in queue:
            cnt['would'] += 1
            print('  SẼ XOÁ  ' + r['name'], flush=True)
    lf.flush()
    queue = []


for i, r in enumerate(todo, 1):
    why = None
    m = meta(r['id'])
    if m is None:
        lw.writerow([r['id'], r['name'], 'gone', 'bản ghi không còn (đã xoá trước đó)'])
        cnt['gone'] += 1; print(f'[{i}/{len(todo)}] đã xoá trước đó: {r["name"]}'); continue
    if m.get('name') != r['name']:
        why = f'tên trên ICS khác ({m.get("name")})'
    elif file_state(m.get('link')) != 'missing':
        why = 'file không còn hỏng nữa'
    else:
        twins = [t for t in (r.get('ban_lanh_cung_ten') or '').split() if t != r['id']]
        if not any((tm := meta(t)) and tm.get('name') == r['name'] and file_state(tm.get('link')) == 'ok' for t in twins):
            why = 'không còn bản lành cùng tên'
    if why:
        lw.writerow([r['id'], r['name'], 'skip', why]); cnt['skip'] += 1
        print(f'[{i}/{len(todo)}] BỎ QUA {r["name"]}: {why}', flush=True); continue
    queue.append((r, m))
    if len(queue) >= a.batch:
        flush()
flush()
print(f'\nXong ({mode}). ' + (f'Đã xoá {cnt["deleted"]}' if a.confirm else f'Sẽ xoá {cnt["would"]}') +
      f' · bỏ qua {cnt["skip"]} · đã xoá trước đó {cnt["gone"]}.')
print('Nhật ký:', log_path, '· sao lưu:', os.path.join(d, 'backup_deleted.jsonl'))
