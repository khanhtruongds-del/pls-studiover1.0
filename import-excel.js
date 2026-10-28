// Nhập Excel giáo trình (khuôn S5 = khung buổi học, S6 = nội dung chi tiết) → spec bài slide cho 1 buổi.
// Thứ tự slide theo timeline S5 ("1. Mở đầu: 5p …"); chỉ lấy dòng "Lên PPT" ≠ "Không" (S6-Bảng phân phối).
(function (root) {
  'use strict';
  const LABELS = {   // nhãn header.section theo ngôn ngữ brand (BACKLOG: nhãn đang cố định tiếng Đức)
    en: { listen: 'LISTENING', read: 'READING', test: 'TEST', practice: 'PRACTICE', check: 'HOMEWORK CHECK', answers: 'ANSWER KEY', vocab: 'VOCABULARY', grammar: 'GRAMMAR', pron: 'PRONUNCIATION', speak: 'SPEAKING', overview: 'LESSON OVERVIEW', summary: 'SUMMARY', homework: 'HOMEWORK', extra: 'TIPS', lesson: 'LESSON', thanks: 'Thank you!', warm: 'WARM-UP' },
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
  // QC 24/10 (layout P1 "một track / một văn bản + câu hỏi"): câu hỏi ghi "[Tiêu đề] …" → ghép đúng đoạn; không ghép được thì giữ cả mã bài như cũ
  const units = (codes, lines, qs, tk) => codes.flatMap(c => { const ls = lines.filter(r => S(r['Mã bài']) === c), q = qs.filter(r => S(r['Mã bài']) === c);
    const g = segs(ls, tk, () => 0); if (g.length < 2 || !q.length) return [{ c, ls, q }];
    const key = t => S(t).toLowerCase().replace(/\s+/g, ' '), br = x => key((S(x['Câu hỏi']).match(/^\[([^\]]{1,80})\]/) || [])[1]);
    const us = g.map(gg => ({ c, ls: gg, q: [], t: key(gg[0][tk]) })), rest = [];
    q.forEach(x => { const b = br(x), u = b && us.find(u => u.t && (u.t === b || u.t.startsWith(b) || b.startsWith(u.t))); (u ? u.q : rest).push(x); });
    if (!us.some(u => u.q.length)) return [{ c, ls, q }];
    us[us.length - 1].q.push(...rest); return us; });
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
  const onPPT = r => !/^không$/i.test(S(r['Lên PPT'])) && !/mở rộng/i.test(S(r['Trên lớp']));   // cột "Trên lớp" = Mở rộng → chỉ sách / app
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
    { const gb = s5 || {}, gk = Object.keys(gb).find(k => /Hướng dẫn giảng dạy/.test(k));   // THỨ TỰ BUỔI = đúng thứ tự hoạt động trong S5 (người dùng 28/10)
      const guide = (gk ? gb[gk] : []).filter(r => isB(r, buoi) && S(r['Hoạt động'])).sort((a, b) => (+a['STT hoạt động'] || 0) - (+b['STT hoạt động'] || 0));
      if (guide.length) steps = guide.map(r => ({ name: S(r['Hoạt động']).replace(/\s*\n\s*/g, ' '), min: r['Phút'] != null && r['Phút'] !== '' ? +r['Phút'] : null, g: r })); }
    if (!steps.length) { steps = S(info['Thành phần có trong buổi']).split(/;\s*/).filter(Boolean).map(n => ({ name: n, min: null })); warns.push('Không có timeline S5 → dùng "Thành phần có trong buổi" của S6, không có số phút.'); }
    // THỨ TỰ NỘI DUNG CHỐT (người dùng 28/10): Khai giảng (không nội dung) → Từ vựng → Hán tự / Bảng chữ / Phát âm → Nói; bỏ Dặn dò.
    // Các bước khác (Sửa BTVN, Phản xạ pinyin, Ôn tập, HD App, Test…) giữ nguyên chỗ như S5; chỉ các bước có hạng đổi chỗ cho nhau.
    steps = steps.filter(x => !/dặn dò/i.test(x.name));
    { const RANK = n => /cttt|khai giảng/i.test(n) ? 0 : /từ vựng/i.test(n) ? 1 : /hán tự/i.test(n) ? 2 : /bảng chữ/i.test(n) ? 3 : /phát âm/i.test(n) ? 4 : /mẫu câu|giao tiếp|hội thoại|nói/i.test(n) ? 5 : null;
      const slots = steps.map((x, i) => RANK(x.name) != null ? i : -1).filter(i => i >= 0), ranked = slots.map(i => steps[i]).sort((a, b) => RANK(a.name) - RANK(b.name));
      slots.forEach((i, k) => { steps[i] = ranked[k]; }); }
    const goals = sentences(info['Mục tiêu bài'] || s5row['Mục tiêu bài']).slice(0, 3);
    const ov = { 'title': 'Mục tiêu và lộ trình buổi học', 'cando.label': 'Sau buổi học, bạn có thể' };
    goals.forEach((g, i) => { ov[`cando_${i + 1}`] = g.replace(/^Học viên (sẽ )?/, ''); ov[`cando_${i + 1}.mark`] = '✓'; });
    const st8 = steps.map(s => Object.assign({}, s)); while (st8.length > 8) { let k = 0, best = Infinity;   // QC F05: không cắt bỏ bước cuối (Tổng kết, Dặn dò)
      for (let i = 0; i < st8.length - 1; i++) { const m = (st8[i].min || 0) + (st8[i + 1].min || 0); if (m < best) { best = m; k = i; } }
      const a = st8[k], b = st8[k + 1]; st8.splice(k, 2, { name: a.name + ' · ' + b.name, min: a.min == null && b.min == null ? null : (a.min || 0) + (b.min || 0) }); }
    st8.forEach((s, i) => { ov[`step_${i + 1}.no`] = String(i + 1); ov[`step_${i + 1}.text`] = s.name; if (s.min != null) ov[`step_${i + 1}.min`] = s.min + "'"; });
    if (steps.length > 8) warns.push(`Timeline có ${steps.length} bước – slide tổng quan gộp các bước ngắn kề nhau để hiện đủ trong 8 dòng.`);
    slides.push({ comp: 'Slide/Lesson Overview', data: sec(L.overview, ov), notes: NOTE({ t: s5row['Tự kiểm – tổng phút'] ? `Cả buổi ${S(s5row['Tự kiểm – tổng phút'])} phút` : '', g: ['Đọc mục tiêu, hỏi lớp đã biết gì về chủ đề.', ...sentences(info['Mục tiêu bài'] || s5row['Mục tiêu bài']), 'Lộ trình: ' + steps.map(x => x.name + (x.min != null ? ` (${x.min}')` : '')).join(' → ')], l: [S(s5row['Lưu ý'])] }) });

    const vocabAll = tab(s6, /Từ vựng$/).filter(r => isB(r, buoi) && onPPT(r) && S(r['Từ']));
    const vocab = vocabAll.filter(r => !/^nâng cao$/i.test(S(r['Nhóm'])));   // QC F07: slide chỉ lấy từ Nền tảng / Bắt buộc; từ Nâng cao vào sách + app
    if (vocabAll.length > vocab.length) warns.push(`${vocabAll.length - vocab.length} từ nhóm Nâng cao chỉ đưa vào sách / app, không lên slide (F07).`);
    const grammar = tab(s6, /Ngữ pháp$/).filter(r => isB(r, buoi) && onPPT(r));
    const pron = tab(s6, /Phát âm/).filter(r => isB(r, buoi) && onPPT(r)).map(r => { const c = s => /\s/.test(s) ? s.replace(/^[a-zà-ỹđ]/, x => x.toUpperCase()) : s; return Object.assign({}, r, { 'Chữ / âm': c(S(r['Chữ / âm'])), 'Bảng chữ / nhóm âm': c(S(r['Bảng chữ / nhóm âm'])) }); });
    const speak = tab(s6, /Mẫu câu/).filter(r => isB(r, buoi) && onPPT(r) && S(r['Câu']));
    const extra = tab(s6, /Ngoài kiến thức/).filter(r => isB(r, buoi) && onPPT(r));
    let curG = null;   // dòng "Hướng dẫn giảng dạy" (S5) của bước đang dựng → ghi chú giảng của slide chuyển mục
    const gNote = (g, t) => g ? { t, g: [S(g['Mục tiêu']) ? 'Mục tiêu: ' + S(g['Mục tiêu']) : '', ...S(g['Cách triển khai từng bước']).split(/\n+|(?<=\.)\s+(?=\d+\.\s)/).map(S).filter(Boolean)], l: [S(g['GV chuẩn bị trước']) ? 'Chuẩn bị: ' + S(g['GV chuẩn bị trước']) : '', S(g['Sai lầm hay gặp']) ? 'Sai lầm hay gặp: ' + S(g['Sai lầm hay gặp']) : '', S(g['Lưu ý'])] } : null;
    // NỘI DUNG THEO S5 cho bước không có dữ liệu S6: "1. Làm quen (8'): …  2. …" → slide Các bước hoạt động (tên bước, phút, ý chính)
    const actSteps = (st, label) => { const g = st.g; if (!g || !(root.PLS_TPL && root.PLS_TPL.slides['Slide/Activity Steps'])) return false;
      const raw = S(g['Cách triển khai từng bước']); if (!raw) return false;
      const parts = raw.split(/(?:^|\n|\s)(?=\d+\.\s)/).map(S).filter(x => /^\d+\.\s/.test(x));
      const items = parts.map(x => { x = x.replace(/^\d+\.\s*/, ''); const m = x.match(/^(.{2,60}?)\s*\((\d+)['’]?\)\s*:\s*([\s\S]*)$/) || x.match(/^(.{2,60}?)\s*:\s*([\s\S]*)$/);
        let name = m ? m[1] : '', min = m && m.length === 4 ? m[2] : '', text = m ? m[m.length - 1] : x; if (!min) { const mm = text.match(/\((\d+)['’]\)\s*\.?\s*$/); if (mm) { min = mm[1]; text = text.replace(mm[0], ''); } }
        const first = (text.split(/(?<=[.;])\s+/)[0] || text).trim().replace(/[;,:]\s*$/, ''); return { name: name || first.slice(0, 50), min, text: name ? (first.length > 150 ? first.slice(0, 147).replace(/\s+\S*$/, '') + '…' : first) : '' }; });
      if (!items.length) return false;
      for (const [ci, part] of chunk(items, 5).entries()) { const d = { title: st.name + (ci ? ` (${ci + 1})` : ''), 'goal.label': 'Mục tiêu', goal: ci ? '' : S(g['Mục tiêu']) };
        part.forEach((x, k) => { d[`st_${k + 1}.no_box.no`] = String(ci * 5 + k + 1); d[`st_${k + 1}.name`] = x.name; d[`st_${k + 1}.min`] = x.min ? x.min + ' phút' : ''; d[`st_${k + 1}.text`] = x.text; });
        slides.push({ comp: 'Slide/Activity Steps', data: sec(label || L.overview, d), notes: NOTE(Object.assign({ t: st.min != null ? st.min + ' phút' : '' }, gNote(g) || {})) }); }
      return true; };
    const divider = (title, sub, nt) => slides.push({ comp: 'Slide/Section', data: { 'section.title': title, 'section.sub': sub || '' }, notes: NOTE(Object.assign({ g: [`Chuyển sang phần: ${title}.`] }, gNote(curG) || {}, nt || {})) });
    const used = new Set(); let state_testAns = null;
    const T5 = (re) => { const b = s5 || {}; const k = Object.keys(b).find(n => re.test(n)); return k ? b[k] : []; };
    const uc = t => t.charAt(0).toUpperCase() + t.slice(1), lc = t => t.charAt(0).toLowerCase() + t.slice(1);
    // ĐỢT 4 (24/10): KHỞI ĐỘNG – câu hỏi tiếng Anh trong hướng dẫn Mở đầu / Warm-up (S5) + câu hỏi mẫu của phần Nói; cần ≥ 2 câu
    const leadIn = () => {
      if (!(root.PLS_TPL && root.PLS_TPL.slides['Slide/Lead In'])) return;
      const qs = [], seen = new Set(), add = (de, vi) => { de = S(de).replace(/^[“"]|[”"]$/g, ''); const k = de.toLowerCase(); if (de.length < 8 || de.length > 90 || seen.has(k)) return; seen.add(k); qs.push({ de, vi: S(vi) }); };
      T5(/Hướng dẫn giảng dạy/).filter(r => isB(r, buoi) && /mở đầu|warm|khởi động/i.test(S(r['Hoạt động']))).forEach(r => (S(r['Cách triển khai từng bước']).match(/[A-Z][A-Za-z ,'’-]{3,80}\?/g) || []).forEach(q => add(q, '')));
      speak.filter(r => /\?\s*$/.test(S(r['Câu']))).forEach(r => add(r['Câu'], r['Nghĩa']));
      if (qs.length < 2) return;
      const d = { title: 'Khởi động: ' + topic, kicker: 'Thảo luận theo cặp – trả lời bằng tiếng Anh', 'img:img': name };
      for (let i = 1; i <= 3; i++) { const q = qs[i - 1]; d[`q_${i}.no`] = q ? String(i) : ''; d[`q_${i}.de`] = q ? q.de : ''; d[`q_${i}.vi`] = q ? q.vi : ''; }
      slides.push({ comp: 'Slide/Lead In', data: sec(L.warm || L.overview, d), notes: NOTE({ g: ['Cho HV xem ảnh, đoán chủ đề buổi học.', 'HV hỏi – đáp theo cặp 2 phút, gọi 2–3 cặp chia sẻ.', ...qs.slice(0, 3).map(q => q.de)], l: ['Chưa sửa lỗi ở bước này – chỉ khơi gợi.'] }) });
    };
    const hasWarm = steps.some(x => /warm|khởi động/i.test(x.name));

    for (const st of steps) {
      const n = st.name.toLowerCase(); const mins = st.min != null ? `${st.min} phút` : ''; const T = mins; curG = st.g || null;
      if (/mở đầu/.test(n)) { if (!hasWarm && !used.has('lead')) { used.add('lead'); leadIn(); } continue; }
      if (/từ vựng/.test(n) && !used.has('vocab')) {
        used.add('vocab'); divider(st.name, `${vocab.length} từ · ${mins}`);
        const TPL = (root.PLS_TPL || {}).slides || {};
        // CHỮ + MINH HOẠ LỚN (mẫu bổ sung): 3–5 từ cùng giá trị cột "Hình minh hoạ" → 1 slide danh sách + ảnh chung; các từ này không vào lưới
        const picG = {}; vocab.forEach(r => { const k = S(r['Hình minh hoạ']); if (k) (picG[k] = picG[k] || []).push(r); });
        const pics = TPL['Slide/Vocab Picture'] ? Object.entries(picG).filter(([, rs]) => rs.length >= 3 && rs.length <= 5) : [], inPic = new Set(pics.flatMap(([, rs]) => rs));
        const grid = vocab.filter(r => !inPic.has(r));
        // ĐỢT 4: THẺ TỪ – tối đa 3 từ có câu ví dụ (ưu tiên từ có hình minh hoạ riêng) → 1 từ / slide trước lưới ôn
        if (TPL['Slide/Vocab Card']) grid.filter(r => S(r['Ví dụ 1']) && S(r['Ví dụ 1']).length <= 80).sort((a, b) => !!S(b['Hình minh hoạ']) - !!S(a['Hình minh hoạ'])).slice(0, 3).forEach(r => {
          slides.push({ comp: 'Slide/Vocab Card', data: sec(L.vocab, { title: '', word: S(r['Từ']), ipa: S(r['Phiên âm / cách đọc']) ? '/' + S(r['Phiên âm / cách đọc']).replace(/^\/|\/$/g, '') + '/' : '', pos: S(r['Loại từ']), mean: S(r['Nghĩa']), exde: S(r['Ví dụ 1']), exvi: S(r['Nghĩa ví dụ 1']), 'img:img': S(r['Hình minh hoạ']) || S(r['Từ']) }),
            notes: NOTE({ g: [`Đọc mẫu “${S(r['Từ'])}” 2 lần, cả lớp nhắc lại.`, `Ví dụ: ${S(r['Ví dụ 1'])} – ${S(r['Nghĩa ví dụ 1'])}`, 'Gọi 2 HV đặt câu khác với từ này.'], l: [S(r['Cách dùng']), S(r['Trọng âm']) ? 'Trọng âm: ' + S(r['Trọng âm']) : ''] }) }); });
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
        // ĐỢT 4: ĐIỀN TỪ CÓ HỘP TỪ – gom câu có chỗ trống mà đáp án 1–2 từ của CẢ mục ngữ pháp (≥ 3 câu) → 1 slide ôn cuối mục (tối đa 5 câu)
        const LT = ['A', 'B', 'C', 'D'], ansOf = r => { const a = S(r['Đáp án']).toUpperCase().charAt(0); return LT.includes(a) ? S(r[a]) : ''; };
        const gCodes = new Set(grammar.map(g => S(g['Mã mục'])));
        const bankOk = gq.filter(r => isB(r, buoi) && gCodes.has(S(r['Mã ngữ pháp'])) && /_{2,}|…|\.\.\./.test(S(r['Câu hỏi'])) && ansOf(r) && ansOf(r).split(/\s+/).length <= 2 && ansOf(r).length <= 16 && !/\//.test(ansOf(r)));
        const bankUse = A && bankOk.length >= 3 && root.PLS_TPL && root.PLS_TPL.slides['Slide/Gap Fill Bank'] ? bankOk.slice(0, 5) : [];
        for (const g of grammar) {
          const tn = S(g['Tên ngữ pháp']), ng = S(g['Nghĩa']);
          const same = ng && tn.toLowerCase().includes(ng.toLowerCase().replace(/\s*\(.*$/, '').slice(0, 12));
          const title = same || /\(/.test(tn) ? tn : [tn, ng].filter(Boolean).join(' – ');
          const gNote = NOTE({ g: [title, ...S(g['Cấu trúc (công thức)']).split('\n'), ...S(g['Cách sử dụng']).split('\n'), [1, 2, 3].map(i => S(g['Ví dụ ' + i])).filter(Boolean).length ? 'Đọc ví dụ, hỏi HV chỉ ra cấu trúc trong câu.' : ''],
            l: [...S(g['Lưu ý']).split('\n'), S(g['Dấu hiệu nhận biết']) ? 'Dấu hiệu nhận biết: ' + S(g['Dấu hiệu nhận biết']) : '', S(g['So sánh với ngữ pháp đã học']) ? 'So với bài đã học: ' + S(g['So sánh với ngữ pháp đã học']) : ''] });
          if (A) slides.push({ auto: 'grammar', section: L.grammar, g: A.parseGrammar(g, title), notes: gNote });
          else { const d = { title, 'rule': S(g['Cấu trúc (công thức)']).split('\n')[0] }; [1, 2, 3].forEach(i => { if (S(g['Ví dụ ' + i])) { d[`ex_${i}.de`] = S(g['Ví dụ ' + i]); d[`ex_${i}.vi`] = S(g['Nghĩa ví dụ ' + i]); } }); slides.push({ comp: 'Slide/Grammar Rule', data: sec(L.grammar, d), notes: gNote }); }
          const exs = [1, 2, 3].map(i => ({ de: S(g['Ví dụ ' + i]), vi: S(g['Nghĩa ví dụ ' + i]) })).filter(e => e.de);
          const uses = S(g['Cách sử dụng']).split('\n').map(t => S(t).replace(/^\d+[.)]\s*/, '')).filter(Boolean).map(t => S(t.split(/:\s/)[0]).replace(/[.;]$/, ''));
          // ĐỢT 4: DÒNG THỜI GIAN cho các thì (nhận theo tên ngữ pháp)
          const TK = [[/past perfect/i, 'pastperfect'], [/past continuous/i, 'pastcont'], [/present perfect/i, 'perfect'], [/past simple/i, 'past'], [/dùng cho tương lai/i, 'future'], [/present simple vs|vs present continuous/i, ''], [/present continuous/i, 'now'], [/present simple/i, 'habit'], [/be going to/i, 'going'], [/^will\b/i, 'future']];
          const tk = (TK.find(([re]) => re.test(tn)) || [])[1];
          if (tk && exs.length && root.PLS_TPL && root.PLS_TPL.slides['Slide/Tense Timeline'])
            slides.push({ comp: 'Slide/Tense Timeline', data: sec(L.grammar, { title: tn.replace(/\s*\(.*\)$/, '') + ' – trên dòng thời gian', _kind: tk, label: 'Cấu trúc', l_past: 'Quá khứ', l_now: 'Bây giờ', l_fut: 'Tương lai', rule: S(g['Cấu trúc (công thức)']).split('\n').map(S).filter(Boolean).slice(0, 2).map(t => t.length <= 34 ? t.replace(/ /g, '\u00a0') : t).join('\n'), use: uses[0] ? uc(uses[0]) : '', de: exs[0].de, vi: exs[0].vi }),
              notes: NOTE({ g: ['Vẽ trục thời gian lên bảng, chỉ vị trí hành động so với BÂY GIỜ.', `Ví dụ: ${exs[0].de}`], l: [S(g['Dấu hiệu nhận biết']) ? 'Dấu hiệu: ' + S(g['Dấu hiệu nhận biết']) : ''] }) });
          // ĐỢT 4: KIỂM TRA HIỂU – câu ví dụ ghép với NGHĨA (lấy đúng từ dữ liệu); câu 2 ghép nghĩa của ví dụ khác → Sai. Không tự suy luận cách dùng (tránh đáp án sai)
          const exv = exs.filter(e => e.vi);
          if (exv.length >= 2 && root.PLS_TPL && root.PLS_TPL.slides['Slide/CCQ']) {
            const short = tn.replace(/\s*\(.*\)$/, ''), d = { title: 'Đúng hay sai? – ' + (short.length > 40 ? short.slice(0, 40).replace(/\s+\S*$/, '') + '…' : short) }, why = [];
            for (let i = 1; i <= 4; i++) { const e = exv[i - 1]; if (!e) { ['no', 'text', 'ans.val'].forEach(k => { d[`c_${i}.${k}`] = ''; }); continue; }
              const wrong = i === 2 ? exv.find(x => x !== e && x.vi !== e.vi) : null;
              d[`c_${i}.no`] = String(i); d[`c_${i}.text`] = `“${e.de}” nghĩa là: ${(wrong || e).vi.replace(/[.!?]$/, '')}?`; d[`c_${i}.ans.val`] = wrong ? 'Sai' : 'Đúng'; why.push(`${i}. ${wrong ? 'Sai – đúng là: ' + e.vi : 'Đúng'}`); }
            slides.push({ comp: 'Slide/CCQ', data: sec(L.grammar, d), notes: NOTE({ g: ['Đọc từng câu, cả lớp giơ tay Đúng / Sai rồi mới bấm hiện đáp án.', 'Hỏi thêm: dấu hiệu nào trong câu cho em biết?', ...why] }) });
          }
          let qs = gq.filter(r => S(r['Mã ngữ pháp']) && S(r['Mã ngữ pháp']) === S(g['Mã mục']) && isB(r, buoi));
          qs = qs.filter(r => !bankUse.includes(r));   // câu đã vào slide hộp từ cuối mục
          if (A && qs.length) { const ex = A.exercises(qs, L.practice || L.grammar, no); no = ex.next; slides.push(...ex.groups); keys.push(...ex.keys); }
        }
        if (bankUse.length) { const use = bankUse, d = { title: 'Ôn tập: điền từ vào chỗ trống', label: 'Từ gợi ý:' }, ans = use.map(ansOf);
          const dis = [...new Set(use.flatMap(r => LT.map(x => S(r[x]))).filter(w => w && !ans.some(a => a.toLowerCase() === w.toLowerCase()) && w.split(/\s+/).length <= 2 && w.length <= 16))].slice(0, Math.max(0, Math.min(2, 8 - ans.length)));
          const bank = [...new Set([...ans, ...dis])].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())).slice(0, 8);
          for (let i = 1; i <= 8; i++) d[`chip_${i}.text`] = bank[i - 1] || '';
          for (let i = 1; i <= 5; i++) { const r = use[i - 1]; if (!r) { ['no', 'text', 'ans.val'].forEach(k => { d[`s_${i}.${k}`] = ''; }); continue; }
            d[`s_${i}.no`] = no + '.'; d[`s_${i}.text`] = S(r['Câu hỏi']).replace(/^\[[^\]]{1,80}\]\s*/, '').replace(/^[^:]{0,60}:\s*/, '').replace(/_{2,}|…|\.\.\./, '_____'); d[`s_${i}.ans.val`] = ans[i - 1];
            keys.push([no, ans[i - 1], S(r['Giải thích'])]); no++; }
          slides.push({ comp: 'Slide/Gap Fill Bank', data: sec(L.practice || L.grammar, d), notes: NOTE({ g: ['HV tự điền trong 2 phút, đổi bài với bạn bên cạnh, rồi bấm hiện từng đáp án.', ...use.map((r, i) => `${S(r['Câu hỏi'])} → ${ans[i]}`)] }) }); }
        if (A && keys.length) slides.push(...A.answerSlides(keys, L.answers || L.grammar, 'Đáp án luyện tập ngữ pháp'));
      } else if (/phát âm|bảng chữ/.test(n) && !used.has('pron')) {
        used.add('pron'); if (pron.length) divider(st.name, [mins, `${pron.length} âm`].filter(Boolean).join(' · '));
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
      } else if (/nói|mẫu câu|giao tiếp|hội thoại/.test(n) && !used.has('speak:' + n)) {
        used.add('speak:' + n); used.add('speak'); divider(st.name, mins);
        // timeline có cả bước "Mẫu câu" và bước "Hội thoại" riêng → mỗi bước chỉ lấy đúng loại của mình
        const splitDl = steps.some(x => /hội thoại/i.test(x.name)) && steps.some(x => /mẫu câu|giao tiếp|nói/i.test(x.name) && !/hội thoại/i.test(x.name));
        const mine = !splitDl ? speak : /hội thoại/.test(n) ? speak.filter(r => /hội thoại/i.test(S(r['Loại']))) : speak.filter(r => !/hội thoại/i.test(S(r['Loại'])));
        // nhóm theo tình huống; "… (câu 1)", "… (câu 2)" gộp chung; dòng không ghi tình huống → nhóm theo Loại (Mẫu câu / Luyện đọc / Luyện viết)
        const groups = {}; mine.forEach(r => { const t = S(r['Chủ đề / tình huống']).replace(/^none$/i, '').replace(/\s*\(câu\s*\d+\)\s*$/i, ''); const k = t || S(r['Loại']) || S(r['Mã bài']); (groups[k] = groups[k] || []).push(r); });
        for (const [full, all] of Object.entries(groups)) {
          // tình huống dài kiểu "Trả lời theo lịch tour cho sẵn: Monday 8:00 …" → tiêu đề = phần trước dấu hai chấm; phần thông tin lên 1 slide Key Point riêng (không để tiêu đề 3 dòng)
          const cm = full.length > 60 && full.match(/^([^:]{4,60}):\s*(.+)$/), title = cm ? cm[1].trim() : full;
          if (cm) slides.push({ comp: 'Slide/Key Point', data: sec(L.speak, Object.assign({ title, point: cm[2].trim(), note: '' }, Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8].map(i => ['chip_' + i, ''])))), notes: NOTE({ g: ['Cho HV đọc thông tin trước khi luyện nói: ' + cm[2].trim()] }) });
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
        // ĐỢT 4: TỰ ĐÁNH GIÁ cuối buổi (thang 3/2/1) theo mục tiêu bài
        const cando = sentences(info['Mục tiêu bài'] || s5row['Mục tiêu bài']).map(t => uc(S(t).replace(/^học viên\s+(sẽ\s+)?/i, '').replace(/[.;]$/, ''))).filter(Boolean).slice(0, 4);
        if (cando.length >= 2 && root.PLS_TPL && root.PLS_TPL.slides['Slide/Self Check']) {
          const d = { title: 'Tự đánh giá: sau buổi học, mình có thể…', hint: 'Khoanh mức của bạn:', scale: '3 = làm tốt  ·  2 = tạm được  ·  1 = cần ôn thêm' }; for (let i = 1; i <= 4; i++) { d[`g_${i}.no`] = cando[i - 1] ? String(i) : ''; d[`g_${i}.text`] = cando[i - 1] || ''; ['3', '2', '1'].forEach(v => { d[`g_${i}.dot_${v}.v`] = cando[i - 1] ? v : ''; }); }
          slides.push({ comp: 'Slide/Self Check', data: sec(L.summary, d), notes: NOTE({ g: ['HV tự khoanh 3 / 2 / 1 cho từng mục (vào vở hoặc giơ ngón tay).', 'Mục nào nhiều HV chọn 1 → ôn lại 2 phút trước khi dặn dò.'] }) });
        }
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
        for (const x of extra) slides.push(S(x['Tiêu đề']).length > 30   // câu fact dài không nhét vào slide chuyển mục 1 dòng (tràn chữ – lỗi người dùng báo 24/10)
          ? { comp: 'Slide/Key Point', data: sec(L.extra || L.speak, Object.assign({ title: S(x['Loại']) || 'Mở rộng', point: S(x['Tiêu đề']), note: S(x['Nội dung']) || (S(x['Kiến thức kết hợp']) ? 'Kết hợp: ' + S(x['Kiến thức kết hợp']) : '') }, Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8].map(i => ['chip_' + i, ''])))),
              notes: NOTE({ g: [S(x['Tiêu đề']), S(x['Nội dung'])], l: [S(x['Nguồn']) ? 'Nguồn: ' + S(x['Nguồn']) : ''] }) } : { comp: 'Slide/Section', data: { 'section.title': S(x['Tiêu đề']), 'section.sub': S(x['Loại']) }, notes: NOTE({ g: [S(x['Tiêu đề']), S(x['Nội dung'])], l: [S(x['Kiến thức kết hợp']) ? 'Kết hợp: ' + S(x['Kiến thức kết hợp']) : '', S(x['Nguồn']) ? 'Nguồn: ' + S(x['Nguồn']) : ''] }) });
      } else if (/dặn dò/.test(n) && used.has('dd')) {
        continue;   // đã gộp vào slide Tổng kết + Dặn dò
      } else if (/dặn dò/.test(n)) {
        const items = sentences(s5row['Dặn dò']).slice(0, 3);
        if (items.length) { const d = { 'title': 'Dặn dò', 'deadline': `Trước buổi ${Number(buoi) + 1}` }; items.forEach((t, i) => { d[`item_${i + 1}.no`] = String(i + 1); d[`item_${i + 1}.text`] = t; }); slides.push({ comp: 'Slide/Homework', data: sec(L.homework, d), notes: NOTE({ g: ['Đọc từng việc cần làm, nhắc hạn nộp trước buổi ' + (Number(buoi) + 1) + '.', ...items], l: [S(s5row['Tài nguyên khác (PDF, audio PDF)']) ? 'Tài nguyên: ' + S(s5row['Tài nguyên khác (PDF, audio PDF)']) : ''] }) }); }
        else divider(st.name, mins);
      } else if (/sửa btvn/.test(n) && !used.has('btvn') && root.PLS_AUTO) {
        // SỬA BTVN: bài tập về nhà của buổi trước (Lên PPT = Có), bỏ dạng không trình chiếu được (thu âm, flashcard, viết tay)
        used.add('btvn'); const A = root.PLS_AUTO;
        const noQ = st.g && /không chiếu câu hỏi/i.test(S(st.g['Lưu ý']) + ' ' + S(st.g['Cách triển khai từng bước']));   // S5 dặn không chiếu câu hỏi BTVN → theo S5
        const rows = noQ ? [] : tab(s6, /BTVN/).filter(r => isB(r, Number(buoi) - 1) && onPPT(r));
        const ex = A.exercises(rows, L.check || L.homework, 1);
        divider(st.name, [mins, ex.groups.length ? `BTVN buổi ${Number(buoi) - 1} · ${ex.next - 1} câu` : noQ ? 'chữa lỗi chung theo thống kê app' : 'không có BTVN trình chiếu'].filter(Boolean).join(' · '));
        slides.push(...ex.groups); if (!ex.groups.length) actSteps(st, L.check || L.homework);
        if (ex.keys.length) slides.push(...A.answerSlides(ex.keys, L.answers || L.homework, `Đáp án BTVN buổi ${Number(buoi) - 1}`));
      } else if (/^nghe/.test(n) && !used.has('listen') && root.PLS_AUTO) {
        // NGHE: mỗi bài (Mã bài) → câu hỏi trước khi nghe (Listening) + trắc nghiệm + lời bài (hội thoại); đáp án cuối mục
        used.add('listen'); const A = root.PLS_AUTO;
        const lines = tab(s6, /^S6-Nghe$/).filter(r => isB(r, buoi) && onPPT(r) && S(r['Câu'])), qs = tab(s6, /Nghe câu hỏi/).filter(r => isB(r, buoi) && onPPT(r));
        const codes = [...new Set(lines.map(r => S(r['Mã bài'])).concat(qs.map(r => S(r['Mã bài']))))].filter(Boolean);
        divider(st.name, [mins, codes.length ? `${codes.length} bài nghe` : 'thực hiện trên app'].filter(Boolean).join(' · '));
        let no = 1; const keys = [];
        for (const u of units(codes, lines, qs, 'Tiêu đề bài nghe')) { const c = u.c;
          const ls = u.ls.slice().sort((a, b) => (+a['Câu số'] || 0) - (+b['Câu số'] || 0)), q = u.q;
          const r0 = ls[0] || {}; const title = [S(r0['Tiêu đề bài nghe']), S(r0['Nghĩa tiêu đề'])].filter(Boolean).join(' – ') || c;
          if (q.length) { const d = { track: title, task: 'Nghe và trả lời câu hỏi.', 'task.vi': '', _audio: S(r0['File audio']) }; let tot = 0; q.map(x => S(x['Câu hỏi']).replace(/^\[[^\]]{1,80}\]\s*/, '')).filter((t, i) => i < 4 && (i === 0 || (tot += t.length) <= 260) && (i > 0 || (tot = t.length))).forEach((t, i) => { d[`q_${i + 1}.no`] = String(i + 1); d[`q_${i + 1}.text`] = t; }); /* câu hỏi trước khi nghe: tối đa 4 câu, ≤ 260 ký tự cho khỏi co chữ */ slides.push({ comp: 'Slide/Listening', data: sec(L.listen || L.speak, d) }); }
          if (q.length) { const ex = A.exercises(q, L.listen || L.speak, no, 'Nghe đoạn ghi âm rồi chọn đáp án đúng.'); no = ex.next; slides.push(...ex.groups); keys.push(...ex.keys); }
          for (const g of segs(ls, 'Tiêu đề bài nghe', (a, b) => (+a['Câu số'] || 0) - (+b['Câu số'] || 0))) { const r1 = g[0] || {}, t1 = [S(r1['Tiêu đề bài nghe']), S(r1['Nghĩa tiêu đề'])].filter(Boolean).join(' – ') || title;
            slides.push({ auto: 'dlg', section: L.listen || L.speak, audio: S(r1['File audio']), situation: 'Lời bài nghe: ' + t1, lines: g.map(r => ({ sp: S(r['Vai / nhân vật']) || '–', de: S(r['Câu']), vi: S(r['Nghĩa']) })),
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
        for (const u of units(codes, lines, qs, 'Tiêu đề bài đọc')) { const c = u.c;
          const ls = u.ls.slice().sort((a, b) => ((+a['Đoạn'] || 0) - (+b['Đoạn'] || 0)) || ((+a['Câu số'] || 0) - (+b['Câu số'] || 0))), q = u.q;
          const r0 = ls[0] || {}; const title = [S(r0['Tiêu đề bài đọc']), S(r0['Nghĩa tiêu đề'])].filter(Boolean).join(' – ') || c;
          for (const g of segs(ls, 'Tiêu đề bài đọc', (a, b) => ((+a['Đoạn'] || 0) - (+b['Đoạn'] || 0)) || ((+a['Câu số'] || 0) - (+b['Câu số'] || 0)))) { const r1 = g[0] || {}, title = [S(r1['Tiêu đề bài đọc']), S(r1['Nghĩa tiêu đề'])].filter(Boolean).join(' – ') || c, ls = g;
          const paras = []; let cur = null; for (const r of ls) { const p = String(r['Đoạn'] || 1); if (!cur || cur.p !== p) { cur = { p, t: [] }; paras.push(cur); } cur.t.push(S(r['Câu'])); }
          if (paras.length) slides.push({ auto: 'read', section: L.read || L.speak, tag: 'Reading', title, paras: paras.map(x => x.t.join(' ')), notes: NOTE({ t: T, g: [`Bài đọc: ${title}.`, 'Cho HV đọc thầm 2–3 phút, gạch chân từ mới; sau đó đọc mẫu từng đoạn.', ...ls.slice(0, 12).map(r => `${S(r['Câu'])} – ${S(r['Nghĩa'])}`)], l: ['Hỏi ý chính từng đoạn trước khi chuyển sang câu hỏi.'] }) }); }
          if (q.length) { const ex = A.exercises(q, L.read || L.speak, no, 'Đọc bài rồi chọn đáp án đúng.'); no = ex.next; slides.push(...ex.groups); keys.push(...ex.keys); }
        }
        if (keys.length) slides.push(...A.answerSlides(keys, L.answers || L.read, 'Đáp án bài đọc'));
      } else if (/kiểm tra|^test\b/.test(n) && !/sửa/.test(n) && !used.has('test') && root.PLS_AUTO) {
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
        divider(st.name, [mins, `${qs.length} câu`].filter(Boolean).join(' · '));   // mỗi bước S5 đều có slide chuyển mục (đúng thứ tự S5)
        slides.push({ comp: 'Slide/Test Intro', data: sec(L.test || L.homework, d), notes: NOTE({ t: `${d.total_min || ''} phút`.trim(), g: [`Giới thiệu đề: ${qs.length} câu, ${parts.length} phần (${parts.map(p => p.k).join(', ')}).`, 'Nhắc HV cất tài liệu, làm bài độc lập.'], l: ['Báo thời gian khi còn 5 phút.'] }) });
        const ex = A.exercises(qs, L.test || L.homework, 1); slides.push(...ex.groups);
        const ans = A.answerSlides(ex.keys, L.answers || L.test, 'Đáp án ' + (d.title || 'kiểm tra'));
        if (steps.some(x => /sửa (kiểm tra|kt)/i.test(x.name))) state_testAns = ans; else slides.push(...ans);
      } else if (/sửa (kiểm tra|kt)/.test(n) && typeof state_testAns !== 'undefined' && state_testAns && state_testAns.length) {
        divider(st.name, mins); slides.push(...state_testAns); state_testAns = null;
      } else if (/hán tự/.test(n) && !used.has('hanzi')) {
        // HÁN TỰ (S6-Hán tự): thẻ chữ – âm đọc hiện sẵn, nghĩa hiện khi bấm (4 chữ/slide); ≥ 3 chữ cùng bộ → hoạt động "Tìm bạn cho bộ thủ"
        used.add('hanzi'); const hz = tab(s6, /Hán tự$/).filter(r => isB(r, buoi) && onPPT(r) && S(r['Hán tự']));
        divider(st.name, [mins, hz.length ? `${hz.length} chữ` : ''].filter(Boolean).join(' · '));
        const ACT = root.PLS_ACT;
        if (hz.length && ACT) {
          slides.push(...ACT.plan('vocab', { title: st.name.replace(/\s*\d+\s*phút/i, ''), instruction: 'Nhìn chữ – đọc to – đoán nghĩa', items: hz.map(r => ({ de: S(r['Hán tự']), ipa: S(r['Âm đọc']), vi: S(r['Nghĩa']) })) }, ['guess'], { section: L.pron || L.vocab }).map(x => Object.assign(x, { divider: false, time: T })));
          // (bỏ hoạt động "Tìm bạn cho bộ thủ" tự sinh – người dùng 28/10: chỉ đúng nội dung Excel)
        }
      } else if (/phản xạ/.test(n) && !used.has('reflex')) {
        // PHẢN XẠ PINYIN: âm tiết trong "Cách triển khai" của S5 (vd bā, pó, mǐ…) → bảng khoanh đọc nhanh; không có thì lấy ví dụ phát âm các buổi trước
        used.add('reflex'); divider(st.name, mins);
        const TONE = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/i;
        // chỉ nhận âm tiết pinyin hợp lệ (thanh mẫu + vận mẫu) – loại chữ Việt có dấu trong đoạn hướng dẫn (đó, và, nói…)
        const plain = w => w.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/v/g, 'ü');
        const SYL = /^(zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?(iang|iong|uang|ueng|ang|eng|ing|ong|ian|iao|uai|uan|üan|ai|ei|ao|ou|an|en|in|un|ün|ia|ie|iu|ua|uo|ui|üe|ue|er|a|o|e|i|u|ü)(r)?$/;
        const isPy = w => TONE.test(w) && !/[đơưăâêôạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i.test(w) && (SYL.test(plain(w)) || /^[a-zü]+$/.test(plain(w)) && plain(w).length >= 4 && plain(w).split(/(?=(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])[aeiouü])/).filter(Boolean).every(x => SYL.test(x)));
        let cells = [...new Set(S(st.g && st.g['Cách triển khai từng bước']).split(/[^A-Za-zÀ-ɏüÜ]+/).filter(w => w.length <= 8 && isPy(w)))];
        // chỉ dùng âm tiết ghi trong S5 của bước này (không kéo âm của buổi khác); không có → slide các bước S5
        if (!cells.length) actSteps(st, L.pron || L.vocab);
        if (cells.length && root.PLS_ACT) slides.push(...root.PLS_ACT.plan('pinyin', { cells: cells.slice(0, 48), title: st.name }, ['grid'], { section: L.pron || L.vocab }).map(x => Object.assign(x, { divider: false, time: T })));
      } else if (/ôn tập|ôn trước/.test(n) && !used.has('review:' + n)) {
        // ÔN TẬP BÀI CŨ: từ vựng 2 buổi trước → đoán nghĩa (4 thẻ/slide)
        used.add('review:' + n); divider(st.name, mins);
        actSteps(st, L.vocab);   // ÔN TẬP: đúng các bước ghi trong S5 (không tự kéo từ vựng buổi trước – người dùng 28/10)
      } else if (/văn hó?a|văn hoá/.test(n) && !used.has('culture')) {
        used.add('culture'); divider(st.name, mins);
        const cu = extra.filter(r => /văn hó?a|văn hoá/i.test(S(r['Loại']))); (cu.length ? cu : extra).slice(0, 4).forEach(x => slides.push({ comp: 'Slide/Key Point', data: sec(L.extra || L.speak, { title: S(x['Loại']) || 'Văn hoá', point: S(x['Tiêu đề']), note: S(x['Nội dung']) }), notes: NOTE({ g: [S(x['Tiêu đề']), S(x['Nội dung'])], l: [S(x['Nguồn']) ? 'Nguồn: ' + S(x['Nguồn']) : ''] }) }));
      } else {
        divider(st.name, [mins, /kiểm tra|btvn|nghe|đọc|hd app/.test(n) ? 'thực hiện trên app' : ''].filter(Boolean).join(' · '));
        if (!/cttt|khai giảng/i.test(n)) actSteps(st);   // nội dung lấy đúng từ S5 (HD App, …); Khai giảng: chỉ slide chuyển mục (người dùng 28/10)
        if (/warm|khởi động/.test(n) && !used.has('lead')) { used.add('lead'); leadIn(); }
      }
    }
    slides.push({ comp: 'Slide/End', data: { 'thanks.de': L.thanks, 'thanks.vi': 'Cảm ơn các bạn!' }, notes: NOTE({ g: ['Cảm ơn lớp, nhắc lại bài tập về nhà và hạn nộp.', S(s5row['Dặn dò'])], l: [S(s5row['Lưu ý'])] }) });
    const meta = { level: course['Cấp độ'] || '', no: Number(buoi), sessionType: S(info['Loại buổi']), title: name, course: course['Tên khoá'] || '' };
    // QC 24/10: nội dung S6 của buổi mà timeline S5 không có bước tương ứng → không lên slide; báo rõ thay vì bỏ im lặng
    [['vocab', vocab.length, 'Từ vựng', 'từ'], ['grammar', grammar.length, 'Ngữ pháp', 'điểm'], ['listen', tab(s6, /^S6-Nghe$/).filter(r => isB(r, buoi) && onPPT(r)).length, 'Nghe', 'dòng'], ['read', tab(s6, /^S6-Đọc$/).filter(r => isB(r, buoi) && onPPT(r)).length, 'Đọc', 'dòng']]
      .forEach(([k, n, nm, u]) => { if (n && !used.has(k)) warns.push(`S6 có ${n} ${u} ${nm} cho buổi ${buoi} nhưng timeline S5 không có bước “${nm}” – phần này chưa lên slide (thêm bước vào timeline hoặc đặt Lên PPT = Không).`); });
    return { spec: { brand, meta, lesson: `${course['Mã khoá'] || course['Tên khoá'] || 'Khoá'} · ${S(info['Tên buổi']) || 'Buổi ' + buoi}`, common, slides }, warns, counts: { vocab: vocab.length, grammar: grammar.length, pron: pron.length, speak: speak.length, steps: steps.length } };
  }
  function sessions(s6) { return tab(s6, /Khoá & bài|Khóa & bài/).filter(r => r['Buổi'] != null).map(r => ({ buoi: Number(r['Buổi']), name: S(r['Tên buổi']), type: S(r['Loại buổi']) })); }

  root.PLS_IMPORT = { readWorkbook, buildSpec, sessions, LABELS };
})(typeof window !== 'undefined' ? window : globalThis);
