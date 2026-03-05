# Frontend – Lista de Tareas de Integración con Datos Reales

> **Objetivo:** Reemplazar TODOS los datos mock/hardcoded en el sitio público (`frontend/`) por datos reales de la base de datos (MongoDB/MinIO), sin romper la UI.

> **Convención:** ✅ = ya integrado | ❌ = usa datos mock/hardcoded | 🔧 = parcialmente integrado

---

## Estado Actual de los Services (Backend ↔ Frontend)

| Endpoint backend | Service frontend | Estado |
|---|---|---|
| `GET /public/properties` | `publicService.getProperties()` | ✅ Existe |
| `GET /public/properties/:slug` | `publicService.getPropertyBySlug()` | ✅ Existe |
| `POST /public/enquiries` | `publicService.createEnquiry()` | ✅ Existe |
| `POST /public/visits` | `publicService.scheduleVisit()` | ✅ Existe |
| `GET/POST/DELETE /public/cart` | `publicService.getCart/addToCart/clearCart` | ✅ Existe |
| `GET/POST/DELETE /public/wishlist` | `publicService.getWishlist/addToWishlist/removeWishlistItem` | ✅ Existe |
| `POST /public/bookings` | `publicService.createBookingRequest()` | ✅ Existe |
| `GET /public/blog/categories` | `publicService.getBlogCategories()` | ✅ Existe |
| `GET /public/blog/posts` | `publicService.getBlogPosts()` | ✅ Existe |
| `GET /public/blog/posts/:slug` | `publicService.getBlogPostBySlug()` | ✅ Existe |
| `GET /public/agents` | **NO EXISTE** | ❌ Falta crear |
| `GET /public/agents/:id` | **NO EXISTE** | ❌ Falta crear |
| `GET /public/stats` | **NO EXISTE** | ❌ Falta crear |
| `GET /public/cities` | **NO EXISTE** | ❌ Falta crear |
| `GET /public/property-types` | **NO EXISTE** | ❌ Falta crear |
| `GET /public/testimonials` | **NO EXISTE** | ❌ Falta crear |
| `GET /public/faqs` | **NO EXISTE** | ❌ Falta crear |
| `POST /public/contact` | **NO EXISTE** | ❌ Falta crear |
| `GET /public/gallery` | **NO EXISTE** | ❌ Falta crear |

---

## BLOQUE 1 – HOME PAGE (index.tsx)

### T-01: Banner / Hero Section ❌
- **Archivo:** `home/index/banner-section/bannerSections.tsx`
- **Mock data:** Título "Tu casa en la playa", subtítulo "más de 3000 publicaciones" hardcodeados.
- **Dropdown Keyword:** Opciones estáticas `[Buy, Sell]` en `selectOption.tsx`.
- **Dropdown Property_Type:** Opciones estáticas `[Comprar propiedad, Alquilar propiedad]`.
- **Tarea:** Decidir si el banner es contenido estático configurable por admin (GlobalConfig) o se deja estático. Como mínimo, el contador "3000 publicaciones" debe venir del backend (count real de propiedades).
- **Tarea search:** El formulario de búsqueda no envía query params al navegar a la grilla. Conectar los filtros (keyword, tipo, dirección, precio min/max) como query params en la URL de destino y que la grilla los lea.

### T-02: Property Type Section ❌
- **Archivo:** `home/index/property-section/propertySection.tsx`
- **Mock data:** 4 tipos hardcodeados (Casas 30, Oficinas 45, Condominios 28, Departamentos 35).
- **Tarea:** Crear endpoint `GET /public/property-types` que agrupe propiedades por `metadata.tipo` y devuelva nombre + count. Renderizar dinámicamente en el slider.

### T-03: Featured Properties Section ❌
- **Archivo:** `home/index/features-section/featuresSection.tsx` (~1025 líneas)
- **Mock data:** 6+ propiedades con precio, nombre, dirección, camas, baños, m², foto de agente, categoría, fecha — TODO hardcodeado en JSX.
- **Tarea:** Llamar `publicService.getProperties('buy')` filtrando `featured=true`, renderizar con la misma estructura de tarjeta. Eliminar el JSX estático.

