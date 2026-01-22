import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      common: {
        badges: {
          new: "New",
          featured: "Featured",
          lodge: "Lodge",
          residency: "Residency",
        },
        rating: {
          excellent: "Excellent",
        },
        labels: {
          listedOn: "Listed on",
          category: "Category",
        },
        features: {
          bedroom_one: "{{count}} Bedroom",
          bedroom_other: "{{count}} Bedrooms",
          bathroom_one: "{{count}} Bath",
          bathroom_other: "{{count}} Baths",
          squareFeet: "{{value}} Sq Ft",
        },
        buttons: {
          bookNow: "Book Now",
          subscribe: "Subscribe",
        },
        placeholders: {
          email: "Enter Email Address",
        },
        reviewSummary: "{{rating}} ({{total}} Reviews)",
      },
      home: {
        banner: {
          title: "Find Your Best Dream House for Rental, Buy & Sell...",
          subtitle:
            "Properties for buy / rent in in your location. We have more than 3000+ listings for you to choose",
          tabs: {
            buy: "Buy Property",
            rent: "Rent Property",
          },
          fields: {
            keyword: "Keyword",
            propertyType: "Property Type",
            address: "Address",
            minPrice: "Min Price",
            maxPrice: "Max Price",
          },
        },
        work: {
          title: "How It Works",
          subtitle: "Follow these 3 steps to book your place",
          steps: {
            search: {
              title: "01. Search for Location",
              description:
                "Find properties by location quickly, matching your lifestyle and preferences easily.",
            },
            select: {
              title: "02. Select Property Type",
              description:
                "Choose your ideal property type easily, from apartments to villas.",
            },
            book: {
              title: "03. Book Your Property",
              description:
                "Secure your dream property quickly with a simple, hassle-free booking process.",
            },
          },
        },
        buySection: {
          buy: "Buy a Property",
          sell: "Sell a Property",
          rent: "Rent a Property",
        },
        propertySection: {
          title: "Explore by <0>Property Type</0>",
          subtitle:
            "Whether you're looking for a cozy apartment, a luxurious villa, or a commercial investment, we’ve got you covered.",
          cards: {
            houses: "Houses",
            offices: "Offices",
            villas: "Villas",
            apartment: "Apartment",
            properties: "Properties",
          },
        },
        cities: {
          title: "Cities With Listing",
          subtitle: "Destinations we love the most",
          properties: "Properties",
        },
        agent: {
          title: "Become a Real Estate Agent",
          subtitle:
            "At Dream Estate, we provide the tools, training, and support you need to succeed in the competitive real estate market.",
          cta: "Register Now",
        },
        blog: {
          title: "Latest Blog",
          subtitle:
            "Explore our featured blog posts on premium properties for sales & rents.",
          categories: {
            property: "Property",
            villa: "Villa",
            warehouse: "Warehouse",
          },
          cards: {
            oneTitle: "Location is Everything",
            oneDescription:
              "The value of a property largely depends on where it’s located.",
            twoTitle: "Real Estate is an Investment",
            twoDescription:
              "Unlike stocks, real estate usually grows in value over time.",
            threeTitle: "Market Trends Matter",
            threeDescription:
              "Staying informed about housing market trends helps you make smarter decisions.",
          },
          exploreAll: "Explore All",
        },
        plan: {
          title: "Pricing & Subscriptions",
          subtitle: "Check out our packages and choose wisely.",
          tabs: {
            yearly: "Yearly",
            monthly: "Monthly",
          },
          badge: "Most Popular",
          names: {
            standard: "Standard",
            professional: "Professional",
            enterprise: "Enterprise",
          },
          descriptions: {
            standard:
              "Manage up to 10 listings with essential features for small teams and businesses.",
            professional:
              "Scale to 50 listings with advanced tools ideal for growing teams and agencies.",
            enterprise:
              "Unlimited listings, full API access, priority support, and white-label options.",
          },
          keyFeatures: "Key Features",
          features: {
            listing10: "10 Listing Per Login",
            users100: "Up to 100 Users",
            enquiryListing: "Enquiry on Listing",
            support24: "24 Hrs Support",
            reviewBasic: "Basic Custom Review",
            reportingSimple: "Simple Impact Reporting",
            onboardingQuick: "Quick Onboarding & Account",
            noApi: "No API Access",
            trackingBasic: "Basic Transaction Tracking",
            brandingDreams: "Dreams Estate Branding",
            listing50: "50 Listing Per Login",
            users500: "500+ Active Users",
            enquiryEvery: "Enquiry On Every Listing",
            supportPriority: "Priority 24 Hrs Support",
            reviewAdvanced: "Advanced Custom Review",
            reportingStandard: "Standard Impact Reporting",
            apiPartial: "Partial API Access",
            brandingPartial: "Partial Custom Branding",
            listingUnlimited: "Unlimited Listings Per Login",
            users1000: "1000+ Active Users",
            enquiryEnabled: "Enquiry Enabled On Listings",
            supportDedicated: "Dedicated 24 Hrs Support",
            reviewFull: "Full Custom Review Tools",
            reportingAdvanced: "Advanced Impact Reporting",
            onboardingPersonalized: "Personalized Onboarding & Account",
            apiFull: "Full API Access",
            trackingFull: "Full Transaction Tracking",
            brandingWhite: "White-Label Branding",
          },
          cta: "Get a Quote",
        },
        featuresSection: {
          title: "Featured Properties for Sales",
          subtitle: "Hand-picked selection of quality places",
          property1: {
            title: "Luxury Apartment with City View",
            location: "New York, USA",
            listedOn: "28 Apr 2025",
            category: "Apartment",
          },
          property2: {
            title: "Modern Family House",
            location: "Los Angeles, USA",
            listedOn: "29 Apr 2025",
            category: "House",
          },
          property3: {
            title: "Spacious Condo in Downtown",
            location: "Chicago, USA",
            listedOn: "30 Apr 2025",
            category: "Condo",
          },
          property4: {
            title: "Elegant Villa with Garden",
            location: "Miami, USA",
            listedOn: "01 May 2025",
            category: "Villa",
          },
          property5: {
            title: "Cozy Studio near the Beach",
            location: "San Diego, USA",
            listedOn: "02 May 2025",
            category: "Studio",
          },
        },
        featuresTwoSection: {
          title: "Featured Properties for Rent",
          subtitle: "Hand-picked selection of quality places",
          perNight: "/ Night",
        },
        invoice: {
          breadcrumb: {
            title: "Invoice",
            label: "Invoice",
          },
          title: "INVOICE",
          number: "Invoice Number",
          date: "Invoice Date",
          dueDate: "Due Date",
          receiptant: "Only For Receiptant",
          from: "From",
          to: "To",
          company: "Dreams Estate",
          registration: "Reg",
          email: "Email",
          mobile: "Mobile",
          table: {
            number: "#",
            description: "Description",
            quantity: "Qty",
            price: "Price",
            gst: "GST",
            amount: "Amount",
            productName: "Product Name",
          },
          subtotal: "Sub Total (excl. GST)",
          totalGst: "Total GST",
          cardFee: "Credit Card Fee (if using)",
          totalItems: "Total Items / Qty",
          totalAmountInWords: "Total amount ( in words)",
          paymentInstructions: "PAYMENT INSTRUCTIONS",
          bankName: "Bank Name",
          swift: "SWIFT/IBAN",
          accountNumber: "Account Number",
          payOnline: "Pay Online",
        },
      },
      agentDetails: {
        breadcrumbTitle: "Agent Details",
        buttons: {
          whatsapp: "WhatsApp",
          callMe: "Call Me",
        },
        info: {
          memberSince: "Member Since",
          agentLicense: "Agent License",
          taxNumber: "Tax Number",
        },
        about: {
          title: "About",
          paragraph1:
            "With generous frontage on a paved county road and all necessary utilities at the boundary, you can build your dream cabin, homestead, or weekend getaway with ease. Imagine sipping your morning coffee on a wrap-around porch as mist drifts through the valley below, or gathering around a firepit under a canopy of stars.",
          paragraph2:
            "Imagine sipping your morning coffee on a wrap-around porch as mist drifts through the valley below, or gathering around a firepit under a canopy of stars.",
          readMore: "Read More",
        },
        serviceAreas: {
          title: "Service Areas",
        },
        specialities: {
          title: "Specialities",
          propertyManagement: "Property Management",
          realEstateManagement: "Real Estate Management",
          realEstateAppraising: "Real Estate Appraising",
          apartmentBrokerage: "Apartment Brokerage",
        },
        listing: {
          title: "My Listing",
          allProperties: "All Properties ({{count}})",
          apartment: "Apartment",
          condos: "Condos",
          home: "Home",
        },
        searchModal: {
          title: "What Are You Looking for?",
          keywordPlaceholder: "Type a Keyword....",
          popularProperties: "Popular Properties",
          properties: {
            beautifulCondoRoom: "Beautiful Condo Room",
            royalApartment: "Royal Apartment",
            grandVillaHouse: "Grand Villa House",
            grandMahaka: "Grand Mahaka",
            lunariaResidence: "Lunaria Residence",
            stephenAlexanderHomes: "Stephen Alexander Homes",
          },
        },
        sidebar: {
          enquiryTitle: "Enquiry",
          namePlaceholder: "Your Name",
          emailPlaceholder: "Your Email",
          phonePlaceholder: "Your Phone Number",
          messagePlaceholder: "Yes, I’m Interested",
          sendEmail: "Send Email",
          contactTitle: "Contact",
          callUs: "Call Us",
          mobile: "Mobile",
          fax: "Fax",
          website: "Website",
          address: "Address",
          email: "Email",
          shareProperty: "Share Property",
        },
      },
    },
  },
  es: {
    translation: {
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
          subtitle: "Recibí novedades, actualizaciones y ofertas especiales。",
        },
        contactUs: {
          breadcrumb: {
            title: "Contactanos",
            label: "Contactanos",
          },
          sales: {
            title: "Hablá con un miembro del equipo de ventas",
            description: "Conectate con nuestro equipo experto de ventas para recibir guía personalizada, insights sobre propiedades y soporte adaptado a tus necesidades inmobiliarias。",
            phone: "Llamada gratuita: 888 634-5891",
          },
          support: {
            title: "Soporte de Producto y Cuenta",
            description: "Recibí ayuda dedicada con tu cuenta, características y servicios a través de nuestro equipo experto de Soporte de Producto y Cuenta。",
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
      // Auth common
      'Hey There! Welcome Back': '¡Hola! Bienvenido de nuevo',
      'Sign Up! For New Account': 'Registrate para crear una cuenta nueva',
      Name: 'Nombre',
      Email: 'Email',
      Password: 'Contraseña',
      'Confirm Password': 'Confirmar contraseña',
      'Enter Name': 'Ingresá tu nombre',
      'Enter your email': 'Ingresá tu email',
      'Remember Me': 'Recordarme',
      'Forgot Password?': '¿Olvidaste tu contraseña?',
      'Reset Password': 'Restablecer contraseña',
      'Return to': 'Volver a',
      'Sign In': 'Iniciar sesión',
      'Register': 'Registrarse',
      'Sign Up': 'Crear cuenta',
      OR: 'O',
      Facebook: 'Facebook',
      Google: 'Google',
      "Don’t have an account yet?": '¿Todavía no tenés cuenta?',

      // Header / comunes
      Search: 'Buscar',
      'Light Mode': 'Modo claro',
      'Dark Mode': 'Modo oscuro',
      Light: 'Claro',
      Notifications: 'Notificaciones',
      'Mark as Read': 'Marcar como leído',
      'Delete All': 'Eliminar todo',
      'View All': 'Ver todo',
      'Profile Settings': 'Configuración de perfil',
      'Help & Support': 'Ayuda y soporte',
      Settings: 'Configuración',
      'Sign Out': 'Cerrar sesión',
      'Post Property': 'Publicar propiedad',

      // Menú principal (navbar)
      Home: 'Inicio',
      Listing: 'Listado',
      Agent: 'Agentes',
      Agency: 'Agencias',
      Pages: 'Páginas',
      Blog: 'Blog',

      // Variantes de home
      'Home 1': 'Inicio 1',
      'Home 2': 'Inicio 2',
      'Home 3': 'Inicio 3',

      // Listados de compra
      'Buy Property': 'Comprar propiedad',
      'Buy Grid': 'Comprar - grilla',
      'Buy List': 'Comprar - lista',
      'Buy Grid with Sidebar': 'Comprar - grilla con sidebar',
      'Buy List with Sidebar': 'Comprar - lista con sidebar',
      'Buy Grid with map': 'Comprar - grilla con mapa',
      'Buy List with map': 'Comprar - lista con mapa',
      'Buy Details': 'Detalle de compra',

      // Listados de alquiler
      'Rent Property': 'Alquilar propiedad',
      'Rent Grid': 'Alquilar - grilla',
      'Rent List': 'Alquilar - lista',
      'Rent Grid with Sidebar': 'Alquilar - grilla con sidebar',
      'Rent List with Sidebar': 'Alquilar - lista con sidebar',
      'Rent Grid with map': 'Alquilar - grilla con mapa',
      'Rent List with map': 'Alquilar - lista con mapa',
      'Rent Details': 'Detalle de alquiler',

      // Agentes
      'Agent Grid': 'Agentes - grilla',
      'Agent List': 'Agentes - lista',
      'Agent Grid with Sidebar': 'Agentes - grilla con sidebar',
      'Agent List with Sidebar': 'Agentes - lista con sidebar',
      'Agent Details': 'Detalle de agente',

      // Agencias
      'Agency Grid': 'Agencias - grilla',
      'Agency List': 'Agencias - lista',
      'Agency Grid with Sidebar': 'Agencias - grilla con sidebar',
      'Agency List with Sidebar': 'Agencias - lista con sidebar',
      'Agency Details': 'Detalle de agencia',

      Authentication: 'Autenticación',
      'Forgot Password': 'Olvidé mi contraseña',
      'Invoice Details': 'Detalle de factura',
      'Error Page': 'Página de error',
      'Error 404': 'Error 404',
      'Error 500': 'Error 500',

      'Blog List': 'Blog - lista',
      'Blog Grid': 'Blog - grilla',
      'Blog Details': 'Detalle de blog',

      English: 'Inglés',
      German: 'Alemán',
      French: 'Francés',
      Arabic: 'Árabe',

      'Jafna Cremson': 'Jafna Cremson',
      Administrator: 'Administrador',
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    lng: 'es',
    supportedLngs: ['en', 'es'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: [],
      caches: [],
    },
  });

i18n.changeLanguage('es');

export default i18n;
