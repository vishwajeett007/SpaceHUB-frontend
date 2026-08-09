import { useSelector } from 'react-redux';
import logo from '../../../../../assets/landing/logo-removebg-preview.svg';
import { useCommunitySettings } from '../hooks/useCommunitySettings';
import { selectUnreadCount } from '../../../../../shared/store/slices/inboxSlice';

const LeaveIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

export const SettingsHeader = () => {
  const { navigation } = useCommunitySettings();
  const unreadCount = useSelector(selectUnreadCount);

  return (
    <div className="sticky top-0 z-20 bg-white md:bg-gray-200 border-b border-gray-200 md:border-gray-300 h-14 md:h-20 flex items-center px-4 md:rounded-b-xl">
      <div className="flex items-center gap-2">
        <button onClick={navigation.goBack} className="cursor-pointer hover:opacity-80 transition-opacity">
          <img src="/back arrow.svg" alt="Back" className="w-6 h-6" />
        </button>
        <button onClick={navigation.goHome} className="hidden md:block cursor-pointer hover:opacity-80 transition-opacity">
          <img src={logo} alt="Logo" className="w-7 h-7 object-contain" />
        </button>
      </div>
      <div className="flex-1 text-center flex items-center justify-center gap-2">
        <h1 className="text-lg font-semibold text-gray-800">Settings</h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={navigation.openInbox}
          title="Inbox"
          className="relative w-7 h-7 flex items-center justify-center hover:bg-gray-300 rounded-md transition-colors"
        >
          <img src="/icons/inbox.svg" alt="Inbox" className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white pointer-events-none" />
          )}
        </button>
      </div>
    </div>
  );
};

export const MobileSettingsNavigation = () => {
  const { navigation, dialogs } = useCommunitySettings();

  return (
    <div className="flex-1 p-6 space-y-3">
      <button
        onClick={() => navigation.selectSection('profile')}
        className="w-full text-left px-4 py-4 rounded-md bg-gray-300 hover:bg-zinc-400 transition-colors text-base font-medium text-gray-800"
      >
        Community Profile
      </button>
      <button
        onClick={() => navigation.selectSection('channels')}
        className="w-full text-left px-4 py-4 rounded-md bg-gray-300 hover:bg-zinc-400 transition-colors text-base font-medium text-gray-800"
      >
        Group
      </button>
      <button
        onClick={() => navigation.selectSection('roles')}
        className="w-full text-left px-4 py-4 rounded-md bg-gray-300 hover:bg-zinc-400 transition-colors text-base font-medium text-gray-800"
      >
        Roles
      </button>

      <div className="pt-4 space-y-3 border-t border-gray-200 mt-4">
        <button
          onClick={dialogs.deleteCommunity.open}
          className="w-full text-left px-4 py-4 rounded-md text-red-600 hover:bg-red-100 transition-colors text-base font-medium flex items-center gap-3"
        >
          <img src="/icons/delete.svg" alt="Delete community" className="w-5 h-5" />
          Delete community
        </button>
        <button
          onClick={dialogs.leaveCommunity.open}
          className="w-full text-left px-4 py-4 rounded-md text-red-600 hover:bg-red-100 transition-colors text-base font-medium flex items-center gap-3"
        >
          <LeaveIcon />
          Leave Community
        </button>
      </div>
    </div>
  );
};

const DesktopNavigationItem = ({ section, children }) => {
  const { navigation } = useCommunitySettings();
  const isActive = navigation.activeSection === section;
  const activeClass = section === 'roles' ? 'bg-gray-600 text-white' : 'bg-white text-gray-900';

  return (
    <button
      onClick={() => navigation.selectSection(section)}
      className={`w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive ? activeClass : 'text-white hover:bg-gray-700'
      }`}
    >
      {children}
    </button>
  );
};

export const DesktopSettingsSidebar = () => {
  const { community, navigation, dialogs } = useCommunitySettings();

  return (
    <div className="w-64 bg-[#282828] border-r border-gray-700 flex flex-col">
      <div className="p-4">
        <button onClick={navigation.goBack} className="text-white hover:text-gray-300 transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="px-4 pb-4">
        <h3 className="text-lg font-semibold text-white">{community.title}</h3>
      </div>

      <div className="flex-1 px-2 space-y-1">
        <DesktopNavigationItem section="profile">Community profile</DesktopNavigationItem>
        <DesktopNavigationItem section="channels">Groups</DesktopNavigationItem>
        <DesktopNavigationItem section="roles">Roles</DesktopNavigationItem>
      </div>

      <div className="px-4 py-4 border-t border-gray-700 space-y-2">
        <button
          onClick={dialogs.deleteCommunity.open}
          className="w-full text-left px-4 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <img src="/icons/delete.svg" alt="Delete community" className="w-4 h-4" />
          Delete community
        </button>
        <button
          onClick={dialogs.leaveCommunity.open}
          className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <LeaveIcon size={16} />
          Leave community
        </button>
      </div>
    </div>
  );
};
