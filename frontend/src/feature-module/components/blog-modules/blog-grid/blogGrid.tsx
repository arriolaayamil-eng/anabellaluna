import { useEffect, useState } from "react";
import { Link } from "react-router";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import { all_routes } from "../../../routes/all_routes";
import Breadcrumb from "../../../../core/common/Breadcrumb/breadcrumb";
import publicService from "../../../../services/publicService";

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const BlogGrid = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      try {
        setIsLoading(true);
        const res = await publicService.getBlogPosts();
        if (!isMounted) return;
        setPosts(res.items || []);
      } catch {
        if (!isMounted) return;
        setPosts([]);
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

  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Breadscrumb */}
        <Breadcrumb
          title="Blog Grid"
          paths={[{ label: "Blog Grid", active: true }]}
        />

        {/* End Breadscrumb */}
        {/* Start Content */}
        <div className="content">
          <div className="container">
            {/* start row */}
            <div className="row row-gap-4 justify-content-center">
              {isLoading ? (
                <div className="col-12 text-center">Loading...</div>
              ) : null}

              {!isLoading && posts.length === 0 ? (
                <div className="col-12 text-center">No posts</div>
              ) : null}

              {posts.map((post) => (
                <div key={post.id || post.slug} className="col-md-6 col-lg-4">
                  <div className="blog-item-01">
                    <div className="blog-img">
                      <Link
                        to={post.slug ? all_routes.blogDetailsPath(post.slug) : "#"}
                      >
                        {post.coverUrl ? (
                          <ImageWithBasePath
                            src={post.coverUrl}
                            alt="img"
                            className="img-fluid"
                          />
                        ) : null}
                      </Link>
                    </div>
                    <div className="blog-content">
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
                        <span className="badge badge-sm bg-secondary fw-semibold">
                          {post.category?.name || ""}
                        </span>
                        <div className="d-flex align-items-center author-details">
                          <div className="d-flex align-items-center me-3">
                            <Link to={all_routes.agentDetails}>
                              {post.authorAgent?.avatarUrl ? (
                                <ImageWithBasePath
                                  src={post.authorAgent.avatarUrl}
                                  alt="image"
                                  className="avatar avatar-sm rounded-circle me-2"
                                />
                              ) : null}
                            </Link>
                            <Link to={all_routes.agentDetails}>
                              {post.authorAgent?.name || ""}
                            </Link>
                          </div>
                          <span className="d-inline-flex align-items-center">
                            <i className="material-icons-outlined me-1">events</i>
                            {formatDate(post.publishedAt)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h5 className="mb-1">
                          <Link
                            to={post.slug ? all_routes.blogDetailsPath(post.slug) : "#"}
                          >
                            {post.title || ""}
                          </Link>
                        </h5>
                        <p className="mb-0">{post.excerpt || ""}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {false && (
            <div className="row row-gap-4 justify-content-center">
              <div className="col-md-6 col-lg-4">
                <div className="blog-item-01">
                  <div className="blog-img">
                    <Link to={all_routes.blogDetails}>
                      <ImageWithBasePath
                        src="assets/img/blogs/blog-img-01.jpg"
                        alt="img"
                        className="img-fluid"
                      />
                    </Link>
                  </div>
                  <div className="blog-content">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
                      <span className="badge badge-sm bg-secondary fw-semibold">
                        Property
                      </span>
                      <div className="d-flex align-items-center author-details">
                        <div className="d-flex align-items-center me-3">
                          <Link to={all_routes.agentDetails}>
                            <ImageWithBasePath
                              src="assets/img/agents/agent-01.jpg"
                              alt="image"
                              className="avatar avatar-sm rounded-circle me-2"
                            />
                          </Link>
                          <Link to={all_routes.agentDetails}>Susan Culli</Link>
                        </div>
                        <span className="d-inline-flex align-items-center">
                          <i className="material-icons-outlined me-1">events</i>
                          10 Apr 2025
                        </span>
                      </div>
                    </div>
                    <div>
                      <h5 className="mb-1">
                        <Link to={all_routes.blogDetails}>
                          Location is Everything
                        </Link>
                      </h5>
                      <p className="mb-0">
                        The value of a property largely depends on where it’s
                        located.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* end col */}
              <div className="col-md-6 col-lg-4">
                <div className="blog-item-01">
                  <div className="blog-img">
                    <Link to={all_routes.blogDetails}>
                      <ImageWithBasePath
                        src="assets/img/blogs/blog-img-02.jpg"
                        alt="img"
                        className="img-fluid"
                      />
                    </Link>
                  </div>
                  <div className="blog-content">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
                      <span className="badge badge-sm bg-secondary fw-semibold">
                        Vila
                      </span>
                      <div className="d-flex align-items-center author-details">
                        <div className="d-flex align-items-center me-3">
                          <Link to={all_routes.agentDetails}>
                            <ImageWithBasePath
                              src="assets/img/agents/agent-04.jpg"
                              alt="image"
                              className="avatar avatar-sm rounded-circle me-2"
                            />
                          </Link>
                          <Link to={all_routes.agentDetails}>Shelly Cox</Link>
                        </div>
                        <span className="d-inline-flex align-items-center">
                          <i className="material-icons-outlined me-1">events</i>
                          24 Apr 2025
                        </span>
                      </div>
                    </div>
                    <div>
                      <h5 className="mb-1">
                        <Link to={all_routes.blogDetails}>
                          Real Estate is a Investment
                        </Link>
                      </h5>
                      <p className="mb-0">
                        Unlike stocks, real estate usually grows in value over
                        time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* end col */}
              <div className="col-md-6 col-lg-4">
                <div className="blog-item-01">
                  <div className="blog-img">
                    <Link to={all_routes.blogDetails}>
                      <ImageWithBasePath
                        src="assets/img/blogs/blog-img-03.jpg"
                        alt="img"
                        className="img-fluid"
                      />
                    </Link>
                  </div>
                  <div className="blog-content">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
                      <span className="badge badge-sm bg-secondary fw-semibold">
                        Godown
                      </span>
                      <div className="d-flex align-items-center author-details">
                        <div className="d-flex align-items-center me-3">
                          <Link to={all_routes.agentDetails}>
                            <ImageWithBasePath
                              src="assets/img/agents/agent-02.jpg"
                              alt="image"
                              className="avatar avatar-sm rounded-circle me-2"
                            />
                          </Link>
                          <Link to={all_routes.agentDetails}>Eva Jones</Link>
                        </div>
                        <span className="d-inline-flex align-items-center">
                          <i className="material-icons-outlined me-1">events</i>
                          27 Sep 2025
                        </span>
                      </div>
                    </div>
                    <div>
                      <h5 className="mb-1">
                        <Link to={all_routes.blogDetails}>
                          Market Trends Matter
                        </Link>
                      </h5>
                      <p className="mb-0">
                        Staying informed about housing market trends helps you
                        make smarter.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* end col */}
              <div className="col-md-6 col-lg-4">
                <div className="blog-item-01">
                  <div className="blog-img">
                    <Link to={all_routes.blogDetails}>
                      <ImageWithBasePath
                        src="assets/img/blogs/blog-img-04.jpg"
                        alt="img"
                        className="img-fluid"
                      />
                    </Link>
                  </div>
                  <div className="blog-content">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
                      <span className="badge badge-sm bg-secondary fw-semibold">
                        Factory
                      </span>
                      <div className="d-flex align-items-center author-details">
                        <div className="d-flex align-items-center me-3">
                          <Link to={all_routes.agentDetails}>
                            <ImageWithBasePath
                              src="assets/img/agents/agent-03.jpg"
                              alt="image"
                              className="avatar avatar-sm rounded-circle me-2"
                            />
                          </Link>
                          <Link to={all_routes.agentDetails}>Rebecca</Link>
                        </div>
                        <span className="d-inline-flex align-items-center">
                          <i className="material-icons-outlined me-1">events</i>
                          10 May 2025
                        </span>
                      </div>
                    </div>
                    <div>
                      <h5 className="mb-1">
                        <Link to={all_routes.blogDetails}>
                          Property Type Affects Value
                        </Link>
                      </h5>
                      <p className="mb-0">
                        Residential, commercial, and industrial properties vary
                        widely available in price and features.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* end col */}
              <div className="col-md-6 col-lg-4">
                <div className="blog-item-01">
                  <div className="blog-img">
                    <Link to={all_routes.blogDetails}>
                      <ImageWithBasePath
                        src="assets/img/blogs/blog-img-05.jpg"
                        alt="img"
                        className="img-fluid"
                      />
                    </Link>
                  </div>
                  <div className="blog-content">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
                      <span className="badge badge-sm bg-secondary fw-semibold">
                        Guest house
                      </span>
                      <div className="d-flex align-items-center author-details">
                        <div className="d-flex align-items-center me-3">
                          <Link to={all_routes.agentDetails}>
                            <ImageWithBasePath
                              src="assets/img/agents/agent-06.jpg"
                              alt="image"
                              className="avatar avatar-sm rounded-circle me-2"
                            />
                          </Link>
                          <Link to={all_routes.agentDetails}>Sheila</Link>
                        </div>
                        <span className="d-inline-flex align-items-center">
                          <i className="material-icons-outlined me-1">events</i>
                          28 May 2025
                        </span>
                      </div>
                    </div>
                    <div>
                      <h5 className="mb-1">
                        <Link to={all_routes.blogDetails}>
                          Financing Options Are Crucial
                        </Link>
                      </h5>
                      <p className="mb-0">
                        Understanding mortgages, interest rates, and loan types
                        can save you thousands over time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* end col */}
              <div className="col-md-6 col-lg-4">
                <div className="blog-item-01">
                  <div className="blog-img">
                    <Link to={all_routes.blogDetails}>
                      <ImageWithBasePath
                        src="assets/img/blogs/blog-img-06.jpg"
                        alt="img"
                        className="img-fluid"
                      />
                    </Link>
                  </div>
                  <div className="blog-content">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
                      <span className="badge badge-sm bg-secondary fw-semibold">
                        Cottage
                      </span>
                      <div className="d-flex align-items-center author-details">
                        <div className="d-flex align-items-center me-3">
                          <Link to={all_routes.agentDetails}>
                            <ImageWithBasePath
                              src="assets/img/agents/agent-07.jpg"
                              alt="image"
                              className="avatar avatar-sm rounded-circle me-2"
                            />
                          </Link>
                          <Link to={all_routes.agentDetails}>
                            Walter Cusson
                          </Link>
                        </div>
                        <span className="d-inline-flex align-items-center">
                          <i className="material-icons-outlined me-1">events</i>
                          02 Jul 2025
                        </span>
                      </div>
                    </div>
                    <div>
                      <h5 className="mb-1">
                        <Link to={all_routes.blogDetails}>
                          Real Estate Agents Add Value
                        </Link>
                      </h5>
                      <p className="mb-0">
                        A knowledgeable agent can guide you through paperwork,
                        negotiations, and legalities with ease.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* end col */}
              <div className="col-md-6 col-lg-4">
                <div className="blog-item-01">
                  <div className="blog-img">
                    <Link to={all_routes.blogDetails}>
                      <ImageWithBasePath
                        src="assets/img/blogs/blog-img-07.jpg"
                        alt="img"
                        className="img-fluid"
                      />
                    </Link>
                  </div>
                  <div className="blog-content">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
                      <span className="badge badge-sm bg-secondary fw-semibold">
                        Duplex
                      </span>
                      <div className="d-flex align-items-center author-details">
                        <div className="d-flex align-items-center me-3">
                          <Link to={all_routes.agentDetails}>
                            <ImageWithBasePath
                              src="assets/img/agents/agent-05.jpg"
                              alt="image"
                              className="avatar avatar-sm rounded-circle me-2"
                            />
                          </Link>
                          <Link to={all_routes.agentDetails}>Jason Rosen</Link>
                        </div>
                        <span className="d-inline-flex align-items-center">
                          <i className="material-icons-outlined me-1">events</i>
                          28 Jun 2025
                        </span>
                      </div>
                    </div>
                    <div>
                      <h5 className="mb-1">
                        <Link to={all_routes.blogDetails}>
                          {" "}
                          Legal Due Diligence is a Must
                        </Link>
                      </h5>
                      <p className="mb-0">
                        Before buying a property, always check the legal title,
                        land use approvals, and potential disputes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* end col */}
              <div className="col-md-6 col-lg-4">
                <div className="blog-item-01">
                  <div className="blog-img">
                    <Link to={all_routes.blogDetails}>
                      <ImageWithBasePath
                        src="assets/img/blogs/blog-img-08.jpg"
                        alt="img"
                        className="img-fluid"
                      />
                    </Link>
                  </div>
                  <div className="blog-content">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
                      <span className="badge badge-sm bg-secondary fw-semibold">
                        Property
                      </span>
                      <div className="d-flex align-items-center author-details">
                        <div className="d-flex align-items-center me-3">
                          <Link to={all_routes.agentDetails}>
                            <ImageWithBasePath
                              src="assets/img/agents/agent-02.jpg"
                              alt="image"
                              className="avatar avatar-sm rounded-circle me-2"
                            />
                          </Link>
                          <Link to={all_routes.agentDetails}>Richard</Link>
                        </div>
                        <span className="d-inline-flex align-items-center">
                          <i className="material-icons-outlined me-1">events</i>
                          12 Jun 2025
                        </span>
                      </div>
                    </div>
                    <div>
                      <h5 className="mb-1">
                        <Link to={all_routes.blogDetails}>
                          Maintenance Affects ROI
                        </Link>
                      </h5>
                      <p className="mb-0">
                        Regular upkeep not only preserves property value but
                        also attracts better tenants or buyers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* end col */}
              <div className="col-md-6 col-lg-4">
                <div className="blog-item-01">
                  <div className="blog-img">
                    <Link to={all_routes.blogDetails}>
                      <ImageWithBasePath
                        src="assets/img/blogs/blog-img-09.jpg"
                        alt="img"
                        className="img-fluid"
                      />
                    </Link>
                  </div>
                  <div className="blog-content">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
                      <span className="badge badge-sm bg-secondary fw-semibold">
                        House
                      </span>
                      <div className="d-flex align-items-center author-details">
                        <div className="d-flex align-items-center me-3">
                          <Link to={all_routes.agentDetails}>
                            <ImageWithBasePath
                              src="assets/img/agents/agent-04.jpg"
                              alt="image"
                              className="avatar avatar-sm rounded-circle me-2"
                            />
                          </Link>
                          <Link to={all_routes.agentDetails}>Sara Porter</Link>
                        </div>
                        <span className="d-inline-flex align-items-center">
                          <i className="material-icons-outlined me-1">event</i>
                          01 Jun 2025
                        </span>
                      </div>
                    </div>
                    <div>
                      <h5 className="mb-1">
                        <Link to={all_routes.blogDetails}>
                          Real Estate is Local
                        </Link>
                      </h5>
                      <p className="mb-0">
                        Every market is different. What works in one city might
                        not in another, so do local research.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* end col */}
            </div>
            )}
            {/* end row */}
            <div className="d-flex align-items-center justify-content-center">
              <Link
                to="#"
                className="btn btn-dark d-inline-flex align-items-center load-more-btn"
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

export default BlogGrid;
