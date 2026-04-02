import { useCallback, useEffect, useRef, useState } from 'react';
import userService from '../services/userService';

interface SocialLoginConfig {
  googleClientId: string;
  facebookAppId: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
    FB?: {
      init: (config: any) => void;
      login: (cb: (response: any) => void, config: any) => void;
      getLoginStatus: (cb: (response: any) => void) => void;
    };
    fbAsyncInit?: () => void;
  }
}

export function useSocialLogin(onSuccess: () => void) {
  const [config, setConfig] = useState<SocialLoginConfig | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [socialLoading, setSocialLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const configLoaded = useRef(false);
  const googleInitialized = useRef(false);
  const fbInitialized = useRef(false);

  // ── Load config from backend ──────────────────────────────────────────
  useEffect(() => {
    if (configLoaded.current) return;
    configLoaded.current = true;
    userService.getSocialConfig().then(setConfig).catch(() => {});
  }, []);

  // ── Load Google Identity Services SDK ─────────────────────────────────
  useEffect(() => {
    if (!config?.googleClientId || googleInitialized.current) return;

    const existingScript = document.getElementById('google-gsi-script');
    if (existingScript) {
      initGoogle(config.googleClientId);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => initGoogle(config.googleClientId);
    document.head.appendChild(script);
  }, [config?.googleClientId]);

  const initGoogle = useCallback((clientId: string) => {
    if (!window.google || googleInitialized.current) return;
    googleInitialized.current = true;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleResponse,
      auto_select: false,
    });

    if (googleBtnRef.current) {
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard',
        shape: 'rectangular',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        logo_alignment: 'left',
        width: '100%',
      });
    }
  }, []);

  const handleGoogleResponse = useCallback(async (response: any) => {
    if (!response?.credential) return;
    setSocialError(null);
    setSocialLoading(true);
    try {
      await userService.socialLogin('google', { token: response.credential });
      onSuccess();
    } catch (err: any) {
      setSocialError(err?.message || 'Error al iniciar sesión con Google');
    } finally {
      setSocialLoading(false);
    }
  }, [onSuccess]);

  // ── Load Facebook SDK ─────────────────────────────────────────────────
  useEffect(() => {
    if (!config?.facebookAppId || fbInitialized.current) return;
    fbInitialized.current = true;

    window.fbAsyncInit = () => {
      window.FB?.init({
        appId: config.facebookAppId,
        cookie: true,
        xfbml: false,
        version: 'v19.0',
      });
    };

    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/es_LA/sdk.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, [config?.facebookAppId]);

  const handleFacebookLogin = useCallback(() => {
    if (!window.FB) {
      setSocialError('Facebook SDK no disponible. Intenta recargar la página.');
      return;
    }
    setSocialError(null);
    setSocialLoading(true);

    window.FB.login(
      async (response: any) => {
        if (response.status === 'connected' && response.authResponse?.accessToken) {
          try {
            await userService.socialLogin('facebook', { accessToken: response.authResponse.accessToken });
            onSuccess();
          } catch (err: any) {
            setSocialError(err?.message || 'Error al iniciar sesión con Facebook');
          } finally {
            setSocialLoading(false);
          }
        } else {
          setSocialLoading(false);
        }
      },
      { scope: 'email,public_profile' },
    );
  }, [onSuccess]);

  return {
    config,
    socialError,
    socialLoading,
    googleBtnRef,
    handleFacebookLogin,
  };
}
