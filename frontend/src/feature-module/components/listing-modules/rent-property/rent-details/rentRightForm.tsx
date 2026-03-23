import { useState } from "react";
import { Link } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import StickyBox from "react-sticky-box";
import publicService from "../../../../../services/publicService";

type AgentInfo = {
  id: string;
  name: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
};

type RentRightFormProps = {
  agent?: AgentInfo;
  propertySlug?: string;
};

const RentRightForm = ({ agent, propertySlug }: RentRightFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = async () => {
    if (!propertySlug) {
      setFeedback({ type: "error", message: "Error: propiedad no identificada" });
      return;
    }
    if (!name.trim()) {
      setFeedback({ type: "error", message: "El nombre es obligatorio" });
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setFeedback({ type: "error", message: "Se requiere email o teléfono" });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await publicService.createEnquiry({
        propertySlug,
        fullName: name,
        email: email || undefined,
        phone: phone || undefined,
        message: message || undefined,
      });
      setFeedback({ type: "success", message: "Tu consulta fue enviada" });
      setMessage("");
    } catch (e: any) {
      setFeedback({ type: "error", message: e?.message || "No se pudo enviar la consulta" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <StickyBox offsetTop={80} offsetBottom={20}>
      {/* Items-1 */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Datos del Agente</h5>
        </div>
        <div className="card-body">
          <div className="card bg-light border-0 rounded shadow-none custom-btn">
            <div className="card-body">
              <div className="d-flex align-items-center gap-2">
                <div className="avatar avatar-lg">
                  <ImageWithBasePath
                    src={agent?.avatarUrl || "assets/img/users/user-06.jpg"}
                    alt="image"
                    className="rounded-circle"
                  />
                </div>
                <div>
                  <h6 className="mb-1 fs-16 fw-semibold">
                    <Link className="d-block w-100" to="#">
                      {agent?.name || ""}
                    </Link>
                  </h6>
                  <p className="mb-0 fs-14 text-body">Agente Inmobiliario</p>
                </div>
              </div>
            </div>
          </div>
          {/* end card */}
          {(agent?.phone || agent?.email) && (
            <div className="border p-2 rounded mb-0">
              {agent?.phone ? (
                <Link
                  to="#"
                  className="d-block mb-3 pb-3 border-bottom text-body d-flex align-items-center"
                >
                  <i className="material-icons-outlined text-body me-2 fs-16 p-1 bg-light rounded text-dark">
                    phone
                  </i>
                  {agent.phone}
                </Link>
              ) : null}
              {agent?.email ? (
                <Link to="#" className="d-block text-body d-flex align-items-center">
                  <i className="material-icons-outlined text-body me-2 fs-16 p-1 bg-light rounded text-dark">
                    email
                  </i>
                  {agent.email}
                </Link>
              ) : null}
            </div>
          )}
        </div>
        {/* end card body*/}
      </div>
      {/* end card */}
      {/* Items-2 */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Realizar Consulta</h5>
        </div>
        <div className="card-body">
          {feedback && (
            <div
              className={`mb-3 rounded-lg border px-3 py-2 fs-14 ${
                feedback.type === "success"
                  ? "border-success bg-success-subtle text-success"
                  : "border-danger bg-danger-subtle text-danger"
              }`}
            >
              {feedback.message}
            </div>
          )}
          <div className="mb-3">
            <label className="form-label fw-semibold"> Nombre </label>
            <input
              type="text"
              className="form-control"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold"> Email </label>
            <input
              type="email"
              className="form-control"
              placeholder="Tu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold"> Teléfono </label>
            <input
              type="text"
              className="form-control"
              placeholder="Tu teléfono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="form-label fw-semibold">Mensaje</label>
            <textarea
              className="form-control"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div>
            <button
              type="button"
              className="btn btn-dark w-100 py-2 fs-14"
              disabled={isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </div>
        {/* end card body*/}
      </div>
      {/* end card */}
    </StickyBox>
  );
};

export default RentRightForm;