### T-04: Cities Section ❌
- **Archivo:** `home/index/cities-section/citiesSection.tsx`
- **Mock data:** 10 ciudades hardcodeadas (Pinamar 300, Villa Gesell 400, Cariló 1450, New York 300, etc.) con imágenes locales.
- **Tarea:** Crear endpoint `GET /public/cities` que agrupe propiedades por `location.city` y devuelva nombre + count + imagen (o imagen por defecto). Renderizar dinámicamente.

### T-05: Statistics Section ❌
- **Archivo:** `home/index/stat-section/statSection.tsx`
- **Mock data:** "50K Listados", "3000+ Agentes", "2000+ Ventas", "5000+ Usuarios" — todo hardcodeado.
- **Tarea:** Crear endpoint `GET /public/stats` que devuelva: total propiedades, total agentes, total operaciones cerradas, total usuarios registrados. Renderizar dinámicamente.

### T-06: Buy/Rent Section ❌ (menor prioridad)
- **Archivo:** `home/index/buy-section/buySection.tsx`
- **Mock data:** 3 tarjetas con imágenes estáticas (Comprar, Comprar, Alquilar).
- **Tarea:** Este es más bien un CTA visual. Se puede dejar estático o hacer que las imágenes vengan de propiedades destacadas. Evaluar.

### T-07: Partners Section ❌ (contenido de marca)
- **Archivo:** `home/index/partners-section/partnersSection.tsx`
- **Mock data:** 7 logos SVG de partners genéricos.
- **Tarea:** Crear modelo `Partner` o usar `GlobalConfig` para que el admin suba logos de socios. O se deja estático si no aplica al negocio.

### T-08: Testimonials Section ❌
- **Archivo:** `home/index/testimonials-section/testimonialsSection.tsx`
- **Mock data:** 5 testimonios hardcodeados con nombre, foto, texto y rating.
- **Tarea:** Crear modelo `Testimonial` + endpoint `GET /public/testimonials`. Admin los gestiona desde ERP. Frontend los renderiza dinámicamente.

### T-09: Pricing/Plan Section ❌ (evaluar si aplica)
- **Archivo:** `home/index/plan-section/planSection.tsx` (624 líneas)
- **Mock data:** 3 planes de precios ($99, $199, $399 mensual + anual) con features listadas.
- **Tarea:** Para una inmobiliaria single-tenant esto probablemente NO aplica. **Evaluar si se elimina o se reemplaza** por otra sección relevante.

### T-10: FAQ Section ❌
- **Archivo:** `home/index/faq-section/faqSection.tsx`
- **Mock data:** 6 preguntas y respuestas hardcodeadas.
- **Tarea:** Crear modelo `FAQ` + endpoint `GET /public/faqs`. O usar `GlobalConfig` para gestionar desde ERP. Si el contenido es estable, puede dejarse estático.

### T-11: Agent CTA Section ✅ (estático, OK)
- **Archivo:** `home/index/agent-section/agentSection.tsx`
- **Contenido:** CTA "Conviértete en Agente" con botón. Es texto estático de marca — no necesita datos de la DB.

### T-12: Blog Section ✅
- **Archivo:** `home/index/blog-section/blogSection.tsx`
- **Ya integrado:** Llama `publicService.getBlogPosts()` y renderiza dinámicamente los últimos 3 posts. El bloque estático antiguo está wrapeado con `{false && (...)}` deshabilitado.

### T-13: Support Section ✅ (estático, OK)
- **Archivo:** `home/index/support-section/`
- **Contenido:** Sección de newsletter/soporte. Texto estático de marca.

### T-14: Work Section ✅ (estático, OK)
- **Archivo:** `home/index/work-section/`
- **Contenido:** "Cómo funciona" con 3 pasos. Texto explicativo estático.

---

## BLOQUE 2 – LISTADOS DE PROPIEDADES

