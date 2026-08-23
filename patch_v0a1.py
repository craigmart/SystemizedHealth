with open("Obsidian_Vault/Zettlekasten/80.V0A1 Script - Systemized OS Framework.md", "r") as f:
    text = f.read()

script_start = text.find("Most people try to get healthy and just end up exhausted.")
script_end = text.find("Scan the QR code on the screen to find a time.") + len("Scan the QR code on the screen to find a time.")

actual_script = text[script_start:script_end]

new_text = f"""---
aliases:
  - "80.V0A1"
tags:
  - "#video"
  - "#edit"
format: "Long"
drop_date: "2026-08-24"
---

## 3. Full Script (Teleprompter Ready)

{actual_script}
"""

with open("Obsidian_Vault/Zettlekasten/80.V0A1 Script - Systemized OS Framework.md", "w") as f:
    f.write(new_text)
