import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { 
  Calendar, CheckSquare, AlertCircle, RefreshCw, ChevronLeft, Save, Tag, 
  TrendingUp, Clock, FileVideo, Scissors, Film, X, ExternalLink, BarChart2, 
  LayoutDashboard, Eye, Users, Award, Flame, BookOpen, Check, ThumbsUp, 
  MessageSquare, Plus, Trash2, ListTodo, FileText, CheckCircle2, Lightbulb 
} from 'lucide-react';
import { addDays, isBefore, parseISO, differenceInDays } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const LONG_VIDEO_CHECKLIST_ITEMS = [
  { key: 'prep_notebook', phase: 'Planning', label: 'Gemini Notebook research' },
  { key: 'prep_card', phase: 'Planning', label: '3x5 card drafted (4 beats)' },
  { key: 'film_recorded', phase: 'Filming', label: 'Direct-to-camera recorded' },
  { key: 'edit_transcript', phase: 'Editing', label: 'Descript transcript pasted' },
  { key: 'edit_broll', phase: 'Editing', label: 'B-roll added' },
  { key: 'edit_sound', phase: 'Editing', label: 'Sound & audio enhanced' },
  { key: 'edit_vidiq', phase: 'Editing', label: 'vidIQ title scored (90+)' },
  { key: 'edit_obsidian', phase: 'Editing', label: 'Obsidian & JDex archived' },
  { key: 'pub_upload', phase: 'Publishing', label: 'YouTube Studio upload & CTA' },
  { key: 'pub_thumb', phase: 'Publishing', label: 'Custom thumbnail uploaded' },
  { key: 'pub_schedule', phase: 'Publishing', label: 'Scheduled for drop date' },
  { key: 'pub_cards', phase: 'Archived', label: 'Physical 3x5 main cards filed' },
];

export const SHORT_VIDEO_CHECKLIST_ITEMS = [
  { key: 'short_descript', phase: 'Editing', label: 'Edited in Descript (captions, audio)' },
  { key: 'edit_transcript', phase: 'Editing', label: 'Descript transcript pasted' },
  { key: 'edit_vidiq', phase: 'Editing', label: 'vidIQ title/hook scored (90+)' },
  { key: 'edit_obsidian', phase: 'Editing', label: 'Obsidian & JDex archived' },
  { key: 'pub_upload', phase: 'Publishing', label: 'YouTube Shorts upload & CTA' },
  { key: 'pub_schedule', phase: 'Publishing', label: 'Scheduled for drop date' },
];

export const LONG_CHECKLIST_PHASES = ['All', 'Planning', 'Filming', 'Editing', 'Publishing', 'Archived'];
export const SHORT_CHECKLIST_PHASES = ['All', 'Editing', 'Publishing'];

const STATUS_OPTIONS = ['#idea', '#write', '#film', '#edit', '#uploaded', '#published'];

