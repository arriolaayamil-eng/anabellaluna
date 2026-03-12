import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaArrowRight, FaFileAlt, FaHome, FaMagic, FaPlus, FaSave, FaSearch, FaTrash, FaUser } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useStateContext } from '../contexts/ContextProvider';
import { authService } from '../services/authService';
import { templateService } from '../services/templateService';

const EMPTY_FORM = {
  name: '',
  description: '',
  category: 'General',
  status: 'active',
  tags: '',
  content: 'CONTRATO ENTRE {{cliente.nombre}} y la propiedad {{propiedad.title}} ubicada en {{propiedad.address}}.\n\nFecha: {{contrato.fechaLarga}}.\nAgente responsable: {{agente.nombre}}.\n\nCondiciones:\n1. \n2. \n3. ',
};

const CATEGORIES = ['General', 'Alquiler', 'Compraventa', 'Reserva', 'Administrativo'];

const Plantillas = () => {
  const { currentMode } = useStateContext();
  const dark = currentMode === 'Dark';
  const currentUser = authService.getCurrentUser() || {};
  const isAdmin = currentUser.role === 'admin';
  const textareaRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [creatingNew, setCreatingNew] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [templateQuery, setTemplateQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [placeholders, setPlaceholders] = useState([]);
  const [clientQuery, setClientQuery] = useState('');
  const [propertyQuery, setPropertyQuery] = useState('');
  const [clientResults, setClientResults] = useState([]);
  const [propertyResults, setPropertyResults] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [propertyResultsScopedToClient, setPropertyResultsScopedToClient] = useState(false);
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState('');

  const panelClass = dark ? 'bg-[#111827] border border-white/10 text-white' : 'bg-white border border-slate-200 text-slate-900';
  const softPanelClass = dark ? 'bg-[#0f172a] border border-white/10' : 'bg-slate-50 border border-slate-200';
  const inputClass = dark ? 'w-full rounded-xl border border-white/10 bg-[#1e293b] px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none' : 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none';
  const mutedText = dark ? 'text-slate-300' : 'text-slate-600';
  const subtleText = dark ? 'text-slate-400' : 'text-slate-500';
  const selectedTemplate = useMemo(() => templates.find((item) => item._id === selectedId) || null, [templates, selectedId]);
  const isDirty = useMemo(() => {
    if (creatingNew) return !!(form.name || form.description || form.tags || form.content !== EMPTY_FORM.content);
    if (!selectedTemplate) return false;
    return JSON.stringify({
      name: form.name,
      description: form.description,
      category: form.category,
      status: form.status,
      tags: form.tags,
      content: form.content,
    }) !== JSON.stringify({
      name: selectedTemplate.name || '',
      description: selectedTemplate.description || '',
      category: selectedTemplate.category || 'General',
      status: selectedTemplate.status || 'active',
      tags: Array.isArray(selectedTemplate.tags) ? selectedTemplate.tags.join(', ') : '',
      content: selectedTemplate.content || '',
    });
  }, [creatingNew, form, selectedTemplate]);

  const applyTemplate = (template) => {
    if (!template) return;
    setCreatingNew(false);
    setSelectedId(template._id);
    setPreview('');
    setForm({
      name: template.name || '',
      description: template.description || '',
      category: template.category || 'General',
      status: template.status || 'active',
      tags: Array.isArray(template.tags) ? template.tags.join(', ') : '',
      content: template.content || '',
    });
  };

  const fetchTemplates = async (preferredId, options = {}) => {
    setLoading(true);
    try {
      const data = await templateService.list({ q: templateQuery, category: categoryFilter, status: isAdmin ? statusFilter : undefined });
      setTemplates(data || []);
      const nextSelected = (data || []).find((item) => item._id === (preferredId || selectedId)) || (data || [])[0] || null;
      if (!creatingNew || options.forceSelect) {
        if (nextSelected) applyTemplate(nextSelected);
        else {
          setSelectedId('');
          setForm(EMPTY_FORM);
        }
      }
    } catch (error) {
      toast.error(error.message || 'No se pudieron cargar las plantillas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    templateService.placeholders().then((data) => setPlaceholders(data.sections || [])).catch(() => setPlaceholders([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTemplates();
    }, 220);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateQuery, categoryFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const data = await templateService.searchClients(clientQuery);
        setClientResults(data || []);
      } catch (error) {
        setClientResults([]);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [clientQuery]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        let scopedToClient = false;
        let data = [];
        if (selectedClient?._id) {
          const clientScoped = await templateService.searchProperties(propertyQuery, { clientId: selectedClient._id });
          if (Array.isArray(clientScoped) && clientScoped.length > 0) {
            data = clientScoped;
            scopedToClient = true;
          } else {
            data = await templateService.searchProperties(propertyQuery);
          }
        } else {
          data = await templateService.searchProperties(propertyQuery);
        }
        setPropertyResults(data || []);
        setPropertyResultsScopedToClient(scopedToClient);
      } catch (error) {
        setPropertyResults([]);
        setPropertyResultsScopedToClient(false);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [propertyQuery, selectedClient?._id]);

  useEffect(() => {
    setPreview('');
  }, [selectedId, creatingNew, form.name, form.category, form.content, selectedClient?._id, selectedProperty?._id, notes]);

  const handleCreate = () => {
    setCreatingNew(true);
    setSelectedId('');
    setForm(EMPTY_FORM);
    setPreview('');
  };

  const handleSave = async () => {
    if (!isAdmin) return;
    if (!form.name.trim() || !form.content.trim()) {
      toast.error('Completa el nombre y el contenido de la plantilla');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags };
      const saved = creatingNew ? await templateService.create(payload) : await templateService.update(selectedId, payload);
      toast.success(creatingNew ? 'Plantilla creada' : 'Plantilla actualizada');
      setCreatingNew(false);
      await fetchTemplates(saved?._id || selectedId, { forceSelect: true });
    } catch (error) {
      toast.error(error.message || 'No se pudo guardar la plantilla');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin || !selectedTemplate) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Eliminar la plantilla "${selectedTemplate.name}"?`)) return;
    try {
      await templateService.remove(selectedTemplate._id);
      toast.success('Plantilla eliminada');
      setPreview('');
      await fetchTemplates('', { forceSelect: true });
    } catch (error) {
      toast.error(error.message || 'No se pudo eliminar la plantilla');
    }
  };

  const handleInsertToken = (token) => {
    if (!isAdmin) return;
    const textarea = textareaRef.current;
    if (!textarea) {
      setForm((prev) => ({ ...prev, content: `${prev.content}${prev.content ? '\n' : ''}${token}` }));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = `${form.content.slice(0, start)}${token}${form.content.slice(end)}`;
    setForm((prev) => ({ ...prev, content: next }));
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const ensureContractData = () => {
    if (!selectedClient || !selectedProperty) {
      toast.info('Selecciona un cliente y una propiedad');
      return false;
    }
    if (!creatingNew && !selectedTemplate?._id) {
      toast.info('Selecciona una plantilla');
      return false;
    }
    if (!String(form.content || '').trim()) {
      toast.info('La plantilla no tiene contenido');
      return false;
    }
    return true;
  };

  const handlePreview = async () => {
    if (!ensureContractData()) return;
    setPreviewing(true);
    try {
      const response = await templateService.preview({
        templateId: !creatingNew && selectedTemplate?._id ? selectedTemplate._id : undefined,
        name: form.name,
        category: form.category,
        content: form.content,
        clientId: selectedClient._id,
        propertyId: selectedProperty._id,
        notes,
      });
      setPreview(response.content || '');
      toast.success('Vista previa actualizada');
    } catch (error) {
      toast.error(error.message || 'No se pudo generar la vista previa');
    } finally {
      setPreviewing(false);
    }
  };

  const handleGenerate = async () => {
    if (!ensureContractData()) return;
    if (isAdmin && (creatingNew || isDirty)) {
      toast.info('Guarda la plantilla antes de generar el contrato');
      return;
    }
    setGenerating(true);
    try {
      await templateService.generate({
        templateId: selectedTemplate._id,
        clientId: selectedClient._id,
        propertyId: selectedProperty._id,
        notes,
        fileName: `${selectedTemplate.name || 'contrato'}-${selectedClient.nombre || 'cliente'}.pdf`,
      });
      toast.success('Contrato generado y guardado en Archivos');
    } catch (error) {
      toast.error(error.message || 'No se pudo generar el contrato');
    } finally {
      setGenerating(false);
    }
  };

  const stats = useMemo(() => ({
    total: templates.length,
    active: templates.filter((item) => item.status === 'active').length,
    categories: new Set(templates.map((item) => item.category).filter(Boolean)).size,
  }), [templates]);
  const hasContractContext = Boolean(selectedClient?._id && selectedProperty?._id);
  const hasTemplateContent = Boolean(String(form.content || '').trim());
  const hasPreviewTemplateContext = creatingNew || Boolean(selectedTemplate?._id);
  const canPreview = hasPreviewTemplateContext && hasContractContext && hasTemplateContent;
  const canGenerate = Boolean(selectedTemplate?._id) && hasContractContext && hasTemplateContent && (!isAdmin || (!creatingNew && !isDirty));
  const templateCardClass = (templateId) => {
    if (selectedId === templateId && !creatingNew) return 'border-cyan-400 bg-cyan-500/10';
    return dark ? 'border-white/10 bg-black/10 hover:border-cyan-500/40' : 'border-slate-200 bg-slate-50 hover:border-cyan-300';
  };

  return (
    <div className={`m-4 md:m-8 ${dark ? 'text-white' : 'text-slate-900'}`}>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className={`text-sm font-semibold uppercase tracking-[0.3em] ${subtleText}`}>Gestión documental</p>
          <h1 className="mt-2 text-3xl font-black">Plantillas</h1>
          <p className={`mt-2 max-w-3xl text-sm ${mutedText}`}>{isAdmin ? 'Crea y administra plantillas globales para todo el equipo comercial.' : 'Usa las plantillas publicadas por administración para generar contratos con tus clientes y propiedades asignadas.'}</p>
        </div>
        {isAdmin && <button type="button" onClick={handleCreate} className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"><FaPlus /> Nueva plantilla</button>}
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {[{ label: 'Plantillas', value: stats.total }, { label: 'Activas', value: stats.active }, { label: 'Categorías', value: stats.categories }].map((item) => (
          <div key={item.label} className={`${panelClass} rounded-3xl p-5 shadow-sm`}>
            <div className={`text-sm ${subtleText}`}>{item.label}</div>
            <div className="mt-2 text-3xl font-black">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className={`${panelClass} rounded-3xl p-5 shadow-sm xl:col-span-3`}>
          <div className="flex items-center gap-2 text-lg font-bold"><FaFileAlt className="text-cyan-400" /> Biblioteca</div>
          <div className="mt-4 space-y-3">
            <div className="relative"><FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${subtleText}`} /><input value={templateQuery} onChange={(e) => setTemplateQuery(e.target.value)} placeholder="Buscar por nombre, categoría o tag" className={`${inputClass} pl-9`} /></div>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={inputClass}><option value="">Todas las categorías</option>{CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
            {isAdmin && <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputClass}><option value="">Todos los estados</option><option value="active">Activas</option><option value="draft">Borrador</option><option value="archived">Archivadas</option></select>}
          </div>
          <div className="mt-4 space-y-3">
            {loading ? <div className={subtleText}>Cargando plantillas...</div> : templates.map((item) => (
              <button key={item._id} type="button" onClick={() => applyTemplate(item)} className={`w-full rounded-2xl border p-4 text-left transition ${templateCardClass(item._id)}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <div className={`mt-1 text-xs ${subtleText}`}>{item.category || 'General'} · {item.status || 'active'}</div>
                  </div>
                  <FaArrowRight className={selectedId === item._id && !creatingNew ? 'text-cyan-400' : subtleText} />
                </div>
                <div className={`mt-3 line-clamp-2 text-sm ${mutedText}`}>{item.description || 'Sin descripción'}</div>
              </button>
            ))}
            {!loading && templates.length === 0 && <div className={`rounded-2xl ${softPanelClass} p-4 text-sm ${mutedText}`}>No hay plantillas disponibles con los filtros actuales.</div>}
          </div>
        </div>

        <div className="space-y-6 xl:col-span-5">
          <div className={`${panelClass} rounded-3xl p-5 shadow-sm`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-bold">Editor de plantilla</div>
                <div className={`text-sm ${mutedText}`}>{isAdmin ? 'Administra el texto contractual y publica cambios para todo el equipo.' : 'Vista de lectura para plantillas publicadas.'}</div>
              </div>
              {isAdmin && <div className={`rounded-full px-3 py-1 text-xs font-semibold ${isDirty ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}`}>{isDirty ? 'Cambios sin guardar' : 'Sincronizado'}</div>}
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} disabled={!isAdmin} placeholder="Nombre de la plantilla" className={inputClass} />
              <select value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} disabled={!isAdmin} className={inputClass}>{CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
              <input value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} disabled={!isAdmin} placeholder="Descripción operativa" className={inputClass} />
              <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} disabled={!isAdmin} className={inputClass}><option value="active">Activa</option><option value="draft">Borrador</option><option value="archived">Archivada</option></select>
              <div className="md:col-span-2"><input value={form.tags} onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))} disabled={!isAdmin} placeholder="Tags separados por coma" className={inputClass} /></div>
              <div className="md:col-span-2"><textarea ref={textareaRef} value={form.content} onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))} disabled={!isAdmin} rows={14} className={`${inputClass} min-h-[320px] resize-y`} /></div>
            </div>
            {isAdmin && <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white dark:bg-cyan-500"><FaSave /> {saving ? 'Guardando...' : 'Guardar plantilla'}</button>{selectedTemplate && <button type="button" onClick={handleDelete} className="inline-flex items-center gap-2 rounded-2xl border border-rose-300 px-4 py-3 text-sm font-semibold text-rose-500"><FaTrash /> Eliminar</button>}</div>}
          </div>

          <div className={`${panelClass} rounded-3xl p-5 shadow-sm`}>
            <div className="flex items-center justify-between gap-3">
              <div className="text-lg font-bold">Vista previa contractual</div>
              <button type="button" onClick={handlePreview} disabled={previewing || !canPreview} className="inline-flex items-center gap-2 rounded-2xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"><FaMagic /> {previewing ? 'Generando...' : 'Actualizar preview'}</button>
            </div>
            <div className={`mt-4 rounded-2xl ${softPanelClass} p-4`}>
              <pre className={`whitespace-pre-wrap text-sm leading-7 ${mutedText}`}>{preview || 'Selecciona una plantilla, cliente y propiedad para visualizar el contrato renderizado.'}</pre>
            </div>
          </div>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <div className={`${panelClass} rounded-3xl p-5 shadow-sm`}>
            <div className="text-lg font-bold">Contexto del contrato</div>
            <div className="mt-4 space-y-4">
              <div>
                <div className={`mb-2 flex items-center gap-2 text-sm font-semibold ${mutedText}`}><FaUser className="text-cyan-400" /> Cliente</div>
                <input value={clientQuery} onChange={(e) => setClientQuery(e.target.value)} placeholder="Buscar cliente por nombre, email, teléfono o ID" className={inputClass} />
                <div className="mt-2 max-h-40 space-y-2 overflow-auto">{clientResults.map((item) => <button key={item._id} type="button" onClick={() => { setSelectedClient(item); setSelectedProperty(null); setPropertyQuery(''); setPropertyResults([]); setPropertyResultsScopedToClient(false); setPreview(''); }} className={`w-full rounded-2xl ${softPanelClass} p-3 text-left`}><div className="font-semibold">{item.nombre}</div><div className={`text-xs ${subtleText}`}>{item.email || item.telefono || item._id}</div></button>)}</div>
                {selectedClient && <div className="mt-3 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-400">Cliente seleccionado: <span className="font-semibold">{selectedClient.nombre}</span></div>}
              </div>
              <div>
                <div className={`mb-2 flex items-center gap-2 text-sm font-semibold ${mutedText}`}><FaHome className="text-cyan-400" /> Propiedad</div>
                <input value={propertyQuery} onChange={(e) => setPropertyQuery(e.target.value)} placeholder="Buscar por título, dirección, slug o ID" className={inputClass} />
                {selectedClient && <div className={`mt-2 text-xs ${subtleText}`}>{propertyResultsScopedToClient ? 'Mostrando propiedades vinculadas al cliente seleccionado.' : 'No encontramos propiedades vinculadas a este cliente. Mostrando propiedades disponibles para que puedas continuar.'}</div>}
                <div className="mt-2 max-h-40 space-y-2 overflow-auto">{propertyResults.map((item) => <button key={item._id} type="button" onClick={() => { setSelectedProperty(item); setPreview(''); }} className={`w-full rounded-2xl ${softPanelClass} p-3 text-left`}><div className="font-semibold">{item.title}</div><div className={`text-xs ${subtleText}`}>{item.address || item._id}</div></button>)}</div>
                {propertyResults.length === 0 && <div className={`mt-2 rounded-2xl ${softPanelClass} p-3 text-sm ${mutedText}`}>No hay propiedades disponibles con los criterios actuales.</div>}
                {selectedProperty && <div className="mt-3 rounded-2xl bg-cyan-500/10 p-3 text-sm text-cyan-400">Propiedad seleccionada: <span className="font-semibold">{selectedProperty.title}</span></div>}
              </div>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Notas opcionales para el contrato" className={inputClass} />
              <button type="button" onClick={handleGenerate} disabled={generating || !canGenerate} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none">{generating ? 'Generando contrato...' : 'Generar y guardar en Archivos'}</button>
            </div>
          </div>

          <div className={`${panelClass} rounded-3xl p-5 shadow-sm`}>
            <div className="text-lg font-bold">Variables disponibles</div>
            <div className="mt-4 space-y-4">
              {placeholders.map((section) => (
                <div key={section.name} className={`rounded-2xl ${softPanelClass} p-4`}>
                  <div className="text-sm font-semibold">{section.name}</div>
                  <div className="mt-3 flex flex-wrap gap-2">{(section.tokens || []).map((token) => <button key={token} type="button" onClick={() => handleInsertToken(token)} className={`rounded-full border px-3 py-1 text-xs ${dark ? 'border-white/10 bg-black/20 text-slate-200' : 'border-slate-200 bg-white text-slate-700'}`}>{token}</button>)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plantillas;
