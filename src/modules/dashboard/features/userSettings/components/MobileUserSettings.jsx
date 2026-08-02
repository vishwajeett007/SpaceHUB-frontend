import AccountSettingsFields from './AccountSettingsFields';
import ProfileImagePicker from './ProfileImagePicker';
import SettingsDangerActions from './SettingsDangerActions';

const MobileUserSettings = ({ account, profileImage, deleteDialog, actions }) => (
  <div className="md:hidden flex-1 overflow-hidden bg-[#E6E6E6]">
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <ProfileImagePicker profileImage={profileImage} isMobile />
        <div className="border-t border-gray-200 mb-4" />
        <AccountSettingsFields account={account} isMobile />
      </div>

      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <button
          type="button"
          onClick={actions.save}
          disabled={actions.isSaving || account.usernameTooLong}
          className="w-full bg-purple-600 text-white py-3 rounded-md font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {actions.isSaving ? 'Saving...' : 'Save profile'}
        </button>
      </div>

      <SettingsDangerActions
        isMobile
        onDelete={deleteDialog.open}
        onLogout={actions.logout}
      />
    </div>
  </div>
);

export default MobileUserSettings;
