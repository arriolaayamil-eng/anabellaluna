import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import publicService from "../../../services/publicService";

const PropiedadRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || undefined;
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate("/", { replace: true });
      return;
    }

    publicService
      .getPropertyBySlug(id, token)
      .then((res) => {
        const item = res.item;
        if (!item) {
          navigate("/", { replace: true });
          return;
        }
        const slug = item.slug || id;
        const tokenQs = token ? `?token=${encodeURIComponent(token)}` : "";
        if (item.operation === "rent") {
          navigate(`/rent/${slug}${tokenQs}`, { replace: true });
        } else {
          navigate(`/buy/${slug}${tokenQs}`, { replace: true });
        }
      })
      .catch(() => {
        setError(true);
      });
  }, [id, token, navigate]);

  if (error) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="container text-center py-5">
            <h4>No se encontró la propiedad o el link ya no es válido.</h4>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="container text-center py-5">
          <p>Cargando propiedad...</p>
        </div>
      </div>
    </div>
  );
};

export default PropiedadRedirect;
