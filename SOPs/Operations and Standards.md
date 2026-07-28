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
- **80.11**: [Systemized Health Operating System (OS)](file:///Users/craiganderson/Library/Mobile%20Documents/com~apple~CloudDocs/SystemizedHealth/SOPs/Systemized%20OS%20Framework.md)
- **Standard Taxonomic Notation**: `80.V[Hierarchy]` (denotes core video assets within the pipeline)

**Structural Application Examples**: `80.V1` represents the foundational long-form clinical narrative. `80.V1A` indicates a strategic conceptual branch developed directly from the parent video. `80.V1A1` identifies a micro-content short extracted directly from that secondary asset.

### Dedicated Video Folder Structure (001 - 099)
Every video—regardless of whether it is a long-form video or a short-form video—gets its own dedicated top-level directory directly under `Videos/`.
- **Sequential Creation Order**: Folders are numbered strictly in creation order using 3-digit prefixes (`001`, `002`, `003`, ..., `099`).
- **No Nested Scripts**: Short-form video scripts and assets are NOT nested inside long-form video folders. Each video has its own isolated folder.
- **Johnny Decimal Grouping**: The Johnny Decimal taxonomy code (e.g., `80.V0A`, `80.V0A1-S3`) is included in the folder name and file names so they group together seamlessly in the card system.
- **Folder Naming Format**: `Videos/[###] - [Title] ([Code])/`
  - *Example Long Video*: `Videos/004 - Systemized OS (80.V0A1)/`
  - *Example Short Video*: `Videos/016 - The 3-Tier Health Pyramid (80.V0A1-S3)/`

### Video Asset File Naming Standard (-A, -B, -C)
Inside each video's dedicated directory, files follow the 3-stage suffix convention:
- **`V[Code]-A [Name]`**: **Raw Brainstorming Audio Transcript** (Transcript of Dr. Anderson's raw audio dictation/brainstorm).
- **`V[Code]-B [Name]`**: **Pre-Recording Outline / Script** (Editorial outline or script blueprint written by Technical Editor).
- **`V[Code]-C [Name]`**: **A-Roll Recording Transcript** (Gold standard transcript of what Dr. Anderson recorded on camera).
- **`V[Code]-S# Script - [Name].md`**: **Short Script File** (Markdown pre-recording outline or teleprompter script for short-form content).

---

## 4. Production Workflow Phases

Content creation moves through three distinct phases:

### Phase I: The Raw Input (Dr. Anderson)
- **Audio Brainstorming (`-A` files)**: Dr. Anderson records raw, conversational audio notes using a voice recorder or phone app while driving, walking, or between clinical patient visits.
- **Transcription**: The audio is transcribed directly into `V[Code]-A Raw Audio Transcript.txt` inside the video directory.

### Phase II: The Editorial Filters (AI Technical Editor / Gemini)
The Technical Editor reviews the raw audio transcript against three core SOP documents:
1. **[Writing Guidance SOP](file:///Users/craiganderson/Library/Mobile%20Documents/com~apple~CloudDocs/SystemizedHealth/SOPs/Writing%20Guidance.md)**: Structure, engagement hooks, and pacing.
2. **[Writing Voice SOP](file:///Users/craiganderson/Library/Mobile%20Documents/com~apple~CloudDocs/SystemizedHealth/SOPs/Writing%20Voice.md)**: Spoken register, clinical tone, and rhythm.
3. **[Systemized OS Framework SOP](file:///Users/craiganderson/Library/Mobile%20Documents/com~apple~CloudDocs/SystemizedHealth/SOPs/Systemized%20OS%20Framework.md)**: Alignment with Level 1 (FMR), Level 2 (TLC), or Level 3 (POP).

### Phase III: The Final Script & Production (`-B` & `-C` files)
- **Script Outline Generation (`-B` file)**: The Technical Editor drafts the polished outline or teleprompter script and saves it to `V[Code]-B Script Outline.txt` or `V[Code]-S# Script - [Name].md`.
- **Workflowy Sync**: Outlines are pushed to Workflowy for mobile access on set.
- **On-Camera Recording**: Dr. Anderson records on camera using the outline/teleprompter script.
- **Final Transcript (`-C` file)**: The final A-roll recording is transcribed into `V[Code]-C Draft Transcript.txt` to lock in the final version.

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
1. The Technical Editor organizes the transcribed audio into a full teleprompter-ready script formatted for Workflowy and filming.
2. **Clip Sub-Code Standard (`[VideoCode]>[ClipNumber]`)**: Every paragraph/proposition block MUST have a clip sub-code header (e.g., `### Clip 80.V0A-S1>1 — The Hook #insidetruck`, `### Clip 80.V0A-S1>2 — The Unpack #insidetruck`). Dr. Anderson saves each recorded video clip with this exact sub-code (e.g. `80.V0A-S1>1.mp4`, `80.V0A-S1>2.mp4`) so sorting the folder automatically arranges the clips in correct assembly order.
3. **Single JDex Code Rule**: The JDex topic code (e.g. `41.03`, `80.11`, `77.02`, `42.06`) is declared once in the video metadata at the top of the file. Do NOT repeat JDex codes at the end of every teleprompter line.
4. **Location Tags & Performance Cues**: Location hashtags (`#insidetruck`, `#outside`, `#cuttinggrass`, `#whilebusy`, `#driving`, `#shopping`) are placed in the clip sub-code headers. Delivery cues (`[pause]`, `[gesture]`, `[tone shift]`, `[eye contact shift]`) guide natural spoken performance.


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
