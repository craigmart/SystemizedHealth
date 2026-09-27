import re

with open("scripts/clean_video_script.py", "r") as f:
    content = f.read()

new_process_file = """def process_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    # We want to keep: YAML
    yaml_match = re.search(r'^(---.*?---)', content, flags=re.MULTILINE | re.DOTALL)
    if not yaml_match:
        print(f"Skipping {file_path.name} - could not parse YAML header.")
        return False
        
    yaml_content = yaml_match.group(1)
    
    tags_block = re.search(r'(tags:.*?)(?=\\n[a-z_]+:|\\n---|$)', yaml_content, flags=re.DOTALL)
    if tags_block:
        tags_str = tags_block.group(1)
        new_tags = "tags:\\n  - \\"#video\\"\\n"
        if "published" in tags_str.lower(): new_tags += "  - \\"#published\\"\\n"
        elif "uploaded" in tags_str.lower(): new_tags += "  - \\"#uploaded\\"\\n"
        elif "edit" in tags_str.lower(): new_tags += "  - \\"#edit\\"\\n"
        
        yaml_content = yaml_content.replace(tags_str, new_tags)
    
    header_block = yaml_content
    
    # Extract script content
    s3_match = re.search(r"## 3\\. Full Script[^\\n]*\\n(.*?)(?:## 4\\.|## 5\\.|## Propositions|## Changelog|## Raw Audio|$)", content, flags=re.DOTALL)
    
    if not s3_match:
        # Fallback to finding Final Transcript if already partially cleaned
        s3_match = re.search(r"## Final Transcript[^\\n]*\\n(.*?)(?:## Propositions|## Changelog|$)", content, flags=re.DOTALL)
        if not s3_match:
            print(f"Skipping {file_path.name} - could not find Section 3 or Final Transcript.")
            return False
            
    raw_script = s3_match.group(1)
    clean_script = clean_transcript(raw_script)
    
    print(f"Processing {file_path.name}...")
    propositions = extract_propositions(clean_script)
    
    changelog_match = re.search(r"## Changelog\\n(.*)", content, flags=re.DOTALL)
    changelog = changelog_match.group(1).strip() if changelog_match else ""
    
    new_content = f"{header_block}\\n\\n## Final Transcript\\n\\n{clean_script}\\n\\n## Propositions\\n\\n{propositions}\\n"
    if changelog:
        new_content += f"\\n## Changelog\\n\\n{changelog}\\n"
    else:
        new_content += f"\\n## Changelog\\n\\n- [{datetime.now().strftime('%Y-%m-%d')}] Script cleaned and propositions extracted.\\n"
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
        
    return True
"""

content = re.sub(r'def process_file\(file_path\):.*?return True', new_process_file, content, flags=re.DOTALL)

with open("scripts/clean_video_script.py", "w") as f:
    f.write(content)
