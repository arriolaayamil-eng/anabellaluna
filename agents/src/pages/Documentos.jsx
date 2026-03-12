import React, { useEffect, useState, useCallback, useRef } from 'react';
import { confirmToast } from '../utils/confirmToast';
import { documentService } from '../services/documentService';
import { isApiUnavailableError } from '../config/api';
import { useStateContext } from '../contexts/ContextProvider';

/* ═══════════════════ iOS-style SVG Icons ═══════════════════ */
const SFIcon = ({ children, size = 22, className = '', viewBox = '0 0 24 24', ...rest }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox={viewBox}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...rest}
  >{children}
  </svg>
);
const FolderFill = ({ size = 22, color = '#007AFF' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
    <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" fill={color} />
  </svg>
);
const DocFill = ({ size = 22, color = '#007AFF' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill={color} opacity="0.85" />
    <polyline points="14 2 14 8 20 8" fill="none" stroke="#fff" strokeWidth="1.5" />
  </svg>
);
const ImgFill = ({ size = 22, color = '#34C759' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="3" fill={color} opacity="0.85" />
    <circle cx="8.5" cy="8.5" r="1.5" fill="#fff" />
    <path d="M21 15l-5-5L5 21" stroke="#fff" strokeWidth="1.5" fill="none" />
  </svg>
);
const StarFill = ({ size = 22, filled = false, color }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? (color || '#FF9500') : 'none'}
    stroke={filled ? (color || '#FF9500') : 'currentColor'}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const ISearch = (p) => <SFIcon {...p}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></SFIcon>;
const IGrid = (p) => <SFIcon {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></SFIcon>;
const IList = (p) => <SFIcon {...p}><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" /></SFIcon>;
// eslint-disable-next-line no-unused-vars
const IUpload = (p) => <SFIcon {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></SFIcon>;
const IDownload = (p) => <SFIcon {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></SFIcon>;
const ITrash = (p) => <SFIcon {...p}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></SFIcon>;
const IMore = (p) => <SFIcon {...p}><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="12" cy="5" r="1.2" fill="currentColor" stroke="none" /><circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none" /></SFIcon>;
const IClose = (p) => <SFIcon {...p}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></SFIcon>;
const IChevron = (p) => <SFIcon size={16} {...p}><polyline points="9 18 15 12 9 6" /></SFIcon>;
const IClock = (p) => <SFIcon {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></SFIcon>;
const IEdit = (p) => <SFIcon {...p}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></SFIcon>;
const IMove = (p) => <SFIcon {...p}><path d="M5 12h14" /><polyline points="12 5 19 12 12 19" /></SFIcon>;
const IEye = (p) => <SFIcon {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></SFIcon>;
const ICloud = (p) => <SFIcon {...p}><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" /></SFIcon>;
const IPlus = (p) => <SFIcon {...p}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></SFIcon>;
const IFolderPlus = (p) => <SFIcon {...p}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /><line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" /></SFIcon>;

/* ═══════════════════ iOS System Colors & Helpers ═══════════════════ */
const API = process.env.REACT_APP_API_URL
  || (typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'https://api.anabellaluna.com.ar'
    : 'http://localhost:4000');
const DOMAIN = 'crm';
const IOS_LIGHT = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  purple: '#AF52DE',
  teal: '#5AC8FA',
  pink: '#FF2D55',
  indigo: '#5856D6',
  gray: '#8E8E93',
  gray2: '#AEAEB2',
  gray3: '#C7C7CC',
  gray4: '#D1D1D6',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  bgGrouped: '#F2F2F7',
  bgCard: '#FFFFFF',
  separator: 'rgba(60,60,67,0.12)',
  label: '#000000',
  label2: '#3C3C43',
  label3: '#8E8E93',
};
const IOS_DARK = {
  blue: '#0A84FF',
  green: '#30D158',
  orange: '#FF9F0A',
  red: '#FF453A',
  purple: '#BF5AF2',
  teal: '#64D2FF',
  pink: '#FF375F',
  indigo: '#5E5CE6',
  gray: '#98989D',
  gray2: '#636366',
  gray3: '#48484A',
  gray4: '#3A3A3C',
  gray5: '#333336',
  gray6: '#2C2C2E',
  bgGrouped: '#202124',
  bgCard: '#292A2D',
  separator: 'rgba(255,255,255,0.08)',
  label: '#E8EAED',
  label2: '#BDC1C6',
  label3: '#9AA0A6',
};

function formatSize(mb) {
  if (!mb) return '';
  if (mb < 1) return `${Math.round(mb * 1024)} KB`;
  return `${mb.toFixed(1)} MB`;
}

function formatDate(d) {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return 'Ahora';
  if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} h`;
  if (date.getFullYear() === now.getFullYear()) return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getFileLabel(tipo) {
  if (tipo === 'PDF') return 'PDF';
  if (tipo === 'Word') return 'DOC';
  if (tipo === 'Imagen') return 'IMG';
  if (tipo === 'ZIP') return 'ZIP';
  return 'FILE';
}

/* ═══════════════════ Main Component ═══════════════════ */
const Documentos = () => {
  const { currentMode } = useStateContext();
  const dark = currentMode === 'Dark';
  const IOS = dark ? IOS_DARK : IOS_LIGHT;

  const CATEGORIES = [
    { key: 'docs', label: 'PDF y Word', color: IOS.blue, icon: (s) => <DocFill size={s} color={IOS.blue} />, filter: (d) => d.tipo === 'PDF' || d.tipo === 'Word' },
    { key: 'images', label: 'Imagenes', color: IOS.green, icon: (s) => <ImgFill size={s} color={IOS.green} />, filter: (d) => d.tipo === 'Imagen' },
    { key: 'archives', label: 'Archivos ZIP', color: IOS.orange, icon: (s) => <DocFill size={s} color={IOS.orange} />, filter: (d) => d.tipo === 'ZIP' },
    { key: 'starred', label: 'Favoritos', color: IOS.orange, icon: (s) => <StarFill size={s} filled color={IOS.orange} /> },
  ];

  const getFileColor = (tipo) => {
    if (tipo === 'PDF') return IOS.red;
    if (tipo === 'Word') return IOS.blue;
    if (tipo === 'Imagen') return IOS.green;
    if (tipo === 'ZIP') return IOS.orange;
    return IOS.gray;
  };

  const [view, setView] = useState('grid');
  const [tab, setTab] = useState('browse'); // browse | recent | starred | search | category
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [storageInfo, setStorageInfo] = useState(null);

  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);

  const [uploadProgress, setUploadProgress] = useState(null);
  const [actionSheet, setActionSheet] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [moveTarget, setMoveTarget] = useState(null);
  const [moveFolders, setMoveFolders] = useState([]);
  const [moveParent, setMoveParent] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const fileInputRef = useRef(null);

  /* ═══════ Data Loading ═══════ */
  const loadBrowse = useCallback(async (folderId = null) => {
    try {
      setLoading(true); setError('');
      const data = await documentService.browse(folderId);
      setFolders(data.folders || []); setDocuments(data.documents || []);
      if (folderId) { const path = await documentService.folderPath(folderId); setBreadcrumb(path); } else setBreadcrumb([]);
    } catch (e) {
      if (isApiUnavailableError(e)) {
        setError('El backend no está disponible');
      } else {
        setError('Error al cargar archivos');
        console.error(e);
      }
    } finally { setLoading(false); }
  }, []);

  const loadRecent = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const data = await documentService.recent();
      setFolders([]); setDocuments(Array.isArray(data) ? data : []);
    } catch { setError('Error al cargar recientes'); } finally { setLoading(false); }
  }, []);

  const loadStarred = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const data = await documentService.starred();
      setFolders(data.folders || []); setDocuments(data.documents || []);
    } catch { setError('Error al cargar favoritos'); } finally { setLoading(false); }
  }, []);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) return;
    try {
      setLoading(true); setError('');
      const data = await documentService.search(q);
      setFolders(data.folders || []); setDocuments(data.documents || []);
    } catch { setError('Sin resultados'); } finally { setLoading(false); }
  }, []);

  const loadStorage = useCallback(async () => {
    try { const data = await documentService.storage(); setStorageInfo(data); } catch (_e) { /* storage info non-critical */ }
  }, []);

  useEffect(() => {
    if (tab === 'browse') loadBrowse(currentFolder);
    else if (tab === 'recent') loadRecent();
    else if (tab === 'starred') loadStarred();
    else if (tab === 'category') { loadBrowse(null); }
  }, [tab, currentFolder, loadBrowse, loadRecent, loadStarred]);

  useEffect(() => { loadStorage(); }, [loadStorage]);
  useEffect(() => { const h = () => setActionSheet(null); document.addEventListener('click', h); return () => document.removeEventListener('click', h); }, []);

  const navigateToFolder = (id) => { setTab('browse'); setCurrentFolder(id); setCategoryFilter(null); };

  const refresh = () => {
    if (tab === 'browse') loadBrowse(currentFolder);
    else if (tab === 'recent') loadRecent();
    else if (tab === 'starred') loadStarred();
    else if (tab === 'search') doSearch(searchQuery);
    else if (tab === 'category') loadBrowse(null);
  };

  const filteredDocs = tab === 'category' && categoryFilter
    ? documents.filter(categoryFilter.filter || (() => true))
    : documents;

  /* ═══════ File Actions ═══════ */
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []); if (!files.length) return;
    try {
      setUploadProgress(`Subiendo ${files.length} archivo(s)...`); setError('');
      await documentService.upload(files, { headers: { 'x-domain': DOMAIN }, fields: currentFolder ? { folder: currentFolder } : {} });
      setUploadProgress(null); if (fileInputRef.current) fileInputRef.current.value = '';
      if (tab === 'browse') loadBrowse(currentFolder); else if (tab === 'recent') loadRecent(); loadStorage();
      // Check milestones (non-blocking)
      import('../services/crmService').then((m) => m.crmService.rewards.checkMilestones('document')).catch(() => {});
    } catch (err) { setError(`Error al subir: ${err.message || err}`); setUploadProgress(null); }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try { await documentService.createFolder(newFolderName.trim(), currentFolder); setNewFolderMode(false); setNewFolderName(''); loadBrowse(currentFolder); } catch (err) { setError(`Error al crear carpeta: ${err.message || err}`); }
  };

  const handleDelete = async (type, item) => {
    const label = type === 'folder' ? `la carpeta "${item.name}"` : `"${item.nombre}"`;
    if (!(await confirmToast(`¿Eliminar ${label}?`))) return;
    try { if (type === 'folder') await documentService.deleteFolder(item._id); else await documentService.delete(item._id); refresh(); loadStorage(); } catch (err) { setError(`Error al eliminar: ${err.message || err}`); }
  };

  const handleStar = async (type, item) => {
    try { if (type === 'folder') await documentService.starFolder(item._id); else await documentService.starDoc(item._id); refresh(); } catch { setError('Error al marcar favorito'); }
  };

  const handleRenameSubmit = async () => {
    if (!renameValue.trim() || !renameTarget) return;
    try {
      if (renameTarget.type === 'folder') await documentService.renameFolder(renameTarget.item._id, renameValue.trim());
      else await documentService.renameDoc(renameTarget.item._id, renameValue.trim());
      setRenameTarget(null); setRenameValue(''); refresh();
    } catch { setError('Error al renombrar'); }
  };

  const handleDownload = async (doc) => {
    try {
      const url = doc.object_key ? `${API}/documents/${doc._id}/download` : doc.url;
      const token = localStorage.getItem('authToken');
      const resp = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!resp.ok) throw new Error('Error'); const blob = await resp.blob();
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = doc.nombre || 'archivo';
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
    } catch (err) { setError(`Error al descargar: ${err.message || err}`); }
  };

  const handlePreview = async (doc) => {
    try {
      const url = doc.object_key ? `${API}/documents/${doc._id}/download` : doc.url;
      const token = localStorage.getItem('authToken');
      const resp = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!resp.ok) throw new Error('Error'); const blob = await resp.blob();
      setPreviewUrl(URL.createObjectURL(blob)); setPreviewDoc(doc);
    } catch { setError('Error al previsualizar'); }
  };

  const startMove = async (type, item) => {
    setMoveTarget({ type, item }); setMoveParent(null);
    try { const data = await documentService.browse(null); setMoveFolders(data.folders || []); } catch { setMoveFolders([]); }
  };

  const handleMoveConfirm = async () => {
    if (!moveTarget) return;
    try {
      if (moveTarget.type === 'folder') await documentService.moveFolder(moveTarget.item._id, moveParent);
      else await documentService.moveDoc(moveTarget.item._id, moveParent);
      setMoveTarget(null); refresh();
    } catch { setError('Error al mover'); }
  };

  const handleMoveBrowse = async (fId) => {
    setMoveParent(fId);
    try { const data = await documentService.browse(fId); setMoveFolders(data.folders || []); } catch { setMoveFolders([]); }
  };

  const handleSearchSubmit = (e) => { e.preventDefault(); if (!searchQuery.trim()) return; setTab('search'); doSearch(searchQuery.trim()); };
  const clearSearch = () => { setSearchQuery(''); setTab('browse'); };

  const openActionSheet = (e, type, item) => { e.preventDefault(); e.stopPropagation(); setActionSheet({ type, item }); };

  /* ═══════════════════ iOS STYLES (inline) ═══════════════════ */
  const S = {
    page: { fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif', background: IOS.bgGrouped, minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', borderRadius: 20, overflow: 'hidden', margin: '8px', marginTop: 72 },
    searchWrap: { padding: '12px 16px 8px', position: 'sticky', top: 0, zIndex: 10, background: IOS.bgGrouped },
    searchBar: { display: 'flex', alignItems: 'center', gap: 8, background: dark ? 'rgba(118,118,128,0.24)' : 'rgba(118,118,128,0.12)', borderRadius: 10, padding: '8px 12px' },
    searchInput: { flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 16, color: IOS.label, fontFamily: 'inherit' },
    largeTitle: { fontSize: 34, fontWeight: 700, color: IOS.label, padding: '4px 20px 4px', letterSpacing: -0.4 },
    sectionHeader: { fontSize: 13, fontWeight: 600, color: IOS.label3, textTransform: 'uppercase', letterSpacing: 0.5, padding: '16px 20px 6px' },
    card: { background: IOS.bgCard, borderRadius: 12, overflow: 'hidden' },
    cardMargin: { margin: '0 16px', background: IOS.bgCard, borderRadius: 12, overflow: 'hidden' },
    listRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: `0.5px solid ${IOS.separator}`, cursor: 'pointer', transition: 'background 0.15s' },
    listRowLast: { borderBottom: 'none' },
    bottomBar: { display: 'flex', borderTop: `0.5px solid ${IOS.separator}`, background: dark ? 'rgba(41,42,45,0.94)' : 'rgba(249,249,249,0.94)', backdropFilter: 'blur(20px)', padding: '6px 0 env(safe-area-inset-bottom, 8px)' },
    bottomTab: (active) => ({ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 0', border: 'none', background: 'transparent', cursor: 'pointer', color: active ? IOS.blue : IOS.gray, fontSize: 10, fontWeight: 500, fontFamily: 'inherit' }),
    fab: { position: 'fixed', bottom: 80, right: 24, width: 56, height: 56, borderRadius: '50%', background: IOS.blue, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,122,255,0.4)', zIndex: 20 },
    catGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, padding: '8px 16px' },
    // eslint-disable-next-line no-unused-vars
    catCard: (_color) => ({ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, background: IOS.bgCard, cursor: 'pointer', border: 'none', width: '100%', fontFamily: 'inherit', textAlign: 'left' }),
    fileThumb: (color) => ({ width: 40, height: 40, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }),
    fileThumbGrid: (color) => ({ width: '100%', height: 100, borderRadius: '12px 12px 0 0', background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }),
    gridItem: { background: IOS.bgCard, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
    gridWrap: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, padding: '8px 16px 16px' },
    breadcrumb: { display: 'flex', alignItems: 'center', gap: 4, padding: '4px 20px', fontSize: 13, overflowX: 'auto', flexWrap: 'nowrap' },
    toolRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 16px 4px 20px' },
    overlay: { position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.4)' },
    sheet: { background: IOS.bgCard, borderRadius: '14px 14px 0 0', maxHeight: '70vh', overflow: 'auto' },
    sheetAction: (danger) => ({ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: `0.5px solid ${IOS.separator}`, width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 17, color: danger ? IOS.red : IOS.blue, fontFamily: 'inherit', textAlign: 'left' }),
    sheetCancel: { margin: '8px 16px', borderRadius: 14, background: IOS.bgCard, overflow: 'hidden' },
  };

  /* ═══════ Render: iOS Search Bar ═══════ */
  const renderSearch = () => (
    <div style={S.searchWrap}>
      <form onSubmit={handleSearchSubmit} style={S.searchBar}>
        <ISearch size={18} style={{ color: IOS.gray2, flexShrink: 0 }} />
        <input
          style={S.searchInput}
          placeholder="Buscar"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && <button type="button" onClick={clearSearch} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: IOS.gray2, padding: 0 }}><IClose size={16} /></button>}
      </form>
    </div>
  );

  /* ═══════ Render: iOS Breadcrumb ═══════ */
  const renderBreadcrumb = () => {
    if (tab !== 'browse' || breadcrumb.length === 0) return null;
    return (
      <div style={S.breadcrumb}>
        <button type="button" onClick={() => navigateToFolder(null)} style={{ border: 'none', background: 'transparent', color: IOS.blue, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: 0, flexShrink: 0 }}>Mis Archivos</button>
        {breadcrumb.map((b, i) => (
          <React.Fragment key={b._id}>
            <IChevron style={{ color: IOS.gray3, flexShrink: 0 }} />
            {i === breadcrumb.length - 1
              ? <span style={{ color: IOS.label, fontWeight: 600, flexShrink: 0 }}>{b.name}</span>
              : <button type="button" onClick={() => navigateToFolder(b._id)} style={{ border: 'none', background: 'transparent', color: IOS.blue, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: 0, flexShrink: 0 }}>{b.name}</button>}
          </React.Fragment>
        ))}
      </div>
    );
  };

  /* ═══════ Render: Categories Grid (iOS) ═══════ */
  const renderCategories = () => (
    <div>
      <div style={S.sectionHeader}>Categorias</div>
      <div style={S.catGrid}>
        {CATEGORIES.map((cat) => (
          <button
            type="button"
            key={cat.key}
            style={S.catCard(cat.color)}
            onClick={() => {
              if (cat.key === 'starred') { setTab('starred'); setCategoryFilter(null); } else { setCategoryFilter(cat); setTab('category'); }
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `${cat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {cat.icon(20)}
            </div>
            <span style={{ fontSize: 15, fontWeight: 500, color: IOS.label }}>{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  /* ═══════ Render: Storage Card (iOS) ═══════ */
  const renderStorageCard = () => {
    if (!storageInfo) return null;
    const maxGB = 15; const usedGB = (storageInfo.totalMB || 0) / 1024;
    const pct = Math.min((usedGB / maxGB) * 100, 100);
    return (
      <div style={{ ...S.cardMargin, padding: '16px', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <ICloud size={20} style={{ color: IOS.blue }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: IOS.label }}>Almacenamiento</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: IOS.gray5, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: pct > 80 ? IOS.red : pct > 50 ? IOS.orange : IOS.blue, transition: 'width 0.4s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 12, color: IOS.gray }}>{formatSize(storageInfo.totalMB)} de {maxGB} GB</span>
          <span style={{ fontSize: 12, color: IOS.gray }}>{storageInfo.totalFiles} archivos</span>
        </div>
      </div>
    );
  };

  /* ═══════ Render: Locations Card (iOS) ═══════ */
  const renderLocations = () => (
    <div>
      <div style={S.sectionHeader}>Ubicaciones</div>
      <div style={S.cardMargin}>
        <div style={S.listRow} onClick={() => { setTab('browse'); setCurrentFolder(null); setCategoryFilter(null); }}>
          <ICloud size={22} style={{ color: IOS.blue }} />
          <span style={{ flex: 1, fontSize: 17, color: IOS.label }}>Mis Archivos</span>
          <IChevron style={{ color: IOS.gray3 }} />
        </div>
      </div>
    </div>
  );

  /* ═══════ Render: New Folder Input (iOS) ═══════ */
  const renderNewFolder = () => {
    if (!newFolderMode) return null;
    return (
      <div style={{ ...S.cardMargin, marginTop: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <FolderFill size={24} color={IOS.blue} />
        <input
          autoFocus
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setNewFolderMode(false); }}
          placeholder="Nombre de carpeta"
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 17, fontFamily: 'inherit', color: IOS.label, background: 'transparent' }}
        />
        <button type="button" onClick={handleCreateFolder} style={{ border: 'none', background: IOS.blue, color: '#fff', borderRadius: 8, padding: '6px 14px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Crear</button>
        <button type="button" onClick={() => setNewFolderMode(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}><IClose size={18} style={{ color: IOS.gray }} /></button>
      </div>
    );
  };

  /* ═══════ Render: Folder Row (iOS) ═══════ */
  const renderFolderRow = (folder, idx, arr) => {
    const isRenaming = renameTarget && renameTarget.type === 'folder' && renameTarget.item._id === folder._id;
    return (
      <div
        key={folder._id}
        style={{ ...S.listRow, ...(idx === arr.length - 1 ? S.listRowLast : {}) }}
        onClick={() => navigateToFolder(folder._id)}
        onContextMenu={(e) => openActionSheet(e, 'folder', folder)}
      >
        <FolderFill size={28} color={folder.color || IOS.blue} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {isRenaming
            ? (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSubmit(); if (e.key === 'Escape') setRenameTarget(null); }}
                onBlur={handleRenameSubmit}
                onClick={(e) => e.stopPropagation()}
                style={{ fontSize: 17, border: 'none', borderBottom: `2px solid ${IOS.blue}`, outline: 'none', width: '100%', fontFamily: 'inherit', color: IOS.label, background: 'transparent' }}
              />
            )
            : <div style={{ fontSize: 17, color: IOS.label, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{folder.name}</div>}
          <div style={{ fontSize: 13, color: IOS.gray, marginTop: 1 }}>{formatDate(folder.createdAt)}</div>
        </div>
        {folder.starred && <StarFill size={14} filled />}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); openActionSheet(e, 'folder', folder); }}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}
        ><IMore size={18} style={{ color: IOS.gray }} />
        </button>
        <IChevron style={{ color: IOS.gray3 }} />
      </div>
    );
  };

  /* ═══════ Render: Doc Row (iOS list) ═══════ */
  const renderDocRow = (doc, idx, arr) => {
    const isRenaming = renameTarget && renameTarget.type === 'doc' && renameTarget.item._id === doc._id;
    const color = getFileColor(doc.tipo);
    return (
      <div
        key={doc._id}
        style={{ ...S.listRow, ...(idx === arr.length - 1 ? S.listRowLast : {}) }}
        onClick={() => handlePreview(doc)}
        onContextMenu={(e) => openActionSheet(e, 'doc', doc)}
      >
        <div style={S.fileThumb(color)}>
          <span style={{ fontSize: 11, fontWeight: 700, color }}>{getFileLabel(doc.tipo)}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {isRenaming
            ? (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSubmit(); if (e.key === 'Escape') setRenameTarget(null); }}
                onBlur={handleRenameSubmit}
                onClick={(e) => e.stopPropagation()}
                style={{ fontSize: 17, border: 'none', borderBottom: `2px solid ${IOS.blue}`, outline: 'none', width: '100%', fontFamily: 'inherit', color: IOS.label, background: 'transparent' }}
              />
            )
            : <div style={{ fontSize: 17, color: IOS.label, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.nombre}</div>}
          <div style={{ fontSize: 13, color: IOS.gray, marginTop: 1 }}>{formatDate(doc.fecha)}{doc.tamano ? ` · ${formatSize(doc.tamano)}` : ''}</div>
        </div>
        {doc.starred && <StarFill size={14} filled />}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); openActionSheet(e, 'doc', doc); }}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}
        ><IMore size={18} style={{ color: IOS.gray }} />
        </button>
      </div>
    );
  };

  /* ═══════ Render: Doc Grid Card (iOS) ═══════ */
  const renderDocGrid = (doc) => {
    const color = getFileColor(doc.tipo);
    return (
      <div key={doc._id} style={S.gridItem} onClick={() => handlePreview(doc)} onContextMenu={(e) => openActionSheet(e, 'doc', doc)}>
        <div style={S.fileThumbGrid(color)}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{getFileLabel(doc.tipo)}</span>
          </div>
        </div>
        {doc.starred && <StarFill size={14} filled style={{ position: 'absolute', top: 8, left: 8 }} />}
        <div style={{ padding: '8px 10px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: IOS.label, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.nombre}</div>
          <div style={{ fontSize: 11, color: IOS.gray, marginTop: 2 }}>{formatDate(doc.fecha)}</div>
        </div>
      </div>
    );
  };

  /* ═══════ Render: Folder Grid Card (iOS) ═══════ */
  const renderFolderGrid = (folder) => (
    <div key={folder._id} style={S.gridItem} onClick={() => navigateToFolder(folder._id)} onContextMenu={(e) => openActionSheet(e, 'folder', folder)}>
      <div style={{ ...S.fileThumbGrid(IOS.blue), height: 80 }}>
        <FolderFill size={40} color={folder.color || IOS.blue} />
      </div>
      {folder.starred && <StarFill size={14} filled style={{ position: 'absolute', top: 8, left: 8 }} />}
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: IOS.label, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{folder.name}</div>
      </div>
    </div>
  );

  /* ═══════ Render: iOS Action Sheet ═══════ */
  const renderActionSheet = () => {
    if (!actionSheet) return null;
    const { type, item } = actionSheet;
    const isFolder = type === 'folder';
    const actions = [
      ...(isFolder ? [] : [
        { label: 'Vista Rapida', icon: <IEye size={20} style={{ color: IOS.blue }} />, fn: () => handlePreview(item) },
        { label: 'Descargar', icon: <IDownload size={20} style={{ color: IOS.blue }} />, fn: () => handleDownload(item) },
      ]),
      { label: item.starred ? 'Quitar de Favoritos' : 'Favorito', icon: <StarFill size={20} filled={item.starred} color={IOS.orange} />, fn: () => handleStar(type, item) },
      { label: 'Renombrar', icon: <IEdit size={20} style={{ color: IOS.blue }} />, fn: () => { setRenameTarget({ type, item }); setRenameValue(isFolder ? item.name : item.nombre); } },
      { label: 'Mover', icon: <IMove size={20} style={{ color: IOS.blue }} />, fn: () => startMove(type, item) },
      { label: 'Eliminar', icon: <ITrash size={20} style={{ color: IOS.red }} />, fn: () => handleDelete(type, item), danger: true },
    ];
    return (
      <div style={S.overlay} onClick={() => setActionSheet(null)}>
        <div style={S.sheet} onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: '14px 20px', borderBottom: `0.5px solid ${IOS.separator}`, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: IOS.gray, fontWeight: 600 }}>{isFolder ? item.name : item.nombre}</div>
          </div>
          {actions.map((a, i) => (
            <button type="button" key={i} onClick={() => { a.fn(); setActionSheet(null); }} style={S.sheetAction(a.danger)}>
              {a.icon}<span>{a.label}</span>
            </button>
          ))}
        </div>
        <div style={S.sheetCancel}>
          <button
            type="button"
            onClick={() => setActionSheet(null)}
            style={{ ...S.sheetAction(false), justifyContent: 'center', fontWeight: 600, borderBottom: 'none' }}
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  };

  /* ═══════ Render: Move Sheet (iOS) ═══════ */
  const renderMoveSheet = () => {
    if (!moveTarget) return null;
    return (
      <div style={S.overlay} onClick={() => setMoveTarget(null)}>
        <div style={{ ...S.sheet, maxHeight: '60vh' }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `0.5px solid ${IOS.separator}` }}>
            <button type="button" onClick={() => setMoveTarget(null)} style={{ border: 'none', background: 'transparent', color: IOS.blue, fontSize: 17, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
            <span style={{ fontSize: 17, fontWeight: 600, color: IOS.label }}>Mover</span>
            <button type="button" onClick={handleMoveConfirm} style={{ border: 'none', background: 'transparent', color: IOS.blue, fontSize: 17, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Mover</button>
          </div>
          <div style={{ padding: 8, maxHeight: 300, overflowY: 'auto' }}>
            {moveParent && (
              <button type="button" onClick={() => handleMoveBrowse(null)} style={{ ...S.sheetAction(false), fontSize: 15 }}>← Mis Archivos</button>
            )}
            <div style={{ ...S.listRow, background: !moveParent ? `${IOS.blue}12` : 'transparent' }} onClick={() => setMoveParent(null)}>
              <ICloud size={20} style={{ color: IOS.blue }} /><span style={{ flex: 1, fontSize: 17, color: IOS.label }}>Mis Archivos</span>
            </div>
            {moveFolders.filter((f) => f._id !== moveTarget?.item?._id).map((f) => (
              <div key={f._id} style={{ ...S.listRow, background: moveParent === f._id ? `${IOS.blue}12` : 'transparent' }}>
                <FolderFill size={20} color={f.color || IOS.blue} />
                <span style={{ flex: 1, fontSize: 17, color: IOS.label, cursor: 'pointer' }} onClick={() => setMoveParent(f._id)}>{f.name}</span>
                <button type="button" onClick={() => handleMoveBrowse(f._id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}><IChevron style={{ color: IOS.gray3 }} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* ═══════ Render: Preview (iOS Fullscreen) ═══════ */
  const renderPreview = () => {
    if (!previewDoc || !previewUrl) return null;
    const isImage = previewDoc.tipo === 'Imagen' || (previewDoc.mimetype && previewDoc.mimetype.startsWith('image/'));
    const isPdf = previewDoc.tipo === 'PDF' || (previewDoc.mimetype && previewDoc.mimetype === 'application/pdf');
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', background: '#000' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(30,30,30,0.95)' }}>
          <button
            type="button"
            onClick={() => { setPreviewDoc(null); setPreviewUrl(null); }}
            style={{ border: 'none', background: 'transparent', color: IOS.blue, fontSize: 17, cursor: 'pointer', fontFamily: 'inherit' }}
          >Cerrar
          </button>
          <span style={{ fontSize: 15, color: '#fff', fontWeight: 600, maxWidth: '50%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{previewDoc.nombre}</span>
          <button
            type="button"
            onClick={() => handleDownload(previewDoc)}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}
          ><IDownload size={22} style={{ color: IOS.blue }} />
          </button>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: 16 }}>
          {isImage ? <img src={previewUrl} alt={previewDoc.nombre} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />
            : isPdf ? <iframe src={previewUrl} title={previewDoc.nombre} style={{ width: '100%', maxWidth: 900, height: '100%', borderRadius: 8, border: 'none', background: '#fff' }} />
              : (
                <div style={{ textAlign: 'center', color: '#fff' }}>
                  <DocFill size={64} color={IOS.gray} />
                  <p style={{ fontSize: 17, marginTop: 16 }}>Vista previa no disponible</p>
                  <button
                    type="button"
                    onClick={() => handleDownload(previewDoc)}
                    style={{ marginTop: 12, border: 'none', background: IOS.blue, color: '#fff', borderRadius: 22, padding: '10px 28px', fontSize: 17, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >Descargar
                  </button>
                </div>
              )}
        </div>
      </div>
    );
  };

  /* ═══════ Render: Empty State ═══════ */
  const renderEmpty = () => {
    let icon; let title; let
      sub;
    if (tab === 'starred') {
      icon = <StarFill size={48} filled={false} />;
      title = 'Sin favoritos';
      sub = 'Marca archivos como favoritos para verlos aqui';
    } else if (tab === 'recent') {
      icon = <IClock size={48} style={{ color: IOS.gray3 }} />;
      title = 'Sin recientes';
      sub = 'Los archivos abiertos apareceran aqui';
    } else if (tab === 'search') {
      icon = <ISearch size={48} style={{ color: IOS.gray3 }} />;
      title = 'Sin resultados';
      sub = '';
    } else if (tab === 'category') {
      icon = (categoryFilter?.icon(48));
      title = `Sin ${categoryFilter?.label?.toLowerCase() || 'archivos'}`;
      sub = '';
    } else {
      icon = <FolderFill size={48} color={IOS.gray3} />;
      title = 'Sin contenido';
      sub = 'Sube archivos o crea carpetas';
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: IOS.gray }}>
        {icon}
        <div style={{ fontSize: 20, fontWeight: 600, marginTop: 12, color: IOS.label2 }}>{title}</div>
        {sub && <div style={{ fontSize: 15, marginTop: 4, color: IOS.gray }}>{sub}</div>}
      </div>
    );
  };

  /* ═══════ Content rendering ═══════ */
  const hasContent = folders.length > 0 || filteredDocs.length > 0;
  const showCategories = tab === 'browse' && !currentFolder;
  const pageTitle = tab === 'browse' ? (currentFolder && breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].name : 'Explorar')
    : tab === 'recent' ? 'Recientes' : tab === 'starred' ? 'Favoritos'
      : tab === 'search' ? 'Busqueda' : tab === 'category' ? (categoryFilter?.label || 'Categoria') : 'Archivos';

  /* ═══════════════════ MAIN RENDER ═══════════════════ */
  return (
    <div style={S.page}>
      {renderSearch()}
      <div style={S.largeTitle}>{pageTitle}</div>

      {/* Error / Upload banner */}
      {error && (
        <div style={{ margin: '0 16px 8px', padding: '10px 16px', borderRadius: 10, background: `${IOS.red}14`, color: IOS.red, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {error}
          <button type="button" onClick={() => setError('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2 }}><IClose size={16} style={{ color: IOS.red }} /></button>
        </div>
      )}
      {uploadProgress && (
        <div style={{ margin: '0 16px 8px', padding: '10px 16px', borderRadius: 10, background: `${IOS.blue}14`, color: IOS.blue, fontSize: 15, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 16, height: 16, border: `2px solid ${IOS.blue}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          {uploadProgress}
        </div>
      )}

      {renderBreadcrumb()}

      {/* Toolbar row (only in browse) */}
      {tab === 'browse' && (
        <div style={S.toolRow}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => { setNewFolderMode(true); setNewFolderName(''); }}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: IOS.blue, fontSize: 15, fontWeight: 500, fontFamily: 'inherit' }}
            >
              <IFolderPlus size={20} style={{ color: IOS.blue }} /> Nueva carpeta
            </button>
          </div>
          <button
            type="button"
            onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}
          >
            {view === 'grid' ? <IList size={20} style={{ color: IOS.blue }} /> : <IGrid size={20} style={{ color: IOS.blue }} />}
          </button>
        </div>
      )}

      {renderNewFolder()}

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        {showCategories && renderCategories()}
        {showCategories && renderLocations()}
        {showCategories && renderStorageCard()}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 28, height: 28, border: `3px solid ${IOS.gray5}`, borderTopColor: IOS.blue, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : (!showCategories && !hasContent) ? renderEmpty() : (
          <>
            {/* Folders */}
            {folders.length > 0 && (
              <div>
                <div style={S.sectionHeader}>Carpetas</div>
                {view === 'list' ? (
                  <div style={S.cardMargin}>{folders.map((f, i, a) => renderFolderRow(f, i, a))}</div>
                ) : (
                  <div style={S.gridWrap}>{folders.map(renderFolderGrid)}</div>
                )}
              </div>
            )}
            {/* Documents */}
            {filteredDocs.length > 0 && (
              <div>
                <div style={S.sectionHeader}>Archivos</div>
                {view === 'list' ? (
                  <div style={S.cardMargin}>{filteredDocs.map((d, i, a) => renderDocRow(d, i, a))}</div>
                ) : (
                  <div style={S.gridWrap}>{filteredDocs.map(renderDocGrid)}</div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* iOS Bottom Tab Bar */}
      <div style={S.bottomBar}>
        <button type="button" style={S.bottomTab(tab === 'recent')} onClick={() => { setTab('recent'); setCategoryFilter(null); }}>
          <IClock size={22} />
          <span>Recientes</span>
        </button>
        <button type="button" style={S.bottomTab(tab === 'browse' || tab === 'category')} onClick={() => { setTab('browse'); setCurrentFolder(null); setCategoryFilter(null); }}>
          <FolderFill size={22} color={tab === 'browse' || tab === 'category' ? IOS.blue : IOS.gray} />
          <span>Explorar</span>
        </button>
        <button type="button" style={S.bottomTab(tab === 'starred')} onClick={() => { setTab('starred'); setCategoryFilter(null); }}>
          <StarFill size={22} filled={tab === 'starred'} color={tab === 'starred' ? IOS.blue : IOS.gray} />
          <span>Favoritos</span>
        </button>
      </div>

      {/* FAB Upload Button */}
      <label htmlFor="field-62" style={S.fab}>
        <IPlus size={28} style={{ color: '#fff' }} />
        <input id="field-62" ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleUpload} />
      </label>

      {/* CSS animation for spinner */}
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>

      {/* Overlays */}
      {renderActionSheet()}
      {renderMoveSheet()}
      {renderPreview()}
    </div>
  );
};

export default Documentos;
