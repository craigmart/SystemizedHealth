# 80.10 — Operational Standards & Video Production SOP

This document outlines the operational policies, video creation workflow, data storage standards, business model, and channel architecture for **Systemized Health**.

---

## 1. Governance & Protocol Updates

- **Standard Operating Procedure**: All AI assistants, technical editors, and script tools must strictly follow the standards set in this document.
- **Editing Guidelines**: Modifications to standard operational procedures require explicit approval from Dr. Craig Anderson.
- **Continuous Calibration**: AI tools must continuously review video transcripts, field notes, and SOP documents to refine operational standards.

---

## 2. Core Philosophy & Clinical Context

Systemized Health translates 30+ years of chiropractic expertise (over 230,000 patient visits) into a clinical operating system for high-performing professionals.

- **The Problem**: Patients do not fail due to a lack of health information; they fail because they lack a clear, biological operating system to structure, sequence, and execute habits under real-world stress.
- **The Solution**: The **Systemized OS Framework**, built around three progressive levels:
  - **Level 1: Foundational Baseline (FMR)** — Fuel, Move, Rest. (Somatic hardware & metabolic baseline).
  - **Level 2: Internal Processing (TLC)** — Think, Learn, Connect. (Cognitive, neurological & spiritual processing).
  - **Level 3: External Execution (POP)** — Play, Organize, Purpose. (High-level goals & physical performance).

---

## 3. Standard Production Syntax (The 80 Block)

All content blueprints, local media assets, and external integrations adhere strictly to the centralized 80 Johnny Decimal framework. This architectural system expands dynamically around clinical concepts rather than rigid calendar timelines.

