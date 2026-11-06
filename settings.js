// CÀI ĐẶT RIÊNG TRÊN MÁY (bản web công khai không chứa key): key Drive + link nhật ký lưu trong trình duyệt này.
// Nạp TRƯỚC images.js/log.js: ghép cài đặt đã lưu vào PLS_CONFIG; nút ⚙ trên thanh đầu để nhập / xoá.
(function (root) {
  const LS = 'pls.config';
  let saved = {}; try { saved = JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) {}
  const C = root.PLS_CONFIG = root.PLS_CONFIG || {};
  for (const k of ['driveKey', 'logUrl']) if (!C[k] && saved[k]) C[k] = saved[k];
  root.PLS_SETTINGS = { has: () => !!C.driveKey };
  document.addEventListener('DOMContentLoaded', () => {
    const host = document.querySelector('header .actions') || document.querySelector('header'); if (!host || C.driveKey) return;   // đã có key sẵn → không hiện nút
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.id = 'settingsBtn'; b.title = 'Cài đặt: key Drive, link nhật ký';
    b.setAttribute('aria-label', 'Cài đặt'); b.textContent = C.driveKey ? '⚙' : '⚙ Nhập key Drive'; b.style.whiteSpace = 'nowrap';
    const pop = document.createElement('div'); pop.hidden = true; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Cài đặt');
    pop.style.cssText = 'position:fixed;top:64px;right:16px;z-index:1001;width:min(380px,calc(100vw - 32px));background:var(--bg,#fff);color:inherit;border:1px solid var(--line,#ddd);border-radius:12px;padding:14px;box-shadow:0 8px 24px rgba(0,0,0,.15)';
    pop.innerHTML = `<p style="margin:0 0 8px;font-weight:600">Cài đặt trên máy này</p>
      <label style="display:block;font-size:13px;margin-bottom:4px" for="cfgKey">Key Drive (đọc ảnh trong kho)</label>
      <input id="cfgKey" type="password" autocomplete="off" style="width:100%;box-sizing:border-box" placeholder="${C.driveKey ? 'đã có – để trống nếu giữ nguyên' : 'dán key vào đây'}">
      <label style="display:block;font-size:13px;margin:10px 0 4px" for="cfgLog">Link nhật ký (Apps Script, không bắt buộc)</label>
      <input id="cfgLog" type="url" autocomplete="off" style="width:100%;box-sizing:border-box" placeholder="${C.logUrl ? 'đã có' : 'https://script.google.com/…/exec'}">
      <p style="font-size:12px;opacity:.75;margin:8px 0">Chỉ lưu trong trình duyệt này, không gửi đi đâu ngoài Google Drive.</p>
      <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" id="cfgClear">Xoá</button><button type="button" class="primary" id="cfgSave">Lưu và tải lại</button></div>`;
    document.body.appendChild(pop); host.appendChild(b);
    b.onclick = () => { pop.hidden = !pop.hidden; if (!pop.hidden) pop.querySelector('#cfgKey').focus(); };
    const put = o => { try { localStorage.setItem(LS, JSON.stringify(o)); } catch (e) { alert('Trình duyệt chặn lưu cài đặt'); } location.reload(); };
    pop.querySelector('#cfgSave').onclick = () => { const k = pop.querySelector('#cfgKey').value.trim(), l = pop.querySelector('#cfgLog').value.trim(); put(Object.assign({}, saved, k ? { driveKey: k } : {}, l ? { logUrl: l } : {})); };
    pop.querySelector('#cfgClear').onclick = () => put({});
  });
})(typeof window !== 'undefined' ? window : globalThis);
