// HOẠT ĐỘNG LỚP (người dùng 28/10): MỘT nội dung → NHIỀU hoạt động, mỗi hoạt động có form riêng (theo bộ file mẫu hoạt động của trung tâm).
// spec = { auto:'act', content:'vocab'|'grammar'|'dlg'|'pattern'|'read'|'listen'|'pinyin'|'hanzi', form:'<id>', no: 1, section, …dữ liệu của nội dung }
//   vocab   : items [{de, ipa, vi, ex, exIpa, exVi}]
//   grammar : title, rule, ex [{de, ipa, vi, chunks?:[...]}], wrong [{de, ipa}] (câu sai có sẵn – không có thì máy tự đảo trật tự)
//   dlg     : title, lines [{sp, de, ipa, vi}], cues [..] (gợi ý xây hội thoại), img
//   pattern : items [{q (tình huống), de, ipa, vi}]
//   read    : title, paras [..], task (khởi động), words [..] (đáp án khởi động), qs [{q, a, opts?, ans?}]
//   listen  : audio, items [{q, opts, ans}] | gaps [{text, a}] | syll [..]
//   pinyin  : cells [..] | hidden [{text, vi}] + img | lines [{text, ipa}] (líu lưỡi) | items [{q, opts, ans}] (nghe chọn)
//   hanzi   : radical, name, chars [{char, py, ok}]
// Mỗi hoạt động = 1 slide chuyển mục "Hoạt động n · tên" (bỏ bằng divider:false) + các slide của form + ghi chú giảng THỜI GIAN / MỤC TIÊU / HƯỚNG DẪN.
(function (root) {
  const S = v => (v == null ? '' : String(v)).trim();
  const chunk = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };
  const LET = ['A', 'B', 'C', 'D'];
  const CJK = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/;
  // chia câu thành cụm: ưu tiên "/" có sẵn; chữ Latin → theo khoảng trắng; chữ Hán liền → theo từng chữ (bỏ dấu câu)
  const chunksOf = x => { if (x.chunks && x.chunks.length) return x.chunks.map(S).filter(Boolean); const t = S(x.de).replace(/[。．.!?！？]+$/, '');
    if (t.includes('/')) return t.split(/\s*\/\s*/).filter(Boolean); if (/\s/.test(t)) return t.split(/\s+/); return CJK.test(t) ? [...t].filter(c => !/[，,、]/.test(c)) : [t]; };
  const join = (cs, de) => CJK.test(cs.join('')) && !/\s/.test(S(de)) ? cs.join('') : cs.join(' ');
  // xáo cố định (dựng lại vẫn y vậy), không trùng thứ tự gốc
  const shuffle = (a, seed) => { const o = a.slice(); let s = (seed || 7) >>> 0; for (let i = o.length - 1; i > 0; i--) { s = (s * 1103515245 + 12345) >>> 0; const j = s % (i + 1); [o[i], o[j]] = [o[j], o[i]]; } if (o.length > 1 && o.every((v, i) => v === a[i])) o.push(o.shift()); return o; };
  const NOTE = o => [o.t ? 'THỜI GIAN: ' + o.t : '', o.m ? 'MỤC TIÊU: ' + o.m : '', o.g && o.g.length ? 'HƯỚNG DẪN GIẢNG DẠY:\n' + o.g.map(x => '• ' + x).join('\n') : '', o.a && o.a.length ? 'ĐÁP ÁN:\n' + o.a.map(x => '• ' + x).join('\n') : ''].filter(Boolean).join('\n\n');
  const head = (d, sec) => Object.assign({ 'header.section': sec || '' }, d);
  const sub = (spec, x) => { const X = (root.PLS_AUTO || {})[x.auto]; let p = X && X.expand ? X.expand(x) : root.PLS_ENGINE ? root.PLS_ENGINE.expand(x) : []; p = (p && p[0]) || { slides: [] }; return p.slides.map(s => ({ comp: s.comp, layout: s.layout, data: s.data, ans: s.ans, notes: s.notes })); };

  // ---------- danh mục form theo nội dung ----------
  const FORMS = {
    vocab: {
      intro: { label: 'Giới thiệu từ + câu ví dụ', t: '10 phút', m: 'Nhớ cách đọc – nghĩa – cách dùng của từ.', need: s => s.items.length,
        g: ['GV đọc từ + ví dụ, HV nhắc lại.', 'Gọi HV bất kỳ đọc lại ví dụ, hướng dẫn dịch.'] },
      guess: { label: 'Đọc và đoán nghĩa', t: '5 phút', m: 'Nhớ cách đọc + nghĩa của từ (HV đã xem từ trước buổi).', need: s => s.items.length,
        g: ['Mời HV bất kỳ đọc từ và đoán nghĩa.', 'Bấm để hiện nghĩa từng thẻ, sửa phát âm ngay.'] },
      flash: { label: 'Học theo flashcard (nối từ – nghĩa)', t: '5 phút', m: 'Ôn nhanh mặt chữ và nghĩa.', need: s => s.items.length >= 3,
        g: ['Mời 1 HV làm 2–3 từ/lượt.', 'Sau đó cả lớp đọc lại 1 lần.'] },
      sentence: { label: 'Đặt câu với từ cho sẵn', t: '10 phút', m: 'Nhớ cách dùng của từ trong câu.', need: s => s.items.length,
        g: ['Mời HV bất kỳ đặt câu với từ.', 'Bấm hiện câu mẫu để so, sửa lỗi trật tự từ.'] },
      choose: { label: 'Chọn nghĩa đúng', t: '5 phút', m: 'Kiểm tra nhanh nghĩa của từ.', need: s => s.items.length >= 3,
        g: ['HV giơ tay theo A/B/C, gọi 1 HV đọc lại từ.'] }
    },
    grammar: {
      rule: { label: 'Định nghĩa + ví dụ', t: '5 phút', m: 'Hiểu điểm ngữ pháp, xác định đúng thành phần câu.', need: s => s.rule || s.ex.length,
        g: ['GV giới thiệu điểm ngữ pháp + ví dụ.', 'Gọi HV đọc lại ví dụ, chỉ ra từng thành phần.'] },
      pick: { label: 'Đọc và chọn câu đúng', t: '2 phút', m: 'Nhận ra trật tự từ đúng.', need: s => s.ex.some(x => chunksOf(x).length >= 3),
        g: ['HV đọc và chọn câu đúng.', 'Yêu cầu HV giải thích vì sao các câu kia sai.'] },
      wrong: { label: 'Đọc và tìm câu sai', t: '2 phút', m: 'Phát hiện lỗi trật tự từ.', need: s => s.ex.filter(x => chunksOf(x).length >= 3).length >= 2 || s.wrong.length,
        g: ['HV đọc và chọn câu sai.', 'Gọi HV sửa lại câu sai cho đúng.'] },
      order: { label: 'Sắp xếp từ thành câu', t: '2 phút', m: 'Phân tích và sắp xếp từ thành câu đúng.', need: s => s.ex.some(x => chunksOf(x).length >= 3),
        g: ['Cho HV sắp xếp vào vở.', 'Gọi HV đọc cả câu, bấm cho từ trượt về đúng chỗ.'] },
      image: { label: 'Đặt câu theo hình + từ gợi ý', t: '2 phút', m: 'Quan sát hình, dùng từ gợi ý để hình thành câu hoàn chỉnh.', need: s => s.ex.length,
        g: ['Cho HV xem hình + từ gợi ý, yêu cầu đặt câu.', 'Bấm hiện câu mẫu từng hình.'] },
      translate: { label: 'Dịch câu', t: '2 phút', m: 'Xác định thành phần câu và dịch sang tiếng đích.', need: s => s.ex.some(x => S(x.vi)),
        g: ['Cho HV đọc đề, xác định chủ ngữ – vị ngữ – tân ngữ.', 'HV dịch, bấm hiện đáp án.'] },
      match: { label: 'Nối cột thành câu', t: '4 phút', m: 'Kết hợp các vế thành câu có nghĩa.', need: s => s.ex.filter(x => chunksOf(x).length >= 2).length >= 3,
        g: ['Chia mỗi câu thành 2 vế, HV nối vế trái với vế phải.', 'Gọi HV đọc cả câu sau khi nối.'] }
    },
    dlg: {
      roleplay: { label: 'Đóng vai và dịch', t: '5 phút', m: 'Đọc đúng ngữ điệu, hiểu nghĩa hội thoại.', need: s => s.lines.length,
        g: ['Chia vai A/B, HV đọc rồi đổi vai.', 'Gọi 1 HV dịch từng câu.'] },
      order: { label: 'Sắp xếp câu thành hội thoại', t: '3 phút', m: 'Nắm trình tự một cuộc hội thoại.', need: s => s.lines.length >= 3,
        g: ['HV ghi số thứ tự các câu vào ô vuông.', 'Bấm hiện thứ tự đúng, cho 2 HV đọc lại.'] },
      complete: { label: 'Hoàn thành hội thoại', t: '5 phút', m: 'Dùng mẫu câu để tự giới thiệu theo thông tin riêng.', need: s => s.lines.length >= 2,
        g: ['HV điền thông tin của mình vào chỗ trống.', 'Gọi từng cặp nói trước lớp.'] },
      build: { label: 'Xây dựng hội thoại theo gợi ý', t: '5 phút', m: 'Tự tạo hội thoại từ các câu gợi ý.', need: s => (s.cues || []).length || s.lines.length,
        g: ['HV làm theo cặp, dùng đủ các gợi ý.', 'Gọi 1–2 cặp diễn lại.'] },
      picture: { label: 'Nhìn tranh tạo hội thoại', t: '5 phút', m: 'Đoán chủ đề và tự tạo hội thoại theo tranh.', need: () => true,
        g: ['Cho HV xem tranh, đoán chủ đề.', 'Chia nhóm / giơ tay / GV gọi để xây hội thoại.'] }
    },
    pattern: {
      read: { label: 'Đọc to cùng giáo viên', t: '5 phút', m: 'Nhận biết và đọc đúng các mẫu câu giao tiếp.', need: s => s.items.length,
        g: ['GV đọc mẫu, cả lớp đọc theo.', 'Gọi HV đọc lại từng câu.'] },
      situation: { label: 'Tình huống → mẫu câu', t: '2 phút / tình huống', m: 'Biết dùng mẫu câu đúng tình huống.', need: s => s.items.some(x => S(x.q)),
        g: ['Hỏi tình huống, HV trả lời bằng mẫu câu.', 'Bấm hiện mẫu câu để so.'] },
      lucky: { label: 'Con số may mắn', t: '5 phút', m: 'Phản xạ hỏi – đáp với mẫu câu.', need: s => s.items.length >= 2,
        g: ['HV chọn 1 số bất kỳ, GV bấm hiện câu hỏi của ô đó.', 'HV trả lời; ô đã chọn để nguyên.'] }
    },
    read: {
      warmup: { label: 'Khởi động tìm từ khoá', t: '3 phút', m: 'Nhớ lại từ vựng, hỗ trợ kỹ năng tìm keyword.', need: s => S(s.task),
        g: ['Nêu câu hỏi trên màn hình, cho HV thời gian tìm.', 'Bấm hiện đáp án.'] },
      text: { label: 'Đọc hiểu đoạn văn', t: '5 phút', m: 'Đọc hiểu nội dung bài đọc.', need: s => s.paras.length,
        g: ['Chiếu câu hỏi trước cho HV nắm ý.', 'HV đọc thầm, gạch chân từ khoá.'] },
      qa: { label: 'Đọc và trả lời câu hỏi', t: '5 phút', m: 'Trả lời câu hỏi theo nội dung bài đọc.', need: s => s.qs.some(q => !q.opts),
        g: ['Gọi HV đọc câu hỏi và trả lời, sau đó dịch.'] },
      mc: { label: 'Đọc câu ngắn – chọn đáp án', t: '3 phút', m: 'Luyện đọc hiểu câu ngắn.', need: s => s.qs.some(q => q.opts),
        g: ['Gọi HV đọc và trả lời, yêu cầu dịch.'] }
    },
    listen: {
      mc: { label: 'Nghe và chọn đáp án', t: '5 phút', m: 'Nghe hiểu câu ngắn.', need: s => s.items.length,
        g: ['Bật audio 2 lần, HV chọn A/B/C.', 'Bấm khoanh đáp án, cho nghe lại câu chứa đáp án.'] },
      fill: { label: 'Nghe và điền từ', t: '5 phút', m: 'Nghe bắt từ khoá.', need: s => (s.gaps || []).length,
        g: ['Cho HV đọc câu trước khi nghe.', 'Nghe 2 lần, bấm hiện đáp án.'] },
      syll: { label: 'Nghe và ghép âm', t: '3 phút', m: 'Phân biệt thanh mẫu – vận mẫu khi nghe.', need: s => (s.syll || []).length,
        g: ['Nghe từng từ, HV ghép âm đầu với vần.', 'Đáp án trong ghi chú.'] }
    },
    pinyin: {
      grid: { label: 'Bảng khoanh đọc nhanh', t: '5 phút', m: 'Phản xạ đọc pinyin không đánh vần.', need: s => (s.cells || []).length,
        g: ['GV khoanh ô bất kỳ, HV đọc ngay.', 'Tăng tốc dần, sửa phát âm tại chỗ.'] },
      listen: { label: 'Nghe và chọn đáp án đúng', t: '3 phút', m: 'Phân biệt âm khi nghe.', need: s => (s.items || []).length,
        g: ['Bật audio, dừng sau mỗi âm cho HV chọn.', 'Bấm hiện đáp án.'] },
      hidden: { label: 'Tìm phiên âm ẩn trong hình', t: '5 phút', m: 'Nhận diện mặt chữ pinyin.', need: s => (s.hidden || []).length,
        g: ['Cho HV biết số phiên âm ẩn trong ảnh.', 'Mỗi từ tìm được: GV khoanh trên ảnh, bấm hiện đáp án.'] },
      twister: { label: 'Nói líu lưỡi', t: '3 phút', m: 'Phản xạ đọc pinyin, giải trí.', need: s => (s.lines || []).length,
        g: ['Cho cả lớp hoặc từng HV đọc cả bài.', 'Nhắc HV cố không đọc vấp, tăng tốc dần.'] }
    },
    hanzi: {
      radical: { label: 'Tìm bạn cho bộ thủ', t: '3 phút', m: 'Nhận diện bộ thủ trong chữ Hán.', need: s => (s.chars || []).length,
        g: ['HV chọn những chữ có chứa bộ.', 'Bấm hiện dấu ✓ ở chữ đúng, giải thích nghĩa của bộ.'] }
    }
  };

  // ---------- dựng slide của từng form ----------
  function slidesOf(spec) {
    const c = spec.content, f = spec.form, sec = spec.section || '', ins = spec.instruction, it = spec.items || [];
    const out = []; const add = (comp, data, extra) => out.push(Object.assign({ comp, data: head(data, sec) }, extra || {}));
    if (c === 'vocab') {
      if (f === 'intro') it.forEach(x => add('Slide/Vocab Card', { title: spec.title || 'Từ vựng', word: x.de, ipa: x.ipa || '', pos: x.pos || '', mean: x.vi, exde: x.ex || '', exvi: x.exVi || '' }));
      else if (f === 'guess') chunk(it, 4).forEach(p => { const d = { title: spec.title || 'Từ vựng', instruction: ins || 'Đọc và đoán nghĩa các từ sau' }; p.forEach((x, k) => { d[`gc_${k + 1}.no`] = String(it.indexOf(x) + 1); d[`gc_${k + 1}.word`] = x.de; d[`gc_${k + 1}.ipa`] = x.ipa || ''; d[`gc_${k + 1}.vi`] = x.vi; }); add('Slide/Guess Cards', d); });
      else if (f === 'flash') out.push(...sub(spec, { auto: 'ex', kind: 'match', instruction: ins || 'Học theo flashcard: nối từ với nghĩa', section: sec, items: it.map((x, i) => ({ no: i + 1, l: x.de + (x.ipa ? '  ' + x.ipa : ''), r: x.vi })) }));
      else if (f === 'sentence') it.forEach(x => add('Slide/Word Sentence', { title: spec.title || 'Từ mới', instruction: ins || 'Đặt câu với từ cho sẵn', word: x.de, ipa: x.ipa || '', mean: x.vi, label: 'Câu mẫu', de: x.ex || '', ipa2: x.exIpa || '', vi: x.exVi || '' }));
      else if (f === 'choose') out.push(...sub(spec, { auto: 'ex', kind: 'mc', instruction: ins || 'Chọn nghĩa đúng của từ', section: sec, items: it.map((x, i) => { const others = shuffle(it.filter(y => y !== x).map(y => y.vi), i + 3).slice(0, 2); const opts = shuffle([x.vi, ...others], i + 11); return { no: i + 1, q: x.de + (x.ipa ? '  ' + x.ipa : ''), opts, ans: LET[opts.indexOf(x.vi)] }; }) }));
    } else if (c === 'grammar') {
      const ex = spec.ex || [], long = ex.filter(x => chunksOf(x).length >= 3);
      const variants = (x, i) => { const cs = chunksOf(x); const a = shuffle(cs, i + 5), b = shuffle(cs, i + 23); const w = [join(a, x.de), join(b, x.de)].filter(s => s !== join(cs, x.de)); return [...new Set(w)]; };
      if (f === 'rule') { const d = { title: spec.title || '', rule: spec.rule || '' }; ex.slice(0, 3).forEach((x, i) => { d[`ex_${i + 1}.de`] = x.de; d[`ex_${i + 1}.vi`] = [x.ipa, x.vi].filter(Boolean).join(' · '); }); add('Slide/Grammar Rule', d); }
      else if (f === 'pick') out.push(...sub(spec, { auto: 'ex', kind: 'mc', instruction: ins || 'Đọc và chọn đáp án đúng', section: sec, items: long.map((x, i) => { const right = join(chunksOf(x), x.de); const opts = shuffle([right, ...variants(x, i)].slice(0, 3), i + 2); return { no: i + 1, q: x.vi || '', opts, ans: LET[opts.indexOf(right)] }; }) }));
      else if (f === 'wrong') { const groups = []; const wr = (spec.wrong || []).map(w => w.de).concat(long.map((x, i) => variants(x, i + 40)[0]).filter(Boolean));
        for (let i = 0, k = 0; i + 1 < long.length && k < wr.length; i += 2, k++) { const right = [long[i], long[i + 1]].map(x => join(chunksOf(x), x.de)); const opts = shuffle([...right, wr[k]], i + 9); groups.push({ no: groups.length + 1, q: 'Câu nào sai?', opts, ans: LET[opts.indexOf(wr[k])] }); }
        if (groups.length) out.push(...sub(spec, { auto: 'ex', kind: 'mc', instruction: ins || 'Đọc và tìm ra câu sai', section: sec, items: groups })); }
      else if (f === 'order') out.push(...sub(spec, { auto: 'ex', kind: 'order', instruction: ins || 'Sắp xếp các từ sau thành câu đúng', section: sec, items: long.map((x, i) => ({ no: i + 1, chunks: shuffle(chunksOf(x), i + 4), a: join(chunksOf(x), x.de) + (x.ipa ? ' /' + x.ipa + '/' : '') })) }));
      else if (f === 'image') chunk(ex, 4).forEach(p => { const d = { instruction: ins || 'Hãy đặt câu dựa vào từ gợi ý và hình ảnh', 'instruction.vi': '' }; p.forEach((x, k) => { const cs = chunksOf(x); d[`item_${k + 1}.key`] = String(k + 1); d[`item_${k + 1}.text`] = x.hint || (cs.length > 1 ? join(cs.slice(0, 1), x.de) + '…' : '…'); d[`img:item_${k + 1}.img`] = x.vi || x.de; }); add('Slide/Exercise Image', d, { ans: { kind: 'text', items: p.map((x, k) => ({ at: `item_${k + 1}`, text: x.de })) }, notes: NOTE({ a: p.map(x => x.de + (x.ipa ? ' /' + x.ipa + '/' : '')) }) }); });
      else if (f === 'translate') out.push(...sub(spec, { auto: 'ex', kind: 'write', instruction: ins || 'Dịch các câu sau', section: sec, items: ex.filter(x => S(x.vi)).map((x, i) => ({ no: i + 1, q: x.vi, a: x.de + (x.ipa ? ' /' + x.ipa + '/' : '') })) }));
      else if (f === 'match') out.push(...sub(spec, { auto: 'ex', kind: 'match', instruction: ins || 'Nối cột A với cột B để tạo thành câu', section: sec, items: ex.filter(x => chunksOf(x).length >= 2).map((x, i) => { const cs = chunksOf(x), h = Math.ceil(cs.length / 2); return { no: i + 1, l: join(cs.slice(0, h), x.de), r: join(cs.slice(h), x.de) }; }) }));
    } else if (c === 'dlg') {
      const L = spec.lines || [];
      if (f === 'roleplay') chunk(L, 6).forEach(p => { const d = { title: spec.title || 'Hội thoại', pair: ins || 'Đóng vai và dịch đoạn hội thoại' }; p.forEach((x, k) => { d[`line_${k + 1}.who`] = S(x.sp).slice(0, 3) || 'AB'[k % 2]; d[`line_${k + 1}.de`] = x.de; d[`line_${k + 1}.vi`] = [x.ipa, x.vi].filter(Boolean).join('\n'); }); add('Slide/Dialogue Bubbles', Object.assign(d, { _audio: spec.audio || '' })); });
      else if (f === 'order') chunk(L, 6).forEach((p, pi) => { const sh = shuffle(p.map((x, i) => i), pi + 13); const d = { title: spec.title || 'Luyện tập', instruction: ins || 'Sắp xếp các câu sau thành đoạn hội thoại' }; sh.forEach((oi, k) => { d[`dl_${k + 1}.key_box.no`] = 'ABCDEF'[k]; d[`dl_${k + 1}.de`] = p[oi].de; d[`dl_${k + 1}.ipa`] = p[oi].ipa || ''; }); const order = p.map((x, i) => 'ABCDEF'[sh.indexOf(i)]).join(' – '); d['label'] = 'Thứ tự đúng:'; d['order'] = order; add('Slide/Dialogue Order', d, { notes: NOTE({ a: ['Thứ tự: ' + order] }) }); });
      else if (f === 'complete') { const gap = t => { const m = S(t).match(/^(.*?)([^\s，,。.!?！？]{1,12})([。.!?！？]?)$/); return m && m[1] ? m[1] + '……' + m[3] : t + ' ……'; };
        chunk(L, 6).forEach(p => { const d = { title: spec.title || '', pair: ins || 'Hoàn thành đoạn hội thoại theo thông tin của bạn' }; p.forEach((x, k) => { d[`line_${k + 1}.who`] = S(x.sp).slice(0, 3) || 'AB'[k % 2]; d[`line_${k + 1}.de`] = x.gap || gap(x.de); d[`line_${k + 1}.vi`] = x.ipa || ''; }); add('Slide/Dialogue Bubbles', d, { notes: NOTE({ a: p.map(x => x.de) }) }); }); }
      else if (f === 'build') { const cues = (spec.cues && spec.cues.length ? spec.cues : L.map(x => ({ de: x.de, ipa: x.ipa, vi: x.vi }))).map(x => typeof x === 'string' ? { de: x } : x);
        chunk(cues, 4).forEach(p => { const d = { title: spec.title || 'Xây dựng hội thoại', rule: ins || 'Xây dựng hội thoại dựa vào các gợi ý sau' }; p.forEach((x, k) => { d[`p_${k + 1}.no`] = String(k + 1); d[`p_${k + 1}.de`] = x.de; d[`p_${k + 1}.ipa`] = x.ipa ? '/' + x.ipa + '/' : ''; d[`p_${k + 1}.vi`] = x.vi || ''; }); add('Slide/Pattern List', d); }); }
      else if (f === 'picture') add('Slide/Lead In', { title: spec.title || 'Nhìn tranh và tạo đoạn hội thoại', kicker: 'Làm theo nhóm / cặp', 'q_1.de': 'Bức tranh nói về chủ đề gì?', 'q_1.vi': '', 'q_2.de': 'Các nhân vật đang nói gì với nhau?', 'q_2.vi': '', 'q_3.de': 'Hãy cùng xây dựng đoạn hội thoại theo chủ đề này!', 'q_3.vi': '', 'img:img': spec.img || spec.title || '' });
    } else if (c === 'pattern') {
      if (f === 'read') chunk(it, 4).forEach(p => { const d = { title: spec.title || 'Mẫu câu thông dụng', rule: ins || 'Đọc to các câu sau cùng giáo viên' }; p.forEach((x, k) => { d[`p_${k + 1}.no`] = String(it.indexOf(x) + 1); d[`p_${k + 1}.de`] = x.de; d[`p_${k + 1}.ipa`] = x.ipa ? '/' + x.ipa + '/' : ''; d[`p_${k + 1}.vi`] = x.vi || ''; }); add('Slide/Pattern List', d); });
      else if (f === 'situation') { const by = []; it.forEach(x => { const q = S(x.q) || (by.length ? by[by.length - 1].q : ''); let g = by.find(y => y.q === q); if (!g) by.push(g = { q, xs: [] }); g.xs.push(x); });
        by.filter(g => g.q).forEach(g => { const d = { title: spec.title || 'Mẫu câu thông dụng', 'q_1.text': g.q }; g.xs.slice(0, 3).forEach((x, k) => { d[`ans_${k + 1}.no_box.no`] = String(k + 1); d[`ans_${k + 1}.de`] = x.de; d[`ans_${k + 1}.ipa`] = x.ipa || ''; d[`ans_${k + 1}.vi`] = x.vi || ''; }); add('Slide/Situation', d); }); }
      else if (f === 'lucky') chunk(it, 8).forEach(p => { const d = { title: 'Con số may mắn', instruction: ins || 'Hãy chọn một số mà bạn thích và trả lời câu hỏi!' }; p.forEach((x, k) => { d[`tile_${k + 1}.no`] = String(k + 1); d[`tile_${k + 1}.q`] = x.de; d[`tile_${k + 1}.ipa`] = x.ipa || ''; }); add('Slide/Lucky Number', d, { notes: NOTE({ a: p.map((x, k) => `${k + 1}. ${x.de}${x.vi ? ' – ' + x.vi : ''}`) }) }); });
    } else if (c === 'read') {
      if (f === 'warmup') { const w = spec.words || []; const d = { title: 'Khởi động', 'q_1.text': spec.task }; chunk(w, Math.ceil(w.length / 3) || 1).slice(0, 3).forEach((p, k) => { d[`ans_${k + 1}.de`] = p.join('   '); d[`ans_${k + 1}.ipa`] = ''; d[`ans_${k + 1}.vi`] = ''; }); add('Slide/Situation', d, { notes: NOTE({ a: [w.join(', ')] }) }); }
      else if (f === 'text') out.push(...sub(spec, { auto: 'read', section: sec, tag: 'Đọc hiểu', title: spec.title || 'Đọc hiểu', paras: spec.paras }));
      else if (f === 'qa') out.push(...sub(spec, { auto: 'ex', kind: 'write', instruction: ins || 'Đọc và trả lời câu hỏi', section: sec, items: (spec.qs || []).filter(q => !q.opts).map((q, i) => ({ no: i + 1, q: q.q, a: q.a })) }));
      else if (f === 'mc') out.push(...sub(spec, { auto: 'ex', kind: 'mc', instruction: ins || 'Đọc và chọn đáp án đúng', section: sec, items: (spec.qs || []).filter(q => q.opts).map((q, i) => ({ no: i + 1, q: q.q, opts: q.opts, ans: q.ans })) }));
    } else if (c === 'listen') {
      if (f === 'mc') out.push(...sub(spec, { auto: 'ex', kind: 'mc', instruction: ins || 'Nghe và chọn đáp án đúng', section: sec, items: it.map((q, i) => ({ no: q.no || i + 1, q: q.q || '', opts: q.opts, ans: q.ans, why: q.script || '' })) }).map(s => Object.assign(s, { data: Object.assign({ _audio: spec.audio || '' }, s.data) })));
      else if (f === 'fill') chunk(spec.gaps || [], 5).forEach(p => { const bank = [...new Set(p.map(x => x.a))]; const d = { title: spec.title || 'Nghe và điền từ', label: 'Từ gợi ý:', _audio: spec.audio || '' }; shuffle(bank, 3).forEach((w, k) => { d[`chip_${k + 1}.text`] = w; }); p.forEach((x, k) => { d[`s_${k + 1}.no`] = (k + 1) + '.'; d[`s_${k + 1}.text`] = x.text; d[`s_${k + 1}.val`] = x.a; }); add('Slide/Gap Fill Bank', d); });
      else if (f === 'syll') { const cells = shuffle(spec.syll.flatMap(x => x.parts || [x]), 5).slice(0, 24); const d = { title: spec.title || 'Nghe và ghép âm', instruction: ins || 'Nghe và ghép các âm sau thành từ đúng' }; cells.forEach((t, k) => { d[`c_${k + 1}.text`] = t; }); add('Slide/Pinyin Grid', d, { notes: NOTE({ a: spec.syll.map((x, i) => `${i + 1}. ${x.word || (x.parts || []).join('')}`) }) }); }
    } else if (c === 'pinyin') {
      if (f === 'grid') chunk(spec.cells || [], 24).forEach(p => { const d = { title: spec.title || 'Luyện đọc', instruction: ins || 'Đọc nhanh ô giáo viên khoanh' }; p.forEach((t, k) => { d[`c_${k + 1}.text`] = t; }); add('Slide/Pinyin Grid', d); });
      else if (f === 'listen') out.push(...sub(spec, { auto: 'ex', kind: 'mc', instruction: ins || 'Nghe và chọn đáp án đúng', section: sec, items: it.map((q, i) => ({ no: i + 1, q: q.q || 'Âm vừa nghe là:', opts: q.opts, ans: q.ans })) }).map(s => Object.assign(s, { data: Object.assign({ _audio: spec.audio || '' }, s.data) })));
      else if (f === 'hidden') { const d = { title: spec.title || 'Tìm phiên âm ẩn trong hình', instruction: ins || `Có ${spec.hidden.length} phiên âm ẩn trong ảnh. Tìm ra nhé!`, 'img:img': spec.img || '' }; spec.hidden.slice(0, 6).forEach((x, k) => { d[`ans_${k + 1}.no_box.no`] = String(k + 1); d[`ans_${k + 1}.text`] = x.text; d[`ans_${k + 1}.vi`] = x.vi || ''; }); add('Slide/Hidden Pinyin', d); }
      else if (f === 'twister') chunk(spec.lines || [], 4).forEach(p => { const d = { title: spec.title || 'Nói líu lưỡi', instruction: ins || 'Đọc to, nhanh dần mà không vấp', rule: spec.meaning || '' }; p.forEach((x, k) => { d[`s_${k + 1}.no`] = String(k + 1); d[`s_${k + 1}.text`] = x.text; d[`s_${k + 1}.ipa`] = [x.ipa, x.vi].filter(Boolean).join(' · '); }); add('Slide/Read Aloud', d); });
    } else if (c === 'hanzi') {
      if (f === 'radical') chunk(spec.chars || [], 8).forEach(p => { const d = { title: spec.title || 'Tìm bạn cho bộ thủ', instruction: ins || 'Chọn các chữ có chứa bộ thủ ở giữa', radical: spec.radical, 'radical.name': spec.name || '' }; p.forEach((x, k) => { d[`rc_${k + 1}.char`] = x.char; d[`rc_${k + 1}.py`] = x.py || ''; d[`rc_${k + 1}.ok`] = x.ok ? '✓' : ''; }); add('Slide/Radical Match', d, { notes: NOTE({ a: ['Chữ có bộ ' + spec.radical + ': ' + p.filter(x => x.ok).map(x => x.char).join(' ')] }) }); });
    }
    return out;
  }

  // ---------- spec auto 'act' → 1 phương án: [chuyển mục] + slide của form; ghi chú giảng theo khung của trung tâm ----------
  function norm(spec) { const s = Object.assign({ items: [], ex: [], wrong: [], lines: [], paras: [], qs: [] }, spec); return s; }
  function actPlans(spec0) {
    const spec = norm(spec0), F = (FORMS[spec.content] || {})[spec.form];
    if (!F) return [{ label: 'Không có form', slides: [{ comp: 'Slide/Key Point', data: { title: 'Hoạt động', point: `Chưa có form "${spec.form}" cho nội dung "${spec.content}"`, note: '' } }], fill: 0, cover: 0 }];
    if (!F.need(spec)) return [{ label: 'Thiếu dữ liệu', slides: [{ comp: 'Slide/Key Point', data: head({ title: F.label, point: 'Không đủ dữ liệu cho hoạt động này', note: 'Kiểm tra lại dữ liệu nội dung (xem chú thích đầu activities.js).' }, spec.section) }], fill: 0, cover: 0 }];
    const body = slidesOf(spec);
    const note = NOTE({ t: spec.time || F.t, m: spec.goal || F.m, g: F.g });
    body.forEach(s => { s.notes = [note, s.notes || ''].filter(Boolean).join('\n\n'); });
    const slides = (spec.divider === false ? [] : [{ comp: 'Slide/Section', data: { 'section.title': `Hoạt động ${spec.no || 1}`, 'section.sub': spec.label || F.label }, notes: note }]).concat(body);
    return [{ label: `${F.label} (${body.length} slide)`, slides, fill: 1, cover: 1, fillW: 10 }];
  }
  // tiện ích: 1 nội dung + danh sách form → các spec act đánh số HĐ 1, 2, 3…
  function plan(content, data, forms, opt) { opt = opt || {}; return (forms || Object.keys(FORMS[content] || {})).map((f, i) => Object.assign({ auto: 'act', content, form: f, no: (opt.start || 1) + i, section: opt.section || '' }, data)); }
  function available(content, data) { const s = norm(data || {}); return Object.entries(FORMS[content] || {}).map(([id, F]) => ({ id, label: F.label, ok: !!F.need(s) })); }

  root.PLS_AUTO = root.PLS_AUTO || {};
  root.PLS_AUTO.act = { expand: actPlans };
  root.PLS_ACT = { FORMS, plan, available, chunksOf, slidesOf };
})(typeof window !== 'undefined' ? window : globalThis);
