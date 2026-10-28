// BỐ CỤC THAY THẾ CHO MỖI SLIDE (người dùng 28/10: "một trang nên có nhiều cách dàn layout để các bạn lựa").
// Hai loại phương án:
//   · css  – cùng mẫu, đổi cách xếp (2×2 → 1 hàng → danh sách, ảnh trái ↔ phải…): post(rootEl) chạy ngay sau E.render, trước co chữ / soát lỗi.
//   · swap – đổi sang mẫu khác cùng loại nội dung, chuyển dữ liệu theo tên ô (Mẫu câu ↔ Hội thoại bong bóng, Quy tắc ↔ Quy tắc 35/65…).
// Chọn trong tab "Bố cục" (app.js) → lưu state.layoutSel['src/part'] = id.
(function (root) {
  const q = (el, n) => el.querySelector(`[data-n="${n}"]`);
  const kids = (el, re) => el ? [...el.children].filter(e => re.test(e.dataset.n || '')) : [];
  const st = (el, o) => { if (el) Object.assign(el.style, o); };
  const grid = (box, re, cols, gap) => { if (!box) return; st(box, { flexDirection: 'row', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', gap: gap + 'px' });
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
      { id: 'top', label: 'Bộ thủ ở trên', css: r => { st(q(r, 'ring'), { flexDirection: 'column', gap: '28px' }); st(q(r, 'center'), { width: '260px', height: '260px', padding: '18px' }); const rn = q(r, 'radical.name'); if (rn) { rn.style.fontSize = '22px'; rn.dataset.fs = '22'; } grid(q(r, 'chars'), /^rc_\d+$/, 8, 16); st(q(r, 'chars'), { flex: '0 0 auto', alignSelf: 'stretch' }); } }],
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
      { id: 'bubbles', label: 'Bong bóng hội thoại', swap: d => { const o = { 'header.section': d['header.section'] || '', title: d.title || '', pair: d.rule || 'Đọc to, sau đó đổi vai.' }; for (let i = 1; i <= 6; i++) if (d[`p_${i}.de`]) { o[`line_${i}.who`] = 'AB'[(i - 1) % 2]; o[`line_${i}.de`] = d[`p_${i}.de`]; o[`line_${i}.vi`] = [d[`p_${i}.ipa`], d[`p_${i}.vi`]].filter(Boolean).join('\n'); } return { comp: 'Slide/Dialogue Bubbles', data: o }; } },
      { id: 'cards', label: 'Thẻ đoán nghĩa', swap: d => { const o = { 'header.section': d['header.section'] || '', title: d.title || '', instruction: d.rule || 'Đọc và nói nghĩa' }; for (let i = 1; i <= 4; i++) if (d[`p_${i}.de`]) { o[`gc_${i}.no`] = String(i); o[`gc_${i}.word`] = d[`p_${i}.de`]; o[`gc_${i}.ipa`] = String(d[`p_${i}.ipa`] || '').replace(/^\/|\/$/g, ''); o[`gc_${i}.vi`] = d[`p_${i}.vi`] || ''; } return { comp: 'Slide/Guess Cards', data: o }; } }],
    'Slide/Dialogue Bubbles': [
      { id: 'bubbles', label: 'Bong bóng hội thoại', css: () => {} },
      { id: 'list', label: 'Danh sách mẫu câu', swap: d => { const o = { 'header.section': d['header.section'] || '', title: d.title || '', rule: d.pair || '' }; let k = 0; for (let i = 1; i <= 6 && k < 4; i++) if (d[`line_${i}.de`]) { k++; const vi = String(d[`line_${i}.vi`] || '').split('\n'); o[`p_${k}.no`] = String(k); o[`p_${k}.de`] = d[`line_${i}.de`]; o[`p_${k}.ipa`] = vi.length > 1 ? '/' + vi[0] + '/' : ''; o[`p_${k}.vi`] = vi[vi.length - 1] || ''; } return { comp: 'Slide/Pattern List', data: o }; } }],
    'Slide/Exercise MC': [
      { id: 'std', label: 'Lựa chọn 2 cột', css: () => {} },
      { id: 'long', label: 'Lựa chọn 1 cột (câu dài)', swap: d => ({ comp: 'Slide/Exercise MC Long', data: d }) }],
    'Slide/Exercise MC Long': [
      { id: 'long', label: 'Lựa chọn 1 cột', css: () => {} },
      { id: 'std', label: 'Lựa chọn 2 cột', swap: d => ({ comp: 'Slide/Exercise MC', data: d }) }],
    'Slide/Grammar Rule': [
      { id: 'rule', label: 'Quy tắc trên – ví dụ dưới', css: () => {} },
      { id: 'split', label: 'Quy tắc trái – ví dụ phải', swap: d => { const o = Object.assign({}, d); for (let i = 1; i <= 4; i++) if (d[`ex_${i}.de`]) o[`ex_${i}.no`] = String(i); return { comp: 'Slide/Grammar Rule Split', data: o }; } },
      { id: 'kpe', label: 'Điểm chính + 2 ví dụ', swap: d => ({ comp: 'Slide/Key Point Examples', data: { 'header.section': d['header.section'] || '', title: d.title || '', point: d.rule || '', position: '', 'ex_1.de': d['ex_1.de'] || '', 'ex_1.vi': d['ex_1.vi'] || '', 'ex_2.de': d['ex_2.de'] || '', 'ex_2.vi': d['ex_2.vi'] || '', ...Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8].map(i => [`chip_${i}.text`, ''])) } }) }],
    'Slide/Grammar Rule Split': [
      { id: 'split', label: 'Quy tắc trái – ví dụ phải', css: () => {} },
      { id: 'right', label: 'Quy tắc phải – ví dụ trái', css: r => st(q(r, 'columns'), { flexDirection: 'row-reverse' }) },
      { id: 'rule', label: 'Quy tắc trên – ví dụ dưới', swap: d => ({ comp: 'Slide/Grammar Rule', data: pick(d, /^(header\.section|title|rule|ex_[1-3]\.(de|vi))$/) }) }],
    'Slide/Reading': [
      { id: 'img', label: 'Có ảnh', css: () => {} },
      { id: 'noimg', label: 'Chỉ chữ – rộng', css: r => { const im = q(r, 'img'); if (im) st(im, { display: 'none' }); } }]
  };
  function variants(spec) { return V[spec && spec.comp] || []; }
  // trả về spec (có thể đổi mẫu) + hàm post chạy trên rootEl sau khi dựng
  function apply(spec, id) {
    const v = variants(spec).find(x => x.id === id); if (!v) return { spec, post: null };
    if (v.swap) { const s2 = v.swap(spec.data || {}); if (!(root.PLS_TPL && root.PLS_TPL.slides[s2.comp])) return { spec, post: null }; return { spec: Object.assign({}, spec, s2, { _from: spec.comp, _layout: id }), post: null }; }
    return { spec: Object.assign({}, spec, { _layout: id }), post: v.css };
  }
  root.PLS_LAYOUT = { variants, apply, V };
})(typeof window !== 'undefined' ? window : globalThis);
