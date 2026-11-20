#!/usr/bin/env python3
"""
Lấy danh sách hình cũ trên ICS (tên bắt đầu bằng 'vocabulary'), tải ảnh thu nhỏ
và ghép thành các tấm lưới (30 ảnh/tấm, kèm số hiệu) để xem phong cách.
CHỈ ĐỌC: không sửa, không xoá gì trên ICS.

Cài một lần:   pip3 install pillow
Dùng:
    export ICS_TOKEN='...'
    python3 ics-grid.py                 # lấy mẫu 12 tấm rải đều (nhanh)
    python3 ics-grid.py --sample 20     # lấy mẫu 20 tấm
    python3 ics-grid.py --all           # tất cả (~135 tấm, tải ~4000 ảnh)

Kết quả nằm ở ~/Downloads/ics-grid/ :
    index.json, index.csv   danh sách đầy đủ (tên, từ khoá, mô tả, trung tâm)
    sheets/sheet_XXX.jpg    các tấm lưới, kéo vài tấm vào chat để xem
Hết token giữa chừng thì script hỏi 'Token mới:' rồi chạy tiếp.
"""
import argparse, csv, getpass, io, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit('Thiếu Pillow. Chạy một lần:  pip3 install pillow')

ORIGIN = 'https://icstest.pls.edu.vn'
COLS, ROWS = 6, 5
CELL_W, CELL_H, LABEL_H, HEAD_H = 220, 220, 30, 34
IMG_EXT = ('png', 'jpg', 'jpeg', 'webp')


class Client:
    def __init__(self, token, delay):
        self.token, self.delay = token, delay

    def headers(self):
        return {'Authorization': 'Bearer ' + self.token, 'Accept': '*/*',
                'Origin': ORIGIN, 'Referer': ORIGIN + '/'}

    def ask_token(self, why):
        print(f'\n⚠️  {why}', flush=True)
        print('Lấy token mới (tải 1 ảnh bất kỳ lên ICS, copy dòng authorization), dán vào đây rồi Enter.')
        print('(Chữ không hiện khi dán — bình thường. Để trống + Enter để thoát.)')
        try:
            t = getpass.getpass('Token mới: ').strip()
        except (EOFError, KeyboardInterrupt):
            t = ''
        if not t:
            sys.exit('Đã dừng. Chạy lại lệnh cũ (dữ liệu đã tải được giữ lại).')
        self.token = t[7:].strip() if t.lower().startswith('bearer ') else t
        print('Đã cập nhật token — chạy tiếp.\n', flush=True)

    def fetch(self, url):
        attempt = 0
        while True:
            try:
                req = urllib.request.Request(url, headers=self.headers())
                with urllib.request.urlopen(req, timeout=60) as r:
                    data = r.read()
                time.sleep(self.delay)
                return data
            except urllib.error.HTTPError as e:
                body = e.read().decode('utf-8', 'replace')[:160]
                if e.code in (401, 403):
                    self.ask_token(f'Lỗi {e.code}: token hết hạn hoặc sai. {body}')
                    continue
                if e.code == 404:
                    raise
                err = f'{e.code} {body}'
            except (urllib.error.URLError, TimeoutError, ConnectionError, OSError) as e:
                err = str(getattr(e, 'reason', e))
                if 'CERTIFICATE_VERIFY_FAILED' in err:
                    sys.exit('Lỗi chứng chỉ SSL của Python trên Mac. Chạy:\n'
                             '  open /Applications/Python\\ 3*/Install\\ Certificates.command')
            attempt += 1
            if attempt >= 4:
                raise RuntimeError(err)
            print(f'   … lỗi: {err} — thử lại', flush=True)
            time.sleep(2 ** attempt)


def natural_key(it):
    nums = re.findall(r'\d+', it.get('name', ''))
    return (int(nums[-1]) if nums else 0, it.get('name', ''))


def list_all(cl, api, category, q):
    items, page, total_pages = [], 1, None
    while True:
        params = {'category': category, 'page': page, 'limit': 100, 'per_page': 100, 'q': q}
        data = json.loads(cl.fetch(f'{api}/files/list-files?' + urllib.parse.urlencode(params)))
        items += data.get('data') or []
        meta = data.get('meta') or {}
        total_pages = meta.get('total_pages') or total_pages or 1
        print(f'  danh sách: trang {page}/{total_pages} · {len(items)} mục', flush=True)
        if page >= total_pages:
            return items
        page += 1


