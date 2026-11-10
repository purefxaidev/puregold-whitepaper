/* PureGold market desk: calendar, fear & greed, COT, Thai vs world, brief, calculators. */
(function (global) {
  const VERSION = "20261110h";
  const GOLD = "#f5c542";
  const UP = "#22e39a";
  const DN = "#ff4d6d";
  const MUTED = "#9aa3b5";
  const TH_M = "ม.ค. ก.พ. มี.ค. เม.ย. พ.ค. มิ.ย. ก.ค. ส.ค. ก.ย. ต.ค. พ.ย. ธ.ค.".split(" ");
  const EN_M = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
  const I18N = {
    th: {
      brief: "สรุปตลาดเช้า–เย็น", briefSub: "สร้างอัตโนมัติ 08:00 และ 20:00 น. เวลาไทย",
      morning: "สรุปเช้า", evening: "สรุปเย็น", waitingEvening: "สรุปเย็นจะออกหลัง 20:00 น. เวลาไทย",
      cal: "ปฏิทินข่าวทอง", calSub: "สหรัฐฯ · เวลาไทย",
      high: "สูง", medium: "กลาง", low: "ต่ำ",
      forecast: "คาดการณ์", previous: "ครั้งก่อน", actual: "ผลจริง", awaiting: "รอตัวเลข",
      released: "ออกแล้ว", in: "อีก", ago: "ที่แล้ว",
      speakers: "ถ้อยแถลงเฟด", hideSpeakers: "ซ่อนถ้อยแถลง", showSpeakers: "แสดงถ้อยแถลงเฟด",
      fg: "ความกลัวและความโลภของทอง", fgSub: "ดัชนีรวมจากข้อมูลจริง",
      formula: "วิธีคำนวณ",
      cot: "สถานะกองทุนใหญ่ (COT)", cotSub: "Managed Money · COMEX Gold",
      netLong: "สถานะซื้อสุทธิ", wow: "เปลี่ยนแปลงรายสัปดาห์", long: "ซื้อ", short: "ขาย",
      contracts: "สัญญา", traders: "จำนวนบัญชี",
      compare: "ทองไทย เทียบทองโลก", compareSub: "แท่ง 96.5% ต่อบาททอง",
      theoretical: "ราคาทฤษฎี", thaiSell: "ราคาขายไทย", thaiBuy: "ราคาซื้อไทย",
      premium: "พรีเมียม", discount: "ส่วนลด", fair: "ใกล้เคียงค่าทฤษฎี",
      usdthb: "อัตรา USDTHB", xau: "XAUUSD",
      calc: "เครื่องคำนวณ",
      calcThai: "คำนวณทองไทย", calcPos: "คำนวณขนาดล็อต XAUUSD",
      bahtW: "บาททอง", grams: "กรัม", thb: "บาท",
      bar: "ทองคำแท่ง", jewel: "ทองรูปพรรณ",
      jewelNote: "ราคาทองรูปพรรณรวมค่ากำเหน็จ ราคาขายคืนต่ำกว่าราคาขาย",
      barNote: "คำนวณจากราคาขายแท่ง 96.5% ของฮั่วเซ่งเฮง และน้ำหนัก 1 บาททอง = 15.244 กรัม",
      balance: "เงินทุน (USD)", risk: "ความเสี่ยง (%)", sl: "ระยะตัดขาดทุน (ดอลลาร์)",
      lots: "ขนาดล็อต", riskAmt: "มูลค่าความเสี่ยง",
      lotNote: "สัญญามาตรฐาน 1 ล็อต = 100 ออนซ์ ดังนั้นราคาขยับ 1 ดอลลาร์ ต่อ 1 ล็อต เท่ากับ 100 ดอลลาร์",
      save: "บันทึกรูป", share: "แชร์", close: "ปิด",
      asOf: "ข้อมูล ณ", stale: "ใช้ข้อมูลล่าสุดที่บันทึกไว้",
      source: "ที่มา", edu: "เพื่อการศึกษา ไม่ใช่คำแนะนำการลงทุน",
      hide: "ซ่อนแผงนี้",
      hour: "ชม.", min: "น.", sec: "วินาที",
      day: "วัน",
      holdings: "ถือครอง",
      dollar: "ดอลลาร์สหรัฐฯ และดอกเบี้ยเฟด",
      dollarSub: "DXY และโอกาสดอกเบี้ยจากการประชุม FOMC ครั้งถัดไป",
      corr20: "ความสัมพันธ์ 20 วัน",
      corr60: "ความสัมพันธ์ 60 วัน",
      nextFomc: "ประชุมเฟดครั้งถัดไป",
      effr: "อัตราดอกเบี้ยที่มีผล",
      target: "กรอบเป้าหมาย",
      implied: "อัตราที่ตลาดส่งผ่านหลังประชุม",
      method: "วิธีคำนวณ",
    },
    en: {
      brief: "Morning and evening brief", briefSub: "Generated at 08:00 and 20:00 Bangkok time",
      morning: "Morning brief", evening: "Evening brief", waitingEvening: "The evening brief is published after 20:00 Bangkok time",
      cal: "Gold economic calendar", calSub: "US releases · Bangkok time",
      high: "High", medium: "Medium", low: "Low",
      forecast: "Forecast", previous: "Previous", actual: "Actual", awaiting: "Awaiting figure",
      released: "Released", in: "in", ago: "ago",
      speakers: "Fed speakers", hideSpeakers: "Hide speakers", showSpeakers: "Show Fed speakers",
      fg: "Gold fear and greed", fgSub: "Composite from live inputs",
      formula: "How it is calculated",
      cot: "Large-fund positioning (COT)", cotSub: "Managed money · COMEX Gold",
      netLong: "Net long", wow: "Week-on-week", long: "Long", short: "Short",
      contracts: "contracts", traders: "traders",
      compare: "Thai vs world gold", compareSub: "96.5% bar, per baht-weight",
      theoretical: "Theoretical price", thaiSell: "Thai sell", thaiBuy: "Thai buy",
      premium: "Premium", discount: "Discount", fair: "Close to theory",
      usdthb: "USDTHB", xau: "XAUUSD",
      calc: "Calculators",
      calcThai: "Thai gold calculator", calcPos: "XAUUSD position size",
      bahtW: "baht-weight", grams: "grams", thb: "THB",
      bar: "Gold bar", jewel: "Ornament",
      jewelNote: "Ornament prices include a workmanship premium, and the buy-back is lower than the sell price.",
      barNote: "Uses the Hua Seng Heng 96.5% bar sell price and 15.244 grams per baht-weight.",
      balance: "Balance (USD)", risk: "Risk (%)", sl: "Stop distance (USD)",
      lots: "Position size", riskAmt: "Amount at risk",
      lotNote: "One standard lot is 100 oz, so a $1 move per lot equals $100.",
      save: "Save image", share: "Share", close: "Close",
      asOf: "As of", stale: "Showing the last saved figures",
      source: "Source", edu: "For education only — not investment advice",
      hide: "Hide this panel",
      hour: "h", min: "m", sec: "s",
      day: "d",
      holdings: "Holdings",
      dollar: "US dollar and Fed rate odds",
      dollarSub: "DXY and probabilities for the next FOMC",
      corr20: "20-day correlation",
      corr60: "60-day correlation",
      nextFomc: "Next FOMC",
      effr: "Effective funds rate",
      target: "Target range",
      implied: "Implied post-meeting rate",
      method: "How it is calculated",
    }
  };

  function lang() {
    if (global.LANG === "en") return "en";
    if (global.LANG === "th") return "th";
    return (document.documentElement.lang || "th").toLowerCase().startsWith("en") ? "en" : "th";
  }
  function tr(k) { return (I18N[lang()] || I18N.th)[k] || k; }
  function $(id) { return document.getElementById(id); }
  function num(v) {
    if (v == null || v === "") return null;
    if (typeof v === "number") return Number.isFinite(v) ? v : null;
    const n = Number(String(v).replace(/,/g, "").replace(/[฿$]/g, "").replace("−", "-"));
    return Number.isFinite(n) ? n : null;
  }
  function fmt(n, d) {
    const v = num(n);
    if (v == null) return "—";
    const dd = d == null ? 2 : d;
    return v.toLocaleString("en-US", { minimumFractionDigits: dd, maximumFractionDigits: dd });
  }
  function chg(n, d) {
    const v = num(n);
    if (v == null) return "—";
    const a = fmt(Math.abs(v), d == null ? 2 : d);
    if (Math.abs(v) < 1e-9) return (0).toFixed(d == null ? 2 : d);
    return (v > 0 ? "+" : "−") + a;
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function parseTime(s) {
    if (!s) return null;
    const raw = String(s);
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date(raw + "T00:00:00+07:00");
    const t = Date.parse(raw);
    return Number.isFinite(t) ? new Date(t) : null;
  }
  function bkkParts(d) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Bangkok", year: "numeric", month: "numeric", day: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short"
    }).formatToParts(d);
    const g = k => parts.find(p => p.type === k)?.value;
    return { yr: +g("year"), mo: +g("month"), day: +g("day"), hh: g("hour"), mm: g("minute"), wd: g("weekday") };
  }
  function fmtWhen(d, withTime) {
    if (!(d instanceof Date) || isNaN(d)) return "—";
    const p = bkkParts(d);
    if (lang() === "en") return `${p.day} ${EN_M[p.mo - 1]} ${p.yr}` + (withTime === false ? "" : ` ${p.hh}:${p.mm} Bangkok`);
    return `${p.day} ${TH_M[p.mo - 1]} ${p.yr}` + (withTime === false ? "" : ` ${p.hh}:${p.mm} น.`);
  }
  function remain(ms) {
    const past = ms < 0;
    let a = Math.abs(ms);
    const days = Math.floor(a / 86400000); a -= days * 86400000;
    const h = Math.floor(a / 3600000); a -= h * 3600000;
    const m = Math.floor(a / 60000); a -= m * 60000;
    const s = Math.floor(a / 1000);
    const L = lang();
    const bits = [];
    if (days) bits.push(days + (L === "en" ? tr("day") : " วัน"));
    if (days || h) bits.push(h + (L === "en" ? tr("hour") : " ชม."));
    bits.push(m + (L === "en" ? tr("min") : " น."));
    if (!days && !h) bits.push(s + (L === "en" ? tr("sec") : " วินาที"));
    const body = bits.join(" ");
    if (past) return (L === "en" ? tr("ago") + " " : "") + body + (L === "en" ? "" : " ที่แล้ว");
    return (L === "en" ? tr("in") + " " : "อีก ") + body;
  }

  function bases() {
    const loc = location.origin || "";
    const onDash = /dashboard\.purefxai\.store$/.test(location.host) || /gold-dashboard/.test(location.pathname);
    const list = [];
    if (!onDash) {
      list.push("data/", "./data/", "assets/");
      list.push("https://dashboard.purefxai.store/");
    }
    list.push("./", "");
    if (onDash) list.push("https://dashboard.purefxai.store/");
    return list;
  }
  async function loadJSON(name) {
    let lastErr = null;
    for (const b of bases()) {
      const url = b + name + (name.includes("?") ? "" : ("?t=" + Date.now()));
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (r && r.ok) {
          const d = await r.json();
          if (d && typeof d === "object") return d;
        }
      } catch (e) { lastErr = e; }
    }
    if (lastErr) console.warn("insights", name, lastErr);
    return null;
  }

  const CSS = `
.ix-card[hidden],.ix-hide{display:none!important}
#briefCard[hidden],#calCard[hidden],#fgCard[hidden],#cotCard[hidden],#compareCard[hidden],#calcCard[hidden],#dollarCard[hidden]{display:none!important}
.ix-sub{margin-left:auto;font:400 11px 'Noto Sans Thai',system-ui;color:var(--mut,#9aa3b5);font-weight:400;letter-spacing:0}
.ix-note,.ix-src{font-size:11px;color:var(--mut,#9aa3b5);line-height:1.65;margin:10px 0 0}
.ix-src a{color:var(--gold,#f5c542);text-decoration:none}
.ix-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}
.ix-tabs button{appearance:none;border:1px solid rgba(245,197,66,.28);background:rgba(255,255,255,.04);color:var(--tx,#eef1f7);border-radius:999px;padding:6px 12px;font:600 12px Prompt,system-ui;cursor:pointer}
.ix-tabs button.on{background:var(--gold,#f5c542);color:#16120a;border-color:transparent}
.ix-tabs button:disabled{opacity:.45;cursor:not-allowed}
.ix-brief{font-size:14.5px;line-height:1.75;color:var(--tx,#eef1f7)}
.ix-event{display:grid;grid-template-columns:108px 1fr;gap:8px 12px;padding:10px 10px 10px 12px;border-radius:14px;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.06);border-left:3px solid rgba(255,255,255,.2);margin:0 0 8px}
.ix-event.high{border-left-color:${DN}}
.ix-event.medium{border-left-color:${GOLD}}
.ix-event.low{border-left-color:rgba(255,255,255,.2)}
.ix-when{font:700 12px 'JetBrains Mono',ui-monospace,monospace;color:var(--gold,#f5c542)}
.ix-cd{display:block;font:600 11px 'JetBrains Mono',ui-monospace,monospace;color:var(--mut,#9aa3b5);margin-top:3px}
.ix-ev-t{font:600 13.5px Prompt,'Noto Sans Thai',sans-serif;margin:0 0 4px}
.ix-imp{display:inline-flex;align-items:center;border-radius:999px;padding:1px 7px;font:700 10px Prompt,system-ui;letter-spacing:.04em;text-transform:uppercase;margin-right:6px}
.ix-imp.high{color:${DN};background:rgba(255,77,109,.12);border:1px solid rgba(255,77,109,.35)}
.ix-imp.medium{color:${GOLD};background:rgba(245,197,66,.12);border:1px solid rgba(245,197,66,.35)}
.ix-imp.low{color:${MUTED};background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1)}
.ix-nums{display:flex;flex-wrap:wrap;gap:8px 14px;font-size:12px;color:var(--mut,#9aa3b5)}
.ix-nums b{color:var(--tx,#eef1f7);font:700 12px 'JetBrains Mono',ui-monospace,monospace}
.ix-ev-note{font-size:12px;color:var(--mut,#9aa3b5);line-height:1.55;margin:6px 0 0}
.ix-more{appearance:none;background:transparent;border:0;color:var(--gold,#f5c542);font:600 12px Prompt,system-ui;cursor:pointer;padding:4px 0}
.ix-fg-wrap{display:grid;grid-template-columns:140px 1fr;gap:14px;align-items:center}
@media(max-width:640px){.ix-fg-wrap{grid-template-columns:1fr}.ix-event{grid-template-columns:1fr}}
.ix-score{text-align:center}
.ix-score b{display:block;font:800 42px/1 'JetBrains Mono',ui-monospace,monospace;letter-spacing:-1px;background:linear-gradient(180deg,#fff,${GOLD});-webkit-background-clip:text;background-clip:text;color:transparent}
.ix-score span{display:block;margin-top:4px;font:700 13px Prompt,system-ui}
.ix-comps{display:grid;gap:6px}
.ix-comp{display:grid;grid-template-columns:1fr 44px;gap:8px;align-items:center;font-size:11px;color:var(--mut,#9aa3b5)}
.ix-bar{height:6px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden}
.ix-bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#3b6cff,${GOLD},${DN})}
.ix-info{appearance:none;width:22px;height:22px;border-radius:50%;border:1px solid rgba(245,197,66,.4);background:rgba(255,255,255,.04);color:var(--gold,#f5c542);font:700 12px Prompt,system-ui;cursor:pointer;padding:0}
.ix-formula{display:none;margin-top:10px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);font-size:12px;line-height:1.65;color:var(--tx,#eef1f7)}
.ix-formula.on{display:block}
.ix-kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:8px 0}
.ix-k{padding:10px;border-radius:12px;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.06)}
.ix-k small{display:block;font-size:10.5px;color:var(--mut,#9aa3b5);letter-spacing:.05em;text-transform:uppercase;font-weight:700}
.ix-k b{display:block;margin-top:4px;font:700 16px 'JetBrains Mono',ui-monospace,monospace}
.ix-up{color:${UP}}.ix-dn{color:${DN}}.ix-flat{color:${GOLD}}
.ix-calcs{display:grid;gap:14px;grid-template-columns:1fr}
@media(min-width:860px){.ix-calcs{grid-template-columns:1fr 1fr}}
.ix-dxy{display:flex;flex-wrap:wrap;gap:12px 18px;align-items:baseline;margin:0 0 8px}
.ix-dxy b{font:800 28px 'JetBrains Mono',ui-monospace,monospace;color:var(--text,#f4efe3)}
.ix-probs{display:grid;gap:6px;margin:8px 0}
.ix-prob{display:grid;grid-template-columns:1fr 52px;gap:8px;align-items:center;font-size:12px}
.ix-prob .ix-bar{grid-column:1/-1;height:8px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden}
.ix-prob .ix-bar i{display:block;height:100%;background:linear-gradient(90deg,#f5c542,#e0c36a)}
.ix-meth{margin-top:8px;font-size:11px;color:var(--mut,#9aa3b5);line-height:1.55}
.ix-meth summary{cursor:pointer;color:var(--gold2,#e0c36a)}

.ix-form{display:grid;gap:8px}
.ix-form label{display:grid;gap:4px;font-size:12px;color:var(--mut,#9aa3b5)}
.ix-form input,.ix-form select{width:100%;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.12);border-radius:10px;color:var(--tx,#eef1f7);font:600 15px 'JetBrains Mono',ui-monospace,monospace;padding:9px 10px}
.ix-form input:focus,.ix-form select:focus{outline:none;border-color:rgba(245,197,66,.6)}
.ix-result{margin-top:8px;padding:12px;border-radius:14px;background:linear-gradient(180deg,rgba(245,197,66,.12),rgba(255,255,255,.03));border:1px solid rgba(245,197,66,.22)}
.ix-result b{font:800 28px/1.1 'JetBrains Mono',ui-monospace,monospace;color:var(--gold,#f5c542)}
#ixFgChart,#ixCotChart{width:100%;height:84px;display:block}
.ix-share-sheet{display:none;position:fixed;inset:0;z-index:120;padding:16px;align-items:center;justify-content:center;background:rgba(6,5,4,.48);backdrop-filter:blur(22px)}
.ix-share-sheet.on{display:flex}
.ix-share-sheet .box{width:min(640px,100%);background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.05));backdrop-filter:blur(28px);border:1px solid rgba(255,255,255,.28);border-radius:22px;padding:16px;max-height:min(92vh,900px);overflow:auto}
.ix-share-sheet img{display:block;width:100%;border-radius:14px;margin:0 0 10px;background:#07080d}
.ix-share-sheet .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.ix-share-full{display:none;position:fixed;inset:0;z-index:130;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px;background:rgba(6,5,4,.92)}
.ix-share-full.on{display:flex}
.ix-share-full img{max-width:100%;max-height:78vh;object-fit:contain;border-radius:12px}
.ix-land .card{margin:0}
.ix-grid{display:grid;gap:14px;grid-template-columns:1fr;align-items:start}
@media(min-width:900px){
  .ix-grid{grid-template-columns:repeat(12,1fr)}
  .ix-grid .ix-c12{grid-column:span 12}
  .ix-grid .ix-c6{grid-column:span 6}
}
`;

  function injectCss() {
    if (document.getElementById("ix-css")) return;
    const s = document.createElement("style");
    s.id = "ix-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function showCard(el, on) {
    if (!el) return;
    if (on) { el.hidden = false; el.removeAttribute("hidden"); el.classList.remove("ix-hide"); }
    else { el.hidden = true; }
  }

  /* ---------- calendar ---------- */
  let calTimer = null;
  function isSpeaker(ev) {
    const t = ((ev.title || "") + " " + (ev.title_en || "")).toLowerCase();
    return ev.impact === "low" && /speaks|fomc member|powell/.test(t);
  }
  function renderCalendar(data) {
    const card = $("calCard"); const body = $("calBody");
    if (!card || !body) return;
    if (!data || !data.events || !data.events.length) { showCard(card, false); return; }
    showCard(card, true);
    const L = lang();
    const sub = $("calAsOf");
    if (sub) sub.textContent = (data.updated_th && L === "th" ? data.updated_th : (data.updated_en || data.updated_at_bkk || ""));
    const evs = data.events;
    const main = evs.filter(e => !isSpeaker(e));
    const talks = evs.filter(isSpeaker);
    const showTalks = body.getAttribute("data-talks") === "1";
    const list = main.concat(showTalks ? talks : []);
    body.innerHTML = list.map(ev => eventHtml(ev)).join("") +
      (talks.length ? `<button type="button" class="ix-more" data-ix-talks="1">${showTalks ? tr("hideSpeakers") : tr("showSpeakers") + " (" + talks.length + ")"}</button>` : "") +
      `<p class="ix-src">${esc(tr("source"))}: <a href="${esc(data.source_url)}" target="_blank" rel="noopener">${esc(L === "en" ? data.source : "Forex Factory")}</a> · ${esc(L === "en" ? (data.source_note_en || "") : (data.source_note_th || ""))}</p>`;
    const more = body.querySelector("[data-ix-talks]");
    if (more) more.onclick = () => { body.setAttribute("data-talks", showTalks ? "0" : "1"); renderCalendar(data); };
    tickCountdowns(body);
    if (calTimer) clearInterval(calTimer);
    calTimer = setInterval(() => tickCountdowns(body), 1000);
  }
  function eventHtml(ev) {
    const L = lang();
    const dt = parseTime(ev.date_utc || ev.date_bkk || ev.date);
    const impact = ev.impact || "low";
    const title = L === "en" ? (ev.title_en || ev.title) : (ev.title_th || ev.title);
    const note = L === "en" ? ev.note_en : ev.note_th;
    const released = dt && dt.getTime() <= Date.now();
    const actual = ev.actual;
    const actualHtml = released
      ? (actual ? `${esc(tr("actual"))} <b>${esc(actual)}</b>` : `<span>${esc(tr("awaiting"))}</span>`)
      : "";
    return `<article class="ix-event ${esc(impact)}" data-ts="${dt ? dt.getTime() : ""}">
      <div><div class="ix-when">${esc(dt ? fmtWhen(dt, true) : (L === "en" ? ev.date_en : ev.date_th) || "—")}</div><span class="ix-cd"></span></div>
      <div>
        <div class="ix-ev-t"><span class="ix-imp ${esc(impact)}">${esc(tr(impact))}</span>${esc(title)}</div>
        <div class="ix-nums">${ev.forecast ? `<span>${esc(tr("forecast"))} <b>${esc(ev.forecast)}</b></span>` : ""}${ev.previous ? `<span>${esc(tr("previous"))} <b>${esc(ev.previous)}</b></span>` : ""}${actualHtml ? `<span>${actualHtml}</span>` : ""}</div>
        ${note ? `<p class="ix-ev-note">${esc(note)}</p>` : ""}
      </div>
    </article>`;
  }
  function tickCountdowns(root) {
    if (!root) return;
    const now = Date.now();
    root.querySelectorAll(".ix-event[data-ts]").forEach(el => {
      const ts = +el.getAttribute("data-ts");
      const cd = el.querySelector(".ix-cd");
      if (!ts || !cd) return;
      const released = ts <= now;
      cd.textContent = released ? tr("released") + " · " + remain(ts - now) : remain(ts - now);
    });
  }

  /* ---------- fear & greed ---------- */
  function zoneColor(zone, score) {
    if (zone === "extreme-fear" || (score != null && score <= 24)) return DN;
    if (zone === "fear" || (score != null && score <= 44)) return "#ff8a6b";
    if (zone === "greed" || (zone === "extreme-greed") || (score != null && score >= 56)) return score >= 75 ? "#1ecf7a" : UP;
    return GOLD;
  }
  function renderFearGreed(data) {
    const card = $("fgCard"); const body = $("fgBody");
    if (!card || !body) return;
    if (!data || data.score == null) { showCard(card, false); return; }
    showCard(card, true);
    const L = lang();
    const sub = $("fgAsOf");
    if (sub) sub.textContent = (L === "en" ? data.as_of_en : data.as_of_th) || data.as_of;
    const label = L === "en" ? data.label_en : data.label_th;
    const comps = data.components || {};
    const labels = (L === "en" ? data.component_labels_en : data.component_labels_th) || {};
    const color = zoneColor(data.zone, data.score);
    const rows = Object.keys(comps).map(k => {
      const v = comps[k];
      return `<div class="ix-comp"><span>${esc(labels[k] || k)}</span><b>${fmt(v, 0)}</b><div class="ix-bar" style="grid-column:1/-1"><i style="width:${Math.max(2, Math.min(100, v))}%"></i></div></div>`;
    }).join("");
    body.innerHTML = `<div class="ix-fg-wrap">
      <div class="ix-score"><canvas id="ixFgGauge" width="140" height="90" aria-hidden="true"></canvas><b style="color:${color};background:none;-webkit-background-clip:initial;background-clip:initial">${fmt(data.score, 1)}</b><span style="color:${color}">${esc(label)}</span></div>
      <div class="ix-comps">${rows}<canvas id="ixFgChart" width="640" height="84" aria-label="Fear and greed history"></canvas></div>
    </div>
    <button type="button" class="ix-info" id="ixFgInfo" aria-expanded="false" title="${esc(tr("formula"))}">?</button>
    <div class="ix-formula" id="ixFgFormula">${esc(L === "en" ? data.formula_en : data.formula_th)}</div>
    <p class="ix-src">${esc(tr("asOf"))} ${esc(L === "en" ? data.as_of_en : data.as_of_th)} · ${esc(L === "en" ? data.source : "ดัชนีรวม PureGold จาก RSI, เส้นเฉลี่ย, ความผันผวน, เงินไหล SPDR และโมเมนตัม")}</p>`;
    const info = $("ixFgInfo"); const box = $("ixFgFormula");
    if (info && box) info.onclick = () => { const on = box.classList.toggle("on"); info.setAttribute("aria-expanded", on ? "true" : "false"); };
    drawGauge($("ixFgGauge"), data.score, color);
    drawHistory($("ixFgChart"), data.history || [], d => d.score, 0, 100, color);
  }
  function drawGauge(cv, score, color) {
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const w = cv.width, h = cv.height, cx = w / 2, cy = h - 8, r = Math.min(w / 2 - 8, h - 18);
    ctx.clearRect(0, 0, w, h);
    const start = Math.PI, end = 2 * Math.PI;
    ctx.lineWidth = 10; ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255,255,255,.08)";
    ctx.beginPath(); ctx.arc(cx, cy, r, start, end); ctx.stroke();
    const grd = ctx.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0, DN); grd.addColorStop(.5, GOLD); grd.addColorStop(1, UP);
    ctx.strokeStyle = grd;
    ctx.beginPath(); ctx.arc(cx, cy, r, start, start + Math.PI * (Math.max(0, Math.min(100, score)) / 100)); ctx.stroke();
    const ang = start + Math.PI * (Math.max(0, Math.min(100, score)) / 100);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, 5, 0, Math.PI * 2); ctx.fill();
  }
  function drawHistory(cv, series, pick, lo, hi, color) {
    if (!cv || !series.length) return;
    const ctx = cv.getContext("2d");
    const w = cv.width, h = cv.height, pad = 4;
    ctx.clearRect(0, 0, w, h);
    const vals = series.map(pick).filter(v => v != null);
    if (vals.length < 2) return;
    const min = lo == null ? Math.min(...vals) : lo;
    const max = hi == null ? Math.max(...vals) : hi;
    const span = max - min || 1;
    ctx.strokeStyle = "rgba(255,255,255,.06)";
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75].forEach(p => {
      const y = pad + (h - pad * 2) * (1 - p);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    });
    ctx.beginPath();
    series.forEach((d, i) => {
      const v = pick(d); if (v == null) return;
      const x = pad + (w - pad * 2) * (i / (series.length - 1));
      const y = pad + (h - pad * 2) * (1 - (v - min) / span);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.strokeStyle = color || GOLD;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /* ---------- COT ---------- */
  function renderCot(data) {
    const card = $("cotCard"); const body = $("cotBody");
    if (!card || !body) return;
    if (!data || data.net == null) { showCard(card, false); return; }
    showCard(card, true);
    const L = lang();
    const sub = $("cotAsOf");
    if (sub) sub.textContent = (L === "en" ? data.as_of_en : data.as_of_th) || data.as_of;
    const wow = data.wow;
    const side = wow > 0 ? "ix-up" : (wow < 0 ? "ix-dn" : "ix-flat");
    const netSide = data.net >= 0 ? "ix-up" : "ix-dn";
    body.innerHTML = `<div class="ix-kv">
      <div class="ix-k"><small>${esc(tr("netLong"))}</small><b class="${netSide}">${chg(data.net, 0)}</b></div>
      <div class="ix-k"><small>${esc(tr("wow"))}</small><b class="${side}">${chg(wow, 0)}</b></div>
      <div class="ix-k"><small>${esc(tr("long"))}</small><b>${fmt(data.long, 0)}</b></div>
      <div class="ix-k"><small>${esc(tr("short"))}</small><b>${fmt(data.short, 0)}</b></div>
    </div>
    <canvas id="ixCotChart" width="640" height="84" aria-label="Managed money net history"></canvas>
    <p class="ix-src">${esc(L === "en" ? data.basis_en : data.basis_th)} ${esc(L === "en" ? data.publication_en : data.publication_th)}
      · ${esc(tr("source"))}: <a href="${esc(data.source_url)}" target="_blank" rel="noopener">CFTC ${esc(data.dataset || "")}</a>
      · ${esc(data.contract || "")} (${esc(data.contract_code || "088691")})</p>`;
    drawHistory($("ixCotChart"), data.series || [], d => d.net, null, null, data.net >= 0 ? UP : DN);
  }

  /* ---------- Thai vs world ---------- */
  function renderCompare(data) {
    const card = $("compareCard"); const body = $("compareBody");
    if (!card || !body) return;
    if (!data || data.theoretical == null || data.thai_sell == null) { showCard(card, false); return; }
    showCard(card, true);
    const L = lang();
    const sub = $("compareAsOf");
    if (sub) sub.textContent = (L === "en" ? data.updated_en : data.updated_th) || data.updated_at_bkk;
    const prem = data.premium_sell;
    const side = data.premium_side === "discount" ? "ix-up" : (data.premium_side === "premium" ? "ix-dn" : "ix-flat");
    const sideLbl = data.premium_side === "discount" ? tr("discount") : (data.premium_side === "premium" ? tr("premium") : tr("fair"));
    const fxSide = (data.thb_effect || 0) > 0 ? "ix-dn" : ((data.thb_effect || 0) < 0 ? "ix-up" : "ix-flat");
    body.innerHTML = `<div class="ix-kv">
      <div class="ix-k"><small>${esc(tr("xau"))}</small><b>${fmt(data.xauusd, 2)}</b></div>
      <div class="ix-k"><small>${esc(tr("usdthb"))}</small><b>${fmt(data.usdthb, 4)}</b></div>
      <div class="ix-k"><small>${esc(tr("theoretical"))}</small><b>${fmt(data.theoretical, 0)}</b></div>
      <div class="ix-k"><small>${esc(tr("thaiSell"))}</small><b>${fmt(data.thai_sell, 0)}</b></div>
      <div class="ix-k"><small>${esc(sideLbl)}</small><b class="${side}">${chg(prem, 0)} ${L === "en" ? "THB" : "บาท"}</b></div>
      ${data.thb_effect != null ? `<div class="ix-k"><small>THB</small><b class="${fxSide}">${chg(data.thb_effect, 0)}</b></div>` : ""}
    </div>
    <p class="ix-note">${esc(L === "en" ? data.formula_en : data.formula_th)}</p>
    ${data.thb_effect_th || data.thb_effect_en ? `<p class="ix-note">${esc(L === "en" ? data.thb_effect_en : data.thb_effect_th)}</p>` : ""}
    <p class="ix-src">${esc(tr("source"))}: ${esc(L === "en" ? data.thai_source_en : data.thai_source)} · ${esc(data.usdthb_source)}
      · ${esc(L === "en" ? data.thai_as_of_en : data.thai_as_of_th)}</p>`;
  }

  /* ---------- brief + share ---------- */
  function renderDollar(data) {
    const card = $("dollarCard"); const body = $("dollarBody");
    if (!card || !body) return;
    if (!data || !data.dxy) { showCard(card, false); return; }
    showCard(card, true);
    const L = lang();
    const dxy = data.dxy, corr = data.corr || {}, fed = data.fed || {}, an = data.analysis || {};
    const asOf = $("dollarAsOf");
    if (asOf) asOf.textContent = (L === "en" ? (data.updated_en || dxy.as_of) : (data.updated_th || dxy.as_of)) || "";
    const up = (dxy.change == null) ? MUTED : (dxy.change > 0 ? UP : (dxy.change < 0 ? DN : MUTED));
    const chs = dxy.change == null ? "—" : ((dxy.change > 0 ? "+" : "") + Number(dxy.change).toFixed(2) + (dxy.change_pct != null ? "  (" + (dxy.change_pct > 0 ? "+" : "") + Number(dxy.change_pct).toFixed(2) + "%)" : ""));
    const c20 = corr.n20 == null ? "—" : Number(corr.n20).toFixed(2);
    const c60 = corr.n60 == null ? "—" : Number(corr.n60).toFixed(2);
    const probs = fed.probs || [];
    const probRows = probs.map(r => {
      const lab = L === "en" ? r.label_en : r.label_th;
      const pct = Math.round((r.p || 0) * 100);
      return `<div class="ix-prob"><span>${esc(lab)}</span><b>${pct}%</b><div class="ix-bar"><i style="width:${Math.max(2, Math.min(100, pct))}%"></i></div></div>`;
    }).join("");
    const method = L === "en" ? (fed.method_en || "") : (fed.method_th || "");
    body.innerHTML = `<div class="ix-dxy"><b>${esc(Number(dxy.price).toFixed(2))}</b><span style="color:${up};font:700 16px 'JetBrains Mono',monospace">${esc(chs)}</span><span class="mut">DXY</span></div>
      <canvas id="ixDxyChart" width="640" height="84" aria-label="DXY chart"></canvas>
      <div class="ix-comps" style="margin-top:8px">
        <div class="ix-comp"><span>${esc(tr("corr20"))}</span><b>${esc(c20)}</b></div>
        <div class="ix-comp"><span>${esc(tr("corr60"))}</span><b>${esc(c60)}</b></div>
      </div>
      <p style="margin:10px 0 4px;font:600 14px Prompt,sans-serif;color:var(--gold2,#e0c36a)">${esc(tr("nextFomc"))}: ${esc(L==="en" ? (fed.next_fomc_en || fed.next_fomc || "—") : (fed.next_fomc_th || fed.next_fomc || "—"))}</p>
      <p class="mut" style="margin:0 0 6px">${esc(tr("effr"))} ${fed.effr != null ? fed.effr.toFixed(2)+"%" : "—"}
        · ${esc(tr("target"))} ${fed.target_from != null ? fed.target_from.toFixed(2)+"–"+fed.target_to.toFixed(2)+"%" : "—"}
        · ${esc(tr("implied"))} ${fed.implied_post != null ? fed.implied_post.toFixed(2)+"%" : "—"}</p>
      <div class="ix-probs">${probRows}</div>
      <p style="margin:10px 0 0;line-height:1.55">${esc(L==="en" ? (an.en||"") : (an.th||""))}</p>
      <details class="ix-meth"><summary>${esc(tr("method"))} · ${esc(tr("source"))}</summary>
        <p>${esc(method)}</p>
        <p>DXY: ${esc(dxy.source || "")} · EFFR: ${esc(fed.effr_source || "")} · ${esc(fed.futures_source || "")}</p>
      </details>
      <p class="ix-src">${esc(tr("edu"))}</p>`;
    const cv = $("ixDxyChart");
    const series = dxy.series || [];
    if (cv && series.length > 2) {
      const ctx = cv.getContext("2d");
      const W = cv.width, H = cv.height;
      ctx.clearRect(0, 0, W, H);
      const ys = series.map(p => Number(p.c)).filter(Number.isFinite);
      const mn = Math.min(...ys), mx = Math.max(...ys);
      const span = (mx - mn) || 1;
      ctx.strokeStyle = "rgba(245,197,66,.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ys.forEach((v, i) => {
        const x = 8 + i * (W - 16) / Math.max(1, ys.length - 1);
        const y = H - 10 - (v - mn) / span * (H - 20);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }

  function renderBrief(data) {
    const card = $("briefCard"); const body = $("briefBody");
    if (!card || !body) return;
    if (!data || !(data.latest || data.morning || data.evening)) { showCard(card, false); return; }
    showCard(card, true);
    const L = lang();
    const sub = $("briefAsOf");
    const morning = data.morning, evening = data.evening, latest = data.latest;
    const pickId = body.getAttribute("data-sess") || (evening && evening.date === (latest && latest.date) && latest.session === "evening" ? "evening" : "morning");
    const cur = (pickId === "evening" ? evening : morning) || latest;
    if (sub && cur) sub.textContent = (L === "en" ? cur.generated_en : cur.generated_th) || cur.generated_at_bkk;
    const text = cur ? (L === "en" ? cur.text_en : cur.text_th) : "";
    body.innerHTML = `<div class="ix-tabs">
      <button type="button" data-sess="morning" class="${pickId !== "evening" ? "on" : ""}">${esc(tr("morning"))}</button>
      <button type="button" data-sess="evening" class="${pickId === "evening" ? "on" : ""}" ${evening ? "" : "disabled"}>${esc(tr("evening"))}</button>
    </div>
    <div class="ix-brief">${cur ? esc(text) : esc(tr("waitingEvening"))}</div>
    <div id="briefShare"></div>
    <p class="ix-src">${esc(L === "en" ? data.schedule_en : data.schedule_th)} · ${esc(tr("edu"))}</p>`;
    body.querySelectorAll("[data-sess]").forEach(btn => {
      btn.onclick = () => { if (btn.disabled) return; body.setAttribute("data-sess", btn.getAttribute("data-sess")); renderBrief(data); };
    });
    const shareHost = $("briefShare");
    if (shareHost && cur) {
      if (global.ShareCard && ShareCard.mount) {
        shareHost.setAttribute("data-share", "brief");
        ShareCard.mount(shareHost, () => ({
          kind: "brief",
          lang: L,
          title: L === "en" ? (cur.session_en + " brief") : ("สรุปตลาด" + (cur.session === "evening" ? "เย็น" : "เช้า")),
          price: cur.price,
          change: cur.change,
          changePct: cur.change_pct,
          note: L === "en" ? cur.text_en : cur.text_th,
          date: cur.date,
          session: cur.session
        }));
      } else {
        shareHost.innerHTML = `<div class="share-actions ix-share-btns" style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
          <button type="button" class="btn" data-ix-dl="1">${esc(tr("save"))}</button>
          <button type="button" class="btn pri" data-ix-sh="1">${esc(tr("share"))}</button>
        </div>`;
        shareHost.querySelector("[data-ix-dl]").onclick = () => posterSave(cur);
        shareHost.querySelector("[data-ix-sh]").onclick = () => posterShare(cur);
      }
      // Always offer a dedicated brief poster as well
      const extra = document.createElement("div");
      extra.style.cssText = "display:flex;gap:8px;margin-top:8px;flex-wrap:wrap";
      extra.innerHTML = `<button type="button" class="btn" id="ixBriefDl">${esc(tr("save"))}</button>
        <button type="button" class="btn pri" id="ixBriefSh">${esc(tr("share"))}</button>`;
      if (!$("ixBriefDl")) {
        // If ShareCard already injected buttons, keep them and also add ours labeled the same? Avoid duplicate.
        // Use ShareCard buttons if present; else ours already added. If both, only keep ShareCard + our poster via those clicks? 
      }
      if (!shareHost.querySelector(".share-dl") && !shareHost.querySelector("[data-ix-dl]")) {
        shareHost.appendChild(extra);
        extra.querySelector("#ixBriefDl").onclick = () => posterSave(cur);
        extra.querySelector("#ixBriefSh").onclick = () => posterShare(cur);
      }
    }
  }

  function wrapText(ctx, text, x, y, maxW, lineH, maxLines) {
    const words = String(text || "").split(/\s+/);
    let line = "", yy = y, n = 0;
    for (let i = 0; i < words.length; i++) {
      const test = line ? line + " " + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, yy);
        yy += lineH; line = words[i]; n++;
        if (maxLines && n >= maxLines) { ctx.fillText(line.replace(/.?$/, "…"), x, yy); return yy + lineH; }
      } else line = test;
    }
    if (line) { ctx.fillText(line, x, yy); yy += lineH; }
    return yy;
  }
  function drawPoster(cur, w, h) {
    const L = lang();
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#120d02"); g.addColorStop(.5, "#07080d"); g.addColorStop(1, "#1a1406");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(245,197,66,.12)";
    ctx.beginPath(); ctx.arc(w * .85, h * -.05, w * .4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = GOLD;
    ctx.font = `700 ${Math.round(w * .028)}px Prompt, sans-serif`;
    const head = L === "en"
      ? ((cur.session === "evening" ? "Evening" : "Morning") + " gold brief")
      : ("สรุปตลาด" + (cur.session === "evening" ? "เย็น" : "เช้า"));
    ctx.fillText("PUREGOLD  ·  " + head, 56, 64);
    ctx.fillStyle = "#b7ad96";
    ctx.font = `500 ${Math.round(w * .018)}px Prompt, sans-serif`;
    ctx.fillText((L === "en" ? cur.generated_en : cur.generated_th) || "", 56, 96);
    ctx.fillStyle = "#f4efe3";
    ctx.font = `800 ${Math.round(w * .07)}px "JetBrains Mono", monospace`;
    ctx.fillText(fmt(cur.price, 2), 56, 170);
    if (cur.change != null) {
      ctx.fillStyle = cur.change >= 0 ? UP : DN;
      ctx.font = `700 ${Math.round(w * .028)}px "JetBrains Mono", monospace`;
      ctx.fillText(chg(cur.change, 2) + (cur.change_pct != null ? "  (" + chg(cur.change_pct, 2) + "%)" : ""), 56, 210);
    }
    ctx.fillStyle = "#e8e0d0";
    ctx.font = `400 ${Math.round(w * .022)}px Prompt, "Noto Sans Thai", sans-serif`;
    const text = L === "en" ? cur.text_en : cur.text_th;
    wrapText(ctx, text, 56, 260, w - 112, Math.round(w * .032), h > 1000 ? 16 : 8);
    ctx.fillStyle = "#b7ad96";
    ctx.font = `500 ${Math.round(w * .016)}px Prompt, sans-serif`;
    ctx.fillText("PureGold by PureFxAi  ·  gold.purefxai.store  ·  " + (L === "en" ? I18N.en.edu : I18N.th.edu), 56, h - 40);
    return c;
  }
  let posterUrls = [];
  function closePoster() {
    const s = $("ixShareSave");
    if (s) { s.classList.remove("on"); s.hidden = true; }
    posterUrls.forEach(u => { try { URL.revokeObjectURL(u); } catch (_) {} });
    posterUrls = [];
  }
  function ensurePosterSheet() {
    let s = $("ixShareSave");
    if (s) return s;
    s = document.createElement("div");
    s.id = "ixShareSave";
    s.className = "ix-share-sheet";
    s.hidden = true;
    s.innerHTML = `<div class="box">
      <p id="ixShareHint"></p>
      <div id="ixShareImgs"></div>
      <div class="row">
        <button type="button" class="btn" id="ixShareX"></button>
      </div>
    </div>`;
    document.body.appendChild(s);
    s.addEventListener("click", e => { if (e.target === s) closePoster(); });
    return s;
  }
  async function blobsFor(cur) {
    const out = [];
    for (const [name, w, h] of [["landscape", 1200, 675], ["portrait", 1080, 1350]]) {
      const canvas = drawPoster(cur, w, h);
      const blob = await new Promise((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error("png")), "image/png"));
      const day = (cur.date || "").slice(0, 10);
      out.push({ name: `puregold-brief-${cur.session}-${day}-${w}x${h}.png`, blob, canvas, w, h, size: name });
    }
    return out;
  }
  function ixToast(msg) {
    if (global.ShareCard && typeof ShareCard.toast === "function") { ShareCard.toast(msg); return; }
    let el = $("shareToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "shareToast";
      el.className = "share-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("on");
    clearTimeout(ixToast._tm);
    ixToast._tm = setTimeout(() => el.classList.remove("on"), 4500);
  }
  async function posterSave(cur) {
    const L = lang();
    const sheet = ensurePosterSheet();
    const box = $("ixShareImgs");
    if (box) box.innerHTML = "";
    $("ixShareHint").textContent = L === "en" ? "Creating the image…" : "กำลังสร้างรูป…";
    $("ixShareX").textContent = tr("close");
    $("ixShareX").onclick = closePoster;
    sheet.hidden = false; sheet.classList.add("on");
    try {
      const items = await blobsFor(cur);
      if (!items.length) throw new Error("empty");
      box.innerHTML = "";
      items.forEach(it => {
        const url = URL.createObjectURL(it.blob);
        posterUrls.push(url);
        const img = document.createElement("img");
        img.src = url; img.alt = it.name;
        img.addEventListener("click", () => {
          let full = $("ixShareFull");
          if (!full) {
            full = document.createElement("div");
            full.id = "ixShareFull";
            full.className = "ix-share-full";
            full.innerHTML = `<p id="ixShareFullHint"></p><img id="ixShareFullImg" alt=""><button type="button" class="btn" id="ixShareFullX"></button>`;
            document.body.appendChild(full);
            $("ixShareFullX").onclick = () => { full.classList.remove("on"); full.hidden = true; };
          }
          $("ixShareFullHint").textContent = L === "en"
            ? "Long-press the image and choose Save Image."
            : "กดค้างที่รูป แล้วเลือกบันทึกรูป";
          $("ixShareFullX").textContent = tr("close");
          $("ixShareFullImg").src = url;
          full.hidden = false; full.classList.add("on");
        });
        box.appendChild(img);
        const a = document.createElement("a");
        a.className = "btn pri"; a.href = url; a.download = it.name;
        a.textContent = tr("save") + ` ${it.w}×${it.h}`;
        a.style.display = "inline-flex"; a.style.margin = "0 8px 8px 0";
        box.appendChild(a);
      });
      $("ixShareHint").textContent = L === "en"
        ? "Your image is ready. Tap Save, or long-press the picture and choose Save Image."
        : "รูปพร้อมแล้ว กดบันทึก หรือกดค้างที่รูปแล้วเลือกบันทึกรูป";
      const fileObjs = items.map(it => new File([it.blob], it.name, { type: "image/png" }));
      let sh = $("ixShareNative");
      if (!sh) {
        sh = document.createElement("button");
        sh.type = "button";
        sh.id = "ixShareNative";
        sh.className = "btn pri";
        $("ixShareX").parentNode.insertBefore(sh, $("ixShareX"));
      }
      const can = !!(navigator.canShare && (function () { try { return navigator.canShare({ files: fileObjs }); } catch (_) { return false; } })()) || !!navigator.share;
      sh.hidden = !can;
      sh.textContent = L === "en" ? "Share image" : "แชร์รูป";
      sh.onclick = async ev => {
        ev.preventDefault();
        const title = "PureGold · " + (L === "en" ? "Market brief" : "สรุปตลาด");
        const text = (L === "en" ? cur.text_en : cur.text_th);
        try {
          if (navigator.canShare && navigator.canShare({ files: fileObjs })) {
            await navigator.share({ files: fileObjs, title, text });
            return;
          }
          if (navigator.share) await navigator.share({ title, text, url: "https://gold.purefxai.store/" });
        } catch (e) {
          if (e && e.name === "AbortError") return;
          ixToast(L === "en" ? "Share did not complete. Long-press the image to save." : "แชร์ไม่สำเร็จ กดค้างที่รูปเพื่อบันทึก");
        }
      };
    } catch (e) {
      console.warn("brief poster save failed", e);
      const msg = L === "en"
        ? "Could not create the image. Please try again, or long-press a picture to save."
        : "บันทึกรูปไม่สำเร็จ กรุณาลองอีกครั้ง หรือกดค้างที่รูปเพื่อบันทึก";
      ixToast(msg);
      $("ixShareHint").textContent = msg;
    }
  }
  async function posterShare(cur) {
    return posterSave(cur);
  }

  /* ---------- calculators ---------- */
  function bindCalcs(cmp) {
    const card = $("calcCard");
    if (!card) return;
    showCard(card, true);
    const L = lang();
    const body = $("calcBody");
    if (body && !body.getAttribute("data-ready")) {
      body.innerHTML = `<div class="ix-calcs">
        <div>
          <h3 id="calcThaiTitle" style="margin:0 0 8px;font:600 15px Prompt,sans-serif;color:var(--gold2,#ffdf80)"></h3>
          <div class="ix-form">
            <label>${esc(tr("bar"))} / ${esc(tr("jewel"))}
              <select id="ixKind"><option value="bar">${esc(tr("bar"))}</option><option value="jewel">${esc(tr("jewel"))}</option></select>
            </label>
            <label>${esc(L==="en"?"Unit":"หน่วย")}
              <select id="ixUnit">
                <option value="baht">${esc(tr("bahtW"))}</option>
                <option value="g">${esc(tr("grams"))}</option>
                <option value="thb">${esc(tr("thb"))}</option>
              </select>
            </label>
            <label>${esc(L==="en"?"Amount":"จำนวน")}<input id="ixAmt" type="number" step="any" value="1" inputmode="decimal"></label>
          </div>
          <div class="ix-result" id="ixThaiOut">—</div>
          <p class="ix-note" id="ixThaiNote"></p>
        </div>
        <div>
          <h3 id="calcPosTitle" style="margin:0 0 8px;font:600 15px Prompt,sans-serif;color:var(--gold2,#ffdf80)"></h3>
          <div class="ix-form">
            <label>${esc(tr("balance"))}<input id="ixBal" type="number" step="any" inputmode="decimal" value="10000" placeholder="10000"></label>
            <label>${esc(tr("risk"))}<input id="ixRisk" type="number" step="any" value="1" inputmode="decimal"></label>
            <label>${esc(tr("sl"))}<input id="ixSL" type="number" step="any" value="10" inputmode="decimal"></label>
          </div>
          <div class="ix-result" id="ixPosOut"></div>
        </div>
      </div>`;
      body.setAttribute("data-ready","1");
    } else if (body && body.getAttribute("data-ready") === "1") {
      // language may have changed — rebuild once labels must switch
      if (body.getAttribute("data-lang") !== L) {
        body.removeAttribute("data-ready");
        return bindCalcs(cmp);
      }
    }
    if (body) body.setAttribute("data-lang", L);
    if ($("calcThaiTitle")) $("calcThaiTitle").textContent = tr("calcThai");
    if ($("calcPosTitle")) $("calcPosTitle").textContent = tr("calcPos");
    const sellBar = num(cmp && cmp.thai_sell);
    const sellJewel = num(cmp && cmp.jewel && cmp.jewel.sell);
    const grams = 15.244;
    const unit = $("ixUnit");
    const kind = $("ixKind");
    const amt = $("ixAmt");
    const out = $("ixThaiOut");
    const note = $("ixThaiNote");
    function priceOf() { return (kind && kind.value === "jewel" && sellJewel) ? sellJewel : sellBar; }
    function runThai() {
      if (note) note.textContent = (kind && kind.value === "jewel") ? tr("jewelNote") : tr("barNote");
      const px = priceOf();
      const v = num(amt && amt.value);
      if (!px || v == null) { if (out) out.innerHTML = "—"; return; }
      const u = unit ? unit.value : "baht";
      let bahtW = v, g = v * grams, thb = v * px;
      if (u === "g") { bahtW = v / grams; g = v; thb = bahtW * px; }
      if (u === "thb") { thb = v; bahtW = v / px; g = bahtW * grams; }
      if (out) out.innerHTML = `<b>${fmt(thb, 0)}</b> ${L === "en" ? "THB" : "บาท"}
        <div class="ix-note">${fmt(bahtW, 3)} ${esc(tr("bahtW"))} · ${fmt(g, 3)} ${esc(tr("grams"))} · ${esc(tr("thaiSell"))} ${fmt(px, 0)}</div>`;
    }
    if (unit) unit.onchange = runThai;
    if (kind) kind.onchange = runThai;
    if (amt) amt.oninput = runThai;
    runThai();

    const bal = $("ixBal"), risk = $("ixRisk"), sl = $("ixSL"), posOut = $("ixPosOut");
    function runPos() {
      const B = num(bal && bal.value), R = num(risk && risk.value), S = num(sl && sl.value);
      if (posOut && (B == null || R == null || S == null || S <= 0 || B <= 0 || R <= 0)) {
        posOut.innerHTML = `<div class="ix-note">${esc(tr("lotNote"))}</div>`;
        return;
      }
      const riskAmt = B * (R / 100);
      const lots = riskAmt / (S * 100);
      const rounded = Math.max(0, Math.round(lots * 100) / 100);
      if (posOut) posOut.innerHTML = `<b>${fmt(rounded, 2)}</b> ${esc(tr("lots"))}
        <div class="ix-note">${esc(tr("riskAmt"))} $${fmt(riskAmt, 2)}
        · 1 ${L === "en" ? "lot × $1 = $100" : "ล็อต × 1 ดอลลาร์ = 100 ดอลลาร์"}
        · ${esc(tr("lotNote"))}</div>`;
    }
    if (bal) bal.oninput = runPos;
    if (risk) risk.oninput = runPos;
    if (sl) sl.oninput = runPos;
    runPos();
  }

  /* ---------- boot ---------- */
  const state = {};
  function rerender() {
    if (state.brief) renderBrief(state.brief);
    if (state.events) renderCalendar(state.events);
    if (state.fg) renderFearGreed(state.fg);
    if (state.cot) renderCot(state.cot);
    if (state.compare) renderCompare(state.compare);
    if (state.dollar) renderDollar(state.dollar);
    bindCalcs(state.compare || null);
  }

  async function boot() {
    injectCss();
    const [events, cot, fg, compare, brief, dollar] = await Promise.all([
      loadJSON("events.json"),
      loadJSON("cot.json"),
      loadJSON("feargreed.json"),
      loadJSON("compare.json"),
      loadJSON("brief.json"),
      loadJSON("dollar.json")
    ]);
    state.events = events; state.cot = cot; state.fg = fg; state.compare = compare; state.brief = brief; state.dollar = dollar;
    rerender();
  }

  function watchLang() {
    new MutationObserver(() => rerender()).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    document.addEventListener("click", ev => {
      const t = ev.target.closest && ev.target.closest("#bth,#ben,.langtog");
      if (t) setTimeout(rerender, 30);
    });
  }

  global.PureGoldInsights = { boot, rerender, loadJSON, VERSION };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { watchLang(); boot(); });
  else { watchLang(); boot(); }
})(window);
