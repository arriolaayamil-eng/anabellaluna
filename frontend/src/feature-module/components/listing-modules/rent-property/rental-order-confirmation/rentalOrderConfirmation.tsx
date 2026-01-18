import { Link } from "react-router";
import Breadcrumb from "../../../../../core/common/Breadcrumb/breadcrumb";
import { all_routes } from "../../../../routes/all_routes";

const RentalOrderConfirmation = () => {
  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Breadscrumb */}
        <Breadcrumb
          title="Rental Order Confirmation"
          paths={[{ label: "Rental Order Confirmation", active: true }]}
        />

        {/* End Breadscrumb */}
        {/* Start Content */}
        <div className="content">
          <div className="container">
            {/* start row */}
            <div className="row">
              <div className="col-lg-10 mx-auto">
                <div className="booking-wrap">
                  <div className="booking-item-01">
                    <p className="d-inline-flex align-items-center text-success mb-0">
                      <i className="material-icons-outlined me-1">
                        check_circle
                      </i>
                      Modern apartment in the city centre is available for
                      rental
                    </p>
                  </div>
                </div>
                <div className="card border-0 bg-light shadow-none">
                  <div className="card-body">
                    {/* start row */}
                    <div className="row row-gap-3">
                      <div className="col-lg-5">
                        <p className="fw-semibold text-dark mb-1">Details</p>
                        <p className="fs-14 mb-0">
                          Modern Apartment in the city centre
                        </p>
                      </div>
                      {/* end col */}
                      <div className="col-lg-5">
                        <p className="fw-semibold text-dark mb-1">Location</p>
                        <p className="fs-14 mb-0">
                          318-330 S Oakley Blvd, Chicago, IL 60612, USA
                        </p>
                      </div>
                      {/* end col */}
                      <div className="col-lg-2">
                        <p className="fw-semibold text-dark mb-1">
                          Booking Amount
                        </p>
                        <h4 className="text-primary mb-0">
                          $300{" "}
                          <span className="text-dark fs-14 fw-normal">
                            / Day
                          </span>
                        </h4>
                      </div>
                      {/* end col */}
                    </div>
                    {/* end row */}
                  </div>
                  {/* end card body */}
                </div>
                {/* end card */}
                <div className="card mb-5">
                  <div className="card-body">
                    <h6 className="mb-3">Property Booking Details</h6>
                    <div className="d-flex align-items-center flex-wrap gap-2 mb-2">
                      <div className="me-5">
                        <p className="fw-semibold text-dark mb-1">Name</p>
                        <p className="mb-0">James Anderson</p>
                      </div>
                      <div className="me-5">
                        <p className="fw-semibold text-dark mb-1">Email</p>
                        <p className="mb-0">james@example.com</p>
                      </div>
                      <div className="me-5">
                        <p className="fw-semibold text-dark mb-1">
                          Phone Number
                        </p>
                        <p className="mb-0">+1 9854763298</p>
                      </div>
                      <div>
                        <p className="fw-semibold text-dark mb-1">Address</p>
                        <p className="mb-0">
                          318-330 S Oakley Blvd, Chicago, IL 60612, USA
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="fw-semibold text-dark mb-1">Comments</p>
                      <p className="mb-0">
                        This property is mostly wooded and sits high on a
                        hilltop overlooking the Mohawk River Valley. Located
                        right in the heart Upstate NYs Amish farm Country, this
                        land is certified organic making it extremely rare!
                      </p>
                    </div>
                  </div>
                  {/* end card body */}
                </div>
                {/* end card */}
                <div className="d-flex align-items-center justify-content-end">
                  <Link
                    to={all_routes.rentalOrderDetails}
                    className="btn btn-dark me-2"
                  >
                    Back to Order Details
                  </Link>
                  <Link
                    to={all_routes.index}
                    className="btn btn-primary me-2"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
              {/* end col */}
            </div>
            {/* end row */}
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

export default RentalOrderConfirmation;
