#!/usr/bin/env python3
"""Append-only trade-plan outcomes. Never invents past results — starts from the first run."""
from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

BKK = timezone(timedelta(hours=7))


def load(path: Path):
    if not path or not path.exists():
        return None
    try:
        return json.loads(path.read_text())
    except Exception:
        return None


def plan_id(plan: dict) -> str:
    key = {
        "side": plan.get("side"),
        "entry": plan.get("entry"),
        "entry_low": plan.get("entry_low"),
        "entry_high": plan.get("entry_high"),
        "sl": plan.get("sl"),
        "tps": [(tp.get("n"), tp.get("price")) for tp in (plan.get("tps") or [])],
    }
    raw = json.dumps(key, sort_keys=True, separators=(",", ":"))
    return hashlib.sha1(raw.encode()).hexdigest()[:12]


def r_of(plan: dict, outcome: str):
    if outcome == "sl":
        return -1.0
    if outcome in ("cancelled", "expired"):
        return None
    tps = plan.get("tps") or []
    for tp in tps:
        if f"tp{tp.get('n')}" == outcome and tp.get("rr") is not None:
            try:
                return round(float(tp["rr"]), 2)
            except (TypeError, ValueError):
                return None
    return None


def first_hit(prev_px, curr_px, plan: dict) -> str | None:
    """Approximate the first level traded on the path from prev_px to curr_px."""
    if prev_px is None or curr_px is None or not plan:
        return None
    try:
        a, b = float(prev_px), float(curr_px)
    except (TypeError, ValueError):
        return None
    side = plan.get("side") or "wait"
    lo = a if a <= b else b
    hi = b if a <= b else a
    marks = []

    def add(name, price, direction):
        # direction: "up" if the level is hit when price rises to it
        try:
            px = float(price)
        except (TypeError, ValueError):
            return
        if lo - 1e-6 <= px <= hi + 1e-6:
            # distance along the move from a toward b
            span = b - a
            if abs(span) < 1e-9:
                t = 0.0
            else:
                t = (px - a) / span
            if 0 <= t <= 1:
                marks.append((t, name))

    sl = plan.get("sl")
    inv = plan.get("invalidation")
    if side == "sell":
        add("sl", sl, "up")
        add("cancelled", inv, "up")
        for tp in plan.get("tps") or []:
            add(f"tp{tp.get('n')}", tp.get("price"), "down")
    elif side == "buy":
        add("sl", sl, "down")
        add("cancelled", inv, "down")
        for tp in plan.get("tps") or []:
            add(f"tp{tp.get('n')}", tp.get("price"), "up")
    if not marks:
        return None
    marks.sort()
    return marks[0][1]


def snapshot(plan: dict, now: datetime, price) -> dict:
    tps = [{"n": tp.get("n"), "price": tp.get("price"), "rr": tp.get("rr")} for tp in (plan.get("tps") or [])]
    return {
        "id": plan_id(plan),
        "opened_at": now.isoformat(),
        "side": plan.get("side"),
        "side_th": plan.get("side_th"),
        "side_en": plan.get("side_en"),
        "entry": plan.get("entry"),
        "entry_low": plan.get("entry_low"),
        "entry_high": plan.get("entry_high"),
        "sl": plan.get("sl"),
        "tps": tps,
        "invalidation": plan.get("invalidation"),
        "title_th": plan.get("title_th") or plan.get("trigger_th"),
        "title_en": plan.get("title_en") or plan.get("trigger_en"),
        "status": "open",
        "outcome": None,
        "r": None,
        "reason_th": "",
        "reason_en": "",
        "closed_at": None,
        "last_price": price,
        "last_check": now.isoformat(),
    }


def close_item(item, outcome, price, now, plan=None, reason_th="", reason_en=""):
    src = plan or item
    item["status"] = "closed"
    item["outcome"] = outcome
    item["r"] = r_of(src, outcome)
    item["closed_at"] = now.isoformat()
    item["last_price"] = price
    item["last_check"] = now.isoformat()
    item["reason_th"] = reason_th
    item["reason_en"] = reason_en
    return item


def reason_for(outcome, plan, lang="th"):
    th = {
        "tp1": "ชน TP1",
        "tp2": "ชน TP2",
        "tp3": "ชน TP3",
        "sl": "โดน SL" + (f" ที่ {plan.get('sl')}" if plan and plan.get("sl") is not None else ""),
        "cancelled": plan.get("invalidation_th") if plan else "ยกเลิกแผน",
        "expired": "แผนถูกแทนที่ก่อนถึงเป้าหรือ SL",
    }
    en = {
        "tp1": "TP1 hit",
        "tp2": "TP2 hit",
        "tp3": "TP3 hit",
        "sl": "Stop hit" + (f" at {plan.get('sl')}" if plan and plan.get("sl") is not None else ""),
        "cancelled": plan.get("invalidation_en") if plan else "Plan cancelled",
        "expired": "The plan was replaced before a target or stop was hit",
    }
    return (th.get(outcome) or outcome, en.get(outcome) or outcome)


