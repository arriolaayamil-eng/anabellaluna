import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import userService from "../../../../services/userService";
import { all_routes } from "../../../routes/all_routes";

const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    bio: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      // Refresh user data from server
      const freshUser = await userService.refreshUserData();
      const currentUser = freshUser || userService.getCurrentUser();

      if (!currentUser) {
        navigate(all_routes.signin);
        return;
      }

      setFormData({
        nombre: currentUser.nombre || "",
        email: currentUser.email || currentUser.username || "",
        telefono: currentUser.telefono || "",
        direccion: currentUser.direccion || "",
        bio: currentUser.bio || "",
      });

      if (currentUser.avatar) {
        setPreviewImage(currentUser.avatar);
      }
    } catch (e) {
      setError("Error al cargar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("La imagen no debe superar 5MB");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: any = {
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono,
        direccion: formData.direccion,
        bio: formData.bio,
      };

      // Handle avatar - convert to base64 if new file selected
      if (selectedFile) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(selectedFile);
        });
        updateData.avatar = base64;
      }

      // Update on server
      await userService.updateProfile(updateData);

      // Refresh user data from server
      await userService.refreshUserData();

      setSelectedFile(null);
      setSuccess("Perfil actualizado correctamente");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e?.message || "Error al guardar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    userService.logout();
    navigate(all_routes.signin);
  };

  if (loading) {
    return (
      <div className="content">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-5 text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-3 text-muted">Cargando perfil...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className="mb-4">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link to={all_routes.index}>{t("Inicio")}</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {t("Mi Perfil")}
                </li>
              </ol>
            </nav>

            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-bottom py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="mb-0">{t("Mi Perfil")}</h4>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={handleLogout}
                  >
                    <i className="fas fa-sign-out-alt me-2"></i>
                    {t("Cerrar Sesión")}
                  </button>
                </div>
              </div>

              <div className="card-body p-4">
                {error && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setError(null)}
                    ></button>
                  </div>
                )}

                {success && (
                  <div className="alert alert-success alert-dismissible fade show" role="alert">
                    {success}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setSuccess(null)}
                    ></button>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Profile Photo */}
                  <div className="text-center mb-4">
                    <div
                      className="position-relative d-inline-block"
                      style={{ cursor: "pointer" }}
                      onClick={handleImageClick}
                    >
                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt="Foto de perfil"
                          className="rounded-circle object-fit-cover border border-3 border-primary"
                          style={{ width: "120px", height: "120px" }}
                        />
                      ) : (
                        <div
                          className="rounded-circle bg-light d-flex align-items-center justify-content-center border border-3 border-primary"
                          style={{ width: "120px", height: "120px" }}
                        >
                          <i className="fas fa-user fa-3x text-muted"></i>
                        </div>
                      )}
                      <div
                        className="position-absolute bottom-0 end-0 bg-primary rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "36px", height: "36px" }}
                      >
                        <i className="fas fa-camera text-white"></i>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="d-none"
                    />
                    <p className="mt-2 text-muted small">
                      {t("Haz clic para cambiar la foto")}
                    </p>
                  </div>

                  {/* Personal Information */}
                  <h6 className="text-uppercase text-muted mb-3">
                    <i className="fas fa-user me-2"></i>
                    {t("Información Personal")}
                  </h6>
                  <div className="row mb-4">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        {t("Nombre Completo")} <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        className="form-control"
                        placeholder={t("Tu nombre completo")}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        {t("Email")} <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="form-control"
                        placeholder={t("tu@email.com")}
                        required
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <h6 className="text-uppercase text-muted mb-3">
                    <i className="fas fa-phone me-2"></i>
                    {t("Información de Contacto")}
                  </h6>
                  <div className="row mb-4">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">{t("Teléfono")}</label>
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        className="form-control"
                        placeholder={t("+54 11 1234-5678")}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">{t("Dirección")}</label>
                      <input
                        type="text"
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleChange}
                        className="form-control"
                        placeholder={t("Tu dirección")}
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <h6 className="text-uppercase text-muted mb-3">
                    <i className="fas fa-info-circle me-2"></i>
                    {t("Sobre Ti")}
                  </h6>
                  <div className="mb-4">
                    <label className="form-label">{t("Biografía")}</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      className="form-control"
                      rows={4}
                      placeholder={t("Cuéntanos un poco sobre ti...")}
                    ></textarea>
                  </div>

                  {/* Submit Button */}
                  <div className="d-flex justify-content-end gap-3">
                    <Link to={all_routes.index} className="btn btn-outline-secondary">
                      {t("Cancelar")}
                    </Link>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          {t("Guardando...")}
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save me-2"></i>
                          {t("Guardar Cambios")}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
