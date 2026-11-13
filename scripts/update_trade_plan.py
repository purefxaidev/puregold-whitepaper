#!/usr/bin/env python3
"""Build one educational XAUUSD trade plan from live spot, daily/H4 pivots, swings, ATR and optional SMC/AI bias."""
from __future__ import annotations

import argparse
import json
import math
from datetime import datetime, timedelta, timezone
from pathlib import Path

BKK = timezone(timedelta(hours=7))
TH_M = "ม.ค. ก.พ. มี.ค. เม.ย. พ.ค. มิ.ย. ก.ค. ส.ค. ก.ย. ต.ค. พ.ย. ธ.ค.".split()
EN_M = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()


def r1(n, d=1):
    if n is None:
        return None
    try:
        v = float(n)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(v):
        return None
    return round(v, d)


def load_json(path):
    p = Path(path)
    if not p.exists():
        return None
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return None


def fmt_bkk(dt=None):
    dt = dt or datetime.now(BKK)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=BKK)
    dt = dt.astimezone(BKK)
    th = f"{dt.day} {TH_M[dt.month - 1]} {dt.year} {dt:%H:%M:%S} น. เวลาไทย"
    en = f"{dt.day} {EN_M[dt.month - 1]} {dt.year} {dt:%H:%M:%S} Bangkok"
    return th, en, dt


def atr_from_candles(candles, tf="H1", n=14):
    rows = (candles or {}).get(tf) or []
    if len(rows) < 5:
        return None
    trs = []
    start = max(1, len(rows) - n)
    for i in range(start, len(rows)):
        h, l, prev_c = float(rows[i][2]), float(rows[i][3]), float(rows[i - 1][4])
        trs.append(max(h - l, abs(h - prev_c), abs(l - prev_c)))
    return sum(trs) / len(trs) if trs else None


def pivot_bias(spot, daily):
    if not daily or not math.isfinite(spot):
        return None
    s1, r1v, pp = daily.get("s1"), daily.get("r1"), daily.get("pp")
    if r1v is not None and spot > float(r1v):
        return {"bias": "up", "th": "เอียงขึ้นเหนือ R1", "en": "Tilt up, above R1"}
    if pp is not None and spot > float(pp) + 1:
        return {"bias": "up", "th": "เอียงขึ้นเหนือจุดพิวอต", "en": "Tilt up, above the pivot"}
    if s1 is not None and spot < float(s1):
        return {"bias": "down", "th": "เอียงลงต่ำกว่า S1", "en": "Tilt down, below S1"}
    if pp is not None and spot < float(pp) - 1:
        return {"bias": "down", "th": "เอียงลงต่ำกว่าจุดพิวอต", "en": "Tilt down, below the pivot"}
    return {"bias": "neutral", "th": "ทรงตัวใกล้จุดพิวอต", "en": "Neutral, near the pivot"}


def smc_bias(data):
    smc = ((data or {}).get("smc") or {}).get("XAUUSD") or {}
    h1 = smc.get("H1") or {}
    ev = str(h1.get("last_event") or "")
    if ev.endswith("_bear") or ev.endswith("bear"):
        return "down", ev, h1
    if ev.endswith("_bull") or ev.endswith("bull"):
        return "up", ev, h1
    return None, ev, h1


def ai_bias(data):
    if not data:
        return None, None, None
    up = data.get("ai_up_pct")
    dn = data.get("ai_down_pct")
    try:
        up = float(up) if up is not None else None
        dn = float(dn) if dn is not None else None
    except (TypeError, ValueError):
        return None, None, None
    if up is None or dn is None:
        return None, up, dn
    if abs(up - dn) < 8:
        return "neutral", up, dn
    return ("up" if up > dn else "down"), up, dn


def collect_levels(levels):
    daily = (levels or {}).get("daily") or {}
    h4 = (levels or {}).get("h4") or {}
    swings = (levels or {}).get("swings") or {}
    out = []
    for src, pack in (("D", daily), ("H4", h4)):
        for key, lab in (("r3", "R3"), ("r2", "R2"), ("r1", "R1"), ("pp", "Pivot"),
                         ("s1", "S1"), ("s2", "S2"), ("s3", "S3")):
            v = r1(pack.get(key), 1)
            if v is not None:
                out.append({"price": v, "label": f"{src} {lab}" if src == "H4" else lab, "key": key, "tf": src})
    for sw in (swings.get("highs") or [])[-3:]:
        v = r1(sw.get("price"), 1)
        if v is not None:
            out.append({"price": v, "label": "สวิงไฮ", "label_en": "Swing high", "key": "swing_high", "tf": "SW"})
    for sw in (swings.get("lows") or [])[-3:]:
        v = r1(sw.get("price"), 1)
        if v is not None:
            out.append({"price": v, "label": "สวิงโลว์", "label_en": "Swing low", "key": "swing_low", "tf": "SW"})
    # unique by price (~0.4)
    uniq, seen = [], []
    for lv in sorted(out, key=lambda x: x["price"]):
        if any(abs(lv["price"] - s) < 0.4 for s in seen):
            continue
        seen.append(lv["price"])
        uniq.append(lv)
    return uniq, daily, h4, swings


def nearest(levels, pred):
    cand = [lv for lv in levels if pred(lv["price"])]
    return cand


def rr(entry, sl, tp, side):
    risk = (sl - entry) if side == "sell" else (entry - sl)
    reward = (entry - tp) if side == "sell" else (tp - entry)
    if risk is None or risk <= 0 or reward is None:
        return None
    return round(reward / risk, 2)


def wait_plan(spot, trigger, side, bias, atr, inv, reason_th, reason_en, tf="H1–D1"):
    th, en, dt = fmt_bkk()
    trig = r1(trigger, 1) if trigger is not None else None
    return {
        "symbol": "XAUUSD",
        "side": "wait",
        "side_th": "รอ",
        "side_en": "WAIT",
        "setup": "wait",
        "title_th": "ยังไม่มีจุดเข้าที่ชัด",
        "title_en": "No clear entry yet",
        "thesis_th": reason_th,
        "thesis_en": reason_en,
        "spot": r1(spot, 2),
        "entry": trig,
        "entry_low": r1(trig - max(2, 0.25 * atr), 1) if trig else None,
        "entry_high": r1(trig + max(2, 0.25 * atr), 1) if trig else None,
        "sl": None,
        "tps": [],
        "invalidation": r1(inv, 1) if inv is not None else None,
        "invalidation_th": f"ยกเลิกแผนถ้าราคาผ่าน {r1(inv, 1):,.1f}".replace(",", ",") if inv else "ยกเลิกแผนถ้ามุมมองกลับทิศ",
        "invalidation_en": f"Cancel if price trades through {r1(inv, 1):,.1f}" if inv else "Cancel if the bias flips",
        "trigger_th": f"รอราคาแตะ {r1(trig, 1):,.1f} จึงพิจารณา{'ขาย' if side=='sell' else 'ซื้อ' if side=='buy' else 'เข้า'}" if trig else reason_th,
        "trigger_en": f"Wait for {r1(trig, 1):,.1f} before considering a {side.upper() if side in ('buy','sell') else 'setup'}" if trig else reason_en,
        "timeframe": tf,
        "timeframe_th": "รายชั่วโมงถึงรายวัน",
        "timeframe_en": "H1 to daily",
        "bias": bias.get("bias") if isinstance(bias, dict) else bias,
        "bias_th": (bias or {}).get("th") if isinstance(bias, dict) else "",
        "bias_en": (bias or {}).get("en") if isinstance(bias, dict) else "",
        "atr": r1(atr, 1),
        "approach": None,
        "updated": dt.isoformat(),
        "updated_th": th,
        "updated_en": en,
        "disclaimer_th": "เพื่อการศึกษา ไม่ใช่คำแนะนำการลงทุน ใช้ SL เสมอ",
        "disclaimer_en": "Education only — not investment advice. Always use a stop loss.",
    }


