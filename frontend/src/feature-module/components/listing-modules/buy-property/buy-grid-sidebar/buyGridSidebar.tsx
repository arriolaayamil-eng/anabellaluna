import { useSearchParams } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import Breadcrumb from "../../../../../core/common/Breadcrumb/breadcrumb";
import FilterSidebar from "../filter-sidebar/filterSidebar";
import type { PropertyFilters } from "../filter-sidebar/filterSidebar";
import { useState, useEffect, useCallback, useRef } from "react";
import publicService from "../../../../../services/publicService";
import type { PropertyCard } from "../../../../../services/publicService";
import PropertyGridCard from "../../common/PropertyGridCard";

const BuyGridSidebar = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const opParam = searchParams.get('op');
  const activeTab: 'buy' | 'rent' = opParam === 'rent' ? 'rent' : 'buy';

  const [properties, setProperties] = useState<PropertyCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sort state
  const [activeSort, setActiveSort] = useState<'price_asc' | 'price_desc' | 'featured' | ''>('');

  // Live search state
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<PropertyCard[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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

  // Combined filters including sort and featured
  const effectiveFilters = useCallback((): PropertyFilters => {
    const f: PropertyFilters = { ...filters };
    if (activeSort === 'price_asc') { f.sort = 'price_asc'; f.featured = undefined; }
    else if (activeSort === 'price_desc') { f.sort = 'price_desc'; f.featured = undefined; }
    else if (activeSort === 'featured') { f.sort = undefined; f.featured = true; }
    else { f.sort = undefined; f.featured = undefined; }
    return f;
  }, [filters, activeSort]);

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
    fetchProperties(activeTab, effectiveFilters());
  }, [activeTab, effectiveFilters, fetchProperties]);

  // Live search: fetch suggestions on every keystroke
  useEffect(() => {
    if (!searchInput.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await publicService.getProperties(activeTab, { search: searchInput.trim() });
        if (!cancelled) {
          setSuggestions((res.items || []).slice(0, 8));
          setShowSuggestions(true);
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    }, 180);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [searchInput, activeTab]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleTabChange = (tab: 'buy' | 'rent') => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'buy') next.delete('op'); else next.set('op', 'rent');
    setSearchParams(next, { replace: true });
    setFilters({});
    setActiveSort('');
    setSearchInput('');
    setSuggestions([]);
  };

  const handleFilterChange = useCallback((newFilters: PropertyFilters) => {
    setFilters(newFilters);
  }, []);

  const handleSortClick = (sort: 'price_asc' | 'price_desc' | 'featured') => {
    setActiveSort((prev) => prev === sort ? '' : sort);
  };

  const handleSearchSubmit = (value: string) => {
    setSearchInput(value);
    setShowSuggestions(false);
    setFilters((prev) => ({ ...prev, search: value.trim() || undefined }));
  };

  const handleSuggestionClick = (prop: PropertyCard) => {
    setSearchInput(prop.title || '');
    setShowSuggestions(false);
    setFilters((prev) => ({ ...prev, search: prop.title || undefined }));
  };

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
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay opened"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="page-wrapper">
        <Breadcrumb
          title={title}
          paths={[{ label: title, active: true }]}
        />
        <div className="content">
          <div className="container">
            {/* ── Buy / Rent tab selector ── */}
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

            {/* ── Toolbar: live search + sort buttons + filter toggle ── */}
            <div className="card border-0 search-item mb-4">
              <div className="card-body">
                <div className="d-flex flex-wrap align-items-center gap-2">
                  {/* Sort buttons */}
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      className={`btn btn-sm ${activeSort === 'price_desc' ? 'btn-primary' : 'btn-outline-secondary'} d-flex align-items-center gap-1`}
                      onClick={() => handleSortClick('price_desc')}
                      title="Ordenar de mayor a menor precio"
                    >
                      <i className="material-icons-outlined" style={{ fontSize: 16 }}>arrow_upward</i>
                      <span className="d-none d-sm-inline">Mayor precio</span>
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${activeSort === 'price_asc' ? 'btn-primary' : 'btn-outline-secondary'} d-flex align-items-center gap-1`}
                      onClick={() => handleSortClick('price_asc')}
                      title="Ordenar de menor a mayor precio"
                    >
                      <i className="material-icons-outlined" style={{ fontSize: 16 }}>arrow_downward</i>
                      <span className="d-none d-sm-inline">Menor precio</span>
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${activeSort === 'featured' ? 'btn-warning' : 'btn-outline-secondary'} d-flex align-items-center gap-1`}
                      onClick={() => handleSortClick('featured')}
                      title="Ver solo destacados"
                    >
                      <i className="material-icons-outlined" style={{ fontSize: 16 }}>star</i>
                      <span className="d-none d-sm-inline">Destacados</span>
                    </button>

                    {/* Filter sidebar toggle */}
                    <button
                      type="button"
                      className={`btn btn-sm ${sidebarOpen ? 'btn-dark' : 'btn-outline-dark'} d-flex align-items-center gap-1`}
                      onClick={() => setSidebarOpen((v) => !v)}
                      title="Filtros avanzados"
                    >
                      <i className="material-icons-outlined" style={{ fontSize: 16 }}>tune</i>
                      <span className="d-none d-sm-inline">Filtros</span>
                    </button>
                  </div>

                  {/* Results count */}
                  <div className="text-muted" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                    <span className="fw-semibold text-dark">{properties.length}</span>
                    {' '}resultado{properties.length !== 1 ? 's' : ''}
                  </div>

                  {/* Live search — right side */}
                  <div
                    className="ms-auto position-relative"
                    style={{ minWidth: 220, maxWidth: 360 }}
                    ref={searchRef}
                  >
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control border-end-0"
                        placeholder="Buscar propiedades..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(searchInput); }}
                        onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                        autoComplete="off"
                      />
                      {searchInput ? (
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => { setSearchInput(''); setSuggestions([]); setShowSuggestions(false); setFilters((p) => ({ ...p, search: undefined })); }}
                        >
                          <i className="material-icons-outlined" style={{ fontSize: 16 }}>close</i>
                        </button>
                      ) : (
                        <span className="input-group-text bg-white">
                          <i className="material-icons-outlined" style={{ fontSize: 18 }}>search</i>
                        </span>
                      )}
                    </div>
                    {showSuggestions && suggestions.length > 0 && (
                      <ul
                        className="list-group position-absolute w-100 shadow"
                        style={{ zIndex: 1050, top: '100%', marginTop: 2, right: 0 }}
                      >
                        {suggestions.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            className="list-group-item list-group-item-action d-flex align-items-center gap-2 text-start px-3 py-2"
                            onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(s); }}
                          >
                            <i className="material-icons-outlined text-muted" style={{ fontSize: 16 }}>home</i>
                            <span className="text-truncate" style={{ fontSize: 13 }}>{s.title}</span>
                            {s.price?.amount != null && (
                              <span className="ms-auto text-primary fw-semibold text-nowrap" style={{ fontSize: 12 }}>
                                {s.price.currency || '$'}{' '}{s.price.amount.toLocaleString('es-AR')}
                              </span>
                            )}
                          </button>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Content ── */}
            <div className="row">
              {/* Collapsible filter sidebar */}
              <div
                className={`col-lg-4 theiaStickySidebar${sidebarOpen ? ' d-block' : ' d-none d-lg-none'}`}
                style={sidebarOpen ? { display: 'block' } : {}}
              >
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: sidebarOpen ? 0 : '-340px',
                    width: 320,
                    height: '100vh',
                    background: 'var(--white)',
                    zIndex: 1045,
                    boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
                    transition: 'left 0.3s ease',
                    overflowY: 'auto',
                    padding: '20px 16px 20px 16px',
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h5 className="mb-0 fw-semibold">Filtros avanzados</h5>
                    <button
                      type="button"
                      className="btn btn-sm btn-light"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <i className="material-icons-outlined">close</i>
                    </button>
                  </div>
                  <FilterSidebar onFilterChange={(f) => { handleFilterChange(f); setSidebarOpen(false); }} />
                </div>
              </div>

              {/* Property grid — full width always */}
              <div className="col-12">
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
                    <div key={prop.id} className="col-xl-4 col-lg-4 col-md-6 d-flex">
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
