import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdSpaceDashboard, MdClose, MdNavigateNext, MdNavigateBefore,
  MdCheckBox, MdCheckBoxOutlineBlank, MdCelebration,
} from 'react-icons/md';
import {
  FaBuilding, FaUsers, FaDollarSign, FaRegCalendarAlt,
  FaEnvelope, FaRobot, FaTrophy, FaPlug, FaFileAlt,
  FaChartBar, FaRocket, FaHandshake,
} from 'react-icons/fa';
import { useStateContext } from '../contexts/ContextProvider';

const ONBOARDING_KEY = 'crm_onboarding_completed';
const ONBOARDING_NEVER_KEY = 'crm_onboarding_never_show';

const tutorialSteps = [
  {
    id: 'welcome',
    phase: 'celebration',
    icon: <MdCelebration />,
    emoji: '🎉',
    title: '¡Bienvenido al CRM!',
    subtitle: 'Tu centro de operaciones está listo',
    description: 'Estamos encantados de tenerte aquí. Te mostraremos las herramientas principales para que puedas sacar el máximo provecho del sistema.',
    color: '#6366f1',
  },
  {
    id: 'dashboard',
    phase: 'guide',
    sidebarItem: 'Dashboard',
    icon: <MdSpaceDashboard />,
    title: 'Dashboard',
    subtitle: 'Tu panel de control',
    description: 'Aquí encontrarás un resumen de toda tu actividad: clientes recientes, citas del día, tareas pendientes, métricas de rendimiento y accesos rápidos a las funciones principales.',
    features: ['Resumen de actividad diaria', 'Métricas de rendimiento', 'Accesos rápidos', 'Citas y tareas del día'],
    color: '#6366f1',
    path: '/crm',
  },
  {
    id: 'propiedades',
    phase: 'guide',
    sidebarItem: 'Propiedades',
    icon: <FaBuilding />,
    title: 'Propiedades',
    subtitle: 'Gestión de inmuebles',
    description: 'Administra todo el catálogo de propiedades disponibles. Filtra por tipo, precio, ubicación y estado. Cada propiedad tiene su ficha completa con fotos, detalles y historial.',
    features: ['Catálogo con filtros avanzados', 'Fichas detalladas con fotos', 'Estados: disponible, reservada, vendida', 'Búsqueda por ubicación y precio'],
    color: '#0ea5e9',
    path: '/crm/propiedades',
  },
  {
    id: 'clientes',
    phase: 'guide',
    sidebarItem: 'Clientes',
    icon: <FaUsers />,
    title: 'Clientes',
    subtitle: 'Tu cartera de contactos',
    description: 'Gestiona toda tu cartera de clientes con datos demográficos, historial de interacciones, preferencias y seguimiento personalizado. Segmenta y organiza para una atención eficiente.',
    features: ['Fichas completas de contacto', 'Historial de interacciones', 'Segmentación y etiquetas', 'Datos demográficos y preferencias'],
    color: '#8b5cf6',
    path: '/crm/clientes',
  },
  {
    id: 'operaciones',
    phase: 'guide',
    sidebarItem: 'Operaciones',
    icon: <FaDollarSign />,
    title: 'Operaciones',
    subtitle: 'Ventas, alquileres y reservas',
    description: 'Registra y da seguimiento a todas las operaciones comerciales. Lleva un control detallado de cada transacción desde el primer contacto hasta el cierre.',
    features: ['Registro de ventas y alquileres', 'Pipeline de operaciones', 'Montos y comisiones', 'Historial por agente y propiedad'],
    color: '#10b981',
    path: '/crm/operaciones',
  },
  {
    id: 'agenda',
    phase: 'guide',
    sidebarItem: 'Agenda',
    icon: <FaRegCalendarAlt />,
    title: 'Agenda',
    subtitle: 'Citas y calendario',
    description: 'Organiza tus visitas, reuniones y eventos en un calendario interactivo. Sincroniza con Google Calendar y recibe recordatorios automáticos para nunca perder una cita.',
    features: ['Calendario interactivo', 'Programar visitas a propiedades', 'Sincronización con Google Calendar', 'Recordatorios automáticos'],
    color: '#f59e0b',
    path: '/crm/citas',
  },
  {
    id: 'consultas',
    phase: 'guide',
    sidebarItem: 'Consultas',
    icon: <FaEnvelope />,
    title: 'Consultas',
    subtitle: 'Bandeja de consultas web',
    description: 'Recibe y gestiona todas las consultas que llegan desde el sitio web. Responde rápidamente, asigna seguimiento y convierte visitantes en clientes.',
    features: ['Consultas web en tiempo real', 'Solicitudes de visita', 'Respuesta rápida', 'Conversión a clientes'],
    color: '#ec4899',
    path: '/crm/consultas',
  },
  {
    id: 'automatizacion',
    phase: 'guide',
    sidebarItem: 'Automatización',
    icon: <FaRobot />,
    title: 'Automatización',
    subtitle: 'Reglas y notificaciones inteligentes',
    description: 'Configura reglas automáticas para recibir alertas de cumpleaños, seguimientos, renovaciones y fechas importantes. El sistema trabaja por vos mientras te enfocas en vender.',
    features: ['Alertas automáticas de cumpleaños', 'Seguimiento de inactividad', 'Recordatorios de renovación', 'Fechas importantes argentinas'],
    color: '#14b8a6',
    path: '/crm/automatizacion',
  },
  {
    id: 'recompensas',
    phase: 'guide',
    sidebarItem: 'Recompensas',
    icon: <FaTrophy />,
    title: 'Recompensas',
    subtitle: 'Gamificación y logros',
    description: 'Gana puntos y desbloquea logros por tu actividad en el CRM. Completa misiones, sube de nivel y celebra tus éxitos con animaciones especiales.',
    features: ['Sistema de puntos y niveles', 'Logros desbloqueables', 'Misiones diarias y semanales', 'Celebraciones animadas'],
    color: '#f59e0b',
    path: '/crm/recompensas',
  },
  {
    id: 'extras',
    phase: 'guide',
    sidebarItem: null,
    icon: <FaPlug />,
    title: 'Y mucho más...',
    subtitle: 'Herramientas complementarias',
    description: 'El CRM también incluye gestión de archivos, plantillas compartidas, reportes de rendimiento e integraciones con Google Calendar y otras herramientas para potenciar tu trabajo.',
    extraItems: [
      { icon: <FaPlug />, name: 'Integraciones', desc: 'Google Calendar y más' },
      { icon: <FaFileAlt />, name: 'Archivos', desc: 'Gestión documental' },
      { icon: <FaChartBar />, name: 'Reportes', desc: 'Métricas y rendimiento' },
    ],
    color: '#64748b',
  },
  {
    id: 'ready',
    phase: 'finale',
    icon: <FaRocket />,
    emoji: '🚀',
    title: '¡Todo listo!',
    subtitle: 'Empezá a trabajar',
    description: 'Ya conocés las funciones principales. Explorá el CRM a tu ritmo y recordá que siempre podés acceder a esta guía desde tu perfil.',
    color: '#10b981',
  },
];

