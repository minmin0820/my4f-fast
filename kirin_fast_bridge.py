"""My4F Fast Live Data Bridge.

DISPLAY BRIDGE ONLY.
This module must never calculate or alter KIRIN strategy decisions.
It serializes values already finalized by the Python/Streamlit source of truth.
"""
from __future__ import annotations
import json
import math
from typing import Any

SCHEMA_VERSION = "kirin-fast-1.0"

def _finite(x):
    try:
        v=float(x)
        return v if math.isfinite(v) else None
    except Exception:
        return None

def _weights(d):
    out={}
    for k,v in (d or {}).items():
        x=_finite(v)
        if x is not None and x > 1e-12:
            out[str(k)]=round(x*100.0, 8)  # Fast UI uses percentage points.
    return out

def _pct(x):
    v=_finite(x)
    return None if v is None else round(v, 8)

def _health_color(c):
    s=str(c or "").lower()
    if "16a34a" in s or "green" in s: return "green"
    if "d97706" in s or "yellow" in s or "orange" in s: return "yellow"
    if "dc2626" in s or "red" in s: return "red"
    return "gray"

def build_snapshot(*, asof, month, previous_month, exact_ticker, live_ticker,
                   four_gods, previous_live, health, risk, signals,
                   monthly_rows, summary, benchmarks, forward_mode, performance=None):
    """Serialize finalized Python outputs. No strategy logic is allowed here."""
    cur=set((live_ticker or {}).keys()); prev=set((previous_live or {}).keys())
    added=sorted(cur-prev); removed=sorted(prev-cur)
    changed=bool(previous_live) and (cur != prev)

    def alloc_text(d):
        return " / ".join(f"{k} {float(v)*100:.1f}%" for k,v in
                        sorted((d or {}).items(), key=lambda kv:(-float(kv[1]), str(kv[0]))))

    rows=[]
    for r in monthly_rows:
        rows.append([
            str(r["month"]), str(r["badge"]),
            _pct(r.get("tenkai")), _pct(r.get("genze")),
            _pct(r.get("SPY")), _pct(r.get("TQQQ"))
        ])

    snap={
      "schema_version": SCHEMA_VERSION,
      "asof": str(asof),
      "month": str(month),
      "previous_month": str(previous_month),
      "mode": "REAL_FORWARD_OOS",
      "execution": _weights(live_ticker),
      "exact_ticker": _weights(exact_ticker),
      "gods": _weights(four_gods),
      "action": {
        "changed": changed,
        "previous": alloc_text(previous_live),
        "current": alloc_text(live_ticker),
        "added": added,
        "removed": removed,
      },
      "health": [_health_color(health.get(k)) for k in ("g1_color","g2_color","p_color")],
      "risk": {str(k):str(v) for k,v in (risk or {}).items()},
      "signals": [[str(k),str(v)] for k,v in (signals or [])],
      "summary": {
        "mtd": [_pct(x) for x in summary.get("mtd",[])],
        "prev": [_pct(x) for x in summary.get("prev",[])],
        "ytd": [_pct(x) for x in summary.get("ytd",[])],
      },
      "benchmarks": {"ytd": {k:_pct(v) for k,v in (benchmarks or {}).items()}},
      "returns": rows,
      "performance": performance or {},
      "governance": {
        "production": "Frozen4F EW",
        "tenkai": "Canonical Exact KIRIN",
        "genze": "R289 Practical 10% Live",
        "dev_cutoff": "2026-07-31",
        "real_forward_oos": "2026-08 onward",
        "forward_feedback_to_dev": "PROHIBITED",
        "forward_mode": str(forward_mode),
      },
    }
    validate_snapshot(snap)
    return snap

def validate_snapshot(s):
    required=("schema_version","asof","month","execution","gods","action","health",
              "risk","signals","summary","benchmarks","returns","governance")
    missing=[k for k in required if k not in s]
    if missing: raise ValueError("snapshot missing: "+", ".join(missing))
    for key in ("execution","gods"):
        total=sum(float(v) for v in s[key].values())
        if s[key] and abs(total-100.0)>1e-6:
            raise ValueError(f"{key} total != 100: {total}")
    if len(s["health"]) != 3:
        raise ValueError("health must contain G1/G2/P")
    return True

def dumps_snapshot(s):
    validate_snapshot(s)
    return json.dumps(s, ensure_ascii=False, indent=2, sort_keys=False).encode("utf-8")
