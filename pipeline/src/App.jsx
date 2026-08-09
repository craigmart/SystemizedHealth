import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Calendar, CheckSquare, AlertCircle, RefreshCw, ChevronLeft, Save, Tag, TrendingUp, Clock, FileVideo, Scissors } from 'lucide-react';
import { addDays, isBefore, parseISO, differenceInDays } from 'date-fns';

const STAGE_CHECKLISTS = {
  '#idea': [
    { key: 'idea_outline', label: 'Generate Idea & Rough Outline Proposal (Hook, Points, CTA)' },
    { key: 'idea_audio', label: 'Record raw conversational audio brainstorm' },
    { key: 'idea_paste', label: 'Paste audio transcript in dashboard for Stage 2 polish' }
  ],
  '#write': [
    { key: 'write_format', label: 'Format Teleprompter Script with Clip Sub-Codes' },
    { key: 'write_cues', label: 'Ensure single paragraphs per clip & add performance cues' },
    { key: 'write_sync', label: 'Sync script to Obsidian _Filming_Dashboard.md' }
  ],
  '#film': [
    { key: 'film_review', label: 'Review Obsidian script on set' },
    { key: 'film_record', label: 'Record A-Roll clips matching exact sub-codes' },
    { key: 'film_transcribe', label: 'Auto-transcribe final A-Roll to lock in final version' }
  ],
  '#edit': [
    { key: 'edit_import', label: 'Import A-Roll and organize by clip sub-codes' },
    { key: 'edit_descript', label: 'Descript: Transcription & Filler Word Removal' },
    { key: 'edit_aroll', label: 'A-Roll Edited & Paced' },
    { key: 'edit_broll', label: 'B-Roll, Images & Graphics Added' },
    { key: 'edit_captions', label: 'Captions & Subtitles Generated' },
    { key: 'edit_audio', label: 'Audio Mastered & Color Graded' },
    { key: 'edit_export', label: 'Final Export & QC' }
  ],
  '#uploaded': [
    { key: 'up_studio', label: 'Video uploaded to YouTube Studio' },
    { key: 'up_meta', label: 'Metadata (Titles, JDex Tags) dialed in' },
    { key: 'up_cta', label: 'CTA descriptions and links verified' },
    { key: 'up_thumb', label: 'Custom Thumbnail uploaded and reviewed' },
    { key: 'up_schedule', label: 'Video explicitly scheduled for exact drop date' }
  ]
};

const STATUS_OPTIONS = ['#idea', '#write', '#film', '#edit', '#uploaded', '#published'];

