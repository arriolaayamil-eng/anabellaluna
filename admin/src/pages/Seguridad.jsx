import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiShield, FiCheckCircle, FiXCircle, FiRefreshCw, FiCopy, FiEye, FiEyeOff, FiAlertTriangle, FiLock } from 'react-icons/fi';
import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';
import { authService } from '../services/authService';

const Seguridad = () => {
  const { currentColor } = useStateContext();

  // Status
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Setup flow
  const [setupStep, setSetupStep] = useState(null); // null | 'qr' | 'verify' | 'codes'
  const [qrData, setQrData] = useState(null);
  const [setupCode, setSetupCode] = useState('');
  const [setupError, setSetupError] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [codesCopied, setCodesCopied] = useState(false);

  // Disable flow
  const [showDisable, setShowDisable] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [disableError, setDisableError] = useState('');
  const [disableLoading, setDisableLoading] = useState(false);
  const [showDisablePassword, setShowDisablePassword] = useState(false);

  // Regenerate codes flow
  const [showRegen, setShowRegen] = useState(false);
  const [regenPassword, setRegenPassword] = useState('');
  const [regenCode, setRegenCode] = useState('');
  const [regenError, setRegenError] = useState('');
  const [regenLoading, setRegenLoading] = useState(false);

  const setupCodeRef = useRef(null);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      const s = await authService.get2FAStatus();
      setStatus(s);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  // ── Setup: Init ──
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

  // ── Setup: Verify ──
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
      await loadStatus();
    } catch (err) {
      setSetupError(err?.message || 'Código inválido');
    } finally {
      setSetupLoading(false);
    }
  };

  // ── Disable ──
  const handleDisable = async (e) => {
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
      await loadStatus();
    } catch (err) {
      setDisableError(err?.message || 'Error al desactivar');
    } finally {
      setDisableLoading(false);
    }
  };

  // ── Regenerate Recovery Codes ──
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
      await loadStatus();
    } catch (err) {
      setRegenError(err?.message || 'Error al regenerar códigos');
    } finally {
      setRegenLoading(false);
    }
  };

  // ── Copy codes ──
  const handleCopyCodes = () => {
    const text = recoveryCodes.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCodesCopied(true);
      setTimeout(() => setCodesCopied(false), 2000);
    });
  };

  const handleDoneCodes = () => {
    setRecoveryCodes([]);
    setSetupStep(null);
    setCodesCopied(false);
  };

  // ── Renders ──

  if (loading) {
    return (
      <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-white dark:bg-secondary-dark-bg rounded-3xl">
        <Header category="Configuración" title="Seguridad" />
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: currentColor }} />
        </div>
      </div>
    );
  }

  const is2FAEnabled = status?.enabled;

  return (
    <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-white dark:bg-secondary-dark-bg rounded-3xl">
      <Header category="Configuración" title="Seguridad" />

      {/* ── Status Card ── */}
      <div className="mb-8 p-6 rounded-2xl border dark:border-gray-700/50" style={{ borderColor: is2FAEnabled ? '#22c55e33' : '#f59e0b33', background: is2FAEnabled ? '#f0fdf410' : '#fffbeb10' }}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${is2FAEnabled ? 'bg-green-100 dark:bg-green-500/20' : 'bg-amber-100 dark:bg-amber-500/20'}`}>
            {is2FAEnabled
              ? <FiCheckCircle size={28} className="text-green-600 dark:text-green-400" />
              : <FiAlertTriangle size={28} className="text-amber-600 dark:text-amber-400" />}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold dark:text-white">
              Autenticación de dos factores (2FA)
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {is2FAEnabled
                ? `Activado el ${new Date(status.enabledAt).toLocaleDateString('es-AR')}. Códigos de recuperación restantes: ${status.recoveryCodesRemaining}`
                : 'No activado. Protegé tu cuenta con un segundo factor de autenticación.'}
            </p>
          </div>
          <div className="flex-shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${is2FAEnabled ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'}`}>
              <span className={`w-2 h-2 rounded-full ${is2FAEnabled ? 'bg-green-500' : 'bg-amber-500'}`} />
              {is2FAEnabled ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      {!setupStep && !showDisable && !showRegen && (
        <div className="space-y-4">
          {!is2FAEnabled && (
            <button
              onClick={handleInitSetup}
              disabled={setupLoading}
              className="flex items-center gap-3 w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${currentColor}15` }}>
                <FiShield size={20} style={{ color: currentColor }} />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold dark:text-white">Activar 2FA</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Configurar verificación en dos pasos con una app de autenticación</p>
              </div>
              {setupLoading && <span className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: currentColor }} />}
            </button>
          )}

          {is2FAEnabled && (
            <>
              <button
                onClick={() => setShowRegen(true)}
                className="flex items-center gap-3 w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-500/20">
                  <FiRefreshCw size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold dark:text-white">Regenerar códigos de recuperación</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {status.recoveryCodesRemaining} código(s) restante(s) · Generados el {status.recoveryCodesGeneratedAt ? new Date(status.recoveryCodesGeneratedAt).toLocaleDateString('es-AR') : '—'}
                  </p>
                </div>
              </button>

              <button
                onClick={() => setShowDisable(true)}
                className="flex items-center gap-3 w-full p-4 rounded-xl border border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50 dark:bg-red-500/20">
                  <FiXCircle size={20} className="text-red-600 dark:text-red-400" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-red-700 dark:text-red-400">Desactivar 2FA</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Requiere tu contraseña y un código TOTP o de recuperación</p>
                </div>
              </button>
            </>
          )}

          {setupError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
              {setupError}
            </div>
          )}
        </div>
      )}

      {/* ── Setup: QR Code ── */}
      {setupStep === 'qr' && qrData && (
        <div className="max-w-md mx-auto text-center">
          <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700/50">
            <FiShield size={32} className="mx-auto mb-3" style={{ color: currentColor }} />
            <h3 className="text-lg font-bold dark:text-white mb-2">Escaneá el código QR</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Abrí tu aplicación de autenticación (Google Authenticator, Authy, etc.) y escaneá este código.
            </p>
            <div className="bg-white p-4 rounded-xl inline-block mb-4">
              <img src={qrData.qrDataURL} alt="QR Code para 2FA" className="w-48 h-48" />
            </div>
            <details className="text-left mb-4">
              <summary className="cursor-pointer text-sm font-medium dark:text-gray-300" style={{ color: currentColor }}>
                ¿No podés escanear? Ingresá la clave manualmente
              </summary>
              <div className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 font-mono text-sm break-all dark:text-gray-300">
                {qrData.secret}
              </div>
            </details>
            <form onSubmit={handleVerifySetup} className="space-y-3">
              <input
                ref={setupCodeRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={setupCode}
                onChange={(e) => { setSetupCode(e.target.value); setSetupError(''); }}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700/70 text-center text-2xl font-mono tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900/40 dark:text-gray-100"
                placeholder="000000"
                autoFocus
                required
              />
              {setupError && (
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
                  {setupError}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setSetupStep(null); setQrData(null); setSetupCode(''); setSetupError(''); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/50 font-medium dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={setupLoading || setupCode.length < 6}
                  className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white disabled:opacity-60"
                  style={{ background: currentColor }}
                >
                  {setupLoading ? 'Verificando...' : 'Activar 2FA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Setup: Recovery Codes ── */}
      {setupStep === 'codes' && recoveryCodes.length > 0 && (
        <div className="max-w-md mx-auto text-center">
          <div className="p-6 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10">
            <FiLock size={32} className="mx-auto mb-3 text-amber-600 dark:text-amber-400" />
            <h3 className="text-lg font-bold dark:text-white mb-2">Códigos de recuperación</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Guardá estos códigos en un lugar seguro. Son la <strong>única forma</strong> de acceder si perdés tu dispositivo de autenticación.
              Cada código se puede usar una sola vez.
            </p>
            <div className="bg-white dark:bg-gray-900/50 rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-700/50">
              <div className="grid grid-cols-2 gap-2">
                {recoveryCodes.map((code, i) => (
                  <div key={i} className="font-mono text-sm py-1.5 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:text-gray-200">
                    {code}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCopyCodes}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/50 font-medium dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <FiCopy size={16} />
                {codesCopied ? '¡Copiados!' : 'Copiar todos'}
              </button>
              <button
                onClick={handleDoneCodes}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white"
                style={{ background: currentColor }}
              >
                Ya los guardé
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Disable 2FA ── */}
      {showDisable && (
        <div className="max-w-md mx-auto">
          <div className="p-6 rounded-2xl border border-red-200 dark:border-red-500/30">
            <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
              <FiXCircle size={20} /> Desactivar 2FA
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Esta acción eliminará la protección de doble factor. Necesitás tu contraseña y un código TOTP vigente.
            </p>
            <form onSubmit={handleDisable} className="space-y-3">
              <div className="relative">
                <input
                  type={showDisablePassword ? 'text' : 'password'}
                  value={disablePassword}
                  onChange={(e) => { setDisablePassword(e.target.value); setDisableError(''); }}
                  className="w-full px-4 py-2.5 pr-12 rounded-xl border border-gray-200 dark:border-gray-700/70 focus:outline-none focus:ring-2 focus:ring-red-400 dark:bg-gray-900/40 dark:text-gray-100"
                  placeholder="Contraseña actual"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowDisablePassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showDisablePassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={disableCode}
                onChange={(e) => { setDisableCode(e.target.value); setDisableError(''); }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/70 text-center font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-red-400 dark:bg-gray-900/40 dark:text-gray-100"
                placeholder="Código TOTP (6 dígitos) o recuperación"
                required
              />
              {disableError && (
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
                  {disableError}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowDisable(false); setDisablePassword(''); setDisableCode(''); setDisableError(''); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/50 font-medium dark:text-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={disableLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
                >
                  {disableLoading ? 'Desactivando...' : 'Confirmar desactivación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Regenerate Recovery Codes ── */}
      {showRegen && (
        <div className="max-w-md mx-auto">
          <div className="p-6 rounded-2xl border border-blue-200 dark:border-blue-500/30">
            <h3 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2">
              <FiRefreshCw size={20} style={{ color: currentColor }} /> Regenerar códigos de recuperación
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Los códigos anteriores serán invalidados. Necesitás tu contraseña y un código TOTP vigente.
            </p>
            <form onSubmit={handleRegenCodes} className="space-y-3">
              <input
                type="password"
                value={regenPassword}
                onChange={(e) => { setRegenPassword(e.target.value); setRegenError(''); }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/70 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900/40 dark:text-gray-100"
                placeholder="Contraseña actual"
                required
              />
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={regenCode}
                onChange={(e) => { setRegenCode(e.target.value); setRegenError(''); }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/70 text-center font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900/40 dark:text-gray-100"
                placeholder="Código TOTP (6 dígitos)"
                required
              />
              {regenError && (
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
                  {regenError}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowRegen(false); setRegenPassword(''); setRegenCode(''); setRegenError(''); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/50 font-medium dark:text-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={regenLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white disabled:opacity-60"
                  style={{ background: currentColor }}
                >
                  {regenLoading ? 'Regenerando...' : 'Regenerar códigos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Seguridad;
