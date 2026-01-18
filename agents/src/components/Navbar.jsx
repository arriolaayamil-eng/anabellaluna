import React, { useEffect, useCallback, useState } from 'react';
import { MdDarkMode, MdLightMode, MdKeyboardArrowDown } from 'react-icons/md';
import { FiSettings } from 'react-icons/fi';
import { FaBuilding, FaTasks, FaBell, FaComments, FaTrophy, FaGift } from 'react-icons/fa';
import { TooltipComponent } from '@syncfusion/ej2-react-popups';

import avatar from '../data/avatar.png';
import { Propiedades, Tareas, Alertas, ChatInterno, UserProfile, RewardsPanel, triggerTestCelebration } from '.';
import { themeColors } from '../data/dummy';
import { useStateContext } from '../contexts/ContextProvider';
import { crmService } from '../services/crmService';
import { authService } from '../services/authService';
import notificationService from '../services/notificationService';

const NavButton = ({ title, customFunc, icon, color, dotColor, badgeCount, isActive }) => (
  <TooltipComponent content={title} position="BottomCenter">
    <button
      type="button"
      onClick={() => customFunc()}
      className={`
        relative text-xl p-3 rounded-xl transition-all duration-200
        hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105
        ${isActive ? 'bg-gray-100 dark:bg-gray-700 shadow-sm' : ''}
      `}
      style={{ color }}
    >
      {badgeCount > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center font-bold px-1">
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      ) : dotColor && dotColor !== 'transparent' ? (
        <span
          style={{ background: dotColor }}
          className="absolute inline-flex rounded-full h-2.5 w-2.5 right-2 top-2 animate-pulse"
        />
      ) : null}
      {icon}
    </button>
  </TooltipComponent>
);

