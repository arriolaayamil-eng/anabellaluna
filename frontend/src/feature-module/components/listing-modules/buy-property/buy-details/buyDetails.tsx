import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import BuyGalleryItem from "./buyGalleryItem";
import BuyLeftForm from "./buyLeftForm";
import { all_routes } from "../../../../routes/all_routes";
import publicService, { type PropertyDetail } from "../../../../../services/publicService";

type SliderType = Slider;

const BuyDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const privateToken = searchParams.get('token') || undefined;
  const [mainSlider, setMainSlider] = useState<SliderType | undefined>(
    undefined
  );
  const [thumbSlider, setThumbSlider] = useState<SliderType | undefined>(
    undefined
  );

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const mainRef = useRef<SliderType>(null);
  const thumbRef = useRef<SliderType>(null);

  const [selectedItems, setSelectedItems] = useState(Array(10).fill(false));
  const handleItemClick = (index: number) => {
    setSelectedItems((prevSelectedItems) => {
      const updatedSelectedItems = [...prevSelectedItems];
      updatedSelectedItems[index] = !updatedSelectedItems[index];
      return updatedSelectedItems;
    });
  };
  const mainSettings = {
    slidesToShow: 1,
    slidesToScroll: 1,
    fade: true,
    arrows: false,
    infinite: true,
    asNavFor: thumbSlider,
  };

  const thumbSettings = {
    slidesToShow: 6,
    slidesToScroll: 1,
    asNavFor: mainSlider,
    focusOnSelect: true,
    arrows: true,
    infinite: true,
    responsive: [
      { breakpoint: 1200, settings: { slidesToShow: 5 } },
      { breakpoint: 992, settings: { slidesToShow: 4 } },
      { breakpoint: 768, settings: { slidesToShow: 3 } },
      { breakpoint: 576, settings: { slidesToShow: 2 } },
    ],
  };

  useEffect(() => {
    setMainSlider(mainRef.current ?? undefined);
    setThumbSlider(thumbRef.current ?? undefined);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (!slug) {
        setProperty(null);
        return;
      }
      try {
        setIsLoading(true);
        const res = await publicService.getPropertyBySlug(slug, privateToken);
        if (!isMounted) return;
        setProperty(res.item || null);
      } catch {
        if (!isMounted) return;
        setProperty(null);
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

  const galleryImages = (
    (property?.galleryUrls && property.galleryUrls.length
      ? property.galleryUrls
      : property?.media?.coverUrl
        ? [property.media.coverUrl]
        : [])
  ).filter(Boolean);

  const priceLabel = () => {
    if (property?.price?.amount == null) return "";
    const currency = property.price.currency ? `${property.price.currency} ` : "";
    const unit = property.price.unit ? ` / ${property.price.unit}` : "";
    return `${currency}${property.price.amount}${unit}`;
  };

  const locationLabel = [
    property?.location?.addressLine,
    property?.location?.neighborhood,
    property?.location?.city,
    property?.location?.province,
    property?.location?.postalCode,
    property?.location?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const extraFeatures = property?.extraFeatures;
  const propertySlug = property?.slug;

  const amenities = (property?.amenities || []).filter(Boolean);
  const floorPlanUrls = (property?.floorPlanUrls || []).filter(Boolean);
  const videoUrls = (property?.videoUrls || []).filter(Boolean);

  const toEmbedUrl = (url: string) => {
    const raw = String(url || "").trim();
    if (!raw) return "";

    if (raw.includes("youtube.com/embed/")) return raw;
    if (raw.includes("youtu.be/")) {
      const id = raw.split("youtu.be/")[1]?.split(/[?&]/)[0];
      return id ? `https://www.youtube.com/embed/${id}` : raw;
    }
    if (raw.includes("youtube.com/watch")) {
      const q = raw.split("?")[1] || "";
      const params = new URLSearchParams(q);
      const id = params.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : raw;
    }

    const vimeoMatch = raw.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return raw;
  };

  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        <div className="buy-details-header-item">
          {/* Start Breadscrumb */}
          <div className="breadcrumb-bar custom-breadcrumb-bar">
            <div className="container">
              <div className="row align-items-center text-center position-relative z-1">
                <div className="col-xl-8">
                  <div className="d-flex align-center gap-2 mb-2">
                    <span className="badge bg-primary">{property?.type || ""}</span>
                    <span className="badge bg-secondary">
                      {property?.operation === "rent" ? "For Rent" : "For Sale"}
                    </span>
                    {property?.status ? (
                      <span className="badge bg-success">{property.status}</span>
                    ) : null}
                  </div>
                  <h1 className="breadcrumb-title text-start ">
                    {property?.title || ""}
                  </h1>
                  <div className="d-flex align-items-center gap-2 flex-wrap gap-1 mb-xl-0 mb-4">
                    {false && (
                      <div className="d-flex align-items-center justify-content-center">
                        <i className="material-icons-outlined text-warning">
                          star
                        </i>
                        <i className="material-icons-outlined text-warning">
                          star
                        </i>
                        <i className="material-icons-outlined text-warning">
                          star
                        </i>
                        <i className="material-icons-outlined text-warning">
                          star
                        </i>
                        <i className="material-icons-outlined text-warning">
                          star
                        </i>
                        <span className="text-white ms-1"> 5.0 </span>
                      </div>
                    )}
                    <i className="fa-solid fa-circle text-body" />
                    <div className="fs-14 mb-0 text-white d-flex align-items-center flex-wrap gap-1 custom-address-item">
                      <i className="material-icons-outlined text-white me-1">
                        location_on
                      </i>
                      {locationLabel}
                      <Link
                        to={all_routes.buyGridMap}
                        className="text-primary fs-14 text-decoration-underline ms-1"
                      >
                        View Location
                      </Link>
                    </div>
                    <i className="fa-solid fa-circle text-body" />
                    {false && (
                      <p className="fs-14 mb-0 text-white">
                        Last Updated on : 24 Feb 2025
                      </p>
                    )}
                  </div>
                </div>
                <div className="col-xl-4 d-flex d-xl-block align-items-center flex-wrap gap-3">
                  <div className="breadcrumb-icons d-flex align-items-center justify-content-xl-end justify-content-start gap-2 mb-xl-4">
                    <Link to="#" className="">
                      <i className="material-icons-outlined rounded">
                        favorite_border
                      </i>
                    </Link>
                    <Link to="#" className="">
                      <i className="material-icons-outlined rounded">
                        bookmark_add
                      </i>
                    </Link>
                    <Link to="#" className="">
                      <i className="material-icons-outlined rounded">
                        compare_arrows
                      </i>
                    </Link>
                  </div>
                  <h4 className="mb-0 text-primary text-xl-end text-start">
                    {priceLabel()}
                  </h4>
                </div>
              </div>
            </div>
          </div>
          {/* End Breadscrumb */}
        </div>
        {/* Start Content */}
        <div className="content">
          <div className="container">
            {/* start row */}
            <div className="row">
              <div className="col-xl-8">
                {(property?.trending || property?.featured || property?.visitCount != null) ? (
                  <div className="mb-4 d-inline-flex align-center justify-content-between w-100 flex-wrap gap-1">
                    <div className="d-inline-flex align-center gap-2">
                      {property?.trending ? (
                        <span className="badge bg-danger d-flex align-items-center">
                          <i className="material-icons-outlined fs-14 me-1">
                            generating_tokens
                          </i>
                          Trending
                        </span>
                      ) : null}
                      {property?.featured ? (
                        <span className="badge bg-orange d-flex align-items-center">
                          <i className="material-icons-outlined  fs-14 me-1">
                            loyalty
                          </i>
                          Featured
                        </span>
                      ) : null}
                    </div>
                    {property?.visitCount != null ? (
                      <p className="mb-0 text-dark">Total No of Visits : {property.visitCount}</p>
                    ) : null}
                  </div>
                ) : null}
                {/* start slider */}
                <div className="slider-card service-slider-card mb-4">
                  <div className="slide-part mb-4">
                    <Slider
                      {...mainSettings}
                      ref={mainRef}
                      className="slider service-slider"
                    >
                      {galleryImages.length ? (
                        galleryImages.map((src, idx) => (
                          <div key={`${src}-${idx}`} className="service-img-wrap">
                            <ImageWithBasePath
                              src={src}
                              className="img-fluid"
                              alt={property?.title || "Slider Img"}
                            />
                          </div>
                        ))
                      ) : (
                        <div className="service-img-wrap">
                          <div className="text-center">{isLoading ? "Loading..." : "No images"}</div>
                        </div>
                      )}
                    </Slider>
                  </div>
                  <Slider
                    {...thumbSettings}
                    ref={thumbRef}
                    className="slider slider-nav-thumbnails"
                  >
                    {galleryImages.length ? (
                      galleryImages.map((src, idx) => (
                        <div key={`${src}-${idx}`} className="slide-img">
                          <ImageWithBasePath
                            src={src}
                            className="img-fluid"
                            alt={property?.title || "Slider Img"}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="slide-img">
                        <div className="text-center">{isLoading ? "Loading..." : "No images"}</div>
                      </div>
                    )}
                  </Slider>
                </div>
                {/* End slider */}
                {/* items-2*/}
                <div className="accordion accordions-items-seperate">
                  {/* descritpion items */}
                  <div className="accordion-item">
                    <div className="accordion-header">
                      <button
                        className="accordion-button"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#accordion-1"
                        aria-expanded="true"
                      >
                        Description
                      </button>
                    </div>
                    <div
                      id="accordion-1"
                      className="accordion-collapse collapse show"
                    >
                      <div className="accordion-body">
                        <p>
                          {property?.description || ""}
                        </p>
                        <div className="more-menu">
                          <p>
                            {property?.description || ""}
                          </p>
                        </div>
                        <div className="view-all d-inline-flex align-items-center">
                          <Link to="#" className="viewall-button fs-14">
                            Read More
                          </Link>
                          <i className="material-icons-outlined">
                            keyboard_arrow_down
                          </i>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Property items */}
                  <div className="accordion-item">
                    <div className="accordion-header">
                      <button
                        className="accordion-button"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#accordion-2"
                        aria-expanded="true"
                      >
                        Property Features
                      </button>
                    </div>
                    <div
                      id="accordion-2"
                      className="accordion-collapse collapse show"
                    >
                      <div className="accordion-body">
                        {/* start row */}
                        <div className="row row-gap-4">
                          <div className="col-lg-3 col-md-6">
                            <div className="buy-property-items">
                              <p>
                                <i className="material-icons-outlined">bed</i>
                                Bedrooms: {property?.features?.beds ?? ""}
                              </p>
                              <p className="mb-lg-0">
                                <i className="material-icons-outlined">bathtub</i>
                                Bathrooms: {property?.features?.baths ?? ""}
                              </p>
                            </div>
                          </div>
                          {/* end col */}
                          <div className="col-lg-3 col-md-6">
                            <div className="buy-property-items">
                              <p>
                                <i className="material-icons-outlined">meeting_room</i>
                                Rooms: {property?.features?.rooms ?? ""}
                              </p>
                              <p className="mb-lg-0">
                                <i className="material-icons-outlined">
                                  directions_car_filled
                                </i>
                                Parking: {property?.features?.parking ?? ""}
                              </p>
                            </div>
                          </div>
                          {/* end col */}
                          <div className="col-lg-3 col-md-6">
                            <div className="buy-property-items">
                              <p>
                                <i className="material-icons-outlined">straighten</i>
                                Area: {property?.features?.areaSqFt ?? ""} m²
                              </p>
                              <p className="mb-lg-0">
                                <i className="material-icons-outlined">crop_square</i>
                                Covered: {property?.features?.coveredAreaSqFt ?? ""} m²
                              </p>
                            </div>
                          </div>
                          {/* end col */}
                        </div>

                        {extraFeatures ? (
                          <div className="row row-gap-4">
                            {extraFeatures.floor ? (
                              <div className="col-lg-3 col-md-6">
                                <div className="buy-property-items">
                                  <p>
                                    <i className="material-icons-outlined">
                                      door_sliding
                                    </i>
                                    Floor: {extraFeatures.floor}
                                  </p>
                                </div>
                              </div>
                            ) : null}
                            {extraFeatures.microwave ? (
                              <div className="col-lg-3 col-md-6">
                                <div className="buy-property-items">
                                  <p>
                                    <i className="material-icons-outlined">
                                      microwave
                                    </i>
                                    Microwave: {extraFeatures.microwave}
                                  </p>
                                </div>
                              </div>
                            ) : null}
                            {extraFeatures.ac ? (
                              <div className="col-lg-3 col-md-6">
                                <div className="buy-property-items">
                                  <p className="mb-lg-0">
                                    <i className="material-icons-outlined">
                                      ac_unit
                                    </i>
                                    AC: {extraFeatures.ac}
                                  </p>
                                </div>
                              </div>
                            ) : null}
                            {extraFeatures.tv ? (
                              <div className="col-lg-3 col-md-6">
                                <div className="buy-property-items">
                                  <p>
                                    <i className="material-icons-outlined">tv</i>
                                    TV: {extraFeatures.tv}
                                  </p>
                                </div>
                              </div>
                            ) : null}
                            {extraFeatures.fridge ? (
                              <div className="col-lg-3 col-md-6">
                                <div className="buy-property-items">
                                  <p>
                                    <i className="material-icons-outlined">
                                      kitchen
                                    </i>
                                    Fridge: {extraFeatures.fridge}
                                  </p>
                                </div>
                              </div>
                            ) : null}
                            {extraFeatures.balcony ? (
                              <div className="col-lg-3 col-md-6">
                                <div className="buy-property-items">
                                  <p>
                                    <i className="material-icons-outlined">
                                      corporate_fare
                                    </i>
                                    Balcony: {extraFeatures.balcony}
                                  </p>
                                </div>
                              </div>
                            ) : null}
                            {extraFeatures.waterPurifier ? (
                              <div className="col-lg-3 col-md-6">
                                <div className="buy-property-items">
                                  <p>
                                    <i className="material-icons-outlined">water</i>
                                    Water Purifier: {extraFeatures.waterPurifier}
                                  </p>
                                </div>
                              </div>
                            ) : null}
                            {extraFeatures.curtains ? (
                              <div className="col-lg-3 col-md-6">
                                <div className="buy-property-items">
                                  <p className="mb-lg-0 mb-0">
                                    <i className="material-icons-outlined">
                                      checkroom
                                    </i>
                                    Curtains: {extraFeatures.curtains}
                                  </p>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                        {/* end row */}
                      </div>
                    </div>
                  </div>
                  {/* about property items */}
                  <div className="accordion-item">
                    <div className="accordion-header">
                      <button
                        className="accordion-button"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#accordion-3"
                        aria-expanded="true"
                      >
                        About Property
                      </button>
                    </div>
                    <div
                      id="accordion-3"
                      className="accordion-collapse collapse show"
                    >
                      <div className="accordion-body">
                        {property?.status ? (
                          <p className="mb-2">
                            <i className="fa-solid fa-circle-check text-success me-2 fs-18" />
                            Status: {property.status}
                          </p>
                        ) : null}
                        {property?.ageYears != null ? (
                          <p className="mb-2">
                            <i className="fa-solid fa-circle-check text-success me-2 fs-18" />
                            Age (years): {property.ageYears}
                          </p>
                        ) : null}
                        {property?.category ? (
                          <p className="mb-2">
                            <i className="fa-solid fa-circle-check text-success me-2 fs-18" />
                            Category: {property.category}
                          </p>
                        ) : null}
                        {property?.propertyCode ? (
                          <p className="mb-2">
                            <i className="fa-solid fa-circle-check text-success me-2 fs-18" />
                            Property Code: {property.propertyCode}
                          </p>
                        ) : null}
                        {property?.offerPrice != null ? (
                          <p className="mb-2">
                            <i className="fa-solid fa-circle-check text-success me-2 fs-18" />
                            Offer Price: {property.offerPrice}
                          </p>
                        ) : null}
                        {property?.pricePerM2 != null ? (
                          <p className="mb-2">
                            <i className="fa-solid fa-circle-check text-success me-2 fs-18" />
                            Price / m²: {property.pricePerM2}
                          </p>
                        ) : null}
                        {property?.structureType ? (
                          <p className="mb-2">
                            <i className="fa-solid fa-circle-check text-success me-2 fs-18" />
                            Structure Type: {property.structureType}
                          </p>
                        ) : null}
                        {property?.location?.neighborhood ? (
                          <p className="mb-2">
                            <i className="fa-solid fa-circle-check text-success me-2 fs-18" />
                            Neighborhood: {property.location.neighborhood}
                          </p>
                        ) : null}
                        {property?.location?.city ? (
                          <p className="mb-2">
                            <i className="fa-solid fa-circle-check text-success me-2 fs-18" />
                            City: {property.location.city}
                          </p>
                        ) : null}
                        {property?.location?.province ? (
                          <p className="mb-2">
                            <i className="fa-solid fa-circle-check text-success me-2 fs-18" />
                            Province: {property.location.province}
                          </p>
                        ) : null}
                        {property?.location?.postalCode ? (
                          <p className="mb-2">
                            <i className="fa-solid fa-circle-check text-success me-2 fs-18" />
                            Postal Code: {property.location.postalCode}
                          </p>
                        ) : null}
                        {!property?.status &&
                        property?.ageYears == null &&
                        !property?.location?.neighborhood &&
                        !property?.location?.city &&
                        !property?.location?.province &&
                        !property?.location?.postalCode ? (
                          <p className="mb-0">{isLoading ? "Loading..." : "No additional details"}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  {/* amenities items */}
                  <div className="accordion-item">
                    <div className="accordion-header">
                      <button
                        className="accordion-button"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#accordion-4"
                        aria-expanded="true"
                      >
                        Amenities
                      </button>
                    </div>
                    <div
                      id="accordion-4"
                      className="accordion-collapse collapse show"
                    >
                      <div className="accordion-body">
                        {amenities.length ? (
                          <div className="row row-gap-4">
                            {amenities.map((amenity) => (
                              <div key={amenity} className="col-lg-3 col-md-6">
                                <div className="buy-property-items">
                                  <p className="mb-0">
                                    <i className="fa-solid fa-circle-check text-success me-2 fs-18" />
                                    {amenity}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center">{isLoading ? "Loading..." : "No amenities"}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* floor plan items */}
                  {floorPlanUrls.length ? (
                    <div className="accordion-item">
                      <div className="accordion-header">
                        <button
                          className="accordion-button"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#accordion-5"
                          aria-expanded="true"
                        >
                          Floor Plan
                        </button>
                      </div>
                      <div
                        id="accordion-5"
                        className="accordion-collapse collapse show"
                      >
                        <div className="accordion-body">
                          {floorPlanUrls.map((url, idx) => (
                            <div
                              key={`${url}-${idx}`}
                              className="card border-0 shadow-none bg-light rounded mb-3"
                            >
                              <div className="card-body d-flex align-center justify-content-between gap-2 flex-wrap">
                                <h6 className="fs-16 fw-semibold mb-0">
                                  Plan {idx + 1}
                                </h6>
                                <div className="d-flex align-items-center floor-items">
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="fs-16 text-dark"
                                  >
                                    <i className="material-icons-outlined">
                                      remove_red_eye
                                    </i>
                                  </a>
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="fs-16 text-dark"
                                  >
                                    <i className="material-icons-outlined">
                                      file_download
                                    </i>
                                  </a>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {/* gallery items */}
                  <BuyGalleryItem images={galleryImages} />
                  {/* video items */}
                  {videoUrls.length ? (
                    <div className="accordion-item">
                      <div className="accordion-header">
                        <button
                          className="accordion-button"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#accordion-7"
                          aria-expanded="true"
                        >
                          Video
                        </button>
                      </div>
                      <div
                        id="accordion-7"
                        className="accordion-collapse collapse show"
                      >
                        <div className="accordion-body">
                          <div className="row row-gap-4">
                            {videoUrls.map((url, idx) => (
                              <div key={`${url}-${idx}`} className="col-12">
                                <div className="ratio ratio-16x9">
                                  <iframe
                                    src={toEmbedUrl(url)}
                                    title={`video-${idx + 1}`}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {/* faq items */}
                  {false && (
                  <div className="accordion-item">
                    <div className="accordion-header">
                      <button
                        className="accordion-button"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#accordion-8"
                        aria-expanded="true"
                      >
                        Frequently Asked Questions
                      </button>
                    </div>
                    <div
                      id="accordion-8"
                      className="accordion-collapse collapse show"
                    >
                      <div className="accordion-body">
                        <div className="faq-items">
                          <div className="faq-card mb">
                            <h4 className="faq-title">
                              <Link
                                className="collapsed"
                                data-bs-toggle="collapse"
                                to="#faqone"
                                aria-expanded="false"
                              >
                                Does offer free cancellation for a full refund?
                              </Link>
                            </h4>
                            <div id="faqone" className="card-collapse collapse">
                              <div className="faq-content">
                                <p>
                                  Does have fully refundable room rates
                                  available to book on our site. If you’ve
                                  booked a fully refundable room rate, this can
                                  be cancelled up to a few days before check-in
                                  depending on the property's cancellation
                                  policy. Just make sure to check this
                                  property's cancellation policy for the exact
                                  terms and conditions.
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="faq-card">
                            <h4 className="faq-title">
                              <Link
                                className="collapsed"
                                data-bs-toggle="collapse"
                                to="#faqtwo"
                                aria-expanded="false"
                              >
                                Is there a pool?
                              </Link>
                            </h4>
                            <div id="faqtwo" className="card-collapse collapse">
                              <div className="faq-content">
                                <p>
                                  Yes, there is a pool available for guests,
                                  providing a perfect place to relax, unwind,
                                  and enjoy some leisure time during their stay.
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="faq-card">
                            <h4 className="faq-title">
                              <Link
                                className="collapsed"
                                data-bs-toggle="collapse"
                                to="#faqthree"
                                aria-expanded="false"
                              >
                                Are pets allowed?
                              </Link>
                            </h4>
                            <div
                              id="faqthree"
                              className="card-collapse collapse"
                            >
                              <div className="faq-content">
                                <p>
                                  Yes, pets are allowed, and we welcome your
                                  furry friends to stay with you, ensuring a
                                  comfortable experience for both you and your
                                  pets.
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="faq-card">
                            <h4 className="faq-title">
                              <Link
                                className="collapsed"
                                data-bs-toggle="collapse"
                                to="#faqfour"
                                aria-expanded="false"
                              >
                                Is airport shuttle service offered?
                              </Link>
                            </h4>
                            <div
                              id="faqfour"
                              className="card-collapse collapse"
                            >
                              <div className="faq-content">
                                <p>
                                  Yes, airport shuttle service is offered to
                                  provide convenient and reliable transportation
                                  for our guests between the airport and their
                                  destination, ensuring a smooth and stress-free
                                  travel experience.
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="faq-card mb-0">
                            <h4 className="faq-title">
                              <Link
                                className="collapsed"
                                data-bs-toggle="collapse"
                                to="#faqfive"
                                aria-expanded="false"
                              >
                                What are the check-in and check-out times?
                              </Link>
                            </h4>
                            <div
                              id="faqfive"
                              className="card-collapse collapse"
                            >
                              <div className="faq-content">
                                <p>
                                  Check-in is typically from 12:00 PM, and
                                  check-out is usually by 11:00 AM to ensure a
                                  smooth transition for all guests.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
                  {/* reviews items */}
                  {false && (
                  <div className="accordion-item mb-xl-0">
                    <div className="accordion-header">
                      <button
                        className="accordion-button"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#accordion-9"
                        aria-expanded="true"
                      >
                        Reviews
                      </button>
                    </div>
                    <div
                      id="accordion-9"
                      className="accordion-collapse collapse show"
                    >
                      <div className="accordion-body">
                        <div className="sub-head d-flex align-items-center justify-content-between mb-4">
                          <h6 className="fs-16 fw-semibold mb-0">
                            {" "}
                            Reviews (45){" "}
                          </h6>
                          <Link
                            to="#"
                            className="btn btn-dark d-flex align-items-center"
                            data-bs-toggle="modal"
                            data-bs-target="#add_review"
                          >
                            <i className="material-icons-outlined me-1 fs-13">
                              edit_note
                            </i>
                            Write a Review
                          </Link>
                        </div>
                        {/* start row */}
                        <div className="row mb-3  gap-xl-0 gap-lg-0 gap-3">
                          <div className="col-lg-6 d-flex">
                            <div className="p-4 bg-light rounded text-center d-flex align-items-center justify-content-center flex-column flex-fill">
                              <h6 className="fs-16 fw-medium mb-3">
                                Customer Reviews &amp; Ratings
                              </h6>
                              <div className="mb-3">
                                <h2 className="mb-1">
                                  4.9
                                  <span className="fs-16 text-body fw-normal">
                                    / 5.0
                                  </span>
                                </h2>
                                <div className="d-flex align-items-center justify-content-center gap-1">
                                  <i className="material-icons-outlined fs-14 text-warning">
                                    star
                                  </i>
                                  <i className="material-icons-outlined fs-14 text-warning">
                                    star
                                  </i>
                                  <i className="material-icons-outlined fs-14 text-warning">
                                    star
                                  </i>
                                  <i className="material-icons-outlined fs-14 text-warning">
                                    star
                                  </i>
                                  <i className="material-icons-outlined fs-14 text-warning">
                                    star
                                  </i>
                                </div>
                              </div>
                              <p className="mb-0 fs-14">
                                {" "}
                                Based On 2,459 Reviews{" "}
                              </p>
                            </div>
                          </div>
                          {/* end col */}
                          <div className="col-lg-6 d-flex">
                            <div className="card shadow-none review-progress flex-fill mb-0">
                              <div className="card-body ">
                                {/* Progress 1 */}
                                <div className="progress-lvl mb-2">
                                  <p>5 Star Ratings</p>
                                  <div className="progress">
                                    <div
                                      className="progress-bar bg-warning five-star"
                                      role="progressbar"
                                      aria-label="Success example"
                                      style={{ width: "95%" }}
                                      aria-valuenow={25}
                                      aria-valuemin={0}
                                      aria-valuemax={100}
                                    />
                                  </div>
                                  <p>247</p>
                                </div>
                                {/* Progress 2 */}
                                <div className="progress-lvl mb-2">
                                  <p>4 Star Ratings</p>
                                  <div className="progress">
                                    <div
                                      className="progress-bar bg-warning"
                                      role="progressbar"
                                      aria-label="Success example"
                                      style={{ width: "65%" }}
                                      aria-valuenow={25}
                                      aria-valuemin={0}
                                      aria-valuemax={100}
                                    />
                                  </div>
                                  <p>145</p>
                                </div>
                                {/* Progress 3 */}
                                <div className="progress-lvl mb-2">
                                  <p>3 Star Ratings</p>
                                  <div className="progress">
                                    <div
                                      className="progress-bar bg-warning"
                                      role="progressbar"
                                      aria-label="Success example"
                                      style={{ width: "55%" }}
                                      aria-valuenow={25}
                                      aria-valuemin={0}
                                      aria-valuemax={100}
                                    />
                                  </div>
                                  <p>600</p>
                                </div>
                                {/* Progress 4 */}
                                <div className="progress-lvl mb-2">
                                  <p>2 Star Ratings</p>
                                  <div className="progress">
                                    <div
                                      className="progress-bar bg-warning"
                                      role="progressbar"
                                      aria-label="Success example"
                                      style={{ width: "45%" }}
                                      aria-valuenow={25}
                                      aria-valuemin={0}
                                      aria-valuemax={100}
                                    />
                                  </div>
                                  <p>560</p>
                                </div>
                                {/* Progress 5 */}
                                <div className="progress-lvl mb-0">
                                  <p className="mb-0">1 Star Ratings</p>
                                  <div className="progress">
                                    <div
                                      className="progress-bar bg-warning"
                                      role="progressbar"
                                      aria-label="Success example"
                                      style={{ width: "25%" }}
                                      aria-valuenow={25}
                                      aria-valuemin={0}
                                      aria-valuemax={100}
                                    />
                                  </div>
                                  <p className="mb-0">400</p>
                                </div>
                              </div>
                            </div>
                            {/* end card */}
                          </div>
                          {/* end col */}
                        </div>
                        {/* end row */}
                        {/* start review item-1 */}
                        <div className="card shadow-none review-items">
                          <div className="card-body">
                            <div className="mb-2 d-flex align-center gap-2 flex-wrap">
                              <div className="avatar avatar-lg">
                                <ImageWithBasePath
                                  src="assets/img/users/user-06.jpg"
                                  alt="image"
                                  className="img-fluid rounded-circle"
                                />
                              </div>
                              <div className="">
                                <h6 className="fs-16 fw-medium mb-1">
                                  Joseph Massey
                                </h6>
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                  <p className="fs-14 mb-0 text-body">
                                    2 days ago
                                  </p>
                                  <i className="fa-solid fa-circle text-body" />
                                  <div className="d-flex align-items-center justify-content-center">
                                    <i className="material-icons-outlined text-warning">
                                      star
                                    </i>
                                    <i className="material-icons-outlined text-warning">
                                      star
                                    </i>
                                    <i className="material-icons-outlined text-warning">
                                      star
                                    </i>
                                    <i className="material-icons-outlined text-warning">
                                      star
                                    </i>
                                    <i className="material-icons-outlined text-warning">
                                      star_half
                                    </i>
                                  </div>
                                  <p className="fs-14 mb-0 text-body">
                                    Unforgettable Stay!
                                  </p>
                                </div>
                              </div>
                            </div>
                            <p className="mb-2 text-body">
                              This hotel exceeded my expectations! The pool,
                              spa, and dining options were top-notch, and the
                              room had every amenity I could ask for. It felt
                              like a true getaway.
                            </p>
                            <div className="d-flex align-items-center gap-3">
                              <p className="mb-0 d-flex align-items-center fs-14">
                                <i className="material-icons-outlined text-body me-1 fs-14">
                                  thumb_up
                                </i>
                                21
                              </p>
                              <p className="mb-0 d-flex align-items-center fs-14">
                                <i className="material-icons-outlined text-body me-1 fs-14">
                                  thumb_down
                                </i>
                                50
                              </p>
                              <p className="mb-0 d-flex align-items-center fs-14">
                                <i className="material-icons-outlined text-danger me-1 fs-14">
                                  favorite
                                </i>
                                45
                              </p>
                            </div>
                          </div>
                        </div>
                        {/* start review item-2 */}
                        <div className="card shadow-none review-items">
                          <div className="card-body">
                            <div className="d-flex align-center flex-wrap justify-content-between gap-1 mb-2">
                              <div className="d-flex align-center gap-2 flex-wrap">
                                <div className="avatar avatar-lg">
                                  <ImageWithBasePath
                                    src="assets/img/users/user-08.jpg"
                                    alt="image"
                                    className="img-fluid rounded-circle"
                                  />
                                </div>
                                <div className="flex-wrap">
                                  <h6 className="fs-16 fw-medium mb-1">
                                    Jeffrey Jones
                                  </h6>
                                  <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <p className="fs-14 mb-0 text-body">
                                      2 days ago
                                    </p>
                                    <i className="fa-solid fa-circle text-body" />
                                    <div className="d-flex align-items-center justify-content-center">
                                      <i className="material-icons-outlined text-warning">
                                        star
                                      </i>
                                      <i className="material-icons-outlined text-warning">
                                        star
                                      </i>
                                      <i className="material-icons-outlined text-warning">
                                        star
                                      </i>
                                      <i className="material-icons-outlined text-warning">
                                        star
                                      </i>
                                      <i className="material-icons-outlined text-warning">
                                        star_half
                                      </i>
                                    </div>
                                    <p className="fs-14 mb-0 text-body">
                                      Excellent service!
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <Link
                                to="#"
                                className="btn d-inline-flex align-items-center fs-13 fw-semibold reply-btn"
                              >
                                <i className="material-icons-outlined text-dark me-1">
                                  repeat
                                </i>
                                Reply
                              </Link>
                            </div>
                            <p className="mb-2 text-body">
                              This hotel exceeded my expectations! The pool,
                              spa, and dining options were top-notch, and the
                              room had every amenity I could ask for. It felt
                              like a true getaway.
                            </p>
                            <div className="d-flex align-items-center gap-3">
                              <p className="mb-0 d-flex align-items-center fs-14">
                                <i className="material-icons-outlined text-body me-1 fs-14">
                                  thumb_up
                                </i>
                                41
                              </p>
                              <p className="mb-0 d-flex align-items-center fs-14">
                                <i className="material-icons-outlined text-body me-1 fs-14">
                                  thumb_down
                                </i>
                                70
                              </p>
                              <p className="mb-0 d-flex align-items-center fs-14">
                                <i className="material-icons-outlined text-danger me-1 fs-14">
                                  favorite
                                </i>
                                95
                              </p>
                            </div>
                          </div>
                        </div>
                        {/* start review item-3 */}
                        <div className="card shadow-none review-items mb-4">
                          <div className="card-body">
                            <div className="mb-4">
                              <div className="d-flex align-center flex-wrap justify-content-between gap-1 mb-2">
                                <div className="d-flex align-center gap-2 flex-wrap">
                                  <div className="avatar avatar-lg">
                                    <ImageWithBasePath
                                      src="assets/img/users/user-07.jpg"
                                      alt="image"
                                      className="img-fluid rounded-circle"
                                    />
                                  </div>
                                  <div className="">
                                    <h6 className="fs-16 fw-medium mb-1">
                                      Jessie Alves
                                    </h6>
                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                      <p className="fs-14 mb-0 text-body">
                                        2 days ago
                                      </p>
                                      <i className="fa-solid fa-circle text-body" />
                                      <div className="d-flex align-items-center justify-content-center">
                                        <i className="material-icons-outlined text-warning">
                                          star
                                        </i>
                                        <i className="material-icons-outlined text-warning">
                                          star
                                        </i>
                                        <i className="material-icons-outlined text-warning">
                                          star
                                        </i>
                                        <i className="material-icons-outlined text-warning">
                                          star
                                        </i>
                                        <i className="material-icons-outlined text-warning">
                                          star
                                        </i>
                                      </div>
                                      <p className="fs-14 mb-0 text-body">
                                        Convenient Location!
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <Link
                                  to="#"
                                  className="btn d-inline-flex align-items-center fs-13 fw-semibold reply-btn"
                                >
                                  <i className="material-icons-outlined text-dark me-1">
                                    repeat
                                  </i>
                                  Reply
                                </Link>
                              </div>
                              <p className="mb-2 text-body">
                                The location was perfect for exploring the city,
                                and the views from our room were breathtaking.
                                It made our trip so much more enjoyable to stay
                                somewhere central and scenic.
                              </p>
                              <div className="d-flex align-items-center gap-3">
                                <p className="mb-0 d-flex align-items-center fs-14">
                                  <i className="material-icons-outlined text-body me-1 fs-14">
                                    thumb_up
                                  </i>
                                  11
                                </p>
                                <p className="mb-0 d-flex align-items-center fs-14">
                                  <i className="material-icons-outlined text-body me-1 fs-14">
                                    thumb_down
                                  </i>
                                  60
                                </p>
                                <p className="mb-0 d-flex align-items-center fs-14">
                                  <i className="material-icons-outlined text-danger me-1 fs-14">
                                    favorite
                                  </i>
                                  35
                                </p>
                              </div>
                            </div>
                            {/* Start reply item*/}
                            <div className="card shadow-none review-items bg-light border-0 mb-0 ms-lg-5 ms-md-5 ms-3">
                              <div className="card-body">
                                <div className="d-flex align-center flex-wrap justify-content-between gap-1 mb-2">
                                  <div className="d-flex align-center gap-2 flex-wrap">
                                    <div className="avatar avatar-lg">
                                      <ImageWithBasePath
                                        src="assets/img/users/user-01.jpg"
                                        alt="image"
                                        className="img-fluid rounded-circle"
                                      />
                                    </div>
                                    <div className="">
                                      <h6 className="fs-16 fw-medium mb-1">
                                        Adrian Hendriques
                                      </h6>
                                      <div className="d-flex align-items-center gap-2 flex-wrap">
                                        <p className="fs-14 mb-0 text-body">
                                          2 days ago
                                        </p>
                                        <i className="fa-solid fa-circle text-body" />
                                        <div className="d-flex align-items-center justify-content-center">
                                          <i className="material-icons-outlined text-warning">
                                            star
                                          </i>
                                          <i className="material-icons-outlined text-warning">
                                            star
                                          </i>
                                          <i className="material-icons-outlined text-warning">
                                            star
                                          </i>
                                          <i className="material-icons-outlined text-warning">
                                            star
                                          </i>
                                          <i className="material-icons-outlined text-warning">
                                            star
                                          </i>
                                        </div>
                                        <p className="fs-14 mb-0 text-body">
                                          Excellent service!
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <Link
                                    to="#"
                                    className="btn d-inline-flex align-items-center fs-13 fw-semibold reply-btn"
                                  >
                                    <i className="material-icons-outlined text-dark me-1">
                                      repeat
                                    </i>
                                    Reply
                                  </Link>
                                </div>
                                <p className="mb-2 text-body">
                                  Thank you so much for your kind words! We're
                                  thrilled to hear that our location and views
                                  made your trip even more enjoyable. We hope to
                                  welcome you back soon for another scenic stay!
                                </p>
                                <div className="d-flex align-items-center gap-3">
                                  <p className="mb-0 d-flex align-items-center fs-14">
                                    <i className="material-icons-outlined text-body me-1 fs-14">
                                      thumb_up
                                    </i>
                                    10
                                  </p>
                                  <p className="mb-0 d-flex align-items-center fs-14">
                                    <i className="material-icons-outlined text-body me-1 fs-14">
                                      thumb_down
                                    </i>
                                    21
                                  </p>
                                  <p className="mb-0 d-flex align-items-center fs-14">
                                    <i className="material-icons-outlined text-danger me-1 fs-14">
                                      favorite
                                    </i>
                                    46
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <Link
                            to="#"
                            className="btn btn-dark d-inline-flex align-center gap-1 review-btn"
                          >
                            See All Reviews
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
                </div>
              </div>
              <BuyLeftForm agent={property?.agent} propertySlug={property?.slug || property?.id} />
            </div>
            {/* end row */}
            {/* start row */}
            {false && (
            <div className="row row-gap-4 custom-properties-items">
              {/* Items-1 */}
              <div className="col-xl-3 col-lg-6 col-md-6 d-flex">
                <div className="property-card mb-0 flex-fill">
                  <div className="property-listing-item p-0 mb-0 shadow-none">
                    <div className="buy-grid-img mb-0 rounded-0">
                      <Link to={propertySlug ? all_routes.buyDetailsPath(propertySlug) : "#"}>
                        <ImageWithBasePath
                          className="img-fluid"
                          src="assets/img/buy/buy-grid-img-10.jpg"
                          alt="image"
                        />
                      </Link>
                      <div className="d-flex align-items-center justify-content-between position-absolute top-0 start-0 end-0 px-3 py-2 z-1">
                        <div className="d-flex align-items-center gap-2">
                          <div className="badge badge-sm bg-danger d-flex align-items-center custom-badge">
                            <i className="material-icons-outlined">
                              generating_tokens
                            </i>
                          </div>
                          <div className="badge badge-sm bg-orange d-flex align-items-center custom-badge">
                            <i className="material-icons-outlined">loyalty</i>
                          </div>
                        </div>
                        <Link
                          to="#"
                          className={`favourite ${
                            selectedItems[1] ? "selected" : ""
                          }`}
                          key={1}
                          onClick={() => handleItemClick(1)}
                        >
                          <i
                            className={`material-icons-outlined ${
                              selectedItems[1] ? "filled" : ""
                            }`}
                          >
                            {selectedItems[1] ? "favorite" : "favorite_border"}
                          </i>
                        </Link>
                      </div>
                      <div className="d-flex align-items-center justify-content-start position-absolute bottom-0 end-0 start-0 p-3 z-1">
                        <div className="user-avatar avatar avatar-md border rounded-circle">
                          <ImageWithBasePath
                            src="assets/img/users/user-02.jpg"
                            alt="User"
                            className="rounded-circle"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="buy-grid-content">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <span className="badge bg-secondary"> Condo</span>
                        <span className="ms-1 fs-14">
                          Listed on : 25 May 2025
                        </span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h6 className="title mb-1">
                            <Link to={propertySlug ? all_routes.buyDetailsPath(propertySlug) : "#"}>
                              Beautiful Condo Room
                            </Link>
                          </h6>
                          <p className="d-flex align-items-center fs-14 mb-0 gap-1">
                            <i className="material-icons-outlined me-1 ms-0">
                              location_on
                            </i>
                            25, Willow Apartment, USA
                          </p>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
                        <h6 className="text-primary mb-0 ms-1">
                          $400 <span className="fw-normal fs-14"> / Month</span>
                        </h6>
                        <div className="d-flex align-items-center justify-content-center">
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <span className="ms-1 fs-14">5.0</span>
                        </div>
                      </div>
                      <ul className="d-flex buy-grid-details justify-content-between align-items-center flex-wrap gap-1 border-top border-light-100 pt-3 mt-3">
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-light text-dark">
                            bed
                          </i>
                          2 Bedroom
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-light text-dark">
                            bathtub
                          </i>
                          2 Bath
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-light text-dark">
                            straighten
                          </i>
                          350 Sq Ft
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                {/* end card */}
              </div>
              {/* end col */}
              {/* Items-2 */}
              <div className="col-xl-3 col-lg-6 col-md-6 d-flex">
                <div className="property-card mb-0 flex-fill">
                  <div className="property-listing-item p-0 mb-0 shadow-none">
                    <div className="buy-grid-img mb-0 rounded-0">
                      <Link to={propertySlug ? all_routes.buyDetailsPath(propertySlug) : "#"}>
                        <ImageWithBasePath
                          className="img-fluid"
                          src="assets/img/buy/buy-grid-img-11.jpg"
                          alt="image"
                        />
                      </Link>
                      <div className="d-flex align-items-center justify-content-between position-absolute top-0 start-0 end-0 px-3 py-2 z-1">
                        <div className="d-flex align-items-center gap-2">
                          <div className="badge badge-sm bg-danger d-flex align-items-center custom-badge">
                            <i className="material-icons-outlined">
                              generating_tokens
                            </i>
                          </div>
                          <div className="badge badge-sm bg-orange d-flex align-items-center custom-badge">
                            <i className="material-icons-outlined">loyalty</i>
                          </div>
                        </div>
                        <Link
                          to="#"
                          className={`favourite ${
                            selectedItems[2] ? "selected" : ""
                          }`}
                          key={2}
                          onClick={() => handleItemClick(2)}
                        >
                          <i
                            className={`material-icons-outlined ${
                              selectedItems[2] ? "filled" : ""
                            }`}
                          >
                            {selectedItems[2] ? "favorite" : "favorite_border"}
                          </i>
                        </Link>
                      </div>
                      <div className="d-flex align-items-center justify-content-start position-absolute bottom-0 end-0 start-0 p-3 z-1">
                        <div className="user-avatar avatar avatar-md border rounded-circle">
                          <ImageWithBasePath
                            src="assets/img/users/user-04.jpg"
                            alt="User"
                            className="rounded-circle"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="buy-grid-content">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <span className="badge bg-primary"> Suite</span>
                        <span className="ms-1 fs-14">
                          Listed on : 18 Apr 2025
                        </span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h6 className="title mb-1">
                            <Link to={propertySlug ? all_routes.buyDetailsPath(propertySlug) : "#"}>
                              Serenity Condo Suite
                            </Link>
                          </h6>
                          <p className="d-flex align-items-center fs-14 mb-0">
                            <i className="material-icons-outlined me-1 ms-0">
                              location_on
                            </i>
                            17, Grov Tower, New York, USA
                          </p>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
                        <h6 className="text-primary mb-0 ms-1">
                          $500 <span className="fw-normal fs-14"> / Month</span>
                        </h6>
                        <div className="d-flex align-items-center justify-content-center">
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <span className="ms-1 fs-14">5.0</span>
                        </div>
                      </div>
                      <ul className="d-flex buy-grid-details justify-content-between align-items-center flex-wrap gap-1 border-top border-light-100 pt-3 mt-3">
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-light text-dark">
                            bed
                          </i>
                          2 Bedroom
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-light text-dark">
                            bathtub
                          </i>
                          1 Bath
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-light text-dark">
                            straighten
                          </i>
                          400 Sq Ft
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                {/* end card */}
              </div>
              {/* end col */}
              {/* Items-3 */}
              <div className="col-xl-3 col-lg-6 col-md-6 d-flex">
                <div className="property-card mb-0 flex-fill">
                  <div className="property-listing-item p-0 mb-0 shadow-none">
                    <div className="buy-grid-img mb-0 rounded-0">
                      <Link to={propertySlug ? all_routes.buyDetailsPath(propertySlug) : "#"}>
                        <ImageWithBasePath
                          className="img-fluid"
                          src="assets/img/buy/buy-grid-img-12.jpg"
                          alt="image"
                        />
                      </Link>
                      <div className="d-flex align-items-center justify-content-between position-absolute top-0 start-0 end-0 px-3 py-2 z-1">
                        <div className="d-flex align-items-center gap-2">
                          <div className="badge badge-sm bg-danger d-flex align-items-center custom-badge">
                            <i className="material-icons-outlined">
                              generating_tokens
                            </i>
                          </div>
                          <div className="badge badge-sm bg-orange d-flex align-items-center custom-badge">
                            <i className="material-icons-outlined">loyalty</i>
                          </div>
                        </div>
                        <Link
                          to="#"
                          className={`favourite ${
                            selectedItems[3] ? "selected" : ""
                          }`}
                          key={3}
                          onClick={() => handleItemClick(3)}
                        >
                          <i
                            className={`material-icons-outlined ${
                              selectedItems[3] ? "filled" : ""
                            }`}
                          >
                            {selectedItems[3] ? "favorite" : "favorite_border"}
                          </i>
                        </Link>
                      </div>
                      <div className="d-flex align-items-center justify-content-start position-absolute bottom-0 end-0 start-0 p-3 z-1">
                        <div className="user-avatar avatar avatar-md border rounded-circle">
                          <ImageWithBasePath
                            src="assets/img/users/user-05.jpg"
                            alt="User"
                            className="rounded-circle"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="buy-grid-content">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <span className="badge bg-secondary"> Luxue</span>
                        <span className="ms-1 fs-14">
                          Listed on : 12 Apr 2025
                        </span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h6 className="title mb-1">
                            <Link to={propertySlug ? all_routes.buyDetailsPath(propertySlug) : "#"}>
                              Downtown Luxe Room
                            </Link>
                          </h6>
                          <p className="d-flex align-items-center fs-14 mb-0">
                            <i className="material-icons-outlined me-1 ms-0">
                              location_on
                            </i>
                            88, Springs Lane, Austin, USA
                          </p>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
                        <h6 className="text-primary mb-0 ms-1">
                          $450 <span className="fw-normal fs-14"> / Month</span>
                        </h6>
                        <div className="d-flex align-items-center justify-content-center">
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <span className="ms-1 fs-14">5.0</span>
                        </div>
                      </div>
                      <ul className="d-flex buy-grid-details justify-content-between align-items-center flex-wrap gap-1 border-top border-light-100 pt-3 mt-3">
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-light text-dark">
                            bed
                          </i>
                          2 Bedroom
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-light text-dark">
                            bathtub
                          </i>
                          1 Bath
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-light text-dark">
                            straighten
                          </i>
                          460 Sq Ft
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                {/* end card */}
              </div>
              {/* end col */}
              {/* Items-4 */}
              <div className="col-xl-3 col-lg-6 col-md-6 d-flex">
                <div className="property-card mb-0 flex-fill">
                  <div className="property-listing-item p-0 mb-0 shadow-none">
                    <div className="buy-grid-img mb-0 rounded-0">
                      <Link to={propertySlug ? all_routes.buyDetailsPath(propertySlug) : "#"}>
                        <ImageWithBasePath
                          className="img-fluid"
                          src="assets/img/buy/buy-grid-img-13.jpg"
                          alt="image"
                        />
                      </Link>
                      <div className="d-flex align-items-center justify-content-between position-absolute top-0 start-0 end-0 px-3 py-2 z-1">
                        <div className="d-flex align-items-center gap-2">
                          <div className="badge badge-sm bg-danger d-flex align-items-center custom-badge">
                            <i className="material-icons-outlined">
                              generating_tokens
                            </i>
                          </div>
                          <div className="badge badge-sm bg-orange d-flex align-items-center custom-badge">
                            <i className="material-icons-outlined">loyalty</i>
                          </div>
                        </div>
                        <Link
                          to="#"
                          className={`favourite ${
                            selectedItems[5] ? "selected" : ""
                          }`}
                          key={5}
                          onClick={() => handleItemClick(5)}
                        >
                          <i
                            className={`material-icons-outlined ${
                              selectedItems[5] ? "filled" : ""
                            }`}
                          >
                            {selectedItems[5] ? "favorite" : "favorite_border"}
                          </i>
                        </Link>
                      </div>
                      <div className="d-flex align-items-center justify-content-start position-absolute bottom-0 end-0 start-0 p-3 z-1">
                        <div className="user-avatar avatar avatar-md border rounded-circle">
                          <ImageWithBasePath
                            src="assets/img/users/user-07.jpg"
                            alt="User"
                            className="rounded-circle"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="buy-grid-content">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <span className="badge bg-secondary"> Condo</span>
                        <span className="ms-1 fs-14">
                          Listed on : 25 May 2025
                        </span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h6 className="title mb-1">
                            <Link to={propertySlug ? all_routes.buyDetailsPath(propertySlug) : "#"}>
                              Modern Haven Suite
                            </Link>
                          </h6>
                          <p className="d-flex align-items-center fs-14 mb-0">
                            <i className="material-icons-outlined me-1 ms-0">
                              location_on
                            </i>
                            42, Hill Residence, Austin, USA
                          </p>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
                        <h6 className="text-primary mb-0 ms-1">
                          $600 <span className="fw-normal fs-14"> / Month</span>
                        </h6>
                        <div className="d-flex align-items-center justify-content-center">
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <i className="material-icons-outlined text-warning">
                            star
                          </i>
                          <span className="ms-1 fs-14">5.0</span>
                        </div>
                      </div>
                      <ul className="d-flex buy-grid-details justify-content-between align-items-center flex-wrap gap-1 border-top border-light-100 pt-3 mt-3">
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-light text-dark">
                            bed
                          </i>
                          4 Bedroom
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-light text-dark">
                            bathtub
                          </i>
                          2 Bath
                        </li>
                        <li className="d-flex align-items-center gap-1">
                          <i className="material-icons-outlined bg-light text-dark">
                            straighten
                          </i>
                          520 Sq Ft
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                {/* end card */}
              </div>
              {/* end col */}
            </div>
            )}
            {/* end row */}
          </div>
        </div>
        {/* End Content */}
        {/* Start Add Modal */}
        {false && (
        <div id="add_review" className="modal fade">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form action={all_routes.buyDetails}>
                <div className="modal-header">
                  <h4 className="text-dark modal-title fw-bold">
                    Write a Review
                  </h4>
                  <button
                    type="button"
                    className="btn-close btn-close-modal custom-btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  >
                    <i className="material-icons-outlined">close</i>
                  </button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Ratings</label>
                    <div className="selection-wrap">
                      <div className="d-inline-block">
                        <div className="rating-selction">
                          <input
                            type="radio"
                            name="rating"
                            defaultValue={5}
                            id="rating5"
                          />
                          <label htmlFor="rating5">
                            <i className="fa-solid fa-star" />
                          </label>
                          <input
                            type="radio"
                            name="rating"
                            defaultValue={4}
                            id="rating4"
                          />
                          <label htmlFor="rating4">
                            <i className="fa-solid fa-star" />
                          </label>
                          <input
                            type="radio"
                            name="rating"
                            defaultValue={3}
                            id="rating3"
                          />
                          <label htmlFor="rating3">
                            <i className="fa-solid fa-star" />
                          </label>
                          <input
                            type="radio"
                            name="rating"
                            defaultValue={2}
                            id="rating2"
                          />
                          <label htmlFor="rating2">
                            <i className="fa-solid fa-star" />
                          </label>
                          <input
                            type="radio"
                            name="rating"
                            defaultValue={1}
                            id="rating1"
                          />
                          <label htmlFor="rating1">
                            <i className="fa-solid fa-star" />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Ratings</label>
                    <input type="text" className="form-control" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" />
                  </div>
                  <div className="mb-0">
                    <label className="form-label">Write your review</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      defaultValue={""}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <div className="d-flex align-items-center justify-content-end">
                    <button type="submit" className="btn btn-lg btn-primary">
                      Submit Review
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
        )}
        {/* End Add Modal */}

        {/* Location Map - Full Width */}
        {locationLabel && (
          <div className="location-map-section mt-5">
            <div className="container-fluid px-0">
              <div className="bg-light py-4">
                <div className="container">
                  <h3 className="mb-3">
                    <i className="material-icons-outlined align-middle me-2">location_on</i>
                    Ubicación de la Propiedad
                  </h3>
                  <p className="text-muted mb-0">{locationLabel}</p>
                </div>
              </div>
              <iframe
                title="Property Location Map"
                width="100%"
                height="450"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent(locationLabel)}`}
              />
            </div>
          </div>
        )}
      </div>
      {/* ========================
			End Page Content
		========================= */}
    </>
  );
};

export default BuyDetails;
