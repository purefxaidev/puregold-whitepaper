#!/usr/bin/env python3
"""Refresh official Thai gold announcement prices (bar + jewelry, baht-weight).

User-facing labels in the written JSON are only ราคาทองไทย / Thai gold.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

BKK = timezone(timedelta(hours=7))
UA = "PureGold/1.0 (+https://gold.purefxai.store/)"
OFFICIAL_URL = "https://classic.goldtraders.or.th/"
# CORS-enabled feed that carries the same official announcement rows (GoldType REF + JEWEL).
FEED_URL = "https://apicheckprice.huasengheng.com/api/values/getprice/"
SPAN = re.compile(
    r'id="DetailPlace_uc_goldprices1_(lblAsTime|lblBLSell|lblBLBuy|lblOMSell|lblOMBuy)"[^>]*>(.*?)</span>',
    re.I | re.S,
)
ASOF = re.compile(
    r"(\d{1,2})/(\d{1,2})/(\d{4})\s*เวลา\s*(\d{1,2}):(\d{2})\s*น\.(?:\s*\(\s*ครั้งที่\s*(\d+)\s*\))?",
    re.S,
)
NUM = re.compile(r"(-?[\d,]+(?:\.\d+)?)")
COLOR = re.compile(r'color\s*=\s*"?(Green|Red|Black)"?', re.I)


def fetch(url: str, timeout: int = 20) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")


def fetch_json(url: str, timeout: int = 15):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def baht(s) -> float | None:
    if s is None or s == "":
        return None
    if isinstance(s, (int, float)):
        return float(s)
    m = NUM.search(str(s).replace(" ", ""))
    if not m:
        return None
    try:
        return float(m.group(1).replace(",", ""))
    except ValueError:
        return None


def parse_official(html: str) -> dict | None:
    fields: dict[str, tuple[float | None, str | None, str]] = {}
    as_txt = ""
    for mid, inner in SPAN.findall(html):
        text = re.sub(r"<[^>]+>", " ", inner)
        text = re.sub(r"\s+", " ", text).strip()
        if mid == "lblAsTime":
            as_txt = text
            continue
        color = None
        cm = COLOR.search(inner)
        if cm:
            color = cm.group(1).lower()
        fields[mid] = (baht(text), color, text)
    if "lblBLBuy" not in fields or "lblBLSell" not in fields:
        return None
    as_of = None
    revision = None
    hm = None
    m = ASOF.search(as_txt)
    if m:
        d, mo, y, hh, mm, rev = m.groups()
        year = int(y)
        if year > 2400:
            year -= 543
        as_of = datetime(year, int(mo), int(d), int(hh), int(mm), tzinfo=BKK)
        revision = int(rev) if rev else None
        hm = f"{int(hh):02d}:{int(mm):02d}"
    def change_hint(color: str | None) -> int | None:
        if color == "red":
            return -1  # direction only; numeric change filled later
        if color == "green":
            return 1
        return None
    bar_buy, bar_buy_c, _ = fields.get("lblBLBuy", (None, None, ""))
    bar_sell, bar_sell_c, _ = fields.get("lblBLSell", (None, None, ""))
    jw_buy, jw_buy_c, _ = fields.get("lblOMBuy", (None, None, ""))
    jw_sell, jw_sell_c, _ = fields.get("lblOMSell", (None, None, ""))
    if bar_buy is None or bar_sell is None:
        return None
    return {
        "as_of": as_of,
        "as_of_hm": hm,
        "revision": revision,
        "as_txt": as_txt,
        "bar": {"buy": bar_buy, "sell": bar_sell, "dir": change_hint(bar_buy_c or bar_sell_c)},
        "jewelry": {"buy": jw_buy, "sell": jw_sell, "dir": change_hint(jw_buy_c or jw_sell_c)},
    }


def feed_rows(payload) -> dict:
    out = {}
    if not isinstance(payload, list):
        return out
    for row in payload:
        typ = str(row.get("GoldType") or "").upper()
        if typ in ("REF", "JEWEL"):
            out[typ] = {
                "buy": baht(row.get("Buy")),
                "sell": baht(row.get("Sell")),
                "change": baht(row.get("BuyChange") if row.get("BuyChange") is not None else row.get("SellChange")),
                "time": row.get("TimeUpdate") or "",
            }
    return out


def same(a, b, tol=1.0) -> bool:
    if a is None or b is None:
        return False
    return abs(float(a) - float(b)) <= tol


def attach_change(product: dict, feed: dict | None, prev: dict | None) -> None:
    ch = None
    if feed and same(product.get("buy"), feed.get("buy")) and same(product.get("sell"), feed.get("sell")):
        if feed.get("change") is not None:
            ch = feed["change"]
    if ch is None and prev:
        # vs previous announcement sell, only if we have a stored prior
        if prev.get("sell") is not None and product.get("sell") is not None:
            ch = product["sell"] - prev["sell"]
    product["change"] = ch
    product.pop("dir", None)


def product_out(p: dict) -> dict:
    return {
        "purity": "96.5%",
        "buy": None if p.get("buy") is None else round(p["buy"], 2),
        "sell": None if p.get("sell") is None else round(p["sell"], 2),
        "change": None if p.get("change") is None else round(p["change"], 2),
    }


def build(prev_doc: dict | None) -> dict:
    now = datetime.now(BKK)
    official = None
    official_err = None
    try:
        official = parse_official(fetch(OFFICIAL_URL))
        if not official:
            official_err = "official page parsed no prices"
    except Exception as e:
        official_err = str(e)

    feed = {}
    try:
        feed = feed_rows(fetch_json(FEED_URL))
    except Exception:
        feed = {}

    if not official:
        # Fallback only when the official announcement page is unreachable:
        # use the official announcement rows from the CORS feed (REF + JEWEL), never shop quotes.
        ref, jewel = feed.get("REF"), feed.get("JEWEL")
        if not ref or ref.get("buy") is None:
            raise RuntimeError(f"Thai gold official prices unavailable ({official_err})")
        as_of = None
        hm = None
        t = str(ref.get("time") or "")
        try:
            as_of = datetime.fromisoformat(t).replace(tzinfo=BKK) if t else None
            if as_of:
                hm = as_of.strftime("%H:%M")
        except ValueError:
            as_of = None
        official = {
            "as_of": as_of,
            "as_of_hm": hm,
            "revision": None,
            "as_txt": "",
            "bar": {"buy": ref["buy"], "sell": ref["sell"], "change": ref.get("change")},
            "jewelry": {
                "buy": (jewel or {}).get("buy"),
                "sell": (jewel or {}).get("sell"),
                "change": (jewel or {}).get("change"),
            },
        }

    prev_bar = (prev_doc or {}).get("bar") if isinstance(prev_doc, dict) else None
    prev_jw = (prev_doc or {}).get("jewelry") if isinstance(prev_doc, dict) else None
    # If this is the same announcement, keep previous numeric change when feed lacks it
    attach_change(official["bar"], feed.get("REF"), prev_bar)
    attach_change(official["jewelry"], feed.get("JEWEL"), prev_jw)

    as_of = official.get("as_of")
    hm = official.get("as_of_hm") or (as_of.strftime("%H:%M") if as_of else None)
    as_of_iso = as_of.isoformat() if as_of else None
    rev = official.get("revision")
    as_of_th = "อัปเดตล่าสุด " + hm if hm else "อัปเดตล่าสุด —"
    if rev:
        as_of_th += f" · ครั้งที่ {rev}"
    as_of_en = "Updated " + hm if hm else "Updated —"
    if rev:
        as_of_en += f" · print {rev}"

    return {
        "as_of": as_of_iso,
        "as_of_hm": hm,
        "as_of_th": as_of_th,
        "as_of_en": as_of_en,
        "revision": rev,
        "fetched_at": now.isoformat(),
        "source_label_th": "ราคาทองไทย",
        "source_label_en": "Thai gold",
        "bar": product_out(official["bar"]),
        "jewelry": product_out(official["jewelry"]),
        "unit_th": "บาทละ",
        "unit_en": "per baht-weight",
    }


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", action="append", default=[], help="output JSON path (repeatable)")
    args = ap.parse_args(argv)
    outs = [Path(p) for p in (args.out or ["thai_gold.json"])]
    prev = None
    for p in outs:
        if p.exists():
            try:
                prev = json.loads(p.read_text())
                break
            except Exception:
                pass
    doc = build(prev)
    text = json.dumps(doc, ensure_ascii=False, indent=2) + "\n"
    for p in outs:
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text)
        print(f"wrote {p}")
    bar, jw = doc["bar"], doc["jewelry"]
    print(
        f"bar buy {bar['buy']} sell {bar['sell']} ch {bar['change']} | "
        f"jewelry buy {jw['buy']} sell {jw['sell']} ch {jw['change']} | {doc['as_of_th']}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
