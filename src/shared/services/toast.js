export const TOAST_EVENT = 'toast';

export const showToast = (message, type = 'info') => {
  if (typeof window === 'undefined' || !message) return;

  window.dispatchEvent(new CustomEvent(TOAST_EVENT, {
    detail: { message, type }
  }));
};
