#!/usr/bin/env python3
"""
Chẩn đoán vì sao một số ảnh tải về bị 404 (CHỈ ĐỌC). Che token và chữ ký.

    export ICS_TOKEN='...'
    python3 ics-diag.py                       # thử 3 ảnh lỗi mặc định
    python3 ics-diag.py vocabulary_1114102003_1.png
Cần đã chạy ics-grid.py trước (để có ~/Downloads/ics-grid/index.json).
"""
import json, os, sys, urllib.error, urllib.parse, urllib.request

ORIGIN = 'https://icstest.pls.edu.vn'
tok = os.environ.get('ICS_TOKEN', '').strip()
tok = tok[7:].strip() if tok.lower().startswith('bearer ') else tok
if not tok:
    sys.exit('Thiếu ICS_TOKEN')
items = json.load(open(os.path.expanduser('~/Downloads/ics-grid/index.json'), encoding='utf-8'))
by = {x['name']: x for x in items}
names = sys.argv[1:] or ['vocabulary_1114102003_1.png', 'vocabulary_1114102003_2.png', 'vocabulary_1114102003_3.png']


def show(url):
    u = urllib.parse.urlparse(url)
    q = urllib.parse.parse_qs(u.query)
    return f'{u.scheme}://{u.netloc}{u.path}  tham số: {sorted(q.keys())}'


def try_get(label, url, auth):
    h = {'Accept': '*/*', 'Origin': ORIGIN, 'Referer': ORIGIN + '/'}
    if auth:
        h['Authorization'] = 'Bearer ' + tok
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=60) as r:
            b = r.read()
            print(f'   {label} (auth={auth}) -> {r.status}, {r.headers.get("Content-Type")}, {len(b)} byte, đầu: {b[:8]!r}')
    except urllib.error.HTTPError as e:
        print(f'   {label} (auth={auth}) -> {e.code}: {e.read().decode("utf-8", "replace")[:160]}')
    except Exception as e:
        print(f'   {label} (auth={auth}) -> lỗi {e}')


for n in names:
    it = by.get(n)
    print('=' * 70)
    if not it:
        print(n, '-> không có trong index.json'); continue
    print(n, '| id', it['id'], '| size', it.get('size'))
    for key in ('link', 'thumbnail'):
        if it.get(key):
            print(' ', key + ':', show(it[key]))
            for auth in (False, True):
                try_get(key, it[key], auth)
    # thử đường dẫn khác theo id
    base = 'https://icstestsapi.pls.edu.vn/files'
    for path in (f'/{it["id"]}', f'/{it["id"]}/download', f'/download/{it["id"]}'):
        try_get('thử ' + path, base + path, True)
