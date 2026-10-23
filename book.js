// SÁCH A4 / 19×27 + PDF (thay luồng sách của fit_js: spec.blocks → xếp trang → PDF).
// Từ Excel S5/S6 của buổi đang chọn → danh sách khối (Block/* của Figma) → xếp vào trang (A4/Content, 19x27/Content Odd|Even):
// thêm từng khối, tràn thì sang trang mới; tiêu đề mục không đứng cuối trang (mồ côi); bảng/bài tập dài tách thành nhiều khối.
// Xuất PDF = in trang bằng trình duyệt (chữ vẫn là chữ, không phải ảnh) với @page đúng khổ.
(function (root) {
  const S = v => (v == null ? '' : String(v)).trim();
  const chunk = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };
  const tab = (book, re) => { const k = Object.keys(book || {}).find(n => re.test(n)); return k ? book[k] : []; };
  const isB = (r, b) => Number(r['Buổi']) === Number(b);
  const onPDF = r => !/^không$/i.test(S(r['Lên PDF']));
  const LET = ['A', 'B', 'C', 'D'];
  const SIZES = { A4: { page: n => 'A4/Content', mm: [210, 297], label: 'A4' }, '19x27': { page: n => n % 2 ? '19x27/Content Odd' : '19x27/Content Even', mm: [190, 270], label: '19×27' } };

  // ---------- nội dung → khối ----------
  function blocks(books, buoi, brand) {
    const s6 = books.s6 || {}, s5 = books.s5 || {}, out = [], keys = [];
    const info = tab(s6, /Khoá & bài|Khóa & bài/).find(r => isB(r, buoi)) || {};
    const course = Object.fromEntries(tab(s6, /Thông tin khoá|Thông tin khóa/).map(r => [S(r['Mục']), S(r['Nội dung'])]));
    const s5row = tab(s5, /^S5$/).find(r => isB(r, buoi)) || {};
    const B = (comp, data) => out.push({ comp, data });
    let exNo = 0; const ex = () => String(++exNo);
    const title = S(info['Tên buổi']) || 'Buổi ' + buoi;
    B('Block/Lesson Header', { lesson: 'Bài ' + (info['Bài'] ? Number(info['Bài']) : buoi), 'title.vi': title, 'title.native': course['Tên khoá'] || '' });
    const objs = S(info['Mục tiêu bài'] || s5row['Mục tiêu bài']).split(/\n|;\s*/).map(x => x.replace(/^[-•\d.\s]+/, '').trim()).filter(Boolean).slice(0, 5);
    if (objs.length) { const d = { no: '', title: 'Mục tiêu bài học' }; objs.forEach((t, i) => { d[`obj_${i + 1}.bullet`] = '•'; d[`obj_${i + 1}.text`] = t; }); B('Block/Objectives', d); }

    const pron = tab(s6, /Phát âm/).filter(r => isB(r, buoi) && onPDF(r));
    if (pron.length) { B('Block/Section Heading', { text: 'Phát âm' });
      for (const p of pron) { B('Block/Sub Heading', { text: [S(p['Chữ / âm']), S(p['Bảng chữ / nhóm âm'])].filter(Boolean).join(' · ') });
        if (S(p['Hướng dẫn phát âm'])) B('Block/Paragraph', { text: S(p['Hướng dẫn phát âm']) });
        const exs = S(p['Ví dụ']).split(/;\s*/).filter(Boolean).slice(0, 6);
        if (exs.length) { const d = { no: ex(), instruction: 'Đọc to các từ sau.', 'head.track': '', 'head.ab': '' }; exs.forEach((x, i) => { const m = x.match(/^(.*?)\s*\(([^)]*)\)\s*$/); d[`ex_${i + 1}.word`] = m ? m[1] : x; d[`ex_${i + 1}.vi`] = m ? '/' + m[2] + '/' : ''; }); B('Block/Pronunciation', d); } } }

    const vocab = tab(s6, /Từ vựng$/).filter(r => isB(r, buoi) && onPDF(r) && S(r['Từ']));
    if (vocab.length) { B('Block/Section Heading', { text: 'Từ vựng' });
      for (const part of chunk(vocab, 8)) { const d = { 'row_0.c1': 'Từ', 'row_0.c2': 'Phiên âm', 'row_0.c3': 'Loại từ', 'row_0.c4': 'Nghĩa' }; part.forEach((r, i) => { d[`row_${i + 1}.c1`] = S(r['Từ']); d[`row_${i + 1}.c2`] = S(r['Phiên âm / cách đọc']); d[`row_${i + 1}.c3`] = S(r['Loại từ']); d[`row_${i + 1}.c4`] = S(r['Nghĩa']); }); B('Block/Vocab Table', d); } }

    const grammar = tab(s6, /Ngữ pháp$/).filter(r => isB(r, buoi) && onPDF(r));
    const gq = tab(s6, /Câu hỏi ngữ pháp/).filter(r => isB(r, buoi) && onPDF(r));
    if (grammar.length) { B('Block/Section Heading', { text: 'Ngữ pháp' });
      for (const g of grammar) {
        B('Block/Sub Heading', { text: [S(g['Tên ngữ pháp']), S(g['Nghĩa'])].filter(Boolean).join(' – ') });
        for (const l of S(g['Cấu trúc (công thức)']).split('\n').map(S).filter(Boolean).slice(0, 4)) { const m = l.match(/^([^:+]{2,32}):\s*(.+)$/); B('Block/Structure', { label: m ? m[1] : 'Cấu trúc', formula: m ? m[2] : l }); }
        if (S(g['Cách sử dụng'])) B('Block/Paragraph', { text: S(g['Cách sử dụng']) });
        const d = {}; [1, 2, 3].forEach(i => { if (S(g['Ví dụ ' + i])) { d[`ex_${i}.de`] = S(g['Ví dụ ' + i]); d[`ex_${i}.vi`] = S(g['Nghĩa ví dụ ' + i]); } }); if (Object.keys(d).length) B('Block/Example Box', d);
        if (S(g['Lưu ý'])) B('Block/Note Box', { title: 'Lưu ý', text: S(g['Lưu ý']) });
      }
      exercises(gq.filter(q => grammar.some(g => S(g['Mã mục']) === S(q['Mã ngữ pháp']))), 'Luyện tập ngữ pháp');
    }

    const speak = tab(s6, /Mẫu câu/).filter(r => isB(r, buoi) && onPDF(r) && S(r['Câu']));
    if (speak.length) { B('Block/Section Heading', { text: 'Mẫu câu giao tiếp' });
      for (const part of chunk(speak, 8)) { const d = { 'row_0.c1': 'Câu', 'row_0.c2': 'Nghĩa' }; part.forEach((r, i) => { d[`row_${i + 1}.c1`] = S(r['Câu']); d[`row_${i + 1}.c2`] = S(r['Nghĩa']); }); B('Block/Table N', d); } }

    const lis = tab(s6, /^S6-Nghe$/).filter(r => isB(r, buoi) && onPDF(r) && S(r['Câu'])), lq = tab(s6, /Nghe câu hỏi/).filter(r => isB(r, buoi) && onPDF(r));
    if (lis.length || lq.length) { B('Block/Section Heading', { text: 'Nghe' });
      for (const c of [...new Set(lis.map(r => S(r['Mã bài'])).concat(lq.map(r => S(r['Mã bài']))))].filter(Boolean)) {
        const ls = lis.filter(r => S(r['Mã bài']) === c).sort((a, b) => (+a['Câu số'] || 0) - (+b['Câu số'] || 0)); const r0 = ls[0] || {};
        B('Block/Sub Heading', { text: [S(r0['Tiêu đề bài nghe']), S(r0['Nghĩa tiêu đề'])].filter(Boolean).join(' – ') || c });
        exercises(lq.filter(r => S(r['Mã bài']) === c), 'Nghe rồi chọn đáp án đúng.');
        for (const part of chunk(ls, 4)) { const d = {}; part.forEach((r, i) => { d[`line_${i + 1}.speaker`] = S(r['Vai / nhân vật']) || '–'; d[`line_${i + 1}.de`] = S(r['Câu']); d[`line_${i + 1}.vi`] = S(r['Nghĩa']); }); B('Block/Dialogue', d); }
      } }

    const rd = tab(s6, /^S6-Đọc$/).filter(r => isB(r, buoi) && onPDF(r) && S(r['Câu'])), rq = tab(s6, /Đọc câu hỏi/).filter(r => isB(r, buoi) && onPDF(r));
    if (rd.length || rq.length) { B('Block/Section Heading', { text: 'Đọc' });
      for (const c of [...new Set(rd.map(r => S(r['Mã bài'])).concat(rq.map(r => S(r['Mã bài']))))].filter(Boolean)) {
        const ls = rd.filter(r => S(r['Mã bài']) === c).sort((a, b) => ((+a['Đoạn'] || 0) - (+b['Đoạn'] || 0)) || ((+a['Câu số'] || 0) - (+b['Câu số'] || 0))); const r0 = ls[0] || {};
        const paras = []; let cur = null; for (const r of ls) { const p = String(r['Đoạn'] || 1); if (!cur || cur.p !== p) paras.push(cur = { p, t: [], v: [] }); cur.t.push(S(r['Câu'])); cur.v.push(S(r['Nghĩa'])); }
        paras.forEach((p, i) => B('Block/Reading', { tag: i ? '' : 'Bài đọc', title: i ? '' : ([S(r0['Tiêu đề bài đọc']), S(r0['Nghĩa tiêu đề'])].filter(Boolean).join(' – ') || c), text: p.t.join(' '), 'text.vi': '' }));
        exercises(rq.filter(r => S(r['Mã bài']) === c), 'Đọc bài rồi chọn đáp án đúng.');
      } }

    const hw = tab(s6, /BTVN/).filter(r => isB(r, buoi) && onPDF(r));
    if (hw.length) { B('Block/Section Heading', { text: 'Bài tập về nhà' }); exercises(hw, ''); }

    if (keys.length) { B('Block/Section Heading', { text: 'Đáp án' });
      for (const part of chunk(keys, 30)) B('Block/Answer Key', { title: '', text: part.map(k => `${k[0]}. ${k[1]}`).join('     ') }); }
    return out;

    // bài tập: gom theo phần + dạng → Exercise (trắc nghiệm, viết) / Matching / Sentence Order, tối đa 5 câu/khối; đáp án gom cuối sách
    function exercises(rows, defIns) {
      const groups = []; let g = null;
      for (const r of rows) { const t = S(r['Dạng câu']); const kind = /trắc nghiệm/i.test(t) ? 'mc' : /sắp xếp/i.test(t) ? 'order' : /nối/i.test(t) ? 'match' : /tự luận|viết/i.test(t) && !/tay/i.test(t) ? 'write' : null; if (!kind) continue;
        const ins = S(r['Hướng dẫn làm bài']) || defIns; const k = S(r['Phần']) + '|' + kind + '|' + ins; if (!g || g.k !== k) groups.push(g = { k, kind, ins, rows: [] }); g.rows.push(r); }
      for (const gr of groups) for (const part of chunk(gr.rows, 5)) {
        const no = ex(), d = { no, instruction: gr.ins || 'Làm bài tập.', 'head.track': '', 'head.ab': '' };
        part.forEach((r, i) => { const n = `${no}.${i + 1}`; let q = S(r['Câu hỏi']).replace(/^\[[^\]]{1,80}\]\s*/, '');
          if (gr.kind === 'match') { d[`item_${i + 1}.no`] = String(i + 1); d[`item_${i + 1}.text`] = q.replace(/^nối\s*[:：]?\s*/i, ''); d[`item_${i + 1}.blank`] = '____'; }
          else if (gr.kind === 'order') { d[`item_${i + 1}.no`] = String(i + 1); d[`item_${i + 1}.words`] = q.replace(/^[^:]{0,60}:\s*/, ''); d[`item_${i + 1}.answer`] = ''; }
          else { const opts = LET.map(L => S(r[L])).map((o, j) => o ? `${LET[j]}. ${o}` : '').filter(Boolean); d[`item_${i + 1}.no`] = String(i + 1); d[`item_${i + 1}.text`] = q + (opts.length ? '\n' + opts.join('      ') : '\n______________________________'); }
          const a = S(r['Đáp án']); keys.push([n, gr.kind === 'mc' && LET.includes(a.toUpperCase().charAt(0)) && S(r[a.toUpperCase().charAt(0)]) ? `${a.toUpperCase().charAt(0)}. ${S(r[a.toUpperCase().charAt(0)])}` : a]); });
        if (gr.kind === 'match') { const rs = part.map(r => S(r['Đáp án'])); const sh = rs.map((_, i) => rs[(i * 2 + 1) % rs.length]); const ok = new Set(sh).size === rs.length; (ok ? sh : rs.slice().reverse()).forEach((m, i) => { d[`item_${i + 1}.key`] = 'abcde'[i]; d[`item_${i + 1}.match`] = m; }); }
        out.push({ comp: gr.kind === 'match' ? 'Block/Matching' : gr.kind === 'order' ? 'Block/Sentence Order' : 'Block/Exercise', data: d });
      }
    }
  }

  // ---------- xếp trang ----------
  function paginate(list, opt) {
    const E = root.PLS_ENGINE, size = SIZES[opt.size] || SIZES.A4, stage = opt.stage, pages = [], warns = [];
    const running = opt.running || '';
    const newPage = () => { const n = pages.length + 1; const comp = size.page(n);
      const r = E.render({ comp, data: { running, page_no: opt.size === '19x27' && n % 2 === 0 ? '' : String(n), page_no_l: opt.size === '19x27' && n % 2 === 0 ? String(n) : '' } }, opt.brand);
      stage.appendChild(r.host); const content = r.host.querySelector('[data-n="content"]'); [...content.children].forEach(c => c.remove());
      const pg = { host: r.host, content, n, blocks: [] }; pages.push(pg); return pg; };
    const fits = pg => pg.content.scrollHeight <= pg.content.clientHeight + 1;
    const mk = b => { const r = E.render({ comp: b.comp, data: b.data }, opt.brand); const el = r.host.firstElementChild; el.style.width = 'auto'; el.style.alignSelf = 'stretch'; el.style.flex = '0 0 auto'; el.dataset.block = b.comp;
      // khối sách phải cao theo chữ (mẫu Figma để cao cố định theo chữ mẫu → chữ thật dài hơn đè lên khối sau)
      el.style.height = 'auto'; el.style.minHeight = '0';
      [el, ...el.querySelectorAll('*')].forEach(x => { if (x.style.height && x.style.height !== 'auto' && (x.dataset.text || x.querySelector('[data-text]'))) { x.style.minHeight = x.style.height; x.style.height = 'auto'; } });
      // bảng N cột: ẩn cột không có dữ liệu (cN / cN_cell) để các cột còn lại giãn đủ rộng; dòng kẻ của mục không dùng (item_3_line) ẩn theo mục
      const keys = Object.keys(b.data || {}); const usedC = new Set(keys.map(k => (k.match(/\.c(\d+)$/) || [])[1]).filter(Boolean));
      if (usedC.size) el.querySelectorAll('[data-n]').forEach(x => { const m = x.dataset.n.match(/^c(\d+)(_cell)?$/); if (m && !usedC.has(m[1])) { x.style.display = 'none'; x.dataset.hid = '1'; } });
      el.querySelectorAll('[data-n$="_line"]').forEach(x => { const m = x.dataset.n.match(/^([a-z]+_\d+)_line$/); if (m && !keys.some(k => k.split('.')[0] === m[1])) { x.style.display = 'none'; x.dataset.hid = '1'; } });
      // tên vai dài (vd "Tin nhắn thoại") trong cột hẹp → cho xuống dòng, không đè lên câu
      el.querySelectorAll('[data-n="speaker"],[data-n$=".speaker"]').forEach(x => { [x, ...x.querySelectorAll('*')].forEach(y => { y.style.whiteSpace = 'normal'; y.style.overflowWrap = 'anywhere'; }); x.style.paddingRight = '6px'; x.style.boxSizing = 'border-box'; x.style.overflow = 'hidden'; x.style.whiteSpace = 'normal'; x.style.overflowWrap = 'anywhere'; x.style.maxWidth = ''; (x.parentElement || x).style.minWidth = '0'; });
      if (opt.prep) opt.prep(el); return el; };
    let pg = newPage();
    for (let i = 0; i < list.length; i++) {
      const b = list[i], el = mk(b); pg.content.appendChild(el); pg.blocks.push(el);
      const heading = /Heading$/.test(b.comp);
      if (heading && i + 1 < list.length) {   // tiêu đề phải đi cùng khối sau nó
        // thử kèm mọi tiêu đề liền sau + khối nội dung đầu tiên; không vừa → tiêu đề (và tiêu đề ngay trước nó) sang trang mới
        const tmp = []; for (let j = i + 1; j < list.length; j++) { const nx = mk(list[j]); pg.content.appendChild(nx); tmp.push(nx); if (!/Heading$/.test(list[j].comp)) break; }
        const ok = fits(pg); tmp.forEach(x => x.remove());
        if (!ok && pg.blocks.length > 1) { const mv = [el]; el.remove(); pg.blocks.pop();
          while (pg.blocks.length > 1 && /Heading$/.test(pg.blocks[pg.blocks.length - 1].dataset.block)) { const h = pg.blocks.pop(); h.remove(); mv.unshift(h); }
          pg = newPage(); mv.forEach(x => { pg.content.appendChild(x); pg.blocks.push(x); }); }
        continue;
      }
      if (!fits(pg)) { if (pg.blocks.length === 1) { warns.push(`Trang ${pg.n}: khối ${b.comp.replace('Block/', '')} cao hơn trang`); continue; }
        el.remove(); pg.blocks.pop(); const prev = pg.blocks[pg.blocks.length - 1]; let carry = [];
        if (prev && /Heading$/.test(prev.dataset.block)) { prev.remove(); pg.blocks.pop(); carry = [prev]; }   // tiêu đề mồ côi cuối trang → sang trang mới
        pg = newPage(); carry.forEach(c => { pg.content.appendChild(c); pg.blocks.push(c); }); pg.content.appendChild(el); pg.blocks.push(el);
        if (!fits(pg)) warns.push(`Trang ${pg.n}: khối ${b.comp.replace('Block/', '')} cao hơn trang`); }
    }
    return { pages, warns, size };
  }

  // ---------- in PDF ----------
  function print(size) {
    const s = SIZES[size] || SIZES.A4; let st = document.getElementById('bookPrintCss');
    if (!st) { st = document.createElement('style'); st.id = 'bookPrintCss'; document.head.appendChild(st); }
    st.textContent = `@page{size:${s.mm[0]}mm ${s.mm[1]}mm;margin:0}`;
    window.print();
  }
  root.PLS_BOOK = { blocks, paginate, print, SIZES };
})(typeof window !== 'undefined' ? window : globalThis);
