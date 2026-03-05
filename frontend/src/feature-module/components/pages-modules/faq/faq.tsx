import { useState, useEffect } from "react";
import Breadcrumb from "../../../../core/common/Breadcrumb/breadcrumb";
import publicService from "../../../../services/publicService";

const Faq = () => {
  const [faqs, setFaqs] = useState<{ id: string; question: string; answer: string; category: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const res = await publicService.getFaqs();
        if (m) setFaqs(res.items || []);
      } catch { /* keep empty */ }
      finally { if (m) setIsLoading(false); }
    })();
    return () => { m = false; };
  }, []);

  return (
    <>
      <div className="page-wrapper">
        <Breadcrumb title="Preguntas Frecuentes" paths={[{ label: "FAQ", active: true }]} />
        <div className="content">
          <div className="container">
            <div className="section-heading text-center mb-4">
              <h2>Preguntas Frecuentes</h2>
              <div className="sec-line">
                <span className="sec-line1" />
                <span className="sec-line2" />
              </div>
              <p>Respuestas a las consultas más comunes.</p>
            </div>
            {isLoading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            )}
            {!isLoading && faqs.length === 0 && (
              <div className="text-center py-5">
                <i className="material-icons-outlined fs-1 text-muted">help_outline</i>
                <p className="mt-2 text-muted">No hay preguntas frecuentes disponibles.</p>
              </div>
            )}
            {!isLoading && faqs.length > 0 && (
              <div className="row justify-content-center">
                <div className="col-lg-8">
                  <div className="accordion" id="faqPageAccordion">
                    {faqs.map((faq, i) => (
                      <div key={faq.id} className="accordion-item">
                        <h2 className="accordion-header" id={`faqH-${faq.id}`}>
                          <button
                            className={`accordion-button ${i !== 0 ? "collapsed" : ""}`}
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target={`#faqC-${faq.id}`}
                            aria-expanded={i === 0 ? "true" : "false"}
                          >
                            {faq.question}
                          </button>
                        </h2>
                        <div
                          id={`faqC-${faq.id}`}
                          className={`accordion-collapse collapse ${i === 0 ? "show" : ""}`}
                          data-bs-parent="#faqPageAccordion"
                        >
                          <div className="accordion-body text-muted">{faq.answer}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Faq;
