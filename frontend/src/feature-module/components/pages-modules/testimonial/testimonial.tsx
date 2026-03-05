import { useState, useEffect } from "react";
import Breadcrumb from "../../../../core/common/Breadcrumb/breadcrumb";
import publicService from "../../../../services/publicService";

const Testimonial = () => {
  const [testimonials, setTestimonials] = useState<
    { id: string; name: string; avatar: string; text: string; rating: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const res = await publicService.getTestimonials();
        if (m) setTestimonials(res.items || []);
      } catch { /* keep empty */ }
      finally { if (m) setIsLoading(false); }
    })();
    return () => { m = false; };
  }, []);

  return (
    <>
      <div className="page-wrapper">
        <Breadcrumb title="Testimonios" paths={[{ label: "Testimonios", active: true }]} />
        <div className="content">
          <div className="container">
            <div className="section-heading text-center mb-4">
              <h2>Lo que Dicen Nuestros Clientes</h2>
              <div className="sec-line">
                <span className="sec-line1" />
                <span className="sec-line2" />
              </div>
              <p>Experiencias reales de quienes confiaron en nosotros.</p>
            </div>
            {isLoading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            )}
            {!isLoading && testimonials.length === 0 && (
              <div className="text-center py-5">
                <i className="material-icons-outlined fs-1 text-muted">rate_review</i>
                <p className="mt-2 text-muted">No hay testimonios disponibles.</p>
              </div>
            )}
            {!isLoading && testimonials.length > 0 && (
              <div className="row row-gap-4">
                {testimonials.map((t) => (
                  <div key={t.id} className="col-lg-4 col-md-6">
                    <div className="card h-100">
                      <div className="card-body">
                        <div className="d-flex align-items-center mb-3">
                          {t.avatar ? (
                            <img src={t.avatar} alt={t.name} className="avatar avatar-lg rounded-circle me-3" />
                          ) : (
                            <div className="avatar avatar-lg rounded-circle bg-light d-flex align-items-center justify-content-center me-3">
                              <i className="material-icons-outlined text-muted">person</i>
                            </div>
                          )}
                          <div>
                            <h6 className="mb-1">{t.name}</h6>
                            <div className="d-flex align-items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <i key={i} className="material-icons-outlined fs-16" style={{ color: i < t.rating ? "#f5a623" : "#ddd" }}>star</i>
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-muted mb-0">{t.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Testimonial;
