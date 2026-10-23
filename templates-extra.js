// MẪU BỔ SUNG CHỈ CÓ TRÊN WEB (người dùng chốt 23/10: làm thẳng trên web, không qua Figma).
// templates.js do tools/convert.js sinh từ Figma và bị ghi đè mỗi lần chạy lại → mẫu mới để riêng ở file này.
// Mỗi mẫu dùng lại KHUNG của mẫu Figma "Slide/Grammar Rule" (nền brand, header, logo, thẻ trắng) lúc tải trang,
// chỉ thay phần trong thẻ → đổi khung trong Figma thì mẫu mới đổi theo. Màu / chữ / bo góc lấy từ biến brand (tokens.css).
// Đợt 1: Pronunciation Linking (nối âm), Grammar Rule Split (quy tắc 35/65), Dialogue Bubbles (hội thoại bong bóng),
//        Summary Homework (tổng kết + BTVN gộp 1 slide).
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
      div('rule_box', `flex:0 0 35%;align-self:flex-start;display:flex;flex-direction:column;gap:20px;padding:40px;border-radius:16px;background-color:${C.soft};align-items:flex-start`,
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
  root.PLS_TPL_EXTRA = ['Slide/Pronunciation Linking', 'Slide/Grammar Rule Split', 'Slide/Dialogue Bubbles', 'Slide/Summary Homework'];
})(typeof window !== 'undefined' ? window : globalThis);
