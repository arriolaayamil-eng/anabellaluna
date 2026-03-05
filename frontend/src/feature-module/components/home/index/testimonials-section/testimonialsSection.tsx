import Slider from "react-slick";
import { useState, useEffect } from "react";
import publicService from "../../../../../services/publicService";

const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState<
    { id: string; name: string; avatar: string; text: string; rating: number }[]
  >([]);

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const res = await publicService.getTestimonials();
        if (m) setTestimonials(res.items || []);
      } catch {
        /* keep empty */
      }
    })();
    return () => { m = false; };
  }, []);

  const settings = {
    dots: true,
    infinite: testimonials.length > 1,
    speed: 500,
    slidesToShow: Math.min(testimonials.length, 3),
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 5000,
    responsive: [
      { breakpoint: 992, settings: { slidesToShow: Math.min(testimonials.length, 2) } },
      { breakpoint: 768, settings: { slidesToShow: 1 } },
    ],
  };

  if (testimonials.length === 0) return null;

  return (
    <section className="testimonial-section section-padding">
      <div className="container">
        <div
          className="section-heading aos"
          data-aos="fade-down"
          data-aos-duration={1000}
        >
          <h2 className="mb-2 text-center">Lo que Dicen Nuestros Clientes</h2>
          <div className="sec-line">
            <span className="sec-line1" />
            <span className="sec-line2" />
          </div>
          <p className="mb-0 text-center">
            Experiencias reales de quienes confiaron en nosotros.
          </p>
        </div>
        <Slider {...settings} className="testimonial-slider">
          {testimonials.map((t) => (
            <div key={t.id} className="px-2">
              <div className="testimonial-item">
                <div className="d-flex align-items-center mb-3">
                  {t.avatar ? (
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="avatar avatar-lg rounded-circle me-3"
                    />
                  ) : (
                    <div className="avatar avatar-lg rounded-circle bg-light d-flex align-items-center justify-content-center me-3">
                      <i className="material-icons-outlined text-muted">person</i>
                    </div>
                  )}
                  <div>
                    <h6 className="mb-1">{t.name}</h6>
                    <div className="d-flex align-items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <i
                          key={i}
                          className="material-icons-outlined fs-16"
                          style={{ color: i < t.rating ? "#f5a623" : "#ddd" }}
                        >
                          star
                        </i>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="mb-0 text-muted">{t.text}</p>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default TestimonialsSection;
