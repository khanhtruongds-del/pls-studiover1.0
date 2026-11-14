// MẪU CHO HOẠT ĐỘNG LỚP (người dùng 28/10 – từ bộ file mẫu Đắc Nhân: Từ vựng HĐ1–3, Mẫu câu, Pinyin, Hán tự…).
// Cùng cách làm với templates-extra.js: lấy KHUNG của mẫu Figma "Slide/Grammar Rule" (nền brand, header, logo, thẻ trắng), chỉ thay phần trong thẻ.
// Quy ước tên lớp để hiệu ứng tự gắn (engine ROLE_RULES): ô "ans…" = đáp án hiện sau khi bấm; "q_n" = câu hỏi; khung "gc_n / tile_n…" không có vai → con bên trong tự xét.
(function (root) {
  'use strict';
  const T = root.PLS_TPL; if (!T || typeof document === 'undefined') return;
  const BASE = T.slides['Slide/Grammar Rule']; if (!BASE) return;
  const FONT = {
    native: "font-family:var(--ff-font-native, 'Montserrat'), sans-serif;font-weight:var(--fw-font-native-bold, 700)",
    body: "font-family:var(--ff-font-body, 'Montserrat'), sans-serif;font-weight:var(--fw-font-body-regular, 400)",
    bold: "font-family:var(--ff-font-body, 'Montserrat'), sans-serif;font-weight:var(--fw-font-body-bold, 700)"
  };
  const BOX = 'box-sizing:border-box;position:relative;';
  const txt = (n, f, fs, color, def, wrap, extra) => `<div data-n="${n}" data-text="1" data-fs="${fs}" style="${BOX}flex:0 1 auto;min-width:0;${FONT[f]};font-size:${fs}px;line-height:1.35;text-align:left;color:${color};white-space:${wrap ? 'pre-wrap' : 'pre'};overflow-wrap:normal;word-break:keep-all;${extra || ''}">${def}</div>`;
  const div = (n, style, inner) => `<div data-n="${n}" style="${BOX}${style}">${inner}</div>`;
  const circle = (n, size, bg, color, def) => div(n, `flex:0 0 auto;width:${size}px;height:${size}px;display:flex;flex-direction:row;justify-content:center;align-items:center;border-radius:50%;background-color:${bg}`,
    txt('no', 'bold', Math.round(size * 0.5), color, def, false, 'text-align:center;line-height:1'));
  const C = { text: 'var(--color-text, #3d3d3d)', muted: 'var(--color-text-muted, #6d6d6d)', ink: 'var(--color-primary-ink, var(--color-primary, #406864))', primary: 'var(--color-primary, #406864)', fill: 'var(--color-primary-fill, var(--color-primary, #406864))',
    soft: 'var(--color-bg-soft, #eceff1)', white: 'var(--color-bg, #ffffff)', inv: 'var(--color-text-inverse, #ffffff)', border: 'var(--color-border, #cccccc)', dark: 'var(--color-primary-dark, #142738)' };
  const range = n => Array.from({ length: n }, (_, i) => i + 1);
  const INS = txt('instruction', 'bold', 32, C.ink, 'Yêu cầu', true);
  function build(name, inner, cardStyle) {
    const tpl = document.createElement('template'); tpl.innerHTML = BASE.html;
    const rootEl = tpl.content.firstElementChild; rootEl.dataset.n = name;
    const card = rootEl.querySelector('[data-n="card"]'); const title = card.querySelector('[data-n="title"]');
    card.innerHTML = ''; if (title && !/notitle/.test(cardStyle || '')) card.appendChild(title);
    card.insertAdjacentHTML('beforeend', inner);
    if (cardStyle) card.setAttribute('style', card.getAttribute('style') + ';' + cardStyle.replace('notitle', ''));
    T.slides[name] = { w: BASE.w || 1920, h: BASE.h || 1080, html: rootEl.outerHTML, extra: true };
  }
  const chip = (n, inner, bg, ring) => div(n, `flex:0 0 auto;display:flex;flex-direction:row;align-items:center;justify-content:center;gap:10px;padding:10px 26px;border-radius:14px;background-color:${bg};${ring ? `box-shadow:inset 0 0 0 2px ${ring}` : ''}`, inner);

  // 1) ĐOÁN NGHĨA: 4 thẻ đánh số, chữ + phiên âm hiện sẵn, NGHĨA hiện khi bấm (HĐ1 từ vựng)
  build('Slide/Guess Cards',
    INS + div('cards', 'flex:1 1 0px;min-height:0;align-self:stretch;display:flex;flex-direction:row;flex-wrap:wrap;gap:32px;align-content:center;justify-content:flex-start;align-items:stretch',
      range(4).map(i => div(`gc_${i}`, `flex:0 0 calc(50% - 16px);display:flex;flex-direction:row;gap:28px;align-items:center;padding:28px 36px;border-radius:20px;background-color:${C.soft}`,
        circle('no_box', 64, C.fill, C.inv, String(i)) +
        div('body', 'flex:1 1 0px;min-width:0;display:flex;flex-direction:column;gap:6px;align-items:flex-start',
          txt('word', 'native', 60, C.text, '高兴', true) + txt('ipa', 'body', 34, C.muted, 'gāoxìng', false) +
          div('ans', `flex:0 0 auto;display:flex;flex-direction:row;align-items:center;padding:8px 22px;margin-top:8px;border-radius:999px;background-color:${C.fill}`, txt('vi', 'bold', 32, C.inv, 'vui, vui mừng', true))))).join('')), 'gap:28px');

  // 2) ĐẶT CÂU VỚI TỪ: từ to + phiên âm + nghĩa; câu mẫu hiện sau (HĐ3 từ vựng)
  build('Slide/Word Sentence',
    INS + div('columns', 'flex:1 1 0px;min-height:0;align-self:stretch;display:flex;flex-direction:row;gap:56px;align-items:center',
      div('word_box', `flex:0 0 40%;align-self:stretch;display:flex;flex-direction:column;gap:14px;justify-content:center;align-items:center;padding:40px;border-radius:24px;background-color:${C.soft}`,
        txt('word', 'native', 110, C.ink, '准备', false, 'text-align:center') + txt('ipa', 'body', 40, C.muted, 'zhǔnbèi', false, 'text-align:center') + txt('mean', 'bold', 40, C.text, 'chuẩn bị', true, 'text-align:center')) +
      div('ans', `flex:1 1 0px;min-width:0;display:flex;flex-direction:column;gap:12px;padding:36px 40px;border-radius:20px;box-shadow:inset 0 0 0 2px ${C.primary};background-color:${C.white};align-items:flex-start`,
        txt('label', 'bold', 28, C.ink, 'Câu mẫu', false) + txt('de', 'native', 48, C.text, '我准备好了。', true) + txt('ipa2', 'body', 32, C.muted, 'Wǒ zhǔnbèi hǎo le.', true) + txt('vi', 'body', 34, C.muted, 'Tôi chuẩn bị xong rồi.', true))), 'gap:28px');

  // 3) TÌNH HUỐNG → MẪU CÂU: câu hỏi tình huống (tiếng Việt) to; mẫu câu trả lời hiện sau (Mẫu câu thông dụng)
  build('Slide/Situation',
    div('q_1', `flex:0 0 auto;align-self:stretch;display:flex;flex-direction:row;gap:24px;align-items:center;padding:32px 40px;border-radius:20px;background-color:${C.soft}`,
      txt('icon', 'bold', 56, C.ink, '?', false, 'line-height:1') + txt('text', 'bold', 44, C.text, 'Khi lần đầu gặp nên nói gì đây ta?', true)) +
    div('answers', 'flex:1 1 0px;min-height:0;align-self:stretch;display:flex;flex-direction:column;gap:24px;justify-content:center;align-items:stretch',
      range(3).map(i => div(`ans_${i}`, `flex:0 0 auto;display:flex;flex-direction:row;gap:24px;align-items:center;padding:22px 32px;border-radius:16px;box-shadow:inset 0 0 0 2px ${C.primary};background-color:${C.white}`,
        circle('no_box', 52, C.fill, C.inv, String(i)) +
        div('body', 'flex:1 1 0px;min-width:0;display:flex;flex-direction:column;gap:4px;align-items:flex-start',
          txt('de', 'native', 44, C.text, '你好！', true) + txt('ipa', 'body', 30, C.muted, 'Nǐ hǎo!', true) + txt('vi', 'body', 30, C.muted, 'Xin chào!', true)))).join('')), 'gap:32px');

  // 4) CON SỐ MAY MẮN: 4–8 ô số; HV chọn số → GV bấm hiện câu hỏi của ô đó
  build('Slide/Lucky Number',
    INS + div('tiles', 'flex:1 1 0px;min-height:0;align-self:stretch;display:flex;flex-direction:row;flex-wrap:wrap;gap:28px;align-content:center;justify-content:flex-start;align-items:stretch',
      range(8).map(i => div(`tile_${i}`, `flex:0 0 calc(25% - 21px);min-height:220px;display:flex;flex-direction:column;gap:12px;align-items:center;justify-content:center;padding:20px 18px;border-radius:24px;background-color:${C.fill}`,
        txt('no', 'bold', 96, C.inv, String(i), false, 'text-align:center;line-height:1') +
        div('ans', `flex:0 0 auto;align-self:stretch;display:flex;flex-direction:column;gap:2px;align-items:center;padding:10px 14px;border-radius:14px;background-color:${C.white}`,
          txt('q', 'native', 30, C.text, '你叫什么名字？', true, 'text-align:center') + txt('ipa', 'body', 22, C.muted, 'Nǐ jiào shénme míngzi?', true, 'text-align:center')))).join('')), 'gap:24px');

  // 5) BẢNG KHOANH ĐỌC NHANH (phản xạ pinyin): lưới tối đa 24 âm tiết, GV khoanh ô bất kỳ cho HV đọc
  build('Slide/Pinyin Grid',
    INS + div('grid', 'flex:1 1 0px;min-height:0;align-self:stretch;display:flex;flex-direction:row;flex-wrap:wrap;gap:18px;align-content:center;justify-content:flex-start',
      range(24).map(i => div(`c_${i}`, `flex:0 0 calc(16.66% - 15px);display:flex;flex-direction:row;align-items:center;justify-content:center;padding:22px 8px;border-radius:16px;background-color:${i % 2 ? C.soft : C.white};box-shadow:inset 0 0 0 2px ${C.border}`,
        txt('text', 'native', 44, C.text, 'bā', false, 'text-align:center'))).join('')), 'gap:24px');

  // 6) TÌM PHIÊN ÂM ẨN TRONG HÌNH: ảnh lớn (ảnh có chữ ẩn) + số lượng cần tìm; các từ đáp án hiện lần lượt
  build('Slide/Hidden Pinyin',
    div('columns', 'flex:1 1 0px;min-height:0;align-self:stretch;display:flex;flex-direction:row;gap:48px;align-items:stretch',
      div('img', `flex:0 0 60%;align-self:stretch;border-radius:16px;background-color:${C.soft}`, '') +
      div('side', 'flex:1 1 0px;min-width:0;display:flex;flex-direction:column;gap:22px;justify-content:center;align-items:stretch',
        INS + range(6).map(i => div(`ans_${i}`, `flex:0 0 auto;display:flex;flex-direction:row;gap:18px;align-items:center;padding:14px 24px;border-radius:14px;background-color:${C.soft}`,
          circle('no_box', 46, C.fill, C.inv, String(i)) + txt('text', 'native', 40, C.text, 'māo', false) + txt('vi', 'body', 28, C.muted, 'con mèo', true))).join(''))));

  // 7) TÌM BẠN CHO BỘ THỦ: bộ ở giữa; 8 chữ xung quanh – chữ đúng có dấu ✓ hiện khi bấm
  build('Slide/Radical Match',
    INS + div('ring', 'flex:1 1 0px;min-height:0;align-self:stretch;display:flex;flex-direction:row;gap:48px;align-items:center;justify-content:center',
      div('center', `flex:0 0 auto;width:320px;height:320px;display:flex;flex-direction:column;gap:6px;align-items:center;justify-content:center;padding:24px;border-radius:50%;background-color:${C.fill}`,
        txt('radical', 'native', 130, C.inv, '亻', false, 'text-align:center;line-height:1') + txt('radical.name', 'bold', 24, C.inv, 'bộ nhân đứng', true, 'text-align:center;max-width:220px')) +
      div('chars', 'flex:0 1 860px;min-width:0;display:flex;flex-direction:row;flex-wrap:wrap;gap:24px;align-content:center;justify-content:flex-start',
        range(8).map(i => div(`rc_${i}`, `flex:0 0 calc(25% - 18px);display:flex;flex-direction:column;gap:4px;align-items:center;padding:18px 10px;border-radius:18px;background-color:${C.soft}`,
          txt('char', 'native', 84, C.text, '你', false, 'text-align:center;line-height:1.1') + txt('py', 'body', 26, C.muted, 'nǐ', false, 'text-align:center') +
          div('ans', `position:absolute;right:10px;top:10px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:50%;background-color:${C.fill}`, txt('ok', 'bold', 28, C.inv, '✓', false, 'text-align:center;line-height:1')))).join(''))), 'gap:24px');

  // 8) XẾP CÂU THÀNH HỘI THOẠI: các câu bị xáo (A, B, C…), HV ghi thứ tự; đáp án thứ tự hiện sau
  build('Slide/Dialogue Order',
    INS + div('lines', 'flex:1 1 0px;min-height:0;align-self:stretch;display:flex;flex-direction:column;gap:16px;justify-content:center;align-items:stretch',
      range(6).map(i => div(`dl_${i}`, `flex:0 0 auto;display:flex;flex-direction:row;gap:22px;align-items:center;padding:14px 26px;border-radius:14px;background-color:${C.soft}`,
        circle('key_box', 52, C.fill, C.inv, 'ABCDEF'[i - 1]) +
        div('body', 'flex:1 1 0px;min-width:0;display:flex;flex-direction:column;gap:2px;align-items:flex-start',
          txt('de', 'native', 36, C.text, '你好！你叫什么名字？', true) + txt('ipa', 'body', 26, C.muted, 'Nǐ hǎo! Nǐ jiào shénme míngzi?', true)) +
        div('slot', `flex:0 0 auto;width:64px;height:64px;border-radius:12px;background-color:${C.white};box-shadow:inset 0 0 0 2px ${C.border}`, ''))).join('')) +
    div('ans', `flex:0 0 auto;align-self:flex-start;display:flex;flex-direction:row;align-items:center;gap:14px;padding:12px 28px;border-radius:999px;background-color:${C.fill}`,
      txt('label', 'bold', 30, C.inv, 'Thứ tự đúng:', false) + txt('order', 'bold', 34, C.inv, 'D – A – E – B – C', false)), 'gap:22px');

  // 9) CÁC BƯỚC HOẠT ĐỘNG (từ S5 "Hướng dẫn giảng dạy"): mục tiêu + tối đa 5 bước (tên, phút, ý chính) – cho bước không có nội dung S6 (CTTT, HD App, Sửa BTVN…)
  build('Slide/Activity Steps',
    div('goal_box', `flex:0 0 auto;align-self:stretch;display:flex;flex-direction:row;gap:20px;align-items:flex-start;padding:22px 32px;border-radius:16px;background-color:${C.soft}`,
      txt('goal.label', 'bold', 30, C.ink, 'Mục tiêu', false) + txt('goal', 'body', 30, C.text, 'Học viên làm quen nhau, nắm mục tiêu và lộ trình khoá.', true, 'flex:1 1 0px')) +
    div('steps', 'flex:1 1 0px;min-height:0;align-self:stretch;display:flex;flex-direction:column;gap:18px;justify-content:flex-start;align-items:stretch',
      range(5).map(i => div(`st_${i}`, `flex:0 0 auto;display:flex;flex-direction:row;gap:22px;align-items:flex-start;padding:14px 24px;border-radius:14px;box-shadow:inset 0 0 0 1.5px ${C.border};background-color:${C.white}`,
        circle('no_box', 52, C.fill, C.inv, String(i)) +
        div('body', 'flex:1 1 0px;min-width:0;display:flex;flex-direction:column;gap:4px;align-items:flex-start',
          div('head', 'flex:0 0 auto;display:flex;flex-direction:row;gap:14px;align-items:center', txt('name', 'bold', 34, C.text, 'Làm quen', true) + div('min_box', `flex:0 0 auto;display:flex;flex-direction:row;align-items:center;padding:4px 14px;border-radius:999px;background-color:${C.soft}`, txt('min', 'bold', 24, C.ink, '8 phút', false))) +
          txt('text', 'body', 28, C.muted, 'GV chào, tự giới thiệu ngắn; mỗi HV nói 1–2 câu.', true)))).join('')), 'gap:22px');

  root.PLS_TPL_HOOKS = root.PLS_TPL_HOOKS || {};
  // Đặt câu với từ: không có câu mẫu → bỏ khung đáp án, ô từ chiếm giữa
  root.PLS_TPL_HOOKS['Slide/Word Sentence'] = function (rootEl, data) { if (!String(data.de || '').trim()) { const a = rootEl.querySelector('[data-n="ans"]'); if (a) a.style.display = 'none'; const w = rootEl.querySelector('[data-n="word_box"]'); if (w) w.style.flex = '0 0 60%'; const c = rootEl.querySelector('[data-n="columns"]'); if (c) c.style.justifyContent = 'center'; } };
  // Bài tập hình (mẫu Figma): chữ gợi ý ngắn làm cột co hẹp → các cột chia đều bề ngang thẻ
  if (!root.PLS_TPL_HOOKS['Slide/Exercise Image']) root.PLS_TPL_HOOKS['Slide/Exercise Image'] = function (rootEl) { const box = rootEl.querySelector('[data-n="images"]'); if (!box) return; const its = [...box.children].filter(e => /^item_\d+$/.test(e.dataset.n || '') && e.style.display !== 'none'); if (!its.length) return;
    box.style.justifyContent = 'center'; box.style.alignSelf = 'stretch'; its.forEach(e => { Object.assign(e.style, { flex: '1 1 0px', width: 'auto', minWidth: '0', maxWidth: (100 / Math.max(its.length, 2)) + '%' }); const im = e.querySelector('[data-n$=".img"],[data-n="img"]'); if (im) Object.assign(im.style, { alignSelf: 'stretch', width: 'auto' }); }); };
  // Bộ thủ: chữ không có dấu ✓ (không chứa bộ) → ẩn vòng ✓
  root.PLS_TPL_HOOKS['Slide/Radical Match'] = function (rootEl, data) { rootEl.querySelectorAll('[data-n^="rc_"]').forEach(el => { const k = el.dataset.n; if (!String(data[k + '.ok'] || '').trim()) { const a = el.querySelector('[data-n="ans"]'); if (a) a.style.display = 'none'; } }); };
})(typeof window !== 'undefined' ? window : globalThis);
