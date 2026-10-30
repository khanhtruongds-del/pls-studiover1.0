// Chế độ SÁCH trong giao diện: chọn "Sách A4 / Sách 19×27" → dựng trang từ Excel của buổi đang chọn, xem từng trang, "Xuất PDF" (in → Lưu PDF).
(function (root) {
  const P = root.PLS, I = P && P._int, E = root.PLS_ENGINE, B = root.PLS_BOOK; if (!I || !B) return;
  const S = I.state, $ = q => document.querySelector(q);
  S.view = 'slide'; { const v = $('#view'); if (v) v.value = 'slide'; }   // option đầu giờ là "Nghiên cứu" → mặc định vẫn mở Slide
  let book = null;
  const COVERS_ONLY = false;   // người dùng 28/10: hiện đủ cả cuốn; ô chọn bìa chỉ đặt ngay trên bìa trước / bìa sau
  // NỘI DUNG SỬA TAY của trang mở đầu / kết thúc: lưu trên máy theo brand + bài + buổi
  const LK = 'pls.bookLetters';
  const lkey = (kind, b) => [S.brand, (S.spec && S.spec.lesson) || '', b || +($('#buoi') && $('#buoi').value) || 1, kind].join('|');
  const lstore = () => { try { return JSON.parse(localStorage.getItem(LK)) || {}; } catch (e) { return {}; } };
  // trang CỦA CẢ KHOÁ (bìa, lời mở đầu, lời cảm ơn, bìa sau – người dùng 29/10: sửa ở 1 buổi, sang Cả khoá bị mất) → lưu theo brand + bộ Excel, không theo buổi
  const COURSE_K = /^(cover|intro|thanks|back)$/;
  const ckey = kind => [S.brand, (I && I.state && I.state.recentId) || (S.book && S.book.s6 ? 'book' : ''), 'khoa', kind].join('|');
  const keyOf = (kind, b) => COURSE_K.test(kind) ? ckey(kind) : lkey(kind, b);
  const letterTxt = (kind, b) => { const st = lstore(); if (st[keyOf(kind, b)]) return st[keyOf(kind, b)];
    if (!COURSE_K.test(kind)) return null;   // bản sửa cũ (lưu theo buổi) → vẫn đọc được: lấy bản theo buổi hiện tại, không có thì bản cùng brand + loại trang
    return st[lkey(kind, b)] || st[lkey(kind, 1)] || Object.entries(st).filter(([k]) => k.startsWith(S.brand + '|') && k.endsWith('|' + kind) && !k.includes('|khoa|')).map(([, v]) => v)[0] || null; };
  function saveLetter(kind, field, val) { const all = lstore(), k = keyOf(kind); all[k] = Object.assign({}, letterTxt(kind) || {}, all[k] || {}, { [field]: val }); try { localStorage.setItem(LK, JSON.stringify(all)); } catch (e) {} }
  // CHỌN MẪU BÌA (người dùng 28/10): bìa trước + bìa sau theo thương hiệu, nhớ trên máy theo brand
  const CK = 'pls.bookCover';
  function coverPick() { const C = (root.PLS_COVERS || {})[S.brand] || { front: [], back: [] }; let v = {}; try { v = (JSON.parse(localStorage.getItem(CK)) || {})[S.brand] || {}; } catch (e) {}
    const front = v.front && (v.front === 'tpl' || C.front.some(x => x.id === v.front)) ? v.front : (C.front[0] ? C.front[0].id : 'tpl'); const fr = C.front.find(x => x.id === front);   // bìa đã chọn bị bỏ khỏi danh sách → về bìa đầu
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
  function resetLetter(kind) { const all = lstore(); delete all[keyOf(kind)]; if (COURSE_K.test(kind)) Object.keys(all).forEach(k => { if (k.startsWith(S.brand + '|') && k.endsWith('|' + kind)) delete all[k]; }); try { localStorage.setItem(LK, JSON.stringify(all)); } catch (e) {} }
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
    if (S.whole) return makeWhole(size);
    const buoi = +($('#buoi') && $('#buoi').value) || 1;
    // SỐ TRANG NỐI TIẾP (người dùng 29/10): xem từng buổi cũng đánh số như trong cuốn cả khoá – bài 2 nối tiếp số trang cuối bài 1, không đếm lại từ 1
    const C = course(size, buoi); if (!C) return null;
    const L = C.lessons.find(x => x.b === buoi) || C.lessons[0];
    const pages = [L.m.isFirst ? C.cover : null, L.m.isFirst ? C.intro : null, ...(L.m.isFirst ? C.toc : []), ...L.pages, L.outro, L.m.isLast ? C.thanks : null, L.m.isLast ? C.back : null].filter(Boolean);
    const keep = new Set(pages.map(p => p.host)); [...C.st.children].forEach(h => { if (!keep.has(h)) h.remove(); });
    // TẠM ẨN NỘI DUNG (người dùng 28/10): chế độ sách chỉ hiện + in bìa trước và bìa sau; đổi COVERS_ONLY = false để hiện lại cả cuốn
    if (COVERS_ONLY) return { pages: pages.filter(pg => pg.kind === 'cover' || pg.kind === 'back'), warns: L.warns, blocks: L.list.length };
    return { pages, warns: L.warns, blocks: L.list.length };
  }
  // DỰNG CẢ KHOÁ một lượt: bìa · lời mở đầu (1) · MỤC LỤC · từng bài (+ lời dặn dò của bài) nối tiếp số trang · lời cảm ơn · bìa sau
  // tên bài trong mục lục: bỏ tiền tố "Bài n –", chữ IN HOA TOÀN BỘ → viết thường kiểu câu (như slide), cách sau ? !
  const tocTitle = t => { let x = String(t || '').replace(/^Bài\s*\d+(?:\.\d+)?\s*[–-]\s*/i, '').replace(/([?!])(?=[A-Za-zÀ-ỹ])/g, '$1 ');
    const sc = t2 => { if (!(E && E.sentenceCase) || t2 !== t2.toUpperCase() || !/[A-ZÀ-Ỹ]/.test(t2)) return t2; const o = t2.split(/(\s+)/), n = E.sentenceCase(t2).split(/(\s+)/);
      return n.map((w, i) => /^(I|II|III|IV|V|VI)$/.test(o[i] || '') && /^(kỳ|KỲ|phần|PHẦN|cấp|CẤP|quyển|QUYỂN)$/.test(o[i - 2] || '') ? o[i] : w).join(''); };   // giữ số La Mã sau "kỳ / phần": kỳ I, kỳ II
    const m = x.match(/^([^:]{4,}):(.*)$/); x = x === x.toUpperCase() ? sc(x) : m && m[1] === m[1].toUpperCase() ? sc(m[1]) + ':' + m[2] : x; return x; };   // "THANH MẪU ĐƠN: z,c,s,r" → chỉ phần trước dấu ':'
  // SỬA TRÊN SLIDE → SÁCH CẬP NHẬT NGAY (người dùng 29/10): chỗ sửa tay (state.qcEdits: chữ cũ → chữ mới, cũng là dữ liệu nút "Tải S5-S6 đã sửa")
  // thay luôn vào bản Excel trong bộ nhớ trước khi dựng sách – chỉ các dòng của buổi đang mở; ô trùng cả ô → thay cả ô, nằm trong ô → thay đúng đoạn
  function withEdits(bk) {
    const ed = Object.values(S.qcEdits || {}).filter(e => e && e.old && e.new != null && e.old !== e.new); if (!ed.length || !bk) return bk;
    const buoi = +($('#buoi') && $('#buoi').value) || 0, num = v => { const m = String(v == null ? '' : v).replace(/,/g, '.').match(/\d+(?:\.\d+)?/); return m ? +m[0] : NaN; };
    const out = {}; let hit = 0;
    for (const [k, wb] of Object.entries(bk)) { if (!wb || typeof wb !== 'object') { out[k] = wb; continue; } out[k] = {};
      for (const [sh, rows] of Object.entries(wb)) out[k][sh] = !Array.isArray(rows) ? rows : rows.map(r => { if (!r || typeof r !== 'object' || !('Buổi' in r) || num(r['Buổi']) !== buoi) return r;
        let o = null; for (const c in r) { const v = r[c]; if (typeof v !== 'string') continue; let nv = v;
          for (const e of ed) { if (nv.trim() === String(e.old).trim()) nv = String(e.new); else if (String(e.old).length >= 2 && nv.includes(e.old)) nv = nv.split(e.old).join(String(e.new)); }
          if (nv !== v) { (o = o || Object.assign({}, r))[c] = nv; hit++; } }
        return o || r; }); }
    S.qcBookHits = hit; return out;
  }
  function course(size) {
    const src0 = withEdits(S.book), src = window.PLS_STRIP ? window.PLS_STRIP.books(src0) : src0, st = stage(), cp = coverPick();
    const ses = (root.PLS_IMPORT ? root.PLS_IMPORT.sessions(src.s6) : []).map(x => x.buoi).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
    if (!ses.length) return null;
    const runOf = m => (m ? `${m.label} – ${String(m.title).replace(/^Bài\s*\d+\s*[–-]\s*/i, '')}` : '').toUpperCase();
    const lessons = []; for (const b of ses) { let list = B.blocks(src, b, S.brand); if (S.aud === 'student') { const k = list.findIndex(x => /Section/.test(x.comp || '') && x.data && (x.data.title === 'Đáp án' || x.data.text === 'Đáp án')); if (k >= 0) list = list.slice(0, k); }   // bản học viên: bỏ phần Đáp án
      if (list.length) lessons.push({ b, list, m: B.meta(src, b) }); }
    if (!lessons.length) return null;
    const m1 = lessons[0].m, mL = lessons[lessons.length - 1].m, X = (kind, n, m, b) => B.extraPage(kind, { size, brand: S.brand, stage: st, running: runOf(m), meta: m, n, txt: letterTxt(kind, b) });
    const cover = B.extraPage('cover', { size, brand: S.brand, stage: st, running: '', meta: m1, pick: cp.front, txt: letterTxt('cover', m1.buoi) }), intro = X('intro', 1, m1, lessons[0].b);
    // MỤC LỤC chia trang theo ĐO THẬT (người dùng 29/10: tên bài dài xuống 2 dòng → trang 1 tràn, mất Bài 25–31): dựng thử, đếm số dòng nằm gọn trong trang
    const tocLab = L => L.m.bai != null && String(L.m.bai).trim() !== '' ? 'Bài ' + String(L.m.bai).replace(/^Bài\s*/i, '') : '';
    const pre = lessons.map(L => ({ label: tocLab(L), title: tocTitle(L.m.title), page: 888 })), chunks = [];
    for (let i = 0; i < pre.length;) { const pg = B.tocPage({ size, brand: S.brand, stage: st, running: 'MỤC LỤC', n: 2 + chunks.length, head: !chunks.length, entries: pre.slice(i) });
      const ct = pg.host.querySelector('[data-n="content"]'), lim = ct.getBoundingClientRect().bottom + 0.5;
      const k = Math.max(1, [...pg.host.querySelectorAll('.bk-toc > div')].filter(r => r.children.length >= 3).filter(r => r.getBoundingClientRect().bottom <= lim).length);
      pg.host.remove(); chunks.push([i, i + k]); i += k; }
    const tocN = chunks.length;
    let no = 2 + tocN; const entries = [];
    for (const L of lessons) {
      const bk = B.paginate(L.list, { size, brand: S.brand, stage: st, running: runOf(L.m), prep: null, first: no });
      entries.push({ label: tocLab(L),   /* mục lục chỉ ghi 'Bài n' (người dùng 29/10); buổi ôn tập không số bài → chỉ tên */ title: tocTitle(L.m.title), page: no });
      L.pages = bk.pages; L.warns = bk.warns || []; no += bk.pages.length;
      L.outro = L.m.dando || letterTxt('outro', L.b) ? X('outro', no++, L.m, L.b) : null;   // lời dặn dò của bài (cột Dặn dò S5) – cũng nằm trong dãy số trang
    }
    const toc = chunks.map(([a0, b0], i) => B.tocPage({ size, brand: S.brand, stage: st, running: 'MỤC LỤC', n: 2 + i, head: i === 0, entries: entries.slice(a0, b0) }));
    const thanks = X('thanks', no++, mL, lessons[lessons.length - 1].b), back = B.extraPage('back', { size, brand: S.brand, stage: st, running: '', meta: mL, pick: cp.back });
    return { st, cover, intro, toc, lessons, thanks, back };
  }
  // SÁCH CẢ KHOÁ (người dùng 29/10): mọi buổi trong S6 nối tiếp trong một cuốn
  async function makeWhole(size) {
    const C = course(size); if (!C) return null;
    const pages = [C.cover, C.intro, ...C.toc, ...C.lessons.flatMap(L => [...L.pages, L.outro]), C.thanks, C.back].filter(Boolean);
    return { pages, warns: C.lessons.flatMap(L => L.warns.map(w => `${L.m.label}: ${w}`)), blocks: C.lessons.reduce((a, L) => a + L.list.length, 0), whole: C.lessons.length };
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
      if (pg.kind === 'cover' && pg.host.dataset.edit) {   // BÌA SỬA ĐƯỢC: bấm vào chữ để sửa (giữ nguyên định dạng), nút đổi ảnh minh hoạ / về ảnh gốc / khôi phục chữ
        lb.textContent = 'Bìa trước – bấm vào chữ để sửa';
        c.querySelectorAll('[data-field]').forEach(e => { e.contentEditable = 'plaintext-only'; if (e.contentEditable !== 'plaintext-only') e.contentEditable = 'true'; e.spellcheck = false; e.style.outline = 'none'; e.style.cursor = 'text';
          e.onfocus = () => { e.style.boxShadow = '0 0 0 1px #7c5cd6'; }; e.onblur = () => { e.style.boxShadow = ''; };
          e.oninput = () => { const v = e.innerText.replace(/\n$/, ''); const o = pg.host.querySelector(`[data-field="${e.dataset.field}"]`); if (o) o.textContent = v; saveLetter('cover', e.dataset.field, v); }; });
        const mk = (t, f) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.textContent = t; b.style.cssText = 'margin-left:8px;font-size:12px;padding:2px 8px'; b.onclick = f; lb.appendChild(b); };
        mk('Đổi ảnh minh hoạ', () => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
          inp.onchange = () => { const f = inp.files[0]; if (!f) return; const im = new Image(); im.onload = () => { const W = Math.min(1840, im.naturalWidth), cv = document.createElement('canvas'); cv.width = W; cv.height = Math.round(im.naturalHeight * W / im.naturalWidth);
            cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); URL.revokeObjectURL(im.src); saveLetter('cover', 'img', cv.toDataURL('image/jpeg', 0.86)); saveLetter('cover', 'band', null); build(); }; im.src = URL.createObjectURL(f); }; inp.click(); });
        mk('Ảnh gốc', () => { saveLetter('cover', 'img', null); saveLetter('cover', 'band', null); build(); });
        { const strip = document.createElement('div'); strip.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:8px 0 2px';   // ẢNH MẪU cho dải minh hoạ (người dùng 29/10)
          const curB = String((letterTxt('cover') || {}).band || ''), hasImg = !!(letterTxt('cover') || {}).img;
          for (let i = 1; i <= 10; i++) { const b = document.createElement('button'); b.type = 'button'; b.title = 'Ảnh mẫu ' + i; b.style.cssText = `padding:0;border:2px solid ${curB === String(i) && !hasImg ? '#7c5cd6' : 'transparent'};border-radius:4px;background:none;cursor:pointer;line-height:0`;
            b.innerHTML = `<img alt="Ảnh mẫu ${i}" src="covers/dac-nhan-band-${i}_t.jpg" style="width:96px;height:auto;border-radius:2px">`; b.onclick = () => { saveLetter('cover', 'band', String(i)); saveLetter('cover', 'img', null); build(); }; strip.appendChild(b); }
          lb.appendChild(strip); }
        mk('Khôi phục chữ gốc', () => { const im = (letterTxt('cover') || {}).img; resetLetter('cover'); if (im) saveLetter('cover', 'img', im); build(); });
      }
      if (pg.kind === 'intro' || pg.kind === 'outro' || pg.kind === 'thanks') {   // chỉ hai trang lời dẫn được sửa; sửa trên bản xem → ghi vào trang gốc (bản in) + lưu máy
        c.querySelectorAll('[data-field]').forEach(e => { e.contentEditable = 'plaintext-only'; if (e.contentEditable !== 'plaintext-only') e.contentEditable = 'true'; e.spellcheck = false;
          e.oninput = () => { const v = e.innerText.replace(/\n$/, ''); const o = pg.host.querySelector(`[data-field="${e.dataset.field}"]`); if (o) o.textContent = v; saveLetter(pg.kind, e.dataset.field, v); if (B.fitLetter) { B.fitLetter(pg.host); B.fitLetter(c); } }; });   // gõ dài → tự thu chữ cho vừa trang (cả bản in lẫn bản xem)
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
    const size = '19x27';   // sách chỉ in khổ 19×27 (người dùng 29/10)
    let pp = null;
    try { say('Đang xuất PPTX…'); pp = await P.exportPptx(); } catch (e) { say('Xuất PPTX lỗi: ' + e.message); return { pptx: null, pdf: false, error: e.message }; }
    if (!B.SIZES[S.view]) return { pptx: pp, pdf: false };   // người dùng 25/10: đang ở tab Slide → "Xuất bài" chỉ tải PPTX về máy, không mở hộp thoại in sách
    const bk = await makeBook(size);
    if (!bk) { say(`Đã tải ${pp && pp.name || 'PPTX'} · chưa có Excel S5 + S6 nên chưa dựng được sách PDF`); return { pptx: pp, pdf: false }; }
    say(`Đã tải ${pp && pp.name || 'PPTX'} · hộp thoại in sách ${B.SIZES[size].label} (${bk.pages.length} trang): chọn "Lưu dưới dạng PDF" rồi bấm Lưu`);
    printBook(bk, size); return { pptx: pp, pdf: pdfName(size) + '.pdf', pages: bk.pages.length };
  }
  { const b = document.createElement('button'); b.id = 'btnAll'; b.type = 'button'; b.className = 'btn primary'; b.textContent = 'Xuất bài';
    b.title = 'Tải PPTX rồi mở hộp thoại in sách khổ 19×27 (chọn Lưu dưới dạng PDF).';
    const anchor = document.querySelector('.menuwrap') || $('#btnPdf'); if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(b, anchor.nextSibling); b.onclick = () => (B.SIZES[S.view] ? exportPdf() : exportAll());   /* tab Sách: chỉ xuất PDF sách (người dùng 29/10: bị xuất nhầm ra PPTX) */
    // CHỌN BẢN XUẤT (đặc tả §31.2): Giáo viên = có đáp án, ghi chú giảng, hiệu ứng khoanh đáp án · Học viên = bỏ hẳn đáp án, slide đáp án, ghi chú, phần Đáp án cuối sách
    const a = document.createElement('select'); a.id = 'aud'; a.setAttribute('aria-label', 'Bản xuất'); a.title = 'Bản giáo viên: có đáp án + ghi chú giảng. Bản học viên: không có đáp án, không ghi chú.';
    a.add(new Option('Giáo viên', 'teacher')); a.add(new Option('Học viên', 'student')); a.value = S.aud || 'teacher';
    a.onchange = () => { S.aud = a.value; b.textContent = B.SIZES[S.view] ? 'Xuất sách PDF' : S.aud === 'student' ? 'Xuất bản HV' : 'Xuất bài'; b.title = (S.aud === 'student' ? 'Bản học viên – không đáp án, không ghi chú. ' : 'Bản giáo viên – có đáp án, ghi chú giảng. ') + 'Tải PPTX rồi mở hộp thoại in sách (Lưu dưới dạng PDF).'; if (B.SIZES[S.view]) build(); };
    b.parentNode.insertBefore(a, b); }
  function setView(v) {
    if (v === 'A4') v = '19x27';   // khổ A4 đã bỏ (người dùng 29/10)
    S.view = v; const rs = v === 'research', bk = !!B.SIZES[v];
    document.body.classList.toggle('research', rs);   // tab NGHIÊN CỨU (người dùng chốt 23/10): che slide/sách, hiện #researchView – xem research.js
    if (rs) { if ($('#view').value !== v) $('#view').value = v; if (S.segSync) S.segSync(); if (root.PLS_RESEARCH) root.PLS_RESEARCH.show(); return Promise.resolve(); }
    $('#canvas').hidden = bk; $('#bookView').hidden = !bk; { const nb = $('#notesBox'); if (nb) nb.hidden = bk; } document.querySelector('nav').style.display = bk ? 'none' : '';
    { const ba = $('#btnAll'); if (ba) { ba.textContent = bk ? 'Xuất sách PDF' : (S.aud === 'student' ? 'Xuất bản HV' : 'Xuất bài'); ba.title = bk ? 'Mở hộp thoại in sách khổ 19×27 → chọn "Lưu dưới dạng PDF". Không tải PPTX.' : 'Tải PPTX về máy.'; } }
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
      b.onclick = () => { const v = o.value === 'A4' ? '19x27' : o.value;   /* người dùng 29/10: sách chỉ còn khổ 19×27 */ sel.value = v; sync(); setView(v); }; seg.appendChild(b); });
    { const sz = document.createElement('div'); sz.className = 'seg seg-sz'; sz.setAttribute('role', 'radiogroup'); sz.setAttribute('aria-label', 'Khổ sách'); sz.title = 'Chọn khổ sách';
      [].forEach(([v, t]) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.dataset.v = v; b.textContent = t; b.onclick = () => { S.bookSize = v; sel.value = v; sync(); setView(v); }; sz.appendChild(b); });
      { const wb = document.createElement('button'); wb.type = 'button'; wb.className = 'whole'; wb.textContent = 'Cả khoá'; wb.title = 'Dựng cả khoá trong một cuốn: mục lục + số trang liên tục qua các bài'; wb.setAttribute('aria-pressed', String(!!S.whole));
        wb.onclick = () => { S.whole = !S.whole; wb.setAttribute('aria-pressed', String(S.whole)); build(); }; sz.appendChild(wb); }
      const cs = document.createElement('style'); cs.textContent = '.seg-sz{margin-left:8px}.seg-sz[hidden]{display:none!important}.seg-sz button[aria-checked="true"]{background:var(--ui-ink);color:var(--ui-bg);border-radius:999px}.seg-sz button.whole{margin-left:6px;border-radius:999px}.seg-sz button.whole[aria-pressed="true"]{background:var(--ui-accent,#7c5cd6);color:#fff}'; document.head.appendChild(cs);
      S.szEl = sz; S.szSync = () => { const on = /^(A4|19x27)$/.test(sel.value); sz.hidden = !on; if (on) S.bookSize = sel.value; sz.querySelectorAll('button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.v === sel.value))); }; }
    sel.hidden = true; sel.after(seg); if (S.szEl) seg.after(S.szEl); requestAnimationFrame(sync); if (window.ResizeObserver) new ResizeObserver(sync).observe(seg); else window.addEventListener('resize', sync); S.segSync = sync; }   // thanh trượt hiện ra (hết màn hình bắt đầu) → đo lại vị trí
  $('#btnPdf').onclick = () => exportPdf();
  // đang ở tab Sách mà nhập Excel (trang giới thiệu → có bài) → dựng sách luôn
  { let was = document.body.classList.contains('empty'); new MutationObserver(() => { const now = document.body.classList.contains('empty'); if (was && !now && B.SIZES[S.view]) setTimeout(build, 0); was = now; }).observe(document.body, { attributes: true, attributeFilter: ['class'] }); }
  // dựng lại sách khi đổi buổi / brand / font trong chế độ sách
  ['#buoi', '#brand', '#fontMode', '#device'].forEach(q => { const el = $(q); if (el) el.addEventListener('change', () => { if (B.SIZES[S.view]) setTimeout(build, 600); }); });
  Object.assign(P, { exportAll, async book(size) { await setView(size || '19x27'); return book ? { pages: book.pages.length, blocks: book.blocks, warns: book.warns } : 'Chưa có Excel'; }, exportPdf, view: setView, _book: () => book, fonts: () => ensureFonts(S.brand) });
})(typeof window !== 'undefined' ? window : globalThis);
