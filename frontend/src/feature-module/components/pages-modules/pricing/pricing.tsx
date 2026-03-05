import { Navigate } from "react-router";
import { all_routes } from "../../../routes/all_routes";

const Pricing = () => {
  return <Navigate to={all_routes.index} replace />;
};

export default Pricing;
