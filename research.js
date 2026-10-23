// TAB NGHIÊN CỨU (người dùng chốt 23/10): chỗ để nghiên cứu tài liệu các trung tâm khác → định hướng nội dung → soạn bài,
// soạn xong xuất Excel S5/S6 để tab Slide / Sách dựng tiếp. Hiện là KHUNG GIAO DIỆN (đang xây dựng) – chưa có dữ liệu, chưa gọi AI.
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
  let cur = 0;
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function render() {
    const box = $('#researchView'); if (!box) return;
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
        <h3>Không gian làm việc<span class="rs-badge">Đang xây dựng</span></h3>
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
    box.querySelectorAll('.rs-steps button').forEach(b => b.onclick = () => { cur = +b.dataset.i; render(); box.querySelector(`.rs-steps button[data-i="${cur}"]`).focus(); });
  }
  root.PLS_RESEARCH = { show: render, steps: STEPS };
})(typeof window !== 'undefined' ? window : globalThis);
