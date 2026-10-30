// SÁCH A4 / 19×27 + PDF (thay luồng sách của fit_js: spec.blocks → xếp trang → PDF).
// Từ Excel S5/S6 của buổi đang chọn → danh sách khối (Block/* của Figma) → xếp vào trang (A4/Content, 19x27/Content Odd|Even):
// thêm từng khối, tràn thì sang trang mới; tiêu đề mục không đứng cuối trang (mồ côi); bảng/bài tập dài tách thành nhiều khối.
// Xuất PDF = in trang bằng trình duyệt (chữ vẫn là chữ, không phải ảnh) với @page đúng khổ.
(function (root) {
  const S = v => (v == null ? '' : String(v)).trim();
  const chunk = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };
  // chia đều (33 từ / 8 dòng → 7·7·7·6·6, không để bảng cuối lẻ 1 dòng)
  const chunkEven = (a, n) => { const k = Math.ceil(a.length / n) || 1, sz = Math.ceil(a.length / k); return chunk(a, sz); };
  // nhóm âm: "Thanh mẫu – âm hai môi (âm mũi)" → cụm "Thanh mẫu", tiểu nhóm "âm hai môi (âm mũi)"
  const pronKey = r => String(r['Bảng chữ / nhóm âm'] || '').trim().split(/\s+[–—-]\s+/)[0].replace(/\s*\(.*\)\s*$/, '').trim() || String(r['Chữ / âm'] || '').trim();
  const pronSub = r => { const g = String(r['Bảng chữ / nhóm âm'] || '').trim(), m = g.match(/\s+[–—-]\s+(.+)$/); return m ? m[1] : (g.match(/\(([^)]*)\)\s*$/) || [])[1] || ''; };
  const pronClusters = rows => { const m = new Map(); rows.forEach(r => { const k = pronKey(r); if (!m.has(k)) m.set(k, []); m.get(k).push(r); }); return [...m.entries()]; };
  const tab = (book, re) => { const k = Object.keys(book || {}).find(n => re.test(n)); return k ? book[k] : []; };
  const bNum = v => { if (v == null || v === '') return NaN; if (typeof v === 'number') return v; const m = String(v).replace(/,/g, '.').match(/\d+(?:\.\d+)?/); return m ? Number(m[0]) : NaN; };   // "Buổi 1", " 1 ", "1.0" → 1 (28/10)
  const isB = (r, b) => bNum(r['Buổi']) === bNum(b);
  const onPDF = r => !/^không$/i.test(S(r['Lên PDF']));
  const LET = ['A', 'B', 'C', 'D'];
  const TPL = n => !!(root.PLS_TPL && root.PLS_TPL.blocks && root.PLS_TPL.blocks[n]);
  const SIZES = { A4: { page: n => 'A4/Content', mm: [210, 297], label: 'A4' }, '19x27': { page: n => n % 2 ? '19x27/Content Odd' : '19x27/Content Even', mm: [190, 270], label: '19×27' } };

  // ---------- nội dung → khối ----------
  function blocks(books, buoi, brand) {
    const s6 = books.s6 || {}, s5 = books.s5 || {}, out = [], keys = [];
    const info = tab(s6, /Khoá & bài|Khóa & bài/).find(r => isB(r, buoi)) || {};
    const course = Object.fromEntries(tab(s6, /Thông tin khoá|Thông tin khóa/).map(r => [S(r['Mục']), S(r['Nội dung'])]));
    const s5row = tab(s5, /^S5$/).find(r => isB(r, buoi)) || {};
    const B = (comp, data) => out.push({ comp, data });
    // ĐỀ MỤC LỚN theo mẫu sách đã duyệt (Figma "TEST PDF tiếng Anh"): Block/Section Bar = chữ cái A, B, C… to + tên mục + kẻ ngang màu brand
    let secNo = 0, curSec = ''; const SEC = text => (curSec = text, B(TPL('Block/Section Bar') ? 'Block/Section Bar' : 'Block/Section Heading', TPL('Block/Section Bar') ? { letter: String.fromCharCode(65 + secNo++), title: text, lesson: '' } : { text }));
    let exNo = 0; const ex = () => String(++exNo);
    const title = S(info['Tên buổi']) || 'Buổi ' + buoi;
    B('Block/Lesson Header', { lesson: info['Bài'] ? 'Bài ' + Number(info['Bài']) : 'Buổi ' + bNum(buoi),   /* buổi ôn – kiểm tra không có số Bài → ghi Buổi n (28/10) */ 'title.vi': title.replace(/^Bài\s*\d+\s*[–-]\s*/i, ''), /* ô "Bài n" đã có số bài → tên không lặp "Bài n –" (28/10) */ 'title.native': course['Tên khoá'] || '' });
    const objs = S(info['Mục tiêu bài'] || s5row['Mục tiêu bài']).split(/\n|;\s*|(?<=[.!?])\s+(?=[A-ZÀ-ỸĐ])/).map(x => x.replace(/^[-•\d.\s]+/, '').trim()).filter(Boolean).slice(0, 5);
    if (objs.length) { const d = { no: '', title: 'Mục tiêu bài học' }; objs.forEach((t, i) => { d[`obj_${i + 1}.bullet`] = '•'; d[`obj_${i + 1}.text`] = t; }); B('Block/Objectives', d); }

    const pron = tab(s6, /Phát âm/).filter(r => isB(r, buoi) && onPDF(r));
    const F_pron = T => { if (!pron.length) return; SEC(T || 'Phát âm'); 
      // GOM CỤM theo nhóm âm (Thanh mẫu / Vận mẫu / Thanh điệu …): 1 tiêu đề + bảng Âm · Hướng dẫn · Âm tương tự · Ví dụ + 1 bài đọc to gom ví dụ của cả cụm (28/10)
      const capH = s => /\s/.test(s) ? s.replace(/^[a-zà-ỹđ]/, c => c.toUpperCase()) : s;
      for (const [ck, rs] of pronClusters(pron)) { B('Block/Sub Heading', { text: capH(ck) });
        const subs = new Set(rs.map(r => S(r['Bảng chữ / nhóm âm']))).size > 1;
        for (const [pi, part] of chunkEven(rs, 6).entries()) { const d = { 'row_0.c1': 'Bảng chữ / nhóm âm', 'row_0.c2': 'Âm', 'row_0.c3': 'Hướng dẫn phát âm', 'row_0.c4': 'Âm tương tự', 'row_0.c5': 'Ví dụ' };
          part.forEach((r, i) => { d[`row_${i + 1}.c1`] = S(r['Bảng chữ / nhóm âm']); d[`row_${i + 1}.c2`] = S(r['Chữ / âm']); d[`row_${i + 1}.c3`] = S(r['Hướng dẫn phát âm']); d[`row_${i + 1}.c4`] = S(r['Chữ phát âm tương tự']); d[`row_${i + 1}.c5`] = S(r['Ví dụ']); });
          B('Block/Table N', d); out[out.length - 1].role = 'pron'; if (pi) out[out.length - 1].cont = true; }
        /* bỏ bài "Đọc to các từ sau" – ví dụ đã nằm trong bảng (người dùng 28/10) */ } };

    const vocab = tab(s6, /Từ vựng$/).filter(r => isB(r, buoi) && onPDF(r) && S(r['Từ']));
    const F_vocab = T => { if (!vocab.length) return; SEC(T || 'Từ vựng'); 
      for (const [pi, part] of chunkEven(vocab, 8).entries()) { const d = { 'row_0.c1': 'Từ', 'row_0.c2': 'Phiên âm', 'row_0.c3': 'Loại từ', 'row_0.c4': 'Nghĩa', 'row_0.c5': 'Ví dụ' }; part.forEach((r, i) => { d[`row_${i + 1}.c1`] = S(r['Từ']); d[`row_${i + 1}.c2`] = S(r['Phiên âm / cách đọc']); d[`row_${i + 1}.c3`] = S(r['Loại từ']); d[`row_${i + 1}.c4`] = S(r['Nghĩa']); d[`row_${i + 1}.c5`] = [S(r['Ví dụ 1']), S(r['Phiên âm ví dụ 1']), S(r['Nghĩa ví dụ 1'])].filter(Boolean).join('\n'); }); B('Block/Table N', d); out[out.length - 1].role = 'vocab'; if (pi) out[out.length - 1].cont = true; } };

    const grammar = tab(s6, /Ngữ pháp$/).filter(r => isB(r, buoi) && onPDF(r));
    const gq = tab(s6, /Câu hỏi ngữ pháp/).filter(r => isB(r, buoi) && onPDF(r));
    const F_grammar = T => { if (!grammar.length) return; SEC(T || 'Ngữ pháp'); 
      for (const [gi, g] of grammar.entries()) {
        B('Block/Sub Heading', { text: `${gi + 1}. ` + [S(g['Tên ngữ pháp']), S(g['Nghĩa'])].filter(Boolean).join(' – ') });   // điểm ngữ pháp đánh số 1, 2… trong mục
        // nhãn "Cấu trúc" chỉ ở dòng đầu, các dòng sau để trống nhãn → các công thức xếp thẳng một cột
        let lastLab = null; for (const l of S(g['Cấu trúc (công thức)']).split('\n').map(S).filter(Boolean).slice(0, 4)) { const m = l.match(/^([^:+]{2,32}):\s*(.+)$/); const lab = m ? m[1] : 'Cấu trúc'; B('Block/Structure', { label: lab === lastLab ? '\u00a0' : lab, formula: m ? m[2] : l }); lastLab = lab; }
        if (S(g['Cách sử dụng'])) B('Block/Paragraph', { text: S(g['Cách sử dụng']) });
        const d = {}; [1, 2, 3].forEach(i => { if (S(g['Ví dụ ' + i])) { d[`ex_${i}.de`] = S(g['Ví dụ ' + i]); d[`ex_${i}.vi`] = S(g['Nghĩa ví dụ ' + i]); } }); if (Object.keys(d).length) B('Block/Example Box', d);
        if (S(g['Lưu ý'])) B('Block/Note Box', { title: 'Lưu ý', text: S(g['Lưu ý']) });
      }
      const gqs = gq.filter(q => grammar.some(g => S(g['Mã mục']) === S(q['Mã ngữ pháp'])));
      if (gqs.length) { B('Block/Sub Heading', { text: 'Luyện tập' }); out[out.length - 1].role = 'practice'; exercises(gqs, ''); }   // bài tập tách khỏi điểm ngữ pháp cuối, có tiêu đề riêng
    };

    const speak0 = tab(s6, /Mẫu câu/).filter(r => isB(r, buoi) && onPDF(r) && S(r['Câu']));
    const F_speak = (T, only) => { const speak = only ? speak0.filter(only) : speak0; if (!speak.length) return; SEC(T || 'Mẫu câu giao tiếp'); 
      // THEO ĐÚNG BẢNG S6 (người dùng 28/10): giữ thứ tự dòng; đoạn liền nhau cùng "Chủ đề / tình huống" (+ Loại khi trống) = 1 bảng, tiêu đề nguyên văn
      const blks = []; speak.forEach(r => { const t = S(r['Chủ đề / tình huống']).replace(/^none$/i, ''), lo = S(r['Loại']), l = blks[blks.length - 1]; if (l && l.t === t && (t || l.lo === lo)) l.rows.push(r); else blks.push({ t, lo, rows: [r] }); });
      for (const bl of blks) { B('Block/Sub Heading', { text: bl.t || bl.lo || 'Mẫu câu' });
        const hasV = bl.rows.some(r => S(r['Vai'])), hasT = bl.rows.some(r => S(r['Từ thay thế'])); const cols = [...(hasV ? [['Vai', 'Vai']] : []), ['Câu', 'Câu'], ['Phiên âm', 'Phiên âm'], ['Nghĩa', 'Nghĩa'], ...(hasT ? [['Từ thay thế', 'Từ thay thế']] : [])];
        for (const [pi, part] of chunkEven(bl.rows, 8).entries()) { const d = {}; cols.forEach(([h], c) => { d[`row_0.c${c + 1}`] = h; }); part.forEach((r, i) => cols.forEach(([, k], c) => { d[`row_${i + 1}.c${c + 1}`] = S(r[k]); }));
          B('Block/Table N', d); out[out.length - 1].role = 'speak' + cols.length + (hasV ? 'v' : ''); if (pi) out[out.length - 1].cont = true; } } };

    const segs = (rows, tk) => { const m = new Map(); rows.forEach(r => { const x = S(r['Mã đoạn']) || S(r[tk]); if (!m.has(x)) m.set(x, []); m.get(x).push(r); }); return [...m.values()]; };   // QC F03/F04: tách đoạn theo tiêu đề
    const lis = tab(s6, /^S6-Nghe$/).filter(r => isB(r, buoi) && onPDF(r) && S(r['Câu'])), lq = tab(s6, /Nghe câu hỏi/).filter(r => isB(r, buoi) && onPDF(r));
    const F_listen = T => { if (!(lis.length || lq.length)) return; SEC(T || 'Nghe'); 
      for (const c of [...new Set(lis.map(r => S(r['Mã bài'])).concat(lq.map(r => S(r['Mã bài']))))].filter(Boolean)) {
        const ls = lis.filter(r => S(r['Mã bài']) === c).sort((a, b) => (+a['Câu số'] || 0) - (+b['Câu số'] || 0)); const r0 = ls[0] || {};
        B('Block/Sub Heading', { text: [S(r0['Tiêu đề bài nghe']), S(r0['Nghĩa tiêu đề'])].filter(Boolean).join(' – ') || c });
        exercises(lq.filter(r => S(r['Mã bài']) === c), '');
        for (const g of segs(ls, 'Tiêu đề bài nghe')) { const r1 = g[0] || {};
        if (g.length) { B('Block/Paragraph', { text: 'Lời bài nghe' + (S(r1['Tiêu đề bài nghe']) ? ': ' + S(r1['Tiêu đề bài nghe']) : '') }); out[out.length - 1].role = 'label'; }
        for (const part of chunk(g, 4)) { const d = {}; part.forEach((r, i) => { d[`line_${i + 1}.speaker`] = S(r['Vai / nhân vật']) || '–'; d[`line_${i + 1}.de`] = S(r['Câu']); d[`line_${i + 1}.vi`] = S(r['Nghĩa']); }); B('Block/Dialogue', d); } }
      } };

    const rd = tab(s6, /^S6-Đọc$/).filter(r => isB(r, buoi) && onPDF(r) && S(r['Câu'])), rq = tab(s6, /Đọc câu hỏi/).filter(r => isB(r, buoi) && onPDF(r));
    const F_read = T => { if (!(rd.length || rq.length)) return; SEC(T || 'Đọc'); 
      for (const c of [...new Set(rd.map(r => S(r['Mã bài'])).concat(rq.map(r => S(r['Mã bài']))))].filter(Boolean)) {
        const ls = rd.filter(r => S(r['Mã bài']) === c).sort((a, b) => ((+a['Đoạn'] || 0) - (+b['Đoạn'] || 0)) || ((+a['Câu số'] || 0) - (+b['Câu số'] || 0))); const r0 = ls[0] || {};
        for (const g of segs(ls, 'Tiêu đề bài đọc')) { const r1 = g[0] || {};
        const paras = []; let cur = null; for (const r of g) { const p = String(r['Đoạn'] || 1); if (!cur || cur.p !== p) paras.push(cur = { p, t: [], v: [] }); cur.t.push(S(r['Câu'])); cur.v.push(S(r['Nghĩa'])); }
        paras.forEach((p, i) => B('Block/Reading', { tag: i ? '' : 'Bài đọc', title: i ? '' : ([S(r1['Tiêu đề bài đọc']), S(r1['Nghĩa tiêu đề'])].filter(Boolean).join(' – ') || c), text: p.t.join(' '), 'text.vi': '' })); }
        exercises(rq.filter(r => S(r['Mã bài']) === c), '');
      } };

    // HÁN TỰ (S6-Hán tự): bảng chữ – âm đọc – nghĩa – bộ thủ
    const hz = tab(s6, /Hán tự$/).filter(r => isB(r, buoi) && onPDF(r) && S(r['Hán tự']));
    const F_hanzi = T => { if (!hz.length) return; SEC(T || 'Hán tự');
      for (const [pi, part] of chunkEven(hz, 8).entries()) { const d = { 'row_0.c1': 'Chữ', 'row_0.c2': 'Âm đọc', 'row_0.c3': 'Nghĩa', 'row_0.c4': 'Bộ thủ' }; part.forEach((r, i) => { d[`row_${i + 1}.c1`] = S(r['Hán tự']); d[`row_${i + 1}.c2`] = S(r['Âm đọc']); d[`row_${i + 1}.c3`] = S(r['Nghĩa']); d[`row_${i + 1}.c4`] = S(r['Bộ thủ']); }); B('Block/Table N', d); if (pi) out[out.length - 1].cont = true; } };
    const cu = tab(s6, /Ngoài kiến thức/).filter(r => isB(r, buoi) && onPDF(r) && S(r['Tiêu đề']));
    const F_culture = T => { if (!cu.length) return; SEC(T || 'Văn hoá'); cu.forEach(r => B('Block/Note Box', { title: S(r['Tiêu đề']), text: S(r['Nội dung']) })); };
    // THỨ TỰ MỤC = ĐÚNG THỨ TỰ HOẠT ĐỘNG TRONG S5 (người dùng 28/10 – "cực kì nguy hiểm" nếu lệch): tên mục lấy theo tên bước của S5
    { const gb = s5 || {}, gk = Object.keys(gb).find(k => /Hướng dẫn giảng dạy/.test(k));
      let steps = (gk ? gb[gk] : []).filter(r => isB(r, buoi) && S(r['Hoạt động'])).sort((a, b) => (+a['STT hoạt động'] || 0) - (+b['STT hoạt động'] || 0)).map(r => S(r['Hoạt động']).replace(/\s*\n\s*/g, ' '));
      if (!steps.length) steps = S(s5row['Nội dung buổi (timeline)']).split(/\n+/).map(l => (l.match(/^\s*\d+\.\s*(.+?)\s*:\s*\d+\s*p/i) || [])[1]).filter(Boolean);
      steps = steps.filter(n => !/dặn dò/i.test(n));
      { const RANK = n => /cttt|khai giảng/i.test(n) ? 0 : /từ vựng/i.test(n) ? 1 : /hán tự/i.test(n) ? 2 : /bảng chữ/i.test(n) ? 3 : /phát âm/i.test(n) ? 4 : /mẫu câu|giao tiếp|hội thoại|nói/i.test(n) ? 5 : null;   // cùng thứ tự chốt với slide (28/10)
        const slots = steps.map((x, i) => RANK(x) != null ? i : -1).filter(i => i >= 0), ranked = slots.map(i => steps[i]).sort((a, b) => RANK(a) - RANK(b)); slots.forEach((i, k) => { steps[i] = ranked[k]; }); }
      const KIND = n => /phát âm|bảng chữ/i.test(n) ? 'pron' : /hán tự/i.test(n) ? 'hanzi' : /từ vựng/i.test(n) ? 'vocab' : /ngữ pháp/i.test(n) ? 'grammar' : /mẫu câu|giao tiếp|nói/i.test(n) ? 'speak' : /hội thoại/i.test(n) ? 'dlg' : /^nghe/i.test(n) ? 'listen' : /^đọc/i.test(n) ? 'read' : /văn hó?a|văn hoá/i.test(n) ? 'culture' : null;
      const isDl = r => /hội thoại/i.test(S(r['Loại'])), hasDl = steps.some(n => KIND(n) === 'dlg');
      // bước "Hội thoại" chỉ in dòng Loại = Hội thoại; bước Mẫu câu / Nói in phần còn lại (nếu S5 có bước Hội thoại riêng) – người dùng 28/10
      const F = { culture: F_culture, pron: F_pron, hanzi: F_hanzi, vocab: F_vocab, grammar: F_grammar, speak: T => F_speak(T, hasDl ? r => !isDl(r) : null), dlg: T => F_speak(T, isDl), listen: F_listen, read: F_read }, done = new Set();
      const nice = n => { const t = n.replace(/\s*\d+\s*PHÚT\b/i, '').replace(/\s*\n.*$/, '').trim().toLowerCase(); return t.charAt(0).toUpperCase() + t.slice(1); };
      for (const n of steps) { const k = KIND(n); if (k && !done.has(k)) { done.add(k); F[k](nice(n)); } }
      if (!steps.length) for (const k of ['pron', 'hanzi', 'vocab', 'grammar', 'speak', 'listen', 'read']) F[k]();   // không có S5 → in đủ phần S6 như cũ
      // có S5: CHỈ in các phần có bước trong S5 (người dùng 28/10: nội dung phải khớp S5 + S6, không thêm phần S5 không có)
    }
    const hw = tab(s6, /BTVN/).filter(r => isB(r, buoi) && onPDF(r));
    if (hw.length) { SEC('Bài tập về nhà'); exercises(hw, ''); }
    // TỰ ĐÁNH GIÁ cuối bài (như Cambridge "Review your progress"): mỗi mục tiêu khoanh 3 / 2 / 1
    const hasS5 = (() => { const gb = s5 || {}, gk = Object.keys(gb).find(k => /Hướng dẫn giảng dạy/.test(k)); return !!(gk && gb[gk].some(r => isB(r, buoi))); })();
    /* bỏ mục Tự đánh giá tự sinh – không có trong S5/S6 (người dùng 28/10) */

    if (keys.length) { SEC('Đáp án');
      // ĐÁP ÁN THEO MỤC → THEO BÀI (người dùng chốt 23/10: như sách giáo trình – không dồn 1 khối chữ chạy liền):
      // mỗi mục (Ngữ pháp, Nghe…) 1 tiêu đề con; mỗi bài 1 nhãn "Bài 2 · Làm các câu sau."; có giải thích → bảng Câu | Đáp án | Giải thích,
      // đáp án ngắn không giải thích → lưới 4 cặp Câu – Đáp án / hàng, dài → bảng Câu | Đáp án
      const bySec = []; for (const k of keys) { let g = bySec.find(x => x.sec === k.sec); if (!g) bySec.push(g = { sec: k.sec, ex: [] }); let e = g.ex.find(x => x.no === k.ex); if (!e) g.ex.push(e = { no: k.ex, ins: k.ins, items: [] }); e.items.push(k); }
      for (const g of bySec) {
        if (bySec.length > 1 || g.sec) { B('Block/Sub Heading', { text: g.sec || 'Bài tập' }); }
        for (const e of g.ex) {
          B('Block/Paragraph', { text: `Bài ${e.no} · ${e.ins}` }); out[out.length - 1].role = 'label';
          const why = e.items.some(k => k.why), long = e.items.some(k => k.a.length > 22);
          if (why || long) {
            const head = why ? { 'row_0.c1': 'Câu', 'row_0.c2': 'Đáp án', 'row_0.c3': 'Giải thích' } : { 'row_0.c1': 'Câu', 'row_0.c2': 'Đáp án' };
            for (const [pi, part] of chunkEven(e.items, 8).entries()) { const d = Object.assign({}, head); part.forEach((k, i) => { d[`row_${i + 1}.c1`] = String(k.i); d[`row_${i + 1}.c2`] = k.a || '–'; if (why) d[`row_${i + 1}.c3`] = k.why || ''; });
              B('Block/Table N', d); out[out.length - 1].role = why ? 'ans3' : 'ans2'; if (pi) out[out.length - 1].cont = true; }
          } else {
            const rows = chunk(e.items, 4), d = {}; for (let c = 0; c < Math.min(4, e.items.length); c++) { d[`row_0.c${c * 2 + 1}`] = 'Câu'; d[`row_0.c${c * 2 + 2}`] = 'Đáp án'; }
            for (const [pi, part] of chunk(rows, 8).entries()) { const dd = Object.assign({}, d); part.forEach((r, ri) => r.forEach((k, c) => { dd[`row_${ri + 1}.c${c * 2 + 1}`] = String(k.i); dd[`row_${ri + 1}.c${c * 2 + 2}`] = k.a || '–'; }));
              B('Block/Table N', dd); out[out.length - 1].role = 'ansgrid'; if (pi) out[out.length - 1].cont = true; }
          }
        }
      } }
    return out;

    // bài tập: gom theo phần + dạng → Exercise (trắc nghiệm, viết) / Matching / Sentence Order, tối đa 5 câu/khối; đáp án gom cuối sách
    function exercises(rows, defIns) {
      const groups = []; let g = null;
      for (const r of rows) { const t = S(r['Dạng câu']); const kind = /trắc nghiệm/i.test(t) ? 'mc' : /sắp xếp/i.test(t) ? 'order' : /nối/i.test(t) ? 'match' : /tự luận|viết/i.test(t) && !/tay/i.test(t) ? 'write' : null; if (!kind) continue;
        // trắc nghiệm + điền / viết dùng chung khối Exercise → gom liền nhau thành 1 bài (đánh số 1, 2, 3…), không tách mỗi câu 1 bài
        const ins = S(r['Hướng dẫn làm bài']) || defIns; const fam = kind === 'mc' || kind === 'write' ? 'ex' : kind; const k = S(r['Phần']) + '|' + fam + '|' + ins;
        if (!g || g.k !== k) groups.push(g = { k, kind, ins, kinds: new Set(), rows: [] }); g.kinds.add(kind); g.rows.push(r); }
      for (const gr of groups) if (!gr.ins) gr.ins = [...new Set(gr.rows.map(r => S(r['Dạng câu'])).filter(Boolean))].join(' / ');   // S6 không ghi hướng dẫn → dùng nguyên văn cột Dạng câu, không tự viết (28/10)
      for (const gr of groups) for (const part of chunk(gr.rows, 5)) {
        const no = ex(), d = { no: 'Bài ' + no, instruction: gr.ins || '', 'head.track': '', 'head.ab': '' };
        part.forEach((r, i) => { const n = `${no}.${i + 1}`; let q = S(r['Câu hỏi']).replace(/^\[[^\]]{1,80}\]\s*/, '');
          if (gr.kind === 'match') { d[`item_${i + 1}.no`] = String(i + 1); d[`item_${i + 1}.text`] = q.replace(/^nối\s*[:：]?\s*/i, ''); d[`item_${i + 1}.blank`] = '____'; }
          else if (gr.kind === 'order') { d[`item_${i + 1}.no`] = String(i + 1); d[`item_${i + 1}.words`] = q.replace(/^[^:]{0,60}:\s*/, ''); d[`item_${i + 1}.answer`] = ''; }
          else { const opts = /trắc nghiệm/i.test(S(r['Dạng câu'])) ? LET.map(L => S(r[L])).map((o, j) => o ? `${LET[j]}. ${o}` : '').filter(Boolean) : []; d[`item_${i + 1}.no`] = String(i + 1); d[`item_${i + 1}.text`] = q + (opts.length ? '\n' + opts.join('      ') : '\n______________________________'); }
          const a = S(r['Đáp án']); keys.push({ sec: curSec, ex: no, ins: gr.ins, i: i + 1, why: S(r['Giải thích']), a: /trắc nghiệm/i.test(S(r['Dạng câu'])) && LET.includes(a.toUpperCase().charAt(0)) && S(r[a.toUpperCase().charAt(0)]) ? `${a.toUpperCase().charAt(0)}. ${S(r[a.toUpperCase().charAt(0)])}` : a }); });
        if (gr.kind === 'match') { const rs = part.map(r => S(r['Đáp án'])); const sh = rs.map((_, i) => rs[(i * 2 + 1) % rs.length]); const ok = new Set(sh).size === rs.length; (ok ? sh : rs.slice().reverse()).forEach((m, i) => { d[`item_${i + 1}.key`] = 'abcde'[i]; d[`item_${i + 1}.match`] = m; }); }
        out.push({ comp: gr.kind === 'match' ? 'Block/Matching' : gr.kind === 'order' ? 'Block/Sentence Order' : 'Block/Exercise', data: d });
      }
    }
  }

  // ---------- xếp trang ----------
  // ---------- KHUÔN TRÌNH BÀY SÁCH (người dùng chốt 23/10: phân cấp – lề – cỡ chữ phải thống nhất) ----------
  // 1 thang cỡ chữ, 1 thang khoảng cách, mọi khối thẳng lề trái của vùng nội dung; khoảng cách giữa khối theo QUAN HỆ
  // (mục lớn cách xa, các dòng cùng nhóm sát nhau) thay cho khoảng 14px đều mọi chỗ.
  const BOOK_FS = { 22: 22, 14: 16, 12: 12.5, 11.5: 11, 10: 10.5, 8.5: 9, 8: 8 };          // cỡ mẫu Figma → cỡ sách (pt trên trang 595)
  const BOOK_LH = fs => fs >= 16 ? 1.2 : fs >= 12 ? 1.3 : 1.45;                              // chữ Việt có dấu cần dòng thoáng
  const KIND = (c, b) => b && b.role === 'label' ? 'lab' : /Lesson Header/.test(c) ? 'h1' : /Section (Bar|Heading)/.test(c) ? 'sec' : /Sub Heading/.test(c) ? 'sub' : /Structure/.test(c) ? 'str'
    : /Paragraph/.test(c) ? 'p' : /Objectives/.test(c) ? 'obj' : /Exercise|Matching|Sentence Order|Pronunciation|True False/.test(c) ? 'ex' : /Dialogue/.test(c) ? 'dlg' : /Table/.test(c) ? 'tbl' : 'box';
  // khoảng cách TRƯỚC khối (px) theo khối liền trước
  function SPACE(prev, cur) {
    // THANG KHOẢNG CÁCH (bội 4): 32 trước mục lớn · 20 trước tiêu đề con · 16 giữa các bài tập / khối khác loại · 8 trong cùng một ý · 2 giữa các dòng công thức
    // → mắt thấy ngay đâu là mục mới, đâu là ý mới, đâu là các dòng của cùng một ý.
    const a = prev ? KIND(prev.comp, prev) : null, k = KIND(cur.comp, cur);
    if (!a) return 0;
    if (cur.cont) return 0;                       // bảng nối tiếp: liền với bảng trước như 1 bảng
    if (k === 'sec') return a === 'h1' || a === 'obj' ? 24 : 32;
    if (a === 'sec') return 14;
    if (k === 'sub') return a === 'sub' ? 6 : 20;
    if (a === 'sub') return 8;
    if (k === 'lab') return 16;
    if (a === 'lab') return 6;
    if (k === 'str' && a === 'str') return 2;
    if (k === 'dlg' && a === 'dlg') return 8;
    if (k === 'p' && (a === 'p' || a === 'str')) return 8;
    if (k === 'box' && (a === 'p' || a === 'str')) return 10;
    if (k === 'box' && a === 'box') return 10;
    if (k === 'ex' || a === 'ex') return 16;
    if (a === 'obj' || k === 'tbl') return 12;
    return 12;
  }
  const escH = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const INK = 'var(--color-primary-ink, var(--color-primary, #406864))';
  // ĐOẠN CÓ ĐÁNH SỐ ("1. …" / "1) …"): mỗi ý một dòng, số ở cột riêng 14px, chữ thụt treo thẳng hàng; phần quy tắc trước dấu ":" đậm 600.
  // Thay cho luật F.emph của slide (đậm cả dòng theo đoán nhãn / công thức → dòng 1, 3 đậm, dòng 2 thường – lộn xộn trên sách).
  function richList(te) {
    if (!te) return; const lines = te.textContent.split('\n').map(x => x.trim()).filter(Boolean);
    te.style.whiteSpace = 'normal'; delete te.dataset.emph;
    te.innerHTML = lines.map((l, i) => { const m = l.match(/^(\d+)[.)]\s+(.*)$/);
      if (!m) return `<div style="margin-top:${i ? 4 : 0}px">${escH(l)}</div>`;
      const c = m[2].indexOf(': '); const body = c > 0 && c < 80 ? `<span style="font-weight:600">${escH(m[2].slice(0, c + 1))}</span>${escH(m[2].slice(c + 1))}` : escH(m[2]);
      return `<div style="display:flex;gap:6px;margin-top:${i ? 3 : 0}px"><span style="flex:0 0 14px;font-weight:600;color:${INK}">${m[1]}.</span><span style="flex:1 1 0px;min-width:0">${body}</span></div>`; }).join('');
  }
  // ĐÁP ÁN TRẮC NGHIỆM: xếp lưới cột đều (4 cột nếu ngắn, 2 cột nếu vừa, 1 cột nếu dài) thay cho cách nhau bằng dấu cách → các A/B/C/D thẳng cột giữa các câu.
  function optionGrid(te) {
    const lines = te.textContent.split('\n'); const last = (lines[lines.length - 1] || '').trim(); if (!/^A\.\s/.test(last)) return;
    const opts = last.split(/\s{2,}(?=[A-F]\.\s)/).map(x => x.trim()); if (opts.length < 2) return;
    const L = Math.max(...opts.map(o => o.length)), cols = L <= 18 ? Math.min(4, opts.length) : L <= 38 ? 2 : 1;
    te.style.whiteSpace = 'normal';
    te.innerHTML = `<div style="white-space:pre-wrap">${escH(lines.slice(0, -1).join('\n'))}</div><div style="display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));column-gap:12px;row-gap:2px;margin-top:3px">`
      + opts.map(o => `<span><span style="font-weight:600">${escH(o.slice(0, 2))}</span>${escH(o.slice(2))}</span>`).join('') + '</div>';
  }
  // SÁCH ĐẮC NHÂN theo giáo trình HSK1 bản 4.1 (người dùng 29/10 – chỉ học kiểu khớp dữ liệu S6): đề mục "(A) TÊN MỤC" căn giữa, tiêu đề ngữ pháp đỏ in hoa kẻ đôi,
  // nhãn "Định nghĩa / Ví dụ minh hoạ / Cấu trúc" nền cam nhạt, công thức trong khung viền cam, ví dụ số ①② + "→ nghĩa", bài tập "1. TÊN BÀI" + câu ①②, bảng đầu cam chữ trắng kẻ ngang nét đứt.
  const DN_RED = 'var(--color-primary-dark, #b33e00)', DN_OR = 'var(--color-primary, #e65100)', DN_SOFT = '#fdebdd';
  const CIRC = n => n >= 1 && n <= 20 ? String.fromCharCode(0x2460 + n - 1) : n + '.';
  const dnPill = t => Object.assign(t.style, { display: 'inline-block', alignSelf: 'flex-start', background: DN_SOFT, color: DN_RED, fontWeight: '700', padding: '2px 9px', borderRadius: '2px', textTransform: 'none' });
  // PINYIN {…} trong sách (người dùng 29/10: ô viền dày "rối quá"): chữ cam nhỏ đứng sau chữ Hán, không khung; {…} còn sót trong chữ thường cũng đổi
  const dnPinyin = el => {
    el.querySelectorAll('[data-n="tk_n"]').forEach(t => Object.assign(t.style, { boxShadow: 'none', background: 'none', padding: '0', borderRadius: '0', color: DN_OR, fontWeight: '600', fontSize: '0.92em', display: 'inline-block', maxWidth: '100%' }));   // cụm pinyin: chung dòng nếu đủ chỗ, không thì xuống dòng nguyên cụm (người dùng 29/10)
    const PY = /\{([^{}|]+)\}/g;
    el.querySelectorAll('[data-text]').forEach(t => { if (!/\{[^{}|]+\}/.test(t.textContent)) return;
      const tw = document.createTreeWalker(t, NodeFilter.SHOW_TEXT), nodes = []; while (tw.nextNode()) nodes.push(tw.currentNode);
      nodes.forEach(n => { if (!/\{[^{}|]+\}/.test(n.nodeValue)) return; const sp = document.createElement('span');
        sp.innerHTML = escH(n.nodeValue).replace(PY, `\u2009<span data-seg="py" style="color:${DN_OR};font-weight:600;font-size:0.92em;display:inline-block;max-width:100%">$1</span>`); n.replaceWith(...sp.childNodes); }); });   // cách mảnh trước pinyin: 的 de, không dính "的de"
  };
  // CHỮ HÁN TRONG TIÊU ĐỀ (người dùng 29/10: "tiêu đề đỏ đậm thấy nhỏ và mờ"): Khải thư không có nét đậm → tiêu đề dùng Noto Sans SC đậm, cỡ bằng chữ Việt
  const HAN_ST = "font-family:'Noto Sans SC','LXGW WenKai',sans-serif;font-weight:800;font-size:1em";
  const dnHanBold = root0 => { root0.querySelectorAll('[data-n="base"]').forEach(b => { if (/[\u3400-\u9fff]/.test(b.textContent)) b.style.cssText += ';' + HAN_ST; });
    const tw = document.createTreeWalker(root0, NodeFilter.SHOW_TEXT), ns = []; while (tw.nextNode()) ns.push(tw.currentNode);
    ns.forEach(n => { if (!/[\u3400-\u9fff]/.test(n.nodeValue) || (n.parentElement && n.parentElement.dataset.n === 'base')) return; const sp = document.createElement('span');
      sp.innerHTML = escH(n.nodeValue).replace(/([\u3400-\u9fff\u3000-\u303f“”"……]+)/g, `<span data-seg="han" style="${HAN_ST}">$1</span>`); n.replaceWith(...sp.childNodes); }); };
  // PINYIN TRÊN CHỮ HÁN như giáo trình gốc (người dùng 29/10): ví dụ ngữ pháp = 1 dòng pinyin nhỏ phía trên câu; câu sắp xếp "A 女儿 / B 是" = pinyin trên từng cụm.
  // Tra bằng pinyin-pro (vendor, MIT); câu đã có pinyin (dấu thanh) thì bỏ qua.
  const PYM = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/, HANR = /[\u3400-\u9fff]/;
  const PUN = { '。': '.', '，': ',', '！': '!', '？': '?', '、': ',', '：': ':', '；': ';', '“': '"', '”': '"', '（': '(', '）': ')' };
  // GHÉP PINYIN THEO TỪ ("lǎoshī", không "lǎo shī" – người dùng 29/10): pinyin-pro chỉ ghép từ đa âm → tự ghép theo từ điển:
  // từ HSK1 thông dụng + mọi từ trong bảng từ vựng các bài đã dựng (DN_WORDS, paginate nạp vào). Âm tiết sau bắt đầu a/o/e → thêm dấu ' (nǚ'ér).
  const DN_WORDS = new Set('老师 学生 同学 中文 汉语 中国 美国 法国 越南 英国 日本 北京 朋友 爸爸 妈妈 哥哥 姐姐 弟弟 妹妹 儿子 女儿 家人 先生 小姐 什么 名字 谢谢 对不起 没关系 不客气 再见 今天 明天 昨天 现在 时候 喜欢 认识 高兴 学校 医院 医生 飞机 电影 电视 电脑 吃饭 米饭 饭店 喝茶 水果 苹果 衣服 东西 商店 工作 学习 休息 睡觉 起床 上午 下午 中午 晚上 早上 一起 我们 你们 他们 她们 怎么 怎么样 多少 哪儿 那儿 这儿 哪里 这里 那里 这个 那个 哪个 几个 漂亮 可以 能够 知道 觉得 希望 开始 时间 星期 今年 去年 明年 岁数 年纪 生日 出租车 火车站 机场 公司 中午 下雨 天气 冷热 一点儿 有点儿 没有 不是 可是 但是 因为 所以 如果 已经 还是 或者 非常 真的 大家 你好 您好 老家 家里 宿舍 教室 图书馆 超市 银行 手机 电话 号码 汉字 生词 课文 作业 考试 问题 意思 地方 前面 后面 里面 外面 左边 右边 旁边 上面 下面'.split(' '));
  const pyOf = t => { const P = root.pinyinPro; if (!P || !P.pinyin) return ''; try {
      let out = ''; const add = w => { out += (out && !/[\s("]$/.test(out) ? ' ' : '') + w; };
      for (const m of String(t).matchAll(/([㐀-鿿]+)|([^㐀-鿿]+)/g)) {
        if (m[1]) { const run = m[1], py = P.pinyin(run, { type: 'array' }); let k = 0;
          while (k < run.length) { let L = Math.min(4, run.length - k); while (L > 1 && !DN_WORDS.has(run.substr(k, L))) L--;
            add(py.slice(k, k + L).reduce((a, x) => a + (a && /^[aoeāáǎàōóǒòēéěè]/.test(x) ? "'" : '') + x, '')); k += L; } }
        else { for (const ch of m[2]) { if (PUN[ch]) out += PUN[ch]; else if (/\s/.test(ch)) { if (!/\s$/.test(out)) out += ' '; } else out += (out && /[\w)]$/.test(out) && /\w/.test(ch) && /\s$/.test(m[2].slice(0, 1)) ? '' : '') + ch; } } }
      return out.replace(/\s+([.,!?:;)])/g, '$1').replace(/\s+/g, ' ').trim(); } catch (e) { return ''; } };
  const capPy = t => t.replace(/^\s*([a-zāáǎàēéěèīíǐìōóǒòūúǔù])/, (m, c) => m.replace(c, c.toUpperCase()));
  const dnPyLine = (de, lead) => { if (!de || de.dataset.dnPy || !HANR.test(de.textContent) || PYM.test(de.textContent)) return; de.dataset.dnPy = '1';
    const han = de.textContent.replace(/^[\u2460-\u2473]\s*/, ''), py = capPy(pyOf(han)); if (!py) return;
    const d = document.createElement('div'); d.dataset.dn = 'pyline'; d.textContent = py; Object.assign(d.style, { fontSize: '8.5px', lineHeight: '1.2', color: '#3d3d3d', paddingLeft: lead || '0px', marginBottom: '1px' });
    de.parentElement.insertBefore(d, de); };
  const dnPyChunks = te => { if (!te || te.dataset.dnPy || !HANR.test(te.textContent) || PYM.test(te.textContent)) return; te.dataset.dnPy = '1';
    const tw = document.createTreeWalker(te, NodeFilter.SHOW_TEXT), ns = []; while (tw.nextNode()) ns.push(tw.currentNode);
    ns.forEach(n => { if (!HANR.test(n.nodeValue)) return; const sp = document.createElement('span');
      sp.innerHTML = escH(n.nodeValue).replace(/([\u3400-\u9fff][\u3400-\u9fff\u3000-\u303f\uff01-\uff5e]*)/g, h => `<span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:bottom;line-height:1.15"><span style="font-size:0.66em;color:#3d3d3d">${escH(pyOf(h))}</span><span>${h}</span></span>`);
      n.replaceWith(...sp.childNodes); }); };
  function dnBook(el, comp) {
    dnPinyin(el);
    if (/(Sub Heading|Lesson Header|Section Bar)/.test(comp)) dnHanBold(el);
    if (/Section Bar/.test(comp)) el.style.borderBottom = 'none';   // giáo trình gốc: đề mục không kẻ gạch dưới (người dùng 29/10: trình bày y chang giáo trình)
    if (/Section Bar/.test(comp)) {
      const L = el.querySelector('[data-n="letter"]'), T = el.querySelector('[data-n="title"]');
      Object.assign(el.style, { justifyContent: 'center', gap: '8px' });
      if (L) { L.textContent = '(' + L.textContent.trim().replace(/^\((.*)\)$/, '$1') + ')';   /* "(A)" như giáo trình gốc (người dùng 29/10: trình bày y chang) */ Object.assign(L.style, { fontSize: '19px', fontWeight: '700', color: '#C00000', webkitTextStroke: '0', flex: '0 0 auto' }); }
      if (T) Object.assign(T.style, { flex: '0 0 auto', fontSize: '19px', fontWeight: '700', color: '#EE7623', textTransform: 'uppercase', letterSpacing: '0.02em', background: `linear-gradient(transparent 62%, ${DN_SOFT} 62%)`, padding: '0 6px' });
    }
    if (/Sub Heading/.test(comp)) {
      const bx = el.querySelector('[data-n="box"]'), t = el.querySelector('[data-n="text"]');
      if (bx) Object.assign(bx.style, { borderLeft: 'none', boxShadow: 'none', padding: '0 0 5px 0', borderBottom: '3px double #C00000', flex: '1 1 auto', alignSelf: 'stretch' });   /* kẻ đôi đỏ như giáo trình gốc */
      if (t) Object.assign(t.style, { color: '#C00000', textTransform: 'uppercase', fontSize: '11px', fontWeight: '800', letterSpacing: '0.02em' });
      // TIÊU ĐỀ NGỮ PHÁP "用“吗”的是非问句 {pinyin} – câu hỏi…" (người dùng 29/10: rối): pinyin chữ thường cam, nghĩa tiếng Việt xuống dòng riêng
      if (t) { t.querySelectorAll('[data-seg="py"]').forEach(py => { Object.assign(py.style, { textTransform: 'none', fontWeight: '600', letterSpacing: '0', fontSize: '0.95em' });
        const nx = py.nextSibling; if (nx && nx.nodeType === 3 && /^\s*[–—-]\s*/.test(nx.nodeValue)) { const d = document.createElement('span'); d.style.display = 'block'; d.style.marginTop = '2px'; nx.nodeValue = nx.nodeValue.replace(/^\s*[–—-]\s*/, ''); let x = nx; while (x) { const n2 = x.nextSibling; d.appendChild(x); x = n2; } py.after(d); }   /* cả phần nghĩa (kể cả chữ Hán trong đó) chung 1 khối */ }); }
    }
    if (/Structure/.test(comp)) {
      const l = el.querySelector('[data-n="label"]'), f = el.querySelector('[data-n="formula"]');
      if (l && l.textContent.trim()) { dnPill(l); Object.assign(l.style, { textAlign: 'left', boxSizing: 'border-box' }); }
      if (f) Object.assign(f.style, { boxShadow: 'none', border: '1.2px solid #EB701D', boxSizing: 'border-box', borderRadius: '0', padding: '5px 12px', color: 'var(--color-text, #3d3d3d)', fontWeight: '500', textAlign: 'left', alignSelf: 'flex-start', flex: '0 1 auto', justifyContent: 'flex-start', gap: '5px' });
      el.style.alignItems = 'flex-start'; el.style.gap = '10px';
    }
    if (/Example Box/.test(comp)) {
      Object.assign(el.style, { boxShadow: 'none', background: 'none', padding: '0', gap: '6px' });
      if (!el.querySelector('[data-dn="exlabel"]')) { const lb = document.createElement('div'); lb.dataset.dn = 'exlabel'; lb.textContent = 'Ví dụ minh hoạ'; lb.style.fontSize = '9.5px'; dnPill(lb); el.prepend(lb); }
      let k = 0; el.querySelectorAll('[data-n^="ex_"]').forEach(x => { if (!/^ex_\d+$/.test(x.dataset.n) || !x.offsetParent && x.style.display === 'none') return; const de = x.querySelector('[data-n$=".de"]'), vi = x.querySelector('[data-n$=".vi"]');
        if (!de || !de.textContent.trim()) return; k++;
        if (!de.dataset.dnNo) { dnPyLine(de, '15px'); de.dataset.dnNo = '1'; de.textContent = CIRC(k) + '  ' + de.textContent; }
        if (vi && vi.textContent.trim() && !vi.dataset.dnArrow) { vi.dataset.dnArrow = '1'; vi.textContent = '→ ' + vi.textContent; Object.assign(vi.style, { paddingLeft: '14px', fontSize: '10px', color: 'var(--color-text, #3d3d3d)' }); } });
    }
    if (/^Block\/(Exercise|Matching|Sentence Order|True False)/.test(comp)) {
      const nb = el.querySelector('[data-n="no_box"]'), ins = el.querySelector('[data-n="instruction"]');
      const num = nb ? (nb.textContent.match(/\d+/) || [])[0] : null;
      if (nb) nb.style.display = 'none';
      if (ins) { if (num && !ins.dataset.dnNo) { ins.dataset.dnNo = '1'; ins.textContent = num + '. ' + ins.textContent; } Object.assign(ins.style, { color: DN_RED, textTransform: 'uppercase', fontWeight: '800', fontSize: '10.5px', letterSpacing: '0.02em' }); }
      el.querySelectorAll('[data-n$=".text"], [data-n$=".words"]').forEach(te => { if (/^item_\d+\.(text|words)$/.test(te.dataset.n) && /\s?\/\s?/.test(te.textContent)) dnPyChunks(te); });   // câu sắp xếp: pinyin trên từng cụm
      el.querySelectorAll('[data-n$=".no"]').forEach(no => { const m = no.textContent.trim().match(/^(\d+)\.?$/); if (!m || !/^item_\d+\.no$/.test(no.dataset.n)) return; no.textContent = CIRC(+m[1]); Object.assign(no.style, { color: DN_RED, fontWeight: '400', fontSize: '12px' }); });
    }
    if (/Table/.test(comp)) {
      Object.assign(el.style, { boxShadow: 'none', border: `0.75px solid ${DN_OR}`, boxSizing: 'border-box' });   // khung ngoài bảng bằng border: bóng inset bị nền dòng che (mất viền trái / phải)
      const h = el.querySelector('[data-n="row_0"]');
      if (h) { h.style.backgroundColor = '#EB701D';   /* màu đo trên giáo trình gốc */ h.querySelectorAll('[data-text]').forEach(t => Object.assign(t.style, { color: '#fff', textTransform: 'uppercase', fontWeight: '700', textAlign: 'center', width: '100%', fontSize: '9.5px', letterSpacing: '0.02em' }));   /* tiêu đề cột căn trái như nội dung → cột thẳng hàng (người dùng 29/10) */ h.querySelectorAll('[data-n$="_cell"]').forEach(c => { c.style.justifyContent = 'flex-start'; }); }
      el.querySelectorAll('[data-n^="row_"]').forEach(r => { if (!/^row_[1-9]\d*$/.test(r.dataset.n)) return; const ri = +r.dataset.n.slice(4);
        r.style.backgroundColor = ri % 2 ? '#fff' : '#FFF9EF'; r.style.borderBottom = `0.75px solid ${DN_OR}`;   // giáo trình gốc: dòng trắng / kem xen kẽ, kẻ ngang cam liền
        const cells = [...r.children].filter(c => /_cell$/.test(c.dataset.n || '')); cells.forEach((c, i) => { c.style.borderRight = i < cells.length - 1 ? '0.75px dashed #9a9a9a' : 'none'; c.style.alignSelf = 'stretch'; }); r.style.alignItems = 'stretch';   // kẻ dọc nét đứt xám
        const c1 = r.querySelector('[data-n="c1"]'); if (c1 && /[㐀-鿿]/.test(c1.textContent)) c1.style.color = DN_RED; });
    }
    // HỘI THOẠI kiểu giáo trình gốc: bảng có cột đầu "VAI" → người nói đỏ bên trái + vạch đỏ dọc; câu chữ Hán / pinyin nghiêng / nghĩa xếp chồng; bỏ đầu bảng
    if (/Table/.test(comp)) { const h0 = el.querySelector('[data-n="row_0"]'), v = h0 && h0.querySelector('[data-n="c1"], [data-n="row_0.c1"]');
      if (v && /^vai$/i.test(v.textContent.trim())) { el.dataset.dnDlg = '1'; h0.style.display = 'none'; Object.assign(el.style, { border: 'none', background: 'none', gap: '0' });
        el.querySelectorAll('[data-n^="row_"]').forEach(r => { if (!/^row_[1-9]\d*$/.test(r.dataset.n)) return; const n = r.dataset.n;
          Object.assign(r.style, { background: 'none', borderBottom: 'none', alignItems: 'stretch', padding: '3px 0' });
          const cell = k => r.querySelector(`[data-n="${k}"], [data-n="${n}.${k}"]`), wrap = k => { const t = cell(k); return t && t.closest('[data-n$="_cell"]'); };
          const c1 = wrap('c1'), c2 = wrap('c2'), c3 = wrap('c3'), c4 = wrap('c4');
          if (c1) { Object.assign(c1.style, { flex: '0 0 15%', maxWidth: '15%', borderRight: '1.5px solid #C00000', justifyContent: 'center', background: 'none' }); const t = cell('c1'); if (t) Object.assign(t.style, { color: '#C00000', fontWeight: '700', textAlign: 'center' }); }
          if (c2 && c3 && c4 && !r.querySelector('[data-dn="stack"]')) { const st = document.createElement('div'); st.dataset.dn = 'stack'; Object.assign(st.style, { display: 'flex', flexDirection: 'column', flex: '64 1 0px', minWidth: '0', padding: '2px 0 2px 12px', gap: '1px' });
            r.insertBefore(st, c2); [c2, c3, c4].forEach(c => { Object.assign(c.style, { flex: '0 0 auto', width: '100%', maxWidth: 'none', borderRight: 'none', padding: '0', background: 'none', minHeight: '0', height: 'auto' }); st.appendChild(c); });
            const t3 = cell('c3'); if (t3) Object.assign(t3.style, { fontStyle: 'italic' }); }
          if (!el.querySelector('[data-dn="dlgno"]')) { const sn = document.createElement('div'); sn.dataset.dn = 'dlgno'; Object.assign(sn.style, { position: 'absolute', left: '0', top: '0', bottom: '0', width: '24px', background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3d3d3d', fontSize: '13px' }); el.style.position = 'relative'; el.style.paddingLeft = '30px'; el.prepend(sn); }
          [...r.children].filter(c => c !== c1 && c.dataset.dn !== 'stack' && /_cell$/.test(c.dataset.n || '')).forEach(c => Object.assign(c.style, { borderRight: 'none', background: 'none', flex: '24 1 0px', padding: '2px 0 2px 10px' })); });
      } }
    if (/Paragraph/.test(comp)) { const te = el.querySelector('[data-n="text"]'); if (te && te.style.textTransform === 'uppercase') { te.style.textTransform = 'none'; te.style.fontSize = '9.5px'; dnPill(te); } }
    if (/Lesson Header/.test(comp)) {
      const ln = el.querySelector('[data-n="lesson"]'), tv = el.querySelector('[data-n="title.vi"]');
      if (ln) ln.style.textTransform = 'uppercase';
      if (tv) Object.assign(tv.style, { textTransform: 'uppercase', color: '#C00000', fontWeight: '700' });
      // ĐẦU BÀI như giáo trình gốc: huy hiệu tròn bên trái · ô cam "BÀI 1" · ô kem viền đỏ, tên bài 2 dòng in hoa đỏ (dòng 2 = phần sau dấu ":" / "–")
      const tn = el.querySelector('[data-n="title.native"]'), lb = el.querySelector('[data-n="lesson_box"]'), tb = el.querySelector('[data-n="title_box"]');
      if (tv && tn && !tv.dataset.dnSplit) { tv.dataset.dnSplit = '1'; const m = tv.textContent.match(/^(.{3,40}?)\s*(?::|\s[–-]\s)\s*(.+)$/);
        if (m) { tv.textContent = m[1]; tn.textContent = m[2]; } else tn.textContent = '';
        Object.assign(tn.style, { textTransform: 'uppercase', color: '#C00000', fontWeight: '700', fontSize: '0.62em', fontStyle: 'normal' }); if (!tn.textContent) tn.style.display = 'none';
        tv.style.fontSize = '17px'; tn.style.fontSize = '11px'; }
      if (tb) Object.assign(tb.style, { background: '#FFF3E0', boxShadow: 'none', border: '1.5px solid #C00000', boxSizing: 'border-box', justifyContent: 'center', gap: '2px' });   /* viền thật (border): bóng inset bị nền ô con che mất khi in */
      if (lb) Object.assign(lb.style, { background: '#EB701D', boxShadow: 'none', border: '1.5px solid #C00000', borderRight: 'none', boxSizing: 'border-box', paddingLeft: '58px', paddingRight: '16px' });
      el.style.boxShadow = 'none'; el.style.border = 'none';
      if (!el.querySelector('[data-dn="badge"]')) { const im = document.createElement('img'); im.dataset.dn = 'badge'; im.src = 'covers/dac-nhan-badge.png'; im.alt = '';
        Object.assign(im.style, { position: 'absolute', left: '-36px', top: '0px', width: '90px', height: '86px', objectFit: 'contain', zIndex: '2' }); el.style.position = 'relative'; el.style.marginLeft = '36px'; el.style.overflow = 'visible'; el.style.padding = '9px 0'; el.style.boxSizing = 'content-box';
        [lb, tb].forEach(x => { if (x) { x.style.minHeight = '68px'; x.style.height = 'auto'; } });   /* ô đầu bài thấp hơn logo 9px mỗi phía → logo che kín mép ô cam (người dùng 29/10) */   /* logo nằm gọn trong chiều cao đầu bài – không bị cắt rìa trên (người dùng 29/10) */ el.prepend(im); }
    }
  }
  function bookStyle(el, comp, b) {
    // cỡ + dòng theo thang chung
    el.querySelectorAll('[data-text]').forEach(t => { const f0 = parseFloat(t.dataset.fs) || 10; const f = BOOK_FS[f0] || f0;
      if (/Section Bar|Lesson Header/.test(comp) && /^(letter|title|lesson)$/.test(t.dataset.n)) return;   // đã chỉnh riêng
      t.style.fontSize = f + 'px'; t.style.lineHeight = String(BOOK_LH(f)); });
    // tiêu đề con: bỏ khung viền, thanh màu bên trái (một kiểu duy nhất cho mọi tiêu đề con)
    if (/Sub Heading/.test(comp)) { const bx = el.querySelector('[data-n="box"]'); el.style.height = 'auto';
      if (bx) Object.assign(bx.style, { border: 'none', boxShadow: 'none', padding: '0 0 0 9px', borderLeft: '3px solid var(--color-primary, #406864)', borderRadius: '0' }); }
    // cấu trúc: nhãn cột cố định 64px để các công thức thẳng hàng
    if (/Structure/.test(comp)) { const l = el.querySelector('[data-n="label"]'); if (l) { Object.assign(l.style, { flex: '0 0 64px', width: '64px', display: 'block' }); if (b && b.data && b.data.label === '\u00a0') { l.textContent = ''; l.style.visibility = 'hidden'; } delete l.dataset.hid; }   /* nhãn trống vẫn giữ cột 64px → công thức thẳng cột */ el.style.gap = '10px'; }
    // bảng: chữ căn trái, đệm đều, cột đầu đậm vừa; bảng từ vựng chia cột theo nội dung
    if (/Table/.test(comp)) {
      el.querySelectorAll('[data-n$="_cell"]').forEach(c => { Object.assign(c.style, { justifyContent: 'flex-start', padding: '5px 8px' }); const t = c.querySelector('[data-text]'); if (t) { t.style.textAlign = 'left'; t.style.overflowWrap = 'break-word'; } });   // ô hẹp (khổ 19×27): cụm chữ dính nhau vẫn xuống dòng trong ô, không lấn cột
      el.querySelectorAll('[data-n^="row_"]').forEach(r => { if (!/^row_\d+$/.test(r.dataset.n)) return; r.style.height = 'auto'; const c1 = r.querySelector('[data-n="c1"]'); if (c1 && r.dataset.n !== 'row_0') c1.style.fontWeight = '600'; });
      // bảng đáp án: cột số câu hẹp, căn giữa, màu brand; giải thích chiếm phần lớn bề ngang
      const AW0 = b && { ans3: { c1: 9, c2: 28, c3: 63 }, ans2: { c1: 10, c2: 90 }, ansgrid: { c1: 7, c2: 18, c3: 7, c4: 18, c5: 7, c6: 18, c7: 7, c8: 18 }, self: { c1: 76, c2: 8, c3: 8, c4: 8 }, pron: { c1: 15, c2: 13, c3: 36, c4: 18, c5: 18 }, vocab: { c1: 12, c2: 13, c3: 12, c4: 28, c5: 35 }, speak: { c1: 34, c2: 33, c3: 33 }, speak3: { c1: 34, c2: 33, c3: 33 }, speak4: { c1: 30, c2: 26, c3: 26, c4: 18 }, speak4v: { c1: 12, c2: 30, c3: 28, c4: 30 }, speak5v: { c1: 11, c2: 24, c3: 22, c4: 24, c5: 19 } }[b.role];
      const AW = AW0 ? Object.assign({}, AW0) : null;   // bản sao: bảng từ vựng chỉnh độ rộng theo nội dung từng bảng
      // bảng từ vựng (người dùng 29/10 – khổ 19×27 chữ lấn cột): cột Từ / Phiên âm / Loại từ rộng theo từ dài nhất (không ngắt giữa từ), phần còn lại chia Nghĩa / Ví dụ
      // BẢNG PHÁT ÂM (người dùng 29/10: "đừng rớt dòng nhiều quá"): bề rộng cột theo lượng chữ thật (cột nhiều chữ rộng hơn), không hẹp hơn từ dài nhất
      // ĐẦU CỘT ≥ 3 chữ: 2 chữ cuối dính nhau ("ÂM / TƯƠNG TỰ" – 2 dòng, không 3 dòng – người dùng 29/10)
      const headToks = t => { const w = t.trim().split(/\s+/).filter(Boolean); return w.length >= 3 ? w.slice(0, -2).concat(w.slice(-2).join(' ')) : w; };
      const FD = b.full || b.data;   // bảng bị cắt sang trang: độ rộng cột theo CẢ bảng → phần nối thẳng cột với phần trên (người dùng 29/10 buổi 11)
      if (AW && b.role === 'pron' && FD) { const cols = Object.keys(AW), need = {}, wt = {}, L = v => [...v].length;
        for (const k of cols) { const vs = Object.entries(FD).filter(([x]) => new RegExp(`^row_\\d+\\.${k}$`).test(x)).map(([, v]) => String(v || '')), body = vs.slice(1);
          const word = Math.max(0, ...body.flatMap(v => v.split(/\s+/)).map(L)), head = Math.max(0, ...headToks(String(vs[0] || '')).map(L));
          const pair = Math.max(0, ...body.flatMap(v => { const t = v.split(/\s+/); return t.slice(1).map((w, i) => L(t[i] + ' ' + w)); }).filter(n => n <= 12));
          need[k] = Math.max(word * 1.2, head * 1.6, k === 'c1' ? pair * 1.45 : 0) + 3.5;   // % bề rộng (1 ký tự ≈ 1,35%; cột 1 chữ đậm giữ cụm 2 chữ): không ngắt giữa từ / tiêu đề in hoa, giữ cụm ngắn ("Vận mẫu") một dòng
          wt[k] = Math.pow(body.reduce((t, v) => t + L(v), 0) / Math.max(1, body.length), 1.1); }
        const nsum = cols.reduce((t, k) => t + need[k], 0), wsum = cols.reduce((t, k) => t + wt[k], 0) || 1, rest = Math.max(0, 100 - nsum);
        for (const k of cols) AW[k] = (need[k] + rest * wt[k] / wsum) * (nsum > 100 ? 100 / nsum : 1); }   // phần dư chia theo lượng chữ
      if (AW && b.role === 'vocab' && FD) { const tok = k => Math.max(0, ...Object.entries(FD).filter(([x]) => new RegExp(`^row_[1-9]\\d*\\.${k}$`).test(x)).flatMap(([, v]) => String(v || '').split(/\s+/)).map(w => [...w].length));
        const cellLen = k => Math.max(0, ...Object.entries(FD).filter(([x]) => new RegExp(`^row_[1-9]\\d*\\.${k}$`).test(x)).map(([, v]) => [...String(v || '')].length));   // cả cụm ("Danh từ") không bẻ dòng
        const w1 = Math.min(20, Math.max(12, 1.55 * tok('c1') + 4)), w2 = Math.min(17, Math.max(15, 1.1 * tok('c2') + 4)), w3 = Math.min(17, Math.max(12, 1.0 * cellLen('c3') + 3)), rest = Math.max(50, 100 - w1 - w2 - w3);
        Object.assign(AW, { c1: w1, c2: w2, c3: w3, c4: rest * 28 / 63, c5: rest * 35 / 63 });
        el.querySelectorAll('[data-n="c1"], [data-n="c2"]').forEach(t => { t.style.overflowWrap = 'anywhere'; }); }   // từ / phiên âm quá dài (hiếm) → xuống dòng trong ô thay vì lấn cột
      el.querySelectorAll('[data-n="row_0"] [data-text]').forEach(t => { const w = t.textContent.trim().split(/\s+/); if (w.length >= 3 && !/\u00a0/.test(t.textContent)) t.textContent = w.slice(0, -1).join(' ') + '\u00a0' + w[w.length - 1]; });
      if (AW) el.querySelectorAll('[data-n$="_cell"]').forEach(c => { const k = c.dataset.n.replace('_cell', ''); if (!AW[k]) return; c.style.flex = `${AW[k]} 1 0px`;
        const num = AW[k] <= 10 && !/^(pron|speak\w*|vocab)$/.test(b.role); if (num) { c.style.justifyContent = 'center'; c.style.padding = '5px 4px'; const t = c.querySelector('[data-text]'); if (t) { t.style.textAlign = 'center'; t.style.fontWeight = '700'; t.style.color = 'var(--color-primary-ink, var(--color-primary, #406864))'; } }
        else if (b.role === 'ans3' && k === 'c3') { const t = c.querySelector('[data-text]'); if (t) t.style.fontWeight = '400'; } });
      if (/Vocab Table/.test(comp)) { const W = { c1: 27, c2: 22, c3: 14, c4: 37 }; el.querySelectorAll('[data-n$="_cell"]').forEach(c => { const k = c.dataset.n.replace('_cell', ''); if (W[k]) c.style.flex = `${W[k]} 1 0px`; }); }
    }
    // hộp ví dụ: các câu cách đều 6px, đệm 10/14
    if (/Example Box/.test(comp)) Object.assign(el.style, { padding: '10px 14px', gap: '6px' });
    if (/Note Box/.test(comp)) { Object.assign(el.style, { padding: '9px 12px' }); const bar = el.querySelector('[data-n="bar"]'); if (bar) Object.assign(bar.style, { height: 'auto', alignSelf: 'stretch', flex: '0 0 3px' }); }
    // bài tập: số câu cột 16px, câu cách nhau 5px, khối câu thụt bằng nhau
    if (/Exercise|Matching|Sentence Order|True False/.test(comp)) { el.style.gap = '6px';
      el.querySelectorAll('[data-n^="item_"]').forEach(it => { if (!/^item_\d+$/.test(it.dataset.n)) return; Object.assign(it.style, { gap: '8px', minHeight: '0', height: 'auto' }); const no = it.querySelector('[data-n$=".no"]'); if (no) Object.assign(no.style, { flex: '0 0 16px', width: '16px' }); }); }
    // NHÃN BÀI TẬP "Bài 9" (người dùng chốt 23/10: số trong vòng tròn nhỏ, khó hiểu) → nhãn chữ nhật bo nhẹ màu brand, chữ trắng đậm
    const nb = el.querySelector(':scope [data-n="head"] [data-n="no_box"], :scope > [data-n="no_box"]') || (/Exercise|Matching|Sentence Order|Pronunciation|True False/.test(comp) ? el.querySelector('[data-n="no_box"]') : null);
    if (nb && /Exercise|Matching|Sentence Order|Pronunciation|True False/.test(comp)) { Object.assign(nb.style, { width: 'auto', minWidth: '0', height: 'auto', borderRadius: '3px', padding: '2px 7px', alignSelf: 'center' }); delete nb.dataset.circle;
      const t = nb.querySelector('[data-text]'); if (t) Object.assign(t.style, { fontSize: '9.5px', fontWeight: '700', lineHeight: '1.35', letterSpacing: '0.02em', whiteSpace: 'nowrap' }); }
    if (/Dialogue/.test(comp)) { el.style.gap = '6px';   // cột vai rộng đủ cho "Tin nhắn thoại" trên 1 dòng → câu thoại các dòng thẳng một mép
      el.querySelectorAll('[data-n$=".speaker"]').forEach(x => Object.assign(x.style, { flex: '0 0 80px', width: '80px', maxWidth: '80px', fontWeight: '600', color: INK, paddingRight: '8px' })); }
    // đoạn văn / lưu ý: danh sách đánh số thụt treo
    if (/Paragraph/.test(comp)) { const te = el.querySelector('[data-n="text"]');
      if (b && b.role === 'label') { te.textContent = te.textContent; Object.assign(te.style, { fontSize: '9.5px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: INK, lineHeight: '1.3' }); }
      else richList(te); }
    if (/Note Box/.test(comp)) richList(el.querySelector('[data-n="text"]'));
    // công thức "N's + N: Anna's brother" → công thức đậm màu + ví dụ chữ thường sau mũi tên
    if (/Vocab Table/.test(comp)) { const W = { c1: 20, c2: 20, c3: 23, c4: 37 };   // cột Loại từ đủ rộng cho "cụm động từ" một dòng; Nghĩa vẫn rộng nhất
      el.querySelectorAll('[data-n$="_cell"]').forEach(c => { const k = c.dataset.n.replace(/_cell$/, ''); if (W[k]) c.style.flex = `${W[k]} 1 0px`; }); }
    if (/Structure/.test(comp)) { const lb = el.querySelector('[data-n="label"]'), fm = el.querySelector('[data-n="formula"]');   // nhãn dài ("Trạng từ không đổi dạng") không đè lên công thức: nhãn ≥ khung mẫu, tự giãn tối đa 40%, xuống dòng; công thức lấy phần còn lại
      if (lb) { const w = lb.style.width; Object.assign(lb.style, { flex: '0 0 auto', width: 'auto', minWidth: w || '', maxWidth: '40%', whiteSpace: 'normal' }); lb.querySelectorAll('*').forEach(x => { x.style.whiteSpace = 'normal'; x.style.width = 'auto'; }); }
      if (fm) Object.assign(fm.style, { flex: '1 1 0', minWidth: '0', whiteSpace: 'normal' }); }
    if (/Structure/.test(comp)) { const f = el.querySelector('[data-n="formula"]'); if (f && f.dataset.blocks) { Object.assign(f.style, { fontSize: '10.5px', columnGap: '4px', rowGap: '2px', minWidth: '0' }); f.querySelectorAll('[data-n^="tk_"]').forEach(t => Object.assign(t.style, { whiteSpace: 'normal', flex: '0 1 auto', minWidth: '0' })); } }   // ô chữ dài trong dòng có pinyin được xuống dòng, không tràn trang   // dòng có ô pinyin {…} cùng cỡ chữ với dòng thường
    if (/Structure/.test(comp)) { const f = el.querySelector('[data-n="formula"]'); const t = f && f.textContent; const c = t ? t.indexOf(': ') : -1;
      if (c > 0 && f.dataset.blocks) { const tk = [...f.querySelectorAll('[data-n="tk_t"]')].find(x => x.textContent.includes(': ')); if (tk) tk.textContent = tk.textContent.replace(': ', '  →  '); }   // dòng có ô pinyin: chỉ đổi dấu ':' thành '→', giữ các ô
      else if (c > 0) f.innerHTML = `${escH(t.slice(0, c))}<span style="font-weight:400;color:var(--color-text, #3d3d3d)">&nbsp;&nbsp;→&nbsp;${escH(t.slice(c + 2))}</span>`; }
    if (/Exercise/.test(comp)) el.querySelectorAll('[data-n$=".text"]').forEach(optionGrid);
  }

  // ---------- MỘT FONT CHO CẢ SÁCH (người dùng chốt 23/10) ----------
  // Cả cuốn dùng một họ Noto: Noto Sans cho chữ Latin / Việt / IPA; chữ Hán – Kana – Hangul rơi sang Noto Sans JP / KR / SC
  // (cùng nhà thiết kế, cùng độ cao chữ, cùng nét) → dòng chữ Việt và chữ tượng hình thẳng hàng, dễ canh, dễ so.
  // Phân cấp chỉ bằng CỠ + ĐỘ ĐẬM của cùng một font (400 thường · 500 nhãn · 600 tiêu đề con · 700 tiêu đề).
  const BOOK_CJK = { Sakumi: 'Noto Sans JP', Saechang: 'Noto Sans KR', 'Đắc Nhân': 'LXGW WenKai' };   // tiếng Trung: chữ Khải (người dùng 28/10) – LXGW WenKai nhúng được vào PDF
  // Đắc Nhân (người dùng 29/10: "giống y chang giáo trình HSK1 bản 4.1"): giáo trình gốc dàn bằng Word – Times New Roman + KaiTi → sách dùng Times New Roman
  // (máy không có → Tinos, cùng số đo, miễn phí) + chữ Khải (KaiTi / LXGW WenKai)
  const bookFont = brand => brand === 'Đắc Nhân' ? "'Times New Roman', 'Tinos', 'KaiTi', 'Kaiti SC', 'STKaiti', 'LXGW WenKai', serif"
    : `'Montserrat', '${BOOK_CJK[brand] || 'Noto Sans JP'}', 'Noto Sans SC', 'Noto Sans KR', sans-serif`;
  const bookFamilies = brand => brand === 'Đắc Nhân' ? ['Tinos', 'LXGW WenKai'] : ['Montserrat', BOOK_CJK[brand]].filter(Boolean);   // người dùng 28/10: sách dùng Montserrat
  function bookCss() {
    if (typeof document === 'undefined' || document.getElementById('plsBookCss')) return; const st = document.createElement('style'); st.id = 'plsBookCss';
    // ép một font cho mọi chữ trong trang sách (mẫu Figma gắn font riêng từng ô: heading / body / native / doc)
    st.textContent = '.pls-book-page, .pls-book-page *{font-family:var(--book-font) !important;font-synthesis:none}'
      + '.pls-book-page [data-comp="Block/Sub Heading"] *,.pls-book-page [data-n="Block/Sub Heading"] *{white-space:pre-wrap !important;max-width:100%;min-width:0;overflow-wrap:break-word}'   // QC 24/10: tiêu đề ngữ pháp dài bị cắt ở lề phải (23 chỗ) → xuống dòng
      + '.pls-book-page [data-n="Block/Section Bar"] [data-n="letter"],.pls-book-page [data-n="Block/Lesson Header"] [data-n="lesson"]{font-weight:800 !important}'   // chữ cái đề mục + số bài dày bằng chữ HSK trên bìa (Montserrat 800, người dùng 29/10)
      + '.pls-book-page [data-text]{font-kerning:normal;font-variant-ligatures:common-ligatures;text-rendering:optimizeLegibility}';
    document.head.appendChild(st);
  }

  // LỀ TRANG: A4 lề trái = phải 56 (mẫu 48); 19×27 lề trái = phải 52 cả trang lẻ lẫn chẵn (mẫu 71 / 43 lệch nhau), đầu trang có chữ chạy + kẻ mảnh, cách nội dung 14px; chân trang kẻ mảnh, số trang.
  function pageFrame(host, size) {
    const pg = host.firstElementChild; if (!pg) return; const run = host.querySelector('[data-n="running"]'), foot = host.querySelector('[data-n="footer"]');
    // lề trong = lề ngoài (người dùng chốt 23/10: 19×27 trang lẻ / chẵn không được lệch lề vào – lề ra); số trang vẫn ở mép ngoài
    pg.style.padding = size === '19x27' ? '38px 52px 26px 52px' : '40px 56px 28px 56px'; pg.style.gap = '0px';
    if (run) Object.assign(run.style, { paddingBottom: '6px', marginBottom: '16px', borderBottom: '0.5px solid var(--scale-200, #c8c8c8)', letterSpacing: '0.06em', fontWeight: '500' });
    if (foot) Object.assign(foot.style, { marginTop: '12px', paddingTop: '7px', borderTop: '0.5px solid var(--scale-200, #c8c8c8)' });
    if (run && host.dataset.brand === 'Đắc Nhân') run.style.display = 'none';   // giáo trình gốc không có dòng chữ chạy đầu trang
    if (foot && host.dataset.brand === 'Đắc Nhân') { foot.style.borderTop = 'none'; const tg = foot.querySelector('[data-n="tagline"]'); foot.style.position = 'relative'; if (tg) Object.assign(tg.style, { color: DN_RED, fontWeight: '700', fontSize: '7.5px', letterSpacing: '0.04em', textAlign: 'center', position: 'absolute', left: '0', right: '0', top: '50%', transform: 'translateY(-50%)', width: 'auto', pointerEvents: 'none' });   /* khẩu hiệu chính giữa trang, không lệch theo số trang (người dùng 29/10) */ const sp = foot.querySelector('[data-n="sp"]'); if (sp) sp.style.flex = '0 0 0px';
      foot.querySelectorAll('[data-n="page_no"], [data-n="page_no_l"]').forEach(x => { x.style.flex = '0 0 40px'; x.style.textAlign = x.dataset.n === 'page_no' ? 'right' : 'left'; }); }   // giáo trình Đắc Nhân: khẩu hiệu đỏ ở giữa chân trang
  }

  function paginate(list, opt) {
    (list || []).forEach(b => { if (b && b.role === 'vocab' && b.data) Object.entries(b.data).forEach(([k, v]) => { if (/^row_[1-9]\d*\.c1$/.test(k) && /^[\u3400-\u9fff]{2,4}$/.test(String(v || '').trim())) DN_WORDS.add(String(v).trim()); }); });   // từ của bài → ghép pinyin theo từ
    bookCss();
    list.forEach((b, i) => { b.space = SPACE(list[i - 1], b); });
    const E = root.PLS_ENGINE, size = SIZES[opt.size] || SIZES.A4, stage = opt.stage, pages = [], warns = [];
    const running = opt.running || '';
    // SỐ TRANG như sách in: góc ngoài chân trang – trang lẻ bên phải, trang chẵn bên trái (trang 1 cũng in số – người dùng 24/10)
    const newPage = () => { const n = pages.length + (opt.first || 1); const comp = size.page(n);
      const r = E.render({ comp, data: { running, page_no: n % 2 === 0 ? '' : String(n), page_no_l: n % 2 === 0 ? String(n) : '' } }, opt.brand);
      stage.appendChild(r.host); r.host.classList.add('pls-book-page'); r.host.style.setProperty('--book-font', bookFont(opt.brand)); pageFrame(r.host, opt.size);
      const content = r.host.querySelector('[data-n="content"]'); [...content.children].forEach(c => c.remove()); content.style.gap = '0px'; content.style.rowGap = '0px';
      const pg = { host: r.host, content, n, blocks: [] }; pages.push(pg); return pg; };
    const head0 = pg => { const f = pg.blocks[0]; const h0 = f && !f.dataset.dnDlg && f.querySelector('[data-n="row_0"][data-cont]'); if (h0) h0.style.display = 'flex'; };   // hội thoại kiểu người nói: không có đầu bảng   // bảng nối đứng đầu trang → hiện đầu bảng TRƯỚC khi đo
    const fits = pg => pg.content.scrollHeight <= pg.content.clientHeight + 1;
    const mk = b => { const r = E.render({ comp: b.comp, data: b.data }, opt.brand); const el = r.host.firstElementChild; el.style.width = 'auto'; el.style.alignSelf = 'stretch'; el.style.flex = '0 0 auto'; el.dataset.block = b.role === 'label' ? 'Label Heading' : b.comp;
      // khối sách phải cao theo chữ (mẫu Figma để cao cố định theo chữ mẫu → chữ thật dài hơn đè lên khối sau)
      el.style.height = 'auto'; el.style.minHeight = '0';
      [el, ...el.querySelectorAll('*')].forEach(x => { if (x.style.height && x.style.height !== 'auto' && (x.dataset.text || x.querySelector('[data-text]'))) { x.style.minHeight = x.style.height; x.style.height = 'auto'; } });
      // bảng N cột: ẩn cột không có dữ liệu (cN / cN_cell) để các cột còn lại giãn đủ rộng; dòng kẻ của mục không dùng (item_3_line) ẩn theo mục
      const keys = Object.keys(b.data || {}); const usedC = new Set(keys.map(k => (k.match(/\.c(\d+)$/) || [])[1]).filter(Boolean));
      if (usedC.size) el.querySelectorAll('[data-n]').forEach(x => { const m = x.dataset.n.match(/^c(\d+)(_cell)?$/); if (m && !usedC.has(m[1])) { x.style.display = 'none'; x.dataset.hid = '1'; } });
      el.querySelectorAll('[data-n$="_line"]').forEach(x => { const m = x.dataset.n.match(/^([a-z]+_\d+)_line$/); if (m && !keys.some(k => k.split('.')[0] === m[1])) { x.style.display = 'none'; x.dataset.hid = '1'; } });
      // tên vai dài (vd "Tin nhắn thoại") trong cột hẹp → cho xuống dòng, không đè lên câu
      el.querySelectorAll('[data-n="speaker"],[data-n$=".speaker"]').forEach(x => { [x, ...x.querySelectorAll('*')].forEach(y => { y.style.whiteSpace = 'normal'; y.style.overflowWrap = 'anywhere'; }); x.style.paddingRight = '6px'; x.style.boxSizing = 'border-box'; x.style.overflow = 'hidden'; x.style.whiteSpace = 'normal'; x.style.overflowWrap = 'anywhere'; x.style.maxWidth = ''; (x.parentElement || x).style.minWidth = '0'; });
      // Section Bar: bỏ ảnh đại diện / ô bài mẫu (sách đã duyệt chỉ có chữ cái + tên mục + kẻ ngang)
      if (b.comp === 'Block/Section Bar') { el.querySelectorAll('[data-n="avatar"], [data-n="lesson_box"]').forEach(x => { x.style.display = 'none'; x.dataset.hid = '1'; });
        // chữ cái và tên mục to gần bằng nhau, cùng nằm giữa theo chiều dọc (người dùng chốt 23/10: "C" và "Ngữ pháp" phải cân)
        const L = el.querySelector('[data-n="letter"]'), T = el.querySelector('[data-n="title"]');
        if (L) Object.assign(L.style, { flex: '0 0 auto', height: 'auto', minHeight: '0', fontSize: '34px', lineHeight: '1', textAlign: 'left', fontWeight: '900', webkitTextStroke: '0.8px currentColor' });   // chữ cái mục A, B, C… nét dày như sách in (người dùng 24/10)
        if (T) Object.assign(T.style, { flex: '1 1 0px', height: 'auto', minHeight: '0', fontSize: '22px', lineHeight: '1.15', fontWeight: '700', color: 'var(--color-primary, #406864)' });
        Object.assign(el.style, { alignItems: 'center', gap: '12px', paddingBottom: '8px' }); }
      // Lesson Header: ô "Bài N" và khung tên bài cao bằng nhau (mẫu để ô bài cao 72 cố định, khung tên cao theo chữ → lệch)
      if (b.comp === 'Block/Lesson Header') { el.style.alignItems = 'stretch'; { const lb = el.querySelector('[data-n="lesson_box"]'); if (lb) Object.assign(lb.style, { width: 'auto', flex: '0 0 auto', paddingLeft: '14px', paddingRight: '14px', whiteSpace: 'nowrap' }); }   /* "BUỔI 12" dài hơn "BÀI 12" → ô tự giãn, không tràn (người dùng 29/10) */ el.querySelectorAll('[data-n="lesson_box"], [data-n="title_box"]').forEach(x => { x.style.height = 'auto'; x.style.minHeight = '72px'; x.style.alignSelf = 'stretch'; });
        const tb = el.querySelector('[data-n="title_box"]'); if (tb) tb.style.boxShadow = 'inset 0 0 0 1px var(--color-primary-dark, #142738)';
        const ln = el.querySelector('[data-n="lesson"]'); if (ln) { ln.dataset.fs = '30'; ln.style.fontSize = '30px';   /* 34 → 30: chữ không sát viền ô (người dùng 29/10) */ ln.style.fontWeight = '900'; ln.style.webkitTextStroke = '0.8px currentColor'; } }   // chữ "Bài n" to và đậm hơn (người dùng chốt 24/10)   // viền khung tên bài mảnh 1px (mẫu 2px nặng hơn cả chữ)
      // ô đánh số không có dữ liệu (vd ex_6 của khối Phát âm khi chỉ có 5 ví dụ) → ẩn, khỏi lộ chữ mẫu Figma ("fünf")
      el.querySelectorAll('[data-text]').forEach(x => { const n = x.dataset.n || ''; const m = n.match(/^([a-z]+_)\d+\.[\w.]+$/); if (m && !(n in (b.data || {})) && keys.some(k => k.startsWith(m[1]))) { if (/Pronunciation/.test(b.comp)) x.style.visibility = 'hidden'; else x.style.display = 'none'; x.dataset.hid = '1'; } });   // khối Phát âm: giữ chỗ ô trống để lưới cặp từ – phiên âm thẳng cột
      bookStyle(el, b.comp, b); if (opt.brand === 'Đắc Nhân') dnBook(el, b.comp);
      // PHÁT ÂM (người dùng 28/10: lưới cặp từ – nghĩa so le "kì quá"): gom ví dụ thành lưới 4 cột đều nhau, chữ Hán đi liền sau phiên âm
      if (b.comp === 'Block/Pronunciation') { const pairs = [...el.querySelectorAll('[data-n^="pair_"]')].filter(p => /^pair_\d+$/.test(p.dataset.n)); if (pairs.length) {
        const g = document.createElement('div'); g.dataset.n = 'ex_grid'; g.style.cssText = 'display:grid;grid-template-columns:repeat(4,minmax(0,1fr));column-gap:16px;row-gap:4px;align-self:stretch;margin-top:2px';
        for (let i = 1; i <= 12; i++) { const w = el.querySelector(`[data-n="ex_${i}.word"]`), v = el.querySelector(`[data-n="ex_${i}.vi"]`); if (!w || w.dataset.hid || !w.textContent.trim() || !(`ex_${i}.word` in (b.data || {}))) continue;
          const c = document.createElement('div'); c.style.cssText = 'display:flex;flex-wrap:wrap;align-items:baseline;column-gap:5px;min-width:0'; Object.assign(w.style, { flex: '0 1 auto', width: 'auto', visibility: 'visible' }); c.appendChild(w);
          const vt = v && !v.dataset.hid ? v.textContent.replace(/^\/|\/$/g, '').trim() : ''; if (v && vt) { v.textContent = vt; Object.assign(v.style, { flex: '0 1 auto', width: 'auto', fontSize: '0.92em', color: 'var(--color-text-muted, #6d6d6d)', visibility: 'visible' }); c.appendChild(v); }
          g.appendChild(c); }
        pairs[0].before(g); pairs.forEach(p => p.remove()); } } if (b.cont) { const h0 = el.querySelector('[data-n="row_0"]'); if (h0) { h0.style.display = 'none'; h0.dataset.cont = '1'; } } el.style.marginTop = (b.space || 0) + 'px'; el.dataset.space = String(b.space || 0);
      if (opt.prep) opt.prep(el); return el; };
    // BẢNG DÀI ĐƯỢC CẮT QUA TRANG (sách thật không đẩy cả bảng + tiêu đề mục sang trang sau để lại nửa trang trắng)
    const nRows = b => { if (!/Table/.test(b.comp) || !b.data) return 0; let n = 0; while (Object.keys(b.data).some(k => k.startsWith(`row_${n + 1}.`))) n++; return n; };
    const sliceT = (b, from, to) => { const d = {}; for (const [k, v] of Object.entries(b.data)) { const m = k.match(/^row_(\d+)\.(.+)$/); if (!m) { d[k] = v; continue; } const r = +m[1]; if (r === 0) d[k] = v; else if (r > from && r <= to) d[`row_${r - from}.${m[2]}`] = v; } return d; };
    const probeOf = b => nRows(b) >= 2 ? Object.assign({}, b, { data: sliceT(b, 0, 1) }) : b;   // kiểm tiêu đề mồ côi: chỉ cần đầu bảng + 1 dòng theo kèm (29/10: còn chỗ trống đã đẩy cả mục sang trang)
    const trySplit = (pg, i, el, alone) => { const b = list[i], n = nRows(b); if (n < 2) return null;   // 29/10: bảng đứng một mình mà vẫn dài hơn trang (khổ 19×27) cũng được cắt
      for (let k = n - 1; k >= 1; k--) {   /* 29/10: chỉ cần 1 dòng sang trang sau (trước để 2 → còn chỗ trống đã cắt trang) */ const part = Object.assign({}, b, { data: sliceT(b, 0, k) }); const e2 = mk(part); pg.content.replaceChild(e2, el); pg.blocks[pg.blocks.length - 1] = e2; head0(pg);
        if (fits(pg)) { list.splice(i + 1, 0, { comp: b.comp, data: sliceT(b, k, n), cont: true, space: 0, role: b.role, full: b.full || b.data }); list[i] = Object.assign(part, { full: b.full || b.data }); return e2; }
        el = e2; }
      return el; };
    const isHead = x => /(Heading|Section Bar)$/.test(x.comp) || x.role === 'label' || x.role === 'practice';   // nhãn "Lời bài nghe", "Luyện tập" không đứng trơ cuối trang
    let pg = newPage();
    for (let i = 0; i < list.length; i++) {
      const b = list[i], el = mk(b); pg.content.appendChild(el); pg.blocks.push(el); head0(pg);
      const heading = isHead(b);
      if (heading && i + 1 < list.length) {   // tiêu đề phải đi cùng khối sau nó
        // thử kèm mọi tiêu đề liền sau + khối nội dung đầu tiên; không vừa → tiêu đề (và tiêu đề ngay trước nó) sang trang mới
        const tmp = []; for (let j = i + 1; j < list.length; j++) { const nx = mk(probeOf(list[j])); pg.content.appendChild(nx); tmp.push(nx); if (!isHead(list[j])) break; }
        const ok = fits(pg); tmp.forEach(x => x.remove());
        if (!ok && pg.blocks.length > 1) { const mv = [el]; el.remove(); pg.blocks.pop();
          while (pg.blocks.length > 1 && /(Heading|Section Bar)$/.test(pg.blocks[pg.blocks.length - 1].dataset.block)) { const h = pg.blocks.pop(); h.remove(); mv.unshift(h); }
          pg = newPage(); mv.forEach(x => { pg.content.appendChild(x); pg.blocks.push(x); }); }
        continue;
      }
      if (!fits(pg) && nRows(b) >= 2) { const r = trySplit(pg, i, el); if (r && fits(pg)) continue; if (r && r !== el) { r.remove(); pg.blocks.pop(); pg.content.appendChild(el); pg.blocks.push(el); } }
      if (!fits(pg)) { if (pg.blocks.length === 1) { warns.push(`Trang ${pg.n}: khối ${b.comp.replace('Block/', '')} cao hơn trang`); continue; }
        el.remove(); pg.blocks.pop(); const prev = pg.blocks[pg.blocks.length - 1]; let carry = [];
        if (prev && /(Heading|Section Bar)$/.test(prev.dataset.block)) { prev.remove(); pg.blocks.pop(); carry = [prev]; }   // tiêu đề mồ côi cuối trang → sang trang mới
        pg = newPage(); carry.forEach(c => { pg.content.appendChild(c); pg.blocks.push(c); }); pg.content.appendChild(el); pg.blocks.push(el); head0(pg);
        if (!fits(pg) && nRows(b) >= 2) trySplit(pg, i, el, pg.blocks.length === 1);   // sang trang mới vẫn dài hơn trang (bảng 8 dòng khổ 19×27) → cắt phần dư sang trang sau
        if (!fits(pg)) warns.push(`Trang ${pg.n}: khối ${b.comp.replace('Block/', '')} cao hơn trang`); }
    }
    // CỘT NHÃN CẤU TRÚC (người dùng 29/10): các khối Cấu trúc liền nhau dùng chung bề rộng nhãn = nhãn dài nhất nhóm (≤ 40% bề ngang) → khung công thức thẳng một cột
    pages.forEach(pg => { let grp = []; const cw = pg.content.clientWidth || 400;
      const flush = () => { const ls = grp.map(e => e.querySelector('[data-n="label"]')).filter(l => l && l.offsetParent); grp = []; if (!ls.length) return;
        ls.forEach(l => Object.assign(l.style, { width: 'auto', flex: '0 0 auto', whiteSpace: 'nowrap', maxWidth: 'none' }));
        const w = Math.min(Math.ceil(Math.max(...ls.map(l => l.scrollWidth))) + 1, Math.round(cw * 0.4));
        ls.forEach(l => Object.assign(l.style, { width: w + 'px', minWidth: w + 'px', maxWidth: w + 'px', flex: `0 0 ${w}px`, whiteSpace: l.scrollWidth > w ? 'normal' : 'nowrap', boxSizing: 'border-box' })); };
      [...pg.content.children].forEach(c => { if (c.querySelector(':scope [data-n="label"]') && c.querySelector(':scope [data-n="formula"]')) grp.push(c); else flush(); }); flush(); });
    // BẢNG NỐI cùng trang (khối bảng chia nhỏ liền nhau): bỏ viền dưới phần trên + viền trên phần nối → không có vạch cam dày giữa bảng (người dùng 29/10 buổi 11)
    pages.forEach(pg => [...pg.content.children].forEach(c => { const p0 = c.previousElementSibling; if (!p0 || !c.querySelector('[data-n="row_0"][data-cont]') || p0.dataset.block !== c.dataset.block) return;
      p0.style.borderBottom = 'none'; c.style.borderTop = 'none'; }));
    // SỐ HỘI THOẠI ①② trong cột kem (giáo trình gốc): đếm theo bài, phần nối trang giữ số cũ
    { let k = 0; pages.forEach(pg => [...pg.content.children].forEach(c => { if (c.dataset.block === 'Block/Lesson Header') k = 0; const sn = c.querySelector(':scope > [data-dn="dlgno"]'); if (!sn) return;
      if (!c.querySelector('[data-n="row_0"][data-cont]')) k++; sn.textContent = CIRC(Math.max(1, k)); })); }
    // LOGO ĐẦU BÀI (Đắc Nhân): cao hơn ô đầu bài 9px mỗi phía, ô "BÀI n" chừa chỗ theo bề ngang logo → logo che kín mép ô (người dùng 29/10)
    pages.forEach(pg => pg.content.querySelectorAll('[data-dn="badge"]').forEach(im => { const el = im.parentElement, lb = el.querySelector('[data-n="lesson_box"]'); const H = el.offsetHeight; if (!H) return;
      Object.assign(im.style, { height: H + 'px', width: Math.round(H * 1.043) + 'px', top: '0px' }); if (lb) lb.style.paddingLeft = Math.round(H * 1.043 - 36 + 10) + 'px'; }));
    pages.forEach(pg => { const f = pg.content.firstElementChild; if (f) { f.style.marginTop = '0px'; const h0 = !f.dataset.dnDlg && f.querySelector('[data-n="row_0"][data-cont]'); if (h0) h0.style.display = 'flex'; } });   // bảng nối sang trang mới: hiện lại đầu bảng   // khối đầu trang không cách trên
    return { pages, warns, size };
  }

  // ---------- BÌA TRƯỚC · TRANG MỞ ĐẦU · TRANG KẾT THÚC · BÌA SAU (người dùng 28/10) ----------
  // Bìa trước / sau dựng từ mẫu Figma của khổ (A4/Cover, A4/Back Cover…). Trang mở đầu + kết thúc = lời dẫn, dàn theo form cố định
  // (nhãn nhỏ · tiêu đề · kẻ màu brand · thân bài · chữ ký) trên khung trang nội dung; CHỈ hai trang này cho sửa nội dung.
  function meta(books, buoi) {
    const s6 = (books && books.s6) || {};
    const info = tab(s6, /Khoá & bài|Khóa & bài/).find(r => isB(r, buoi)) || {};
    const course = Object.fromEntries(tab(s6, /Thông tin khoá|Thông tin khóa/).map(r => [S(r['Mục']), S(r['Nội dung'])]));
    const objs = S(info['Mục tiêu bài']).split(/\n|;\s*|(?<=[.!?])\s+(?=[A-ZÀ-ỸĐ])/).map(x => x.replace(/^[-•\d.\s]+/, '').trim()).filter(Boolean).slice(0, 5);
    const ses = tab(s6, /Khoá & bài|Khóa & bài/).map(r => bNum(r['Buổi'])).filter(n => !isNaN(n));
    const s5row = tab((books && books.s5) || {}, /^S5$/).find(r => isB(r, buoi)) || {};
    return { course: course['Tên khoá'] || '', level: course['Cấp độ'] || '', bai: info['Bài'] ? Number(info['Bài']) : null, title: S(info['Tên buổi']) || 'Buổi ' + buoi, objs, label: info['Bài'] ? 'Bài ' + Number(info['Bài']) : 'Buổi ' + bNum(buoi),
      buoi: bNum(buoi), desc: course['Mô tả khoá'] || '', dando: S(s5row['Dặn dò']),   // lời mở đầu = "Mô tả khoá" (S6) · lời dặn dò = cột "Dặn dò" (S5) của buổi – nguyên văn (28/10)
      isFirst: ses.length ? bNum(buoi) === Math.min(...ses) : true, isLast: ses.length ? bNum(buoi) === Math.max(...ses) : true };
  }
  // NỘI DUNG TRANG LỜI DẪN – chỉ lấy nguyên văn từ S5/S6, không tự viết (người dùng 28/10)
  function letterDefaults(kind, m, brand) {
    const team = `Đội ngũ biên soạn ${brand}`;
    if (kind === 'intro') return { kicker: 'LỜI MỞ ĐẦU', title: `Chào mừng bạn đến với ${m.course || 'khoá học'}`, body: m.desc || '', sign: team };   // S6 › Thông tin khoá › Mô tả khoá
    if (kind === 'thanks') return { kicker: 'LỜI CẢM ƠN', title: 'Lời cảm ơn', body: '', sign: team };   // S5/S6 không có nội dung cảm ơn → để trống cho người soạn tự điền
    return { kicker: 'LỜI DẶN DÒ', title: `Buổi ${m.buoi}`, body: m.dando || '', sign: '' };   // S5 › cột Dặn dò của buổi
  }
  function letterCss() {
    if (typeof document === 'undefined' || document.getElementById('plsLetterCss')) return; const st = document.createElement('style'); st.id = 'plsLetterCss';
    st.textContent = '.bk-letter{display:flex;flex-direction:column;flex:1 1 auto;padding:28px 8px 0;box-sizing:border-box;color:var(--color-text,#1f2a2e)}'
      + '.bk-letter .bk-kicker{font-size:9px;font-weight:700;letter-spacing:.16em;color:var(--color-primary,#406864)}'
      + '.bk-letter .bk-title{font-size:18px;line-height:1.3;font-weight:700;margin:8px 0 0;color:var(--color-primary-dark,#142738)}'
      + '.bk-letter .bk-rule{width:40px;height:3px;border-radius:2px;background:var(--color-primary,#406864);margin:12px 0 16px}'
      + '.bk-letter .bk-body{font-size:10.5px;line-height:1.7;white-space:pre-wrap}'
      + '.bk-letter .bk-sign{margin-top:20px;align-self:flex-end;font-size:10.5px;font-style:italic;font-weight:500;color:var(--color-primary,#406864)}'
      // lời mở đầu: khối chữ nằm giữa trang, tiêu đề căn giữa, dấu ngoặc kép trang trí, đoạn văn canh đều, chữ ký có gạch
      + '.bk-letter[data-letter=intro]{justify-content:center;align-items:center;padding:0 34px 70px;text-align:center}'
      + '.bk-letter[data-letter=intro] .bk-kicker{display:flex;align-items:center;gap:10px;font-size:9.5px;letter-spacing:.24em}'
      + '.bk-letter[data-letter=intro] .bk-kicker::before,.bk-letter[data-letter=intro] .bk-kicker::after{content:"";width:28px;height:1px;background:currentColor;opacity:.6}'
      + '.bk-letter[data-letter=intro] .bk-title{font-size:21px;line-height:1.35;margin:12px 0 0;max-width:92%}'
      + '.bk-letter[data-letter=intro] .bk-rule{margin:16px auto 22px;width:56px}'
      + '.bk-letter[data-letter=intro] .bk-body{position:relative;font-size:11px;line-height:1.85;text-align:justify;text-align-last:left;padding:18px 22px 16px;border-radius:10px;background:color-mix(in srgb,var(--color-primary,#406864) 6%,#fff);width:100%;box-sizing:border-box}'
      + '.bk-letter[data-letter=intro] .bk-body::before{content:"\\201C";position:absolute;left:8px;top:-16px;font-size:46px;line-height:1;font-family:Georgia,serif;color:var(--color-primary,#406864);opacity:.45}'
      + '.bk-letter[data-letter=intro] .bk-sign{margin-top:22px;align-self:flex-end;padding-top:6px;border-top:1px solid var(--color-primary,#406864);font-size:10.5px}'
      + '.bk-letter [contenteditable]{outline:none;border-radius:4px}.bk-letter [contenteditable]:hover{box-shadow:0 0 0 1px #c9b8f5}.bk-letter [contenteditable]:focus{box-shadow:0 0 0 2px #7c5cd6;background:rgba(124,92,214,.05)}'
      + '.bk-letter [contenteditable]:empty::before{content:attr(data-ph);color:#a99bd6;font-style:italic}'
      + '@media print{.bk-letter [contenteditable]{box-shadow:none!important;background:none!important}.bk-letter [contenteditable]:empty::before{content:none}}';
    document.head.appendChild(st);
  }
  // BÌA SỬA ĐƯỢC – Đắc Nhân "Tổng hợp HSK" (người dùng 29/10): dựng lại đúng bìa giáo trình HSK1 bản 4.1 bằng HTML (khung A4 595×842, px = pt);
  // logo + chữ thương hiệu + bố cục cố định; chữ có data-field sửa được (lưu theo bài như trang lời dẫn); ảnh minh hoạ thay được (txt.img).
  const EDIT_COVERS = { 'Đắc Nhân': [{ id: 'dac-nhan-hsk-edit', label: 'Tổng hợp HSK (sửa chữ, đổi ảnh)', edit: 'dn-hsk' }] };
  const DROP_COVERS = { 'Đắc Nhân': /^dac-nhan-dn-\d+$/ };   // người dùng 29/10: bỏ hàng bìa ảnh ĐN 1–6, chỉ dùng bìa dựng lại sửa được
  function addEditCovers() { const C = root.PLS_COVERS; if (!C) return; for (const [b, list] of Object.entries(EDIT_COVERS)) { C[b] = C[b] || { front: [], back: [] }; for (const x of list.slice().reverse()) if (!C[b].front.some(y => y.id === x.id)) C[b].front.unshift(x); }
    for (const [b, re] of Object.entries(DROP_COVERS)) if (C[b]) { C[b].front = C[b].front.filter(x => !re.test(x.id)); C[b].back = (C[b].back || []).filter(x => !re.test(x.id)); } }
  addEditCovers();
  function dnCover(t, img, logo) {
    const O = '#E65425', D = '#B72025', G = '#3A3A3C';
    const band = !t.img && /^([1-9]|10)$/.test(String(t.band || '')) ? String(t.band) : '';   // ảnh mẫu 1–10 (người dùng 29/10): ảnh đã gồm viền cam trên dưới → phủ cả dải, bỏ 2 vạch đỏ
    const f = (k, def, css, tag) => `<${tag || 'div'} data-field="${k}" style="position:absolute;white-space:pre;${css}">${esc(t[k] != null ? t[k] : def)}</${tag || 'div'}>`;
    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
    return `<div class="dn-cover" style="position:relative;width:595px;height:842px;overflow:hidden;background:#fff;font-family:Montserrat,sans-serif;color:${G}">
    <img src="${logo}" style="position:absolute;left:64.4px;top:38.2px;width:78.4px;height:32.7px" alt="">
    <div style="position:absolute;left:153.4px;top:41.8px;width:1.7px;height:25.9px;background:${G}"></div>
    <div style="position:absolute;left:167px;top:40.5px;font-weight:700;font-size:10.6px;line-height:13.5px">TẠI ĐẮC NHÂN<br>TRI THỨC TRUYỀN TỪ TÂM</div>
    <div style="position:absolute;right:37.6px;top:38.6px;text-align:right;font-weight:700;font-size:10.9px;line-height:13.95px">TÀI LIỆU LƯU HÀNH NỘI BỘ<br>VÀ DÀNH RIÊNG CHO<br><span style="color:${O}">HỌC VIÊN ĐẮC NHÂN</span></div>
    ${f('title1', 'TỔNG HỢP', `left:66.2px;top:156.2px;font-weight:800;font-size:40.8px;line-height:49px;color:${O};letter-spacing:-0.36px`)}
    ${f('title2', 'HSK', `left:57.8px;top:185.8px;font-weight:800;font-size:173.6px;line-height:185px;color:${O};letter-spacing:-1.6px`)}
    ${f('for', 'Được thiết kế dành riêng cho', `left:65.6px;top:378.3px;font-style:italic;font-weight:600;font-size:11.06px;line-height:14.7px`)}
    ${f('audience', 'NGƯỜI MỚI BẮT ĐẦU\n& LÀM QUEN VỚI TIẾNG TRUNG', `left:66.2px;top:394.0px;font-weight:700;font-size:17.17px;line-height:21.85px;color:${O}`)}
    <div style="position:absolute;left:67px;top:452.6px;width:31.7px;height:5.8px;border-radius:3px;background:${O}"></div>
    ${f('edition', 'Tái bản lần 6 - 03/2026', `left:105.5px;top:448.2px;font-style:italic;font-weight:700;font-size:10.66px;line-height:14.2px`)}
    ${band ? `<div data-img="band" style="position:absolute;left:0;top:485.6px;width:595px;height:283.9px;background:#E86A37 url('covers/dac-nhan-band-${band}.jpg') center/cover no-repeat"></div>` : `<div style="position:absolute;left:0;top:485.6px;width:595px;height:7.8px;background:${D}"></div>
    <div data-img="band" style="position:absolute;left:0;top:493.4px;width:595px;height:268.5px;background:#E86A37 url('${img}') center/cover no-repeat"></div>
    <div style="position:absolute;left:0;top:761.9px;width:595px;height:7.6px;background:${D}"></div>`}
    <div style="position:absolute;left:393.5px;top:386.1px;width:166px;height:166px;box-sizing:border-box;border:3px solid ${O};border-radius:14px;background:#fff">
      ${f('vol_label', 'QUYỂN', `left:-4.8px;right:0;top:23.8px;text-align:center;font-weight:800;font-size:27.7px;line-height:32px;color:${O}`)}
      ${f('vol_no', '01', `left:0;right:0;top:46.8px;text-align:center;font-weight:800;font-size:93.7px;line-height:104.6px;color:${O}`)}
    </div>
    <div style="position:absolute;left:59.2px;right:33px;top:788px;height:26px;display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:16px">
      ${['TỪ VỰNG', 'NGỮ PHÁP', 'HỘI THOẠI', 'LUYỆN VIẾT'].map((d, i) => (i ? `<span style="width:2px;height:18px;background:${O}"></span>` : '') + `<span data-field="tag_${i + 1}" style="white-space:pre">${esc(t['tag_' + (i + 1)] != null ? t['tag_' + (i + 1)] : d)}</span>`).join('')}
    </div>
  </div>`;
  }
  // kind: 'cover' | 'intro' | 'outro' | 'back' · txt: nội dung đã sửa của trang lời dẫn {kicker,title,body,sign}
  function extraPage(kind, opt) {
    const E = root.PLS_ENGINE, size = SIZES[opt.size] || SIZES.A4, pre = opt.size === '19x27' ? '19x27' : 'A4', m = opt.meta || {};
    if (kind === 'cover' || kind === 'back') {
      // MẪU BÌA ẢNH (Figma › IMAGE LIBRARY › Bìa sách): chọn trong thanh "Bìa" của chế độ sách; 'tpl' = mẫu chữ của khổ (A4/Cover…)
      const pid = opt.pick, C = root.PLS_COVERS || {};
      const hit = pid && pid !== 'tpl' ? Object.values(C).flatMap(b => b.front.concat(b.back)).find(x => x.id === pid) : null;
      if (hit && hit.edit === 'dn-hsk') { const [w, h] = opt.size === '19x27' ? [538.6, 765.4] : [595, 842], t = opt.txt || {};
        const host = document.createElement('div'); host.className = 'pls-book-cover'; host.dataset.coverId = hit.id; host.dataset.edit = '1';
        host.style.cssText = `position:relative;transform-origin:0 0;width:${w}px;height:${h}px;overflow:hidden;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact`;
        host.innerHTML = dnCover(t, t.img || 'covers/dac-nhan-hsk-band.jpg', 'covers/dac-nhan-logo.png');
        const inner = host.firstElementChild; inner.style.transformOrigin = '0 0'; if (w !== 595) inner.style.transform = `scale(${w / 595}, ${h / 842})`;
        opt.stage.appendChild(host); return { host, kind, n: null, cover: hit }; }
      if (hit) { const [w, h] = opt.size === '19x27' ? [538.6, 765.4] : [595, 842];
        const host = document.createElement('div'); host.className = 'pls-book-cover'; host.dataset.coverId = hit.id;
        host.style.cssText = `position:relative;transform-origin:0 0;width:${w}px;height:${h}px;overflow:hidden;background:#fff url("covers/${hit.id}.jpg") center/cover no-repeat;-webkit-print-color-adjust:exact;print-color-adjust:exact`;
        opt.stage.appendChild(host); return { host, kind, n: null, cover: hit }; }
      const comp = `${pre}/${kind === 'cover' ? 'Cover' : 'Back Cover'}`; if (!TPL(comp)) return null;
      const short = (m.course || '').split(/\s+[–-]\s+|\s*\(/)[0];   // tên khoá dài → lấy phần trước dấu "–" / "("
      const ttl = (short && short.length <= 28 ? short : (m.level || short || 'TÀI LIỆU')).toUpperCase();
      const data = kind === 'cover' ? { title: ttl, subtitle: `${m.label} – ${String(m.title).replace(/^Bài\s*\d+\s*[–-]\s*/i, '')}`, tag_1: 'TỪ VỰNG', tag_2: 'NGỮ PHÁP', tag_3: 'HỘI THOẠI' } : {};
      const r = E.render({ comp, data }, opt.brand); opt.stage.appendChild(r.host); r.host.classList.add('pls-book-cover');
      r.host.querySelectorAll('.pls-imgslot, .pls-imgempty').forEach(e => { e.style.display = 'none'; });   // mẫu chữ: không in khung "Ảnh minh hoạ" trống
      return { host: r.host, kind, n: null };
    }
    bookCss(); letterCss();
    const n = opt.n, front = kind === 'intro';   // LỜI MỞ ĐẦU (người dùng 29/10): trang mở sách – không in số trang, không chữ chạy đầu trang (vẫn tính trong dãy số)
    const r = E.render({ comp: size.page(n), data: { running: front ? '' : (opt.running || ''), page_no: front || n % 2 === 0 ? '' : String(n), page_no_l: !front && n % 2 === 0 ? String(n) : '' } }, opt.brand);
    opt.stage.appendChild(r.host); r.host.classList.add('pls-book-page'); r.host.style.setProperty('--book-font', bookFont(opt.brand)); pageFrame(r.host, opt.size);
    if (front) r.host.querySelectorAll('[data-n="running"], [data-n="page_no"], [data-n="page_no_l"]').forEach(e => { e.style.visibility = 'hidden'; });
    const content = r.host.querySelector('[data-n="content"]'); [...content.children].forEach(c => c.remove());
    const t = Object.assign(letterDefaults(kind, m, opt.brand), opt.txt || {});
    const box = document.createElement('div'); box.className = 'bk-letter'; box.dataset.letter = kind;
    [['kicker', 'div'], ['title', 'h1'], ['rule', 'div'], ['body', 'div'], ['sign', 'div']].forEach(([f, tag]) => { const e = document.createElement(tag); e.className = 'bk-' + f; if (f !== 'rule') { e.dataset.field = f; e.textContent = t[f] || ''; if (f === 'body') e.dataset.ph = kind === 'thanks' ? 'S5/S6 không có nội dung lời cảm ơn – bấm vào đây để nhập (dòng này không in ra)' : 'S5/S6 để trống ô này – bấm vào đây để nhập (dòng này không in ra)'; } box.appendChild(e); });
    content.appendChild(box);
    // CHỮ DÀI HƠN TRANG (người dùng 29/10: lời mở đầu "bị mất dòng"): thu nhỏ chữ + giãn dòng dần tới khi vừa trang; vẫn không vừa → bỏ căn giữa dọc
    fitLetter(r.host);
    return { host: r.host, kind, n };
  }

  function fitLetter(host) {
    const content = host.querySelector('[data-n="content"]'), box = host.querySelector('.bk-letter'), body = box && box.querySelector('.bk-body'); if (!content || !body) return;
    ['justifyContent', 'paddingBottom', 'paddingTop'].forEach(k => { box.style[k] = ''; }); body.style.fontSize = ''; body.style.lineHeight = '';   // làm lại từ đầu (sửa tay ngắn đi thì to lại)
    const over = () => content.scrollHeight > content.clientHeight + 1 || box.scrollHeight > box.clientHeight + 1;
    if (!over()) return; box.style.justifyContent = 'flex-start'; box.style.paddingBottom = '0'; box.style.paddingTop = '8px';
    for (const [fs, lh] of [[10.5, 1.75], [10, 1.7], [9.5, 1.65], [9, 1.6], [8.5, 1.55], [8, 1.5], [7.5, 1.45]]) { if (!over()) break; body.style.fontSize = fs + 'px'; body.style.lineHeight = String(lh); }
  }
  // MỤC LỤC (người dùng 29/10 – sách cả khoá): trang nội dung thường (chữ chạy + số trang) với danh sách "Bài n – tên bài …… trang"
  function tocPage(opt) {
    const E = root.PLS_ENGINE, size = SIZES[opt.size] || SIZES.A4, n = opt.n;
    bookCss();
    const r = E.render({ comp: size.page(n), data: { running: opt.running || '', page_no: n % 2 === 0 ? '' : String(n), page_no_l: n % 2 === 0 ? String(n) : '' } }, opt.brand);
    opt.stage.appendChild(r.host); r.host.classList.add('pls-book-page'); r.host.style.setProperty('--book-font', bookFont(opt.brand)); pageFrame(r.host, opt.size);
    const content = r.host.querySelector('[data-n="content"]'); [...content.children].forEach(c => c.remove());
    const dn = opt.brand === 'Đắc Nhân', box = document.createElement('div'); box.className = 'bk-toc'; box.style.cssText = 'display:flex;flex-direction:column;gap:6px;padding:14px 6px 0;flex:1 1 auto;align-self:stretch;width:100%;box-sizing:border-box';   /* rộng hết trang ở mọi trang mục lục (trang 2 không có tiêu đề → bị co) */
    if (opt.head) { const h = document.createElement('div'); h.textContent = 'MỤC LỤC'; h.style.cssText = `text-align:center;font-weight:800;font-size:20px;letter-spacing:.04em;margin-bottom:14px;color:${dn ? 'var(--color-primary, #e65100)' : 'var(--color-primary-dark, #142738)'}`; box.appendChild(h); }
    for (const e of opt.entries) { const row = document.createElement('div'); row.style.cssText = 'display:flex;align-items:baseline;gap:6px;font-size:11px;line-height:1.35';
      const a = document.createElement('span'); a.style.cssText = `font-weight:700;color:${dn ? 'var(--color-primary-dark, #b33e00)' : 'var(--color-primary, #406864)'};flex:0 0 auto`; a.textContent = e.label;
      const t = document.createElement('span'); t.style.cssText = 'flex:0 1 auto;min-width:0;color:#262626;opacity:1;font-weight:500'; t.textContent = e.title;   /* màu đậm cố định: máy khác không bị mờ (người dùng 29/10) */
      const d = document.createElement('span'); d.style.cssText = 'flex:1 1 auto;border-bottom:1px dotted #6f6f6f;transform:translateY(-3px);min-width:20px';
      const pn = document.createElement('span'); pn.style.cssText = 'flex:0 0 auto;font-weight:700;color:#262626;opacity:1'; pn.textContent = String(e.page);
      row.append(a, t, d, pn); box.appendChild(row); }
    content.appendChild(box);
    return { host: r.host, kind: 'toc', n };
  }
  // ---------- in PDF ----------
  function print(size) {
    const s = SIZES[size] || SIZES.A4; let st = document.getElementById('bookPrintCss');
    if (!st) { st = document.createElement('style'); st.id = 'bookPrintCss'; document.head.appendChild(st); }
    st.textContent = `@page{size:${s.mm[0]}mm ${s.mm[1]}mm;margin:0}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}`;   // in giữ màu nền (đầu bảng cam…) dù chưa tick "Đồ hoạ nền" (người dùng 29/10: tải PDF bị mất màu)
    window.print();
  }
  root.PLS_BOOK = { blocks, paginate, print, SIZES, bookFamilies, bookFont, meta, extraPage, letterDefaults, tocPage, fitLetter };
})(typeof window !== 'undefined' ? window : globalThis);
