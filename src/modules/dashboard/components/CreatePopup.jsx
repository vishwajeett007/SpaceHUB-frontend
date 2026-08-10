import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import CreateMenu from './CreateMenu.jsx';
import CreateGroup from './createComponents/CreateGroup.jsx';
import CreateGroupDescription from './createComponents/CreateGroupDescription.jsx';
import CreateCongrats from './createComponents/CreateCongrats.jsx';
import CreateJoin from './CreateJoin.jsx';
import { createCommunity, createLocalGroup, createDefaultAnnouncementGroup } from '../../../shared/services/API';
import { useAuth } from '../../../shared/contexts/AuthContextContext';
import { addCommunity, addLocalGroup } from '../../../shared/store/slices/dashboardSlice';
import { getStoredUserEmail } from '../../../shared/services/authStorage';

const CreatePopup = ({ open, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth?.() || {};
  const [mode, setMode] = useState('menu');
  const [kind, setKind] = useState('group');
  const [doneSubtitle, setDoneSubtitle] = useState('');
  const [groupData, setGroupData] = useState({
    name: '',
    imageFile: null,
    description: '',
  });
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const storedEmail = getStoredUserEmail();
  const userEmail = (user && user.email) || storedEmail || '';

  const handleJoinSuccess = (responseData) => {
    const type = responseData?.type;

    if (type === 'localGroup') {
      const groupId = responseData?.groupId || responseData?.id || responseData?.localGroupId;

      if (groupId) {
        onClose();

        if (responseData) {
          dispatch(addLocalGroup(responseData));
        }

        window.dispatchEvent(new Event('refresh:local-groups'));
        navigate(`/dashboard/local-group/${groupId}`);
      } else {
        setDoneSubtitle('Successfully joined the local group!');
        setMode('done');
      }
    } else {

      const communityId = responseData?.id || responseData?.communityId || responseData?.communityId;

      if (communityId) {
        onClose();

        if (responseData) {
          dispatch(addCommunity(responseData));
        }

        window.dispatchEvent(new Event('refresh:communities'));
        navigate(`/dashboard/community/${communityId}`);
      } else {
        setDoneSubtitle('Successfully joined the community!');
        setMode('done');
      }
    }
  };

  const goToMenu = () => {
    setMode('menu');
    setGroupData({ name: '', imageFile: null, description: '' });
    setDoneSubtitle('');
  };

  const handleGroupConfirm = ({ groupName, imageFile }) => {
    setGroupData((prev) => ({ ...prev, name: groupName, imageFile }));
    setMode('desc');
  };

  const handleDescriptionConfirm = async ({ description }) => {
    const trimmedName = (groupData.name || '').trim();
    const trimmedDesc = (description || '').trim();
    const trimmedEmail = (userEmail || '').trim();
    if (!trimmedName || !trimmedDesc || !trimmedEmail) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Please fill Name, Description, and make sure your account email is present.', type: 'error' }
      }));
      return;
    }

    setLoading(true);
    console.log('Creating entity with:', { kind, name: trimmedName, description: trimmedDesc, email: trimmedEmail, hasImage: !!groupData.imageFile });

    try {
      let response;
      if (kind === 'community') {
        response = await createCommunity({
          name: trimmedName,
          description: trimmedDesc,
          createdByEmail: trimmedEmail,
          imageFile: groupData.imageFile,
        });

        const communityData = response?.data || response;
        if (communityData) {
          dispatch(addCommunity(communityData));
        }

        const communityId = communityData?.id || communityData?.communityId || response?.data?.id || response?.id;
        if (communityId) {
          try {
            await createDefaultAnnouncementGroup(communityId, trimmedEmail);
            console.log('Default Announcement group and general chatroom created successfully');
          } catch (announcementError) {
            console.error('Failed to create default Announcement group:', announcementError);

            window.dispatchEvent(new CustomEvent('toast', {
              detail: { message: 'Community created, but failed to create default Announcement group', type: 'warning' }
            }));
          }
        }

        window.dispatchEvent(new Event('refresh:communities'));
      } else {
        response = await createLocalGroup({
          name: trimmedName,
          description: trimmedDesc,
          createdByEmail: trimmedEmail,
          imageFile: groupData.imageFile,
        });

        const localGroupData = response?.data || response;
        if (localGroupData) {
          dispatch(addLocalGroup(localGroupData));
        }
        window.dispatchEvent(new Event('refresh:local-groups'));
      }

      const entityId = response?.data?.id ||
                       response?.data?.communityId ||
                       response?.data?.groupId ||
                       response?.data?.localGroupId ||
                       response?.id ||
                       response?.communityId ||
                       response?.groupId ||
                       response?.localGroupId;

      if (entityId) {
        onClose();

        if (kind === 'community') {
          navigate(`/dashboard/community/${entityId}`);
        } else {
          navigate(`/dashboard/local-group/${entityId}`);
        }
      } else {
        setGroupData((prev) => ({ ...prev, description: trimmedDesc }));
        setDoneSubtitle('You have successfully created your ' + (kind === 'community' ? 'Community' : 'Local-Group') + '!');
        setMode('done');
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: err.message || 'Failed to create.', type: 'error' }
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 modal-backdrop">

      <div className="absolute inset-0 bg-[#282828]/40 transition-opacity duration-300" onClick={onClose} />

      {mode === 'menu' && (
        <CreateMenu
          onBack={onClose}
          onFriends={() => { setKind('group'); setMode('create'); setDoneSubtitle(''); }}
          onClubs={() => { setKind('community'); setMode('create'); setDoneSubtitle(''); }}
          onJoin={() => setMode('join')}
        />
      )}
      {mode === 'create' && (
        <CreateGroup
          onBack={goToMenu}
          onConfirm={handleGroupConfirm}
          title={kind === 'community' ? 'Create a community' : 'Create a Local-Group'}
          subtitle={kind === 'community' ? 'Create a community.\nBring people together in one shared space.' : 'Start your own Local-Group and bring people together. Share ideas, interests, and good vibes in one place.'}
          nameLabel={kind === 'community' ? 'Community name' : 'Local-Group name'}
          placeholder={kind === 'community' ? 'Enter community name' : 'Enter Local-Group name'}
          confirmText={'Confirm'}
          initialName={groupData.name}
          initialImageFile={groupData.imageFile}
          iconSrc={kind === 'community' ? '/icons/community.svg' : '/icons/user-friends.svg'}
          onChange={({ name, imageFile }) => setGroupData((prev) => ({ ...prev, name: name ?? prev.name, imageFile: imageFile ?? prev.imageFile }))}
        />
      )}
      {mode === 'desc' && (
        <CreateGroupDescription
          onBack={() => setMode('create')}
          onSkip={() => setMode('done')}
          onConfirm={handleDescriptionConfirm}
          entityLabel={kind === 'community' ? 'Community' : 'Local-Group'}
          initialDescription={groupData.description}
          onChange={(value) => setGroupData((prev) => ({ ...prev, description: value }))}
        />
      )}
      {mode === 'done' && (
        <CreateCongrats
          onDone={onClose}
          entityTitle={kind === 'community' ? 'Community' : 'Local-Group'}
          subtitle={doneSubtitle}
        />
      )}
      {mode === 'join' && (
        <CreateJoin onBack={goToMenu} onSuccess={handleJoinSuccess} />
      )}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#282828]/40">
          <div className="bg-white rounded-full px-6 py-3 shadow-lg text-lg font-semibold">Creating...</div>
        </div>
      )}
    </div>
  );
};

export default CreatePopup;
