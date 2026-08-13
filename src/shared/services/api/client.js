import { getStoredAuthToken } from '../authStorage';
import { notifyUnauthorized } from '../authEvents';
import { dispatchRateLimitToast } from './response';

export const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5000/api/v1/';
const inFlightReadRequests = new Map();

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
  const method = String(options.method || 'GET').toUpperCase();
  const { dedupe, ...fetchOptions } = options;
  const shouldDedupe = dedupe ?? (method === 'GET' || method === 'HEAD');
  const requestOptions = {
    ...fetchOptions,
    method,
    credentials: 'include',
    headers: {
      ...headers,
      ...options.headers,
    },
  };

  const executeRequest = async () => {
    const response = await fetch(url, requestOptions);

    if (response.status === 429) {
      dispatchRateLimitToast();
    }

    if (response.status === 401) {
      notifyUnauthorized();
    }

    return response;
  };

  if (!shouldDedupe) {
    return executeRequest();
  }

  const bodyKey = typeof requestOptions.body === 'string' ? requestOptions.body : '';
  const authKey = requestOptions.headers.Authorization || '';
  const requestKey = `${method}:${url}:${authKey}:${bodyKey}`;
  let requestPromise = inFlightReadRequests.get(requestKey);

  if (!requestPromise) {
    requestPromise = executeRequest().finally(() => {
      if (inFlightReadRequests.get(requestKey) === requestPromise) {
        inFlightReadRequests.delete(requestKey);
      }
    });
    inFlightReadRequests.set(requestKey, requestPromise);
  }

  const response = await requestPromise;
  return response.clone();
};
