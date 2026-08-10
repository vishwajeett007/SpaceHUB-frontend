import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import logo from '../../../assets/landing/logo-removebg-preview.svg';
import { useAuth } from '../../../shared/contexts/AuthContextContext';
import { getAllCommunities, getMyCommunities, joinCommunity } from '../../../shared/services/API';
import { SEO } from '../../../shared';

import { selectShowInbox, setShowInbox } from '../../../shared/store/slices/uiSlice';
import { selectUnreadCount } from '../../../shared/store/slices/inboxSlice';
import CommunityLeftPanel from '../components/community/CommunityLeftPanel';
import CommunityCenterPanel from '../components/community/CommunityCenterPanel';
import CommunityRightPanel from '../components/community/CommunityRightPanel';
import InboxModal from '../components/InboxModal';
import { readStoredUser } from '../../../shared/services/authStorage';

const CommunityPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { logout, user } = useAuth();
  const [community, setCommunity] = useState(null);
  const [isJoined, setIsJoined] = useState(true);
  const [joining, setJoining] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const getIsMobileView = () => (typeof window !== 'undefined' ? window.innerWidth <= 640 : false);
  const getIsTabletOrAbove = () => (typeof window !== 'undefined' ? window.innerWidth >= 641 : false);
  const getIsLargeOrAbove = () => (typeof window !== 'undefined' ? window.innerWidth >= 1025 : false);

  const [showRightPanel, setShowRightPanel] = useState(false);
  const [hasSelectedChannel, setHasSelectedChannel] = useState(false);
  const [isMobileView, setIsMobileView] = useState(getIsMobileView);
  const [showCenterPanel, setShowCenterPanel] = useState(getIsTabletOrAbove);
  const [layoutStyle, setLayoutStyle] = useState({ minHeight: 'auto' });
  const showInbox = useSelector(selectShowInbox);

  useEffect(() => {
    const fetchCommunity = async () => {
      setLoading(true);
      setError('');
      try {
        const [res, myRes] = await Promise.all([
          getAllCommunities(),
          getMyCommunities()
        ]);
        const list = res?.data?.communities || res?.communities || res?.data || [];
        const myCommunitiesList = myRes?.data?.communities || myRes?.communities || myRes?.data || [];

        const found = list.find(
          (c) =>
            String(c.id) === String(id) ||
            String(c.communityId) === String(id) ||
            String(c.community_id) === String(id) ||
            String(c.slug) === String(id) ||
            c.id === Number(id) ||
            c.communityId === Number(id) ||
            c.community_id === Number(id)
        );

        if (found) {
          setCommunity(found);
          const foundIdStr = String(found.id || found.communityId || found.slug);
          const userHasJoined = myCommunitiesList.some(
            (c) =>
              String(c.id) === foundIdStr ||
              String(c.communityId) === foundIdStr ||
              String(c.slug) === foundIdStr
          );
          setIsJoined(userHasJoined);
        } else {
          setError('Community not found');
        }
      } catch (e) {
        setError(e.message || 'Failed to load community');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCommunity();
    }
  }, [id]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await joinCommunity(community?.id || community?.name || id);
      setIsJoined(true);
      window.dispatchEvent(new Event('refresh:communities'));
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: `Joined ${community?.name || 'community'} successfully!`, type: 'success' }
      }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: err.message || 'Failed to join community', type: 'error' }
      }));
    } finally {
      setJoining(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = getIsMobileView();
      const large = getIsLargeOrAbove();
      setIsMobileView(mobile);
      if (mobile) {
        setShowCenterPanel(hasSelectedChannel);
        setLayoutStyle({ minHeight: 'auto' });
      } else {
        setShowCenterPanel(true);
        const root = document.documentElement;
        const viewportHeight = window.innerHeight;
        const rootStyle = getComputedStyle(root);
        const rootFontSize = parseFloat(rootStyle.fontSize) || 16;
        const rem24 = 24 * rootFontSize;
        const minHeight = Math.max(viewportHeight - rem24, 400);
        setLayoutStyle({ minHeight: `${minHeight}px` });
      }
      if (large) {
        setShowRightPanel(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [hasSelectedChannel]);

  useEffect(() => {
    const handleChannelSelect = () => {
      if (getIsMobileView()) {
        setHasSelectedChannel(true);
        setShowCenterPanel(true);
      } else {
        setShowCenterPanel(true);
      }
    };
    window.addEventListener('community:channel-selected', handleChannelSelect);
    return () => {
      window.removeEventListener('community:channel-selected', handleChannelSelect);
    };
  }, []);

  const handleCloseCenterPanel = () => {
    setShowCenterPanel(false);
    setHasSelectedChannel(false);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#E6E6E6] md:bg-gray-100">
        <div className="text-gray-700">Loading...</div>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#E6E6E6] md:bg-gray-100">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error || 'Community not found'}</div>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!isJoined) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#E6E6E6] md:bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-200">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl overflow-hidden">
            {community.avatarUrl ? (
              <img src={community.avatarUrl} alt={community.name} className="w-full h-full object-cover" />
            ) : (
              community.name?.charAt(0).toUpperCase() || 'C'
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{community.name}</h2>
          <p className="text-gray-600 text-sm mb-6">{community.description || 'Welcome to this community workspace!'}</p>
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg p-3 mb-6">
            You must join this community before accessing its channels and messages.
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="flex-1 py-2.5 px-4 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleJoin}
              disabled={joining}
              className="flex-1 py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {joining ? 'Joining...' : 'Join Community'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-x-hidden bg-[#E6E6E6] md:bg-gray-100">
      <SEO
        title={community?.name ? `${community.name} - Community` : 'Community'}
        description={community?.description || 'SpaceHUB Community workspace'}
        noindex={true}
      />

      <div className="sticky top-0 z-20 bg-gray-200 border-b border-gray-300 h-14 flex items-center px-4 rounded-b-xl">
        <div className="flex items-center gap-2">

          <button onClick={() => navigate('/')} className="cursor-pointer hover:opacity-80 transition-opacity">
            <img src={logo} alt="Logo" className="w-7 h-7 object-contain" />
          </button>
        </div>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold text-gray-800">Community</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(setShowInbox(true))}
            title='Inbox'
            className="w-7 h-7 flex items-center justify-center hover:bg-gray-300 rounded-md transition-colors">
            <img src="/icons/inbox.svg" alt="Inbox" className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-2 p-2 md:p-2 relative min-h-0 overflow-hidden" style={layoutStyle}>

        <div className={`flex flex-shrink-0 border border-gray-500 rounded-xl h-full ${isMobileView && showCenterPanel ? 'hidden sm:flex' : 'flex sm:flex'} w-full sm:w-auto max-w-full sm:max-w-sm`}>

          <div className="w-16 bg-white flex flex-col items-center py-4 space-y-4 rounded-l-xl h-full">

            <button
              onClick={() => navigate('/dashboard/settings')}
              title='Profile Settings'
              className="w-10 h-10 rounded-md bg-gray-300 flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity cursor-pointer">
              {(() => {
                const sessionUser = readStoredUser() || {};
                const avatarUrl = user?.avatarUrl || sessionUser?.avatarUrl;
                const displayName = user?.username || sessionUser?.username || 'U';
                return avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-semibold text-gray-700">
                    {String(displayName).charAt(0).toUpperCase()}
                  </span>
                );
              })()}
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              title='Create Community'
              className="w-10 h-10 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors">
              <img src="/avatars/plus.png" alt="Add" className="w-8 h-8" />
            </button>

            <div className="flex-1"></div>

            <button
              title='Settings'
              onClick={() => navigate('/dashboard/settings')}
              className="w-10 h-10 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <img src="/icons/setting.svg" alt="Settings" className="w-5 h-5" />
            </button>

            <button
              title='Logout'
              onClick={handleLogout}
              className="w-10 h-10 rounded-md flex items-center justify-center hover:bg-red-700 transition-colors"
            >
              <svg className="w-5 h-5 hover:text-black text-bg-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

          <CommunityLeftPanel community={community} onBack={handleBack} />
        </div>

        <>
          {showCenterPanel && isMobileView && (
            <>
              <div
                className="fixed inset-0 bg-black/50 z-30 sm:hidden"
                onClick={handleCloseCenterPanel}
              />
              <div className="fixed inset-0 z-40 sm:hidden flex flex-col">
                <CommunityCenterPanel
                  community={community}
                  onToggleRightPanel={() => setShowRightPanel(true)}
                  onBack={handleCloseCenterPanel}
                />
              </div>
            </>
          )}

          <div className="hidden sm:flex flex-1 min-w-0">
            <CommunityCenterPanel
              community={community}
              onToggleRightPanel={() => setShowRightPanel(true)}
            />
          </div>
        </>

        <div className="hidden lg:flex w-full max-w-xs">
          <CommunityRightPanel
            community={community}
            onClose={showRightPanel ? () => setShowRightPanel(false) : null}
          />
        </div>
      </div>

      {showRightPanel && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowRightPanel(false)}
          />
          <div className="relative ml-auto w-[calc(100%-1rem)] sm:max-w-xs md:max-w-sm h-[calc(100%-1rem)] my-2 mr-2 bg-white rounded-xl shadow-2xl overflow-hidden">
            <CommunityRightPanel
              community={community}
              onClose={() => setShowRightPanel(false)}
            />
          </div>
        </div>
      )}
      <InboxModal isOpen={showInbox} onClose={() => dispatch(setShowInbox(false))} />
    </div>
  );
};

export default CommunityPage;