- **80.05**: [External Resources & Systems Catalog](file:///Users/craiganderson/Library/Mobile%20Documents/com~apple~CloudDocs/SystemizedHealth/SOPs/External%20Resources.md)
- **80.10**: Operations & Business Standards
- **80.V0**: [Systemized Health Operating System (OS)](file:///Users/craiganderson/Library/Mobile%20Documents/com~apple~CloudDocs/SystemizedHealth/SOPs/Systemized%20OS%20Framework.md)
- **Standard Taxonomic Notation**: `80.V[Hierarchy]` (denotes core video assets within the pipeline)

**Structural Application Examples**: `80.V1` represents the foundational long-form clinical narrative. `80.V1A` indicates a strategic conceptual branch developed directly from the parent video. `80.V1A1` identifies a micro-content short extracted directly from that secondary asset.

### Unified Video Script Architecture
Every video—regardless of whether it is a long-form video or a short-form video—is managed within a single unified Markdown file located in `Obsidian_Vault/Zettlekasten/`.
- **Flat Directory**: No nested folders. All scripts live alongside other Zettelkasten notes.
- **Naming Format**: `[Code] Script - [Title].md`
  - *Example Long Video*: `80.V0A1 Script - Systemized OS Framework.md`
  - *Example Short Video*: `80.V0A1-S3 Script - The 3-Tier Health Pyramid.md`
- **Single Source of Truth File**: The raw audio transcription, hooks, teleprompter script, and final propositions are all contained within this single Markdown file, separated by clear headers.

---

## 4. Production Workflow Phases

Content creation moves through three distinct phases:

### Phase I: The Raw Input (Dr. Anderson)
- **Audio Brainstorming**: Dr. Anderson records raw, conversational audio notes using a voice recorder or phone app.
- **Transcription**: The audio is transcribed and appended to the bottom of the main `[Code] Script - [Title].md` file under a `## Raw Audio Draft Transcript (Reference)` header.

### Phase II: The Editorial Filters (AI Technical Editor / Gemini)
The Technical Editor reviews the raw audio transcript against three core SOP documents:
1. **[Writing Guidance SOP](file:///Users/craiganderson/Library/Mobile%20Documents/com~apple~CloudDocs/SystemizedHealth/SOPs/Writing%20Guidance.md)**: Structure, engagement hooks, and pacing.
2. **[Writing Voice SOP](file:///Users/craiganderson/Library/Mobile%20Documents/com~apple~CloudDocs/SystemizedHealth/SOPs/Writing%20Voice.md)**: Spoken register, clinical tone, and rhythm.
3. **[Systemized OS Framework SOP](file:///Users/craiganderson/Library/Mobile%20Documents/com~apple~CloudDocs/SystemizedHealth/SOPs/Systemized%20OS%20Framework.md)**: Alignment with Level 1 (FMR), Level 2 (TLC), or Level 3 (POP).

### Phase III: The Final Script & Production
- **Script Outline Generation**: The Technical Editor drafts the polished teleprompter script directly into the main `.md` file.
- **Filming Dashboard Sync**: Script snippets are pushed to the `_Filming_Dashboard.md` in Obsidian for mobile access on set.
- **On-Camera Recording**: Dr. Anderson records on camera using the outline/teleprompter script.
- **Post-Filming Cleanup**: Once filming is complete (status `#edit` or beyond), the file is cleaned using `scripts/clean_video_script.py`, which strips out redundant YAML tags and brainstorming headers, leaving only the Final Transcript, extracted JDex Propositions, and the Changelog.

---

## 5. Script & Formatting Specifications

### Content Rules
- **No Medical Jargon**: Translate clinical terms into clear, biological analogies (e.g., *sensory motor amnesia* -> *your brain forgetting how to fire a muscle*).
- **No Influencer Fluff**: Avoid hype, fake excitement, dramatic intro animations, or generic fitness advice.
- **No Emoji Icons**: Emojis and icons are strictly prohibited across all script files, Workflowy nodes, and SOPs.

---

## 6. Short Video Workflow (Pre-Recording Outline -> Teleprompter Script)

Short vertical videos (9:16) follow a 2-stage creation workflow:

### Stage 1: Pre-Recording Outline (Before Audio Riffing)
Before Dr. Anderson records his free-form audio draft, the Technical Editor generates a minimal, highly practical Pre-Recording Outline containing ONLY:
1. **Hook**: Word-for-word conversational hook.
2. **Talking Points**: Structured bullet points for audio draft riffing (including casual research citations with PubMed links).
3. **CTA**: Invitation to the free Systemized Discovery Call & Systemized OS App.

*No premature full teleprompter scripts, stage headers, emojis, or unnecessary sections are included at this stage.*

### Stage 2: Full Teleprompter Script Generation (After Audio Riffing)
After Dr. Anderson records and provides his raw audio draft transcript (`-A` file):
1. The Technical Editor organizes the transcribed audio into a full teleprompter-ready script formatted for Workflowy and filming, placed under the `Shots` container node.
2. **Workflowy Stage Progression Tagging**: Script nodes use standard pipeline stage hashtags (`#write` -> `#film` -> `#edit` -> `#upload` / `#approve` -> `#publish`). When ready to film, nodes are tagged `#film`.
3. **Clip Sub-Code Standard (`[VideoCode]>[ClipNumber]`)**: Every clip block MUST have a clip sub-code header without the word "Clip" (e.g., `### 80.V0A-S1>1 — The Hook #film #insidetruck`). Omitting the word "Clip" preserves mobile screen real estate in Workflowy. Dr. Anderson saves each recorded video clip with this exact sub-code (e.g. `80.V0A-S1>1.mp4`, `80.V0A-S1>2.mp4`) so sorting the folder automatically arranges the clips in correct assembly order.
4. **Single Script Paragraph per Clip**: The spoken script under each clip header MUST be formatted as a single consolidated paragraph (rather than separate sentence bullets) to prevent Workflowy bullet reordering and keep exact reading sequence intact.
5. **Single JDex Code Rule**: The JDex topic code (e.g. `41.03`, `80.V0`, `77.02`, `42.06`) is declared once in the video metadata at the top of the file. Do NOT repeat JDex codes at the end of every teleprompter line.
6. **Filming Location Tags & Performance Cues**: Include stage tags (`#film`) alongside location hashtags (`#insidetruck`, `#outside`, `#cuttinggrass`, `#whilebusy`, `#driving`, `#shopping`) in clip headers. Insert bracketed delivery cues (`[breath]`, `[pause]`, `[gesture]`, `[tone shift]`, `[eye contact shift]`) inside the script paragraph to guide natural spoken cadence and breathing on camera.
7. **Workflowy Mobile Real Estate Standard**: Omit note fields on Workflowy nodes (e.g., source file notes or instructions) to preserve mobile screen real estate and maximize readable text area.




---

## 7. Data Storage & Local Redundancy Standards

Archive all high-definition 4K files locally on Direct-Attached Storage (DAS) and Network-Attached Storage (NAS) RAID 5/6 arrays. Maintain an offsite cold copy for backup.

---

## 8. Marketing & Business Plan

- **Discovery (Shorts)**: High-value biological checks directing viewers to long-form content.
- **Nurture (Long Form)**: Building credibility around the Systemized OS.
- **Conversion (Discovery Call)**: Free 20-minute consultation scheduled via TidyCal.

---

## 9. Channel Architecture & Metadata Standards

All channel content is organized into five core playlists:
1. **Start Here: The Systemized OS Installation**
2. **Level 1: Foundational (FMR)**
3. **Level 2: Internal (TLC)**
4. **Level 3: External (POP)**
5. **The Clinical Lab (Deep Dives)**
