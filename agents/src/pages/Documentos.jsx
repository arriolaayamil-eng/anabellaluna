import React, { useState, useRef } from 'react';
import { 
  FaFile, FaFilePdf, FaFileWord, FaFileImage, FaFileExcel, FaFileArchive,
  FaUpload, FaDownload, FaFolder, FaFolderPlus,
  FaSearch, FaTimes, FaTrash, FaTrashRestore,
  FaEdit, FaArrowLeft, FaHdd, FaClock, FaStar, FaEllipsisH
} from 'react-icons/fa';
import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';

const Documentos = () => {
  const { currentMode } = useStateContext();
  
  const [vistaActual, setVistaActual] = useState('explorer');
  const [carpetaActual, setCarpetaActual] = useState(null);
  const [seleccionados, setSeleccionados] = useState([]);
  const [showModalNuevaCarpeta, setShowModalNuevaCarpeta] = useState(false);
  const [showModalRenombrar, setShowModalRenombrar] = useState(false);
  const [itemRenombrar, setItemRenombrar] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nombreCarpeta, setNombreCarpeta] = useState('');
  const [categoriaCarpeta, setCategoriaCarpeta] = useState('propiedades');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuAbierto, setMenuAbierto] = useState(null);
  const fileInputRef = useRef(null);
  
  const categorias = [
    { id: 'propiedades', nombre: 'Propiedades', icono: '🏠', color: 'blue', descripcion: 'Escrituras, planos, fotos' },
    { id: 'clientes', nombre: 'Clientes', icono: '👥', color: 'green', descripcion: 'DNI, contratos, documentación' },
    { id: 'operaciones', nombre: 'Operaciones', icono: '💼', color: 'purple', descripcion: 'Comprobantes, contratos finales' },
    { id: 'legal', nombre: 'Legal', icono: '⚖️', color: 'red', descripcion: 'Documentos legales' },
    { id: 'marketing', nombre: 'Marketing', icono: '📢', color: 'orange', descripcion: 'Fotos, videos, publicidad' },
    { id: 'otros', nombre: 'Otros', icono: '📁', color: 'gray', descripcion: 'Documentos varios' },
  ];

  const [archivos, setArchivos] = useState([
    { id: 1, nombre: 'Escritura_Palermo_2amb.pdf', tipo: 'PDF', categoria: 'propiedades', tamaño: 2.4, fecha: '2025-01-10', enPapelera: false, favorito: true },
    { id: 2, nombre: 'Contrato_Juan_Perez.docx', tipo: 'Word', categoria: 'clientes', tamaño: 0.156, fecha: '2025-01-09', enPapelera: false, favorito: false },
    { id: 3, nombre: 'Plano_Casa_Belgrano.pdf', tipo: 'PDF', categoria: 'propiedades', tamaño: 3.1, fecha: '2025-01-08', enPapelera: false, favorito: true },
    { id: 4, nombre: 'Comprobante_Venta.pdf', tipo: 'PDF', categoria: 'operaciones', tamaño: 0.89, fecha: '2025-01-05', enPapelera: false, favorito: false },
    { id: 5, nombre: 'Fotos_Propiedad.zip', tipo: 'ZIP', categoria: 'marketing', tamaño: 15.2, fecha: '2025-01-03', enPapelera: false, favorito: false },
    { id: 6, nombre: 'DNI_Cliente.pdf', tipo: 'PDF', categoria: 'clientes', tamaño: 1.2, fecha: '2025-01-02', enPapelera: false, favorito: false },
    { id: 7, nombre: 'Contrato_Alquiler.docx', tipo: 'Word', categoria: 'legal', tamaño: 0.45, fecha: '2025-01-01', enPapelera: false, favorito: false },
    { id: 8, nombre: 'Reporte_Ventas.xlsx', tipo: 'Excel', categoria: 'operaciones', tamaño: 1.8, fecha: '2024-12-28', enPapelera: false, favorito: false },
    { id: 9, nombre: 'Archivo_Eliminado.pdf', tipo: 'PDF', categoria: 'otros', tamaño: 0.5, fecha: '2024-12-20', enPapelera: true, fechaEliminacion: '2025-01-08', favorito: false },
    { id: 10, nombre: 'Documento_Antiguo.docx', tipo: 'Word', categoria: 'otros', tamaño: 0.3, fecha: '2024-12-15', enPapelera: true, fechaEliminacion: '2025-01-05', favorito: false },
  ]);

  const archivosActivos = archivos.filter(a => !a.enPapelera);
  const archivosEnPapelera = archivos.filter(a => a.enPapelera);
  const espacioUsado = archivosActivos.reduce((sum, a) => sum + a.tamaño, 0);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const nuevos = files.map((f) => {
      const ext = f.name.split('.').pop().toUpperCase();
      let tipo = 'Archivo';
      if (ext === 'PDF') tipo = 'PDF';
      else if (['DOCX', 'DOC'].includes(ext)) tipo = 'Word';
      else if (['XLSX', 'XLS'].includes(ext)) tipo = 'Excel';
      else if (['ZIP', 'RAR', '7Z'].includes(ext)) tipo = 'ZIP';
      else if (['JPG', 'JPEG', 'PNG', 'GIF', 'WEBP'].includes(ext)) tipo = 'Imagen';
      return {
        id: Date.now() + Math.floor(Math.random() * 1000),
        nombre: f.name, tipo,
        categoria: carpetaActual || 'otros',
        tamaño: Math.max(0.01, +(f.size / (1024 * 1024)).toFixed(2)),
        fecha: new Date().toISOString().slice(0, 10),
        enPapelera: false, favorito: false,
      };
    });
    setArchivos(prev => [...nuevos, ...prev]);
    e.target.value = null;
  };

  const crearCarpeta = () => {
    if (!nombreCarpeta.trim()) return;
    setShowModalNuevaCarpeta(false);
    setNombreCarpeta('');
  };

  const toggleSeleccion = (id) => {
    setSeleccionados(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const seleccionarTodos = () => {
    const lista = vistaActual === 'trash' ? archivosEnPapelera : (carpetaActual ? archivosActivos.filter(a => a.categoria === carpetaActual) : []);
    setSeleccionados(seleccionados.length === lista.length ? [] : lista.map(a => a.id));
  };

  const moverAPapelera = (ids) => {
    setArchivos(prev => prev.map(a => ids.includes(a.id) ? { ...a, enPapelera: true, fechaEliminacion: new Date().toISOString().slice(0, 10) } : a));
    setSeleccionados([]);
    setMenuAbierto(null);
  };

  const restaurarDePapelera = (ids) => {
    setArchivos(prev => prev.map(a => ids.includes(a.id) ? { ...a, enPapelera: false, fechaEliminacion: null } : a));
    setSeleccionados([]);
  };

  const eliminarPermanente = (ids) => {
    if (!window.confirm('¿Eliminar permanentemente?')) return;
    setArchivos(prev => prev.filter(a => !ids.includes(a.id)));
    setSeleccionados([]);
  };

  const vaciarPapelera = () => {
    if (!window.confirm('¿Vaciar la papelera completamente?')) return;
    setArchivos(prev => prev.filter(a => !a.enPapelera));
  };

  const handleRenombrar = (archivo) => {
    setItemRenombrar(archivo);
    setNuevoNombre(archivo.nombre);
    setShowModalRenombrar(true);
    setMenuAbierto(null);
  };

  const confirmarRenombrar = () => {
    if (!nuevoNombre.trim() || !itemRenombrar) return;
    setArchivos(prev => prev.map(a => a.id === itemRenombrar.id ? { ...a, nombre: nuevoNombre } : a));
    setShowModalRenombrar(false);
    setItemRenombrar(null);
  };

  const handleDescargar = (archivo) => {
    const blob = new Blob([`Contenido de: ${archivo.nombre}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = archivo.nombre;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    setMenuAbierto(null);
  };

  const toggleFavorito = (id) => {
    setArchivos(prev => prev.map(a => a.id === id ? { ...a, favorito: !a.favorito } : a));
  };

  const getIconByType = (tipo) => {
    const icons = {
      'PDF': <FaFilePdf className="text-red-500" />,
      'Word': <FaFileWord className="text-blue-600" />,
      'Excel': <FaFileExcel className="text-green-600" />,
      'ZIP': <FaFileArchive className="text-yellow-600" />,
      'Imagen': <FaFileImage className="text-purple-500" />,
    };
    return icons[tipo] || <FaFile className="text-gray-500" />;
  };

  const getColorClass = (color) => {
    const colors = { blue: 'bg-blue-500', green: 'bg-green-500', purple: 'bg-purple-500', red: 'bg-red-500', orange: 'bg-orange-500', gray: 'bg-gray-500' };
    return colors[color] || 'bg-gray-500';
  };

  const archivosFiltrados = searchQuery 
    ? archivosActivos.filter(a => a.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
    : (carpetaActual ? archivosActivos.filter(a => a.categoria === carpetaActual) : []);

  const cardBase = 'rounded-xl shadow-md p-4 bg-white dark:bg-secondary-dark-bg';

  return (
    <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-main-bg dark:bg-main-dark-bg rounded-3xl">
      <Header category="Archivos" title="📁 Explorador de Documentos" />
      
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button onClick={() => setShowModalNuevaCarpeta(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-gray-700 dark:text-gray-200">
          <FaFolderPlus className="text-blue-500" /> Nueva Carpeta
        </button>
        <button onClick={handleUploadClick} className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md">
          <FaUpload /> Subir Archivo
        </button>
        <div className="flex-1 max-w-md">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar archivos..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><FaTimes /></button>}
          </div>
        </div>
        <button onClick={() => { setVistaActual(vistaActual === 'trash' ? 'explorer' : 'trash'); setCarpetaActual(null); setSeleccionados([]); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors ${vistaActual === 'trash' ? 'bg-red-500 text-white' : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
          <FaTrash /> Papelera {archivosEnPapelera.length > 0 && `(${archivosEnPapelera.length})`}
        </button>
      </div>

      <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFilesSelected} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className={`${cardBase} flex items-center gap-3`}>
          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30"><FaFile className="text-2xl text-blue-500" /></div>
          <div><p className="text-2xl font-bold dark:text-gray-100">{archivosActivos.length}</p><p className="text-xs text-gray-500 dark:text-gray-400">Archivos</p></div>
        </div>
        <div className={`${cardBase} flex items-center gap-3`}>
          <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30"><FaHdd className="text-2xl text-green-500" /></div>
          <div><p className="text-2xl font-bold dark:text-gray-100">{espacioUsado.toFixed(1)} MB</p><p className="text-xs text-gray-500 dark:text-gray-400">Espacio</p></div>
        </div>
        <div className={`${cardBase} flex items-center gap-3`}>
          <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30"><FaStar className="text-2xl text-yellow-500" /></div>
          <div><p className="text-2xl font-bold dark:text-gray-100">{archivos.filter(a => a.favorito && !a.enPapelera).length}</p><p className="text-xs text-gray-500 dark:text-gray-400">Favoritos</p></div>
        </div>
        <div className={`${cardBase} flex items-center gap-3`}>
          <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30"><FaTrash className="text-2xl text-red-500" /></div>
          <div><p className="text-2xl font-bold dark:text-gray-100">{archivosEnPapelera.length}</p><p className="text-xs text-gray-500 dark:text-gray-400">Papelera</p></div>
        </div>
      </div>

      {vistaActual === 'explorer' && !carpetaActual && !searchQuery && (
        <>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2"><FaFolder className="text-yellow-500" /> Carpetas</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {categorias.map((cat) => (
              <div key={cat.id} onClick={() => setCarpetaActual(cat.id)} className={`${cardBase} cursor-pointer hover:shadow-lg hover:scale-105 transition-all group`}>
                <div className="text-center">
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{cat.icono}</div>
                  <h4 className="font-semibold dark:text-gray-100 truncate">{cat.nombre}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{archivosActivos.filter(a => a.categoria === cat.id).length} archivos</p>
                </div>
                <div className={`h-1 w-full ${getColorClass(cat.color)} mt-3 rounded-full opacity-60`} />
              </div>
            ))}
          </div>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2"><FaClock className="text-blue-500" /> Recientes</h3>
          <div className={cardBase}>
            {archivosActivos.slice(0, 5).map((archivo) => (
              <div key={archivo.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="text-2xl">{getIconByType(archivo.tipo)}</div>
                <div className="flex-1 min-w-0"><p className="font-medium dark:text-gray-100 truncate">{archivo.nombre}</p><p className="text-xs text-gray-500">{archivo.tamaño} MB • {archivo.fecha}</p></div>
                {archivo.favorito && <FaStar className="text-yellow-500" />}
              </div>
            ))}
          </div>
        </>
      )}

      {vistaActual === 'explorer' && (carpetaActual || searchQuery) && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => { setCarpetaActual(null); setSearchQuery(''); setSeleccionados([]); }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
              <FaArrowLeft /> Volver
            </button>
            <span className="text-gray-400">/</span>
            <span className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-700 dark:text-blue-300">
              <FaFolder /> {searchQuery ? `"${searchQuery}"` : categorias.find(c => c.id === carpetaActual)?.nombre}
            </span>
          </div>
          {archivosFiltrados.length > 0 && (
            <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={seleccionados.length === archivosFiltrados.length && archivosFiltrados.length > 0} onChange={seleccionarTodos} className="w-4 h-4 rounded" />
                <span className="text-sm dark:text-gray-200">Seleccionar todo</span>
              </label>
              {seleccionados.length > 0 && (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm text-gray-500">{seleccionados.length} sel.</span>
                  <button onClick={() => moverAPapelera(seleccionados)} className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600"><FaTrash /></button>
                </div>
              )}
            </div>
          )}
          <div className={cardBase}>
            {archivosFiltrados.length === 0 ? (
              <div className="text-center py-12"><FaFolder className="text-6xl text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Sin archivos</p></div>
            ) : (
              <div className="divide-y dark:divide-gray-700">
                {archivosFiltrados.map((archivo) => (
                  <div key={archivo.id} className={`flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 ${seleccionados.includes(archivo.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    <input type="checkbox" checked={seleccionados.includes(archivo.id)} onChange={() => toggleSeleccion(archivo.id)} className="w-4 h-4 rounded" />
                    <div className="text-2xl">{getIconByType(archivo.tipo)}</div>
                    <div className="flex-1 min-w-0"><p className="font-medium dark:text-gray-100 truncate">{archivo.nombre}</p><p className="text-xs text-gray-500">{archivo.tipo} • {archivo.tamaño} MB</p></div>
                    <button onClick={() => toggleFavorito(archivo.id)} className={`p-2 rounded-lg ${archivo.favorito ? 'text-yellow-500' : 'text-gray-400'}`}><FaStar /></button>
                    <div className="relative">
                      <button onClick={() => setMenuAbierto(menuAbierto === archivo.id ? null : archivo.id)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><FaEllipsisH /></button>
                      {menuAbierto === archivo.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-10">
                          <button onClick={() => handleDescargar(archivo)} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"><FaDownload className="text-green-500" /> Descargar</button>
                          <button onClick={() => handleRenombrar(archivo)} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"><FaEdit className="text-blue-500" /> Renombrar</button>
                          <button onClick={() => moverAPapelera([archivo.id])} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600"><FaTrash /> Papelera</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {vistaActual === 'trash' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold dark:text-gray-100 flex items-center gap-2"><FaTrash className="text-red-500" /> Papelera</h3>
            {archivosEnPapelera.length > 0 && <button onClick={vaciarPapelera} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm">Vaciar</button>}
          </div>
          {archivosEnPapelera.length > 0 && (
            <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={seleccionados.length === archivosEnPapelera.length} onChange={() => setSeleccionados(seleccionados.length === archivosEnPapelera.length ? [] : archivosEnPapelera.map(a => a.id))} className="w-4 h-4 rounded" />
                <span className="text-sm dark:text-gray-200">Seleccionar todo</span>
              </label>
              {seleccionados.length > 0 && (
                <div className="flex items-center gap-2 ml-auto">
                  <button onClick={() => restaurarDePapelera(seleccionados)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-100 text-green-600"><FaTrashRestore /> Restaurar</button>
                  <button onClick={() => eliminarPermanente(seleccionados)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-100 text-red-600"><FaTimes /> Eliminar</button>
                </div>
              )}
            </div>
          )}
          <div className={cardBase}>
            {archivosEnPapelera.length === 0 ? (
              <div className="text-center py-12"><FaTrash className="text-6xl text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Papelera vacía</p></div>
            ) : (
              <div className="divide-y dark:divide-gray-700">
                {archivosEnPapelera.map((archivo) => (
                  <div key={archivo.id} className={`flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 ${seleccionados.includes(archivo.id) ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                    <input type="checkbox" checked={seleccionados.includes(archivo.id)} onChange={() => toggleSeleccion(archivo.id)} className="w-4 h-4 rounded" />
                    <div className="text-2xl opacity-50">{getIconByType(archivo.tipo)}</div>
                    <div className="flex-1 min-w-0"><p className="font-medium dark:text-gray-100 truncate">{archivo.nombre}</p><p className="text-xs text-gray-500">Eliminado {archivo.fechaEliminacion}</p></div>
                    <button onClick={() => restaurarDePapelera([archivo.id])} className="p-2 rounded-lg bg-green-100 text-green-600"><FaTrashRestore /></button>
                    <button onClick={() => eliminarPermanente([archivo.id])} className="p-2 rounded-lg bg-red-100 text-red-600"><FaTimes /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {showModalNuevaCarpeta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowModalNuevaCarpeta(false)}>
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-md w-full`} onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl"><h3 className="text-xl font-bold flex items-center gap-2"><FaFolderPlus /> Nueva Carpeta</h3></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium mb-2 dark:text-gray-200">Nombre</label><input type="text" value={nombreCarpeta} onChange={(e) => setNombreCarpeta(e.target.value)} placeholder="Mi carpeta" className="w-full px-4 py-2 rounded-lg border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" autoFocus /></div>
              <div><label className="block text-sm font-medium mb-2 dark:text-gray-200">Categoría</label><select value={categoriaCarpeta} onChange={(e) => setCategoriaCarpeta(e.target.value)} className="w-full px-4 py-2 rounded-lg border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">{categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.icono} {cat.nombre}</option>)}</select></div>
              <div className="flex gap-3 pt-4"><button onClick={() => setShowModalNuevaCarpeta(false)} className="flex-1 px-4 py-2 rounded-lg border dark:border-gray-700 dark:text-gray-200">Cancelar</button><button onClick={crearCarpeta} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Crear</button></div>
            </div>
          </div>
        </div>
      )}

      {showModalRenombrar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowModalRenombrar(false)}>
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-md w-full`} onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-2xl"><h3 className="text-xl font-bold flex items-center gap-2"><FaEdit /> Renombrar</h3></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium mb-2 dark:text-gray-200">Nuevo nombre</label><input type="text" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} className="w-full px-4 py-2 rounded-lg border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" autoFocus /></div>
              <div className="flex gap-3 pt-4"><button onClick={() => setShowModalRenombrar(false)} className="flex-1 px-4 py-2 rounded-lg border dark:border-gray-700 dark:text-gray-200">Cancelar</button><button onClick={confirmarRenombrar} className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Renombrar</button></div>
            </div>
          </div>
        </div>
      )}

      {menuAbierto && <div className="fixed inset-0 z-5" onClick={() => setMenuAbierto(null)} />}
    </div>
  );
};

export default Documentos;
