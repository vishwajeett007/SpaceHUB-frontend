import { CommunitySettingsContext } from './context/CommunitySettingsContext';
import { useCommunitySettingsController } from './hooks/useCommunitySettingsController';

const CommunitySettingsProvider = ({ children }) => {
  const controller = useCommunitySettingsController();

  return (
    <CommunitySettingsContext.Provider value={controller}>
      {children}
    </CommunitySettingsContext.Provider>
  );
};

export default CommunitySettingsProvider;
