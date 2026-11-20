import csv, json, os, re, sys
d = os.path.expanduser(sys.argv[1] if len(sys.argv) > 1 else '~/Downloads/ics-grid')
items = json.load(open(os.path.join(d, 'index.json'), encoding='utf-8'))
chk = os.path.join(d, 'check_results.csv')
bad = set()
if os.path.exists(chk):
    bad = {r['id'] for r in csv.DictReader(open(chk, encoding='utf-8')) if r['status'] == 'missing'}
else:
    print('⚠️  Chưa có check_results.csv: danh sách này còn lẫn ảnh hỏng.')
ok = [x for x in items if x['id'] not in bad]


def key(x):
    n = re.findall(r'\d+', x['name'])
    return (int(n[-1]) if n else 0, x['name'])


ok.sort(key=key)
out = os.path.join(d, 'hinh_cu_sach.csv')
with open(out, 'w', newline='', encoding='utf-8-sig') as f:   # utf-8-sig để Excel/Numbers đọc đúng tiếng Việt
    w = csv.writer(f)
    w.writerow(['stt', 'ten_file', 'id', 'dung_luong', 'tu_khoa', 'mo_ta', 'trung_tam', 'co_mo_ta', 'phong_cach'])
    for i, x in enumerate(ok, 1):
        kw, ds = '; '.join(x.get('keywords') or []), (x.get('description') or '').strip()
        w.writerow([i, x['name'], x['id'], x.get('size'), kw, ds, '; '.join(x.get('centers') or []),
                    'có' if (kw or ds) else 'chưa', ''])
n_desc = sum(1 for x in ok if (x.get('description') or '').strip())
n_kw = sum(1 for x in ok if x.get('keywords'))
n_ctr = sum(1 for x in ok if x.get('centers'))
print(f'Hình cũ còn dùng được: {len(ok)} (đã bỏ {len(items) - len(ok)} bản hỏng)')
print(f'  có mô tả: {n_desc} · có từ khoá: {n_kw} · đã gán trung tâm: {n_ctr}')
print(f'  chưa có mô tả: {len(ok) - n_desc}')
print('File:', out)
