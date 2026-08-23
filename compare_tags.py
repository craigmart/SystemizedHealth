import json
import re
import glob

with open("docs/video_pipeline_cache.json") as f:
    cache = json.load(f)

videos = cache.get("videos", cache) if isinstance(cache, dict) else cache
db_status = {v["code"]: v["status"] for v in videos}

changed = []

for filepath in glob.glob("Obsidian_Vault/Zettlekasten/*.md"):
    with open(filepath) as f:
        content = f.read()
    
    yaml_match = re.search(r'^(---.*?---)', content, flags=re.MULTILINE | re.DOTALL)
    if not yaml_match:
        continue
    
    yaml_content = yaml_match.group(1)
    
    code_match = re.search(r'aliases:\n\s+- "(.*?)"', yaml_content)
    if not code_match:
        continue
    code = code_match.group(1)
    
    tags_match = re.search(r'tags:\n(.*?)(?=\n[a-z_]+:|\n---|$)', yaml_content, flags=re.DOTALL)
    if not tags_match:
        continue
    tags_str = tags_match.group(1)
    
    status = None
    if "#published" in tags_str: status = "#published"
    elif "#publish" in tags_str: status = "#published"
    elif "#edit" in tags_str: status = "#edit"
    elif "#film" in tags_str: status = "#film"
    elif "#write" in tags_str: status = "#write"
    
    if status and code in db_status and db_status[code] != status:
        changed.append((code, db_status[code], status))

for c in changed:
    print(f"{c[0]}: DB has {c[1]}, File has {c[2]}")
