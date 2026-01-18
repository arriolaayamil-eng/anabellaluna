import { Link } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import Breadcrumb from "../../../../../core/common/Breadcrumb/breadcrumb";
import { Agent_Type, Select_Area, Select_Category, Select_City } from "../../../../../core/common/selectOption";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import { all_routes } from "../../../../routes/all_routes";
import { useState } from "react";
import AgenteCreateModal from "../../../../../components/AgenteCreateModal";

const AgentGrid = () => {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      {/* ========================
		Start Page Content
	========================= */}
      <div className="page-wrapper">
        <Breadcrumb
          title="Agent Grid"
          paths={[
            { label: "Agent Grid", active: true },
          ]}
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
            {/* start row */}
            <div className="row justify-content-center">
              <div className="col-xl-3 col-lg-4 col-md-6">
                <div className="agent-item">
                  <div className="agent-img">
                    <Link to={all_routes.agentDetails}>
                      <ImageWithBasePath
                        src="assets/img/agents/agent-01.jpg"
                        className="img-fluid"
                        alt="image"
                      />
                    </Link>
                    <div className="position-absolute top-0 end-0 p-3">
                      <span className="badge bg-secondary">10 Listings</span>
                    </div>
                  </div>
                  <div className="agent-content">
                    <div className="d-flex align-items-center justify-content-center mb-1">
                      <i className="material-icons-outlined text-warning">
                        star
                      </i>
                      <i className="material-icons-outlined text-warning">
                        star
                      </i>
                      <i className="material-icons-outlined text-warning">
                        star
                      </i>
                      <i className="material-icons text-warning">star_border</i>
                      <i className="material-icons text-warning">star_border</i>
                      <span className="ms-1 fs-14">4.4 (25 Reviews)</span>
                    </div>
                    <h5 className="mb-1">
                      <Link to={all_routes.agentDetails}>Brenda Palmer</Link>
                    </h5>
                    <p className="mb-0">Buying Agent</p>
                  </div>
                </div>
              </div>{" "}
              {/* end col */}
              <div className="col-xl-3 col-lg-4 col-md-6">
                <div className="agent-item">
                  <div className="agent-img">
                    <Link to={all_routes.agentDetails}>
                      <ImageWithBasePath
                        src="assets/img/agents/agent-02.jpg"
                        className="img-fluid"
                        alt="image"
                      />
                    </Link>
                    <div className="position-absolute top-0 end-0 p-3">
                      <span className="badge bg-secondary">59 Listings</span>
                    </div>
                  </div>
                  <div className="agent-content">
                    <div className="d-flex align-items-center justify-content-center mb-1">
                      <i className="material-icons-outlined text-warning">
                        star
                      </i>
                      <i className="material-icons-outlined text-warning">
                        star
                      </i>
                      <i className="material-icons-outlined text-warning">
                        star
                      </i>
                      <i className="material-icons text-warning">star_border</i>
                      <i className="material-icons text-warning">star_border</i>
                      <span className="ms-1 fs-14">4.1 (64 Reviews)</span>
                    </div>
                    <h5 className="mb-1">
                      <Link to={all_routes.agentDetails}>Julie Connor</Link>
                    </h5>
                    <p className="mb-0">Selling Agent</p>
                  </div>
                </div>
              </div>{" "}
              {/* end col */}
              <div className="col-xl-3 col-lg-4 col-md-6">
                <div className="agent-item">
                  <div className="agent-img">
                    <Link to={all_routes.agentDetails}>
                      <ImageWithBasePath
                        src="assets/img/agents/agent-03.jpg"
                        className="img-fluid"
                        alt="image"
                      />
                    </Link>
                    <div className="position-absolute top-0 end-0 p-3">
                      <span className="badge bg-secondary">53 Listings</span>
                    </div>
                  </div>
                  <div className="agent-content">
                    <div className="d-flex align-items-center justify-content-center mb-1">
                      <i className="material-icons-outlined text-warning">
                        star
                      </i>
                      <i className="material-icons-outlined text-warning">
                        star
                      </i>
                      <i className="material-icons-outlined text-warning">
                        star
                      </i>
                      <i className="material-icons text-warning">star_border</i>
                      <i className="material-icons text-warning">star_border</i>
                      <span className="ms-1 fs-14">4.3 (21 Reviews)</span>
                    </div>
                    <h5 className="mb-1">
                      <Link to={all_routes.agentDetails}>Amanda Stiner</Link>
                    </h5>
                    <p className="mb-0">Selling Agent</p>
                  </div>
                </div>
              </div>{" "}
              {/* end col */}
              <div className="col-xl-3 col-lg-4 col-md-6">
                <div className="agent-item">
                  <div className="agent-img">
                    <Link to={all_routes.agentDetails}>
                      <ImageWithBasePath
                        src="assets/img/agents/agent-04.jpg"
                        className="img-fluid"
                        alt="image"
                      />
                    </Link>
                    <div className="position-absolute top-0 end-0 p-3">
                      <span className="badge bg-secondary">21 Listings</span>
                    </div>
                  </div>
                  <div className="agent-content">
                    <div className="d-flex align-items-center justify-content-center mb-1">
                      <i className="material-icons-outlined text-warning">
                        star
                      </i>
                      <i className="material-icons-outlined text-warning">
                        star
                      </i>
                      <i className="material-icons-outlined text-warning">
                        star
                      </i>
                      <i className="material-icons text-warning">star_border</i>
                      <i className="material-icons text-warning">star_border</i>
                      <span className="ms-1 fs-14">4.6 (18 Reviews)</span>
                    </div>
                    <h5 className="mb-1">
                      <Link to={all_routes.agentDetails}>Larry Gardner</Link>
                    </h5>
                    <p className="mb-0">Buying Agent</p>
                  </div>
                </div>
              </div>{" "}
              {/* end col */}
              <div className="col-xl-3 col-lg-4 col-md-6">
                <div className="agent-item">
                  <div className="agent-img">
                    <Link to={all_routes.agentDetails}>
                      <ImageWithBasePath
                        src="assets/img/agents/agent-05.jpg"
                        className="img-fluid"
                        alt="image"
                      />
                    </Link>
                    <div className="position-absolute top-0 end-0 p-3">
                      <span className="badge bg-secondary">130 Listings</span>
                    </div>
                  </div>
                  <div className="agent-content">
                    <div className="d-flex align-items-center justify-content-center mb-1">
                      <i className="material-icons-outlined text-warning">
                        star
                      </i>
                      <i className="material-icons-outlined text-warning">
                        star
                      </i>
                      <i className="material-icons-outlined text-warning">
                        star
                      </i>
                      <i className="material-icons text-warning">star_border</i>
                      <i className="material-icons text-warning">star_border</i>
                      <span className="ms-1 fs-14">4.9 (139 Reviews)</span>
                    </div>
                    <h5 className="mb-1">
                      <Link to={all_routes.agentDetails}>Robert Henry</Link>
                    </h5>
                    <p className="mb-0">Selling Agent</p>
                  </div>
                </div>
              </div>{" "}
              {/* end col */}
              <div className="col-xl-3 col-lg-4 col-md-6">
                <div className="agent-item">
                  <div className="agent-img">
                    <Link to={all_routes.agentDetails}>
                      <ImageWithBasePath
                        src="assets/img/agents/agent-06.jpg"
                        className="img-fluid"
                        alt="image"
                      />
                    </Link>
                    <div className="position-absolute top-0 end-0 p-3">
                      <span className="badge bg-secondary">78 Listings</span>
                    </div>
                  </div>
                  <div className="agent-content">
                    <div className="d-flex align-items-center justify-content-center mb-1">
                      <i className="material-icons-outlined text-warning">
                        star
                      </i>
                      <i className="material-icons-outlined text-warning">
                        star
                      </i>
                      <i className="material-icons-outlined text-warning">
                        star
                      </i>
                      <i className="material-icons text-warning">star_border</i>
                      <i className="material-icons text-warning">star_border</i>
                      <span className="ms-1 fs-14">4.8 (36 Reviews)</span>
                    </div>
                    <h5 className="mb-1">
                      <Link to={all_routes.agentDetails}>Esther Reyes</Link>
                    </h5>
                    <p className="mb-0">Buying Agent</p>
                  </div>
                </div>
              </div>{" "}
              {/* end col */}
              <div className="col-xl-3 col-lg-4 col-md-6">
                <div className="agent-item">
                  <div className="agent-img">
                    <Link to={all_routes.agentDetails}>
                      <ImageWithBasePath
                        src="assets/img/agents/agent-07.jpg"
                        className="img-fluid"
                        alt="image"
                      />
                    </Link>
                    <div className="position-absolute top-0 end-0 p-3">
                      <span className="badge bg-secondary">70 Listings</span>
                    </div>
                  </div>
                  <div className="agent-content">
                    <div className="d-flex align-items-center justify-content-center mb-1">
                      <i className="material-icons-outlined text-warning">
                        star
                      </i>
                      <i className="material-icons-outlined text-warning">
                        star
                      </i>
                      <i className="material-icons-outlined text-warning">
                        star
                      </i>
                      <i className="material-icons text-warning">star_border</i>
                      <i className="material-icons text-warning">star_border</i>
                      <span className="ms-1 fs-14">4.5 (19 Reviews)</span>
                    </div>
                    <h5 className="mb-1">
                      <Link to={all_routes.agentDetails}>Albert Scott</Link>
                    </h5>
                    <p className="mb-0">Buying Agent</p>
                  </div>
                </div>
              </div>{" "}
              {/* end col */}
              <div className="col-xl-3 col-lg-4 col-md-6">
                <div className="agent-item">
                  <div className="agent-img">
                    <Link to={all_routes.agentDetails}>
                      <ImageWithBasePath
                        src="assets/img/agents/agent-08.jpg"
                        className="img-fluid"
                        alt="image"
                      />
                    </Link>
                    <div className="position-absolute top-0 end-0 p-3">
                      <span className="badge bg-secondary">93 Listings</span>
                    </div>
                  </div>
                  <div className="agent-content">
                    <div className="d-flex align-items-center justify-content-center mb-1">
                      <i className="material-icons-outlined text-warning">
                        star
                      </i>
                      <i className="material-icons-outlined text-warning">
                        star
                      </i>
                      <i className="material-icons-outlined text-warning">
                        star
                      </i>
                      <i className="material-icons text-warning">star_border</i>
                      <i className="material-icons text-warning">star_border</i>
                      <span className="ms-1 fs-14">4.2 (28 Reviews)</span>
                    </div>
                    <h5 className="mb-1">
                      <Link to={all_routes.agentDetails}>Lisa Sheppard</Link>
                    </h5>
                    <p className="mb-0">Selling Agent</p>
                  </div>
                </div>
              </div>{" "}
              {/* end col */}
            </div>
            {/* end row */}
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
                <form
                  className="search-form"
                  id="search-form"
                >
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <h5>What Are You Looking for?</h5>
                    <Link
                      to="#"
                      className="close"
                      data-bs-dismiss="modal"
                    >
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
                      <Link to={all_routes.rentPropertyGrid}>Royal Apartment</Link>
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
      </div>
      {/* ========================
		End Page Content
	========================= */}
    </>
  );
};

export default AgentGrid;
