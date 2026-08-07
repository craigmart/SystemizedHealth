import sys
import os
import re
from pathlib import Path
sys.path.insert(0, 'scripts')
import clean_published_script

file_path = Path("Obsidian_Vault/Videos/V0B-S2 - Stop Setting Marathon Goals on Monday (Downshift for Success) (80.V0B-S2)/V0B-S2 Script - Stop Setting Marathon Goals on Monday (Downshift for Success).md")
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

match = re.search(r"## Final Transcript\n\n(.*?)\n\n## Propositions", content, flags=re.DOTALL)
if match:
    transcript = match.group(1).strip()
    print("Generating propositions...")
    propositions = clean_published_script.extract_propositions(transcript)
    new_content = re.sub(r"## Propositions\n\n.*", f"## Propositions\n\n{propositions}\n", content, flags=re.DOTALL)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("File updated!")
else:
    print("Could not find Final Transcript block.")
