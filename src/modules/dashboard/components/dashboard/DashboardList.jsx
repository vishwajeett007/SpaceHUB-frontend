import DashboardListCard from './DashboardListCard';

const DashboardListSkeleton = () => (
  <div className="w-full flex flex-col gap-3">
    <div className="md:hidden space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-3">
          <div className="w-16 h-16 rounded-lg bg-gray-200 animate-pulse" />
          <div className="flex-1 min-w-0">
            <div className="h-4 w-32 bg-gray-200 rounded mb-2 animate-pulse" />
            <div className="h-3 w-full bg-gray-200 rounded mb-1 animate-pulse" />
            <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="h-3 w-16 bg-gray-200 rounded mb-1 animate-pulse" />
            <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>

    <div className="hidden md:block">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="w-full">
          <div className="flex items-stretch rounded-xl overflow-hidden w-full">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 bg-zinc-300 animate-pulse rounded-l-xl" />
            <div className="flex-1 min-w-0 bg-[#282828] rounded-r-xl p-3 sm:p-4 relative">
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 text-right">
                <div className="h-3 w-20 bg-gray-500/40 rounded mb-1 animate-pulse" />
                <div className="h-3 w-16 bg-green-500/40 rounded animate-pulse" />
              </div>
              <div className="pr-16 sm:pr-20 md:pr-24 lg:pr-32">
                <div className="h-5 sm:h-6 w-40 bg-gray-500/60 rounded mb-2 animate-pulse" />
                <div className="h-3 w-5/6 bg-gray-500/40 rounded mb-1 animate-pulse" />
                <div className="h-3 w-3/5 bg-gray-500/30 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const DashboardList = ({ activeTab, emptySubtitle, emptyTitle, error, items, loading, onSelect }) => {
  if (loading) return <DashboardListSkeleton />;
  if (error) return <div className="text-red-600">{error}</div>;

  if (!items.length) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl md:text-3xl font-bold text-gray-800 mb-2 md:mb-4">{emptyTitle}</h2>
        <p className="text-sm md:text-lg text-gray-600 max-w-md mx-auto px-4">{emptySubtitle}</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {items.map((item) => (
        <DashboardListCard
          key={item.id || item.groupId || item.roomId || item.communityId || item.name}
          activeTab={activeTab}
          item={item}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};

export default DashboardList;
