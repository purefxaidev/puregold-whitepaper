/* PUREGOLD share posters: purpose-built 1200x675 + 1080x1350 social graphics. */
(function (global) {
  const SITE = "gold.purefxai.store";
  const VERSION = "20261110d";
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
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d);
    const g = k => +parts.find(p => p.type === k).value;
    const day = g("day"), mo = g("month"), yr = g("year");
    const hh = String(g("hour")).padStart(2, "0"), mm = String(g("minute")).padStart(2, "0");
    if (lang === "en") return compact ? `${day} ${EN_M[mo - 1]} ${yr} ${hh}:${mm} Bangkok` : `${day} ${EN_M[mo - 1]} ${yr} ${hh}:${mm} Bangkok time`;
    return `${day} ${TH_M[mo - 1]} ${yr} ${hh}:${mm} น. เวลาไทย`;
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
  function pickThai(rows) {
    const list = Array.isArray(rows) ? rows : [];
    const by = (typ) => list.find(x => String(x.GoldType || "").toUpperCase() === typ && String(x.GoldCode || "").startsWith("96"));
    const ref = by("REF"), hsh = by("HSH"), jewel = by("JEWEL");
    const primary = ref || hsh || list.find(x => String(x.GoldCode || "").startsWith("96")) || list[0];
    if (!primary) return null;
    return {
      buy: parseBaht(primary.Buy),
      sell: parseBaht(primary.Sell),
      change: parseBaht(primary.BuyChange != null ? primary.BuyChange : primary.SellChange),
      time: primary.TimeUpdate || primary.StrTimeUpdate || "",
      code: primary.GoldCode || "96.50",
      type: primary.GoldType || "",
      isAssoc: String(primary.GoldType || "").toUpperCase() === "REF",
      source: String(primary.GoldType || "").toUpperCase() === "REF"
        ? "สมาคมค้าทองคำ (อ้างอิงผ่านฮั่วเซ่งเฮง)"
        : "ฮั่วเซ่งเฮง",
      hsh: hsh ? { buy: parseBaht(hsh.Buy), sell: parseBaht(hsh.Sell), change: parseBaht(hsh.BuyChange) } : null
    };
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
    const urls = ["https://apicheckprice.huasengheng.com/api/values/getprice/"];
    for (const u of urls) {
      try {
        const r = await fetch(u, { cache: "no-store" });
        if (!r.ok) continue;
        const a = await r.json();
        const thai = pickThai(a);
        if (thai && (thai.buy != null || thai.sell != null)) {
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
    if (!out.mtf || !out.mtf.length) {
      const D = global.D;
      if (D && D.mtf) out.mtf = (out.lang === "en" ? (D.mtf_en || D.mtf) : D.mtf);
      if (D && !out.align) out.align = D.mtf_align;
      if (D && !out.alignEn) out.alignEn = D.mtf_align_en;
    }
    return out;
  }


  const brand = { lockup: null, bgLand: null, bgPort: null };

  function loadImg(url) {
    return new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
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
        loadFirst(["assets/logo-lockup.svg", "logo-lockup.svg", "/assets/logo-lockup.svg"]).then(im => { brand.lockup = im; }),
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

  function drawFooter(ctx, W, H, lang) {
    const y = H - 32;
    const rule = H - 54;
    ctx.strokeStyle = "rgba(245,197,66,0.20)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(44, rule); ctx.lineTo(W - 44, rule); ctx.stroke();
    const size = H > 1000 ? 16 : 14;
    ctx.font = `500 ${size}px ${FONT}`;
    ctx.textBaseline = "middle";
    ctx.fillStyle = MUTED;
    ctx.textAlign = "left";
    ctx.fillText(fmtBkk(new Date(), lang, true), 48, y);
    ctx.textAlign = "center";
    ctx.fillStyle = GOLD;
    ctx.fillText(SITE, W / 2, y);
    ctx.textAlign = "right";
    ctx.fillStyle = MUTED;
    ctx.fillText(lang === "en" ? "Education only — not investment advice" : "เพื่อการศึกษา ไม่ใช่คำแนะนำการลงทุน", W - 48, y);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    return rule - 18;
  }

  function headerBox(ctx, W, H, lang, bars, scale) {
    drawBackdrop(ctx, W, H, bars);
    const mark = drawLockup(ctx, 44, 28, scale || (H > 1000 ? 1.15 : 1));
    const bottom = drawFooter(ctx, W, H, lang);
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
    const padL = 12, padR = o.labels === false ? 12 : 78, padT = 14, padB = 22;
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

    ctx.font = `600 12px ${FONT}`;
    ctx.textBaseline = "middle";
    const tag = (lv, color) => {
      if (!lv || !Number.isFinite(lv.price)) return;
      const yy = Math.min(cy + ch - 6, Math.max(cy + 6, sc.y(lv.price, cy, ch)));
      ctx.fillStyle = color;
      ctx.textAlign = "left";
      const lab = (lv.label ? lv.label + " " : "") + fmt(lv.price, 1);
      ctx.fillText(lab, cx + cw + 6, yy);
    };
    if (o.labels !== false) {
      (o.resistance || []).slice(0, 3).forEach(lv => tag(lv, DN));
      (o.support || []).slice(0, 3).forEach(lv => tag(lv, UP));
      if (o.last != null) {
        const yy = Math.min(cy + ch - 6, Math.max(cy + 6, sc.y(o.last, cy, ch)));
        ctx.fillStyle = GOLD;
        ctx.textAlign = "left";
        ctx.fillText(fmt(o.last, 2), cx + cw + 6, yy);
      }
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    if (o.caption) {
      ctx.fillStyle = MUTED;
      ctx.font = `500 12px ${FONT}`;
      ctx.fillText(o.caption, x + 14, y + h - 8);
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
    if (!pivots) return;
    glassPanel(ctx, x, y, w, h, 18);
    const th = lang !== "en";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = MUTED;
    ctx.font = `700 13px ${FONT}`;
    ctx.fillText(th ? "แนวต้าน / แนวรับ  (S1–S3, R1–R3)" : "Resistance / Support  (S1–S3, R1–R3)", x + 16, y + 24);
    const rows = [
      [th ? "แนวต้าน" : "Resist", DN, [["R1", pivots.r1], ["R2", pivots.r2], ["R3", pivots.r3]]],
      [th ? "แนวรับ" : "Support", UP, [["S1", pivots.s1], ["S2", pivots.s2], ["S3", pivots.s3]]]
    ];
    const colW = (w - 120) / 3;
    rows.forEach((row, ri) => {
      const yy = y + 48 + ri * ((h - 60) / 2);
      ctx.fillStyle = row[1];
      ctx.font = `800 16px ${FONT}`;
      ctx.fillText(row[0], x + 16, yy + 8);
      row[2].forEach((cell, ci) => {
        const xx = x + 110 + ci * colW;
        ctx.fillStyle = MUTED;
        ctx.font = `700 12px ${FONT}`;
        ctx.fillText(cell[0], xx, yy - 10);
        ctx.fillStyle = row[1];
        ctx.font = `800 22px ${MONO}`;
        ctx.fillText(cell[1] != null ? fmt(cell[1], 1) : "—", xx, yy + 16);
      });
    });
    if (pivots.pp != null) {
      ctx.fillStyle = GOLD2;
      ctx.font = `600 13px ${FONT}`;
      ctx.fillText((th ? "พิวอต " : "Pivot ") + fmt(pivots.pp, 1), x + 16, y + h - 12);
    }
  }

  function drawThaiPanel(ctx, x, y, w, h, thai, lang) {
    if (!thai || (thai.buy == null && thai.sell == null)) return false;
    glassPanel(ctx, x, y, w, h, 18);
    const th = lang !== "en";
    const src = thai.isAssoc
      ? (th ? "แท่งอ้างอิงสมาคมค้าทองคำ" : "Gold Traders Association bar (ref.)")
      : (th ? "ทองคำแท่ง ฮั่วเซ่งเฮง" : "Hua Seng Heng bar");
    const sourceRight = th ? "ที่มา: " + (thai.source || "ฮั่วเซ่งเฮง") : "Source: " + (thai.source || "Hua Seng Heng");
    const chgT = (thai.change != null && Number.isFinite(thai.change))
      ? ((thai.change > 0 ? "▲ +" : thai.change < 0 ? "▼ " : "• ") + fmt(Math.abs(thai.change), 0) + (th ? " บาท" : " THB"))
      : "";
    const chgCol = (thai.change > 0) ? UP : (thai.change < 0) ? DN : GOLD;
    const compact = h < 150;
    if (compact) {
      ctx.fillStyle = GOLD;
      ctx.font = `800 14px ${FONT}`;
      ctx.fillText(th ? "ทองไทย 96.5%  บาทละ" : "Thai gold 96.5%  per baht-weight", x + 16, y + 20);
      ctx.fillStyle = MUTED;
      ctx.font = `500 11px ${FONT}`;
      ctx.textAlign = "right";
      ctx.fillText(th ? "ที่มา: สมาคมค้าทองคำ" : "Source: Gold Traders Assoc.", x + w - 16, y + 20);
      ctx.textAlign = "left";
      const left = x + 16, col = 200;
      const numY = y + h - 18;
      ctx.fillStyle = MUTED;
      ctx.font = `600 11px ${FONT}`;
      ctx.fillText(th ? "รับซื้อ" : "Bid", left, numY - 28);
      ctx.fillText(th ? "ขายออก" : "Ask", left + col, numY - 28);
      ctx.fillStyle = TX;
      ctx.font = `800 28px ${MONO}`;
      ctx.fillText(thai.buy != null ? fmt(thai.buy, 0) : "—", left, numY);
      ctx.fillText(thai.sell != null ? fmt(thai.sell, 0) : "—", left + col, numY);
      if (chgT) {
        ctx.fillStyle = chgCol;
        ctx.font = `800 15px ${FONT}`;
        ctx.textAlign = "right";
        ctx.fillText(chgT, x + w - 16, numY);
        ctx.textAlign = "left";
      }
      return true;
    }
    ctx.fillStyle = GOLD;
    ctx.font = `800 16px ${FONT}`;
    ctx.fillText(th ? "ทองไทย 96.5%  บาทละ" : "Thai gold 96.5%  per baht-weight", x + 16, y + 26);
    ctx.fillStyle = MUTED;
    ctx.font = `500 12px ${FONT}`;
    ctx.fillText(src, x + 16, y + 46);
    const mid = y + (h > 160 ? 100 : 92);
    const left = x + 16, col = (w - 40) / 2;
    ctx.fillStyle = MUTED;
    ctx.font = `600 13px ${FONT}`;
    ctx.fillText(th ? "รับซื้อ" : "Bid", left, mid - 36);
    ctx.fillText(th ? "ขายออก" : "Ask", left + col, mid - 36);
    ctx.fillStyle = TX;
    ctx.font = `800 34px ${MONO}`;
    ctx.fillText(thai.buy != null ? fmt(thai.buy, 0) : "—", left, mid);
    ctx.fillText(thai.sell != null ? fmt(thai.sell, 0) : "—", left + col, mid);
    ctx.fillStyle = GOLD2;
    ctx.font = `600 14px ${FONT}`;
    ctx.fillText(th ? "บาท" : "THB", left, mid + 22);
    if (chgT) {
      ctx.fillStyle = chgCol;
      ctx.font = `800 18px ${FONT}`;
      ctx.fillText(chgT, left, y + h - 16);
    }
    ctx.fillStyle = MUTED;
    ctx.font = `500 11px ${FONT}`;
    ctx.textAlign = "right";
    ctx.fillText(sourceRight, x + w - 16, y + h - 16);
    ctx.textAlign = "left";
    return true;
  }

  function drawPrice(ctx, W, H, p, lang) {
    const portrait = H > 900;
    const box = headerBox(ctx, W, H, lang, p.bars || p.barsH1, portrait ? 1.2 : 1.05);
    const info = trendInfo(p, lang);
    const headline = lang === "en" ? "XAUUSD spot — latest" : "ทองคำ XAUUSD ล่าสุด";
    ctx.fillStyle = TX;
    ctx.font = `800 ${portrait ? 44 : 34}px ${FONT}`;
    ctx.fillText(headline, box.left, box.top + (portrait ? 40 : 30));
    const badge = drawTrendBadge(ctx, box.left, box.top + (portrait ? 56 : 44), info, lang, portrait ? 1.05 : 0.92);
    ctx.fillStyle = MUTED;
    ctx.font = `600 13px ${FONT}`;
    ctx.fillText(info.strength, box.left + badge.w + 14, box.top + (portrait ? 56 : 44) + badge.h * 0.68);

    const px = fmt(p.price, 2);
    const chgInfo = resolveChange(p);
    const numY = box.top + (portrait ? 170 : 148);
    heroNumber(ctx, px, box.left, numY, portrait ? 108 : 86);
    const badgeY = numY + 16;
    changeBadge(ctx, box.left, badgeY, chgInfo.change, chgInfo.changePct, chgInfo.known);
    ctx.fillStyle = MUTED;
    ctx.font = `500 ${portrait ? 16 : 14}px ${FONT}`;
    let capY = badgeY + (chgInfo.known ? 72 : 24);
    if (chgInfo.known && chgInfo.prevClose != null) {
      ctx.fillText(lang === "en"
        ? "vs previous close  " + fmt(chgInfo.prevClose, 2)
        : "เทียบราคาปิดวันก่อน  " + fmt(chgInfo.prevClose, 2), box.left, capY);
      capY += 22;
    }

    const caption = lang === "en" ? "XAUUSD intraday" : "XAUUSD ระหว่างวัน";
    if (portrait) {
      const srH = 168;
      drawSRTable(ctx, box.left, capY + 8, box.right - box.left, srH, p.pivots, lang);
      let cy = capY + 8 + srH + 12;
      const thaiH = p.thai ? 170 : 0;
      const chartH = box.bottom - cy - (thaiH ? thaiH + 12 : 0);
      drawCandleChart(ctx, p.bars || p.barsH1, box.left, cy, box.right - box.left, Math.max(240, chartH), {
        support: p.support, resistance: p.resistance, last: num(p.price), caption
      });
      if (thaiH) drawThaiPanel(ctx, box.left, box.bottom - thaiH, box.right - box.left, thaiH, p.thai, lang);
    } else {
      const leftW = 560;
      let srH = 150;
      const thaiMin = p.thai ? 122 : 0;
      const ty0 = capY + 6 + srH + 10;
      if (thaiMin && (box.bottom - ty0) < thaiMin) {
        srH = Math.max(120, srH - (thaiMin - (box.bottom - ty0)));
      }
      drawSRTable(ctx, box.left, capY + 6, leftW, srH, p.pivots, lang);
      const ty = capY + 6 + srH + 10;
      drawThaiPanel(ctx, box.left, ty, leftW, box.bottom - ty, p.thai, lang);
      const cx = 628, cy = box.top - 6;
      drawCandleChart(ctx, p.bars || p.barsH1, cx, cy, box.right - cx, box.bottom - cy, {
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
    const box = headerBox(ctx, W, H, lang, p.barsH1 || p.bars, portrait ? 1.15 : 1.0);
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
    ctx.font = `800 ${portrait ? 100 : 78}px ${MONO}`;
    ctx.fillStyle = UP;
    ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 16;
    ctx.fillText(up + "%", box.left, numY);
    ctx.shadowBlur = 0;
    ctx.fillStyle = MUTED;
    ctx.font = `600 18px ${FONT}`;
    ctx.fillText(lang === "en" ? "Chance up" : "โอกาสขึ้น", box.left, numY + 32);
    ctx.textAlign = "right";
    ctx.font = `800 ${portrait ? 100 : 78}px ${MONO}`;
    ctx.fillStyle = DN;
    const right = portrait ? box.right : 580;
    ctx.fillText(dn + "%", right, numY);
    ctx.fillStyle = MUTED;
    ctx.font = `600 18px ${FONT}`;
    ctx.fillText(lang === "en" ? "Chance down" : "โอกาสลง", right, numY + 32);
    ctx.textAlign = "left";

    const a7 = p.acc7 == null ? "—" : Math.round(Number(p.acc7)) + "%";
    const a30 = p.acc30 == null ? "—" : Math.round(Number(p.acc30)) + "%";
    ctx.fillStyle = GOLD2;
    ctx.font = `600 16px ${FONT}`;
    const acc = lang === "en" ? `7-day accuracy ${a7}  ·  30-day ${a30}` : `ความแม่นยำ 7 วัน ${a7}  ·  30 วัน ${a30}`;
    ctx.fillText(acc, box.left, numY + 66);

    const cy = numY + 86;
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
    const box = headerBox(ctx, W, H, lang, p.barsH1 || p.bars, portrait ? 1.15 : 1.0);
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
      drawBiasMeter(ctx, box.left, after + 10, 520, 108, mtf, lang);
      const ly = after + 136;
      drawSRTable(ctx, box.left, ly, 520, Math.min(180, box.bottom - ly), p.pivots, lang);
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
    const box = headerBox(ctx, W, H, lang, null, portrait ? 1.15 : 1.0);
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
    heroNumber(ctx, fmt(p.tonnes, 2), box.left, after + (portrait ? 130 : 108), portrait ? 110 : 90);
    ctx.fillStyle = GOLD2;
    ctx.font = `700 ${portrait ? 36 : 30}px ${FONT}`;
    const nw = (ctx.measureText(fmt(p.tonnes, 2)).width) || 360;
    // unit next to number — measure with mono then place
    ctx.font = `800 ${portrait ? 110 : 90}px ${MONO}`;
    const numW = ctx.measureText(fmt(p.tonnes, 2)).width;
    ctx.font = `700 ${portrait ? 36 : 28}px ${FONT}`;
    ctx.fillStyle = GOLD2;
    ctx.fillText(unitTon(lang), box.left + numW + 14, after + (portrait ? 130 : 108) - 8);

    const asof = lang === "en"
      ? "Trade date  " + (p.asOfEn || p.asOf || "—")
      : "วันที่ซื้อขาย  " + (p.asOfTh || p.asOf || "—");
    ctx.fillStyle = TX;
    ctx.font = `600 16px ${FONT}`;
    const infoY = after + (portrait ? 164 : 140);
    ctx.fillText(asof + (lang === "en" ? "  ·  trade-date basis, not live today" : "  ·  ฐานวันซื้อขาย ไม่ใช่ตัวเลขสดวันนี้"), box.left, infoY);

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

  const DRAW = { price: drawPrice, forecast: drawForecast, trend: drawTrend, spdr: drawSpdr };

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
      <div class="share-brand"><img alt="PureGold by PureFxAi" src="assets/logo-lockup.svg" onerror="this.src='logo-lockup.svg'"></div>
      <p id="shareSaveHint"></p>
      <div id="shareSaveImgs" class="imgs"></div>
      <div class="row share-nav">
        <button type="button" class="btn pri" id="shareGoChart">ดูกราฟ</button>
        <a class="btn share-site" id="shareGoSite" href="https://gold.purefxai.store/" target="_blank" rel="noopener">เข้าสู่หน้าเว็บ</a>
        <button type="button" class="btn" id="shareSaveX">ปิด</button>
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
    const goChart = document.getElementById("shareGoChart");
    const goSite = document.getElementById("shareGoSite");
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
    const lang = (payload && payload.lang) || (enLang() ? "en" : "th");
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
    const lang = (payload && payload.lang) || (enLang() ? "en" : "th");
    const files = await blobsFor(kind, payload);
    const fileObjs = files.map(f => new File([f.blob], f.name, { type: "image/png" }));
    const title = "PureGold · " + (kind === "price" ? "XAUUSD" : kind === "forecast" ? "AI forecast" : kind === "trend" ? "Trend" : "SPDR GLD");
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
    const lang = enLang() ? "en" : "th";
    if (!el.querySelector(".share-dl")) el.insertAdjacentHTML("beforeend", buttonsHtml(lang));
    const sync = () => {
      const L = ((getPayload && getPayload()) || {}).lang || (enLang() ? "en" : "th");
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
.share-save{display:none;position:fixed;inset:0;z-index:80;padding:16px;align-items:center;justify-content:center;background:rgba(6,5,4,.48);backdrop-filter:blur(22px) saturate(1.4);-webkit-backdrop-filter:blur(22px) saturate(1.4)}
.share-save.on{display:flex}
.share-save .box{width:min(640px,100%);background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.05));backdrop-filter:blur(28px) saturate(1.5);-webkit-backdrop-filter:blur(28px) saturate(1.5);border:1px solid rgba(255,255,255,.28);border-radius:22px;padding:16px;max-height:min(92vh,900px);overflow:auto;box-shadow:0 24px 64px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.28)}
.share-save .share-brand{display:flex;align-items:center;margin:0 0 10px}
.share-save .share-brand img{height:36px;width:auto;background:transparent;border-radius:0}
.share-save .imgs{display:grid;gap:12px}
.share-save .imgs img{display:block;width:100%;border-radius:14px;background:#07080d;border:1px solid rgba(255,255,255,.16)}
.share-save p{margin:0 0 10px;font-size:13px;color:#d7cdb8;line-height:1.55}
.share-save .row{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.share-save .share-nav .btn,.share-save a.btn{display:inline-flex;align-items:center;justify-content:center;margin-top:0;text-decoration:none;flex:1 1 120px;min-height:44px;border-radius:12px}
.share-save a.share-site{border:1px solid rgba(245,197,66,.45);color:#f5c542;background:transparent}`;

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
    SIZES, SITE, SITE_URL, VERSION, render, blobsFor, download, share, mount, buttonsHtml,
    forecastTarget, fmtBkk, fmt, chg, closeSheet, loadMarket, attachMarket, enrich,
    loadThaiGold, loadPivots,
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
      try { await Promise.all([loadThaiGold(), loadPivots()]); } catch (_) {}
      try { await preloadBrand(); } catch (_) {}
    }
  };
})(window);
