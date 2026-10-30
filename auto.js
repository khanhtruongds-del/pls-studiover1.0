// TỰ CHỌN MẪU CHO NGỮ PHÁP + BÀI TẬP (mở rộng AUTO của engine, như build/score/apply của fit_js):
// mỗi nhóm nội dung sinh nhiều PHƯƠNG ÁN (mẫu / tổ hợp mẫu), app dựng thử từng phương án, chấm theo
// điểm soát lỗi + số slide + độ lấp ô (fill) + độ phủ nội dung (cover), lấy phương án điểm cao nhất.
(function (root) {
  const S = v => (v == null ? '' : String(v)).trim();
  const head = (data, sec) => Object.assign({ 'header.section': sec || '' }, 'instruction' in data ? { 'instruction.vi': '' } : {}, data);
  const chunk = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };
  const LET = ['A', 'B', 'C', 'D'];

  // ---------- NGỮ PHÁP: 1 điểm ngữ pháp → Rule / Formula / Table / Usage / Key Point + bảng lỗi hay gặp ----------
  // g = { title, formula[{label, f}], uses[{use, de}], notes[{wrong, right, text}], signals[], ex[{de, vi}] }
  function parseGrammar(row, title) {
    const lines = S(row['Cấu trúc (công thức)']).split('\n').map(S).filter(Boolean);
    const formula = [], exInline = [];
    for (const l of lines) {
      if (/^(ví dụ|vd|e\.g\.)\s*[:：]/i.test(l)) { exInline.push(l.replace(/^[^:：]+[:：]\s*/, '')); continue; }
      const m = l.match(/^([^:：+]{2,32})[:：]\s*(.+)$/); formula.push(m ? { label: S(m[1]), f: S(m[2]) } : { label: '', f: l });
    }
    const ul = S(row['Cách sử dụng']).split('\n').map(S).filter(Boolean);
    const uses = ul.filter(l => /^\d+[.)]\s*/.test(l)).map(l => { l = l.replace(/^\d+[.)]\s*/, ''); const m = l.match(/^(.{6,80}?)[:：]\s*([A-Za-zÀ-ÿ'"(].{3,})$/); return m && !/[à-ỹ]/i.test(m[2].replace(/\(.*?\)/g, '')) ? { use: S(m[1]), de: S(m[2]) } : { use: l, de: '' }; });
    const intro = ul.find(l => !/^\d+[.)]/.test(l)) || '';
    const notes = S(row['Lưu ý']).split('\n').map(S).filter(Boolean).map(l => { l = l.replace(/^\d+[.)]\s*/, ''); const m = l.match(/Sai\s*[:：]\s*(.+?)\s*(?:→|->|=>)\s*Đúng\s*[:：]\s*(.+?)\.?$/i); return m ? { wrong: S(m[1]), right: S(m[2]), text: S(l.slice(0, m.index).replace(/[.:\s]+$/, '')) } : { text: l }; });
    const signals = S(row['Dấu hiệu nhận biết']).split(/[;,]\s*/).map(S).filter(x => x && x.length <= 22 && !/[à-ỹ]{2,}/i.test(x.replace(/\(.*?\)/g, ''))).slice(0, 8);
    const ex = [1, 2, 3, 4].map(i => ({ de: S(row['Ví dụ ' + i]), vi: S(row['Nghĩa ví dụ ' + i]) })).filter(e => e.de);
    return { title, intro, formula, uses, notes, signals, ex, exInline };
  }
  function grammarPlans(spec) {
    const g = spec.g, sec = spec.section, out = [];
    const F = g.formula.length, U = g.uses.length, E = g.ex.length, N = g.notes.filter(n => n.wrong).length, SG = g.signals.length >= 3 ? 1 : 0;
    const W = { f: 3, e: 2, u: 1, s: 1, n: 1 }; const total = W.f * F + W.e * E + W.u * U + W.s * SG + W.n * N || 1;
    const cov = o => Math.min(1, (W.f * Math.min(F, o.f || 0) + W.e * Math.min(E, o.e || 0) + W.u * Math.min(U, o.u || 0) + W.s * (o.s ? SG : 0) + W.n * Math.min(N, o.n || 0)) / total);
    const ftxt = x => (x.label ? x.label + ': ' : '') + x.f;
    const rule = () => { const d = { title: g.title, rule: g.formula.slice(0, 3).map(ftxt).join('\n') }; g.ex.slice(0, 3).forEach((e, i) => { d[`ex_${i + 1}.de`] = e.de; d[`ex_${i + 1}.vi`] = e.vi; }); return { comp: 'Slide/Grammar Rule', data: head(d, sec), fill: (Math.min(3, E) + 1) / 4 }; };
    const formula = () => { const d = { title: g.title }; g.formula.slice(0, 3).forEach((x, i) => { d[`f_${i + 1}.label`] = x.label || ['Khẳng định', 'Phủ định', 'Nghi vấn'][i] || ''; d[`f_${i + 1}.formula`] = x.f; if (g.ex[i]) d[`f_${i + 1}.ex`] = g.ex[i].de; }); return { comp: 'Slide/Grammar Formula', data: head(d, sec), fill: Math.min(3, F) / 3 }; };
    const lab = g.formula.filter(x => x.label);   // bảng chỉ lấy dòng có nhãn (Khẳng định: …); dòng không nhãn để slide khác
    const table = () => { const d = { title: g.title, 'row_0.c1': 'Trường hợp', 'row_0.c2': 'Cấu trúc' }; lab.slice(0, 6).forEach((x, i) => { d[`row_${i + 1}.c1`] = x.label; d[`row_${i + 1}.c2`] = x.f; }); return { comp: 'Slide/Grammar Table', data: head(d, sec), fill: Math.min(6, lab.length) / 6 }; };
    const usage = () => { const d = { title: g.title }; let k = 0; g.uses.slice(0, 4).forEach((u, i) => { d[`u_${i + 1}.use`] = u.use; const e = u.de ? { de: u.de, vi: '' } : g.ex[k++]; if (e) { d[`u_${i + 1}.de`] = e.de; if (e.vi) d[`u_${i + 1}.vi`] = e.vi; } }); return { comp: 'Slide/Grammar Usage', data: head(d, sec), fill: Math.min(4, U) / 4 }; };
    const kpe = () => { const d = { title: g.title, point: g.formula[0] ? ftxt(g.formula[0]) : g.intro, position: g.uses[0] ? g.uses[0].use : '' }; g.signals.forEach((s, i) => { d[`chip_${i + 1}.text`] = s; }); g.ex.slice(0, 2).forEach((e, i) => { d[`ex_${i + 1}.de`] = e.de; d[`ex_${i + 1}.vi`] = e.vi; }); return { comp: 'Slide/Key Point Examples', data: head(d, sec), fill: (Math.min(8, g.signals.length) / 8 + Math.min(2, E) / 2) / 2 }; };
    const mistakes = () => { const d = { title: 'Lỗi hay gặp – ' + g.title.split(' – ')[0], 'row_0.c1': 'Sai', 'row_0.c2': 'Đúng' }; g.notes.filter(n => n.wrong).slice(0, 6).forEach((n, i) => { d[`row_${i + 1}.c1`] = n.wrong; d[`row_${i + 1}.c2`] = n.right; }); return { comp: 'Slide/Grammar Table', data: head(d, sec), fill: Math.min(6, N) / 6 }; };
    const add = (label, slides, c) => out.push({ label, slides, cover: cov(c), fill: slides.reduce((a, s) => a + s.fill, 0) / slides.length, fillW: 15 });
    // QUY TẮC 35/65 (mẫu bổ sung): quy tắc ngắn (≤ 3 dòng, ≤ 200 ký tự) + 2–4 ví dụ → ô quy tắc bên trái, ví dụ đánh số bên phải.
    // Đặt trước "Quy tắc + ví dụ" để bằng điểm thì chọn mẫu mới; quy tắc dài / ít ví dụ thì không sinh phương án này.
    // mỗi công thức một dòng (tách cả "; "); công thức ngắn giữ liền một dòng (khoảng trắng không ngắt) → không gãy giữa "+ N"
    const splitTxt = g.formula.slice(0, 3).map(ftxt).flatMap(t => String(t).split(/;\s*/)).filter(Boolean).slice(0, 5).map(t => t.length <= 28 ? t.replace(/ /g, '\u00a0') : t).join('\n');
    const split = () => { const d = { title: g.title, rule: splitTxt }; g.ex.slice(0, 4).forEach((e, i) => { d[`ex_${i + 1}.no`] = String(i + 1); d[`ex_${i + 1}.de`] = e.de; d[`ex_${i + 1}.vi`] = e.vi; }); return { comp: 'Slide/Grammar Rule Split', data: head(d, sec), fill: Math.min(1, (Math.min(4, E) + 1) / 4) }; };
    const canSplit = E >= 2 && F >= 1 && F <= 3 && splitTxt.length <= 200 && root.PLS_TPL && root.PLS_TPL.slides && root.PLS_TPL.slides['Slide/Grammar Rule Split'];
    const base = canSplit ? [['Quy tắc 35/65', split, { f: 3, e: 4 }]] : [];
    base.push(['Quy tắc + ví dụ', rule, { f: 3, e: 3 }]);
    if (F >= 2) base.push(['Công thức từng dạng', formula, { f: 3, e: Math.min(3, E) }]);
    if (lab.length >= 2) base.push(['Bảng ngữ pháp', table, { f: lab.length }]);
    if (SG) base.push(['Điểm chính + dấu hiệu', kpe, { f: 1, e: 2, s: 1, u: 1 }]);
    for (const [lb, fn, c] of base) {
      add(lb, [fn()], c);
      if (U >= 2 && fn !== kpe) add(lb + ' + cách dùng', [fn(), usage()], Object.assign({}, c, { u: 4, e: Math.max(c.e || 0, Math.min(E, 3)) }));
      if (N >= 2) add(lb + ' + lỗi hay gặp', [fn(), mistakes()], Object.assign({}, c, { n: 6 }));
    }
    if (U >= 2) add('Cách dùng + ví dụ', [usage()], { u: 4, e: Math.min(4, E) });
    return out;
  }

  // ---------- BÀI TẬP: trắc nghiệm / sắp xếp / nối / viết → so mẫu 1 câu, 2 câu, câu dài, 5 cặp, 8 cặp… ----------
  // spec = { auto:'ex', kind:'mc'|'order'|'match'|'write', instruction, items:[{no, q, opts, ans, l, r, chunks}], section }
  function exPlans(spec) {
    const it = spec.items, n = it.length, sec = spec.section, ins = spec.instruction || '', out = [];
    const plan = (label, cap, comp, fill1, ansF) => { const parts = chunk(it, cap); out.push({ label: `${label} (${parts.length} slide)`, slides: parts.map(p => { const data = head(fill1(p), sec); return { comp, data, ans: ansF ? ansF(p) : undefined, notes: exNote(p) }; }), fill: n / (parts.length * cap), cover: 1, fillW: 20 }); };
    // GHI CHÚ GIẢNG của slide bài tập: cách tổ chức theo dạng + đáp án và giải thích của đúng các câu trên slide
    const TIP = { mc: 'Cho HV 30 giây chọn, giơ tay theo A/B/C/D; gọi 1 HV nói lý do rồi mới hiện đáp án.', order: 'HV sắp xếp vào vở, gọi 1 HV đọc cả câu; chú ý trật tự từ.', match: 'HV nối trong 1 phút, đổi vở cho bạn chấm chéo.', write: 'HV viết vào vở, gọi 2 HV đọc; sửa lỗi chung trên bảng.' };
    const exNote = p => { const keyOf = x => spec.kind === 'mc' && x.ans && x.opts[LET.indexOf(x.ans)] ? `${x.ans}. ${x.opts[LET.indexOf(x.ans)]}` : spec.kind === 'match' ? `${x.l} – ${x.r}` : (x.a || '');
      const lines = ['GIẢNG', '• ' + (ins || 'Làm bài tập.'), '• ' + (TIP[spec.kind] || TIP.write), '', 'ĐÁP ÁN', ...p.map(x => `• ${x.no}. ${keyOf(x)}${x.why ? ' – ' + x.why : ''}`)];
      const warn = p.filter(x => x.why).length ? [] : ['', 'LƯU Ý', '• Excel chưa có cột "Giải thích" cho các câu này – GV tự nêu lý do chọn đáp án.'];
      return lines.concat(warn).join('\n'); };
    // đáp án đi kèm slide (không phải ô chữ) → bộ hiệu ứng nhanh khoanh / nối / hiện đáp án đúng chỗ (fx-presets.js)
    const ansMC = p => ({ kind: 'mc', marks: p.map((x, k) => x.ans && LET.includes(x.ans) && x.opts[LET.indexOf(x.ans)] ? (p.length > 1 ? `options_${k + 1}/` : '') + 'opt_' + x.ans : null) });
    const ansTxt = p => ({ kind: 'text', items: p.map((x, k) => ({ at: `item_${k + 1}`, text: x.a || '' })) });
    if (spec.kind === 'mc') {
      const one = p => { const x = p[0], d = { instruction: ins, question: `${x.no}. ${x.q}` }; x.opts.forEach((o, i) => { if (o) { d[`opt_${LET[i]}.key`] = LET[i]; d[`opt_${LET[i]}.text`] = o; } }); return d; };
      const longQ = it.some(x => x.q.length > 70 || x.opts.some(o => o.length > 28));
      plan('Mỗi slide 1 câu', 1, 'Slide/Exercise MC', one, ansMC);
      if (longQ) plan('Câu dài, 1 câu/slide', 1, 'Slide/Exercise MC Long', one, ansMC);
      const duo = p => { const d = { instruction: ins }; p.forEach((x, k) => { d[`question_${k + 1}`] = `${x.no}. ${x.q}`; x.opts.forEach((o, i) => { if (o) { d[`options_${k + 1}/opt_${LET[i]}.key`] = LET[i]; d[`options_${k + 1}/opt_${LET[i]}.text`] = o; } }); }); return d; };
      if (n >= 3 && n % 2) { const parts = chunk(it, 2); out.push({ label: `2 câu/slide, câu lẻ riêng (${parts.length} slide)`, slides: parts.map(p => p.length === 2 ? { comp: 'Slide/Exercise MC Duo', data: head(duo(p), sec), ans: ansMC(p), notes: exNote(p) } : { comp: 'Slide/Exercise MC', data: head(one(p), sec), ans: ansMC(p), notes: exNote(p) }), fill: 1, cover: 1, fillW: 20 }); }
      if (n >= 2) plan('Mỗi slide 2 câu', 2, 'Slide/Exercise MC Duo', p => { const d = { instruction: ins }; p.forEach((x, k) => { d[`question_${k + 1}`] = `${x.no}. ${x.q}`; x.opts.forEach((o, i) => { if (o) { d[`options_${k + 1}/opt_${LET[i]}.key`] = LET[i]; d[`options_${k + 1}/opt_${LET[i]}.text`] = o; } }); }); return d; }, ansMC);
    } else if (spec.kind === 'order') {
      const fill = (p, max) => { const d = { instruction: ins }; p.forEach((x, k) => { d[`item_${k + 1}.no`] = String(x.no); for (let j = 0; j < max; j++) d[`item_${k + 1}.w${j + 1}`] = x.chunks[j] || ''; }); return d; };   // ô từ thừa = '' → ẩn
      const mx = Math.max(...it.map(x => x.chunks.length));
      if (mx <= 4) plan('Câu ngắn, 3 câu/slide', 3, 'Slide/Exercise Sentence Order', p => fill(p, 4), ansTxt);
      if (mx <= 10) plan('Câu dài, 3 câu/slide', 3, 'Slide/Sentence Order Long', p => fill(p, 10), ansTxt);
      if (!out.length) plan('Viết lại câu', 5, 'Slide/Exercise Fill', p => { const d = { instruction: ins }; p.forEach((x, k) => { d[`item_${k + 1}.no`] = String(x.no); d[`item_${k + 1}.text`] = x.chunks.join(' / '); }); return d; }, ansTxt);
    } else if (spec.kind === 'match') {
      const fill = p => { const d = { instruction: ins }; const rs = p.map((x, k) => ({ r: x.r, k })); const sh = rs.map((_, i) => rs[(i * 2 + 1) % rs.length]);   // xáo cố định (không ngẫu nhiên → dựng lại vẫn y vậy)
        if (new Set(sh.map(s => s.k)).size !== rs.length) sh.splice(0, sh.length, ...rs.slice().reverse());
        p.forEach((x, k) => { d[`l_${k + 1}.no`] = String(x.no); d[`l_${k + 1}.text`] = x.l; d[`r_${k + 1}.no`] = 'abcdefgh'[k]; d[`r_${k + 1}.text`] = sh[k].r; x.key = 'abcdefgh'[sh.findIndex(s => s.k === k)]; }); return d; };
      const ansM = p => ({ kind: 'match', pairs: p.map((x, k) => [`l_${k + 1}`, `r_${'abcdefgh'.indexOf(x.key) + 1}`, x.key]) });   // x.key vừa được fill() gán
      plan('5 cặp/slide', 5, 'Slide/Exercise Match', fill, ansM);
      if (n > 5) plan('8 cặp/slide', 8, 'Slide/Exercise Match 8', fill, ansM);
    } else {
      plan('Viết, 5 câu/slide', 5, 'Slide/Exercise Fill', p => { const d = { instruction: ins }; p.forEach((x, k) => { d[`item_${k + 1}.no`] = String(x.no); d[`item_${k + 1}.text`] = x.q; }); return d; }, ansTxt);
    }
    return out;
  }

  // ---------- từ dòng Excel (S6) → nhóm bài tập; đáp án gom lại cuối mục ----------
  const KIND = t => /trắc nghiệm/i.test(t) ? 'mc' : /sắp xếp/i.test(t) ? 'order' : /nối/i.test(t) ? 'match' : /tự luận|viết/i.test(t) && !/tay/i.test(t) ? 'write' : null;
  function exercises(rows, sec, start, defIns) {
    let no = start || 1; const groups = [], keys = [];
    let cur = null;
    for (const r of rows) {
      const kind = KIND(S(r['Dạng câu'])); if (!kind) continue;
      let q = S(r['Câu hỏi']).replace(/^\[[^\]]{1,80}\]\s*/, ''); let ins = S(r['Hướng dẫn làm bài']) || defIns || '';   // không có hướng dẫn → để trống, không tự viết (28/10)
      const m = q.match(/^([^:：]{6,70})[:：]\s*(.+)$/), INS = /^(chọn|điền|nối|sắp xếp|hoàn thành|viết|dịch|đọc|nghe|gạch|khoanh|tìm|chia|trả lời|đánh dấu|thu âm|ghi âm|nói|nhìn|thêm|sửa|quan sát|xem|luyện|part\s*\d|choose|fill|complete|match|write|translate|read|listen|circle|underline|order|rewrite|select|record|say|look)/i;
      if (m && INS.test(m[1].trim())) { ins = ins || m[1]; q = m[2]; }   // QC F02: ngữ cảnh ("Bạn cầm hai quả cam trong tay: ___ are oranges.") phải ở lại trong câu
      const ctx = S(r['Đoạn văn / ngữ cảnh']); if (ctx && ctx.length <= 140 && kind === 'mc' && !q.includes(ctx)) q = ctx + ' – ' + q;   // ngữ cảnh ngắn mới ghép vào câu; đoạn dài (bài đọc) để nguyên chỗ khác
      const part = S(r['Phần']) + '|' + kind + '|' + ins;
      if (!cur || cur.part !== part) { cur = { auto: 'ex', kind, instruction: ins, section: sec, items: [], part }; groups.push(cur); }
      const x = { no: no++, q, why: S(r['Giải thích']) };
      if (kind === 'mc') { x.opts = LET.map(L => S(r[L])); const a = S(r['Đáp án']).toUpperCase().charAt(0); x.ans = a; keys.push([x.no, a && x.opts[LET.indexOf(a)] ? `${a}. ${x.opts[LET.indexOf(a)]}` : S(r['Đáp án'])]); }
      else if (kind === 'order') { x.chunks = q.split(/\s*\/\s*/).filter(Boolean); x.a = S(r['Đáp án']); keys.push([x.no, x.a]); }
      else if (kind === 'match') { x.l = q.replace(/^nối\s*[:：]?\s*/i, ''); x.r = S(r['Đáp án']); x._key = true; keys.push([x.no, x]); }
      else { x.a = S(r['Đáp án']); keys.push([x.no, x.a]); }
      if (x.why && keys.length && keys[keys.length - 1][0] === x.no) keys[keys.length - 1][2] = x.why;   // QC F08: giải thích đi kèm đáp án (vào Notes)
      cur.items.push(x);
    }
    groups.forEach(g => delete g.part);
    return { groups, keys, next: no };
  }
  // đáp án: chữ cho nối cột lấy sau khi dựng (x.key do phương án được chọn gán)
  // TRANG ĐÁP ÁN GỌN (người dùng chốt 23/10): gom mọi đáp án của mục vào MỘT trang, xếp theo số câu từ trái qua phải, trên xuống dưới
  // (không tách đáp án ngắn / dài ra 2 trang). Chỉ khi 1 trang không đủ chỗ ở cỡ chữ ≥ 28 mới chia 2–3 trang, vẫn giữ thứ tự câu.
  // Trả về 1 spec auto → app dựng thử các phương án 1 / 2 / 3 trang và chọn phương án điểm cao nhất (ít trang được ưu tiên).
  function answerSlides(keys, sec, title) { return keys.length ? [{ auto: 'ans', keys, section: sec, title }] : []; }
  // TỔNG KẾT + DẶN DÒ: gộp 1 slide (mẫu bổ sung Summary Homework) hoặc tách 2 slide như cũ – máy dựng thử cả hai, gộp được ưu tiên
  function sumhwPlans(spec) {
    const sm = spec.summary, hw = spec.homework, d = { 'header.section': sm['header.section'] || spec.section || '', title: sm.title || 'Tổng kết buổi học', 'hw.title': hw.title || 'Dặn dò', deadline: hw.deadline || '' };
    let k = 0; for (let i = 1; i <= 4; i++) { const t = S(sm[`col_${i}.text`]); if (!t || t === '–') continue; k++; d[`item_${k}.no`] = String(k); d[`item_${k}.label`] = sm[`col_${i}.title`] || ''; d[`item_${k}.text`] = t; }
    for (let i = 1; i <= 3; i++) if (hw[`item_${i}.text`]) { d[`hw_${i}.no`] = String(i); d[`hw_${i}.text`] = hw[`item_${i}.text`]; }
    return [{ label: 'Gộp tổng kết + dặn dò', slides: [{ comp: 'Slide/Summary Homework', data: d }], fill: 1, fillW: 20, cover: 1 },
      { label: 'Tách 2 slide', slides: [{ comp: 'Slide/Summary', data: sm }, { comp: 'Slide/Homework', data: hw }], fill: 0.7, fillW: 20, cover: 1 }];
  }
  function ansRows(keys) { return keys.map(([n, v, w]) => [n, v && typeof v === 'object' ? `${v.l} – ${v.r}` : S(v), S(w)]).filter(([, v]) => v); }
  function ansPlans(spec) {
    const rows = ansRows(spec.keys); if (!rows.length) return [];
    const out = [];
    if (rows.filter(r => r[2]).length * 2 >= rows.length) {   // QC P1 "chữa có bằng chứng": đa số câu có giải thích → bảng Câu | Đáp án | Vì sao, 5 câu/slide
      const parts = chunk(rows, 5); out.push({ label: `Đáp án + lý do (${parts.length} slide)`, fill: 1, fillW: 30, cover: 1, slides: parts.map((p, i) => { const d = { instruction: spec.title + (parts.length > 1 ? ` (${i + 1}/${parts.length})` : ''), 'instruction.vi': '', 'row_0.c1': 'Câu', 'row_0.c2': 'Đáp án', 'row_0.c3': 'Vì sao' };
        for (let k = 1; k <= 6; k++) { const r = p[k - 1]; d[`row_${k}.c1`] = r ? String(r[0]) : ''; d[`row_${k}.c2`] = r ? r[1] : ''; d[`row_${k}.c3`] = r ? r[2] || '' : ''; }
        return { comp: 'Slide/Exercise Table', layout: 'flow', data: head(d, spec.section), notes: 'GIẢNG\n• Gọi HV nêu lý do trước khi chiếu đáp án.\n• Dừng ở câu nhiều HV sai, chỉ lại câu chứa bằng chứng.' }; }) }); }
    const n0 = Math.max(1, Math.ceil(rows.length / 10));   // QC F08: tối đa 10 đáp án / slide (20 đáp án một trang thì cuối lớp không đọc được)
    for (let n = n0; n <= n0 + 2; n++) {
      if (n > n0 && rows.length < n * 4) break;   // ít đáp án thì không chia trang
      const size = Math.ceil(rows.length / n), parts = chunk(rows, size);
      const slides = parts.map((p, i) => { const d = { title: spec.title + (parts.length > 1 ? ` (${i + 1}/${parts.length})` : '') };
        p.forEach(([no, v], k) => { d[`a_${k + 1}.key`] = String(no); d[`a_${k + 1}.text`] = v; });
        return { comp: 'Slide/Answer Key', layout: 'flow', data: head(d, spec.section), notes: 'GIẢNG\n• Chữa nhanh: HV tự chấm, giơ tay câu sai.\n• Chỉ giảng lại các câu nhiều HV sai.\n\nĐÁP ÁN\n' + p.map(([no, v, w]) => `• ${no}. ${v}${w ? ' – ' + w : ''}`).join('\n') }; });
      // 1 trang: fill 1; mỗi trang thêm bị trừ điểm rõ để chỉ chia khi trang gộp bị tràn / chữ quá nhỏ
      out.push({ label: n === 1 ? 'Gộp 1 trang' : `Chia ${n} trang`, slides, fill: n0 / n, fillW: 30, cover: 1 });
    }
    return out;
  }


  // ---------- HỘI THOẠI (lời bài nghe): Dialogue 4 câu + ảnh / Dialogue Long 10 câu ----------
  // spec = { auto:'dlg', situation, lines:[{sp, de, vi}], section }
  // audio bài nghe tạo sẵn: mỗi slide lời bài chỉ phát đúng các câu đang hiện (mốc câu từ web/audio/…/index.json → url#t=đầu,cuối)
  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  function audioCut(spec, a, n) {
    const M = spec.audio_marks;
    if (!spec.audio || !M || !M[a] || !M[a + n - 1] || M[a + n - 1].end == null) return { _audio: spec.audio || '', _audio_len: spec.audio_len || '' };
    const st = Math.max(0, M[a].start - 0.15), en = M[a + n - 1].end + 0.3;
    return { _audio: `${spec.audio}#t=${st.toFixed(2)},${en.toFixed(2)}`, _audio_len: mmss(en - st) };
  }
  function dlgPlans(spec) {
    const L = spec.lines, out = [];
    const mk = (comp, cap, label) => { const parts = chunk(L, cap); out.push({ label: `${label} (${parts.length} slide)`, fill: L.length / (parts.length * cap), cover: 1, fillW: 15,
      slides: parts.map((p, i) => { const d = Object.assign({ situation: spec.situation + (parts.length > 1 ? ` (${i + 1}/${parts.length})` : '') }, audioCut(spec, parts.slice(0, i).reduce((n, q) => n + q.length, 0), p.length)); p.forEach((x, k) => { d[`line_${k + 1}.speaker`] = x.sp; d[`line_${k + 1}.de`] = x.de; if (x.ipa || x.py) d[`_line_${k + 1}.py`] = x.ipa || x.py; d[`line_${k + 1}.vi`] = x.vi; }); return { comp, data: head(d, spec.section) }; }) }); };
    for (const cap of [10, 7, 5]) mk('Slide/Dialogue Long', cap, `Hội thoại dài, ${cap} câu/slide`);   // câu kèm dịch dài → 7 hoặc 5 câu/slide đỡ co chữ
    mk('Slide/Dialogue', 4, 'Hội thoại kèm ảnh, 4 câu/slide');
    return out;
  }
  // ---------- BÀI ĐỌC: Reading (1 cột, ≤ 520 ký tự/slide) / Reading 2 Col (2 cột, ≤ 1000 ký tự/slide) ----------
  // spec = { auto:'read', title, paras:[string], section, tag }
  function splitText(paras, max) {   // chia theo đoạn, đoạn dài thì theo câu
    const out = []; let cur = '';
    const push = t => { if (cur && (cur + '\n\n' + t).length > max) { out.push(cur); cur = t; } else cur = cur ? cur + '\n\n' + t : t; };
    for (const p of paras) { if (p.length <= max) push(p); else for (const sn of p.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) || [p]) { if (cur && !/\n\n$/.test(cur) && (cur + ' ' + sn).length <= max) cur += (cur ? ' ' : '') + sn.trim(); else push(sn.trim()); } }
    if (cur) out.push(cur); return out;
  }
  function readPlans(spec) {
    const out = [];
    const one = splitText(spec.paras, 520);
    out.push({ label: `1 cột (${one.length} slide)`, fill: 1, cover: 1, fillW: 10, slides: one.map((t, i) => ({ comp: 'Slide/Reading', data: head({ _find: i === 0 && spec.find ? spec.find : '', tag: spec.tag || 'Reading', task: spec.title + (one.length > 1 ? ` (${i + 1}/${one.length})` : ''), 'task.vi': '', text: t, 'text.vi': '', 'q_1.text': '', 'q_2.text': '', 'q_3.text': '', 'q_4.text': '', 'q_1.no': '', 'q_2.no': '', 'q_3.no': '', 'q_4.no': '' }, spec.section) })) });
    const two = splitText(spec.paras, 1000).map(t => { const h = splitText(t.split('\n\n'), Math.ceil(t.length / 2) + 40); return [h[0] || '', h.slice(1).join('\n\n')]; });
    if (spec.paras.join(' ').length > 400) out.push({ label: `2 cột (${two.length} slide)`, fill: 1, cover: 1, fillW: 10, slides: two.map(([a, b2], i) => ({ comp: 'Slide/Reading 2 Col', data: head({ tag: spec.tag || 'Reading', task: spec.title + (two.length > 1 ? ` (${i + 1}/${two.length})` : ''), 'task.vi': '', text: a, text_2: b2 }, spec.section) })) });
    return out;
  }

  root.PLS_AUTO = { grammar: { expand: grammarPlans }, ex: { expand: exPlans }, dlg: { expand: dlgPlans }, read: { expand: readPlans }, parseGrammar, exercises, answerSlides, ans: { expand: ansPlans }, sumhw: { expand: sumhwPlans } };
})(typeof window !== 'undefined' ? window : globalThis);
