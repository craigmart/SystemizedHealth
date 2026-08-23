import os
import json
import re

def generate_paths():
    vault_dir = "Obsidian_Vault/Zettlekasten"
    output_file = "pipeline/public/video_paths.json"
    paths = {}

    for root, dirs, files in os.walk(vault_dir):
        for f in files:
            if f.endswith(".md"):
                match = re.search(r'^(80\.[A-Z0-9\-]+)', f)
                if not match:
                    match = re.search(r'^(HIST\.[A-Z0-9\-]+)', f)
                
                if match:
                    code = match.group(1)
                    if "Script" in f or "Polish and B-Roll" in f or "Checklist" in f:
                        rel_path = os.path.join(root, f).replace("Obsidian_Vault/", "")
                        if code not in paths or "Script" in f:
                            paths[code] = rel_path

    with open(output_file, "w") as f:
        json.dump(paths, f, indent=2)

    print(f"  ✅  Generated {len(paths)} local file paths → {output_file}")

if __name__ == "__main__":
    generate_paths()
