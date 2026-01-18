import Header from "../../core/common/header";
import Footer from "../../core/common/footer";
import { Outlet, useLocation } from "react-router";
import CommonModal from "../../core/common/Common-modal/CommonModal";

const Feature = () => {
  const location = useLocation();

  const isDetailsHeader =
    location.pathname.startsWith("/buy/") ||
    location.pathname.startsWith("/rent/") ||
    location.pathname === "/buy-details-schedule";

  return (
    <>
      <div className="main-wrapper">
        <div
          className={`${
            location.pathname === "/index-2"
              ? "main-header-two"
              : location.pathname === "/index-3"
              ? "main-header-two"
              : isDetailsHeader
              ? "buy-details-header-item"
              : ""
          }`}
        >
          <Header />
        </div>
        <Outlet />
        <Footer />
        <CommonModal/>
      </div>
    </>
  );
};

export default Feature;
