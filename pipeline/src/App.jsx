import { useEffect, useState, useRef } from 'react';
import { supabase } from './supabase';
import { 
  Calendar, CheckSquare, AlertCircle, RefreshCw, ChevronLeft, Save, Tag, 
  TrendingUp, Clock, FileVideo, Scissors, Film, X, ExternalLink,
  Check, MessageSquare, Plus, Trash2, ListTodo, FileText, CheckCircle2, Lightbulb, Link,
  Sparkles, FileEdit, Search
} from 'lucide-react';
import { addDays, isBefore, parseISO, differenceInDays, format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const LONG_VIDEO_CHECKLIST_ITEMS = [
  { key: 'prep_notebook', phase: 'Writing', label: 'Gemini Notebook research' },
  { key: 'prep_card', phase: 'Writing', label: '3x5 card drafted (5 beats)' },
  { key: 'film_recorded', phase: 'Filming', label: 'Direct-to-camera recorded' },
  { key: 'edit_transcript', phase: 'Editing', label: 'Spoken transcript pasted' },
  { key: 'edit_broll', phase: 'Editing', label: 'B-roll added' },
  { key: 'edit_sound', phase: 'Editing', label: 'Sound & audio enhanced' },
  { key: 'edit_vidiq', phase: 'Editing', label: 'vidIQ title scored (90+)' },
  { key: 'edit_obsidian', phase: 'Editing', label: 'Obsidian & JDex archived' },
  { key: 'pub_upload', phase: 'Publishing', label: 'YouTube Studio upload & CTA' },
  { key: 'pub_thumb', phase: 'Publishing', label: 'Custom thumbnail uploaded' },
  { key: 'pub_schedule', phase: 'Publishing', label: 'Scheduled for drop date' },
  { key: 'pub_cards', phase: 'Archived', label: 'Physical 3x5 main cards filed' },
  { key: 'archive_gemini_notebook', phase: 'Archived', label: 'Save to Gemini Notebook' },
];

export const SHORT_VIDEO_CHECKLIST_ITEMS = [
  { key: 'short_card', phase: 'Writing', label: 'Create 3x5 card' },
  { key: 'short_outline', phase: 'Writing', label: 'Write script outline (back of card)' },
  { key: 'short_film', phase: 'Filming', label: 'Film short video' },
  { key: 'short_descript', phase: 'Editing', label: 'Video edited (captions, audio)' },
  { key: 'edit_transcript', phase: 'Editing', label: 'Spoken transcript pasted' },
  { key: 'edit_vidiq', phase: 'Editing', label: 'vidIQ title/hook scored (90+)' },
  { key: 'edit_obsidian', phase: 'Editing', label: 'Obsidian & JDex archived' },
  { key: 'pub_upload', phase: 'Publishing', label: 'YouTube Shorts upload & CTA' },
  { key: 'pub_schedule', phase: 'Publishing', label: 'Scheduled for drop date' },
  { key: 'pub_cards', phase: 'Archived', label: 'Physical 3x5 cards filed' },
  { key: 'archive_gemini_notebook', phase: 'Archived', label: 'Save to Gemini Notebook' },
];

export const LONG_CHECKLIST_PHASES = ['All', 'Writing', 'Filming', 'Editing', 'Publishing', 'Archived'];
export const SHORT_CHECKLIST_PHASES = ['All', 'Writing', 'Filming', 'Editing', 'Publishing', 'Archived'];

export const getChecklistPhaseForStatus = (status) => {
  if (!status) return 'All';
  const clean = status.toLowerCase().replace('#', '').trim();
  switch (clean) {
    case 'write':
    case 'idea':
      return 'Writing';
    case 'film':
      return 'Filming';
    case 'edit':
      return 'Editing';
    case 'uploaded':
      return 'Publishing';
    case 'published':
      return 'Archived';
    default:
      return 'All';
  }
};

export const getCompletedPhasesForStatus = (status) => {
  if (!status) return [];
  const clean = status.toLowerCase().replace('#', '').trim();
  switch (clean) {
    case 'film':
      return ['Writing'];
    case 'edit':
      return ['Writing', 'Filming'];
    case 'uploaded':
      return ['Writing', 'Filming', 'Editing'];
    case 'published':
      return ['Writing', 'Filming', 'Editing', 'Publishing'];
    case 'archived':
    case 'archive':
      return ['Writing', 'Filming', 'Editing', 'Publishing', 'Archived'];
    default:
      return [];
  }
};

export const getAutoCompletedChecklist = (status, currentChecklist, isShort) => {
  const baseItems = isShort ? SHORT_VIDEO_CHECKLIST_ITEMS : LONG_VIDEO_CHECKLIST_ITEMS;
  const completedPhases = getCompletedPhasesForStatus(status);
  const updated = { ...(currentChecklist || {}) };

  baseItems.forEach(item => {
    if (completedPhases.includes(item.phase)) {
      updated[item.key] = true;
    }
  });

  return updated;
};

const STATUS_OPTIONS = ['#idea', '#write', '#film', '#edit', '#uploaded', '#published'];

function App() {
  const [videos, setVideos] = useState([]);
  const [videoPaths, setVideoPaths] = useState({});
  const [rotationCatalog, setRotationCatalog] = useState([]);
  const [deletedCodes, setDeletedCodes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sh_deleted_video_codes') || '[]');
    } catch {
      return [];
    }
  });

  const handleVideoDeleted = (code) => {
    if (!code) return;
    setDeletedCodes(prev => {
      const next = Array.from(new Set([...prev, code]));
      try {
        localStorage.setItem('sh_deleted_video_codes', JSON.stringify(next));
      } catch (err) {
        console.error("Failed to save deleted codes:", err);
      }
      return next;
    });
  };
  const [loading, setLoading] = useState(true);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [metricModal, setMetricModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWipDateCode, setEditingWipDateCode] = useState(null);
  const [wipDateValue, setWipDateValue] = useState('');
  const [savingWipDate, setSavingWipDate] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [videoHistory, setVideoHistory] = useState([]);
  const videoDetailRef = useRef(null);

  const handleBackToPrevVideo = async () => {
    if (isExiting) return;
    if (videoHistory.length === 0) return;
    setIsExiting(true);
    try {
      if (videoDetailRef.current && videoDetailRef.current.saveAllChanges) {
        const ok = await videoDetailRef.current.saveAllChanges();
        if (!ok) {
          setIsExiting(false);
          return;
        }
      }
      const prevVideo = videoHistory[videoHistory.length - 1];
      setVideoHistory(prev => prev.slice(0, -1));
      openVideo(prevVideo, true, false);
      await fetchVideos({ keepCurrent: true, checkUrl: false });
    } catch (err) {
      console.error("Error navigating back to previous video:", err);
    } finally {
      setIsExiting(false);
    }
  };

  const handleBack = async () => {
    if (isExiting) return;
    setIsExiting(true);
    try {
      if (videoDetailRef.current && videoDetailRef.current.saveAllChanges) {
        const ok = await videoDetailRef.current.saveAllChanges();
        if (!ok) {
          setIsExiting(false);
          return;
        }
      }
      setVideoHistory([]);
      closeVideo();
      setSearchQuery('');
      await fetchVideos({ keepCurrent: false, checkUrl: false });
    } catch (err) {
      console.error("Error saving video on back:", err);
      closeVideo();
    } finally {
      setIsExiting(false);
    }
  };

  const handleOpenStudio = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    window.open('https://studio.youtube.com/channel/UCSnF1YqGqmNosGdX5JqY1gQ', '_blank', 'noopener,noreferrer');
  };

  const handleOpenChannel = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const isAppleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isAppleMobile) {
      // Direct deep-link to native YouTube app on iOS/iPadOS
      window.location.href = 'youtube://www.youtube.com/@CraigAndersonDC';
    } else {
      window.open('https://www.youtube.com/@CraigAndersonDC', '_blank', 'noopener,noreferrer');
    }
  };

  const handleQuickSaveDropDate = async (e, videoItem) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const trimmed = wipDateValue ? wipDateValue.trim() : null;
    if (trimmed === (videoItem.drop_date || null)) {
      setEditingWipDateCode(null);
      return;
    }

    setSavingWipDate(true);
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-CA');
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const logEntry = `- [${dateStr} ${timeStr}] Drop date updated: "${videoItem.drop_date || 'TBD'}" → "${trimmed || 'TBD'}"`;
    const updatedNotes = videoItem.notes && videoItem.notes.trim() ? `${logEntry}\n${videoItem.notes.trim()}` : logEntry;

    const updatePayload = {
      drop_date: trimmed || null,
      notes: updatedNotes
    };

    const query = videoItem.id
      ? supabase.from('videos').update(updatePayload).eq('id', videoItem.id)
      : supabase.from('videos').update(updatePayload).eq('video_number', videoItem.video_number);

    const { error } = await query;
    if (error) {
      alert("Error saving drop date: " + error.message);
    } else {
      setEditingWipDateCode(null);
      fetchVideos();
    }
    setSavingWipDate(false);
  };

  const getRotationInfo = (videoOrCode) => {
    if (!videoOrCode) return null;
    const code = typeof videoOrCode === 'string' ? videoOrCode : videoOrCode.code;
    const dropDate = typeof videoOrCode === 'object' ? videoOrCode.drop_date : null;

    if (rotationCatalog && rotationCatalog.length > 0) {
      let match = rotationCatalog.find(r => r.code === code);
      if (!match && dropDate) {
        match = rotationCatalog.find(r => r.drop_date === dropDate);
      }
      if (match) {
        const pillar = (match.pillar === 'User Discretion' || match.pillar === 'Lab' || (code && code.includes('V4'))) ? 'Lab' : match.pillar;
        return {
          level: match.level,
          pillar: pillar,
          format_type: match.format_type || match.rotation_format
        };
      }
    }

    if (typeof videoOrCode === 'object') {
      const os_level = videoOrCode.os_level;
      const notes = videoOrCode.notes || '';
      const pillarMatch = notes.match(/Pillar:\s*([^|]+)/);
      if (os_level || pillarMatch) {
        const rawPillar = pillarMatch ? pillarMatch[1].trim() : 'Core';
        const pillar = (rawPillar === 'User Discretion' || rawPillar === 'Lab' || (code && code.includes('V4'))) ? 'Lab' : rawPillar;
        return {
          level: os_level || 'Systemized OS',
          pillar: pillar,
          format_type: videoOrCode.format_type
        };
      }
    }

    if (code) {
      if (code.includes('V1A')) return { level: 'Level 1 (Foundational)', pillar: 'Fuel' };
      if (code.includes('V1B')) return { level: 'Level 1 (Foundational)', pillar: 'Move' };
      if (code.includes('V1C')) return { level: 'Level 1 (Foundational)', pillar: 'Rest' };
      if (code.includes('V2A')) return { level: 'Level 2 (Inward)', pillar: 'Thinking' };
      if (code.includes('V2B')) return { level: 'Level 2 (Inward)', pillar: 'Learning' };
      if (code.includes('V2C')) return { level: 'Level 2 (Inward)', pillar: 'Connect' };
      if (code.includes('V3A')) return { level: 'Level 3 (Outward)', pillar: 'Play' };
      if (code.includes('V3B')) return { level: 'Level 3 (Outward)', pillar: 'Organize' };
      if (code.includes('V3C')) return { level: 'Level 3 (Outward)', pillar: 'Purpose' };
      if (code.includes('V4'))  return { level: 'Level 4 (Lab)', pillar: 'Lab' };
      if (code.includes('V0A') || code.includes('V0B')) return { level: 'Level 0 (Meta)', pillar: 'Worldview' };
    }
    return null;
  };

  const openVideo = (video, pushHistory = true, trackHistory = true) => {
    if (!video) return;
    if (trackHistory && currentVideo && currentVideo.code !== video.code) {
      setVideoHistory(prev => [...prev, currentVideo]);
    } else if (!currentVideo) {
      setVideoHistory([]);
    }
    setCurrentVideo(video);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (pushHistory && video.code) {
      const url = new URL(window.location.href);
      url.searchParams.set('video', video.code);
      url.searchParams.delete('code');
      url.searchParams.delete('v');
      url.hash = '';
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
      url.hash = '';
      const cleanUrl = url.pathname + (url.search ? url.search : '');
      window.history.pushState({}, '', cleanUrl);
    }
  };

  const fetchVideos = async (options = {}) => {
    const { keepCurrent = true, checkUrl = true } = options;
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
      if (checkUrl) {
        const params = new URLSearchParams(window.location.search);
        const targetParam = params.get('video') || params.get('code') || params.get('v');

        if (targetParam) {
          const found = list.find(v => 
            v.code?.toLowerCase() === targetParam.toLowerCase() ||
            v.video_number === targetParam ||
            v.id === targetParam
          );
          if (found) {
            setCurrentVideo(found);
            setLoading(false);
            return;
          }
        }
      }

      if (keepCurrent && currentVideo) {
        const updated = list.find(v => v.id === currentVideo.id || v.code === currentVideo.code);
        if (updated) setCurrentVideo(updated);
      } else if (!keepCurrent) {
        setCurrentVideo(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    if (currentVideo) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [currentVideo?.code, currentVideo?.id]);

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

    fetch('/content_rotation.json')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data)) setRotationCatalog(data);
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
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
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

  const sortByDropDateDesc = (a, b) => {
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
      return timeB - timeA; // Descending: newest on top, oldest on bottom
    }

    return (b.video_number || b.code || '').localeCompare(a.video_number || a.code || '');
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

    // 2. Published videos needing physical cards or archive steps
    if (video.status === '#published') {
      if ((!checklist.pub_cards || !video.cards_created) && !video.code?.startsWith('HIST')) {
        return { step: 'Review propositions & add to 3x5 cards', type: 'cards', actionType: 'cards' };
      }
      if (!checklist.archive_gemini_notebook && !video.code?.startsWith('HIST')) {
        return { step: 'Save to Gemini Notebook', type: 'checklist' };
      }
      if (checklist.custom_tasks && Array.isArray(checklist.custom_tasks)) {
        const pendingCustom = checklist.custom_tasks.find(t => !t.done);
        if (pendingCustom) {
          return { step: pendingCustom.label, type: 'custom' };
        }
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
        return { step: 'Paste spoken transcript into App', type: 'action' };
      }

      const items = isShort ? SHORT_VIDEO_CHECKLIST_ITEMS : LONG_VIDEO_CHECKLIST_ITEMS;
      for (const item of items) {
        if (item.phase === 'Archived') continue;
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
    
    const checklist = parseChecklistData(video.edit_checklist);
    const isHist = video.code?.startsWith('HIST');

    const isShort = video.format_type === 'Short' || video.code?.includes('-S');
    const baseItems = isShort ? SHORT_VIDEO_CHECKLIST_ITEMS : LONG_VIDEO_CHECKLIST_ITEMS;
    const customTasks = checklist.custom_tasks || [];

    let completed = 0;
    baseItems.forEach(item => {
      if (item.key === 'pub_cards' && (checklist.pub_cards || video.cards_created || isHist)) {
        completed++;
      } else if (item.key === 'archive_gemini_notebook' && (checklist.archive_gemini_notebook || isHist)) {
        completed++;
      } else if (checklist[item.key]) {
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
  const publishedVideos = videos.filter(v => v.status === '#published');
  const futureVideos = videos.filter(v => {
    if (v.status === '#published') return false;
    if (v.code?.startsWith('HIST')) return false;
    if (!v.drop_date) return false;
    const dropDate = parseISO(v.drop_date);
    if (isNaN(dropDate.getTime())) return false;
    dropDate.setHours(0, 0, 0, 0);
    return dropDate > todayDate;
  });

  const openModal = (title, videoList) => {
    const listCopy = [...videoList];
    const sorter = title === 'Published Videos' ? sortByDropDateDesc : sortByDropDate;
    setMetricModal({ title, videos: listCopy.sort(sorter) });
  };

  const renderDashboard = () => {
    // 1. Build 3-Week Pipeline (21 days out) from live database + content rotation system
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
          const rotInfo = getRotationInfo(v);
          const hasTranscript = !!(v.raw_transcript && v.raw_transcript.trim());
          pipelineItems.push({
            isPlaceholder: false,
            video: v,
            code: v.code,
            title: v.title,
            status: v.status,
            drop_date: v.drop_date,
            dayFormatted: format(day, 'EEE, MMM d'),
            notes: v.notes,
            format_type: v.format_type || expectedFormat,
            level: rotInfo?.level || v.os_level || 'Systemized OS',
            pillar: rotInfo?.pillar || 'Core',
            hasTranscript
          });
        });
      } else if (isExpectedReleaseDay) {
        // Resolve directly from 12-month content rotation system (Zero Placeholders)
        const rotItem = rotationCatalog.find(r => r.drop_date === isoDate && !deletedCodes.includes(r.code));
        if (rotItem) {
          pipelineItems.push({
            isPlaceholder: false,
            video: rotItem,
            code: rotItem.code,
            title: rotItem.title,
            status: rotItem.status || '#idea',
            drop_date: rotItem.drop_date,
            dayFormatted: format(day, 'EEE, MMM d'),
            notes: rotItem.notes,
            format_type: rotItem.format_type || expectedFormat,
            level: rotItem.level || 'Systemized OS',
            pillar: rotItem.pillar || 'Core',
            hasTranscript: false
          });
        }
      }
    }

    // Helper to check if a video has any open checklist items
    const hasOpenChecklistTasks = (video) => {
      const isShort = video.format_type === 'Short' || video.code?.includes('-S');
      const baseItems = isShort ? SHORT_VIDEO_CHECKLIST_ITEMS : LONG_VIDEO_CHECKLIST_ITEMS;
      const chk = parseChecklistData(video.edit_checklist);

      // Check standard base items
      for (const item of baseItems) {
        if (item.key === 'pub_cards') {
          if (!chk.pub_cards || !video.cards_created) return true;
        } else if (!chk[item.key]) {
          return true;
        }
      }

      // Check custom tasks
      if (chk.custom_tasks && Array.isArray(chk.custom_tasks)) {
        if (chk.custom_tasks.some(t => !t.done)) return true;
      }

      return false;
    };

    // 2. Build Work in Progress:
    // - Active production stages: #write, #film, #edit
    // - Published videos needing propositions reviewed & filed in Zettelkasten or any open post-publish tasks
    // - Immediate active #idea sprint (due within next 7 days)
    // - Sorted by drop date closest to today at the top
    const workInProgressItems = videos.filter(v => {
      if (v.code?.startsWith('HIST')) return false;

      // Published videos that still have ANY open checklist items belong in WIP
      // Don't show until the day after publication
      if (v.status === '#published') {
        const publishDateStr = v.drop_date || v.uploaded_date;
        if (publishDateStr) {
          const publishDate = parseISO(publishDateStr);
          if (!isNaN(publishDate.getTime())) {
            publishDate.setHours(0, 0, 0, 0);
            if (todayDate <= publishDate) {
              return false;
            }
          }
        }
        return hasOpenChecklistTasks(v);
      }

      if (v.status === '#uploaded') return true;

      // Active production
      if (v.status === '#write' || v.status === '#film' || v.status === '#edit') return true;

      // Upcoming active #idea due within next 7 days
      if (v.status === '#idea') {
        const dist = getDistanceToToday(v.drop_date);
        return dist >= 0 && dist <= 7;
      }

      return false;
    }).sort(sortByDropDate);

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

        <div className="card metric-tile" onClick={() => openModal('Published Videos', publishedVideos)}>
          <div style={{ backgroundColor: '#8b5cf6', color: '#fff', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
            <FileVideo size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Published Videos</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', lineHeight: '1.2' }}>{publishedVideos.length}</div>
          </div>
        </div>

        <div className="card metric-tile" onClick={() => openModal('Future Videos', futureVideos)}>
          <div style={{ backgroundColor: 'var(--accent-color)', color: '#fff', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
            <Calendar size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Future Videos</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', lineHeight: '1.2' }}>{futureVideos.length}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Column 1: Work in Progress */}
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
              const rotInfo = getRotationInfo(item);
              const pillar = item.pillar || rotInfo?.pillar;
              const isLong = item.format_type === 'Long' || (!item.code?.includes('-S') && !item.format_type?.toLowerCase().includes('short'));
              const displayTitle = (item.title && item.title.trim())
                ? item.title.trim()
                : (rotInfo?.level || item.os_level || 'Systemized OS');

              return (
                <div
                  key={`wip-${item.code}`}
                  className={`video-item ${isLong ? 'video-item-long' : 'video-item-short'} video-item-${item.status ? item.status.replace('#', '') : ''}`}
                  style={{ borderLeft: `${isLong ? '7px' : '4px'} solid ${borderLeftColor}`, cursor: 'pointer' }}
                  onClick={() => openVideo(item)}
                >
                  <div className="video-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <strong className={isLong ? 'video-code' : ''}>{item.code}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>
                        {isLong ? 'Long' : 'Short'}
                      </span>
                      {pillar && <span className="badge-pillar" title="Pillar Focus">{pillar}</span>}
                      {item.notes && <span title="Production Log" style={{ fontSize: '0.75rem' }}>📝</span>}
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  <div className="video-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: isLong ? '0.35rem' : '0.2rem', gap: '0.5rem' }}>
                    <span className="video-title" style={{ fontWeight: isLong ? '700' : '500', fontSize: isLong ? '1.05rem' : '0.88rem' }}>
                      {displayTitle}
                    </span>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                      {editingWipDateCode === item.code ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <input
                            type="date"
                            className="input"
                            style={{ padding: '0.15rem 0.35rem', fontSize: '0.78rem', height: '26px', width: 'auto' }}
                            value={wipDateValue}
                            onChange={e => setWipDateValue(e.target.value)}
                            disabled={savingWipDate}
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleQuickSaveDropDate(e, item);
                              if (e.key === 'Escape') setEditingWipDateCode(null);
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: '0.15rem 0.4rem', fontSize: '0.72rem', height: '26px' }}
                            onClick={e => handleQuickSaveDropDate(e, item)}
                            disabled={savingWipDate}
                            title="Save drop date"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '0.15rem 0.35rem', fontSize: '0.72rem', height: '26px' }}
                            onClick={e => { e.stopPropagation(); setEditingWipDateCode(null); }}
                            disabled={savingWipDate}
                            title="Cancel"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ fontWeight: isLong ? '800' : '600', color: isLong ? 'var(--accent-color)' : 'var(--text-secondary)', fontSize: isLong ? '0.92rem' : '0.82rem' }}>
                            {item.drop_date ? format(parseISO(item.drop_date), 'EEE, MMM d') : 'No Date'}
                          </span>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{
                              padding: '0.15rem 0.3rem',
                              height: '22px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-secondary)',
                              borderRadius: 'var(--radius-sm)',
                              opacity: 0.75
                            }}
                            onClick={e => {
                              e.stopPropagation();
                              setWipDateValue(item.drop_date || '');
                              setEditingWipDateCode(item.code);
                            }}
                            title="Edit drop date"
                          >
                            <Calendar size={11} />
                          </button>
                          {urgency && (
                            <span style={{ color: urgency.color, fontWeight: '700', fontSize: '0.72rem', marginLeft: '0.15rem' }}>
                              {urgency.label}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
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

        {/* Section 2: Pipeline (Next 3 Weeks) (Below WIP) */}
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Calendar size={20} color="var(--accent-color)" /> Pipeline (Next 3 Weeks)
          </h2>
          <div className="videos-list">
            {pipelineItems.map((item, idx) => {
              const rotInfo = getRotationInfo(item.video || item);
              const level = item.level || rotInfo?.level;
              const pillar = item.pillar || rotInfo?.pillar;
              const displayTitle = (item.title && item.title.trim())
                ? item.title.trim()
                : (level || 'Systemized OS');

              const isMonday = item.dayFormatted?.startsWith('Mon') || (item.drop_date && parseISO(item.drop_date).getDay() === 1);
              const isLong = item.format_type === 'Long' || isMonday;

              return (
                <div
                  key={`${item.code}-${item.drop_date}-${idx}`}
                  className={`video-item ${isLong ? 'video-item-long' : 'video-item-short'} video-item-${item.status ? item.status.replace('#', '') : 'idea'}`}
                  style={{
                    cursor: 'pointer',
                    borderLeft: `${isLong ? '7px' : '4px'} solid ${getBorderColor(item.video || item)}`
                  }}
                  onClick={() => openVideo(item.video || item)}
                >
                  <div className="video-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <strong className={isLong ? 'video-code' : ''}>{item.code}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>
                        {isLong ? 'Long' : 'Short'}
                      </span>
                      {pillar && <span className="badge-pillar" title="Pillar Focus">{pillar}</span>}
                      {item.notes && <span title="Production Log" style={{ fontSize: '0.75rem' }}>📝</span>}
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="video-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: isLong ? '0.35rem' : '0.2rem', gap: '0.5rem' }}>
                    <span className="video-title" style={{ fontWeight: isLong ? '700' : '500', fontSize: isLong ? '1.05rem' : '0.88rem' }}>
                      {displayTitle}
                    </span>
                    <span style={{
                      marginLeft: 'auto',
                      fontWeight: isLong ? '800' : '600',
                      color: isLong ? 'var(--accent-color)' : 'var(--text-secondary)',
                      fontSize: isLong ? '0.92rem' : '0.82rem',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.dayFormatted}
                    </span>
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
                {metricModal.videos.map(v => {
                  const rotInfo = getRotationInfo(v);
                  const displayTitle = (v.title && v.title.trim())
                    ? v.title.trim()
                    : (rotInfo?.level || v.os_level || 'Untitled');
                  return (
                    <div key={v.code} className="video-item" style={{ cursor: 'pointer' }} onClick={() => { openVideo(v); setMetricModal(null); }}>
                      <div className="video-header">
                        <strong>{v.code}: {displayTitle}</strong>
                        {getStatusBadge(v.status)}
                      </div>
                      <div className="video-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Drop: {v.drop_date ? format(parseISO(v.drop_date), 'EEE, MMM d, yyyy') : 'TBD'}</span>
                        {v.youtube_id && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: '600' }}>
                            ▶ YouTube
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

  const trimmedSearch = searchQuery.trim().toLowerCase();
  const searchResults = trimmedSearch
    ? videos.filter(v => {
        const code = (v.code || '').toLowerCase();
        const title = (v.title || '').toLowerCase();
        const num = (v.video_number || '').toLowerCase();
        const pillar = (getRotationInfo(v)?.pillar || '').toLowerCase();
        const level = (getRotationInfo(v)?.level || v.os_level || '').toLowerCase();
        return code.includes(trimmedSearch) || title.includes(trimmedSearch) || num.includes(trimmedSearch) || pillar.includes(trimmedSearch) || level.includes(trimmedSearch);
      })
    : [];

  const renderSearchResults = () => {
    return (
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.35rem' }}>
              <Search size={22} color="var(--accent-color)" /> Search Results ({searchResults.length})
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Matching code or title for <strong style={{ color: 'var(--text-primary)' }}>"{searchQuery}"</strong>
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            onClick={() => setSearchQuery('')}
          >
            <X size={14} /> Clear Search
          </button>
        </div>

        {searchResults.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '1.05rem', marginBottom: '0.5rem', fontWeight: '500' }}>
              No videos found matching <strong>"{searchQuery}"</strong>.
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Search by Johnny Decimal code (e.g. <code>80.V1A</code>), video number, or keywords in the title.
            </p>
          </div>
        ) : (
          <div className="videos-list">
            {searchResults.map(v => {
              const rotInfo = getRotationInfo(v);
              const pillar = rotInfo?.pillar;
              const isLong = v.format_type === 'Long' || (!v.code?.includes('-S') && !v.format_type?.toLowerCase().includes('short'));
              const displayTitle = (v.title && v.title.trim()) ? v.title.trim() : (rotInfo?.level || v.os_level || 'Systemized OS');

              return (
                <div
                  key={v.code}
                  className={`video-item ${isLong ? 'video-item-long' : 'video-item-short'} video-item-${v.status ? v.status.replace('#', '') : 'idea'}`}
                  style={{ cursor: 'pointer', borderLeft: `${isLong ? '7px' : '4px'} solid ${getBorderColor(v)}` }}
                  onClick={() => {
                    openVideo(v);
                    setSearchQuery('');
                  }}
                >
                  <div className="video-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <strong className={isLong ? 'video-code' : ''}>{v.code}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>
                        {isLong ? 'Long' : 'Short'}
                      </span>
                      {pillar && <span className="badge-pillar" title="Pillar Focus">{pillar}</span>}
                      {v.notes && <span title="Production Log" style={{ fontSize: '0.75rem' }}>📝</span>}
                    </div>
                    {getStatusBadge(v.status)}
                  </div>
                  <div className="video-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: isLong ? '0.35rem' : '0.2rem', gap: '0.5rem' }}>
                    <span className="video-title" style={{ fontWeight: isLong ? '700' : '500', fontSize: isLong ? '1.05rem' : '0.88rem' }}>
                      {displayTitle}
                    </span>
                    <span style={{ marginLeft: 'auto', fontWeight: isLong ? '800' : '600', color: isLong ? 'var(--accent-color)' : 'var(--text-secondary)', fontSize: isLong ? '0.92rem' : '0.82rem', whiteSpace: 'nowrap' }}>
                      {v.drop_date ? format(parseISO(v.drop_date), 'EEE, MMM d, yyyy') : 'No Date'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container">
      {!currentVideo && (
        <header className="section-header">
          <div>
            <h1>Systemized Pipeline</h1>
            <p>Systemized Health central dashboard</p>
          </div>

          <div className="header-controls">
            {/* Search Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.querySelector('input');
                if (input) input.blur();
              }}
              action=""
              className="header-search-form"
            >
              <Search size={15} className="header-search-icon" />
              <input
                type="search"
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                placeholder="Search code or title..."
                enterKeyHint="search"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="header-search-clear"
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </form>

            <div className="header-actions">
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                <Plus size={16} />
                <span>Add Video</span>
              </button>
              <button className="btn btn-outline" onClick={() => fetchVideos()} disabled={loading}>
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
              <button
                type="button"
                onClick={handleOpenStudio}
                className="btn btn-outline"
                title="Open YouTube Studio"
              >
                <ExternalLink size={14} />
                <span>Studio</span>
              </button>
              <button
                type="button"
                onClick={handleOpenChannel}
                className="btn btn-outline"
                title="Open YouTube Channel"
              >
                <ExternalLink size={14} />
                <span>Channel</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {loading && !currentVideo ? (
        <p>Loading pipeline data...</p>
      ) : trimmedSearch ? (
        renderSearchResults()
      ) : currentVideo ? (
        <VideoDetail 
          video={currentVideo} 
          saveRef={videoDetailRef}
          getRotationInfo={getRotationInfo} 
          onUpdate={fetchVideos} 
          onDelete={handleVideoDeleted} 
          onBack={handleBack} 
          onOpenVideo={openVideo}
          videos={videos}
          previousVideo={videoHistory.length > 0 ? videoHistory[videoHistory.length - 1] : null}
          onBackToPrevVideo={handleBackToPrevVideo}
          isExiting={isExiting}
        />
      ) : (
        renderDashboard()
      )}

      {showAddModal && (
        <AddVideoModal
          videos={videos}
          onClose={() => setShowAddModal(false)}
          onSuccess={(newVid) => {
            setShowAddModal(false);
            fetchVideos();
            if (newVid) setCurrentVideo(newVid);
          }}
        />
      )}
    </div>
  );
}

function VideoDetail({ video, saveRef, getRotationInfo, onUpdate, onDelete, onBack, onOpenVideo, videos, previousVideo, onBackToPrevVideo, isExiting }) {
  const [localVideo, setLocalVideo] = useState(video);
  const [agentMessage, setAgentMessage] = useState(video.agent_message || '');
  const [transcript, setTranscript] = useState(video.raw_transcript || '');
  const [notes, setNotes] = useState(video.notes || '');
  const [newLogEntry, setNewLogEntry] = useState('');
  const [newCustomTask, setNewCustomTask] = useState('');
  const [checklistPhase, setChecklistPhase] = useState(() => getChecklistPhaseForStatus(video.status));
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [videoPath, setVideoPath] = useState(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(video.title || '');
  const [codeInput, setCodeInput] = useState(video.code || '');
  const [savingTitle, setSavingTitle] = useState(false);
  const [isEditingDropDate, setIsEditingDropDate] = useState(false);
  const [dropDateInput, setDropDateInput] = useState(video.drop_date || '');
  const [savingDropDate, setSavingDropDate] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const t = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 25);
    return () => clearTimeout(t);
  }, [video?.code, video?.id]);

  const saveAllChanges = async () => {
    const trimmedTitle = titleInput.trim();
    const trimmedCode = codeInput.trim();
    const codeChanged = trimmedCode && trimmedCode !== localVideo.code && localVideo.status !== '#published';
    const titleChanged = trimmedTitle && trimmedTitle !== localVideo.title && localVideo.status !== '#published';
    const trimmedDropDate = dropDateInput ? dropDateInput.trim() : null;
    const dropDateChanged = trimmedDropDate !== (localVideo.drop_date || null);
    const agentMsgChanged = agentMessage !== (localVideo.agent_message || '');
    const transcriptChanged = transcript !== (localVideo.raw_transcript || '');
    const outlineChanged = outline !== (localVideo.rough_outline || '');
    const notesChanged = notes !== (localVideo.notes || '');
    const hasNewLog = !!newLogEntry.trim();

    const isDirty = codeChanged || titleChanged || dropDateChanged || agentMsgChanged || 
                    transcriptChanged || outlineChanged || notesChanged || hasNewLog;

    if (!isDirty) {
      return true;
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-CA');
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const changeLogs = [];

    let updatedCode = localVideo.code;
    let updatedTitle = localVideo.title;

    if (codeChanged) {
      updatedCode = trimmedCode;
      changeLogs.push(`Code updated: "${localVideo.code}" → "${trimmedCode}"`);
    }
    if (titleChanged) {
      updatedTitle = trimmedTitle;
      changeLogs.push(`Title updated: "${localVideo.title}" → "${trimmedTitle}"`);
    }
    if (dropDateChanged) {
      const oldD = localVideo.drop_date || 'TBD';
      const newD = trimmedDropDate || 'TBD';
      changeLogs.push(`Drop date updated: "${oldD}" → "${newD}"`);
    }

    let finalNotes = notes || '';
    if (hasNewLog) {
      const formattedLog = `- [${dateStr} ${timeStr}] ${newLogEntry.trim()}`;
      finalNotes = finalNotes.trim() ? `${formattedLog}\n${finalNotes.trim()}` : formattedLog;
    }
    if (changeLogs.length > 0) {
      const logEntry = `- [${dateStr} ${timeStr}] ${changeLogs.join(' | ')}`;
      finalNotes = finalNotes.trim() ? `${logEntry}\n${finalNotes.trim()}` : logEntry;
    }

    const isShortCode = updatedCode.includes('-S');
    const updatedFormat = isShortCode ? 'Short' : (localVideo.format_type || 'Long');

    const updatePayload = {
      code: updatedCode,
      title: updatedTitle,
      drop_date: trimmedDropDate || null,
      agent_message: agentMessage,
      raw_transcript: transcript,
      notes: finalNotes,
      rough_outline: outline,
      format_type: updatedFormat
    };

    if (supabase) {
      const query = localVideo.id
        ? supabase.from('videos').update(updatePayload).eq('id', localVideo.id)
        : supabase.from('videos').update(updatePayload).eq('video_number', localVideo.video_number);

      const { error } = await query;
      if (error) {
        console.error("Error auto-saving video on back:", error);
        alert("Error saving changes before exiting: " + error.message);
        return false;
      }
    }

    return true;
  };

  useEffect(() => {
    if (saveRef) {
      saveRef.current = {
        saveAllChanges
      };
    }
  });

  const handleDeleteVideo = async () => {
    const confirmMsg = `Are you sure you want to permanently delete ${localVideo.code} ("${localVideo.title}")?`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setDeleting(true);
    try {
      if (supabase) {
        let query = supabase.from('videos').delete();
        if (localVideo.id) {
          query = query.eq('id', localVideo.id);
        } else if (localVideo.code) {
          query = query.eq('code', localVideo.code);
        } else if (localVideo.video_number) {
          query = query.eq('video_number', localVideo.video_number);
        }

        const { error } = await query;
        if (error) {
          alert(`Error deleting video: ${error.message}`);
          setDeleting(false);
          return;
        }
      }

      if (onDelete && localVideo.code) {
        onDelete(localVideo.code);
      }

      if (onBack) onBack();
      if (onUpdate) await onUpdate();
    } catch (err) {
      console.error('Delete error:', err);
      alert(`Error deleting video: ${err.message || err}`);
      setDeleting(false);
    }
  };

  const getStarterOutline = (formatType, code) => {
    const isShortVid = formatType === 'Short' || code?.includes('-S');
    if (isShortVid) {
      return `1. Title: 

2. Thumbnail: 

3. Hook
a. Confirm Click: 
b. Common Belief: 
c. Reframe: 

4. Teach:
#1: 

5. Action
a. Why Next Step: 
b. CTA: `;
    }

    return `1. Title: 

2. Thumbnail: 

3. Hook
a. Confirm Click: 
b. Common Belief: 
c. Reframe: 

4. Teach:
#1: 
#2: 
#3: 

5. Action
a. Why Next Step: 
b. CTA: `;
  };

  const [outline, setOutline] = useState(() => {
    return video.rough_outline || getStarterOutline(video.format_type, video.code);
  });

  const scratchPadRef = useRef(null);

  const adjustScratchPadHeight = () => {
    if (scratchPadRef.current) {
      scratchPadRef.current.style.height = 'auto';
      scratchPadRef.current.style.height = `${Math.max(180, scratchPadRef.current.scrollHeight)}px`;
    }
  };

  useEffect(() => {
    adjustScratchPadHeight();
    const timer = setTimeout(adjustScratchPadHeight, 50);
    return () => clearTimeout(timer);
  }, [outline, video]);

  useEffect(() => {
    const handleResize = () => adjustScratchPadHeight();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const parseChecklist = (raw) => {
    if (!raw) return {};
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return {}; }
    }
    return raw;
  };

  const getMajorDomain = (urlStr) => {
    if (!urlStr || typeof urlStr !== 'string') return '';
    if (urlStr.startsWith('obsidian://')) return 'Obsidian';

    const lowerRaw = urlStr.toLowerCase();
    // Prioritize Gemini Notebook / NotebookLM across all URL structures
    if (
      lowerRaw.includes('notebooklm') ||
      lowerRaw.includes('gemini.google') ||
      lowerRaw.includes('notebook.google') ||
      lowerRaw.includes('g.co/notebook') ||
      lowerRaw.includes('g.co/gemini')
    ) {
      return 'Gemini Notebook';
    }

    try {
      const parsed = new URL(urlStr.startsWith('http://') || urlStr.startsWith('https://') ? urlStr : `https://${urlStr}`);

      // 1. Check for internal pipeline video deep-links: e.g. https://shpipeline.netlify.app/?video=80.V1A2
      const videoParam = parsed.searchParams.get('video');
      if (videoParam) {
        // Strip Johnny Decimal category prefix like '80.' (e.g. '80.V1A2' -> 'V1A2')
        const shortCode = decodeURIComponent(videoParam).trim().replace(/^\d+\./, '');
        if (shortCode) {
          return shortCode;
        }
      }

      const host = parsed.hostname.replace(/^www\./i, '');
      const lower = host.toLowerCase();

      // 2. Gemini Notebook / NotebookLM (check hostname and path)
      if (
        lower.includes('notebooklm') ||
        lower.includes('gemini.google') ||
        lower.includes('notebook.google') ||
        parsed.pathname.toLowerCase().includes('notebooklm') ||
        parsed.pathname.toLowerCase().includes('gemini')
      ) {
        return 'Gemini Notebook';
      }

      // Brand overrides matching user conventions
      if (lower === 'workflowy.com' || lower.endsWith('.workflowy.com')) return 'Workflowy.com';
      if (lower === 'shpipeline.netlify.app' || lower === 'systemizedhealth.netlify.app') return 'Pipeline';
      if (lower === 'netlify.app' || lower.endsWith('.netlify.app')) return 'netlify.app';
      if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YouTube.com';
      if (lower.includes('descript.com')) return 'Descript.com';
      if (lower.includes('github.com')) return 'GitHub.com';
      if (lower.includes('notion.so')) return 'Notion.so';
      if (lower.includes('google.com')) return 'Google.com';
      if (lower.includes('dropbox.com')) return 'Dropbox.com';
      if (lower.includes('vidiq.com')) return 'vidIQ.com';

      // General domain extraction (taking SLD + TLD, e.g. sub.domain.com -> Domain.com)
      const parts = host.split('.');
      if (parts.length >= 2) {
        const twoPartTLDs = ['co.uk', 'com.au', 'co.nz', 'co.za', 'com.br'];
        const lastTwo = parts.slice(-2).join('.').toLowerCase();
        if (twoPartTLDs.includes(lastTwo) && parts.length >= 3) {
          const sld = parts[parts.length - 3];
          const capSld = sld.charAt(0).toUpperCase() + sld.slice(1);
          return `${capSld}.${lastTwo}`;
        }
        const tld = parts[parts.length - 1];
        const sld = parts[parts.length - 2];
        const capSld = sld.charAt(0).toUpperCase() + sld.slice(1);
        return `${capSld}.${tld}`;
      }
      return host;
    } catch {
      return urlStr;
    }
  };

  const extractUrls = (text) => {
    if (!text || typeof text !== 'string') return [];
    const seen = new Set();
    const result = [];

    const processLink = (rawUrl, href) => {
      if (!seen.has(href)) {
        seen.add(href);
        const domain = getMajorDomain(href);

        let videoCode = null;
        let rawVideoCode = null;
        try {
          const parsed = new URL(href.startsWith('http://') || href.startsWith('https://') ? href : `https://${href}`);
          const vp = parsed.searchParams.get('video');
          if (vp) {
            rawVideoCode = decodeURIComponent(vp).trim();
            videoCode = rawVideoCode.replace(/^\d+\./, '');
          }
        } catch {}

        result.push({ raw: rawUrl, href, domain, videoCode, rawVideoCode });
      }
    };

    // 1. Check for markdown links: [Label](url)
    const mdRegex = /\[([^\]]+)\]\(((?:https?:\/\/|obsidian:\/\/|www\.)[^\s)]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s)]*)\)/gi;
    let mdMatch;
    while ((mdMatch = mdRegex.exec(text)) !== null) {
      let rawHref = mdMatch[2].trim().replace(/[.,:;"')\]]+$/, '');
      const href = rawHref.startsWith('http://') || rawHref.startsWith('https://') || rawHref.startsWith('obsidian://')
        ? rawHref
        : `https://${rawHref}`;
      processLink(rawHref, href);
    }

    // 2. Check for standard URLs and common domain patterns
    const urlRegex = /(?:https?:\/\/|obsidian:\/\/|www\.)[^\s<]+|(?:[a-zA-Z0-9-]+\.)+(?:com|org|net|edu|gov|io|co|health|app|dev|ai|gl|be|tv|me)(?:\/[^\s<]*)?/gi;
    const matches = text.match(urlRegex) || [];
    matches.forEach(m => {
      let clean = m.trim().replace(/[.,:;"')\]]+$/, '');
      const href = clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('obsidian://')
        ? clean
        : `https://${clean}`;
      processLink(clean, href);
    });

    // Handle domain labels, numbering duplicates if multiple links point to the same domain (unless it's an internal video code)
    const domainCounts = {};
    result.forEach(item => {
      domainCounts[item.domain] = (domainCounts[item.domain] || 0) + 1;
    });

    const domainCurrentIdx = {};
    return result.map(item => {
      if (domainCounts[item.domain] > 1 && !item.videoCode) {
        domainCurrentIdx[item.domain] = (domainCurrentIdx[item.domain] || 0) + 1;
        return {
          ...item,
          domainLabel: `${item.domain} (${domainCurrentIdx[item.domain]})`
        };
      }
      return {
        ...item,
        domainLabel: item.domain
      };
    });
  };

  const [checklist, setChecklist] = useState(() => parseChecklist(video.edit_checklist));

  const [filePropositions, setFilePropositions] = useState([]);
  
  // Aggregate text from all text fields on this video page
  const allVideoTexts = [
    outline,
    notes,
    newLogEntry,
    agentMessage,
    transcript,
    localVideo.title,
    localVideo.notes,
    localVideo.rough_outline,
    localVideo.raw_transcript,
    ...(checklist?.custom_tasks?.map(t => t.text) || [])
  ].filter(Boolean).join('\n');

  const allDetectedUrls = extractUrls(allVideoTexts);
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
    setCodeInput(video.code || '');
    setTitleInput(video.title || '');
    setIsEditingTitle(false);
    setDropDateInput(video.drop_date || '');
    setIsEditingDropDate(false);
    setAgentMessage(video.agent_message || '');
    setTranscript(video.raw_transcript || '');
    setNotes(video.notes || '');
    setChecklist(parseChecklist(video.edit_checklist));
    setOutline(video.rough_outline || getStarterOutline(video.format_type, video.code));
    setChecklistPhase(getChecklistPhaseForStatus(video.status));
  }, [video]);

  // Save drop date and log to video production log
  const handleSaveDropDate = async () => {
    const trimmedDate = dropDateInput ? dropDateInput.trim() : null;
    const oldDate = localVideo.drop_date || 'TBD';
    const newDateStr = trimmedDate || 'TBD';

    if (trimmedDate === (localVideo.drop_date || null)) {
      setIsEditingDropDate(false);
      return;
    }

    setSavingDropDate(true);
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-CA');
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const logEntry = `- [${dateStr} ${timeStr}] Drop date updated: "${oldDate}" → "${newDateStr}"`;
    const updatedNotes = notes && notes.trim() ? `${logEntry}\n${notes.trim()}` : logEntry;

    const updatePayload = {
      drop_date: trimmedDate || null,
      notes: updatedNotes
    };

    const query = localVideo.id
      ? supabase.from('videos').update(updatePayload).eq('id', localVideo.id)
      : supabase.from('videos').update(updatePayload).eq('video_number', localVideo.video_number);

    const { error } = await query;

    if (error) {
      alert("Error saving drop date: " + error.message);
    } else {
      setLocalVideo(prev => ({
        ...prev,
        ...updatePayload
      }));
      setNotes(updatedNotes);
      setIsEditingDropDate(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      if (onUpdate) onUpdate();
    }
    setSavingDropDate(false);
  };

  // Save working code and title (only if not published) and log to production log
  const handleSaveTitle = async () => {
    const trimmedTitle = titleInput.trim();
    const trimmedCode = codeInput.trim();

    if (!trimmedCode) {
      alert("Video code cannot be empty.");
      return;
    }
    if (!trimmedTitle) {
      alert("Title cannot be empty.");
      return;
    }

    const oldCode = localVideo.code || '';
    const oldTitle = localVideo.title || '';
    const codeChanged = trimmedCode !== oldCode;
    const titleChanged = trimmedTitle !== oldTitle;

    if (!codeChanged && !titleChanged) {
      setIsEditingTitle(false);
      return;
    }

    setSavingTitle(true);
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-CA');
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    const changeLogs = [];
    if (codeChanged) changeLogs.push(`Code updated: "${oldCode}" → "${trimmedCode}"`);
    if (titleChanged) changeLogs.push(`Title updated: "${oldTitle}" → "${trimmedTitle}"`);
    const logEntry = `- [${dateStr} ${timeStr}] ${changeLogs.join(' | ')}`;
    const updatedNotes = notes && notes.trim() ? `${logEntry}\n${notes.trim()}` : logEntry;

    // Detect format type change if code changed (e.g. -S -> Short)
    const isShortCode = trimmedCode.includes('-S');
    const updatedFormat = isShortCode ? 'Short' : (localVideo.format_type || 'Long');

    const updatePayload = {
      code: trimmedCode,
      title: trimmedTitle,
      notes: updatedNotes,
      format_type: updatedFormat
    };

    const { error } = await supabase
      .from('videos')
      .update(updatePayload)
      .eq('video_number', localVideo.video_number);

    if (error) {
      alert("Error saving: " + error.message);
    } else {
      setLocalVideo(prev => ({
        ...prev,
        ...updatePayload
      }));
      setNotes(updatedNotes);
      setIsEditingTitle(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      onUpdate();
    }
    setSavingTitle(false);
  };

  // Save all text fields (Notes, Transcript, Agent Message, Outline, Title & Code if edited)
  const handleSaveText = async () => {
    setSaving(true);
    let updatedCode = localVideo.code;
    let updatedTitle = localVideo.title;
    let currentNotes = notes;
    const trimmedTitle = titleInput.trim();
    const trimmedCode = codeInput.trim();

    const codeChanged = trimmedCode && trimmedCode !== localVideo.code && localVideo.status !== '#published';
    const titleChanged = trimmedTitle && trimmedTitle !== localVideo.title && localVideo.status !== '#published';

    if (codeChanged || titleChanged) {
      if (codeChanged) updatedCode = trimmedCode;
      if (titleChanged) updatedTitle = trimmedTitle;
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-CA');
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const changeLogs = [];
      if (codeChanged) changeLogs.push(`Code updated: "${localVideo.code}" → "${trimmedCode}"`);
      if (titleChanged) changeLogs.push(`Title updated: "${localVideo.title}" → "${trimmedTitle}"`);
      const logEntry = `- [${dateStr} ${timeStr}] ${changeLogs.join(' | ')}`;
      currentNotes = currentNotes && currentNotes.trim() ? `${logEntry}\n${currentNotes.trim()}` : logEntry;
      setNotes(currentNotes);
      setIsEditingTitle(false);
    }

    const isShortCode = updatedCode.includes('-S');
    const updatedFormat = isShortCode ? 'Short' : (localVideo.format_type || 'Long');

    const updatePayload = {
      code: updatedCode,
      title: updatedTitle,
      agent_message: agentMessage,
      raw_transcript: transcript,
      notes: currentNotes,
      rough_outline: outline,
      format_type: updatedFormat
    };

    const { error } = await supabase
      .from('videos')
      .update(updatePayload)
      .eq('video_number', localVideo.video_number);

    if (error) {
      alert("Error saving: " + error.message);
    } else {
      setLocalVideo(prev => ({
        ...prev,
        title: updatedTitle,
        agent_message: agentMessage,
        raw_transcript: transcript,
        notes: currentNotes,
        rough_outline: outline
      }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      onUpdate();
    }
    setSaving(false);
  };

  // Save outline only
  const handleSaveOutline = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('videos')
      .update({ rough_outline: outline })
      .eq('video_number', localVideo.video_number);

    if (error) {
      alert("Error saving outline: " + error.message);
    } else {
      setLocalVideo(prev => ({ ...prev, rough_outline: outline }));
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
    const isShort = localVideo.format_type === 'Short' || localVideo.code?.includes('-S');
    const updatedChecklist = getAutoCompletedChecklist(newStatus, checklist, isShort);

    // Sync cards_created with pub_cards
    const cardsCreated = updatedChecklist.pub_cards ?? localVideo.cards_created;

    const updatePayload = { 
      status: newStatus,
      edit_checklist: updatedChecklist,
      cards_created: cardsCreated
    };

    const { error } = await supabase
      .from('videos')
      .update(updatePayload)
      .eq('video_number', localVideo.video_number);

    if (error) {
      alert("Error changing status: " + error.message);
    } else {
      setLocalVideo(prev => ({ ...prev, ...updatePayload }));
      setChecklist(updatedChecklist);
      setChecklistPhase(getChecklistPhaseForStatus(newStatus));
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
          {/* Top Back Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            {/* Back to Dashboard Button */}
            <button
              type="button"
              className="btn btn-outline"
              onClick={onBack}
              disabled={isExiting}
              style={{
                padding: '0.25rem 0.65rem',
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: '600',
                borderRadius: 'var(--radius-sm)'
              }}
              title="Back to Dashboard"
            >
              <ChevronLeft size={14} className={isExiting ? "animate-spin" : ""} />
              <span>{isExiting ? 'Saving...' : 'Dashboard'}</span>
            </button>

            {/* Back to Previous Video Page (if navigated from another video) */}
            {previousVideo && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={onBackToPrevVideo}
                disabled={isExiting}
                style={{
                  padding: '0.25rem 0.65rem',
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: 'var(--accent-color)',
                  borderColor: 'var(--accent-color)',
                  fontWeight: '600',
                  borderRadius: 'var(--radius-sm)'
                }}
                title={`Back to video ${previousVideo.code ? previousVideo.code.replace(/^\d+\./, '') : 'page'}`}
              >
                <ChevronLeft size={14} />
                <span>{previousVideo.code ? previousVideo.code.replace(/^\d+\./, '') : 'Back'}</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
            <a
              href={videoPath 
                ? `obsidian://open?vault=SystemizedHealth_Vault&file=${videoPath.split('/').map(encodeURIComponent).join('/')}` 
                : `obsidian://search?vault=SystemizedHealth_Vault&query=${encodeURIComponent(`"${localVideo.code}"`)}`}
              className="btn btn-outline"
              style={{ textDecoration: 'none', padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
              title="Open in Obsidian"
            >
              <ExternalLink size={14} /> OB
            </a>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleDeleteVideo}
              disabled={deleting}
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', color: 'var(--danger-color)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              title="Delete Video"
            >
              <Trash2 size={14} />
            </button>
            {getStatusBadge(localVideo.status)}
          </div>
        </div>

        {isEditingTitle ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                style={{
                  width: '140px',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  fontFamily: 'monospace',
                  padding: '0.4rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--accent-color)',
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--text-primary)'
                }}
                placeholder="Code (e.g. 80.V2A-S2)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') {
                    setCodeInput(localVideo.code || '');
                    setTitleInput(localVideo.title || '');
                    setIsEditingTitle(false);
                  }
                }}
              />
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>:</span>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '240px',
                  fontSize: '1.15rem',
                  fontWeight: '600',
                  padding: '0.4rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--accent-color)',
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--text-primary)'
                }}
                placeholder="Enter working title..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') {
                    setCodeInput(localVideo.code || '');
                    setTitleInput(localVideo.title || '');
                    setIsEditingTitle(false);
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                onClick={handleSaveTitle}
                disabled={savingTitle}
              >
                <Save size={13} /> {savingTitle ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem' }}
                onClick={() => {
                  setCodeInput(localVideo.code || '');
                  setTitleInput(localVideo.title || '');
                  setIsEditingTitle(false);
                }}
                disabled={savingTitle}
              >
                Cancel
              </button>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Tip: Edit the code and working title together. Press Enter to save. Changes are automatically logged to the Video Production Log.
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.5rem', margin: 0, lineHeight: '1.3' }}>
              {localVideo.code}: {localVideo.title}
            </h2>
            {localVideo.status !== '#published' ? (
              <button
                type="button"
                className="btn btn-outline"
                style={{
                  padding: '0.25rem 0.45rem',
                  fontSize: '0.75rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  borderRadius: 'var(--radius-sm)'
                }}
                onClick={() => {
                  setCodeInput(localVideo.code || '');
                  setTitleInput(localVideo.title || '');
                  setIsEditingTitle(true);
                }}
                title="Edit code and title"
              >
                <FileEdit size={14} />
              </button>
            ) : (
              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--surface-color)',
                  padding: '0.15rem 0.45rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)'
                }}
                title="Published titles are automatically synced from YouTube Studio via vidIQ sync"
              >
                🔒 Synced via vidIQ
              </span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span><strong>Format:</strong> {localVideo.format_type}</span>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <strong>Drop Date:</strong>
            {isEditingDropDate ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <input
                  type="date"
                  className="input"
                  style={{
                    padding: '0.2rem 0.45rem',
                    fontSize: '0.85rem',
                    width: 'auto',
                    height: '28px',
                    backgroundColor: 'var(--surface-color)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)'
                  }}
                  value={dropDateInput}
                  onChange={(e) => setDropDateInput(e.target.value)}
                  disabled={savingDropDate}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveDropDate();
                    if (e.key === 'Escape') {
                      setDropDateInput(localVideo.drop_date || '');
                      setIsEditingDropDate(false);
                    }
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', height: '28px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  onClick={handleSaveDropDate}
                  disabled={savingDropDate}
                  title="Save Drop Date"
                >
                  <Check size={13} /> {savingDropDate ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem', height: '28px' }}
                  onClick={() => {
                    setDropDateInput(localVideo.drop_date || '');
                    setIsEditingDropDate(false);
                  }}
                  disabled={savingDropDate}
                  title="Cancel"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontWeight: localVideo.drop_date ? '600' : 'normal', color: localVideo.drop_date ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {localVideo.drop_date || 'TBD'}
                </span>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{
                    padding: '0.2rem 0.4rem',
                    fontSize: '0.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    height: '24px'
                  }}
                  onClick={() => {
                    setDropDateInput(localVideo.drop_date || '');
                    setIsEditingDropDate(true);
                  }}
                  title="Edit drop date"
                >
                  <FileEdit size={13} />
                </button>
              </div>
            )}
          </div>
          {getRotationInfo && getRotationInfo(localVideo)?.level && (
            <span><strong>Level:</strong> <span className="badge-level">{getRotationInfo(localVideo).level}</span></span>
          )}
          {getRotationInfo && getRotationInfo(localVideo)?.pillar && (
            <span><strong>Pillar:</strong> <span className="badge-pillar">{getRotationInfo(localVideo).pillar}</span></span>
          )}
          {localVideo.vidiq_title_score > 0 && (
            <span><strong>vidIQ Score:</strong> <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>{localVideo.vidiq_title_score}</span>/100</span>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
            <Tag size={16} />
            <select
              value={localVideo.status}
              onChange={handleStatusChange}
              className="status-select"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* URL Links Row — small, minimal text-only links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '1.25rem', fontSize: '0.82rem' }}>
        {/* Copy Deep Link URL Text Action */}
        <button
          type="button"
          onClick={handleCopyDeepLink}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontWeight: '500',
            color: copiedLink ? 'var(--success-color)' : 'var(--text-secondary)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            transition: 'color 0.15s ease'
          }}
          title={`Copy deep link to ${localVideo.code || video.code} for Workflowy`}
        >
          {copiedLink ? <Check size={12} color="var(--success-color)" /> : <Link size={12} />}
          <span style={{ textDecoration: 'underline', textUnderlineOffset: '2px' }}>
            {copiedLink ? 'Copied URL!' : 'Copy URL'}
          </span>
        </button>

        {/* Link back to previous video page (if navigated internally) */}
        {previousVideo && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ color: 'var(--border-color)', userSelect: 'none' }}>•</span>
            <button
              type="button"
              onClick={onBackToPrevVideo}
              disabled={isExiting}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: '600',
                color: 'var(--accent-color)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              title={`Back to video ${previousVideo.code ? previousVideo.code.replace(/^\d+\./, '') : 'page'}`}
            >
              <ChevronLeft size={13} />
              <span style={{ textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                {previousVideo.code ? previousVideo.code.replace(/^\d+\./, '') : 'Back'}
              </span>
            </button>
          </span>
        )}

        {/* Detected External & Internal URLs as clean text links */}
        {allDetectedUrls.map((link, idx) => (
          <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ color: 'var(--border-color)', userSelect: 'none' }}>•</span>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (link.videoCode && onOpenVideo && videos) {
                  const target = videos.find(v => 
                    v.code === link.rawVideoCode || 
                    v.code === link.videoCode || 
                    v.code === `80.${link.videoCode}` || 
                    v.code?.endsWith(link.videoCode)
                  );
                  if (target) {
                    e.preventDefault();
                    onOpenVideo(target);
                  }
                }
              }}
              style={{
                color: 'var(--accent-color)',
                fontSize: '0.82rem',
                fontWeight: '500',
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              title={link.videoCode ? `Open Video ${link.videoCode}` : link.href}
            >
              <ExternalLink size={12} />
              <span>{link.domainLabel}</span>
            </a>
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* 1. Production Checklist Section (Per-Video in Supabase) */}
        <div className="checklist-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.15rem' }}>
              <CheckSquare size={20} color="var(--success-color)" /> {isShort ? 'Shorts Checklist (Edit → Upload)' : 'Long Video Production Checklist'}
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

        {/* 2. Video Script Outline Section / Scratch Pad */}
        <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.15rem' }}>
              <FileEdit size={20} color="var(--primary-color)" /> {isShort ? 'Short Scratch Pad' : 'Long Scratch Pad'}
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                onClick={() => {
                  if (!outline.trim() || window.confirm("Reset outline to starter template? This will replace your current outline text.")) {
                    setOutline(getStarterOutline(localVideo.format_type, localVideo.code));
                  }
                }}
                title={outline.trim() ? "Reset outline to starter template" : "Insert starter beats template"}
              >
                {outline.trim() ? 'Reset Template' : 'Insert Template'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                onClick={handleSaveOutline}
                disabled={saving}
              >
                <Save size={13} /> Save Outline
              </button>
            </div>
          </div>
          <textarea
            ref={scratchPadRef}
            value={outline}
            onChange={(e) => {
              setOutline(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.max(180, e.target.scrollHeight)}px`;
            }}
            style={{
              width: '100%',
              minHeight: '180px',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--surface-color)',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: '0.9rem',
              lineHeight: '1.5',
              overflow: 'hidden',
              resize: 'none',
              boxSizing: 'border-box'
            }}
            placeholder={isShort
              ? "1. Title: \n\n2. Thumbnail: \n\n3. Hook\na. Confirm Click: \nb. Common Belief: \nc. Reframe: \n\n4. Teach:\n#1: \n\n5. Action\na. Why Next Step: \nb. CTA: "
              : "1. Title: \n\n2. Thumbnail: \n\n3. Hook\na. Confirm Click: \nb. Common Belief: \nc. Reframe: \n\n4. Teach:\n#1: \n#2: \n#3: \n\n5. Action\na. Why Next Step: \nb. CTA: "
            }
          />

        </div>

        {/* 3. Log Section (Stored in Supabase notes) */}
        <div className="log-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.15rem' }}>
              <FileText size={20} color="var(--accent-color)" /> Log
            </h3>
          </div>

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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--success-color)', fontWeight: '500' }}>
              {saveSuccess ? '✓ Notes saved to Supabase' : ''}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Final Transcript</h3>
            </div>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              style={{ width: '100%', height: '180px', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)', color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'vertical' }}
              placeholder="Paste transcript here..."
            />
          </div>
        )}

        {/* 4. Agent Note */}
        <div>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Agent Note</h3>
          <textarea
            value={agentMessage}
            onChange={(e) => setAgentMessage(e.target.value)}
            style={{ width: '100%', height: '80px', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)', color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'vertical' }}
            placeholder="e.g., 'Score 5 titles in vidIQ and extract 3 waterfall shorts...'"
          />
        </div>

        {/* 5. Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleSaveText} disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving to Supabase...' : 'Save All Text Fields'}
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={handleDeleteVideo}
            disabled={deleting}
            style={{ color: 'var(--danger-color)', borderColor: 'rgba(239, 68, 68, 0.3)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Trash2 size={16} />
            {deleting ? 'Deleting...' : 'Delete Video'}
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

const PILLAR_OPTIONS = [
  { level: 'Level 1: Foundational', pillar: 'Move', codePrefix: '80.V1B', defaultJdex: '80.12' },
  { level: 'Level 1: Foundational', pillar: 'Fuel', codePrefix: '80.V1A', defaultJdex: '80.11' },
  { level: 'Level 1: Foundational', pillar: 'Rest', codePrefix: '80.V1C', defaultJdex: '80.13' },
  { level: 'Level 2: Inward', pillar: 'Thinking', codePrefix: '80.V2A', defaultJdex: '80.21' },
  { level: 'Level 2: Inward', pillar: 'Learning', codePrefix: '80.V2B', defaultJdex: '80.22' },
  { level: 'Level 2: Inward', pillar: 'Connection', codePrefix: '80.V2C', defaultJdex: '80.23' },
  { level: 'Level 3: Outward', pillar: 'Play', codePrefix: '80.V3A', defaultJdex: '80.31' },
  { level: 'Level 3: Outward', pillar: 'Work', codePrefix: '80.V3B', defaultJdex: '80.32' },
  { level: 'Level 3: Outward', pillar: 'Contribution', codePrefix: '80.V3C', defaultJdex: '80.33' },
  { level: 'Baseline', pillar: 'Core Baseline', codePrefix: '80.V0A', defaultJdex: '80.10' },
  { level: 'Level 4: Lab', pillar: 'Lab / Experiment', codePrefix: '80.V4', defaultJdex: '80.40' },
];

function AddVideoModal({ videos, onClose, onSuccess }) {
  const [formatType, setFormatType] = useState('Short');
  const [selectedPillarIndex, setSelectedPillarIndex] = useState(0);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('#edit');
  const [dropDate, setDropDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [code, setCode] = useState('');
  const [transcript, setTranscript] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedPillar = PILLAR_OPTIONS[selectedPillarIndex];

  const calculateSuggestedCode = (fmt, pillar) => {
    const prefix = pillar.codePrefix;
    if (fmt === 'Short') {
      let maxShort = 0;
      videos.forEach(v => {
        if (v.code && v.code.startsWith(prefix) && v.code.includes('-S')) {
          const m = v.code.match(/-S(\d+)/i);
          if (m) {
            const num = parseInt(m[1], 10);
            if (!isNaN(num) && num > maxShort) maxShort = num;
          }
        }
      });
      return `${prefix}-S${maxShort + 1}`;
    } else {
      let maxLong = 0;
      videos.forEach(v => {
        if (v.code && v.code.startsWith(prefix) && !v.code.includes('-S')) {
          const numPart = v.code.replace(prefix, '');
          const num = parseInt(numPart, 10);
          if (!isNaN(num) && num > maxLong) maxLong = num;
        }
      });
      return `${prefix}${maxLong + 1 || 1}`;
    }
  };

  useEffect(() => {
    setCode(calculateSuggestedCode(formatType, selectedPillar));
  }, [formatType, selectedPillarIndex]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a working title for this video.');
      return;
    }
    if (!code.trim()) {
      setErrorMsg('Please enter a video code.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      let maxVN = 0;
      videos.forEach(v => {
        const n = parseInt(v.video_number, 10);
        if (!isNaN(n) && n > maxVN) maxVN = n;
      });
      const nextVideoNumber = String(maxVN + 1).padStart(3, '0');

      const isShortVid = formatType === 'Short' || code.includes('-S');
      const starterOutline = isShortVid
        ? `1. Title: 

2. Thumbnail: 

3. Hook
a. Confirm Click: 
b. Common Belief: 
c. Reframe: 

4. Teach:
#1: 

5. Action
a. Why Next Step: 
b. CTA: `
        : `1. Title: 

2. Thumbnail: 

3. Hook
a. Confirm Click: 
b. Common Belief: 
c. Reframe: 

4. Teach:
#1: 
#2: 
#3: 

5. Action
a. Why Next Step: 
b. CTA: `;

      const nowStamp = format(new Date(), 'yyyy-MM-dd HH:mm');
      const logLine = notes.trim()
        ? `-[${nowStamp}] Filmed on-the-fly in field (Pillar: ${selectedPillar.pillar}).\n${notes.trim()}`
        : `-[${nowStamp}] Added on-the-fly in field (Pillar: ${selectedPillar.pillar}).`;

      const newRecord = {
        video_number: nextVideoNumber,
        code: code.trim(),
        format_type: formatType,
        title: title.trim(),
        status: status,
        drop_date: dropDate.trim() || null,
        os_level: selectedPillar.level,
        jdex_code: selectedPillar.defaultJdex,
        rough_outline: starterOutline,
        raw_transcript: transcript.trim() || null,
        notes: logLine,
        cards_created: false,
        edit_checklist: JSON.stringify(getAutoCompletedChecklist(status, {}, formatType === 'Short')),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('videos')
        .insert([newRecord])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      onSuccess(data);
    } catch (err) {
      console.error('Error inserting video:', err);
      setErrorMsg(err.message || 'Failed to create video');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={20} color="var(--accent-color)" /> Add Video to Pipeline
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Add an unplanned short or upcoming video to the pipeline
            </p>
          </div>
          <button type="button" className="btn btn-outline" onClick={onClose} style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {errorMsg && (
            <div style={{ padding: '0.6rem 0.8rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger-color)', borderRadius: 'var(--radius-md)', color: 'var(--danger-color)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          {/* Format Toggle */}
          <div className="form-group">
            <label className="form-label">Format</label>
            <div className="format-toggle-group">
              <button
                type="button"
                className={`format-toggle-btn ${formatType === 'Short' ? 'active' : ''}`}
                onClick={() => setFormatType('Short')}
              >
                🎬 Short (3 Beats)
              </button>
              <button
                type="button"
                className={`format-toggle-btn ${formatType === 'Long' ? 'active' : ''}`}
                onClick={() => setFormatType('Long')}
              >
                📹 Long (5 Beats)
              </button>
            </div>
          </div>

          {/* Working Title */}
          <div className="form-group">
            <label className="form-label">Working Title *</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Overcoming Morning Joint Stiffness"
              required
            />
          </div>

          {/* Status Selection */}
          <div className="form-group">
            <label className="form-label">Stage / Status</label>
            <div className="pill-select-group">
              {[
                { key: '#edit', label: '✂️ #edit (Filmed, in edit)' },
                { key: '#film', label: '🎬 #film (Filming ready)' },
                { key: '#idea', label: '💡 #idea' },
                { key: '#write', label: '📝 #write' },
              ].map(s => (
                <button
                  type="button"
                  key={s.key}
                  className={`pill-option ${status === s.key ? 'active' : ''}`}
                  onClick={() => setStatus(s.key)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pillar / Level Focus */}
          <div className="form-group">
            <label className="form-label">Level & Pillar Focus</label>
            <select
              className="form-select"
              value={selectedPillarIndex}
              onChange={(e) => setSelectedPillarIndex(Number(e.target.value))}
            >
              {PILLAR_OPTIONS.map((p, idx) => (
                <option key={idx} value={idx}>
                  {p.level} — {p.pillar} ({p.codePrefix})
                </option>
              ))}
            </select>
          </div>

          {/* Code & Drop Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Video Code</label>
              <input
                type="text"
                className="form-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. 80.V1B-S4"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Target Drop Date</label>
              <input
                type="date"
                className="form-input"
                value={dropDate}
                onChange={(e) => setDropDate(e.target.value)}
              />
            </div>
          </div>

          {/* Transcript / Field Notes */}
          <div className="form-group">
            <label className="form-label">Spoken Transcript / Field Notes</label>
            <textarea
              className="form-textarea"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste exact spoken transcript or write quick notes from filming..."
              style={{ minHeight: '90px' }}
            />
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                <>
                  <RefreshCw size={15} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Plus size={16} /> Add Video to Pipeline
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;

