import { Link, useNavigate } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { Price_Range, Sort_By } from "../../../../../core/common/selectOption";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import Breadcrumb from "../../../../../core/common/Breadcrumb/breadcrumb";
import { useEffect, useState } from "react";
import publicService, { type PropertyCard } from "../../../../../services/publicService";

const BuyGrid = () => {
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState(Array(200).fill(false));
  const [properties, setProperties] = useState<PropertyCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const goToDetails = (slug?: string) => {
    if (!slug) return;
    navigate(all_routes.buyDetailsPath(slug));
  };

  const shouldIgnoreCardClick = (target: EventTarget | null) => {
    const el = target as HTMLElement | null;
    if (!el) return false;
    return Boolean(el.closest("a,button,input,select,textarea,label"));
  };

  const handleItemClick = (index: number) => {
    setSelectedItems((prevSelectedItems) => {
      const updatedSelectedItems = [...prevSelectedItems];
      updatedSelectedItems[index] = !updatedSelectedItems[index];
      return updatedSelectedItems;
    });
  };

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      try {
        setIsLoading(true);
        const res = await publicService.getProperties("buy");
        if (!isMounted) return;
        setProperties(Array.isArray(res.items) ? res.items : []);
      } catch {
        if (!isMounted) return;
        setProperties([]);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, []);

  const categoryLabel = (op?: PropertyCard["operation"]) => {
    if (op === "buy") return "Venta";
    if (op === "rent") return "Alquiler";
    return "";
  };
  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Breadscrumb */}
        <Breadcrumb
          title="Comprar en cuadrícula"
          paths={[{ label: "Comprar en cuadrícula", active: true }]}
        />
        {/* End Breadscrumb */}
        {/* Start Content */}
        <div className="content overflow-hidden">
          <div className="container">
            <div className="card border-0 search-item mb-4">
              <div className="card-body">
                {/* start row */}
                <div className="row align-items-center">
                  <div className="col-lg-3">
                    <p className="mb-4 mb-lg-0 mb-md-3 text-lg-start text-md-start  text-center">
                      Mostrando <span className="result-value"> {properties.length}</span>
                      de
                      <span className="result-value"> {properties.length}</span> resultados
                    </p>
                  </div>
                  {/* end col */}
                  <div className="col-lg-9">
                    <div className="d-flex align-items-center gap-3 flex-wrap justify-content-lg-end flex-lg-row flex-md-row flex-column">
                      <div className="result-list d-flex d-block flex-lg-row flex-md-row flex-column align-items-center gap-2">
                        <h5>Ordenar por</h5>
                        <div className="result-select">
                          <CommonSelect
                            options={Sort_By}
                            className="select"
                            defaultValue={Sort_By[0]}
                          />
                        </div>
                      </div>
                      <div className="result-list d-flex flex-lg-row flex-md-row flex-column align-items-center gap-2">
                        <h5>Rango de precios</h5>
                        <div className="result-select">
                          <CommonSelect
                            options={Price_Range}
                            className="select"
                            defaultValue={Price_Range[0]}
                          />
                        </div>
                      </div>
                      <ul className="grid-list-view d-flex align-items-center justify-content-center">
                        <li>
                          <Link
                            to={all_routes.buyPropertyList}
                            className="list-icon "
                          >
                            <i className="material-icons">list</i>
                          </Link>
                        </li>
                        <li>
                          <Link
                            to={all_routes.buyPropertyGrid}
                            className="list-icon active"
                          >
                            <i className="material-icons">grid_view</i>
                          </Link>
                        </li>
                        <li>
                          <Link
                            to={all_routes.buyGridMap}
                            className="list-icon"
                          >
                            <i className="material-icons-outlined">
                              location_on
                            </i>
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                  {/* end col */}
                </div>
                {/* end row */}
              </div>
            </div>
            {/* end card */}
            {/* start row */}
            <div className="row mb-4">
              {properties.slice(0, 9).map((p, idx) => (
                (() => {
                  const detailsKey = p.slug || p.id;
                  return (
                <div key={p.id || idx} className="col-xl-4 col-lg-6 col-md-6 d-flex">
                  <div
                    className="property-card flex-fill"
                    role={detailsKey ? "button" : undefined}
                    tabIndex={detailsKey ? 0 : undefined}
                    onClick={(e) => {
                      if (!detailsKey) return;
                      if (shouldIgnoreCardClick(e.target)) return;
                      goToDetails(detailsKey);
                    }}
                    onKeyDown={(e) => {
                      if (!detailsKey) return;
                      if (e.key !== "Enter" && e.key !== " ") return;
                      if (shouldIgnoreCardClick(e.target)) return;
                      e.preventDefault();
                      goToDetails(detailsKey);
                    }}
                  >
                    <div className="property-listing-item p-0 mb-0 shadow-none">
                      <div className="buy-grid-img mb-0 rounded-0">
                        <Link to={detailsKey ? all_routes.buyDetailsPath(detailsKey) : "#"}>
                          <ImageWithBasePath
                            className="img-fluid"
                            src={p.media?.coverUrl || ""}
                            alt={p.title}
                          />
                        </Link>
                        <div className="d-flex align-items-center justify-content-between position-absolute top-0 start-0 end-0 p-3 z-1">
                          <div className="d-flex align-items-center gap-2">
                            <div className="badge badge-sm bg-danger d-flex align-items-center">
                              <i className="material-icons-outlined">offline_bolt</i>
                              New
                            </div>
                          </div>
                          <Link
                            to="#"
                            className={`favourite ${selectedItems[idx] ? "selected" : ""}`}
                            key={idx}
                            onClick={() => handleItemClick(idx)}
                          >
                            <i
                              className={`material-icons-outlined ${
                                selectedItems[idx] ? "filled" : ""
                              }`}
                            >
                              {selectedItems[idx] ? "favorite" : "favorite_border"}
                            </i>
                          </Link>
                        </div>
                        <div className="d-flex align-items-center justify-content-between position-absolute bottom-0 end-0 start-0 p-3 z-1">
                          <h6 className="text-white mb-0">
                            {p.price?.amount != null
                              ? `${p.price?.currency || ""} ${p.price.amount}`
                              : ""}
                          </h6>
                          <div className="user-avatar avatar avatar-md border rounded-circle">
                            <ImageWithBasePath
                              src={p.agent?.avatarUrl || ""}
                              alt={p.agent?.name || "User"}
                              className="rounded-circle"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="buy-grid-content">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <div className="d-flex align-items-center justify-content-center">
                            <i className="material-icons-outlined text-warning">star</i>
                            <i className="material-icons-outlined text-warning">star</i>
                            <i className="material-icons-outlined text-warning">star</i>
                            <i className="material-icons-outlined text-warning">star</i>
                            <i className="material-icons-outlined text-warning">star</i>
                          </div>
                        </div>
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <div>
                            <h6 className="title mb-1">
                              <Link to={detailsKey ? all_routes.buyDetailsPath(detailsKey) : "#"}>
                                {p.title}
                              </Link>
                            </h6>
                            <p className="d-flex align-items-center fs-14 mb-0">
                              <i className="material-icons-outlined me-1 ms-0">
                                location_on
                              </i>
                              {p.location?.addressLine || ""}
                            </p>
                          </div>
                        </div>
                        <ul className="d-flex buy-grid-details d-flex mb-3 bg-light rounded p-3 justify-content-between align-items-center flex-wrap gap-1">
                          <li className="d-flex align-items-center gap-1">
                            <i className="material-icons-outlined bg-white text-secondary">
                              bed
                            </i>
                            {p.features?.beds != null ? `${p.features.beds} Bedroom` : ""}
                          </li>
                          <li className="d-flex align-items-center gap-1">
                            <i className="material-icons-outlined bg-white text-secondary">
                              bathtub
                            </i>
                            {p.features?.baths != null ? `${p.features.baths} Bath` : ""}
                          </li>
                          <li className="d-flex align-items-center gap-1">
                            <i className="material-icons-outlined bg-white text-secondary">
                              straighten
                            </i>
                            {p.features?.areaSqFt != null
                              ? `${p.features.areaSqFt} Sq Ft`
                              : ""}
                          </li>
                        </ul>
                        <div className="d-flex align-items-center justify-content-between flex-wrap flex-wrap gap-1">
                          <p className="fs-14 fw-medium text-dark mb-0">
                            Agente :
                            <span className="fw-medium text-body">
                              {p.agent?.name || ""}
                            </span>
                          </p>
                          <p className="fs-14 fw-medium text-dark mb-0">
                            Category :
                            <span className="fw-medium text-body">
                              {categoryLabel(p.operation)}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* end card */}
                </div>
                  );
                })()
              ))}

              {isLoading && (
                <div className="col-12">
                  <div className="text-center">Loading...</div>
                </div>
              )}

            </div>

            {false && (
              <div className="row mb-4">
              {/* Items-1 */}
              <div className="col-xl-4 col-lg-6 col-md-6 d-flex">
                <div className="property-card flex-fill">
                  <div className="property-listing-item p-0 mb-0 shadow-none">
                    <div className="buy-grid-img mb-0 rounded-0">
                      <Link to={all_routes.buyDetails}>
                        <ImageWithBasePath
                          className="img-fluid"
                          src="assets/img/buy/buy-grid-img-01.jpg"
                          alt="image"
                        />
                      </Link>
                      <div className="d-flex align-items-center justify-content-between position-absolute top-0 start-0 end-0 p-3 z-1">
                        <div className="d-flex align-items-center gap-2">
                          <div className="badge badge-sm bg-danger d-flex align-items-center">
                            <i className="material-icons-outlined">
                              offline_bolt
                            </i>
                            New
                          </div>
                          <div className="badge badge-sm bg-orange d-flex align-items-center">
                            <i className="material-icons-outlined">loyalty</i>
                            Featured
                          </div>
                        </div>
                        <Link
                          to="#"
                          className={`favourite ${
                            selectedItems[1] ? "selected" : ""
                          }`}
                          key={1}
                          onClick={() => handleItemClick(1)}
                        >
                          <i
                            className={`material-icons-outlined ${
                              selectedItems[1] ? "filled" : ""
                            }`}
                          >
                            {selectedItems[1] ? "favorite" : "favorite_border"}
                          </i>
                        </Link>
                      </div>
                      <div className="d-flex align-items-center justify-content-between position-absolute bottom-0 end-0 start-0 p-3 z-1">
                        <h6 className="text-white mb-0">$21000</h6>
                        <div className="user-avatar avatar avatar-md border rounded-circle">
                          <ImageWithBasePath
                            src="assets/img/users/user-01.jpg"
                            alt="User"
                            className="rounded-circle"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="buy-grid-content">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center justify-content-center">
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <span className="ms-1 fs-14">5.0 (20 Reviews)</span>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h6 className="title mb-1">
                            <Link to={all_routes.buyDetails}>
                              Serenity Condo Suite
                            </Link>
                          </h6>
                          <p className="d-flex align-items-center fs-14 mb-0">
                            <i className="material-icons-outlined me-1 ms-0">
                              location_on
                            </i>
                            17, Grove Towers, New York, USA
                          </p>
                        </div>
                      </div>
                      <ul className="d-flex buy-grid-details d-flex mb-3 bg-light rounded p-3 justify-content-between align-items-center flex-wrap gap-1">
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            bed
                          </i>
                          4 Bedroom
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            bathtub
                          </i>
                          4 Bath
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            straighten
                          </i>
                          350 Sq Ft
                        </li>
                      </ul>
                      <div className="d-flex align-items-center justify-content-between flex-wrap flex-wrap gap-1">
                        <p className="fs-14 fw-medium text-dark mb-0">
                          Listed on :
                          <span className="fw-medium text-body">
                            16 Jan 2023
                          </span>
                        </p>
                        <p className="fs-14 fw-medium text-dark mb-0">
                          Category :
                          <span className="fw-medium text-body">Apartment</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* end card */}
              </div>
              {/* end col */}
              {/* Items-2 */}
              <div className="col-xl-4 col-lg-6 col-md-6 d-flex">
                <div className="property-card flex-fill">
                  <div className="property-listing-item p-0 mb-0 shadow-none">
                    <div className="buy-grid-img mb-0 rounded-0">
                      <Link to={all_routes.buyDetails}>
                        <ImageWithBasePath
                          className="img-fluid"
                          src="assets/img/buy/buy-grid-img-02.jpg"
                          alt="image"
                        />
                      </Link>
                      <div className="d-flex align-items-center justify-content-between position-absolute top-0 start-0 end-0 p-3 z-1">
                        <div className="d-flex align-items-center gap-2">
                          <div className="badge badge-sm bg-orange d-flex align-items-center">
                            <i className="material-icons-outlined">loyalty</i>
                            Featured
                          </div>
                        </div>
                        <Link
                          to="#"
                          className={`favourite ${
                            selectedItems[2] ? "selected" : ""
                          }`}
                          key={2}
                          onClick={() => handleItemClick(2)}
                        >
                          <i
                            className={`material-icons-outlined ${
                              selectedItems[2] ? "filled" : ""
                            }`}
                          >
                            {selectedItems[2] ? "favorite" : "favorite_border"}
                          </i>
                        </Link>
                      </div>
                      <div className="d-flex align-items-center justify-content-between position-absolute bottom-0 end-0 start-0 p-3 z-1">
                        <h6 className="text-white mb-0">$1940</h6>
                        <div className="user-avatar avatar avatar-md border rounded-circle">
                          <ImageWithBasePath
                            src="assets/img/users/user-02.jpg"
                            alt="User"
                            className="rounded-circle"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="buy-grid-content">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center justify-content-center">
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <span className="ms-1 fs-14">4.6 (36 Reviews)</span>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h6 className="title mb-1">
                            <Link to={all_routes.buyDetails}>
                              Loyal Apartment
                            </Link>
                          </h6>
                          <p className="d-flex align-items-center fs-14 mb-0">
                            <i className="material-icons-outlined me-1 ms-0">
                              location_on
                            </i>
                            25, Willow Crest Apartment, USA
                          </p>
                        </div>
                      </div>
                      <ul className="d-flex buy-grid-details d-flex mb-3 bg-light rounded p-3 justify-content-between align-items-center flex-wrap gap-1">
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            bed
                          </i>
                          2 Bedroom
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            bathtub
                          </i>
                          2 Bath
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            straighten
                          </i>
                          350 Sq Ft
                        </li>
                      </ul>
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
                        <p className="fs-14 fw-medium text-dark mb-0">
                          Listed on :
                          <span className="fw-medium text-body">
                            02 May 2025
                          </span>
                        </p>
                        <p className="fs-14 fw-medium text-dark mb-0">
                          Category :
                          <span className="fw-medium text-body">Apartment</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* end card */}
              </div>
              {/* end col */}
              {/* Items-3 */}
              <div className="col-xl-4 col-lg-6 col-md-6 d-flex">
                <div className="property-card flex-fill">
                  <div className="property-listing-item p-0 mb-0 shadow-none">
                    <div className="buy-grid-img mb-0 rounded-0">
                      <Link to={all_routes.buyDetails}>
                        <ImageWithBasePath
                          className="img-fluid"
                          src="assets/img/buy/buy-grid-img-03.jpg"
                          alt="image"
                        />
                      </Link>
                      <div className="d-flex align-items-center justify-content-between position-absolute top-0 start-0 end-0 p-3 z-1">
                        <div className="d-flex align-items-center gap-2">
                          <div className="badge badge-sm bg-orange d-flex align-items-center">
                            <i className="material-icons-outlined">loyalty</i>
                            Featured
                          </div>
                        </div>
                        <Link
                          to="#"
                          className={`favourite ${
                            selectedItems[3] ? "selected" : ""
                          }`}
                          key={3}
                          onClick={() => handleItemClick(3)}
                        >
                          <i
                            className={`material-icons-outlined ${
                              selectedItems[3] ? "filled" : ""
                            }`}
                          >
                            {selectedItems[3] ? "favorite" : "favorite_border"}
                          </i>
                        </Link>
                      </div>
                      <div className="d-flex align-items-center justify-content-between position-absolute bottom-0 end-0 start-0 p-3 z-1">
                        <h6 className="text-white mb-0">$1370</h6>
                        <div className="user-avatar avatar avatar-md border rounded-circle">
                          <ImageWithBasePath
                            src="assets/img/users/user-03.jpg"
                            alt="User"
                            className="rounded-circle"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="buy-grid-content">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center justify-content-center">
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <span className="ms-1 fs-14">4.9 (25 Reviews)</span>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h6 className="title mb-1">
                            <Link to={all_routes.buyDetails}>
                              Grand Villa House
                            </Link>
                          </h6>
                          <p className="d-flex align-items-center fs-14 mb-0">
                            <i className="material-icons-outlined me-1 ms-0">
                              location_on
                            </i>
                            10, Oak Ridge Villa, USA
                          </p>
                        </div>
                      </div>
                      <ul className="d-flex buy-grid-details d-flex mb-3 bg-light rounded p-3 justify-content-between align-items-center flex-wrap gap-1">
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            bed
                          </i>
                          4 Bedroom
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            bathtub
                          </i>
                          3 Bath
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            straighten
                          </i>
                          520 Sq Ft
                        </li>
                      </ul>
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
                        <p className="fs-14 fw-medium text-dark mb-0">
                          Listed on :
                          <span className="fw-medium text-body">
                            28 Apr 2025
                          </span>
                        </p>
                        <p className="fs-14 fw-medium text-dark mb-0">
                          Category :
                          <span className="fw-medium text-body"> Villa</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* end card */}
              </div>
              {/* end col */}
              {/* Items-4 */}
              <div className="col-xl-4 col-lg-6 col-md-6 d-flex">
                <div className="property-card flex-fill">
                  <div className="property-listing-item p-0 mb-0 shadow-none">
                    <div className="buy-grid-img mb-0 rounded-0">
                      <Link to={all_routes.buyDetails}>
                        <ImageWithBasePath
                          className="img-fluid"
                          src="assets/img/buy/buy-grid-img-04.jpg"
                          alt="image"
                        />
                      </Link>
                      <div className="d-flex align-items-center justify-content-end position-absolute top-0 start-0 end-0 p-3 z-1">
                        <Link
                          to="#"
                          className={`favourite ${
                            selectedItems[4] ? "selected" : ""
                          }`}
                          key={4}
                          onClick={() => handleItemClick(4)}
                        >
                          <i
                            className={`material-icons-outlined ${
                              selectedItems[4] ? "filled" : ""
                            }`}
                          >
                            {selectedItems[4] ? "favorite" : "favorite_border"}
                          </i>
                        </Link>
                      </div>
                      <div className="d-flex align-items-center justify-content-between position-absolute bottom-0 end-0 start-0 p-3 z-1">
                        <h6 className="text-white mb-0">$1370</h6>
                        <div className="user-avatar avatar avatar-md border rounded-circle">
                          <ImageWithBasePath
                            src="assets/img/users/user-04.jpg"
                            alt="User"
                            className="rounded-circle"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="buy-grid-content">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center justify-content-center">
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <span className="ms-1 fs-14">4.8 (26 Reviews)</span>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h6 className="title mb-1">
                            <Link to={all_routes.buyDetails}>
                              Palm Cove Bungalows
                            </Link>
                          </h6>
                          <p className="d-flex align-items-center fs-14 mb-0">
                            <i className="material-icons-outlined me-1 ms-0">
                              location_on
                            </i>
                            42, Pine Residency, Miami, USA
                          </p>
                        </div>
                      </div>
                      <ul className="d-flex buy-grid-details d-flex mb-3 bg-light rounded p-3 justify-content-between align-items-center flex-wrap gap-1">
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            bed
                          </i>
                          5 Bedroom
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            bathtub
                          </i>
                          3 Bath
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            straighten
                          </i>
                          700 Sq Ft
                        </li>
                      </ul>
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
                        <p className="fs-14 fw-medium text-dark mb-0">
                          Listed on :
                          <span className="fw-medium text-body">
                            16 Mar 2025
                          </span>
                        </p>
                        <p className="fs-14 fw-medium text-dark mb-0">
                          Category :
                          <span className="fw-medium text-body">Bungalow</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* end card */}
              </div>
              {/* end col */}
              {/* Items-5 */}
              <div className="col-xl-4 col-lg-6 col-md-6 d-flex">
                <div className="property-card flex-fill">
                  <div className="property-listing-item p-0 mb-0 shadow-none">
                    <div className="buy-grid-img mb-0 rounded-0">
                      <Link to={all_routes.buyDetails}>
                        <ImageWithBasePath
                          className="img-fluid"
                          src="assets/img/buy/buy-grid-img-05.jpg"
                          alt="image"
                        />
                      </Link>
                      <div className="d-flex align-items-center justify-content-end position-absolute top-0 start-0 end-0 p-3 z-1">
                        <Link
                          to="#"
                          className={`favourite ${
                            selectedItems[5] ? "selected" : ""
                          }`}
                          key={5}
                          onClick={() => handleItemClick(5)}
                        >
                          <i
                            className={`material-icons-outlined ${
                              selectedItems[5] ? "filled" : ""
                            }`}
                          >
                            {selectedItems[5] ? "favorite" : "favorite_border"}
                          </i>
                        </Link>
                      </div>
                      <div className="d-flex align-items-center justify-content-between position-absolute bottom-0 end-0 start-0 p-3 z-1">
                        <h6 className="text-white mb-0">$2000</h6>
                        <div className="user-avatar avatar avatar-md border rounded-circle">
                          <ImageWithBasePath
                            src="assets/img/users/user-05.jpg"
                            alt="User"
                            className="rounded-circle"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="buy-grid-content">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center justify-content-center">
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <span className="ms-1 fs-14">4.9 (19 Reviews)</span>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h6 className="title mb-1">
                            <Link to={all_routes.buyDetails}>
                              Blue Horizon Villa
                            </Link>
                          </h6>
                          <p className="d-flex align-items-center fs-14 mb-0">
                            <i className="material-icons-outlined me-1 ms-0">
                              location_on
                            </i>
                            76, Golden Oaks, Dallas, USA
                          </p>
                        </div>
                      </div>
                      <ul className="d-flex buy-grid-details d-flex mb-3 bg-light rounded p-3 justify-content-between align-items-center flex-wrap gap-1">
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            bed
                          </i>
                          2 Bedroom
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            bathtub
                          </i>
                          1 Bath
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            straighten
                          </i>
                          400 Sq Ft
                        </li>
                      </ul>
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
                        <p className="fs-14 fw-medium text-dark mb-0">
                          Listed on :
                          <span className="fw-medium text-body">
                            08 Mar 2025
                          </span>
                        </p>
                        <p className="fs-14 fw-medium text-dark mb-0">
                          Category :
                          <span className="fw-medium text-body"> Villa </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* end card */}
              </div>
              {/* end col */}
              {/* Items-6 */}
              <div className="col-xl-4 col-lg-6 col-md-6 d-flex">
                <div className="property-card flex-fill">
                  <div className="property-listing-item p-0 mb-0 shadow-none">
                    <div className="buy-grid-img mb-0 rounded-0">
                      <Link to={all_routes.buyDetails}>
                        <ImageWithBasePath
                          className="img-fluid"
                          src="assets/img/buy/buy-grid-img-06.jpg"
                          alt="image"
                        />
                      </Link>
                      <div className="d-flex align-items-center justify-content-end position-absolute top-0 start-0 end-0 p-3 z-1">
                        <Link
                          to="#"
                          className={`favourite ${
                            selectedItems[6] ? "selected" : ""
                          }`}
                          key={6}
                          onClick={() => handleItemClick(6)}
                        >
                          <i
                            className={`material-icons-outlined ${
                              selectedItems[6] ? "filled" : ""
                            }`}
                          >
                            {selectedItems[6] ? "favorite" : "favorite_border"}
                          </i>
                        </Link>
                      </div>
                      <div className="d-flex align-items-center justify-content-between position-absolute bottom-0 end-0 start-0 p-3 z-1">
                        <h6 className="text-white mb-0">$1950</h6>
                        <div className="user-avatar avatar avatar-md border rounded-circle">
                          <ImageWithBasePath
                            src="assets/img/users/user-06.jpg"
                            alt="User"
                            className="rounded-circle"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="buy-grid-content">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center justify-content-center">
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <span className="ms-1 fs-14">4.7 (45 Reviews)</span>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h6 className="title mb-1">
                            <Link to={all_routes.buyDetails}>
                              Wanderlust Lodge
                            </Link>
                          </h6>
                          <p className="d-flex align-items-center fs-14 mb-0">
                            <i className="material-icons-outlined me-1 ms-0">
                              location_on
                            </i>
                            91, Birch Residences, Boston, USA
                          </p>
                        </div>
                      </div>
                      <ul className="d-flex buy-grid-details d-flex mb-3 bg-light rounded p-3 justify-content-between align-items-center flex-wrap gap-1">
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            bed
                          </i>
                          3 Bedroom
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            bathtub
                          </i>
                          2 Bath
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            straighten
                          </i>
                          550 Sq Ft
                        </li>
                      </ul>
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
                        <p className="fs-14 fw-medium text-dark mb-0">
                          Listed on :
                          <span className="fw-medium text-body">
                            25 Feb 2025
                          </span>
                        </p>
                        <p className="fs-14 fw-medium text-dark mb-0">
                          Category :
                          <span className="fw-medium text-body"> Lodge </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* end card */}
              </div>
              {/* end col */}
              {/* Items-7 */}
              <div className="col-xl-4 col-lg-6 col-md-6 d-flex">
                <div className="property-card mb-lg-0 flex-fill">
                  <div className="property-listing-item p-0 mb-0 shadow-none">
                    <div className="buy-grid-img mb-0 rounded-0">
                      <Link to={all_routes.buyDetails}>
                        <ImageWithBasePath
                          className="img-fluid"
                          src="assets/img/buy/buy-grid-img-07.jpg"
                          alt="image"
                        />
                      </Link>
                      <div className="d-flex align-items-center justify-content-end position-absolute top-0 start-0 end-0 p-3 z-1">
                        <Link
                          to="#"
                          className={`favourite ${
                            selectedItems[7] ? "selected" : ""
                          }`}
                          key={7}
                          onClick={() => handleItemClick(7)}
                        >
                          <i
                            className={`material-icons-outlined ${
                              selectedItems[7] ? "filled" : ""
                            }`}
                          >
                            {selectedItems[7] ? "favorite" : "favorite_border"}
                          </i>
                        </Link>
                      </div>
                      <div className="d-flex align-items-center justify-content-between position-absolute bottom-0 end-0 start-0 p-3 z-1">
                        <h6 className="text-white mb-0">$2470</h6>
                        <div className="user-avatar avatar avatar-md border rounded-circle">
                          <ImageWithBasePath
                            src="assets/img/users/user-07.jpg"
                            alt="User"
                            className="rounded-circle"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="buy-grid-content">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center justify-content-center">
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <span className="ms-1 fs-14">4.4 (79 Reviews)</span>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h6 className="title mb-1">
                            <Link to={all_routes.buyDetails}>
                              Elite Suite Room
                            </Link>
                          </h6>
                          <p className="d-flex align-items-center fs-14 mb-0">
                            <i className="material-icons-outlined me-1 ms-0">
                              location_on
                            </i>
                            42, Maple Grove Residences, USA
                          </p>
                        </div>
                      </div>
                      <ul className="d-flex buy-grid-details d-flex mb-3 bg-light rounded p-3 justify-content-between align-items-center flex-wrap gap-1">
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            bed
                          </i>
                          2 Bedroom
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            bathtub
                          </i>
                          1 Bath
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            straighten
                          </i>
                          480 Sq Ft
                        </li>
                      </ul>
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
                        <p className="fs-14 fw-medium text-dark mb-0">
                          Listed on :
                          <span className="fw-medium text-body">
                            14 Apr 2025
                          </span>
                        </p>
                        <p className="fs-14 fw-medium text-dark mb-0">
                          Category :
                          <span className="fw-medium text-body"> Suite </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* end card */}
              </div>
              {/* end col */}
              {/* Items-8 */}
              <div className="col-xl-4 col-lg-6 col-md-6 d-flex">
                <div className="property-card mb-lg-0 flex-fill">
                  <div className="property-listing-item p-0 mb-0 shadow-none">
                    <div className="buy-grid-img mb-0 rounded-0">
                      <Link to={all_routes.buyDetails}>
                        <ImageWithBasePath
                          className="img-fluid"
                          src="assets/img/buy/buy-grid-img-08.jpg"
                          alt="image"
                        />
                      </Link>
                      <div className="d-flex align-items-center justify-content-end position-absolute top-0 start-0 end-0 p-3 z-1">
                        <Link
                          to="#"
                          className={`favourite ${
                            selectedItems[8] ? "selected" : ""
                          }`}
                          key={8}
                          onClick={() => handleItemClick(8)}
                        >
                          <i
                            className={`material-icons-outlined ${
                              selectedItems[8] ? "filled" : ""
                            }`}
                          >
                            {selectedItems[8] ? "favorite" : "favorite_border"}
                          </i>
                        </Link>
                      </div>
                      <div className="d-flex align-items-center justify-content-between position-absolute bottom-0 end-0 start-0 p-3 z-1">
                        <h6 className="text-white mb-0">$1900</h6>
                        <div className="user-avatar avatar avatar-md border rounded-circle">
                          <ImageWithBasePath
                            src="assets/img/users/user-08.jpg"
                            alt="User"
                            className="rounded-circle"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="buy-grid-content">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center justify-content-center">
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <span className="ms-1 fs-14">4.6 (47 Reviews)</span>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h6 className="title mb-1">
                            <Link to={all_routes.buyDetails}>
                              Celestial Residency
                            </Link>
                          </h6>
                          <p className="d-flex align-items-center fs-14 mb-0">
                            <i className="material-icons-outlined me-1 ms-0">
                              location_on
                            </i>
                            28, Hilltop Gardens, San Francisco, USA
                          </p>
                        </div>
                      </div>
                      <ul className="d-flex buy-grid-details d-flex mb-3 bg-light rounded p-3 justify-content-between align-items-center flex-wrap gap-1">
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            bed
                          </i>
                          2 Bedroom
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            bathtub
                          </i>
                          2 Bath
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            straighten
                          </i>
                          354 Sq Ft
                        </li>
                      </ul>
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
                        <p className="fs-14 fw-medium text-dark mb-0">
                          Listed on :
                          <span className="fw-medium text-body">
                            06 Apr 2025
                          </span>
                        </p>
                        <p className="fs-14 fw-medium text-dark mb-0">
                          Category :
                          <span className="fw-medium text-body">Residency</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* end card */}
              </div>
              {/* end col */}
              {/* Items-9 */}
              <div className="col-xl-4 col-lg-6 col-md-6 d-flex">
                <div className="property-card mb-0 flex-fill">
                  <div className="property-listing-item p-0 mb-0 shadow-none">
                    <div className="buy-grid-img mb-0 rounded-0">
                      <Link to={all_routes.buyDetails}>
                        <ImageWithBasePath
                          className="img-fluid"
                          src="assets/img/buy/buy-grid-img-09.jpg"
                          alt="image"
                        />
                      </Link>
                      <div className="d-flex align-items-center justify-content-end position-absolute top-0 start-0 end-0 p-3 z-1">
                        <Link
                          to="#"
                          className={`favourite ${
                            selectedItems[9] ? "selected" : ""
                          }`}
                          key={9}
                          onClick={() => handleItemClick(9)}
                        >
                          <i
                            className={`material-icons-outlined ${
                              selectedItems[9] ? "filled" : ""
                            }`}
                          >
                            {selectedItems[9] ? "favorite" : "favorite_border"}
                          </i>
                        </Link>
                      </div>
                      <div className="d-flex align-items-center justify-content-between position-absolute bottom-0 end-0 start-0 p-3 z-1">
                        <h6 className="text-white mb-0">$2470</h6>
                        <div className="user-avatar avatar avatar-md border rounded-circle">
                          <ImageWithBasePath
                            src="assets/img/users/user-09.jpg"
                            alt="User"
                            className="rounded-circle"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="buy-grid-content">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center justify-content-center">
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <span className="ms-1 fs-14">4.2 (14 Reviews)</span>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h6 className="title mb-1">
                            <Link to={all_routes.buyDetails}>
                              Cedar Grove Residences
                            </Link>
                          </h6>
                          <p className="d-flex align-items-center fs-14 mb-0">
                            <i className="material-icons-outlined me-1 ms-0">
                              location_on
                            </i>
                            42, Pine Residency, Miami, USA
                          </p>
                        </div>
                      </div>
                      <ul className="d-flex buy-grid-details d-flex mb-3 bg-light rounded p-3 justify-content-between align-items-center flex-wrap gap-1">
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            bed
                          </i>
                          4 Bedroom
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            bathtub
                          </i>
                          4 Bath
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            straighten
                          </i>
                          680 Sq Ft
                        </li>
                      </ul>
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
                        <p className="fs-14 fw-medium text-dark mb-0">
                          Listed on :
                          <span className="fw-medium text-body">
                            30 Mar 2025
                          </span>
                        </p>
                        <p className="fs-14 fw-medium text-dark mb-0">
                          Category :
                          <span className="fw-medium text-body">Residency</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* end card */}
              </div>
              {/* end col */}
            </div>
              )}
            {/* end row */}
            <div className="text-center">
              <Link
                to="#"
                className="btn btn-dark d-inline-flex align-items-center"
              >
                <i className="material-icons-outlined me-1">autorenew</i>Load
                More
              </Link>
            </div>
          </div>
        </div>
        {/* End Content */}
      </div>
      {/* ========================
			End Page Content
		========================= */}
    </>
  );
};

export default BuyGrid;
