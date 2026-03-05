import { Navigate } from "react-router";
import { all_routes } from "../../../../routes/all_routes";

const AgencyDetails = () => {
  return <Navigate to={all_routes.agentGrid} replace />;
};

export default AgencyDetails;
