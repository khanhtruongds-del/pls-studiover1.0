// PLS engine: đổ nội dung vào mẫu, co chữ theo thang chuẩn, tự chọn mẫu + chia slide, soát lỗi, xuất PPTX.
// Mọi thuộc tính chỉ có MỘT nơi quyết định (không có lượt "dọn" chồng nhau). Lỗi được báo ra, không nuốt.
(function (root) {
  'use strict';
  const TPL = () => root.PLS_TPL;
  const LADDER = [120, 79.5, 64.5, 55.5, 48, 40.5, 36, 30, 28, 26, 24, 22, 20];   // thang cỡ chữ slide (Core size/*)
  const STD = { minFont: 20, warnFont: 24, safe: 48, maxWords: 40, wordsSkip: /Reading|Transcript|Dialog|Answer Key/ }; // chuẩn v2.0 RB-PPT-02/03/06
  const CONTENT_IMG = n => n !== 'bg.img' && /^(img(_\d+)?|.+\.img)$/.test(n);   // ô ảnh nội dung → khung chờ ảnh; ảnh khác (nền, trang trí brand, logo) giữ nguyên
  const ASSET = h => { const v = root.PLS_ASSETS && root.PLS_ASSETS[h]; return v ? (v.startsWith('data:') ? v : 'assets/' + v) : null; };   // bản 1 file: ảnh nhúng sẵn data:

  // ---------- tìm ô theo tên (giống F.find nhưng không tách nhầm tên có dấu chấm) ----------
  function byName(scope, name) { return [...scope.querySelectorAll('[data-n]')].filter(e => e.dataset.n === name); }
  function find(scope, key) {
    const exact = byName(scope, key); if (exact.length) return exact.find(e => !e.closest('[data-n="header"]')) || exact[0];   // "text" của mẫu Reading ≠ chữ trong nhãn header
    const sl = key.indexOf('/');   // "options_1/opt_A.text": khung lồng (MC Duo, Reading Quiz)
    if (sl > 0 && !/^(Slide|Block|A4|Part)\//.test(key)) { for (const h of byName(scope, key.slice(0, sl))) { const r = find(h, key.slice(sl + 1)); if (r) return r; } }
    const parts = key.split('.');
    for (let i = parts.length - 1; i >= 1; i--) {               // tiền tố dài nhất trước: "item_1.text" → "item_1" › "text"
      const head = parts.slice(0, i).join('.'), rest = parts.slice(i).join('.');
      for (const h of byName(scope, head)) { const r = find(h, rest); if (r) return r; }
    }
    return null;
  }
  function textEl(el) {   // ô là khung → lấy lớp chữ chính bên trong (ưu tiên "text", tránh dấu/ số/ icon)
    if (!el) return null; if (el.dataset.text) return el;
    const all = [...el.querySelectorAll('[data-text]')];
    return all.find(t => t.dataset.n === 'text') || all.find(t => !/(^|\.)(mark|no|icon|key|min)$/.test(t.dataset.n)) || all[0] || null;
  }
  function show(el, stop) { for (let p = el; p && p !== stop; p = p.parentElement) if (p.dataset && p.dataset.hid) { p.style.display = p.dataset.disp || ''; delete p.dataset.hid; } }
  function hide(el) { if (!el.dataset.hid && el.style.display && el.style.display !== 'none' && !el.dataset.disp) el.dataset.disp = el.style.display; el.style.display = 'none'; el.dataset.hid = '1'; }

  // ---------- dựng 1 slide ----------
  function render(spec, brand) {
    const t = TPL().slides[spec.comp] || TPL().blocks[spec.comp];
    if (!t) throw new Error('Không có mẫu "' + spec.comp + '"');
    const host = document.createElement('div');
    host.className = 'pls-slide'; host.dataset.brand = brand; host.dataset.comp = spec.comp;
    host.style.width = t.w + 'px'; host.style.height = t.h + 'px';
    host.innerHTML = t.html;
    const rootEl = host.firstElementChild;
    const data = Object.assign({}, spec.common || {}, spec.data || {});
    const filled = [], missing = [];
    // chữ theo biến brand (info/web, info/tagline…)
    const BS = (root.PLS_BRAND_STR || {})[brand] || {};
    host.querySelectorAll('[data-var-text]').forEach(e => { const v = BS[e.dataset.varText]; if (v != null) setText(e, v); });
    // chữ thương hiệu viết cứng trong mẫu (tagline, web, fanpage của Betreux) → đổi sang brand đang dựng (RB-CH-03)
    const B0 = (root.PLS_BRAND_STR || {})['Betreux'] || {};
    if (brand !== 'Betreux') host.querySelectorAll('[data-text]:not([data-var-text])').forEach(t => { for (const k of ['info/tagline', 'info/web', 'info/fanpage']) if (B0[k] && BS[k] && t.textContent.trim() === B0[k]) setText(t, BS[k]); });
    // ảnh của mẫu
    host.querySelectorAll('[data-img]').forEach(e => {
      const url = ASSET(e.dataset.img), n = e.dataset.n;
      if (!CONTENT_IMG(n)) { if (url) { e.style.backgroundImage = `url("${url}")`; e.style.backgroundSize = e.dataset.fit === 'FIT' ? 'contain' : 'cover'; e.style.backgroundPosition = 'center'; e.style.backgroundRepeat = 'no-repeat'; } }
      else { e.classList.add('pls-imgslot'); e.dataset.imgLabel = ''; }
    });
    host.querySelectorAll('[data-n]').forEach(e => { if (!e.dataset.img && CONTENT_IMG(e.dataset.n) && !e.querySelector('[data-text]')) e.classList.add('pls-imgslot'); });
    if (spec.comp === 'Slide/Answer Key' && spec.layout === 'flow') ansFlow(rootEl, data);
    // đổ nội dung
    for (const [k, v] of Object.entries(data)) {
      if (k.startsWith('img:')) continue;
      const el = find(rootEl, k); const te = textEl(el);
      const sp = TY() && el ? TY().special(el, te, v, host) : null;   // ruby / khối công thức (typo.js)
      if (sp) { show(sp, host); sp.dataset.filled = k; filled.push(sp); continue; }
      if (!te) { if (spec.data && k in spec.data && String(v).trim() !== '') missing.push(k); continue; }
      if (String(v).trim() === '') { let t = el && el !== rootEl ? el : te; if (t && t.parentElement && t.parentElement.dataset.n === t.dataset.n + '_box') t = t.parentElement; if (t) hide(t); continue; }   // dữ liệu rỗng có chủ ý (vd instruction.vi) → ẩn ô, không để lộ chữ mẫu
      setText(te, String(v)); if (TY()) TY().emph(te, v); show(te, host); te.dataset.filled = k; filled.push(te);
    }
    // nhãn khung ảnh = nghĩa tiếng Việt cùng thẻ
    host.querySelectorAll('.pls-imgslot').forEach(e => { const vi = e.parentElement && [...e.parentElement.querySelectorAll('[data-filled]')].find(x => /(^|\.)vi$/.test(x.dataset.filled) && x.closest('[data-n]') && e.parentElement.contains(x)); const same = vi && vi.dataset.filled.split('.')[0] === (e.parentElement.dataset.n || '').split('.')[0]; e.dataset.imgLabel = same ? 'Ảnh: ' + vi.textContent : 'Ảnh minh hoạ'; });
    hideUnused(rootEl, data);
    clearUnfilled(rootEl, data);
    // nút loa (ex_n.audio_box): PPTX không kèm âm thanh → không có file tiếng thì ẩn hẳn, khỏi để chấm tròn trống
    rootEl.querySelectorAll('[data-n$="audio_box"]').forEach(b => { const k = b.dataset.n.replace(/_box$/, ''); if (!data[k]) hide(b); });
    applyIcons(host);
    // Pronunciation: hàng ví dụ không kéo cao/kéo dài hết cột – hàng ôm chữ, cột ví dụ rộng theo hàng dài nhất, từ và phiên âm gần nhau, cả cụm giữa dọc
    if (spec.comp === 'Slide/Pronunciation') {
      const exs = rootEl.querySelector('[data-n="examples"]');
      if (exs) Object.assign(exs.style, { flex: '0 1 auto', minWidth: '40%', maxWidth: '50%', justifyContent: 'center', alignItems: 'stretch' });
      rootEl.querySelectorAll('[data-n^="ex_"]').forEach(r => { if (/^ex_\d+$/.test(r.dataset.n)) Object.assign(r.style, { flex: '0 0 auto', minHeight: '', justifyContent: 'space-between' }); });
      rootEl.querySelectorAll('[data-n$=".word"]').forEach(w => { if (/^ex_\d+\.word$/.test(w.dataset.n)) Object.assign(w.style, { flex: '0 1 auto' }); });
    }
    // Nối cột: số (l_n.no) và chữ (r_n.no) đặt trong ô tròn đặc màu thương hiệu, giống ô đáp án trắc nghiệm
    if (/^Slide\/Exercise Match/.test(spec.comp)) rootEl.querySelectorAll('[data-n="no"]').forEach(t => { if (!/^[lr]_\d+$/.test((t.parentElement || {}).dataset ? t.parentElement.dataset.n : '')) return;
      const fs = parseFloat(t.dataset.fs) || 36, d = Math.round(fs * 1.5);
      Object.assign(t.style, { flex: '0 0 auto', width: d + 'px', height: d + 'px', lineHeight: d + 'px', textAlign: 'center', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'var(--color-text-inverse, #fff)', fontSize: Math.round(fs * 0.8) + 'px', padding: '0' }); });
    // Lưới từ vựng: ô ảnh rộng hết thẻ (ảnh to, cùng khung giữa các thẻ), từ vựng nhỏ lại một bậc (48 → 40,5)
    if (/^Slide\/Vocab Grid/.test(spec.comp)) {
      rootEl.querySelectorAll('[data-n="img"]').forEach(im => { if (/^vocab_\d+$/.test((im.parentElement || {}).dataset ? im.parentElement.dataset.n : '')) Object.assign(im.style, { alignSelf: 'stretch', width: 'auto' }); });
      rootEl.querySelectorAll('[data-n="de"]').forEach(t => { if (parseFloat(t.dataset.fs) > 40.5) { t.style.fontSize = '40.5px'; t.dataset.fs = '40.5'; } });
    }
    // TÊN (người nói, nhân vật…): luôn 1 dòng; dài thì ô rộng ra tới 300px, vẫn tràn thì fitText co cả nhóm cùng cỡ
    rootEl.querySelectorAll('[data-n="speaker"], [data-n$=".speaker"], [data-n="who"], [data-n$=".who"], [data-n="name"], [data-n$=".name"]').forEach(t => { if (!t.dataset.text) return;
      const w = parseFloat(t.style.width) || 0; Object.assign(t.style, { whiteSpace: 'nowrap', overflowWrap: 'normal', wordBreak: 'keep-all' }); if (w && w < 300) Object.assign(t.style, { width: 'auto', minWidth: w + 'px', maxWidth: '300px' }); });
    // Đáp án (lưới): ô cao vừa chữ, rộng đều 1/3 hàng, hàng thiếu ô thì căn giữa, lưới ngay dưới tiêu đề
    if (spec.comp === 'Slide/Answer Key' && spec.layout !== 'flow') {
      const grid = rootEl.querySelector('[data-n="grid"]'); if (grid) Object.assign(grid.style, { justifyContent: 'flex-start', rowGap: '28px', gap: '28px', paddingTop: '8px' });
      rootEl.querySelectorAll('[data-n^="row_"]').forEach(rw => { if (!/^row_\d+$/.test(rw.dataset.n)) return; Object.assign(rw.style, { flex: '0 0 auto', justifyContent: 'center', overflow: 'visible', alignItems: 'stretch' });   // ô cùng hàng cao bằng ô cao nhất
        const list = spec.layout === 'list';   // đáp án dài (câu): mỗi ô 1 hàng rộng hết khung, cùng kiểu thẻ + vòng số
        if (list) Object.assign(rw.style, { flexWrap: 'wrap', rowGap: '20px', justifyContent: 'flex-start' });
        [...rw.children].forEach(a => { if (/^a_\d+$/.test(a.dataset.n || '')) Object.assign(a.style, { flex: list ? '0 0 100%' : '0 0 calc((100% - 48px) / 3)', alignSelf: 'auto', minHeight: list ? '92px' : '112px', padding: list ? '18px 28px' : '24px 28px' }); }); });
      if (spec.layout === 'list' && grid) Object.assign(grid.style, { rowGap: '20px', gap: '20px' });
    }
    // Ô chữ màu (sound_box…): chữ ngắn 1–3 ký tự giữ cỡ hiển thị; chữ dài (cụm "Đọc đuôi -s / -es") nhỏ lại 55,5 / 48 và đệm thu vào theo cỡ chữ
    { const sb = rootEl.querySelector('[data-n="sound_box"]'), st = sb && sb.querySelector('[data-n="sound"]'), v = st ? String(data.sound || st.textContent || '').trim() : '';
      if (st && v.length > 3) { const fs = v.length > 14 ? 48 : 55.5; Object.assign(st.style, { fontSize: fs + 'px', lineHeight: '1.2' }); st.dataset.fs = String(fs); Object.assign(sb.style, { padding: Math.round(fs * 0.28) + 'px ' + Math.round(fs * 0.5) + 'px' }); } }
    // Ô/thẻ có nền chứa chữ (…_box, card con): chữ giữa theo chiều dọc để đệm trên = dưới
    rootEl.querySelectorAll('[data-n$="_box"], [data-n$=".box"]').forEach(b => { if (b.style.display === 'flex' && b.style.flexDirection === 'row' && b.style.alignItems === 'flex-start' && b.style.backgroundColor && (b.textContent || '').trim().length <= 60) b.style.alignItems = 'center'; });   // chỉ ô chữ ngắn; khung đoạn văn (text_box) giữ căn trên
    // Thẻ nội dung dạng lưới (Grammar Usage u_n, Formula f_n, Rule Transform r_n, Summary col_n): chữ đọc từ trên xuống, trái qua phải – không căn giữa dọc
    rootEl.querySelectorAll('[data-n]').forEach(c => { if (/^(u|f|r|col|c)_\d+$/.test(c.dataset.n) && c.style.flexDirection === 'column' && c.style.justifyContent === 'center') { c.style.justifyContent = 'flex-start'; if (c.style.alignItems === 'center') c.style.alignItems = 'flex-start'; } });
    // BO GÓC ĐỒNG BỘ (người dùng chốt 23/10): khung trắng chính 32px, mọi thẻ/ô/nhãn bên trong 16px, vòng số tròn hẳn (50%) – hết kiểu nửa tròn nửa vuông
    rootEl.querySelectorAll('[style*="border-radius"]').forEach(e => { const br = e.style.borderRadius; if (!br || br === '50%' || e.dataset.circle) return;
      e.style.borderRadius = /^(card)$/.test(e.dataset.n || '') ? '32px' : '16px'; });
    // DANH SÁCH GỌN (mọi mẫu – người dùng chốt 23/10): mục lặp (item_1, step_1, p_1, cando_1…) không giãn ra cho đầy khung,
    // xếp từ trên xuống, cách nhau 28px; khung trắng (card/body) giữ nguyên kích thước
    {
      const LIST_ITEM = /^(item|step|cando|q|ex|line|u|f|task|guide|part|point|tip|rule|note|use|s)_\d+$/;
      const lists = new Set(); rootEl.querySelectorAll('[data-n]').forEach(e => { if (LIST_ITEM.test(e.dataset.n) && e.parentElement && e.parentElement.style.flexDirection === 'column') lists.add(e.parentElement); });
      lists.forEach(L => {
        const kids = [...L.children].filter(k => LIST_ITEM.test(k.dataset.n || '')); if (kids.length < 2) return;
        kids.forEach(k => { if (/^\d+ 1 0px$/.test(k.style.flex || '')) { k.style.flex = '0 0 auto'; k.style.minHeight = '0'; } });
        if (/space-(between|around|evenly)/.test(L.style.justifyContent || '')) L.style.justifyContent = 'flex-start';
        if (!(parseFloat(L.style.rowGap || L.style.gap) >= 16)) L.style.rowGap = kids.length >= 6 ? '14px' : '28px';   // danh sách dài (lộ trình 8 bước) cách hẹp hơn để khỏi co chữ
      });
    }
    // BÀI TẬP GỌN (người dùng chốt 23/10): mục không kéo cao/kéo rộng cho đầy khung; mục ôm chữ, cách nhau một khoảng vừa đủ
    if (/^Slide\/(Exercise |Sentence Order|Fill Word Bank)/.test(spec.comp)) {
      const ITEM = /^(item_\d+|opt_[A-H]|l_\d+|r_\d+)$/;
      rootEl.querySelectorAll('[data-n]').forEach(e => { if (!ITEM.test(e.dataset.n)) return; Object.assign(e.style, { flex: '0 0 auto', height: 'auto', minHeight: '0' }); const pr = e.parentElement; if (pr && /^card$/.test(pr.dataset.n || '')) { const n = [...pr.children].filter(k => ITEM.test(k.dataset.n || '') && !k.dataset.hid).length; const g = (n <= 3 ? 60 : n <= 5 ? 40 : 28) - (parseFloat(pr.style.rowGap || pr.style.gap) || 0); if (g > 0) e.style.marginBottom = g + 'px'; }   // mục nằm thẳng trong card: giãn bằng lề dưới, card giữ nguyên
      if (pr && !/^(card|body|columns|brand\.bg)$/.test(pr.dataset.n || '') && pr.style.flex && /^\d+ 1 0px$/.test(pr.style.flex) && pr.style.flexDirection === 'column') { const n = [...pr.children].filter(k => ITEM.test(k.dataset.n || '') && !k.dataset.hid).length; pr.style.flex = '0 0 auto'; pr.style.justifyContent = 'flex-start'; pr.style.gap = pr.style.rowGap = (n <= 3 ? 60 : n <= 5 ? 40 : 28) + 'px'; pr.style.paddingTop = '12px'; } });
    }
    // Trắc nghiệm 1 câu: CÙNG cỡ chữ + kiểu thẻ với trắc nghiệm 2 câu (câu hỏi 40,5 đậm, đáp án 36, thẻ đệm 14/24) – người dùng chốt:
    // slide 1 câu không phóng to chữ cho đầy khung; cụm đáp án ngay dưới câu hỏi
    if (/^Slide\/Exercise MC( Long)?$/.test(spec.comp)) {
      const q = rootEl.querySelector('[data-n="question"]'); if (q) { Object.assign(q.style, { fontFamily: "var(--ff-font-body, 'Montserrat'), sans-serif", fontWeight: '700', fontSize: '40.5px', lineHeight: '1.3', marginTop: '-12px' }); q.dataset.fs = '40.5'; }
      const ops = rootEl.querySelector('[data-n="options"]'); if (ops) Object.assign(ops.style, { flex: '0 0 auto', rowGap: '24px', columnGap: '24px', gap: '24px', marginTop: '-12px' });   // khoảng cách như MC 2 câu
      rootEl.querySelectorAll('[data-n^="opt_"]').forEach(o => { if (!/^opt_[A-H]$/.test(o.dataset.n)) return; Object.assign(o.style, { height: 'auto', minHeight: '76px', padding: '14px 24px', alignItems: 'center', width: 'calc(50% - 12px)' });
        o.querySelectorAll('[data-text]').forEach(t => { if (!/key/.test(t.dataset.n + (t.parentElement.dataset.n || ''))) { t.style.fontSize = '36px'; t.dataset.fs = '36'; } }); });
    }
    // Trắc nghiệm 2 câu (MC Duo, Reading Quiz): câu hỏi bằng chữ thân đậm cỡ nội dung (không dùng chữ tiêu đề to), thẻ đáp án ôm chữ, đệm đều 4 phía
    if (/^Slide\/(Exercise MC Duo|Reading Quiz)$/.test(spec.comp)) {
      rootEl.querySelectorAll('[data-n^="question_"]').forEach(q => { if (!/^question_\d+$/.test(q.dataset.n)) return; const t = q.dataset.text ? q : q.querySelector('[data-text]'); if (!t) return;
        Object.assign(t.style, { fontFamily: "var(--ff-font-body, 'Montserrat'), sans-serif", fontWeight: '700', fontSize: '40.5px', lineHeight: '1.3' }); t.dataset.fs = '40.5'; q.style.marginTop = '12px'; });
      rootEl.querySelectorAll('[data-n^="opt_"]').forEach(o => { if (!/^opt_[A-H]$/.test(o.dataset.n)) return; Object.assign(o.style, { height: 'auto', minHeight: '76px', padding: '14px 24px', alignItems: 'center' }); o.querySelectorAll('[data-text]').forEach(t => { if (!/key/.test(t.dataset.n + (t.parentElement.dataset.n || ''))) { t.style.fontSize = '36px'; t.dataset.fs = '36'; } }); });
      rootEl.querySelectorAll('[data-n^="options_"]').forEach(o => { if (/^options_\d+$/.test(o.dataset.n)) o.style.marginBottom = '16px'; });
    }
    // Ô bọc số (step_1.no_box, a_1.key_box…): luôn TRÒN đều – mẫu chuyển sang để ngang co giãn + bo 24 nên lúc thành hình viên thuốc, lúc vuông bo
    rootEl.querySelectorAll('[data-n$="no_box"], [data-n$="key_box"], [data-n$="num_box"]').forEach(b => { const h = parseFloat(b.style.height) || parseFloat(b.style.width); if (!h || h > 120) return; Object.assign(b.style, { flex: '0 0 auto', width: h + 'px', minWidth: h + 'px', height: h + 'px', borderRadius: '50%', justifyContent: 'center', alignItems: 'center', padding: '0' });
      const t = b.querySelector('[data-text]'); if (!t) return; Object.assign(t.style, { textAlign: 'center', flex: '0 0 auto', lineHeight: '1' });
      b.dataset.circle = String(h);   // cỡ chữ theo số ký tự đặt sau khi điền (xem dưới)
    });
    // số trong vòng tròn: MỘT cỡ chung cho cả slide (người dùng chốt) – 50% vòng nếu số dài nhất ≤ 2 chữ số, 36% nếu có số 3 chữ số
    { const cs = [...rootEl.querySelectorAll('[data-circle]')].map(b => [b, b.querySelector('[data-text]')]).filter(x => x[1]);
      const maxN = Math.max(0, ...cs.map(([, t]) => (t.textContent || '').trim().length));
      cs.forEach(([b, t]) => { const h = +b.dataset.circle, f = Math.round(h * (maxN >= 3 ? 0.36 : maxN === 2 ? 0.5 : 0.6)); Object.assign(t.style, { fontSize: f + 'px', letterSpacing: maxN >= 2 ? '-0.02em' : '' }); t.dataset.fs = String(f); }); }
    return { host, rootEl, filled, missing };
  }
  // ICON (F.icons): ô "*.icon" → icon Lucide chọn theo chữ cùng dòng (ICON_MAP); không khớp → giữ icon mặc định của mẫu (info)
  // thứ tự ưu tiên khi gắn icon cho yêu cầu làm bài: động tác chính trước ("Đọc mô tả rồi CHỌN" → chọn; "NGHE và chọn" → nghe)
  const ICON_ORDER = ['volume-2', 'headphones', 'play', 'arrow-up-down', 'link', 'pen-line', 'circle-check', 'list-checks', 'pencil', 'messages-square', 'mic', 'book-open', 'eye', 'notebook-pen', 'key-round', 'clock', 'target', 'lightbulb', 'triangle-alert'];
  function applyIcons(host) {
    const MAP = root.PLS_ICON_MAP || [], ICONS = root.PLS_ICONS || {};
    host.querySelectorAll('[data-n]').forEach(el => {
      if (!/(^|\.)icon$/.test(el.dataset.n) || el.dataset.text) return;
      // icon CHỈ đi với yêu cầu làm bài (instruction / task / track: viết, chọn, nghe…); ghi chú, mẹo, can-do, tag… không gắn icon cạnh chữ thân
      if (!/^(instruction|task|track)\.icon$/.test(el.dataset.n)) { hide(el); return; }
      const row = el.parentElement; const txt = row ? [...row.querySelectorAll('[data-text]')].map(t => t.textContent).join(' ') : '';
      let name = null; for (const ic of ICON_ORDER) { const m = MAP.find(x => x[0] === ic); if (m && m[1].test(txt) && ICONS[ic]) { name = ic; break; } }
      if (!name) { if (!el.dataset.hid) name = 'info'; else return; }   // không khớp: giữ trạng thái mẫu (ẩn → vẫn ẩn)
      show(el, host);
      const color = (el.querySelector('[data-color]') || el).dataset.color || 'currentColor';
      const t0 = row && row.querySelector('[data-text]'); const fz = t0 ? parseFloat(getComputedStyle(t0).fontSize) || 40 : 40;
      const sz = Math.round(Math.max(32, fz * 1.05));   // icon cỡ theo dòng chữ (như F.icons: đúng cỡ + màu)
      const lh = t0 ? (parseFloat(getComputedStyle(t0).lineHeight) || fz * 1.4) : sz;
      // canh icon theo DÒNG ĐẦU của chữ (chữ nhiều dòng thì icon không trôi xuống giữa đoạn)
      Object.assign(el.style, { flex: '0 0 auto', width: sz + 'px', height: sz + 'px', alignSelf: 'flex-start', marginTop: Math.max(0, Math.round((lh - sz) / 2)) + 'px' });
      el.dataset.icon = name; el.style.color = color;
      el.innerHTML = (ICONS[name] || '').replace('<svg ', '<svg style="display:block" ');
    });
  }
  const TY = () => root.PLS_TYPO;
  // TRANG ĐÁP ÁN GỌN: thay 4 hàng × 3 ô cố định của mẫu bằng một lưới chảy (flex-wrap) đủ số ô, xếp trái → phải, trên → dưới.
  // Số cột chọn theo độ dài đáp án (đa số ngắn → 4 cột; câu dài → 2 / 1 cột); đáp án dài hơn ô thì chiếm 2+ cột, vẫn đúng thứ tự câu.
  // Ô ôm chữ (không kéo cao cho đầy trang), các ô cùng hàng cao bằng ô cao nhất. Cỡ chữ cả trang chỉnh sau khi dựng (ansFit).
  const ANS_CPC = { 5: 10, 4: 14, 3: 22, 2: 40, 1: 1e9 }, ANS_GAP = 20;   // số ký tự vừa 1 ô ở cỡ 36–40
  function ansCols(grid, C, flat) {   // flat: mọi ô 1 cột (đáp án dài xuống dòng trong ô)   // C cột; ô có đáp án dài chiếm 2+ cột, vẫn đúng thứ tự câu
    grid.dataset.cols = String(C);
    [...grid.children].forEach(a => { const n = +a.dataset.len || 0;
      const span = flat ? 1 : Math.min(C, [1, 2, 3, 4, 5].find(s => n <= ANS_CPC[C] * s * 1.15) || C); a.dataset.span = String(span);
      a.style.flex = `0 0 calc((100% - ${(C - 1) * ANS_GAP}px) / ${C} * ${span} + ${(span - 1) * ANS_GAP}px)`; });
  }
  function ansFlow(rootEl, data) {
    const grid = rootEl.querySelector('[data-n="grid"]'), proto = rootEl.querySelector('[data-n="a_1"]'); if (!grid || !proto) return;
    const items = []; for (let k = 1; data[`a_${k}.key`] != null || data[`a_${k}.text`] != null; k++) items.push(String(data[`a_${k}.text`] || ''));
    if (!items.length) return;
    const lens = items.map(t => t.length).sort((a, b) => a - b), med = lens[Math.floor((lens.length - 1) / 2)];
    let C = med <= ANS_CPC[4] ? 4 : med <= ANS_CPC[3] ? 3 : med <= ANS_CPC[2] ? 2 : 1;
    if (items.length <= 3) C = Math.min(C, items.length === 1 ? 1 : 2);
    const tpl = proto.cloneNode(true);
    grid.innerHTML = '';
    Object.assign(grid.style, { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch', alignContent: 'flex-start', justifyContent: 'flex-start', gap: ANS_GAP + 'px', rowGap: ANS_GAP + 'px', columnGap: ANS_GAP + 'px', paddingTop: '4px' });
    grid.dataset.pref = String(C); grid.dataset.med = String(med);
    items.forEach((t, i) => {
      const a = tpl.cloneNode(true); a.dataset.n = `a_${i + 1}`; a.dataset.len = String(t.length);
      Object.assign(a.style, { alignSelf: 'stretch', minHeight: '0', height: 'auto', padding: '16px 24px', gap: '18px', alignItems: 'center' });
      grid.appendChild(a);
    });
    ansCols(grid, C);
  }
  // chọn cỡ chữ LỚN NHẤT (thang chuẩn 40,5 → 28) mà trang vẫn vừa; ở mỗi cỡ thử số cột ưu tiên trước rồi thêm cột (ô hẹp, chữ xuống dòng).
  // Không vừa ở 28 → để nguyên, soát lỗi báo tràn → app chọn phương án chia trang.
  function ansFit(r) {
    const grid = r.host.querySelector('[data-n="grid"][data-cols]'); if (!grid) return;
    const cells = [...grid.children], txt = cells.map(c => c.querySelector('[data-n="text"]')).filter(Boolean), keys = cells.map(c => c.querySelector('[data-n="key_box"]')).filter(Boolean);
    const fits = () => grid.scrollHeight <= grid.clientHeight + 1 && txt.every(e => e.scrollWidth <= e.clientWidth + 1);
    const pref = +grid.dataset.pref || 3, colsTry = [pref]; for (let c = pref + 1; c <= (med => med <= ANS_CPC[5] ? 5 : 4)(+grid.dataset.med || 99); c++) if (cells.length >= c) colsTry.push(c); for (let c = pref - 1; c >= 1; c--) colsTry.push(c);
    const maxN = Math.max(0, ...keys.map(b => (b.textContent || '').trim().length));
    const apply = fs => { txt.forEach(e => { e.style.fontSize = fs + 'px'; e.style.lineHeight = '1.3'; e.dataset.fs = String(fs); });
      const kb = Math.max(44, Math.round(fs * 1.35)), kf = Math.max(24, Math.round(kb * (maxN >= 3 ? 0.36 : maxN === 2 ? 0.5 : 0.6)));
      keys.forEach(b => { Object.assign(b.style, { flex: '0 0 auto', width: kb + 'px', minWidth: kb + 'px', height: kb + 'px' }); b.dataset.circle = String(kb); const k = b.querySelector('[data-text]'); if (k) { k.style.fontSize = kf + 'px'; k.dataset.fs = String(kf); } }); };
    for (const fs of LADDER.filter(v => v <= 40.5 && v >= 28)) { apply(fs); for (const C of colsTry) for (const flat of [false, true]) { ansCols(grid, C, flat); if (fits()) return; } }
    ansCols(grid, pref);
  }
  function setText(e, v) { const s = e.querySelector('[data-t]'); (s || e).textContent = v; }

  // Ô CHỮ TRONG MỤC ĐANG DÙNG MÀ KHÔNG CÓ DỮ LIỆU (vd item_1.meta) → ẩn, không để lộ chữ mẫu (lỗi "chữ mẫu còn sót" trong BACKLOG)
  function clearUnfilled(rootEl, data) {
    const keys = Object.keys(data);
    rootEl.querySelectorAll('[data-text]:not([data-filled])').forEach(t => {
      let item = null; for (let p = t.parentElement; p && p !== rootEl; p = p.parentElement) if (/^[a-z][a-z0-9]*_(\d+|[A-H])$/i.test(p.dataset.n || '')) { item = p; break; }
      if (t.parentElement.closest('[data-filled]')) return;   // mảnh chữ của ô ruby / khối công thức
      if (!item || item.dataset.hid || /(^|\.)(no|key|mark|icon)$/.test(t.dataset.n)) return;
      if (keys.some(k => k.split('.')[0] === item.dataset.n)) hide(t);
    });
  }
  // ẨN MỤC THỪA (fit 3.4): nhóm đánh số (vocab_1.., item_1.., row_1.., opt_A..) có mục không dữ liệu → ẩn
  function hideUnused(rootEl, data) {
    const keys = Object.keys(data);
    const used = new Set(); keys.forEach(k => k.split(/[./]/).forEach(p => used.add(p)));
    const groups = {};
    rootEl.querySelectorAll('[data-n]').forEach(e => {
      const m = e.dataset.n.match(/^([a-z][a-z0-9]*_)(\d+|[A-H])$/i); if (!m) return;
      (groups[m[1]] = groups[m[1]] || []).push(e);
    });
    for (const [pre, els] of Object.entries(groups)) {
      if (!keys.some(k => k.split(/[./]/).some(p => p.startsWith(pre)))) continue;   // nhóm không được dùng → giữ nguyên mẫu
      for (const e of els) if (!used.has(e.dataset.n)) hide(e);
    }
    // hàng/ cột rỗng sau khi ẩn: khung chỉ còn con ẩn → ẩn luôn
    rootEl.querySelectorAll('[data-n]').forEach(e => { const kids = [...e.children]; if (kids.length && kids.every(c => c.dataset.hid) && /^(row|grid|list|items|options|lines)/.test(e.dataset.n)) hide(e); });
  }

  // ---------- đo & co chữ ----------
  const R = el => el.getBoundingClientRect();
  function scaleOf(host) { return R(host).width / parseFloat(host.style.width) || 1; }
  function clipBox(el, host) {   // khung giới hạn gần nhất: tổ tiên có nền / clip, hoặc chính slide
    for (let p = el.parentElement; p && p !== host; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.overflow === 'hidden' || (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && p !== el.parentElement && R(p).width < R(host).width * 0.98)) return p;
    }
    return host;
  }
  function overflowPx(el, host) {
    const s = scaleOf(host);
    // phần chân/đầu chữ lòi khỏi dòng (Verdana/Arial thật trên Windows có ascent+descent > line-height) không phải tràn:
    // dọc cho phép ~22% cỡ chữ, ngang vẫn chặt (lỗi Cover 120 → 36 trên máy Windows)
    const fs = parseFloat(getComputedStyle(el).fontSize) || 0;
    const own = Math.max(0, el.scrollWidth - el.clientWidth - 1, el.scrollHeight - el.clientHeight - Math.max(1, 0.22 * fs));
    // chữ phải nằm trong MỌI khung tổ tiên (khung tự giãn thì chứa sẵn; khung có kích thước – cột, thẻ, slide – sẽ lộ phần lòi ra)
    const a = R(el); let out = 0;
    for (let p = el.parentElement; p && p !== host.parentElement; p = p.parentElement) {
      const b = R(p); if (!b.width || !b.height) continue;
      out = Math.max(out, (Math.max(0, b.left - a.left, a.right - b.right, b.top - a.top, a.bottom - b.bottom)) / s);
    }
    return Math.max(own, out);
  }
  // ô chữ tự giãn (hug) không tràn khung mà ĐÈ lên ô khác → cũng phải co (lỗi slide Pronunciation)
  function overlapsOther(el, filled) {
    const a = R(el); if (!a.width) return false;
    return filled.some(o => { if (o === el || o.contains(el) || el.contains(o) || o.offsetParent === null) return false; const b = R(o); const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); return w > 2 && h > 2; });
  }
  function fontPx(el) { return parseFloat(getComputedStyle(el).fontSize); }

  // ---------- PHÂN CẤP CHỮ (chuẩn v2.0 "Cỡ chữ theo cấp": tiêu đề > nội dung chính 40px > dịch nghĩa/phiên âm ≥ 28px, tỉ lệ ~1,35 như sách 11,5/8,5 pt) ----------
  // Mẫu Figma để tiêu đề 48 / nội dung 40,5 / dịch 36 → nhìn đều nhau. Chỉ đổi cỡ, không đổi khung; fitText vẫn co lại nếu tràn.
  const SECONDARY = /^(vi|ipa|romaji|roma|pinyin|hanviet|meaning|min|note|sub|cap(_\d+)?|time|trans)$/i;
  const HIER = { title: 1.36, ratio: 1.33, minSec: 28, maxTitle: 64.5, fixedTitle: 52 };
  const slotOf = el => (el.closest('[data-n]') || el);
  const leaf = el => String(slotOf(el).dataset.n || '').split('.').pop();
  function hierarchy(r) {
    const host = r.host, texts = [...host.querySelectorAll('[data-text]')].filter(e => e.offsetParent !== null && e.textContent.trim());
    const isSec = e => SECONDARY.test(leaf(e)), isTitle = e => /^(title|.+\.title)$/.test(slotOf(e).dataset.n || '');
    const body = texts.filter(e => !isSec(e) && !isTitle(e) && !e.closest('[data-n="header"]'));
    const set = (e, v) => { e.style.fontSize = v + 'px'; };
    // 1) dịch nghĩa / phiên âm: nhỏ hơn dòng chính cùng nhóm một bậc rõ rệt
    for (const e of texts.filter(isSec)) {
      const fs = fontPx(e); const grp = slotOf(e).parentElement && slotOf(e).parentElement.closest('[data-n]');
      const peers = grp ? body.filter(b => grp.contains(b)) : [];
      const p = peers.length ? Math.max(...peers.map(fontPx)) : fs;
      let t = LADDER.find(v => v <= p / HIER.ratio + 0.01 && v >= HIER.minSec) || HIER.minSec;
      // dịch nghĩa nằm CẠNH dòng chính (cột riêng, vd Pattern List) chứ không nằm dưới → chỉ nhỏ hơn 1 bậc (≥ 36), đọc được từ xa
      const pe = peers.find(b => fontPx(b) >= p - 0.01); if (pe) { const a = R(e), bb = R(pe); if (a.left >= bb.right - 2 || a.right <= bb.left + 2) t = Math.max(t, 36); }
      if (t < fs - 0.01) set(e, Math.max(t, HIER.minSec));
    }
    // 2) tiêu đề trong khung: CỐ ĐỊNH 52px đậm ở mọi slide nội dung (người dùng chốt 23/10 – không to nhỏ theo từng slide);
    //    Cover / End / Section có luật tiêu đề lớn riêng (typoLayout). Tiêu đề dài thì xuống 2 dòng, chỉ co khi vẫn tràn.
    if (!/^Slide\/(Cover|End|Section|Section Character)$/.test(host.dataset.comp)) for (const e of texts.filter(isTitle)) { set(e, HIER.fixedTitle); e.style.fontWeight = '700'; if (body[0]) e.style.fontFamily = body[0].style.fontFamily || getComputedStyle(body[0]).fontFamily; /* cùng một font ở mọi slide */ e.style.lineHeight = '1.2'; e.dataset.fs = String(HIER.fixedTitle); }
  }
  function fitText(r) {
    const { host, filled } = r; const log = [];
    for (const el of filled) {
      let fs = fontPx(el); const start = fs;
      let guard = 0;
      while ((overflowPx(el, host) > 0.5 || overlapsOther(el, filled)) && guard++ < 14) {
        const next = LADDER.find(v => v < fs - 0.01); if (!next || next < STD.minFont) break;
        fs = next; el.style.fontSize = fs + 'px';
      }
      if (fs !== start) log.push({ slot: el.dataset.filled, from: start, to: fs });
    }
    // nhóm cùng loại (vocab_1.de, vocab_2.de…) dùng chung cỡ nhỏ nhất → đều nhau (thay fitCards)
    const groups = {};
    filled.forEach(el => { if (el.closest('[data-circle]')) return;   // số trong vòng tròn: cỡ theo số ký tự, không kéo cả nhóm nhỏ theo số 2 chữ số
      const g = el.dataset.filled.replace(/_(\d+|[A-H])(?=\.|$)/g, '_#'); if (g !== el.dataset.filled) (groups[g] = groups[g] || []).push(el); });
    for (const els of Object.values(groups)) { const m = Math.min(...els.map(fontPx)); els.forEach(e => { if (fontPx(e) > m) e.style.fontSize = m + 'px'; }); }
    return log;
  }

  // luật bố cục chữ đặc biệt (typo.js): ô to + khối chữ chính trước khi co chữ; giãn đều chống hở đáy sau khi co
  function typoLayout(r) {
    ansFit(r);   // trang đáp án gọn: chọn cỡ chữ chung cho cả trang trước các luật khác
    // tên người nói cùng slide: ô rộng bằng nhau (= tên dài nhất, ≤ 300px) để các câu thẳng hàng
    const sp = [...r.host.querySelectorAll('[data-n="speaker"], [data-n$=".speaker"]')].filter(e => e.dataset.text && e.offsetParent);
    if (sp.length > 1) { const s = scaleOf(r.host); const w = Math.min(300, Math.max(...sp.map(e => R(e).width / s))); sp.forEach(e => { e.style.width = Math.ceil(w) + 'px'; e.style.minWidth = ''; }); }
    // TƯƠNG PHẢN (RB-CH-07, thay sửa màu trong Figma): chữ không đạt 4,5 : 1 (chữ lớn 3 : 1) với nền → làm tối dần màu chữ (giữ sắc độ thương hiệu) tới khi đạt
    {
      const rgbOf = c => { const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(',').map(parseFloat); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
      const lumOf = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
      const ratio = (a, b) => { const x = lumOf(a), y = lumOf(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
      const bgFor = el => { for (let p = el; p && p !== r.host.parentElement; p = p.parentElement) { const cs = getComputedStyle(p); if (cs.backgroundImage && cs.backgroundImage !== 'none' && !/gradient/.test(cs.backgroundImage)) return null; const c = rgbOf(cs.backgroundColor); if (c && c.a > 0.5) return c; } return { r: 255, g: 255, b: 255 }; };
      r.host.querySelectorAll('[data-text]').forEach(t => { if (!t.offsetParent || !t.textContent.trim()) return; const cs = getComputedStyle(t), fg = rgbOf(cs.color), bg = bgFor(t); if (!fg || !bg) return;
        const fs = parseFloat(cs.fontSize), need = (fs >= 48 || (parseFloat(cs.fontWeight) >= 700 && fs >= 37) ? 3 : 4.5) + 0.15; if (ratio(fg, bg) >= need) return;
        const darkBg = lumOf(bg) < 0.4; let c = { ...fg };
        for (let i = 0; i < 20 && ratio(c, bg) < need; i++) c = darkBg ? { r: c.r + (255 - c.r) * 0.15, g: c.g + (255 - c.g) * 0.15, b: c.b + (255 - c.b) * 0.15 } : { r: c.r * 0.88, g: c.g * 0.88, b: c.b * 0.88 };
        t.style.color = `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`; });
    }
    // DANH SÁCH THOÁNG: cột danh sách (step_n, item_n, cando_n…) còn chỗ thì nới khe + đệm trên/dưới mỗi mục một chút (≤ +16px khe, ≤ +8px đệm); tràn thì trả lại
    {
      const LI = /^(item|step|cando|q|ex|line|u|f|task|guide|part|point|tip|rule|note|use|s)_\d+$/, s0 = scaleOf(r.host), done = new Set();
      r.host.querySelectorAll('[data-n]').forEach(e => { const L = e.parentElement; if (!LI.test(e.dataset.n) || !L || done.has(L) || L.style.flexDirection !== 'column') return; done.add(L);
        const kids = [...L.children].filter(k => LI.test(k.dataset.n || '') && k.offsetParent); if (kids.length < 3) return;
        const free = (R(L).bottom - R(kids[kids.length - 1]).bottom) / s0; if (free < 40) return;
        const g0 = parseFloat(L.style.rowGap || L.style.gap) || 0, addG = Math.min(16, Math.floor(free * 0.45 / (kids.length - 1))), addP = Math.min(8, Math.floor(free * 0.2 / kids.length / 2));
        const keep = kids.map(k => [k.style.paddingTop, k.style.paddingBottom, k.style.paddingLeft, k.style.paddingRight]), keepG = L.style.rowGap;
        L.style.rowGap = (g0 + addG) + 'px';
        kids.forEach(k => { const cs = getComputedStyle(k); k.style.paddingTop = (parseFloat(cs.paddingTop) + addP) + 'px'; k.style.paddingBottom = (parseFloat(cs.paddingBottom) + addP) + 'px'; if (cs.boxShadow !== 'none' || cs.backgroundColor !== 'rgba(0, 0, 0, 0)') { if (parseFloat(cs.paddingLeft) < 24) k.style.paddingLeft = '24px'; if (parseFloat(cs.paddingRight) < 24) k.style.paddingRight = '24px'; } });
        if (kids.some(k => R(k).bottom > R(L).bottom + 1) || r.filled.some(el => overflowPx(el, r.host) > 0.5)) { L.style.rowGap = keepG; kids.forEach((k, i) => { [k.style.paddingTop, k.style.paddingBottom, k.style.paddingLeft, k.style.paddingRight] = keep[i]; }); }
      });
    }
    // CĂN TRÊN-TRÁI LINH HOẠT (người dùng chốt 23/10): cột nội dung đang căn giữa dọc mà nội dung chiếm > 45% chiều cao cột → đẩy lên trên
    // (đọc trái → phải, trên → dưới); nội dung ít (< 45%) thì vẫn để giữa cho cân. Cover / End / Section giữ nguyên.
    if (!/^Slide\/(Cover|End|Section|Section Character)$/.test(r.host.dataset.comp)) {
      const card = r.host.querySelector('[data-n="card"]'); const s0 = scaleOf(r.host);
      if (card) [...card.querySelectorAll('[data-n]')].forEach(col => {
        if (col.style.flexDirection !== 'column' || col.style.justifyContent !== 'center' || !col.offsetParent) return;
        const kids = [...col.children].filter(k => k.offsetParent); if (!kids.length) return;
        const H = R(col).height; if (H < 200 * s0) return;
        const used = R(kids[kids.length - 1]).bottom - R(kids[0]).top;
        if (used / H > 0.45) col.style.justifyContent = 'flex-start';
      });
    }
    // BẢNG (Grammar Table / Table 3 / Table N / Exercise Table): bảng rộng hết khung, hàng cao đều và thoáng – chiếm ~80% chỗ trống, mỗi hàng 96–150px
    if (/^Slide\/(Grammar Table|Exercise Table)/.test(r.host.dataset.comp)) {
      const s = scaleOf(r.host), tb = r.host.querySelector('[data-n="table"]'), card = r.host.querySelector('[data-n="card"]');
      const rows = tb ? [...tb.children].filter(x => /^row_\d+$/.test(x.dataset.n || '') && x.offsetParent) : [];
      if (rows.length && card) {
        rows.forEach(x => { Object.assign(x.style, { width: 'auto', alignSelf: 'stretch', height: 'auto', alignItems: 'stretch' }); [...x.children].forEach(c => Object.assign(c.style, { height: 'auto', alignSelf: 'stretch', padding: '20px 32px' })); });
        const pb = parseFloat(getComputedStyle(card).paddingBottom) || 0;
        const avail = (R(card).bottom - R(tb).top) / s - pb;
        const per = Math.max(96, Math.min(150, Math.floor(avail * 0.8 / rows.length)));
        rows.forEach(x => { x.style.minHeight = per + 'px'; });
      }
    }
    // TIÊU ĐỀ LỚN (Cover / End / Section): luôn đậm, cách dòng 1,15, cỡ lớn nhất mà vẫn ≤ 2 dòng (120 → 79,5 → 64,5 → 55,5 → 48);
    // dòng phụ (tên khoá, nghĩa tiếng Việt) chữ thường 40,5, cách dòng 1,3 – phân cấp rõ, không tranh với tiêu đề
    const BIG = { 'Slide/Cover': ['title.de', 'title.vi'], 'Slide/End': ['thanks.de', 'thanks.vi'], 'Slide/Section': ['section.title', 'section.sub'], 'Slide/Section Character': ['section.title', 'section.sub'] }[r.host.dataset.comp];
    if (BIG) {
      const s = scaleOf(r.host), main = r.host.querySelector(`[data-filled="${BIG[0]}"]`), sub = r.host.querySelector(`[data-filled="${BIG[1]}"]`);
      const isEnd = r.host.dataset.comp === 'Slide/End';
      // dòng phụ: End ("Cảm ơn các bạn!") 55,5 – đọc rõ từ cuối lớp; Cover/Section 40,5
      if (sub) { Object.assign(sub.style, { fontWeight: '400', lineHeight: '1.3' }); sub.style.fontSize = (isEnd ? 55.5 : Math.min(40.5, fontPx(sub))) + 'px'; }
      // khẩu hiệu thương hiệu (TẠI … – TRI THỨC TRUYỀN TỪ TÂM): không nhỏ hơn 36 (End) / 30 (Cover)
      r.host.querySelectorAll('[data-var-text="info/tagline"], [data-n="tagline"], [data-n$=".tagline"]').forEach(t => { if (t.dataset.text && t.offsetParent) { const m = isEnd ? 36 : 30; if (fontPx(t) < m) t.style.fontSize = m + 'px'; } });
      if (main) {
        Object.assign(main.style, { fontWeight: '700', lineHeight: '1.15' });
        // chữ Hán / Kana / Hangul to và dày hơn chữ Latin cùng cỡ → trần 79,5
        if (/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/.test(main.textContent) && fontPx(main) > 79.5) main.style.fontSize = '79.5px';
        const start = fontPx(main);
        for (const v of LADDER.filter(v => v <= start + 0.01 && v >= 48)) { main.style.fontSize = v + 'px'; if (R(main).height / s <= v * 1.15 * 2 + 4 && main.scrollWidth <= main.clientWidth + 1) break; }
      }
    }
    const T = TY(); return T ? [...T.bigTiles(r.host), ...T.hero(r.host)] : [];
  }
  function typoSpread(r) { const T = TY(); const out = T ? T.spread(r.host, el => overflowPx(el, r.host)) : []; const b = breathe(r); if (b) out.push(b); return out; }
  // THỞ (người dùng chốt 23/10): còn trống dưới khung thì giãn khoảng cách giữa các phân mục MỘT CHÚT cho thoáng (≈ 35% chỗ trống, mỗi khe ≤ +32px)
  // – không kéo thẻ to ra, không cố lấp đầy; giãn xong mà tràn thì trả lại
  function breathe(r) {
    if (/^Slide\/(Cover|End|Section|Section Character)$/.test(r.host.dataset.comp)) return null;
    const card = r.host.querySelector('[data-n="card"]'); if (!card || !card.offsetParent) return null;
    const s = scaleOf(r.host), kids = [...card.children].filter(k => k.offsetParent); if (kids.length < 2) return null;
    const pb = parseFloat(getComputedStyle(card).paddingBottom) || 0;
    const free = (R(card).bottom - pb * s - R(kids[kids.length - 1]).bottom) / s; if (free < 80) return null;
    const add = Math.min(32, Math.floor(free * 0.35 / (kids.length - 1))); if (add < 6) return null;
    const g0 = parseFloat(card.style.rowGap || card.style.gap) || parseFloat(getComputedStyle(card).rowGap) || 0, keep = card.style.rowGap;
    card.style.rowGap = (g0 + add) + 'px';
    if (r.filled.some(el => overflowPx(el, r.host) > 0.5)) { card.style.rowGap = keep; return null; }
    return `giãn phân mục +${add}px`;
  }

  // ---------- soát lỗi (chuẩn v2.0) ----------
  function audit(r) {
    const { host, filled } = r; const s = scaleOf(host); const out = [];
    const H = R(host);
    for (const el of filled) {
      const ov = overflowPx(el, host);
      if (ov > 0.5) out.push({ lv: 'do', code: 'spill', slot: el.dataset.filled, msg: `Chữ tràn ${Math.round(ov)}px ở ô ${el.dataset.filled}`, src: 'Mẫu' });
      const fs = fontPx(el);
      if (fs < STD.minFont - 0.01) out.push({ lv: 'do', code: 'minFont', slot: el.dataset.filled, msg: `Cỡ chữ ${fs}px dưới ngưỡng ${STD.minFont}`, src: 'Nội dung' });
      else if (fs < STD.warnFont - 0.01) out.push({ lv: 'vang', code: 'smallFont', slot: el.dataset.filled, msg: `Cỡ chữ ${fs}px nhỏ (nên ≥ ${STD.warnFont})`, src: 'Nội dung' });
      const a = R(el); const m = STD.safe * s;
      if (a.left < H.left + m - 1 || a.right > H.right - m + 1 || a.bottom > H.bottom - m + 1) out.push({ lv: 'vang', code: 'safeArea', slot: el.dataset.filled, msg: `Ô ${el.dataset.filled} chạm lề an toàn ${STD.safe}px`, src: 'Mẫu' });
    }
    // chồng lấn giữa các ô đã điền
    for (let i = 0; i < filled.length; i++) for (let j = i + 1; j < filled.length; j++) {
      const a = filled[i], b = filled[j]; if (a.contains(b) || b.contains(a)) continue;
      const x = R(a), y = R(b);
      const w = Math.min(x.right, y.right) - Math.max(x.left, y.left), h = Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top);
      if (w > 4 * s && h > 4 * s) out.push({ lv: 'do', code: 'overlap', slot: a.dataset.filled, msg: `Ô ${a.dataset.filled} chồng lên ${b.dataset.filled}`, src: 'Mẫu' });
    }
    for (const el of filled) { const ff = getComputedStyle(el).fontFamily.split(',')[0]; if (CJK_FONT.test(ff) && VIET.test(el.textContent)) out.push({ lv: 'do', code: 'vietFont', slot: el.dataset.filled, msg: `Chữ Việt ở ô ${el.dataset.filled} đang dùng font ${ff.replace(/["']/g, '')} (RB-CH-04)`, src: 'Mẫu' }); }
    const words = filled.map(e => e.textContent).join(' ').split(/\s+/).filter(Boolean).length;
    if (words > STD.maxWords && !STD.wordsSkip.test(host.dataset.comp)) out.push({ lv: 'vang', code: 'words', msg: `${words} từ (chuẩn ≤ ${STD.maxWords} từ / slide)`, src: 'Nội dung' });
    const imgs = host.querySelectorAll('.pls-imgslot'); const shown = [...imgs].filter(e => e.offsetParent !== null);
    if (shown.length) out.push({ lv: 'vang', code: 'noImage', msg: `${shown.length} ô thiếu hình: ${shown.map(e => (e.dataset.imgLabel || '').replace(/^Thiếu hình:?\s*/, '') || '?').join(', ')}`, src: 'Ảnh' });
    if (r.missing.length) out.push({ lv: 'do', code: 'noSlot', msg: `Mẫu không có ô: ${r.missing.join(', ')}`, src: 'Nội dung' });
    return out;
  }
  function score(issues, fitLog) {   // trọng số tạm, giữ tinh thần W của fit_js: tràn > chồng > chữ nhỏ
    let sc = 100;
    for (const i of issues) sc -= { spill: 40, overlap: 30, minFont: 25, smallFont: 6, safeArea: 4, words: 3, noImage: 0, noSlot: 20 }[i.code] || 2;
    sc -= fitLog.reduce((a, f) => a + Math.max(0, (f.from - f.to) / 8), 0);
    return Math.max(0, Math.round(sc));
  }

  // ---------- tự chọn mẫu + chia slide (thay build/score/apply của fit_js) ----------
  const AUTO = {
    vocab: { comps: ['Slide/Vocab Grid 8', 'Slide/Vocab Grid 6', 'Slide/Vocab Grid 4'], cap: c => +c.match(/\d+$/)[0], item: (it, i) => ({ [`vocab_${i}.de`]: it.de, [`vocab_${i}.vi`]: it.vi }) }
  };
  function plans(spec) {
    const A = AUTO[spec.auto]; const N = spec.items.length; const out = [];
    const caps = A.comps.map(c => [c, A.cap(c)]);
    // phương án: 1 loại mẫu chia đều; hoặc ghép 2 loại (lớn trước, phần dư vào loại vừa đủ)
    for (const [c, cap] of caps) { const k = Math.ceil(N / cap); if (k <= 4) out.push(Array(k).fill(c)); }
    for (const [c1, cap1] of caps) for (const [c2, cap2] of caps) { if (cap2 >= cap1) continue; const full = Math.floor(N / cap1), rest = N - full * cap1; if (full >= 1 && rest > 0 && rest <= cap2 && full + 1 <= 4) out.push([...Array(full).fill(c1), c2]); }
    const uniq = {}; out.forEach(p => uniq[p.join('|')] = p); return Object.values(uniq);
  }
  function splitItems(items, comps, capOf) {
    const total = items.length; const caps = comps.map(capOf); const sum = caps.reduce((a, b) => a + b, 0);
    let left = total; const counts = caps.map((c, i) => { const rem = caps.slice(i + 1).reduce((a, b) => a + b, 0); const n = Math.min(c, Math.max(Math.ceil(left * c / (c + rem)), left - rem)); left -= n; return n; });
    let p = 0; return counts.map(n => { const part = items.slice(p, p + n); p += n; return part; });
  }
  function expand(spec, common) {   // spec auto → các phương án [{label, slides:[{comp,data}], fill, cover, fillW}]
    const X = (root.PLS_AUTO || {})[spec.auto];
    if (X && X.expand) return X.expand(spec).map(p => Object.assign(p, { slides: p.slides.map(s => ({ comp: s.comp, layout: s.layout, common, data: s.data })) }));
    const A = AUTO[spec.auto];
    return plans(spec).map(p => {
      const parts = splitItems(spec.items, p, A.cap);
      return { fill: spec.items.length / p.reduce((a, c) => a + A.cap(c), 0), cover: 1, fillW: 30, label: p.map(c => c.replace('Slide/Vocab Grid ', 'lưới ')).join(' + ') + ` (${p.length} slide)`, slides: parts.map((part, si) => ({ comp: p[si], common, data: Object.assign({ 'header.section': spec.section || '' }, ...part.map((it, i) => A.item(it, i + 1))) })) };
    });
  }

  // ---------- xuất PPTX: DOM → model của PPTX.build cũ ----------
  const toRGB = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(',').map(s => parseFloat(s)); return { c: [v[0] / 255, v[1] / 255, v[2] / 255], a: v.length > 3 ? v[3] : 1 }; };
  const STYLE = w => ({ 100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black' })[Math.round(w / 100) * 100] || 'Regular';
  async function imgBytes(url) {
    const im = new Image(); im.crossOrigin = 'anonymous'; im.src = url; await im.decode();
    const cv = document.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight; cv.getContext('2d').drawImage(im, 0, 0);
    const blob = await new Promise(res => cv.toBlob(res, 'image/png')); return new Uint8Array(await blob.arrayBuffer());
  }
  async function svgPng(svg, color, w, h) {
    const s = svg.replace(/currentColor/g, color).replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" `.includes('xmlns') && svg.includes('xmlns') ? '<svg ' : '<svg xmlns="http://www.w3.org/2000/svg" ').replace(/width="100%" height="100%"/, `width="${w}" height="${h}"`);
    const im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s); await im.decode();
    const cv = document.createElement('canvas'); cv.width = Math.max(1, w); cv.height = Math.max(1, h); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
    const blob = await new Promise(res => cv.toBlob(res, 'image/png')); return new Uint8Array(await blob.arrayBuffer());
  }
  async function toModel(hosts, opts) {
    const model = { w: 1920, h: 1080, slides: [], media: {} };
    let uid = 0;
    for (const host of hosts) {
      const s = scaleOf(host), H = R(host); const items = [];
      const box = el => { const a = R(el); return { x: (a.left - H.left) / s, y: (a.top - H.top) / s, w: a.width / s, h: a.height / s }; };
      const anims = [];
      const walk = async el => {   // phần tử có hiệu ứng → gom thành 1 nhóm để PowerPoint chạy Appear cho cả khối
        if (!el.dataset.fx || el.offsetParent === null) return inner(el);
        const start = items.length; await inner(el);
        const kids = items.splice(start); if (!kids.length) return;
        const id = 'fx' + (uid++); const b0 = box(el);
        items.push({ k: 'group', id, name: el.dataset.n + ' (hiệu ứng)', ...b0, kids });
        anims.push({ id, fx: el.dataset.fx, when: el.dataset.fxWhen, order: +el.dataset.fxOrder });
      };
      const inner = async el => {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        const op = parseFloat(cs.opacity);
        const b = box(el); if (b.w < 0.5 && b.h < 0.5 && !el.children.length) return;
        const bg = toRGB(cs.backgroundColor); const shadow = cs.boxShadow !== 'none' ? cs.boxShadow : '';
        const ins = shadow.match(/(rgba?\([^)]+\))\s+0px\s+0px\s+0px\s+([\d.]+)px\s+inset/) || shadow.match(/inset\s+0px\s+0px\s+0px\s+([\d.]+)px\s+(rgba?\([^)]+\))/);
        let stroke = null;
        if (ins) { const c = toRGB(ins[1].startsWith('rgb') ? ins[1] : ins[2]); const w = parseFloat(ins[1].startsWith('rgb') ? ins[2] : ins[1]); if (c && c.a > 0) stroke = { w, c: c.c, a: c.a }; }
        else if (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none') { const c = toRGB(cs.borderTopColor); if (c && c.a > 0) stroke = { w: parseFloat(cs.borderTopWidth), c: c.c, a: c.a, dash: cs.borderTopStyle === 'dashed' }; }
        const rad = parseFloat(cs.borderTopLeftRadius) || 0;
        if ((bg && bg.a > 0.01) || stroke) items.push({ k: 'shape', id: 'n' + (uid++), name: el.dataset.n || 'shape', ...b, op, shape: { fill: bg && bg.a > 0.01 ? bg : null, stroke, rad: Math.min(rad, b.w / 2, b.h / 2) } });
        const bi = cs.backgroundImage.match(/url\("?([^")]+)"?\)/);
        if (bi && opts.images !== false) { const key = bi[1]; if (!model.media[key]) { try { model.media[key] = /^https?:/.test(key) && root.PLS_IMAGES ? await root.PLS_IMAGES.bytes(key) : await imgBytes(key); } catch (e) { console.warn('[PLS] ảnh không đọc được', key, e); } } if (model.media[key]) { const pd = parseFloat(cs.paddingTop) || 0; let ib = el.dataset.imgId ? { x: b.x + pd, y: b.y + pd, w: b.w - 2 * pd, h: b.h - 2 * pd } : b;
          const by = model.media[key]; if (el.dataset.imgId && by && by[1] === 0x50) { const dv = new DataView(by.buffer, by.byteOffset); const iw = dv.getUint32(16), ih = dv.getUint32(20); const k = Math.min(ib.w / iw, ib.h / ih); const w = iw * k, h = ih * k; ib = { x: ib.x + (ib.w - w) / 2, y: ib.y + (ib.h - h) / 2, w, h }; } /* giữ tỉ lệ ảnh, không bóp méo */ items.push({ k: 'img', id: 'n' + (uid++), name: el.dataset.n || 'img', ...ib, op, png: key, fit: el.dataset.imgId ? 'contain' : 'cover' }); } }
        if (el.dataset.icon && root.PLS_ICONS && root.PLS_ICONS[el.dataset.icon]) {   // icon SVG → ảnh PNG (x4) để PowerPoint/Google Slides hiển thị giống nhau
          const key = 'icon:' + el.dataset.icon + ':' + cs.color;
          if (!model.media[key]) { try { model.media[key] = await svgPng(root.PLS_ICONS[el.dataset.icon], cs.color, Math.round(b.w * 4), Math.round(b.h * 4)); } catch (e) { console.warn('[PLS] icon', e); } }
          if (model.media[key]) items.push({ k: 'img', id: 'n' + (uid++), name: el.dataset.n, ...b, op, png: key });
          return;
        }
        if (el.classList.contains('pls-imgslot') && el.offsetParent !== null) items.push({ k: 'text', id: 'n' + (uid++), name: 'img-placeholder', ...b, ah: 'CENTER', av: 'CENTER', auto: 'NONE', segs: [{ t: el.dataset.imgLabel || 'Ảnh', f: 'Arial', st: 'Regular', sz: 24, c: { c: [0.45, 0.47, 0.5], a: 1 } }] });
        if (el.dataset.text) {
          const t = el.innerText; if (!t.trim()) return;
          const span = el.querySelector('[data-t]'); const tb = box(span || el);
          const c = toRGB(cs.color) || { c: [0, 0, 0], a: 1 };
          const ff = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
          const lh = cs.lineHeight === 'normal' ? null : { unit: 'PIXELS', value: parseFloat(cs.lineHeight) };
          const ea = host.dataset.exportFont || undefined;
          const tc = cs.textTransform === 'uppercase' ? 'UPPER' : cs.textTransform === 'lowercase' ? 'LOWER' : undefined;
          const seg0 = { t, f: ff, ea, st: STYLE(parseFloat(cs.fontWeight)), sz: parseFloat(cs.fontSize), c, lh, tc };
          let segs = [seg0];
          if (el.querySelector('[data-seg]')) {   // F.emph: nhiều kiểu chữ trong 1 ô → nhiều run
            segs = []; const tgt = span || el;
            for (const nd of tgt.childNodes) { const tt = nd.textContent; if (!tt) continue;
              if (nd.nodeType === 1) { const c2 = getComputedStyle(nd); segs.push(Object.assign({}, seg0, { t: tt, st: STYLE(parseFloat(c2.fontWeight)), c: toRGB(c2.color) || c })); }
              else segs.push(Object.assign({}, seg0, { t: tt })); }
          }
          items.push({ k: 'text', id: el.dataset.filled || ('n' + uid++), name: el.dataset.n, x: b.x, y: span ? tb.y : b.y, w: b.w, h: span ? tb.h : b.h, op, ah: { left: 'LEFT', center: 'CENTER', right: 'RIGHT', justify: 'JUSTIFIED', start: 'LEFT' }[cs.textAlign] || 'LEFT', av: 'TOP', auto: cs.whiteSpace === 'pre' ? 'WIDTH_AND_HEIGHT' : 'HEIGHT', segs });
          return;
        }
        for (const k of el.children) await walk(k);
      };
      await walk(host.firstElementChild);
      const bgc = toRGB(getComputedStyle(host.firstElementChild).backgroundColor);
      const T = opts.transition || {};   // chuyển cảnh (transitionXml cũ): tắt mặc định vì chuẩn v2.0 RB-PPT-08 yêu cầu 0 chuyển cảnh
      const trOn = T.style && T.style !== 'NONE' && (T.scope !== 'section' || /^Slide\/(Cover|Section|Section Character|End)$/.test(host.dataset.comp));
      model.slides.push({ name: host.dataset.comp, bg: bgc ? bgc.c : null, items, anims: anims.sort((a, b) => a.order - b.order), tr: trOn ? { style: T.style, duration: T.duration || 0.5 } : null });
    }
    return model;
  }

  // ---------- font khi xuất PPTX (PPTX_CFG của plugin): tiêu đề Verdana, nội dung Arial, chữ bản ngữ theo thiết bị ----------
  // Dựng lại slide bằng đúng font sẽ dùng trên máy giáo viên rồi CO CHỮ LẠI, để PPTX không tràn khi đổi font.
  const PPTX_CFG = {
    heading: 'Verdana', body: 'Arial',
    devices: {
      win: { tag: 'Windows', fonts: { 'Saechang': 'Malgun Gothic', 'Sakumi': 'Yu Gothic', 'Đắc Nhân': 'Microsoft YaHei' } },
      mac: { tag: 'Mac, iPad', fonts: { 'Saechang': 'Apple SD Gothic Neo', 'Sakumi': 'Hiragino Sans', 'Đắc Nhân': 'PingFang SC' } },
      and: { tag: 'Android, Google Slides', fonts: { 'Saechang': 'Noto Sans KR', 'Sakumi': 'Noto Sans JP', 'Đắc Nhân': 'Noto Sans SC' } }
    },
    latinInNative: ['Đắc Nhân']
  };
  const VIET = /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
  const CJK_FONT = /Gothic A1|Noto Sans (JP|KR|SC)|Noto Serif (JP|KR|SC)|KaiTi|Malgun|Yu Gothic|YaHei|Hiragino|PingFang|Apple SD/i;
  const CJK = /[\u3000-\u30ff\u3400-\u9fff\uac00-\ud7af\u1100-\u11ff\uf900-\ufaff\uff00-\uffef]/;
  function devicesOf(brand) { const out = Object.entries(PPTX_CFG.devices).filter(([, d]) => d.fonts[brand]).map(([key, d]) => ({ key, tag: d.tag, font: d.fonts[brand] })); return out.length ? out : [{ key: 'all', tag: 'Mọi thiết bị', font: null }]; }
  function applyExportFonts(host, brand, device) {
    const native = device && device.font;
    host.dataset.exportFont = native || '';
    host.querySelectorAll('[data-text], [data-ruby], [data-blocks]').forEach(el => {
      const ff = el.style.fontFamily || ''; if (!ff) return;   // mảnh chữ ruby/khối: thừa hưởng font của khung
      const role = /native/.test(ff) && native ? 'native' : (/heading|display/.test(ff) ? 'heading' : 'body');
      const txt = el.textContent || '';
      let fam = role === 'native' ? native : role === 'heading' ? PPTX_CFG.heading : PPTX_CFG.body;
      if (fam === native && VIET.test(txt) && !CJK.test(txt)) fam = role === 'heading' ? PPTX_CFG.heading : PPTX_CFG.body;   // RB-CH-04 / fixFontViet: chữ Việt không nằm trong font Hán–Hàn–Nhật
      if (native && CJK.test(txt) && PPTX_CFG.latinInNative.includes(brand)) fam = native;
      el.style.fontFamily = `'${fam}'` + (native ? `, '${native}'` : '') + ', sans-serif';
      el.style.fontWeight = (parseFloat(getComputedStyle(el).fontWeight) || 400) >= 600 ? '700' : '400';
    });
  }

  // ---------- HIỆU ỨNG (PLS_ANIM.roleOf + F.FX + F.fxPlan) – chuẩn v2.0 RB-PPT-08: chỉ Appear, chỉ nội dung cần ẩn ----------
  const ROLE_RULES = [[/^(brand\.bg|bg\/.*|bg\.img|header|section|topic|spacer|logo.*|card|body)$/, 'frame'], [/^(a|a\.\w+|ans\w*|answer\w*|solution\w*)$/i, 'answer'],
    [/^(instruction(\.vi)?|task(\.vi)?|situation|track_box|track)$/, 'instruction'], [/^(question|q|q\.\w+|q_\d+)$/, 'question'], [/^opt_[A-Z]$/, 'option'],
    [/^(item_\d+|l_\d+|r_\d+|row_\d+|line_\d+|ex_\d+|vocab_\d+|letter_\d+|card_\d+|col_\d+|img_\d+_box|stroke_\d+)$/, 'item'], [/^(title|h|head|.+\.title)$/, 'title'],
    [/^(img|img_\d+|images|char\.img|img_box|cap|cap_\d+)$/, 'media'], [/^(rule|rule_box|model_box|text_box|example_box|sound_box|char_box|info|qa|list|grid|table|options|items|columns|left|right|examples|lines)$/, 'block']];
  const FX = { title: null, instruction: null, media: null, block: null, item: { fx: 'appear', when: 'click', each: true }, option: { fx: 'appear', when: 'click', each: true }, question: { fx: 'appear', when: 'click' }, answer: { fx: 'appear', when: 'click', each: true } };
  const FX_ORD = ['question', 'option', 'item', 'answer'];
  const roleOfName = nm => { nm = String(nm || '').replace(/\s+[@#].*$/, ''); for (const [re, r] of ROLE_RULES) if (re.test(nm)) return r; return null; };
  function planFx(r, opt) {
    opt = opt || {}; const host = r.host;
    host.querySelectorAll('[data-fx]').forEach(e => { delete e.dataset.fx; delete e.dataset.fxWhen; delete e.dataset.fxOrder; });
    if (opt.on === false) return (r.fx = []);
    const maxSteps = opt.pace === 'nhanh' ? 3 : opt.pace === 'chậm' ? 8 : 6;
    const units = [];
    const hasContent = el => [...el.querySelectorAll('[data-filled], [data-img-id]')].concat(el.dataset.filled ? [el] : []).some(x => x.offsetParent !== null);
    const walk = el => {
      if (el.offsetParent === null && el !== host.firstElementChild) return;
      const role = roleOfName(el.dataset.n);
      if (role && FX[role] && el !== host.firstElementChild && el.dataset.n !== 'row_0') { if (hasContent(el)) units.push({ el, role }); return; }   // row_0 = hàng tiêu đề bảng: hiện sẵn
      for (const k of el.children) walk(k);
    };
    walk(host.firstElementChild);
    const out = []; let order = 0;
    for (const role of FX_ORD) {
      if (role === 'answer' && opt.hideAnswer === false) continue;
      const us = units.filter(u => u.role === role); if (!us.length) continue;
      const each = FX[role].each && us.length <= maxSteps;
      us.forEach((u, i) => { const when = i === 0 || each ? 'click' : 'with'; order++; u.el.dataset.fx = 'appear'; u.el.dataset.fxWhen = when; u.el.dataset.fxOrder = order; out.push({ n: u.el.dataset.n, role, fx: 'appear', when, order }); });
    }
    return (r.fx = out);
  }
  const fxSteps = fx => fx.filter(a => a.when === 'click').length;

  root.PLS_ENGINE = { render, fitText, audit, score, expand, toModel, find, LADDER, STD, devicesOf, applyExportFonts, PPTX_CFG, planFx, fxSteps, roleOfName, hierarchy, typoLayout, typoSpread };
})(window);
