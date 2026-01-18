import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import Breadcrumb from "../../../../core/common/Breadcrumb/breadcrumb";
import { all_routes } from "../../../routes/all_routes";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
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

const BlogList = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      try {
        setIsLoading(true);
        const [catsRes, postsRes] = await Promise.all([
          publicService.getBlogCategories(),
          publicService.getBlogPosts(),
        ]);
        if (!isMounted) return;
        const items = postsRes.items || [];
        setCategories(catsRes.items || []);
        setAllPosts(items);
        setPosts(items);
      } catch {
        if (!isMounted) return;
        setCategories([]);
        setAllPosts([]);
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

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (!activeCategorySlug) {
        setPosts(allPosts);
        return;
      }
      try {
        setIsLoading(true);
        const res = await publicService.getBlogPosts(activeCategorySlug);
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
  }, [activeCategorySlug, allPosts]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of allPosts) {
      const slug = p?.category?.slug;
      if (!slug) continue;
      map.set(slug, (map.get(slug) || 0) + 1);
    }
    return map;
  }, [allPosts]);

  const visiblePosts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return posts;
    return posts.filter((p) => {
      const title = String(p?.title || "").toLowerCase();
      const excerpt = String(p?.excerpt || "").toLowerCase();
      return title.includes(term) || excerpt.includes(term);
    });
  }, [posts, search]);

  const topPosts = useMemo(() => allPosts.slice(0, 4), [allPosts]);

  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Breadscrumb */}
        <Breadcrumb
          title="Blog List"
          paths={[{ label: "Blog List", active: true }]}
        />

        {/* End Breadscrumb */}
        {/* Start Content */}
        <div className="content">
          <div className="container">
            {/* start row */}
            <div className="row row-gap-4">
              <div className="col-md-12 col-lg-8">
                {isLoading ? (
                  <div className="text-center mb-4">Loading...</div>
                ) : null}

                {!isLoading && visiblePosts.length === 0 ? (
                  <div className="text-center mb-4">No posts</div>
                ) : null}

                {visiblePosts.map((post, idx) => (
                  <div
                    key={post.id || post.slug || idx}
                    className={`blog-item-01${idx !== visiblePosts.length - 1 ? " mb-4" : ""}`}
                  >
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
                        <div className="d-flex align-items-center flex-wrap gap-3 author-details">
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
                              <i className="material-icons-outlined me-1">events</i>
                              {formatDate(post.publishedAt)}
                            </span>
                          </div>
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
                ))}
                <div className="d-flex align-items-center justify-content-center">
                  <Link
                    to="#"
                    className="btn btn-dark d-inline-flex align-items-center load-more-btn"
                  >
                    <i className="material-icons-outlined me-1">autorenew</i>
                    Load More
                  </Link>
                </div>
              </div>
              {/* end col */}
              <div className="col-lg-4 theiaStickySidebar">
                <div className="card">
                  <div className="card-header">
                    <h4 className="mb-0">Filter</h4>
                  </div>
                  <div className="card-body">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  {/* end card body */}
                </div>
                {/* end card */}
                <div className="card">
                  <div className="card-header">
                    <h4 className="mb-0">Categories</h4>
                  </div>
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                      <Link
                        to="#"
                        className="link-body"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveCategorySlug(undefined);
                        }}
                      >
                        All
                      </Link>
                      <p>{allPosts.length}</p>
                    </div>

                    {categories.map((cat, idx) => (
                      <div
                        key={cat.id || cat.slug || idx}
                        className={`d-flex align-items-center justify-content-between flex-wrap gap-2 ${
                          idx !== categories.length - 1 ? "mb-3" : "mb-0"
                        }`}
                      >
                        <Link
                          to="#"
                          className={idx === categories.length - 1 ? "mb-0 link-body" : "link-body"}
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveCategorySlug(cat.slug);
                          }}
                        >
                          {cat.name || ""}
                        </Link>
                        <p className={idx === categories.length - 1 ? "mb-0" : undefined}>
                          {cat.slug ? categoryCounts.get(cat.slug) || 0 : 0}
                        </p>
                      </div>
                    ))}
                  </div>
                  {/* end card body */}
                </div>
                {/* end card */}
                <div className="card mb-0">
                  <div className="card-header">
                    <h4 className="mb-0">Top Article</h4>
                  </div>
                  <div className="card-body">
                    {topPosts.map((post, idx) => (
                      <div
                        key={post.id || post.slug || idx}
                        className={`blog-item-02${idx !== topPosts.length - 1 ? " mb-3" : ""}`}
                      >
                        <div className="blog-img-img">
                          {post.coverUrl ? (
                            <ImageWithBasePath
                              src={post.coverUrl}
                              alt="image"
                              className="img-fluid"
                            />
                          ) : null}
                        </div>
                        <div className="blog-content-02">
                          <h5>
                            <Link
                              to={post.slug ? all_routes.blogDetailsPath(post.slug) : "#"}
                            >
                              {post.title || ""}
                            </Link>
                          </h5>
                          <p>{formatDate(post.publishedAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* end card body */}
                </div>
                {/* end card */}
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

export default BlogList;
