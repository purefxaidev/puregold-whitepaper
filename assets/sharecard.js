/* PUREGOLD share cards: branded 1200x675 + 1080x1350 PNGs with Save + Share. */
(function (global) {
  const SITE = "gold.purefxai.store";
  const SIZES = { landscape: [1200, 675], portrait: [1080, 1350] };
  const TH_M = "ม.ค. ก.พ. มี.ค. เม.ย. พ.ค. มิ.ย. ก.ค. ส.ค. ก.ย. ต.ค. พ.ย. ธ.ค.".split(" ");
  const EN_M = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
  const GOLD = "#f5c542";
  const MUTED = "#9aa3b5";
  const TX = "#eef1f7";
  const UP = "#22e39a";
  const DN = "#ff4d6d";

  const en = () => (global.LANG === "en" || (typeof global.EN === "function" && global.EN()));
  const fmt = (n, d) => n == null || isNaN(n) ? "—" : Number(n).toLocaleString("en-US", { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d });
  const chg = (n, d) => {
    if (n == null || isNaN(n)) return "—";
    const v = Number(n);
    const a = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d });
    if (Math.abs(v) < 5e-4) return "0.00";
    return (v > 0 ? "+" : "−") + a;
  };
  const isiOS = () => {
    const ua = navigator.userAgent || "";
    return /iP(ad|hone|od)/.test(ua) || ((navigator.platform === "MacIntel" || /Mac/.test(ua)) && navigator.maxTouchPoints > 1);
  };

  function nowBkk() {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  }
  function fmtBkk(date, lang) {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d)) return "—";
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d);
    const g = k => +parts.find(p => p.type === k).value;
    const day = g("day"), mo = g("month"), yr = g("year");
    const hh = String(g("hour")).padStart(2, "0"), mm = String(g("minute")).padStart(2, "0");
    if (lang === "en") return `${day} ${EN_M[mo - 1]} ${yr} ${hh}:${mm} (Bangkok time)`;
    return `${day} ${TH_M[mo - 1]} ${yr} ${hh}:${mm} น. (เวลาไทย)`;
  }
  function parseBkkStamp(s) {
    if (!s) return null;
    const m = String(s).match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
    if (m) return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00+07:00`);
    const t = Date.parse(s);
    return Number.isFinite(t) ? new Date(t) : null;
  }
  function forecastTarget(updated, horizonMin) {
    const src = parseBkkStamp(updated) || nowBkk();
    const mins = Number(horizonMin) > 0 ? Number(horizonMin) : 240;
    const from = new Date(src);
    const to = new Date(from.getTime() + mins * 60000);
    return { from, to, minutes: mins };
  }

  function rr(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, rad);
    else ctx.rect(x, y, w, h);
  }

  function drawMark(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 64, s / 64);
    ctx.fillStyle = "#120d02";
    ctx.beginPath(); ctx.arc(32, 32, 30, 0, Math.PI * 2); ctx.fill();
    const g = ctx.createLinearGradient(8, 8, 56, 56);
    g.addColorStop(0, "#fff4c2"); g.addColorStop(0.45, "#f5c542"); g.addColorStop(1, "#a8740a");
    ctx.strokeStyle = g; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(32, 32, 28.5, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "rgba(245,197,66,0.33)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(32, 32, 24, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(24, 47); ctx.lineTo(24, 17); ctx.lineTo(35.5, 17);
    ctx.bezierCurveTo(42.1, 17, 46, 20.6, 46, 26.4);
    ctx.bezierCurveTo(46, 32.2, 42.1, 36, 35.5, 36); ctx.lineTo(30.5, 36); ctx.lineTo(30.5, 47);
    ctx.closePath();
    ctx.moveTo(30.5, 30.6); ctx.lineTo(35.1, 30.6);
    ctx.bezierCurveTo(38.1, 30.6, 39.7, 29.1, 39.7, 26.4);
    ctx.bezierCurveTo(39.7, 23.7, 38.1, 22.3, 35.1, 22.3); ctx.lineTo(30.5, 22.3);
    ctx.closePath();
    ctx.fill("evenodd");
    ctx.restore();
  }

  function drawChrome(ctx, W, H, title, lang) {
    ctx.fillStyle = "#07080d";
    ctx.fillRect(0, 0, W, H);
    const wash = ctx.createLinearGradient(0, 0, W, H * 0.4);
    wash.addColorStop(0, "rgba(245,197,66,0.16)");
    wash.addColorStop(1, "rgba(245,197,66,0)");
    ctx.fillStyle = wash; ctx.fillRect(0, 0, W, H * 0.42);
    ctx.strokeStyle = "rgba(255,215,120,0.22)";
    ctx.lineWidth = 2;
    rr(ctx, 18, 18, W - 36, H - 36, 18); ctx.stroke();
    const mark = H > 900 ? 64 : 52;
    drawMark(ctx, 36, 32, mark);
    const tx = 36 + mark + 12;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = GOLD;
    ctx.font = `800 ${H > 900 ? 28 : 22}px Prompt, "Noto Sans Thai", sans-serif`;
    ctx.fillText("PUREGOLD", tx, 32 + mark * 0.48);
    ctx.fillStyle = "#c9a227";
    ctx.font = `600 ${H > 900 ? 13 : 11}px Prompt, "Noto Sans Thai", sans-serif`;
    ctx.fillText("BY PUREFXAI", tx, 32 + mark * 0.48 + (H > 900 ? 20 : 16));
    ctx.textAlign = "right";
    ctx.fillStyle = MUTED;
    ctx.font = `600 ${H > 900 ? 15 : 13}px Prompt, "Noto Sans Thai", sans-serif`;
    ctx.fillText(SITE, W - 36, 32 + mark * 0.42);
    ctx.fillStyle = GOLD;
    ctx.font = `700 ${H > 900 ? 15 : 12}px Prompt, "Noto Sans Thai", sans-serif`;
    ctx.fillText(title, W - 36, 32 + mark * 0.42 + (H > 900 ? 22 : 18));
    ctx.textAlign = "left";
    const footerY = H - 36;
    ctx.fillStyle = MUTED;
    ctx.font = `400 ${H > 900 ? 14 : 12}px "Noto Sans Thai", Prompt, sans-serif`;
    const when = fmtBkk(new Date(), lang);
    const note = lang === "en"
      ? "For education only, not investment advice.  " + when
      : "ข้อมูลเพื่อการศึกษา ไม่ใช่คำแนะนำการลงทุน  ·  " + when;
    ctx.fillText(note, 36, footerY);
    return { top: 32 + mark + 18, bottom: H - 56, left: 40, right: W - 40 };
  }

  function pill(ctx, x, y, text, color) {
    ctx.font = "700 18px Prompt, 'Noto Sans Thai', sans-serif";
    const w = ctx.measureText(text).width + 28;
    ctx.fillStyle = color + "22";
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    rr(ctx, x, y, w, 34, 17); ctx.fill(); ctx.stroke();
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + 14, y + 17);
    ctx.textBaseline = "alphabetic";
    return w;
  }

  function drawPrice(ctx, W, H, p, lang) {
    const box = drawChrome(ctx, W, H, lang === "en" ? "Live price" : "ราคาทองสปอต", lang);
    const y0 = box.top + (H > 900 ? 40 : 8);
    ctx.fillStyle = MUTED;
    ctx.font = "700 14px Prompt, sans-serif";
    ctx.fillText("XAUUSD  ·  SPOT", box.left, y0);
    ctx.fillStyle = TX;
    ctx.font = `800 ${H > 900 ? 96 : 84}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.fillText(fmt(p.price, 2), box.left, y0 + (H > 900 ? 110 : 92));
    const c = Number(p.change);
    const col = !isFinite(c) || Math.abs(c) < 1e-9 ? GOLD : c > 0 ? UP : DN;
    const label = (isFinite(c) ? chg(c, 2) : "—") + (p.changePct != null ? "   " + chg(p.changePct, 2) + "%" : "");
    pill(ctx, box.left, y0 + (H > 900 ? 130 : 108), label, col);
    ctx.fillStyle = MUTED;
    ctx.font = "400 16px 'Noto Sans Thai', Prompt, sans-serif";
    const src = p.source || (lang === "en" ? "FX spot" : "สปอต FX");
    const line = (p.time ? src + "  ·  " + p.time : src);
    ctx.fillText(line, box.left, y0 + (H > 900 ? 200 : 168));
    if (H > 900 && p.note) {
      ctx.fillText(p.note, box.left, y0 + 240);
    }
  }

  function drawForecast(ctx, W, H, p, lang) {
    const box = drawChrome(ctx, W, H, lang === "en" ? "AI forecast" : "คาดการณ์ AI", lang);
    let y = box.top + (H > 900 ? 24 : 4);
    const up = Number(p.up ?? 50), dn = Number(p.down ?? 100 - up);
    const tgt = p.target || forecastTarget(p.updated, p.horizon);
    ctx.fillStyle = MUTED;
    ctx.font = "600 15px 'Noto Sans Thai', Prompt, sans-serif";
    const hz = tgt.minutes >= 60 ? (lang === "en" ? (tgt.minutes / 60) + "-hour horizon" : "ระยะ " + (tgt.minutes / 60) + " ชั่วโมง") : (lang === "en" ? tgt.minutes + " min" : tgt.minutes + " นาที");
    ctx.fillText(hz, box.left, y);
    ctx.fillStyle = GOLD;
    ctx.font = "700 22px 'Noto Sans Thai', Prompt, sans-serif";
    const tgtLbl = lang === "en" ? "Target  " + fmtBkk(tgt.to, "en") : "เป้าถึง  " + fmtBkk(tgt.to, "th");
    ctx.fillText(tgtLbl, box.left, y + 32);
    y += H > 900 ? 80 : 58;
    ctx.font = "800 56px 'JetBrains Mono', monospace";
    ctx.fillStyle = UP; ctx.fillText(Math.round(up) + "%", box.left, y + 50);
    ctx.fillStyle = MUTED; ctx.font = "600 16px 'Noto Sans Thai', sans-serif";
    ctx.fillText(lang === "en" ? "Chance up" : "โอกาสขึ้น", box.left, y + 74);
    ctx.font = "800 56px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillStyle = DN; ctx.fillText(Math.round(dn) + "%", box.right, y + 50);
    ctx.fillStyle = MUTED; ctx.font = "600 16px 'Noto Sans Thai', sans-serif";
    ctx.fillText(lang === "en" ? "Chance down" : "โอกาสลง", box.right, y + 74);
    ctx.textAlign = "left";
    y += 96;
    const gw = box.right - box.left, gh = 18;
    rr(ctx, box.left, y, gw, gh, 9); ctx.fillStyle = "#1a1d24"; ctx.fill();
    ctx.fillStyle = UP; rr(ctx, box.left, y, gw * (up / 100), gh, 9); ctx.fill();
    ctx.fillStyle = DN; const dx = box.left + gw * (up / 100);
    rr(ctx, dx, y, gw * (dn / 100), gh, 9); ctx.fill();
    y += 44;
    const reasons = (lang === "en" ? (p.reasonsEn || p.reasons) : (p.reasons || p.reasonsEn)) || [];
    ctx.font = "400 18px 'Noto Sans Thai', Prompt, sans-serif";
    const maxR = H > 900 ? 6 : 3;
    reasons.slice(0, maxR).forEach((r, i) => {
      const dir = Array.isArray(r) ? r[0] : "neutral";
      const text = Array.isArray(r) ? r[1] : String(r);
      ctx.fillStyle = dir === "up" ? UP : dir === "down" ? DN : GOLD;
      ctx.fillText(dir === "up" ? "▲" : dir === "down" ? "▼" : "●", box.left, y + i * 30);
      ctx.fillStyle = TX;
      ctx.fillText(text, box.left + 26, y + i * 30);
    });
    y += Math.min(reasons.length, maxR) * 30 + 16;
    ctx.fillStyle = GOLD;
    ctx.font = "700 18px 'Noto Sans Thai', Prompt, sans-serif";
    const a7 = p.acc7 == null ? "—" : Math.round(Number(p.acc7)) + "%";
    const a30 = p.acc30 == null ? "—" : Math.round(Number(p.acc30)) + "%";
    ctx.fillText(lang === "en"
      ? `7-day accuracy ${a7}  ·  30-day ${a30}`
      : `ความแม่นยำ 7 วัน ${a7}  ·  30 วัน ${a30}`, box.left, Math.min(y, box.bottom - 8));
  }

  function drawTrend(ctx, W, H, p, lang) {
    const box = drawChrome(ctx, W, H, lang === "en" ? "Trend analysis" : "วิเคราะห์แนวโน้ม", lang);
    let y = box.top + (H > 900 ? 20 : 0);
    const align = lang === "en" ? (p.alignEn || p.align || "") : (p.align || p.alignEn || "");
    ctx.fillStyle = GOLD;
    ctx.font = `800 ${H > 900 ? 32 : 26}px 'Noto Sans Thai', Prompt, sans-serif`;
    wrapText(ctx, align, box.left, y + 30, box.right - box.left, H > 900 ? 38 : 32);
    y += H > 900 ? 100 : 70;
    const rows = p.mtf || [];
    const colW = (box.right - box.left) / Math.max(rows.length, 1);
    rows.forEach((m, i) => {
      const x = box.left + i * colW;
      const trend = m.trend || "";
      const col = trend === "up" ? UP : trend === "down" ? DN : GOLD;
      rr(ctx, x, y, colW - 10, H > 900 ? 160 : 120, 12);
      ctx.fillStyle = "rgba(255,255,255,0.04)"; ctx.fill();
      ctx.strokeStyle = col + "66"; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = MUTED;
      ctx.font = "700 14px Prompt, sans-serif";
      ctx.fillText(m.tf || "", x + 12, y + 26);
      ctx.fillStyle = col;
      ctx.font = "800 22px 'Noto Sans Thai', Prompt, sans-serif";
      const lab = lang === "en" ? (trend === "up" ? "Up" : trend === "down" ? "Down" : "Sideways") : (m.label || trend);
      ctx.fillText(lab, x + 12, y + 58);
      ctx.fillStyle = TX;
      ctx.font = "600 14px 'JetBrains Mono', monospace";
      if (m.rsi != null) ctx.fillText("RSI " + Number(m.rsi).toFixed(1), x + 12, y + 86);
    });
    y += (H > 900 ? 190 : 146);
    if (p.bias) {
      ctx.fillStyle = MUTED;
      ctx.font = "400 16px 'Noto Sans Thai', Prompt, sans-serif";
      wrapText(ctx, p.bias, box.left, y, box.right - box.left, 24);
    }
  }

  function wrapText(ctx, text, x, y, maxW, lh) {
    const words = String(text || "").split(/\s+/);
    let line = "", yy = y;
    words.forEach((w, i) => {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, yy); line = w; yy += lh; }
      else line = test;
      if (i === words.length - 1 && line) ctx.fillText(line, x, yy);
    });
    return yy;
  }

  function drawSpdrMini(ctx, series, x, y, w, h) {
    if (!series || series.length < 2) return;
    const tonnes = series.map(s => s.tonnes);
    let lo = Math.min(...tonnes), hi = Math.max(...tonnes);
    const pad = (hi - lo) * 0.12 || 2; lo -= pad; hi += pad;
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const yy = y + (h * i) / 3;
      ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke();
    }
    const chgs = series.map(s => s.change || 0);
    const maxAbs = Math.max(1, ...chgs.map(v => Math.abs(v)));
    const barW = Math.max(1, Math.min(7, (w / series.length) * 0.6));
    const zero = y + h * 0.62;
    series.forEach((s, i) => {
      const px = x + (i / (series.length - 1)) * w;
      const ch = s.change || 0;
      const by = zero - (ch / maxAbs) * (h * 0.35);
      ctx.fillStyle = ch >= 0 ? "rgba(34,227,154,0.5)" : "rgba(255,77,109,0.5)";
      ctx.fillRect(px - barW / 2, Math.min(zero, by), barW, Math.max(1, Math.abs(by - zero)));
    });
    ctx.beginPath();
    series.forEach((s, i) => {
      const px = x + (i / (series.length - 1)) * w;
      const py = y + (1 - (s.tonnes - lo) / (hi - lo)) * h;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = GOLD; ctx.lineWidth = 2; ctx.stroke();
  }

  function drawSpdr(ctx, W, H, p, lang) {
    const box = drawChrome(ctx, W, H, "SPDR Gold Trust (GLD)", lang);
    let y = box.top + (H > 900 ? 10 : 0);
    const side = p.side || (p.change > 0 ? "buy" : p.change < 0 ? "sell" : "flat");
    const scol = side === "buy" ? UP : side === "sell" ? DN : GOLD;
    const slabel = side === "buy"
      ? (lang === "en" ? "Inflow  " : "ซื้อเข้า  ") + chg(p.change) + " t"
      : side === "sell"
        ? (lang === "en" ? "Outflow  " : "ขายออก  ") + chg(p.change) + " t"
        : (lang === "en" ? "Unchanged" : "ไม่เปลี่ยนแปลง");
    ctx.fillStyle = MUTED;
    ctx.font = "700 13px Prompt, sans-serif";
    ctx.fillText(lang === "en" ? "LATEST HOLDINGS" : "ถือครองล่าสุด", box.left, y + 16);
    ctx.fillStyle = TX;
    ctx.font = `800 ${H > 900 ? 80 : 68}px "JetBrains Mono", monospace`;
    ctx.fillText(fmt(p.tonnes, 2), box.left, y + (H > 900 ? 96 : 80));
    ctx.fillStyle = MUTED;
    ctx.font = "500 16px 'Noto Sans Thai', sans-serif";
    ctx.fillText(lang === "en" ? "tonnes" : "ตัน", box.left, y + (H > 900 ? 122 : 102));
    pill(ctx, box.left + (H > 900 ? 0 : 360), y + (H > 900 ? 140 : 18), slabel, scol);
    y += H > 900 ? 196 : 128;
    const session = lang === "en"
      ? `Trade date  ${p.asOfEn || p.asOf || "—"}  ·  official archive, trade-date basis`
      : `วันที่ซื้อขาย  ${p.asOfTh || p.asOf || "—"}  ·  ฐานวันที่ซื้อขาย (trade date)`;
    ctx.fillStyle = TX;
    ctx.font = "600 17px 'Noto Sans Thai', Prompt, sans-serif";
    ctx.fillText(session, box.left, y);
    y += 26;
    ctx.fillStyle = MUTED;
    ctx.font = "400 14px 'Noto Sans Thai', Prompt, sans-serif";
    const pub = lang === "en"
      ? (p.publicationEn || "Typically published the next morning New York time — not a live same-day figure. Bar list is settlement-date (T+1); this print is trade-date.")
      : (p.publicationTh || "คลังข้อมูลมักเผยแพร่เช้าวันถัดไปตามเวลานิวยอร์ก — ไม่ใช่ตัวเลขสดของวันนี้ รายการแท่งทองเป็นวันชำระ (T+1) ส่วนตัวเลขนี้เป็นวันซื้อขาย");
    y = wrapText(ctx, pub, box.left, y, box.right - box.left, 20) + 18;
    const periods = p.periods || {};
    const keys = [["1W", "1W", "1 สัปดาห์"], ["1M", "1M", "1 เดือน"], ["3M", "3M", "3 เดือน"], ["YTD", "YTD", "ปีนี้"], ["1Y", "1Y", "1 ปี"]];
    const cw = (box.right - box.left) / keys.length;
    keys.forEach(([k, enL, thL], i) => {
      const it = periods[k]; if (!it) return;
      const x = box.left + i * cw;
      rr(ctx, x, y, cw - 8, 70, 10);
      ctx.fillStyle = "rgba(255,255,255,0.04)"; ctx.fill();
      ctx.fillStyle = MUTED; ctx.font = "700 11px Prompt, sans-serif";
      ctx.fillText(lang === "en" ? enL : thL, x + 10, y + 20);
      const sc = (it.side || (it.change > 0 ? "buy" : it.change < 0 ? "sell" : "flat"));
      ctx.fillStyle = sc === "buy" ? UP : sc === "sell" ? DN : GOLD;
      ctx.font = "700 18px 'JetBrains Mono', monospace";
      ctx.fillText(chg(it.change) + " t", x + 10, y + 48);
    });
    if (H > 900 && p.series && p.series.length > 2) {
      drawSpdrMini(ctx, p.series.slice(-180), box.left, y + 90, box.right - box.left, 360);
    }
  }

  const DRAW = { price: drawPrice, forecast: drawForecast, trend: drawTrend, spdr: drawSpdr };

  function render(kind, payload, sizeName) {
    const lang = (payload && payload.lang) || (en() ? "en" : "th");
    const [W, H] = SIZES[sizeName] || SIZES.landscape;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    const fn = DRAW[kind] || drawPrice;
    fn(ctx, W, H, payload || {}, lang);
    return c;
  }

  function toBlob(canvas) {
    return new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("png")), "image/png"));
  }

  function fileBase(kind, payload) {
    const day = (payload && (payload.asOf || payload.date)) || fmtBkk(new Date(), "en").replace(/[^\dA-Za-z]+/g, "-").slice(0, 11);
    const stamp = String(day).slice(0, 10).replace(/\s+/g, "-");
    return "puregold-" + kind + "-" + stamp;
  }

  async function blobsFor(kind, payload) {
    const base = fileBase(kind, payload);
    const out = [];
    for (const size of ["landscape", "portrait"]) {
      const [w, h] = SIZES[size];
      const canvas = render(kind, payload, size);
      const blob = await toBlob(canvas);
      out.push({ size, w, h, blob, name: `${base}-${w}x${h}.png`, canvas });
    }
    return out;
  }

  let saveUrlList = [];
  function closeSheet() {
    const sheet = document.getElementById("shareSave");
    if (sheet) { sheet.classList.remove("on"); sheet.hidden = true; }
    saveUrlList.forEach(u => { try { URL.revokeObjectURL(u); } catch (_) {} });
    saveUrlList = [];
    const box = document.getElementById("shareSaveImgs");
    if (box) box.innerHTML = "";
  }
  function ensureSheet() {
    let sheet = document.getElementById("shareSave");
    if (sheet) return sheet;
    sheet = document.createElement("div");
    sheet.id = "shareSave";
    sheet.className = "share-save";
    sheet.hidden = true;
    sheet.innerHTML = `<div class="box">
      <p id="shareSaveHint"></p>
      <div id="shareSaveImgs" class="imgs"></div>
      <div class="row">
        <button type="button" class="btn pri" id="shareSaveX">ปิด</button>
      </div>
    </div>`;
    document.body.appendChild(sheet);
    sheet.addEventListener("click", e => { if (e.target === sheet) closeSheet(); });
    const x = document.getElementById("shareSaveX");
    if (x) x.addEventListener("click", closeSheet);
    return sheet;
  }
  function openSheet(files, lang) {
    const sheet = ensureSheet();
    const hint = document.getElementById("shareSaveHint");
    const box = document.getElementById("shareSaveImgs");
    if (hint) hint.textContent = lang === "en"
      ? "If the file does not download, long-press an image and choose Save Image."
      : "หากไม่ดาวน์โหลดอัตโนมัติ ให้กดค้างที่รูป แล้วเลือกบันทึกรูป";
    const closeLbl = document.getElementById("shareSaveX");
    if (closeLbl) closeLbl.textContent = lang === "en" ? "Close" : "ปิด";
    box.innerHTML = "";
    files.forEach(f => {
      const url = URL.createObjectURL(f.blob);
      saveUrlList.push(url);
      const img = document.createElement("img");
      img.src = url; img.alt = f.name;
      const a = document.createElement("a");
      a.href = url; a.download = f.name; a.className = "btn pri";
      a.textContent = (lang === "en" ? "Save " : "บันทึก ") + f.w + "×" + f.h;
      const wrap = document.createElement("div");
      wrap.appendChild(img); wrap.appendChild(a);
      box.appendChild(wrap);
    });
    sheet.hidden = false; sheet.classList.add("on");
  }

  async function download(kind, payload) {
    const lang = (payload && payload.lang) || (en() ? "en" : "th");
    const files = await blobsFor(kind, payload);
    files.forEach(f => {
      const url = URL.createObjectURL(f.blob);
      const a = document.createElement("a");
      a.href = url; a.download = f.name; a.rel = "noopener"; a.style.display = "none";
      document.body.appendChild(a); a.click(); a.remove();
      if (!isiOS()) setTimeout(() => URL.revokeObjectURL(url), 8000);
      else saveUrlList.push(url);
    });
    if (isiOS()) {
      openSheet(files, lang);
      try { window.open(saveUrlList[0], "_blank", "noopener"); } catch (_) {}
    }
    return files;
  }

  async function share(kind, payload) {
    const lang = (payload && payload.lang) || (en() ? "en" : "th");
    const files = await blobsFor(kind, payload);
    const fileObjs = files.map(f => new File([f.blob], f.name, { type: "image/png" }));
    const title = "PUREGOLD · " + (kind === "price" ? "XAUUSD" : kind === "forecast" ? "AI forecast" : kind === "trend" ? "Trend" : "SPDR GLD");
    const text = title + " · " + SITE;
    try {
      if (navigator.canShare && navigator.canShare({ files: fileObjs })) {
        await navigator.share({ files: fileObjs, title, text });
        return files;
      }
      if (navigator.share) {
        await navigator.share({ title, text, url: "https://" + SITE + "/" });
        return files;
      }
    } catch (e) {
      if (e && e.name === "AbortError") return files;
    }
    return download(kind, payload);
  }

  function buttonsHtml(lang) {
    const save = lang === "en" ? "Save image" : "บันทึกรูป";
    const sh = lang === "en" ? "Share" : "แชร์";
    return `<div class="share-actions">
      <button type="button" class="btn pri share-dl">${save}</button>
      <button type="button" class="btn share-sh">${sh}</button>
    </div>`;
  }

  function mount(el, getPayload) {
    if (!el) return;
    const lang = en() ? "en" : "th";
    if (!el.querySelector(".share-dl")) el.insertAdjacentHTML("beforeend", buttonsHtml(lang));
    const sync = () => {
      const L = ((getPayload && getPayload()) || {}).lang || (en() ? "en" : "th");
      const dl = el.querySelector(".share-dl");
      const sh = el.querySelector(".share-sh");
      if (dl) dl.textContent = L === "en" ? "Save image" : "บันทึกรูป";
      if (sh) sh.textContent = L === "en" ? "Share" : "แชร์";
    };
    sync();
    el.querySelector(".share-dl").onclick = ev => {
      ev.preventDefault();
      const p = getPayload ? getPayload() : {};
      download(p.kind || el.getAttribute("data-share") || "price", p);
    };
    el.querySelector(".share-sh").onclick = ev => {
      ev.preventDefault();
      const p = getPayload ? getPayload() : {};
      share(p.kind || el.getAttribute("data-share") || "price", p);
    };
    el._shareSync = sync;
  }

  const css = `.share-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px}
.share-actions .btn{flex:1 1 140px;min-height:44px}
.share-save{display:none;position:fixed;inset:0;z-index:80;background:#000c;backdrop-filter:blur(8px);padding:16px;align-items:center;justify-content:center}
.share-save.on{display:flex}
.share-save .box{width:min(640px,100%);background:#0c0e14;border:1px solid rgba(255,215,120,.16);border-radius:16px;padding:14px;max-height:min(92vh,900px);overflow:auto}
.share-save .imgs{display:grid;gap:12px}
.share-save img{display:block;width:100%;border-radius:10px;background:#07080d}
.share-save p{margin:0 0 10px;font-size:13px;color:#9aa3b5;line-height:1.55}
.share-save .row{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.share-save a.btn{display:inline-flex;align-items:center;justify-content:center;margin-top:8px;text-decoration:none}`;

  function injectCss() {
    if (document.getElementById("sharecard-css")) return;
    const s = document.createElement("style");
    s.id = "sharecard-css"; s.textContent = css;
    document.head.appendChild(s);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", injectCss);
  else injectCss();

  global.ShareCard = {
    SIZES, SITE, render, blobsFor, download, share, mount, buttonsHtml,
    forecastTarget, fmtBkk, fmt, chg, closeSheet,
    async ready() {
      try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (_) {}
    }
  };
})(window);
