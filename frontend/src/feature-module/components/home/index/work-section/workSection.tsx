import ImageWithBasePath from "../../../../../core/imageWithBasePath";

const WorkSection = () => {
  return (
    <>
      {/* start how it works section */}
      <section className="how-work-section section-padding">
        <div className="container">
          {/* start title */}
          <div
            className="section-heading aos"
            data-aos="fade-down"
            data-aos-duration={1000}
          >
            <h2 className="mb-2 text-center">Cómo Funciona</h2>
            <div className="sec-line">
              <span className="sec-line1" />
              <span className="sec-line2" />
            </div>
            <p className="mb-0 text-center">Encuentra tu propiedad ideal en tres simples pasos</p>
          </div>
          {/* end title */}
          {/* start row */}
          <div className="row">
            <div
              className="col-md-6 col-lg-4 d-flex aos"
              data-aos="fade-up"
              data-aos-duration={500}
            >
              <div
                className="howit-work-item text-center aos-init aos-animate flex-fill"
                data-aos="fade-down"
                data-aos-duration={1200}
                data-aos-delay={100}
              >
                <div className="mb-3 bg-secondary avatar avatar-md rounded-circle p-2">
                  <ImageWithBasePath
                    src="assets/img/home/icons/work-icon-1.svg"
                    alt="icon"
                  />
                </div>
                <h5 className="mb-3">Buscar Propiedad</h5>
                <p className="mb-0">Explora nuestra amplia selección de propiedades disponibles con filtros avanzados</p>
              </div>
            </div>
            {/* end col */}
            <div
              className="col-md-6 col-lg-4 d-flex aos"
              data-aos="fade-down"
              data-aos-duration={1000}
            >
              <div
                className="howit-work-item text-center aos-init aos-animate flex-fill"
                data-aos="fade-down"
                data-aos-duration={1200}
                data-aos-delay={100}
              >
                <div className="mb-3 bg-danger avatar avatar-md rounded-circle p-2">
                  <ImageWithBasePath
                    src="assets/img/home/icons/work-icon-2.svg"
                    alt="icon"
                  />
                </div>
                <h5 className="mb-3">Seleccionar Favoritos</h5>
                <p className="mb-0">Guarda tus propiedades preferidas y compara características para tomar la mejor decisión</p>
              </div>
            </div>
            {/* end col */}
            <div
              className="col-md-6 col-lg-4 d-flex mx-md-auto mx-lg-0 aos"
              data-aos="fade-up"
              data-aos-duration={500}
            >
              <div
                className="howit-work-item text-center aos-init aos-animate flex-fill"
                data-aos="fade-down"
                data-aos-duration={1200}
                data-aos-delay={100}
              >
                <div className="mb-3 bg-success avatar avatar-md rounded-circle p-2">
                  <ImageWithBasePath
                    src="assets/img/home/icons/work-icon-3.svg"
                    alt="icon"
                  />
                </div>
                <h5 className="mb-3">Reservar Visita</h5>
                <p className="mb-0">Agenda una visita con nuestros agentes y descubre tu futuro hogar</p>
              </div>
            </div>
            {/* end col */}
          </div>
          {/* end row */}
        </div>
      </section>
      {/* end how it works section */}
    </>
  );
};

export default WorkSection;