### T-15: Buy Grid Sidebar ❌
- **Archivo:** `listing-modules/buy-property/buy-grid-sidebar/buyGridSidebar.tsx` (1131 líneas)
- **Mock data:** Todas las tarjetas de propiedades en la grilla están hardcodeadas en JSX. Textos "Showing result 06 of 125" hardcodeados.
- **Tarea:** Llamar `publicService.getProperties('buy')`, renderizar dinámicamente. Implementar paginación real. Conectar filtros del sidebar (precio, tipo, ubicación, camas, baños) como query params al endpoint.

### T-16: Buy List Sidebar ❌
- **Archivo:** `listing-modules/buy-property/buy-list-sidebar/`
- **Misma situación** que T-15 pero con layout de lista. Misma tarea.

### T-17: Buy Grid / Buy List / Buy Grid Map / Buy List Map ❌
- **Archivos:** `buy-grid/`, `buy-list/`, `buy-grid-map/`, `buy-list-map/`
- **Misma situación.** Todas usan datos hardcodeados.
- **Tarea:** Reutilizar el mismo fetch de `publicService.getProperties('buy')` en cada variante de layout.

### T-18: Rent Grid Sidebar ❌
- **Archivo:** `listing-modules/rent-property/rent-grid-sidebar/rentGridSidebar.tsx` (1136 líneas)
- **Mock data:** Todas las tarjetas de propiedades de alquiler hardcodeadas.
- **Tarea:** Llamar `publicService.getProperties('rent')`, renderizar dinámicamente. Misma lógica que T-15.

### T-19: Rent List Sidebar / Rent Grid / Rent List / Rent Grid Map / Rent List Map ❌
- **Misma situación.** Todos con datos hardcodeados.

### T-20: Buy Details ✅
- **Archivo:** `listing-modules/buy-property/buy-details/buyDetails.tsx`
- **Ya integrado:** Lee `slug` de la URL, llama `publicService.getPropertyBySlug(slug)`, renderiza dinámicamente (galería, detalles, agente, amenities, etc.).

### T-21: Rent Details ✅
- **Archivo:** `listing-modules/rent-property/rent-details/rentdetails.tsx`
- **Ya integrado:** Misma lógica que buyDetails con slug dinámico.

### T-22: Filter Sidebar (Buy) ❌
- **Archivo:** `listing-modules/buy-property/filter-sidebar/filterSidebar.tsx`
- **Mock data:** Filtros con opciones estáticas en `selectOption.tsx` (Location, BedRoom, BathRoom, Categories, etc.).
- **Tarea:** Las opciones del sidebar deben venir de datos reales: ciudades donde hay propiedades, rangos de precios reales, categorías existentes. Crear endpoints o extraerlos del listado.

### T-23: Rent Filter Sidebar ❌
- **Archivo:** `listing-modules/rent-property/rent-filter-sidebar/`
- **Misma situación** que T-22.

### T-24: Rent Booking Flow 🔧
- **Archivo:** `listing-modules/rent-property/rent-booking/`
- **Tarea:** Verificar que use `publicService.createBookingRequest()` correctamente. Checkout = solicitud de reserva, sin pago.

### T-25: Rent Order Details / Order Confirmation ❌
- **Archivos:** `rent-order-details/`, `rental-order-confirmation/`
- **Tarea:** Deben mostrar datos reales de la reserva creada (booking ID, propiedad, fechas). Conectar con `publicService.getBookings()`.

---

## BLOQUE 3 – AGENTES

### T-26: Agent Grid ❌
- **Archivo:** `listing-modules/agent-module/agent-grid/agentGrid.tsx`
- **Mock data:** Tarjetas de agentes hardcodeadas con nombre, foto, rating, propiedades.
- **Tarea backend:** Crear `GET /public/agents` que liste agentes con nombre, avatar, email, teléfono, especialidad, redes sociales, count de propiedades asignadas.
- **Tarea frontend:** Agregar `getAgents()` a `publicService.ts`. Renderizar dinámicamente.

