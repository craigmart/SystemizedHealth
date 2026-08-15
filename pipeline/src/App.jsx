import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Calendar, CheckSquare, AlertCircle, RefreshCw, ChevronLeft, Save, Tag, TrendingUp, Clock, FileVideo, Scissors, Film, X, ExternalLink, BarChart2, LayoutDashboard } from 'lucide-react';
import { addDays, isBefore, parseISO, differenceInDays } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
    { key: 'edit_lut', label: 'Apply LUT and Color (LF)' },
    { key: 'edit_trim', label: 'Trim (LF)' },
    { key: 'edit_clarity', label: 'Edit for Clarity (DE)' },
    { key: 'edit_subtitles', label: 'Add Subtitles (DE)' },
    { key: 'edit_audio', label: 'Enhance Audio (Adobe + LF)' },
    { key: 'edit_upload', label: 'Upload (YT-S)' },
    { key: 'edit_metadata', label: 'Meta Data (YT-S)' },
    { key: 'edit_schedule', label: 'Schedule (YT-S)' }
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
  const [metricModal, setMetricModal] = useState(null);
  const [activeTab, setActiveTab] = useState('pipeline');

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

  const editingVideos = videos.filter(v => v.status === '#edit');
  const readyToFilmVideos = videos.filter(v => v.status === '#film');
  const writingVideos = videos.filter(v => v.status === '#write');

  const openModal = (title, videoList) => {
    setMetricModal({ title, videos: videoList.sort(sortByDropDate) });
  };

  const renderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
        <div className="card" onClick={() => openModal('Upcoming Runway (Unfinished)', unfinishedFuture)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer' }}>
          <div style={{ backgroundColor: daysAhead >= 21 ? 'var(--success-color)' : 'var(--danger-color)', color: '#fff', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Days Ahead</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', lineHeight: '1.2' }}>{daysAhead}</div>
          </div>
        </div>

        <div className="card" onClick={() => openModal('All Videos', videos)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer' }}>
          <div style={{ backgroundColor: 'var(--accent-color)', color: '#fff', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
            <FileVideo size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Videos</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', lineHeight: '1.2' }}>{videos.length}</div>
          </div>
        </div>

        <div className="card" onClick={() => openModal('Pending Audio Draft', needsDrafting)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer' }}>
          <div style={{ backgroundColor: '#ff9800', color: '#fff', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pending Audio</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', lineHeight: '1.2' }}>{needsDrafting.length}</div>
          </div>
        </div>

        <div className="card" onClick={() => openModal('In Writing', writingVideos)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer' }}>
          <div style={{ backgroundColor: '#b45309', color: '#fff', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
            <Scissors size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>In Writing</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', lineHeight: '1.2' }}>{writingVideos.length}</div>
          </div>
        </div>

        <div className="card" onClick={() => openModal('Ready to Film', readyToFilmVideos)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer' }}>
          <div style={{ backgroundColor: 'var(--danger-color)', color: '#fff', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
            <Film size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ready to Film</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', lineHeight: '1.2' }}>{readyToFilmVideos.length}</div>
          </div>
        </div>

        <div className="card" onClick={() => openModal('In Editing', editingVideos)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer' }}>
          <div style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/favicon.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>In Editing</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', lineHeight: '1.2' }}>{editingVideos.length}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertCircle size={20} color="var(--danger-color)" /> Action Items
          </h2>
          <div className="videos-list">
            {[...new Set([...needsPublishing, ...needsDrafting])].sort(sortByDropDate).slice(0, 10).map(v => {
              const isPublishUrgent = needsPublishing.includes(v);
              const message = isPublishUrgent
                ? `Due in < 21 days! (Drop: ${v.drop_date})`
                : `Needs Audio Draft (Drop: ${v.drop_date})`;
              const borderStyle = isPublishUrgent
                ? { borderLeft: '3px solid var(--danger-color)', cursor: 'pointer' }
                : { cursor: 'pointer' };

              return (
                <div key={v.code} className="video-item" style={borderStyle} onClick={() => setCurrentVideo(v)}>
                  <div className="video-header">
                    <strong>{v.code}: {v.title}</strong>
                    {getStatusBadge(v.status)}
                  </div>
                  <div className="video-meta">
                    <span>{message}</span>
                  </div>
                </div>
              );
            })}
            {needsDrafting.length === 0 && needsPublishing.length === 0 && (
              <p>You are ahead of schedule! 🎉</p>
            )}
          </div>
        </div>

        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Calendar size={20} color="var(--accent-color)" /> Runway Overview
          </h2>
          <div className="videos-list">
            {videos
              .filter(v => {
                if (!v.drop_date) return false;
                const d = parseISO(v.drop_date);
                d.setHours(0, 0, 0, 0);
                return d >= todayDate && d <= addDays(todayDate, 10);
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

      {/* Metric Modal Overlay */}
      {metricModal && (
        <div className="modal-overlay" onClick={() => setMetricModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{metricModal.title}</h2>
              <button className="btn btn-outline" onClick={() => setMetricModal(null)} style={{ padding: '0.5rem' }}>
                <X size={20} />
              </button>
            </div>
            {metricModal.videos.length === 0 ? (
              <p>No videos found for this metric.</p>
            ) : (
              <div className="videos-list">
                {metricModal.videos.map(v => (
                  <div key={v.code} className="video-item" style={{ cursor: 'pointer' }} onClick={() => { setCurrentVideo(v); setMetricModal(null); }}>
                    <div className="video-header">
                      <strong>{v.code}: {v.title}</strong>
                      {getStatusBadge(v.status)}
                    </div>
                    <div className="video-meta">
                      <span>Drop: {v.drop_date || 'TBD'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="container">
      <header className="section-header">
        <div>
          <h1>Systemizd Pipeline</h1>
          <p>Systemized Health central dashboard</p>
        </div>
        {!currentVideo ? (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', background: 'var(--surface-color)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <button
                className={`btn ${activeTab === 'pipeline' ? 'btn-primary' : 'btn-outline'}`}
                style={{ border: 'none', borderRadius: '4px', boxShadow: 'none' }}
                onClick={() => setActiveTab('pipeline')}
              >
                <LayoutDashboard size={16} /> Pipeline
              </button>
              <button
                className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-outline'}`}
                style={{ border: 'none', borderRadius: '4px', boxShadow: 'none' }}
                onClick={() => setActiveTab('analytics')}
              >
                <BarChart2 size={16} /> Analytics
              </button>
            </div>
            {activeTab === 'pipeline' && (
              <button className="btn btn-outline" onClick={fetchVideos} disabled={loading}>
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            )}
          </div>
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
      ) : activeTab === 'pipeline' ? (
        renderDashboard()
      ) : (
        <AnalyticsSummary />
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
  const [videoPath, setVideoPath] = useState(null);

  // Fetch specific video path
  useEffect(() => {
    fetch('/video_paths.json')
      .then(res => res.json())
      .then(data => {
        if (data && data[video.code]) {
          setVideoPath(data[video.code]);
        }
      })
      .catch(console.error);
  }, [video.code]);

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

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={handleSaveText} disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Text Fields'}
          </button>

          <a
            href={videoPath 
              ? `obsidian://open?vault=SystemizedHealth_Vault&file=${encodeURIComponent(videoPath)}` 
              : `obsidian://search?vault=SystemizedHealth_Vault&query=${encodeURIComponent(`"${localVideo.code.replace(/^80\./, '')}"`)}`}
            className="btn btn-outline"
            style={{ textDecoration: 'none' }}
          >
            <ExternalLink size={16} />
            Open Script in Obsidian
          </a>
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

function AnalyticsSummary() {
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/Analytics.md')
      .then(res => res.text())
      .then(text => {
        setMarkdown(text);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching analytics markdown:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading Analytics...</p>;
  if (!markdown) return <p>Failed to load Analytics Summary. Ensure the markdown file is copied to public folder.</p>;

  return (
    <div className="analytics-summary" style={{ marginTop: '1rem' }}>
      <div className="card markdown-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}
