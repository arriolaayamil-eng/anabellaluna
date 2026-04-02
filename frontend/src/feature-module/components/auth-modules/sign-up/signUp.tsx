import { useCallback, useState } from "react";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import { all_routes } from "../../../routes/all_routes";
import { Link, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import userService from "../../../../services/userService";
import { useSocialLogin } from "../../../../hooks/useSocialLogin";
type PasswordField = "password" | "confirmPassword";

const SignUp = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirmPassword: false,
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectAfterLogin = useCallback(() => {
    const from = (location.state as any)?.from;
    const pathname = from?.pathname || all_routes.index;
    const search = from?.search || "";
    const hash = from?.hash || "";
    navigate(`${pathname}${search}${hash}`, { replace: true });
  }, [location.state, navigate]);

  const { config, socialError, socialLoading, googleBtnRef, handleFacebookLogin } =
    useSocialLogin(redirectAfterLogin);

  const togglePasswordVisibility = (field: PasswordField) => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("El nombre es requerido");
      return;
    }
    if (!email.trim()) {
      setError("El email es requerido");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setIsSubmitting(true);
    try {
      await userService.registerPublic({ username: email, password, nombre: name });
      redirectAfterLogin();
    } catch (err: any) {
      setError(err?.message || "Error al registrar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = error || socialError;

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
                      <h4>{t("Sign Up! For New Account")}</h4>
                      <div>
                        {displayError ? (
                          <div className="alert alert-danger" role="alert">
                            {displayError}
                          </div>
                        ) : null}
                        <div className="mb-3">
                          <label className="form-label">
                            {t("Name")}<span className="text-danger ms-1">*</span>
                          </label>
                          <div className="form-cover">
                            <input
                              type="text"
                              className="form-control"
                              placeholder={t("Enter Name")}
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                            />
                            <i className="material-icons-outlined">person</i>
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">
                            {t("Email")}<span className="text-danger ms-1">*</span>
                          </label>
                          <div className="form-cover">
                            <input
                              type="email"
                              className="form-control"
                              placeholder={t("Enter your email")}
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
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
                        <div className="mb-3">
                          <label className="form-label">
                            {t("Confirm Password")}
                            <span className="text-danger ms-1">*</span>
                          </label>
                          <div className="position-relative form-cover password">
                            <input
                              type={
                                passwordVisibility.confirmPassword
                                  ? "text"
                                  : "Password"
                              }
                              className="pass-input form-control"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <i className="material-icons-outlined">lock</i>
                            <span
                              className={`fas toggle-password text-dark fs-12 ${
                                passwordVisibility.confirmPassword
                                  ? "fa-eye"
                                  : "fa-eye-slash"
                              }`}
                              onClick={() =>
                                togglePasswordVisibility("confirmPassword")
                              }
                            ></span>
                          </div>
                        </div>
                        <div className="d-flex align-items-center mb-4">
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
                        </div>
                        <div className="mb-3">
                          <button
                            type="submit"
                            className="btn btn-lg bg-primary text-white w-100"
                            disabled={isSubmitting || socialLoading}
                          >
                            {isSubmitting ? t("Signing up...") : t("Sign Up")}
                          </button>
                        </div>
                        <div className="login-or mb-3">
                          <span className="span-or">{t("OR")}</span>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex align-items-center justify-content-center flex-wrap gap-2">
                            {config?.facebookAppId && (
                              <div className="text-center flex-fill">
                                <button
                                  type="button"
                                  onClick={handleFacebookLogin}
                                  disabled={socialLoading}
                                  className="br-10 p-1 btn btn-outline-light border d-flex align-items-center justify-content-center w-100"
                                >
                                  <ImageWithBasePath
                                    className="img-fluid m-1 me-1"
                                    src="assets/img/icons/facebook.svg"
                                    alt="Facebook"
                                  />
                                  {t("Facebook")}
                                </button>
                              </div>
                            )}
                            {config?.googleClientId && (
                              <div className="text-center flex-fill">
                                <div
                                  ref={googleBtnRef}
                                  style={{ minHeight: 40, display: 'flex', justifyContent: 'center' }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-center">
                          <h6 className="fw-normal fs-14 text-dark mb-0">
                            {t("Don’t have an account yet? ")}{" "}
                            <Link
                              to={all_routes.signin}
                              className="register-btn"
                              state={location.state as any}
                            >
                              {t("Sign In")}
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

export default SignUp;
