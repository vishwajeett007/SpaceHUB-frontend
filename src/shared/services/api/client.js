import { getStoredAuthToken } from '../authStorage';
import { notifyUnauthorized } from '../authEvents';
import { dispatchRateLimitToast } from './response';

export const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5000/api/v1/';

export const getCookie = (name) => {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const val = parts.pop().split(';').shift();
      return val === 'undefined' || val === 'null' ? null : val;
    }
  } catch (error) {
    console.error('Error getting cookie:', error);
  }
  return null;
};

export const getAuthHeaders = (isFormData = false) => {
  const token = getStoredAuthToken();
  return {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const authenticatedFetch = async (url, options = {}) => {
  const isFormData = options.body instanceof FormData;
  const headers = getAuthHeaders(isFormData);

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (response.status === 429) {
    dispatchRateLimitToast();
  }

  if (response.status === 401) {
    notifyUnauthorized();
  }

  return response;
};
