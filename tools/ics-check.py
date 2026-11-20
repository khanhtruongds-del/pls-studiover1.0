#!/usr/bin/env python3
"""
Kiểm tra ảnh nào trong danh sách ICS đã MẤT file vật lý (CHỈ ĐỌC).
Đọc ~/Downloads/ics-grid/index.json (do ics-grid.py tạo), thử mở link từng ảnh
(chỉ đọc 1 byte rồi đóng, không tải cả ảnh), ghi kết quả vào broken.csv.

    python3 ics-check.py                 # không cần token: link đã có chữ ký
Nếu báo link hết hạn (401/403) thì chạy lại ics-grid.py với --refresh trước.
Chạy lại được: ảnh đã kiểm tra xong sẽ được bỏ qua.
"""
import argparse, csv, json, os, sys, threading, time, urllib.error, urllib.request
from concurrent.futures import ThreadPoolExecutor

ap = argparse.ArgumentParser()
ap.add_argument('--dir', default='~/Downloads/ics-grid')
ap.add_argument('--workers', type=int, default=6)
a = ap.parse_args()
d = os.path.expanduser(a.dir)
items = json.load(open(os.path.join(d, 'index.json'), encoding='utf-8'))
res_path = os.path.join(d, 'check_results.csv')
done = {}
if os.path.exists(res_path):
    for r in csv.DictReader(open(res_path, encoding='utf-8')):
        if r['status'] not in ('error',):
            done[r['id']] = r
todo = [x for x in items if x['id'] not in done]
print(f'{len(items)} ảnh · đã kiểm tra {len(done)} · còn {len(todo)}')
lock = threading.Lock()
newf = not os.path.exists(res_path)
f = open(res_path, 'a', newline='', encoding='utf-8')
w = csv.writer(f)
if newf:
    w.writerow(['id', 'name', 'status', 'detail'])
count = {'ok': 0, 'missing': 0, 'error': 0, 'expired': 0, 'n': 0}
H = {'Accept': '*/*', 'Origin': 'https://icstest.pls.edu.vn', 'Referer': 'https://icstest.pls.edu.vn/'}


def check(it):
    url = it.get('link')
    if not url:
        return it, 'missing', 'không có link'
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=40) as r:
                r.read(1)
                return it, 'ok', ''
        except urllib.error.HTTPError as e:
            body = e.read().decode('utf-8', 'replace')[:200]
            if e.code == 404 and '19002' in body:
                return it, 'missing', 'File vật lý không còn tồn tại'
            if e.code in (401, 403):
                return it, 'expired', f'{e.code} link hết hạn/không hợp lệ'
            if e.code == 404:
                return it, 'missing', '404 ' + body
            err = f'{e.code} {body}'
        except Exception as e:
            err = str(getattr(e, 'reason', e))
        time.sleep(2 * (attempt + 1))
    return it, 'error', err


def work(it):
    it, st, detail = check(it)
    with lock:
        count[st] += 1
        count['n'] += 1
        if st != 'expired':
            w.writerow([it['id'], it['name'], st, detail])
            f.flush()
        if count['n'] % 100 == 0:
            print(f'  {count["n"]}/{len(todo)} · ok {count["ok"]} · mất file {count["missing"]} · lỗi {count["error"]}', flush=True)
    return st


with ThreadPoolExecutor(a.workers) as ex:
    list(ex.map(work, todo))
f.close()
if count['expired']:
    print(f'\n⚠️  {count["expired"]} link hết hạn. Chạy: python3 ics-grid.py --refresh --sample 1  (để lấy link mới) rồi chạy lại ics-check.py')

rows = list(csv.DictReader(open(res_path, encoding='utf-8')))
miss = [r for r in rows if r['status'] == 'missing']
with open(os.path.join(d, 'broken.csv'), 'w', newline='', encoding='utf-8') as bf:
    bw = csv.writer(bf)
    bw.writerow(['id', 'name', 'status', 'detail'])
    for r in miss:
        bw.writerow([r['id'], r['name'], r['status'], r['detail']])
tot = len(rows)
print(f'\nKết quả: {tot} ảnh đã kiểm tra · còn file {sum(r["status"] == "ok" for r in rows)} · '
      f'MẤT file {len(miss)} · lỗi tạm thời {sum(r["status"] == "error" for r in rows)}')
print('Danh sách ảnh mất file:', os.path.join(d, 'broken.csv'))
