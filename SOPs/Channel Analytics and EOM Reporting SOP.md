# 80.07 — Channel Analytics & EOM/MTD Reporting SOP

This document defines the operating standard for tracking YouTube channel performance, executing End-of-Month (EOM) reports, generating weekly Month-to-Date (MTD) run-rate projections, and using velocity data to guide content planning.

---

## 1. Source of Truth & Architecture

Channel metrics and video analytics flow directly from the **vidIQ API** into the Systemized Health database layer:

- **Live Channel Integration**: vidIQ MCP Engine (`https://mcp.vidiq.com/mcp` via `scripts/vidiq_sync.py`) connects to YouTube Channel `Craig Anderson, D.C.` (`UCSnF1YqGqmNosGdX5JqY1gQ`).
- **Database Storage**:
  - SQLite: `database/videos.db` (`video_stats`, `channel_monthly_stats`, `eom_reports`)
  - Cloud: Supabase REST API (`video_stats`, `channel_monthly_stats`, `eom_reports`)
- **Report Outputs**: Living markdown files under `Analytics/`.

---

## 2. CLI Command Quick Reference

All analytics operations are managed via `scripts/analytics_manager.py` and `scripts/generate_analytics_reports.py`:

```bash
# 1. Generate Weekly Month-to-Date (MTD) Pace Report & EOM Projections
python3 scripts/analytics_manager.py --mtd

# 2. Pull / Finalize End-of-Month (EOM) Report for a specific month
python3 scripts/analytics_manager.py --eom 2026-07

# 3. Sync live vidIQ channel stats & historical video catalog to DB & CSV
python3 scripts/analytics_manager.py --sync-all

# 4. Refresh Daily / Timeframe Analytics Reports (48h, 7d, 28d, All-Time)
python3 scripts/generate_analytics_reports.py
```

> [!NOTE]
> `analytics_manager.py --sync-all` reconciles videos against the primary pipeline (`80.*`) using YouTube ID, normalized title, and drop date. It will never create duplicate `HIST.*` rows for videos published August 2026 or later.

---

## 3. Weekly Month-to-Date (MTD) Cadence & Pace Projections

Run `--mtd` weekly (or prior to content planning sessions) to evaluate post-launch run-rates and projected month-end outcomes.

### Pace Calculation Engine:
- **Baseline Isolation**: Isolates historical channel views (prior EOM total) from active month gains.
- **Actual MTD Gain**: `Current Total Views - Prior EOM Baseline Views`
- **Daily Pace**: `MTD Actual Gain / Days Elapsed in Current Month`
- **End-of-Month Projection**: `MTD Actual Gain + (Daily Pace * Remaining Days in Month)`

### Living Output File:
- Saved to: `Analytics/MTD_[Month]_[Year].md` (e.g., [`Analytics/MTD_August_2026.md`](file:///Users/craiganderson/Developer/SystemizedHealth/Analytics/MTD_August_2026.md))

---

## 4. End-of-Month (EOM) Reporting Cadence

Run `--eom YYYY-MM` at the end of each calendar month to seal the historical snapshot.

### Standard EOM Metrics Tracked:
1. **Executive Channel Summary**: Total Catalog Assets, Total Views, Total Subscribers, Total Likes, Total Comments, Total Watch Hours, Average CTR, Discovery Call Leads Booked.
2. **Top 5 Long Videos (All-Time & Current Month)**
3. **Top 5 Shorts (All-Time & Current Month)**
4. **Top 5 Long Video Velocity (VPH)**
5. **Top 5 Short Video Velocity (VPH)**
6. **Month-over-Month (MoM) Growth Deltas**

### Living Output File:
- Saved to: `Analytics/EOM_[Month]_[Year].md` (e.g., [`Analytics/EOM_July_2026.md`](file:///Users/craiganderson/Developer/SystemizedHealth/Analytics/EOM_July_2026.md))

---

## 5. Content Planning Intelligence (Data-Driven Filming Decisions)

Use MTD and EOM velocity rankings to make objective recording and scripting choices:

1. **High-VPH Topic Expansion**: Identify Long-form narratives with top VPH velocity and immediately schedule 3 short-form audio riffs based on those topics.
2. **Thumbnail & Title Optimization**: Benchmark 7-day and 28-day CTRs against the **> 8.0% CTR standard**. If CTR < 8.0%, run title scoring via `python3 scripts/vidiq_sync.py --score-title "<title>"`.
3. **Discovery Call Conversion Funnel**: Verify all top-performing videos maintain the standardized CTA in line 1 of the description:
   > *"Book your free 20-minute Systemized Discovery Call: call.systemizedhealth.com"*
