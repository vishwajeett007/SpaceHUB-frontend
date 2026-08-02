import { CloseIcon } from './UserSettingsIcons';

const DeleteAccountDialog = ({ dialog }) => {
  if (!dialog.isOpen) return null;

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && dialog.password.trim() && !dialog.isDeleting) {
      dialog.confirm();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-lg md:rounded-xl p-5 md:p-8 max-w-md w-full relative max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        aria-describedby="delete-account-description"
      >
        <button
          type="button"
          onClick={dialog.close}
          className="absolute top-3 md:top-4 right-3 md:right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close delete account dialog"
        >
          <CloseIcon className="w-6 h-6" size={24} strokeWidth={2} />
        </button>

        <h2 id="delete-account-title" className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
          Delete Account
        </h2>
        <p id="delete-account-description" className="text-sm md:text-base text-gray-600 mb-6">
          This action cannot be undone. Please enter your current password to confirm account deletion.
        </p>

        <div className="mb-6">
          <label htmlFor="delete-account-password" className="block text-sm font-medium text-gray-700 mb-2">
            Current Password
          </label>
          <input
            id="delete-account-password"
            type="password"
            value={dialog.password}
            onChange={(event) => dialog.setPassword(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your current password"
            autoComplete="current-password"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            autoFocus
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={dialog.close}
            disabled={dialog.isDeleting}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={dialog.confirm}
            disabled={dialog.isDeleting || !dialog.password.trim()}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {dialog.isDeleting ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountDialog;
