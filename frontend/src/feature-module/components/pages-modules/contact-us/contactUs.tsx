import { useState, useEffect } from "react";
import Breadcrumb from "../../../../core/common/Breadcrumb/breadcrumb";
import publicService from "../../../../services/publicService";

const ContactUs = () => {
  const [config, setConfig] = useState<{
    name: string; phone: string; email: string; address: string; whatsapp: string;
  }>({ name: "", phone: "", email: "", address: "", whatsapp: "" });

  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", asunto: "", mensaje: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const res = await publicService.getSiteConfig();
        if (m) setConfig(res);
      } catch { /* keep defaults */ }
    })();
    return () => { m = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.mensaje.trim()) {
      setError("Nombre y mensaje son obligatorios.");
      return;
    }
    try {
      setSending(true);
      setError("");
      await publicService.sendContactMessage(form);
      setSent(true);
      setForm({ nombre: "", email: "", telefono: "", asunto: "", mensaje: "" });
    } catch {
      setError("No se pudo enviar el mensaje. Intentá de nuevo.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="page-wrapper">
        <Breadcrumb
          title="Contacto"
          paths={[{ label: "Contacto", active: true }]}
        />
        <div className="content">
          <div className="container">
            <div className="row row-gap-4">
              {/* Contact Info */}
              <div className="col-lg-4">
                <div className="card mb-4">
                  <div className="card-body">
                    <h5 className="mb-3">Información de Contacto</h5>
                    {config.address && (
                      <div className="d-flex align-items-start mb-3">
                        <i className="material-icons-outlined text-primary me-3 mt-1">location_on</i>
                        <div>
                          <h6 className="mb-1">Dirección</h6>
                          <p className="text-muted mb-0">{config.address}</p>
                        </div>
                      </div>
                    )}
                    {config.phone && (
                      <div className="d-flex align-items-start mb-3">
                        <i className="material-icons-outlined text-primary me-3 mt-1">phone</i>
                        <div>
                          <h6 className="mb-1">Teléfono</h6>
                          <p className="text-muted mb-0">
                            <a href={`tel:${config.phone}`}>{config.phone}</a>
                          </p>
                        </div>
                      </div>
                    )}
                    {config.email && (
                      <div className="d-flex align-items-start mb-3">
                        <i className="material-icons-outlined text-primary me-3 mt-1">email</i>
                        <div>
                          <h6 className="mb-1">Email</h6>
                          <p className="text-muted mb-0">
                            <a href={`mailto:${config.email}`}>{config.email}</a>
                          </p>
                        </div>
                      </div>
                    )}
                    {config.whatsapp && (
                      <div className="d-flex align-items-start">
                        <i className="material-icons-outlined text-success me-3 mt-1">chat</i>
                        <div>
                          <h6 className="mb-1">WhatsApp</h6>
                          <p className="text-muted mb-0">
                            <a
                              href={`https://wa.me/${config.whatsapp.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {config.whatsapp}
                            </a>
                          </p>
                        </div>
                      </div>
                    )}
                    {!config.phone && !config.email && !config.address && (
                      <p className="text-muted mb-0">
                        Información de contacto no disponible en este momento.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {/* Contact Form */}
              <div className="col-lg-8">
                <div className="card">
                  <div className="card-body">
                    <h5 className="mb-3">Envianos un mensaje</h5>
                    {sent ? (
                      <div className="text-center py-4">
                        <i
                          className="material-icons-outlined text-success"
                          style={{ fontSize: 64 }}
                        >
                          check_circle
                        </i>
                        <h5 className="mt-3">¡Mensaje enviado!</h5>
                        <p className="text-muted">
                          Nos pondremos en contacto a la brevedad.
                        </p>
                        <button
                          className="btn btn-dark"
                          onClick={() => setSent(false)}
                        >
                          Enviar otro mensaje
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit}>
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Nombre *</label>
                            <input
                              type="text"
                              className="form-control"
                              value={form.nombre}
                              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                              required
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Email</label>
                            <input
                              type="email"
                              className="form-control"
                              value={form.email}
                              onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Teléfono</label>
                            <input
                              type="text"
                              className="form-control"
                              value={form.telefono}
                              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Asunto</label>
                            <input
                              type="text"
                              className="form-control"
                              value={form.asunto}
                              onChange={(e) => setForm({ ...form, asunto: e.target.value })}
                            />
                          </div>
                          <div className="col-12 mb-3">
                            <label className="form-label">Mensaje *</label>
                            <textarea
                              className="form-control"
                              rows={5}
                              value={form.mensaje}
                              onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        {error && (
                          <div className="alert alert-danger py-2">{error}</div>
                        )}
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={sending}
                        >
                          {sending ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" />
                              Enviando...
                            </>
                          ) : (
                            "Enviar Mensaje"
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactUs;
