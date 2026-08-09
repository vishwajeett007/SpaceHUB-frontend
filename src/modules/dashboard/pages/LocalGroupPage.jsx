import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import logo from '../../../assets/landing/logo-removebg-preview.svg';
import { useAuth } from '../../../shared/contexts/AuthContextContext';
import { getAllLocalGroups, getLocalGroupById } from '../../../shared/services/API';
import { selectShowInbox, setShowInbox } from '../../../shared/store/slices/uiSlice';
import { selectUnreadCount } from '../../../shared/store/slices/inboxSlice';
import CommunityLeftPanel from '../components/community/CommunityLeftPanel';
import CommunityCenterPanel from '../components/community/CommunityCenterPanel';
import CommunityRightPanel from '../components/community/CommunityRightPanel';
import InboxModal from '../components/InboxModal';
import { getStoredUserEmail, readStoredUser } from '../../../shared/services/authStorage';

const LocalGroupPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, logout } = useAuth();
  const [localGroup, setLocalGroup] = useState(null);
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
  const unreadCount = useSelector(selectUnreadCount);

  useEffect(() => {
    const fetchLocalGroup = async () => {
      setLoading(true);
      setError('');
      
      const storedEmail = getStoredUserEmail();
      const userEmail = user?.email || storedEmail;
      
      if (!userEmail) {
        setError('User email not found');
        setLoading(false);
        return;
      }
      
      try {
        let found = null;
        try {
          const detailRes = await getLocalGroupById(id);
          found = detailRes?.data || detailRes?.community || (detailRes?.id ? detailRes : null);
        } catch (e) {
          console.warn('getLocalGroupById failed, trying list fallback:', e);
        }

        if (!found || !found.id) {
          const res = await getAllLocalGroups(userEmail);
          const list = res?.data?.groups || res?.groups || res?.data || res?.rooms || [];
          found = list.find(
            (g) => 
              String(g.id) === String(id) || 
              String(g.groupId) === String(id) || 
              String(g.roomId) === String(id) ||
              g.id === Number(id) ||
              g.groupId === Number(id) ||
              g.roomId === Number(id)
          );
        }

        if (found && found.id) {
          setLocalGroup(found);
          try {
            sessionStorage.setItem(`localGroup:${found.id}`, JSON.stringify(found));
            if (found.chatRoomCode) {
              sessionStorage.setItem(`localGroupChatRoomCode:${found.id}`, found.chatRoomCode);
            }
            const detectedChatRoomId = found.chatRoomId || found.chatroomId || found.primaryChatRoomId || found.roomId || found.id;
            if (detectedChatRoomId) {
              sessionStorage.setItem(`localGroupChatRoomId:${found.id}`, String(detectedChatRoomId));
            }
          } catch (e) {
            console.warn('Failed to save local group to sessionStorage:', e);
          }
        } else {
          setError('Local-Group not found');
        }
      } catch (e) {
        setError(e.message || 'Failed to load local-group');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchLocalGroup();
    }
  }, [id, user]);

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
      <div className="h-screen flex flex-col bg-[#E6E6E6] md:bg-gray-100">
        {/* Top Navbar skeleton */}
        <div className="sticky top-0 z-20 bg-gray-200 border-b border-gray-300 h-14 flex items-center px-4 rounded-b-xl">
          <div className="w-7 h-7 bg-gray-300 rounded mr-2 animate-pulse" />
          <div className="flex-1" />
          <div className="w-24 h-6 bg-gray-300 rounded animate-pulse" />
        </div>

        {/* Main 3-column skeleton layout */}
        <div className="flex flex-1 gap-2 p-2">
          {/* Left container */}
          <div className="flex border border-gray-500 rounded-xl overflow-hidden w-[calc(20rem)] max-w-full">
            {/* Narrow left bar */}
            <div className="w-16 bg-white flex flex-col items-center py-4 space-y-4">
              <div className="w-10 h-10 bg-gray-300 rounded-md animate-pulse" />
              <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse" />
              <div className="flex-1" />
              <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse" />
            </div>
            {/* Panel */}
            <div className="w-80 bg-gray-200 h-full p-4 space-y-4">
              <div className="h-6 w-40 bg-gray-300 rounded animate-pulse" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 w-full bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </div>

          {/* Center panel */}
          <div className="flex-1 bg-white rounded-xl border border-gray-500 p-4 space-y-3">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </div>

          {/* Right panel */}
          <div className="hidden lg:block w-90 bg-white rounded-xl border border-gray-500 p-6 space-y-4">
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-40 bg-gray-200 rounded mb-2 animate-pulse" />
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !localGroup) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#E6E6E6] md:bg-gray-100">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error || 'Local-Group not found'}</div>
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

  return (
    <div className="h-screen flex flex-col overflow-x-hidden bg-[#E6E6E6] md:bg-gray-100">
      {/* Top Navbar */}
      <div className="sticky top-0 z-20 bg-gray-200 border-b border-gray-300 h-14 flex items-center px-4 rounded-b-xl">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/')} className="cursor-pointer hover:opacity-80 transition-opacity">
          <img src={logo} alt="Logo" className="w-7 h-7 object-contain" />
          </button>
        </div>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold text-gray-800">Local-Group</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => dispatch(setShowInbox(true))}
            title='Inbox'
            className="relative w-7 h-7 flex items-center justify-center hover:bg-gray-300 rounded-md transition-colors">
            <img src="/icons/inbox.svg" alt="Inbox" className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white pointer-events-none" />
            )}
          </button>
        </div>
      </div>

      {/* Main 3-column layout */}
      <div className="flex flex-1 gap-2 p-2 md:p-2 relative min-h-0 overflow-hidden" style={layoutStyle}>
        {/* Narrow Left Sidebar + Left Panel Group (no gap between them) */}
        <div className={`flex flex-shrink-0 border border-gray-500 rounded-xl h-full ${isMobileView && showCenterPanel ? 'hidden sm:flex' : 'flex sm:flex'} w-full sm:w-auto max-w-full sm:max-w-sm`}>
          {/* Narrow Left Sidebar */}
          <div className="w-16 bg-white flex flex-col items-center py-4 space-y-4 rounded-l-xl h-full">
            {/* Profile Picture */}
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

            {/* Plus Icon */}
            <button
              onClick={() => navigate('/dashboard')}
              title='Create Community' 
              className="w-10 h-10 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors">
              <img src="/avatars/plus.png" alt="Add" className="w-8 h-8" />
            </button>

            {/* Spacer */}
            <div className="flex-1"></div>

            {/* Settings Icon */}
            <button 
              title='Settings'
              onClick={() => navigate('/dashboard/settings')}
              className="w-10 h-10 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <img src="/icons/setting.svg" alt="Settings" className="w-5 h-5" />
            </button>

            {/* Logout Icon */}
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

          {/* Local-Group Left Panel */}
          <CommunityLeftPanel community={localGroup} onBack={handleBack} isLocalGroup={true} />
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
                  community={localGroup} 
                  onToggleRightPanel={() => setShowRightPanel(true)}
                  onBack={handleCloseCenterPanel}
                  isLocalGroup={true}
                />
              </div>
            </>
          )}
          {/* Tablet & Desktop: Always show center panel */}
          <div className="hidden sm:flex flex-1 min-w-0">
            <CommunityCenterPanel 
              community={localGroup} 
              onToggleRightPanel={() => setShowRightPanel(true)}
              isLocalGroup={true}
            />
          </div>
        </>

        {/* Local-Group Right Panel - Desktop only */}
        <div className="hidden lg:flex w-full max-w-xs">
          <CommunityRightPanel 
            community={localGroup} 
            isLocalGroup={true}
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
              community={localGroup} 
              isLocalGroup={true}
              onClose={() => setShowRightPanel(false)}
            />
          </div>
        </div>
      )}
      <InboxModal isOpen={showInbox} onClose={() => dispatch(setShowInbox(false))} />
    </div>
  );
};

export default LocalGroupPage;
