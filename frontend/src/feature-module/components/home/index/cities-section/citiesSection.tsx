import { Link } from "react-router";
import Slider from "react-slick";
import { useState, useEffect } from "react";
import { all_routes } from "../../../../routes/all_routes";
import publicService from "../../../../../services/publicService";

const CitiesSection = () => {
  const [cities, setCities] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const res = await publicService.getPropertyStats();
        if (m) setCities(res.cities || []);
      } catch {
        // keep empty
      }
    })();
    return () => { m = false; };
  }, []);

  const settings = {
    dots: false,
    infinite: cities.length > 4,
    speed: 500,
    slidesToShow: Math.min(cities.length, 4),
    slidesToScroll: 1,
    arrows: true,
    responsive: [
      { breakpoint: 1200, settings: { slidesToShow: Math.min(cities.length, 3) } },
      { breakpoint: 992, settings: { slidesToShow: Math.min(cities.length, 2) } },
      { breakpoint: 768, settings: { slidesToShow: 1 } },
    ],
  };

  if (cities.length === 0) return null;

  return (
    <>
      <section className="cities-section section-padding">
        <div className="container">
          <div
            className="section-heading aos"
            data-aos="fade-down"
            data-aos-duration={1000}
          >
            <h2 className="mb-2 text-center">Propiedades por Ciudad</h2>
            <div className="sec-line">
              <span className="sec-line1" />
              <span className="sec-line2" />
            </div>
            <p className="mb-0 text-center">
              Explorá propiedades en las ciudades más buscadas.
            </p>
          </div>
          <Slider {...settings} className="city-slider">
            {cities.map((city, i) => (
              <div key={city.name} className="px-2">
                <div
                  className="city-item aos"
                  data-aos="fade-up"
                  data-aos-duration={1000 + i * 100}
                >
                  <Link
                    to={`${all_routes.buyPropertyGridSidebar}?city=${encodeURIComponent(city.name)}`}
                    className="d-block text-center"
                  >
                    <div
                      className="city-icon bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                      style={{ width: 80, height: 80 }}
                    >
                      <i className="material-icons-outlined text-primary" style={{ fontSize: 36 }}>
                        location_city
                      </i>
                    </div>
                    <h6 className="mb-1">{city.name}</h6>
                    <p className="text-muted mb-0">
                      {city.count} propiedad{city.count !== 1 ? "es" : ""}
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

export default CitiesSection;
