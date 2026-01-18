import { Link } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import StickyBox from "react-sticky-box";
import { all_routes } from "../../../../routes/all_routes";

type AgentInfo = {
  id: string;
  name: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
};

type RentRightFormProps = {
  agent?: AgentInfo;
};

const RentRightForm = ({ agent }: RentRightFormProps) => {
  return (
    <StickyBox offsetTop={80} offsetBottom={20}>
      {/* Items-1 */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Provider Details</h5>
        </div>
        <div className="card-body">
          <div className="card bg-light border-0 rounded shadow-none custom-btn">
            <div className="card-body">
              <div className="d-flex align-items-center gap-2">
                <div className="avatar avatar-lg">
                  <ImageWithBasePath
                    src={agent?.avatarUrl || "assets/img/users/user-06.jpg"}
                    alt="image"
                    className="rounded-circle"
                  />
                </div>
                <div>
                  <h6 className="mb-1 fs-16 fw-semibold">
                    <Link className="d-block w-100" to="#">
                      {agent?.name || ""}
                    </Link>
                  </h6>
                  <p className="mb-0 fs-14 text-body">Company Agent</p>
                </div>
              </div>
            </div>
          </div>
          {/* end card */}
          {(agent?.phone || agent?.email) && (
            <div className="border p-2 rounded mb-0">
              {agent?.phone ? (
                <Link
                  to="#"
                  className="d-block mb-3 pb-3 border-bottom text-body d-flex align-items-center"
                >
                  <i className="material-icons-outlined text-body me-2 fs-16 p-1 bg-light rounded text-dark">
                    phone
                  </i>
                  {agent.phone}
                </Link>
              ) : null}
              {agent?.email ? (
                <Link to="#" className="d-block text-body d-flex align-items-center">
                  <i className="material-icons-outlined text-body me-2 fs-16 p-1 bg-light rounded text-dark">
                    email
                  </i>
                  {agent.email}
                </Link>
              ) : null}
            </div>
          )}
        </div>
        {/* end card body*/}
      </div>
      {/* end card */}
      {/* Items-2 */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Enquire Us</h5>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label fw-semibold"> Name </label>
            <input
              type="text"
              className="form-control"
              placeholder="Your Name"
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold"> Email </label>
            <input
              type="text"
              className="form-control"
              placeholder="Your Email"
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold"> Phone </label>
            <input
              type="text"
              className="form-control"
              placeholder="Your Phone Number"
            />
          </div>
          <div className="mb-4">
            <label className="form-label fw-semibold">Description</label>
            <textarea className="form-control" rows={3} defaultValue={""} />
          </div>
          <div>
            <Link to="#" className="btn btn-dark w-100 py-2 fs-14">
              Submit
            </Link>
          </div>
        </div>
        {/* end card body*/}
      </div>
      {/* end card */}
      {/* Items-3 */}
      {false && (
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Why Book With Us</h5>
        </div>
        <div className="card-body">
          <div className="mb-0">
            <p className="d-flex align-items-center gap-2 mb-3 text-body">
              <i className="material-icons-outlined text-secondary">badge</i>
              Expertise and Experience
            </p>
            <p className="d-flex align-items-center gap-2 mb-3 text-body">
              <i className="material-icons-outlined text-secondary">
                design_services
              </i>
              Tailored Services
            </p>
            <p className="d-flex align-items-center gap-2 mb-3 text-body">
              <i className="material-icons-outlined text-secondary">
                play_lesson
              </i>
              Comprehensive Planning
            </p>
            <p className="d-flex align-items-center gap-2 mb-3 text-body">
              <i className="material-icons-outlined text-secondary">person</i>
              Client Satisfaction
            </p>
            <p className="d-flex align-items-center gap-2 mb-0 text-body">
              <i className="material-icons-outlined text-secondary">
                support_agent
              </i>
              24/7 Support
            </p>
          </div>
        </div>
        {/* end card body*/}
      </div>
      )}
      {/* end card */}
      {/* Items-4 */}
      {false && (
      <div className="card mb-0">
        <div className="custom-map position-relative">
          <Link to={all_routes.buyGridMap} className="btn btn-dark fw-medium">
            View Location
          </Link>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d9582106.12236644!2d-15.012343587457918!3d54.10244278649341!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x25a3b1142c791a9%3A0xc4f8a0433288257a!2sUnited%20Kingdom!5e0!3m2!1sen!2sin!4v1747587865989!5m2!1sen!2sin"
            width={600}
            height={450}
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="card-body">
          <h6 className="mb-3"> Nearby Landmarks &amp; Visits </h6>
          <p className="mb-2 text-body">
            <i className="fa-regular fa-circle-check fs-16 me-2 text-body" />
            Near By Statue of Liberty
          </p>
          <p className="mb-2 text-body">
            <i className="fa-regular fa-circle-check fs-16 me-2 text-body" />
            The Metropolitan Museum of Art
          </p>
          <p className="mb-0 text-body">
            <i className="fa-regular fa-circle-check fs-16 me-2 text-body" />
            Yellowstone National Park
          </p>
        </div>
        {/* end card body*/}
      </div>
      )}
      {/* end card */}
    </StickyBox>
  );
};

export default RentRightForm;
