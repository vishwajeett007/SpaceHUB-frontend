import React, { useEffect, useRef, useState } from 'react';
import { authenticatedFetch, BASE_URL, searchCommunities } from '../../../shared/services/API';
import JoinCommunityModal from './JoinCommunityModal';

const getMemberCount = (community) => {
  if (!community) return 0;
  if (typeof community.memberCount === 'number') return community.memberCount;
  if (typeof community._count?.members === 'number') return community._count.members;
  if (typeof community.totalMembers === 'number') return community.totalMembers;
  if (Array.isArray(community.members)) {
    return community.members.filter((m) => !m.role || m.role !== 'PENDING').length;
  }
  if (typeof community.members === 'number') return community.members;
  return 0;
};

const CommunityCard = ({ community, onClick, isMobile = false }) => {
  const title = community.name || 'Untitled';
  const desc = community.description || '';
  const bannerImg = community.bannerUrl || '';
  const profileImg = community.avatarUrl || community.imageUrl || community.imageURL || '';
  const members = getMemberCount(community);
  const [bannerError, setBannerError] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const showMembers = members !== null && members !== undefined && members !== '';

  const safeUrl = (rawUrl) => {
    if (!rawUrl) return '';
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:')) {
      return rawUrl;
    }
    return `${BASE_URL}${rawUrl}`;
  };

  if (isMobile) {
    return (
      <div
        onClick={() => onClick?.(community)}
        className="rounded-lg overflow-hidden shadow-sm bg-transparent cursor-pointer aspect-square hover-lift transition-all duration-300 animate-fade-in"
      >
        {/* Top section - Image */}
        <div className="h-[66%] bg-gray-400 relative">
          {bannerImg && !bannerError ? (
            <img 
              src={safeUrl(bannerImg)} 
              alt={title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={() => setBannerError(true)}
            />
          ) : null}
        </div>
        
        {/* Bottom section - Dark grey with logo and community name */}
        <div className="h-[34%] bg-[#282828] flex items-center gap-2 px-2">
          {/* Logo/Icon */}
          <div className="w-10 h-10 rounded-md overflow-hidden bg-zinc-400 border border-gray-600 flex-shrink-0">
            {profileImg && !profileError ? (
              <img
                src={safeUrl(profileImg)}
                alt={title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setProfileError(true)}
              />
            ) : (
              <div className="w-full h-full bg-zinc-400 flex items-center justify-center">
                <div className="text-xs font-bold text-gray-800">
                  {title.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
          {/* Community Name */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">{title}</h3>
          </div>
          {showMembers && (
            <div className="text-[11px] text-gray-300 whitespace-nowrap">
              Members: {members}
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div
      key={community.id || community.communityId || title}
      onClick={() => onClick?.(community)}
      className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] bg-transparent cursor-pointer hover-lift animate-fade-in"
    >
      {/* Top banner area */}
      <div className="h-40 sm:h-44 bg-gray-400">
        {bannerImg && !bannerError ? (
          <img 
            src={safeUrl(bannerImg)} 
            alt={title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setBannerError(true)}
          />
        ) : null}
      </div>
      {/* Bottom dark card */}
      <div className="bg-[#282828] text-white px-4 py-4 min-h-[170px] relative">
        {showMembers && (
          <div className="absolute top-4 right-4 text-sm text-gray-300">
            Members: {members}
          </div>
        )}
        {/* Profile image above community name */}
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-400 border-2 border-[#282828] flex-shrink-0">
            {profileImg && !profileError ? (
              <img
                src={safeUrl(profileImg)}
                alt={title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setProfileError(true)}
              />
            ) : (
              <div className="w-full h-full bg-zinc-400 flex items-center justify-center">
                <div className="text-xl font-bold text-gray-800">
                  {title.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-bold mb-2 line-clamp-1">{title}</h3>
          <p className="text-sm text-gray-300 leading-relaxed line-clamp-2">{desc}</p>
        </div>
      </div>
    </div>
  );
};

const SkeletonCard = ({ isMobile = false }) => {
  if (isMobile) {
    return (
      <div className="rounded-lg overflow-hidden shadow-sm bg-transparent aspect-square">
        <div className="h-[66%] bg-gray-200 animate-pulse" />
        <div className="h-[34%] bg-[#282828] relative">
          <div className="absolute bottom-2 left-2 w-10 h-10 rounded-md bg-zinc-400 animate-pulse" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="rounded-lg overflow-hidden shadow-sm bg-transparent">
      <div className="h-40 sm:h-44 bg-gray-200 animate-pulse" />
      <div className="bg-[#282828] px-4 py-4 min-h-[170px] relative">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-400 border-2 border-[#282828] animate-pulse" />
          <div className="flex items-center justify-between text-sm mb-2 pt-2">
            <div></div>
            <div>
              <div className="h-4 w-20 bg-gray-500/50 rounded mb-1 animate-pulse" />
              <div className="h-4 w-24 bg-green-500/40 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div>
          <div className="h-7 w-40 bg-gray-500/60 rounded mb-2 animate-pulse" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-gray-500/40 rounded animate-pulse" />
            <div className="h-3 w-5/6 bg-gray-500/30 rounded animate-pulse" />
            <div className="h-3 w-4/6 bg-gray-500/30 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

const Discover = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const [communities, setCommunities] = useState(() => {
    try {
      const cached = sessionStorage.getItem('cachedDiscoverCommunities');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const scrollContainerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchCommunities = async (pageToFetch = 0, isAppend = false) => {
    if (isAppend) {
      setLoadingMore(true);
    } else {
      if (communities.length === 0) setLoading(true);
    }
    setError('');

    try {
      const userDataRaw = sessionStorage.getItem('userData');
      const userEmail = userDataRaw ? (JSON.parse(userDataRaw)?.email || JSON.parse(userDataRaw)?.userEmail) : (sessionStorage.getItem('lastEmail') || sessionStorage.getItem('lastIdentifier') || '');
      const params = new URLSearchParams();
      params.set('page', String(pageToFetch));
      params.set('size', '20');
      if (userEmail) params.set('currentUserEmail', userEmail);
      const url = `${BASE_URL}community/discover?${params.toString()}`;
      const res = await authenticatedFetch(url, { method: 'GET' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && (data.message || data.error)) || `HTTP ${res.status}`);
      
      const rawData = data?.data;
      const list = Array.isArray(rawData) 
        ? rawData 
        : (rawData?.communities || data?.communities || []);

      if (list.length < 20) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (isAppend) {
        setCommunities((prev) => {
          const existingIds = new Set(prev.map((c) => String(c.id || c.communityId)));
          const uniqueNew = list.filter((c) => !existingIds.has(String(c.id || c.communityId)));
          return [...prev, ...uniqueNew];
        });
      } else {
        setCommunities(list);
        try {
          sessionStorage.setItem('cachedDiscoverCommunities', JSON.stringify(list));
        } catch (e) {
          console.warn('Failed to cache discover communities:', e);
        }
      }
    } catch (e) {
      const errorMsg = e.message || 'Failed to fetch communities';
      setError(errorMsg);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: errorMsg, type: 'error' }
      }));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchCommunities(0, false);
  }, []);

  const handleScroll = () => {
    if (!scrollContainerRef.current || loading || loadingMore || !hasMore || searchQuery.trim().length >= 3) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (scrollHeight - scrollTop - clientHeight < 150) {
      setPage((prevPage) => {
        const nextPage = prevPage + 1;
        fetchCommunities(nextPage, true);
        return nextPage;
      });
    }
  };

  // Remote search when 3+ characters
  useEffect(() => {
    const query = searchQuery.trim();
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (query.length < 3) {
      setSearchResults([]);
      setSearching(false);
      setSearchError('');
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setSearchError('');
      try {
        const userDataRaw = sessionStorage.getItem('userData');
        const userEmail = userDataRaw ? (JSON.parse(userDataRaw)?.email || JSON.parse(userDataRaw)?.userEmail) : undefined;
        const res = await searchCommunities({ query, requesterEmail: userEmail, page: 0, size: 20 });
        const list = res?.data?.communities || res?.communities || res?.data || [];
        setSearchResults(Array.isArray(list) ? list : []);
      } catch (e) {
        const errorMsg = e.message || 'Search failed';
        setSearchError(errorMsg);
        setSearchResults([]);
        window.dispatchEvent(new CustomEvent('toast', {
          detail: { message: errorMsg, type: 'error' }
        }));
      } finally {
        setSearching(false);
      }
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  const handleCommunityClick = (community) => {
    setSelectedCommunity(community);
    setShowJoinModal(true);
  };

  const handleCloseModal = () => {
    setShowJoinModal(false);
    setSelectedCommunity(null);
  };

  return (
    <div 
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 min-w-0 flex flex-col h-[calc(100vh-56px)] overflow-y-auto bg-[#E6E6E6] md:bg-gray-100"
    >
      {/* Desktop Header */}
      <div className="hidden md:block bg-gray-200 border-b border-gray-500 px-4 sm:px-6 py-4 flex-shrink-0 rounded-t-xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-[#282828] text-white rounded-md text-sm font-medium">
              Community
            </div>
          </div>
          <div className="flex-1 max-w-md">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header with Search Bar */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white"
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-4 sm:p-6">
        {/* Loading and error states */}
        {(searching || (!searching && loading && communities.length === 0)) && (
          <div className="grid grid-cols-2 md:grid-cols-1 md:sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 max-w-7xl">
            {Array.from({ length: 6 }).map((_, idx) => (
              <SkeletonCard key={idx} isMobile={isMobile} />
            ))}
          </div>
        )}
        {searchError && <div className="text-red-600">{searchError}</div>}
        {!searching && error && <div className="text-red-600">{error}</div>}

        {/* Results grid - Mobile: 2 columns, Desktop: 3 columns */}
        {!searching && (!loading || communities.length > 0) && !error && (
          <div className="grid grid-cols-2 md:grid-cols-1 md:sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 max-w-7xl">
            {(searchQuery.trim().length >= 3 ? searchResults : communities).map((community) => (
              <CommunityCard 
                key={community.id || community.communityId || community.name}
                community={community}
                onClick={handleCommunityClick}
                isMobile={isMobile}
              />
            ))}
            {searchQuery.trim().length >= 3 && !searching && searchResults.length === 0 && (
              <div className="text-gray-600 col-span-2 md:col-span-3">No communities found.</div>
            )}
          </div>
        )}

        {/* Infinite Scroll loading indicator */}
        {loadingMore && (
          <div className="flex justify-center items-center py-6">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-sm text-gray-600 font-medium">Loading more communities...</span>
          </div>
        )}
      </div>

      {/* Join Community Modal */}
      <JoinCommunityModal
        isOpen={showJoinModal}
        onClose={handleCloseModal}
        community={selectedCommunity}
      />
    </div>
  );
};

export default Discover;
