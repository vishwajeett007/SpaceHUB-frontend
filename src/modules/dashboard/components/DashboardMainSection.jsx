import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAuth } from '../../../shared/contexts/AuthContextContext';
import { setSelectedFriend } from '../../../shared/store/slices/uiSlice';
import { useDashboardCollections } from '../hooks/useDashboardCollections';
import { useDirectChat } from '../hooks/useDirectChat';
import { readStoredUserEmail } from '../utils/assets';
import { DEFAULT_AVATAR, formatFriendName } from '../utils/directChat';
import ChatRoom from './chatRoom/Chatroom';
import DashboardOverview from './dashboard/DashboardOverview';

const getDashboardItemId = (item) => (
  item.id || item.communityId || item.community_id || item.groupId || item.roomId
);

const DashboardMainSection = ({ selectedFriend, onOpenAddFriends }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const userEmail = user?.email || readStoredUserEmail();
  const {
    activeTab,
    changeActiveTab,
    communities,
    error,
    loading,
    localGroups,
  } = useDashboardCollections(userEmail);
  const { messages, sendMessage, wsStatus } = useDirectChat({
    friend: selectedFriend,
    user,
    userEmail,
  });

  const handleSelectDashboardItem = (item) => {
    const itemId = getDashboardItemId(item);
    if (!itemId) {
      console.error('No ID found for item:', item);
      return;
    }

    const itemPath = activeTab === 'Community' ? 'community' : 'local-group';
    navigate(`/dashboard/${itemPath}/${String(itemId)}`);
  };

  if (selectedFriend) {
    const friendName = formatFriendName(selectedFriend);
    const friendAvatar = selectedFriend.avatar
      || selectedFriend.avatarUrl
      || selectedFriend.profileImage
      || DEFAULT_AVATAR;

    return (
      <ChatRoom
        title={friendName}
        currentUser={{
          email: user?.email,
          username: user?.username,
          avatarUrl: user?.avatarUrl,
        }}
        messages={messages}
        chatUser={{
          name: friendName,
          avatar: friendAvatar,
          wsStatus,
        }}
        isGroupChat={false}
        onBack={() => dispatch(setSelectedFriend(null))}
        sendMessage={sendMessage}
      />
    );
  }

  return (
    <DashboardOverview
      activeTab={activeTab}
      error={error}
      items={activeTab === 'Community' ? communities : localGroups}
      loading={loading}
      onOpenAddFriends={onOpenAddFriends}
      onSelect={handleSelectDashboardItem}
      onTabChange={changeActiveTab}
    />
  );
};

export default DashboardMainSection;
