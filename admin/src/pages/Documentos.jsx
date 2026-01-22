import React, { useState, useRef } from 'react';
import { FaFile, FaFilePdf, FaFileWord, FaFileImage, FaUpload, FaEye, FaDownload, FaFolder, FaShieldAlt, FaCloud, FaSearch, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';

// Syncfusion Components
import { ChartComponent, SeriesCollectionDirective, SeriesDirective, Inject, ColumnSeries, Category, Tooltip, Legend, AccumulationChartComponent, AccumulationSeriesCollectionDirective, AccumulationSeriesDirective, AccumulationLegend, AccumulationDataLabel, AccumulationTooltip, PieSeries } from '@syncfusion/ej2-react-charts';
import { GridComponent, ColumnsDirective, ColumnDirective, Page, Sort, Filter, Inject as GridInject } from '@syncfusion/ej2-react-grids';

const Documentos = () => {
  const { currentMode, currentColor } = useStateContext();
  
  // Estados para modales
  const [showModalTotal, setShowModalTotal] = useState(false);
  const [showModalEspacio, setShowModalEspacio] = useState(false);
  const [showModalAccesos, setShowModalAccesos] = useState(false);
  const [showModalSeguridad, setShowModalSeguridad] = useState(false);

  const [documentos, setDocumentos] = useState([
    { id: 1, nombre: 'Escritura_Palermo_2amb.pdf', tipo: 'PDF', categoria: 'Propiedad', tamaño: 2.4, fecha: '2025-10-10', relacionado: 'Depto Palermo', accesos: 15 },
    { id: 2, nombre: 'Contrato_Juan_Perez.docx', tipo: 'Word', categoria: 'Cliente', tamaño: 0.156, fecha: '2025-10-09', relacionado: 'Juan Pérez', accesos: 8 },
    { id: 3, nombre: 'Plano_Casa_Belgrano.pdf', tipo: 'PDF', categoria: 'Propiedad', tamaño: 3.1, fecha: '2025-10-08', relacionado: 'Casa Belgrano', accesos: 22 },
    { id: 4, nombre: 'Comprobante_Venta.pdf', tipo: 'PDF', categoria: 'Operación', tamaño: 0.89, fecha: '2025-10-05', relacionado: 'Venta #1234', accesos: 5 },
    { id: 5, nombre: 'Fotos_Propiedad.zip', tipo: 'ZIP', categoria: 'Propiedad', tamaño: 15.2, fecha: '2025-10-03', relacionado: 'PH Colegiales', accesos: 31 },
    { id: 6, nombre: 'DNI_Cliente.pdf', tipo: 'PDF', categoria: 'Cliente', tamaño: 1.2, fecha: '2025-10-02', relacionado: 'María González', accesos: 3 },
  ]);

  // UI state para upload / preview / búsqueda
  const fileInputRef = useRef(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showModalNuevaCarpeta, setShowModalNuevaCarpeta] = useState(false);
  const [nombreCarpeta, setNombreCarpeta] = useState('');
  const [categoriaCarpeta, setCategoriaCarpeta] = useState('General');

  // Handlers básicos (mock): subir archivos, crear carpeta, ver, descargar, eliminar
  const handleUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const nuevos = files.map((f) => {
      const ext = f.name.split('.').pop().toUpperCase();
      const tipo = ext === 'PDF' ? 'PDF' : ext === 'DOCX' || ext === 'DOC' ? 'Word' : ext === 'ZIP' ? 'ZIP' : 'Imagen';
      return {
        id: Date.now() + Math.floor(Math.random() * 1000),
        nombre: f.name,
        tipo,
        categoria: 'Sin clasificar',
        tamaño: Math.max(0.01, +(f.size / (1024 * 1024)).toFixed(2)),
        fecha: new Date().toISOString().slice(0, 10),
        relacionado: '',
        accesos: 0,
        file: f,
      };
    });
    setDocumentos((d) => [...nuevos, ...d]);
    // limpiar input
    e.target.value = null;
  };

  const handleNewFolder = () => {
    setShowModalNuevaCarpeta(true);
  };

  const crearCarpeta = () => {
    if (!nombreCarpeta.trim()) {
      alert('Por favor ingresa un nombre para la carpeta');
      return;
    }
    const carpeta = { 
      id: Date.now(), 
      nombre: `📁 ${nombreCarpeta}/`, 
      tipo: 'CARPETA', 
      categoria: categoriaCarpeta, 
      tamaño: 0, 
      fecha: new Date().toISOString().slice(0,10), 
      relacionado: '', 
      accesos: 0 
    };
    setDocumentos((d) => [carpeta, ...d]);
    setShowModalNuevaCarpeta(false);
    setNombreCarpeta('');
    setCategoriaCarpeta('General');
  };

  const handleToggleSearch = () => setShowSearch((s) => !s);

  const handleView = (doc) => {
    // aumenta contador de accesos (mock)
    setDocumentos((prev) => prev.map((d) => d.id === doc.id ? { ...d, accesos: (d.accesos || 0) + 1 } : d));
    setPreviewDoc(doc);
    setShowPreview(true);
  };

  const handleDownload = (doc) => {
    // simulamos descarga: creamos blob con texto y disparamos descarga
    const content = `Descarga simulada para: ${doc.nombre}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    // aumentar accesos como registro de descarga
    setDocumentos((prev) => prev.map((d) => d.id === doc.id ? { ...d, accesos: (d.accesos || 0) + 1 } : d));
  };

  const handleDelete = (doc) => {
    const ok = window.confirm(`¿Eliminar ${doc.nombre}? Esta acción no se puede deshacer en este entorno de prueba.`);
    if (!ok) return;
    setDocumentos((prev) => prev.filter((d) => d.id !== doc.id));
  };

  // KPIs de Documentos
  const kpisDocumentos = [
    { title: 'Total Documentos', value: documentos.length + 241, desc: '42 este mes', icon: <FaFile />, color: 'from-blue-500 to-blue-600' },
    { title: 'Espacio Usado', value: `${(documentos.reduce((sum, d) => sum + d.tamaño, 0) + 3200).toFixed(1)} MB`, desc: '46.8 GB libres', icon: <FaCloud />, color: 'from-green-500 to-green-600' },
    { title: 'Accesos Hoy', value: documentos.reduce((sum, d) => sum + d.accesos, 0), desc: 'Vista previa activa', icon: <FaEye />, color: 'from-purple-500 to-purple-600' },
    { title: 'Seguridad', value: '100%', desc: 'Control por roles', icon: <FaShieldAlt />, color: 'from-orange-500 to-orange-600' },
  ];

  // Datos para gráficos
  const tiposDocumentosData = [
    { tipo: 'PDF', cantidad: documentos.filter(d => d.tipo === 'PDF').length, fill: '#DC2626' },
    { tipo: 'Word', cantidad: documentos.filter(d => d.tipo === 'Word').length, fill: '#2563EB' },
    { tipo: 'ZIP', cantidad: documentos.filter(d => d.tipo === 'ZIP').length, fill: '#059669' },
    { tipo: 'Imagen', cantidad: 12, fill: '#7C3AED' },
  ];

  const categoriasData = [
    { categoria: 'Propiedad', cantidad: documentos.filter(d => d.categoria === 'Propiedad').length },
    { categoria: 'Cliente', cantidad: documentos.filter(d => d.categoria === 'Cliente').length },
    { categoria: 'Operación', cantidad: documentos.filter(d => d.categoria === 'Operación').length },
  ];

  const getIconByType = (tipo) => {
    switch(tipo) {
      case 'PDF': return <FaFilePdf className="text-red-500 text-2xl" />;
      case 'Word': return <FaFileWord className="text-blue-500 text-2xl" />;
      case 'Imagen': return <FaFileImage className="text-green-500 text-2xl" />;
      default: return <FaFile className="text-gray-500 text-2xl" />;
    }
  };

  const cardBase = 'rounded-xl shadow-md p-6 bg-white dark:bg-secondary-dark-bg transition transform hover:scale-105';

  return (
    <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-main-bg dark:bg-main-dark-bg rounded-3xl">
      <Header category="Archivos" title="📁 Gestión Documental" />
      
      {/* Botones de Acción */}
      <div className="flex gap-3 mb-6">
        <button onClick={handleUploadClick} className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md">
          <FaUpload /> Subir Documentos
        </button>
        <button onClick={handleNewFolder} className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md">
          <FaFolder /> Nueva Carpeta
        </button>
        <button onClick={handleToggleSearch} className="flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors">
          <FaSearch /> Búsqueda Avanzada
        </button>
      </div>

      {showSearch && (
        <div className="mb-6">
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full p-3 rounded-lg border" placeholder="Buscar por nombre, categoría o relacionado..." />
        </div>
      )}

      {/* input file oculto para subir archivos */}
      <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFilesSelected} />

      {/* KPIs de Documentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        {kpisDocumentos.map((kpi, i) => (
          <div 
            key={i} 
            onClick={() => {
              if (i === 0) setShowModalTotal(true);
              else if (i === 1) setShowModalEspacio(true);
              else if (i === 2) setShowModalAccesos(true);
              else if (i === 3) setShowModalSeguridad(true);
            }}
            className={`${cardBase} overflow-hidden cursor-pointer`}
          >
            <div className={`h-2 w-full bg-gradient-to-r ${kpi.color}`} />
            <div className="flex items-center gap-4 mt-3">
              <div className={`text-3xl text-white p-3 rounded-lg bg-gradient-to-br ${kpi.color}`}>{kpi.icon}</div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500 dark:text-gray-400">{kpi.title}</p>
                <p className="text-2xl font-semibold dark:text-gray-100 truncate">{kpi.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{kpi.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Zona de Subida y Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Zona de Subida */}
        <div className={cardBase}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">☁️ Subida y Almacenamiento</h3>
          <div className="border-2 border-dashed dark:border-gray-600 rounded-lg p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
            <FaUpload className="text-4xl text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">Subida automática a VPS</p>
            <p className="text-sm text-gray-500 mb-4">Arrastra archivos aquí o haz clic para seleccionar</p>
            <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              Seleccionar Archivos
            </button>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Tipos soportados: PDF, Word, Excel, Imágenes, ZIP</p>
            <p className="text-xs text-gray-500 mt-1">Tamaño máximo: 50MB por archivo</p>
          </div>
        </div>

        {/* Gráfico de Tipos */}
        <div className={cardBase}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">📊 Tipos de Documentos</h3>
          <AccumulationChartComponent
            id="tipos-documentos-chart"
            tooltip={{ enable: true }}
            legendSettings={{ visible: true }}
            height="300px"
          >
            <Inject services={[PieSeries, AccumulationLegend, AccumulationDataLabel, AccumulationTooltip]} />
            <AccumulationSeriesCollectionDirective>
              <AccumulationSeriesDirective
                type="Pie"
                dataSource={tiposDocumentosData}
                xName="tipo"
                yName="cantidad"
                name="Documentos"
                dataLabel={{ visible: true, name: 'tipo', position: 'Outside' }}
              />
            </AccumulationSeriesCollectionDirective>
          </AccumulationChartComponent>
        </div>
      </div>

      {/* Grid de Documentos y Panel de Organización */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Grid Principal */}
        <div className={`xl:col-span-2 ${cardBase}`}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">📄 Documentos Recientes</h3>
          <GridComponent
            dataSource={documentos}
            allowPaging
            pageSettings={{ pageSize: 10 }}
            allowSorting
            allowFiltering
          >
            <GridInject services={[Page, Sort, Filter]} />
            <ColumnsDirective>
              <ColumnDirective field="nombre" headerText="Archivo" width="250" />
              <ColumnDirective field="tipo" headerText="Tipo" width="80" />
              <ColumnDirective field="categoria" headerText="Categoría" width="120" />
              <ColumnDirective field="tamaño" headerText="Tamaño (MB)" textAlign="Right" width="120" />
              <ColumnDirective field="relacionado" headerText="Relacionado" width="150" />
              <ColumnDirective field="accesos" headerText="Accesos" textAlign="Center" width="100" />
            </ColumnsDirective>
          </GridComponent>
        </div>

        {/* Panel de Organización */}
        <div className={cardBase}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">📁 Organización</h3>
          <div className="space-y-4">
            <div className="border dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <FaFolder className="text-blue-500" />
                <h4 className="font-bold dark:text-gray-200">Por Propiedad</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Escrituras, planos, fotos</p>
              <p className="text-xs text-blue-600 mt-1">{categoriasData.find(c => c.categoria === 'Propiedad')?.cantidad || 0} documentos</p>
            </div>

            <div className="border dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <FaFolder className="text-green-500" />
                <h4 className="font-bold dark:text-gray-200">Por Cliente</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">DNI, contratos, documentación</p>
              <p className="text-xs text-green-600 mt-1">{categoriasData.find(c => c.categoria === 'Cliente')?.cantidad || 0} documentos</p>
            </div>

            <div className="border dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <FaFolder className="text-purple-500" />
                <h4 className="font-bold dark:text-gray-200">Por Operación</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Comprobantes, contratos finales</p>
              <p className="text-xs text-purple-600 mt-1">{categoriasData.find(c => c.categoria === 'Operación')?.cantidad || 0} documentos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Control de Acceso y Vista Previa */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Control de Acceso */}
        <div className={cardBase}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">🔒 Control de Acceso por Roles</h3>
          <div className="space-y-4">
            <div className="border dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <FaShieldAlt className="text-red-500" />
                  <h4 className="font-bold dark:text-gray-200">Admin</h4>
                </div>
                <span className="text-sm text-green-600 dark:text-green-400">Acceso completo</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Ver, descargar, subir, eliminar</p>
            </div>

            <div className="border dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <FaShieldAlt className="text-blue-500" />
                  <h4 className="font-bold dark:text-gray-200">Supervisor</h4>
                </div>
                <span className="text-sm text-blue-600 dark:text-blue-400">Ver y descargar</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Acceso a todos los documentos</p>
            </div>

            <div className="border dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <FaShieldAlt className="text-gray-500" />
                  <h4 className="font-bold dark:text-gray-200">Agente</h4>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Solo sus documentos</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Documentos de sus operaciones</p>
            </div>
          </div>
        </div>

        {/* Vista Previa Integrada */}
        <div className={cardBase}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">👁️ Vista Previa Integrada</h3>
          <div className="border dark:border-gray-700 rounded-lg p-6 text-center">
            <FaEye className="text-4xl text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">Visualización sin descargar</p>
            <p className="text-sm text-gray-500 mb-4">PDF, imágenes y documentos de Office</p>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded text-center">
                <FaFilePdf className="text-red-500 mx-auto mb-1" />
                <p className="text-xs">PDF</p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-center">
                <FaFileWord className="text-blue-500 mx-auto mb-1" />
                <p className="text-xs">Word</p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded text-center">
                <FaFileImage className="text-green-500 mx-auto mb-1" />
                <p className="text-xs">Imagen</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Total Documentos */}
      {showModalTotal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaFile /> Total Documentos
                </h2>
                <p className="text-blue-100 text-sm mt-1">{documentos.length + 241} documentos totales (42 este mes)</p>
              </div>
              <button onClick={() => setShowModalTotal(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {documentos.map((doc) => (
                  <div key={doc.id} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'} hover:shadow-lg transition-shadow`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {getIconByType(doc.tipo)}
                        <div className="flex-1">
                          <h3 className="font-bold text-lg dark:text-gray-100">{doc.nombre}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">📁 {doc.categoria} • 🔗 {doc.relacionado}</p>
                          <div className="flex gap-3 mt-2 text-xs text-gray-600 dark:text-gray-400">
                            <span>📅 {doc.fecha}</span>
                            <span>•</span>
                            <span>💾 {doc.tamaño} MB</span>
                            <span>•</span>
                            <span>👁️ {doc.accesos} accesos</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleView(doc)} className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors" title="Ver">
                          <FaEye />
                        </button>
                        <button onClick={() => handleDownload(doc)} className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors" title="Descargar">
                          <FaDownload />
                        </button>
                        <button onClick={() => handleDelete(doc)} className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors" title="Eliminar">
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`mt-6 p-4 ${currentMode === 'Dark' ? 'bg-blue-900/20' : 'bg-blue-50'} rounded-lg border-2 border-blue-500`}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{documentos.length + 241}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Este mes</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">42</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">PDFs</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">156</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Imágenes</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">78</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Espacio Usado */}
      {showModalEspacio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaCloud /> Espacio de Almacenamiento
                </h2>
                <p className="text-green-100 text-sm mt-1">{(documentos.reduce((sum, d) => sum + d.tamaño, 0) + 3200).toFixed(1)} MB usados (46.8 GB libres)</p>
              </div>
              <button onClick={() => setShowModalEspacio(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-6`}>
                  <h3 className="font-bold text-lg mb-4 dark:text-gray-100">Uso por Categoría</h3>
                  <div className="space-y-3">
                    {[
                      { categoria: 'Propiedades', espacio: 1250, porcentaje: 38, color: 'blue' },
                      { categoria: 'Clientes', espacio: 890, porcentaje: 27, color: 'indigo' },
                      { categoria: 'Operaciones', espacio: 645, porcentaje: 20, color: 'purple' },
                      { categoria: 'Otros', espacio: 437, porcentaje: 15, color: 'gray' },
                    ].map((item, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium dark:text-gray-200">{item.categoria}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{item.espacio} MB ({item.porcentaje}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`bg-${item.color}-500 h-2 rounded-full transition-all`}
                            style={{ width: `${item.porcentaje}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-6`}>
                  <h3 className="font-bold text-lg mb-4 dark:text-gray-100">Archivos Más Grandes</h3>
                  <div className="space-y-2">
                    {documentos
                      .sort((a, b) => b.tamaño - a.tamaño)
                      .slice(0, 5)
                      .map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg">
                          <div className="flex items-center gap-3">
                            {getIconByType(doc.tipo)}
                            <span className="text-sm dark:text-gray-200">{doc.nombre}</span>
                          </div>
                          <span className="text-sm font-bold text-green-600 dark:text-green-400">{doc.tamaño} MB</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Accesos Hoy */}
      {showModalAccesos && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaEye /> Accesos y Visualizaciones
                </h2>
                <p className="text-purple-100 text-sm mt-1">{documentos.reduce((sum, d) => sum + d.accesos, 0)} accesos totales hoy</p>
              </div>
              <button onClick={() => setShowModalAccesos(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                <h3 className="font-bold text-lg mb-4 dark:text-gray-100">Documentos Más Vistos</h3>
                {documentos
                  .sort((a, b) => b.accesos - a.accesos)
                  .map((doc, idx) => (
                    <div key={doc.id} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                            idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                            idx === 1 ? 'bg-gray-300 text-gray-700' :
                            idx === 2 ? 'bg-orange-400 text-orange-900' :
                            'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                          }`}>
                            #{idx + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg dark:text-gray-100">{doc.nombre}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">📁 {doc.categoria} • 📅 {doc.fecha}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{doc.accesos}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">vistas</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Seguridad */}
      {showModalSeguridad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaShieldAlt /> Seguridad y Control de Acceso
                </h2>
                <p className="text-orange-100 text-sm mt-1">100% de documentos protegidos</p>
              </div>
              <button onClick={() => setShowModalSeguridad(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-6`}>
                  <h3 className="font-bold text-lg mb-4 dark:text-gray-100">Niveles de Acceso</h3>
                  <div className="space-y-3">
                    {[
                      { rol: 'Administrador', permisos: 'Control total', usuarios: 2, color: 'red' },
                      { rol: 'Gerente', permisos: 'Lectura y escritura', usuarios: 5, color: 'orange' },
                      { rol: 'Agente', permisos: 'Solo lectura', usuarios: 12, color: 'yellow' },
                      { rol: 'Invitado', permisos: 'Acceso limitado', usuarios: 3, color: 'green' },
                    ].map((nivel, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg border-l-4 border-orange-500">
                        <div>
                          <h4 className="font-bold dark:text-gray-100">{nivel.rol}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{nivel.permisos}</p>
                        </div>
                        <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium">
                          {nivel.usuarios} usuarios
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-6`}>
                  <h3 className="font-bold text-lg mb-4 dark:text-gray-100">Actividad Reciente</h3>
                  <div className="space-y-2">
                    {[
                      { usuario: 'Ana López', accion: 'Descargó', archivo: 'Escritura_Palermo_2amb.pdf', tiempo: 'Hace 5 min' },
                      { usuario: 'Carlos Ruiz', accion: 'Visualizó', archivo: 'Contrato_Juan_Perez.docx', tiempo: 'Hace 12 min' },
                      { usuario: 'Laura Fernández', accion: 'Subió', archivo: 'Plano_Nuevo.pdf', tiempo: 'Hace 23 min' },
                      { usuario: 'Sofía Torres', accion: 'Compartió', archivo: 'Fotos_Propiedad.zip', tiempo: 'Hace 1 hora' },
                    ].map((actividad, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm dark:text-gray-200">
                            <span className="font-bold">{actividad.usuario}</span> {actividad.accion.toLowerCase()} <span className="text-orange-600 dark:text-orange-400">{actividad.archivo}</span>
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{actividad.tiempo}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vista Previa Mejorado */}
      {showPreview && previewDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            {/* Header del Modal */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  {getIconByType(previewDoc.tipo)}
                  <div>
                    <h3 className="text-2xl font-bold">{previewDoc.nombre}</h3>
                    <div className="flex gap-4 mt-2 text-sm text-blue-100">
                      <span>📁 {previewDoc.categoria}</span>
                      <span>•</span>
                      <span>💾 {previewDoc.tamaño} MB</span>
                      <span>•</span>
                      <span>📅 {previewDoc.fecha}</span>
                      <span>•</span>
                      <span>👁️ {previewDoc.accesos} vistas</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPreview(false)} 
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                >
                  <FaTimes className="text-2xl" />
                </button>
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-3 mt-4">
                <button 
                  onClick={() => handleDownload(previewDoc)} 
                  className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  <FaDownload /> Descargar
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(previewDoc.nombre);
                    alert('Nombre copiado al portapapeles');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors"
                >
                  📋 Copiar nombre
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm(`¿Compartir ${previewDoc.nombre}?`)) {
                      alert('Función de compartir (mock) - En producción se generaría un enlace compartible');
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors"
                >
                  🔗 Compartir
                </button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Vista Previa Principal */}
                <div className="lg:col-span-2">
                  <h4 className="font-bold text-lg mb-4 dark:text-gray-100">📄 Vista Previa</h4>
                  <div className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-6 border-2 ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    {previewDoc.tipo === 'PDF' && (
                      <div className="space-y-4">
                        <div className="h-96 bg-white dark:bg-gray-900 rounded-lg shadow-inner flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                          <div className="text-center">
                            <FaFilePdf className="text-6xl text-red-500 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400 font-medium">Documento PDF</p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Vista previa simulada</p>
                            <p className="text-xs text-gray-400 dark:text-gray-600 mt-4">En producción se mostraría el PDF real usando un visor integrado</p>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-center">
                          <button className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm">Página 1 de 5</button>
                          <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">← Anterior</button>
                          <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">Siguiente →</button>
                        </div>
                      </div>
                    )}
                    {previewDoc.tipo === 'Word' && (
                      <div className="h-96 bg-white dark:bg-gray-900 rounded-lg shadow-inner flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                        <div className="text-center">
                          <FaFileWord className="text-6xl text-blue-500 mx-auto mb-4" />
                          <p className="text-gray-600 dark:text-gray-400 font-medium">Documento Word</p>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Vista previa simulada</p>
                          <p className="text-xs text-gray-400 dark:text-gray-600 mt-4">En producción se convertiría a HTML o PDF para visualización</p>
                        </div>
                      </div>
                    )}
                    {previewDoc.tipo === 'Imagen' && (
                      <div className="h-96 bg-white dark:bg-gray-900 rounded-lg shadow-inner flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                        <div className="text-center">
                          <FaFileImage className="text-6xl text-green-500 mx-auto mb-4" />
                          <p className="text-gray-600 dark:text-gray-400 font-medium">Imagen</p>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Vista previa simulada</p>
                          <p className="text-xs text-gray-400 dark:text-gray-600 mt-4">En producción se mostraría la imagen real</p>
                        </div>
                      </div>
                    )}
                    {previewDoc.tipo === 'ZIP' && (
                      <div className="h-96 bg-white dark:bg-gray-900 rounded-lg shadow-inner flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                        <div className="text-center">
                          <FaFolder className="text-6xl text-yellow-500 mx-auto mb-4" />
                          <p className="text-gray-600 dark:text-gray-400 font-medium">Archivo Comprimido</p>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Contenido: {Math.floor(Math.random() * 20) + 5} archivos</p>
                          <p className="text-xs text-gray-400 dark:text-gray-600 mt-4">Descarga el archivo para ver su contenido</p>
                          <button 
                            onClick={() => handleDownload(previewDoc)}
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            Descargar ZIP
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Panel de Información */}
                <div className="space-y-4">
                  <div className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4`}>
                    <h4 className="font-bold mb-3 dark:text-gray-100">ℹ️ Información</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
                        <span className="font-medium dark:text-gray-200">{previewDoc.tipo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Tamaño:</span>
                        <span className="font-medium dark:text-gray-200">{previewDoc.tamaño} MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Categoría:</span>
                        <span className="font-medium dark:text-gray-200">{previewDoc.categoria}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Fecha:</span>
                        <span className="font-medium dark:text-gray-200">{previewDoc.fecha}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Accesos:</span>
                        <span className="font-medium dark:text-gray-200">{previewDoc.accesos}</span>
                      </div>
                      {previewDoc.relacionado && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Relacionado:</span>
                          <span className="font-medium dark:text-gray-200">{previewDoc.relacionado}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4`}>
                    <h4 className="font-bold mb-3 dark:text-gray-100">🔒 Seguridad</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <FaCheckCircle className="text-green-500" />
                        <span className="dark:text-gray-300">Archivo verificado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaShieldAlt className="text-blue-500" />
                        <span className="dark:text-gray-300">Almacenado en VPS seguro</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaCloud className="text-purple-500" />
                        <span className="dark:text-gray-300">Backup automático</span>
                      </div>
                    </div>
                  </div>

                  <div className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4`}>
                    <h4 className="font-bold mb-3 dark:text-gray-100">⚙️ Acciones</h4>
                    <div className="space-y-2">
                      <button 
                        onClick={() => {
                          const newName = window.prompt('Nuevo nombre:', previewDoc.nombre);
                          if (newName && newName !== previewDoc.nombre) {
                            setDocumentos(prev => prev.map(d => 
                              d.id === previewDoc.id ? { ...d, nombre: newName } : d
                            ));
                            setPreviewDoc({ ...previewDoc, nombre: newName });
                            alert('Nombre actualizado');
                          }
                        }}
                        className="w-full px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm"
                      >
                        ✏️ Renombrar
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm('¿Mover a otra categoría?')) {
                            const newCat = window.prompt('Nueva categoría:', previewDoc.categoria);
                            if (newCat) {
                              setDocumentos(prev => prev.map(d => 
                                d.id === previewDoc.id ? { ...d, categoria: newCat } : d
                              ));
                              setPreviewDoc({ ...previewDoc, categoria: newCat });
                              alert('Categoría actualizada');
                            }
                          }
                        }}
                        className="w-full px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm"
                      >
                        📁 Mover
                      </button>
                      <button 
                        onClick={() => {
                          handleDelete(previewDoc);
                          setShowPreview(false);
                        }}
                        className="w-full px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Carpeta */}
      {showModalNuevaCarpeta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-md w-full overflow-hidden`}>
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6">
              <div className="flex items-center gap-3">
                <FaFolder className="text-3xl" />
                <div>
                  <h3 className="text-2xl font-bold">Nueva Carpeta</h3>
                  <p className="text-green-100 text-sm mt-1">Organiza tus documentos</p>
                </div>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Nombre de la Carpeta */}
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                    📝 Nombre de la Carpeta *
                  </label>
                  <input
                    type="text"
                    value={nombreCarpeta}
                    onChange={(e) => setNombreCarpeta(e.target.value)}
                    placeholder="Ej: Contratos 2025"
                    className={`w-full px-4 py-3 rounded-lg border-2 ${
                      currentMode === 'Dark' 
                        ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-green-500' 
                        : 'bg-white border-gray-300 focus:border-green-500'
                    } focus:outline-none transition-colors`}
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') crearCarpeta();
                    }}
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                    📁 Categoría
                  </label>
                  <select
                    value={categoriaCarpeta}
                    onChange={(e) => setCategoriaCarpeta(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border-2 ${
                      currentMode === 'Dark' 
                        ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-green-500' 
                        : 'bg-white border-gray-300 focus:border-green-500'
                    } focus:outline-none transition-colors`}
                  >
                    <option value="General">General</option>
                    <option value="Propiedad">Propiedad</option>
                    <option value="Cliente">Cliente</option>
                    <option value="Operación">Operación</option>
                    <option value="Contable">Contable</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>

                {/* Información */}
                <div className={`${currentMode === 'Dark' ? 'bg-green-900/20' : 'bg-green-50'} border-2 border-green-500 rounded-lg p-4`}>
                  <div className="flex items-start gap-3">
                    <div className="text-green-600 dark:text-green-400 text-xl">💡</div>
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">Tip:</p>
                      <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                        Las carpetas te ayudan a organizar documentos relacionados. Puedes arrastrar archivos dentro de ellas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowModalNuevaCarpeta(false);
                    setNombreCarpeta('');
                    setCategoriaCarpeta('General');
                  }}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                    currentMode === 'Dark'
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  onClick={crearCarpeta}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <FaFolder /> Crear Carpeta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documentos;
