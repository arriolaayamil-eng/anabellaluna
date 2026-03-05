import { Link } from "react-router";
import Breadcrumb from "../../../../core/common/Breadcrumb/breadcrumb";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import { all_routes } from "../../../routes/all_routes";
import { useState, useEffect } from "react";
import publicService from "../../../../services/publicService";
import userService from "../../../../services/userService";

const formatPrice = (amount?: number, currency?: string, unit?: string) => {
  if (!amount) return "";
  const formatted = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency || "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
  return unit ? `${formatted} / ${unit}` : formatted;
};

const Wishlist = () => {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isLoggedIn = !!userService.getCurrentUser();

  useEffect(() => {
    if (!isLoggedIn) return;
    let isMounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await publicService.getWishlist();
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
      await publicService.removeWishlistItem(itemId);
      setItems((prev) => prev.filter((i) => i._id !== itemId));
    } catch (err) {
      console.error("Error removing wishlist item", err);
    }
  };

  const handleAddToCart = async (item: any) => {
    try {
      const prop = item.property || {};
      await publicService.addToCart({
        propertyId: prop._id ? String(prop._id) : undefined,
        propertySlug: prop.slug || undefined,
      });
      // Remove from wishlist after adding to cart
      await publicService.removeWishlistItem(item._id);
      setItems((prev) => prev.filter((i) => i._id !== item._id));
    } catch (err) {
      console.error("Error adding to cart", err);
    }
  };

  if (!isLoggedIn) {
    return (
      <>
        <div className="page-wrapper">
          <Breadcrumb
            title="Favoritos"
            paths={[{ label: "Favoritos", active: true }]}
          />
          <div className="content">
            <div className="container">
              <div className="text-center py-5">
                <i className="material-icons-outlined fs-1 text-muted">
                  favorite_border
                </i>
                <p className="mt-2 text-muted">
                  Iniciá sesión para ver tus favoritos.
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

  return (
    <>
      <div className="page-wrapper">
        <Breadcrumb
          title="Favoritos"
          paths={[{ label: "Favoritos", active: true }]}
        />
        <div className="content">
          <div className="container">
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
                  favorite_border
                </i>
                <p className="mt-2 text-muted">
                  Aún no tenés propiedades en favoritos.
                </p>
                <Link
                  to={all_routes.buyPropertyGridSidebar}
                  className="btn btn-dark"
                >
                  Explorar Propiedades
                </Link>
              </div>
            )}

            {!isLoading && items.length > 0 && (
              <div className="row mb-4">
                {items.map((item) => {
                  const prop = item.property || {};
                  const meta = prop.metadata || {};
                  const coverUrl =
                    item.coverUrl || meta.coverUrl || "";
                  const title =
                    prop.title || meta.titulo || "Propiedad";
                  const address =
                    prop.address || meta.direccion || "";
                  const city = meta.ciudad || "";
                  const price =
                    typeof prop.price === "number"
                      ? prop.price
                      : Number(meta.precio) || 0;
                  const currency = prop.moneda || meta.moneda || "ARS";
                  const beds = Number(meta.dormitorios) || 0;
                  const baths = Number(meta.baños) || 0;
                  const area = Number(meta.m2Totales || meta.m2) || 0;
                  const slug = prop.slug || String(prop._id || "");
                  const opRaw = String(
                    meta.operacion || ""
                  ).toLowerCase();
                  const isRent =
                    opRaw.includes("alquil") || opRaw.includes("rent");
                  const detailPath = isRent
                    ? all_routes.rentDetailsPath(slug)
                    : all_routes.buyDetailsPath(slug);

                  return (
                    <div
                      key={item._id}
                      className="col-xl-4 col-lg-6 col-md-6 d-flex"
                    >
                      <div className="property-card mb-lg-0 flex-fill">
                        <div className="property-listing-item p-0 mb-0 shadow-none">
                          <div className="buy-grid-img mb-0 rounded-0">
                            <Link to={detailPath}>
                              {coverUrl ? (
                                <ImageWithBasePath
                                  className="img-fluid"
                                  src={coverUrl}
                                  alt={title}
                                />
                              ) : (
                                <div
                                  className="bg-light d-flex align-items-center justify-content-center"
                                  style={{ height: 200 }}
                                >
                                  <i className="material-icons-outlined text-muted fs-1">
                                    home
                                  </i>
                                </div>
                              )}
                            </Link>
                            <div className="d-flex align-items-center justify-content-between position-absolute bottom-0 end-0 start-0 p-3 z-1">
                              <h6 className="text-white mb-0">
                                {formatPrice(price, currency)}
                              </h6>
                              <Link
                                to="#"
                                className="favourite selected"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleRemove(item._id);
                                }}
                              >
                                <i className="material-icons-outlined filled">
                                  favorite
                                </i>
                              </Link>
                            </div>
                          </div>
                          <div className="buy-grid-content">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                              <div>
                                <h6 className="title mb-1">
                                  <Link to={detailPath}>{title}</Link>
                                </h6>
                                {(address || city) && (
                                  <p className="d-flex align-items-center fs-14 mb-0">
                                    <i className="material-icons-outlined me-1 ms-0">
                                      location_on
                                    </i>
                                    {[address, city]
                                      .filter(Boolean)
                                      .join(", ")}
                                  </p>
                                )}
                              </div>
                            </div>
                            <ul className="d-flex buy-grid-details d-flex mb-3 bg-light rounded p-3 justify-content-between align-items-center flex-wrap gap-1">
                              {beds > 0 && (
                                <li className="d-flex align-items-center gap-1">
                                  <i className="material-icons-outlined bg-white text-secondary">
                                    bed
                                  </i>
                                  {beds} Hab.
                                </li>
                              )}
                              {baths > 0 && (
                                <li className="d-flex align-items-center gap-1">
                                  <i className="material-icons-outlined bg-white text-secondary">
                                    bathtub
                                  </i>
                                  {baths} Baño{baths > 1 ? "s" : ""}
                                </li>
                              )}
                              {area > 0 && (
                                <li className="d-flex align-items-center gap-1">
                                  <i className="material-icons-outlined bg-white text-secondary">
                                    straighten
                                  </i>
                                  {area} m²
                                </li>
                              )}
                            </ul>
                            <div className="d-flex align-items-center justify-content-between flex-wrap border-top border-light-100 pt-3">
                              <span className="badge bg-secondary">
                                {isRent ? "Alquiler" : "Venta"}
                              </span>
                              <Link
                                to="#"
                                className="btn btn-dark btn-sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (isRent) handleAddToCart(item);
                                  else window.location.href = detailPath;
                                }}
                              >
                                {isRent ? "Agregar al Carrito" : "Ver Detalle"}
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Wishlist;
