// Giao diện PLS Studio (bản sơ lược): danh sách slide · canvas · soát lỗi / phương án / dữ liệu.
// window.PLS là cổng lệnh (kiểm thử / điều khiển bằng lệnh JS) – giữ tên gần với fit_js.
(function () {
  'use strict';
  const E = window.PLS_ENGINE;
  const $ = s => document.querySelector(s);
  const state = { tr: { style: 'NONE', duration: 0.5, scope: 'all' }, fx: { on: true, pace: 'vừa', hideAnswer: true }, fxStep: null, fxp: {}, fxObj: {}, fxOrd: {}, fxSel: null, notesOv: {}, layoutSel: {}, aud: 'teacher', fontMode: 'safe', hier: true, device: 'win', spec: null, brand: 'Betreux', slides: [], sel: 0, overrides: {}, imgOv: {}, choice: {}, building: false };
  const BRANDS = ['Betreux', 'Creative English', 'Créatis', 'Saechang', 'Sakumi', 'Đắc Nhân'];

  // ---------- dựng cả bài ----------
  // MÀN HÌNH CHƯA CÓ BÀI (người dùng chốt 23/10: bỏ bài mẫu Betreux lúc mở trang) – lời chào + 3 bước + việc app làm giúp
  // Mỗi tab có TRANG GIỚI THIỆU riêng (người dùng chốt 23/10): Slide · Sách (ở đây) · Nghiên cứu (research.js) – dùng chung bộ khung .w-*
  const W_SVG = { doc: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2"><rect x="22" y="18" width="70" height="88" rx="3"/><path d="M34 40h46M34 52h46M34 64h30M34 76h38"/><path d="M70 86l10 10 22-26" stroke-width="3"/></svg>',
    globe: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2"><circle cx="64" cy="64" r="44"/><ellipse cx="64" cy="64" rx="18" ry="44"/><path d="M20 64h88M28 42h72M28 86h72"/></svg>',
    slides: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2"><rect x="16" y="30" width="62" height="44" rx="2"/><rect x="44" y="52" width="62" height="44" rx="2" fill="currentColor" fill-opacity=".15"/><path d="M58 70h34M58 80h22"/></svg>',
    play: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2"><rect x="14" y="24" width="92" height="62" rx="3"/><path d="M52 42l22 13-22 13z" fill="currentColor" fill-opacity=".2"/><path d="M30 100h60"/></svg>',
    book: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2"><path d="M60 32c-12-8-28-10-42-8v66c14-2 30 0 42 8 12-8 28-10 42-8V24c-14-2-30 0-42 8z"/><path d="M60 32v66"/><path d="M28 44h20M28 54h20M72 44h20M72 54h20"/></svg>',
    key: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2"><rect x="20" y="20" width="80" height="80" rx="3"/><path d="M32 42h56M32 60h56M32 78h56M56 30v62"/><path d="M38 50l4 4 8-8M38 68l4 4 8-8" stroke-width="2.5"/></svg>',
    print: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2"><rect x="34" y="18" width="52" height="28" rx="2"/><rect x="18" y="46" width="84" height="38" rx="3"/><rect x="34" y="70" width="52" height="34" rx="2" fill="currentColor" fill-opacity=".15"/><path d="M42 82h36M42 92h24"/></svg>' };
  const W_PAGES = {
    slide: { h1: 'Dựng slide bài giảng của một buổi học trong vài phút', cta: 'Nhập Excel S5 + S6', note: 'Chọn cùng lúc 2 file .xlsx',
      cards: [['Nhập<br>Excel', 'File S6 (nội dung) và S5 (khung buổi, dặn dò)', 'doc'], ['Máy chọn<br>mẫu & soát', 'Thử nhiều phương án, co chữ, soát 29 luật chuẩn v2.0', 'globe'], ['Hiệu ứng<br>& ghi chú', 'Khoanh đáp án, nối dây, ghi chú giảng – xuất PPTX sửa tiếp được', 'play']],
      kicker: 'Slide làm được gì', h2: 'Từ Excel tới slide lên lớp', sub: 'Chạy tự động sau khi nhập Excel – bạn chỉ xem và sửa chỗ cần.',
      steps: [['⇪', 'Đọc giáo trình', 'Từ vựng, ngữ pháp, phát âm, mẫu câu, bài nghe – đọc, BTVN của buổi'],
        ['▦', 'Chọn mẫu slide', 'Mỗi slide thử nhiều mẫu, giữ mẫu ít lỗi, chữ to và đủ nội dung'],
        ['✓', 'Soát lỗi chuẩn v2.0', 'Tràn chữ, thiếu ảnh, sai font – báo đỏ / vàng và trỏ thẳng tới slide'],
        ['✎', 'Sửa trực tiếp', 'Bấm vào chữ trên slide để sửa; đổi ảnh, đổi phương án ở bảng bên phải'],
        ['▶', 'Hiệu ứng & ghi chú', 'Bộ hiệu ứng nhanh theo loại slide; ghi chú giảng, lưu ý, đáp án dưới mỗi slide', 1],
        ['⤓', 'Xuất PPTX + PDF', 'Một lần bấm: PPTX có hiệu ứng + ghi chú, kèm sách in', 1]] },
    book: { h1: 'Dàn sách in khổ 19×27 từ cùng file Excel', cta: 'Nhập Excel S5 + S6', note: 'Sách dựng từ đúng buổi bạn chọn',
      cards: [['Khổ<br>19×27', 'Lề trong – ngoài bằng nhau, đánh số trang liên tục', 'book'], ['Đáp án<br>kèm giải thích', 'Bảng đáp án theo từng Bài, có lời giải thích như sách giáo khoa', 'key'], ['In ra<br>PDF', 'Mở hộp thoại in đã đặt sẵn tên file và khổ giấy → Lưu PDF', 'print']],
      kicker: 'Sách làm được gì', h2: 'Từ Excel tới sách in', sub: 'Cùng dữ liệu với slide – sửa Excel là slide và sách khớp nhau.',
      steps: [['⇪', 'Đọc giáo trình', 'Lấy nội dung buổi học giống hệt phần slide'],
        ['Aa', 'Một họ font', 'Noto cho mọi ngôn ngữ, hiện đúng chữ Hán, Kana, Hangul – dễ canh, dễ so'],
        ['▤', 'Dàn trang tự động', 'Phân cấp tiêu đề, khoảng cách theo nhịp; bảng dài tự tách sang trang sau'],
        ['№', 'Nhãn "Bài 1, Bài 2…"', 'Bài tập đánh số rõ ràng, phần Luyện tập và Lời bài nghe tách riêng'],
        ['✓', 'Đáp án cuối sách', 'Theo từng phần, từng Bài, kèm giải thích', 1],
        ['⎙', 'Xuất PDF', 'Chọn "Lưu dưới dạng PDF" trong hộp thoại in', 1]] } };
  function showEmpty() {
    document.body.classList.add('empty'); state.slides = [];
    const kind = state.view && state.view !== 'slide' && state.view !== 'research' ? 'book' : 'slide';
    const w = $('#welcome'); if (!w || w.dataset.kind === kind) return; w.dataset.kind = kind;
    const P = W_PAGES[kind];
    const h = new Date().getHours(), hi = h < 11 ? 'Chào buổi sáng' : h < 14 ? 'Chào buổi trưa' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
    w.innerHTML = `<section class="w-hero"><div><p class="hi">${hi}</p><h1>${P.h1}</h1>
        <div class="acts"><button type="button" class="btn primary" id="wImport">${P.cta}</button><span class="muted">${P.note}</span></div></div>
      <div class="w-cards">${P.cards.map((c, i) => `<div class="w-card c${i + 1}"><span class="n">0${i + 1}</span><b>${c[0]}</b><p>${c[1]}</p>${W_SVG[c[2]]}</div>`).join('')}</div></section>
      <div class="w-low"><section><p class="muted" style="margin:0 0 2px;font-size:12px">${P.kicker}</p><h2>${P.h2}</h2><p class="sub">${P.sub}</p>
        <ol class="w-steps">${P.steps.map(x => `<li${x[3] ? ' class="dark"' : ''}><span class="ic">${x[0]}</span><b>${x[1]}</b><span>${x[2]}</span></li>`).join('')}</ol></section>
        <section class="w-side"><p class="muted" style="margin:0 0 2px;font-size:12px">Mở lại</p><h2>File gần đây</h2><p class="sub">Các bộ Excel đã nhập trên máy này – bấm để mở lại đúng buổi, đúng brand.</p>
          <div id="wRecent"><p class="muted">Đang tải…</p></div></section></div>`;
    $('#wImport').onclick = () => $('#xlsx').click();
    drawRecent();
  }
  // FILE GẦN ĐÂY (người dùng chốt 23/10): lưu bộ Excel đã nhập (đã đọc thành dữ liệu) trong IndexedDB của trình duyệt – chỉ trên máy này, tối đa 6 bộ
  const RECENT_MAX = 30, RECENT_SHOW = 6;   // giữ 30 bộ gần nhất; hiện 6 (lưới 2 cột × 3 hàng – người dùng chốt 23/10: khung to, ít nhất 2 hàng thẻ), còn lại bấm "Xem thêm" / ô tìm (người dùng hỏi 23/10)
  const RDB = (() => { let dbp;
    const open = () => dbp || (dbp = new Promise((res, rej) => { const q = indexedDB.open('pls-studio', 1); q.onupgradeneeded = () => q.result.createObjectStore('recent', { keyPath: 'id' }); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }));
    const run = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction('recent', mode); const q = fn(t.objectStore('recent')); t.oncomplete = () => res(q && 'result' in q ? q.result : undefined); t.onerror = () => rej(t.error); }); };
    return { all: () => run('readonly', st => st.getAll()), get: id => run('readonly', st => st.get(id)), put: r => run('readwrite', st => st.put(r)), del: id => run('readwrite', st => st.delete(id)) }; })();
  async function saveRecent(books, names, files) {
    try { const id = names.slice().sort().join(' + '); const old = await RDB.get(id);
      await RDB.put({ id, names, books, files: files || (old && old.files) || null, at: Date.now(), buoi: old && old.buoi, brand: old && old.brand }); state.recentId = id;
      const all = (await RDB.all()).sort((a, b) => b.at - a.at); for (const r of all.slice(RECENT_MAX)) await RDB.del(r.id);
    } catch (e) { console.warn('[PLS] không lưu được file gần đây', e); } }
  async function touchRecent() {   // nhớ buổi + brand đang mở để lần sau mở lại đúng chỗ
    if (!state.recentId) return; try { const r = await RDB.get(state.recentId); if (r) { r.buoi = +$('#buoi').value; r.brand = state.brand; r.at = Date.now(); await RDB.put(r); } } catch (e) { /* bỏ qua */ } }
  const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'vừa xong' : m < 60 ? m + ' phút trước' : m < 1440 ? Math.round(m / 60) + ' giờ trước' : Math.round(m / 1440) + ' ngày trước'; };
  async function drawRecent() {
    const box = $('#wRecent'); if (!box) return; let rs = [];
    try { rs = (await RDB.all()).sort((a, b) => b.at - a.at); } catch (e) { box.innerHTML = '<p class="muted">Trình duyệt này không cho lưu file gần đây.</p>'; return; }
    if (!rs.length) { box.innerHTML = '<div class="rc-list"><div class="w-empty rc-ghost"><b>Chưa có file nào</b><span class="muted">Bộ Excel bạn nhập sẽ hiện ở đây để mở lại lần sau.</span></div><div class="rc-ghost"></div><div class="rc-ghost"></div></div>'; return; }
    box.innerHTML = '';
    // nhiều hơn 5 bộ → ô tìm (theo tên khoá, tên file, brand, buổi) + nút Xem thêm
    const list = document.createElement('div'); list.className = 'rc-list'; let q = '', all = false;
    const textOf = r => { const c = ((r.books.s6 || {})['S6-Thông tin khoá'] || []).find(x => /Tên khoá/.test(x['Mục'] || '')) || {}; return [c['Nội dung'], ...r.names, r.brand, r.buoi ? 'buổi ' + r.buoi : ''].join(' ').toLowerCase(); };
    const fold = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');   // gõ không dấu vẫn tìm được
    let more = null;
    const paint = () => { list.innerHTML = ''; const toks = fold(q.toLowerCase()).split(/[\s_.-]+/).filter(Boolean), hit = toks.length ? rs.filter(r => { const t = fold(textOf(r)).replace(/[_.-]+/g, ' '); return toks.every(k => t.includes(k)); }) : rs; /* nhiều từ: khớp đủ từng từ, không cần đúng thứ tự */ const shown = q || all ? hit : hit.slice(0, RECENT_SHOW);
      if (!shown.length) list.innerHTML = '<p class="muted" style="grid-column:1/-1">Không thấy bộ nào khớp.</p>';
      shown.forEach(row); if (more) { more.hidden = !!q || rs.length <= RECENT_SHOW; more.textContent = all ? 'Thu gọn' : `Xem thêm (${rs.length - RECENT_SHOW})`; } };
    if (rs.length > RECENT_SHOW) { const sq = document.createElement('input'); sq.type = 'search'; sq.className = 'rc-search'; sq.placeholder = `Tìm trong ${rs.length} bộ (tên khoá, file, brand, buổi)…`; sq.setAttribute('aria-label', 'Tìm file gần đây');
      sq.oninput = () => { q = sq.value.trim(); paint(); }; box.appendChild(sq); }
    box.appendChild(list);
    if (rs.length > RECENT_SHOW) { more = document.createElement('button'); more.type = 'button'; more.className = 'btn rc-more'; more.onclick = () => { all = !all; paint(); }; box.appendChild(more); }
    function row(r) { const box = list; const it = document.createElement('div'); it.className = 'item recent';
      const course = ((r.books.s6 || {})['S6-Thông tin khoá'] || []).find(x => /Tên khoá/.test(x['Mục'] || '')) || {};
      const open = document.createElement('button'); open.type = 'button'; open.className = 'rc-open';
      open.innerHTML = `<b></b><span class="muted"></span><span class="tag" style="--c:var(--ui-accent)"></span>`;
      open.querySelector('b').textContent = course['Nội dung'] || r.names.join(' + ');
      open.querySelector('.muted').textContent = r.names.join(' · ');
      open.querySelector('.tag').textContent = [r.buoi ? 'Buổi ' + r.buoi : '', r.brand || '', ago(r.at)].filter(Boolean).join(' · ');
      open.onclick = () => { if (r.brand) { state.brand = r.brand; $('#brand').value = r.brand; } state.srcFiles = r.files || null; openBooks(r.books, r.names, r.buoi, true); state.recentId = r.id; };
      const del = document.createElement('button'); del.type = 'button'; del.className = 'rc-del'; del.textContent = '×'; del.title = 'Bỏ khỏi danh sách'; del.setAttribute('aria-label', 'Bỏ ' + r.id + ' khỏi danh sách');
      del.onclick = async () => { await RDB.del(r.id); drawRecent(); };
      it.append(open, del); box.appendChild(it); }
    paint();
  }
  // mở 1 bộ Excel đã đọc (nhập mới hoặc từ File gần đây)
  function openBooks(books, names, buoi, fromRecent) {
    // mở từ File gần đây: đọc lại từ file gốc để có số dòng Excel thật (__r), rồi áp các ô đã sửa trong bảng Dữ liệu gốc (29/10)
    if (fromRecent && state.srcFiles && window.XLSX) { const ce = books.cellEdits; try { for (const k of ['s5', 's6']) { const f = state.srcFiles[k]; if (f && f.buf) books[k] = window.PLS_IMPORT.readWorkbook(window.XLSX.read(f.buf, { type: 'array' }), window.XLSX); } } catch (e) { console.warn('[PLS] đọc lại file gốc', e); }
      books.cellEdits = ce || []; if (window.PLS_DATASRC) window.PLS_DATASRC.applyEdits(books); }
    state.book = books;
    const bs = window.PLS_IMPORT.sessions(books.s6); const bsel = $('#buoi'); bsel.innerHTML = '';
    bs.forEach(x => bsel.add(new Option(`Buổi ${x.buoi}${x.bai != null ? ' · Bài ' + x.bai : ''} · ${x.name.replace(/^Bài\s*\d+\s*[–-]\s*/, '')}`, x.buoi)));   // hiện cả số Bài: từ buổi 12 số buổi ≠ số bài (28/10)
    bsel.hidden = $('#buoiLabel').hidden = false; bsel.onchange = () => fromExcel();
    const first = bs.find(x => /học/i.test(x.type)) || bs[0]; bsel.value = buoi && bs.some(x => x.buoi === +buoi) ? buoi : first.buoi;
    { const d = window.PLS_IMPORT.detectBrand && window.PLS_IMPORT.detectBrand(books, names);   // brand theo file S5 + S6 (30/10), mở lại từ File gần đây cũng vậy
      if (d && d.brand !== state.brand && BRANDS.includes(d.brand)) { state.brand = d.brand; $('#brand').value = d.brand; setTimeout(() => setStatus(`Brand: ${d.brand} (nhận theo ${d.why})`), 1500); } }
    return fromExcel();
  }
  async function build() {
    try { editSaveSoon(); } catch (e) { /* chưa sẵn sàng lúc khởi động */ }   // tự lưu bản sửa
    if (!state.spec) { showEmpty(); return; }
    document.body.classList.remove('empty');
    if (state.building) return; state.building = true; setStatus('Đang dựng…'); drawDeviceSel();
    const t0 = performance.now();
    const stage = $('#stage'); stage.innerHTML = ''; state.deck = { count: {} };
    const out = [];
    const spec = state.spec;
    for (let i = 0; i < spec.slides.length; i++) {
      const s = spec.slides[i];
      if (s.auto) {
        const plans = E.expand(s, spec.common);
        const scored = [];
        for (let pi = 0; pi < plans.length; pi++) {
          const trial = { count: Object.assign({}, state.deck.count) };   // dựng thử: bộ đếm ảnh riêng
          const rs = plans[pi].slides.map((ps, k) => renderOne(ps, stage, i, k, trial));
          const iss = rs.flatMap(r => r.issues);
          const P = plans[pi];   // điểm = soát lỗi TB − số slide − ô trống (fill) − nội dung bị bỏ (cover)
          const sc = Math.round(rs.reduce((a, r) => a + r.score, 0) / rs.length - (rs.length - 1) * 3 - (1 - P.fill) * (P.fillW || 15) - (1 - (P.cover == null ? 1 : P.cover)) * 40);
          scored.push({ label: plans[pi].label, score: sc, rs });
        }
        scored.sort((a, b) => b.score - a.score || a.rs.length - b.rs.length);   // bằng điểm → ít slide hơn
        const pick = state.choice[i] != null ? scored.find(x => x.label === state.choice[i]) || scored[0] : scored[0];
        scored.forEach(p => { if (p !== pick) p.rs.forEach(r => r.host.remove()); });
        pick.rs.forEach(r => (r.images || []).forEach(im => { if (im.id) state.deck.count[im.id] = (state.deck.count[im.id] || 0) + 1; }));
        pick.rs.forEach((r, k) => out.push(Object.assign(r, { src: i, part: k, plans: scored.map(p => ({ label: p.label, score: p.score, active: p === pick })) })));
      } else out.push(Object.assign(renderOne(s, stage, i, 0), { src: i, part: 0 }));
    }
    state.deckSize = E.deckNormalize ? E.deckNormalize(out) : null;   // cỡ chữ chuẩn cả bài (trung vị, mỗi slide ±1 bậc)
    // QC 25/10: khung đáp án / dây nối / độ trượt đo TRƯỚC khi chuẩn cỡ chữ cả bài → lệch khi chữ đổi cỡ (khung khoanh nhầm sang ô B) → đo lại sau cùng
    out.forEach(r => { try { if (E.markIcons) E.markIcons(r.host); fxBuild(r); } catch (e) { } });
    state.slides = out;
    // kiểm chuẩn v2.0 cả bài (29 luật) – lỗi theo slide gộp vào danh sách lỗi của slide
    if (window.PLS_STD) {
      state.std = window.PLS_STD.check(out, stdCtx());
      const engineCodes = /^(spill|overlap|noSlot|vietFont|minFont|smallFont|safeArea|words|noImage)$/;
      for (const rule of state.std) for (const it of rule.list || []) {
        const r = out[it.slide - 1]; if (!r || (r.issues || []).some(x => x.msg === it.msg)) continue;
        if (rule.id === 'RB-CH-04' || rule.id === 'RB-CH-06' || rule.id === 'RB-PPT-02' || rule.id === 'RB-PPT-03') continue;   // đã có từ engine
        r.issues.push({ lv: rule.level === 'xam' ? 'vang' : rule.level, code: 'std', rule: rule.id, msg: `${rule.id}: ${it.msg}`, src: 'Chuẩn v2.0' });
      }
    }
    if (state.sel >= out.length) state.sel = 0;
    drawList(); drawMain(); drawPanel();
    const ms = Math.round(performance.now() - t0);
    setStatus(`Đã dựng ${out.length} slide trong ${ms} ms`);
    state.building = false;
    return { slides: out.length, ms, issues: out.reduce((a, r) => a + r.issues.length, 0) };
  }
  // HIỆU ỨNG RIÊNG TỪNG ĐỐI TƯỢNG: đường dẫn theo tên khối (data-n#thứ tự) từ gốc slide → dùng được cho cả bản xem và bản dựng lại
  function pathOf(el, rootEl) { const parts = []; for (let e = el; e && e !== rootEl; e = e.parentElement) { if (!e.dataset || !e.dataset.n) continue; const sib = e.parentElement ? [...e.parentElement.children].filter(x => x.dataset && x.dataset.n === e.dataset.n) : [e]; parts.unshift(e.dataset.n + '#' + sib.indexOf(e)); } return parts.join(' > '); }
  function byPath(rootEl, path) { let cur = rootEl; for (const seg of path.split(' > ')) { const i = seg.lastIndexOf('#'), n = seg.slice(0, i), k = +seg.slice(i + 1); let found = null;
      const walk = node => { for (const c of node.children) { if (found) return; if (c.dataset && c.dataset.n === n) { const sib = [...c.parentElement.children].filter(x => x.dataset && x.dataset.n === n); if (sib.indexOf(c) === k) { found = c; return; } } else if (!(c.dataset && c.dataset.n)) walk(c); } };
      walk(cur); if (!found) { const all = [...cur.querySelectorAll('[data-n]')].filter(x => x.dataset.n === n); found = all[k] || null; } if (!found) return null; cur = found; } return cur; }
  // THỨ TỰ THÔNG MINH: theo cấu trúc slide (cột trái hết rồi mới sang cột phải, trong cột thì trên xuống) = thứ tự trong cây bố cục;
  // khung / chữ đáp án (fx.*) xếp SAU nhóm lựa chọn mà nó khoanh
  function smartOrder(r, els) {
    const cardEl = r.host.querySelector('[data-n="card"]') || r.host;
    const units = [...cardEl.querySelectorAll('[data-n]')].filter(o => o.offsetParent && /^(opt|q|c|s|l|r|w|item|line|ex|chip|row|vocab|p|g|pair|step|cando)_?[A-Z0-9]*$/.test(o.dataset.n));
    const anchor = e => { if (!/^fx\./.test(e.dataset.n || '')) return [e, 0];
      const b = e.getBoundingClientRect(), cx = (b.left + b.right) / 2, cy = (b.top + b.bottom) / 2;
      const hit = units.find(o => !o.contains(e) && !e.contains(o) && (q => cx >= q.left && cx <= q.right && cy >= q.top && cy <= q.bottom)(o.getBoundingClientRect()));
      if (!hit) return [e, 0]; const grp = hit.parentElement && hit.parentElement.closest('[data-n]'); const g = grp && cardEl.contains(grp) && grp !== cardEl ? grp : hit;
      const last = [...g.querySelectorAll('[data-n]')].filter(x => x.offsetParent).pop() || g; return [last, 1]; };
    return els.map(e => ({ e, a: anchor(e) })).sort((x, y) => { const c = x.a[0] === y.a[0] ? 0 : (x.a[0].compareDocumentPosition(y.a[0]) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1); return c || x.a[1] - y.a[1]; }).map(x => x.e);
  }
  // GỢI Ý GỘP: các khối anh em cùng loại (4 lựa chọn, các mục, ví dụ, thẻ từ…) đang mỗi khối 1 lần bấm → gợi ý hiện cùng lúc
  function fxSuggest(r) { const fx = r.fx || [], out = []; if (fx.length < 3) return out;
    const elOf = a => [...r.host.querySelectorAll('[data-fx-order]')].find(x => String(x.dataset.fxOrder) === String(a.order));
    const kind = e => { const m = (e && e.dataset.n || '').match(/^(opt|item|ex|chip|vocab|line|row|p|step|cando|g|c|s|q|pair|kv|u|l|r|w)_?[A-Z0-9]*$/); return m ? m[1] + '|' + (e.parentElement && e.parentElement.closest('[data-n]') ? pathOf(e.parentElement.closest('[data-n]'), r.host) : '') : null; };
    const L = { opt: 'lựa chọn', item: 'mục', ex: 'ví dụ', chip: 'từ', vocab: 'thẻ từ', line: 'dòng thoại', row: 'hàng', p: 'mẫu câu', step: 'bước', cando: 'mục tiêu', g: 'mục', c: 'câu', s: 'câu', q: 'câu', pair: 'cặp', kv: 'từ khoá', u: 'cách dùng', l: 'vế trái', r: 'vế phải', w: 'từ' };
    let i = 0; while (i < fx.length) { const e = elOf(fx[i]), k = kind(e); let j = i + 1;
      while (j < fx.length && k && kind(elOf(fx[j])) === k) j++;
      const run = fx.slice(i, j), clicks = run.filter(a => a.when === 'click').length;
      if (run.length >= 3 && clicks >= 3) { const head = run.map(elOf); const near = fx[i - 1] && /^question/.test((elOf(fx[i - 1]) || {}).dataset ? elOf(fx[i - 1]).dataset.n : '');
        out.push({ paths: head.map(x => pathOf(x, r.host)), label: `${run.length} ${L[k.split('|')[0]] || 'khối'}${near ? ' của ' + fxName(elOf(fx[i - 1])).split(' – ')[0].toLowerCase() : ''}`, save: clicks - 1 }); }
      i = j; }
    return out; }
  function renumFx(r, keep) { if (!keep) r.fx.sort((a, b) => a.order - b.order); const byOrd = {}; r.host.querySelectorAll('[data-fx-order]').forEach(x => { byOrd[x.dataset.fxOrder] = x; });
    r.fx.forEach((a, i) => { const x = byOrd[String(a.order)]; a.order = i + 1; if (x) x.dataset.fxOrder = i + 1; }); }
  function applyObjFx(r, pk) { const ov = state.fxObj[pk] || {}; if (!Object.keys(ov).length && !state.fxOrd[pk]) return; r.fx = r.fx || [];
    for (const [path, o] of Object.entries(ov)) { const el = byPath(r.host, path); if (!el) continue; const ord = el.dataset.fxOrder;
      if (o.fx === 'none') { if (ord) { r.fx = r.fx.filter(a => String(a.order) !== String(ord)); delete el.dataset.fx; delete el.dataset.fxWhen; delete el.dataset.fxOrder; } continue; }
      el.querySelectorAll('[data-fx-order]').forEach(c => { if (/^fx\./.test(c.dataset.n || '')) return; r.fx = r.fx.filter(a => String(a.order) !== c.dataset.fxOrder); delete c.dataset.fx; delete c.dataset.fxWhen; delete c.dataset.fxOrder; });   // khối cha nhận hiệu ứng → con không chạy riêng (trừ khung đáp án fx.*)
      const setD = () => { el.dataset.fx = o.fx; el.dataset.fxWhen = o.when; if (o.dir) el.dataset.fxDir = o.dir; if (o.dur) el.dataset.fxDur = o.dur; };
      if (ord) { const a = r.fx.find(x => String(x.order) === String(ord)); setD(); if (a) { a.fx = o.fx; a.when = o.when; a.dur = o.dur; } }
      else {   // khối mới: chen vào đúng chỗ theo vị trí trên slide (trên → dưới), không dồn xuống cuối
        const after = [...r.host.querySelectorAll('[data-fx-order]')].filter(x => el.compareDocumentPosition(x) & Node.DOCUMENT_POSITION_FOLLOWING && !el.contains(x)).map(x => +x.dataset.fxOrder);
        const order = after.length ? Math.min(...after) - 0.5 : Math.max(0, ...r.fx.map(a => +a.order || 0)) + 1;
        setD(); el.dataset.fxOrder = order; r.fx.push({ n: el.dataset.n, role: 'item', fx: o.fx, when: o.when, order }); renumFx(r); } }
    r.fx.sort((a, b) => a.order - b.order);
    const want = state.fxOrd[pk]; if (want && want.length) {   // thứ tự người dùng kéo lên / xuống (theo đường dẫn khối)
      const pos = {}; r.host.querySelectorAll('[data-fx-order]').forEach(x => { const i = want.indexOf(pathOf(x, r.host)); if (i >= 0) pos[x.dataset.fxOrder] = i; });
      r.fx.sort((a, b) => (pos[a.order] ?? 1e6 + a.order) - (pos[b.order] ?? 1e6 + b.order)); renumFx(r, true); }
    else renumFx(r); }
  // tên dễ hiểu cho khối có hiệu ứng (thay vì fx.ok_1, opt_A…)
  function fxName(e) { if (e.dataset.fx === 'move') return 'Trượt từ – ' + (e.textContent || '').trim().slice(0, 18); const n = e.dataset.n || '', m = n.match(/^(fx\.ok|fx\.key|fx\.ans|fx\.line|opt|question|q|line|item|ex|chip|row|vocab|p|c|s|g|pair|step|part|cando|u|w)_?([A-Z0-9]+)?$/);
    const cl = e.cloneNode(true); cl.querySelectorAll('[data-n="no"], [data-n$=".no"], [data-n="min"], [data-n$=".min"], [data-n="mark"]').forEach(x => x.remove());   // bỏ số thứ tự / phút / dấu ✓ trong tên
    const txt = (cl.textContent || '').trim().replace(/\s+/g, ' ');
    const L = { 'fx.ok': 'Đáp án câu', 'fx.key': 'Chữ đáp án', 'fx.ans': 'Đáp án câu', 'fx.line': 'Dây nối', opt: 'Lựa chọn', question: 'Câu hỏi', q: 'Câu', line: 'Lời', item: 'Mục', ex: 'Ví dụ', chip: 'Từ', row: 'Hàng', vocab: 'Thẻ từ', p: 'Mẫu câu', c: 'Câu', s: 'Câu', g: 'Mục', pair: 'Cặp', step: 'Bước', part: 'Phần', cando: 'Mục tiêu', u: 'Cách dùng', w: 'Từ' };
    if (m && L[m[1]]) { const short = /^fx\./.test(m[1]) ? '' : txt.replace(/^[A-D]\s*/, '').slice(0, 22); return `${L[m[1]]} ${m[2] || ''}${short ? ' – ' + short : ''}`.trim(); }
    return txt.slice(0, 30) || n; }
  // ĐỔI HIỆU ỨNG KHÔNG DỰNG LẠI CẢ BÀI: chỉ gắn lại hiệu ứng cho slide đang chọn rồi vẽ lại khung giữa (không nhảy UI)
  function fxBuild(r) { const pk = r.src + '/' + r.part; E.planFx(r, state.fx);
    if (window.PLS_FXP && state.fx.on) { const pid = state.fxp[pk] || (state.fx.hideAnswer ? defPreset(r) : null); if (pid && pid !== 'auto') window.PLS_FXP.apply(r, pid); }
    applyObjFx(r, pk); }
  function refx(i) { const r = state.slides[i]; if (!r) return; fxBuild(r); state.fxStep = null; drawMain(); drawPanel(); }
  function defPreset(r) { try { const d = window.PLS_FXP.detect(r); return d.type && d.presets[0] ? d.presets[0].id : null; } catch (e) { return null; } }
  function renderOne(s, stage, srcIdx, part, trialDeck) {
    const ov = Object.assign({}, state.overrides[srcIdx] || {}, state.overrides[srcIdx + '/' + (part || 0) + '/' + s.comp] || {});   // sửa tay trên slide tự chọn mẫu: theo phần + mẫu
    let spec = Object.assign({}, s, { common: state.spec.common, data: Object.assign({}, s.data, ov, state.imgOv[srcIdx + '/' + (part || 0)] || {}) });
    // BỐ CỤC người dùng chọn cho slide này (layouts.js): đổi cách xếp trong cùng mẫu, hoặc đổi sang mẫu khác cùng loại nội dung
    let post = null; const lk = srcIdx + '/' + (part || 0);
    if (window.PLS_LAYOUT && state.layoutSel[lk]) { const a = window.PLS_LAYOUT.apply(spec, state.layoutSel[lk]); spec = a.spec; post = a.post; }
    const r = E.render(spec, state.brand);
    if (window.PLS_STRIP) window.PLS_STRIP.node(r.host);   // xem trên web = bản xuất: không hiện mã nội bộ (dữ liệu gốc vẫn giữ mã)
    stage.appendChild(r.host);
    if (post) { try { post(r.rootEl || r.host.firstElementChild); } catch (e) { console.warn('[PLS_LAYOUT]', e); } }
    // mặc định xem bằng ĐÚNG font sẽ có trong file (font có sẵn trên máy) → thấy gì xuất nấy, không phụ thuộc font tải từ mạng
    if (state.fontMode === 'safe') { const dv = curDevice(); E.applyExportFonts(r.host, state.brand, dv.font ? dv : null); }
    // phương án dựng thử dùng bản sao bộ đếm ảnh; chỉ phương án được chọn mới ghi vào bộ đếm cả bài
    const deck = trialDeck || state.deck;
    r.images = window.PLS_IMAGES ? window.PLS_IMAGES.fill(r.host, state.brand, spec.data, deck) : []; r.deckLocal = deck;
    if (state.hier) E.hierarchy(r);
    r.typo = E.typoLayout(r);
    r.fitLog = E.fitText(r);
    r.typo = r.typo.concat(E.typoSpread(r));
    r.issues = E.audit(r);
    r.score = E.score(r.issues, r.fitLog);
    E.planFx(r, state.fx);   // hiệu ứng theo vai trò lớp (FX của fit_js, chuẩn v2.0: chỉ Appear)
    r.spec = spec;
    const pk = srcIdx + '/' + (part || 0);   // bộ hiệu ứng nhanh người dùng chọn cho slide này (fx-presets.js) → ghi đè cách tự gắn
    // mặc định: slide trắc nghiệm / nối / đáp án… tự dùng bộ hiệu ứng ĐẦU TIÊN của dạng đó (khoanh đáp án, hiện chữ đáp án…), không cần bấm chọn
    if (window.PLS_FXP && state.fx.on) { const pid = state.fxp[pk] || (state.fx.hideAnswer ? defPreset(r) : null); if (pid && pid !== 'auto') window.PLS_FXP.apply(r, pid); }
    applyObjFx(r, srcIdx + '/' + (part || 0));
    return r;
  }

  // ---------- vẽ giao diện ----------
  function scaled(host, width) {
    const k = width / parseFloat(host.style.width);
    const wrap = document.createElement('div'); wrap.className = 'scaled';
    wrap.style.width = width + 'px'; wrap.style.height = parseFloat(host.style.height) * k + 'px';
    const c = host.cloneNode(true); c.style.transform = `scale(${k})`; c.style.transformOrigin = '0 0';
    wrap.appendChild(c); return { wrap, clone: c };
  }
  function lvOf(r) { return r.issues.some(i => i.lv === 'do') ? 'do' : r.issues.some(i => i.lv === 'vang') ? 'vang' : 'ok'; }
  function drawList() {
    const ul = $('#slides'); ul.innerHTML = '';
    $('#slideCount').textContent = state.slides.length + ' slide';
    const need = state.slides.filter(r => lvOf(r) !== 'ok').length;
    $('#needCount').textContent = need ? need + ' cần xem' : 'đều đạt';
    const hasAud = (r) => !!r.host.querySelector('[data-n="audio"][data-audio]'), nAud = state.slides.filter(hasAud).length;
    $('#audCount').hidden = !nAud; $('#audCount').textContent = nAud ? `♪ ${nAud} slide có audio` : '';
    state.slides.forEach((r, i) => {
      const li = document.createElement('li');
      const b = document.createElement('button'); b.className = 'thumb' + (i === state.sel ? ' sel' : ''); b.type = 'button';
      b.setAttribute('aria-label', `Slide ${i + 1}: ${r.host.dataset.comp}`);
      const { wrap } = scaled(r.host, 168);
      const cap = document.createElement('span'); cap.className = 'cap';
      cap.innerHTML = `<i class="dot ${lvOf(r)}"></i><b>${i + 1}</b> ${r.host.dataset.comp.replace(/^Slide\//, '')}${hasAud(r) ? ' <span class="aud" title="Có audio bài nghe – bấm ▶ trên slide để nghe; xuất PPTX kèm âm thanh">♪</span>' : ''}`;
      b.append(wrap, cap); b.onclick = () => { stopFx(); state.sel = i; state.fxSel = null; state.fxDemo = null; state.fxStep = null; drawList(); drawMain(); drawPanel(); };
      li.appendChild(b);
      // CHỌN BỐ CỤC NGAY DƯỚI ẢNH SLIDE (người dùng 28/10): 2–3 cách dàn, bấm số để đổi
      const vs = window.PLS_LAYOUT ? window.PLS_LAYOUT.variants(Object.assign({}, r.spec, { comp: r.spec._from || r.spec.comp })) : [];
      if (vs.length >= 2) { const lk = r.src + '/' + r.part, cur = state.layoutSel[lk] || vs[0].id; const row = document.createElement('div'); row.className = 'lay-chips'; row.setAttribute('role', 'group'); row.setAttribute('aria-label', 'Bố cục slide ' + (i + 1));
        row.insertAdjacentHTML('beforeend', `<span>${((window.PLS_SKIN || {})[state.brand] || {}).ownsLayout ? 'Cách triển khai' : 'Bố cục'}</span>`);
        vs.forEach((v, k) => { const c = document.createElement('button'); c.type = 'button'; c.textContent = String(k + 1); c.title = v.label; c.className = v.id === cur ? 'on' : ''; c.setAttribute('aria-pressed', String(v.id === cur));
          c.onclick = e => { e.stopPropagation(); state.sel = i; if (k === 0) delete state.layoutSel[lk]; else state.layoutSel[lk] = v.id; build(); }; row.appendChild(c); });
        li.appendChild(row); }
      ul.appendChild(li);
    });
  }
  function drawMain() {
    const r = state.slides[state.sel]; const box = $('#canvas'); box.innerHTML = '';
    drawNotes(r); if (!r) return;
    $('#selTitle').textContent = `Slide ${state.sel + 1} · ${r.host.dataset.comp.replace(/^Slide\//, '')}`;
    $('#selMeta').textContent = `Điểm ${r.score}/100 · ${r.fitLog.length ? r.fitLog.length + ' ô đã co chữ' : 'không phải co chữ'}` + (r.plans ? ` · ${r.plans.find(p => p.active).label}` : '');
    const w = Math.min(box.clientWidth - 32, 1100);
    const { wrap, clone } = scaled(r.host, Math.max(320, w));
    box.appendChild(wrap);
    // sửa trực tiếp: ghi đè theo slide nguồn
    clone.querySelectorAll('[data-filled]').forEach(el => {
      const target = el.querySelector('[data-t]') || el;
      target.contentEditable = 'true'; target.spellcheck = false;
      // ô có pinyin (ruby): sửa trên CHỮ GỐC – không để pinyin dính vào chữ ("牛niú奶nǎi…") khi bấm vào rồi bấm ra (30/10)
      const isRuby = !!(target.dataset.ruby || target.querySelector('[data-ruby], [data-n="rubyunit"]'));
      const baseTxt = () => { const c = target.cloneNode(true); c.querySelectorAll('[data-n="ruby"]').forEach(x => x.remove()); c.querySelectorAll('[data-n="br"]').forEach(x => x.replaceWith('\n')); return c.textContent; };
      let base0 = null;
      if (isRuby) target.addEventListener('focus', () => { if (base0 != null) return; base0 = baseTxt(); target.textContent = base0; target.style.display = 'block'; target.style.whiteSpace = 'pre-wrap'; });
      target.addEventListener('blur', () => {
        const slot = el.dataset.filled; const v = target.textContent;
        if (isRuby) { const b = base0; base0 = null; if (b == null || v === b) { drawMain(); return; } }   // không đổi chữ → vẽ lại (hiện lại pinyin), không ghi gì
        if (v === r.spec.data[slot] || (window.PLS_STRIP && v === window.PLS_STRIP.text(String(r.spec.data[slot] || '')))) return;   // chữ hiện đã bỏ mã → chưa sửa gì
        setSlot(r, slot, v); build();
      });
    });
    // bấm vào ô ảnh trên slide → mở tab Ảnh, nhảy tới đúng ô đó
    clone.querySelectorAll('[data-img-key]').forEach(el => {
      el.classList.add('pls-imgpick'); el.title = 'Bấm để chọn ảnh'; el.setAttribute('role', 'button'); el.tabIndex = 0;
      const go = ev => { ev.stopPropagation(); openImageTab(el.dataset.imgKey); };
      el.addEventListener('click', go); el.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(ev); } });
    });
    // tab Hiệu ứng: bấm 1 khối trên slide để chọn → gắn hiệu ứng riêng (không sửa chữ ở tab này)
    if (document.querySelector('[role=tab][aria-selected=true]')?.dataset.tab === 'fx' && (state.fxTab || 'quick') === 'obj') {
      clone.querySelectorAll('[contenteditable]').forEach(e => { e.contentEditable = 'false'; });
      const cardEl = clone.querySelector('[data-n="card"]') || clone;
      // CHỌN KHỐI THÔNG MINH: bấm vào chữ → chọn cả Ô chứa nó (lựa chọn, câu hỏi, dòng hội thoại, thẻ từ…), không chọn mẩu chữ hay cả thẻ trắng;
      // đã có hiệu ứng → chọn đúng khối đang mang hiệu ứng; Shift+bấm → chọn khối cha (cả nhóm); rê chuột thấy trước khối sẽ chọn
      const UNIT = /^(opt|q|ex|line|item|chip|row|vocab|p|c|s|g|pair|kv|step|part|cando|u|f|l|r|word|col|key|ans|fx\.\w+)_?[A-Z0-9]*$|^(rule_box|img|note|point|rule|text|title|use|track_box|audio|bank|tl)$/;
      const pick = (t, up) => { if (!t || !cardEl.contains(t) || t === cardEl) return null;
        let el = t.closest('[data-fx-order]'); if (!el) { for (let e = t.closest('[data-n]'); e && e !== cardEl; e = e.parentElement.closest('[data-n]')) { if (UNIT.test(e.dataset.n) && !/^(no|key|text|vi|de|ipa)$/.test(e.dataset.n) ) { el = e; break; } } }
        if (!el) el = t.closest('[data-n]'); if (!el || el === cardEl) return null;
        if (up) { const pa = el.parentElement && el.parentElement.closest('[data-n]'); if (pa && pa !== cardEl && cardEl.contains(pa)) el = pa; }
        return el; };
      clone.addEventListener('mouseover', ev => { clone.querySelectorAll('.fxhover').forEach(x => x.classList.remove('fxhover')); const el = pick(ev.target, ev.shiftKey); if (el) el.classList.add('fxhover'); }, true);
      clone.addEventListener('mouseleave', () => clone.querySelectorAll('.fxhover').forEach(x => x.classList.remove('fxhover')), true);
      clone.addEventListener('click', ev => { const el = pick(ev.target, ev.shiftKey); if (!el) return;
        ev.preventDefault(); ev.stopPropagation(); state.fxSel = pathOf(el, clone); state.fxDemo = el.dataset.fx && el.dataset.fx !== 'none' ? state.fxSel : null; drawMain(); drawPanel(); }, true);
      if (state.fxSel) { const s1 = byPath(clone, state.fxSel); if (s1) s1.classList.add('fxsel'); }
      { const clickOf = {}; let c = 0; (r.fx || []).forEach(a => { if (a.when === 'click') c++; clickOf[a.order] = c; });   // số lần bấm hiện cạnh khối (như PowerPoint)
        const shown = new Set(); clone.querySelectorAll('[data-fx-order]').forEach(el => { const kk = clickOf[el.dataset.fxOrder]; const fa = (r.fx || []).find(a => String(a.order) === el.dataset.fxOrder); if (fa && fa.when !== 'click' && shown.has(kk)) return; shown.add(kk); const b = document.createElement('span'); b.className = 'fxbadge'; b.textContent = clickOf[el.dataset.fxOrder] || ''; const sc = parseFloat((clone.style.transform.match(/scale\(([\d.]+)\)/) || [])[1]) || 1; b.style.fontSize = (13 / sc) + 'px'; const cr0 = clone.getBoundingClientRect(), q = el.getBoundingClientRect(), fxL = /^fx\./.test(el.dataset.n || '');   /* gắn ở lớp trên cùng của slide → không bị khung đáp án đè; khung đáp án: số ở góc phải */
          b.style.zIndex = 60; b.style.top = ((q.top - cr0.top) / sc - 8 / sc) + 'px'; b.style.left = ((fxL ? q.right : q.left) - cr0.left) / sc - (fxL ? 30 : 8) / sc + 'px'; clone.appendChild(b); });
        }
      // CHẠY THỬ KHỐI: gắn xong là chạy ngay trên slide, lặp 3 lần để thấy hiệu ứng như lúc trình chiếu
      if (state.fxDemo) { const d = byPath(clone, state.fxDemo); if (d && d.dataset.fx === 'move' && d.animate) { const to = `translate(${+d.dataset.fxDx || 0}px, ${+d.dataset.fxDy || 0}px)`; d.animate([{ transform: 'none' }, { transform: 'none', offset: .25 }, { transform: to, offset: .85 }, { transform: to }], { duration: 2200, iterations: 3 }); }
        else if (d && d.dataset.fx && d.dataset.fx !== 'none') { d.style.animation = `fxd-${d.dataset.fx}-${d.dataset.fxDir || 'bottom'} ${((+d.dataset.fxDur || 500) + 900) / 1000}s ease-out 3`; d.style.animationFillMode = 'both'; } state.fxDemo = null; }
    }
    // xem thử hiệu ứng: ẩn các khối có thứ tự lần bấm > bước đang xem
    if (state.fxStep != null) {
      const clickOf = {}, delayOf = {}; let c = 0, t = 0, prev = 0; (r.fx || []).forEach(a => { if (a.when === 'click') { c++; t = 0; prev = 0; } else if (a.when === 'after') t += prev; clickOf[a.order] = c; delayOf[a.order] = t; prev = a.dur || 500; });   // 'Sau' chạy nối tiếp, 'Cùng' chạy cùng lúc
      clone.querySelectorAll('[data-fx-order]').forEach(el => { const k = clickOf[el.dataset.fxOrder];
        if (el.dataset.fx === 'move') { const to = `translate(${+el.dataset.fxDx || 0}px, ${+el.dataset.fxDy || 0}px)`;   // ô từ trượt: luôn hiện, tới lượt thì trượt về chỗ đúng
          if (k < state.fxStep) el.style.transform = to; else if (k === state.fxStep && el.animate) el.animate([{ transform: 'none' }, { transform: to }], { duration: +el.dataset.fxDur || 700, delay: delayOf[el.dataset.fxOrder] || 0, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'both' }); return; }
        if (k > state.fxStep) el.style.visibility = 'hidden'; else if (k === state.fxStep && state.fxStep > 0) { el.classList.add('fxa-' + (el.dataset.fx || 'fade') + '-' + (el.dataset.fxDir || 'bottom')); el.style.animationDuration = ((+el.dataset.fxDur || 500) / 1000) + 's'; el.style.animationDelay = ((delayOf[el.dataset.fxOrder] || 0) / 1000) + 's'; } });
    }
    // tô ô có lỗi
    r.issues.filter(i => i.slot).forEach(i => { const el = clone.querySelector(`[data-filled="${CSS.escape(i.slot)}"]`); if (el) el.classList.add(i.lv === 'do' ? 'bad' : 'warn'); });
  }
  // XEM THỬ HIỆU ỨNG: bấm 1 lần → tự chạy lần lượt từng lần bấm (có chuyển động như khi trình chiếu), hết thì dừng
  function stopFx() { if (state.fxTimer) clearTimeout(state.fxTimer); state.fxTimer = null; }
  function playFx() {
    stopFx(); const r = state.slides[state.sel]; const steps = r ? E.fxSteps(r.fx || []) : 0; if (!steps) return;
    const sel = state.sel; state.fxStep = 0; drawMain(); drawPanel();
    const tick = () => { if (state.sel !== sel) { stopFx(); return; }
      if (state.fxStep >= steps) { state.fxTimer = setTimeout(() => { state.fxTimer = null; state.fxStep = null; drawMain(); drawPanel(); }, 1200); return; }
      state.fxStep++; drawMain(); state.fxTimer = setTimeout(tick, 1100); };
    state.fxTimer = setTimeout(tick, 700); drawPanel();
  }
  function openImageTab(key) {
    document.querySelectorAll('[role=tab]').forEach(x => x.setAttribute('aria-selected', x.dataset.tab === 'images'));
    state.focusImg = key; drawPanel();
    // cuộn khung bên phải tới đúng ô ảnh (đặt scrollTop trực tiếp – panel có thể vẽ lại ngay sau đó nên thử lại vài nhịp)
    const go = () => { if (state.focusImg !== key) return; const pn = document.querySelector('#panel'), box = document.querySelector(`#panel [data-key="${CSS.escape(key)}"]`); if (!pn || !box) return;
      box.classList.add('focus'); const a = box.getBoundingClientRect(), b = pn.getBoundingClientRect(); pn.scrollTop += a.top - b.top - Math.max(8, (b.height - a.height) / 2);
      const q = box.querySelector('input[type=search]'); if (q && document.activeElement !== q) q.focus({ preventScroll: true }); };
    go(); requestAnimationFrame(go); setTimeout(go, 200); setTimeout(go, 700);
  }
  // ghi 1 ô của slide đang hiện (r): slide tự chia (từ vựng) ghi vào danh sách mục nguồn, slide thường ghi đè theo slide nguồn
  // SỬA TRÊN SLIDE → GHI NGƯỢC VỀ S5/S6 (người dùng 28/10): nhớ chữ gốc (lần đầu) + chữ mới của từng ô để qc-sync.js tìm đúng ô Excel mà thay
  function noteEdit(id, oldV, newV, slide) { const q = state.qcEdits || (state.qcEdits = {}); const o = q[id] ? q[id].old : (oldV == null ? '' : String(oldV));
    if (window.PLS_STRIP && oldV != null && window.PLS_STRIP.HAS.test(String(oldV))) newV = window.PLS_STRIP.remap(String(oldV), String(newV)); /* QC sửa trên chữ đã bỏ mã → đặt lại mã vào đúng chỗ để ghi về Excel không mất mã */ if (o === String(newV)) delete q[id]; else q[id] = { old: o, new: String(newV), slide }; if (window.PLS_QC) window.PLS_QC.refresh(); }
  // gỡ pinyin dính chữ ("牛niú奶nǎi四sì…") – lỗi sửa ô ruby trước 30/10; chỉ khi đa số chữ Hán bị dính pinyin ngay sau
  const PYW = '[a-zü]*[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ][a-zü]*|[a-zü]+';
  function unglue(v) { if (typeof v !== 'string') return v; const han = (v.match(/[\u3400-\u9fff]/g) || []).length; if (han < 2) return v;
    const re = new RegExp('([\u3400-\u9fff])(' + PYW + ')(?=[\u3400-\u9fff\s，。、？！；：,.?!;:）)」”]|$)', 'g'); const n = (v.match(re) || []).length;
    return n >= 2 && n >= han * 0.6 ? v.replace(re, '$1') : v; }
  function cleanEdits() {   // bản sửa cũ bị dính pinyin → gỡ (ô chữ + danh sách ghi về S5/S6)
    Object.values(state.overrides || {}).forEach(o => o && typeof o === 'object' && Object.keys(o).forEach(k => { o[k] = unglue(o[k]); }));
    Object.values(state.qcEdits || {}).forEach(e => { if (e && e.new != null) e.new = unglue(e.new); }); }
  function setSlot(r, slot, v) {
    v = unglue(v);
    const slideNo = state.slides.indexOf(r) + 1;
    if (r.plans) { const src = state.spec.slides[r.src]; const m = slot.match(/^vocab_(\d+)\.(de|vi)$/); if (m) { const before = state.slides.filter(x => x.src === r.src && x.part < r.part).reduce((a, x) => a + Object.keys(x.spec.data).filter(k => /^vocab_\d+\.de$/.test(k)).length, 0); const it = src.items[before + (+m[1]) - 1]; noteEdit('item/' + r.src + '/' + (before + (+m[1]) - 1) + '/' + m[2], it[m[2]], v, slideNo); it[m[2]] = v; return; } }
    const k = r.plans ? r.src + '/' + r.part + '/' + r.spec.comp : r.src;
    noteEdit('slot/' + k + '/' + slot, r.spec && r.spec.data ? r.spec.data[slot] : '', v, slideNo);
    (state.overrides[k] = state.overrides[k] || {})[slot] = v;
  }
  function drawPanel() {
    const tab = document.querySelector('[role=tab][aria-selected=true]').dataset.tab;
    const p = $('#panel'); const keepScroll = p.scrollTop; p.innerHTML = '';
    requestAnimationFrame(() => { p.scrollTop = keepScroll; });   // đổi tuỳ chọn không nhảy cuộn
    const all = state.slides.flatMap((r, i) => r.issues.map(x => Object.assign({ i }, x)));
    const cnt = lv => all.filter(x => x.lv === lv).length;
    $('#tabIssues').textContent = `Soát lỗi · ${cnt('do') + cnt('vang')}`;
    if (tab === 'issues') {
      if (state.std) {
        const fail = lv => state.std.filter(x => x.status === 'loi' && x.level === lv).length;
        const sum = document.createElement('details'); sum.className = 'std'; sum.open = !!state.stdOpen; sum.ontoggle = () => { state.stdOpen = sum.open; };
        const ok = state.std.filter(x => x.status === 'dat').length, tay = state.std.filter(x => x.status === 'tay').length, na = state.std.filter(x => x.status === 'khongap').length;
        // 23/10: chỉ hiện luật CHƯA ĐẠT (bỏ danh sách đạt / người kiểm / chỉ áp dụng PDF – không cần làm gì)
        const nFail = state.std.filter(x => x.status === 'loi').length;
        sum.innerHTML = nFail ? `<summary><b>Chuẩn v2.0: ${nFail} luật chưa đạt</b> ${fail('do') ? `<span class="pill do">${fail('do')} bắt buộc</span>` : ''} ${fail('vang') ? `<span class="pill vang">${fail('vang')} nên đạt</span>` : ''}</summary>` : `<summary><b>Đạt chuẩn v2.0</b> <span class="muted">· ${ok} luật máy kiểm đều đạt</span></summary>`;
        const ST = { dat: '✓', loi: '✗', tay: '👁', khongap: '–' };
        state.std.filter(x => x.status === 'loi').sort((a, b) => (a.status === 'loi' ? 0 : a.status === 'tay' ? 1 : 2) - (b.status === 'loi' ? 0 : b.status === 'tay' ? 1 : 2)).forEach(x => {
          const d = document.createElement('div'); d.className = 'stdrow ' + x.status + ' ' + x.level;
          d.innerHTML = `<span class="st" aria-label="${x.status}">${x.status === 'loi' ? '✗' : x.status === 'dat' ? '✓' : '?'}</span><div><b>${x.id}</b> ${escapeHtml(x.title)} <span class="pill ${x.level}">${{ do: 'bắt buộc', vang: 'nên đạt', xam: 'tham khảo' }[x.level]}</span><div class="muted">${escapeHtml(x.status === 'loi' ? x.list.slice(0, 3).map(i => (i.slide ? 'Slide ' + i.slide + ': ' : '') + i.msg).join(' · ') + (x.list.length > 3 ? ` · +${x.list.length - 3}` : '') : x.note || '')}</div></div>`;
          sum.appendChild(d);
        });
        p.appendChild(sum);
      }
      p.insertAdjacentHTML('beforeend', `<div class="tiles"><div class="tile do"><b>${cnt('do')}</b>phải sửa</div><div class="tile vang"><b>${cnt('vang')}</b>cần xem</div><div class="tile ok"><b>${state.slides.filter(r => lvOf(r) === 'ok').length}</b>slide đạt</div></div>`);
      (state.exportWarns || []).forEach(w => p.insertAdjacentHTML('beforeend', `<div class="issue"><div class="row"><span class="pill do">Bản xuất</span></div><span>${escapeHtml(w)}</span></div>`));
      (state.importWarns || []).forEach(w => p.insertAdjacentHTML('beforeend', `<div class="issue"><div class="row"><span class="pill vang">Nhập Excel</span></div><span>${escapeHtml(w)}</span></div>`));
      if (!all.length) p.insertAdjacentHTML('beforeend', '<p class="muted">Không có lỗi theo chuẩn v2.0.</p>');
      all.sort((a, b) => (a.lv === 'do' ? 0 : 1) - (b.lv === 'do' ? 0 : 1)).forEach(x => {
        const d = document.createElement('div'); d.className = 'issue';
        d.innerHTML = `<div class="row"><span class="pill ${x.lv}">${x.lv === 'do' ? 'Phải sửa' : 'Cần xem'}</span><span class="muted">Nguồn: ${x.src}</span></div><b>Slide ${x.i + 1}</b><span>${escapeHtml(x.msg)}</span>`;
        const go = document.createElement('button'); go.type = 'button'; go.textContent = 'Đi tới slide'; go.onclick = () => { state.sel = x.i; drawList(); drawMain(); };
        d.appendChild(go); p.appendChild(d);
      });
    } else if (tab === 'layout') {
      // BỐ CỤC (người dùng 28/10): mỗi slide có nhiều cách dàn – xem ảnh nhỏ rồi bấm để đổi
      const r = state.slides[state.sel]; if (!r) return;
      const L = window.PLS_LAYOUT, base = Object.assign({}, r.spec, { comp: r.spec._from || r.spec.comp }), vs = L ? L.variants(base) : [];
      const lk = r.src + '/' + r.part, cur = state.layoutSel[lk] || (vs[0] && vs[0].id);
      if (vs.length) {
        p.insertAdjacentHTML('beforeend', `<p class="muted">${((window.PLS_SKIN || {})[state.brand] || {}).ownsLayout ? 'Cách triển khai hoạt động này – bấm để đổi (nội dung giữ nguyên):' : 'Cách dàn của slide này – bấm để đổi (nội dung giữ nguyên):'}</p>`);
        const g = document.createElement('div'); g.className = 'lay-grid';
        const tmp = document.createElement('div'); tmp.style.cssText = 'position:fixed;left:-99999px;top:0'; document.body.appendChild(tmp);
        vs.forEach(v => { const a = L.apply(Object.assign({}, base, { data: Object.assign({}, r.spec.data) }), v.id); const rr = E.render(a.spec, state.brand); tmp.appendChild(rr.host); if (a.post) { try { a.post(rr.rootEl || rr.host.firstElementChild); } catch (e) {} } try { E.fitText(rr); } catch (e) {}
          const b = document.createElement('button'); b.type = 'button'; b.className = 'lay-opt' + (v.id === cur ? ' on' : ''); b.setAttribute('aria-pressed', String(v.id === cur));
          const th = document.createElement('div'); th.className = 'lay-th'; const cl = rr.host.cloneNode(true); cl.style.transformOrigin = '0 0'; requestAnimationFrame(() => { cl.style.transform = `scale(${(th.clientWidth || 160) / 1920})`; }); cl.style.position = 'absolute'; cl.style.left = '0'; cl.style.top = '0'; th.appendChild(cl);
          b.append(th); b.insertAdjacentHTML('beforeend', `<span>${escapeHtml(v.label)}</span>`);
          b.onclick = () => { if (v.id === (vs[0] && vs[0].id)) delete state.layoutSel[lk]; else state.layoutSel[lk] = v.id; build(); }; g.appendChild(b); });
        tmp.remove(); p.appendChild(g);
      }
      if (r.plans && r.plans.length > 1) {
        p.insertAdjacentHTML('beforeend', '<p class="muted" style="margin-top:14px">Cách chia nội dung thành slide (máy dựng thử và chấm điểm):</p>');
        r.plans.forEach(pl => { const b = document.createElement('button'); b.type = 'button'; b.className = 'plan' + (pl.active ? ' active' : '');
          b.innerHTML = `<span>${escapeHtml(pl.label)}</span><span class="bar"><i style="width:${pl.score}%"></i></span><b>${pl.score}</b>`;
          b.onclick = () => { state.choice[r.src] = pl.label; build(); }; p.appendChild(b); });
      }
      if (!vs.length && !(r.plans && r.plans.length > 1)) p.insertAdjacentHTML('beforeend', '<p class="muted">Slide này chưa có bố cục thay thế.</p>');
    } else if (tab === 'plans') {
      const r = state.slides[state.sel];
      if (!r || !r.plans) { p.innerHTML = '<p class="muted">Slide này dựng thẳng từ một mẫu. Slide từ vựng, ngữ pháp và bài tập có nhiều phương án máy đã dựng thử – chọn các slide đó để so.</p>'; return; }
      p.insertAdjacentHTML('beforeend', `<p class="muted">Máy dựng thử từng phương án, đo thật rồi chấm điểm (tràn, chồng lấn, chữ nhỏ, số slide).</p>`);
      r.plans.forEach(pl => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'plan' + (pl.active ? ' active' : '');
        b.innerHTML = `<span>${pl.label}</span><span class="bar"><i style="width:${pl.score}%"></i></span><b>${pl.score}</b>`;
        b.onclick = () => { state.choice[r.src] = pl.label; build(); };
        p.appendChild(b);
      });
    } else if (tab === 'fx') {
      const r = state.slides[state.sel]; const fx = (r && r.fx) || []; const steps = E.fxSteps(fx); const pk = r ? r.src + '/' + r.part : '';
      p.innerHTML = '';
      // HÀNG ĐẦU: xem thử (tự chạy từng lần bấm, có chuyển động) + số lần bấm
      const top = document.createElement('div'); top.className = 'row fxtop';
      if (fx.length) { const play = document.createElement('button'); play.type = 'button'; play.className = 'btn primary'; play.textContent = state.fxTimer ? '■ Dừng' : '▶ Xem thử cả slide';
        play.onclick = () => state.fxTimer ? (stopFx(), state.fxStep = null, drawMain(), drawPanel()) : playFx(); top.appendChild(play);
        top.insertAdjacentHTML('beforeend', `<span class="muted">${steps} lần bấm</span>`); }
      else top.insertAdjacentHTML('beforeend', '<span class="muted">Slide này chưa có hiệu ứng – chọn khối bên dưới để gắn.</span>');
      p.appendChild(top);
      if (r) { const sg = fxSuggest(r); if (sg.length) { const box = document.createElement('div'); box.className = 'fxtip';
        const total = sg.reduce((a, x) => a + x.save, 0);
        box.innerHTML = `<span>💡 Gộp để bớt <b>${total}</b> lần bấm:</span>`;
        const apply = list => { list.forEach(x => { x.paths.forEach((pth, k) => { const e = byPath(r.host, pth); if (!e) return; (state.fxObj[pk] = state.fxObj[pk] || {})[pth] = Object.assign({ fx: e.dataset.fx || 'fade', dir: e.dataset.fxDir || 'bottom', dur: +e.dataset.fxDur || 500 }, (state.fxObj[pk] || {})[pth] || {}, { when: k ? 'with' : 'click' }); }); }); stopFx(); refx(state.sel); setTimeout(playFx, 50); };
        sg.forEach(x => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = x.label + ' cùng lúc'; b.title = `Hiện ${x.label} trong 1 lần bấm (bớt ${x.save} lần bấm)`; b.onclick = () => apply([x]); box.appendChild(b); });
        if (sg.length > 1) { const all = document.createElement('button'); all.type = 'button'; all.className = 'chip primary'; all.textContent = 'Gộp tất cả'; all.onclick = () => apply(sg); box.appendChild(all); }
        p.appendChild(box); } }
      // 3 PHẦN (người dùng 25/10): Nhanh (bộ theo dạng slide) · Từng khối · Chuyển trang
      const sub = document.createElement('div'); sub.className = 'rs-sub fxsub'; sub.setAttribute('role', 'tablist');
      [['quick', 'Nhanh'], ['obj', 'Từng khối'], ['tr', 'Chuyển trang']].forEach(([k, t]) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = t; b.setAttribute('aria-selected', (state.fxTab || 'quick') === k); b.onclick = () => { state.fxTab = k; drawMain(); drawPanel(); }; sub.appendChild(b); });
      p.appendChild(sub);
      const body = document.createElement('div'); body.className = 'fxbody'; p.appendChild(body);
      const ft = state.fxTab || 'quick';
      if (ft === 'quick') {
        body.insertAdjacentHTML('beforeend', '<p class="muted">Bộ hiệu ứng dựng sẵn theo dạng slide (trắc nghiệm, nối, điền từ, từ vựng…). Chọn một bộ, có thể áp cho mọi slide cùng dạng.</p>');
        if (r && window.PLS_FXP) {
          const dt = window.PLS_FXP.detect(r), dflt = defPreset(r) || 'auto', cur = state.fxp[pk] || dflt;
          const set = (ids, id) => { ids.forEach(k => { if (id === dflt) delete state.fxp[k]; else state.fxp[k] = id; }); stopFx(); if (ids.length > 1) build(); else refx(state.sel); setTimeout(playFx, 50); };
          const same = dt.type ? state.slides.filter(x => window.PLS_FXP.detect(x).type === dt.type).map(x => x.src + '/' + x.part) : [pk];
          const allCb = Object.assign(document.createElement('input'), { type: 'checkbox' });
          const sel = document.createElement('select'); sel.setAttribute('aria-label', 'Bộ hiệu ứng');
          dt.presets.forEach(pr => { const o = new Option(pr.id === 'auto' ? 'Tự động theo lớp' : pr.label, pr.id); o.title = pr.desc; sel.add(o); }); sel.value = cur;
          sel.onchange = () => set(allCb.checked ? same : [pk], sel.value);
          const row1 = document.createElement('div'); row1.className = 'row'; row1.appendChild(sel); body.appendChild(row1);
          const pd = dt.presets.find(x => x.id === cur); if (pd && pd.desc) body.insertAdjacentHTML('beforeend', `<p class="muted">${pd.desc}</p>`);
          if (dt.type && same.length > 1) { const lb = document.createElement('label'); lb.className = 'fxrow'; lb.append(allCb, document.createTextNode(` Áp cho cả ${same.length} slide ${dt.label.toLowerCase()}`)); allCb.onchange = () => { if (allCb.checked) set(same, sel.value); }; body.appendChild(lb); }
        }
        const row = (label, el) => { const d = document.createElement('label'); d.className = 'fxrow'; d.append(el, document.createTextNode(' ' + label)); body.appendChild(d); return el; };
        const on = row('Tự gắn hiệu ứng cho cả bài', Object.assign(document.createElement('input'), { type: 'checkbox', checked: state.fx.on }));
        on.onchange = () => { state.fx.on = on.checked; state.fxStep = null; build(); };
        const ha = row('Ẩn đáp án, bấm mới hiện', Object.assign(document.createElement('input'), { type: 'checkbox', checked: state.fx.hideAnswer }));
        ha.onchange = () => { state.fx.hideAnswer = ha.checked; build(); };
        const pace = document.createElement('select'); pace.id = 'fxPace'; ['nhanh', 'vừa', 'chậm'].forEach(v => pace.add(new Option('Nhịp ' + v + (v === 'nhanh' ? ' (≤ 3 lần bấm / nhóm)' : v === 'vừa' ? ' (≤ 6)' : ' (≤ 8)'), v))); pace.value = state.fx.pace;
        pace.onchange = () => { state.fx.pace = pace.value; build(); }; body.appendChild(pace);
      } else if (ft === 'obj') {
        // CẢ SLIDE: một hiệu ứng cho mọi khối (theo thứ tự trên xuống), hoặc xoá hết
        if (r) { const rowA = document.createElement('div'); rowA.className = 'row fxall';
          const selA = document.createElement('select'); selA.setAttribute('aria-label', 'Hiệu ứng cho cả slide');
          [['', 'Cả slide: chọn hiệu ứng…'], ['appear', 'Hiện ra'], ['fade', 'Hiện dần'], ['fly', 'Bay vào từ dưới'], ['zoom', 'Phóng to'], ['wipe', 'Quét từ trái'], ['none', 'Xoá hết hiệu ứng']].forEach(([v, t]) => selA.add(new Option(t, v)));
          selA.onchange = () => { const v = selA.value; if (!v) return;
            // mọi khối nội dung trong thẻ (câu hỏi, lựa chọn, mục, ví dụ, thẻ từ, hình…) – lấy khối NGOÀI CÙNG khớp tên, cộng các khối đã có hiệu ứng (khung đáp án…)
            const UNIT2 = /^(question|opt|q|ex|line|item|chip|row|vocab|p|c|s|g|pair|kv|step|part|cando|u|f|l|r|word|col|key|ans)_?[A-Z0-9]*$|^(rule_box|img|note|point|rule|text|use|track_box|bank|tl|situation|question)$/;
            const cardEl0 = r.host.querySelector('[data-n="card"]') || r.host, inCard = e => cardEl0.contains(e) && e !== cardEl0;
            const units = [...cardEl0.querySelectorAll('[data-n]')].filter(e => e.offsetParent && inCard(e) && UNIT2.test(e.dataset.n) && !/^(no|key|vi|de|ipa)$/.test(e.dataset.n) && e.dataset.n !== 'title' && (e.textContent.trim() || e.classList.contains('pls-imgslot') || e.dataset.img) && !e.closest('[data-n="header"]'));
            const outer = units.filter(e => !units.some(o => o !== e && o.contains(e)));
            const els0 = [...new Set([...outer, ...r.host.querySelectorAll('[data-fx-order]')])].filter(e => e.offsetParent);
            const ordered = smartOrder(r, els0);
            const ov = state.fxObj[pk] = {}; ordered.forEach(e => { ov[pathOf(e, r.host)] = v === 'none' ? { fx: 'none' } : { fx: v, when: 'click', dir: v === 'wipe' ? 'left' : 'bottom', dur: 500 }; });
            state.fxOrd[pk] = ordered.map(e => pathOf(e, r.host)); if (v === 'none') delete state.fxOrd[pk]; stopFx(); state.fxSel = null; refx(state.sel); if (v !== 'none') setTimeout(playFx, 50); };
          rowA.appendChild(selA); body.appendChild(rowA); }
        // THỨ TỰ: danh sách các khối có hiệu ứng, kéo lên / xuống; số thứ tự cũng hiện trên slide
        if (r && fx.length) { const ol = document.createElement('ol'); ol.className = 'fxord';
          const els = fx.map(a => [...r.host.querySelectorAll('[data-fx-order]')].find(x => String(x.dataset.fxOrder) === String(a.order))).filter(Boolean);
          const paths = els.map(e => pathOf(e, r.host));
          const ovOf = (path, e) => Object.assign({ fx: e.dataset.fx || 'fade', when: e.dataset.fxWhen || 'click', dir: e.dataset.fxDir || 'bottom', dur: +e.dataset.fxDur || 500 }, (state.fxObj[pk] || {})[path] || {});
          const setOv = (path, e, patch) => { (state.fxObj[pk] = state.fxObj[pk] || {})[path] = Object.assign(ovOf(path, e), patch); };
          const multi = state.fxMulti && state.fxMulti.pk === pk ? state.fxMulti.set : (state.fxMulti = { pk, set: [] }).set;
          let step = 0;
          els.forEach((e, i) => { const a = fx[i]; const li = document.createElement('li'); const nm = fxName(e); const path = paths[i];
            const sub = a.when !== 'click' && i > 0; if (!sub) step++;
            if (sub) li.classList.add('sub'); if (path === state.fxSel) li.classList.add('on'); if (multi.includes(path)) li.classList.add('pick');
            const W = { click: ['Bấm', 'Chạy khi bấm'], with: ['Cùng', 'Chạy CÙNG LÚC với khối trên'], after: ['Sau', 'Chạy ngay SAU khối trên, không cần bấm'] }[a.when] || ['Bấm', ''];
            li.innerHTML = `<b>${sub ? '' : step}</b><button type="button" class="fxw" title="${W[1]} – bấm để đổi">${W[0]}</button><span class="fxn">${nm.replace(/[<>&]/g, '')}</span>`;
            // BẤM → CÙNG → SAU: đổi cách chạy ngay trên dòng (dòng đầu chỉ có Bấm / Sau)
            li.querySelector('.fxw').onclick = ev => { ev.stopPropagation(); const nx = { click: i > 0 ? 'with' : 'after', with: 'after', after: 'click' }[a.when] || 'click'; setOv(path, e, { when: nx }); stopFx(); refx(state.sel); };
            const bt = document.createElement('span'); bt.className = 'fxmv';
            const pl = document.createElement('button'); pl.type = 'button'; pl.textContent = '▶'; pl.title = 'Chạy thử khối này'; pl.onclick = ev => { ev.stopPropagation(); state.fxDemo = path; drawMain(); };
            const del = document.createElement('button'); del.type = 'button'; del.textContent = '✕'; del.title = 'Bỏ hiệu ứng khối này'; del.onclick = ev => { ev.stopPropagation(); setOv(path, e, { fx: 'none' }); if (state.fxSel === path) state.fxSel = null; stopFx(); refx(state.sel); };
            bt.append(pl, del); li.appendChild(bt); ol.appendChild(li);
            // NỐI NHANH (người dùng 25/10): rê chuột vào KHE giữa 2 dòng → hiện nút nối; bấm = dòng dưới chạy CÙNG LÚC với dòng trên (bấm lại = tách ra lần bấm riêng)
            if (i > 0) { const lk = document.createElement('span'); lk.className = 'fxlk' + (a.when === 'with' ? ' on' : ''); const on = a.when === 'with';
              lk.title = on ? 'Đang chạy cùng lúc với dòng trên · bấm để tách ra lần bấm riêng' : 'Bấm để chạy CÙNG LÚC với dòng trên (bớt 1 lần bấm)';
              lk.innerHTML = `<i>${on ? '⛓ Cùng lúc · tách' : '🔗 Chạy cùng lúc'}</i>`;
              lk.onclick = ev => { ev.stopPropagation(); setOv(path, e, { when: on ? 'click' : 'with' }); stopFx(); refx(state.sel); };
              lk.draggable = false; li.appendChild(lk); }
            // bấm dòng = chọn khối; Ctrl / ⌘ / Shift + bấm = chọn nhiều dòng để gộp chạy cùng lúc
            li.onclick = ev => { if (ev.ctrlKey || ev.metaKey || ev.shiftKey) { const k = multi.indexOf(path); if (k >= 0) multi.splice(k, 1); else multi.push(path); drawPanel(); return; }
              multi.length = 0; state.fxSel = path; state.fxDemo = path; drawMain(); drawPanel(); };
            // KÉO THẢ: thả vào MÉP TRÊN dòng = chèn trước; thả vào GIỮA dòng = gộp, chạy cùng lúc với dòng đó
            li.draggable = true;
            li.addEventListener('dragstart', ev => { ev.dataTransfer.setData('text/plain', String(i)); ev.dataTransfer.effectAllowed = 'move'; li.classList.add('drag'); });
            li.addEventListener('dragend', () => { li.classList.remove('drag'); ol.querySelectorAll('.over,.join').forEach(x => x.classList.remove('over', 'join')); });
            const zone = ev => { const b = li.getBoundingClientRect(); return ev.clientY - b.top < b.height * 0.35 ? 'over' : 'join'; };
            li.addEventListener('dragover', ev => { ev.preventDefault(); ev.dataTransfer.dropEffect = 'move'; ol.querySelectorAll('.over,.join').forEach(x => x.classList.remove('over', 'join')); li.classList.add(zone(ev)); });
            li.addEventListener('drop', ev => { ev.preventDefault(); const from = +ev.dataTransfer.getData('text/plain'), z = zone(ev); if (isNaN(from) || from === i) return;
              const arr = paths.slice(); const [m] = arr.splice(from, 1); const to = arr.indexOf(path); arr.splice(z === 'join' ? to + 1 : to, 0, m); state.fxOrd[pk] = arr;
              if (z === 'join') setOv(m, els[from], { when: 'with' }); else if (ovOf(m, els[from]).when !== 'click') setOv(m, els[from], { when: 'click' });
              stopFx(); refx(state.sel); }); });
          if (multi.length >= 2) { const gb = document.createElement('div'); gb.className = 'row fxgroup';
            const g = document.createElement('button'); g.type = 'button'; g.className = 'btn sm primary'; g.textContent = `⇉ Chạy cùng lúc (${multi.length})`;
            g.onclick = () => { const sel = paths.filter(x => multi.includes(x)); const first = sel[0]; const arr = paths.filter(x => !sel.includes(x) || x === first); arr.splice(arr.indexOf(first) + 1, 0, ...sel.slice(1)); state.fxOrd[pk] = arr;
              sel.slice(1).forEach(x => setOv(x, els[paths.indexOf(x)], { when: 'with' })); multi.length = 0; stopFx(); refx(state.sel); setTimeout(playFx, 50); };
            const u = document.createElement('button'); u.type = 'button'; u.className = 'btn sm'; u.textContent = 'Tách: mỗi khối 1 lần bấm';
            u.onclick = () => { paths.filter(x => multi.includes(x)).forEach(x => setOv(x, els[paths.indexOf(x)], { when: 'click' })); multi.length = 0; stopFx(); refx(state.sel); };
            const c = document.createElement('button'); c.type = 'button'; c.className = 'btn sm'; c.textContent = '✕'; c.title = 'Bỏ chọn'; c.onclick = () => { multi.length = 0; drawPanel(); };
            gb.append(g, u, c); body.appendChild(gb); }
          const rowO = document.createElement('div'); rowO.className = 'row';
          const auto = document.createElement('button'); auto.type = 'button'; auto.className = 'btn'; auto.textContent = '↕ Tự xếp'; auto.title = 'Xếp theo bố cục: cột trái trước, trong cột từ trên xuống; đáp án sau nhóm lựa chọn';
          auto.onclick = () => { const arr = smartOrder(r, els).map(e => pathOf(e, r.host)); state.fxOrd[pk] = arr; stopFx(); refx(state.sel); };
          rowO.appendChild(auto);
          if (state.fxOrd[pk]) { const rs0 = document.createElement('button'); rs0.type = 'button'; rs0.className = 'btn'; rs0.textContent = 'Thứ tự mặc định'; rs0.onclick = () => { delete state.fxOrd[pk]; stopFx(); refx(state.sel); }; rowO.appendChild(rs0); }
          body.appendChild(rowO); body.appendChild(ol);
          body.insertAdjacentHTML('beforeend', '<p class="muted fxhint">Kéo vào <b>giữa</b> một dòng để chạy cùng lúc · Ctrl/⌘ + bấm để chọn nhiều dòng · bấm chữ Bấm/Cùng/Sau để đổi.</p>'); }
        const el = r && state.fxSel ? byPath(r.host, state.fxSel) : null;
        if (!el) body.insertAdjacentHTML('beforeend', '<p class="muted">Bấm vào một khối trên slide (câu hỏi, lựa chọn, ô từ, hình…) để gắn hiệu ứng riêng. Hiệu ứng sẽ chạy thử ngay trên slide, lặp 3 lần.</p>');
        else { const ov = (state.fxObj[pk] || {})[state.fxSel]; const cur = ov || { fx: el.dataset.fx || 'none', when: el.dataset.fxWhen || 'click', dir: el.dataset.fxDir || 'bottom', dur: +el.dataset.fxDur || 500 };
          const name = fxName(el);
          body.insertAdjacentHTML('beforeend', `<p class="fxsel-name"><b>Khối:</b> ${name.replace(/[<>&]/g, '')}</p>`);
          const save = (patch) => { const nv = Object.assign({}, cur, patch); (state.fxObj[pk] = state.fxObj[pk] || {})[state.fxSel] = nv; stopFx(); state.fxDemo = nv.fx === 'none' ? null : state.fxSel; refx(state.sel); };
          const grid = document.createElement('div'); grid.className = 'fxgrid'; body.appendChild(grid);
          const mkSel = (label, opts, val, key) => { const w = document.createElement('label'); w.className = 'fxcell'; const sl = document.createElement('select'); sl.setAttribute('aria-label', label); opts.forEach(([v, t]) => sl.add(new Option(t, v))); sl.value = String(val); sl.onchange = () => save({ [key]: key === 'dur' ? +sl.value : sl.value }); w.append(Object.assign(document.createElement('small'), { textContent: label }), sl); grid.appendChild(w); return sl; };
          const f = mkSel('Hiệu ứng', [['none', 'Không'], ['appear', 'Hiện ra'], ['fade', 'Hiện dần'], ['fly', 'Bay vào'], ['zoom', 'Phóng to'], ['wipe', 'Quét']], cur.fx, 'fx');
          if (cur.fx === 'fly' || cur.fx === 'wipe') mkSel('Hướng', [['bottom', 'Từ dưới'], ['left', 'Từ trái'], ['right', 'Từ phải'], ['top', 'Từ trên']], cur.dir, 'dir');
          if (cur.fx !== 'none') { mkSel('Thời lượng', [[300, '0,3 s'], [500, '0,5 s'], [800, '0,8 s']], cur.dur, 'dur'); mkSel('Chạy', [['click', 'Khi bấm'], ['with', 'Cùng khối trước'], ['after', 'Sau khối trước']], cur.when, 'when'); }
          const row2 = document.createElement('div'); row2.className = 'row';
          const demo = document.createElement('button'); demo.type = 'button'; demo.className = 'btn sm'; demo.textContent = '↻ Chạy thử'; demo.title = 'Chạy thử khối này'; demo.onclick = () => { state.fxDemo = state.fxSel; drawMain(); }; if (cur.fx !== 'none') row2.appendChild(demo);
          if (ov) { const u = document.createElement('button'); u.type = 'button'; u.className = 'btn sm'; u.textContent = '↶ Mặc định'; u.title = 'Trả về như máy gắn'; u.onclick = () => { delete state.fxObj[pk][state.fxSel]; stopFx(); state.fxDemo = null; refx(state.sel); }; row2.appendChild(u); }
          const rs = document.createElement('button'); rs.type = 'button'; rs.className = 'btn sm'; rs.textContent = '✕ Bỏ chọn'; rs.onclick = () => { state.fxSel = null; state.fxDemo = null; drawMain(); drawPanel(); }; row2.appendChild(rs);
          body.appendChild(row2);
          }
      } else {
        body.insertAdjacentHTML('beforeend', '<p class="muted">Cách slide chuyển sang slide kế tiếp khi trình chiếu.</p>');
        const trSel = document.createElement('select'); trSel.id = 'trStyle'; trSel.setAttribute('aria-label', 'Kiểu chuyển cảnh');
        [['NONE', 'Không chuyển cảnh'], ['DISSOLVE', 'Mờ dần'], ['PUSH_FROM_RIGHT', 'Đẩy sang trái'], ['SLIDE_FROM_RIGHT', 'Trượt vào từ phải']].forEach(([v, t]) => trSel.add(new Option(t, v)));
        trSel.value = state.tr.style;
        const scSel = document.createElement('select'); scSel.id = 'trScope'; scSel.setAttribute('aria-label', 'Áp dụng cho');
        [['all', 'Mọi slide'], ['section', 'Chỉ bìa, chuyển mục, kết thúc']].forEach(([v, t]) => scSel.add(new Option(t, v))); scSel.value = state.tr.scope; scSel.disabled = state.tr.style === 'NONE';
        const durSel = document.createElement('select'); durSel.id = 'trDur'; durSel.setAttribute('aria-label', 'Thời lượng');
        [[0.3, 'Nhanh (0,3 giây)'], [0.5, 'Vừa (0,5 giây)'], [0.8, 'Chậm (0,8 giây)']].forEach(([v, t]) => durSel.add(new Option(t, v))); durSel.value = state.tr.duration; durSel.disabled = state.tr.style === 'NONE';
        trSel.onchange = () => { state.tr.style = trSel.value; build(); }; scSel.onchange = () => { state.tr.scope = scSel.value; build(); }; durSel.onchange = () => { state.tr.duration = +durSel.value; };
        [['Kiểu', trSel], ['Áp dụng', scSel], ['Thời lượng', durSel]].forEach(([l, e]) => { const w = document.createElement('label'); w.className = 'fxrow'; w.append(document.createTextNode(l + ' '), e); body.appendChild(w); });
      }
    } else if (tab === 'images') {
      const r = state.slides[state.sel]; const imgs = (r && r.images) || [];
      const st = window.PLS_IMAGES ? window.PLS_IMAGES.stats() : {};
      /* người dùng 25/10: bỏ dòng giới thiệu kho ảnh */
      const rf = document.createElement('button'); rf.type = 'button'; rf.className = 'btn'; rf.textContent = 'Cập nhật danh sách ảnh từ Drive';
      rf.onclick = async () => { rf.disabled = true; rf.textContent = 'Đang cập nhật…'; try { const o = await window.PLS_IMAGES.refresh(); rf.textContent = 'Đã cập nhật: ' + Object.entries(o).map(([k, v]) => k + ' ' + v).join(', '); build(); } catch (e) { rf.textContent = 'Lỗi: ' + e.message; } };
      p.appendChild(rf);
      if (window.PLS_REVIEW) window.PLS_REVIEW.panel(p, () => build());   // ảnh người dùng gửi lên chờ duyệt → Duyệt vào kho / Bỏ
      if (!imgs.length) { p.insertAdjacentHTML('beforeend', '<p class="muted">Slide này không có ô ảnh nội dung.</p>'); return; }
      const HOW = { near: 'Gần nghĩa chủ đề – nên soát', exact: 'Khớp đúng', variant: 'Biến thể', synonym: 'Đồng nghĩa', user: 'Người chọn', none: 'Thiếu hình', removed: 'Đã bỏ ảnh', empty: 'Để trống (gõ từ để thêm ảnh)' };
      imgs.forEach(im => {
        const d = document.createElement('div'); d.className = 'issue' + (state.focusImg === im.key ? ' focus' : ''); d.dataset.key = im.key;
        const lv = im.type === 'none' ? 'vang' : '';
        d.innerHTML = `<div class="row"><b>${escapeHtml(im.word || im.slot)}</b><span class="pill ${lv}">${HOW[im.type] || im.type}</span></div>` + (im.id ? `<img class="imgnow" alt="${escapeHtml(im.label || '')}" src="${window.PLS_IMAGES.url(im.id, 240)}"><span class="muted">${escapeHtml(im.label || '')}</span>` : '');
        const key = 'img:' + im.key;
        const setOv = v => { const k = r.src + '/' + r.part; const o = (state.imgOv[k] = state.imgOv[k] || {}); if (v == null) delete o[key]; else o[key] = v; if (im.word && window.PLS_IMAGES.pick) window.PLS_IMAGES.pick(window.PLS_IMAGES.srcOfBrand(state.brand), im.word, v); build(); };
        // ảnh tải lên: dùng ngay trong bài + gửi Drive "Ảnh chờ duyệt" (từ đã có ảnh trong kho → đánh dấu đề xuất thay ảnh cũ)
        const upload = (f, note) => { if (!f) return; const rd = new FileReader(); rd.onload = () => { setOv(rd.result);
          if (!window.PLS_REVIEW) return; const vi = (r.spec.data[im.key.replace(/(^|\.)img$/, '$1vi')] || '');
          window.PLS_REVIEW.submit(rd.result, { word: im.word || vi, vi, brand: state.brand, lesson: state.spec.lesson, slide: state.sel + 1, comp: r.host.dataset.comp, slot: im.key, replace: im.id && /exact|variant|synonym|user/.test(im.type) ? { id: im.id, label: im.label || '' } : null })
            .then(x => setStatus(x.dup ? 'Ảnh này đã gửi duyệt trước đó.' : `Đã gửi ảnh "${im.word || vi}" lên Drive chờ duyệt.`)).catch(e => setStatus('Chưa gửi được ảnh lên Drive (sẽ tự gửi lại): ' + e.message)); };
          rd.readAsDataURL(f); };
        const cands = im.cands && im.cands.length ? im.cands : (im.word ? window.PLS_IMAGES.search(im.word, window.PLS_IMAGES.srcOfBrand(state.brand), 6) : []);
        if (cands.length) {
          const g = document.createElement('div'); g.className = 'cands';
          cands.forEach(c => { const b = document.createElement('button'); b.type = 'button'; b.title = c.label + (c.prev ? ' – ảnh từng dùng cho nghĩa này' : ''); b.innerHTML = `<img alt="" src="${window.PLS_IMAGES.url(c.id, 160)}"><span>${escapeHtml(c.label)}</span>`; b.onclick = () => setOv('id:' + c.id); g.appendChild(b); });
          d.insertAdjacentHTML('beforeend', '<span class="muted">Gợi ý gần nghĩa (bấm để chọn):</span>'); d.appendChild(g);
        }
        const row = document.createElement('div'); row.className = 'row';
        const q = document.createElement('input'); q.type = 'search'; q.placeholder = 'Tìm ảnh khác…'; q.setAttribute('aria-label', 'Tìm ảnh trong kho');
        q.onchange = () => { if (q.value.trim()) setOv(q.value.trim()); };
        const rm = document.createElement('button'); rm.type = 'button'; rm.textContent = im.type === 'removed' ? 'Tự gắn lại' : 'Bỏ ảnh'; rm.onclick = () => setOv(im.type === 'removed' ? undefined : '-');
        const upl = document.createElement('label'); upl.className = 'btn file'; upl.textContent = im.id ? 'Tải ảnh khác' : 'Tải ảnh lên'; upl.title = im.id ? 'Dùng cho bài này và gửi duyệt: đề xuất thay ảnh cũ trong kho' : 'Dùng cho bài này và gửi duyệt vào kho';
        const ufi = document.createElement('input'); ufi.type = 'file'; ufi.accept = 'image/png,image/jpeg,image/webp'; ufi.onchange = () => upload(ufi.files[0]); upl.appendChild(ufi);
        row.append(q, rm, upl); d.appendChild(row);
        if (im.why || im.soat) d.insertAdjacentHTML('beforeend', `<span class="muted">${escapeHtml(im.why || ('Cần soát: ' + im.soat))}</span>`);
        if (im.key) {   // 29/10: mọi ô ảnh đều có gói tạo ảnh – ô thiếu / đã bỏ ảnh mở sẵn; ô đang có ảnh thu gọn "Tạo ảnh mới thay ảnh này" (ảnh tải lên vẫn gửi duyệt rồi vào kho)
          const lack = im.type === 'none' || im.type === 'empty' || im.type === 'removed';
          // GÓI TẠO ẢNH: prompt + ảnh mẫu phong cách của kho + ảnh gần nghĩa → tạo bằng công cụ AI rồi tải lên ô
          const slotEl = r.host.querySelector(`[data-img-key="${CSS.escape(im.key)}"]`);
          const sb = slotEl ? slotEl.getBoundingClientRect() : null;
          const word = im.word || '';
          // MÔ TẢ CẢNH (người dùng 28/10): máy soạn sẵn từ dữ liệu ô (từ, nghĩa, câu ví dụ, chủ đề); sửa tay được, lưu theo ô ảnh của slide
          // MỘT PROMPT DUY NHẤT (người dùng 28/10): máy soạn sẵn nội dung cần vẽ từ dữ liệu ô (từ, nghĩa, câu ví dụ, chủ đề) + phong cách + kỹ thuật; sửa thẳng trong ô, lưu theo ô ảnh của slide
          const ok = r.src + '/' + r.part, dk = 'imgdesc:' + im.key;
          const topic0 = String((state.spec.common || {})['header.topic'] || '').trim();
          const ctx = Object.assign({}, im.ctx || {}, { title: (im.ctx && im.ctx.title) || topic0 });
          const w0 = word || (im.ctx && (im.ctx.vi || im.ctx.term || im.ctx.slide)) || topic0 || state.spec.lesson || '';
          const pk = window.PLS_IMAGES.stylePack(w0, state.brand, { bai: state.spec.lesson, level: (state.spec.meta || {}).level, w: sb && sb.width, h: sb && sb.height, ctx });
          const g = document.createElement('details'); g.className = 'pack'; g.open = lack;
          g.innerHTML = lack ? `<summary>Prompt tạo ảnh (${pk.kho}, khung ${pk.ratio}) – sửa thẳng trong ô</summary>` : `<summary>Tạo ảnh mới thay ảnh này – prompt (${pk.kho}, khung ${pk.ratio})</summary>`;
          const ta = document.createElement('textarea'); ta.className = 'prompt'; ta.value = ((state.imgOv[ok] || {})[dk]) || pk.prompt; ta.setAttribute('aria-label', 'Prompt tạo ảnh');
          ta.oninput = () => { const o = (state.imgOv[ok] = state.imgOv[ok] || {}); const v = ta.value; if (v.trim() && v !== pk.prompt) o[dk] = v; else delete o[dk]; };
          const LA = window.PLS_LOCAL_AI, extra = [];
          if (LA && LA.cfg().on && (!LA.state.at || LA.state.slide)) {   // AI trên máy (Ollama, model Slide – mặc định pls-tools) – miễn phí; soạn lại dòng "Cảnh:" trong prompt
            const ai = document.createElement('button'); ai.type = 'button'; ai.className = 'btn'; ai.textContent = 'Soạn cảnh bằng AI trên máy';
            ai.onclick = async () => { ai.disabled = true; ai.textContent = 'Đang soạn…';
              try { const t = (await LA.ask('slide', [{ role: 'user', content: `Viết 1–2 câu tiếng Việt mô tả CỤ THỂ một bức tranh minh hoạ cho từ vựng dạy ngoại ngữ, để hoạ sĩ vẽ: ai/cái gì, đang làm gì, ở đâu, đồ vật nào. Không chữ trong tranh. Chỉ trả về đoạn mô tả.\nTừ: ${ctx.term || ''} ${ctx.ipa || ''}\nNghĩa: ${w0}\n${ctx.ex ? 'Câu ví dụ: ' + ctx.ex + '\n' : ''}Chủ đề: ${ctx.title || state.spec.lesson || ''}` }], { maxTokens: 200 })).text;
                const line = '- Cảnh: ' + String(t).trim().replace(/\s*\n+\s*/g, ' ');
                ta.value = /^- Cảnh:.*$/m.test(ta.value) ? ta.value.replace(/^- Cảnh:.*$/m, line) : line + '\n' + ta.value; ta.oninput(); ai.textContent = 'Soạn lại cảnh bằng AI trên máy'; }
              catch (e) { ai.textContent = 'Lỗi AI trên máy: ' + e.message; } ai.disabled = false; };
            extra.push(ai);
          }
          const cp = document.createElement('button'); cp.type = 'button'; cp.className = 'btn'; cp.textContent = 'Sao chép prompt';
          cp.onclick = async () => { try { await navigator.clipboard.writeText(ta.value); cp.textContent = 'Đã sao chép'; } catch (e) { ta.select(); cp.textContent = 'Bấm Ctrl+C để sao chép'; } };
          const refs = document.createElement('div'); refs.className = 'cands';
          pk.refs.forEach(x => { const a2 = document.createElement('a'); a2.href = x.url; a2.target = '_blank'; a2.rel = 'noopener'; a2.innerHTML = `<img alt="" src="${window.PLS_IMAGES.url(x.id, 160)}"><span>Mẫu: ${escapeHtml(x.label)}</span>`; refs.appendChild(a2); });
          if (pk.near) { const a3 = document.createElement('a'); a3.href = pk.near.url; a3.target = '_blank'; a3.rel = 'noopener'; a3.innerHTML = `<img alt="" src="${window.PLS_IMAGES.url(pk.near.id, 160)}"><span>Gần nghĩa: ${escapeHtml(pk.near.label)}</span>`; refs.appendChild(a3); }
          const up = document.createElement('label'); up.className = 'btn file'; up.textContent = lack ? 'Tải ảnh đã tạo lên' : 'Tải ảnh mới lên (thay ảnh này)';
          const fi = document.createElement('input'); fi.type = 'file'; fi.accept = 'image/png,image/jpeg,image/webp'; up.appendChild(fi);
          fi.onchange = () => upload(fi.files[0]);
          const acts = document.createElement('div'); acts.className = 'acts'; acts.append(cp, ...extra, up);
          g.append(ta, acts, refs);
          g.insertAdjacentHTML('beforeend', '<span class="muted">Tải ảnh mẫu (bấm vào ảnh) đính kèm cùng prompt vào công cụ tạo ảnh. Ảnh tải lên dùng ngay trong bài và tự gửi lên Drive chờ duyệt; duyệt xong ảnh vào kho cho các bài sau.</span>');
          d.appendChild(g);
        }
        p.appendChild(d);
      });
    } else if (tab === 'data') {
      const ta = document.createElement('textarea'); ta.id = 'specJson'; ta.value = JSON.stringify(state.spec, null, 1); ta.setAttribute('aria-label', 'Dữ liệu bài (JSON)');
      const b = document.createElement('button'); b.type = 'button'; b.className = 'primary'; b.textContent = 'Áp dụng và dựng lại';
      const msg = document.createElement('p'); msg.className = 'muted';
      b.onclick = () => { try { state.spec = JSON.parse(ta.value); state.overrides = {}; build(); msg.textContent = 'Đã áp dụng.'; } catch (e) { msg.textContent = 'JSON lỗi: ' + e.message; } };
      p.append(ta, b, msg);
    } else if (tab === 'claude') {
      if (window.PLS_CLAUDE) window.PLS_CLAUDE.panel(p);
    }
  }
  const escapeHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function setStatus(t) { $('#status').textContent = t; }

  // ---------- xuất PPTX ----------
  // Dựng bản xuất: cùng nội dung + ghi đè, đổi sang font an toàn theo thiết bị, co chữ lại, soát lại
  // BẢN HỌC VIÊN (đặc tả §31.2, người dùng chốt 23/10): bỏ hẳn đáp án khỏi file – không dựa vào ẩn / hiệu ứng
  const isStudent = aud => (aud || state.aud) === 'student';
  function exportView(device, aud) {
    const xs = $('#xstage'); xs.innerHTML = ''; const dk = { count: {} };
    const out = state.slides.map((r, i) => {
      const x = E.render(r.spec, state.brand); xs.appendChild(x.host);
      if (isStudent(aud)) x.host.querySelectorAll('[data-n]').forEach(el => { if (E.roleOfName(el.dataset.n) === 'answer') el.remove(); });
      if (window.PLS_STRIP) window.PLS_STRIP.node(x.host);   // bỏ mã nội bộ MS-/KN-/TV-/NP-/HT- khỏi chữ trên slide ở CẢ 2 bản (người dùng 28/10); mã chỉ còn trong Ghi chú giảng
      if (window.PLS_IMAGES) window.PLS_IMAGES.fill(x.host, state.brand, r.spec.data, dk);   // bộ đếm ảnh chung cả bài như trên web
      E.applyExportFonts(x.host, state.brand, device);
      if (state.hier) E.hierarchy(x);
      E.typoLayout(x);
      x.fitLog = E.fitText(x); E.typoSpread(x); x.issues = E.audit(x).filter(i => i.code !== 'noImage'); x.slide = i + 1;
      x.spec = r.spec; x.src = r.src; x.part = r.part;
      return x;
    });
    // QC 25/10 (người dùng: "tải về hiệu ứng lạ, không khớp web"): bản xuất phải đi ĐÚNG đường như trên web –
    // chuẩn cỡ chữ cả bài → dấu ✓ icon → hiệu ứng (bộ mặc định khoanh / nối / trượt + chỉnh tay từng khối + thứ tự kéo thả)
    if (E.deckNormalize) try { E.deckNormalize(out); } catch (e) { console.warn('[PLS] export normalize', e); }
    out.forEach(x => { try { if (E.markIcons) E.markIcons(x.host); const pk = x.src + '/' + x.part; E.planFx(x, state.fx);
      if (window.PLS_FXP && state.fx.on && !isStudent(aud)) { const pid = state.fxp[pk] || (state.fx.hideAnswer ? defPreset(x) : null); if (pid && pid !== 'auto') window.PLS_FXP.apply(x, pid); }   // bản học viên: không khoanh / nối đáp án
      applyObjFx(x, pk); } catch (e) { console.warn('[PLS] export fx', e); } });
    return out;
  }
  // GHI CHÚ GIẢNG (Notes dưới slide): máy soạn từ Excel (import-excel.js / auto.js), người dùng sửa được; bản sửa giữ theo slide (nguồn/phần)
  const notesKey = r => r.src + '/' + r.part;
  function notesOf(r) { const k = notesKey(r), base = k in state.notesOv ? state.notesOv[k] : ((r.spec && r.spec.notes) || ''); const an = r.rootEl && r.rootEl.dataset && r.rootEl.dataset.dnAnswer; return an && !base.includes(an) ? (base ? base + '\n\n' : '') + an : base; }   // cách triển khai có đáp án riêng (hoàn thành / dịch câu) → thêm vào ghi chú GV
  function drawNotes(r) {
    let box = $('#notesBox'); if (!box) { box = document.createElement('details'); box.id = 'notesBox'; box.open = true; $('#canvas').after(box); }
    if (!r) { box.hidden = true; return; } box.hidden = false;
    const k = notesKey(r), edited = k in state.notesOv;
    box.innerHTML = `<summary><b>Ghi chú giảng</b> <span class="muted">· ẩn dưới slide (Notes trong PowerPoint / Google Slides)${edited ? ' · đã sửa tay' : ''}</span></summary>`;
    const ta = document.createElement('textarea'); ta.id = 'notesText'; ta.rows = 7; ta.value = notesOf(r); ta.setAttribute('aria-label', 'Ghi chú giảng của slide');
    ta.placeholder = 'GIẢNG\n• …\n\nLƯU Ý\n• …';
    ta.oninput = () => { state.notesOv[k] = ta.value; };
    box.appendChild(ta);
    if (edited) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.textContent = 'Về ghi chú máy soạn'; b.onclick = () => { delete state.notesOv[k]; drawNotes(r); }; box.appendChild(b); }
  }
  function stdCtx() { const m = (state.spec && state.spec.meta) || {}; return { transition: state.tr, brand: state.brand, level: m.level || '', no: m.no || 1, sessionType: m.sessionType || '', title: m.title || (state.spec && state.spec.lesson) || 'Bai' }; }
  function curDevice() { const devs = E.devicesOf(state.brand); return devs.find(d => d.key === state.device) || devs[0]; }
  function drawDeviceSel() {
    const devs = E.devicesOf(state.brand); const s = $('#device'); s.innerHTML = '';
    devs.forEach(d => s.add(new Option(d.font ? `Mở trên ${d.tag}` : 'Mở trên mọi máy', d.key)));
    s.value = curDevice().key; s.disabled = devs.length === 1;
  }
  // Hình bài đã dùng → <tên>_hinh.zip (thư mục hinh/, tên theo tên file trong kho; mỗi ảnh một lần). Lỗi ở đây không chặn việc xuất PPTX.
  async function exportImages(keep, pptxName) {
    const seen = new Map(), used = new Set(), files = []; let fail = 0;
    for (const i of keep) for (const im of (state.slides[i] || {}).images || []) if (im && im.id && im.type !== 'none' && im.type !== 'empty' && im.type !== 'removed' && !seen.has(im.id)) seen.set(im.id, im);
    for (const [id, im] of seen) {
      try {
        const b = await window.PLS_IMAGES.bytes(window.PLS_IMAGES.url(id, 1600));
        let n = String(im.label || im.word || id).replace(/[\\/:*?"<>|]+/g, '_').trim() || id, k = n, c = 1;
        while (used.has(k.toLowerCase())) k = n + '_' + (++c);
        used.add(k.toLowerCase()); files.push(['hinh/' + k + '.png', b]);
      } catch (e) { fail++; console.warn('[PLS] không lấy được hình', id, e.message); }
    }
    if (!files.length) return { n: 0, fail };
    const zname = pptxName.replace(/\.pptx$/, '') + '_hinh.zip';
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([window.PPTX.zip(files)], { type: 'application/zip' })); a.download = zname; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return { n: files.length, fail, name: zname };
  }

  // audio bài nghe → nhúng vào PPTX: vùng bấm trong suốt phủ lên nút ▶ của thanh phát, bấm khi trình chiếu là phát
  async function attachAudio(model, xs) {
    let n = 0;
    for (let k = 0; k < xs.length; k++) {
      const host = xs[k].host, bar = host.querySelector('[data-n="audio"][data-audio]'), m = model.slides[k];
      if (!bar || !m || !window.PLS_LISTEN) continue;
      try {
        const play = bar.querySelector('[data-n="play"]') || bar, hr = host.getBoundingClientRect(), pr = play.getBoundingClientRect(), sc = (model.w || 1920) / hr.width;
        m.audio = { ...(await window.PLS_LISTEN.clipFile(bar.dataset.audio)), x: (pr.left - hr.left) * sc, y: (pr.top - hr.top) * sc, w: pr.width * sc, h: pr.height * sc };
        n++;
      } catch (e) { console.warn('[PLS] audio', e); }
    }
    return n;
  }
  async function exportPptx(deviceKey, aud) {
    aud = aud || state.aud; const stu = aud === 'student';
    const devs = E.devicesOf(state.brand);
    const device = devs.find(d => d.key === (deviceKey || state.device)) || devs[0];
    setStatus(`Đang xuất PPTX (${device.tag})…`);
    const all = exportView(device.font ? device : null, aud), keep = all.map((x, i) => i).filter(i => !stu || !/^Slide\/(Answer Key|Activity Steps)$/.test(state.slides[i].spec._from || state.slides[i].spec.comp));   // bản học viên: bỏ slide đáp án + các bước dạy của giáo viên (người dùng 29/10)
    const xs = keep.map(i => all[i]);
    // QC F06 → người dùng 25/10: thiếu hình KHÔNG chặn xuất nữa (vẫn tải PPTX về, ô thiếu hình giữ khung trống) – chỉ báo đúng slide để bổ sung sau
    const noImg = keep.map(i => [i + 1, ((state.slides[i] || {}).images || []).filter(x => x && (x.type === 'none' || x.type === 'empty'))]).filter(([, x]) => x.length);
    const imgWarn = noImg.length ? ` · còn ${noImg.reduce((a, [, x]) => a + x.length, 0)} ô thiếu hình (${noImg.slice(0, 4).map(([n]) => 'slide ' + n).join(', ')}${noImg.length > 4 ? '…' : ''})` : '';
    const bad = xs.flatMap(x => x.issues.filter(i => i.lv === 'do').map(i => `slide ${x.slide}: ${i.msg}`));
    const model = await E.toModel(xs.map(x => x.host), { transition: state.tr });
    if (!stu) model.slides.forEach((m, k) => { const i = keep[k]; if (state.slides[i]) m.notes = window.PLS_STRIP ? window.PLS_STRIP.text(notesOf(state.slides[i])) : notesOf(state.slides[i]); });   /* người dùng 29/10: ghi chú giảng trong PPTX cũng không lộ mã (KN-001…) */   // ghi chú giảng (có đáp án) chỉ ở bản giáo viên   // ghi chú giảng → Notes của từng slide
    const nAudio = await attachAudio(model, xs);
    const bytes = window.PPTX.build(model);
    $('#xstage').innerHTML = '';
    let name = window.PLS_STD ? window.PLS_STD.fileName(stdCtx(), 'pptx') : `${(state.spec.lesson || 'bai').replace(/[^\p{L}\p{N}]+/gu, '_')}.pptx`;   // RB-CH-02
    if (devs.length > 1) name = name.replace(/\.pptx$/, '_' + ({ win: 'Win', mac: 'Mac', and: 'Android' }[device.key] || device.key) + '.pptx');
    if (stu) name = name.replace(/\.pptx$/, '_HocVien.pptx');
    if (bad.length) console.warn('[PLS] lỗi sau khi đổi font xuất:', bad);
    if (window.PLS_LOG) {   // số liệu cho vòng tự học (tab images / lint / layout trên Sheet)
      const kho = window.PLS_IMAGES ? window.PLS_IMAGES.srcOfBrand(state.brand) : '';
      const ev = [];
      state.slides.forEach((r, i) => {
        (r.images || []).forEach(im => { if (im.word || im.id) ev.push({ type: 'image', brand: state.brand, kho, word: im.word || '', how: im.type === 'none' ? 'missing' : im.type, img: im.label || im.id || '', via: im.via || '' }); });
        const by = {}; r.issues.forEach(x => (by[x.code] = by[x.code] || []).push(x.msg)); Object.entries(by).forEach(([k, v]) => ev.push({ type: 'lint', slide: i + 1, tpl: r.host.dataset.comp, kind: k, n: v.length, msg: v.join(' | ') }));
        if (r.plans && r.part === 0) ev.push({ type: 'layout', prefix: 'vocab', n: (state.spec.slides[r.src].items || []).length, chosen: r.plans.find(p => p.active).label, ranking: r.plans.map(p => p.label + ' ' + p.score) });
      });
      window.PLS_LOG.events(ev);
    }
    state.exportWarns = bad;
    let saved = false;
    /* người dùng 25/10: xuất bài = tải file về máy bình thường (không qua dịch vụ nào) */
    if (!saved) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
    let hinh = ''; try { const h = await exportImages(keep, name); if (h.n) hinh = ` + ${h.n} hình (${h.name})` + (h.fail ? `, ${h.fail} hình lỗi` : ''); } catch (e) { console.warn('[PLS] xuất hình lỗi', e); }
    setStatus(`Đã xuất ${name} (${Math.round(bytes.length / 1024)} KB)` + (nAudio ? ` · ${nAudio} audio bài nghe` : '') + hinh + imgWarn + (bad.length ? ` · ${bad.length} lỗi sau khi đổi font – xem tab Soát lỗi` : ''));
    drawPanel();
    return { name, bytes: bytes.length, device: device.tag, issues: bad };
  }

  // cột "Ảnh Drive" trong S6 (ghi bởi Tải S5-S6 đã sửa) → nhớ ảnh theo từ trước khi dựng (người dùng 28/10: nhập lại vẫn giữ ảnh đã QC)
  function seedPicks(s6) {
    const IM = window.PLS_IMAGES; if (!s6 || !IM || !IM.pick) return 0; const src = IM.srcOfBrand(state.brand); let n = 0;
    for (const rows of Object.values(s6)) for (const r of rows || []) {
      let v = r && r['Ảnh Drive'] != null ? String(r['Ảnh Drive']).trim() : ''; { const m = v.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{5,})/); if (m) v = 'id:' + m[1]; }   // link Drive → mã ảnh
      if (!/^(id:\S+|-)$/.test(v)) continue;
      for (const h of ['Nghĩa', 'Từ', 'Hán tự', 'Chữ / âm', 'Câu']) if (r[h] != null && String(r[h]).trim()) { IM.pick(src, String(r[h]).replace(/\s+/g, ' ').trim(), v); n++; }
    }
    return n;
  }
  // TỰ CẬP NHẬT ÊM (người dùng 29/10: không popup, không giật): trước khi tải lại sang bản mới, lưu bài đang mở + chỗ sửa tay vào sessionStorage;
  // tải xong mở lại đúng bộ Excel (File gần đây), buổi, brand, slide và các chỗ đã sửa
  const RESUME_KEY = 'pls_resume_v1', RESUME_F = ['overrides', 'qcEdits', 'notesOv', 'fxp', 'imgOv', 'layoutSel', 'choice', 'fontMode', 'device', 'aud', 'sel'];
  function resumeSave() {
    try { if (!state.recentId || !state.spec) { sessionStorage.removeItem(RESUME_KEY); return; }
      const o = { id: state.recentId, buoi: +$('#buoi').value, brand: state.brand }; RESUME_F.forEach(k => { o[k] = state[k]; });
      sessionStorage.setItem(RESUME_KEY, JSON.stringify(o)); } catch (e) { /* bộ nhớ đầy → tải lại như thường */ } }
  async function resumeLoad() {
    let o; try { o = JSON.parse(sessionStorage.getItem(RESUME_KEY) || 'null'); sessionStorage.removeItem(RESUME_KEY); } catch (e) { return; }
    let home = false; try { home = sessionStorage.getItem('pls_go_home') === '1'; sessionStorage.removeItem('pls_go_home'); } catch (e) { /* */ }
    if (home) return;   // bấm logo "về màn hình bắt đầu" → không tự mở lại bài cũ (bản sửa vẫn lưu, mở lại từ File gần đây – 29/10)
    if (!o) { try { const l = JSON.parse(localStorage.getItem('pls_last_open') || 'null'); const e = l && await EDB.get(`${l.id}|${l.buoi}|${l.brand}`); if (e && e.edits && hasEdits(e.edits) && Date.now() - e.at < 7 * 864e5) o = { id: l.id, buoi: l.buoi, brand: l.brand }; } catch (e) { /* không có bản lưu */ } }   // tab bị treo / tắt ngang → mở lại đúng bài đang sửa
    if (!o || !o.id) return; const r = await RDB.get(o.id).catch(() => null); if (!r) return;
    state.brand = o.brand || r.brand || state.brand; $('#brand').value = state.brand; state.srcFiles = r.files || null; state.recentId = r.id;
    await openBooks(r.books, r.names, o.buoi || r.buoi, true);
    RESUME_F.forEach(k => { if (o[k] !== undefined) state[k] = o[k]; }); cleanEdits(); if ($('#fontMode')) $('#fontMode').value = state.fontMode; if ($('#device')) $('#device').value = state.device;
    if (window.PLS_QC) window.PLS_QC.refresh(); await build(); if (state.sel && state.slides && state.sel < state.slides.length) { drawList(); drawMain(); drawPanel(); }
  }
  // TỰ LƯU BẢN SỬA (người dùng 29/10 – gấp: máy lag / treo tab là mất hết chỗ đã sửa + ảnh đã thêm):
  // lưu vào IndexedDB của máy (không giới hạn 5 MB, giữ cả ảnh tải lên) theo bài + buổi + brand: sau mỗi lần dựng lại, mỗi 4 giây nếu có đổi, và khi tab ẩn / đóng.
  // Mở lại bài / chuyển về buổi cũ / mở lại trình duyệt sau khi treo → tự nạp lại bản sửa.
  const EDB = (() => { let dbp;
    const open = () => dbp || (dbp = new Promise((res, rej) => { const q = indexedDB.open('pls-edits', 1); q.onupgradeneeded = () => q.result.createObjectStore('edits', { keyPath: 'key' }); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }));
    const run = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction('edits', mode); const q = fn(t.objectStore('edits')); t.oncomplete = () => res(q && 'result' in q ? q.result : undefined); t.onerror = () => rej(t.error); }); };
    return { get: k => run('readonly', st => st.get(k)), put: r => run('readwrite', st => st.put(r)) }; })();
  const EDIT_F = ['overrides', 'qcEdits', 'notesOv', 'fxp', 'imgOv', 'layoutSel', 'choice'];
  const editKey = () => state.recentId && state.spec ? `${state.recentId}|${+$('#buoi').value}|${state.brand}` : null;
  let lastSaved = '', saveT = 0, restoring = false, curKey = null;   // curKey: khoá của buổi ĐANG sửa (đổi buổi → vẫn lưu vào buổi cũ)
  function snapEdits() { const o = {}; EDIT_F.forEach(k => { o[k] = state[k] || {}; }); return o; }
  const hasEdits = o => EDIT_F.some(k => o[k] && Object.keys(o[k]).length);
  async function editSave() { const key = curKey || editKey(); if (!key || restoring) return; let js; try { js = JSON.stringify(snapEdits()); } catch (e) { return; }
    if (js === lastSaved) return; lastSaved = js;
    try { await EDB.put({ key, at: Date.now(), sel: state.sel, edits: JSON.parse(js) }); { const [id, bu, br] = key.split('|'); localStorage.setItem('pls_last_open', JSON.stringify({ id, buoi: +bu, brand: br, at: Date.now() })); } }
    catch (e) { console.warn('[PLS] không tự lưu được bản sửa', e); } }
  const editSaveSoon = () => { clearTimeout(saveT); saveT = setTimeout(editSave, 600); };
  async function editRestore() { const key = editKey(); curKey = key; if (!key) return false; let r = null; try { r = await EDB.get(key); } catch (e) { return false; }
    if (!r || !r.edits || !hasEdits(r.edits)) { lastSaved = JSON.stringify(snapEdits()); return false; }
    EDIT_F.forEach(k => { if (r.edits[k]) state[k] = r.edits[k]; }); if (r.sel != null) state.sel = r.sel;
    cleanEdits(); lastSaved = JSON.stringify(snapEdits()); if (window.PLS_QC) window.PLS_QC.refresh();
    if (typeof setStatus === 'function') setStatus('Đã khôi phục bản sửa lưu lúc ' + new Date(r.at).toLocaleTimeString('vi-VN')); return true; }
  setInterval(editSave, 4000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') editSave(); });
  window.addEventListener('pagehide', editSave);
  window.PLS_RESUME = { save: resumeSave, editSave, editKey };
  { const lg = document.querySelector('.brandmark a.logo-svg'); if (lg) lg.addEventListener('click', () => { try { editSave(); sessionStorage.setItem('pls_go_home', '1'); sessionStorage.removeItem(RESUME_KEY); } catch (e) { /* */ } }); }
  function fromExcel() {
    try { editSave(); } catch (e) { /* */ }   // lưu ngay bản sửa của buổi đang mở trước khi đổi buổi / brand
    seedPicks(state.book && state.book.s6);
    const r = window.PLS_IMPORT.buildSpec(state.book.s6, state.book.s5, +$('#buoi').value, state.brand);
    state.importWarns = r.warns; state.flow = r.flow || null; $('#lessonName').textContent = r.spec.lesson;
    state.spec = r.spec; state.overrides = {}; state.qcEdits = {}; if (window.PLS_QC) window.PLS_QC.refresh(); state.imgOv = {}; state.layoutSel = {}; state.choice = {}; state.notesOv = {}; state.fxp = {}; state.sel = 0; touchRecent();
    restoring = true; return withAudio(r.spec).then(() => editRestore()).catch(() => false).then(() => { restoring = false; return build(); });   // bản sửa đã tự lưu của buổi này
  }

  // dựng lại từ Excel nhưng GIỮ mọi chỉnh sửa (sửa ô trong bảng Dữ liệu gốc – 29/10)
  function rebuildKeep() {
    const r = window.PLS_IMPORT.buildSpec(state.book.s6, state.book.s5, +$('#buoi').value, state.brand);
    state.importWarns = r.warns; state.flow = r.flow || null; state.spec = r.spec; const sel = state.sel;
    return withAudio(r.spec).then(() => build()).then(() => { state.sel = Math.min(sel, (state.slides || []).length - 1); drawList(); drawMain(); drawPanel(); });
  }
  // audio bài nghe tạo sẵn (web/audio/…, listen-lib.js) → điền vào thanh phát của slide Nghe trước khi dựng
  function withAudio(spec) { return window.PLS_LISTEN ? window.PLS_LISTEN.apply(spec).then(n => { state.listenN = n; }).catch(() => {}) : Promise.resolve(); }
  // ---------- cổng lệnh ----------
  window.PLS = {
    loadExcelBooks(books, buoi) { state.book = books; const s = $('#buoi'); s.innerHTML = ''; window.PLS_IMPORT.sessions(books.s6).forEach(x => s.add(new Option('Buổi ' + x.buoi + (x.bai != null ? ' · Bài ' + x.bai : ''), x.buoi))); s.value = buoi; s.hidden = false; return fromExcel(); },
    load(spec) { state.spec = spec; state.brand = spec.brand || state.brand; state.overrides = {}; state.choice = {}; $('#brand').value = state.brand; return build(); },
    build, exportPptx, devices: () => E.devicesOf(state.brand), standard: () => state.std,
    device(k) { state.device = k; return build(); }, fontMode(m) { state.fontMode = m; $('#fontMode').value = m; return build(); }, hier(on) { state.hier = !!on; $('#hier').value = on ? '1' : '0'; return build(); },
    issues() { return state.slides.map((r, i) => ({ slide: i + 1, comp: r.host.dataset.comp, score: r.score, issues: r.issues })); },
    typo() { return state.slides.map((r, i) => ({ slide: i + 1, comp: r.host.dataset.comp, typo: r.typo || [] })).filter(x => x.typo.length); },
    set(slide, slot, text) { const r = state.slides[slide - 1]; if (!r) throw new Error('Không có slide ' + slide); setSlot(r, slot, text); return build(); },
    notes(slide) { const r = state.slides[slide - 1]; return r ? notesOf(r) : null; },
    setNotes(slide, text) { const r = state.slides[slide - 1]; if (!r) throw new Error('Không có slide ' + slide); if (text == null) delete state.notesOv[notesKey(r)]; else state.notesOv[notesKey(r)] = String(text); if (state.sel === slide - 1) drawNotes(r); return notesOf(r); },
    fxDetect(slide) { const r = state.slides[slide - 1]; return r && window.PLS_FXP ? window.PLS_FXP.detect(r) : null; },
    fxPreset(slide, id, all) { const r = state.slides[slide - 1]; if (!r) throw new Error('Không có slide ' + slide); const t = window.PLS_FXP.detect(r).type; const ks = all && t ? state.slides.filter(x => window.PLS_FXP.detect(x).type === t).map(x => x.src + '/' + x.part) : [r.src + '/' + r.part]; ks.forEach(k => { if (id === 'auto') delete state.fxp[k]; else state.fxp[k] = id; }); return build(); },
    choose(slide, label) { const r = state.slides[slide - 1]; state.choice[r.src] = label; return build(); },
    brand(b) { state.brand = b; $('#brand').value = b; return build(); },
    images() { return state.slides.map((r, i) => ({ slide: i + 1, images: r.images })); },
    setImage(slide, slotKey, value) { const r = state.slides[slide - 1]; const k = r.src + '/' + r.part; (state.imgOv[k] = state.imgOv[k] || {})['img:' + slotKey] = value; const im = (r.images || []).find(x => x.key === slotKey); if (im && im.word && window.PLS_IMAGES.pick) window.PLS_IMAGES.pick(window.PLS_IMAGES.srcOfBrand(state.brand), im.word, value); return build(); },
    get spec() { return state.spec; },
    _modelForTest: () => E.toModel(state.slides.map(r => r.host), {}),
    _int: { state, setSlot, build, byPath, showEmpty, curDevice, stdCtx, openBooks, saveRecent, rebuildKeep, select(i) { state.sel = i; state.fxStep = null; drawList(); drawMain(); drawPanel(); }, redraw() { drawPanel(); }, setStatus }
  };

  // ---------- khởi động ----------
  function init() {
    const sel = $('#brand'); BRANDS.forEach(b => sel.add(new Option(b, b)));
    sel.onchange = () => { state.brand = sel.value; if (state.book) fromExcel(); else build(); };
    // Excel giáo trình: S6 (nội dung) bắt buộc, S5 (khung buổi: timeline, dặn dò) nên có
    $('#xlsx').onchange = async ev => {
      try {
        if (!window.XLSX) throw new Error('chưa tải được thư viện đọc Excel');
        const books = {};
        const files = {};   // giữ nguyên file gốc để "Tải S5-S6 đã sửa" ghi đúng ô, giữ định dạng
        for (const f of ev.target.files) { const buf = await f.arrayBuffer(); const wb = XLSX.read(buf, { type: 'array' }); const b = window.PLS_IMPORT.readWorkbook(wb, XLSX); if (Object.keys(b).some(k => /^S6-/.test(k))) { books.s6 = b; files.s6 = { name: f.name, buf }; } else if (b['S5']) { books.s5 = b; files.s5 = { name: f.name, buf }; } }
        state.srcFiles = files;
        if (!books.s6) throw new Error('không thấy file S6 (các tab "S6-…")');
        const names = [...ev.target.files].map(f => f.name);
        { const d = window.PLS_IMPORT.detectBrand(books, names); if (d && BRANDS.includes(d.brand)) { state.brand = d.brand; $('#brand').value = d.brand; } }   // lưu File gần đây đúng brand của file
        await saveRecent(books, names, state.srcFiles);
        openBooks(books, names);
      } catch (e) { setStatus('Không đọc được Excel: ' + e.message); }
    };
    $('#btnBuild').onclick = () => build();
    $('#device').onchange = () => { state.device = $('#device').value; build(); };
    $('#fontMode').onchange = () => { state.fontMode = $('#fontMode').value; build(); };
    $('#hier').onchange = () => { state.hier = $('#hier').value === '1'; build(); };
    if ($('#optMaster')) { const c = $('#optMaster'); try { c.checked = localStorage.getItem('pls.pptxMaster') === '1'; } catch (e) { } c.onchange = () => { try { localStorage.setItem('pls.pptxMaster', c.checked ? '1' : '0'); } catch (e) { } }; }
    $('#btnPptx').onclick = () => {
      const devs = E.devicesOf(state.brand);
      if (devs.length === 1 || state.fontMode === 'safe') return exportPptx(curDevice().key).catch(e => setStatus('Xuất lỗi: ' + e.message));
      const m = $('#devMenu'); m.innerHTML = ''; m.hidden = !m.hidden;
      devs.forEach(d => { const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Bản ' + d.tag + ' (' + d.font + ')'; b.onclick = () => { m.hidden = true; exportPptx(d.key).catch(e => setStatus('Xuất lỗi: ' + e.message)); }; m.appendChild(b); });
    };
    document.querySelectorAll('[role=tab]').forEach(t => t.onclick = () => { document.querySelectorAll('[role=tab]').forEach(x => x.setAttribute('aria-selected', x === t)); drawPanel(); });
    if ($('#file')) $('#file').onchange = async ev => { const f = ev.target.files[0]; if (!f) return; try { const spec = JSON.parse(await f.text()); window.PLS.load(spec); } catch (e) { setStatus('File không đọc được: ' + e.message); } };
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(drawMain, 150); });
    state.spec = null; sel.value = state.brand;   // mở trang: chưa có bài → màn hình bắt đầu (không dựng bài mẫu)
    // nạp sẵn font brand trước khi đo (font web chỉ tải khi được dùng → đo sớm sẽ sai)
    const FONTS = ['900 40px "Zalando Sans Expanded"', '400 40px Montserrat', '600 40px Montserrat', '700 40px Montserrat', '900 40px Montserrat', '600 40px "Barlow Condensed"', '700 40px Lexend', '400 40px Inter', '700 40px Inter', '400 20px "Source Sans 3"', '700 20px "Source Sans 3"', '400 40px "Gothic A1"', '700 40px "Gothic A1"', '400 40px "Noto Sans JP"', '400 20px "Noto Serif KR"'];
    Promise.race([Promise.allSettled(FONTS.map(f => document.fonts.load(f, 'Aaăâđêôơư'))), new Promise(r => setTimeout(r, 4000))]).then(() => build()).then(() => resumeLoad()).catch(e => console.warn('[PLS] mở lại bài sau cập nhật', e))
      .then(() => { const P = window.PLS_IMAGES; if (P && P.clipReady) P.clipReady.then(j => { if (j && state.slides && state.slides.length) build(); }); })   // gợi ý ảnh CLIP tải xong sau khi đã dựng → dựng lại
      .then(() => window.PLS_IMAGES && window.PLS_IMAGES.autoRefresh(r => { setStatus('Đã cập nhật danh sách ảnh: ' + Object.entries(r).map(([k, v]) => k + ' ' + v).join(', ')); build(); }));
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
