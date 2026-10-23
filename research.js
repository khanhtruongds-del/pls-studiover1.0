// TAB NGHIÊN CỨU (người dùng chốt 23/10): chỗ để nghiên cứu tài liệu các trung tâm khác → định hướng nội dung → soạn bài,
// soạn xong xuất Excel S5/S6 để tab Slide / Sách dựng tiếp. Hiện là TRANG GIỚI THIỆU + KHUNG GIAO DIỆN (đang xây dựng) – chưa có dữ liệu, chưa gọi AI.
// Bố cục 3 cột theo đặc tả AI Workspace: Nguồn & học liệu · Không gian làm việc · Quy trình.
(function (root) {
  const $ = q => document.querySelector(q);
  const STEPS = [
    { id: 'src', name: 'Nguồn', sub: 'Gom & so sánh',
      title: 'Nguồn tham khảo',
      lead: 'Nạp tài liệu của các trung tâm khác rồi so sánh theo cùng một khung.',
      todo: ['Nạp PDF, ảnh chụp giáo trình, link trang khóa học, ghi rõ của ai, lấy ngày nào',
        'AI trích theo khung: cấp độ, số buổi, số phút, giáo trình, phương pháp, cách kiểm tra, học phí',
        'Mỗi ô có trích dẫn trang/đoạn gốc; không có trong nguồn thì ghi "chưa rõ"',
        'Bảng so sánh giữa các trung tâm + hỏi đáp chỉ dựa trên nguồn đã nạp'],
      out: 'Kết quả: bảng so sánh có trích dẫn' },
    { id: 'dir', name: 'Định hướng', sub: 'Khung khóa học',
      title: 'Định hướng nội dung',
      lead: 'Từ bảng so sánh, đề xuất khung khóa học để bạn sửa và chốt.',
      todo: ['Cấp độ, số buổi, mục tiêu từng buổi, chủ đề, từ vựng & ngữ pháp trọng tâm',
        'Mỗi đề xuất ghi căn cứ (dữ kiện từ nguồn) hay là suy luận',
        'Chốt thành phiên bản; sửa mục tiêu thì các buổi liên quan bị đánh dấu "cần xem lại"'],
      out: 'Kết quả: khung khóa học đã chốt' },
    { id: 'les', name: 'Soạn bài', sub: 'Ra Excel S5/S6',
      title: 'Soạn bài',
      lead: 'Soạn từng buổi theo khung đã chốt, soát rồi xuất Excel S5/S6.',
      todo: ['Từ vựng, ngữ pháp, hội thoại, bài tập kèm đáp án và giải thích',
        'Soát: đáp án đúng chưa, độ khó hợp cấp độ chưa, bài tập có khớp mục tiêu không',
        'Xuất Excel S5/S6 → mở ở tab Slide / Sách để ra slide, sách, ghi chú, hiệu ứng'],
      out: 'Kết quả: file Excel S5 + S6 của từng buổi' }
  ];
  let cur = 0, mode = 'intro';   // intro = trang giới thiệu (mặc định) · work = khung 3 cột (bản xem trước)
  const SVG = { src: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2"><rect x="16" y="22" width="50" height="66" rx="3"/><rect x="40" y="34" width="50" height="66" rx="3" fill="currentColor" fill-opacity=".12"/><circle cx="88" cy="88" r="14"/><path d="M98 98l12 12" stroke-width="3"/></svg>',
    dir: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2"><circle cx="60" cy="60" r="42"/><path d="M60 18v10M60 92v10M18 60h10M92 60h10"/><path d="M74 46L54 54 46 74l20-8z" fill="currentColor" fill-opacity=".2"/></svg>',
    les: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2"><rect x="18" y="20" width="66" height="84" rx="3"/><path d="M30 40h42M30 52h42M30 64h28"/><path d="M70 96l30-30 10 10-30 30H70z" fill="currentColor" fill-opacity=".15"/></svg>' };
  function intro(box) {
    box.className = 'rs-intro';
    box.innerHTML = `<section class="w-hero"><div><p class="hi">Nghiên cứu <span class="rs-badge">Sắp có · chưa dùng được</span></p><h1>Nghiên cứu, định hướng rồi soạn bài – trên cùng một chỗ</h1>
        <div class="acts"><button type="button" class="btn primary" id="rsOpen">Xem trước không gian làm việc</button><span class="muted">Bản xem trước bố cục, chưa nạp tài liệu được</span></div></div>
      <div class="w-cards">${STEPS.map((x, i) => `<div class="w-card c${i + 1}"><span class="n">0${i + 1}</span><b>${esc(x.title)}</b><p>${esc(x.lead)}</p>${SVG[x.id]}</div>`).join('')}</div></section>
      <div class="w-low"><section><p class="muted" style="margin:0 0 2px;font-size:12px">Nghiên cứu làm được gì</p><h2>Từ tài liệu tham khảo tới Excel S5/S6</h2><p class="sub">Soạn xong ra đúng file Excel S5/S6 – tab Slide và Sách dựng tiếp như hiện tại.</p>
        <ol class="w-steps">
          <li><span class="ic">⇪</span><b>Gom nguồn</b><span>PDF, ảnh giáo trình, link khóa học của trung tâm khác – ghi rõ của ai, lấy ngày nào</span></li>
          <li><span class="ic">▦</span><b>So sánh theo khung</b><span>Cấp độ, số buổi, giáo trình, phương pháp, cách kiểm tra – mỗi ô có trích dẫn gốc</span></li>
          <li><span class="ic">?</span><b>Hỏi đáp theo nguồn</b><span>Chỉ trả lời từ tài liệu đã nạp; không có thì nói "chưa rõ", không đoán</span></li>
          <li><span class="ic">◎</span><b>Định hướng khung khóa</b><span>Mục tiêu, chủ đề, từ vựng – ngữ pháp từng buổi; ghi rõ căn cứ hay suy luận</span></li>
          <li class="dark"><span class="ic">✎</span><b>Soạn bài & soát</b><span>Từ vựng, ngữ pháp, hội thoại, bài tập + đáp án; soát độ khó, đáp án, khớp mục tiêu</span></li>
          <li class="dark"><span class="ic">⤓</span><b>Xuất Excel S5/S6</b><span>Mở ở tab Slide / Sách để ra slide, sách, ghi chú, hiệu ứng</span></li>
        </ol></section>
        <section class="w-side"><p class="muted" style="margin:0 0 2px;font-size:12px">Tình trạng</p><h2>Đang xây dựng</h2><p class="sub">Phần này mới có bố cục. Để chạy thật cần:</p>
          <div class="item"><b>Mẫu Excel S5 + S6</b><span class="muted">Để phần Soạn bài xuất đúng cột, đúng sheet</span></div>
          <div class="item"><b>2–3 tài liệu thật của trung tâm khác</b><span class="muted">Để dựng khung so sánh trên dữ liệu thật</span></div>
          <div class="item"><b>Chỗ gọi AI</b><span class="muted">Trang tĩnh hiện tại chưa gọi AI được – cần chốt cách kết nối</span></div></section></div>`;
    box.querySelector('#rsOpen').onclick = () => { mode = 'work'; render(); };
  }
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function render() {
    const box = $('#researchView'); if (!box) return;
    if (mode === 'intro') return intro(box);
    box.className = 'rs-work';
    const s = STEPS[cur];
    box.innerHTML = `
      <section class="rs-col" aria-label="Nguồn và học liệu">
        <h3>Nguồn &amp; học liệu</h3>
        <ul class="rs-tree">
          <li><b>Tài liệu nguồn</b><span>0</span></li>
          <li><b>Trung tâm so sánh</b><span>0</span></li>
          <li><b>Khung khóa học</b><span>–</span></li>
          <li><b>Các buổi đã soạn</b><span>0</span></li>
          <li><b>Lịch sử</b><span>–</span></li>
        </ul>
      </section>
      <section class="rs-col rs-body" aria-label="Không gian làm việc">
        <h3>Không gian làm việc<span class="rs-badge">Bản xem trước</span><button type="button" class="rs-back" id="rsBack">← Giới thiệu</button></h3>
        <div class="rs-steps" role="tablist" aria-label="Các bước">${STEPS.map((x, i) =>
          `<button type="button" role="tab" data-i="${i}" aria-selected="${i === cur}">${i + 1}. ${esc(x.name)}<small>${esc(x.sub)}</small></button>`).join('')}</div>
        <h2>${esc(s.title)}</h2>
        <p>${esc(s.lead)}</p>
        <ul>${s.todo.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
        <div class="rs-out">${esc(s.out)}</div>
      </section>
      <section class="rs-col" aria-label="Quy trình">
        <h3>Quy trình</h3>
        <ol class="rs-flow">${STEPS.map((x, i) =>
          `<li class="${i === cur ? 'on' : ''}"><span class="dot">○</span><span>${i + 1}. ${esc(x.name)}</span><span class="st">Chưa bắt đầu</span></li>`).join('')}
          <li><span class="dot">○</span><span>4. Slide &amp; Sách</span><span class="st">Tab bên cạnh</span></li>
        </ol>
        <p class="rs-note">Bản demo chạy ngay trên trình duyệt, không cần đăng nhập. Cần mẫu Excel S5/S6 và vài tài liệu thật của trung tâm khác để làm tiếp.</p>
      </section>`;
    box.querySelector('#rsBack').onclick = () => { mode = 'intro'; render(); };
    box.querySelectorAll('.rs-steps button').forEach(b => b.onclick = () => { cur = +b.dataset.i; render(); box.querySelector(`.rs-steps button[data-i="${cur}"]`).focus(); });
  }
  root.PLS_RESEARCH = { show: render, steps: STEPS, mode: m => { if (m) { mode = m; render(); } return mode; } };
})(typeof window !== 'undefined' ? window : globalThis);
