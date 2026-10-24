// MẪU BỔ SUNG CHỈ CÓ TRÊN WEB (người dùng chốt 23/10: làm thẳng trên web, không qua Figma).
// templates.js do tools/convert.js sinh từ Figma và bị ghi đè mỗi lần chạy lại → mẫu mới để riêng ở file này.
// Mỗi mẫu dùng lại KHUNG của mẫu Figma "Slide/Grammar Rule" (nền brand, header, logo, thẻ trắng) lúc tải trang,
// chỉ thay phần trong thẻ → đổi khung trong Figma thì mẫu mới đổi theo. Màu / chữ / bo góc lấy từ biến brand (tokens.css).
// Đợt 1: Pronunciation Linking (nối âm), Grammar Rule Split (quy tắc 35/65), Dialogue Bubbles (hội thoại bong bóng),
//        Summary Homework (tổng kết + BTVN gộp 1 slide).
// Đợt 2: Pronunciation Steps (phát âm từng bước), Focus Question (câu hỏi trọng tâm), nhấn cột bảng ngữ pháp, dòng thời gian dọc.
// Đợt 3: Vocab Picture (chữ + minh hoạ lớn), Vocab Map (sơ đồ quan hệ từ: đồng nghĩa / trái nghĩa).
(function (root) {
  'use strict';
  const T = root.PLS_TPL; if (!T || typeof document === 'undefined') return;
  const BASE = T.slides['Slide/Grammar Rule']; if (!BASE) return;

  // ---------- kiểu chữ (giống quy ước của convert.js) ----------
  const FONT = {
    native: "font-family:var(--ff-font-native, 'Montserrat'), sans-serif;font-weight:var(--fw-font-native-bold, 700)",
    body: "font-family:var(--ff-font-body, 'Montserrat'), sans-serif;font-weight:var(--fw-font-body-regular, 400)",
    bold: "font-family:var(--ff-font-body, 'Montserrat'), sans-serif;font-weight:var(--fw-font-body-bold, 700)"
  };
  const BOX = 'box-sizing:border-box;position:relative;';
  // ô chữ: n = tên ô, f = kiểu chữ, fs = cỡ, color, wrap = xuống dòng được
  const txt = (n, f, fs, color, def, wrap, extra) => `<div data-n="${n}" data-text="1" data-fs="${fs}" style="${BOX}flex:0 1 auto;min-width:0;${FONT[f]};font-size:${fs}px;line-height:1.35;text-align:left;color:${color};white-space:${wrap ? 'pre-wrap' : 'pre'};overflow-wrap:normal;word-break:keep-all;${extra || ''}">${def}</div>`;
  const div = (n, style, inner) => `<div data-n="${n}" style="${BOX}${style}">${inner}</div>`;
  const circle = (n, size, bg, color, def) => div(n, `flex:0 0 auto;width:${size}px;height:${size}px;display:flex;flex-direction:row;justify-content:center;align-items:center;border-radius:50%;background-color:${bg}`,
    txt('no', 'bold', Math.round(size * 0.5), color, def, false, 'text-align:center;line-height:1'));
  const C = { text: 'var(--color-text, #3d3d3d)', muted: 'var(--color-text-muted, #6d6d6d)', ink: 'var(--color-primary-ink, var(--color-primary, #406864))', primary: 'var(--color-primary, #406864)', fill: 'var(--color-primary-fill, var(--color-primary, #406864))', ondark: 'var(--color-on-dark, #ffffff)',
    soft: 'var(--color-bg-soft, #eceff1)', white: 'var(--color-bg, #ffffff)', inv: 'var(--color-text-inverse, #ffffff)', border: 'var(--color-border, #cccccc)', dark: 'var(--color-primary-dark, #142738)', accent: 'var(--color-accent, #ffe049)' };
  const range = n => Array.from({ length: n }, (_, i) => i + 1);

  // ---------- khung: lấy mẫu Grammar Rule, đổi tên, thay nội dung thẻ trắng ----------
  function build(name, inner, cardStyle) {
    const tpl = document.createElement('template'); tpl.innerHTML = BASE.html;
    const rootEl = tpl.content.firstElementChild; rootEl.dataset.n = name;
    const card = rootEl.querySelector('[data-n="card"]'); const title = card.querySelector('[data-n="title"]');
    card.innerHTML = ''; if (title && !/notitle/.test(cardStyle || '')) card.appendChild(title);
    card.insertAdjacentHTML('beforeend', inner);
    if (cardStyle) card.setAttribute('style', card.getAttribute('style') + ';' + cardStyle.replace('notitle', ''));
    T.slides[name] = { w: BASE.w || 1920, h: BASE.h || 1080, html: rootEl.outerHTML, extra: true };
  }

  // 1) NỐI ÂM: trái = quy tắc (nền nhạt), phải = cụm từ có dấu nối ‿ + phiên âm (tối đa 6)
  build('Slide/Pronunciation Linking',
    div('columns', 'flex:1 1 0px;min-height:0;align-self:stretch;display:flex;flex-direction:row;gap:48px;align-items:stretch',
      div('rule_box', `flex:0 0 38%;align-self:flex-start;display:flex;flex-direction:column;gap:20px;padding:40px;border-radius:16px;background-color:${C.soft};align-items:flex-start`,
        txt('label', 'bold', 30, C.ink, 'Quy tắc nối âm', false) + txt('tip', 'body', 36, C.text, 'Phụ âm cuối nối sang nguyên âm đầu của từ sau.', true)) +
      div('examples', 'flex:1 1 0px;min-width:0;display:flex;flex-direction:column;gap:20px;justify-content:flex-start;align-items:stretch',
        range(6).map(i => div(`ex_${i}`, `flex:0 0 auto;display:flex;flex-direction:row;gap:24px;align-items:center;padding:18px 28px;border-radius:16px;box-shadow:inset 0 0 0 1.5px ${C.border};background-color:${C.white}`,
          circle('no_box', 56, C.fill, C.inv, String(i)) + txt('word', 'native', 40.5, C.text, 'an‿uncle', false) + txt('ipa', 'body', 32, C.muted, '/ən ˈʌŋkəl/', false))).join(''))));

  // 2) QUY TẮC 35/65: trái 35 % = ô nền nhạt chứa quy tắc + công thức, phải 65 % = 2–4 ví dụ đánh số
  build('Slide/Grammar Rule Split',
    div('columns', 'flex:1 1 0px;min-height:0;align-self:stretch;display:flex;flex-direction:row;gap:48px;align-items:stretch',
      div('rule_box', `flex:0 0 42%;align-self:flex-start;display:flex;flex-direction:column;gap:20px;padding:40px;border-radius:16px;background-color:${C.soft};align-items:flex-start`,
        txt('label', 'bold', 30, C.ink, 'Quy tắc', false) + txt('rule', 'bold', 36, C.text, 'S + V', true)) +
      div('examples', 'flex:1 1 0px;min-width:0;display:flex;flex-direction:column;gap:32px;justify-content:flex-start;align-items:stretch',
        range(4).map(i => div(`ex_${i}`, 'flex:0 0 auto;display:flex;flex-direction:row;gap:24px;align-items:flex-start',
          circle('no_box', 56, C.fill, C.inv, String(i)) +
          div('body', 'flex:1 1 0px;min-width:0;display:flex;flex-direction:column;gap:6px;align-items:flex-start',
            txt('de', 'native', 40.5, C.text, 'Example sentence.', true) + txt('vi', 'body', 36, C.muted, 'Câu ví dụ.', true)))).join(''))));

  // 3) HỘI THOẠI BONG BÓNG: 2 vai, tối đa 6 câu; vai A bên trái (bong bóng nền nhạt), vai B bên phải (viền màu brand); dải "Làm theo cặp"
  build('Slide/Dialogue Bubbles',
    div('lines', 'flex:1 1 0px;min-height:0;align-self:stretch;display:flex;flex-direction:column;gap:20px;justify-content:flex-start;align-items:stretch',
      range(6).map(i => { const b = i % 2 === 0;
        return div(`line_${i}`, `flex:0 0 auto;display:flex;flex-direction:${b ? 'row-reverse' : 'row'};gap:20px;align-items:flex-start`,
          div('who_box', `flex:0 0 auto;width:72px;height:72px;display:flex;flex-direction:row;justify-content:center;align-items:center;border-radius:50%;background-color:${b ? C.dark : C.fill}`,
            txt('who', 'bold', 30, C.inv, b ? 'B' : 'A', false, 'text-align:center;line-height:1')) +
          div('bubble', `flex:0 1 auto;max-width:72%;min-width:0;display:flex;flex-direction:column;gap:4px;padding:18px 28px;border-radius:16px;align-items:flex-start;${b ? `background-color:${C.white};box-shadow:inset 0 0 0 2px ${C.primary}` : `background-color:${C.soft}`}`,
            txt('de', 'native', 36, C.text, 'Hello!', true) + txt('vi', 'body', 30, C.muted, 'Xin chào!', true)));
      }).join('')) +
    div('pair_box', `flex:0 0 auto;align-self:stretch;display:flex;flex-direction:row;gap:16px;align-items:center;padding:16px 32px;border-radius:16px;background-color:${C.fill}`,
      txt('pair', 'bold', 30, C.inv, 'Làm theo cặp: đọc hội thoại, sau đó đổi vai.', true)), 'gap:24px');

  // 4) TỔNG KẾT + BTVN: trái nền sáng = tổng kết (≤ 4 ý), phải nền màu brand đậm = bài tập về nhà (≤ 3 ý) + hạn nộp
  build('Slide/Summary Homework',
    div('left', 'flex:0 0 58%;display:flex;flex-direction:column;gap:28px;padding:48px;align-items:stretch;justify-content:flex-start',
      txt('title', 'bold', 48, C.ink, 'Tổng kết buổi học', true) +
      div('items', 'flex:0 1 auto;min-height:0;display:flex;flex-direction:column;gap:24px;align-items:stretch',
        range(4).map(i => div(`item_${i}`, 'flex:0 0 auto;display:flex;flex-direction:row;gap:20px;align-items:flex-start',
          circle('no_box', 52, C.fill, C.inv, String(i)) +
          div('body', 'flex:1 1 0px;min-width:0;display:flex;flex-direction:column;gap:4px;align-items:flex-start',
            txt('label', 'bold', 32, C.ink, 'Từ vựng', false) + txt('text', 'body', 32, C.text, 'Nội dung', true)))).join(''))) +
    div('right', `flex:1 1 0px;min-width:0;display:flex;flex-direction:column;gap:24px;padding:48px;align-items:stretch;justify-content:flex-start;background-color:${C.dark}`,
      txt('hw.title', 'bold', 48, C.inv, 'Bài tập về nhà', true) +
      div('hws', 'flex:0 1 auto;min-height:0;display:flex;flex-direction:column;gap:24px;align-items:stretch',
        range(3).map(i => div(`hw_${i}`, 'flex:0 0 auto;display:flex;flex-direction:row;gap:20px;align-items:flex-start',
          circle('no_box', 52, C.ondark, C.dark, String(i)) + txt('text', 'body', 32, C.inv, 'Việc cần làm', true))).join('')) +
      div('deadline_box', 'flex:0 0 auto;display:flex;flex-direction:row;align-items:center;padding:14px 24px;border-radius:16px;background-color:rgba(255,255,255,0.16);align-self:flex-start',
        txt('deadline', 'bold', 30, C.inv, 'Trước buổi sau', false))),
    'notitle;flex-direction:row;padding:0px;gap:0px;overflow:hidden;align-items:stretch');

  // ---------- xử lý sau khi đổ chữ (engine gọi PLS_TPL_HOOKS[mẫu]) ----------
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  root.PLS_TPL_HOOKS = Object.assign(root.PLS_TPL_HOOKS || {}, {
    // dấu nối ‿ và 2 chữ cái được nối: đậm + màu brand (xuất PPTX thành run riêng)
    'Slide/Pronunciation Linking'(rootEl) {
      rootEl.querySelectorAll('[data-n="word"][data-filled]').forEach(te => { const t = te.textContent; if (!t.includes('‿')) return;
        te.innerHTML = esc(t).replace(/(\S)‿(\S)/g, (m, a, b) => `<span data-seg="link" style="font-weight:700;color:var(--color-primary-ink, var(--color-primary))">${a}‿${b}</span>`); });
    }
  });
  // hội thoại: bên trái / phải theo VAI (người nói đầu tiên bên trái), không theo số dòng chẵn lẻ
  root.PLS_TPL_HOOKS['Slide/Dialogue Bubbles'] = function (rootEl) {
    const lines = [...rootEl.querySelectorAll('[data-n^="line_"]')].filter(l => /^line_\d+$/.test(l.dataset.n) && !l.dataset.hid);
    const whoOf = l => ((l.querySelector('[data-n="who"]') || {}).textContent || '').trim(); const first = lines.length ? whoOf(lines[0]) : '';
    lines.forEach(l => { const right = whoOf(l) !== first, wb = l.querySelector('[data-n="who_box"]'), bb = l.querySelector('[data-n="bubble"]');
      l.style.flexDirection = right ? 'row-reverse' : 'row';
      if (wb) wb.style.backgroundColor = right ? C.dark : C.fill;
      if (bb) { bb.style.backgroundColor = right ? C.white : C.soft; bb.style.boxShadow = right ? `inset 0 0 0 2px ${C.primary}` : 'none'; } });
  };

  // ================= ĐỢT 2 =================
  // 5) PHÁT ÂM TỪNG BƯỚC: ví dụ là cụm / câu (ngữ điệu, trọng âm câu, dạng yếu) → 3 thẻ Nghe → Chú ý → Đọc lại + dải "Luyện thêm"
  build('Slide/Pronunciation Steps',
    div('steps', 'flex:0 0 auto;align-self:stretch;display:flex;flex-direction:row;gap:32px;align-items:stretch',
      range(3).map(i => div(`step_${i}`, `flex:1 1 0px;min-width:0;display:flex;flex-direction:column;gap:16px;padding:36px;border-radius:16px;background-color:${C.soft};align-items:flex-start`,
        div('head_row', 'flex:0 0 auto;display:flex;flex-direction:row;gap:16px;align-items:center',
          circle('no_box', 56, C.fill, C.inv, String(i)) + txt('head', 'bold', 36, C.ink, ['Nghe', 'Chú ý', 'Đọc lại'][i - 1], false)) +
        txt('text', i === 1 ? 'native' : 'body', i === 1 ? 40.5 : 34, C.text, 'Nội dung', true) + txt('sub', 'body', 30, C.muted, '', true))).join('')) +
    div('more_box', `flex:0 0 auto;align-self:stretch;display:flex;flex-direction:row;flex-wrap:wrap;gap:16px;align-items:center;padding:20px 28px;border-radius:16px;box-shadow:inset 0 0 0 1.5px ${C.border}`,
      txt('more', 'bold', 30, C.ink, 'Luyện thêm:', false) +
      range(5).map(i => div(`chip_${i}`, `flex:0 0 auto;display:flex;flex-direction:row;align-items:center;padding:10px 22px;border-radius:16px;background-color:${C.soft}`, txt('text', 'native', 32, C.text, 'phrase', false))).join('')), 'gap:36px');

  // 6) CÂU HỎI TRỌNG TÂM: 1 câu hỏi lớn giữa slide + nghĩa + các từ thay thế dạng chip (phần Nói)
  build('Slide/Focus Question',
    div('center', 'flex:1 1 0px;min-height:0;align-self:stretch;display:flex;flex-direction:column;gap:28px;justify-content:center;align-items:center',
      txt('question', 'native', 79.5, C.ink, 'What time is it?', true, 'text-align:center') + txt('question.vi', 'body', 36, C.muted, 'Mấy giờ rồi?', true, 'text-align:center') +
      txt('hint', 'bold', 30, C.text, 'Thay bằng:', false, 'text-align:center') +
      div('chips', 'flex:0 0 auto;align-self:stretch;display:flex;flex-direction:row;flex-wrap:wrap;gap:20px;justify-content:center;align-items:center',
        range(6).map(i => div(`chip_${i}`, `flex:0 0 auto;display:flex;flex-direction:row;align-items:center;padding:14px 28px;border-radius:16px;background-color:${C.white};box-shadow:inset 0 0 0 2px ${C.primary}`, txt('text', 'native', 36, C.text, 'What day is it?', false))).join(''))));

  // ================= ĐỢT 3 =================
  // 7) CHỮ + MINH HOẠ LỚN: 3–5 từ dùng chung 1 ảnh (cột "Hình minh hoạ" giống nhau) → danh sách trái, ảnh lớn phải
  build('Slide/Vocab Picture',
    div('columns', 'flex:1 1 0px;min-height:0;align-self:stretch;display:flex;flex-direction:row;gap:48px;align-items:stretch',
      div('items', 'flex:1 1 0px;min-width:0;display:flex;flex-direction:column;gap:24px;justify-content:center;align-items:stretch',
        range(5).map(i => div(`item_${i}`, 'flex:0 0 auto;display:flex;flex-direction:row;gap:20px;align-items:flex-start',
          circle('no_box', 52, C.fill, C.inv, String(i)) +
          div('body', 'flex:1 1 0px;min-width:0;display:flex;flex-direction:column;gap:2px;align-items:flex-start',
            txt('de', 'native', 40.5, C.text, 'word', true) + txt('vi', 'body', 32, C.muted, 'nghĩa', true)))).join('')) +
      div('img', `flex:0 0 46%;align-self:stretch;border-radius:16px;background-color:${C.soft}`, '')));

  // 8) SƠ ĐỒ QUAN HỆ TỪ: cặp đồng nghĩa (=) / trái nghĩa (≠) trong bài → sơ đồ nối bên trái, khung "Từ khoá" bên phải
  build('Slide/Vocab Map',
    div('columns', 'flex:1 1 0px;min-height:0;align-self:stretch;display:flex;flex-direction:row;gap:48px;align-items:stretch',
      div('map', 'flex:1 1 0px;min-width:0;display:flex;flex-direction:column;gap:22px;justify-content:flex-start;align-items:stretch',
        range(6).map(i => div(`pair_${i}`, 'flex:0 0 auto;display:flex;flex-direction:row;gap:0px;align-items:center',
          div('a_box', `flex:1 1 0px;min-width:0;display:flex;flex-direction:row;justify-content:center;padding:14px 20px;border-radius:16px;background-color:${C.soft}`, txt('a', 'native', 36, C.text, 'happy', false, 'text-align:center')) +
          div('link', 'flex:0 0 120px;height:56px;display:flex;flex-direction:row;justify-content:center;align-items:center',
            `<div data-n="line" style="${BOX}position:absolute;left:0px;top:26px;width:120px;height:4px;background-color:${C.primary}"></div>` +
            div('rel_box', `flex:0 0 auto;width:56px;height:56px;display:flex;flex-direction:row;justify-content:center;align-items:center;border-radius:50%;background-color:${C.fill}`, txt('rel', 'bold', 32, C.inv, '≠', false, 'text-align:center;line-height:1'))) +
          div('b_box', `flex:1 1 0px;min-width:0;display:flex;flex-direction:row;justify-content:center;padding:14px 20px;border-radius:16px;background-color:${C.white};box-shadow:inset 0 0 0 2px ${C.primary}`, txt('b', 'native', 36, C.text, 'unhappy', false, 'text-align:center')))).join('') +
        txt('legend', 'body', 28, C.muted, '=  đồng nghĩa     ≠  trái nghĩa', false)) +
      div('key_box', `flex:0 0 34%;align-self:flex-start;display:flex;flex-direction:column;gap:14px;padding:36px;border-radius:16px;background-color:${C.soft};align-items:flex-start`,
        txt('label', 'bold', 30, C.ink, 'Từ khoá', false) +
        range(8).map(i => div(`kv_${i}`, 'flex:0 0 auto;display:flex;flex-direction:row;gap:12px;align-items:baseline;flex-wrap:wrap', txt('de', 'native', 32, C.text, 'word', false) + txt('vi', 'body', 28, C.muted, 'nghĩa', true))).join(''))));

  // ---------- nâng cấp mẫu Figma có sẵn (không đổi file mẫu, chỉ chỉnh sau khi đổ chữ) ----------
  // Bảng ngữ pháp: tô nhấn cả CỘT TRỌNG TÂM (cột cuối: "Cấu trúc" / "Đúng") – nền nhạt + chữ đậm, ô tiêu đề màu brand
  root.PLS_TPL_HOOKS['Slide/Grammar Table'] = function (rootEl) {
    const rows = [...rootEl.querySelectorAll('[data-n^="row_"]')].filter(r => /^row_\d+$/.test(r.dataset.n) && !r.dataset.hid);
    const cols = rows[0] ? [...rows[0].children].filter(c => /^c\d+_cell$/.test(c.dataset.n || '') && !c.dataset.hid).map(c => c.dataset.n) : [];
    if (cols.length < 2) return; const focus = cols[cols.length - 1];
    rows.forEach((r, i) => { const cell = [...r.children].find(c => c.dataset.n === focus); if (!cell) return;
      if (i === 0) cell.style.backgroundColor = C.fill;
      else { cell.style.backgroundColor = C.soft; const t = cell.querySelector('[data-text]'); if (t) t.style.fontWeight = '700'; } });
  };
  // Mục tiêu & lộ trình: ≤ 5 bước → dòng thời gian dọc (số tròn nối bằng đường kẻ), các bước xếp sát từ trên xuống
  root.PLS_TPL_HOOKS['Slide/Lesson Overview'] = function (rootEl, data) {
    const n = Object.keys(data).filter(k => /^step_\d+\.text$/.test(k) && String(data[k]).trim()).length; if (!n || n > 5) return;
    const box = rootEl.querySelector('[data-n="steps"]'); if (!box) return;
    Object.assign(box.style, { justifyContent: 'flex-start', gap: '28px', rowGap: '28px' });
    for (let i = 1; i <= n; i++) { const st = rootEl.querySelector(`[data-n="step_${i}"]`); if (!st) continue; st.style.alignItems = 'flex-start'; st.style.position = 'relative';
      const nb = st.querySelector(`[data-n="step_${i}.no_box"]`); if (nb) { nb.style.position = 'relative'; nb.style.zIndex = '1'; }
      if (i < n) { const pl = parseFloat(st.style.paddingLeft) || 24, w = nb ? (parseFloat(nb.style.minWidth || nb.style.width) || 56) : 56; st.insertAdjacentHTML('beforeend', `<div data-n="step_${i}.line" data-gapline="1" style="${BOX}position:absolute;left:${pl + w / 2 - 2}px;top:calc(100% + 6px);width:4px;height:16px;background-color:${C.primary};border-radius:2px;z-index:0"></div>`); } }
    // nét nối chỉ nằm trong khe giữa 2 thẻ, căn giữa vòng số: đo lại sau khi slide đã dàn trang (khoảng cách / lề có thể đổi sau hook)
    if (!root.__plsGapLine) { root.__plsGapLine = 1; setInterval(() => document.querySelectorAll('[data-gapline]').forEach(l => { const s = l.parentElement, nx = s && s.nextElementSibling, nbx = s && s.querySelector('[data-n$=".no_box"]'); if (!nbx || !nbx.offsetWidth) return; const L = (nbx.offsetLeft + nbx.offsetWidth / 2 - 2) + 'px'; if (l.style.left !== L) l.style.left = L; if (nx && s.offsetHeight) { const g = nx.offsetTop - s.offsetTop - s.offsetHeight; if (g > 14) { const H = (g - 12) + 'px'; if (l.style.height !== H) l.style.height = H; } } }), 700); }
  };
  root.PLS_TPL_EXTRA = ['Slide/Pronunciation Linking', 'Slide/Grammar Rule Split', 'Slide/Dialogue Bubbles', 'Slide/Summary Homework', 'Slide/Pronunciation Steps', 'Slide/Focus Question', 'Slide/Vocab Picture', 'Slide/Vocab Map'];
})(typeof window !== 'undefined' ? window : globalThis);
