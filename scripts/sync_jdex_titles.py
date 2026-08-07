import os
import re
from pathlib import Path

def process_jdex_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Find the H1 header like `# 81.05 Lifestyle Management`
    # We want to extract the JDEX code and the description
    header_match = re.search(r"^#\s+([\w\.-]+)\s+(.+)$", content, flags=re.MULTILINE)
    
    if header_match:
        code = header_match.group(1)
        description = header_match.group(2).strip()
        
        # Determine where the header ends
        header_end_idx = header_match.end()
        
        # Check if the description is already on the next non-empty line
        lines_after = content[header_end_idx:].split("\n")
        
        next_non_empty_line = None
        for line in lines_after:
            if line.strip():
                next_non_empty_line = line.strip()
                break
                
        if next_non_empty_line != description:
            # We need to insert the description right below the header
            new_content = content[:header_end_idx] + f"\n{description}\n" + content[header_end_idx:]
            
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            return True
            
    return False

def main():
    jdex_dir = Path(__file__).parent.parent / "Obsidian_Vault" / "JDex"
    
    count = 0
    if jdex_dir.exists():
        for file in jdex_dir.glob("*.md"):
            if process_jdex_file(file):
                count += 1
                
    print(f"✅ Synced descriptions for {count} JDex files.")

if __name__ == "__main__":
    main()
