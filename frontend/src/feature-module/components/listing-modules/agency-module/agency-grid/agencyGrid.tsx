import { useState, useEffect } from "react";
import { Link } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import Breadcrumb from "../../../../../core/common/Breadcrumb/breadcrumb";
import publicService from "../../../../../services/publicService";

const AgencyGrid = () => {
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const [cfg, st] = await Promise.all([
          publicService.getSiteConfig(),
          publicService.getStats(),
        ]);
        if (m) {
          setSiteConfig(cfg);
          setStats(st);
        }
      } catch {
        if (m) setSiteConfig({});
      } finally {
        if (m) setIsLoading(false);
      }
    })();
    return () => { m = false; };
  }, []);

  const name = siteConfig?.name || "Ana y la Luna Propiedades";
  const logo = siteConfig?.logo;
  const phone = siteConfig?.phone;
  const email = siteConfig?.email;
  const address = siteConfig?.address;
  const whatsapp = siteConfig?.whatsapp;
  const socialMedia = siteConfig?.socialMedia || {};
  const totalProperties = stats?.properties || 0;

  return (
    <>
      <div className="page-wrapper">
        <Breadcrumb
          title="Inmobiliarias"
          paths={[{ label: "Inmobiliarias", active: true }]}
        />
        <div className="content">
          <div className="container">
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            ) : (
              <div className="row justify-content-center">
                <div className="col-xl-4 col-lg-5 col-md-8">
                  <div className="card text-center">
                    <div className="card-body p-4">
                      {/* Logo / avatar */}
                      <div className="mb-4">
                        {logo ? (
                          <img
                            src={logo}
                            alt={name}
                            className="rounded-circle"
                            style={{ width: 100, height: 100, objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary text-white"
                            style={{ width: 100, height: 100, fontSize: 36, fontWeight: 700 }}
                          >
                            {name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <h4 className="mb-1">{name}</h4>
                      <p className="text-muted fs-14 mb-3">Inmobiliaria</p>

                      {/* Portfolio count */}
                      <div className="d-flex justify-content-center mb-4">
                        <span className="badge bg-primary fs-14 px-3 py-2">
                          <i className="material-icons-outlined me-1 align-middle" style={{ fontSize: 16 }}>home</i>
                          {totalProperties} propiedad{totalProperties !== 1 ? "es" : ""} en portafolio
                        </span>
                      </div>

                      {/* Contact info */}
                      <ul className="list-unstyled text-start mb-4">
                        {phone && (
                          <li className="d-flex align-items-center gap-2 mb-2">
                            <i className="material-icons-outlined text-primary">phone</i>
                            <span>{phone}</span>
                          </li>
                        )}
                        {whatsapp && (
                          <li className="d-flex align-items-center gap-2 mb-2">
                            <i className="fab fa-whatsapp text-success fs-16" />
                            <a
                              href={`https://wa.me/${String(whatsapp).replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {whatsapp}
                            </a>
                          </li>
                        )}
                        {email && (
                          <li className="d-flex align-items-center gap-2 mb-2">
                            <i className="material-icons-outlined text-primary">email</i>
                            <a href={`mailto:${email}`}>{email}</a>
                          </li>
                        )}
                        {address && (
                          <li className="d-flex align-items-center gap-2 mb-2">
                            <i className="material-icons-outlined text-primary">location_on</i>
                            <span>{address}</span>
                          </li>
                        )}
                      </ul>

                      {/* Social media */}
                      {(socialMedia.instagram || socialMedia.facebook || socialMedia.linkedin || socialMedia.twitter) && (
                        <div className="d-flex justify-content-center gap-2 mb-4">
                          {socialMedia.instagram && (
                            <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-secondary">
                              <i className="fab fa-instagram" />
                            </a>
                          )}
                          {socialMedia.facebook && (
                            <a href={socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-secondary">
                              <i className="fab fa-facebook-f" />
                            </a>
                          )}
                          {socialMedia.linkedin && (
                            <a href={socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-secondary">
                              <i className="fab fa-linkedin-in" />
                            </a>
                          )}
                          {socialMedia.twitter && (
                            <a href={socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-secondary">
                              <i className="fab fa-twitter" />
                            </a>
                          )}
                        </div>
                      )}

                      <Link to={all_routes.propiedades} className="btn btn-dark w-100">
                        Ver Propiedades
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AgencyGrid;
