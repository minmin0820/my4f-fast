# My4F Fast Prototype

Static-first proof of concept for the KIRIN operational page.

## Why it is fast
The browser loads HTML/CSS/JS once. UI interactions do not rerun the Python research engine. Data is read from a small `kirin_snapshot.json` file.

## Local preview
From this directory:

    python -m http.server 8000

Then open http://localhost:8000

## Production migration
1. Keep existing `app.py` and `research_archive.py` as the research engine / reference implementation.
2. Add an exporter that writes the current frozen KIRIN snapshot to JSON after data refresh.
3. Serve this frontend as a static site (Render/Vercel/Cloudflare Pages are all suitable patterns).
4. Later replace the JSON file with a small API/DB only if needed.

The included JSON is a UI demonstration snapshot, not a replacement for the canonical live calculations.
