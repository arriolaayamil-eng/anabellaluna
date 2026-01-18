import { Link } from "react-router";
import Slider from "react-slick";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import React from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

type Props = {
  images?: string[];
};

const BuyGalleryItem = ({ images }: Props) => {
  const gallery = {
    dots: false,
    infinite: true,
    speed: 2000,
    slidesToShow: 5,
    slidesToScroll: 1,
    autoplay: false,
    arrows: false,
    responsive: [
      {
        breakpoint: 1300,
        settings: {
          slidesToShow: 4,
        },
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
        },
      },
    ],
  };

  const normalizedImages = (images || []).filter(Boolean);
  const slides = normalizedImages.map((src) => ({ src }));
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  return (
    <div className="accordion-item">
      <div className="accordion-header">
        <button
          className="accordion-button"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#accordion-6"
          aria-expanded="true"
        >
          Gallery
        </button>
      </div>
      <div id="accordion-6" className="accordion-collapse collapse show">
        <div className="accordion-body gallery-body">
          <Slider {...gallery} className="gallery-slider">
            {normalizedImages.map((src, idx) => (
              <div key={`${src}-${idx}`} className="gallery-card">
                <Link
                  to="#"
                  onClick={() => setOpenIndex(idx)}
                  className="gallery-item rounded"
                >
                  <ImageWithBasePath src={src} alt="image" className="rounded img-fluid" />
                </Link>
              </div>
            ))}
          </Slider>

          <Lightbox
            open={openIndex != null}
            close={() => setOpenIndex(null)}
            slides={slides}
            index={openIndex ?? 0}
          />
        </div>
      </div>
    </div>
  );
};

export default BuyGalleryItem;
