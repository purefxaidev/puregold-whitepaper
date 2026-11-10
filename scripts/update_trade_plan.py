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
    ap.add_argument("--out", action="append")
    args = ap.parse_args()
    base = Path(".")
    levels = load_json(args.levels) or {}
    spot_doc = load_json(args.spot)
    data = load_json(args.data)
    candles_doc = load_json(args.candles) or {}
    candles = candles_doc.get("candles") or candles_doc
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
    outs = args.out or ["trade_plan.json"]
    text = json.dumps(plan, ensure_ascii=False, indent=2)
    for o in outs:
        Path(o).parent.mkdir(parents=True, exist_ok=True)
        Path(o).write_text(text + "\n", encoding="utf-8")
        print(f"wrote {o} side={plan.get('side')} entry={plan.get('entry')} sl={plan.get('sl')} spot={plan.get('spot')}")


if __name__ == "__main__":
    main()
