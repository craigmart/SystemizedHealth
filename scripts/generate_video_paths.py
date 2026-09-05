import os
import json
import re

def generate_paths():
    vault_dir = "Obsidian_Vault/Zettlekasten"
    output_file = "pipeline/public/video_paths.json"
    props_output = "pipeline/public/propositions.json"
    paths = {}
    propositions = {}

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
                    
                    if "Script" in f:
                        try:
                            with open(os.path.join(root, f), "r", encoding="utf-8") as s_file:
                                content = s_file.read()
                                p_match = re.search(r'## Propositions\s*\n(.*?)(?:\n##|\Z)', content, re.DOTALL)
                                if p_match:
                                    lines = [l.strip()[2:].strip() for l in p_match.group(1).split('\n') if l.strip().startswith('- ')]
                                    valid_props = [l for l in lines if l and not l.startswith('*(Gemini') and not l.startswith('*(Error') and not l.startswith('LLM library')]
                                    if valid_props:
                                        propositions[code] = valid_props
                        except Exception as e:
                            print(f"  ⚠️ Error reading propositions for {f}: {e}")

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(paths, f, indent=2)

    with open(props_output, "w", encoding="utf-8") as f:
        json.dump(propositions, f, indent=2)

    print(f"  ✅  Generated {len(paths)} local file paths → {output_file}")
    print(f"  ✅  Generated {len(propositions)} video proposition sets → {props_output}")

if __name__ == "__main__":
    generate_paths()

