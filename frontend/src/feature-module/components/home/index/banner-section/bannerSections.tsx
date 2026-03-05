import { useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import { all_routes } from "../../../../routes/all_routes";
import publicService from "../../../../../services/publicService";

const BannerSections = () => {
  const navigate = useNavigate();
  const [propertyCount, setPropertyCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"buy" | "rent">("buy");

  // Buy form state
  const buySearchRef = useRef<HTMLInputElement>(null);
  const buyTypeRef = useRef<HTMLInputElement>(null);
  const buyMinRef = useRef<HTMLInputElement>(null);
  const buyMaxRef = useRef<HTMLInputElement>(null);

  // Rent form state
  const rentSearchRef = useRef<HTMLInputElement>(null);
  const rentTypeRef = useRef<HTMLInputElement>(null);
  const rentMinRef = useRef<HTMLInputElement>(null);
  const rentMaxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const res = await publicService.getStats();
        if (m) setPropertyCount(res.properties || 0);
      } catch { /* keep 0 */ }
    })();
    return () => { m = false; };
  }, []);

  const buildSearchUrl = (operation: "buy" | "rent") => {
    const isBuy = operation === "buy";
    const search = (isBuy ? buySearchRef : rentSearchRef).current?.value?.trim() || "";
    const type = (isBuy ? buyTypeRef : rentTypeRef).current?.value?.trim() || "";
    const minPrice = (isBuy ? buyMinRef : rentMinRef).current?.value?.trim() || "";
    const maxPrice = (isBuy ? buyMaxRef : rentMaxRef).current?.value?.trim() || "";

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (type) params.set("type", type);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);

    const basePath = isBuy
      ? all_routes.buyPropertyGridSidebar
      : all_routes.rentPropertyGridSidebar;

    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const handleSearch = (operation: "buy" | "rent") => {
    navigate(buildSearchUrl(operation));
  };

  return (
    <>
      {/* start banner section */}
      <section className="Home-banner-section">
        <div className="container">
          {/* start row */}
          <div className="row">
            <div className="col-lg-6">
              <div className="banner-content aos" data-aos="fade-up">
                <h1 className="mb-2">Tu casa en la playa</h1>
                <p className="mb-0">
                  Propiedades para comprar o alquilar en tu zona.
                  {propertyCount > 0
                    ? ` Tenemos más de ${propertyCount} publicaciones para vos.`
                    : " Explorá nuestras publicaciones."}
                </p>
              </div>
            </div>
          </div>
          {/* end row */}
          {/* Search Start */}
          <div className="home-search-1 home-search-2">
            <ul
              className="nav nav-tabs justify-content-lg-start justify-content-center aos"
              data-aos="fade-up"
              role="tablist"
            >
              <li className="nav-item" role="presentation">
                <a
                  className={`nav-link ${activeTab === "buy" ? "active" : ""}`}
                  href="#buy_property"
                  role="tab"
                  onClick={(e) => { e.preventDefault(); setActiveTab("buy"); }}
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
                  onClick={(e) => { e.preventDefault(); setActiveTab("rent"); }}
                >
                  <i className="material-icons-outlined me-2">king_bed</i>
                  Alquilar propiedad
                </a>
              </li>
            </ul>
            <div
              className="tab-content aos"
              data-aos="fade-down"
              data-aos-duration={1000}
            >
              {/* Buy Tab */}
              <div
                className={`tab-pane fade ${activeTab === "buy" ? "show active" : ""}`}
                id="buy_property"
                role="tabpanel"
              >
                <div className="search-item">
                  <form onSubmit={(e) => { e.preventDefault(); handleSearch("buy"); }}>
                    <div className="d-flex align-items-bottom flex-wrap flex-lg-nowrap gap-3">
                      <div className="flex-fill select-field w-100">
                        <label className="form-label">Búsqueda</label>
                        <input
                          ref={buySearchRef}
                          type="text"
                          className="form-control"
                          placeholder="Nombre, barrio, dirección..."
                        />
                      </div>
                      <div className="flex-fill select-field w-100">
                        <label className="form-label">Tipo de propiedad</label>
                        <input
                          ref={buyTypeRef}
                          type="text"
                          className="form-control"
                          placeholder="Casa, Depto, Oficina..."
                        />
                      </div>
                      <div className="flex-fill select-field w-100">
                        <label className="form-label">Precio mínimo</label>
                        <input
                          ref={buyMinRef}
                          type="number"
                          className="form-control"
                          placeholder="$"
                        />
                      </div>
                      <div className="flex-fill select-field w-100">
                        <label className="form-label">Precio máximo</label>
                        <input
                          ref={buyMaxRef}
                          type="number"
                          className="form-control"
                          placeholder="$"
                        />
                      </div>
                      <div className="custom-search-item d-flex align-items-end">
                        <button type="submit" className="btn btn-primary home-btn">
                          <i className="material-icons-outlined">search</i>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
              {/* Rent Tab */}
              <div
                className={`tab-pane fade ${activeTab === "rent" ? "show active" : ""}`}
                id="rent_property"
                role="tabpanel"
              >
                <div className="search-item">
                  <form onSubmit={(e) => { e.preventDefault(); handleSearch("rent"); }}>
                    <div className="d-flex align-items-bottom flex-wrap flex-lg-nowrap gap-3">
                      <div className="flex-fill select-field w-100">
                        <label className="form-label">Búsqueda</label>
                        <input
                          ref={rentSearchRef}
                          type="text"
                          className="form-control"
                          placeholder="Nombre, barrio, dirección..."
                        />
                      </div>
                      <div className="flex-fill select-field w-100">
                        <label className="form-label">Tipo de propiedad</label>
                        <input
                          ref={rentTypeRef}
                          type="text"
                          className="form-control"
                          placeholder="Casa, Depto, Oficina..."
                        />
                      </div>
                      <div className="flex-fill select-field w-100">
                        <label className="form-label">Precio mínimo</label>
                        <input
                          ref={rentMinRef}
                          type="number"
                          className="form-control"
                          placeholder="$"
                        />
                      </div>
                      <div className="flex-fill select-field w-100">
                        <label className="form-label">Precio máximo</label>
                        <input
                          ref={rentMaxRef}
                          type="number"
                          className="form-control"
                          placeholder="$"
                        />
                      </div>
                      <div className="custom-search-item d-flex align-items-end">
                        <button type="submit" className="btn btn-primary home-btn">
                          <i className="material-icons-outlined">search</i>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          {/* Search End */}
        </div>
      </section>
      {/* end banner section */}
    </>
  );
};

export default BannerSections;
