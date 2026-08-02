import CommunitySettingsModals from './components/CommunitySettingsModals';
import DesktopSettingsLayout from './components/DesktopSettingsLayout';
import MobileSettingsLayout from './components/MobileSettingsLayout';
import { SettingsHeader } from './components/SettingsNavigation';
import { useCommunitySettings } from './hooks/useCommunitySettings';

const CommunitySettingsView = () => {
  const { status, community, navigation } = useCommunitySettings();

  if (status.loading) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-700">Loading...</div>
      </div>
    );
  }

  if (status.error || !community.data) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{status.error || 'Community not found'}</div>
          <button
            onClick={navigation.goBack}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Back to Community
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 md:bg-gray-100 flex flex-col overflow-x-hidden">
      <SettingsHeader />
      <div className="flex-1 bg-gray-100 md:bg-gray-100 flex items-center justify-center p-0 md:p-6 overflow-y-auto">
        <MobileSettingsLayout />
        <DesktopSettingsLayout />
      </div>
      <CommunitySettingsModals />
    </div>
  );
};

export default CommunitySettingsView;
