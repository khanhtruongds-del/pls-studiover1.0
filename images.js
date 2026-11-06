// PLS_IMAGES – kho ảnh Drive cho web. Luật khớp chuyển nguyên từ PLS_IMG (plugin): exact → variant → synonym; không tự điền gần nghĩa.
// Ảnh hiện bằng link lh3 (như plugin); khi xuất PPTX đọc byte qua canvas, không được thì qua Drive API (có key).
(function (root) {
  'use strict';
  const CFG = root.PLS_CONFIG || {};
  const SOURCES = { eu: { name: 'Châu Âu', brands: ['Betreux', 'Creative English', 'Créatis'] }, as: { name: 'Châu Á', brands: ['Saechang', 'Sakumi', 'Đắc Nhân'] } };
  const srcOfBrand = b => Object.keys(SOURCES).find(k => SOURCES[k].brands.includes(b)) || 'eu';
  const norm = s => String(s || '').normalize('NFC').toLowerCase().replace(/[／_]/g, '/').replace(/\s*\/\s*/g, '/').replace(/\s+/g, ' ').trim();
  const keyOf = file => { const k = String(file).normalize('NFC').replace(/\.(png|jpe?g|webp|gif)$/i, '').replace(/@\d+(\.\d+)?x$/i, '').replace(/^CAU? - /, '').replace(/ - (?:[A-Z0-9_-]{4,5}|D\d+[A-Z]*-\d{3})$/, '').trim(); return { label: k, base: norm(k.replace(/ \d+$/, '').replace(/\s*[（(][^)）]*[)）]\s*/g, ' ')) }; };   // 6/11: mã có _ / - (1D_FQ) + bỏ chữ Hán trong ngoặc khi so tên (ảnh HSK2 "Bắc Kinh (北京)" trước không bao giờ khớp)
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
      res.push({ label: v[0].label, id: v[0].id, score: Math.round(2 * inter / (kt.length + qt.length) * (inter < qt.length ? 0.8 : 1) * 100) / 100 });   // 6/11: chỉ trùng 1 phần chữ gõ ("đấu vật" khi gõ "động vật") → hạ
    }
    for (const x of i18search(q, src)) { const o = res.find(y => y.id === x.id); if (o) o.score = Math.max(o.score, x.score); else res.push(x); }   // + tên 7 thứ tiếng, thẻ nội dung (5/11)
    return res.sort((a, b) => b.score - a.score || a.label.length - b.label.length).slice(0, n || 6);
  }

  // GỢI Ý ẢNH CLIP tính sẵn (tools/clip_web.py → clip/goi-y.json, người dùng chốt 28/10: không tải mô hình về trình duyệt).
  // Tra theo từ / nghĩa của thẻ; khớp tên ảnh vẫn ưu tiên – CLIP bù chỗ tên ảnh không khớp (điểm cao mới tự gắn, còn lại chỉ gợi ý đầu danh sách).
  let CLIP = null;
  const clipReady = (typeof fetch === 'function' && typeof location !== 'undefined' && /^https?:/.test(location.protocol))
    ? fetch('clip/goi-y.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(j => { CLIP = j; return j; }).catch(() => null) : Promise.resolve(null);
  const clipKey = t => String(t || '').normalize('NFC').replace(/\([^)]*\)/g, '').split(/[;；]/)[0].trim().replace(/[ ,.]+$/, '').toLowerCase();
  const LBL = {};
  function labelOf(id, src) { if (!LBL[src]) { LBL[src] = new Map(); for (const v of index(src).map.values()) v.forEach(x => LBL[src].set(x.id, x.label)); } return LBL[src].get(id) || ''; }
  function clip(q, src, word) {
    if (!CLIP || !CLIP.q) return [];
    for (const t of [q, word]) { const k = clipKey(t); if (!k) continue; const qq = (CLIP.w && CLIP.w[k]) || (CLIP.q[k] ? k : null); const e = qq && CLIP.q[String(qq).toLowerCase()];
      if (e && e[src]) return e[src].map(([id, sc]) => ({ id, label: labelOf(id, src), score: sc, clip: true, q: qq })).filter(x => x.label); }   // ảnh không còn trong danh sách Drive → bỏ
    return [];
  }
  // TÌM ẢNH BẰNG 7 THỨ TIẾNG (người dùng 5/11) – tools/clip_i18n.py → clip/ten-anh.json, không tải mô hình:
  //  c = khái niệm [vi, en, de, fr, zh, ja, ko] · i = { id ảnh: khái niệm của tên } · t = { id ảnh: [khái niệm thẻ nội dung (máy gắn)] }
  let I18 = null, I18M = null; const IDE = {};
  const i18Ready = (typeof fetch === 'function' && typeof location !== 'undefined' && /^https?:/.test(location.protocol))
    ? fetch('clip/ten-anh.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(j => { I18 = j; I18M = null; return j; }).catch(() => null) : Promise.resolve(null);
  // KHOÁ GẦN (6/11 thử tìm thật: "doctor" không ra vì bảng là "doctors", "Arzt" ≠ "Ärzte", "りんご" ≠ "リンゴ"): bỏ dấu Latin, hiragana → katakana, bỏ đuôi số nhiều
  const loose = x => { let t = norm(x).replace(/[\u3041-\u3096]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60));
    if (/^[a-zà-ÿœæß' -]+$/i.test(t) && !/[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/.test(t)) t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss').split(' ').map(w => w.length > 4 ? w.replace(/(es|en|e|s|n)$/, '') : w).join(' ');
    return '~' + t; };
  const phOf = (m, p) => { const a = m.ph.get(p), b = m.ph.get(loose(p)); if (!a || !b) return a || b; const u = new Set([...a, ...b]); return new Set([...u].sort((x, y) => m.hand.has(y) - m.hand.has(x))); };   // khớp đúng + khớp gần, nghĩa dịch tay trước
  // HỒ SƠ NHIỀU LỚP (6/11 – tools/clip_layers.py): lớp 3 thuộc nhóm (WordNet + CLIP xác nhận), lớp 4 thấy trong hình (CLIP) – điểm thấp hơn tên chính, chỉ bù
  let LAY = null, LAYM = null;
  const layReady = (typeof fetch === 'function' && typeof location !== 'undefined' && /^https?:/.test(location.protocol))
    ? fetch('clip/lop-nghia.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(j => { LAY = j; LAYM = null; return j; }).catch(() => null) : Promise.resolve(null);
  function laymap() { if (LAYM || !LAY || !LAY.tags) return LAYM; const ph = new Map(), by = new Map();
    LAY.tags.forEach((row, ti) => row.forEach(x => { for (const p0 of String(x || '').split(/\s*[,，、]\s*/)) { const p = norm(p0); if (!p) continue; for (const q of [p, loose(p)]) { if (!ph.has(q)) ph.set(q, new Set()); ph.get(q).add(ti); } } }));
    for (const [id, vs] of Object.entries(LAY.img || {})) vs.forEach((v, r) => { const ti = Math.floor(v / 10); if (!by.has(ti)) by.set(ti, []); by.get(ti).push([id, v % 10, r]); });
    return (LAYM = { ph, by }); }
  function i18map() { if (I18M || !I18 || !I18.c) return I18M; const ph = new Map(), byC = new Map(), tagC = new Map();
    I18.c.forEach((row, k) => row.forEach(x => { const n = norm(x); if (!n) return; for (const p0 of new Set([n, ...n.split(/\s*[,;，、；]\s*/)])) { if (!p0) continue; for (const p of [p0, loose(p0)]) { if (!ph.has(p)) ph.set(p, new Set()); ph.get(p).add(k); } } }));
    for (const [id, k] of Object.entries(I18.i || {})) { if (!byC.has(k)) byC.set(k, []); byC.get(k).push(id); }
    for (const [id, ts] of Object.entries(I18.t || {})) ts.forEach((k, r) => { if (!tagC.has(k)) tagC.set(k, []); tagC.get(k).push([id, r]); });
    const hand = new Set(I18.h || []);   // 6/11: nghĩa dịch tay (đáng tin) → xét trước
    for (const [p, cs] of ph) if (cs.size > 1 && [...cs].some(k => hand.has(k))) ph.set(p, new Set([...cs].sort((a, b) => hand.has(b) - hand.has(a))));
    return (I18M = { ph, byC, tagC, hand }); }
  function idEntry(src) { if (!IDE[src]) { IDE[src] = new Map(); for (const v of index(src).map.values()) v.forEach(x => IDE[src].set(x.id, x)); } return IDE[src]; }
  // gợi ý theo tên dịch + thẻ nội dung (chỉ GỢI Ý, không tự gắn): tên trùng cả cụm 0,9 · trùng 1 từ 0,6 · thẻ nội dung 0,5 → 0,3
  function i18search(q, src) { const m = i18map(); if (!m) return []; const E = idEntry(src), qn = norm(q), out = new Map();
    const add = (id, sc) => { const e = E.get(id); if (!e) return; const o = out.get(id); if (!o || o.score < sc) out.set(id, { label: e.label, id, score: sc }); };
    const STOPW = /^(và|điều|đang|xảy|ra|của|những|các|một|cho|với|ở|trong|là|có|được|về|the|a|an|and|of|to|in)$/;   // 6/11: tên bài "Một ngày của tôi" → không gợi ý ảnh số 1 (quả táo) theo chữ "một"
    const tk = toks(q).filter(x => (x.length > 1 || /[\u3400-\u9fff\uac00-\ud7af\u3040-\u30ff]/.test(x)) && !STOPW.test(x)), ps = [qn, ...tk], one = Math.min(0.6, 2 / (1 + Math.max(1, tk.length)));   // cụm dài: khớp 1 chữ lẻ → điểm thấp (như Dice)
    ps.forEach((p, pi) => { const cs = phOf(m, p); if (!cs) return; const anyH = [...cs].some(k => m.hand.has(k)); cs.forEach(k => { if (anyH && !m.hand.has(k)) return;   /* có nghĩa dịch tay khớp → bỏ khái niệm máy dịch chen vào */ (m.byC.get(k) || []).forEach(id => add(id, pi ? one : 0.9)); (m.tagC.get(k) || []).forEach(([id, r]) => add(id, (pi ? 0.4 : 0.5) - r * 0.02)); }); });
    const L = laymap(); if (L) for (const p of ps) { const ts = L.ph.get(p) || L.ph.get(loose(p)); if (!ts) continue; const ex = p === qn; ts.forEach(ti => (L.by.get(ti) || []).forEach(([id, ly, r]) => add(id, (ly === 3 ? (ex ? 0.56 : 0.42) : (ex ? 0.5 : 0.38)) - r * 0.01))); }   // lớp 3–4 (gõ đúng tên nhóm → cao hơn ảnh trùng 1 âm tiết)
    return [...out.values()]; }
  // chữ người gõ (bất kỳ tiếng nào) → chữ tiếng Việt để tìm: khớp tên kho → giữ nguyên; trùng tên dịch sẵn → tên Việt; không có → Google Dịch qua Apps Script (khi đã bật)
  async function resolve(t, src) { t = String(t || '').trim(); if (!t || /^(id:|data:|-$)/.test(t)) return { vi: t }; await i18Ready; await layReady;
    if (match(t, src).hit.length) return { vi: t };
    const m = i18map(); if (m) for (const v of [norm(t), ...variants(t)]) { const cs = phOf(m, v); if (cs) { for (const k of cs) if ((m.byC.get(k) || []).some(id => idEntry(src).has(id))) return { vi: I18.c[k][0], how: `${t} → ${I18.c[k][0]}` }; const kh = [...cs].find(k => m.hand.has(k)); if (kh != null) return { vi: I18.c[kh][0], how: `${t} → ${I18.c[kh][0]}` }; } }   /* nghĩa dịch tay dù chưa có ảnh đúng tên → vẫn ra tiếng Việt để tìm gần */
    { const L = laymap(); const ts = L && (L.ph.get(norm(t)) || L.ph.get(loose(t))); if (ts && ts.size && !/[ăâđêôơư]/i.test(t)) { const ti = [...ts][0]; return { vi: LAY.tags[ti][0], how: `${t} → ${LAY.tags[ti][0]} (nhóm / thẻ hình)` }; } }   // gõ "animal" / "動物" → "động vật" → gợi ý ảnh thuộc nhóm
    if (search(t, src, 1).length) return { vi: t };
    if (CFG.translate && CFG.logUrl) { const tr = LS.get('pls_tr') || {}, key = norm(t); let vi = tr[key];
      if (!vi) { try { const r = await fetch(CFG.logUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ kind: 'translate', text: t.slice(0, 200), to: 'vi' }) }); const j = JSON.parse(await r.text()); vi = j && j.vi; if (vi) { tr[key] = vi; LS.set('pls_tr', tr); } } catch (e) { console.warn('[PLS_IMAGES] dịch qua Apps Script', e); } }
      if (vi && norm(vi) !== key) return { vi, how: `${t} → ${vi} (Google Dịch)` }; }
    return { vi: t }; }
  const CLIP_AUTO = 0.295;   // điểm tự gắn (đo HSK1 29/10: "Em gái → Chị_em gái" 0,297 đúng; từ trừu tượng "rất / của / tuổi" 0,25–0,29 → chỉ gợi ý)
  function byFile(src, file) { for (const v of index(src).map.values()) { const h = v.find(x => x.file === file); if (h) return { id: h.id, label: h.label + ' (đã dùng)', score: 1 }; } return null; }
  // Cập nhật danh sách ảnh mỗi ngày (giống plugin) – chỉ khi có mạng; xong gọi cb để dựng lại
  async function autoRefresh(cb) {
    const today = new Date().toISOString().slice(0, 10);
    const c = LS.get('pls_img_idx_eu'); const built = (root.PLS_IMG_BUILT || {}).date;
    if ((c && c.date === today) || built === today || !CFG.driveKey) return false;
    try { const r = await refresh(); if (cb) cb(r); return r; } catch (e) { console.warn('[PLS_IMAGES] không cập nhật được danh sách ảnh:', e.message); return false; }
  }
  // ---------- GÓI TẠO ẢNH (F.STYLE, F.STYLE_DESC, "GÓI PHÔI + PROMPT" trong hướng dẫn Storage Data) ----------
  // ẢNH MẪU + MÔ TẢ PHONG CÁCH (người dùng 5/11: cho sát ảnh thật của 2 kho) – 6 ảnh tiêu biểu: người, đồ vật, nhà, cảnh, hành động
  const STYLE = { eu: [['bác sĩ', '1z-cwAgR66yEKQUCSjm-Qn-aa0ZkeT1eD'], ['táo', '1MMk4fYjpBex5Cl4RB4pSMLJC9RETKh3t'], ['nhà', '1CFyF1KNwxR3hOCIpR-2CSX13_6GgZXnO'], ['khâu vá', '1tGC5TaI1BR1E3pvODEqkxyBpiomWA9iX'], ['bài hát', '119ivFH-B_4jpDM6t5pRlS46lD44CvDwx'], ['nghệ sĩ', '1pdcWwwryyUgVgRWBJYdEYZsNFV8RGfdi']],
    as: [['bác sĩ', '1czLm78iHMnt-LrsvnfqYPKwspW9xiQ8Y'], ['táo', '1kB832K1fNtMDIb3kuczOpxctc_lnMJKB'], ['nhà', '1TtJxXkaXvzE4NNlOlyXPky6wR78hqNdv'], ['du học', '1awwPZ9FOadOXCDllmtehyaNUavDdwRJv'], ['phấn khích', '1Grt3nAtbM69ztV15qaDYSLoxcCkMdjDB'], ['từ chối', '1bK1TfOp_niaue2SddHLxLTrl5S9svZaT']] };
  const STYLE_DESC = {
    eu: 'Hoạt hình 3D kiểu phim Pixar / Disney: nhân vật người châu Âu, mắt to long lanh, da mịn, tóc và vải có chất liệu thật, ánh sáng ấm mềm như phim, bóng đổ tự nhiên trong vật thể, KHÔNG có nét viền; đồ vật bóng bẩy như mô hình 3D. Nền trong suốt, không chữ, một đối tượng chính căn giữa.',
    as: 'Minh hoạ chibi anime dễ thương (cùng bộ nhân vật Đắc Nhân): đầu to, mắt to, má hồng, nét viền nâu sẫm rõ và đều, tô màu cel-shading 2 tông bóng mềm, màu tươi ấm; đồ vật / nhà cửa cùng nét viền và bóng mềm, dáng hơi bo tròn. Nhân vật người châu Á. Nền trong suốt, không chữ, một đối tượng chính căn giữa.'
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
    return { prompt, scene, ratio: r, kho: src === 'eu' ? 'Châu Âu (3D kiểu Pixar)' : 'Châu Á (chibi anime)', refs: STYLE[src].map(([label, id]) => ({ label, id, url: url(id, 1200) })), near: near ? Object.assign({ url: url(near.id, 1200) }, near) : null };
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
  // CẮT SÁT VÙNG CÓ HÌNH (người dùng 29/10 – Đắc Nhân: ảnh to nhỏ không đều vì ảnh kho có viền trắng / trong suốt rộng hẹp khác nhau):
  // đọc điểm ảnh trong trình duyệt, bỏ viền cùng màu nền (trắng / trong suốt / màu góc) → ảnh nào cũng chạm khung → các ảnh đều nhau. Lỗi CORS / ảnh kín khung → giữ nguyên.
  const TRIM = new Map(); let TRIM_ON = false;
  function trimSrc(src) {
    if (TRIM.has(src)) return TRIM.get(src);
    const pr = new Promise(res => { const im = new Image(); im.crossOrigin = 'anonymous';
      im.onload = () => { try { const k = Math.min(1, 900 / Math.max(im.naturalWidth, im.naturalHeight)), W = Math.max(1, Math.round(im.naturalWidth * k)), H = Math.max(1, Math.round(im.naturalHeight * k));
          const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const cx = cv.getContext('2d'); cx.drawImage(im, 0, 0, W, H); const d = cx.getImageData(0, 0, W, H).data;
          const at = (x, y) => (y * W + x) * 4, c0 = at(0, 0), br = d[c0], bg = d[c0 + 1], bb = d[c0 + 2], ba = d[c0 + 3];
          const isBg = i => d[i + 3] < 20 || (Math.abs(d[i] - br) + Math.abs(d[i + 1] - bg) + Math.abs(d[i + 2] - bb) < 36 && ba > 200) || (d[i] > 243 && d[i + 1] > 243 && d[i + 2] > 243 && d[i + 3] > 200);
          let x0 = W, y0 = H, x1 = -1, y1 = -1;
          for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (!isBg(at(x, y))) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
          if (x1 < 0 || (x1 - x0) * (y1 - y0) > 0.9 * W * H) return res(null);   // trống / đã kín khung
          const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.03); x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad);
          const o = document.createElement('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1; o.getContext('2d').drawImage(cv, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
          res(o.toDataURL('image/png')); } catch (e) { res(null); } };
      im.onerror = () => res(null); im.src = src; });
    TRIM.set(src, pr); return pr;
  }

  // THẺ CHỮ cho từ trừu tượng / hư từ (6/11 – tools/loai_tu.py → clip/loai-tu.json): không đoán ảnh (CLIP / gần nghĩa hay sai với 了 吧 的…)
  // → vẽ thẻ PNG ngay trên web (chữ Hán + phiên âm + biểu tượng nhóm, font của trang) – PDF / PPTX / Canva y như web
  let KIND = null; const kindReady = (typeof fetch === 'function' && typeof location !== 'undefined' && /^https?:/.test(location.protocol))
    ? fetch('clip/loai-tu.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(j => (KIND = j)).catch(() => null) : Promise.resolve(null);
  const kindOf = w => { if (!KIND || !w) return null; const n = norm(w), n2 = norm(String(w).replace(/\([^)]*\)/g, '')); return KIND[n] || KIND[n2] || KIND[norm(n2.split(/\s*[;；]\s*/)[0])] || null; };   // nghĩa đầy đủ / bỏ ngoặc / ý đầu trước dấu ;
  const CARD_G = { cau_hoi: ['💬', '#fde7d9', 'trợ từ câu'], ngu_phap: ['🔗', '#e8eefc', 'trợ từ ngữ pháp'], muc_do: ['📶', '#fff3cd', 'mức độ'], phu_dinh: ['✖️', '#fde2e4', 'phủ định'],
    thoi_gian: ['⏱️', '#e3f6ec', 'thời gian'], pham_vi: ['👥', '#efe7fb', 'phạm vi'], noi: ['➕', '#e7f3fb', 'nối câu'], vi_tri: ['📍', '#fdeee0', 'giới từ'], luong_tu: ['🔢', '#f1f1e6', 'lượng từ'], nang_nguyen: ['💪', '#e6f4f4', 'năng nguyện'] };
  const CARDS = new Map();
  function card(e) { if (typeof document === 'undefined') return null; const key = e.join('|'); if (CARDS.has(key)) return CARDS.get(key);
    const [w, py, g] = e, [ico, bg, lab] = CARD_G[g] || CARD_G.ngu_phap, cv = document.createElement('canvas'); cv.width = 800; cv.height = 600; const x = cv.getContext('2d');
    const rr = (X, Y, W, H, R) => { x.beginPath(); x.moveTo(X + R, Y); x.arcTo(X + W, Y, X + W, Y + H, R); x.arcTo(X + W, Y + H, X, Y + H, R); x.arcTo(X, Y + H, X, Y, R); x.arcTo(X, Y, X + W, Y, R); x.closePath(); };
    rr(16, 16, 768, 568, 56); x.fillStyle = bg; x.fill(); x.lineWidth = 6; x.strokeStyle = 'rgba(0,0,0,.12)'; x.stroke();
    const han = /[㐀-鿿]/.test(w), ff = han ? '"LXGW WenKai","KaiTi","Kaiti SC","STKaiti","Noto Serif SC",serif' : '"Montserrat","Be Vietnam Pro",sans-serif';
    let fs = han ? 300 : 150; x.font = `700 ${fs}px ${ff}`; while (x.measureText(w).width > 640 && fs > 60) { fs -= 10; x.font = `700 ${fs}px ${ff}`; }
    x.fillStyle = '#3d2b1f'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(w, 400, py ? 285 : 315);
    if (py) { x.font = '500 64px "Be Vietnam Pro","Montserrat",sans-serif'; x.fillStyle = '#b5532a'; x.fillText(py, 400, 490); }
    x.font = '64px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif'; x.textAlign = 'right'; x.fillText(ico, 740, 90);
    x.font = '600 34px "Be Vietnam Pro","Montserrat",sans-serif'; x.fillStyle = 'rgba(61,43,31,.55)'; x.textAlign = 'left'; x.fillText(lab, 60, 82);
    const u = cv.toDataURL('image/png'); CARDS.set(key, u); return u; }
  function setImg(el, id, how, label) {
    el.classList.remove('pls-imgslot'); el.classList.remove('pls-imgempty');
    el.style.backgroundImage = `url("${/^(data:|blob:)/.test(id) ? id : url(id, 800)}")`; el.style.backgroundSize = 'contain'; el.style.backgroundRepeat = 'no-repeat'; el.style.backgroundPosition = 'center';
    el.style.backgroundOrigin = 'content-box'; el.style.padding = '0px';   // ảnh đã có: bỏ nền mờ + lề, ảnh to hết ô (contain giữ tỉ lệ) – người dùng chốt 23/10
    el.style.backgroundColor = 'transparent'; el.style.boxShadow = 'none';
    el.dataset.imgId = id; el.dataset.imgHow = how; el.dataset.imgName = label || '';
    if (TRIM_ON && typeof document !== 'undefined' && !/^(data:|blob:)/.test(id)) trimSrc(url(id, 800)).then(t => { if (t && el.dataset.imgId === id) el.style.backgroundImage = `url("${t}")`; });
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
  // ẢNH ĐÃ CHỌN THEO TỪ (người dùng 28/10: QC ảnh xong, nhập lại S5 + S6 hay F5 vẫn giữ ảnh): kho|từ → 'id:…' hoặc '-' (bỏ ảnh), lưu trên trình duyệt
  const PICK_KEY = 'pls_img_pick_v1';
  const picks = () => (root.PLS_IMG_PICK = root.PLS_IMG_PICK || LS.get(PICK_KEY) || {});
  function pick(src, word, v) {
    const k = src + '|' + norm(word); if (!word) return; const m = picks();
    if (v == null) delete m[k]; else if (v === '-' || /^id:/.test(v)) m[k] = v; else return;   // ảnh tải lên (data:) quá nặng để nhớ – chỉ nhớ ảnh trong kho
    LS.set(PICK_KEY, m);
  }
  const picked = (src, word) => word ? picks()[src + '|' + norm(word)] : null;
  function fill(host, brand, data, deck) {
    TRIM_ON = brand === 'Đắc Nhân';   // đang áp cho Đắc Nhân
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
      else if (!ov && picked(src, word) === '-') { res.type = 'removed'; }
      else if (!ov && picked(src, word)) { const id = picked(src, word).slice(3); setImg(el, id, 'user', ''); res.type = 'user'; res.id = id; res.label = 'Ảnh đã chọn trước (nhớ theo từ)'; deck.count[id] = (deck.count[id] || 0) + 1; }
      else if (ov && ov.startsWith('id:')) { setImg(el, ov.slice(3), 'user', ''); res.type = 'user'; res.id = ov.slice(3); deck.count[res.id] = (deck.count[res.id] || 0) + 1; }
      else {
        const q = ov || word;
        const c = cons(q), topic = !!topicQ;   // ô ảnh chủ đề (bìa / khởi động…): ghi sẵn từ khoá mà kho không có → vẫn tìm theo chủ đề
        if (q && (topic || !(c.sentence && !ov))) {   // câu → không tự khớp, để người chọn (chủ đề bài: vẫn tự tìm)
          let m = match(q, src); const why = [];
          if (!m.hit.length && ov && word && word !== ov) { const mw = match(word, src); if (mw.hit.length) m = Object.assign(mw, { via: word }); }   // từ ghi sẵn (vd tiếng Anh "closed") không có trong kho → tìm theo nghĩa tiếng Việt của thẻ
          if (topic && !m.hit.length) for (const part of [topicQ].concat(topicQ.split(/\s*(?:\bvà\b|\bhoặc\b|[,;:–—\-&+/])\s*/).map(x => x.trim()).filter(x => x.length > 1))) { const mm = match(part, src); if (mm.hit.length) { m = Object.assign(mm, { via: part }); break; } }
          if (topic && !m.hit.length) { const best = (search(q, src, 6).length ? search(q, src, 6) : search(topicQ, src, 6)).concat(search(topicQ, src, 6)).find(x => x.score >= 0.3 && !used.has(x.id)); if (best) m = { type: 'near', via: 'gần nghĩa chủ đề', hit: [{ id: best.id, label: best.label }] }; }
          if (!m.hit.length && !c.sentence) { const cl = clip(q, src, word).filter(x => x.score >= CLIP_AUTO && String(x.q).split(/\s+/).length <= 3); if (cl.length) m = { type: 'clip', via: 'CLIP (gần nghĩa hình)', hit: cl.map(x => ({ id: x.id, label: x.label })) }; }
          const okHits = m.hit.filter(h => { const w = whoOk(h.id, c); if (!w.ok) why.push(w.why); return w.ok; });
          const hit = okHits.find(h => !used.has(h.id) && (topic || (deck.count[h.id] || 0) < 2));   // ảnh chủ đề: bìa + khởi động dùng chung được
          if (!hit && okHits.length) why.push('ảnh "' + okHits[0].label + '" đã dùng ở 2 slide');
          if (hit) { const w = whoOk(hit.id, c); setImg(el, hit.id, m.type, hit.label); used.add(hit.id); deck.count[hit.id] = (deck.count[hit.id] || 0) + 1; res = Object.assign(res, { type: m.type, id: hit.id, label: hit.label, via: m.via, soat: w.soat }); }
          else if (why.length) res.why = why[0];
        } else if (q) res.why = 'câu / cụm dài – không tự chọn ảnh';
        if ((res.type === 'none' || topic || res.type === 'clip') && q) {   // chủ đề bài / ảnh CLIP: dù đã tự gắn vẫn có 6 ảnh gần nghĩa để đổi
          res.cands = search(q, src, 6); if (res.cands.length < 6 && word && word !== q) res.cands = res.cands.concat(search(word, src, 6).filter(x => !res.cands.some(y => y.id === x.id))).slice(0, 6);
          const prev = ((root.PLS_IMG_PREV || {})[src + '|' + norm(q)] || []).map(f => byFile(src, f)).filter(Boolean);   // ảnh từng chọn trên Figma → gợi ý đầu
          const cl = clip(q, src, word).slice(0, 4); if (cl.length) res.cands = cl.concat(res.cands.filter(x => !cl.some(y => y.id === x.id))).slice(0, 6);   // CLIP gợi ý đầu
          if (prev.length) res.cands = prev.map(p => Object.assign({ prev: true }, p)).concat(res.cands.filter(c => !prev.some(p => p.id === c.id))).slice(0, 6);
        }
        { const kd = !ov && !topic && kindOf(word || q);   // từ trừu tượng: không gắn ảnh đoán (CLIP / gần nghĩa) – dùng thẻ chữ; ảnh đúng tên trong kho vẫn ưu tiên
          if (kd && /^(none|clip|near)$/.test(res.type)) { const u = card(kd); if (u) { if (res.id) { used.delete(res.id); deck.count[res.id] = Math.max(0, (deck.count[res.id] || 1) - 1); }
            setImg(el, u, 'card', 'Thẻ chữ ' + kd[0]); res = Object.assign(res, { type: 'card', id: '', label: 'Thẻ chữ ' + kd[0] + ' (từ trừu tượng – chưa có ảnh đúng tên)', via: 'thẻ chữ' }); } } }
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
    // FILE GỐC TRƯỚC (người dùng 4/11: ảnh đã tách nền tải về thành JPG nền đen): ảnh thu nhỏ lh3 bị máy chủ Google đổi định dạng, mất nền trong suốt → lấy file gốc qua Drive API
    if (id && CFG.driveKey) { try { const bu = URL.createObjectURL(await original(id)); try { return await toPng(bu); } finally { URL.revokeObjectURL(bu); } } catch (e) { console.warn('[PLS] ảnh gốc Drive không đọc được, dùng ảnh thu nhỏ', id, e); } }
    return toPng(urlStr);
  }
  // FILE GỐC trên Drive (PNG giữ nền trong suốt)
  async function original(id) {
    const r = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${encodeURIComponent(CFG.driveKey)}`);
    if (!r.ok) throw new Error('Drive ' + r.status); return r.blob(); }
  // TẢI ẢNH GỐC về máy (đúng tên + định dạng gốc, PNG giữ nền trong suốt) – thay cho chuột phải "Lưu hình ảnh" (ra JPG nền đen)
  async function download(id, name) {
    let nm = name; if (!nm) { try { const r = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?fields=name&key=${encodeURIComponent(CFG.driveKey)}`); if (r.ok) nm = (await r.json()).name; } catch (e) { console.warn('[PLS] tên ảnh', e); } }
    let bl; try { bl = await original(id); }
    catch (e) {   // 6/11 người dùng: "Failed to fetch" khi gọi Drive API → lấy ảnh cỡ gốc dạng PNG (=s0-rp, giữ nền trong suốt) qua canvas, ngay trong trang – không mở / lộ kho Drive
      console.warn('[PLS] tải ảnh gốc qua API lỗi, dùng ảnh cỡ gốc', id, e);
      let im = null; for (const sz of ['=s0-rp', '=s0', '=w4000']) { try { const x = new Image(); x.crossOrigin = 'anonymous'; x.src = 'https://lh3.googleusercontent.com/d/' + id + sz; await x.decode(); im = x; break; } catch (e2) { console.warn('[PLS] ảnh cỡ gốc', sz, e2); } }
      if (!im) throw e;
      const cv = document.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight; cv.getContext('2d').drawImage(im, 0, 0);
      bl = await new Promise(r => cv.toBlob(r, 'image/png')); if (nm) nm = nm.replace(/\.(jpe?g|webp)$/i, '') + (/\.png$/i.test(nm) ? '' : '.png'); }
    const a = document.createElement('a'); a.href = URL.createObjectURL(bl);
    a.download = nm || (id + (/png/.test(bl.type) ? '.png' : /jpe?g/.test(bl.type) ? '.jpg' : '')); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }

  root.PLS_IMAGES = { kindOf, kindReady, card, layReady, resolve, i18Ready, i18search, trimSrc, clip, clipReady, pick, picked, stylePack, sceneOf, autoRefresh, fill, cons, whoOk, match, search, variants, refresh, index, url, bytes, original, download, srcOfBrand, stats: () => Object.fromEntries(Object.keys(SOURCES).map(s => [s, { count: index(s).count, from: index(s).from }])) };
})(window);
