#!/usr/bin/env python3
"""Copy PureGold market-desk JSON onto the landing, preferring a fresh local
snapshot and falling back to the live dashboard if needed."""
from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
DASH = "https://dashboard.purefxai.store"
FILES = ["events.json", "cot.json", "feargreed.json", "compare.json", "brief.json", "dollar.json"]
UA = "PureGoldLanding/1.0 (+https://gold.purefxai.store/)"


def fetch(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode("utf-8"))


def fresher(a, b) -> bool:
    """Return True if a looks newer than b."""
    if not a:
        return False
    if not b:
        return True
    for k in ("updated_at", "generated_at", "as_of", "updated_at_bkk"):
        av, bv = a.get(k), b.get(k) if isinstance(b, dict) else None
        if av and bv and str(av) > str(bv):
            return True
        if av and not bv:
            return True
    return False


def main() -> int:
    DATA.mkdir(parents=True, exist_ok=True)
    ok = 0
    for name in FILES:
        dest = DATA / name
        local = None
        if dest.exists():
            try:
                local = json.loads(dest.read_text(encoding="utf-8"))
            except Exception:
                local = None
        remote = None
        try:
            remote = fetch(f"{DASH}/{name}")
        except Exception as e:
            print(f"[sync_insights] {name}: dashboard fetch failed ({e})")
        chosen = remote if fresher(remote, local) else (local or remote)
        if not chosen:
            print(f"[sync_insights] {name}: no data", file=sys.stderr)
            continue
        dest.write_text(json.dumps(chosen, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print(f"[sync_insights] wrote data/{name}")
        ok += 1
    share_dir = ROOT / "share"
    share_dir.mkdir(parents=True, exist_ok=True)
    for kind in ("price", "forecast", "trend", "spdr", "brief"):
        for size in ("1200x675", "1080x1350"):
            name = f"latest-{kind}-{size}.png"
            dest = share_dir / name
            remote = None
            try:
                req = urllib.request.Request(
                    f"{DASH}/share/{name}",
                    headers={"User-Agent": UA, "Accept": "image/png"},
                )
                with urllib.request.urlopen(req, timeout=20) as r:
                    remote = r.read()
            except Exception as e:
                print(f"[sync_insights] {name}: dashboard fetch failed ({e})")
            if remote and remote.startswith(b'\x89PNG') and len(remote) > 1000:
                dest.write_bytes(remote)
                print(f"[sync_insights] wrote share/{name} ({len(remote)} bytes)")
                ok += 1
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
