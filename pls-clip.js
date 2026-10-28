// PLS_CLIP – khớp hình theo nội dung bằng CLIP. Chỉ mục (image-index.json) do tools/clip_index.py lập, để trên Drive (chia sẻ "ai có link"),
// ID ghi trong config.js: clipIndexId. Chữ tìm kiếm được mã hóa ngay trong trình duyệt (transformers.js, tải 1 lần rồi cache).
// Dùng: await PLS_CLIP.search('dog', 3, 'eu') → [{id, name, src, score}]. Từ tiếng Việt: gán PLS_CLIP.translate = async vi => en (mặc định chỉ tìm đúng chữ đưa vào).
(function (root) {
  'use strict';
  const CFG = root.PLS_CONFIG || {};
  const TF = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';
  const MODEL = 'Xenova/clip-vit-base-patch32';
  const THRESH = 0.2;   // dưới ngưỡng này coi là "không chắc" (chỉnh sau khi chấm bộ thử)
  let store = null, textP = null;

  async function loadIndex() {
    if (store) return store;
    if (!CFG.clipIndexId || !CFG.driveKey) throw new Error('Thiếu clipIndexId / driveKey trong config.js');
    const r = await fetch(`https://www.googleapis.com/drive/v3/files/${CFG.clipIndexId}?alt=media&key=${encodeURIComponent(CFG.driveKey)}`);
    if (!r.ok) throw new Error('Không tải được chỉ mục ảnh (Drive ' + r.status + ')');
    return (store = parseIndex(await r.json()));
  }
  function parseIndex(j) {
    const n = j.items.length, d = j.dim, m = new Int8Array(n * d);
    j.items.forEach((x, i) => { const b = atob(x.v); for (let k = 0; k < d; k++) m[i * d + k] = (b.charCodeAt(k) << 24) >> 24; });
    return { items: j.items.map(({ id, name, src, dir }) => ({ id, name, src, dir })), m, d };
  }
  async function textModel() {
    if (textP) return textP;
    return (textP = (async () => {
      const T = await import(TF);
      T.env.allowLocalModels = false;
      const [tok, mod] = await Promise.all([T.AutoTokenizer.from_pretrained(MODEL), T.CLIPTextModelWithProjection.from_pretrained(MODEL)]);
      return async text => {
        const o = await mod(tok(text, { padding: true, truncation: true }));
        const v = Array.from(o.text_embeds.data), nr = Math.hypot(...v);
        return v.map(x => x / nr);
      };
    })());
  }
  // lõi so khớp (tách riêng để thử không cần model)
  function rank(S, q, k, src) {
    const out = [];
    for (let i = 0; i < S.items.length; i++) {
      const it = S.items[i]; if (src && it.src !== src) continue;
      let s = 0; for (let j = 0; j < S.d; j++) s += S.m[i * S.d + j] * q[j];
      out.push({ id: it.id, name: it.name, src: it.src, score: Math.round(s / 127 * 1000) / 1000 });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, k);
  }
  async function search(text, k, src) {
    const S = await loadIndex(), enc = await textModel();
    let q = String(text || '').trim(); if (!q) return [];
    if (root.PLS_CLIP.translate) q = (await root.PLS_CLIP.translate(q)) || q;
    const res = rank(S, await enc('a photo of ' + q), k || 3, src);
    // khớp tên file: tên chứa từ → cộng điểm; điểm cao nhất dưới ngưỡng → báo "không chắc"
    const ql = q.toLowerCase(); res.forEach(r => { if (r.name.toLowerCase().includes(ql)) r.score += 0.05; });
    res.sort((a, b) => b.score - a.score);
    res.unsure = !res.length || res[0].score < THRESH;
    return res;
  }
  root.PLS_CLIP = { search, rank, parseIndex, loadIndex, setIndex: j => (store = parseIndex(j)), THRESH, translate: null };
})(window);