### T-27: Agent Grid Sidebar / Agent List / Agent List Sidebar ❌
- **Archivos:** `agent-grid-sidebar/`, `agent-list/`, `agent-list-sidebar/`
- **Misma situación.** Todas con datos mock.

### T-28: Agent Details ❌
- **Archivo:** `listing-modules/agent-module/agent-details/agentDetails.tsx`
- **Mock data:** "Milton Rodriguez", "Vihaan Real-estate", rating "5.0 (37)", foto estática.
- **Tarea backend:** Crear `GET /public/agents/:id` que devuelva perfil del agente + sus propiedades.
- **Tarea frontend:** Agregar `getAgentById()` a `publicService.ts`. Pasar `agentId` por params en la ruta. Renderizar dinámicamente.

### T-29: Agent Details – Property Sliders ❌
- **Archivos:** `agent-details/listingSliderProperties.tsx`, `listingSliderApartments.tsx`, `listingSliderCondos.tsx`, `listingSliderHome.tsx`
- **Mock data:** Propiedades del agente hardcodeadas.
- **Tarea:** Filtrar propiedades del agente específico desde el endpoint `GET /public/agents/:id`.

### T-30: Agent Sidebar ❌
- **Archivo:** `agent-details/agentSidebar.tsx`
- **Mock data:** Datos de contacto, redes sociales, horarios hardcodeados.
- **Tarea:** Renderizar desde los datos del agente obtenidos por API.

---

## BLOQUE 4 – AGENCIES

### T-31: Agency Grid / Agency Details / Agency Grid Sidebar / Agency List ❌
- **Archivos:** `listing-modules/agency-module/*`
- **Mock data:** Todo hardcodeado. Para un negocio single-tenant, hay una sola inmobiliaria.
- **Tarea:** Evaluar si se elimina esta sección o se adapta para mostrar la inmobiliaria con su equipo de agentes.

---

## BLOQUE 5 – BLOG

### T-32: Blog Grid ✅
- **Archivo:** `blog-modules/blog-grid/blogGrid.tsx`
- **Ya integrado:** Llama `publicService.getBlogPosts()`, renderiza dinámicamente.

### T-33: Blog Details ✅
- **Archivo:** `blog-modules/blog-details/blogDetails.tsx`
- **Ya integrado:** Llama `publicService.getBlogPostBySlug(slug)`, renderiza dinámicamente.

### T-34: Blog List ❌
- **Archivo:** `blog-modules/blog-list/blogList.tsx`
- **Tarea:** Verificar si está integrado como blogGrid o aún usa datos mock. Si es mock, conectar igual que blogGrid.

---

## BLOQUE 6 – CART, WISHLIST, CHECKOUT

### T-35: Cart ❌
- **Archivo:** `cart/cart.tsx` (335 líneas)
- **Mock data:** "3 Properties" hardcodeado, propiedades con precio/nombre/imagen estáticos, quantity manual sin backend.
- **Tarea:** Llamar `publicService.getCart()`, renderizar items dinámicamente. Agregar remove item, update quantity. Clear cart con `publicService.clearCart()`. Requiere login.

### T-36: Wishlist ❌
- **Archivo:** `pages-modules/wishlist/wishlist.tsx` (916 líneas)
- **Mock data:** ~6 propiedades completamente hardcodeadas (Serenity Condo Suite $21000, Getaway Apartment $1130, etc.).
- **Tarea:** Llamar `publicService.getWishlist()`, renderizar items dinámicamente. Botón remove con `publicService.removeWishlistItem()`. Requiere login.

### T-37: Checkout ❌
- **Archivo:** `pages-modules/checkout/checkout.tsx` (603 líneas)
- **Mock data:** Formulario con Country/State/City estáticos, sin integración con cart ni booking. Tabs de pago (credit/paypal/stripe) que no aplican.
- **Tarea:** Checkout = enviar solicitud de reserva. Prellenar datos del usuario logueado. Mostrar items del cart. Al confirmar, llamar `publicService.createBookingRequest()`. Eliminar flujo de pago (no aplica).

---

## BLOQUE 7 – PÁGINAS ESTÁTICAS / SEMI-ESTÁTICAS

