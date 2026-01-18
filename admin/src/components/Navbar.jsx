import React, { useEffect, useCallback, useState } from 'react';
import { MdDarkMode, MdLightMode, MdKeyboardArrowDown } from 'react-icons/md';
import { FiSettings } from 'react-icons/fi';
import { FaBuilding, FaTasks, FaBell, FaComments } from 'react-icons/fa';
import { TooltipComponent } from '@syncfusion/ej2-react-popups';

import avatar from '../data/avatar.png';
import { Propiedades, Tareas, Alertas, ChatInterno, UserProfile } from '.';
import { themeColors } from '../data/dummy';
import { useStateContext } from '../contexts/ContextProvider';
import { authService } from '../services/authService';

const NavButton = ({ title, customFunc, icon, color, dotColor, isActive }) => (
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
      {dotColor && dotColor !== 'transparent' && (
        <span
          style={{ background: dotColor }}
          className="absolute inline-flex rounded-full h-2.5 w-2.5 right-2 top-2 animate-pulse"
        />
      )}
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

  const currentUser = authService.getCurrentUser();
  const userName = currentUser?.nombre || currentUser?.username || 'Administrador';
  const userAvatar = currentUser?.avatar || avatar;

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
        <NavButton title="Propiedades" customFunc={() => handleClick('propiedades')} color={currentColor} icon={<FaBuilding />} isActive={isClicked.propiedades} />
        <NavButton title="Tareas" customFunc={() => handleClick('tareas')} color={currentColor} icon={<FaTasks />} dotColor="#F59E0B" isActive={isClicked.tareas} />
        <NavButton title="Chat Interno" customFunc={() => handleClick('chatInterno')} color={currentColor} icon={<FaComments />} isActive={isClicked.chatInterno} />
        <NavButton title="Alertas" customFunc={() => handleClick('alertas')} color={currentColor} icon={<FaBell />} isActive={isClicked.alertas} />
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
                Administrador
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
      {isClicked.userProfile && (<UserProfile />)}
    </div>
  );
};

export default Navbar;
