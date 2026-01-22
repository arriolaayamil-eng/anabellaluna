type TranslationNode = string | { [key: string]: TranslationNode };

const translations: TranslationNode = {
  common: {
    badges: {
      new: "Nuevo",
      featured: "Destacado",
      lodge: "Hospedaje",
      residency: "Residencia",
    },
    rating: {
      excellent: "Excelente",
    },
    labels: {
      listedOn: "Publicado el",
      category: "Categoría",
    },
    features: {
      bedroom_one: "{{count}} dormitorio",
      bedroom_other: "{{count}} dormitorios",
      bathroom_one: "{{count}} baño",
      bathroom_other: "{{count}} baños",
      squareFeet: "{{value}} pies²",
    },
    buttons: {
      bookNow: "Reservar ahora",
      subscribe: "Suscribirme",
    },
    placeholders: {
      email: "Ingresá tu email",
    },
    reviewSummary: "{{rating}} ({{total}} reseñas)",
  },
  home: {
    banner: {
      title: "tu casa en la playa",
      subtitle:
        "Propiedades para comprar o alquilar en tu zona. Tenemos más de 3000 publicaciones para vos.",
      tabs: {
        buy: "Comprar propiedad",
        rent: "Alquilar propiedad",
      },
      fields: {
        keyword: "Palabra clave",
        propertyType: "Tipo de propiedad",
        address: "Dirección",
        minPrice: "Precio mínimo",
        maxPrice: "Precio máximo",
      },
    },
    work: {
      title: "Cómo funciona",
      subtitle: "Seguí estos 3 pasos para reservar tu lugar",
      steps: {
        search: {
          title: "01. Buscá por ubicación",
          description:
            "Encontrá propiedades por zona de manera rápida, acorde a tu estilo de vida y preferencias.",
        },
        select: {
          title: "02. Elegí el tipo de propiedad",
          description:
            "Seleccioná fácilmente tu tipo de propiedad ideal, desde departamentos hasta casas o chacras.",
        },
        book: {
          title: "03. Reservá tu propiedad",
          description:
            "Asegurá la propiedad de tus sueños con un proceso simple y sin vueltas.",
        },
      },
    },
    buySection: {
      buy: "Comprar una propiedad",
      sell: "Vender una propiedad",
      rent: "Alquilar una propiedad",
    },
    propertySection: {
      title: "Explorá por <0>tipo de propiedad</0>",
      subtitle:
        "Ya sea que busques un departamento, una casa de lujo o una inversión comercial, lo tenemos.",
      cards: {
        houses: "Casas",
        offices: "Oficinas",
        villas: "Villas",
        apartment: "Departamento",
        properties: "Propiedades",
      },
    },
    cities: {
      title: "Ciudades con publicaciones",
      subtitle: "Destinos que más nos gustan",
      properties: "Propiedades",
    },
    agent: {
      title: "Convertite en agente inmobiliario",
      subtitle:
        "En Dream Estate te damos las herramientas, el entrenamiento y el soporte para destacarte en el mercado.",
      cta: "Registrarme",
    },
    blog: {
      title: "Últimos artículos",
      subtitle:
        "Descubrí nuestras notas destacadas sobre propiedades premium en venta y alquiler.",
      categories: {
        property: "Propiedad",
        villa: "Villa",
        warehouse: "Depósito",
      },
      cards: {
        oneTitle: "La ubicación lo es todo",
        oneDescription:
          "El valor de una propiedad depende en gran parte de dónde está situada.",
        twoTitle: "El real estate es una inversión",
        twoDescription:
          "A diferencia de otras opciones, el valor de los inmuebles suele crecer con el tiempo.",
        threeTitle: "Las tendencias importan",
        threeDescription:
          "Seguir los movimientos del mercado inmobiliario te ayuda a tomar mejores decisiones.",
      },
      exploreAll: "Ver todo",
    },
    plan: {
      title: "Planes y suscripciones",
      subtitle: "Conocé nuestros paquetes y elegí el que mejor se adapte a vos.",
      tabs: {
        yearly: "Anual",
        monthly: "Mensual",
      },
      badge: "Más popular",
      names: {
        standard: "Standard",
        professional: "Professional",
        enterprise: "Enterprise",
      },
      descriptions: {
        standard:
          "Administrá hasta 10 publicaciones con funciones esenciales para equipos chicos.",
        professional:
          "Escalá hasta 50 publicaciones con herramientas avanzadas ideales para equipos en crecimiento.",
        enterprise:
          "Publicaciones ilimitadas, acceso API completo, soporte prioritario y opciones white-label.",
      },
      keyFeatures: "Características clave",
      features: {
        listing10: "10 publicaciones por acceso",
        users100: "Hasta 100 usuarios",
        enquiryListing: "Consultas en la publicación",
        support24: "Soporte 24 hs",
        reviewBasic: "Reseñas personalizadas básicas",
        reportingSimple: "Reportes de impacto simples",
        onboardingQuick: "Onboarding y cuenta rápidos",
        noApi: "Sin acceso API",
        trackingBasic: "Seguimiento básico de transacciones",
        brandingDreams: "Branding Dreams Estate",
        listing50: "50 publicaciones por acceso",
        users500: "Más de 500 usuarios activos",
        enquiryEvery: "Consultas en cada publicación",
        supportPriority: "Soporte prioritario 24 hs",
        reviewAdvanced: "Reseñas personalizadas avanzadas",
        reportingStandard: "Reportes de impacto estándar",
        apiPartial: "Acceso API parcial",
        brandingPartial: "Branding parcial personalizado",
        listingUnlimited: "Publicaciones ilimitadas por acceso",
        users1000: "Más de 1000 usuarios activos",
        enquiryEnabled: "Consultas habilitadas en las publicaciones",
        supportDedicated: "Soporte dedicado 24 hs",
        reviewFull: "Herramientas completas de reseñas",
        reportingAdvanced: "Reportes de impacto avanzados",
        onboardingPersonalized: "Onboarding y cuenta personalizados",
        apiFull: "Acceso API completo",
        trackingFull: "Seguimiento total de transacciones",
        brandingWhite: "Branding white-label",
      },
      cta: "Solicitar presupuesto",
    },
    featuresSection: {
      title: "Propiedades destacadas en venta",
      subtitle: "Selección cuidada de lugares de calidad",
      property1: {
        title: "Departamento de lujo con vista a la ciudad",
        location: "Nueva York, EE.UU.",
        listedOn: "28 Abr 2025",
        category: "Departamento",
      },
      property2: {
        title: "Casa familiar moderna",
        location: "Los Ángeles, EE.UU.",
        listedOn: "29 Abr 2025",
        category: "Casa",
      },
      property3: {
        title: "Espacioso departamento en el centro",
        location: "Chicago, EE.UU.",
        listedOn: "30 Abr 2025",
        category: "Departamento",
      },
      property4: {
        title: "Villa elegante con jardín",
        location: "Miami, EE.UU.",
        listedOn: "01 May 2025",
        category: "Villa",
      },
      property5: {
        title: "Estudio acogedor cerca de la playa",
        location: "San Diego, EE.UU.",
        listedOn: "02 May 2025",
        category: "Estudio",
      },
    },
    featuresTwoSection: {
      title: "Propiedades destacadas en alquiler",
      subtitle: "Selección cuidada de lugares de calidad",
      perNight: "/ noche",
    },
    stat: {
      listings: "Publicaciones agregadas",
      agents: "Agentes publicados",
      sales: "Ventas concretadas",
      users: "Usuarios",
    },
    support: {
      title: "Suscribite a nuestro newsletter",
      subtitle: "Recibí novedades, actualizaciones y ofertas especiales.",
    },
    contactUs: {
      breadcrumb: {
        title: "Contactanos",
        label: "Contactanos",
      },
      sales: {
        title: "Hablá con un miembro del equipo de ventas",
        description:
          "Conectate con nuestro equipo experto de ventas para recibir guía personalizada, insights sobre propiedades y soporte adaptado a tus necesidades inmobiliarias.",
        phone: "Llamada gratuita: 888 634-5891",
      },
      support: {
        title: "Soporte de Producto y Cuenta",
        description:
          "Recibí ayuda dedicada con tu cuenta, características y servicios a través de nuestro equipo experto de Soporte de Producto y Cuenta.",
        goToFaq: "Ir a FAQ",
      },
      info: {
        email: {
          title: "Dirección de Email",
        },
        phone: {
          title: "Número de Teléfono",
        },
        address: {
          title: "Dirección",
        },
      },
      form: {
        title: "Contactanos",
        name: "Tu Nombre",
        phone: "Número de Teléfono",
        email: "Email",
        country: "País",
        subject: "Asunto",
        description: "Descripción",
        commentsPlaceholder: "Comentarios",
        submit: "Enviar Consulta",
      },
    },
    invoice: {
      breadcrumb: {
        title: "Factura",
        label: "Factura",
      },
      title: "FACTURA",
      number: "Número de Factura",
      date: "Fecha de Factura",
      dueDate: "Fecha de Vencimiento",
      receiptant: "Solo para el Receptor",
      from: "De",
      to: "Para",
      company: "Dreams Estate",
      registration: "Reg",
      email: "Email",
      mobile: "Móvil",
      table: {
        number: "#",
        description: "Descripción",
        quantity: "Cant",
        price: "Precio",
        gst: "IVA",
        amount: "Monto",
        productName: "Nombre del Producto",
      },
      subtotal: "Subtotal (sin IVA)",
      totalGst: "Total IVA",
      cardFee: "Tarjeta de Crédito (si se usa)",
      totalItems: "Total de Artículos / Cant",
      totalAmountInWords: "Monto total (en palabras)",
      paymentInstructions: "INSTRUCCIONES DE PAGO",
      bankName: "Nombre del Banco",
      swift: "SWIFT/IBAN",
      accountNumber: "Número de Cuenta",
      payOnline: "Pagar Online",
    },
  },
  agentDetails: {
    breadcrumbTitle: "Detalle de Agente",
    buttons: {
      whatsapp: "WhatsApp",
      callMe: "Llamame",
    },
    info: {
      memberSince: "Miembro desde",
      agentLicense: "Licencia de agente",
      taxNumber: "Nº de impuesto",
    },
    about: {
      title: "Acerca de",
      paragraph1:
        "Con frentes generosos sobre una ruta pavimentada y todos los servicios necesarios en el límite, podés construir tu cabaña de ensueño, tu hogar o tu escapada de fin de semana con facilidad.",
      paragraph2:
        "Imaginá tomar tu café de la mañana en una galería envolvente mientras la neblina atraviesa el valle, o reunirte alrededor del fogón bajo un cielo estrellado.",
      readMore: "Ver más",
    },
    serviceAreas: {
      title: "Áreas de servicio",
    },
    specialities: {
      title: "Especialidades",
      propertyManagement: "Administración de propiedades",
      realEstateManagement: "Gestión inmobiliaria",
      realEstateAppraising: "Tasación inmobiliaria",
      apartmentBrokerage: "Intermediación de departamentos",
    },
    listing: {
      title: "Mis publicaciones",
      allProperties: "Todas las propiedades ({{count}})",
      apartment: "Departamento",
      condos: "Condominios",
      home: "Casa",
    },
    searchModal: {
      title: "¿Qué estás buscando?",
      keywordPlaceholder: "Ingresá una palabra clave...",
      popularProperties: "Propiedades populares",
      properties: {
        beautifulCondoRoom: "Condominio elegante",
        royalApartment: "Departamento Real",
        grandVillaHouse: "Gran casa estilo villa",
        grandMahaka: "Grand Mahaka",
        lunariaResidence: "Residencia Lunaria",
        stephenAlexanderHomes: "Stephen Alexander Homes",
      },
    },
    sidebar: {
      enquiryTitle: "Consulta",
      namePlaceholder: "Tu nombre",
      emailPlaceholder: "Tu email",
      phonePlaceholder: "Tu teléfono",
      messagePlaceholder: "Sí, estoy interesado",
      sendEmail: "Enviar email",
      contactTitle: "Contacto",
      callUs: "Llamanos",
      mobile: "Móvil",
      fax: "Fax",
      website: "Sitio web",
      address: "Dirección",
      email: "Email",
      shareProperty: "Compartir propiedad",
    },
  },
  contact: {
    sales: {
      phone: "Llamada gratuita: 888 634-5891",
    },
  },
  Search: "Buscar",
  "Light Mode": "Modo claro",
  "Dark Mode": "Modo oscuro",
  Light: "Claro",
  Notifications: "Notificaciones",
  "Mark as Read": "Marcar como leído",
  "Delete All": "Eliminar todo",
  "View All": "Ver todo",
  "Profile Settings": "Configuración de perfil",
  "Help & Support": "Ayuda y soporte",
  Settings: "Configuración",
  "Sign Out": "Cerrar sesión",
  "Post Property": "Publicar propiedad",
  Home: "Inicio",
  Listing: "Listado",
  Agent: "Agentes",
  Agency: "Agencias",
  Pages: "Páginas",
  Blog: "Blog",
  "Home 1": "Inicio 1",
  "Home 2": "Inicio 2",
  "Home 3": "Inicio 3",
  "Buy Property": "Comprar propiedad",
  "Buy Grid": "Comprar - grilla",
  "Buy List": "Comprar - lista",
  "Buy Grid with Sidebar": "Comprar - grilla con sidebar",
  "Buy List with Sidebar": "Comprar - lista con sidebar",
  "Buy Grid with map": "Comprar - grilla con mapa",
  "Buy List with map": "Comprar - lista con mapa",
  "Buy Details": "Detalle de compra",
  "Rent Property": "Alquilar propiedad",
  "Rent Grid": "Alquilar - grilla",
  "Rent List": "Alquilar - lista",
  "Rent Grid with Sidebar": "Alquilar - grilla con sidebar",
  "Rent List with Sidebar": "Alquilar - lista con sidebar",
  "Rent Grid with map": "Alquilar - grilla con mapa",
  "Rent List with map": "Alquilar - lista con mapa",
  "Rent Details": "Detalle de alquiler",
  "Agent Grid": "Agentes - grilla",
  "Agent List": "Agentes - lista",
  "Agent Grid with Sidebar": "Agentes - grilla con sidebar",
  "Agent List with Sidebar": "Agentes - lista con sidebar",
  "Agent Details": "Detalle de agente",
  "Agency Grid": "Agencias - grilla",
  "Agency List": "Agencias - lista",
  "Agency Grid with Sidebar": "Agencias - grilla con sidebar",
  "Agency List with Sidebar": "Agencias - lista con sidebar",
  "Agency Details": "Detalle de agencia",
  "Hey There! Welcome Back": "¡Hola! Bienvenido de nuevo",
  "Sign Up! For New Account": "Registrate para crear una cuenta nueva",
  Name: "Nombre",
  Email: "Email",
  Password: "Contraseña",
  "Confirm Password": "Confirmar contraseña",
  "Enter Name": "Ingresá tu nombre",
  "Enter your email": "Ingresá tu email",
  "Remember Me": "Recordarme",
  "Forgot Password?": "¿Olvidaste tu contraseña?",
  "Forgot Password": "Olvidé mi contraseña",
  "Reset Password": "Restablecer contraseña",
  "Return to": "Volver a",
  "Sign In": "Iniciar sesión",
  Register: "Registrarse",
  "Sign Up": "Crear cuenta",
  OR: "O",
  Facebook: "Facebook",
  Google: "Google",
  "Don’t have an account yet?": "¿Todavía no tenés cuenta?",
  English: "Inglés",
  German: "Alemán",
  French: "Francés",
  Arabic: "Árabe",
  "Jafna Cremson": "Jafna Cremson",
  Administrator: "Administrador",
};

const formatString = (
  template: string,
  params?: Record<string, string | number>
) => {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : "";
  });
};

const getValue = (path: string): TranslationNode | undefined => {
  const parts = path.split(".");
  let current: TranslationNode = translations;
  for (const part of parts) {
    if (typeof current !== "object" || current === null) {
      return undefined;
    }
    current = current[part];
    if (current === undefined) return undefined;
  }
  return current;
};

const translate = (key: string, params?: Record<string, string | number>) => {
  const result = getValue(key);
  if (typeof result === "string") {
    return formatString(result, params);
  }
  return key;
};

export const useCopy = () => ({
  t: translate,
});