def build_active(side, spot, entry, sl, tps, bias, atr, inv, thesis_th, thesis_en, labels):
    th, en, dt = fmt_bkk()
    half = max(2.0, min(8.0, 0.35 * atr))
    lo, hi = r1(entry - half, 1), r1(entry + half, 1)
    if side == "sell":
        approach = "from_below" if spot < lo else "from_above" if spot > hi else "in_zone"
        title_th, title_en = f"ขายโซน {lo:,.1f}–{hi:,.1f}", f"SELL zone {lo:,.1f}–{hi:,.1f}"
        side_th, side_en = "ขาย", "SELL"
    else:
        approach = "from_above" if spot > hi else "from_below" if spot < lo else "in_zone"
        title_th, title_en = f"ซื้อโซน {lo:,.1f}–{hi:,.1f}", f"BUY zone {lo:,.1f}–{hi:,.1f}"
        side_th, side_en = "ซื้อ", "BUY"
    tp_rows = []
    for i, (px, lab, lab_en) in enumerate(tps, 1):
        ratio = rr(entry, sl, px, side)
        if ratio is None or ratio < 0.6:
            continue
        tp_rows.append({
            "n": len(tp_rows) + 1,
            "price": r1(px, 1),
            "label": lab,
            "label_en": lab_en or lab,
            "rr": ratio,
        })
        if len(tp_rows) == 3:
            break
    if not tp_rows:
        return None
    if tp_rows[0]["rr"] < 1.0:
        return None
    inv_px = r1(inv if inv is not None else sl, 1)
    if side == "sell":
        inv_th = f"ยกเลิกแผนถ้าราคาขึ้นผ่าน {inv_px:,.1f}"
        inv_en = f"Cancel if price trades above {inv_px:,.1f}"
    else:
        inv_th = f"ยกเลิกแผนถ้าราคาลงผ่าน {inv_px:,.1f}"
        inv_en = f"Cancel if price trades below {inv_px:,.1f}"
    return {
        "symbol": "XAUUSD",
        "side": side,
        "side_th": side_th,
        "side_en": side_en,
        "setup": "pullback",
        "title_th": title_th,
        "title_en": title_en,
        "thesis_th": thesis_th,
        "thesis_en": thesis_en,
        "spot": r1(spot, 2),
        "entry": r1(entry, 1),
        "entry_low": lo,
        "entry_high": hi,
        "entry_label_th": f"โซน {lo:,.1f}–{hi:,.1f} ({labels.get('entry_th') or 'ระดับสำคัญ'})",
        "entry_label_en": f"Zone {lo:,.1f}–{hi:,.1f} ({labels.get('entry_en') or 'key level'})",
        "sl": r1(sl, 1),
        "sl_label_th": labels.get("sl_th") or "จุดตัดขาดทุน",
        "sl_label_en": labels.get("sl_en") or "Stop loss",
        "tps": tp_rows,
        "invalidation": inv_px,
        "invalidation_th": inv_th,
        "invalidation_en": inv_en,
        "rr_tp1": tp_rows[0]["rr"],
        "timeframe": "H1–D1",
        "timeframe_th": "รายชั่วโมงถึงรายวัน",
        "timeframe_en": "H1 to daily",
        "bias": bias.get("bias"),
        "bias_th": bias.get("th") or "",
        "bias_en": bias.get("en") or "",
        "atr": r1(atr, 1),
        "approach": approach,
        "updated": dt.isoformat(),
        "updated_th": th,
        "updated_en": en,
        "disclaimer_th": "เพื่อการศึกษา ไม่ใช่คำแนะนำการลงทุน ใช้ SL เสมอ",
        "disclaimer_en": "Education only — not investment advice. Always use a stop loss.",
    }


def make_plan(levels, spot, atr, data=None):
    lvls, daily, h4, swings = collect_levels(levels)
    bias = pivot_bias(spot, daily) or {"bias": "neutral", "th": "ยังไม่ชัด", "en": "Unclear"}
    smc_dir, smc_ev, _h1 = smc_bias(data)
    ai_dir, ai_up, ai_dn = ai_bias(data)

    # Consensus: never fight a clear pivot bias. If SMC/AI strongly oppose, WAIT.
    direction = bias["bias"]
    conflict = smc_dir and smc_dir != direction and direction in ("up", "down") and smc_dir in ("up", "down")
    if direction == "neutral":
        if smc_dir in ("up", "down") and (ai_dir in (None, "neutral") or ai_dir == smc_dir):
            direction = smc_dir
        else:
            trig = daily.get("s1") if spot and daily.get("s1") and spot >= float(daily["s1"]) else daily.get("r1")
            # nearer of S1 / R1
            cands = [v for v in (daily.get("s1"), daily.get("r1"), daily.get("pp")) if v is not None]
            trig = min(cands, key=lambda v: abs(float(v) - spot)) if cands else None
            return wait_plan(spot, trig, None, bias, atr, daily.get("r1") if trig == daily.get("s1") else daily.get("s1"),
                             "ราคายืนกลางกรอบ ยังไม่มีจุดเข้าที่ชัด — รอราคาไปแตะแนวรับหรือแนวต้านใกล้สุด",
                             "Price is mid-range. Wait for the nearest support or resistance before a setup.")

    if conflict and ai_dir and ai_dir != direction:
        trig = daily.get("s1") if direction == "down" else daily.get("r1")
        return wait_plan(spot, trig, "sell" if direction == "down" else "buy", bias, atr,
                         daily.get("r1") if direction == "down" else daily.get("s1"),
                         "มุมมองรายวันกับสัญญาณชั่วโมงยังไม่สอดคล้อง รอราคาไปแตะระดับสำคัญก่อน",
                         "Daily bias and the hourly signal do not agree. Wait for a key level.")

    side = "sell" if direction == "down" else "buy"
    above = nearest(lvls, lambda p: p > spot + 0.4)
    below = nearest(lvls, lambda p: p < spot - 0.4)

    if side == "sell":
        # Pullback entry: nearest resistance above (broken support now resists, or S1/S2/swing)
        if not above:
            broken = below[-1] if below else None
            trig = broken["price"] if broken else daily.get("s2") or daily.get("s1")
            inv = daily.get("s1") or (trig + atr if trig else None)
            return wait_plan(spot, trig, "sell", bias, atr, inv,
                             f"ราคายืนใต้แนวรับแล้ว รอรีเทสต์โซน {r1(trig,1):,.1f} จึงพิจารณาขาย ไม่ไล่ราคา",
                             f"Price is already below support. Wait for a retest of {r1(trig,1):,.1f} before considering a sell — do not chase.")
        entry_lv = above[0]
        majors = [lv for lv in above[:4] if lv.get("tf") == "D" and abs(lv["price"] - entry_lv["price"]) <= max(8.0, 0.6 * atr)]
        if majors:
            entry_lv = majors[0]
        entry = entry_lv["price"]
        nxt_cands = [lv["price"] for lv in above if lv["price"] >= entry + max(6.0, 0.55 * atr)]
        nxt = nxt_cands[0] if nxt_cands else entry + 1.2 * atr
        sl = min(entry + max(0.85 * atr, 7.0), nxt + max(1.5, 0.15 * atr))
        sl = max(sl, entry + max(6.0, 0.7 * atr))
        # Targets below: supports
        tps = []
        for lv in reversed(below):
            lab = lv.get("label") or ""
            lab_en = lv.get("label_en") or lab
            tps.append((lv["price"], lab, lab_en))
        if len(tps) < 3:
            ext = (below[0]["price"] if below else entry) - atr
            tps.append((ext, "เป้าส่วนขยาย", "Extension"))
            tps.append((ext - atr, "เป้าส่วนขยาย 2", "Extension 2"))
        inv = daily.get("s1") if entry <= float(daily.get("s1") or entry) else (daily.get("pp") or sl)
        if inv and inv <= sl:
            inv = sl
        thesis_th = f"{bias['th']} · รอราคาย่อขึ้นโซน {entry:,.1f} ({entry_lv['label']}) จึงพิจารณาขาย"
        thesis_en = f"{bias['en']} · Wait for a pullback into {entry:,.1f} ({entry_lv.get('label_en') or entry_lv['label']}) before considering a sell"
        plan = build_active("sell", spot, entry, sl, tps, bias, atr, inv, thesis_th, thesis_en,
                            {"entry_th": entry_lv["label"], "entry_en": entry_lv.get("label_en") or entry_lv["label"],
                             "sl_th": "เหนือโซนเข้าและบัฟเฟอร์ ATR", "sl_en": "Above the entry zone and an ATR buffer"})
        if plan:
            return plan
        return wait_plan(spot, entry, "sell", bias, atr, inv,
                         "ระยะจุดตัดขาดทุนยังไม่คุ้มกับเป้าใกล้สุด รอจังหวะรีเทสต์ที่ชัดกว่า",
                         "The nearest target does not yet pay for the stop. Wait for a cleaner retest.")

    # BUY
    if not below:
        broken = above[0] if above else None
        trig = broken["price"] if broken else daily.get("r1") or daily.get("pp")
        inv = daily.get("s1") or (trig - atr if trig else None)
        return wait_plan(spot, trig, "buy", bias, atr, inv,
                         f"ราคายืนเหนือแนวต้านแล้ว รอรีเทสต์โซน {r1(trig,1):,.1f} จึงพิจารณาซื้อ ไม่ไล่ราคา",
                         f"Price is already above resistance. Wait for a retest of {r1(trig,1):,.1f} before considering a buy — do not chase.")
    entry_lv = below[-1]  # nearest support below
    majors = [lv for lv in below[-4:] if lv.get("tf") == "D" and abs(lv["price"] - entry_lv["price"]) <= max(8.0, 0.6 * atr)]
    if majors:
        entry_lv = majors[-1]
    entry = entry_lv["price"]
    nxt_cands = [lv["price"] for lv in below if lv["price"] <= entry - max(6.0, 0.55 * atr)]
    nxt = nxt_cands[-1] if nxt_cands else entry - 1.2 * atr
    sl = max(entry - max(0.85 * atr, 7.0), nxt - max(1.5, 0.15 * atr))
    sl = min(sl, entry - max(6.0, 0.7 * atr))
    tps = []
    for lv in above:
        tps.append((lv["price"], lv.get("label") or "", lv.get("label_en") or lv.get("label") or ""))
    if len(tps) < 3:
        ext = (above[-1]["price"] if above else entry) + atr
        tps.append((ext, "เป้าส่วนขยาย", "Extension"))
        tps.append((ext + atr, "เป้าส่วนขยาย 2", "Extension 2"))
    inv = daily.get("s1") if daily.get("s1") and sl <= float(daily["s1"]) else sl
    thesis_th = f"{bias['th']} · รอราคาย่อลงโซน {entry:,.1f} ({entry_lv['label']}) จึงพิจารณาซื้อ"
    thesis_en = f"{bias['en']} · Wait for a pullback into {entry:,.1f} ({entry_lv.get('label_en') or entry_lv['label']}) before considering a buy"
    plan = build_active("buy", spot, entry, sl, tps, bias, atr, inv, thesis_th, thesis_en,
                        {"entry_th": entry_lv["label"], "entry_en": entry_lv.get("label_en") or entry_lv["label"],
                         "sl_th": "ใต้โซนเข้าและบัฟเฟอร์ ATR", "sl_en": "Below the entry zone and an ATR buffer"})
    if plan:
        return plan
    return wait_plan(spot, entry, "buy", bias, atr, inv,
                     "ระยะจุดตัดขาดทุนยังไม่คุ้มกับเป้าใกล้สุด รอจังหวะรีเทสต์ที่ชัดกว่า",
                     "The nearest target does not yet pay for the stop. Wait for a cleaner retest.")



