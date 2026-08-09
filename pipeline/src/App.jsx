import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Calendar, CheckSquare, AlertCircle, RefreshCw } from 'lucide-react';
import { addDays, isBefore, parseISO, isAfter } from 'date-fns';

function App() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Compute metrics for the views
  const today = new Date();
  
  // 1. Publishing Runway (21 days)
  const publishTarget = addDays(today, 21);
  const needsPublishing = videos.filter(v => {
    if (!v.drop_date || v.status === '#published') return false;
    const dropDate = parseISO(v.drop_date);
    return isBefore(dropDate, publishTarget) || isBefore(dropDate, today);
  });

  // 2. Audio Draft Runway (6 weeks / 42 days)
  const draftTarget = addDays(today, 42);
  const needsDrafting = videos.filter(v => {
    if (!v.drop_date) return false;
    const dropDate = parseISO(v.drop_date);
    // Needs draft if it's within 6 weeks and is still in #idea or #write
    return (isBefore(dropDate, draftTarget) && (v.status === '#idea' || v.status === '#write'));
  });

  // 3. Edit Checklist
  const editingVideos = videos.filter(v => v.status === '#edit');

  const getStatusBadge = (status) => {
    const s = status ? status.replace('#', '') : 'idea';
    return <span className={`badge badge-${s}`}>{status}</span>;
  };

  return (
    <div className="container">
      <header className="section-header">
        <div>
          <h1>Video Production Pipeline</h1>
          <p>Systemized Health central dashboard</p>
        </div>
        <button className="btn btn-outline" onClick={fetchVideos} disabled={loading}>
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      {loading ? (
        <p>Loading pipeline data...</p>
      ) : (
        <div className="dashboard-grid">
          {/* Actionable Pipeline View */}
          <div className="card">
            <h2 className="flex items-center gap-2 mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={20} color="var(--danger-color)" /> Action Items
            </h2>
            <div className="videos-list">
              {needsDrafting.map(v => (
                <div key={v.code} className="video-item">
                  <div className="video-header">
                    <strong>{v.code}: {v.title}</strong>
                    {getStatusBadge(v.status)}
                  </div>
                  <div className="video-meta">
                    <span>Needs Audio Draft ASAP (Drop: {v.drop_date})</span>
                  </div>
                </div>
              ))}
              {needsPublishing.map(v => (
                <div key={v.code} className="video-item" style={{ borderLeft: '3px solid var(--danger-color)' }}>
                  <div className="video-header">
                    <strong>{v.code}: {v.title}</strong>
                    {getStatusBadge(v.status)}
                  </div>
                  <div className="video-meta">
                    <span>Due in &lt; 21 days. Get uploaded &amp; scheduled! (Drop: {v.drop_date})</span>
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
            <h2 className="flex items-center gap-2 mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} color="var(--accent-color)" /> Runway Overview
            </h2>
            <p className="mb-4">Visualizing videos by drop date</p>
            <div className="videos-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {videos.filter(v => v.drop_date).sort((a,b) => new Date(a.drop_date) - new Date(b.drop_date)).map(v => (
                <div key={v.code} className="video-item">
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

          {/* Interactive Checklist */}
          <div className="card">
            <h2 className="flex items-center gap-2 mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckSquare size={20} color="var(--success-color)" /> Editing Queue
            </h2>
            {editingVideos.length === 0 ? (
              <p>No videos currently in editing.</p>
            ) : (
              editingVideos.map(v => (
                <div key={v.code} className="video-item" style={{ borderLeft: '3px solid var(--success-color)' }}>
                  <div className="video-header mb-2" style={{ marginBottom: '0.5rem' }}>
                    <strong>{v.code}: {v.title}</strong>
                  </div>
                  <div className="checklist">
                    <label className="checklist-item">
                      <input type="checkbox" />
                      <span className="checklist-label">A-Roll Edited & Paced</span>
                    </label>
                    <label className="checklist-item">
                      <input type="checkbox" />
                      <span className="checklist-label">B-Roll & Graphics Added</span>
                    </label>
                    <label className="checklist-item">
                      <input type="checkbox" />
                      <span className="checklist-label">Audio Mastered (EQ, Compression)</span>
                    </label>
                    <label className="checklist-item">
                      <input type="checkbox" />
                      <span className="checklist-label">Color Grading</span>
                    </label>
                    <label className="checklist-item">
                      <input type="checkbox" />
                      <span className="checklist-label">Export & QC</span>
                    </label>
                  </div>
                  <button className="btn btn-outline" style={{ marginTop: '1rem', width: '100%' }} onClick={() => alert('Run CLI to update status: python3 scripts/video_pipeline.py --status ' + v.code + ' "#uploaded"')}>
                    Mark Uploaded
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
