import { useState, useEffect, useCallback } from 'react';
import { GOOGLE_CLIENT_ID, ALLOWED_DOMAINS, ADMIN_EMAIL } from '../utils/constants';
import { STORAGE_KEYS } from '../utils/constants';

export default function useGoogleAuth() {
  const [user, setUser]           = useState(null);
  const [authLoaded, setLoaded]   = useState(false);
  const [authError, setAuthError] = useState(null);

  // Restore session on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEYS.USER);
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    // The GSI script is loaded via index.html; just wait for it
    const check = setInterval(() => {
      if (window.google?.accounts) { setLoaded(true); clearInterval(check); }
    }, 100);
    const timeout = setTimeout(() => { setLoaded(true); clearInterval(check); }, 5000);
    return () => { clearInterval(check); clearTimeout(timeout); };
  }, []);

  const signIn = useCallback(() => {
    if (!window.google?.accounts) {
      setAuthError('Google auth not available. Make sure the GSI script loaded.');
      return;
    }
    window.google.accounts.oauth2
      .initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        callback: (tokenResponse) => {
          if (tokenResponse.error) { setAuthError(tokenResponse.error); return; }
          fetch(
            `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`
          )
            .then((r) => r.json())
            .then((info) => {
              const domain = info.email.split('@')[1];
              if (!ALLOWED_DOMAINS.includes(domain)) {
                setAuthError(
                  `Access denied. Only @brophybroncos.org and @brophyprep.org accounts are allowed.`
                );
                return;
              }
              const userData = {
                email:   info.email,
                name:    info.name,
                picture: info.picture,
                isAdmin: info.email === ADMIN_EMAIL,
              };
              sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
              setUser(userData);
              setAuthError(null);
            })
            .catch(() => setAuthError('Failed to fetch user info from Google.'));
        },
      })
      .requestAccessToken();
  }, []);

  const signOut = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    setUser(null);
  }, []);

  return { user, authLoaded, authError, signIn, signOut, setAuthError };
}