def _rng(lo, hi, d=1):
    lo, hi = r1(lo, d), r1(hi, d)
    if lo is None or hi is None:
        return None
    if lo > hi:
        lo, hi = hi, lo
    return {"low": lo, "high": hi}


def _fmt_rng(z):
    if not z or z.get("low") is None or z.get("high") is None:
        return "—"
    return f"{z['low']:,.1f}–{z['high']:,.1f}"


def _mid(z):
    if not z:
        return None
    return (float(z["low"]) + float(z["high"])) / 2.0


def _from_ob(obs, typ, spot):
    cands = [o for o in (obs or []) if o.get("type") == typ and o.get("top") is not None and o.get("bottom") is not None]
    live = [o for o in cands if not o.get("mitigated")]
    pool = live or cands
    if not pool:
        return None
    def mid(o):
        return (float(o["top"]) + float(o["bottom"])) / 2.0
    if typ == "bullish":
        below = [o for o in pool if mid(o) <= spot + 8]
        o = max(below or pool, key=mid)
        src_th, src_en = "ออเดอร์บล็อกฝั่งซื้อ", "bullish order block"
    else:
        above = [o for o in pool if mid(o) >= spot - 8]
        o = min(above or pool, key=mid)
        src_th, src_en = "ออเดอร์บล็อกฝั่งขาย", "bearish order block"
    z = _rng(o["bottom"], o["top"])
    if not z or z["high"] - z["low"] < 0.5:
        return None
    z["source"] = "order_block"
    z["source_th"], z["source_en"] = src_th, src_en
    z["mitigated"] = bool(o.get("mitigated"))
    return z


def _from_fvg(fvgs, typ, spot):
    cands = [o for o in (fvgs or []) if o.get("type") == typ and not o.get("filled") and o.get("top") is not None]
    if not cands:
        return None
    def mid(o):
        return (float(o["top"]) + float(o["bottom"])) / 2.0
    if typ == "bullish":
        o = max([o for o in cands if mid(o) <= spot + 8] or cands, key=mid)
        src_th, src_en = "ช่องราคาฝั่งซื้อ (FVG)", "bullish fair-value gap"
    else:
        o = min([o for o in cands if mid(o) >= spot - 8] or cands, key=mid)
        src_th, src_en = "ช่องราคาฝั่งขาย (FVG)", "bearish fair-value gap"
    z = _rng(o["bottom"], o["top"])
    if not z:
        return None
    z["source"] = "fvg"
    z["source_th"], z["source_en"] = src_th, src_en
    return z


def _cluster(prices, atr, center=None):
    vals = sorted({r1(p, 1) for p in prices if p is not None and r1(p, 1) is not None})
    if not vals:
        return None
    width = max(6.0, 0.8 * (atr or 12))
    best = [vals[0]]
    groups = []
    cur = [vals[0]]
    for p in vals[1:]:
        if p - cur[0] <= width:
            cur.append(p)
        else:
            groups.append(cur)
            cur = [p]
    groups.append(cur)
    if center is not None:
        groups.sort(key=lambda g: abs(((g[0] + g[-1]) / 2) - center))
    else:
        groups.sort(key=lambda g: -len(g))
    g = groups[0]
    if len(g) >= 2:
        return _rng(g[0], g[-1])
    wing = max(2.0, min(8.0, 0.25 * (atr or 12)))
    return _rng(g[0] - wing, g[0] + wing)


