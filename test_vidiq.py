import sys
import json
sys.path.insert(0, 'scripts')
from vidiq_sync import call_mcp_tool, load_config
cfg = load_config()
api_key = cfg.get("vidiq_api_key")
res = call_mcp_tool("vidiq_channel_videos", {"channelId": "UCSnF1YqGqmNosGdX5JqY1gQ", "videoFormat": "long", "popular": False}, api_key)
print(type(res))
if isinstance(res, list):
    for x in res[:2]: print(type(x))
else:
    print(res)
