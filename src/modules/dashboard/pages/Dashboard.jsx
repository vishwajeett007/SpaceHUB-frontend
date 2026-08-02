import React, { useState, useEffect, useRef, useCallback } from 'react';
import logo from '../../../assets/landing/logo-removebg-preview.svg';
import { useNavigate, useMatch } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../../shared/contexts/AuthContextContext';
import { getProfileSummary, getFriendsList } from '../../../shared/services/API';
import {
  selectSelectedView,
  selectShowCreate,
  selectShowRightSidebar,
  selectSelectedFriend,
  selectShowInbox,
  setSelectedView,
  setShowCreate,
  setShowRightSidebar,
  setSelectedFriend,
  setShowInbox,
} from '../../../shared/store/slices/uiSlice';
import { selectUnreadCount } from '../../../shared/store/slices/inboxSlice';
import DashboardMainSection from '../components/DashboardMainSection';
import DashboardRightSidebar from '../components/DashboardRightSidebar';
import Discover from '../components/Discover';
import CreatePopup from '../components/CreatePopup';
import DashboardLeftSidebar from '../components/DashboardLeftSidebar';
import InboxModal from '../components/InboxModal';
import MobileHamburgerMenu from '../components/MobileHamburgerMenu';
import { readStoredUser } from '../../../shared/services/authStorage';

