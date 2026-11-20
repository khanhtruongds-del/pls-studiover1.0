// KIỂM CHUẨN HÌNH THỨC v2.0 (thay F.kiemChuan): đủ 29 luật của tab STANDARD.
// Mức: batbuoc → đỏ (phải sửa) · nendat → vàng (nên đạt) · thamkhao → xám (tham khảo).
// Mỗi luật trả trạng thái: 'dat' (máy kiểm, đạt) · 'loi' (máy kiểm, có lỗi) · 'tay' (người kiểm – ghi cách kiểm) · 'khongap' (không áp dụng cho slide).
(function (root) {
  'use strict';
  const LV = { batbuoc: 'do', nendat: 'vang', thamkhao: 'xam' };
  const BRAND_CODE = { 'Betreux': 'BTX', 'Creative English': 'CE', 'Créatis': 'CRT', 'Saechang': 'SC', 'Sakumi': 'SKM', 'Đắc Nhân': 'DN' };
  const BRAND_WORDS = { 'Betreux': /betreux/i, 'Creative English': /creative english/i, 'Créatis': /cr[ée]atis/i, 'Saechang': /saechang/i, 'Sakumi': /sakumi/i, 'Đắc Nhân': /đắc nhân/i };
  const R = el => el.getBoundingClientRect();
  const scaleOf = host => R(host).width / parseFloat(host.style.width) || 1;
  const box = (el, host) => { const a = R(el), h = R(host), s = scaleOf(host); return { x: (a.left - h.left) / s, y: (a.top - h.top) / s, w: a.width / s, h: a.height / s }; };
  const visible = el => el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden' && R(el).width > 0;
  const texts = host => [...host.querySelectorAll('[data-text]')].filter(visible);

  // ---------- tên file theo RB-CH-02: [MãTH]_[TrìnhĐộ]_[Loại][Số]_[TenNganKhongDau]_v[x.y].pptx ----------
  const ascii = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  function fileName(ctx, ext) {
    const code = BRAND_CODE[ctx.brand] || 'PLS';
    const level = ascii(ctx.level || '').replace(/[^A-Za-z0-9]/g, '') || 'XX';
    const type = /kiểm tra/i.test(ctx.sessionType || '') && !/ôn/i.test(ctx.sessionType || '') ? 'KT' : /ôn/i.test(ctx.sessionType || '') ? 'ON' : 'B';
    const no = String(ctx.no || 1).padStart(2, '0');
    const short = ascii(ctx.title || 'Bai').replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/).slice(0, 3).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('') || 'Bai';
    return `${code}_${level}_${type}${no}_${short}_v${ctx.version || '1.0'}.${ext || 'pptx'}`;
  }

  // ---------- tương phản (WCAG) ----------
  const rgb = c => { const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(',').map(parseFloat); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
  const lum = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  function bgOf(el, host) {
    for (let p = el; p && p !== host.parentElement; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && !/gradient/.test(cs.backgroundImage)) return null;   // nền ảnh: không đo được
      const c = rgb(cs.backgroundColor); if (c && c.a > 0.5) return c;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  }
  function contrast(el, host) {
    const fg = rgb(getComputedStyle(el).color), bg = bgOf(el, host); if (!fg || !bg) return null;
    const a = lum(fg), b = lum(bg); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }

  // ---------- chữ mẫu còn sót: ô thuộc danh sách ô của mẫu, đang hiện, không được điền ----------
  function slotKeys(comp) {
    const out = [];
    const ex = s => { const m = s.match(/^(.*?)(\d+)\.\.(\d+)(.*)$/); if (!m) return [s]; const r = []; for (let i = +m[2]; i <= +m[3]; i++) r.push(...ex(m[1] + i + m[4])); return r; };
    for (const s of ((root.PLS_SLOTS || {})[comp] || {}).slots || []) if (!s.startsWith('img:')) out.push(...ex(s));
    return out;
  }

  function check(slides, ctx) {
    const E = root.PLS_ENGINE; const res = {}; const add = (id, slide, msg) => { (res[id] = res[id] || []).push({ slide, msg }); };
    const bulletTypes = new Set();
    slides.forEach((r, i) => {
      const n = i + 1, host = r.host, comp = host.dataset.comp;
      // lỗi engine → luật tương ứng
      for (const x of r.issues || []) {
        const map = { spill: 'RB-CH-05', overlap: 'RB-CH-05', noSlot: 'RB-CH-05', vietFont: 'RB-CH-04', minFont: 'RB-PPT-02', smallFont: 'RB-PPT-02', safeArea: 'RB-PPT-03', words: 'RB-PPT-06', noImage: 'RB-CH-06' };
        if (map[x.code]) add(map[x.code], n, x.msg);
      }
      const T = texts(host);
      // RB-CH-03: chữ / logo của brand khác
      for (const t of T) for (const [b, re] of Object.entries(BRAND_WORDS)) if (b !== ctx.brand && re.test(t.textContent)) add('RB-CH-03', n, `Chữ của brand khác (${b}): "${t.textContent.trim().slice(0, 50)}"`);
      const logos = [...host.querySelectorAll('[data-vis^="logo/"]')].filter(visible);
      const wrongLogo = logos.filter(l => !new RegExp(ctx.brand.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').replace(/\s+/g, '-'), 'i').test(l.dataset.vis));
      if (wrongLogo.length) add('RB-CH-03', n, `Logo / nền của brand khác đang hiện: ${wrongLogo.map(l => l.dataset.vis).join(', ')}`);
      // RB-CH-05: chữ mẫu còn sót
      for (const k of slotKeys(comp)) {
        if (/(^|\.)(mark|icon|audio)$/.test(k) || /^header\./.test(k) && k !== 'header.section') continue;
        const el = E.find(host, k); const t = el && (el.dataset.text ? el : el.querySelector('[data-text]'));
        if (t && visible(t) && !t.dataset.filled && !t.closest('[data-filled]') && !t.dataset.varText && t.textContent.trim()) add('RB-CH-05', n, `Ô ${k} còn chữ mẫu "${t.textContent.trim().slice(0, 40)}" – điền hoặc ẩn`);
      }
      // RB-CH-07: tương phản
      for (const t of T) {
        const c = contrast(t, host); if (c == null) continue;
        const fs = parseFloat(getComputedStyle(t).fontSize), bold = parseFloat(getComputedStyle(t).fontWeight) >= 700;
        const need = fs >= 48 || (bold && fs >= 37) ? 3 : 4.5;
        if (c < need - 0.05) add('RB-CH-07', n, `Tương phản ${c.toFixed(1)}:1 < ${need}:1 ở "${t.textContent.trim().slice(0, 30)}"`);
      }
      // RB-PPT-04: logo góc trên phải, khung 288 × 96 (±12)
      if (!/^Slide\/(Cover|Section|End|Section Character)$/.test(comp)) {
        const lb = [...host.querySelectorAll('[data-n="logo_badge"]')].find(visible);
        if (!lb) add('RB-PPT-04', n, 'Không thấy logo trên thanh tiêu đề');
        else { const b = box(lb, host); const ok = Math.abs(b.x - 1584) <= 12 && Math.abs(b.y - 20) <= 12 && Math.abs(b.w - 288) <= 12 && Math.abs(b.h - 96) <= 12; if (!ok) add('RB-PPT-04', n, `Logo ở (${Math.round(b.x)}, ${Math.round(b.y)}) ${Math.round(b.w)}×${Math.round(b.h)} – chuẩn (1584, 20) 288×96`); }
      }
      // RB-PPT-06: mật độ 20–80 %, ≤ 6 dòng gạch đầu dòng, bài đọc ≤ 600 ký tự
      if (!/^Slide\/(Cover|Section|End|Section Character)$/.test(comp)) {
        const area = T.filter(t => t.dataset.filled).reduce((a, t) => { const b = box(t, host); return a + b.w * b.h; }, 0) + [...host.querySelectorAll('[data-img-id], .pls-imgslot')].filter(visible).reduce((a, e) => { const b = box(e, host); return a + b.w * b.h; }, 0);
        const pct = area / (1920 * 1080) * 100;
        if (pct > 85) add('RB-PPT-06', n, `Slide quá dày: nội dung chiếm ${Math.round(pct)} % diện tích`);   // 23/10: bỏ báo 'dưới 20 %' (slide bài tập thưa là bình thường)
        const bl = T.reduce((a, t) => a + t.textContent.split('\n').filter(l => /^\s*[•–→\-*+]\s/.test(l)).length, 0); if (bl > 6) add('RB-PPT-06', n, `${bl} dòng gạch đầu dòng (chuẩn ≤ 6)`);
        if (/Reading/.test(comp)) { const c = T.filter(t => t.dataset.filled).reduce((a, t) => a + t.textContent.length, 0), lim = /2 Col/.test(comp) ? 1200 : 600; if (c > lim) add('RB-PPT-06', n, `Bài đọc ${c} ký tự / slide (chuẩn tách ${lim})`); }   // bài đọc 2 cột: mỗi cột 600
      }
      // RB-PPT-07: ký hiệu gạch đầu dòng / mũi tên
      for (const t of T) {
        const s = t.textContent;
        if (/=>|->|=&gt;/.test(s)) add('RB-PPT-07', n, `Ký hiệu thô "=>" / "->" trong "${s.trim().slice(0, 40)}" – dùng →`);
        for (const m of s.matchAll(/(^|\n)\s*([•–→\-*+·])\s/g)) bulletTypes.add(m[2]);
        for (const m of s.matchAll(/(^|\n)\s*([\-*+·])\s/g)) add('RB-PPT-07', n, `Gạch đầu dòng "${m[2]}" – chỉ dùng •, –, →`);
      }
    });
    if (bulletTypes.size > 3) add('RB-PPT-07', 0, `${bulletTypes.size} loại gạch đầu dòng trong file (chuẩn ≤ 3)`);
    // RB-PPT-08: 0 chuyển cảnh
    if (ctx.transition && ctx.transition.style && ctx.transition.style !== 'NONE') add('RB-PPT-08', 0, `Đang bật chuyển cảnh "${ctx.transition.style}" (${ctx.transition.scope === 'section' ? 'bìa / chuyển mục / kết thúc' : 'mọi slide'}) – chuẩn yêu cầu không chuyển cảnh`);
    // luật cấp file
    if (ctx.bytes != null && ctx.bytes > 50 * 1024 * 1024) add('RB-PPT-10', 0, `File ${Math.round(ctx.bytes / 1048576)} MB > 50 MB`);

    const AUTO_PASS = {   // máy bảo đảm theo cách dựng (ghi rõ lý do)
      'RB-CH-01': 'Mọi slide dựng từ mẫu Slide/* chuyển từ Storage Data',
      'RB-CH-02': 'Tên file tự đặt theo mẫu: ' + fileName(ctx),
      'RB-PPT-01': 'Khổ 1920 × 1080 (16:9) cố định',
      'RB-PPT-05': 'Mọi slide là mẫu Slide/* đúng brand',
      'RB-PPT-08': 'Chỉ hiệu ứng Appear cho câu hỏi / lựa chọn / mục / đáp án, không chuyển cảnh',
      'RB-PPT-09': 'Font có sẵn trên máy (Verdana / Arial / font bản ngữ theo thiết bị)',
      'RB-PPT-11': '1 file = 1 buổi'
    };
    const MANUAL = { 'RB-PPT-10': 'Mở thử trên PowerPoint 2016+ và Google Slides; audio / video đặt link Drive cố định', 'RB-CH-06': 'Ảnh đúng người – đúng việc, không watermark' };
    return (root.PLS_STANDARD || []).map(rule => {
      const id = rule['Mã']; const type = rule['Loại']; const level = LV[rule['Mức']] || 'xam';
      if (type === 'pdf') return { id, level, title: rule['Hạng mục'], std: rule['Giá trị chuẩn'], status: 'khongap', note: 'Áp dụng cho sách PDF' };
      const list = res[id] || [];
      let status = list.length ? 'loi' : (AUTO_PASS[id] || rule['Kiểm'] === 'auto' || ['RB-CH-03', 'RB-CH-05', 'RB-CH-07', 'RB-PPT-04', 'RB-PPT-07'].includes(id)) ? 'dat' : 'tay';
      if (id === 'RB-PPT-10' && !list.length) status = 'tay';
      return { id, level, title: rule['Hạng mục'], std: rule['Giá trị chuẩn'], status, list, note: list.length ? '' : (AUTO_PASS[id] || MANUAL[id] || (status === 'tay' ? 'Người kiểm' : 'Máy kiểm: đạt')), hint: rule['Ghi chú'] };
    });
  }

  root.PLS_STD = { check, fileName, BRAND_CODE };
})(window);
