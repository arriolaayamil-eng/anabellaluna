import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "react-router";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import RentRightForm from "./rentRightForm";
import publicService, { type PropertyDetail } from "../../../../../services/publicService";
import { buildHeroBackground, getAccentColor, heroTextColorClass, heroMutedColor, resolveMediaUrl } from "../../common/funnelUtils";

// ─── Tracking helper (preserved) ─────────────────────────────────────────────
const trackEvent = (name: string, payload: Record<string, unknown> = {}) => {
  try {
    if ((window as any).dataLayer) (window as any).dataLayer.push({ event: name, ...payload });
  } catch {}
};

type SliderType = Slider;

const SectionHeader = ({ title, accent }: { title: string; accent: string }) => (
  <div className="d-flex align-items-center gap-2 mb-4">
    <span style={{ width: 4, height: 28, background: accent, borderRadius: 4, flexShrink: 0, display: "inline-block" }} />
    <h3 className="fw-bold mb-0" style={{ fontSize: "1.15rem" }}>{title}</h3>
  </div>
);

const StatChip = ({ icon, label, value }: { icon: string; label: string; value: string | number }) => (
  <div className="d-flex flex-column align-items-center justify-content-center p-3 rounded-3 border"
    style={{ minWidth: 80, gap: 4, background: "#fff" }}>
    <i className="material-icons-outlined text-secondary" style={{ fontSize: 22 }}>{icon}</i>
    <span className="fw-bold" style={{ fontSize: "1rem", lineHeight: 1.1 }}>{value}</span>
    <span className="text-secondary" style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
  </div>
);

const RentDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const privateToken = searchParams.get("token") || undefined;

  const [mainSlider, setMainSlider] = useState<SliderType | undefined>(undefined);
  const [thumbSlider, setThumbSlider] = useState<SliderType | undefined>(undefined);
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const mainRef = useRef<SliderType>(null);
  const thumbRef = useRef<SliderType>(null);

  const [stickyVisible, setStickyVisible] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const formRef = useRef<HTMLDivElement>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const [visitName, setVisitName] = useState("");
  const [visitPhone, setVisitPhone] = useState("");
  const [visitEmail, setVisitEmail] = useState("");
  const [visitDay, setVisitDay] = useState("");
  const [visitMsg, setVisitMsg] = useState("");
  const [visitSubmitting, setVisitSubmitting] = useState(false);
  const [visitFeedback, setVisitFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const mainSettings = {
    slidesToShow: 1, slidesToScroll: 1, fade: true,
    arrows: false, infinite: true, adaptiveHeight: true, asNavFor: thumbSlider,
  };
  const thumbSettings = {
    slidesToShow: 6, slidesToScroll: 1, asNavFor: mainSlider,
    focusOnSelect: true, arrows: true, infinite: true,
    responsive: [
      { breakpoint: 1200, settings: { slidesToShow: 5 } },
      { breakpoint: 992, settings: { slidesToShow: 4 } },
      { breakpoint: 768, settings: { slidesToShow: 3 } },
      { breakpoint: 576, settings: { slidesToShow: 2 } },
    ],
  };

  useEffect(() => {
    setMainSlider(mainRef.current ?? undefined);
    setThumbSlider(thumbRef.current ?? undefined);
  }, []);

  useEffect(() => {
    publicService.getSiteConfig().then((cfg) => {
      if (cfg?.whatsapp) setWhatsappNumber(cfg.whatsapp);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const fired = new Set<number>();
    const onScroll = () => {
      setStickyVisible(window.scrollY > 400);
      const pct = Math.floor((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      [25, 50, 75, 100].forEach((d) => {
        if (pct >= d && !fired.has(d)) {
          fired.add(d);
          trackEvent(`scroll_${d}`, { propertyId: property?.id, slug });
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [property, slug]);

  useEffect(() => {
    if (property?.id) trackEvent("property_detail_view", { propertyId: property.id, title: property.title, slug });
  }, [property?.id]);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (!slug) { setProperty(null); return; }
      try {
        setIsLoading(true);
        const res = await publicService.getPropertyBySlug(slug, privateToken);
        if (!isMounted) return;
        setProperty(res.item || null);
      } catch {
        if (!isMounted) return;
        setProperty(null);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };
    run();
    return () => { isMounted = false; };
  }, [slug]);

  const galleryImages = (
    property?.galleryUrls?.length ? property.galleryUrls : property?.media?.coverUrl ? [property.media.coverUrl] : []
  ).filter(Boolean).map(resolveMediaUrl);

  const priceLabel = () => {
    if (property?.price?.amount == null) return "";
    const currency = property.price.currency ? `${property.price.currency} ` : "";
    const unit = property.price.unit ? ` / ${property.price.unit}` : "";
    return `${currency}${Number(property.price.amount).toLocaleString("es-AR")}${unit}`;
  };

  const locationLabel = [
    property?.location?.addressLine,
    property?.location?.neighborhood,
    property?.location?.city,
    property?.location?.province,
  ].filter(Boolean).join(", ");

  const propertySlug = property?.slug;

  const submitVisit = useCallback(async () => {
    if (!propertySlug) return;
    if (!visitName.trim()) { setVisitFeedback({ type: "error", msg: "Ingresá tu nombre" }); return; }
    if (!visitPhone.trim() && !visitEmail.trim()) { setVisitFeedback({ type: "error", msg: "Ingresá teléfono o email" }); return; }
    setVisitSubmitting(true); setVisitFeedback(null);
    try {
      const start = visitDay ? new Date(`${visitDay}T10:00:00`).toISOString() : new Date(Date.now() + 86400000).toISOString();
      await publicService.scheduleVisit({ propertySlug, fullName: visitName, phone: visitPhone || undefined, email: visitEmail || undefined, message: visitMsg || undefined, start });
      trackEvent("visit_form_success", { propertyId: property?.id, slug });
      setVisitFeedback({ type: "success", msg: "¡Solicitud enviada! Te contactaremos a la brevedad." });
      setVisitName(""); setVisitPhone(""); setVisitEmail(""); setVisitDay(""); setVisitMsg("");
    } catch (e: any) {
      setVisitFeedback({ type: "error", msg: e?.message || "No se pudo enviar la solicitud" });
    } finally { setVisitSubmitting(false); }
  }, [propertySlug, visitName, visitPhone, visitEmail, visitDay, visitMsg, property?.id, slug]);

  const amenities = (property?.amenities || []).filter(Boolean);
  const floorPlanUrls = (property?.floorPlanUrls || []).filter(Boolean).map(resolveMediaUrl);
  const videoUrls = (property?.videoUrls || []).filter(Boolean);

  const toEmbedUrl = (url: string) => {
    const raw = String(url || "").trim();
    if (!raw) return "";
    if (raw.includes("youtube.com/embed/")) return raw;
    if (raw.includes("youtu.be/")) {
      const id = raw.split("youtu.be/")[1]?.split(/[?&]/)[0];
      return id ? `https://www.youtube.com/embed/${id}` : raw;
    }
    if (raw.includes("youtube.com/watch")) {
      const q = raw.split("?")[1] || "";
      const id = new URLSearchParams(q).get("v");
      return id ? `https://www.youtube.com/embed/${id}` : raw;
    }
    const vm = raw.match(/vimeo\.com\/(\d+)/);
    if (vm?.[1]) return `https://player.vimeo.com/video/${vm[1]}`;
    return raw;
  };

  const scrollToForm = useCallback(() => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    trackEvent("hero_cta_click", { propertyId: property?.id, slug });
  }, [property?.id, slug]);

  const openWhatsApp = useCallback((source: string) => {
    const num = whatsappNumber.replace(/\D/g, "");
    const msg = encodeURIComponent(`Hola, me interesa la propiedad en alquiler: ${property?.title || ""} (${window.location.href})`);
    window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
    trackEvent("whatsapp_cta_click", { propertyId: property?.id, slug, source });
  }, [whatsappNumber, property?.title, property?.id, slug]);

  const fs = property?.funnelSettings;
  const accentColor = getAccentColor(fs);
  const textClass = heroTextColorClass(fs);
  const mutedColor = heroMutedColor(fs);
  const imageStyle = fs?.heroImageStyle ?? "float-right";

  const heroStyle = useMemo((): React.CSSProperties => {
    const bg = buildHeroBackground(fs);
    return {
      ...bg,
      minHeight: "90vh",
      display: "flex",
      alignItems: "center",
      position: "relative",
      paddingTop: 100,
      paddingBottom: imageStyle === "hidden" ? 80 : 140,
    };
  }, [fs, imageStyle]);

  const coverImage = galleryImages[0] || "";
  const showHeroImage = imageStyle !== "hidden" && !!coverImage;

  const specs: Array<{ icon: string; label: string; value: string | number }> = [];
  if (property?.features?.beds) specs.push({ icon: "king_bed", label: "Dormitorios", value: property.features.beds });
  if (property?.features?.baths) specs.push({ icon: "shower", label: "Baños", value: property.features.baths });
  if (property?.features?.rooms) specs.push({ icon: "meeting_room", label: "Ambientes", value: property.features.rooms });
  if (property?.features?.areaSqFt) specs.push({ icon: "straighten", label: "m² totales", value: property.features.areaSqFt });
  if (property?.features?.coveredAreaSqFt) specs.push({ icon: "roofing", label: "m² cubiertos", value: property.features.coveredAreaSqFt });
  if (property?.features?.parking) specs.push({ icon: "directions_car", label: "Cocheras", value: property.features.parking });
  if (property?.ageYears != null) specs.push({ icon: "history", label: "Antigüedad", value: `${property.ageYears} años` });
  if (property?.extraFeatures?.floor) specs.push({ icon: "layers", label: "Piso", value: property.extraFeatures.floor });

  const extraSpecs: Array<[string, string]> = [];
  const ef = property?.extraFeatures;
  if (ef) {
    if (ef.yearBuilt) extraSpecs.push(["Año construcción", ef.yearBuilt]);
    if (ef.heating) extraSpecs.push(["Calefacción", ef.heating]);
    if (ef.hotWater) extraSpecs.push(["Agua caliente", ef.hotWater]);
    if (ef.stove) extraSpecs.push(["Cocina", ef.stove]);
    if (ef.ac) extraSpecs.push(["Aire acondicionado", ef.ac]);
    if (ef.balcony) extraSpecs.push(["Balcón", ef.balcony]);
    if (ef.wardrobe) extraSpecs.push(["Placard", ef.wardrobe]);
    if (ef.garageSize) extraSpecs.push(["Cochera tamaño", ef.garageSize]);
    if (ef.availableFrom) extraSpecs.push(["Disponible desde", ef.availableFrom]);
  }
  if (property?.type) extraSpecs.push(["Tipo de propiedad", property.type]);
  if (property?.category) extraSpecs.push(["Categoría", property.category]);
  if (property?.structureType) extraSpecs.push(["Tipo de estructura", property.structureType]);

  const faqs = [
    { q: "¿Cuáles son los gastos de expensas y qué incluyen?", a: "Las expensas cubren los gastos de administración y servicios comunes del edificio. Te brindamos el detalle actualizado al contactarte." },
    { q: "¿Se permiten mascotas?", a: "La política de mascotas varía según el propietario. Consultanos y te confirmamos si esta propiedad las acepta." },
    { q: "¿Cuánto es el depósito y qué garantía se pide?", a: "Habitualmente se solicita un mes de depósito y garantía propietaria o seguro de caución. Nuestros asesores te explicarán todas las opciones disponibles." },
    { q: "¿Cuál es el plazo mínimo del contrato?", a: "Los contratos de locación tienen generalmente una duración de 3 años según la ley vigente. Coordiná una visita y te asesoramos en detalle." },
  ];

  if (isLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "70vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: 48, height: 48 }} role="status" />
          <p className="text-secondary">Cargando propiedad…</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <i className="material-icons-outlined text-secondary mb-3" style={{ fontSize: 64 }}>home</i>
          <h4 className="fw-bold mb-2">Propiedad no encontrada</h4>
          <p className="text-secondary">La propiedad que buscás no existe o ya no está disponible.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── STICKY CONVERSION BAR ──────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 1050,
          background: "rgba(10,20,40,0.97)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "10px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
          transform: stickyVisible ? "translateY(0)" : "translateY(-100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
          <span className="text-white fw-bold text-truncate" style={{ maxWidth: 260, fontSize: "0.9rem" }}>
            {property.title}
          </span>
          {priceLabel() && (
            <span style={{ color: accentColor, fontWeight: 700, fontSize: "1rem", whiteSpace: "nowrap" }}>
              {priceLabel()}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-sm fw-semibold px-3"
            style={{ background: accentColor, color: "#fff", border: "none" }}
            onClick={() => { scrollToForm(); trackEvent("sticky_cta_click", { propertyId: property.id }); }}
          >
            <i className="material-icons-outlined" style={{ fontSize: 16, verticalAlign: "middle", marginRight: 4 }}>calendar_today</i>
            Consultar
          </button>
          {whatsappNumber && (
            <button className="btn btn-sm btn-success fw-semibold px-3" onClick={() => openWhatsApp("sticky")}>
              <i className="fa-brands fa-whatsapp" /> WhatsApp
            </button>
          )}
        </div>
      </div>

      {/* ── HERO SECTION ──────────────────────────────────────────────────── */}
      <section style={heroStyle}>
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className={`row align-items-center gx-5 ${imageStyle === "float-left" ? "flex-row-reverse" : ""}`}>

            <div className={showHeroImage ? "col-xl-6 col-lg-7" : "col-xl-8 col-lg-10 mx-auto text-center"}>
              <div className="d-flex flex-wrap gap-2 mb-4" style={showHeroImage ? {} : { justifyContent: "center" }}>
                <span className="badge fw-semibold px-3 py-2" style={{ background: accentColor, fontSize: "0.78rem", letterSpacing: "0.06em" }}>
                  En Alquiler
                </span>
                {property.type && (
                  <span className="badge bg-white text-dark fw-semibold px-3 py-2" style={{ fontSize: "0.78rem" }}>{property.type}</span>
                )}
                {property.featured && (
                  <span className="badge fw-semibold px-3 py-2" style={{ background: "#f59e0b", fontSize: "0.78rem" }}>⭐ Destacada</span>
                )}
                {property.trending && (
                  <span className="badge fw-semibold px-3 py-2" style={{ background: "#ef4444", fontSize: "0.78rem" }}>�� Tendencia</span>
                )}
              </div>

              <h1 className={textClass} style={{ fontSize: "clamp(2rem, 4.5vw, 4.2rem)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.025em", marginBottom: "1.25rem" }}>
                {property.title}
              </h1>

              {locationLabel && (
                <div className="d-flex align-items-center gap-2 mb-4" style={{ color: mutedColor }}>
                  <i className="material-icons-outlined" style={{ fontSize: 18 }}>location_on</i>
                  <span style={{ fontSize: "0.95rem" }}>{locationLabel}</span>
                </div>
              )}

              {specs.length > 0 && (
                <div className="d-flex flex-wrap gap-3 mb-4">
                  {specs.slice(0, 4).map((s) => (
                    <div key={s.label} className="d-flex align-items-center gap-1" style={{ color: mutedColor }}>
                      <i className="material-icons-outlined" style={{ fontSize: 18 }}>{s.icon}</i>
                      <span style={{ fontWeight: 600, color: textClass === "text-white" ? "#fff" : "#111" }}>{s.value}</span>
                      <span style={{ fontSize: "0.8rem" }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {priceLabel() && (
                <div className="mb-5">
                  <span className={textClass} style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                    {priceLabel()}
                  </span>
                </div>
              )}

              <div className="d-flex flex-wrap gap-3">
                <button
                  className="btn btn-lg fw-bold px-4 py-3 d-flex align-items-center gap-2"
                  style={{ background: accentColor, color: "#fff", border: "none", borderRadius: 12, boxShadow: `0 8px 32px ${accentColor}55` }}
                  onClick={scrollToForm}
                >
                  <i className="material-icons-outlined" style={{ fontSize: 20 }}>calendar_today</i>
                  Consultar disponibilidad
                </button>
                {whatsappNumber && (
                  <button
                    className="btn btn-lg fw-bold px-4 py-3 d-flex align-items-center gap-2"
                    style={{ background: "#25d366", color: "#fff", border: "none", borderRadius: 12, boxShadow: "0 8px 32px rgba(37,211,102,0.35)" }}
                    onClick={() => openWhatsApp("hero")}
                  >
                    <i className="fa-brands fa-whatsapp" style={{ fontSize: 20 }} /> WhatsApp
                  </button>
                )}
                {galleryImages.length > 1 && (
                  <button
                    className="btn btn-lg fw-semibold px-4 py-3 d-flex align-items-center gap-2"
                    style={{ background: "rgba(255,255,255,0.12)", color: textClass === "text-white" ? "#fff" : "#111", border: "1.5px solid rgba(255,255,255,0.25)", borderRadius: 12 }}
                    onClick={() => { setLightboxIndex(0); trackEvent("gallery_open", { propertyId: property.id, source: "hero" }); }}
                  >
                    <i className="material-icons-outlined" style={{ fontSize: 20 }}>photo_library</i>
                    {galleryImages.length} fotos
                  </button>
                )}
              </div>
            </div>

            {showHeroImage && (
              <div className="col-xl-6 col-lg-5 mt-5 mt-lg-0">
                <div style={{ position: "relative" }}>
                  <div
                    style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.45), 0 8px 20px rgba(0,0,0,0.2)", transform: "translateY(80px)", cursor: galleryImages.length > 1 ? "pointer" : "default" }}
                    onClick={() => galleryImages.length > 0 && setLightboxIndex(0)}
                  >
                    <img src={coverImage} alt={property.title} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }} />
                    {galleryImages.length > 1 && (
                      <div style={{ position: "absolute", bottom: 16, right: 16, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", color: "#fff", borderRadius: 50, padding: "6px 14px", fontSize: "0.82rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                        <i className="material-icons-outlined" style={{ fontSize: 16 }}>photo_library</i>
                        {galleryImages.length} fotos
                      </div>
                    )}
                  </div>
                  {specs.length > 0 && (
                    <div style={{ position: "absolute", bottom: -60, left: 20, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderRadius: 16, padding: "12px 20px", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", display: "flex", gap: 20 }}>
                      {specs.slice(0, 3).map((s) => (
                        <div key={s.label} className="text-center">
                          <div className="fw-bold" style={{ fontSize: "1.1rem", color: accentColor }}>{s.value}</div>
                          <div className="text-secondary" style={{ fontSize: "0.68rem", textTransform: "uppercase" }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── CONTENT AREA ────────────────────────────────────────────────────── */}
      <div style={{ background: "#fff", borderRadius: "36px 36px 0 0", marginTop: -36, paddingTop: showHeroImage ? 120 : 60, position: "relative", zIndex: 2, boxShadow: "0 -4px 40px rgba(0,0,0,0.08)" }}>
        <div className="container pb-5">
          <div className="row gx-4 gx-xl-5">

            <div className="col-xl-8">

              {specs.length > 0 && (
                <div className="mb-5 p-4 rounded-3 d-flex flex-wrap gap-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  {specs.map((s) => (
                    <StatChip key={s.label} icon={s.icon} label={s.label} value={s.value} />
                  ))}
                </div>
              )}

              {galleryImages.length > 0 && (
                <div className="mb-5">
                  <SectionHeader title="Galería de imágenes" accent={accentColor} />
                  <div className="rounded-3 overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.1)", cursor: "zoom-in" }}
                    onClick={() => { setLightboxIndex(0); trackEvent("gallery_open", { propertyId: property.id, source: "carousel" }); }}>
                    <Slider ref={mainRef} {...mainSettings}>
                      {galleryImages.map((src, i) => (
                        <div key={i}>
                          <img src={src} alt={`${property.title} — ${i + 1}`} style={{ width: "100%", height: 420, objectFit: "cover", display: "block" }}
                            onLoad={() => trackEvent("gallery_image_view", { propertyId: property.id, index: i })} />
                        </div>
                      ))}
                    </Slider>
                  </div>
                  {galleryImages.length > 1 && (
                    <div className="mt-2">
                      <Slider ref={thumbRef} {...thumbSettings}>
                        {galleryImages.map((src, i) => (
                          <div key={i} style={{ padding: "0 3px" }}>
                            <img src={src} alt={`thumb-${i}`} style={{ width: "100%", height: 62, objectFit: "cover", borderRadius: 6, cursor: "pointer", opacity: 0.8 }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")} />
                          </div>
                        ))}
                      </Slider>
                    </div>
                  )}
                  <div className="text-end mt-2">
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => { setLightboxIndex(0); trackEvent("gallery_open_all", { propertyId: property.id }); }}>
                      <i className="material-icons-outlined" style={{ fontSize: 16, verticalAlign: "middle" }}>open_in_full</i>{" "}Ver las {galleryImages.length} fotos
                    </button>
                  </div>
                </div>
              )}

              {property.description && (
                <div className="mb-5">
                  <SectionHeader title="Sobre esta propiedad" accent={accentColor} />
                  <div style={{ fontSize: "0.97rem", lineHeight: 1.85, color: "#374151", whiteSpace: "pre-line" }}>
                    {property.description}
                  </div>
                </div>
              )}

              {extraSpecs.length > 0 && (
                <div className="mb-5">
                  <SectionHeader title="Características técnicas" accent={accentColor} />
                  <div className="row g-3">
                    {extraSpecs.map(([key, val]) => (
                      <div key={key} className="col-sm-6 col-md-4">
                        <div className="p-3 rounded-3 d-flex flex-column" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", height: "100%" }}>
                          <span className="text-secondary" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{key}</span>
                          <span className="fw-semibold" style={{ fontSize: "0.95rem" }}>{val}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {amenities.length > 0 && (
                <div className="mb-5">
                  <SectionHeader title="Amenities y servicios" accent={accentColor} />
                  <div className="d-flex flex-wrap gap-2">
                    {amenities.map((a) => (
                      <span key={a} className="badge fw-normal px-3 py-2" style={{ background: `${accentColor}15`, color: accentColor, fontSize: "0.85rem", borderRadius: 50 }}>{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {floorPlanUrls.length > 0 && (
                <div className="mb-5">
                  <SectionHeader title="Planos" accent={accentColor} />
                  <div className="row g-3">
                    {floorPlanUrls.map((url, i) => (
                      <div key={i} className="col-sm-6">
                        <img src={url} alt={`Plano ${i + 1}`} className="rounded-3 border" style={{ width: "100%", cursor: "zoom-in", objectFit: "contain", maxHeight: 280 }}
                          onClick={() => { setLightboxIndex(galleryImages.length + i); trackEvent("floor_plan_view", { propertyId: property.id }); }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {videoUrls.length > 0 && (
                <div className="mb-5">
                  <SectionHeader title="Video tour" accent={accentColor} />
                  <div className="d-flex flex-column gap-3">
                    {videoUrls.map((url, i) => {
                      const embed = toEmbedUrl(url);
                      return embed ? (
                        <div key={i} className="ratio ratio-16x9 rounded-3 overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }}>
                          <iframe
                            src={embed}
                            title={`Video ${i + 1}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            style={{ border: 0 }}
                          />
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {property.location?.lat && property.location?.lng && (
                <div className="mb-5">
                  <SectionHeader title="Ubicación" accent={accentColor} />
                  {locationLabel && (
                    <div className="d-flex align-items-center gap-2 mb-3 text-secondary">
                      <i className="material-icons-outlined" style={{ fontSize: 18 }}>location_on</i>
                      <span style={{ fontSize: "0.9rem" }}>{locationLabel}</span>
                    </div>
                  )}
                  <div className="rounded-3 overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.1)", height: 320 }}>
                    <iframe title="Mapa de ubicación" src={`https://www.google.com/maps?q=${property.location.lat},${property.location.lng}&z=15&output=embed`}
                      style={{ width: "100%", height: "100%", border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                  </div>
                </div>
              )}

              {property.agent?.name && (
                <div className="mb-5">
                  <SectionHeader title="Tu asesor" accent={accentColor} />
                  <div className="p-4 rounded-4" style={{ background: "linear-gradient(135deg,#f8fafc,#f0f4f8)", border: "1px solid #e2e8f0" }}>
                    <div className="row align-items-center g-4">
                      <div className="col-sm-auto">
                        {property.agent.avatarUrl ? (
                          <img src={resolveMediaUrl(property.agent.avatarUrl)} alt={property.agent.name} style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }} />
                        ) : (
                          <div style={{ width: 96, height: 96, borderRadius: "50%", background: `linear-gradient(135deg,${accentColor},${accentColor}bb)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "2rem", fontWeight: 700 }}>
                            {property.agent.name[0]}
                          </div>
                        )}
                      </div>
                      <div className="col">
                        <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                          <h5 className="fw-bold mb-0">{property.agent.name}</h5>
                          {property.agent.cargo && (
                            <span className="badge" style={{ background: `${accentColor}20`, color: accentColor, fontSize: "0.75rem" }}>{property.agent.cargo}</span>
                          )}
                        </div>
                        {property.agent.especialidad && (
                          <p className="text-secondary mb-1" style={{ fontSize: "0.85rem" }}>{property.agent.especialidad}</p>
                        )}
                        {property.agent.bio && (
                          <p className="text-secondary mb-3" style={{ fontSize: "0.88rem", lineHeight: 1.6 }}>{property.agent.bio}</p>
                        )}
                        <div className="d-flex flex-wrap gap-2">
                          {property.agent.phone && (
                            <a href={`tel:${property.agent.phone}`} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
                              <i className="material-icons-outlined" style={{ fontSize: 16 }}>phone</i>{property.agent.phone}
                            </a>
                          )}
                          {property.agent.email && (
                            <a href={`mailto:${property.agent.email}`} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
                              <i className="material-icons-outlined" style={{ fontSize: 16 }}>email</i>Email
                            </a>
                          )}
                          {whatsappNumber && (
                            <button className="btn btn-sm btn-success d-flex align-items-center gap-1" onClick={() => openWhatsApp("agent_block")}>
                              <i className="fa-brands fa-whatsapp" /> WhatsApp
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-5">
                <SectionHeader title="Preguntas frecuentes" accent={accentColor} />
                <div className="d-flex flex-column gap-2">
                  {faqs.map((faq, i) => (
                    <div key={i} className="rounded-3 border overflow-hidden" style={{ background: "#fff" }}>
                      <button className="btn w-100 text-start d-flex align-items-center justify-content-between p-4 fw-semibold" style={{ gap: 12, fontSize: "0.95rem" }} onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                        <span>{faq.q}</span>
                        <i className="material-icons-outlined text-secondary" style={{ fontSize: 20, transition: "transform 0.2s", transform: faqOpen === i ? "rotate(180deg)" : "rotate(0deg)" }}>expand_more</i>
                      </button>
                      {faqOpen === i && (
                        <div className="px-4 pb-4" style={{ fontSize: "0.9rem", color: "#4b5563", lineHeight: 1.7 }}>{faq.a}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div ref={formRef} className="mb-5">
                <div className="p-5 rounded-4" style={{ background: "linear-gradient(135deg,#0f172a,#1e3a5f)", color: "#fff" }}>
                  <div className="d-flex flex-wrap gap-3 mb-4">
                    {property.visitCount && property.visitCount > 0 ? (
                      <span className="badge" style={{ background: "rgba(255,255,255,0.12)", color: "#fff", fontSize: "0.82rem", padding: "6px 14px" }}>👁 {property.visitCount} personas vieron esta propiedad</span>
                    ) : null}
                    {property.trending && (
                      <span className="badge" style={{ background: "rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: "0.82rem", padding: "6px 14px" }}>🔥 Alta demanda esta semana</span>
                    )}
                    <span className="badge" style={{ background: "rgba(255,255,255,0.12)", color: "#fff", fontSize: "0.82rem", padding: "6px 14px" }}>✅ Respuesta en menos de 24 hs</span>
                  </div>
                  <h4 className="fw-bold mb-1" style={{ fontSize: "1.4rem" }}>Consultá disponibilidad</h4>
                  <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "1.5rem", fontSize: "0.92rem" }}>
                    Completá el formulario y un asesor te contactará para coordinar la visita.
                  </p>
                  {visitFeedback && (
                    <div className={`alert ${visitFeedback.type === "success" ? "alert-success" : "alert-danger"} mb-3`} style={{ borderRadius: 10, fontSize: "0.9rem" }}>
                      {visitFeedback.msg}
                    </div>
                  )}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label text-white fw-semibold" style={{ fontSize: "0.82rem" }}>Nombre completo *</label>
                      <input type="text" className="form-control" placeholder="Tu nombre" value={visitName} onChange={(e) => setVisitName(e.target.value)}
                        style={{ borderRadius: 10, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-white fw-semibold" style={{ fontSize: "0.82rem" }}>WhatsApp / Teléfono *</label>
                      <input type="tel" className="form-control" placeholder="+54 9 11 xxxx-xxxx" value={visitPhone} onChange={(e) => setVisitPhone(e.target.value)}
                        style={{ borderRadius: 10, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-white fw-semibold" style={{ fontSize: "0.82rem" }}>Email</label>
                      <input type="email" className="form-control" placeholder="tu@email.com" value={visitEmail} onChange={(e) => setVisitEmail(e.target.value)}
                        style={{ borderRadius: 10, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-white fw-semibold" style={{ fontSize: "0.82rem" }}>Fecha preferida</label>
                      <input type="date" className="form-control" value={visitDay} onChange={(e) => setVisitDay(e.target.value)}
                        style={{ borderRadius: 10, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }} />
                    </div>
                    <div className="col-12">
                      <label className="form-label text-white fw-semibold" style={{ fontSize: "0.82rem" }}>Mensaje (opcional)</label>
                      <input type="text" className="form-control" placeholder="Ej: prefiero por las mañanas" value={visitMsg} onChange={(e) => setVisitMsg(e.target.value)}
                        style={{ borderRadius: 10, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }} />
                    </div>
                  </div>
                  <div className="d-flex flex-wrap gap-3 mt-4">
                    <button type="button" className="btn btn-lg fw-bold px-4 d-flex align-items-center gap-2"
                      style={{ background: accentColor, color: "#fff", border: "none", borderRadius: 12 }}
                      onClick={() => { trackEvent("visit_form_submit", { propertyId: property.id }); submitVisit(); }}
                      disabled={visitSubmitting}>
                      <i className="material-icons-outlined" style={{ fontSize: 20 }}>calendar_today</i>
                      {visitSubmitting ? "Enviando…" : "Solicitar visita"}
                    </button>
                    {whatsappNumber && (
                      <button type="button" className="btn btn-lg fw-bold px-4 btn-success d-flex align-items-center gap-2" style={{ borderRadius: 12 }} onClick={() => openWhatsApp("form")}>
                        <i className="fa-brands fa-whatsapp" style={{ fontSize: 20 }} /> Hablar por WhatsApp
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-5 text-center p-5 rounded-4" style={{ background: `linear-gradient(135deg,${accentColor},${accentColor}cc)`, color: "#fff" }}>
                <i className="material-icons-outlined mb-2" style={{ fontSize: 40 }}>home_work</i>
                <h4 className="fw-bold mb-2">¿Te interesa este alquiler?</h4>
                <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                  Coordiná una visita y recibí asesoramiento para avanzar con seguridad.
                </p>
                <div className="d-flex justify-content-center flex-wrap gap-3">
                  <button className="btn btn-light btn-lg px-4 fw-bold d-flex align-items-center gap-2"
                    onClick={() => { scrollToForm(); trackEvent("final_cta_click", { propertyId: property.id }); }}>
                    <i className="material-icons-outlined">calendar_today</i> Consultar
                  </button>
                  {whatsappNumber && (
                    <button className="btn btn-success btn-lg px-4 fw-bold d-flex align-items-center gap-2" onClick={() => openWhatsApp("final_cta")}>
                      <i className="fa-brands fa-whatsapp fs-18" /> WhatsApp
                    </button>
                  )}
                </div>
              </div>

            </div>

            <div className="col-xl-4 d-none d-xl-block">
              <div style={{ position: "sticky", top: 80 }}>
                <RentRightForm agent={property.agent} propertySlug={property.slug || property.id} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Lightbox
        open={lightboxIndex != null}
        close={() => setLightboxIndex(null)}
        index={lightboxIndex ?? 0}
        slides={[...galleryImages, ...floorPlanUrls].map((src) => ({ src }))}
        plugins={[Thumbnails]}
        thumbnails={{ border: 2, borderRadius: 4, padding: 2, gap: 8, showToggle: false }}
        animation={{ fade: 300, swipe: 300 }}
      />

      <div className="d-xl-none" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(8px)", borderTop: "1px solid rgba(0,0,0,0.1)", padding: "10px 16px", paddingBottom: "max(10px, env(safe-area-inset-bottom))", zIndex: 9999, display: "flex", gap: 10 }}>
        <button className="btn btn-lg fw-semibold d-flex align-items-center justify-content-center gap-2"
          style={{ flex: 1, background: accentColor, color: "#fff", border: "none", borderRadius: 10 }}
          onClick={() => { scrollToForm(); trackEvent("mobile_cta_click", { propertyId: property.id }); }}>
          <i className="material-icons-outlined" style={{ fontSize: 18 }}>calendar_today</i> Consultar
        </button>
        {whatsappNumber && (
          <button className="btn btn-success fw-semibold d-flex align-items-center gap-2" style={{ borderRadius: 10 }} onClick={() => openWhatsApp("mobile_cta")}>
            <i className="fa-brands fa-whatsapp" /> WhatsApp
          </button>
        )}
      </div>
    </>
  );
};

export default RentDetails;
