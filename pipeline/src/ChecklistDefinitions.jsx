import React, { useState } from 'react';
import { 
  ChevronLeft, BookOpen, ExternalLink, Lightbulb, 
  Edit3, Film, Scissors, UploadCloud, Archive, 
  CheckCircle2, Target, HelpCircle, Layers, Sparkles,
  ArrowRight, ShieldCheck, BarChart2
} from 'lucide-react';

export const WORKFLOW_DEFINITIONS = [
  {
    phase: '#idea',
    badge: '#idea',
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.1)',
    icon: Lightbulb,
    title: '1. IDEA (#idea)',
    subtitle: 'Demand Validation, Packaging & Connected Strategy',
    items: [
      {
        key: 'idea_demand',
        label: 'Topic Demand validated',
        summary: 'Confirm viewers actually watch this topic (Revealed Preference) vs. what they say they need.',
        details: [
          'Verify view floor (median channel baseline) and ceiling (top niche outliers).',
          'Confirm search & browsing demand is actively alive today.',
          'Define where this video fits into a goal-oriented YouTube Playlist on your channel.'
        ]
      },
      {
        key: 'idea_title',
        label: 'Title Selected',
        summary: 'Lock in the working title before writing (targeting 90+ vidIQ viral score).',
        details: [
          'Borrow proven framing patterns across YouTube and understand their psychological pull.',
          'Ensure the title makes a clear, truthful promise the video will 100% fulfill.',
          'Omit episode numbers or chronological tags so new viewers are never deterred.'
        ]
      },
      {
        key: 'idea_thumb',
        label: 'Thumbnail Drafted',
        summary: 'Concept or rough out the thumbnail visual alongside the title.',
        details: [
          'Must be immediately understood in a single 1-second glance on mobile feeds.',
          'Opens a curiosity gap that leads the viewer\'s eyes straight to the title to complete the thought.'
        ]
      },
      {
        key: 'idea_connected',
        label: 'Connected video chosen',
        summary: 'Decide upfront where you are directing the viewer after this video.',
        details: [
          'Select a specific older video on your channel that serves as the natural next step.',
          'Enables a natural mid-roll mention in your script and a targeted pitch at the end for extended watch time.'
        ]
      }
    ]
  },
  {
    phase: '#write',
    badge: '#write',
    color: '#b45309',
    bg: 'rgba(180, 83, 9, 0.1)',
    icon: Edit3,
    title: '2. WRITING (#write)',
    subtitle: 'Notebook Research, Acceptance Criteria & 3×5 Card Outlining',
    items: [
      {
        key: 'prep_notebook',
        label: 'Gemini Notebook research',
        summary: 'Synthesize research, seminar transcripts, analogies, and clinical notes inside Gemini Notebook.',
        details: [
          'Review patient case studies, clinical propositions, and analogies.',
          'Refine the core conceptual anchor before touching paper.'
        ]
      },
      {
        key: 'prep_acceptance',
        label: 'Acceptance criteria',
        summary: 'Treat your title like a software program specification.',
        details: [
          'Core Question: "What must be true by the end of this video for the title to be 100% fulfilled?"',
          'Break the answer down into the smallest truthful components.',
          'These components form the non-negotiable backbone of your outline so execution never betrays viewer trust.'
        ]
      },
      {
        key: 'prep_card',
        label: '3×5 card drafted (5 beats)',
        summary: 'Distill your outline triggers onto a physical 3×5 index card as your filming anchor.',
        details: [
          'Beat 1 (The 4 Ps Hook): Promise (confirm click), Proof (why listen), Plan (roadmap), Persona (who it\'s for).',
          'Beats 2–4 (The Body): Deliver on your decomposed Acceptance Criteria as cleanly and directly as possible.',
          'Mid-roll Nod: Naturally weave in a mention of your connected video during the body.',
          'Beat 5 (Connected Video CTA): Pitch the connected video to guide viewers into a continuous watch session.'
        ]
      }
    ]
  },
  {
    phase: '#film',
    badge: '#film',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    icon: Film,
    title: '3. FILMING (#film)',
    subtitle: 'Direct-to-Camera Execution with Analog 3×5 Anchor',
    items: [
      {
        key: 'film_recorded',
        label: 'Direct-to-camera recorded',
        summary: 'Film loosely scripted, highly personal, authentic delivery using your 3×5 card.',
        details: [
          'Target length: 15–20 minutes for Longs, 40–60 seconds for Shorts.',
          'Match delivery energy, framing, and visual setup to the exact promise set by your title and thumbnail.',
          'Speak conversationally to one specific person—no teleprompter reading.'
        ]
      }
    ]
  },
  {
    phase: '#edit',
    badge: '#edit',
    color: '#7e22ce',
    bg: 'rgba(126, 34, 206, 0.1)',
    icon: Scissors,
    title: '4. EDITING (#edit)',
    subtitle: 'Transcript Ingestion, Visual Pacing & Audio Mastering',
    items: [
      {
        key: 'edit_transcript',
        label: 'Spoken transcript pasted',
        summary: 'Drop the final exact spoken transcript into the App / Descript.',
        details: [
          'Enables text-based video assembly, JDex proposition mining, and Obsidian Vault study archiving.'
        ]
      },
      {
        key: 'edit_broll',
        label: 'B-roll & pacing matched',
        summary: 'Cut dead space and layer supportive visuals and B-roll.',
        details: [
          'Calibrate visual polish to the packaging promise.',
          'If the title promises a raw, honest breakdown, avoid over-editing with heavy graphics that break doctor-patient trust.'
        ]
      },
      {
        key: 'edit_sound',
        label: 'Sound & audio enhanced',
        summary: 'Professional dialogue mastering for effortless listening.',
        details: [
          'Remove room reverb, noise floor, and harsh transients.',
          'Level and limit dialogue track to broadcast standards.'
        ]
      }
    ]
  },
  {
    phase: '#uploaded',
    badge: '#uploaded',
    color: '#0284c7',
    bg: 'rgba(2, 132, 199, 0.1)',
    icon: UploadCloud,
    title: '5. UPLOADED (#uploaded)',
    subtitle: 'Packaging, Studio Setup, End Screen & Pinned Link',
    items: [
      {
        key: 'pub_thumb',
        label: 'Custom thumbnail uploaded',
        summary: 'Upload the high-contrast thumbnail graphic.',
        details: [
          'Verify readability on mobile feeds and dark mode UI.',
          'Check that text is minimal (3 words max) and reinforces the curiosity gap.'
        ]
      },
      {
        key: 'pub_upload',
        label: 'Studio upload & End Screen',
        summary: 'Upload to YouTube Studio, assign to Playlist, and link End Screen.',
        details: [
          'Assign video to its designated goal-oriented Playlist.',
          'Configure YouTube End Screen element to link directly to your pre-chosen connected video.'
        ]
      },
      {
        key: 'pub_pinned',
        label: 'Pinned comment link',
        summary: 'Post and pin the primary next-action comment.',
        details: [
          'Write a brief curiosity hook with direct link to your connected video.',
          'YouTube UI strongly prioritizes pinned comments over video descriptions across mobile and desktop.'
        ]
      },
      {
        key: 'pub_schedule',
        label: 'Scheduled for drop date',
        summary: 'Lock in authoritative publication date and time slot in YouTube Studio.',
        details: [
          'Set status to #published or scheduled drop date in pipeline.'
        ]
      }
    ]
  },
  {
    phase: '#published',
    badge: '#published',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)',
    icon: Archive,
    title: '6. PUBLISHED (#published)',
    subtitle: 'Analog Zettelkasten Filing, Notebook Archive & Channel Audits',
    items: [
      {
        key: 'pub_cards',
        label: '3×5 main cards filed',
        summary: 'Write clinical propositions on physical 3×5 index cards and file in analog box.',
        details: [
          'Extract 1–2 sharp clinical propositions mapped to Johnny Decimal (JDex) categories.',
          'File into physical box to grow your permanent second brain.'
        ]
      },
      {
        key: 'archive_gemini_notebook',
        label: 'Save to Gemini Notebook',
        summary: 'Archive completed video transcript, title variations, and notes back into Gemini Notebook.',
        details: [
          'Maintains permanent reference context for future rotation ideation.'
        ]
      },
      {
        key: 'archive_audit_48h',
        label: '48-hr satisfaction audit',
        summary: 'Evaluate initial audience response 48 hours post-drop.',
        details: [
          'Analyze positive comment-to-view ratio, like-to-view ratio, and sub conversion.',
          'Inspect the YouTube Studio retention curve for sudden drop-offs and trim offending segments if necessary.'
        ]
      },
      {
        key: 'archive_catalog_audit',
        label: 'Catalog audit',
        summary: 'Keep channel catalog pristine and algorithm-friendly.',
        details: [
          'If this video supersedes an outdated zero-view video on the same topic, consider unlisting the obsolete one.',
          'Ensure older connected videos have matching modern thumbnail styling so new viewers recognize your current visual branding.'
        ]
      }
    ]
  }
];

