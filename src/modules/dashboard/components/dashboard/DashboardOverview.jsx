import DashboardList from './DashboardList';

const emptyStates = {
  Community: {
    title: 'No community joined',
    subtitle: "You haven't joined any communities yet. Explore and connect with others who share your interests — your next great conversation might be waiting!",
  },
  'Local-Groups': {
    title: 'No Local-Groups yet',
    subtitle: "You haven't joined any Local-Groups yet. Explore and connect with others who share your interests",
  },
};

const MobileTabs = ({ activeTab, onTabChange }) => (
  <div className="flex gap-2">
    <button
      type="button"
      onClick={() => onTabChange('Community')}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        activeTab === 'Community' ? 'bg-purple-600 text-white' : 'text-gray-600 bg-transparent'
      }`}
    >
      Community
    </button>
    <button
      type="button"
      onClick={() => onTabChange('Local-Groups')}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        activeTab === 'Local-Groups' ? 'bg-purple-600 text-white' : 'text-gray-600 bg-transparent'
      }`}
    >
      Group
    </button>
  </div>
);

const DesktopTabs = ({ activeTab, onTabChange }) => (
  <div className="flex flex-wrap gap-1">
    {['Community', 'Local-Groups'].map((tab) => (
      <button
        type="button"
        key={tab}
        onClick={() => onTabChange(tab)}
        className={`px-4 py-2 rounded-md font-medium transition-colors ${
          activeTab === tab
            ? 'bg-[#282828] text-white'
            : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
        }`}
      >
        {tab}
      </button>
    ))}
  </div>
);

const DashboardOverview = ({
  activeTab,
  error,
  items,
  loading,
  onOpenAddFriends,
  onSelect,
  onTabChange,
}) => {
  const emptyState = emptyStates[activeTab] || emptyStates.Community;

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-[#E6E6E6] md:bg-gray-100 md:border md:border-gray-500 md:rounded-xl">
      <div className="md:hidden px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <MobileTabs activeTab={activeTab} onTabChange={onTabChange} />
      </div>

      <div className="hidden md:block bg-gray-200 border-b border-gray-500 px-4 sm:px-6 py-4 flex-shrink-0 rounded-t-xl">
        <div className="flex items-center justify-between">
          <DesktopTabs activeTab={activeTab} onTabChange={onTabChange} />
          {onOpenAddFriends && (
            <button
              type="button"
              onClick={onOpenAddFriends}
              title="Add Friend"
              className="hidden md:flex w-7 h-7 items-center justify-center text-black hover:bg-gray-300 rounded-md transition-colors"
            >
              <img src="/icons/add_frnd.svg" alt="Add Friend" className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 py-4 md:p-4 md:sm:p-6 overflow-y-auto">
        <DashboardList
          activeTab={activeTab}
          emptySubtitle={emptyState.subtitle}
          emptyTitle={emptyState.title}
          error={error}
          items={items}
          loading={loading}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
};

export default DashboardOverview;
