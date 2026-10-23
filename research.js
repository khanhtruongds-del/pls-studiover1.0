// TAB NGHIÊN CỨU (người dùng chốt 23/10) – kiểu NotebookLM, chạy bằng Gemini (API key của người dùng, lưu trên máy):
//   Nguồn (PDF, ảnh, văn bản, link, Excel của trung tâm khác) → Trò chuyện theo nguồn (có trích dẫn) → Bảng so sánh
//   → Định hướng khung khóa (chốt phiên bản) → Soạn bài từng buổi đúng cột Excel S5/S6 → Mở ở tab Slide / Sách hoặc xuất Excel.
// Dữ liệu (nguồn, bảng, khung, bài đã soạn) lưu IndexedDB 'pls-research' của trình duyệt này. Không có máy chủ riêng.
(function (root) {
  const $ = q => document.querySelector(q);
  const TPL = root.PLS_RTPL || { s6: {}, s5: {} };
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const today = () => new Date().toISOString().slice(0, 10);
  const DEF_CRIT = ['Cấp độ đầu vào', 'Đầu ra cam kết', 'Số buổi', 'Phút / buổi', 'Sĩ số', 'Giáo trình dùng', 'Phương pháp', 'Tỉ lệ kỹ năng', 'Cách kiểm tra', 'Học phí'];
  const STEPS = [
    { id: 'chat', name: 'Trò chuyện', sub: 'Hỏi theo nguồn' },
    { id: 'cmp', name: 'So sánh', sub: 'Bảng có trích dẫn' },
    { id: 'dir', name: 'Định hướng', sub: 'Khung khóa học' },
    { id: 'les', name: 'Soạn bài', sub: 'Ra Excel S5/S6' }];

  // ---------- lưu trữ ----------
  const DB = (() => { let dbp;
    const open = () => dbp || (dbp = new Promise((res, rej) => { const q = indexedDB.open('pls-research', 1); q.onupgradeneeded = () => q.result.createObjectStore('proj', { keyPath: 'id' }); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }));
    const run = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction('proj', mode); const q = fn(t.objectStore('proj')); t.oncomplete = () => res(q && 'result' in q ? q.result : undefined); t.onerror = () => rej(t.error); }); };
    return { all: () => run('readonly', s => s.getAll()), get: id => run('readonly', s => s.get(id)), put: p => run('readwrite', s => s.put(p)), del: id => run('readwrite', s => s.delete(id)) }; })();
  const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }, set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} } };
  const newProj = name => ({ id: uid('p'), name: name || 'Khóa mới', at: Date.now(), sources: [], criteria: DEF_CRIT.slice(), cells: {}, centers: [], chat: [], notes: [],
    brief: { lang: '', level: '', audience: '', sessions: 12, minutes: 90, extra: '' }, outline: null, lessons: {}, books: { s6: {}, s5: {} }, log: [] });
  let P = null, projects = [], loaded = false, cur = 0, mode = 'intro', busy = null, saveT = 0;
  const save = () => { if (!P) return; P.at = Date.now(); clearTimeout(saveT); saveT = setTimeout(() => DB.put(P).catch(e => console.warn('[PLS] lưu nghiên cứu lỗi', e)), 250); };
  const log = t => { if (P) { P.log.push({ t, at: Date.now() }); P.log = P.log.slice(-60); } };
  async function load() {
    if (loaded) return; loaded = true;
    try { projects = await DB.all(); } catch (e) { projects = []; }
    projects.sort((a, b) => b.at - a.at);
    const want = LS.get('pls.rs.cur'); P = projects.find(p => p.id === want) || projects[0] || null;
    if (!P) { P = newProj('Khóa đầu tiên'); projects = [P]; save(); }
    LS.set('pls.rs.cur', P.id);
  }

  // ---------- GEMINI ----------
  const AI = {
    key: () => LS.get('pls.gemini.key', ''), model: () => LS.get('pls.gemini.model', ''), lite: () => LS.get('pls.gemini.lite', ''),
    BASE: 'https://generativelanguage.googleapis.com/v1beta',
    // DÙNG MIỄN PHÍ (người dùng chốt 23/10): 2 model – Flash (tốt hơn, gói miễn phí ~20 lượt/ngày) cho Định hướng + Soạn bài,
    // Flash-Lite (~500 lượt/ngày) cho Trò chuyện + So sánh; model nào hết lượt (429) thì tự chuyển sang model còn lại.
    // Danh sách model đổi theo thời gian → hỏi API, chọn bản số cao nhất, không ghi cứng.
    async pick(key) {
      const r = await fetch(`${AI.BASE}/models?pageSize=200`, { headers: { 'x-goog-api-key': key } });
      if (!r.ok) throw new Error(r.status === 400 || r.status === 403 ? 'Key không hợp lệ' : 'Không kết nối được Gemini (' + r.status + ')');
      const ns = ((await r.json()).models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent')).map(m => m.name.replace(/^models\//, ''));
      const ver = n => parseFloat(n.split('-')[1]) || 0, top = re => ns.filter(n => re.test(n)).sort((a, b) => ver(b) - ver(a) || a.length - b.length)[0] || '';
      const best = top(/^gemini-[\d.]+-flash$/) || top(/^gemini-[\d.]+-flash-preview$/), lite = top(/^gemini-[\d.]+-flash-lite$/) || top(/^gemini-[\d.]+-flash-lite-preview$/);
      if (!best && !lite) throw new Error('Key này không có model Gemini Flash nào');
      return { best: best || lite, lite: lite || best };
    },
    day: () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }),   // lượt/ngày của Google reset theo giờ Mỹ (Thái Bình Dương)
    use() { let u = {}; try { u = JSON.parse(LS.get('pls.gemini.use', '{}')); } catch (e) {} return u.day === AI.day() ? u : { day: AI.day(), m: {} }; },
    count(model) { const u = AI.use(); u.m[model] = (u.m[model] || 0) + 1; LS.set('pls.gemini.use', JSON.stringify(u)); },
    usage() { const u = AI.use(), b = AI.model(), l = AI.lite(); return b === l ? `${u.m[b] || 0} lượt hôm nay` : `Flash ${u.m[b] || 0} · Lite ${u.m[l] || 0} hôm nay`; },
    async call({ sys, contents, json, tools, maxTokens, tier }) {
      const key = AI.key(), best = AI.model(), lite = AI.lite() || best; if (!key || !best) throw new Error('Chưa kết nối Gemini – bấm "Kết nối AI" ở cột trái');
      const body = { contents, generationConfig: { temperature: 0.3, maxOutputTokens: maxTokens || 8192 } };
      if (sys) body.systemInstruction = { parts: [{ text: sys }] };
      if (tools && tools.length) body.tools = tools; else if (json) body.generationConfig.responseMimeType = 'application/json';
      const order = [...new Set(tier === 'best' ? [best, lite] : [lite, best])];
      let daily = false;
      for (const model of order) {
        const r = await fetch(`${AI.BASE}/models/${model}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body) });
        if (!r.ok) { let m = ''; try { m = (await r.json()).error.message || ''; } catch (e) {}
          if (r.status === 429) { if (/day|PerDay/i.test(m)) daily = true; continue; }   // hết lượt model này → thử model còn lại
          if (r.status === 413 || /too large|exceeds/i.test(m)) throw new Error('Nguồn quá nặng cho một lần gửi – bỏ bớt nguồn (bỏ chọn ở cột trái) rồi thử lại');
          throw new Error('Gemini báo lỗi ' + r.status + (m ? ': ' + m : '')); }
        AI.count(model); AI.last = model;
        const d = await r.json(), c = (d.candidates || [])[0];
        const text = c && c.content && (c.content.parts || []).map(p => p.text || '').join('');
        if (!text) throw new Error('Gemini không trả lời' + (c && c.finishReason ? ' (' + c.finishReason + ')' : (d.promptFeedback && d.promptFeedback.blockReason ? ' (chặn: ' + d.promptFeedback.blockReason + ')' : '')));
        return { text, cut: c.finishReason === 'MAX_TOKENS', model };
      }
      throw new Error(daily ? 'Hết lượt miễn phí của Gemini hôm nay – lượt mới có lại khoảng 14–15 giờ chiều (giờ Việt Nam)' : 'Gemini đang giới hạn lượt mỗi phút – đợi khoảng 1 phút rồi thử lại');
    },
    parse(t) { const s = String(t).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
      try { return JSON.parse(s); } catch (e) { const a = s.indexOf('{'), b = s.lastIndexOf('}'); if (a >= 0 && b > a) return JSON.parse(s.slice(a, b + 1)); throw new Error('Gemini trả về không đúng dạng dữ liệu – thử lại'); } }
  };
  const b64 = blob => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.onerror = () => rej(fr.error); fr.readAsDataURL(blob); });
  const on = () => (P.sources || []).filter(s => s.on !== false);
  // mọi nguồn đang chọn → các phần gửi kèm cho Gemini (PDF/ảnh gửi nguyên file, Gemini tự đọc cả bản scan)
  async function sourceParts(list) {
    const parts = []; let links = false;
    for (const s of (list || on())) {
      parts.push({ text: `=== NGUỒN ${s.id}: ${s.name} · Trung tâm: ${s.center || 'chưa ghi'} · Lấy ngày: ${s.date || '?'} · Loại: ${s.kind} ===` });
      if ((s.kind === 'pdf' || s.kind === 'image') && s.blob) parts.push({ inline_data: { mime_type: s.mime, data: await b64(s.blob) } });
      else if (s.kind === 'link') { links = true; parts.push({ text: 'Link (đọc nội dung trang này): ' + s.url + (s.text ? '\nNội dung dán kèm:\n' + s.text : '') }); }
      else parts.push({ text: s.text || '' });
    }
    return { parts, tools: links ? [{ url_context: {} }] : null };
  }
  const SYS = 'Bạn là trợ lý nghiên cứu học liệu cho một trung tâm ngoại ngữ ở Việt Nam. Chỉ dùng thông tin trong các NGUỒN được gửi kèm (và trang web trong link nguồn). ' +
    'Mỗi ý lấy từ nguồn phải ghi trích dẫn dạng [S1] hoặc [S1, tr.3]. Không có trong nguồn thì nói rõ "chưa rõ trong nguồn", tuyệt đối không bịa. ' +
    'Ý nào là suy luận của bạn thì ghi "(suy luận)". Viết tiếng Việt, ngắn gọn, rõ ràng.';

  // ---------- thêm nguồn ----------
  const kindOf = f => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name) ? 'pdf' : /^image\//.test(f.type) ? 'image' : /\.(xlsx|xls|csv)$/i.test(f.name) ? 'sheet' : /\.(txt|md|html?|json)$/i.test(f.name) || /^text\//.test(f.type) ? 'text' : /\.docx?$/i.test(f.name) ? 'doc' : 'other';
  const nextId = () => { let n = 1; const used = new Set(P.sources.map(s => s.id)); while (used.has('S' + n)) n++; return 'S' + n; };
  async function addFiles(files, center, date) {
    const bad = [], added = [];
    for (const f of files) {
      const kind = kindOf(f); if (kind === 'doc' || kind === 'other') { bad.push(f.name); continue; }
      if (f.size > 15 * 1024 * 1024) { bad.push(f.name + ' (quá 15 MB)'); continue; }
      const s = { id: nextId(), name: f.name, kind, mime: f.type || (kind === 'pdf' ? 'application/pdf' : 'text/plain'), center, date, size: f.size, on: true, added: Date.now() };
      if (kind === 'pdf' || kind === 'image') s.blob = f;
      else if (kind === 'sheet') { if (root.XLSX && !/\.csv$/i.test(f.name)) { const wb = root.XLSX.read(await f.arrayBuffer(), { type: 'array' }); s.text = wb.SheetNames.map(n => '## ' + n + '\n' + root.XLSX.utils.sheet_to_csv(wb.Sheets[n])).join('\n\n'); } else s.text = await f.text(); s.kind = 'text'; }
      else s.text = await f.text();
      s.ext = (f.name.match(/\.(\w+)$/) || [])[1] || ''; P.sources.push(s); added.push(s); log('Thêm nguồn ' + s.id + ' ' + s.name);
    }
    if (center && !P.centers.includes(center)) P.centers.push(center);
    save(); summarizeLater(added); return bad;
  }
  function addSource(o) { const s = Object.assign({ id: nextId(), on: true, added: Date.now(), date: today() }, o); P.sources.push(s); if (s.center && !P.centers.includes(s.center)) P.centers.push(s.center); log('Thêm nguồn ' + s.id); save(); summarizeLater([s]); return s; }
  // TÓM TẮT NGUỒN (kiểu "hướng dẫn nguồn" của NotebookLM): mỗi nguồn mới tự tóm tắt bằng Flash-Lite (rẻ lượt), lần lượt từng cái
  let sumQ = Promise.resolve();
  async function summarize(s) {
    const { parts, tools } = await sourceParts([s]);
    const r = await AI.call({ sys: SYS, contents: [{ role: 'user', parts: parts.concat({ text: `Tóm tắt nguồn ${s.id} cho người làm chương trình học: 1 câu nói nguồn này là gì; 3–5 gạch đầu dòng ý chính (cấp độ, số buổi, giáo trình, phương pháp, học phí… nếu có, kèm [${s.id}, tr.x]); 1 dòng "Chủ đề:" gồm 3–6 từ khóa. Ngắn gọn.` }) }], tools, maxTokens: 1024, tier: 'lite' });
    s.summary = r.text.trim(); s.sumAt = Date.now(); save();
  }
  function summarizeLater(list) {
    if (!AI.key() || !list || !list.length) return;
    list.forEach(s => { s.sumState = 'wait'; sumQ = sumQ.then(async () => { if (!P.sources.includes(s)) return; s.sumState = 'run'; render(); try { await summarize(s); s.sumState = ''; } catch (e) { s.sumState = 'err'; s.sumErr = e.message; } render(); }); });
  }

  // ---------- việc AI ----------
  async function job(label, fn) {
    if (busy) return; busy = label; render();
    try { await fn(); } catch (e) { toast(e.message || String(e), true); log('Lỗi: ' + e.message); }
    busy = null; save(); render();
  }
  async function ask(q) {
    if (!on().length) throw new Error('Chưa có nguồn nào được chọn');
    P.chat.push({ role: 'user', text: q, at: Date.now() }); render();
    const { parts, tools } = await sourceParts();
    const hist = P.chat.slice(-12, -1).map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
    const contents = [{ role: 'user', parts: parts.concat({ text: 'Đây là các nguồn. Hãy dùng chúng để trả lời các câu hỏi tiếp theo.' }) }, { role: 'model', parts: [{ text: 'Đã đọc các nguồn.' }] }, ...hist, { role: 'user', parts: [{ text: q }] }];
    const r = await AI.call({ sys: SYS, contents, tools, maxTokens: 4096, tier: 'lite' });
    P.chat.push({ role: 'model', text: r.text, at: Date.now() });
  }
  async function compare() {
    if (!on().length) throw new Error('Chưa có nguồn nào được chọn');
    const centers = [...new Set(on().map(s => s.center).filter(Boolean))];
    const { parts, tools } = await sourceParts();
    const prompt = `Lập BẢNG SO SÁNH các trung tâm theo tiêu chí:\n${P.criteria.map(c => '- ' + c).join('\n')}\n` +
      `Trung tâm (theo trường "Trung tâm" của nguồn): ${centers.join(', ') || '(tự xác định từ nguồn)'}.\n` +
      'Trả về JSON đúng dạng: {"centers":["..."],"cells":[{"center":"...","criterion":"<đúng tên tiêu chí>","value":"<ngắn, tối đa 25 từ>","quote":"<trích nguyên văn tối đa 30 từ>","source":"S1","page":"3","kind":"fact"}],"suggest":["<tiêu chí đáng thêm>"],"summary":"<3–5 câu: điểm chung, điểm khác, khoảng trống PLS có thể khai thác, ghi (suy luận) cho ý suy luận>"}\n' +
      'Mỗi trung tâm × mỗi tiêu chí đúng 1 ô. Không có trong nguồn: value "chưa rõ", kind "unknown", để trống quote/source. Chỉ trả JSON.';
    const r = await AI.call({ sys: SYS, contents: [{ role: 'user', parts: parts.concat({ text: prompt }) }], json: true, tools, maxTokens: 8192, tier: 'lite' });
    const d = AI.parse(r.text);
    (d.centers || []).forEach(c => { if (c && !P.centers.includes(c)) P.centers.push(c); });
    (d.cells || []).forEach(c => { if (!c.center || !c.criterion) return; if (!P.criteria.includes(c.criterion)) return;
      P.cells[c.center + '||' + c.criterion] = { v: String(c.value || 'chưa rõ'), q: c.quote || '', src: c.source || '', page: c.page || '', kind: c.kind === 'fact' && c.source ? 'fact' : 'unknown' }; });
    P.cmpSuggest = (d.suggest || []).filter(x => x && !P.criteria.includes(x)).slice(0, 6); P.cmpSummary = d.summary || ''; P.cmpAt = Date.now();
    log('So sánh ' + (d.cells || []).length + ' ô');
  }
  function cmpText() { return P.centers.map(c => c + ': ' + P.criteria.map(k => { const x = P.cells[c + '||' + k]; return k + ' = ' + (x ? x.v : 'chưa rõ'); }).join('; ')).join('\n'); }
  async function outline() {
    const b = P.brief, { parts, tools } = await sourceParts();
    const prompt = `ĐỊNH HƯỚNG KHUNG KHÓA HỌC cho trung tâm PLS.\nYêu cầu: ngôn ngữ dạy: ${b.lang || '?'}; cấp độ đầu ra: ${b.level || '?'}; đối tượng: ${b.audience || '?'}; số buổi: ${b.sessions}; phút/buổi: ${b.minutes}; ghi chú: ${b.extra || 'không'}.\n` +
      (P.centers.length ? 'Bảng so sánh đã có:\n' + cmpText() + '\n' : '') +
      `Đề xuất đúng ${b.sessions} buổi. Trả JSON: {"course":{"name":"...","desc":"<2–3 câu, đầu ra cụ thể>","level":"...","type":"Tổng hợp"},"lessons":[{"buoi":1,"name":"<tên buổi, không ghi chữ Bài>","type":"Buổi học|Ôn tập|Kiểm tra","goals":"<Học viên sẽ ... – đo được>","topics":"<chủ đề, tình huống>","vocab":"<nhóm từ / ví dụ 8–15 từ>","grammar":"<1–3 điểm ngữ pháp>","skills":"<kỹ năng chính>","basis":"fact|inference","why":"<căn cứ: [S1] ... hoặc lý do suy luận>"}]}\n` +
      'Xếp từ dễ đến khó, ngữ pháp sau dựa trên ngữ pháp trước; có buổi ôn tập / kiểm tra hợp lý. basis = fact khi căn cứ trực tiếp từ nguồn (ghi [S..] trong why). Chỉ trả JSON.';
    const r = await AI.call({ sys: SYS, contents: [{ role: 'user', parts: (parts.length ? parts : [{ text: '(chưa có nguồn – đề xuất theo kinh nghiệm, mọi buổi basis = inference)' }]).concat({ text: prompt }) }], json: true, tools, maxTokens: 16384, tier: 'best' });
    const d = AI.parse(r.text);
    if (!Array.isArray(d.lessons) || !d.lessons.length) throw new Error('Gemini chưa trả khung khóa – thử lại');
    const ver = ((P.outline && P.outline.ver) || 0) + 1;
    P.outline = { ver, at: Date.now(), locked: null, course: d.course || {}, lessons: d.lessons.map((l, i) => ({ buoi: +l.buoi || i + 1, name: l.name || '', type: l.type || 'Buổi học', goals: l.goals || '', topics: l.topics || '', vocab: Array.isArray(l.vocab) ? l.vocab.join(', ') : (l.vocab || ''), grammar: Array.isArray(l.grammar) ? l.grammar.join('; ') : (l.grammar || ''), skills: l.skills || '', basis: l.basis === 'fact' ? 'fact' : 'inference', why: l.why || '' })) };
    log('Khung khóa v' + ver);
  }
  // sheet AI được soạn cho một buổi học (S6-Bảng chữ, Hán tự… chỉ khi cần → để AI tự bỏ nếu không hợp ngôn ngữ)
  const LES_S6 = ['S6-Từ vựng', 'S6-Ngữ pháp', 'S6-Câu hỏi ngữ pháp', 'S6-Mẫu câu & giao tiếp', 'S6-Bảng chữ - Phát âm', 'S6-Hán tự', 'S6-Nghe', 'S6-Nghe câu hỏi', 'S6-Đọc', 'S6-Đọc câu hỏi', 'S6-BTVN', 'S6-Ngoài kiến thức'];
  const LES_S5 = ['S5', 'Hướng dẫn giảng dạy', 'Đặc tả bài tập'];
  const spec = (book, sh) => { const t = (TPL[book] || {})[sh]; return t ? `• ${sh}: cột = ${JSON.stringify(t.cols)}${t.ex ? '\n  ví dụ 1 dòng: ' + JSON.stringify(t.ex) : ''}` : ''; };
  async function lesson(buoi) {
    const O = P.outline; if (!O) throw new Error('Chưa có khung khóa – làm bước Định hướng trước');
    const L = O.lessons.find(l => l.buoi === buoi); if (!L) throw new Error('Không có buổi ' + buoi + ' trong khung');
    if (!O.locked) O.locked = O.ver;   // soạn bài = chốt khung đang dùng
    const prev = O.lessons.filter(l => l.buoi < buoi).map(l => `Buổi ${l.buoi}: ${l.name} – từ vựng: ${l.vocab}; ngữ pháp: ${l.grammar}`).join('\n');
    const { parts, tools } = await sourceParts();
    const prompt = `SOẠN BÀI buổi ${buoi} cho khóa "${O.course.name || P.name}" (${O.course.level || P.brief.level}), dạy ${P.brief.lang || 'ngoại ngữ'} cho người Việt; ${P.brief.minutes} phút/buổi.\n` +
      `Buổi ${buoi}: ${L.name} (${L.type}). Mục tiêu: ${L.goals}. Chủ đề: ${L.topics}. Từ vựng: ${L.vocab}. Ngữ pháp: ${L.grammar}. Kỹ năng: ${L.skills}.\n` +
      (prev ? 'Các buổi trước (không lặp lại từ / ngữ pháp đã dạy):\n' + prev + '\n' : '') +
      'Viết nội dung đầy đủ để dạy thật, theo ĐÚNG CỘT Excel dưới đây. Trả JSON: {"s6":{"<tên sheet>":[{<cột>:<giá trị>}]},"s5":{"<tên sheet>":[...]}}\n' +
      'Sheet S6 (bỏ sheet không hợp ngôn ngữ / buổi này, ví dụ Hán tự cho tiếng Anh):\n' + LES_S6.map(s => spec('s6', s)).filter(Boolean).join('\n') + '\n' +
      'Sheet S5 (đủ cả 3 sheet; S5 đúng 1 dòng, timeline cộng đúng ' + P.brief.minutes + ' phút, "Tự kiểm – tổng phút" là tổng đó):\n' + LES_S5.map(s => spec('s5', s)).filter(Boolean).join('\n') + '\n' +
      `Quy tắc: mọi dòng có cột "Buổi" = ${buoi}. Mã mục dạng TV-B${String(buoi).padStart(2, '0')}-01, NP-B${String(buoi).padStart(2, '0')}-01, Mã bài NGHE-B${String(buoi).padStart(2, '0')}-1 / DOC-B${String(buoi).padStart(2, '0')}-1… (câu hỏi trỏ đúng mã). ` +
      'Câu trắc nghiệm: đủ A–D, "Đáp án" là 1 chữ cái A–D, "Giải thích" vì sao đúng và vì sao các phương án khác sai. Phiên âm IPA cho tiếng Anh, Romaji / Pinyin cho tiếng Nhật / Trung. Nghĩa tiếng Việt tự nhiên. ' +
      'Số lượng gợi ý: 12–18 từ vựng, 1–3 ngữ pháp mỗi cái 3–4 câu hỏi, 1 bài nghe 8–12 câu + 4 câu hỏi, 1 bài đọc 6–10 câu + 4 câu hỏi, 8–12 câu BTVN. Không dùng nội dung có bản quyền của nguồn nguyên văn; nguồn chỉ để tham khảo cách làm. Chỉ trả JSON.';
    const r = await AI.call({ sys: SYS.replace('Chỉ dùng thông tin trong các NGUỒN được gửi kèm (và trang web trong link nguồn).', 'Nguồn gửi kèm để tham khảo cách các trung tâm khác dạy; nội dung bài do bạn soạn mới.'),
      contents: [{ role: 'user', parts: parts.concat({ text: prompt }) }], json: true, tools, maxTokens: 32768, tier: 'best' });
    if (r.cut) throw new Error('Bài quá dài, Gemini bị cắt giữa chừng – thử lại (hoặc giảm bớt nguồn)');
    const d = AI.parse(r.text); mergeLesson(buoi, d); log('Soạn buổi ' + buoi);
  }
  // gộp kết quả 1 buổi vào bộ Excel của dự án: bỏ dòng cũ của buổi đó, giữ đúng cột mẫu, soát lỗi
  function mergeLesson(buoi, d) {
    const issues = [], counts = {};
    ['s6', 's5'].forEach(bk => Object.entries(d[bk] || {}).forEach(([sh, rows]) => {
      const t = (TPL[bk] || {})[sh]; if (!t || !Array.isArray(rows)) { if (rows && rows.length) issues.push({ lv: 'warn', t: `Bỏ sheet lạ "${sh}"` }); return; }
      const clean = rows.filter(r => r && typeof r === 'object').map(r => { const o = {}; t.cols.forEach(c => { if (r[c] != null && r[c] !== '') o[c] = r[c]; }); if (t.cols.includes('Buổi')) o['Buổi'] = buoi; return o; });
      const extra = new Set(); rows.forEach(r => r && Object.keys(r).forEach(k => { if (!t.cols.includes(k)) extra.add(k); })); if (extra.size) issues.push({ lv: 'warn', t: `${sh}: bỏ cột lạ ${[...extra].slice(0, 4).join(', ')}` });
      const B = P.books[bk]; B[sh] = (B[sh] || []).filter(r => +r['Buổi'] !== buoi).concat(clean); counts[sh] = clean.length;
    }));
    issues.push(...check(buoi));
    P.lessons[buoi] = { at: Date.now(), ver: P.outline.ver, counts, issues };
    buildBase();
  }
  // soát nhanh nội dung 1 buổi (máy soát, không cần AI)
  function check(buoi) {
    const out = [], rows = (bk, sh) => ((P.books[bk] || {})[sh] || []).filter(r => +r['Buổi'] === buoi);
    const need = (bk, sh, cols, label) => rows(bk, sh).forEach((r, i) => cols.forEach(c => { if (!r[c]) out.push({ lv: 'bad', t: `${label} dòng ${i + 1}: thiếu "${c}"` }); }));
    need('s6', 'S6-Từ vựng', ['Từ', 'Nghĩa'], 'Từ vựng'); need('s6', 'S6-Ngữ pháp', ['Tên ngữ pháp', 'Cấu trúc (công thức)'], 'Ngữ pháp');
    ['S6-Câu hỏi ngữ pháp', 'S6-Nghe câu hỏi', 'S6-Đọc câu hỏi', 'S6-BTVN'].forEach(sh => rows('s6', sh).forEach((r, i) => {
      if (!r['A'] && !r['B']) return; const a = String(r['Đáp án'] || '').trim().toUpperCase();
      if (!/^[A-D]$/.test(a)) out.push({ lv: 'bad', t: `${sh.replace('S6-', '')} câu ${i + 1}: đáp án "${r['Đáp án'] || ''}" không phải A–D` });
      else if (!r[a]) out.push({ lv: 'bad', t: `${sh.replace('S6-', '')} câu ${i + 1}: đáp án ${a} trỏ vào phương án trống` });
      if (!r['Giải thích'] && sh !== 'S6-BTVN') out.push({ lv: 'warn', t: `${sh.replace('S6-', '')} câu ${i + 1}: chưa có giải thích` }); }));
    if (!rows('s6', 'S6-Từ vựng').length) out.push({ lv: 'warn', t: 'Chưa có từ vựng' });
    const s5 = rows('s5', 'S5')[0]; if (!s5) out.push({ lv: 'bad', t: 'Thiếu dòng S5 (khung buổi)' });
    else { const tl = String(s5['Nội dung buổi (timeline)'] || ''), sum = [...tl.matchAll(/(\d+)\s*p/g)].reduce((a, m) => a + +m[1], 0);
      if (sum && Math.abs(sum - P.brief.minutes) > 10) out.push({ lv: 'warn', t: `Timeline cộng ${sum} phút, buổi ${P.brief.minutes} phút` }); }
    const seen = {}; Object.values(P.books.s6 || {}).forEach(rs => rs.forEach(r => { const m = r['Mã mục']; if (m) seen[m] = (seen[m] || 0) + 1; }));
    Object.entries(seen).filter(([, n]) => n > 1).slice(0, 3).forEach(([m]) => out.push({ lv: 'warn', t: `Mã mục ${m} bị trùng` }));
    return out;
  }
  // sheet khung (Thông tin khoá, Khoá & bài) dựng từ khung khóa đã chốt
  function buildBase() {
    const O = P.outline; if (!O) return; const B = P.books; B.s6 = B.s6 || {}; B.s5 = B.s5 || {};
    const c = O.course || {};
    B.s6['S6-Thông tin khoá'] = [['Tên khoá', c.name || P.name], ['Mô tả khoá', c.desc || ''], ['Loại khoá', c.type || 'Tổng hợp'], ['Cấp độ', c.level || P.brief.level], ['Số kỳ', 1], ['Số buổi', O.lessons.length], ['Số bài', O.lessons.length]].map(([m, n]) => ({ 'Mục': m, 'Nội dung': n }));
    const comp = buoi => { const has = sh => ((B.s6[sh] || []).some(r => +r['Buổi'] === buoi)); return [['Từ vựng', 'S6-Từ vựng'], ['Ngữ pháp', 'S6-Ngữ pháp'], ['Bảng chữ - Phát âm', 'S6-Bảng chữ - Phát âm'], ['Hán tự', 'S6-Hán tự'], ['Nghe', 'S6-Nghe'], ['Đọc', 'S6-Đọc'], ['Mẫu câu và giao tiếp', 'S6-Mẫu câu & giao tiếp'], ['BTVN', 'S6-BTVN'], ['Ngoài kiến thức', 'S6-Ngoài kiến thức']].filter(x => has(x[1])).map(x => x[0]).join('; '); };
    B.s6['S6-Khoá & bài'] = O.lessons.map(l => ({ 'Buổi': l.buoi, 'Bài': l.buoi, 'Tên buổi': `Bài ${l.buoi} – ${l.name}`, 'Kỳ': 1, 'Loại buổi': l.type || 'Buổi học', 'Mô tả buổi': l.topics, 'Mục tiêu bài': l.goals, 'Thành phần có trong buổi': comp(l.buoi) }));
  }
  function booksOut() {   // đủ mọi sheet theo mẫu (sheet trống vẫn có), Hướng dẫn / Danh mục giữ nguyên mẫu
    buildBase(); const out = { s6: {}, s5: {} };
    ['s6', 's5'].forEach(bk => Object.entries(TPL[bk] || {}).forEach(([sh, t]) => { out[bk][sh] = t.rows ? t.rows.slice() : ((P.books[bk] || {})[sh] || []).slice().sort((a, b) => (+a['Buổi'] || 0) - (+b['Buổi'] || 0)); }));
    return out;
  }
  const slug = () => ((P.outline && P.outline.course.name) || P.name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\w]+/g, '_').replace(/^_|_$/g, '').slice(0, 40) || 'Khoa';
  function exportXlsx() {
    if (!root.XLSX) throw new Error('Chưa tải được thư viện Excel – kiểm tra mạng rồi tải lại trang');
    const bk = booksOut(), X = root.XLSX, files = [];
    ['s6', 's5'].forEach(k => { const wb = X.utils.book_new(); Object.entries(bk[k]).forEach(([sh, rows]) => { const cols = (TPL[k][sh] || {}).cols || []; X.utils.book_append_sheet(wb, X.utils.json_to_sheet(rows, { header: cols }), sh.slice(0, 31)); });
      const name = `${slug()}_${k.toUpperCase()}.xlsx`; X.writeFile(wb, name); files.push(name); });
    log('Xuất ' + files.join(', ')); return files;
  }
  function openInSlide(buoi) {
    const I = root.PLS && root.PLS._int; if (!I || !I.openBooks) throw new Error('Không mở được tab Slide');
    const bk = booksOut(), names = [`${slug()}_S6.xlsx`, `${slug()}_S5.xlsx`];
    if (I.saveRecent) I.saveRecent(bk, names);
    if (root.PLS.view) root.PLS.view('slide');
    return I.openBooks(bk, names, buoi || +Object.keys(P.lessons)[0] || 1);
  }

  // ---------- giao diện ----------
  let tmsg = null;
  function toast(t, bad) { tmsg = { t, bad, at: Date.now() }; render(); setTimeout(() => { if (tmsg && Date.now() - tmsg.at >= 5900) { tmsg = null; render(); } }, 6000); }
  const md = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\[(S\d+)(?:,\s*([^\]]+))?\]/g, (m, s, p) => `<button type="button" class="rs-cite" data-src="${s}" title="Xem nguồn ${s}">${s}${p ? ' · ' + p : ''}</button>`)
    .split(/\n/).map(l => /^\s*[-*•]\s+/.test(l) ? '<li>' + l.replace(/^\s*[-*•]\s+/, '') + '</li>' : l ? '<p>' + l + '</p>' : '').join('').replace(/(<li>.*?<\/li>)+/g, m => '<ul>' + m + '</ul>');
  const SVG = { chat: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 26h70a6 6 0 0 1 6 6v38a6 6 0 0 1-6 6H48l-18 14V76H18a6 6 0 0 1-6-6V32a6 6 0 0 1 6-6z"/><path d="M30 44h48M30 56h32"/></svg>',
    src: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2"><rect x="16" y="22" width="50" height="66" rx="3"/><rect x="40" y="34" width="50" height="66" rx="3" fill="currentColor" fill-opacity=".12"/><circle cx="88" cy="88" r="14"/><path d="M98 98l12 12" stroke-width="3"/></svg>',
    les: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2"><rect x="18" y="20" width="66" height="84" rx="3"/><path d="M30 40h42M30 52h42M30 64h28"/><path d="M70 96l30-30 10 10-30 30H70z" fill="currentColor" fill-opacity=".15"/></svg>' };
  function intro(box) {
    box.className = 'rs-intro'; const ok = !!AI.key();
    box.innerHTML = `<section class="w-hero"><div><p class="hi">Nghiên cứu <span class="rs-badge ok">Chạy bằng Gemini</span></p><h1>Nghiên cứu, định hướng rồi soạn bài – trên cùng một chỗ</h1>
        <div class="acts"><button type="button" class="btn primary" id="rsOpen">${ok ? 'Mở không gian nghiên cứu' : 'Bắt đầu'}</button><span class="muted">${ok ? 'Đã kết nối Gemini trên máy này' : 'Cần 1 Gemini API key (tạo miễn phí ở Google AI Studio)'}</span></div></div>
      <div class="w-cards"><div class="w-card c1"><span class="n">01</span><b>Nạp nguồn & hỏi</b><p>PDF, ảnh giáo trình, link, Excel của trung tâm khác – hỏi đáp có trích dẫn như NotebookLM</p>${SVG.chat}</div>
        <div class="w-card c2"><span class="n">02</span><b>So sánh & định hướng</b><p>Bảng so sánh có trích dẫn từng ô, rồi đề xuất khung khóa để bạn sửa và chốt</p>${SVG.src}</div>
        <div class="w-card c3"><span class="n">03</span><b>Soạn bài</b><p>Soạn từng buổi đúng cột Excel S5/S6, máy soát lỗi, mở thẳng ở tab Slide / Sách</p>${SVG.les}</div></div></section>
      <div class="w-low"><section><p class="muted" style="margin:0 0 2px;font-size:12px">Nghiên cứu làm được gì</p><h2>Từ tài liệu tham khảo tới Excel S5/S6</h2><p class="sub">Soạn xong mở luôn ở tab Slide và Sách, hoặc tải về 2 file Excel S5 + S6.</p>
        <ol class="w-steps">
          <li><span class="ic">⇪</span><b>Gom nguồn</b><span>PDF (cả bản scan), ảnh, link trang khóa học, Excel – ghi rõ trung tâm nào, lấy ngày nào</span></li>
          <li><span class="ic">?</span><b>Trò chuyện theo nguồn</b><span>Chỉ trả lời từ tài liệu đã nạp, bấm trích dẫn để xem nguồn; không có thì nói "chưa rõ"</span></li>
          <li><span class="ic">▦</span><b>Bảng so sánh</b><span>Cấp độ, số buổi, giáo trình, phương pháp, cách kiểm tra, học phí – mỗi ô có trích dẫn</span></li>
          <li><span class="ic">◎</span><b>Định hướng khung khóa</b><span>Mục tiêu, chủ đề, từ vựng – ngữ pháp từng buổi; ghi rõ căn cứ hay suy luận; sửa rồi chốt</span></li>
          <li class="dark"><span class="ic">✎</span><b>Soạn bài & soát</b><span>Từ vựng, ngữ pháp, nghe, đọc, BTVN + đáp án; máy soát đáp án, cột, timeline</span></li>
          <li class="dark"><span class="ic">⤓</span><b>Slide · Sách · Excel</b><span>Mở ở tab Slide / Sách, hoặc tải Excel S5 + S6 đúng mẫu</span></li>
        </ol></section>
        <section class="w-side"><p class="muted" style="margin:0 0 2px;font-size:12px">Trước khi bắt đầu</p><h2>Cần biết</h2><p class="sub">Mọi thứ lưu trên trình duyệt của máy này, không cần đăng nhập.</p>
          <div class="item"><b>Gemini API key</b><span class="muted">Tạo ở aistudio.google.com → Get API key, dán 1 lần. Key chỉ lưu trên máy này.</span></div>
          <div class="item"><b>Gói miễn phí</b><span class="muted">Khoảng 20 lượt/ngày cho Định hướng + Soạn bài (Flash) và khoảng 500 lượt/ngày cho Trò chuyện + So sánh (Flash-Lite); model nào hết lượt thì tự chuyển sang model kia. Lượt mới có lại khoảng 14–15h chiều. Google được dùng dữ liệu gói miễn phí để cải thiện sản phẩm.</span></div>
          <div class="item"><b>AI có thể sai</b><span class="muted">Luôn bấm trích dẫn để kiểm; bài soạn phải được người dạy duyệt trước khi dùng.</span></div></section></div>`;
    box.querySelector('#rsOpen').onclick = () => { mode = 'work'; if (!AI.key()) keyDlg(); render(); };
  }
  function keyDlg() {
    let d = $('#rsKey'); if (d) d.remove();
    d = document.createElement('div'); d.id = 'rsKey'; d.className = 'rs-dlg'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', 'Kết nối Gemini');
    d.innerHTML = `<div class="rs-dlg-card"><h3>Kết nối Gemini</h3>
      <ol><li>Mở <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a>, đăng nhập Google.</li><li>Bấm <b>Create API key</b>, chép key.</li><li>Dán vào ô dưới rồi bấm Kết nối.</li></ol>
      <input type="password" id="rsKeyIn" placeholder="Dán Gemini API key…" autocomplete="off" value="${esc(AI.key())}">
      <p class="muted" id="rsKeyMsg">Key chỉ lưu trong trình duyệt của máy này. ${AI.model() ? 'Đang dùng: ' + esc(AI.model()) + (AI.lite() && AI.lite() !== AI.model() ? ' (soạn bài) + ' + esc(AI.lite()) + ' (hỏi đáp, so sánh)' : '') + ' · ' + AI.usage() : ''}</p>
      <div class="rs-row"><button type="button" class="btn primary" id="rsKeyOk">Kết nối</button><button type="button" class="btn" id="rsKeyX">Đóng</button>${AI.key() ? '<button type="button" class="btn" id="rsKeyDel">Gỡ key</button>' : ''}</div></div>`;
    document.body.appendChild(d); const inp = d.querySelector('#rsKeyIn'); inp.focus();
    const close = () => { d.remove(); render(); };
    d.querySelector('#rsKeyX').onclick = close; d.onclick = e => { if (e.target === d) close(); }; d.onkeydown = e => { if (e.key === 'Escape') close(); };
    if (d.querySelector('#rsKeyDel')) d.querySelector('#rsKeyDel').onclick = () => { LS.set('pls.gemini.key', null); LS.set('pls.gemini.model', null); LS.set('pls.gemini.lite', null); close(); };
    d.querySelector('#rsKeyOk').onclick = async () => { const k = inp.value.trim(), msg = d.querySelector('#rsKeyMsg'); if (!k) return; msg.textContent = 'Đang kiểm tra key…';
      try { const m = await AI.pick(k); LS.set('pls.gemini.key', k); LS.set('pls.gemini.model', m.best); LS.set('pls.gemini.lite', m.lite); msg.textContent = 'Đã kết nối: ' + m.best + (m.lite !== m.best ? ' + ' + m.lite : ''); setTimeout(close, 700); } catch (e) { msg.textContent = e.message; } };
  }
  // HỘP THÊM NGUỒN (kiểu NotebookLM: 1 chỗ cho file / link / văn bản, kéo thả, dán ảnh) – vẫn giữ Trung tâm + Ngày lấy cho bảng so sánh
  function addDlg(initFiles) {
    let d = $('#rsAddDlg'); if (d) d.remove();
    const pend = [...(initFiles || [])];
    d = document.createElement('div'); d.id = 'rsAddDlg'; d.className = 'rs-dlg'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', 'Thêm nguồn');
    d.innerHTML = `<div class="rs-dlg-card rs-add-card"><div class="rs-row"><h3 style="flex:1">Thêm nguồn</h3><button type="button" class="rs-x" id="aX" aria-label="Đóng">×</button></div>
      <p class="muted" style="margin:0">Nguồn dùng để hỏi đáp, so sánh và soạn bài. Ghi tên trung tâm để bảng so sánh chia đúng cột.</p>
      <div class="rs-add-meta"><label class="rs-f">Trung tâm<input id="aCenter" list="aCenters" placeholder="VD: Trung tâm A" value="${esc(LS.get('pls.rs.center', ''))}" autocomplete="off"></label>
        <label class="rs-f">Lấy ngày<input id="aDate" type="date" value="${today()}"></label></div>
      <datalist id="aCenters">${P.centers.map(c => `<option value="${esc(c)}">`).join('')}</datalist>
      ${P.centers.length ? `<div class="rs-chips">${P.centers.map(c => `<button type="button" class="rs-chip" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div>` : ''}
      <label class="rs-drop" id="aDrop"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>
        <b>Kéo thả file vào đây hoặc bấm để chọn</b><span>PDF (cả bản scan), ảnh giáo trình, Excel / CSV, txt · tối đa 15 MB/file · dán ảnh bằng Ctrl+V</span>
        <input id="aFiles" type="file" multiple accept=".pdf,image/*,.xlsx,.xls,.csv,.txt,.md" hidden></label>
      <ul class="rs-pend" id="aPend"></ul>
      <div class="rs-add-two"><label class="rs-f">Link trang web<textarea id="aLinks" rows="3" placeholder="Dán link trang khóa học, lộ trình…\nMỗi dòng 1 link"></textarea></label>
        <label class="rs-f">Dán văn bản<input id="aTitle" placeholder="Tiêu đề (không bắt buộc)"><textarea id="aText" rows="2" placeholder="Mô tả khóa, lộ trình, bảng giá…"></textarea></label></div>
      <div class="rs-row"><span class="muted" id="aCount"></span><span style="flex:1"></span><button type="button" class="btn" id="aCancel">Hủy</button><button type="button" class="btn primary" id="aOk">Thêm nguồn</button></div></div>`;
    document.body.appendChild(d);
    const q = x => d.querySelector(x), close = () => { d.remove(); document.removeEventListener('paste', onPaste, true); };
    const links = () => q('#aLinks').value.split(/\s+/).map(x => x.trim()).filter(x => /^https?:\/\/\S+$/.test(x));
    const drawPend = () => { q('#aPend').innerHTML = pend.map((f, i) => `<li><span class="rs-kind k-${kindOf(f) === 'pdf' ? 'PDF' : kindOf(f) === 'image' ? 'ẢNH' : kindOf(f) === 'sheet' ? 'XLS' : 'TXT'}">${kindOf(f) === 'pdf' ? 'PDF' : kindOf(f) === 'image' ? 'ẢNH' : kindOf(f) === 'sheet' ? 'XLS' : 'TXT'}</span><span>${esc(f.name)}</span><small class="muted">${Math.max(1, Math.round(f.size / 1024))} KB</small><button type="button" class="rs-x" data-rm="${i}" aria-label="Bỏ ${esc(f.name)}">×</button></li>`).join('');
      d.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { pend.splice(+b.dataset.rm, 1); drawPend(); }); count(); };
    const count = () => { const n = pend.length + links().length + (q('#aText').value.trim() ? 1 : 0); q('#aCount').textContent = n ? `Sẽ thêm ${n} nguồn` : 'Chưa chọn nguồn nào'; q('#aOk').disabled = !n; q('#aOk').textContent = n > 1 ? `Thêm ${n} nguồn` : 'Thêm nguồn'; };
    const addF = fs => { fs.forEach(f => { if (!pend.some(x => x.name === f.name && x.size === f.size)) pend.push(f); }); drawPend(); };
    function onPaste(e) { const fs = [...((e.clipboardData && e.clipboardData.files) || [])]; if (fs.length) { e.preventDefault(); addF(fs.map((f, i) => f.name && f.name !== 'image.png' ? f : new File([f], `Ảnh dán ${new Date().toLocaleTimeString('vi-VN').replace(/:/g, '-')}${i ? '-' + i : ''}.png`, { type: f.type }))); } }
    document.addEventListener('paste', onPaste, true);
    q('#aFiles').onchange = e => { addF([...e.target.files]); e.target.value = ''; };
    const dz = q('#aDrop'); dz.ondragover = e => { e.preventDefault(); dz.classList.add('on'); }; dz.ondragleave = () => dz.classList.remove('on'); dz.ondrop = e => { e.preventDefault(); dz.classList.remove('on'); addF([...e.dataTransfer.files]); };
    d.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { q('#aCenter').value = b.dataset.c; });
    ['#aLinks', '#aText'].forEach(x => q(x).oninput = count);
    q('#aX').onclick = q('#aCancel').onclick = close; d.onclick = e => { if (e.target === d) close(); }; d.onkeydown = e => { if (e.key === 'Escape') close(); };
    q('#aOk').onclick = async () => {
      const c = q('#aCenter').value.trim(), dt = q('#aDate').value || today(); LS.set('pls.rs.center', c);
      q('#aOk').disabled = true; q('#aOk').textContent = 'Đang thêm…';
      const bad = pend.length ? await addFiles(pend, c, dt) : [];
      links().forEach(u => addSource({ kind: 'link', name: u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').slice(0, 70), url: u, center: c, date: dt }));
      const t = q('#aText').value.trim(); if (t) addSource({ kind: 'text', name: q('#aTitle').value.trim() || t.split('\n')[0].slice(0, 60) || 'Văn bản dán', text: t, center: c, date: dt });
      const n = pend.length - bad.length + links().length + (t ? 1 : 0);
      close(); if (c && !P.centers.includes(c)) P.centers.push(c); save(); render();
      toast(bad.length ? `Đã thêm ${n} nguồn · chưa đọc được: ${bad.join(', ')} (Word → lưu thành PDF rồi thêm lại)` : `Đã thêm ${n} nguồn${AI.key() ? ' · Gemini đang tóm tắt từng nguồn' : ''}`, !!bad.length);
    };
    drawPend(); q(pend.length ? '#aCenter' : '#aDrop').focus();
  }
  // XEM NGUỒN: nội dung gốc + tóm tắt (tự tạo khi thêm) + sửa tên / trung tâm / ngày
  function viewer(id) {
    const s = P.sources.find(x => x.id === id); if (!s) return;
    let d = $('#rsView'); if (d) d.remove(); d = document.createElement('div'); d.id = 'rsView'; d.className = 'rs-dlg'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Xem nguồn ' + id);
    const url = s.blob ? URL.createObjectURL(s.blob) : null;
    d.innerHTML = `<div class="rs-dlg-card wide"><div class="rs-row"><h3 style="flex:1">${esc(s.id)} · ${esc(s.name)}</h3><button type="button" class="rs-x" id="rsViewX2" aria-label="Đóng">×</button></div>
      <div class="rs-add-meta three"><label class="rs-f">Tên nguồn<input id="vName" value="${esc(s.name)}"></label><label class="rs-f">Trung tâm<input id="vCenter" list="vCenters" value="${esc(s.center || '')}"></label><label class="rs-f">Lấy ngày<input id="vDate" type="date" value="${esc(s.date || '')}"></label></div>
      <datalist id="vCenters">${P.centers.map(c => `<option value="${esc(c)}">`).join('')}</datalist>
      <div class="rs-guide"><b>Tóm tắt nguồn</b>${s.summary ? `<div class="rs-md">${md(s.summary)}</div>` : `<p class="muted">${s.sumState === 'run' || s.sumState === 'wait' ? 'Gemini đang tóm tắt…' : s.sumState === 'err' ? 'Chưa tóm tắt được: ' + esc(s.sumErr || '') : 'Chưa có tóm tắt.'}</p>`}
        <button type="button" class="rs-mini" id="vSum" ${AI.key() ? '' : 'disabled'}>${s.summary ? 'Tóm tắt lại' : 'Tóm tắt nguồn này'}</button></div>
      <div class="rs-view-body">${s.kind === 'pdf' ? `<iframe src="${url}" title="${esc(s.name)}"></iframe>` : s.kind === 'image' ? `<img src="${url}" alt="${esc(s.name)}">` : s.kind === 'link' ? `<p><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a></p>${s.text ? '<pre>' + esc(s.text) + '</pre>' : ''}` : '<pre>' + esc((s.text || '').slice(0, 20000)) + '</pre>'}</div>
      <div class="rs-row"><button type="button" class="btn" id="rsViewX">Đóng</button></div></div>`;
    document.body.appendChild(d);
    const close = () => { const n = d.querySelector('#vName').value.trim(), c = d.querySelector('#vCenter').value.trim(), dt = d.querySelector('#vDate').value;
      if (n !== s.name || c !== (s.center || '') || dt !== (s.date || '')) { s.name = n || s.name; s.center = c; s.date = dt; if (c && !P.centers.includes(c)) P.centers.push(c); save(); render(); }
      d.remove(); if (url) URL.revokeObjectURL(url); };
    d.querySelector('#rsViewX').onclick = d.querySelector('#rsViewX2').onclick = close; d.onclick = e => { if (e.target === d) close(); }; d.onkeydown = e => { if (e.key === 'Escape') close(); };
    d.querySelector('#vSum').onclick = async e => { e.target.disabled = true; e.target.textContent = 'Đang tóm tắt…'; try { await summarize(s); } catch (er) { toast(er.message, true); } close(); viewer(id); };
    d.querySelector('#rsViewX2').focus();
  }
  const stat = () => { const O = P.outline, nL = Object.keys(P.lessons).length;
    return [['Nguồn', P.sources.length ? P.sources.length + ' nguồn' : 'Chưa có', P.sources.length ? 'ok' : ''],
      ['So sánh', P.cmpAt ? Object.keys(P.cells).length + ' ô' : 'Chưa làm', P.cmpAt ? 'ok' : ''],
      ['Định hướng', O ? (O.locked ? 'Đã chốt v' + O.locked : 'Bản nháp v' + O.ver) : 'Chưa làm', O ? (O.locked === O.ver ? 'ok' : 'warn') : ''],
      ['Soạn bài', O ? nL + '/' + O.lessons.length + ' buổi' : '–', O && nL ? (nL === O.lessons.length ? 'ok' : 'warn') : '']]; };
  function render() {
    const box = $('#researchView'); if (!box || !document.body.classList.contains('research')) return;
    if (mode === 'intro') return intro(box);
    if (!loaded) { load().then(render); box.className = 'rs-work'; box.innerHTML = '<p class="muted">Đang mở…</p>'; return; }
    box.className = 'rs-work';
    const hasKey = !!AI.key(), O = P.outline;
    const BADGE = s => s.kind === 'pdf' ? 'PDF' : s.kind === 'image' ? 'ẢNH' : s.kind === 'link' ? 'WEB' : /^(xlsx?|csv)$/i.test(s.ext || '') ? 'XLS' : 'TXT';
    const item = s => `<li class="rs-src${s.on === false ? ' off' : ''}"><input type="checkbox" data-on="${s.id}" ${s.on !== false ? 'checked' : ''} aria-label="Dùng nguồn ${esc(s.id)}">
        <button type="button" class="rs-src-open" data-view="${s.id}" title="${esc(s.name)}"><span class="rs-kind k-${BADGE(s)}">${BADGE(s)}</span><span class="rs-src-t"><b>${esc(s.name)}</b><small>${esc(s.id)} · ${esc(s.date || '')}${s.sumState === 'run' || s.sumState === 'wait' ? ' · đang tóm tắt…' : s.summary ? ' · đã tóm tắt' : ''}</small></span></button>
        <button type="button" class="rs-x" data-del="${s.id}" aria-label="Xóa nguồn ${esc(s.id)}">×</button></li>`;
    const gnames = [...new Set(P.sources.map(s => s.center || ''))].sort((a, b) => !a - !b || P.centers.indexOf(a) - P.centers.indexOf(b));
    const groups = gnames.map(g => { const ss = P.sources.filter(s => (s.center || '') === g), allOn = ss.every(s => s.on !== false);
      return `<div class="rs-grp"><label class="rs-grp-h"><input type="checkbox" data-grp="${esc(g)}" ${allOn ? 'checked' : ''}><b>${esc(g || 'Chưa ghi trung tâm')}</b><span class="muted">${ss.length}</span></label><ul class="rs-srcs">${ss.map(item).join('')}</ul></div>`; }).join('');
    const allOn = P.sources.length && P.sources.every(s => s.on !== false);
    box.innerHTML = `
      <section class="rs-col rs-left" aria-label="Nguồn">
        <div class="rs-proj"><select id="rsProj" aria-label="Khóa đang nghiên cứu">${projects.map(p => `<option value="${p.id}" ${p.id === P.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>
          <button type="button" class="btn" id="rsNew" title="Khóa nghiên cứu mới">+</button><button type="button" class="btn" id="rsRen" title="Đổi tên">✎</button></div>
        <button type="button" class="rs-ai ${hasKey ? 'ok' : ''}" id="rsAI" title="Gemini miễn phí – bấm để đổi / gỡ key">${hasKey ? '● Gemini · ' + esc(AI.usage()) : '○ Kết nối AI (Gemini)'}</button>
        <div class="rs-src-head"><h3>Nguồn <span class="muted">${P.sources.filter(s => s.on !== false).length}/${P.sources.length} đang dùng</span></h3></div>
        <button type="button" class="rs-addbtn" id="rsAddBtn"><span>＋</span> Thêm nguồn</button>
        ${P.sources.length ? `<label class="rs-all"><input type="checkbox" id="rsAll" ${allOn ? 'checked' : ''}> Chọn tất cả nguồn</label><div class="rs-groups">${groups}</div><p class="rs-hint muted">Kéo thả file vào cột này để thêm nhanh</p>`
          : `<button type="button" class="rs-drop-empty" id="rsAddEmpty"><b>Thêm nguồn để bắt đầu</b><span>PDF, ảnh giáo trình, link trang khóa học, Excel, văn bản của các trung tâm khác</span><small>Kéo thả file vào đây</small></button>`}
      </section>
      <section class="rs-col rs-body" aria-label="Không gian làm việc">
        <div class="rs-head"><div class="rs-steps" role="tablist" aria-label="Các bước">${STEPS.map((x, i) => `<button type="button" role="tab" data-i="${i}" aria-selected="${i === cur}">${i + 1}. ${esc(x.name)}<small>${esc(x.sub)}</small></button>`).join('')}</div>
          <button type="button" class="rs-back" id="rsBack">← Giới thiệu</button></div>
        ${busy ? `<div class="rs-busy" role="status"><span class="rs-spin"></span>${esc(busy)}… Gemini đang đọc nguồn, có thể mất 10–60 giây</div>` : ''}
        ${tmsg ? `<div class="rs-toast ${tmsg.bad ? 'bad' : ''}" role="alert">${esc(tmsg.t)}</div>` : ''}
        <div class="rs-pane">${[paneChat, paneCmp, paneDir, paneLes][cur]()}</div>
      </section>
      <section class="rs-col rs-right" aria-label="Ghi chú và quy trình">
        <h3>Quy trình</h3><ol class="rs-flow">${stat().map((x, i) => `<li class="${i === cur ? 'on' : ''}" data-go="${i ? i : 0}"><span class="dot ${x[2]}">${x[2] === 'ok' ? '✓' : x[2] === 'warn' ? '!' : '○'}</span><span>${x[0]}</span><span class="st">${esc(x[1])}</span></li>`).join('')}</ol>
        <h3 style="margin-top:18px">Ghi chú <span class="muted">${P.notes.length}</span></h3>
        <div class="rs-notes">${P.notes.slice().reverse().map(n => `<div class="rs-note-it"><div class="rs-md">${md(n.text)}</div><div class="rs-row"><small class="muted">${new Date(n.at).toLocaleString('vi-VN')}</small><button type="button" class="rs-x" data-delnote="${n.id}" aria-label="Xóa ghi chú">×</button></div></div>`).join('') || '<p class="muted">Bấm "Lưu ghi chú" dưới câu trả lời để giữ lại ý hay.</p>'}</div>
      </section>`;
    wire(box);
  }
  function paneChat() {
    const msgs = P.chat.map((m, i) => m.role === 'user' ? `<div class="rs-msg me">${esc(m.text)}</div>` : `<div class="rs-msg ai"><div class="rs-md">${md(m.text)}</div><button type="button" class="rs-mini" data-note="${i}">Lưu ghi chú</button></div>`).join('');
    const sugg = ['Tóm tắt điểm chính của từng nguồn', 'Các trung tâm dạy bao nhiêu buổi, mỗi buổi bao lâu?', 'Lộ trình ngữ pháp của họ xếp theo thứ tự nào?', 'Điểm yếu / khoảng trống mà PLS có thể làm tốt hơn?'];
    return `<div class="rs-chat">${msgs || `<div class="rs-empty"><b>Hỏi gì về các nguồn cũng được</b><p class="muted">Câu trả lời chỉ dựa trên nguồn đang chọn ở cột trái, kèm trích dẫn.</p><div class="rs-chips">${sugg.map(s => `<button type="button" class="rs-chip" data-ask="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>`}</div>
      <form class="rs-ask" id="rsAsk"><textarea id="rsQ" rows="2" placeholder="${P.sources.length ? 'Hỏi về các nguồn… (Enter để gửi)' : 'Thêm nguồn ở cột trái trước'}"></textarea><button type="submit" class="btn primary" ${busy ? 'disabled' : ''}>Hỏi</button></form>
      ${P.chat.length ? '<button type="button" class="rs-mini" id="rsChatClr">Xóa cuộc trò chuyện</button>' : ''}`;
  }
  function paneCmp() {
    const C = P.centers.length ? P.centers : [...new Set(P.sources.map(s => s.center).filter(Boolean))];
    const cell = (c, k) => { const x = P.cells[c + '||' + k]; if (!x) return '<td class="rs-na">–</td>';
      return `<td class="${x.kind === 'fact' ? '' : 'rs-na'}" ${x.kind === 'fact' ? `title="${esc('“' + x.q + '”')}"` : ''}>${esc(x.v)}${x.kind === 'fact' ? ` <button type="button" class="rs-cite" data-src="${esc(x.src)}" title="${esc('“' + x.q + '”')}">${esc(x.src)}${x.page ? ' · tr.' + esc(x.page) : ''}</button>` : ''}</td>`; };
    return `<div class="rs-bar"><button type="button" class="btn primary" id="rsCmp" ${busy || !P.sources.length ? 'disabled' : ''}>${P.cmpAt ? 'Làm lại bảng so sánh' : 'Lập bảng so sánh'}</button>
        <span class="muted">${P.cmpAt ? 'Lập lúc ' + new Date(P.cmpAt).toLocaleString('vi-VN') : 'Gemini đọc nguồn và điền từng ô, có trích dẫn'}</span></div>
      ${C.length ? `<div class="rs-tablewrap"><table class="rs-table"><thead><tr><th>Tiêu chí</th>${C.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
        <tbody>${P.criteria.map(k => `<tr><th>${esc(k)} <button type="button" class="rs-x" data-delcrit="${esc(k)}" aria-label="Bỏ tiêu chí ${esc(k)}">×</button></th>${C.map(c => cell(c, k)).join('')}</tr>`).join('')}</tbody></table></div>` : '<p class="muted">Ghi tên trung tâm khi thêm nguồn để bảng chia cột theo trung tâm.</p>'}
      <div class="rs-row"><input id="rsCrit" placeholder="Thêm tiêu chí…"><button type="button" class="btn" id="rsCritAdd">Thêm</button></div>
      ${(P.cmpSuggest || []).length ? `<p class="muted">Gemini gợi ý thêm: ${P.cmpSuggest.map(s => `<button type="button" class="rs-chip" data-crit="${esc(s)}">+ ${esc(s)}</button>`).join(' ')}</p>` : ''}
      ${P.cmpSummary ? `<div class="rs-sum"><b>Nhận định</b><div class="rs-md">${md(P.cmpSummary)}</div><button type="button" class="rs-mini" id="rsSumNote">Lưu ghi chú</button></div>` : ''}`;
  }
  function paneDir() {
    const b = P.brief, O = P.outline;
    const f = (k, l, t, ph) => `<label class="rs-f">${l}<input data-brief="${k}" type="${t || 'text'}" value="${esc(b[k])}" placeholder="${esc(ph || '')}"></label>`;
    const rows = O ? O.lessons.map((l, i) => `<tr><td>${l.buoi}</td>${['name', 'goals', 'topics', 'vocab', 'grammar'].map(k => `<td contenteditable="true" data-ol="${i}" data-k="${k}">${esc(l[k])}</td>`).join('')}<td><span class="rs-tag ${l.basis}">${l.basis === 'fact' ? 'Có nguồn' : 'Suy luận'}</span><div class="rs-why rs-md">${md(l.why)}</div></td></tr>`).join('') : '';
    return `<div class="rs-brief">${f('lang', 'Ngôn ngữ dạy', 'text', 'Tiếng Anh, Tiếng Nhật…')}${f('level', 'Cấp độ đầu ra', 'text', 'TOEIC 450, N4, HSK 3…')}${f('audience', 'Đối tượng', 'text', 'Người đi làm mất gốc…')}${f('sessions', 'Số buổi', 'number')}${f('minutes', 'Phút / buổi', 'number')}${f('extra', 'Ghi chú thêm', 'text', 'Ưu tiên giao tiếp…')}</div>
      <div class="rs-bar"><button type="button" class="btn primary" id="rsOut" ${busy ? 'disabled' : ''}>${O ? 'Đề xuất lại khung' : 'Đề xuất khung khóa'}</button>
        ${O ? `<span class="muted">Khung v${O.ver}${O.locked ? ' · đã chốt v' + O.locked : ' · bản nháp'}</span>${O.locked !== O.ver ? '<button type="button" class="btn" id="rsLock">Chốt khung v' + O.ver + '</button>' : ''}` : '<span class="muted">Dựa trên nguồn + bảng so sánh; có thể sửa trực tiếp từng ô</span>'}</div>
      ${O ? `<p class="muted"><b>${esc(O.course.name || '')}</b> · ${esc(O.course.level || '')} – ${esc(O.course.desc || '')}</p><div class="rs-tablewrap"><table class="rs-table rs-ol"><thead><tr><th>Buổi</th><th>Tên buổi</th><th>Mục tiêu</th><th>Chủ đề</th><th>Từ vựng</th><th>Ngữ pháp</th><th>Căn cứ</th></tr></thead><tbody>${rows}</tbody></table></div>` : ''}`;
  }
  function paneLes() {
    const O = P.outline; if (!O) return '<div class="rs-empty"><b>Chưa có khung khóa</b><p class="muted">Làm bước 3. Định hướng trước, rồi quay lại soạn từng buổi.</p></div>';
    const n = Object.keys(P.lessons).length;
    const rows = O.lessons.map(l => { const L = P.lessons[l.buoi]; const bad = L ? L.issues.filter(x => x.lv === 'bad').length : 0, warn = L ? L.issues.filter(x => x.lv === 'warn').length : 0;
      const stale = L && L.ver !== O.ver;
      return `<tr><td>${l.buoi}</td><td><b>${esc(l.name)}</b><small class="muted"> · ${esc(l.type)}</small>${L ? `<div class="rs-counts">${Object.entries(L.counts).filter(([, v]) => v).map(([k, v]) => `${esc(k.replace(/^S6-/, ''))} ${v}`).join(' · ')}</div>` : ''}
        ${L && L.issues.length ? `<details class="rs-iss"><summary>${bad ? `<span class="rs-tag bad">${bad} lỗi</span>` : ''}${warn ? `<span class="rs-tag warn">${warn} lưu ý</span>` : ''}</summary><ul>${L.issues.map(x => `<li class="${x.lv}">${esc(x.t)}</li>`).join('')}</ul></details>` : ''}</td>
        <td>${!L ? '<span class="muted">Chưa soạn</span>' : stale ? '<span class="rs-tag warn">Cần xem lại – khung đã đổi</span>' : bad ? '<span class="rs-tag bad">Cần sửa</span>' : '<span class="rs-tag fact">Đã soạn</span>'}</td>
        <td class="rs-acts"><button type="button" class="btn" data-les="${l.buoi}" ${busy ? 'disabled' : ''}>${L ? 'Soạn lại' : 'Soạn'}</button>${L ? `<button type="button" class="btn" data-open="${l.buoi}">Xem slide</button>` : ''}</td></tr>`; }).join('');
    return `<div class="rs-bar"><button type="button" class="btn primary" id="rsLesAll" ${busy || n === O.lessons.length ? 'disabled' : ''}>Soạn các buổi chưa soạn</button>
        <button type="button" class="btn" id="rsXlsx" ${n ? '' : 'disabled'}>Tải Excel S5 + S6</button><span class="muted">${n}/${O.lessons.length} buổi · khung v${O.locked || O.ver}</span></div>
      <div class="rs-tablewrap"><table class="rs-table rs-les"><thead><tr><th>Buổi</th><th>Nội dung</th><th>Trạng thái</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="muted">Mỗi buổi gọi Gemini 1 lần (~20–60 giây; gói miễn phí khoảng 20 buổi/ngày, hết thì tự chuyển sang Flash-Lite). Bấm "Xem slide" để mở buổi đó ở tab Slide – soát lỗi chuẩn v2.0, hiệu ứng, sách chạy như khi nhập Excel.</p>`;
  }
  function wire(box) {
    const q = s => box.querySelector(s), qa = s => box.querySelectorAll(s);
    q('#rsBack').onclick = () => { mode = 'intro'; render(); };
    qa('.rs-steps button').forEach(b => b.onclick = () => { cur = +b.dataset.i; render(); const x = box.querySelector(`.rs-steps button[data-i="${cur}"]`); if (x) x.focus(); });
    qa('[data-go]').forEach(li => li.onclick = () => { cur = Math.min(3, +li.dataset.go); render(); });
    q('#rsAI').onclick = keyDlg;
    q('#rsProj').onchange = async e => { P = projects.find(p => p.id === e.target.value); LS.set('pls.rs.cur', P.id); render(); };
    q('#rsNew').onclick = () => { const n = prompt('Tên khóa nghiên cứu mới:', 'Khóa mới'); if (!n) return; P = newProj(n.trim()); projects.unshift(P); LS.set('pls.rs.cur', P.id); save(); render(); };
    q('#rsRen').onclick = () => { const n = prompt('Đổi tên:', P.name); if (!n) return; P.name = n.trim(); save(); render(); };
    qa('[data-on]').forEach(c => c.onchange = () => { const s = P.sources.find(x => x.id === c.dataset.on); s.on = c.checked; save(); render(); });
    qa('[data-view]').forEach(b => b.onclick = () => viewer(b.dataset.view));
    qa('.rs-cite').forEach(b => b.onclick = () => viewer(b.dataset.src));
    qa('[data-del]').forEach(b => b.onclick = () => { if (!confirm('Xóa nguồn ' + b.dataset.del + '?')) return; P.sources = P.sources.filter(s => s.id !== b.dataset.del); save(); render(); });
    [q('#rsAddBtn'), q('#rsAddEmpty')].forEach(b => b && (b.onclick = () => addDlg()));
    if (q('#rsAll')) q('#rsAll').onchange = e => { P.sources.forEach(s => { s.on = e.target.checked; }); save(); render(); };
    qa('[data-grp]').forEach(c => c.onchange = () => { P.sources.filter(s => (s.center || '') === c.dataset.grp).forEach(s => { s.on = c.checked; }); save(); render(); });
    // kéo thả file vào cột Nguồn → mở hộp Thêm nguồn với các file đó
    const left = q('.rs-left');
    left.ondragover = e => { if ([...(e.dataTransfer.types || [])].includes('Files')) { e.preventDefault(); left.classList.add('drag'); } };
    left.ondragleave = e => { if (!left.contains(e.relatedTarget)) left.classList.remove('drag'); };
    left.ondrop = e => { e.preventDefault(); left.classList.remove('drag'); const fs = [...e.dataTransfer.files]; if (fs.length) addDlg(fs); };
    qa('[data-delnote]').forEach(b => b.onclick = () => { P.notes = P.notes.filter(n => n.id !== b.dataset.delnote); save(); render(); });
    // trò chuyện
    const f = q('#rsAsk'); if (f) { const t = q('#rsQ'); const go = () => { const v = t.value.trim(); if (!v || busy) return; job('Đang trả lời', () => ask(v)); };
      f.onsubmit = e => { e.preventDefault(); go(); }; t.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); go(); } }; }
    qa('[data-ask]').forEach(b => b.onclick = () => job('Đang trả lời', () => ask(b.dataset.ask)));
    qa('[data-note]').forEach(b => b.onclick = () => { P.notes.push({ id: uid('n'), text: P.chat[+b.dataset.note].text, at: Date.now() }); save(); render(); });
    if (q('#rsChatClr')) q('#rsChatClr').onclick = () => { if (confirm('Xóa toàn bộ cuộc trò chuyện?')) { P.chat = []; save(); render(); } };
    const ch = q('.rs-chat'); if (ch) ch.scrollTop = ch.scrollHeight;
    // so sánh
    if (q('#rsCmp')) q('#rsCmp').onclick = () => job('Đang lập bảng so sánh', compare);
    const addCrit = k => { k = (k || '').trim(); if (k && !P.criteria.includes(k)) { P.criteria.push(k); P.cmpSuggest = (P.cmpSuggest || []).filter(x => x !== k); save(); render(); } };
    if (q('#rsCritAdd')) q('#rsCritAdd').onclick = () => addCrit(q('#rsCrit').value);
    qa('[data-crit]').forEach(b => b.onclick = () => addCrit(b.dataset.crit));
    qa('[data-delcrit]').forEach(b => b.onclick = () => { P.criteria = P.criteria.filter(k => k !== b.dataset.delcrit); save(); render(); });
    if (q('#rsSumNote')) q('#rsSumNote').onclick = () => { P.notes.push({ id: uid('n'), text: P.cmpSummary, at: Date.now() }); save(); render(); };
    // định hướng
    qa('[data-brief]').forEach(i => i.onchange = () => { const k = i.dataset.brief; P.brief[k] = i.type === 'number' ? Math.max(1, +i.value || 1) : i.value.trim(); save(); });
    if (q('#rsOut')) q('#rsOut').onclick = () => { if (P.outline && P.outline.locked && Object.keys(P.lessons).length && !confirm('Đề xuất khung mới sẽ đánh dấu các buổi đã soạn là "cần xem lại". Tiếp tục?')) return; job('Đang đề xuất khung khóa', outline); };
    if (q('#rsLock')) q('#rsLock').onclick = () => { P.outline.locked = P.outline.ver; log('Chốt khung v' + P.outline.ver); save(); render(); };
    qa('[data-ol]').forEach(td => td.onblur = () => { const l = P.outline.lessons[+td.dataset.ol], k = td.dataset.k, v = td.textContent.trim(); if (l[k] === v) return;
      l[k] = v; if (P.outline.locked === P.outline.ver) { P.outline.ver++; } save(); render(); });   // sửa sau khi chốt → phiên bản mới, buổi đã soạn thành "cần xem lại"
    // soạn bài
    qa('[data-les]').forEach(b => b.onclick = () => job('Đang soạn buổi ' + b.dataset.les, () => lesson(+b.dataset.les)));
    if (q('#rsLesAll')) q('#rsLesAll').onclick = () => job('Đang soạn các buổi', async () => { for (const l of P.outline.lessons) { if (P.lessons[l.buoi]) continue; busy = 'Đang soạn buổi ' + l.buoi; render(); await lesson(l.buoi); save(); } });
    if (q('#rsXlsx')) q('#rsXlsx').onclick = () => { try { const fs = exportXlsx(); toast('Đã tải ' + fs.join(' + ')); } catch (e) { toast(e.message, true); } };
    qa('[data-open]').forEach(b => b.onclick = async () => { try { await openInSlide(+b.dataset.open); } catch (e) { toast(e.message, true); } });
  }

  document.addEventListener('paste', e => { if (!document.body.classList.contains('research') || mode !== 'work' || document.querySelector('.rs-dlg')) return;
    const fs = [...((e.clipboardData && e.clipboardData.files) || [])]; if (!fs.length) return; e.preventDefault(); addDlg(fs.map((f, i) => new File([f], f.name && f.name !== 'image.png' ? f.name : `Ảnh dán ${i + 1}.png`, { type: f.type }))); });
  // cổng lệnh (Claude / kiểm thử): PLS.research.*
  root.PLS_RESEARCH = { show: render, steps: STEPS, mode: m => { if (m) { mode = m; render(); } return mode; },
    _: { AI, addDlg, summarize, load: async () => { await load(); return P; }, proj: () => P, ask, compare, outline, lesson, mergeLesson, check, booksOut, exportXlsx, openInSlide, addSource, addFiles, step: i => { cur = i; render(); } } };
  if (root.PLS) root.PLS.research = { state: () => P && { name: P.name, sources: P.sources.map(s => s.id + ' ' + s.name), centers: P.centers, outline: P.outline && P.outline.lessons.length, lessons: Object.keys(P.lessons) }, ask: q => job('Đang trả lời', () => ask(q)) };
})(typeof window !== 'undefined' ? window : globalThis);
