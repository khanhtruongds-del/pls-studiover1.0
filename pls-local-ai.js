/* PLS Studio – AI cục bộ (thử nghiệm). Tệp độc lập: không sửa dữ liệu của web, chỉ gọi model chạy trên máy người dùng
   (Ollama hoặc LM Studio) và hiển thị kết quả để soát. Gỡ bằng cách xóa thẻ <script> gọi tệp này. */
(function () {
  'use strict';
  if (window.PLS_LOCAL_AI) return;
  var LS = 'pls.localai.cfg';
  var SYSTEM = "Bạn là trợ lý biên soạn giáo trình của PLS Studio. Bạn soạn nội dung dạy ngoại ngữ cho người Việt theo đúng khuôn S0–S6 (S0 tổng quan khóa, S2 phân bổ thời lượng, S3 kho kiến thức ghép vào buổi, S5 timeline từng buổi, S6 nội dung chi tiết). Luôn trả lời bằng một JSON hợp lệ đúng schema được yêu cầu, không thêm lời dẫn. Nghĩa và giải thích viết bằng tiếng Việt tự nhiên, nội dung ngôn ngữ đích viết đúng chính tả và đúng trình độ CEFR.";
  var PRESETS = {"test": {"name": "Bài kiểm tra (S6)", "ins": "Soạn câu hỏi cho bài kiểm tra (S6-Test) của kỳ học: mỗi câu có yêu cầu, câu hỏi, phương án, đáp án, giải thích. Độ khó đúng trình độ, phủ đều kiến thức của kỳ. Trả về JSON {\"câu_hỏi\":[{\"yêu_cầu\",\"câu_hỏi\",\"đoạn_văn\",\"phương_án\",\"đáp_án\",\"giải_thích\"}]}.", "data": {"trung_tâm": "", "ngôn_ngữ": "", "loại_khóa": "", "trình_độ": "", "kỳ": "", "tên_bài_kiểm_tra": "", "mô_tả": "", "số_câu": 12}}, "sentence": {"name": "Mẫu câu (S6)", "ins": "Soạn mẫu câu giao tiếp (S6-Mẫu câu) cho buổi học: câu ngắn đúng trình độ, dùng từ vựng của bài, kèm phiên âm và nghĩa tiếng Việt. Trả về JSON {\"mẫu_câu\":[{\"mẫu_câu\",\"phiên_âm\",\"nghĩa\"}]}.", "data": {"trung_tâm": "", "ngôn_ngữ": "", "loại_khóa": "", "buổi": 3, "tên_bài": "", "tên_bài_vi": "", "trình_độ": "", "số_câu": 3, "từ_vựng_của_bài": []}}, "listening": {"name": "Bài nghe (S6)", "ins": "Soạn bài nghe (S6-Nghe) cho buổi học: script hội thoại/độc thoại đúng trình độ dùng từ vựng của bài, kèm nghĩa từng câu, và câu hỏi nghe hiểu trắc nghiệm có đáp án. Trả về JSON {\"tiêu_đề\",\"nghĩa_tiêu_đề\",\"script\":[{\"nhân_vật\",\"câu\",\"nghĩa\"}],\"câu_hỏi\":[{\"yêu_cầu\",\"câu_hỏi\",\"phương_án\",\"đáp_án\",\"giải_thích\"}]}.", "data": {"trung_tâm": "", "ngôn_ngữ": "", "loại_khóa": "", "buổi": 7, "tên_bài": "", "tên_bài_vi": "", "trình_độ": "", "tiêu_đề": "", "số_câu_script": 13, "số_câu_hỏi": 1, "từ_vựng_của_bài": []}}, "vocab": {"name": "Từ vựng (S6)", "ins": "Soạn danh sách từ vựng cho buổi học (S6-Từ vựng): từ, loại từ, nghĩa tiếng Việt, phiên âm, một câu ví dụ đúng trình độ và nghĩa câu ví dụ. Chỉ dùng từ có thật, không ghép từ mới. Không lặp từ đã dạy. Trả về JSON {\"từ_vựng\":[{\"từ\",\"loại_từ\",\"nghĩa\",\"phiên_âm\",\"ví_dụ\",\"nghĩa_ví_dụ\"}]}.", "data": {"trung_tâm": "", "ngôn_ngữ": "", "loại_khóa": "", "buổi": 10, "tên_bài": "", "tên_bài_vi": "", "trình_độ": "", "số_từ": 12, "kèm_phiên_âm": true, "từ_đã_dạy_gần_đây": []}}, "reading": {"name": "Bài đọc (S6)", "ins": "Soạn bài đọc (S6-Đọc) cho buổi học: văn bản ngắn đúng trình độ, tách từng câu kèm nghĩa, và câu hỏi đọc hiểu trắc nghiệm có đáp án và giải thích tiếng Việt. Trả về JSON {\"tiêu_đề\",\"nghĩa_tiêu_đề\",\"văn_bản\":[{\"câu\",\"nghĩa\"}],\"câu_hỏi\":[{\"câu_hỏi\",\"phương_án\",\"đáp_án\",\"giải_thích\"}]}.", "data": {"trung_tâm": "", "ngôn_ngữ": "", "loại_khóa": "", "buổi": 118, "tên_bài": "", "tên_bài_vi": "", "trình_độ": "", "tiêu_đề": "", "số_câu_văn_bản": 15, "số_câu_hỏi": 4, "từ_vựng_của_bài": []}}, "grammar": {"name": "Ngữ pháp (S6)", "ins": "Soạn mục ngữ pháp cho buổi học (S6-Ngữ pháp): nghĩa, cấu trúc (công thức), cách dùng từng ý, ghi chú/ngoại lệ, dấu hiệu nhận biết, ví dụ và nghĩa ví dụ. Chỉ dùng kiến thức đã dạy hoặc đang dạy. Trả về JSON {\"tên_ngữ_pháp\",\"nghĩa\",\"cấu_trúc\",\"cách_dùng\",\"ghi_chú\",\"dấu_hiệu\",\"ví_dụ\",\"nghĩa_ví_dụ\"}.", "data": {"trung_tâm": "", "ngôn_ngữ": "", "loại_khóa": "", "buổi": 3, "tên_bài": "", "tên_bài_vi": "", "trình_độ": "", "điểm_ngữ_pháp": "", "ngữ_pháp_đã_dạy": []}}, "btvn": {"name": "Bài tập về nhà (S6)", "ins": "Soạn bài tập về nhà (S6-BTVN) cho buổi học theo kỹ năng yêu cầu, bám đúng từ vựng và ngữ pháp của bài. Mỗi câu có yêu cầu, câu hỏi, dạng (TN_word trắc nghiệm từ, TN_sentence trắc nghiệm câu, text tự luận, record ghi âm, position sắp xếp, match_colm nối cột), phương án và đáp án nếu là trắc nghiệm. Trả về JSON {\"bài_tập\":[{\"kỹ_năng\",\"dạng\",\"yêu_cầu\",\"câu_hỏi\",\"đoạn_văn\",\"phương_án\",\"đáp_án\",\"ý_nhỏ\"}]}.", "data": {"trung_tâm": "", "ngôn_ngữ": "", "loại_khóa": "", "buổi": 1, "tên_bài": "", "tên_bài_vi": "", "trình_độ": "", "kỹ_năng": "", "số_câu": 1, "từ_vựng_của_bài": []}}, "grammar_mcq": {"name": "Trắc nghiệm ngữ pháp", "ins": "Soạn câu hỏi trắc nghiệm điền khuyết cho điểm ngữ pháp: mỗi câu gồm câu gốc đúng, câu hỏi có chỗ trống ____, đáp án đúng, 3 phương án nhiễu cùng loại (sai chia động từ/giống/cách…), và nghĩa tiếng Việt. Trả về JSON {\"câu_hỏi\":[{\"câu_gốc\",\"câu_hỏi\",\"đáp_án\",\"nhiễu\",\"nghĩa\"}]}.", "data": {"trung_tâm": "", "ngôn_ngữ": "", "loại_khóa": "", "buổi": 1, "tên_bài": "", "tên_bài_vi": "", "trình_độ": "", "điểm_ngữ_pháp": "", "cấu_trúc": "", "số_câu": 10}}, "course_outline": {"name": "Đề xuất các buổi (S3)", "ins": "Đề xuất tên và nội dung chính cho các buổi tiếp theo của khóa, nối tiếp mạch các buổi trước, đi từ dễ đến khó, không lặp chủ đề. Trả về JSON {\"buổi\":[{\"buổi\",\"tên_bài\",\"tên_bài_vi\"}]}.", "data": {"trung_tâm": "", "ngôn_ngữ": "", "loại_khóa": "", "trình_độ": "", "khóa": "", "kỳ": "", "phạm_vi_buổi": "", "số_buổi_cần_đề_xuất": 8, "bắt_đầu_từ_buổi": 13, "các_buổi_trước": []}}};
  var DEF = { base: 'http://localhost:11434/v1', model: '', maxTokens: 2048, temperature: 0.3 };
  function cfg() { try { return Object.assign({}, DEF, JSON.parse(localStorage.getItem(LS) || '{}')); } catch (e) { return Object.assign({}, DEF); } }
  function save(c) { try { localStorage.setItem(LS, JSON.stringify(c)); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var FENCE = String.fromCharCode(96, 96, 96);
  function strip(a) { a = String(a).trim(); if (a.indexOf(FENCE) === 0) a = a.replace(/^[^\n]*\n/, ''); if (a.slice(-3) === FENCE) a = a.slice(0, -3); return a.trim(); }

  async function models() {
    var c = cfg(), r = await fetch(c.base.replace(/\/+$/, '') + '/models');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    var j = await r.json(); return (j.data || []).map(function (m) { return m.id; });
  }
  async function chat(messages, opt) {
    var c = Object.assign(cfg(), opt || {});
    if (!c.model) throw new Error('Chưa chọn model');
    var r = await fetch(c.base.replace(/\/+$/, '') + '/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: c.model, messages: messages, temperature: c.temperature, max_tokens: c.maxTokens, stream: false })
    });
    if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + (await r.text()).slice(0, 200));
    var j = await r.json(); return ((j.choices || [{}])[0].message || {}).content || '';
  }
  // Soạn một khúc: dùng đúng khuôn lời nhắc đã dùng khi huấn luyện
  function buildUser(task, data) { var p = PRESETS[task]; return p.ins + '\n\nDữ liệu đầu vào:\n' + JSON.stringify(data, null, 1); }
  async function draft(task, data) {
    var t0 = Date.now(), raw = await chat([{ role: 'system', content: SYSTEM }, { role: 'user', content: buildUser(task, data) }]);
    var obj = null, err = null; try { obj = JSON.parse(strip(raw)); } catch (e) { err = 'JSON không hợp lệ: ' + e.message; }
    return { task: task, raw: raw, json: obj, error: err, secs: Math.round((Date.now() - t0) / 1000) };
  }

  var CSS = '#pla-btn{position:fixed;right:14px;bottom:14px;z-index:99998;padding:8px 12px;border-radius:999px;border:1px solid #888;background:#1f2937;color:#fff;font:600 13px system-ui;cursor:pointer;opacity:.9}' +
    '#pla-box{position:fixed;right:14px;bottom:56px;z-index:99999;width:min(560px,calc(100vw - 28px));max-height:80vh;overflow:auto;background:#fff;color:#111;border:1px solid #999;border-radius:10px;padding:12px;font:13px system-ui;box-shadow:0 8px 30px rgba(0,0,0,.3);display:none}' +
    '#pla-box label{display:block;margin:6px 0 2px;font-weight:600}#pla-box input,#pla-box select,#pla-box textarea{width:100%;box-sizing:border-box;padding:5px;font:12px ui-monospace,monospace;border:1px solid #bbb;border-radius:5px}' +
    '#pla-box textarea{height:170px}#pla-box button{padding:6px 10px;margin:6px 6px 0 0;border:1px solid #666;border-radius:6px;background:#f3f4f6;cursor:pointer}#pla-out{white-space:pre-wrap;background:#f6f6f6;padding:8px;border-radius:6px;margin-top:8px;max-height:260px;overflow:auto;font:12px ui-monospace,monospace}' +
    '@media (prefers-color-scheme:dark){#pla-box{background:#1b1d22;color:#eee;border-color:#555}#pla-box input,#pla-box select,#pla-box textarea{background:#111;color:#eee;border-color:#555}#pla-box button{background:#2a2d34;color:#eee}#pla-out{background:#111}}';

  function ui() {
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    var b = document.createElement('button'); b.id = 'pla-btn'; b.textContent = 'AI cục bộ (thử)'; document.body.appendChild(b);
    var box = document.createElement('div'); box.id = 'pla-box';
    var opts = Object.keys(PRESETS).map(function (k) { return '<option value="' + k + '">' + esc(PRESETS[k].name) + '</option>'; }).join('');
    box.innerHTML = '<b>AI cục bộ – thử nghiệm</b> <small>(chạy trên máy bạn, không gửi dữ liệu ra ngoài)</small>' +
      '<label>Địa chỉ máy chủ (Ollama: http://localhost:11434/v1 · LM Studio: http://localhost:1234/v1)</label><input id="pla-base">' +
      '<label>Model</label><div style="display:flex;gap:6px"><select id="pla-model" style="flex:1"></select><button id="pla-test" style="margin:0">Kiểm tra kết nối</button></div>' +
      '<label>Loại khúc cần soạn</label><select id="pla-task">' + opts + '</select>' +
      '<label>Dữ liệu đầu vào (JSON – sửa theo buổi cần soạn)</label><textarea id="pla-data"></textarea>' +
      '<button id="pla-run">Soạn thử</button><button id="pla-copy">Chép kết quả</button><span id="pla-st"></span><div id="pla-out"></div>';
    document.body.appendChild(box);
    var $ = function (i) { return document.getElementById(i); }, last = null;
    $('pla-base').value = cfg().base;
    function fillData() { $('pla-data').value = JSON.stringify(PRESETS[$('pla-task').value].data, null, 1); }
    fillData(); $('pla-task').onchange = fillData;
    function setModels(list) { var c = cfg(); $('pla-model').innerHTML = list.map(function (m) { return '<option' + (m === c.model ? ' selected' : '') + '>' + esc(m) + '</option>'; }).join('') || '<option value="">(chưa có)</option>'; if (!c.model && list[0]) { c.model = list[0]; save(c); } }
    if (cfg().model) setModels([cfg().model]);
    b.onclick = function () { box.style.display = box.style.display === 'block' ? 'none' : 'block'; };
    $('pla-base').onchange = function () { var c = cfg(); c.base = this.value.trim(); save(c); };
    $('pla-model').onchange = function () { var c = cfg(); c.model = this.value; save(c); };
    $('pla-test').onclick = async function () {
      $('pla-st').textContent = 'Đang kiểm tra…';
      try { var l = await models(); setModels(l); $('pla-st').textContent = 'Kết nối được · ' + l.length + ' model'; }
      catch (e) { $('pla-st').textContent = 'Không kết nối được: ' + e.message + ' (máy chủ đã bật và cho phép CORS cho trang này chưa?)'; }
    };
    $('pla-run').onclick = async function () {
      var data; try { data = JSON.parse($('pla-data').value); } catch (e) { $('pla-out').textContent = 'Dữ liệu đầu vào không phải JSON: ' + e.message; return; }
      $('pla-st').textContent = 'Đang soạn… (có thể mất vài chục giây)'; $('pla-out').textContent = '';
      try { last = await draft($('pla-task').value, data); $('pla-st').textContent = (last.error ? 'Lỗi định dạng' : 'JSON hợp lệ') + ' · ' + last.secs + ' giây';
        $('pla-out').innerHTML = (last.error ? '<b>' + esc(last.error) + '</b>\n' : '') + esc(last.json ? JSON.stringify(last.json, null, 1) : last.raw);
      } catch (e) { $('pla-st').textContent = 'Lỗi'; $('pla-out').textContent = e.message; }
    };
    $('pla-copy').onclick = function () { if (last && navigator.clipboard) navigator.clipboard.writeText(last.json ? JSON.stringify(last.json, null, 1) : last.raw); };
  }
  window.PLS_LOCAL_AI = { cfg: cfg, models: models, chat: chat, draft: draft, presets: PRESETS, system: SYSTEM };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ui); else ui();
})();
