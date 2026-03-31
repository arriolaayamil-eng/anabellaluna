import { Link } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import StickyBox from "react-sticky-box";
import { TimePicker, type TimePickerProps } from "antd";
import { useState } from "react";
import dayjs from "dayjs";
import publicService from "../../../../../services/publicService";

type AgentInfo = {
  id: string;
  name: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
};

type BuyLeftFormProps = {
  agent?: AgentInfo;
  propertySlug?: string;
};

const BuyLeftForm = ({ agent, propertySlug }: BuyLeftFormProps) => {
  const [activeTab, setActiveTab] = useState<"info" | "schedule">("info");

  const [infoName, setInfoName] = useState("");
  const [infoEmail, setInfoEmail] = useState("");
  const [infoPhone, setInfoPhone] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const [visitDay, setVisitDay] = useState("");
  const [visitTime, setVisitTime] = useState<string>("");
  const [visitName, setVisitName] = useState("");
  const [visitEmail, setVisitEmail] = useState("");
  const [visitPhone, setVisitPhone] = useState("");
  const [visitMessage, setVisitMessage] = useState("");

  const [isSubmittingInfo, setIsSubmittingInfo] = useState(false);
  const [isSubmittingVisit, setIsSubmittingVisit] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const onChangeTime: TimePickerProps["onChange"] = (value) => {
    setVisitTime(value ? value.format("HH:mm") : "");
  };

  const validateContact = (fullName: string, email: string, phone: string) => {
    if (!String(fullName || "").trim()) return "El nombre es obligatorio";
    const e = String(email || "").trim();
    const p = String(phone || "").trim();
    if (!e && !p) return "Se requiere email o teléfono";
    return "";
  };

  const submitInfo = async () => {
    if (!propertySlug) {
      setFeedback({ type: "error", message: "Error: propiedad no identificada" });
      return;
    }
    const msg = validateContact(infoName, infoEmail, infoPhone);
    if (msg) {
      setFeedback({ type: "error", message: msg });
      return;
    }

    setIsSubmittingInfo(true);
    setFeedback(null);
    try {
      await publicService.createEnquiry({
        propertySlug,
        fullName: infoName,
        email: infoEmail || undefined,
        phone: infoPhone || undefined,
        message: infoMessage || undefined,
      });
      setFeedback({ type: "success", message: "Tu consulta fue enviada" });
      setInfoMessage("");
    } catch (e: any) {
      setFeedback({ type: "error", message: e?.message || "No se pudo enviar la consulta" });
    } finally {
      setIsSubmittingInfo(false);
    }
  };

  const submitVisit = async () => {
    if (!propertySlug) {
      setFeedback({ type: "error", message: "Error: propiedad no identificada" });
      return;
    }
    const msg = validateContact(visitName, visitEmail, visitPhone);
    if (msg) {
      setFeedback({ type: "error", message: msg });
      return;
    }
    if (!visitDay) {
      setFeedback({ type: "error", message: "Selecciona un día" });
      return;
    }
    if (!visitTime) {
      setFeedback({ type: "error", message: "Selecciona un horario" });
      return;
    }

    const startIso = dayjs(`${visitDay} ${visitTime}`, "YYYY-MM-DD HH:mm", true);
    if (!startIso.isValid()) {
      setFeedback({ type: "error", message: "Fecha u hora inválida" });
      return;
    }
    const endIso = startIso.add(1, "hour");

    setIsSubmittingVisit(true);
    setFeedback(null);
    try {
      await publicService.scheduleVisit({
        propertySlug,
        fullName: visitName,
        email: visitEmail || undefined,
        phone: visitPhone || undefined,
        message: visitMessage || undefined,
        start: startIso.toISOString(),
        end: endIso.toISOString(),
      });
      setFeedback({ type: "success", message: "Visita programada" });
      setVisitMessage("");
    } catch (e: any) {
      setFeedback({ type: "error", message: e?.message || "No se pudo programar la visita" });
    } finally {
      setIsSubmittingVisit(false);
    }
  };
  return (
    <>
      {/* col end */}

      <div className="col-xl-4 d-none d-xl-block theiaStickySidebar buy-details-item">
        {/* Items-1 */}
        <StickyBox offsetTop={80} offsetBottom={20}>
          {/* Items-1 */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Consulta</h5>
            </div>
            <div className="card-body">
              {feedback ? (
                <div
                  className={`mb-3 rounded-lg border px-3 py-2 fs-14 ${
                    feedback.type === "success"
                      ? "border-success bg-success-subtle text-success"
                      : "border-danger bg-danger-subtle text-danger"
                  }`}
                >
                  {feedback.message}
                </div>
              ) : null}
              {/* Bootstrap Tabs */}
              <div className="d-flex align-items-center justify-content-between gap-2 custom-btn flex-wrap">
                <Link
                  to="#"
                  className={`btn d-flex align-center fs-14 fw-semibold justify-content-center ${
                    activeTab === "info"
                      ? "btn-primary"
                      : "btn-outline-dark text-center"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("info");
                  }}
                >
                  <i className="material-icons-outlined fs-14 me-1 d-flex align-center">
                    info
                  </i>
                  Solicitar Info{" "}
                </Link>
                <Link
                  to="#"
                  className={`btn d-flex align-center fs-14 fw-semibold justify-content-center ${
                    activeTab === "schedule"
                      ? "btn-primary"
                      : "btn-outline-dark text-center"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("schedule");
                  }}
                >
                  <i className="material-icons-outlined fs-14 me-1">videocam</i>
                  Programar Visita{" "}
                </Link>
              </div>

              <div className="tab-content">
                <div
                  className={`tab-pane fade ${
                    activeTab === "info" ? "show active" : ""
                  }`}
                >
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
                            {agent?.name || ""}
                          </h6>
                          <p className="mb-0 fs-14 text-body">
                            {" "}
                            Agente Inmobiliario{" "}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* end card */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold"> Nombre </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tu nombre"
                      value={infoName}
                      onChange={(e) => setInfoName(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold"> Email </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tu email"
                      value={infoEmail}
                      onChange={(e) => setInfoEmail(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold"> Teléfono </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tu teléfono"
                      value={infoPhone}
                      onChange={(e) => setInfoPhone(e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      Mensaje
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={infoMessage}
                      onChange={(e) => setInfoMessage(e.target.value)}
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      className="btn btn-dark w-100 py-2 fs-14"
                      onClick={submitInfo}
                      disabled={isSubmittingInfo}
                    >
                      Enviar
                    </button>
                  </div>
                </div>
                <div
                  className={`tab-pane fade ${
                    activeTab === "schedule" ? "show active" : ""
                  }`}
                >
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
                            {agent?.name || ""}
                          </h6>
                          <p className="mb-0 fs-14 text-body">
                            {" "}
                            Agente Inmobiliario{" "}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* end card */}
                  <div className="select-date-item">
                    <h6 className="fs-16 fw-semibold mb-2"> Seleccionar Día </h6>
                    <div className="d-flex align-items-center justify-content-between gap-1 flex-wrap">
                      <div className="d-flex flex-column gap-1 border">
                        <p className="mb-0"> Lun </p>
                        <h5 className="mb-0"> 21 </h5>
                        <p className="mb-0"> Feb </p>
                      </div>
                      <div className="d-flex flex-column gap-1 border">
                        <p className="mb-0"> Mar </p>
                        <h5 className="mb-0"> 22 </h5>
                        <p className="mb-0"> Feb </p>
                      </div>
                      <div className="d-flex flex-column gap-1 border">
                        <p className="mb-0"> Mié </p>
                        <h5 className="mb-0"> 23 </h5>
                        <p className="mb-0"> Feb </p>
                      </div>
                      <div className="d-flex flex-column gap-1 border">
                        <p className="mb-0"> Jue </p>
                        <h5 className="mb-0"> 24 </h5>
                        <p className="mb-0"> Feb </p>
                      </div>
                      <div className="d-flex flex-column gap-1 border">
                        <p className="mb-0"> Vie </p>
                        <h5 className="mb-0"> 25 </h5>
                        <p className="mb-0"> Feb </p>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold"> Fecha </label>
                    <input
                      type="date"
                      className="form-control"
                      value={visitDay}
                      onChange={(e) => setVisitDay(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      {" "}
                      Seleccionar Horario{" "}
                    </label>
                    <div className="input-group w-auto input-group-flat">
                      <TimePicker
                        className="form-control"
                        onChange={onChangeTime}
                        defaultOpenValue={dayjs("00:00:00", "HH:mm:ss")}
                        suffixIcon={null}
                      />

                      <span className="input-group-text">
                        <i className="material-icons-outlined text-dark">
                          schedule
                        </i>
                      </span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold"> Nombre </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tu nombre"
                      value={visitName}
                      onChange={(e) => setVisitName(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold"> Email </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tu email"
                      value={visitEmail}
                      onChange={(e) => setVisitEmail(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold"> Teléfono </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tu teléfono"
                      value={visitPhone}
                      onChange={(e) => setVisitPhone(e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      {" "}
                      Mensaje{" "}
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={visitMessage}
                      onChange={(e) => setVisitMessage(e.target.value)}
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      className="btn btn-dark w-100 py-2 fs-14"
                      onClick={submitVisit}
                      disabled={isSubmittingVisit}
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* end card body*/}
          </div>
          {/* end card */}
          {/* Items-2 */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Datos del Agente</h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="avatar avatar-lg">
                  <ImageWithBasePath
                    src={agent?.avatarUrl || "assets/img/users/user-06.jpg"}
                    alt="image"
                    className="rounded-circle"
                  />
                </div>
                <div>
                  <h6 className="mb-1 fs-16 fw-semibold">{agent?.name || ""}</h6>
                </div>
              </div>
              {(agent?.phone || agent?.email) && (
                <ul className="mb-0">
                  {agent?.phone ? (
                    <li className="d-flex align-center justify-content-between flex-wrap gap-1 mb-3">
                      <span className="text-body">Teléfono</span>
                      {agent.phone}
                    </li>
                  ) : null}
                  {agent?.email ? (
                    <li className="d-flex align-center justify-content-between flex-wrap gap-1 mb-0">
                      <span className="text-body">Correo</span>
                      {agent.email}
                    </li>
                  ) : null}
                </ul>
              )}
            </div>
            {/* end card body*/}
          </div>
          {/* end card */}
          {/* Items-3 */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Compartir Propiedad</h5>
            </div>
            <div className="card-body">
              <div className="buy-social-icons-items d-flex align-center gap-2 flex-wrap">
                <Link to="#" className="item-1">
                  <i className="fa-brands fa-facebook-f" />
                </Link>
                <Link to="#" className="item-2">
                  <i className="fa-brands fa-instagram" />
                </Link>
                <Link to="#" className="item-3">
                  <i className="fa-brands fa-behance" />
                </Link>
                <Link to="#" className="item-4">
                  <i className="fa-brands fa-twitter" />
                </Link>
                <Link to="#" className="item-5">
                  <i className="fa-brands fa-pinterest-p" />
                </Link>
                <Link to="#" className="item-6">
                  <i className="fa-brands fa-linkedin" />
                </Link>
              </div>
            </div>
            {/* end card body*/}
          </div>
          {/* end card */}
          {/* Items-4 */}
          {false && (
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Mortarage Calculator</h5>
            </div>
            <div className="card-body">
              <form>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Total Amount ($)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Your Total Amount "
                    defaultValue={15000}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Down Payment ($)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Your Down Payment"
                    defaultValue={10000}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Loan Terms (Years)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Your Loan Terms"
                    defaultValue={3}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Interest Rate (%)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Your Interest Rate"
                    defaultValue={15}
                  />
                </div>
                <div className="mb-0">
                  <label className="form-label fw-semibold"> Min Sqft </label>
                  <input type="text" className="form-control" />
                </div>
              </form>
            </div>
            {/* end card body*/}
          </div>
          )}
          {/* end card */}
          {/* Items-5 */}
          {false && (
          <div className="card mb-0">
            <div className="custom-map position-relative">
              <Link
                to="#"
                className="btn btn-dark fw-medium"
              >
                View Location
              </Link>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d9582106.12236644!2d-15.012343587457918!3d54.10244278649341!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x25a3b1142c791a9%3A0xc4f8a0433288257a!2sUnited%20Kingdom!5e0!3m2!1sen!2sin!4v1747587865989!5m2!1sen!2sin"
                width={600}
                height={450}
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="card-body">
              <h6 className="mb-3"> Nearby Landmarks &amp; Visits </h6>
              <p className="mb-2 text-body">
                <i className="fa-regular fa-circle-check fs-16 me-2 text-body" />
                Near By Statue of Liberty
              </p>
              <p className="mb-2 text-body">
                <i className="fa-regular fa-circle-check fs-16 me-2 text-body" />
                The Metropolitan Museum of Art
              </p>
              <p className="mb-0 text-body">
                <i className="fa-regular fa-circle-check fs-16 me-2 text-body" />
                Yellowstone National Park
              </p>
            </div>
            {/* end card body*/}
          </div>
          )}
          {/* end card */}
        </StickyBox>
      </div>

      {/* col end */}
    </>
  );
};

export default BuyLeftForm;
