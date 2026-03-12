import React, { useState, useEffect, useCallback } from 'react';
import { MdOutlineCancel } from 'react-icons/md';
import { FaHome, FaMapMarkerAlt, FaDollarSign, FaEye, FaSync } from 'react-icons/fa';
import { useStateContext } from '../contexts/ContextProvider';
import { Button } from '.';
import { crmService } from '../services/crmService';

const Propiedades = () => {
  const { currentColor, setIsClicked, initialState } = useStateContext();
  const [propiedades, setPropiedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, disponibles: 0 });

  const getEstadoStyle = (estado) => {
    const styles = {
      disponible: { color: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-500', badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
      reservada: { color: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-500', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
      vendida: { color: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-500', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
      alquilada: { color: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-500', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
    };
    return styles[estado?.toLowerCase()] || styles.disponible;
  };

  const getTipoIcon = (tipo) => {
    const icons = {
      departamento: '🏢',
      casa: '🏠',
      ph: '🏘️',
      local: '🏪',
      oficina: '🏛️',
      terreno: '🌳',
      cochera: '🚗',
    };
    return icons[tipo?.toLowerCase()] || '🏠';
  };

  const formatPrice = (precio, moneda = 'USD') => {
    if (!precio) return 'Consultar';
    const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda, maximumFractionDigits: 0 });
    return formatter.format(precio);
  };

  const loadPropiedades = useCallback(async () => {
    setLoading(true);
    try {
      const [items, summary] = await Promise.all([
        crmService.propiedades.getAll(),
        crmService.navbar.getSummary(),
      ]);

      const propiedadesData = (Array.isArray(items) ? items : [])
        .slice(0, 10)
        .map((p) => ({
          id: p._id,
          nombre: p.titulo || p.nombre || 'Sin título',
          direccion: p.direccion || p.ubicacion?.direccion || 'Sin dirección',
          precio: formatPrice(p.precio, p.moneda),
          estado: p.estado || 'disponible',
          visitas: p.metadata?.visitas || p.visitas || 0,
          tipo: p.tipo || 'casa',
          operacion: p.operacion || 'venta',
        }));

      setPropiedades(propiedadesData);
      setStats({
        total: summary?.propiedades?.total || propiedadesData.length,
        disponibles: summary?.propiedades?.disponibles || propiedadesData.filter((p) => p.estado === 'disponible').length,
      });
    } catch (err) {
      console.error('Error loading properties:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPropiedades();
  }, [loadPropiedades]);

  const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : '');

  return (
    <div className="nav-item absolute right-5 md:right-40 top-16 bg-white dark:bg-[#42464D] p-6 rounded-lg w-96 shadow-xl z-50">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <FaHome className="text-2xl" style={{ color: currentColor }} />
            {stats.disponibles > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {stats.disponibles}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-lg dark:text-gray-200">Propiedades</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {stats.disponibles} disponibles de {stats.total}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadPropiedades}
            disabled={loading}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Actualizar"
          >
            <FaSync className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Button
            icon={<MdOutlineCancel />}
            color="rgb(153, 171, 180)"
            bgHoverColor="light-gray"
            size="2xl"
            borderRadius="50%"
            onClick={() => setIsClicked(initialState)}
          />
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {loading && propiedades.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: currentColor }} />
          </div>
        ) : propiedades.length === 0 ? (
          <div className="text-center py-8">
            <FaHome className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No hay propiedades registradas</p>
            <p className="text-xs text-gray-400 mt-1">Las propiedades aparecerán aquí</p>
          </div>
        ) : (
          propiedades.map((propiedad) => {
            const style = getEstadoStyle(propiedad.estado);
            return (
              <div
                key={propiedad.id}
                className={`${style.color} border-l-4 ${style.border} p-4 rounded-lg hover:shadow-md transition-all cursor-pointer`}
                onClick={() => {
                  setIsClicked(initialState);
                  window.location.href = `/crm/propiedades?id=${propiedad.id}`;
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{getTipoIcon(propiedad.tipo)}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm dark:text-gray-200 mb-1">
                      {propiedad.nombre}
                    </h4>
                    <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <FaMapMarkerAlt className="text-red-500" />
                      <span className="truncate">{propiedad.direccion}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <FaDollarSign className="text-green-600 dark:text-green-400" />
                        <span className="font-bold text-green-600 dark:text-green-400 text-sm">
                          {propiedad.precio}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <FaEye />
                        <span>{propiedad.visitas}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${style.badge}`}>
                        {capitalize(propiedad.estado)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {capitalize(propiedad.operacion)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 pt-4 border-t dark:border-gray-600">
        <button
          type="button"
          className="w-full py-2 rounded-lg font-medium transition-colors"
          style={{ backgroundColor: currentColor, color: 'white' }}
          onClick={() => {
            setIsClicked(initialState);
            window.location.href = '/crm/propiedades';
          }}
        >
          Ver Todas las Propiedades →
        </button>
      </div>
    </div>
  );
};

export default Propiedades;
