import SettingsField from './SettingsField';
import {
  EditIcon,
  EmailIcon,
  PasswordVisibilityIcon,
} from './UserSettingsIcons';

const PasswordToggle = ({ isVisible, isMobile, onToggle, label }) => (
  <button
    type="button"
    onClick={onToggle}
    className={isMobile ? 'text-gray-500 hover:text-gray-700' : 'text-gray-300 hover:text-white'}
    aria-label={`${isVisible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
  >
    <PasswordVisibilityIcon isVisible={isVisible} isMobile={isMobile} />
  </button>
);

const AccountSettingsFields = ({ account, isMobile = false }) => (
  <div className={isMobile ? 'space-y-0' : undefined}>
    <SettingsField
      label="Username"
      value={account.username}
      onChange={account.setUsername}
      placeholder="Username"
      isMobile={isMobile}
      autoComplete="username"
      rightIcon={isMobile ? null : <EditIcon />}
    />
    {account.usernameTooLong && (
      <div className={isMobile ? 'text-red-500 text-xs -mt-2 mb-1' : 'text-red-400 text-xs -mt-4 mb-4'}>
        Max 15 characters.
      </div>
    )}

    <SettingsField
      label="Email"
      value={account.email}
      placeholder="Email"
      readOnly
      isMobile={isMobile}
      autoComplete="email"
      rightIcon={isMobile ? null : <EmailIcon />}
    />

    <SettingsField
      label="Old password"
      type={account.showOldPassword ? 'text' : 'password'}
      value={account.oldPassword}
      onChange={account.setOldPassword}
      placeholder="Old password"
      isMobile={isMobile}
      autoComplete="current-password"
      rightIcon={(
        <PasswordToggle
          isVisible={account.showOldPassword}
          isMobile={isMobile}
          onToggle={account.toggleOldPasswordVisibility}
          label="Old password"
        />
      )}
    />

    <SettingsField
      label="New password"
      type={account.showNewPassword ? 'text' : 'password'}
      value={account.newPassword}
      onChange={account.setNewPassword}
      placeholder="New password"
      isMobile={isMobile}
      autoComplete="new-password"
      rightIcon={(
        <PasswordToggle
          isVisible={account.showNewPassword}
          isMobile={isMobile}
          onToggle={account.toggleNewPasswordVisibility}
          label="New password"
        />
      )}
    />
  </div>
);

export default AccountSettingsFields;
