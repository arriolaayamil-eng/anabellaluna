import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { toast } from 'react-toastify';
import { confirmToast } from '../utils/confirmToast';
import {
  FaTasks, FaPlus, FaTrash, FaEdit, FaEye, FaTimes, FaSave, FaUser,
  FaExclamationTriangle, FaClock, FaCheckCircle, FaArrowLeft, FaComment,
  FaCalendarAlt, FaList, FaColumns, FaChartBar, FaUsers, FaSearch,
  FaFilter, FaFlag, FaCheck, FaPaperPlane, FaHistory, FaChevronDown,
  FaExclamationCircle, FaBan, FaClipboardList, FaUserPlus, FaAngleRight,
  FaChevronLeft, FaChevronRight,
} from 'react-icons/fa';
import { useStateContext } from '../contexts/ContextProvider';
import { crmService } from '../services/crmService';

// ── constants ────────────────────────────────────────────────────────
const STATUS_MAP = {
  pendiente: { label: 'Pendiente', color: '#F59E0B', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', icon: FaClock },
  en_progreso: { label: 'En Progreso', color: '#3B82F6', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', icon: FaAngleRight },
  en_revision: { label: 'En Revisión', color: '#8B5CF6', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', icon: FaEye },
  completada: { label: 'Completada', color: '#10B981', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', icon: FaCheckCircle },
  cancelada: { label: 'Cancelada', color: '#EF4444', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: FaBan },
};
const PRIORITY_MAP = {
  urgente: { label: 'Urgente', color: '#DC2626', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
  alta: { label: 'Alta', color: '#F97316', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
  media: { label: 'Media', color: '#F59E0B', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  baja: { label: 'Baja', color: '#6B7280', bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300' },
};
const STATUSES = ['pendiente', 'en_progreso', 'en_revision', 'completada', 'cancelada'];
const PRIORITIES = ['urgente', 'alta', 'media', 'baja'];
const VIEWS = [
  { id: 'kanban', icon: FaColumns, label: 'Kanban' },
  { id: 'list', icon: FaList, label: 'Lista' },
  { id: 'calendar', icon: FaCalendarAlt, label: 'Calendario' },
];

function isOverdue(t) {
  return t.dueDate && new Date(t.dueDate) < new Date() && !['completada', 'cancelada', 'Close'].includes(t.status);
}
function fmtDate(d) { if (!d) return ''; const dt = new Date(d); return dt.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }); }
function fmtShort(d) { if (!d) return ''; return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }); }
function fmtDateTime(d) { if (!d) return ''; const dt = new Date(d); return `${dt.toLocaleDateString('es-AR')} ${dt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`; }
function statusInfo(s) { return STATUS_MAP[s] || STATUS_MAP.pendiente; }
function priorityInfo(p) { return PRIORITY_MAP[p] || PRIORITY_MAP.media; }

const emptyForm = () => ({
  title: '', description: '', status: 'pendiente', priority: 'media',
  assigneeId: '', assigneeName: '', teamId: '', teamName: '',
  dueDate: '', startDate: '', labels: [], checklist: [],
  clienteId: '', clienteNombre: '', propiedadId: '', propiedadTitulo: '', operacionId: '',
});

// ── component ────────────────────────────────────────────────────────
const Tareas = ({ embedded = false }) => {
  const { currentMode } = useStateContext();
  const isDark = currentMode === 'Dark';
  const cardBase = `rounded-2xl p-6 border transition-shadow ${isDark ? 'bg-secondary-dark-bg border-gray-700/50' : 'bg-white border-gray-100 shadow-md'}`;

  // data
  const [loading, setLoading] = useState(false);
  const [tareas, setTareas] = useState([]);
  const [stats, setStats] = useState(null);
  const [agentes, setAgentes] = useState([]);
  const [teams, setTeams] = useState([]);
  const [columns, setColumns] = useState([]);
  const [kanbanData, setKanbanData] = useState({});

  // views
  const [view, setView] = useState('kanban');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [newCheckItem, setNewCheckItem] = useState('');

  // detail
  const [activity, setActivity] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [activityLoading, setActivityLoading] = useState(false);

  // filters
  const [searchQ, setSearchQ] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // team creation inline
  const [showNewTeam, setShowNewTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSaving, setNewTeamSaving] = useState(false);

  // kanban drag
  const [draggedTask, setDraggedTask] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  // kanban mobile carousel
  const kanbanRef = useRef(null);
  const [activeColIdx, setActiveColIdx] = useState(0);
  const touchStart = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // calendar
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  // ── LOAD ──────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allTareas, statsData, colsData, kanban, agData, tmData] = await Promise.all([
        crmService.tareas.getAll(),
        crmService.tareas.getStats(),
        crmService.tareas.getKanbanColumns(),
        crmService.tareas.getKanban(),
        crmService.agentes.getAll().catch(() => []),
        crmService.teams.getAll().catch(() => []),
      ]);
      setTareas(Array.isArray(allTareas) ? allTareas : []);
      setStats(statsData || {});
      setColumns(Array.isArray(colsData) ? colsData : []);
      setKanbanData(kanban || {});
      setAgentes(Array.isArray(agData) ? agData : []);
      setTeams(Array.isArray(tmData) ? tmData : []);
    } catch { toast.error('Error al cargar tareas'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── CRUD ──────────────────────────────────────────────────────────
  const openCreate = () => { setEditingId(null); setForm(emptyForm()); setShowForm(true); };
  const openEdit = (t) => {
    setEditingId(t._id);
    setForm({
      title: t.title || '', description: t.description || t.summary || '',
      status: t.status || 'pendiente', priority: t.priority || 'media',
      assigneeId: t.assigneeId || '', assigneeName: t.assigneeName || '',
      teamId: t.teamId || '', teamName: t.teamName || '',
      dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
      startDate: t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : '',
      labels: Array.isArray(t.labels) ? t.labels : [],
      checklist: Array.isArray(t.checklist) ? t.checklist : [],
      clienteId: t.clienteId || '', clienteNombre: t.clienteNombre || '',
      propiedadId: t.propiedadId || '', propiedadTitulo: t.propiedadTitulo || '',
      operacionId: t.operacionId || '',
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Título requerido');
    setSaving(true);
    try {
      const payload = {
        ...form,
        dueDate: form.dueDate || undefined,
        startDate: form.startDate || undefined,
        kanbanColumn: form.status,
      };
      if (editingId) {
        await crmService.tareas.update(editingId, payload);
        toast.success('Tarea actualizada');
      } else {
        await crmService.tareas.create(payload);
        toast.success('Tarea creada');
      }
      setShowForm(false);
      loadData();
    } catch { toast.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!(await confirmToast('¿Eliminar esta tarea?'))) return;
    try {
      await crmService.tareas.delete(id);
      toast.success('Tarea eliminada');
      if (selectedTask && selectedTask._id === id) setSelectedTask(null);
      loadData();
    } catch { toast.error('Error al eliminar'); }
  };

  // ── DETAIL ────────────────────────────────────────────────────────
  const openDetail = async (t) => {
    setSelectedTask(t);
    setActivityLoading(true);
    try {
      const items = await crmService.tareas.getActivity(t._id);
      setActivity(Array.isArray(items) ? items : []);
    } catch { setActivity([]); }
    finally { setActivityLoading(false); }
  };

  const addComment = async () => {
    if (!commentText.trim() || !selectedTask) return;
    try {
      await crmService.tareas.addComment(selectedTask._id, commentText);
      setCommentText('');
      const items = await crmService.tareas.getActivity(selectedTask._id);
      setActivity(Array.isArray(items) ? items : []);
      loadData();
    } catch { toast.error('Error al comentar'); }
  };

  const toggleCheck = async (itemId) => {
    if (!selectedTask) return;
    try {
      const updated = await crmService.tareas.toggleChecklist(selectedTask._id, itemId);
      setSelectedTask(updated);
      loadData();
    } catch { toast.error('Error'); }
  };

  const quickStatus = async (taskId, newStatus) => {
    try {
      await crmService.tareas.update(taskId, { status: newStatus, kanbanColumn: newStatus });
      if (selectedTask && selectedTask._id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
        const items = await crmService.tareas.getActivity(taskId);
        setActivity(Array.isArray(items) ? items : []);
      }
      loadData();
    } catch { toast.error('Error al cambiar estado'); }
  };

  // ── KANBAN D&D ────────────────────────────────────────────────────
  const handleDragStart = (e, tarea, col) => { setDraggedTask({ tarea, col }); e.dataTransfer.effectAllowed = 'move'; e.target.style.opacity = '0.4'; };
  const handleDrop = async (e, destCol) => {
    e.preventDefault(); setDropTarget(null);
    if (!draggedTask || draggedTask.col === destCol) { setDraggedTask(null); return; }
    const t = draggedTask.tarea;
    const tid = t._id || t.id;
    setKanbanData((prev) => {
      const from = (prev[draggedTask.col] || []).filter(x => (x._id || x.id) !== tid);
      const to = [...(prev[destCol] || []), { ...t, status: destCol, kanbanColumn: destCol }];
      return { ...prev, [draggedTask.col]: from, [destCol]: to };
    });
    try { await crmService.tareas.moveTask(tid, destCol, 0); loadData(); }
    catch { toast.error('Error al mover'); loadData(); }
    setDraggedTask(null);
  };

  // ── CREATE TEAM INLINE ───────────────────────────────────────────
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    setNewTeamSaving(true);
    try {
      const created = await crmService.teams.create({ nombre: newTeamName.trim() });
      setTeams(prev => [...prev, created]);
      setForm(f => ({ ...f, teamId: created._id, teamName: created.nombre }));
      setNewTeamName('');
      setShowNewTeam(false);
      toast.success('Equipo creado');
    } catch (err) { toast.error(err?.response?.data?.error || 'Error al crear equipo'); }
    finally { setNewTeamSaving(false); }
  };

  // ── KANBAN COLUMNS (memoized) ───────────────────────────────────
  const kanbanCols = useMemo(() => columns.length ? columns : STATUSES.map(s => ({ id: s, nombre: statusInfo(s).label, color: statusInfo(s).color })), [columns]);

  // ── FILTERED DATA ─────────────────────────────────────────────────
  const filtered = tareas.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterAssignee && t.assigneeId !== filterAssignee) return false;
    if (filterTeam && t.teamId !== filterTeam) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      if (!(t.title || '').toLowerCase().includes(q) && !(t.description || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // ── CALENDAR helpers ──────────────────────────────────────────────
  const calDays = () => {
    const first = new Date(calYear, calMonth, 1);
    const last = new Date(calYear, calMonth + 1, 0);
    const startDay = first.getDay();
    const days = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(d);
    return days;
  };
  const calTasksForDay = (day) => {
    if (!day) return [];
    const date = new Date(calYear, calMonth, day);
    return tareas.filter(t => {
      if (!t.dueDate) return false;
      const dd = new Date(t.dueDate);
      return dd.getDate() === date.getDate() && dd.getMonth() === date.getMonth() && dd.getFullYear() === date.getFullYear();
    });
  };

  // ── RENDER ────────────────────────────────────────────────────────
  const StatusBadge = ({ status }) => { const s = statusInfo(status); const Icon = s.icon; return (<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}><Icon className="text-[10px]" /> {s.label}</span>); };
  const PriorityBadge = ({ priority }) => { const p = priorityInfo(priority); return (<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${p.bg} ${p.text}`}><FaFlag className="text-[10px]" /> {p.label}</span>); };

  // ── TASK DETAIL PANEL ─────────────────────────────────────────────
  if (selectedTask) {
    const t = selectedTask;
    const checkTotal = (t.checklist || []).length;
    const checkDone = (t.checklist || []).filter(c => c.done).length;
    return (
      <div className={embedded ? '' : `min-h-screen px-6 lg:px-8 pt-4 pb-6 ${isDark ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
        <button onClick={() => setSelectedTask(null)} className={`flex items-center gap-2 mb-4 px-4 py-2 rounded-lg text-sm ${isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}><FaArrowLeft /> Volver</button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <div className={cardBase}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.title}</h1>
                  {t.description && <p className={`mt-2 text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t.description}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { openEdit(t); setSelectedTask(null); }} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"><FaEdit /></button>
                  <button onClick={() => handleDelete(t._id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><FaTrash /></button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <StatusBadge status={t.status} />
                <PriorityBadge priority={t.priority} />
                {isOverdue(t) && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"><FaExclamationTriangle /> Vencida</span>}
                {t.dueDate && <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Vence: {fmtDate(t.dueDate)}</span>}
              </div>
              {/* Quick status */}
              <div className="mt-4 flex flex-wrap gap-2">
                {STATUSES.filter(s => s !== t.status).map(s => (
                  <button key={s} onClick={() => quickStatus(t._id, s)} className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    Mover a {statusInfo(s).label}
                  </button>
                ))}
              </div>
            </div>

            {/* Checklist */}
            {checkTotal > 0 && (
              <div className={cardBase}>
                <h3 className={`font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}><FaClipboardList className="text-indigo-500" /> Checklist ({checkDone}/{checkTotal})</h3>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                  <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${checkTotal ? (checkDone / checkTotal) * 100 : 0}%` }} />
                </div>
                <div className="space-y-2">
                  {(t.checklist || []).map(item => (
                    <label key={item._id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
                      <input type="checkbox" checked={item.done} onChange={() => toggleCheck(item._id)} className="w-4 h-4 rounded accent-indigo-500" />
                      <span className={`text-sm ${item.done ? 'line-through opacity-50' : ''} ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{item.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Activity / Comments */}
            <div className={cardBase}>
              <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}><FaHistory className="text-indigo-500" /> Actividad</h3>
              <div className="flex gap-2 mb-4">
                <input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()}
                  placeholder="Escribe un comentario..."
                  className={`flex-1 px-3 py-2 border rounded-lg text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'border-gray-200'}`} />
                <button onClick={addComment} disabled={!commentText.trim()} className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 text-sm"><FaPaperPlane /></button>
              </div>
              {activityLoading ? <div className="text-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mx-auto" /></div> : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activity.map(a => (
                    <div key={a._id} className={`flex gap-3 p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                        {a.action === 'comment' ? <FaComment className="text-indigo-500 text-xs" /> : <FaHistory className="text-indigo-500 text-xs" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{a.userName || 'Sistema'}</span>
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{fmtDateTime(a.createdAt)}</span>
                        </div>
                        <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {a.action === 'comment' ? a.details : a.action === 'status_changed' ? `Estado: ${statusInfo(a.previousValue).label} → ${statusInfo(a.newValue).label}` : a.action === 'created' ? 'Tarea creada' : a.action === 'assigned' ? a.details : a.action === 'delegated' ? a.details : a.action === 'priority_changed' ? `Prioridad: ${a.previousValue} → ${a.newValue}` : a.action === 'checklist_toggled' ? a.details : a.details || a.action}
                        </p>
                      </div>
                    </div>
                  ))}
                  {activity.length === 0 && <p className={`text-sm text-center py-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Sin actividad aún</p>}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className={cardBase}>
              <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Detalles</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Responsable</span><span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{t.assigneeName || 'Sin asignar'}</span></div>
                <div className="flex justify-between"><span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Creador</span><span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{t.creatorName || '-'}</span></div>
                {t.teamName && <div className="flex justify-between"><span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Equipo</span><span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{t.teamName}</span></div>}
                {t.dueDate && <div className="flex justify-between"><span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Vencimiento</span><span className={`font-medium ${isOverdue(t) ? 'text-red-500' : isDark ? 'text-gray-200' : 'text-gray-800'}`}>{fmtDate(t.dueDate)}</span></div>}
                {t.startDate && <div className="flex justify-between"><span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Inicio</span><span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{fmtDate(t.startDate)}</span></div>}
                <div className="flex justify-between"><span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Creada</span><span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{fmtDate(t.createdAt)}</span></div>
                {t.clienteNombre && <div className="flex justify-between"><span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Cliente</span><span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{t.clienteNombre}</span></div>}
                {t.propiedadTitulo && <div className="flex justify-between"><span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Propiedad</span><span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{t.propiedadTitulo}</span></div>}
              </div>
            </div>
            {(t.labels && t.labels.length > 0) && (
              <div className={cardBase}>
                <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Etiquetas</h3>
                <div className="flex flex-wrap gap-2">{t.labels.map((l, i) => <span key={i} className="px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs">{l}</span>)}</div>
              </div>
            )}
            {(t.delegations && t.delegations.length > 0) && (
              <div className={cardBase}>
                <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Delegaciones</h3>
                <div className="space-y-2">{t.delegations.map((d, i) => (
                  <div key={i} className={`p-2 rounded-lg text-xs ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <span className="font-medium">{d.fromUserName || d.fromUserId}</span> → <span className="font-medium">{d.toUserName || d.toUserId}</span>
                    {d.reason && <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{d.reason}</p>}
                    <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>{fmtDateTime(d.delegatedAt)}</p>
                  </div>
                ))}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN VIEW ─────────────────────────────────────────────────────
  return (
    <div className={embedded ? '' : `min-h-screen px-6 lg:px-8 pt-4 pb-6 ${isDark ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        {!embedded && (
          <div>
            <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}><FaTasks className="text-indigo-500" /> Gestión de Tareas</h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Asignar → Ejecutar → Monitorear → Cerrar → Medir</p>
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {VIEWS.map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all border ${view === v.id
                ? isDark ? 'bg-gray-700 border-gray-600 text-white shadow-sm' : 'bg-gray-100 border-gray-300 text-gray-800 shadow-sm'
                : isDark ? 'border-gray-700/50 text-gray-500 hover:text-gray-300 hover:border-gray-600' : 'border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300'}`}>
              <v.icon /> {v.label}
            </button>
          ))}
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-md text-sm font-medium"><FaPlus /> Nueva Tarea</button>
        </div>
      </div>

      {/* Search + Filters bar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Buscar tareas..." className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'border-gray-200'}`} />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-700 dark:text-indigo-400' : isDark ? 'border-gray-600 text-gray-400' : 'border-gray-200 text-gray-500'}`}><FaFilter /> Filtros</button>
          {(filterStatus || filterPriority || filterAssignee || filterTeam) && (
            <button onClick={() => { setFilterStatus(''); setFilterPriority(''); setFilterAssignee(''); setFilterTeam(''); }} className="text-xs text-red-500 hover:underline">Limpiar filtros</button>
          )}
      </div>
      {showFilters && (
        <div className={`${cardBase} mb-5 grid grid-cols-2 md:grid-cols-4 gap-4`}>
          <div>
            <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Estado</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'border-gray-200'}`}>
              <option value="">Todos</option>
              {STATUSES.map(s => <option key={s} value={s}>{statusInfo(s).label}</option>)}
            </select>
          </div>
          <div>
            <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Prioridad</label>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'border-gray-200'}`}>
              <option value="">Todas</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{priorityInfo(p).label}</option>)}
            </select>
          </div>
          <div>
            <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Responsable</label>
            <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'border-gray-200'}`}>
              <option value="">Todos</option>
              {agentes.map(a => <option key={a._id} value={a._id}>{a.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Equipo</label>
            <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)} className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'border-gray-200'}`}>
              <option value="">Todos</option>
              {teams.map(t => <option key={t._id} value={t._id}>{t.nombre}</option>)}
            </select>
          </div>
        </div>
      )}

      {loading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" /></div>}

      {/* KANBAN VIEW */}
      {!loading && view === 'kanban' && (() => {
        const renderCol = (col) => {
          const colTasks = (kanbanData[col.id] || []).filter(t => {
            if (filterAssignee && t.assigneeId !== filterAssignee) return false;
            if (filterTeam && t.teamId !== filterTeam) return false;
            if (searchQ && !(t.title || '').toLowerCase().includes(searchQ.toLowerCase())) return false;
            return true;
          });
          return (
            <div key={col.id}
              onDragOver={e => { e.preventDefault(); setDropTarget(col.id); }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={e => handleDrop(e, col.id)}
              className={`rounded-2xl border transition-all min-h-[300px] ${dropTarget === col.id ? 'border-2 border-dashed border-indigo-400 bg-indigo-50/30 dark:bg-indigo-900/10' : isDark ? 'border-gray-700/50 bg-secondary-dark-bg' : 'border-gray-100 bg-white shadow-md'}`}
              style={isMobile ? { minWidth: '85vw', maxWidth: '85vw', scrollSnapAlign: 'start' } : {}}
            >
              <div className="p-3 border-b dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className={`font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{col.nombre}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{colTasks.length}</span>
              </div>
              <div className="p-2 space-y-2 overflow-y-auto" style={{ maxHeight: isMobile ? 'calc(100vh - 280px)' : 'calc(100vh - 340px)' }}>
                {colTasks.map(t => {
                  const tid = t._id || t.id;
                  return (
                    <div key={tid} draggable={!isMobile} onDragStart={e => handleDragStart(e, t, col.id)} onDragEnd={e => { e.target.style.opacity = '1'; setDraggedTask(null); }}
                      className={`group p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${isDark ? 'bg-gray-800/60 border-gray-700 hover:border-indigo-500/50' : 'bg-white border-gray-200 hover:border-indigo-300'} ${!isMobile ? 'cursor-grab active:cursor-grabbing' : ''}`}
                      onClick={() => openDetail(t)}
                    >
                      <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{t.title}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <PriorityBadge priority={t.priority} />
                        {t.assigneeName && <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.assigneeName}</span>}
                        {t.dueDate && <span className={`text-xs ${isOverdue(t) ? 'text-red-500 font-medium' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>{fmtShort(t.dueDate)}</span>}
                      </div>
                      {(t.checklist || []).length > 0 && (
                        <div className="flex items-center gap-1 mt-1.5"><FaCheck className="text-[10px] text-gray-400" /><span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{(t.checklist || []).filter(c => c.done).length}/{(t.checklist || []).length}</span></div>
                      )}
                      {isMobile && (
                        <div className="flex gap-1 mt-2 flex-wrap" onClick={e => e.stopPropagation()}>
                          {kanbanCols.filter(c => c.id !== col.id).map(dest => (
                            <button key={dest.id}
                              onClick={(ev) => { ev.stopPropagation(); quickStatus(tid, dest.id); }}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${isDark ? 'border-gray-600 text-gray-400 hover:bg-gray-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                              style={{ borderColor: dest.color + '60' }}
                            >→ {dest.nombre}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {colTasks.length === 0 && <div className={`flex items-center justify-center h-20 rounded-xl border-2 border-dashed ${isDark ? 'border-gray-700 text-gray-600' : 'border-gray-200 text-gray-400'}`}><p className="text-xs">{isMobile ? 'Sin tareas' : 'Arrastra aquí'}</p></div>}
              </div>
            </div>
          );
        };

        // Mobile: horizontal scroll-snap carousel (all columns in a scrollable flex row)
        if (isMobile) {
          return (
            <div className="overflow-hidden">
              {/* Column tab indicators */}
              <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                {kanbanCols.map((col, idx) => (
                  <button key={col.id}
                    onClick={() => {
                      setActiveColIdx(idx);
                      if (kanbanRef.current) {
                        const colW = kanbanRef.current.firstChild?.offsetWidth || 0;
                        kanbanRef.current.scrollTo({ left: idx * (colW + 12), behavior: 'smooth' });
                      }
                    }}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all flex-shrink-0 ${activeColIdx === idx ? 'text-white shadow-sm' : isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'}`}
                    style={activeColIdx === idx ? { backgroundColor: col.color } : {}}
                  >{col.nombre} ({(kanbanData[col.id] || []).length})</button>
                ))}
              </div>
              {/* Scroll-snap carousel */}
              <div ref={kanbanRef}
                className="flex gap-3 overflow-x-auto pb-3"
                style={{
                  scrollSnapType: 'x mandatory',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
                onScroll={(e) => {
                  const el = e.target;
                  const colW = el.firstChild?.offsetWidth || 1;
                  const idx = Math.round(el.scrollLeft / (colW + 12));
                  if (idx !== activeColIdx && idx >= 0 && idx < kanbanCols.length) setActiveColIdx(idx);
                }}
              >
                {kanbanCols.map(col => renderCol(col))}
              </div>
              {/* Nav arrows */}
              <div className="flex justify-between mt-2">
                <button disabled={activeColIdx === 0}
                  onClick={() => { const ni = activeColIdx - 1; setActiveColIdx(ni); if (kanbanRef.current) { const colW = kanbanRef.current.firstChild?.offsetWidth || 0; kanbanRef.current.scrollTo({ left: ni * (colW + 12), behavior: 'smooth' }); } }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-30 ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}><FaChevronLeft /> Anterior</button>
                <span className={`text-xs self-center font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{activeColIdx + 1} / {kanbanCols.length}</span>
                <button disabled={activeColIdx >= kanbanCols.length - 1}
                  onClick={() => { const ni = activeColIdx + 1; setActiveColIdx(ni); if (kanbanRef.current) { const colW = kanbanRef.current.firstChild?.offsetWidth || 0; kanbanRef.current.scrollTo({ left: ni * (colW + 12), behavior: 'smooth' }); } }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-30 ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Siguiente <FaChevronRight /></button>
              </div>
              <style>{`div[style*="scroll-snap-type"]::-webkit-scrollbar { display: none; }`}</style>
            </div>
          );
        }

        // Desktop: normal grid
        return (
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${kanbanCols.length}, minmax(220px, 1fr))` }}>
            {kanbanCols.map(col => renderCol(col))}
          </div>
        );
      })()}

      {/* LIST VIEW */}
      {!loading && view === 'list' && (
        <div className={`${cardBase} overflow-x-auto`}>
          <table className="w-full text-sm">
            <thead>
              <tr className={isDark ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
                {['Título', 'Estado', 'Prioridad', 'Responsable', 'Equipo', 'Vencimiento', 'Acciones'].map(h => (
                  <th key={h} className={`text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t._id} className={`border-b cursor-pointer transition-colors ${isDark ? 'border-gray-700/50 hover:bg-gray-800/50' : 'border-gray-100 hover:bg-gray-50'}`} onClick={() => openDetail(t)}>
                  <td className={`py-3 px-3 font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {t.title}
                    {isOverdue(t) && <FaExclamationTriangle className="inline ml-2 text-red-500 text-xs" />}
                  </td>
                  <td className="py-3 px-3"><StatusBadge status={t.status} /></td>
                  <td className="py-3 px-3"><PriorityBadge priority={t.priority} /></td>
                  <td className={`py-3 px-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t.assigneeName || '-'}</td>
                  <td className={`py-3 px-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t.teamName || '-'}</td>
                  <td className={`py-3 px-3 ${isOverdue(t) ? 'text-red-500 font-medium' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>{fmtShort(t.dueDate) || '-'}</td>
                  <td className="py-3 px-3">
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEdit(t)} className="p-1.5 rounded text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"><FaEdit className="text-xs" /></button>
                      <button onClick={() => handleDelete(t._id)} className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><FaTrash className="text-xs" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No hay tareas que coincidan con los filtros</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CALENDAR VIEW */}
      {!loading && view === 'calendar' && (
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }} className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>←</button>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{new Date(calYear, calMonth).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</h3>
            <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }} className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>→</button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
              <div key={d} className={`text-center text-xs font-semibold py-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{d}</div>
            ))}
            {calDays().map((day, i) => {
              const dayTasks = calTasksForDay(day);
              const today = new Date();
              const isToday = day && today.getDate() === day && today.getMonth() === calMonth && today.getFullYear() === calYear;
              return (
                <div key={i} className={`min-h-[80px] p-1 border rounded-lg ${!day ? 'border-transparent' : isDark ? 'border-gray-700/50' : 'border-gray-100'} ${isToday ? 'ring-2 ring-indigo-500 ring-inset' : ''}`}>
                  {day && (
                    <>
                      <span className={`text-xs font-medium ${isToday ? 'text-indigo-500' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>{day}</span>
                      <div className="space-y-0.5 mt-0.5">
                        {dayTasks.slice(0, 3).map(t => (
                          <div key={t._id} onClick={() => openDetail(t)} className={`text-[10px] px-1 py-0.5 rounded cursor-pointer truncate ${isOverdue(t) ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'}`}>{t.title}</div>
                        ))}
                        {dayTasks.length > 3 && <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>+{dayTasks.length - 3} más</span>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 px-4 overflow-y-auto">
          <div className={`w-full max-w-2xl rounded-2xl shadow-2xl ${isDark ? 'bg-secondary-dark-bg' : 'bg-white'} mb-10`}>
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{editingId ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
              <button onClick={() => setShowForm(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><FaTimes /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Título *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required className={`w-full px-3 py-2 border rounded-lg text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'border-gray-200'}`} placeholder="¿Qué hay que hacer?" />
              </div>
              <div>
                <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Descripción</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className={`w-full px-3 py-2 border rounded-lg text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'border-gray-200'}`} placeholder="Detalle de la tarea..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Estado</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={`w-full px-3 py-2 border rounded-lg text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'border-gray-200'}`}>
                    {STATUSES.map(s => <option key={s} value={s}>{statusInfo(s).label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Prioridad</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className={`w-full px-3 py-2 border rounded-lg text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'border-gray-200'}`}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{priorityInfo(p).label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Responsable</label>
                  <select value={form.assigneeId} onChange={e => { const ag = agentes.find(a => a._id === e.target.value); setForm(f => ({ ...f, assigneeId: e.target.value, assigneeName: ag?.nombre || '' })); }} className={`w-full px-3 py-2 border rounded-lg text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'border-gray-200'}`}>
                    <option value="">Sin asignar</option>
                    {agentes.map(a => <option key={a._id} value={a._id}>{a.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`text-xs font-medium mb-1 flex items-center justify-between ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span>Equipo</span>
                    <button type="button" onClick={() => setShowNewTeam(!showNewTeam)} className="text-indigo-500 hover:text-indigo-600 flex items-center gap-1 text-[10px] font-semibold"><FaPlus /> Crear grupo</button>
                  </label>
                  {showNewTeam && (
                    <div className="flex gap-2 mb-2">
                      <input value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="Nombre del equipo..." onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateTeam(); } }}
                        className={`flex-1 px-3 py-1.5 border rounded-lg text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'border-gray-200'}`} />
                      <button type="button" onClick={handleCreateTeam} disabled={newTeamSaving || !newTeamName.trim()}
                        className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-medium hover:bg-indigo-600 disabled:opacity-50">{newTeamSaving ? '...' : 'Crear'}</button>
                    </div>
                  )}
                  <select value={form.teamId} onChange={e => { const tm = teams.find(t => t._id === e.target.value); setForm(f => ({ ...f, teamId: e.target.value, teamName: tm?.nombre || '' })); }} className={`w-full px-3 py-2 border rounded-lg text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'border-gray-200'}`}>
                    <option value="">Sin equipo</option>
                    {teams.map(t => <option key={t._id} value={t._id}>{t.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Fecha inicio</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={`w-full px-3 py-2 border rounded-lg text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'border-gray-200'}`} />
                </div>
                <div>
                  <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Fecha límite</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className={`w-full px-3 py-2 border rounded-lg text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'border-gray-200'}`} />
                </div>
              </div>
              {/* Checklist */}
              <div>
                <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Checklist</label>
                <div className="space-y-1 mb-2">
                  {(form.checklist || []).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className={`flex-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{item.text}</span>
                      <button type="button" onClick={() => setForm(f => ({ ...f, checklist: f.checklist.filter((_, i) => i !== idx) }))} className="text-red-400 hover:text-red-600 text-xs"><FaTimes /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newCheckItem.trim()) { setForm(f => ({ ...f, checklist: [...f.checklist, { text: newCheckItem.trim(), done: false }] })); setNewCheckItem(''); } } }} placeholder="Agregar ítem..." className={`flex-1 px-3 py-2 border rounded-lg text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'border-gray-200'}`} />
                  <button type="button" onClick={() => { if (newCheckItem.trim()) { setForm(f => ({ ...f, checklist: [...f.checklist, { text: newCheckItem.trim(), done: false }] })); setNewCheckItem(''); } }} className="px-3 py-2 bg-indigo-500 text-white rounded-lg text-sm"><FaPlus /></button>
                </div>
              </div>
              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className={`px-4 py-2 rounded-lg border text-sm ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Cancelar</button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 text-sm font-medium"><FaSave /> {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear Tarea'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export { Tareas };
export default Tareas;
