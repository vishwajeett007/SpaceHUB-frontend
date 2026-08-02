import { useCommunitySettings } from '../hooks/useCommunitySettings';

const GroupList = ({ mobile }) => {
  const { groups } = useCommunitySettings();

  if (groups.loading) {
    return (
      <div className={mobile ? 'text-gray-500 text-xs' : 'text-gray-400 text-sm'}>
        Loading groups...
      </div>
    );
  }

  return (
    <>
      <div className={mobile ? 'space-y-2' : 'space-y-3'}>
        {groups.items.map((group, index) => {
          const charCount = (group.name || '').length;

          return (
            <div key={group.id || index} className="flex flex-col gap-1">
              <div className={`flex items-center ${mobile ? 'gap-2' : 'gap-3'}`}>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={group.name || ''}
                    onChange={(event) => groups.change(index, event.target.value)}
                    onBlur={() => groups.finishEditing(index)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') groups.finishEditing(index);
                    }}
                    className={mobile
                      ? 'w-full bg-gray-200 border border-gray-300 text-gray-800 px-3 py-2 rounded-lg outline-none placeholder:text-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm'
                      : 'w-full bg-gray-700 text-white px-4 py-3 rounded-md outline-none placeholder:text-gray-400'}
                    placeholder="Group name"
                    autoFocus={groups.editingGroupId === index}
                    maxLength={30}
                  />
                </div>
                <button
                  onClick={() => groups.edit(index)}
                  className={mobile
                    ? 'text-gray-600 hover:text-gray-800 transition-colors p-1.5'
                    : 'text-white hover:text-gray-300 transition-colors p-2'}
                  title="Edit group"
                >
                  <svg width={mobile ? 18 : 20} height={mobile ? 18 : 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => groups.requestDelete(index)}
                  className={mobile
                    ? 'text-red-600 hover:text-red-700 transition-colors p-1.5'
                    : 'text-orange-500 hover:text-orange-400 transition-colors p-2'}
                  title="Delete group"
                >
                  <img src="/icons/delete.svg" alt="Delete group" className={mobile ? 'w-4 h-4' : 'w-5 h-5'} />
                </button>
              </div>
              <div className="flex items-center justify-end pr-12">
                <p className={mobile ? 'text-xs text-gray-500' : 'text-sm text-gray-400'}>
                  {charCount}/30{mobile ? '' : ' characters'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {groups.items.length === 0 && (
        <div className={mobile ? 'text-gray-500 text-xs mt-2' : 'text-gray-400 text-sm mt-4'}>
          No groups yet.
        </div>
      )}
    </>
  );
};

export const MobileGroupsSettingsSection = () => (
  <div className="flex-1 p-3 overflow-hidden">
    <div className="bg-white rounded-xl shadow-md p-4 h-full flex flex-col">
      <h2 className="text-lg font-bold text-gray-800 mb-3">Group</h2>
      <h3 className="text-sm font-semibold text-gray-800 mb-2">Group name</h3>
      <div className="flex-1 overflow-y-auto">
        <GroupList mobile />
      </div>
    </div>
  </div>
);

export const DesktopGroupsSettingsSection = () => {
  const { groups, navigation } = useCommunitySettings();

  return (
    <div className="p-8 h-full flex flex-col overflow-y-auto" style={{ height: '100%' }}>
      <div className="flex items-center justify-between mb-8 flex-shrink-0">
        <h2 className="text-3xl font-bold text-white">Groups</h2>
        <div className="flex items-center gap-3">
          <button onClick={navigation.goBack} className="px-4 py-2 text-gray-300 hover:text-white transition-colors">
            Back
          </button>
          <button
            onClick={groups.save}
            disabled={!groups.hasChanges}
            className={`px-6 py-2 rounded-md font-semibold transition-colors ${
              groups.hasChanges
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Save changes
          </button>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Group names</h3>
        <GroupList mobile={false} />
      </div>
    </div>
  );
};
