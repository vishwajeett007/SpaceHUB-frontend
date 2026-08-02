import { showToast } from '../toast';

const RATE_LIMIT_MESSAGE = 'Wait for some time to reload';
const RATE_LIMIT_ERROR_MESSAGE = 'Too many requests. Please wait for some time to reload.';

export function dispatchRateLimitToast() {
  showToast(RATE_LIMIT_MESSAGE, 'error');
}

export async function handleJsonResponse(
  response,
  { logErrors = false, notifyRateLimit = false } = {}
) {
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (logErrors) {
      console.error(`API Error response for ${response.url}:`, {
        status: response.status,
        data
      });
    }

    if (response.status === 429 && notifyRateLimit) {
      dispatchRateLimitToast();
      const message = (data && (data.message || data.error)) || RATE_LIMIT_ERROR_MESSAGE;
      throw new Error(message);
    }

    const message = (data && (data.message || data.error)) || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export function handleJson(response) {
  return handleJsonResponse(response, {
    logErrors: true,
    notifyRateLimit: true
  });
}
