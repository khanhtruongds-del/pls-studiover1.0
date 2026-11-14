// TỰ KIỂM DÀN TRANG SÁCH – chạy NGAY TRONG WEB sau mỗi lần dựng sách, với BẤT KỲ file Excel nào (người dùng 13/11:
// "bắt kĩ hơn chứ cứ có file đúng mới bắt thì không triệt để được" – trước đây luật chỉ chạy trên file mẫu ở tools/golden.js).
// PLS_BOOK_AUDIT(pages) → mảng câu báo lỗi (rỗng = đạt). tools/golden.js cũng gọi hàm này → luật dùng chung cho file mẫu và file thật.
// Mỗi lỗi người dùng báo về dàn trang → thêm 1 luật Ở ĐÂY (không phụ thuộc nội dung file).
(function (root) {
  const HEADS = /(Heading|Section Bar|Lesson Header)$/;
  const blk = e => (e.dataset.block || '').replace('Block/', '');
  root.PLS_BOOK_AUDIT = (pages) => { const SEC_T = {}; const out = [], P = (pages || []).map(pg => pg && pg.host ? pg.host : pg).filter(Boolean);
    const info = h => { const c = h.querySelector('[data-n="content"]'); if (!c || !h.dataset.buoi || !c.offsetHeight) return null; const kids = [...c.children].filter(e => e.offsetHeight && !e.dataset.lead); if (!kids.length) return null;
      const R = c.getBoundingClientRect(), k = R.height / c.offsetHeight || 1, H = c.clientHeight, used = (kids[kids.length - 1].getBoundingClientRect().bottom - R.top) / k; return { c, kids, k, H, used, free: H - used, cols2: !!c.dataset.cols2 }; };
    const no = (h, i) => { const a = h.querySelector('[data-n="page_no"]'), b = h.querySelector('[data-n="page_no_l"]'); return ((a && a.textContent.trim()) || (b && b.textContent.trim()) || '#' + (i + 1)); };
    P.forEach((h, i) => { const a = info(h); if (!a || a.cols2) return; const tag = 'trang ' + no(h, i), nx = P[i + 1] ? info(P[i + 1]) : null, last = a.kids[a.kids.length - 1], first = a.kids[0];
      // 1) nội dung tràn khỏi khung trang (bị cắt chân trang)
      if (a.c.scrollHeight > a.c.clientHeight + 1) out.push(`${tag}: nội dung tràn khung ${a.c.scrollHeight - a.c.clientHeight}px (bị cắt chân trang)`);
      // 2) tiêu đề / đầu bài đứng trơ cuối trang
      if (nx && HEADS.test(last.dataset.block || '') && !last.querySelector('[data-tail-note]'))   /* mục cuối đã thu gọn 1 dòng (kèm lời dặn) không tính */ out.push(`${tag}: tiêu đề đứng trơ cuối trang «${last.textContent.trim().slice(0, 30)}»`);
      // 3) trang gần trắng: chỉ có tiêu đề mục + ≤ 1 dòng (vd "Luyện kỹ năng đọc và nghe" một mình) mà còn trang sau
      if (nx && a.used < a.H * 0.15 && HEADS.test(first.dataset.block || '') && first.dataset.block !== 'Block/Lesson Header') out.push(`${tag}: trang gần trắng – chỉ có mục «${first.textContent.trim().slice(0, 30)}» (trống ${Math.round(a.free)}px)`);
      // 4) BÀI MỚI PHẢI SANG TRANG MỚI (người dùng chốt 13/11): ô đầu bài "BÀI n" luôn là khối đầu tiên của trang
      a.kids.forEach((e, q) => { if (q && e.dataset.block === 'Block/Lesson Header') out.push(`${tag}: bài mới «${e.textContent.trim().slice(0, 12)}» không bắt đầu ở đầu trang`); });
      // 5) trang giữa bài có bảng ≥ 8 dòng mà cuối trang còn trống > 100px (chưa co giãn)
      if (nx && P[i + 1].dataset.buoi === h.dataset.buoi) { const rows = [...a.c.querySelectorAll('[data-block="Block/Table N"] [data-n^="row_"]')].filter(r => /^row_[1-9]\d*$/.test(r.dataset.n) && r.offsetHeight).length; if (rows >= 8 && a.free > 100) out.push(`${tag}: cuối trang trống ${Math.round(a.free)}px mà chưa giãn (${rows} dòng bảng)`); }
      // 6) đáp án trắc nghiệm gõ chữ thường "a. … b. …" (chuẩn: A. B. C. D. viết hoa in đậm)
      a.c.querySelectorAll('[data-block="Block/Exercise"] [data-n$=".text"]').forEach(te => { const ls = te.innerText.split('\n').map(x => x.trim()).filter(Boolean); ls.forEach((l, q) => { if (/^a[.)]\s*\S.*\sb[.)]\s*\S/.test(l) && !/^1[.)]\s.*\s2[.)]\s/.test(ls[q - 1] || '')) out.push(`${tag}: đáp án trắc nghiệm chữ thường «${l.slice(0, 30)}»`); }); });
      // 7) cột Pinyin của bảng: mọi ô 12,6px (kể cả âm không dấu thanh "ba", "ma")
      a.c.querySelectorAll('[data-block="Block/Table N"]:not([data-dn-dlg])').forEach(t => { if (t.closest('[data-fz]') || t.dataset.fz) return; const h0 = t.querySelector('[data-n="row_0"]'); if (!h0) return;
        [...h0.children].forEach(hc => { if (!/^(pinyin|phiên âm)$/i.test(hc.textContent.trim())) return; const key = (hc.dataset.n || '').replace(/_cell$/, ''); if (!key) return; const bad = [];
          t.querySelectorAll(`[data-n^="row_"]:not([data-n="row_0"]) [data-n="${key}_cell"]`).forEach(c => { if (!c.offsetHeight) return; const tw = document.createTreeWalker(c, NodeFilter.SHOW_TEXT); while (tw.nextNode()) { const n = tw.currentNode, tx = n.nodeValue.trim(); if (!tx || /[㐀-鿿]/.test(tx)) continue; const fz = parseFloat(getComputedStyle(n.parentElement).fontSize); if (Math.abs(fz - 12.6) > 0.3) bad.push(`${tx.slice(0, 10)} (${fz})`); } });
          if (bad.length) out.push(`${tag}: cột Pinyin có ô khác cỡ 12,6 – ${bad.slice(0, 3).join(', ')}`); }); });
      // 8) bài Sắp xếp "A 是 / B 吗…": nhãn A–D in đậm, không thấp hơn chân chữ Hán
      a.c.querySelectorAll('[data-block="Block/Sentence Order"] [data-n$=".words"]').forEach(w => { const ls = [...w.querySelectorAll('[data-optl]')], gs = w.querySelectorAll('[data-hzpy]');
        if (gs.length >= 2 && /(^|\s)A\s/.test(w.textContent) && !ls.length) out.push(`${tag}: bài sắp xếp – nhãn A B C D chưa in đậm`);
        ls.forEach(l => { const g = l.nextElementSibling; if (!g || !g.dataset.hzpy || !g.firstElementChild) return; const d = l.getBoundingClientRect().bottom - g.firstElementChild.getBoundingClientRect().bottom; if (d > 3 * a.k) out.push(`${tag}: bài sắp xếp – nhãn ${l.textContent} thấp hơn chữ Hán`); }); });
      // 9) chữ Hán ngay sau dấu ":" phải cách ra ≥ 4px (người dùng 13/11: "tuổi tác:她…" sát quá)
      { let n9 = 0; a.c.querySelectorAll('[data-hz]').forEach(sp => { if (n9 || !sp.offsetWidth) return; let pv = sp.previousSibling; while (pv && pv.nodeType === 3 && !pv.nodeValue.trim()) pv = pv.previousSibling; if (!pv) return; const pt = pv.nodeType === 3 ? pv.nodeValue : pv.textContent; if (!/:\s*$/.test(pt || '')) return;
          const rg = document.createRange(); rg.selectNodeContents(pv); const rs = rg.getClientRects(), r0 = rs[rs.length - 1], r1 = sp.getClientRects()[0]; if (!r0 || !r1 || Math.abs(r1.bottom - r0.bottom) > 12 * a.k) return; const gap = (r1.left - r0.right) / a.k; if (gap < 4) { n9++; out.push(`${tag}: chữ Hán sát dấu ":" (${gap.toFixed(1)}px) «${(pt || '').trim().slice(-12)}${sp.textContent.slice(0, 3)}»`); } }); }
      // 10) tên bài ở ô đầu bài tối đa 3 dòng (người dùng 13/11: tên dài xuống 4 dòng → tự thu chữ)
      a.c.querySelectorAll('[data-block="Block/Lesson Header"] [data-n="title.vi"]').forEach(tv => { if (!tv.offsetHeight) return; const cs = getComputedStyle(tv), n = Math.round(tv.offsetHeight / (parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.25)); if (n > 3) out.push(`${tag}: tên bài ${n} dòng (tối đa 3) «${tv.textContent.trim().slice(0, 25)}»`); });
      // 11) số khoanh ①②… phải tự vẽ (data-cn) – không dùng nét chữ của font (từ 10 trở đi khác kiểu); không còn số trơ đứng chỗ số khoanh
      { const tw = document.createTreeWalker(a.c, NodeFilter.SHOW_TEXT); let bad = 0; while (tw.nextNode()) { const n = tw.currentNode; if (/[\u2460-\u2473\u3251-\u325F\u32B1-\u32BF]/.test(n.nodeValue) && !n.parentElement.dataset.cn && n.parentElement.getClientRects().length) bad++; } if (bad) out.push(`${tag}: ${bad} số khoanh chưa tự vẽ (dễ lệch kiểu từ số 10)`); }
      // 12) câu + dòng viết "➔ ……" không bị cắt rời qua trang: khối đầu trang không được mở bằng dòng "➔"
      { const f1 = a.kids[0], t1 = f1 && f1.firstElementChild && !f1.dataset.block ? null : (f1.querySelector('div') || f1); const tx = (f1.textContent || '').trim(); if (/^➔/.test(tx)) out.push(`${tag}: đầu trang mở bằng dòng viết "➔" – bị cắt rời khỏi câu hỏi ở trang trước`); }
      // 13) khung Cấu trúc: nhãn không được là mảnh vỡ của dòng chú thích trong ngoặc ("(A" + "động từ; B → …)")
      a.c.querySelectorAll('[data-block="Block/Structure"] [data-n="label"]').forEach(l => { const t = l.textContent.trim(); if (/^[(（]/.test(t) || (/[(（]/.test(t) && !/[)）]/.test(t))) out.push(`${tag}: nhãn Cấu trúc bị cắt từ dòng chú thích «${t.slice(0, 15)}»`); });
      // 14) ô đầu bài: dòng phụ (sau gạch nối) không được là mảnh vỡ của từ ghép ("…Đông – Tây" → "Tây"; "…mời - tặng quà khách")
      a.c.querySelectorAll('[data-block="Block/Lesson Header"] [data-n="title.native"]').forEach(tn => { const t = tn.textContent.trim(); if (!tn.offsetHeight || !t) return; if (!/[\s,;]/.test(t)) out.push(`${tag}: dòng phụ tên bài chỉ 1 từ «${t}» – tách nhầm ở gạch nối`); });
      // 15) tên bài không để 1 từ lẻ ở dòng cuối khi có ≥ 3 dòng
      a.c.querySelectorAll('[data-block="Block/Lesson Header"] [data-n="title.vi"]').forEach(tv => { if (!tv.offsetHeight || !tv.firstChild) return; const rg = document.createRange(); rg.selectNodeContents(tv); const rs = [...rg.getClientRects()].filter(r => r.width > 1); if (rs.length < 3) return; const last = rs[rs.length - 1], w = Math.max(...rs.map(r => r.width)); if (last.width < w * 0.3) out.push(`${tag}: tên bài rớt 1 chữ lẻ ở dòng cuối «${tv.textContent.trim().slice(-12)}»`); });
      // 16) nhãn "Định nghĩa", "Cách dùng"… trong phần ngữ pháp phải in đậm
      a.c.querySelectorAll('[data-block="Block/Paragraph"] [data-n="text"] > div').forEach(d => { const t = d.textContent.trim(); if (/^(định nghĩa|cách dùng)\s*:?$/i.test(t) && d.offsetHeight && parseFloat(getComputedStyle(d).fontWeight) < 600) out.push(`${tag}: nhãn «${t}» chưa in đậm`); });
      // 17) bảng luyện tập: viền các ô trong cùng bảng phải cùng màu, cùng độ dày (bảng Đúng–Sai cột hình viền nhạt hơn)
      a.c.querySelectorAll('[data-block="Block/Paragraph"] table').forEach(tb => { const set = new Set([...tb.querySelectorAll('td')].filter(c => c.offsetHeight).map(c => { const cs = getComputedStyle(c); return cs.borderTopColor + '|' + Math.round(parseFloat(cs.borderTopWidth) * 10); })); if (set.size > 1) out.push(`${tag}: bảng luyện tập có ${set.size} kiểu viền ô khác nhau`); });
      // 18) HỘI THOẠI trong sách không in cột Từ thay thế
      a.kids.forEach(e => { if (/Section Bar$/.test(e.dataset.block || '')) SEC_T[h.dataset.buoi] = e.textContent; if (e.dataset.dnDlg && /hội thoại/i.test(SEC_T[h.dataset.buoi] || '') && /^speak(5v|4)$/.test(e.dataset.role || '')) out.push(`${tag}: hội thoại còn cột Từ thay thế`); });
      // 19) cột vai hội thoại: không bẻ giữa chữ ("(fúwùyuá / n)") – từ Latin không được nằm trên 2 dòng
      a.c.querySelectorAll('[data-dn-dlg] [data-n="c1"]').forEach(c => { if (!c.offsetHeight) return; const tw = document.createTreeWalker(c, NodeFilter.SHOW_TEXT), rg = document.createRange(); let n; while ((n = tw.nextNode())) { for (const m of n.nodeValue.matchAll(/[^\s\u3400-\u9fff]{2,}/g)) { rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length); const rs = [...rg.getClientRects()].filter(r => r.width > 0.5); if (new Set(rs.map(r => Math.round(r.top))).size > 1) { out.push(`${tag}: tên vai bị bẻ giữa chữ «${m[0]}»`); return; } } } });
      // 20) đáp án trắc nghiệm xếp 1 cột trong khi mọi đáp án đều ngắn hơn nửa bề ngang → phải dàn 2 cột (A B / C D)
      a.c.querySelectorAll('[data-opt]').forEach(g => { if (!g.offsetHeight || g.children.length < 4 || !/repeat\(1,/.test(g.style.gridTemplateColumns)) return; const W = g.getBoundingClientRect().width; let mx = 0; [...g.children].forEach(o => { const rg = document.createRange(); rg.selectNodeContents(o); const rs = [...rg.getClientRects()].filter(r => r.width > 0.5); if (!rs.length) return; mx = Math.max(mx, Math.max(...rs.map(r => r.right)) - Math.min(...rs.map(r => r.left))); }); if (mx && mx < W / 2 - 14 * a.k) out.push(`${tag}: 4 đáp án xếp 1 cột dù vừa 2 cột «${g.textContent.trim().slice(0, 14)}»`); });
    });
    return out; };
})(typeof window !== 'undefined' ? window : globalThis);