function App() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentVideo, setCurrentVideo] = useState(null);

  const fetchVideos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('video_number', { ascending: true });

    if (error) console.error("Error fetching videos:", error);
    else {
      setVideos(data || []);
      // If we are currently viewing a video, update its local object
      if (currentVideo) {
        const updated = data.find(v => v.id === currentVideo.id);
        if (updated) setCurrentVideo(updated);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (supabase) {
      fetchVideos();
    }
  }, []);

  if (!supabase) {
    return (
      <div className="container">
        <div className="card" style={{ borderColor: 'var(--danger-color)' }}>
          <h2 style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={24} /> Configuration Error
          </h2>
          <p>The Supabase environment variables are missing.</p>
        </div>
      </div>
    );
  }

  const sortByDropDate = (a, b) => {
    if (!a.drop_date) return 1;
    if (!b.drop_date) return -1;
    return new Date(a.drop_date) - new Date(b.drop_date);
  };

  const today = new Date();
  const publishTarget = addDays(today, 21);
  const draftTarget = addDays(today, 42);

  const needsPublishing = videos.filter(v => {
    if (!v.drop_date || v.status === '#published') return false;
    const dropDate = parseISO(v.drop_date);
    return isBefore(dropDate, publishTarget) || isBefore(dropDate, today);
  }).sort(sortByDropDate);

  const needsDrafting = videos.filter(v => {
    if (!v.drop_date) return false;
    const dropDate = parseISO(v.drop_date);
    return (isBefore(dropDate, draftTarget) && (v.status === '#idea' || v.status === '#write'));
  }).sort(sortByDropDate);

  const getStatusBadge = (status) => {
    const s = status ? status.replace('#', '') : 'idea';
    return <span className={`badge badge-${s}`}>{status}</span>;
  };

  // Metrics Calculation
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const unfinishedFuture = videos.filter(v => {
    if (!v.drop_date) return false;
    const dropDate = parseISO(v.drop_date);
    dropDate.setHours(0, 0, 0, 0);
    const isFinished = v.status === '#uploaded' || v.status === '#published';
    return !isFinished && dropDate >= todayDate;
  });

  let daysAhead = 0;
  if (unfinishedFuture.length > 0) {
    const dates = unfinishedFuture.map(v => parseISO(v.drop_date).setHours(0, 0, 0, 0));
    const earliestUnfinished = new Date(Math.min(...dates));
    daysAhead = Math.max(0, Math.floor((earliestUnfinished - todayDate) / (1000 * 60 * 60 * 24)) - 1);
  } else {
    const scheduledVideos = videos.filter(v => v.drop_date && (v.status === '#uploaded' || v.status === '#published'));
    if (scheduledVideos.length > 0) {
      const dates = scheduledVideos.map(v => parseISO(v.drop_date).setHours(0, 0, 0, 0));
      const latestDate = new Date(Math.max(...dates));
      daysAhead = Math.max(0, Math.floor((latestDate - todayDate) / (1000 * 60 * 60 * 24)));
    }
  }

  const editingCount = videos.filter(v => v.status === '#edit').length;

  const renderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
          <div style={{ backgroundColor: daysAhead >= 21 ? 'var(--success-color)' : 'var(--danger-color)', color: '#fff', padding: '0.75rem', borderRadius: '50%' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Days Ahead (Goal: 21)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{daysAhead}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
          <div style={{ backgroundColor: 'var(--accent-color)', color: '#fff', padding: '0.75rem', borderRadius: '50%' }}>
            <FileVideo size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Videos</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{videos.length}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
          <div style={{ backgroundColor: '#ff9800', color: '#fff', padding: '0.75rem', borderRadius: '50%' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pending Audio Draft</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{needsDrafting.length}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
          <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/favicon.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>In Editing</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{editingCount}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertCircle size={20} color="var(--danger-color)" /> Action Items
          </h2>
          <div className="videos-list">
            {needsDrafting.map(v => (
              <div key={v.code} className="video-item" style={{ cursor: 'pointer' }} onClick={() => setCurrentVideo(v)}>
                <div className="video-header">
                  <strong>{v.code}: {v.title}</strong>
                  {getStatusBadge(v.status)}
                </div>
                <div className="video-meta">
                  <span>Needs Audio Draft (Drop: {v.drop_date})</span>
                </div>
              </div>
            ))}
            {needsPublishing.map(v => (
              <div key={v.code} className="video-item" style={{ borderLeft: '3px solid var(--danger-color)', cursor: 'pointer' }} onClick={() => setCurrentVideo(v)}>
                <div className="video-header">
                  <strong>{v.code}: {v.title}</strong>
                  {getStatusBadge(v.status)}
                </div>
                <div className="video-meta">
                  <span>Due in &lt; 21 days! (Drop: {v.drop_date})</span>
                </div>
              </div>
            ))}
            {needsDrafting.length === 0 && needsPublishing.length === 0 && (
              <p>You are ahead of schedule! 🎉</p>
            )}
          </div>
        </div>

        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Calendar size={20} color="var(--accent-color)" /> Runway Overview
          </h2>
          <div className="videos-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {videos
              .filter(v => {
                if (!v.drop_date) return false;
                const d = parseISO(v.drop_date);
                d.setHours(0, 0, 0, 0);
                return d > todayDate;
              })
              .sort(sortByDropDate)
              .map(v => (
                <div key={v.code} className="video-item" style={{ cursor: 'pointer' }} onClick={() => setCurrentVideo(v)}>
                  <div className="video-header">
                    <strong>{v.code}</strong>
                    {getStatusBadge(v.status)}
                  </div>
                  <div className="video-meta">
                    <span>{v.title}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 'bold' }}>{v.drop_date}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container">
      <header className="section-header">
        <div>
          <h1>Video Production Pipeline</h1>
          <p>Systemized Health central dashboard</p>
        </div>
        {!currentVideo ? (
          <button className="btn btn-outline" onClick={fetchVideos} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        ) : (
          <button className="btn btn-outline" onClick={() => setCurrentVideo(null)}>
            <ChevronLeft size={16} />
            Back to Dashboard
          </button>
        )}
      </header>

      {loading && !currentVideo ? (
        <p>Loading pipeline data...</p>
      ) : currentVideo ? (
        <VideoDetail video={currentVideo} onUpdate={fetchVideos} />
      ) : (
        renderDashboard()
      )}
    </div>
  );
}

function VideoDetail({ video, onUpdate }) {
  const [localVideo, setLocalVideo] = useState(video);
  const [agentMessage, setAgentMessage] = useState(video.agent_message || '');
  const [transcript, setTranscript] = useState(video.raw_transcript || '');
  const [checklist, setChecklist] = useState(video.edit_checklist || {});
  const [saving, setSaving] = useState(false);

  // Sync state if prop changes
  useEffect(() => {
    setLocalVideo(video);
    setAgentMessage(video.agent_message || '');
    setTranscript(video.raw_transcript || '');
    setChecklist(video.edit_checklist || {});
  }, [video]);

  const handleSaveText = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('videos')
      .update({
        agent_message: agentMessage,
        raw_transcript: transcript
      })
      .eq('video_number', localVideo.video_number);

    if (error) alert("Error saving: " + error.message);
    else onUpdate();
    setSaving(false);
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    const { error } = await supabase
      .from('videos')
      .update({ status: newStatus })
      .eq('video_number', localVideo.video_number);

    if (error) alert("Error changing status: " + error.message);
    else onUpdate();
  };

  const toggleChecklist = async (key) => {
    const newChecklist = { ...checklist, [key]: !checklist[key] };
    setChecklist(newChecklist);

    const { error } = await supabase
      .from('videos')
      .update({ edit_checklist: newChecklist })
      .eq('video_number', localVideo.video_number);

    if (error) alert("Error saving checklist: " + error.message);
  };

  const getStatusBadge = (status) => {
    const s = status ? status.replace('#', '') : 'idea';
    return <span className={`badge badge-${s}`}>{status}</span>;
  };

  const currentChecklist = STAGE_CHECKLISTS[localVideo.status] || [];

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h2>{localVideo.code}: {localVideo.title}</h2>
          {getStatusBadge(localVideo.status)}
        </div>
        <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem', alignItems: 'center' }}>
          <span><strong>Format:</strong> {localVideo.format_type}</span>
          <span><strong>Drop Date:</strong> {localVideo.drop_date || 'TBD'}</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
            <Tag size={16} />
            <select
              value={localVideo.status}
              onChange={handleStatusChange}
              style={{ padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Agent Message Box */}
        <div>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Message to Agent (Antigravity)</h3>
          <textarea
            value={agentMessage}
            onChange={(e) => setAgentMessage(e.target.value)}
            style={{ width: '100%', height: '80px', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontFamily: 'inherit', resize: 'vertical' }}
            placeholder="e.g., 'Make sure to emphasize the CTA at the end...'"
          />
        </div>

        {/* Audio Draft Section (only for early stages) */}
        {(localVideo.status === '#idea' || localVideo.status === '#write') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Rough Outline Reference Display */}
            {localVideo.rough_outline && (
              <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Pre-Recording Outline Reference</h3>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  {localVideo.rough_outline}
                </div>
              </div>
            )}

            {/* Audio Draft Input Box */}
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Raw Audio Draft Transcript</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Paste your dictated transcript here. The agent will read this to generate the Stage 2 teleprompter script.
              </p>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                style={{ width: '100%', height: '200px', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontFamily: 'inherit', resize: 'vertical' }}
                placeholder="Paste raw transcript here..."
              />
            </div>
          </div>
        )}

        {/* Save Button for Text Fields */}
        <div>
          <button className="btn btn-primary" onClick={handleSaveText} disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Text Fields'}
          </button>
        </div>

        {/* Interactive Editing Checklist */}
        {currentChecklist.length > 0 && (
          <div style={{ marginTop: '1rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.25rem' }}>
              <CheckSquare size={20} color="var(--success-color)" /> {localVideo.status} Checklist
            </h3>
            <div className="checklist">
              {currentChecklist.map(item => (
                <label key={item.key} className={`checklist-item ${checklist[item.key] ? 'checked' : ''}`} style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!checklist[item.key]}
                    onChange={() => toggleChecklist(item.key)}
                  />
                  <span className="checklist-label">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
