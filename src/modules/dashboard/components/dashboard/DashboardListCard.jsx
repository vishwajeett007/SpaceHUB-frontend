import { useEffect, useState } from 'react';
import { BASE_URL } from '../../../../shared/services/API';
import { resolveDashboardAssetUrl } from '../../utils/assets';

const CardImage = ({ imageError, imageUrl, onImageError, title, variant }) => {
  const mobile = variant === 'mobile';

  if (imageUrl && !imageError) {
    return (
      <img
        src={imageUrl}
        alt={title}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover"
        onError={onImageError}
      />
    );
  }

  return (
    <div className={`w-full h-full flex items-center justify-center ${mobile ? 'bg-gray-200' : 'bg-zinc-400'}`}>
      <div className={mobile
        ? 'text-xl font-bold text-gray-400'
        : 'text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800'}
      >
        {title.charAt(0).toUpperCase()}
      </div>
    </div>
  );
};

const MemberCount = ({ members, mobile = false }) => (
  <div className={mobile ? 'flex-shrink-0 text-right' : 'absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 text-right text-xs sm:text-sm'}>
    <div className={`${mobile ? 'text-xs text-gray-600 mb-1' : 'text-gray-300'} flex items-center gap-1 justify-end`}>
      <img src="/icons/user-friends.svg" alt="Members" className="w-4 h-4" />
      <span>Members: {members}</span>
    </div>
  </div>
);

const getMemberCount = (item) => {
  if (!item) return 0;
  if (typeof item.memberCount === 'number') return item.memberCount;
  if (typeof item._count?.members === 'number') return item._count.members;
  if (typeof item.totalMembers === 'number') return item.totalMembers;
  if (Array.isArray(item.members)) {
    return item.members.filter((m) => !m.role || m.role !== 'PENDING').length;
  }
  if (typeof item.members === 'number') return item.members;
  return 0;
};

const DashboardListCard = ({ activeTab, item, onSelect }) => {
  const rawUrl = item.imageUrl || item.bannerUrl || item.imageURL || '';
  const title = item.name || 'Untitled';
  const description = item.description || '';
  const imageUrl = resolveDashboardAssetUrl(rawUrl, BASE_URL);
  const members = getMemberCount(item);
  const [imageError, setImageError] = useState(false);
  const isCommunity = activeTab === 'Community';
  const showMembers = members !== null && members !== undefined;

  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  return (
    <button type="button" onClick={() => onSelect(item)} className="text-left w-full">
      <div className="md:hidden flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
          <CardImage
            imageError={imageError}
            imageUrl={imageUrl}
            onImageError={() => setImageError(true)}
            title={title}
            variant="mobile"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-gray-900 mb-1 truncate">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
            {description || 'No description'}
          </p>
        </div>

        {showMembers && <MemberCount members={members} mobile />}
      </div>

      <div className="hidden md:flex items-stretch rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow transform transition-transform hover:scale-[1.02] w-full">
        <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-l-xl overflow-hidden bg-zinc-400 flex-shrink-0">
          <CardImage
            imageError={imageError}
            imageUrl={imageUrl}
            onImageError={() => setImageError(true)}
            title={title}
            variant="desktop"
          />
        </div>

        <div className="flex-1 min-w-0 bg-[#282828] text-white rounded-r-xl p-3 sm:p-4 relative">
          {showMembers && <MemberCount members={members} />}

          <div className={isCommunity ? '' : 'pr-16 sm:pr-20 md:pr-24 lg:pr-32'}>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">{title}</h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed line-clamp-1">
              {description}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
};

export default DashboardListCard;
