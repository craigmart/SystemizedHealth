import json, re, os

with open("docs/video_pipeline_cache.json") as f:
    cache = json.load(f)
video_map = {v["code"]: v for v in cache["videos"]}

filepath = "Obsidian_Vault/Videos/V2A - The Physical Weight of Unprocessed Stress (80.V2A)/V2A Script - The Physical Weight of Unprocessed Stress.md"
with open(filepath) as f:
    content = f.read()

print("StartsWith ---:", content.startswith("---"))
folder_name = os.path.basename(os.path.dirname(filepath))
match = re.search(r'\(80\.([A-Z0-9\-]+)\)', folder_name)
print("Match:", match)
if match:
    code = "80." + match.group(1)
    print("Code:", code)
    print("In Map?", code in video_map)