### T-38: About Us ❌ (contenido de marca)
- **Archivo:** `pages-modules/about-us/aboutUs.tsx`
- **Mock data:** Stats hardcodeadas (50K+, 120K+, 3000+, 2000+), texto de misión, equipo.
- **Tarea:** Los stats deben venir de `GET /public/stats`. El resto puede ser contenido estático configurable o se deja fijo.

### T-39: Contact Us ❌
- **Archivo:** `pages-modules/contact-us/contactUs.tsx`
- **Mock data:** Teléfono "888 634-5891", dirección, email — todos genéricos hardcodeados.
- **Tarea backend:** Crear `POST /public/contact` para recibir mensajes del formulario de contacto. Datos de la inmobiliaria (tel, email, dirección) desde `GlobalConfig`.
- **Tarea frontend:** Enviar el formulario al backend. Mostrar datos de contacto reales desde config.

### T-40: Testimonials Page ❌
- **Archivo:** `pages-modules/testimonial/testimonial.tsx` (590 líneas)
- **Mock data:** ~12 testimonios hardcodeados en inglés (no traducidos).
- **Tarea:** Si se crea modelo Testimonial (T-08), esta página también consume `GET /public/testimonials`.

### T-41: Gallery ❌
- **Archivo:** `pages-modules/gallery/gallery.tsx`
- **Mock data:** 15 imágenes estáticas importadas de `public/assets/img/gallery/`.
- **Tarea:** Crear endpoint `GET /public/gallery` que devuelva imágenes de propiedades destacadas o un álbum gestionado por admin. O se puede popular con las cover images de las propiedades.

### T-42: Our Team ❌
- **Archivo:** `pages-modules/our-team/`
- **Mock data:** Datos del equipo hardcodeados.
- **Tarea:** Consumir `GET /public/agents` para mostrar el equipo real.

### T-43: Pricing ❌ (evaluar)
- **Archivo:** `pages-modules/pricing/`
- **Tarea:** Igual que T-09. Evaluar si aplica a una inmobiliaria o se elimina.

### T-44: FAQ Page ❌
- **Archivo:** `pages-modules/faq/`
- **Mock data:** Preguntas hardcodeadas.
- **Tarea:** Consumir mismo endpoint que T-10.

### T-45: Invoice Details ❌
- **Archivo:** `pages-modules/invoice-details/`
- **Tarea:** Conectar con datos reales de booking si aplica.

---

## BLOQUE 8 – AUTH & PROFILE

### T-46: Profile ✅
- **Archivo:** `pages-modules/profile/profile.tsx`
- **Ya integrado:** Usa `userService.refreshUserData()`, muestra datos reales, permite editar y guardar con `userService.updateProfile()`.

### T-47: Sign In / Sign Up / Forgot Password / Reset Password ✅
- **Archivos:** `auth-modules/*`
- **Ya integrado:** Usan `userService.login()`, `userService.registerPublic()`, etc.

---

## BLOQUE 9 – NOTIFICATION

### T-48: Notifications ❌
- **Archivo:** `notification/notification.tsx` (269 líneas)
- **Mock data:** Notificaciones hardcodeadas en JSX ("Mark All as Read", etc.) sin integración con backend.
- **Tarea:** Si los usuarios del sitio público reciben notificaciones (reservas confirmadas, etc.), crear endpoint y consumirlo. Si no aplica, se puede ocultar.

---

## BLOQUE 10 – ADD PROPERTY

### T-49: Add Property (Buy) ❌
- **Archivo:** `add-property-buy/addProperyBuy.tsx` (76KB!)
- **Tarea:** Este formulario permite a agentes/admin agregar propiedades desde el sitio público. Evaluar si se mantiene (redirect al CRM) o se conecta al backend `POST /crm/propiedades`.

---

## BLOQUE 11 – DATOS COMPARTIDOS

