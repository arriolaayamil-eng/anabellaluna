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
  const [activeTab, setActiveTab] = useState('biblioteca');

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

  const IOS = dark ? {
    blue: '#0A84FF', green: '#30D158', orange: '#FF9F0A', red: '#FF453A',
    purple: '#BF5AF2', teal: '#64D2FF', gray: '#98989D', gray2: '#636366',
    gray3: '#48484A', gray4: '#3A3A3C', gray5: '#333336', gray6: '#2C2C2E',
    bgGrouped: '#202124', bgCard: '#292A2D',
    separator: 'rgba(255,255,255,0.08)', label: '#E8EAED', label2: '#BDC1C6', label3: '#9AA0A6',
  } : {
    blue: '#007AFF', green: '#34C759', orange: '#FF9500', red: '#FF3B30',
    purple: '#AF52DE', teal: '#5AC8FA', gray: '#8E8E93', gray2: '#AEAEB2',
    gray3: '#C7C7CC', gray4: '#D1D1D6', gray5: '#E5E5EA', gray6: '#F2F2F7',
    bgGrouped: '#F2F2F7', bgCard: '#FFFFFF',
    separator: 'rgba(60,60,67,0.12)', label: '#000000', label2: '#3C3C43', label3: '#8E8E93',
  };

  const TABS = [
    { key: 'biblioteca', label: 'Biblioteca' },
    { key: 'editor', label: 'Editor' },
  ];

  const S = {
    page: { fontFamily: '-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Roboto,sans-serif', background: IOS.bgGrouped, minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', borderRadius: 20, overflow: 'hidden', margin: 8, marginTop: 72 },
    header: { padding: '16px 20px 0' },
    largeTitle: { fontSize: 34, fontWeight: 700, color: IOS.label, letterSpacing: -0.4 },
    subtitle: { fontSize: 14, color: IOS.label3, marginTop: 4 },
    segmentedWrap: { padding: '12px 16px' },
    segmentedBar: { display: 'flex', background: dark ? 'rgba(118,118,128,0.24)' : 'rgba(118,118,128,0.12)', borderRadius: 10, padding: 2 },
    segmentBtn: (active) => ({ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.2s', background: active ? IOS.bgCard : 'transparent', color: active ? IOS.label : IOS.gray, boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }),
    card: { background: IOS.bgCard, borderRadius: 12, margin: '0 16px', overflow: 'hidden' },
    sectionHeader: { fontSize: 13, fontWeight: 600, color: IOS.label3, textTransform: 'uppercase', letterSpacing: 0.5, padding: '16px 20px 6px' },
    listRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: `0.5px solid ${IOS.separator}`, cursor: 'pointer', transition: 'background 0.15s' },
    input: { width: '100%', border: 'none', outline: 'none', background: dark ? 'rgba(118,118,128,0.24)' : 'rgba(118,118,128,0.12)', borderRadius: 10, padding: '10px 12px', fontSize: 15, color: IOS.label, fontFamily: 'inherit' },
    textarea: { width: '100%', border: 'none', outline: 'none', background: dark ? 'rgba(118,118,128,0.24)' : 'rgba(118,118,128,0.12)', borderRadius: 10, padding: '10px 12px', fontSize: 15, color: IOS.label, fontFamily: 'inherit', resize: 'vertical', minHeight: 200 },
    select: { width: '100%', border: 'none', outline: 'none', background: dark ? 'rgba(118,118,128,0.24)' : 'rgba(118,118,128,0.12)', borderRadius: 10, padding: '10px 12px', fontSize: 15, color: IOS.label, fontFamily: 'inherit', appearance: 'none', WebkitAppearance: 'none' },
    btnPrimary: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px 20px', borderRadius: 12, border: 'none', background: IOS.blue, color: '#fff', fontSize: 17, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
    btnDanger: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px 20px', borderRadius: 12, border: 'none', background: IOS.red, color: '#fff', fontSize: 17, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 },
    btnSuccess: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px 20px', borderRadius: 12, border: 'none', background: IOS.green, color: '#fff', fontSize: 17, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
    btnSecondary: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px 20px', borderRadius: 12, border: 'none', background: IOS.purple, color: '#fff', fontSize: 17, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
    badge: (color) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: color + '18', color }),
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '0 16px 8px' },
    statCard: { background: IOS.bgCard, borderRadius: 12, padding: '14px 16px', textAlign: 'center' },
    templateItem: (active) => ({ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `0.5px solid ${IOS.separator}`, cursor: 'pointer', background: active ? (IOS.blue + '14') : 'transparent', transition: 'background 0.15s' }),
    chip: { display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', color: IOS.label2, cursor: 'pointer', border: 'none', fontFamily: 'inherit', margin: 2 },
    selectedBanner: (color) => ({ margin: '8px 0', padding: '10px 14px', borderRadius: 10, background: color + '14', display: 'flex', alignItems: 'center', gap: 8 }),
  };

  const renderBiblioteca = () => (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>
      <div style={S.statsRow}>
        {[{ label: 'Plantillas', value: stats.total, color: IOS.blue }, { label: 'Activas', value: stats.active, color: IOS.green }, { label: 'Categorías', value: stats.categories, color: IOS.purple }].map((item) => (
          <div key={item.label} style={S.statCard}>
            <div style={{ fontSize: 28, fontWeight: 700, color: item.color }}>{item.value}</div>
            <div style={{ fontSize: 12, color: IOS.label3, marginTop: 2 }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div style={S.sectionHeader}>Filtros</div>
      <div style={{ ...S.card, padding: 12 }}>
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <FaSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: IOS.gray, fontSize: 14 }} />
          <input value={templateQuery} onChange={(e) => setTemplateQuery(e.target.value)} placeholder="Buscar por nombre, categoría o tag" style={{ ...S.input, paddingLeft: 32 }} />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ ...S.select, marginBottom: isAdmin ? 8 : 0 }}>
          <option value="">Todas las categorías</option>
          {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        {isAdmin && (
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={S.select}>
            <option value="">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="draft">Borrador</option>
            <option value="archived">Archivadas</option>
          </select>
        )}
      </div>

      {isAdmin && (
        <div style={{ padding: '12px 16px 0' }}>
          <button type="button" onClick={() => { handleCreate(); setActiveTab('editor'); }} style={S.btnPrimary}><FaPlus /> Nueva plantilla</button>
        </div>
      )}

      <div style={S.sectionHeader}>Plantillas</div>
      <div style={S.card}>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: IOS.label3, fontSize: 15 }}>Cargando plantillas...</div>
        ) : templates.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: IOS.label3, fontSize: 15 }}>No hay plantillas con los filtros actuales.</div>
        ) : templates.map((item, idx) => (
          <div key={item._id} style={{ ...S.templateItem(selectedId === item._id && !creatingNew), ...(idx === templates.length - 1 ? { borderBottom: 'none' } : {}) }}
            onClick={() => { applyTemplate(item); setActiveTab('editor'); }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: IOS.blue + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FaFileAlt style={{ color: IOS.blue, fontSize: 16 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 500, color: IOS.label, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
              <div style={{ fontSize: 13, color: IOS.label3, marginTop: 2 }}>{item.category || 'General'} · {item.status || 'active'}</div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={IOS.gray3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEditor = () => (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>
      {isAdmin && (
        <div style={{ padding: '8px 20px', display: 'flex', justifyContent: 'flex-end' }}>
          <span style={S.badge(isDirty ? IOS.orange : IOS.green)}>{isDirty ? 'Cambios sin guardar' : 'Sincronizado'}</span>
        </div>
      )}

      <div style={S.sectionHeader}>Datos de la plantilla</div>
      <div style={{ ...S.card, padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} disabled={!isAdmin} placeholder="Nombre de la plantilla" style={S.input} />
          <select value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} disabled={!isAdmin} style={S.select}>
            {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <input value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} disabled={!isAdmin} placeholder="Descripción operativa" style={S.input} />
          <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} disabled={!isAdmin} style={S.select}>
            <option value="active">Activa</option>
            <option value="draft">Borrador</option>
            <option value="archived">Archivada</option>
          </select>
        </div>
        <input value={form.tags} onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))} disabled={!isAdmin} placeholder="Tags separados por coma" style={{ ...S.input, marginTop: 10 }} />
      </div>

      <div style={S.sectionHeader}>Contenido</div>
      <div style={{ ...S.card, padding: 16 }}>
        <textarea ref={textareaRef} value={form.content} onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))} disabled={!isAdmin} rows={14} style={{ ...S.textarea, minHeight: 320 }} />
      </div>

      {placeholders.length > 0 && (
        <>
          <div style={S.sectionHeader}>Variables disponibles</div>
          <div style={{ ...S.card, padding: 14 }}>
            {placeholders.map((section) => (
              <div key={section.name} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: IOS.label2, marginBottom: 6 }}>{section.name}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {(section.tokens || []).map((token) => (
                    <button key={token} type="button" onClick={() => handleInsertToken(token)} style={S.chip}>{token}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {isAdmin && (
        <div style={{ padding: '16px 16px 0' }}>
          <button type="button" onClick={handleSave} disabled={saving} style={{ ...S.btnPrimary, opacity: saving ? 0.6 : 1 }}><FaSave /> {saving ? 'Guardando...' : 'Guardar plantilla'}</button>
          {selectedTemplate && (
            <button type="button" onClick={handleDelete} style={S.btnDanger}><FaTrash /> Eliminar</button>
          )}
        </div>
      )}

      <div style={S.sectionHeader}>Cliente</div>
      <div style={{ ...S.card, padding: 16 }}>
        <div style={{ position: 'relative' }}>
          <FaUser style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: IOS.blue, fontSize: 14 }} />
          <input value={clientQuery} onChange={(e) => setClientQuery(e.target.value)} placeholder="Buscar cliente por nombre, email, teléfono o ID" style={{ ...S.input, paddingLeft: 32 }} />
        </div>
        <div style={{ maxHeight: 180, overflowY: 'auto', marginTop: 8 }}>
          {clientResults.map((item) => (
            <div key={item._id} style={{ ...S.listRow, borderBottom: `0.5px solid ${IOS.separator}` }}
              onClick={() => { setSelectedClient(item); setSelectedProperty(null); setPropertyQuery(''); setPropertyResults([]); setPropertyResultsScopedToClient(false); setPreview(''); }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: IOS.green + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FaUser style={{ color: IOS.green, fontSize: 13 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: IOS.label }}>{item.nombre}</div>
                <div style={{ fontSize: 12, color: IOS.label3 }}>{item.email || item.telefono || item._id}</div>
              </div>
            </div>
          ))}
        </div>
        {selectedClient && (
          <div style={S.selectedBanner(IOS.green)}>
            <FaUser style={{ color: IOS.green, fontSize: 13 }} />
            <span style={{ fontSize: 15, color: IOS.green, fontWeight: 600 }}>{selectedClient.nombre}</span>
          </div>
        )}
      </div>

      <div style={S.sectionHeader}>Propiedad</div>
      <div style={{ ...S.card, padding: 16 }}>
        <div style={{ position: 'relative' }}>
          <FaHome style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: IOS.blue, fontSize: 14 }} />
          <input value={propertyQuery} onChange={(e) => setPropertyQuery(e.target.value)} placeholder="Buscar por título, dirección, slug o ID" style={{ ...S.input, paddingLeft: 32 }} />
        </div>
        {selectedClient && (
          <div style={{ fontSize: 12, color: IOS.label3, marginTop: 6, padding: '0 4px' }}>
            {propertyResultsScopedToClient ? 'Mostrando propiedades vinculadas al cliente seleccionado.' : 'No encontramos propiedades vinculadas a este cliente. Mostrando propiedades disponibles.'}
          </div>
        )}
        <div style={{ maxHeight: 180, overflowY: 'auto', marginTop: 8 }}>
          {propertyResults.map((item) => (
            <div key={item._id} style={{ ...S.listRow, borderBottom: `0.5px solid ${IOS.separator}` }}
              onClick={() => { setSelectedProperty(item); setPreview(''); }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: IOS.teal + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FaHome style={{ color: IOS.teal, fontSize: 13 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: IOS.label }}>{item.title}</div>
                <div style={{ fontSize: 12, color: IOS.label3 }}>{item.address || item._id}</div>
              </div>
            </div>
          ))}
          {propertyResults.length === 0 && (
            <div style={{ padding: 16, textAlign: 'center', color: IOS.label3, fontSize: 14 }}>No hay propiedades disponibles.</div>
          )}
        </div>
        {selectedProperty && (
          <div style={S.selectedBanner(IOS.teal)}>
            <FaHome style={{ color: IOS.teal, fontSize: 13 }} />
            <span style={{ fontSize: 15, color: IOS.teal, fontWeight: 600 }}>{selectedProperty.title}</span>
          </div>
        )}
      </div>

      <div style={S.sectionHeader}>Vista previa contractual</div>
      <div style={{ ...S.card, padding: 16 }}>
        <button type="button" onClick={handlePreview} disabled={previewing || !canPreview} style={{ ...S.btnSecondary, marginBottom: 12, opacity: (previewing || !canPreview) ? 0.5 : 1 }}><FaMagic /> {previewing ? 'Generando...' : 'Actualizar preview'}</button>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.8, color: IOS.label2, margin: 0 }}>{preview || 'Selecciona una plantilla, cliente y propiedad para visualizar el contrato renderizado.'}</pre>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <button type="button" onClick={handleGenerate} disabled={generating || !canGenerate} style={{ ...S.btnSuccess, opacity: (generating || !canGenerate) ? 0.5 : 1 }}>
          {generating ? 'Generando contrato...' : 'Generar y guardar en Archivos'}
        </button>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.largeTitle}>Plantillas</div>
        <div style={S.subtitle}>{isAdmin ? 'Crea y administra plantillas globales para todo el equipo comercial.' : 'Usa las plantillas publicadas para generar contratos.'}</div>
      </div>

      <div style={S.segmentedWrap}>
        <div style={S.segmentedBar}>
          {TABS.map((t) => (
            <button key={t.key} type="button" style={S.segmentBtn(activeTab === t.key)} onClick={() => setActiveTab(t.key)}>{t.label}</button>
          ))}
        </div>
      </div>

      {activeTab === 'biblioteca' && renderBiblioteca()}
      {activeTab === 'editor' && renderEditor()}
    </div>
  );
};

export default Plantillas;
