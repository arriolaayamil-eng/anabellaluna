import { Link } from "react-router";
import { useState, useEffect } from "react";
import Slider from "react-slick";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import publicService from "../../../../../services/publicService";
import type { PropertyCard } from "../../../../../services/publicService";

const formatPrice = (price?: { amount?: number; currency?: string; unit?: string }) => {
  if (!price || !price.amount) return "";
  const formatted = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: price.currency || "ARS",
    maximumFractionDigits: 0,
  }).format(price.amount);
  return price.unit ? `${formatted} / ${price.unit}` : formatted;
};

const FeaturesTwoSection = () => {
  const [properties, setProperties] = useState<PropertyCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        setIsLoading(true);
        const res = await publicService.getProperties("rent");
        if (!m) return;
        const items = res.items || [];
        setProperties(items.slice(0, 8));
      } catch {
        if (m) setProperties([]);
      } finally {
        if (m) setIsLoading(false);
      }
    })();
    return () => { m = false; };
  }, []);

  const toggle = (id: string) =>
    setFavorites((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const settings = {
    dots: false,
    infinite: properties.length > 3,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: true,
    responsive: [
      { breakpoint: 1200, settings: { slidesToShow: 2 } },
      { breakpoint: 768, settings: { slidesToShow: 1 } },
    ],
  };

  if (isLoading) {
    return (
      <section className="feature-property-sec-two section-padding">
        <div className="container">
          <div className="section-heading text-center">
            <h2>Propiedades en Alquiler</h2>
            <p>Las mejores opciones de alquiler disponibles para vos.</p>
          </div>
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (properties.length === 0) return null;

  return (
    <section className="feature-property-sec-two section-padding">
      <div className="container">
        <div className="section-heading text-center">
          <h2>Propiedades en Alquiler</h2>
          <div className="sec-line">
            <span className="sec-line1" />
            <span className="sec-line2" />
          </div>
          <p>Las mejores opciones de alquiler disponibles para vos.</p>
        </div>
        <Slider {...settings} className="feature-property-slider-two">
          {properties.map((prop) => {
            const isFav = favorites.has(prop.id);
            const detailPath = all_routes.rentDetailsPath(prop.slug);
            const coverSrc = prop.media?.coverUrl || "assets/img/buy/buy-grid-img-01.jpg";

            return (
              <div key={prop.id} className="px-2">
                <div className="property-card flex-fill">
                  <div className="property-listing-item p-0 mb-0 shadow-none">
                    <div className="buy-grid-img mb-0 rounded-0">
                      <Link to={detailPath}>
                        <ImageWithBasePath className="img-fluid" src={coverSrc} alt={prop.title || "property"} />
                      </Link>
                      <div className="d-flex align-items-center justify-content-between position-absolute top-0 start-0 end-0 p-3 z-1">
                        <div className="d-flex align-items-center gap-2">
                          {prop.featured && (
                            <div className="badge badge-sm bg-orange d-flex align-items-center">
                              <i className="material-icons-outlined">loyalty</i>
                              Destacada
                            </div>
                          )}
                        </div>
                        <Link
                          to="#"
                          className={`favourite ${isFav ? "selected" : ""}`}
                          onClick={(e) => { e.preventDefault(); toggle(prop.id); }}
                        >
                          <i className={`material-icons-outlined ${isFav ? "filled" : ""}`}>
                            {isFav ? "favorite" : "favorite_border"}
                          </i>
                        </Link>
                      </div>
                      <div className="d-flex align-items-center justify-content-between position-absolute bottom-0 end-0 start-0 p-3 z-1">
                        <h6 className="text-white mb-0">{formatPrice(prop.price)}</h6>
                        {prop.agent?.avatarUrl && (
                          <div className="user-avatar avatar avatar-md border rounded-circle">
                            <ImageWithBasePath src={prop.agent.avatarUrl} alt={prop.agent.name || "Agent"} className="rounded-circle" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="buy-grid-content">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h6 className="title mb-1">
                            <Link to={detailPath}>{prop.title || "Sin título"}</Link>
                          </h6>
                          {prop.location?.addressLine && (
                            <p className="d-flex align-items-center fs-14 mb-0">
                              <i className="material-icons-outlined me-1 ms-0">location_on</i>
                              {[prop.location.addressLine, prop.location.city, prop.location.province].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                      <ul className="d-flex buy-grid-details mb-3 bg-light rounded p-3 justify-content-between align-items-center flex-wrap gap-1">
                        {(prop.features?.beds != null && prop.features.beds > 0) && (
                          <li className="d-flex align-items-center gap-1">
                            <i className="material-icons-outlined bg-white text-secondary">bed</i>
                            {prop.features.beds} Hab.
                          </li>
                        )}
                        {(prop.features?.baths != null && prop.features.baths > 0) && (
                          <li className="d-flex align-items-center gap-1">
                            <i className="material-icons-outlined bg-white text-secondary">bathtub</i>
                            {prop.features.baths} Baño{prop.features.baths > 1 ? "s" : ""}
                          </li>
                        )}
                        {(prop.features?.areaSqFt != null && prop.features.areaSqFt > 0) && (
                          <li className="d-flex align-items-center gap-1">
                            <i className="material-icons-outlined bg-white text-secondary">straighten</i>
                            {prop.features.areaSqFt} m²
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </Slider>
        <div className="text-center mt-4">
          <Link to={all_routes.rentPropertyGridSidebar} className="btn btn-dark d-inline-flex align-items-center">
            Ver todos los alquileres
            <i className="material-icons-outlined ms-1">arrow_forward</i>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturesTwoSection;
