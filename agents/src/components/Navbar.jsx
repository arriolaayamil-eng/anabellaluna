import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdDarkMode, MdLightMode, MdKeyboardArrowDown, MdSpaceDashboard } from 'react-icons/md';
import { FiSettings } from 'react-icons/fi';
import { FaBars, FaBuilding, FaTasks, FaBell, FaComments, FaTrophy, FaGift } from 'react-icons/fa';
import { TooltipComponent } from '@syncfusion/ej2-react-popups';

import avatar from '../data/avatar.png';
import { Propiedades, Tareas, Alertas, ChatInterno, UserProfile, RewardsPanel, triggerTestCelebration } from '.';
import { themeColors } from '../data/dummy';
import { useStateContext } from '../contexts/ContextProvider';
import { crmService } from '../services/crmService';
import { authService } from '../services/authService';
import notificationService from '../services/notificationService';
import { isApiUnavailableError } from '../config/api';

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
    setActiveMenu,
    handleClick,
    isClicked,
    setScreenSize,
    screenSize,
    setMode,
    setColor,
  } = useStateContext();

  const [showColorMenu, setShowColorMenu] = useState(false);
  const [topBarVisible, setTopBarVisible] = useState(true);
  const lastScrollY = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = screenSize <= 900;
  const [, setUnreadCount] = useState(0);
  const [rewardCount, setRewardCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [apiOffline, setApiOffline] = useState(false);

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
    return str.split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const userName = capitalize(currentUser?.nombre || currentUser?.username || 'Usuario');
  const userAvatar = currentUser?.avatar || avatar;

  const loadNavbarStats = useCallback(async () => {
    try {
      const summary = await crmService.navbar.getSummary();
      setApiOffline(false);
      if (summary) {
        setNavbarStats(summary);
        setUnreadCount(summary.mensajes?.total || 0);
      }
    } catch (e) {
      if (isApiUnavailableError(e)) {
        setApiOffline(true);
        return;
      }
      console.error('Error loading navbar stats:', e);
    }
  }, []);

  // loadUnreadCount removed — unread count now computed via navbarStats

  const loadRewardCount = useCallback(async () => {
    try {
      const unseen = await crmService.rewards.getUnseen();
      setApiOffline(false);
      setRewardCount(Array.isArray(unseen) ? unseen.length : 0);
    } catch (e) {
      if (isApiUnavailableError(e)) {
        setApiOffline(true);
      }
    }
  }, []);

  useEffect(() => {
    loadNavbarStats();
    loadRewardCount();
    crmService.rewards.recordLogin().catch(() => {});
    // Generate notifications from real business events on load
    notificationService.generateNotifications().catch(() => {});
    const interval = setInterval(() => {
      loadNavbarStats();
      loadRewardCount();
    }, 30000);
    // Re-generate notifications every 5 minutes
    const genInterval = setInterval(() => {
      notificationService.generateNotifications().catch(() => {});
    }, 300000);
    return () => { clearInterval(interval); clearInterval(genInterval); };
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

  useEffect(() => {
    if (!isMobile) { setTopBarVisible(true); return undefined; }
    const THRESHOLD = 10;
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (Math.abs(currentY - lastScrollY.current) < THRESHOLD) return;
      setTopBarVisible(currentY < lastScrollY.current || currentY < 10);
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  const colorPicker = (
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
  );

  const themeToggle = (
    <NavButton
      title={currentMode === 'Dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      customFunc={() => setMode({ target: { value: currentMode === 'Dark' ? 'Light' : 'Dark' } })}
      color={currentColor}
      icon={currentMode === 'Dark' ? <MdLightMode /> : <MdDarkMode />}
    />
  );

  const bottomNavItems = [
    { icon: <MdSpaceDashboard size={22} />, label: 'Inicio', action: () => navigate('/crm'), active: location.pathname === '/crm', badge: 0 },
    { icon: <FaTasks size={20} />, label: 'Tareas', action: () => handleClick('tareas'), active: isClicked.tareas, badge: navbarStats.tareas.total },
    { icon: <FaComments size={20} />, label: 'Chat', action: () => { handleClick('chatInterno'); loadNavbarStats(); }, active: isClicked.chatInterno, badge: navbarStats.mensajes.total },
    { icon: <FaBell size={20} />, label: 'Alertas', action: () => handleClick('alertas'), active: isClicked.alertas, badge: navbarStats.notificaciones.noLeidas },
    { icon: null, label: 'Perfil', action: () => handleClick('userProfile'), active: isClicked.userProfile, isProfile: true, badge: 0 },
  ];

  return (
    <div className="relative">
      {/* Top Bar */}
      <div
        className={`flex items-center p-3 md:px-6 gap-2 transition-transform duration-300${isMobile ? ' fixed top-0 left-0 right-0 z-40 bg-main-bg dark:bg-main-dark-bg' : ''}`}
        style={isMobile ? { transform: topBarVisible ? 'translateY(0)' : 'translateY(-100%)' } : undefined}
      >
        {/* Mobile: Hamburger button */}
        {isMobile && (
          <button
            type="button"
            onClick={() => setActiveMenu(true)}
            className="p-2.5 rounded-xl text-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            style={{ color: currentColor }}
          >
            <FaBars />
          </button>
        )}

        <div className="flex-1" />

        {apiOffline && (
          <div className="mr-2 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
            API sin conexión
          </div>
        )}

        {/* Desktop: Full nav group */}
        {!isMobile && (
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
              dotColor={navbarStats.tareas.hoy > 0 ? '#EF4444' : 'transparent'}
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
              dotColor={rewardCount > 0 ? '#FFD700' : 'transparent'}
              customFunc={() => handleClick('rewards')}
              color={currentColor}
              icon={<FaTrophy />}
              isActive={isClicked.rewards}
            />
            <NavButton title="Probar Celebración" customFunc={() => triggerTestCelebration()} color={currentColor} icon={<FaGift />} />
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-600 mx-1" />
            {themeToggle}
            {colorPicker}
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
                <div>
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
        )}

        {/* Mobile: Minimal top-right controls */}
        {isMobile && (
          <div className="flex items-center gap-1">
            {themeToggle}
            {colorPicker}
          </div>
        )}
      </div>

      {/* Panels */}
      {isClicked.propiedades && (<Propiedades />)}
      {isClicked.tareas && (<Tareas />)}
      {isClicked.chatInterno && (<ChatInterno />)}
      {isClicked.alertas && (<Alertas />)}
      {isClicked.rewards && (<RewardsPanel onClose={() => handleClick('')} />)}
      {isClicked.userProfile && (<UserProfile />)}

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[9999] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700/80 shadow-[0_-2px_20px_rgba(0,0,0,0.08)] transition-transform duration-300"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', transform: topBarVisible ? 'translateY(0)' : 'translateY(100%)' }}
        >
          <nav className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
            {bottomNavItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1.5 rounded-2xl transition-all duration-200 ${
                  item.active
                    ? 'scale-105'
                    : 'text-gray-400 dark:text-gray-500 active:scale-95'
                }`}
                style={item.active ? { color: currentColor } : {}}
              >
                {item.badge > 0 && (
                  <span className="absolute -top-0.5 right-1 bg-red-500 text-white text-[9px] rounded-full min-w-[16px] h-4 flex items-center justify-center font-bold px-1">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
                {item.isProfile ? (
                  <img
                    src={userAvatar}
                    alt="perfil"
                    className="w-6 h-6 rounded-full object-cover transition-shadow"
                    style={item.active ? { boxShadow: `0 0 0 2px ${currentColor}` } : {}}
                  />
                ) : (
                  <span className="text-[22px] leading-none">{item.icon}</span>
                )}
                <span className="text-[10px] font-semibold leading-tight">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
};

export default Navbar;
