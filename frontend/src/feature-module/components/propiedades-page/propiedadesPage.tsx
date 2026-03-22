import { useState, useEffect, useCallback } from "react";
import publicService from "../../../services/publicService";
import type { PropertyCard } from "../../../services/publicService";
import PropertyGridCard from "../listing-modules/common/PropertyGridCard";
import Breadcrumb from "../../../core/common/Breadcrumb/breadcrumb";

const PropiedadesPage = () => {
  const [activeTab, setActiveTab] = useState<"buy" | "rent">("buy");
  const [properties, setProperties] = useState<PropertyCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProperties = useCallback(async (tab: "buy" | "rent") => {
    try {
      setIsLoading(true);
      const res = await publicService.getProperties(tab);
      setProperties(res.items || []);
    } catch {
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties(activeTab);
  }, [activeTab, fetchProperties]);

  return (
    <>
      <div className="page-wrapper">
        <Breadcrumb
          title="Propiedades"
          paths={[{ label: "Propiedades", active: true }]}
        />
        <div className="content">
          <div className="container">
            {/* Tab selector — same style as home banner */}
            <div className="home-search-1 home-search-2 mb-4">
              <ul
                className="nav nav-tabs justify-content-lg-start justify-content-center"
                role="tablist"
              >
                <li className="nav-item" role="presentation">
                  <a
                    className={`nav-link ${activeTab === "buy" ? "active" : ""}`}
                    href="#buy_property"
                    role="tab"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab("buy");
                    }}
                  >
                    <i className="material-icons-outlined me-2">shopping_basket</i>
                    Comprar propiedad
                  </a>
                </li>
                <li className="nav-item" role="presentation">
                  <a
                    className={`nav-link ${activeTab === "rent" ? "active" : ""}`}
                    href="#rent_property"
                    role="tab"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab("rent");
                    }}
                  >
                    <i className="material-icons-outlined me-2">king_bed</i>
                    Alquilar propiedad
                  </a>
                </li>
              </ul>
            </div>

            {/* Results count */}
            {!isLoading && (
              <p className="mb-3">
                Mostrando{" "}
                <span className="result-value">{properties.length}</span>{" "}
                resultado{properties.length !== 1 ? "s" : ""}
              </p>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            )}

            {/* Empty */}
            {!isLoading && properties.length === 0 && (
              <div className="text-center py-5">
                <i className="material-icons-outlined fs-1 text-muted">
                  home_work
                </i>
                <p className="mt-2 text-muted">
                  No se encontraron propiedades.
                </p>
              </div>
            )}

            {/* Grid */}
            {!isLoading && properties.length > 0 && (
              <div className="row row-gap-4">
                {properties.map((property) => (
                  <div key={property.id} className="col-xl-4 col-md-6">
                    <PropertyGridCard property={property} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PropiedadesPage;
