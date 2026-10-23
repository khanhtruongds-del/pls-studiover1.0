// Chế độ SÁCH trong giao diện: chọn "Sách A4 / Sách 19×27" → dựng trang từ Excel của buổi đang chọn, xem từng trang, "Xuất PDF" (in → Lưu PDF).
(function (root) {
  const P = root.PLS, I = P && P._int, E = root.PLS_ENGINE, B = root.PLS_BOOK; if (!I || !B) return;
  const S = I.state, $ = q => document.querySelector(q);
  S.view = 'slide';
  let book = null;
  function stage() { let st = $('#bookStage'); if (!st) { st = document.createElement('div'); st.id = 'bookStage'; document.body.appendChild(st); } st.innerHTML = ''; return st; }
  // FONT GOOGLE: chờ tải xong đủ font + độ đậm của brand rồi mới dàn trang / in PDF.
  // Chưa tải xong mà đã đo → ngắt trang theo font dự phòng (sai chỗ xuống trang); in sớm → PDF dùng font dự phòng, mất phân cấp độ đậm.
  async function ensureFonts(brand) {
    if (!document.fonts || !document.fonts.load) return { ok: true, miss: [] };
    const probe = document.createElement('div'); probe.dataset.brand = brand; probe.style.display = 'none'; document.body.appendChild(probe);
    const cs = getComputedStyle(probe), fams = new Set();
    ['--ff-font-doc-body', '--ff-font-doc-native', '--ff-font-heading', '--ff-font-native', '--ff-font-body'].forEach(v => { const f = (cs.getPropertyValue(v) || '').trim().replace(/^['"]|['"]$/g, ''); if (f) fams.add(f); });
    probe.remove();
    const jobs = []; fams.forEach(f => ['400', '600', '700', '900'].forEach(w => jobs.push(document.fonts.load(`${w} 16px "${f}"`, 'Aa Ăă Ơơ Ưư').then(r => r.length ? null : `${f} ${w}`).catch(() => `${f} ${w}`))));
    const miss = (await Promise.race([Promise.all(jobs), new Promise(r => setTimeout(() => r(['hết giờ chờ font']), 6000))])).filter(Boolean);
    await document.fonts.ready;
    S.fontMiss = [...fams].filter(f => !document.fonts.check(`400 16px "${f}"`));
    return { ok: !S.fontMiss.length, fams: [...fams], miss: S.fontMiss };
  }
  async function build() {
    const size = S.view; await ensureFonts(S.brand); const box = $('#bookView'); box.innerHTML = '';
    if (!S.book || !S.book.s6) { box.innerHTML = '<p class="muted">Nhập Excel (S5 + S6) để dựng sách cho buổi đang chọn.</p>'; book = null; return null; }
    const buoi = +($('#buoi') && $('#buoi').value) || 1;
    const list = B.blocks(S.book, buoi, S.brand);
    const dv = I.curDevice ? I.curDevice() : null;
    const running = ((S.spec && S.spec.lesson) || '').toUpperCase();
    book = B.paginate(list, { size, brand: S.brand, stage: stage(), running, prep: null });   // sách in ra PDF: Chrome nhúng font web của brand vào PDF → giữ đủ độ đậm 400 / 600 / 700 / 900 (font an toàn của PPTX chỉ có thường / đậm → mất phân cấp)
    book.blocks = list.length; draw(); if (S.fontMiss && S.fontMiss.length) $('#selMeta').textContent = `Chưa tải được font: ${S.fontMiss.join(', ')} – kiểm tra mạng rồi bấm Dựng lại (PDF sẽ dùng font dự phòng)`; return book;
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
    let pr = $('#printRoot'); if (!pr) { pr = document.createElement('div'); pr.id = 'printRoot'; document.body.appendChild(pr); }
    pr.innerHTML = ''; book.pages.forEach(pg => pr.appendChild(pg.host.cloneNode(true)));
    B.print(S.view); return true;
  }
  function setView(v) {
    S.view = v; const bk = v !== 'slide';
    $('#canvas').hidden = bk; $('#bookView').hidden = !bk; document.querySelector('nav').style.display = bk ? 'none' : '';
    $('#btnPdf').hidden = !bk; const mw = document.querySelector('.menuwrap'); if (mw) mw.style.display = bk ? 'none' : '';
    if ($('#view').value !== v) $('#view').value = v;
    if (bk) return build(); else return I.build();
  }
  $('#view').onchange = () => setView($('#view').value);
  $('#btnPdf').onclick = () => exportPdf();
  // dựng lại sách khi đổi buổi / brand / font trong chế độ sách
  ['#buoi', '#brand', '#fontMode', '#device'].forEach(q => { const el = $(q); if (el) el.addEventListener('change', () => { if (S.view !== 'slide') setTimeout(build, 600); }); });
  Object.assign(P, { async book(size) { await setView(size || 'A4'); return book ? { pages: book.pages.length, blocks: book.blocks, warns: book.warns } : 'Chưa có Excel'; }, exportPdf, view: setView, _book: () => book, fonts: () => ensureFonts(S.brand) });
})(typeof window !== 'undefined' ? window : globalThis);
