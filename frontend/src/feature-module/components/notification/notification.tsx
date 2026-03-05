import Breadcrumb from "../../../core/common/Breadcrumb/breadcrumb";

const Notification = () => {
  return (
    <>
      <div className="page-wrapper">
        <Breadcrumb
          title="Notificaciones"
          paths={[{ label: "Notificaciones", active: true }]}
        />
        <div className="content">
          <div className="container">
            <div className="row">
              <div className="col-lg-12 mx-auto">
                <div className="notification-header">
                  <div className="notication-title">
                    <h2 className="mb-0">Notificaciones</h2>
                    <p className="mb-0">
                      Acá vas a ver las novedades sobre tus propiedades y reservas.
                    </p>
                  </div>
                </div>
                <div className="text-center py-5">
                  <i
                    className="material-icons-outlined text-muted"
                    style={{ fontSize: 64 }}
                  >
                    notifications_none
                  </i>
                  <p className="mt-3 text-muted">
                    No tenés notificaciones por el momento.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Notification;
