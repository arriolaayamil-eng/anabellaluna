import { Link } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import Breadcrumb from "../../../../../core/common/Breadcrumb/breadcrumb";
import { Price_Range, Sort_By } from "../../../../../core/common/selectOption";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import FilterSidebar from "../filter-sidebar/filterSidebar";
import type { PropertyFilters } from "../filter-sidebar/filterSidebar";
import { useState, useEffect, useCallback } from "react";
import publicService from "../../../../../services/publicService";
import type { PropertyCard } from "../../../../../services/publicService";
import PropertyListCard from "../../common/PropertyListCard";

const BuyListSidebar = () => {
  const [properties, setProperties] = useState<PropertyCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<PropertyFilters>({});

  const fetchProperties = useCallback(async (f: PropertyFilters) => {
    try {
      setIsLoading(true);
      const res = await publicService.getProperties("buy", f);
      setProperties(res.items || []);
    } catch {
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties(filters);
  }, [filters, fetchProperties]);

  const handleFilterChange = useCallback((f: PropertyFilters) => setFilters(f), []);

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <div className="page-wrapper">
        <Breadcrumb
          title="Propiedades en Venta"
          paths={[{ label: "Propiedades en Venta", active: true }]}
        />
        <div className="content">
          <div className="container">
            <div className="card border-0 search-item mb-4">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-lg-3">
                    <p className="mb-4 mb-lg-0 mb-md-3 text-lg-start text-md-start text-center">
                      Mostrando{" "}
                      <span className="result-value">{properties.length}</span>{" "}
                      resultado{properties.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="col-lg-9">
                    <div className="d-flex align-items-center gap-3 flex-wrap justify-content-lg-end flex-lg-row flex-md-row flex-column">
                      <div className="result-list d-flex d-block flex-lg-row flex-md-row flex-column align-items-center gap-2">
                        <h5>Ordenar</h5>
                        <div className="result-select">
                          <CommonSelect options={Sort_By} className="select" defaultValue={Sort_By[0]} />
                        </div>
                      </div>
                      <div className="result-list d-flex flex-lg-row flex-md-row flex-column align-items-center gap-2">
                        <h5>Precio</h5>
                        <div className="result-select">
                          <CommonSelect options={Price_Range} className="select" defaultValue={Price_Range[0]} />
                        </div>
                      </div>
                      <ul className="grid-list-view d-flex align-items-center justify-content-center">
                        <li>
                          <Link to={all_routes.buyPropertyGridSidebar} className="list-icon">
                            <i className="material-icons">grid_view</i>
                          </Link>
                        </li>
                        <li>
                          <Link to={all_routes.buyPropertyListSidebar} className="list-icon active">
                            <i className="material-icons">list</i>
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-4 theiaStickySidebar">
                <FilterSidebar onFilterChange={handleFilterChange} />
              </div>
              <div className="col-lg-8">
                {isLoading && (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                  </div>
                )}
                {!isLoading && properties.length === 0 && (
                  <div className="text-center py-5">
                    <i className="material-icons-outlined fs-1 text-muted">search_off</i>
                    <p className="mt-2 text-muted">No se encontraron propiedades en venta.</p>
                  </div>
                )}
                {!isLoading &&
                  properties.map((prop) => (
                    <PropertyListCard
                      key={prop.id}
                      property={prop}
                      isFavorite={favorites.has(prop.id)}
                      onToggleFavorite={() => handleToggleFavorite(prop.id)}
                      detailPathFn={(slug: string) => all_routes.buyDetailsPath(slug)}
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BuyListSidebar;
