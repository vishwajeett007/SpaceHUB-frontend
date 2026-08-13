import { authenticatedFetch, BASE_URL } from './client';
import { handleJson } from './response';

export async function setUsername({ email, username }) {
  const payload = { email, username };
  const response = await authenticatedFetch(`${BASE_URL}dashboard/set-username`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleJson(response);
}

export async function sendWelcomeEmail({ to, subject, message }) {
  const response = await authenticatedFetch(`${BASE_URL}dashboard/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, message })
  });
  return handleJson(response);
}

export async function uploadProfileImage({ imageFile }) {
  const formData = new FormData();
  formData.append('file', imageFile);
  const response = await authenticatedFetch(`${BASE_URL}profile/avatar`, {
    method: 'POST',
    body: formData
  });
  return handleJson(response);
}

export async function uploadCoverPhoto({ imageFile }) {
  const formData = new FormData();
  formData.append('file', imageFile);
  const response = await authenticatedFetch(`${BASE_URL}profile/cover`, {
    method: 'POST',
    body: formData
  });
  return handleJson(response);
}

export async function uploadFileAndGetUrl(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await authenticatedFetch(`${BASE_URL}files/upload-and-get-url`, {
    method: 'POST',
    body: formData
  });

  const data = await handleJson(response);

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Failed to upload file');
  }

  return {
    fileKey: data?.data?.fileKey || data?.fileKey || null,
    fileUrl: data?.data?.fileUrl || data?.fileUrl || null,
    fileName: data?.data?.fileName || data?.fileName || file.name,
    contentType: data?.data?.contentType || data?.contentType || file.type || 'application/octet-stream'
  };
}

export async function deleteAccount({ email, currentPassword }) {
  const response = await authenticatedFetch(`${BASE_URL}profile/delete`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, currentPassword })
  });
  return handleJson(response);
}

export async function getProfileSummary() {
  const response = await authenticatedFetch(`${BASE_URL}profile/getProfile`, {
    method: 'GET'
  });
  const data = await handleJson(response);
  if (data && data.data) {
    const profile = data.data;
    const avatarUrl = profile.avatarPreviewUrl || profile.avatarUrl || null;
    profile.avatarUrl = avatarUrl;
    profile.profileImage = avatarUrl;
  }
  return data;
}

export async function updateProfile({ currentPassword, newPassword, firstName, lastName, bio, dateOfBirth, username }) {
  const payload = {
    currentPassword,
    newPassword,
    firstName,
    lastName,
    bio,
    dateOfBirth,
    username
  };
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

  const response = await authenticatedFetch(`${BASE_URL}profile/updateProfile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleJson(response);
}

export async function getPresignedDownloadUrl(file, contentType = 'image/png') {
  const response = await authenticatedFetch(`${BASE_URL}files/presigned/download`, {
    method: 'POST',
    dedupe: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file, contentType })
  });
  const data = await handleJson(response);
  return data?.data || data?.url || null;
}
