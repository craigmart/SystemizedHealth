#!/usr/bin/env python3
"""
vidIQ MCP Live Server Integration for Systemized Health Workspace

Endpoint: https://mcp.vidiq.com/mcp (Model Context Protocol Streamable HTTP)

Usage Examples:
  # Keyword Research & Search Volumes
  python scripts/vidiq_sync.py --keyword "lower back pain"

  # Score Title CTR (0-100)
  python scripts/vidiq_sync.py --score-title "20,000 Patients Taught Me This One Biological Reality"

  # Find B-roll clips for shooting
  python scripts/vidiq_sync.py --broll "slouching desk posture"
"""

import sys
import os
import json
import argparse
import urllib.request
import urllib.parse
import ssl

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
MCP_ENDPOINT = "https://mcp.vidiq.com/mcp"

def load_config():
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def call_mcp_tool(tool_name, arguments, api_key):
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json, text/event-stream",
        "Content-Type": "application/json"
    }

    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        }
    }

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    req = urllib.request.Request(MCP_ENDPOINT, data=json.dumps(payload).encode('utf-8'), headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, context=ctx) as resp:
            lines = resp.read().decode('utf-8').split('\n')
            for line in lines:
                if line.startswith("data:"):
                    raw = json.loads(line[5:].strip())
                    res = raw.get("result", {})
                    if res.get("isError"):
                        print("vidIQ MCP Error:", res, file=sys.stderr)
                        return None
                    content = res.get("content", [])
                    if content and "text" in content[0]:
                        try:
                            return json.loads(content[0]["text"])
                        except Exception:
                            return content[0]["text"]
                    return res
    except Exception as e:
        print(f"vidIQ API Request Error: {e}", file=sys.stderr)
        return None

def main():
    parser = argparse.ArgumentParser(description="Live vidIQ MCP Intelligence Engine")
    parser.add_argument("--key", default=None, help="vidIQ Bearer Token API Key")
    parser.add_argument("--keyword", default=None, help="Search keyword volume, competition, and related metrics")
    parser.add_argument("--score-title", default=None, help="Score CTR potential of a proposed YouTube title (0-100)")
    parser.add_argument("--broll", default=None, help="Find stock B-roll video clips")

    args = parser.parse_args()
    cfg = load_config()
    api_key = args.key or cfg.get("vidiq_api_key")

    if not api_key:
        print("Error: 'vidiq_api_key' not found in scripts/config.json", file=sys.stderr)
        sys.exit(1)

    if args.keyword:
        res = call_mcp_tool("vidiq_keyword_research", {"keyword": args.keyword}, api_key)
        if res:
            print(f"\n=== vidIQ Keyword Intelligence for '{args.keyword}' ===")
            seed = res.get("seedKeyword", {})
            print(f"Keyword: {seed.get('keyword')}")
            print(f"Estimated Monthly Search Volume: {seed.get('estimatedMonthlySearch'):,}")
            print(f"Competition Score (0-100): {seed.get('competition')}")
            print(f"Overall vidIQ Score: {seed.get('overall')}")
            
            rel = res.get("relatedKeywords", [])
            if rel:
                print("\nTop Related Keywords:")
                for r in rel[:5]:
                    print(f"  - {r.get('keyword')}: {r.get('estimatedMonthlySearch'):,} monthly searches | Overall: {r.get('overall')}")

    elif args.score_title:
        res = call_mcp_tool("vidiq_score_title", {"title": args.score_title, "type": "long"}, api_key)
        if res:
            score = res.get("score")
            print(f"\n=== vidIQ Title CTR Score ===")
            print(f"Title: \"{args.score_title}\"")
            print(f"CTR Score: {score} / 100")

    elif args.broll:
        res = call_mcp_tool("vidiq_generate_broll", {"query": args.broll}, api_key)
        if res:
            print(f"\n=== vidIQ B-Roll Search Results for '{args.broll}' ===")
            print(json.dumps(res, indent=2))
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
