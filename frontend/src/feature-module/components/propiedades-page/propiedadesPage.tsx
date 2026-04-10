import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { all_routes } from "../../routes/all_routes";

const PropiedadesPage = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(all_routes.buyPropertyGridSidebar, { replace: true });
  }, [navigate]);
  return null;
};

export default PropiedadesPage;
