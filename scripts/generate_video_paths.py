import os
import json
import re

vault_dir = "Obsidian_Vault/Videos"
output_file = "pipeline/public/video_paths.json"
paths = {}

for root, dirs, files in os.walk(vault_dir):
    for f in files:
        if f.endswith(".md"):
            # Try to extract the code from the folder name, e.g. "V0A - 20000 Patients (80.V0A)"
            # or from the file itself if it has the code.
            folder_name = os.path.basename(root)
            match = re.search(r'\(80\.([A-Z0-9\-]+)\)', folder_name)
            if match:
                code = "80." + match.group(1)
                # We want the main script file
                if "Script" in f or "Polish and B-Roll" in f:
                    rel_path = os.path.join(root, f).replace("Obsidian_Vault/", "")
                    paths[code] = rel_path

with open(output_file, "w") as f:
    json.dump(paths, f, indent=2)

print(f"Generated {len(paths)} paths to {output_file}")
