import { Link } from "react-router";
import Breadcrumb from "../../../../../core/common/Breadcrumb/breadcrumb";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import { useState, useEffect } from "react";
import publicService from "../../../../../services/publicService";

const AgentGridSidebar = () => {
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        setIsLoading(true);
        const res = await publicService.getAgents();
        if (m) setAgents(res.items || []);
      } catch {
        if (m) setAgents([]);
      } finally {
        if (m) setIsLoading(false);
      }
    })();
    return () => { m = false; };
  }, []);

  return (
    <>
      <div className="page-wrapper">
        <Breadcrumb title="Nuestro Equipo" paths={[{ label: "Nuestro Equipo", active: true }]} />
        <div className="content">
          <div className="container">
            <div className="row align-items-center mb-4">
              <div className="col-lg-6">
                <p className="mb-0">
                  Mostrando <span className="result-value">{agents.length}</span> agente{agents.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="col-lg-6">
                <ul className="grid-list-view d-flex align-items-center justify-content-lg-end gap-2">
                  <li>
                    <Link to={all_routes.agentGrid} className="list-icon active">
                      <i className="material-icons">grid_view</i>
                    </Link>
                  </li>
                </ul>
              </div>
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
                <p className="mt-2 text-muted">No se encontraron agentes.</p>
              </div>
            )}
            {!isLoading && agents.length > 0 && (
              <div className="row row-gap-4">
                {agents.map((agent) => {
                  const agentDetailPath = `${all_routes.agentDetails}?id=${agent.id}`;
                  return (
                    <div key={agent.id} className="col-xl-3 col-lg-4 col-md-6">
                      <div className="card agent-card mb-0">
                        <div className="card-body text-center">
                          <div className="mb-3">
                            {agent.avatarUrl ? (
                              <ImageWithBasePath src={agent.avatarUrl} alt={agent.name} className="avatar avatar-xxl rounded-circle" />
                            ) : (
                              <div className="avatar avatar-xxl rounded-circle bg-light d-inline-flex align-items-center justify-content-center">
                                <i className="material-icons-outlined text-muted fs-1">person</i>
                              </div>
                            )}
                          </div>
                          <h6 className="mb-1"><Link to={agentDetailPath}>{agent.name}</Link></h6>
                          {agent.cargo && <p className="fs-14 text-muted mb-2">{agent.cargo}</p>}
                          {agent.especialidad && <span className="badge bg-secondary mb-2">{agent.especialidad}</span>}
                          <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
                            <span className="fs-14">
                              <i className="material-icons-outlined text-primary fs-16 align-middle">home</i>{" "}
                              {agent.propertyCount || 0} propiedad{agent.propertyCount !== 1 ? "es" : ""}
                            </span>
                          </div>
                          <Link to={agentDetailPath} className="btn btn-dark btn-sm w-100">Ver Perfil</Link>
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

export default AgentGridSidebar;