def load_font(size):
    for p in ('/System/Library/Fonts/Supplemental/Arial.ttf', '/System/Library/Fonts/Helvetica.ttc',
              '/Library/Fonts/Arial.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except OSError:
                pass
    return ImageFont.load_default()


def to_rgb(raw):
    im = Image.open(io.BytesIO(raw))
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA')
        bg = Image.new('RGB', im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        return bg
    return im.convert('RGB')


def short(name):
    base = os.path.splitext(name)[0]
    return re.sub(r'^vocabulary_\d+_', '', base)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default='~/Downloads/ics-grid')
    ap.add_argument('--api', default=os.environ.get('ICS_API', 'https://icstestsapi.pls.edu.vn'))
    ap.add_argument('--category', default='KNOWLEDGE_MEDIA')
    ap.add_argument('--q', default='vocabulary', help='từ khoá tìm trên ICS')
    ap.add_argument('--sample', type=int, default=12, help='số tấm lưới lấy mẫu rải đều')
    ap.add_argument('--all', action='store_true')
    ap.add_argument('--refresh', action='store_true', help='lấy lại danh sách từ ICS')
    ap.add_argument('--delay', type=float, default=0.1)
    a = ap.parse_args()

    tok = os.environ.get('ICS_TOKEN', '').strip()
    tok = tok[7:].strip() if tok.lower().startswith('bearer ') else tok
    if not tok:
        sys.exit('Thiếu ICS_TOKEN (export ICS_TOKEN=...)')
    cl = Client(tok, a.delay)

    out = os.path.expanduser(a.out)
    os.makedirs(os.path.join(out, 'thumbs'), exist_ok=True)
    os.makedirs(os.path.join(out, 'sheets'), exist_ok=True)
    idx_path = os.path.join(out, 'index.json')

    if os.path.exists(idx_path) and not a.refresh:
        items = json.load(open(idx_path, encoding='utf-8'))
        print(f'Dùng danh sách đã lưu: {len(items)} ảnh (thêm --refresh để lấy lại).')
    else:
        print('Đang lấy danh sách từ ICS …')
        raw = list_all(cl, a.api, a.category, a.q)
        items = [x for x in raw
                 if (x.get('file_type') or '').lower() in IMG_EXT
                 and not re.match(r'^CAU? - ', x.get('name', ''))]
        items.sort(key=natural_key)
        slim = [{'id': x['id'], 'name': x['name'], 'size': x.get('size'),
                 'keywords': x.get('keywords') or [], 'description': x.get('description'),
                 'centers': [c.get('title') for c in (x.get('centers') or [])],
                 'thumbnail': x.get('thumbnail'), 'link': x.get('link')} for x in items]
        items = slim
        json.dump(items, open(idx_path, 'w', encoding='utf-8'), ensure_ascii=False)
        with open(os.path.join(out, 'index.csv'), 'w', newline='', encoding='utf-8') as f:
            w = csv.writer(f)
            w.writerow(['id', 'name', 'size', 'keywords', 'description', 'centers'])
            for x in items:
                w.writerow([x['id'], x['name'], x['size'], ';'.join(x['keywords']),
                            x['description'] or '', ';'.join(x['centers'])])
        print(f'Đã lưu danh sách: {len(items)} ảnh (không tính file âm thanh, không tính CA/CAU).')
        # link/thumbnail hết hạn sau ~4 giờ; nếu chạy lại sau đó dùng --refresh

    per = COLS * ROWS
    nsheets = (len(items) + per - 1) // per
    if a.all or a.sample >= nsheets:
        chosen = list(range(nsheets))
    else:
        k = max(a.sample, 1)
        chosen = sorted({round(i * (nsheets - 1) / max(k - 1, 1)) for i in range(k)})
    print(f'{len(items)} ảnh → {nsheets} tấm lưới; sẽ làm {len(chosen)} tấm.')

    font, hfont = load_font(18), load_font(18)
    for n, si in enumerate(chosen, 1):
        batch = items[si * per:(si + 1) * per]
        W, H = COLS * CELL_W, HEAD_H + ROWS * (CELL_H + LABEL_H)
        sheet = Image.new('RGB', (W, H), (245, 245, 245))
        d = ImageDraw.Draw(sheet)
        d.text((8, 7), f'Tấm {si + 1}/{nsheets} · ảnh {si * per + 1}–{si * per + len(batch)} · '
                       f'mã ghi dưới mỗi ảnh là số cuối của tên file', fill=(60, 60, 60), font=hfont)
        for i, it in enumerate(batch):
            tp = os.path.join(out, 'thumbs', it['id'] + '.bin')
            try:
                if not os.path.exists(tp):
                    url = it.get('thumbnail') or it.get('link')
                    open(tp, 'wb').write(cl.fetch(url))
                im = to_rgb(open(tp, 'rb').read())
                im.thumbnail((CELL_W - 10, CELL_H - 10))
            except Exception as e:
                im = Image.new('RGB', (CELL_W - 10, CELL_H - 10), (255, 220, 220))
                ImageDraw.Draw(im).text((10, 10), 'lỗi tải', fill=(150, 0, 0), font=font)
                print(f'   ! {it["name"]}: {e}', flush=True)
            x0, y0 = (i % COLS) * CELL_W, HEAD_H + (i // COLS) * (CELL_H + LABEL_H)
            sheet.paste(im, (x0 + (CELL_W - im.width) // 2, y0 + (CELL_H - im.height) // 2))
            d.text((x0 + 8, y0 + CELL_H + 4), short(it['name']), fill=(0, 0, 0), font=font)
        p = os.path.join(out, 'sheets', f'sheet_{si + 1:03d}.jpg')
        sheet.save(p, quality=85)
        print(f'[{n}/{len(chosen)}] đã tạo {p}', flush=True)

    print(f'\nXong. Mở thư mục {os.path.join(out, "sheets")}, kéo vài tấm vào chat cho Claude xem.')


if __name__ == '__main__':
    main()