def compute_demand_supply(levels, data, spot, atr):
    """Demand = buy area, Supply = sell area, from real OB / FVG / swings / pivots."""
    smc = ((data or {}).get("smc") or {}).get("XAUUSD") or {}
    h1 = smc.get("H1") or {}
    h4 = smc.get("H4") or {}
    obs = (h1.get("order_blocks") or []) + (h4.get("order_blocks") or [])
    fvgs = (h1.get("fvg") or []) + (h4.get("fvg") or [])
    swings = (levels or {}).get("swings") or {}
    daily = (levels or {}).get("daily") or {}
    h4p = (levels or {}).get("h4") or {}

    demand = _from_ob(obs, "bullish", spot) or _from_fvg(fvgs, "bullish", spot)
    if not demand:
        lows = [s.get("price") for s in (swings.get("lows") or [])[-4:]]
        for k in ("s1", "s2", "s3"):
            if daily.get(k) is not None:
                lows.append(daily[k])
            if h4p.get(k) is not None:
                lows.append(h4p[k])
        z = _cluster(lows, atr, center=spot)
        if z:
            z["source"] = "support_swings"
            z["source_th"] = "กลุ่มแนวรับและสวิงโลว์"
            z["source_en"] = "support and swing-low cluster"
            demand = z

    supply = _from_ob(obs, "bearish", spot) or _from_fvg(fvgs, "bearish", spot)
    if not supply:
        highs = [s.get("price") for s in (swings.get("highs") or [])[-4:]]
        for k in ("r1", "r2", "r3"):
            if daily.get(k) is not None:
                highs.append(daily[k])
            if h4p.get(k) is not None:
                highs.append(h4p[k])
        z = _cluster(highs, atr, center=spot)
        if z:
            z["source"] = "resistance_swings"
            z["source_th"] = "กลุ่มแนวต้านและสวิงไฮ"
            z["source_en"] = "resistance and swing-high cluster"
            supply = z

    # If the active entry sits near a zone, snap the trigger zone to cover the entry band
    return demand, supply


def _confidence(plan, smc_dir, ai_dir):
    side = plan.get("side") or "wait"
    score = 48
    if side == "wait":
        score = 42
    if smc_dir and side == "buy" and smc_dir == "up":
        score += 10
    if smc_dir and side == "sell" and smc_dir == "down":
        score += 10
    if smc_dir and side in ("buy", "sell") and ((side == "buy" and smc_dir == "down") or (side == "sell" and smc_dir == "up")):
        score -= 8
    if ai_dir and side == "buy" and ai_dir == "up":
        score += 8
    if ai_dir and side == "sell" and ai_dir == "down":
        score += 8
    rr1 = plan.get("rr_tp1")
    if isinstance(rr1, (int, float)):
        if rr1 >= 2:
            score += 10
        elif rr1 >= 1.5:
            score += 6
        elif rr1 >= 1:
            score += 3
    if plan.get("approach") == "in_zone":
        score += 4
    score = max(35, min(78, score))
    if score < 50:
        lab_th, lab_en = "ต่ำ", "Low"
    elif score < 65:
        lab_th, lab_en = "ปานกลาง", "Medium"
    else:
        lab_th, lab_en = "ค่อนข้างสูง", "Fairly high"
    return {
        "score": score,
        "label_th": lab_th,
        "label_en": lab_en,
        "text_th": f"{lab_th} {score}%",
        "text_en": f"{lab_en} {score}%",
        "note_th": "ระดับความมั่นใจจากโครงสร้างและระยะเป้า ไม่ใช่โอกาสชนะ และไม่ได้บอกผลลัพธ์ล่วงหน้า",
        "note_en": "Confidence from structure and target distance — not a win-rate, and not a promise of the outcome.",
    }


def _lots(plan, usdthb):
    sl = plan.get("sl")
    entry = plan.get("entry")
    if sl is None or entry is None or usdthb is None or usdthb <= 0:
        return None
    dist = abs(float(entry) - float(sl))
    if dist < 0.5:
        return None
    oz = 100.0  # standard XAUUSD lot
    rows = []
    for cap in (10000, 50000, 100000):
        for pct in (1, 2):
            risk_thb = cap * pct / 100.0
            risk_usd = risk_thb / usdthb
            lots = risk_usd / (dist * oz)
            rows.append({
                "capital_thb": cap,
                "capital_usd": round(cap / usdthb, 0),
                "risk_pct": pct,
                "risk_thb": round(risk_thb, 0),
                "risk_usd": round(risk_usd, 2),
                "sl_distance": r1(dist, 1),
                "lots": float(f"{lots:.4f}"),
            })
    return {
        "usdthb": round(float(usdthb), 4),
        "contract_oz": 100,
        "sl_distance": r1(dist, 1),
        "rows": rows,
        "note_th": "คำนวณจากความเสี่ยง 1–2% ของเงินทุน และระยะ SL · ตัวอย่างใช้มาตรฐาน 1 ล็อต = 100 ออนซ์ ขนาดจริงขึ้นกับโบรกเกอร์ · ไม่ใช่คำแนะนำให้ใช้เงินทุนนี้",
        "note_en": "Sized from 1–2% of capital and the stop distance. Example uses a standard 1 lot = 100 oz contract; your broker may differ. This is not a recommendation to use these amounts.",
    }


def _steps(plan, demand, supply):
    side = plan.get("side") or "wait"
    d, s = _fmt_rng(demand), _fmt_rng(supply)
    sl = f"{plan['sl']:,.1f}" if plan.get("sl") is not None else "—"
    entry = _fmt_rng({"low": plan.get("entry_low"), "high": plan.get("entry_high")}) if plan.get("entry_low") is not None else (f"{plan['entry']:,.1f}" if plan.get("entry") is not None else "—")
    tps = plan.get("tps") or []
    tp1 = f"{tps[0]['price']:,.1f}" if tps else "—"
    tp2 = f"{tps[1]['price']:,.1f}" if len(tps) > 1 else None
    inv = f"{plan['invalidation']:,.1f}" if plan.get("invalidation") is not None else sl
    entry_band = _fmt_rng({"low": plan.get("entry_low"), "high": plan.get("entry_high")}) if plan.get("entry_low") is not None else (f"{plan['entry']:,.1f}" if plan.get("entry") is not None else "—")
    trig = plan.get("trigger_zone")
    if trig == "demand":
        zone, zone_en = f"Demand Zone {d}", f"Demand Zone {d}"
        act, act_en = "BUY", "BUY"
    elif trig == "supply":
        zone, zone_en = f"Supply Zone {s}", f"Supply Zone {s}"
        act, act_en = "SELL", "SELL"
    elif side == "buy":
        zone, zone_en = f"โซน {entry_band}", f"zone {entry_band}"
        act, act_en = "BUY", "BUY"
    elif side == "sell":
        zone, zone_en = f"โซน {entry_band}", f"zone {entry_band}"
        act, act_en = "SELL", "SELL"
    else:
        if plan.get("bias") == "down":
            zone, zone_en = f"Supply Zone {s}", f"Supply Zone {s}"
            act, act_en = "SELL", "SELL"
        elif plan.get("bias") == "up":
            zone, zone_en = f"Demand Zone {d}", f"Demand Zone {d}"
            act, act_en = "BUY", "BUY"
        else:
            zone, zone_en = (f"Demand Zone {d} หรือ Supply Zone {s}"), (f"Demand Zone {d} or Supply Zone {s}")
            act, act_en = "รอสัญญาณ", "wait for a signal"
    th = [
        f"รอราคาเข้า {zone}",
        f"เมื่อราคาอยู่ในโซนแล้ว จึงพิจารณาเข้า {act} — ไม่ไล่ถ้าราคาพุ่งพ้นโซน",
        f"วาง SL ที่ {sl}",
    ]
    en = [
        f"Wait for price to enter {zone_en}",
        f"Only then consider a {act_en} — do not chase if price has already left the zone",
        f"Place the stop loss at {sl}",
    ]
    if tps:
        th.append(f"ปิดบางส่วนที่ TP1 {tp1} แล้วเลื่อน SL มาจุดเข้า {entry}")
        en.append(f"Close a portion at TP1 {tp1}, then move the stop to the entry {entry}")
        if tp2:
            th.append(f"ส่วนที่เหลือดู TP2 {tp2}" + (f" และ TP3 {tps[2]['price']:,.1f}" if len(tps) > 2 else "") + f" — ถ้าหลุดจุดยกเลิก {inv} ให้เลิกแผน")
            en.append(f"Leave the rest for TP2 {tp2}" + (f" and TP3 {tps[2]['price']:,.1f}" if len(tps) > 2 else "") + f" — cancel if price goes through {inv}")
        else:
            th.append(f"ถ้าหลุดจุดยกเลิก {inv} ให้เลิกแผน")
            en.append(f"Cancel if price goes through {inv}")
    else:
        th.append(f"ยังไม่มีเป้าที่คุ้มกับ SL — ถ้าหลุด {inv} ให้เลิกแผน ไม่ต้องเข้า")
        en.append(f"There is no target that yet pays for the stop — cancel if price goes through {inv}, and do not enter")
    return th, en