const Dashboard = () => {
  const { logout, user, updateUser } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileFetchEmailRef = useRef(null);
  
  const selectedView = useSelector(selectSelectedView);
  const showCreate = useSelector(selectShowCreate);
  const showRightSidebar = useSelector(selectShowRightSidebar);
  const selectedFriend = useSelector(selectSelectedFriend);
  const showInbox = useSelector(selectShowInbox);
  const unreadCount = useSelector(selectUnreadCount);

  const discoverMatch = useMatch('/dashboard/discover');
  const chatMatch = useMatch('/dashboard/chat/:friendId');
  const baseDashboardMatch = useMatch({ path: '/dashboard', end: true });

  const ensureFriend = useCallback(async (friendIdentifier) => {
    if (!friendIdentifier) return;
    const normalized = friendIdentifier.toLowerCase();
    const currentUsername = selectedFriend?.username?.toLowerCase();
    const currentEmail = selectedFriend?.email?.toLowerCase();

    if (currentUsername === normalized || currentEmail === normalized) {
      return;
    }

    const applyFriend = (candidate) => {
      if (!candidate) return false;
      const candidateUsername = (candidate.username || '').toLowerCase();
      const candidateEmail = (candidate.email || candidate.userEmail || '').toLowerCase();
      
      const matches = candidateUsername === normalized || candidateEmail === normalized;
      if (!matches) {
        return false;
      }
      
      dispatch(setSelectedFriend(candidate));
      try {
        sessionStorage.setItem('activeChatFriend', JSON.stringify(candidate));
      } catch (error) {
        console.warn('Failed to persist active chat friend:', error);
      }
      return true;
    };

    const activeChatRaw = sessionStorage.getItem('activeChatFriend');
    if (activeChatRaw) {
      try {
        const storedFriend = JSON.parse(activeChatRaw);
        const storedUsername = (storedFriend?.username || '').toLowerCase();
        const storedEmail = (storedFriend?.email || '').toLowerCase();
        if (storedUsername === normalized || storedEmail === normalized) {
          if (applyFriend(storedFriend)) {
            return;
          }
        }
      } catch (error) {
        console.warn('Failed to parse active chat friend from session storage:', error);
      }
    }

    const friendsListRaw = sessionStorage.getItem('friendsList');
    if (friendsListRaw) {
      try {
        const cachedFriends = JSON.parse(friendsListRaw);
        if (Array.isArray(cachedFriends)) {
            const cachedMatch = cachedFriends.find((friend) => {
            const friendUsername = (friend?.username || '').toLowerCase();
            const friendEmail = (friend?.email || '').toLowerCase();
            return friendUsername === normalized || friendEmail === normalized;
          });
          if (applyFriend(cachedMatch)) {
            return;
          }
        }
      } catch (error) {
        console.warn('Failed to parse cached friends from session storage:', error);
      }
    }

    const storedUserData = readStoredUser() || {};
    const requesterEmail = user?.email || storedUserData?.email || '';

    if (!requesterEmail) {
      const isEmail = normalized.includes('@');
      applyFriend({ 
        email: isEmail ? friendIdentifier : undefined, 
        username: isEmail ? friendIdentifier.split('@')[0] : friendIdentifier 
      });
      return;
    }

    try {
      const response = await getFriendsList(requesterEmail);
      const friends = response?.data || [];
      if (Array.isArray(friends)) {
        const fetchedMatch = friends.find((friend) => {
          const friendUsername = (friend?.username || '').toLowerCase();
          const friendEmail = (friend?.email || '').toLowerCase();
          return friendUsername === normalized || friendEmail === normalized;
        });
        if (applyFriend(fetchedMatch)) {
          try {
            sessionStorage.setItem('friendsList', JSON.stringify(friends));
            sessionStorage.setItem('friendsListUserEmail', requesterEmail);
          } catch (storageError) {
            console.warn('Failed to cache friends list after fetch:', storageError);
          }
          return;
        }
      }
    } catch (error) {
      console.error('Failed to resolve friend for chat route:', error);
    }

    const isEmail = normalized.includes('@');
    applyFriend({ 
      email: isEmail ? friendIdentifier : undefined, 
      username: isEmail ? friendIdentifier.split('@')[0] : friendIdentifier 
    });
  }, [dispatch, selectedFriend, user]);

  useEffect(() => {
    if (selectedFriend) {
      try {
        sessionStorage.setItem('activeChatFriend', JSON.stringify(selectedFriend));
      } catch (error) {
        console.warn('Failed to persist active chat friend:', error);
      }
    } else {
      sessionStorage.removeItem('activeChatFriend');
    }
  }, [selectedFriend]);


  useEffect(() => {
    const profileSetupRequired = localStorage.getItem('profileSetupRequired') === 'true';
    if (profileSetupRequired) return;

    const sessionUserRaw = sessionStorage.getItem('userData');
    let sessionUser = {};
    try {
      sessionUser = sessionUserRaw ? JSON.parse(sessionUserRaw) : {};
    } catch {
      sessionUser = {};
    }

    const effectiveEmail = user?.email || sessionUser?.email;
    if (!effectiveEmail) return;
    if (profileFetchEmailRef.current === effectiveEmail) return;

    let isMounted = true;

    const fetchProfileSummary = async () => {
      try {
        const summary = await getProfileSummary(effectiveEmail);
        if (!isMounted) return;
        const summaryData = summary?.data || {};
        const updatedUserData = {
          ...sessionUser,
          ...user,
          ...(summaryData.profileImage
            ? { profileImage: summaryData.profileImage, avatarUrl: summaryData.profileImage }
            : {}),
          ...(summaryData.username ? { username: summaryData.username } : {}),
        };
        sessionStorage.setItem('userData', JSON.stringify(updatedUserData));
        updateUser?.(updatedUserData);
        profileFetchEmailRef.current = effectiveEmail;
      } catch (error) {
        console.error('Failed to fetch profile summary on dashboard:', error);
      }
    };

    fetchProfileSummary();

    return () => {
      isMounted = false;
    };
  }, [user, updateUser]);

  useEffect(() => {
    if (chatMatch && chatMatch.params?.friendId) {
      if (selectedView !== 'dashboard') {
        dispatch(setSelectedView('dashboard'));
      }
      const identifier = decodeURIComponent(chatMatch.params.friendId);
      if (identifier) {
        ensureFriend(identifier);
      }
      return;
    }

    if (discoverMatch) {
      if (selectedView !== 'discover') {
        dispatch(setSelectedView('discover'));
      }
      if (selectedFriend) {
        dispatch(setSelectedFriend(null));
        sessionStorage.removeItem('activeChatFriend');
      }
      return;
    }

    if (baseDashboardMatch) {
      if (selectedView !== 'dashboard') {
        dispatch(setSelectedView('dashboard'));
      }
      if (selectedFriend) {
        dispatch(setSelectedFriend(null));
        sessionStorage.removeItem('activeChatFriend');
      }
    }
  }, [chatMatch, discoverMatch, baseDashboardMatch, selectedView, selectedFriend, dispatch, ensureFriend]);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 1024) {
        dispatch(setShowRightSidebar(false));
      } else {
        dispatch(setShowRightSidebar(true));
      }
    }
  }, [dispatch]);

 
  useEffect(() => {
    const handleOpenInbox = () => {
      dispatch(setShowInbox(true));
    };
    window.addEventListener('openInbox', handleOpenInbox);
    return () => {
      window.removeEventListener('openInbox', handleOpenInbox);
    };
  }, [dispatch]);

  const handleLogout = () => {
    // WebSocket disconnection is handled in AuthProvider
    logout();
    navigate('/');
  };

  const handleMobileNavigation = (view) => {
    if (view === 'direct-message') {
      navigate('/dashboard/direct-message');
    } else if (view === 'create-join') {
      navigate('/dashboard/create-join');
    } else if (view === 'discover') {
      dispatch(setSelectedView('discover'));
      dispatch(setSelectedFriend(null));
      sessionStorage.removeItem('activeChatFriend');
      navigate('/dashboard/discover');
    } else {
      dispatch(setSelectedView('dashboard'));
      dispatch(setSelectedFriend(null));
      sessionStorage.removeItem('activeChatFriend');
      navigate('/dashboard');
    }
    setIsMobileMenuOpen(false);
  };


    return (
      <div className="h-screen flex flex-col overflow-x-hidden bg-[#E6E6E6] md:bg-gray-100">
        {/* Top Navbar */}
        <div className="sticky top-0 z-20 bg-gray-200 border-b border-gray-300 h-14 flex items-center px-4 rounded-b-xl">
          {/* Mobile Hamburger Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-2 mr-2"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="hidden md:flex items-center gap-2">
            <button onClick={() => navigate('/')} className="cursor-pointer hover:opacity-80 transition-opacity">
              <img src={logo} alt="Logo" className="w-7 h-7 object-contain" />
            </button>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-gray-800">
              {selectedView === 'discover' ? 'Discover' : 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => dispatch(setShowInbox(true))}
              title='Inbox'
              className="relative w-7 h-7 flex items-center justify-center hover:bg-gray-300 rounded-md transition-colors">
              <img src="/icons/inbox.svg" alt="Inbox" className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-[0px]">{unreadCount}</span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Main 3-column layout */}
        <div className="flex flex-1 gap-2 p-2 relative min-h-0 overflow-hidden">
        <div className="hidden md:flex border border-gray-500 rounded-xl h-full flex-shrink-0">
          {/* Narrow Left Sidebar */}
          <div className="w-16 bg-white border-l-b-ts border-gray-400 flex flex-col items-center py-4 space-y-4 rounded-l-xl h-full">
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
            onClick={() => dispatch(setShowCreate(true))}
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

          {/* Left Sidebar Navigation */}
          <DashboardLeftSidebar 
            selectedView={selectedView} 
            setSelectedView={(view) => dispatch(setSelectedView(view))}
            selectedFriend={selectedFriend}
            setSelectedFriend={(friend) => dispatch(setSelectedFriend(friend))}
          />
        </div>

        {/* Conditional Rendering: Discover or Main + Right Sidebar */}
        <div className="flex-1 flex gap-2 min-w-0">
        {selectedView === 'discover' ? (
            <Discover onOpenMenu={() => setIsMobileMenuOpen(true)} />
        ) : (
          <>
              {/* Dashboard Main Section - Show on both mobile and desktop */}
              <div className="flex-1 min-w-0 h-full">
            <DashboardMainSection 
              selectedFriend={selectedFriend} 
              onOpenAddFriends={() => dispatch(setShowRightSidebar(true))}
              showRightSidebar={showRightSidebar}
            />
              </div>
            {/* Right Sidebar - Desktop: In layout, Mobile/Tablet: Slide-in from right */}
            {showRightSidebar && (
              <>
                {/* Mobile/Tablet: Slide-in Panel from Right */}
                <div className="lg:hidden">
                  {/* Overlay */}
                  <div 
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => dispatch(setShowRightSidebar(false))}
                  />
                  
                  {/* Slide-in Panel from Right with proper spacing */}
                  <div className="fixed right-0 top-0 bottom-0 z-50 flex items-center justify-end p-2">
                    <div className="w-[calc(100%-1rem)] sm:max-w-xs md:max-w-sm h-[calc(100%-1rem)] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
                      <DashboardRightSidebar onClose={() => dispatch(setShowRightSidebar(false))} />
                    </div>
                  </div>
                </div>

                {/* Desktop: In normal layout (1024px and above) */}
                <div className="hidden lg:flex w-full max-w-xs flex-shrink-0 h-full">
                  <DashboardRightSidebar onClose={() => dispatch(setShowRightSidebar(false))} />
                </div>
              </>
            )}
          </>
        )}
        </div>
        <CreatePopup open={showCreate} onClose={() => dispatch(setShowCreate(false))} />
        <InboxModal isOpen={showInbox} onClose={() => dispatch(setShowInbox(false))} />
        
        {/* Mobile Hamburger Menu */}
        <MobileHamburgerMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          onNavigate={handleMobileNavigation}
        />
        </div>
    </div>
  );
};

export default Dashboard;
