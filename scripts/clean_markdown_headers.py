import os
import re
from pathlib import Path

VIDEOS_DIR = Path("Obsidian_Vault/Zettlekasten")

def clean_headers():
    count = 0
    for file in VIDEOS_DIR.iterdir():
        if file.is_file() and file.name.endswith(".md"):
            with open(file, "r", encoding="utf-8") as f:
                lines = f.readlines()

            # Find the end of YAML frontmatter
            in_yaml = False
            yaml_end_idx = -1
            for i, line in enumerate(lines):
                if i == 0 and line.startswith("---"):
                    in_yaml = True
                elif i > 0 and in_yaml and line.startswith("---"):
                    in_yaml = False
                    yaml_end_idx = i
                    break

            if yaml_end_idx == -1:
                continue

            new_lines = lines[:yaml_end_idx + 1]
            
            in_header_area = True
            for line in lines[yaml_end_idx + 1:]:
                # If we encounter a heading or another separator, we are done with the header area
                if in_header_area and (line.startswith("## ") or line.startswith("---") or line.startswith("# ")):
                    in_header_area = False
                
                if in_header_area and line.startswith("**"):
                    if line.startswith("**YouTube ID**") or line.startswith("**Views**") or line.startswith("**Parent Video**"):
                        new_lines.append(line)
                    else:
                        # Skip
                        pass
                else:
                    new_lines.append(line)

            new_content = "".join(new_lines)
            new_content = re.sub(r'\n{3,}', '\n\n', new_content)
            
            with open(file, "r", encoding="utf-8") as f:
                old_content = f.read()

            if new_content != old_content:
                with open(file, "w", encoding="utf-8") as f:
                    f.write(new_content)
                count += 1
                        
    print(f"Updated {count} files.")

if __name__ == "__main__":
    clean_headers()
