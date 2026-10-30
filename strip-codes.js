// LỌC MÃ NỘI BỘ khỏi chữ hướng tới học viên (người dùng 28/10).
// Cột "Mục tiêu bài" (S6 Khoá & bài) và S5 hay viết mã trong câu: "(KN-001)", "các mindset MS-01 đến MS-04", "TV-012"…
// Bản HỌC VIÊN (slide + sách) đi qua bộ lọc này; bản GIÁO VIÊN giữ nguyên mã.
(function (root) {
  const CODE = '(?:MS|KN|TV|NP|HT|VT|BT|GT|PA|HV|NG|DN|CT|MC|BC|HD)-\\d{2,4}';   // 29/10: thêm VT-01… (lộ trong các bước dạy)
  const SEP = '(?:\\s*(?:,|;|/|&|\\+|và|hoặc|đến|tới|→|~|–|—|-)\\s*)';
  const HAS = /\b(?:MS|KN|TV|NP|HT|VT|BT|GT|PA|HV|NG|DN|CT|MC|BC|HD)-\d{2,4}\b/;
  // 1) ngoặc chỉ chứa mã: "(KN-001)", "(MS-02, MS-03)", "[TV-01 – TV-05]"
  const PAREN = new RegExp('\\s*[(\\[]\\s*(?:mã\\s*:?\\s*)?' + CODE + '(?:' + SEP + CODE + ')*\\s*[)\\]]', 'giu');
  // 2) khoảng / danh sách mã đứng trong câu: "MS-01 đến MS-04", "KN-001, KN-002 và KN-003"
  const RUN = new RegExp('[ \\t]*\\b' + CODE + '(?:' + SEP + CODE + ')+\\b', 'gu');
  // 3) mã đứng lẻ
  const ONE = new RegExp('\\b' + CODE + '\\b', 'gu');
  function clean(t) {
    return t
      .replace(/[(\[]\s*[,;:/–—-]*\s*[)\]]/g, '')            // ngoặc rỗng còn sót
      .replace(/([(\[])\s*[,;:/–—-]+\s*/g, '$1')               // "(MS-04: hỏi ngay…)" → "(hỏi ngay…)"
      .replace(/([(\[])\s+/g, '$1').replace(/\s+([)\]])/g, '$1')
      .replace(/[ \t]+([,.;:!?…])/g, '$1')                  // khoảng trắng trước dấu câu
      .replace(/([,;:])(?:\s*[,;:])+/g, '$1')               // ", ," → ","
      .replace(/[,;:][ \t]*(?=[.!?…)\]]|\n|$)/g, '')        // dấu phẩy / hai chấm treo cuối câu
      .replace(/(^|\n)([ \t]*)[,;:–—-][ \t]*(?=\S)/g, (m, a, b, o, s) => /^\s*[-–—•]\s/.test(s.slice(o + a.length)) && /[-–—]/.test(m.trim()) ? m : a + b)   // dấu câu mồ côi đầu dòng (giữ gạch đầu dòng)
      .replace(/\b(và|hoặc|với|gồm|là)[ \t]*(?=[.,;!?]|\n|$)/gu, '')   // từ nối bị treo: "… gồm ."
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/[ \t]+$/gm, '')
      .replace(/[ \t]+([.,;:!?])/g, '$1');
  }
  function text(s) {
    if (typeof s !== 'string' || !HAS.test(s)) return s;
    const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0];
    const t = clean(s.replace(PAREN, '').replace(RUN, '').replace(ONE, '')).trim();
    return t ? lead + t + trail : '';
  }
  // mọi ô chữ của bộ Excel đã đọc (S5/S6) → bản sao đã lọc (không đụng bản gốc)
  function books(b) {
    if (!b || typeof b !== 'object') return b;
    const out = {};
    for (const [k, wb] of Object.entries(b)) {
      if (!wb || typeof wb !== 'object') { out[k] = wb; continue; }
      out[k] = {};
      for (const [sh, rows] of Object.entries(wb)) out[k][sh] = Array.isArray(rows) ? rows.map(r => { if (!r || typeof r !== 'object') return r; const o = {}; for (const c in r) o[c] = text(r[c]); return o; }) : rows;
    }
    return out;
  }
  // mọi nút chữ trong 1 khung đã dựng (slide / trang sách)
  function node(rootEl) {
    if (!rootEl || !rootEl.ownerDocument && !rootEl.createTreeWalker) return 0;
    const doc = rootEl.ownerDocument || rootEl, w = doc.createTreeWalker(rootEl, 4 /* SHOW_TEXT */);
    let n = 0, x; while ((x = w.nextNode())) { const v = x.nodeValue; if (HAS.test(v)) { const t = text(v); if (t !== v) { x.nodeValue = t; n++; } } }
    return n;
  }
  // QC sửa trên chữ ĐÃ BỎ MÃ (shown) → áp đúng chỗ sửa vào chữ gốc CÒN MÃ (raw): tìm đoạn khác nhau giữa bản hiện và bản sửa,
  // định vị đoạn đó (kèm chữ hai bên) trong chữ gốc rồi thay → mã ở chỗ khác giữ nguyên. Không định vị được thì trả bản sửa.
  function remap(raw, edited) {
    const shown = text(raw); if (shown === raw || edited === shown) return shown === raw ? edited : raw;
    let p = 0; while (p < shown.length && p < edited.length && shown[p] === edited[p]) p++;
    let s = 0; while (s < shown.length - p && s < edited.length - p && shown[shown.length - 1 - s] === edited[edited.length - 1 - s]) s++;
    const oldSeg = shown.slice(p, shown.length - s), newSeg = edited.slice(p, edited.length - s);
    for (const k of [24, 16, 10, 6, 3, 1, 0]) for (const j of [k, 0]) {
      const L = shown.slice(Math.max(0, p - k), p), R = shown.slice(shown.length - s, shown.length - s + j), needle = L + oldSeg + R;
      if (!needle) continue; const i = raw.indexOf(needle);
      if (i >= 0 && raw.indexOf(needle, i + 1) < 0) return raw.slice(0, i) + L + newSeg + R + raw.slice(i + needle.length);
    }
    return edited;
  }
  root.PLS_STRIP = { text, books, node, remap, HAS };
  if (typeof module !== 'undefined') module.exports = root.PLS_STRIP;
})(typeof window !== 'undefined' ? window : globalThis);
