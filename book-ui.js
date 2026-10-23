// Chế độ SÁCH trong giao diện: chọn "Sách A4 / Sách 19×27" → dựng trang từ Excel của buổi đang chọn, xem từng trang, "Xuất PDF" (in → Lưu PDF).
(function (root) {
  const P = root.PLS, I = P && P._int, E = root.PLS_ENGINE, B = root.PLS_BOOK; if (!I || !B) return;
  const S = I.state, $ = q => document.querySelector(q);
  S.view = 'slide'; { const v = $('#view'); if (v) v.value = 'slide'; }   // option đầu giờ là "Nghiên cứu" → mặc định vẫn mở Slide
  let book = null;
  function stage() { let st = $('#bookStage'); if (!st) { st = document.createElement('div'); st.id = 'bookStage'; document.body.appendChild(st); } st.innerHTML = ''; return st; }
  // FONT GOOGLE: chờ tải xong đủ font + độ đậm của brand rồi mới dàn trang / in PDF.
  // Chưa tải xong mà đã đo → ngắt trang theo font dự phòng (sai chỗ xuống trang); in sớm → PDF dùng font dự phòng, mất phân cấp độ đậm.
  async function ensureFonts(brand) {
    if (!document.fonts || !document.fonts.load) return { ok: true, miss: [] };
    const fams = new Set(B.bookFamilies ? B.bookFamilies(brand) : []);   // sách chỉ dùng MỘT họ font (Noto) – xem book.js
    const SAMPLE = { 'Noto Sans JP': 'あ漢字', 'Noto Sans KR': '한국어', 'Noto Sans SC': '汉字' };
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
    const list = B.blocks(S.book, buoi, S.brand);
    const running = ((S.spec && S.spec.lesson) || '').toUpperCase();
    const bk = B.paginate(list, { size, brand: S.brand, stage: stage(), running, prep: null });   // sách in ra PDF: Chrome nhúng font web vào PDF → giữ đủ độ đậm (font an toàn của PPTX chỉ có thường / đậm)
    bk.blocks = list.length; return bk;
  }
  // tên file PDF theo cùng mẫu tên PPTX (RB-CH-02) + khổ sách; Chrome lấy tiêu đề trang làm tên file khi "Lưu dưới dạng PDF"
  function pdfName(size) {
    const base = window.PLS_STD && I.stdCtx ? window.PLS_STD.fileName(I.stdCtx(), 'pdf').replace(/\.pdf$/i, '') : 'sach';
    return `${base}_Sach${size === '19x27' ? '19x27' : 'A4'}`;
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
    $('#selTitle').textContent = `Sách ${B.SIZES[S.view].label} · ${book.pages.length} trang`;
    $('#selMeta').textContent = book.warns.length ? book.warns.join(' · ') : `${book.blocks} khối · không có khối cao hơn trang`;
    const W = Math.min(box.clientWidth - 24 || 700, 760);
    book.pages.forEach(pg => { const w = parseFloat(pg.host.style.width), h = parseFloat(pg.host.style.height), k = W / w;
      const wrap = document.createElement('div'); wrap.className = 'book-page'; wrap.style.width = W + 'px'; wrap.style.height = Math.round(h * k) + 'px';
      const c = pg.host.cloneNode(true); c.style.transform = `scale(${k})`; wrap.appendChild(c);
      const lb = document.createElement('div'); lb.className = 'muted'; lb.style.cssText = 'text-align:center;margin:-14px 0 18px;font-size:12px'; lb.textContent = 'Trang ' + pg.n;
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
    const bk = await makeBook(size);
    if (!bk) { say(`Đã tải ${pp && pp.name || 'PPTX'} · chưa có Excel S5 + S6 nên chưa dựng được sách PDF`); return { pptx: pp, pdf: false }; }
    say(`Đã tải ${pp && pp.name || 'PPTX'} · hộp thoại in sách ${B.SIZES[size].label} (${bk.pages.length} trang): chọn "Lưu dưới dạng PDF" rồi bấm Lưu`);
    printBook(bk, size); return { pptx: pp, pdf: pdfName(size) + '.pdf', pages: bk.pages.length };
  }
  { const b = document.createElement('button'); b.id = 'btnAll'; b.type = 'button'; b.className = 'btn primary'; b.textContent = 'Xuất bài (PPTX + PDF)';
    b.title = 'Tải PPTX rồi mở hộp thoại in sách (chọn Lưu dưới dạng PDF). Đang xem sách thì in theo khổ đang xem, đang xem slide thì in A4.';
    const anchor = document.querySelector('.menuwrap') || $('#btnPdf'); if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(b, anchor.nextSibling); b.onclick = () => exportAll(); }
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
    const sync = () => { const bs = [...seg.querySelectorAll('button')]; bs.forEach(b => b.setAttribute('aria-checked', String(b.dataset.v === sel.value)));
      const on = bs.find(b => b.dataset.v === sel.value); if (on) { thumb.style.width = on.offsetWidth + 'px'; thumb.style.transform = `translateX(${on.offsetLeft - 3}px)`; } };
    [...sel.options].forEach(o => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.dataset.v = o.value; b.textContent = o.textContent;
      b.onclick = () => { sel.value = o.value; sync(); setView(o.value); }; seg.appendChild(b); });
    sel.hidden = true; sel.after(seg); requestAnimationFrame(sync); if (window.ResizeObserver) new ResizeObserver(sync).observe(seg); else window.addEventListener('resize', sync); S.segSync = sync; }   // thanh trượt hiện ra (hết màn hình bắt đầu) → đo lại vị trí
  $('#btnPdf').onclick = () => exportPdf();
  // đang ở tab Sách mà nhập Excel (trang giới thiệu → có bài) → dựng sách luôn
  { let was = document.body.classList.contains('empty'); new MutationObserver(() => { const now = document.body.classList.contains('empty'); if (was && !now && B.SIZES[S.view]) setTimeout(build, 0); was = now; }).observe(document.body, { attributes: true, attributeFilter: ['class'] }); }
  // dựng lại sách khi đổi buổi / brand / font trong chế độ sách
  ['#buoi', '#brand', '#fontMode', '#device'].forEach(q => { const el = $(q); if (el) el.addEventListener('change', () => { if (B.SIZES[S.view]) setTimeout(build, 600); }); });
  Object.assign(P, { exportAll, async book(size) { await setView(size || 'A4'); return book ? { pages: book.pages.length, blocks: book.blocks, warns: book.warns } : 'Chưa có Excel'; }, exportPdf, view: setView, _book: () => book, fonts: () => ensureFonts(S.brand) });
})(typeof window !== 'undefined' ? window : globalThis);
