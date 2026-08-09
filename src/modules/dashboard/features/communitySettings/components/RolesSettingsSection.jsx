import { getDisplayRole } from '../utils/communitySettings';
import { useCommunitySettings } from '../hooks/useCommunitySettings';

const MemberAvatar = ({ member, mobile }) => {
  const initial = (member.username || member.email || 'U').charAt(0).toUpperCase();

  if (mobile) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {member.avatarPreviewUrl ? (
          <img
            src={member.avatarPreviewUrl}
            alt={member.username || member.email}
            className="w-full h-full rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="text-gray-600 font-semibold text-sm">{initial}</span>
        )}
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0 overflow-hidden">
      {member.avatarPreviewUrl ? (
        <img
          src={member.avatarPreviewUrl}
          alt={member.username || member.email}
          className="w-full h-full rounded-full object-cover"
          referrerPolicy="no-referrer"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
            if (event.currentTarget.nextSibling) {
              event.currentTarget.nextSibling.style.display = 'flex';
            }
          }}
        />
      ) : null}
      <span
        className="text-gray-800 font-semibold text-sm"
        style={{ display: member.avatarPreviewUrl ? 'none' : 'flex' }}
      >
        {initial}
      </span>
    </div>
  );
};

const MobileOwnerCard = () => {
  const { roles } = useCommunitySettings();
  if (!roles.owner) return null;

  return (
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-gray-800 mb-2">Community admin</h3>
      <div className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 flex items-center gap-2">
        <MemberAvatar member={roles.owner} mobile />
        <div className="flex-1 min-w-0">
          <div className="text-gray-800 font-medium truncate text-sm">
            {roles.owner.username || roles.owner.email}
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

const DesktopOwnerCard = () => {
  const { roles } = useCommunitySettings();
  if (!roles.owner) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Community owner</h3>
        <button onClick={roles.toggleOwnerSection} className="text-gray-400 hover:text-white transition-colors">
          <svg
            className={`w-5 h-5 transition-transform ${roles.showOwnerSection ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      {roles.showOwnerSection && (
        <div className="bg-gray-700 rounded-lg px-4 py-3 flex items-center gap-3">
          <MemberAvatar member={roles.owner} mobile={false} />
          <div className="flex-1">
            <div className="text-white font-medium">
              {roles.owner.username || roles.owner.email}
              {roles.owner.role && (
                <span className="ml-2 text-gray-300 text-sm">
                  {getDisplayRole(roles.owner.role)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MemberSearch = ({ mobile }) => {
  const { roles } = useCommunitySettings();

  return (
    <div className={mobile ? 'mb-3' : 'mb-6'}>
      <div className="relative">
        <svg
          className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 ${mobile ? 'left-2 w-4 h-4' : 'left-3 w-5 h-5'
            }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search"
          value={roles.searchQuery}
          onChange={(event) => roles.setSearchQuery(event.target.value)}
          className={mobile
            ? 'w-full bg-white border border-gray-300 text-gray-800 px-8 py-2 rounded-lg outline-none placeholder:text-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm'
            : 'w-full bg-gray-700 text-white px-10 py-2.5 rounded-md outline-none placeholder:text-gray-400'}
        />
      </div>
    </div>
  );
};

const RoleMenu = ({ member, targetKey, memberId, role, mobile }) => {
  const { roles } = useCommunitySettings();
  const isAdmin = role === 'ADMIN';
  const isWorkspaceOwner = role === 'WORKSPACE_OWNER' || role === 'OWNER';
  const isMember = role === 'MEMBER';

  return (
    <div
      className="relative"
      ref={(element) => roles.registerDropdown(memberId, mobile ? 'mobile' : 'desktop', element)}
    >
      <button
        onClick={() => roles.toggleDropdown(memberId)}
        className={`text-gray-400 transition-colors p-1 ${mobile ? 'hover:text-gray-600' : 'hover:text-white'}`}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </button>
      {roles.openDropdownId === memberId && (
        <div className={mobile
          ? 'absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg z-50 min-w-[180px] border border-gray-200'
          : 'absolute right-0 top-full mt-1 bg-gray-800 rounded-md shadow-lg z-50 min-w-[200px] border border-gray-700'}
        >
          {!isAdmin && (
            <button
              onClick={() => roles.changeRole(targetKey, 'ADMIN')}
              className={mobile
                ? 'w-full text-left px-3 py-2 text-xs text-gray-800 hover:bg-gray-100 transition-colors'
                : 'w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors'}
            >
              Change role to Admin
            </button>
          )}
          {!isWorkspaceOwner && (
            <button
              onClick={() => roles.changeRole(targetKey, 'WORKSPACE_OWNER')}
              className={mobile
                ? 'w-full text-left px-3 py-2 text-xs text-gray-800 hover:bg-gray-100 transition-colors'
                : 'w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors'}
            >
              Change role to Workspace Owner
            </button>
          )}
          {!isMember && (
            <button
              onClick={() => roles.changeRole(targetKey, 'MEMBER')}
              className={mobile
                ? 'w-full text-left px-3 py-2 text-xs text-gray-800 hover:bg-gray-100 transition-colors'
                : 'w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors'}
            >
              Change role to Member
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const MemberRow = ({ member, mobile }) => {
  const { roles } = useCommunitySettings();
  const targetKey = member.email || member.username || member.userId || member.id;
  const memberId = targetKey;
  const originalRole = (member.role || 'MEMBER').toUpperCase();
  const role = (roles.roleChanges[targetKey] || originalRole).toUpperCase();
  const isCurrentUser = Boolean(
    member.email
    && roles.currentUserEmail
    && member.email.toLowerCase() === roles.currentUserEmail.toLowerCase()
  );

  return (
    <div className={mobile
      ? 'bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 flex items-center gap-2'
      : 'bg-gray-700 rounded-lg px-4 py-3 flex items-center gap-3 relative'}
    >
      <MemberAvatar member={member} mobile={mobile} />
      <div className={mobile ? 'flex-1 min-w-0' : 'flex-1'}>
        <div className={`${mobile ? 'text-gray-800 truncate text-sm' : 'text-white'} font-medium`}>
          {member.username || member.email}
          {!mobile && role && (
            <span className="ml-2 text-gray-300 text-sm">{getDisplayRole(role)}</span>
          )}
        </div>
        {mobile && role && (
          <div className="text-xs text-gray-500">{getDisplayRole(role)}</div>
        )}
      </div>
      {!isCurrentUser && (
        <RoleMenu member={member} targetKey={targetKey} memberId={memberId} role={role} mobile={mobile} />
      )}
    </div>
  );
};

const MembersList = ({ mobile }) => {
  const { roles } = useCommunitySettings();

  if (roles.loading) {
    return (
      <div className={mobile ? 'text-gray-500 text-xs' : 'text-gray-400 text-sm'}>
        Loading members...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {roles.members.map((member) => (
        <MemberRow key={member.email || member.id} member={member} mobile={mobile} />
      ))}
      {roles.members.length === 0 && (
        <div className={mobile
          ? 'text-gray-500 text-xs text-center py-4'
          : 'text-gray-400 text-sm text-center py-8'}
        >
          {roles.searchQuery.trim() ? 'No members found' : 'No members yet'}
        </div>
      )}
    </div>
  );
};

export const MobileRolesSettingsSection = () => (
  <div className="flex-1 p-3 overflow-hidden">
    <div className="bg-white rounded-xl shadow-md p-4 h-full flex flex-col">
      <h2 className="text-lg font-bold text-gray-800 mb-3">Roles</h2>
      <div className="flex-1 overflow-y-auto">
        <MobileOwnerCard />
        <MemberSearch mobile />
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Community Members</h3>
          <MembersList mobile />
        </div>
      </div>
    </div>
  </div>
);

export const DesktopRolesSettingsSection = () => {
  const { roles } = useCommunitySettings();

  return (
    <div className="p-8 h-full flex flex-col overflow-y-auto" style={{ height: '100%' }}>
      <div className="flex items-center justify-between mb-8 flex-shrink-0">
        <h2 className="text-3xl font-bold text-white">Roles</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={roles.discard}
            disabled={!roles.hasChanges}
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${roles.hasChanges
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
          >
            Don't save
          </button>
          <button
            onClick={roles.save}
            disabled={!roles.hasChanges || roles.saving}
            className={`px-6 py-2 rounded-md font-semibold transition-colors ${roles.hasChanges && !roles.saving
                ? 'bg-indigo-200 hover:bg-indigo-300 text-black'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
          >
            {roles.saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>

      <DesktopOwnerCard />
      <MemberSearch mobile={false} />
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Community Members</h3>
        <MembersList mobile={false} />
      </div>
    </div>
  );
};
