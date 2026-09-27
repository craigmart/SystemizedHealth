import re

with open("scripts/clean_video_script.py", "r") as f:
    code = f.read()

# Replace header_match logic
old_header = r'''    header_match = re.search(r"\(---.*?---.*?\n# .*?\n.*?\*\*JDex Topic Code\*\*:[^\n]+\n\)", content, flags=re.DOTALL)
    if not header_match:
        print(f"Skipping {file_path.name} - could not parse header.")
        return False
        
    header_block = header_match.group(1).strip()
    
    # Clean up YAML tags
    yaml_match = re.search(r'\^---\(.*?\)---', header_block, re.MULTILINE | re.DOTALL)'''

# Wait, let's just write the whole function `process_file`
