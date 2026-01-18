import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router";
import { all_routes } from "../../feature-module/routes/all_routes";
import userService from "../../services/userService";

const RequireAuth = ({ children }: PropsWithChildren) => {
  const location = useLocation();
  if (!userService.isAuthenticated()) {
    return (
      <Navigate
        to={all_routes.signin}
        replace
        state={{ from: { pathname: location.pathname, search: location.search, hash: location.hash } }}
      />
    );
  }

  return <>{children}</>;
};

export default RequireAuth;
