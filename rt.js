// ĐỊNH DẠNG TỪNG CHỮ (người dùng 5/11): bôi đen vài chữ – 1 ký tự / 1 chữ Hán cũng được – bấm B / I / U (hoặc Ctrl+B / I / U) → chỉ đoạn đó đổi
// Dùng chung slide (app.js) và sách (book-ui.js). Lưu dạng "phép" theo khung neo: op = { o: vị trí ký tự, t: chữ đã bôi, b|i|u: true / false }
// Áp lại khi dựng: tìm đúng chữ tại vị trí o (lệch thì lấy chỗ trùng gần nhất) rồi bọc <span data-rt>. Sửa chính cụm chữ đó → định dạng của cụm mất.
// Pinyin dựng sẵn (ruby, [data-n="ruby"]) không tính vào vị trí – khi gõ ô có pinyin chỉ hiện chữ gốc.
(function (root) {
  const SKIP = n => { for (let p = n.parentElement; p; p = p.parentElement) { if (p.dataset && p.dataset.n === 'ruby') return true; if (p.dataset && p.dataset.rtRoot != null) return false; } return false; };
  function textNodes(a) { const tw = document.createTreeWalker(a, NodeFilter.SHOW_TEXT), out = []; let n; while ((n = tw.nextNode())) if (!SKIP(n)) out.push(n); return out; }
  const textOf = a => textNodes(a).map(n => n.data).join('');
  // vị trí đoạn bôi trong chữ của khung neo
  function offsets(a, rg) { let o = -1, pos = 0, t = '';
    for (const n of textNodes(a)) { const L = n.data.length;
      const s = n === rg.startContainer ? rg.startOffset : (rg.comparePoint(n, 0) < 0 ? L : 0), e = n === rg.endContainer ? rg.endOffset : (rg.comparePoint(n, L) > 0 ? 0 : L);
      if (e > s) { if (o < 0) o = pos + s; t += n.data.slice(s, e); } pos += L; }
    return o < 0 || !t ? null : { o, t }; }
  function locate(a, op) { const tx = textOf(a), L = op.t.length; if (!L) return -1; if (tx.substr(op.o, L) === op.t) return op.o;
    let best = -1; for (let i = tx.indexOf(op.t); i >= 0; i = tx.indexOf(op.t, i + 1)) if (best < 0 || Math.abs(i - op.o) < Math.abs(best - op.o)) best = i; return best; }
  const css = (s, op) => { if ('b' in op) s.fontWeight = op.b ? '700' : '400'; if ('i' in op) s.fontStyle = op.i ? 'italic' : 'normal';
    if ('u' in op) { s.textDecoration = op.u ? 'underline' : 'none'; if (op.u) s.textUnderlineOffset = '0.12em'; } };
  function wrap(a, o, L, op) { let pos = 0; const segs = [];
    for (const n of textNodes(a)) { const len = n.data.length, x = Math.max(o, pos), z = Math.min(o + L, pos + len); if (z > x) segs.push([n, x - pos, z - pos]); pos += len; }
    segs.forEach(([n, x, z]) => { let mid = n; if (x > 0) mid = n.splitText(x); if (z - x < mid.data.length) mid.splitText(z - x);
      const p = mid.parentElement; if (p && p.dataset.rt != null && p.childNodes.length === 1) { css(p.style, op); return; }   // span của mình vừa khít → sửa thẳng
      const s = document.createElement('span'); s.dataset.rt = ''; css(s.style, op); mid.parentNode.insertBefore(s, mid); s.appendChild(mid); }); }
  function apply(a, ops) { if (!a || !ops) return; a.dataset.rtRoot = ''; ops.forEach(op => { const o = locate(a, op); if (o >= 0) wrap(a, o, op.t.length, op); }); }
  // đoạn bôi đã đậm / nghiêng / gạch hết chưa (để bấm lần nữa là bỏ)
  function state(a, rg) { const ns = textNodes(a).filter(n => rg.intersectsNode(n) && n.data.trim()), on = { b: !!ns.length, i: !!ns.length, u: !!ns.length };
    ns.forEach(n => { const cs = getComputedStyle(n.parentElement); if (parseFloat(cs.fontWeight) < 600) on.b = false; if (cs.fontStyle !== 'italic') on.i = false;
      let u = false; for (let p = n.parentElement; p && !u; p = p.parentElement) { const d = getComputedStyle(p).textDecorationLine || ''; if (/underline/.test(d)) u = true; if (p === a) break; } if (!u) on.u = false; }); return on; }
  // THANH NỔI B / I / U ngay trên đoạn bôi
  const regs = []; let bar = null, cur = null;
  function find() { const sl = getSelection(); if (!sl.rangeCount || sl.isCollapsed) return null; const rg = sl.getRangeAt(0); if (!rg.toString().trim()) return null;
    let n = rg.commonAncestorContainer; if (n.nodeType !== 1) n = n.parentElement;
    for (const g of regs) { const a = g.anchorOf(n); if (a) { const off = offsets(a, rg); if (off) return { g, a, rg, off }; } } return null; }
  function hide() { if (bar) bar.remove(); bar = null; cur = null; }
  function fire(k) { const f = cur || find(); if (!f) return false; const on = state(f.a, f.rg), op = Object.assign({}, f.off, { [k]: !on[k] }); hide(); f.g.onOp(f.a, op, f.rg); return true; }
  function show() { const f = find(); if (!f) return hide(); cur = f; if (!bar) { bar = document.createElement('div'); bar.className = 'pls-rt-bar';
      bar.style.cssText = 'position:fixed;display:flex;gap:1px;align-items:center;background:#fff;color:#1b1a17;border:1px solid #cfc6ea;border-radius:6px;padding:2px;box-shadow:0 2px 8px rgba(0,0,0,.18);z-index:1002;font:600 12px system-ui,sans-serif';
      [['b', 'B', 'In đậm chữ đang bôi (Ctrl+B)', 'font-weight:800'], ['i', 'I', 'In nghiêng chữ đang bôi (Ctrl+I)', 'font-style:italic;font-family:Georgia,serif'], ['u', 'U', 'Gạch chân chữ đang bôi (Ctrl+U)', 'text-decoration:underline']].forEach(([k, t, tip, st]) => {
        const x = document.createElement('button'); x.type = 'button'; x.dataset.k = k; x.textContent = t; x.title = tip; x.style.cssText = 'border:0;border-radius:4px;padding:2px 8px;cursor:pointer;color:#3a2f6b;min-width:26px;font:inherit;' + st;
        x.onpointerdown = e => { e.preventDefault(); e.stopPropagation(); }; x.onmousedown = e => e.preventDefault(); x.onclick = e => { e.stopPropagation(); fire(k); }; bar.appendChild(x); });
      document.body.appendChild(bar); }
    const on = state(f.a, f.rg); bar.querySelectorAll('button').forEach(x => { x.style.background = on[x.dataset.k] ? '#ece6fb' : 'none'; });
    const R = f.rg.getBoundingClientRect(), r = bar.getBoundingClientRect(), vw = document.documentElement.clientWidth;
    bar.style.left = Math.max(6, Math.min(vw - r.width - 6, R.left + R.width / 2 - r.width / 2)) + 'px'; bar.style.top = (R.top - r.height - 8 < 4 ? R.bottom + 8 : R.top - r.height - 8) + 'px'; }
  let tm = null; document.addEventListener('selectionchange', () => { clearTimeout(tm); tm = setTimeout(show, 120); });
  document.addEventListener('scroll', () => { if (bar) show(); }, true);
  document.addEventListener('keydown', e => { if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return; const k = { b: 'b', i: 'i', u: 'u' }[e.key.toLowerCase()]; if (!k) return; if (find() && fire(k)) e.preventDefault(); }, true);
  root.PLS_RT = { register: g => regs.push(g), apply, offsets, locate, textOf, hide };
})(window);
