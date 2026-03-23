import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FaTasks, FaPlus, FaTrash, FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { confirmToast } from '../utils/confirmToast';
import { useStateContext } from '../contexts/ContextProvider';
import { crmService } from '../services/crmService';

const COLUMNAS_DEFAULT = [
  { id: 'pendiente', nombre: 'Pendiente', color: '#F59E0B' },
  { id: 'enProgreso', nombre: 'En Progreso', color: '#3B82F6' },
  { id: 'completado', nombre: 'Completado', color: '#10B981' },
];

const Tareas = () => {
  const { currentMode } = useStateContext();
  const isDark = currentMode === 'Dark';
  const cardBase = `rounded-2xl p-6 border transition-shadow ${isDark ? 'bg-secondary-dark-bg border-gray-700/50 hover:border-indigo-500/30' : 'bg-white border-gray-100 shadow-md hover:shadow-lg'}`;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [columnas, setColumnas] = useState(COLUMNAS_DEFAULT);
  const [tareas, setTareas] = useState({});
  const [draggedTask, setDraggedTask] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [nuevaTarea, setNuevaTarea] = useState({ titulo: '', prioridad: 'Media', fecha: '', columna: 'pendiente' });

  const getPriorityIcon = (p) => {
    if (p === 'Alta') return <FaExclamationTriangle className="text-red-500 text-xs" />;
    if (p === 'Media') return <FaClock className="text-amber-500 text-xs" />;
    return <FaCheckCircle className="text-green-500 text-xs" />;
  };

  const getPriorityBadge = (p) => {
    if (p === 'Alta') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    if (p === 'Media') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [colsData, tasksData] = await Promise.all([
        crmService.tareas.getKanbanColumns(),
        crmService.tareas.getKanban(),
      ]);
      setColumnas(Array.isArray(colsData) && colsData.length ? colsData : COLUMNAS_DEFAULT);
      setTareas(tasksData || {});
    } catch (e) {
      setError('No se pudieron cargar las tareas');
      setColumnas(COLUMNAS_DEFAULT);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const agregarTarea = async (e) => {
    e.preventDefault();
    if (!nuevaTarea.titulo.trim()) return;
    setSaving(true);
    try {
      const created = await crmService.tareas.create({
        title: nuevaTarea.titulo,
        priority: nuevaTarea.prioridad,
        dueDate: nuevaTarea.fecha ? new Date(nuevaTarea.fecha).toISOString() : null,
        kanbanColumn: nuevaTarea.columna,
        position: (tareas[nuevaTarea.columna]?.length || 0),
      });
      setTareas((prev) => ({ ...prev, [nuevaTarea.columna]: [...(prev[nuevaTarea.columna] || []), created] }));
      setNuevaTarea({ titulo: '', prioridad: 'Media', fecha: '', columna: columnas[0]?.id || 'pendiente' });
      setShowForm(false);
      crmService.rewards.checkMilestones('task').catch(() => {});
    } catch (err) {
      toast.error('Error al crear tarea');
    } finally {
      setSaving(false);
    }
  };

  const eliminarTarea = async (columnaId, tareaId) => {
    if (!(await confirmToast('¿Eliminar esta tarea?'))) return;
    setSaving(true);
    try {
      await crmService.tareas.delete(tareaId);
      setTareas((prev) => ({ ...prev, [columnaId]: prev[columnaId].filter((t) => (t._id || t.id) !== tareaId) }));
    } catch (err) {
      toast.error('Error al eliminar tarea');
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (e, tarea, columnaId) => {
    setDraggedTask({ tarea, columnaOrigen: columnaId });
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };

  const handleDrop = async (e, columnaDestino) => {
    e.preventDefault();
    setDropTarget(null);
    if (!draggedTask || draggedTask.columnaOrigen === columnaDestino) { setDraggedTask(null); return; }
    const { tarea, columnaOrigen } = draggedTask;
    const tareaId = tarea._id || tarea.id;
    setSaving(true);
    setTareas((prev) => ({
      ...prev,
      [columnaOrigen]: (prev[columnaOrigen] || []).filter((t) => (t._id || t.id) !== tareaId),
      [columnaDestino]: [...(prev[columnaDestino] || []), { ...tarea, kanbanColumn: columnaDestino }],
    }));
    try {
      await crmService.tareas.moveTask(tareaId, columnaDestino, (tareas[columnaDestino]?.length || 0));
      if (columnaDestino === 'completado') crmService.rewards.checkMilestones('task').catch(() => {});
    } catch (err) {
      toast.error('Error al mover tarea');
      loadData();
    } finally {
      setSaving(false);
      setDraggedTask(null);
    }
  };

  const totalTareas = Object.values(tareas).flat().length;
  const completadas = (tareas['completado'] || []).length;
  const pendientes = (tareas['pendiente'] || []).length;

  return (
    <div className={`min-h-screen px-6 lg:px-8 pt-4 pb-6 ${isDark ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <FaTasks className="text-indigo-500" /> Gestión de Tareas
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Productividad y seguimiento</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-md shadow-indigo-500/30"
        >
          <FaPlus /> Nueva Tarea
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Tareas', value: totalTareas, color: '#6366f1', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'Pendientes', value: pendientes, color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Completadas', value: completadas, color: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        ].map((m) => (
          <div
            key={m.label}
            className={`rounded-2xl p-5 border shadow-sm ${isDark ? 'bg-secondary-dark-bg border-gray-700/50' : 'bg-white border-gray-100'}`}
            style={{ borderLeft: `4px solid ${m.color}` }}
          >
            <div className={`w-9 h-9 rounded-xl ${m.bg} flex items-center justify-center mb-3`}>
              <FaTasks style={{ color: m.color }} />
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{m.value}</p>
            <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Form nueva tarea */}
      {showForm && (
        <div className={`${cardBase} mb-6`}>
          <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <FaPlus className="text-indigo-500" /> Nueva Tarea
          </h3>
          <form onSubmit={agregarTarea} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Título de la tarea *"
                value={nuevaTarea.titulo}
                onChange={(e) => setNuevaTarea((p) => ({ ...p, titulo: e.target.value }))}
                required
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm"
              />
            </div>
            <select
              value={nuevaTarea.prioridad}
              onChange={(e) => setNuevaTarea((p) => ({ ...p, prioridad: e.target.value }))}
              className="px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm"
            >
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>
            <select
              value={nuevaTarea.columna}
              onChange={(e) => setNuevaTarea((p) => ({ ...p, columna: e.target.value }))}
              className="px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm"
            >
              {columnas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <div className="md:col-span-4 flex gap-3">
              <input
                type="date"
                value={nuevaTarea.fecha}
                onChange={(e) => setNuevaTarea((p) => ({ ...p, fecha: e.target.value }))}
                className="px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm"
              />
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all text-sm disabled:opacity-50"
              >
                {saving ? 'Guardando...' : <><FaPlus /> Agregar</>}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className={`px-4 py-2 rounded-lg border text-sm ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
        </div>
      ) : (
        /* Kanban board */
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columnas.length}, minmax(0, 1fr))` }}>
          {columnas.map((col) => {
            const colTareas = tareas[col.id] || [];
            return (
              <div
                key={col.id}
                onDragOver={(e) => { e.preventDefault(); setDropTarget(col.id); }}
                onDragLeave={() => setDropTarget(null)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`rounded-2xl border transition-all ${
                  dropTarget === col.id
                    ? 'border-2 border-dashed border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10'
                    : isDark ? 'border-gray-700/50 bg-secondary-dark-bg' : 'border-gray-100 bg-white shadow-md'
                }`}
              >
                {/* Column header */}
                <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
                    <h3 className={`font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{col.nombre}</h3>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    {colTareas.length}
                  </span>
                </div>

                {/* Tasks */}
                <div className="p-3 space-y-3 min-h-[200px]">
                  {colTareas.map((t) => {
                    const tid = t._id || t.id;
                    return (
                      <div
                        key={tid}
                        draggable
                        onDragStart={(e) => handleDragStart(e, t, col.id)}
                        onDragEnd={(e) => { e.target.style.opacity = '1'; setDraggedTask(null); }}
                        className={`group p-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
                          isDark ? 'bg-gray-800/60 border-gray-700 hover:border-indigo-500/50' : 'bg-white border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium flex-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{t.title || 'Sin título'}</p>
                          <button
                            type="button"
                            onClick={() => eliminarTarea(col.id, tid)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(t.priority || t.Priority)}`}>
                            {getPriorityIcon(t.priority || t.Priority)}
                            {t.priority || t.Priority || 'Media'}
                          </span>
                          {t.dueDate && (
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {new Date(t.dueDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {colTareas.length === 0 && (
                    <div className={`flex items-center justify-center h-24 rounded-xl border-2 border-dashed ${isDark ? 'border-gray-700 text-gray-600' : 'border-gray-200 text-gray-400'}`}>
                      <p className="text-xs">Arrastra aquí</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {saving && (
        <div className="fixed bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          Guardando...
        </div>
      )}
    </div>
  );
};

export default Tareas;