def _h1_rows(candles_doc, klines_doc=None):
    rows = []
    for r in ((candles_doc or {}).get("candles") or {}).get("H1") or []:
        if r and len(r) >= 5:
            rows.append(r)
    for c in (klines_doc or {}).get("closes") or []:
        try:
            ts = c.get("t")
            if ts is None:
                continue
            ts = int(ts)
            if ts > 1e12:
                ts = int(ts / 1000)
            rows.append([ts, float(c["o"]), float(c["h"]), float(c["l"]), float(c["c"])])
        except (TypeError, ValueError, KeyError):
            continue
    # prefer the latest timestamp when both sources overlap
    best = {}
    for r in rows:
        try:
            ts = int(r[0])
            best[ts] = r
        except (TypeError, ValueError):
            pass
    return [best[k] for k in sorted(best)]


def closed_h1_bars(candles_doc, now=None, klines_doc=None):
    """Fully closed H1 bars as (ts, o, h, l, c), oldest to newest."""
    now = now or datetime.now(timezone.utc)
    now_ts = int(now.timestamp())
    closed = []
    for r in _h1_rows(candles_doc, klines_doc):
        if not r or len(r) < 5:
            continue
        try:
            ts = int(r[0])
            o, h, l, c = float(r[1]), float(r[2]), float(r[3]), float(r[4])
        except (TypeError, ValueError):
            continue
        if ts + 3600 <= now_ts + 1:
            closed.append((ts, o, h, l, c))
    return closed


def last_closed_h1(candles_doc, now=None, klines_doc=None):
    """Return the last fully closed H1 bar (not the in-progress hour)."""
    closed = closed_h1_bars(candles_doc, now=now, klines_doc=klines_doc)
    if not closed:
        return None
    ts, o, h, l, c = closed[-1]
    as_of = datetime.fromtimestamp(ts, timezone.utc).astimezone(BKK)
    return {
        "open_ts": ts,
        "open_iso": as_of.isoformat(),
        "as_of_hm": as_of.strftime("%H:%M"),
        "open": r1(o, 2),
        "high": r1(h, 2),
        "low": r1(l, 2),
        "close": r1(c, 2),
        "bullish": c >= o,
    }


def h1_confirms(plan, bar):
    """True when a closed H1 candle confirms the plan's entry (not a live-tick heuristic)."""
    if not plan or not bar or (plan.get("side") or "wait") not in ("buy", "sell"):
        return False
    close = bar.get("close")
    lo = plan.get("entry_low") if plan.get("entry_low") is not None else plan.get("entry")
    hi = plan.get("entry_high") if plan.get("entry_high") is not None else plan.get("entry")
    if close is None or lo is None or hi is None:
        return False
    lo, hi = (min(float(lo), float(hi)), max(float(lo), float(hi)))
    c = float(close)
    pad = 0.8
    in_zone = (lo - pad) <= c <= (hi + pad)
    if in_zone:
        return True
    # The bar traded the zone and closed through it in the trade direction.
    try:
        high, low = float(bar.get("high")), float(bar.get("low"))
    except (TypeError, ValueError):
        high, low = c, c
    if plan["side"] == "buy":
        return low <= hi + pad and c >= hi and bool(bar.get("bullish"))
    return high >= lo - pad and c <= lo and not bool(bar.get("bullish"))


def parse_event_ts(ev):
    raw = ev.get("date_utc") or ev.get("date") or ev.get("date_bkk")
    if not raw:
        return None
    try:
        dt = datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError:
        return None


def news_blackout(events_doc, now=None, window_min=30):
    """High-impact USD releases within ±window_min minutes."""
    now = now or datetime.now(timezone.utc)
    events = (events_doc or {}).get("events") if isinstance(events_doc, dict) else (events_doc or [])
    hits = []
    for ev in events or []:
        if str(ev.get("impact") or "").lower() != "high":
            continue
        country = str(ev.get("country") or ev.get("currency") or "").upper()
        if country not in ("USD", "US", "USA", "UNITED STATES"):
            continue
        ts = parse_event_ts(ev)
        if ts is None:
            continue
        delta = abs((ts - now).total_seconds())
        if delta <= window_min * 60:
            until = max(ts, now) if ts >= now else ts + timedelta(minutes=window_min)
            # window ends at event+30m
            end = ts + timedelta(minutes=window_min)
            hits.append({
                "id": ev.get("id"),
                "title_th": ev.get("title_th") or ev.get("title"),
                "title_en": ev.get("title_en") or ev.get("title"),
                "date_utc": ev.get("date_utc"),
                "date_th": ev.get("date_th"),
                "date_en": ev.get("date_en"),
                "until_iso": end.astimezone(BKK).isoformat(),
                "until_hm": end.astimezone(BKK).strftime("%H:%M"),
                "minutes": int(delta / 60),
            })
    hits.sort(key=lambda e: e.get("date_utc") or "")
    if not hits:
        return {
            "blackout": False,
            "window_min": window_min,
            "label_th": "",
            "label_en": "",
            "events": [],
        }
    last = max(hits, key=lambda e: e.get("until_iso") or "")
    return {
        "blackout": True,
        "window_min": window_min,
        "label_th": "ช่วงข่าวแรง งดเข้า",
        "label_en": "High-impact news — no new entries",
        "detail_th": "รอให้พ้นข่าว " + " / ".join(e["title_th"] for e in hits if e.get("title_th")) + f" แล้วค่อยดูจุดเข้า (ถึง {last['until_hm']})",
        "detail_en": "Wait until after " + " / ".join(e["title_en"] for e in hits if e.get("title_en")) + f" before considering an entry (until {last['until_hm']})",
        "until_hm": last["until_hm"],
        "events": hits,
    }



SIDEWAYS_BARS = 8
SIDEWAYS_DISPLACEMENT = 0.5
SIDEWAYS_ATR_MAX = 2.5
ZONE_PAD = 0.8

# Sideways rule (H1, closed bars only):
# Take the last 8 fully closed H1 candles. A = lowest low, B = highest high.
# The graph is sideways when |last close − first close of the window| is at most
# 50% of (B−A) and (B−A) is at most 2.5 × ATR(H1 of the last 14 closed bars).
# While sideways, wait for a closed H1 to leave A–B before entering.
# A confirmed breakout is a later fully closed H1 that closes above B (up) or
# below A (down). Alert again on that confirmed breakout. The A–B range stays
# locked until the breakout so the box cannot expand with the break bar.


def _atr_h1(bars):
    if not bars or len(bars) < 2:
        return 0.0
    trs = []
    for i in range(1, len(bars)):
        h, l, pc = bars[i][2], bars[i][3], bars[i - 1][4]
        trs.append(max(h - l, abs(h - pc), abs(l - pc)))
    return sum(trs) / len(trs) if trs else 0.0


def _zone_overlap(bar, zone, pad=ZONE_PAD):
    if not bar or not zone or zone.get("low") is None or zone.get("high") is None:
        return False
    lo, hi = float(zone["low"]), float(zone["high"])
    if lo > hi:
        lo, hi = hi, lo
    high, low = float(bar.get("high")), float(bar.get("low"))
    return low <= hi + pad and high >= lo - pad


