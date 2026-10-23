// LUẬT CHỮ ĐẶC BIỆT (chuyển từ fit_js: F.ruby, F.blocks, F.emph, F.bigTiles, F.hero, F.spread)
// Chạy trên DOM của slide; mỗi mảnh chữ vẫn là [data-text] riêng → toModel xuất PPTX đúng vị trí, không cần xử lý thêm.
(function (root) {
  const LADDER = [120, 79.5, 64.5, 55.5, 48, 40.5, 36, 30, 28, 26, 24, 22, 20];
  const R = el => el.getBoundingClientRect();
  const px = el => parseFloat(getComputedStyle(el).fontSize);
  const vis = el => el && el.offsetParent !== null;
  const nm = el => String((el && el.dataset && el.dataset.n) || '').replace(/\s+[@#].*$/, '');
  const scaleOf = host => R(host).width / parseFloat(host.style.width) || 1;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- RUBY / FURIGANA: "{名前|なまえ}は{何|なん}ですか" ----------
  const RUBY = /\{([^|{}]+)\|([^{}]*)\}/;
  function ruby(te, src, host) {
    // khung ngang WRAP căn đáy: đoạn chữ thường (≤ 8 ký tự/đoạn để xuống dòng tự nhiên) + cụm ruby (chữ nhỏ trên, chữ gốc dưới)
    const proto = host.querySelector('[data-n="Part/Ruby"] [data-n="ruby"]');
    const rtColor = proto ? proto.style.color : 'var(--color-text-muted, #6d6d6d)';
    const st = te.getAttribute('style') || '';
    const parts = []; const re = new RegExp(RUBY.source, 'g'); let last = 0, m;
    while ((m = re.exec(src))) { if (m.index > last) parts.push({ t: src.slice(last, m.index) }); parts.push({ b: m[1], r: m[2] }); last = re.lastIndex; }
    if (last < src.length) parts.push({ t: src.slice(last) });
    const seg = t => `<span data-n="seg" data-text="1" style="position:relative;flex:0 0 auto;font-size:1em;white-space:pre;line-height:1.4">${esc(t)}</span>`;
    let html = '';
    for (const p of parts) {
      if (p.t != null) p.t.split('\n').forEach((ln, i) => { if (i) html += '<div data-n="br" style="flex-basis:100%;height:0"></div>'; for (const c of ln.match(/[^\s、。，,]{1,8}[\s、。，,]*|[\s、。，,]+/g) || []) html += seg(c); });
      else html += `<div data-n="rubyunit" style="position:relative;flex:0 0 auto;display:flex;flex-direction:column;align-items:center"><span data-n="ruby" data-text="1" style="position:relative;font-size:0.5em;line-height:1;white-space:pre;text-align:center;font-weight:400;color:${rtColor}">${esc(p.r || ' ')}</span><span data-n="base" data-text="1" style="position:relative;font-size:1em;line-height:1.4;white-space:pre;text-align:center">${esc(p.b)}</span></div>`;
    }
    te.removeAttribute('data-text');
    te.setAttribute('style', st.replace(/white-space:[^;]+;?/, ''));
    Object.assign(te.style, { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', rowGap: '8px' });
    te.dataset.ruby = '1'; te.innerHTML = html;
    return te;
  }

  // ---------- KHỐI CÔNG THỨC: "{Danh từ 1} + <は> + {Danh từ 2} + <ですか>。" ----------
  const BLOCK = /\{[^|{}]*\}|<[^<>]*>/;
  function blocks(frame, src) {
    const P = { n: frame.querySelector(':scope > [data-n="tk_noun"]'), p: frame.querySelector(':scope > [data-n="tk_part"]'), t: frame.querySelector(':scope > [data-n="tk_text"]') };
    const fs = P.n ? (P.n.querySelector('[data-text]') || P.n) : null; const base = fs ? (parseFloat(fs.dataset.fs) || 40.5) : 40.5;
    [...frame.children].forEach(k => { if (!Object.values(P).includes(k)) k.remove(); });
    const re = /\{([^}]*)\}|<([^>]*)>|([^{}<>]+)/g; let m, n = 0;
    while ((m = re.exec(src))) {
      const s = m[3] != null ? m[3].replace(/\s*\+\s*/g, ' + ').trim() : null; if (s === '') continue;
      const kind = m[1] != null ? 'n' : m[2] != null ? 'p' : 't'; const txt = kind === 'n' ? m[1] : kind === 'p' ? m[2] : s;
      let node;
      if (P[kind]) { node = P[kind].cloneNode(true); node.style.display = node.dataset.disp || ''; delete node.dataset.hid; }
      else {   // mẫu không có ô tk_* → tự vẽ: {…} ô viền, <…> ô màu, chữ khác để trơn
        node = document.createElement('div'); node.dataset.text = '1';
        const box = kind === 'n' ? 'padding:0.12em 0.5em;border-radius:12px;box-shadow:inset 0 0 0 2px var(--color-primary);color:var(--color-primary);font-weight:700;background:var(--color-bg,#fff)'
          : kind === 'p' ? 'padding:0.12em 0.5em;border-radius:12px;background:var(--color-primary);color:var(--color-on-dark,#fff);font-weight:700' : '';
        node.setAttribute('style', 'position:relative;flex:0 0 auto;white-space:pre;line-height:1.4;' + box);
      }
      node.dataset.n = kind === 'n' ? 'tk_n' : kind === 'p' ? 'tk_p' : 'tk_t';
      const tx = node.dataset.text ? node : node.querySelector('[data-text]'); tx.textContent = txt; tx.style.fontSize = '1em';
      frame.appendChild(node); n++;
    }
    Object.values(P).forEach(k => { if (k) { k.style.display = 'none'; k.dataset.hid = '1'; } });   // ô mẫu tk_* luôn ẩn sau khi dựng
    frame.style.fontSize = base + 'px'; frame.dataset.blocks = '1';
    return n;
  }
  function blocksInline(te, src) {   // ô chữ thường mà dữ liệu có {…}/<…> → đổi chính ô thành khung ngang
    const st = te.getAttribute('style') || ''; te.removeAttribute('data-text'); te.textContent = '';
    te.setAttribute('style', st.replace(/white-space:[^;]+;?/, ''));
    Object.assign(te.style, { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' });
    blocks(te, src); te.style.fontSize = ''; return te;
  }

  // ---------- PHÂN CẤP CHỮ TRONG 1 Ô (F.emph): dòng nhãn / công thức → đậm; dòng nhãn → màu primary-ink (tương phản ≥ 4,5) ----------
  const LABEL = /^(\s*)([A-ZÀ-Ỹ0-9 \/&()–-]{4,}|[^\n]{1,40}:|Thể (khẳng|phủ|nghi)[^\n]*|\d+\.\s[^\n]{1,60})$/;
  const FORMULA = /\+|=>|⇒|→/;
  function emph(te, v) {
    const lines = String(v).split('\n'); if (lines.filter(l => l.trim()).length < 2) return false;
    const kind = lines.map(l => !l.trim() ? '' : LABEL.test(l) ? 'lab' : FORMULA.test(l) ? 'fml' : 'txt');
    const marked = kind.filter(k => k === 'lab' || k === 'fml').length, txt = kind.filter(k => k === 'txt').length;
    if (!marked || !txt) return false;   // cả ô cùng một kiểu → không có gì để phân cấp
    const tgt = te.querySelector('[data-t]') || te;
    tgt.innerHTML = lines.map((l, i) => kind[i] === 'lab' ? `<span data-seg="lab" style="font-weight:700;color:var(--color-primary-ink, var(--color-primary))">${esc(l)}</span>`
      : kind[i] === 'fml' ? `<span data-seg="fml" style="font-weight:700">${esc(l)}</span>` : esc(l)).join('\n');
    te.dataset.emph = String(marked);
    return true;
  }

  // điền 1 ô có luật đặc biệt; trả về phần tử đã điền, hoặc null nếu là chữ thường
  function special(el, te, v, host) {
    const s = String(v);
    if (el && el.querySelector(':scope > [data-n="tk_noun"], :scope > [data-n="tk_part"]') && (BLOCK.test(s) || /\+/.test(s))) { blocks(el, s); return el; }
    if (!te) return null;
    if (RUBY.test(s)) return ruby(te, s, host);
    if (BLOCK.test(s) && /\+/.test(s)) return blocksInline(te, s);
    return null;
  }

  // ---------- Ô TO (F.bigTiles): lưới wrap còn ít ô, mỗi ô chữ ngắn (≤ 12 ký tự, không ảnh) → ô vuông to, chữ cỡ hiển thị, cụm giữa vùng ----------
  function bigTiles(host) {
    const log = [];
    for (const g of host.querySelectorAll('[data-n]')) {
      const cs = getComputedStyle(g); if (cs.flexWrap !== 'wrap' || cs.flexDirection !== 'row' || !vis(g) || /chips|bank/.test(nm(g))) continue;
      const all = [...g.children].filter(k => k.dataset && k.dataset.n), shown = all.filter(vis);
      if (shown.length < 1 || shown.length >= all.length) continue;
      const s = scaleOf(host), gb = R(g), gw = gb.width / s, gh = gb.height / s;
      if (gh < 300 || Math.min(...shown.map(k => R(k).width / s)) < 200) continue;
      if (shown.some(k => k.querySelector('.pls-imgslot, [data-img-id], [data-img]'))) continue;
      const tx = shown.map(k => [...k.querySelectorAll('[data-text]')].filter(t => vis(t) && t.textContent.trim()));
      if (!tx.every(a => a.length && a.every(t => t.textContent.trim().length <= 12))) continue;
      const gap = parseFloat(cs.columnGap) || 24, k0 = R(shown[0]), cols0 = Math.max(1, Math.round((gw + gap) / (k0.width / s + gap)));
      if (shown.length > cols0 * 2) continue;
      const n = shown.length, W = Math.floor(Math.min((gw - (n - 1) * 24) / n, gh * 0.8, 520));
      if (W <= k0.width / s + 8 && W <= k0.height / s + 8) continue;
      const main = tx.map(a => a.slice().sort((p, q) => px(q) - px(p))[0]);
      for (const k of shown) Object.assign(k.style, { width: W + 'px', height: W + 'px', minHeight: W + 'px', flex: '0 0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0px' });
      let pick = null;
      for (const v of [120, 79.5, 64.5]) {
        main.forEach(t => { t.dataset.fs0 = t.dataset.fs0 || px(t); t.style.fontSize = v + 'px'; t.style.width = 'auto'; t.style.maxWidth = Math.floor(W * 0.9) + 'px'; t.style.textAlign = 'center'; });
        if (main.every(t => R(t).height / s <= W * 0.6 && R(t).width / s <= W * 0.9 + 1)) { pick = v; break; }
      }
      if (!pick) main.forEach(t => { t.style.fontSize = Math.max(+t.dataset.fs0, 0) + 'px'; });
      tx.flat().forEach(t => { if (!main.includes(t)) t.style.textAlign = 'center'; });
      Object.assign(g.style, { columnGap: '24px', rowGap: '24px', justifyContent: 'center', alignContent: 'center', alignItems: 'center', paddingTop: '0px' });
      g.dataset.compact = '1';
      log.push(`${nm(g)}: ${n} ô to ${W}px${pick ? ', chữ ' + pick : ''}`);
    }
    return log;
  }

  // ---------- KHỐI CHỮ CHÍNH (F.hero): ký tự / âm đứng một mình (≤ 3 ký tự, cỡ ≥ 96, không phải tiêu đề) → phóng to ~30% cao cột (≤ 240), căn giữa cột ----------
  function hero(host) {
    const log = []; const s = scaleOf(host);
    for (const g of host.querySelectorAll('[data-text]')) {
      const t = g.textContent.trim(); if (!vis(g) || t.length < 1 || t.length > 3 || px(g) < 96 || /^(title|heading|header)/.test(nm(g))) continue;
      let col = g.parentElement; if (col && getComputedStyle(col).flexDirection !== 'column') col = col.parentElement;
      if (!col || getComputedStyle(col).display !== 'flex' || getComputedStyle(col).flexDirection !== 'column') continue;
      if (col.closest('[data-compact]')) continue;   // ô to (bigTiles) đã xử lý
      const sib = col.parentElement ? [...col.parentElement.children].filter(k => vis(k) && nm(k) === nm(col)) : [];
      if (sib.length > 1) continue;
      const colH = R(col).height / s; const want = Math.min(240, Math.round(colH * 0.3));
      col.style.alignItems = 'center'; col.style.justifyContent = 'center';
      if (px(g) < want) g.style.fontSize = want + 'px';
      g.style.textAlign = 'center';
      const box = g.parentElement; if (box !== col) { box.style.justifyContent = 'center'; box.style.alignItems = 'center'; }
      for (const k of col.querySelectorAll('[data-text]')) if (k !== g) k.style.textAlign = 'center';
      log.push(`${nm(col)} (${t} ${px(g)})`);
    }
    return log;
  }

  // ---------- GIÃN ĐỀU CHỐNG HỞ ĐÁY (F.spread): khung "card" trống dưới > 12% ----------
  // 1) nâng chữ nội dung 1 bậc nếu vẫn lọt (≤ tiêu đề/1,15; đoạn > 60 ký tự ≤ 40,5; chữ thường ≤ chữ đậm nhỏ nhất/1,1)
  // 2) không được → giãn đều nhóm mục lặp (q_1, q_2…) tối đa 48px/mục, hoặc giãn khoảng cách các khối trong card (≤ 40px)
  function spread(host, overflow) {
    const log = []; const s = scaleOf(host);
    const card = [...host.querySelectorAll('[data-n="card"]')].find(vis); if (!card) return log;
    if (card.querySelector('[data-compact]')) return log;
    const C = R(card), pb = parseFloat(getComputedStyle(card).paddingBottom) || 0, H = C.height / s;
    const bottom = () => { let mb = C.top; for (const x of card.querySelectorAll('[data-text], .pls-imgslot, [data-img-id], [data-n]')) { if (!vis(x)) continue; if (!x.dataset.text && !x.classList.contains('pls-imgslot') && !x.dataset.imgId) { const cs = getComputedStyle(x); const boxed = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.boxShadow !== 'none'; if (!boxed || R(x).width / s < 150) continue; } if (x.dataset.text && !x.textContent.trim()) continue; mb = Math.max(mb, R(x).bottom); } return mb; };
    const gapNow = () => ((R(card).bottom - pb * s) - bottom()) / s;
    let gap = gapNow(); if (gap <= 0.12 * H) return log;
    const texts = [...host.querySelectorAll('[data-text]')].filter(t => vis(t) && t.textContent.trim());
    const ttl = texts.find(t => /^(title|instruction|task)$/.test(nm(t))); const capT = ttl ? px(ttl) / 1.15 : 41;
    const isBold = t => parseFloat(getComputedStyle(t).fontWeight) >= 600;
    const tx = texts.filter(t => card.contains(t) && t !== ttl && !/(^|\.)(key|no|tag|title|instruction|task|h|mark|min|ruby)$/.test(nm(t)) && getComputedStyle(t).whiteSpace !== 'pre');
    const heads = tx.filter(isBold), capB = heads.length ? Math.min(...heads.map(px)) / 1.1 : 999;
    const plan = [];
    for (const t of tx) { const f = px(t), i = LADDER.findIndex(v => v <= f + 0.01); if (i <= 0) continue; const up = LADDER[i - 1]; if (up > capT || (t.textContent.length > 60 && up > 40.5) || (!isBold(t) && up > capB)) continue; plan.push([t, f, up]); }
    if (plan.length) {
      plan.forEach(([t, , up]) => { t.style.fontSize = up + 'px'; });
      const g2 = gapNow();
      if (g2 >= 0.06 * H && !plan.some(([t]) => overflow(t) > 0.5)) { log.push(`chữ nội dung +1 bậc (${plan.length} ô)`); return log; }
      plan.forEach(([t, f]) => { t.style.fontSize = f + 'px'; });
    }
    // (bỏ bước giãn đệm mục / khoảng cách khối – người dùng chốt 23/10: không kéo thẻ to ra cho đầy khung; khung ít chữ để gọn, cụm nội dung giữ khoảng cách vừa)
    const saved = [];
    // giãn xong mà làm tràn → trả lại như cũ
    if (texts.some(t => overflow(t) > 0.5) || gapNow() < -1) { saved.reverse().forEach(([el, st]) => st == null ? el.removeAttribute('style') : el.setAttribute('style', st)); return []; }
    return log;
  }

  root.PLS_TYPO = { special, ruby, blocks, emph, bigTiles, hero, spread, LABEL, FORMULA, RUBY };
})(typeof window !== 'undefined' ? window : globalThis);