function App() {
  const [videos, setVideos] = useState([]);
  const [videoPaths, setVideoPaths] = useState({});
  const [actionFilter, setActionFilter] = useState('all');
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
    fetch('/video_paths.json')
      .then(res => res.json())
      .then(data => {
        if (data) setVideoPaths(data);
      })
      .catch(console.error);
  }, []);

  const getObsidianUri = (code) => {
    const p = videoPaths[code];
    if (p) {
      const encoded = p.split('/').map(encodeURIComponent).join('/');
      return `obsidian://open?vault=SystemizedHealth_Vault&file=${encoded}`;
    }
    return `obsidian://search?vault=SystemizedHealth_Vault&query=${encodeURIComponent(`"${code}"`)}`;
  };

  const handleMarkCardsDone = async (e, video) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('videos')
        .update({ cards_created: true })
        .eq('video_number', video.video_number);

      if (error) {
        alert("Error marking cards complete: " + error.message);
      } else {
        fetchVideos();
      }
    } catch (err) {
      console.error("Error updating cards_created:", err);
    }
  };

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

  const needsCards = videos.filter(v => {
    return v.status === '#published' && !v.cards_created && !v.code?.startsWith('HIST');
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

  const renderDashboard = () => {
    const cardActionItems = needsCards.map(v => ({
      video: v,
      type: 'cards',
      code: v.code,
      title: v.title,
      drop_date: v.drop_date,
      badgeText: 'Review for main cards',
      badgeClass: 'badge-cards',
      message: 'Read OB file & migrate ideas to 3x5 cards'
    }));

    const publishActionItems = needsPublishing.map(v => ({
      video: v,
      type: 'publish',
      code: v.code,
      title: v.title,
      drop_date: v.drop_date,
      badgeText: 'Due Soon',
      badgeClass: 'badge-film',
      message: `Due in < 21 days! (Drop: ${v.drop_date})`
    }));

    const draftActionItems = needsDrafting.map(v => ({
      video: v,
      type: 'draft',
      code: v.code,
      title: v.title,
      drop_date: v.drop_date,
      badgeText: 'Needs Draft',
      badgeClass: 'badge-write',
      message: `Needs Audio Draft (Drop: ${v.drop_date})`
    }));

    let filteredActionItems = [];
    if (actionFilter === 'cards') {
      filteredActionItems = cardActionItems;
    } else if (actionFilter === 'drafts') {
      filteredActionItems = draftActionItems;
    } else if (actionFilter === 'publish') {
      filteredActionItems = publishActionItems;
    } else {
      // 'all': Priority is publishing urgency, then main card reviews, then drafts
      filteredActionItems = [...publishActionItems, ...cardActionItems, ...draftActionItems];
    }

    const displayActionItems = filteredActionItems.slice(0, 10);

    return (
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

        <div className="card" onClick={() => openModal('Writing', writingVideos)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer' }}>
          <div style={{ backgroundColor: '#b45309', color: '#fff', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
            <Scissors size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Writing</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', lineHeight: '1.2' }}>{writingVideos.length}</div>
          </div>
        </div>

        <div className="card" onClick={() => openModal('Filming', readyToFilmVideos)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer' }}>
          <div style={{ backgroundColor: 'var(--danger-color)', color: '#fff', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
            <Film size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Filming</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', lineHeight: '1.2' }}>{readyToFilmVideos.length}</div>
          </div>
        </div>

        <div className="card" onClick={() => openModal('Editing', editingVideos)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer' }}>
          <div style={{ backgroundColor: '#7e22ce', color: '#fff', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Editing</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', lineHeight: '1.2' }}>{editingVideos.length}</div>
          </div>
        </div>

        <div className="card" onClick={() => openModal('All Scheduled Videos', videos.filter(v => v.drop_date))} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer' }}>
          <div style={{ backgroundColor: 'var(--accent-color)', color: '#fff', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
            <FileVideo size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Videos</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', lineHeight: '1.2' }}>{videos.length}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Calendar size={20} color="var(--accent-color)" /> Pipeline
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <strong>{v.code}</strong>
                      {v.notes && <span title="Has Production Log / Notes" style={{ fontSize: '0.75rem' }}>📝</span>}
                    </div>
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

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <AlertCircle size={20} color="var(--danger-color)" /> Action Items (Next 10)
            </h2>
            <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-color)', padding: '0.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
              <button
                type="button"
                className="btn"
                style={{
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.75rem',
                  borderRadius: '4px',
                  backgroundColor: actionFilter === 'all' ? 'var(--surface-color)' : 'transparent',
                  color: actionFilter === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: actionFilter === 'all' ? '600' : 'normal',
                  boxShadow: actionFilter === 'all' ? 'var(--shadow-sm)' : 'none'
                }}
                onClick={() => setActionFilter('all')}
              >
                All
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.75rem',
                  borderRadius: '4px',
                  backgroundColor: actionFilter === 'cards' ? '#8b5cf6' : 'transparent',
                  color: actionFilter === 'cards' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: actionFilter === 'cards' ? '600' : 'normal'
                }}
                onClick={() => setActionFilter('cards')}
              >
                🗂️ Cards ({needsCards.length})
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.75rem',
                  borderRadius: '4px',
                  backgroundColor: actionFilter === 'drafts' ? '#b45309' : 'transparent',
                  color: actionFilter === 'drafts' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: actionFilter === 'drafts' ? '600' : 'normal'
                }}
                onClick={() => setActionFilter('drafts')}
              >
                🎙️ Drafts ({needsDrafting.length})
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.75rem',
                  borderRadius: '4px',
                  backgroundColor: actionFilter === 'publish' ? 'var(--danger-color)' : 'transparent',
                  color: actionFilter === 'publish' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: actionFilter === 'publish' ? '600' : 'normal'
                }}
                onClick={() => setActionFilter('publish')}
              >
                ⚡ Publish ({needsPublishing.length})
              </button>
            </div>
          </div>

          <div className="videos-list">
            {displayActionItems.map(item => {
              const borderLeftColor = item.type === 'cards' 
                ? '#8b5cf6' 
                : item.type === 'publish' 
                ? 'var(--danger-color)' 
                : 'var(--warning-color)';

              return (
                <div
                  key={`${item.type}-${item.code}`}
                  className="video-item"
                  style={{ borderLeft: `4px solid ${borderLeftColor}`, cursor: 'pointer', transition: 'all 0.15s ease' }}
                  onClick={() => setCurrentVideo(item.video)}
                >
                  <div className="video-header">
                    <strong>{item.code}: {item.title}</strong>
                    {item.type !== 'cards' && (
                      <span className={`badge ${item.badgeClass}`}>{item.badgeText}</span>
                    )}
                  </div>
                  <div className="video-meta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span>{item.message}</span>
                    {item.type === 'cards' && (
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginLeft: 'auto' }}>
                        <a
                          href={getObsidianUri(item.code)}
                          onClick={e => e.stopPropagation()}
                          className="btn btn-outline"
                          style={{
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                          title="Open script in Obsidian"
                        >
                          <ExternalLink size={12} /> Read OB
                        </a>
                        <button
                          type="button"
                          onClick={e => handleMarkCardsDone(e, item.video)}
                          className="btn"
                          style={{
                            padding: '0.2rem 0.6rem',
                            fontSize: '0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: '#8b5cf6',
                            color: '#fff',
                            border: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            cursor: 'pointer'
                          }}
                          title="Log cards completed in database"
                        >
                          <Check size={12} /> Cards Done
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {displayActionItems.length === 0 && (
              <p style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                You are ahead of schedule! No action items pending. 🎉
              </p>
            )}
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
};

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
        <VideoDetail video={currentVideo} onUpdate={fetchVideos} onBack={() => setCurrentVideo(null)} />
      ) : activeTab === 'pipeline' ? (
        renderDashboard()
      ) : (
        <AnalyticsSummary />
      )}
    </div>
  );
}

function VideoDetail({ video, onUpdate, onBack }) {
  const [localVideo, setLocalVideo] = useState(video);
  const [agentMessage, setAgentMessage] = useState(video.agent_message || '');
  const [transcript, setTranscript] = useState(video.raw_transcript || '');
  const [notes, setNotes] = useState(video.notes || '');
  const [newLogEntry, setNewLogEntry] = useState('');
  const [newCustomTask, setNewCustomTask] = useState('');
  const [checklistPhase, setChecklistPhase] = useState('All');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [videoPath, setVideoPath] = useState(null);

  const parseChecklist = (raw) => {
    if (!raw) return {};
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return {}; }
    }
    return raw;
  };

  const [checklist, setChecklist] = useState(() => parseChecklist(video.edit_checklist));

  const [filePropositions, setFilePropositions] = useState([]);

  // Fetch specific video path & propositions
  useEffect(() => {
    fetch('/video_paths.json')
      .then(res => res.json())
      .then(data => {
        if (data && data[video.code]) {
          setVideoPath(data[video.code]);
        }
      })
      .catch(console.error);

    fetch('/propositions.json')
      .then(res => res.json())
      .then(data => {
        if (data && data[video.code]) {
          setFilePropositions(data[video.code]);
        } else {
          setFilePropositions([]);
        }
      })
      .catch(() => setFilePropositions([]));
  }, [video.code]);

  const handleClearTranscript = async () => {
    if (!window.confirm("Clear raw transcript text from App? (It is safely preserved in Obsidian).")) return;
    setTranscript('');
    const { error } = await supabase
      .from('videos')
      .update({ raw_transcript: '' })
      .eq('video_number', localVideo.video_number);

    if (error) {
      alert("Error clearing transcript: " + error.message);
    } else {
      setLocalVideo(prev => ({ ...prev, raw_transcript: '' }));
      onUpdate();
    }
  };

  // Sync state if prop changes
  useEffect(() => {
    setLocalVideo(video);
    setAgentMessage(video.agent_message || '');
    setTranscript(video.raw_transcript || '');
    setNotes(video.notes || '');
    setChecklist(parseChecklist(video.edit_checklist));
  }, [video]);

  // Save all text fields (Notes, Transcript, Agent Message)
  const handleSaveText = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('videos')
      .update({
        agent_message: agentMessage,
        raw_transcript: transcript,
        notes: notes
      })
      .eq('video_number', localVideo.video_number);

    if (error) {
      alert("Error saving: " + error.message);
    } else {
      setLocalVideo(prev => ({
        ...prev,
        agent_message: agentMessage,
        raw_transcript: transcript,
        notes: notes
      }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      onUpdate();
    }
    setSaving(false);
  };

  // Quick Add Log Entry
  const handleAddLogEntry = async (e) => {
    if (e) e.preventDefault();
    if (!newLogEntry.trim()) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-CA');
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const formatted = `- [${dateStr} ${timeStr}] ${newLogEntry.trim()}`;
    const updatedNotes = notes.trim() ? `${formatted}\n${notes.trim()}` : formatted;

    setNotes(updatedNotes);
    setNewLogEntry('');

    const { error } = await supabase
      .from('videos')
      .update({ notes: updatedNotes })
      .eq('video_number', localVideo.video_number);

    if (error) {
      alert("Error adding log entry: " + error.message);
    } else {
      setLocalVideo(prev => ({ ...prev, notes: updatedNotes }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      onUpdate();
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    const { error } = await supabase
      .from('videos')
      .update({ status: newStatus })
      .eq('video_number', localVideo.video_number);

    if (error) alert("Error changing status: " + error.message);
    else {
      setLocalVideo(prev => ({ ...prev, status: newStatus }));
      onUpdate();
    }
  };

  // Toggle standard checklist item
  const toggleChecklist = async (key) => {
    const newChecklist = { ...checklist, [key]: !checklist[key] };
    setChecklist(newChecklist);

    const updatePayload = { edit_checklist: newChecklist };
    if (key === 'pub_cards') {
      const nextCardVal = !checklist[key];
      updatePayload.cards_created = nextCardVal;
      setLocalVideo(prev => ({ ...prev, cards_created: nextCardVal }));
    }

    const { error } = await supabase
      .from('videos')
      .update(updatePayload)
      .eq('video_number', localVideo.video_number);

    if (error) alert("Error saving checklist: " + error.message);
    else onUpdate();
  };

  // Toggle custom task
  const toggleCustomTask = async (taskId) => {
    const updatedCustom = (checklist.custom_tasks || []).map(t => 
      t.id === taskId ? { ...t, done: !t.done } : t
    );
    const newChecklist = { ...checklist, custom_tasks: updatedCustom };
    setChecklist(newChecklist);

    const { error } = await supabase
      .from('videos')
      .update({ edit_checklist: newChecklist })
      .eq('video_number', localVideo.video_number);

    if (error) alert("Error saving custom task: " + error.message);
    else onUpdate();
  };

  // Add custom task
  const handleAddCustomTask = async (e) => {
    if (e) e.preventDefault();
    if (!newCustomTask.trim()) return;

    const newTask = {
      id: 'task_' + Date.now(),
      label: newCustomTask.trim(),
      done: false
    };
    const updatedCustom = [...(checklist.custom_tasks || []), newTask];
    const newChecklist = { ...checklist, custom_tasks: updatedCustom };
    setChecklist(newChecklist);
    setNewCustomTask('');

    const { error } = await supabase
      .from('videos')
      .update({ edit_checklist: newChecklist })
      .eq('video_number', localVideo.video_number);

    if (error) alert("Error adding task: " + error.message);
    else onUpdate();
  };

  // Delete custom task
  const handleDeleteCustomTask = async (taskId) => {
    const updatedCustom = (checklist.custom_tasks || []).filter(t => t.id !== taskId);
    const newChecklist = { ...checklist, custom_tasks: updatedCustom };
    setChecklist(newChecklist);

    const { error } = await supabase
      .from('videos')
      .update({ edit_checklist: newChecklist })
      .eq('video_number', localVideo.video_number);

    if (error) alert("Error deleting task: " + error.message);
    else onUpdate();
  };

  const getStatusBadge = (status) => {
    const s = status ? status.replace('#', '') : 'idea';
    return <span className={`badge badge-${s}`}>{status}</span>;
  };

  // Format-aware checklist setup
  const isShort = localVideo.format_type === 'Short' || localVideo.code?.includes('-S');
  const baseChecklistItems = isShort ? SHORT_VIDEO_CHECKLIST_ITEMS : LONG_VIDEO_CHECKLIST_ITEMS;
  const availablePhases = isShort ? SHORT_CHECKLIST_PHASES : LONG_CHECKLIST_PHASES;

  const currentPhase = availablePhases.map(p => p.toLowerCase()).includes(checklistPhase.toLowerCase()) || checklistPhase === 'custom'
    ? checklistPhase
    : 'All';

  // Checklist Calculations
  const customTasks = checklist.custom_tasks || [];
  const totalStandard = baseChecklistItems.length;
  const completedStandard = baseChecklistItems.filter(item => !!checklist[item.key]).length;
  const totalCustom = customTasks.length;
  const completedCustom = customTasks.filter(t => !!t.done).length;

  const totalTasks = totalStandard + totalCustom;
  const completedTasks = completedStandard + completedCustom;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Filter items based on active phase tab
  const filteredStandardItems = currentPhase === 'All'
    ? baseChecklistItems
    : baseChecklistItems.filter(item => item.phase.toLowerCase() === currentPhase.toLowerCase());

  const showCustomTasks = currentPhase === 'All' || currentPhase.toLowerCase() === 'custom';

  // Core Clinical Propositions
  const propositions = (checklist.propositions && Array.isArray(checklist.propositions) && checklist.propositions.length > 0)
    ? checklist.propositions
    : filePropositions;
  const hasPropositions = propositions && propositions.length > 0;

  const renderPropositionItem = (propText, index) => {
    const jdexMatch = typeof propText === 'string' ? propText.match(/\[\[(.*?)\]\]/) : null;
    const cleanText = typeof propText === 'string' ? propText.replace(/\[\[.*?\]\]/, '').trim() : String(propText);
    const jdexTag = jdexMatch ? jdexMatch[1] : null;

    return (
      <div 
        key={index}
        style={{
          padding: '0.75rem 0.9rem',
          backgroundColor: 'var(--bg-color)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem'
        }}
      >
        <div style={{ fontSize: '0.88rem', lineHeight: '1.5', color: 'var(--text-primary)' }}>
          {cleanText}
        </div>
        {jdexTag && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span 
              style={{
                fontSize: '0.72rem',
                fontWeight: '600',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                backgroundColor: '#8b5cf618',
                color: '#8b5cf6',
                border: '1px solid #8b5cf635'
              }}
            >
              🗂️ {jdexTag}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="card" style={{ maxWidth: '840px', margin: '0 auto', width: '100%' }}>
      
      {/* Detail Header */}
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          {onBack && (
            <button 
              className="btn btn-outline" 
              onClick={onBack}
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
            >
              <ChevronLeft size={14} /> Back to Pipeline
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
            <a
              href={videoPath 
                ? `obsidian://open?vault=SystemizedHealth_Vault&file=${videoPath.split('/').map(encodeURIComponent).join('/')}` 
                : `obsidian://search?vault=SystemizedHealth_Vault&query=${encodeURIComponent(`"${localVideo.code}"`)}`}
              className="btn btn-outline"
              style={{ textDecoration: 'none', padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
            >
              <ExternalLink size={14} /> Open in Obsidian
            </a>
            {getStatusBadge(localVideo.status)}
          </div>
        </div>

        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', lineHeight: '1.3' }}>
          {localVideo.code}: {localVideo.title}
        </h2>

        <div style={{ display: 'flex', gap: '0.75rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span><strong>Format:</strong> {localVideo.format_type}</span>
          <span><strong>Drop Date:</strong> {localVideo.drop_date || 'TBD'}</span>
          {localVideo.vidiq_title_score > 0 && (
            <span><strong>vidIQ Score:</strong> <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>{localVideo.vidiq_title_score}</span>/100</span>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
            <Tag size={16} />
            <select
              value={localVideo.status}
              onChange={handleStatusChange}
              style={{ padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', fontWeight: '500' }}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* 1. Production Checklist Section (Per-Video in Supabase) */}
        <div className="checklist-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.15rem' }}>
              <CheckSquare size={20} color="var(--success-color)" /> {isShort ? 'Shorts Checklist (Descript → Upload)' : 'Long Video Production Checklist'}
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
              {completedTasks} of {totalTasks} completed ({progressPercent}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
          </div>

          {/* Phase Filter Pills */}
          <div className="checklist-filter-bar">
            {availablePhases.map(phase => (
              <button
                key={phase}
                type="button"
                className={`phase-pill ${currentPhase.toLowerCase() === phase.toLowerCase() ? 'active' : ''}`}
                onClick={() => setChecklistPhase(phase)}
              >
                {phase}
              </button>
            ))}
            {customTasks.length > 0 && (
              <button
                type="button"
                className={`phase-pill ${currentPhase.toLowerCase() === 'custom' ? 'active' : ''}`}
                onClick={() => setChecklistPhase('custom')}
              >
                Custom ({customTasks.length})
              </button>
            )}
          </div>

          {/* Standard Checklist Items */}
          <div className="checklist">
            {filteredStandardItems.map(item => (
              <label key={item.key} className={`checklist-item ${checklist[item.key] ? 'checked' : ''}`} style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!checklist[item.key]}
                  onChange={() => toggleChecklist(item.key)}
                />
                <span className="phase-tag">{item.phase}</span>
                <span className="checklist-label">{item.label}</span>
              </label>
            ))}

            {/* Custom Tasks for this video */}
            {showCustomTasks && customTasks.map(task => (
              <div key={task.id} className={`checklist-item ${task.done ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={!!task.done}
                  onChange={() => toggleCustomTask(task.id)}
                />
                <span className="phase-tag" style={{ background: '#8b5cf620', color: '#8b5cf6', borderColor: '#8b5cf640' }}>CUSTOM</span>
                <span className="checklist-label">{task.label}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteCustomTask(task.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.2rem' }}
                  title="Delete custom task"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Add Custom Task Form */}
          <form onSubmit={handleAddCustomTask} className="custom-task-input">
            <input
              type="text"
              value={newCustomTask}
              onChange={(e) => setNewCustomTask(e.target.value)}
              placeholder="Add video-specific task (e.g. Draw spine disc diagram)..."
            />
            <button type="submit" className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
              <Plus size={14} /> Add Task
            </button>
          </form>
        </div>

        {/* 2. Video Production Log & Notes Section (Stored in Supabase notes) */}
        <div className="log-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.15rem' }}>
              <FileText size={20} color="var(--accent-color)" /> Video Production Log & Notes
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Synced in Supabase across devices
            </span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Add quick timestamped notes or log progress from your phone, iPad, or desktop.
          </p>

          {/* Quick Add Log Entry */}
          <form onSubmit={handleAddLogEntry} className="log-quick-input">
            <input
              type="text"
              value={newLogEntry}
              onChange={(e) => setNewLogEntry(e.target.value)}
              placeholder="Add quick update (e.g. Filmed A-roll on camera, pacing was solid)..."
            />
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> Add Entry
            </button>
          </form>

          {/* Full Notes / Log Textarea */}
          <textarea
            className="log-textarea"
            rows={7}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="No log entries yet. Use the quick entry box above or type production notes directly here..."
          />
        </div>

        {/* 3. Core Clinical Propositions (Zettelkasten / JDex) & Spoken Transcript */}
        {hasPropositions ? (
          <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.15rem' }}>
                <Lightbulb size={20} color="#eab308" /> Core Clinical Propositions ({propositions.length})
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Zettelkasten & JDex Mined
              </span>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              {propositions.map((p, idx) => renderPropositionItem(p, idx))}
            </div>

            {/* Clean Script Archive Notice & Collapsed Raw Transcript */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '500' }}>
                  <CheckCircle2 size={16} /> Final script archived in Obsidian
                </span>
                <a
                  href={videoPath 
                    ? `obsidian://open?vault=SystemizedHealth_Vault&file=${videoPath.split('/').map(encodeURIComponent).join('/')}` 
                    : `obsidian://search?vault=SystemizedHealth_Vault&query=${encodeURIComponent(`"${localVideo.code}"`)}`}
                  className="btn btn-outline"
                  style={{ textDecoration: 'none', padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                >
                  <ExternalLink size={12} /> Open Full Script in Obsidian
                </a>
              </div>

              {/* Collapsed Raw Transcript (Keeps page clean while allowing view/edit/clear) */}
              <details style={{ marginTop: '0.25rem' }}>
                <summary style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
                  {transcript ? 'View / Edit Ingested Raw Transcript' : 'Add / Paste Ingested Transcript'}
                </summary>
                <div style={{ marginTop: '0.5rem' }}>
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    style={{ width: '100%', height: '120px', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontFamily: 'inherit', fontSize: '0.85rem', resize: 'vertical' }}
                    placeholder="Raw transcript..."
                  />
                  {transcript && (
                    <div style={{ marginTop: '0.4rem', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={handleClearTranscript}
                        className="btn btn-outline"
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
                      >
                        <Trash2 size={12} /> Clear Raw Transcript from App
                      </button>
                    </div>
                  )}
                </div>
              </details>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
                {localVideo.status === '#idea' || localVideo.status === '#write'
                  ? 'Raw Audio Brainstorm / Draft Transcript'
                  : 'Final Spoken Transcript (Descript)'}
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              {localVideo.status === '#idea' || localVideo.status === '#write'
                ? 'Paste audio dictation or early notes here.'
                : 'Paste your exact spoken transcript from Descript. Antigravity reads this to score titles (vidIQ), archive the script to Obsidian, and pull out core clinical propositions.'}
            </p>

            {/* Pre-recording outline reference (collapsible if in edit) */}
            {localVideo.rough_outline && (
              <details style={{ marginBottom: '0.75rem' }} open={localVideo.status === '#idea' || localVideo.status === '#write'}>
                <summary style={{ fontSize: '0.85rem', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: '600', marginBottom: '0.4rem' }}>
                  Pre-Recording Outline Reference
                </summary>
                <div style={{ backgroundColor: 'var(--bg-color)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', whiteSpace: 'pre-wrap', fontSize: '0.85rem', lineHeight: '1.5' }}>
                  {localVideo.rough_outline}
                </div>
              </details>
            )}

            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              style={{ width: '100%', height: '180px', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontFamily: 'inherit', resize: 'vertical' }}
              placeholder="Paste transcript here..."
            />
          </div>
        )}

        {/* 4. Message to Agent (Antigravity) */}
        <div>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Message to Agent (Antigravity)</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Direct instructions or tasks for Antigravity (stored in Supabase <code>agent_message</code>).
          </p>
          <textarea
            value={agentMessage}
            onChange={(e) => setAgentMessage(e.target.value)}
            style={{ width: '100%', height: '80px', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontFamily: 'inherit', resize: 'vertical' }}
            placeholder="e.g., 'Score 5 titles in vidIQ and extract 3 waterfall shorts...'"
          />
        </div>

        {/* 5. Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleSaveText} disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving to Supabase...' : 'Save All Text Fields'}
          </button>

          {saveSuccess && (
            <span style={{ color: 'var(--success-color)', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle2 size={18} /> Saved to Supabase!
            </span>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;

const RankChangeBadge = ({ rankChange }) => {
  if (rankChange === null || rankChange === undefined) return <span style={{ fontSize: '0.75rem', color: '#52525b' }}>-</span>;
  if (rankChange > 0) return <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>↑ {rankChange}</span>;
  if (rankChange < 0) return <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>↓ {Math.abs(rankChange)}</span>;
  return <span style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>-</span>;
};

function AnalyticsSummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/analytics.json')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching analytics json:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading Analytics Dashboard...</p>;
  if (!data) return <p>Failed to load Analytics Summary. Ensure scripts/generate_analytics_reports.py has run successfully.</p>;

  const s_28d = data.stats_28d || {};

  return (
    <div className="analytics-dashboard" style={{ marginTop: '1.5rem' }}>
      
      {/* 28-Day Performance */}
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>📅 28-Day Performance</h2>
      <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="metric-card" style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Eye size={16} color="var(--accent-color)" />
            <span className="metric-label" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '600' }}>28-Day Views</span>
          </div>
          <span className="metric-value" style={{ fontSize: '2rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>{(s_28d.views || 0).toLocaleString()}</span>
        </div>
        
        <div className="metric-card" style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <ThumbsUp size={16} color="#ec4899" />
            <span className="metric-label" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '600' }}>28-Day Likes</span>
          </div>
          <span className="metric-value" style={{ fontSize: '2rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>{(s_28d.likes || 0).toLocaleString()}</span>
        </div>
        
        <div className="metric-card" style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Users size={16} color="var(--success-color)" />
            <span className="metric-label" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '600' }}>28-Day Subs</span>
          </div>
          <span className="metric-value" style={{ fontSize: '2rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>+{(s_28d.subs || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Top 10 Lists */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        
        {/* Top 10 Shorts */}
        <div className="top-10-container" style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <div className="top-10-header" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Flame size={24} color="#ff416c" />
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>Top 10 Shorts</h2>
          </div>
          <div className="top-10-list">
            {(data.top_10_shorts || []).map((v, index) => (
              <div key={index} className="top-10-item hover-scale" style={{ padding: '0.75rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
                <span className="top-10-rank" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-color)', width: '30px' }}>#{index + 1}</span>
                <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '500' }}>{v.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{(v.views || 0).toLocaleString()} views</div>
                </div>
                <RankChangeBadge rankChange={v.rank_change} />
              </div>
            ))}
            {(data.top_10_shorts || []).length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No shorts data available.</p>}
          </div>
        </div>

        {/* Top 10 Longs */}
        <div className="top-10-container" style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <div className="top-10-header" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={24} color="#a855f7" />
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>Top 10 Longs</h2>
          </div>
          <div className="top-10-list">
            {(data.top_10_longs || []).map((v, index) => (
              <div key={index} className="top-10-item hover-scale" style={{ padding: '0.75rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
                <span className="top-10-rank" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#a855f7', width: '30px' }}>#{index + 1}</span>
                <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '500' }}>{v.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{(v.views || 0).toLocaleString()} views</div>
                </div>
                <RankChangeBadge rankChange={v.rank_change} />
              </div>
            ))}
            {(data.top_10_longs || []).length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No longs data available.</p>}
          </div>
        </div>

      </div>

      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2rem' }}>
        Dashboard generated from live database. Last synced: {data.updated_at_str}
      </p>
    </div>
  );
}
