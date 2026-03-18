import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { useStateContext } from '../contexts/ContextProvider';
import { editorService } from '../services/editorService';
import CanvasEditor from '../components/editor/CanvasEditor';
import {
  THEME, PRESETS,
  IFolder, IImage, IUpload, ITrash, IDownload, ICheck,
  IChevron, IChevronLeft, ISearch, IDroplet, IRotate, IZoom,
  IGrid, ISave, IHistory, ILayers,
} from '../components/editor/editorConstants';

const LS_KEY = 'editor_wm_controls';
const loadSavedControls = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
};
const saveControls = (obj) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch {}
};

const EditorImagenes = () => {
  const { currentMode, currentColor } = useStateContext();
  const isDark = currentMode === 'Dark';
  const t = isDark ? THEME.dark : THEME.light;

  // ── View phase: 'browse' or 'edit' ──
  const [view, setView] = useState('browse');
  // ── Sub-tab inside browse phase ──
  const [browseTab, setBrowseTab] = useState('images');

  // ── Data state ──
  const [folders, setFolders] = useState([]);
  const [folderStack, setFolderStack] = useState([]);
  const [images, setImages] = useState([]);
  const [imagesTotal, setImagesTotal] = useState(0);
  const [imagesPage, setImagesPage] = useState(1);
  const [searchQ, setSearchQ] = useState('');
  const [loadingImages, setLoadingImages] = useState(false);
  const [watermarks, setWatermarks] = useState([]);
  const [loadingWatermarks, setLoadingWatermarks] = useState(false);
  const [editedList, setEditedList] = useState([]);
  const [loadingEdited, setLoadingEdited] = useState(false);

  // ── Editor state ──
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedWatermark, setSelectedWatermark] = useState(null);
  const [imageOrigMeta, setImageOrigMeta] = useState(null);
  const canvasEditorRef = useRef(null);
  const prevPresetRef = useRef('bottom-right');

  // ── Controls (persisted to localStorage) ──
  const saved = useRef(loadSavedControls()).current;
  const [preset, setPreset] = useState(saved.preset || 'bottom-right');
  const [opacity, setOpacity] = useState(saved.opacity ?? 0.7);
  const [scale, setScale] = useState(saved.scale ?? 0.2);
  const [rotation, setRotation] = useState(saved.rotation ?? 0);
  const [margin, setMargin] = useState(saved.margin ?? 20);
  const [patternSpacing, setPatternSpacing] = useState(saved.patternSpacing ?? 200);
  const [lockAspect, setLockAspect] = useState(saved.lockAspect ?? true);
  const [outputFormat, setOutputFormat] = useState(saved.outputFormat || 'png');
  const [rendering, setRendering] = useState(false);
  const [renderResult, setRenderResult] = useState(null);

  // ── Batch selection ──
  const [batchMode, setBatchMode] = useState(false);
  const [batchSelected, setBatchSelected] = useState({});
  const [batchProcessing, setBatchProcessing] = useState(null); // { done, total, errors }

  // ── Persist controls to localStorage ──
  useEffect(() => {
    saveControls({ preset, opacity, scale, rotation, margin, patternSpacing, lockAspect, outputFormat });
  }, [preset, opacity, scale, rotation, margin, patternSpacing, lockAspect, outputFormat]);

  // ── Data loading ──
  const loadImages = useCallback(async (folderId = null, page = 1, q = '') => {
    setLoadingImages(true);
    try {
      const res = await editorService.listImages({ folder: folderId, page, limit: 50, q });
      setImages(res.items || []);
      setImagesTotal(res.total || 0);
      setImagesPage(page);
    } catch (e) {
      toast.error('Error cargando imágenes');
    } finally {
      setLoadingImages(false);
    }
  }, []);

  const loadFolders = useCallback(async (parentId = null) => {
    try {
      const res = await editorService.listFolders(parentId);
      setFolders(res || []);
    } catch (e) { /* ignore */ }
  }, []);

  const loadWatermarks = useCallback(async () => {
    setLoadingWatermarks(true);
    try {
      const res = await editorService.listWatermarks();
      setWatermarks(Array.isArray(res) ? res : []);
    } catch (e) {
      toast.error('Error cargando watermarks');
    } finally {
      setLoadingWatermarks(false);
    }
  }, []);

  const loadEdited = useCallback(async () => {
    setLoadingEdited(true);
    try {
      const res = await editorService.listEdited();
      setEditedList(Array.isArray(res) ? res : []);
    } catch (e) {
      toast.error('Error cargando imágenes editadas');
    } finally {
      setLoadingEdited(false);
    }
  }, []);

  useEffect(() => {
    const currentFolder = folderStack.length > 0 ? folderStack[folderStack.length - 1]._id : null;
    loadFolders(currentFolder);
    loadImages(currentFolder, 1, searchQ);
  }, [folderStack, loadFolders, loadImages, searchQ]);

  useEffect(() => {
    if (browseTab === 'watermarks') loadWatermarks();
    if (browseTab === 'edited') loadEdited();
  }, [browseTab, loadWatermarks, loadEdited]);

  // ── Folder navigation ──
  const enterFolder = (folder) => { setFolderStack((prev) => [...prev, folder]); setImagesPage(1); };
  const goBack = () => { setFolderStack((prev) => prev.slice(0, -1)); setImagesPage(1); };

  // ── Open image on canvas ──
  const openImage = (img) => {
    setSelectedImage(img);
    setRenderResult(null);
    setView('edit');
  };

  // ── Back to browse ──
  const backToBrowse = () => { setView('browse'); };

  // ── Every time edit view mounts (canvas recreated), reload image + watermark ──
  useEffect(() => {
    if (view !== 'edit' || !selectedImage) return;
    let cancelled = false;
    const tryLoad = async (retries = 15) => {
      if (cancelled) return;
      const editor = canvasEditorRef.current;
      if (!editor) {
        if (retries > 0) setTimeout(() => tryLoad(retries - 1), 80);
        return;
      }
      const url = selectedImage.fullUrl || selectedImage.thumbnailUrl;
      if (!url) { toast.error('No se pudo obtener la URL de la imagen'); return; }
      const ok = await editor.loadImage(url);
      if (cancelled) return;
      if (!ok) { toast.error('No se pudo cargar la imagen en el canvas'); return; }
      if (selectedWatermark) {
        await editor.addWatermark(selectedWatermark.url, { preset, opacity, scale, rotation, margin, patternSpacing, lockAspect });
      }
    };
    tryLoad();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedImage]);

  // ── When watermark changes while already in edit view, apply it to existing canvas ──
  useEffect(() => {
    if (view !== 'edit' || !selectedImage || !selectedWatermark) return;
    const editor = canvasEditorRef.current;
    if (!editor || !editor.hasBgImage()) return;
    editor.addWatermark(selectedWatermark.url, { preset, opacity, scale, rotation, margin, patternSpacing, lockAspect });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWatermark]);

  // ── When controls change, update watermark ──
  useEffect(() => {
    const editor = canvasEditorRef.current;
    if (!editor || !selectedImage || !selectedWatermark) return;
    if (!editor.hasWatermark()) return;

    const switchedPatternMode = editor.needsFullRebuild(prevPresetRef.current, preset);
    prevPresetRef.current = preset;

    // Pattern mode: always full rebuild (tile count/positions change with scale/spacing)
    // Also rebuild when switching between pattern ↔ non-pattern
    if (preset === 'pattern' || switchedPatternMode) {
      editor.addWatermark(selectedWatermark.url, { preset, opacity, scale, rotation, margin, patternSpacing, lockAspect });
    } else {
      editor.updateWatermarkProps({ preset, opacity, scale, rotation, margin, lockAspect, patternSpacing });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, opacity, scale, rotation, margin, patternSpacing, lockAspect]);

  // ── Select watermark ──
  const selectWatermark = (wm) => { setSelectedWatermark(wm); if (selectedImage) setView('edit'); };

  // ── Upload / delete watermark ──
  const watermarkInputRef = useRef(null);
  const handleWatermarkUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await editorService.uploadWatermark(file);
      toast.success('Watermark subido');
      loadWatermarks();
    } catch (err) {
      toast.error(err.message || 'Error al subir watermark');
    }
    if (watermarkInputRef.current) watermarkInputRef.current.value = '';
  };

  const handleDeleteWatermark = async (wm) => {
    if (!window.confirm('¿Eliminar esta marca de agua?')) return;
    try {
      await editorService.deleteWatermark(wm.key);
      toast.success('Watermark eliminado');
      if (selectedWatermark?.key === wm.key) setSelectedWatermark(null);
      loadWatermarks();
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  // ── Render final (backend Sharp, NOT canvas export) ──
  const handleRender = async () => {
    if (!selectedImage || !selectedWatermark) {
      toast.warn('Seleccioná una imagen y una marca de agua');
      return;
    }
    setRendering(true);
    setRenderResult(null);
    try {
      const editor = canvasEditorRef.current;
      let wmConfig = editor ? editor.getWatermarkConfig(imageOrigMeta) : null;

      if (!wmConfig) {
        const origW = imageOrigMeta?.width || 1000;
        const origH = imageOrigMeta?.height || 1000;
        const presetDef = PRESETS.find((p) => p.id === preset) || PRESETS[0];
        const wmW = origW * scale;
        const wmH = wmW;
        const pos = presetDef.getPos(origW, origH, wmW, wmH, margin);
        wmConfig = {
          mode: preset === 'pattern' ? 'pattern' : 'single',
          left: Math.round(pos.left || 0), top: Math.round(pos.top || 0),
          width: Math.round(wmW), height: Math.round(wmH),
          angle: pos.angle || rotation, opacity,
        };
      }

      if (wmConfig.mode === 'pattern') {
        wmConfig.patternOpacity = opacity;
        wmConfig.patternAngle = rotation || -30;
        wmConfig.patternScale = scale * 0.5;
      }

      const result = await editorService.render({
        imageId: selectedImage._id,
        imageObjectKey: selectedImage.object_key,
        imageBucket: selectedImage.bucket,
        watermarkKey: selectedWatermark.key,
        watermarkConfig: wmConfig,
        outputFormat,
      });
      setRenderResult(result);
      toast.success('Imagen renderizada y guardada exitosamente');
    } catch (err) {
      console.error('[Editor] Render error:', err);
      toast.error(err.message || 'Error al renderizar');
    } finally {
      setRendering(false);
    }
  };

  // ── Batch helpers ──
  const batchCount = Object.keys(batchSelected).length;

  const toggleBatchImage = (img) => {
    setBatchSelected((prev) => {
      const next = { ...prev };
      if (next[img._id]) { delete next[img._id]; } else { next[img._id] = img; }
      return next;
    });
  };

  const selectAllImages = () => {
    const all = {};
    images.forEach((img) => { all[img._id] = img; });
    setBatchSelected(all);
  };

  const clearBatchSelection = () => { setBatchSelected({}); };

  const buildWmConfigFromControls = (imgW = 1000, imgH = 1000) => {
    const presetDef = PRESETS.find((p) => p.id === preset) || PRESETS[0];
    const wmW = imgW * scale;
    const aspect = 1;
    const wmH = wmW / aspect;
    const pos = presetDef.getPos(imgW, imgH, wmW, wmH, margin);
    const cfg = {
      mode: preset === 'pattern' ? 'pattern' : 'single',
      left: Math.round(pos.left || 0), top: Math.round(pos.top || 0),
      width: Math.round(wmW), height: Math.round(wmH),
      angle: pos.angle || rotation, opacity,
    };
    if (cfg.mode === 'pattern') {
      cfg.patternOpacity = opacity;
      cfg.patternAngle = rotation || -30;
      cfg.patternScale = scale * 0.5;
      cfg.patternSpacingX = patternSpacing;
      cfg.patternSpacingY = patternSpacing;
    }
    return cfg;
  };

  const handleBatchRender = async () => {
    const imgs = Object.values(batchSelected);
    if (imgs.length === 0) { toast.warn('No hay imágenes seleccionadas'); return; }
    if (!selectedWatermark) { toast.warn('Seleccioná una marca de agua primero'); return; }
    if (!window.confirm(`¿Aplicar marca de agua a ${imgs.length} imagen(es)?`)) return;

    setBatchProcessing({ done: 0, total: imgs.length, errors: 0 });
    let done = 0, errors = 0;

    for (const img of imgs) {
      try {
        const wmConfig = buildWmConfigFromControls();
        await editorService.render({
          imageId: img._id,
          imageObjectKey: img.object_key,
          imageBucket: img.bucket,
          watermarkKey: selectedWatermark.key,
          watermarkConfig: wmConfig,
          outputFormat,
        });
        done++;
      } catch (err) {
        console.error(`[Batch] Error rendering ${img.nombre}:`, err);
        errors++;
        done++;
      }
      setBatchProcessing({ done, total: imgs.length, errors });
    }

    toast.success(`Lote completado: ${done - errors} exitosas, ${errors} errores`);
    setBatchProcessing(null);
    setBatchSelected({});
    setBatchMode(false);
    loadEdited();
  };

  /* ═══════════════════ STYLES ═══════════════════ */
  const panelStyle = { background: t.card, color: t.text };
  const labelCls = { color: t.text2, fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block' };
  const btnPrimary = {
    background: currentColor || t.accent, color: '#fff', border: 'none', borderRadius: 8,
    padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6,
  };
  const btnSecondary = {
    background: 'transparent', color: t.text2,
    borderWidth: 1, borderStyle: 'solid', borderColor: t.border, borderRadius: 8,
    padding: '6px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 4,
  };
  const tabBtn = (active) => ({
    padding: '10px 20px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 0,
    background: active ? (isDark ? '#333' : '#EEF2FF') : 'transparent',
    color: active ? (currentColor || t.accent) : t.text3,
    borderBottom: active ? `2px solid ${currentColor || t.accent}` : '2px solid transparent',
    transition: 'all 0.15s ease',
  });

  /* ═══════════════════ BROWSE TABS CONTENT ═══════════════════ */
  const renderBrowseTabs = () => (
    <div style={{ ...panelStyle, borderRadius: 12, border: `1px solid ${t.border}`, overflow: 'hidden', minHeight: 'calc(100vh - 160px)' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${t.border}`, background: isDark ? t.cardAlt : '#FAFBFC' }}>
        {[
          { id: 'images', label: 'Imágenes', icon: <IImage size={15} /> },
          { id: 'watermarks', label: 'Marcas de Agua', icon: <ILayers size={15} /> },
          { id: 'edited', label: 'Editadas', icon: <IHistory size={15} /> },
        ].map((tb) => (
          <button key={tb.id} onClick={() => setBrowseTab(tb.id)} style={tabBtn(browseTab === tb.id)}>
            {tb.icon} {tb.label}
          </button>
        ))}
        {selectedImage && (
          <button onClick={() => setView('edit')} style={{ ...tabBtn(false), marginLeft: 'auto', color: currentColor || t.accent, fontSize: 12 }}>
            <ISave size={14} /> Volver al editor
          </button>
        )}
      </div>

      <div style={{ padding: 16 }}>
        {/* ── Images sub-tab ── */}
        {browseTab === 'images' && (<>
          {/* Toolbar: search + batch toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <ISearch size={14} style={{ position: 'absolute', left: 10, top: 10, color: t.text3 }} />
              <input type="text" name="editor-search" placeholder="Buscar imágenes..." value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                style={{ width: '100%', padding: '8px 10px 8px 32px', fontSize: 13, borderRadius: 8, border: `1px solid ${t.border}`, background: isDark ? t.cardAlt : '#F9FAFB', color: t.text, outline: 'none' }}
              />
            </div>
            <button onClick={() => { setBatchMode((v) => !v); if (batchMode) clearBatchSelection(); }}
              style={{ ...btnSecondary, background: batchMode ? (currentColor || t.accent) : 'transparent', color: batchMode ? '#fff' : t.text2, borderColor: batchMode ? (currentColor || t.accent) : t.border }}>
              <ICheck size={14} /> {batchMode ? 'Cancelar selección' : 'Selección múltiple'}
            </button>
            {folderStack.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={goBack} style={{ ...btnSecondary, padding: '6px 10px', fontSize: 12 }}><IChevronLeft size={14} /> Atrás</button>
                <span style={{ fontSize: 12, color: t.text3 }}>{folderStack.map((f) => f.name).join(' / ')}</span>
              </div>
            )}
          </div>

          {/* Batch action bar */}
          {batchMode && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '10px 14px', borderRadius: 10,
              background: isDark ? 'rgba(10,132,255,0.12)' : 'rgba(0,122,255,0.08)', border: `1px solid ${isDark ? 'rgba(10,132,255,0.3)' : 'rgba(0,122,255,0.2)'}`,
              flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: currentColor || t.accent }}>
                {batchCount} imagen{batchCount !== 1 ? 'es' : ''} seleccionada{batchCount !== 1 ? 's' : ''}
              </span>
              <button onClick={selectAllImages} style={{ ...btnSecondary, fontSize: 11, padding: '4px 10px' }}>Seleccionar todas</button>
              <button onClick={clearBatchSelection} style={{ ...btnSecondary, fontSize: 11, padding: '4px 10px' }}>Limpiar</button>
              <div style={{ flex: 1 }} />
              {!selectedWatermark && (
                <button onClick={() => setBrowseTab('watermarks')} style={{ ...btnSecondary, fontSize: 12, borderColor: '#FF9500', color: '#FF9500' }}>
                  <ILayers size={14} /> Elegir marca de agua
                </button>
              )}
              {selectedWatermark && (
                <span style={{ fontSize: 11, color: t.text2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <img src={selectedWatermark.url} alt="" style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 3 }} />
                  {selectedWatermark.filename}
                </span>
              )}
              <button onClick={handleBatchRender} disabled={batchCount === 0 || !selectedWatermark || !!batchProcessing}
                style={{ ...btnPrimary, fontSize: 12, padding: '6px 14px', opacity: (batchCount === 0 || !selectedWatermark || !!batchProcessing) ? 0.5 : 1 }}>
                <ISave size={14} /> Aplicar marca de agua
              </button>
            </div>
          )}

          {/* Batch progress */}
          {batchProcessing && (
            <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: isDark ? '#1a2e1a' : '#f0fdf4', border: `1px solid ${t.success}44` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-t-transparent rounded-full" style={{ borderColor: `${t.success} transparent ${t.success} ${t.success}` }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: t.success }}>
                  Procesando {batchProcessing.done} de {batchProcessing.total}...
                </span>
                {batchProcessing.errors > 0 && <span style={{ fontSize: 12, color: t.danger }}>({batchProcessing.errors} errores)</span>}
              </div>
              <div style={{ width: '100%', height: 6, borderRadius: 3, background: isDark ? '#333' : '#e5e5e5', overflow: 'hidden' }}>
                <div style={{ width: `${(batchProcessing.done / batchProcessing.total) * 100}%`, height: '100%', borderRadius: 3, background: t.success, transition: 'width 0.3s ease' }} />
              </div>
            </div>
          )}

          {/* Folders */}
          {folders.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginBottom: 16 }}>
              {folders.map((f) => (
                <div key={f._id} onClick={() => enterFolder(f)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${t.border}`, background: isDark ? t.cardAlt : '#F8F9FA', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? t.cardAlt : '#F8F9FA'; }}
                >
                  <IFolder size={20} style={{ color: '#007AFF', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: t.text, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  <IChevron style={{ color: t.text3 }} />
                </div>
              ))}
            </div>
          )}

          {/* Images grid */}
          {loadingImages && <div style={{ textAlign: 'center', padding: 40, color: t.text3, fontSize: 13 }}>Cargando imágenes...</div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {images.map((img) => {
              const isSelected = !!batchSelected[img._id];
              return (
                <div key={img._id}
                  onClick={() => batchMode ? toggleBatchImage(img) : openImage(img)}
                  style={{
                    borderRadius: 10, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', position: 'relative',
                    border: isSelected ? `2px solid ${currentColor || t.accent}` : (selectedImage?._id === img._id ? `2px solid ${currentColor || t.accent}` : `1px solid ${t.border}`),
                    background: isSelected ? (isDark ? 'rgba(10,132,255,0.15)' : 'rgba(0,122,255,0.06)') : t.cardAlt,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                >
                  {batchMode && (
                    <div style={{
                      position: 'absolute', top: 6, left: 6, zIndex: 2, width: 22, height: 22, borderRadius: 6,
                      background: isSelected ? (currentColor || t.accent) : 'rgba(0,0,0,0.45)',
                      border: `2px solid ${isSelected ? (currentColor || t.accent) : 'rgba(255,255,255,0.7)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isSelected && <ICheck size={13} style={{ color: '#fff' }} />}
                    </div>
                  )}
                  <div style={{ width: '100%', height: 110, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {img.thumbnailUrl
                      ? <img src={img.thumbnailUrl} alt={img.nombre} style={{ maxWidth: '100%', maxHeight: 110, objectFit: 'contain' }} loading="lazy" />
                      : <IImage size={28} style={{ color: t.text3 }} />}
                  </div>
                  <div style={{ padding: '6px 8px' }}>
                    <div style={{ fontSize: 11, color: t.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.nombre}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {!loadingImages && images.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: t.text3, fontSize: 13 }}>
              <IImage size={40} style={{ color: t.text3, marginBottom: 8, opacity: 0.5 }} />
              <p>No hay imágenes en esta carpeta</p>
            </div>
          )}
          {imagesTotal > 50 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 16 }}>
              <button disabled={imagesPage <= 1} onClick={() => { const fId = folderStack.length > 0 ? folderStack[folderStack.length - 1]._id : null; loadImages(fId, imagesPage - 1, searchQ); }} style={btnSecondary}>Anterior</button>
              <span style={{ fontSize: 12, color: t.text3, lineHeight: '34px' }}>Pág {imagesPage}</span>
              <button onClick={() => { const fId = folderStack.length > 0 ? folderStack[folderStack.length - 1]._id : null; loadImages(fId, imagesPage + 1, searchQ); }} style={btnSecondary}>Siguiente</button>
            </div>
          )}
        </>)}

        {/* ── Watermarks sub-tab ── */}
        {browseTab === 'watermarks' && (<>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <input ref={watermarkInputRef} type="file" name="watermark-upload" accept=".png,.svg" onChange={handleWatermarkUpload} style={{ display: 'none' }} />
            <button onClick={() => watermarkInputRef.current?.click()} style={{ ...btnPrimary, fontSize: 13 }}>
              <IUpload size={14} /> Subir Marca de Agua
            </button>
            <span style={{ fontSize: 12, color: t.text3 }}>Formatos: PNG (transparente), SVG</span>
          </div>
          {loadingWatermarks && <div style={{ textAlign: 'center', padding: 40, color: t.text3, fontSize: 13 }}>Cargando...</div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {watermarks.map((wm) => (
              <div key={wm.key} style={{
                borderRadius: 10, overflow: 'hidden', position: 'relative', transition: 'transform 0.15s',
                border: selectedWatermark?.key === wm.key ? `2px solid ${currentColor || t.accent}` : `1px solid ${t.border}`,
                background: t.cardAlt, cursor: 'pointer',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ''; }}
              >
                <div onClick={() => selectWatermark(wm)} style={{ width: '100%', height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? '#444' : '#e5e5e5' }}>
                  {wm.url ? <img src={wm.url} alt={wm.filename} style={{ maxWidth: '90%', maxHeight: 85, objectFit: 'contain' }} /> : <ILayers size={24} style={{ color: t.text3 }} />}
                </div>
                <div style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ flex: 1, fontSize: 11, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wm.filename}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteWatermark(wm); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                    <ITrash size={13} style={{ color: t.danger }} />
                  </button>
                </div>
                {selectedWatermark?.key === wm.key && (
                  <div style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '50%', background: currentColor || t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ICheck size={14} style={{ color: '#fff' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
          {!loadingWatermarks && watermarks.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: t.text3, fontSize: 13 }}>
              <ILayers size={40} style={{ color: t.text3, marginBottom: 8, opacity: 0.5 }} />
              <p>No hay marcas de agua. Subí una para empezar.</p>
            </div>
          )}
        </>)}

        {/* ── Edited sub-tab ── */}
        {browseTab === 'edited' && (<>
          {loadingEdited && <div style={{ textAlign: 'center', padding: 40, color: t.text3, fontSize: 13 }}>Cargando...</div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {editedList.map((ed) => (
              <div key={ed._id} style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${t.border}`, background: t.cardAlt }}>
                <div style={{ width: '100%', height: 120, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {ed.outputUrl ? <img src={ed.outputUrl} alt="" style={{ maxWidth: '100%', maxHeight: 120, objectFit: 'contain' }} /> : <IImage size={24} style={{ color: t.text3 }} />}
                </div>
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{ed.outputFilename}</div>
                  <div style={{ fontSize: 11, color: t.text3, marginBottom: 4 }}>{ed.outputWidth}x{ed.outputHeight} · {ed.outputFormat?.toUpperCase()} · {(ed.outputSize / 1024).toFixed(0)} KB</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, color: t.text3 }}>{new Date(ed.createdAt).toLocaleString('es-AR')}</span>
                    {ed.outputUrl && (
                      <a href={ed.outputUrl} target="_blank" rel="noopener noreferrer" style={{ ...btnSecondary, padding: '4px 8px', fontSize: 11 }}>
                        <IDownload size={12} /> Descargar
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {!loadingEdited && editedList.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: t.text3, fontSize: 13 }}>
              <IHistory size={40} style={{ color: t.text3, marginBottom: 8, opacity: 0.5 }} />
              <p>No hay imágenes editadas aún.</p>
            </div>
          )}
        </>)}
      </div>
    </div>
  );

  /* ═══════════════════ CONTROLS SIDEBAR ═══════════════════ */
  const renderControls = () => (
    <div style={{ ...panelStyle, borderRadius: 12, border: `1px solid ${t.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', width: 300, flexShrink: 0 }}>
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${t.border}`, fontWeight: 700, fontSize: 14, color: t.text }}>Controles</div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Watermark selector */}
        <div>
          <label style={labelCls}>Marca de agua</label>
          {selectedWatermark ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 8, background: isDark ? t.cardAlt : '#F0F4FF', border: `1px solid ${t.border}` }}>
              <img src={selectedWatermark.url} alt="" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 4, background: isDark ? '#555' : '#ddd' }} />
              <span style={{ fontSize: 12, color: t.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedWatermark.filename}</span>
              <button onClick={() => setSelectedWatermark(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                <ITrash size={14} style={{ color: t.danger }} />
              </button>
            </div>
          ) : (
            <button onClick={() => { setView('browse'); setBrowseTab('watermarks'); }} style={{ ...btnSecondary, width: '100%', justifyContent: 'center' }}>
              <ILayers size={14} /> Elegir watermark
            </button>
          )}
        </div>

        <div>
          <label style={labelCls}>Posición</label>
          <select name="wm-preset" value={preset} onChange={(e) => setPreset(e.target.value)}
            style={{ width: '100%', padding: '7px 8px', fontSize: 12, borderRadius: 8, border: `1px solid ${t.border}`, background: isDark ? t.cardAlt : '#fff', color: t.text, cursor: 'pointer' }}>
            {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>

        <div>
          <label style={labelCls}><IDroplet size={12} style={{ display: 'inline', marginRight: 4 }} />Opacidad: {Math.round(opacity * 100)}%</label>
          <input type="range" name="wm-opacity" min={0} max={1} step={0.01} value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} style={{ width: '100%', accentColor: currentColor || t.accent }} />
        </div>

        <div>
          <label style={labelCls}><IZoom size={12} style={{ display: 'inline', marginRight: 4 }} />Escala: {Math.round(scale * 100)}%</label>
          <input type="range" name="wm-scale" min={0.03} max={0.8} step={0.01} value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} style={{ width: '100%', accentColor: currentColor || t.accent }} />
        </div>

        <div>
          <label style={labelCls}><IRotate size={12} style={{ display: 'inline', marginRight: 4 }} />Rotación: {rotation}°</label>
          <input type="range" name="wm-rotation" min={-180} max={180} step={1} value={rotation} onChange={(e) => setRotation(parseInt(e.target.value, 10))} style={{ width: '100%', accentColor: currentColor || t.accent }} />
        </div>

        <div>
          <label style={labelCls}>Margen: {margin}px</label>
          <input type="range" name="wm-margin" min={0} max={100} step={1} value={margin} onChange={(e) => setMargin(parseInt(e.target.value, 10))} style={{ width: '100%', accentColor: currentColor || t.accent }} />
        </div>

        {preset === 'pattern' && (
          <div>
            <label style={labelCls}><IGrid size={12} style={{ display: 'inline', marginRight: 4 }} />Separación patrón: {patternSpacing}px</label>
            <input type="range" name="wm-pattern-spacing" min={50} max={600} step={10} value={patternSpacing} onChange={(e) => setPatternSpacing(parseInt(e.target.value, 10))} style={{ width: '100%', accentColor: currentColor || t.accent }} />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={lockAspect} onChange={(e) => setLockAspect(e.target.checked)} id="lockAspect" style={{ accentColor: currentColor || t.accent }} />
          <label htmlFor="lockAspect" style={{ fontSize: 12, color: t.text2, cursor: 'pointer' }}>Bloquear proporción</label>
        </div>

        <div>
          <label style={labelCls}>Formato de salida</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {['png', 'jpeg', 'webp'].map((fmt) => (
              <button key={fmt} onClick={() => setOutputFormat(fmt)} style={{
                ...btnSecondary, flex: 1, justifyContent: 'center', textTransform: 'uppercase', fontSize: 11,
                background: outputFormat === fmt ? (currentColor || t.accent) : 'transparent',
                color: outputFormat === fmt ? '#fff' : t.text2,
                borderColor: outputFormat === fmt ? (currentColor || t.accent) : t.border,
              }}>{fmt}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: 14, borderTop: `1px solid ${t.border}` }}>
        <button onClick={handleRender} disabled={rendering || !selectedImage || !selectedWatermark}
          style={{ ...btnPrimary, width: '100%', justifyContent: 'center', opacity: (rendering || !selectedImage || !selectedWatermark) ? 0.5 : 1 }}>
          {rendering ? (<><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Procesando...</>)
            : (<><ISave size={16} /> Renderizar y Guardar</>)}
        </button>
        {(!selectedImage || !selectedWatermark) && (
          <p style={{ fontSize: 10, color: t.text3, textAlign: 'center', marginTop: 6 }}>
            {!selectedImage ? 'Seleccioná una imagen' : 'Seleccioná una marca de agua'}
          </p>
        )}
      </div>
    </div>
  );

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div className="min-h-screen px-4 lg:px-6 pt-4 pb-6" style={{ background: t.bg }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {view === 'edit' && (
            <button onClick={backToBrowse} style={{ ...btnSecondary, padding: '6px 10px' }}>
              <IChevronLeft size={14} /> Archivos
            </button>
          )}
          <div>
            <h2 style={{ color: t.text, fontSize: 22, fontWeight: 700, margin: 0 }}>
              {view === 'edit' ? selectedImage?.nombre || 'Editor' : 'Editor de Imágenes'}
            </h2>
            <p style={{ color: t.text3, fontSize: 12, margin: 0 }}>
              {view === 'edit'
                ? (imageOrigMeta ? `${imageOrigMeta.width}×${imageOrigMeta.height}px` : 'Editando imagen')
                : 'Seleccioná una imagen para aplicar marcas de agua'}
            </p>
          </div>
        </div>
        {view === 'edit' && selectedImage && selectedWatermark && (
          <button onClick={handleRender} disabled={rendering} style={{ ...btnPrimary, opacity: rendering ? 0.6 : 1 }}>
            {rendering ? <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <ISave size={16} />}
            {rendering ? 'Renderizando...' : 'Guardar Imagen Final'}
          </button>
        )}
      </div>

      {/* ═══ BROWSE VIEW ═══ */}
      {view === 'browse' && renderBrowseTabs()}

      {/* ═══ EDIT VIEW: Canvas (main) + Controls (sidebar) ═══ */}
      {view === 'edit' && (
        <div style={{ display: 'flex', gap: 12, minHeight: 'calc(100vh - 160px)' }}>
          {/* Main canvas area */}
          <div style={{ ...panelStyle, borderRadius: 12, border: `1px solid ${t.border}`, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 400, overflow: 'hidden' }}>
            <CanvasEditor
              ref={canvasEditorRef}
              accentColor={currentColor}
              onOriginalMeta={setImageOrigMeta}
            />
            {renderResult && (
              <div style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderTop: `1px solid ${t.border}`, background: isDark ? '#1a2e1a' : '#f0fdf4' }}>
                <ICheck size={16} style={{ color: t.success }} />
                <span style={{ fontSize: 12, color: t.success, fontWeight: 600 }}>Guardada: {renderResult.outputFilename}</span>
                <span style={{ fontSize: 11, color: t.text3 }}>{renderResult.width}×{renderResult.height} · {(renderResult.size / 1024).toFixed(0)} KB</span>
                <a href={renderResult.outputUrl} target="_blank" rel="noopener noreferrer" style={{ ...btnSecondary, padding: '4px 8px', marginLeft: 'auto' }}>
                  <IDownload size={12} /> Descargar
                </a>
              </div>
            )}
          </div>
          {/* Controls sidebar */}
          {renderControls()}
        </div>
      )}
    </div>
  );
};

export default EditorImagenes;
