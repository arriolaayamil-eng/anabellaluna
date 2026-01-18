import { Link } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import Breadcrumb from "../../../../../core/common/Breadcrumb/breadcrumb";
import {
  Agent_Type,
  Select_Area,
  Select_Category,
  Select_City,
} from "../../../../../core/common/selectOption";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import { all_routes } from "../../../../routes/all_routes";
import { useState } from "react";
import AgenteCreateModal from "../../../../../components/AgenteCreateModal";

const AgentList = () => {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      {/* ========================
		Start Page Content
	========================= */}
      <div className="page-wrapper">
        <Breadcrumb
          title="Agent List"
          paths={[{ label: "Agent List", active: true }]}
        />

        {/* End Breadscrumb */}
        {/* Start Content */}
        <div className="content">
          <div className="container">
            <div className="row mb-4">
              <div className="col-lg-3 col-sm-6">
                <div className="mb-3">
                  <label className="form-label">Agent Type</label>
                  <CommonSelect
                    options={Agent_Type}
                    className="select"
                    defaultValue={Agent_Type[0]}
                  />
                </div>
              </div>
              <div className="col-lg-3 col-sm-6">
                <div className="mb-3">
                  <label className="form-label">Select City </label>
                  <CommonSelect
                    options={Select_City}
                    className="select"
                    defaultValue={Select_City[0]}
                  />
                </div>
              </div>
              <div className="col-lg-3 col-sm-6">
                <div className="mb-3">
                  <label className="form-label">Select Area</label>
                  <CommonSelect
                    options={Select_Area}
                    className="select"
                    defaultValue={Select_Area[0]}
                  />
                </div>
              </div>
              <div className="col-lg-3 col-sm-6">
                <div className="mb-3">
                  <label className="form-label">Select Category</label>
                  <CommonSelect
                    options={Select_Category}
                    className="select"
                    defaultValue={Select_Category[0]}
                  />
                </div>
              </div>
            </div>
            <div className="row mb-4">
              <div className="col-12 text-end">
                <button
                  type="button"
                  className="btn btn-primary align-items-center d-inline-flex"
                  onClick={() => setShowModal(true)}
                >
                  <i className="material-icons-outlined me-1">person_add</i>Nuevo Agente
                </button>
              </div>
            </div>
            <div className="agent-list-item">
              <div className="agent-img">
                <Link to={all_routes.agentDetails}>
                  <ImageWithBasePath
                    src="assets/img/agents/agent-01.jpg"
                    alt="image"
                  />
                </Link>
              </div>
              <div className="agent-content">
                <div className="d-flex align-items-center mb-2">
                  <i className="material-icons-outlined text-warning">star</i>
                  <i className="material-icons-outlined text-warning">star</i>
                  <i className="material-icons-outlined text-warning">star</i>
                  <i className="material-icons text-warning">star_border</i>
                  <i className="material-icons text-warning">star_border</i>
                  <span className="ms-1 fs-14">4.2 (28 Reviews)</span>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <h5 className="mb-1">
                      <Link to={all_routes.agentDetails}>Lisa Sheppard</Link>
                    </h5>
                    <p className="mb-0">Buying Agent</p>
                  </div>
                  <span className="badge bg-secondary">93 Listings</span>
                </div>
                <div className="border-bottom mb-3 pb-3">
                  <p className="mb-0">
                    Dedicated property buying agent with deep market knowledge,
                    negotiation skills, and personalized service—committed to
                    helping clients find the perfect home or investment while
                    ensuring a smooth, stress-free buying experience.
                  </p>
                </div>
                <div className="social-icons">
                  <Link to="#">
                    <i className="fa-brands fa-x-twitter" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-facebook" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-instagram" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-linkedin" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-pinterest" />
                  </Link>
                </div>
              </div>
            </div>
            <div className="agent-list-item">
              <div className="agent-img">
                <Link to={all_routes.agentDetails}>
                  <ImageWithBasePath
                    src="assets/img/agents/agent-02.jpg"
                    alt="image"
                  />
                </Link>
              </div>
              <div className="agent-content">
                <div className="d-flex align-items-center mb-2">
                  <i className="material-icons-outlined text-warning">star</i>
                  <i className="material-icons-outlined text-warning">star</i>
                  <i className="material-icons-outlined text-warning">star</i>
                  <i className="material-icons text-warning">star_border</i>
                  <i className="material-icons text-warning">star_border</i>
                  <span className="ms-1 fs-14">4.0 (28 Reviews)</span>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <h5 className="mb-1">
                      <Link to={all_routes.agentDetails}>Julie Connor</Link>
                    </h5>
                    <p className="mb-0">Selling Agent</p>
                  </div>
                  <span className="badge bg-secondary">45 Listings</span>
                </div>
                <div className="border-bottom mb-3 pb-3">
                  <p className="mb-0">
                    Experienced real estate selling agent providing expert
                    pricing, marketing, and negotiation strategies to help
                    homeowners sell faster and at the best possible value in
                    today’s competitive market.
                  </p>
                </div>
                <div className="social-icons">
                  <Link to="#">
                    <i className="fa-brands fa-x-twitter" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-facebook" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-instagram" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-linkedin" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-pinterest" />
                  </Link>
                </div>
              </div>
            </div>
            <div className="agent-list-item">
              <div className="agent-img">
                <Link to={all_routes.agentDetails}>
                  <ImageWithBasePath
                    src="assets/img/agents/agent-03.jpg"
                    alt="image"
                  />
                </Link>
              </div>
              <div className="agent-content">
                <div className="d-flex align-items-center mb-2">
                  <i className="material-icons-outlined text-warning">star</i>
                  <i className="material-icons-outlined text-warning">star</i>
                  <i className="material-icons-outlined text-warning">star</i>
                  <i className="material-icons text-warning">star_border</i>
                  <i className="material-icons text-warning">star_border</i>
                  <span className="ms-1 fs-14">3.0 (17 Reviews)</span>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <h5 className="mb-1">
                      <Link to={all_routes.agentDetails}>Amanda Stiner</Link>
                    </h5>
                    <p className="mb-0">Selling Agent</p>
                  </div>
                  <span className="badge bg-secondary">27 Listings</span>
                </div>
                <div className="border-bottom mb-3 pb-3">
                  <p className="mb-0">
                    Dedicated selling agent who listens, advises, and acts
                    quickly. Specializing in smooth, profitable sales with full
                    support from listing to closing—always prioritizing client
                    goals and satisfaction.
                  </p>
                </div>
                <div className="social-icons">
                  <Link to="#">
                    <i className="fa-brands fa-x-twitter" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-facebook" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-instagram" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-linkedin" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-pinterest" />
                  </Link>
                </div>
              </div>
            </div>
            <div className="agent-list-item">
              <div className="agent-img">
                <Link to={all_routes.agentDetails}>
                  <ImageWithBasePath
                    src="assets/img/agents/agent-04.jpg"
                    alt="image"
                  />
                </Link>
              </div>
              <div className="agent-content">
                <div className="d-flex align-items-center mb-2">
                  <i className="material-icons-outlined text-warning">star</i>
                  <i className="material-icons-outlined text-warning">star</i>
                  <i className="material-icons-outlined text-warning">star</i>
                  <i className="material-icons text-warning">star_border</i>
                  <i className="material-icons text-warning">star_border</i>
                  <span className="ms-1 fs-14">4.0 (25 Reviews)</span>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <h5 className="mb-1">
                      <Link to={all_routes.agentDetails}>Larry Gardner</Link>
                    </h5>
                    <p className="mb-0">Buying Agent</p>
                  </div>
                  <span className="badge bg-secondary">54 Listings</span>
                </div>
                <div className="border-bottom mb-3 pb-3">
                  <p className="mb-0">
                    Trusted real estate buying agent specializing in residential
                    and investment properties. Delivers tailored advice, strong
                    negotiation, and end-to-end support to make your property
                    purchase seamless, successful, and rewarding.
                  </p>
                </div>
                <div className="social-icons">
                  <Link to="#">
                    <i className="fa-brands fa-x-twitter" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-facebook" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-instagram" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-linkedin" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-pinterest" />
                  </Link>
                </div>
              </div>
            </div>
            <div className="agent-list-item">
              <div className="agent-img">
                <Link to={all_routes.agentDetails}>
                  <ImageWithBasePath
                    src="assets/img/agents/agent-05.jpg"
                    alt="image"
                  />
                </Link>
              </div>
              <div className="agent-content">
                <div className="d-flex align-items-center mb-2">
                  <i className="material-icons-outlined text-warning">star</i>
                  <i className="material-icons-outlined text-warning">star</i>
                  <i className="material-icons-outlined text-warning">star</i>
                  <i className="material-icons text-warning">star_border</i>
                  <i className="material-icons text-warning">star_border</i>
                  <span className="ms-1 fs-14">4.0 (38 Reviews)</span>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <h5 className="mb-1">
                      <Link to={all_routes.agentDetails}>Robert Henry</Link>
                    </h5>
                    <p className="mb-0">Selling Agent</p>
                  </div>
                  <span className="badge bg-secondary">36 Listings</span>
                </div>
                <div className="border-bottom mb-3 pb-3">
                  <p className="mb-0">
                    Helping sellers stand out with modern marketing,
                    high-quality listings, and targeted exposure. From staging
                    to final signatures, I manage every detail to ensure maximum
                    value and minimal hassle.
                  </p>
                </div>
                <div className="social-icons">
                  <Link to="#">
                    <i className="fa-brands fa-x-twitter" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-facebook" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-instagram" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-linkedin" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-pinterest" />
                  </Link>
                </div>
              </div>
            </div>
            <div className="agent-list-item">
              <div className="agent-img">
                <Link to={all_routes.agentDetails}>
                  <ImageWithBasePath
                    src="assets/img/agents/agent-06.jpg"
                    alt="image"
                  />
                </Link>
              </div>
              <div className="agent-content">
                <div className="d-flex align-items-center mb-2">
                  <i className="material-icons-outlined text-warning">star</i>
                  <i className="material-icons-outlined text-warning">star</i>
                  <i className="material-icons-outlined text-warning">star</i>
                  <i className="material-icons text-warning">star_border</i>
                  <i className="material-icons text-warning">star_border</i>
                  <span className="ms-1 fs-14">5.0 (37 Reviews)</span>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <h5 className="mb-1">
                      <Link to={all_routes.agentDetails}>Esther Reyes</Link>
                    </h5>
                    <p className="mb-0">Selling Agent</p>
                  </div>
                  <span className="badge bg-secondary">29 Listings</span>
                </div>
                <div className="border-bottom mb-3 pb-3">
                  <p className="mb-0">
                    Seasoned agent with a strong sales track record. Offers
                    market insights, staging tips, and strategic pricing to
                    attract serious buyers and close deals quickly and
                    efficiently.
                  </p>
                </div>
                <div className="social-icons">
                  <Link to="#">
                    <i className="fa-brands fa-x-twitter" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-facebook" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-instagram" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-linkedin" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-pinterest" />
                  </Link>
                </div>
              </div>
            </div>
            <div className="agent-list-item">
              <div className="agent-img">
                <Link to={all_routes.agentDetails}>
                  <ImageWithBasePath
                    src="assets/img/agents/agent-07.jpg"
                    alt="image"
                  />
                </Link>
              </div>
              <div className="agent-content">
                <div className="d-flex align-items-center mb-2">
                  <i className="material-icons-outlined text-warning">star</i>
                  <i className="material-icons-outlined text-warning">star</i>
                  <i className="material-icons-outlined text-warning">star</i>
                  <i className="material-icons text-warning">star_border</i>
                  <i className="material-icons text-warning">star_border</i>
                  <span className="ms-1 fs-14">5.0 (37 Reviews)</span>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <h5 className="mb-1">
                      <Link to={all_routes.agentDetails}>Albert Scott</Link>
                    </h5>
                    <p className="mb-0">Buying Agent</p>
                  </div>
                  <span className="badge bg-secondary">76 Listings</span>
                </div>
                <div className="border-bottom mb-3 pb-3">
                  <p className="mb-0">
                    Professional buying agent with a client-first approach,
                    offering expert market analysis, property scouting, and
                    negotiation to secure the best deals and simplify your real
                    estate journey from start to finish.
                  </p>
                </div>
                <div className="social-icons">
                  <Link to="#">
                    <i className="fa-brands fa-x-twitter" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-facebook" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-instagram" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-linkedin" />
                  </Link>
                  <Link to="#">
                    <i className="fa-brands fa-pinterest" />
                  </Link>
                </div>
              </div>
            </div>
            <div className="text-center pt-3">
              <Link
                to="#"
                className="btn btn-dark align-items-center d-inline-flex"
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
      {/* Search Modal */}
      <div
        className="modal fade"
        id="search-modal"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="modal-dialog  modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-body search-wrap">
              <form className="search-form" id="search-form">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <h5>What Are You Looking for?</h5>
                  <Link to="#" className="close" data-bs-dismiss="modal">
                    <i className="material-icons-outlined">close</i>
                  </Link>
                </div>
                <div className="input-group input-group-flat">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type a Keyword...."
                  />
                  <span className="input-group-text">
                    <i className="material-icons-outlined">search</i>
                  </span>
                </div>
                <h6>Popular Properties</h6>
                <div className="search-list">
                  <p>
                    <Link to={all_routes.rentPropertyGrid}>
                      Beautiful Condo Room
                    </Link>
                  </p>
                  <p>
                    <Link to={all_routes.rentPropertyGrid}>
                      Royal Apartment
                    </Link>
                  </p>
                  <p>
                    <Link to={all_routes.rentPropertyGrid}>
                      Grand Villa House
                    </Link>
                  </p>
                  <p>
                    <Link to={all_routes.rentPropertyGrid}>Grand Mahaka</Link>
                  </p>
                  <p>
                    <Link to={all_routes.rentPropertyGrid}>
                      Lunaria Residence
                    </Link>
                  </p>
                  <p>
                    <Link to={all_routes.rentPropertyGrid}>
                      Stephen Alexander Homes
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* End Search Modal */}
      <AgenteCreateModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => window.location.reload()}
      />
    </>
  );
};

export default AgentList;
