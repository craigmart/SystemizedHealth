import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { 
  Calendar, CheckSquare, AlertCircle, RefreshCw, ChevronLeft, Save, Tag, 
  TrendingUp, Clock, FileVideo, Scissors, Film, X, ExternalLink, BarChart2, 
  LayoutDashboard, Eye, Users, Award, Flame, BookOpen, Check, ThumbsUp, 
  MessageSquare, Plus, Trash2, ListTodo, FileText, CheckCircle2, Lightbulb, Link 
} from 'lucide-react';
import { addDays, isBefore, parseISO, differenceInDays, format } from 'date-fns';
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
  { key: 'short_card', phase: 'Writing', label: 'Create 3x5 card' },
  { key: 'short_outline', phase: 'Writing', label: 'Write script outline (back of card)' },
  { key: 'short_film', phase: 'Filming', label: 'Film short video' },
  { key: 'short_descript', phase: 'Editing', label: 'Edited in Descript (captions, audio)' },
  { key: 'edit_transcript', phase: 'Editing', label: 'Descript transcript pasted' },
  { key: 'edit_vidiq', phase: 'Editing', label: 'vidIQ title/hook scored (90+)' },
  { key: 'edit_obsidian', phase: 'Editing', label: 'Obsidian & JDex archived' },
  { key: 'pub_upload', phase: 'Publishing', label: 'YouTube Shorts upload & CTA' },
  { key: 'pub_schedule', phase: 'Publishing', label: 'Scheduled for drop date' },
  { key: 'pub_cards', phase: 'Archived', label: 'Physical 3x5 cards filed' },
];

export const LONG_CHECKLIST_PHASES = ['All', 'Planning', 'Filming', 'Editing', 'Publishing', 'Archived'];
export const SHORT_CHECKLIST_PHASES = ['All', 'Writing', 'Filming', 'Editing', 'Publishing', 'Archived'];

const STATUS_OPTIONS = ['#idea', '#write', '#film', '#edit', '#uploaded', '#published'];

