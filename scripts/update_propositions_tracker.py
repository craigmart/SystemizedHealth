#!/usr/bin/env python3
import json
from datetime import datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CACHE_FILE = PROJECT_ROOT / "docs" / "video_pipeline_cache.json"
VPATHS_FILE = PROJECT_ROOT / "pipeline" / "public" / "video_paths.json"
PROPS_FILE = PROJECT_ROOT / "pipeline" / "public" / "propositions.json"
OUTPUT_MD = PROJECT_ROOT / "docs" / "Published_Video_Propositions.md"

def main():
    cache = json.load(open(CACHE_FILE, "r", encoding="utf-8"))
    videos = cache["videos"]
    vpaths = json.load(open(VPATHS_FILE, "r", encoding="utf-8"))
    props_data = json.load(open(PROPS_FILE, "r", encoding="utf-8"))

    # Filter published non-historic videos
    published = [v for v in videos if v.get("status") == "#published" and not (v.get("code") or "").startswith("HIST")]
    published.sort(key=lambda x: str(x.get("video_number") or "999"))

    needs_cards = [v for v in published if not v.get("cards_created")]
    done_cards = [v for v in published if v.get("cards_created")]

    lines = [
        "# 🗂️ Published Video Propositions & 3x5 Index Card Tracker",
        "",
        f"*Updated {datetime.now().strftime('%Y-%m-%d')} with authoritative Workflowy Johnny Decimal (JDex) codes.*",
        "",
        "---",
        "",
        "## 📊 Card Transcription Progress",
        "",
        f"**Status**: {len(done_cards)} Completed / {len(needs_cards)} Pending Physical 3x5 Cards",
        "",
        "| Video # | Code | Title | Primary JDex | Cards Status |",
        "| :---: | :--- | :--- | :---: | :---: |"
    ]

    for v in published:
        num = v.get("video_number", "—")
        code = v.get("code", "")
        title = v.get("title", "")[:45]
        jdex = v.get("jdex_code") or "—"
        status = "✅ Done" if v.get("cards_created") else "⬜ **Pending**"
        lines.append(f"| **{num}** | `{code}` | {title} | `{jdex}` | {status} |")

    lines.append("\n---\n")
    lines.append("## 🗃️ Pending 3x5 Cards by Video (Refined Clinical Propositions)\n")

    for v in needs_cards:
        code = v.get("code", "")
        num = v.get("video_number", "—")
        title = v.get("title", "")
        jdex = v.get("jdex_code") or "—"
        p = vpaths.get(code, "")

        lines.append(f"### ⬜ [{code}] {title} (Video #{num})")
        lines.append(f"*Primary JDex Category*: `{jdex}` | *Obsidian Script*: `{p}`\n")

        # Get props from props_data or checklist
        props = props_data.get(code, [])
        if not props:
            chk = v.get("edit_checklist") or {}
            if isinstance(chk, str):
                try: chk = json.loads(chk)
                except: chk = {}
            props = chk.get("propositions", [])

        if not props:
            lines.append("*(No propositions mined)*\n")
        else:
            for pr in props:
                lines.append(f"- {pr}")
            lines.append("")

    with open(OUTPUT_MD, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"  ✅ Successfully generated {OUTPUT_MD} ({len(needs_cards)} pending videos)")

if __name__ == "__main__":
    main()
