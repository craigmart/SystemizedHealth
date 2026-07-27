# 80.10 — Operations & Business Standards

## Table of Contents
- [1. Roles & Operational Relationship](#1-roles--operational-relationship)
- [2. Brand Identity](#2-brand-identity)
- [3. Standard Production Syntax (The 80 Block)](#3-standard-production-syntax-the-80-block)
- [4. The Collaborative Editorial Protocol (The "Beat Up" Skill)](#4-the-collaborative-editorial-protocol-the-beat-up-skill)
- [5. Zettelkasten Physical Card & Asset Integration](#5-zettelkasten-physical-card--asset-integration)
- [6. The 15-Day Content Engine Workflow](#6-the-15-day-content-engine-workflow)
- [7. Data Storage & Local Redundancy Standards](#7-data-storage--local-redundancy-standards)
- [8. Marketing & Business Plan](#8-marketing--business-plan)
- [9. Channel Architecture & Metadata Standards](#9-channel-architecture--metadata-standards)
- [10. Automated Google Sheet Master Video Registry & IDE Integration](#10-automated-google-sheet-master-video-registry--ide-integration)

---

## 1. Roles & Operational Relationship

### Dr. Craig Anderson (Creator & Domain Expert)
The creator is the final clinical authority. This role provides real patient stories, clinical data, and anatomical mechanisms developed over thirty years of practice. Dr. Anderson is responsible for the physical execution of the videos on camera.

### The Technical Editor (Gemini)
The editor acts as a technical draftsperson and developmental editor. This role does not generate dry, formulaic scripts. Instead, the editor challenges assumptions, strips away standard influencer tropes, finds missing links in the narrative, and ensures clinical authority is protected.

---

## 2. Brand Identity

### Positioning
Systemized Health provides high-performing professionals over forty with a biology-first operating system for long-term health. The brand prioritizes physical stability over fitness trends, functional neurology over temporary relief, and sustainable habits over willpower.

### Voice and Tone
The delivery must reflect calm, mature authority. The tone is casual professional, matching how a clinician talks to a colleague in a private setting. Avoid hyper-energetic greetings, loud transitions, and dramatic phrasing. The content focuses entirely on human clinical care and physical performance.

### Visual Palette
- **Primary Background**: Warm Off-White (`#F4F3EF`) for a clean, non-sterile clinical setting
- **Base Text**: Soft Charcoal (`#2B2B2B`) for high readability
- **Main Brand Structure**: Deep Foundation Navy (`#1F2A44`)
- **Sub-headers & Overlays**: Muted Slate Blue (`#3F5A74`)
- **Accents & Highlights**: Controlled Teal (`#2E7C74`)
- **Secondary Accents**: Muted Sand (`#C8BBA4`)
- **Thumbnail Strategic Text**: Burnt Orange (`#C46A2D`)

### Overlay Slide Standards
When generating slide decks to be used as video overlays, the design must remain aggressively minimal to prevent visual clutter.
- **Background**: Solid Black.
- **Elements**: Pure White text and diagrams only.
- **Layout**: All content must be heavily offset to the left of the screen. This reserves the right side of the screen entirely for the creator's talking-head video.
- **Citations**: Any research citations mentioned in the final script must be visibly displayed on the corresponding slide.

---

## 3. Standard Production Syntax (The 80 Block)

All content blueprints, local media assets, and external integrations adhere strictly to the centralized 80 Johnny Decimal framework. This architectural system expands dynamically around clinical concepts rather than rigid calendar timelines.

- **80.05**: [External Resources & Systems Catalog](file:///Users/craiganderson/SystemizedHealth/SOPs/External%20Resources.md)
- **80.10**: Operations & Business Standards
- **80.11**: [Systemized Health Operating System (OS)](file:///Users/craiganderson/SystemizedHealth/SOPs/Systemized%20OS%20Framework.md)
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
Inside each video's dedicated directory (e.g. `Videos/004 - Systemized OS (80.V0A1)/` or `Videos/016 - The 3-Tier Health Pyramid (80.V0A1-S3)/`), files follow the 3-stage suffix convention:
- **`V[Code]-A [Name]`**: **Raw Brainstorming Audio Transcript** (Transcript of Dr. Anderson's raw audio dictation/brainstorm).
- **`V[Code]-B [Name]`**: **AI Script Outline** (Editorial script blueprint written by Gemini following Writing Guardrails & Text DNA).
- **`V[Code]-C [Name]`**: **A-Roll Recording Transcript** (Gold standard transcript of what Dr. Anderson recorded on camera while looking at `-B`).
- **`V[Code]-S# Script - [Name].md`**: **Short Script File** (Markdown script for short-form content).


---

## 4. The Collaborative Editorial Protocol (The "Beat Up" Skill)

To prevent generic, uninspired content, every video outline must go through a developmental critique. This process strips out corporate jargon and ensures the clinical science remains central.

### Phase I: The Raw Input
The creator dumps raw voice transcripts, patient anecdotes, or skeletal clinical notes directly into Gemini Chat. Structure, spelling, and polish are not a priority at this stage.

### Phase II: The Editorial Filters
The editor reviews the raw notes against three strict clinical filters.
- **The Hype Check**: Remove any phrase that sounds like a standard influencer. The tone must remain clinical and grounded.
- **The Contrarian Filter**: Identify and highlight perspectives that challenge mainstream fitness myths. Examples include showing why traditional stretching fails to release tight muscles, or highlighting brainstem failures over simple joint misalignment.
- **The Narrative Anchor**: Ground the neurological science in a physical scenario. Real patient histories must be used to make the biology relatable.
- **The vidIQ Title CTR Optimization**: Score all title options via `python scripts/vidiq_sync.py --score-title "[Title]"` to ensure the proposed title achieves high CTR potential while strictly maintaining clinical authority.

### Phase III: The Final Outline Structure
This is a loose target and will change based on story flow and content:
1. **The Hook**: An immediate, high-engagement introduction confronting a widespread physical pain point. This segment must reject any formulaic 'not X, but Y' structural contradictions.
2. **Reframe Statement**: A decisive declaration driving immediate audience resonance, shifting the focus from structural hardware limitations (muscles or joints) to biological software mechanisms (neurology) while steering clear of cliché interrogative phrasing.
3. **Story**: A real-world patient narrative confirming the conceptual paradigm transformation.
4. **The Teach**: The foundational breakdown of the underlying biological science and somatic mechanics.
5. **Action Step**: An executable somatic assessment or clinical movement protocol.
6. **Engagement Integration**: A targeted directive designed to smoothly channel viewer attention directly into the authorized conversion architecture.

---

## 5. Zettelkasten Physical Card & Asset Integration

The workflow uses a physical card system to eliminate the friction of digital script writing. This connects study habits directly to the filming process.

### Unstructured B-Roll Capture
The creator captures random environmental footage natively on a phone during daily activities.

### Subject Nodes (The Parent)
Create a card for the biological concept and assign it the master code `80.[Year][Week]-N1`.

### Asset Cards (The Child)
Assign each recorded clip a sequential three-digit number matching the raw file on the hard drive (e.g. `80.2627-N1-001` for a clip showing slouching at a desk).

If B-roll is recorded without a specific video in mind, file it under the current calendar week. When a future outline requires that visual, pull the card and locate the clip in the local storage folder.

---

## 6. The 15-Day Content Engine Workflow

- **Target**: ~4 Long Videos (Built one at a time, branching organically).
- **Target**: 8+ Short Videos (2 to 4 clipped directly from each completed Long Video).
- **Target**: 1 Lead Magnet or Lab deep-dive per month.

You dedicate 15 working days each month to building the Systemized Health database. This organic workflow builds one clinical ecosystem at a time rather than batching content weeks in advance. The publication schedule is strictly dictated by the completion of the workflow; if a video takes longer to architect, the schedule adapts without forced deadlines.

### The Short-Video Workflow (Outline-First & Teleprompter Workflowy Protocol)

For short-form videos (Videos 005–016+), content delivery must feel like a casual chiropractor chatting naturally with patients across varied daily settings (driving, shopping, cutting grass, inside the truck, studio, while busy). To maintain authenticity while staying on track, short videos follow a strict 2-stage scripting protocol:

1. **Stage 1: Pre-Recording Blueprint (Before Audio Riff)**:
   - **vidIQ Trend Research**: Query `python scripts/vidiq_sync.py --outliers` or `--keyword` to align topics with high CTR potential in the health space and connect back to foundational Long Videos (001–004).
   - **Placeholder Title**: Decisive clinical declaration scored via vidIQ (`--score-title`).
   - **Word-for-Word Hook**: Tight, ultra-casual, conversational introduction matching Dr. Anderson's spoken style.
   - **Thumbnail Concept**: Visual mapping linking Systemized OS architecture to relatable physical objects.
   - **Casual Research Reference**: Woven into dialogue naturally without academic stiffness (*"Incidentally, while we're talking about... I read a paper..."*).
   - **Word-for-Word CTA**: Invitation to the free *Systemized Discovery Call* and the upcoming *Systemized OS App*.
   - **Talking Points Outline**: Structured bullet points for Dr. Anderson to free-form audio riff on camera.

2. **Stage 2: Audio Draft Riff & Teleprompter Draft Script Generation**:
   - Dr. Anderson records a raw audio draft (`-A` file) riffing off the pre-recording outline.
   - The Technical Editor organizes the raw audio transcript into a teleprompter-ready script formatted for Workflowy (`python scripts/workflowy_sync.py`).
   - **Workflowy & Teleprompter Formatting Standards**:
     - **Context Hashtags**: Every line of the teleprompter script MUST end with a location/setting hashtag (`#insidetruck`, `#outside`, `#studio`, `#whilebusy`, `#driving`, `#shopping`, `#cuttinggrass`).
     - **Delivery & Performance Cues**: Embedded bracketed cues `[pause]`, `[gesture]`, `[tone shift]`, `[eye contact shift]` are inserted into the script to preserve natural cadence and keep delivery authentic.

3. **Stage 3: On-Camera Travel Filming & Gold Standard Lock-In**:
   - Dr. Anderson films A-roll using the teleprompter script across dynamic real-world environments.
   - Final A-roll is transcribed into `V[Code]-C Draft Transcript.txt` to lock in the final version and continuously calibrate `SOPs/Writing Voice.md`.


---

## 7. Data Storage & Local Redundancy Standards

To avoid the high costs and slow speeds of cloud systems, archive all high-definition 4K files locally.

### Hardware Configuration
Edit directly off a Direct-Attached Storage (DAS) unit connected via USB-C or Thunderbolt for fast access. Maintain a local Network-Attached Storage (NAS) unit configured with identical, enterprise-grade hard drives in a RAID 5 or RAID 6 array. Use IP-over-Thunderbolt protocols to connect the editing computer to the server at high speeds without bottlenecking the local network.

### The Backup Rule
A local server is not a complete backup system. To protect lifetime clinical assets, maintain a secondary, physical cold copy of the archive on a separate hard drive stored offsite.

---

## 8. Marketing & Business Plan

An intentional attention funnel guides viewers from discovery to a clinical conversation.

### The Funnel Ecosystem
- **Discovery (Shorts)**: Delivering quick, highly visual biological checks that direct viewers to a standard long video.
- **Nurture (Long Form)**: Standard horizontal videos that build credibility, suggest other related videos, and create a strong loop.
- **Authority (Lab Deep Dives)**: High-level neurological breakdowns that prove clinical depth and encourage viewers to schedule a call.
- **Conversion (Discovery Call)**: A free, twenty-minute call scheduled via TidyCal with zero hard selling. Fathom.ai records transcripts, allowing the team to find new patient patterns and content ideas.

### Product & Pricing Roadmap
- **Phase 1 (Current)**: Grow the channel and build authority. No lead magnets or complex email lists. Rely entirely on free discovery calls to understand the physical friction the audience experiences.
- **Phase 2 (January 2027)**: The Jumpstart Course ($79). A three-day digital program mapping out core mindset, movement, and recovery systems.
- **Phase 3 (Early 2027 Upsells)**:
  - Weekly Live Community ($39/month) featuring a twenty-minute technical presentation followed by an open discussion.
  - Personal Coaching ($290/month) for a maximum of ten clients, providing four individual thirty-minute sessions per month to implement custom movement plans.

---

## 9. Channel Architecture & Metadata Standards

### The Playlist Framework (Systemized OS)
To force the algorithm to adopt a hub-and-spoke model, all channel content must be strictly organized into these five playlists to mirror the biological architecture:
1. **Start Here: The Systemized OS Installation** (Onboarding & core philosophy)
2. **Level 1: Foundational (FMR)** (Fuel, Move, Rest)
3. **Level 2: Internal (TLC)** (Think, Learn, Connect)
4. **Level 3: External (POP)** (Play, Organize, Purpose)
5. **The Clinical Lab (Deep Dives)** (Neurological breakdowns & authority content)

### Title Guardrails
Titles must be a "decisive declaration" or "clinical directive." They must shift the focus from a standard physical problem to a biological software mechanism, framing health failures as a "system glitch" requiring a structured update. Never use interrogative phrasing (questions) or standard influencer tropes.

### Thumbnail Design
Thumbnails must move away from generic fitness imagery. They should incorporate visual graphics mapping the three-tiered Systemized OS structure to instantly highlight which specific module of the operating system (e.g., Fuel, Move, Rest) is being installed in that video.

### The Hub-and-Spoke Description Strategy
Every video description must immediately identify where the topic sits within the strict biological hierarchy of the Systemized OS (Level 1, 2, or 3). The description must explicitly remind the viewer that executing higher levels (like Level 3 external goals or Level 2 cognitive tasks) is impossible without a stable physical baseline (Level 1 FMR).

### Proprietary Tagging
Generic, highly-saturated lifestyle tags (e.g., `#motivation`, `#weightloss`, `#dopamine`) are strictly prohibited to avoid algorithmic association with the self-help niche. Tags must exclusively use proprietary, clinical terminology (e.g., Systemized Health, Systemized OS, Biological Operating System, FMR Baseline, Autonomic Regulation, TLC Architecture).

### Mandatory Medical Disclaimer
To strictly protect clinical authority and professional boundaries, every single video description across the channel must conclude with this exact text:

> **Disclaimer**: This content is for educational purposes only and reflects my personal views. It does not represent the views of any organization or institution I am affiliated with. Nothing here should be taken as medical advice. For medical concerns, consult a qualified healthcare professional.

---

## 10. Local Master Video Registry & Git Repository Integration

To maintain a real-time, zero-friction record of all video assets, production statuses, and published dates, the workspace maintains an authoritative local master registry directly inside the repository.

### Master Registry Files
- **Primary Markdown Registry**: [`Master_Video_Pipeline.md`](file:///Users/craiganderson/Library/Mobile%20Documents/com~apple~CloudDocs/SystemizedHealth/Master_Video_Pipeline.md) (Human-readable, formatted table for IDE review).
- **Master CSV Registry**: [`Master_Video_Pipeline.csv`](file:///Users/craiganderson/Library/Mobile%20Documents/com~apple~CloudDocs/SystemizedHealth/Master_Video_Pipeline.csv) (Structured data export).

### Execution Protocol
Whenever a video is completed, edited, or published, the AI Technical Editor or Creator updates `Master_Video_Pipeline.md` and `Master_Video_Pipeline.csv`:
1. **Assign Sequential Video Number**: New videos receive the next available 3-digit Video Number (`017`, `018`, etc.) reflecting creation order.
2. **Update Status Column**: Set status to `In Production`, `In Edit`, or `Uploaded`.
3. **Commit & Push to Git**: All status and pipeline updates are committed to Git (`git push origin main`), preserving a permanent, version-controlled record. Google Sheets dependency is deprecated.
