#!/usr/bin/env python3
"""Build perf.json: live XAUUSD mid vs calendar 7d / 30d / 90d / YTD / 365d closes.

History is Yahoo Finance COMEX Gold futures (GC=F) daily close — a real gold
series (Yahoo no longer serves XAUUSD=X). Live mid is Swissquote XAU/USD, then
gold-api.com. Periods without a close on or before the target date are omitted.
Thai gold is omitted unless a real history exists (it does not).
Values are never invented.
"""
from __future__ import annotations

import argparse
import json
import ssl
import sys
import time
import urllib.error
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Optional

BKK = timezone(timedelta(hours=7))
UA = "Mozilla/5.0 (compatible; PureGold/1.0; +https://gold.purefxai.store/)"
CTX = ssl.create_default_context()

PERIODS = [
    ("1W", 7, "1 สัปดาห์", "1 week"),
    ("1M", 30, "1 เดือน", "1 month"),
    ("3M", 90, "3 เดือน", "3 months"),
    ("YTD", None, "ปีนี้ (YTD)", "Year to date"),
    ("1Y", 365, "1 ปี", "1 year"),
]


def now_bkk() -> datetime:
    return datetime.now(tz=BKK)


def get(url: str, timeout: int = 20) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json,text/plain,*/*"})
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
        return r.read()


def get_json(url: str, timeout: int = 20) -> Any:
    return json.loads(get(url, timeout=timeout).decode("utf-8"))


def live_xau() -> tuple[float, str]:
    try:
        data = get_json("https://forex-data-feed.swissquote.com/public-quotes/bboquotes/instrument/XAU/USD", 12)
        if isinstance(data, list):
            for inst in data:
                profiles = inst.get("spreadProfilePrices") or inst.get("priceProfiles") or []
                for p in profiles:
                    bid, ask = p.get("bid"), p.get("ask")
                    if bid and ask:
                        return (float(bid) + float(ask)) / 2.0, "Swissquote XAU/USD mid"
                bid, ask = inst.get("bid"), inst.get("ask")
                if bid and ask:
                    return (float(bid) + float(ask)) / 2.0, "Swissquote XAU/USD mid"
    except Exception as e:
        print("swissquote failed:", e, file=sys.stderr)
    try:
        j = get_json("https://api.gold-api.com/price/XAU", 12)
        px = float(j.get("price") or 0)
        if px > 0:
            return px, "gold-api.com XAU"
    except Exception as e:
        print("gold-api failed:", e, file=sys.stderr)
    raise RuntimeError("no live XAUUSD mid")


def yahoo_daily(symbol: str) -> dict[date, float]:
    urls = [
        f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=2y",
        f"https://query2.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=2y",
    ]
    last_err: Optional[Exception] = None
    for url in urls:
        for attempt in range(3):
            try:
                d = get_json(url, 25)
                res = (d.get("chart") or {}).get("result") or []
                if not res:
                    raise RuntimeError((d.get("chart") or {}).get("error") or f"no result for {symbol}")
                r = res[0]
                ts = r.get("timestamp") or []
                closes = (r.get("indicators") or {}).get("quote", [{}])[0].get("close") or []
                out: dict[date, float] = {}
                for t, c in zip(ts, closes):
                    if c is None:
                        continue
                    dt = datetime.fromtimestamp(int(t), tz=timezone.utc).astimezone(BKK).date()
                    out[dt] = float(c)
                if len(out) < 200:
                    raise RuntimeError(f"too few daily closes for {symbol}: {len(out)}")
                return out
            except Exception as e:
                last_err = e
                time.sleep(0.8 * (attempt + 1))
    raise RuntimeError(f"yahoo {symbol} failed: {last_err}")


def paxg_daily() -> dict[date, float]:
    raw = get_json("https://data-api.binance.vision/api/v3/klines?symbol=PAXGUSDT&interval=1d&limit=1000", 20)
    out: dict[date, float] = {}
    for k in raw:
        t = int(k[0]) // 1000
        dt = datetime.fromtimestamp(t, tz=timezone.utc).astimezone(BKK).date()
        out[dt] = float(k[4])
    return out


def close_on_or_before(series: dict[date, float], target: date) -> Optional[tuple[date, float]]:
    cand = None
    for d in sorted(series):
        if d <= target:
            cand = (d, series[d])
        else:
            break
    return cand


def ytd_target(today: date) -> date:
    return date(today.year, 1, 1)


def build(spot: float, spot_src: str, hist: dict[date, float], verify: Optional[dict[date, float]]) -> dict[str, Any]:
    today = now_bkk().date()
    periods = []
    for pid, days, th, en in PERIODS:
        if pid == "YTD":
            target = ytd_target(today)
        else:
            target = today - timedelta(days=int(days))
        ref = close_on_or_before(hist, target)
        if not ref:
            print(f"omit {pid}: no close on or before {target}", file=sys.stderr)
            continue
        ref_date, ref_close = ref
        if ref_close <= 0:
            print(f"omit {pid}: non-positive close", file=sys.stderr)
            continue
        change = spot - ref_close
        rec: dict[str, Any] = {
            "id": pid,
            "days": days,
            "label_th": th,
            "label_en": en,
            "target": target.isoformat(),
            "ref_date": ref_date.isoformat(),
            "ref_close": round(ref_close, 3),
            "change": round(change, 3),
            "change_pct": round(change / ref_close * 100.0, 4),
        }
        if verify:
            # Compare the same session as the primary close (ignore later weekend/holiday crypto prints).
            vref = close_on_or_before(verify, ref_date)
            if vref and vref[1] > 0:
                rec["verify_source"] = "Binance PAXGUSDT daily close"
                rec["verify_ref_date"] = vref[0].isoformat()
                rec["verify_ref_close"] = round(vref[1], 3)
                rec["verify_pct"] = round((spot - vref[1]) / vref[1] * 100.0, 4)
        periods.append(rec)
    asof = now_bkk()
    return {
        "as_of": asof.isoformat(timespec="seconds"),
        "as_of_bangkok": asof.strftime("%Y-%m-%d %H:%M"),
        "spot": round(spot, 3),
        "spot_source": spot_src,
        "history_source": "Yahoo Finance COMEX Gold (GC=F) daily close",
        "history_symbol": "GC=F",
        "currency": "USD",
        "basis": "calendar close on or before target date; % = (live XAUUSD mid − ref close) / ref close",
        "verified_with": "Binance PAXGUSDT daily close" if verify else None,
        "periods": periods,
    }


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    tmp.replace(path)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", action="append", default=[], help="output JSON path (repeatable)")
    args = ap.parse_args()
    outs = [Path(p) for p in args.out] or [Path("perf.json")]

    try:
        spot, src = live_xau()
    except Exception as e:
        print("live failed:", e, file=sys.stderr)
        return 1
    try:
        hist = yahoo_daily("GC=F")
    except Exception as e:
        print("history failed:", e, file=sys.stderr)
        # Reuse ref closes from an existing file if it is from today (same calendar targets).
        reused = None
        for p in outs:
            if p.exists():
                try:
                    old = json.loads(p.read_text(encoding="utf-8"))
                    if (old.get("as_of_bangkok") or "").split(" ")[0] == now_bkk().date().isoformat() and old.get("periods"):
                        reused = old
                        break
                except Exception:
                    pass
        if not reused:
            return 1
        print("reusing today's ref closes from existing perf.json", file=sys.stderr)
        periods = []
        for pe in reused["periods"]:
            ref = float(pe.get("ref_close") or 0)
            if ref <= 0:
                continue
            change = spot - ref
            rec = dict(pe)
            rec["change"] = round(change, 3)
            rec["change_pct"] = round(change / ref * 100.0, 4)
            periods.append(rec)
        asof = now_bkk()
        payload = dict(reused)
        payload.update({
            "as_of": asof.isoformat(timespec="seconds"),
            "as_of_bangkok": asof.strftime("%Y-%m-%d %H:%M"),
            "spot": round(spot, 3),
            "spot_source": src,
            "periods": periods,
        })
        for p in outs:
            write_json(p, payload)
        print(json.dumps({"spot": payload["spot"], "n": len(periods)}, ensure_ascii=False))
        return 0

    verify = None
    try:
        verify = paxg_daily()
    except Exception as e:
        print("paxg verify skipped:", e, file=sys.stderr)

    payload = build(spot, src, hist, verify)
    if not payload["periods"]:
        print("no periods computed", file=sys.stderr)
        return 1
    for p in outs:
        write_json(p, payload)
    for pe in payload["periods"]:
        vp = pe.get("verify_pct")
        extra = f"  verify {vp:+.2f}%" if isinstance(vp, (int, float)) else ""
        print(f"{pe['id']}  {pe['change_pct']:+.2f}%  ref {pe['ref_date']} {pe['ref_close']:.2f}{extra}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
