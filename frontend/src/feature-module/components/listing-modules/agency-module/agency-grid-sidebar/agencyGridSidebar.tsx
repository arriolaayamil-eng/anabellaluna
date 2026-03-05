import { Navigate } from "react-router";
import { all_routes } from "../../../../routes/all_routes";

const AgencyGridSidebar = () => {
  return <Navigate to={all_routes.agentGrid} replace />;
};

export default AgencyGridSidebar;
