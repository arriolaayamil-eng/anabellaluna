import { Link } from "react-router";
import Breadcrumb from "../../../../core/common/Breadcrumb/breadcrumb";
import { useState, useEffect } from "react";
import { all_routes } from "../../../routes/all_routes";
import publicService from "../../../../services/publicService";
import userService from "../../../../services/userService";

const Checkout = () => {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const currentUser = userService.getCurrentUser();
  const isLoggedIn = !!currentUser;

  const [form, setForm] = useState({
    fullName: currentUser?.nombre || "",
    email: currentUser?.email || currentUser?.username || "",
    phone: currentUser?.telefono || "",
    address: currentUser?.direccion || "",
    notes: "",
  });

  useEffect(() => {
    if (!isLoggedIn) return;
    let isMounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await publicService.getCart();
        if (!isMounted) return;
        setCartItems(res.items || []);
      } catch {
        if (!isMounted) return;
        setCartItems([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [isLoggedIn]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await publicService.createBookingRequest({
        fullName: form.fullName.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
      });
      setSuccess(true);
      // Clear cart after successful booking
      await publicService.clearCart();
      setCartItems([]);
    } catch (err: any) {
      setError(err.message || "Error al enviar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <>
        <div className="page-wrapper">
          <Breadcrumb
            title="Solicitud de Reserva"
            paths={[{ label: "Solicitud de Reserva", active: true }]}
          />
          <div className="content">
            <div className="container">
              <div className="text-center py-5">
                <i className="material-icons-outlined fs-1 text-muted">
                  lock
                </i>
                <p className="mt-2 text-muted">
                  Iniciá sesión para continuar con la reserva.
                </p>
                <Link to={all_routes.signin} className="btn btn-primary">
                  Iniciar Sesión
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (success) {
    return (
      <>
        <div className="page-wrapper">
          <Breadcrumb
            title="Solicitud Enviada"
            paths={[{ label: "Solicitud de Reserva", active: true }]}
          />
          <div className="content">
            <div className="container">
              <div className="text-center py-5">
                <i
                  className="material-icons-outlined text-success"
                  style={{ fontSize: 64 }}
                >
                  check_circle
                </i>
                <h4 className="mt-3">¡Solicitud enviada con éxito!</h4>
                <p className="text-muted">
                  Nuestro equipo se pondrá en contacto contigo a la brevedad
                  para coordinar los detalles de la reserva.
                </p>
                <Link to={all_routes.index} className="btn btn-dark me-2">
                  Volver al Inicio
                </Link>
                <Link
                  to={all_routes.rentPropertyGridSidebar}
                  className="btn btn-outline-dark"
                >
                  Seguir Explorando
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-wrapper">
        <Breadcrumb
          title="Solicitud de Reserva"
          paths={[{ label: "Solicitud de Reserva", active: true }]}
        />
        <div className="content">
          <div className="container">
            <div className="row">
              <div className="col-lg-12 mx-auto">
                <div className="checkout-wrap">
                  <div className="row row-gap-3">
                    <div className="col-xl-8">
                      <form onSubmit={handleSubmit}>
                        <div className="checkout-item-01">
                          <h6>Información Personal</h6>
                          <div className="row">
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Nombre Completo
                                  <span className="text-danger ms-1">*</span>
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  name="fullName"
                                  value={form.fullName}
                                  onChange={handleChange}
                                  placeholder="Tu nombre completo"
                                  required
                                />
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">Email</label>
                                <input
                                  type="email"
                                  className="form-control"
                                  name="email"
                                  value={form.email}
                                  onChange={handleChange}
                                  placeholder="tu@email.com"
                                />
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">Teléfono</label>
                                <input
                                  type="tel"
                                  className="form-control"
                                  name="phone"
                                  value={form.phone}
                                  onChange={handleChange}
                                  placeholder="+54 11 1234-5678"
                                />
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">Dirección</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  name="address"
                                  value={form.address}
                                  onChange={handleChange}
                                  placeholder="Tu dirección"
                                />
                              </div>
                            </div>
                            <div className="col-12">
                              <div className="mb-3">
                                <label className="form-label">
                                  Notas adicionales
                                </label>
                                <textarea
                                  className="form-control"
                                  name="notes"
                                  value={form.notes}
                                  onChange={handleChange}
                                  rows={3}
                                  placeholder="Algún comentario o pedido especial..."
                                />
                              </div>
                            </div>
                          </div>

                          {error && (
                            <div className="alert alert-danger">{error}</div>
                          )}

                          <button
                            type="submit"
                            className="btn btn-success btn-lg w-100"
                            disabled={submitting || cartItems.length === 0}
                          >
                            {submitting ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm me-2"
                                  role="status"
                                />
                                Enviando...
                              </>
                            ) : (
                              "Enviar Solicitud de Reserva"
                            )}
                          </button>

                          <p className="text-muted text-center mt-3 fs-14">
                            No se realizará ningún cobro. Nuestro equipo se
                            comunicará contigo para coordinar los detalles.
                          </p>
                        </div>
                      </form>
                    </div>

                    <div className="col-xl-4">
                      <div className="card">
                        <div className="card-body">
                          <h6 className="mb-3">Resumen del Carrito</h6>

                          {isLoading && (
                            <div className="text-center py-3">
                              <div
                                className="spinner-border spinner-border-sm text-primary"
                                role="status"
                              />
                            </div>
                          )}

                          {!isLoading && cartItems.length === 0 && (
                            <p className="text-muted text-center">
                              Tu carrito está vacío.
                            </p>
                          )}

                          {!isLoading &&
                            cartItems.map((item) => {
                              const prop = item.property || {};
                              const meta = prop.metadata || {};
                              const title =
                                prop.title || meta.titulo || "Propiedad";
                              const address =
                                prop.address || meta.direccion || "";

                              return (
                                <div
                                  key={item._id}
                                  className="d-flex align-items-start gap-2 mb-3 pb-3 border-bottom"
                                >
                                  <i className="material-icons-outlined text-primary mt-1">
                                    home
                                  </i>
                                  <div>
                                    <p className="fw-semibold mb-0">{title}</p>
                                    {address && (
                                      <p className="fs-14 text-muted mb-0">
                                        {address}
                                      </p>
                                    )}
                                    {item.checkIn && (
                                      <p className="fs-14 text-muted mb-0">
                                        {new Date(
                                          item.checkIn
                                        ).toLocaleDateString("es-AR")}
                                        {item.checkOut &&
                                          ` → ${new Date(item.checkOut).toLocaleDateString("es-AR")}`}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                          <div className="d-flex align-items-center justify-content-between mt-3">
                            <strong>Total propiedades</strong>
                            <strong>{cartItems.length}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
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

export default Checkout;
