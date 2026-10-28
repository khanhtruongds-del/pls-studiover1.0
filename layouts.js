// BỐ CỤC THAY THẾ CHO MỖI SLIDE (người dùng 28/10: "một trang nên có nhiều cách dàn layout để các bạn lựa").
// Hai loại phương án:
//   · css  – cùng mẫu, đổi cách xếp (2×2 → 1 hàng → danh sách, ảnh trái ↔ phải…): post(rootEl) chạy ngay sau E.render, trước co chữ / soát lỗi.
//   · swap – đổi sang mẫu khác cùng loại nội dung, chuyển dữ liệu theo tên ô (Mẫu câu ↔ Hội thoại bong bóng, Quy tắc ↔ Quy tắc 35/65…).
// Chọn trong tab "Bố cục" (app.js) → lưu state.layoutSel['src/part'] = id.
(function (root) {
  const q = (el, n) => el.querySelector(`[data-n="${n}"]`);
  const kids = (el, re) => el ? [...el.children].filter(e => re.test(e.dataset.n || '')) : [];
  const st = (el, o) => { if (el) Object.assign(el.style, o); };
  const grid = (box, re, cols, gap) => { if (!box) return; st(box, { flexDirection: 'row', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'flex-start', gap: gap + 'px' });
    kids(box, re).forEach(e => st(e, { flex: `0 0 calc(${100 / cols}% - ${Math.round(gap * (cols - 1) / cols)}px)`, maxWidth: `calc(${100 / cols}% - ${Math.round(gap * (cols - 1) / cols)}px)` })); };
  const list = (box, re) => { if (!box) return; st(box, { flexDirection: 'column', flexWrap: 'nowrap', justifyContent: 'center', alignItems: 'stretch', gap: '18px' }); kids(box, re).forEach(e => st(e, { flex: '0 0 auto', maxWidth: 'none', width: 'auto' })); };
  const pick = (d, re) => Object.fromEntries(Object.entries(d).filter(([k]) => re.test(k)));

  const V = {
    'Slide/Guess Cards': [
      { id: 'grid', label: 'Lưới 2 × 2', css: () => {} },
      { id: 'row', label: '4 thẻ một hàng', css: r => { grid(q(r, 'cards'), /^gc_\d+$/, 4, 24); kids(q(r, 'cards'), /^gc_\d+$/).forEach(c => st(c, { flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '32px 18px' })); r.querySelectorAll('[data-n="body"]').forEach(b => st(b, { alignItems: 'center' })); } },
      { id: 'list', label: 'Danh sách dọc', css: r => { list(q(r, 'cards'), /^gc_\d+$/); kids(q(r, 'cards'), /^gc_\d+$/).forEach(c => st(c, { padding: '12px 28px', gap: '24px' })); r.querySelectorAll('[data-n^="gc_"] [data-n="body"]').forEach(b => st(b, { flexDirection: 'row', alignItems: 'center', gap: '28px' })); r.querySelectorAll('[data-n^="gc_"] [data-n="word"]').forEach(t => { t.style.fontSize = '48px'; t.dataset.fs = '48'; }); r.querySelectorAll('[data-n^="gc_"] [data-n="ans"]').forEach(a => st(a, { marginTop: '0px', marginLeft: 'auto' })); } }],
    'Slide/Lucky Number': [
      { id: 'g4', label: '4 cột', css: () => {} },
      { id: 'g2', label: '2 cột – ô to', css: r => grid(q(r, 'tiles'), /^tile_\d+$/, 2, 28) },
      { id: 'g3', label: '3 cột', css: r => grid(q(r, 'tiles'), /^tile_\d+$/, 3, 28) }],
    'Slide/Pinyin Grid': [
      { id: 'g6', label: '6 cột', css: () => {} },
      { id: 'g4', label: '4 cột – chữ to', css: r => { grid(q(r, 'grid'), /^c_\d+$/, 4, 20); r.querySelectorAll('[data-n^="c_"] [data-n="text"]').forEach(t => { t.style.fontSize = '60px'; t.dataset.fs = '60'; }); } },
      { id: 'g8', label: '8 cột – gọn', css: r => grid(q(r, 'grid'), /^c_\d+$/, 8, 14) }],
    'Slide/Word Sentence': [
      { id: 'left', label: 'Từ bên trái', css: () => {} },
      { id: 'right', label: 'Từ bên phải', css: r => st(q(r, 'columns'), { flexDirection: 'row-reverse' }) },
      { id: 'stack', label: 'Từ trên – câu dưới', css: r => { st(q(r, 'columns'), { flexDirection: 'column', alignItems: 'stretch', gap: '28px' }); st(q(r, 'word_box'), { flex: '0 0 auto', flexDirection: 'row', gap: '36px', padding: '28px 40px' }); st(q(r, 'ans'), { flex: '0 0 auto' }); } }],
    'Slide/Situation': [
      { id: 'list', label: 'Danh sách', css: () => {} },
      { id: 'g2', label: 'Đáp án 2 cột', css: r => grid(q(r, 'answers'), /^ans_\d+$/, 2, 24) },
      { id: 'side', label: 'Câu hỏi trái – đáp án phải', css: r => { const c = q(r, 'q_1') && q(r, 'q_1').parentElement; if (!c) return; const w = document.createElement('div'); w.dataset.n = 'side_wrap'; st(w, { display: 'flex', flexDirection: 'row', gap: '40px', flex: '1 1 0px', minHeight: '0', alignSelf: 'stretch', alignItems: 'center' }); const a = q(r, 'answers'), qq = q(r, 'q_1'); c.insertBefore(w, qq); w.append(qq, a); st(qq, { flex: '0 0 38%', alignSelf: 'center', flexDirection: 'column', alignItems: 'flex-start' }); st(a, { flex: '1 1 0px' }); } }],
    'Slide/Dialogue Order': [
      { id: 'list', label: 'Danh sách', css: () => {} },
      { id: 'g2', label: '2 cột', css: r => grid(q(r, 'lines'), /^dl_\d+$/, 2, 18) }],
    'Slide/Radical Match': [
      { id: 'side', label: 'Bộ thủ bên trái', css: () => {} },
      { id: 'top', label: 'Bộ thủ ở trên', css: r => { st(q(r, 'ring'), { flexDirection: 'column', gap: '28px' }); st(q(r, 'center'), { width: '300px', height: '300px', padding: '30px' }); const rn = q(r, 'radical.name'); if (rn) { rn.style.fontSize = '22px'; rn.dataset.fs = '22'; rn.style.maxWidth = '200px'; } const rd = q(r, 'radical'); if (rd) { rd.style.fontSize = '110px'; rd.dataset.fs = '110'; } grid(q(r, 'chars'), /^rc_\d+$/, 8, 16); st(q(r, 'chars'), { flex: '0 0 auto', alignSelf: 'stretch' }); } }],
    'Slide/Hidden Pinyin': [
      { id: 'left', label: 'Ảnh trái', css: () => {} },
      { id: 'right', label: 'Ảnh phải', css: r => st(q(r, 'columns'), { flexDirection: 'row-reverse' }) },
      { id: 'wide', label: 'Ảnh lớn 70 %', css: r => st(q(r, 'img'), { flex: '0 0 70%' }) }],
    'Slide/Vocab Card': [
      { id: 'left', label: 'Ảnh trái', css: () => {} },
      { id: 'right', label: 'Ảnh phải', css: r => st(q(r, 'columns'), { flexDirection: 'row-reverse' }) },
      { id: 'noimg', label: 'Không ảnh – chữ giữa', css: r => { st(q(r, 'img'), { display: 'none' }); st(q(r, 'info'), { alignItems: 'center', textAlign: 'center' }); } }],
    'Slide/Lead In': [
      { id: 'left', label: 'Ảnh trái', css: () => {} },
      { id: 'right', label: 'Ảnh phải', css: r => st(q(r, 'columns'), { flexDirection: 'row-reverse' }) }],
    'Slide/Pattern List': [
      { id: 'list', label: 'Danh sách mẫu câu', css: () => {} },
      { id: 'bubbles', label: 'Bong bóng hội thoại', swap: d => { const o = { 'header.section': d['header.section'] || '', title: d.title || '', pair: d.rule || 'Đọc to, sau đó đổi vai.' }; for (let i = 1; i <= 6; i++) if (d[`p_${i}.de`]) { o[`line_${i}.who`] = 'AB'[(i - 1) % 2]; o[`line_${i}.de`] = d[`p_${i}.de`]; o[`line_${i}.vi`] = [String(d[`p_${i}.ipa`] || '').replace(/^\/|\/$/g, ''), d[`p_${i}.vi`]].filter(Boolean).join(' · '); } return { comp: 'Slide/Dialogue Bubbles', data: o }; } },
      { id: 'cards', label: 'Thẻ đoán nghĩa', swap: d => { const o = { 'header.section': d['header.section'] || '', title: d.title || '', instruction: d.rule || 'Đọc và nói nghĩa' }; for (let i = 1; i <= 4; i++) if (d[`p_${i}.de`]) { o[`gc_${i}.no`] = String(i); o[`gc_${i}.word`] = d[`p_${i}.de`]; o[`gc_${i}.ipa`] = String(d[`p_${i}.ipa`] || '').replace(/^\/|\/$/g, ''); o[`gc_${i}.vi`] = d[`p_${i}.vi`] || ''; } return { comp: 'Slide/Guess Cards', data: o }; } }],
    'Slide/Dialogue Bubbles': [
      { id: 'bubbles', label: 'Bong bóng hội thoại', css: () => {} },
      { id: 'list', label: 'Danh sách mẫu câu', swap: d => { const o = { 'header.section': d['header.section'] || '', title: d.title || '', rule: d.pair || '' }; let k = 0; for (let i = 1; i <= 6 && k < 4; i++) if (d[`line_${i}.de`]) { k++; const vi = String(d[`line_${i}.vi`] || '').split(/\n| · /); o[`p_${k}.no`] = String(k); o[`p_${k}.de`] = d[`line_${i}.de`]; o[`p_${k}.ipa`] = vi.length > 1 ? '/' + vi[0] + '/' : ''; o[`p_${k}.vi`] = vi[vi.length - 1] || ''; } return { comp: 'Slide/Pattern List', data: o }; } }],
    'Slide/Exercise MC': [
      { id: 'std', label: 'Lựa chọn 2 cột', css: () => {} },
      { id: 'long', label: 'Lựa chọn 1 cột (câu dài)', swap: d => ({ comp: 'Slide/Exercise MC Long', data: d }) }],
    'Slide/Exercise MC Long': [
      { id: 'long', label: 'Lựa chọn 1 cột', css: () => {} },
      { id: 'std', label: 'Lựa chọn 2 cột', swap: d => ({ comp: 'Slide/Exercise MC', data: d }) }],
    'Slide/Grammar Rule': [
      { id: 'rule', label: 'Quy tắc trên – ví dụ dưới', css: () => {} },
      { id: 'split', label: 'Quy tắc trái – ví dụ phải', swap: d => { const o = Object.assign({}, d); for (let i = 1; i <= 4; i++) if (d[`ex_${i}.de`]) o[`ex_${i}.no`] = String(i); return { comp: 'Slide/Grammar Rule Split', data: o }; } },
      { id: 'kpe', label: 'Điểm chính + 2 ví dụ', swap: d => ({ comp: 'Slide/Key Point Examples', data: { 'header.section': d['header.section'] || '', title: d.title || '', point: d.rule || '', position: '', 'ex_1.de': d['ex_1.de'] || '', 'ex_1.vi': d['ex_1.vi'] || '', 'ex_2.de': d['ex_2.de'] || '', 'ex_2.vi': d['ex_2.vi'] || '', ...Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8].map(i => [`chip_${i}.text`, ''])) } }),
        css: r => r.querySelectorAll('[data-n^="ex_"]').forEach(e => { if (/^ex_\d+$/.test(e.dataset.n)) st(e, { alignSelf: 'flex-start', height: 'auto', flex: '1 1 0px', padding: '28px 32px' }); }) }],
    'Slide/Grammar Rule Split': [
      { id: 'split', label: 'Quy tắc trái – ví dụ phải', css: () => {} },
      { id: 'right', label: 'Quy tắc phải – ví dụ trái', css: r => st(q(r, 'columns'), { flexDirection: 'row-reverse' }) },
      { id: 'rule', label: 'Quy tắc trên – ví dụ dưới', swap: d => ({ comp: 'Slide/Grammar Rule', data: pick(d, /^(header\.section|title|rule|ex_[1-3]\.(de|vi))$/) }) }],
    'Slide/Reading': [
      { id: 'img', label: 'Có ảnh', css: () => {} },
      { id: 'noimg', label: 'Chỉ chữ – rộng', css: r => { const im = q(r, 'img'); if (im) st(im, { display: 'none' }); } }]
  };
  // ---------- BỐ CỤC CHUNG cho mọi mẫu (người dùng 28/10: slide nào cũng có 2–3 lựa chọn) ----------
  // Dò cấu trúc mẫu: (a) hàng chính 2 khối trái/phải → đảo bên, xếp dọc; (b) nhóm mục lặp (x_1, x_2, x_3…) xếp dọc → lưới 2 cột, xếp ngang → danh sách.
  const SKIP = /^(brand\.bg|bg|bg\..*|header|section|topic|logo.*|footer|title|instruction.*)$/;
  const isRow = e => /flex-direction:\s*row(?!-)/.test(e.getAttribute('style') || '') || (e.style && e.style.flexDirection === 'row');
  const isCol = e => /flex-direction:\s*column/.test(e.getAttribute('style') || '') || (e.style && e.style.flexDirection === 'column');
  const blocks = e => [...e.children].filter(c => c.dataset && c.dataset.n && !SKIP.test(c.dataset.n) && c.querySelector('[data-text]') && !c.dataset.text);
  const ITEM = /^[a-z]+_\d+$/i;
  function findMain(card) { if (!card) return null; const q = [card]; while (q.length) { const e = q.shift(); if (e !== card && isRow(e) && blocks(e).length === 2 && !ITEM.test(e.dataset.n || '')) return e; if (e === card && isRow(e) && blocks(e).length === 2) return e; [...e.children].forEach(c => { if (c.dataset && c.dataset.n && !ITEM.test(c.dataset.n) && !SKIP.test(c.dataset.n)) q.push(c); }); } return null; }
  function findItems(card) { if (!card) return null; let best = null; card.querySelectorAll('[data-n]').forEach(e => { const k = [...e.children].filter(c => ITEM.test(c.dataset.n || '')); if (k.length >= 3 && (!best || k.length > best.k)) best = { e, k: k.length }; }); return best && best.e; }
  const cardOf = r => r.querySelector('[data-n="card"]') || r;
  const GEN = {
    swap: { label: 'Đảo trái – phải', css: r => { const m = findMain(cardOf(r)); if (m) m.style.flexDirection = 'row-reverse'; } },
    stack: { label: 'Xếp trên – dưới', css: r => { const m = findMain(cardOf(r)); if (!m) return; st(m, { flexDirection: 'column', alignItems: 'stretch' }); blocks(m).forEach(b => st(b, { flex: '0 1 auto', width: 'auto', maxWidth: 'none', minHeight: '0' })); } },
    grid2: { label: 'Lưới 2 cột', css: r => { const b = findItems(cardOf(r)); if (b) grid(b, ITEM, 2, 24); } },
    list: { label: 'Danh sách dọc', css: r => { const b = findItems(cardOf(r)); if (b) list(b, ITEM); } },
    airy: { label: 'Căn giữa, thoáng', css: r => { const c = cardOf(r); st(c, { justifyContent: 'center' }); } }
  };
  const genCache = {};
  function generic(comp) {
    if (genCache[comp]) return genCache[comp];
    const T = root.PLS_TPL && root.PLS_TPL.slides[comp]; if (!T || typeof document === 'undefined') return (genCache[comp] = []);
    const t = document.createElement('template'); t.innerHTML = T.html; const rt = t.content.firstElementChild, card = rt.querySelector('[data-n="card"]') || rt;
    const out = []; const mn = findMain(card);
    if (mn) { out.push('swap'); const tall = blocks(mn).some(b => b.querySelectorAll('[data-text]').length >= 8 || [...b.querySelectorAll('[data-n]')].filter(x => ITEM.test(x.dataset.n || '')).length >= 4); if (!tall) out.push('stack'); }   // khối dài (≥ 4 mục) xếp dọc sẽ tràn
    const it = findItems(card); if (it) { const pic = it.querySelector('[data-img], [data-n$="img"], [data-n="img"]'); const NOGRID = /Match|Table|Answer Key|Order|Dialogue|Pronunciation/; if (!NOGRID.test(comp)) { if (isCol(it)) out.push('grid2'); else if (!pic) out.push('list'); } }   // thẻ có ảnh không xếp thành danh sách dọc (tràn)
    if (out.length < 2) out.push('airy');
    return (genCache[comp] = out.map(id => Object.assign({ id: 'g_' + id }, GEN[id])));
  }
  function variants(spec) { const comp = spec && spec.comp; if (!comp) return [];
    const own = V[comp] || [], gen = generic(comp);
    if (/^Slide\/(Cover|Section|Section Character|End)$/.test(comp)) return [];   // bìa / chuyển mục / kết thúc: giữ nguyên
    const base = own.length ? own : [{ id: 'def', label: 'Mặc định', css: () => {} }];
    return base.concat(gen.filter(g => !own.some(o => o.label === g.label))).slice(0, Math.max(3, own.length)); }
  // trả về spec (có thể đổi mẫu) + hàm post chạy trên rootEl sau khi dựng
  function apply(spec, id) {
    const v = variants(spec).find(x => x.id === id); if (!v) return { spec, post: null };
    if (v.swap) { const s2 = v.swap(spec.data || {}); if (!(root.PLS_TPL && root.PLS_TPL.slides[s2.comp])) return { spec, post: null }; return { spec: Object.assign({}, spec, s2, { _from: spec.comp, _layout: id }), post: v.css || null }; }
    return { spec: Object.assign({}, spec, { _layout: id }), post: v.css };
  }
  root.PLS_LAYOUT = { variants, apply, V };
})(typeof window !== 'undefined' ? window : globalThis);
