import AccountSettingsFields from './AccountSettingsFields';
import ProfileImagePicker from './ProfileImagePicker';
import SettingsDangerActions from './SettingsDangerActions';
import { BackIcon } from './UserSettingsIcons';

const DesktopUserSettings = ({ account, profileImage, deleteDialog, actions }) => (
  <div className="hidden md:block max-w-6xl w-full mx-auto bg-white rounded-xl border border-gray-300 overflow-hidden mt-4">
    <div className="flex p-5 bg-gray-300 rounded-xl">
      <aside className="w-72 bg-[#1f1f1f] text-white p-5 rounded-l-xl border-r border-gray-700">
        <div className="flex items-center mb-6">
          <button
            type="button"
            onClick={actions.goToDashboard}
            className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-white/10"
            aria-label="Return to dashboard"
          >
            <BackIcon className="text-white" />
          </button>
          <div className="ml-3 bg-white text-black rounded-md px-3 py-1 text-sm">
            Main profile
          </div>
        </div>

        <SettingsDangerActions
          onDelete={deleteDialog.open}
          onLogout={actions.logout}
        />
      </aside>

      <main className="flex-1 bg-[#1f1f1f] text-white p-6 rounded-r-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Main profile</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={actions.goBack}
              className="px-4 py-2 rounded-md bg-white/10 text-white hover:bg-white/20"
            >
              Back
            </button>
            <button
              type="button"
              onClick={actions.save}
              disabled={actions.isSaving || account.usernameTooLong}
              className="px-4 py-2 rounded-md bg-indigo-200 text-black hover:bg-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actions.isSaving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>

        <div className="mb-4 text-gray-300">Profile</div>
        <ProfileImagePicker profileImage={profileImage} />
        <AccountSettingsFields account={account} />
      </main>
    </div>
  </div>
);

export default DesktopUserSettings;
