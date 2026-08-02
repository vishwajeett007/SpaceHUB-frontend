import { getStoredUserEmail } from '../../../shared/services/authStorage';

export const resolveDashboardAssetUrl = (rawUrl, baseUrl) => {
  if (!rawUrl) return '';
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;

  const absoluteUrl = `${baseUrl || ''}${rawUrl}`;
  try {
    return encodeURI(absoluteUrl);
  } catch {
    return absoluteUrl;
  }
};

export const readStoredUserEmail = () => {
  return getStoredUserEmail();
};
