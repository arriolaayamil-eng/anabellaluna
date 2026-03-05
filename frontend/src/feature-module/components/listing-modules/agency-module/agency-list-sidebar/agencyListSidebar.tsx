import { Navigate } from "react-router";
import { all_routes } from "../../../../routes/all_routes";

const AgencyListSidebar = () => {
  return <Navigate to={all_routes.agentGrid} replace />;
};

export default AgencyListSidebar;
