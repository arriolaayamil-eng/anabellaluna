import React from 'react';
import { FiSettings, FiUser, FiBell, FiLock, FiDatabase } from 'react-icons/fi';
import { useStateContext } from '../contexts/ContextProvider';

const Configuracion = () => {
  const { currentMode } = useStateContext();
  const isDark = currentMode === 'Dark';
  return (
    <div className={`min-h-screen px-6 lg:px-8 pt-4 pb-6 ${isDark ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
      <div className="mb-6">
        <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <FiSettings className="text-indigo-500" /> Configuración
        </h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Ajustes del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Perfil */}
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-secondary-dark-bg border-gray-700/50' : 'bg-white border-gray-100 shadow-md'}`}>
          <div className="flex items-center gap-3 mb-4">
            <FiUser className="text-2xl text-blue-500" />
            <h3 className="text-lg font-bold dark:text-gray-200">Perfil de Usuario</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="field-57" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
              <input id="field-57" type="text" className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-200" defaultValue="Admin Usuario" />
            </div>
            <div>
              <label htmlFor="field-58" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input id="field-58" type="email" className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-200" defaultValue="admin@crm.com" />
            </div>
            <button type="button" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Guardar Cambios</button>
          </div>
        </div>

        {/* Notificaciones */}
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-secondary-dark-bg border-gray-700/50' : 'bg-white border-gray-100 shadow-md'}`}>
          <div className="flex items-center gap-3 mb-4">
            <FiBell className="text-2xl text-yellow-500" />
            <h3 className="text-lg font-bold dark:text-gray-200">Notificaciones</h3>
          </div>
          <div className="space-y-3">
            <label htmlFor="field-59" className="flex items-center gap-3">
              <input id="field-59" type="checkbox" className="w-4 h-4" defaultChecked />
              <span className="text-sm dark:text-gray-300">Nuevos leads</span>
            </label>
            <label htmlFor="field-60" className="flex items-center gap-3">
              <input id="field-60" type="checkbox" className="w-4 h-4" defaultChecked />
              <span className="text-sm dark:text-gray-300">Citas próximas</span>
            </label>
            <label htmlFor="field-61" className="flex items-center gap-3">
              <input id="field-61" type="checkbox" className="w-4 h-4" />
              <span className="text-sm dark:text-gray-300">Cambios en propiedades</span>
            </label>
          </div>
        </div>

        {/* Seguridad */}
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-secondary-dark-bg border-gray-700/50' : 'bg-white border-gray-100 shadow-md'}`}>
          <div className="flex items-center gap-3 mb-4">
            <FiLock className="text-2xl text-red-500" />
            <h3 className="text-lg font-bold dark:text-gray-200">Seguridad</h3>
          </div>
          <button type="button" className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
            Cambiar Contraseña
          </button>
        </div>

        {/* Base de datos */}
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-secondary-dark-bg border-gray-700/50' : 'bg-white border-gray-100 shadow-md'}`}>
          <div className="flex items-center gap-3 mb-4">
            <FiDatabase className="text-2xl text-green-500" />
            <h3 className="text-lg font-bold dark:text-gray-200">Datos</h3>
          </div>
          <div className="space-y-2">
            <button type="button" className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200">
              Exportar Datos
            </button>
            <button type="button" className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200">
              Backup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracion;
