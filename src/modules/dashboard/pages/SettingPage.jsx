import {
  DeleteAccountDialog,
  DesktopUserSettings,
  MobileUserSettings,
  useUserSettingsController,
} from '../features/userSettings';

const SettingPage = () => {
  const settings = useUserSettingsController();

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      <input
        ref={settings.profileImage.fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={settings.profileImage.handleImageChange}
      />

      <div className="md:hidden sticky top-0 z-20 bg-white border-b border-gray-200 h-14 flex items-center px-4">
        <button
          type="button"
          onClick={settings.actions.goToDashboard}
          className="p-2 -ml-2 text-gray-700 hover:text-gray-900"
          aria-label="Return to dashboard"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold text-gray-800">Settings</h1>
        </div>
      </div>

      <div className="hidden md:block sticky top-0 z-20 bg-gray-200 border-b border-gray-300 h-14 flex items-center px-4 rounded-b-lg">
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold text-gray-800">Settings</h1>
        </div>
      </div>

      <MobileUserSettings {...settings} />
      <DesktopUserSettings {...settings} />
      <DeleteAccountDialog dialog={settings.deleteDialog} />
    </div>
  );
};

export default SettingPage;
