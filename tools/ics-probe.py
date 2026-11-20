#!/usr/bin/env python3
"""
Thăm dò API danh sách file của ICS (CHỈ ĐỌC, không sửa gì).
In ra cấu trúc dữ liệu và cách phân trang, đã che token và link ảnh.

    export ICS_TOKEN='...'
    python3 ics-probe.py
Rồi copy toàn bộ kết quả in ra dán vào chat.
"""
import json, os, re, sys, urllib.request, urllib.error, urllib.parse

BASE = os.environ.get('ICS_API', 'https://icstestsapi.pls.edu.vn')
ORIGIN = 'https://icstest.pls.edu.vn'
tok = os.environ.get('ICS_TOKEN', '').strip()
if tok.lower().startswith('bearer '):
    tok = tok[7:].strip()
if not tok:
    sys.exit('Thiếu ICS_TOKEN (export ICS_TOKEN=...)')
H = {'Authorization': 'Bearer ' + tok, 'Accept': 'application/json', 'Origin': ORIGIN, 'Referer': ORIGIN + '/'}


def mask(v):
    if isinstance(v, str):
        if v.startswith('http'):
            return v.split('?')[0][:70] + ('?<che>' if '?' in v else '')
        return v if len(v) <= 60 else v[:60] + '…'
    if isinstance(v, dict):
        return {k: mask(x) for k, x in v.items()}
    if isinstance(v, list):
        return [mask(x) for x in v[:3]] + (['…%d mục' % len(v)] if len(v) > 3 else [])
    return v


def get(path, params):
    url = BASE + path + '?' + urllib.parse.urlencode(params)
    shown = re.sub(r'(token|key)=[^&]+', r'\1=<che>', url)
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=60) as r:
            return shown, r.status, json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return shown, e.code, e.read().decode('utf-8', 'replace')[:300]
    except Exception as e:
        return shown, 0, str(e)


tries = [
    ('/files/list-files', {'category': 'KNOWLEDGE_MEDIA'}),
    ('/files/list-files', {'category': 'KNOWLEDGE_MEDIA', 'page': 1, 'limit': 5}),
    ('/files/list-files', {'category': 'KNOWLEDGE_MEDIA', 'page': 1, 'page_size': 5}),
    ('/files/list-files', {'category': 'KNOWLEDGE_MEDIA', 'page': 1, 'limit': 5, 'file_type': 'png'}),
    ('/files/list-files', {'category': 'KNOWLEDGE_MEDIA', 'page': 1, 'limit': 5, 'q': 'vocabulary'}),
]
for path, params in tries:
    shown, status, data = get(path, params)
    print('=' * 70)
    print('GET', shown, '->', status)
    if isinstance(data, dict):
        print('khoá cấp 1:', list(data.keys()))
        for k, v in data.items():
            if isinstance(v, list):
                print(f'  [{k}] là danh sách {len(v)} mục; mục đầu:')
                if v:
                    print('   ', json.dumps(mask(v[0]), ensure_ascii=False))
            elif isinstance(v, dict):
                print(f'  [{k}]:', json.dumps(mask(v), ensure_ascii=False)[:600])
            else:
                print(f'  [{k}]:', mask(v))
    else:
        print(data)
