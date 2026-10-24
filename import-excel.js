// Nhập Excel giáo trình (khuôn S5 = khung buổi học, S6 = nội dung chi tiết) → spec bài slide cho 1 buổi.
// Thứ tự slide theo timeline S5 ("1. Mở đầu: 5p …"); chỉ lấy dòng "Lên PPT" ≠ "Không" (S6-Bảng phân phối).
(function (root) {
  'use strict';
  const LABELS = {   // nhãn header.section theo ngôn ngữ brand (BACKLOG: nhãn đang cố định tiếng Đức)
    en: { listen: 'LISTENING', read: 'READING', test: 'TEST', practice: 'PRACTICE', check: 'HOMEWORK CHECK', answers: 'ANSWER KEY', vocab: 'VOCABULARY', grammar: 'GRAMMAR', pron: 'PRONUNCIATION', speak: 'SPEAKING', overview: 'LESSON OVERVIEW', summary: 'SUMMARY', homework: 'HOMEWORK', extra: 'TIPS', lesson: 'LESSON', thanks: 'Thank you!' },
    de: { listen: 'HÖREN', read: 'LESEN', test: 'TEST', practice: 'ÜBUNG', check: 'HAUSAUFGABEN-CHECK', answers: 'LÖSUNGEN', vocab: 'WORTSCHATZ', grammar: 'GRAMMATIK', pron: 'AUSSPRACHE', speak: 'SPRECHEN', overview: 'ÜBERSICHT', summary: 'ZUSAMMENFASSUNG', homework: 'HAUSAUFGABEN', extra: 'TIPPS', lesson: 'LEKTION', thanks: 'Vielen Dank!' },
    fr: { listen: 'ÉCOUTE', read: 'LECTURE', test: 'TEST', practice: 'EXERCICES', check: 'CORRECTION', answers: 'CORRIGÉ', vocab: 'VOCABULAIRE', grammar: 'GRAMMAIRE', pron: 'PRONONCIATION', speak: 'ORAL', overview: 'APERÇU', summary: 'RÉSUMÉ', homework: 'DEVOIRS', extra: 'CONSEILS', lesson: 'LEÇON', thanks: 'Merci !' },
    ko: { listen: '듣기', read: '읽기', test: '시험', practice: '연습', check: '숙제 확인', answers: '정답', vocab: '어휘', grammar: '문법', pron: '발음', speak: '말하기', overview: '수업 개요', summary: '정리', homework: '숙제', extra: '팁', lesson: '제', thanks: '감사합니다!' },
    ja: { listen: '聴解', read: '読解', test: 'テスト', practice: '練習', check: '宿題チェック', answers: '解答', vocab: '語彙', grammar: '文法', pron: '発音', speak: '会話', overview: '授業の流れ', summary: 'まとめ', homework: '宿題', extra: 'ヒント', lesson: '第', thanks: 'ありがとうございました！' },
    zh: { listen: '听力', read: '阅读', test: '测验', practice: '练习', check: '作业检查', answers: '答案', vocab: '词汇', grammar: '语法', pron: '发音', speak: '口语', overview: '课程概览', summary: '总结', homework: '作业', extra: '提示', lesson: '第', thanks: '谢谢！' }
  };
  const LANG = { 'Creative English': 'en', 'Betreux': 'de', 'Créatis': 'fr', 'Saechang': 'ko', 'Sakumi': 'ja', 'Đắc Nhân': 'zh' };

  // ---------- đọc workbook (SheetJS) → { tab: [ {cột: giá trị} ] }, dòng tiêu đề = dòng đầu có ≥ 3 ô ----------
  // QC 24/10 (F01): ô định dạng giờ/ngày (h:mm, dd/mm/yyyy…) đọc thô ra 0.375 → dùng đúng chữ Excel hiển thị. Chỉ xét ô có định dạng giờ/ngày, không đụng số thường.
  function timeCells(ws) { for (const k in ws) { if (k[0] === '!') continue; const c = ws[k]; if (!c || c.t !== 'n' || !c.z || c.z === 'General') continue;
      const z = String(c.z).replace(/"[^"]*"|\[[^\]]*\]/g, ''); if (!/[hs]|[dy]|mmm/i.test(z) || /[0#]/.test(z)) continue;
      let w = c.w; if (!w && /h/i.test(z)) { const m = Math.round((c.v % 1) * 1440); w = String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
      if (w) { c.t = 's'; c.v = w; } } }
  // một Mã bài có thể gồm nhiều đoạn (nhiều hội thoại / văn bản, câu số đánh lại từ 1) → tách theo tiêu đề, giữ thứ tự xuất hiện (QC F03/F04)
  const segs = (rows, tk, sortF) => { const m = new Map(); rows.forEach(r => { const k = S(r['Mã đoạn']) || S(r[tk]); if (!m.has(k)) m.set(k, []); m.get(k).push(r); }); return [...m.values()].map(g => g.slice().sort(sortF)); };
  function readWorkbook(wb, XLSX) {
    const out = {};
    for (const name of wb.SheetNames) {
      timeCells(wb.Sheets[name]);
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: null, raw: true }).filter(r => r.some(c => c !== null && c !== ''));
      const hi = rows.findIndex(r => r.filter(c => c !== null && c !== '').length >= 2);   // tab 2 cột (Mục / Nội dung) cũng có tiêu đề
      if (hi < 0) { out[name] = []; continue; }
      const h = rows[hi].map(c => c == null ? '' : String(c).trim());
      out[name] = rows.slice(hi + 1).map(r => Object.fromEntries(h.map((k, i) => [k, r[i]]).filter(([k]) => k)));
    }
    return out;
  }

  const S = v => v == null ? '' : String(v).trim();
  const isB = (r, b) => Number(r['Buổi']) === Number(b);
  const onPPT = r => !/^không$/i.test(S(r['Lên PPT']));
  const tab = (book, re) => { const k = Object.keys(book).find(n => re.test(n)); return k ? book[k] : []; };
  const sentences = t => S(t).split(/(?<=[.!?])\s+(?=[A-ZÀ-Ỹ])/u).map(x => x.trim()).filter(Boolean);
  const chunk = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };

  // "an uncle" + phiên âm "ən ˈʌŋkəl" → "an‿uncle": nối khi âm cuối từ trước là phụ âm và âm đầu từ sau là nguyên âm (hoặc /j/, /w/).
  // Ưu tiên phiên âm (an hour → an‿hour); số từ không khớp phiên âm thì xét theo chữ cái.
  const VOW = 'aeiouæɑɒɔəɜɝɚɪʊʌɛɐ';
  function linkMark(words, ipa) {
    const ws = S(words).split(/\s+/).filter(Boolean), ips = S(ipa).replace(/[ˈˌ.]/g, '').split(/\s+/).filter(Boolean), useIpa = ips.length === ws.length;
    const endC = i => useIpa ? !VOW.includes(ips[i].replace(/ː/g, '').slice(-1)) : /[bcdfgjklmnpqrstvxz]$/i.test(ws[i].replace(/[^a-z]/gi, ''));
    const startV = i => useIpa ? (VOW + 'jw').includes(ips[i].charAt(0)) : /^[aeiou]/i.test(ws[i]);
    return ws.map((w, i) => i < ws.length - 1 ? w + (endC(i) && startV(i + 1) ? '‿' : ' ') : w).join('');
  }
  function timeline(txt) {   // "1. Mở đầu: 5p\n2. Warm-up: 5p" → [{name, min}]
    return S(txt).split(/\n+/).map(l => l.match(/^\s*\d+\.\s*(.+?)\s*:\s*(\d+)\s*p/i)).filter(Boolean).map(m => ({ name: m[1].trim(), min: +m[2] }));
  }

  // GHI CHÚ GIẢNG (ẩn dưới slide – Notes của PowerPoint): GIẢNG gì · LƯU Ý gì · ĐÁP ÁN – lấy từ chính các cột Excel S5 / S6 của nội dung trên slide
  const NOTE = o => [['THỜI LƯỢNG', o.t ? [o.t] : null], ['GIẢNG', o.g], ['LƯU Ý', o.l], ['ĐÁP ÁN', o.a]]
    .map(([h, v]) => [h, (v || []).map(S).filter(Boolean)]).filter(([, v]) => v.length).map(([h, v]) => h + '\n' + v.map(x => '• ' + x.replace(/\n+/g, ' / ')).join('\n')).join('\n\n');
  const wordNote = r => { const w = S(r['Từ']); if (!w) return ''; const ipa = S(r['Phiên âm / cách đọc']), t = S(r['Loại từ']);
    const ex = S(r['Ví dụ 1']) ? ` · vd: ${S(r['Ví dụ 1'])}${S(r['Nghĩa ví dụ 1']) ? ' (' + S(r['Nghĩa ví dụ 1']) + ')' : ''}` : '';
    return `${w}${ipa ? ' /' + ipa.replace(/^\/|\/$/g, '') + '/' : ''}${t ? ' (' + t + ')' : ''} – ${S(r['Nghĩa'])}${ex}`; };
  const wordWarn = r => { const x = [['Trọng âm', r['Trọng âm']], ['Cách dùng', r['Cách dùng']], ['Đồng nghĩa', r['Đồng nghĩa']], ['Trái nghĩa', r['Trái nghĩa']], ['Ghi chú', r['Ghi chú']]].filter(([, v]) => S(v)).map(([k, v]) => `${k}: ${S(v)}`);
    return x.length ? `${S(r['Từ'])} – ${x.join('; ')}` : ''; };

  function buildSpec(s6, s5, buoi, brand) {
    const warns = [];
    const lastNote = (o, n) => { for (let k = 1; k <= (n || 1); k++) { const x = slides[slides.length - k]; if (x && !x.notes) x.notes = NOTE(o); } };
    const L = LABELS[LANG[brand] || 'en'];
    const info = tab(s6, /Khoá & bài|Khóa & bài/).find(r => isB(r, buoi)) || {};
    const s5row = (s5 ? (s5['S5'] || tab(s5, /^S5$/)) : []).find(r => isB(r, buoi)) || {};
    const course = Object.fromEntries(tab(s6, /Thông tin khoá|Thông tin khóa/).map(r => [S(r['Mục']), S(r['Nội dung'])]));
    const name = S(info['Tên buổi']).replace(/^Bài\s*\d+\s*[–-]\s*/, '') || `Buổi ${buoi}`;
    const topic = name.length > 34 ? name.slice(0, 33).replace(/\s+\S*$/, '') + '…' : name;
    const common = { 'header.topic': topic };
    const slides = [];
    const sec = (label, extra) => Object.assign({ 'header.section': label }, extra);

    // 1. Bìa + tổng quan
    const BS = ((root.PLS_BRAND_STR || {})[brand]) || {};   // chữ cố định theo brand (tagline, web, fanpage) – không để lộ chữ của brand khác
    slides.push({ notes: NOTE({ g: [`Chào lớp, giới thiệu ${L.lesson || 'Bài'} ${info['Bài'] ? Number(info['Bài']) : buoi}: ${name}.`, S(info['Mô tả buổi']) || S(s5row['Mô tả buổi (hiển thị trên app)'])], l: [S(s5row['Lưu ý'])] }), comp: 'Slide/Cover', data: { 'tagline': BS['info/tagline'] || '', 'lesson': `${L.lesson} ${info['Bài'] ? Number(info['Bài']) : buoi}`.trim(), 'title.de': name, 'title.vi': course['Tên khoá'] || '' } });
    let steps = timeline(s5row['Nội dung buổi (timeline)']);
    if (!steps.length) { steps = S(info['Thành phần có trong buổi']).split(/;\s*/).filter(Boolean).map(n => ({ name: n, min: null })); warns.push('Không có timeline S5 → dùng "Thành phần có trong buổi" của S6, không có số phút.'); }
    const goals = sentences(info['Mục tiêu bài'] || s5row['Mục tiêu bài']).slice(0, 3);
    const ov = { 'title': 'Mục tiêu và lộ trình buổi học', 'cando.label': 'Sau buổi học, bạn có thể' };
    goals.forEach((g, i) => { ov[`cando_${i + 1}`] = g.replace(/^Học viên (sẽ )?/, ''); ov[`cando_${i + 1}.mark`] = '✓'; });
    const st8 = steps.map(s => Object.assign({}, s)); while (st8.length > 8) { let k = 0, best = Infinity;   // QC F05: không cắt bỏ bước cuối (Tổng kết, Dặn dò)
      for (let i = 0; i < st8.length - 1; i++) { const m = (st8[i].min || 0) + (st8[i + 1].min || 0); if (m < best) { best = m; k = i; } }
      const a = st8[k], b = st8[k + 1]; st8.splice(k, 2, { name: a.name + ' · ' + b.name, min: a.min == null && b.min == null ? null : (a.min || 0) + (b.min || 0) }); }
    st8.forEach((s, i) => { ov[`step_${i + 1}.no`] = String(i + 1); ov[`step_${i + 1}.text`] = s.name; if (s.min != null) ov[`step_${i + 1}.min`] = s.min + "'"; });
    if (steps.length > 8) warns.push(`Timeline có ${steps.length} bước – slide tổng quan gộp các bước ngắn kề nhau để hiện đủ trong 8 dòng.`);
    slides.push({ comp: 'Slide/Lesson Overview', data: sec(L.overview, ov), notes: NOTE({ t: s5row['Tự kiểm – tổng phút'] ? `Cả buổi ${S(s5row['Tự kiểm – tổng phút'])} phút` : '', g: ['Đọc mục tiêu, hỏi lớp đã biết gì về chủ đề.', ...sentences(info['Mục tiêu bài'] || s5row['Mục tiêu bài']), 'Lộ trình: ' + steps.map(x => x.name + (x.min != null ? ` (${x.min}')` : '')).join(' → ')], l: [S(s5row['Lưu ý'])] }) });

    const vocab = tab(s6, /Từ vựng$/).filter(r => isB(r, buoi) && onPPT(r) && S(r['Từ']));
    const grammar = tab(s6, /Ngữ pháp$/).filter(r => isB(r, buoi) && onPPT(r));
    const pron = tab(s6, /Phát âm/).filter(r => isB(r, buoi) && onPPT(r)).map(r => { const c = s => /\s/.test(s) ? s.replace(/^[a-zà-ỹđ]/, x => x.toUpperCase()) : s; return Object.assign({}, r, { 'Chữ / âm': c(S(r['Chữ / âm'])), 'Bảng chữ / nhóm âm': c(S(r['Bảng chữ / nhóm âm'])) }); });
    const speak = tab(s6, /Mẫu câu/).filter(r => isB(r, buoi) && onPPT(r) && S(r['Câu']));
    const extra = tab(s6, /Ngoài kiến thức/).filter(r => isB(r, buoi) && onPPT(r));
    const divider = (title, sub, nt) => slides.push({ comp: 'Slide/Section', data: { 'section.title': title, 'section.sub': sub || '' }, notes: NOTE(Object.assign({ g: [`Chuyển sang phần: ${title}.`] }, nt || {})) });
    const used = new Set(); let state_testAns = null;

    for (const st of steps) {
      const n = st.name.toLowerCase(); const mins = st.min != null ? `${st.min} phút` : ''; const T = mins;
      if (/mở đầu/.test(n)) continue;
      if (/từ vựng/.test(n) && !used.has('vocab')) {
        used.add('vocab'); divider(st.name, `${vocab.length} từ · ${mins}`);
        const TPL = (root.PLS_TPL || {}).slides || {};
        // CHỮ + MINH HOẠ LỚN (mẫu bổ sung): 3–5 từ cùng giá trị cột "Hình minh hoạ" → 1 slide danh sách + ảnh chung; các từ này không vào lưới
        const picG = {}; vocab.forEach(r => { const k = S(r['Hình minh hoạ']); if (k) (picG[k] = picG[k] || []).push(r); });
        const pics = TPL['Slide/Vocab Picture'] ? Object.entries(picG).filter(([, rs]) => rs.length >= 3 && rs.length <= 5) : [], inPic = new Set(pics.flatMap(([, rs]) => rs));
        const grid = vocab.filter(r => !inPic.has(r));
        if (grid.length) for (const part of chunk(grid, Math.ceil(grid.length / Math.ceil(grid.length / 24)))) slides.push({ auto: 'vocab', section: L.vocab, items: part.map(r => ({ de: S(r['Từ']), vi: S(r['Nghĩa']), nt: wordNote(r), nw: wordWarn(r) })), notes: NOTE({ t: T, g: ['Đọc mẫu từng từ 2 lần, cả lớp nhắc lại; hỏi nghĩa trước khi lật nghĩa.'] }) });
        for (const [lab, rs] of pics) { const d = { title: lab, 'img:img': lab }; rs.forEach((r, i) => { d[`item_${i + 1}.no`] = String(i + 1); d[`item_${i + 1}.de`] = S(r['Từ']); d[`item_${i + 1}.vi`] = S(r['Nghĩa']); }); slides.push({ comp: 'Slide/Vocab Picture', data: sec(L.vocab, d), notes: NOTE({ g: ['Cho HV nhìn hình đoán từ trước, rồi đọc mẫu.', ...rs.map(wordNote)], l: rs.map(wordWarn) }) }); }
        // SƠ ĐỒ QUAN HỆ TỪ (mẫu bổ sung): ≥ 3 cặp đồng nghĩa / trái nghĩa trong từ của buổi → 1 slide (tối đa 6 cặp)
        if (TPL['Slide/Vocab Map']) {
          const mean = {}; tab(s6, /Từ vựng$/).forEach(r => { const w = S(r['Từ']).toLowerCase(); if (w && !mean[w]) mean[w] = S(r['Nghĩa']); });
          const pairs = [], seen = new Set();
          for (const r of vocab) for (const [col, rel] of [['Đồng nghĩa', '='], ['Trái nghĩa', '≠']]) for (const o of S(r[col]).split(/[;,]\s*/).map(S).filter(Boolean)) {
            const a = S(r['Từ']), key = [a.toLowerCase(), o.toLowerCase()].sort().join('|') + rel; if (seen.has(key) || o.length > 24 || a.length > 24) continue; seen.add(key); pairs.push({ a, b: o, rel }); }
          if (pairs.length >= 3) {
            const d = { title: 'Từ đồng nghĩa – trái nghĩa' }; const ps = pairs.slice(0, 6); const kw = [];
            ps.forEach((x, i) => { d[`pair_${i + 1}.a`] = x.a; d[`pair_${i + 1}.b`] = x.b; d[`pair_${i + 1}.rel`] = x.rel; [x.a, x.b].forEach(w => { if (!kw.includes(w)) kw.push(w); }); });
            kw.slice(0, 8).forEach((w, i) => { d[`kv_${i + 1}.de`] = w; d[`kv_${i + 1}.vi`] = mean[w.toLowerCase()] || ''; });
            slides.push({ comp: 'Slide/Vocab Map', data: sec(L.vocab, d), notes: NOTE({ g: ['Đọc từng cặp, hỏi HV vì sao là đồng nghĩa (=) / trái nghĩa (≠).', ...ps.map(x => `${x.a} ${x.rel} ${x.b}`)], l: ['Cho HV đặt 1 câu với mỗi cặp trái nghĩa.'] }) });
          }
        }
        if (!vocab.length) warns.push('Bước "Từ vựng" nhưng S6 không có từ nào của buổi này (hoặc đều Lên PPT = Không).');
      } else if (/ngữ pháp/.test(n) && !used.has('grammar')) {
        used.add('grammar'); divider(st.name, mins);
        // mỗi điểm ngữ pháp: máy tự chọn mẫu (auto.js); câu hỏi luyện tập của điểm đó theo sau; đáp án gom cuối mục
        const A = root.PLS_AUTO; const gq = tab(s6, /Câu hỏi ngữ pháp/).filter(r => onPPT(r)); let no = 1; const keys = [];
        for (const g of grammar) {
          const tn = S(g['Tên ngữ pháp']), ng = S(g['Nghĩa']);
          const same = ng && tn.toLowerCase().includes(ng.toLowerCase().replace(/\s*\(.*$/, '').slice(0, 12));
          const title = same || /\(/.test(tn) ? tn : [tn, ng].filter(Boolean).join(' – ');
          const gNote = NOTE({ g: [title, ...S(g['Cấu trúc (công thức)']).split('\n'), ...S(g['Cách sử dụng']).split('\n'), [1, 2, 3].map(i => S(g['Ví dụ ' + i])).filter(Boolean).length ? 'Đọc ví dụ, hỏi HV chỉ ra cấu trúc trong câu.' : ''],
            l: [...S(g['Lưu ý']).split('\n'), S(g['Dấu hiệu nhận biết']) ? 'Dấu hiệu nhận biết: ' + S(g['Dấu hiệu nhận biết']) : '', S(g['So sánh với ngữ pháp đã học']) ? 'So với bài đã học: ' + S(g['So sánh với ngữ pháp đã học']) : ''] });
          if (A) slides.push({ auto: 'grammar', section: L.grammar, g: A.parseGrammar(g, title), notes: gNote });
          else { const d = { title, 'rule': S(g['Cấu trúc (công thức)']).split('\n')[0] }; [1, 2, 3].forEach(i => { if (S(g['Ví dụ ' + i])) { d[`ex_${i}.de`] = S(g['Ví dụ ' + i]); d[`ex_${i}.vi`] = S(g['Nghĩa ví dụ ' + i]); } }); slides.push({ comp: 'Slide/Grammar Rule', data: sec(L.grammar, d), notes: gNote }); }
          const qs = gq.filter(r => S(r['Mã ngữ pháp']) && S(r['Mã ngữ pháp']) === S(g['Mã mục']) && isB(r, buoi));
          if (A && qs.length) { const ex = A.exercises(qs, L.practice || L.grammar, no); no = ex.next; slides.push(...ex.groups); keys.push(...ex.keys); }
        }
        if (A && keys.length) slides.push(...A.answerSlides(keys, L.answers || L.grammar, 'Đáp án luyện tập ngữ pháp'));
      } else if (/phát âm|bảng chữ|hán tự/.test(n) && !used.has('pron')) {
        used.add('pron');
        const pNote = p => NOTE({ t: T, g: [S(p['Chữ / âm']) + (S(p['Bảng chữ / nhóm âm']) ? ' · ' + S(p['Bảng chữ / nhóm âm']) : ''), S(p['Hướng dẫn phát âm']), 'Đọc mẫu chậm → nhanh, cả lớp nhắc lại, gọi 2–3 HV đọc cá nhân.', S(p['Ví dụ']) ? 'Ví dụ: ' + S(p['Ví dụ']) : ''], l: [S(p['Chữ phát âm tương tự']) ? 'Dễ nhầm với: ' + S(p['Chữ phát âm tương tự']) : ''] });
        for (const p of pron) {
          // NỐI ÂM (mẫu bổ sung): nhóm "Nối âm" → cụm từ có dấu nối ‿ giữa phụ âm cuối và nguyên âm đầu (theo phiên âm), tối đa 6 cụm
          if (/nối âm|linking/i.test(S(p['Bảng chữ / nhóm âm']) + ' ' + S(p['Chữ / âm'])) && root.PLS_TPL && root.PLS_TPL.slides['Slide/Pronunciation Linking']) {
            const d = { 'title': S(p['Chữ / âm']), 'tip': S(p['Hướng dẫn phát âm']) };
            S(p['Ví dụ']).split(/;\s*/).filter(Boolean).slice(0, 6).forEach((x, i) => { const m = x.match(/^(.*?)\s*\(([^)]*)\)\s*$/); d[`ex_${i + 1}.no`] = String(i + 1); d[`ex_${i + 1}.word`] = linkMark(m ? m[1] : x, m ? m[2] : ''); d[`ex_${i + 1}.ipa`] = m ? '/' + m[2] + '/' : ''; });
            slides.push({ comp: 'Slide/Pronunciation Linking', data: sec(L.pron, d), notes: pNote(p) }); continue;
          }
          // PHÁT ÂM TỪNG BƯỚC (mẫu bổ sung): ví dụ là cụm / câu (trung bình ≥ 3 từ) → Nghe (câu mẫu) → Chú ý (ý chính) → Đọc lại + "Luyện thêm"
          const exs = S(p['Ví dụ']).split(/;\s*/).filter(Boolean).map(x => { const m = x.match(/^(.*?)\s*\(([^)]*)\)\s*$/); return { w: m ? m[1] : x, ipa: m ? m[2] : '' }; });
          if (exs.length && exs.reduce((a, x) => a + x.w.split(/\s+/).length, 0) / exs.length >= 3 && root.PLS_TPL && root.PLS_TPL.slides['Slide/Pronunciation Steps']) {
            const d = { 'title': S(p['Chữ / âm']), 'step_1.head': 'Nghe', 'step_2.head': 'Chú ý', 'step_3.head': 'Đọc lại', 'step_1.no': '1', 'step_1.text': exs[0].w, 'step_1.sub': exs[0].ipa ? '/' + exs[0].ipa + '/' : '',
              'step_2.no': '2', 'step_2.text': sentences(p['Hướng dẫn phát âm'])[0] || S(p['Hướng dẫn phát âm']), 'step_2.sub': '',
              'step_3.no': '3', 'step_3.text': 'Nghe lại, đọc theo đúng nhịp, rồi tự nói 1 câu tương tự.', 'step_3.sub': '' };
            exs.slice(1, 6).forEach((x, i) => { d[`chip_${i + 1}.text`] = x.w; });
            slides.push({ comp: 'Slide/Pronunciation Steps', data: sec(L.pron, d), notes: pNote(p) }); continue;
          }
          const d = { 'sound': S(p['Chữ / âm']), 'ipa': S(p['Bảng chữ / nhóm âm']), 'tip': S(p['Hướng dẫn phát âm']) };
          S(p['Ví dụ']).split(/;\s*/).filter(Boolean).slice(0, 4).forEach((x, i) => { const m = x.match(/^(.*?)\s*\(([^)]*)\)\s*$/); d[`ex_${i + 1}.word`] = m ? m[1] : x; d[`ex_${i + 1}.vi`] = m ? '/' + m[2] + '/' : ''; });
          slides.push({ comp: 'Slide/Pronunciation', data: sec(L.pron, d), notes: pNote(p) });
        }
        if (!pron.length) divider(st.name, mins);
      } else if (/nói/.test(n) && !used.has('speak')) {
        used.add('speak'); divider(st.name, mins);
        const groups = {}; speak.forEach(r => { const k = S(r['Chủ đề / tình huống']) || S(r['Mã bài']); (groups[k] = groups[k] || []).push(r); });
        for (const [title, all] of Object.entries(groups)) {
          // HỘI THOẠI (Loại = Hội thoại): 2 vai, ≤ 6 câu, câu ngắn → bong bóng (mẫu bổ sung); dài hơn → máy chọn Dialogue / Dialogue Long
          const dl = all.filter(r => /hội thoại/i.test(S(r['Loại']))), rows = all.filter(r => !/hội thoại/i.test(S(r['Loại'])));
          // CÂU HỎI TRỌNG TÂM (mẫu bổ sung): mẫu câu hỏi đầu tiên có ≥ 2 từ thay thế → câu hỏi lớn giữa slide + chip từ thay thế, trước danh sách mẫu câu
          const fq = rows.find(r => /\?\s*$/.test(S(r['Câu'])) && S(r['Từ thay thế']).split(/;\s*/).filter(Boolean).length >= 2);
          if (fq && root.PLS_TPL && root.PLS_TPL.slides['Slide/Focus Question']) {
            const d = { title, question: S(fq['Câu']), 'question.vi': S(fq['Nghĩa']) }; S(fq['Từ thay thế']).split(/;\s*/).map(S).filter(Boolean).slice(0, 6).forEach((x, i) => { d[`chip_${i + 1}.text`] = x; });
            slides.push({ comp: 'Slide/Focus Question', data: sec(L.speak, d), notes: NOTE({ g: [`Hỏi mẫu: ${S(fq['Câu'])} (${S(fq['Nghĩa'])})`, 'Thay lần lượt từng từ trong ô để HV hỏi – đáp theo cặp.'], l: ['Chú ý ngữ điệu câu hỏi.'] }) });
          }
          for (const part of chunk(rows, 4)) {
          const d = { title }; part.forEach((r, i) => { d[`p_${i + 1}.no`] = String(i + 1); d[`p_${i + 1}.de`] = S(r['Câu']); d[`p_${i + 1}.ipa`] = S(r['Phiên âm']) ? '/' + S(r['Phiên âm']) + '/' : ''; d[`p_${i + 1}.vi`] = S(r['Nghĩa']); });
          slides.push({ comp: 'Slide/Pattern List', data: sec(L.speak, d), notes: NOTE({ t: T, g: ['Đọc mẫu từng câu, HV nhắc lại; luyện theo cặp.', ...part.map(r => `${S(r['Câu'])} – ${S(r['Nghĩa'])}`)], l: part.filter(r => S(r['Từ thay thế'])).map(r => `Thay từ: ${S(r['Câu'])} → ${S(r['Từ thay thế'])}`) }) });
          }
          if (dl.length) {
            const who = r => S(r['Vai']) || '–', roles = [...new Set(dl.map(who))];
            if (roles.length <= 2 && dl.length <= 6 && dl.every(r => S(r['Câu']).length <= 90) && root.PLS_TPL && root.PLS_TPL.slides['Slide/Dialogue Bubbles']) {
              const d = { title, pair: 'Làm theo cặp: đọc hội thoại, sau đó đổi vai.' };
              dl.forEach((r, i) => { const w = who(r); d[`line_${i + 1}.who`] = w.length <= 3 ? w : w.charAt(0).toUpperCase(); d[`line_${i + 1}.de`] = S(r['Câu']); d[`line_${i + 1}.vi`] = S(r['Nghĩa']); });
              slides.push({ comp: 'Slide/Dialogue Bubbles', data: sec(L.speak, d) });
            } else slides.push({ auto: 'dlg', section: L.speak, situation: title, lines: dl.map(r => ({ sp: who(r), de: S(r['Câu']), vi: S(r['Nghĩa']) })) });
            lastNote({ g: [`Tình huống: ${title}.`, 'Đọc mẫu hội thoại, chia vai cho 2 nhóm, sau đó đổi vai.', 'Gọi 1–2 cặp diễn lại trước lớp.'], l: ['Sửa phát âm và ngữ điệu sau khi cặp diễn xong, không ngắt giữa chừng.'] });
          }
        }
      } else if (/tổng kết/.test(n)) {
        const sumD = sec(L.summary, { 'title': 'Tổng kết buổi học',
          'col_1.title': 'Từ vựng', 'col_1.text': vocab.slice(0, 8).map(r => S(r['Từ'])).join(', ') + (vocab.length > 8 ? ` … (${vocab.length} từ)` : ''),
          'col_2.title': 'Ngữ pháp', 'col_2.text': grammar.map(g => S(g['Tên ngữ pháp'])).join('\n') || '–',
          'col_3.title': pron.length ? 'Phát âm' : 'Mẫu câu', 'col_3.text': pron.length ? pron.map(p => S(p['Chữ / âm'])).join('\n') : speak.slice(0, 3).map(r => S(r['Câu'])).join('\n') || '–' });
        // TỔNG KẾT + DẶN DÒ gộp 1 slide (mẫu bổ sung) khi buổi có bước "Dặn dò" ngay sau và dặn dò ≤ 3 ý; máy vẫn so với cách tách 2 slide
        const hwItems = sentences(s5row['Dặn dò']).slice(0, 3), hasDD = steps.some(x => /dặn dò/i.test(x.name));
        const hwD = { 'title': 'Dặn dò', 'deadline': `Trước buổi ${Number(buoi) + 1}` }; hwItems.forEach((t, i) => { hwD[`item_${i + 1}.no`] = String(i + 1); hwD[`item_${i + 1}.text`] = t; });
        if (hasDD && hwItems.length && root.PLS_AUTO && root.PLS_AUTO.sumhw && root.PLS_TPL && root.PLS_TPL.slides['Slide/Summary Homework']) {
          used.add('dd'); slides.push({ auto: 'sumhw', section: L.summary, summary: sumD, homework: sec(L.homework, hwD) });
        } else slides.push({ comp: 'Slide/Summary', data: sumD });
        lastNote({ t: T, g: ['Hỏi lại nhanh: mỗi HV nói 1 từ / 1 câu theo mẫu của buổi.', 'Từ vựng: ' + vocab.map(r => S(r['Từ'])).join(', '), grammar.length ? 'Ngữ pháp: ' + grammar.map(g => S(g['Tên ngữ pháp'])).join('; ') : ''], l: [S(s5row['Dặn dò']) ? 'Dặn dò: ' + S(s5row['Dặn dò']) : '', S(s5row['Lưu ý'])] });
        for (const x of extra) slides.push({ comp: 'Slide/Section', data: { 'section.title': S(x['Tiêu đề']), 'section.sub': S(x['Loại']) }, notes: NOTE({ g: [S(x['Tiêu đề']), S(x['Nội dung'])], l: [S(x['Kiến thức kết hợp']) ? 'Kết hợp: ' + S(x['Kiến thức kết hợp']) : '', S(x['Nguồn']) ? 'Nguồn: ' + S(x['Nguồn']) : ''] }) });
      } else if (/dặn dò/.test(n) && used.has('dd')) {
        continue;   // đã gộp vào slide Tổng kết + Dặn dò
      } else if (/dặn dò/.test(n)) {
        const items = sentences(s5row['Dặn dò']).slice(0, 3);
        if (items.length) { const d = { 'title': 'Dặn dò', 'deadline': `Trước buổi ${Number(buoi) + 1}` }; items.forEach((t, i) => { d[`item_${i + 1}.no`] = String(i + 1); d[`item_${i + 1}.text`] = t; }); slides.push({ comp: 'Slide/Homework', data: sec(L.homework, d), notes: NOTE({ g: ['Đọc từng việc cần làm, nhắc hạn nộp trước buổi ' + (Number(buoi) + 1) + '.', ...items], l: [S(s5row['Tài nguyên khác (PDF, audio PDF)']) ? 'Tài nguyên: ' + S(s5row['Tài nguyên khác (PDF, audio PDF)']) : ''] }) }); }
        else divider(st.name, mins);
      } else if (/sửa btvn/.test(n) && !used.has('btvn') && root.PLS_AUTO) {
        // SỬA BTVN: bài tập về nhà của buổi trước (Lên PPT = Có), bỏ dạng không trình chiếu được (thu âm, flashcard, viết tay)
        used.add('btvn'); const A = root.PLS_AUTO;
        const rows = tab(s6, /BTVN/).filter(r => isB(r, Number(buoi) - 1) && onPPT(r));
        const ex = A.exercises(rows, L.check || L.homework, 1);
        divider(st.name, [mins, ex.groups.length ? `BTVN buổi ${Number(buoi) - 1} · ${ex.next - 1} câu` : 'không có BTVN trình chiếu'].filter(Boolean).join(' · '));
        slides.push(...ex.groups);
        if (ex.keys.length) slides.push(...A.answerSlides(ex.keys, L.answers || L.homework, `Đáp án BTVN buổi ${Number(buoi) - 1}`));
      } else if (/^nghe/.test(n) && !used.has('listen') && root.PLS_AUTO) {
        // NGHE: mỗi bài (Mã bài) → câu hỏi trước khi nghe (Listening) + trắc nghiệm + lời bài (hội thoại); đáp án cuối mục
        used.add('listen'); const A = root.PLS_AUTO;
        const lines = tab(s6, /^S6-Nghe$/).filter(r => isB(r, buoi) && onPPT(r) && S(r['Câu'])), qs = tab(s6, /Nghe câu hỏi/).filter(r => isB(r, buoi) && onPPT(r));
        const codes = [...new Set(lines.map(r => S(r['Mã bài'])).concat(qs.map(r => S(r['Mã bài']))))].filter(Boolean);
        divider(st.name, [mins, codes.length ? `${codes.length} bài nghe` : 'thực hiện trên app'].filter(Boolean).join(' · '));
        let no = 1; const keys = [];
        for (const c of codes) {
          const ls = lines.filter(r => S(r['Mã bài']) === c).sort((a, b) => (+a['Câu số'] || 0) - (+b['Câu số'] || 0)), q = qs.filter(r => S(r['Mã bài']) === c);
          const r0 = ls[0] || {}; const title = [S(r0['Tiêu đề bài nghe']), S(r0['Nghĩa tiêu đề'])].filter(Boolean).join(' – ') || c;
          if (q.length) { const d = { track: title, task: 'Nghe và trả lời câu hỏi.', 'task.vi': '' }; let tot = 0; q.map(x => S(x['Câu hỏi']).replace(/^\[[^\]]{1,80}\]\s*/, '')).filter((t, i) => i < 4 && (i === 0 || (tot += t.length) <= 260) && (i > 0 || (tot = t.length))).forEach((t, i) => { d[`q_${i + 1}.no`] = String(i + 1); d[`q_${i + 1}.text`] = t; }); /* câu hỏi trước khi nghe: tối đa 4 câu, ≤ 260 ký tự cho khỏi co chữ */ slides.push({ comp: 'Slide/Listening', data: sec(L.listen || L.speak, d) }); }
          if (q.length) { const ex = A.exercises(q, L.listen || L.speak, no, 'Nghe đoạn ghi âm rồi chọn đáp án đúng.'); no = ex.next; slides.push(...ex.groups); keys.push(...ex.keys); }
          for (const g of segs(ls, 'Tiêu đề bài nghe', (a, b) => (+a['Câu số'] || 0) - (+b['Câu số'] || 0))) { const r1 = g[0] || {}, t1 = [S(r1['Tiêu đề bài nghe']), S(r1['Nghĩa tiêu đề'])].filter(Boolean).join(' – ') || title;
            slides.push({ auto: 'dlg', section: L.listen || L.speak, situation: 'Lời bài nghe: ' + t1, lines: g.map(r => ({ sp: S(r['Vai / nhân vật']) || '–', de: S(r['Câu']), vi: S(r['Nghĩa']) })),
            notes: NOTE({ g: ['Chỉ mở lời bài sau khi HV đã nghe và trả lời câu hỏi.', 'Nghe lại từng đoạn, dừng ở câu chứa đáp án.', S(r1['File audio']) ? 'Audio: ' + S(r1['File audio']) : ''], l: g.filter(r => S(r['Mốc thời gian'])).slice(0, 8).map(r => `${S(r['Mốc thời gian'])} – ${S(r['Câu'])}`) }) }); }
        }
        if (keys.length) slides.push(...A.answerSlides(keys, L.answers || L.listen, 'Đáp án bài nghe'));
      } else if (/^đọc/.test(n) && !used.has('read') && root.PLS_AUTO) {
        // ĐỌC: mỗi bài → đoạn văn (máy chọn 1 cột / 2 cột) + trắc nghiệm; đáp án cuối mục
        used.add('read'); const A = root.PLS_AUTO;
        const lines = tab(s6, /^S6-Đọc$/).filter(r => isB(r, buoi) && onPPT(r) && S(r['Câu'])), qs = tab(s6, /Đọc câu hỏi/).filter(r => isB(r, buoi) && onPPT(r));
        const codes = [...new Set(lines.map(r => S(r['Mã bài'])).concat(qs.map(r => S(r['Mã bài']))))].filter(Boolean);
        divider(st.name, [mins, codes.length ? `${codes.length} bài đọc` : 'thực hiện trên app'].filter(Boolean).join(' · '));
        let no = 1; const keys = [];
        for (const c of codes) {
          const ls = lines.filter(r => S(r['Mã bài']) === c).sort((a, b) => ((+a['Đoạn'] || 0) - (+b['Đoạn'] || 0)) || ((+a['Câu số'] || 0) - (+b['Câu số'] || 0))), q = qs.filter(r => S(r['Mã bài']) === c);
          const r0 = ls[0] || {}; const title = [S(r0['Tiêu đề bài đọc']), S(r0['Nghĩa tiêu đề'])].filter(Boolean).join(' – ') || c;
          for (const g of segs(ls, 'Tiêu đề bài đọc', (a, b) => ((+a['Đoạn'] || 0) - (+b['Đoạn'] || 0)) || ((+a['Câu số'] || 0) - (+b['Câu số'] || 0)))) { const r1 = g[0] || {}, title = [S(r1['Tiêu đề bài đọc']), S(r1['Nghĩa tiêu đề'])].filter(Boolean).join(' – ') || c, ls = g;
          const paras = []; let cur = null; for (const r of ls) { const p = String(r['Đoạn'] || 1); if (!cur || cur.p !== p) { cur = { p, t: [] }; paras.push(cur); } cur.t.push(S(r['Câu'])); }
          if (paras.length) slides.push({ auto: 'read', section: L.read || L.speak, tag: 'Reading', title, paras: paras.map(x => x.t.join(' ')), notes: NOTE({ t: T, g: [`Bài đọc: ${title}.`, 'Cho HV đọc thầm 2–3 phút, gạch chân từ mới; sau đó đọc mẫu từng đoạn.', ...ls.slice(0, 12).map(r => `${S(r['Câu'])} – ${S(r['Nghĩa'])}`)], l: ['Hỏi ý chính từng đoạn trước khi chuyển sang câu hỏi.'] }) }); }
          if (q.length) { const ex = A.exercises(q, L.read || L.speak, no, 'Đọc bài rồi chọn đáp án đúng.'); no = ex.next; slides.push(...ex.groups); keys.push(...ex.keys); }
        }
        if (keys.length) slides.push(...A.answerSlides(keys, L.answers || L.read, 'Đáp án bài đọc'));
      } else if (/kiểm tra/.test(n) && !/sửa/.test(n) && !used.has('test') && root.PLS_AUTO) {
        // KIỂM TRA: đề của buổi (S6-Đề kiểm tra) → trang giới thiệu đề (số câu, thời gian, các phần) + câu hỏi; đáp án ở bước "Sửa kiểm tra" (không có thì ngay sau đề)
        used.add('test'); const A = root.PLS_AUTO;
        const de = tab(s6, /Đề kiểm tra/).filter(r => isB(r, buoi) && onPPT(r))[0];
        if (!de) { divider(st.name, [mins, 'thực hiện trên app'].filter(Boolean).join(' · ')); continue; }
        const qs = tab(s6, /Câu hỏi kiểm tra/).filter(r => S(r['Mã đề']) === S(de['Mã đề']) && onPPT(r));
        if (!qs.length) { warns.push(`Đề ${S(de['Mã đề'])} chưa có câu hỏi trong S6-Câu hỏi kiểm tra – chưa dựng slide đề.`); divider(st.name, [mins, 'đề chưa có câu hỏi'].filter(Boolean).join(' · ')); continue; }   // không để slide còn chữ mẫu
        const parts = []; for (const r of qs) { const k = S(r['Phần']) || S(r['Kỹ năng']) || 'Câu hỏi'; let p = parts.find(x => x.k === k); if (!p) parts.push(p = { k, n: 0, t: 0 }); p.n++; p.t += +r['Thời gian ước tính'] || 0; }
        const d = { title: S(de['Tên đề']).replace(/^Buổi\s*\d+\s*-\s*/i, '').replace(/\s*-\s*\d+\s*$/, '') || st.name, total_q: String(qs.length), 'total_q.unit': 'câu', total_min: String(Number(de['Thời gian làm bài (phút)']) || st.min || ''), 'total_min.unit': 'phút' };
        for (let i = Math.min(parts.length, 6); i < 6; i++) ['no', 'name', 'count', 'time'].forEach(k => { d[`part_${i + 1}.${k}`] = ''; });   // ô phần không dùng → trống (không hiện chữ mẫu)
        parts.slice(0, 6).forEach((p, i) => { d[`part_${i + 1}.no`] = String(i + 1); d[`part_${i + 1}.name`] = p.k; d[`part_${i + 1}.count`] = p.n + ' câu'; d[`part_${i + 1}.time`] = p.t ? Math.max(1, Math.round(p.t)) + ' phút' : ''; });
        slides.push({ comp: 'Slide/Test Intro', data: sec(L.test || L.homework, d), notes: NOTE({ t: `${d.total_min || ''} phút`.trim(), g: [`Giới thiệu đề: ${qs.length} câu, ${parts.length} phần (${parts.map(p => p.k).join(', ')}).`, 'Nhắc HV cất tài liệu, làm bài độc lập.'], l: ['Báo thời gian khi còn 5 phút.'] }) });
        const ex = A.exercises(qs, L.test || L.homework, 1); slides.push(...ex.groups);
        const ans = A.answerSlides(ex.keys, L.answers || L.test, 'Đáp án ' + (d.title || 'kiểm tra'));
        if (steps.some(x => /sửa kiểm tra/i.test(x.name))) state_testAns = ans; else slides.push(...ans);
      } else if (/sửa kiểm tra/.test(n) && typeof state_testAns !== 'undefined' && state_testAns && state_testAns.length) {
        divider(st.name, mins); slides.push(...state_testAns); state_testAns = null;
      } else {
        divider(st.name, [mins, /kiểm tra|btvn|nghe|đọc/.test(n) ? 'thực hiện trên app' : ''].filter(Boolean).join(' · '));
      }
    }
    slides.push({ comp: 'Slide/End', data: { 'thanks.de': L.thanks, 'thanks.vi': 'Cảm ơn các bạn!' }, notes: NOTE({ g: ['Cảm ơn lớp, nhắc lại bài tập về nhà và hạn nộp.', S(s5row['Dặn dò'])], l: [S(s5row['Lưu ý'])] }) });
    const meta = { level: course['Cấp độ'] || '', no: Number(buoi), sessionType: S(info['Loại buổi']), title: name, course: course['Tên khoá'] || '' };
    return { spec: { brand, meta, lesson: `${course['Mã khoá'] || course['Tên khoá'] || 'Khoá'} · ${S(info['Tên buổi']) || 'Buổi ' + buoi}`, common, slides }, warns, counts: { vocab: vocab.length, grammar: grammar.length, pron: pron.length, speak: speak.length, steps: steps.length } };
  }
  function sessions(s6) { return tab(s6, /Khoá & bài|Khóa & bài/).filter(r => r['Buổi'] != null).map(r => ({ buoi: Number(r['Buổi']), name: S(r['Tên buổi']), type: S(r['Loại buổi']) })); }

  root.PLS_IMPORT = { readWorkbook, buildSpec, sessions, LABELS };
})(typeof window !== 'undefined' ? window : globalThis);
