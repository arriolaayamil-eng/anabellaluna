import { Navigate } from "react-router";
import { all_routes } from "../../../../routes/all_routes";

const RentGridSidebar = () => (
  <Navigate to={`${all_routes.buyPropertyGridSidebar}?op=rent`} replace />
);

export default RentGridSidebar;
