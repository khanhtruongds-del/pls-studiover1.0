// XUẤT SÁCH RA PPTX 1:1 (người dùng 5/11 – sửa ngoài web: PowerPoint / Google Slides / Keynote / Canva)
// Mỗi trang sách = 1 trang PPTX đúng khổ 19×27 cm. Cách giữ 1:1:
//  1. LỚP NỀN = ảnh chụp trang (khung, nền màu, kẻ bảng, mũi tên, hình…) với MỌI CHỮ ẨN đi (bộ vẽ của trình duyệt qua SVG foreignObject, chụp bản sao trang).
//  2. LỚP CHỮ = ô chữ sửa được, toạ độ đo từ trang thật; chỗ XUỐNG DÒNG đo trên web rồi ghi cứng (ô chữ không tự ngắt dòng) → dòng nào ra dòng đó.
//  3. Kiểu chữ từng đoạn (font, cỡ, đậm, nghiêng, gạch chân, màu, giãn chữ) giữ theo từng đoạn.
// Chữ trong hình vẽ SVG (sơ đồ trang Mở đầu) nằm trong lớp nền (không sửa được). Font: máy / Canva phải có đúng font, không thì bị thay font.
(function (root) {
  const CJK = '⺀-鿿豈-﫿＀-￯　-〿';
  const TOK = new RegExp(`\\s+|[${CJK}]|[^\\s${CJK}]+`, 'g'), CJK1 = new RegExp(`[${CJK}]`);
  const rgb = s => { const m = String(s || '').match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\)/); return m ? { c: [m[1] / 255, m[2] / 255, m[3] / 255], a: m[4] == null ? 1 : +m[4] } : null; };
  const STY = (w, it) => (w >= 600 ? 'Bold' : 'Regular') + (it ? ' Italic' : '');   // đậm vừa (600) → Bold: tên kiểu "… SemiBold" hay thiếu trên máy / Canva → bị thay font khác
  const fam = ff => ff.split(',').map(x => x.replace(/["']/g, '').trim()).filter(Boolean);
  const eaOf = ff => fam(ff).find(x => /\b(SC|TC|JP|KR|CJK)\b|Kai|WenKai|Hei|Song|Ming|Gothic|Mincho|Malgun|PingFang|YaHei/i.test(x)) || 'Noto Sans SC';

  // khối chứa chữ gần nhất (không phải inline) = 1 ô chữ trong PPTX
  function unitOf(n, host) { for (let e = n.parentElement; e && e !== host; e = e.parentElement) { const d = getComputedStyle(e).display; if (d !== 'inline' && d !== 'contents') return e; } return host; }
  function hidden(el, host) { for (let e = el; e && e !== host.parentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return true; } return false; }
  function underlined(el, unit) { for (let e = el; e; e = e.parentElement) { if (/underline/.test(getComputedStyle(e).textDecorationLine || '')) return true; if (e === unit) break; } return false; }

  // ĐO CHỮ của 1 trang → các ô chữ { x, y, w, h, ah, segs }
  function textItems(host, s, perLine) {   // perLine (Canva): MỖI DÒNG 1 Ô – Canva thay font + dàn dòng riêng → ô nhiều dòng lệch cộng dồn; từng dòng đặt đúng toạ độ thì không lệch
    const H = host.getBoundingClientRect(), units = new Map(), tw = document.createTreeWalker(host, NodeFilter.SHOW_TEXT); let n;
    while ((n = tw.nextNode())) { /* 13/11 (người dùng: "tuổi tác:她看上去" – khoảng cách sau dấu ":" có trên web nhưng tải PPTX về bị dính): dấu cách đứng RIÊNG giữa hai đoạn chữ khác kiểu (đậm → chữ Hán) trước đây bị bỏ → giữ lại khi nó nằm giữa hai phần tử cùng dòng */
      if (!n.data.trim()) { const a = n.previousSibling, b = n.nextSibling; if (!(n.data && a && b && a.nodeType === 1 && b.nodeType === 1 && /^inline/.test(getComputedStyle(a).display) && /^inline/.test(getComputedStyle(b).display) && a.textContent.trim() && b.textContent.trim())) continue; }
      if (n.parentElement.closest('svg') || hidden(n.parentElement, host)) continue; const u = unitOf(n, host); if (!units.has(u)) units.set(u, []); units.get(u).push(n); }
    const items = [], rg = document.createRange();
    for (const [u, nodes] of units) {
      const ucs = getComputedStyle(u), lines = []; let cur = null;
      const add = (t, r, st) => { const c = r.top + r.height / 2;
        const nl = !cur || c > cur.c + Math.min(cur.h, r.height) * 0.5, gap = !nl && cur.toks.length && r.left - cur.rt > Math.max(r.height * 0.9, 6);   // cùng dòng nhưng cách xa (cột, khoảng giãn) → ô riêng đúng chỗ
        if (nl || gap) { cur = { c, h: r.height, top: r.top, bot: r.bottom, l: r.left, rt: r.right, toks: [], split: gap }; lines.push(cur); }
        cur.toks.push({ t, st }); cur.l = Math.min(cur.l, r.left); cur.rt = Math.max(cur.rt, r.right); cur.top = Math.min(cur.top, r.top); cur.bot = Math.max(cur.bot, r.bottom); };
      for (const nd of nodes) { const pe = nd.parentElement, cs = getComputedStyle(pe), pre = /pre/.test(cs.whiteSpace);
        const st = { f: fam(cs.fontFamily)[0] || 'Arial', ea: eaOf(cs.fontFamily), st: STY(parseFloat(cs.fontWeight), cs.fontStyle === 'italic'), u: underlined(pe, u) ? 'UNDERLINE' : undefined, sz: parseFloat(cs.fontSize) / s,
          c: rgb(cs.color) || { c: [0, 0, 0], a: 1 }, tc: cs.textTransform === 'uppercase' ? 'UPPER' : cs.textTransform === 'lowercase' ? 'LOWER' : undefined,
          ls: parseFloat(cs.letterSpacing) ? { unit: 'PIXELS', value: parseFloat(cs.letterSpacing) / s } : undefined };
        st.key = JSON.stringify(st);
        const put = (a, b) => { rg.setStart(nd, a); rg.setEnd(nd, b); const rs = [...rg.getClientRects()].filter(r => r.width > 0 || r.height > 0); return rs; };
        for (const m of nd.data.matchAll(TOK)) { const a = m.index, b = a + m[0].length;
          if (/^\s+$/.test(m[0])) { if (cur && cur.toks.length && !/\s$/.test(cur.toks[cur.toks.length - 1].t)) cur.toks.push({ t: pre ? m[0].replace(/\n/g, ' ') : ' ', st }); continue; }
          const rs = put(a, b); if (!rs.length) continue;
          if (rs.length === 1) add(m[0], rs[0], st);
          else for (let i = a; i < b; i++) { const r1 = put(i, i + 1)[0]; if (r1) add(nd.data[i], r1, st); } } }   // từ dài bị bẻ giữa (overflow-wrap) → từng ký tự
      if (!lines.length) continue;
      const ta = ucs.textAlign, ah = /center/.test(ta) ? 'CENTER' : /right|end/.test(ta) ? 'RIGHT' : 'LEFT';
      const lhPx = parseFloat(ucs.lineHeight) || Math.max(...lines.map(l => l.bot - l.top));
      // nhóm dòng liền nhau cùng mép trái (căn trái) → 1 ô; dòng thụt khác mép → ô riêng (giữ đúng thụt lề)
      const groups = []; lines.forEach((l, li) => { const g = groups[groups.length - 1], nx = lines[li + 1];
        if (!perLine && g && !g.closed && !l.split && !(nx && nx.split) && (ah !== 'LEFT' || Math.abs(g[0].l - l.l) < 2)) g.push(l); else { const ng = [l]; ng.closed = !!(l.split || (nx && nx.split)); groups.push(ng); } });
      for (const g of groups) {
        const segs = []; g.forEach((l, li) => { while (l.toks.length && /^\s+$/.test(l.toks[l.toks.length - 1].t)) l.toks.pop();
          l.toks.forEach((tk, ti) => { let t = tk.t; if (li > 0 && ti === 0) t = ' ' + t; const L = segs[segs.length - 1];
            if (L && L.st.key === tk.st.key) L.t += t; else segs.push({ t, st: tk.st }); }); });
        let left = Math.min(...g.map(l => l.l)), right = Math.max(...g.map(l => l.rt)); const first = g[0], lh = lhPx;
        // Ô CHỮ RỘNG BẰNG KHUNG CHỨA (5/11 – Canva thay font khác rộng hơn → ô vừa khít bị ngắt dòng thêm → chữ chồng lên nhau):
        // căn trái nới sang phải tới mép trong khung; căn giữa nới đều hai bên; căn phải nới sang trái (chữ vẫn đúng chỗ, chỉ có thêm chỗ trống)
        if (false && !g.closed) { const ur = u.getBoundingClientRect(),   /* 5/11: bỏ nới bằng khung chứa – người dùng: ô kéo dài thòng lòng, muốn sát chữ */ cl = ur.left + (parseFloat(ucs.paddingLeft) || 0) + (parseFloat(ucs.borderLeftWidth) || 0), cr = ur.right - (parseFloat(ucs.paddingRight) || 0) - (parseFloat(ucs.borderRightWidth) || 0);
          if (cr - cl > right - left) { if (ah === 'LEFT') right = Math.max(right, cr); else if (ah === 'RIGHT') left = Math.min(left, cl); else { const half = Math.max(right - (left + right) / 2, Math.min(cr - (left + right) / 2, (left + right) / 2 - cl)); const mid = (left + right) / 2; left = mid - half; right = mid + half; } } }
        { const fw = +ucs.fontWeight || 400, tight = /times/i.test(ucs.fontFamily) && (fw === 400 || fw === 700), pad = Math.max((right - left) * (tight ? 0.06 : 0.18), 4 * s),   /* 6/11 soát ảnh Canva: Montserrat bên Canva rộng hơn trình duyệt, đậm 600/800 thành Đậm → bìa rớt dòng chồng nhau → chừa 18%; Times thường/đậm khớp → 6% */ HR = H.left, HW = H.right;   // chừa 6% (font Canva hơi rộng hơn vẫn không rớt dòng) – ô sát chữ   // + 20%: Canva LUÔN ngắt dòng theo bề rộng ô (bỏ qua "không ngắt") và thay font rộng hơn → chừa chỗ
          if (ah === 'LEFT') right = Math.min(HW, right + pad); else if (ah === 'RIGHT') left = Math.max(HR, left - pad); else { const k = Math.min(pad / 2, left - HR, HW - right); left -= k; right += k; } }
        const y = first.top - (lh - (first.bot - first.top)) / 2;   // đầu dòng CSS (nửa khoảng dòng phía trên chữ)
        { const all = segs.map(x => x.t).join('').trim(), m = /^[\u2460-\u2473]$/.test(all) ? all.charCodeAt(0) - 0x245F : 0;   // SỐ KHOANH TRÒN ①② (5/11: sửa số trong Canva mất vòng tròn) → vòng tròn riêng + số riêng, 1 nhóm
          if (m) { const st = segs[0].st, gl = g[0].l, gr = g[0].rt, d = Math.min(gr - gl, first.bot - first.top) * 0.92, cx = (gl + gr) / 2, cy = (first.top + first.bot) / 2, X = (cx - d / 2 - H.left) / s, Y = (cy - d / 2 - H.top) / s, D = d / s;
            const fz = D * (m < 10 ? 1.07 : 0.8); items.push({ k: 'group', id: 'g' + items.length, name: 'Số ' + m, x: X, y: Y, w: D, h: D, src: u, kids: [
              { k: 'shape', id: 'c' + items.length, name: 'Vòng tròn', x: X, y: Y, w: D, h: D, shape: { ell: true, fill: null, stroke: { w: Math.max(0.5, D * 0.055), c: st.c.c, a: st.c.a } } },
              { k: 'text', id: 'n' + items.length, name: 'Số', x: X - D * 0.3, y: Y + D * 0.5 - fz * 0.6 - fz * 0.06, w: D * 1.6, h: fz * 1.2, ah: 'CENTER', av: 'TOP', auto: 'NONE', segs: [Object.assign({}, st, { t: String(m), st: 'Regular', sz: fz, lh: { unit: 'PIXELS', value: fz * 1.2 }, key: undefined, ea: undefined })] }] });   // 6/11 đo web: số cao 71% vòng, nét vòng ~5,5% → cỡ số 1,07 × vòng (2 chữ số 0,8×); trước 0,68× → số bé, mảnh, vòng trông dày
            continue; } }
        items.push({ k: 'text', id: 't' + items.length, name: 'Chữ', src: u, x: (left - H.left) / s, y: (y - H.top) / s, w: (right - left) / s + 1, h: (lh * g.length) / s, ah, av: 'TOP', auto: 'WIDTH_AND_HEIGHT',
          segs: segs.map(x => { const o = Object.assign({}, x.st, { t: x.t, lh: { unit: 'PIXELS', value: lh / s } }); delete o.key; if (!CJK1.test(x.t)) delete o.ea;
            if (/times|tinos/i.test(o.f || '')) o.ls = { unit: 'PIXELS', value: ((o.ls && o.ls.unit === 'PIXELS' ? o.ls.value : 0)) - 0.022 * o.sz };   // 6/11 đo ảnh Canva: Times bên Canva rộng hơn web ~5% (dòng đáp án lấn mép bảng) → khép −0,022em
            if (/montserrat/i.test(o.f || '')) o.ls = { unit: 'PIXELS', value: ((o.ls && o.ls.unit === 'PIXELS' ? o.ls.value : 0)) - 0.065 * o.sz };   // 6/11 đo ảnh Canva: Montserrat bên Canva rộng hơn web ~10% (4 dòng bìa) → giãn chữ −0,065em cho bằng bề rộng web
            return o; }) });
      } }
    return items; }

  // CHỤP NỀN bằng chính bộ vẽ của trình duyệt (SVG foreignObject – giống trang web 1:1, nhanh hơn html2canvas ~10 lần vì chỉ chụp đúng trang):
  // bản sao trang + toàn bộ CSS của web, MỌI CHỮ ẨN (giữ chỗ), ảnh đổi sang data: (ảnh trong SVG không tự tải) → canvas → JPEG
  let CSS = null; const dataUrl = {};
  const cssAll = () => CSS != null ? CSS : (CSS = [...document.styleSheets].map(sh => { try { return [...sh.cssRules].filter(r => !(r instanceof CSSFontFaceRule)).map(r => r.cssText).join('\n'); } catch (e) { return ''; } }).join('\n'));
  async function toData(u) { if (!u || /^data:/.test(u)) return u; if (dataUrl[u]) return dataUrl[u];
    try { const bl = await (await fetch(u)).blob(); dataUrl[u] = await new Promise(ok => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(bl); }); } catch (e) { dataUrl[u] = u; } return dataUrl[u]; }
  async function bgShot(host, px, keep) {   // keep (tách khối): chỉ giữ các hình trong danh sách – khung, nền màu, viền trong suốt; trả canvas trong suốt để cắt từng hình
    const W = parseFloat(host.style.width), Hh = parseFloat(host.style.height), cl = host.cloneNode(true), src = [host, ...host.querySelectorAll('*')], dst = [cl, ...cl.querySelectorAll('*')];
    for (let i = 0; i < src.length; i++) { const cs = getComputedStyle(src[i]), m = cs.backgroundImage.match(/url\("?([^")]+)"?\)/g);
      if (m) { let v = cs.backgroundImage; for (const x of m) { const u = x.replace(/^url\("?|"?\)$/g, ''); v = v.split(u).join(await toData(u)); } dst[i].style.backgroundImage = v; }
      if (src[i].tagName === 'IMG') dst[i].setAttribute('src', await toData(src[i].currentSrc || src[i].src)); if (src[i].tagName === 'image') { const u = src[i].getAttribute('href') || src[i].getAttribute('xlink:href'); if (u) dst[i].setAttribute('href', await toData(new URL(u, location.href).href)); } }
    // ĐÓNG BĂNG BỐ CỤC: trong ảnh SVG font web chưa nạp → chữ (đã ẩn) đổi bề rộng → dòng / hàng bảng cao thấp khác → nền lệch chữ.
    // Ghi cứng kích thước thật của mọi khung (không phải chữ inline) → nền đứng đúng chỗ dù font khác
    const s0 = host.getBoundingClientRect().width / W || 1;
    for (let i = 0; i < src.length; i++) { const e = src[i]; if (e.closest('svg') && e.tagName !== 'svg') continue; const cs = getComputedStyle(e), r = e.getBoundingClientRect(), d = dst[i].style;
      if (cs.display === 'inline' || cs.display === 'contents' || cs.display === 'none') { if (cs.display === 'inline' && e.getClientRects().length === 1 && (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(cs.borderTopWidth) || parseFloat(cs.borderBottomWidth))) Object.assign(d, { display: 'inline-block', width: r.width / s0 + 'px', height: r.height / s0 + 'px', verticalAlign: 'top', boxSizing: 'border-box' }); continue; }
      if (!/px$/.test(cs.width) || !/px$/.test(cs.height)) continue;   // kích thước BỐ CỤC (trước transform: bìa có khối thu phóng) – không lấy khung sau thu phóng
      const w = cs.width, h = cs.height; Object.assign(d, { boxSizing: cs.boxSizing, width: w, minWidth: w, maxWidth: w, height: h, minHeight: h, maxHeight: h });
      if (e.parentElement && /flex|grid/.test(getComputedStyle(e.parentElement).display)) d.flex = '0 0 auto'; }
    if (keep) { const K = new Set(keep); for (let i = 0; i < src.length; i++) { if ([...K].some(k => k === src[i] || k.contains(src[i]))) continue; const d = dst[i].style; d.background = 'transparent'; d.borderColor = 'transparent'; d.boxShadow = 'none'; d.outline = 'none'; d.textDecorationColor = 'transparent'; d.listStyleType = 'none'; } }
    const tw = document.createTreeWalker(cl, NodeFilter.SHOW_TEXT), ns = []; let n; while ((n = tw.nextNode())) if (n.data.trim() && !(n.parentElement && n.parentElement.closest('svg'))) ns.push(n);
    ns.forEach(t => { const sp = document.createElement('span'); sp.style.visibility = 'hidden'; t.parentNode.insertBefore(sp, t); sp.appendChild(t); });
    Object.assign(cl.style, { position: 'relative', left: '0', top: '0', transform: 'none', margin: '0' });
    const rootVars = [...document.documentElement.style].map(k => k + ':' + document.documentElement.style.getPropertyValue(k)).join(';');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${Hh}"><foreignObject x="0" y="0" width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="${rootVars.replace(/[&"<]/g, c => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;' }[c]))}"><style><![CDATA[${cssAll().split(']]>').join(']] >')}]]></style>${new XMLSerializer().serializeToString(cl)}</div></foreignObject></svg>`;
    const im = new Image(); im.decoding = 'sync'; await new Promise((ok, no) => { im.onload = ok; im.onerror = () => no(new Error('không vẽ được nền trang')); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
    const k = px / W, cv = document.createElement('canvas'); cv.width = Math.round(W * k); cv.height = Math.round(Hh * k); const g = cv.getContext('2d'); if (!keep) { g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); } g.drawImage(im, 0, 0, cv.width, cv.height); if (keep) return cv;
    const blob = await new Promise(ok => cv.toBlob(ok, 'image/jpeg', 0.9)); if (!blob) throw new Error('trình duyệt chặn xuất ảnh nền'); return new Uint8Array(await blob.arrayBuffer()); }

  // ===== TÁCH KHỐI (Canva – người dùng 5/11: khung, bảng, kẻ sửa được trong Canva; gom nhóm hợp lý) =====
  // ô màu / khung viền đủ 4 cạnh → hình chữ nhật (màu, viền, bo góc) · viền lẻ (kẻ bảng, gạch dưới tiêu đề) → đường kẻ · ảnh / SVG / nền ảnh → ảnh riêng (cắt từ lớp hình trong suốt)
  // dấu đầu dòng (::marker, ::before) → ô chữ · nhóm: mỗi khối nội dung 1 nhóm, bảng chia nhóm con theo hàng, phần còn lại (đầu / chân trang) = "Khung trang"
  const IMGISH = (e, cs) => e.tagName === 'IMG' || e.tagName.toLowerCase() === 'svg' || /url\(|gradient/.test(cs.backgroundImage);
  const BUL = { disc: '•', circle: '◦', square: '▪' };
  function firstRect(e) { const tw = document.createTreeWalker(e, NodeFilter.SHOW_TEXT), rg = document.createRange(); let n; while ((n = tw.nextNode())) { if (!n.data.trim()) continue; rg.selectNodeContents(n); const r = [...rg.getClientRects()][0]; if (r) return r; } return null; }
  function vectorItems(host, s) {
    const H = host.getBoundingClientRect(), PW = H.width / s, PH = H.height / s, out = [], imgs = [];
    for (const e of host.querySelectorAll('*')) {
      if (e.closest('svg') && e.tagName.toLowerCase() !== 'svg') continue;
      if (imgs.some(p => p.contains(e)) || hidden(e, host)) continue;
      const cs = getComputedStyle(e), r = e.getBoundingClientRect(); if (r.width < 0.5 && r.height < 0.5) continue;
      if (IMGISH(e, cs)) { imgs.push(e); continue; }
      const X = (r.left - H.left) / s, Y = (r.top - H.top) / s, W = r.width / s, Hh = r.height / s, bg = rgb(cs.backgroundColor);
      const white = bg && bg.c.every(v => v > 0.99), fill = bg && bg.a > 0.01 && !(white && W * Hh > PW * PH * 0.8) ? bg : null;   // nền trắng cả trang → bỏ
      const B = ['Top', 'Right', 'Bottom', 'Left'].map(k => ({ w: parseFloat(cs['border' + k + 'Width']) || 0, st: cs['border' + k + 'Style'], c: rgb(cs['border' + k + 'Color']) })).map(b => b.w > 0 && !/none|hidden/.test(b.st) && b.c && b.c.a > 0.01 ? b : null);
      const same = B.every(b => b && b.w === B[0].w && b.st === B[0].st && JSON.stringify(b.c) === JSON.stringify(B[0].c)), rad = parseFloat(cs.borderTopLeftRadius) || 0;
      const nm = (e.dataset && (e.dataset.n || e.dataset.block)) || 'Khung';
      if (fill || same) out.push({ el: e, it: { k: 'shape', id: 'v' + out.length, name: nm, x: X, y: Y, w: W, h: Hh, shape: { fill, stroke: same ? { w: B[0].w / s, c: B[0].c.c, a: B[0].c.a, dash: /dash|dot/.test(B[0].st) } : null, rad: Math.min(rad / s, W / 2, Hh / 2) } } });
      if (!same) B.forEach((b, i) => { if (!b) return; const w = b.w / s, L = [[X, Y + w / 2, W, 0], [X + W - w / 2, Y, 0, Hh], [X, Y + Hh - w / 2, W, 0], [X + w / 2, Y, 0, Hh]][i];
        const dash = b.st === 'dashed' ? 'dash' : b.st === 'dotted' ? 'sysDot' : null;
        // kẻ liền → hình chữ nhật mảnh tô màu (soát Canva 5/11: Canva nhập đường kẻ PPTX bị nghiêng 0,4–1,6°, lệch ~6 px giữa 2 đầu)
        if (!dash) out.push({ el: e, it: { k: 'shape', id: 'v' + out.length, name: 'Kẻ', x: L[2] ? L[0] : L[0] - w / 2, y: L[2] ? L[1] - w / 2 : L[1], w: L[2] || w, h: L[3] || w, shape: { fill: b.c, stroke: null, rad: 0 } } });
        else { const hz = !!L[2], len = hz ? L[2] : L[3], on = dash === 'dash' ? w * 3 : w, off = on, rs = [];   // nét đứt / chấm → 1 hình gồm các gạch (Canva giữ đúng)
          for (let t = 0; t < len - 0.01; t += on + off) { const d = Math.min(on, len - t); rs.push(hz ? [t, 0, d, w] : [0, t, w, d]); }
          out.push({ el: e, it: { k: 'shape', id: 'v' + out.length, name: 'Kẻ nét đứt', x: hz ? L[0] : L[0] - w / 2, y: hz ? L[1] - w / 2 : L[1], w: hz ? len : w, h: hz ? w : len, shape: { fill: b.c, stroke: null, rad: 0, rects: rs } } }); } });
      // dấu đầu dòng: ::marker của <li> hoặc chữ ::before (●) – không phải chữ thật nên lớp chữ không có
      let mk = null; const bc = getComputedStyle(e, '::before').content;
      if (cs.display === 'list-item' && BUL[cs.listStyleType]) mk = BUL[cs.listStyleType]; else if (bc && /^["'].+["']$/.test(bc) && bc.length <= 4) mk = bc.slice(1, -1);
      if (mk) { const fr = firstRect(e); if (fr) { const fs = parseFloat(cs.fontSize), c = rgb(getComputedStyle(e, '::marker').color || cs.color) || rgb(cs.color);
        out.push({ el: e, it: { k: 'text', id: 'v' + out.length, name: 'Dấu đầu dòng', x: (fr.left - H.left) / s - fs * 1.05 / s, y: (fr.top - H.top) / s, w: fs * 0.85 / s, h: fr.height / s, ah: 'LEFT', av: 'TOP', auto: 'WIDTH_AND_HEIGHT', segs: [{ t: mk, f: fam(cs.fontFamily)[0] || 'Arial', st: 'Regular', sz: fs / s, c: c || { c: [0, 0, 0], a: 1 } }] } }); } }
    }
    return { out, imgs }; }
  const bbox = ks => { const x = Math.min(...ks.map(k => k.x)), y = Math.min(...ks.map(k => k.y)); return { x, y, w: Math.max(...ks.map(k => k.x + k.w)) - x, h: Math.max(...ks.map(k => k.y + k.h)) - y }; };
  function grouped(entries, host) {
    let content = host.querySelector('[data-n="content"]'); const blocks = new Map();
    while (content && content.children.length === 1 && !content.firstElementChild.dataset.bk) content = content.firstElementChild;   // lớp bọc (trang Mở đầu, Lời mở đầu) → xuống 1 cấp
    const blockOf = el => { const k = el.closest && el.closest('[data-mv], [data-ik], [data-bk]'); if (k && host.contains(k)) return k;   // phần kéo được (Mở đầu) / đoạn (Lời mở đầu) / khối nội dung
      let top = null; for (let x = el; x && x !== host; x = x.parentElement) { if (content && x.parentElement === content) return x; top = x; } return top || host; };
    const lineOf = (el, b) => { if (!el || !el.closest) return null; const row = el.closest('[data-n^="row_"]'); if (row && b.contains(row) && row !== b) return row; const li = el.closest('li'); if (li && b.contains(li)) return li;
      for (let x = el.parentElement; x && x !== b && b.contains(x); x = x.parentElement) { const cs = getComputedStyle(x); if (/flex|grid/.test(cs.display) && !/column/.test(cs.flexDirection) && x.children.length >= 2 && x.children.length <= 4) return x; } return null; };   // dòng: hàng bảng / <li> / hàng flex nhỏ (dấu • + chữ, số ① + câu)
    for (const { el, it } of entries) { const b = blockOf(el || host), rk = lineOf(el, b);
      if (!blocks.has(b)) blocks.set(b, { kids: [], rows: new Map() }); const B0 = blocks.get(b);
      if (rk) { if (!B0.rows.has(rk)) { const g = { k: 'group', name: /^row_/.test(rk.dataset.n || '') ? 'Hàng ' + String(rk.dataset.n).replace('row_', '') : 'Dòng · ' + (rk.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24), kids: [] }; B0.rows.set(rk, g); B0.kids.push(g); } B0.rows.get(rk).kids.push(it); } else B0.kids.push(it); }
    const res = []; let gi = 0;
    for (const [b, B0] of blocks) { const kids = B0.kids.map(k => k.k === 'group' && k.kids && !k.id ? (k.kids.length === 1 ? k.kids[0] : Object.assign(k, { id: 'gr' + (gi++) }, bbox(k.kids))) : k);
      const inContent = b.dataset && (b.dataset.mv || b.dataset.ik || b.dataset.bk || (content && b.parentElement === content)), nm = inContent ? ((b.dataset.block || '').replace(/^Block\//, '') || b.dataset.mv || b.dataset.n || (b.dataset.ik ? 'Đoạn' : 'Khối')) : 'Khung trang';
      const tx = inContent ? (b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 28) : '', NM = { 'Table N': 'Bảng', 'Sub Heading': 'Tiêu đề', 'Section Bar': 'Mục', 'Lesson Header': 'Đầu bài', 'Example Box': 'Ví dụ', 'Note Box': 'Ghi chú', 'Structure': 'Cấu trúc', 'Paragraph': 'Đoạn' }[nm] || nm.replace(/^(tab|pill|box|lab)-?/, '') || 'Khối';
      if (kids.length === 1) res.push(kids[0]); else if (kids.length) res.push(Object.assign({ k: 'group', id: 'gb' + (gi++), name: tx ? `${NM} · ${tx}` : NM, kids }, bbox(kids))); }
    return res; }

  // pages: [{ host }] của sách đang dựng · mm: [rộng, cao] · onp(i, n): báo tiến độ
  async function exportBook(pages, mm, name, onp, opt) { opt = opt || {};
    if (!root.PPTX) throw new Error('chưa nạp pptx.js');
    const box = document.createElement('div'); box.style.cssText = 'position:fixed;left:-100000px;top:0;pointer-events:none;contain:layout paint';   /* dựng tạm NGOÀI màn hình (5/11: trang chớp ở phía trên khi xuất) – vẫn đo + chụp được */ document.body.appendChild(box);
    const W = parseFloat(pages[0].host.style.width), Hh = parseFloat(pages[0].host.style.height);
    const model = { noMaster: true, w: W, h: Hh, emuW: Math.round(mm[0] / 25.4 * 914400), slides: [], media: {} };
    try {
      for (let i = 0; i < pages.length; i++) { if (onp) onp(i, pages.length);
        const c = pages[i].host.cloneNode(true); c.style.position = 'relative'; c.style.left = '0'; c.style.top = '0'; c.style.transform = 'none'; box.innerHTML = ''; box.appendChild(c);
        await new Promise(r => requestAnimationFrame(() => r()));
        const s = c.getBoundingClientRect().width / W || 1, items = textItems(c, s, false), key = 'bg' + i;   /* mỗi đoạn 1 ô (người dùng 5/11: 1 đoạn bị tách thành nhiều ô) – không còn ảnh nền nên không lo lệch */
        if (opt.perLine) {   // CANVA = TÁCH KHỐI: không ảnh nền cả trang
          const { out, imgs } = vectorItems(c, s), H0 = c.getBoundingClientRect(), ents = out.slice();
          if (imgs.length) { const cv = await bgShot(c, 1650, imgs), k = cv.width / W;
            for (let j = 0; j < imgs.length; j++) { const r = imgs[j].getBoundingClientRect(), X = (r.left - H0.left) / s, Y = (r.top - H0.top) / s, w = r.width / s, h = r.height / s; if (w < 1 || h < 1) continue;
              const cc = document.createElement('canvas'); cc.width = Math.max(1, Math.round(w * k)); cc.height = Math.max(1, Math.round(h * k)); cc.getContext('2d').drawImage(cv, Math.round(X * k), Math.round(Y * k), cc.width, cc.height, 0, 0, cc.width, cc.height);
              const bl = await new Promise(ok => cc.toBlob(ok, 'image/png')); const mk = key + '_' + j; model.media[mk] = new Uint8Array(await bl.arrayBuffer());
              ents.push({ el: imgs[j], it: { k: 'img', id: mk, name: imgs[j].tagName === 'IMG' ? 'Ảnh' : 'Hình', x: X, y: Y, w, h, png: mk } }); } }
          // THỨ TỰ LỚP như trình duyệt (6/11 soát Canva: ảnh nền bìa đè lên ô "QUYỂN") – theo z-index của tổ tiên rồi thứ tự trong trang
          { const all = [...c.querySelectorAll('*')], ix = new Map(all.map((e, n) => [e, n])), zOf = e => { let z = 0; for (let x = e; x && x !== c; x = x.parentElement) { const v = parseInt(getComputedStyle(x).zIndex, 10); if (!isNaN(v) && getComputedStyle(x).position !== 'static') z = v; } return z; };
            const key = new Map(ents.map(en => [en, [zOf(en.el), ix.get(en.el) || 0]])); ents.sort((a, b) => { const A = key.get(a), B = key.get(b); return A[0] - B[0] || A[1] - B[1]; }); }
          items.forEach(it => ents.push({ el: it.src, it }));
          model.slides.push({ name: 'Trang ' + (i + 1), bg: [1, 1, 1], items: grouped(ents, c), anims: [], tr: null }); continue; }
        model.media[key] = await bgShot(c, 1650);   // ~220 dpi trên khổ 19 cm
        model.slides.push({ name: 'Trang ' + (i + 1), bg: [1, 1, 1], items: [{ k: 'img', id: 'bg' + i, name: 'Nền trang (khung, kẻ, hình)', x: 0, y: 0, w: W, h: Hh, png: key }].concat(items), anims: [], tr: null }); }   // nền = ẢNH PHỦ TRANG (thử trên Canva 5/11: khít trang; nền slide <p:bg> thì Canva đặt sai)
    } finally { box.remove(); }
    const bytes = root.PPTX.build(model), a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' })); a.download = name + (opt.perLine ? '_Canva' : '') + '.pptx'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    return { name: a.download, pages: pages.length, bytes: bytes.length, model }; }
  root.PLS_BOOK_PPTX = { exportBook, textItems };
})(window);