def detect_sideways(closed_bars, prev_sideways=None):
    """Return sideways / breakout state from fully closed H1 bars."""
    prev = prev_sideways or {}
    locked = bool(prev.get("active") and prev.get("low") is not None and prev.get("high") is not None)
    last = closed_bars[-1] if closed_bars else None
    last_c = float(last[4]) if last else None

    def pack(active, lo, hi, breakout=None, **extra):
        a, b = r1(lo, 1), r1(hi, 1)
        rng = _fmt_rng({"low": a, "high": b})
        rule_th = f"กราฟไซด์เวย์ ราคาระหว่าง {rng} ไม่มีทิศชัด แนะนำรอดูแท่ง H1 ปิดออกจากช่วงก่อนเข้า"
        rule_en = (
            f"Sideways: price is between {rng} with no clear direction. "
            "Wait for a closed H1 bar to leave this range before entering."
        )
        out = {
            "active": bool(active),
            "low": a,
            "high": b,
            "bars": SIDEWAYS_BARS,
            "rule_th": rule_th,
            "rule_en": rule_en,
            "note_th": rule_th if active else "",
            "note_en": rule_en if active else "",
        }
        out.update(extra)
        if breakout:
            direction = breakout
            if direction == "up":
                out["breakout"] = {
                    "confirmed": True,
                    "direction": "up",
                    "low": a,
                    "high": b,
                    "note_th": f"แท่ง H1 ปิดยืนยันเบรกออกจากช่วงไซด์เวย์ {rng} ขึ้น",
                    "note_en": f"A closed H1 confirmed a breakout above the sideways range {rng}",
                }
            else:
                out["breakout"] = {
                    "confirmed": True,
                    "direction": "down",
                    "low": a,
                    "high": b,
                    "note_th": f"แท่ง H1 ปิดยืนยันเบรกออกจากช่วงไซด์เวย์ {rng} ลง",
                    "note_en": f"A closed H1 confirmed a breakout below the sideways range {rng}",
                }
            out["active"] = False
            out["note_th"] = out["breakout"]["note_th"]
            out["note_en"] = out["breakout"]["note_en"]
        else:
            out["breakout"] = {"confirmed": False, "direction": "", "low": a, "high": b, "note_th": "", "note_en": ""}
        return out

    if locked and last_c is not None:
        lo, hi = float(prev["low"]), float(prev["high"])
        if lo > hi:
            lo, hi = hi, lo
        if last_c > hi:
            return pack(False, lo, hi, breakout="up")
        if last_c < lo:
            return pack(False, lo, hi, breakout="down")
        return pack(True, lo, hi)

    if len(closed_bars) < SIDEWAYS_BARS:
        return {"active": False, "breakout": {"confirmed": False, "direction": "", "note_th": "", "note_en": ""}}

    window = closed_bars[-SIDEWAYS_BARS:]
    lo = min(b[3] for b in window)
    hi = max(b[2] for b in window)
    width = hi - lo
    if width < 1:
        return {"active": False, "breakout": {"confirmed": False, "direction": "", "note_th": "", "note_en": ""}}
    atr = _atr_h1(closed_bars[-15:] if len(closed_bars) >= 15 else closed_bars)
    disp = abs(window[-1][4] - window[0][4])
    is_sw = disp <= SIDEWAYS_DISPLACEMENT * width and (atr <= 0 or width <= SIDEWAYS_ATR_MAX * atr)
    if not is_sw:
        return {
            "active": False,
            "low": r1(lo, 1),
            "high": r1(hi, 1),
            "bars": SIDEWAYS_BARS,
            "breakout": {"confirmed": False, "direction": "", "note_th": "", "note_en": ""},
            "eval_th": f"ช่วง { _fmt_rng({'low': r1(lo,1),'high': r1(hi,1)}) } ยังไม่เข้าเงื่อนไขไซด์เวย์",
        }
    return pack(True, lo, hi, displacement=r1(disp, 1), atr=r1(atr, 1), width=r1(width, 1))


def detect_reversal(bar, prior_bars, demand, supply):
    """Reversal only after a confirmed (closed) H1 at Demand or Supply."""
    if not bar:
        return None
    # Prior direction from the three fully closed bars before this one.
    prior_down = prior_up = False
    if prior_bars and len(prior_bars) >= 3:
        first, last = float(prior_bars[-3][4]), float(prior_bars[-1][4])
        prior_down = last < first
        prior_up = last > first
    close = float(bar.get("close"))
    bullish = bool(bar.get("bullish"))
    if demand and _zone_overlap(bar, demand) and prior_down:
        lo, hi = float(demand["low"]), float(demand["high"])
        if lo > hi:
            lo, hi = hi, lo
        # Confirm: close inside the zone, or the bar traded the zone and closed up through it.
        in_or_through = (lo - ZONE_PAD) <= close <= (hi + ZONE_PAD) or close >= hi
        if in_or_through and (bullish or close >= lo):
            rng = _fmt_rng({"low": r1(lo, 1), "high": r1(hi, 1)})
            return {
                "confirmed": True,
                "zone": "demand",
                "low": r1(lo, 1),
                "high": r1(hi, 1),
                "side": "buy",
                "note_th": f"ราคากลับตัวที่ Demand Zone {rng} นี่คือจุดกลับตัว เปลี่ยนจากลงเป็นขึ้น ให้สัญญาณ BUY",
                "note_en": f"Price reversed at Demand Zone {rng} — this is the reversal point, turning down to up, BUY signal",
            }
    if supply and _zone_overlap(bar, supply) and prior_up:
        lo, hi = float(supply["low"]), float(supply["high"])
        if lo > hi:
            lo, hi = hi, lo
        in_or_through = (lo - ZONE_PAD) <= close <= (hi + ZONE_PAD) or close <= lo
        if in_or_through and ((not bullish) or close <= hi):
            rng = _fmt_rng({"low": r1(lo, 1), "high": r1(hi, 1)})
            return {
                "confirmed": True,
                "zone": "supply",
                "low": r1(lo, 1),
                "high": r1(hi, 1),
                "side": "sell",
                "note_th": f"ราคากลับตัวที่ Supply Zone {rng} นี่คือจุดกลับตัว เปลี่ยนจากขึ้นเป็นลง ให้สัญญาณ SELL",
                "note_en": f"Price reversed at Supply Zone {rng} — this is the reversal point, turning up to down, SELL signal",
            }
    return None


