/* PLS Studio – AI trên máy (Ollama / LM Studio). Đây là AI DUY NHẤT của web (người dùng chốt 28/10):
   · Nghiên cứu: hỏi đáp, so sánh, định hướng, soạn, soát do model "Nghiên cứu" (mặc định pls-all) làm ngay trên máy.
   · Slide: "Sửa ngay bằng AI" (tab Nhờ AI) và "Soạn cảnh" (ảnh) dùng model "Slide" (mặc định pls-tools).
   · Nút "AI trên máy": kiểm tra kết nối, chọn model cho từng phần, soạn thử từng khúc S6.
   Gọi thẳng API của Ollama (/api/chat) để đặt được độ dài ngữ cảnh theo từng việc; máy chủ khác (LM Studio) dùng chuẩn OpenAI (/v1). */
(function () {
  'use strict';
  if (window.PLS_LOCAL_AI) return;
  var LS = 'pls.localai.cfg';
  var SYSTEM = "Bạn là trợ lý biên soạn giáo trình của PLS Studio. Bạn soạn nội dung dạy ngoại ngữ cho người Việt theo đúng khuôn S0–S6 (S0 tổng quan khóa, S2 phân bổ thời lượng, S3 kho kiến thức ghép vào buổi, S5 timeline từng buổi, S6 nội dung chi tiết). Luôn trả lời bằng một JSON hợp lệ đúng schema được yêu cầu, không thêm lời dẫn. Nghĩa và giải thích viết bằng tiếng Việt tự nhiên, nội dung ngôn ngữ đích viết đúng chính tả và đúng trình độ CEFR.";
  var PRESETS = {"test": {"name": "Bài kiểm tra (S6)", "ins": "Soạn câu hỏi cho bài kiểm tra (S6-Test) của kỳ học: mỗi câu có yêu cầu, câu hỏi, phương án, đáp án, giải thích. Độ khó đúng trình độ, phủ đều kiến thức của kỳ. Trả về JSON {\"câu_hỏi\":[{\"yêu_cầu\",\"câu_hỏi\",\"đoạn_văn\",\"phương_án\",\"đáp_án\",\"giải_thích\"}]}.", "data": {"trung_tâm": "", "ngôn_ngữ": "", "loại_khóa": "", "trình_độ": "", "kỳ": "", "tên_bài_kiểm_tra": "", "mô_tả": "", "số_câu": 12}}, "sentence": {"name": "Mẫu câu (S6)", "ins": "Soạn mẫu câu giao tiếp (S6-Mẫu câu) cho buổi học: câu ngắn đúng trình độ, dùng từ vựng của bài, kèm phiên âm và nghĩa tiếng Việt. Trả về JSON {\"mẫu_câu\":[{\"mẫu_câu\",\"phiên_âm\",\"nghĩa\"}]}.", "data": {"trung_tâm": "", "ngôn_ngữ": "", "loại_khóa": "", "buổi": 3, "tên_bài": "", "tên_bài_vi": "", "trình_độ": "", "số_câu": 3, "từ_vựng_của_bài": []}}, "listening": {"name": "Bài nghe (S6)", "ins": "Soạn bài nghe (S6-Nghe) cho buổi học: script hội thoại/độc thoại đúng trình độ dùng từ vựng của bài, kèm nghĩa từng câu, và câu hỏi nghe hiểu trắc nghiệm có đáp án. Trả về JSON {\"tiêu_đề\",\"nghĩa_tiêu_đề\",\"script\":[{\"nhân_vật\",\"câu\",\"nghĩa\"}],\"câu_hỏi\":[{\"yêu_cầu\",\"câu_hỏi\",\"phương_án\",\"đáp_án\",\"giải_thích\"}]}.", "data": {"trung_tâm": "", "ngôn_ngữ": "", "loại_khóa": "", "buổi": 7, "tên_bài": "", "tên_bài_vi": "", "trình_độ": "", "tiêu_đề": "", "số_câu_script": 13, "số_câu_hỏi": 1, "từ_vựng_của_bài": []}}, "vocab": {"name": "Từ vựng (S6)", "ins": "Soạn danh sách từ vựng cho buổi học (S6-Từ vựng): từ, loại từ, nghĩa tiếng Việt, phiên âm, một câu ví dụ đúng trình độ và nghĩa câu ví dụ. Chỉ dùng từ có thật, không ghép từ mới. Không lặp từ đã dạy. Trả về JSON {\"từ_vựng\":[{\"từ\",\"loại_từ\",\"nghĩa\",\"phiên_âm\",\"ví_dụ\",\"nghĩa_ví_dụ\"}]}.", "data": {"trung_tâm": "", "ngôn_ngữ": "", "loại_khóa": "", "buổi": 10, "tên_bài": "", "tên_bài_vi": "", "trình_độ": "", "số_từ": 12, "kèm_phiên_âm": true, "từ_đã_dạy_gần_đây": []}}, "reading": {"name": "Bài đọc (S6)", "ins": "Soạn bài đọc (S6-Đọc) cho buổi học: văn bản ngắn đúng trình độ, tách từng câu kèm nghĩa, và câu hỏi đọc hiểu trắc nghiệm có đáp án và giải thích tiếng Việt. Trả về JSON {\"tiêu_đề\",\"nghĩa_tiêu_đề\",\"văn_bản\":[{\"câu\",\"nghĩa\"}],\"câu_hỏi\":[{\"câu_hỏi\",\"phương_án\",\"đáp_án\",\"giải_thích\"}]}.", "data": {"trung_tâm": "", "ngôn_ngữ": "", "loại_khóa": "", "buổi": 118, "tên_bài": "", "tên_bài_vi": "", "trình_độ": "", "tiêu_đề": "", "số_câu_văn_bản": 15, "số_câu_hỏi": 4, "từ_vựng_của_bài": []}}, "grammar": {"name": "Ngữ pháp (S6)", "ins": "Soạn mục ngữ pháp cho buổi học (S6-Ngữ pháp): nghĩa, cấu trúc (công thức), cách dùng từng ý, ghi chú/ngoại lệ, dấu hiệu nhận biết, ví dụ và nghĩa ví dụ. Chỉ dùng kiến thức đã dạy hoặc đang dạy. Trả về JSON {\"tên_ngữ_pháp\",\"nghĩa\",\"cấu_trúc\",\"cách_dùng\",\"ghi_chú\",\"dấu_hiệu\",\"ví_dụ\",\"nghĩa_ví_dụ\"}.", "data": {"trung_tâm": "", "ngôn_ngữ": "", "loại_khóa": "", "buổi": 3, "tên_bài": "", "tên_bài_vi": "", "trình_độ": "", "điểm_ngữ_pháp": "", "ngữ_pháp_đã_dạy": []}}, "btvn": {"name": "Bài tập về nhà (S6)", "ins": "Soạn bài tập về nhà (S6-BTVN) cho buổi học theo kỹ năng yêu cầu, bám đúng từ vựng và ngữ pháp của bài. Mỗi câu có yêu cầu, câu hỏi, dạng (TN_word trắc nghiệm từ, TN_sentence trắc nghiệm câu, text tự luận, record ghi âm, position sắp xếp, match_colm nối cột), phương án và đáp án nếu là trắc nghiệm. Trả về JSON {\"bài_tập\":[{\"kỹ_năng\",\"dạng\",\"yêu_cầu\",\"câu_hỏi\",\"đoạn_văn\",\"phương_án\",\"đáp_án\",\"ý_nhỏ\"}]}.", "data": {"trung_tâm": "", "ngôn_ngữ": "", "loại_khóa": "", "buổi": 1, "tên_bài": "", "tên_bài_vi": "", "trình_độ": "", "kỹ_năng": "", "số_câu": 1, "từ_vựng_của_bài": []}}, "grammar_mcq": {"name": "Trắc nghiệm ngữ pháp", "ins": "Soạn câu hỏi trắc nghiệm điền khuyết cho điểm ngữ pháp: mỗi câu gồm câu gốc đúng, câu hỏi có chỗ trống ____, đáp án đúng, 3 phương án nhiễu cùng loại (sai chia động từ/giống/cách…), và nghĩa tiếng Việt. Trả về JSON {\"câu_hỏi\":[{\"câu_gốc\",\"câu_hỏi\",\"đáp_án\",\"nhiễu\",\"nghĩa\"}]}.", "data": {"trung_tâm": "", "ngôn_ngữ": "", "loại_khóa": "", "buổi": 1, "tên_bài": "", "tên_bài_vi": "", "trình_độ": "", "điểm_ngữ_pháp": "", "cấu_trúc": "", "số_câu": 10}}, "course_outline": {"name": "Đề xuất các buổi (S3)", "ins": "Đề xuất tên và nội dung chính cho các buổi tiếp theo của khóa, nối tiếp mạch các buổi trước, đi từ dễ đến khó, không lặp chủ đề. Trả về JSON {\"buổi\":[{\"buổi\",\"tên_bài\",\"tên_bài_vi\"}]}.", "data": {"trung_tâm": "", "ngôn_ngữ": "", "loại_khóa": "", "trình_độ": "", "khóa": "", "kỳ": "", "phạm_vi_buổi": "", "số_buổi_cần_đề_xuất": 8, "bắt_đầu_từ_buổi": 13, "các_buổi_trước": []}}};
  var DEF = { base: 'http://localhost:11434/v1', model: '', on: true, research: 'pls-all', slide: 'pls-tools', maxTokens: 2048, temperature: 0.3, ctxMax: 32768 };
  function cfg() { try { return Object.assign({}, DEF, JSON.parse(localStorage.getItem(LS) || '{}')); } catch (e) { return Object.assign({}, DEF); } }
  function save(c) { try { localStorage.setItem(LS, JSON.stringify(c)); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var FENCE = String.fromCharCode(96, 96, 96);
  function strip(a) { a = String(a).replace(/<think>[\s\S]*?<\/think>/g, '').trim(); if (a.indexOf(FENCE) === 0) a = a.replace(/^[^\n]*\n/, ''); if (a.slice(-3) === FENCE) a = a.slice(0, -3); return a.trim(); }
  function trim(u) { return String(u || '').replace(/\/+$/, ''); }
  function cur(c) { return trim(c.base); }
  function base(c) { return cur(c); }
  function hostRoot(c) { return cur(c).replace(/\/v1$/, ''); }
  function isOllamaUrl(u) { u = trim(u); return /:11434(\/|$)/.test(u) || !/\/v1$/.test(u); }
  function isOllama(c) { return isOllamaUrl(cur(c)) || c.native === true; }
  function tfetch(u, o, ms) { var ac = new AbortController(), t = setTimeout(function () { ac.abort(); }, ms); return fetch(u, Object.assign({ signal: ac.signal }, o || {})).finally(function () { clearTimeout(t); }); }

  // ---------- trạng thái kết nối (kiểm tra lại mỗi 20 giây khi có việc) ----------
  var state = { ok: false, on: true, models: [], research: '', slide: '', at: 0, err: '' };
  var pending = null;
  function pickRole(c, list, role) { var want = c[role]; if (want && list.indexOf(want) >= 0) return want; var hit = list.filter(function (m) { return m.indexOf(want) === 0; })[0]; return hit || ''; }
  async function listAt(u, ms) {
    var r, list; u = trim(u);
    if (isOllamaUrl(u)) { r = await tfetch(u.replace(/\/v1$/, '') + '/api/tags', {}, ms); if (!r.ok) throw new Error('HTTP ' + r.status); list = ((await r.json()).models || []).map(function (m) { return String(m.name || m.model).replace(/:latest$/, ''); }); }
    else { r = await tfetch(u + '/models', {}, ms); if (!r.ok) throw new Error('HTTP ' + r.status); list = ((await r.json()).data || []).map(function (m) { return m.id; }); }
    return list;
  }
  async function models() {
    var l = await listAt(cfg().base, 2500);
    if (!l.length) throw new Error('không có model');
    return l;
  }
  function health(force) {
    var c = cfg();
    if (!c.on) { state = { ok: false, on: false, models: state.models, research: '', slide: '', at: Date.now(), err: 'đang tắt' }; return Promise.resolve(state); }
    if (!force && Date.now() - state.at < 20000) return Promise.resolve(state);
    if (pending) return pending;
    pending = models().then(function (list) {
      state = { ok: true, on: true, models: list, research: pickRole(c, list, 'research'), slide: pickRole(c, list, 'slide'), at: Date.now(), err: '' };
      return state;
    }).catch(function (e) {
      state = { ok: false, on: true, models: [], research: '', slide: '', at: Date.now(), err: (e && e.name === 'AbortError') ? 'hết thời gian chờ' : (e.message || String(e)) };
      return state;
    }).then(function (s) { pending = null; try { document.dispatchEvent(new CustomEvent('pls-localai', { detail: s })); } catch (e) {} return s; });
    return pending;
  }
  async function ready(role) { var s = await health(); return s.ok ? (s[role] || '') : ''; }

  // ---------- gọi model ----------
  // role: 'research' | 'slide' hoặc tên model. opt: { json, maxTokens, temperature }
  async function ask(role, messages, opt) {
    opt = opt || {}; var c = cfg();
    var model = (role === 'research' || role === 'slide') ? await ready(role) : role;
    if (!model) throw new Error('AI trên máy chưa sẵn sàng (Ollama chưa chạy hoặc chưa có model ' + (c[role] || role) + ')');
    var maxT = opt.maxTokens || c.maxTokens, t0 = Date.now(), text, cut = false;
    if (isOllama(c)) {
      var chars = messages.reduce(function (a, m) { return a + String(m.content || '').length; }, 0);
      var need = Math.ceil(chars / 2.5) + maxT + 256, ctx = Math.min(c.ctxMax, Math.max(4096, Math.ceil(need / 4096) * 4096));
      // gửi dạng stream: nhận dần từng đoạn để kết nối không bị cắt giữa chừng
      var body = { model: model, messages: messages, stream: true, keep_alive: '5m', options: { num_ctx: ctx, temperature: opt.temperature != null ? opt.temperature : c.temperature, num_predict: maxT } };
      if (opt.json) body.format = 'json';
      var r = await fetch(hostRoot(c) + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error('Ollama' + ' báo lỗi ' + r.status + ' ' + (await r.text()).slice(0, 200));
      text = ''; var rd = r.body.getReader(), dec = new TextDecoder(), buf = '', last = {};
      for (;;) { var ch0 = await rd.read(); if (ch0.done) break; buf += dec.decode(ch0.value, { stream: true });
        var lines = buf.split('\n'); buf = lines.pop();
        lines.forEach(function (ln) { if (!ln.trim()) return; var o; try { o = JSON.parse(ln); } catch (e) { return; } if (o.error) throw new Error(o.error); if (o.message && o.message.content) text += o.message.content; if (o.done) last = o; }); }
      if (buf.trim()) { try { var o2 = JSON.parse(buf); if (o2.message && o2.message.content) text += o2.message.content; if (o2.done) last = o2; } catch (e) {} }
      cut = last.done_reason === 'length';
    } else {
      var b2 = { model: model, messages: messages, temperature: c.temperature, max_tokens: maxT, stream: false };
      if (opt.json) b2.response_format = { type: 'json_object' };
      var r2 = await fetch(base(c) + '/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b2) });
      if (!r2.ok) throw new Error('HTTP ' + r2.status + ' ' + (await r2.text()).slice(0, 200));
      var j2 = await r2.json(), ch = (j2.choices || [{}])[0]; text = (ch.message || {}).content || ''; cut = ch.finish_reason === 'length';
    }
    return { text: strip(text), cut: cut, model: model, secs: Math.round((Date.now() - t0) / 1000) };
  }
  // tương thích bản cũ: chat(messages, opt) → chữ; dùng model đang chọn trong bảng, không có thì model Slide
  async function chat(messages, opt) {
    var c = cfg(), m = (opt && opt.model) || c.model || 'slide';
    return (await ask(m, messages, { maxTokens: (opt && opt.maxTokens) || c.maxTokens })).text;
  }
  function buildUser(task, data) { var p = PRESETS[task]; return p.ins + '\n\nDữ liệu đầu vào:\n' + JSON.stringify(data, null, 1); }
  async function draft(task, data) {
    var t0 = Date.now(), raw = await chat([{ role: 'system', content: SYSTEM }, { role: 'user', content: buildUser(task, data) }]);
    var obj = null, err = null; try { obj = JSON.parse(strip(raw)); } catch (e) { err = 'JSON không hợp lệ: ' + e.message; }
    return { task: task, raw: raw, json: obj, error: err, secs: Math.round((Date.now() - t0) / 1000) };
  }

  var CSS = '#pla-btn{position:fixed;right:14px;bottom:14px;z-index:99998;padding:8px 12px;border-radius:999px;border:1px solid #888;background:#1f2937;color:#fff;font:600 13px system-ui;cursor:pointer;opacity:.9}#pla-btn.ok::before{content:"● ";color:#4ade80}' +
    '#pla-box{position:fixed;right:14px;bottom:56px;z-index:99999;width:min(560px,calc(100vw - 28px));max-height:80vh;overflow:auto;background:#fff;color:#111;border:1px solid #999;border-radius:10px;padding:12px;font:13px system-ui;box-shadow:0 8px 30px rgba(0,0,0,.3);display:none}' +
    '#pla-box label{display:block;margin:6px 0 2px;font-weight:600}#pla-box input,#pla-box select,#pla-box textarea{width:100%;box-sizing:border-box;padding:5px;font:12px ui-monospace,monospace;border:1px solid #bbb;border-radius:5px}#pla-box label.chk{display:flex;gap:6px;align-items:center;font-weight:600}#pla-box label.chk input{width:auto}' +
    '#pla-box fieldset{border:1px solid #ccc;border-radius:8px;margin:8px 0;padding:6px 10px}#pla-box legend{font-weight:700;padding:0 4px}#pla-box .row{display:flex;gap:8px}#pla-box .row>div{flex:1}' +
    '#pla-box textarea{height:170px}#pla-box button{padding:6px 10px;margin:6px 6px 0 0;border:1px solid #666;border-radius:6px;background:#f3f4f6;cursor:pointer}#pla-out{white-space:pre-wrap;background:#f6f6f6;padding:8px;border-radius:6px;margin-top:8px;max-height:260px;overflow:auto;font:12px ui-monospace,monospace}' +
    '@media (prefers-color-scheme:dark){#pla-box{background:#1b1d22;color:#eee;border-color:#555}#pla-box input,#pla-box select,#pla-box textarea{background:#111;color:#eee;border-color:#555}#pla-box button{background:#2a2d34;color:#eee}#pla-out{background:#111}}';

  function ui() {
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    var b = document.createElement('button'); b.id = 'pla-btn'; b.type = 'button'; b.textContent = 'AI trên máy'; document.body.appendChild(b);
    var box = document.createElement('div'); box.id = 'pla-box';
    var opts = Object.keys(PRESETS).map(function (k) { return '<option value="' + k + '">' + esc(PRESETS[k].name) + '</option>'; }).join('');
    box.innerHTML = '<b>AI trên máy</b> <small>(chạy trên máy bạn, không gửi dữ liệu ra ngoài)</small>' +
      '<label>Địa chỉ máy chủ (Ollama: http://localhost:11434/v1 · LM Studio: http://localhost:1234/v1)</label><div class="row"><div><input id="pla-base"></div><button id="pla-test" type="button" style="margin:0">Kiểm tra kết nối</button></div><div id="pla-st2" class="muted" style="margin-top:4px"></div>' +
            '<fieldset><legend>Gắn vào web</legend><label class="chk"><input type="checkbox" id="pla-on"> Bật AI trên máy cho các phần bên dưới</label>' +
      '<div class="row"><div><label for="pla-research">Nghiên cứu – hỏi đáp, so sánh, định hướng, soạn, soát</label><select id="pla-research"></select></div>' +
      '<div><label for="pla-slide">Slide – sửa slide, soạn cảnh ảnh</label><select id="pla-slide"></select></div></div></fieldset>' +
      '<details><summary>Soạn thử một khúc S6</summary>' +
      '<label for="pla-model">Model</label><select id="pla-model"></select>' +
      '<label for="pla-task">Loại khúc cần soạn</label><select id="pla-task">' + opts + '</select>' +
      '<label for="pla-data">Dữ liệu đầu vào (JSON – sửa theo buổi cần soạn)</label><textarea id="pla-data"></textarea>' +
      '<button id="pla-run" type="button">Soạn thử</button><button id="pla-copy" type="button">Chép kết quả</button><span id="pla-st"></span><div id="pla-out"></div></details>';
    document.body.appendChild(box);
    var $ = function (i) { return document.getElementById(i); }, last = null;
    $('pla-base').value = cfg().base; $('pla-on').checked = cfg().on;
    function fillData() { $('pla-data').value = JSON.stringify(PRESETS[$('pla-task').value].data, null, 1); }
    fillData(); $('pla-task').onchange = fillData;
    function sel(id, list, cur, blank) { $(id).innerHTML = (blank ? '<option value="">' + blank + '</option>' : '') + list.map(function (m) { return '<option' + (m === cur ? ' selected' : '') + '>' + esc(m) + '</option>'; }).join(''); }
    function paint(s) {
      var c = cfg(), list = s.models.length ? s.models : [c.research, c.slide].filter(Boolean);
      sel('pla-research', list, c.research); sel('pla-slide', list, c.slide); sel('pla-model', list, c.model || c.slide);
      b.classList.toggle('ok', !!(s.ok && (s.research || s.slide))); b.textContent = 'AI trên máy';
      $('pla-st2').textContent = !s.on ? 'Đang tắt – bật lại ô bên dưới để dùng AI.' : s.ok ? 'Đang dùng Ollama trên máy này' + ' · ' + s.models.length + ' model · Nghiên cứu: ' + (s.research || 'chưa có model ' + c.research) + ' · Slide: ' + (s.slide || 'chưa có model ' + c.slide)
        : s.at ? 'Chưa kết nối được (' + s.err + '). Ollama đã chạy và đã đặt OLLAMA_ORIGINS cho trang này chưa?' : '';
    }
    document.addEventListener('pls-localai', function (e) { paint(e.detail); });
    paint(state);
    b.onclick = function () { box.style.display = box.style.display === 'block' ? 'none' : 'block'; if (box.style.display === 'block') health(true); };
    $('pla-base').onchange = function () { var c = cfg(); c.base = this.value.trim(); save(c); health(true); };
    $('pla-on').onchange = function () { var c = cfg(); c.on = this.checked; save(c); health(true); };
    $('pla-research').onchange = function () { var c = cfg(); c.research = this.value; save(c); health(true); };
    $('pla-slide').onchange = function () { var c = cfg(); c.slide = this.value; save(c); health(true); };
    $('pla-model').onchange = function () { var c = cfg(); c.model = this.value; save(c); };
    $('pla-test').onclick = function () { $('pla-st2').textContent = 'Đang kiểm tra…'; health(true); };
    $('pla-run').onclick = async function () {
      var data; try { data = JSON.parse($('pla-data').value); } catch (e) { $('pla-out').textContent = 'Dữ liệu đầu vào không phải JSON: ' + e.message; return; }
      $('pla-st').textContent = 'Đang soạn… (có thể mất vài chục giây)'; $('pla-out').textContent = '';
      try { last = await draft($('pla-task').value, data); $('pla-st').textContent = (last.error ? 'Lỗi định dạng' : 'JSON hợp lệ') + ' · ' + last.secs + ' giây';
        $('pla-out').innerHTML = (last.error ? '<b>' + esc(last.error) + '</b>\n' : '') + esc(last.json ? JSON.stringify(last.json, null, 1) : last.raw);
      } catch (e) { $('pla-st').textContent = 'Lỗi'; $('pla-out').textContent = e.message; }
    };
    $('pla-copy').onclick = function () { if (last && navigator.clipboard) navigator.clipboard.writeText(last.json ? JSON.stringify(last.json, null, 1) : last.raw); };
    health(true);
  }
  window.PLS_LOCAL_AI = { cfg: cfg, save: save, models: models, health: health, ready: ready, ask: ask, chat: chat, draft: draft, presets: PRESETS, system: SYSTEM, get state() { return state; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ui); else ui();
})();
