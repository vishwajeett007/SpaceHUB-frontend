import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getLocalGroupSettings, createLocalGroupInvite, getLocalGroupInvites } from '../../../shared/services/API';
import InboxModal from '../components/InboxModal';
import { selectShowInbox, setShowInbox } from '../../../shared/store/slices/uiSlice';
import { selectUnreadCount } from '../../../shared/store/slices/inboxSlice';
import { useAuth } from '../../../shared/contexts/AuthContextContext';
import { getStoredUserEmail } from '../../../shared/services/authStorage';

const LocalGroupSettingsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const showInbox = useSelector(selectShowInbox);
  const unreadCount = useSelector(selectUnreadCount);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [copied, setCopied] = useState(false);
  const [expiresInHours, setExpiresInHours] = useState(24);
  const inviteModalRef = useRef(null);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState('');

  useEffect(() => {
    const handleOpenInbox = () => {
      dispatch(setShowInbox(true));
    };
    window.addEventListener('openInbox', handleOpenInbox);
    return () => {
      window.removeEventListener('openInbox', handleOpenInbox);
    };
  }, [dispatch]);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const res = await getLocalGroupSettings(id);
        const data = res?.data || res || {};
        setSettings(data);

        const userEmail = user?.email || getStoredUserEmail();
        if (userEmail) {
          try {
            const cached = sessionStorage.getItem(`localGroupDetails:${id}`);
            const lg = cached ? JSON.parse(cached) : null;
            const creator = data?.creatorEmail || data?.createdByEmail || data?.creator || lg?.creatorEmail || lg?.createdByEmail || lg?.creator || '';
            const details = { ...(lg || {}), ...data };
            const membership = details?.members?.find((member) => (
              member?.userId === user?.id || member?.user?.id === user?.id
            ));
            const isOwner = details?.ownerId === user?.id
              || (creator && creator.toLowerCase() === userEmail.toLowerCase());
            setCurrentUserRole(isOwner ? 'OWNER' : String(membership?.role || 'MEMBER').toUpperCase());
          } catch (cacheError) {
            console.warn('Failed to read cached local-group details:', cacheError);
            setCurrentUserRole('MEMBER');
          }
        }
      } catch (e) {
        setError(e.message || 'Failed to load local-group settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [id, user?.email, user?.id]);

  useEffect(() => {
    const canManageRequests = ['ADMIN', 'OWNER', 'WORKSPACE_OWNER'].includes(currentUserRole);
    if (!id || !canManageRequests) {
      setJoinRequests([]);
      setLoadingRequests(false);
      return undefined;
    }

    const fetchJoinRequests = async () => {
      setLoadingRequests(true);
      try {
        const response = await getLocalGroupInvites(id);
        const requests = response?.data || [];
        setJoinRequests(Array.isArray(requests) ? requests : []);
      } catch (e) {
        console.error('Error fetching join requests:', e);
        setJoinRequests([]);
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchJoinRequests();

    const interval = setInterval(fetchJoinRequests, 30000);
    return () => clearInterval(interval);
  }, [id, currentUserRole]);

  const generateInviteLink = useCallback(async () => {
    if (!id || !user?.email) {
      setInviteError('Group ID or user email not found');
      return;
    }

    const isAuthorized = currentUserRole === 'ADMIN' ||
                        currentUserRole === 'OWNER' ||
                        currentUserRole === 'WORKSPACE_OWNER';
    if (!isAuthorized) {
      setInviteError('Only workspace owners and admins can generate invite links');
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Only workspace owners and admins can generate invite links', type: 'error' }
      }));
      return;
    }

    setInviteLoading(true);
    setInviteError('');

    try {
      const response = await createLocalGroupInvite({
        groupId: id,
        inviterEmail: user.email,
        expiresInHours,
      });

      const link = response?.data?.inviteLink || response?.inviteLink || response?.data?.link || response?.link || '';
      if (link) {
        setInviteLink(link);
      } else {
        setInviteError('Failed to generate invite link');
      }
    } catch (err) {
      console.error('Error generating invite link:', err);
      setInviteError(err.message || 'Failed to generate invite link');
    } finally {
      setInviteLoading(false);
    }
  }, [id, user?.email, expiresInHours, currentUserRole]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inviteModalRef.current && !inviteModalRef.current.contains(event.target)) {
        setShowInviteModal(false);
      }
    };

    if (showInviteModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInviteModal]);

  const handleCopy = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenInviteModal = () => {
    setShowInviteModal(true);
    setInviteLink('');
    setInviteError('');
    setCopied(false);
  };

  const handleCloseInviteModal = () => {
    setShowInviteModal(false);
    setInviteLink('');
    setInviteError('');
    setCopied(false);
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="space-y-3 w-full max-w-lg px-6">
          <div className="h-6 w-40 bg-gray-300 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-2/3 bg-gray-200 rounded animate-pulse" />
          <div className="h-24 w-full bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-x-hidden">
      <div className="sticky top-0 z-20 bg-gray-200 border-b border-gray-300 h-14 flex items-center px-4 rounded-b-xl">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-300" title="Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        </div>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold text-gray-800">Local-Group Settings</h1>
        </div>
        <div className="flex items-center">
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

      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-300 p-6">
          <h2 className="text-xl font-semibold mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500">Group ID</div>
              <div className="text-sm text-gray-800 break-all">{id}</div>
            </div>
            {settings?.name && (
              <div>
                <div className="text-xs text-gray-500">Name</div>
                <div className="text-sm text-gray-800">{settings.name}</div>
              </div>
            )}
            {settings?.description && (
              <div className="md:col-span-2">
                <div className="text-xs text-gray-500">Description</div>
                <div className="text-sm text-gray-800 whitespace-pre-wrap break-words">{settings.description}</div>
              </div>
            )}
          </div>

          {(currentUserRole === 'ADMIN' || currentUserRole === 'OWNER' || currentUserRole === 'WORKSPACE_OWNER') && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Invite Members</h3>
              <button
                onClick={handleOpenInviteModal}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium"
              >
                Generate Invite Link
              </button>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Join Requests</h3>
            {loadingRequests ? (
              <div className="text-gray-600 text-center py-4">Loading requests...</div>
            ) : joinRequests.length === 0 ? (
              <div className="text-gray-500 text-center py-4">No join requests</div>
            ) : (
              <div className="space-y-3">
                {joinRequests.map((request, index) => {
                  const requestId = request?.id || request?.inviteId || request?.userId || `request-${index}`;
                  const requesterName = request?.senderName || request?.username || request?.name || request?.senderEmail?.split('@')[0] || request?.email?.split('@')[0] || 'Unknown';
                  const requesterEmail = request?.senderEmail || request?.email || '';
                  const inviteLink = request?.inviteLink || request?.link || '';
                  const createdAt = request?.createdAt || request?.created_at || '';
                  const expiresAt = request?.expiresAt || request?.expires_at || '';
                  const uses = request?.uses || request?.currentUses || 0;
                  const maxUses = request?.maxUses || request?.max_uses || 'Unlimited';

                  return (
                    <div key={requestId} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{requesterName}</div>
                          {requesterEmail && (
                            <div className="text-sm text-gray-600 mt-1">{requesterEmail}</div>
                          )}
                          {inviteLink && (
                            <div className="mt-2">
                              <div className="text-xs text-gray-500 mb-1">Invite Link:</div>
                              <div className="flex items-center gap-2 bg-white border border-gray-300 rounded px-2 py-1">
                                <input
                                  type="text"
                                  value={inviteLink}
                                  readOnly
                                  className="flex-1 text-xs bg-transparent text-gray-700 outline-none"
                                />
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(inviteLink).then(() => {
                                      window.dispatchEvent(new CustomEvent('toast', {
                                        detail: { message: 'Link copied!', type: 'success' }
                                      }));
                                    });
                                  }}
                                  className="text-indigo-600 hover:text-indigo-700 text-xs font-medium"
                                >
                                  Copy
                                </button>
                              </div>
                            </div>
                          )}
                          <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                            {createdAt && (
                              <span>Created: {new Date(createdAt).toLocaleDateString()}</span>
                            )}
                            {expiresAt && (
                              <span>Expires: {new Date(expiresAt).toLocaleDateString()}</span>
                            )}
                            <span>Uses: {uses} / {maxUses}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Raw settings</h3>
            <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-3 overflow-auto max-h-80">{JSON.stringify(settings, null, 2)}</pre>
          </div>
        </div>
      </div>

      <InboxModal isOpen={showInbox} onClose={() => dispatch(setShowInbox(false))} />

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div ref={inviteModalRef} className="bg-white rounded-lg md:rounded-xl p-5 md:p-8 max-w-md w-full relative">
            <button
              onClick={handleCloseInviteModal}
              className="absolute top-3 md:top-4 right-3 md:right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Generate Invite Link</h2>
            <p className="text-sm md:text-base text-gray-600 mb-6">
              Create an invite link to share with others to join this local group.
            </p>

            {!inviteLink && (
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expires In (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={expiresInHours}
                    onChange={(e) => setExpiresInHours(parseInt(e.target.value) || 24)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {inviteError && (
              <p className="text-red-500 text-sm mb-4 text-center">{inviteError}</p>
            )}

            {inviteLoading ? (
              <div className="text-gray-600 text-center py-4">Generating invite link...</div>
            ) : inviteLink ? (
              <div className="mb-6">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg p-3 mb-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600 flex-shrink-0">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 bg-transparent text-gray-900 outline-none text-sm"
                  />
                  <button
                    onClick={handleCopy}
                    className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                      copied
                        ? 'bg-green-500 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  Expires in: {expiresInHours} hours
                </div>
              </div>
            ) : (
              <button
                onClick={generateInviteLink}
                className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium"
              >
                Generate Link
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocalGroupSettingsPage;
