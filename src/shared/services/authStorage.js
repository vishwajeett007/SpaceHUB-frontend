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
  const cookieToken = normalizeAuthToken(Cookies.get(TOKEN_COOKIE));
  return sessionToken || cookieToken;
};

export const persistAuthSession = (userData, tokenValue) => {
  const token = normalizeAuthToken(tokenValue);
  if (!token || !userData || typeof userData !== 'object') {
    return false;
  }

  sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  sessionStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);

  Cookies.set(TOKEN_COOKIE, token, {
    path: '/',
    sameSite: 'strict',
    secure: window.location.protocol === 'https:',
  });

  return true;
};

export const clearPasswordResetState = () => {
  sessionStorage.removeItem('resetEmail');
  sessionStorage.removeItem('resetIdentifier');
  sessionStorage.removeItem('resetAccessToken');
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
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
};

export const readStoredUser = () => {
  const rawUserData = sessionStorage.getItem(USER_DATA_KEY);
  if (!rawUserData) return null;

  try {
    const userData = JSON.parse(rawUserData);
    return userData && typeof userData === 'object' ? userData : null;
  } catch {
    return null;
  }
};

export const getStoredUserEmail = () => readStoredUser()?.email || '';
