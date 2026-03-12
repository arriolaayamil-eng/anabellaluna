import React, { useState } from 'react';
import { FaPlus, FaPlay, FaPause, FaEdit, FaTrash, FaClock, FaCheckCircle, FaProjectDiagram } from 'react-icons/fa';
import { RiFlowChart } from 'react-icons/ri';
import { useStateContext } from '../contexts/ContextProvider';

const Workflows = () => {
  const { currentMode, currentColor } = useStateContext();
  const [, setShowModal] = useState(false);

  const workflows = [
    {
      id: 1,
      nombre: 'Seguimiento Automático de Leads',
      descripcion: 'Envía emails automáticos a nuevos leads cada 3 días',
      estado: 'activo',
      disparador: 'Nuevo lead registrado',
      acciones: 3,
      ejecuciones: 145,
      ultimaEjecucion: 'Hace 2 horas',
    },
    {
      id: 2,
      nombre: 'Notificación de Visitas Programadas',
      descripcion: 'Alerta al agente 1 hora antes de la visita',
      estado: 'activo',
      disparador: 'Visita programada',
      acciones: 2,
      ejecuciones: 89,
      ultimaEjecucion: 'Hace 30 min',
    },
    {
      id: 3,
      nombre: 'Actualización de Estado de Propiedades',
      descripcion: 'Cambia estado a "Vendida" al confirmar venta',
      estado: 'pausado',
      disparador: 'Venta confirmada',
      acciones: 4,
      ejecuciones: 56,
      ultimaEjecucion: 'Hace 1 día',
    },
    {
      id: 4,
      nombre: 'Recordatorio de Contratos por Vencer',
      descripcion: 'Notifica 30 días antes del vencimiento',
      estado: 'activo',
      disparador: 'Fecha de vencimiento',
      acciones: 2,
      ejecuciones: 23,
      ultimaEjecucion: 'Hace 5 horas',
    },
  ];

  const cardBase = 'bg-white dark:bg-secondary-dark-bg rounded-2xl p-6 shadow-lg';

  return (
    <div className={`min-h-screen px-6 lg:px-8 pt-4 pb-6 ${currentMode === 'Dark' ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${currentMode === 'Dark' ? 'text-white' : 'text-gray-900'}`}>
            <FaProjectDiagram className="text-indigo-500" /> Workflows
          </h2>
          <p className={`text-sm mt-1 ${currentMode === 'Dark' ? 'text-gray-400' : 'text-gray-500'}`}>Flujos de trabajo automatizados</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium shadow-lg hover:shadow-xl transition-all"
          style={{ backgroundColor: currentColor }}
        >
          <FaPlus /> Crear Workflow
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className={`${cardBase} border-l-4 border-green-500`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Workflows Activos</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">3</p>
            </div>
            <FaCheckCircle className="text-4xl text-green-500" />
          </div>
        </div>

        <div className={`${cardBase} border-l-4 border-blue-500`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Total Workflows</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">4</p>
            </div>
            <RiFlowChart className="text-4xl text-blue-500" />
          </div>
        </div>

        <div className={`${cardBase} border-l-4 border-purple-500`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Ejecuciones Hoy</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">67</p>
            </div>
            <FaClock className="text-4xl text-purple-500" />
          </div>
        </div>

        <div className={`${cardBase} border-l-4 border-orange-500`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Tasa de Éxito</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">98%</p>
            </div>
            <FaCheckCircle className="text-4xl text-orange-500" />
          </div>
        </div>
      </div>

      {/* Lista de Workflows */}
      <div className="space-y-4">
        {workflows.map((workflow) => (
          <div key={workflow.id} className={cardBase}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <RiFlowChart className="text-2xl" style={{ color: currentColor }} />
                  <h3 className="text-xl font-bold dark:text-gray-200">{workflow.nombre}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    workflow.estado === 'activo'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300'
                  }`}
                  >
                    {workflow.estado === 'activo' ? '● Activo' : '⏸ Pausado'}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{workflow.descripcion}</p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Disparador</p>
                    <p className="text-sm font-medium dark:text-gray-200">{workflow.disparador}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Acciones</p>
                    <p className="text-sm font-medium dark:text-gray-200">{workflow.acciones} pasos</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ejecuciones</p>
                    <p className="text-sm font-medium dark:text-gray-200">{workflow.ejecuciones} veces</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Última Ejecución</p>
                    <p className="text-sm font-medium dark:text-gray-200">{workflow.ultimaEjecucion}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={workflow.estado === 'activo' ? 'Pausar' : 'Activar'}
                >
                  {workflow.estado === 'activo' ? (
                    <FaPause className="text-orange-500" />
                  ) : (
                    <FaPlay className="text-green-500" />
                  )}
                </button>
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Editar"
                >
                  <FaEdit className="text-blue-500" />
                </button>
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Eliminar"
                >
                  <FaTrash className="text-red-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Plantilla de mensaje para próximas implementaciones */}
      <div className={`${cardBase} mt-8 border-2 border-dashed border-gray-300 dark:border-gray-600`}>
        <div className="text-center py-8">
          <RiFlowChart className="text-6xl mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold mb-2 dark:text-gray-200">Constructor Visual de Workflows</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Próximamente: Editor drag-and-drop para crear workflows personalizados
          </p>
          <button
            type="button"
            className="px-6 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: currentColor }}
          >
            Solicitar Demo
          </button>
        </div>
      </div>
    </div>
  );
};

export default Workflows;
