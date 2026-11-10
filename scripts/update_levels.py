#!/usr/bin/env python3
"""Refresh XAUUSD spot, hourly bars, and support/resistance for the landing."""
from __future__ import annotations

import json
import sys
import math
import urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
BKK = timezone(timedelta(hours=7))
UA = "PureGoldLanding/1.0 (+https://gold.purefxai.store/)"

SQ_URL = "https://forex-data-feed.swissquote.com/public-quotes/bboquotes/instrument/XAU/USD"
GOLDAPI_URL = "https://api.gold-api.com/price/XAU"
BINANCE = [
    "https://data-api.binance.vision/api/v3/klines?symbol=PAXGUSDT&interval={interval}&limit={limit}",
    "https://api.binance.com/api/v3/klines?symbol=PAXGUSDT&interval={interval}&limit={limit}",
]
HSH_URL = "https://apicheckprice.huasengheng.com/api/values/getprice/"


def get_json(url: str, timeout: int = 12) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def fetch_spot() -> dict:
    try:
        j = get_json(SQ_URL)
        q = (j or [{}])[0].get("spreadProfilePrices") or []
        if q:
            bid, ask = float(q[0]["bid"]), float(q[0]["ask"])
            mid = (bid + ask) / 2
            return {"name": "swissquote", "price": round(mid, 3), "bid": bid, "ask": ask, "ok": True}
    except Exception:
        pass
    j = get_json(GOLDAPI_URL)
    px = float(j["price"])
    return {"name": "gold-api", "price": round(px, 3), "bid": None, "ask": None, "ok": True}


def fetch_klines(interval: str, limit: int) -> list[list]:
    last = None
    for tmpl in BINANCE:
        try:
            j = get_json(tmpl.format(interval=interval, limit=limit))
            if isinstance(j, list) and len(j) >= 10:
                return j
            last = j
        except Exception as e:
            last = e
    raise RuntimeError(f"klines {interval} failed: {last}")


def to_bars(raw: list[list], offset: float = 0.0) -> list[dict]:
    out = []
    for r in raw:
        o, h, l, c = (float(r[1]) + offset, float(r[2]) + offset, float(r[3]) + offset, float(r[4]) + offset)
        out.append({"t": int(r[0]), "o": round(o, 3), "h": round(h, 3), "l": round(l, 3), "c": round(c, 3)})
    return out


def floor_pivots(h: float, l: float, c: float) -> dict:
    pp = (h + l + c) / 3
    rng = h - l
    return {
        "high": round(h, 3),
        "low": round(l, 3),
        "close": round(c, 3),
        "pp": round(pp, 3),
        "r1": round(2 * pp - l, 3),
        "s1": round(2 * pp - h, 3),
        "r2": round(pp + rng, 3),
        "s2": round(pp - rng, 3),
        "r3": round(h + 2 * (pp - l), 3),
        "s3": round(l - 2 * (h - pp), 3),
    }


def swings(bars: list[dict], left: int = 3, right: int = 3, keep: int = 3) -> dict:
    highs, lows = [], []
    n = len(bars)
    for i in range(left, n - right):
        h, l = bars[i]["h"], bars[i]["l"]
        if all(h >= bars[i - k]["h"] and h >= bars[i + k]["h"] for k in range(1, left + 1)):
            highs.append({"t": bars[i]["t"], "price": bars[i]["h"]})
        if all(l <= bars[i - k]["l"] and l <= bars[i + k]["l"] for k in range(1, left + 1)):
            lows.append({"t": bars[i]["t"], "price": bars[i]["l"]})
    return {
        "highs": highs[-keep:],
        "lows": lows[-keep:],
    }


def nearest(spot: float, levels: dict, extra: list[float]) -> dict:
    named = []
    for key, label in (("r3", "R3"), ("r2", "R2"), ("r1", "R1"), ("pp", "Pivot"), ("s1", "S1"), ("s2", "S2"), ("s3", "S3")):
        named.append((label, levels[key]))
    for p in extra:
        named.append(("Swing", p))
    best = min(named, key=lambda x: abs(x[1] - spot))
    dist = best[1] - spot
    side = "resistance" if dist > 0.15 else ("support" if dist < -0.15 else "at-level")
    return {"name": best[0], "price": round(best[1], 3), "distance": round(dist, 3), "side": side}


def bias_of(spot: float, daily: dict) -> tuple[str, str, str]:
    if spot > daily["r1"]:
        return "up", "เอียงขึ้นเหนือ R1", "Tilt up, above R1"
    if spot > daily["pp"] + 1:
        return "up", "เอียงขึ้นเหนือจุดพิวอต", "Tilt up, above the pivot"
    if spot < daily["s1"]:
        return "down", "เอียงลงต่ำกว่า S1", "Tilt down, below S1"
    if spot < daily["pp"] - 1:
        return "down", "เอียงลงต่ำกว่าจุดพิวอต", "Tilt down, below the pivot"
    return "neutral", "ทรงตัวใกล้จุดพิวอต", "Neutral, near the pivot"


