import { Link } from "react-router";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import { all_routes } from "../../../routes/all_routes";
import type { PropertyCard } from "../../../../services/publicService";

interface Props {
  property: PropertyCard;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  detailPathFn?: (slug: string) => string;
}

const formatPrice = (price?: { amount?: number; currency?: string; unit?: string }) => {
  if (!price || !price.amount) return "";
  const formatted = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: price.currency || "ARS",
    maximumFractionDigits: 0,
  }).format(price.amount);
  return price.unit ? `${formatted} / ${price.unit}` : formatted;
};

const formatDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
};

const PropertyGridCard = ({ property, isFavorite, onToggleFavorite, detailPathFn }: Props) => {
  const p = property;
  const detailPath = detailPathFn
    ? detailPathFn(p.slug)
    : p.operation === "rent"
    ? all_routes.rentDetailsPath(p.slug)
    : all_routes.buyDetailsPath(p.slug);

  const coverSrc = p.media?.coverUrl || "assets/img/buy/buy-grid-img-01.jpg";

  return (
    <div className="property-card flex-fill">
      <div className="property-listing-item p-0 mb-0 shadow-none">
        <div className="buy-grid-img mb-0 rounded-0">
          <Link to={detailPath}>
            <ImageWithBasePath className="img-fluid" src={coverSrc} alt={p.title || "property"} />
          </Link>
          <div className="d-flex align-items-center justify-content-between position-absolute top-0 start-0 end-0 p-3 z-1">
            <div className="d-flex align-items-center gap-2">
              {p.featured && (
                <div className="badge badge-sm bg-orange d-flex align-items-center">
                  <i className="material-icons-outlined">loyalty</i>
                  Destacada
                </div>
              )}
              {p.category && (
                <div className="badge badge-sm bg-secondary d-flex align-items-center">
                  {p.category}
                </div>
              )}
            </div>
            {onToggleFavorite && (
              <Link
                to="#"
                className={`favourite ${isFavorite ? "selected" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  onToggleFavorite();
                }}
              >
                <i className={`material-icons-outlined ${isFavorite ? "filled" : ""}`}>
                  {isFavorite ? "favorite" : "favorite_border"}
                </i>
              </Link>
            )}
          </div>
          <div className="d-flex align-items-center justify-content-between position-absolute bottom-0 end-0 start-0 p-3 z-1">
            <h6 className="text-white mb-0">{formatPrice(p.price)}</h6>
            {p.agent?.avatarUrl && (
              <div className="user-avatar avatar avatar-md border rounded-circle">
                <ImageWithBasePath
                  src={p.agent.avatarUrl}
                  alt={p.agent.name || "Agent"}
                  className="rounded-circle"
                />
              </div>
            )}
          </div>
        </div>
        <div className="buy-grid-content">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h6 className="title mb-1">
                <Link to={detailPath}>{p.title || "Sin título"}</Link>
              </h6>
              {p.location?.addressLine && (
                <p className="d-flex align-items-center fs-14 mb-0">
                  <i className="material-icons-outlined me-1 ms-0">location_on</i>
                  {[p.location.addressLine, p.location.city, p.location.province]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
            </div>
          </div>
          <ul className="d-flex buy-grid-details d-flex mb-3 bg-light rounded p-3 justify-content-between align-items-center flex-wrap gap-1">
            {(p.features?.beds != null && p.features.beds > 0) && (
              <li className="d-flex align-items-center gap-1">
                <i className="material-icons-outlined bg-white text-secondary">bed</i>
                {p.features.beds} Hab.
              </li>
            )}
            {(p.features?.baths != null && p.features.baths > 0) && (
              <li className="d-flex align-items-center gap-1">
                <i className="material-icons-outlined bg-white text-secondary">bathtub</i>
                {p.features.baths} Baño{p.features.baths > 1 ? "s" : ""}
              </li>
            )}
            {(p.features?.areaSqFt != null && p.features.areaSqFt > 0) && (
              <li className="d-flex align-items-center gap-1">
                <i className="material-icons-outlined bg-white text-secondary">straighten</i>
                {p.features.areaSqFt} m²
              </li>
            )}
          </ul>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
            {p.type && (
              <p className="fs-14 fw-medium text-dark mb-0">
                Tipo: <span className="fw-medium text-body">{p.type}</span>
              </p>
            )}
            {p.operation && (
              <p className="fs-14 fw-medium text-dark mb-0">
                Operación:{" "}
                <span className="fw-medium text-body">
                  {p.operation === "rent" ? "Alquiler" : "Venta"}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyGridCard;