def stats_of(closed: list, started_at: str) -> dict:
    wins = [c for c in closed if (c.get("outcome") or "").startswith("tp")]
    losses = [c for c in closed if c.get("outcome") in ("sl",)]
    cancelled = [c for c in closed if c.get("outcome") == "cancelled"]
    expired = [c for c in closed if c.get("outcome") == "expired"]
    scored = wins + losses  # cancelled/expired excluded from win rate
    n = len(scored)
    wr = round(100.0 * len(wins) / n, 1) if n else None
    rs = [c["r"] for c in scored if isinstance(c.get("r"), (int, float))]
    avg = round(sum(rs) / len(rs), 2) if rs else None
    small = n < 10
    if n == 0:
        note_th = "เริ่มนับผลจากตอนนี้ ไม่มีประวัติย้อนหลัง · ยังไม่มีผลลัพธ์ที่ปิดแล้ว"
        note_en = "Results are counted from now — there is no backfilled history. No closed results yet."
    elif small:
        note_th = f"ตัวอย่างยังน้อย ({n} รายการที่นับได้) ยังสรุปความแม่นยำไม่ได้"
        note_en = f"The sample is still small ({n} counted results), so this is not a firm accuracy reading."
    else:
        note_th = f"นับจากแผนที่ปิดแล้ว {n} รายการ (ชนเป้า {len(wins)} · โดน SL {len(losses)})"
        note_en = f"From {n} counted closed plans ({len(wins)} targets hit · {len(losses)} stops)."
    return {
        "started_at": started_at,
        "closed": len(closed),
        "counted": n,
        "wins": len(wins),
        "losses": len(losses),
        "cancelled": len(cancelled),
        "expired": len(expired),
        "win_rate": wr,
        "avg_r": avg,
        "sample_small": small or n == 0,
        "note_th": note_th,
        "note_en": note_en,
    }


def empty_doc(now: datetime) -> dict:
    started = now.isoformat()
    return {
        "started_at": started,
        "updated_at": started,
        "source_note_th": "เริ่มนับผลจากรอบนี้ ไม่มีประวัติย้อนหลัง และไม่ได้สร้างผลลัพธ์สมมติ",
        "source_note_en": "Counted from this run onward. There is no backfilled history, and no results are invented.",
        "open": None,
        "closed": [],
        "stats": stats_of([], started),
    }


def update(doc: dict, plan: dict | None, price, now: datetime) -> dict:
    if not doc:
        doc = empty_doc(now)
    closed = list(doc.get("closed") or [])
    open_item = doc.get("open")
    side = (plan or {}).get("side") or "wait"
    pid = plan_id(plan) if plan and side in ("buy", "sell") else None

    def finish(item, outcome, reason_plan=None):
        th, en = reason_for(outcome, reason_plan or plan or item)
        close_item(item, outcome, price, now, reason_plan or plan, th, en)
        closed.append(item)
        return None

    if open_item and pid and open_item.get("id") == pid:
        hit = first_hit(open_item.get("last_price"), price, plan)
        reached = list(open_item.get("reached") or [])
        if hit and hit not in reached:
            reached.append(hit)
        open_item["reached"] = reached
        open_item["last_price"] = price
        open_item["last_check"] = now.isoformat()
        if "sl" in reached:
            open_item = finish(open_item, "sl", plan)
        elif "cancelled" in reached:
            open_item = finish(open_item, "cancelled", plan)
        elif "tp3" in reached:
            open_item = finish(open_item, "tp3", plan)
        else:
            # stay open; surface furthest TP so far as current_outcome
            for name in ("tp2", "tp1"):
                if name in reached:
                    open_item["current_outcome"] = name
                    open_item["r"] = r_of(plan, name)
                    th, en = reason_for(name, plan)
                    open_item["reason_th"], open_item["reason_en"] = th, en
                    break
    elif open_item and (not pid or open_item.get("id") != pid):
        hit = first_hit(open_item.get("last_price"), price, open_item)
        reached = list(open_item.get("reached") or [])
        if hit and hit not in reached:
            reached.append(hit)
        if "sl" in reached:
            open_item = finish(open_item, "sl", open_item)
        elif "cancelled" in reached:
            open_item = finish(open_item, "cancelled", open_item)
        elif any(x.startswith("tp") for x in reached):
            best = "tp3" if "tp3" in reached else "tp2" if "tp2" in reached else "tp1"
            open_item = finish(open_item, best, open_item)
        else:
            open_item = finish(open_item, "expired", open_item)

    if open_item is None and pid:
        open_item = snapshot(plan, now, price)
        open_item["reached"] = []

    if open_item is not None:
        open_item["last_price"] = price
        open_item["last_check"] = now.isoformat()

    started = doc.get("started_at") or now.isoformat()
    return {
        "started_at": started,
        "updated_at": now.isoformat(),
        "source_note_th": doc.get("source_note_th") or empty_doc(now)["source_note_th"],
        "source_note_en": doc.get("source_note_en") or empty_doc(now)["source_note_en"],
        "open": open_item,
        "closed": closed[-200:],
        "stats": stats_of(closed[-200:], started),
    }


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--plan", default="trade_plan.json")
    ap.add_argument("--spot", default="spot.json")
    ap.add_argument("--history", action="append", default=[])
    args = ap.parse_args(argv)
    outs = [Path(p) for p in (args.history or ["plan_history.json"])]
    prev = None
    for pth in outs:
        prev = load(pth)
        if prev:
            break
    plan = load(Path(args.plan)) or {}
    spot_doc = load(Path(args.spot)) or {}
    price = None
    for cand in (plan.get("spot"), spot_doc.get("price"), spot_doc.get("mid")):
        try:
            if cand is not None:
                price = float(cand)
                break
        except (TypeError, ValueError):
            pass
    now = datetime.now(BKK)
    doc = update(prev, plan, price, now)
    text = json.dumps(doc, ensure_ascii=False, indent=2) + "\n"
    for pth in outs:
        pth.parent.mkdir(parents=True, exist_ok=True)
        pth.write_text(text)
        print(f"wrote {pth}")
    st = doc["stats"]
    open_side = (doc.get("open") or {}).get("side")
    print(
        f"open={open_side or '—'} closed={st['closed']} counted={st['counted']} "
        f"win_rate={st['win_rate']} avg_r={st['avg_r']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
