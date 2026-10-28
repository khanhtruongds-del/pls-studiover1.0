// PLS_IMAGES – kho ảnh Drive cho web. Luật khớp chuyển nguyên từ PLS_IMG (plugin): exact → variant → synonym; không tự điền gần nghĩa.
// Ảnh hiện bằng link lh3 (như plugin); khi xuất PPTX đọc byte qua canvas, không được thì qua Drive API (có key).
(function (root) {
  'use strict';
  const CFG = root.PLS_CONFIG || {};
  const SOURCES = { eu: { name: 'Châu Âu', brands: ['Betreux', 'Creative English', 'Créatis'] }, as: { name: 'Châu Á', brands: ['Saechang', 'Sakumi', 'Đắc Nhân'] } };
  const srcOfBrand = b => Object.keys(SOURCES).find(k => SOURCES[k].brands.includes(b)) || 'eu';
  const norm = s => String(s || '').normalize('NFC').toLowerCase().replace(/[／_]/g, '/').replace(/\s*\/\s*/g, '/').replace(/\s+/g, ' ').trim();
  const keyOf = file => { const k = String(file).normalize('NFC').replace(/\.(png|jpe?g|webp|gif)$/i, '').replace(/@\d+(\.\d+)?x$/i, '').replace(/^CAU? - /, '').replace(/ - (?:[A-Z0-9]{4,5}|D\d+[A-Z]*-\d{3})$/, '').trim(); return { label: k, base: norm(k.replace(/ \d+$/, '')) }; };
  const parseList = txt => String(txt || '').split('\n').map(l => l.split('\t')).filter(a => a[1]).map(([file, id]) => ({ file, id }));
  const CLS = /^(cái|con|chiếc|quả|trái|cuốn|quyển|tờ|đôi|bộ|cây|bông|ly|cốc|tách|sự|việc|cuộc)\s+/;
  const toks = t => norm(t).replace(/[^\p{L}\p{N}\s/]/gu, ' ').split(/[\s/]+/).filter(Boolean);
  const SYN = {};   // từ đồng nghĩa đã duyệt: '<nghĩa trong bài>': '<tên ảnh trong kho>' (vòng học ảnh sẽ đề xuất thêm)
  const url = (id, w) => 'https://lh3.googleusercontent.com/d/' + id + '=w' + (w || 600);

  const LS = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.warn('[PLS_IMAGES] không lưu được', k); } } };
  const IDX = {};
  function index(src) {
    if (IDX[src]) return IDX[src];
    const cached = LS.get('pls_img_idx_' + src);
    const list = cached && cached.list && cached.list.length ? cached.list : parseList((root.PLS_IMG_BUILT || {})[src]);
    const from = cached && cached.list ? 'cập nhật ' + cached.date : 'gói sẵn ' + ((root.PLS_IMG_BUILT || {}).date || '?');
    const map = new Map();
    for (const it of list) { const k = keyOf(it.file); if (!map.has(k.base)) map.set(k.base, []); map.get(k.base).push({ id: it.id, file: it.file, label: k.label }); }
    for (const v of map.values()) v.sort((a, b) => a.label.length - b.label.length || a.label.localeCompare(b.label));
    return (IDX[src] = { map, count: list.length, from });
  }
  async function refresh() {   // cập nhật danh sách từ Drive (mỗi máy tự làm, giống plugin)
    if (!CFG.driveKey) throw new Error('Chưa có key Drive (web/config.js)');
    const out = {};
    for (const src of Object.keys(SOURCES)) {
      const list = []; let page = '';
      do {
        const u = 'https://www.googleapis.com/drive/v3/files?q=' + encodeURIComponent("'" + CFG.folders[src] + "' in parents and trashed=false and mimeType contains 'image/'") + '&fields=nextPageToken,files(id,name)&pageSize=1000&key=' + encodeURIComponent(CFG.driveKey) + (page ? '&pageToken=' + page : '');
        const j = await (await fetch(u)).json();
        if (j.error) throw new Error('Drive: ' + j.error.message);
        for (const f of j.files || []) list.push({ file: f.name, id: f.id });
        page = j.nextPageToken || '';
      } while (page);
      LS.set('pls_img_idx_' + src, { date: new Date().toISOString().slice(0, 10), list });
      delete IDX[src]; out[SOURCES[src].name] = list.length;
    }
    return out;
  }
  function variants(word) {
    const out = new Set(); const w0 = norm(String(word).replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' '));
    const add = x => { x = norm(x); if (!x) return; out.add(x); const y = x.replace(CLS, ''); if (y && y !== x) out.add(y); };
    add(w0);
    for (const part of w0.split(/\s*(?:[,;]|\bhoặc\b)\s*/)) {
      add(part);
      const sl = part.split('/').map(x => x.trim()).filter(Boolean);
      if (sl.length > 1) { const last = sl[sl.length - 1].split(' '); const tail = last.length > 1 ? last.slice(1).join(' ') : ''; sl.forEach((x, k) => add(k < sl.length - 1 && tail && x.split(' ').length === 1 ? x + ' ' + tail : x)); }
    }
    return [...out];
  }
  function match(word, src) {
    const ix = index(src);
    const exact = ix.map.get(norm(String(word).replace(/\([^)]*\)/g, '')));
    if (exact && exact.length) return { type: 'exact', hit: exact };
    const nocls = new Map(); for (const [k, v] of ix.map) { const y = k.replace(CLS, ''); if (y !== k && !nocls.has(y)) nocls.set(y, v); }
    for (const v of variants(word)) { const h = ix.map.get(v) || nocls.get(v); if (h && h.length) return { type: 'variant', via: v, hit: h }; }
    for (const v of variants(word)) { const to = SYN[v]; const h = to && ix.map.get(norm(to)); if (h && h.length) return { type: 'synonym', via: v + ' → ' + to, hit: h }; }
    return { type: 'none', hit: [] };
  }
  function search(q, src, n) {   // gần nghĩa theo âm tiết (Dice) – chỉ GỢI Ý
    const ix = index(src); const STOP = /^(và|điều|đang|xảy|ra|của|những|các|một|cho|với|ở|trong|là|có|được|về|the|a|an|and|of|to|in)$/;   // từ nối không mang nghĩa hình → bỏ khi chấm gần nghĩa
    let qt = toks(q); const qk = qt.filter(x => !STOP.test(x)); if (qk.length) qt = qk; if (!qt.length) return [];
    const res = [];
    for (const [k, v] of ix.map) {
      const kt = toks(k); const inter = kt.filter(x => qt.includes(x)).length; if (!inter) continue;
      res.push({ label: v[0].label, id: v[0].id, score: Math.round(2 * inter / (kt.length + qt.length) * 100) / 100 });
    }
    return res.sort((a, b) => b.score - a.score || a.label.length - b.label.length).slice(0, n || 6);
  }

  function byFile(src, file) { for (const v of index(src).map.values()) { const h = v.find(x => x.file === file); if (h) return { id: h.id, label: h.label + ' (đã dùng)', score: 1 }; } return null; }
  // Cập nhật danh sách ảnh mỗi ngày (giống plugin) – chỉ khi có mạng; xong gọi cb để dựng lại
  async function autoRefresh(cb) {
    const today = new Date().toISOString().slice(0, 10);
    const c = LS.get('pls_img_idx_eu'); const built = (root.PLS_IMG_BUILT || {}).date;
    if ((c && c.date === today) || built === today || !CFG.driveKey) return false;
    try { const r = await refresh(); if (cb) cb(r); return r; } catch (e) { console.warn('[PLS_IMAGES] không cập nhật được danh sách ảnh:', e.message); return false; }
  }
  // ---------- GÓI TẠO ẢNH (F.STYLE, F.STYLE_DESC, "GÓI PHÔI + PROMPT" trong hướng dẫn Storage Data) ----------
  const STYLE = { eu: [['bác sĩ', '1z-cwAgR66yEKQUCSjm-Qn-aa0ZkeT1eD'], ['táo', '1MMk4fYjpBex5Cl4RB4pSMLJC9RETKh3t'], ['nhà', '1CFyF1KNwxR3hOCIpR-2CSX13_6GgZXnO']],
    as: [['bác sĩ', '1czLm78iHMnt-LrsvnfqYPKwspW9xiQ8Y'], ['táo', '1kB832K1fNtMDIb3kuczOpxctc_lnMJKB'], ['nhà', '1TtJxXkaXvzE4NNlOlyXPky6wR78hqNdv']] };
  const STYLE_DESC = {
    eu: 'Tranh minh hoạ 3D bóng mềm kiểu hoạt hình, viền tối mảnh, màu tươi bão hoà, ánh sáng dịu từ trên trái, bóng đổ nhẹ trong vật thể, nền trong suốt, không chữ, một đối tượng chính căn giữa.',
    as: 'Tranh minh hoạ 2D phong cách anime, nét viền rõ, màu phẳng tươi, bóng đổ đơn giản, nền trong suốt, không chữ, một đối tượng chính căn giữa.'   // RB-CH-06: Châu Á = 2D anime
  };
  function ratio(w, h) { const r = w / h; const C = [[1, '1:1'], [4 / 3, '4:3'], [3 / 4, '3:4'], [16 / 9, '16:9'], [9 / 16, '9:16'], [3 / 2, '3:2'], [2 / 3, '2:3']]; return C.reduce((b, c) => Math.abs(Math.log(r / c[0])) < Math.abs(Math.log(r / b[0])) ? c : b)[1]; }
  // MÔ TẢ CẢNH (người dùng 28/10): prompt phải nói rõ hình đang thiếu vẽ CÁI GÌ – lấy từ chính dữ liệu của ô (từ, nghĩa, câu ví dụ, chủ đề slide)
  const isSent = t => /[.!?。！？]$/.test(String(t || '').trim()) || String(t || '').trim().split(/\s+/).length >= 6;
  function sceneOf(word, ctx) {
    ctx = ctx || {}; const senses = String(word || '').split(/\s*(?:[;,/]|\bhoặc\b)\s*/).map(s => s.trim()).filter(Boolean);
    const main = senses[0] || word || '';
    const sent = ctx.ex ? { t: ctx.ex, vi: ctx.exVi } : (ctx.term && isSent(ctx.term) ? { t: ctx.term, vi: ctx.vi } : (isSent(main) ? { t: '', vi: main } : null));
    const c = cons(sent ? (sent.vi || main) : main);
    const who = c.sex ? (c.sex === 'f' ? 'một nhân vật nữ' : 'một nhân vật nam') : c.person ? 'một nhân vật' : '';
    const out = [];
    const L = ctx.lines || [];
    if (L.length >= 2 && L.some(x => x.who)) {   // hội thoại
      const who = [...new Set(L.map(x => x.who).filter(Boolean))];
      out.push(`Cảnh ${who.length || 2} người đang nói chuyện với nhau (${who.join(', ') || 'A, B'}), đúng nội dung lời thoại: ` + L.map(x => `${x.who ? x.who + ': ' : ''}"${x.vi || x.t}"`).join(' ') + '. Thể hiện rõ tuổi, giới tính, nơi chốn và hành động suy ra từ lời thoại; hai nhân vật nhìn nhau, nét mặt đúng cảm xúc câu nói.');
      if (ctx.situation || ctx.slide) out.push(`Tình huống: ${ctx.situation || ctx.slide}.`);
      if (ctx.title) out.push(`Chủ đề bài: «${ctx.title}».`);
      return out.join(' ');
    }
    if (L.length || ctx.para) {   // câu / đoạn văn
      const txt = ctx.para || L.map(x => x.vi || x.t).join(' ');
      out.push(`Minh hoạ đúng nội dung: "${txt.slice(0, 300)}${txt.length > 300 ? '…' : ''}". Vẽ nhân vật, nơi chốn, đồ vật được nhắc tới.`);
      if (ctx.slide) out.push(`Slide: «${ctx.slide}».`);
      return out.join(' ');
    }
    if (ctx.topic) { out.push(`Một cảnh tiêu biểu cho chủ đề «${ctx.vi || main}»${ctx.term && ctx.term !== (ctx.vi || main) ? ' (' + ctx.term + ')' : ''}: bối cảnh, nhân vật và đồ vật đặc trưng nhất của chủ đề, đủ rõ để làm ảnh mở đầu bài.`); return out.join(' '); }
    if (sent) out.push(`Vẽ đúng tình huống của câu${sent.t ? ' «' + sent.t + '»' : ''}${sent.vi ? ' (nghĩa: ' + sent.vi + ')' : ''}: thể hiện rõ ai, đang làm gì, ở đâu, với đồ vật chính nào.`);
    else if (who) out.push(`${who[0].toUpperCase() + who.slice(1)}${c.roles.length ? ' (' + c.roles.join(', ') + ')' : ''} với trang phục, đạo cụ hoặc hành động đặc trưng để nhìn vào là nhận ra ngay «${main}».`);
    else out.push(`Một đồ vật hoặc một cảnh cụ thể, điển hình nhất của «${main}», để người học nhìn vào là đoán ra ngay nghĩa «${main}». Không dùng biểu tượng chung chung hay sơ đồ.`);
    if (senses.length > 1 && !sent) out.push(`Chỉ minh hoạ nghĩa «${main}» (không vẽ các nghĩa khác: ${senses.slice(1).join(', ')}).`);
    if (ctx.title && norm(ctx.title) !== norm(main)) out.push(`Hợp chủ đề «${ctx.title}».`);
    return out.join(' ');
  }
  function stylePack(word, brand, o) {
    o = o || {}; const src = srcOfBrand(brand); const ctx = o.ctx || {};
    const near = search(word, src, 1)[0];
    const r = o.w && o.h ? ratio(o.w, o.h) : '1:1';
    const scene = String(o.desc || '').trim() || sceneOf(word, ctx);
    const vi = ctx.vi && ctx.vi !== ctx.term ? ctx.vi : word;
    const term = ctx.term && ctx.term !== vi ? `«${ctx.term}»${ctx.ipa ? ' ' + ctx.ipa : ''} = ` : '';
    const prompt = `NỘI DUNG CẦN VẼ\n`
      + `- Minh hoạ cho: ${term}${vi}\n`
      + `- Cảnh: ${scene}\n`
      + `- Bối cảnh: ${o.bai || 'bài học'}${o.level ? ', ' + o.level : ''}${ctx.slide ? ' · slide «' + ctx.slide + '»' : ''}.\n`
      + `\nPHONG CÁCH\nDùng ${STYLE[src].length} ảnh đính kèm làm mẫu phong cách: giữ nét vẽ, độ dày viền, bảng màu. ${STYLE_DESC[src]}\n`
      + `\nKỸ THUẬT\nKhung ${r}. Nền trong suốt, không chữ, không số, không bóng đổ ra ngoài, 1 đối tượng hoặc 1 cảnh chính.`;
    return { prompt, scene, ratio: r, kho: src === 'eu' ? 'Châu Âu (3D)' : 'Châu Á (2D anime)', refs: STYLE[src].map(([label, id]) => ({ label, id, url: url(id, 1200) })), near: near ? Object.assign({ url: url(near.id, 1200) }, near) : null };
  }
  // ngữ cảnh 1 ô ảnh: các ô chữ cùng mục (vocab_3.de / .ipa / .vi / .ex…); ô ảnh lớn của slide → tiêu đề, tình huống, lời thoại / đoạn văn trên slide
  function ctxOf(el, host, data) {
    const p = el.parentElement, item = p && /_(\d+|[A-H])$/.test(p.dataset.n || '');
    const all = {}; host.querySelectorAll('[data-filled]').forEach(x => { const t = x.textContent.trim(); if (t && x.offsetParent !== null && !(x.dataset.filled in all)) all[x.dataset.filled] = t; });
    const f = {}; (item ? [...p.querySelectorAll('[data-filled]')].map(x => x.dataset.filled) : Object.keys(all).filter(k => !/_(\d+|[A-H])\./.test(k))).forEach(k => { const t = all[k]; if (!t) return; const s = k.split('.').pop(); if (!(s in f)) f[s] = t; });
    const pick = re => { const k = Object.keys(f).find(k => re.test(k)); return k ? f[k] : ''; };
    data = data || {};
    const head = k => all[k] || String(data[k] || '').trim();
    const c = { topic: !item, term: pick(/^(de|zh|word|term|en|ja|ko|fr|kanji|hanzi)$/), ipa: pick(/^(ipa|pinyin|py|reading)$/), vi: pick(/^(vi|mean|meaning)$/),
      ex: pick(/^(ex|example|sentence)$/), exVi: pick(/^(ex_vi|example_vi)$/),
      title: head('header.topic') || String(data.topic || '').trim(), slide: head('title') || head('situation') || head('title.de') || head('track') || head('header.section') };
    if (!item) {   // lời thoại / câu / đoạn trên slide (line_1.de + line_1.vi + line_1.who…)
      const by = {}; for (const [k, t] of Object.entries(all)) { const m = k.match(/^([a-z]+_\d+)\.(\w+)$/); if (!m) continue; (by[m[1]] = by[m[1]] || {})[m[2]] = t; }
      c.lines = Object.entries(by).sort((a, b) => (+a[0].split('_')[1]) - (+b[0].split('_')[1])).map(([, o]) => ({ who: o.who || o.sp || o.speaker || o.key || '', t: o.de || o.en || o.zh || o.text || o.ja || o.ko || o.fr || '', vi: o.vi || '' })).filter(x => x.t || x.vi).slice(0, 8);
      c.para = pick(/^(para|text|body|passage)$/) || '';
      c.situation = head('situation') || head('task') || '';
      if (c.lines.length || c.para) c.topic = false;   // slide có nội dung cụ thể → vẽ theo nội dung, không phải ảnh chủ đề chung
    }
    return c;
  }

  // ---------- gắn ảnh vào slide đã dựng ----------
  // Ô ảnh: nghĩa lấy từ ô ".vi" cùng mục (vd vocab_3.img ↔ vocab_3.vi), giống PLS_IMG.fill. Ghi đè: data['img:<ô>'] = 'id:<driveId>' | '<từ cần tìm>' | '-' (bỏ ảnh)
  // Câu dài / có người (luật ảnh ngữ cảnh fit 2.6c): không tự khớp gần nghĩa → để người chọn.
  // Ràng buộc ngữ cảnh ảnh (fit 2.6c: PERSON, imgCons, whoOk) – meta "Ai" từ Sheet IMAGES_META (img-meta.js)
  const PERSON = [[/(^|[^\p{L}])(mẹ|má|bà mẹ|cô|chị|dì|mợ|thím|bà|em gái|con gái|cháu gái|vợ|phụ nữ|nữ|cô giáo|bạn gái|nữ sinh|y tá|bà ngoại|bà nội|chị gái|cô gái|bé gái)(?=[^\p{L}]|$)/iu, 'f'],
    [/(^|[^\p{L}])(bố|ba|cha|ông|chú|cậu|dượng|anh|em trai|con trai|cháu trai|chồng|đàn ông|nam|thầy|thầy giáo|bạn trai|nam sinh|ông ngoại|ông nội|anh trai|chàng trai|bé trai)(?=[^\p{L}]|$)/iu, 'm'],
    [/(^|[^\p{L}])(tôi|bạn|người|em|con|cháu|học sinh|sinh viên|bé|em bé|trẻ em|trẻ con|gia đình|mọi người|giáo viên|bác sĩ|nhân viên|khách|bạn bè|họ|chúng tôi)(?=[^\p{L}]|$)/iu, 'x']];
  function cons(ctx) {
    const c = String(ctx || '').normalize('NFC').toLowerCase(); const r = { person: false, sex: null, roles: [] };
    const sexes = new Set();
    for (const [re, sx] of PERSON) { const m = c.match(re); if (m) { r.person = true; r.roles.push(m[2]); if (sx !== 'x') sexes.add(sx); } }
    r.sex = sexes.size === 1 ? [...sexes][0] : null;   // "ông hoặc bà" → không ép giới
    const first = c.split(/\s*(?:[;,/(]|\bhoặc\b)\s*/)[0];   // nghĩa nhiều phương án ("anh trai; em trai") không phải câu
    r.sentence = /(^|[^\p{L}])(tôi|đang|sẽ|đã|mỗi|hôm nay|hàng ngày|thường|rất|vì|nên|khi)(?=[^\p{L}]|$)/u.test(first) || first.split(/\s+/).length >= 4;
    return r;
  }
  function whoOk(id, c) {
    if (!c.person) return { ok: true };
    const w = (root.PLS_IMG_META || {})[id]; if (!w) return { ok: true, soat: 'ảnh chưa có meta "Ai" – cần soát' };
    const ws = String(w).split(/[|,]/); const hasF = ws.some(x => x === 'f' || x === 'g'), hasM = ws.some(x => x === 'm' || x === 'b'), none = ws.every(x => x === '0' || x === 'h');
    if (none) return c.sex ? { ok: true, soat: 'ảnh không có người – nghĩa có ' + c.roles.join('/') } : { ok: true };
    if (c.sex === 'f' && !hasF && hasM) return { ok: false, why: 'ảnh là nam – cần nữ (' + c.roles.join('/') + ')' };
    if (c.sex === 'm' && !hasM && hasF) return { ok: false, why: 'ảnh là nữ – cần nam (' + c.roles.join('/') + ')' };
    if (ws.some(x => x === 'mix' || x === 'x') && c.sex) return { ok: true, soat: 'ảnh nhiều người / không rõ' };
    return { ok: true };
  }
  function setImg(el, id, how, label) {
    el.classList.remove('pls-imgslot'); el.classList.remove('pls-imgempty');
    el.style.backgroundImage = `url("${/^(data:|blob:)/.test(id) ? id : url(id, 800)}")`; el.style.backgroundSize = 'contain'; el.style.backgroundRepeat = 'no-repeat'; el.style.backgroundPosition = 'center';
    el.style.backgroundOrigin = 'content-box'; el.style.padding = '0px';   // ảnh đã có: bỏ nền mờ + lề, ảnh to hết ô (contain giữ tỉ lệ) – người dùng chốt 23/10
    el.style.backgroundColor = 'transparent'; el.style.boxShadow = 'none';
    el.dataset.imgId = id; el.dataset.imgHow = how; el.dataset.imgName = label || '';
  }
  function slotsOf(host) {
    return [...host.querySelectorAll('.pls-imgslot, [data-img-id]')].filter(e => e.offsetParent !== null || e.dataset.imgId);
  }
  function wordFor(el) {
    const p = el.parentElement; if (!p) return '';
    const vi = [...p.querySelectorAll('[data-filled]')].find(x => /(^|\.)vi$/.test(x.dataset.filled));
    return vi ? vi.textContent.trim() : '';
  }
  // deck: { count: {id: số slide đã dùng} } dùng chung cả bài → 1 ảnh tối đa 2 slide (luật ảnh lặp của fit_js)
  function fill(host, brand, data, deck) {
    const src = srcOfBrand(brand); const used = new Set(); const report = []; deck = deck || { count: {} };
    data = data || {};
    for (const el of slotsOf(host)) {
      const name = el.dataset.n; const ownKey = Object.keys(data).find(k => k.startsWith('img:') && (k.slice(4) === name || k.slice(4).endsWith('.' + name) && el.parentElement && k.slice(4).startsWith((el.parentElement.dataset.n || '') + '.')));
      const ov = ownKey && data[ownKey] != null ? String(data[ownKey]) : null;
      const pn0 = el.parentElement && el.parentElement.dataset.n;
      const inItem = pn0 && /_(\d+|[A-H])$/.test(pn0);
      // Luật ảnh ngữ cảnh (fit 4.4): ô ảnh trong mục đánh số (thẻ từ vựng…) tự tìm theo nghĩa; ảnh lớn của slide (bìa, hội thoại, đọc…) chỉ có khi spec ghi img:<ô>
      // ẢNH CHỦ ĐỀ (người dùng 25/10): bìa / khởi động / mục mở đầu không ghi img: → tự tìm theo CHỦ ĐỀ bài (tiêu đề slide); thẻ từ 1 từ → theo nghĩa của thẻ
      const comp = host.dataset.comp || '', topicSlot = !inItem && /^Slide\/(Cover|Lead In|Section|Section Character|Agenda|Lesson Overview)$/.test(comp);
      const oneVi = !inItem && !topicSlot ? [...host.querySelectorAll('[data-filled]')].filter(x => /(^|\.)(vi|mean)$/.test(x.dataset.filled) && x.offsetParent !== null) : [];
      const topicQ = topicSlot ? String(data['title.de'] || data.title || data.topic || data.lesson_title || '').replace(/^(khởi động|warm[- ]?up|lead[- ]?in|mở đầu)\s*:\s*/i, '').replace(/\s*…$/, '').trim() : '';
      const word = inItem ? wordFor(el) : oneVi.length === 1 ? oneVi[0].textContent.trim() : topicQ;
      const pn = el.parentElement && el.parentElement.dataset.n;
      let res = { slot: name, key: pn && /_(\d+|[A-H])$/.test(pn) ? pn + '.' + name : name, word, type: 'none', cands: [] };
      if (ov === '-') { res.type = 'removed'; }
      else if (ov && ov.startsWith('data:')) { setImg(el, ov, 'user', 'ảnh tải lên'); res.type = 'user'; res.label = 'Ảnh tải lên từ máy'; }
      else if (ov && ov.startsWith('id:')) { setImg(el, ov.slice(3), 'user', ''); res.type = 'user'; res.id = ov.slice(3); deck.count[res.id] = (deck.count[res.id] || 0) + 1; }
      else {
        const q = ov || word;
        const c = cons(q), topic = !!topicQ;   // ô ảnh chủ đề (bìa / khởi động…): ghi sẵn từ khoá mà kho không có → vẫn tìm theo chủ đề
        if (q && (topic || !(c.sentence && !ov))) {   // câu → không tự khớp, để người chọn (chủ đề bài: vẫn tự tìm)
          let m = match(q, src); const why = [];
          if (!m.hit.length && ov && word && word !== ov) { const mw = match(word, src); if (mw.hit.length) m = Object.assign(mw, { via: word }); }   // từ ghi sẵn (vd tiếng Anh "closed") không có trong kho → tìm theo nghĩa tiếng Việt của thẻ
          if (topic && !m.hit.length) for (const part of [topicQ].concat(topicQ.split(/\s*(?:\bvà\b|\bhoặc\b|[,;:–—\-&+/])\s*/).map(x => x.trim()).filter(x => x.length > 1))) { const mm = match(part, src); if (mm.hit.length) { m = Object.assign(mm, { via: part }); break; } }
          if (topic && !m.hit.length) { const best = (search(q, src, 6).length ? search(q, src, 6) : search(topicQ, src, 6)).concat(search(topicQ, src, 6)).find(x => x.score >= 0.3 && !used.has(x.id)); if (best) m = { type: 'near', via: 'gần nghĩa chủ đề', hit: [{ id: best.id, label: best.label }] }; }
          const okHits = m.hit.filter(h => { const w = whoOk(h.id, c); if (!w.ok) why.push(w.why); return w.ok; });
          const hit = okHits.find(h => !used.has(h.id) && (topic || (deck.count[h.id] || 0) < 2));   // ảnh chủ đề: bìa + khởi động dùng chung được
          if (!hit && okHits.length) why.push('ảnh "' + okHits[0].label + '" đã dùng ở 2 slide');
          if (hit) { const w = whoOk(hit.id, c); setImg(el, hit.id, m.type, hit.label); used.add(hit.id); deck.count[hit.id] = (deck.count[hit.id] || 0) + 1; res = Object.assign(res, { type: m.type, id: hit.id, label: hit.label, via: m.via, soat: w.soat }); }
          else if (why.length) res.why = why[0];
        } else if (q) res.why = 'câu / cụm dài – không tự chọn ảnh';
        if ((res.type === 'none' || topic) && q) {   // chủ đề bài: dù đã tự gắn vẫn có 6 ảnh gần nghĩa để đổi
          res.cands = search(q, src, 6); if (res.cands.length < 6 && word && word !== q) res.cands = res.cands.concat(search(word, src, 6).filter(x => !res.cands.some(y => y.id === x.id))).slice(0, 6);
          const prev = ((root.PLS_IMG_PREV || {})[src + '|' + norm(q)] || []).map(f => byFile(src, f)).filter(Boolean);   // ảnh từng chọn trên Figma → gợi ý đầu
          if (prev.length) res.cands = prev.map(p => Object.assign({ prev: true }, p)).concat(res.cands.filter(c => !prev.some(p => p.id === c.id))).slice(0, 6);
        }
        if (res.type === 'none') el.dataset.imgLabel = q ? `Thiếu hình: ${q}` + (res.why ? ` (${res.why})` : '') : (inItem ? 'Thiếu hình' : 'Ảnh minh hoạ – ghi img:' + name + ' trong dữ liệu');
        if (res.type === 'none' && !q && !inItem) { el.classList.remove('pls-imgslot'); el.classList.add('pls-imgempty'); res.type = 'empty'; }   // ảnh lớn không ghi trong dữ liệu: để trống có chủ đích (luật fit 4.4), không tính thiếu hình
      }
      if (res.type === 'none' || res.type === 'empty') res.ctx = ctxOf(el, host, data);
      el.dataset.imgReport = JSON.stringify({ type: res.type, word }); el.dataset.imgKey = res.key;
      report.push(res);
    }
    return report;
  }

  // byte ảnh để nhúng PPTX: canvas (cần CORS) → không được thì Drive API alt=media
  async function bytes(urlStr) {
    const id = (urlStr.match(/\/d\/([^=/?]+)/) || [])[1];
    const toPng = async src => { const im = new Image(); im.crossOrigin = 'anonymous'; im.src = src; await im.decode(); const cv = document.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight; cv.getContext('2d').drawImage(im, 0, 0); const b = await new Promise(r => cv.toBlob(r, 'image/png')); return new Uint8Array(await b.arrayBuffer()); };
    try { return await toPng(urlStr); }
    catch (e) {
      if (!id || !CFG.driveKey) throw e;
      const r = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${encodeURIComponent(CFG.driveKey)}`);
      if (!r.ok) throw new Error('Drive ' + r.status);
      const bu = URL.createObjectURL(await r.blob()); try { return await toPng(bu); } finally { URL.revokeObjectURL(bu); }
    }
  }

  root.PLS_IMAGES = { stylePack, sceneOf, autoRefresh, fill, cons, whoOk, match, search, variants, refresh, index, url, bytes, srcOfBrand, stats: () => Object.fromEntries(Object.keys(SOURCES).map(s => [s, { count: index(s).count, from: index(s).from }])) };
})(window);
