import { Link } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import CountUp from "react-countup";

const AboutUsSection = () => {
  return (
    <>
      {/* About Us Section Start */}
      <section className="about-us-section-2">
        <div className="container">
          {/* start row */}
          <div className="row align-items-center gy-4">
            <div className="col-lg-6">
              {/* Section Title Start */}
              <div
                className="title-head"
                data-aos="fade-up"
                data-aos-duration={500}
              >
                <span className="badge bg-secondary mb-2">About Us</span>
                <h2 className="mb-2">
                  We make property discovery simple, transparent, and
                  stress-free.
                </h2>
                <p>
                  These hand-picked locations highlight our strongest presence,
                  fastest response times, and highest customer satisfaction.
                  Whether you're looking for expert professionals or trusted
                  services nearby, explore what's available in your area.
                </p>
                <div className="d-flex align-items-center">
                  <Link
                    to={all_routes.contactUs}
                    className="btn btn-primary btn-lg"
                  >
                    Contactanos
                  </Link>
                </div>
              </div>
              {/* Section Title End */}
            </div>
            {/* end col */}
            <div className="col-lg-6">
              <div
                className="position-relative"
                data-aos="fade-up"
                data-aos-duration={1000}
              >
                <div>
                  <ImageWithBasePath
                    src="assets/img/section-bg/section-bg-01.png"
                    className="img-fluid"
                    alt="image"
                  />
                </div>
                <div className="position-absolute end-0 top-0">
                  <ImageWithBasePath
                    src="assets/img/bg/line-01.svg"
                    alt="image"
                  />
                </div>
                <div className="position-absolute start-0 bottom-0">
                  <ImageWithBasePath
                    src="assets/img/bg/line-02.svg"
                    alt="image"
                  />
                </div>
              </div>
            </div>
            {/* end col */}
          </div>
          {/* end row */}
          <div className="counter-list">
            {/* start row */}
            <div className="row">
              <div
                className="col-lg-3 col-sm-6 d-flex"
                data-aos="fade-up"
                data-aos-duration={1000}
              >
                <div className="counting-item flex-fill">
                  <span className="count-icon">
                    <ImageWithBasePath
                      src="assets/img/icons/count-01.svg"
                      alt="image"
                    />
                  </span>
                  <div>
                    <h4 className="mb-1">
                      <CountUp end={1200} duration={3} separator="," />+
                    </h4>
                    <p className="mb-0">Rentals Completed</p>
                  </div>
                </div>
              </div>
              {/* end col */}
              <div
                className="col-lg-3 col-sm-6 d-flex"
                data-aos="fade-up"
                data-aos-duration={1500}
              >
                <div className="counting-item flex-fill">
                  <span className="count-icon">
                    <ImageWithBasePath
                      src="assets/img/icons/count-02.svg"
                      alt="image"
                    />
                  </span>
                  <div>
                    <h4 className="mb-1">
                      <CountUp end={1514} duration={3} separator="," />+
                    </h4>
                    <p className="mb-0">Trusted Owners</p>
                  </div>
                </div>
              </div>
              {/* end col */}
              <div
                className="col-lg-3 col-sm-6 d-flex"
                data-aos="fade-up"
                data-aos-duration={2000}
              >
                <div className="counting-item flex-fill">
                  <span className="count-icon">
                    <ImageWithBasePath
                      src="assets/img/icons/count-03.svg"
                      alt="image"
                    />
                  </span>
                  <div>
                    <h4 className="mb-1">
                      <CountUp end={9} duration={3} separator="," />
                      K+
                    </h4>
                    <p className="mb-0">Happy Clients</p>
                  </div>
                </div>
              </div>
              {/* end col */}
              <div
                className="col-lg-3 col-sm-6 d-flex"
                data-aos="fade-up"
                data-aos-duration={2500}
              >
                <div className="counting-item flex-fill">
                  <span className="count-icon">
                    <ImageWithBasePath
                      src="assets/img/icons/count-02.svg"
                      alt="image"
                    />
                  </span>
                  <div>
                    <h4 className="mb-1">
                      <CountUp end={1514} duration={3} separator="," />+
                    </h4>
                    <p className="mb-0">Total Bookings</p>
                  </div>
                </div>
              </div>
              {/* end col */}
            </div>
            {/* end row */}
          </div>
        </div>
      </section>
      {/* About Us Section End */}
    </>
  );
};

export default AboutUsSection;
