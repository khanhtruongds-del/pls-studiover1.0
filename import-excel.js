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
  function readWorkbook(wb, XLSX) {
    const out = {};
    for (const name of wb.SheetNames) {
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

  function timeline(txt) {   // "1. Mở đầu: 5p\n2. Warm-up: 5p" → [{name, min}]
    return S(txt).split(/\n+/).map(l => l.match(/^\s*\d+\.\s*(.+?)\s*:\s*(\d+)\s*p/i)).filter(Boolean).map(m => ({ name: m[1].trim(), min: +m[2] }));
  }

  function buildSpec(s6, s5, buoi, brand) {
    const warns = [];
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
    slides.push({ comp: 'Slide/Cover', data: { 'tagline': BS['info/tagline'] || '', 'lesson': `${L.lesson} ${info['Bài'] ? Number(info['Bài']) : buoi}`.trim(), 'title.de': name, 'title.vi': course['Tên khoá'] || '' } });
    let steps = timeline(s5row['Nội dung buổi (timeline)']);
    if (!steps.length) { steps = S(info['Thành phần có trong buổi']).split(/;\s*/).filter(Boolean).map(n => ({ name: n, min: null })); warns.push('Không có timeline S5 → dùng "Thành phần có trong buổi" của S6, không có số phút.'); }
    const goals = sentences(info['Mục tiêu bài'] || s5row['Mục tiêu bài']).slice(0, 3);
    const ov = { 'title': 'Mục tiêu và lộ trình buổi học', 'cando.label': 'Sau buổi học, bạn có thể' };
    goals.forEach((g, i) => { ov[`cando_${i + 1}`] = g.replace(/^Học viên (sẽ )?/, ''); ov[`cando_${i + 1}.mark`] = '✓'; });
    steps.slice(0, 8).forEach((s, i) => { ov[`step_${i + 1}.no`] = String(i + 1); ov[`step_${i + 1}.text`] = s.name; if (s.min != null) ov[`step_${i + 1}.min`] = s.min + "'"; });
    if (steps.length > 8) warns.push(`Timeline có ${steps.length} bước, slide tổng quan chỉ hiện 8.`);
    slides.push({ comp: 'Slide/Lesson Overview', data: sec(L.overview, ov) });

    const vocab = tab(s6, /Từ vựng$/).filter(r => isB(r, buoi) && onPPT(r) && S(r['Từ']));
    const grammar = tab(s6, /Ngữ pháp$/).filter(r => isB(r, buoi) && onPPT(r));
    const pron = tab(s6, /Phát âm/).filter(r => isB(r, buoi) && onPPT(r));
    const speak = tab(s6, /Mẫu câu/).filter(r => isB(r, buoi) && onPPT(r) && S(r['Câu']));
    const extra = tab(s6, /Ngoài kiến thức/).filter(r => isB(r, buoi) && onPPT(r));
    const divider = (title, sub) => slides.push({ comp: 'Slide/Section', data: { 'section.title': title, 'section.sub': sub || '' } });
    const used = new Set(); let state_testAns = null;

    for (const st of steps) {
      const n = st.name.toLowerCase(); const mins = st.min != null ? `${st.min} phút` : '';
      if (/mở đầu/.test(n)) continue;
      if (/từ vựng/.test(n) && !used.has('vocab')) {
        used.add('vocab'); divider(st.name, `${vocab.length} từ · ${mins}`);
        for (const part of chunk(vocab, Math.ceil(vocab.length / Math.ceil(vocab.length / 24)))) slides.push({ auto: 'vocab', section: L.vocab, items: part.map(r => ({ de: S(r['Từ']), vi: S(r['Nghĩa']) })) });
        if (!vocab.length) warns.push('Bước "Từ vựng" nhưng S6 không có từ nào của buổi này (hoặc đều Lên PPT = Không).');
      } else if (/ngữ pháp/.test(n) && !used.has('grammar')) {
        used.add('grammar'); divider(st.name, mins);
        // mỗi điểm ngữ pháp: máy tự chọn mẫu (auto.js); câu hỏi luyện tập của điểm đó theo sau; đáp án gom cuối mục
        const A = root.PLS_AUTO; const gq = tab(s6, /Câu hỏi ngữ pháp/).filter(r => onPPT(r)); let no = 1; const keys = [];
        for (const g of grammar) {
          const tn = S(g['Tên ngữ pháp']), ng = S(g['Nghĩa']);
          const same = ng && tn.toLowerCase().includes(ng.toLowerCase().replace(/\s*\(.*$/, '').slice(0, 12));
          const title = same || /\(/.test(tn) ? tn : [tn, ng].filter(Boolean).join(' – ');
          if (A) slides.push({ auto: 'grammar', section: L.grammar, g: A.parseGrammar(g, title) });
          else { const d = { title, 'rule': S(g['Cấu trúc (công thức)']).split('\n')[0] }; [1, 2, 3].forEach(i => { if (S(g['Ví dụ ' + i])) { d[`ex_${i}.de`] = S(g['Ví dụ ' + i]); d[`ex_${i}.vi`] = S(g['Nghĩa ví dụ ' + i]); } }); slides.push({ comp: 'Slide/Grammar Rule', data: sec(L.grammar, d) }); }
          const qs = gq.filter(r => S(r['Mã ngữ pháp']) && S(r['Mã ngữ pháp']) === S(g['Mã mục']) && isB(r, buoi));
          if (A && qs.length) { const ex = A.exercises(qs, L.practice || L.grammar, no); no = ex.next; slides.push(...ex.groups); keys.push(...ex.keys); }
        }
        if (A && keys.length) slides.push(...A.answerSlides(keys, L.answers || L.grammar, 'Đáp án luyện tập ngữ pháp'));
      } else if (/phát âm|bảng chữ|hán tự/.test(n) && !used.has('pron')) {
        used.add('pron');
        for (const p of pron) {
          const d = { 'sound': S(p['Chữ / âm']), 'ipa': S(p['Bảng chữ / nhóm âm']), 'tip': S(p['Hướng dẫn phát âm']) };
          S(p['Ví dụ']).split(/;\s*/).filter(Boolean).slice(0, 4).forEach((x, i) => { const m = x.match(/^(.*?)\s*\(([^)]*)\)\s*$/); d[`ex_${i + 1}.word`] = m ? m[1] : x; d[`ex_${i + 1}.vi`] = m ? '/' + m[2] + '/' : ''; });
          slides.push({ comp: 'Slide/Pronunciation', data: sec(L.pron, d) });
        }
        if (!pron.length) divider(st.name, mins);
      } else if (/nói/.test(n) && !used.has('speak')) {
        used.add('speak'); divider(st.name, mins);
        const groups = {}; speak.forEach(r => { const k = S(r['Chủ đề / tình huống']) || S(r['Mã bài']); (groups[k] = groups[k] || []).push(r); });
        for (const [title, rows] of Object.entries(groups)) for (const part of chunk(rows, 4)) {
          const d = { title }; part.forEach((r, i) => { d[`p_${i + 1}.no`] = String(i + 1); d[`p_${i + 1}.de`] = S(r['Câu']); d[`p_${i + 1}.ipa`] = S(r['Phiên âm']) ? '/' + S(r['Phiên âm']) + '/' : ''; d[`p_${i + 1}.vi`] = S(r['Nghĩa']); });
          slides.push({ comp: 'Slide/Pattern List', data: sec(L.speak, d) });
        }
      } else if (/tổng kết/.test(n)) {
        slides.push({ comp: 'Slide/Summary', data: sec(L.summary, { 'title': 'Tổng kết buổi học',
          'col_1.title': 'Từ vựng', 'col_1.text': vocab.slice(0, 8).map(r => S(r['Từ'])).join(', ') + (vocab.length > 8 ? ` … (${vocab.length} từ)` : ''),
          'col_2.title': 'Ngữ pháp', 'col_2.text': grammar.map(g => S(g['Tên ngữ pháp'])).join('\n') || '–',
          'col_3.title': pron.length ? 'Phát âm' : 'Mẫu câu', 'col_3.text': pron.length ? pron.map(p => S(p['Chữ / âm'])).join('\n') : speak.slice(0, 3).map(r => S(r['Câu'])).join('\n') || '–' }) });
        for (const x of extra) slides.push({ comp: 'Slide/Section', data: { 'section.title': S(x['Tiêu đề']), 'section.sub': S(x['Loại']) } });
      } else if (/dặn dò/.test(n)) {
        const items = sentences(s5row['Dặn dò']).slice(0, 3);
        if (items.length) { const d = { 'title': 'Dặn dò', 'deadline': `Trước buổi ${Number(buoi) + 1}` }; items.forEach((t, i) => { d[`item_${i + 1}.no`] = String(i + 1); d[`item_${i + 1}.text`] = t; }); slides.push({ comp: 'Slide/Homework', data: sec(L.homework, d) }); }
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
          if (ls.length) slides.push({ auto: 'dlg', section: L.listen || L.speak, situation: 'Lời bài nghe: ' + title, lines: ls.map(r => ({ sp: S(r['Vai / nhân vật']) || '–', de: S(r['Câu']), vi: S(r['Nghĩa']) })) });
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
          const paras = []; let cur = null; for (const r of ls) { const p = String(r['Đoạn'] || 1); if (!cur || cur.p !== p) { cur = { p, t: [] }; paras.push(cur); } cur.t.push(S(r['Câu'])); }
          if (paras.length) slides.push({ auto: 'read', section: L.read || L.speak, tag: 'Reading', title, paras: paras.map(x => x.t.join(' ')) });
          if (q.length) { const ex = A.exercises(q, L.read || L.speak, no, 'Đọc bài rồi chọn đáp án đúng.'); no = ex.next; slides.push(...ex.groups); keys.push(...ex.keys); }
        }
        if (keys.length) slides.push(...A.answerSlides(keys, L.answers || L.read, 'Đáp án bài đọc'));
      } else if (/kiểm tra/.test(n) && !/sửa/.test(n) && !used.has('test') && root.PLS_AUTO) {
        // KIỂM TRA: đề của buổi (S6-Đề kiểm tra) → trang giới thiệu đề (số câu, thời gian, các phần) + câu hỏi; đáp án ở bước "Sửa kiểm tra" (không có thì ngay sau đề)
        used.add('test'); const A = root.PLS_AUTO;
        const de = tab(s6, /Đề kiểm tra/).filter(r => isB(r, buoi) && onPPT(r))[0];
        if (!de) { divider(st.name, [mins, 'thực hiện trên app'].filter(Boolean).join(' · ')); continue; }
        const qs = tab(s6, /Câu hỏi kiểm tra/).filter(r => S(r['Mã đề']) === S(de['Mã đề']) && onPPT(r));
        const parts = []; for (const r of qs) { const k = S(r['Phần']) || S(r['Kỹ năng']) || 'Câu hỏi'; let p = parts.find(x => x.k === k); if (!p) parts.push(p = { k, n: 0, t: 0 }); p.n++; p.t += +r['Thời gian ước tính'] || 0; }
        const d = { title: S(de['Tên đề']).replace(/^Buổi\s*\d+\s*-\s*/i, '').replace(/\s*-\s*\d+\s*$/, '') || st.name, total_q: String(qs.length), 'total_q.unit': 'câu', total_min: String(Number(de['Thời gian làm bài (phút)']) || st.min || ''), 'total_min.unit': 'phút' };
        parts.slice(0, 6).forEach((p, i) => { d[`part_${i + 1}.no`] = String(i + 1); d[`part_${i + 1}.name`] = p.k; d[`part_${i + 1}.count`] = p.n + ' câu'; d[`part_${i + 1}.time`] = p.t ? Math.max(1, Math.round(p.t)) + ' phút' : ''; });
        slides.push({ comp: 'Slide/Test Intro', data: sec(L.test || L.homework, d) });
        const ex = A.exercises(qs, L.test || L.homework, 1); slides.push(...ex.groups);
        const ans = A.answerSlides(ex.keys, L.answers || L.test, 'Đáp án ' + (d.title || 'kiểm tra'));
        if (steps.some(x => /sửa kiểm tra/i.test(x.name))) state_testAns = ans; else slides.push(...ans);
      } else if (/sửa kiểm tra/.test(n) && typeof state_testAns !== 'undefined' && state_testAns && state_testAns.length) {
        divider(st.name, mins); slides.push(...state_testAns); state_testAns = null;
      } else {
        divider(st.name, [mins, /kiểm tra|btvn|nghe|đọc/.test(n) ? 'thực hiện trên app' : ''].filter(Boolean).join(' · '));
      }
    }
    slides.push({ comp: 'Slide/End', data: { 'thanks.de': L.thanks, 'thanks.vi': 'Cảm ơn các bạn!' } });
    const meta = { level: course['Cấp độ'] || '', no: Number(buoi), sessionType: S(info['Loại buổi']), title: name, course: course['Tên khoá'] || '' };
    return { spec: { brand, meta, lesson: `${course['Mã khoá'] || course['Tên khoá'] || 'Khoá'} · ${S(info['Tên buổi']) || 'Buổi ' + buoi}`, common, slides }, warns, counts: { vocab: vocab.length, grammar: grammar.length, pron: pron.length, speak: speak.length, steps: steps.length } };
  }
  function sessions(s6) { return tab(s6, /Khoá & bài|Khóa & bài/).filter(r => r['Buổi'] != null).map(r => ({ buoi: Number(r['Buổi']), name: S(r['Tên buổi']), type: S(r['Loại buổi']) })); }

  root.PLS_IMPORT = { readWorkbook, buildSpec, sessions, LABELS };
})(typeof window !== 'undefined' ? window : globalThis);
