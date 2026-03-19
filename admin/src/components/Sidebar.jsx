import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { MdSpaceDashboard, MdOutlineCancel, MdOutlineIntegrationInstructions } from 'react-icons/md';
import { FaUsers, FaRegCalendarAlt, FaDollarSign, FaChartBar, FaTrophy, FaBuilding, FaUserTie, FaComments, FaFileAlt, FaMagic, FaImage, FaBalanceScale } from 'react-icons/fa';

import { useStateContext } from '../contexts/ContextProvider';

const menuItems = [
  { name: 'Dashboard', path: '/', icon: <MdSpaceDashboard /> },
  { name: 'Propiedades', path: '/propiedades', icon: <FaBuilding /> },
  { name: 'Clientes', path: '/clientes', icon: <FaUsers /> },
  { name: 'Agentes', path: '/agentes', icon: <FaUserTie /> },
  { name: 'Operaciones', path: '/operaciones', icon: <FaDollarSign /> },
  { name: 'Agenda', path: '/citas', icon: <FaRegCalendarAlt /> },
  { name: 'Mensajería', path: '/mensajeria', icon: <FaComments /> },
  { name: 'Archivos', path: '/archivos', icon: <FaFileAlt /> },
  { name: 'Editor', path: '/editor-imagenes', icon: <FaImage /> },
  { name: 'Tasaciones', path: '/tasaciones', icon: <FaBalanceScale /> },
  { name: 'Plantillas', path: '/plantillas', icon: <FaMagic /> },
  { name: 'Reportes', path: '/reportes', icon: <FaChartBar /> },
  { name: 'Recompensas', path: '/recompensas', icon: <FaTrophy /> },
  { name: 'Integraciones', path: '/integraciones', icon: <MdOutlineIntegrationInstructions /> },
];

const Sidebar = () => {
  const { currentColor, currentMode, activeMenu, setActiveMenu, screenSize } = useStateContext();
  const [isHovered, setIsHovered] = useState(false);

  const handleCloseSideBar = () => {
    if (screenSize <= 900) {
      setActiveMenu(false);
    }
  };

  const isExpanded = isHovered || (screenSize <= 900 && activeMenu);
  const isMobile = screenSize <= 900;

  return (
    <>
      {/* Overlay para móviles */}
      {activeMenu && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setActiveMenu(false)}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`
          fixed left-0 top-0 h-screen flex flex-col z-50 bg-gray-900 shadow-xl
          transition-all duration-300 ease-in-out overflow-hidden
          ${isMobile 
            ? (activeMenu ? 'w-64 translate-x-0' : 'w-0 -translate-x-full') 
            : (isExpanded ? 'w-64' : 'w-16')
          }
        `}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
      >
        {/* Header */}
        <div className={`flex items-center p-4 border-b border-gray-700 ${isExpanded ? 'justify-between' : 'justify-center'}`}>
          <Link 
            to="/" 
            onClick={handleCloseSideBar} 
            className="flex items-center gap-3 text-white overflow-hidden"
          >
            <MdSpaceDashboard className="text-2xl flex-shrink-0" style={{ color: currentColor }} />
            <span className={`font-bold text-lg whitespace-nowrap transition-all duration-300 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
              ERP Admin
            </span>
          </Link>
          
          {isMobile && isExpanded && (
            <button
              type="button"
              onClick={() => setActiveMenu(false)}
              className="text-xl rounded-full p-2 hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
            >
              <MdOutlineCancel />
            </button>
          )}
        </div>

        {/* Navegación */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={handleCloseSideBar}
              className={({ isActive }) => `
                flex items-center gap-4 mx-2 my-1 p-3 rounded-lg
                transition-all duration-200 group relative
                ${isActive 
                  ? 'text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }
                ${!isExpanded ? 'justify-center' : ''}
              `}
              style={({ isActive }) => ({
                backgroundColor: isActive ? currentColor : '',
                boxShadow: isActive ? `0 0 0 2px ${currentColor}, 0 0 12px ${currentColor}40` : '',
              })}
            >
              {({ isActive }) => (
                <>
                  <span 
                    className="text-xl flex-shrink-0 transition-transform duration-200"
                    style={{ transform: isActive ? 'scale(1.15)' : 'scale(1)' }}
                  >
                    {item.icon}
                  </span>
                  <span className={`font-medium whitespace-nowrap transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                    {item.name}
                  </span>
                  
                  {/* Tooltip cuando está colapsado */}
                  {!isExpanded && !isMobile && (
                    <div className="
                      absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg
                      opacity-0 invisible group-hover:opacity-100 group-hover:visible
                      transition-all duration-200 whitespace-nowrap z-50 shadow-lg
                      pointer-events-none
                    ">
                      {item.name}
                      <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-800" />
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className={`p-4 border-t border-gray-700 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-xs text-gray-500 text-center whitespace-nowrap">ERP v1.0</p>
        </div>
      </div>

      {/* Spacer para el contenido principal en desktop */}
      {!isMobile && (
        <div className={`transition-all duration-300 ${isExpanded ? 'w-64' : 'w-16'} flex-shrink-0`} />
      )}
    </>
  );
};

export default Sidebar;
