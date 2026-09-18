# My4F Fast v3 — Streamlit fidelity pass

Display-only static frontend. Python/Streamlit remains the sole canonical research/calculation engine.

Changes from v2:
- Mobile typography reduced to Streamlit-like density.
- Horizontal scrolling intentionally allowed for wide signal/return structures instead of shrinking content.
- Donut charts now render ticker/God name + percentage inside the chart.
- Monthly return rows keep fixed columns so values do not disappear from narrow layouts.
- Snapshot schema tagged `my4f-fast-kirin-v3`; no KIRIN strategy calculation was added to JavaScript.
- Existing v2 snapshot values are preserved. Null source values remain `—` rather than being invented.

Upload all five files to the root of the existing `my4f-fast` GitHub Pages repository and overwrite the existing files.
