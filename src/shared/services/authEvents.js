export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';

export const notifyUnauthorized = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
};
