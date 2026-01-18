import { useEffect, useState } from "react";
import { Link } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
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

  return (
    <>
      {/* start blog section */}
      <section className="home-blog-section section-padding ">
        <div className="container">
          {/* start title */}
          <div
            className="section-heading aos"
            data-aos="fade-down"
            data-aos-duration={1000}
          >
            <h2 className="mb-2 text-center">Últimos Artículos</h2>
            <div className="sec-line">
              <span className="sec-line1" />
              <span className="sec-line2" />
            </div>
            <p className="mb-0 text-center">
              Descubre nuestras notas destacadas sobre propiedades premium en venta y alquiler.
            </p>
          </div>
          {/* end title */}
          {/* start row */}
          <div className="row row-gap-4 justify-content-center">
            {posts.map((post, idx) => (
              <div
                key={post.id || post.slug || idx}
                className="col-md-6 col-lg-4 d-flex aos"
                data-aos="fade-down"
                data-aos-duration={1500}
              >
                <div className="blog-item-01 flex-fill">
                  <div className="blog-img">
                    <Link to={post.slug ? all_routes.blogDetailsPath(post.slug) : "#"}>
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
                        <div className="d-flex align-items-center">
                          <i className="feather-calendar" />
                          <span>{formatDate(post.publishedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="mb-1">
                        <Link to={post.slug ? all_routes.blogDetailsPath(post.slug) : "#"}>
                          {post.title || ""}
                        </Link>
                      </h5>
                      <p className="mb-0">{post.excerpt || ""}</p>
                    </div>
                    <div className="blog-footer d-flex align-items-center justify-content-between">
                      <Link
                        to={post.slug ? all_routes.blogDetailsPath(post.slug) : "#"}
                        className="btn btn-outline-dark"
                      >
                        Ver todo
                      </Link>
                      <Link
                        to={post.slug ? all_routes.blogDetailsPath(post.slug) : "#"}
                        className="btn btn-light"
                      >
                        <i className="feather-arrow-up-right" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {false && (
          <div className="row row-gap-4 justify-content-center">
            <div
              className="col-md-6 col-lg-4 d-flex aos"
              data-aos="fade-down"
              data-aos-duration={1500}
            >
              <div className="blog-item-01 flex-fill">
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
                      Propiedad
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
                      <div className="d-flex align-items-center">
                        <i className="feather-calendar" />
                        <span>12 Ene 2025</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h5 className="mb-1">
                      <Link to={all_routes.blogDetails}>
                        La ubicación lo es todo
                      </Link>
                    </h5>
                    <p className="mb-0">
                      El valor de una propiedad depende en gran parte de dónde
                      está situada.
                    </p>
                  </div>
                  <div className="blog-footer d-flex align-items-center justify-content-between">
                    <Link to={all_routes.blogDetails} className="btn btn-outline-dark">
                      Ver todo
                    </Link>
                    <Link to={all_routes.blogDetails} className="btn btn-light">
                      <i className="feather-arrow-up-right" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            {/* end col */}
            <div
              className="col-md-6 col-lg-4 d-flex aos"
              data-aos="fade-down"
              data-aos-duration={1500}
            >
              <div className="blog-item-01 flex-fill">
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
                      Villa
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
                        <i className="material-icons-outlined me-1">events</i>24
                        Apr 2025
                      </span>
                    </div>
                  </div>
                  <div>
                    <h5 className="mb-1">
                      <Link to={all_routes.blogDetails}>
                        El real estate es una inversión
                      </Link>
                    </h5>
                    <p className="mb-0">
                      A diferencia de otras opciones, los inmuebles suelen
                      aumentar su valor con el tiempo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* end col */}
            <div
              className="col-md-6 col-lg-4 d-flex aos"
              data-aos="fade-down"
              data-aos-duration={1500}
            >
              <div className="blog-item-01 flex-fill">
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
                    <h4 className="mb-2">La ubicación lo es todo</h4>
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
                        <i className="material-icons-outlined me-1">events</i>27
                        Sep 2025
                      </span>
                    </div>
                  </div>
                  <div>
                    <h5 className="mb-1">
                      <Link to={all_routes.blogDetails}>
                        Las tendencias del mercado importan
                      </Link>
                    </h5>
                    <p className="mb-0">
                      Mantenerte informado sobre el mercado inmobiliario te ayuda
                      a tomar mejores decisiones.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* end col */}
          </div>
          )}
          <div className="text-center d-flex align-items-center justify-content-center m-auto">
            <Link
              to={all_routes.blogGrid}
              className="btn btn-lg btn-dark d-flex align-items-center gap-1"
            >
              Ver todos
              <i className="material-icons-outlined">arrow_forward</i>
            </Link>
          </div>
        </div>
      </section>
      {/* end blog section */}
    </>
  );
};

export default BlogSection;
