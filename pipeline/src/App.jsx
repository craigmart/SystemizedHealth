import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Calendar, CheckSquare, AlertCircle, RefreshCw, ChevronLeft, Save } from 'lucide-react';
import { addDays, isBefore, parseISO } from 'date-fns';

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
    else setVideos(data || []);
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
          <p style={{ marginTop: '1rem' }}>Please ensure you have added exactly these two variables in your Netlify <strong>Site settings &gt; Environment variables</strong>:</p>
          <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem', color: 'var(--text-secondary)' }}>
            <li><strong>VITE_SUPABASE_URL</strong></li>
            <li><strong>VITE_SUPABASE_KEY</strong></li>
          </ul>
          <p style={{ marginTop: '1rem' }}>Once added, you will need to trigger a new deploy in Netlify (Deploys &gt; Trigger deploy &gt; Clear cache and deploy site).</p>
        </div>
      </div>
    );
  }

  // Sorting helper: closest drop_date first
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

  const editingVideos = videos.filter(v => v.status === '#edit').sort(sortByDropDate);

  const getStatusBadge = (status) => {
    const s = status ? status.replace('#', '') : 'idea';
    return <span className={`badge badge-${s}`}>{status}</span>;
  };

  const renderDashboard = () => (
    <div className="dashboard-grid">
      {/* Actionable Pipeline View */}
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

      {/* Runway Calendar View */}
      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Calendar size={20} color="var(--accent-color)" /> Runway Overview
        </h2>
        <div className="videos-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {videos.filter(v => v.drop_date).sort(sortByDropDate).map(v => (
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
          <button className="btn btn-outline" onClick={() => { setCurrentVideo(null); fetchVideos(); }}>
            <ChevronLeft size={16} />
            Back to Dashboard
          </button>
        )}
      </header>

      {loading && !currentVideo ? (
        <p>Loading pipeline data...</p>
      ) : currentVideo ? (
        <VideoDetail video={currentVideo} />
      ) : (
        renderDashboard()
      )}
    </div>
  );
}

// Sub-component for the detail view
function VideoDetail({ video }) {
  const [agentMessage, setAgentMessage] = useState(video.agent_message || '');
  const [transcript, setTranscript] = useState(video.raw_transcript || '');
  const [checklist, setChecklist] = useState(video.edit_checklist || {});
  const [saving, setSaving] = useState(false);

  const handleSaveText = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('videos')
      .update({ 
        agent_message: agentMessage,
        raw_transcript: transcript 
      })
      .eq('video_number', video.video_number);
    
    if (error) alert("Error saving: " + error.message);
    else alert("Saved successfully!");
    setSaving(false);
  };

  const toggleChecklist = async (key) => {
    const newChecklist = { ...checklist, [key]: !checklist[key] };
    setChecklist(newChecklist);
    
    const { error } = await supabase
      .from('videos')
      .update({ edit_checklist: newChecklist })
      .eq('video_number', video.video_number);
      
    if (error) alert("Error saving checklist: " + error.message);
  };

  const getStatusBadge = (status) => {
    const s = status ? status.replace('#', '') : 'idea';
    return <span className={`badge badge-${s}`}>{status}</span>;
  };

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h2>{video.code}: {video.title}</h2>
          {getStatusBadge(video.status)}
        </div>
        <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <span><strong>Format:</strong> {video.format_type}</span>
          <span><strong>Drop Date:</strong> {video.drop_date || 'TBD'}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Agent Message Box */}
        <div>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Message to Agent (Antigravity)</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Leave instructions here for the agent regarding this video.
          </p>
          <textarea 
            value={agentMessage}
            onChange={(e) => setAgentMessage(e.target.value)}
            style={{ width: '100%', height: '80px', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontFamily: 'inherit', resize: 'vertical' }}
            placeholder="e.g., 'Make sure to emphasize the CTA at the end...'"
          />
        </div>

        {/* Audio Draft Box (only for early stages) */}
        {(video.status === '#idea' || video.status === '#write') && (
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Raw Audio Draft Transcript</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Paste your dictated transcript here. The agent will read this to generate the Stage 2 teleprompter script.
            </p>
            <textarea 
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              style={{ width: '100%', height: '300px', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontFamily: 'inherit', resize: 'vertical' }}
              placeholder="Paste raw transcript here..."
            />
          </div>
        )}

        {/* Save Button for Text Fields */}
        <div>
          <button className="btn btn-primary" onClick={handleSaveText} disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Text Fields'}
          </button>
        </div>

        {/* Interactive Editing Checklist (only for edit stage) */}
        {video.status === '#edit' && (
          <div style={{ marginTop: '1rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.25rem' }}>
              <CheckSquare size={20} color="var(--success-color)" /> Editing Quality Control
            </h3>
            <div className="checklist">
              {[
                { key: 'aroll', label: 'A-Roll Edited & Paced' },
                { key: 'broll', label: 'B-Roll & Graphics Added' },
                { key: 'audio', label: 'Audio Mastered (EQ, Compression)' },
                { key: 'color', label: 'Color Grading' },
                { key: 'export', label: 'Export & QC' }
              ].map(item => (
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
