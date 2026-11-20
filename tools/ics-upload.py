#!/usr/bin/env python3
"""
Tải hàng loạt ảnh/âm thanh từ một thư mục trên máy lên Thư viện tài nguyên ICS.

API (lấy từ DevTools):  POST https://icstestsapi.pls.edu.vn/files/upload
                        multipart/form-data: category=KNOWLEDGE_MEDIA, file=<binary>

Cách dùng (macOS / Linux):
    export ICS_TOKEN='giá trị Authorization, bỏ chữ Bearer'      # hoặc ICS_COOKIE='...'
    python3 ics-upload.py ~/Downloads/ChauA
    python3 ics-upload.py ~/Downloads/ChauAu

Windows (PowerShell):
    $env:ICS_TOKEN = '...'
    python ics-upload.py C:\\Users\\...\\ChauA

Tuỳ chọn:
    --dry-run        chỉ liệt kê file sẽ tải, không gửi gì
    --limit N        chỉ tải N file đầu (để chạy thử)
    --delay 0.3      nghỉ giữa 2 lần tải (giây)
    --api URL        đổi địa chỉ API (mặc định bản test icstestsapi)

Script ghi nhật ký vào <thư mục>/_ics_upload_log.csv. Chạy lại thì file nào đã
tải thành công sẽ được bỏ qua, nên dừng giữa chừng (Ctrl+C) rồi chạy tiếp vẫn an toàn.
Chỉ dùng thư viện chuẩn của Python 3, không cần cài thêm gì.
"""
import argparse, csv, json, unicodedata, mimetypes, os, sys, time, uuid, urllib.request, urllib.error

DEFAULT_API = 'https://icstestsapi.pls.edu.vn/files/upload'
ORIGIN = 'https://icstest.pls.edu.vn'
EXTS = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.mp3': 'audio/mpeg', '.wav': 'audio/wav'}
MAX_BYTES = 20 * 1024 * 1024


def build_multipart(fields, file_field, filename, data, ctype):
    boundary = '----icsupload' + uuid.uuid4().hex
    out = bytearray()
    for k, v in fields.items():
        out += f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
    safe_name = filename.replace('"', "'")
    out += (f'--{boundary}\r\nContent-Disposition: form-data; name="{file_field}"; '
            f'filename="{safe_name}"\r\nContent-Type: {ctype}\r\n\r\n').encode('utf-8')
    out += data + f'\r\n--{boundary}--\r\n'.encode()
    return bytes(out), f'multipart/form-data; boundary={boundary}'


def upload(api, headers, path, category):
    name = os.path.basename(path)
    ctype = EXTS[os.path.splitext(name)[1].lower()]
    with open(path, 'rb') as f:
        body, content_type = build_multipart({'category': category}, 'file', name, f.read(), ctype)
    req = urllib.request.Request(api, data=body, method='POST',
                                 headers=dict(headers, **{'Content-Type': content_type}))
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode('utf-8') or '{}')