def build_alert(plan):
    """Structured stance + reason used by every surface to compose ราคาล่าสุด alerts."""
    h1 = plan.get("h1") or {}
    news = plan.get("news") or {}
    demand, supply = plan.get("demand_zone"), plan.get("supply_zone")
    d_txt, s_txt = _fmt_rng(demand), _fmt_rng(supply)
    side = plan.get("side") or "wait"
    rev = h1.get("reversal") or {}
    sw = h1.get("sideways") or {}
    br = (sw.get("breakout") or {}) if isinstance(sw, dict) else {}
    if not br.get("confirmed"):
        br = h1.get("breakout") or br

    if news.get("blackout") and not h1.get("confirmed") and not rev.get("confirmed"):
        stance, stance_en, kind = "รอ", "waiting", "news"
        reason_th = news.get("label_th") or "ช่วงข่าวแรง งดเข้า"
        if news.get("detail_th"):
            reason_th += " — " + news["detail_th"]
        reason_en = news.get("label_en") or "high-impact news — no new entries"
        if news.get("detail_en"):
            reason_en += " — " + news["detail_en"]
    elif rev.get("confirmed"):
        stance = "BUY" if rev.get("side") == "buy" else "SELL"
        stance_en = stance
        kind = "reversal"
        reason_th = rev.get("note_th") or ""
        reason_en = rev.get("note_en") or ""
    elif br.get("confirmed"):
        up = br.get("direction") == "up"
        stance, stance_en, kind = ("BUY" if up else "SELL"), ("BUY" if up else "SELL"), "breakout"
        reason_th = br.get("note_th") or ""
        reason_en = br.get("note_en") or ""
    elif sw.get("active"):
        stance, stance_en, kind = "รอ", "waiting", "sideways"
        reason_th = sw.get("note_th") or sw.get("rule_th") or ""
        reason_en = sw.get("note_en") or sw.get("rule_en") or ""
    elif h1.get("confirmed") and side == "buy":
        stance, stance_en, kind = "BUY", "BUY", "confirm"
        z = d_txt if plan.get("trigger_zone") != "supply" else s_txt
        name = "Demand Zone" if plan.get("trigger_zone") != "supply" else "Supply Zone"
        if plan.get("trigger_zone") == "entry":
            name, z = "โซนเข้า", _fmt_rng({"low": plan.get("entry_low"), "high": plan.get("entry_high")})
        reason_th = f"แท่ง H1 ปิดยืนยันที่ {name} {z}"
        reason_en = f"a closed H1 confirmed the {name} {z}"
    elif h1.get("confirmed") and side == "sell":
        stance, stance_en, kind = "SELL", "SELL", "confirm"
        name = "Supply Zone" if plan.get("trigger_zone") != "demand" else "Demand Zone"
        z = s_txt if plan.get("trigger_zone") != "demand" else d_txt
        reason_th = f"แท่ง H1 ปิดยืนยันที่ {name} {z}"
        reason_en = f"a closed H1 confirmed the {name} {z}"
    elif side == "buy":
        stance, stance_en, kind = "รอ", "waiting", "wait"
        reason_th = f"ยังรอแท่ง H1 ปิดยืนยันที่ Demand Zone {d_txt}"
        reason_en = f"waiting for a confirming H1 close at Demand Zone {d_txt}"
    elif side == "sell":
        stance, stance_en, kind = "รอ", "waiting", "wait"
        reason_th = f"ยังรอแท่ง H1 ปิดยืนยันที่ Supply Zone {s_txt}"
        reason_en = f"waiting for a confirming H1 close at Supply Zone {s_txt}"
    else:
        stance, stance_en, kind = "รอ", "waiting", "wait"
        # Name the nearest / relevant zone
        reason_th = f"ยังไม่เข้าโซน · Demand Zone {d_txt} / Supply Zone {s_txt}"
        if h1.get("note_th") and "รอแท่ง H1" in h1["note_th"]:
            # Prefer the demand zone when price is nearer to it
            reason_th = f"ยังรอแท่ง H1 ปิดยืนยันที่ Demand Zone {d_txt}"
        reason_en = f"no setup yet · Demand Zone {d_txt} / Supply Zone {s_txt}"
        if h1.get("note_en") and "Waiting for a confirming H1" in h1["note_en"]:
            reason_en = f"waiting for a confirming H1 close at Demand Zone {d_txt}"

    return {
        "stance": stance,
        "stance_en": stance_en,
        "kind": kind,
        "reason_th": reason_th,
        "reason_en": reason_en,
        "lead_rule_th": "ราคาล่าสุด $X · ตอนนี้ BUY/SELL/รอ เพราะ…",
        "lead_rule_en": "Latest price $X · now BUY/SELL/waiting because …",
        "sideways_rule_th": "กราฟไซด์เวย์ ราคาระหว่าง A–B ไม่มีทิศชัด แนะนำรอดูแท่ง H1 ปิดออกจากช่วงก่อนเข้า",
        "reversal_rule_th": "ราคากลับตัวที่ Demand Zone A–B นี่คือจุดกลับตัว เปลี่ยนจากลงเป็นขึ้น ให้สัญญาณ BUY",
    }


def format_alert_text(plan, px, lang="th", extra=""):
    """Every alert starts with ราคาล่าสุด $X · ตอนนี้ BUY/SELL/รอ เพราะ…"""
    alert = plan.get("alert") or build_alert(plan)
    try:
        px_s = f"{float(px):,.1f}"
    except (TypeError, ValueError):
        px_s = "—"
    if lang == "th":
        lead = f"ราคาล่าสุด ${px_s} · ตอนนี้ {alert.get('stance') or 'รอ'} เพราะ{alert.get('reason_th') or 'กำลังดูโครงสร้าง'}"
    else:
        lead = f"Latest price ${px_s} · now {alert.get('stance_en') or 'waiting'} because {alert.get('reason_en') or 'the structure is being read'}"
    extra = (extra or "").strip()
    if extra and not extra.startswith(lead[:10]):
        short = lead + " " + extra
    else:
        short = lead
    return {"lead": lead, "short": short, "full": short, "kind": alert.get("kind"), "stance": alert.get("stance")}


def attach_live_flags(plan, candles_doc, events_doc, prev_plan=None, klines_doc=None):
    closed = closed_h1_bars(candles_doc, klines_doc=klines_doc)
    bar = last_closed_h1(candles_doc, klines_doc=klines_doc)
    news = news_blackout(events_doc)
    confirmed = bool(h1_confirms(plan, bar))
    # sticky confirmation on the same setup
    prev = prev_plan or {}
    same = (
        prev.get("side") == plan.get("side")
        and prev.get("entry") == plan.get("entry")
        and prev.get("sl") == plan.get("sl")
    )
    if same and prev.get("h1", {}).get("confirmed"):
        confirmed = True
        if bar and not plan.get("h1"):
            pass
    prev_h1 = prev.get("h1") or {}
    sideways = detect_sideways(closed, prev_h1.get("sideways"))
    prior = closed[:-1] if closed else []
    reversal = detect_reversal(bar, prior, plan.get("demand_zone"), plan.get("supply_zone"))
    # sticky reversal on the same zone + same closed bar
    if not reversal and prev_h1.get("reversal", {}).get("confirmed"):
        prev_bar = (prev_h1.get("bar") or {}).get("open_ts")
        if bar and prev_bar == bar.get("open_ts"):
            reversal = prev_h1.get("reversal")
    h1 = {
        "confirmed": confirmed or bool(reversal and reversal.get("confirmed")),
        "bar": bar,
        "note_th": "",
        "note_en": "",
        "sideways": sideways,
        "reversal": reversal,
        "breakout": (sideways or {}).get("breakout") or {"confirmed": False},
        "sideways_rule_th": "กราฟไซด์เวย์ ราคาระหว่าง A–B ไม่มีทิศชัด แนะนำรอดูแท่ง H1 ปิดออกจากช่วงก่อนเข้า",
        "reversal_rule_th": "ราคากลับตัวที่ Demand Zone A–B นี่คือจุดกลับตัว เปลี่ยนจากลงเป็นขึ้น ให้สัญญาณ BUY",
    }
    if bar:
        direction = "แท่งเขียว" if bar["bullish"] else "แท่งแดง"
        direction_en = "a bullish candle" if bar["bullish"] else "a bearish candle"
        if confirmed:
            h1["note_th"] = f"แท่ง H1 ปิดยืนยันแล้ว ที่ {bar['close']:,.2f} ({direction} ปิด {bar['as_of_hm']})"
            h1["note_en"] = f"H1 close confirmed at {bar['close']:,.2f} ({direction_en}, closed {bar['as_of_hm']})"
        else:
            h1["note_th"] = f"ยังรอแท่ง H1 ปิดยืนยัน (แท่งล่าสุดที่ปิด {bar['as_of_hm']} ปิดที่ {bar['close']:,.2f})"
            h1["note_en"] = f"Waiting for a confirming H1 close (last closed bar {bar['as_of_hm']} at {bar['close']:,.2f})"
    else:
        h1["note_th"] = "ยังไม่มีแท่ง H1 ที่ปิดครบชั่วโมง"
        h1["note_en"] = "No fully closed H1 bar is available yet"
    if reversal and reversal.get("confirmed"):
        h1["note_th"] = reversal["note_th"]
        h1["note_en"] = reversal["note_en"]
    elif (sideways or {}).get("active"):
        h1["note_th"] = sideways.get("note_th") or ""
        h1["note_en"] = sideways.get("note_en") or ""
    elif (sideways or {}).get("breakout", {}).get("confirmed"):
        h1["note_th"] = sideways["breakout"]["note_th"]
        h1["note_en"] = sideways["breakout"]["note_en"]
    plan["h1"] = h1
    plan["news"] = news
    # A confirmed reversal or plan confirmation is not suppressed by news? news still flags; suppress new entries unless already confirmed/reversal
    plan["suppress_entry"] = bool(news.get("blackout")) and not (confirmed or (reversal and reversal.get("confirmed")))
    plan["alert"] = build_alert(plan)
    return plan

