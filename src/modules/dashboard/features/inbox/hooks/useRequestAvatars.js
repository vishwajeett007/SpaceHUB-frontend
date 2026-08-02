import { useEffect, useMemo, useState } from 'react';
import { getPresignedDownloadUrl } from '../../../../../shared/services/API';
import { attachResolvedAvatars } from '../utils/requestNormalization';
import {
  getAvatarContentType,
  getUnresolvedAvatarFiles,
} from '../utils/requestAvatars';

export const useRequestAvatars = (requests) => {
  const [avatarUrls, setAvatarUrls] = useState({});

  useEffect(() => {
    const filesToFetch = getUnresolvedAvatarFiles(requests, avatarUrls);
    if (filesToFetch.length === 0) return undefined;

    let cancelled = false;

    const fetchAvatarUrls = async () => {
      const resolvedEntries = await Promise.all(filesToFetch.map(async (filePath) => {
        try {
          const url = await getPresignedDownloadUrl(
            filePath,
            getAvatarContentType(filePath),
          );
          return url ? [filePath, url] : null;
        } catch (error) {
          console.error(`Failed to get presigned URL for ${filePath}:`, error);
          return null;
        }
      }));

      if (cancelled) return;

      setAvatarUrls((currentUrls) => {
        const nextUrls = { ...currentUrls };
        let hasChanges = false;

        resolvedEntries.forEach((entry) => {
          if (!entry) return;
          const [filePath, url] = entry;
          if (nextUrls[filePath] !== url) {
            nextUrls[filePath] = url;
            hasChanges = true;
          }
        });

        return hasChanges ? nextUrls : currentUrls;
      });
    };

    fetchAvatarUrls();

    return () => {
      cancelled = true;
    };
  }, [avatarUrls, requests]);

  const requestsWithAvatars = useMemo(
    () => attachResolvedAvatars(requests, avatarUrls),
    [avatarUrls, requests],
  );

  return { avatarUrls, requestsWithAvatars };
};
