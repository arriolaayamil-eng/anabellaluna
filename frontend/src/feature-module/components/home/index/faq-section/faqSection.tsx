import { useState, useEffect } from "react";
import publicService from "../../../../../services/publicService";

const FaqSection = () => {
  const [faqs, setFaqs] = useState<{ id: string; question: string; answer: string }[]>([]);

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const res = await publicService.getFaqs();
        if (m) setFaqs(res.items || []);
      } catch { /* keep empty */ }
    })();
    return () => { m = false; };
  }, []);

  if (faqs.length === 0) return null;

  return (
    <section className="faq-section section-padding">
      <div className="container">
        <div
          className="section-heading aos"
          data-aos="fade-down"
          data-aos-duration={1000}
        >
          <h2 className="mb-2 text-center">Preguntas Frecuentes</h2>
          <div className="sec-line">
            <span className="sec-line1" />
            <span className="sec-line2" />
          </div>
          <p className="mb-0 text-center">
            Respuestas a las consultas más comunes de nuestros clientes.
          </p>
        </div>
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="accordion" id="faqAccordion">
              {faqs.map((faq, i) => (
                <div key={faq.id} className="accordion-item">
                  <h2 className="accordion-header" id={`heading-${faq.id}`}>
                    <button
                      className={`accordion-button ${i !== 0 ? "collapsed" : ""}`}
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#collapse-${faq.id}`}
                      aria-expanded={i === 0 ? "true" : "false"}
                      aria-controls={`collapse-${faq.id}`}
                    >
                      {faq.question}
                    </button>
                  </h2>
                  <div
                    id={`collapse-${faq.id}`}
                    className={`accordion-collapse collapse ${i === 0 ? "show" : ""}`}
                    aria-labelledby={`heading-${faq.id}`}
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body text-muted">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