function App() {
  const [videos, setVideos] = useState([]);
  const [videoPaths, setVideoPaths] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [metricModal, setMetricModal] = useState(null);
  const [activeTab, setActiveTab] = useState('pipeline');

  const openVideo = (video, pushHistory = true) => {
    if (!video) return;
    setCurrentVideo(video);
    if (pushHistory && video.code) {
      const url = new URL(window.location.href);
      url.searchParams.set('video', video.code);
      window.history.pushState({ videoCode: video.code }, '', url.toString());
    }
  };

  const closeVideo = (pushHistory = true) => {
    setCurrentVideo(null);
    if (pushHistory) {
      const url = new URL(window.location.href);
      url.searchParams.delete('video');
      url.searchParams.delete('code');
      url.searchParams.delete('v');
      window.history.pushState({}, '', url.toString());
    }
  };

  const fetchVideos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('video_number', { ascending: true });

    if (error) console.error("Error fetching videos:", error);
    else {
      const list = data || [];
      setVideos(list);

      // Deep link support from URL params (e.g. ?video=80.V1B2-S2)
      const params = new URLSearchParams(window.location.search);
      const targetParam = params.get('video') || params.get('code') || params.get('v') || window.location.hash.replace(/^#/, '');

      if (targetParam) {
        const found = list.find(v => 
          v.code?.toLowerCase() === targetParam.toLowerCase() ||
          v.video_number === targetParam ||
          v.id === targetParam
        );
        if (found) {
          setCurrentVideo(found);
        }
      } else if (currentVideo) {
        const updated = list.find(v => v.id === currentVideo.id);
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

  // Handle browser Back / Forward buttons for deep linked videos
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const targetParam = params.get('video') || params.get('code') || params.get('v');
      if (targetParam && videos.length > 0) {
        const found = videos.find(v => 
          v.code?.toLowerCase() === targetParam.toLowerCase() ||
          v.video_number === targetParam ||
          v.id === targetParam
        );
        if (found) {
          setCurrentVideo(found);
          return;
        }
      }
      setCurrentVideo(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [videos]);

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

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const getDistanceToToday = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') return 999999;
    const d = parseISO(dateStr);
    if (isNaN(d.getTime())) return 999999;
    d.setHours(0, 0, 0, 0);
    const diffDays = differenceInDays(d, todayDate);
    return diffDays >= 0 ? diffDays : Math.abs(diffDays) + 0.1;
  };

  const sortByClosestDropDate = (a, b) => {
    const distA = getDistanceToToday(a.drop_date);
    const distB = getDistanceToToday(b.drop_date);

    if (distA !== distB) {
      return distA - distB;
    }

    // Tie-breaker: status urgency (#edit > #film > #write > #idea > #published)
    const statusOrder = { '#edit': 1, '#film': 2, '#write': 3, '#idea': 4, '#published': 5 };
    const orderA = statusOrder[a.status] || 99;
    const orderB = statusOrder[b.status] || 99;
    if (orderA !== orderB) return orderA - orderB;

    return (a.code || '').localeCompare(b.code || '');
  };

  const sortByDropDate = (a, b) => {
    const hasDateA = !!a.drop_date && typeof a.drop_date === 'string' && a.drop_date.trim() !== '';
    const hasDateB = !!b.drop_date && typeof b.drop_date === 'string' && b.drop_date.trim() !== '';

    if (!hasDateA && !hasDateB) return 0;
    if (!hasDateA) return 1;
    if (!hasDateB) return -1;

    const timeA = parseISO(a.drop_date).getTime();
    const timeB = parseISO(b.drop_date).getTime();

    if (isNaN(timeA) && isNaN(timeB)) return 0;
    if (isNaN(timeA)) return 1;
    if (isNaN(timeB)) return -1;

    if (timeA !== timeB) {
      return timeA - timeB; // Chronological drop date
    }

    // Tie-breaker: status urgency (#edit > #film > #write > #idea)
    const statusOrder = { '#edit': 1, '#film': 2, '#write': 3, '#idea': 4 };
    const orderA = statusOrder[a.status] || 99;
    const orderB = statusOrder[b.status] || 99;
    if (orderA !== orderB) return orderA - orderB;

    return (a.code || '').localeCompare(b.code || '');
  };

  const getStatusBadge = (status) => {
    if (status === '#unscheduled') {
      return <span className="badge badge-unscheduled">Open Slot</span>;
    }
    const s = status ? status.replace('#', '') : 'idea';
    return <span className={`badge badge-${s}`}>{status}</span>;
  };

  const getBorderColor = (video) => {
    if (!video) return 'var(--border-color)';
    switch (video.status) {
      case '#edit': return '#7e22ce';
      case '#film': return 'var(--danger-color)';
      case '#write': return '#b45309';
      case '#idea': return '#64748b';
      case '#uploaded': return 'var(--success-color)';
      case '#published': return '#8b5cf6';
      default: return 'var(--border-color)';
    }
  };

  const parseChecklistData = (raw) => {
    if (!raw) return {};
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return {}; }
    }
    return raw;
  };

  const getNextStepDue = (video) => {
    if (!video) return { step: 'Review next step', type: 'info' };

    // 1. Agent message
    if (video.agent_message && video.agent_message.trim()) {
      return { step: `Agent Note: "${video.agent_message.trim()}"`, type: 'agent' };
    }

    const isShort = video.format_type === 'Short' || video.code?.includes('-S');
    const checklist = parseChecklistData(video.edit_checklist);

    // 2. Published videos needing physical cards
    if (video.status === '#published') {
      if (!video.cards_created && !video.code?.startsWith('HIST')) {
        return { step: 'Review propositions & add to 3x5 cards', type: 'cards', actionType: 'cards' };
      }
      return { step: 'Completed & published', type: 'done' };
    }

    // 3. Uploaded videos
    if (video.status === '#uploaded') {
      return { step: 'Confirm YouTube Studio release', type: 'publish' };
    }

    // 4. Editing videos (#edit)
    if (video.status === '#edit') {
      if (!video.raw_transcript || !video.raw_transcript.trim()) {
        return { step: 'Paste Descript transcript into App', type: 'action' };
      }

      const items = isShort ? SHORT_VIDEO_CHECKLIST_ITEMS : LONG_VIDEO_CHECKLIST_ITEMS;
      for (const item of items) {
        if (item.key === 'pub_cards') continue;
        if (item.phase === 'Planning' || item.phase === 'Writing' || item.phase === 'Filming') continue;
        if (!checklist[item.key]) {
          return { step: item.label, type: 'checklist' };
        }
      }

      if (checklist.custom_tasks && Array.isArray(checklist.custom_tasks)) {
        const pendingCustom = checklist.custom_tasks.find(t => !t.done);
        if (pendingCustom) {
          return { step: pendingCustom.label, type: 'custom' };
        }
      }

      return { step: 'Ready to upload (#uploaded)', type: 'action' };
    }

    // 5. Filming videos (#film)
    if (video.status === '#film') {
      if (isShort && !checklist.short_film) {
        return { step: 'Film short video', type: 'checklist' };
      }
      return { step: 'Film direct-to-camera', type: 'action' };
    }

    // 6. Writing videos (#write)
    if (video.status === '#write') {
      if (isShort) {
        if (!checklist.short_card) return { step: 'Create 3x5 card', type: 'checklist' };
        if (!checklist.short_outline) return { step: 'Write script outline (back of card)', type: 'checklist' };
        return { step: 'Ready to film (#film)', type: 'action' };
      }
      if (video.notes && (video.notes.toLowerCase().includes('card') || video.notes.toLowerCase().includes('3x5'))) {
        return { step: 'Finish 3x5 card & advance to #film', type: 'action' };
      }
      return { step: 'Draft 3x5 card (4 Beats)', type: 'action' };
    }

    // 7. Idea videos (#idea)
    if (video.status === '#idea') {
      if (video.title === 'Placeholder' || video.code?.startsWith('TBD')) {
        return { step: 'Topic research in Gemini Notebook', type: 'action' };
      }
      return { step: 'Outline 4 beats on 3x5 card', type: 'action' };
    }

    return { step: 'Review next step', type: 'info' };
  };

  const getRelativeUrgency = (dropDateStr) => {
    if (!dropDateStr) return null;
    const dropDate = parseISO(dropDateStr);
    dropDate.setHours(0, 0, 0, 0);
    const diffDays = differenceInDays(dropDate, todayDate);
    if (diffDays < 0) return { label: 'Past due', color: 'var(--danger-color)' };
    if (diffDays === 0) return { label: 'Today', color: 'var(--danger-color)' };
    if (diffDays === 1) return { label: 'Tomorrow', color: 'var(--danger-color)' };
    if (diffDays <= 3) return { label: `${diffDays}d away`, color: '#b45309' };
    if (diffDays <= 7) return { label: `${diffDays}d away`, color: 'var(--accent-color)' };
    return { label: `${diffDays}d away`, color: 'var(--text-secondary)' };
  };

  const getVideoProgress = (video) => {
    if (!video) return { completed: 0, total: 0, percent: 0 };
    
    if (video.status === '#published' && video.cards_created) {
      return { completed: 1, total: 1, percent: 100 };
    }

    const isShort = video.format_type === 'Short' || video.code?.includes('-S');
    const baseItems = isShort ? SHORT_VIDEO_CHECKLIST_ITEMS : LONG_VIDEO_CHECKLIST_ITEMS;
    const checklist = parseChecklistData(video.edit_checklist);
    const customTasks = checklist.custom_tasks || [];

    let completed = 0;
    baseItems.forEach(item => {
      if (item.key === 'pub_cards' && video.cards_created) {
        completed++;
      } else if (item.key === 'edit_transcript' && (checklist.edit_transcript || (video.raw_transcript && video.raw_transcript.trim()))) {
        completed++;
      } else if (checklist[item.key]) {
        completed++;
      } else if (video.status === '#published' && item.key !== 'pub_cards') {
        completed++;
      } else if (video.status === '#uploaded' && item.key !== 'pub_cards') {
        completed++;
      } else if (video.status === '#edit' && (item.phase === 'Planning' || item.phase === 'Writing' || item.phase === 'Filming')) {
        completed++;
      } else if (video.status === '#film' && (item.phase === 'Planning' || item.phase === 'Writing')) {
        completed++;
      }
    });

    const completedCustom = customTasks.filter(t => !!t.done).length;
    const total = baseItems.length + customTasks.length;
    const finalCompleted = completed + completedCustom;
    const percent = total > 0 ? Math.round((finalCompleted / total) * 100) : 0;

    return { completed: finalCompleted, total, percent };
  };

  // Metrics Calculation
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
    // 1. Build 3-Week Pipeline (21 days out) with automatic placeholders for expected release days (Mon, Tue, Thu, Sat)
    const pipelineItems = [];
    const videosByDate = {};
    videos.forEach(v => {
      if (v.drop_date) {
        if (!videosByDate[v.drop_date]) videosByDate[v.drop_date] = [];
        videosByDate[v.drop_date].push(v);
      }
    });

    for (let i = 0; i <= 21; i++) {
      const day = addDays(todayDate, i);
      day.setHours(0, 0, 0, 0);
      const isoDate = format(day, 'yyyy-MM-dd');
      const dayOfWeek = day.getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
      const isExpectedReleaseDay = dayOfWeek === 1 || dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 6;
      const expectedFormat = dayOfWeek === 1 ? 'Long' : 'Short';

      const scheduledVideos = videosByDate[isoDate] || [];

      if (scheduledVideos.length > 0) {
        scheduledVideos.forEach(v => {
          pipelineItems.push({
            isPlaceholder: false,
            video: v,
            code: v.code,
            title: v.title,
            status: v.status,
            drop_date: v.drop_date,
            dayFormatted: format(day, 'EEE, MMM d'),
            notes: v.notes,
            format_type: v.format_type
          });
        });
      } else if (isExpectedReleaseDay) {
        pipelineItems.push({
          isPlaceholder: true,
          code: 'OPEN SLOT',
          title: `No video scheduled (Expected ${expectedFormat})`,
          status: '#unscheduled',
          drop_date: isoDate,
          dayFormatted: format(day, 'EEE, MMM d'),
          expectedFormat
        });
      }
    }

    // 2. Build Work in Progress:
    // - Active production stages: #write, #film, #edit, and active #idea (excluding unstarted placeholders)
    // - Published videos needing propositions reviewed & filed in Zettelkasten: #published with !cards_created (excluding HIST)
    // - Sorted by drop date closest to today at the top
    const workInProgressItems = videos.filter(v => {
      if (v.code?.startsWith('HIST')) return false;

      // Published videos where cards still need to be reviewed/created belong in WIP
      if (v.status === '#published') {
        return !v.cards_created;
      }

      if (v.status === '#uploaded') return false;

      // Exclude unstarted placeholder slots
      const isPlaceholder = v.title === 'Placeholder' || (v.code?.startsWith('TBD') && v.status === '#idea');
      if (isPlaceholder) return false;

      // Must be active in production
      return v.status === '#write' || v.status === '#film' || v.status === '#edit' || (v.status === '#idea' && v.title && v.title !== 'Placeholder');
    }).sort(sortByClosestDropDate);

    return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Metrics Bar */}
      <div className="metrics-grid">
        <div className="card metric-tile" onClick={() => openModal('Upcoming Runway (Unfinished)', unfinishedFuture)}>
          <div style={{ backgroundColor: daysAhead >= 21 ? 'var(--success-color)' : 'var(--danger-color)', color: '#fff', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Days Ahead</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', lineHeight: '1.2' }}>{daysAhead}</div>
          </div>
        </div>

        <div className="card metric-tile" onClick={() => openModal('Writing', writingVideos)}>
          <div style={{ backgroundColor: '#b45309', color: '#fff', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
            <Scissors size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Writing</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', lineHeight: '1.2' }}>{writingVideos.length}</div>
          </div>
        </div>

        <div className="card metric-tile" onClick={() => openModal('Filming', readyToFilmVideos)}>
          <div style={{ backgroundColor: 'var(--danger-color)', color: '#fff', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
            <Film size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Filming</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', lineHeight: '1.2' }}>{readyToFilmVideos.length}</div>
          </div>
        </div>

        <div className="card metric-tile" onClick={() => openModal('Editing', editingVideos)}>
          <div style={{ backgroundColor: '#7e22ce', color: '#fff', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Editing</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', lineHeight: '1.2' }}>{editingVideos.length}</div>
          </div>
        </div>

        <div className="card metric-tile" onClick={() => openModal('All Scheduled Videos', videos.filter(v => v.drop_date))}>
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
        {/* Column 1: Pipeline (Next 3 Weeks) */}
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Calendar size={20} color="var(--accent-color)" /> Pipeline (Next 3 Weeks)
          </h2>
          <div className="videos-list">
            {pipelineItems.map((item, idx) => {
              if (item.isPlaceholder) {
                return (
                  <div
                    key={`placeholder-${item.drop_date}-${idx}`}
                    className="video-item placeholder"
                  >
                    <div className="video-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <strong style={{ color: '#d97706', fontSize: '0.85rem' }}>⏳ {item.code}</strong>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="video-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>{item.title}</span>
                      <span style={{ marginLeft: 'auto', fontWeight: 'bold' }}>{item.dayFormatted}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={`${item.code}-${item.drop_date}`}
                  className={`video-item video-item-${item.status ? item.status.replace('#', '') : ''}`}
                  style={{ cursor: 'pointer', borderLeft: `5px solid ${getBorderColor(item.video)}` }}
                  onClick={() => openVideo(item.video)}
                >
                  <div className="video-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <strong>{item.code}</strong>
                      {item.notes && <span title="Production Log" style={{ fontSize: '0.75rem' }}>📝</span>}
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="video-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '500' }}>{item.title}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 'bold' }}>{item.dayFormatted}</span>
                  </div>
                </div>
              );
            })}
            {pipelineItems.length === 0 && (
              <p style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No drop dates found in the next 3 weeks.
              </p>
            )}
          </div>
        </div>

        {/* Column 2: Work in Progress (Unified Column) */}
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <ListTodo size={20} color="var(--accent-color)" /> Work in Progress ({workInProgressItems.length})
          </h2>

          <div className="videos-list">
            {workInProgressItems.map(item => {
              const nextStep = getNextStepDue(item);
              const urgency = getRelativeUrgency(item.drop_date);
              const borderLeftColor = getBorderColor(item);
              const itemProgress = getVideoProgress(item);

              return (
                <div
                  key={`wip-${item.code}`}
                  className={`video-item video-item-${item.status ? item.status.replace('#', '') : ''}`}
                  style={{ borderLeft: `5px solid ${borderLeftColor}`, cursor: 'pointer' }}
                  onClick={() => openVideo(item)}
                >
                  <div className="video-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <strong>{item.code}: {item.title}</strong>
                      {item.notes && <span title="Production Log" style={{ fontSize: '0.75rem' }}>📝</span>}
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  <div className="video-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '500' }}>
                      {item.drop_date ? format(parseISO(item.drop_date), 'EEE, MMM d') : 'No Date'}
                    </span>
                    {urgency && (
                      <span style={{ color: urgency.color, fontWeight: '700', fontSize: '0.72rem' }}>
                        {urgency.label}
                      </span>
                    )}
                  </div>

                  {/* Individual Video Percentage Done Graphic - Minimal & Clean */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.15rem', marginBottom: '0.1rem' }}>
                    <div style={{ flex: 1, background: 'rgba(0, 0, 0, 0.08)', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${itemProgress.percent}%`, 
                          background: itemProgress.percent === 100 
                            ? 'var(--success-color)' 
                            : itemProgress.percent >= 50 
                            ? 'linear-gradient(90deg, #0ea5e9, #10b981)' 
                            : '#f59e0b', 
                          height: '100%', 
                          borderRadius: '9999px',
                          transition: 'width 0.3s ease' 
                        }} 
                      />
                    </div>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: '700', 
                      minWidth: '32px', 
                      textAlign: 'right',
                      color: itemProgress.percent === 100 ? 'var(--success-color)' : itemProgress.percent >= 75 ? 'var(--accent-color)' : 'var(--text-secondary)'
                    }}>
                      {itemProgress.percent}%
                    </span>
                  </div>

                  <div className="next-step-box">
                    <span style={{ flex: 1, minWidth: '180px' }}>{nextStep.step}</span>
                    {nextStep.actionType === 'cards' && (
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <a
                          href={getObsidianUri(item.code)}
                          className="btn btn-outline"
                          style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', height: 'auto', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          onClick={e => e.stopPropagation()}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink size={12} /> Read OB
                        </a>
                        <button
                          className="btn btn-primary"
                          style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', height: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          onClick={e => handleMarkCardsDone(e, item)}
                        >
                          <CheckSquare size={12} /> Cards Done
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {workInProgressItems.length === 0 && (
              <p style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No active work in progress. All videos are up to date! 🎉
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
                  <div key={v.code} className="video-item" style={{ cursor: 'pointer' }} onClick={() => { openVideo(v); setMetricModal(null); }}>
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
          <button className="btn btn-outline" onClick={() => closeVideo()}>
            <ChevronLeft size={16} />
            Back to Dashboard
          </button>
        )}
      </header>

      {loading && !currentVideo ? (
        <p>Loading pipeline data...</p>
      ) : currentVideo ? (
        <VideoDetail video={currentVideo} onUpdate={fetchVideos} onBack={() => closeVideo()} />
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

  const extractUrls = (text) => {
    if (!text || typeof text !== 'string') return [];
    const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s]|www\.[^\s<]+[^<.,:;"')\]\s])/gi;
    const matches = text.match(urlRegex) || [];
    const seen = new Set();
    const result = [];
    matches.forEach(m => {
      const trimmed = m.trim();
      const href = trimmed.startsWith('www.') ? `https://${trimmed}` : trimmed;
      if (!seen.has(href)) {
        seen.add(href);
        let label = trimmed;
        try {
          const parsed = new URL(href);
          const domain = parsed.hostname.replace(/^www\./, '');
          const path = parsed.pathname === '/' ? '' : parsed.pathname;
          label = domain + path;
          if (label.length > 40) {
            label = label.substring(0, 37) + '...';
          }
        } catch {
          if (label.length > 40) {
            label = label.substring(0, 37) + '...';
          }
        }
        result.push({ raw: trimmed, href, label });
      }
    });
    return result;
  };

  const [checklist, setChecklist] = useState(() => parseChecklist(video.edit_checklist));

  const [filePropositions, setFilePropositions] = useState([]);
  const detectedUrls = extractUrls(notes);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyDeepLink = async () => {
    const deepLink = `${window.location.origin}${window.location.pathname}?video=${encodeURIComponent(localVideo.code || video.code)}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(deepLink);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = deepLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.error("Failed to copy deep link:", err);
      prompt("Copy deep link for Workflowy:", deepLink);
    }
  };

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

          {/* Detected Clickable Links from Production Log */}
          {detectedUrls.length > 0 && (
            <div className="log-links-container">
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ExternalLink size={13} color="var(--accent-color)" /> Links in Log ({detectedUrls.length}):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {detectedUrls.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                    style={{
                      fontSize: '0.78rem',
                      padding: '0.25rem 0.65rem',
                      height: 'auto',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: 'var(--surface-color)',
                      borderColor: 'var(--accent-color)',
                      color: 'var(--accent-color)',
                      fontWeight: '500'
                    }}
                    title={`Open ${link.href}`}
                  >
                    <ExternalLink size={12} />
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--success-color)', fontWeight: '500' }}>
              {saveSuccess ? '✓ Notes saved to Supabase' : ''}
            </span>
            <button 
              type="button" 
              className="btn btn-outline" 
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', height: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              onClick={handleSaveText}
              disabled={saving}
            >
              <Save size={13} /> Save Notes
            </button>
          </div>
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
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
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

          <button
            type="button"
            className="btn btn-outline"
            onClick={handleCopyDeepLink}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.85rem',
              padding: '0.5rem 0.85rem',
              borderColor: copiedLink ? 'var(--success-color)' : 'var(--border-color)',
              color: copiedLink ? 'var(--success-color)' : 'var(--text-primary)',
              transition: 'all 0.2s ease',
              fontWeight: '500'
            }}
            title={`Copy deep link to ${localVideo.code || video.code} for Workflowy`}
          >
            {copiedLink ? <Check size={16} color="var(--success-color)" /> : <Link size={16} />}
            <span>{copiedLink ? 'Copied Link!' : 'Copy Workflowy Link'}</span>
          </button>
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
