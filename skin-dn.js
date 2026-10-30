// GIAO DIỆN RIÊNG ĐẮC NHÂN (người dùng 29/10): slide dựng bằng mẫu chung rồi trình bày lại theo bộ slide mẫu HSK1 của Đắc Nhân
// (nền kem, thẻ trắng viền đỏ cam, đầu slide 2 thẻ: mục + yêu cầu; hội thoại bóng thoại 2 bên; thẻ từ có số + pinyin).
// Chạy sau khi đổ chữ (engine.render) → co chữ / soát lỗi / xuất PPTX đều theo bố cục mới. Chỉ áp cho brand Đắc Nhân.
(function (root) {
  const OR = '#E65100', RED = '#D9481C', SOFT = '#F4B183', CREAM = '#FFF4EA', INK = '#3B2314', GREY = '#5F5F5F';
  // hình người (1 màu) cho bóng thoại – xuất PPTX thành ảnh PNG như các icon khác
  if (root.PLS_ICONS) {
    root.PLS_ICONS['dn-boy'] = '<svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="dnb"><circle cx="50" cy="50" r="48"/></clipPath></defs><circle cx="50" cy="50" r="48" fill="#FFE3CC"/><g clip-path="url(#dnb)"><path d="M14 100c2-20 16-30 36-30s34 10 36 30z" fill="#E65100"/><path d="M40 70l10 12 10-12z" fill="#fff"/><rect x="43" y="58" width="14" height="14" rx="5" fill="#F2C29B"/><ellipse cx="50" cy="44" rx="21" ry="23" fill="#FBD3B0"/><ellipse cx="29" cy="46" rx="4" ry="6" fill="#F2C29B"/><ellipse cx="71" cy="46" rx="4" ry="6" fill="#F2C29B"/><path d="M28 40c-2-16 8-25 22-25s25 8 22 25c-4-7-10-10-14-11-3 4-12 6-20 5-4 0-8 2-10 6z" fill="#3B2314"/><circle cx="42" cy="46" r="3" fill="#3B2314"/><circle cx="58" cy="46" r="3" fill="#3B2314"/><circle cx="43" cy="45" r="1" fill="#fff"/><circle cx="59" cy="45" r="1" fill="#fff"/><path d="M43 56q7 6 14 0" stroke="#B5462A" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="36" cy="53" r="3.2" fill="#F7A98B" opacity=".7"/><circle cx="64" cy="53" r="3.2" fill="#F7A98B" opacity=".7"/></g></svg>';   // avatar nhân vật nam (người dùng 29/10: hình nhân vật rõ ràng)
    root.PLS_ICONS['dn-girl'] = '<svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="dng"><circle cx="50" cy="50" r="48"/></clipPath></defs><circle cx="50" cy="50" r="48" fill="#FDE0E0"/><g clip-path="url(#dng)"><path d="M24 78c-6-14-6-34 2-46 6-9 14-13 24-13s18 4 24 13c8 12 8 32 2 46z" fill="#5A2E1A"/><path d="M14 100c2-20 16-30 36-30s34 10 36 30z" fill="#C62828"/><path d="M42 70q8 9 16 0" fill="#fff"/><rect x="43" y="58" width="14" height="14" rx="5" fill="#F2C29B"/><ellipse cx="50" cy="45" rx="20" ry="22" fill="#FBD3B0"/><path d="M30 44c0-15 9-23 20-23s20 8 20 23c-6-4-12-10-14-15-4 7-14 13-26 15z" fill="#5A2E1A"/><circle cx="68" cy="27" r="5" fill="#F48FB1"/><circle cx="42" cy="47" r="3" fill="#3B2314"/><circle cx="58" cy="47" r="3" fill="#3B2314"/><circle cx="43" cy="46" r="1" fill="#fff"/><circle cx="59" cy="46" r="1" fill="#fff"/><path d="M44 57q6 5 12 0" stroke="#B5462A" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="36" cy="54" r="3.2" fill="#F7A98B" opacity=".75"/><circle cx="64" cy="54" r="3.2" fill="#F7A98B" opacity=".75"/></g></svg>';   // avatar nhân vật nữ
  }
  const q = (r, n) => r.querySelector(`[data-n="${n}"]`);
  const vis = e => e && e.style.display !== 'none' && !e.closest('[data-hid]');
  const txt = e => (e && e.textContent || '').trim();
  const tgt = e => e.querySelector('[data-t]') || e;
  const setT = (e, v) => { tgt(e).textContent = v; };
  const css = (e, o) => e && Object.assign(e.style, o);
  // ẩn hẳn một khối: đánh dấu data-hid như engine + bỏ các ô chữ trong khối khỏi danh sách đo (khỏi báo tràn ô đã ẩn)
  let FILLED = [];
  function drop(e) { if (!e) return; e.style.display = 'none'; e.dataset.hid = '1'; for (let i = FILLED.length - 1; i >= 0; i--) if (e === FILLED[i] || e.contains(FILLED[i])) FILLED.splice(i, 1); }
  const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  // ô chữ mới = bản sao một ô chữ có sẵn (giữ font, cách đo, cách xuất PPTX)
  function cloneText(src, text, filledKey, filled, style) {
    const e = src.cloneNode(true); e.removeAttribute('data-hid'); e.style.display = '';
    e.dataset.n = filledKey.split('.').pop(); e.dataset.filled = filledKey; setT(e, text); css(e, style || {});
    if (filled) filled.push(e); return e;
  }
  function badge(n) {   // ô số thứ tự vuông cam (Từ vựng / Ngữ pháp mẫu Đắc Nhân)
    const b = document.createElement('div'); b.dataset.n = 'no_badge';
    css(b, { position: 'absolute', left: '-6px', top: '-6px', width: '58px', height: '58px', background: OR, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 });
    const t = document.createElement('div'); t.dataset.n = 'no_badge.text'; t.dataset.text = '1'; t.textContent = String(n);
    css(t, { color: '#fff', fontWeight: 800, fontSize: '32px', lineHeight: '58px', fontFamily: "var(--ff-font-body, 'Montserrat'), sans-serif", textAlign: 'center', width: '58px' });
    b.appendChild(t); return b;
  }
  // ---------- khung chung ----------
  // NỀN Ô LY: ảnh PNG cỡ khung (1824×900), ô 86px, kẻ xám rất nhạt – vẽ 1 lần bằng canvas rồi dùng lại
  let GRID = null;
  function gridPaper() { if (GRID !== null) return GRID; try { const W = 1824, H = 900, S = 86, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H); c.strokeStyle = '#ECECEC'; c.lineWidth = 2; c.beginPath();
      for (let x = (W % S) / 2; x <= W; x += S) { c.moveTo(Math.round(x) + 0.5, 0); c.lineTo(Math.round(x) + 0.5, H); }
      for (let y = (H % S) / 2; y <= H; y += S) { c.moveTo(0, Math.round(y) + 0.5); c.lineTo(W, Math.round(y) + 0.5); }
      c.stroke(); GRID = cv.toDataURL('image/png'); } catch (e) { GRID = ''; } return GRID; }
  function frame(rootEl, data, comp) {
    const header = q(rootEl, 'header'), card = q(rootEl, 'card');
    if (!header || !card) return false;
    // nền brand (ảnh hoạ tiết Đắc Nhân) giữ nguyên – người dùng 29/10: "mất cái nền rồi"
    css(card, { background: '#ffffff', borderRadius: '36px', boxShadow: `inset 0 0 0 5px ${RED}` });
    { const g = gridPaper(); if (g) css(card, { backgroundImage: `url("${g}")`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat' }); }   // nền ô ly (người dùng 29/10) – ảnh PNG nên xuất PPTX vẫn còn   // viền vẽ trong: không lấn chỗ nội dung (PPTX đọc thành viền)
    const sec = q(header, 'section'), top = q(header, 'topic'), lb = q(header, 'logo_badge');
    css(sec, { background: OR, borderRadius: '14px', boxShadow: 'none' });
    css(top, { background: '#ffffff', border: `3px solid ${OR}`, borderRadius: '14px', boxShadow: 'none' });
    const tt = top && top.querySelector('[data-text]'); if (tt) css(tt, { color: INK, fontWeight: 700 });
    css(lb, { background: 'transparent', boxShadow: 'none', border: 'none' });
    return true;
  }
  // yêu cầu bài (tình huống / tiêu đề) lên thẻ trắng đầu slide như mẫu Đắc Nhân; ô cũ trong thân ẩn đi
  function taskToHeader(rootEl, el) {
    const top = q(rootEl, 'topic'); const tt = top && top.querySelector('[data-text]');
    if (!tt || !el || !vis(el) || !txt(el)) return;
    setT(tt, txt(el)); drop(el);
  }
  // ---------- hội thoại: hình người + bóng thoại, người nói thứ nhất bên trái, người thứ hai bên phải ----------
  // Dạng 1: hình người + bóng thoại hai bên · Dạng 2: danh sách câu (số + Hán + pinyin + dịch) · Dạng 3: sắp xếp đoạn hội thoại (câu xáo trộn A, B, C… + ô điền thứ tự)
  const fz = (e, px) => { if (e) { e.style.fontSize = px + 'px'; e.dataset.fs = String(px); e.dataset.skinFs = '1'; } };
  function letterBox(t, size, bg, color) {   // ô vuông chữ / số (A, B… hoặc 1, 2…)
    const b = document.createElement('div'); b.dataset.n = 'no_box';
    css(b, { flex: '0 0 auto', width: size + 'px', height: size + 'px', background: bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: bg === '#ffffff' ? `inset 0 0 0 3px ${SOFT}` : 'none' });
    if (t) { const e = document.createElement('div'); e.dataset.n = 'no_box.text'; e.dataset.text = '1'; e.textContent = t;
      css(e, { color, fontWeight: 800, fontSize: Math.round(size * 0.52) + 'px', lineHeight: size + 'px', fontFamily: "var(--ff-font-body, 'Montserrat'), sans-serif", textAlign: 'center', width: size + 'px' }); b.appendChild(e); }
    return b;
  }
  function dialogue(rootEl, data, filled, dang) {
    const bub = dang !== 'dn3';   // bóng thoại 2 bên: đóng vai (dn1) · hoàn thành hội thoại (dn4) · xây dựng theo gợi ý (dn5)
    drop(q(rootEl, 'img'));
    taskToHeader(rootEl, q(rootEl, 'situation'));
    const top = q(rootEl, 'topic'), tt = top && top.querySelector('[data-text]');
    if (dang === 'dn3' && tt) setT(tt, 'Sắp xếp các câu sau thành đoạn hội thoại'); else if (dang === 'dn4' && tt) setT(tt, 'Hoàn thành đoạn hội thoại sau'); else if (dang === 'dn5' && tt) setT(tt, 'Xây dựng hội thoại dựa vào các gợi ý sau');
    const au = q(rootEl, 'audio'); if (au && !data._audio) drop(au);
    const lines = q(rootEl, 'lines'); if (!lines) return;
    css(lines, { flex: '1 1 auto', alignSelf: 'stretch', height: 'auto', width: 'auto', maxWidth: 'none', justifyContent: 'space-evenly', gap: bub ? '18px' : '14px' });
    const Ls = [...lines.children].filter(e => /^line_\d+$/.test(e.dataset.n || '') && vis(e));
    if (Ls.length && Ls.length <= 3) { const sp = () => { const d = document.createElement('div'); d.dataset.n = 'spacer_v'; d.style.cssText = 'flex:1 1 0px;min-height:0;order:-1'; return d; }; const top = sp(), bot = sp(); bot.style.order = '99'; lines.insertBefore(top, lines.firstChild); lines.appendChild(bot); }   // ít câu → cụm câu nằm giữa thẻ
    // dạng 3: thứ tự xáo trộn cố định (không đổi mỗi lần dựng) – câu đầu không đứng đầu
    const ord = Ls.map((L, i) => i); if (dang === 'dn3' && ord.length > 1) { ord.sort((a, b) => ((a * 7 + 3) % ord.length) - ((b * 7 + 3) % ord.length)); if (ord[0] === 0) ord.push(ord.shift()); }
    let first = null;
    Ls.forEach((L, i) => {
      const k = L.dataset.n, spEl = q(L, 'speaker'), sp = txt(spEl), box = q(L, 'line'), sb = q(L, 'speaker_box');
      if (first == null) first = sp; const left = !bub || sp === first;
      css(L, { display: 'flex', flexDirection: left ? 'row' : 'row-reverse', alignItems: 'center', gap: bub ? '28px' : '22px', height: 'auto', minHeight: '0', width: '100%', flex: '0 0 auto' });
      drop(sb);
      if (bub) {
        const av = document.createElement('div'); av.dataset.n = k + '.avatar';
        // avatar theo giới của vai trong Excel ("A (nữ)", "Nam – đoạn 1", "B (nam) – người bán"…); vai không ghi giới → bên trái nam, bên phải nữ (người dùng 30/10: avatar phải khớp giọng)
        const boy = /nữ|女/i.test(sp) ? false : /(^|[^\p{L}])nam([^\p{L}]|$)|男/iu.test(sp) ? true : left;
        css(av, { flex: '0 0 auto', width: '132px', height: '132px', borderRadius: '50%', background: boy ? '#FFE3CC' : '#FDE0E0', display: 'flex', alignItems: 'center', justifyContent: 'center' });
        // avatar = ảnh nhân vật lấy từ kho ảnh Châu Á ("Nam, trai" / "chào (bé gái)"), cắt tròn – người dùng 29/10
        css(av, { backgroundImage: `url("assets/${boy ? 'dn-boy' : 'dn-girl'}.png")`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundColor: 'transparent' }); av.dataset.img = '1';
        L.insertBefore(av, L.firstChild);
      } else if (dang === 'dn2') L.insertBefore(letterBox(String(i + 1), 64, OR, '#fff'), L.firstChild);
      else { const pos = ord.indexOf(i); L.style.order = String(pos); L.insertBefore(letterBox(String.fromCharCode(65 + pos), 64, OR, '#fff'), L.firstChild); const ans = letterBox('?', 72, '#ffffff', '#E8B48F'); ans.dataset.n = k + '.order_box'; ans.style.boxShadow = 'none'; ans.style.border = `3px dashed ${SOFT}`; ans.style.boxSizing = 'border-box'; L.appendChild(ans); }   // ô điền thứ tự: nét đứt + dấu ? mờ (người dùng 29/10: ô trống trông như lỗi)
      if (box) {
        const center = bub;
        css(box, center ? { flex: '0 0 1100px', width: '1100px', maxWidth: '1100px', background: '#ffffff', border: `3px solid ${SOFT}`, borderRadius: '28px', padding: '14px 32px', textAlign: 'left', alignItems: 'flex-start', height: 'auto' }
          : { flex: '1 1 auto', width: 'auto', maxWidth: 'none', background: '#ffffff', border: 'none', boxShadow: `inset 0 0 0 3px ${SOFT}`, borderRadius: '18px', padding: '10px 26px', textAlign: 'left', alignItems: 'flex-start', height: 'auto' });
        const de = q(box, 'de'), vi = q(box, 'vi'), py = data['_' + k + '.py'], al = 'left';   /* chữ Hán + nghĩa cùng căn trái (người dùng 29/10: Hán trái – nghĩa giữa lệch nhau) */
        if (de) css(de, { color: '#222', textAlign: al, width: 'auto' });
        { const many = Ls.length >= 4, hanN = t => [...(t || '').replace(/\{[^{}]*\}/g, '').replace(/[A-Za-zÀ-ỹāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ0-9\s]/g, '')].length;
          const ml = Math.max(1, ...Ls.map(L2 => hanN(txt(q(L2, 'de')) || ''))), bw = center ? 1000 : 1150;   // câu dài nhất vừa 1 dòng (chữ Hán ruby ×1,16) – không rớt dấu "。" xuống dòng
          const dz = Math.max(34, Math.min(many ? 42 : 48, Math.floor(bw / (ml * 1.4 + 0.6)))); fz(de, dz); fz(vi, many ? 30 : 36); }   /* 4 câu trở lên: nhỏ một bậc – không tràn */
        if (vi) css(vi, { color: GREY, textAlign: al, width: 'auto' });
        if (dang === 'dn3') drop(vi);   // sắp xếp: chỉ câu gốc + pinyin, không lộ nghĩa
        if (dang === 'dn4' && i % 2 === 1 && de) {   // HOÀN THÀNH HỘI THOẠI: câu đáp (lượt 2, 4…) để trống, nghĩa tiếng Việt làm gợi ý – đáp án giữ trong ghi chú GV
          (rootEl.__ans = rootEl.__ans || []).push(`${txt(spEl) || 'B'}: ${([...de.querySelectorAll('[data-text]')].filter(t => t.dataset.n !== 'ruby' && !t.querySelector('[data-text]')).map(t => t.textContent).join('') || txt(de)).replace(/\s+/g, '')}`); rootEl.dataset.dnAnswer = 'ĐÁP ÁN (hoàn thành hội thoại):\n' + rootEl.__ans.join('\n');
          setT(de, '＿＿＿＿＿＿＿＿＿＿＿＿'); css(de, { color: SOFT, letterSpacing: '0' }); box.dataset.blank = '1'; }
        if (dang === 'dn5') { if (de) drop(de); if (vi) { css(vi, { color: INK, fontWeight: 600 }); fz(vi, 40); } }   // XÂY DỰNG THEO GỢI Ý: chỉ ý tiếng Việt, HV tự nói câu tiếng Trung
        if (py && (vi || de) && dang !== 'dn5' && !box.dataset.blank) { const pe = cloneText(vi || de, py, k + '.pinyin', filled, { color: OR, fontWeight: 700, textAlign: al }); fz(pe, 36); de && de.nextSibling ? box.insertBefore(pe, de.nextSibling) : box.appendChild(pe); }
      }
    });
  }
  // ---------- thẻ từ (lưới 4/6/8): số thứ tự + hình + pinyin + chữ + nghĩa ----------
  // Dạng 1: thẻ hình có số · Dạng 2: flashcard chỉ chữ Hán (học theo flashcard) · Dạng 3: thẻ chữ không hình (pinyin + chữ to + nghĩa)
  function vocabGrid(rootEl, data, filled, dang, comp) {
    const n = +((comp || '').match(/\d+$/) || [8])[0], big = { 4: 144, 6: 120, 8: 96 }[n] || 96;
    const top = q(rootEl, 'topic'), tt = top && top.querySelector('[data-text]');
    if (dang === 'dn2' && tt) setT(tt, 'Học theo flashcard'); else if (dang === 'dn3' && tt) setT(tt, 'Đọc và đoán nghĩa các từ sau');
    rootEl.querySelectorAll('[data-n^="vocab_"]').forEach(c => {
      const m = (c.dataset.n || '').match(/^vocab_(\d+)$/); if (!m || !vis(c)) return;
      css(c, { position: 'relative', background: '#ffffff', borderRadius: '20px', boxShadow: `inset 0 0 0 ${dang === 'dn2' ? 5 : 3}px ${dang === 'dn2' ? OR : SOFT}`, overflow: 'visible' });
      const de = q(c, 'de'), vi = q(c, 'vi'), py = data[`_vocab_${m[1]}.py`], im = q(c, 'img');
      if (dang !== 'dn2') c.appendChild(badge(m[1]));
      if (dang !== 'dn1') { drop(im); css(c, { justifyContent: 'center', alignItems: 'center' }); }
      if (dang === 'dn2') { drop(vi); if (de) { de.querySelectorAll('[data-n="ruby"]').forEach(r => { r.style.display = 'none'; });   /* flashcard: chỉ chữ Hán, không pinyin */
        css(de, { color: '#B23A12', textAlign: 'center', justifyContent: 'center', alignSelf: 'stretch', width: '100%', maxWidth: 'none', margin: 'auto 0' }); fz(de, big); } return; }
      if (de) { css(de, { color: INK, textAlign: 'center', justifyContent: 'center', alignSelf: 'stretch', width: '100%', maxWidth: 'none' }); fz(de, dang === 'dn3' ? big : ({ 4: 76, 6: 66, 8: 56 }[n] || 56)); de.querySelectorAll('[data-n="ruby"]').forEach(t => fz(t, n >= 8 ? 22 : 26)); }   // chữ Hán + pinyin căn giữa thẳng nghĩa, to hơn (người dùng 29/10)
      if (vi) css(vi, { textAlign: 'center', alignSelf: 'stretch' });
      if (im && dang === 'dn1') { const row = !/column/.test(c.style.flexDirection || '');   /* thẻ chưa gắn vào trang → đọc style trực tiếp (mặc định flex = ngang) */   // thẻ ngang (Vocab Grid 4: hình trái – chữ phải) / thẻ dọc (6, 8: hình trên)
        const imOn = vis(im) && im.style.display !== 'none';
        css(im, !imOn ? {} : row ? { flex: '0 0 42%', width: '42%', maxWidth: '42%', height: 'auto', alignSelf: 'stretch', minHeight: '0' }
          : { flex: '1 1 0px', height: 'auto', minHeight: ({ 4: 260, 6: 170, 8: 120 }[n] || 120) + 'px', width: '100%', maxWidth: 'none', alignSelf: 'stretch' });
        const tx = q(c, 'txt'); if (row && tx) { css(tx, { flex: '1 1 0px', alignItems: 'center', width: imOn ? 'auto' : '100%', maxWidth: 'none' });   /* không có hình → chữ giữa cả thẻ */ const k0 = [...tx.children].filter(vis); if (k0.length) { k0[0].style.marginTop = 'auto'; k0[k0.length - 1].style.marginBottom = 'auto'; } } }   // ô hình cùng cỡ, lấp hết chỗ trống
      if (vi) css(vi, { color: GREY });
      let firstEl = de;
      if (py && de) { const pe = cloneText(vi || de, py, `vocab_${m[1]}.pinyin`, filled, { color: OR, fontWeight: 700 }); c.insertBefore(pe, de); firstEl = pe; }
      if (dang === 'dn3') { css(firstEl, { marginTop: 'auto' }); css(vi || de, { marginBottom: 'auto' }); }   // cụm chữ nằm giữa thẻ
    });
  }
  // ---------- thẻ một từ: khung hình viền + câu ví dụ dưới hình (từ được tô cam), bên phải pinyin cam / chữ lớn / nghĩa ----------
  // Dạng 1: hình + câu ví dụ bên trái, từ bên phải · Dạng 2: không hình – khung từ ở trên, khung câu ví dụ ở dưới · Dạng 3: như dạng 1, từ bên trái
  function vocabCard(rootEl, data, filled, dang) {
    taskToHeader(rootEl, q(rootEl, 'title'));
    const cols = q(rootEl, 'columns'), img = q(rootEl, 'img'), info = q(rootEl, 'info'), ex = q(rootEl, 'ex_box');
    if (!cols || !img || !info) return;
    if (dang === 'dn2') return vocabCard2(rootEl, cols, img, info, ex);
    if (dang === 'dn3') cols.style.flexDirection = 'row-reverse';
    const left = document.createElement('div'); left.dataset.n = 'left';
    css(left, { flex: '0 0 46%', display: 'flex', flexDirection: 'column', border: `4px solid ${SOFT}`, borderRadius: '28px', padding: '24px', gap: '16px', background: '#fff', position: 'relative', boxSizing: 'border-box' });
    cols.insertBefore(left, img); left.appendChild(img); css(img, { flex: '1 1 auto', width: '100%', height: 'auto', minHeight: '0' });
    if (ex && vis(ex)) { const hr = document.createElement('div'); hr.dataset.n = 'ex_rule'; css(hr, { flex: '0 0 auto', height: '3px', width: '100%', background: SOFT, borderRadius: '2px' }); left.appendChild(hr);   // đường kẻ riêng (viền 1 cạnh không xuất được sang PPTX)
      left.appendChild(ex); css(ex, { boxShadow: 'none', border: 'none', borderRadius: '0', padding: '4px 0 0', background: 'transparent', textAlign: 'center', flex: '0 0 auto', width: '100%' });
      ex.querySelectorAll('[data-text]').forEach(t => css(t, { textAlign: 'center', width: '100%' }));
      const w = txt(q(rootEl, 'word')), exde = q(ex, 'exde');
      if (w && exde && !exde.dataset.ruby && !exde.querySelector('[data-n="rubyunit"]') && txt(exde).includes(w)) { const t = tgt(exde); t.innerHTML = txt(exde).split(w).map(esc).join(`<span data-seg="1" style="color:${OR}">${esc(w)}</span>`); } }
    css(info, { flex: '1 1 auto', alignSelf: 'stretch', height: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '10px' });
    const word = q(info, 'word'), meta = q(info, 'meta'), ipa = q(info, 'ipa'), mean = q(info, 'mean');
    if (meta && word) info.insertBefore(meta, word);
    css(meta, { marginTop: 'auto' }); css(mean, { marginBottom: 'auto' });   // cụm pinyin / chữ / nghĩa nằm giữa cột
    css(meta, { justifyContent: 'center' }); css(ipa, { color: OR, fontWeight: 700, textAlign: 'center' });
    css(word, { color: '#4A4A4A', textAlign: 'center' }); css(mean, { color: GREY, fontWeight: 500, textAlign: 'center' });
  }
  function hiWord(rootEl, ex) {   // tô cam từ đang học trong câu ví dụ
    const w = txt(q(rootEl, 'word')), exde = ex && q(ex, 'exde');
    if (w && exde && !exde.dataset.ruby && !exde.querySelector('[data-n="rubyunit"]') && txt(exde).includes(w)) { const t = tgt(exde); t.innerHTML = txt(exde).split(w).map(esc).join(`<span data-seg="1" style="color:${OR}">${esc(w)}</span>`); }
  }
  function vocabCard2(rootEl, cols, img, info, ex) {
    drop(img); css(cols, { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '36px' });
    css(info, { flex: '0 0 auto', width: '62%', margin: 'auto auto 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px', padding: '22px 32px', borderRadius: '24px', boxShadow: `inset 0 0 0 4px ${SOFT}`, background: '#fff' });
    const word = q(info, 'word'), meta = q(info, 'meta'), ipa = q(info, 'ipa'), mean = q(info, 'mean');
    if (meta && word) info.insertBefore(word, meta);
    css(word, { color: OR, textAlign: 'center' }); fz(word, 120); css(meta, { justifyContent: 'center' }); css(ipa, { color: OR, fontWeight: 600, textAlign: 'center' }); css(mean, { color: GREY, textAlign: 'center' });
    if (ex && vis(ex)) { cols.appendChild(ex); css(ex, { flex: '0 0 auto', width: '78%', margin: '0 auto auto', boxShadow: `inset 0 0 0 4px ${SOFT}`, border: 'none', borderRadius: '24px', padding: '22px 32px', background: '#fff', textAlign: 'center' });
      ex.querySelectorAll('[data-text]').forEach(t => css(t, { textAlign: 'center', width: '100%' })); hiWord(rootEl, ex); }
  }
  const HRED = '#C62828', PINK = '#FDE7DF', isHan = e => /[㐀-鿿]/.test(txt(e));
  const hanRed = root0 => root0 && [...(root0.dataset && root0.dataset.text ? [root0] : []), ...root0.querySelectorAll('[data-text]')].forEach(t => {   /* gồm cả chính ô (câu không pinyin – 30/10: câu ví dụ xám, khác các câu đỏ) */ if (isHan(t) && !/ruby/.test(t.dataset.n || '')) t.style.color = HRED; });   // chữ Hán đỏ như mẫu Đắc Nhân, pinyin giữ màu xám
  // ---------- NGỮ PHÁP: Dạng 1 khung "ĐỊNH NGHĨA" nét đứt + ví dụ VD1/VD2 · Dạng 2 quy tắc trên, ví dụ 2 cột dưới · Dạng 3 công thức nền hồng chữ đỏ giữa slide ----------
  function grammar(rootEl, data, filled, dang) {
    const box = q(rootEl, 'rule_box'), rule = q(rootEl, 'rule'), lab = box && q(box, 'label'), exs = q(rootEl, 'examples'), cols = q(rootEl, 'columns');
    const items = [...rootEl.querySelectorAll('[data-n^="ex_"]')].filter(e => /^ex_\d+$/.test(e.dataset.n) && vis(e));
    items.forEach((ex, i) => { const nb = q(ex, 'no_box'), no = q(ex, 'no');
      if (nb) css(nb, { background: OR, borderRadius: '10px', width: dang === 'dn3' ? '56px' : '76px', height: '48px', boxShadow: 'none' });
      if (no) { setT(no, dang === 'dn3' ? String(i + 1) : 'VD' + (i + 1)); css(no, { color: '#fff', fontWeight: 800, fontSize: '26px' }); }
      hanRed(q(ex, 'body') || ex); const vi = q(ex, 'vi'); if (vi) css(vi, { color: '#6B3A2E' }); });
    if (box) {
      if (dang === 'dn3') { css(box, { background: PINK, border: 'none', boxShadow: 'none', borderRadius: '18px', alignItems: 'center', textAlign: 'center' }); if (lab) drop(lab); if (rule) { css(rule, { color: HRED, fontWeight: 800, textAlign: 'center' }); rule.querySelectorAll('[data-text]').forEach(t => css(t, t.dataset.n === 'ruby' ? { color: GREY, fontWeight: 400 } : { color: HRED, fontWeight: 800 })); } }
      else { css(box, { background: '#FFFDF9', border: `3px dashed ${OR}`, boxShadow: 'none', borderRadius: '18px', boxSizing: 'border-box' });
        if (lab) { setT(lab, 'ĐỊNH NGHĨA'); css(lab, { color: OR, fontWeight: 800, letterSpacing: '0.04em' }); } }
    }
    if (cols && dang !== 'dn1') { css(cols, { flexDirection: 'column', gap: '28px' }); if (box) css(box, { flex: '0 0 auto', width: '100%', maxWidth: 'none', height: 'auto' }); if (exs) css(exs, { flex: '1 1 auto', width: '100%', maxWidth: 'none' }); }
    if (exs && dang === 'dn2') { css(exs, { flexDirection: 'row', flexWrap: 'wrap', alignContent: 'flex-start', columnGap: '28px', rowGap: '18px' }); items.forEach(ex => css(ex, { flex: '0 0 calc(50% - 14px)', maxWidth: 'calc(50% - 14px)', height: 'auto' })); }
    {   // cỡ chữ cố định (mọi dạng – người dùng 29/10: chữ Hán ví dụ nhỏ khó nhìn) (không để fitText thu nhỏ còn 20px – ví dụ đọc không được, pinyin dính chữ)
      if (rule) rule.querySelectorAll('[data-text]').forEach(t => fz(t, t.dataset.n === 'ruby' ? 24 : 36)); if (lab) fz(lab, 26);
      if (box && dang !== 'dn1') css(box, { padding: dang === 'dn3' ? '22px 36px' : '20px 32px', gap: '8px' });
      const many = items.length >= 3; items.forEach(ex => { fz(q(ex, 'de'), many ? 38 : 42); ex.querySelectorAll('[data-n="ruby"]').forEach(t => fz(t, 22)); fz(q(ex, 'vi'), many ? 26 : 28); css(ex, { gap: '14px', alignItems: 'flex-start' }); const bd = q(ex, 'body'); if (bd) css(bd, { gap: '4px', minWidth: '0' }); });
    }
    if (exs && dang === 'dn3') { css(exs, { flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'stretch', gap: '24px' });   // 3 ví dụ thành 3 thẻ ngang dưới khung công thức
      items.forEach(ex => { css(ex, { flex: '1 1 0', minWidth: '0', maxWidth: 'none', height: 'auto', flexDirection: 'column', alignItems: 'flex-start', background: '#fff', borderRadius: '16px', boxShadow: `inset 0 0 0 2px ${SOFT}`, padding: '18px 22px', boxSizing: 'border-box' }); }); }
  }
  // ---------- CÔNG THỨC TỪNG DẠNG (f_n: label + formula + ex): Dạng 1 nhãn cam + khung nét đứt · Dạng 2 các dạng thành thẻ cột ngang · Dạng 3 khung hồng, công thức đỏ đậm ----------
  function formulaRows(rootEl, data, filled, dang) {
    const rows = q(rootEl, 'rows'), fs = [...rootEl.querySelectorAll('[data-n]')].filter(e => /^f_\d+$/.test(e.dataset.n) && vis(e));
    if (dang === 'dn2' && rows) css(rows, { flexDirection: 'row', alignItems: 'stretch', gap: '24px' });
    fs.forEach((f, i) => { const lab = q(f, `${f.dataset.n}.label`), col = q(f, `${f.dataset.n}.col`), fm = q(f, `${f.dataset.n}.formula`), ex = q(f, `${f.dataset.n}.ex`);
      hanRed(ex);
      if (ex && !ex.dataset.ruby && !ex.querySelector('[data-n="rubyunit"]')) {   // câu ví dụ không gắn pinyin (đã có chú thích pinyin): cùng cỡ chữ Hán với câu có pinyin, dài thì xuống dòng – không co nhỏ (30/10)
        css(ex, { whiteSpace: 'normal', lineHeight: '1.35' }); ex.dataset.exPlain = '1'; }   /* cỡ chữ: engine formulaUnify (sau khi co chữ) */
      if (dang === 'dn1') { css(f, { background: '#FFFDF9', boxShadow: 'none', border: `3px dashed ${OR}`, borderRadius: '18px', boxSizing: 'border-box' });
        if (lab) css(lab, { color: '#fff', background: OR, borderRadius: '12px', padding: '10px 18px', fontWeight: 800, textAlign: 'center', alignSelf: 'center', flex: '0 0 210px', width: '210px', minWidth: '210px', maxWidth: '210px', boxSizing: 'border-box' }); }   /* nhãn cùng bề rộng → công thức thẳng cột */
      if (dang === 'dn2') { css(f, { flex: '1 1 0', minWidth: '0', maxWidth: 'none', height: 'auto', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', gap: '16px', background: '#fff', boxShadow: `inset 0 0 0 3px ${SOFT}`, borderRadius: '20px', padding: '24px 26px', boxSizing: 'border-box' });
        if (lab) { css(lab, { width: 'auto', maxWidth: 'none', flex: '0 0 auto', alignSelf: 'flex-start', color: '#fff', background: OR, borderRadius: '10px', padding: '6px 16px', fontWeight: 800 }); fz(lab, 28); }
        if (col) css(col, { width: '100%', maxWidth: 'none', flex: '1 1 auto' }); }
      if (dang === 'dn3') { css(f, { background: PINK, boxShadow: 'none', borderRadius: '18px' });
        if (lab) { setT(lab, txt(lab)); css(lab, { color: HRED, fontWeight: 800 }); }
        if (fm) fm.querySelectorAll('[data-text]').forEach(t => css(t, t.dataset.n === 'ruby' ? { color: GREY, fontWeight: 400 } : { color: HRED, fontWeight: 800 })); }
    });
  }
  // ---------- LUYỆN TẬP (trắc nghiệm): Dạng 1 hai cột ô viền + ô chữ vuông cam · Dạng 2 danh sách dọc "A." · Dạng 3 một hàng, chữ khoanh tròn ----------
  function choices(rootEl, data, filled, dang) {
    if (dang === 'dn6') return translate(rootEl, data, filled);
    const groups = [...rootEl.querySelectorAll('[data-n]')].filter(e => /^options(_\d+)?$/.test(e.dataset.n) && vis(e));
    groups.forEach(g => {
      const opts = [...g.children].filter(o => /^opt_[A-H]$/.test(o.dataset.n || '') && vis(o));
      if (dang === 'dn1') { css(g, { position: 'relative' });
        if (opts.length >= 2 && !q(g, 'col_rule')) { const ln = document.createElement('div'); ln.dataset.n = 'col_rule'; css(ln, { position: 'absolute', left: 'calc(50% - 1px)', top: '6px', bottom: '6px', width: '2px', background: SOFT, zIndex: 0 }); g.appendChild(ln); } }
      if (dang === 'dn2') css(g, { flexDirection: 'column', flexWrap: 'nowrap', gap: '10px' });
      if (dang === 'dn3') css(g, { flexDirection: 'row', flexWrap: 'nowrap', gap: '24px', alignItems: 'stretch' });
      opts.forEach(o => {
        const kb = q(o, 'key_box'), k = q(o, 'key');
        if (dang === 'dn1') { css(o, { background: '#fff', boxShadow: `inset 0 0 0 2px ${SOFT}`, borderRadius: '14px', zIndex: 1 }); css(kb, { background: OR, borderRadius: '10px', boxShadow: 'none' }); css(k, { color: '#fff', fontWeight: 800 }); }
        if (dang === 'dn2') { css(o, { flex: '0 0 auto', width: '100%', maxWidth: 'none', background: 'transparent', boxShadow: 'none', minHeight: '0' }); css(kb, { background: 'transparent', boxShadow: 'none', width: 'auto' }); if (k) { setT(k, txt(k).replace(/\.?$/, '.')); css(k, { color: OR, fontWeight: 800, fontSize: '40px' }); } }
        if (dang === 'dn3') { css(o, { flex: '1 1 0', minWidth: '0', maxWidth: 'none', flexDirection: 'column-reverse', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: '#fff', boxShadow: `inset 0 0 0 2px ${SOFT}`, borderRadius: '18px', gap: '14px' });
          css(kb, { background: 'transparent', boxShadow: `inset 0 0 0 4px ${OR}`, borderRadius: '50%', width: '72px', height: '72px' }); css(k, { color: OR, fontWeight: 800 });
          o.querySelectorAll('[data-text]').forEach(t => { if (t !== k) css(t, { textAlign: 'center' }); }); }
        [...o.children].filter(c => c !== kb).forEach(hanRed);
      });
    });
    // CỠ CHỮ THEO KHUNG (mẫu gốc chữ nhỏ, trống nửa slide): 1 câu → chữ to, 2 câu trở lên → nhỏ hơn
    const k = groups.length > 1 ? 0.72 : 1, R = v => Math.round(v * k);
    rootEl.querySelectorAll('[data-n]').forEach(qq => { if (!/^question(_\d+)?$/.test(qq.dataset.n) || !vis(qq)) return; css(qq, { color: INK });
      const ts = qq.dataset.text != null ? [qq] : [...qq.querySelectorAll('[data-text]')]; ts.forEach(t => { fz(t, t.dataset.n === 'ruby' ? R(30) : R(72)); t.style.letterSpacing = '0'; }); });
    const hsOf = g => { const os = [...g.children].filter(o => /^opt_[A-H]$/.test(o.dataset.n || '') && vis(o));
      const ml = Math.max(1, ...os.flatMap(o => [...o.querySelectorAll('[data-text]')].filter(t => t.dataset.n !== 'ruby' && t !== q(t.closest('[data-n^="opt_"]'), 'key')).map(t => isHan(t) ? [...txt(t).replace(/[。，！？.,!?\s]/g, '')].length : Math.ceil([...txt(t)].length / 2.2))));   // chữ Latin ~ nửa ô chữ Hán
      const avail = dang === 'dn3' ? 1720 / Math.max(1, os.length) - 70 : dang === 'dn1' ? 860 - 190 : 1720 - 220, HS = Math.max(36, Math.min(120, Math.floor(avail / (ml + 1.6) / k))); return HS; };   // cỡ chữ Hán vừa một dòng trong ô đáp án
    const HS = Math.min(...groups.map(hsOf));   // MỘT cỡ cho mọi câu trên slide (người dùng 29/10: câu 3 nhỏ – câu 4 to, không cân)
    groups.forEach(g => { css(g, { flex: '1 1 auto', alignContent: 'stretch', alignItems: 'stretch', maxHeight: 'none', height: 'auto' });
      const os = [...g.children].filter(o => /^opt_[A-H]$/.test(o.dataset.n || '') && vis(o));
      os.forEach(o => { const kb = q(o, 'key_box'), kk = q(o, 'key');
        css(o, { flexGrow: '1', minHeight: R(dang === 'dn2' ? 96 : 150) + 'px', height: 'auto', alignItems: 'center', padding: '0 ' + R(28) + 'px', boxSizing: 'border-box' });
        if (kb && dang !== 'dn2') css(kb, { width: R(dang === 'dn3' ? 84 : 72) + 'px', height: R(dang === 'dn3' ? 84 : 72) + 'px', flex: '0 0 auto' }); if (kk) fz(kk, R(dang === 'dn2' ? 56 : 44));
        if (kb && dang === 'dn1') css(kb, { width: R(88) + 'px', height: R(88) + 'px' });
        if (dang === 'dn3') [...o.children].forEach(c => { if (c !== kb) css(c, { flex: '0 0 auto', height: 'auto', maxWidth: '100%' }); });
        o.querySelectorAll('[data-n="rubyunit"]').forEach(u => { if (u.style.flex.startsWith('1')) u.style.alignItems = 'flex-start'; });   // pinyin cả câu căn trái thẳng chữ Hán
        o.querySelectorAll('[data-text]').forEach(t => { if (t === kk) return; if (t.dataset.n !== 'ruby' && t.dataset.n !== 'base') css(t, { height: 'auto', minHeight: '0', maxHeight: 'none', overflow: 'visible', lineHeight: '1.3' }); fz(t, t.dataset.n === 'ruby' ? R(dang === 'dn2' ? 30 : 38) : R(isHan(t) ? Math.min(HS, dang === 'dn2' ? 80 : 120) : (dang === 'dn2' ? 52 : Math.min(64, HS * 0.6)))); }); }); });
  }
  // DỊCH CÂU SANG TIẾNG TRUNG (cách triển khai của slide trắc nghiệm có câu tiếng Việt – mẫu "Ngữ pháp dịch câu"): bỏ đáp án, câu Việt to + dòng kẻ để HV viết/nói; đáp án đúng giữ trong ghi chú
  function translate(rootEl, data, filled) {
    const top = q(rootEl, 'topic'), tt = top && top.querySelector('[data-text]'); if (tt) setT(tt, 'Dịch các câu sau sang tiếng Trung');
    { const mk = ((SPEC && SPEC.ans && SPEC.ans.marks) || []).map(m => String(data[m + '.text'] || '').replace(/\{([^{}]*)\}/, '($1)').trim()).filter(Boolean); if (mk.length) rootEl.dataset.dnAnswer = 'ĐÁP ÁN (dịch câu): ' + mk.join(' / '); }
    rootEl.querySelectorAll('[data-n^="instruction"], [data-n="task.row"], [data-n="task"]').forEach(drop);   // bỏ dòng "Chọn câu đúng"
    [...rootEl.querySelectorAll('[data-n]')].filter(e => /^options(_\d+)?$/.test(e.dataset.n) && vis(e)).forEach(g => {
      const ln = document.createElement('div'); ln.dataset.n = g.dataset.n + '.write'; css(ln, { flex: '0 0 auto', alignSelf: 'stretch', height: '120px', margin: '30px 120px 0', borderBottom: `4px dashed ${OR}` });
      g.parentElement.insertBefore(ln, g); drop(g); });
    rootEl.querySelectorAll('[data-n]').forEach(qq => { if (!/^question(_\d+)?$/.test(qq.dataset.n) || !vis(qq)) return;
      const ts = qq.dataset.text != null ? [qq] : [...qq.querySelectorAll('[data-text]')];
      ts.forEach(t => { const m = t.textContent.match(/^(\s*\d+[.)]\s*)?(?:[^“"]*?)[“"]([^”"]+)[”"]/); if (m) setT(t, (m[1] || '') + m[2]); fz(t, 72); t.style.setProperty('font-size', '72px', 'important'); css(t, { color: INK, fontWeight: 700, textAlign: 'center' }); }); css(qq, { marginTop: 'auto', alignSelf: 'center', textAlign: 'center' }); });
    const ws = [...rootEl.querySelectorAll('[data-n$=".write"]')]; if (ws.length) ws[ws.length - 1].style.marginBottom = 'auto';   // câu + dòng viết nằm giữa slide
  }
  // ================= CÁCH TRIỂN KHAI ĐỢT 2 (29/10) – dựng bảng hoạt động mới trong khung, từ đúng nội dung slide =================
  function board(rootEl, title) {
    const card = q(rootEl, 'card'); if (!card) return null;
    const top = q(rootEl, 'topic'), tt = top && top.querySelector('[data-text]'); if (tt && title) setT(tt, title);
    [...card.children].forEach(c => { if (c.style.display !== 'none') drop(c); });
    const b = document.createElement('div'); b.dataset.n = 'act_board';
    css(b, { flex: '1 1 auto', alignSelf: 'stretch', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '20px', minHeight: '0', justifyContent: 'center' });
    card.appendChild(b); return b;
  }
  const deep = (src, n, filled) => { const e = src.cloneNode(true); e.removeAttribute('data-hid'); e.style.display = ''; e.dataset.n = n; e.dataset.filled = n; css(e, { flex: '1 1 0px', minWidth: '0', width: 'auto', maxWidth: 'none', height: 'auto' });
    if (e.dataset.ruby) css(e, { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'flex-start' });   // câu có pinyin: chữ chạy ngang
    if (filled) filled.push(e); return e; };
  const shuffle = (a) => a.map((x, i) => [((i * 7 + 3) % a.length), x]).sort((p1, p2) => p1[0] - p2[0]).map(p1 => p1[1]);   // xáo cố định (không đổi mỗi lần dựng)
  // TỪ VỰNG · NỐI TỪ VỚI NGHĨA: cột trái chữ Hán + pinyin (đánh số), cột phải nghĩa xáo trộn (A, B…); đáp án vào ghi chú
  function vocabMatch(rootEl, data, filled) {
    const cells = [...rootEl.querySelectorAll('[data-n]')].filter(e => /^vocab_\d+$/.test(e.dataset.n) && vis(e));
    const items = cells.map(c => ({ de: q(c, 'de'), vi: String(data[`${c.dataset.n}.vi`] || '').replace(/\([^)]*\)/g, '').split(/[;；]/)[0].trim() })).filter(x => x.de && x.vi);
    if (items.length < 2) return; const b = board(rootEl, 'Nối từ với nghĩa đúng'); if (!b) return;
    const row = document.createElement('div'); css(row, { display: 'flex', gap: '120px', alignItems: 'stretch', flex: '1 1 auto' }); b.appendChild(row);
    const colL = document.createElement('div'), colR = document.createElement('div'); [colL, colR].forEach(c => { css(c, { flex: '1 1 0px', display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', gap: '12px' }); row.appendChild(c); });
    const n = items.length, H = Math.min(110, Math.floor(720 / n) - 12), F = Math.min(56, Math.round(H * 0.5)), sh = shuffle(items.map((x, i) => i)); if (sh.every((v, i) => v === i)) sh.push(sh.shift());
    const ans = [];
    items.forEach((x, i) => { const t = document.createElement('div'); t.dataset.n = `m_${i + 1}`; css(t, { display: 'flex', alignItems: 'center', gap: '22px', background: '#fff', boxShadow: `inset 0 0 0 3px ${SOFT}`, borderRadius: '16px', padding: '0 24px', height: H + 'px', boxSizing: 'border-box' });
      const nb = letterBox(String(i + 1), Math.round(H * 0.6), OR, '#fff'); const de = deep(x.de, `m_${i + 1}.de`, filled); fz(de, F); de.querySelectorAll('[data-n="ruby"]').forEach(r => fz(r, 22)); css(de, { color: INK, margin: '0', textAlign: 'left' });
      t.append(nb, de); colL.appendChild(t); });
    sh.forEach((ix, j) => { const t = document.createElement('div'); t.dataset.n = `mv_${j + 1}`; css(t, { display: 'flex', alignItems: 'center', gap: '22px', background: PINK, borderRadius: '16px', padding: '0 24px', height: H + 'px', boxSizing: 'border-box' }); t.dataset.dnRow = '1';
      const L = String.fromCharCode(65 + j), lb = letterBox(L, Math.round(H * 0.6), '#fff', OR); lb.style.boxShadow = `inset 0 0 0 3px ${OR}`;
      const v = cloneText(items[0].de.closest('[data-n^="vocab_"]').querySelector('[data-n="vi"]') || items[0].de, items[ix].vi, `mv_${j + 1}.vi`, filled, { color: INK, textAlign: 'left', margin: '0' }); fz(v, Math.round(F * 0.75));
      css(v, { flex: '1 1 0px', alignSelf: 'center' }); t.append(lb, v); colR.appendChild(t); ans[ix] = `${ix + 1}–${L}`; });
    rootEl.dataset.dnAnswer = 'ĐÁP ÁN (nối từ với nghĩa): ' + ans.join(', ');
  }
  // THẺ MỘT TỪ · ĐẶT CÂU VỚI TỪ CHO SẴN: từ to + pinyin + nghĩa, 2 dòng kẻ để HV đặt câu; câu ví dụ gốc làm đáp án gợi ý
  function vocabMakeSentence(rootEl, data, filled) {
    const w = q(rootEl, 'word'); if (!w) return; const b = board(rootEl, 'Đặt câu với từ cho sẵn'); if (!b) return;
    const box = document.createElement('div'); css(box, { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '48px', marginTop: 'auto' }); b.appendChild(box);
    const de = deep(w, 'act.word', filled); fz(de, 150); css(de, { color: HRED, textAlign: 'center', margin: '0', flex: '0 0 auto' }); box.appendChild(de);
    const side = document.createElement('div'); css(side, { display: 'flex', flexDirection: 'column', gap: '10px' }); box.appendChild(side);
    const ipa = q(rootEl, 'ipa') || w; const p = cloneText(ipa, String(data.ipa || '').replace(/\//g, ''), 'act.ipa', filled, { color: OR, fontWeight: 700 }); fz(p, 48);
    const m = cloneText(ipa, String(data.mean || ''), 'act.mean', filled, { color: INK }); fz(m, 40); side.append(p, m);
    for (let i = 0; i < 2; i++) { const ln = document.createElement('div'); ln.dataset.dnLine = '1'; css(ln, { height: '110px', margin: '0 120px', borderBottom: `4px dashed ${OR}`, flex: '0 0 auto', alignSelf: 'stretch' }); b.appendChild(ln); }
    b.lastChild.style.marginBottom = 'auto';
    if (data.exde) rootEl.dataset.dnAnswer = 'GỢI Ý ĐÁP ÁN (đặt câu): ' + String(data.exde).replace(/\{([^{}]*)\}/g, '') + (data.exvi ? ' – ' + data.exvi : '');
  }
  // HỘI THOẠI · ĐỌC TO CÙNG LǍOSHĪ: các câu xếp dọc, chữ Hán to + pinyin, không nghĩa, số thứ tự
  function dlgReadAloud(rootEl, data, filled) {
    const Ls = [...rootEl.querySelectorAll('[data-n]')].filter(e => /^line_\d+$/.test(e.dataset.n) && vis(e)); if (!Ls.length) return;
    const b = board(rootEl, 'Đọc to các câu sau cùng Lǎoshī!'); if (!b) return;
    const n = Ls.length, F = n <= 3 ? 72 : n <= 5 ? 62 : n <= 7 ? 50 : 42;
    Ls.forEach((L, i) => { const de = q(L, 'de'); if (!de) return; const t = document.createElement('div'); t.dataset.n = `r_${i + 1}`; css(t, { display: 'flex', alignItems: 'center', gap: '28px', padding: '6px 40px' });
      const nb = letterBox(String(i + 1), 64, OR, '#fff'); const d = deep(de, `r_${i + 1}.de`, filled); fz(d, F); d.querySelectorAll('[data-n="ruby"]').forEach(r => fz(r, 24)); css(d, { color: INK, textAlign: 'left', margin: '0' });
      d.style.setProperty('font-size', F + 'px', 'important'); t.append(nb, d); b.appendChild(t); });
    const rs = [...b.children]; if (rs.length) { rs[0].style.marginTop = 'auto'; rs[rs.length - 1].style.marginBottom = 'auto'; }
  }
  // HỘI THOẠI · CHỌN SỐ VÀ TRẢ LỜI: ô số to (mỗi ô = một câu hỏi trong hội thoại), HV chọn số → GV đọc câu hỏi (trong ghi chú), HV trả lời
  function dlgPickNumber(rootEl, data, filled) {
    const Ls = [...rootEl.querySelectorAll('[data-n]')].filter(e => /^line_\d+$/.test(e.dataset.n) && vis(e));
    const qs = Ls.map(L => q(L, 'de')).filter(Boolean).map(d => ([...d.querySelectorAll('[data-text]')].filter(t => t.dataset.n !== 'ruby' && !t.querySelector('[data-text]')).map(t => t.textContent).join('') || txt(d)).replace(/\s+/g, '')).filter(t => /[？?]/.test(t));
    if (!qs.length) return; const b = board(rootEl, 'Hãy chọn một số và trả lời câu hỏi!'); if (!b) return;
    const g = document.createElement('div'); css(g, { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '40px', alignContent: 'center', flex: '1 1 auto' }); b.appendChild(g);
    const S = qs.length <= 3 ? 260 : qs.length <= 6 ? 220 : 170;
    qs.forEach((x, i) => { const c = letterBox(String(i + 1), S, i % 2 ? PINK : OR, i % 2 ? OR : '#fff'); c.dataset.n = `pick_${i + 1}`; c.style.borderRadius = '32px'; c.querySelectorAll('[data-text], span, div').forEach(t => { t.style.fontSize = Math.round(S * 0.5) + 'px'; t.style.fontWeight = '800'; }); g.appendChild(c); });
    rootEl.dataset.dnAnswer = 'CÂU HỎI THEO SỐ:\n' + qs.map((x, i) => `${i + 1}. ${x}`).join('\n');
  }
  // ---------- NGHE: Dạng 1 thẻ bài nghe hồng + câu hỏi ô số cam · Dạng 2 bỏ hình, câu hỏi 2 cột · Dạng 3 bỏ hình, câu hỏi to giữa slide ----------
  function listening(rootEl, data, filled, dang) {
    const tb = q(rootEl, 'track_box'), au = q(rootEl, 'audio'), img = q(rootEl, 'img'), col = q(rootEl, 'task_col');
    if (au && !data._audio) drop(au);
    if (tb) { css(tb, { background: PINK, borderRadius: '999px', boxShadow: 'none', padding: '10px 30px' }); const t = q(tb, 'track'); if (t) css(t, { color: OR, fontWeight: 800 });
      tb.querySelectorAll('[data-vector]').forEach(v => { v.dataset.color = OR; v.style.color = OR; v.querySelectorAll('*').forEach(e => { ['fill', 'stroke'].forEach(a => { const x = e.getAttribute(a); if (x && x !== 'none') e.setAttribute(a, OR); }); if (e.style.fill) e.style.fill = OR; if (e.style.backgroundColor) e.style.backgroundColor = OR; }); if (v.style.backgroundColor) v.style.backgroundColor = OR; }); const ic = q(tb, 'track.icon'); if (ic) ic.style.color = OR; }   /* icon tai nghe trắng trên nền hồng không thấy → cam như chữ (30/10) */
    const qs = [...rootEl.querySelectorAll('[data-n^="q_"]')].filter(e => /^q_\d+$/.test(e.dataset.n) && vis(e));
    qs.forEach(qq => { const no = q(qq, 'no'); if (no && !q(qq, 'no_badge2')) { const b = letterBox(txt(no), 56, OR, '#fff'); b.dataset.n = 'no_badge2'; drop(no); qq.insertBefore(b, qq.firstChild); css(qq, { alignItems: 'center', gap: '18px' }); } });
    if (dang !== 'dn1') { drop(img); if (col) css(col, { flex: '1 1 auto', width: '100%', maxWidth: 'none' }); }
    if (dang === 'dn2' && qs[0]) { const par = qs[0].parentElement; const wrap = document.createElement('div'); wrap.dataset.n = 'q_grid'; css(wrap, { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', columnGap: '36px', rowGap: '22px', width: '100%' }); par.insertBefore(wrap, qs[0]); qs.forEach(qq => { wrap.appendChild(qq); css(qq, { flex: '0 0 calc(50% - 18px)', maxWidth: 'calc(50% - 18px)', width: 'auto' }); }); }
    if (dang === 'dn3') qs.forEach(qq => css(qq, { width: '100%', maxWidth: 'none', padding: '14px 24px', borderRadius: '16px', boxShadow: `inset 0 0 0 2px ${SOFT}`, background: '#fff' }));
    // CỠ CHỮ THEO KHUNG (mẫu gốc chữ nhỏ, trống nửa slide)
    const n = qs.length, QF = dang === 'dn2' ? (n <= 4 ? 52 : 40) : dang === 'dn1' && img && vis(img) ? (n <= 4 ? 44 : 36) : (n <= 4 ? 58 : n <= 6 ? 46 : 36);   /* còn ô hình bên phải → chữ nhỏ hơn, không xuống 2 dòng */
    if (tb) tb.querySelectorAll('[data-text]').forEach(t => fz(t, t.dataset.n === 'ruby' ? 22 : 46));
    qs.forEach(qq => { qq.querySelectorAll('[data-text]').forEach(t => { if (!t.closest('[data-n="no_badge2"]')) fz(t, t.dataset.n === 'ruby' ? 22 : QF); });
      const b = q(qq, 'no_badge2'); if (b) { css(b, { width: '64px', height: '64px', minWidth: '64px', flex: '0 0 64px' }); b.querySelectorAll('[data-text], span, div').forEach(t => { t.style.fontSize = '34px'; }); }
      if (dang === 'dn3') css(qq, { padding: '20px 28px' }); });
    const par = qs[0] && (q(rootEl, 'q_grid') || qs[0].parentElement);
    if (par && dang !== 'dn2') css(par, { flex: '1 1 auto', justifyContent: 'space-evenly', height: '100%', alignSelf: 'stretch' });
    if (par && dang === 'dn2') css(par, { flex: '1 1 auto', height: '100%', alignSelf: 'stretch', alignContent: 'center', rowGap: '56px' });
  }
  // ================= ĐỢT 2 (29/10): Bảng chữ · Phát âm · Phản xạ pinyin · Mẫu câu =================
  // BẢNG CHỮ (Grammar Table N): Dạng 1 đầu bảng + cột đầu cam (mẫu "Thanh mẫu 声母") · Dạng 2 mỗi dòng một thẻ, âm trong ô cam · Dạng 3 bảng kẻ sọc xám (mẫu Phản xạ pinyin)
  function tableN(rootEl, data, filled, dang) {
    const rows = [...rootEl.querySelectorAll('[data-n]')].filter(e => /^row_\d+$/.test(e.dataset.n) && vis(e)), tb = q(rootEl, 'table');
    if (dang === 'dn2' && tb) css(tb, { gap: '14px', background: 'transparent' });
    rows.forEach((r, ri) => { const head = ri === 0, cells = [...r.children].filter(c => /_cell$/.test(c.dataset.n || '') && vis(c));
      if (dang === 'dn2') { css(r, head ? { background: 'transparent', boxShadow: 'none' } : { background: '#fff', borderRadius: '16px', boxShadow: `inset 0 0 0 2px ${SOFT}`, overflow: 'hidden' }); }
      cells.forEach((c, ci) => { const t = c.querySelector('[data-text]'), first = ci === 0;
        if (dang === 'dn1' || dang === 'dn3') {
          const bg = head || first ? OR : dang === 'dn3' ? (ri % 2 ? '#FFFFFF' : '#ECECEC') : '#FFFFFF';
          css(c, { background: bg, boxShadow: `inset 0 0 0 1px ${dang === 'dn3' ? '#C9C9C9' : SOFT}`, borderRadius: '0' });
          if (t) css(t, { color: head || first ? '#fff' : INK, fontWeight: head || first ? 800 : 500, textAlign: 'center' }); }
        if (dang === 'dn2') {
          if (head) { css(c, { background: 'transparent', boxShadow: 'none' }); if (t) css(t, { color: OR, fontWeight: 800 }); }
          else if (first) { css(c, { background: OR, borderRadius: '0' }); if (t) css(t, { color: '#fff', fontWeight: 800 }); }
          else { css(c, { background: 'transparent', boxShadow: 'none' }); if (t) css(t, { color: ci === cells.length - 1 ? HRED : INK, fontWeight: ci === cells.length - 1 ? 700 : 500 }); } }
      }); });
    if (dang !== 'dn2') rows.forEach(r => css(r, { background: 'transparent', gap: '0' }));
    if (dang !== 'dn2') rows.forEach(r => [...r.children].filter(c => /_cell$/.test(c.dataset.n || '') && vis(c)).forEach(c => css(c, { display: 'flex', alignItems: 'center', justifyContent: 'center' })));   // chữ giữa ô theo chiều dọc (29/10)
  }
  // PHÁT ÂM: Dạng 1 âm trong khung tròn đỏ + mũi tên giải thích + ô ví dụ viền · Dạng 2 khung lớn kiểu "nǐ 你" + ví dụ ô cam · Dạng 3 ô âm cam + ví dụ dạng viên hồng
  function pron(rootEl, data, filled, dang) {
    const sb = q(rootEl, 'sound_box'), snd = q(rootEl, 'sound'), ipa = q(rootEl, 'ipa'), tip = q(rootEl, 'tip');
    const exs = [...rootEl.querySelectorAll('[data-n]')].filter(e => /^ex_\d+$/.test(e.dataset.n) && vis(e));
    { const ec = exs[0] && exs[0].parentElement; if (ec) { css(ec, { height: 'auto', alignSelf: 'stretch' }); exs[0].style.marginTop = 'auto'; exs[exs.length - 1].style.marginBottom = 'auto'; } }   // cột ví dụ nằm giữa theo chiều dọc
    if (sb) { css(sb, { display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }); if (snd) { css(snd, { textAlign: 'center', width: 'auto' }); const L0 = [...txt(snd).replace(/\s+/g, '')].length; if (L0 > 2) fz(snd, L0 > 4 ? 72 : 110); else if (L0 === 2 && /^[a-zü]+$/i.test(txt(snd).trim())) fz(snd, 140); }   /* 2 chữ cái (ou, zh) không tràn vòng tròn (29/10) */
      const wide = snd && [...txt(snd).replace(/\s+/g, '')].length > 3;   // âm dài ("Biến điệu 不") → ô bo tròn ngang, không phải vòng tròn   // âm nằm giữa ô; âm dài ("不bù") nhỏ lại cho vừa
      if (dang === 'dn1') { css(sb, wide ? { background: '#fff', borderRadius: '40px', boxShadow: `inset 0 0 0 6px ${RED}`, width: 'auto', maxWidth: '100%', height: '220px', padding: '0 88px', boxSizing: 'border-box' } : { background: '#fff', borderRadius: '50%', boxShadow: `inset 0 0 0 6px ${RED}`, width: '300px', height: '300px' }); if (snd) css(snd, { color: RED, whiteSpace: 'nowrap', fontWeight: 800 }); }   /* chữ âm đậm, ô ngang rộng thoáng (người dùng 29/10) */
      if (dang === 'dn2') { css(sb, { background: '#fff', borderRadius: '24px', boxShadow: `inset 0 0 0 4px ${RED}`, width: '360px', height: '300px' }); if (snd) css(snd, { color: HRED }); }
      if (dang === 'dn3') { css(sb, { background: OR, borderRadius: '24px', boxShadow: 'none' }); if (snd) css(snd, { color: '#fff' }); } }
    if (ipa) css(ipa, { color: dang === 'dn2' ? INK : RED, fontWeight: 800 });
    if (tip && dang === 'dn1' && !/^→/.test(txt(tip))) { setT(tip, '→ ' + txt(tip)); css(tip, { color: INK }); }
    exs.forEach(ex => { const w = ex.querySelector('[data-text]');
      if (dang === 'dn1') { css(ex, { background: '#fff', boxShadow: `inset 0 0 0 3px ${SOFT}`, borderRadius: '16px', justifyContent: 'center' }); if (w) css(w, { color: OR, fontWeight: 800, textAlign: 'center' }); }
      if (dang === 'dn2') { css(ex, { background: OR, boxShadow: 'none', borderRadius: '16px', justifyContent: 'center' }); if (w) css(w, { color: '#fff', fontWeight: 800, textAlign: 'center' }); }
      if (dang === 'dn3') { css(ex, { background: PINK, boxShadow: 'none', borderRadius: '999px', justifyContent: 'center' }); if (w) css(w, { color: HRED, fontWeight: 700, textAlign: 'center' }); } });
  }
  // PHẢN XẠ PINYIN (lưới ô): Dạng 1 ô trắng viền, chữ cam (mẫu "Nghe và chọn") · Dạng 2 ô cam chữ trắng · Dạng 3 bảng liền ô, kẻ sọc xám
  function pinyinGrid(rootEl, data, filled, dang) {
    const g = q(rootEl, 'grid'), cs = g ? [...g.children].filter(c => /^c_\d+$/.test(c.dataset.n || '') && vis(c)) : [];
    const nr = Math.ceil(cs.length / 8) || 1, nc = Math.ceil(cs.length / nr) || 1;
    if (g && dang === 'dn3') css(g, { gap: '0', columnGap: '0', rowGap: '0' });
    if (g) { css(g, { flex: '1 1 auto', height: 'auto', maxHeight: 'none' }); g.style.flex = '0 0 auto'; g.style.marginTop = 'auto'; g.style.marginBottom = 'auto'; }   // lưới nằm giữa khung (rà 29/10: dồn trên, trống dưới)   // lưới chiếm hết khung, ô to (mẫu gốc trống nửa dưới)
    const gap = dang === 'dn3' ? 0 : 16, ml = Math.max(2, ...cs.map(c => [...txt(c)].length));
    const FS = Math.min(nr <= 2 ? 72 : nr <= 3 ? 64 : nr <= 4 ? 54 : 44, Math.floor((1700 / nc - gap - 24) / (ml * 0.62)));   // vừa từ dài nhất trong ô
    if (g) css(g, { columnGap: gap + 'px', rowGap: (dang === 'dn3' ? 0 : 22) + 'px', width: '100%', justifyContent: 'center' });
    cs.forEach(c => { css(c, { height: (dang === 'dn3' ? FS * 2 : FS * 2.3) + 'px', minHeight: '0', width: `calc(${100 / nc}% - ${gap * (nc - 1) / nc}px)`, flex: '0 0 auto', maxWidth: 'none', boxSizing: 'border-box' }); c.querySelectorAll('[data-text]').forEach(t => fz(t, t.dataset.n === 'ruby' ? 22 : FS)); });
    cs.forEach((c, i) => { const t = c.querySelector('[data-text]'), row = Math.floor(i / nc);
      if (dang === 'dn1') { css(c, { background: '#fff', boxShadow: `inset 0 0 0 3px ${SOFT}`, borderRadius: '16px' }); if (t) css(t, { color: OR, fontWeight: 700 }); }
      if (dang === 'dn2') { css(c, { background: OR, boxShadow: 'none', borderRadius: '16px' }); if (t) css(t, { color: '#fff', fontWeight: 700 }); }
      if (dang === 'dn3') { css(c, { background: row % 2 ? '#ECECEC' : '#FFFFFF', boxShadow: `inset 0 0 0 1px ${RED}`, borderRadius: '0' }); if (t) css(t, { color: INK, fontWeight: 600 }); } });
  }
  // MẪU CÂU / Ý CHÍNH (Key Point): Dạng 1 nhãn đỏ "◆" + khung nét đứt · Dạng 2 khung hồng chữ đỏ giữa slide · Dạng 3 khung cam chữ trắng
  function keyPoint(rootEl, data, filled, dang) {
    const tt = q(rootEl, 'title'), rb = q(rootEl, 'rule_box'), pt = q(rootEl, 'point');
    if (tt && dang === 'dn1') { if (!/^◆/.test(txt(tt))) setT(tt, '◆ ' + txt(tt)); css(tt, { background: RED, color: '#fff', borderRadius: '999px', padding: '8px 28px', alignSelf: 'flex-start', width: 'auto', maxWidth: '100%' }); }
    if (rb) { if (dang === 'dn1') css(rb, { background: '#FFFDF9', boxShadow: 'none', border: `3px dashed ${OR}`, borderRadius: '18px', boxSizing: 'border-box' });
      if (dang === 'dn2') { css(rb, { background: PINK, boxShadow: 'none', borderRadius: '24px', flex: '1 1 auto', justifyContent: 'center', alignItems: 'center' }); if (pt) css(pt, { color: HRED, fontWeight: 800, textAlign: 'center' }); }
      if (dang === 'dn3') { css(rb, { background: OR, boxShadow: 'none', borderRadius: '24px' }); if (pt) css(pt, { color: '#fff', fontWeight: 700 }); } }
    if (pt && dang === 'dn1') { css(pt, { color: INK }); hanRed(rb); }
  }
  // ================= ĐỢT 3 (29/10): Tổng quan buổi · Các bước hoạt động (Khai giảng / Sửa BTVN…) · Đọc =================
  // TỔNG QUAN BUỔI (Lesson Overview): Dạng 1 khung mục tiêu nét đứt + bước ô viền · Dạng 2 dòng thời gian dọc (mẫu "Mục tiêu khoá học") · Dạng 3 mục tiêu nền hồng + bước 2 cột
  function overview(rootEl, data, filled, dang) {
    const gc = q(rootEl, 'goal_col'), st = q(rootEl, 'steps'), tt = q(rootEl, 'title');
    const steps = st ? [...st.children].filter(e => /^step_\d+$/.test(e.dataset.n || '') && vis(e)) : [];
    steps.forEach(s1 => { const t = q(s1, `${s1.dataset.n}.text`), m = q(s1, `${s1.dataset.n}.min`); if (t && m && txt(m)) setT(t, txt(t).replace(/\s*\d+\s*phút\s*$/i, '')); });   // "Sửa BTVN 10 phút" + "10'" → bỏ lặp
    if (tt) css(tt, { color: RED, fontWeight: 800 });
    if (gc) { if (dang === 'dn1') css(gc, { background: '#FFFDF9', boxShadow: 'none', border: `3px dashed ${OR}`, borderRadius: '18px', boxSizing: 'border-box' });
      if (dang === 'dn2') css(gc, { background: '#fff', boxShadow: `inset 0 0 0 3px ${SOFT}`, borderRadius: '18px' });
      if (dang === 'dn3') css(gc, { background: PINK, boxShadow: 'none', borderRadius: '18px' });
      gc.querySelectorAll('[data-text]').forEach(t => { if (/^cando_\d+$/.test(t.dataset.n || '') || t.closest('[data-n^="cando_"]')) { if (t.dataset.n !== 'ruby') fz(t, 30); css(t, { color: INK }); } }); }
    steps.forEach((s1, i) => { const nb = q(s1, `${s1.dataset.n}.no_box`), no = q(s1, `${s1.dataset.n}.no`), m = q(s1, `${s1.dataset.n}.min`);
      if (dang === 'dn1') { css(s1, { background: '#fff', boxShadow: `inset 0 0 0 2px ${SOFT}`, borderRadius: '14px' }); if (nb) css(nb, { background: OR, borderRadius: '10px', boxShadow: 'none' }); if (no) css(no, { color: '#fff' }); if (m) css(m, { color: RED, fontWeight: 800 }); }
      if (dang === 'dn2') { css(s1, { background: 'transparent', boxShadow: 'none', position: 'relative', zIndex: 1 }); if (nb) css(nb, { background: '#fff', borderRadius: '50%', boxShadow: `inset 0 0 0 4px ${OR}` }); if (no) css(no, { color: OR, fontWeight: 800 }); if (m) css(m, { color: '#fff', background: OR, borderRadius: '999px', padding: '2px 14px' }); }
      if (dang === 'dn3') { css(s1, { background: i % 2 ? '#FFF4EA' : '#fff', boxShadow: `inset 0 0 0 2px ${SOFT}`, borderRadius: '14px' }); if (nb) css(nb, { background: RED, borderRadius: '50%', boxShadow: 'none' }); if (no) css(no, { color: '#fff' }); if (m) css(m, { color: RED, fontWeight: 800 }); } });
    if (dang === 'dn2' && st && steps.length > 1 && !q(st, 'tl_line')) { css(st, { position: 'relative' }); const ln = document.createElement('div'); ln.dataset.n = 'tl_line';
      css(ln, { position: 'absolute', left: '27px', top: '40px', bottom: '40px', width: '4px', background: SOFT, borderRadius: '2px', zIndex: 0 }); st.prepend(ln);
      const fit = () => { const a = q(steps[0], `${steps[0].dataset.n}.no_box`), b = q(steps[steps.length - 1], `${steps[steps.length - 1].dataset.n}.no_box`); if (!a || !b || !st.offsetHeight) return;   // vạch chỉ nối từ số đầu tới số cuối (người dùng 29/10: thừa đuôi)
        const R0 = st.getBoundingClientRect(), A = a.getBoundingClientRect(), B = b.getBoundingClientRect(), k = st.offsetHeight / (R0.height || 1);
        css(ln, { left: Math.round(((A.left + A.width / 2) - R0.left) * k - 2) + 'px', top: Math.round(((A.top + A.height / 2) - R0.top) * k) + 'px', bottom: 'auto', height: Math.max(0, Math.round((B.top - A.top) * k)) + 'px' }); };
      if (typeof requestAnimationFrame === 'function') { requestAnimationFrame(fit); setTimeout(fit, 400); } }
  }
  // CÁC BƯỚC HOẠT ĐỘNG (Activity Steps): Dạng 1 bước ô viền, số tròn cam · Dạng 2 danh sách số không khung · Dạng 3 các bước thành thẻ ngang
  function actSteps(rootEl, data, filled, dang) {
    const gb = q(rootEl, 'goal_box'), gl = q(rootEl, 'goal.label'), sts = q(rootEl, 'steps');
    const items = sts ? [...sts.children].filter(e => /^st_\d+$/.test(e.dataset.n || '') && vis(e)) : [];
    if (gb) css(gb, { background: PINK, boxShadow: 'none', borderRadius: '16px' }); if (gl) css(gl, { color: RED, fontWeight: 800 });
    if (dang === 'dn3' && sts && items.length >= 2 && items.length <= 4) css(sts, { flexDirection: 'row', alignItems: 'stretch', gap: '24px' });
    else if (sts) { css(sts, { flex: '1 1 auto', gap: '22px', height: 'auto' }); if (items.length) { items[0].style.marginTop = 'auto'; items[items.length - 1].style.marginBottom = 'auto'; } }   /* nằm giữa: lề tự động trên / dưới (bước dàn chữ sau đặt lại justify-content) */   // các bước giãn đều giữa khung (rà 29/10: dồn trên, trống dưới)
    items.forEach(it => { const nb = q(it, 'no_box'), no = q(it, 'no'), mb = q(it, 'min_box'), mn = q(it, 'min'), nm = q(it, 'name'), bd = q(it, 'body');
      if (nb) css(nb, { background: dang === 'dn2' ? 'transparent' : OR, borderRadius: dang === 'dn1' ? '50%' : '10px', boxShadow: 'none', width: '64px', height: '64px', minWidth: '64px', flex: '0 0 64px' }); if (no) { css(no, { color: dang === 'dn2' ? OR : '#fff', fontWeight: 800 }); fz(no, dang === 'dn2' ? 44 : 34); }   /* số to hơn (người dùng 29/10) */
      if (mb) css(mb, { background: dang === 'dn2' ? 'transparent' : '#FFF4EA', boxShadow: 'none', borderRadius: '999px' }); if (mn) css(mn, { color: RED, fontWeight: 800 });
      if (nm) css(nm, { color: INK, fontWeight: 800 });
      { const tx = q(it, 'text'); if (tx && dang !== 'dn3') { tx.querySelectorAll('[data-text]').forEach(t => fz(t, t.dataset.n === 'ruby' ? 22 : t.dataset.n === 'base' ? 34 : 30)); if (tx.dataset.text != null) fz(tx, 30);
        const f = tx.firstChild; if (f && f.nodeType === 3) f.nodeValue = f.nodeValue.replace(/^\s*[:：]\s*/, ''); const s0 = tx.querySelector('[data-seg]'); if (s0 && /^\s*[:：]/.test(s0.textContent)) s0.textContent = s0.textContent.replace(/^\s*[:：]\s*/, ''); } }   // mô tả bước ≥ 30px (không để thu còn 22px); bỏ ':' thừa đầu dòng
      if (dang === 'dn1') css(it, { background: '#fff', boxShadow: `inset 0 0 0 2px ${SOFT}`, borderRadius: '16px' });
      if (dang === 'dn2') css(it, { background: 'transparent', boxShadow: 'none' });
      if (dang === 'dn3' && sts && sts.style.flexDirection === 'row') { css(it, { flex: '1 1 0', minWidth: '0', maxWidth: 'none', height: 'auto', flexDirection: 'column', alignItems: 'flex-start', background: '#fff', boxShadow: `inset 0 0 0 3px ${SOFT}`, borderRadius: '20px', padding: '24px', boxSizing: 'border-box', gap: '14px' });
        const hd = q(it, 'head'); if (hd) css(hd, { flexDirection: 'column', alignItems: 'flex-start', width: '100%', maxWidth: 'none', gap: '10px' }); if (bd) css(bd, { width: '100%', maxWidth: 'none' });
        it.querySelectorAll('[data-text]').forEach(t => { if (t.dataset.n === 'ruby') fz(t, 20); else if (t === nm || (nm && nm.contains(t))) fz(t, 42); else if (t === mn) fz(t, 32); else if (t !== no) fz(t, 30); });
        [nm, q(it, 'text')].forEach(t => t && css(t, { whiteSpace: 'normal', width: '100%', maxWidth: 'none' })); } });
  }
  // ĐỌC (Reading): Dạng 1 hình trái + đoạn đọc khung nét đứt (mẫu "Đọc bài sau đây") · Dạng 2 bỏ hình, đoạn đọc to giữa slide · Dạng 3 hình phải, đoạn đọc khung viền
  function reading(rootEl, data, filled, dang) {
    if (dang === 'dn2' && data._find) {   // KHỞI ĐỘNG: TÌM TỪ TRONG BÀI – câu đố to trên đầu, đoạn đọc giữ nguyên, đáp án vào ghi chú
      const [ty, words, nn] = String(data._find).split('|'); const top = q(rootEl, 'topic'), tt = top && top.querySelector('[data-text]'); if (tt) setT(tt, 'Khởi động – tìm từ trong bài');
      const tb0 = q(rootEl, 'tag_box'), tc0 = q(rootEl, 'task_col'), bx0 = q(rootEl, 'text_box');
      if (tb0 && tc0 && bx0) { const qz = cloneText(q(rootEl, 'tag') || tb0, `Hãy tìm ${nn} ${ty} mới trong bài đọc sau!`, 'find.q', filled, { color: '#fff', fontWeight: 800, textAlign: 'center' }); fz(qz, 44);
        const qb = document.createElement('div'); qb.dataset.n = 'find_box'; css(qb, { background: RED, borderRadius: '20px', padding: '18px 32px', alignSelf: 'stretch', display: 'flex', justifyContent: 'center' }); qb.appendChild(qz); tc0.insertBefore(qb, tc0.firstChild); drop(tb0); }
      rootEl.dataset.dnAnswer = `ĐÁP ÁN (tìm ${ty}): ${words}`;
    }
    const mn = q(rootEl, 'main'), tc = q(rootEl, 'task_col'), img = q(rootEl, 'img'), tb = q(rootEl, 'tag_box'), tg = q(rootEl, 'tag'), bx = q(rootEl, 'text_box'), te = bx && q(bx, 'text');   /* đoạn đọc trong khung (q(rootEl,'text') trúng nhãn 阅读 ở đầu slide) */
    if (tb) css(tb, { background: RED, borderRadius: '999px', boxShadow: 'none' }); if (tg) { css(tg, { color: '#fff', fontWeight: 800 }); if (/^reading$/i.test(txt(tg))) setT(tg, 'Đọc bài sau đây'); }
    if (dang === 'dn1' && mn) css(mn, { flexDirection: 'row-reverse' });
    if (dang === 'dn2') { drop(img); if (tc) css(tc, { flex: '1 1 auto', width: '100%', maxWidth: 'none' }); }
    if (bx) { if (dang === 'dn1') css(bx, { background: '#FFFDF9', boxShadow: 'none', border: `3px dashed ${OR}`, borderRadius: '18px', boxSizing: 'border-box' });
      if (dang === 'dn2') css(bx, { background: PINK, boxShadow: 'none', borderRadius: '22px', flex: '1 1 auto' });
      if (dang === 'dn3') css(bx, { background: '#fff', boxShadow: `inset 0 0 0 3px ${SOFT}`, borderRadius: '18px' }); }
    if (te) { css(te, { color: INK }); if (dang === 'dn2') { te.querySelectorAll('[data-text], [data-seg]').forEach(t => fz(t, t.dataset.n === 'ruby' ? 22 : 56)); if (te.dataset.text != null) fz(te, 56); } }
    hanRed(q(rootEl, 'task'));
  }
  // ---------- slide mở phần: thẻ trắng chữ cam ----------
  function section(rootEl) {
    rootEl.querySelectorAll('[data-n="section.title"]').forEach(t => { const b = t.parentElement; css(b, { background: '#ffffff', borderRadius: '20px', border: `4px solid ${OR}` }); css(t, { color: OR }); });
  }
  let SPEC = null;
  function skin(rootEl, data, comp, filled, spec) {
    SPEC = spec || null;
    FILLED = filled || []; const dang = (DANG[comp] || []).some(([id]) => id === (spec || {})._layout) && fits(spec._layout, spec) ? spec._layout : 'dn1';   // chỉ slide hoạt động có cách khác; còn lại luôn bố cục chuẩn
    if (/^Slide\/Section/.test(comp)) return section(rootEl);
    if (comp === 'Slide/Cover') { const lb = q(rootEl, 'lesson_box'), ls = q(rootEl, 'lesson');   // ô "第 24" trên bìa: chữ to, đậm hơn, ô vàng rộng hơn (người dùng 30/10)
      if (lb) css(lb, { padding: '16px 52px', borderRadius: '18px' }); if (ls) { fz(ls, 60); css(ls, { fontWeight: 900, letterSpacing: '0.04em' }); } }
    if (!frame(rootEl, data, comp)) return;
    if ((comp === 'Slide/Dialogue' || comp === 'Slide/Dialogue Long') && dang === 'dn6') dlgReadAloud(rootEl, data, filled);
    else if ((comp === 'Slide/Dialogue' || comp === 'Slide/Dialogue Long') && dang === 'dn7') dlgPickNumber(rootEl, data, filled);
    else if (comp === 'Slide/Dialogue' || comp === 'Slide/Dialogue Long') dialogue(rootEl, data, filled, dang);
    else if (/^Slide\/Vocab Grid/.test(comp) && dang === 'dn3') vocabMatch(rootEl, data, filled);
    else if (/^Slide\/Vocab Grid/.test(comp)) vocabGrid(rootEl, data, filled, dang, comp);
    else if (comp === 'Slide/Vocab Card' && dang === 'dn2') vocabMakeSentence(rootEl, data, filled);
    else if (comp === 'Slide/Vocab Card') vocabCard(rootEl, data, filled, dang);
    else if (comp === 'Slide/Grammar Formula' && q(rootEl, 'f_1')) formulaRows(rootEl, data, filled, dang);
    else if (/^Slide\/Grammar (Rule|Rule Split|Usage|Formula)$/.test(comp)) grammar(rootEl, data, filled, dang);
    else if (/^Slide\/Exercise MC( Duo| Long)?$/.test(comp)) choices(rootEl, data, filled, dang);
    else if (comp === 'Slide/Listening') listening(rootEl, data, filled, dang);
    else if (comp === 'Slide/Grammar Table N') tableN(rootEl, data, filled, dang);
    else if (comp === 'Slide/Pronunciation') pron(rootEl, data, filled, dang);
    else if (comp === 'Slide/Pinyin Grid') pinyinGrid(rootEl, data, filled, dang);
    else if (comp === 'Slide/Key Point') keyPoint(rootEl, data, filled, dang);
    else if (comp === 'Slide/Lesson Overview') overview(rootEl, data, filled, dang);
    else if (comp === 'Slide/Activity Steps') actSteps(rootEl, data, filled, dang);
    else if (comp === 'Slide/Reading') reading(rootEl, data, filled, dang);
  }
  // CÁC DẠNG TRÌNH BÀY (người dùng 29/10: mỗi loại slide chọn Dạng 1 / 2 / 3 trong tab Bố cục) – layouts.js đọc danh sách này khi brand là Đắc Nhân
  // CÁCH TRIỂN KHAI HOẠT ĐỘNG (người dùng chốt 29/10): mỗi loại slide chỉ MỘT bố cục đẹp nhất; lựa chọn chỉ có ở slide hoạt động = cách dạy khác nhau (HOAT-DONG.md)
  const DANG = {
    'Slide/Dialogue': [['dn1', 'Đóng vai và dịch hội thoại'], ['dn3', 'Sắp xếp thành đoạn hội thoại'], ['dn4', 'Hoàn thành đoạn hội thoại'], ['dn5', 'Xây dựng hội thoại theo gợi ý'], ['dn6', 'Đọc to cùng Lǎoshī'], ['dn7', 'Chọn số và trả lời câu hỏi']],
    'Slide/Vocab Card': [['dn1', 'Đọc câu ví dụ'], ['dn2', 'Đặt câu với từ cho sẵn']],
    'Slide/Exercise MC': [['dn1', 'Chọn đáp án đúng'], ['dn6', 'Dịch câu sang tiếng Trung']],
    'Slide/Reading': [['dn1', 'Đọc bài'], ['dn2', 'Khởi động: tìm từ trong bài']],
    'Slide/Vocab Grid 4': [['dn1', 'Đọc và đoán nghĩa'], ['dn2', 'Học theo flashcard'], ['dn3', 'Nối từ với nghĩa']],
    'Slide/Vocab Grid 6': [['dn1', 'Đọc và đoán nghĩa'], ['dn2', 'Học theo flashcard'], ['dn3', 'Nối từ với nghĩa']],
    'Slide/Vocab Grid 8': [['dn1', 'Đọc và đoán nghĩa'], ['dn2', 'Học theo flashcard'], ['dn3', 'Nối từ với nghĩa']]
  };
  DANG['Slide/Dialogue Long'] = DANG['Slide/Dialogue'];
  // cách triển khai chỉ hiện khi hợp nội dung: "Dịch câu" chỉ cho câu hỏi có câu tiếng Việt trong ngoặc kép
  const fits = (id, spec) => { if (id === 'dn2' && /Reading/.test((spec && (spec._from || spec.comp)) || '')) return !!((spec && spec.data) || {})._find; if (id === 'dn7') return Object.entries((spec && spec.data) || {}).some(([k, v]) => /^line_\d+\.de$/.test(k) && /[？?]/.test(String(v || ''))); if (id !== 'dn6' || !/Exercise MC/.test((spec && (spec._from || spec.comp)) || '')) return true; const d = (spec && spec.data) || {}; return Object.entries(d).some(([k, v]) => /^question(_\d+)?$/.test(k) && /[“"][^”"]*[a-zà-ỹ][^”"]*[”"]/i.test(String(v || '')) && !/[\u3400-\u9fff]/.test(String(v || ''))); };
  skin.variants = (comp, spec) => (DANG[comp] || []).filter(([id]) => fits(id, spec)).map(([id, l]) => ({ id, label: l, css: () => {} }));
  skin.ownsLayout = true;   // Đắc Nhân: không dùng các bố cục chung (đổi khung / đổi mẫu) – một bố cục cố định
  root.PLS_SKIN = Object.assign(root.PLS_SKIN || {}, { 'Đắc Nhân': skin });
})(typeof window !== 'undefined' ? window : globalThis);
