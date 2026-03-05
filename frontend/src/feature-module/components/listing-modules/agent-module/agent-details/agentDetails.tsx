import { Link, useSearchParams } from "react-router";
import Breadcrumb from "../../../../../core/common/Breadcrumb/breadcrumb";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import { useState, useEffect } from "react";
import publicService from "../../../../../services/publicService";
import type { PropertyCard } from "../../../../../services/publicService";
import PropertyGridCard from "../../common/PropertyGridCard";

const AgentDetails = () => {
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get("id") || "";

  const [agent, setAgent] = useState<any>(null);
  const [properties, setProperties] = useState<PropertyCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!agentId) return;
    let isMounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await publicService.getAgentById(agentId);
        if (!isMounted) return;
        setAgent(res.agent || null);
        setProperties(res.properties || []);
      } catch {
        if (!isMounted) return;
        setAgent(null);
        setProperties([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [agentId]);

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <>
        <div className="page-wrapper">
          <Breadcrumb
            title="Detalle del Agente"
            paths={[{ label: "Detalle del Agente", active: true }]}
          />
          <div className="content">
            <div className="container">
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!agent) {
    return (
      <>
        <div className="page-wrapper">
          <Breadcrumb
            title="Agente no encontrado"
            paths={[{ label: "Agente", active: true }]}
          />
          <div className="content">
            <div className="container">
              <div className="text-center py-5">
                <i className="material-icons-outlined fs-1 text-muted">
                  person_off
                </i>
                <p className="mt-2 text-muted">Agente no encontrado.</p>
                <Link to={all_routes.agentGrid} className="btn btn-dark">
                  Ver todos los agentes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-wrapper">
        <Breadcrumb
          title={agent.name}
          paths={[
            { label: "Equipo", link: all_routes.agentGrid },
            { label: agent.name, active: true },
          ]}
        />
        <div className="content">
          <div className="container">
            <div className="row">
              {/* Agent Profile Sidebar */}
              <div className="col-lg-4">
                <div className="card">
                  <div className="card-body text-center">
                    <div className="mb-3">
                      {agent.avatarUrl ? (
                        <ImageWithBasePath
                          src={agent.avatarUrl}
                          alt={agent.name}
                          className="avatar avatar-xxl rounded-circle"
                        />
                      ) : (
                        <div className="avatar avatar-xxl rounded-circle bg-light d-inline-flex align-items-center justify-content-center">
                          <i className="material-icons-outlined text-muted fs-1">
                            person
                          </i>
                        </div>
                      )}
                    </div>
                    <h5 className="mb-1">{agent.name}</h5>
                    {agent.cargo && (
                      <p className="text-muted mb-2">{agent.cargo}</p>
                    )}
                    {agent.especialidad && (
                      <span className="badge bg-secondary mb-3">
                        {agent.especialidad}
                      </span>
                    )}
                    {agent.bio && (
                      <p className="fs-14 text-start mt-3">{agent.bio}</p>
                    )}
                    <hr />
                    <div className="text-start">
                      {agent.email && (
                        <div className="d-flex align-items-center mb-2">
                          <i className="material-icons-outlined text-primary me-2">
                            email
                          </i>
                          <a href={`mailto:${agent.email}`}>{agent.email}</a>
                        </div>
                      )}
                      {agent.phone && (
                        <div className="d-flex align-items-center mb-2">
                          <i className="material-icons-outlined text-primary me-2">
                            phone
                          </i>
                          <a href={`tel:${agent.phone}`}>{agent.phone}</a>
                        </div>
                      )}
                      <div className="d-flex align-items-center mb-2">
                        <i className="material-icons-outlined text-primary me-2">
                          home
                        </i>
                        <span>
                          {agent.propertyCount || 0} propiedad
                          {agent.propertyCount !== 1 ? "es" : ""}
                        </span>
                      </div>
                    </div>
                    {(agent.redesSociales?.linkedin ||
                      agent.redesSociales?.instagram ||
                      agent.redesSociales?.facebook) && (
                      <>
                        <hr />
                        <div className="d-flex align-items-center justify-content-center gap-2">
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
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Agent Properties */}
              <div className="col-lg-8">
                <h5 className="mb-3">
                  Propiedades de {agent.name} ({properties.length})
                </h5>

                {properties.length === 0 && (
                  <div className="text-center py-5">
                    <i className="material-icons-outlined fs-1 text-muted">
                      home_work
                    </i>
                    <p className="mt-2 text-muted">
                      Este agente no tiene propiedades publicadas.
                    </p>
                  </div>
                )}

                <div className="row">
                  {properties.map((prop) => (
                    <div
                      key={prop.id}
                      className="col-lg-6 col-md-6 d-flex mb-4"
                    >
                      <PropertyGridCard
                        property={prop}
                        isFavorite={favorites.has(prop.id)}
                        onToggleFavorite={() =>
                          handleToggleFavorite(prop.id)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AgentDetails;
