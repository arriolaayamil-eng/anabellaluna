import React, { useState } from 'react';
import { FaUserShield, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaUsers, FaShieldAlt } from 'react-icons/fa';
import { useStateContext } from '../contexts/ContextProvider';

const RolesPermisos = () => {
  const { currentMode, currentColor } = useStateContext();
  const [selectedRole, setSelectedRole] = useState(null);

  const roles = [
    {
      id: 1,
      nombre: 'Administrador',
      usuarios: 2,
      descripcion: 'Acceso total al sistema',
      color: 'red',
      permisos: {
        propiedades: { ver: true, crear: true, editar: true, eliminar: true },
        clientes: { ver: true, crear: true, editar: true, eliminar: true },
        reportes: { ver: true, crear: true, editar: true, eliminar: true },
        configuracion: { ver: true, crear: true, editar: true, eliminar: true },
      },
    },
    {
      id: 2,
      nombre: 'Gerente',
      usuarios: 3,
      descripcion: 'Gestión de equipo y reportes',
      color: 'blue',
      permisos: {
        propiedades: { ver: true, crear: true, editar: true, eliminar: false },
        clientes: { ver: true, crear: true, editar: true, eliminar: false },
        reportes: { ver: true, crear: true, editar: true, eliminar: false },
        configuracion: { ver: true, crear: false, editar: false, eliminar: false },
      },
    },
    {
      id: 3,
      nombre: 'Agente',
      usuarios: 12,
      descripcion: 'Gestión de propiedades y clientes',
      color: 'green',
      permisos: {
        propiedades: { ver: true, crear: true, editar: true, eliminar: false },
        clientes: { ver: true, crear: true, editar: true, eliminar: false },
        reportes: { ver: true, crear: false, editar: false, eliminar: false },
        configuracion: { ver: false, crear: false, editar: false, eliminar: false },
      },
    },
    {
      id: 4,
      nombre: 'Asistente',
      usuarios: 5,
      descripcion: 'Soporte administrativo',
      color: 'purple',
      permisos: {
        propiedades: { ver: true, crear: false, editar: true, eliminar: false },
        clientes: { ver: true, crear: true, editar: true, eliminar: false },
        reportes: { ver: true, crear: false, editar: false, eliminar: false },
        configuracion: { ver: false, crear: false, editar: false, eliminar: false },
      },
    },
  ];

  const modulos = [
    { id: 'propiedades', nombre: 'Propiedades', icon: '🏠' },
    { id: 'clientes', nombre: 'Clientes', icon: '👥' },
    { id: 'reportes', nombre: 'Reportes', icon: '📊' },
    { id: 'configuracion', nombre: 'Configuración', icon: '⚙️' },
  ];

  const acciones = [
    { id: 'ver', nombre: 'Ver', icon: '👁️' },
    { id: 'crear', nombre: 'Crear', icon: '➕' },
    { id: 'editar', nombre: 'Editar', icon: '✏️' },
    { id: 'eliminar', nombre: 'Eliminar', icon: '🗑️' },
  ];

  const cardBase = 'bg-white dark:bg-secondary-dark-bg rounded-2xl p-6 shadow-lg';

  const getColorClasses = (color) => {
    const colors = {
      red: 'from-red-500 to-red-600',
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className={`min-h-screen px-6 lg:px-8 pt-4 pb-6 ${currentMode === 'Dark' ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${currentMode === 'Dark' ? 'text-white' : 'text-gray-900'}`}>
            <FaShieldAlt className="text-red-500" /> Roles y Permisos
          </h2>
          <p className={`text-sm mt-1 ${currentMode === 'Dark' ? 'text-gray-400' : 'text-gray-500'}`}>Control de acceso y seguridad</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium shadow-lg hover:shadow-xl transition-all"
          style={{ backgroundColor: currentColor }}
        >
          <FaPlus /> Crear Rol
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className={`${cardBase} border-l-4 border-blue-500`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Total Roles</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{roles.length}</p>
            </div>
            <FaUserShield className="text-4xl text-blue-500" />
          </div>
        </div>

        <div className={`${cardBase} border-l-4 border-green-500`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Usuarios Totales</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {roles.reduce((sum, role) => sum + role.usuarios, 0)}
              </p>
            </div>
            <FaUsers className="text-4xl text-green-500" />
          </div>
        </div>

        <div className={`${cardBase} border-l-4 border-purple-500`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Módulos</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{modulos.length}</p>
            </div>
            <span className="text-4xl">📦</span>
          </div>
        </div>

        <div className={`${cardBase} border-l-4 border-orange-500`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Permisos</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{acciones.length}</p>
            </div>
            <span className="text-4xl">🔐</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Lista de Roles */}
        <div className="xl:col-span-1 space-y-4">
          <h3 className="text-xl font-bold mb-4 dark:text-gray-200">Roles del Sistema</h3>
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => setSelectedRole(role)}
              className={`${cardBase} cursor-pointer transition-all hover:shadow-xl ${
                selectedRole?.id === role.id ? 'ring-2 ring-offset-2' : ''
              }`}
              style={selectedRole?.id === role.id ? { ringColor: currentColor } : {}}
            >
              <div className={`bg-gradient-to-br ${getColorClasses(role.color)} text-white p-4 rounded-lg mb-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaUserShield className="text-2xl" />
                    <div>
                      <h4 className="font-bold text-lg">{role.nombre}</h4>
                      <p className="text-sm opacity-90">{role.usuarios} usuarios</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{role.descripcion}</p>
              <div className="flex gap-2 mt-3">
                <button type="button" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <FaEdit className="text-blue-500" />
                </button>
                <button type="button" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <FaTrash className="text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Matriz de Permisos */}
        <div className="xl:col-span-2">
          <h3 className="text-xl font-bold mb-4 dark:text-gray-200">
            {selectedRole ? `Permisos de ${selectedRole.nombre}` : 'Selecciona un rol para ver permisos'}
          </h3>

          {selectedRole ? (
            <div className={cardBase}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 dark:border-gray-700">
                      <th className="text-left p-4 dark:text-gray-200">Módulo</th>
                      {acciones.map((accion) => (
                        <th key={accion.id} className="text-center p-4 dark:text-gray-200">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl">{accion.icon}</span>
                            <span className="text-xs">{accion.nombre}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modulos.map((modulo) => (
                      <tr key={modulo.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{modulo.icon}</span>
                            <span className="font-medium dark:text-gray-200">{modulo.nombre}</span>
                          </div>
                        </td>
                        {acciones.map((accion) => (
                          <td key={accion.id} className="text-center p-4">
                            {selectedRole.permisos[modulo.id]?.[accion.id] ? (
                              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30">
                                <FaCheck className="text-green-600 dark:text-green-400" />
                              </div>
                            ) : (
                              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30">
                                <FaTimes className="text-red-600 dark:text-red-400" />
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  className="flex-1 py-3 rounded-lg text-white font-medium transition-colors"
                  style={{ backgroundColor: currentColor }}
                >
                  Guardar Cambios
                </button>
                <button type="button" className="px-6 py-3 rounded-lg border-2 dark:border-gray-600 font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-200">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className={`${cardBase} text-center py-12`}>
              <FaUserShield className="text-6xl mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">
                Selecciona un rol de la lista para ver y editar sus permisos
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Información adicional */}
      <div className={`${cardBase} mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800`}>
        <div className="flex items-start gap-4">
          <span className="text-5xl">🔒</span>
          <div>
            <h3 className="text-xl font-bold mb-2 text-blue-900 dark:text-blue-100">
              Control de Acceso Basado en Roles (RBAC)
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              El sistema utiliza RBAC para gestionar permisos de manera granular. Cada usuario tiene asignado un rol que determina sus capacidades en el sistema.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm font-bold mb-1 dark:text-gray-200">✅ Seguridad Mejorada</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Control preciso de accesos</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm font-bold mb-1 dark:text-gray-200">📋 Auditoría Completa</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Registro de todas las acciones</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm font-bold mb-1 dark:text-gray-200">⚡ Gestión Simplificada</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Asignación rápida de permisos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolesPermisos;
