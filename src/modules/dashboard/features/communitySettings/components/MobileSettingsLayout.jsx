import { useCommunitySettings } from '../hooks/useCommunitySettings';
import { MobileGroupsSettingsSection } from './GroupsSettingsSection';
import { MobileProfileSettingsSection } from './ProfileSettingsSection';
import { MobileRolesSettingsSection } from './RolesSettingsSection';
import { MobileSettingsNavigation } from './SettingsNavigation';

const MobileActionBar = () => {
  const { navigation, profile, groups, roles } = useCommunitySettings();

  if (navigation.activeSection === 'profile') {
    return (
      <div className="bg-white border-t border-gray-200 p-2 flex gap-2">
        <button
          onClick={profile.discard}
          className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-semibold transition-colors text-sm"
        >
          Don't save
        </button>
        <button
          onClick={profile.save}
          disabled={!profile.hasChanges || profile.saving}
          className={`flex-1 px-3 py-2 rounded-lg font-semibold transition-colors text-sm ${
            profile.hasChanges && !profile.saving
              ? 'bg-gray-800 hover:bg-gray-900 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {profile.saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    );
  }

  if (navigation.activeSection === 'channels') {
    return (
      <div className="bg-white border-t border-gray-200 p-2 flex gap-2">
        <button
          onClick={groups.discard}
          className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-semibold transition-colors text-sm"
        >
          Don't save
        </button>
        <button
          onClick={groups.save}
          disabled={!groups.hasChanges}
          className={`flex-1 px-3 py-2 rounded-lg font-semibold transition-colors text-sm ${
            groups.hasChanges
              ? 'bg-gray-800 hover:bg-gray-900 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Save changes
        </button>
      </div>
    );
  }

  if (navigation.activeSection === 'roles') {
    return (
      <div className="bg-white border-t border-gray-200 p-2 flex gap-2">
        <button
          onClick={roles.discard}
          disabled={!roles.hasChanges}
          className={`flex-1 px-3 py-2 rounded-lg font-semibold transition-colors text-sm ${
            roles.hasChanges
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Don't save
        </button>
        <button
          onClick={roles.save}
          disabled={!roles.hasChanges || roles.saving}
          className={`flex-1 px-3 py-2 rounded-lg font-semibold transition-colors text-sm ${
            roles.hasChanges && !roles.saving
              ? 'bg-gray-800 hover:bg-gray-900 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {roles.saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    );
  }

  return null;
};

const MobileSection = () => {
  const { navigation } = useCommunitySettings();

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
      {navigation.activeSection === 'profile' && <MobileProfileSettingsSection />}
      {navigation.activeSection === 'channels' && <MobileGroupsSettingsSection />}
      {navigation.activeSection === 'roles' && <MobileRolesSettingsSection />}
      <MobileActionBar />
    </div>
  );
};

const MobileSettingsLayout = () => {
  const { navigation } = useCommunitySettings();
  const showNavigation = navigation.activeSection === null || navigation.activeSection === 'sidebar';

  return (
    <div className="md:hidden w-full h-full bg-white flex flex-col">
      {showNavigation ? <MobileSettingsNavigation /> : <MobileSection />}
    </div>
  );
};

export default MobileSettingsLayout;