def main():
    ap = argparse.ArgumentParser(description='Tải hàng loạt file lên Thư viện tài nguyên ICS')
    ap.add_argument('folder')
    ap.add_argument('--api', default=DEFAULT_API)
    ap.add_argument('--category', default='KNOWLEDGE_MEDIA')
    ap.add_argument('--delay', type=float, default=0.3)
    ap.add_argument('--limit', type=int, default=0)
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()

    token, cookie = os.environ.get('ICS_TOKEN', '').strip(), os.environ.get('ICS_COOKIE', '').strip()
    if token.lower().startswith('bearer '):
        token = token[7:].strip()
    if not (token or cookie or a.dry_run):
        sys.exit('Thiếu ICS_TOKEN (hoặc ICS_COOKIE). Xem hướng dẫn ở đầu file.')
    headers = {'Accept': 'application/json', 'Origin': ORIGIN, 'Referer': ORIGIN + '/'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    if cookie:
        headers['Cookie'] = cookie

    folder = os.path.expanduser(a.folder)
    if not os.path.isdir(folder):
        parent = os.path.dirname(folder.rstrip('/')) or '.'
        key = unicodedata.normalize('NFC', os.path.basename(folder.rstrip('/'))).strip().lower()
        alts = []
        if os.path.isdir(parent):
            alts = [n for n in os.listdir(parent) if os.path.isdir(os.path.join(parent, n))
                    and key[:4] in unicodedata.normalize('NFC', n).lower()]
        msg = f'Không tìm thấy thư mục: {folder!r}'
        if alts:
            msg += '\nCó phải một trong các thư mục này không? (chú ý dấu cách thừa)\n' + \
                   '\n'.join(f'  {os.path.join(parent, n)!r}' for n in alts)
        sys.exit(msg)
    log_path = os.path.join(folder, '_ics_upload_log.csv')
    done = set()
    if os.path.exists(log_path):
        with open(log_path, encoding='utf-8') as f:
            done = {row['relpath'] for row in csv.DictReader(f) if row['status'] == 'ok'}

    files = []
    for root, _, names in os.walk(folder):
        for n in sorted(names):
            if os.path.splitext(n)[1].lower() in EXTS and not n.startswith('.'):
                files.append(os.path.join(root, n))
    todo = [p for p in files if os.path.relpath(p, folder) not in done]
    if a.limit:
        todo = todo[:a.limit]
    print(f'{len(files)} file hợp lệ · {len(files) - len([p for p in files if os.path.relpath(p, folder) not in done])} đã tải trước đó · sẽ tải {len(todo)}')
    if a.dry_run:
        for p in todo[:30]:
            print('  ', os.path.relpath(p, folder))
        return

    new_log = not os.path.exists(log_path)
    ok = fail = 0
    with open(log_path, 'a', newline='', encoding='utf-8') as lf:
        w = csv.writer(lf)
        if new_log:
            w.writerow(['relpath', 'status', 'ics_id', 'message'])
        for i, p in enumerate(todo, 1):
            rel = os.path.relpath(p, folder)
            if os.path.getsize(p) > MAX_BYTES:
                w.writerow([rel, 'skip', '', 'quá 20 MB']); fail += 1
                print(f'[{i}/{len(todo)}] BỎ QUA (>20MB) {rel}'); continue
            print(f'[{i}/{len(todo)}] đang tải {rel} …', flush=True)
            for attempt in range(4):
                try:
                    res = upload(a.api, headers, p, a.category)
                    fid = (res.get('data') or {}).get('id', '')
                    w.writerow([rel, 'ok', fid, '']); ok += 1
                    print(f'[{i}/{len(todo)}] OK {rel}', flush=True)
                    break
                except urllib.error.HTTPError as e:
                    msg = e.read().decode('utf-8', 'replace')[:200]
                    if e.code in (401, 403):
                        lf.flush()
                        sys.exit(f'\nLỗi {e.code}: token hết hạn hoặc sai. Lấy token mới rồi chạy lại '
                                 f'(file đã tải sẽ được bỏ qua).\n{msg}')
                    if e.code < 500 and e.code != 429:
                        w.writerow([rel, 'fail', '', f'{e.code} {msg}']); fail += 1
                        print(f'[{i}/{len(todo)}] LỖI {e.code} {rel}: {msg}'); break
                    err = f'{e.code} {msg}'
                except (urllib.error.URLError, TimeoutError, ConnectionError, OSError) as e:
                    err = str(getattr(e, 'reason', e))
                    if 'CERTIFICATE_VERIFY_FAILED' in err:
                        sys.exit('\nLỗi chứng chỉ SSL của Python trên Mac. Chạy lệnh sau một lần rồi chạy lại script:\n'
                                 '  open "/Applications/Python 3*/Install Certificates.command"\n'
                                 '(hoặc: pip3 install --upgrade certifi)')
                print(f'   … lần {attempt + 1} lỗi: {err} — thử lại', flush=True)
                time.sleep(2 ** attempt * 2)
            else:
                w.writerow([rel, 'fail', '', err]); fail += 1
                print(f'[{i}/{len(todo)}] LỖI {rel}: {err}')
            lf.flush()
            time.sleep(a.delay)
    print(f'\nXong: {ok} thành công, {fail} lỗi/bỏ qua. Nhật ký: {log_path}')


if __name__ == '__main__':
    main()
