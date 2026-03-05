import Breadcrumb from "../../../../core/common/Breadcrumb/breadcrumb";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import { useState, useEffect } from "react";
import publicService from "../../../../services/publicService";

const formatCount = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K+`;
  return `${n}+`;
};

const AboutUs = () => {
  const [stats, setStats] = useState({ properties: 0, agents: 0, sales: 0, rentals: 0 });

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const res = await publicService.getStats();
        if (m) setStats(res);
      } catch { /* keep defaults */ }
    })();
    return () => { m = false; };
  }, []);

  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Breadscrumb */}
        <Breadcrumb
          title="Sobre Nosotros"
          paths={[{ label: "Sobre Nosotros", active: true }]}
        />
        {/* End Breadscrumb */}
        <div className="about-us-item-06">
          <div className="container">
            {/* start row */}
            <div className="row">
              <div className="col-lg-12 mx-auto">
                <div className="about-us-item-01">
                  <h2>Conectamos Espacios con Personas</h2>
                  <p className="mb-0">
                    Bajo el liderazgo de Anabella Luna, trascendemos las simples transacciones inmobiliarias—creamos conexiones significativas. "Conectamos Espacios con Personas" representa nuestra misión de puentear la brecha entre los lugares y quienes les dan vida. Ya sea que busques tu hogar soñado, un espacio comercial, o una inversión inmobiliaria, nuestra plataforma facilita encontrar la opción perfecta. Con listados confiables, el soporte experto de Anabella Luna y tecnología de vanguardia, ayudamos a convertir estructuras en historias, y edificios en pertenencia.
                  </p>
                </div>
                {/* start row */}
                <div className="row row-gap-4 about-us-img-wrap">
                  <div className="col-md-4 col-lg-4">
                    <ImageWithBasePath
                      src="assets/img/about-us/about-us-01.jpg"
                      alt="img"
                      className="img-fluid rounded"
                    />
                  </div>
                  {/* end col */}
                  <div className="col-md-4 col-lg-4">
                    <ImageWithBasePath
                      src="assets/img/about-us/about-us-02.jpg"
                      alt="img"
                      className="img-fluid rounded"
                    />
                  </div>
                  {/* end col */}
                  <div className="col-md-4 col-lg-4">
                    <ImageWithBasePath
                      src="assets/img/about-us/about-us-03.jpg"
                      alt="img"
                      className="img-fluid rounded"
                    />
                  </div>
                  {/* end col */}
                </div>
                {/* end row */}
                {/* start row */}
                <div className="row row-gap-4">
                  <div className="col-md-6 col-lg-3">
                    <div className="about-us-item-02">
                      <div className="d-flex align-items-center">
                        <ImageWithBasePath
                          src="assets/img/about-us/listing.svg"
                          alt="image"
                          className="img-fluid me-3"
                        />
                        <div>
                          <h4 className="mb-1">{formatCount(stats.properties)}</h4>
                          <p className="mb-0">Publicaciones Agregadas</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* end col */}
                  <div className="col-md-6 col-lg-3">
                    <div className="about-us-item-02">
                      <div className="d-flex align-items-center">
                        <ImageWithBasePath
                          src="assets/img/about-us/agents.svg"
                          alt="image"
                          className="img-fluid me-3"
                        />
                        <div>
                          <h4 className="mb-1">{formatCount(stats.agents)}</h4>
                          <p className="mb-0">Agentes Publicados</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* end col */}
                  <div className="col-md-6 col-lg-3">
                    <div className="about-us-item-02">
                      <div className="d-flex align-items-center">
                        <ImageWithBasePath
                          src="assets/img/about-us/sales.svg"
                          alt="image"
                          className="img-fluid me-3"
                        />
                        <div>
                          <h4 className="mb-1">{formatCount(stats.sales)}</h4>
                          <p className="mb-0">En Venta</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* end col */}
                  <div className="col-md-6 col-lg-3">
                    <div className="about-us-item-02">
                      <div className="d-flex align-items-center">
                        <ImageWithBasePath
                          src="assets/img/about-us/users.svg"
                          alt="image"
                          className="img-fluid me-3"
                        />
                        <div>
                          <h4 className="mb-1">{formatCount(stats.rentals)}</h4>
                          <p className="mb-0">En Alquiler</p>
                        </div>
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
        <div className="about-us-item-03">
          <ImageWithBasePath
            src="assets/img/bg/about-us-bg-01.png"
            alt="image"
            className="img-fluid about-us-bg-01 d-none d-lg-flex"
          />
          <ImageWithBasePath
            src="assets/img/bg/about-us-bg-02.png"
            alt="image"
            className="img-fluid about-us-bg-02 d-none d-lg-flex"
          />
          <div className="container">
            {/* start row */}
            <div className="row align-items-center row-gap-4 position-relative z-2">
              <div className="col-xl-5">
                <div className="me-3">
                  <h2 className="mb-4">¿Listo para Reservar un Lugar?</h2>
                  <ImageWithBasePath
                    src="assets/img/about-us/about-us-04.jpg"
                    alt="image"
                    className="img-fluid rounded w-100"
                  />
                </div>
              </div>
              {/* end col */}
              <div className="col-xl-7">
                <h5 className="mb-4">
                  Descubrí tu propiedad soñada y asegurá tu espacio ideal
                  sin esfuerzo con nuestro proceso de reserva rápido, sencillo y sin complicaciones.
                </h5>
                <p>
                  Explorá una amplia gama de propiedades verificadas adaptadas
                  a tu estilo de vida y presupuesto. Ya sea que busques un
                  lujoso departamento en la ciudad o un acogedor hogar familiar en los suburbios,
                  nuestra plataforma ofrece una experiencia de reserva confiable y sin interrupciones.
                  Beneficiate con transacciones seguras y confirmaciones instantáneas.
                  Con nuestra plataforma, Anabella Luna y su equipo hacen fácil encontrar y asegurar tu
                  espacio perfecto.
                </p>
                <p className="mb-0">
                  Con nuestra plataforma, accedés a propiedades premium y
                  una plataforma amigable diseñada para tu comodidad. Las opciones de filtro
                  ayudan a acotar tu búsqueda por ubicación, precio y
                  comodidades. Mantenete informado con actualizaciones en tiempo real y
                  notificaciones. Ya sea alquilando o comprando, experimentá
                  confianza y facilidad durante todo tu recorrido de reserva de propiedades
                  con nosotros.
                </p>
              </div>
              {/* end col */}
            </div>
            {/* end row */}
          </div>
        </div>
        <div className="about-us-item-04">
          <div className="container">
            {/* start row */}
            <div className="row">
              <div className="col-lg-11 mx-auto">
                <div className="text-center about-us-item-05">
                  <h2 className="mb-3">
                    Cientos de Socios en Todo el Mundo
                  </h2>
                  <p className="mb-0">
                    Cada día, construimos confianza a través de la comunicación,
                    transparencia y resultados bajo la dirección de Anabella Luna.
                  </p>
                </div>
                {/* start row */}
                <div className="row align-items-center row-gap-4">
                  <div className="col-4 col-md-4 col-lg-2 d-flex">
                    <div className="card border-0 bg-light shadow-none flex-fill mb-0">
                      <div className="card-body text-center">
                        <ImageWithBasePath
                          src="assets/img/about-us/livechat.svg"
                          alt="image"
                          className="img-fluid"
                        />
                      </div>
                    </div>
                  </div>
                  {/* end col */}
                  <div className="col-4 col-md-4 col-lg-2 d-flex">
                    <div className="card border-0 bg-light shadow-none flex-fill mb-0">
                      <div className="card-body text-center">
                        <ImageWithBasePath
                          src="assets/img/about-us/headspace.svg"
                          alt="image"
                          className="img-fluid"
                        />
                      </div>
                    </div>
                  </div>
                  {/* end col */}
                  <div className="col-4 col-md-4 col-lg-2 d-flex">
                    <div className="card border-0 bg-light shadow-none flex-fill mb-0">
                      <div className="card-body text-center">
                        <ImageWithBasePath
                          src="assets/img/about-us/payehere.svg"
                          alt="image"
                          className="img-fluid"
                        />
                      </div>
                    </div>
                  </div>
                  {/* end col */}
                  <div className="col-4 col-md-4 col-lg-2 d-flex">
                    <div className="card border-0 bg-light shadow-none flex-fill mb-0">
                      <div className="card-body text-center">
                        <ImageWithBasePath
                          src="assets/img/about-us/scapic.svg"
                          alt="image"
                          className="img-fluid"
                        />
                      </div>
                    </div>
                  </div>
                  {/* end col */}
                  <div className="col-4 col-md-4 col-lg-2 d-flex">
                    <div className="card border-0 bg-light shadow-none flex-fill mb-0">
                      <div className="card-body text-center">
                        <ImageWithBasePath
                          src="assets/img/about-us/livechat.svg"
                          alt="image"
                          className="img-fluid"
                        />
                      </div>
                    </div>
                  </div>
                  {/* end col */}
                  <div className="col-4 col-md-4 col-lg-2 d-flex">
                    <div className="card border-0 bg-light shadow-none flex-fill mb-0">
                      <div className="card-body text-center">
                        <ImageWithBasePath
                          src="assets/img/about-us/memberstack.svg"
                          alt="image"
                          className="img-fluid"
                        />
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
      </div>
      {/* ========================
			End Page Content
		========================= */}
    </>
  );
};

export default AboutUs;
