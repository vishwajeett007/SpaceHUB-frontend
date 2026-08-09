import Cookies from 'js-cookie';

const ACCESS_TOKEN_KEY = 'accessToken';
const USER_DATA_KEY = 'userData';
const TOKEN_COOKIE = 'token';

export const normalizeAuthToken = (value) => {
  if (typeof value !== 'string') return null;

  const token = value.trim();
  if (!token || token === 'undefined' || token === 'null') return null;

  return token;
};

const removeTokenCookie = () => {
  Cookies.remove(TOKEN_COOKIE, { path: '/' });
};

export const getStoredAuthToken = () => {
  const sessionToken = normalizeAuthToken(sessionStorage.getItem(ACCESS_TOKEN_KEY));
  const localToken = normalizeAuthToken(localStorage.getItem(ACCESS_TOKEN_KEY));
  const cookieToken = normalizeAuthToken(Cookies.get(TOKEN_COOKIE));
  return sessionToken || localToken || cookieToken;
};

export const persistAuthSession = (userData, tokenValue, rememberMe = true) => {
  const token = normalizeAuthToken(tokenValue);
  if (!token || !userData || typeof userData !== 'object') {
    return false;
  }

  // Always persist session to sessionStorage for active browser window
  try {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    sessionStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  } catch (e) {
    console.warn('Unable to write to sessionStorage:', e);
  }

  if (rememberMe) {
    // Persist to localStorage for long-term login across browser restarts
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    } catch (e) {
      console.warn('Unable to write to localStorage:', e);
    }

    // Maintain cookie for long-term session persistence (30 days)
    try {
      Cookies.set(TOKEN_COOKIE, token, {
        path: '/',
        expires: 30,
        sameSite: 'strict',
        secure: window.location.protocol === 'https:',
      });
    } catch (e) {
      console.warn('Unable to set auth cookie:', e);
    }
  } else {
    // If "Remember Me" is unchecked, clear persistent long-term storage
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    removeTokenCookie();
  }

  return true;
};

export const clearPasswordResetState = () => {
  sessionStorage.removeItem('resetEmail');
  sessionStorage.removeItem('resetIdentifier');
  sessionStorage.removeItem('resetAccessToken');
  localStorage.removeItem('resetEmail');
  localStorage.removeItem('resetIdentifier');
  localStorage.removeItem('resetAccessToken');
};

export const clearStoredAuth = ({ includeResetState = false } = {}) => {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(USER_DATA_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
  removeTokenCookie();

  if (includeResetState) {
    clearPasswordResetState();
  }
};

export const clearLegacyLocalAuth = () => {
  // Retained for backward compatibility
};

export const readStoredUser = () => {
  const rawUserData = sessionStorage.getItem(USER_DATA_KEY) || localStorage.getItem(USER_DATA_KEY);
  if (!rawUserData) return null;

  try {
    const userData = JSON.parse(rawUserData);
    return userData && typeof userData === 'object' ? userData : null;
  } catch {
    return null;
  }
};

export const getStoredUserEmail = () => readStoredUser()?.email || '';
