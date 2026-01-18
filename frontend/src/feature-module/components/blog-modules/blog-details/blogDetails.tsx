import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import Breadcrumb from "../../../../core/common/Breadcrumb/breadcrumb";
import { all_routes } from "../../../routes/all_routes";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import Slider from "react-slick";
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

const PrevArrow = ({
  onClick,
}: {
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}) => (
  <div className="blog-carousel-prev" onClick={onClick}>
    <i className="fa fa-chevron-left" />
  </div>
);

const NextArrow = ({
  onClick,
}: {
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}) => (
  <div className="blog-carousel-next" onClick={onClick}>
    <i className="fa fa-chevron-right" />
  </div>
);

const BlogDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<any | null>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (!slug) {
        setPost(null);
        return;
      }
      try {
        setIsLoading(true);
        const res = await publicService.getBlogPostBySlug(slug);
        if (!isMounted) return;
        setPost(res.item || null);
      } catch {
        if (!isMounted) return;
        setPost(null);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    run();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (!post?.slug) {
        setRelated([]);
        return;
      }
      try {
        const categorySlug = post?.category?.slug;
        const res = await publicService.getBlogPosts(categorySlug);
        if (!isMounted) return;
        const items = (res.items || []).filter((p: any) => p?.slug && p.slug !== post.slug);
        setRelated(items.slice(0, 9));
      } catch {
        if (!isMounted) return;
        setRelated([]);
      }
    };

    run();
    return () => {
      isMounted = false;
    };
  }, [post?.slug, post?.category?.slug]);

  const galleryImages = useMemo(() => {
    const arr = (post?.galleryUrls || []).filter(Boolean);
    if (arr.length) return arr;
    if (post?.coverUrl) return [post.coverUrl];
    return [];
  }, [post?.galleryUrls, post?.coverUrl]);

  const settings = {
    dots: false,
    infinite: true,
    speed: 300,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          infinite: true,
          dots: false,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Breadscrumb */}
        <Breadcrumb
          title={post?.title || "Blog Details"}
          paths={[{ label: "Blog Details", active: true }]}
        />

        {/* End Breadscrumb */}
        {/* Start Content */}
        <div className="content">
          <div className="container">
            {/* start row */}
            <div className="row blog-details-cover">
              <div className="col-lg-10 mx-auto">
                <Link
                  to={all_routes.blogGrid}
                  className="d-flex align-items-center mb-4"
                >
                  <i className="material-icons-outlined me-1">arrow_back</i>Back
                  to Blog
                </Link>
                <div className="card mb-0">
                  <div className="card-body">
                    {isLoading ? (
                      <div className="text-center mb-4">Loading...</div>
                    ) : null}

                    {!isLoading && !post ? (
                      <div className="text-center mb-4">Post not found</div>
                    ) : null}

                    {post ? (
                      <>
                        <div className="blog-details-item-01">
                          <div className="blog-details-img-01">
                            {post.coverUrl ? (
                              <ImageWithBasePath
                                src={post.coverUrl}
                                alt="image"
                                className="img-fluid"
                              />
                            ) : null}
                          </div>
                          <div className="blog-details-content-01">
                            <span className="badge badge-sm bg-secondary fw-semibold">
                              {post.category?.name || ""}
                            </span>
                            <h5>{post.title || ""}</h5>
                            <div className="d-flex align-items-center justify-content-center flex-wrap gap-2 author-details">
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
                                <span className="d-inline-flex align-items-center">
                                  <i className="material-icons-outlined me-1">
                                    event
                                  </i>
                                  {formatDate(post.publishedAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mb-4">
                          <div
                            dangerouslySetInnerHTML={{
                              __html: String(post.contentHtml || ""),
                            }}
                          />
                        </div>

                        {galleryImages.length ? (
                          <div className="row row-gap-3 mb-3">
                            {galleryImages
                              .slice(0, 4)
                              .map((src: string, idx: number) => (
                                <div
                                  key={`${src}-${idx}`}
                                  className="col-md-6 col-lg-3"
                                >
                                  <ImageWithBasePath
                                    src={src}
                                    alt="img"
                                    className="img-fluid w-100 rounded"
                                  />
                                </div>
                              ))}
                          </div>
                        ) : null}

                        <div className="card border-0 border-start border-3 border-primary bg-light mb-4">
                          <div className="card-body">
                            <div className="row align-items-center row-gap-2">
                              <div className="col-lg-2">
                                {post.authorAgent?.avatarUrl ? (
                                  <ImageWithBasePath
                                    src={post.authorAgent.avatarUrl}
                                    alt="img"
                                    className="img-fluid avatar avatar-xxxl rounded-circle"
                                  />
                                ) : null}
                              </div>
                              <div className="col-lg-10">
                                <p className="fw-medium mb-1 text-primary">
                                  Author
                                </p>
                                <h5>{post.authorAgent?.name || ""}</h5>
                                <p className="mb-0">{post.excerpt || ""}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="card shadow-none mb-0">
                          <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                              <h6 className="mb-0">Was this article helpful?</h6>
                              <p className="mb-0">
                                18 out of 93 found this helpful
                              </p>
                              <div className="d-flex align-items-center">
                                <Link
                                  to="#"
                                  className="btn btn-sm btn-white d-inline-flex align-items-center me-2"
                                >
                                  <i className="material-icons-outlined me-1">
                                    thumb_up
                                  </i>
                                  Yes
                                </Link>
                                <Link
                                  to="#"
                                  className="btn btn-sm btn-white d-inline-flex align-items-center"
                                >
                                  <i className="material-icons-outlined me-1">
                                    thumb_down
                                  </i>
                                  No
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                  {/* end card body */}
                </div>
                {/* end card */}
              </div>
              {/* end col */}
            </div>
            {/* end row */}
            <div className="blog-details-item-02">
              <h5>Related Post</h5>
              <div className="blog-carousel-wrapper">
                <Slider {...settings} className="blog-carousel">
                  {related.map((p, idx) => (
                    <div key={p.id || p.slug || idx}>
                      <div className="blog-item-01">
                        <div className="blog-img">
                          <Link
                            to={p.slug ? all_routes.blogDetailsPath(p.slug) : "#"}
                          >
                            {p.coverUrl ? (
                              <ImageWithBasePath
                                src={p.coverUrl}
                                alt="img"
                                className="img-fluid"
                              />
                            ) : null}
                          </Link>
                        </div>
                        <div className="blog-content">
                          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
                            <span className="badge badge-sm bg-secondary fw-semibold">
                              {p.category?.name || ""}
                            </span>
                            <div className="d-flex align-items-center flex-wrap gap-3 author-details">
                              <div className="d-flex align-items-center me-3">
                                <Link to={all_routes.agentDetails}>
                                  {p.authorAgent?.avatarUrl ? (
                                    <ImageWithBasePath
                                      src={p.authorAgent.avatarUrl}
                                      alt="image"
                                      className="avatar avatar-sm rounded-circle me-2"
                                    />
                                  ) : null}
                                </Link>
                                <Link to={all_routes.agentDetails}>
                                  {p.authorAgent?.name || ""}
                                </Link>
                              </div>
                              <div className="d-flex align-items-center">
                                <span className="d-inline-flex align-items-center">
                                  <i className="material-icons-outlined me-1">event</i>
                                  {formatDate(p.publishedAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h5 className="mb-1">
                              <Link
                                to={p.slug ? all_routes.blogDetailsPath(p.slug) : "#"}
                              >
                                {p.title || ""}
                              </Link>
                            </h5>
                            <p className="mb-0">{p.excerpt || ""}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </Slider>
              </div>
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

export default BlogDetails;
