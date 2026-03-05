import { Link } from "react-router";
import Breadcrumb from "../../../core/common/Breadcrumb/breadcrumb";
import ImageWithBasePath from "../../../core/imageWithBasePath";
import StickyBox from "react-sticky-box";
import { useState, useEffect } from "react";
import { all_routes } from "../../routes/all_routes";
import publicService from "../../../services/publicService";
import userService from "../../../services/userService";

const formatPrice = (amount?: number, currency?: string) => {
  if (!amount) return "$0";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency || "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
};

const Cart = () => {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const isLoggedIn = !!userService.getCurrentUser();

  useEffect(() => {
    if (!isLoggedIn) return;
    let isMounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await publicService.getCart();
        if (!isMounted) return;
        setItems(res.items || []);
      } catch {
        if (!isMounted) return;
        setItems([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [isLoggedIn]);

  const handleRemove = async (itemId: string) => {
    try {
      await publicService.removeCartItem(itemId);
      setItems((prev) => prev.filter((i) => i._id !== itemId));
    } catch (err) {
      console.error("Error removing cart item", err);
    }
  };

  const handleClearCart = async () => {
    try {
      setClearing(true);
      await publicService.clearCart();
      setItems([]);
    } catch (err) {
      console.error("Error clearing cart", err);
    } finally {
      setClearing(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <>
        <div className="page-wrapper">
          <Breadcrumb title="Carrito" paths={[{ label: "Carrito", active: true }]} />
          <div className="content">
            <div className="container">
              <div className="text-center py-5">
                <i className="material-icons-outlined fs-1 text-muted">shopping_cart</i>
                <p className="mt-2 text-muted">Iniciá sesión para ver tu carrito.</p>
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

  return (
    <>
      <div className="page-wrapper">
        <Breadcrumb title="Carrito" paths={[{ label: "Carrito", active: true }]} />
        <div className="content">
          <div className="container">
            <div className="row" id="cart-wrap">
              <div className="col-lg-12 mx-auto">
                <div className="cart-item-wrap">
                  <div className="row row-gap-3">
                    <div className="col-xl-9">
                      <div className="cart-item-01">
                        <div className="cart-title">
                          <div className="d-flex align-items-center justify-content-between">
                            <h5>
                              {items.length} Propiedad{items.length !== 1 ? "es" : ""}
                            </h5>
                            {items.length > 0 && (
                              <Link
                                to="#"
                                className="btn btn-danger"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleClearCart();
                                }}
                              >
                                <i className="material-icons-outlined">delete</i>
                                {clearing ? "Limpiando..." : "Vaciar Carrito"}
                              </Link>
                            )}
                          </div>
                          <hr />
                        </div>

                        {isLoading && (
                          <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Cargando...</span>
                            </div>
                          </div>
                        )}

                        {!isLoading && items.length === 0 && (
                          <div className="text-center py-5">
                            <i className="material-icons-outlined fs-1 text-muted">
                              remove_shopping_cart
                            </i>
                            <p className="mt-2 text-muted">Tu carrito está vacío.</p>
                            <Link
                              to={all_routes.rentPropertyGridSidebar}
                              className="btn btn-dark"
                            >
                              Explorar Alquileres
                            </Link>
                          </div>
                        )}

                        {!isLoading &&
                          items.map((item) => {
                            const prop = item.property || {};
                            const meta = prop.metadata || {};
                            const coverUrl = item.coverUrl || meta.coverUrl || "";
                            const title = prop.title || meta.titulo || "Propiedad";
                            const address = prop.address || meta.direccion || "";
                            const price =
                              typeof prop.price === "number"
                                ? prop.price
                                : Number(meta.precio) || 0;
                            const currency = prop.moneda || meta.moneda || "ARS";

                            return (
                              <div key={item._id} className="cart-item-02">
                                <div className="row align-items-center row-gap-3">
                                  <div className="col-lg-7">
                                    <div className="row align-items-center row-gap-3">
                                      <div className="col-lg-5">
                                        {coverUrl ? (
                                          <ImageWithBasePath
                                            src={coverUrl}
                                            alt={title}
                                            className="img-fluid"
                                          />
                                        ) : (
                                          <div
                                            className="bg-light d-flex align-items-center justify-content-center"
                                            style={{
                                              height: 120,
                                              borderRadius: 8,
                                            }}
                                          >
                                            <i className="material-icons-outlined text-muted fs-1">
                                              home
                                            </i>
                                          </div>
                                        )}
                                      </div>
                                      <div className="col-lg-7">
                                        <div className="d-flex align-items-center mb-1">
                                          <h6 className="mb-0 me-2">{title}</h6>
                                          <span className="badge badge-sm bg-secondary">
                                            Alquiler
                                          </span>
                                        </div>
                                        {address && (
                                          <p className="address mb-0">
                                            <i className="material-icons-outlined">
                                              location_on
                                            </i>
                                            {address}
                                          </p>
                                        )}
                                        {item.checkIn && (
                                          <p className="fs-14 mb-0 mt-1">
                                            <strong>Check-in:</strong>{" "}
                                            {new Date(item.checkIn).toLocaleDateString("es-AR")}
                                            {item.checkOut && (
                                              <>
                                                {" → "}
                                                {new Date(item.checkOut).toLocaleDateString(
                                                  "es-AR"
                                                )}
                                              </>
                                            )}
                                          </p>
                                        )}
                                        {item.guests && (
                                          <p className="fs-14 mb-0">
                                            <strong>Huéspedes:</strong> {item.guests}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col-lg-5">
                                    <div className="cart-content-01 flex-wrap gap-3">
                                      <div>
                                        <h5 className="mb-0">
                                          {formatPrice(price, currency)}
                                        </h5>
                                      </div>
                                      <Link
                                        to="#"
                                        className="btn remove-btn"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleRemove(item._id);
                                        }}
                                      >
                                        <i className="material-icons-outlined">delete</i>
                                        Eliminar
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                    <div className="col-xl-3 theiaStickySidebar">
                      <StickyBox offsetTop={80} offsetBottom={20}>
                        <div className="cart-item-03">
                          <div>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <p className="mb-0">Propiedades</p>
                              <span>{items.length}</span>
                            </div>
                          </div>
                          <hr />
                          <Link
                            to={all_routes.checkout}
                            className={`btn btn-success w-100 ${items.length === 0 ? "disabled" : ""}`}
                          >
                            Continuar con la Reserva
                          </Link>
                        </div>
                      </StickyBox>
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

export default Cart;
