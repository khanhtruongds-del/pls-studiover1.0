// Chế độ SÁCH trong giao diện: chọn "Sách A4 / Sách 19×27" → dựng trang từ Excel của buổi đang chọn, xem từng trang, "Xuất PDF" (in → Lưu PDF).
(function (root) {
  const P = root.PLS, I = P && P._int, E = root.PLS_ENGINE, B = root.PLS_BOOK; if (!I || !B) return;
  const S = I.state, $ = q => document.querySelector(q);
  S.view = 'slide'; { const v = $('#view'); if (v) v.value = 'slide'; }   // option đầu giờ là "Nghiên cứu" → mặc định vẫn mở Slide
  let book = null;
  const COVERS_ONLY = false;   // người dùng 28/10: hiện đủ cả cuốn; ô chọn bìa chỉ đặt ngay trên bìa trước / bìa sau
  // NỘI DUNG SỬA TAY của trang mở đầu / kết thúc: lưu trên máy theo brand + bài + buổi
  const LK = 'pls.bookLetters';
  const lkey = kind => [S.brand, (S.spec && S.spec.lesson) || '', +($('#buoi') && $('#buoi').value) || 1, kind].join('|');
  const lstore = () => { try { return JSON.parse(localStorage.getItem(LK)) || {}; } catch (e) { return {}; } };
  const letterTxt = kind => lstore()[lkey(kind)] || null;
  function saveLetter(kind, field, val) { const all = lstore(), k = lkey(kind); all[k] = Object.assign({}, all[k] || {}, { [field]: val }); try { localStorage.setItem(LK, JSON.stringify(all)); } catch (e) {} }
  // CHỌN MẪU BÌA (người dùng 28/10): bìa trước + bìa sau theo thương hiệu, nhớ trên máy theo brand
  const CK = 'pls.bookCover';
  function coverPick() { const C = (root.PLS_COVERS || {})[S.brand] || { front: [], back: [] }; let v = {}; try { v = (JSON.parse(localStorage.getItem(CK)) || {})[S.brand] || {}; } catch (e) {}
    const front = v.front || (C.front[0] ? C.front[0].id : 'tpl'); const fr = C.front.find(x => x.id === front);
    return { front, back: v.back || (fr && fr.back) || 'tpl' }; }
  function setCover(part, id) { let all = {}; try { all = JSON.parse(localStorage.getItem(CK)) || {}; } catch (e) {} const cur = coverPick(); const v = Object.assign({}, all[S.brand] || {}, { [part]: id });
    if (part === 'front') { const C = (root.PLS_COVERS || {})[S.brand] || { front: [] }; const fr = C.front.find(x => x.id === id); const curFr = C.front.find(x => x.id === cur.front);
      if (fr && fr.back && (!all[S.brand] || !all[S.brand].back || (curFr && all[S.brand].back === curFr.back))) v.back = fr.back; }   // bìa trước có bìa sau đi cặp → tự đổi theo (trừ khi đã chọn tay bìa sau khác)
    all[S.brand] = v; try { localStorage.setItem(CK, JSON.stringify(all)); } catch (e) {} build(); }
  function coverBar(box, only) {
    const C = (root.PLS_COVERS || {})[S.brand] || { front: [], back: [] }, cur = coverPick();
    const bar = document.createElement('div'); bar.className = 'cover-bar';
    const row = (part, title, list) => { const r = document.createElement('div'); r.className = 'cover-row'; const h = document.createElement('div'); h.className = 'cover-h'; h.textContent = title; r.appendChild(h);
      const strip = document.createElement('div'); strip.className = 'cover-strip';
      [{ id: 'tpl', label: part === 'front' ? 'Mẫu chữ (tên bài)' : 'Mẫu chuẩn (liên hệ)' }].concat(list).forEach(x => { const b = document.createElement('button'); b.type = 'button'; b.className = 'cover-opt' + (cur[part] === x.id ? ' on' : ''); b.title = x.label; b.setAttribute('aria-pressed', String(cur[part] === x.id));
        b.innerHTML = x.id === 'tpl' ? `<span class="tpl">Aa</span><span class="cap">${x.label}</span>` : `<img alt="" loading="lazy" src="covers/${x.id}_t.jpg"><span class="cap">${x.label}</span>`;
        b.onclick = () => setCover(part, x.id); strip.appendChild(b); });
      r.appendChild(strip); return r; };
    if (!only || only === 'front') bar.appendChild(row('front', 'Bìa trước', C.front)); if (!only || only === 'back') bar.appendChild(row('back', 'Bìa sau', C.back));
    if (!document.getElementById('coverBarCss')) { const cs = document.createElement('style'); cs.id = 'coverBarCss';
      cs.textContent = '.cover-bar{background:var(--ui-bg,#fbf8f2);padding:8px 0 10px;margin-bottom:14px;border-bottom:1px solid var(--ui-line,#e7e0d2)}.cover-row{display:flex;gap:10px;align-items:center;margin:4px 0}.cover-h{flex:0 0 70px;font-size:12px;font-weight:600}.cover-strip{display:flex;gap:8px;overflow-x:auto;padding:4px 2px}.cover-opt{flex:0 0 auto;width:64px;padding:0;border:2px solid transparent;border-radius:6px;background:none;cursor:pointer;text-align:center}.cover-opt img,.cover-opt .tpl{display:block;width:60px;height:85px;object-fit:cover;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,.18)}.cover-opt .tpl{display:flex;align-items:center;justify-content:center;background:#fff;font-weight:700;color:#666}.cover-opt .cap{display:block;font-size:9px;line-height:1.2;margin-top:3px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:var(--ui-ink,#333)}.cover-opt.on{border-color:#7c5cd6}';
      document.head.appendChild(cs); }
    box.appendChild(bar);
  }
  function resetLetter(kind) { const all = lstore(); delete all[lkey(kind)]; try { localStorage.setItem(LK, JSON.stringify(all)); } catch (e) {} }
  function stage() { let st = $('#bookStage'); if (!st) { st = document.createElement('div'); st.id = 'bookStage'; document.body.appendChild(st); } st.innerHTML = ''; return st; }
  // FONT GOOGLE: chờ tải xong đủ font + độ đậm của brand rồi mới dàn trang / in PDF.
  // Chưa tải xong mà đã đo → ngắt trang theo font dự phòng (sai chỗ xuống trang); in sớm → PDF dùng font dự phòng, mất phân cấp độ đậm.
  async function ensureFonts(brand) {
    if (!document.fonts || !document.fonts.load) return { ok: true, miss: [] };
    const fams = new Set(B.bookFamilies ? B.bookFamilies(brand) : []);   // sách chỉ dùng MỘT họ font (Noto) – xem book.js
    const SAMPLE = { 'Noto Sans JP': 'あ漢字', 'Noto Sans KR': '한국어', 'Noto Sans SC': '汉字', 'LXGW WenKai': '汉字' };
    const jobs = []; fams.forEach(f => ['400', '500', '600', '700'].forEach(w => jobs.push(document.fonts.load(`${w} 16px "${f}"`, SAMPLE[f] || 'Aa Ăă Ơơ Ưư ə ʌ ŋ').then(r => r.length ? null : `${f} ${w}`).catch(() => `${f} ${w}`))));
    const miss = (await Promise.race([Promise.all(jobs), new Promise(r => setTimeout(() => r(['hết giờ chờ font']), 6000))])).filter(Boolean);
    await document.fonts.ready;
    S.fontMiss = [...fams].filter(f => !document.fonts.check(`400 16px "${f}"`));
    return { ok: !S.fontMiss.length, fams: [...fams], miss: S.fontMiss };
  }
  // dựng sách (chưa vẽ ra màn hình) cho buổi đang chọn
  async function makeBook(size) {
    await ensureFonts(S.brand);
    if (!S.book || !S.book.s6) return null;
    const buoi = +($('#buoi') && $('#buoi').value) || 1;
    let list = B.blocks(S.book, buoi, S.brand);
    if (S.aud === 'student') { const k = list.findIndex(b => /Section/.test(b.comp || '') && b.data && (b.data.title === 'Đáp án' || b.data.text === 'Đáp án')); if (k >= 0) list = list.slice(0, k); }   // bản học viên: bỏ phần Đáp án cuối sách
    // chữ chạy đầu trang: tên khoá ngắn · BÀI n (một dòng) thay cho "khoá · tên buổi" dài 2 dòng
    const m0 = B.meta ? B.meta(S.book, buoi) : null, short0 = m0 && (m0.course || '').split(/\s+[–-]\s+|\s*\(/)[0];
    const running = (m0 ? `${m0.label} – ${String(m0.title).replace(/^Bài\s*\d+\s*[–-]\s*/i, '')}` : ((S.spec && S.spec.lesson) || '')).toUpperCase();   // người dùng 28/10: chữ chạy đầu trang chỉ ghi tên bài
    const st = stage();
    // BÌA + LỜI DẪN (người dùng 28/10): bìa trước · trang mở đầu (trang 1) · nội dung (từ trang 2) · trang kết thúc · bìa sau
    const m = B.meta ? B.meta(S.book, buoi) : null, X = B.extraPage && m ? (kind, n) => B.extraPage(kind, { size, brand: S.brand, stage: st, running, meta: m, n, txt: letterTxt(kind) }) : () => null;
    const cp = coverPick();
    const XC = (kind, pick) => B.extraPage && m ? B.extraPage(kind, { size, brand: S.brand, stage: st, running, meta: m, pick }) : null;
    // bìa trước + lời mở đầu: chỉ buổi đầu khoá · lời dặn dò: mọi buổi có cột Dặn dò (S5) · lời cảm ơn + bìa sau: chỉ buổi cuối khoá (người dùng 28/10)
    const cover = m && m.isFirst ? XC('cover', cp.front) : null, intro = m && m.isFirst ? X('intro', 1) : null;
    const bk = B.paginate(list, { size, brand: S.brand, stage: st, running, prep: null, first: intro ? 2 : 1 });   // sách in ra PDF: Chrome nhúng font web vào PDF → giữ đủ độ đậm (font an toàn của PPTX chỉ có thường / đậm)
    let nx = (intro ? 2 : 1) + bk.pages.length;
    const outro = m && (m.dando || letterTxt('outro')) ? X('outro', nx++) : null;
    const thanks = m && m.isLast ? X('thanks', nx++) : null, back = m && m.isLast ? XC('back', cp.back) : null;
    bk.pages = [cover, intro, ...bk.pages, outro, thanks, back].filter(Boolean);
    // TẠM ẨN NỘI DUNG (người dùng 28/10): chế độ sách chỉ hiện + in bìa trước và bìa sau; đổi COVERS_ONLY = false để hiện lại cả cuốn
    if (COVERS_ONLY) bk.pages.filter(pg => pg.kind !== 'cover' && pg.kind !== 'back').forEach(pg => pg.host.remove()), bk.pages = bk.pages.filter(pg => pg.kind === 'cover' || pg.kind === 'back');
    bk.blocks = list.length; return bk;
  }
  // tên file PDF theo cùng mẫu tên PPTX (RB-CH-02) + khổ sách; Chrome lấy tiêu đề trang làm tên file khi "Lưu dưới dạng PDF"
  function pdfName(size) {
    const base = window.PLS_STD && I.stdCtx ? window.PLS_STD.fileName(I.stdCtx(), 'pdf').replace(/\.pdf$/i, '') : 'sach';
    return `${base}_Sach${size === '19x27' ? '19x27' : 'A4'}${S.aud === 'student' ? '_HocVien' : ''}`;
  }
  function printBook(bk, size) {
    let pr = $('#printRoot'); if (!pr) { pr = document.createElement('div'); pr.id = 'printRoot'; document.body.appendChild(pr); }
    pr.innerHTML = ''; bk.pages.forEach(pg => pr.appendChild(pg.host.cloneNode(true)));
    const t0 = document.title; document.title = pdfName(size);
    try { B.print(size); } finally { document.title = t0; }
  }
  async function build() {
    const box = $('#bookView'); box.innerHTML = '';
    book = await makeBook(S.view);
    if (!book) { box.innerHTML = '<p class="muted">Nhập Excel (S5 + S6) để dựng sách cho buổi đang chọn.</p>'; return null; }
    draw(); if (S.fontMiss && S.fontMiss.length) $('#selMeta').textContent = `Chưa tải được font: ${S.fontMiss.join(', ')} – kiểm tra mạng rồi bấm Dựng lại (PDF sẽ dùng font dự phòng)`; return book;
  }
  function draw() {
    const box = $('#bookView'); box.innerHTML = ''; if (!book) return;
    $('#selTitle').textContent = COVERS_ONLY ? `Sách ${B.SIZES[S.view].label} · bìa trước + bìa sau` : `Sách ${B.SIZES[S.view].label} · ${book.pages.length} trang`;
    $('#selMeta').textContent = COVERS_ONLY ? 'Phần nội dung sách đang tạm ẩn' : book.warns.length ? book.warns.join(' · ') : `${book.blocks} khối · không có khối cao hơn trang`;
    const W = Math.min(box.clientWidth - 24 || 700, 760);
    book.pages.forEach(pg => { if (pg.kind === 'cover') coverBar(box, 'front'); if (pg.kind === 'back') coverBar(box, 'back'); const w = parseFloat(pg.host.style.width), h = parseFloat(pg.host.style.height), k = W / w;
      const wrap = document.createElement('div'); wrap.className = 'book-page'; wrap.style.width = W + 'px'; wrap.style.height = Math.round(h * k) + 'px';
      const c = pg.host.cloneNode(true); c.style.transform = `scale(${k})`; wrap.appendChild(c);
      const lb = document.createElement('div'); lb.className = 'muted'; lb.style.cssText = 'text-align:center;margin:-14px 0 18px;font-size:12px';
      lb.textContent = { cover: 'Bìa trước', back: 'Bìa sau', intro: 'Trang ' + pg.n + ' · Mở đầu – bấm vào chữ để sửa', outro: 'Trang ' + pg.n + ' · Kết thúc – bấm vào chữ để sửa' }[pg.kind] || 'Trang ' + pg.n;
      if (pg.kind === 'intro' || pg.kind === 'outro' || pg.kind === 'thanks') {   // chỉ hai trang lời dẫn được sửa; sửa trên bản xem → ghi vào trang gốc (bản in) + lưu máy
        c.querySelectorAll('[data-field]').forEach(e => { e.contentEditable = 'plaintext-only'; if (e.contentEditable !== 'plaintext-only') e.contentEditable = 'true'; e.spellcheck = false;
          e.oninput = () => { const v = e.innerText.replace(/\n$/, ''); const o = pg.host.querySelector(`[data-field="${e.dataset.field}"]`); if (o) o.textContent = v; saveLetter(pg.kind, e.dataset.field, v); }; });
        const rs = document.createElement('button'); rs.type = 'button'; rs.className = 'btn'; rs.textContent = 'Khôi phục nội dung từ file'; rs.style.cssText = 'margin-left:8px;font-size:12px;padding:2px 8px';
        rs.onclick = () => { resetLetter(pg.kind); build(); }; lb.appendChild(rs); }
      box.append(wrap, lb); });
  }
  async function exportPdf() {
    if (!book) await build(); if (!book) return false;
    await ensureFonts(S.brand);   // in khi font đã sẵn sàng → PDF nhúng đúng font brand
    printBook(book, S.view); return true;
  }
  // XUẤT CẢ BÀI (người dùng chốt 23/10): 1 lần bấm → tải PPTX, rồi mở hộp thoại in sách đã đặt sẵn tên file + khổ giấy → chọn "Lưu dưới dạng PDF" → Lưu.
  // Khổ sách: đang xem sách thì theo khổ đang xem, đang xem slide thì A4.
  async function exportAll() {
    const say = t => (I.setStatus ? I.setStatus(t) : null);
    const size = B.SIZES[S.view] ? S.view : 'A4';
    let pp = null;
    try { say('Đang xuất PPTX…'); pp = await P.exportPptx(); } catch (e) { say('Xuất PPTX lỗi: ' + e.message); return { pptx: null, pdf: false, error: e.message }; }
    if (!B.SIZES[S.view]) return { pptx: pp, pdf: false };   // người dùng 25/10: đang ở tab Slide → "Xuất bài" chỉ tải PPTX về máy, không mở hộp thoại in sách
    const bk = await makeBook(size);
    if (!bk) { say(`Đã tải ${pp && pp.name || 'PPTX'} · chưa có Excel S5 + S6 nên chưa dựng được sách PDF`); return { pptx: pp, pdf: false }; }
    say(`Đã tải ${pp && pp.name || 'PPTX'} · hộp thoại in sách ${B.SIZES[size].label} (${bk.pages.length} trang): chọn "Lưu dưới dạng PDF" rồi bấm Lưu`);
    printBook(bk, size); return { pptx: pp, pdf: pdfName(size) + '.pdf', pages: bk.pages.length };
  }
  { const b = document.createElement('button'); b.id = 'btnAll'; b.type = 'button'; b.className = 'btn primary'; b.textContent = 'Xuất bài';
    b.title = 'Tải PPTX rồi mở hộp thoại in sách (chọn Lưu dưới dạng PDF). Đang xem sách thì in theo khổ đang xem, đang xem slide thì in A4.';
    const anchor = document.querySelector('.menuwrap') || $('#btnPdf'); if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(b, anchor.nextSibling); b.onclick = () => exportAll();
    // CHỌN BẢN XUẤT (đặc tả §31.2): Giáo viên = có đáp án, ghi chú giảng, hiệu ứng khoanh đáp án · Học viên = bỏ hẳn đáp án, slide đáp án, ghi chú, phần Đáp án cuối sách
    const a = document.createElement('select'); a.id = 'aud'; a.setAttribute('aria-label', 'Bản xuất'); a.title = 'Bản giáo viên: có đáp án + ghi chú giảng. Bản học viên: không có đáp án, không ghi chú.';
    a.add(new Option('Giáo viên', 'teacher')); a.add(new Option('Học viên', 'student')); a.value = S.aud || 'teacher';
    a.onchange = () => { S.aud = a.value; b.textContent = S.aud === 'student' ? 'Xuất bản HV' : 'Xuất bài'; b.title = (S.aud === 'student' ? 'Bản học viên – không đáp án, không ghi chú. ' : 'Bản giáo viên – có đáp án, ghi chú giảng. ') + 'Tải PPTX rồi mở hộp thoại in sách (Lưu dưới dạng PDF).'; if (B.SIZES[S.view]) build(); };
    b.parentNode.insertBefore(a, b); }
  function setView(v) {
    S.view = v; const rs = v === 'research', bk = !!B.SIZES[v];
    document.body.classList.toggle('research', rs);   // tab NGHIÊN CỨU (người dùng chốt 23/10): che slide/sách, hiện #researchView – xem research.js
    if (rs) { if ($('#view').value !== v) $('#view').value = v; if (S.segSync) S.segSync(); if (root.PLS_RESEARCH) root.PLS_RESEARCH.show(); return Promise.resolve(); }
    $('#canvas').hidden = bk; $('#bookView').hidden = !bk; { const nb = $('#notesBox'); if (nb) nb.hidden = bk; } document.querySelector('nav').style.display = bk ? 'none' : '';
    $('#btnPdf').hidden = !bk; const mw = document.querySelector('.menuwrap'); if (mw) mw.style.display = bk ? 'none' : '';
    if ($('#view').value !== v) $('#view').value = v; if (S.segSync) S.segSync();
    if (document.body.classList.contains('empty') && I.showEmpty) { I.showEmpty(); return Promise.resolve(); }   // chưa có bài → trang giới thiệu riêng của tab Slide / Sách
    if (bk) return build(); else return I.build();
  }
  $('#view').onchange = () => setView($('#view').value);
  // CHẾ ĐỘ XEM dạng thanh trượt (segmented) thay cho dropdown: Nghiên cứu · Slide · Sách A4 · Sách 19×27 (người dùng chốt 23/10)
  { const sel = $('#view'), seg = document.createElement('div'); seg.className = 'seg'; seg.setAttribute('role', 'radiogroup'); seg.setAttribute('aria-label', 'Chế độ xem');
    const thumb = document.createElement('span'); thumb.className = 'seg-thumb'; seg.appendChild(thumb);
    const sync = () => { const bs = [...seg.querySelectorAll('button')]; const cv = /^(A4|19x27)$/.test(sel.value) ? 'A4' : sel.value; bs.forEach(b => b.setAttribute('aria-checked', String(b.dataset.v === cv)));
      const on = bs.find(b => b.dataset.v === cv); if (S.szSync) S.szSync(); if (on) { thumb.style.width = on.offsetWidth + 'px'; thumb.style.transform = `translateX(${on.offsetLeft - 3}px)`; } };
    [...sel.options].filter(o => o.value !== '19x27').forEach(o => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.dataset.v = o.value; b.textContent = o.value === 'A4' ? 'Sách' : o.textContent;
      b.onclick = () => { const v = o.value === 'A4' ? (S.bookSize || 'A4') : o.value; sel.value = v; sync(); setView(v); }; seg.appendChild(b); });
    { const sz = document.createElement('div'); sz.className = 'seg seg-sz'; sz.setAttribute('role', 'radiogroup'); sz.setAttribute('aria-label', 'Khổ sách'); sz.title = 'Chọn khổ sách';
      [['A4', 'Khổ A4'], ['19x27', 'Khổ 19×27']].forEach(([v, t]) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.dataset.v = v; b.textContent = t; b.onclick = () => { S.bookSize = v; sel.value = v; sync(); setView(v); }; sz.appendChild(b); });
      const cs = document.createElement('style'); cs.textContent = '.seg-sz{margin-left:8px}.seg-sz[hidden]{display:none!important}.seg-sz button[aria-checked="true"]{background:var(--ui-ink);color:var(--ui-bg);border-radius:999px}'; document.head.appendChild(cs);
      S.szEl = sz; S.szSync = () => { const on = /^(A4|19x27)$/.test(sel.value); sz.hidden = !on; if (on) S.bookSize = sel.value; sz.querySelectorAll('button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.v === sel.value))); }; }
    sel.hidden = true; sel.after(seg); if (S.szEl) seg.after(S.szEl); requestAnimationFrame(sync); if (window.ResizeObserver) new ResizeObserver(sync).observe(seg); else window.addEventListener('resize', sync); S.segSync = sync; }   // thanh trượt hiện ra (hết màn hình bắt đầu) → đo lại vị trí
  $('#btnPdf').onclick = () => exportPdf();
  // đang ở tab Sách mà nhập Excel (trang giới thiệu → có bài) → dựng sách luôn
  { let was = document.body.classList.contains('empty'); new MutationObserver(() => { const now = document.body.classList.contains('empty'); if (was && !now && B.SIZES[S.view]) setTimeout(build, 0); was = now; }).observe(document.body, { attributes: true, attributeFilter: ['class'] }); }
  // dựng lại sách khi đổi buổi / brand / font trong chế độ sách
  ['#buoi', '#brand', '#fontMode', '#device'].forEach(q => { const el = $(q); if (el) el.addEventListener('change', () => { if (B.SIZES[S.view]) setTimeout(build, 600); }); });
  Object.assign(P, { exportAll, async book(size) { await setView(size || 'A4'); return book ? { pages: book.pages.length, blocks: book.blocks, warns: book.warns } : 'Chưa có Excel'; }, exportPdf, view: setView, _book: () => book, fonts: () => ensureFonts(S.brand) });
})(typeof window !== 'undefined' ? window : globalThis);
