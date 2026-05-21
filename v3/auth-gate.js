/* Simple client-side password gate for stakeholder preview.
   NOTE: client-side only — obfuscation, not real auth. Suitable for
   preventing casual access to the GitHub Pages URL. */
(function() {
  const PASS = "DTO";
  const KEY = "primax-ai-cases-auth-v2";
  if (sessionStorage.getItem(KEY) === "ok") return;

  document.documentElement.style.overflow = "hidden";

  const overlay = document.createElement("div");
  overlay.id = "auth-gate";
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    background: linear-gradient(135deg, #0D3338 0%, #008C9A 100%);
    display: flex; align-items: center; justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif;
  `;
  overlay.innerHTML = `
    <div style="background:white;color:#1F2D33;padding:36px 44px;border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,0.3);text-align:center;max-width:380px;width:90%">
      <div style="font-size:48px;margin-bottom:8px">🔒</div>
      <h2 style="margin:0 0 6px;font-size:20px;font-weight:700">Primax AI 案例集</h2>
      <p style="margin:0 0 22px;font-size:13px;color:#4F6670;line-height:1.55">主管預覽通道。請輸入密碼。</p>
      <input type="password" id="auth-input" autocomplete="off" autofocus
             style="width:100%;padding:12px 16px;border:1px solid #C8D0D6;border-radius:8px;font-size:15px;font-family:inherit;box-sizing:border-box"
             placeholder="密碼" />
      <button id="auth-submit"
              style="margin-top:14px;padding:12px 32px;background:#008C9A;color:white;border:none;border-radius:999px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;width:100%">
        進入
      </button>
      <div id="auth-error" style="color:#D14545;font-size:12px;margin-top:10px;height:14px;font-weight:600"></div>
      <div style="font-size:11px;color:#8A9AA3;margin-top:12px;line-height:1.45">
        Internal Preview · 僅供集團主管預覽<br>請勿轉發此 URL 或截圖
      </div>
    </div>
  `;
  document.body ? document.body.appendChild(overlay) : document.addEventListener("DOMContentLoaded", () => document.body.appendChild(overlay));

  function tryAuth() {
    const inp = document.getElementById("auth-input");
    const err = document.getElementById("auth-error");
    if (!inp) return;
    if (inp.value === PASS) {
      sessionStorage.setItem(KEY, "ok");
      overlay.remove();
      document.documentElement.style.overflow = "";
    } else {
      err.textContent = "密碼錯誤，請再試一次";
      inp.value = "";
      inp.focus();
    }
  }

  function wire() {
    const btn = document.getElementById("auth-submit");
    const inp = document.getElementById("auth-input");
    if (btn) btn.addEventListener("click", tryAuth);
    if (inp) inp.addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); tryAuth(); }
    });
  }
  if (document.getElementById("auth-input")) wire();
  else document.addEventListener("DOMContentLoaded", wire);
})();
