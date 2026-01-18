import { Link, useLocation, useNavigate } from "react-router";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import { all_routes } from "../../../routes/all_routes";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import userService from "../../../../services/userService";
type PasswordField = "password" | "confirmPassword";

const SignIn = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirmPassword: false,
  });

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePasswordVisibility = (field: PasswordField) => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await userService.login(username, password);
      const from = (location.state as any)?.from;
      const pathname = from?.pathname || all_routes.index;
      const search = from?.search || "";
      const hash = from?.hash || "";
      navigate(`${pathname}${search}${hash}`, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Error");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <>
      {/* Start Content */}
      <div className="container-fuild position-relative z-1">
        <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100 sign-">
          {/* start row */}
          <div className="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap py-3">
            <div className="col-md-8 col-lg-6 col-xl-4 mx-auto">
              <form
                className="d-flex justify-content-center align-items-center"
                onSubmit={onSubmit}
              >
                <div className="d-flex flex-column justify-content-lg-center p-4 p-lg-0 pb-0 flex-fill">
                  <div className=" mx-auto mb-4 text-center">
                    <ImageWithBasePath
                      src="assets/img/logo.svg"
                      className="img-fluid"
                      alt="Logo"
                    />
                  </div>
                  <div>
                    <div className="login-item-01">
                      <h4>{t("Hey There! Welcome Back")}</h4>
                      <div>
                        {error ? (
                          <div className="alert alert-danger" role="alert">
                            {error}
                          </div>
                        ) : null}
                        <div className="mb-3">
                          <label className="form-label">
                            {t("Email")}<span className="text-danger ms-1">*</span>
                          </label>
                          <div className="form-cover">
                            <input
                              type="text"
                              className="form-control"
                              placeholder={t("Enter your email")}
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                            />
                            <i className="material-icons-outlined">mail</i>
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">
                            {t("Password")}<span className="text-danger ms-1">*</span>
                          </label>
                          <div className="position-relative form-cover password">
                            <input
                              type={
                                passwordVisibility.password
                                  ? "text"
                                  : "password"
                              }
                              className="pass-input form-control"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                            />
                            <i className="material-icons-outlined">lock</i>
                            <span
                              className={`fas toggle-password text-dark fs-12 ${
                                passwordVisibility.password
                                  ? "fa-eye"
                                  : "fa-eye-slash"
                              }`}
                              onClick={() =>
                                togglePasswordVisibility("password")
                              }
                            ></span>
                          </div>
                        </div>
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
                          <div className="d-flex align-items-center">
                            <div className="form-check form-check-md mb-0">
                              <input
                                className="form-check-input"
                                id="remember_me"
                                type="checkbox"
                              />
                              <label htmlFor="remember_me" className="mt-0">
                                {t("Remember Me")}
                              </label>
                            </div>
                          </div>
                          <div className="text-end">
                            <Link
                              to={all_routes.forgotPassword}
                              className="text-danger"
                            >
                              {t("Forgot Password?")}
                            </Link>
                          </div>
                        </div>
                        <div className="mb-3">
                          <button
                            type="submit"
                            className="btn btn-lg bg-primary text-white w-100"
                            disabled={isSubmitting}
                          >
                            {t("Sign In")}
                          </button>
                        </div>
                        <div className="login-or mb-3">
                          <span className="span-or">{t("OR")}</span>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex align-items-center justify-content-center flex-wrap">
                            <div className="text-center me-2 flex-fill">
                              <Link
                                to="#"
                                className="br-10 p-1 btn btn-outline-light border d-flex align-items-center justify-content-center"
                              >
                                <ImageWithBasePath
                                  className="img-fluid m-1 me-1"
                                  src="assets/img/icons/facebook.svg"
                                  alt="Facebook"
                                />
                                {t("Facebook")}
                              </Link>
                            </div>
                            <div className="text-center me-2 flex-fill">
                              <Link
                                to="#"
                                className="br-10 p-1 btn btn-outline-light border d-flex align-items-center justify-content-center"
                              >
                                <ImageWithBasePath
                                  className="img-fluid m-1 me-1"
                                  src="assets/img/icons/google.svg"
                                  alt="Google"
                                />
                                {t("Google")}
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <h6 className="fw-normal fs-14 text-dark mb-0">
                            {t("Don’t have an account yet?")}
                            <Link
                              to={all_routes.signup}
                              className="register-btn"
                              state={location.state as any}
                            >
                              {" "}
                              {t("Register")}
                            </Link>
                          </h6>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            {/* end col */}
          </div>
          {/* end row */}
        </div>
      </div>
      {/* End Content */}
    </>
  );
};

export default SignIn;