const OnboardingTutorial = () => {
  const { currentColor, screenSize } = useStateContext();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [neverShow, setNeverShow] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const cardRef = useRef(null);
  const isMobile = screenSize <= 900;

  useEffect(() => {
    const never = localStorage.getItem(ONBOARDING_NEVER_KEY);
    if (never === 'true') return undefined;
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      const timer = setTimeout(() => {
        setVisible(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }, 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  const goToStep = useCallback((idx) => {
    setTransitioning(true);
    setTimeout(() => {
      setCurrentStep(idx);
      setTransitioning(false);
      if (cardRef.current) cardRef.current.scrollTop = 0;
    }, 250);
  }, []);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      goToStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  const finishOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    if (neverShow) {
      localStorage.setItem(ONBOARDING_NEVER_KEY, 'true');
    }
    setVisible(false);
    setShowConfetti(false);
  };

  const handleSkip = () => {
    finishOnboarding();
  };

  const handleFinish = () => {
    finishOnboarding();
    // Navigate to dashboard
    navigate('/crm');
  };

  const handleStepClick = (idx) => {
    goToStep(idx);
  };

  if (!visible) return null;

  const step = tutorialSteps[currentStep];
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;
  const isCelebration = step.phase === 'celebration';
  const isFinale = step.phase === 'finale';
  const isGuide = step.phase === 'guide';

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(80)].map((_, i) => (
            <div
              key={i}
              className="ob-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 3}s`,
                backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF9FF3', '#54a0ff', '#5f27cd'][Math.floor(Math.random() * 10)],
                width: `${6 + Math.random() * 8}px`,
                height: `${6 + Math.random() * 8}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              }}
            />
          ))}
        </div>
      )}

      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm ob-fade-in" />

      {/* Main Card */}
      <div
        ref={cardRef}
        className={`
          relative bg-white dark:bg-gray-800 shadow-2xl overflow-y-auto
          ob-card-enter
          ${isMobile
          ? 'w-full h-full rounded-none'
          : 'max-w-2xl w-full mx-4 max-h-[90vh] rounded-3xl'
          }
        `}
      >
        {/* Progress Bar */}
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <div className="h-1 bg-gray-100 dark:bg-gray-700">
            <div
              className="h-full transition-all duration-500 ease-out rounded-r-full"
              style={{ width: `${progress}%`, backgroundColor: step.color || currentColor }}
            />
          </div>
          {/* Step indicators + close */}
          <div className="flex items-center py-3 px-4">
            <div className="flex-1" />
            <div className="flex items-center justify-center gap-1.5">
              {tutorialSteps.map((s, i) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => handleStepClick(i)}
                  className={`
                    transition-all duration-300 rounded-full
                    ${i === currentStep
                    ? 'w-8 h-2.5'
                    : i < currentStep
                      ? 'w-2.5 h-2.5 hover:scale-125'
                      : 'w-2.5 h-2.5 hover:scale-110'
                    }
                  `}
                  style={{
                    backgroundColor: i === currentStep
                      ? (step.color || currentColor)
                      : i < currentStep
                        ? `${step.color || currentColor}80`
                        : '#d1d5db',
                  }}
                  title={s.title}
                />
              ))}
            </div>
            <div className="flex-1 flex justify-end">
              <button
                type="button"
                onClick={handleSkip}
                className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-400 dark:text-gray-500"
                title="Omitir tutorial"
              >
                <MdClose size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={`px-6 sm:px-10 pb-6 transition-all duration-250 ${transitioning ? 'ob-slide-out' : 'ob-slide-in'}`}>

          {/* ---- CELEBRATION / FINALE ---- */}
          {(isCelebration || isFinale) && (
            <div className="text-center py-8 sm:py-12">
              {/* Animated icon */}
              <div className="relative inline-block mb-6">
                <div
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center mx-auto ob-icon-pulse"
                  style={{ backgroundColor: `${step.color}15` }}
                >
                  <span className="text-5xl sm:text-6xl ob-icon-bounce">{step.emoji}</span>
                </div>
                {/* Orbiting particles */}
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="ob-orbit-particle"
                    style={{
                      '--delay': `${i * 0.5}s`,
                      '--color': ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#DDA0DD'][i],
                    }}
                  />
                ))}
              </div>

              <h1
                className="text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight"
                style={{ color: step.color }}
              >
                {step.title}
              </h1>
              <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-4">
                {step.subtitle}
              </p>
              <p className="text-base text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
                {step.description}
              </p>

              {isFinale && (
                <div className="mt-8 flex items-center justify-center gap-3 text-gray-400">
                  <FaHandshake className="text-2xl" style={{ color: step.color }} />
                  <span className="text-sm font-medium">¡Éxito en tu gestión!</span>
                </div>
              )}
            </div>
          )}

          {/* ---- GUIDE STEP ---- */}
          {isGuide && (
            <div className="py-6 sm:py-8">
              {/* Header with icon */}
              <div className="flex items-start gap-4 sm:gap-5 mb-6">
                <div
                  className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white text-2xl sm:text-3xl shadow-lg ob-icon-float"
                  style={{ backgroundColor: step.color }}
                >
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">
                    {step.title}
                  </h2>
                  <p className="text-sm font-medium mt-0.5" style={{ color: step.color }}>
                    {step.subtitle}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                {step.description}
              </p>

              {/* Features list */}
              {step.features && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {step.features.map((feat, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 ob-feature-item"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: step.color }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Extra items for the "extras" step */}
              {step.extraItems && (
                <div className="space-y-3 mb-6">
                  {step.extraItems.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 ob-feature-item"
                      style={{ animationDelay: `${i * 120}ms` }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-lg">
                        {item.icon}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{item.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sidebar preview mockup */}
              {step.sidebarItem && (
                <div className="mt-2 p-4 rounded-2xl bg-gray-900 ob-sidebar-preview">
                  <p className="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wider">Vista del menú</p>
                  <div className="space-y-1">
                    {[
                      { name: 'Dashboard', icon: <MdSpaceDashboard /> },
                      { name: 'Propiedades', icon: <FaBuilding /> },
                      { name: 'Clientes', icon: <FaUsers /> },
                      { name: 'Operaciones', icon: <FaDollarSign /> },
                      { name: 'Agenda', icon: <FaRegCalendarAlt /> },
                      { name: 'Consultas', icon: <FaEnvelope /> },
                      { name: 'Automatización', icon: <FaRobot /> },
                      { name: 'Recompensas', icon: <FaTrophy /> },
                    ].map((m) => {
                      const isHighlighted = m.name === step.sidebarItem;
                      return (
                        <div
                          key={m.name}
                          className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-300
                            ${isHighlighted
                            ? 'text-white shadow-lg ob-highlight-pulse'
                            : 'text-gray-500'
                            }
                          `}
                          style={isHighlighted ? {
                            backgroundColor: step.color,
                            boxShadow: `0 0 0 2px ${step.color}, 0 0 20px ${step.color}50`,
                          } : {}}
                        >
                          <span className="text-base">{m.icon}</span>
                          <span className="font-medium">{m.name}</span>
                          {isHighlighted && (
                            <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">
                              ← Aquí
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t border-gray-100 dark:border-gray-700 px-6 sm:px-10 py-4">
          {/* Never show checkbox */}
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => setNeverShow((v) => !v)}
              className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {neverShow
                ? <MdCheckBox size={18} style={{ color: currentColor }} />
                : <MdCheckBoxOutlineBlank size={18} />}
              <span>No volver a mostrar</span>
            </button>
            <span className="text-xs text-gray-300 dark:text-gray-600 ml-auto">
              {currentStep + 1} / {tutorialSteps.length}
            </span>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <MdNavigateBefore size={20} />
                <span className="hidden sm:inline">Anterior</span>
              </button>
            )}

            <div className="flex-1" />

            {!isFinale && (
              <button
                type="button"
                onClick={handleSkip}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                Omitir
              </button>
            )}

            {isFinale ? (
              <button
                type="button"
                onClick={handleFinish}
                className="flex items-center gap-2 px-8 py-3 rounded-xl text-white font-bold text-sm shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all ob-finish-btn"
                style={{ backgroundColor: step.color }}
              >
                <FaRocket />
                ¡Comenzar!
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1 px-6 py-2.5 rounded-xl text-white font-semibold text-sm shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
                style={{ backgroundColor: step.color || currentColor }}
              >
                <span>Siguiente</span>
                <MdNavigateNext size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTutorial;
