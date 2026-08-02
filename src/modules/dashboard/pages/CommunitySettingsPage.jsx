import CommunitySettingsProvider from '../features/communitySettings/CommunitySettingsProvider';
import CommunitySettingsView from '../features/communitySettings/CommunitySettingsView';

const CommunitySettingsPage = () => (
  <CommunitySettingsProvider>
    <CommunitySettingsView />
  </CommunitySettingsProvider>
);

export default CommunitySettingsPage;
