/* PUREGOLD share posters: purpose-built 1200x675 + 1080x1350 social graphics. */
(function (global) {
  const SITE = "gold.purefxai.store";
  const VERSION = "20261111plan1";
  const SITE_URL = "https://gold.purefxai.store/";
  const SIZES = { landscape: [1200, 675], portrait: [1080, 1350] };
  const TH_M = "ม.ค. ก.พ. มี.ค. เม.ย. พ.ค. มิ.ย. ก.ค. ส.ค. ก.ย. ต.ค. พ.ย. ธ.ค.".split(" ");
  const EN_M = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
  const GOLD = "#f5c542";
  const GOLD2 = "#e0c36a";
  const MUTED = "#b7ad96";
  const TX = "#f4efe3";
  const UP = "#22e39a";
  const DN = "#ff4d6d";
  const FONT = 'Prompt, "Noto Sans Thai", "IBM Plex Sans Thai", sans-serif';
  const MONO = '"JetBrains Mono", ui-monospace, monospace';

  const enLang = () => (global.LANG === "en" || (typeof global.EN === "function" && global.EN()));
  const num = (n) => { const v = Number(n); return Number.isFinite(v) ? v : null; };
  const fmt = (n, d) => {
    const v = num(n);
    if (v == null) return "—";
    const dd = d == null ? 2 : d;
    return v.toLocaleString("en-US", { minimumFractionDigits: dd, maximumFractionDigits: dd });
  };
  const chg = (n, d) => {
    const v = num(n);
    if (v == null) return "—";
    const dd = d == null ? 2 : d;
    const a = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: dd, maximumFractionDigits: dd });
    if (Math.abs(v) < 5e-5) return (0).toFixed(dd);
    return (v > 0 ? "+" : "−") + a;
  };
  const unitTon = (lang) => (lang === "en" ? "tonnes" : "ตัน");
  const withTon = (n, lang, d) => chg(n, d) + " " + unitTon(lang);
  const fmtUsdShort = (n, lang) => {
    if (n == null || !isFinite(Number(n))) return "—";
    const v = Math.abs(Number(n)), sign = Number(n) < 0 ? "−" : "";
    if (v >= 1e9) return sign + "$" + (v / 1e9).toFixed(2) + (lang === "en" ? " bn" : " พันล้าน");
    if (v >= 1e6) return sign + "$" + (v / 1e6).toFixed(1) + (lang === "en" ? " million" : " ล้าน");
    return sign + "$" + Math.round(v).toLocaleString("en-US");
  };
  const isiOS = () => {
    const ua = navigator.userAgent || "";
    return /iP(ad|hone|od)/.test(ua) || ((navigator.platform === "MacIntel" || /Mac/.test(ua)) && navigator.maxTouchPoints > 1);
  };

  function nowBkk() {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  }
  function fmtBkk(date, lang, compact) {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d)) return "—";
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).formatToParts(d);
    const g = k => +parts.find(p => p.type === k).value;
    const day = g("day"), mo = g("month"), yr = g("year");
    const hh = String(g("hour")).padStart(2, "0"), mm = String(g("minute")).padStart(2, "0"), ss = String(g("second")).padStart(2, "0");
    if (lang === "en") return compact ? `${day} ${EN_M[mo - 1]} ${yr} ${hh}:${mm}:${ss} Bangkok` : `${day} ${EN_M[mo - 1]} ${yr} ${hh}:${mm}:${ss} Bangkok time`;
    return `${day} ${TH_M[mo - 1]} ${yr} ${hh}:${mm}:${ss} น. เวลาไทย`;
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
  function normalizeBar(b) {
    if (!b) return null;
    if (Array.isArray(b)) {
      let t = b[0], o = b[1], h = b[2], l = b[3], c = b[4];
      if (t != null && t < 1e12) t *= 1000;
      if (c == null) return null;
      return { t, o: o ?? c, h: h ?? c, l: l ?? c, c };
    }
    let t = b.t ?? b.time ?? b.ts;
    if (t != null && t < 1e12) t *= 1000;
    const c = b.c ?? b.close ?? b.price;
    if (c == null) return null;
    const o = b.o ?? b.open ?? c, h = b.h ?? b.high ?? c, l = b.l ?? b.low ?? c;
    return { t, o, h, l, c };
  }
  function packBars(arr) { return (arr || []).map(normalizeBar).filter(Boolean); }
  function parseLevels(arr) {
    if (!arr) return [];
    if (!Array.isArray(arr) && typeof arr === "object") {
      const out = [];
      ["r3", "r2", "r1", "pp", "s1", "s2", "s3"].forEach(k => {
        if (arr[k] != null) out.push({ price: Number(arr[k]), label: k.toUpperCase() });
      });
      return out.filter(x => Number.isFinite(x.price));
    }
    return arr.map(s => {
      if (s && typeof s === "object" && s.price != null) return { price: Number(s.price), label: s.label || "" };
      const raw = String(s);
      const m = raw.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
      if (!m) return null;
      const label = raw.replace(/^[0-9,.\s]+/, "").replace(/[()]/g, "").trim();
      return { price: Number(m[1]), label };
    }).filter(x => x && Number.isFinite(x.price));
  }

  function dayFromD1(d1, lastPrice) {
    const rows = packBars(d1);
    if (rows.length < 2) return {};
    const prev = rows[rows.length - 2], today = rows[rows.length - 1];
    const prevClose = prev.c, dayOpen = today.o;
    const px = lastPrice != null ? Number(lastPrice) : today.c;
    if (!Number.isFinite(prevClose) || !Number.isFinite(px)) return { prevClose, dayOpen };
    return { prevClose, dayOpen, change: px - prevClose, changePct: ((px - prevClose) / prevClose) * 100 };
  }
  function prevCloseFromIntraday(bars) {
    const rows = packBars(bars);
    if (rows.length < 8) return {};
    const iso = t => new Date(t).toISOString().slice(0, 10);
    const lastDay = iso(rows[rows.length - 1].t);
    let prevClose, dayOpen;
    for (let i = rows.length - 1; i >= 0; i--) {
      if (iso(rows[i].t) < lastDay) { prevClose = rows[i].c; break; }
    }
    const first = rows.find(b => iso(b.t) === lastDay);
    if (first) dayOpen = first.o;
    return { prevClose, dayOpen };
  }

  function attachMarket(m) {
    global.__SHARE_MARKET = Object.assign(global.__SHARE_MARKET || {}, m || {});
    return global.__SHARE_MARKET;
  }
  async function loadDollar() {
    const urls = ["dollar.json", "/dollar.json", "data/dollar.json", "/data/dollar.json", "https://dashboard.purefxai.store/dollar.json", "https://gold.purefxai.store/data/dollar.json"];
    for (const u of urls) {
      try {
        const r = await fetch(u + (u.includes("?") ? "&" : "?") + "t=" + Date.now(), { cache: "no-store" });
        if (!r || !r.ok) continue;
        const j = await r.json();
        if (j && j.dxy) { attachMarket({ dollar: j }); global.__DOLLAR = j; return j; }
      } catch (_) {}
    }
    return null;
  }
  function isAndroid() { return /Android/i.test(navigator.userAgent || ""); }
  function staticPngUrl(kind, w, h) {
    const name = "latest-" + kind + "-" + w + "x" + h + ".png";
    try { return new URL("/share/" + name, location.origin).href; }
    catch (_) { return "https://gold.purefxai.store/share/" + name; }
  }
  function cacheBust(url) { return url + (url.includes("?") ? "&" : "?") + "v=" + VERSION; }
  function probeImg(url) {
    return new Promise(resolve => {
      const im = new Image();
      im.onload = () => resolve(true);
      im.onerror = () => resolve(false);
      im.src = url;
    });
  }
  async function loadMarket(urls) {
    const list = urls && urls.length ? urls : [
      "candles.json",
      "https://dashboard.purefxai.store/candles.json",
      "assets/xau-klines.json",
      "/assets/xau-klines.json"
    ];
    for (const raw of list) {
      try {
        const join = raw.includes("?") ? "&" : "?";
        const r = await fetch(raw + join + "t=" + Date.now(), { cache: "no-store" });
        if (!r.ok) continue;
        const j = await r.json();
        if (j && j.candles && (j.candles.D1 || j.candles.H1 || j.candles.M15)) {
          const pack = tf => packBars(j.candles[tf]);
          const d1 = pack("D1");
          const info = dayFromD1(d1, j.spot);
          attachMarket({
            prevClose: info.prevClose, dayOpen: info.dayOpen,
            barsM15: pack("M15").slice(-120),
            barsH1: pack("H1").slice(-80),
            d1, spot: j.spot, source: "candles"
          });
          await Promise.all([loadThaiGold(), loadPivots()]);
          return global.__SHARE_MARKET;
        }
        const series = j && (j.closes || j.klines || j.bars);
        if (Array.isArray(series) && series.length > 2) {
          const bars = packBars(series);
          const info = prevCloseFromIntraday(bars);
          attachMarket({
            prevClose: info.prevClose, dayOpen: info.dayOpen,
            barsH1: bars, barsM15: bars, spot: j.spot, source: "klines"
          });
          await Promise.all([loadThaiGold(), loadPivots()]);
          return global.__SHARE_MARKET;
        }
      } catch (_) {}
    }
    await Promise.all([loadThaiGold(), loadPivots()]);
    return global.__SHARE_MARKET || null;
  }

  function parseBaht(v) {
    if (v == null || v === "") return null;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    const n = Number(String(v).replace(/,/g, "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  function officialFromDoc(j) {
    if (!j || (!j.bar && !j.jewelry)) return null;
    const bar = j.bar || {};
    return {
      buy: bar.buy, sell: bar.sell, change: bar.change,
      time: j.as_of || j.as_of_hm || "",
      as_of_hm: j.as_of_hm,
      as_of_th: j.as_of_th,
      source: j.source_label_th || "ราคาทองไทย",
      bar: j.bar || null,
      jewelry: j.jewelry || null
    };
  }
  function pickThai(rows) {
    if (rows && (rows.bar || rows.jewelry)) return officialFromDoc(rows);
    const list = Array.isArray(rows) ? rows : [];
    const by = (typ) => list.find(x => String(x.GoldType || "").toUpperCase() === typ && String(x.GoldCode || "").startsWith("96"));
    const ref = by("REF"), jewel = by("JEWEL");
    const primary = ref || jewel;
    if (!primary) return null;
    return officialFromDoc({
      as_of: primary.TimeUpdate || "",
      as_of_hm: String(primary.TimeUpdate || "").slice(11, 16),
      as_of_th: "อัปเดตล่าสุด " + String(primary.TimeUpdate || "").slice(11, 16),
      source_label_th: "ราคาทองไทย",
      bar: ref ? { buy: parseBaht(ref.Buy), sell: parseBaht(ref.Sell), change: parseBaht(ref.BuyChange) } : null,
      jewelry: jewel ? { buy: parseBaht(jewel.Buy), sell: parseBaht(jewel.Sell), change: parseBaht(jewel.BuyChange) } : null
    });
  }
  function floorPivots(h, l, c) {
    const pp = (h + l + c) / 3;
    return { pp, r1: 2 * pp - l, s1: 2 * pp - h, r2: pp + (h - l), s2: pp - (h - l), r3: h + 2 * (pp - l), s3: l - 2 * (h - pp) };
  }
  function pivotsFromD1(d1) {
    const rows = packBars(d1);
    if (rows.length < 2) return null;
    // Use last completed daily bar (previous session if the last bar is today in progress)
    const bar = rows[rows.length - 2];
    if (![bar.h, bar.l, bar.c].every(Number.isFinite)) return null;
    return floorPivots(bar.h, bar.l, bar.c);
  }
  function pivotsFromLevels(L) {
    const d = L && (L.daily || L);
    if (!d || d.r1 == null || d.s1 == null) return null;
    return { pp: d.pp, r1: d.r1, r2: d.r2, r3: d.r3, s1: d.s1, s2: d.s2, s3: d.s3 };
  }
  async function loadThaiGold() {
    const urls = [
      "thai_gold.json",
      "data/thai_gold.json",
      "assets/thai_gold.json",
      "https://gold.purefxai.store/data/thai_gold.json",
      "https://dashboard.purefxai.store/thai_gold.json",
      "https://apicheckprice.huasengheng.com/api/values/getprice/"
    ];
    for (const u of urls) {
      try {
        const r = await fetch(u + (u.includes("?") ? "&" : "?") + "t=" + Date.now(), { cache: "no-store" });
        if (!r.ok) continue;
        const a = await r.json();
        const thai = pickThai(a);
        if (thai && (thai.buy != null || thai.sell != null || (thai.bar && thai.bar.buy != null))) {
          attachMarket({ thai, thaiRaw: a });
          return thai;
        }
      } catch (_) {}
    }
    if (global.LAST_THAI) {
      const thai = pickThai(global.LAST_THAI);
      if (thai) attachMarket({ thai, thaiRaw: global.LAST_THAI });
      return thai;
    }
    if (global.thaiGold) {
      const thai = pickThai(global.thaiGold);
      if (thai) attachMarket({ thai, thaiRaw: global.thaiGold });
      return thai;
    }
    return null;
  }
  async function loadPivots() {
    const urls = ["assets/levels.json", "/assets/levels.json", "https://gold.purefxai.store/assets/levels.json"];
    for (const u of urls) {
      try {
        const r = await fetch(u + (u.includes("?") ? "&" : "?") + "t=" + Date.now(), { cache: "no-store" });
        if (!r.ok) continue;
        const j = await r.json();
        const pv = pivotsFromLevels(j);
        if (pv) { attachMarket({ pivots: pv, levels: j }); return pv; }
      } catch (_) {}
    }
    const m = global.__SHARE_MARKET || {};
    if (m.d1) {
      const pv = pivotsFromD1(m.d1);
      if (pv) { attachMarket({ pivots: pv }); return pv; }
    }
    if (global.__levels) {
      const pv = pivotsFromLevels(global.__levels);
      if (pv) { attachMarket({ pivots: pv }); return pv; }
    }
    return null;
  }

  function biasFromSpot(spot, daily) {
    const px = Number(spot);
    if (!Number.isFinite(px) || !daily) return null;
    const s1 = Number(daily.s1), r1 = Number(daily.r1);
    let biasTh, biasEn;
    if (Number.isFinite(r1) && px > r1) { biasTh = "ราคาอยู่เหนือแนวต้าน R1 — โมเมนตัมขาขึ้น"; biasEn = "Price is above resistance R1 — bullish momentum"; }
    else if (Number.isFinite(s1) && px < s1) { biasTh = "ราคาอยู่ต่ำกว่าแนวรับ S1 — โมเมนตัมขาลง"; biasEn = "Price is below support S1 — bearish momentum"; }
    else { biasTh = "ราคายืนในกรอบ S1–R1"; biasEn = "Price is holding inside the S1–R1 range"; }
    return { biasTh, biasEn };
  }

  async function fetchLiveSpot() {
    const hits = [];
    try {
      const r = await fetch("https://api.gold-api.com/price/XAU", { cache: "no-store" });
      if (r && r.ok) {
        const j = await r.json();
        const px = Number(j && j.price);
        const at = Date.parse(j && j.updatedAt) || Date.now();
        if (px > 0) hits.push({ price: px, at, src: "gold-api.com" });
      }
    } catch (_) {}
    const spots = ["spot.json", "/spot.json", "https://dashboard.purefxai.store/spot.json"];
    for (const u of spots) {
      try {
        const r = await fetch(u + (u.includes("?") ? "&" : "?") + "t=" + Date.now(), { cache: "no-store" });
        if (!r || !r.ok) continue;
        const j = await r.json();
        const px = Number(j && (j.price != null ? j.price : j.xau));
        if (px > 0) {
          const at = Date.parse(j.fetched_at || j.updated_utc || j.updated) || Date.now();
          hits.push({ price: px, at, src: j.src || "spot.json" });
          break;
        }
      } catch (_) {}
    }
    if (global.live && Number(global.live.price) > 0) {
      hits.push({ price: Number(global.live.price), at: global.live.tickAt || Date.now(), src: global.live.src || "page" });
    } else if (Number(global.__spotXau) > 0) {
      hits.push({ price: Number(global.__spotXau), at: global.__liveSpotAt || Date.now(), src: "page" });
    }
    if (!hits.length) return null;
    hits.sort((a, b) => (b.at || 0) - (a.at || 0));
    return hits[0];
  }

  async function loadPerfData() {
    if (global.__PERF_LIVE && global.__PERF_LIVE.periods) return global.__PERF_LIVE;
    if (global.__PERF && global.__PERF.periods) return global.__PERF;
    const urls = ["perf.json", "/perf.json", "assets/perf.json", "/assets/perf.json", "https://dashboard.purefxai.store/perf.json", "https://gold.purefxai.store/assets/perf.json"];
    for (const u of urls) {
      try {
        const r = await fetch(u + (u.includes("?") ? "&" : "?") + "t=" + Date.now(), { cache: "no-store" });
        if (!r || !r.ok) continue;
        const j = await r.json();
        if (j && j.periods) { global.__PERF_LIVE = j; return j; }
      } catch (_) {}
    }
    return null;
  }

  function perfWithLive(data, livePx) {
    if (!data || !Array.isArray(data.periods) || !(Number(livePx) > 0)) return data;
    const periods = data.periods.map(pe => {
      const ref = Number(pe && pe.ref_close);
      if (!(ref > 0)) return null;
      const change = Number(livePx) - ref;
      return Object.assign({}, pe, { change, change_pct: change / ref * 100 });
    }).filter(Boolean);
    return Object.assign({}, data, { spot: Number(livePx), periods });
  }

  async function refreshLivePayload(kind, payload) {
    const out = Object.assign({}, payload || {});
    const lang = out.lang || (enLang() ? "en" : "th");
    out.lang = lang;
    try { await Promise.all([loadMarket(), loadPivots(), loadDollar(), loadPerfData()]); } catch (_) {}
    const tick = await fetchLiveSpot();
    const when = (tick && tick.at) ? new Date(tick.at) : new Date();
    if (tick && tick.price > 0) {
      out.price = tick.price;
      out.source = tick.src;
    }
    out.asOf = when.toISOString();
    out.asOfMs = when.getTime();
    out.time = fmtBkk(when, lang, true);
    const daily = ((global.__SHARE_MARKET || {}).levels || global.__levels || {}).daily;
    if (daily && Number(out.price) > 0) {
      const b = biasFromSpot(out.price, daily);
      if (b) {
        out.align = lang === "en" ? b.biasEn : b.biasTh;
        out.alignEn = b.biasEn;
        out.bias = out.align;
      }
    }
    const perf = await loadPerfData();
    if (perf && Number(out.price) > 0) out.perf = perfWithLive(perf, out.price);
    if (out.prevClose == null) {
      const m = global.__SHARE_MARKET || {};
      if (m.prevClose != null) out.prevClose = m.prevClose;
    }
    if (out.prevClose != null && Number(out.price) > 0) {
      const px = Number(out.price), prev = Number(out.prevClose);
      if (prev) {
        out.change = px - prev;
        out.changePct = (px - prev) / prev * 100;
        out.changeKnown = true;
        out.changeBasis = "prevClose";
      }
    }
    return enrich(kind, out);
  }

  function enrich(kind, p) {
    const m = global.__SHARE_MARKET || {};
    const out = Object.assign({}, p || {});
    if (!out.bars || !out.bars.length) out.bars = (kind === "spdr" ? null : (kind === "price" ? (m.barsM15 || m.barsH1) : (m.barsH1 || m.barsM15)));
    if (!out.barsH1 || !out.barsH1.length) out.barsH1 = m.barsH1 || m.barsM15;
    if (out.prevClose == null) out.prevClose = m.prevClose;
    if (out.dayOpen == null) out.dayOpen = m.dayOpen;
    if (out.price == null && m.spot != null) out.price = m.spot;
    if (kind !== "spdr" && (kind === "price" || out.changeKnown || out.change == null) && out.prevClose != null && out.price != null) {
      const px = Number(out.price), prev = Number(out.prevClose);
      if (Number.isFinite(px) && Number.isFinite(prev) && prev !== 0) {
        out.change = px - prev;
        out.changePct = (px - prev) / prev * 100;
        out.changeKnown = true;
        out.changeBasis = "prevClose";
      }
    }
    if (!out.support || !out.support.length) {
      out.support = parseLevels(out.support || (global.D && global.D.support) || (global.__levels && global.__levels.daily && [global.__levels.daily.s1, global.__levels.daily.s2]));
    } else out.support = parseLevels(out.support);
    if (!out.resistance || !out.resistance.length) {
      out.resistance = parseLevels(out.resistance || (global.D && global.D.resistance) || (global.__levels && global.__levels.daily && [global.__levels.daily.r1, global.__levels.daily.r2]));
    } else out.resistance = parseLevels(out.resistance);
    if ((!out.support || !out.support.length) && global.__levels && global.__levels.daily) {
      const L = global.__levels.daily;
      out.support = [{ price: L.s1, label: "S1" }, { price: L.s2, label: "S2" }].filter(x => Number.isFinite(x.price));
      out.resistance = [{ price: L.r1, label: "R1" }, { price: L.r2, label: "R2" }].filter(x => Number.isFinite(x.price));
    }
    const m2 = global.__SHARE_MARKET || {};
    if (!out.thai) out.thai = m2.thai || pickThai(global.LAST_THAI || global.thaiGold);
    if (out.impliedGold != null && out.implied_gold_usd == null) out.implied_gold_usd = out.impliedGold;
    if (out.flowValueUsd != null && out.flow_value_usd == null) out.flow_value_usd = out.flowValueUsd;
    if (out.navPerShare != null && out.nav_per_share == null) out.nav_per_share = out.navPerShare;

    if (!out.pivots) out.pivots = m2.pivots || pivotsFromLevels(global.__levels) || (m2.d1 ? pivotsFromD1(m2.d1) : null);
    if (out.pivots) {
      const pv = out.pivots;
      out.resistance = [{ price: pv.r1, label: "R1" }, { price: pv.r2, label: "R2" }, { price: pv.r3, label: "R3" }].filter(x => Number.isFinite(x.price));
      out.support = [{ price: pv.s1, label: "S1" }, { price: pv.s2, label: "S2" }, { price: pv.s3, label: "S3" }].filter(x => Number.isFinite(x.price));
    }
    if (!out.dollar) out.dollar = m2.dollar || global.__DOLLAR || null;
    if (!out.plan) out.plan = p && p.plan || global.__TRADE_PLAN || null;
    if (!out.mtf || !out.mtf.length) {
      const D = global.D;
      if (D && D.mtf) out.mtf = (out.lang === "en" ? (D.mtf_en || D.mtf) : D.mtf);
      if (D && !out.align) out.align = D.mtf_align;
      if (D && !out.alignEn) out.alignEn = D.mtf_align_en;
    }
    return out;
  }


  const brand = { lockup: null, bgLand: null, bgPort: null };

  function isSameOrigin(url) {
    try {
      if (!url || /^(data:|blob:)/i.test(url)) return true;
      if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) return true;
      return new URL(url, location.href).origin === location.origin;
    } catch (_) { return false; }
  }
  function loadImg(url) {
    return new Promise((resolve, reject) => {
      if (!isSameOrigin(url)) return reject(new Error("cross-origin " + url));
      const im = new Image();
      im.onload = async () => {
        try { if (im.decode) await im.decode(); } catch (_) {}
        resolve(im);
      };
      im.onerror = () => reject(new Error(url));
      im.src = url;
    });
  }
  async function loadFirst(urls) {
    for (const u of urls) {
      try { return await loadImg(u); } catch (_) {}
    }
    return null;
  }
  async function preloadBrand() {
    if (!brand._loading) {
      brand._loading = Promise.all([
        loadFirst(["assets/logo-lockup.png", "logo-lockup.png", "/assets/logo-lockup.png", "https://gold.purefxai.store/assets/logo-lockup.png", "assets/logo-lockup.svg", "logo-lockup.svg", "/assets/logo-lockup.svg"]).then(im => { brand.lockup = im; }),
        loadFirst(["assets/share-bg-16x9.webp", "assets/share-bg-16x9.jpg", "share-bg-16x9.webp", "share-bg-16x9.jpg"]).then(im => { brand.bgLand = im; }),
        loadFirst(["assets/share-bg-4x5.webp", "assets/share-bg-4x5.jpg", "share-bg-4x5.webp", "share-bg-4x5.jpg"]).then(im => { brand.bgPort = im; })
      ]);
    }
    try { await brand._loading; } catch (_) {}
    return brand;
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

  function drawBackdrop(ctx, W, H, bars) {
    ctx.fillStyle = "#0b0a08";
    ctx.fillRect(0, 0, W, H);
    const plate = H > 900 ? brand.bgPort : brand.bgLand;
    if (plate && plate.naturalWidth) {
      ctx.drawImage(plate, 0, 0, W, H);
      const veil = ctx.createLinearGradient(0, 0, 0, H);
      veil.addColorStop(0, "rgba(8,7,6,0.28)");
      veil.addColorStop(0.45, "rgba(8,7,6,0.40)");
      veil.addColorStop(1, "rgba(8,7,6,0.55)");
      ctx.fillStyle = veil;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(245,197,66,0.32)";
      ctx.lineWidth = 3;
      ctx.strokeRect(1.5, 1.5, W - 3, H - 3);
      ctx.strokeStyle = "rgba(245,197,66,0.10)";
      ctx.lineWidth = 1;
      ctx.strokeRect(11, 11, W - 22, H - 22);
      return;
    }
    const wash = ctx.createLinearGradient(0, 0, W, H);
    wash.addColorStop(0, "rgba(201,154,40,0.20)");
    wash.addColorStop(0.45, "rgba(80,55,12,0.08)");
    wash.addColorStop(1, "rgba(12,10,8,0.35)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, W, H);
    const rad = ctx.createRadialGradient(W * 0.18, H * 0.08, 10, W * 0.2, H * 0.15, W * 0.7);
    rad.addColorStop(0, "rgba(245,197,66,0.18)");
    rad.addColorStop(1, "rgba(245,197,66,0)");
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, W, H);
    const rad2 = ctx.createRadialGradient(W * 0.85, H * 0.85, 8, W * 0.8, H * 0.8, W * 0.55);
    rad2.addColorStop(0, "rgba(245,197,66,0.07)");
    rad2.addColorStop(1, "rgba(245,197,66,0)");
    ctx.fillStyle = rad2;
    ctx.fillRect(0, 0, W, H);

    const series = packBars(bars);
    if (series.length > 3) {
      const cs = series.map(b => b.c);
      let lo = Math.min(...cs), hi = Math.max(...cs);
      const pad = (hi - lo) * 0.45 || 1;
      lo -= pad; hi += pad;
      ctx.beginPath();
      ctx.moveTo(0, H);
      series.forEach((b, i) => {
        const x = (i / (series.length - 1)) * W;
        const y = H * 0.22 + (1 - (b.c - lo) / (hi - lo)) * (H * 0.68);
        ctx.lineTo(x, y);
      });
      ctx.lineTo(W, H);
      ctx.closePath();
      const sg = ctx.createLinearGradient(0, H * 0.2, 0, H);
      sg.addColorStop(0, "rgba(245,197,66,0.10)");
      sg.addColorStop(1, "rgba(245,197,66,0.00)");
      ctx.fillStyle = sg;
      ctx.fill();
      ctx.beginPath();
      series.forEach((b, i) => {
        const x = (i / (series.length - 1)) * W;
        const y = H * 0.22 + (1 - (b.c - lo) / (hi - lo)) * (H * 0.68);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = "rgba(245,197,66,0.16)";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.strokeStyle = "rgba(245,197,66,0.045)";
      ctx.lineWidth = 1;
      for (let x = 40; x < W; x += 56) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 40; y < H; y += 56) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    }

    const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.72);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.28)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(245,197,66,0.32)";
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, W - 3, H - 3);
    ctx.strokeStyle = "rgba(245,197,66,0.10)";
    ctx.lineWidth = 1;
    ctx.strokeRect(11, 11, W - 22, H - 22);
  }

  function drawLockup(ctx, x, y, scale) {
    const mark = Math.round(64 * scale);
    if (brand.lockup && brand.lockup.naturalWidth) {
      const ratio = brand.lockup.naturalWidth / brand.lockup.naturalHeight || (420 / 64);
      const h = mark, w = h * ratio;
      ctx.drawImage(brand.lockup, x, y, w, h);
      return mark;
    }
    drawMark(ctx, x, y, mark);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = GOLD;
    ctx.font = `700 ${Math.round(30 * scale)}px ${FONT}`;
    ctx.fillText("PureGold", x + mark + 14, y + mark * 0.50);
    ctx.fillStyle = GOLD2;
    ctx.font = `600 ${Math.round(14 * scale)}px ${FONT}`;
    ctx.fillText("by PureFxAi", x + mark + 14, y + mark * 0.50 + Math.round(20 * scale));
    return mark;
  }

  function drawDollarStrip(ctx, x, y, w, h, dollar, lang) {
    if (!dollar || !dollar.dxy) return 0;
    glassPanel(ctx, x, y, w, h, 10);
    const dxy = dollar.dxy;
    const fed = dollar.fed || {};
    const an = dollar.analysis || {};
    const ch = dxy.change;
    const chs = ch == null ? "" : ("  " + chg(ch, 2));
    const probs = fed.probs || [];
    const top = probs.reduce((a, b) => (!a || (b.p || 0) > (a.p || 0)) ? b : a, null);
    let fedL = "";
    if (top && fed.next_fomc) {
      fedL = lang === "en"
        ? ("Next FOMC " + (fed.next_fomc_en || fed.next_fomc) + " · " + Math.round(top.p * 100) + "% " + (top.label_en || ""))
        : ("เฟดครั้งถัดไป " + (fed.next_fomc_th || fed.next_fomc) + " · " + Math.round(top.p * 100) + "% " + (top.label_th || ""));
    }
    const analysis = (lang === "en" ? (an.en || "") : (an.th || "")).replace(/\s*·\s*(For education only|ข้อมูลเพื่อการศึกษา)[^.。]*$/, "");
    const parts = ["DXY  " + fmt(dxy.price, 2) + chs];
    if (fedL) parts.push(fedL);
    if (analysis) parts.push(analysis);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = GOLD2;
    ctx.font = `600 12px ${FONT}`;
    fillFit(ctx, parts.join("  ·  "), x + 12, y + h / 2, w - 24);
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    return h;
  }

  function drawFooter(ctx, W, H, lang, when) {
    const dollar = ((global.__SHARE_MARKET || {}).dollar) || global.__DOLLAR;
    let reserve = 0;
    if (dollar && dollar.dxy) {
      reserve = 36;
      drawDollarStrip(ctx, 44, H - 54 - reserve, W - 88, 28, dollar, lang);
    }
    const y = H - 32;
    const rule = H - 54 - reserve;
    ctx.strokeStyle = "rgba(245,197,66,0.20)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(44, rule); ctx.lineTo(W - 44, rule); ctx.stroke();
    const size = H > 1000 ? 15 : 13;
    ctx.textBaseline = "middle";
    const stamp = when ? fmtBkk(when, lang, true) : fmtBkk(new Date(), lang, true);
    const disc = lang === "en" ? "Education only — not investment advice" : "เพื่อการศึกษา ไม่ใช่คำแนะนำการลงทุน";
    const leftMax = W * 0.34, rightMax = W * 0.34;
    ctx.fillStyle = MUTED;
    ctx.textAlign = "left";
    fitFont(ctx, stamp, leftMax, "500", size, FONT, 10);
    fillFit(ctx, stamp, 48, y, leftMax);
    ctx.textAlign = "center";
    ctx.fillStyle = GOLD;
    ctx.font = `500 ${size}px ${FONT}`;
    fillFit(ctx, SITE, W / 2, y, W * 0.26);
    ctx.textAlign = "right";
    ctx.fillStyle = MUTED;
    fitFont(ctx, disc, rightMax, "500", size, FONT, 10);
    fillFit(ctx, disc, W - 48, y, rightMax);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    return rule - 16;
  }

  function headerBox(ctx, W, H, lang, bars, scale, p) {
    drawBackdrop(ctx, W, H, bars);
    const mark = drawLockup(ctx, 44, 28, scale || (H > 1000 ? 1.15 : 1));
    const when = p && (p.asOfMs || p.asOf || p.time) ? (p.asOfMs || p.asOf || p.time) : new Date();
    const bottom = drawFooter(ctx, W, H, lang, when);
    return { top: 28 + mark + 18, bottom, left: 48, right: W - 48, mid: (48 + W - 48) / 2 };
  }

  function wrapText(ctx, text, x, y, maxW, lh, maxLines) {
    const raw = String(text || "");
    const hasSpace = /\s/.test(raw);
    const parts = hasSpace ? raw.split(/\s+/) : Array.from(raw);
    const lines = [];
    let line = "";
    const glue = hasSpace ? " " : "";
    parts.forEach((w, i) => {
      const test = line ? line + glue + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
      else line = test;
      if (i === parts.length - 1 && line) lines.push(line);
    });
    const use = lines.slice(0, maxLines || 4);
    if (lines.length > use.length) use[use.length - 1] = use[use.length - 1].replace(/[.…]*$/, "…");
    use.forEach((ln, i) => ctx.fillText(ln, x, y + i * lh));
    return y + use.length * lh;
  }

  function fontSizeOf(ctx) {
    const m = String(ctx.font || "").match(/([\d.]+)px/);
    return m ? parseFloat(m[1]) : 14;
  }
  function ellipsize(ctx, text, maxW) {
    const s = String(text == null ? "" : text);
    if (!(maxW > 0)) return "";
    if (ctx.measureText(s).width <= maxW) return s;
    const ell = "…";
    if (ctx.measureText(ell).width > maxW) return "";
    let lo = 0, hi = s.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (ctx.measureText(s.slice(0, mid) + ell).width <= maxW) lo = mid;
      else hi = mid - 1;
    }
    return s.slice(0, lo) + ell;
  }
  function fitFont(ctx, text, maxW, weight, size, family, minSize) {
    let s = size;
    const fam = family || FONT;
    const min = minSize || 10;
    while (s > min) {
      ctx.font = `${weight} ${s}px ${fam}`;
      if (ctx.measureText(String(text || "")).width <= maxW) return s;
      s -= 1;
    }
    ctx.font = `${weight} ${min}px ${fam}`;
    return min;
  }
  function fillFit(ctx, text, x, y, maxW) {
    const t = ellipsize(ctx, text, maxW);
    ctx.fillText(t, x, y);
    return t;
  }

  function glassPanel(ctx, x, y, w, h, r) {
    const rad = r == null ? 20 : r;
    rr(ctx, x, y, w, h, rad);
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, "rgba(255,255,255,0.16)");
    g.addColorStop(0.4, "rgba(255,255,255,0.07)");
    g.addColorStop(1, "rgba(255,255,255,0.03)");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    rr(ctx, x, y, w, Math.max(16, h * 0.38), rad);
    ctx.clip();
    const hg = ctx.createLinearGradient(x, y, x, y + h * 0.38);
    hg.addColorStop(0, "rgba(255,255,255,0.22)");
    hg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = hg;
    ctx.fillRect(x, y, w, h * 0.38);
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.32)";
    ctx.lineWidth = 1.4;
    rr(ctx, x, y, w, h, rad); ctx.stroke();
    ctx.strokeStyle = "rgba(245,197,66,0.16)";
    ctx.lineWidth = 0.8;
    rr(ctx, x + 2.5, y + 2.5, w - 5, h - 5, Math.max(0, rad - 2)); ctx.stroke();
  }
  function pane(ctx, x, y, w, h) { glassPanel(ctx, x, y, w, h, 18); }

  function yScale(rows, extra, hPad) {
    const vals = [];
    rows.forEach(b => { vals.push(b.c); if (b.h != null) vals.push(b.h); if (b.l != null) vals.push(b.l); });
    (extra || []).forEach(v => { if (v != null && Number.isFinite(Number(v))) vals.push(Number(v)); });
    if (!vals.length) return { lo: 0, hi: 1, y: (v, y, h) => y + h / 2 };
    let lo = Math.min(...vals), hi = Math.max(...vals);
    const pad = (hi - lo) * (hPad == null ? 0.10 : hPad) || 1;
    lo -= pad; hi += pad;
    return { lo, hi, y: (v, y, h) => y + (1 - (v - lo) / (hi - lo)) * h };
  }

  function drawCandleChart(ctx, bars, x, y, w, h, opts) {
    const o = opts || {};
    const rows = packBars(bars);
    if (rows.length < 2) return;
    pane(ctx, x, y, w, h);
    const padL = 12, padR = o.labels === false ? 12 : 86, padT = 14, padB = 22;
    const cx = x + padL, cy = y + padT, cw = w - padL - padR, ch = h - padT - padB;
    const extras = [];
    (o.support || []).forEach(s => extras.push(s.price));
    (o.resistance || []).forEach(s => extras.push(s.price));
    if (o.last != null) extras.push(o.last);
    const sc = yScale(rows, extras, 0.12);
    const step = cw / Math.max(rows.length, 1);
    const bodyW = Math.max(2, Math.min(9, step * 0.62));

    ctx.save();
    ctx.beginPath(); ctx.rect(cx, cy, cw, ch); ctx.clip();

    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const yy = cy + (ch * i) / 3;
      ctx.beginPath(); ctx.moveTo(cx, yy); ctx.lineTo(cx + cw, yy); ctx.stroke();
    }

    const drawLevel = (lv, color, dash) => {
      if (!lv || !Number.isFinite(lv.price)) return;
      const yy = sc.y(lv.price, cy, ch);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.setLineDash(dash || [5, 5]);
      ctx.beginPath(); ctx.moveTo(cx, yy); ctx.lineTo(cx + cw, yy); ctx.stroke();
      ctx.setLineDash([]);
    };
    (o.resistance || []).slice(0, 3).forEach(lv => drawLevel(lv, "rgba(255,77,109,0.7)"));
    (o.support || []).slice(0, 3).forEach(lv => drawLevel(lv, "rgba(34,227,154,0.7)"));

    if (o.style === "line") {
      ctx.beginPath();
      rows.forEach((b, i) => {
        const px = cx + (i + 0.5) * step;
        const py = sc.y(b.c, cy, ch);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2.4;
      ctx.stroke();
    } else {
      rows.forEach((b, i) => {
        const px = cx + (i + 0.5) * step;
        const up = b.c >= b.o;
        const col = up ? UP : DN;
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(px, sc.y(b.h, cy, ch));
        ctx.lineTo(px, sc.y(b.l, cy, ch));
        ctx.stroke();
        const y1 = sc.y(b.o, cy, ch), y2 = sc.y(b.c, cy, ch);
        ctx.fillStyle = col;
        ctx.fillRect(px - bodyW / 2, Math.min(y1, y2), bodyW, Math.max(1.5, Math.abs(y2 - y1)));
      });
    }
    ctx.restore();

    if (o.last != null && rows.length) {
      const yy = Math.min(cy + ch - 8, Math.max(cy + 8, sc.y(o.last, cy, ch)));
      const lab = fmt(o.last, 2);
      ctx.font = `700 11px ${MONO}`;
      const tw = ctx.measureText(lab).width + 10;
      const lastX = cx + (rows.length - 0.5) * step;
      const tagX = Math.max(cx + 4, Math.min(lastX - tw - 8, cx + cw - tw - 4));
      ctx.fillStyle = "rgba(7,8,13,0.78)";
      rr(ctx, tagX, yy - 8, tw, 16, 4); ctx.fill();
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 1;
      rr(ctx, tagX, yy - 8, tw, 16, 4); ctx.stroke();
      ctx.fillStyle = GOLD;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(lab, tagX + 5, yy);
    }

    if (o.labels !== false) {
      const tags = [];
      (o.resistance || []).slice(0, 3).forEach(lv => { if (lv && Number.isFinite(lv.price)) tags.push({ lv, color: DN }); });
      (o.support || []).slice(0, 3).forEach(lv => { if (lv && Number.isFinite(lv.price)) tags.push({ lv, color: UP }); });
      tags.forEach(tg => {
        tg.y = Math.min(cy + ch - 7, Math.max(cy + 7, sc.y(tg.lv.price, cy, ch)));
        tg.lab = (tg.lv.label ? tg.lv.label + " " : "") + fmt(tg.lv.price, 1);
      });
      tags.sort((a, b) => a.y - b.y);
      const minGap = 15;
      for (let i = 1; i < tags.length; i++) {
        if (tags[i].y - tags[i - 1].y < minGap) tags[i].y = tags[i - 1].y + minGap;
      }
      if (tags.length && tags[tags.length - 1].y > cy + ch - 7) {
        tags[tags.length - 1].y = cy + ch - 7;
        for (let i = tags.length - 2; i >= 0; i--) {
          if (tags[i + 1].y - tags[i].y < minGap) tags[i].y = tags[i + 1].y - minGap;
        }
      }
      if (tags.length && tags[0].y < cy + 7) {
        tags[0].y = cy + 7;
        for (let i = 1; i < tags.length; i++) {
          if (tags[i].y - tags[i - 1].y < minGap) tags[i].y = tags[i - 1].y + minGap;
        }
      }
      ctx.font = `600 11px ${FONT}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const labMax = padR - 10;
      tags.forEach(tg => {
        if (tg.y < cy - 2 || tg.y > cy + ch + 2) return;
        ctx.fillStyle = tg.color;
        fillFit(ctx, tg.lab, cx + cw + 6, tg.y, labMax);
      });
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    if (o.caption) {
      ctx.fillStyle = MUTED;
      ctx.font = `500 11px ${FONT}`;
      fillFit(ctx, o.caption, x + 14, y + h - 8, Math.max(40, w - padR - 20));
    }
  }

  function drawSpdrChart(ctx, series, x, y, w, h, lang) {
    const rows = (series || []).filter(s => s && s.tonnes != null);
    if (rows.length < 2) return;
    pane(ctx, x, y, w, h);
    const padL = 14, padR = 72, padT = 16, padB = 24;
    const cx = x + padL, cy = y + padT, cw = w - padL - padR, ch = h - padT - padB;
    const tonnes = rows.map(s => Number(s.tonnes));
    let lo = Math.min(...tonnes), hi = Math.max(...tonnes);
    const pad = (hi - lo) * 0.14 || 2;
    lo -= pad; hi += pad;
    const ty = v => cy + (1 - (v - lo) / (hi - lo)) * ch;
    const chgs = rows.map(s => Number(s.change) || 0);
    const maxAbs = Math.max(1, ...chgs.map(v => Math.abs(v)));
    const step = cw / Math.max(rows.length, 1);
    const barW = Math.max(2, Math.min(8, step * 0.55));

    ctx.save();
    ctx.beginPath(); ctx.rect(cx, cy, cw, ch); ctx.clip();
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const yy = cy + (ch * i) / 3;
      ctx.beginPath(); ctx.moveTo(cx, yy); ctx.lineTo(cx + cw, yy); ctx.stroke();
    }
    const mid = cy + ch * 0.58;
    rows.forEach((s, i) => {
      const px = cx + (i + 0.5) * step;
      const chv = Number(s.change) || 0;
      const by = mid - (chv / maxAbs) * (ch * 0.32);
      ctx.fillStyle = chv >= 0 ? "rgba(34,227,154,0.55)" : "rgba(255,77,109,0.55)";
      ctx.fillRect(px - barW / 2, Math.min(mid, by), barW, Math.max(1, Math.abs(by - mid)));
    });
    ctx.beginPath();
    rows.forEach((s, i) => {
      const px = cx + (i + 0.5) * step;
      const py = ty(Number(s.tonnes));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = GOLD2;
    ctx.font = `600 12px ${FONT}`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(fmt(hi, 1), cx + cw + 6, cy + 6);
    ctx.fillText(fmt(lo, 1), cx + cw + 6, cy + ch - 6);
    const last = rows[rows.length - 1];
    ctx.fillStyle = GOLD;
    ctx.fillText(fmt(last.tonnes, 2), cx + cw + 6, ty(last.tonnes));
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = MUTED;
    ctx.font = `500 12px ${FONT}`;
    ctx.fillText(lang === "en" ? "3-month holdings and daily inflow / outflow" : "ถือครอง 3 เดือน และซื้อเข้า–ขายออกรายวัน", x + 14, y + h - 8);
  }

  function drawForecastPath(ctx, bars, x, y, w, h, p, lang, tgt) {
    const rows = packBars(bars).slice(-48);
    pane(ctx, x, y, w, h);
    const padL = 12, padR = 16, padT = 16, padB = 28;
    const cx = x + padL, cy = y + padT, cw = w - padL - padR, ch = h - padT - padB;
    const last = rows.length ? rows[rows.length - 1].c : num(p.price);
    if (!rows.length && last == null) return;
    const atr = rows.length > 5 ? rows.slice(-20).reduce((a, b) => a + Math.abs(b.h - b.l), 0) / Math.min(20, rows.length) : (last || 4000) * 0.004;
    const up = Number(p.up ?? 50) / 100;
    const span = Math.max(atr * 2.2, (last || 1) * 0.006);
    const hi = (last || 0) + span * (0.7 + up * 0.6);
    const lo = (last || 0) - span * (0.7 + (1 - up) * 0.6);
    const futureShare = 0.34;
    const histW = cw * (1 - futureShare);
    const allVals = rows.flatMap(b => [b.h, b.l, b.c]).concat([hi, lo, last]);
    const sc = yScale(rows.map(b => ({ c: b.c, h: b.h, l: b.l })), [hi, lo, last], 0.1);

    ctx.save();
    ctx.beginPath(); ctx.rect(cx, cy, cw, ch); ctx.clip();
    const step = rows.length > 1 ? histW / (rows.length - 1) : histW;
    ctx.beginPath();
    rows.forEach((b, i) => {
      const px = cx + i * step;
      const py = sc.y(b.c, cy, ch);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    const x0 = cx + (rows.length > 1 ? (rows.length - 1) * step : 0);
    const y0 = sc.y(last, cy, ch);
    const x1 = cx + cw;
    const yUp = sc.y(hi, cy, ch);
    const yDn = sc.y(lo, cy, ch);
    const midBias = y0 - (up - 0.5) * (y0 - yUp) * 0.5 + (0.5 - (1 - up)) * 0;

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, yUp);
    ctx.lineTo(x1, y0);
    ctx.closePath();
    ctx.fillStyle = "rgba(34,227,154,0.20)";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, yDn);
    ctx.lineTo(x1, y0);
    ctx.closePath();
    ctx.fillStyle = "rgba(255,77,109,0.20)";
    ctx.fill();

    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = "rgba(245,197,66,0.7)";
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0 - (up - 0.5) * (y0 - yUp) * 1.1); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath(); ctx.moveTo(x0, cy); ctx.lineTo(x0, cy + ch); ctx.stroke();
    ctx.restore();

    ctx.fillStyle = MUTED;
    ctx.font = `500 12px ${FONT}`;
    const tlab = lang === "en" ? "Target " + fmtBkk(tgt.to, "en", true) : "เป้า " + fmtBkk(tgt.to, "th");
    ctx.textAlign = "right";
    ctx.fillText(tlab, x + w - 14, y + h - 8);
    ctx.textAlign = "left";
    ctx.fillText(lang === "en" ? "Path to target" : "เส้นทางถึงเป้า", x + 14, y + h - 8);
  }

  function drawBiasMeter(ctx, x, y, w, h, mtf, lang) {
    pane(ctx, x, y, w, h);
    const rows = mtf || [];
    const upN = rows.filter(m => m.trend === "up").length;
    const dnN = rows.filter(m => m.trend === "down").length;
    const sdN = rows.length - upN - dnN;
    const total = Math.max(rows.length, 1);
    ctx.fillStyle = MUTED;
    ctx.font = `600 13px ${FONT}`;
    ctx.fillText(lang === "en" ? "Bias meter" : "มาตรวัดทิศทาง", x + 16, y + 26);
    const gx = x + 16, gy = y + 42, gw = w - 32, gh = 18;
    rr(ctx, gx, gy, gw, gh, 9); ctx.fillStyle = "#1a1813"; ctx.fill();
    let px = gx;
    const segs = [[upN, UP], [sdN, GOLD], [dnN, DN]];
    segs.forEach(([n, col]) => {
      if (!n) return;
      const sw = gw * (n / total);
      ctx.fillStyle = col;
      rr(ctx, px, gy, sw, gh, 8); ctx.fill();
      px += sw;
    });
    ctx.font = `700 16px ${FONT}`;
    ctx.fillStyle = UP; ctx.fillText((lang === "en" ? "Up " : "ขึ้น ") + upN + "/" + total, x + 16, y + 86);
    ctx.fillStyle = GOLD; ctx.fillText((lang === "en" ? "Sideways " : "ไซด์เวย์ ") + sdN + "/" + total, x + 16 + gw / 3, y + 86);
    ctx.fillStyle = DN; ctx.fillText((lang === "en" ? "Down " : "ลง ") + dnN + "/" + total, x + 16 + (gw * 2) / 3, y + 86);
  }

  function heroNumber(ctx, text, x, y, size) {
    ctx.save();
    ctx.font = `800 ${size}px ${MONO}`;
    ctx.fillStyle = TX;
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 4;
    ctx.textBaseline = "alphabetic";
    ctx.fillText(text, x, y);
    ctx.restore();
    return ctx.measureText ? size : size;
  }

  function changeBadge(ctx, x, y, change, changePct, known) {
    if (!known || change == null || !Number.isFinite(Number(change))) return 0;
    const v = Number(change);
    const col = Math.abs(v) < 5e-5 ? GOLD : v > 0 ? UP : DN;
    const label = chg(v, 2) + (changePct != null ? "   " + chg(changePct, 2) + "%" : "");
    ctx.font = `800 28px ${FONT}`;
    const tw = ctx.measureText(label).width;
    const w = tw + 36, h = 48;
    ctx.fillStyle = col + "22";
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.6;
    rr(ctx, x, y, w, h, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col;
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + 18, y + h / 2);
    ctx.textBaseline = "alphabetic";
    return h;
  }

  function resolveChange(p) {
    if (p.changeKnown && p.change != null && Number.isFinite(Number(p.change))) {
      return { change: Number(p.change), changePct: p.changePct == null ? null : Number(p.changePct), known: true, prevClose: p.prevClose, basis: p.changeBasis || "prevClose" };
    }
    if (p.prevClose != null && p.price != null) {
      const px = Number(p.price), prev = Number(p.prevClose);
      if (Number.isFinite(px) && Number.isFinite(prev) && prev !== 0) {
        return { change: px - prev, changePct: (px - prev) / prev * 100, known: true, prevClose: prev, basis: "prevClose" };
      }
    }
    return { change: null, changePct: null, known: false };
  }


  function trendInfo(p, lang) {
    const mtf = p.mtf || [];
    const up = mtf.filter(m => m.trend === "up").length;
    const dn = mtf.filter(m => m.trend === "down").length;
    const total = Math.max(mtf.length, 1);
    const sd = Math.max(0, total - up - dn);
    const align = lang === "en" ? (p.alignEn || p.align || "") : (p.align || p.alignEn || "");
    let key = "side", label, arrow;
    if (/ขาขึ้น(?!.*เอียง)|Uptrend|\bUp\b/i.test(align) && up > dn && up >= sd) {
      key = "up"; label = lang === "en" ? "Uptrend" : "ขาขึ้น"; arrow = "▲";
    } else if (/ขาลง(?!.*เอียง)|Downtrend|\bDown\b/i.test(align) && dn > up && dn >= sd) {
      key = "down"; label = lang === "en" ? "Downtrend" : "ขาลง"; arrow = "▼";
    } else if (/เอียงขึ้น|Tilt up|tilt-up/i.test(align) || up > dn) {
      key = "tilt-up"; label = lang === "en" ? "Tilt up" : "เอียงขึ้น"; arrow = "▲";
    } else if (/เอียงลง|Tilt down/i.test(align) || dn > up) {
      key = "tilt-down"; label = lang === "en" ? "Tilt down" : "เอียงลง"; arrow = "▼";
    } else {
      key = "side"; label = lang === "en" ? "Sideways" : "ไซด์เวย์"; arrow = "●";
    }
    const strength = lang === "en"
      ? `Up ${up}/${total}  ·  Down ${dn}/${total}  ·  Side ${sd}/${total}`
      : `ขึ้น ${up}/${total}  ·  ลง ${dn}/${total}  ·  ไซด์เวย์ ${sd}/${total}`;
    const color = (key === "up" || key === "tilt-up") ? UP : (key === "down" || key === "tilt-down") ? DN : GOLD;
    return { key, label, arrow, up, dn, sd, total, strength, color, align };
  }

  function drawTrendBadge(ctx, x, y, info, lang, scale) {
    const s = scale || 1;
    const text = info.arrow + "  " + info.label;
    ctx.font = `800 ${Math.round(22 * s)}px ${FONT}`;
    const w = ctx.measureText(text).width + 28 * s;
    const h = 40 * s;
    ctx.fillStyle = info.color + "24";
    ctx.strokeStyle = info.color;
    ctx.lineWidth = 1.5;
    rr(ctx, x, y, w, h, 14 * s); ctx.fill(); ctx.stroke();
    ctx.fillStyle = info.color;
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + 14 * s, y + h / 2);
    ctx.textBaseline = "alphabetic";
    return { w, h };
  }

  function drawSRTable(ctx, x, y, w, h, pivots, lang) {
    if (!pivots) return 0;
    if (h < 110 || w < 200) return 0;
    glassPanel(ctx, x, y, w, h, 14);
    const th = lang !== "en";
    const pad = 12;
    const headerH = 22;
    const footH = pivots.pp != null ? 20 : 0;
    const bodyH = Math.max(64, h - pad - headerH - footH - 6);
    const rowH = bodyH / 2;
    ctx.textBaseline = "middle";
    ctx.fillStyle = MUTED;
    ctx.font = `700 12px ${FONT}`;
    fillFit(ctx, th ? "แนวต้าน / แนวรับ  (S1–S3, R1–R3)" : "Resistance / Support  (S1–S3, R1–R3)", x + pad, y + pad + 8, w - pad * 2);
    const labelW = Math.min(90, Math.max(62, w * 0.16));
    const rows = [
      [th ? "แนวต้าน" : "Resist", DN, [["R1", pivots.r1], ["R2", pivots.r2], ["R3", pivots.r3]]],
      [th ? "แนวรับ" : "Support", UP, [["S1", pivots.s1], ["S2", pivots.s2], ["S3", pivots.s3]]]
    ];
    const colW = (w - pad * 2 - labelW) / 3;
    rows.forEach((row, ri) => {
      const ry = y + pad + headerH + ri * rowH;
      const mid = ry + rowH / 2;
      ctx.fillStyle = row[1];
      ctx.font = `800 13px ${FONT}`;
      fillFit(ctx, row[0], x + pad, mid, labelW - 6);
      row[2].forEach((cell, ci) => {
        const cx0 = x + pad + labelW + ci * colW;
        const labY = ry + Math.min(14, rowH * 0.30);
        const valY = ry + rowH * 0.68;
        ctx.fillStyle = MUTED;
        ctx.font = `700 11px ${FONT}`;
        ctx.fillText(cell[0], cx0, labY);
        const val = cell[1] != null ? fmt(cell[1], 1) : "—";
        ctx.fillStyle = row[1];
        fitFont(ctx, val, colW - 8, "800", Math.min(18, Math.max(12, rowH * 0.38)), MONO, 11);
        fillFit(ctx, val, cx0, valY, colW - 8);
      });
    });
    if (pivots.pp != null) {
      ctx.fillStyle = GOLD2;
      ctx.font = `600 12px ${FONT}`;
      fillFit(ctx, (th ? "พิวอต " : "Pivot ") + fmt(pivots.pp, 1), x + pad, y + h - 12, w - pad * 2);
    }
    ctx.textBaseline = "alphabetic";
    return h;
  }

  function drawThaiPanel(ctx, x, y, w, h, thai, lang) {
    if (!thai || (thai.buy == null && thai.sell == null)) return 0;
    if (h < 72 || w < 160) return 0;
    glassPanel(ctx, x, y, w, h, 14);
    const th = lang !== "en";
    const pad = 12;
    const title = th ? "ทองไทย 96.5%  ·  บาทละ" : "Thai gold 96.5%  ·  per baht-weight";
    const src = th ? ("ที่มา: " + (thai.source || "ราคาทองไทย")) : ("Source: " + (thai.source || "Thai gold"));
    const chgT = (thai.change != null && Number.isFinite(thai.change))
      ? ((thai.change > 0 ? "▲ +" : thai.change < 0 ? "▼ " : "• ") + fmt(Math.abs(thai.change), 0) + (th ? " บาท" : " THB"))
      : "";
    const chgCol = (thai.change > 0) ? UP : (thai.change < 0) ? DN : GOLD;
    ctx.textBaseline = "middle";
    ctx.fillStyle = GOLD;
    ctx.font = `800 13px ${FONT}`;
    const titleY = y + 16;
    ctx.font = `800 13px ${FONT}`;
    const titleW = ctx.measureText(title).width;
    ctx.font = `500 11px ${FONT}`;
    const srcW = ctx.measureText(src).width;
    ctx.font = `800 13px ${FONT}`;
    if (titleW + srcW + 28 < w - pad * 2) {
      fillFit(ctx, title, x + pad, titleY, w - pad * 2 - srcW - 16);
      ctx.fillStyle = MUTED;
      ctx.font = `500 11px ${FONT}`;
      ctx.textAlign = "right";
      fillFit(ctx, src, x + w - pad, titleY, srcW + 4);
      ctx.textAlign = "left";
    } else {
      fillFit(ctx, title, x + pad, titleY, w - pad * 2);
    }
    const products = [];
    if (thai.bar || (thai.buy != null || thai.sell != null)) {
      products.push({
        name: th ? "ทองคำแท่ง 96.5%" : "Gold bar 96.5%",
        buy: (thai.bar && thai.bar.buy != null) ? thai.bar.buy : thai.buy,
        sell: (thai.bar && thai.bar.sell != null) ? thai.bar.sell : thai.sell,
        change: (thai.bar && thai.bar.change != null) ? thai.bar.change : thai.change
      });
    }
    if (thai.jewelry && (thai.jewelry.buy != null || thai.jewelry.sell != null)) {
      products.push({
        name: th ? "ทองรูปพรรณ 96.5%" : "Jewelry 96.5%",
        buy: thai.jewelry.buy, sell: thai.jewelry.sell, change: thai.jewelry.change
      });
    }
    const bodyY = y + 28;
    const bodyH = h - 40;
    const colW = (w - pad * 2 - (products.length > 1 ? 10 : 0)) / Math.max(1, products.length);
    products.forEach((pr, i) => {
      const cx0 = x + pad + i * (colW + (products.length > 1 ? 10 : 0));
      ctx.fillStyle = GOLD2;
      ctx.font = `700 11px ${FONT}`;
      fillFit(ctx, pr.name, cx0, bodyY + 8, colW - 6);
      const rows = [
        [th ? "รับซื้อ" : "Buy-back", pr.buy != null ? fmt(pr.buy, 0) : "—", TX],
        [th ? "ขายออก" : "Sell", pr.sell != null ? fmt(pr.sell, 0) : "—", TX]
      ];
      if (pr.change != null && Number.isFinite(pr.change)) {
        const chgT = (pr.change > 0 ? "▲ +" : pr.change < 0 ? "▼ " : "• ") + fmt(Math.abs(pr.change), 0);
        rows.push([th ? "เปลี่ยน" : "Change", chgT, pr.change > 0 ? UP : pr.change < 0 ? DN : GOLD]);
      }
      const rh = (bodyH - 16) / rows.length;
      rows.forEach((it, ri) => {
        const ry = bodyY + 14 + ri * rh;
        ctx.fillStyle = MUTED;
        ctx.font = `600 10px ${FONT}`;
        fillFit(ctx, it[0], cx0, ry + rh * 0.30, colW * 0.42);
        ctx.fillStyle = it[2];
        fitFont(ctx, it[1], colW * 0.55, "800", Math.min(18, Math.max(12, rh * 0.55)), MONO, 10);
        fillFit(ctx, it[1], cx0 + colW * 0.42, ry + rh * 0.30, colW * 0.55);
      });
    });
    const stamp = thai.as_of_th || (thai.as_of_hm ? (th ? "อัปเดตล่าสุด " : "Updated ") + thai.as_of_hm : "");
    if (stamp && bodyH > 50) {
      ctx.fillStyle = MUTED;
      ctx.font = `500 10px ${FONT}`;
      fillFit(ctx, stamp, x + pad, y + h - 10, w - pad * 2);
    }
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    return h;
  }

  function drawPerfRow(ctx, x, y, w, perf, lang) {
    const periods = (perf && perf.periods) || (Array.isArray(perf) ? perf : []);
    const items = periods.filter(pe => pe && Number.isFinite(Number(pe.change_pct)));
    if (!items.length) return 0;
    let x0 = x, rowH = 0;
    const y0 = y;
    items.forEach(pe => {
      const pct = Number(pe.change_pct);
      const col = Math.abs(pct) < 0.005 ? GOLD : pct > 0 ? UP : DN;
      const lab = (lang === "en" ? (pe.label_en || pe.id) : (pe.label_th || pe.id)) + "  " + (pct > 0 ? "+" : pct < 0 ? "\u2212" : "") + Math.abs(pct).toFixed(2) + "%";
      ctx.font = `700 13px ${FONT}`;
      const tw = ctx.measureText(lab).width;
      const pw = tw + 20, ph = 28;
      if (x0 + pw > x + w && x0 > x) { x0 = x; y += ph + 6; }
      ctx.fillStyle = col + "22";
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.2;
      rr(ctx, x0, y, pw, ph, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = col;
      ctx.textBaseline = "middle";
      ctx.font = `700 13px ${FONT}`;
      ctx.fillText(lab, x0 + 10, y + ph / 2);
      ctx.textBaseline = "alphabetic";
      x0 += pw + 8;
      rowH = (y - y0) + ph;
    });
    return rowH + 8;
  }

  function newsBlackoutOf(news) {
    if (!news) return null;
    if (news.blackout) return news;
    return null;
  }

  function h1Confirmed(plan, ctx) {
    const h1 = (ctx && ctx.h1) || (plan && plan.h1) || null;
    return !!(h1 && h1.confirmed);
  }

  function reversalText(zone, low, high, lang) {
    const rng = fmtPlanRange({ low, high });
    if (zone === "supply") {
      return lang === "en"
        ? ("Price reversed at Supply Zone " + rng + " — this is the reversal point, turning up to down, SELL signal")
        : ("ราคากลับตัวที่ Supply Zone " + rng + " นี่คือจุดกลับตัว เปลี่ยนจากขึ้นเป็นลง ให้สัญญาณ SELL");
    }
    return lang === "en"
      ? ("Price reversed at Demand Zone " + rng + " — this is the reversal point, turning down to up, BUY signal")
      : ("ราคากลับตัวที่ Demand Zone " + rng + " นี่คือจุดกลับตัว เปลี่ยนจากลงเป็นขึ้น ให้สัญญาณ BUY");
  }

  function sidewaysText(low, high, lang) {
    const rng = fmtPlanRange({ low, high });
    return lang === "en"
      ? ("Sideways: price is between " + rng + " with no clear direction. Wait for a closed H1 bar to leave this range before entering.")
      : ("กราฟไซด์เวย์ ราคาระหว่าง " + rng + " ไม่มีทิศชัด แนะนำรอดูแท่ง H1 ปิดออกจากช่วงก่อนเข้า");
  }

  function breakoutText(low, high, direction, lang) {
    const rng = fmtPlanRange({ low, high });
    const up = direction === "up";
    if (lang === "en") {
      return "A closed H1 confirmed a breakout " + (up ? "above" : "below") + " the sideways range " + rng;
    }
    return "แท่ง H1 ปิดยืนยันเบรกออกจากช่วงไซด์เวย์ " + rng + (up ? " ขึ้น" : " ลง");
  }

  function h1Of(plan, ctx) {
    return (ctx && ctx.h1) || (plan && plan.h1) || {};
  }

  function alertFields(plan, ctx) {
    const h1 = h1Of(plan, ctx);
    const news = newsBlackoutOf((ctx && ctx.news) || (plan && plan.news)) || (plan && plan.news) || {};
    const demand = plan && plan.demand_zone, supply = plan && plan.supply_zone;
    const dTxt = fmtPlanRange(demand), sTxt = fmtPlanRange(supply);
    const side = (plan && plan.side) || "wait";
    const rev = h1.reversal || {};
    const sw = h1.sideways || {};
    const br = (sw.breakout && sw.breakout.confirmed) ? sw.breakout : (h1.breakout || {});
    if (news.blackout && !h1.confirmed && !rev.confirmed) {
      return {
        stance: "รอ", stanceEn: "waiting", kind: "news",
        reasonTh: (news.label_th || "ช่วงข่าวแรง งดเข้า") + (news.detail_th ? " — " + news.detail_th : ""),
        reasonEn: (news.label_en || "high-impact news — no new entries") + (news.detail_en ? " — " + news.detail_en : "")
      };
    }
    if (rev.confirmed) {
      const st = rev.side === "sell" ? "SELL" : "BUY";
      return {
        stance: st, stanceEn: st, kind: "reversal",
        reasonTh: rev.note_th || reversalText(rev.zone, rev.low, rev.high, "th"),
        reasonEn: rev.note_en || reversalText(rev.zone, rev.low, rev.high, "en")
      };
    }
    if (br.confirmed) {
      const st = br.direction === "up" ? "BUY" : "SELL";
      return {
        stance: st, stanceEn: st, kind: "breakout",
        reasonTh: br.note_th || breakoutText(br.low, br.high, br.direction, "th"),
        reasonEn: br.note_en || breakoutText(br.low, br.high, br.direction, "en")
      };
    }
    if (sw.active) {
      return {
        stance: "รอ", stanceEn: "waiting", kind: "sideways",
        reasonTh: sw.note_th || sw.rule_th || sidewaysText(sw.low, sw.high, "th"),
        reasonEn: sw.note_en || sw.rule_en || sidewaysText(sw.low, sw.high, "en")
      };
    }
    if (h1.confirmed && side === "buy") {
      const name = plan.trigger_zone === "supply" ? "Supply Zone" : "Demand Zone";
      const z = plan.trigger_zone === "supply" ? sTxt : dTxt;
      return { stance: "BUY", stanceEn: "BUY", kind: "confirm", reasonTh: "แท่ง H1 ปิดยืนยันที่ " + name + " " + z, reasonEn: "a closed H1 confirmed the " + name + " " + z };
    }
    if (h1.confirmed && side === "sell") {
      const name = plan.trigger_zone === "demand" ? "Demand Zone" : "Supply Zone";
      const z = plan.trigger_zone === "demand" ? dTxt : sTxt;
      return { stance: "SELL", stanceEn: "SELL", kind: "confirm", reasonTh: "แท่ง H1 ปิดยืนยันที่ " + name + " " + z, reasonEn: "a closed H1 confirmed the " + name + " " + z };
    }
    if (side === "buy") {
      return { stance: "รอ", stanceEn: "waiting", kind: "wait", reasonTh: "ยังรอแท่ง H1 ปิดยืนยันที่ Demand Zone " + dTxt, reasonEn: "a confirming H1 close is still needed at Demand Zone " + dTxt };
    }
    if (side === "sell") {
      return { stance: "รอ", stanceEn: "waiting", kind: "wait", reasonTh: "ยังรอแท่ง H1 ปิดยืนยันที่ Supply Zone " + sTxt, reasonEn: "a confirming H1 close is still needed at Supply Zone " + sTxt };
    }
    return {
      stance: "รอ", stanceEn: "waiting", kind: "wait",
      reasonTh: "ยังรอแท่ง H1 ปิดยืนยันที่ Demand Zone " + dTxt,
      reasonEn: "a confirming H1 close is still needed at Demand Zone " + dTxt
    };
  }

  function alertLead(plan, px, lang, ctx) {
    const f = alertFields(plan, ctx);
    const n = Number(px);
    const pxS = Number.isFinite(n) ? n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—";
    if (lang === "en") return "Latest price $" + pxS + " · now " + f.stanceEn + " because " + f.reasonEn;
    return "ราคาล่าสุด $" + pxS + " · ตอนนี้ " + f.stance + " เพราะ" + f.reasonTh;
  }

  function withAlertLead(text, plan, px, lang, ctx) {
    const lead = alertLead(plan, px, lang, ctx);
    const body = String(text || "").trim();
    if (!body) return lead;
    if (body.startsWith("ราคาล่าสุด") || body.startsWith("Latest price")) return body;
    return lead + " " + body;
  }

  function buildPlanAlert(plan, px, lang, ctx, extra) {
    const lead = alertLead(plan, px, lang, ctx);
    const f = alertFields(plan, ctx);
    const extraS = String(extra || "").trim();
    const short = extraS && !extraS.startsWith("ราคาล่าสุด") && !extraS.startsWith("Latest price") ? (lead + " " + extraS) : (extraS || lead);
    return { lead, short, full: short, kind: f.kind, stance: f.stance, stanceEn: f.stanceEn, reasonTh: f.reasonTh, reasonEn: f.reasonEn };
  }


  function furthestTp(plan, live) {
    const tps = plan.tps || [];
    const side = plan.side;
    let hit = null;
    for (let i = 0; i < tps.length; i++) {
      const p = Number(tps[i].price);
      const n = tps[i].n || (i + 1);
      if (!Number.isFinite(p)) continue;
      if (side === 'sell' && live <= p) hit = { id: 'tp' + n, n, th: 'ชน TP' + n, en: 'TP' + n + ' hit' };
      if (side === 'buy' && live >= p) hit = { id: 'tp' + n, n, th: 'ชน TP' + n, en: 'TP' + n + ' hit' };
    }
    return hit;
  }

  function planStatus(plan, px, ctx) {
    const live = Number(px);
    if (!plan) return { id: 'wait', th: 'รอเข้า', en: 'Waiting' };
    const side = plan.side || 'wait';
    const lo = Number(plan.entry_low != null ? plan.entry_low : plan.entry);
    const hi = Number(plan.entry_high != null ? plan.entry_high : plan.entry);
    const sl = Number(plan.sl);
    const inv = plan.invalidation != null ? Number(plan.invalidation) : sl;
    const news = newsBlackoutOf((ctx && ctx.news) || plan.news);
    const confirmed = h1Confirmed(plan, ctx);
    if (!Number.isFinite(live)) return { id: 'wait', th: 'รอเข้า', en: 'Waiting' };
    const h1x = (ctx && ctx.h1) || plan.h1 || {};
    const rev = h1x.reversal || {};
    const sw = h1x.sideways || {};
    const br = (sw.breakout && sw.breakout.confirmed) ? sw.breakout : (h1x.breakout || {});
    if (rev.confirmed) return { id: 'reversal', th: 'กลับตัว', en: 'Reversal', zone: rev.zone, side: rev.side };
    if (br.confirmed) return { id: 'breakout', th: 'เบรกไซด์เวย์', en: 'Range breakout', direction: br.direction };
    if (sw.active && side === 'wait') return { id: 'sideways', th: 'ไซด์เวย์', en: 'Sideways' };
    if (sw.active && !confirmed) return { id: 'sideways', th: 'ไซด์เวย์', en: 'Sideways' };
    if (side === 'wait') {
      if (Number.isFinite(inv) && ((plan.bias === 'down' && live >= inv) || (plan.bias === 'up' && live <= inv))) {
        return { id: 'cancelled', th: 'ยกเลิก', en: 'Invalidated' };
      }
      if (news) return { id: 'news', th: 'ช่วงข่าวแรง งดเข้า', en: 'High-impact news — no new entries', news: true };
      return { id: 'wait', th: 'รอเข้า', en: 'Waiting' };
    }
    const approach = plan.approach || (side === 'sell' ? 'from_above' : 'from_below');
    const inZone = Number.isFinite(lo) && Number.isFinite(hi) && live >= Math.min(lo, hi) && live <= Math.max(lo, hi);
    const waiting = side === 'sell'
      ? ((approach === 'from_below' && !inZone && live < lo) || (approach === 'from_above' && !inZone && live > hi))
      : ((approach === 'from_above' && !inZone && live > hi) || (approach === 'from_below' && !inZone && live < lo));

    // Stops / invalidation only apply once the plan has been confirmed (or already in).
    if (confirmed) {
      if (side === 'sell') {
        if (Number.isFinite(sl) && live >= sl) return { id: 'sl', th: 'โดน SL', en: 'Stop hit' };
        if (Number.isFinite(inv) && live >= inv) return { id: 'cancelled', th: 'ยกเลิก', en: 'Invalidated' };
      } else if (side === 'buy') {
        if (Number.isFinite(sl) && live <= sl) return { id: 'sl', th: 'โดน SL', en: 'Stop hit' };
        if (Number.isFinite(inv) && live <= inv) return { id: 'cancelled', th: 'ยกเลิก', en: 'Invalidated' };
      }
      const tp = furthestTp(plan, live);
      if (tp) return tp;
      if (!waiting) return { id: 'in', th: 'เข้าแล้ว', en: 'In trade' };
      return { id: 'wait', th: 'รอเข้า', en: 'Waiting' };
    }

    // Unconfirmed: do not treat as in-trade. Invalidation can still cancel the setup.
    if (side === 'sell' && Number.isFinite(inv) && live >= inv) return { id: 'cancelled', th: 'ยกเลิก', en: 'Invalidated' };
    if (side === 'buy' && Number.isFinite(inv) && live <= inv) return { id: 'cancelled', th: 'ยกเลิก', en: 'Invalidated' };
    if (news) return { id: 'news', th: 'ช่วงข่าวแรง งดเข้า', en: 'High-impact news — no new entries', news: true };
    if (!waiting && inZone) return { id: 'confirm', th: 'รอแท่ง H1 ปิดยืนยัน', en: 'Waiting for the H1 close' };
    return { id: 'wait', th: 'รอเข้า', en: 'Waiting' };
  }

  function liveBiasFromLevels(px, lv) {
    if (!lv || !Number.isFinite(px)) return null;
    const pp = Number(lv.PP ?? lv.pp);
    const s1 = Number(lv.S1 ?? lv.s1);
    const r1 = Number(lv.R1 ?? lv.r1);
    if (![pp, s1, r1].some(Number.isFinite)) return null;
    let dir = 'side', th = 'ใกล้จุดพิวอต', en = 'Near the pivot';
    if (Number.isFinite(r1) && px > r1) { dir = 'up'; th = 'เอียงขึ้นเหนือ R1'; en = 'Bias up above R1'; }
    else if (Number.isFinite(pp) && px > pp + 1) { dir = 'up'; th = 'เอียงขึ้นเหนือจุดพิวอต'; en = 'Bias up above the pivot'; }
    else if (Number.isFinite(s1) && px < s1) { dir = 'down'; th = 'เอียงลงต่ำกว่า S1'; en = 'Bias down below S1'; }
    else if (Number.isFinite(pp) && px < pp - 1) { dir = 'down'; th = 'เอียงลงต่ำกว่าจุดพิวอต'; en = 'Bias down below the pivot'; }
    else { th = 'ราคายืนในกรอบ S1–R1'; en = 'Price is holding inside the S1–R1 range'; }
    return { dir, th, en, pp, s1, r1 };
  }

  function entryZoneLabel(side, lang) {
    const s = String(side || 'wait').toLowerCase();
    const th = lang !== 'en';
    if (s === 'buy') return th ? 'โซนซื้อ · BUY' : 'Buy zone · BUY';
    if (s === 'sell') return th ? 'โซนขาย · SELL' : 'Sell zone · SELL';
    return th ? 'รอ · WAIT' : 'Wait · WAIT';
  }

  function fmtPlanRange(z) {
    if (!z || z.low == null || z.high == null) return "—";
    const a = Number(z.low), b = Number(z.high);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return "—";
    const f = n => n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return f(Math.min(a, b)) + "–" + f(Math.max(a, b));
  }
  function aiActivity(plan, px, ctx) {
    const hm = new Date().toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit", hour12: false });
    const empty = { id: "scan", th: "กำลังสแกนโครงสร้าง H1/H4", en: "Scanning H1/H4 structure", next_th: "รอโครงสร้างหรือโซนที่ชัดขึ้น", next_en: "Waiting for a clearer structure or zone", checked_hm: hm };
    const finish = (row) => {
      if (!plan) return row;
      const leadTh = alertLead(plan, px, "th", ctx);
      const leadEn = alertLead(plan, px, "en", ctx);
      const th = row.th && row.th.startsWith("ราคาล่าสุด") ? row.th : (leadTh + (row.th ? " · " + row.th : ""));
      const en = row.en && row.en.startsWith("Latest price") ? row.en : (leadEn + (row.en ? " · " + row.en : ""));
      return Object.assign({}, row, { th, en, lead_th: leadTh, lead_en: leadEn });
    };
    if (!plan) return finish(empty);
    const st = planStatus(plan, px, ctx);
    const live = Number(px);
    const side = plan.side || "wait";
    const lo = Number(plan.entry_low != null ? plan.entry_low : plan.entry);
    const hi = Number(plan.entry_high != null ? plan.entry_high : plan.entry);
    const sl = Number(plan.sl);
    const tp1 = plan.tps && plan.tps[0] ? Number(plan.tps[0].price) : NaN;
    const trig = plan.trigger_zone;
    const demand = plan.demand_zone, supply = plan.supply_zone;
    const watchZ = trig === "demand" ? demand : trig === "supply" ? supply : (Number.isFinite(lo) && Number.isFinite(hi) ? { low: Math.min(lo, hi), high: Math.max(lo, hi) } : null);
    const watchName = trig === "demand" ? "Demand Zone" : trig === "supply" ? "Supply Zone" : "โซนเข้า";
    const watchNameEn = trig === "demand" ? "Demand Zone" : trig === "supply" ? "Supply Zone" : "the entry zone";
    const mid = watchZ ? (Number(watchZ.low) + Number(watchZ.high)) / 2 : NaN;
    const gap = Number.isFinite(live) && Number.isFinite(mid) ? Math.abs(live - mid) : null;
    const inWatch = watchZ && Number.isFinite(live) && live >= Number(watchZ.low) && live <= Number(watchZ.high);
    const act = side === "buy" ? "BUY" : side === "sell" ? "SELL" : "WAIT";
    const fmtN = n => Number(n).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    if (st.id === "sl" || st.id === "cancelled") {
      const whyTh = st.id === "sl" ? ("โดน SL ที่ " + fmtN(sl)) : (plan.invalidation_th || st.th);
      const whyEn = st.id === "sl" ? ("the stop was hit at " + fmtN(sl)) : (plan.invalidation_en || st.en);
      return finish({ id: st.id, th: "แผนยกเลิกเพราะ" + whyTh, en: "Plan cancelled because " + whyEn, next_th: "รอแผนใหม่จากโครงสร้างล่าสุด", next_en: "Wait for a new plan from the latest structure", checked_hm: hm });
    }
    if (st.id === "tp1") {
      const n2 = plan.tps && plan.tps[1] ? fmtN(plan.tps[1].price) : null;
      return finish({ id: "manage", th: "TP1 ถึงแล้ว เลื่อน SL มาจุดเข้า", en: "TP1 reached — move the stop to entry", next_th: n2 ? ("ถือส่วนที่เหลือไป TP2 " + n2) : "จัดการออเดอร์ที่เหลือตามแผน", next_en: n2 ? ("Hold the remainder toward TP2 " + n2) : "Manage the remaining position as planned", checked_hm: hm });
    }
    if (st.id === "news") {
      const news = newsBlackoutOf((ctx && ctx.news) || plan.news) || plan.news || {};
      const until = news.until_hm ? " ถึง " + news.until_hm : "";
      return finish({ id: "news", th: "ช่วงข่าวแรง งดเข้า" + (news.detail_th ? " — " + news.detail_th : until), en: "High-impact news — no new entries" + (news.detail_en ? " — " + news.detail_en : until), next_th: "พ้นช่วงข่าวแล้วค่อยดูแท่ง H1 ปิดยืนยัน", next_en: "After the news window, wait for a confirming H1 close", checked_hm: hm });
    }
    if (st.id === "reversal") {
      const rev = ((ctx && ctx.h1) || plan.h1 || {}).reversal || {};
      const thRev = rev.note_th || reversalText(rev.zone, rev.low, rev.high, "th");
      const enRev = rev.note_en || reversalText(rev.zone, rev.low, rev.high, "en");
      return finish({ id: "reversal", th: thRev, en: enRev, next_th: "ใช้สัญญาณตามทิศใหม่ และรอแท่ง H1 ปิดยืนยันในโซน", next_en: "Follow the new direction and wait for a confirming H1 close in the zone", checked_hm: hm });
    }
    if (st.id === "sideways") {
      const sw = ((ctx && ctx.h1) || plan.h1 || {}).sideways || {};
      return finish({ id: "sideways", th: sidewaysText(sw.low, sw.high, "th"), en: sidewaysText(sw.low, sw.high, "en"), next_th: "รอดูแท่ง H1 ปิดออกจากช่วงแล้วค่อยเข้า", next_en: "Wait for a closed H1 to leave the range before entering", checked_hm: hm });
    }
    if (st.id === "breakout") {
      const br = (((ctx && ctx.h1) || plan.h1 || {}).sideways || {}).breakout || ((ctx && ctx.h1) || plan.h1 || {}).breakout || {};
      return finish({ id: "breakout", th: breakoutText(br.low, br.high, br.direction, "th"), en: breakoutText(br.low, br.high, br.direction, "en"), next_th: "ตามทิศเบรก และจัดการความเสี่ยงตามแผน", next_en: "Follow the breakout direction and manage risk as planned", checked_hm: hm });
    }
    if (st.id === "confirm") {
      const bar = ((ctx && ctx.h1) || plan.h1 || {}).bar || {};
      const hmBar = bar.as_of_hm ? " (แท่งล่าสุดที่ปิด " + bar.as_of_hm + ")" : "";
      return finish({ id: "confirm", th: "รอแท่ง H1 ปิดยืนยัน" + hmBar, en: "Waiting for the H1 candle to close as confirmation" + (bar.as_of_hm ? " (last close " + bar.as_of_hm + ")" : ""), next_th: "ถ้าแท่งชั่วโมงปิดในโซน จึงพิจารณาเข้า " + act, next_en: "If the hourly candle closes in the zone, then consider " + act, checked_hm: hm });
    }
    if (st.id === "tp2" || st.id === "tp3") {
      const n = st.n || (st.id === "tp3" ? 3 : 2);
      return finish({ id: st.id, th: "TP" + n + " ถึงแล้ว " + (n >= 3 ? "แผนถึงเป้าสุดท้าย" : "ถือส่วนที่เหลือตามแผน และเลื่อน SL มาจุดเข้า"), en: "TP" + n + " reached" + (n >= 3 ? " — final target" : " — manage the remainder and move the stop to entry"), next_th: n >= 3 ? "ปิดตามแผน และทบทวนความเสี่ยง" : "ถือส่วนที่เหลือไปเป้าถัดไป ตั้ง SL คุ้มทุน", next_en: n >= 3 ? "Close as planned and review risk" : "Hold the remainder toward the next target, keep the stop at break-even", checked_hm: hm });
    }
    if (st.id === "in") {
      const toTp = Number.isFinite(tp1) ? fmtN(Math.abs(live - tp1)) : "—";
      const toSl = Number.isFinite(sl) ? fmtN(Math.abs(live - sl)) : "—";
      return finish({ id: "in", th: "สัญญาณ " + act + " ทำงานแล้ว ถืออยู่ ห่าง TP1 " + toTp + " จุด / SL " + toSl + " จุด", en: act + " is active — " + toTp + " pts to TP1 / " + toSl + " pts to the stop", next_th: "ถ้าถึง TP1 ให้ปิดบางส่วนแล้วเลื่อน SL มาจุดเข้า", next_en: "If TP1 is reached, close a portion and move the stop to entry", checked_hm: hm });
    }
    if (watchZ && Number.isFinite(gap)) {
      return finish({ id: "watch", th: "เฝ้าราคาเข้า " + watchName + " " + fmtPlanRange(watchZ) + " (ห่าง " + fmtN(gap) + " จุด)", en: "Watching for " + watchNameEn + " " + fmtPlanRange(watchZ) + " (" + fmtN(gap) + " pts away)", next_th: "รอราคาเข้าโซน แล้วค่อยพิจารณา " + (act === "WAIT" ? "ตามสัญญาณ" : act), next_en: "Wait for price to enter the zone, then consider " + (act === "WAIT" ? "the signal" : act), checked_hm: hm });
    }
    return finish(empty);
  }
  function planGuideHtml(plan, px, lang, esc, opts) {
    if (!plan) return "";
    esc = esc || (s => String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"));
    const th = lang !== "en";
    const compact = opts && opts.compact;
    const demand = plan.demand_zone, supply = plan.supply_zone;
    const act = aiActivity(plan, px, { h1: plan.h1, news: plan.news });
    const conf = plan.confidence || {};
    const why = th ? (plan.why_th || plan.thesis_th || "") : (plan.why_en || plan.thesis_en || "");
    const trigger = th ? (plan.trigger_th || "") : (plan.trigger_en || "");
    const steps = (th ? plan.steps_th : plan.steps_en) || [];
    const pos = plan.position;
    const revs = plan.reversal || [];
    const news = newsBlackoutOf(plan.news);
    const newsBox = news ? `<div class="tp-news">${esc(th ? (news.label_th + (news.detail_th ? " — " + news.detail_th : "")) : (news.label_en + (news.detail_en ? " — " + news.detail_en : "")))}</div>` : "";
    const h1note = plan.h1 && (th ? plan.h1.note_th : plan.h1.note_en) ? `<p class="tp-h1">${esc(th ? plan.h1.note_th : plan.h1.note_en)}</p>` : "";
    const leadLine = `<div class="tp-lead">${esc(alertLead(plan, px, th ? "th" : "en"))}</div>`;
    const sw = (plan.h1 || {}).sideways || {};
    const swBox = sw.active ? `<div class="tp-sideways">${esc(th ? sidewaysText(sw.low, sw.high, "th") : sidewaysText(sw.low, sw.high, "en"))}</div>` : "";
    const rv = (plan.h1 || {}).reversal || {};
    const rvBox = rv.confirmed ? `<div class="tp-reversal">${esc(th ? (rv.note_th || reversalText(rv.zone, rv.low, rv.high, "th")) : (rv.note_en || reversalText(rv.zone, rv.low, rv.high, "en")))}</div>` : "";
    const aiBox = `<div class="tp-ai" data-ai="${esc(act.id)}">
      <div class="tp-ai-k">${th ? "AI กำลังทำอะไรอยู่" : "What the AI is doing"}</div>
      <div class="tp-ai-v">${esc(th ? act.th : act.en)}</div>
      <div class="tp-ai-next">${th ? "ขั้นถัดไป" : "Next"}: ${esc(th ? act.next_th : act.next_en)} · ${th ? "เช็กล่าสุด" : "Last check"} ${esc(act.checked_hm)}</div>
    </div>`;
    const zones = `<div class="tp-ds">
      <div class="tp-ds-item demand"><span class="k">Demand Zone</span><span class="v">${esc(fmtPlanRange(demand))}</span>${demand && demand.source_th ? `<small>${esc(th ? demand.source_th : (demand.source_en || ""))}</small>` : ""}</div>
      <div class="tp-ds-item supply"><span class="k">Supply Zone</span><span class="v">${esc(fmtPlanRange(supply))}</span>${supply && supply.source_th ? `<small>${esc(th ? supply.source_th : (supply.source_en || ""))}</small>` : ""}</div>
    </div>`;
    if (compact) {
      return zones + leadLine + newsBox + swBox + rvBox + (trigger ? `<p class="tp-trigger">${esc(trigger)}</p>` : "") + aiBox + h1note + (conf.text_th ? `<p class="tp-conf">${th ? "ความมั่นใจ" : "Confidence"} ${esc(th ? conf.text_th : conf.text_en)}</p>` : "");
    }
    const stepOl = steps.length ? `<ol class="tp-steps">${steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol>` : "";
    let lots = "";
    if (pos && Array.isArray(pos.rows) && pos.rows.length && plan.sl != null) {
      const rows = pos.rows.filter(r => r.risk_pct === 1 || r.risk_pct === 2);
      lots = `<table class="tp-lots"><caption>${th ? "ตัวอย่างขนาดล็อต (ความเสี่ยง 1–2%)" : "Example lot size (1–2% risk)"}</caption>
        <thead><tr><th>${th ? "ทุน (บาท)" : "Capital (THB)"}</th><th>1%</th><th>2%</th></tr></thead><tbody>` +
        [10000, 50000, 100000].map(cap => {
          const a = rows.find(r => r.capital_thb === cap && r.risk_pct === 1);
          const b = rows.find(r => r.capital_thb === cap && r.risk_pct === 2);
          const f = r => r && r.lots != null ? String(r.lots) : "—";
          return `<tr><td>${cap.toLocaleString("en-US")}</td><td>${f(a)}</td><td>${f(b)}</td></tr>`;
        }).join("") + `</tbody></table>` +
        (pos.note_th ? `<p class="tp-lots-note">${esc(th ? pos.note_th : pos.note_en)}</p>` : "");
    }
    const rev = revs.length ? `<div class="tp-rev"><span class="k">${th ? "จุดกลับตัว" : "Reversal"}</span>${revs.map(r => `<div>${esc(th ? r.label_th : r.label_en)}</div>`).join("")}</div>` : "";
    const confLine = conf.text_th ? `<p class="tp-conf">${th ? "ความมั่นใจ" : "Confidence"} ${esc(th ? conf.text_th : conf.text_en)}${conf.note_th ? ` — <small>${esc(th ? conf.note_th : conf.note_en)}</small>` : ""}</p>` : "";
    return zones + leadLine + newsBox + swBox + rvBox +
      (trigger ? `<p class="tp-trigger">${esc(trigger)}</p>` : "") +
      (why ? `<p class="tp-why">${esc(why)}</p>` : "") +
      aiBox + h1note + stepOl + lots +
      `<div class="tp-lot-calc-host"></div>` +
      `<div class="tp-acc-host"></div>` +
      rev + confLine;
  }
  function formatPlanAlert(plan, px, lang, ctx) {
    const th = lang !== "en";
    const act = aiActivity(plan, px, ctx);
    const st = planStatus(plan, px, ctx);
    let extra = "";
    if (st.id === "tp1") extra = th ? "ชน TP1 — เลื่อน SL มาจุดเข้า" : "TP1 hit — move the stop to entry";
    else if (st.id === "tp2") extra = th ? "ชน TP2" : "TP2 hit";
    else if (st.id === "tp3") extra = th ? "ชน TP3" : "TP3 hit";
    else if (st.id === "sl") extra = th ? "ชนจุดตัดขาดทุน (SL)" : "Stop hit";
    else if (st.id === "cancelled") extra = th ? ("แผนถูกยกเลิก" + (st.th ? " — " + st.th : "")) : ("Plan cancelled" + (st.en ? " — " + st.en : ""));
    const built = buildPlanAlert(plan, px, th ? "th" : "en", ctx, extra);
    const lines = [];
    lines.push(built.lead);
    if (extra) lines.push(extra);
    lines.push(th ? (plan.trigger_th || entryZoneLabel(plan.side, "th")) : (plan.trigger_en || entryZoneLabel(plan.side, "en")));
    lines.push("Demand Zone " + fmtPlanRange(plan.demand_zone));
    lines.push("Supply Zone " + fmtPlanRange(plan.supply_zone));
    if (plan.entry_low != null) lines.push((th ? "เข้า " : "Entry ") + fmtPlanRange({ low: plan.entry_low, high: plan.entry_high }));
    else if (plan.entry != null) lines.push((th ? "เข้า " : "Entry ") + Number(plan.entry).toFixed(1));
    if (plan.sl != null) lines.push("SL " + Number(plan.sl).toFixed(1));
    (plan.tps || []).forEach(tp => lines.push("TP" + tp.n + " " + Number(tp.price).toFixed(1) + (tp.rr != null ? " (" + tp.rr + "R)" : "")));
    const h1 = (ctx && ctx.h1) || plan.h1 || {};
    if (h1.reversal && h1.reversal.confirmed) lines.push(th ? (h1.reversal.note_th || reversalText(h1.reversal.zone, h1.reversal.low, h1.reversal.high, "th")) : (h1.reversal.note_en || reversalText(h1.reversal.zone, h1.reversal.low, h1.reversal.high, "en")));
    else if (h1.sideways && h1.sideways.active) lines.push(th ? sidewaysText(h1.sideways.low, h1.sideways.high, "th") : sidewaysText(h1.sideways.low, h1.sideways.high, "en"));
    else if (h1.breakout && h1.breakout.confirmed) lines.push(th ? (h1.breakout.note_th || breakoutText(h1.breakout.low, h1.breakout.high, h1.breakout.direction, "th")) : (h1.breakout.note_en || breakoutText(h1.breakout.low, h1.breakout.high, h1.breakout.direction, "en")));
    (plan.reversal || []).slice(0, 2).forEach(r => lines.push(th ? r.label_th : r.label_en));
    if (plan.confidence) lines.push((th ? "ความมั่นใจ " : "Confidence ") + (th ? plan.confidence.text_th : plan.confidence.text_en));
    lines.push((th ? act.th : act.en) + " · " + (th ? "เช็กล่าสุด " : "Last check ") + act.checked_hm);
    const full = lines.filter(Boolean).join("\n");
    return { full, short: built.short, lead: built.lead, activityId: act.id, statusId: st.id, kind: built.kind, stance: built.stance };
  }

  function drawPlanStrip(ctx, x, y, w, h, plan, lang, livePx) {
    if (!plan || h < 32 || w < 200) return 0;
    glassPanel(ctx, x, y, w, h, 12);
    const st = planStatus(plan, livePx != null ? livePx : plan.spot);
    const act = aiActivity(plan, livePx != null ? livePx : plan.spot);
    const side = plan.side || "wait";
    const col = side === "buy" ? UP : side === "sell" ? DN : GOLD;
    const pad = 10;
    const two = h >= 52;
    ctx.textBaseline = "middle";
    const badge = entryZoneLabel(side, lang);
    ctx.font = `800 12px ${FONT}`;
    const bw = Math.min(170, Math.max(88, ctx.measureText(badge).width + 16));
    const badgeY = two ? y + 8 : y + 8;
    const badgeH = two ? 20 : h - 16;
    ctx.fillStyle = col + "24";
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.2;
    rr(ctx, x + pad, badgeY, bw, badgeH, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col;
    fillFit(ctx, badge, x + pad + 8, badgeY + badgeH / 2, bw - 14);
    const bits = [];
    bits.push(lang === "en" ? "Trade plan" : "แผนเทรด");
    const zone = entryZoneLabel(side, lang);
    if (plan.entry_low != null && plan.entry_high != null) bits.push(zone + " " + fmt(plan.entry_low, 1) + "–" + fmt(plan.entry_high, 1));
    else if (plan.entry != null) bits.push(zone + " " + fmt(plan.entry, 1));
    if (plan.sl != null) bits.push("SL " + fmt(plan.sl, 1));
    (plan.tps || []).slice(0, 3).forEach(tp => bits.push("TP" + tp.n + " " + fmt(tp.price, 1)));
    bits.push(lang === "en" ? st.en : st.th);
    ctx.fillStyle = TX;
    ctx.font = `600 12px ${FONT}`;
    const line1Y = two ? y + 18 : y + h / 2;
    fillFit(ctx, bits.join("   ·   "), x + pad + bw + 10, line1Y, w - pad * 2 - bw - 10);
    if (two) {
      const zbits = [];
      if (plan.demand_zone) zbits.push("Demand " + fmtPlanRange(plan.demand_zone));
      if (plan.supply_zone) zbits.push("Supply " + fmtPlanRange(plan.supply_zone));
      zbits.push((lang === "en" ? (act.lead_en || act.en) : (act.lead_th || act.th)) + " · " + act.checked_hm);
      ctx.fillStyle = MUTED;
      ctx.font = `500 11px ${FONT}`;
      fillFit(ctx, zbits.join("   ·   "), x + pad, y + h - 14, w - pad * 2);
    }
    ctx.textBaseline = "alphabetic";
    return h;
  }

  function drawPlanPanel(ctx, x, y, w, h, plan, lang, livePx) {
    if (!plan || h < 120 || w < 240) return 0;
    glassPanel(ctx, x, y, w, h, 16);
    const live = livePx != null ? livePx : plan.spot;
    const st = planStatus(plan, live);
    const act = aiActivity(plan, live);
    const side = plan.side || "wait";
    const col = side === "buy" ? UP : side === "sell" ? DN : GOLD;
    const pad = 16;
    const innerW = w - pad * 2;
    ctx.textBaseline = "middle";
    ctx.fillStyle = GOLD;
    ctx.font = `700 12px ${FONT}`;
    fillFit(ctx, lang === "en" ? "Trade plan" : "แผนเทรด", x + pad, y + 18, w * 0.42);
    const badge = entryZoneLabel(side, lang);
    const stLab = lang === "en" ? st.en : st.th;
    ctx.font = `800 13px ${FONT}`;
    const bw = Math.min(200, ctx.measureText(badge).width + 16);
    const sw = Math.min(140, ctx.measureText(stLab).width + 16);
    ctx.fillStyle = col + "24"; ctx.strokeStyle = col; ctx.lineWidth = 1.2;
    rr(ctx, x + w - pad - bw - sw - 8, y + 8, bw, 22, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col;
    fillFit(ctx, badge, x + w - pad - bw - sw, y + 19, bw - 12);
    const stCol = st.id === "sl" || st.id === "cancelled" ? DN : (st.id === "tp1" || st.id === "in" || act.id === "manage") ? UP : GOLD;
    ctx.fillStyle = stCol + "24"; ctx.strokeStyle = stCol;
    rr(ctx, x + w - pad - sw, y + 8, sw, 22, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = stCol;
    fillFit(ctx, stLab, x + w - pad - sw + 8, y + 19, sw - 12);

    let cy = y + 40;
    const limit = y + h - 20;
    const lead = (typeof alertLead === "function")
      ? alertLead(plan, live, lang === "en" ? "en" : "th")
      : (lang === "en" ? (act.lead_en || act.en) : (act.lead_th || act.th));
    if (lead && cy + 16 < limit) {
      ctx.fillStyle = TX;
      ctx.font = `700 13px ${FONT}`;
      fillFit(ctx, lead, x + pad, cy, innerW);
      cy += 20;
    }
    const trigger = lang === "en" ? (plan.trigger_en || "") : (plan.trigger_th || "");
    if (trigger && cy + 16 < limit) {
      ctx.fillStyle = col;
      ctx.font = `700 13px ${FONT}`;
      fillFit(ctx, trigger, x + pad, cy, innerW);
      cy += 18;
    }
    const why = lang === "en" ? (plan.why_en || plan.thesis_en || "") : (plan.why_th || plan.thesis_th || "");
    if (why && cy + 16 < limit) {
      ctx.fillStyle = TX;
      ctx.font = `600 12px ${FONT}`;
      fillFit(ctx, why, x + pad, cy, innerW);
      cy += 18;
    }
    if ((plan.demand_zone || plan.supply_zone) && cy + 32 < limit) {
      const hw = (innerW - 12) / 2;
      const drawZ = (zx, label, zone, color) => {
        ctx.fillStyle = color;
        ctx.font = `700 10px ${FONT}`;
        fillFit(ctx, label, zx, cy, hw);
        ctx.fillStyle = TX;
        ctx.font = `800 15px ${MONO}`;
        fillFit(ctx, fmtPlanRange(zone), zx, cy + 16, hw);
      };
      drawZ(x + pad, "Demand Zone", plan.demand_zone, UP);
      drawZ(x + pad + hw + 12, "Supply Zone", plan.supply_zone, DN);
      cy += 36;
    }

    const aiH = 52;
    if (cy + aiH < limit) {
      ctx.fillStyle = "rgba(201,169,98,0.10)";
      ctx.strokeStyle = "rgba(201,169,98,0.45)";
      ctx.lineWidth = 1;
      rr(ctx, x + pad, cy, innerW, aiH, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = GOLD;
      ctx.font = `700 10px ${FONT}`;
      fillFit(ctx, lang === "en" ? "What the AI is doing" : "AI กำลังทำอะไรอยู่", x + pad + 10, cy + 11, innerW - 20);
      ctx.fillStyle = TX;
      ctx.font = `700 13px ${FONT}`;
      fillFit(ctx, lang === "en" ? act.en : act.th, x + pad + 10, cy + 27, innerW - 20);
      ctx.fillStyle = MUTED;
      ctx.font = `500 11px ${FONT}`;
      fillFit(ctx, (lang === "en" ? "Next: " : "ขั้นถัดไป: ") + (lang === "en" ? act.next_en : act.next_th) + "  ·  " + act.checked_hm, x + pad + 10, cy + 42, innerW - 20);
      cy += aiH + 6;
    }

    const rows = [];
    if (plan.entry_low != null) rows.push([entryZoneLabel(side, lang), fmt(plan.entry_low, 1) + " – " + fmt(plan.entry_high, 1)]);
    else if (plan.entry != null) rows.push([entryZoneLabel(side, lang), fmt(plan.entry, 1)]);
    if (plan.sl != null) rows.push(["SL", fmt(plan.sl, 1)]);
    (plan.tps || []).forEach(tp => rows.push(["TP" + tp.n, fmt(tp.price, 1) + (tp.rr != null ? "  ·  " + tp.rr + "R" : "")]));
    const rowCount = Math.ceil(rows.length / 2);
    const rowH = 32;
    if (rows.length && cy + rowH < limit) {
      const cols = 2;
      const cw = (innerW - 10) / cols;
      rows.forEach((r, i) => {
        const c = i % cols, row = Math.floor(i / cols);
        const ry = cy + row * rowH;
        if (ry + 26 > limit) return;
        const rx = x + pad + c * (cw + 10);
        ctx.fillStyle = MUTED;
        ctx.font = `600 11px ${FONT}`;
        fillFit(ctx, r[0], rx, ry + 6, cw);
        ctx.fillStyle = TX;
        ctx.font = `800 15px ${MONO}`;
        fillFit(ctx, r[1], rx, ry + 22, cw);
      });
      cy += rowCount * rowH + 4;
    }

    const steps = (lang === "en" ? plan.steps_en : plan.steps_th) || [];
    if (steps.length && cy + 16 < limit) {
      ctx.fillStyle = TX;
      ctx.font = `600 11px ${FONT}`;
      for (let i = 0; i < steps.length; i++) {
        if (cy + 14 > limit) break;
        fillFit(ctx, (i + 1) + ". " + steps[i], x + pad, cy, innerW);
        cy += 15;
      }
      cy += 2;
    }

    if (plan.confidence && cy + 14 < limit) {
      ctx.fillStyle = MUTED;
      ctx.font = `600 11px ${FONT}`;
      const conf = lang === "en" ? plan.confidence.text_en : plan.confidence.text_th;
      fillFit(ctx, (lang === "en" ? "Confidence " : "ความมั่นใจ ") + (conf || ""), x + pad, cy, innerW);
      cy += 16;
    }

    ctx.fillStyle = MUTED;
    ctx.font = `500 11px ${FONT}`;
    const inv = lang === "en" ? plan.invalidation_en : plan.invalidation_th;
    const foot = [inv, lang === "en" ? (plan.timeframe_en || plan.timeframe) : (plan.timeframe_th || plan.timeframe), lang === "en" ? (plan.guide_disclaimer_en || plan.disclaimer_en) : (plan.guide_disclaimer_th || plan.disclaimer_th)].filter(Boolean).join("  ·  ");
    fillFit(ctx, foot, x + pad, y + h - 12, innerW);
    ctx.textBaseline = "alphabetic";
    return h;
  }

  function drawPrice(ctx, W, H, p, lang) {
    const portrait = H > 900;
    const box = headerBox(ctx, W, H, lang, p.bars || p.barsH1, portrait ? 1.2 : 1.05, p);
    const info = trendInfo(p, lang);
    const headline = lang === "en" ? "XAUUSD spot — latest" : "ทองคำ XAUUSD ล่าสุด";
    const caption = lang === "en" ? "XAUUSD intraday" : "XAUUSD ระหว่างวัน";
    const gutter = 14;
    const px = fmt(p.price, 2);
    const chgInfo = resolveChange(p);

    if (portrait) {
      ctx.fillStyle = TX;
      ctx.font = `800 40px ${FONT}`;
      fillFit(ctx, headline, box.left, box.top + 36, box.right - box.left);
      const badge = drawTrendBadge(ctx, box.left, box.top + 52, info, lang, 1.05);
      ctx.fillStyle = MUTED;
      ctx.font = `600 13px ${FONT}`;
      fillFit(ctx, info.strength, box.left + badge.w + 14, box.top + 52 + badge.h * 0.68, box.right - box.left - badge.w - 20);
      const numY = box.top + 168;
      heroNumber(ctx, px, box.left, numY, 96);
      const badgeY = numY + 14;
      changeBadge(ctx, box.left, badgeY, chgInfo.change, chgInfo.changePct, chgInfo.known);
      ctx.fillStyle = MUTED;
      ctx.font = `500 15px ${FONT}`;
      let capY = badgeY + (chgInfo.known ? 64 : 22);
      if (chgInfo.known && chgInfo.prevClose != null) {
        fillFit(ctx, lang === "en" ? "vs previous close  " + fmt(chgInfo.prevClose, 2) : "เทียบราคาปิดวันก่อน  " + fmt(chgInfo.prevClose, 2), box.left, capY, box.right - box.left);
        capY += 22;
      }
      const perfH = drawPerfRow(ctx, box.left, capY + 4, box.right - box.left, p.perf, lang);
      if (perfH) capY += perfH;
      const thaiH = p.thai ? 128 : 0;
      const planH = p.plan ? 320 : 0;
      const srH = 132;
      let y = capY + 8;
      if (planH) { drawPlanPanel(ctx, box.left, y, box.right - box.left, planH, p.plan, lang, num(p.price)); y += planH + 12; }
      drawSRTable(ctx, box.left, y, box.right - box.left, srH, p.pivots, lang);
      y += srH + 12;
      const chartH = box.bottom - y - (thaiH ? thaiH + 12 : 0);
      drawCandleChart(ctx, p.bars || p.barsH1, box.left, y, box.right - box.left, Math.max(220, chartH), {
        support: p.support, resistance: p.resistance, last: num(p.price), caption
      });
      if (thaiH) drawThaiPanel(ctx, box.left, box.bottom - thaiH, box.right - box.left, thaiH, p.thai, lang);
    } else {
      const bandH = p.thai ? 128 : 118;
      const planH = p.plan ? 58 : 0;
      const bandY = box.bottom - bandH;
      const planY = bandY - (planH ? planH + 10 : 0);
      const contentBottom = (planH ? planY : bandY) - 10;
      const chartX = 616;
      const leftW = chartX - box.left - gutter;
      ctx.fillStyle = TX;
      ctx.font = `800 30px ${FONT}`;
      fillFit(ctx, headline, box.left, box.top + 26, leftW);
      const badge = drawTrendBadge(ctx, box.left, box.top + 40, info, lang, 0.88);
      ctx.fillStyle = MUTED;
      ctx.font = `600 12px ${FONT}`;
      fillFit(ctx, info.strength, box.left + badge.w + 10, box.top + 40 + badge.h * 0.68, leftW - badge.w - 12);
      const numY = box.top + 128;
      heroNumber(ctx, px, box.left, numY, 72);
      const badgeY = numY + 12;
      changeBadge(ctx, box.left, badgeY, chgInfo.change, chgInfo.changePct, chgInfo.known);
      ctx.fillStyle = MUTED;
      ctx.font = `500 13px ${FONT}`;
      let capY = badgeY + (chgInfo.known ? 58 : 20);
      if (chgInfo.known && chgInfo.prevClose != null) {
        fillFit(ctx, lang === "en" ? "vs previous close  " + fmt(chgInfo.prevClose, 2) : "เทียบราคาปิดวันก่อน  " + fmt(chgInfo.prevClose, 2), box.left, capY, leftW);
        capY += 18;
      }
      if (capY + 28 < contentBottom) {
        drawPerfRow(ctx, box.left, capY + 2, leftW, p.perf, lang);
      }
      if (p.plan) drawPlanStrip(ctx, box.left, planY, box.right - box.left, planH, p.plan, lang, num(p.price));
      if (p.thai) {
        const srW = Math.round((box.right - box.left - gutter) * 0.58);
        drawSRTable(ctx, box.left, bandY, srW, bandH, p.pivots, lang);
        drawThaiPanel(ctx, box.left + srW + gutter, bandY, box.right - (box.left + srW + gutter), bandH, p.thai, lang);
      } else {
        drawSRTable(ctx, box.left, bandY, box.right - box.left, bandH, p.pivots, lang);
      }
      drawCandleChart(ctx, p.bars || p.barsH1, chartX, box.top - 4, box.right - chartX, Math.max(160, contentBottom - (box.top - 4)), {
        support: p.support, resistance: p.resistance, last: num(p.price), caption
      });
    }
  }

  function forecastHeadline(p, lang, tgt) {
    const up = Math.round(Number(p.up ?? 50));
    const dn = Math.round(Number(p.down ?? 100 - up));
    const when = lang === "en" ? fmtBkk(tgt.to, "en", true) : fmtBkk(tgt.to, "th");
    if (up >= 55) return lang === "en" ? `AI forecast: up to ${when}` : `AI คาดการณ์ ขึ้น ถึง ${when}`;
    if (dn >= 55) return lang === "en" ? `AI forecast: down to ${when}` : `AI คาดการณ์ ลง ถึง ${when}`;
    return lang === "en" ? `AI forecast: up / down to ${when}` : `AI คาดการณ์ ขึ้น/ลง ถึง ${when}`;
  }

  function drawForecast(ctx, W, H, p, lang) {
    const portrait = H > 900;
    const tgt = p.target || forecastTarget(p.updated, p.horizon);
    const box = headerBox(ctx, W, H, lang, p.barsH1 || p.bars, portrait ? 1.15 : 1.0, p);
    const headline = forecastHeadline(p, lang, tgt);
    ctx.fillStyle = TX;
    ctx.font = `800 ${portrait ? 38 : 28}px ${FONT}`;
    const afterH = wrapText(ctx, headline, box.left, box.top + (portrait ? 36 : 24), (portrait ? box.right - box.left : 620), portrait ? 44 : 34, 3);
    const info = trendInfo(p, lang);
    const tb = drawTrendBadge(ctx, box.left, afterH + 8, info, lang, portrait ? 1 : 0.9);
    ctx.fillStyle = MUTED;
    ctx.font = `600 13px ${FONT}`;
    ctx.fillText(info.strength, box.left + tb.w + 12, afterH + 8 + tb.h * 0.68);

    const up = Math.round(Number(p.up ?? 50));
    const dn = Math.round(Number(p.down ?? 100 - up));
    const numY = afterH + tb.h + (portrait ? 90 : 70);
    ctx.font = `800 ${portrait ? 88 : 78}px ${MONO}`;
    ctx.fillStyle = UP;
    ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 16;
    ctx.fillText(up + "%", box.left, numY);
    ctx.shadowBlur = 0;
    const capY = numY + (portrait ? 48 : 36);
    ctx.fillStyle = MUTED;
    ctx.font = `600 16px ${FONT}`;
    ctx.fillText(lang === "en" ? "Chance up" : "โอกาสขึ้น", box.left, capY);
    ctx.textAlign = "right";
    ctx.font = `800 ${portrait ? 88 : 78}px ${MONO}`;
    ctx.fillStyle = DN;
    const right = portrait ? box.right : 580;
    ctx.fillText(dn + "%", right, numY);
    ctx.fillStyle = MUTED;
    ctx.font = `600 16px ${FONT}`;
    ctx.fillText(lang === "en" ? "Chance down" : "โอกาสลง", right, capY);
    ctx.textAlign = "left";

    const a7 = p.acc7 == null ? "—" : Math.round(Number(p.acc7)) + "%";
    const a30 = p.acc30 == null ? "—" : Math.round(Number(p.acc30)) + "%";
    ctx.fillStyle = GOLD2;
    ctx.font = `600 16px ${FONT}`;
    const acc = lang === "en" ? `7-day accuracy ${a7}  ·  30-day ${a30}` : `ความแม่นยำ 7 วัน ${a7}  ·  30 วัน ${a30}`;
    ctx.fillText(acc, box.left, capY + 28);

    const cy = capY + 46;
    if (portrait) {
      drawForecastPath(ctx, p.barsH1 || p.bars, box.left, cy, box.right - box.left, Math.max(280, box.bottom - cy), p, lang, tgt);
    } else {
      const reasons = (lang === "en" ? (p.reasonsEn || p.reasons) : (p.reasons || p.reasonsEn)) || [];
      ctx.font = `500 16px ${FONT}`;
      reasons.slice(0, 3).forEach((r, i) => {
        const dir = Array.isArray(r) ? r[0] : "neutral";
        const text = Array.isArray(r) ? r[1] : String(r);
        ctx.fillStyle = dir === "up" ? UP : dir === "down" ? DN : GOLD;
        ctx.fillText(dir === "up" ? "▲" : dir === "down" ? "▼" : "●", box.left, cy + 8 + i * 26);
        ctx.fillStyle = TX;
        const clipped = text.length > 42 ? text.slice(0, 41) + "…" : text;
        ctx.fillText(clipped, box.left + 22, cy + 8 + i * 26);
      });
      drawForecastPath(ctx, p.barsH1 || p.bars, 600, box.top - 8, box.right - 600, box.bottom - (box.top - 8), p, lang, tgt);
    }
  }

  function drawTrend(ctx, W, H, p, lang) {
    const portrait = H > 900;
    const box = headerBox(ctx, W, H, lang, p.barsH1 || p.bars, portrait ? 1.15 : 1.0, p);
    const align = lang === "en" ? (p.alignEn || p.align || "") : (p.align || p.alignEn || "");
    const short = /ภาพรวม([^\s·]+)/.exec(align);
    const head = lang === "en"
      ? "Trend analysis — " + (align.split("·").slice(-1)[0] || "bias").trim()
      : "วิเคราะห์แนวโน้ม — " + (short ? short[0] : (align.split("·").slice(-1)[0] || "").trim());
    ctx.fillStyle = TX;
    ctx.font = `800 ${portrait ? 42 : 32}px ${FONT}`;
    const after = wrapText(ctx, head, box.left, box.top + (portrait ? 40 : 30), portrait ? box.right - box.left : 540, portrait ? 50 : 38, 2);

    const mtf = p.mtf || [];
    if (portrait) {
      drawBiasMeter(ctx, box.left, after + 16, box.right - box.left, 110, mtf, lang);
      const ly = after + 142;
      drawSRTable(ctx, box.left, ly, box.right - box.left, 168, p.pivots, lang);
      const cy = ly + 180;
      drawCandleChart(ctx, p.barsH1 || p.bars, box.left, cy, box.right - box.left, box.bottom - cy, {
        support: p.support, resistance: p.resistance, last: num(p.price),
        caption: lang === "en" ? "Hourly with key levels" : "รายชั่วโมงกับระดับสำคัญ"
      });
    } else {
      drawBiasMeter(ctx, box.left, after + 10, 520, 100, mtf, lang);
      const ly = after + 124;
      const srH = Math.max(118, Math.min(150, box.bottom - ly));
      drawSRTable(ctx, box.left, ly, 520, srH, p.pivots, lang);
      drawCandleChart(ctx, p.barsH1 || p.bars, 600, box.top - 8, box.right - 600, box.bottom - (box.top - 8), {
        support: p.support, resistance: p.resistance, last: num(p.price),
        caption: lang === "en" ? "Hourly with key levels" : "รายชั่วโมงกับระดับสำคัญ"
      });
    }
  }

  function spdrSlice3m(series, periods) {
    const rows = (series || []).filter(s => s && s.tonnes != null);
    const from = periods && periods["3M"] && periods["3M"].from;
    if (from) {
      const cut = rows.filter(s => String(s.date || "") >= String(from));
      if (cut.length >= 8) return cut;
    }
    return rows.slice(-66);
  }

  function drawSpdr(ctx, W, H, p, lang) {
    const portrait = H > 900;
    const box = headerBox(ctx, W, H, lang, null, portrait ? 1.15 : 1.0, p);
    const side = p.side || (p.change > 0 ? "buy" : p.change < 0 ? "sell" : "flat");
    const scol = side === "buy" ? UP : side === "sell" ? DN : GOLD;
    const flow = side === "buy"
      ? (lang === "en" ? "SPDR inflow " : "SPDR ซื้อเข้า ") + withTon(p.change, lang)
      : side === "sell"
        ? (lang === "en" ? "SPDR outflow " : "SPDR ขายออก ") + withTon(p.change, lang)
        : (lang === "en" ? "SPDR holdings unchanged" : "SPDR ถือครองไม่เปลี่ยนแปลง");
    ctx.fillStyle = scol;
    ctx.font = `800 ${portrait ? 44 : 34}px ${FONT}`;
    const after = wrapText(ctx, flow, box.left, box.top + (portrait ? 44 : 32), portrait ? box.right - box.left : 560, portrait ? 52 : 40, 2);

    ctx.fillStyle = MUTED;
    ctx.font = `600 16px ${FONT}`;
    ctx.fillText(lang === "en" ? "Latest holdings" : "ถือครองล่าสุด", box.left, after + 28);
    const numY = after + (portrait ? 118 : 96);
    heroNumber(ctx, fmt(p.tonnes, 2), box.left, numY, portrait ? 84 : 72);
    ctx.font = `800 ${portrait ? 84 : 72}px ${MONO}`;
    const numW = ctx.measureText(fmt(p.tonnes, 2)).width;
    ctx.font = `700 ${portrait ? 28 : 22}px ${FONT}`;
    ctx.fillStyle = GOLD2;
    fillFit(ctx, unitTon(lang), box.left + numW + 12, numY - 6, 200);

    const asof = lang === "en"
      ? "Trade date  " + (p.asOfEn || p.asOf || "—")
      : "วันที่ซื้อขาย  " + (p.asOfTh || p.asOf || "—");
    ctx.fillStyle = TX;
    ctx.font = `600 14px ${FONT}`;
    const infoY = numY + (portrait ? 42 : 32);
    fillFit(ctx, asof + (lang === "en" ? "  ·  trade-date basis, not live today" : "  ·  ฐานวันซื้อขาย ไม่ใช่ตัวเลขสดวันนี้"), box.left, infoY, (portrait ? (box.right - box.left) : 540));

    const implied = p.implied_gold_usd != null ? Number(p.implied_gold_usd) : (p.impliedGold != null ? Number(p.impliedGold) : null);
    const flowUsd = p.flow_value_usd != null ? Number(p.flow_value_usd) : (p.flowValueUsd != null ? Number(p.flowValueUsd) : null);
    const navSh = p.nav_per_share != null ? Number(p.nav_per_share) : (p.navPerShare != null ? Number(p.navPerShare) : null);
    let chipY = infoY + 16;
    if (implied != null) {
      const refW = portrait ? (box.right - box.left) : 540;
      const refH = portrait ? 96 : 88;
      const rx = box.left, ry = infoY + 12;
      glassPanel(ctx, rx, ry, refW, refH, 16);
      ctx.fillStyle = MUTED;
      ctx.font = `600 12px ${FONT}`;
      const lab = lang === "en"
        ? (p.impliedLabelEn || "Gold price implied from Trust NAV (not an execution price)")
        : (p.impliedLabelTh || "ราคาทองคำโดยนัยจาก NAV (ไม่ใช่ราคาซื้อจริง)");
      ctx.fillText(lab, rx + 14, ry + 22);
      ctx.fillStyle = GOLD;
      ctx.font = `800 26px ${MONO}`;
      ctx.fillText("$" + fmt(implied, 2) + " / oz", rx + 14, ry + 50);
      ctx.fillStyle = TX;
      ctx.font = `700 16px ${FONT}`;
      let extra = "";
      if (flowUsd != null) {
        const fl = side === "buy" ? (lang === "en" ? "Approx. inflow " : "ประมาณมูลค่าซื้อเข้า ") : side === "sell" ? (lang === "en" ? "Approx. outflow " : "ประมาณมูลค่าขายออก ") : (lang === "en" ? "Approx. flow " : "ประมาณมูลค่า ");
        extra = fl + fmtUsdShort(flowUsd, lang);
      }
      if (navSh != null) extra += (extra ? "  ·  " : "") + (lang === "en" ? "NAV/share " : "NAV ต่อหน่วย $") + (lang === "en" ? ("$" + fmt(navSh, 2)) : fmt(navSh, 2));
      ctx.fillText(extra, rx + 14, ry + refH - 14);
      ctx.fillStyle = MUTED;
      ctx.font = `500 11px ${FONT}`;
      chipY = ry + refH + 12;
    }

    const periods = p.periods || {};
    const keys = [["1W", "1W", "1 สัปดาห์"], ["1M", "1M", "1 เดือน"], ["3M", "3M", "3 เดือน"], ["YTD", "YTD", "ปีนี้"], ["1Y", "1Y", "1 ปี"]];
    const chipH = portrait ? 78 : 64;
    const chipAreaW = portrait ? (box.right - box.left) : 540;
    const cw = chipAreaW / keys.length;
    keys.forEach(([k, enL, thL], i) => {
      const it = periods[k]; if (!it) return;
      const x = box.left + i * cw;
      glassPanel(ctx, x, chipY, cw - 8, chipH, 12);
      ctx.fillStyle = MUTED; ctx.font = `700 12px ${FONT}`;
      ctx.fillText(lang === "en" ? enL : thL, x + 8, chipY + 20);
      const sc = it.side || (it.change > 0 ? "buy" : it.change < 0 ? "sell" : "flat");
      ctx.fillStyle = sc === "buy" ? UP : sc === "sell" ? DN : GOLD;
      ctx.font = `800 15px ${FONT}`;
      const label = withTon(it.change, lang);
      // shrink if needed
      if (ctx.measureText(label).width > cw - 16) ctx.font = `800 13px ${FONT}`;
      ctx.fillText(label, x + 8, chipY + 46);
    });

    const series = spdrSlice3m(p.series, p.periods);
    if (portrait) {
      const cy = chipY + chipH + 16;
      drawSpdrChart(ctx, series, box.left, cy, box.right - box.left, box.bottom - cy, lang);
    } else {
      drawSpdrChart(ctx, series, 610, box.top - 8, box.right - 610, box.bottom - (box.top - 8), lang);
    }
  }

  function drawBrief(ctx, W, H, p, lang) {
    const portrait = H > 900;
    const box = headerBox(ctx, W, H, lang, p.barsH1 || p.bars, portrait ? 1.15 : 1.0, p);
    const title = p.title || (lang === "en" ? "Market brief" : "สรุปตลาด");
    ctx.fillStyle = TX;
    ctx.font = `800 ${portrait ? 40 : 30}px ${FONT}`;
    ctx.fillText(title, box.left, box.top + (portrait ? 40 : 28));
    if (p.price != null) {
      heroNumber(ctx, fmt(p.price, 2), box.left, box.top + (portrait ? 150 : 120), portrait ? 90 : 72);
      const chgInfo = resolveChange(p);
      changeBadge(ctx, box.left, box.top + (portrait ? 166 : 136), chgInfo.change, chgInfo.changePct, chgInfo.known);
    }
    ctx.fillStyle = TX;
    ctx.font = `500 ${portrait ? 22 : 18}px ${FONT}`;
    const note = p.note || p.text || p.text_th || "";
    wrapText(ctx, note, box.left, box.top + (portrait ? 280 : 230), box.right - box.left, portrait ? 34 : 28, portrait ? 16 : 8);
  }
  function drawPlan(ctx, W, H, p, lang) {
    const portrait = H > 900;
    const box = headerBox(ctx, W, H, lang, p.bars || p.barsH1, portrait ? 1.15 : 1.0, p);
    ctx.fillStyle = TX;
    ctx.font = `800 ${portrait ? 40 : 30}px ${FONT}`;
    fillFit(ctx, lang === "en" ? "XAUUSD trade plan" : "แผนเทรด XAUUSD", box.left, box.top + (portrait ? 36 : 26), box.right - box.left);
    if (p.price != null) {
      ctx.fillStyle = MUTED;
      ctx.font = `600 14px ${FONT}`;
      fillFit(ctx, (lang === "en" ? "Live " : "ราคาสด ") + fmt(p.price, 2), box.left, box.top + (portrait ? 64 : 50), 400);
    }
    const top = box.top + (portrait ? 84 : 66);
    if (portrait) {
      drawPlanPanel(ctx, box.left, top, box.right - box.left, 420, p.plan || p, lang, num(p.price));
      const cy = top + 432;
      drawCandleChart(ctx, p.bars || p.barsH1, box.left, cy, box.right - box.left, box.bottom - cy, {
        support: p.support, resistance: p.resistance, last: num(p.price),
        caption: lang === "en" ? "Intraday with plan levels" : "ระหว่างวันกับจุดเข้า–จุดออก"
      });
    } else {
      drawPlanPanel(ctx, box.left, top, 560, Math.max(200, box.bottom - top), p.plan || p, lang, num(p.price));
      drawCandleChart(ctx, p.bars || p.barsH1, 616, box.top - 4, box.right - 616, box.bottom - (box.top - 4), {
        support: p.support, resistance: p.resistance, last: num(p.price),
        caption: lang === "en" ? "Intraday with plan levels" : "ระหว่างวันกับจุดเข้า–จุดออก"
      });
    }
  }
  const DRAW = { price: drawPrice, forecast: drawForecast, trend: drawTrend, spdr: drawSpdr, brief: drawBrief, plan: drawPlan };

  function render(kind, payload, sizeName) {
    const lang = (payload && payload.lang) || (enLang() ? "en" : "th");
    const [W, H] = SIZES[sizeName] || SIZES.landscape;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    const p = enrich(kind, Object.assign({ lang }, payload || {}));
    (DRAW[kind] || drawPrice)(ctx, W, H, p, lang);
    return c;
  }

  function toBlob(canvas) {
    return new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("png")), "image/png"));
  }
  function fileBase(kind, payload) {
    const raw = (payload && (payload.asOf || payload.date)) || fmtBkk(new Date(), "en");
    const stamp = String(raw).replace(/[^\dA-Za-z]+/g, "-").replace(/-+$/g, "").slice(0, 11);
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
  let sheetFiles = [];
  let sheetKind = null;
  let sheetPayload = null;
  let sheetLang = "th";
  let sheetTimer = null;
  let sheetGen = 0;

  function toast(msg) {
    let el = document.getElementById("shareToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "shareToast";
      el.className = "share-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("on");
    clearTimeout(toast._tm);
    toast._tm = setTimeout(() => el.classList.remove("on"), 4500);
  }

  async function waitAssets() {
    try { await loadDollar(); } catch (_) {}
    try { await preloadBrand(); } catch (_) {}
    try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (_) {}
    try {
      await Promise.all([
        document.fonts.load(`800 80px ${FONT}`),
        document.fonts.load(`700 40px ${FONT}`),
        document.fonts.load(`800 80px ${MONO}`)
      ]);
    } catch (_) {}
  }

  function closeFullscreen() {
    const full = document.getElementById("shareFull");
    if (full) { full.classList.remove("on"); full.hidden = true; }
  }
  function stopSheetTimer() {
    if (sheetTimer) { clearInterval(sheetTimer); sheetTimer = null; }
  }
  function closeSheet() {
    stopSheetTimer();
    closeFullscreen();
    const sheet = document.getElementById("shareSave");
    if (sheet) { sheet.classList.remove("on"); sheet.hidden = true; }
    saveUrlList.forEach(u => { try { URL.revokeObjectURL(u); } catch (_) {} });
    saveUrlList = [];
    sheetFiles = [];
    sheetKind = null;
    sheetPayload = null;
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
      <div class="share-brand"><img alt="PureGold by PureFxAi" src="assets/logo-lockup.png" onerror="this.src='logo-lockup.png'"></div>
      <button type="button" class="btn pri share-gallery" id="shareGoFiles" hidden></button>
      <p id="shareSaveHint"></p>
      <p id="shareSaveLoad" class="share-load" hidden></p>
      <div id="shareSaveImgs" class="imgs"></div>
      <div class="row share-nav">
        <button type="button" class="btn pri" id="shareGoChart">ดูกราฟ</button>
        <a class="btn share-site" id="shareGoSite" href="https://gold.purefxai.store/" target="_blank" rel="noopener">เข้าสู่หน้าเว็บ</a>
        <button type="button" class="btn" id="shareSaveX">ปิด</button>
      </div>
    </div>
    <div id="shareFull" class="share-full" hidden>
      <p id="shareFullHint"></p>
      <img id="shareFullImg" alt="">
      <a class="btn pri" id="shareFullOpen" target="_blank" rel="noopener"></a>
      <button type="button" class="btn" id="shareFullX"></button>
    </div>`;
    document.body.appendChild(sheet);
    sheet.addEventListener("click", e => { if (e.target === sheet) closeSheet(); });
    const x = document.getElementById("shareSaveX");
    if (x) x.addEventListener("click", closeSheet);
    const fx = document.getElementById("shareFullX");
    if (fx) fx.addEventListener("click", ev => { ev.preventDefault(); closeFullscreen(); });
    const full = document.getElementById("shareFull");
    if (full) full.addEventListener("click", e => { if (e.target === full) closeFullscreen(); });
    return sheet;
  }
  function setSheetChrome(lang) {
    const hint = document.getElementById("shareSaveHint");
    const load = document.getElementById("shareSaveLoad");
    const closeLbl = document.getElementById("shareSaveX");
    const goChart = document.getElementById("shareGoChart");
    const goSite = document.getElementById("shareGoSite");
    const goFiles = document.getElementById("shareGoFiles");
    if (hint) hint.textContent = lang === "en"
      ? "On Android, tap Share / save to gallery, then choose Save to photos or Files. You can also long-press the web image."
      : "บนแอนดรอยด์ กดแชร์/บันทึกลงแกลเลอรี่ แล้วเลือกบันทึกลงรูปภาพหรือไฟล์ หรือกดค้างที่รูปบนเว็บเพื่อบันทึก";
    if (load) load.textContent = lang === "en" ? "Creating the image…" : "กำลังสร้างรูป…";
    if (closeLbl) closeLbl.textContent = lang === "en" ? "Close" : "ปิด";
    if (goFiles) goFiles.textContent = lang === "en" ? "Share / save to gallery" : "แชร์/บันทึกลงแกลเลอรี่";
    if (goChart) {
      goChart.textContent = lang === "en" ? "View chart" : "ดูกราฟ";
      goChart.onclick = ev => {
        ev.preventDefault();
        closeSheet();
        if (typeof global.__openDash === "function") global.__openDash();
        else if (typeof global.openPureGoldChart === "function") global.openPureGoldChart();
        else window.open(document.getElementById("promoModal") || document.getElementById("dashModal")
          ? "https://dashboard.purefxai.store/?lang=" + (lang === "en" ? "en" : "th")
          : "https://gold.purefxai.store/#chart", "_blank", "noopener");
      };
    }
    if (goSite) {
      goSite.textContent = lang === "en" ? "Enter the site" : "เข้าสู่หน้าเว็บ";
      goSite.href = SITE_URL;
    }
    const fh = document.getElementById("shareFullHint");
    const fx = document.getElementById("shareFullX");
    const fo = document.getElementById("shareFullOpen");
    if (fh) fh.textContent = lang === "en"
      ? "Long-press the web image and choose Save image, or use Share / save to gallery."
      : "กดค้างที่รูปบนเว็บแล้วเลือกบันทึกรูป หรือกดแชร์/บันทึกลงแกลเลอรี่";
    if (fx) fx.textContent = lang === "en" ? "Close" : "ปิด";
    if (fo) fo.textContent = lang === "en" ? "Open web image" : "เปิดรูปบนเว็บ";
  }
  function openFullscreen(url, name, lang) {
    ensureSheet();
    setSheetChrome(lang);
    const full = document.getElementById("shareFull");
    const img = document.getElementById("shareFullImg");
    const fo = document.getElementById("shareFullOpen");
    if (img) { img.src = url; img.alt = name || ""; }
    if (fo) { fo.href = url; fo.removeAttribute("download"); }
    if (full) { full.hidden = false; full.classList.add("on"); }
  }
  function openSheetLoading(lang) {
    const sheet = ensureSheet();
    setSheetChrome(lang);
    const box = document.getElementById("shareSaveImgs");
    const load = document.getElementById("shareSaveLoad");
    const goFiles = document.getElementById("shareGoFiles");
    const hint = document.getElementById("shareSaveHint");
    if (box) box.innerHTML = "";
    if (load) { load.hidden = false; }
    if (goFiles) goFiles.hidden = true;
    if (hint) hint.textContent = lang === "en" ? "Creating the image…" : "กำลังสร้างรูป…";
    sheet.hidden = false; sheet.classList.add("on");
    return sheet;
  }
  function revokeSheetUrls() {
    saveUrlList.forEach(u => { try { URL.revokeObjectURL(u); } catch (_) {} });
    saveUrlList = [];
  }

  async function fillSheet(files, lang, kind, opt) {
    const gen = (opt && opt.gen) || sheetGen;
    const sheet = ensureSheet();
    setSheetChrome(lang);
    const box = document.getElementById("shareSaveImgs");
    const load = document.getElementById("shareSaveLoad");
    const goFiles = document.getElementById("shareGoFiles");
    const hint = document.getElementById("shareSaveHint");
    if (load) load.hidden = true;
    revokeSheetUrls();
    if (box) box.innerHTML = "";
    sheetFiles = files || [];
    const stale = !!(opt && opt.stale);
    const asOfLabel = (sheetPayload && sheetPayload.time) || fmtBkk(new Date(), lang, true);
    if (hint) {
      if (stale) {
        hint.textContent = lang === "en"
          ? ("Live poster failed. This fallback image is from " + asOfLabel + ". Do not treat it as the live price.")
          : ("สร้างรูปสดไม่สำเร็จ รูปสำรองนี้อัปเดต " + asOfLabel + " อย่าใช้เป็นราคาล่าสุด");
      } else {
        hint.textContent = (lang === "en"
          ? "On Android, tap Share / save to gallery, then choose Save to photos or Files. You can also long-press the web image."
          : "บนแอนดรอยด์ กดแชร์/บันทึกลงแกลเลอรี่ แล้วเลือกบันทึกลงรูปภาพหรือไฟล์ หรือกดค้างที่รูปบนเว็บเพื่อบันทึก")
          + "  ·  " + asOfLabel;
      }
    }
    const bindShare = ev => {
      ev.preventDefault();
      const title = "PureGold · " + SITE;
      const run = async () => {
        try {
          const fresh = await filesReadyForShare();
          const fileObjs = (fresh || []).map(f => new File([f.blob], f.name, { type: "image/png" }));
          if (!fileObjs.length) throw new Error("empty");
          if (navigator.canShare && navigator.canShare({ files: fileObjs })) {
            await navigator.share({ files: fileObjs, title, text: title });
            return;
          }
          if (navigator.share) await navigator.share({ title, text: title, url: SITE_URL });
        } catch (e) {
          if (e && e.name === "AbortError") return;
          toast(lang === "en"
            ? "Share did not complete. Open the web image and long-press to save."
            : "แชร์ไม่สำเร็จ เปิดรูปบนเว็บแล้วกดค้างเพื่อบันทึก");
        }
      };
      run();
    };
    for (const f of files) {
      if (gen !== sheetGen) return;
      let viewUrl = f.url;
      if (f.blob) {
        viewUrl = URL.createObjectURL(f.blob);
        saveUrlList.push(viewUrl);
        f.url = viewUrl;
      }
      if (!viewUrl) continue;
      const wrap = document.createElement("div");
      wrap.className = "share-shot";
      const link = document.createElement("a");
      link.className = "share-img-link";
      link.href = viewUrl;
      link.target = "_blank";
      link.rel = "noopener";
      if (f.blob) link.setAttribute("download", f.name);
      const img = document.createElement("img");
      img.src = viewUrl;
      img.alt = f.name;
      img.setAttribute("draggable", "false");
      link.appendChild(img);
      wrap.appendChild(link);
      const cap = document.createElement("p");
      cap.className = "share-asof";
      cap.textContent = (stale ? (lang === "en" ? "Fallback · " : "รูปสำรอง · ") : (lang === "en" ? "LIVE · " : "สด · ")) + (f.asOfLabel || asOfLabel);
      wrap.appendChild(cap);
      const row = document.createElement("div");
      row.className = "share-dl-row";
      const aBlob = document.createElement("a");
      aBlob.href = viewUrl;
      if (f.blob) aBlob.download = f.name;
      aBlob.className = "btn pri";
      aBlob.textContent = (lang === "en" ? "Save " : "บันทึก ") + f.w + "×" + f.h;
      aBlob.addEventListener("click", ev => {
        if (!f.blob) return;
        ev.preventDefault();
        filesReadyForShare().then(fresh => {
          const match = (fresh || []).find(x => x.w === f.w && x.h === f.h) || (fresh || [])[0];
          if (!match || !match.url) return;
          const a = document.createElement("a");
          a.href = match.url;
          a.download = match.name;
          document.body.appendChild(a);
          a.click();
          a.remove();
        });
      });
      row.appendChild(aBlob);
      wrap.appendChild(row);
      box.appendChild(wrap);
    }
    if (gen !== sheetGen) return;
    const sample = (files[0] && files[0].blob) ? [new File([files[0].blob], files[0].name, { type: "image/png" })] : [];
    const can = !!(navigator.canShare && (function () {
      try { return sample.length && navigator.canShare({ files: sample }); } catch (_) { return false; }
    })()) || !!navigator.share;
    if (goFiles) {
      goFiles.hidden = !can || stale;
      goFiles.className = "btn pri share-gallery";
      goFiles.onclick = bindShare;
    }
    sheet.hidden = false; sheet.classList.add("on");
  }

  async function tryStaticFallback(kind, lang) {
    const sizes = [SIZES.landscape, SIZES.portrait];
    const out = [];
    for (const [w, h] of sizes) {
      const url = staticPngUrl(kind || "price", w, h);
      try {
        const r = await fetch(url + "?t=" + Date.now(), { method: "HEAD", cache: "no-store" });
        if (!r || !r.ok) continue;
        const lm = Date.parse(r.headers.get("Last-Modified") || "") || 0;
        if (!lm || (Date.now() - lm) > 10 * 60 * 1000) continue;
        out.push({
          size: (h > w ? "portrait" : "landscape"),
          w, h,
          url: cacheBust(url),
          name: "puregold-" + (kind || "price") + "-" + w + "x" + h + ".png",
          asOfLabel: fmtBkk(new Date(lm), lang, true),
          stale: true
        });
      } catch (_) {}
    }
    return out.length ? out : null;
  }

  async function renderSheetFromLive(kind, payload, lang) {
    const gen = ++sheetGen;
    const live = await refreshLivePayload(kind, payload);
    if (gen !== sheetGen) return null;
    sheetKind = kind;
    sheetPayload = live;
    sheetLang = lang || live.lang || "th";
    const files = await blobsFor(kind, live);
    if (!files || !files.length) throw new Error("empty");
    if (gen !== sheetGen) return null;
    await fillSheet(files, sheetLang, kind, { gen, live: true });
    return { live, files };
  }

  async function filesReadyForShare() {
    const kind = sheetKind || "price";
    const base = sheetPayload || {};
    try {
      const tick = await fetchLiveSpot();
      const prev = Number(base.price);
      if (tick && tick.price > 0 && (!Number.isFinite(prev) || Math.abs(tick.price - prev) > 0.005)) {
        const again = await renderSheetFromLive(kind, Object.assign({}, base, { price: tick.price }), sheetLang);
        return (again && again.files) || sheetFiles;
      }
    } catch (_) {}
    return sheetFiles;
  }

  async function openSaveFlow(kind, payload) {
    const lang = (payload && payload.lang) || (enLang() ? "en" : "th");
    stopSheetTimer();
    openSheetLoading(lang);
    try {
      await waitAssets();
      await renderSheetFromLive(kind, payload, lang);
      stopSheetTimer();
      sheetTimer = setInterval(() => {
        const sheet = document.getElementById("shareSave");
        if (!sheet || sheet.hidden || !sheet.classList.contains("on")) { stopSheetTimer(); return; }
        renderSheetFromLive(kind, payload, lang).catch(() => {});
      }, 15000);
      return sheetFiles;
    } catch (e) {
      console.warn("sharecard save failed", e);
      try {
        const fallback = await tryStaticFallback(kind, lang);
        if (fallback) {
          sheetPayload = { time: fallback[0].asOfLabel };
          await fillSheet(fallback, lang, kind, { stale: true, gen: sheetGen });
          return fallback;
        }
      } catch (_) {}
      const msg = lang === "en"
        ? "Could not create the image. Please try again, or long-press a picture to save."
        : "บันทึกรูปไม่สำเร็จ กรุณาลองอีกครั้ง หรือกดค้างที่รูปเพื่อบันทึก";
      toast(msg);
      const hint = document.getElementById("shareSaveHint");
      const load = document.getElementById("shareSaveLoad");
      if (load) load.hidden = true;
      if (hint) hint.textContent = msg;
      return [];
    }
  }

  async function download(kind, payload) {
    return openSaveFlow(kind, payload);
  }
  async function share(kind, payload) {
    return openSaveFlow(kind, payload);
  }

  function buttonsHtml(lang) {
    const save = lang === "en" ? "Save" : "บันทึก";
    const sh = lang === "en" ? "Share" : "แชร์";
    const saveA = lang === "en" ? "Save image" : "บันทึกรูป";
    const shA = lang === "en" ? "Share" : "แชร์";
    const ico = (d) => `<svg class="share-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
    const dl = ico('<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M5 21h14"/>');
    const sr = ico('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4"/><path d="m15.4 6.5-6.8 4"/>');
    return `<div class="share-actions">
      <button type="button" class="share-pill share-dl" aria-label="${saveA}">${dl}<span>${save}</span></button>
      <button type="button" class="share-pill share-sh" aria-label="${shA}">${sr}<span>${sh}</span></button>
    </div>`;
  }
  function mount(el, getPayload) {
    if (!el) return;
    const lang = enLang() ? "en" : "th";
    if (!el.querySelector(".share-dl")) el.insertAdjacentHTML("beforeend", buttonsHtml(lang));
    const sync = () => {
      const L = ((getPayload && getPayload()) || {}).lang || (enLang() ? "en" : "th");
      const dl = el.querySelector(".share-dl");
      const sh = el.querySelector(".share-sh");
      const setLab = (btn, text, label) => {
        if (!btn) return;
        const span = btn.querySelector("span");
        if (span) span.textContent = text; else btn.textContent = text;
        btn.setAttribute("aria-label", label);
      };
      setLab(dl, L === "en" ? "Save" : "บันทึก", L === "en" ? "Save image" : "บันทึกรูป");
      setLab(sh, L === "en" ? "Share" : "แชร์", L === "en" ? "Share" : "แชร์");
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

  const css = `.share-actions{display:inline-flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0;width:auto;max-width:100%}
.share-actions .share-pill,.share-actions .btn{flex:0 0 auto;box-sizing:border-box;height:32px;min-height:32px;max-height:36px;min-width:0;padding:0 10px;font-size:12px;font-weight:600;line-height:1;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;gap:5px;cursor:pointer;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.22);color:#f4efe3;backdrop-filter:blur(14px) saturate(1.3);-webkit-backdrop-filter:blur(14px) saturate(1.3)}
.share-actions .share-dl,.share-actions .btn.pri.share-dl{background:rgba(245,197,66,.16);border-color:rgba(245,197,66,.42);color:#f5c542}
.share-actions .share-sh{background:rgba(255,255,255,.07);color:#ead7a2}
.share-actions .share-pill:hover,.share-actions .share-pill:focus-visible{border-color:rgba(245,197,66,.7);color:#f5c542}
.share-actions .share-ico{width:14px;height:14px;flex:0 0 auto;display:block}
.share-host{display:inline-flex;align-items:center;margin:0;flex:0 0 auto}
@media (pointer:coarse), (max-width:820px){.share-actions .share-pill,.share-actions .btn{height:36px;min-height:36px;padding:0 12px}} html.pg-mobile .share-actions .share-pill,html.pg-mobile .share-actions .btn{height:36px;min-height:36px;padding:0 12px}
.share-save{display:none;position:fixed;inset:0;z-index:120;padding:16px;align-items:center;justify-content:center;background:rgba(6,5,4,.48);backdrop-filter:blur(22px) saturate(1.4);-webkit-backdrop-filter:blur(22px) saturate(1.4)}
.share-save.on{display:flex}
.share-save .box{width:min(640px,100%);background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.05));backdrop-filter:blur(28px) saturate(1.5);-webkit-backdrop-filter:blur(28px) saturate(1.5);border:1px solid rgba(255,255,255,.28);border-radius:22px;padding:16px;max-height:min(92vh,900px);overflow:auto;box-shadow:0 24px 64px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.28)}
.share-save .share-brand{display:flex;align-items:center;margin:0 0 10px}
.share-save .share-brand img{height:36px;width:auto;background:transparent;border-radius:0}
.share-save .imgs{display:grid;gap:12px}
.share-save .share-gallery{width:100%;min-height:48px;margin:0 0 10px;font-weight:800}
.share-save .imgs img{display:block;width:100%;border-radius:14px;background:#07080d;border:1px solid rgba(255,255,255,.16);pointer-events:auto;-webkit-touch-callout:default !important;-webkit-user-select:auto;user-select:auto;touch-action:manipulation}
.share-save .imgs a.share-img-link{display:block;pointer-events:auto;-webkit-touch-callout:default !important;-webkit-user-select:auto;user-select:auto}
.share-save .share-shot{display:grid;gap:8px}
.share-save .share-dl-row{display:flex;flex-wrap:wrap;gap:8px}
.share-save .share-dl-row .btn{flex:1 1 140px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;text-decoration:none}
.share-save p{margin:0 0 10px;font-size:13px;color:#d7cdb8;line-height:1.55}.share-save .share-asof{margin:0;font-size:12px;color:#f5c542;font-weight:600}
.share-save .row{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.share-save .share-nav{position:sticky;bottom:0;z-index:2;padding-top:10px;pointer-events:none;background:linear-gradient(180deg,rgba(20,16,10,.0),rgba(20,16,10,.88) 30%,rgba(20,16,10,.96))}
.share-save .share-nav .btn,.share-save .share-nav a.btn,.share-save a.btn{pointer-events:auto;display:inline-flex;align-items:center;justify-content:center;margin-top:0;text-decoration:none;flex:1 1 120px;min-height:44px;border-radius:12px}
.share-save a.share-site{border:1px solid rgba(245,197,66,.45);color:#f5c542;background:transparent}
.share-load{margin:0 0 10px;font-size:13px;color:#f5c542}
.share-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:140;max-width:min(92vw,420px);padding:12px 16px;border-radius:14px;background:linear-gradient(180deg,rgba(20,16,10,.92),rgba(10,8,6,.92));border:1px solid rgba(245,197,66,.45);color:#f4efe3;font-size:14px;line-height:1.5;box-shadow:0 16px 40px rgba(0,0,0,.45);opacity:0;pointer-events:none;transition:opacity .2s}
.share-toast.on{opacity:1;pointer-events:auto}
.share-full{display:none;position:fixed;inset:0;z-index:130;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px;background:rgba(6,5,4,.92)}
.share-full.on{display:flex}
.share-full img{max-width:100%;max-height:78vh;object-fit:contain;border-radius:12px;background:#07080d}
.share-full p{margin:0;color:#f4efe3;font-size:14px;text-align:center}`;

  function injectCss() {
    if (document.getElementById("sharecard-css")) return;
    const s = document.createElement("style");
    s.id = "sharecard-css"; s.textContent = css;
    document.head.appendChild(s);
  }
  function ensureFonts() {
    if (document.getElementById("sharecard-fonts")) return;
    const l = document.createElement("link");
    l.id = "sharecard-fonts";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600;700;800&family=Noto+Sans+Thai:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700;800&display=swap";
    document.head.appendChild(l);
  }
  function boot() { injectCss(); ensureFonts(); preloadBrand(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  global.ShareCard = {
    SIZES, SITE, SITE_URL, VERSION, render, blobsFor, download, share, mount, buttonsHtml, toast,
    forecastTarget, fmtBkk, fmt, chg, closeSheet, loadMarket, attachMarket, enrich,
    loadThaiGold, loadPivots, loadDollar, staticPngUrl, fetchLiveSpot, refreshLivePayload, fmtBkk, planStatus, entryZoneLabel, fmtPlanRange, aiActivity, planGuideHtml, formatPlanAlert, accuracyHtml, bindLotCalc, newsBlackoutOf, h1Confirmed, alertLead, withAlertLead, buildPlanAlert, reversalText, sidewaysText, breakoutText,
    async ready() {
      ensureFonts();
      try { await preloadBrand(); } catch (_) {}
      try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (_) {}
      try {
        await Promise.all([
          document.fonts.load(`800 80px ${FONT}`),
          document.fonts.load(`700 40px ${FONT}`),
          document.fonts.load(`800 80px ${MONO}`)
        ]);
      } catch (_) {}
      try { await Promise.all([loadThaiGold(), loadPivots(), loadDollar()]); } catch (_) {}
      try { await preloadBrand(); } catch (_) {}
    }
  };
})(window);
