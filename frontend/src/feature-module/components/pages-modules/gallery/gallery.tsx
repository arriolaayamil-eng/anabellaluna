import { Link } from "react-router";
import { useState, useEffect } from "react";
import Breadcrumb from "../../../../core/common/Breadcrumb/breadcrumb";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import { all_routes } from "../../../routes/all_routes";
import publicService from "../../../../services/publicService";

const Gallery = () => {
  const [images, setImages] = useState<{ id: string; url: string; title: string; slug: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const res = await publicService.getGallery();
        if (m) setImages(res.items || []);
      } catch { /* keep empty */ }
      finally { if (m) setIsLoading(false); }
    })();
    return () => { m = false; };
  }, []);

  return (
    <>
      <div className="page-wrapper">
        <Breadcrumb title="Galería" paths={[{ label: "Galería", active: true }]} />
        <div className="content">
          <div className="container">
            <div className="section-heading text-center mb-4">
              <h2>Galería de Propiedades</h2>
              <div className="sec-line">
                <span className="sec-line1" />
                <span className="sec-line2" />
              </div>
              <p>Conocé nuestras propiedades a través de imágenes.</p>
            </div>
            {isLoading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            )}
            {!isLoading && images.length === 0 && (
              <div className="text-center py-5">
                <i className="material-icons-outlined fs-1 text-muted">photo_library</i>
                <p className="mt-2 text-muted">No hay imágenes disponibles.</p>
              </div>
            )}
            {!isLoading && images.length > 0 && (
              <div className="row row-gap-4">
                {images.map((img) => (
                  <div key={img.id} className="col-lg-4 col-md-6">
                    <div className="gallery-item">
                      <Link to={all_routes.buyDetailsPath(img.slug)}>
                        <ImageWithBasePath
                          src={img.url}
                          alt={img.title || "Propiedad"}
                          className="img-fluid rounded w-100"
                        />
                      </Link>
                      {img.title && (
                        <div className="mt-2">
                          <Link to={all_routes.buyDetailsPath(img.slug)} className="fw-medium">
                            {img.title}
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Gallery;
