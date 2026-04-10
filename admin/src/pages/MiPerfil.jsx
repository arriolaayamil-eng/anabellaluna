import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaCamera, FaSave, FaArrowLeft, FaSignOutAlt } from 'react-icons/fa';
import { FiShield, FiCheckCircle, FiXCircle, FiRefreshCw, FiCopy, FiEye, FiEyeOff, FiAlertTriangle, FiLock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';
import { authService } from '../services/authService';
import { api } from '../config/api';
import defaultAvatar from '../data/avatar.png';

const MiPerfil = () => {
  const { currentColor } = useStateContext();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    cargo: '',
    bio: '',
    empresa: '',
  });

  // ── 2FA state ──
  const [tfaStatus, setTfaStatus] = useState(null);
  const [tfaLoading, setTfaLoading] = useState(true);
  const [setupStep, setSetupStep] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [setupCode, setSetupCode] = useState('');
  const [setupError, setSetupError] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [codesCopied, setCodesCopied] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [disableError, setDisableError] = useState('');
  const [disableLoading, setDisableLoading] = useState(false);
  const [showDisablePassword, setShowDisablePassword] = useState(false);
  const [showRegen, setShowRegen] = useState(false);
  const [regenPassword, setRegenPassword] = useState('');
  const [regenCode, setRegenCode] = useState('');
  const [regenError, setRegenError] = useState('');
  const [regenLoading, setRegenLoading] = useState(false);
  const setupCodeRef = useRef(null);

  const load2FAStatus = useCallback(async () => {
    try {
      setTfaLoading(true);
      const s = await authService.get2FAStatus();
      setTfaStatus(s);
    } catch {
      setTfaStatus(null);
    } finally {
      setTfaLoading(false);
    }
  }, []);

  const handleInitSetup = async () => {
    setSetupError('');
    setSetupLoading(true);
    try {
      const data = await authService.init2FASetup();
      setQrData(data);
      setSetupStep('qr');
      setSetupCode('');
    } catch (err) {
      setSetupError(err?.message || 'Error al iniciar configuración');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleVerifySetup = async (e) => {
    e.preventDefault();
    setSetupError('');
    setSetupLoading(true);
    try {
      const resp = await authService.verify2FASetup(setupCode);
      if (resp.recoveryCodes) {
        setRecoveryCodes(resp.recoveryCodes);
        setSetupStep('codes');
      }
      await load2FAStatus();
    } catch (err) {
      setSetupError(err?.message || 'Código inválido');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleDisable2FA = async (e) => {
    e.preventDefault();
    setDisableError('');
    setDisableLoading(true);
    try {
      await authService.disable2FA(disablePassword, disableCode);
      setShowDisable(false);
      setDisablePassword('');
      setDisableCode('');
      setSetupStep(null);
      setQrData(null);
      await load2FAStatus();
    } catch (err) {
      setDisableError(err?.message || 'Error al desactivar');
    } finally {
      setDisableLoading(false);
    }
  };

  const handleRegenCodes = async (e) => {
    e.preventDefault();
    setRegenError('');
    setRegenLoading(true);
    try {
      const resp = await authService.regenerateRecoveryCodes(regenPassword, regenCode);
      if (resp.recoveryCodes) {
        setRecoveryCodes(resp.recoveryCodes);
        setSetupStep('codes');
        setShowRegen(false);
        setRegenPassword('');
        setRegenCode('');
      }
      await load2FAStatus();
    } catch (err) {
      setRegenError(err?.message || 'Error al regenerar códigos');
    } finally {
      setRegenLoading(false);
    }
  };

  const handleCopyCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n')).then(() => {
      setCodesCopied(true);
      setTimeout(() => setCodesCopied(false), 2000);
    });
  };

  const handleDoneCodes = () => {
    setRecoveryCodes([]);
    setSetupStep(null);
    setCodesCopied(false);
  };

  useEffect(() => {
    loadProfile();
    load2FAStatus();
  }, [load2FAStatus]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setFormData({
          nombre: currentUser.nombre || currentUser.username || '',
          email: currentUser.email || '',
          telefono: currentUser.telefono || '',
          cargo: currentUser.cargo || 'Administrador',
          bio: currentUser.bio || '',
          empresa: currentUser.empresa || 'Anabella Luna Bienes Raíces',
        });
        if (currentUser.avatar) {
          setPreviewImage(currentUser.avatar);
        }
      }
    } catch (e) {
      setError('Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no debe superar 5MB');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser) {
        throw new Error('Usuario no encontrado');
      }

      const updateData = {
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono,
        cargo: formData.cargo,
        bio: formData.bio,
        empresa: formData.empresa,
      };

      if (selectedFile) {
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(selectedFile);
        });
        updateData.avatar = base64;
      }

      // Update profile on server and sync to localStorage
      const updated = await authService.updateProfile(updateData);
      
      // Update preview with server response
      if (updated?.avatar) {
        setPreviewImage(updated.avatar);
      }
      
      // Clear selected file since it's been uploaded
      setSelectedFile(null);

      setSuccess('Perfil actualizado correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e?.message || 'Error al guardar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen px-6 lg:px-8 pt-4 pb-6 bg-gray-50 dark:bg-main-dark-bg">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: currentColor }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 lg:px-8 pt-4 pb-6 bg-gray-50 dark:bg-main-dark-bg">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <FaArrowLeft className="text-gray-600 dark:text-gray-300" />
        </button>
        <Header category="Configuración" title="Mi Perfil" />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Foto de Perfil */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <img
              src={previewImage || defaultAvatar}
              alt="Foto de perfil"
              className="w-32 h-32 rounded-full object-cover border-4 shadow-lg"
              style={{ borderColor: currentColor }}
            />
            <button
              type="button"
              onClick={handleImageClick}
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <FaCamera className="text-white text-2xl" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Haz clic para cambiar la foto
          </p>
          <h2 className="mt-2 text-2xl font-bold dark:text-gray-100">
            {formData.nombre || 'Mi Perfil'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">{formData.cargo}</p>
        </div>

        {/* Información Personal */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
            <FaUser style={{ color: currentColor }} /> Información Personal
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Nombre Completo *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Tu nombre completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Cargo
              </label>
              <input
                type="text"
                name="cargo"
                value={formData.cargo}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Ej: Administrador General"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Empresa
              </label>
              <input
                type="text"
                name="empresa"
                value={formData.empresa}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Nombre de la empresa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                &nbsp;
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Biografía
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Una breve descripción sobre ti..."
              />
            </div>
          </div>
        </div>

        {/* Información de Contacto */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
            <FaEnvelope style={{ color: currentColor }} /> Información de Contacto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="+54 11 1234-5678"
              />
            </div>
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            style={{ backgroundColor: currentColor }}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <FaSave /> Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>

      {/* ── Seguridad / 2FA ── */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
          <FiShield style={{ color: currentColor }} /> Seguridad
        </h3>

        {tfaLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: currentColor }} />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status Card */}
            {!setupStep && !showDisable && !showRegen && (
              <>
                <div className="p-5 rounded-xl border dark:border-gray-700/50" style={{ borderColor: tfaStatus?.enabled ? '#22c55e33' : '#f59e0b33', background: tfaStatus?.enabled ? '#f0fdf408' : '#fffbeb08' }}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tfaStatus?.enabled ? 'bg-green-100 dark:bg-green-500/20' : 'bg-amber-100 dark:bg-amber-500/20'}`}>
                      {tfaStatus?.enabled
                        ? <FiCheckCircle size={24} className="text-green-600 dark:text-green-400" />
                        : <FiAlertTriangle size={24} className="text-amber-600 dark:text-amber-400" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold dark:text-white text-sm">Autenticación de dos factores (2FA)</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {tfaStatus?.enabled
                          ? `Activado el ${new Date(tfaStatus.enabledAt).toLocaleDateString('es-AR')}. Códigos restantes: ${tfaStatus.recoveryCodesRemaining}`
                          : 'No activado. Protegé tu cuenta con un segundo factor de autenticación.'}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${tfaStatus?.enabled ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tfaStatus?.enabled ? 'bg-green-500' : 'bg-amber-500'}`} />
                      {tfaStatus?.enabled ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                {!tfaStatus?.enabled && (
                  <button onClick={handleInitSetup} disabled={setupLoading} className="flex items-center gap-3 w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${currentColor}15` }}>
                      <FiShield size={18} style={{ color: currentColor }} />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold dark:text-white text-sm">Activar 2FA</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Configurar verificación en dos pasos</p>
                    </div>
                    {setupLoading && <span className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: currentColor }} />}
                  </button>
                )}

                {tfaStatus?.enabled && (
                  <>
                    <button onClick={() => setShowRegen(true)} className="flex items-center gap-3 w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-500/20">
                        <FiRefreshCw size={18} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold dark:text-white text-sm">Regenerar códigos de recuperación</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{tfaStatus.recoveryCodesRemaining} código(s) restante(s)</p>
                      </div>
                    </button>
                    <button onClick={() => setShowDisable(true)} className="flex items-center gap-3 w-full p-4 rounded-xl border border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-50 dark:bg-red-500/20">
                        <FiXCircle size={18} className="text-red-600 dark:text-red-400" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold text-red-700 dark:text-red-400 text-sm">Desactivar 2FA</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Requiere contraseña y código TOTP</p>
                      </div>
                    </button>
                  </>
                )}

                {setupError && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">{setupError}</div>}
              </>
            )}

            {/* Setup: QR */}
            {setupStep === 'qr' && qrData && (
              <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-700/50">
                <div className="text-center mb-4">
                  <FiShield size={28} className="mx-auto mb-2" style={{ color: currentColor }} />
                  <h4 className="font-bold dark:text-white">Escaneá el código QR</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Abrí tu app de autenticación (Google Authenticator, Authy, etc.) y escaneá este código.</p>
                </div>
                <div className="flex justify-center mb-4">
                  <div className="bg-white p-3 rounded-xl inline-block">
                    <img src={qrData.qrDataURL} alt="QR Code 2FA" className="w-44 h-44" />
                  </div>
                </div>
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm font-medium dark:text-gray-300" style={{ color: currentColor }}>¿No podés escanear? Ingresá la clave manualmente</summary>
                  <div className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 font-mono text-xs break-all dark:text-gray-300">{qrData.secret}</div>
                </details>
                <form onSubmit={handleVerifySetup} className="space-y-3">
                  <input ref={setupCodeRef} type="text" inputMode="numeric" maxLength={6} value={setupCode} onChange={(e) => { setSetupCode(e.target.value); setSetupError(''); }} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700/70 text-center text-2xl font-mono tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100" placeholder="000000" autoFocus required />
                  {setupError && <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">{setupError}</div>}
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { setSetupStep(null); setQrData(null); setSetupCode(''); setSetupError(''); }} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/50 font-medium dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50">Cancelar</button>
                    <button type="submit" disabled={setupLoading || setupCode.length < 6} className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white disabled:opacity-60" style={{ background: currentColor }}>{setupLoading ? 'Verificando...' : 'Activar 2FA'}</button>
                  </div>
                </form>
              </div>
            )}

            {/* Setup: Recovery Codes */}
            {setupStep === 'codes' && recoveryCodes.length > 0 && (
              <div className="p-5 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10">
                <div className="text-center mb-4">
                  <FiLock size={28} className="mx-auto mb-2 text-amber-600 dark:text-amber-400" />
                  <h4 className="font-bold dark:text-white">Códigos de recuperación</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Guardá estos códigos en un lugar seguro. Cada uno se puede usar una sola vez.</p>
                </div>
                <div className="bg-white dark:bg-gray-900/50 rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-700/50">
                  <div className="grid grid-cols-2 gap-2">
                    {recoveryCodes.map((code, i) => (
                      <div key={i} className="font-mono text-sm py-1.5 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:text-gray-200">{code}</div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleCopyCodes} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/50 font-medium dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <FiCopy size={15} /> {codesCopied ? '¡Copiados!' : 'Copiar todos'}
                  </button>
                  <button onClick={handleDoneCodes} className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white" style={{ background: currentColor }}>Ya los guardé</button>
                </div>
              </div>
            )}

            {/* Disable 2FA */}
            {showDisable && (
              <div className="p-5 rounded-xl border border-red-200 dark:border-red-500/30">
                <h4 className="font-bold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2"><FiXCircle size={18} /> Desactivar 2FA</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Necesitás tu contraseña y un código TOTP vigente.</p>
                <form onSubmit={handleDisable2FA} className="space-y-3">
                  <div className="relative">
                    <input type={showDisablePassword ? 'text' : 'password'} value={disablePassword} onChange={(e) => { setDisablePassword(e.target.value); setDisableError(''); }} className="w-full px-4 py-2.5 pr-12 rounded-xl border border-gray-200 dark:border-gray-700/70 focus:outline-none focus:ring-2 focus:ring-red-400 dark:bg-gray-700 dark:text-gray-100" placeholder="Contraseña actual" required />
                    <button type="button" onClick={() => setShowDisablePassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showDisablePassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}</button>
                  </div>
                  <input type="text" inputMode="numeric" maxLength={10} value={disableCode} onChange={(e) => { setDisableCode(e.target.value); setDisableError(''); }} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/70 text-center font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-red-400 dark:bg-gray-700 dark:text-gray-100" placeholder="Código TOTP o de recuperación" required />
                  {disableError && <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">{disableError}</div>}
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { setShowDisable(false); setDisablePassword(''); setDisableCode(''); setDisableError(''); }} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/50 font-medium dark:text-gray-300">Cancelar</button>
                    <button type="submit" disabled={disableLoading} className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60">{disableLoading ? 'Desactivando...' : 'Confirmar'}</button>
                  </div>
                </form>
              </div>
            )}

            {/* Regenerate Recovery Codes */}
            {showRegen && (
              <div className="p-5 rounded-xl border border-blue-200 dark:border-blue-500/30">
                <h4 className="font-bold dark:text-white mb-3 flex items-center gap-2"><FiRefreshCw size={18} style={{ color: currentColor }} /> Regenerar códigos de recuperación</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Los códigos anteriores serán invalidados. Necesitás tu contraseña y un código TOTP vigente.</p>
                <form onSubmit={handleRegenCodes} className="space-y-3">
                  <input type="password" value={regenPassword} onChange={(e) => { setRegenPassword(e.target.value); setRegenError(''); }} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/70 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100" placeholder="Contraseña actual" required />
                  <input type="text" inputMode="numeric" maxLength={6} value={regenCode} onChange={(e) => { setRegenCode(e.target.value); setRegenError(''); }} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/70 text-center font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100" placeholder="Código TOTP (6 dígitos)" required />
                  {regenError && <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">{regenError}</div>}
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { setShowRegen(false); setRegenPassword(''); setRegenCode(''); setRegenError(''); }} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/50 font-medium dark:text-gray-300">Cancelar</button>
                    <button type="submit" disabled={regenLoading} className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white disabled:opacity-60" style={{ background: currentColor }}>{regenLoading ? 'Regenerando...' : 'Regenerar'}</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cerrar Sesión */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => { authService.logout(); window.location.reload(); }}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <FaSignOutAlt /> Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default MiPerfil;
