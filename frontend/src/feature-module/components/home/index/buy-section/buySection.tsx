import { Link } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";

const BuySection = () => {
  return (
    <>
      {/* start buy section */}
      <section className="buy-property-section section-padding pb-0">
        <div className="container">
          <div className="row justify-content-center">
            {/* buy property item */}
            <div className="col-lg-4 col-md-6">
              <div
                className="buy-property-item text-center mb-lg-0 mb-md-0  mb-4 aos"
                data-aos="fade-down"
                data-aos-duration={1000}
              >
                <div className="img-card overflow-hidden text-center">
                  <Link to={all_routes.buyPropertyGrid}>
                    <ImageWithBasePath
                      src="assets/img/home/city/property-img-1.jpg"
                      alt="Property Image"
                    />
                  </Link>
                </div>
                <div className="buy-property bg-white d-flex align-items-center justify-content-between">
                  <h6 className="mb-0">
                    <Link to={all_routes.buyPropertyGrid}>
                      Comprar
                    </Link>
                  </h6>
                  <Link
                    to={all_routes.buyPropertyGrid}
                    className="arrow buy-arrow d-flex align-items-center justify-content-center bg-error rounded-circle"
                  >
                    <i className="fa-solid fa-arrow-right" />
                  </Link>
                </div>
              </div>
            </div>
            {/* sell property item */}
            <div className="col-lg-4 col-md-6">
              <div
                className="buy-property-item mb-lg-0 mb-4 text-center aos"
                data-aos="fade-up"
                data-aos-duration={1000}
              >
                <div className="img-card overflow-hidden text-center">
                  <Link to={all_routes.rentPropertyGrid}>
                    <ImageWithBasePath
                      src="assets/img/home/city/property-img-2.jpg"
                      alt="Property Image"
                    />
                  </Link>
                </div>
                <div className="buy-property bg-white d-flex align-items-center justify-content-between">
                  <h6 className="mb-0">
                    <Link to={all_routes.buyPropertyGrid}>
                      Comprar
                    </Link>
                  </h6>
                  <Link
                    to={all_routes.buyPropertyGrid}
                    className="arrow sell-arrow d-flex align-items-center justify-content-center bg-warning rounded-circle"
                  >
                    <i className="fa-solid fa-arrow-right" />
                  </Link>
                </div>
              </div>
            </div>
            {/* rent property item */}
            <div className="col-lg-4 col-md-6">
              <div
                className="buy-property-item mb-0 text-center aos"
                data-aos="fade-down"
                data-aos-duration={1000}
              >
                <div className="img-card overflow-hidden text-center">
                  <Link to={all_routes.rentPropertyGrid}>
                    <ImageWithBasePath
                      src="assets/img/home/city/property-img-3.jpg"
                      alt="Property Image"
                    />
                  </Link>
                </div>
                <div className="buy-property bg-white d-flex align-items-center justify-content-between">
                  <h6 className="mb-0">
                    <Link to={all_routes.rentPropertyGrid}>
                      Alquilar
                    </Link>
                  </h6>
                  <Link
                    to={all_routes.rentPropertyGrid}
                    className="arrow rent-arrow d-flex align-items-center justify-content-center bg-info rounded-circle"
                  >
                    <i className="fa-solid fa-arrow-right" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* end buy section */}
    </>
  );
};

export default BuySection;