def main(json_only: bool = False) -> None:
    now = datetime.now(timezone.utc)
    spot = fetch_spot()
    px = spot["price"]
    h1 = fetch_klines("1h", 120)
    h4 = fetch_klines("4h", 60)
    d1 = fetch_klines("1d", 16)
    last_h1 = float(h1[-1][4])
    off = px - last_h1
    bars_h1 = to_bars(h1, off)
    bars_h4 = to_bars(h4, off)
    bars_d1 = to_bars(d1, off)
    # Previous completed daily / H4 bar (exclude in-progress)
    prev_d = bars_d1[-2] if len(bars_d1) >= 2 else bars_d1[-1]
    prev_h4 = bars_h4[-2] if len(bars_h4) >= 2 else bars_h4[-1]
    daily = floor_pivots(prev_d["h"], prev_d["l"], prev_d["c"])
    h4p = floor_pivots(prev_h4["h"], prev_h4["l"], prev_h4["c"])
    sw = swings(bars_h4 if len(bars_h4) >= 16 else bars_h1)
    extra = [x["price"] for x in sw["highs"] + sw["lows"]]
    near = nearest(px, daily, extra)
    bias, bias_th, bias_en = bias_of(px, daily)
    bkk = now.astimezone(BKK)
    payload = {
        "symbol": "XAUUSD",
        "updatedAt": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "updatedAtBangkok": bkk.strftime("%Y-%m-%d %H:%M"),
        "spot": px,
        "spotSource": spot["name"],
        "offset": round(off, 3),
        "daily": daily,
        "h4": h4p,
        "swings": sw,
        "nearest": near,
        "bias": bias,
        "biasTh": bias_th,
        "biasEn": bias_en,
        "note": "Daily and H4 floor pivots from the prior completed session, aligned to FX spot. Education only — not investment advice.",
        "noteTh": "จุดพิวอต รายวันและ H4 จากแท่งที่ปิดแล้ว ปรับให้ตรงราคาทองสปอต — เพื่อการศึกษา ไม่ใช่คำแนะนำการลงทุน",
    }
    levels_path = ROOT / "assets" / "levels.json"
    levels_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    klines = {
        "symbol": "XAUUSD",
        "interval": "1h",
        "updatedAt": payload["updatedAt"],
        "spot": px,
        "spotSource": spot["name"],
        "note": "Hourly XAUUSD series aligned to FX spot so the landing chart matches the live desk.",
        "closes": bars_h1[-72:],
    }
    for dest in (ROOT / "assets" / "xau-klines.json", ROOT / "data" / "xau-klines.json"):
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(json.dumps(klines, ensure_ascii=False), encoding="utf-8")

    thai = []
    try:
        raw = get_json(HSH_URL)
        if isinstance(raw, list):
            thai = raw
    except Exception:
        pass
    quotes = {
        "updatedAt": payload["updatedAt"],
        "spot": {"price": px, "symbol": "XAU", "currency": "USD", "currencySymbol": "$", "source": spot["name"]},
        "thai": thai,
    }
    # keep existing thai if fetch failed
    if not thai:
        try:
            old = json.loads((ROOT / "assets" / "quotes.json").read_text(encoding="utf-8"))
            quotes["thai"] = old.get("thai") or []
        except Exception:
            quotes["thai"] = []
    for dest in (ROOT / "assets" / "quotes.json", ROOT / "data" / "quotes.json"):
        dest.write_text(json.dumps(quotes, ensure_ascii=False), encoding="utf-8")

    live = {"updatedAt": payload["updatedAt"], "spot": quotes["spot"], "klines": klines, "levels": payload, "thai": quotes["thai"]}
    (ROOT / "data" / "live.json").write_text(json.dumps(live, ensure_ascii=False), encoding="utf-8")

    # Patch embedded blobs in index.html if present (skip in --json-only box refresh)
    index = ROOT / "index.html"
    if index.exists() and not json_only:
        html = index.read_text(encoding="utf-8")
        def replace_script(html: str, sid: str, obj: Any) -> str:
            start = html.find(f'<script type="application/json" id="{sid}">')
            if start < 0:
                return html
            end = html.find("</script>", start)
            body = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
            return html[:start] + f'<script type="application/json" id="{sid}">{body}</script>' + html[end + len("</script>"):]
        html = replace_script(html, "pg-klines", klines)
        html = replace_script(html, "pg-quotes", quotes)
        if 'id="pg-levels"' in html:
            html = replace_script(html, "pg-levels", payload)
        else:
            # insert before pg-klines if we already rewrote klines; add after quotes
            marker = '<script type="application/json" id="pg-quotes">'
            pos = html.find(marker)
            if pos >= 0:
                end = html.find("</script>", pos)
                insert = f'\n  <script type="application/json" id="pg-levels">{json.dumps(payload, ensure_ascii=False, separators=(",", ":"))}</script>'
                html = html[:end + len("</script>")] + insert + html[end + len("</script>"):]
        index.write_text(html, encoding="utf-8")

    try:
        refresh_spdr()
    except Exception as e:
        print(f"spdr skipped: {e}")

    print(f"spot {px} ({spot['name']})  pivot {daily['pp']}  nearest {near['name']} {near['price']}  bias {bias}")
    print(f"wrote {levels_path.relative_to(ROOT)}")



def refresh_spdr() -> None:
    dest = ROOT / "assets" / "spdr.json"
    url = "https://dashboard.purefxai.store/spdr.json"
    try:
        data = get_json(url)
        if isinstance(data, dict) and data.get("tonnes") is not None:
            dest.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(f"spdr {data.get('as_of')} {data.get('tonnes')} t")
            return
    except Exception as e:
        print(f"spdr fetch skipped: {e}")
    if dest.exists():
        print("spdr kept cached copy")


if __name__ == "__main__":
    main(json_only="--json-only" in sys.argv)
