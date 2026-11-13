/* PureGold Web Push (iOS 16.4+ installed PWA, and other browsers with PushManager). */
(function () {
  const PUB_URL = "assets/vapid-public.json";
  const COLLECTOR = window.__PG_PUSH_COLLECTOR || "";

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }
  function isStandalone() {
    try {
      return (window.navigator && window.navigator.standalone === true)
        || (window.matchMedia && (window.matchMedia("(display-mode: standalone)").matches
          || window.matchMedia("(display-mode: fullscreen)").matches));
    } catch (e) { return false; }
  }
  function isIOS() {
    const ua = navigator.userAgent || "";
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }
  function langIsEn() {
    return typeof LANG !== "undefined" && LANG === "en";
  }
  function setHint(text, ok) {
    document.querySelectorAll("[data-push-hint]").forEach((el) => {
      el.textContent = text;
      el.dataset.state = ok ? "ok" : "info";
    });
    document.querySelectorAll("[data-push-btn]").forEach((el) => {
      if (ok) el.setAttribute("aria-pressed", "true");
    });
  }
  function paintIdle() {
    const en = langIsEn();
    const iOS = isIOS();
    const stand = isStandalone();
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || typeof Notification === "undefined") {
      setHint(en
        ? "This browser cannot receive web-app notifications."
        : "เบราว์เซอร์นี้ยังไม่รองรับการแจ้งเตือนของเว็บแอป", false);
      return;
    }
    if (iOS && !stand) {
      setHint(en
        ? "On iPhone, install this page as a web app first (Safari → Share → Add to Home Screen), then open the Home Screen icon and tap Enable notifications. Requires iOS 16.4 or later."
        : "บน iPhone ให้ติดตั้งเป็นเว็บแอปก่อน (Safari → แชร์ → เพิ่มไปยังหน้าจอโฮม) แล้วเปิดจากไอคอนบนหน้าจอโฮม จึงกดเปิดการแจ้งเตือนได้ ต้องใช้ iOS 16.4 ขึ้นไป", false);
      return;
    }
    if (Notification.permission === "granted" && localStorage.getItem("pg_push_sub")) {
      const stored = localStorage.getItem("pg_push_pending");
      setHint(stored
        ? (en
          ? "Notifications are allowed on this device, but a public HTTPS collector is still needed before the desk can deliver them."
          : "อนุญาตการแจ้งเตือนบนเครื่องนี้แล้ว แต่ยังต้องมีตัวรับ HTTPS สาธารณะก่อนที่โต๊ะจะส่งถึงเครื่องได้")
        : (en ? "Notifications are on for this device." : "เปิดการแจ้งเตือนบนเครื่องนี้แล้ว"), !stored);
      return;
    }
    setHint(en
      ? "Enable notifications for plan updates (TP, stop, news window, cancelled plans). Education only — not investment advice."
      : "เปิดการแจ้งเตือนเมื่อแผนเปลี่ยนสถานะ (เป้า, จุดตัดขาดทุน, ช่วงข่าว, แผนถูกยกเลิก) เพื่อการศึกษา ไม่ใช่คำแนะนำการลงทุน", false);
  }
  async function loadPublicKey() {
    if (window.__PG_VAPID_PUBLIC) return window.__PG_VAPID_PUBLIC;
    const r = await fetch(PUB_URL, { cache: "no-store" });
    if (!r.ok) throw new Error("vapid");
    const j = await r.json();
    window.__PG_VAPID_PUBLIC = j.publicKey || j.public_key;
    return window.__PG_VAPID_PUBLIC;
  }
  async function enable() {
    const en = langIsEn();
    if (isIOS() && !isStandalone()) {
      paintIdle();
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      paintIdle();
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setHint(en ? "Notifications were not allowed." : "ยังไม่ได้อนุญาตการแจ้งเตือน", false);
        return;
      }
      const pub = await loadPublicKey();
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(pub)
        });
      }
      const json = sub.toJSON();
      try { localStorage.setItem("pg_push_sub", JSON.stringify(json)); } catch (e) {}
      if (COLLECTOR) {
        const r = await fetch(COLLECTOR, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ subscription: json, tz: "Asia/Bangkok", ua: navigator.userAgent, at: new Date().toISOString() })
        });
        if (!r.ok) throw new Error("collector " + r.status);
        try { localStorage.removeItem("pg_push_pending"); } catch (e) {}
        setHint(en ? "Notifications are on for this device." : "เปิดการแจ้งเตือนบนเครื่องนี้แล้ว", true);
        return;
      }
      try { localStorage.setItem("pg_push_pending", "1"); } catch (e) {}
      setHint(en
        ? "This device allowed notifications, but the public landing page cannot store subscriptions. A public HTTPS collector is still required before the desk can deliver pushes here."
        : "เครื่องนี้อนุญาตการแจ้งเตือนแล้ว แต่หน้าเว็บสาธารณะเก็บรายการสมัครไม่ได้ ยังต้องมีตัวรับ HTTPS สาธารณะก่อนที่โต๊ะจะส่งการแจ้งเตือนถึงเครื่องนี้ได้", false);
    } catch (err) {
      setHint(en
        ? "Could not enable notifications. On iPhone, use the installed Home Screen app on iOS 16.4 or later."
        : "เปิดการแจ้งเตือนไม่สำเร็จ บน iPhone ต้องเปิดจากไอคอนหน้าจอโฮม และใช้ iOS 16.4 ขึ้นไป", false);
    }
  }
  function bind() {
    document.querySelectorAll("[data-push-btn]").forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", (ev) => { ev.preventDefault(); enable(); });
    });
    paintIdle();
    window.__pgAfterLang = window.__pgAfterLang || [];
    window.__pgAfterLang.push(paintIdle);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})();
