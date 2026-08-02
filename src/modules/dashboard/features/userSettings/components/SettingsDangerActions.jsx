import { LogoutIcon } from './UserSettingsIcons';

const DeleteButton = ({ className, onClick, iconClassName }) => (
  <button type="button" onClick={onClick} className={className}>
    <img src="/icons/delete.svg" alt="" className={iconClassName} />
    <span>Delete Account</span>
  </button>
);

const LogoutButton = ({ className, iconSize, onClick }) => (
  <button type="button" onClick={onClick} className={className}>
    <LogoutIcon size={iconSize} />
    <span>Log out</span>
  </button>
);

const SettingsDangerActions = ({ isMobile = false, onDelete, onLogout }) => {
  if (isMobile) {
    return (
      <div className="px-4 py-4 border-t border-gray-200 bg-white space-y-3">
        <DeleteButton
          onClick={onDelete}
          className="w-full flex items-center gap-3 text-red-600 hover:text-red-700 transition-colors text-base font-medium"
          iconClassName="w-5 h-5"
        />
        <LogoutButton
          onClick={onLogout}
          iconSize={20}
          className="w-full flex items-center gap-3 text-red-600 hover:text-red-700 transition-colors text-base font-medium"
        />
      </div>
    );
  }

  return (
    <div className="ml-6">
      <DeleteButton
        onClick={onDelete}
        className="flex items-center gap-3 text-red-500 hover:text-red-400 mb-4"
        iconClassName="w-4 h-4 sm:w-5 sm:h-5"
      />
      <LogoutButton
        onClick={onLogout}
        iconSize={18}
        className="flex items-center gap-3 text-red-500 hover:text-red-400"
      />
    </div>
  );
};

export default SettingsDangerActions;
