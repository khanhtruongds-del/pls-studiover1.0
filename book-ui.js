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
    const pages = [L.m.isFirst ? C.cover : null, L.m.isFirst ? C.intro : null, ...(L.m.isFirst ? (C.intro && C.intro.more) || [] : []), ...(L.m.isFirst ? C.toc : []), ...(L.m.isFirst ? C.primer || [] : []), ...L.pages, L.outro, ...(L.m.isLast ? C.ansPages || [] : []), L.m.isLast ? C.thanks : null, L.m.isLast ? C.back : null].filter(Boolean);
    editableFonts(pages); applyDomEdits(pages);
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
  // PDF SỬA ĐƯỢC TRONG ACROBAT / FOXIT (người dùng 2/11): font web dạng "variable" (Montserrat, Be Vietnam Pro…) bị Chrome nhúng thành Type 3 → Acrobat không sửa được chữ.
  // Sách Đắc Nhân: mọi chữ dùng font sách (Times New Roman + KaiTi – font cài sẵn, nhúng TrueType, sửa được)
  function editableFonts(pages) { if (S.brand !== 'Đắc Nhân') return;
    pages.filter(Boolean).forEach(pg => pg.host.querySelectorAll('[data-n="footer"] > [data-n="page_no"], [data-n="footer"] > [data-n="page_no_l"]').forEach(e => Object.assign(e.style, { marginLeft: 'auto', textAlign: 'right' })));   // số trang luôn ở góc phải dưới, cùng một chỗ mọi trang (người dùng 2/11, như giáo trình gốc)
    pages.filter(Boolean).forEach(pg => { const bf = getComputedStyle(pg.host).getPropertyValue('--book-font').trim(); if (!bf) return;
      pg.host.querySelectorAll('*').forEach(e => { const f = getComputedStyle(e).fontFamily; if (/montserrat|be vietnam|inter\b|zalando|nunito|poppins/i.test(f.split(',')[0])) e.style.fontFamily = bf; }); }); }
  // XẾP TRANG CÓ NHỚ (người dùng 4/11: bấm A+ bên sách giật – mỗi lần dựng lại cả cuốn ~7–10 giây):
  // mỗi buổi nhớ kết quả xếp trang theo đúng dữ liệu khối (kể cả cỡ chữ) + khổ + chẵn/lẻ trang đầu → dựng lại chỉ xếp buổi có thay đổi, buổi khác lấy lại trang cũ (đánh lại số trang)
  const PCACHE = new Map();
  const hashStr = t => { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + t.length; };
  function pagCached(list, opt, tag) {
    const ck = [tag, opt.size, opt.brand, S.aud || '', opt.running, hashStr(JSON.stringify(list)), hashStr(JSON.stringify(dlist()))].join('|')   /* sửa chữ dựng sẵn ghi thẳng vào trang → đổi / hoàn tác thì xếp lại */, c = PCACHE.get(ck);
    if (c) { B.reframe(c.pages, opt); c.pages.forEach(pg => opt.stage.appendChild(pg.host)); return { pages: c.pages, warns: c.warns.slice() }; }   // dời số trang chẵn ↔ lẻ: chỉ đổi khung, không xếp lại
    const bk = B.paginate(list, opt); B.reframe(bk.pages, opt);   /* ghi số trang chắc chắn (mẫu trang chẵn để trống vẫn còn chữ mẫu '1') */ if (PCACHE.size > 400) PCACHE.clear(); PCACHE.set(ck, { pages: bk.pages, warns: (bk.warns || []).slice() }); return bk; }
  function course(size) {
    const src0 = withEdits(S.book), src = window.PLS_STRIP ? window.PLS_STRIP.books(src0, !/HSK\s*1(?!\d)/i.test(JSON.stringify(((src0.s6 || {})['S6-Thông tin khoá'] || []).filter(r => /tên khoá|cấp độ/i.test(String(r['Mục'] || '')))))) : src0   /* giữ cột Mã bài (nối lời bài nghe) – trừ HSK1 đã duyệt giữ nguyên */, st = stage(), cp = coverPick();
    const ses = (root.PLS_IMPORT ? root.PLS_IMPORT.sessions(src.s6) : []).map(x => x.buoi).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
    if (!ses.length) return null;
    const runOf = m => (m ? `${m.label} – ${String(m.title).replace(/^Bài\s*\d+\s*[–-]\s*/i, '')}` : '').toUpperCase();
    const lessons = []; for (const b of ses) { let list = B.blocks(src, b, S.brand); tagSty(list, b); if (S.aud === 'student') { const k = list.findIndex(x => /Section/.test(x.comp || '') && x.data && (x.data.title === 'Đáp án' || x.data.text === 'Đáp án')); if (k >= 0) list = list.slice(0, k); }   // bản học viên: bỏ phần Đáp án
      // ĐÁP ÁN DỒN CUỐI SÁCH (người dùng 2/11): tách phần Đáp án của từng buổi ra, gom thành một mục ở cuối cuốn
      let ans = null; if (S.aud !== 'student') { const k = list.findIndex(x => /Section/.test(x.comp || '') && x.data && (x.data.title === 'Đáp án' || x.data.text === 'Đáp án')); if (k >= 0) { ans = list.slice(k); list = list.slice(0, k); } }
      if (list.length) lessons.push({ b, list, m: B.meta(src, b), ans }); }
    if (!lessons.length) return null;
    const m1 = lessons[0].m, mL = lessons[lessons.length - 1].m, X = (kind, n, m, b) => B.extraPage(kind, { size, brand: S.brand, stage: st, running: runOf(m), meta: m, n, txt: letterTxt(kind, b) });
    const cover = B.extraPage('cover', { size, brand: S.brand, stage: st, running: '', meta: m1, pick: cp.front, txt: letterTxt('cover', m1.buoi) }), intro = X('intro', 1, m1, lessons[0].b), iN = 1 + ((intro && intro.more) || []).length;   // lời mở đầu Đắc Nhân 2 trang
    // MỤC LỤC chia trang theo ĐO THẬT (người dùng 29/10: tên bài dài xuống 2 dòng → trang 1 tràn, mất Bài 25–31): dựng thử, đếm số dòng nằm gọn trong trang
    const tocLab = L => L.m.bai != null && String(L.m.bai).trim() !== '' ? 'Bài ' + String(L.m.bai).replace(/^Bài\s*/i, '') : '';
    // mỗi buổi: khối "Đáp án" đầu phần đổi thành tên bài (Bài n – Tên) để tra đúng bài
    const ansList = lessons.filter(L => L.ans && L.ans.length > 1).flatMap(L => { const h = L.ans[0], t = 'Đáp án · ' + (tocLab(L) || tocTitle(L.m.title));   /* ngắn, 1 dòng (tên bài dài bị cắt) */
      return [Object.assign({}, h, { data: Object.assign({}, h.data, h.data.title != null ? { title: t } : { text: t }) }), ...L.ans.slice(1)]; });
    const PRN = S.brand === 'Đắc Nhân' && /HSK\s*1(?!\d)/i.test(`${m1.level} ${m1.course}`) ? 3 : 0;   // chỉ khoá HSK1 (người dùng 2/11)   // 3 trang Mở đầu (Đắc Nhân) sau Mục lục
    const pre = (PRN ? [{ label: 'Mở đầu', title: 'Giới thiệu tổng quan về chữ Hán', page: 888 }] : []).concat(lessons.map(L => ({ label: tocLab(L), title: tocTitle(L.m.title), page: 888 }))).concat(ansList.length ? [{ label: '', title: 'Đáp án', page: 888 }] : []), chunks = [];
    for (let i = 0; i < pre.length;) { const pg = B.tocPage({ size, brand: S.brand, stage: st, running: 'MỤC LỤC', n: 1 + iN + chunks.length, head: !chunks.length, entries: pre.slice(i) });
      const ct = pg.host.querySelector('[data-n="content"]'), lim = ct.getBoundingClientRect().bottom + 0.5;
      const k = Math.max(1, [...pg.host.querySelectorAll('.bk-toc > div')].filter(r => r.children.length >= 3).filter(r => r.getBoundingClientRect().bottom <= lim).length);
      pg.host.remove(); chunks.push([i, i + k]); i += k; }
    const tocN = chunks.length;
    let no = 1; const entries = [];   // SỐ TRANG ĐẾM TỪ PHẦN MỞ ĐẦU / BÀI 1 = trang 1 (người dùng 2/11): bìa, lời mở đầu, mục lục không đánh số
    const primer = PRN ? B.dnPrimerPages({ size, brand: S.brand, stage: st, n: no, pos: ppos() }) : []; if (PRN) { entries.push({ label: 'Mở đầu', title: 'Giới thiệu tổng quan về chữ Hán', page: no }); no += primer.length; }
    for (const L of lessons) {
      const bk = pagCached(L.list, { size, brand: S.brand, stage: st, running: runOf(L.m), prep: null, first: no }, 'L' + L.b);
      entries.push({ label: tocLab(L),   /* mục lục chỉ ghi 'Bài n' (người dùng 29/10); buổi ôn tập không số bài → chỉ tên */ title: tocTitle(L.m.title), page: no });
      L.pages = bk.pages; L.pages.forEach(pg => { pg.host.dataset.buoi = L.b; }); L.warns = bk.warns || []; no += bk.pages.length;   // buổi của trang → sửa chữ trên sách tìm đúng dòng Excel
      L.outro = L.m.dando || letterTxt('outro', L.b) ? X('outro', no++, L.m, L.b) : null;   // lời dặn dò của bài (cột Dặn dò S5) – cũng nằm trong dãy số trang
    }
    let ansPages = [];
    if (ansList.length) { const bk = pagCached(ansList, { size, brand: S.brand, stage: st, running: 'ĐÁP ÁN', prep: null, first: no }, 'ANS'); entries.push({ label: '', title: 'Đáp án', page: no }); ansPages = bk.pages; no += bk.pages.length; }
    const toc = chunks.map(([a0, b0], i) => B.tocPage({ size, brand: S.brand, stage: st, running: 'MỤC LỤC', n: 1 + iN + i, head: i === 0, entries: entries.slice(a0, b0) }));
    toc.forEach(pg => pg.host.querySelectorAll('[data-n="page_no"], [data-n="page_no_l"]').forEach(e => { e.style.visibility = 'hidden'; }));   // mục lục không in số trang
    const thanks = X('thanks', no++, mL, lessons[lessons.length - 1].b), back = B.extraPage('back', { size, brand: S.brand, stage: st, running: '', meta: mL, pick: cp.back });
    return { st, cover, intro, toc, primer, lessons, ansPages, thanks, back };
  }
  // SÁCH CẢ KHOÁ (người dùng 29/10): mọi buổi trong S6 nối tiếp trong một cuốn
  async function makeWhole(size) {
    const C = course(size); if (!C) return null;
    const pages = [C.cover, C.intro, ...((C.intro && C.intro.more) || []), ...C.toc, ...(C.primer || []), ...C.lessons.flatMap(L => [...L.pages, L.outro]), ...(C.ansPages || []), C.thanks, C.back].filter(Boolean);
    editableFonts(pages); applyDomEdits(pages);
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
  // ===== SỬA CHỮ THẲNG TRÊN TRANG SÁCH (người dùng 2/11) =====
  // Bấm vào chữ trên trang sách → sửa. Chữ cũ tìm thấy trong ô Excel của buổi đó → sửa đúng ô (sách dàn lại trang, slide cập nhật, "Tải S5-S6 đã sửa" ghi về file);
  // không có trong Excel (chữ dựng sẵn) → ghi nhớ "chữ cũ → chữ mới" trên máy, áp lại mỗi lần dựng sách. Ctrl/Cmd + Z hoàn tác, Ctrl + Y / Ctrl + Shift + Z làm lại.
  const DK = 'pls.bookDomEdits', dkey = () => [S.brand, S.recentId || ''].join('|');
  const dstore = () => { try { return JSON.parse(localStorage.getItem(DK)) || {}; } catch (e) { return {}; } };
  const dlist = () => dstore()[dkey()] || [];
  const dsave = l => { const all = dstore(); all[dkey()] = l; try { localStorage.setItem(DK, JSON.stringify(all)); } catch (e) { /* đầy */ } };
  const NOEDIT = /^(page_no|page_no_l|running|tagline|letter)$/;
  const directText = e => [...e.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim());
  function applyDomEdits(pages) { const l = dlist(); if (!l.length) return;
    pages.filter(Boolean).forEach(pg => pg.host.querySelectorAll('*').forEach(e => { if (!directText(e)) return; const t = e.textContent;
      const hit = l.find(x => x.o === t && (!x.b || String(x.b) === String(pg.host.dataset.buoi || ''))); if (hit) e.textContent = hit.n; })); }
  const undo = [], redo = [];
  // ===== KÉO TỰ DO trên trang SƠ ĐỒ (3 trang Mở đầu HSK1 – người dùng 4/11): chỉ phần có data-mv; đầu trang, số trang cố định; trang dàn nội dung thường KHÔNG kéo được =====
  // nhấn giữ + kéo > 5px = dịch; bấm thả = sửa chữ như cũ. Lưu theo brand (máy này), áp khi dựng trang. Không ra ngoài khung nội dung trang. Ctrl+Z hoàn tác.
  const PK = 'pls.primerPos', ppos = () => { try { return (JSON.parse(localStorage.getItem(PK)) || {})[S.brand] || {}; } catch (e) { return {}; } };
  const psave = m => { let a = {}; try { a = JSON.parse(localStorage.getItem(PK)) || {}; } catch (e) { /* */ } a[S.brand] = m; try { localStorage.setItem(PK, JSON.stringify(a)); } catch (e) { /* đầy */ } };
  function pmSet(k, v, host, noUndo) { const m = ppos(), prev = m[k] ? Object.assign({}, m[k]) : null; if (v && (v.x || v.y || v.fz || v.b || v.i || v.u)) m[k] = v; else delete m[k]; psave(m);
    document.querySelectorAll(`[data-mvk="${CSS.escape(k)}"]`).forEach(e => { e.style.translate = v ? `${v.x || 0}px ${v.y || 0}px` : ''; });   // trang gốc (in PDF) + trang đang hiện
    if (!noUndo) { undo.push([{ t: 'pm', k, prev, next: v }]); redo.length = 0; } }
  function resetBtn(lb) { if (!lb || lb.querySelector('.pm-reset')) return; const pre = lb.dataset.pmPre; const bR = document.createElement('button'); bR.type = 'button'; bR.className = 'btn pm-reset'; bR.textContent = 'Về vị trí gốc'; bR.style.cssText = 'margin-left:8px;font-size:12px;padding:2px 8px';
    bR.onclick = () => { const m = ppos(), st = Object.keys(m).filter(x => x.startsWith(pre)).map(x => ({ t: 'pm', k: x, prev: m[x], next: null })); st.forEach(x => pmSet(x.k, null, null, true)); undo.push(st); redo.length = 0; bR.remove(); }; lb.appendChild(bR); }
  // CHỌN NHIỀU (người dùng 4/11): Shift + bấm = thêm / bỏ; kéo khung chọn từ chỗ trống; kéo 1 phần đang chọn = cả nhóm đi theo; phím mũi tên dịch nhóm (Shift: 10px); Esc bỏ chọn
  let mvSel = [];
  const selShow = () => { document.querySelectorAll('#bookView [data-mv]').forEach(e => { e.style.outline = mvSel.includes(e) ? '1.5px dashed #7c5cd6' : ''; e.style.outlineOffset = mvSel.includes(e) ? '2px' : ''; }); };
  const selSet = l => { mvSel = l.filter(Boolean); selShow(); };
  function pmMany(moves) {   // moves: [{ k, v }] → 1 bước hoàn tác
    const m = ppos(), st = moves.map(x => ({ t: 'pm', k: x.k, prev: m[x.k] ? Object.assign({}, m[x.k]) : null, next: x.v })); moves.forEach(x => pmSet(x.k, x.v, null, true)); undo.push(st); redo.length = 0;
    const w = mvSel[0] && mvSel[0].closest('.book-page'); resetBtn(w && w.nextElementSibling); if (I.setStatus) I.setStatus(`Đã dịch ${moves.length} phần – Ctrl+Z để hoàn tác · nút "Về vị trí gốc" dưới trang`); }
  function mvDrag(ev, el, k) { const x0 = ev.clientX, y0 = ev.clientY; let on = false, last = null;
    const grp = mvSel.includes(el) ? mvSel.slice() : [el], ct = el.closest('[data-n="content"]'), C = ct.getBoundingClientRect();
    const cur = grp.map(e => Object.assign({ x: 0, y: 0 }, ppos()[e.dataset.mvk])), rs = grp.map(e => e.getBoundingClientRect());
    const G = { l: Math.min(...rs.map(r => r.left)), r: Math.max(...rs.map(r => r.right)), t: Math.min(...rs.map(r => r.top)), b: Math.max(...rs.map(r => r.bottom)) };   // khung bao cả nhóm
    const mv = e => { if (!on && Math.hypot(e.clientX - x0, e.clientY - y0) < 5) return;
      if (!on) { on = true; const a = document.activeElement; if (a && a.isContentEditable) a.blur(); if (!mvSel.includes(el)) selSet([el]); document.body.style.cursor = 'grabbing'; }
      window.getSelection().removeAllRanges(); const dx = (e.clientX - x0) / k, dy = (e.clientY - y0) / k;
      const ddx = Math.max((C.left - G.l) / k, Math.min((C.right - G.r) / k, dx)), ddy = Math.max((C.top - G.t) / k, Math.min((C.bottom - G.b) / k, dy));   // cả nhóm không ra ngoài trang
      last = grp.map((g, i) => { const v = { x: Math.round(cur[i].x + ddx), y: Math.round(cur[i].y + ddy) }; g.style.translate = `${v.x}px ${v.y}px`; return { k: g.dataset.mvk, v }; }); };
    const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); document.body.style.cursor = ''; if (!on) { if (!mvSel.includes(el) || mvSel.length === 1) selSet([el]); if (mvSel.length === 1) primerBar(el); return; } pmMany(last); };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); }
  function marquee(ev, c) { const x0 = ev.clientX, y0 = ev.clientY; let box = null, add = ev.shiftKey ? mvSel.slice() : [];
    const mv = e => { if (!box && Math.hypot(e.clientX - x0, e.clientY - y0) < 5) return;
      if (!box) { const a = document.activeElement; if (a && a.isContentEditable) a.blur(); box = document.createElement('div'); document.body.appendChild(box); }
      window.getSelection().removeAllRanges(); const L = Math.min(x0, e.clientX), T = Math.min(y0, e.clientY), R = Math.max(x0, e.clientX), Bm = Math.max(y0, e.clientY);
      box.style.cssText = `position:fixed;left:${L}px;top:${T}px;width:${R - L}px;height:${Bm - T}px;border:1px dashed #7c5cd6;background:rgba(124,92,214,.08);z-index:1001;pointer-events:none`;
      const hit = [...c.querySelectorAll('[data-mv]')].filter(x => { const r = x.getBoundingClientRect(), cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2; return cx > L && cx < R && cy > T && cy < Bm; });   // tâm nằm trong khung chọn (chạm mép không tính)
      selSet([...new Set(add.concat(hit))]); };
    const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); if (box) box.remove(); else if (!ev.shiftKey) selSet([]); };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); }
  document.addEventListener('keydown', e => { if (!mvSel.length || !mvSel[0].isConnected) return; const a = document.activeElement; if (a && (a.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(a.tagName))) return;
    if (e.key === 'Escape') { selSet([]); return; } const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]; if (!d) return; e.preventDefault();
    const st = e.shiftKey ? 10 : 1, ct = mvSel[0].closest('[data-n="content"]'), C = ct.getBoundingClientRect(), k = C.width / ct.offsetWidth || 1, rs = mvSel.map(x => x.getBoundingClientRect());
    let dx = d[0] * st, dy = d[1] * st; if (Math.min(...rs.map(r => r.left)) + dx * k < C.left || Math.max(...rs.map(r => r.right)) + dx * k > C.right) dx = 0; if (Math.min(...rs.map(r => r.top)) + dy * k < C.top || Math.max(...rs.map(r => r.bottom)) + dy * k > C.bottom) dy = 0;
    if (!dx && !dy) return; pmMany(mvSel.map(x => { const v = Object.assign({ x: 0, y: 0 }, ppos()[x.dataset.mvk]); return { k: x.dataset.mvk, v: { x: v.x + dx, y: v.y + dy } }; })); selShow(); });
  // ===== CỠ CHỮ TRANG DỰNG RIÊNG (người dùng 5/11: "pdf giới thiệu chung không chỉnh được size") =====
  // 3 trang Mở đầu chữ Hán: bấm 1 phần → A− / % / A+ · B / I / U (lưu chung với vị trí kéo, pls.primerPos) · Lời mở đầu / cảm ơn: bấm 1 đoạn → như trên (lưu pls.bookLetters ._sty)
  // áp khi dựng trang (book.js) → chữ to ra tự sang trang sau; Ctrl+Z hoàn tác
  function miniBar(tgt, cur, set) { document.querySelectorAll('.bk-sty-tb, .bk-sty-sel').forEach(x => x.remove()); const R0 = tgt.getBoundingClientRect();
    const sel = document.createElement('div'); sel.className = 'bk-sty-sel'; sel.style.cssText = `position:fixed;left:${R0.left - 2}px;top:${R0.top - 2}px;width:${R0.width + 4}px;height:${R0.height + 4}px;outline:1.5px dashed #7c5cd6;pointer-events:none;z-index:999`; document.body.appendChild(sel);
    const tb = document.createElement('div'); tb.className = 'bk-sty-tb'; tb.style.cssText = `position:fixed;left:${R0.left}px;top:${Math.max(4, R0.top - 38)}px;display:flex;gap:6px;align-items:center;white-space:nowrap;background:#fff;color:#1b1a17;border:1px solid #d6d0ea;border-radius:6px;padding:3px;box-shadow:0 2px 6px rgba(0,0,0,.15);z-index:1000;font-size:12px`;
    const grp = () => { const g = document.createElement('div'); g.style.cssText = 'display:flex;align-items:center;gap:1px;border:1px solid #cfc6ea;border-radius:5px;padding:1px;background:#faf8ff'; tb.appendChild(g); return g; };
    const bt = (g, t, tip, f, on) => { const x = document.createElement('button'); x.type = 'button'; x.textContent = t; x.title = tip; x.style.cssText = `border:0;background:${on ? '#ece6fb' : 'none'};border-radius:4px;padding:2px 7px;cursor:pointer;font:inherit;font-weight:600;color:#3a2f6b`;
      x.onpointerdown = e => { e.preventDefault(); e.stopPropagation(); }; x.onclick = e => { e.stopPropagation(); f(); }; g.appendChild(x); return x; };
    const fz = cur.fz || 1, g1 = grp(), rd = v => Math.round(v * 10) / 10;
    bt(g1, 'A−', 'Chữ nhỏ hơn (thấp nhất 70%)', () => set({ fz: rd(Math.max(0.7, fz - 0.1)) })).disabled = fz <= 0.7;
    const lb = document.createElement('span'); lb.textContent = Math.round(fz * 100) + '%'; lb.style.cssText = 'min-width:38px;text-align:center;color:#555'; g1.appendChild(lb);
    bt(g1, 'A+', 'Chữ to hơn (cao nhất 150%) – không vừa trang thì tự sang trang sau', () => set({ fz: rd(Math.min(1.5, fz + 0.1)) })).disabled = fz >= 1.5;
    const g2 = grp(); [['b', 'B', 'In đậm', 'font-weight:800'], ['i', 'I', 'In nghiêng', 'font-style:italic;font-family:Georgia,serif'], ['u', 'U', 'Gạch dưới', 'text-decoration:underline']].forEach(([k, t, tip, css]) => { const x = bt(g2, t, tip, () => set({ [k]: !cur[k] }), !!cur[k]); x.style.cssText += ';' + css + ';min-width:24px'; });
    if (cur.fz || cur.b || cur.i || cur.u) bt(grp(), 'Mặc định', 'Về cỡ chữ, kiểu chữ gốc', () => set({ fz: 1, b: false, i: false, u: false }));
    document.body.appendChild(tb); { const r = tb.getBoundingClientRect(), vw = document.documentElement.clientWidth; if (r.right > vw - 8) tb.style.left = Math.max(8, vw - 8 - r.width) + 'px'; if (R0.top - 38 < 4) tb.style.top = (R0.bottom + 6) + 'px'; }
    const sc0 = scroller(), mv = () => { if (!tb.isConnected || !tgt.isConnected) { tb.remove(); sel.remove(); return sc0.removeEventListener('scroll', mv); } const r = tgt.getBoundingClientRect(), w = tb.getBoundingClientRect().width, vw = document.documentElement.clientWidth;   // cuộn → thanh + khung đi theo (bấm vào chữ có thể làm khung cuộn nhẹ)
      Object.assign(sel.style, { left: r.left - 2 + 'px', top: r.top - 2 + 'px' }); tb.style.left = Math.max(8, Math.min(r.left, vw - 8 - w)) + 'px'; tb.style.top = (r.top - 38 < 4 ? r.bottom + 6 : r.top - 38) + 'px'; }; sc0.addEventListener('scroll', mv, { passive: true }); }
  const cleanSty = o => { const v = Object.assign({}, o); if (!v.fz || v.fz === 1) delete v.fz; ['b', 'i', 'u'].forEach(k => { if (!v[k]) delete v[k]; }); return v; };
  async function reshow(sel, fn) { await build(); const e = document.querySelector('#bookView ' + sel); if (e) { e.scrollIntoView({ block: 'nearest' }); fn(e); } }
  function primerBar(el) { const k = el.dataset.mvk, cur = Object.assign({}, ppos()[k]);
    miniBar(el, cur, async ch => { const v = cleanSty(Object.assign({ x: 0, y: 0 }, cur, ch)); pmSet(k, v); const w = el.closest('.book-page'); resetBtn(w && w.nextElementSibling); if (I.setStatus) I.setStatus('Đã đổi cỡ / kiểu chữ – Ctrl+Z để hoàn tác · "Về vị trí gốc" trả cả cỡ chữ');
      await reshow(`[data-mvk="${CSS.escape(k)}"]`, e => { selSet([e]); primerBar(e); }); }); }
  function letterBar(el, kind) { const key = el.dataset.ik || el.dataset.field, all = Object.assign({}, (letterTxt(kind) || {})._sty), cur = Object.assign({}, all[key]);
    miniBar(el, cur, async ch => { const prev = JSON.parse(JSON.stringify(all)), v = cleanSty(Object.assign({}, cur, ch)), next = Object.assign({}, all); if (Object.keys(v).length) next[key] = v; else delete next[key];
      saveLetter(kind, '_sty', next); undo.push([{ t: 'lsty', kind, prev, next }]); redo.length = 0; if (I.setStatus) I.setStatus('Đã đổi cỡ / kiểu chữ – trang tự dàn lại · Ctrl+Z để hoàn tác');
      await reshow(`[data-ik="${key}"], #bookView .bk-letter[data-letter="${kind}"] [data-field="${key}"]`, e => letterBar(e, kind)); }); }
  // ===== CỠ CHỮ + CĂN LỀ KHỐI SÁCH (người dùng 4/11 – như thanh công cụ bên slide; KHÔNG kéo thả / đổi bề rộng khung) =====
  // bấm vào một khối trên trang sách → thanh A− / % / A+ · căn trái / giữa / phải. Lưu theo khoá (máy này), áp khi DỰNG khối – trước khi xếp trang (book.js bookSty)
  // → khối to lên tự sang trang sau / cắt qua trang; khối 1 mình vẫn cao hơn trang → tự hạ cỡ cho vừa và báo. Giới hạn 70–150%. Ctrl+Z / Ctrl+Y dùng chung với sửa chữ.
  const SK = 'pls.bookSty', sstore = () => { try { return JSON.parse(localStorage.getItem(SK)) || {}; } catch (e) { return {}; } };
  const smap = () => sstore()[dkey()] || {};
  const ssave = m => { const a = sstore(); if (Object.keys(m).length) a[dkey()] = m; else delete a[dkey()]; try { localStorage.setItem(SK, JSON.stringify(a)); } catch (e) { /* đầy */ } };
  // khoá khối = buổi | loại khối | 40 chữ đầu của nội dung # lần xuất hiện (giữ được khi dựng lại; sửa nội dung khối thì cỡ chữ của khối đó về mặc định)
  function tagSty(list, b) { const m = smap(), seen = {}, ALL = +root.PLS_BOOK_STY_ALL || 0; let head = null;   // PLS_BOOK_STY_ALL: bộ mẫu chuẩn thử phóng to mọi khối
    list.forEach(x => { if (!x || !x.comp) return; const sig = x.comp.replace('Block/', '') + '|' + Object.values(x.data || {}).filter(v => typeof v === 'string').join(' ').replace(/\s+/g, ' ').trim().slice(0, 40);
      const k0 = b + '|' + sig; seen[k0] = (seen[k0] || 0) + 1; x.bk = k0 + '#' + seen[k0];
      if (x.cont && head && head.comp === x.comp && head.role === x.role) x.bk = head.bk; else head = x;   // bảng chia nhiều phần (Từ vựng 8 dòng / phần): mọi phần chung 1 khoá → kéo cột / cỡ chữ áp cả bảng
      let st = m[x.bk] || (ALL && !/Lesson Header|Section Bar/.test(x.comp) ? { fz: ALL } : null);
      const g = x.role && m['@role:' + x.role]; if (g) ['cols', 'hide', 'cw'].forEach(k => { if (g[k] && !(st && st[k])) st = Object.assign({}, st, { [k]: g[k] }); });   // "Áp cho mọi bảng cùng loại" (thứ tự / cột ẩn / độ rộng) – bảng đã chỉnh riêng giữ phần riêng
      if (root.PLS_BOOK_COLS_TEST && x.comp === 'Block/Table N') { const n = Object.keys(x.data || {}).filter(k => /^row_0\.c\d+$/.test(k)).length; if (n >= 3) st = Object.assign({}, st, { hide: ['c' + n], cw: Object.assign({ c1: 40 }, ...Array.from({ length: n - 2 }, (_, i) => ({ ['c' + (i + 2)]: 60 / (n - 2) }))) }); }   // bộ mẫu chuẩn: xoá cột cuối + cột 1 rộng 40%
      if (root.PLS_BOOK_RT_TEST && x.comp !== 'Block/Lesson Header') { const v = Object.values(x.data || {}).find(v => typeof v === 'string' && v.trim().length > 4); if (v) st = Object.assign({}, st, { rt: [{ s: '@first', o: 0, t: '', b: true, u: true }] }); }   // bộ mẫu chuẩn: in đậm + gạch chân 4 chữ đầu mỗi khối   // "Áp cho mọi bảng cùng loại" – bảng đã kéo riêng giữ thứ tự riêng
      if (root.PLS_BOOK_COLS_REV && x.comp === 'Block/Table N') { const n = Object.keys(x.data || {}).filter(k => /^row_0\.c\d+$/.test(k)).length; if (n >= 2) st = Object.assign({}, st, { cols: Array.from({ length: n }, (_, i) => 'c' + (n - i)) }); }   // bộ mẫu chuẩn: đảo ngược mọi bảng
      if (st) x.sty = st;
      if (x.rows && x.comp === 'Block/Table N' && x.role) xcolAdd(x, m); }); }
  // ＋ CỘT TỪ EXCEL (người dùng 5/11): cột có trong sheet S6 mà bảng chưa hiện → thêm vào MỌI bảng cùng loại ('@role:<loại>'.xcols = [tên cột]), dữ liệu đúng từng dòng Excel
  const XC = {};   // khoá khối → { role, avail: cột còn thêm được }
  const nv = v => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
  function xcolAdd(x, m) { const keys = [...new Set(x.rows.flatMap(r => Object.keys(r)))].filter(k => k !== '__r' && !/^(buổi|bài\b|stt|lên |mã|ảnh|audio|link|id\b|ghi chú nội bộ)/i.test(k));
    const cells = i => Object.entries(x.data).filter(([k]) => k.startsWith(`row_${i + 1}.`)).map(([, v]) => nv(v));
    const avail = keys.filter(k => x.rows.some(r => nv(r[k])) && !x.rows.every((r, i) => !nv(r[k]) || cells(i).includes(nv(r[k]))));
    const o = XC[x.bk] = XC[x.bk] || { role: x.role, avail: [] }; avail.forEach(k => { if (!o.avail.includes(k)) o.avail.push(k); });
    const xs = (m['@role:' + x.role] || {}).xcols || []; if (!xs.length) return;
    let n = Object.keys(x.data).filter(k => /^row_0\.c\d+$/.test(k)).length; const d = Object.assign({}, x.data), xc = {};
    xs.forEach(name => { if (n >= 8 || !keys.includes(name)) return; const c = 'c' + (++n); d['row_0.' + c] = name; x.rows.forEach((r, i) => { d[`row_${i + 1}.${c}`] = nv(r[name]); }); xc[c] = name; });
    if (Object.keys(xc).length) { x.data = d; x.xc = xc; } }
  // KHÔI PHỤC BAN ĐẦU (app.js resetAll, 5/11): bỏ kiểu chữ / cột, chữ dựng sẵn đã sửa, vị trí trang Mở đầu, bìa – lời dẫn của bộ file này
  root.PLS_BOOK_RESET = () => { const del = (K, f) => { try { const a = JSON.parse(localStorage.getItem(K)) || {}; f(a); localStorage.setItem(K, JSON.stringify(a)); } catch (e) { /* */ } };
    del(SK, a => { delete a[dkey()]; }); del(DK, a => { delete a[dkey()]; }); del(PK, a => { delete a[S.brand]; });
    const rid = S.recentId || '', les = (S.spec && S.spec.lesson) || ''; del(LK, a => Object.keys(a).forEach(k => { if (k.startsWith(S.brand + '|') && ((rid && k.includes('|' + rid + '|')) || k.startsWith(S.brand + '|' + les + '|'))) delete a[k]; }));
    undo.length = 0; redo.length = 0; PCACHE.clear(); };
  const subSig = e => (e.dataset.n || '') + '|' + e.textContent.replace(/\s+/g, ' ').trim().slice(0, 30);   // giống book.js
  const clampSty = x => { const o = Object.assign({}, x); if (o.fz != null) { o.fz = Math.min(1.5, Math.max(0.7, Math.round(o.fz * 10) / 10)); if (o.fz === 1) delete o.fz; } if (!o.ta) delete o.ta; ['b', 'i', 'u'].forEach(k => { if (!o[k]) delete o[k]; }); if (!o.cols || !o.cols.length) delete o.cols; if (!o.hide || !o.hide.length) delete o.hide; if (!o.cw || !Object.keys(o.cw).length) delete o.cw; if (!o.rt || !o.rt.length) delete o.rt; if (!o.xcols || !o.xcols.length) delete o.xcols; return o; };
  async function setSty(key, ch, sig) { const m = smap(), prev = m[key] ? JSON.parse(JSON.stringify(m[key])) : null; let nx = Object.assign({}, prev);
    if (sig) { const sub = Object.assign({}, nx.sub), v = clampSty(Object.assign({}, sub[sig], ch)); if (Object.keys(v).length) sub[sig] = v; else delete sub[sig]; nx.sub = sub; if (!Object.keys(sub).length) delete nx.sub; }
    else { const keepSub = nx.sub; nx = clampSty(Object.assign({}, nx, ch)); if (keepSub) nx.sub = keepSub; }
    const next = Object.keys(nx).length ? nx : null; if (JSON.stringify(prev) === JSON.stringify(next)) return;
    if (next) m[key] = next; else delete m[key]; ssave(m); undo.push([{ t: 'sty', key, prev, next, sig }]); redo.length = 0; preview(key, sig, prev, next); }
  // XEM TRƯỚC NGAY trên trang đang hiện (đổi cỡ / kiểu chữ tại chỗ), dàn lại trang thật khi DỪNG TAY 0,5 giây – bấm A+ liên tiếp chỉ dàn lại 1 lần
  let styTimer = null;
  const scroller = () => { for (let x = $('#bookView'); x; x = x.parentElement) { const cs = getComputedStyle(x); if (/(auto|scroll)/.test(cs.overflowY) && x.scrollHeight > x.clientHeight + 2) return x; } return document.scrollingElement || document.documentElement; };   // khung cuộn thật của vùng sách (không phải window)
  function preview(key, sig, prev, next) {
    const pick = x => (sig ? ((x || {}).sub || {})[sig] : x) || {}, a = pick(prev), b = pick(next), r = (b.fz || 1) / (a.fz || 1);
    const d = { fz: r, ta: b.ta || '', b: b.b && !a.b, i: b.i && !a.i, u: b.u && !a.u };
    document.querySelectorAll(`#bookView [data-bk="${CSS.escape(key)}"]`).forEach(blk => { const w0 = blk.closest('.book-page'); if (w0) w0.dataset.dirty = '1';   /* trang đã xem trước → lần vẽ sau không dùng lại bản này */ const t = sig ? [...blk.querySelectorAll('[data-n]')].find(e => subSig(e) === sig) : blk; if (!t) return;
      if (!sig && JSON.stringify(a.cols || null) !== JSON.stringify(b.cols || null)) B.colOrder(t, b.cols || [...t.querySelectorAll('[data-n="row_0"] > [data-n$="_cell"]')].map(c => c.dataset.n.replace(/_cell$/, '')));
      if (!sig && ['hide', 'cw'].some(k => JSON.stringify(a[k] || null) !== JSON.stringify(b[k] || null))) B.colLayout(t, b);   // xoá cột / độ rộng: xem ngay (hiện lại cột → chờ dàn lại)
      if (!sig && root.PLS_RT && (b.rt || []).length > (a.rt || []).length) (b.rt || []).slice((a.rt || []).length).forEach(op => [t, ...t.querySelectorAll('[data-n]')].filter(e => B.subSig(e) === op.s).forEach(e => root.PLS_RT.apply(e, [op])));
      if (r !== 1 || d.ta || d.b || d.i || d.u) B.bookSty(t, d, t.parentElement);
      if ((a.b && !b.b) || (a.i && !b.i) || (a.u && !b.u)) [t, ...t.querySelectorAll('*')].forEach(e => { if (a.b && !b.b) e.style.fontWeight = ''; if (a.i && !b.i) e.style.fontStyle = ''; if (a.u && !b.u) e.style.textDecoration = ''; }); });
    const c = document.querySelector(`#bookView [data-bk="${CSS.escape(key)}"]`); if (c) { const w = c.closest('.book-page'), sb = sig && [...c.querySelectorAll('[data-n]')].find(e => subSig(e) === sig); if (w) showStyBar(w, c, sb || null); }
    if (I.setStatus) I.setStatus('Đã đổi – dừng tay là trang sách tự dàn lại…');
    clearTimeout(styTimer); styTimer = setTimeout(() => restyle(key, null, sig), 500); }
  async function restyle(key, msg, sig) { const a = document.activeElement; if (a && a.isContentEditable) a.blur();   /* để Ctrl+Z sau đó là hoàn tác của sách, không phải của ô chữ */ clearTimeout(styTimer); const q = key && document.querySelector(`#bookView [data-bk="${CSS.escape(key)}"]`), top0 = q ? q.getBoundingClientRect().top : null, sc = scroller(), y = sc.scrollTop; S.styFocus = key; if (I.setStatus) I.setStatus('Đang dàn lại trang sách…'); await build(); sc.scrollTop = y;   /* giữ khối đang chỉnh đứng yên trên màn hình (không nhảy trang) */ { const q2 = key && document.querySelector(`#bookView [data-bk="${CSS.escape(key)}"]`); if (q2 && top0 != null) sc.scrollTop += q2.getBoundingClientRect().top - top0; }
    const c = key && document.querySelector(`#bookView [data-bk="${CSS.escape(key)}"]`); if (c) { const sb = sig && [...c.querySelectorAll('[data-n]')].find(e => subSig(e) === sig || e.dataset.subSty && (e.dataset.n || '') === sig.split('|')[0]); const w = c.closest('.book-page'); if (w) showStyBar(w, c, sb || null); }
    const ws = (book && book.warns || []).filter(x => /giới hạn ở/.test(x)); if (I.setStatus) I.setStatus(msg || (ws.length ? ws[0] : 'Đã đổi cỡ chữ / căn lề – trang sách tự dàn lại · Ctrl+Z để hoàn tác')); }
  // bấm vào khung trong (dòng ví dụ, ô bảng, câu…) → chỉnh khung trong; bấm vào phần khung ngoài (viền / khoảng trống bao quanh) → chỉnh cả khung ngoài (người dùng 4/11 – bỏ nút Ô nhỏ / Cả khối)
  // KÉO TIÊU ĐỀ CỘT để đổi thứ tự cột của bảng (người dùng 4/11): nhấn giữ + kéo ngang > 6px → vạch đỏ chỗ thả, thả ra là đổi (chỉ bảng này); bấm thả không kéo = sửa chữ như cũ
  function colDrag(ev, blk, hc) { const x0 = ev.clientX; let on = false, line = null, idx = -1;
    const heads = () => [...hc.parentElement.children].filter(c => /_cell$/.test(c.dataset.n || '') && c.style.display !== 'none').sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
    const mv = e => { if (!on && Math.abs(e.clientX - x0) < 6) return;
      if (!on) { on = true; const a = document.activeElement; if (a && a.isContentEditable) a.blur(); hc.style.opacity = '0.45'; line = document.createElement('div'); line.className = 'bk-col-line'; document.body.appendChild(line); document.body.style.cursor = 'grabbing'; }
      window.getSelection().removeAllRanges(); const H = heads(), B0 = blk.getBoundingClientRect(); idx = H.length; for (let i = 0; i < H.length; i++) { const r = H[i].getBoundingClientRect(); if (e.clientX < r.left + r.width / 2) { idx = i; break; } }
      const xL = idx < H.length ? H[idx].getBoundingClientRect().left : H[H.length - 1].getBoundingClientRect().right;
      line.style.cssText = `position:fixed;left:${xL - 1.5}px;top:${B0.top}px;width:3px;height:${B0.height}px;background:#e53935;border-radius:2px;z-index:1001;pointer-events:none`; };
    const up = e => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); if (!on) return; hc.style.opacity = ''; if (line) line.remove(); document.body.style.cursor = '';
      e.preventDefault(); const H = heads(), ids = H.map(c => c.dataset.n.replace(/_cell$/, '')), me = hc.dataset.n.replace(/_cell$/, ''), from = ids.indexOf(me);
      const nx = ids.filter(k => k !== me); nx.splice(idx > from ? idx - 1 : idx, 0, me); if (nx.join() !== ids.join()) setSty(blk.dataset.bk, { cols: nx }); };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); }
  // ĐỘ RỘNG CỘT (người dùng 5/11): rê chuột vào vạch giữa 2 cột (±5px) → con trỏ ↔, kéo = đổi bề rộng 2 cột kề nhau (tổng giữ nguyên, mỗi cột ≥ 8% bảng)
  const visCells = row => [...row.children].filter(c => /_cell$/.test(c.dataset.n || '') && c.style.display !== 'none').sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
  function edgePair(ev, cell) { const H = visCells(cell.parentElement), i = H.indexOf(cell), r = cell.getBoundingClientRect(), E = 5;
    if (r.right - ev.clientX < E && ev.clientX - r.right < E && i < H.length - 1) return [H[i], H[i + 1]]; if (ev.clientX - r.left < E && r.left - ev.clientX < E && i > 0) return [H[i - 1], H[i]]; return null; }
  function colResize(ev, blk, ca) { ev.preventDefault(); ev.stopPropagation(); { const a = document.activeElement; if (a && a.isContentEditable) a.blur(); } window.getSelection().removeAllRanges();
    const H = visCells(ca.parentElement), ia = H.indexOf(ca), W0 = H.map(c => c.getBoundingClientRect().width), tot = W0.reduce((x, y) => x + y, 0), mn = tot * 0.08, x0 = ev.clientX, id = c => c.dataset.n.replace(/_cell$/, '');
    let cw = null; document.body.classList.add('bk-colrs');
    const mv = e => { const pair = W0[ia] + W0[ia + 1], wa = Math.min(pair - mn, Math.max(mn, W0[ia] + e.clientX - x0)), ws = W0.slice(); ws[ia] = wa; ws[ia + 1] = pair - wa;
      cw = {}; H.forEach((c, i) => { cw[id(c)] = Math.round(ws[i] / tot * 1000) / 10; });
      document.querySelectorAll(`#bookView [data-bk="${CSS.escape(blk.dataset.bk)}"]`).forEach(t => B.colLayout(t, { cw })); };
    const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); document.body.classList.remove('bk-colrs'); if (cw) setSty(blk.dataset.bk, { cw: Object.assign({}, (smap()[blk.dataset.bk] || {}).cw, cw) }); };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); }
  { const st = document.createElement('style'); st.textContent = '.bk-colrs, .bk-colrs * { cursor: col-resize !important; }'; document.head.appendChild(st); }
  function showStyBar(wrap, blk, subEl) { document.querySelectorAll('.bk-sty-tb, .bk-sty-sel').forEach(x => x.remove()); const key = blk.dataset.bk; if (!key) return;
    const sig = subEl ? subSig(subEl) : null, all = smap()[key] || {}, cur = sig ? (all.sub || {})[sig] || {} : all, tgt = subEl || blk, W = wrap.getBoundingClientRect(), R = tgt.getBoundingClientRect();
    const sel = document.createElement('div'); sel.className = 'bk-sty-sel'; sel.style.cssText = `position:absolute;left:${R.left - W.left}px;top:${R.top - W.top}px;width:${R.width}px;height:${R.height}px;outline:1.5px dashed #7c5cd6;pointer-events:none;z-index:6`; wrap.appendChild(sel);
    const tb = document.createElement('div'); tb.className = 'bk-sty-tb';
    tb.style.cssText = `position:fixed;left:${R.left}px;top:${Math.max(4, R.top - 38)}px;display:flex;gap:6px;align-items:center;white-space:nowrap;background:#fff;color:#1b1a17;border:1px solid #d6d0ea;border-radius:6px;padding:3px;box-shadow:0 2px 6px rgba(0,0,0,.15);z-index:1000;font-size:12px`;   /* nổi trên trang – không bị khung trang che (người dùng 4/11) */
    const grp = () => { const g = document.createElement('div'); g.style.cssText = 'display:flex;align-items:center;gap:1px;border:1px solid #cfc6ea;border-radius:5px;padding:1px;background:#faf8ff'; tb.appendChild(g); return g; };
    const bt = (g, t, tip, f, on) => { const x = document.createElement('button'); x.type = 'button'; x.textContent = t; x.title = tip; x.style.cssText = `border:0;background:${on ? '#ece6fb' : 'none'};border-radius:4px;padding:2px 7px;cursor:pointer;font:inherit;font-weight:600;color:#3a2f6b`;
      x.onpointerdown = e => { e.preventDefault(); e.stopPropagation(); }; x.onclick = e => { e.stopPropagation(); f(); }; g.appendChild(x); return x; };
    const fz = cur.fz || 1, g1 = grp();
    bt(g1, 'A−', 'Chữ nhỏ hơn (thấp nhất 70%)', () => setSty(key, { fz: fz - 0.1 }, sig)).disabled = fz <= 0.7;
    const lb = document.createElement('span'); lb.textContent = Math.round(fz * 100) + '%'; lb.style.cssText = 'min-width:38px;text-align:center;color:#555'; g1.appendChild(lb);
    bt(g1, 'A+', 'Chữ to hơn (cao nhất 150%) – khối to ra tự sang trang sau', () => setSty(key, { fz: fz + 0.1 }, sig)).disabled = fz >= 1.5;
    const AL = a => { const L = [16, 10, 16, 10].map((w, i) => { const x = a === 'left' ? 2 : a === 'right' ? 18 - w : (20 - w) / 2; return `<rect x="${x}" y="${3 + i * 4}" width="${w}" height="1.8" rx=".6"/>`; }).join(''); return `<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style="display:block">${L}</svg>`; };
    const g2 = grp(); [['left', 'Căn trái'], ['center', 'Căn giữa'], ['right', 'Căn phải']].forEach(([a, tip]) => { const x = bt(g2, '', tip, () => setSty(key, { ta: cur.ta === a ? '' : a }, sig), cur.ta === a); x.innerHTML = AL(a); x.style.padding = '3px 5px'; });
    { const g4 = grp(); [['b', 'B', 'In đậm', 'font-weight:800'], ['i', 'I', 'In nghiêng', 'font-style:italic;font-family:Georgia,serif'], ['u', 'U', 'Gạch dưới', 'text-decoration:underline']].forEach(([k, t, tip, css]) => { const x = bt(g4, t, tip, () => setSty(key, { [k]: !cur[k] }, sig), !!cur[k]); x.style.cssText += ';' + css + ';min-width:24px'; }); }
    if (blk.dataset.block === 'Block/Table N' && !blk.dataset.dnDlg) { const g5 = grp(), cols = (smap()[key] || {}).cols, role = blk.dataset.role;   // BẢNG: kéo tiêu đề cột để đổi thứ tự (người dùng 4/11)
      const tip = document.createElement('span'); tip.textContent = '⇆ kéo tiêu đề cột · ↔ kéo vạch giữa 2 cột'; tip.title = 'Kéo tiêu đề cột sang trái / phải: đổi thứ tự cột. Rê chuột vào vạch giữa 2 cột (con trỏ ↔) rồi kéo: đổi độ rộng cột'; tip.style.cssText = 'color:#6b5fa0;padding:0 4px;font-size:11px'; g5.appendChild(tip);
      const mine = smap()[key] || {}, gr = (role && smap()['@role:' + role]) || {}, eff = k => mine[k] || gr[k];
      const cell = subEl && subEl.closest('[data-n$="_cell"]'), col = cell && blk.contains(cell) ? cell.dataset.n.replace(/_cell$/, '') : null;   // XOÁ CỘT (5/11): bấm 1 ô của cột rồi bấm Xoá cột
      const nVis = cell ? [...cell.parentElement.children].filter(c => /_cell$/.test(c.dataset.n || '') && c.style.display !== 'none').length : 0;
      const xcm = blk.dataset.xc ? JSON.parse(blk.dataset.xc) : {}, xi = XC[key];
      if (col && xcm[col]) bt(g5, 'Xoá cột', `Bỏ cột "${xcm[col]}" khỏi mọi bảng cùng loại (Excel giữ nguyên)`, () => setSty('@role:' + role, { xcols: (gr.xcols || []).filter(x => x !== xcm[col]) }));
      else if (col && nVis > 1) bt(g5, 'Xoá cột', 'Ẩn cột này trên sách (Excel giữ nguyên) – các cột còn lại giãn ra', () => setSty(key, { hide: (eff('hide') || []).concat(col) }));
      if (role && xi && xi.avail.length && nVis < 8) { const sl = document.createElement('select'); sl.title = 'Thêm 1 cột có sẵn trong file S6 vào mọi bảng cùng loại – dữ liệu tự điền theo từng dòng Excel';   // ＋ CỘT TỪ EXCEL (người dùng 5/11)
        sl.style.cssText = 'border:0;background:none;font:inherit;font-weight:600;color:#3a2f6b;cursor:pointer;max-width:170px'; sl.add(new Option('＋ Cột từ Excel', '')); xi.avail.forEach(k => sl.add(new Option(k, k)));
        sl.onpointerdown = e => e.stopPropagation(); sl.onchange = () => { if (sl.value) setSty('@role:' + role, { xcols: (gr.xcols || []).concat(sl.value) }); }; g5.appendChild(sl); }
      if (mine.hide) bt(g5, 'Hiện lại cột', 'Hiện lại mọi cột đã xoá của bảng này', () => setSty(key, { hide: null }));
      if (mine.cw) bt(g5, 'Độ rộng gốc', 'Về độ rộng cột ban đầu của bảng này', () => setSty(key, { cw: null }));
      if (cols) bt(g5, 'Thứ tự gốc', 'Về thứ tự cột ban đầu của bảng này', () => setSty(key, { cols: null }));
      const pack = { cols: eff('cols') || null, hide: eff('hide') || null, cw: eff('cw') || null };
      if (role && (pack.cols || pack.hide || pack.cw)) bt(g5, 'Áp cho mọi bảng cùng loại', 'Mọi bảng cùng loại trong sách theo thứ tự cột, cột đã xoá và độ rộng cột của bảng này (bảng đã chỉnh riêng giữ nguyên)', () => setSty('@role:' + role, pack)); }
    if (cur.fz || cur.ta || cur.b || cur.i || cur.u || (!sig && cur.rt)) bt(grp(), 'Mặc định', 'Về cỡ chữ, căn lề, kiểu chữ gốc (cả chữ đã in đậm / nghiêng / gạch chân riêng)', () => setSty(key, Object.assign({ fz: 1, ta: '', b: false, i: false, u: false }, sig ? {} : { rt: null }), sig));
    document.body.appendChild(tb); { const r = tb.getBoundingClientRect(), vw = document.documentElement.clientWidth; if (r.right > vw - 8) tb.style.left = Math.max(8, vw - 8 - r.width) + 'px'; if (R.top - 38 < 4) tb.style.top = Math.min(R.bottom + 6, window.innerHeight - r.height - 4) + 'px'; }   // sát mép phải → lùi vào; sát mép trên → đặt dưới khung
    const sc0 = scroller(), mv = () => { if (!tb.isConnected) return sc0.removeEventListener('scroll', mv); const r2 = tgt.getBoundingClientRect(), r = tb.getBoundingClientRect(), vw = document.documentElement.clientWidth; tb.style.left = Math.max(8, Math.min(r2.left, vw - 8 - r.width)) + 'px'; tb.style.top = (r2.top - 38 < 4 ? r2.bottom + 6 : r2.top - 38) + 'px'; }; sc0.addEventListener('scroll', mv, { passive: true }); }   // cuộn trang → thanh đi theo khung
  // ĐỊNH DẠNG TỪNG CHỮ trên sách (5/11): bôi đen chữ trong khối → thanh B / I / U nổi (web/rt.js); lưu vào kiểu của khối (rt), áp khi dựng khối – trước khi xếp trang
  if (root.PLS_RT) root.PLS_RT.register({ anchorOf: n => { const blk = n.closest && n.closest('#bookView [data-bk]'); if (!blk) return null; const a = n.closest('[data-n]'); return a && blk.contains(a) ? a : blk; },
    onOp: (a, op) => { const blk = a.closest('[data-bk]'), key = blk.dataset.bk, prev = (smap()[key] || {}).rt || []; setSty(key, { rt: prev.concat(Object.assign({ s: B.subSig(a) }, op)) }); } });
  document.addEventListener('pointerdown', e => { if (e.target.closest && (e.target.closest('.bk-sty-tb') || e.target.closest('#bookView [data-bk]') || e.target.closest('#bookView [data-mv], #bookView [data-ik], #bookView .bk-letter [data-field]'))) return; document.querySelectorAll('.bk-sty-tb, .bk-sty-sel').forEach(x => x.remove()); });
  function cellsWith(needle, buoi) { const out = [];
    for (const kind of ['s6', 's5']) for (const [sh, rows] of Object.entries((S.book || {})[kind] || {})) { if (!Array.isArray(rows)) continue;
      rows.forEach(r => { if (!r || typeof r !== 'object' || !r.__r) return; if (buoi && 'Buổi' in r && Number(String(r['Buổi']).replace(',', '.')) !== Number(buoi)) return; if (buoi && !('Buổi' in r)) return;
        for (const [k, v] of Object.entries(r)) if (typeof v === 'string' && v.includes(needle)) out.push({ kind, sh, r: r.__r, key: k, row: r }); }); }
    return out; }
  function setCell(c, val) { c.row[c.key] = val; const bk = S.book; bk.cellEdits = (bk.cellEdits || []).filter(e => !(e.kind === c.kind && e.sh === c.sh && e.r === c.r && e.key === c.key)).concat({ kind: c.kind, sh: c.sh, r: c.r, key: c.key, val }); }
  async function afterEdit(msg) { try { const st = S, names = [st.srcFiles && st.srcFiles.s6, st.srcFiles && st.srcFiles.s5].filter(Boolean).map(x => x.name); if (I.saveRecent && names.length) await I.saveRecent(S.book, names, st.srcFiles); } catch (e) { /* */ }
    if (root.PLS_QC) root.PLS_QC.refresh(); if (I.setStatus) I.setStatus(msg); if (I.rebuildKeep) await I.rebuildKeep(); await build(); }
  // SỬA ĐÚNG Ô (6/11): chữ trên sách mang địa chỉ ô S6 (data-cell = [[tab, dòng, cột], …] theo từng dòng chữ) → ghi đúng 1 ô, không dò chữ
  // (dò chữ dễ sửa nhầm ô khác cùng chữ: "jī" trong nhiều bảng, "trà" ở từ vựng). Không có địa chỉ / không khớp → dò chữ như cũ.
  function cellEdit(map, o, n) {
    const ol = o.split('\n'), nl = n.split('\n'); if (ol.length !== nl.length) return null;
    const li = ol.findIndex((x, i) => x !== nl[i]); if (li < 0) return null;
    const ref = map[Math.min(li, map.length - 1)]; if (!ref) return null; const [sh, r, key] = ref, rows = ((S.book || {}).s6 || {})[sh], row = rows && rows.find(x => x.__r === r);
    if (!row || typeof row[key] !== 'string' && typeof row[key] !== 'number') return null; const v = String(row[key]);
    const strip = t => t.replace(/^\s*→\s*/, ''); let a = strip(ol[li]), b = strip(nl[li]);
    if (v.includes(a) && a.trim()) return { kind: 's6', sh, r, key, row, next: v.split(a).length === 2 ? v.replace(a, b) : null } ;
    let p = 0; while (p < a.length && p < b.length && a[p] === b[p]) p++; let s2 = 0; while (s2 < a.length - p && s2 < b.length - p && a[a.length - 1 - s2] === b[b.length - 1 - s2]) s2++;
    const W = /[\s,.;:!?，。！？；：、（）()\[\]“”"]/; let x = p, y = a.length - s2; while (x > 0 && !W.test(a[x - 1])) x--; while (y < a.length && !W.test(a[y])) y++;
    const nd = a.slice(x, y), rp = b.slice(x, b.length - (a.length - y)); if (!nd.trim() || v.split(nd).length !== 2) return null;
    return { kind: 's6', sh, r, key, row, next: v.replace(nd, rp) }; }
  async function bookEdit(buoi, o, n, map) {
    if (o === n) return;
    if (map && map.length) { const c = cellEdit(map, o, n); if (c && c.next != null) { const step = [{ t: 'cell', c, prev: c.row[c.key], next: c.next }]; setCell(c, c.next); undo.push(step); redo.length = 0;
      return afterEdit(`Đã sửa 1 ô Excel (${c.sh.replace(/^S6-/, '')} · dòng ${c.r} · ${c.key}) – sách, slide và "Tải S5-S6 đã sửa" cập nhật · Ctrl+Z để hoàn tác`); } }
    let p = 0; while (p < o.length && p < n.length && o[p] === n[p]) p++;
    let s2 = 0; while (s2 < o.length - p && s2 < n.length - p && o[o.length - 1 - s2] === n[n.length - 1 - s2]) s2++;
    const tries = [[o, n]]; { let a = p, b = o.length - s2; const W = /[\s,.;:!?，。！？；：、（）()\[\]“”"]/; while (a > 0 && !W.test(o[a - 1])) a--; while (b < o.length && !W.test(o[b])) b++; if (b > a) tries.push([o.slice(a, b), n.slice(a, n.length - (o.length - b))]); }
    for (const [nd, rp] of tries) { if (!nd.trim()) continue; let cs = cellsWith(nd, buoi); if (!cs.length && buoi) cs = cellsWith(nd, null);
      if (cs.length) { const step = cs.map(c => ({ t: 'cell', c, prev: c.row[c.key], next: c.row[c.key].split(nd).join(rp) })); step.forEach(x => setCell(x.c, x.next)); undo.push(step); redo.length = 0;
        return afterEdit(`Đã sửa ${cs.length} ô Excel (${cs[0].sh.replace(/^S6-/, '')} · dòng ${cs[0].r}) – sách, slide và "Tải S5-S6 đã sửa" cập nhật · Ctrl+Z để hoàn tác`); } }
    const l = dlist(); l.push({ b: buoi || '', o, n }); dsave(l); undo.push([{ t: 'dom', e: { b: buoi || '', o, n } }]); redo.length = 0;
    return afterEdit('Đã sửa chữ trên sách (chữ dựng sẵn, không có trong Excel – chỉ lưu trên máy này) · Ctrl+Z để hoàn tác'); }
  async function undoRedo(isRedo) { const st = (isRedo ? redo : undo).pop(); if (!st) return; (isRedo ? undo : redo).push(st);
    if (st.every(x => x.t === 'pm')) { st.forEach(x => pmSet(x.k, isRedo ? x.next : x.prev, null, true)); if (I.setStatus) I.setStatus(isRedo ? 'Đã làm lại vị trí' : 'Đã hoàn tác vị trí');
      if (st.some(x => [x.prev, x.next].some(v => v && (v.fz || v.b || v.i || v.u)))) await build(); return; }   // có đổi cỡ / kiểu chữ → dựng lại trang
    if (st.every(x => x.t === 'lsty')) { st.forEach(x => saveLetter(x.kind, '_sty', isRedo ? x.next : x.prev)); if (I.setStatus) I.setStatus(isRedo ? 'Đã làm lại cỡ chữ' : 'Đã hoàn tác cỡ chữ'); return build(); }
    if (st.every(x => x.t === 'sty')) { const m = smap(); st.forEach(x => { const v = isRedo ? x.next : x.prev; if (v) m[x.key] = v; else delete m[x.key]; }); ssave(m); return restyle(st[0].key, isRedo ? 'Đã làm lại cỡ chữ / căn lề' : 'Đã hoàn tác cỡ chữ / căn lề', st[0].sig); }
    st.forEach(x => { if (x.t === 'cell') setCell(x.c, isRedo ? x.next : x.prev); else { const l = dlist(); if (isRedo) l.push(x.e); else { const i = l.map(y => JSON.stringify(y)).lastIndexOf(JSON.stringify(x.e)); if (i >= 0) l.splice(i, 1); } dsave(l); } });
    await afterEdit(isRedo ? 'Đã làm lại' : 'Đã hoàn tác'); }
  document.addEventListener('keydown', e => { if (!B.SIZES[S.view] || !(e.ctrlKey || e.metaKey)) return; const a = document.activeElement; if (a && (a.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(a.tagName))) return;   // đang gõ → hoàn tác của trình duyệt
    const k = e.key.toLowerCase(); if (k === 'z' && !e.shiftKey) { e.preventDefault(); undoRedo(false); } else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); undoRedo(true); } });
  function makeEditable(c, pg) {
    if (/^(cover|back)$/.test(pg.kind || '')) return;
    const cands = [...c.querySelectorAll('*')].filter(e => directText(e) && !e.closest('[data-field]') && !NOEDIT.test(e.dataset.n || '') && !e.closest('[data-n="footer"]'));
    const set = new Set(cands); cands.filter(e => { for (let x = e.parentElement; x && x !== c; x = x.parentElement) if (set.has(x)) return false; return true; }).forEach(e => {
      e.contentEditable = 'plaintext-only'; if (e.contentEditable !== 'plaintext-only') e.contentEditable = 'true'; e.spellcheck = false; e.style.cursor = 'text'; e.style.outline = 'none';
      let o0 = null; e.addEventListener('focus', () => { o0 = e.textContent; e.style.boxShadow = '0 0 0 1px #7c5cd6'; });
      e.addEventListener('keydown', ev => { if (ev.key === 'Escape') { e.textContent = o0; e.blur(); } });
      e.addEventListener('blur', () => { e.style.boxShadow = ''; const n = e.textContent; if (o0 != null && n !== o0) { const dc = e.closest('[data-cell]'); let map = null; try { map = dc ? JSON.parse(dc.dataset.cell) : null; } catch (er) { /* */ } bookEdit(pg.host.dataset.buoi || '', o0, n, map); } o0 = null; }); }); }
  async function build() {
    const box = $('#bookView');   // không xoá trắng trước – giữ trang cũ trên màn hình tới khi dựng xong (người dùng 4/11: giật)
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
      // VẼ LẠI CHỈ TRANG ĐỔI (4/11 – giật): trang nội dung lấy từ bộ nhớ xếp trang (cùng đối tượng trang, cùng số trang, cùng bề rộng) → dùng lại khung đã vẽ
      const v0 = !pg.kind && pg.host.__view; if (v0 && v0.n === pg.n && v0.W === W && !v0.wrap.dataset.dirty) { v0.wrap.querySelectorAll('.bk-sty-tb, .bk-sty-sel').forEach(x => x.remove()); box.append(v0.wrap, v0.lb); return; }
      const wrap = document.createElement('div'); wrap.className = 'book-page'; wrap.style.width = W + 'px'; wrap.style.height = Math.round(h * k) + 'px';
      const c = pg.host.cloneNode(true); c.style.transform = `scale(${k})`; wrap.appendChild(c); if (!/^(intro|outro|thanks)$/.test(pg.kind || '') || !c.querySelector('[data-field]')) makeEditable(c, pg);
      if (pg.kind === 'primer') { c.querySelectorAll('[data-mv]').forEach(e => { e.style.cursor = 'move'; e.title = 'Nhấn giữ và kéo để dịch chuyển'; });
        c.addEventListener('pointerdown', ev => { const e = ev.target.closest && ev.target.closest('[data-mv]');
          if (e && c.contains(e)) { if (ev.shiftKey) { ev.preventDefault(); selSet(mvSel.includes(e) ? mvSel.filter(x => x !== e) : mvSel.filter(x => c.contains(x)).concat(e)); return; } mvDrag(ev, e, k); return; }
          if (ev.target.closest('[data-n="content"]')) marquee(ev, c); }); }
      c.querySelectorAll('[data-block="Block/Table N"]:not([data-dn-dlg]) [data-n="row_0"] > [data-n$="_cell"]').forEach(h => { h.style.cursor = 'grab'; h.querySelectorAll('*').forEach(x => { x.style.cursor = 'grab'; }); h.title = 'Kéo sang trái / phải để đổi thứ tự cột'; });
      if (c.querySelector('[data-block="Block/Table N"]:not([data-dn-dlg])')) c.addEventListener('pointermove', ev => { if (ev.buttons) return; const ce = ev.target.closest && ev.target.closest('[data-block="Block/Table N"]:not([data-dn-dlg]) [data-n$="_cell"]'); c.classList.toggle('bk-colrs', !!(ce && edgePair(ev, ce))); });
      if (c.querySelector('[data-bk]')) { wrap.style.position = 'relative'; c.addEventListener('pointerdown', ev => { const blk = ev.target.closest && ev.target.closest('[data-bk]'); if (!blk || !c.contains(blk)) return;
        if (blk.dataset.block === 'Block/Table N' && !blk.dataset.dnDlg) { const ce = ev.target.closest('[data-n$="_cell"]'), pr = ce && blk.contains(ce) && edgePair(ev, ce); if (pr) return colResize(ev, blk, pr[0]); }
        { const hc = ev.target.closest('[data-n="row_0"] > [data-n$="_cell"]'); if (hc && blk.contains(hc) && blk.dataset.block === 'Block/Table N' && !blk.dataset.dnDlg) colDrag(ev, blk, hc); } const up = x => { let y = x; while (y && y !== blk && (!y.textContent.trim() || /^(base|ruby|rubyunit|rubyglue|rt|py)$/.test(y.dataset.n))) y = y.parentElement && y.parentElement.closest('[data-n]'); return y; };
        let sb = up(ev.target.closest('[data-n]'));
        // bấm lại vào khung ĐANG CHỌN → chọn khung bao ngoài 1 cấp (tới khung lớn nhất) – dòng trong chiếm hết bề ngang thì vẫn lên được khung ngoài (người dùng 4/11)
        const cur = wrap._selEl; if (cur && cur.isConnected && sb && (cur === sb || cur.contains(sb)) && cur !== blk) { let pa = cur.parentElement && cur.parentElement.closest('[data-n]'); while (pa && pa !== blk && blk.contains(pa) && pa.getBoundingClientRect().height <= cur.getBoundingClientRect().height + 1 && pa.getBoundingClientRect().width <= cur.getBoundingClientRect().width + 1) pa = pa.parentElement && pa.parentElement.closest('[data-n]'); sb = blk.contains(pa) ? up(pa) : blk; }
        const t = sb && sb !== blk && blk.contains(sb) ? sb : null; wrap._selEl = t || blk; showStyBar(wrap, blk, t); }); }
      const lb = document.createElement('div'); lb.className = 'muted'; lb.style.cssText = 'text-align:center;margin:-14px 0 18px;font-size:12px';
      lb.textContent = { cover: 'Bìa trước', back: 'Bìa sau', intro: 'Trang ' + pg.n + ' · Mở đầu – bấm vào chữ để sửa', outro: 'Trang ' + pg.n + ' · Kết thúc – bấm vào chữ để sửa' }[pg.kind] || 'Trang ' + pg.n + ' · bấm vào chữ để sửa (Ctrl+Z hoàn tác)';
      if (pg.kind === 'primer') { lb.textContent = 'Trang ' + pg.n + ' · Mở đầu – nhấn giữ và kéo các phần để dịch chuyển, bấm vào chữ để sửa'; const pre = 'p' + (book.pages.filter(x => x.kind === 'primer').indexOf(pg) + 1) + '|';
        lb.dataset.pmPre = pre; if (Object.keys(ppos()).some(x => x.startsWith(pre))) resetBtn(lb); }

      if (pg.kind === 'cover' && pg.host.dataset.edit) {   // BÌA SỬA ĐƯỢC: bấm vào chữ để sửa (giữ nguyên định dạng), nút đổi ảnh minh hoạ / về ảnh gốc / khôi phục chữ
        lb.textContent = 'Bìa trước – bấm vào chữ để sửa';
        c.querySelectorAll('[data-field]').forEach(e => { e.contentEditable = 'plaintext-only'; if (e.contentEditable !== 'plaintext-only') e.contentEditable = 'true'; e.spellcheck = false; e.style.outline = 'none'; e.style.cursor = 'text';
          e.onfocus = () => { e.style.boxShadow = '0 0 0 1px #7c5cd6'; }; e.onblur = () => { e.style.boxShadow = ''; };
          e.oninput = () => { const v = e.innerText.replace(/\n$/, ''); const o = pg.host.querySelector(`[data-field="${e.dataset.field}"]`); if (o) o.textContent = v; saveLetter('cover', e.dataset.field, v); if (B.fitCover) { B.fitCover(pg.host); B.fitCover(c); } }; });   // gõ dài (HSK 2) → chữ tự nhỏ lại cho vừa bìa
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
      if (/^(intro|outro|thanks)$/.test(pg.kind || '')) c.addEventListener('pointerdown', ev => { const el = ev.target.closest && ev.target.closest('[data-ik], .bk-letter [data-field]'); if (el && c.contains(el)) letterBar(el, pg.kind); });   // 5/11: bấm đoạn → cỡ / kiểu chữ
      if (pg.kind === 'intro' || pg.kind === 'outro' || pg.kind === 'thanks') {   // chỉ hai trang lời dẫn được sửa; sửa trên bản xem → ghi vào trang gốc (bản in) + lưu máy
        c.querySelectorAll('[data-field]').forEach(e => { e.contentEditable = 'plaintext-only'; if (e.contentEditable !== 'plaintext-only') e.contentEditable = 'true'; e.spellcheck = false;
          e.oninput = () => { const v = e.innerText.replace(/\n$/, ''); const o = pg.host.querySelector(`[data-field="${e.dataset.field}"]`); if (o) o.textContent = v; saveLetter(pg.kind, e.dataset.field, v); if (B.fitLetter) { B.fitLetter(pg.host); B.fitLetter(c); } }; });   // gõ dài → tự thu chữ cho vừa trang (cả bản in lẫn bản xem)
        const rs = document.createElement('button'); rs.type = 'button'; rs.className = 'btn'; rs.textContent = 'Khôi phục nội dung từ file'; rs.style.cssText = 'margin-left:8px;font-size:12px;padding:2px 8px';
        rs.onclick = () => { resetLetter(pg.kind); build(); }; lb.appendChild(rs); }
      if (!pg.kind) pg.host.__view = { wrap, lb, n: pg.n, W }; box.append(wrap, lb); });
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
    S.aud = 'teacher'; }   // 5/11: bỏ ô chọn Giáo viên / Học viên (người dùng) – luôn bản giáo viên

  function setView(v) {
    if (v === 'A4') v = '19x27';   // khổ A4 đã bỏ (người dùng 29/10)
    S.view = v; const rs = v === 'research', bk = !!B.SIZES[v];
    document.body.classList.toggle('research', rs);   // tab NGHIÊN CỨU (người dùng chốt 23/10): che slide/sách, hiện #researchView – xem research.js
    if (rs) { if ($('#view').value !== v) $('#view').value = v; if (S.segSync) S.segSync(); if (root.PLS_RESEARCH) root.PLS_RESEARCH.show(); return Promise.resolve(); }
    $('#canvas').hidden = bk; $('#bookView').hidden = !bk; { const nb = $('#notesBox'); if (nb) nb.hidden = bk; } document.querySelector('nav').style.display = bk ? 'none' : '';
    { const ba = $('#btnAll'); if (ba) { ba.textContent = bk ? 'Xuất sách PDF' : (S.aud === 'student' ? 'Xuất bản HV' : 'Xuất bài'); ba.title = bk ? 'Mở hộp thoại in sách khổ 19×27 → chọn "Lưu dưới dạng PDF". Không tải PPTX.' : 'Tải PPTX về máy.'; } }
    $('#btnPdf').hidden = !bk; if ($('#btnBookPptx')) $('#btnBookPptx').hidden = !bk; const mw = document.querySelector('.menuwrap'); if (mw) mw.style.display = bk ? 'none' : '';
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
      { const wb = document.createElement('button'); wb.type = 'button'; wb.className = 'whole'; wb.setAttribute('role', 'switch');   // NÚT GẠT (người dùng 5/11): gạt trái = Cả khoá, gạt phải = Bài lẻ
        wb.innerHTML = '<i class="knob" aria-hidden="true"></i><span class="l">Cả khoá</span><span class="r">Bài lẻ</span>'; wb.title = 'Gạt trái: cả khoá trong một cuốn (mục lục + số trang liên tục) · gạt phải: chỉ buổi đang chọn';
        const sync = () => { wb.setAttribute('aria-pressed', String(!!S.whole)); wb.setAttribute('aria-checked', String(!!S.whole)); wb.setAttribute('aria-label', S.whole ? 'Đang xem cả khoá – bấm để xem bài lẻ' : 'Đang xem bài lẻ – bấm để xem cả khoá'); }; sync();
        wb.onclick = () => { S.whole = !S.whole; sync(); build(); }; sz.appendChild(wb); }
      const cs = document.createElement('style'); cs.textContent = '.seg-sz{margin-left:8px}.seg-sz[hidden]{display:none!important}.seg-sz button[aria-checked="true"]{background:var(--ui-ink);color:var(--ui-bg);border-radius:999px}.seg-sz button.whole{margin-left:8px;position:relative;display:inline-grid;grid-template-columns:1fr 1fr;align-items:center;padding:2px;border-radius:999px;border:1px solid var(--ui-line);background:var(--ui-beige,var(--ui-bg));color:var(--ui-ink);cursor:pointer;font:inherit}.seg-sz button.whole span{position:relative;z-index:1;padding:4px 12px;text-align:center;white-space:nowrap;transition:color .25s}.seg-sz button.whole .knob{position:absolute;top:2px;bottom:2px;left:2px;width:calc(50% - 2px);border-radius:999px;background:var(--ui-ink);transition:transform .25s ease}.seg-sz button.whole[aria-pressed="false"] .knob{transform:translateX(100%)}.seg-sz button.whole[aria-pressed="true"] .l,.seg-sz button.whole[aria-pressed="false"] .r{color:var(--ui-bg)}'; document.head.appendChild(cs);
      S.szEl = sz; S.szSync = () => { const on = /^(A4|19x27)$/.test(sel.value); sz.hidden = !on; if (on) S.bookSize = sel.value; sz.querySelectorAll('button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.v === sel.value))); }; }
    sel.hidden = true; sel.after(seg); if (S.szEl) seg.after(S.szEl); requestAnimationFrame(sync); if (window.ResizeObserver) new ResizeObserver(sync).observe(seg); else window.addEventListener('resize', sync); S.segSync = sync; }   // thanh trượt hiện ra (hết màn hình bắt đầu) → đo lại vị trí
  $('#btnPdf').onclick = () => exportPdf();
  // XUẤT SÁCH PPTX 1:1 (người dùng 5/11 – sửa ngoài web / đưa lên Canva): web/book-pptx.js
  async function exportBookPptx(perLine) { const bt = $('#btnBookPptx'); if (!book) await build(); if (!book || !root.PLS_BOOK_PPTX) return null;
    await ensureFonts(S.brand); const t0 = bt.textContent; bt.disabled = true;
    try { const r = await root.PLS_BOOK_PPTX.exportBook(book.pages, B.SIZES[S.view].mm, pdfName(S.view), (i, n) => { bt.textContent = `Đang xuất ${i + 1}/${n}…`; if (I.setStatus) I.setStatus(`Đang xuất sách PPTX: trang ${i + 1}/${n}…`); }, { perLine });
      if (I.setStatus) I.setStatus(`Đã tải ${r.name} (${r.pages} trang, ${(r.bytes / 1048576).toFixed(1)} MB) – mở bằng PowerPoint / Google Slides / Keynote, hoặc kéo vào Canva. Cần cài đúng font để giữ 1:1.`); return r; }
    catch (e) { if (I.setStatus) I.setStatus('Xuất sách PPTX lỗi: ' + e.message); throw e; } finally { bt.disabled = false; bt.textContent = t0; } }
  // 1 kiểu duy nhất: Canva tách khối (người dùng 5/11: bỏ lựa chọn PowerPoint – chưa chỉnh)
  if ($('#btnBookPptx')) $('#btnBookPptx').onclick = () => exportBookPptx(true).catch(e => console.error('[PLS] sách PPTX', e));
  // đang ở tab Sách mà nhập Excel (trang giới thiệu → có bài) → dựng sách luôn
  { let was = document.body.classList.contains('empty'); new MutationObserver(() => { const now = document.body.classList.contains('empty'); if (was && !now && B.SIZES[S.view]) setTimeout(build, 0); was = now; }).observe(document.body, { attributes: true, attributeFilter: ['class'] }); }
  // dựng lại sách khi đổi buổi / brand / font trong chế độ sách
  ['#buoi', '#brand', '#fontMode', '#device'].forEach(q => { const el = $(q); if (el) el.addEventListener('change', () => { if (B.SIZES[S.view]) setTimeout(build, 600); }); });
  Object.assign(P, { exportAll, exportBookPptx: (pl) => exportBookPptx(pl), async book(size) { await setView(size || '19x27'); return book ? { pages: book.pages.length, blocks: book.blocks, warns: book.warns } : 'Chưa có Excel'; }, exportPdf, view: setView, _book: () => book, fonts: () => ensureFonts(S.brand) });
})(typeof window !== 'undefined' ? window : globalThis);