def attach_guide(plan, levels, data, atr, usdthb):
    spot = float(plan.get("spot") or 0)
    demand, supply = compute_demand_supply(levels, data, spot, atr or 12)
    # If entry band is close to a zone, record it as the trigger
    side = plan.get("side") or "wait"
    entry_lo, entry_hi = plan.get("entry_low"), plan.get("entry_high")
    def near_zone(z):
        if not z or entry_lo is None or entry_hi is None:
            return False
        pad = max(4.0, 0.3 * (atr or 12))
        return not (float(entry_hi) < z["low"] - pad or float(entry_lo) > z["high"] + pad)
    trigger = None
    if side == "buy" and near_zone(demand):
        trigger = "demand"
    elif side == "sell" and near_zone(supply):
        trigger = "supply"
    elif side in ("buy", "sell"):
        trigger = "entry"

    trig_z = demand if trigger == "demand" else supply if trigger == "supply" else None
    entry_lo, entry_hi = plan.get("entry_low"), plan.get("entry_high")
    if trig_z and entry_lo is not None and entry_hi is not None:
        mid_e = (float(entry_lo) + float(entry_hi)) / 2
        mid_z = _mid(trig_z)
        if mid_z is not None and abs(mid_e - mid_z) <= max(10.0, 0.8 * (atr or 12)):
            # keep the structural zone as displayed demand/supply; entry stays the plan band
            pass

    plan["trigger_zone"] = trigger
    smc_dir, _, _ = smc_bias(data)
    ai_dir, _, _ = ai_bias(data)
    conf = _confidence(plan, smc_dir, ai_dir)
    steps_th, steps_en = _steps(plan, demand, supply)
    lots = _lots(plan, usdthb)

    d_txt, s_txt = _fmt_rng(demand), _fmt_rng(supply)
    if trigger == "demand":
        trig_th = f"BUY ที่ Demand Zone {d_txt}"
        trig_en = f"BUY at Demand Zone {d_txt}"
    elif trigger == "supply":
        trig_th = f"SELL ที่ Supply Zone {s_txt}"
        trig_en = f"SELL at Supply Zone {s_txt}"
    elif trigger == "entry" and side in ("buy", "sell"):
        band = _fmt_rng({"low": plan.get("entry_low"), "high": plan.get("entry_high")}) if plan.get("entry_low") is not None else (f"{plan['entry']:,.1f}" if plan.get("entry") is not None else "—")
        act = "BUY" if side == "buy" else "SELL"
        trig_th = f"{act} ที่โซนเข้า {band}"
        trig_en = f"{act} at entry zone {band}"
    else:
        trig_th = f"รอ — ยังไม่เข้าโซน · Demand {d_txt} / Supply {s_txt}"
        trig_en = f"WAIT — no setup yet · Demand {d_txt} / Supply {s_txt}"

    why_th = plan.get("thesis_th") or "ใช้โครงสร้างและแนวรับแนวต้านที่มีอยู่ ไม่ไล่ราคา"
    why_en = plan.get("thesis_en") or "Follow existing structure and support/resistance; do not chase."
    # keep why to one short sentence
    if " · " in why_th:
        # already plain enough
        pass

    reversal = []
    if plan.get("invalidation") is not None:
        reversal.append({
            "price": plan["invalidation"],
            "label_th": plan.get("invalidation_th") or f"ยกเลิกถ้าราคาผ่าน {plan['invalidation']:,.1f}",
            "label_en": plan.get("invalidation_en") or f"Cancel if price trades through {plan['invalidation']:,.1f}",
        })
    if side == "buy" and supply:
        reversal.append({
            "price": supply["high"],
            "low": supply["low"],
            "high": supply["high"],
            "label_th": f"จุดกลับฝั่งขายที่ Supply Zone {s_txt}",
            "label_en": f"Opposite sell area at Supply Zone {s_txt}",
        })
    if side == "sell" and demand:
        reversal.append({
            "price": demand["low"],
            "low": demand["low"],
            "high": demand["high"],
            "label_th": f"จุดกลับฝั่งซื้อที่ Demand Zone {d_txt}",
            "label_en": f"Opposite buy area at Demand Zone {d_txt}",
        })

    plan["demand_zone"] = demand
    plan["supply_zone"] = supply
    plan["trigger_zone"] = trigger
    plan["trigger_th"] = trig_th
    plan["trigger_en"] = trig_en
    plan["why_th"] = why_th
    plan["why_en"] = why_en
    plan["steps_th"] = steps_th
    plan["steps_en"] = steps_en
    plan["confidence"] = conf
    plan["position"] = lots
    plan["reversal"] = reversal
    plan["guide_disclaimer_th"] = "เพื่อการศึกษา ไม่ใช่คำแนะนำการลงทุน ใช้ SL เสมอ"
    plan["guide_disclaimer_en"] = "Education only — not investment advice. Always use a stop loss. Results are not guaranteed."
    return plan



def resolve_spot(levels, spot_doc, data):
    cands = []
    if spot_doc and spot_doc.get("price"):
        cands.append((float(spot_doc["price"]), spot_doc.get("src") or "spot.json"))
    if levels and levels.get("spot"):
        cands.append((float(levels["spot"]), levels.get("spotSource") or "levels"))
    if data and data.get("price_num"):
        cands.append((float(data["price_num"]), "data.json"))
    return cands[0] if cands else (None, None)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--levels", default="levels.json")
    ap.add_argument("--spot", default="spot.json")
    ap.add_argument("--data", default="data.json")
    ap.add_argument("--candles", default="candles.json")
    ap.add_argument("--compare", default="compare.json")
    ap.add_argument("--events", default="events.json")
    ap.add_argument("--klines", default="")
    ap.add_argument("--out", action="append")
    args = ap.parse_args()
    base = Path(".")
    levels = load_json(args.levels) or {}
    spot_doc = load_json(args.spot)
    data = load_json(args.data)
    candles_doc = load_json(args.candles) or {}
    candles = candles_doc.get("candles") or candles_doc
    compare = load_json(args.compare) if args.compare else None
    if compare is None:
        # landing may keep compare under data/
        compare = load_json("data/compare.json") or load_json("compare.json")
    spot, src = resolve_spot(levels, spot_doc, data)
    if spot is None:
        raise SystemExit("no spot")
    daily = levels.get("daily") or {}
    atr = atr_from_candles(candles, "H1") or atr_from_candles(candles, "H4")
    if not atr and daily.get("high") and daily.get("low"):
        atr = max(8.0, (float(daily["high"]) - float(daily["low"])) / 4.0)
    atr = float(atr or 12.0)
    plan = make_plan(levels, spot, atr, data)
    plan["spot_source"] = src
    usdthb = None
    if isinstance(compare, dict) and compare.get("usdthb"):
        try:
            usdthb = float(compare["usdthb"])
        except (TypeError, ValueError):
            usdthb = None
    plan = attach_guide(plan, levels, data, atr, usdthb)
    events = load_json(args.events)
    if events is None:
        events = load_json("data/events.json") or load_json("events.json")
    klines = load_json(args.klines) if args.klines else None
    if klines is None:
        klines = (
            load_json("assets/xau-klines.json")
            or load_json("data/xau-klines.json")
            or load_json("/workspace/puregold-whitepaper/assets/xau-klines.json")
        )
    prev = None
    for pth in ([Path(p) for p in (args.out or [])] or [Path("trade_plan.json")]):
        if pth.exists():
            try:
                prev = json.loads(pth.read_text())
                break
            except Exception:
                pass
    plan = attach_live_flags(plan, candles_doc, events, prev, klines_doc=klines)
    outs = args.out or ["trade_plan.json"]
    text = json.dumps(plan, ensure_ascii=False, indent=2)
    for o in outs:
        Path(o).parent.mkdir(parents=True, exist_ok=True)
        Path(o).write_text(text + "\n", encoding="utf-8")
        print(f"wrote {o} side={plan.get('side')} entry={plan.get('entry')} sl={plan.get('sl')} spot={plan.get('spot')}")


if __name__ == "__main__":
    main()
