import { Link } from "react-router";
import Breadcrumb from "../../../../../core/common/Breadcrumb/breadcrumb";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import { Price_Range, Sort_By } from "../../../../../core/common/selectOption";
import { all_routes } from "../../../../routes/all_routes";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { useEffect, useState } from "react";
import publicService, { type PropertyCard } from "../../../../../services/publicService";

const RentGrid = () => {
  const [selectedItems, setSelectedItems] = useState(Array(200).fill(false));
  const [properties, setProperties] = useState<PropertyCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
        const res = await publicService.getProperties("rent");
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

  const priceLabel = (p: PropertyCard) => {
    if (p.price?.amount == null) return "";
    const currency = p.price.currency ? `${p.price.currency} ` : "";
    const unit = p.price.unit ? ` / ${p.price.unit}` : "";
    return `${currency}${p.price.amount}${unit}`;
  };
  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Breadscrumb */}
        <Breadcrumb
          title="Alquilar en cuadrícula"
          paths={[{ label: "Alquilar en cuadrícula", active: true }]}
        />
        {/* End Breadscrumb */}
        {/* Start Content */}
        <div className="content">
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
                            to={all_routes.rentPropertyList}
                            className="list-icon "
                          >
                            <i className="material-icons">list</i>
                          </Link>
                        </li>
                        <li>
                          <Link
                            to={all_routes.rentPropertyGrid}
                            className="list-icon active"
                          >
                            <i className="material-icons">grid_view</i>
                          </Link>
                        </li>
                        <li>
                          <Link
                            to={all_routes.rentGridMap}
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
                <div key={p.id || idx} className="col-xl-4 col-lg-6 col-md-6 d-flex">
                  <div className="property-card flex-fill">
                    <div className="property-listing-item p-0 mb-0 shadow-none">
                      <div className="buy-grid-img mb-0 rounded-0">
                        <Link to={p.slug ? all_routes.rentDetailsPath(p.slug) : "#"}>
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
                        </div>
                        <div className="d-flex align-items-center justify-content-between position-absolute bottom-0 end-0 start-0 p-3 z-1">
                          <h6 className="text-white mb-0">{priceLabel(p)}</h6>
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
                              <Link to={p.slug ? all_routes.rentDetailsPath(p.slug) : "#"}>
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
                        <div className="d-flex align-items-center justify-content-between flex-wrap border-top border-light-100 pt-3">
                          <div className="d-flex align-items-center gap-2">
                            <div className="avatar avatar-lg user-avatar">
                              <ImageWithBasePath
                                src={p.agent?.avatarUrl || ""}
                                alt={p.agent?.name || ""}
                                className="rounded-circle"
                              />
                            </div>
                            <Link to="#;" className="mb-0 fs-16 fw-medium text-dark">
                              {p.agent?.name || ""}
                              <span className="d-block fs-14 text-body pt-1">
                                {p.location?.country || ""}
                              </span>
                            </Link>
                          </div>
                          <Link
                            to={p.slug ? all_routes.rentDetailsPath(p.slug) : "#"}
                            className="btn btn-dark"
                          >
                            Book Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* end card */}
                </div>
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
                      <Link to={all_routes.rentDetails}>
                        <ImageWithBasePath
                          className="img-fluid"
                          src="assets/img/rent/rent-grid-img-01.jpg"
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
                      </div>
                      <div className="d-flex align-items-center justify-content-between position-absolute bottom-0 end-0 start-0 p-3 z-1">
                        <h6 className="text-white mb-0">
                          $21000
                          <span className="fs-14 fw-normal"> / Night </span>
                        </h6>
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
                          <span className="ms-1 fs-14">Excellent</span>
                        </div>
                        <span className="badge bg-secondary"> Lodge</span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h6 className="title mb-1">
                            <Link to={all_routes.rentDetails}>
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
                      <div className="d-flex align-items-center justify-content-between flex-wrap border-top border-light-100 pt-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar avatar-lg user-avatar">
                            <ImageWithBasePath
                              src="assets/img/users/user-10.jpg"
                              alt="image"
                              className="rounded-circle"
                            />
                          </div>
                          <Link
                            to="#;"
                            className="mb-0 fs-16 fw-medium text-dark"
                          >
                            Ethan Brooks
                            <span className="d-block fs-14 text-body pt-1">
                              United States
                            </span>
                          </Link>
                        </div>
                        <Link
                          to={all_routes.rentDetails}
                          className="btn btn-dark"
                        >
                          Book Now
                        </Link>
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
                      <Link to={all_routes.rentDetails}>
                        <ImageWithBasePath
                          className="img-fluid"
                          src="assets/img/rent/rent-grid-img-02.jpg"
                          alt="image"
                        />
                      </Link>
                      <div className="d-flex align-items-center justify-content-between position-absolute bottom-0 end-0 start-0 p-3 z-1">
                        <h6 className="text-white mb-0">
                          $1130
                          <span className="fs-14 fw-normal"> / Night </span>
                        </h6>
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
                          <span className="ms-1 fs-14">Excellent</span>
                        </div>
                        <span className="badge bg-secondary"> Apartment</span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h6 className="title mb-1">
                            <Link to={all_routes.rentDetails}>
                              Getaway Apartment
                            </Link>
                          </h6>
                          <p className="d-flex align-items-center fs-14 mb-0">
                            <i className="material-icons-outlined me-1 ms-0">
                              location_on
                            </i>
                            54, Coral Apartments, Gold Coast, Australia
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
                          4 Bath
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            straighten
                          </i>
                          350 Sq Ft
                        </li>
                      </ul>
                      <div className="d-flex align-items-center justify-content-between flex-wrap border-top border-light-100 pt-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar avatar-lg user-avatar">
                            <ImageWithBasePath
                              src="assets/img/users/user-11.jpg"
                              alt="image"
                              className="rounded-circle"
                            />
                          </div>
                          <Link
                            to="#;"
                            className="mb-0 fs-16 fw-medium text-dark"
                          >
                            Olivia Hayes
                            <span className="d-block fs-14 text-body pt-1">
                              Australia
                            </span>
                          </Link>
                        </div>
                        <Link
                          to={all_routes.rentDetails}
                          className="btn btn-dark"
                        >
                          Book Now
                        </Link>
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
                      <Link to={all_routes.rentDetails}>
                        <ImageWithBasePath
                          className="img-fluid"
                          src="assets/img/rent/rent-grid-img-03.jpg"
                          alt="image"
                        />
                      </Link>
                      <div className="d-flex align-items-center justify-content-between position-absolute bottom-0 end-0 start-0 p-3 z-1">
                        <h6 className="text-white mb-0">
                          $2450
                          <span className="fs-14 fw-normal"> / Night </span>
                        </h6>
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
                          <span className="ms-1 fs-14">Excellent</span>
                        </div>
                        <span className="badge bg-secondary"> Condo</span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h6 className="title mb-1">
                            <Link to={all_routes.rentDetails}>
                              Cozy Urban Condo
                            </Link>
                          </h6>
                          <p className="d-flex align-items-center fs-14 mb-0">
                            <i className="material-icons-outlined me-1 ms-0">
                              location_on
                            </i>
                            130, Elmstone Flats, Manchester, UK
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
                      <div className="d-flex align-items-center justify-content-between flex-wrap border-top border-light-100 pt-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar avatar-lg user-avatar">
                            <ImageWithBasePath
                              src="assets/img/users/user-12.jpg"
                              alt="image"
                              className="rounded-circle"
                            />
                          </div>
                          <Link
                            to="#;"
                            className="mb-0 fs-16 fw-medium text-dark"
                          >
                            Daniel Carter
                            <span className="d-block fs-14 text-body pt-1">
                              United Kingdom
                            </span>
                          </Link>
                        </div>
                        <Link
                          to={all_routes.rentDetails}
                          className="btn btn-dark"
                        >
                          Book Now
                        </Link>
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
                      <Link to={all_routes.rentDetails}>
                        <ImageWithBasePath
                          className="img-fluid"
                          src="assets/img/rent/rent-grid-img-04.jpg"
                          alt="image"
                        />
                      </Link>
                      <div className="d-flex align-items-center justify-content-between position-absolute bottom-0 end-0 start-0 p-3 z-1">
                        <h6 className="text-white mb-0">
                          $1580
                          <span className="fs-14 fw-normal"> / Night </span>
                        </h6>
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
                          <span className="ms-1 fs-14">Excellent</span>
                        </div>
                        <span className="badge bg-secondary"> Residency</span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h6 className="title mb-1">
                            <Link to={all_routes.rentDetails}>
                              Coral Bay Cabins
                            </Link>
                          </h6>
                          <p className="d-flex align-items-center fs-14 mb-0">
                            <i className="material-icons-outlined me-1 ms-0">
                              location_on
                            </i>
                            7, Rosewood Court, Brighton, UK
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
                      <div className="d-flex align-items-center justify-content-between flex-wrap border-top border-light-100 pt-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar avatar-lg user-avatar">
                            <ImageWithBasePath
                              src="assets/img/users/user-13.jpg"
                              alt="image"
                              className="rounded-circle"
                            />
                          </div>
                          <Link
                            to="#;"
                            className="mb-0 fs-16 fw-medium text-dark"
                          >
                            Sophia Mitchell
                            <span className="d-block fs-14 text-body pt-1">
                              United Kingdom
                            </span>
                          </Link>
                        </div>
                        <Link
                          to={all_routes.rentDetails}
                          className="btn btn-dark"
                        >
                          Book Now
                        </Link>
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
                      <Link to={all_routes.rentDetails}>
                        <ImageWithBasePath
                          className="img-fluid"
                          src="assets/img/rent/rent-grid-img-05.jpg"
                          alt="image"
                        />
                      </Link>
                      <div className="d-flex align-items-center justify-content-between position-absolute bottom-0 end-0 start-0 p-3 z-1">
                        <h6 className="text-white mb-0">
                          $4500
                          <span className="fs-14 fw-normal"> / Night </span>
                        </h6>
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
                          <span className="ms-1 fs-14">Excellent</span>
                        </div>
                        <span className="badge bg-secondary"> Residency</span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h6 className="title mb-1">
                            <Link to={all_routes.rentDetails}>
                              Majestic Stay
                            </Link>
                          </h6>
                          <p className="d-flex align-items-center fs-14 mb-0">
                            <i className="material-icons-outlined me-1 ms-0">
                              location_on
                            </i>
                            10, Bella Vista Villas, Rome, Italy
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
                      <div className="d-flex align-items-center justify-content-between flex-wrap border-top border-light-100 pt-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar avatar-lg user-avatar">
                            <ImageWithBasePath
                              src="assets/img/users/user-14.jpg"
                              alt="image"
                              className="rounded-circle"
                            />
                          </div>
                          <Link
                            to="#;"
                            className="mb-0 fs-16 fw-medium text-dark"
                          >
                            Leo Ramirez
                            <span className="d-block fs-14 text-body pt-1">
                              Italy
                            </span>
                          </Link>
                        </div>
                        <Link
                          to={all_routes.rentDetails}
                          className="btn btn-dark"
                        >
                          Book Now
                        </Link>
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
                      <Link to={all_routes.rentDetails}>
                        <ImageWithBasePath
                          className="img-fluid"
                          src="assets/img/rent/rent-grid-img-06.jpg"
                          alt="image"
                        />
                      </Link>
                      <div className="d-flex align-items-center justify-content-between position-absolute bottom-0 end-0 start-0 p-3 z-1">
                        <h6 className="text-white mb-0">
                          $3000
                          <span className="fs-14 fw-normal"> / Night </span>
                        </h6>
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
                          <span className="ms-1 fs-14">Excellent</span>
                        </div>
                        <span className="badge bg-secondary"> Lodge</span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h6 className="title mb-1">
                            <Link to={all_routes.rentDetails}>Noble Nest</Link>
                          </h6>
                          <p className="d-flex align-items-center fs-14 mb-0">
                            <i className="material-icons-outlined me-1 ms-0">
                              location_on
                            </i>
                            76, Sakura Heights, Kyoto, Japan
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
                      <div className="d-flex align-items-center justify-content-between flex-wrap border-top border-light-100 pt-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar avatar-lg user-avatar">
                            <ImageWithBasePath
                              src="assets/img/users/user-15.jpg"
                              alt="image"
                              className="rounded-circle"
                            />
                          </div>
                          <Link
                            to="#;"
                            className="mb-0 fs-16 fw-medium text-dark"
                          >
                            Maya Rivera
                            <span className="d-block fs-14 text-body pt-1">
                              Japan
                            </span>
                          </Link>
                        </div>
                        <Link
                          to={all_routes.rentDetails}
                          className="btn btn-dark"
                        >
                          Book Now
                        </Link>
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
                      <Link to={all_routes.rentDetails}>
                        <ImageWithBasePath
                          className="img-fluid"
                          src="assets/img/rent/rent-grid-img-07.jpg"
                          alt="image"
                        />
                      </Link>
                      <div className="d-flex align-items-center justify-content-between position-absolute bottom-0 end-0 start-0 p-3 z-1">
                        <h6 className="text-white mb-0">
                          $1800
                          <span className="fs-14 fw-normal"> / Night </span>
                        </h6>
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
                          <span className="ms-1 fs-14">Excellent</span>
                        </div>
                        <span className="badge bg-secondary"> Villa</span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h6 className="title mb-1">
                            <Link to={all_routes.rentDetails}>
                              Holiday Haven Homes
                            </Link>
                          </h6>
                          <p className="d-flex align-items-center fs-14 mb-0">
                            <i className="material-icons-outlined me-1 ms-0">
                              location_on
                            </i>
                            88, Eucalypt Lane Suites, Sydney, Australia
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
                      <div className="d-flex align-items-center justify-content-between flex-wrap border-top border-light-100 pt-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar avatar-lg user-avatar">
                            <ImageWithBasePath
                              src="assets/img/users/user-16.jpg"
                              alt="image"
                              className="rounded-circle"
                            />
                          </div>
                          <Link
                            to="#;"
                            className="mb-0 fs-16 fw-medium text-dark"
                          >
                            Marcus Bennett
                            <span className="d-block fs-14 text-body pt-1">
                              Australia
                            </span>
                          </Link>
                        </div>
                        <Link
                          to={all_routes.rentDetails}
                          className="btn btn-dark"
                        >
                          Book Now
                        </Link>
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
                      <Link to={all_routes.rentDetails}>
                        <ImageWithBasePath
                          className="img-fluid"
                          src="assets/img/rent/rent-grid-img-08.jpg"
                          alt="image"
                        />
                      </Link>
                      <div className="d-flex align-items-center justify-content-between position-absolute bottom-0 end-0 start-0 p-3 z-1">
                        <h6 className="text-white mb-0">
                          $2680
                          <span className="fs-14 fw-normal"> / Night </span>
                        </h6>
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
                          <span className="ms-1 fs-14">Excellent</span>
                        </div>
                        <span className="badge bg-secondary"> Apartment</span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h6 className="title mb-1">
                            <Link to={all_routes.rentDetails}>
                              Rentora Apartment
                            </Link>
                          </h6>
                          <p className="d-flex align-items-center fs-14 mb-0">
                            <i className="material-icons-outlined me-1 ms-0">
                              location_on
                            </i>
                            305, Palm View Towers, Dubai, UAE
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
                      <div className="d-flex align-items-center justify-content-between flex-wrap border-top border-light-100 pt-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar avatar-lg user-avatar">
                            <ImageWithBasePath
                              src="assets/img/users/user-17.jpg"
                              alt="image"
                              className="rounded-circle"
                            />
                          </div>
                          <Link
                            to="#;"
                            className="mb-0 fs-16 fw-medium text-dark"
                          >
                            Zara Collins
                            <span className="d-block fs-14 text-body pt-1">
                              United Arab Emirates
                            </span>
                          </Link>
                        </div>
                        <Link
                          to={all_routes.rentDetails}
                          className="btn btn-dark"
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                {/* end card */}
              </div>
              {/* end col */}
              {/* Items-9 */}
              <div className="col-xl-4 col-lg-6 col-md-6 d-flex">
                <div className="property-card mb-lg-0 flex-fill">
                  <div className="property-listing-item p-0 mb-0 shadow-none">
                    <div className="buy-grid-img mb-0 rounded-0">
                      <Link to={all_routes.rentDetails}>
                        <ImageWithBasePath
                          className="img-fluid"
                          src="assets/img/rent/rent-grid-img-09.jpg"
                          alt="image"
                        />
                      </Link>
                      <div className="d-flex align-items-center justify-content-between position-absolute bottom-0 end-0 start-0 p-3 z-1">
                        <h6 className="text-white mb-0">
                          $1350
                          <span className="fs-14 fw-normal"> / Night </span>
                        </h6>
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
                          <span className="ms-1 fs-14">Excellent</span>
                        </div>
                        <span className="badge bg-secondary"> Villa</span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h6 className="title mb-1">
                            <Link to={all_routes.rentDetails}>
                              Sunny Side Residences
                            </Link>
                          </h6>
                          <p className="d-flex align-items-center fs-14 mb-0">
                            <i className="material-icons-outlined me-1 ms-0">
                              location_on
                            </i>
                            221, Maple Grove Residences, Austin, US
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
                          2 Bath
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-white text-secondary">
                            straighten
                          </i>
                          680 Sq Ft
                        </li>
                      </ul>
                      <div className="d-flex align-items-center justify-content-between flex-wrap border-top border-light-100 pt-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar avatar-lg user-avatar">
                            <ImageWithBasePath
                              src="assets/img/users/user-18.jpg"
                              alt="image"
                              className="rounded-circle"
                            />
                          </div>
                          <Link
                            to="#;"
                            className="mb-0 fs-16 fw-medium text-dark"
                          >
                            Aiden Sinclair
                            <span className="d-block fs-14 text-body pt-1">
                              United States
                            </span>
                          </Link>
                        </div>
                        <Link
                          to={all_routes.rentDetails}
                          className="btn btn-dark"
                        >
                          Book Now
                        </Link>
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

export default RentGrid;