### T-50: Select Options ❌
- **Archivo:** `core/common/selectOption.tsx` (154 líneas)
- **Mock data:** TODAS las opciones de dropdowns están hardcodeadas: Keyword, Property_Type, Location, BedRoom, BathRoom, Categories, Years, Agent_Type, Select_City, Select_Area, Country, State, City, Sort_By, Price_Range.
- **Tarea:** Las opciones que dependen de datos reales (ciudades, categorías, áreas, rangos de precio) deben generarse desde los datos del backend. Las opciones fijas (sort, bedrooms count) pueden quedarse estáticas.

### T-51: JSON Data Files ❌ (legacy, posiblemente no usadas)
- **Carpeta:** `core/json/` (47 archivos)
- **Contenido:** Archivos de datos mock para doctors, patients, prescriptions, etc. que parecen ser de un template médico original. No aplican a real estate.
- **Tarea:** Verificar que ningún componente las importe. Si no se usan, se pueden eliminar para limpiar el proyecto.

---

## BLOQUE 12 – ENDPOINTS BACKEND NUEVOS NECESARIOS

| # | Endpoint | Modelo requerido | Descripción |
|---|---|---|---|
| B-01 | `GET /public/agents` | Agente (existente) | Lista agentes con avatar, nombre, especialidad, count propiedades |
| B-02 | `GET /public/agents/:id` | Agente (existente) | Detalle de agente + sus propiedades |
| B-03 | `GET /public/stats` | — (aggregation) | Total propiedades, agentes, operaciones, usuarios |
| B-04 | `GET /public/cities` | — (aggregation Propiedad) | Ciudades con count de propiedades + imagen |
| B-05 | `GET /public/property-types` | — (aggregation Propiedad) | Tipos de propiedad con count |
| B-06 | `POST /public/contact` | ContactMessage (nuevo) | Recibir mensaje del formulario de contacto |
| B-07 | `GET /public/testimonials` | Testimonial (nuevo) | Testimonios activos |
| B-08 | `GET /public/faqs` | FAQ (nuevo) | Preguntas frecuentes |
| B-09 | `GET /public/gallery` | — (aggregation) | Imágenes para galería pública |
| B-10 | `GET /public/site-config` | GlobalConfig (existente) | Datos de la inmobiliaria (nombre, tel, email, dirección, redes sociales) |

---

## Modelos Backend Nuevos Necesarios

| Modelo | Campos clave |
|---|---|
| `Testimonial` | nombre, avatar, texto, rating, activo, orden |
| `FAQ` | pregunta, respuesta, categoria, orden, activo |
| `ContactMessage` | nombre, email, telefono, asunto, mensaje, createdAt |

---

## Resumen por Prioridad

### 🔴 Alta (core de la aplicación)
- **T-15 a T-19:** Grillas de propiedades buy/rent (el usuario no ve propiedades reales)
- **T-03:** Featured properties en home
- **T-35:** Cart
- **T-36:** Wishlist
- **T-37:** Checkout → Solicitud de reserva
- **T-26 a T-30:** Listado y detalle de agentes
- **T-22, T-23:** Filtros del sidebar
- **B-01, B-02:** Endpoints de agentes públicos

### 🟡 Media (mejora experiencia)
- **T-01:** Banner search funcional
- **T-02:** Tipos de propiedad dinámicos
- **T-04:** Ciudades dinámicas
- **T-05, T-38:** Estadísticas reales
- **T-08, T-40:** Testimonios reales
- **T-39:** Contacto funcional
- **T-50:** Select options dinámicos
- **B-03 a B-06, B-10:** Endpoints de soporte

### 🟢 Baja (nice-to-have)
- **T-06:** Buy/Rent CTA section
- **T-07:** Partners
- **T-09, T-43:** Pricing (evaluar eliminar)
- **T-10, T-44:** FAQ
- **T-41:** Gallery
- **T-42:** Our Team
- **T-45:** Invoice details
- **T-48:** Notifications usuario público
- **T-49:** Add Property
- **T-51:** Limpieza de JSON legacy
- **T-31:** Agencies (evaluar eliminar)
- **T-34:** Blog list
- **B-07, B-08, B-09:** Endpoints de soporte secundarios
