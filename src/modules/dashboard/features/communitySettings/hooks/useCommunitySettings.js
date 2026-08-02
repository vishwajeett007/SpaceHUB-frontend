import { useContext } from 'react';
import { CommunitySettingsContext } from '../context/CommunitySettingsContext';

export const useCommunitySettings = () => {
  const settings = useContext(CommunitySettingsContext);

  if (!settings) {
    throw new Error('useCommunitySettings must be used inside CommunitySettingsProvider');
  }

  return settings;
};
