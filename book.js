// SÁCH A4 / 19×27 + PDF (thay luồng sách của fit_js: spec.blocks → xếp trang → PDF).
// Từ Excel S5/S6 của buổi đang chọn → danh sách khối (Block/* của Figma) → xếp vào trang (A4/Content, 19x27/Content Odd|Even):
// thêm từng khối, tràn thì sang trang mới; tiêu đề mục không đứng cuối trang (mồ côi); bảng/bài tập dài tách thành nhiều khối.
// Xuất PDF = in trang bằng trình duyệt (chữ vẫn là chữ, không phải ảnh) với @page đúng khổ.
(function (root) {
  const S = v => (v == null ? '' : String(v)).trim();
  const chunk = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };
  // chia đều (33 từ / 8 dòng → 7·7·7·6·6, không để bảng cuối lẻ 1 dòng)
  const chunkEven = (a, n) => { const k = Math.ceil(a.length / n) || 1, sz = Math.ceil(a.length / k); return chunk(a, sz); };
  // nhóm âm: "Thanh mẫu – âm hai môi (âm mũi)" → cụm "Thanh mẫu", tiểu nhóm "âm hai môi (âm mũi)"
  const pronKey = r => String(r['Bảng chữ / nhóm âm'] || '').trim().split(/\s+[–—-]\s+/)[0].replace(/\s*\(.*\)\s*$/, '').trim() || String(r['Chữ / âm'] || '').trim();
  const pronSub = r => { const g = String(r['Bảng chữ / nhóm âm'] || '').trim(), m = g.match(/\s+[–—-]\s+(.+)$/); return m ? m[1] : (g.match(/\(([^)]*)\)\s*$/) || [])[1] || ''; };
  const pronClusters = rows => { const m = new Map(); rows.forEach(r => { const k = pronKey(r); if (!m.has(k)) m.set(k, []); m.get(k).push(r); }); return [...m.entries()]; };
  const tab = (book, re) => { const k = Object.keys(book || {}).find(n => re.test(n)); return k ? book[k] : []; };
  // ĐÁP ÁN NHIỀU CÁCH VIẾT (S6 ghi "X。; X" để app chấm cả có / không dấu câu – người dùng 6/11: sách hiện "；" lẻ loi): gộp cách viết chỉ khác dấu câu / khoảng trắng / hoa thường, khác thật thì nối " / "
  const ANS1 = a => { const v = String(a == null ? '' : a); if (!/[;；]/.test(v)) return v; const seen = new Set(), out = []; for (const x of v.split(/\s*[;；]\s*/)) { const t = x.trim(), k = t.toLowerCase().replace(/[\s。.！!？?，,、'’]/g, ''); if (!t || seen.has(k)) continue; seen.add(k); out.push(t); } return out.length < v.split(/[;；]/).filter(x => x.trim()).length ? out.join(' / ') : v; };   // không có cách viết trùng → giữ nguyên (nghĩa "ngồi; đi")
  const bNum = v => { if (v == null || v === '') return NaN; if (typeof v === 'number') return v; const m = String(v).replace(/,/g, '.').match(/\d+(?:\.\d+)?/); return m ? Number(m[0]) : NaN; };   // "Buổi 1", " 1 ", "1.0" → 1 (28/10)
  const isB = (r, b) => bNum(r['Buổi']) === bNum(b);
  const onPDF = r => !/^không$/i.test(S(r['Lên PDF']));
  const LET = ['A', 'B', 'C', 'D'];
  const TPL = n => !!(root.PLS_TPL && root.PLS_TPL.blocks && root.PLS_TPL.blocks[n]);
  const SIZES = { A4: { page: n => 'A4/Content', mm: [210, 297], label: 'A4' }, '19x27': { page: n => n % 2 ? '19x27/Content Odd' : '19x27/Content Even', mm: [190, 270], label: '19×27' } };

  // LUYỆN TẬP TỔNG HỢP TỪ TAB S6 "Luyện tập tổng hợp" (người dùng 6/11 – HSK1 bài 4–32, PDF mẫu HSK1_LuyenTapTongHop):
  // mỗi phần = 1 khối. Chữ trên sách = nguyên văn ô "Nội dung" (bảng tách theo " | ") → sửa trên sách ghi ngược đúng ô S6.
  const LT_HTML = (rows, sh) => {
    const R = '#B71C1C', O = '#E07B39', LINE = '#C0392B', CREAM = '#FDF6EE', E = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const h = t => `<div style="color:${R};font-weight:700;font-size:11px;margin:10px 0 5px">${E(t)}</div>`, hint = t => t ? `<div style="font-size:10px;margin:0 0 6px">${E(t)}</div>` : '';
    const th = (t, ex, r) => `<th${r && sh && r.__r ? ` data-cell="${E(JSON.stringify([[sh, r.__r, 'Nội dung']]))}"` : ''} style="background:${O};color:#fff;font-weight:700;padding:4px;border:1px solid ${LINE};${ex || ''}">${E(t)}</th>`;
    const DC = (r, k) => sh && r && r.__r ? ` data-cell="${E(JSON.stringify([[sh, r.__r, k || 'Nội dung']]))}"` : '';   // địa chỉ ô S6 (6/11)
    const td = (t, ex, r) => `<td${DC(r)} style="padding:4px;border:1px dashed ${LINE};text-align:center;${ex || ''}">${E(t)}</td>`;
    const tbl = rows => `<table style="border-collapse:collapse;width:100%;font-size:10px;line-height:1.45;border:1px solid ${LINE};table-layout:fixed">${rows}</table>`;
    const blankH = t => E(t).replace(/_{3,}/g, '<span style="display:inline-block;min-width:70px;border-bottom:1px solid #333;margin:0 3px;height:11px"></span>');
    const cells = t => String(t).split(/\s*\|\s*/);
    const parts = []; rows.forEach(r => { const k = String(r['Phần']); let p = parts.find(x => x.k === k); if (!p) parts.push(p = { k, rows: [] }); p.rows.push(r); });
    return parts.map(({ k, rows: rs }) => {
      const r0 = rs[0], kind = String(r0['Dạng'] || ''), name = String(r0['Tên phần'] || ''), head = h(`${k}. ${name.toUpperCase()}`) + hint(r0['Hướng dẫn']);
      if (/bảng/i.test(kind)) {
        const hd = rs.find(r => /đầu bảng/i.test(r['Vai'])), body = rs.filter(r => r !== hd), H = hd ? cells(hd['Nội dung']) : [];
        const word = /viết phiên âm|stt/i.test(name + ' ' + H.join(' '));   // bảng điền: ô trống cao để viết
        const span = !word && body.length > 1 && body.some((r, i) => i && cells(r['Nội dung'])[0] === cells(body[i - 1]['Nội dung'])[0]);   // cột đầu lặp (j j j…) = ô gộp
        let tr = H.length ? `<tr>${H.map((x, i) => th(x, i === 0 && !word ? 'width:14%' : '', hd)).join('')}</tr>` : '';
        body.forEach((r, i) => { const c = cells(r['Nội dung']), first = c[0]; let run = 1; if (span) { if (i && cells(body[i - 1]['Nội dung'])[0] === first) run = 0; else while (i + run < body.length && cells(body[i + run]['Nội dung'])[0] === first) run++; }
          tr += `<tr${i % 2 ? ` style="background:${CREAM}"` : ''}>` + c.map((x, j) => j === 0 && !word ? (run ? td(x, `background:${O};color:#fff;font-weight:700;${span ? 'font-size:12px;' : ''}`, span ? null : r).replace('<td', `<td rowspan="${run}"`) : '') : td(x, (word ? 'height:22px;' : '') + (j === 1 && span ? 'font-weight:700;' : ''), r)).join('') + '</tr>'; });
        return head + tbl(tr); }
      if (/đọc câu/i.test(kind)) return head + `<div style="display:grid;grid-template-columns:1fr 1fr;row-gap:7px;column-gap:14px;font-size:10.5px;margin:4px 0 0 10px">${rs.map(r => `<span${DC(r)}>${E(r['Nội dung'])}</span>`).join('')}</div>`;
      if (/chọn từ/i.test(kind)) { const bank = rs.find(r => /từ cho sẵn/i.test(r['Vai'])), qs = rs.filter(r => r !== bank);
        return head + (bank ? `<div style="border-top:1px solid ${LINE};border-bottom:1px solid ${LINE};text-align:center;padding:5px 0;margin:2px 0 6px;font-size:11px">${cells(bank['Nội dung']).map(x => `<span${DC(bank)}>${E(x)}</span>`).join('<span style="color:${R};margin:0 10px">|</span>')}</div>` : '')
          + qs.map(r => `<div style="display:flex;gap:8px;align-items:baseline;font-size:10.5px;margin:6px 0 2px 6px"><span style="font-size:13px;color:${R}">${E(r['Câu'])}</span><span style="flex:1"${DC(r)}>${blankH(r['Nội dung'])}</span></div>`).join(''); }
      if (/sắp xếp/i.test(kind)) return head + rs.map(r => `<div style="display:flex;gap:8px;align-items:baseline;font-size:10.5px;margin:7px 0 2px 6px"><span style="font-size:13px;color:${R}">${E(r['Câu'])}</span><span style="flex:1"${DC(r)}>${E(r['Nội dung'])}</span></div><div style="display:flex;gap:8px;align-items:center;margin:0 0 6px 6px;font-size:10px"><span style="color:${R}">➔</span><span style="flex:1;border-bottom:1px solid #444;height:12px"></span></div>`).join('');
      if (/hội thoại/i.test(kind)) { const grp = []; rs.forEach(r => { let g = grp.find(x => x.no === r['Câu']); if (!g) grp.push(g = { no: r['Câu'], rs: [] }); g.rs.push(r); });
        return head + grp.map(g => `<div style="display:flex;gap:16px;margin:6px 0 8px 0"><div style="flex:0 0 40px;background:#FCE4D6;display:flex;align-items:center;justify-content:center;font-size:13px">${E(g.no)}</div><div style="font-size:10.5px;line-height:1.9">${g.rs.map(r => `<div><b style="color:${R};display:inline-block;width:22px"${DC(r, 'Vai')}>${E(r['Vai'])}:</b> <span${DC(r)}>${blankH(r['Nội dung'])}</span></div>`).join('')}</div></div>`).join(''); }
      return head + rs.map(r => `<div style="font-size:10.5px;margin:4px 0 4px 6px">${E(r['Câu'])} ${blankH(r['Nội dung'])}</div>`).join('');
    });
  };

  // ---------- nội dung → khối ----------
  // DỮ LIỆU LUYỆN TẬP TỔNG HỢP theo buổi (HSK1) – mỗi phần tử = 1 khối (không cắt giữa bài)
  const DN_PRACTICE = (() => {
    const R = '#B71C1C', O = '#E07B39', LINE = '#C0392B', h = t => `<div style="color:${R};font-weight:700;font-size:11px;margin:8px 0 4px">${t}</div>`, hint = t => `<div style="font-size:10px;margin:0 0 6px">${t}</div>`;
    const th = (t, ex) => `<th style="background:${O};color:#fff;font-weight:700;padding:3px 4px;border:1px solid ${LINE};${ex || ''}">${t}</th>`;
    const td = (t, ex) => `<td style="padding:3px 4px;border:1px dashed ${LINE};text-align:center;${ex || ''}">${t}</td>`;
    const tbl = rows => `<table style="border-collapse:collapse;width:100%;font-size:10px;line-height:1.4;border:1px solid ${LINE};table-layout:fixed">${rows}</table>`;
    const blank = (no, txt) => `<div style="display:flex;gap:8px;align-items:baseline;font-size:10.5px;margin:6px 0 2px 6px"><span style="font-size:13px">${no}</span><span style="flex:1">${txt}</span></div>`;
    const line = `<div style="display:flex;gap:8px;align-items:center;margin:0 0 6px 6px;font-size:10px"><span style="color:${R}">➔</span><span style="flex:1;border-bottom:1px solid #444;height:12px"></span></div>`;
    const C = n => String.fromCharCode(0x2460 + n - 1);
    const b1 = [
      h('1. LUYỆN ĐỌC THANH ĐIỆU') + tbl(`<tr>${th('', 'width:16%')}${['THANH 1', 'THANH 2', 'THANH 3', 'THANH 4'].map(x => th(x)).join('')}</tr>` + [['a', 'ā á ǎ à'], ['o', 'ō ó ǒ ò'], ['e', 'ē é ě è'], ['i', 'ī í ǐ ì'], ['u', 'ū ú ǔ ù'], ['ü', 'ǖ ǘ ǚ ǜ']].map(([k, v], i) => `<tr${i % 2 ? ' style="background:#FDF6EE"' : ''}>${td(k, `background:${O};color:#fff;font-weight:700`)}${v.split(' ').map(x => td(x)).join('')}</tr>`).join('')),
      h('2. HOÀN THÀNH CÂU') + hint('Hướng dẫn: Hãy điền phiên âm tiếng Trung vào chỗ trống để hoàn thành các câu dưới đây') + blank(C(1), 'Nǐ hǎo____ ?') + blank(C(2), 'Dàjiā _______!') + blank(C(3), 'Wǒ_____hǎo.'),
      h('3. VIẾT PINYIN CHO CHỮ HÁN') + hint('Hướng dẫn: Hãy viết phiên âm tương ứng cho mỗi chữ Hán, kèm thanh điệu đúng.') + ['你好', '大家', '好', '我'].map((w, i) => `<div style="display:flex;gap:8px;align-items:baseline;font-size:10.5px;margin:6px 0 2px 6px"><span style="font-size:13px">${C(i + 1)}</span><span>${w} →</span><span style="flex:1;border-bottom:1px solid #444;height:12px"></span></div>`).join('')];
    const b2 = [
      h('1. LUYỆN ĐỌC KẾT HỢP VẬN MẪU') + tbl(`<tr>${th('', 'width:16%')}${['ai', 'ei', 'ao', 'ou'].map(x => th(x)).join('')}</tr>` + [['d', 'dai dei dao dou'], ['t', 'tai - tao tou'], ['n', 'nai nei nao nou'], ['l', 'lai lei lao lou']].map(([k, v], i) => `<tr${i % 2 ? ' style="background:#FDF6EE"' : ''}>${td(k, `background:${O};color:#fff;font-weight:700`)}${v.split(' ').map(x => td(x)).join('')}</tr>`).join('')),
      h('2. LUYỆN ĐỌC KẾT HỢP THANH ĐIỆU') + tbl(`<tr>${['THANH MẪU', 'VẬN MẪU', 'THANH 1', 'THANH 2', 'THANH 3', 'THANH 4'].map(x => th(x)).join('')}</tr>` + [['d', [['ai', 'dāi - dǎi dài'], ['ao', 'dāo dáo dǎo dào'], ['ou', 'dōu - dǒu dòu']]], ['t', [['ai', 'tāi tái tǎi tài'], ['ao', 'tāo táo tǎo tào'], ['ou', 'tōu tóu tǒu tòu']]], ['n', [['ai', '- - nǎi nài'], ['ao', 'nāo náo nǎo nào'], ['ei', '- - něi nèi']]], ['l', [['ai', '- lái - lài'], ['ao', 'lāo láo lǎo lào'], ['ei', 'lēi léi lěi lèi'], ['ou', 'lōu lóu lǒu lòu']]]]
        .map(([k, rs]) => rs.map(([v, xs], i) => `<tr${i % 2 ? ' style="background:#FDF6EE"' : ''}>${i ? '' : td(k, `background:${O};color:#fff;font-weight:700;font-size:13px`).replace('<td', `<td rowspan="${rs.length}"`)}${td(v, 'font-weight:700')}${xs.split(' ').map(x => td(x)).join('')}</tr>`).join('')).join('')),
      h('3. SẮP XẾP CÁC CÂU') + hint('Đọc các câu, xác định thứ tự hợp lý về nghĩa, rồi sắp xếp theo trình tự phù hợp; có thể dùng phiên âm, nhưng vẫn khuyến khích dùng chữ Hán.') + blank(C(1), 'wǒmen / xuéshēng / shì /。') + line + blank(C(2), 'jiàn / lǎoshī / míngtiān / ！') + line,
      h('4. HOÀN THÀNH HỘI THOẠI') + hint('Hãy điền phiên âm tiếng Trung vào chỗ trống để hoàn thành đoạn hội thoại sau dưới đây.') + `<div style="display:flex;gap:14px;margin:4px 0 4px 6px"><div style="flex:0 0 22px;background:#FFF3E0"></div><div style="font-size:10.5px;line-height:1.9">${[['A', 'Nǐ hǎo ma?'], ['B', '________________, nǐ ne?'], ['A', '______________.']].map(([a, t]) => `<div><b style="color:${R};display:inline-block;width:26px">${a}:</b>${t}</div>`).join('')}</div></div>`,
      h('5. LUYỆN ĐỌC CỤM TỪ') + `<div style="display:grid;grid-template-columns:repeat(3,1fr);row-gap:6px;font-size:10.5px;margin:4px 0 0 30px">${'báimǎ dìtú tǎlóu dàmǎ kèfú lǐfà fǔdǎo dòufu dàmǐ mǎimài bàibài tèdì'.split(' ').map(x => `<span>${x}</span>`).join('')}</div>`];
    const grid = (cols, rows) => tbl(`<tr>${th('', 'width:14%')}${cols.map(x => th(x)).join('')}</tr>` + rows.map(([k, v], i) => `<tr${i % 2 ? ' style="background:#FDF6EE"' : ''}>${td(k, `background:${O};color:#fff;font-weight:700`)}${v.split(' ').map(x => td(x)).join('')}</tr>`).join(''));
    const tones = groups => tbl(`<tr>${['', 'Vận mẫu', 'Thanh 1', 'Thanh 2', 'Thanh 3', 'Thanh 4'].map(x => th(x)).join('')}</tr>` + groups.map(([k, rs]) => rs.map(([v, xs], i) => `<tr${i % 2 ? ' style="background:#FDF6EE"' : ''}>${i ? '' : td(k, `background:${O};color:#fff;font-weight:700;font-size:13px`).replace('<td', `<td rowspan="${rs.length}"`)}${td(v, 'font-weight:700')}${xs.split(' ').map(x => td(x)).join('')}</tr>`).join('')).join(''));
    const two = xs => `<div style="display:grid;grid-template-columns:1fr 1fr;row-gap:6px;column-gap:12px;font-size:10.5px;margin:4px 0 0 6px">${xs.map(x => `<span>${x}</span>`).join('')}</div>`;
    const dlg = (no, ls) => `<div style="display:flex;gap:14px;margin:6px 0 6px 6px;align-items:center"><div style="flex:0 0 22px;align-self:stretch;background:#FFF3E0;display:flex;align-items:center;justify-content:center;font-size:13px">${no}</div><div style="font-size:10.5px;line-height:1.9">${ls.map(([a, t]) => `<div><b style="color:${R};display:inline-block;width:26px">${a}:</b>${t}</div>`).join('')}</div></div>`;
    const b3 = [
      h('1. LUYỆN ĐỌC KẾT HỢP VẬN MẪU') + grid(['an', 'ang', 'en', 'eng', 'ong'], [['g', 'gan gang gen geng gong'], ['k', 'kan kang ken keng kong'], ['h', 'han hang hen heng hong']]),
      h('2. LUYỆN ĐỌC KẾT HỢP THANH ĐIỆU') + tones([['g', [['an', 'gān - gǎn gàn'], ['ang', 'gāng - gǎng gàng'], ['en', 'gēn gén gěn gèn'], ['eng', 'gēng - gěng gèng'], ['ong', 'gōng - gǒng gòng']]],
        ['k', [['an', 'kān - kǎn kàn'], ['ang', 'kāng káng - kàng'], ['en', '- - kěn kèn'], ['eng', 'kēng - - -'], ['ong', 'kōng - kǒng kòng']]],
        ['h', [['an', 'hān hán hǎn hàn'], ['ang', 'hāng háng - hàng'], ['en', '- hén hěn hèn'], ['eng', 'hēng héng - hèng'], ['ong', 'hōng hóng hǒng hòng']]]]),
      h('3. ĐỌC CÁC MẪU CÂU SAU') + two(['Māma bào wǒ, wǒ bào māma.', 'Gēge hěn gāo, dìdi hěn ǎi.', 'Wǒ māma hěn máng.', 'Dǎkāi dēng, dǎkāi mén.', 'Wǒ bù lěng, nǐ lěng ma?', 'Wǒ hē yī bēi, nǐ hē yī bēi.']),
      h('4. SẮP XẾP CÁC CÂU') + hint('Đọc các câu, xác định thứ tự hợp lý về nghĩa, rồi sắp xếp theo trình tự phù hợp; có thể dùng phiên âm, nhưng vẫn khuyến khích dùng chữ Hán.') + blank(C(1), 'shì / Nǐ / ma / lǎo shī / ?') + line + blank(C(2), 'rén / nǎ guó / Nǐ / shì / ?') + line + blank(C(3), 'nǐ / ! / xièxie / hěn hǎo / , / Wǒ') + line,
      h('5. HOÀN THÀNH HỘI THOẠI') + hint('Hãy điền phiên âm tiếng Trung vào chỗ trống để hoàn thành các hội thoại dưới đây.') + dlg(C(1), [['A', 'Nǐ shì xuéshēng ma?'], ['B', '___________________________.']]) + dlg(C(2), [['A', 'Nǐ yǒu mèimei ma?'], ['B', '________________________________, nǐ ne?'], ['A', '_____________________________________.']])];
    return { 1: b1, 2: b2, 3: b3 }; })();
  function blocks(books, buoi, brand) {
    const s6 = books.s6 || {}, s5 = books.s5 || {}, out = [], keys = [];
    const info = tab(s6, /Khoá & bài|Khóa & bài/).find(r => isB(r, buoi)) || {};
    const course = Object.fromEntries(tab(s6, /Thông tin khoá|Thông tin khóa/).map(r => [S(r['Mục']), S(r['Nội dung'])]));
    const s5row = tab(s5, /^S5$/).find(r => isB(r, buoi)) || {};
    let LAST = null;   // dòng Excel của bảng đang dựng → "＋ Cột từ Excel" (người dùng 5/11): thêm cột có sẵn trong sheet, dữ liệu đúng từng dòng
    const B = (comp, data) => out.push(comp === 'Block/Table N' && LAST ? { comp, data, rows: LAST } : { comp, data });
    const chunkT = (rs, n) => { const a = chunkEven(rs, n); return { entries: function* () { for (const [i, p] of a.entries()) { LAST = p; yield [i, p]; } LAST = null; } }; };
    // ĐỀ MỤC LỚN theo mẫu sách đã duyệt (Figma "TEST PDF tiếng Anh"): Block/Section Bar = chữ cái A, B, C… to + tên mục + kẻ ngang màu brand
    let secNo = 0, curSec = ''; const SEC = text => (curSec = text, exNo = 0, B(TPL('Block/Section Bar') ? 'Block/Section Bar' : 'Block/Section Heading', TPL('Block/Section Bar') ? { letter: String.fromCharCode(65 + secNo++), title: text, lesson: '' } : { text }));
    let exNo = 0; const ex = () => String(++exNo);   // đếm lại từ 1 ở mỗi mục (SEC) – người dùng 3/11: Luyện tập mở đầu bằng '3.' vì bài tập mục trước chiếm 1, 2
    const title = S(info['Tên buổi']) || 'Buổi ' + buoi;
    B('Block/Lesson Header', { lesson: info['Bài'] ? 'Bài ' + Number(info['Bài']) : 'Buổi ' + bNum(buoi),   /* buổi ôn – kiểm tra không có số Bài → ghi Buổi n (28/10) */ 'title.vi': title.replace(/^Bài\s*\d+\s*[–-]\s*/i, ''), /* ô "Bài n" đã có số bài → tên không lặp "Bài n –" (28/10) */ 'title.native': course['Tên khoá'] || '' });
    const objs = objSplit((info['Mục tiêu bài'] || info['MỤC TIÊU BÀI HỌC'] || info['Mục tiêu bài học']) || (s5row['Mục tiêu bài'] || s5row['MỤC TIÊU BÀI HỌC'] || s5row['Mục tiêu bài học'])).slice(0, 5);
    if (objs.length) { const d = { no: '', title: 'Mục tiêu bài học' }; objs.forEach((t, i) => { d[`obj_${i + 1}.bullet`] = '•'; d[`obj_${i + 1}.text`] = t; }); B('Block/Objectives', d); }

    const pron = tab(s6, /Phát âm/).filter(r => isB(r, buoi) && onPDF(r));
    const F_pron = T => { if (!pron.length) return; SEC(T || 'Phát âm');
      // BẢNG TỔNG PINYIN (Đắc Nhân – người dùng 2/11, như giáo trình gốc): THANH MẪU | VẬN MẪU, gom theo cụm âm ("4 thanh mẫu – âm đầu lưỡi": d t n l), 2 âm / hàng
      if (brand === 'Đắc Nhân') { const grp = side => { const m = new Map(); pron.filter(r => new RegExp('^' + side, 'i').test(S(r['Bảng chữ / nhóm âm']))).forEach(r => { const k = S(r['Bảng chữ / nhóm âm']).replace(/\s*\(âm mũi\)\s*/i, '').trim(); if (!m.has(k)) m.set(k, []); m.get(k).push(S(r['Chữ / âm'])); }); return [...m.entries()]; };
        const tm = grp('thanh mẫu'), vm = grp('vận mẫu'), e = t => String(t).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
        if (tm.length || vm.length) { const col = gs => gs.map(([k, xs], gi) => `<div style="${gi ? 'border-top:1px dashed #C0392B;' : ''}"><div style="text-align:center;font-weight:700;padding:3px 6px;border-bottom:1px dashed #C0392B;color:#1a1a1a;opacity:1">${xs.length} ${e(k.charAt(0).toLowerCase() + k.slice(1))}</div><div style="display:grid;grid-template-columns:1fr 1fr;row-gap:2px;padding:4px 6px;text-align:center;color:#C0392B;font-weight:700">${xs.map(x => `<span>${e(x)}</span>`).join('')}</div></div>`).join('');
          const sides = [['THANH MẪU', tm], ['VẬN MẪU', vm]].filter(([, g]) => g.length);
          const html = `<div style="display:grid;grid-template-columns:repeat(${sides.length},minmax(0,1fr));border:1px solid #C0392B;color:#1a1a1a;opacity:1;font-size:10.5px;line-height:1.5;margin:2px 24px 4px">`
            + sides.map(([h], i) => `<div style="background:#E07B39;color:#fff;font-weight:700;text-align:center;padding:4px;${i ? 'border-left:1px solid #C0392B;' : ''}">${h}</div>`).join('')
            + sides.map(([, g], i) => `<div style="${i ? 'border-left:1px dashed #C0392B;' : ''}">${col(g)}</div>`).join('') + '</div>';
          B('Block/Paragraph', { text: 'PINYIN' }); out[out.length - 1].html = html; out[out.length - 1].role = 'pyov'; } }

      // GOM CỤM theo nhóm âm (Thanh mẫu / Vận mẫu / Thanh điệu …): 1 tiêu đề + bảng Âm · Hướng dẫn · Âm tương tự · Ví dụ + 1 bài đọc to gom ví dụ của cả cụm (28/10)
      const capH = s => /\s/.test(s) ? s.replace(/^[a-zà-ỹđ]/, c => c.toUpperCase()) : s;
      for (const [ck, rs] of pronClusters(pron)) { B('Block/Sub Heading', { text: capH(ck) });
        const subs = new Set(rs.map(r => S(r['Bảng chữ / nhóm âm']))).size > 1;
        const noGrp = /vận mẫu/i.test(ck);   // MỤC VẬN MẪU bỏ cột "Bảng chữ / nhóm âm" (người dùng 4/11 – tiêu đề cụm đã ghi nhóm); cột không có dữ liệu tự ẩn
        for (const [pi, part] of chunkT(rs, 6).entries()) { const d = Object.assign(noGrp ? {} : { 'row_0.c1': 'Bảng chữ / nhóm âm' }, { 'row_0.c2': 'Âm', 'row_0.c3': 'Hướng dẫn phát âm', 'row_0.c4': 'Âm tương tự', 'row_0.c5': 'Ví dụ' });
          part.forEach((r, i) => { if (!noGrp) d[`row_${i + 1}.c1`] = S(r['Bảng chữ / nhóm âm']); d[`row_${i + 1}.c2`] = S(r['Chữ / âm']); d[`row_${i + 1}.c3`] = S(r['Hướng dẫn phát âm']); d[`row_${i + 1}.c4`] = S(r['Chữ phát âm tương tự']); d[`row_${i + 1}.c5`] = S(r['Ví dụ']); });
          B('Block/Table N', d); out[out.length - 1].role = 'pron'; if (pi) out[out.length - 1].cont = true; }
        /* bỏ bài "Đọc to các từ sau" – ví dụ đã nằm trong bảng (người dùng 28/10) */ } };

    const vocab = tab(s6, /Từ vựng$/).filter(r => isB(r, buoi) && onPDF(r) && S(r['Từ']));
    const F_vocab = T => { if (!vocab.length) return; SEC(T || 'Từ vựng'); 
      // BUỔI ÔN – TỪ VỰNG THEO CHỦ ĐỀ (người dùng 6/11 – FORMAT_NP sheet NP): S6 có "Thứ tự chủ đề" + "Nhóm" → xếp theo thứ tự đó, mỗi chủ đề 1 dải tên, STT liên tục
      if (brand === 'Đắc Nhân' && gramTable && vocab.some(r => S(r['Thứ tự chủ đề']))) { let no = 0, first = true;
        const vs = vocab.slice().sort((a, b) => (+a['Thứ tự chủ đề'] || 1e9) - (+b['Thứ tự chủ đề'] || 1e9)), groups = [];
        vs.forEach(r => { const t = S(r['Nhóm']) || 'Khác', g = groups[groups.length - 1]; if (g && g.t === t) g.rows.push(r); else groups.push({ t, rows: [r] }); });
        for (const g of groups) { B('Block/Paragraph', { text: g.t }); out[out.length - 1].role = 'label';
          for (const [, part] of chunkT(g.rows, 8).entries()) { const d = { 'row_0.c1': 'STT', 'row_0.c2': 'Từ vựng', 'row_0.c3': 'Pinyin', 'row_0.c4': 'Nghĩa' };
            part.forEach((r, i) => { d[`row_${i + 1}.c1`] = String(++no); d[`row_${i + 1}.c2`] = S(r['Từ']); d[`row_${i + 1}.c3`] = S(r['Phiên âm / cách đọc']); d[`row_${i + 1}.c4`] = S(r['Nghĩa']); });
            B('Block/Table N', d); out[out.length - 1].role = 'vocab4'; if (!first) out[out.length - 1].cont = true; first = false; } }
        return; }
      if (brand === 'Đắc Nhân') { let no = 0;   // Đắc Nhân (người dùng 2/11): bảng từ vựng chỉ 4 cột STT · Từ vựng · Pinyin · Nghĩa
        for (const [pi, part] of chunkT(vocab, 8).entries()) { const d = { 'row_0.c1': 'STT', 'row_0.c2': 'Từ vựng', 'row_0.c3': 'Pinyin', 'row_0.c4': 'Nghĩa' };
          part.forEach((r, i) => { d[`row_${i + 1}.c1`] = String(++no); d[`row_${i + 1}.c2`] = S(r['Từ']); d[`row_${i + 1}.c3`] = S(r['Phiên âm / cách đọc']); d[`row_${i + 1}.c4`] = S(r['Nghĩa']); });
          B('Block/Table N', d); out[out.length - 1].role = 'vocab4'; if (pi) out[out.length - 1].cont = true; }
        return; }
      for (const [pi, part] of chunkT(vocab, 8).entries()) { const d = { 'row_0.c1': 'Từ', 'row_0.c2': 'Phiên âm', 'row_0.c3': 'Loại từ', 'row_0.c4': 'Nghĩa', 'row_0.c5': 'Ví dụ' }; part.forEach((r, i) => { d[`row_${i + 1}.c1`] = S(r['Từ']); d[`row_${i + 1}.c2`] = S(r['Phiên âm / cách đọc']); d[`row_${i + 1}.c3`] = S(r['Loại từ']); d[`row_${i + 1}.c4`] = S(r['Nghĩa']); d[`row_${i + 1}.c5`] = [S(r['Ví dụ 1']), S(r['Phiên âm ví dụ 1']), S(r['Nghĩa ví dụ 1'])].filter(Boolean).join('\n'); }); B('Block/Table N', d); out[out.length - 1].role = 'vocab'; if (pi) out[out.length - 1].cont = true; } };

    const grammar = tab(s6, /Ngữ pháp$/).filter(r => isB(r, buoi) && onPDF(r));
    const gq = tab(s6, /Câu hỏi ngữ pháp/).filter(r => isB(r, buoi) && onPDF(r));
    // BUỔI ÔN – KIỂM TRA (Đắc Nhân, 6/11 – FORMAT_NP): ngữ pháp thành BẢNG 4 cột STT · Tên ngữ pháp · Cấu trúc · Câu ví dụ (như bảng từ vựng).
    // Mỗi ô là nguyên văn ô S6 (Tên ngữ pháp / Nghĩa, Cấu trúc (công thức), Ví dụ 1 / Phiên âm / Nghĩa ví dụ 1) → sửa chữ trên sách vẫn ghi ngược đúng ô S6.
    const gramTable = brand === 'Đắc Nhân' && /ôn/i.test(S((tab(s6, /Khoá & bài/).find(r => isB(r, buoi)) || {})['Loại buổi']));
    const F_grammar = T => { if (!grammar.length) return; SEC(T || 'Ngữ pháp'); 
      if (gramTable) { let no = 0;
        for (const [pi, part] of chunkT(grammar, 3).entries()) { const d = { 'row_0.c1': 'STT', 'row_0.c2': 'Tên ngữ pháp', 'row_0.c3': 'Cấu trúc', 'row_0.c4': 'Câu ví dụ' };
          part.forEach((g, i) => { const k = `row_${i + 1}`; d[k + '.c1'] = String(++no); d[k + '.c2'] = [S(g['Tên ngữ pháp']), S(g['Nghĩa'])].filter(Boolean).join('\n');
            d[k + '.c3'] = S(g['Cấu trúc (công thức)']).split(/\n|;\s*(?![^(]*\))/).map(S).filter(Boolean).join('\n');
            d[k + '.c4'] = [S(g['Ví dụ 1']), S(g['Phiên âm ví dụ 1']), S(g['Nghĩa ví dụ 1']) && '→ ' + S(g['Nghĩa ví dụ 1'])].filter(Boolean).join('\n'); });
          B('Block/Table N', d); out[out.length - 1].role = 'gram4'; if (pi) out[out.length - 1].cont = true;
          { const sh = Object.keys(s6).find(k => /Ngữ pháp$/.test(k)), src = {}; part.forEach((g, i) => { const k = `row_${i + 1}`, R = g.__r, at = c => [sh, R, c];
              src[k + '.c2'] = ['Tên ngữ pháp', 'Nghĩa'].filter(c => S(g[c])).map(at); src[k + '.c3'] = S(g['Cấu trúc (công thức)']).split(/\n|;\s*(?![^(]*\))/).map(S).filter(Boolean).map(() => at('Cấu trúc (công thức)'));
              src[k + '.c4'] = ['Ví dụ 1', 'Phiên âm ví dụ 1', 'Nghĩa ví dụ 1'].filter(c => S(g[c])).map(at); }); out[out.length - 1].src = src; } }
        const gqs = gq.filter(q => grammar.some(g => S(g['Mã mục']) === S(q['Mã ngữ pháp'])));
        if (gqs.length) { B('Block/Sub Heading', { text: 'Luyện tập ngữ pháp' }); out[out.length - 1].role = 'practice'; exercises(gqs, ''); }
        return; }
      for (const [gi, g] of grammar.entries()) {
        B('Block/Sub Heading', { text: `${gi + 1}. ` + [gTitlePy(S(g['Tên ngữ pháp'])), gMean(S(g['Nghĩa']))].filter(Boolean).join(' – ') });   // điểm ngữ pháp đánh số 1, 2… trong mục
        // nhãn "Cấu trúc" chỉ ở dòng đầu, các dòng sau để trống nhãn → các công thức xếp thẳng một cột
        let lastLab = null; for (const l of S(g['Cấu trúc (công thức)']).split('\n').map(S).filter(Boolean).slice(0, 4)) { const m = l.match(/^([^:+]{2,32}):\s*(.+)$/); const lab = m ? m[1] : 'Cấu trúc'; B('Block/Structure', { label: lab === lastLab ? '\u00a0' : lab, formula: m ? m[2] : l }); lastLab = lab; }
        if (S(g['Cách sử dụng'])) B('Block/Paragraph', { text: S(g['Cách sử dụng']) });
        const d = {}; [1, 2, 3].forEach(i => { if (S(g['Ví dụ ' + i])) { d[`ex_${i}.de`] = S(g['Ví dụ ' + i]); d[`ex_${i}.vi`] = S(g['Nghĩa ví dụ ' + i]); } }); if (Object.keys(d).length) B('Block/Example Box', d);
        if (S(g['Lưu ý'])) B('Block/Note Box', { title: 'Lưu ý', text: S(g['Lưu ý']) });
      }
      const gqs = gq.filter(q => grammar.some(g => S(g['Mã mục']) === S(q['Mã ngữ pháp'])));
      if (gqs.length) { B('Block/Sub Heading', { text: 'Luyện tập' }); out[out.length - 1].role = 'practice'; exercises(gqs, ''); }   // bài tập tách khỏi điểm ngữ pháp cuối, có tiêu đề riêng
    };

    const speak0 = tab(s6, /Mẫu câu/).filter(r => isB(r, buoi) && onPDF(r) && S(r['Câu']));
    const F_speak = (T, only) => { const speak = only ? speak0.filter(only) : speak0; if (!speak.length) return; SEC(T || 'Mẫu câu giao tiếp'); 
      // THEO ĐÚNG BẢNG S6 (người dùng 28/10): giữ thứ tự dòng; đoạn liền nhau cùng "Chủ đề / tình huống" (+ Loại khi trống) = 1 bảng, tiêu đề nguyên văn
      const blks = []; speak.forEach(r => { const t = S(r['Chủ đề / tình huống']).replace(/^none$/i, ''), lo = S(r['Loại']), l = blks[blks.length - 1]; if (l && l.t === t && (t || l.lo === lo)) l.rows.push(r); else blks.push({ t, lo, rows: [r] }); });
      for (const bl of blks) { if (!(brand === 'Đắc Nhân' && /^hội thoại mẫu/i.test(bl.t))) B('Block/Sub Heading', { text: bl.t || bl.lo || 'Mẫu câu' });   // Đắc Nhân: bỏ dòng tiêu đề "Hội thoại mẫu – …" (người dùng 2/11)
        const hasV = bl.rows.some(r => S(r['Vai'])), hasT = bl.rows.some(r => S(r['Từ thay thế'])); const cols = [...(hasV ? [['Vai', 'Vai']] : []), ['Câu', 'Câu'], ['Phiên âm', 'Phiên âm'], ['Nghĩa', 'Nghĩa'], ...(hasT ? [['Từ thay thế', 'Từ thay thế']] : [])];
        const ab = root.PLS_ROLE_AB(bl.rows);   // tên vai A, B, C… (người dùng 3/11)
        for (const [pi, part] of chunkT(bl.rows, 8).entries()) { const d = {}; cols.forEach(([h], c) => { d[`row_0.c${c + 1}`] = h; }); part.forEach((r, i) => cols.forEach(([, k], c) => { d[`row_${i + 1}.c${c + 1}`] = k === 'Vai' ? ab(r) : S(r[k]); }));
          B('Block/Table N', d); out[out.length - 1].role = 'speak' + cols.length + (hasV ? 'v' : ''); if (pi) out[out.length - 1].cont = true; } } };

    // (Nghe / Đọc không lên sách – xem quyết định D13 trong DECISIONS.md; dữ liệu Nghe/Đọc chỉ dùng cho slide / app / audio)

    // HÁN TỰ (S6-Hán tự): bảng chữ – âm đọc – nghĩa – bộ thủ
    const hz = tab(s6, /Hán tự$/).filter(r => isB(r, buoi) && onPDF(r) && S(r['Hán tự']));
    const F_hanzi = T => { if (!hz.length) return; SEC(T || 'Hán tự');
      if (brand === 'Đắc Nhân') { let no = 0;   // Đắc Nhân (người dùng 2/11): thêm cột STT, "Âm đọc" → "Pinyin"
        for (const [pi, part] of chunkT(hz, 8).entries()) { const d = { 'row_0.c1': 'STT', 'row_0.c2': 'Chữ', 'row_0.c3': 'Pinyin', 'row_0.c4': 'Nghĩa', 'row_0.c5': 'Bộ thủ' }; part.forEach((r, i) => { d[`row_${i + 1}.c1`] = String(++no); d[`row_${i + 1}.c2`] = S(r['Hán tự']); d[`row_${i + 1}.c3`] = S(r['Âm đọc']); d[`row_${i + 1}.c4`] = S(r['Nghĩa']); d[`row_${i + 1}.c5`] = S(r['Bộ thủ']); }); B('Block/Table N', d); out[out.length - 1].role = 'hanzi5'; if (pi) out[out.length - 1].cont = true; }
        return; }
      for (const [pi, part] of chunkT(hz, 8).entries()) { const d = { 'row_0.c1': 'Chữ', 'row_0.c2': 'Âm đọc', 'row_0.c3': 'Nghĩa', 'row_0.c4': 'Bộ thủ' }; part.forEach((r, i) => { d[`row_${i + 1}.c1`] = S(r['Hán tự']); d[`row_${i + 1}.c2`] = S(r['Âm đọc']); d[`row_${i + 1}.c3`] = S(r['Nghĩa']); d[`row_${i + 1}.c4`] = S(r['Bộ thủ']); }); B('Block/Table N', d); if (pi) out[out.length - 1].cont = true; } };
    const cu = tab(s6, /Ngoài kiến thức/).filter(r => isB(r, buoi) && onPDF(r) && S(r['Tiêu đề']));
    const F_culture = T => { if (!cu.length) return; SEC(T || 'Văn hoá'); cu.forEach(r => B('Block/Note Box', { title: S(r['Tiêu đề']), text: S(r['Nội dung']) })); };
    // THỨ TỰ MỤC = ĐÚNG THỨ TỰ HOẠT ĐỘNG TRONG S5 (người dùng 28/10 – "cực kì nguy hiểm" nếu lệch): tên mục lấy theo tên bước của S5
    { const gb = s5 || {}, gk = Object.keys(gb).find(k => /Hướng dẫn giảng dạy/.test(k));
      let steps = (gk ? gb[gk] : []).filter(r => isB(r, buoi) && S(r['Hoạt động'])).sort((a, b) => (+a['STT hoạt động'] || 0) - (+b['STT hoạt động'] || 0)).map(r => S(r['Hoạt động']).replace(/\s*\n\s*/g, ' '));
      if (!steps.length) steps = S(s5row['Nội dung buổi (timeline)']).split(/\n+/).map(l => (l.match(/^\s*\d+\.\s*(.+?)\s*:\s*\d+\s*p/i) || [])[1]).filter(Boolean);
      steps = steps.filter(n => !/dặn dò/i.test(n));
      { const RANK = n => /cttt|khai giảng/i.test(n) ? 0 : /từ vựng/i.test(n) ? 1 : /hán tự/i.test(n) ? 2 : /bảng chữ/i.test(n) ? 3 : /phát âm/i.test(n) ? 4 : /mẫu câu|giao tiếp|hội thoại|nói/i.test(n) ? 5 : null;   // cùng thứ tự chốt với slide (28/10)
        const slots = steps.map((x, i) => RANK(x) != null ? i : -1).filter(i => i >= 0), ranked = slots.map(i => steps[i]).sort((a, b) => RANK(a) - RANK(b)); slots.forEach((i, k) => { steps[i] = ranked[k]; }); }
      const KIND = n => /phát âm|bảng chữ/i.test(n) ? 'pron' : /hán tự/i.test(n) ? 'hanzi' : /từ vựng/i.test(n) ? 'vocab' : /ngữ pháp/i.test(n) ? 'grammar' : /mẫu câu|giao tiếp|nói/i.test(n) ? 'speak' : /hội thoại/i.test(n) ? 'dlg' : /^nghe/i.test(n) ? 'listen' : /^đọc/i.test(n) ? 'read' : /văn hó?a|văn hoá/i.test(n) ? 'culture' : null;
      const isDl = r => /hội thoại/i.test(S(r['Loại'])), hasDl = steps.some(n => KIND(n) === 'dlg');
      // bước "Hội thoại" chỉ in dòng Loại = Hội thoại; bước Mẫu câu / Nói in phần còn lại (nếu S5 có bước Hội thoại riêng) – người dùng 28/10
      const F = { culture: F_culture, pron: F_pron, hanzi: F_hanzi, vocab: F_vocab, grammar: F_grammar, speak: T => F_speak(T, hasDl ? r => !isDl(r) : null), dlg: T => F_speak(T, isDl), listen: () => {}, read: () => {} }, done = new Set();   // NGHE / ĐỌC KHÔNG LÊN SÁCH – MỌI KHOÁ (người dùng 3/11: luyện trên app, cuối bài có mục 'Luyện kỹ năng đọc và nghe'). Trước đây in theo bước S5 → cả HSK1 lẫn HSK2 có Nghe/Đọc.
      const nice = n => { const t = n.replace(/\s*\d+\s*PHÚT\b/i, '').replace(/\s*\n.*$/, '').trim().toLowerCase(); return t.charAt(0).toUpperCase() + t.slice(1); };
      for (const n of steps) { const k = KIND(n); if (k && !done.has(k)) { done.add(k); F[k](nice(n)); } }
      // CỘT "Lên PDF" = Có PHẢI LÊN SÁCH HẾT (người dùng 2/11): sau các phần theo thứ tự S5, in nốt phần nào còn dữ liệu Lên PDF mà S5 không có bước (mỗi hàm chỉ in khi có dòng)
      const isHsk1 = /HSK\s*1(?!\d)/i.test(tab(s6, /Thông tin khoá|Thông tin khóa/).filter(r => /tên khoá|tên khóa|cấp độ/i.test(S(r['Mục']))).map(r => S(r['Nội dung'])).join(' '));   // HSK1 đã duyệt (người dùng 2/11) → giữ nguyên
      // RULE NHƯ HSK1 (người dùng 2/11): Nghe / Đọc / Văn hoá theo bước S5; còn TỪ VỰNG, NGỮ PHÁP (+ câu hỏi), MẪU CÂU luôn lên đủ – buổi ôn chỉ ghi "Ôn tập" (HSK2 buổi 1–2) vẫn in
      for (const k of ['vocab', 'grammar', hasDl ? 'dlg' : null, 'speak'].filter(Boolean)) if (!done.has(k) && !(k === 'speak' && done.has('dlg') && !hasDl)) { done.add(k); F[k](k === 'vocab' || k === 'grammar' ? 'Ôn tập ' + (k === 'vocab' ? 'từ vựng' : 'ngữ pháp') : undefined); }
      if (false && !isHsk1) for (const k of ['pron', 'hanzi', 'vocab', 'grammar', ...(hasDl ? ['speak', 'dlg'] : ['speak']), 'listen', 'read', 'culture']) if (!done.has(k) && !(k === 'speak' && done.has('dlg') && !hasDl)) { done.add(k); F[k](); }
    }
    const hw = tab(s6, /BTVN/).filter(r => isB(r, buoi) && onPDF(r));
    if (hw.length) { SEC('Bài tập về nhà'); exercises(hw, ''); }
    // TỰ ĐÁNH GIÁ cuối bài (như Cambridge "Review your progress"): mỗi mục tiêu khoanh 3 / 2 / 1
    const hasS5 = (() => { const gb = s5 || {}, gk = Object.keys(gb).find(k => /Hướng dẫn giảng dạy/.test(k)); return !!(gk && gb[gk].some(r => isB(r, buoi))); })();
    /* bỏ mục Tự đánh giá tự sinh – không có trong S5/S6 (người dùng 28/10) */

    // LUYỆN TẬP TỔNG HỢP (Đắc Nhân HSK1 – người dùng 2/11: nguyên văn file "LUYỆN TẬP TH BUỔI 1/2"): sau nội dung cuối, trước Luyện kỹ năng đọc và nghe
    { const meta0 = tab(s6, /Thông tin khoá|Thông tin khóa/).filter(r => /tên khoá|tên khóa|cấp độ/i.test(S(r['Mục']))).map(r => S(r['Nội dung'])).join(' ');   /* chỉ tên khoá + cấp độ (mô tả HSK2 có chữ 'sau HSK1') */
      const ltRows = brand === 'Đắc Nhân' ? tab(s6, /Luyện tập tổng hợp/).filter(r => isB(r, buoi) && onPDF(r) && S(r['Nội dung'])) : [];   // tab S6 (6/11) – ưu tiên; buổi ôn giữa / cuối kỳ không có dòng → không có mục
      const LT = ltRows.length ? LT_HTML(ltRows, Object.keys(s6).find(k => /Luyện tập tổng hợp/.test(k))) : brand === 'Đắc Nhân' && /HSK\s*1(?!\d)/i.test(meta0) ? (DN_PRACTICE[bNum(buoi)] || null) : null;
      if (LT) { SEC('Luyện tập tổng hợp'); LT.forEach(h => { B('Block/Paragraph', { text: 'LT' }); out[out.length - 1].html = h; }); }
      // ĐÁP ÁN LUYỆN TẬP TỔNG HỢP (người dùng 6/11: phần đáp án mới chỉ có ngữ pháp) – cột "Đáp án" của tab, vào mục Đáp án cuối bài như các bài tập khác
      if (ltRows.length) ltRows.filter(r => S(r['Đáp án'])).forEach((r, i, arr) => { const no = S(r['Phần']), same = arr.filter(x => S(x['Phần']) === no), first = S(r['Nội dung']).split(/\s*\|\s*/).filter(Boolean);
        const bang = /bảng/i.test(S(r['Dạng']));
        keys.push({ sec: 'Luyện tập tổng hợp', ex: no, ins: S(r['Tên phần']).toLowerCase().replace(/^./, c => c.toUpperCase()), i: bang ? (first[0] || same.indexOf(r) + 1) : [S(r['Câu']), S(r['Vai'])].filter(Boolean).join(' ') || same.indexOf(r) + 1,
          why: '', a: bang ? [first[1], S(r['Đáp án']).split(/\s*\|\s*/).join(' – ')].filter(Boolean).join(': ') : S(r['Đáp án']) }); }); }
    // LUYỆN KỸ NĂNG ĐỌC VÀ NGHE (Đắc Nhân – người dùng 2/11): mục cuối của mỗi bài, chữ cái nối tiếp các mục trước (A, B, C…), trước lời dặn dò
    if (brand === 'Đắc Nhân' && out.length) { SEC('Luyện kỹ năng đọc và nghe');   /* bật lại 2/11: đặt sau Luyện tập tổng hợp */ B('Block/Paragraph', { text: 'Học viên làm bài trên app Đắc Nhân.' });
      out[out.length - 1].html = '<div style="text-align:center;font-size:11px;color:#1a1a1a">Học viên làm bài trên <b style="color:#B71C1C">app Đắc Nhân</b>.</div>'; }
    if (keys.length) { SEC('Đáp án');
      // ĐÁP ÁN THEO MỤC → THEO BÀI (người dùng chốt 23/10: như sách giáo trình – không dồn 1 khối chữ chạy liền):
      // mỗi mục (Ngữ pháp, Nghe…) 1 tiêu đề con; mỗi bài 1 nhãn "Bài 2 · Làm các câu sau."; có giải thích → bảng Câu | Đáp án | Giải thích,
      // đáp án ngắn không giải thích → lưới 4 cặp Câu – Đáp án / hàng, dài → bảng Câu | Đáp án
      const bySec = []; for (const k of keys) { let g = bySec.find(x => x.sec === k.sec); if (!g) bySec.push(g = { sec: k.sec, ex: [] }); let e = g.ex.find(x => x.no === k.ex); if (!e) g.ex.push(e = { no: k.ex, ins: k.ins, items: [] }); e.items.push(k); }
      for (const g of bySec) {
        if (bySec.length > 1 || g.sec) { B('Block/Sub Heading', { text: g.sec || 'Bài tập' }); }
        for (const e of g.ex) {
          B('Block/Paragraph', { text: `Bài ${e.no} · ${e.ins}` }); out[out.length - 1].role = 'label';
          const why = e.items.some(k => k.why), long = e.items.some(k => k.a.length > 22);
          if (why || long) {
            const head = why ? { 'row_0.c1': 'Câu', 'row_0.c2': 'Đáp án', 'row_0.c3': 'Giải thích' } : { 'row_0.c1': 'Câu', 'row_0.c2': 'Đáp án' };
            for (const [pi, part] of chunkEven(e.items, 8).entries()) { const d = Object.assign({}, head); part.forEach((k, i) => { d[`row_${i + 1}.c1`] = String(k.i); d[`row_${i + 1}.c2`] = ANS1(k.a) || '–'; if (why) d[`row_${i + 1}.c3`] = k.why || ''; });
              B('Block/Table N', d); out[out.length - 1].role = why ? 'ans3' : 'ans2'; if (pi) out[out.length - 1].cont = true; }
          } else {
            const rows = chunk(e.items, 4), d = {}; for (let c = 0; c < Math.min(4, e.items.length); c++) { d[`row_0.c${c * 2 + 1}`] = 'Câu'; d[`row_0.c${c * 2 + 2}`] = 'Đáp án'; }
            for (const [pi, part] of chunk(rows, 8).entries()) { const dd = Object.assign({}, d); part.forEach((r, ri) => r.forEach((k, c) => { dd[`row_${ri + 1}.c${c * 2 + 1}`] = String(k.i); dd[`row_${ri + 1}.c${c * 2 + 2}`] = ANS1(k.a) || '–'; }));
              B('Block/Table N', dd); out[out.length - 1].role = 'ansgrid'; if (pi) out[out.length - 1].cont = true; }
          }
        }
      } }
    // BẢNG CHIA NHIỀU PHẦN (chunkEven / cont): mọi phần dùng chung dữ liệu cả bảng để tính độ rộng cột → các cột thẳng nhau (người dùng 2/11: "canh ô bị lệch")
    for (let i = 0; i < out.length; i++) { const b = out[i]; if (b.comp !== 'Block/Table N' || b.cont) continue; const grp = [b]; for (let j = i + 1; j < out.length && out[j].comp === b.comp && out[j].cont && out[j].role === b.role; j++) grp.push(out[j]);
      if (grp.length < 2) continue; const full = {}; let k = 0;
      for (const x of grp) { const rs = [...new Set(Object.keys(x.data).map(q => (q.match(/^row_(\d+)\./) || [])[1]).filter(n => n && n !== '0'))].sort((a, c) => a - c);
        for (const [q, v] of Object.entries(x.data)) if (/^row_0\./.test(q) || !/^row_\d+\./.test(q)) full[q] = v;
        rs.forEach(n => { k++; for (const [q, v] of Object.entries(x.data)) { const m = q.match(/^row_(\d+)\.(.*)$/); if (m && m[1] === n) full[`row_${k}.${m[2]}`] = v; } }); }
      grp.forEach(x => { x.full = full; }); }
    return out;

    // bài tập: gom theo phần + dạng → Exercise (trắc nghiệm, viết) / Matching / Sentence Order, tối đa 5 câu/khối; đáp án gom cuối sách
    function exercises(rows, defIns) {
      const groups = []; let g = null;
      for (const r of rows) { const t = S(r['Dạng câu']); const kind = /trắc nghiệm/i.test(t) ? 'mc' : /sắp xếp/i.test(t) ? 'order' : /nối/i.test(t) ? 'match' : /tự luận|viết/i.test(t) && !/tay/i.test(t) ? 'write' : null; if (!kind) continue;
        // trắc nghiệm + điền / viết dùng chung khối Exercise → gom liền nhau thành 1 bài (đánh số 1, 2, 3…), không tách mỗi câu 1 bài
        const ins = S(r['Hướng dẫn làm bài']) || defIns; const fam = kind === 'mc' || kind === 'write' ? 'ex' : kind; const k = S(r['Phần']) + '|' + fam + '|' + ins;
        if (!g || g.k !== k) groups.push(g = { k, kind, ins, kinds: new Set(), rows: [] }); g.kinds.add(kind); g.rows.push(r); }
      for (const gr of groups) if (!gr.ins) gr.ins = [...new Set(gr.rows.map(r => S(r['Dạng câu'])).filter(Boolean))].join(' / ');   // S6 không ghi hướng dẫn → dùng nguyên văn cột Dạng câu, không tự viết (28/10)
      for (const gr of groups) for (const part of chunk(gr.rows, 5)) {
        const no = ex(), d = { no: 'Bài ' + no, instruction: gr.ins || '', 'head.track': '', 'head.ab': '' };
        part.forEach((r, i) => { const n = `${no}.${i + 1}`; let q = S(r['Câu hỏi']).replace(/^\[[^\]]{1,80}\]\s*/, '');
          if (gr.kind === 'match') { d[`item_${i + 1}.no`] = String(i + 1); d[`item_${i + 1}.text`] = q.replace(/^nối\s*[:：]?\s*/i, ''); d[`item_${i + 1}.blank`] = '____'; }
          else if (gr.kind === 'order') { d[`item_${i + 1}.no`] = String(i + 1); { const parts = LET.map(L => S(r[L])).map((o2, j) => o2 ? `${LET[j]} ${o2}` : '').filter(Boolean); const hint = q.replace(/^[^:]{0,60}:\s*/, ''); d[`item_${i + 1}.words`] = parts.length >= 2 ? (/[\u3400-\u9fff]/.test(hint) ? '' : hint + '\n') + parts.join(' / ') : hint; }   /* 2/11 HSK2: có cụm A–D thì in cụm để sắp xếp (kèm nghĩa gợi ý) */ d[`item_${i + 1}.answer`] = ''; }
          else { const opts = /trắc nghiệm/i.test(S(r['Dạng câu'])) ? LET.map(L => S(r[L])).map((o, j) => o ? `${LET[j]}. ${o}` : '').filter(Boolean) : []; d[`item_${i + 1}.no`] = String(i + 1); d[`item_${i + 1}.text`] = q + (opts.length ? '\n' + opts.join('      ') : '\n______________________________'); }
          const a = S(r['Đáp án']); keys.push({ sec: curSec, ex: no, ins: gr.ins, i: i + 1, why: S(r['Giải thích']), a: /trắc nghiệm/i.test(S(r['Dạng câu'])) && LET.includes(a.toUpperCase().charAt(0)) && S(r[a.toUpperCase().charAt(0)]) ? `${a.toUpperCase().charAt(0)}. ${S(r[a.toUpperCase().charAt(0)])}` : a }); });
        if (gr.kind === 'match') { const rs = part.map(r => S(r['Đáp án'])); const sh = rs.map((_, i) => rs[(i * 2 + 1) % rs.length]); const ok = new Set(sh).size === rs.length; (ok ? sh : rs.slice().reverse()).forEach((m, i) => { d[`item_${i + 1}.key`] = 'abcde'[i]; d[`item_${i + 1}.match`] = m; }); }
        out.push({ comp: gr.kind === 'match' ? 'Block/Matching' : gr.kind === 'order' ? 'Block/Sentence Order' : 'Block/Exercise', data: d });
      }
    }
  }

  // TÁCH Ý MỤC TIÊU BÀI (người dùng 3/11: "Câu so sánh (1); Câu so sánh (2); Câu so sánh (3)" bị tách 3 gạch đầu dòng, ý cuối bị đẩy mất):
  // 1 ý = 1 dòng / 1 câu; dấu ';' chỉ tách khi phần sau mở đầu như một ý mới ("Học viên…", "HV…"), còn lại là liệt kê trong cùng ý → giữ nguyên văn
  function objSplit(v) { const out = [];
    for (const sen of S(v).split(/\n|(?<=[.!?])\s+(?=[A-ZÀ-ỸĐ])/)) { let cur = '';
      for (const part of sen.split(/;\s*/)) { const p = part.replace(/^[-•\d.\s]+/, '').trim(); if (!p) continue;
        if (cur && !/^(Học viên|HV)\b/i.test(p)) cur += '; ' + p; else { if (cur) out.push(cur); cur = p; } }
      if (cur) out.push(cur); }
    return out; }
  // ---------- xếp trang ----------
  // ---------- KHUÔN TRÌNH BÀY SÁCH (người dùng chốt 23/10: phân cấp – lề – cỡ chữ phải thống nhất) ----------
  // 1 thang cỡ chữ, 1 thang khoảng cách, mọi khối thẳng lề trái của vùng nội dung; khoảng cách giữa khối theo QUAN HỆ
  // (mục lớn cách xa, các dòng cùng nhóm sát nhau) thay cho khoảng 14px đều mọi chỗ.
  const BOOK_FS = { 22: 22, 14: 16, 12: 12.5, 11.5: 11, 10: 10.5, 8.5: 9, 8: 8 };          // cỡ mẫu Figma → cỡ sách (pt trên trang 595)
  const BOOK_LH = fs => fs >= 16 ? 1.2 : fs >= 12 ? 1.3 : 1.45;                              // chữ Việt có dấu cần dòng thoáng
  const KIND = (c, b) => b && b.role === 'label' ? 'lab' : /Lesson Header/.test(c) ? 'h1' : /Section (Bar|Heading)/.test(c) ? 'sec' : /Sub Heading/.test(c) ? 'sub' : /Structure/.test(c) ? 'str'
    : /Paragraph/.test(c) ? 'p' : /Objectives/.test(c) ? 'obj' : /Exercise|Matching|Sentence Order|Pronunciation|True False/.test(c) ? 'ex' : /Dialogue/.test(c) ? 'dlg' : /Table/.test(c) ? 'tbl' : 'box';
  // khoảng cách TRƯỚC khối (px) theo khối liền trước
  function SPACE(prev, cur) {
    // THANG KHOẢNG CÁCH (bội 4): 32 trước mục lớn · 20 trước tiêu đề con · 16 giữa các bài tập / khối khác loại · 8 trong cùng một ý · 2 giữa các dòng công thức
    // → mắt thấy ngay đâu là mục mới, đâu là ý mới, đâu là các dòng của cùng một ý.
    const a = prev ? KIND(prev.comp, prev) : null, k = KIND(cur.comp, cur);
    if (!a) return 0;
    if (cur.cont) return 0;                       // bảng nối tiếp: liền với bảng trước như 1 bảng
    if (k === 'sec') return a === 'h1' || a === 'obj' ? 24 : 32;
    if (a === 'sec') return 14;
    if (k === 'sub') return a === 'sub' ? 6 : 20;
    if (a === 'sub') return 8;
    if (k === 'lab') return 16;
    if (a === 'lab') return 6;
    if (k === 'str' && a === 'str') return 2;
    if (k === 'dlg' && a === 'dlg') return 8;
    if (k === 'p' && (a === 'p' || a === 'str')) return 8;
    if (k === 'box' && (a === 'p' || a === 'str')) return 10;
    if (k === 'box' && a === 'box') return 10;
    if (k === 'ex' || a === 'ex') return 16;
    if (a === 'obj' || k === 'tbl') return 12;
    return 12;
  }
  const escH = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const INK = 'var(--color-primary-ink, var(--color-primary, #406864))';
  // ĐOẠN CÓ ĐÁNH SỐ ("1. …" / "1) …"): mỗi ý một dòng, số ở cột riêng 14px, chữ thụt treo thẳng hàng; phần quy tắc trước dấu ":" đậm 600.
  // Thay cho luật F.emph của slide (đậm cả dòng theo đoán nhãn / công thức → dòng 1, 3 đậm, dòng 2 thường – lộn xộn trên sách).
  function richList(te) {
    if (!te) return; const lines = [];
    // Ý ĐÁNH SỐ VIẾT LIỀN 1 DÒNG ("1. … (tiān lěng le). 2. 不……了 …" – người dùng 3/11): cắt ở " 2. ", " 3. "… đúng thứ tự số kế tiếp
    te.textContent.split('\n').map(x => x.trim()).filter(Boolean).forEach(l => { let m = l.match(/^(\d+)[.)]\s/); if (!m) { lines.push(l); return; } let k = +m[1], rest = l;
      for (;;) { const r = new RegExp(`(?<=[.;:!?。！？)）])\\s+(?=${k + 1}[.)]\\s)`).exec(rest); if (!r) break; lines.push(rest.slice(0, r.index).trim()); rest = rest.slice(r.index).trim(); k++; }
      lines.push(rest); });
    te.style.whiteSpace = 'normal'; delete te.dataset.emph;
    te.innerHTML = lines.map((l, i) => { const m = l.match(/^(\d+)[.)]\s+(.*)$/);
      if (!m) return `<div style="margin-top:${i ? 4 : 0}px">${escH(l)}</div>`;
      const c = m[2].indexOf(': '); const body = c > 0 && c < 80 ? `<span style="font-weight:600">${escH(m[2].slice(0, c + 1))}</span>${escH(m[2].slice(c + 1))}` : escH(m[2]);
      return `<div style="display:flex;gap:6px;margin-top:${i ? 3 : 0}px"><span style="flex:0 0 14px;font-weight:600;color:${INK}">${m[1]}.</span><span style="flex:1 1 0px;min-width:0">${body}</span></div>`; }).join('');
  }
  // ĐÁP ÁN TRẮC NGHIỆM: xếp lưới cột đều (4 cột nếu ngắn, 2 cột nếu vừa, 1 cột nếu dài) thay cho cách nhau bằng dấu cách → các A/B/C/D thẳng cột giữa các câu.
  function optionGrid(te) {
    const lines = te.textContent.split('\n'); const last = (lines[lines.length - 1] || '').trim(); if (!/^A\.\s/.test(last)) return;
    const opts = last.split(/\s{2,}(?=[A-F]\.\s)/).map(x => x.trim()); if (opts.length < 2) return;
    const wl = o => [...o.replace(/[{}]/g, '')].reduce((a, ch) => a + (/[\u3000-\u9fff\uff00-\uffef]/.test(ch) ? 2 : 1), 0);   // độ dài hiển thị: chữ Hán / dấu toàn khổ rộng gấp đôi
    const parts = o => { const m = o.slice(2).trim().match(/^(.*?)\s*(\{[^{}]+\}|[(（][^()（）]*[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü][^()（）]*[)）])\s*$/); return m ? [m[1], m[2]] : [o.slice(2).trim(), '']; };   // chữ Hán | {pinyin} hoặc (pinyin)
    // 2/11: 1 đáp án rớt dòng → MỌI đáp án trong câu đưa phiên âm xuống dòng (cho đều); vừa 1 hàng 4 cột thì giữ chung dòng
    const Lin = Math.max(...opts.map(o => wl(o.slice(2).trim()) + 3)), stack = !(Lin <= 20 && opts.length <= 4) && opts.some(o => parts(o)[1]);
    const L = stack ? Math.max(...opts.map(o => Math.max(...parts(o).map(wl)) + 3)) : Lin, cols = L <= 22 ? Math.min(4, opts.length) : L <= 40 ? 2 : 1;   /* 2/11: đáp án C dài (chữ Hán + pinyin) rớt pinyin lệch cột → 1 cột */
    te.style.whiteSpace = 'normal';
    te.innerHTML = `<div style="white-space:pre-wrap">${escH(lines.slice(0, -1).join('\n'))}</div><div style="display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));column-gap:12px;row-gap:2px;margin-top:3px">`
      + opts.map(o => `<span style="display:flex;gap:4px;align-items:baseline"><span style="flex:0 0 auto;font-weight:600">${escH(o.slice(0, 2))}</span><span style="flex:1 1 0px;min-width:0">${(([a, b]) => escH(a) + (b ? (stack ? `<span style="display:block">${escH(b)}</span>` : ' ' + escH(b)) : ''))(parts(o))}</span></span>`).join('') + '</div>';   /* 2/11: pinyin luôn xuống dòng riêng dưới chữ Hán – không rớt dòng lộn xộn */   // xuống dòng thì thẳng dưới chữ đáp án, không lùi ra dưới chữ cái
  }
  // SÁCH ĐẮC NHÂN theo giáo trình HSK1 bản 4.1 (người dùng 29/10 – chỉ học kiểu khớp dữ liệu S6): đề mục "(A) TÊN MỤC" căn giữa, tiêu đề ngữ pháp đỏ in hoa kẻ đôi,
  // nhãn "Định nghĩa / Ví dụ minh hoạ / Cấu trúc" nền cam nhạt, công thức trong khung viền cam, ví dụ số ①② + "→ nghĩa", bài tập "1. TÊN BÀI" + câu ①②, bảng đầu cam chữ trắng kẻ ngang nét đứt.
  const DN_RED = 'var(--color-primary-dark, #b33e00)', DN_OR = 'var(--color-primary, #e65100)', DN_SOFT = '#fdebdd';
  const CIRC = n => n >= 1 && n <= 20 ? String.fromCharCode(0x2460 + n - 1) : n + '.';
  const dnPill = t => Object.assign(t.style, { display: 'inline-block', alignSelf: 'flex-start', background: DN_SOFT, color: DN_RED, fontWeight: '700', padding: '2px 9px', borderRadius: '2px', textTransform: 'none' });
  // PINYIN {…} trong sách (người dùng 29/10: ô viền dày "rối quá"): chữ cam nhỏ đứng sau chữ Hán, không khung; {…} còn sót trong chữ thường cũng đổi
  const dnPinyin = el => {
    el.querySelectorAll('[data-n="tk_n"]').forEach(t => Object.assign(t.style, { boxShadow: 'none', background: 'none', padding: '0', borderRadius: '0', color: DN_OR, fontWeight: '600', fontSize: '0.92em', display: 'inline-block', maxWidth: '100%' }));   // cụm pinyin: chung dòng nếu đủ chỗ, không thì xuống dòng nguyên cụm (người dùng 29/10)
    const PY = /\{([^{}|]+)\}/g;
    el.querySelectorAll('[data-text]').forEach(t => { if (!/\{[^{}|]+\}/.test(t.textContent)) return;
      const tw = document.createTreeWalker(t, NodeFilter.SHOW_TEXT), nodes = []; while (tw.nextNode()) nodes.push(tw.currentNode);
      nodes.forEach(n => { if (!/\{[^{}|]+\}/.test(n.nodeValue)) return; const sp = document.createElement('span');
        sp.innerHTML = escH(n.nodeValue).replace(PY, `\u2009<span data-seg="py" style="color:${DN_OR};font-weight:600;font-size:0.92em;display:inline-block;max-width:100%">$1</span>`); n.replaceWith(...sp.childNodes); }); });   // cách mảnh trước pinyin: 的 de, không dính "的de"
  };
  // CHỮ HÁN TRONG TIÊU ĐỀ (người dùng 29/10: "tiêu đề đỏ đậm thấy nhỏ và mờ"): Khải thư không có nét đậm → tiêu đề dùng Noto Sans SC đậm, cỡ bằng chữ Việt
  const HAN_ST = "font-family:'Noto Sans SC','LXGW WenKai',sans-serif;font-weight:800;font-size:1em";
  const dnHanBold = root0 => { root0.querySelectorAll('[data-n="base"]').forEach(b => { if (/[\u3400-\u9fff]/.test(b.textContent)) b.style.cssText += ';' + HAN_ST; });
    const tw = document.createTreeWalker(root0, NodeFilter.SHOW_TEXT), ns = []; while (tw.nextNode()) ns.push(tw.currentNode);
    ns.forEach(n => { if (!/[\u3400-\u9fff]/.test(n.nodeValue) || (n.parentElement && n.parentElement.dataset.n === 'base')) return; const sp = document.createElement('span');
      sp.innerHTML = escH(n.nodeValue).replace(/([\u3400-\u9fff\u3000-\u303f“”"……]+)/g, `<span data-seg="han" style="${HAN_ST}">$1</span>`); n.replaceWith(...sp.childNodes); }); };
  // PINYIN TRÊN CHỮ HÁN như giáo trình gốc (người dùng 29/10): ví dụ ngữ pháp = 1 dòng pinyin nhỏ phía trên câu; câu sắp xếp "A 女儿 / B 是" = pinyin trên từng cụm.
  // Tra bằng pinyin-pro (vendor, MIT); câu đã có pinyin (dấu thanh) thì bỏ qua.
  const PYM = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/, HANR = /[\u3400-\u9fff]/;
  const PUN = { '。': '.', '，': ',', '！': '!', '？': '?', '、': ',', '：': ':', '；': ';', '“': '"', '”': '"', '（': '(', '）': ')' };
  // GHÉP PINYIN THEO TỪ ("lǎoshī", không "lǎo shī" – người dùng 29/10): pinyin-pro chỉ ghép từ đa âm → tự ghép theo từ điển:
  // từ HSK1 thông dụng + mọi từ trong bảng từ vựng các bài đã dựng (DN_WORDS, paginate nạp vào). Âm tiết sau bắt đầu a/o/e → thêm dấu ' (nǚ'ér).
  const DN_WORDS = new Set('老师 学生 同学 中文 汉语 中国 美国 法国 越南 英国 日本 北京 朋友 爸爸 妈妈 哥哥 姐姐 弟弟 妹妹 儿子 女儿 家人 先生 小姐 什么 名字 谢谢 对不起 没关系 不客气 再见 今天 明天 昨天 现在 时候 喜欢 认识 高兴 学校 医院 医生 飞机 电影 电视 电脑 吃饭 米饭 饭店 喝茶 水果 苹果 衣服 东西 商店 工作 学习 休息 睡觉 起床 上午 下午 中午 晚上 早上 一起 我们 你们 他们 她们 怎么 怎么样 多少 哪儿 那儿 这儿 哪里 这里 那里 这个 那个 哪个 几个 漂亮 可以 能够 知道 觉得 希望 开始 时间 星期 今年 去年 明年 岁数 年纪 生日 出租车 火车站 机场 公司 中午 下雨 天气 冷热 一点儿 有点儿 没有 不是 可是 但是 因为 所以 如果 已经 还是 或者 非常 真的 大家 你好 您好 老家 家里 宿舍 教室 图书馆 超市 银行 手机 电话 号码 汉字 生词 课文 作业 考试 问题 意思 地方 前面 后面 里面 外面 左边 右边 旁边 上面 下面'.split(' '));
  // THUẬT NGỮ NGỮ PHÁP (3/11 – tiêu đề ngữ pháp tự thêm pinyin phải ghép theo từ như HSK1 "jiégòu zhùcí")
  '汉语 基本 语序 名量 字句 结构 助词 语气 动词 能愿 名词 量词 名量词 数词 代词 疑问 副词 时间 词语 状语 位置 表达 表示 表示法 动态 并列 复句 存现句 处所 同时 顺序 序数 钱数 形容词 谓语 谓语句 正反 正反问 非主 主谓 格式 宾语 双宾语 离合词 范围 补语 结果 重叠 趋向 简单 复合 因果 转折 紧缩 状态 比较 比较句 时量 动量 选择 问句 固定 短语 受事 主语 程度 后缀 概数 定语 祈使句 兼语句 介词 方位词 连动句 数字 是非 动词性 短语 祈使 句子 用法 区别 后面 前面 时候 什么'.split(' ').forEach(w => DN_WORDS.add(w));
  const pyOf = t => { const P = root.pinyinPro; if (!P || !P.pinyin) return ''; try {
      let out = ''; const add = w => { out += (out && !/[\s("]$/.test(out) ? ' ' : '') + w; };
      for (const m of String(t).matchAll(/([㐀-鿿]+)|([^㐀-鿿]+)/g)) {
        if (m[1]) { const run = m[1], py = P.pinyin(run, { type: 'array' }); let k = 0;
          while (k < run.length) { let L = Math.min(4, run.length - k); while (L > 1 && !DN_WORDS.has(run.substr(k, L))) L--;
            add(py.slice(k, k + L).reduce((a, x) => a + (a && /^[aoeāáǎàōóǒòēéěè]/.test(x) ? "'" : '') + x, '')); k += L; } }
        else { for (const ch of m[2]) { if (PUN[ch]) out += PUN[ch]; else if (/\s/.test(ch)) { if (!/\s$/.test(out)) out += ' '; } else out += (out && /[\w)]$/.test(out) && /\w/.test(ch) && /\s$/.test(m[2].slice(0, 1)) ? '' : '') + ch; } } }
      return out.replace(/\s+([.,!?:;)])/g, '$1').replace(/\s+/g, ' ').trim(); } catch (e) { return ''; } };
  // TIÊU ĐỀ NGỮ PHÁP CÙNG ĐỊNH DẠNG HSK1 (người dùng 3/11): HSK1 ghi "“是”字句 {“shì” zìjù}（1）" – khoá khác chỉ ghi chữ Hán → tự thêm {pinyin} (giữ số (n) ở cuối, sau pinyin)
  // 4/11 người dùng: TIÊU ĐỀ NGỮ PHÁP KHÔNG CẦN PINYIN (mọi khoá) – bỏ {pinyin} có sẵn trong S6, không tự tra; giữ số phần '（n）'
  // 4/11 người dùng: tiêu đề chỉ giữ Hán + nghĩa – bỏ phần giải thích sau dấu ':' ("…Ở CUỐI CÂU HỎI: người nói đã đoán…" → "…Ở CUỐI CÂU HỎI")
  const gMean = t => { const m = String(t).match(/^(.{6,}?)\s*[:：]\s*(.+)$/); return (m ? m[1] : String(t)).trim(); };
  const gTitlePy = t => { const m = String(t).replace(/\s*\{[^}]*\}\s*/g, ' ').trim().match(/^(.*?)\s*[（(]\s*(\d+)\s*[）)]\s*$/); return m ? `${m[1]}（${m[2]}）` : String(t).replace(/\s*\{[^}]*\}\s*/g, ' ').trim(); };
  const capPy = t => t.replace(/^\s*([a-zāáǎàēéěèīíǐìōóǒòūúǔù])/, (m, c) => m.replace(c, c.toUpperCase()));
  const dnPyLine = (de, lead) => { if (!de || de.dataset.dnPy || !HANR.test(de.textContent) || PYM.test(de.textContent)) return; de.dataset.dnPy = '1';
    const han = de.textContent.replace(/^[\u2460-\u2473]\s*/, ''), py = capPy(pyOf(han)); if (!py) return;
    const d = document.createElement('div'); d.dataset.dn = 'pyline'; d.textContent = py; Object.assign(d.style, { fontSize: '8.5px', lineHeight: '1.2', color: '#3d3d3d', paddingLeft: lead || '0px', marginBottom: '1px' });
    de.parentElement.insertBefore(d, de); };
  const dnPyChunks = te => { if (!te || te.dataset.dnPy || !HANR.test(te.textContent) || PYM.test(te.textContent)) return; te.dataset.dnPy = '1';
    const tw = document.createTreeWalker(te, NodeFilter.SHOW_TEXT), ns = []; while (tw.nextNode()) ns.push(tw.currentNode);
    ns.forEach(n => { if (!HANR.test(n.nodeValue)) return; const sp = document.createElement('span');
      sp.innerHTML = escH(n.nodeValue).replace(/([\u3400-\u9fff][\u3400-\u9fff\u3000-\u303f\uff01-\uff5e]*)/g, h => `<span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:bottom;line-height:1.15"><span style="font-size:0.66em;color:#3d3d3d">${escH(pyOf(h))}</span><span>${h}</span></span>`);
      n.replaceWith(...sp.childNodes); }); };
  function dnBook(el, comp) {
    dnPinyin(el);
    if (/(Sub Heading|Lesson Header|Section Bar)/.test(comp)) dnHanBold(el);
    if (/Section Bar/.test(comp)) el.style.borderBottom = 'none';   // giáo trình gốc: đề mục không kẻ gạch dưới (người dùng 29/10: trình bày y chang giáo trình)
    if (/Section Bar/.test(comp)) {
      const L = el.querySelector('[data-n="letter"]'), T = el.querySelector('[data-n="title"]');
      Object.assign(el.style, { justifyContent: 'center', gap: '8px' });
      if (L) { L.textContent = '(' + L.textContent.trim().replace(/^\((.*)\)$/, '$1') + ')';   /* "(A)" như giáo trình gốc (người dùng 29/10: trình bày y chang) */ Object.assign(L.style, { fontSize: '19px', fontWeight: '700', color: '#C00000', webkitTextStroke: '0', flex: '0 0 auto' }); }
      if (T) Object.assign(T.style, { flex: '0 0 auto', fontSize: '19px', fontWeight: '700', color: '#EE7623', textTransform: 'uppercase', letterSpacing: '0.02em', background: `linear-gradient(transparent 62%, ${DN_SOFT} 62%)`, padding: '0 6px' });
    }
    if (/Sub Heading/.test(comp)) {
      const bx = el.querySelector('[data-n="box"]'), t = el.querySelector('[data-n="text"]');
      if (bx) Object.assign(bx.style, { borderLeft: 'none', boxShadow: 'none', padding: '0 0 5px 0', borderBottom: '3px double #C00000', flex: '1 1 auto', alignSelf: 'stretch' });   /* kẻ đôi đỏ như giáo trình gốc */
      if (t) Object.assign(t.style, { color: '#C00000', textTransform: 'uppercase', fontSize: '11px', fontWeight: '800', letterSpacing: '0.02em' });
      // TIÊU ĐỀ NGỮ PHÁP "用“吗”的是非问句 {pinyin} – câu hỏi…" (người dùng 29/10: rối): pinyin chữ thường cam, nghĩa tiếng Việt xuống dòng riêng
      if (t) { t.querySelectorAll('[data-seg="py"]').forEach(py => { Object.assign(py.style, { textTransform: 'none', fontWeight: '600', letterSpacing: '0', fontSize: '0.95em' });
        const nx = py.nextSibling; if (nx && nx.nodeType === 3 && /^\s*[–—-]\s*/.test(nx.nodeValue)) { const d = document.createElement('span'); d.style.display = 'block'; d.style.marginTop = '2px'; nx.nodeValue = nx.nodeValue.replace(/^\s*[–—-]\s*/, ''); let x = nx; while (x) { const n2 = x.nextSibling; d.appendChild(x); x = n2; } py.after(d);
          const P = d.parentNode, g = document.createElement('span'); g.dataset.dn = 'gline'; g.style.fontSize = '1.05em'; py.style.fontSize = '1.04em';   // DÒNG HÁN TỰ + PINYIN to hơn phần nghĩa (người dùng 3/11); Hán tự 1,05× (giảm từ 1,15 – người dùng: Hán hơi to), pinyin giữ ≈1,09×
          while (P.firstChild && P.firstChild !== d) g.appendChild(P.firstChild); P.insertBefore(g, d); }   /* cả phần nghĩa (kể cả chữ Hán trong đó) chung 1 khối */ }); }
      // 4/11 (tiêu đề không còn pinyin): "1. 语气助词“吧”（2） – Nghĩa" → dòng 1 số + Hán tự, dòng 2 nghĩa (như bản có pinyin)
      if (t && !t.querySelector('[data-seg="py"]') && !t.querySelector('[data-dn="gline"]')) { const m = t.textContent.match(/^(\s*\d+\.\s*[^–—]*?[\u3400-\u9fff”）)][^–—]*?)\s+[–—]\s+(.+)$/);
        if (m) { t.textContent = ''; const g = document.createElement('span'); g.dataset.dn = 'gline'; g.style.fontSize = '1.05em'; g.textContent = m[1]; const d = document.createElement('span'); d.style.display = 'block'; d.style.marginTop = '2px'; d.textContent = m[2]; t.append(g, d); } }
    }
    if (/Structure/.test(comp)) {
      const l = el.querySelector('[data-n="label"]'), f = el.querySelector('[data-n="formula"]');
      if (l && l.textContent.trim()) { dnPill(l); Object.assign(l.style, { textAlign: 'left', boxSizing: 'border-box' }); }
      if (f) Object.assign(f.style, { boxShadow: 'none', border: '1.2px solid #EB701D', boxSizing: 'border-box', borderRadius: '0', padding: '5px 12px', color: 'var(--color-text, #3d3d3d)', fontWeight: '500', textAlign: 'left', alignSelf: 'flex-start', flex: '0 1 auto', justifyContent: 'flex-start', gap: '5px' });
      el.style.alignItems = 'flex-start'; el.style.gap = '10px';
    }
    if (/Example Box/.test(comp)) {
      Object.assign(el.style, { boxShadow: 'none', background: 'none', padding: '0', gap: '6px' });
      if (!el.querySelector('[data-dn="exlabel"]') && !+el.dataset.exOff) { const lb = document.createElement('div'); lb.dataset.dn = 'exlabel'; lb.textContent = 'Ví dụ minh hoạ'; lb.style.fontSize = '9.5px'; dnPill(lb); el.prepend(lb); }
      let k = +el.dataset.exOff || 0; el.querySelectorAll('[data-n^="ex_"]').forEach(x => { if (!/^ex_\d+$/.test(x.dataset.n) || !x.offsetParent && x.style.display === 'none') return; const de = x.querySelector('[data-n$=".de"]'), vi = x.querySelector('[data-n$=".vi"]');
        if (!de || !de.textContent.trim()) return; k++;
        if (!de.dataset.dnNo) { dnPyLine(de, '15px'); de.dataset.dnNo = '1'; de.textContent = CIRC(k) + '  ' + de.textContent; }
        if (vi && vi.textContent.trim() && !vi.dataset.dnArrow) { vi.dataset.dnArrow = '1'; vi.textContent = '→ ' + vi.textContent; Object.assign(vi.style, { paddingLeft: '14px', fontSize: '10px', color: 'var(--color-text, #3d3d3d)' }); } });
    }
    if (/^Block\/(Exercise|Matching|Sentence Order|True False)/.test(comp)) {
      const nb = el.querySelector('[data-n="no_box"]'), ins = el.querySelector('[data-n="instruction"]');
      const num = nb ? (nb.textContent.match(/\d+/) || [])[0] : null;
      if (nb) nb.style.display = 'none';
      if (ins) { if (num && !ins.dataset.dnNo) { ins.dataset.dnNo = '1'; ins.textContent = num + '. ' + ins.textContent; } Object.assign(ins.style, { color: DN_RED, textTransform: 'uppercase', fontWeight: '800', fontSize: '10.5px', letterSpacing: '0.02em' }); }
      el.querySelectorAll('[data-n$=".text"], [data-n$=".words"]').forEach(te => { if (/^item_\d+\.(text|words)$/.test(te.dataset.n) && /\s?\/\s?/.test(te.textContent)) dnPyChunks(te); });   // câu sắp xếp: pinyin trên từng cụm
      el.querySelectorAll('[data-n$=".no"]').forEach(no => { const m = no.textContent.trim().match(/^(\d+)\.?$/); if (!m || !/^item_\d+\.no$/.test(no.dataset.n)) return; no.textContent = CIRC(+m[1]); Object.assign(no.style, { color: DN_RED, fontWeight: '400', fontSize: '12px' }); });
    }
    if (/Table/.test(comp)) {
      Object.assign(el.style, { boxShadow: 'none', border: `0.75px solid ${DN_OR}`, boxSizing: 'border-box' });   // khung ngoài bảng bằng border: bóng inset bị nền dòng che (mất viền trái / phải)
      const h = el.querySelector('[data-n="row_0"]');
      if (h) { h.style.backgroundColor = '#EB701D';   /* màu đo trên giáo trình gốc */ h.querySelectorAll('[data-text]').forEach(t => Object.assign(t.style, { color: '#fff', textTransform: 'uppercase', fontWeight: '700', textAlign: 'center', width: '100%', fontSize: '9.5px', letterSpacing: '0.02em' }));   /* tiêu đề cột căn trái như nội dung → cột thẳng hàng (người dùng 29/10) */ h.querySelectorAll('[data-n$="_cell"]').forEach(c => { c.style.justifyContent = 'flex-start'; }); }
      el.querySelectorAll('[data-n^="row_"]').forEach(r => { if (!/^row_[1-9]\d*$/.test(r.dataset.n)) return; const ri = +r.dataset.n.slice(4);
        r.style.backgroundColor = ri % 2 ? '#fff' : '#FFF9EF'; r.style.borderBottom = `0.75px solid ${DN_OR}`;   // giáo trình gốc: dòng trắng / kem xen kẽ, kẻ ngang cam liền
        const cells = [...r.children].filter(c => /_cell$/.test(c.dataset.n || '')); cells.forEach((c, i) => { c.style.borderRight = i < cells.length - 1 ? '0.75px dashed #9a9a9a' : 'none'; c.style.alignSelf = 'stretch'; }); r.style.alignItems = 'stretch';   // kẻ dọc nét đứt xám
        const c1 = r.querySelector('[data-n="c1"]'); if (c1 && /[㐀-鿿]/.test(c1.textContent)) c1.style.color = DN_RED; });
    }
    // HỘI THOẠI kiểu giáo trình gốc: bảng có cột đầu "VAI" → người nói đỏ bên trái + vạch đỏ dọc; câu chữ Hán / pinyin nghiêng / nghĩa xếp chồng; bỏ đầu bảng
    if (/Table/.test(comp)) { const h0 = el.querySelector('[data-n="row_0"]'), v = h0 && h0.querySelector('[data-n="c1"], [data-n="row_0.c1"]');
      if (v && /^vai$/i.test(v.textContent.trim())) { el.dataset.dnDlg = '1'; h0.style.display = 'none'; Object.assign(el.style, { border: 'none', background: 'none', gap: '0' });
        el.querySelectorAll('[data-n^="row_"]').forEach(r => { if (!/^row_[1-9]\d*$/.test(r.dataset.n)) return; const n = r.dataset.n;
          Object.assign(r.style, { background: 'none', borderBottom: 'none', alignItems: 'stretch', padding: '3px 0' });
          const cell = k => r.querySelector(`[data-n="${k}"], [data-n="${n}.${k}"]`), wrap = k => { const t = cell(k); return t && t.closest('[data-n$="_cell"]'); };
          const c1 = wrap('c1'), c2 = wrap('c2'), c3 = wrap('c3'), c4 = wrap('c4');
          if (c1) { Object.assign(c1.style, { flex: '0 0 15%', maxWidth: '15%', borderRight: '1.5px solid #C00000', justifyContent: 'center', background: 'none' }); const t = cell('c1'); if (t) Object.assign(t.style, { color: '#C00000', fontWeight: '700', textAlign: 'center' }); }
          if (c2 && c3 && c4 && !r.querySelector('[data-dn="stack"]')) { const st = document.createElement('div'); st.dataset.dn = 'stack'; Object.assign(st.style, { display: 'flex', flexDirection: 'column', flex: '64 1 0px', minWidth: '0', padding: '2px 0 2px 12px', gap: '1px' });
            r.insertBefore(st, c2); [c2, c3, c4].forEach(c => { Object.assign(c.style, { flex: '0 0 auto', width: '100%', maxWidth: 'none', borderRight: 'none', padding: '0', background: 'none', minHeight: '0', height: 'auto' }); st.appendChild(c); });
            const t3 = cell('c3'); if (t3) Object.assign(t3.style, { fontStyle: 'italic' }); }
          if (!el.querySelector('[data-dn="dlgno"]')) { const sn = document.createElement('div'); sn.dataset.dn = 'dlgno'; Object.assign(sn.style, { position: 'absolute', left: '0', top: '0', bottom: '0', width: '24px', background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3d3d3d', fontSize: '13px' }); el.style.position = 'relative'; el.style.paddingLeft = '30px'; el.prepend(sn); }
          [...r.children].filter(c => c !== c1 && c.dataset.dn !== 'stack' && /_cell$/.test(c.dataset.n || '')).forEach(c => Object.assign(c.style, { borderRight: 'none', background: 'none', flex: '24 1 0px', padding: '2px 0 2px 10px' })); });
      } }
    if (/Paragraph/.test(comp)) { const te = el.querySelector('[data-n="text"]'); if (te && te.style.textTransform === 'uppercase') { te.style.textTransform = 'none'; te.style.fontSize = '9.5px'; dnPill(te); } }
    if (/Lesson Header/.test(comp)) {
      const ln = el.querySelector('[data-n="lesson"]'), tv = el.querySelector('[data-n="title.vi"]');
      if (ln) ln.style.textTransform = 'uppercase';
      if (tv) Object.assign(tv.style, { textTransform: 'uppercase', color: '#C00000', fontWeight: '700' });
      // ĐẦU BÀI như giáo trình gốc: huy hiệu tròn bên trái · ô cam "BÀI 1" · ô kem viền đỏ, tên bài 2 dòng in hoa đỏ (dòng 2 = phần sau dấu ":" / "–")
      const tn = el.querySelector('[data-n="title.native"]'), lb = el.querySelector('[data-n="lesson_box"]'), tb = el.querySelector('[data-n="title_box"]');
      if (tv && tn && !tv.dataset.dnSplit) { tv.dataset.dnSplit = '1'; tv.textContent = tv.textContent.replace(/^\s*(bài|buổi|lesson)\s*[\d.]+\s*[:：–-]\s*/i, '');   /* tên bài có sẵn "Bài 0.1:" (HSK2, 2/11) → không lặp số bài sang ô tên */ const m = tv.textContent.match(/^(.{3,40}?)\s*(?::|\s[–-]\s)\s*(.+)$/);
        if (m) { tv.textContent = m[1]; tn.textContent = m[2]; } else tn.textContent = '';
        Object.assign(tn.style, { textTransform: 'uppercase', color: '#C00000', fontWeight: '700', fontSize: '0.62em', fontStyle: 'normal' }); if (!tn.textContent) tn.style.display = 'none';
        tv.style.fontSize = '17px'; tn.style.fontSize = '11px'; [tv, tn].forEach(x => { x.style.whiteSpace = 'nowrap'; x.style.lineHeight = '1.25'; }); }   /* 2/11: tên bài 1 dòng, dài thì thu chữ (pass LOGO ĐẦU BÀI) – không rớt dòng lệch layout */
      if (tb) Object.assign(tb.style, { background: '#FFF3E0', boxShadow: 'none', border: '1.5px solid #C00000', boxSizing: 'border-box', justifyContent: 'center', gap: '2px' });   /* viền thật (border): bóng inset bị nền ô con che mất khi in */
      if (lb) Object.assign(lb.style, { background: '#EB701D', boxShadow: 'none', border: '1.5px solid #C00000', borderRight: 'none', boxSizing: 'border-box', paddingLeft: '66px', paddingRight: '16px' });
      el.style.boxShadow = 'none'; el.style.border = 'none';
      if (!el.querySelector('[data-dn="badge"]')) { const im = document.createElement('img'); im.dataset.dn = 'badge'; im.src = 'covers/dac-nhan-badge.png'; im.alt = '';
        Object.assign(im.style, { position: 'absolute', left: '-36px', top: '0px', width: '90px', height: '86px', objectFit: 'contain', zIndex: '2' }); el.style.position = 'relative'; el.style.marginLeft = '36px'; el.style.overflow = 'visible'; el.style.padding = '9px 0'; el.style.boxSizing = 'content-box';
        [lb, tb].forEach(x => { if (x) { x.style.minHeight = '68px'; x.style.height = 'auto'; } });   /* ô đầu bài thấp hơn logo 9px mỗi phía → logo che kín mép ô cam (người dùng 29/10) */   /* logo nằm gọn trong chiều cao đầu bài – không bị cắt rìa trên (người dùng 29/10) */ el.prepend(im); }
    }
  }
  function bookStyle(el, comp, b) {
    // cỡ + dòng theo thang chung
    el.querySelectorAll('[data-text]').forEach(t => { const f0 = parseFloat(t.dataset.fs) || 10; const f = BOOK_FS[f0] || f0;
      if (/Section Bar|Lesson Header/.test(comp) && /^(letter|title|lesson)$/.test(t.dataset.n)) return;   // đã chỉnh riêng
      t.style.fontSize = f + 'px'; t.style.lineHeight = String(BOOK_LH(f)); });
    // tiêu đề con: bỏ khung viền, thanh màu bên trái (một kiểu duy nhất cho mọi tiêu đề con)
    if (/Sub Heading/.test(comp)) { const bx = el.querySelector('[data-n="box"]'); el.style.height = 'auto';
      if (bx) Object.assign(bx.style, { border: 'none', boxShadow: 'none', padding: '0 0 0 9px', borderLeft: '3px solid var(--color-primary, #406864)', borderRadius: '0' }); }
    // cấu trúc: nhãn cột cố định 64px để các công thức thẳng hàng
    if (/Structure/.test(comp)) { const l = el.querySelector('[data-n="label"]'); if (l) { Object.assign(l.style, { flex: '0 0 64px', width: '64px', display: 'block' }); if (b && b.data && b.data.label === '\u00a0') { l.textContent = ''; l.style.visibility = 'hidden'; } delete l.dataset.hid; }   /* nhãn trống vẫn giữ cột 64px → công thức thẳng cột */ el.style.gap = '10px'; }
    // bảng: chữ căn trái, đệm đều, cột đầu đậm vừa; bảng từ vựng chia cột theo nội dung
    if (/Table/.test(comp)) {
      if (b && b.src) Object.entries(b.src).forEach(([k, m]) => { const [rk, ck] = k.split('.'), c = el.querySelector(`[data-n="${k}_cell"]`) || el.querySelector(`[data-n="${rk}"] [data-n="${ck}_cell"]`); if (c && m && m.length) c.dataset.cell = JSON.stringify(m); });   // địa chỉ ô S6 từng dòng chữ → sửa trên sách ghi đúng ô (6/11)
      el.querySelectorAll('[data-n$="_cell"]').forEach(c => { Object.assign(c.style, { justifyContent: 'flex-start', padding: '5px 8px' }); const t = c.querySelector('[data-text]'); if (t) { t.style.textAlign = 'left'; t.style.overflowWrap = 'break-word'; } });   // ô hẹp (khổ 19×27): cụm chữ dính nhau vẫn xuống dòng trong ô, không lấn cột
      el.querySelectorAll('[data-n^="row_"]').forEach(r => { if (!/^row_\d+$/.test(r.dataset.n)) return; r.style.height = 'auto'; const c1 = r.querySelector('[data-n="c1"]'); if (c1 && r.dataset.n !== 'row_0') c1.style.fontWeight = '600'; });
      // bảng đáp án: cột số câu hẹp, căn giữa, màu brand; giải thích chiếm phần lớn bề ngang
      const AW0 = b && { ans3: { c1: 9, c2: 28, c3: 63 }, ans2: { c1: 10, c2: 90 }, ansgrid: { c1: 7, c2: 18, c3: 7, c4: 18, c5: 7, c6: 18, c7: 7, c8: 18 }, self: { c1: 76, c2: 8, c3: 8, c4: 8 }, pron: { c1: 15, c2: 13, c3: 36, c4: 18, c5: 18 }, vocab: { c1: 12, c2: 13, c3: 12, c4: 28, c5: 35 }, vocab4: { c1: 8, c2: 20, c3: 24, c4: 48 }, gram4: { c1: 7, c2: 27, c3: 30, c4: 36 }, hanzi5: { c1: 8, c2: 13, c3: 17, c4: 38, c5: 24 }, speak: { c1: 34, c2: 33, c3: 33 }, speak3: { c1: 34, c2: 33, c3: 33 }, speak4: { c1: 30, c2: 26, c3: 26, c4: 18 }, speak4v: { c1: 12, c2: 30, c3: 28, c4: 30 }, speak5v: { c1: 11, c2: 24, c3: 22, c4: 24, c5: 19 } }[b.role];
      const AW = AW0 ? Object.assign({}, AW0) : null;   // bản sao: bảng từ vựng chỉnh độ rộng theo nội dung từng bảng
      // bảng từ vựng (người dùng 29/10 – khổ 19×27 chữ lấn cột): cột Từ / Phiên âm / Loại từ rộng theo từ dài nhất (không ngắt giữa từ), phần còn lại chia Nghĩa / Ví dụ
      // BẢNG PHÁT ÂM (người dùng 29/10: "đừng rớt dòng nhiều quá"): bề rộng cột theo lượng chữ thật (cột nhiều chữ rộng hơn), không hẹp hơn từ dài nhất
      // ĐẦU CỘT ≥ 3 chữ: 2 chữ cuối dính nhau ("ÂM / TƯƠNG TỰ" – 2 dòng, không 3 dòng – người dùng 29/10)
      const headToks = t => { const w = t.trim().split(/\s+/).filter(Boolean); return w.length >= 3 ? w.slice(0, -2).concat(w.slice(-2).join(' ')) : w; };
      const FD = b.full || b.data;   // bảng bị cắt sang trang: độ rộng cột theo CẢ bảng → phần nối thẳng cột với phần trên (người dùng 29/10 buổi 11)
      if (AW && b.role === 'pron' && FD) { const cols = Object.keys(AW), need = {}, wt = {}, L = v => [...v].length;
        for (const k of cols) { const vs = Object.entries(FD).filter(([x]) => new RegExp(`^row_\\d+\\.${k}$`).test(x)).map(([, v]) => String(v || '')), body = vs.slice(1);
          const word = Math.max(0, ...body.flatMap(v => v.split(/\s+/)).map(L)), head = Math.max(0, ...headToks(String(vs[0] || '')).map(L));
          const pair = Math.max(0, ...body.flatMap(v => { const t = v.split(/\s+/); return t.slice(1).map((w, i) => L(t[i] + ' ' + w)); }).filter(n => n <= 12));
          need[k] = Math.max(word * 1.2, head * 1.6, k === 'c1' ? pair * 1.45 : 0) + 3.5;   // % bề rộng (1 ký tự ≈ 1,35%; cột 1 chữ đậm giữ cụm 2 chữ): không ngắt giữa từ / tiêu đề in hoa, giữ cụm ngắn ("Vận mẫu") một dòng
          wt[k] = Math.pow(body.reduce((t, v) => t + L(v), 0) / Math.max(1, body.length), 1.1); }
        const nsum = cols.reduce((t, k) => t + need[k], 0), wsum = cols.reduce((t, k) => t + wt[k], 0) || 1, rest = Math.max(0, 100 - nsum);
        for (const k of cols) AW[k] = (need[k] + rest * wt[k] / wsum) * (nsum > 100 ? 100 / nsum : 1); }   // phần dư chia theo lượng chữ
      if (AW && b.role === 'vocab' && FD) { const tok = k => Math.max(0, ...Object.entries(FD).filter(([x]) => new RegExp(`^row_[1-9]\\d*\\.${k}$`).test(x)).flatMap(([, v]) => String(v || '').split(/\s+/)).map(w => [...w].length));
        const cellLen = k => Math.max(0, ...Object.entries(FD).filter(([x]) => new RegExp(`^row_[1-9]\\d*\\.${k}$`).test(x)).map(([, v]) => [...String(v || '')].length));   // cả cụm ("Danh từ") không bẻ dòng
        const w1 = Math.min(20, Math.max(12, 1.55 * tok('c1') + 4)), w2 = Math.min(17, Math.max(15, 1.1 * tok('c2') + 4)), w3 = Math.min(17, Math.max(12, 1.0 * cellLen('c3') + 3)), rest = Math.max(50, 100 - w1 - w2 - w3);
        Object.assign(AW, { c1: w1, c2: w2, c3: w3, c4: rest * 28 / 63, c5: rest * 35 / 63 });
        el.querySelectorAll('[data-n="c1"], [data-n="c2"]').forEach(t => { t.style.overflowWrap = 'anywhere'; }); }   // từ / phiên âm quá dài (hiếm) → xuống dòng trong ô thay vì lấn cột
      el.querySelectorAll('[data-n="row_0"] [data-text]').forEach(t => { const w = t.textContent.trim().split(/\s+/); if (w.length >= 3 && !/\u00a0/.test(t.textContent)) t.textContent = w.slice(0, -1).join(' ') + '\u00a0' + w[w.length - 1]; });
      if (AW && b && b.xc) { const ks = Object.keys(AW), avg = ks.reduce((t, k) => t + AW[k], 0) / (ks.length || 1); Object.keys(b.xc).forEach(k => { if (!AW[k]) AW[k] = avg; }); }   // cột thêm từ Excel: rộng bằng cột trung bình
      if (AW) el.querySelectorAll('[data-n$="_cell"]').forEach(c => { const k = c.dataset.n.replace('_cell', ''); if (!AW[k]) return; c.style.flex = `${AW[k]} 1 0px`;
        const num = AW[k] <= 10 && !/^(pron|speak\w*|vocab)$/.test(b.role); if (num) { c.style.justifyContent = 'center'; c.style.padding = '5px 4px'; const t = c.querySelector('[data-text]'); if (t) { t.style.textAlign = 'center'; t.style.fontWeight = '700'; t.style.color = 'var(--color-primary-ink, var(--color-primary, #406864))'; } }
        else if (b.role === 'ans3' && k === 'c3') { const t = c.querySelector('[data-text]'); if (t) t.style.fontWeight = '400'; } });
      if (/Vocab Table/.test(comp)) { const W = { c1: 27, c2: 22, c3: 14, c4: 37 }; el.querySelectorAll('[data-n$="_cell"]').forEach(c => { const k = c.dataset.n.replace('_cell', ''); if (W[k]) c.style.flex = `${W[k]} 1 0px`; }); }
    }
    // hộp ví dụ: các câu cách đều 6px, đệm 10/14
    if (/Example Box/.test(comp)) Object.assign(el.style, { padding: '10px 14px', gap: '6px' });
    if (/Note Box/.test(comp)) { Object.assign(el.style, { padding: '9px 12px' }); const bar = el.querySelector('[data-n="bar"]'); if (bar) Object.assign(bar.style, { height: 'auto', alignSelf: 'stretch', flex: '0 0 3px' }); }
    // bài tập: số câu cột 16px, câu cách nhau 5px, khối câu thụt bằng nhau
    if (/Objectives/.test(comp)) { el.style.gap = '3px'; const h = el.querySelector(':scope > [data-n="head"]'); if (h) h.style.marginBottom = '3px'; }   // MỤC TIÊU BÀI HỌC: các ý sát nhau (người dùng 3/11: 8px – thưa quá)
    if (/Exercise|Matching|Sentence Order|True False/.test(comp)) { el.style.gap = '6px';
      el.querySelectorAll('[data-n^="item_"]').forEach(it => { if (!/^item_\d+$/.test(it.dataset.n)) return; Object.assign(it.style, { gap: '8px', minHeight: '0', height: 'auto' }); const no = it.querySelector('[data-n$=".no"]'); if (no) Object.assign(no.style, { flex: '0 0 16px', width: '16px' }); }); }
    // NHÃN BÀI TẬP "Bài 9" (người dùng chốt 23/10: số trong vòng tròn nhỏ, khó hiểu) → nhãn chữ nhật bo nhẹ màu brand, chữ trắng đậm
    const nb = el.querySelector(':scope [data-n="head"] [data-n="no_box"], :scope > [data-n="no_box"]') || (/Exercise|Matching|Sentence Order|Pronunciation|True False/.test(comp) ? el.querySelector('[data-n="no_box"]') : null);
    if (nb && /Exercise|Matching|Sentence Order|Pronunciation|True False/.test(comp)) { Object.assign(nb.style, { width: 'auto', minWidth: '0', height: 'auto', borderRadius: '3px', padding: '2px 7px', alignSelf: 'center' }); delete nb.dataset.circle;
      const t = nb.querySelector('[data-text]'); if (t) Object.assign(t.style, { fontSize: '9.5px', fontWeight: '700', lineHeight: '1.35', letterSpacing: '0.02em', whiteSpace: 'nowrap' }); }
    if (/Dialogue/.test(comp)) { el.style.gap = '6px';   // cột vai rộng đủ cho "Tin nhắn thoại" trên 1 dòng → câu thoại các dòng thẳng một mép
      el.querySelectorAll('[data-n$=".speaker"]').forEach(x => Object.assign(x.style, { flex: '0 0 80px', width: '80px', maxWidth: '80px', fontWeight: '600', color: INK, paddingRight: '8px' })); }
    // đoạn văn / lưu ý: danh sách đánh số thụt treo
    if (/Paragraph/.test(comp)) { const te = el.querySelector('[data-n="text"]');
      if (b && b.role === 'label') { te.textContent = te.textContent; Object.assign(te.style, { fontSize: '9.5px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: INK, lineHeight: '1.3' }); }
      else richList(te); }
    if (/Note Box/.test(comp)) richList(el.querySelector('[data-n="text"]'));
    // công thức "N's + N: Anna's brother" → công thức đậm màu + ví dụ chữ thường sau mũi tên
    if (/Vocab Table/.test(comp)) { const W = { c1: 20, c2: 20, c3: 23, c4: 37 };   // cột Loại từ đủ rộng cho "cụm động từ" một dòng; Nghĩa vẫn rộng nhất
      el.querySelectorAll('[data-n$="_cell"]').forEach(c => { const k = c.dataset.n.replace(/_cell$/, ''); if (W[k]) c.style.flex = `${W[k]} 1 0px`; }); }
    if (/Structure/.test(comp)) { const lb = el.querySelector('[data-n="label"]'), fm = el.querySelector('[data-n="formula"]');   // nhãn dài ("Trạng từ không đổi dạng") không đè lên công thức: nhãn ≥ khung mẫu, tự giãn tối đa 40%, xuống dòng; công thức lấy phần còn lại
      if (lb) { const w = lb.style.width; Object.assign(lb.style, { flex: '0 0 auto', width: 'auto', minWidth: w || '', maxWidth: '40%', whiteSpace: 'normal' }); lb.querySelectorAll('*').forEach(x => { x.style.whiteSpace = 'normal'; x.style.width = 'auto'; }); }
      if (fm) Object.assign(fm.style, { flex: '1 1 0', minWidth: '0', whiteSpace: 'normal' }); }
    if (/Structure/.test(comp)) { const f = el.querySelector('[data-n="formula"]'); if (f && f.dataset.blocks) { Object.assign(f.style, { fontSize: '10.5px', columnGap: '4px', rowGap: '2px', minWidth: '0' }); f.querySelectorAll('[data-n^="tk_"]').forEach(t => Object.assign(t.style, { whiteSpace: 'normal', flex: '0 1 auto', minWidth: '0' })); } }   // ô chữ dài trong dòng có pinyin được xuống dòng, không tràn trang   // dòng có ô pinyin {…} cùng cỡ chữ với dòng thường
    if (/Structure/.test(comp)) { const f = el.querySelector('[data-n="formula"]'); const t = f && f.textContent; const c = t ? t.indexOf(': ') : -1;
      if (c > 0 && f.dataset.blocks) { const tk = [...f.querySelectorAll('[data-n="tk_t"]')].find(x => x.textContent.includes(': ')); if (tk) tk.textContent = tk.textContent.replace(': ', '  →  '); }   // dòng có ô pinyin: chỉ đổi dấu ':' thành '→', giữ các ô
      else if (c > 0) f.innerHTML = `${escH(t.slice(0, c))}<span style="font-weight:400;color:var(--color-text, #3d3d3d)">&nbsp;&nbsp;→&nbsp;${escH(t.slice(c + 2))}</span>`; }
    if (/Exercise/.test(comp)) el.querySelectorAll('[data-n$=".text"]').forEach(optionGrid);
  }

  // ---------- MỘT FONT CHO CẢ SÁCH (người dùng chốt 23/10) ----------
  // Cả cuốn dùng một họ Noto: Noto Sans cho chữ Latin / Việt / IPA; chữ Hán – Kana – Hangul rơi sang Noto Sans JP / KR / SC
  // (cùng nhà thiết kế, cùng độ cao chữ, cùng nét) → dòng chữ Việt và chữ tượng hình thẳng hàng, dễ canh, dễ so.
  // Phân cấp chỉ bằng CỠ + ĐỘ ĐẬM của cùng một font (400 thường · 500 nhãn · 600 tiêu đề con · 700 tiêu đề).
  const BOOK_CJK = { Sakumi: 'Noto Sans JP', Saechang: 'Noto Sans KR', 'Đắc Nhân': 'LXGW WenKai' };   // tiếng Trung: chữ Khải (người dùng 28/10) – LXGW WenKai nhúng được vào PDF
  // Đắc Nhân (người dùng 29/10: "giống y chang giáo trình HSK1 bản 4.1"): giáo trình gốc dàn bằng Word – Times New Roman + KaiTi → sách dùng Times New Roman
  // (máy không có → Tinos, cùng số đo, miễn phí) + chữ Khải (KaiTi / LXGW WenKai)
  const bookFont = brand => brand === 'Đắc Nhân' ? "'Times New Roman', 'Tinos', 'KaiTi', 'Kaiti SC', 'STKaiti', 'LXGW WenKai', serif"
    : `'Montserrat', '${BOOK_CJK[brand] || 'Noto Sans JP'}', 'Noto Sans SC', 'Noto Sans KR', sans-serif`;
  const bookFamilies = brand => brand === 'Đắc Nhân' ? ['Tinos', 'LXGW WenKai'] : ['Montserrat', BOOK_CJK[brand]].filter(Boolean);   // người dùng 28/10: sách dùng Montserrat
  function bookCss() {
    if (typeof document === 'undefined' || document.getElementById('plsBookCss')) return; const st = document.createElement('style'); st.id = 'plsBookCss';
    // ép một font cho mọi chữ trong trang sách (mẫu Figma gắn font riêng từng ô: heading / body / native / doc)
    st.textContent = '.pls-book-page, .pls-book-page *{font-family:var(--book-font) !important;font-synthesis:none}'
      + '.pls-book-page *{word-break:normal !important}'   /* 6/11: mẫu Figma để keep-all → cụm chữ Hán dài bị ngắt khẩn cấp, dấu 。 rớt xuống dòng riêng; normal = ngắt giữa chữ Hán theo luật dấu câu (không bao giờ để 。，đứng đầu dòng) */
      + '.pls-book-page [data-comp="Block/Sub Heading"] *,.pls-book-page [data-n="Block/Sub Heading"] *{white-space:pre-wrap !important;max-width:100%;min-width:0;overflow-wrap:break-word}'   // QC 24/10: tiêu đề ngữ pháp dài bị cắt ở lề phải (23 chỗ) → xuống dòng
      + '.pls-book-page [data-n="Block/Section Bar"] [data-n="letter"],.pls-book-page [data-n="Block/Lesson Header"] [data-n="lesson"]{font-weight:800 !important}'   // chữ cái đề mục + số bài dày bằng chữ HSK trên bìa (Montserrat 800, người dùng 29/10)
      + '.pls-book-page [data-text]{font-kerning:normal;font-variant-ligatures:common-ligatures;text-rendering:optimizeLegibility}';
    document.head.appendChild(st);
  }

  // LỀ TRANG: A4 lề trái = phải 56 (mẫu 48); 19×27 lề trái = phải 52 cả trang lẻ lẫn chẵn (mẫu 71 / 43 lệch nhau), đầu trang có chữ chạy + kẻ mảnh, cách nội dung 14px; chân trang kẻ mảnh, số trang.
  function pageFrame(host, size) {
    const pg = host.firstElementChild; if (!pg) return; const run = host.querySelector('[data-n="running"]'), foot = host.querySelector('[data-n="footer"]');
    // lề trong = lề ngoài (người dùng chốt 23/10: 19×27 trang lẻ / chẵn không được lệch lề vào – lề ra); số trang vẫn ở mép ngoài
    pg.style.padding = size === '19x27' ? '38px 52px 26px 52px' : '40px 56px 28px 56px'; pg.style.gap = '0px';
    if (run) Object.assign(run.style, { paddingBottom: '6px', marginBottom: '16px', borderBottom: '0.5px solid var(--scale-200, #c8c8c8)', letterSpacing: '0.06em', fontWeight: '500' });
    if (foot) Object.assign(foot.style, { marginTop: '12px', paddingTop: '7px', borderTop: '0.5px solid var(--scale-200, #c8c8c8)' });
    if (run && host.dataset.brand === 'Đắc Nhân') run.style.display = 'none';   // giáo trình gốc không có dòng chữ chạy đầu trang
    if (foot && host.dataset.brand === 'Đắc Nhân') { foot.style.borderTop = 'none'; const tg = foot.querySelector('[data-n="tagline"]'); foot.style.position = 'relative'; if (tg) Object.assign(tg.style, { color: DN_RED, fontWeight: '700', fontSize: '7.5px', letterSpacing: '0.04em', textAlign: 'center', position: 'absolute', left: '0', right: '0', top: '50%', transform: 'translateY(-50%)', width: 'auto', pointerEvents: 'none' });   /* khẩu hiệu chính giữa trang, không lệch theo số trang (người dùng 29/10) */ const sp = foot.querySelector('[data-n="sp"]'); if (sp) sp.style.flex = '0 0 0px';
      foot.querySelectorAll('[data-n="page_no"], [data-n="page_no_l"]').forEach(x => { x.style.flex = '0 0 40px'; x.style.textAlign = x.dataset.n === 'page_no' ? 'right' : 'left'; }); }   // giáo trình Đắc Nhân: khẩu hiệu đỏ ở giữa chân trang
  }

  // CỠ CHỮ + CĂN LỀ KHỐI SÁCH (người dùng 4/11 – như slide, không kéo thả / đổi bề rộng): sty = { fz: 0.7–1.5, ta: left|center|right }
  // áp NGAY KHI DỰNG KHỐI (trước khi đo, xếp trang) → khối to lên tự sang trang sau / cắt qua trang như mọi khối khác; không phóng to trên bản đã xếp
  // đo cỡ chữ + dòng thật của MỌI phần tử rồi đặt lại px × fz (không nhân chồng em lồng nhau)
  // ô nhỏ trong khối (dòng ví dụ, ô bảng, câu…): khoá theo tên ô + 30 chữ đầu → đúng ô cả khi bảng bị cắt qua trang (số dòng đánh lại)
  const subSig = e => (e.dataset.n || '') + '|' + e.textContent.replace(/\s+/g, ' ').trim().slice(0, 30);
  // ĐỔI THỨ TỰ CỘT BẢNG (người dùng 4/11 – kéo tiêu đề cột trên sách): cols = ['c1','c2','c4','c3'] (cột gốc theo thứ tự mới)
  // chỉ đổi THỨ TỰ HIỂN THỊ (flex order) – độ rộng, màu, căn lề vẫn theo cột gốc; kẻ dọc nét đứt theo thứ tự mới (cột cuối không kẻ). Bảng hội thoại không đổi.
  function colOrder(el, cols) { if (!cols || !cols.length || el.dataset.dnDlg) return;
    el.querySelectorAll('[data-n^="row_"]').forEach(r => { const cells = [...r.children].filter(c => /_cell$/.test(c.dataset.n || '') && c.style.display !== 'none'); if (cells.length < 2) return;
      const rank = c => { const i = cols.indexOf(c.dataset.n.replace(/_cell$/, '')); return i < 0 ? 100 + cells.indexOf(c) : i; }, sorted = cells.slice().sort((a, b) => rank(a) - rank(b));
      const sep = cells.map(c => c.style.borderRight).find(v => v && v !== 'none');
      sorted.forEach((c, i) => { c.style.order = String(i + 1); if (sep) c.style.borderRight = i < sorted.length - 1 ? sep : 'none'; }); });
    el.dataset.cols = cols.join(','); }
  // XOÁ CỘT + ĐỘ RỘNG TỪNG CỘT (người dùng 5/11 – chỉ sách): hide = ['c3'] (ẩn trên sách, Excel giữ nguyên) · cw = { c1: 30, c2: 20, … } (tỉ lệ bề rộng, % bảng)
  function colLayout(el, sty) { if (!sty || el.dataset.dnDlg) return; const hide = sty.hide || [], cw = sty.cw || null; if (!hide.length && !cw && !sty.cols) return;
    el.querySelectorAll('[data-n^="row_"]').forEach(r => { const cells = [...r.children].filter(c => /^c\d+_cell$/.test(c.dataset.n || '')); const vis = cells.filter(c => !hide.includes(c.dataset.n.replace(/_cell$/, '')));
      if (!vis.length) return;   // không ẩn hết cột
      cells.forEach(c => { const k = c.dataset.n.replace(/_cell$/, ''); if (!vis.includes(c)) { c.style.display = 'none'; return; } if (cw && cw[k] > 0) { c.style.flex = `${cw[k]} 1 0px`; c.style.minWidth = '0'; } }); });
    colOrder(el, sty.cols || [...el.querySelectorAll('[data-n^="row_"] > [data-n$="_cell"]')].map(c => c.dataset.n.replace(/_cell$/, '')).filter((k, i, a) => a.indexOf(k) === i)); }
  function bookSty(el, sty, stage) {
    const fz = Math.min(1.5, Math.max(0.7, +sty.fz || 1)), ta = /^(left|center|right)$/.test(sty.ta || '') ? sty.ta : '', sub = sty.sub || {};
    colLayout(el, sty);
    if (fz === 1 && !ta && !sty.b && !sty.i && !sty.u && !Object.keys(sub).length && !(sty.rt || []).length) return;
    const host = el.parentNode, nx = el.nextSibling; (stage || document.body).appendChild(el);   // gắn tạm vào trang để đo kiểu thật
    // IN ĐẬM / NGHIÊNG / GẠCH DƯỚI (người dùng 4/11): b, i, u = true → áp cho cả khối / ô (trước khi đo → chữ đậm rộng ra vẫn xếp trang đúng)
    const deco = (root0, x) => { if (!x || !(x.b || x.i || x.u)) return; [root0, ...root0.querySelectorAll('*')].forEach(e => { if (x.b) e.style.fontWeight = '700'; if (x.i) e.style.fontStyle = 'italic'; if (x.u) { e.style.textDecoration = 'underline'; e.style.textUnderlineOffset = '2px'; } }); };
    const apply = (root0, f, a) => { if (f === 1 && !a) return; const all = [root0, ...root0.querySelectorAll('*')];
      const m = all.map(e => { const cs = getComputedStyle(e); return { f: parseFloat(cs.fontSize), lh: /px$/.test(cs.lineHeight) ? parseFloat(cs.lineHeight) : 0, d: cs.display, dir: cs.flexDirection, wr: cs.flexWrap }; });
      all.forEach((e, k) => { const x = m[k];
        if (f !== 1) { if (x.f) e.style.fontSize = Math.round(x.f * f * 10) / 10 + 'px'; if (x.lh) e.style.lineHeight = Math.round(x.lh * f * 10) / 10 + 'px'; }
        if (f > 1) {   // ô bề rộng cố định (số ①②, nhãn, cột STT) giãn theo cỡ chữ – 150% thử: số ① tràn ngang
          const w = /px$/.test(e.style.width) ? parseFloat(e.style.width) : 0, fb = (e.style.flex || '').match(/^\s*0\s+0\s+([\d.]+)px/); if (w && w < 220) { e.style.width = Math.round(w * f) + 'px'; if (/px$/.test(e.style.minWidth)) e.style.minWidth = Math.round(w * f) + 'px'; if (/px$/.test(e.style.maxWidth)) e.style.maxWidth = Math.round(w * f) + 'px'; }
          if (fb && +fb[1] < 220) e.style.flex = `0 0 ${Math.round(+fb[1] * f)}px`; }
        if (a) { const J = { left: 'flex-start', center: 'center', right: 'flex-end' }[a]; e.style.textAlign = a; if (/flex/.test(x.d) && !/column/.test(x.dir) && x.wr === 'wrap') e.style.justifyContent = J; } }); };   /* không đổi alignItems của cột (bảng / khung co lại theo chữ) */
    const subs = Object.keys(sub).length ? [...el.querySelectorAll('[data-n]')].map(e => [e, sub[subSig(e)]]).filter(x => x[1]) : [];   // tìm ô TRƯỚC khi đổi cỡ (chữ chưa đổi)
    deco(el, sty); apply(el, fz, ta);
    const fixOver = () => el.querySelectorAll('[data-text], [data-n]').forEach(t => { if (t.children.length > 3) return; const over = t.scrollWidth - t.clientWidth; if (over > 1 && t.clientWidth) { const cs = getComputedStyle(t); if (/^0 0/.test(cs.flex) || /px$/.test(t.style.width)) { const W = Math.ceil(t.scrollWidth) + 1; t.style.width = W + 'px'; t.style.minWidth = W + 'px'; t.style.maxWidth = 'none'; if (/^0 0/.test(cs.flex)) t.style.flex = `0 0 ${W}px`; } } });   // còn tràn ngang → nới đúng bằng chữ
    subs.forEach(([e, s2]) => { deco(e, s2); apply(e, Math.min(1.5, Math.max(0.7, +s2.fz || 1)), /^(left|center|right)$/.test(s2.ta || '') ? s2.ta : ''); e.dataset.subSty = '1'; });
    if ((sty.rt || []).length && root.PLS_RT) { const all = [el, ...el.querySelectorAll('[data-n]')], sigs = all.map(subSig);   // ĐỊNH DẠNG TỪNG CHỮ (5/11): neo = ô (tên + 30 chữ đầu) như cỡ chữ ô nhỏ
      sty.rt.forEach(op => { if (op.s === '@first') { const e = [...el.querySelectorAll('[data-text]')].find(x => root.PLS_RT.textOf(x).trim().length > 4); if (e) { const tx = root.PLS_RT.textOf(e), o = tx.search(/\S/); root.PLS_RT.apply(e, [Object.assign({}, op, { o, t: tx.slice(o, o + 4) })]); } return; }   /* bộ mẫu chuẩn */
        all.forEach((e, k) => { if (sigs[k] === op.s) root.PLS_RT.apply(e, [op]); }); }); }
    fixOver();
    if (host) host.insertBefore(el, nx); else el.remove(); if (fz !== 1) el.dataset.fz = String(fz); if (ta) el.dataset.ta = ta;
  }
  function paginate(list, opt) {
    (list || []).forEach(b => { if (b && /^vocab4?$/.test(b.role) && b.data) Object.entries(b.data).forEach(([k, v]) => { if (new RegExp(`^row_[1-9]\\d*\\.c${b.role === 'vocab4' ? 2 : 1}$`).test(k) && /^[\u3400-\u9fff]{2,4}$/.test(String(v || '').trim())) DN_WORDS.add(String(v).trim()); }); });   // từ của bài → ghép pinyin theo từ
    bookCss();
    list.forEach((b, i) => { b.space = SPACE(list[i - 1], b); });
    const E = root.PLS_ENGINE, size = SIZES[opt.size] || SIZES.A4, stage = opt.stage, pages = [], warns = [];
    const running = opt.running || '';
    // SỐ TRANG như sách in: góc ngoài chân trang – trang lẻ bên phải, trang chẵn bên trái (trang 1 cũng in số – người dùng 24/10)
    const newPage = () => { const n = pages.length + (opt.first || 1); const comp = size.page(n);
      const r = E.render({ comp, data: { running, page_no: n % 2 === 0 ? '' : String(n), page_no_l: n % 2 === 0 ? String(n) : '' } }, opt.brand);
      stage.appendChild(r.host); r.host.classList.add('pls-book-page'); r.host.style.setProperty('--book-font', bookFont(opt.brand)); pageFrame(r.host, opt.size);
      const content = r.host.querySelector('[data-n="content"]'); [...content.children].forEach(c => c.remove()); content.style.gap = '0px'; content.style.rowGap = '0px';
      const pg = { host: r.host, content, n, comp, blocks: [] }; pages.push(pg); return pg; };
    const head0 = pg => { const f = pg.blocks[0]; const h0 = f && !f.dataset.dnDlg && f.querySelector('[data-n="row_0"][data-cont]'); if (h0) h0.style.display = 'flex'; };   // hội thoại kiểu người nói: không có đầu bảng   // bảng nối đứng đầu trang → hiện đầu bảng TRƯỚC khi đo
    const fits = pg => pg.content.scrollHeight <= pg.content.clientHeight + 1;
    const mk = b => { const r = E.render({ comp: b.comp, data: b.data }, opt.brand); const el = r.host.firstElementChild; el.style.width = 'auto'; el.style.alignSelf = 'stretch'; el.style.flex = '0 0 auto'; el.dataset.block = b.role === 'label' ? 'Label Heading' : b.comp;
      // khối sách phải cao theo chữ (mẫu Figma để cao cố định theo chữ mẫu → chữ thật dài hơn đè lên khối sau)
      el.style.height = 'auto'; el.style.minHeight = '0';
      [el, ...el.querySelectorAll('*')].forEach(x => { if (x.style.height && x.style.height !== 'auto' && (x.dataset.text || x.querySelector('[data-text]'))) { x.style.minHeight = x.style.height; x.style.height = 'auto'; } });
      // bảng N cột: ẩn cột không có dữ liệu (cN / cN_cell) để các cột còn lại giãn đủ rộng; dòng kẻ của mục không dùng (item_3_line) ẩn theo mục
      const keys = Object.keys(b.data || {}); const usedC = new Set(keys.map(k => (k.match(/\.c(\d+)$/) || [])[1]).filter(Boolean));
      if (usedC.size) el.querySelectorAll('[data-n]').forEach(x => { const m = x.dataset.n.match(/^c(\d+)(_cell)?$/); if (m && !usedC.has(m[1])) { x.style.display = 'none'; x.dataset.hid = '1'; } });
      el.querySelectorAll('[data-n$="_line"]').forEach(x => { const m = x.dataset.n.match(/^([a-z]+_\d+)_line$/); if (m && !keys.some(k => k.split('.')[0] === m[1])) { x.style.display = 'none'; x.dataset.hid = '1'; } });
      // tên vai dài (vd "Tin nhắn thoại") trong cột hẹp → cho xuống dòng, không đè lên câu
      el.querySelectorAll('[data-n="speaker"],[data-n$=".speaker"]').forEach(x => { [x, ...x.querySelectorAll('*')].forEach(y => { y.style.whiteSpace = 'normal'; y.style.overflowWrap = 'anywhere'; }); x.style.paddingRight = '6px'; x.style.boxSizing = 'border-box'; x.style.overflow = 'hidden'; x.style.whiteSpace = 'normal'; x.style.overflowWrap = 'anywhere'; x.style.maxWidth = ''; (x.parentElement || x).style.minWidth = '0'; });
      // Section Bar: bỏ ảnh đại diện / ô bài mẫu (sách đã duyệt chỉ có chữ cái + tên mục + kẻ ngang)
      if (b.comp === 'Block/Section Bar') { el.querySelectorAll('[data-n="avatar"], [data-n="lesson_box"]').forEach(x => { x.style.display = 'none'; x.dataset.hid = '1'; });
        // chữ cái và tên mục to gần bằng nhau, cùng nằm giữa theo chiều dọc (người dùng chốt 23/10: "C" và "Ngữ pháp" phải cân)
        const L = el.querySelector('[data-n="letter"]'), T = el.querySelector('[data-n="title"]');
        if (L) Object.assign(L.style, { flex: '0 0 auto', height: 'auto', minHeight: '0', fontSize: '34px', lineHeight: '1', textAlign: 'left', fontWeight: '900', webkitTextStroke: '0.8px currentColor' });   // chữ cái mục A, B, C… nét dày như sách in (người dùng 24/10)
        if (T) Object.assign(T.style, { flex: '1 1 0px', height: 'auto', minHeight: '0', fontSize: '22px', lineHeight: '1.15', fontWeight: '700', color: 'var(--color-primary, #406864)' });
        Object.assign(el.style, { alignItems: 'center', gap: '12px', paddingBottom: '8px' }); }
      // Lesson Header: ô "Bài N" và khung tên bài cao bằng nhau (mẫu để ô bài cao 72 cố định, khung tên cao theo chữ → lệch)
      if (b.comp === 'Block/Lesson Header') { el.style.alignItems = 'stretch'; { const lb = el.querySelector('[data-n="lesson_box"]'); if (lb) Object.assign(lb.style, { width: 'auto', flex: '0 0 auto', paddingLeft: '14px', paddingRight: '14px', whiteSpace: 'nowrap' }); }   /* "BUỔI 12" dài hơn "BÀI 12" → ô tự giãn, không tràn (người dùng 29/10) */ el.querySelectorAll('[data-n="lesson_box"], [data-n="title_box"]').forEach(x => { x.style.height = 'auto'; x.style.minHeight = '72px'; x.style.alignSelf = 'stretch'; });
        const tb = el.querySelector('[data-n="title_box"]'); if (tb) tb.style.boxShadow = 'inset 0 0 0 1px var(--color-primary-dark, #142738)';
        const ln = el.querySelector('[data-n="lesson"]'); if (ln) { ln.dataset.fs = '30'; ln.style.fontSize = '30px';   /* 34 → 30: chữ không sát viền ô (người dùng 29/10) */ ln.style.fontWeight = '900'; ln.style.webkitTextStroke = '0.8px currentColor'; } }   // chữ "Bài n" to và đậm hơn (người dùng chốt 24/10)   // viền khung tên bài mảnh 1px (mẫu 2px nặng hơn cả chữ)
      // ô đánh số không có dữ liệu (vd ex_6 của khối Phát âm khi chỉ có 5 ví dụ) → ẩn, khỏi lộ chữ mẫu Figma ("fünf")
      el.querySelectorAll('[data-text]').forEach(x => { const n = x.dataset.n || ''; const m = n.match(/^([a-z]+_)\d+\.[\w.]+$/); if (m && !(n in (b.data || {})) && keys.some(k => k.startsWith(m[1]))) { if (/Pronunciation/.test(b.comp)) x.style.visibility = 'hidden'; else x.style.display = 'none'; x.dataset.hid = '1'; } });   // khối Phát âm: giữ chỗ ô trống để lưới cặp từ – phiên âm thẳng cột
      if (b.exOff) el.dataset.exOff = String(b.exOff); bookStyle(el, b.comp, b); if (opt.brand === 'Đắc Nhân') dnBook(el, b.comp);
      // PHÁT ÂM (người dùng 28/10: lưới cặp từ – nghĩa so le "kì quá"): gom ví dụ thành lưới 4 cột đều nhau, chữ Hán đi liền sau phiên âm
      if (b.comp === 'Block/Pronunciation') { const pairs = [...el.querySelectorAll('[data-n^="pair_"]')].filter(p => /^pair_\d+$/.test(p.dataset.n)); if (pairs.length) {
        const g = document.createElement('div'); g.dataset.n = 'ex_grid'; g.style.cssText = 'display:grid;grid-template-columns:repeat(4,minmax(0,1fr));column-gap:16px;row-gap:4px;align-self:stretch;margin-top:2px';
        for (let i = 1; i <= 12; i++) { const w = el.querySelector(`[data-n="ex_${i}.word"]`), v = el.querySelector(`[data-n="ex_${i}.vi"]`); if (!w || w.dataset.hid || !w.textContent.trim() || !(`ex_${i}.word` in (b.data || {}))) continue;
          const c = document.createElement('div'); c.style.cssText = 'display:flex;flex-wrap:wrap;align-items:baseline;column-gap:5px;min-width:0'; Object.assign(w.style, { flex: '0 1 auto', width: 'auto', visibility: 'visible' }); c.appendChild(w);
          const vt = v && !v.dataset.hid ? v.textContent.replace(/^\/|\/$/g, '').trim() : ''; if (v && vt) { v.textContent = vt; Object.assign(v.style, { flex: '0 1 auto', width: 'auto', fontSize: '0.92em', color: 'var(--color-text-muted, #6d6d6d)', visibility: 'visible' }); c.appendChild(v); }
          g.appendChild(c); }
        pairs[0].before(g); pairs.forEach(p => p.remove()); } } if (b.cont) { const h0 = el.querySelector('[data-n="row_0"]'); if (h0) { h0.style.display = 'none'; h0.dataset.cont = '1'; } } el.style.marginTop = (b.space || 0) + 'px'; el.dataset.space = String(b.space || 0);
      if (b.html) { el.innerHTML = b.html; el.style.display = 'block'; el.style.opacity = '1'; el.style.color = '#1a1a1a'; el.removeAttribute('data-text'); }   /* chữ nhóm âm bị nhạt như chữ mẫu khi in (2/11) */   // khối dựng sẵn (bảng tổng Pinyin)
      if (b.bk) el.dataset.bk = b.bk; if (b.role) el.dataset.role = b.role; if (b.xc) el.dataset.xc = JSON.stringify(b.xc); if (b.sty) bookSty(el, b.sty, (pages[pages.length - 1] || {}).content || stage);   /* đo trong khung trang thật (cỡ chữ kế thừa đúng) */
      if (opt.prep) opt.prep(el); return el; };
    // BẢNG DÀI ĐƯỢC CẮT QUA TRANG (sách thật không đẩy cả bảng + tiêu đề mục sang trang sau để lại nửa trang trắng)
    // BÀI TẬP DÀI HƠN TRANG (2/11 HSK2: đáp án dài xuống dòng → 1 bài 5 câu cao hơn trang, bị cắt): tách theo câu như bảng, phần sau không lặp tên bài
    // KHỐI CẮT ĐƯỢC THEO MỤC (3/11 HSK2: bài tập / khung Ví dụ cao hơn chỗ còn lại bị đẩy nguyên khối → 1/2–3/4 trang trắng): Exercise, Sentence Order theo câu (item_n), Example Box theo ví dụ (ex_n)
    const FAM = b => /^Block\/(Exercise|Sentence Order)$/.test(b.comp) ? 'item' : b.comp === 'Block/Example Box' ? 'ex' : b.comp === 'Block/Paragraph' && !b.html && b.role !== 'label' && b.data && /\n/.test(String(b.data.text || '')) ? 'para' : null;   // đoạn nhiều dòng (Giải thích 1. 2. 3.) cắt theo dòng
    const isEx = b => FAM(b) && b.data && b.exSplit;
    const paraLines = b => String(b.data.text || '').split('\n').filter(x => x.trim());
    const nItems = b => { const P = FAM(b), ks = Object.keys(b.data); if (P === 'para') return paraLines(b).length; let n = 0; while (ks.some(k => k.startsWith(`${P}_${n + 1}.`))) n++; return n; };
    const sliceEx = (b, from, to) => { const P = FAM(b); if (P === 'para') return Object.assign({}, b.data, { text: paraLines(b).slice(from, to).join('\n') }); const re = new RegExp(`^${P}_(\\d+)\\.(.+)$`), d = {}; for (const [k, v] of Object.entries(b.data)) { const m = k.match(re); if (!m) { if (from === 0) d[k] = v; continue; } const r = +m[1]; if (r > from && r <= to) d[`${P}_${r - from}.${m[2]}`] = v; } if (from > 0 && P === 'item') Object.assign(d, { no: '', instruction: '', 'head.track': '', 'head.ab': '' }); return d; };   // phần nối: không lặp tên bài; số câu ①② giữ theo dữ liệu (item_n.no)
    const nRows = b => { if (isEx(b)) return nItems(b); if (!/Table/.test(b.comp) || !b.data) return 0; let n = 0; while (Object.keys(b.data).some(k => k.startsWith(`row_${n + 1}.`))) n++; return n; };
    const sliceT = (b, from, to) => { if (isEx(b)) return sliceEx(b, from, to); const d = {}; for (const [k, v] of Object.entries(b.data)) { const m = k.match(/^row_(\d+)\.(.+)$/); if (!m) { d[k] = v; continue; } const r = +m[1]; if (r === 0) d[k] = v; else if (r > from && r <= to) d[`row_${r - from}.${m[2]}`] = v; } return d; };
    const probeOf = b => nRows(b) >= 2 ? Object.assign({}, b, { data: sliceT(b, 0, 1), full: b.full || b.data }) : FAM(b) && b.data && nItems(b) >= 2 ? Object.assign({}, b, { data: sliceEx(b, 0, 1) }) : b;   // bài tập / khung Ví dụ: tiêu đề chỉ cần kèm câu đầu (3/11: 'Luyện tập' bị đẩy sang trang, để trống 1/2–3/4 trang)   // kiểm tiêu đề mồ côi: chỉ cần đầu bảng + 1 dòng theo kèm (29/10: còn chỗ trống đã đẩy cả mục sang trang)
    const trySplit = (pg, i, el, alone) => { const b = list[i], n = nRows(b); if (n < 2) return null;   // 29/10: bảng đứng một mình mà vẫn dài hơn trang (khổ 19×27) cũng được cắt
      for (let k = n - 1; k >= 1; k--) {   /* 29/10: chỉ cần 1 dòng sang trang sau (trước để 2 → còn chỗ trống đã cắt trang) */ const part = Object.assign({}, b, { data: sliceT(b, 0, k), full: b.full || b.data }); const e2 = mk(part);   /* phần đầu cũng tính cột theo cả bảng (2/11: lệch cột giữa 2 phần) */ pg.content.replaceChild(e2, el); pg.blocks[pg.blocks.length - 1] = e2; head0(pg);
        if (fits(pg)) { list.splice(i + 1, 0, { comp: b.comp, data: sliceT(b, k, n), src: b.src && Object.fromEntries(Object.entries(b.src).map(([q, v]) => { const m = q.match(/^row_(\d+)\.(.+)$/); return m && +m[1] > k ? [`row_${+m[1] - k}.${m[2]}`, v] : null; }).filter(Boolean)), cont: true, space: 0, role: b.role, full: b.full || b.data, bk: b.bk, sty: b.sty, exSplit: b.exSplit, exOff: isEx(b) ? (b.exOff || 0) + k : 0 }); list[i] = Object.assign(part, { full: b.full || b.data }); return e2; }
        el = e2; }
      return el; };
    // CỠ CHỮ NGƯỜI DÙNG TĂNG (4/11): khối đứng 1 mình trên trang vẫn cao hơn trang, không cắt được → hạ dần 5% tới khi vừa (không thấp hơn 100%), báo lại
    const bigSub = st => Object.values(st.sub || {}).some(x => x.fz > 1);
    const shrinkFit = (pg, i) => { const b = list[i]; if (!b.sty || !(b.sty.fz > 1 || bigSub(b.sty))) return false; let fz = b.sty.fz || 1, st = b.sty;
      while (fz > 1 || bigSub(st)) { fz = Math.max(1, Math.round((fz - 0.05) * 100) / 100);   // hạ khối trước, rồi các ô nhỏ > 100%
        const sub = {}; Object.entries(st.sub || {}).forEach(([k, v]) => { sub[k] = Object.assign({}, v, v.fz > 1 && (st.fz || 1) <= 1 ? { fz: Math.max(1, Math.round((v.fz - 0.05) * 100) / 100) } : {}); });
        st = Object.assign({}, st, { fz, sub }); const b2 = Object.assign({}, b, { sty: st }), e2 = mk(b2), cur = pg.blocks[pg.blocks.length - 1];
        pg.content.replaceChild(e2, cur); pg.blocks[pg.blocks.length - 1] = e2; list[i] = b2; head0(pg);
        if (fits(pg)) { warns.push(`Trang ${pg.n}: cỡ chữ khối ${b.comp.replace('Block/', '')} giới hạn ở ${Math.round(fz * 100)}% cho vừa trang`); return true; } }
      return false; };
    const isHead = x => /(Heading|Section Bar)$/.test(x.comp) || x.role === 'label' || x.role === 'practice';   // nhãn "Lời bài nghe", "Luyện tập" không đứng trơ cuối trang
    let pg = newPage();
    for (let i = 0; i < list.length; i++) {
      const b = list[i], el = mk(b); pg.content.appendChild(el); pg.blocks.push(el); head0(pg);
      const heading = isHead(b);
      if (heading && i + 1 < list.length) {   // tiêu đề phải đi cùng khối sau nó
        // thử kèm mọi tiêu đề liền sau + khối nội dung đầu tiên; không vừa → tiêu đề (và tiêu đề ngay trước nó) sang trang mới
        const tmp = []; for (let j = i + 1; j < list.length; j++) { const nx = mk(probeOf(list[j])); pg.content.appendChild(nx); tmp.push(nx); if (!isHead(list[j])) break; }
        const ok = fits(pg); tmp.forEach(x => x.remove());
        if (!ok && pg.blocks.length > 1) { const mv = [el]; el.remove(); pg.blocks.pop();
          while (pg.blocks.length > 1 && /(Heading|Section Bar)$/.test(pg.blocks[pg.blocks.length - 1].dataset.block)) { const h = pg.blocks.pop(); h.remove(); mv.unshift(h); }
          pg = newPage(); mv.forEach(x => { pg.content.appendChild(x); pg.blocks.push(x); }); }
        continue;
      }
      if (!fits(pg) && nRows(b) >= 2) { const r = trySplit(pg, i, el); if (r && fits(pg)) continue; if (r && r !== el) { r.remove(); pg.blocks.pop(); pg.content.appendChild(el); pg.blocks.push(el); } }
      if (!fits(pg) && pg.blocks.length === 1 && b.comp === 'Block/Exercise' && !b.exSplit) { b.exSplit = true; const r = trySplit(pg, i, el, true); if (r && fits(pg)) continue; }
      if (!fits(pg) && pg.blocks.length > 1 && FAM(b) && !b.exSplit) {   // còn ≥ 1/4 trang trống → cắt khối theo mục thay vì đẩy cả khối sang trang sau (3/11)
        const pv = pg.blocks[pg.blocks.length - 2], free = pg.content.clientHeight - (pv.getBoundingClientRect().bottom - pg.content.getBoundingClientRect().top);
        if (free >= pg.content.clientHeight * 0.25) { b.exSplit = true; if (nItems(b) >= 2) { const r = trySplit(pg, i, el); if (r && fits(pg)) continue; if (r && r !== el) { r.remove(); pg.blocks.pop(); pg.content.appendChild(el); pg.blocks.push(el); } } b.exSplit = false; } }
      if (!fits(pg)) { if (pg.blocks.length === 1) { if (!shrinkFit(pg, i)) warns.push(`Trang ${pg.n}: khối ${b.comp.replace('Block/', '')} cao hơn trang`); continue; }
        el.remove(); pg.blocks.pop(); const prev = pg.blocks[pg.blocks.length - 1]; let carry = [];
        if (prev && /(Heading|Section Bar)$/.test(prev.dataset.block)) { prev.remove(); pg.blocks.pop(); carry = [prev]; }   // tiêu đề mồ côi cuối trang → sang trang mới
        pg = newPage(); carry.forEach(c => { pg.content.appendChild(c); pg.blocks.push(c); }); pg.content.appendChild(el); pg.blocks.push(el); head0(pg);
        if (!fits(pg) && nRows(b) >= 2) trySplit(pg, i, el, pg.blocks.length === 1);   // sang trang mới vẫn dài hơn trang (bảng 8 dòng khổ 19×27) → cắt phần dư sang trang sau
        if (!fits(pg) && pg.blocks.length === 1 && b.comp === 'Block/Exercise' && !b.exSplit) { b.exSplit = true; trySplit(pg, i, pg.blocks[0], true); }
        if (!fits(pg) && pg.blocks.length === 1 && shrinkFit(pg, i)) continue;
        if (!fits(pg)) warns.push(`Trang ${pg.n}: khối ${b.comp.replace('Block/', '')} cao hơn trang`); }
    }
    // CỘT NHÃN CẤU TRÚC (người dùng 29/10): các khối Cấu trúc liền nhau dùng chung bề rộng nhãn = nhãn dài nhất nhóm (≤ 40% bề ngang) → khung công thức thẳng một cột
    pages.forEach(pg => { let grp = []; const cw = pg.content.clientWidth || 400;
      const flush = () => { const ls = grp.map(e => e.querySelector('[data-n="label"]')).filter(l => l && l.offsetParent); grp = []; if (!ls.length) return;
        ls.forEach(l => Object.assign(l.style, { width: 'auto', flex: '0 0 auto', whiteSpace: 'nowrap', maxWidth: 'none' }));
        const w = Math.min(Math.ceil(Math.max(...ls.map(l => l.scrollWidth))) + 1, Math.round(cw * 0.4));
        ls.forEach(l => Object.assign(l.style, { width: w + 'px', minWidth: w + 'px', maxWidth: w + 'px', flex: `0 0 ${w}px`, whiteSpace: l.scrollWidth > w ? 'normal' : 'nowrap', boxSizing: 'border-box' })); };
      [...pg.content.children].forEach(c => { if (c.querySelector(':scope [data-n="label"]') && c.querySelector(':scope [data-n="formula"]')) grp.push(c); else flush(); }); flush(); });
    // BẢNG NỐI cùng trang (khối bảng chia nhỏ liền nhau): bỏ viền dưới phần trên + viền trên phần nối → không có vạch cam dày giữa bảng (người dùng 29/10 buổi 11)
    pages.forEach(pg => [...pg.content.children].forEach(c => { const p0 = c.previousElementSibling; if (!p0 || !c.querySelector('[data-n="row_0"][data-cont]') || p0.dataset.block !== c.dataset.block) return;
      p0.style.borderBottom = 'none'; c.style.borderTop = 'none'; }));
    // SỐ HỘI THOẠI ①② trong cột kem (giáo trình gốc): đếm theo bài, phần nối trang giữ số cũ
    { let k = 0; pages.forEach(pg => [...pg.content.children].forEach(c => { if (c.dataset.block === 'Block/Lesson Header') k = 0; const sn = c.querySelector(':scope > [data-dn="dlgno"]'); if (!sn) return;
      const cont = c.querySelector('[data-n="row_0"][data-cont]'); if (!cont) k++; const p0 = c.previousElementSibling;
      sn.textContent = cont && p0 && p0.dataset.block === c.dataset.block && p0.querySelector(':scope > [data-dn="dlgno"]') ? '' : CIRC(Math.max(1, k)); })); }   // phần nối CÙNG trang: bỏ số (Canva 6/11: hai số ① liền nhau)
    // LOGO ĐẦU BÀI (Đắc Nhân): cao hơn ô đầu bài 9px mỗi phía, ô "BÀI n" chừa chỗ theo bề ngang logo → logo che kín mép ô (người dùng 29/10)
    pages.forEach(pg => pg.content.querySelectorAll('[data-dn="badge"]').forEach(im => { const el = im.parentElement, lb = el.querySelector('[data-n="lesson_box"]'); const H = el.offsetHeight; if (!H) return;
      el.querySelectorAll('[data-n="title.vi"], [data-n="title.native"]').forEach(t => { let f = parseFloat(t.style.fontSize) || 14; const min = f * 0.6, box = t.parentElement; const f0 = f, over = () => t.scrollWidth > Math.min(t.clientWidth, box.clientWidth - 24) + 1; while (f > min && over()) { f -= 0.5; t.style.fontSize = f + 'px'; } if (over()) { t.style.whiteSpace = 'normal'; t.style.fontSize = Math.round(f0 * 0.85) + 'px'; } });   /* thu tới 60% vẫn dài (tên không có phần phụ) → cho 2 dòng như cũ */   /* tên dài → thu cỡ chữ cho vừa 1 dòng */ const h = Math.min(H, 96); Object.assign(im.style, { height: h + 'px', width: Math.round(h * 1.043) + 'px', top: Math.round((H - h) / 2) + 'px' }); }));   /* 2/11: KHÔNG nới ô "BÀI n" sau khi đã xếp trang (ô tên hẹp lại → tên rớt dòng, đầu bài cao lên, bảng cuối trang bị cắt) – lề trái cố định 66px ở dnBook */
    pages.forEach(pg => { const f = pg.content.firstElementChild; if (f) { f.style.marginTop = '0px'; const h0 = !f.dataset.dnDlg && f.querySelector('[data-n="row_0"][data-cont]'); if (h0) h0.style.display = 'flex'; } });   // bảng nối sang trang mới: hiện lại đầu bảng   // khối đầu trang không cách trên
    // PHẦN NỐI CỦA BẢNG (đầu bảng ẩn, data-cont): chép đúng độ rộng cột của phần ngay trước → các cột thẳng hàng tuyệt đối (người dùng 2/11)
    { let prev = null; pages.forEach(pg => pg.host.querySelectorAll('[data-block="Block/Table N"]:not([data-dn-dlg])').forEach(t => { const h0 = t.querySelector('[data-n="row_0"]');   /* bỏ qua bảng hội thoại (ô xếp chồng – chép flex làm chữ đè nhau, 2/11) */
        if (h0 && h0.dataset.cont && prev) { const W = {}; prev.querySelectorAll('[data-n^="row_"] > [data-n$="_cell"]').forEach(c => { if (!(c.dataset.n in W)) W[c.dataset.n] = c.style.flex; }); t.querySelectorAll('[data-n^="row_"] > [data-n$="_cell"]').forEach(c => { if (W[c.dataset.n]) c.style.flex = W[c.dataset.n]; }); }
        else prev = t; })); }
    return { pages, warns, size };
  }

  // ---------- BÌA TRƯỚC · TRANG MỞ ĐẦU · TRANG KẾT THÚC · BÌA SAU (người dùng 28/10) ----------
  // Bìa trước / sau dựng từ mẫu Figma của khổ (A4/Cover, A4/Back Cover…). Trang mở đầu + kết thúc = lời dẫn, dàn theo form cố định
  // (nhãn nhỏ · tiêu đề · kẻ màu brand · thân bài · chữ ký) trên khung trang nội dung; CHỈ hai trang này cho sửa nội dung.
  function meta(books, buoi) {
    const s6 = (books && books.s6) || {};
    const info = tab(s6, /Khoá & bài|Khóa & bài/).find(r => isB(r, buoi)) || {};
    const course = Object.fromEntries(tab(s6, /Thông tin khoá|Thông tin khóa/).map(r => [S(r['Mục']), S(r['Nội dung'])]));
    const objs = objSplit((info['Mục tiêu bài'] || info['MỤC TIÊU BÀI HỌC'] || info['Mục tiêu bài học'])).slice(0, 5);
    const ses = tab(s6, /Khoá & bài|Khóa & bài/).map(r => bNum(r['Buổi'])).filter(n => !isNaN(n));
    const s5row = tab((books && books.s5) || {}, /^S5$/).find(r => isB(r, buoi)) || {};
    return { course: course['Tên khoá'] || '', level: course['Cấp độ'] || '', bai: info['Bài'] ? Number(info['Bài']) : null, title: S(info['Tên buổi']) || 'Buổi ' + buoi, objs, label: info['Bài'] ? 'Bài ' + Number(info['Bài']) : 'Buổi ' + bNum(buoi),
      buoi: bNum(buoi), desc: course['Mô tả khoá'] || '', dando: S(s5row['Dặn dò']),   // lời mở đầu = "Mô tả khoá" (S6) · lời dặn dò = cột "Dặn dò" (S5) của buổi – nguyên văn (28/10)
      isFirst: ses.length ? bNum(buoi) === Math.min(...ses) : true, isLast: ses.length ? bNum(buoi) === Math.max(...ses) : true };
  }
  // NỘI DUNG TRANG LỜI DẪN – chỉ lấy nguyên văn từ S5/S6, không tự viết (người dùng 28/10)
  function letterDefaults(kind, m, brand) {
    const team = `Đội ngũ biên soạn ${brand}`;
    if (kind === 'intro') return { kicker: 'LỜI MỞ ĐẦU', title: `Chào mừng bạn đến với ${m.course || 'khoá học'}`, body: m.desc || '', sign: team };   // S6 › Thông tin khoá › Mô tả khoá
    if (kind === 'thanks') return { kicker: 'LỜI CẢM ƠN', title: 'Lời cảm ơn', body: '', sign: team };   // S5/S6 không có nội dung cảm ơn → để trống cho người soạn tự điền
    return { kicker: 'LỜI DẶN DÒ', title: `Buổi ${m.buoi}`, body: m.dando || '', sign: '' };   // S5 › cột Dặn dò của buổi
  }
  function letterCss() {
    if (typeof document === 'undefined' || document.getElementById('plsLetterCss')) return; const st = document.createElement('style'); st.id = 'plsLetterCss';
    st.textContent = '.bk-letter{display:flex;flex-direction:column;flex:1 1 auto;padding:28px 8px 0;box-sizing:border-box;color:var(--color-text,#1f2a2e)}'
      + '.bk-letter .bk-kicker{font-size:9px;font-weight:700;letter-spacing:.16em;color:var(--color-primary,#406864)}'
      + '.bk-letter .bk-title{font-size:18px;line-height:1.3;font-weight:700;margin:8px 0 0;color:var(--color-primary-dark,#142738)}'
      + '.bk-letter .bk-rule{width:40px;height:3px;border-radius:2px;background:var(--color-primary,#406864);margin:12px 0 16px}'
      + '.bk-letter .bk-body{font-size:10.5px;line-height:1.7;white-space:pre-wrap}'
      + '.bk-letter .bk-sign{margin-top:20px;align-self:flex-end;font-size:10.5px;font-style:italic;font-weight:500;color:var(--color-primary,#406864)}'
      // lời mở đầu: khối chữ nằm giữa trang, tiêu đề căn giữa, dấu ngoặc kép trang trí, đoạn văn canh đều, chữ ký có gạch
      + '.bk-letter[data-letter=intro]{justify-content:center;align-items:center;padding:0 34px 70px;text-align:center}'
      + '.bk-letter[data-letter=intro] .bk-kicker{display:flex;align-items:center;gap:10px;font-size:9.5px;letter-spacing:.24em}'
      + '.bk-letter[data-letter=intro] .bk-kicker::before,.bk-letter[data-letter=intro] .bk-kicker::after{content:"";width:28px;height:1px;background:currentColor;opacity:.6}'
      + '.bk-letter[data-letter=intro] .bk-title{font-size:21px;line-height:1.35;margin:12px 0 0;max-width:92%}'
      + '.bk-letter[data-letter=intro] .bk-rule{margin:16px auto 22px;width:56px}'
      + '.bk-letter[data-letter=intro] .bk-body{position:relative;font-size:11px;line-height:1.85;text-align:justify;text-align-last:left;padding:18px 22px 16px;border-radius:10px;background:color-mix(in srgb,var(--color-primary,#406864) 6%,#fff);width:100%;box-sizing:border-box}'
      + '.bk-letter[data-letter=intro] .bk-body::before{content:"\\201C";position:absolute;left:8px;top:-16px;font-size:46px;line-height:1;font-family:Georgia,serif;color:var(--color-primary,#406864);opacity:.45}'
      + '.bk-letter[data-letter=intro] .bk-sign{margin-top:22px;align-self:flex-end;padding-top:6px;border-top:1px solid var(--color-primary,#406864);font-size:10.5px}'
      + '.bk-letter [contenteditable]{outline:none;border-radius:4px}.bk-letter [contenteditable]:hover{box-shadow:0 0 0 1px #c9b8f5}.bk-letter [contenteditable]:focus{box-shadow:0 0 0 2px #7c5cd6;background:rgba(124,92,214,.05)}'
      + '.bk-letter [contenteditable]:empty::before{content:attr(data-ph);color:#a99bd6;font-style:italic}'
      + '@media print{.bk-letter [contenteditable]{box-shadow:none!important;background:none!important}.bk-letter [contenteditable]:empty::before{content:none}}';
    document.head.appendChild(st);
  }
  // BÌA SỬA ĐƯỢC – Đắc Nhân "Tổng hợp HSK" (người dùng 29/10): dựng lại đúng bìa giáo trình HSK1 bản 4.1 bằng HTML (khung A4 595×842, px = pt);
  // logo + chữ thương hiệu + bố cục cố định; chữ có data-field sửa được (lưu theo bài như trang lời dẫn); ảnh minh hoạ thay được (txt.img).
  const EDIT_COVERS = { 'Đắc Nhân': [{ id: 'dac-nhan-hsk-edit', label: 'Tổng hợp HSK (sửa chữ, đổi ảnh)', edit: 'dn-hsk' }] };
  const DROP_COVERS = { 'Đắc Nhân': /^dac-nhan-dn-\d+$/ };   // người dùng 29/10: bỏ hàng bìa ảnh ĐN 1–6, chỉ dùng bìa dựng lại sửa được
  function addEditCovers() { const C = root.PLS_COVERS; if (!C) return; for (const [b, list] of Object.entries(EDIT_COVERS)) { C[b] = C[b] || { front: [], back: [] }; for (const x of list.slice().reverse()) if (!C[b].front.some(y => y.id === x.id)) C[b].front.unshift(x); }
    for (const [b, re] of Object.entries(DROP_COVERS)) if (C[b]) { C[b].front = C[b].front.filter(x => !re.test(x.id)); C[b].back = (C[b].back || []).filter(x => !re.test(x.id)); } }
  addEditCovers();
  // chữ to trên bìa (HSK 2, HSK 3…) không tràn mép phải: thu cỡ chữ cho vừa khổ bìa, giữ lề phải ≥ 40px (người dùng 2/11)
  const hskLv = m => { const x = String(((m || {}).course || '') + ' ' + ((m || {}).level || '')).match(/HSK\s*(\d)/i); return x ? +x[1] : 0; };
  function fitCover(host) { const cv = host && host.querySelector('.dn-cover'); if (!cv) return;
    ['title1', 'title2'].forEach(k => { const e = cv.querySelector(`[data-field="${k}"]`); if (!e) return; const base = k === 'title2' ? 173.6 : 40.8, lh = k === 'title2' ? 185 : 49;
      e.style.fontSize = base + 'px'; const room = 595 - parseFloat(e.style.left) - 64;   /* lề phải ≈ lề trái */ const w = e.scrollWidth || e.getBoundingClientRect().width;
      if (w > room) { const f = Math.max(base * 0.4, base * room / w); e.style.fontSize = f.toFixed(1) + 'px'; e.style.lineHeight = lh + 'px'; } }); }
  function dnCover(t, img, logo, lv) {
    const LV = lv && lv > 1 ? { title2: 'HSK ' + lv, audience: 'NGƯỜI ĐÃ HỌC XONG HSK ' + (lv - 1) + '\n& MUỐN NÂNG CAO TIẾNG TRUNG' } : {};   // bìa theo cấp HSK của khoá (người dùng 2/11: HSK2)
    t = Object.assign({}, LV, t);
    const O = '#E65425', D = '#B72025', G = '#3A3A3C';
    const band = !t.img && /^([1-9]|10)$/.test(String(t.band || '')) ? String(t.band) : '';   // ảnh mẫu 1–10 (người dùng 29/10): ảnh đã gồm viền cam trên dưới → phủ cả dải, bỏ 2 vạch đỏ
    const f = (k, def, css, tag) => `<${tag || 'div'} data-field="${k}" style="position:absolute;white-space:pre;${css}">${esc(t[k] != null ? t[k] : def)}</${tag || 'div'}>`;
    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
    return `<div class="dn-cover" style="position:relative;width:595px;height:842px;overflow:hidden;background:#fff;font-family:Montserrat,sans-serif;color:${G}">
    <img src="${logo}" style="position:absolute;left:64.4px;top:38.2px;width:78.4px;height:32.7px" alt="">
    <div style="position:absolute;left:153.4px;top:41.8px;width:1.7px;height:25.9px;background:${G}"></div>
    <div style="position:absolute;left:167px;top:40.5px;font-weight:700;font-size:10.6px;line-height:13.5px">TẠI ĐẮC NHÂN<br>TRI THỨC TRUYỀN TỪ TÂM</div>
    <div style="position:absolute;right:37.6px;top:38.6px;text-align:right;font-weight:700;font-size:10.9px;line-height:13.95px">TÀI LIỆU LƯU HÀNH NỘI BỘ<br>VÀ DÀNH RIÊNG CHO<br><span style="color:${O}">HỌC VIÊN ĐẮC NHÂN</span></div>
    ${f('title1', 'TỔNG HỢP', `left:66.2px;top:156.2px;font-weight:800;font-size:40.8px;line-height:49px;color:${O};letter-spacing:-0.36px`)}
    ${f('title2', 'HSK', `left:57.8px;top:185.8px;font-weight:800;font-size:173.6px;line-height:185px;color:${O};letter-spacing:-1.6px`)}
    ${f('for', 'Được thiết kế dành riêng cho', `left:65.6px;top:378.3px;font-style:italic;font-weight:600;font-size:11.06px;line-height:14.7px`)}
    ${f('audience', 'NGƯỜI MỚI BẮT ĐẦU\n& LÀM QUEN VỚI TIẾNG TRUNG', `left:66.2px;top:394.0px;font-weight:700;font-size:17.17px;line-height:21.85px;color:${O}`)}
    <div style="position:absolute;left:67px;top:452.6px;width:31.7px;height:5.8px;border-radius:3px;background:${O}"></div>
    ${f('edition', 'Tái bản lần 6 - 03/2026', `left:105.5px;top:448.2px;font-style:italic;font-weight:700;font-size:10.66px;line-height:14.2px`)}
    ${band ? `<div data-img="band" style="position:absolute;left:0;top:485.6px;width:595px;height:283.9px;background:#E86A37 url('covers/dac-nhan-band-${band}.jpg') center/cover no-repeat"></div>` : `<div style="position:absolute;left:0;top:485.6px;width:595px;height:7.8px;background:${D}"></div>
    <div data-img="band" style="position:absolute;left:0;top:493.4px;width:595px;height:268.5px;background:#E86A37 url('${img}') center/cover no-repeat"></div>
    <div style="position:absolute;left:0;top:761.9px;width:595px;height:7.6px;background:${D}"></div>`}
    <div style="position:absolute;left:393.5px;top:386.1px;width:166px;height:166px;box-sizing:border-box;border:3px solid ${O};border-radius:14px;background:#fff">
      ${f('vol_label', 'QUYỂN', `left:-4.8px;right:0;top:23.8px;text-align:center;font-weight:800;font-size:27.7px;line-height:32px;color:${O}`)}
      ${f('vol_no', '01', `left:0;right:0;top:46.8px;text-align:center;font-weight:800;font-size:93.7px;line-height:104.6px;color:${O}`)}
    </div>
    <div style="position:absolute;left:59.2px;right:33px;top:788px;height:26px;display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:16px">
      ${['TỪ VỰNG', 'NGỮ PHÁP', 'HỘI THOẠI', 'LUYỆN VIẾT'].map((d, i) => (i ? `<span style="width:2px;height:18px;background:${O}"></span>` : '') + `<span data-field="tag_${i + 1}" style="white-space:pre">${esc(t['tag_' + (i + 1)] != null ? t['tag_' + (i + 1)] : d)}</span>`).join('')}
    </div>
  </div>`;
  }
  // kind: 'cover' | 'intro' | 'outro' | 'back' · txt: nội dung đã sửa của trang lời dẫn {kicker,title,body,sign}
  function extraPage(kind, opt) {
    const E = root.PLS_ENGINE, size = SIZES[opt.size] || SIZES.A4, pre = opt.size === '19x27' ? '19x27' : 'A4', m = opt.meta || {};
    if (kind === 'cover' || kind === 'back') {
      // MẪU BÌA ẢNH (Figma › IMAGE LIBRARY › Bìa sách): chọn trong thanh "Bìa" của chế độ sách; 'tpl' = mẫu chữ của khổ (A4/Cover…)
      const pid = opt.pick, C = root.PLS_COVERS || {};
      const hit = pid && pid !== 'tpl' ? Object.values(C).flatMap(b => b.front.concat(b.back)).find(x => x.id === pid) : null;
      if (hit && hit.edit === 'dn-hsk') { const [w, h] = opt.size === '19x27' ? [538.6, 765.4] : [595, 842], t = opt.txt || {};
        const host = document.createElement('div'); host.className = 'pls-book-cover'; host.dataset.coverId = hit.id; host.dataset.edit = '1';
        host.style.cssText = `position:relative;transform-origin:0 0;width:${w}px;height:${h}px;overflow:hidden;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact`;
        host.innerHTML = dnCover(t, t.img || 'covers/dac-nhan-hsk-band.jpg', 'covers/dac-nhan-logo.png', hskLv(opt.meta));
        const inner = host.firstElementChild; inner.style.transformOrigin = '0 0'; if (w !== 595) inner.style.transform = `scale(${w / 595}, ${h / 842})`;
        opt.stage.appendChild(host); fitCover(host); return { host, kind, n: null, cover: hit }; }
      if (hit) { const [w, h] = opt.size === '19x27' ? [538.6, 765.4] : [595, 842];
        const host = document.createElement('div'); host.className = 'pls-book-cover'; host.dataset.coverId = hit.id;
        host.style.cssText = `position:relative;transform-origin:0 0;width:${w}px;height:${h}px;overflow:hidden;background:#fff url("covers/${hit.id}.jpg") center/cover no-repeat;-webkit-print-color-adjust:exact;print-color-adjust:exact`;
        opt.stage.appendChild(host); return { host, kind, n: null, cover: hit }; }
      const comp = `${pre}/${kind === 'cover' ? 'Cover' : 'Back Cover'}`; if (!TPL(comp)) return null;
      const short = (m.course || '').split(/\s+[–-]\s+|\s*\(/)[0];   // tên khoá dài → lấy phần trước dấu "–" / "("
      const ttl = (short && short.length <= 28 ? short : (m.level || short || 'TÀI LIỆU')).toUpperCase();
      const data = kind === 'cover' ? { title: ttl, subtitle: `${m.label} – ${String(m.title).replace(/^Bài\s*\d+\s*[–-]\s*/i, '')}`, tag_1: 'TỪ VỰNG', tag_2: 'NGỮ PHÁP', tag_3: 'HỘI THOẠI' } : {};
      const r = E.render({ comp, data }, opt.brand); opt.stage.appendChild(r.host); r.host.classList.add('pls-book-cover');
      r.host.querySelectorAll('.pls-imgslot, .pls-imgempty').forEach(e => { e.style.display = 'none'; });   // mẫu chữ: không in khung "Ảnh minh hoạ" trống
      return { host: r.host, kind, n: null };
    }
    bookCss(); letterCss();
    if (kind === 'intro' && opt.brand === 'Đắc Nhân' && hskLv(m)) {   /* lời mở đầu theo giáo trình, đổi theo cấp HSK (HSK1 nguyên văn; HSK2… – người dùng 2/11) */ const ps = dnIntroPages(Object.assign({}, opt, { lv: hskLv(m) }), E, size); return Object.assign(ps[0], { more: ps.slice(1) }); }   // lời mở đầu nguyên văn giáo trình (2 trang)
    const n = opt.n, front = kind === 'intro';   // LỜI MỞ ĐẦU (người dùng 29/10): trang mở sách – không in số trang, không chữ chạy đầu trang (vẫn tính trong dãy số)
    const r = E.render({ comp: size.page(n), data: { running: front ? '' : (opt.running || ''), page_no: front || n % 2 === 0 ? '' : String(n), page_no_l: !front && n % 2 === 0 ? String(n) : '' } }, opt.brand);
    opt.stage.appendChild(r.host); r.host.classList.add('pls-book-page'); r.host.style.setProperty('--book-font', bookFont(opt.brand)); pageFrame(r.host, opt.size);
    if (front) r.host.querySelectorAll('[data-n="running"], [data-n="page_no"], [data-n="page_no_l"]').forEach(e => { e.style.visibility = 'hidden'; });
    const content = r.host.querySelector('[data-n="content"]'); [...content.children].forEach(c => c.remove());
    const t = Object.assign(letterDefaults(kind, m, opt.brand), opt.txt || {});
    const box = document.createElement('div'); box.className = 'bk-letter'; box.dataset.letter = kind;
    [['kicker', 'div'], ['title', 'h1'], ['rule', 'div'], ['body', 'div'], ['sign', 'div']].forEach(([f, tag]) => { const e = document.createElement(tag); e.className = 'bk-' + f; if (f !== 'rule') { e.dataset.field = f; e.textContent = t[f] || ''; if (f === 'body') e.dataset.ph = kind === 'thanks' ? 'S5/S6 không có nội dung lời cảm ơn – bấm vào đây để nhập (dòng này không in ra)' : 'S5/S6 để trống ô này – bấm vào đây để nhập (dòng này không in ra)'; } box.appendChild(e); });
    content.appendChild(box);
    { const sty = (opt.txt || {})._sty || {}; box.querySelectorAll('[data-field]').forEach(e => { const st = sty[e.dataset.field]; if (!st) return;   // CỠ CHỮ TỪNG PHẦN (người dùng 5/11)
      if (e.dataset.field === 'body') { e.dataset.fz = String(Math.min(1.5, Math.max(0.7, +st.fz || 1))); bookSty(e, { b: st.b, i: st.i, u: st.u, ta: st.ta }, box); } else bookSty(e, st, box); }); }
    // CHỮ DÀI HƠN TRANG (người dùng 29/10: lời mở đầu "bị mất dòng"): thu nhỏ chữ + giãn dòng dần tới khi vừa trang; vẫn không vừa → bỏ căn giữa dọc
    fitLetter(r.host);
    return { host: r.host, kind, n };
  }

  // LỜI MỞ ĐẦU ĐẮC NHÂN (người dùng 2/11: giữ nguyên văn như giáo trình gốc, 2 trang) – chữ cam đậm = nhấn mạnh; tự chia sang trang 2 khi hết chỗ
  const DN_INTRO = (() => { const o = t => `<b style="color:#E07B39">${t}</b>`, h = t => `<div class="dni-h">${t}</div>`, p = t => `<p>${t}</p>`, ul = (xs, dot) => `<ul class="${dot ? 'dni-dot' : ''}">${xs.map(x => `<li>${x}</li>`).join('')}</ul>`;
    return [`<div class="dni-title">LỜI MỞ ĐẦU</div>`,
      `<p class="dni-ind">Chào mừng các bạn học viên đến với ${o('Giáo trình HSK 1')}, được biên soạn bởi đội ngũ ${o('Hoa ngữ Đắc Nhân')}.<br>Giáo trình này được thiết kế dành cho những học viên mới bắt đầu, giúp xây dựng nền tảng tiếng Trung vững chắc từ những bước đầu tiên: nắm chuẩn ${o('Pinyin')}, ghi nhớ ${o('từ vựng – ngữ pháp cơ bản')}, và rèn luyện ${o('kỹ năng nghe – đọc - nói')} theo chuẩn HSK 1.<br>Mỗi bài học đều được thiết kế theo dễ hiểu, khoa học, giúp học viên từng bước chinh phục tiếng Trung một cách tự tin và hiệu quả.</p>`,
      h('CẤU TRÚC GIÁO TRÌNH'), p(`Giáo trình HSK 1 được xây dựng xoay quanh ${o('4 trụ cột chính')}:`),
      `<div class="dni-h2">1. Chinh phục Pinyin</div>` + ul(['Nắm trọn hệ thống ngữ âm trong tiếng Trung bao gồm thanh mẫu, vận mẫu và thanh điệu.', 'Cách ghép âm và phát âm chuẩn ngay từ những buổi học đầu tiên.', 'Tạo nền tảng để phát triển kỹ năng nghe, nói và ghi nhớ pinyin hiệu quả.']),
      `<div class="dni-h2">2. Từ vựng &amp; Ngữ pháp trọng điểm</div>` + ul(['Từ vựng được chọn lọc theo chuẩn HSK 1, đi kèm pinyin – nghĩa – ví dụ.', 'Ngữ pháp trình bày ngắn gọn, dễ hiểu, tập trung vào các cấu trúc cơ bản giúp học viên tự tin áp dụng ngay trong giao tiếp.']),
      `<div class="dni-h2">3. Luyện mẫu câu &amp; Kỹ năng nói</div>` + ul(['Học viên được làm quen và luyện tập các mẫu câu giao tiếp cốt lõi trong HSK 1.', 'Từng bước hình thành phản xạ nói thông qua quá trình đọc mẫu – luyện nói – tự nói theo tình huống.', 'Tăng phản xạ ngôn ngữ, cải thiện phát âm và hình thành thói quen nói đúng – nói tự nhiên ngay từ trình độ sơ cấp.', 'Giúp học viên tự tin mở miệng nói tiếng Trung, tránh tình trạng “biết mà không nói được”.']),
      `<div class="dni-h2">4. Luyện kỹ năng Nghe và Đọc</div>` + ul(['Học viên sẽ luyện nghe từ dễ đến khó, từ từng từ đơn lẻ cho đến câu hoàn chỉnh.', 'Các đoạn đọc ngắn bám sát theo format HSK giúp học viên nhận diện chữ Hán nhanh, nâng cao phản xạ và khả năng đọc hiểu.']),
      h('HỖ TRỢ HỌC TẬP CÙNG APP ĐẮC NHÂN'), p(`Toàn bộ nội dung giáo trình được tích hợp trong ${o('App Đắc Nhân')}, giúp bạn chủ động luyện tập mọi lúc, mọi nơi:`),
      ul([`${o('Luyện nghe – nói phản xạ nhanh với Pinyin')}, giúp phát âm chuẩn và tự tin.`, `${o('Ghi nhớ từ vựng')} hiểu rõ bản chất của chữ Hán và luyện viết chữ Hán.`, `${o('Hiểu và vận dụng ngữ pháp')} qua các bài tập thực hành rõ ràng, dễ hiểu, đúng trọng tâm.`, 'Theo dõi tiến độ học, luyện tập bổ sung sau mỗi buổi học và nhận phản hồi chi tiết từ giáo viên.'], true),
      p(`Sự kết hợp giữa ${o('giáo trình trên lớp')} và ${o('App học tập tại nhà')} giúp việc học của bạn trở nên dễ dàng hơn, tiện lợi hơn, đều đặn hơn, giúp tăng khả năng ghi nhớ - điểm quan trọng giúp xây nền tảng vững chắc cho các cấp độ HSK tiếp theo.`),
      h('PHƯƠNG PHÁP HỌC HIỆU QUẢ'), p('Để đạt kết quả tốt nhất, học viên nên:'),
      ul(['Luyện đọc Pinyin và phát âm mỗi ngày - cần rèn luyện để đạt đến mức “phản xạ” được.', 'Hoàn thành phần ôn tập và làm BTVN tại App sau mỗi buổi học - biến kiến thức thành của mình', 'Tích cực phát biểu, luyện nói cùng giáo viên và bạn học - để tăng sự tự tin và phát âm chuẩn khi nói', 'Tận dụng ứng dụng để ôn luyện - đều đặn 15 phút mỗi ngày để nhớ lâu từ vựng, ngữ pháp'], true),
      p('Chỉ cần bạn làm đúng theo phương pháp và sự hướng dẫn của đội ngũ Đắc Nhân, việc học HSK 1 sẽ trở nên đơn giản và hiệu quả hơn rất nhiều. Học viên cũng sẽ nhanh chóng nắm vững nền tảng tiếng Trung, chuẩn bị vững chắc cho các cấp độ HSK tiếp theo.'),
      h('LỜI CẢM ƠN') + p(`Đội ngũ ${o('Hoa ngữ Đắc Nhân')} xin gửi lời cảm ơn chân thành đến Quý học viên đã tin tưởng đồng hành cùng chúng tôi trong hành trình chinh phục tiếng Trung.`),
      p(`Với phương châm ${o('“Tri thức truyền từ tâm”')}, chúng tôi luôn nỗ lực mang đến môi trường học tập gần gũi, hiệu quả và đầy cảm hứng, để mỗi học viên đều có thể ${o('“học là dùng được”')}.`),
      p('Chúc bạn học tập hiệu quả, chinh phục HSK 1 dễ dàng và tiến xa hơn trên con đường học tiếng Trung!'),
      p(`Trân trọng<br>${o('Đội ngũ Hoa ngữ Đắc Nhân.')}`)]; })();
  // 3 TRANG MỞ ĐẦU ĐẮC NHÂN (người dùng 2/11: giữ như giáo trình gốc) – sau Mục lục, trước Bài 1: tổng quan chữ Hán · thanh mẫu · vận mẫu + thanh điệu
  const DN_PRIMER = (() => {
    const R = '#B71C1C', O = '#E07B39', SOFT = '#FBEBDD', pill = t => `<div style="align-self:center;background:${SOFT};color:${R};font-weight:700;font-size:12px;padding:4px 18px;border-radius:4px;margin:6px 0 8px">${t}</div>`;
    const head = `<div style="display:flex;align-items:stretch;height:74px;margin:6px 0 14px;overflow:visible"><div style="position:relative;flex:0 0 190px;margin-left:8px;background:${O};border:1.5px solid ${R};border-right:0;display:flex;align-items:center;justify-content:flex-end;padding-right:14px;color:#fff;font-weight:700;font-size:19px;white-space:nowrap"><img src="covers/dac-nhan-badge.png" alt="" style="position:absolute;left:-8px;top:50%;transform:translateY(-50%);height:84px">MỞ ĐẦU</div><div style="flex:1;background:#FDF3E7;border:1.5px solid ${R};display:flex;flex-direction:column;justify-content:center;padding:0 14px"><div style="color:${R};font-weight:700;font-size:15px;white-space:nowrap">GIỚI THIỆU TỔNG QUAN</div><div style="color:${R};font-weight:700;font-size:10.5px">VỀ CHỮ HÁN</div></div></div>`;
    const lab = (t, sub, al) => `<div style="text-align:${al};font-size:9px;line-height:1.35"><div style="color:${R};font-weight:700;font-size:10px">${t}</div>${sub}</div>`;
    // TRANG 1 (QC 4/11): đường nối có MŨI TÊN chỉ đúng vào chữ Hán / pinyin; bỏ nhãn "Thanh mẫu" thừa trên chữ h; 2 đường "Vận mẫu" chỉ đúng lên ǐ và ǎo
    // data-mv = phần KÉO ĐƯỢC trên trang này (người dùng 4/11 – chỉ trang sơ đồ Mở đầu; đầu trang cố định)
    const AR = `<defs><marker id="dnArr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${R}"/></marker></defs>`;
    const arrow = (mv, x1, y1, x2, y2, L, T, W, H) => `<svg data-mv="${mv}" style="position:absolute;left:${L}px;top:${T}px;overflow:visible" width="${W}" height="${H}">${AR}<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${R}" stroke-width="1" marker-end="url(#dnArr)"/></svg>`;
    const p1 = head + `<div style="position:relative;height:118px;width:438px;margin:4px auto 10px">
      <div data-mv="lab-han" style="position:absolute;left:0;top:34px;width:92px">${lab('CHỮ HÁN', 'Chữ tượng hình<br>dựa trên âm tiết', 'left')}</div>
      ${arrow('ar-han', 0, 8, 82, 8, 88, 45, 86, 16)}
      <div data-mv="box" style="position:absolute;left:158px;top:0;width:118px;box-sizing:border-box;border:2px solid ${O};padding:10px 0;text-align:center"><div style="color:${O};font-style:italic;font-size:15px;word-spacing:.9em">nǐ hǎo</div><div style="color:${R};font-size:42px;font-weight:700;line-height:1.1;font-family:'KaiTi','STKaiti','LXGW WenKai',serif">你好</div><div style="font-weight:700;font-size:11px;margin-top:4px">XIN CHÀO</div></div>
      ${arrow('ar-py', 66, 8, 2, 8, 252, 13, 68, 16)}
      <div data-mv="lab-py" style="position:absolute;left:322px;top:12px;width:116px">${lab('PHIÊN ÂM (PINYIN)', 'Cách ghi phiên âm<br>chữ Hán bằng chữ Latin', 'center')}</div></div>`
      + `<div data-mv="pill-ht">${pill('HỆ THỐNG NGỮ ÂM TRONG TIẾNG TRUNG')}</div>`
      + `<div data-mv="box-ht" style="border:2px solid ${O};padding:8px 10px 6px;text-align:center;margin:0 18px"><div style="display:flex;justify-content:space-around;font-weight:700;font-size:10.5px"><span>21 THANH MẪU</span><span>+</span><span>36 VẬN MẪU</span><span>+</span><span>4 THANH ĐIỆU</span></div><div style="font-size:14px;line-height:1">‖</div><div style="color:${O};font-size:22px">nǐ hǎo</div></div>`
      + `<p data-mv="para" style="font-size:10px;margin:12px 0 10px">Trong đó, các thành phần trong hệ thống ghép thành được chia như sau:</p>`
      + `<div style="position:relative;height:150px;margin:0 auto;width:330px;font-weight:700">
        ${[['Thanh điệu', 120, 'td1'], ['Thanh điệu', 230, 'td2']].map(([t, x, id]) => `<div data-mv="${id}" style="position:absolute;left:${x - 30}px;top:0;width:60px;height:32px"><div style="text-align:center;color:${R};font-size:9.5px">${t}</div><div style="position:absolute;left:30px;top:16px;height:16px;border-left:1px solid ${R}"></div></div>`).join('')}
        <div data-mv="tm" style="position:absolute;left:0;top:44px;color:${R};font-size:9.5px">Thanh mẫu —</div>
        ${[['n', 75, 'l-n'], ['ǐ', 120, 'l-i'], ['h', 175, 'l-h'], ['ǎo', 230, 'l-ao']].map(([t, x, id]) => `<div data-mv="${id}" style="position:absolute;left:${x - 20}px;top:30px;width:40px;text-align:center;color:${O};font-size:30px;font-family:'Times New Roman',serif">${t}</div>`).join('')}
        ${arrow('vm1', 34, 34, 2, 2, 120, 70, 36, 36)}${arrow('vm2', 2, 34, 34, 2, 196, 70, 36, 36)}
        <div data-mv="vm" style="position:absolute;left:145px;top:106px;width:60px;text-align:center;color:${R};font-size:9.5px">Vận mẫu</div></div>`;
    const td = (t, st) => `<td style="border:1px solid ${R};padding:3px 6px;text-align:center;${st || ''}">${t}</td>`;
    const groups = [['THANH MẪU ĐƠN', [['Âm môi', [['b', 'p'], ['m'], ['f']]], ['Âm đầu lưỡi', [['d', 't'], ['n', 'l']]], ['Nhóm âm cuống lưỡi', [['g', 'k'], ['h']]], ['Nhóm âm mặt lưỡi', [['j'], ['q'], ['x']]], ['Nhóm âm đầu lưỡi trước', [['z', 'c'], ['s'], ['r']]]]], ['THANH MẪU KÉP', [['Nhóm âm đầu lưỡi sau', [['zh'], ['ch'], ['sh']]]]]];
    let rows = '';
    groups.forEach(([g, subs]) => { const gn = subs.reduce((a, [, cs]) => a + cs.length, 0); subs.forEach(([sname, cs], si) => cs.forEach((c, ci) => {
      rows += '<tr>' + (si === 0 && ci === 0 ? td(g, `color:${R};font-weight:700;width:30%`).replace('<td', `<td rowspan="${gn}"`) : '') + (ci === 0 ? td(sname, 'font-weight:700;width:30%').replace('<td', `<td rowspan="${cs.length}"`) : '') + td(c.join('<br>'), ci % 2 ? 'background:#FDF6EE' : '') + '</tr>'; })); });
    const p2 = `<div data-mv="pill-tm">${pill('GIỚI THIỆU VỀ THANH MẪU')}</div>` + `<table data-mv="tab-tm" style="border-collapse:collapse;width:100%;font-size:10px;line-height:1.5"><tr>${td('PHÂN LOẠI', `background:${O};color:#fff;font-weight:700`).replace('<td', '<td colspan="2"')}${td('THANH MẪU (PHỤ MẪU)', `background:${O};color:#fff;font-weight:700`)}</tr>${rows}</table>`;
    const vtab = (h, xs) => `<table data-mv="tab-${h}" style="border-collapse:collapse;width:100%;font-size:9.5px;margin-bottom:9px;table-layout:fixed"><tr>${td(h, `background:${O};color:#fff;font-weight:700`).replace('<td', `<td colspan="${xs.length}"`)}</tr><tr>${xs.map((x, i) => td(x, (i % 2 ? 'background:#FDF6EE;' : '') + 'border-style:solid dotted')).join('')}</tr></table>`;
    const p3 = `<div data-mv="pill-vm">${pill('GIỚI THIỆU VỀ VẬN MẪU')}</div>` + vtab('VẬN MẪU ĐƠN', ['a', 'e', 'o', 'i', 'u', 'ü']) + vtab('VẬN MẪU KÉP', ['ai', 'ei', 'ao', 'ou', 'er']) + vtab('VẬN MẪU MŨI', ['an', 'en', 'ang', 'eng', 'ong'])
      + vtab('VẬN MẪU CÓ I', ['ia', 'ie', 'iu<br>(= iou)', 'iao', 'ian', 'iang', 'in', 'ing', 'iong']) + vtab('VẬN MẪU CÓ U', ['ua', 'uo', 'uai', 'ui<br>(=uei)', 'uan', 'un<br>(=uen)', 'uang', 'ueng<br>(hiếm)']) + vtab('VẬN MẪU CÓ Ü', ['üe', 'üan', 'ün'])
      + `<div data-mv="pill-td">${pill('GIỚI THIỆU VỀ THANH ĐIỆU')}</div>` + `<table data-mv="tab-td" style="border-collapse:collapse;width:100%;font-size:10px;table-layout:fixed"><tr>${['THANH ĐIỆU', 'THANH 1', 'THANH 2', 'THANH 3', 'THANH 4'].map(t => td(t, `background:${O};color:#fff;font-weight:700`)).join('')}</tr><tr>${td('KÝ HIỆU', `background:${O};color:#fff;font-weight:700`)}${['ˉ', 'ˊ', 'ˇ', 'ˋ'].map(t => td(t, `color:${R};font-weight:700;font-size:24px;line-height:1;padding:10px 6px 2px;vertical-align:middle`)).join('')}</tr></table>`;
    return [p1, p2, p3]; })();
  function dnPrimerPages(opt, E, size) {
    return DN_PRIMER.map((html, k) => { const n = opt.n + k, r = E.render({ comp: size.page(n), data: { running: '', page_no: n % 2 === 0 ? '' : String(n), page_no_l: n % 2 === 0 ? String(n) : '' } }, opt.brand);
      opt.stage.appendChild(r.host); r.host.classList.add('pls-book-page'); r.host.style.setProperty('--book-font', bookFont(opt.brand)); pageFrame(r.host, opt.size);
      const content = r.host.querySelector('[data-n="content"]'); [...content.children].forEach(c => c.remove());
      const box = document.createElement('div'); box.style.cssText = "display:flex;flex-direction:column;width:100%;align-self:stretch;box-sizing:border-box;font-family:'Times New Roman','Tinos',serif;color:#1a1a1a;padding-top:4px"; box.innerHTML = html; content.appendChild(box);
      // VỊ TRÍ ĐÃ KÉO (người dùng 4/11): opt.pos = { 'p1|box': { x, y } } – dịch bằng translate, không đổi bố cục các phần khác
      box.querySelectorAll('[data-mv]').forEach(e => { e.dataset.mvk = 'p' + (k + 1) + '|' + e.dataset.mv; const v = (opt.pos || {})[e.dataset.mvk]; if (v) e.style.translate = `${v.x || 0}px ${v.y || 0}px`;
        if (v && (v.fz || v.b || v.i || v.u)) bookSty(e, { fz: v.fz, b: v.b, i: v.i, u: v.u }, box); });   // CỠ CHỮ / ĐẬM / NGHIÊNG / GẠCH (người dùng 5/11) – lưu chung với vị trí kéo
      // phần to ra trong vùng sơ đồ (đặt cố định, cao cố định) → vùng cao thêm cho vừa, phần bên dưới tự dịch xuống – không đè
      if ([...box.querySelectorAll('[data-mv]')].some(e => { const v = (opt.pos || {})[e.dataset.mvk]; return v && v.fz > 1; })) box.querySelectorAll('div').forEach(ct => { if (ct.style.position !== 'relative' || !/px$/.test(ct.style.height)) return;
        const t0 = ct.getBoundingClientRect().top, mb = Math.max(0, ...[...ct.children].map(ch => ch.getBoundingClientRect().bottom - t0)); if (mb > parseFloat(ct.style.height) + 1) ct.style.height = Math.ceil(mb + 4) + 'px'; });
      return { host: r.host, kind: 'primer', n }; }); }
  function dnIntroCss() { if (document.getElementById('dniCss')) return; const st = document.createElement('style'); st.id = 'dniCss';
    st.textContent = `.dni{display:flex;flex-direction:column;font-family:'Times New Roman','Tinos',serif;font-size:10.5px;line-height:1.38;color:#111;padding-top:4px}.dni p{margin:0 0 6px}.dni .dni-ind{text-indent:2.2em}
    .dni-title{text-align:center;color:#E07B39;font-weight:700;font-size:26px;margin-bottom:8px}.dni-h{color:#E07B39;font-weight:700;font-size:12px;margin:10px 0 6px}.dni-h2{color:#E07B39;font-weight:700;font-size:11px;margin:6px 0 3px}
    .dni ul{margin:0 0 6px;padding-left:2.4em}.dni ul.dni-dot{padding-left:2.2em;list-style:none}.dni ul.dni-dot li{text-indent:-1em}.dni ul.dni-dot li::before{content:'●';display:inline-block;width:1em;text-indent:0}.dni li{margin:0 0 1px}`; document.head.appendChild(st); }
  // dựng 2 trang (tự chia theo chỗ trống) – mỗi khối không bị cắt đôi
  // LỜI MỞ ĐẦU HSK2 trở lên: giữ khung giáo trình, đổi đoạn dành cho người mới bắt đầu + trụ cột 1 (Pinyin) sang củng cố nền tảng cấp trước
  function introFor(lv) { if (!lv || lv === 1) return DN_INTRO; const p = 'HSK ' + (lv - 1), L = 'HSK ' + lv;
    return DN_INTRO.map(h => h.split('HSK 1').join(L)
      .replace(/Giáo trình này được thiết kế dành cho những học viên mới bắt đầu, giúp xây dựng nền tảng tiếng Trung vững chắc từ những bước đầu tiên: nắm chuẩn <b[^>]*>Pinyin<\/b>, ghi nhớ/, `Giáo trình này được thiết kế dành cho những học viên đã hoàn thành ${p}, giúp mở rộng và nâng cao tiếng Trung một cách vững chắc: củng cố nền tảng ${p}, ghi nhớ`)
      .replace(/1\. Chinh phục Pinyin<\/div>[\s\S]*?<\/ul>/, `1. Củng cố nền tảng ${p}</div><ul><li>Ôn tập chắc Pinyin, từ vựng và mẫu câu ${p} ngay những buổi đầu.</li><li>Lấp chỗ hổng kiến thức trước khi bước vào nội dung ${L}.</li><li>Tạo nền tảng vững để tiếp thu từ vựng, ngữ pháp mới hiệu quả.</li></ul>`)
      .replace('Luyện nghe – nói phản xạ nhanh với Pinyin', 'Luyện nghe – nói phản xạ nhanh')); }
  function dnIntroPages(opt, E, size) {
    const DN_INTRO = introFor(opt.lv);
    dnIntroCss(); const out = []; let i = 0;
    while (i < DN_INTRO.length && out.length < 3) {
      const n = opt.n + out.length, r = E.render({ comp: size.page(n), data: { running: '', page_no: '', page_no_l: '' } }, opt.brand);
      opt.stage.appendChild(r.host); r.host.classList.add('pls-book-page'); r.host.style.setProperty('--book-font', bookFont(opt.brand)); pageFrame(r.host, opt.size);
      r.host.querySelectorAll('[data-n="running"], [data-n="page_no"], [data-n="page_no_l"]').forEach(e => { e.style.visibility = 'hidden'; });
      const content = r.host.querySelector('[data-n="content"]'); [...content.children].forEach(c => c.remove());
      const box = document.createElement('div'); box.className = 'dni'; content.appendChild(box); const lim = content.getBoundingClientRect().bottom;
      for (; i < DN_INTRO.length; i++) { const w = document.createElement('div'); w.innerHTML = DN_INTRO[i]; w.dataset.ik = 'i' + i; box.appendChild(w);
        { const st = ((opt.txt || {})._sty || {})['i' + i]; if (st) bookSty(w, st, box); }   // CỠ CHỮ TỪNG ĐOẠN (người dùng 5/11) – áp trước khi đo → to ra tự sang trang sau
        if (w.getBoundingClientRect().bottom > lim + 0.5 && box.children.length > 1) { w.remove(); break; } }
      out.push({ host: r.host, kind: 'intro', n });
    }
    return out;
  }
  function fitLetter(host) {
    const content = host.querySelector('[data-n="content"]'), box = host.querySelector('.bk-letter'), body = box && box.querySelector('.bk-body'); if (!content || !body) return;
    ['justifyContent', 'paddingBottom', 'paddingTop'].forEach(k => { box.style[k] = ''; }); body.style.fontSize = ''; body.style.lineHeight = '';   // làm lại từ đầu (sửa tay ngắn đi thì to lại)
    const f = +body.dataset.fz || 1; if (f !== 1) body.style.fontSize = Math.round(parseFloat(getComputedStyle(body).fontSize) * f * 10) / 10 + 'px';   // người dùng chỉnh cỡ (5/11): thang co chữ nhân theo
    const over = () => content.scrollHeight > content.clientHeight + 1 || box.scrollHeight > box.clientHeight + 1;
    if (!over()) return; box.style.justifyContent = 'flex-start'; box.style.paddingBottom = '0'; box.style.paddingTop = '8px';
    for (const [fs, lh] of [[10.5, 1.75], [10, 1.7], [9.5, 1.65], [9, 1.6], [8.5, 1.55], [8, 1.5], [7.5, 1.45]]) { if (!over()) break; body.style.fontSize = Math.round(fs * f * 10) / 10 + 'px'; body.style.lineHeight = String(lh); }
  }
  // MỤC LỤC (người dùng 29/10 – sách cả khoá): trang nội dung thường (chữ chạy + số trang) với danh sách "Bài n – tên bài …… trang"
  function tocPage(opt) {
    const E = root.PLS_ENGINE, size = SIZES[opt.size] || SIZES.A4, n = opt.n;
    bookCss();
    const r = E.render({ comp: size.page(n), data: { running: opt.running || '', page_no: n % 2 === 0 ? '' : String(n), page_no_l: n % 2 === 0 ? String(n) : '' } }, opt.brand);
    opt.stage.appendChild(r.host); r.host.classList.add('pls-book-page'); r.host.style.setProperty('--book-font', bookFont(opt.brand)); pageFrame(r.host, opt.size);
    const content = r.host.querySelector('[data-n="content"]'); [...content.children].forEach(c => c.remove());
    const dn = opt.brand === 'Đắc Nhân', box = document.createElement('div'); box.className = 'bk-toc'; box.style.cssText = 'display:flex;flex-direction:column;gap:6px;padding:14px 6px 0;flex:1 1 auto;align-self:stretch;width:100%;box-sizing:border-box';   /* rộng hết trang ở mọi trang mục lục (trang 2 không có tiêu đề → bị co) */
    if (opt.head) { const h = document.createElement('div'); h.textContent = 'MỤC LỤC'; h.style.cssText = `text-align:center;font-weight:800;font-size:20px;letter-spacing:.04em;margin-bottom:14px;color:${dn ? 'var(--color-primary, #e65100)' : 'var(--color-primary-dark, #142738)'}`; box.appendChild(h); }
    for (const e of opt.entries) { const row = document.createElement('div'); row.style.cssText = 'display:flex;align-items:baseline;gap:6px;font-size:11px;line-height:1.35';
      const a = document.createElement('span'); a.style.cssText = `font-weight:700;color:${dn ? 'var(--color-primary-dark, #b33e00)' : 'var(--color-primary, #406864)'};flex:0 0 auto`; a.textContent = e.label;
      const t = document.createElement('span'); t.style.cssText = 'flex:0 1 auto;min-width:0;color:#262626;opacity:1;font-weight:500'; t.textContent = e.title;   /* màu đậm cố định: máy khác không bị mờ (người dùng 29/10) */
      const d = document.createElement('span'); d.style.cssText = 'flex:1 1 auto;border-bottom:1px dotted #6f6f6f;transform:translateY(-3px);min-width:20px';
      const pn = document.createElement('span'); pn.style.cssText = 'flex:0 0 auto;font-weight:700;color:#262626;opacity:1'; pn.textContent = String(e.page);
      row.append(a, t, d, pn); box.appendChild(row); }
    content.appendChild(box);
    return { host: r.host, kind: 'toc', n };
  }
  // ---------- in PDF ----------
  function print(size) {
    const s = SIZES[size] || SIZES.A4; let st = document.getElementById('bookPrintCss');
    if (!st) { st = document.createElement('style'); st.id = 'bookPrintCss'; document.head.appendChild(st); }
    st.textContent = `@page{size:${s.mm[0]}mm ${s.mm[1]}mm;margin:0}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}`;   // in giữ màu nền (đầu bảng cam…) dù chưa tick "Đồ hoạ nền" (người dùng 29/10: tải PDF bị mất màu)
    window.print();
  }
  // KHUNG TRANG THEO SỐ TRANG MỚI (4/11 – xếp trang có nhớ): nội dung đã xếp giữ nguyên, chỉ đổi khung chẵn / lẻ (số trang trái / phải) khi trang dời 1 số
  function reframe(pages, opt) { const E = root.PLS_ENGINE, size = SIZES[opt.size] || SIZES.A4;
    pages.forEach((pg, k) => { const n = (opt.first || 1) + k, comp = size.page(n);
      const setNo = h => { const a = h.querySelector('[data-n="page_no"]'), b = h.querySelector('[data-n="page_no_l"]'); if (a) a.textContent = n % 2 === 0 ? '' : String(n); if (b) b.textContent = n % 2 === 0 ? String(n) : ''; };   // ghi thẳng: mẫu để trống còn chữ mẫu '1'
      if (pg.comp === comp) { pg.n = n; setNo(pg.host); return; }
      const r = E.render({ comp, data: { running: opt.running || '', page_no: n % 2 === 0 ? '' : String(n), page_no_l: n % 2 === 0 ? String(n) : '' } }, opt.brand);
      opt.stage.appendChild(r.host); r.host.classList.add('pls-book-page'); r.host.style.setProperty('--book-font', bookFont(opt.brand)); pageFrame(r.host, opt.size);
      const ct = r.host.querySelector('[data-n="content"]'); [...ct.children].forEach(c => c.remove()); ct.style.gap = '0px'; ct.style.rowGap = '0px';
      setNo(r.host); while (pg.content.firstChild) ct.appendChild(pg.content.firstChild); pg.host.remove(); Object.assign(pg, { host: r.host, content: ct, n, comp }); }); }
  root.PLS_BOOK = { bookSty, colOrder, colLayout, subSig, reframe, objSplit, fitCover, dnPrimerPages: (opt) => dnPrimerPages(opt, root.PLS_ENGINE, SIZES[opt.size] || SIZES.A4), blocks, paginate, print, SIZES, bookFamilies, bookFont, meta, extraPage, letterDefaults, tocPage, fitLetter };
})(typeof window !== 'undefined' ? window : globalThis);
