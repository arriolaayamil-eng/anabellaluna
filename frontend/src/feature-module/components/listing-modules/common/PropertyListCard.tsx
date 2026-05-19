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

const PropertyListCard = ({ property, isFavorite, onToggleFavorite, detailPathFn }: Props) => {
  const p = property;
  const detailPath = detailPathFn
    ? detailPathFn(p.slug)
    : p.operation === "rent"
    ? all_routes.rentDetailsPath(p.slug)
    : all_routes.buyDetailsPath(p.slug);

  const coverSrc = p.media?.coverUrl || "assets/img/buy/buy-grid-img-01.jpg";

  return (
    <div className="property-card mb-4">
      <div className="property-listing-item p-0 mb-0 shadow-none">
        <div className="row g-0">
          <div className="col-12 col-lg-5">
            <div className="buy-grid-img mb-0 rounded-0">
              <Link to={detailPath}>
                <ImageWithBasePath
                  className="img-fluid w-100 h-100"
                  src={coverSrc}
                  alt={p.title || "property"}
                />
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
            </div>
          </div>
          <div className="col-12 col-lg-7">
            <div className="buy-grid-content p-3">
              <div className="d-flex align-items-start justify-content-between mb-2 flex-wrap">
                <div className="flex-grow-1 me-2" style={{ minWidth: 0 }}>
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
                <h5 className="text-primary mb-0 ms-2 text-nowrap">
                  {formatPrice(p.price)}
                </h5>
              </div>
              <ul className="d-flex buy-grid-details mb-3 bg-light rounded p-3 justify-content-start align-items-center flex-wrap gap-3">
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
                <div className="d-flex align-items-center gap-2">
                  {p.type && (
                    <span className="badge bg-light text-dark">{p.type}</span>
                  )}
                  {p.operation && (
                    <span className="badge bg-secondary">
                      {p.operation === "rent" ? "Alquiler" : "Venta"}
                    </span>
                  )}
                </div>
                {p.agent && (
                  <div className="d-flex align-items-center gap-2">
                    {p.agent.avatarUrl && (
                      <div className="avatar avatar-sm border rounded-circle">
                        <ImageWithBasePath
                          src={p.agent.avatarUrl}
                          alt={p.agent.name || "Agent"}
                          className="rounded-circle"
                        />
                      </div>
                    )}
                    <span className="fs-14 text-muted">{p.agent.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyListCard;
