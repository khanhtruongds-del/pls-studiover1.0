// BỘ HIỆU ỨNG NHANH (người dùng chốt 23/10): nhận diện dạng slide → gợi ý vài bộ hiệu ứng dựng sẵn, bấm 1 lần là gắn xong.
// Chỉ dùng Appear (chuẩn v2.0 RB-PPT-08). Đáp án / dây nối / chữ đáp án là LỚP PHỦ máy tự vẽ theo màu brand (không sửa mẫu Figma),
// mỗi lớp phủ là 1 nhóm → PowerPoint chạy Appear cho cả nhóm; Google Slides / Keynote đều chạy được.
// Không chọn bộ nào → giữ cách tự gắn cũ (planFx theo vai trò lớp). Người dùng chọn → ghi đè cho slide đó.
(function (root) {
  const E = () => root.PLS_ENGINE;
  const W = 1920, LET = ['A', 'B', 'C', 'D', 'E', 'F'];
  const INK = 'var(--color-primary-fill, var(--color-primary, #406864))', ON = 'var(--color-on-dark, #ffffff)';

  // ---------- nhận diện dạng ----------
  // trả về { type, label, presets:[{id,label,desc}] } – dựa vào mẫu slide + dữ liệu đáp án lấy từ Excel (spec.ans)
  function detect(r) {
    const comp = (r.host && r.host.dataset.comp) || '', ans = (r.spec && r.spec.ans) || null, P = [];
    let type = null, label = '';
    if (ans && ans.kind === 'mc' && ans.marks.length) { type = 'mc'; label = 'Trắc nghiệm';
      P.push({ id: 'mc-ring', label: 'Khoanh đáp án đúng', desc: 'Lựa chọn hiện sẵn · mỗi câu 1 lần bấm → khung + ✓ ở đáp án đúng' },
        { id: 'mc-opts', label: 'Bấm hiện lựa chọn → khoanh đáp án', desc: 'Bấm 1: hiện cả 4 lựa chọn · bấm 2: khoanh đáp án đúng' },
        { id: 'mc-seq', label: 'Từng lựa chọn → khoanh đáp án', desc: 'Mỗi lựa chọn 1 lần bấm, cuối cùng khoanh đáp án đúng' }); }
    else if (ans && ans.kind === 'match' && ans.pairs.length) { type = 'match'; label = 'Nối cột';
      P.push({ id: 'match-each', label: 'Nối dây từng cặp', desc: 'Mỗi lần bấm 1 dây nối câu trái → đáp án phải' },
        { id: 'match-all', label: 'Nối dây cùng lúc', desc: '1 lần bấm hiện tất cả dây nối' },
        { id: 'match-key', label: 'Hiện chữ đáp án (1 – c)', desc: 'Mỗi lần bấm hiện chữ cái đáp án cạnh câu trái' }); }
    else if (ans && ans.kind === 'text' && ans.items.some(x => x.text)) { type = 'text'; label = /Order/.test(comp) ? 'Sắp xếp câu' : 'Điền / viết';
      P.push({ id: 'text-each', label: 'Hiện đáp án từng câu', desc: 'Mỗi lần bấm hiện đáp án 1 câu (chữ màu brand)' },
        { id: 'text-all', label: 'Hiện đáp án cùng lúc', desc: '1 lần bấm hiện đáp án cả slide' }); }
    else if (/^Slide\/(Vocab Grid \d|Vocab Trio|Vocab Picture)/.test(comp)) { type = 'vocab'; label = 'Từ vựng có hình';
      P.push({ id: 'vocab-each', label: 'Hình trước, chữ sau (từng thẻ)', desc: 'Hình hiện sẵn · mỗi lần bấm hiện từ + nghĩa của 1 thẻ' },
        { id: 'vocab-all', label: 'Hình trước, chữ sau (cùng lúc)', desc: 'Hình hiện sẵn · 1 lần bấm hiện chữ cả slide' }); }
    else if (/^Slide\/Vocab Single$/.test(comp)) { type = 'vocab1'; label = 'Từ vựng 1 từ';
      P.push({ id: 'vocab-single', label: 'Hình → từ → nghĩa → ví dụ', desc: 'Hình hiện sẵn · bấm lần lượt ra từ, nghĩa, ví dụ' }); }
    P.push({ id: 'auto', label: 'Tự gắn theo lớp (mặc định)', desc: 'Câu hỏi → lựa chọn → mục → đáp án như trước' }, { id: 'none', label: 'Không hiệu ứng', desc: 'Slide hiện đủ ngay' });
    return { type, label, presets: P };
  }

  // ---------- đo vị trí trong hệ toạ độ slide 1920×1080 ----------
  const rootOf = r => r.host.firstElementChild;
  function geo(r) { const rt = rootOf(r), a = rt.getBoundingClientRect(), s = a.width / W || 1;
    return el => { const b = el.getBoundingClientRect(); return { x: (b.left - a.left) / s, y: (b.top - a.top) / s, w: b.width / s, h: b.height / s }; }; }
  // khung ôm phần CHỮ thật (không ôm cả hàng kéo dài hết thẻ)
  function inkBox(r, el) { const g = geo(r), boxes = [];
    el.querySelectorAll('[data-text], [data-n$="_box"]').forEach(t => { if (t.offsetParent === null) return;
      if (t.dataset.text) { const rg = document.createRange(); rg.selectNodeContents(t); const rs = [...rg.getClientRects()]; if (rs.length) { const fake = { getBoundingClientRect: () => rg.getBoundingClientRect() }; boxes.push(g(fake)); return; } }
      boxes.push(g(t)); });
    if (!boxes.length) return g(el);
    const x = Math.min(...boxes.map(b => b.x)), y = Math.min(...boxes.map(b => b.y)), X = Math.max(...boxes.map(b => b.x + b.w)), Y = Math.max(...boxes.map(b => b.y + b.h));
    return { x, y, w: X - x, h: Y - y }; }
  const fontOf = el => { const t = el && (el.dataset.text ? el : el.querySelector('[data-text]')); return t ? getComputedStyle(t).fontFamily : 'sans-serif'; };

  // ---------- lớp phủ ----------
  function layer(r) { const rt = rootOf(r); let L = rt.querySelector(':scope > [data-n="fx.layer"]');
    if (!L) { L = document.createElement('div'); L.dataset.n = 'fx.layer'; L.style.cssText = 'position:absolute;left:0;top:0;width:1920px;height:1080px;pointer-events:none;z-index:50'; rt.appendChild(L); }
    return L; }
  const div = (css, n) => { const d = document.createElement('div'); d.style.cssText = 'box-sizing:border-box;position:absolute;' + css; if (n) d.dataset.n = n; return d; };
  function textDiv(css, text, ff, n) { const d = div(css, n); d.dataset.text = '1'; d.textContent = text; d.style.fontFamily = ff; d.style.whiteSpace = 'pre'; return d; }
  // khung đáp án đúng + dấu ✓
  function ring(r, el, n) { const b = inkBox(r, el), p = 14, ff = fontOf(el);
    const w = div(`left:${b.x - p}px;top:${b.y - p}px;width:${b.w + 2 * p + 70}px;height:${b.h + 2 * p}px;border:6px solid ${INK};border-radius:24px`, n);
    const d = Math.min(56, b.h + 2 * p - 16);
    w.appendChild(textDiv(`right:10px;top:${(b.h + 2 * p - 12 - d) / 2}px;width:${d}px;height:${d}px;border-radius:50%;background:${INK};color:${ON};font-size:${Math.round(d * 0.62)}px;font-weight:700;line-height:${d}px;text-align:center`, '✓', ff, n + '.tick'));
    layer(r).appendChild(w); return w; }
  // dây nối: khung = hộp bao của đoạn thẳng; SVG để xem trên web, data-line để xuất PPTX thành đường thẳng thật
  function line(r, a, b, n) { const g = geo(r), A = g(a), B = g(b);
    const x1 = A.x + A.w + 12, y1 = A.y + A.h / 2, x2 = B.x - 12, y2 = B.y + B.h / 2;
    const x = Math.min(x1, x2), y = Math.min(y1, y2), w = Math.max(2, Math.abs(x2 - x1)), h = Math.max(2, Math.abs(y2 - y1));
    const d = div(`left:${x}px;top:${y}px;width:${w}px;height:${h}px;overflow:visible`, n);
    d.dataset.line = [x1 > x2 ? 1 : 0, y1 > y2 ? 1 : 0, 6].join(',');
    d.innerHTML = `<svg width="${w}" height="${h}" style="position:absolute;left:0;top:0;overflow:visible"><line x1="${x1 - x}" y1="${y1 - y}" x2="${x2 - x}" y2="${y2 - y}" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><circle cx="${x1 - x}" cy="${y1 - y}" r="9" fill="currentColor"/><circle cx="${x2 - x}" cy="${y2 - y}" r="9" fill="currentColor"/></svg>`;
    d.style.color = INK; layer(r).appendChild(d); return d; }
  // nhãn tròn (chữ cái đáp án nối cột)
  function badge(r, el, text, n) { const b = inkBox(r, el), d = 60, ff = fontOf(el);
    const w = textDiv(`left:${b.x + b.w + 16}px;top:${b.y + (b.h - d) / 2}px;width:${d}px;height:${d}px;border-radius:50%;background:${INK};color:${ON};font-size:34px;font-weight:700;line-height:${d}px;text-align:center`, text, ff, n);
    layer(r).appendChild(w); return w; }
  // chữ đáp án: đặt trên đường kẻ (sắp xếp câu) hoặc cuối dòng câu hỏi (điền / viết)
  function answerText(r, item, text, n) { const g = geo(r), ff = fontOf(item);
    // ưu tiên đặt cạnh phải phần chữ / thẻ từ (còn ≥ 260px); không đủ chỗ thì đặt ngay dưới (dưới đường kẻ nếu có) – không đè lên chữ câu hỏi
    const ln = item.querySelector('[data-n$=".line"]'), chips = item.querySelector('[data-n$=".chips"]');
    const it = g(item), ink = inkBox(r, chips && chips.offsetParent !== null ? chips : item);
    const room = it.x + it.w - (ink.x + ink.w) - 32; const L = ln && ln.offsetParent !== null ? g(ln) : null;
    const css = room > 260 ? `left:${ink.x + ink.w + 32}px;top:${ink.y + ink.h / 2 - 24}px;max-width:${room}px;font-size:36px;line-height:48px;white-space:normal`
      : `left:${ink.x}px;top:${(L ? L.y + L.h : ink.y + ink.h) + 4}px;max-width:${it.w}px;font-size:32px;line-height:1.3;white-space:normal`;
    const t = textDiv(css + `;color:${INK};font-weight:700;background:var(--color-bg, #ffffff);padding:0 8px;border-radius:10px`, '→ ' + text, ff, n);
    if (/white-space:normal/.test(css)) t.style.whiteSpace = 'normal';
    layer(r).appendChild(t); return t; }

  // ---------- gắn ----------
  function apply(r, id) {
    const rt = rootOf(r); if (!rt) return [];
    rt.querySelectorAll(':scope > [data-n="fx.layer"]').forEach(x => x.remove());
    r.host.querySelectorAll('[data-fx]').forEach(e => { delete e.dataset.fx; delete e.dataset.fxWhen; delete e.dataset.fxOrder; });
    if (id === 'auto') return E().planFx(r, (root.PLS && root.PLS._int && root.PLS._int.state.fx) || {});
    const out = []; let order = 0;
    const add = (el, role, when) => { if (!el) return; order++; el.dataset.fx = 'appear'; el.dataset.fxWhen = when; el.dataset.fxOrder = order; out.push({ n: el.dataset.n, role, fx: 'appear', when, order }); };
    const find = k => E().find(rt, k);
    const ans = (r.spec && r.spec.ans) || {};
    if (id === 'none') return (r.fx = []);
    if (/^mc-/.test(id)) {
      ans.marks.forEach((m, qi) => { if (!m) return; const opt = find(m); if (!opt) return;
        const pre = m.includes('/') ? m.split('/')[0] + '/' : '';
        const opts = LET.map(L => find(pre + 'opt_' + L)).filter(o => o && o.offsetParent !== null && o.querySelector('[data-filled]'));
        if (id === 'mc-opts') opts.forEach((o, i) => add(o, 'option', i ? 'with' : 'click'));
        if (id === 'mc-seq') opts.forEach(o => add(o, 'option', 'click'));
        add(ring(r, opt, `fx.ok_${qi + 1}`), 'answer', 'click'); });
    } else if (/^match-/.test(id)) {
      ans.pairs.forEach(([l, rr, key], i) => { const a = find(l), b = find(rr); if (!a || !b || a.offsetParent === null) return;
        if (id === 'match-key') add(badge(r, a, key || '', `fx.key_${i + 1}`), 'answer', 'click');
        else add(line(r, a, b, `fx.line_${i + 1}`), 'line', id === 'match-all' && i ? 'with' : 'click'); });
    } else if (/^text-/.test(id)) {
      ans.items.forEach((x, i) => { const it = find(x.at); if (!it || !x.text || it.offsetParent === null) return; add(answerText(r, it, x.text, `fx.ans_${i + 1}`), 'answer', id === 'text-all' && out.length ? 'with' : 'click'); });
    } else if (/^vocab-(each|all)$/.test(id)) {
      for (let i = 1; i <= 8; i++) { const v = find(`vocab_${i}`); if (!v || v.offsetParent === null) continue; const t = find(`vocab_${i}.txt`) || v.querySelector('[data-n="txt"]');   // Grid 4: khung txt (từ + nghĩa); Grid 6/8: từ và nghĩa nằm rời
        const parts = t ? [t] : ['de', 'vi'].map(k => find(`vocab_${i}.${k}`)).filter(x => x && x.offsetParent !== null);
        parts.forEach((x, j) => add(x, 'item', j || (id === 'vocab-all' && out.length) ? 'with' : 'click')); }
    } else if (id === 'vocab-single') {
      const de = find('de'), vi = find('vi'), ex = find('example'), ar = find('article_box'), pl = find('plural');
      if (de) { add(de, 'item', 'click'); [ar, pl].forEach(x => x && x.offsetParent !== null && add(x, 'item', 'with')); }
      if (vi && vi.offsetParent !== null) add(vi, 'item', 'click'); if (ex && ex.offsetParent !== null) add(ex, 'item', 'click');
    }
    return (r.fx = out);
  }
  root.PLS_FXP = { detect, apply };
})(typeof window !== 'undefined' ? window : globalThis);
