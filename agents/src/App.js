import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Navbar, Footer, Sidebar, ThemeSettings, Celebration, OnboardingTutorial } from './components';
import { AgentDashboard, Propiedades, ClientesCRM, Citas, Tareas, Ventas, Documentos, Plantillas, Reportes, Integraciones, Consultas, MiPerfil, Recompensas, Automatizacion, FechasImportantes, EditorImagenes } from './pages';
import LoginAgente from './pages/LoginAgente';
import './App.css';

import { useStateContext } from './contexts/ContextProvider';
import { isApiUnavailableError } from './config/api';
import { authService } from './services/authService';

const RequireAuth = ({ children }) => {
  const location = useLocation();

  if (!authService.isAuthenticated()) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

const CrmLayout = () => {
  const { currentMode, themeSettings } = useStateContext();

  return (
    <div className={currentMode === 'Dark' ? 'dark' : ''}>
      <div className="flex relative dark:bg-main-dark-bg">
        <Sidebar />
        <div
          className="bg-main-bg dark:bg-main-dark-bg min-h-screen w-full transition-all duration-300 ease-in-out"
        >
          <div className="bg-main-bg dark:bg-main-dark-bg navbar w-full">
            <Navbar />
          </div>
          <div className="pt-16 md:pt-0 pb-20 md:pb-0">
            {themeSettings && (<ThemeSettings />)}
            <Outlet />
          </div>
          <Footer />
        </div>
      </div>
      <Celebration />
      <OnboardingTutorial />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover theme={currentMode === 'Dark' ? 'dark' : 'light'} />
    </div>
  );
};

const App = () => {
  const { setCurrentColor, setCurrentMode } = useStateContext();

  useEffect(() => {
    const currentThemeColor = localStorage.getItem('colorMode');
    const currentThemeMode = localStorage.getItem('themeMode');
    if (currentThemeColor && currentThemeMode) {
      setCurrentColor(currentThemeColor);
      setCurrentMode(currentThemeMode);
    }
  }, [setCurrentColor, setCurrentMode]);

  // Handle online/offline status
  useEffect(() => {
    const updateOnlineStatus = async (online) => {
      const user = authService.getCurrentUser();
      if (user && user.role === 'agent' && authService.isAuthenticated()) {
        try {
          const { api } = await import('./config/api');
          await api.put('/crm/messages/status/online', { online });
        } catch (err) {
          if (isApiUnavailableError(err)) return;
          console.error('Error updating online status:', err);
        }
      }
    };

    // Set online when page loads/becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateOnlineStatus(true);
      }
    };

    // Set online when component mounts
    if (authService.isAuthenticated()) {
      updateOnlineStatus(true);
    }

    // Periodic heartbeat to maintain online status
    const heartbeatInterval = setInterval(() => {
      if (!document.hidden && authService.isAuthenticated()) {
        updateOnlineStatus(true);
      }
    }, 60000); // Update every minute

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(heartbeatInterval);
    };
  }, []);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<LoginAgente />} />

        <Route path="/propiedades" element={<Navigate to="/crm/propiedades" replace />} />
        <Route path="/clientes" element={<Navigate to="/crm/clientes" replace />} />
        <Route path="/citas" element={<Navigate to="/crm/citas" replace />} />
        <Route path="/tareas" element={<Navigate to="/crm/tareas" replace />} />
        <Route path="/operaciones" element={<Navigate to="/crm/operaciones" replace />} />
        <Route path="/documentos" element={<Navigate to="/crm/archivos" replace />} />
        <Route path="/archivos" element={<Navigate to="/crm/archivos" replace />} />
        <Route path="/plantillas" element={<Navigate to="/crm/plantillas" replace />} />
        <Route path="/reportes" element={<Navigate to="/crm/reportes" replace />} />
        <Route path="/consultas" element={<Navigate to="/crm/consultas" replace />} />
        <Route path="/integraciones" element={<Navigate to="/crm/integraciones" replace />} />

        <Route
          path="/crm"
          element={(
            <RequireAuth>
              <CrmLayout />
            </RequireAuth>
          )}
        >
          {/* Home del agente */}
          <Route index element={<AgentDashboard />} />

          {/* Módulos principales que usa el agente */}
          <Route path="propiedades" element={<Propiedades />} />
          <Route path="clientes" element={<ClientesCRM />} />
          <Route path="citas" element={<Citas />} />
          <Route path="tareas" element={<Tareas />} />
          <Route path="operaciones" element={<Ventas />} />
          <Route path="documentos" element={<Navigate to="/crm/archivos" replace />} />
          <Route path="archivos" element={<Documentos />} />
          <Route path="plantillas" element={<Plantillas />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="consultas" element={<Consultas />} />
          <Route path="integraciones" element={<Integraciones />} />
          <Route path="perfil" element={<MiPerfil />} />
          <Route path="recompensas" element={<Recompensas />} />
          <Route path="automatizacion" element={<Automatizacion />} />
          <Route path="fechas-importantes" element={<FechasImportantes />} />
          <Route path="editor-imagenes" element={<EditorImagenes />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
