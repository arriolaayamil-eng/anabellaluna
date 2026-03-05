import { Link } from "react-router";
import Breadcrumb from "../../../../../core/common/Breadcrumb/breadcrumb";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import { useState, useEffect } from "react";
import publicService from "../../../../../services/publicService";

const AgentGrid = () => {
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await publicService.getAgents();
        if (!isMounted) return;
        setAgents(res.items || []);
      } catch {
        if (!isMounted) return;
        setAgents([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <div className="page-wrapper">
        <Breadcrumb
          title="Nuestro Equipo"
          paths={[{ label: "Nuestro Equipo", active: true }]}
        />
        <div className="content">
          <div className="container">
            {isLoading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            )}

            {!isLoading && agents.length === 0 && (
              <div className="text-center py-5">
                <i className="material-icons-outlined fs-1 text-muted">
                  people_outline
                </i>
                <p className="mt-2 text-muted">
                  No se encontraron agentes.
                </p>
              </div>
            )}

            {!isLoading && agents.length > 0 && (
              <div className="row row-gap-4">
                {agents.map((agent) => {
                  const agentDetailPath = `${all_routes.agentDetails}?id=${agent.id}`;

                  return (
                    <div
                      key={agent.id}
                      className="col-xl-3 col-lg-4 col-md-6"
                    >
                      <div className="card agent-card mb-0">
                        <div className="card-body text-center">
                          <div className="mb-3">
                            {agent.avatarUrl ? (
                              <ImageWithBasePath
                                src={agent.avatarUrl}
                                alt={agent.name}
                                className="avatar avatar-xxl rounded-circle"
                              />
                            ) : (
                              <div
                                className="avatar avatar-xxl rounded-circle bg-light d-inline-flex align-items-center justify-content-center"
                              >
                                <i className="material-icons-outlined text-muted fs-1">
                                  person
                                </i>
                              </div>
                            )}
                          </div>
                          <h6 className="mb-1">
                            <Link to={agentDetailPath}>{agent.name}</Link>
                          </h6>
                          {agent.cargo && (
                            <p className="fs-14 text-muted mb-2">
                              {agent.cargo}
                            </p>
                          )}
                          {agent.especialidad && (
                            <span className="badge bg-secondary mb-2">
                              {agent.especialidad}
                            </span>
                          )}
                          <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
                            <span className="fs-14">
                              <i className="material-icons-outlined text-primary fs-16 align-middle">
                                home
                              </i>{" "}
                              {agent.propertyCount || 0} propiedad
                              {agent.propertyCount !== 1 ? "es" : ""}
                            </span>
                          </div>
                          {(agent.redesSociales?.linkedin ||
                            agent.redesSociales?.instagram ||
                            agent.redesSociales?.facebook) && (
                            <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
                              {agent.redesSociales?.linkedin && (
                                <a
                                  href={agent.redesSociales.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-secondary"
                                >
                                  <i className="fab fa-linkedin-in" />
                                </a>
                              )}
                              {agent.redesSociales?.instagram && (
                                <a
                                  href={agent.redesSociales.instagram}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-secondary"
                                >
                                  <i className="fab fa-instagram" />
                                </a>
                              )}
                              {agent.redesSociales?.facebook && (
                                <a
                                  href={agent.redesSociales.facebook}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-secondary"
                                >
                                  <i className="fab fa-facebook-f" />
                                </a>
                              )}
                            </div>
                          )}
                          <Link
                            to={agentDetailPath}
                            className="btn btn-dark btn-sm w-100"
                          >
                            Ver Perfil
                          </Link>
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

export default AgentGrid;
