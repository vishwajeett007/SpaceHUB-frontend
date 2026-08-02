export const getAvatarContentType = (filePath) => {
  const normalizedPath = filePath.toLowerCase();

  if (normalizedPath.endsWith('.png')) return 'image/png';
  if (normalizedPath.endsWith('.jpg') || normalizedPath.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (normalizedPath.endsWith('.gif')) return 'image/gif';
  if (normalizedPath.endsWith('.webp')) return 'image/webp';

  return 'image/png';
};

export const getUnresolvedAvatarFiles = (requests, avatarUrls) => [
  ...new Set(
    requests
      .map((request) => request.avatarFile)
      .filter((filePath) => filePath && !avatarUrls[filePath]),
  ),
];
