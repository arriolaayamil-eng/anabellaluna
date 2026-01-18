import { useEffect, useState } from "react";
import { Link } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import publicService from "../../../../../services/publicService";

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

const BlogSection = () => {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      try {
        const res = await publicService.getBlogPosts();
        if (!isMounted) return;
        setPosts((res.items || []).slice(0, 3));
      } catch {
        if (!isMounted) return;
        setPosts([]);
      }
    };

    run();
    return () => {
      isMounted = false;
    };
  }, []);

  const featured = posts[0];
  const others = posts.slice(1, 3);

  return (
    <>
      {/* Blog Section Start */}
      <section className="latest-blog-section">
        <div className="container">
          {/* Section Title Start */}
          <div className="section-heading-three">
            <div className="sec-line-three">
              <span className="sec-line1" />
              <span className="sec-line2" />
            </div>
            <h2>Latest Blogs</h2>
            <p>
              Explore our featured blog posts on premium properties for sales
              &amp; rents
            </p>
          </div>
          {/* Section Title End */}
          {/* start row */}
          <div className="row">
            {featured ? (
              <div className="col-xl-6 d-flex">
                <div className="blog-item mb-4 flex-fill">
                  <div className="blog-img">
                    <Link
                      to={featured.slug ? all_routes.blogDetailsPath(featured.slug) : "#"}
                    >
                      {featured.coverUrl ? (
                        <ImageWithBasePath src={featured.coverUrl} alt="image" />
                      ) : null}
                    </Link>
                    <span className="badge bg-secondary badge-top">
                      {featured.category?.name || ""}
                    </span>
                  </div>
                  <div className="blog-content">
                    <h5 className="mb-2">
                      <Link
                        to={featured.slug ? all_routes.blogDetailsPath(featured.slug) : "#"}
                      >
                        {featured.title || ""}
                      </Link>
                    </h5>
                    <p className="mb-2">{featured.excerpt || ""}</p>
                    <span className="d-inline-flex align-items-center">
                      <i className="material-icons-outlined me-2">event</i>
                      {formatDate(featured.publishedAt)}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="col-xl-6 d-flex">
              <div className="flex-fill">
                {others.map((post, idx) => (
                  <div key={post.id || post.slug || idx} className="blog-item blog-item-2 mb-4">
                    <div className="row">
                      <div className="col-md-6 d-flex">
                        <div className="blog-img flex-fill">
                          <Link
                            to={post.slug ? all_routes.blogDetailsPath(post.slug) : "#"}
                          >
                            {post.coverUrl ? (
                              <ImageWithBasePath src={post.coverUrl} alt="image" />
                            ) : null}
                          </Link>
                          <span className="badge bg-secondary badge-top">
                            {post.category?.name || ""}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-6 d-flex">
                        <div className="blog-content flex-fill">
                          <h5 className="mb-2">
                            <Link
                              to={post.slug ? all_routes.blogDetailsPath(post.slug) : "#"}
                            >
                              {post.title || ""}
                            </Link>
                          </h5>
                          <p className="mb-2">{post.excerpt || ""}</p>
                          <span className="d-inline-flex align-items-center">
                            <i className="material-icons-outlined me-2">event</i>
                            {formatDate(post.publishedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {false && (
          <div className="row">
            <div className="col-xl-6 d-flex">
              <div className="blog-item mb-4 flex-fill">
                <div className="blog-img">
                  <Link to={all_routes.blogDetails}>
                    <ImageWithBasePath
                      src="assets/img/home-3/blog/blog-01.jpg"
                      alt="image"
                    />
                  </Link>
                  <span className="badge bg-secondary badge-top">
                    Booking Tips
                  </span>
                </div>
                <div className="blog-content">
                  <h5 className="mb-2">
                    <Link to={all_routes.blogDetails}>
                      Top 10 Tips for First-Time Homebuyers
                    </Link>
                  </h5>
                  <p className="mb-2">
                    Buying your first home? Learn how to budget, choose the
                    right location, and avoid common mistakes.
                  </p>
                  <span className="d-inline-flex align-items-center">
                    <i className="material-icons-outlined me-2">event</i>27 Sep
                    2025
                  </span>
                </div>
              </div>
            </div>
            {/* end col */}
            <div className="col-xl-6 d-flex">
              <div className="flex-fill">
                <div className="blog-item blog-item-2 mb-4">
                  {/* start row */}
                  <div className="row">
                    <div className="col-md-6 d-flex">
                      <div className="blog-img flex-fill">
                        <Link to={all_routes.blogDetails}>
                          <ImageWithBasePath
                            src="assets/img/home-3/blog/blog-02.jpg"
                            alt="image"
                          />
                        </Link>
                        <span className="badge bg-secondary badge-top">
                          Invest
                        </span>
                      </div>
                    </div>
                    {/* end col */}
                    <div className="col-md-6 d-flex">
                      <div className="blog-content flex-fill">
                        <h5 className="mb-2">
                          <Link to={all_routes.blogDetails}>
                            Best Emerging Locations to Invest in 2025
                          </Link>
                        </h5>
                        <p className="mb-2">
                          Discover fast-growing areas offering high returns on
                          real estate investments this year.
                        </p>
                        <span className="d-inline-flex align-items-center">
                          <i className="material-icons-outlined me-2">event</i>
                          27 Sep 2025
                        </span>
                      </div>
                    </div>
                    {/* end col */}
                  </div>
                  {/* end row */}
                </div>
                <div className="blog-item blog-item-2 mb-4">
                  {/* start row */}
                  <div className="row">
                    <div className="col-md-6 d-flex">
                      <div className="blog-img flex-fill">
                        <Link to={all_routes.blogDetails}>
                          <ImageWithBasePath
                            src="assets/img/home-3/blog/blog-03.jpg"
                            alt="image"
                          />
                        </Link>
                        <span className="badge bg-secondary badge-top">
                          Renting
                        </span>
                      </div>
                    </div>
                    {/* end col */}
                    <div className="col-md-6 d-flex">
                      <div className="blog-content flex-fill">
                        <h5 className="mb-2">
                          <Link to={all_routes.blogDetails}>
                            Renting vs. Buying: Which Is Right for You?
                          </Link>
                        </h5>
                        <p className="mb-2">
                          A practical guide to help you decide whether to rent
                          or buy based on your lifestyle and finances.
                        </p>
                        <span className="d-inline-flex align-items-center">
                          <i className="material-icons-outlined me-2">event</i>
                          17 Jan 2025
                        </span>
                      </div>
                    </div>
                    {/* end col */}
                  </div>
                  {/* end row */}
                </div>
              </div>
            </div>
            {/* end col */}
          </div>
          )}
          {/* end row */}
          <div className="text-center mt-3">
            <Link
              to={all_routes.blogGrid}
              className="btn btn-dark d-inline-flex align-items-center"
            >
              View More
              <i className="material-icons-outlined ms-1">north_east</i>
            </Link>
          </div>
        </div>
      </section>
      {/* Blog Section End */}
    </>
  );
};

export default BlogSection;
