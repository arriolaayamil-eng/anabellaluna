import React from 'react';
import { FiSettings, FiUser, FiBell, FiLock, FiDatabase } from 'react-icons/fi';
import { Header } from '../components';

const Configuracion = () => {
  return (
    <div className="min-h-screen px-6 lg:px-8 pt-4 pb-6 bg-gray-50 dark:bg-main-dark-bg">
      <Header category="Sistema" title="Configuración" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Perfil */}
        <div className="border dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <FiUser className="text-2xl text-blue-500" />
            <h3 className="text-lg font-bold dark:text-gray-200">Perfil de Usuario</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
              <input type="text" className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-200" defaultValue="Admin Usuario" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input type="email" className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-200" defaultValue="admin@crm.com" />
            </div>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Guardar Cambios</button>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="border dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <FiBell className="text-2xl text-yellow-500" />
            <h3 className="text-lg font-bold dark:text-gray-200">Notificaciones</h3>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4" defaultChecked />
              <span className="text-sm dark:text-gray-300">Nuevos leads</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4" defaultChecked />
              <span className="text-sm dark:text-gray-300">Citas próximas</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-sm dark:text-gray-300">Cambios en propiedades</span>
            </label>
          </div>
        </div>

        {/* Seguridad */}
        <div className="border dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <FiLock className="text-2xl text-red-500" />
            <h3 className="text-lg font-bold dark:text-gray-200">Seguridad</h3>
          </div>
          <button className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
            Cambiar Contraseña
          </button>
        </div>

        {/* Base de datos */}
        <div className="border dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <FiDatabase className="text-2xl text-green-500" />
            <h3 className="text-lg font-bold dark:text-gray-200">Datos</h3>
          </div>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200">
              Exportar Datos
            </button>
            <button className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200">
              Backup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracion;
