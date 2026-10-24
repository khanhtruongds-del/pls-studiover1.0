// SÁCH A4 / 19×27 + PDF (thay luồng sách của fit_js: spec.blocks → xếp trang → PDF).
// Từ Excel S5/S6 của buổi đang chọn → danh sách khối (Block/* của Figma) → xếp vào trang (A4/Content, 19x27/Content Odd|Even):
// thêm từng khối, tràn thì sang trang mới; tiêu đề mục không đứng cuối trang (mồ côi); bảng/bài tập dài tách thành nhiều khối.
// Xuất PDF = in trang bằng trình duyệt (chữ vẫn là chữ, không phải ảnh) với @page đúng khổ.
(function (root) {
  const S = v => (v == null ? '' : String(v)).trim();
  const chunk = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };
  // chia đều (33 từ / 8 dòng → 7·7·7·6·6, không để bảng cuối lẻ 1 dòng)
  const chunkEven = (a, n) => { const k = Math.ceil(a.length / n) || 1, sz = Math.ceil(a.length / k); return chunk(a, sz); };
  const tab = (book, re) => { const k = Object.keys(book || {}).find(n => re.test(n)); return k ? book[k] : []; };
  const isB = (r, b) => Number(r['Buổi']) === Number(b);
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
    B('Block/Lesson Header', { lesson: 'Bài ' + (info['Bài'] ? Number(info['Bài']) : buoi), 'title.vi': title, 'title.native': course['Tên khoá'] || '' });
    const objs = S(info['Mục tiêu bài'] || s5row['Mục tiêu bài']).split(/\n|;\s*|(?<=[.!?])\s+(?=[A-ZÀ-ỸĐ])/).map(x => x.replace(/^[-•\d.\s]+/, '').trim()).filter(Boolean).slice(0, 5);
    if (objs.length) { const d = { no: '', title: 'Mục tiêu bài học' }; objs.forEach((t, i) => { d[`obj_${i + 1}.bullet`] = '•'; d[`obj_${i + 1}.text`] = t; }); B('Block/Objectives', d); }

    const pron = tab(s6, /Phát âm/).filter(r => isB(r, buoi) && onPDF(r));
    if (pron.length) { SEC('Phát âm');
      for (const p of pron) { const capH = s => /\s/.test(s) ? s.replace(/^[a-zà-ỹđ]/, c => c.toUpperCase()) : s, a1 = capH(S(p['Chữ / âm'])), a2 = capH(S(p['Bảng chữ / nhóm âm'])); B('Block/Sub Heading', { text: a2 && !a1.toLowerCase().includes(a2.toLowerCase()) ? `${a1} · ${a2}` : a1 || a2 });   // không lặp "Nối âm … · Nối âm"
        if (S(p['Hướng dẫn phát âm'])) B('Block/Paragraph', { text: S(p['Hướng dẫn phát âm']) });
        const exR = S(p['Ví dụ']), exs = exR.split(exR.includes(';') ? /;\s*/ : /,\s*/).filter(Boolean).slice(0, 6);
        if (exs.length) { const d = { no: 'Bài ' + ex(), instruction: 'Đọc to các từ sau.', 'head.track': '', 'head.ab': '' }; exs.forEach((x, i) => { const m = x.match(/^(.*?)\s*\(([^)]*)\)\s*$/); d[`ex_${i + 1}.word`] = m ? m[1] : x; d[`ex_${i + 1}.vi`] = m ? '/' + m[2] + '/' : ''; }); for (let i = exs.length; i < 12; i++) { d[`ex_${i + 1}.word`] = ''; d[`ex_${i + 1}.vi`] = ''; } B('Block/Pronunciation', d); } } }

    const vocab = tab(s6, /Từ vựng$/).filter(r => isB(r, buoi) && onPDF(r) && S(r['Từ']));
    if (vocab.length) { SEC('Từ vựng');
      for (const [pi, part] of chunkEven(vocab, 8).entries()) { const d = { 'row_0.c1': 'Từ', 'row_0.c2': 'Phiên âm', 'row_0.c3': 'Loại từ', 'row_0.c4': 'Nghĩa' }; part.forEach((r, i) => { d[`row_${i + 1}.c1`] = S(r['Từ']); d[`row_${i + 1}.c2`] = S(r['Phiên âm / cách đọc']); d[`row_${i + 1}.c3`] = S(r['Loại từ']); d[`row_${i + 1}.c4`] = S(r['Nghĩa']); }); B('Block/Vocab Table', d); if (pi) out[out.length - 1].cont = true; } }

    const grammar = tab(s6, /Ngữ pháp$/).filter(r => isB(r, buoi) && onPDF(r));
    const gq = tab(s6, /Câu hỏi ngữ pháp/).filter(r => isB(r, buoi) && onPDF(r));
    if (grammar.length) { SEC('Ngữ pháp');
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
    }

    const speak = tab(s6, /Mẫu câu/).filter(r => isB(r, buoi) && onPDF(r) && S(r['Câu']));
    if (speak.length) { SEC('Mẫu câu giao tiếp');
      for (const [pi, part] of chunkEven(speak, 8).entries()) { const d = { 'row_0.c1': 'Câu', 'row_0.c2': 'Nghĩa' }; part.forEach((r, i) => { d[`row_${i + 1}.c1`] = S(r['Câu']); d[`row_${i + 1}.c2`] = S(r['Nghĩa']); }); B('Block/Table N', d); if (pi) out[out.length - 1].cont = true; } }

    const segs = (rows, tk) => { const m = new Map(); rows.forEach(r => { const x = S(r['Mã đoạn']) || S(r[tk]); if (!m.has(x)) m.set(x, []); m.get(x).push(r); }); return [...m.values()]; };   // QC F03/F04: tách đoạn theo tiêu đề
    const lis = tab(s6, /^S6-Nghe$/).filter(r => isB(r, buoi) && onPDF(r) && S(r['Câu'])), lq = tab(s6, /Nghe câu hỏi/).filter(r => isB(r, buoi) && onPDF(r));
    if (lis.length || lq.length) { SEC('Nghe');
      for (const c of [...new Set(lis.map(r => S(r['Mã bài'])).concat(lq.map(r => S(r['Mã bài']))))].filter(Boolean)) {
        const ls = lis.filter(r => S(r['Mã bài']) === c).sort((a, b) => (+a['Câu số'] || 0) - (+b['Câu số'] || 0)); const r0 = ls[0] || {};
        B('Block/Sub Heading', { text: [S(r0['Tiêu đề bài nghe']), S(r0['Nghĩa tiêu đề'])].filter(Boolean).join(' – ') || c });
        exercises(lq.filter(r => S(r['Mã bài']) === c), 'Nghe rồi chọn đáp án đúng.');
        for (const g of segs(ls, 'Tiêu đề bài nghe')) { const r1 = g[0] || {};
        if (g.length) { B('Block/Paragraph', { text: 'Lời bài nghe' + (S(r1['Tiêu đề bài nghe']) ? ': ' + S(r1['Tiêu đề bài nghe']) : '') }); out[out.length - 1].role = 'label'; }
        for (const part of chunk(g, 4)) { const d = {}; part.forEach((r, i) => { d[`line_${i + 1}.speaker`] = S(r['Vai / nhân vật']) || '–'; d[`line_${i + 1}.de`] = S(r['Câu']); d[`line_${i + 1}.vi`] = S(r['Nghĩa']); }); B('Block/Dialogue', d); } }
      } }

    const rd = tab(s6, /^S6-Đọc$/).filter(r => isB(r, buoi) && onPDF(r) && S(r['Câu'])), rq = tab(s6, /Đọc câu hỏi/).filter(r => isB(r, buoi) && onPDF(r));
    if (rd.length || rq.length) { SEC('Đọc');
      for (const c of [...new Set(rd.map(r => S(r['Mã bài'])).concat(rq.map(r => S(r['Mã bài']))))].filter(Boolean)) {
        const ls = rd.filter(r => S(r['Mã bài']) === c).sort((a, b) => ((+a['Đoạn'] || 0) - (+b['Đoạn'] || 0)) || ((+a['Câu số'] || 0) - (+b['Câu số'] || 0))); const r0 = ls[0] || {};
        for (const g of segs(ls, 'Tiêu đề bài đọc')) { const r1 = g[0] || {};
        const paras = []; let cur = null; for (const r of g) { const p = String(r['Đoạn'] || 1); if (!cur || cur.p !== p) paras.push(cur = { p, t: [], v: [] }); cur.t.push(S(r['Câu'])); cur.v.push(S(r['Nghĩa'])); }
        paras.forEach((p, i) => B('Block/Reading', { tag: i ? '' : 'Bài đọc', title: i ? '' : ([S(r1['Tiêu đề bài đọc']), S(r1['Nghĩa tiêu đề'])].filter(Boolean).join(' – ') || c), text: p.t.join(' '), 'text.vi': '' })); }
        exercises(rq.filter(r => S(r['Mã bài']) === c), 'Đọc bài rồi chọn đáp án đúng.');
      } }

    const hw = tab(s6, /BTVN/).filter(r => isB(r, buoi) && onPDF(r));
    if (hw.length) { SEC('Bài tập về nhà'); exercises(hw, ''); }

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
      for (const gr of groups) if (!gr.ins) gr.ins = gr.kind === 'match' ? 'Nối cho phù hợp.' : gr.kind === 'order' ? 'Sắp xếp thành câu đúng.' : gr.kinds.size > 1 ? 'Làm các câu sau.' : gr.kind === 'mc' ? 'Chọn đáp án đúng.' : 'Hoàn thành các câu sau.';
      for (const gr of groups) for (const part of chunk(gr.rows, 5)) {
        const no = ex(), d = { no: 'Bài ' + no, instruction: gr.ins || 'Làm bài tập.', 'head.track': '', 'head.ab': '' };
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
      el.querySelectorAll('[data-n$="_cell"]').forEach(c => { Object.assign(c.style, { justifyContent: 'flex-start', padding: '5px 8px' }); const t = c.querySelector('[data-text]'); if (t) t.style.textAlign = 'left'; });
      el.querySelectorAll('[data-n^="row_"]').forEach(r => { if (!/^row_\d+$/.test(r.dataset.n)) return; r.style.height = 'auto'; const c1 = r.querySelector('[data-n="c1"]'); if (c1 && r.dataset.n !== 'row_0') c1.style.fontWeight = '600'; });
      // bảng đáp án: cột số câu hẹp, căn giữa, màu brand; giải thích chiếm phần lớn bề ngang
      const AW = b && { ans3: { c1: 9, c2: 28, c3: 63 }, ans2: { c1: 10, c2: 90 }, ansgrid: { c1: 7, c2: 18, c3: 7, c4: 18, c5: 7, c6: 18, c7: 7, c8: 18 } }[b.role];
      if (AW) el.querySelectorAll('[data-n$="_cell"]').forEach(c => { const k = c.dataset.n.replace('_cell', ''); if (!AW[k]) return; c.style.flex = `${AW[k]} 1 0px`;
        const num = AW[k] <= 10; if (num) { c.style.justifyContent = 'center'; c.style.padding = '5px 4px'; const t = c.querySelector('[data-text]'); if (t) { t.style.textAlign = 'center'; t.style.fontWeight = '700'; t.style.color = 'var(--color-primary-ink, var(--color-primary, #406864))'; } }
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
    if (/Structure/.test(comp)) { const f = el.querySelector('[data-n="formula"]'); const t = f && f.textContent; const c = t ? t.indexOf(': ') : -1;
      if (c > 0) f.innerHTML = `${escH(t.slice(0, c))}<span style="font-weight:400;color:var(--color-text, #3d3d3d)">&nbsp;&nbsp;→&nbsp;${escH(t.slice(c + 2))}</span>`; }
    if (/Exercise/.test(comp)) el.querySelectorAll('[data-n$=".text"]').forEach(optionGrid);
  }

  // ---------- MỘT FONT CHO CẢ SÁCH (người dùng chốt 23/10) ----------
  // Cả cuốn dùng một họ Noto: Noto Sans cho chữ Latin / Việt / IPA; chữ Hán – Kana – Hangul rơi sang Noto Sans JP / KR / SC
  // (cùng nhà thiết kế, cùng độ cao chữ, cùng nét) → dòng chữ Việt và chữ tượng hình thẳng hàng, dễ canh, dễ so.
  // Phân cấp chỉ bằng CỠ + ĐỘ ĐẬM của cùng một font (400 thường · 500 nhãn · 600 tiêu đề con · 700 tiêu đề).
  const BOOK_CJK = { Sakumi: 'Noto Sans JP', Saechang: 'Noto Sans KR', 'Đắc Nhân': 'Noto Sans SC' };
  const bookFont = brand => `'Noto Sans', '${BOOK_CJK[brand] || 'Noto Sans JP'}', 'Noto Sans SC', 'Noto Sans KR', sans-serif`;
  const bookFamilies = brand => ['Noto Sans', BOOK_CJK[brand]].filter(Boolean);
  function bookCss() {
    if (typeof document === 'undefined' || document.getElementById('plsBookCss')) return; const st = document.createElement('style'); st.id = 'plsBookCss';
    // ép một font cho mọi chữ trong trang sách (mẫu Figma gắn font riêng từng ô: heading / body / native / doc)
    st.textContent = '.pls-book-page, .pls-book-page *{font-family:var(--book-font) !important;font-synthesis:none}'
      + '.pls-book-page [data-comp="Block/Sub Heading"] *,.pls-book-page [data-n="Block/Sub Heading"] *{white-space:pre-wrap !important;max-width:100%;min-width:0;overflow-wrap:break-word}'   // QC 24/10: tiêu đề ngữ pháp dài bị cắt ở lề phải (23 chỗ) → xuống dòng
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
  }

  function paginate(list, opt) {
    bookCss();
    list.forEach((b, i) => { b.space = SPACE(list[i - 1], b); });
    const E = root.PLS_ENGINE, size = SIZES[opt.size] || SIZES.A4, stage = opt.stage, pages = [], warns = [];
    const running = opt.running || '';
    const newPage = () => { const n = pages.length + 1; const comp = size.page(n);
      const r = E.render({ comp, data: { running, page_no: opt.size === '19x27' && n % 2 === 0 ? '' : String(n), page_no_l: opt.size === '19x27' && n % 2 === 0 ? String(n) : '' } }, opt.brand);
      stage.appendChild(r.host); r.host.classList.add('pls-book-page'); r.host.style.setProperty('--book-font', bookFont(opt.brand)); pageFrame(r.host, opt.size);
      const content = r.host.querySelector('[data-n="content"]'); [...content.children].forEach(c => c.remove()); content.style.gap = '0px'; content.style.rowGap = '0px';
      const pg = { host: r.host, content, n, blocks: [] }; pages.push(pg); return pg; };
    const head0 = pg => { const f = pg.blocks[0]; const h0 = f && f.querySelector('[data-n="row_0"][data-cont]'); if (h0) h0.style.display = 'flex'; };   // bảng nối đứng đầu trang → hiện đầu bảng TRƯỚC khi đo
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
        if (L) Object.assign(L.style, { flex: '0 0 auto', height: 'auto', minHeight: '0', fontSize: '28px', lineHeight: '1', textAlign: 'left', fontWeight: '700' });
        if (T) Object.assign(T.style, { flex: '1 1 0px', height: 'auto', minHeight: '0', fontSize: '22px', lineHeight: '1.15', fontWeight: '700', color: 'var(--color-primary, #406864)' });
        Object.assign(el.style, { alignItems: 'center', gap: '12px', paddingBottom: '8px' }); }
      // Lesson Header: ô "Bài N" và khung tên bài cao bằng nhau (mẫu để ô bài cao 72 cố định, khung tên cao theo chữ → lệch)
      if (b.comp === 'Block/Lesson Header') { el.style.alignItems = 'stretch'; el.querySelectorAll('[data-n="lesson_box"], [data-n="title_box"]').forEach(x => { x.style.height = 'auto'; x.style.minHeight = '72px'; x.style.alignSelf = 'stretch'; });
        const tb = el.querySelector('[data-n="title_box"]'); if (tb) tb.style.boxShadow = 'inset 0 0 0 1px var(--color-primary-dark, #142738)';
        const ln = el.querySelector('[data-n="lesson"]'); if (ln) { ln.dataset.fs = '30'; ln.style.fontSize = '30px'; ln.style.fontWeight = '800'; } }   // chữ "Bài n" to và đậm hơn (người dùng chốt 24/10)   // viền khung tên bài mảnh 1px (mẫu 2px nặng hơn cả chữ)
      // ô đánh số không có dữ liệu (vd ex_6 của khối Phát âm khi chỉ có 5 ví dụ) → ẩn, khỏi lộ chữ mẫu Figma ("fünf")
      el.querySelectorAll('[data-text]').forEach(x => { const n = x.dataset.n || ''; const m = n.match(/^([a-z]+_)\d+\.[\w.]+$/); if (m && !(n in (b.data || {})) && keys.some(k => k.startsWith(m[1]))) { if (/Pronunciation/.test(b.comp)) x.style.visibility = 'hidden'; else x.style.display = 'none'; x.dataset.hid = '1'; } });   // khối Phát âm: giữ chỗ ô trống để lưới cặp từ – phiên âm thẳng cột
      bookStyle(el, b.comp, b); if (b.cont) { const h0 = el.querySelector('[data-n="row_0"]'); if (h0) { h0.style.display = 'none'; h0.dataset.cont = '1'; } } el.style.marginTop = (b.space || 0) + 'px'; el.dataset.space = String(b.space || 0);
      if (opt.prep) opt.prep(el); return el; };
    // BẢNG DÀI ĐƯỢC CẮT QUA TRANG (sách thật không đẩy cả bảng + tiêu đề mục sang trang sau để lại nửa trang trắng)
    const nRows = b => { if (!/Table/.test(b.comp) || !b.data) return 0; let n = 0; while (Object.keys(b.data).some(k => k.startsWith(`row_${n + 1}.`))) n++; return n; };
    const sliceT = (b, from, to) => { const d = {}; for (const [k, v] of Object.entries(b.data)) { const m = k.match(/^row_(\d+)\.(.+)$/); if (!m) { d[k] = v; continue; } const r = +m[1]; if (r === 0) d[k] = v; else if (r > from && r <= to) d[`row_${r - from}.${m[2]}`] = v; } return d; };
    const probeOf = b => nRows(b) > 3 ? Object.assign({}, b, { data: sliceT(b, 0, 2) }) : b;   // kiểm tiêu đề mồ côi: chỉ cần đầu bảng + 2 dòng theo kèm
    const trySplit = (pg, i, el) => { const b = list[i], n = nRows(b); if (n < 4 || pg.blocks.length < 2) return null;
      for (let k = n - 2; k >= 2; k--) { const part = Object.assign({}, b, { data: sliceT(b, 0, k) }); const e2 = mk(part); pg.content.replaceChild(e2, el); pg.blocks[pg.blocks.length - 1] = e2; head0(pg);
        if (fits(pg)) { list.splice(i + 1, 0, { comp: b.comp, data: sliceT(b, k, n), cont: true, space: 0, role: b.role }); list[i] = part; return e2; }
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
      if (!fits(pg) && nRows(b) >= 4 && pg.blocks.length > 1) { const r = trySplit(pg, i, el); if (r && fits(pg)) continue; if (r && r !== el) { r.remove(); pg.blocks.pop(); pg.content.appendChild(el); pg.blocks.push(el); } }
      if (!fits(pg)) { if (pg.blocks.length === 1) { warns.push(`Trang ${pg.n}: khối ${b.comp.replace('Block/', '')} cao hơn trang`); continue; }
        el.remove(); pg.blocks.pop(); const prev = pg.blocks[pg.blocks.length - 1]; let carry = [];
        if (prev && /(Heading|Section Bar)$/.test(prev.dataset.block)) { prev.remove(); pg.blocks.pop(); carry = [prev]; }   // tiêu đề mồ côi cuối trang → sang trang mới
        pg = newPage(); carry.forEach(c => { pg.content.appendChild(c); pg.blocks.push(c); }); pg.content.appendChild(el); pg.blocks.push(el); head0(pg);
        if (!fits(pg)) warns.push(`Trang ${pg.n}: khối ${b.comp.replace('Block/', '')} cao hơn trang`); }
    }
    pages.forEach(pg => { const f = pg.content.firstElementChild; if (f) { f.style.marginTop = '0px'; const h0 = f.querySelector('[data-n="row_0"][data-cont]'); if (h0) h0.style.display = 'flex'; } });   // bảng nối sang trang mới: hiện lại đầu bảng   // khối đầu trang không cách trên
    return { pages, warns, size };
  }

  // ---------- in PDF ----------
  function print(size) {
    const s = SIZES[size] || SIZES.A4; let st = document.getElementById('bookPrintCss');
    if (!st) { st = document.createElement('style'); st.id = 'bookPrintCss'; document.head.appendChild(st); }
    st.textContent = `@page{size:${s.mm[0]}mm ${s.mm[1]}mm;margin:0}`;
    window.print();
  }
  root.PLS_BOOK = { blocks, paginate, print, SIZES, bookFamilies, bookFont };
})(typeof window !== 'undefined' ? window : globalThis);
