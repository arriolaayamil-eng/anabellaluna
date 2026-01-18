import { Link } from "react-router";
import { all_routes } from "../../../../routes/all_routes";

const WorkSection = () => {
  return (
    <>
      {/* Work Section Start */}
      <section className="work-section">
        <div className="container">
          {/* start row */}
          <div className="row align-items-center justify-content-lg-end">
            <div className="col-lg-6">
              {/* Section Title Start */}
              <div
                className="section-title-2"
                data-aos="fade-up"
                data-aos-duration={500}
              >
                <div className="d-flex align-items-center mb-3">
                  <span className="title-square bg-primary" />
                  <span className="title-square bg-secondary" />
                  <span className="text-white d-inline-block ms-2">
                    Post Your Property
                  </span>
                </div>
                <h2>
                  Looking to Post your Exsisting Property We Provide Awesome
                  Solution
                </h2>
                <p>
                  Ya sea que estés buscando comprar o alquilar, te ayudamos a encontrar
                  la propiedad perfecta con herramientas potentes y soporte experto.
                </p>
                <Link
                  to={all_routes.contactUs}
                  className="btn btn-primary"
                >
                  Contactanos
                </Link>
              </div>
              {/* Section Title End */}
            </div>
            <div className="col-lg-6">
              <div className="card work-item border-0 mb-0">
                <div className="card-body">
                  <div className="mb-4">
                    <span className="badge bg-secondary mb-2">
                      How it Works
                    </span>
                    <h2>Want tailor this more for a specific niche</h2>
                  </div>
                  <div className="work-steps">
                    <h6 className="fw-semibold fs-16 mb-1 text-secondary">
                      01. Search for Location
                    </h6>
                    <p className="mb-0 fs-14">
                      Search by location, category, budget, and amenities. Find
                      listings that match your needs—whether it's a home,
                      office, or land.
                    </p>
                  </div>
                  <div className="work-steps">
                    <h6 className="fw-semibold fs-16 mb-1 text-teal">
                      02. Select Property Type
                    </h6>
                    <p className="mb-0 fs-14">
                      Choose from modern apartments, spacious houses, stylish
                      condos, or commercial spaces that meet your specific
                      needs.
                    </p>
                  </div>
                  <div className="work-steps mb-0">
                    <h6 className="fw-semibold fs-16 mb-1 text-purple">
                      03. Book Your Property
                    </h6>
                    <p className="mb-0 fs-14">
                      Select your preferred property type, provide your details,
                      and confirm your booking in just a few easy steps.
                    </p>
                  </div>
                </div>
                {/* end card body */}
              </div>
              {/* end card */}
            </div>
            {/* end col */}
          </div>
          {/* end row */}
        </div>
      </section>
      {/* Work Section End */}
    </>
  );
};

export default WorkSection;
