import { Link } from "react-router";
import { useState, useEffect } from "react";
import Breadcrumb from "../../../../core/common/Breadcrumb/breadcrumb";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import { all_routes } from "../../../routes/all_routes";
import publicService from "../../../../services/publicService";

const OurTeam = () => {
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const res = await publicService.getAgents();
        if (m) setAgents(res.items || []);
      } catch { /* keep empty */ }
      finally { if (m) setIsLoading(false); }
    })();
    return () => { m = false; };
  }, []);

  return (
    <>
      <div className="page-wrapper">
        <Breadcrumb title="Nuestro Equipo" paths={[{ label: "Nuestro Equipo", active: true }]} />
        <div className="content">
          <div className="container">
            <div className="section-heading text-center mb-4">
              <h2>Nuestro Equipo</h2>
              <div className="sec-line">
                <span className="sec-line1" />
                <span className="sec-line2" />
              </div>
              <p>Profesionales comprometidos con encontrar tu lugar ideal.</p>
            </div>
            {isLoading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            )}
            {!isLoading && agents.length === 0 && (
              <div className="text-center py-5">
                <i className="material-icons-outlined fs-1 text-muted">people_outline</i>
                <p className="mt-2 text-muted">No hay miembros del equipo disponibles.</p>
              </div>
            )}
            {!isLoading && agents.length > 0 && (
              <div className="row row-gap-4">
                {agents.map((agent) => {
                  const detailPath = `${all_routes.agentDetails}?id=${agent.id}`;
                  return (
                    <div key={agent.id} className="col-xl-3 col-lg-4 col-md-6">
                      <div className="card text-center h-100">
                        <div className="card-body">
                          <div className="mb-3">
                            {agent.avatarUrl ? (
                              <ImageWithBasePath src={agent.avatarUrl} alt={agent.name} className="avatar avatar-xxl rounded-circle" />
                            ) : (
                              <div className="avatar avatar-xxl rounded-circle bg-light d-inline-flex align-items-center justify-content-center">
                                <i className="material-icons-outlined text-muted fs-1">person</i>
                              </div>
                            )}
                          </div>
                          <h6 className="mb-1"><Link to={detailPath}>{agent.name}</Link></h6>
                          {agent.cargo && <p className="fs-14 text-muted mb-2">{agent.cargo}</p>}
                          {agent.especialidad && <span className="badge bg-secondary mb-2">{agent.especialidad}</span>}
                          <div className="d-flex justify-content-center gap-2 mt-2">
                            {agent.redesSociales?.linkedin && (
                              <a href={agent.redesSociales.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-outline-dark btn-sm">
                                <i className="fab fa-linkedin-in" />
                              </a>
                            )}
                            {agent.redesSociales?.instagram && (
                              <a href={agent.redesSociales.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-outline-dark btn-sm">
                                <i className="fab fa-instagram" />
                              </a>
                            )}
                            {agent.email && (
                              <a href={`mailto:${agent.email}`} className="btn btn-outline-dark btn-sm">
                                <i className="material-icons-outlined fs-16">email</i>
                              </a>
                            )}
                          </div>
                          <Link to={detailPath} className="btn btn-dark btn-sm w-100 mt-3">Ver Perfil</Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default OurTeam;
