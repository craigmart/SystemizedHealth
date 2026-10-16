import { useEffect, useState, useRef, useMemo } from 'react';
import { supabase } from './supabase';
import { 
  Calendar, CheckSquare, AlertCircle, RefreshCw, ChevronLeft, Save, Tag, 
  TrendingUp, Clock, FileVideo, Scissors, Film, X, ExternalLink,
  Check, MessageSquare, Plus, Trash2, ListTodo, FileText, CheckCircle2, Lightbulb, Link,
  Sparkles, FileEdit, Search, Share2, Eye, Edit3, Play, BookOpen
} from 'lucide-react';
import { addDays, isBefore, parseISO, differenceInDays, format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import ChecklistDefinitions from './ChecklistDefinitions';

export const CHECKLIST_ITEMS = [
  // IDEA (#idea)
  { key: 'idea_demand', phase: 'Idea', label: 'Topic Demand validated' },
  { key: 'idea_title', phase: 'Idea', label: 'Title Selected' },
  { key: 'idea_thumb', phase: 'Idea', label: 'Thumbnail Drafted' },
  { key: 'idea_connected', phase: 'Idea', label: 'Connected video chosen' },

  // WRITING (#write)
  { key: 'prep_notebook', phase: 'Writing', label: 'Gemini Notebook research' },
  { key: 'prep_acceptance', phase: 'Writing', label: 'Acceptance criteria' },
  { key: 'prep_card', phase: 'Writing', label: '3×5 card drafted (5 beats)' },

  // FILMING (#film)
  { key: 'film_recorded', phase: 'Filming', label: 'Direct-to-camera recorded' },

  // EDITING (#edit)
  { key: 'edit_transcript', phase: 'Editing', label: 'Spoken transcript pasted' },
  { key: 'edit_broll', phase: 'Editing', label: 'B-roll & pacing matched' },
  { key: 'edit_sound', phase: 'Editing', label: 'Sound & audio enhanced' },

  // PUBLISHING (#uploaded / #published)
  { key: 'pub_thumb', phase: 'Publishing', label: 'Custom thumbnail uploaded' },
  { key: 'pub_upload', phase: 'Publishing', label: 'Studio upload & End Screen' },
  { key: 'pub_pinned', phase: 'Publishing', label: 'Pinned comment link' },
  { key: 'pub_schedule', phase: 'Publishing', label: 'Scheduled for drop date' },

  // ARCHIVED (#published)
  { key: 'pub_cards', phase: 'Archived', label: '3×5 main cards filed' },
  { key: 'archive_gemini_notebook', phase: 'Archived', label: 'Save to Gemini Notebook' },
  { key: 'archive_audit_48h', phase: 'Archived', label: '48-hr satisfaction audit' },
  { key: 'archive_catalog_audit', phase: 'Archived', label: 'Catalog audit' }
];

export const LONG_VIDEO_CHECKLIST_ITEMS = CHECKLIST_ITEMS;
export const SHORT_VIDEO_CHECKLIST_ITEMS = CHECKLIST_ITEMS;

export const CHECKLIST_PHASES = ['All', 'Idea', 'Writing', 'Filming', 'Editing', 'Publishing', 'Archived'];
export const LONG_CHECKLIST_PHASES = CHECKLIST_PHASES;
export const SHORT_CHECKLIST_PHASES = CHECKLIST_PHASES;

export const getChecklistPhaseForStatus = (status) => {
  if (!status) return 'All';
  const clean = status.toLowerCase().replace('#', '').trim();
  switch (clean) {
    case 'idea':
      return 'Idea';
    case 'write':
      return 'Writing';
    case 'film':
      return 'Filming';
    case 'edit':
      return 'Editing';
    case 'uploaded':
      return 'Publishing';
    case 'published':
    case 'archived':
      return 'Archived';
    default:
      return 'All';
  }
};

export const getCompletedPhasesForStatus = (status) => {
  if (!status) return [];
  const clean = status.toLowerCase().replace('#', '').trim();
  switch (clean) {
    case 'write':
      return ['Idea'];
    case 'film':
      return ['Idea', 'Writing'];
    case 'edit':
      return ['Idea', 'Writing', 'Filming'];
    case 'uploaded':
      return ['Idea', 'Writing', 'Filming', 'Editing'];
    case 'published':
      return ['Idea', 'Writing', 'Filming', 'Editing', 'Publishing'];
    case 'archived':
    case 'archive':
      return ['Idea', 'Writing', 'Filming', 'Editing', 'Publishing', 'Archived'];
    default:
      return [];
  }
};

export const isAppleMobile = typeof navigator !== 'undefined' && (
  /iPhone|iPad|iPod/.test(navigator.userAgent) || 
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
);

export const getStarterOutline = (formatType, code) => {
  const isShortVid = formatType === 'Short' || code?.includes('-S');
  if (isShortVid) {
    return `- Title: 
- Hook: 
- Point: 
- CTA: `;
  }

  return `1A - Title: 
1A - Thumbnail: 
1B - Hook: 
1C1 - Point #1: 
1C2 - Point #2: 
1C3 - Point #3: 
1D - Close: 
1E - CTA: `;
};

export const getYouTubeUrl = (video) => {
  if (!video) return null;
  const yId = video.youtube_id;
  const isShort = video.format_type === 'Short' || video.code?.includes('-S') || video.format_type?.toLowerCase().includes('short');
  if (yId && typeof yId === 'string' && yId.trim()) {
    const cleanId = yId.trim();
    return isShort
      ? `https://www.youtube.com/shorts/${cleanId}`
      : `https://youtu.be/${cleanId}`;
  }
  return null;
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

export const checkIsDuplicateCode = (video, allVideos) => {
  if (!video || !video.code) return false;
  const c = video.code.trim();
  if (c.includes('-TBD') || c.startsWith('TBD')) return true;

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const myDate = video.drop_date || todayStr;
  const myStatus = video.status || '#idea';
  const isActive = ['#write', '#film', '#edit', '#uploaded', '#published'].includes(myStatus);

  return (allVideos || []).some(other => {
    if (other.id ? other.id === video.id : other.video_number === video.video_number) return false;
    if ((other.code || '').trim().toLowerCase() !== c.toLowerCase()) return false;

    const otherDate = other.drop_date || todayStr;
    const otherActive = ['#write', '#film', '#edit', '#uploaded', '#published'].includes(other.status);

    // If other has an earlier drop date, I am the future duplicate
    if (myDate > otherDate) return true;

    // If other is actively in production/published and I am not, I am the duplicate
    if (otherActive && !isActive) return true;

    // If identical date and status, mark the higher video_number (newer entry) as duplicate
    if (myDate === otherDate && (video.video_number || 0) > (other.video_number || 0)) return true;

    return false;
  });
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
  const [showDefinitionsPage, setShowDefinitionsPage] = useState(false);
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
      await fetchVideos({ keepCurrent: true, checkUrl: false, targetVideo: prevVideo });
    } catch (err) {
      console.error("Error navigating back to previous video:", err);
    } finally {
      setIsExiting(false);
    }
  };

  const handleNavigateToVideo = async (targetVideo) => {
    if (!targetVideo) return;
    if (isExiting) return;
    try {
      if (videoDetailRef.current && videoDetailRef.current.saveAllChanges) {
        await videoDetailRef.current.saveAllChanges();
      }
    } catch (err) {
      console.error("Error saving video before navigation:", err);
    }
    openVideo(targetVideo, true, true);
    await fetchVideos({ keepCurrent: true, checkUrl: false, targetVideo });
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


  const handleOpenChannel = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isAppleMobile) {
      // Direct deep-link to native YouTube app on iOS/iPadOS
      window.location.href = 'youtube://www.youtube.com/@CraigAndersonDC';
    } else {
      window.open('https://www.youtube.com/@CraigAndersonDC', '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenVidIQ = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isAppleMobile) {
      window.location.href = 'https://app.vidiq.com/feed';
    } else {
      window.open('https://app.vidiq.com/feed', '_blank', 'noopener,noreferrer');
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
      if (code.includes('V2C')) return { level: 'Level 2 (Inward)', pillar: 'Connect with Creator' };
      if (code.includes('V3A')) return { level: 'Level 3 (Outward)', pillar: 'Play' };
      if (code.includes('V3B')) return { level: 'Level 3 (Outward)', pillar: 'Organize' };
      if (code.includes('V3C')) return { level: 'Level 3 (Outward)', pillar: 'Connect' };
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
    const { keepCurrent = true, checkUrl = true, targetVideo = undefined } = options;
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
            v.code?.replace(/^\d+\./, '').toLowerCase() === targetParam.toLowerCase() ||
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

      const activeVideo = targetVideo !== undefined ? targetVideo : currentVideo;
      if (keepCurrent && activeVideo) {
        const updated = list.find(v => v.id === activeVideo.id || v.code === activeVideo.code);
        if (updated) setCurrentVideo(updated);
        else if (targetVideo) setCurrentVideo(targetVideo);
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
          v.code?.replace(/^\d+\./, '').toLowerCase() === targetParam.toLowerCase() ||
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
    if (checkIsDuplicateCode(video, videos)) return '#f97316';
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
      if (!checklist.archive_audit_48h && !video.code?.startsWith('HIST')) {
        return { step: '48-hr satisfaction audit', type: 'checklist' };
      }
      if (!checklist.archive_catalog_audit && !video.code?.startsWith('HIST')) {
        return { step: 'Catalog audit', type: 'checklist' };
      }
      if (checklist.custom_tasks && Array.isArray(checklist.custom_tasks)) {
        const pendingCustom = checklist.custom_tasks.find(t => !t.done);
        if (pendingCustom) {
          return { step: pendingCustom.label, type: 'custom' };
        }
      }
      return { step: 'Completed & published', type: 'done' };
    }

    // 3. Uploaded videos (#uploaded)
    if (video.status === '#uploaded') {
      if (!checklist.pub_thumb) return { step: 'Custom thumbnail uploaded', type: 'checklist' };
      if (!checklist.pub_upload) return { step: 'Studio upload & End Screen', type: 'checklist' };
      if (!checklist.pub_pinned) return { step: 'Pinned comment link', type: 'checklist' };
      if (!checklist.pub_schedule) return { step: 'Scheduled for drop date', type: 'checklist' };
      return { step: 'Confirm YouTube Studio release', type: 'publish' };
    }

    // 4. Editing videos (#edit)
    if (video.status === '#edit') {
      if (!video.raw_transcript || !video.raw_transcript.trim()) {
        return { step: 'Paste spoken transcript into App', type: 'action' };
      }
      if (!checklist.edit_transcript) return { step: 'Spoken transcript pasted', type: 'checklist' };
      if (!checklist.edit_broll) return { step: 'B-roll & pacing matched', type: 'checklist' };
      if (!checklist.edit_sound) return { step: 'Sound & audio enhanced', type: 'checklist' };

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
      if (!checklist.film_recorded) return { step: 'Direct-to-camera recorded', type: 'checklist' };
      return { step: 'Ready to edit (#edit)', type: 'action' };
    }

    // 6. Writing videos (#write)
    if (video.status === '#write') {
      if (!checklist.prep_notebook) return { step: 'Gemini Notebook research', type: 'checklist' };
      if (!checklist.prep_acceptance) return { step: 'Acceptance criteria', type: 'checklist' };
      if (!checklist.prep_card) return { step: '3×5 card drafted (5 beats)', type: 'checklist' };
      return { step: 'Ready to film (#film)', type: 'action' };
    }

    // 7. Idea videos (#idea)
    if (video.status === '#idea') {
      if (!checklist.idea_demand) return { step: 'Topic Demand validated', type: 'checklist' };
      if (!checklist.idea_title) return { step: 'Title Selected', type: 'checklist' };
      if (!checklist.idea_thumb) return { step: 'Thumbnail Drafted', type: 'checklist' };
      if (!checklist.idea_connected) return { step: 'Connected video chosen', type: 'checklist' };
      return { step: 'Ready to write (#write)', type: 'action' };
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

  // Metrics Calculation: Days from last Long video posted
  const publishedVideos = videos.filter(v => v.status === '#published');
  const publishedLongs = publishedVideos.filter(v => {
    return v.format_type === 'Long' || (!v.code?.includes('-S') && !v.format_type?.toLowerCase().includes('short'));
  }).sort(sortByDropDateDesc);

  let daysSinceLastLong = null;
  let lastLongVideo = null;
  if (publishedLongs.length > 0) {
    lastLongVideo = publishedLongs[0];
    const postDateStr = lastLongVideo.drop_date || lastLongVideo.uploaded_date;
    if (postDateStr) {
      const postDate = parseISO(postDateStr);
      if (!isNaN(postDate.getTime())) {
        postDate.setHours(0, 0, 0, 0);
        daysSinceLastLong = Math.max(0, Math.floor((todayDate - postDate) / (1000 * 60 * 60 * 24)));
      }
    }
  }

  const editingVideos = videos.filter(v => v.status === '#edit');
  const readyToFilmVideos = videos.filter(v => v.status === '#film');
  const writingVideos = videos.filter(v => v.status === '#write');
  const futureVideos = videos.filter(v => {
    if (v.status === '#published') return false;
    if (v.code?.startsWith('HIST')) return false;
    return v.status === '#idea';
  });

  const openModal = (title, videoList) => {
    const listCopy = [...videoList];
    const sorter = title === 'Published Videos' || title === 'Published Long Videos' ? sortByDropDateDesc : sortByDropDate;
    setMetricModal({ title, videos: listCopy.sort(sorter) });
  };

  const renderDashboard = () => {
    // 1. Build Pipeline: Upcoming Long videos (Topic Rotation Cycle)
    const activeOrUpcomingLongs = videos.filter(v => {
      if (v.status === '#published') return false;
      if (v.code?.startsWith('HIST')) return false;
      const isLong = v.format_type === 'Long' || (!v.code?.includes('-S') && !v.format_type?.toLowerCase().includes('short'));
      return isLong;
    });

    // Also include rotationCatalog for any missing upcoming slots
    const catalogLongs = (rotationCatalog || []).filter(r => r.format_type === 'Long' || r.rotation_format === 'Long');
    const existingCodes = new Set(activeOrUpcomingLongs.map(v => v.code));

    const allPipelineVideos = [...activeOrUpcomingLongs];
    catalogLongs.forEach(cat => {
      if (!existingCodes.has(cat.code) && !deletedCodes.includes(cat.code)) {
        allPipelineVideos.push(cat);
      }
    });

    // Map each code to its position in rotationCatalog to preserve sprint order
    const rotationIndexMap = {};
    (rotationCatalog || []).forEach((r, idx) => {
      if (r.code) rotationIndexMap[r.code] = idx;
    });

    // Order pipeline items:
    // If both have anticipated drop dates, sort by drop date.
    // If only one has drop date, dated video comes first.
    // Otherwise maintain rotation catalog sequence (e.g. 6-Week Monetization Sprint).
    allPipelineVideos.sort((a, b) => {
      if (a.drop_date && b.drop_date) {
        return parseISO(a.drop_date).getTime() - parseISO(b.drop_date).getTime();
      }
      if (a.drop_date && !b.drop_date) return -1;
      if (!a.drop_date && b.drop_date) return 1;

      const idxA = rotationIndexMap[a.code] !== undefined ? rotationIndexMap[a.code] : 999;
      const idxB = rotationIndexMap[b.code] !== undefined ? rotationIndexMap[b.code] : 999;
      if (idxA !== idxB) return idxA - idxB;

      return (parseInt(a.video_number, 10) || 0) - (parseInt(b.video_number, 10) || 0);
    });

    const pipelineItems = allPipelineVideos.map(v => {
      const rotInfo = getRotationInfo(v);
      const hasTranscript = !!(v.raw_transcript && v.raw_transcript.trim());
      return {
        isPlaceholder: false,
        video: v,
        code: v.code,
        title: v.title,
        status: v.status || '#idea',
        drop_date: v.drop_date || null,
        notes: v.notes,
        format_type: 'Long',
        level: rotInfo?.level || v.os_level || 'Systemized OS',
        pillar: rotInfo?.pillar || 'Core',
        hasTranscript
      };
    });

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
        <div className="card metric-tile" onClick={() => openModal('Published Long Videos', publishedLongs)} title={lastLongVideo ? `Last Long: ${lastLongVideo.title}` : undefined}>
          <div style={{ backgroundColor: 'var(--accent-color)', color: '#fff', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Days Since Last Video</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', lineHeight: '1.2' }}>
              {daysSinceLastLong !== null ? daysSinceLastLong : 3}
            </div>
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

              const isDuplicate = checkIsDuplicateCode(item, videos);

              return (
                <div
                  key={`wip-${item.code}`}
                  className={`video-item ${isLong ? 'video-item-long' : 'video-item-short'} video-item-${item.status ? item.status.replace('#', '') : ''}`}
                  style={{ borderLeft: `${isLong ? '7px' : '4px'} solid ${isDuplicate ? '#f97316' : borderLeftColor}`, cursor: 'pointer' }}
                  onClick={() => openVideo(item)}
                >
                  <div className="video-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <strong
                        className={isLong ? 'video-code' : ''}
                        style={isDuplicate ? {
                          color: '#ea580c',
                          backgroundColor: 'rgba(249, 115, 22, 0.12)',
                          border: '1px solid #f97316',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px'
                        } : {}}
                      >
                        {item.code}
                      </strong>
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

        {/* Section 2: Pipeline (Upcoming Topic Rotation) */}
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Calendar size={20} color="var(--accent-color)" /> Pipeline
          </h2>
          <div className="videos-list">
            {pipelineItems.map((item, idx) => {
              const rotInfo = getRotationInfo(item.video || item);
              const level = item.level || rotInfo?.level;
              const pillar = item.pillar || rotInfo?.pillar;
              const displayTitle = (item.title && item.title.trim())
                ? item.title.trim()
                : (level || 'Systemized OS');

              const isDuplicate = checkIsDuplicateCode(item.video || item, videos);

              return (
                <div
                  key={`pipeline-${item.code}-${idx}`}
                  className={`video-item video-item-long video-item-${item.status ? item.status.replace('#', '') : 'idea'}`}
                  style={{
                    cursor: 'pointer',
                    borderLeft: `7px solid ${isDuplicate ? '#f97316' : getBorderColor(item.video || item)}`
                  }}
                  onClick={() => openVideo(item.video || item)}
                >
                  <div className="video-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <strong
                        className="video-code"
                        style={isDuplicate ? {
                          color: '#ea580c',
                          backgroundColor: 'rgba(249, 115, 22, 0.12)',
                          border: '1px solid #f97316',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px'
                        } : {}}
                      >
                        {item.code}
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>
                        Long
                      </span>
                      {pillar && <span className="badge-pillar" title="Pillar Focus">{pillar}</span>}
                      {item.notes && <span title="Production Log" style={{ fontSize: '0.75rem' }}>📝</span>}
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="video-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem', gap: '0.5rem' }}>
                    <span className="video-title" style={{ fontWeight: '700', fontSize: '1.05rem' }}>
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
                              if (e.key === 'Enter') handleQuickSaveDropDate(e, item.video || item);
                              if (e.key === 'Escape') setEditingWipDateCode(null);
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: '0.15rem 0.4rem', fontSize: '0.72rem', height: '26px' }}
                            onClick={e => handleQuickSaveDropDate(e, item.video || item)}
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
                          <span style={{
                            fontWeight: item.drop_date ? '800' : '500',
                            color: item.drop_date ? 'var(--accent-color)' : 'var(--text-secondary)',
                            fontSize: item.drop_date ? '0.92rem' : '0.82rem'
                          }}>
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
                              fontSize: '0.72rem'
                            }}
                            onClick={e => {
                              e.stopPropagation();
                              setEditingWipDateCode(item.code);
                              setWipDateValue(item.drop_date || '');
                            }}
                            title={item.drop_date ? "Edit anticipated drop date" : "Set anticipated drop date"}
                          >
                            <Edit3 size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {pipelineItems.length === 0 && (
              <p style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No upcoming videos in the pipeline.
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
                  const isDuplicate = checkIsDuplicateCode(v, videos);
                  const displayTitle = (v.title && v.title.trim())
                    ? v.title.trim()
                    : (rotInfo?.level || v.os_level || 'Untitled');
                  return (
                    <div
                      key={v.code}
                      className="video-item"
                      style={{ borderLeft: isDuplicate ? '4px solid #f97316' : undefined, cursor: 'pointer' }}
                      onClick={() => { openVideo(v); setMetricModal(null); }}
                    >
                      <div className="video-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                          <strong style={isDuplicate ? {
                            color: '#ea580c',
                            backgroundColor: 'rgba(249, 115, 22, 0.12)',
                            border: '1px solid #f97316',
                            padding: '0.05rem 0.35rem',
                            borderRadius: '4px'
                          } : {}}>
                            {v.code}: {displayTitle}
                          </strong>
                        </div>
                        {getStatusBadge(v.status)}
                      </div>
                      <div className="video-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Drop: {v.drop_date ? format(parseISO(v.drop_date), 'EEE, MMM d, yyyy') : 'TBD'}</span>
                        {getYouTubeUrl(v) && (
                          <a
                            href={getYouTubeUrl(v)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              fontSize: '0.78rem',
                              color: '#ef4444',
                              fontWeight: '600',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              textDecoration: 'none',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(239, 68, 68, 0.08)',
                              border: '1px solid rgba(239, 68, 68, 0.25)'
                            }}
                            title="Watch video on YouTube"
                          >
                            <ExternalLink size={12} /> Watch
                          </a>
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
              const isDuplicate = checkIsDuplicateCode(v, videos);

              return (
                <div
                  key={v.code}
                  className={`video-item ${isLong ? 'video-item-long' : 'video-item-short'} video-item-${v.status ? v.status.replace('#', '') : 'idea'}`}
                  style={{ cursor: 'pointer', borderLeft: `${isLong ? '7px' : '4px'} solid ${isDuplicate ? '#f97316' : getBorderColor(v)}` }}
                  onClick={() => {
                    handleNavigateToVideo(v);
                    setSearchQuery('');
                  }}
                >
                  <div className="video-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <strong
                        className={isLong ? 'video-code' : ''}
                        style={isDuplicate ? {
                          color: '#ea580c',
                          backgroundColor: 'rgba(249, 115, 22, 0.12)',
                          border: '1px solid #f97316',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px'
                        } : {}}
                      >
                        {v.code}
                      </strong>
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
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                      {getYouTubeUrl(v) && (
                        <a
                          href={getYouTubeUrl(v)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            fontSize: '0.75rem',
                            color: '#ef4444',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            textDecoration: 'none',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.25)'
                          }}
                          title="Watch video on YouTube"
                        >
                          <ExternalLink size={11} /> Watch
                        </a>
                      )}
                      <span style={{ fontWeight: isLong ? '800' : '600', color: isLong ? 'var(--accent-color)' : 'var(--text-secondary)', fontSize: isLong ? '0.92rem' : '0.82rem' }}>
                        {v.drop_date ? format(parseISO(v.drop_date), 'EEE, MMM d, yyyy') : 'No Date'}
                      </span>
                    </div>
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
      {!currentVideo && !showDefinitionsPage && (
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
              <button
                className="btn btn-outline btn-icon-only"
                onClick={() => fetchVideos()}
                disabled={loading}
                title="Refresh pipeline data"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              </button>
              <button
                type="button"
                onClick={() => setShowDefinitionsPage(true)}
                className="btn btn-outline"
                title="Open Workflow Reference Guide & Checklist Definitions"
              >
                <BookOpen size={14} />
                <span>Guide</span>
              </button>
              <a
                href={isAppleMobile ? "https://studio.youtube.com" : "https://studio.youtube.com/channel/UCSnF1YqGqmNosGdX5JqY1gQ"}
                className="btn btn-outline"
                title="Open YouTube Studio"
                target={isAppleMobile ? undefined : "_blank"}
                rel={isAppleMobile ? undefined : "noopener noreferrer"}
              >
                <ExternalLink size={14} />
                <span>Studio</span>
              </a>
              <button
                type="button"
                onClick={handleOpenChannel}
                className="btn btn-outline"
                title="Open YouTube Channel"
              >
                <ExternalLink size={14} />
                <span>Channel</span>
              </button>
              <button
                type="button"
                onClick={handleOpenVidIQ}
                className="btn btn-outline"
                title="Open vidIQ Feed"
              >
                <ExternalLink size={14} />
                <span>Vid IQ</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {loading && !currentVideo && !showDefinitionsPage ? (
        <p>Loading pipeline data...</p>
      ) : showDefinitionsPage ? (
        <ChecklistDefinitions onBack={() => setShowDefinitionsPage(false)} />
      ) : trimmedSearch ? (
        renderSearchResults()
      ) : currentVideo ? (
        <VideoDetail 
          key={currentVideo.id || currentVideo.code}
          video={currentVideo} 
          saveRef={videoDetailRef}
          getRotationInfo={getRotationInfo} 
          onUpdate={fetchVideos} 
          onDelete={handleVideoDeleted} 
          onBack={handleBack} 
          onOpenVideo={handleNavigateToVideo}
          videos={videos}
          previousVideo={videoHistory.length > 0 ? videoHistory[videoHistory.length - 1] : null}
          onBackToPrevVideo={handleBackToPrevVideo}
          isExiting={isExiting}
          onOpenDefinitions={() => setShowDefinitionsPage(true)}
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

function VideoDetail({ video, saveRef, getRotationInfo, onUpdate, onDelete, onBack, onOpenVideo, videos, previousVideo, onBackToPrevVideo, isExiting, onOpenDefinitions }) {
  const [localVideo, setLocalVideo] = useState(video);
  const [agentMessage, setAgentMessage] = useState(video.agent_message || '');
  const [transcript, setTranscript] = useState(video.raw_transcript || '');
  const [notes, setNotes] = useState(video.notes || '');
  const [newLogEntry, setNewLogEntry] = useState('');
  const [newCustomTask, setNewCustomTask] = useState('');
  const [checklistPhase, setChecklistPhase] = useState(() => getChecklistPhaseForStatus(video.status));
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveOutlineSuccess, setSaveOutlineSuccess] = useState(false);
  const [scratchPadMode, setScratchPadMode] = useState('preview');
  const [copiedYouTube, setCopiedYouTube] = useState(false);
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

  const isDuplicate = checkIsDuplicateCode(localVideo, videos);

  const resolveCodeConflict = async (newCode) => {
    if (!newCode) return { success: false, error: 'Video code cannot be empty.' };

    const cleanNew = newCode.trim();
    const currentCode = (localVideo.code || '').trim();
    if (cleanNew.toLowerCase() === currentCode.toLowerCase()) {
      return { success: true };
    }

    const normNew = cleanNew.toLowerCase().replace(/^80\./, '');

    // Check if any other video currently uses this code (exact or normalized)
    const conflictingVideo = (videos || []).find(v => {
      if (v.id === localVideo.id || v.video_number === localVideo.video_number) return false;
      const vCode = (v.code || '').trim().toLowerCase();
      const normV = vCode.replace(/^80\./, '');
      return vCode === cleanNew.toLowerCase() || normV === normNew;
    });

    if (!conflictingVideo) {
      return { success: true };
    }

    // Check if conflictingVideo is past / active production video
    const isPastOrActiveStatus = ['#published', '#uploaded', '#edit', '#film'].includes(conflictingVideo.status);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const localDropDate = localVideo.drop_date || todayStr;
    const conflictDropDate = conflictingVideo.drop_date;

    const isFutureConflict = !isPastOrActiveStatus && (
      (conflictDropDate && conflictDropDate > localDropDate) ||
      (conflictDropDate && conflictDropDate > todayStr)
    );

    if (!isFutureConflict) {
      const msg = `Cannot use code "${cleanNew}": It is already assigned to active/published video #${conflictingVideo.video_number} ("${conflictingVideo.title}" — Drop: ${conflictingVideo.drop_date || 'No date'}, Status: ${conflictingVideo.status}). Past and active codes must remain unique.`;
      alert(msg);
      return { success: false, error: msg };
    }

    // It is a future code! Codes in the future do not block today's video.
    // Reassign the future video's code to free up the code in Supabase.
    try {
      let reassignedCode = `${conflictingVideo.code}-TBD`;
      if ((videos || []).some(v => (v.code || '').toLowerCase() === reassignedCode.toLowerCase())) {
        reassignedCode = `${conflictingVideo.code}-TBD-${conflictingVideo.video_number}`;
      }

      const now = new Date();
      const dateStr = now.toLocaleDateString('en-CA');
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const futureLog = `- [${dateStr} ${timeStr}] Code "${conflictingVideo.code}" claimed by sprint video #${localVideo.video_number}.`;
      const updatedFutureNotes = conflictingVideo.notes && conflictingVideo.notes.trim()
        ? `${futureLog}\n${conflictingVideo.notes.trim()}`
        : futureLog;

      if (supabase) {
        const { error: fErr } = await supabase
          .from('videos')
          .update({
            code: reassignedCode,
            notes: updatedFutureNotes
          })
          .eq('video_number', conflictingVideo.video_number);

        if (fErr) {
          alert(`Error updating future video #${conflictingVideo.video_number}: ${fErr.message}`);
          return { success: false, error: fErr.message };
        }
      }

      return {
        success: true,
        reassigned: {
          videoNumber: conflictingVideo.video_number,
          oldCode: conflictingVideo.code,
          newCode: reassignedCode
        }
      };
    } catch (err) {
      alert(`Unexpected error reassigning future code: ${err.message}`);
      return { success: false, error: err.message };
    }
  };

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
      const conflictRes = await resolveCodeConflict(trimmedCode);
      if (!conflictRes.success) {
        return false;
      }
      updatedCode = trimmedCode;
      let logMsg = `Code updated: "${localVideo.code}" → "${trimmedCode}"`;
      if (conflictRes.reassigned) {
        logMsg += ` (future #${conflictRes.reassigned.videoNumber} marked as ${conflictRes.reassigned.newCode})`;
      }
      changeLogs.push(logMsg);
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

    let updatedAgentMsg = agentMessage;
    if (codeChanged && updatedAgentMsg?.includes('Needs code modification')) {
      updatedAgentMsg = '';
    }

    const updatePayload = {
      code: updatedCode,
      title: updatedTitle,
      drop_date: trimmedDropDate || null,
      agent_message: updatedAgentMsg,
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


  const [outline, setOutline] = useState(() => {
    return video.rough_outline || getStarterOutline(video.format_type, video.code);
  });

  const scratchPadRef = useRef(null);

  const adjustScratchPadHeight = () => {
    if (scratchPadRef.current) {
      scratchPadRef.current.style.height = 'auto';
      const newHeight = Math.max(180, scratchPadRef.current.scrollHeight);
      scratchPadRef.current.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    if (scratchPadMode === 'edit') {
      adjustScratchPadHeight();
      const timer = setTimeout(adjustScratchPadHeight, 30);
      const timer2 = setTimeout(adjustScratchPadHeight, 150);
      return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
      };
    }
  }, [outline, video, scratchPadMode]);

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

    // 1. NotebookLM / Gemini Notebook (must explicitly be a notebook URL)
    if (
      lowerRaw.includes('notebooklm') ||
      lowerRaw.includes('notebook.google') ||
      lowerRaw.includes('g.co/notebook') ||
      lowerRaw.includes('/notebook/') ||
      lowerRaw.includes('/notebook')
    ) {
      return 'Gemini Notebook';
    }

    // 2. Gemini Chat (e.g. gemini.google.com/share/..., gemini.google.com/app/..., g.co/gemini)
    if (
      lowerRaw.includes('gemini.google') ||
      lowerRaw.includes('g.co/gemini')
    ) {
      return 'Gemini Chat';
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
      const pathLower = parsed.pathname.toLowerCase();

      // Check for Notebook vs Chat on parsed URL structure
      if (
        lower.includes('notebooklm') ||
        lower.includes('notebook.google') ||
        pathLower.includes('notebook')
      ) {
        return 'Gemini Notebook';
      }

      if (
        lower.includes('gemini.google') ||
        pathLower.includes('gemini') ||
        lower === 'gemini.com'
      ) {
        return 'Gemini Chat';
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
  const outlineUrls = useMemo(() => extractUrls(outline), [outline]);
  const logUrls = useMemo(() => extractUrls([notes, newLogEntry].filter(Boolean).join('\n')), [notes, newLogEntry]);
  const transcriptUrls = useMemo(() => extractUrls(transcript), [transcript]);
  const agentNoteUrls = useMemo(() => extractUrls(agentMessage), [agentMessage]);

  const getResolvedHref = (link) => {
    if (!link || !link.href) return '';
    let href = link.href;
    // Normalize notebook.google.com to notebooklm.google.com so iOS Universal Links
    // accurately match the native Gemini Notebook app's registered domain
    if (link.domain === 'Gemini Notebook' || href.includes('notebook.google.com')) {
      href = href.replace('://notebook.google.com', '://notebooklm.google.com');
    }
    return href;
  };

  const renderBoxLinks = (urls) => {
    if (!urls || urls.length === 0) return null;
    return (
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '0.65rem', 
          marginTop: '0.4rem', 
          marginBottom: '0.35rem',
          padding: '0.15rem 0'
        }}
      >
        {urls.map((link, idx) => (
          <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem' }}>
            {idx > 0 && <span style={{ color: 'var(--border-color)', userSelect: 'none' }}>•</span>}
            <a
              href={getResolvedHref(link)}
              onClick={(e) => handleLinkClick(e, link)}
              target={link.videoCode ? undefined : (isAppleMobile ? undefined : "_blank")}
              rel={link.videoCode ? undefined : (isAppleMobile ? undefined : "noopener noreferrer")}
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
    );
  };
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

  const handleLinkClick = async (e, link) => {
    // 1. Internal pipeline video link
    if (link.videoCode && onOpenVideo && videos) {
      if (e && e.preventDefault) e.preventDefault();
      
      const cleanTarget = (link.videoCode || '').toLowerCase();
      const rawTarget = (link.rawVideoCode || '').toLowerCase();

      const target = videos.find(v => {
        if (!v.code) return false;
        const vClean = v.code.replace(/^\d+\./, '').toLowerCase();
        const vRaw = v.code.toLowerCase();
        return (
          vRaw === rawTarget ||
          vRaw === cleanTarget ||
          vClean === cleanTarget ||
          vClean === rawTarget ||
          vRaw === `80.${cleanTarget}`
        );
      });

      if (target) {
        await onOpenVideo(target);
        return;
      }
    }

    // 2. Obsidian custom URI
    if (link.href && link.href.startsWith('obsidian://')) {
      if (e && e.preventDefault) e.preventDefault();
      window.location.href = link.href;
      return;
    }
  };

  // Backlinks: Any other videos in the pipeline referencing this video
  const backlinks = useMemo(() => {
    if (!videos || !localVideo?.code) return [];
    const thisRawCode = localVideo.code.toLowerCase();
    const thisClean = thisRawCode.replace(/^\d+\./, '');

    return videos.filter(v => {
      if (v.id === localVideo.id || v.code === localVideo.code) return false;
      const textToSearch = [v.notes, v.rough_outline].filter(Boolean).join(' ').toLowerCase();
      if (!textToSearch) return false;
      
      return (
        textToSearch.includes(`video=${thisRawCode}`) ||
        textToSearch.includes(`video=80.${thisClean}`) ||
        textToSearch.includes(`video=${thisClean}`)
      );
    });
  }, [videos, localVideo?.id, localVideo?.code]);

  // Fetch specific video path & propositions
  useEffect(() => {
    setVideoPath(null);
    fetch('/video_paths.json')
      .then(res => res.json())
      .then(paths => {
        if (!paths) return;
        const cleanCode = (video.code || '').replace(/^80\./, '');
        const foundKey = Object.keys(paths).find(k => k === video.code || k === cleanCode);
        if (foundKey) setVideoPath(paths[foundKey]);
        else setVideoPath(null);
      })
      .catch(err => {
        console.error("Could not load video paths:", err);
        setVideoPath(null);
      });

    fetch('/propositions.json')
      .then(res => res.json())
      .then(data => {
        if (!data) return;
        const cleanCode = (video.code || '').replace(/^80\./, '');
        const key = data[video.code] ? video.code : cleanCode;
        if (data[key]) {
          setFilePropositions(data[key]);
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
    let conflictReassigned = null;
    if (codeChanged) {
      const conflictRes = await resolveCodeConflict(trimmedCode);
      if (!conflictRes.success) {
        setSavingTitle(false);
        return;
      }
      conflictReassigned = conflictRes.reassigned;
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-CA');
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    const changeLogs = [];
    if (codeChanged) {
      let logMsg = `Code updated: "${oldCode}" → "${trimmedCode}"`;
      if (conflictReassigned) {
        logMsg += ` (future #${conflictReassigned.videoNumber} marked as ${conflictReassigned.newCode})`;
      }
      changeLogs.push(logMsg);
    }
    if (titleChanged) changeLogs.push(`Title updated: "${oldTitle}" → "${trimmedTitle}"`);
    const logEntry = `- [${dateStr} ${timeStr}] ${changeLogs.join(' | ')}`;
    const updatedNotes = notes && notes.trim() ? `${logEntry}\n${notes.trim()}` : logEntry;

    // Detect format type change if code changed (e.g. -S -> Short)
    const isShortCode = trimmedCode.includes('-S');
    const updatedFormat = isShortCode ? 'Short' : (localVideo.format_type || 'Long');

    let updatedAgentMsg = agentMessage;
    if (codeChanged && updatedAgentMsg?.includes('Needs code modification')) {
      updatedAgentMsg = '';
      setAgentMessage('');
    }

    const updatePayload = {
      code: trimmedCode,
      title: trimmedTitle,
      notes: updatedNotes,
      agent_message: updatedAgentMsg,
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

    let conflictReassigned = null;
    if (codeChanged) {
      const conflictRes = await resolveCodeConflict(trimmedCode);
      if (!conflictRes.success) {
        setSaving(false);
        return;
      }
      conflictReassigned = conflictRes.reassigned;
    }

    if (codeChanged || titleChanged) {
      if (codeChanged) updatedCode = trimmedCode;
      if (titleChanged) updatedTitle = trimmedTitle;
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-CA');
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const changeLogs = [];
      if (codeChanged) {
        let logMsg = `Code updated: "${localVideo.code}" → "${trimmedCode}"`;
        if (conflictReassigned) {
          logMsg += ` (future #${conflictReassigned.videoNumber} marked as ${conflictReassigned.newCode})`;
        }
        changeLogs.push(logMsg);
      }
      if (titleChanged) changeLogs.push(`Title updated: "${localVideo.title}" → "${trimmedTitle}"`);
      const logEntry = `- [${dateStr} ${timeStr}] ${changeLogs.join(' | ')}`;
      currentNotes = currentNotes && currentNotes.trim() ? `${logEntry}\n${currentNotes.trim()}` : logEntry;
      setNotes(currentNotes);
      setIsEditingTitle(false);
    }

    const isShortCode = updatedCode.includes('-S');
    const updatedFormat = isShortCode ? 'Short' : (localVideo.format_type || 'Long');

    let updatedAgentMsg = agentMessage;
    if (codeChanged && updatedAgentMsg?.includes('Needs code modification')) {
      updatedAgentMsg = '';
      setAgentMessage('');
    }

    const updatePayload = {
      code: updatedCode,
      title: updatedTitle,
      agent_message: updatedAgentMsg,
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
        code: updatedCode,
        title: updatedTitle,
        agent_message: updatedAgentMsg,
        raw_transcript: transcript,
        notes: currentNotes,
        rough_outline: outline,
        format_type: updatedFormat
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
      setSaveOutlineSuccess(true);
      setTimeout(() => setSaveOutlineSuccess(false), 2500);
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
    if (isDuplicate) {
      return;
    }
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

  // Public YouTube Share URL
  const publicYouTubeUrl = useMemo(() => {
    // 1. Direct database youtube_id
    const yId = localVideo.youtube_id || video.youtube_id;
    if (yId && typeof yId === 'string' && yId.trim()) {
      const cleanId = yId.trim();
      return isShort
        ? `https://www.youtube.com/shorts/${cleanId}`
        : `https://youtu.be/${cleanId}`;
    }

    // 2. Extracted from detected URLs in notes/outline
    const ytLink = allDetectedUrls.find(l => l.href && (l.href.includes('youtube.com') || l.href.includes('youtu.be')));
    if (ytLink) {
      try {
        const parsed = new URL(ytLink.href);
        if (parsed.hostname.includes('youtu.be')) {
          const id = parsed.pathname.replace(/^\//, '');
          if (id) {
            return isShort ? `https://www.youtube.com/shorts/${id}` : `https://youtu.be/${id}`;
          }
        }
        if (parsed.pathname.includes('/shorts/')) {
          const id = parsed.pathname.split('/shorts/')[1]?.split('/')[0]?.split('?')[0];
          if (id) return `https://www.youtube.com/shorts/${id}`;
        }
        const vParam = parsed.searchParams.get('v');
        if (vParam) {
          return isShort ? `https://www.youtube.com/shorts/${vParam}` : `https://youtu.be/${vParam}`;
        }
      } catch {}
      return ytLink.href;
    }

    return null;
  }, [localVideo.youtube_id, video.youtube_id, isShort, allDetectedUrls]);

  const handleCopyYouTubeUrl = async () => {
    if (!publicYouTubeUrl) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(publicYouTubeUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = publicYouTubeUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedYouTube(true);
      setTimeout(() => setCopiedYouTube(false), 2500);
    } catch (err) {
      console.error("Failed to copy YouTube URL:", err);
      prompt("Copy public YouTube URL:", publicYouTubeUrl);
    }
  };

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
            {publicYouTubeUrl && (
              <a
                href={publicYouTubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: '#ef4444',
                  borderColor: 'rgba(239, 68, 68, 0.35)',
                  textDecoration: 'none',
                  fontWeight: '600'
                }}
                title="Watch on YouTube (opens in new tab)"
              >
                <ExternalLink size={14} />
                <span>Watch YT</span>
              </a>
            )}
            {publicYouTubeUrl && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCopyYouTubeUrl}
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: copiedYouTube ? 'var(--success-color)' : 'inherit'
                }}
                title={`Copy public YouTube video URL for sharing: ${publicYouTubeUrl}`}
              >
                {copiedYouTube ? <Check size={14} color="var(--success-color)" /> : <Share2 size={14} />}
                <span>{copiedYouTube ? 'Copied!' : 'Share YT'}</span>
              </button>
            )}
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
              {isDuplicate ? (
                <span style={{
                  color: '#ea580c',
                  backgroundColor: 'rgba(249, 115, 22, 0.12)',
                  border: '1.5px solid #f97316',
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  marginRight: '0.5rem',
                  fontFamily: 'monospace'
                }}>
                  {localVideo.code}
                </span>
              ) : `${localVideo.code}: `}
              {localVideo.title}
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
            <Tag size={16} color={isDuplicate ? '#f97316' : 'currentColor'} />
            <select
              value={localVideo.status}
              onChange={handleStatusChange}
              className="status-select"
              disabled={isDuplicate}
              style={isDuplicate ? {
                opacity: 0.65,
                cursor: 'not-allowed',
                borderColor: '#f97316',
                color: '#ea580c',
                backgroundColor: 'rgba(249, 115, 22, 0.08)'
              } : {}}
              title={isDuplicate ? "Cannot change tag while code is a duplicate. Update code first." : "Change status tag"}
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

        {/* Watch on YouTube Link & Copy Share URL */}
        {publicYouTubeUrl && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ color: 'var(--border-color)', userSelect: 'none' }}>•</span>
            <a
              href={publicYouTubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#ef4444',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                textDecoration: 'underline',
                textUnderlineOffset: '2px'
              }}
              title="Watch video on YouTube"
            >
              <ExternalLink size={12} />
              <span>Watch on YouTube</span>
            </a>
            <span style={{ color: 'var(--border-color)', userSelect: 'none' }}>•</span>
            <button
              type="button"
              onClick={handleCopyYouTubeUrl}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: '500',
                color: copiedYouTube ? 'var(--success-color)' : 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'color 0.15s ease'
              }}
              title={`Copy public YouTube video URL for sharing: ${publicYouTubeUrl}`}
            >
              {copiedYouTube ? <Check size={12} color="var(--success-color)" /> : <Share2 size={12} />}
              <span style={{ textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                {copiedYouTube ? 'Copied YouTube!' : 'Copy YouTube URL'}
              </span>
            </button>
          </span>
        )}

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

        {/* Bidirectional Backlinks: other videos that link to this video */}
        {backlinks
          .filter(bv => !previousVideo || (bv.id !== previousVideo.id && bv.code !== previousVideo.code))
          .map(bv => {
            const shortCode = (bv.code || '').replace(/^\d+\./, '');
            return (
              <span key={bv.id || bv.code} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ color: 'var(--border-color)', userSelect: 'none' }}>•</span>
                <button
                  type="button"
                  onClick={() => onOpenVideo(bv)}
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
                  title={`Backlink from ${shortCode}: ${bv.title || ''}`}
                >
                  <Link size={12} />
                  <span style={{ textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                    {shortCode}
                  </span>
                </button>
              </span>
            );
          })}

        {/* Detected External & Internal URLs as clean text links */}
        {allDetectedUrls.map((link, idx) => (
          <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ color: 'var(--border-color)', userSelect: 'none' }}>•</span>
            <a
              href={getResolvedHref(link)}
              onClick={(e) => handleLinkClick(e, link)}
              target={link.videoCode ? undefined : (isAppleMobile ? undefined : "_blank")}
              rel={link.videoCode ? undefined : (isAppleMobile ? undefined : "noopener noreferrer")}
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

        {/* Live on YouTube Banner Card */}
        {publicYouTubeUrl && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                backgroundColor: '#ef4444',
                color: '#fff',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Play size={18} fill="#fff" />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {localVideo.status === '#published' ? 'Live on YouTube' : 'YouTube Link'}
                </div>
                <a
                  href={publicYouTubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#ef4444',
                    fontWeight: '700',
                    fontSize: '1rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                  title="Open video on YouTube"
                >
                  <span>{publicYouTubeUrl}</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <a
                href={publicYouTubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{
                  backgroundColor: '#ef4444',
                  borderColor: '#ef4444',
                  color: '#fff',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.9rem',
                  fontWeight: '600'
                }}
              >
                <ExternalLink size={15} />
                <span>Watch on YouTube</span>
              </a>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCopyYouTubeUrl}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.75rem',
                  color: copiedYouTube ? 'var(--success-color)' : 'var(--text-primary)'
                }}
                title="Copy share link"
              >
                {copiedYouTube ? <Check size={14} color="var(--success-color)" /> : <Share2 size={14} />}
                <span>{copiedYouTube ? 'Copied Link!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        )}

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

          {/* Footer: Link to Workflow Reference Guide / Checklist Definitions */}
          <div style={{
            marginTop: '1.1rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
            fontSize: '0.82rem'
          }}>
            <button
              type="button"
              onClick={onOpenDefinitions}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: 'var(--accent-color)',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                textDecoration: 'underline',
                textUnderlineOffset: '2px'
              }}
              title="Open step-by-step checklist definitions & workflow reference guide"
            >
              <BookOpen size={14} />
              <span>View Checklist Definitions & Workflow Reference Guide</span>
            </button>

            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '500' }}>
              6 Phases • 16 Core Beats
            </span>
          </div>
        </div>

        {/* 2. Video Script Outline Section / Scratch Pad */}
        <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.15rem' }}>
                <FileEdit size={20} color="var(--primary-color)" /> Scratch Pad
              </h3>
              {/* Markdown Mode Toggle */}
              <div style={{
                display: 'inline-flex',
                backgroundColor: 'var(--bg-color)',
                borderRadius: 'var(--radius-md)',
                padding: '2px',
                border: '1px solid var(--border-color)',
                gap: '2px'
              }}>
                <button
                  type="button"
                  onClick={() => setScratchPadMode('edit')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.2rem 0.55rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    border: 'none',
                    borderRadius: 'calc(var(--radius-md) - 2px)',
                    cursor: 'pointer',
                    backgroundColor: scratchPadMode === 'edit' ? 'var(--surface-color)' : 'transparent',
                    color: scratchPadMode === 'edit' ? 'var(--primary-color)' : 'var(--text-secondary)',
                    boxShadow: scratchPadMode === 'edit' ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                  title="Edit raw markdown"
                >
                  <Edit3 size={12} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScratchPadMode('preview')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.2rem 0.55rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    border: 'none',
                    borderRadius: 'calc(var(--radius-md) - 2px)',
                    cursor: 'pointer',
                    backgroundColor: scratchPadMode === 'preview' ? 'var(--surface-color)' : 'transparent',
                    color: scratchPadMode === 'preview' ? 'var(--primary-color)' : 'var(--text-secondary)',
                    boxShadow: scratchPadMode === 'preview' ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                  title="Render formatted markdown"
                >
                  <Eye size={12} />
                  <span>Preview</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                onClick={() => {
                  if (!outline.trim() || window.confirm("Reset outline to starter template? This will replace your current outline text.")) {
                    setOutline(getStarterOutline(localVideo.format_type, localVideo.code));
                    setScratchPadMode('edit');
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

          {scratchPadMode === 'edit' ? (
            <textarea
              ref={(el) => {
                scratchPadRef.current = el;
                if (el) {
                  el.style.height = 'auto';
                  el.style.height = `${Math.max(180, el.scrollHeight)}px`;
                }
              }}
              value={outline}
              onChange={(e) => {
                setOutline(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.max(180, e.target.scrollHeight)}px`;
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.max(180, e.target.scrollHeight)}px`;
              }}
              style={{
                width: '100%',
                minHeight: '180px',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--surface-color)',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                fontSize: '0.92rem',
                lineHeight: '1.6',
                overflow: 'hidden',
                resize: 'none',
                boxSizing: 'border-box',
                fieldSizing: 'content'
              }}
              placeholder={getStarterOutline(localVideo.format_type, localVideo.code)}
            />
          ) : (
            <div
              className="scratchpad-markdown-preview markdown-content"
              style={{
                width: '100%',
                minHeight: '180px',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-primary)',
                fontSize: '0.92rem',
                lineHeight: '1.6',
                boxSizing: 'border-box',
                overflowX: 'auto'
              }}
            >
              {outline.trim() ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  components={{
                    a: ({ node, href, children, ...props }) => (
                      <a
                        href={href}
                        target={isAppleMobile ? undefined : "_blank"}
                        rel={isAppleMobile ? undefined : "noopener noreferrer"}
                        onClick={(e) => {
                          if (href && href.startsWith('obsidian://')) {
                            e.preventDefault();
                            window.location.href = href;
                          }
                        }}
                        style={{
                          color: 'var(--accent-color)',
                          textDecoration: 'underline',
                          fontWeight: '500'
                        }}
                        {...props}
                      >
                        {children}
                      </a>
                    ),
                    p: ({ node, children, ...props }) => (
                      <p style={{ margin: '0.35rem 0', color: 'var(--text-primary)' }} {...props}>
                        {children}
                      </p>
                    ),
                    ul: ({ node, children, ...props }) => (
                      <ul style={{ margin: '0.4rem 0', paddingLeft: '1.4rem', color: 'var(--text-primary)' }} {...props}>
                        {children}
                      </ul>
                    ),
                    ol: ({ node, children, ...props }) => (
                      <ol style={{ margin: '0.4rem 0', paddingLeft: '1.4rem', color: 'var(--text-primary)' }} {...props}>
                        {children}
                      </ol>
                    ),
                    li: ({ node, children, ...props }) => (
                      <li style={{ margin: '0.2rem 0', color: 'var(--text-primary)' }} {...props}>
                        {children}
                      </li>
                    ),
                    h1: ({ node, children, ...props }) => (
                      <h1 style={{ fontSize: '1.35rem', margin: '0.8rem 0 0.4rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.3rem' }} {...props}>
                        {children}
                      </h1>
                    ),
                    h2: ({ node, children, ...props }) => (
                      <h2 style={{ fontSize: '1.2rem', margin: '0.7rem 0 0.35rem', color: 'var(--text-primary)' }} {...props}>
                        {children}
                      </h2>
                    ),
                    h3: ({ node, children, ...props }) => (
                      <h3 style={{ fontSize: '1.05rem', margin: '0.6rem 0 0.3rem', color: 'var(--text-primary)' }} {...props}>
                        {children}
                      </h3>
                    ),
                    blockquote: ({ node, children, ...props }) => (
                      <blockquote style={{
                        borderLeft: '3px solid var(--accent-color)',
                        margin: '0.6rem 0',
                        padding: '0.4rem 0.8rem',
                        backgroundColor: 'var(--surface-color)',
                        borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                        color: 'var(--text-secondary)'
                      }} {...props}>
                        {children}
                      </blockquote>
                    ),
                    code: ({ node, inline, children, ...props }) => (
                      <code style={{
                        backgroundColor: 'var(--surface-color)',
                        padding: '0.15rem 0.35rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85em',
                        fontFamily: 'monospace',
                        border: '1px solid var(--border-color)'
                      }} {...props}>
                        {children}
                      </code>
                    )
                  }}
                >
                  {outline}
                </ReactMarkdown>
              ) : (
                <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', padding: '1rem 0' }}>
                  No scratch pad content yet. Click <strong>Edit</strong> or <strong>Insert Template</strong> to get started.
                </div>
              )}
            </div>
          )}

          {renderBoxLinks(outlineUrls)}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--success-color)', fontWeight: '500' }}>
              {saveOutlineSuccess ? '✓ Scratch pad saved to Supabase' : ''}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: 'auto' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', height: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                onClick={handleSaveOutline}
                disabled={saving}
              >
                <Save size={13} /> Save
              </button>
            </div>
          </div>
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
          {renderBoxLinks(logUrls)}

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
                  {renderBoxLinks(transcriptUrls)}
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
            {renderBoxLinks(transcriptUrls)}
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
          {renderBoxLinks(agentNoteUrls)}
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
  { level: 'Level 1: Foundational', pillar: 'Fuel', codePrefix: '80.V1A', defaultJdex: '80.11' },
  { level: 'Level 1: Foundational', pillar: 'Move', codePrefix: '80.V1B', defaultJdex: '80.12' },
  { level: 'Level 1: Foundational', pillar: 'Rest', codePrefix: '80.V1C', defaultJdex: '80.13' },
  { level: 'Level 2: Inward', pillar: 'Thinking', codePrefix: '80.V2A', defaultJdex: '80.21' },
  { level: 'Level 2: Inward', pillar: 'Learning', codePrefix: '80.V2B', defaultJdex: '80.22' },
  { level: 'Level 2: Inward', pillar: 'Connect with Creator/Spiritual', codePrefix: '80.V2C', defaultJdex: '80.23' },
  { level: 'Level 3: Outward', pillar: 'Play', codePrefix: '80.V3A', defaultJdex: '80.31' },
  { level: 'Level 3: Outward', pillar: 'Organize', codePrefix: '80.V3B', defaultJdex: '80.32' },
  { level: 'Level 3: Outward', pillar: 'Connect', codePrefix: '80.V3C', defaultJdex: '80.33' },
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
      const cleanCode = code.trim();
      // Check for code conflict
      const conflictingVideo = (videos || []).find(v => {
        const vCode = (v.code || '').trim().toLowerCase();
        const normV = vCode.replace(/^80\./, '');
        const normNew = cleanCode.toLowerCase().replace(/^80\./, '');
        return vCode === cleanCode.toLowerCase() || normV === normNew;
      });

      if (conflictingVideo) {
        const isPastOrActiveStatus = ['#published', '#uploaded', '#edit', '#film'].includes(conflictingVideo.status);
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const targetDropDate = dropDate.trim() || todayStr;
        const conflictDropDate = conflictingVideo.drop_date;

        const isFutureConflict = !isPastOrActiveStatus && (
          (conflictDropDate && conflictDropDate > targetDropDate) ||
          (conflictDropDate && conflictDropDate > todayStr)
        );

        if (!isFutureConflict) {
          setErrorMsg(`Cannot use code "${cleanCode}": Already assigned to active/published video #${conflictingVideo.video_number} ("${conflictingVideo.title}" — Status: ${conflictingVideo.status}). Past and active codes must remain unique.`);
          setSubmitting(false);
          return;
        }

        // Reassign future video so code is freed in Supabase
        let reassignedCode = `${conflictingVideo.code}-TBD`;
        if ((videos || []).some(v => (v.code || '').toLowerCase() === reassignedCode.toLowerCase())) {
          reassignedCode = `${conflictingVideo.code}-TBD-${conflictingVideo.video_number}`;
        }

        const nowStamp = format(new Date(), 'yyyy-MM-dd HH:mm');
        const futureLog = `- [${nowStamp}] Code "${conflictingVideo.code}" claimed by new sprint video ("${title.trim()}"). Future code marked as needing modification.`;
        const updatedFutureNotes = conflictingVideo.notes && conflictingVideo.notes.trim()
          ? `${futureLog}\n${conflictingVideo.notes.trim()}`
          : futureLog;

        if (supabase) {
          const { error: fErr } = await supabase
            .from('videos')
            .update({
              code: reassignedCode,
              notes: updatedFutureNotes
            })
            .eq('video_number', conflictingVideo.video_number);

          if (fErr) {
            setErrorMsg(`Failed to update future code on #${conflictingVideo.video_number}: ${fErr.message}`);
            setSubmitting(false);
            return;
          }
        }
      }

      let maxVN = 0;
      videos.forEach(v => {
        const n = parseInt(v.video_number, 10);
        if (!isNaN(n) && n > maxVN) maxVN = n;
      });
      const nextVideoNumber = String(maxVN + 1).padStart(3, '0');

      const starterOutline = getStarterOutline(formatType, code);

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

