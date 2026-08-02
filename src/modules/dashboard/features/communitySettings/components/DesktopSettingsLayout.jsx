import { useCommunitySettings } from '../hooks/useCommunitySettings';
import { DesktopGroupsSettingsSection } from './GroupsSettingsSection';
import { DesktopProfileSettingsSection } from './ProfileSettingsSection';
import { DesktopRolesSettingsSection } from './RolesSettingsSection';
import { DesktopSettingsSidebar } from './SettingsNavigation';

const DesktopSettingsLayout = () => {
  const { navigation } = useCommunitySettings();

  return (
    <div
      className="hidden md:block bg-gray-200 rounded-2xl w-full max-w-6xl flex flex-col shadow-lg"
      style={{ height: 'calc(100vh - 5rem - 3rem)', minHeight: '600px' }}
    >
      <div className="flex-1 flex bg-[#282828] rounded-2xl overflow-hidden" style={{ height: '100%' }}>
        <DesktopSettingsSidebar />
        <div className="flex-1 bg-[#282828] overflow-hidden" style={{ height: '100%', minHeight: '600px' }}>
          {navigation.activeSection === 'profile' && <DesktopProfileSettingsSection />}
          {navigation.activeSection === 'channels' && <DesktopGroupsSettingsSection />}
          {navigation.activeSection === 'roles' && <DesktopRolesSettingsSection />}
        </div>
      </div>
    </div>
  );
};

export default DesktopSettingsLayout;
