import { Link } from "react-router";
import StickyBox from "react-sticky-box";
import { useState, useCallback, useEffect } from "react";
import publicService from "../../../../../services/publicService";

export interface PropertyFilters {
  search?: string;
  city?: string;
  beds?: number;
  baths?: number;
  minPrice?: number;
  maxPrice?: number;
  type?: string;
  sort?: 'price_asc' | 'price_desc';
  featured?: boolean;
}

interface FilterSidebarProps {
  onFilterChange?: (filters: PropertyFilters) => void;
}

const FilterSidebar = ({ onFilterChange }: FilterSidebarProps) => {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [beds, setBeds] = useState(0);
  const [baths, setBaths] = useState(0);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [type, setType] = useState("");
  const [availableTypes, setAvailableTypes] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    let cancelled = false;
    publicService.getPropertyStats()
      .then((res) => {
        if (cancelled) return;
        const types = (res.types || [])
          .filter((t) => t && t.name && String(t.name).trim() !== "")
          .sort((a, b) => String(a.name).localeCompare(String(b.name), 'es'));
        setAvailableTypes(types);
      })
      .catch(() => {
        if (!cancelled) setAvailableTypes([]);
      });
    return () => { cancelled = true; };
  }, []);

  const applyFilters = useCallback(() => {
    if (!onFilterChange) return;
    onFilterChange({
      search: search.trim() || undefined,
      city: city.trim() || undefined,
      beds: beds || undefined,
      baths: baths || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      type: type.trim() || undefined,
    });
  }, [onFilterChange, search, city, beds, baths, minPrice, maxPrice, type]);

  const handleReset = () => {
    setSearch("");
    setCity("");
    setBeds(0);
    setBaths(0);
    setMinPrice("");
    setMaxPrice("");
    setType("");
    if (onFilterChange) onFilterChange({});
  };

  return (
    <>
      <StickyBox offsetTop={80} offsetBottom={20}>
        <div className="filter-sidebar buy-grid-sidebar-item-02 mb-lg-0">
          <div className="filter-head d-flex align-items-center justify-content-between">
            <h5 className="mb-0">
              <i className="material-icons-outlined me-1 align-middle d-lg-none">filter_list</i>
              Filtros
            </h5>
            <div className="d-flex align-items-center gap-2">
              <Link
                to="#"
                className="text-danger fs-14"
                onClick={(e) => {
                  e.preventDefault();
                  handleReset();
                }}
              >
                Limpiar
              </Link>
              <button
                className="btn btn-sm btn-outline-secondary d-lg-none"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#filterBody"
                aria-expanded="false"
              >
                <i className="material-icons-outlined fs-16">expand_more</i>
              </button>
            </div>
          </div>
          <div className="filter-body collapse show" id="filterBody">
            {/* Search */}
            <div className="filter-set">
              <div className="d-flex align-items-center">
                <div
                  className="d-flex justify-content-between w-100 filter-search-head"
                  data-bs-toggle="collapse"
                  data-bs-target="#search"
                  aria-expanded="true"
                  role="button"
                >
                  <h6 className="d-inline-flex align-items-center mb-0">
                    <i className="material-icons-outlined me-2 text-secondary">
                      search
                    </i>
                    Búsqueda
                  </h6>
                  <i className="material-icons-outlined expand-arrow">
                    expand_less
                  </i>
                </div>
              </div>
              <div id="search" className="card-collapse collapse show mt-3">
                <div className="input-group input-group-flat mb-3">
                  <span className="input-group-text border-0">
                    <i className="material-icons-outlined">search</i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar por nombre, dirección..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyFilters();
                    }}
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label mb-1">Ciudad</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: Pinamar, Mar del Plata..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label mb-1">Tipo de propiedad</label>
                  <select
                    className="form-select"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    disabled={availableTypes.length === 0}
                  >
                    <option value="">Todos los tipos</option>
                    {availableTypes.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name} ({t.count})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label mb-1">Dormitorios mínimos</label>
                  <select
                    className="form-select"
                    value={beds}
                    onChange={(e) => setBeds(Number(e.target.value))}
                  >
                    <option value={0}>Cualquiera</option>
                    <option value={1}>1+</option>
                    <option value={2}>2+</option>
                    <option value={3}>3+</option>
                    <option value={4}>4+</option>
                    <option value={5}>5+</option>
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label mb-1">Baños mínimos</label>
                  <select
                    className="form-select"
                    value={baths}
                    onChange={(e) => setBaths(Number(e.target.value))}
                  >
                    <option value={0}>Cualquiera</option>
                    <option value={1}>1+</option>
                    <option value={2}>2+</option>
                    <option value={3}>3+</option>
                    <option value={4}>4+</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Price Range */}
            <div className="filter-set">
              <div className="d-flex align-items-center">
                <div
                  className="d-flex justify-content-between w-100 filter-search-head"
                  data-bs-toggle="collapse"
                  data-bs-target="#price"
                  aria-expanded="true"
                  role="button"
                >
                  <h6 className="mb-0 d-flex align-items-center">
                    <i className="material-icons-outlined me-2 text-secondary">
                      payments
                    </i>
                    Rango de Precio
                  </h6>
                  <i className="material-icons-outlined expand-arrow">
                    expand_less
                  </i>
                </div>
              </div>
              <div id="price" className="card-collapse collapse show mt-3">
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label mb-1">Mínimo</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label mb-1">Máximo</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Sin límite"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <div className="filter-set border-0 pb-0">
              <button
                className="btn btn-dark w-100"
                onClick={applyFilters}
              >
                <i className="material-icons-outlined me-1">filter_list</i>
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      </StickyBox>
    </>
  );
};

export default FilterSidebar;
