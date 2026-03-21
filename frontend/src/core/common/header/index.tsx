import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { header } from "./headerData";
import { useDispatch, useSelector } from "react-redux";
import ImageWithBasePath from "../../imageWithBasePath";
import { setDataTheme } from "../../redux/themeSettingSlice";
import { all_routes } from "../../../feature-module/routes/all_routes";
import userService from "../../../services/userService";

const Header = () => {
  const [subOpen, setSubopen] = useState<any>("");
  const [subsidebar, setSubsidebar] = useState("");
  const [subsidebar2, setSubsidebar2] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isFixed, setIsFixed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const dataTheme = useSelector((state: any) => state.themeSetting.dataTheme);
  const handleDataThemeChange = (theme: string) => {
    dispatch(setDataTheme(theme));
  };
  const toggleTheme = () => {
    handleDataThemeChange(dataTheme === "light" ? "dark" : "light");
  };
  const onHandleMobileMenu = () => {
    const root = document.getElementsByTagName("html")[0];
    root.classList.add("menu-opened");
  };
  const onhandleCloseMenu = () => {
    const root = document.getElementsByTagName("html")[0];
    root.classList.remove("menu-opened");
  };

  const toggleSidebar = (title: any) => {
    localStorage.setItem("menuOpened", title);
    if (title === subOpen) {
      setSubopen("");
    } else {
      setSubopen(title);
    }
  };
  const toggleSubsidebar = (subitem: any) => {
    if (subitem === subsidebar) {
      setSubsidebar("");
    } else {
      setSubsidebar(subitem);
    }
  };
  const toggleSubsidebar2 = (subitem: any) => {
    if (subitem === subsidebar2) {
      setSubsidebar2("");
    } else {
      setSubsidebar2(subitem);
    }
  };
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsFixed(true);
      } else {
        setIsFixed(false);
      }
    };
    // Listen for scroll on every page
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [location.pathname]);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dataTheme);
  }, [dataTheme]);

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = userService.isAuthenticated();
      setIsLoggedIn(authenticated);
      if (authenticated) {
        setCurrentUser(userService.getCurrentUser());
      } else {
        setCurrentUser(null);
      }
    };
    checkAuth();
    // Re-check on location change (e.g., after login/logout)
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, [location.pathname]);

  const handleLogout = () => {
    userService.logout();
    setIsLoggedIn(false);
    setCurrentUser(null);
    navigate(all_routes.index);
  };

  const getUserDisplayName = () => {
    if (currentUser?.nombre) return currentUser.nombre;
    if (currentUser?.username) return currentUser.username.split('@')[0];
    return 'Usuario';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Header Start */}
      <header className={`header${isFixed ? " fixed" : ""}`}>
        <div className="container-fluid">
          <nav className="navbar navbar-expand-lg header-nav">
            <div className="navbar-header">
              <Link to={all_routes.index} className="navbar-brand logo">
                <ImageWithBasePath
                  src="assets/img/logo.svg"
                  className="img-fluid"
                  alt="Logo"
                />
              </Link>
              <Link to={all_routes.index} className="navbar-brand logo-dark">
                <ImageWithBasePath
                  src="assets/img/logo-white.svg"
                  className="img-fluid"
                  alt="Logo"
                />
              </Link>
              <Link id="mobile_btn" to="#" onClick={() => onHandleMobileMenu()}>
                <i className="material-icons-outlined">menu</i>
              </Link>
            </div>
            <div className="main-menu-wrapper">
              <div className="menu-header">
                <Link to={all_routes.index} className="menu-logo">
                  <ImageWithBasePath
                    src="assets/img/logo.svg"
                    className="img-fluid"
                    alt="Logo"
                  />
                </Link>
                <Link
                  to={all_routes.index}
                  className="menu-logo menu-logo-dark"
                >
                  <ImageWithBasePath
                    src="assets/img/logo-white.svg"
                    className="img-fluid"
                    alt="Logo"
                  />
                </Link>
                <Link
                  id="menu_close"
                  className="menu-close"
                  to="#"
                  onClick={() => onhandleCloseMenu()}
                >
                  <i className="material-icons-outlined">close</i>
                </Link>
              </div>
              <div className="mobile-search">
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Buscar"
                />
              </div>
              <ul className={`main-nav  navbar-nav`}>
                {header.map((mainMenus: any, mainIndex) => (
                  <React.Fragment key={mainIndex}>
                    {(mainMenus.tittle === "Inicio" || mainMenus.directRoute) ? (
                      <li
                        className={
                          location.pathname === all_routes.index ? "active" : ""
                        }
                      >
                        <Link to={mainMenus.directRoute || all_routes.index}>{mainMenus.tittle}</Link>
                      </li>
                    ) : (
                      <li
                        className={`has-submenu ${mainMenus.base === "listings" ? "propiedades-nav" : ""} ${
                          mainMenus?.menu?.some(
                            (item: any) =>
                              item?.route === location.pathname ||
                              item?.subMenus?.some(
                                (subItem: any) =>
                                  subItem?.route === location.pathname
                              )
                          )
                            ? "active"
                            : ""
                        }`}
                      >
                        <Link
                          to="#"
                          onClick={() => toggleSidebar(mainMenus.tittle)}
                        >
                          {mainMenus.tittle}
                          <i className="material-icons-outlined">
                            {mainMenus.icon}
                          </i>
                        </Link>
                        <ul
                          className={`submenu ${
                            subOpen === mainMenus.tittle ? "d-block" : ""
                          }`}
                        >
                          {mainMenus.menu?.map((menu: any, menuIndex: any) => (
                            <React.Fragment key={`${mainIndex}-${menuIndex}`}>
                              {menu.hasSubRoute ? (
                                <li
                                  key={`${mainIndex}-${menuIndex}`}
                                  className={`${
                                    menu.hasSubRoute ? "has-submenu" : ""
                                  } ${
                                    menu?.subMenus?.some(
                                      (item: any) =>
                                        location.pathname === item?.route
                                    )
                                      ? "active"
                                      : ""
                                  }`}
                                >
                                  <Link
                                    to="#"
                                    className={`hideonmob`}
                                    onClick={() => {
                                      toggleSubsidebar(menu.menuValue);
                                    }}
                                  >
                                    {menu.menuValue}
                                  </Link>
                                  <ul
                                    className={`submenu showonmob ${
                                      subsidebar === menu.menuValue
                                        ? "d-block"
                                        : ""
                                    }`}
                                  >
                                    {menu.subMenus?.map(
                                      (subMenu: any, subMenuIndex: any) => (
                                        <React.Fragment
                                          key={`${mainIndex}-${menuIndex}-${subMenuIndex}`}
                                        >
                                          {subMenu.hasSubRoute ? (
                                            <li
                                              className={`${
                                                subMenu?.subMenus?.some(
                                                  (item: any) =>
                                                    location.pathname ===
                                                    item?.route
                                                )
                                                  ? "active"
                                                  : ""
                                              }`}
                                            >
                                              <Link
                                                to="#"
                                                onClick={() => {
                                                  toggleSubsidebar2(
                                                    subMenu.menuValue
                                                  );
                                                }}
                                              >
                                                {subMenu.menuValue}
                                              </Link>
                                              <ul
                                                className={`submenu ${
                                                  subsidebar2 ===
                                                  subMenu.menuValue
                                                    ? "d-block"
                                                    : ""
                                                }`}
                                              >
                                                {subMenu.subMenus?.map(
                                                  (
                                                    menu: any,
                                                    menuIndex2: any
                                                  ) => (
                                                    <li
                                                      key={menuIndex2}
                                                      className={
                                                        location.pathname ===
                                                        menu.route
                                                          ? "active"
                                                          : ""
                                                      }
                                                    >
                                                      <Link to={menu.route}>
                                                        {menu.menuValue}
                                                      </Link>
                                                    </li>
                                                  )
                                                )}
                                              </ul>
                                            </li>
                                          ) : (
                                            <li
                                              className={
                                                location.pathname ===
                                                subMenu.route
                                                  ? "active"
                                                  : ""
                                              }
                                              key={`${mainIndex}-${menuIndex}-${subMenuIndex}`}
                                            >
                                              <Link
                                                to={subMenu.route}
                                                target={`${
                                                  subMenu.admin ? "_blank" : "_self"
                                                }`}
                                              >
                                                {subMenu.menuValue}
                                              </Link>
                                            </li>
                                          )}
                                        </React.Fragment>
                                      )
                                    )}
                                  </ul>
                                </li>
                              ) : (
                                <li
                                  key={`${mainIndex}-${menuIndex}`}
                                  className={
                                    location.pathname === menu.route
                                      ? "active"
                                      : ""
                                  }
                                >
                                  <Link to={menu.route}>{menu.menuValue}</Link>
                                </li>
                              )}
                            </React.Fragment>
                          ))}
                        </ul>
                      </li>
                    )}
                  </React.Fragment>
                ))}
              </ul>
              <div className="menu-dropdown">
                <button
                  type="button"
                  className="btn btn-light w-100 d-flex align-items-center justify-content-center gap-2"
                  onClick={toggleTheme}
                >
                  <i className="material-icons-outlined" style={{ fontSize: 18 }}>
                    {dataTheme === "light" ? "dark_mode" : "wb_sunny"}
                  </i>
                  {dataTheme === "light" ? "Modo Oscuro" : "Modo Claro"}
                </button>
              </div>
              <div className="menu-login">
                {isLoggedIn ? (
                  <>
                    <Link
                      to={all_routes.profile}
                      className="btn btn-primary w-100 mb-2"
                    >
                      <i className="material-icons-outlined me-1">person</i>
                      Mi Perfil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="btn btn-secondary w-100"
                    >
                      <i className="material-icons-outlined me-1">logout</i>
                      Cerrar Sesión
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to={all_routes.signin}
                      className="btn btn-primary w-100 mb-2"
                    >
                      Iniciar Sesión
                    </Link>
                    <Link
                      to={all_routes.signup}
                      className="btn btn-secondary w-100"
                    >
                      Crear Cuenta
                    </Link>
                  </>
                )}
              </div>
            </div>
            {location.pathname === "/index" ||
            location.pathname === "/index-2" ||
            location.pathname === "/index-3" ? (
              <div className="nav header-items">
                <Link
                  to="#"
                  className="topbar-link btn btn-light topbar-search"
                  data-bs-toggle="modal"
                  data-bs-target="#search-modal"
                >
                  <i className="material-icons-outlined">search</i>
                </Link>
                <button
                  type="button"
                  className="topbar-link btn btn-light me-2"
                  onClick={toggleTheme}
                >
                  <i className="material-icons-outlined">
                    {dataTheme === "light" ? "dark_mode" : "wb_sunny"}
                  </i>
                </button>
                {isLoggedIn ? (
                  <>
                    <Link
                      to={all_routes.profile}
                      className="btn btn-lg btn-primary d-inline-flex align-items-center"
                    >
                      <i className="material-icons-outlined me-1">person</i>
                      Mi Perfil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="btn btn-lg btn-dark d-inline-flex align-items-center"
                    >
                      <i className="material-icons-outlined me-1">logout</i>
                      Cerrar Sesión
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to={all_routes.signin}
                      className="btn btn-lg btn-primary d-inline-flex align-items-center"
                    >
                      <i className="material-icons-outlined me-1">lock</i>
                      Iniciar Sesión
                    </Link>
                    <Link
                      to={all_routes.signup}
                      className="btn btn-lg btn-dark d-inline-flex align-items-center"
                    >
                      <i className="material-icons-outlined me-1">perm_identity</i>
                      Crear Cuenta
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <div className="nav header-items">
                <Link
                  to="#"
                  className={`topbar-link btn btn-light topbar-search ${
                    (location.pathname.startsWith("/buy/") ||
                      location.pathname.startsWith("/rent/") ||
                      location.pathname === "/buy-details-schedule")
                      ? "custom-btn-light"
                      : ""
                  }`}
                  data-bs-toggle="modal"
                  data-bs-target="#search-modal"
                >
                  <i className="material-icons-outlined">search</i>
                </Link>
                {/* Selector de idioma eliminado a pedido del usuario */}
                <button
                  type="button"
                  className="topbar-link btn btn-light me-2"
                  onClick={toggleTheme}
                >
                  <i className="material-icons-outlined">
                    {dataTheme === "light" ? "dark_mode" : "wb_sunny"}
                  </i>
                </button>
                <Link
                  to={isLoggedIn ? all_routes.notification : all_routes.signin}
                  className={`topbar-link btn btn-light ${
                    (location.pathname.startsWith("/buy/") ||
                      location.pathname.startsWith("/rent/") ||
                      location.pathname === "/buy-details-schedule")
                      ? "custom-btn-light"
                      : ""
                  }`}
                >
                  <i className="material-icons-outlined animate-ring">
                    notifications_none
                  </i>
                  {isLoggedIn && <span className="badge-icon bg-orange">4</span>}
                </Link>
                {false && (
                <div className="dropdown">
                  <Link
                    to="#"
                    className="topbar-link btn btn-light"
                    data-bs-toggle="dropdown"
                  >
                    <i className="material-icons-outlined animate-ring">
                      notifications_none
                    </i>
                    <span className="badge-icon bg-orange">4</span>
                  </Link>
                  <div
                    className="dropdown-menu p-0 dropdown-menu-end dropdown-menu-lg"
                    style={{ minHeight: 300 }}
                  >
                    <div className="notification-head">
                      <div className="row align-items-center">
                        <div className="col">
                          <h6 className="m-0">Notificaciones</h6>
                        </div>
                        <div className="col-auto">
                          <div className="dropdown">
                            <Link
                              to="#"
                              className="text-body"
                              data-bs-toggle="dropdown"
                              data-bs-offset="0,15"
                              aria-expanded="false"
                            >
                              <i className="material-icons-outlined">
                                settings
                              </i>
                            </Link>
                            <div className="dropdown-menu dropdown-menu-end">
                              {/* item*/}
                              <Link to="#" className="dropdown-item">
                                Marcar como leídas
                              </Link>
                              {/* item*/}
                              <Link to="#" className="dropdown-item">
                                Borrar todo
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Notification Body */}
                    <div
                      className="notification-body position-relative z-2 rounded-0"
                      data-simplebar=""
                    >
                      {/* Item*/}
                      <div
                        className="dropdown-item notification-item text-wrap border-bottom"
                        id="notification-1"
                      >
                        <div className="d-flex">
                          <div className="avatar avatar-md avatar-rounded bg-teal text-white flex-shrink-0">
                            MH
                          </div>
                          <div className="flex-grow-1">
                            <p className="mb-1">
                              <span className="fw-medium text-dark">
                                Maria Hill
                              </span>
                              notifications inform you when someone likes
                            </p>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="fs-13 d-flex align-items-center">
                                <i className="material-icons-outlined text-body fs-13 me-1">
                                  schedule
                                </i>
                                45 mins ago
                              </span>
                              <div className="notification-action d-flex align-items-center float-end gap-2">
                                <Link
                                  to="#"
                                  className="notification-read rounded-circle bg-danger"
                                  data-bs-toggle="tooltip"
                                  title=""
                                  data-bs-original-title="Make as Read"
                                  aria-label="Make as Read"
                                />
                                <button
                                  className="btn rounded-circle p-0"
                                  data-dismissible="#notification-1"
                                >
                                  <i className="material-icons-outlined me-1">
                                    close
                                  </i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Item*/}
                      <div
                        className="dropdown-item notification-item text-wrap border-bottom"
                        id="notification-2"
                      >
                        <div className="d-flex">
                          <div className="avatar avatar-md flex-shrink-0">
                            <ImageWithBasePath
                              src="assets/img/users/user-03.jpg"
                              alt="img"
                              className="img-fluid rounded-circle"
                            />
                          </div>
                          <div className="flex-grow-1">
                            <p className="mb-1">
                              <span className="fw-medium text-dark">
                                Edward Curr
                              </span>
                              notifications alert you to new messages in your
                              estates inbox.
                            </p>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="fs-13 d-flex align-items-center">
                                <i className="material-icons-outlined text-body fs-13 me-1">
                                  schedule
                                </i>
                                17 mins ago
                              </span>
                              <div className="notification-action d-flex align-items-center float-end gap-2">
                                <Link
                                  to="#"
                                  className="notification-read rounded-circle bg-danger"
                                  data-bs-toggle="tooltip"
                                  title=""
                                  data-bs-original-title="Make as Read"
                                  aria-label="Make as Read"
                                />
                                <button
                                  className="btn rounded-circle p-0"
                                  data-dismissible="#notification-2"
                                >
                                  <i className="material-icons-outlined me-1">
                                    close
                                  </i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Item*/}
                      <div
                        className="dropdown-item notification-item text-wrap border-bottom"
                        id="notification-3"
                      >
                        <div className="d-flex">
                          <div className="avatar avatar-md flex-shrink-0">
                            <ImageWithBasePath
                              src="assets/img/users/user-06.jpg"
                              alt="img"
                              className="img-fluid rounded-circle"
                            />
                          </div>
                          <div className="flex-grow-1">
                            <p className="mb-1">
                              <span className="fw-medium text-dark">
                                Alex Carter
                              </span>
                              added a comment to Alex Carter
                              <span className="fw-medium text-dark">
                                “Oh, I finished de-bugging the phones”
                              </span>
                            </p>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="fs-13 d-flex align-items-center">
                                <i className="material-icons-outlined text-body fs-13 me-1">
                                  schedule
                                </i>
                                1 Day Ago
                              </span>
                              <div className="notification-action d-flex align-items-center float-end gap-2">
                                <Link
                                  to="#"
                                  className="notification-read rounded-circle bg-danger"
                                  data-bs-toggle="tooltip"
                                  title=""
                                  data-bs-original-title="Make as Read"
                                  aria-label="Make as Read"
                                />
                                <button
                                  className="btn rounded-circle p-0"
                                  data-dismissible="#notification-3"
                                >
                                  <i className="material-icons-outlined me-1">
                                    close
                                  </i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Item*/}
                      <div
                        className="dropdown-item notification-item text-wrap border-bottom"
                        id="notification-4"
                      >
                        <div className="d-flex">
                          <div className="avatar avatar-md avatar-rounded bg-teal text-white flex-shrink-0">
                            AN
                          </div>
                          <div className="flex-grow-1">
                            <p className="mb-1">
                              <span className="fw-medium text-dark">
                                Annie Nirain
                              </span>
                              payment attempt failed. Please verify your details
                              and try again.
                            </p>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="fs-13 d-flex align-items-center">
                                <i className="material-icons-outlined text-body fs-13 me-1">
                                  schedule
                                </i>
                                45 mins ago
                              </span>
                              <div className="notification-action d-flex align-items-center float-end gap-2">
                                <Link
                                  to="#"
                                  className="notification-read rounded-circle bg-danger"
                                  data-bs-toggle="tooltip"
                                  title=""
                                  data-bs-original-title="Make as Read"
                                  aria-label="Make as Read"
                                />
                                <button
                                  className="btn rounded-circle text-danger p-0"
                                  data-dismissible="#notification-4"
                                >
                                  <i className="material-icons-outlined me-1">
                                    close
                                  </i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* View All*/}
                    <div className="notification-footer text-center">
                      <Link
                        to={all_routes.notification}
                        className="text-center mb-0"
                      >
                        Ver todas
                      </Link>
                    </div>
                  </div>
                </div>
                )}
                <Link
                  to={all_routes.cart}
                  className={`topbar-link btn btn-light topbar-cart ${
                    (location.pathname.startsWith("/buy/") ||
                      location.pathname.startsWith("/rent/") ||
                      location.pathname === "/buy-details-schedule")
                      ? "custom-btn-light"
                      : ""
                  }`}
                >
                  <i className="material-icons-outlined">shopping_cart</i>
                </Link>
                {isLoggedIn ? (
                  <div className="dropdown topbar-profile d-flex">
                    <Link to="#" className="avatar" data-bs-toggle="dropdown">
                      {currentUser?.avatar ? (
                        <img
                          src={currentUser.avatar}
                          alt="img"
                          className="img-fluid rounded-circle"
                          style={{ width: 40, height: 40, objectFit: 'cover' }}
                        />
                      ) : (
                        <div 
                          className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white"
                          style={{ width: 40, height: 40, fontSize: 14, fontWeight: 600 }}
                        >
                          {getUserInitials()}
                        </div>
                      )}
                    </Link>
                    <div className="dropdown-menu dropdown-menu-end">
                      <div className="d-flex align-items-center user-profile">
                        {currentUser?.avatar ? (
                          <img
                            src={currentUser.avatar}
                            className="rounded-circle"
                            width={42}
                            height={42}
                            style={{ objectFit: 'cover' }}
                            alt="image"
                          />
                        ) : (
                          <div 
                            className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white"
                            style={{ width: 42, height: 42, fontSize: 14, fontWeight: 600 }}
                          >
                            {getUserInitials()}
                          </div>
                        )}
                        <div className="ms-2">
                          <h6 className="mb-1">{getUserDisplayName()}</h6>
                          <span className="d-block">{currentUser?.email || ''}</span>
                        </div>
                      </div>
                      <Link
                        to={all_routes.profile}
                        className="dropdown-item d-inline-flex align-items-center"
                      >
                        <i className="material-icons-outlined me-2">
                          person_outline
                        </i>
                        Mi Perfil
                      </Link>
                      <Link
                        to={all_routes.wishlist}
                        className="dropdown-item d-inline-flex align-items-center"
                      >
                        <i className="material-icons-outlined me-2">
                          favorite_border
                        </i>
                        Mis Favoritos
                      </Link>
                      <Link
                        to={all_routes.notification}
                        className="dropdown-item d-inline-flex align-items-center"
                      >
                        <i className="material-icons-outlined me-2">
                          notifications_none
                        </i>
                        Notificaciones
                      </Link>
                      <hr className="dropdown-divider" />
                      <button
                        onClick={handleLogout}
                        className="dropdown-item d-inline-flex align-items-center link-danger"
                      >
                        <i className="material-icons-outlined me-2">logout</i>
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Link
                      to={all_routes.signin}
                      className="btn btn-lg btn-primary d-inline-flex align-items-center"
                    >
                      <i className="material-icons-outlined me-1">lock</i>
                      Iniciar Sesión
                    </Link>
                    <Link
                      to={all_routes.signup}
                      className="btn btn-lg btn-dark d-inline-flex align-items-center"
                    >
                      <i className="material-icons-outlined me-1">perm_identity</i>
                      Crear Cuenta
                    </Link>
                  </>
                )}
              </div>
            )}
          </nav>
        </div>
      </header>
      {/* Header End */}
    </>
  );
};

export default Header;
