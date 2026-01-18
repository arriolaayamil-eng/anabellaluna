
import { Outlet, useLocation } from "react-router-dom";

const AuthFeature = () => {
  const location = useLocation();
  return (
   <div className={`main-wrapper ${['/error-404', '/error-500', '/maintenance', '/coming-soon'].includes(location.pathname) ? '' : ' auth-cover'}`}>
     <Outlet />
   </div>
  );
};

export default AuthFeature;
