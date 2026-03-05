import { Link } from "react-router";
import Breadcrumb from "../../../../../core/common/Breadcrumb/breadcrumb";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import { useState, useEffect } from "react";
import publicService from "../../../../../services/publicService";

const AgentListSidebar = () => {
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
                    <Link to={all_routes.agentGrid} className="list-icon">
                      <i className="material-icons">grid_view</i>
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="list-icon active">
                      <i className="material-icons">list</i>
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
            {!isLoading && agents.map((agent) => {
              const agentDetailPath = `${all_routes.agentDetails}?id=${agent.id}`;
              return (
                <div key={agent.id} className="card mb-3">
                  <div className="card-body">
                    <div className="row align-items-center">
                      <div className="col-lg-2 text-center">
                        {agent.avatarUrl ? (
                          <ImageWithBasePath src={agent.avatarUrl} alt={agent.name} className="avatar avatar-xl rounded-circle" />
                        ) : (
                          <div className="avatar avatar-xl rounded-circle bg-light d-inline-flex align-items-center justify-content-center">
                            <i className="material-icons-outlined text-muted fs-1">person</i>
                          </div>
                        )}
                      </div>
                      <div className="col-lg-7">
                        <h6 className="mb-1"><Link to={agentDetailPath}>{agent.name}</Link></h6>
                        {agent.cargo && <p className="fs-14 text-muted mb-1">{agent.cargo}</p>}
                        {agent.especialidad && <span className="badge bg-secondary me-2">{agent.especialidad}</span>}
                        <span className="fs-14">
                          <i className="material-icons-outlined text-primary fs-16 align-middle">home</i>{" "}
                          {agent.propertyCount || 0} propiedad{agent.propertyCount !== 1 ? "es" : ""}
                        </span>
                        {agent.bio && <p className="fs-14 text-muted mt-2 mb-0">{agent.bio.slice(0, 150)}{agent.bio.length > 150 ? "..." : ""}</p>}
                      </div>
                      <div className="col-lg-3 text-lg-end mt-3 mt-lg-0">
                        {agent.phone && (
                          <a href={`tel:${agent.phone}`} className="btn btn-outline-dark btn-sm me-2 mb-2">
                            <i className="material-icons-outlined fs-16 align-middle">phone</i>
                          </a>
                        )}
                        {agent.email && (
                          <a href={`mailto:${agent.email}`} className="btn btn-outline-dark btn-sm me-2 mb-2">
                            <i className="material-icons-outlined fs-16 align-middle">email</i>
                          </a>
                        )}
                        <Link to={agentDetailPath} className="btn btn-dark btn-sm mb-2">Ver Perfil</Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default AgentListSidebar;