const Navbar = () => {
  const {
    currentColor,
    currentMode,
    activeMenu,
    setActiveMenu,
    handleClick,
    isClicked,
    setScreenSize,
    screenSize,
    setMode,
    setThemeSettings,
    setColor,
  } = useStateContext();

  const [showColorMenu, setShowColorMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [rewardCount, setRewardCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  
  // Navbar summary counts
  const [navbarStats, setNavbarStats] = useState({
    propiedades: { total: 0, disponibles: 0 },
    tareas: { pendientes: 0, hoy: 0, citas: 0, total: 0 },
    mensajes: { consultasNoLeidas: 0, internosNoLeidos: 0, total: 0 },
    notificaciones: { noLeidas: 0 },
  });
  
  // Listen for user updates (e.g., after profile save)
  useEffect(() => {
    const handleUserUpdate = (event) => {
      setCurrentUser(event.detail || authService.getCurrentUser());
    };
    window.addEventListener('userUpdated', handleUserUpdate);
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
  }, []);
  
  const capitalize = (str) => {
    if (!str) return '';
    return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };
  
  const userName = capitalize(currentUser?.nombre || currentUser?.username || 'Usuario');
  const userAvatar = currentUser?.avatar || avatar;

  const loadNavbarStats = useCallback(async () => {
    try {
      const summary = await crmService.navbar.getSummary();
      if (summary) {
        setNavbarStats(summary);
        setUnreadCount(summary.mensajes?.total || 0);
      }
    } catch (e) {
      console.error('Error loading navbar stats:', e);
    }
  }, []);

  const loadUnreadCount = useCallback(async () => {
    try {
      const items = await crmService.activities.getAll();
      const unread = (Array.isArray(items) ? items : [])
        .filter(item => 
          (item.type === 'enquiry' || item.type === 'visit_scheduled') &&
          !(item.metadata && item.metadata.read)
        ).length;
      setUnreadCount(unread);
    } catch (e) {
      console.error('Error loading unread count:', e);
    }
  }, []);

  const loadRewardCount = useCallback(async () => {
    try {
      const unseen = await crmService.rewards.getUnseen();
      setRewardCount(Array.isArray(unseen) ? unseen.length : 0);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadNavbarStats();
    loadRewardCount();
    crmService.rewards.recordLogin().catch(() => {});
    const interval = setInterval(() => {
      loadNavbarStats();
      loadRewardCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadNavbarStats, loadRewardCount]);

  const handleResize = useCallback(() => {
    setScreenSize(window.innerWidth);
  }, [setScreenSize]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);

    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  useEffect(() => {
    if (screenSize <= 900) {
      setActiveMenu(false);
    } else {
      setActiveMenu(true);
    }
  }, [screenSize, setActiveMenu]);

  return (
    <div className="flex justify-end items-center p-3 md:px-6 relative gap-2">
      <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-2xl px-2 py-1 shadow-sm">
        <NavButton 
          title={`Propiedades (${navbarStats.propiedades.disponibles} disponibles)`} 
          customFunc={() => handleClick('propiedades')} 
          color={currentColor} 
          icon={<FaBuilding />} 
          badgeCount={navbarStats.propiedades.disponibles}
          isActive={isClicked.propiedades} 
        />
        <NavButton 
          title={`Tareas (${navbarStats.tareas.total} pendientes)`} 
          customFunc={() => handleClick('tareas')} 
          color={currentColor} 
          icon={<FaTasks />} 
          badgeCount={navbarStats.tareas.total}
          dotColor={navbarStats.tareas.hoy > 0 ? "#EF4444" : "transparent"}
          isActive={isClicked.tareas} 
        />
        <NavButton 
          title={`Mensajes (${navbarStats.mensajes.total} sin leer)`} 
          customFunc={() => { handleClick('chatInterno'); loadNavbarStats(); }} 
          color={currentColor} 
          icon={<FaComments />} 
          badgeCount={navbarStats.mensajes.total}
          isActive={isClicked.chatInterno} 
        />
        <NavButton 
          title={`Alertas (${navbarStats.notificaciones.noLeidas} sin leer)`} 
          customFunc={() => handleClick('alertas')} 
          color={currentColor} 
          icon={<FaBell />} 
          badgeCount={navbarStats.notificaciones.noLeidas}
          isActive={isClicked.alertas} 
        />
        <NavButton 
          title="Mis Logros" 
          dotColor={rewardCount > 0 ? "#FFD700" : "transparent"} 
          customFunc={() => handleClick('rewards')} 
          color={currentColor} 
          icon={<FaTrophy />} 
          isActive={isClicked.rewards} 
        />
        <NavButton title="Probar Celebración" customFunc={() => triggerTestCelebration()} color={currentColor} icon={<FaGift />} />
        <div className="w-px h-8 bg-gray-200 dark:bg-gray-600 mx-1" />
        {/* Toggle modo claro/oscuro */}
        <NavButton
          title={currentMode === 'Dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          customFunc={() => setMode({ target: { value: currentMode === 'Dark' ? 'Light' : 'Dark' } })}
          color={currentColor}
          icon={currentMode === 'Dark' ? <MdLightMode /> : <MdDarkMode />}
        />
        {/* Botón para abrir selector de tema (colores) */}
        <div className="relative">
          <NavButton
            title="Tema de color"
            customFunc={() => setShowColorMenu((prev) => !prev)}
            color={currentColor}
            icon={<FiSettings />}
          />
          {showColorMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-secondary-dark-bg shadow-lg rounded-lg p-3 z-50 border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
                Colores del tema
              </p>
              <div className="grid grid-cols-4 gap-2">
                {themeColors.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    className="h-8 w-8 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-105"
                    style={{ borderColor: item.color === currentColor ? item.color : 'transparent' }}
                    onClick={() => {
                      setColor(item.color);
                      setShowColorMenu(false);
                    }}
                  >
                    <span
                      className="h-6 w-6 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <TooltipComponent content="Mi Perfil" position="BottomCenter">
          <div
            className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
            onClick={() => handleClick('userProfile')}
          >
            <img
              className="rounded-full w-10 h-10 object-cover ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800"
              style={{ ringColor: currentColor }}
              src={userAvatar}
              alt="user-profile"
            />
            <div className="hidden md:block">
              <p className="text-base font-bold text-gray-800 dark:text-gray-100 leading-tight">
                {userName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Agente
              </p>
            </div>
            <MdKeyboardArrowDown className="text-gray-500 dark:text-gray-400 text-lg" />
          </div>
        </TooltipComponent>
      </div>

      {isClicked.propiedades && (<Propiedades />)}
      {isClicked.tareas && (<Tareas />)}
      {isClicked.chatInterno && (<ChatInterno />)}
      {isClicked.alertas && (<Alertas />)}
      {isClicked.rewards && (<RewardsPanel onClose={() => handleClick('')} />)}
      {isClicked.userProfile && (<UserProfile />)}
    </div>
  );
};

export default Navbar;
