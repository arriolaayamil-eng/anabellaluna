import { Link } from "react-router";
import Slider from "react-slick";
import { useState, useEffect } from "react";
import { all_routes } from "../../../../routes/all_routes";
import publicService from "../../../../../services/publicService";

const typeIcons: Record<string, string> = {
  casa: "home",
  departamento: "apartment",
  oficina: "business",
  local: "storefront",
  terreno: "landscape",
  condominio: "domain",
  ph: "holiday_village",
  cochera: "garage",
  galpon: "warehouse",
  campo: "grass",
};

const getIcon = (typeName: string) => {
  const lower = typeName.toLowerCase();
  for (const [key, icon] of Object.entries(typeIcons)) {
    if (lower.includes(key)) return icon;
  }
  return "home_work";
};

const PropertySection = () => {
  const [types, setTypes] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const res = await publicService.getPropertyStats();
        if (m) setTypes(res.types || []);
      } catch {
        // keep empty
      }
    })();
    return () => { m = false; };
  }, []);

  const settings = {
    dots: false,
    infinite: types.length > 4,
    speed: 500,
    slidesToShow: Math.min(types.length, 4),
    slidesToScroll: 1,
    arrows: true,
    responsive: [
      { breakpoint: 1200, settings: { slidesToShow: Math.min(types.length, 3) } },
      { breakpoint: 992, settings: { slidesToShow: Math.min(types.length, 2) } },
      { breakpoint: 768, settings: { slidesToShow: 1 } },
    ],
  };

  if (types.length === 0) return null;

  return (
    <>
      <section className="property-type-section section-padding">
        <div className="container">
          <div
            className="section-heading aos"
            data-aos="fade-down"
            data-aos-duration={1000}
          >
            <h2 className="mb-2 text-center">Tipos de Propiedad</h2>
            <div className="sec-line">
              <span className="sec-line1" />
              <span className="sec-line2" />
            </div>
            <p className="mb-0 text-center">
              Encontrá el tipo de propiedad que mejor se adapte a tus necesidades.
            </p>
          </div>
          <Slider {...settings} className="property-type-slider">
            {types.map((t, i) => (
              <div key={t.name} className="px-2">
                <div
                  className="property-type-item text-center aos"
                  data-aos="fade-up"
                  data-aos-duration={1000 + i * 100}
                >
                  <Link
                    to={`${all_routes.buyPropertyGridSidebar}?type=${encodeURIComponent(t.name)}`}
                    className="d-block"
                  >
                    <div
                      className="property-type-icon bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                      style={{ width: 80, height: 80 }}
                    >
                      <i
                        className="material-icons-outlined text-primary"
                        style={{ fontSize: 36 }}
                      >
                        {getIcon(t.name)}
                      </i>
                    </div>
                    <h6 className="mb-1">{t.name}</h6>
                    <p className="text-muted mb-0">
                      {t.count} propiedad{t.count !== 1 ? "es" : ""}
                    </p>
                  </Link>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </section>
    </>
  );
};

export default PropertySection;
