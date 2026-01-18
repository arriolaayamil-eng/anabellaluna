import React, { useState, useEffect } from 'react';
import { MdOutlineCancel } from 'react-icons/md';
import { FaUser, FaEnvelope, FaTasks, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

import { Button } from '.';
import { useStateContext } from '../contexts/ContextProvider';
import { authService } from '../services/authService';
import defaultAvatar from '../data/avatar.png';

const UserProfile = () => {
  const { currentColor, setIsClicked, initialState } = useStateContext();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());

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
  const userEmail = currentUser?.email || '';
  const userRole = currentUser?.cargo || 'Agente Inmobiliario';
  const userAvatar = currentUser?.avatar || defaultAvatar;

  const handleClose = () => {
    setIsClicked(initialState);
  };

  const handleNavigate = (path) => {
    handleClose();
    navigate(path);
  };

  const handleLogout = async () => {
    await authService.logout();
    handleClose();
    navigate('/');
  };

  const menuItems = [
    {
      icon: <FaUser />,
      title: 'Mi Perfil',
      desc: 'Editar información personal',
      iconColor: '#03C9D7',
      iconBg: '#E5FAFB',
      action: () => handleNavigate('/crm/perfil'),
    },
    {
      icon: <FaEnvelope />,
      title: 'Mis Mensajes',
      desc: 'Consultas y mensajes',
      iconColor: 'rgb(0, 194, 146)',
      iconBg: 'rgb(235, 250, 242)',
      action: () => handleNavigate('/crm/consultas'),
    },
    {
      icon: <FaTasks />,
      title: 'Mis Tareas',
      desc: 'Tareas pendientes',
      iconColor: 'rgb(254, 201, 15)',
      iconBg: 'rgb(255, 244, 229)',
      action: () => handleNavigate('/crm/tareas'),
    },
    {
      icon: <FaCog />,
      title: 'Integraciones',
      desc: 'Google Calendar y más',
      iconColor: '#8B5CF6',
      iconBg: '#EDE9FE',
      action: () => handleNavigate('/crm/integraciones'),
    },
  ];

  return (
    <div className="nav-item absolute right-1 top-16 bg-white dark:bg-[#42464D] p-6 rounded-lg w-80 shadow-xl z-50">
      <div className="flex justify-between items-center mb-4">
        <p className="font-semibold text-lg dark:text-gray-200">Mi Cuenta</p>
        <Button
          icon={<MdOutlineCancel />}
          color="rgb(153, 171, 180)"
          bgHoverColor="light-gray"
          size="2xl"
          borderRadius="50%"
          onClick={handleClose}
        />
      </div>
      
      {/* User Info */}
      <div 
        className="flex gap-4 items-center pb-4 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 -mx-2 transition-colors"
        onClick={() => handleNavigate('/crm/perfil')}
      >
        <img
          className="rounded-full h-16 w-16 object-cover border-2"
          src={userAvatar}
          alt="user-profile"
          style={{ borderColor: currentColor }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-lg dark:text-gray-200 truncate">{userName}</p>
          <p className="text-gray-500 text-sm dark:text-gray-400 truncate">{userRole}</p>
          <p className="text-gray-400 text-xs dark:text-gray-500 truncate">{userEmail}</p>
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-2">
        {menuItems.map((item, index) => (
          <div 
            key={index} 
            onClick={item.action}
            className="flex gap-4 items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded-lg transition-colors"
          >
            <div
              style={{ color: item.iconColor, backgroundColor: item.iconBg }}
              className="text-lg rounded-lg p-2.5"
            >
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm dark:text-gray-200">{item.title}</p>
              <p className="text-gray-500 text-xs dark:text-gray-400">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Logout Button */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-600 mt-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-white transition-colors"
          style={{ backgroundColor: currentColor }}
        >
          <FaSignOutAlt /> Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
