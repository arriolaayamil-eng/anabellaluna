import { Link, useLocation } from "react-router";
import { all_routes } from "../../../feature-module/routes/all_routes";
import ImageWithBasePath from "../../imageWithBasePath";
import { useEffect, useState } from "react";

const Footer = () => {
  const location = useLocation();

  const [year, setYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    const checkYear = () => {
      const currentYear = new Date().getFullYear();
      setYear(currentYear);
    };

    // Check once per hour
    const interval = setInterval(checkYear, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {location.pathname === "/index" ? (
        <div>
          {/* Start Footer */}
          <footer className="footer footer-dark">
            <div className="footer-bg">
              <ImageWithBasePath
                src="assets/img/bg/footer-bg-01.png"
                className="bg-1"
                alt="image"
              />
              <ImageWithBasePath
                src="assets/img/bg/footer-bg-02.png"
                className="bg-2"
                alt="image"
              />
            </div>
            {/* Footer Top */}
            <div className="footer-top">
              <div className="container">
                <div className="row row-gap-4">
                  <div className="col-lg-4 col-md-6 col-sm-8">
                    <div className="footer-widget footer-about">
                      <h5>Descargá Nuestra App</h5>
                      <p>Descargá la app y reservá tu propiedad</p>
                      <div className="download-app">
                        <Link to="#">
                          <ImageWithBasePath
                            src="assets/img/icons/goolge-play.svg"
                            alt="google play"
                          />
                        </Link>
                        <Link to="#">
                          <ImageWithBasePath
                            src="assets/img/icons/app-store.svg"
                            alt="app store"
                          />
                        </Link>
                      </div>
                      <div className="social-links">
                        <h5>Conectate con nosotros</h5>
                        <div className="social-icon">
                          <Link to="#">
                            <i className="fa-brands fa-facebook" />
                          </Link>
                          <Link to="#">
                            <i className="fa-brands fa-x-twitter" />
                          </Link>
                          <Link to="#">
                            <i className="fa-brands fa-instagram" />
                          </Link>
                          <Link to="#">
                            <i className="fa-brands fa-linkedin" />
                          </Link>
                          <Link to="#">
                            <i className="fa-brands fa-pinterest" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-2 col-md-6 col-sm-4">
                    <div className="footer-widget">
                      <h5 className="footer-title">Páginas</h5>
                      <ul className="footer-menu">
                        <li>
                          <Link to={all_routes.ourTeam}>Nuestro Equipo</Link>
                        </li>
                        <li>
                          <Link to={all_routes.pricing}>Planes de Precios</Link>
                        </li>
                        <li>
                          <Link to={all_routes.gallery}>Galería</Link>
                        </li>
                        <li>
                          <Link to="#">Configuración</Link>
                        </li>
                        <li>
                          <Link to="#">Perfil</Link>
                        </li>
                        <li>
                          <Link to={all_routes.buyPropertyList}>Publicaciones</Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="col-lg-2 col-md-4 col-sm-4">
                    <div className="footer-widget">
                      <h5 className="footer-title">Empresa</h5>
                      <ul className="footer-menu">
                        <li>
                          <Link to={all_routes.aboutUs}>Sobre Nosotros</Link>
                        </li>
                        <li>
                          <Link to="#">Carreras</Link>
                        </li>
                        <li>
                          <Link to={all_routes.blogGrid}>Blog</Link>
                        </li>
                        <li>
                          <Link to="#">Programa de Afiliados</Link>
                        </li>
                        <li>
                          <Link to="#">Nuestros Socios</Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="col-lg-2 col-md-4 col-sm-4">
                    <div className="footer-widget">
                      <h5 className="footer-title">Destinos</h5>
                      <ul className="footer-menu">
                        <li>
                          <Link to="#">Hawai</Link>
                        </li>
                        <li>
                          <Link to="#">Istanbul</Link>
                        </li>
                        <li>
                          <Link to="#">San Diego</Link>
                        </li>
                        <li>
                          <Link to="#">Belgium</Link>
                        </li>
                        <li>
                          <Link to="#">Newyork</Link>
                        </li>
                        <li>
                          <Link to="#">Los Angeles</Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="col-lg-2 col-md-4 col-sm-4">
                    <div className="footer-widget">
                      <h5 className="footer-title">Enlaces Útiles</h5>
                      <ul className="footer-menu">
                        <li>
                          <Link to="#">Aviso Legal</Link>
                        </li>
                        <li>
                          <Link to={all_routes.privacyPolicy}>
                            Política de Privacidad
                          </Link>
                        </li>
                        <li>
                          <Link to={all_routes.termsCondition}>
                            Términos y Condiciones
                          </Link>
                        </li>
                        <li>
                          <Link to="#">Soporte</Link>
                        </li>
                        <li>
                          <Link to="#">Política de Reembolso</Link>
                        </li>
                        <li>
                          <Link to={all_routes.contactUs}>Contactanos</Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /Footer Top */}
            {/* Footer Bottom */}
            <div className="footer-bottom">
              <div className="container">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div className="copyright">
                    <p className="copy-right">
                      Copyright &copy; {year}. Todos los derechos reservados, Anabella Luna
                    </p>
                  </div>
                  <div className="company-logo">
                    <p>Un producto de Anabella Luna</p>
                  </div>
                </div>
              </div>
            </div>
            {/* /Footer Bottom */}
          </footer>
          {/* End Footer */}
        </div>
      ) : location.pathname == "/index-2" ? (
        <>
          {/* Start Footer */}
          <footer className="footer-two">
            <div className="container">
              <div className="join-sec">
                <div>
                  <h2>Join now and redefine your work experience!</h2>
                  <p>
                    <h5>Conectate con nosotros</h5>, streamline collaboration, and unlock
                    success.
                  </p>
                </div>
              </div>
              {/* Footer Top */}
              <div className="footer-top">
                <div className="row gy-4">
                  <div className="col-lg-2 col-md-6 col-sm-6">
                    <div className="footer-widget">
                      <h5 className="footer-title">Empresa</h5>
                      <ul className="footer-menu">
                        <li>
                          <Link to={all_routes.aboutUs}>Sobre Nosotros</Link>
                        </li>
                        <li>
                          <Link to="#">Carreras</Link>
                        </li>
                        <li>
                          <Link to={all_routes.blogGrid}>Blog</Link>
                        </li>
                        <li>
                          <Link to="#">Programa de Afiliados</Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="col-lg-2 col-md-6 col-sm-6">
                    <div className="footer-widget">
                      <h5 className="footer-title">Destinos</h5>
                      <ul className="footer-menu">
                        <li>
                          <Link to="#">Hawai</Link>
                        </li>
                        <li>
                          <Link to="#">Istanbul</Link>
                        </li>
                        <li>
                          <Link to="#">San Diego</Link>
                        </li>
                        <li>
                          <Link to="#">Belgium</Link>
                        </li>
                        <li>
                          <Link to="#">Newyork</Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <div className="footer-widget footer-contacts">
                      <h5 className="footer-title">Reach Us</h5>
                      <div className="contact-info">
                        <h6>Location</h6>
                        <p>
                          123 East 26th Street,Fifth Floor,New York, NY 10011
                        </p>
                      </div>
                      <div className="contact-info">
                        <h6>Phone</h6>
                        <p>+1 34245 67678</p>
                      </div>
                      <div className="contact-info">
                        <h6>Email</h6>
                        <p>info@example.com</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <div className="footer-widget footer-subscribe">
                      <h5 className="footer-title">Newsletter</h5>
                      <div className="email-info">
                        <h6>Subscribe to Our Newsletter</h6>
                        <p>
                          Just sign up and we'll send you a notification by
                          email.
                        </p>
                      </div>
                      <div className="d-flex align-items-center subscribe-wrap">
                        <div className="input-group input-group-flat">
                          <span className="input-group-text">
                            <i className="material-icons-outlined">email</i>
                          </span>
                          <input
                            type="email"
                            className="form-control form-control-lg"
                            placeholder="Enter Email Address"
                          />
                        </div>
                        <button type="submit" className="btn btn-primary">
                          <i className="material-icons-outlined">send</i>
                        </button>
                      </div>
                      <div className="social-icon">
                        <Link to="#">
                          <i className="fa-brands fa-facebook" />
                        </Link>
                        <Link to="#">
                          <i className="fa-brands fa-x-twitter" />
                        </Link>
                        <Link to="#">
                          <i className="fa-brands fa-instagram" />
                        </Link>
                        <Link to="#">
                          <i className="fa-brands fa-linkedin" />
                        </Link>
                        <Link to="#">
                          <i className="fa-brands fa-pinterest" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* /Footer Top */}
            </div>
            {/* Footer Bottom */}
            <div className="footer-bottom">
              <div className="container">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <p className="copy-right">
                    Copyright © {year}. Todos los derechos reservados, Anabella Luna
                  </p>
                  <div className="policy-link">
                    <Link to={all_routes.privacyPolicy}>Política de Privacidad</Link>
                    <Link to="#">Aviso Legal</Link>
                    <Link to="#">Política de Reembolso</Link>
                    <Link to={all_routes.termsCondition}>
                      Términos y Condiciones
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            {/* /Footer Bottom */}
          </footer>
          {/* End Footer */}
        </>
      ) : (
        <>
          {/* Start Footer */}
          <footer className="footer-three footer-dark">
            <div className="footer-bg">
              <ImageWithBasePath
                src="assets/img/bg/footer-bg-01.png"
                className="bg-1"
                alt="image"
              />
              <ImageWithBasePath
                src="assets/img/bg/footer-bg-02.png"
                className="bg-2"
                alt="image"
              />
              <ImageWithBasePath
                src="assets/img/bg/footer-bg-03.png"
                className="bg-3"
                alt="image"
              />
            </div>
            <div className="container">
              {/* Footer Top */}
              <div className="footer-top">
                {/* start row */}
                <div className="row gy-4">
                  <div className="col-lg-3 col-md-6">
                    <div className="footer-widget">
                      <h5 className="footer-title">Páginas</h5>
                      <ul className="footer-menu">
                        <li>
                          <Link to={all_routes.ourTeam}>Nuestro Equipo</Link>
                        </li>
                        <li>
                          <Link to={all_routes.pricing}>Planes de Precios</Link>
                        </li>
                        <li>
                          <Link to={all_routes.gallery}>Galería</Link>
                        </li>
                        <li>
                          <Link to="#">Configuración</Link>
                        </li>
                        <li>
                          <Link to="#">Perfil</Link>
                        </li>
                        <li>
                          <Link to={all_routes.buyPropertyList}>Publicaciones</Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                  {/* end col */}
                  <div className="col-lg-3 col-md-6">
                    <div className="footer-widget">
                      <h5 className="footer-title">Empresa</h5>
                      <ul className="footer-menu">
                        <li>
                          <Link to={all_routes.aboutUs}>Sobre Nosotros</Link>
                        </li>
                        <li>
                          <Link to="#">Carreras</Link>
                        </li>
                        <li>
                          <Link to={all_routes.blogGrid}>Blog</Link>
                        </li>
                        <li>
                          <Link to="#">Programa de Afiliados</Link>
                        </li>
                        <li>
                          <Link to="#">Nuestros Socios</Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                  {/* end col */}
                  <div className="col-lg-3 col-md-6">
                    <div className="footer-widget">
                      <h5 className="footer-title">Destinos</h5>
                      <ul className="footer-menu">
                        <li>
                          <Link to="#">Hawai</Link>
                        </li>
                        <li>
                          <Link to="#">Istanbul</Link>
                        </li>
                        <li>
                          <Link to="#">San Diego</Link>
                        </li>
                        <li>
                          <Link to="#">Belgium</Link>
                        </li>
                        <li>
                          <Link to="#">Newyork</Link>
                        </li>
                        <li>
                          <Link to="#">Los Angeles</Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                  {/* end col */}
                  <div className="col-lg-3 col-md-6">
                    <div className="footer-widget">
                      <h5 className="footer-title">Enlaces Útiles</h5>
                      <ul className="footer-menu">
                        <li>
                          <Link to="#">Aviso Legal</Link>
                        </li>
                        <li>
                          <Link to={all_routes.privacyPolicy}>
                            Política de Privacidad
                          </Link>
                        </li>
                        <li>
                          <Link to={all_routes.termsCondition}>
                            Términos y Condiciones
                          </Link>
                        </li>
                        <li>
                          <Link to="#">Soporte</Link>
                        </li>
                        <li>
                          <Link to="#">Política de Reembolso</Link>
                        </li>
                        <li>
                          <Link to={all_routes.contactUs}>Contactanos</Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                  {/* end col */}
                </div>
                {/* end row */}
              </div>
              {/* /Footer Top */}
              <div className="footer-middle">
                {/* start row */}
                <div className="row justify-content-xl-between align-items-center gy-4">
                  <div className="col-xl-4">
                    <div className="social-icon">
                      <Link to="#">
                        <i className="fa-brands fa-facebook" />
                      </Link>
                      <Link to="#">
                        <i className="fa-brands fa-x-twitter" />
                      </Link>
                      <Link to="#">
                        <i className="fa-brands fa-instagram" />
                      </Link>
                      <Link to="#">
                        <i className="fa-brands fa-linkedin" />
                      </Link>
                      <Link to="#">
                        <i className="fa-brands fa-pinterest" />
                      </Link>
                    </div>
                  </div>
                  {/* end col */}
                  <div className="col-xl-7">
                    {/* start row */}
                    <div className="row justify-content-center gy-4">
                      <div className="col-md-4 col-sm-6">
                        <div className="contact-info">
                          <span className="bg-primary">
                            <i className="material-icons-outlined">
                              headphones
                            </i>
                          </span>
                          <div>
                            <p>Customer Soporte</p>
                            <h6>+1 56589 54598</h6>
                          </div>
                        </div>
                      </div>
                      {/* end col */}
                      <div className="col-md-4 col-sm-6">
                        <div className="contact-info">
                          <span className="bg-secondary">
                            <i className="material-icons-outlined">message</i>
                          </span>
                          <div>
                            <p>Drop Us an Email</p>
                            <h6>info@example.com</h6>
                          </div>
                        </div>
                      </div>
                      {/* end col */}
                      <div className="col-md-4 col-sm-6">
                        <div className="contact-info">
                          <span className="bg-danger">
                            <i className="material-icons-outlined">phone</i>
                          </span>
                          <div>
                            <p>Customer Soporte</p>
                            <h6>1800 5656 5458</h6>
                          </div>
                        </div>
                      </div>
                      {/* end col */}
                    </div>
                    {/* end row */}
                  </div>
                  {/* end col */}
                </div>
                {/* end row */}
              </div>
            </div>
            {/* Footer Bottom */}
            <div className="footer-bottom">
              <div className="text-center">
                <p className="copy-right">
                  Copyright &copy; {year}. Todos los derechos reservados, Anabella Luna
                </p>
              </div>
            </div>
            {/* /Footer Bottom */}
          </footer>
          {/* End Footer */}
        </>
      )}
    </>
  );
};

export default Footer;
