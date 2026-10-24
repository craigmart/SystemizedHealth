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
    subtitle: 'Demand Psychology, Choice Packaging & Conversion Strategy',
    items: [
      {
        key: 'idea_demand',
        label: 'Topic Demand validated',
        summary: 'Confirm behavioral evidence that viewers actually watch this topic on YouTube today (Revealed Preference).',
        details: [
          'Key Question: "Do they actually care about this topic right now, and what outcome do they already value?"',
          'Verify organic view floor (median baseline) and ceiling (top outliers) across several recent comparable videos (ensure views aren\'t inflated by paid ads).',
          'Clinical Repositioning: If direct demand isn\'t there, position your clinical mechanism (X) as the unique key to the outcome they already want (Y) (e.g., "If you don\'t understand [Mechanism X], you don\'t understand [Outcome Y]").',
          'Define where this video fits into a goal-oriented YouTube Playlist on your channel.'
        ]
      },
      {
        key: 'idea_title',
        label: 'Title Selected',
        summary: 'Lock in the working title before writing by transferring proven choice psychology (targeting 90+ vidIQ score).',
        details: [
          'Key Question: "Compared to the 10 other videos sitting right next to mine, why would the right viewer choose mine over everyone else\'s?"',
          'Borrow proven framing patterns and transfer the underlying psychological pull (speed, ease, certainty, transformation, unfair advantage) that fits your viewer\'s brain—not just the words.',
          'Ensure the title makes a clear, truthful promise the video will 100% fulfill, omitting episode numbers or chronological tags.'
        ]
      },
      {
        key: 'idea_thumb',
        label: 'Thumbnail Drafted',
        summary: 'Concept or rough out the thumbnail visual alongside the title to win the 1-second glance.',
        details: [
          'Key Question: "Before they even read the title, does this visually communicate the problem, the desired transformation, and my clinical authority?"',
          'Must be immediately understood on mobile feeds and open a curiosity gap that leads the viewer\'s eyes straight to the title to complete the thought.'
        ]
      },
      {
        key: 'idea_connected',
        label: 'Connected video chosen',
        summary: 'Decide upfront where you are directing the viewer after this video as a natural continuation of value.',
        details: [
          'Key Question: "Once this video solves their initial problem, what is the next constraint or question they will immediately have?"',
          'Select a specific video on your channel that serves as the most useful next step, enabling a natural mid-roll nod and a high-value pitch at the end.'
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
    subtitle: 'Notebook Research, Brainstorming, Storyboard & 3×5 Card Outlining',
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
        key: 'prep_brainstorm',
        label: 'Brainstorm Content',
        summary: 'Braindump raw ideas into Gemini Chat to capture, organize, and structure the concept.',
        details: [
          'Dump raw thoughts, angles, analogies, and clinical insights into Gemini Chat.',
          'Let Gemini organize the ideas and structure the initial storyboard flow.'
        ]
      },
      {
        key: 'prep_storyboard',
        label: 'Create Storyboard',
        summary: 'Build the visual storyboard in Gemini Notebook with image triggers for filming.',
        details: [
          'Assemble the storyboard sequence inside Gemini Notebook.',
          'Generate and attach visual trigger images to anchor direct-to-camera recording.'
        ]
      },
      {
        key: 'prep_acceptance',
        label: 'Acceptance criteria',
        summary: 'Treat your title like a software specification and map the shortest sequence that fulfills it.',
        details: [
          'Key Question: "What must be true by the end of this video for the title to be 100% fulfilled, and how does this particular viewer want to consume this idea?"',
          'Break the answer down into the smallest truthful components—prioritizing proof, clarity, and direct steps over flashy retention tricks.',
          'These components form the non-negotiable backbone of your outline so execution never betrays viewer trust.'
        ]
      },
      {
        key: 'prep_card',
        label: '3×5 card drafted (5 beats)',
        summary: 'Distill your outline triggers onto a physical 3×5 index card as your filming anchor.',
        details: [
          'Beat 1 (The 4 Ps Hook — Confirm the Click): Promise ("Am I getting what I actually clicked for?"), Persona ("Is this video specifically for me?"), Proof ("Can this person actually deliver it?"), Plan ("Is the rest of this video worth my time?").',
          'Beats 2–4 (The Body): Deliver on your decomposed Acceptance Criteria in the shortest, clearest sequence possible.',
          'Mid-roll Nod: Naturally weave in a mention of your connected video where it solves a real constraint inside the topic.',
          'Beat 5 (Connected Video CTA): Frame the connected video as a pure gift of continued value, never an interruption or payment owed. Key Question: "Would I recommend this next step in the exact same way if I had zero affiliation to it?"'
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
          'Key Question: "Do my delivery energy, framing, and setting feel like the exact same video promised by the title and thumbnail?"',
          'Target length: 15–20 minutes for Longs, 40–60 seconds for Shorts.',
          'Speak conversationally and comfortably to one specific person—no robotic teleprompter reading.'
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
    subtitle: 'Rough Cuts, Verbosity Review, Visual Polish & Audio Mastering',
    items: [
      {
        key: 'edit_rough_cuts',
        label: 'Rough Cuts',
        summary: 'Assemble recorded takes, trim false starts and dead space to create the foundational timeline flow.',
        details: [
          'Assemble raw direct-to-camera takes in chronological sequence.',
          'Cut out false starts, long pauses, and dead air before adding supportive visual layers.'
        ]
      },
      {
        key: 'edit_gemini_verbosity',
        label: 'Gemini Verbosity Check',
        summary: 'Review transcript through Gemini to catch redundant tangents, tighten wording, and eliminate fluff.',
        details: [
          'Paste spoken transcript into Gemini Chat to analyze pacing and conciseness.',
          'Identify repetitive explanations or rambling sections to trim before finalizing audio and B-roll.'
        ]
      },
      {
        key: 'edit_broll',
        label: 'B-roll & pacing matched',
        summary: 'Cut dead space and layer supportive visuals and B-roll that match how your viewer wants to learn.',
        details: [
          'Key Question: "Do the title, thumbnail, hook, delivery, and editing all feel like the exact same video?"',
          'Calibrate visual polish to the packaging promise; if the title promises a raw, honest clinical breakdown, avoid over-editing with flashy graphics that break doctor-patient trust.'
        ]
      },
      {
        key: 'edit_sound',
        label: 'Sound & audio enhanced',
        summary: 'Professional dialogue mastering for effortless, comfortable listening.',
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
          'Key Question: "Sitting directly beside the top competing videos on mobile and dark mode, does my package give the clearest, most compelling reason to click?"',
          'Check that text is minimal (3 words max) and reinforces the curiosity gap.'
        ]
      },
      {
        key: 'pub_upload',
        label: 'Upload to Studio',
        summary: 'Upload the master video file to YouTube Studio and assign to designated Playlist.',
        details: [
          'Upload master video file to YouTube Studio.',
          'Assign video to its designated goal-oriented Playlist.'
        ]
      },
      {
        key: 'pub_endscreen',
        label: 'End Screen and Cards',
        summary: 'Configure YouTube End Screen element and interactive Cards.',
        details: [
          'Link the End Screen element and mid-roll Card directly to your pre-chosen connected video.'
        ]
      },
      {
        key: 'pub_pinned',
        label: 'Pinned comment link',
        summary: 'Post and pin the primary next-action comment.',
        details: [
          'Key Question: "How does this link genuinely help the viewer implement what they just learned beyond what I could physically provide in the video?"',
          'Write a brief value-giving hook with a direct link to your connected video or resource (prioritized over descriptions on mobile and desktop).'
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
    subtitle: 'Analog Zettelkasten Filing, Notebook Archive & Bottleneck Audits',
    items: [
      {
        key: 'pub_cards',
        label: '3×5 main cards filed',
        summary: 'Write clinical propositions on physical 3×5 index cards and file in analog box.',
        details: [
          'Extract 1–2 sharp, atomic clinical propositions and file into your physical Zettelkasten box to grow your permanent second brain.'
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
        summary: 'Evaluate initial audience response 48 hours post-drop by diagnosing the 4 viewer decisions.',
        details: [
          'Key Question: "Which of the 4 decisions did the viewer NOT make?"',
          '1. Demand Bottleneck (Low Impressions/Views): Did the right viewer not care about the idea in the first place?',
          '2. Choice Bottleneck (Low CTR): Did they care about the topic, but chose another video over mine?',
          '3. Consumption Bottleneck (Early Drop-off / Low Satisfaction): Did the hook fail to confirm the click, or did the delivery/pacing break the expectation?',
          '4. Conversion Bottleneck (Low End-Screen / Pinned Link Clicks): Did the CTA trigger "persuasion knowledge" (feeling sold to) instead of feeling like the most useful next step?',
          'Analyze comment/like ratios and inspect the retention curve to trim any offending drop-off segments.'
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