export default function ChecklistDefinitions({ onBack }) {
  const [selectedPhase, setSelectedPhase] = useState('All');

  const filteredPhases = selectedPhase === 'All' 
    ? WORKFLOW_DEFINITIONS 
    : WORKFLOW_DEFINITIONS.filter(p => p.phase.toLowerCase() === selectedPhase.toLowerCase());

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Navigation Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <button
          type="button"
          onClick={onBack}
          className="btn btn-outline"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
        >
          <ChevronLeft size={16} />
          <span>Back to Video</span>
        </button>

        <a
          href="obsidian://open?vault=SystemizedHealth_Vault&file=SOPs%2Fchecklistdefinitions261016.md"
          className="btn btn-outline"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', textDecoration: 'none' }}
          title="Open SOP in Obsidian Vault"
        >
          <ExternalLink size={14} />
          <span>Open in Obsidian</span>
        </a>
      </div>

      {/* Header Banner */}
      <div className="card" style={{ 
        marginBottom: '1.75rem', 
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08), rgba(99, 102, 241, 0.08))',
        border: '1px solid rgba(14, 165, 233, 0.25)',
        padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.5rem' }}>
          <div style={{ 
            backgroundColor: 'var(--accent-color)', 
            color: '#fff', 
            padding: '0.6rem', 
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BookOpen size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
              Workflow Reference Guide
            </h1>
            <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              Step-by-step production definitions, psychological rationale & acceptance criteria
            </p>
          </div>
        </div>

        {/* Phase Filter Bar */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.4rem', 
          marginTop: '1.25rem', 
          flexWrap: 'wrap',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-color)'
        }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '600', marginRight: '0.25rem' }}>
            Jump to Phase:
          </span>
          {['All', '#idea', '#write', '#film', '#edit', '#uploaded', '#published'].map(phase => (
            <button
              key={phase}
              type="button"
              className={`phase-pill ${selectedPhase.toLowerCase() === phase.toLowerCase() ? 'active' : ''}`}
              onClick={() => setSelectedPhase(phase)}
              style={{ fontSize: '0.8rem', padding: '0.25rem 0.65rem' }}
            >
              {phase}
            </button>
          ))}
        </div>
      </div>

      {/* Phase Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {filteredPhases.map(phaseGroup => {
          const PhaseIcon = phaseGroup.icon;
          return (
            <div 
              key={phaseGroup.phase} 
              className="card"
              style={{
                borderLeft: `5px solid ${phaseGroup.color}`,
                padding: '1.5rem'
              }}
            >
              {/* Phase Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ 
                    backgroundColor: phaseGroup.bg, 
                    color: phaseGroup.color, 
                    padding: '0.45rem', 
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex'
                  }}>
                    <PhaseIcon size={20} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>
                      {phaseGroup.title}
                    </h2>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {phaseGroup.subtitle}
                    </span>
                  </div>
                </div>

                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: '700', 
                  padding: '0.2rem 0.55rem', 
                  borderRadius: '4px',
                  backgroundColor: phaseGroup.bg,
                  color: phaseGroup.color,
                  border: `1px solid ${phaseGroup.color}40`
                }}>
                  {phaseGroup.items.length} Tasks
                </span>
              </div>

              {/* Items in this Phase */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {phaseGroup.items.map((item, idx) => (
                  <div 
                    key={item.key}
                    style={{
                      backgroundColor: 'var(--bg-color)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.45rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <CheckCircle2 size={16} color={phaseGroup.color} />
                      <strong style={{ fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                        {item.label}
                      </strong>
                      <code style={{ 
                        fontSize: '0.72rem', 
                        color: 'var(--text-secondary)', 
                        backgroundColor: 'var(--surface-color)',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '3px',
                        border: '1px solid var(--border-color)'
                      }}>
                        {item.key}
                      </code>
                    </div>

                    <p style={{ margin: '0.1rem 0 0.35rem 0', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                      {item.summary}
                    </p>

                    {item.details && item.details.length > 0 && (
                      <ul style={{ 
                        margin: '0.2rem 0 0 1.25rem', 
                        padding: 0, 
                        fontSize: '0.84rem', 
                        color: 'var(--text-primary)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem'
                      }}>
                        {item.details.map((detail, dIdx) => (
                          <li key={dIdx} style={{ lineHeight: '1.4' }}>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Back Button */}
      <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
        <button
          type="button"
          onClick={onBack}
          className="btn btn-primary"
          style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ChevronLeft size={16} />
          <span>Return to Video / Pipeline</span>
        </button>
      </div>
    </div>
  );
}
