#!/usr/bin/env python3
"""
Phân loại bản ghi trùng / hỏng từ kết quả ics-check.py. CHỈ ĐỌC file trên máy, KHÔNG đụng tới ICS.
Dùng:  python3 ics-dups.py
Cần có ~/Downloads/ics-grid/index.json và check_results.csv (do ics-grid.py và ics-check.py tạo).
Tạo trong cùng thư mục:
  safe_to_delete.csv    bản HỎNG mà còn một bản LÀNH cùng tên  (đề xuất xoá)
  broken_no_twin.csv    bản HỎNG, không có bản lành cùng tên   (KHÔNG xoá, cần tải lại ảnh)
  dup_both_ok.csv       tên bị trùng nhưng các bản đều lành
"""
import argparse, collections, csv, json, os, sys

ap = argparse.ArgumentParser()
ap.add_argument('--dir', default='~/Downloads/ics-grid')
a = ap.parse_args()
d = os.path.expanduser(a.dir)
items = json.load(open(os.path.join(d, 'index.json'), encoding='utf-8'))
chk_path = os.path.join(d, 'check_results.csv')
if not os.path.exists(chk_path):
    sys.exit('Chưa có check_results.csv. Chạy ics-check.py trước.')
status = {r['id']: r['status'] for r in csv.DictReader(open(chk_path, encoding='utf-8'))}

by_name = collections.defaultdict(list)
for it in items:
    by_name[it['name']].append(it)

safe, no_twin, both_ok = [], [], []
unchecked = 0
for name, group in by_name.items():
    st = [status.get(g['id']) for g in group]
    if None in st:
        unchecked += sum(s is None for s in st)
    good = [g for g, s in zip(group, st) if s == 'ok']
    bad = [g for g, s in zip(group, st) if s == 'missing']
    for g in bad:
        row = [g['id'], g['name'], g.get('size'), ';'.join(g.get('keywords') or []),
               g.get('description') or '', ';'.join(g.get('centers') or []),
               ' '.join(x['id'] for x in good)]
        (safe if good else no_twin).append(row)
    if len(group) > 1 and not bad:
        for g in group:
            both_ok.append([g['id'], g['name'], g.get('size'), len(group)])

H = ['id', 'name', 'size', 'keywords', 'description', 'centers', 'ban_lanh_cung_ten']
for fn, rows, head in (('safe_to_delete.csv', safe, H), ('broken_no_twin.csv', no_twin, H),
                       ('dup_both_ok.csv', both_ok, ['id', 'name', 'size', 'so_ban'])):
    with open(os.path.join(d, fn), 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(head)
        w.writerows(rows)

dups = sum(1 for g in by_name.values() if len(g) > 1)
print(f'Tổng {len(items)} ảnh · {dups} tên bị trùng (nhiều hơn 1 bản ghi)')
print(f'  HỎNG và có bản lành cùng tên (đề xuất xoá): {len(safe)}  -> safe_to_delete.csv')
print(f'  HỎNG nhưng KHÔNG có bản lành (giữ lại):      {len(no_twin)}  -> broken_no_twin.csv')
print(f'  Trùng tên, đều lành:                         {len(both_ok)}  -> dup_both_ok.csv')
if unchecked:
    print(f'  ⚠️  {unchecked} ảnh chưa kiểm tra (link hết hạn?). Chạy lại ics-check.py.')
print('Thư mục:', d)
