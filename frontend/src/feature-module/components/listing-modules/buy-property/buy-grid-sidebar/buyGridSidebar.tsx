import { useSearchParams } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import Breadcrumb from "../../../../../core/common/Breadcrumb/breadcrumb";
import FilterSidebar from "../filter-sidebar/filterSidebar";
import type { PropertyFilters } from "../filter-sidebar/filterSidebar";
import { useState, useEffect, useCallback } from "react";
import publicService from "../../../../../services/publicService";
import type { PropertyCard } from "../../../../../services/publicService";
import PropertyGridCard from "../../common/PropertyGridCard";

const BuyGridSidebar = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive active tab from ?op= param; default to 'buy'
  const opParam = searchParams.get('op');
  const activeTab: 'buy' | 'rent' = opParam === 'rent' ? 'rent' : 'buy';

  const [properties, setProperties] = useState<PropertyCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const [filters, setFilters] = useState<PropertyFilters>(() => {
    const initial: PropertyFilters = {};
    const s = searchParams.get('search'); if (s) initial.search = s;
    const c = searchParams.get('city'); if (c) initial.city = c;
    const t = searchParams.get('type'); if (t) initial.type = t;
    const mn = searchParams.get('minPrice'); if (mn) initial.minPrice = Number(mn);
    const mx = searchParams.get('maxPrice'); if (mx) initial.maxPrice = Number(mx);
    const bd = searchParams.get('beds'); if (bd) initial.beds = Number(bd);
    const bt = searchParams.get('baths'); if (bt) initial.baths = Number(bt);
    return initial;
  });

  const fetchProperties = useCallback(async (op: 'buy' | 'rent', currentFilters: PropertyFilters) => {
    try {
      setIsLoading(true);
      const res = await publicService.getProperties(op, currentFilters);
      setProperties(res.items || []);
    } catch {
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties(activeTab, filters);
  }, [activeTab, filters, fetchProperties]);

  const handleTabChange = (tab: 'buy' | 'rent') => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'buy') next.delete('op'); else next.set('op', 'rent');
    setSearchParams(next, { replace: true });
    setFilters({});
  };

  const handleFilterChange = useCallback((newFilters: PropertyFilters) => {
    setFilters(newFilters);
  }, []);

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const title = activeTab === 'buy' ? 'Propiedades en Venta' : 'Propiedades en Alquiler';
  const emptyMsg = activeTab === 'buy' ? 'No se encontraron propiedades en venta.' : 'No se encontraron propiedades en alquiler.';

  return (
    <>
      <div className="page-wrapper">
        <Breadcrumb
          title={title}
          paths={[{ label: title, active: true }]}
        />
        <div className="content">
          <div className="container">
            {/* ── Buy / Rent tab selector — same style as homepage ── */}
            <div className="home-search-1 mb-4">
              <ul
                className="nav nav-tabs justify-content-lg-start justify-content-center"
                role="tablist"
              >
                <li className="nav-item" role="presentation">
                  <a
                    className={`nav-link ${activeTab === 'buy' ? 'active' : ''}`}
                    href="#"
                    role="tab"
                    onClick={(e) => { e.preventDefault(); handleTabChange('buy'); }}
                  >
                    <i className="material-icons-outlined me-2">shopping_basket</i>
                    Comprar propiedad
                  </a>
                </li>
                <li className="nav-item" role="presentation">
                  <a
                    className={`nav-link ${activeTab === 'rent' ? 'active' : ''}`}
                    href="#"
                    role="tab"
                    onClick={(e) => { e.preventDefault(); handleTabChange('rent'); }}
                  >
                    <i className="material-icons-outlined me-2">king_bed</i>
                    Alquilar propiedad
                  </a>
                </li>
              </ul>
            </div>

            {/* ── Results bar ── */}
            <div className="card border-0 search-item mb-4">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-12">
                    <p className="mb-0 text-lg-start text-center">
                      Mostrando{" "}
                      <span className="result-value">{properties.length}</span>{" "}
                      resultado{properties.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Content ── */}
            <div className="row">
              <div className="col-lg-4 theiaStickySidebar">
                <FilterSidebar onFilterChange={handleFilterChange} />
              </div>
              <div className="col-lg-8">
                <div className="row mb-4">
                  {isLoading && (
                    <div className="col-12 text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                      </div>
                    </div>
                  )}
                  {!isLoading && properties.length === 0 && (
                    <div className="col-12 text-center py-5">
                      <i className="material-icons-outlined fs-1 text-muted">search_off</i>
                      <p className="mt-2 text-muted">{emptyMsg}</p>
                    </div>
                  )}
                  {!isLoading && properties.map((prop) => (
                    <div key={prop.id} className="col-lg-6 col-md-6 d-flex">
                      <PropertyGridCard
                        property={prop}
                        isFavorite={favorites.has(prop.id)}
                        onToggleFavorite={() => handleToggleFavorite(prop.id)}
                        detailPathFn={(slug) =>
                          activeTab === 'buy'
                            ? all_routes.buyDetailsPath(slug)
                            : all_routes.rentDetailsPath(slug)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BuyGridSidebar;
