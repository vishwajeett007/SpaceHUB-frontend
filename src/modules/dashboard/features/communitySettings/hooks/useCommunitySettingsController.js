import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  authenticatedFetch,
  BASE_URL,
  changeCommunityRole,
  deleteCommunity,
  deleteCommunityRoom,
  getAllCommunities,
  getCommunityMembers,
  leaveCommunity,
} from '../../../../../shared/services/API';
import { showToast as emitToast } from '../../../../../shared/services/toast';
import { setShowInbox } from '../../../../../shared/store/slices/uiSlice';
import {
  containsEmoji,
  filterMembers,
  findCommunityById,
  getSessionUserEmail,
  mapRoomsToGroups,
  partitionMembers,
  resolveMediaUrl,
} from '../utils/communitySettings';

const showToast = (message, type = 'error') => emitToast(message, type);

const readResponse = async (response, fallbackMessage) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || fallbackMessage);
  }
  return data;
};

export const useCommunitySettingsController = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [bannerError, setBannerError] = useState(false);

  const [communityName, setCommunityName] = useState('');
  const [communityNameError, setCommunityNameError] = useState('');
  const [description, setDescription] = useState('');
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [bannerImagePreview, setBannerImagePreview] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [groups, setGroups] = useState([]);
  const [originalGroups, setOriginalGroups] = useState([]);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [deletingGroup, setDeletingGroup] = useState(false);

  const [members, setMembers] = useState([]);
  const [communityOwner, setCommunityOwner] = useState(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [roleChanges, setRoleChanges] = useState({});
  const [showOwnerSection, setShowOwnerSection] = useState(true);
  const [savingRoles, setSavingRoles] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const fileInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const deleteModalRef = useRef(null);
  const leaveModalRef = useRef(null);
  const deleteGroupModalRef = useRef(null);
  const dropdownRefs = useRef({});

  const currentUserEmail = getSessionUserEmail();
  const title = community?.name || 'Community';
  const hasProfileChanges = Boolean(community) && (
    communityName !== (community.name || '')
    || description !== (community.description || '')
    || profileImageFile !== null
    || bannerImageFile !== null
  );
  const hasGroupChanges = JSON.stringify(groups) !== JSON.stringify(originalGroups);
  const hasRoleChanges = Object.keys(roleChanges).length > 0;
  const visibleMembers = useMemo(
    () => filterMembers(members, searchQuery),
    [members, searchQuery],
  );

  const applyCommunity = useCallback((nextCommunity) => {
    setCommunity(nextCommunity);
    setCommunityName(nextCommunity.name || '');
    setDescription(nextCommunity.description || '');
  }, []);

  const loadCommunity = useCallback(async ({ showLoader = false, reportError = false } = {}) => {
    if (!id) return null;

    if (showLoader) setLoading(true);
    if (reportError) setError('');

    try {
      const response = await getAllCommunities();
      const nextCommunity = findCommunityById(response, id);

      if (!nextCommunity) {
        if (reportError) {
          setCommunity(null);
          setError('Community not found');
        }
        return null;
      }

      applyCommunity(nextCommunity);
      return nextCommunity;
    } catch (requestError) {
      if (reportError) {
        setError(requestError.message || 'Failed to load community');
        return null;
      }
      throw requestError;
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [applyCommunity, id]);

  const fetchGroups = useCallback(async () => {
    const response = await authenticatedFetch(`${BASE_URL}community/${id}/rooms/all`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await readResponse(response, 'Failed to fetch groups');
    return mapRoomsToGroups(data);
  }, [id]);

  const loadGroups = useCallback(async ({ showLoader = false } = {}) => {
    if (!id) return;
    if (showLoader) setLoadingGroups(true);

    try {
      const nextGroups = await fetchGroups();
      setGroups(nextGroups);
      setOriginalGroups([...nextGroups]);
    } catch (requestError) {
      console.error('Error fetching groups:', requestError);
    } finally {
      if (showLoader) setLoadingGroups(false);
    }
  }, [fetchGroups, id]);

  const applyMembers = useCallback((membersList) => {
    const partitioned = partitionMembers(membersList);
    setCommunityOwner(partitioned.owner);
    setMembers(partitioned.members);
  }, []);

  const loadMembers = useCallback(async ({ showLoader = false, rethrow = false } = {}) => {
    if (!id) return;
    if (showLoader) setLoadingMembers(true);

    try {
      const data = await getCommunityMembers(id);

      try {
        sessionStorage.setItem(`communityMembers:${id}`, JSON.stringify(data));
      } catch (storageError) {
        console.warn('Failed to save members to sessionStorage:', storageError);
      }

      applyMembers(data?.data?.members || data?.members || []);
    } catch (requestError) {
      if (rethrow) throw requestError;
      console.error('Error fetching members:', requestError);
      showToast(requestError.message || 'Failed to load members');
    } finally {
      if (showLoader) setLoadingMembers(false);
    }
  }, [applyMembers, id]);

  useEffect(() => {
    loadCommunity({ showLoader: true, reportError: true });
  }, [loadCommunity]);

  useEffect(() => {
    const isDesktop = window.innerWidth >= 768;
    if (isDesktop && (activeSection === null || activeSection === 'sidebar')) {
      setActiveSection('profile');
    }
  }, [activeSection]);

  useEffect(() => {
    setImageError(false);
    setBannerError(false);
  }, [community?.bannerUrl, community?.imageUrl]);

  useEffect(() => {
    if (activeSection === 'channels') {
      loadGroups({ showLoader: true });
    }
  }, [activeSection, loadGroups]);

  useEffect(() => {
    if (activeSection === 'roles') {
      loadMembers({ showLoader: true });
    }
  }, [activeSection, loadMembers]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (deleteModalRef.current && !deleteModalRef.current.contains(event.target)) {
        setShowDeleteModal(false);
      }
      if (leaveModalRef.current && !leaveModalRef.current.contains(event.target)) {
        setShowLeaveModal(false);
      }
      if (deleteGroupModalRef.current && !deleteGroupModalRef.current.contains(event.target)) {
        setShowDeleteGroupModal(false);
      }

      if (openDropdownId) {
        const dropdowns = Object.values(dropdownRefs.current[openDropdownId] || {});
        const clickedInsideDropdown = dropdowns.some((dropdown) => dropdown?.contains(event.target));
        if (dropdowns.length > 0 && !clickedInsideDropdown) {
          setOpenDropdownId(null);
        }
      }
    };

    if (showDeleteModal || showLeaveModal || showDeleteGroupModal || openDropdownId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId, showDeleteGroupModal, showDeleteModal, showLeaveModal]);

  useEffect(() => () => {
    if (profileImagePreview) URL.revokeObjectURL(profileImagePreview);
    if (bannerImagePreview) URL.revokeObjectURL(bannerImagePreview);
  }, [bannerImagePreview, profileImagePreview]);

  const handleBack = useCallback(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile && activeSection && activeSection !== 'sidebar') {
      setActiveSection(null);
      return;
    }
    navigate(`/dashboard/community/${id}`);
  }, [activeSection, id, navigate]);

  const handleCommunityNameChange = useCallback((value) => {
    if (value.length > 30) return;
    if (containsEmoji(value)) {
      setCommunityNameError('Emojis are not allowed.');
      return;
    }

    setCommunityNameError('');
    setCommunityName(value);
  }, []);

  const handleSaveProfile = useCallback(async () => {
    if (!id) return;

    const userEmail = getSessionUserEmail();
    if (!userEmail) {
      showToast('User email not found');
      return;
    }
    if (!communityName.trim()) {
      setCommunityNameError('Community name is required.');
      return;
    }
    if (communityName.length > 30) {
      setCommunityNameError('Community name cannot exceed 30 characters.');
      return;
    }
    if (containsEmoji(communityName)) {
      setCommunityNameError('Emojis are not allowed.');
      return;
    }

    setSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append('requesterEmail', userEmail);
      formData.append('name', communityName.trim());
      formData.append('description', description.trim());
      if (profileImageFile) formData.append('avatarFile', profileImageFile);
      if (bannerImageFile) formData.append('imageFile', bannerImageFile);

      const response = await authenticatedFetch(`${BASE_URL}community/${id}/upload-banner`, {
        method: 'POST',
        body: formData,
      });
      await readResponse(response, 'Failed to update community profile');

      if (profileImagePreview) URL.revokeObjectURL(profileImagePreview);
      if (bannerImagePreview) URL.revokeObjectURL(bannerImagePreview);
      setProfileImageFile(null);
      setBannerImageFile(null);
      setProfileImagePreview(null);
      setBannerImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (bannerInputRef.current) bannerInputRef.current.value = '';

      await loadCommunity();
    } catch (requestError) {
      console.error('Error saving community profile:', requestError);
      showToast(requestError.message || 'Failed to update community profile');
    } finally {
      setSavingProfile(false);
    }
  }, [
    bannerImageFile,
    bannerImagePreview,
    communityName,
    description,
    id,
    loadCommunity,
    profileImageFile,
    profileImagePreview,
  ]);

  const handleDiscardChanges = useCallback(() => {
    if (community) {
      setCommunityName(community.name || '');
      setDescription(community.description || '');
      setGroups([...originalGroups]);
    }
    if (profileImagePreview) URL.revokeObjectURL(profileImagePreview);
    if (bannerImagePreview) URL.revokeObjectURL(bannerImagePreview);
    setProfileImageFile(null);
    setBannerImageFile(null);
    setProfileImagePreview(null);
    setBannerImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (bannerInputRef.current) bannerInputRef.current.value = '';
    setEditingGroupId(null);
  }, [bannerImagePreview, community, originalGroups, profileImagePreview]);

  const handleSaveGroups = useCallback(async () => {
    if (!id) return;

    const userEmail = getSessionUserEmail();
    if (!userEmail) {
      showToast('User email not found');
      return;
    }

    try {
      await Promise.all(groups.map(async (group) => {
        const originalGroup = originalGroups.find((item) => item.id === group.id);
        if (!originalGroup || originalGroup.name === group.name) return;
        if (!group.id) {
          console.warn('Group ID not found, skipping:', group);
          return;
        }
        if (!group.name?.trim()) {
          showToast('Group name cannot be empty');
          return;
        }
        if (group.name.length > 20) {
          showToast('Group name cannot exceed 20 characters');
          return;
        }

        const response = await authenticatedFetch(
          `${BASE_URL}community/${id}/rooms/${group.id}/rename`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requesterEmail: userEmail,
              newRoomName: group.name.trim(),
            }),
          },
        );
        await readResponse(response, 'Failed to rename group');
      }));

      await loadGroups();
      setEditingGroupId(null);
    } catch (requestError) {
      console.error('Error saving groups:', requestError);
      showToast(requestError.message || 'Failed to save group changes');
    }
  }, [groups, id, loadGroups, originalGroups]);

  const handleGroupChange = useCallback((index, value) => {
    if (value.length > 30 || containsEmoji(value)) return;

    setGroups((currentGroups) => currentGroups.map((group, groupIndex) => (
      groupIndex === index ? { ...group, name: value } : group
    )));
  }, []);

  const handleGroupBlur = useCallback((index) => {
    setGroups((currentGroups) => currentGroups.map((group, groupIndex) => {
      if (groupIndex !== index) return group;
      return { ...group, name: group.name.trim() || 'Untitled Group' };
    }));
    setEditingGroupId(null);
  }, []);

  const handleDeleteGroupClick = useCallback((index) => {
    const group = groups[index];
    if (!group?.id) {
      console.warn('Group or group ID not found');
      return;
    }

    setGroupToDelete({ index, group });
    setShowDeleteGroupModal(true);
  }, [groups]);

  const closeDeleteGroupModal = useCallback(() => {
    setShowDeleteGroupModal(false);
    setGroupToDelete(null);
  }, []);

  const handleConfirmDeleteGroup = useCallback(async () => {
    if (!id || !groupToDelete?.group?.id) return;

    const userEmail = getSessionUserEmail();
    if (!userEmail) {
      showToast('User email not found');
      return;
    }

    setDeletingGroup(true);
    try {
      await deleteCommunityRoom(id, groupToDelete.group.id, userEmail);
      setGroups((currentGroups) => currentGroups.filter((_, index) => index !== groupToDelete.index));
      setOriginalGroups((currentGroups) => currentGroups.filter((_, index) => index !== groupToDelete.index));
      setEditingGroupId(null);
      await loadGroups();
      closeDeleteGroupModal();
      showToast('Group deleted', 'success');
    } catch (requestError) {
      console.error('Error deleting group:', requestError);
      showToast(requestError.message || 'Failed to delete group');
    } finally {
      setDeletingGroup(false);
    }
  }, [closeDeleteGroupModal, groupToDelete, id, loadGroups]);

  const handleDeleteCommunity = useCallback(async () => {
    if (!community?.name) return;

    const userEmail = getSessionUserEmail();
    if (!userEmail) {
      showToast('User email not found');
      return;
    }

    setDeleting(true);
    try {
      await deleteCommunity({ name: community.name, userEmail });
      showToast('Community deleted', 'success');
      navigate('/dashboard');
    } catch (requestError) {
      console.error('Error deleting community:', requestError);
      showToast(requestError.message || 'Failed to delete community');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }, [community?.name, navigate]);

  const handleLeaveCommunity = useCallback(async () => {
    if (!community?.name) return;

    const userEmail = getSessionUserEmail();
    if (!userEmail) {
      showToast('User email not found');
      return;
    }

    setLeaving(true);
    try {
      await leaveCommunity({ communityName: community.name, userEmail });
      showToast('Left community', 'success');
      navigate('/dashboard');
    } catch (requestError) {
      console.error('Error leaving community:', requestError);
      showToast(requestError.message || 'Failed to leave community');
    } finally {
      setLeaving(false);
      setShowLeaveModal(false);
    }
  }, [community?.name, navigate]);

  const handleRoleChange = useCallback((userEmail, newRole) => {
    setRoleChanges((currentChanges) => ({
      ...currentChanges,
      [userEmail]: newRole,
    }));
    setOpenDropdownId(null);
  }, []);

  const handleSaveRoles = useCallback(async () => {
    if (!id || !hasRoleChanges) return;

    const requesterEmail = getSessionUserEmail();
    if (!requesterEmail) {
      showToast('User email not found');
      return;
    }

    setSavingRoles(true);
    try {
      await Promise.all(Object.entries(roleChanges).map(([targetUserEmail, newRole]) => (
        changeCommunityRole({
          communityId: id,
          targetUserEmail,
          requesterEmail,
          newRole: newRole.toUpperCase(),
        })
      )));

      await loadMembers({ rethrow: true });
      setRoleChanges({});
      showToast('Roles updated successfully', 'success');
    } catch (requestError) {
      console.error('Error saving role changes:', requestError);
      showToast(requestError.message || 'Failed to update roles');
    } finally {
      setSavingRoles(false);
    }
  }, [hasRoleChanges, id, loadMembers, roleChanges]);

  const handleImageChange = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProfileImageFile(file);
    setProfileImagePreview((currentPreview) => {
      if (currentPreview) URL.revokeObjectURL(currentPreview);
      return URL.createObjectURL(file);
    });
  }, []);

  const handleRemoveProfileImage = useCallback(() => {
    setProfileImagePreview((currentPreview) => {
      if (currentPreview) URL.revokeObjectURL(currentPreview);
      return null;
    });
    setProfileImageFile(null);
    setImageError(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleBannerChange = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBannerImageFile(file);
    setBannerImagePreview((currentPreview) => {
      if (currentPreview) URL.revokeObjectURL(currentPreview);
      return URL.createObjectURL(file);
    });
  }, []);

  return {
    status: { loading, error },
    community: {
      data: community,
      title,
      imageUrl: resolveMediaUrl(community?.imageUrl, BASE_URL),
      bannerUrl: resolveMediaUrl(community?.bannerUrl, BASE_URL),
      imageError,
      bannerError,
      markImageError: () => setImageError(true),
      markBannerError: () => setBannerError(true),
    },
    navigation: {
      activeSection,
      selectSection: setActiveSection,
      goBack: handleBack,
      goHome: () => navigate('/'),
      openInbox: () => dispatch(setShowInbox(true)),
    },
    profile: {
      communityName,
      communityNameError,
      description,
      profileImageFile,
      bannerImageFile,
      profileImagePreview,
      bannerImagePreview,
      fileInputRef,
      bannerInputRef,
      hasChanges: hasProfileChanges,
      saving: savingProfile,
      setDescription,
      changeName: handleCommunityNameChange,
      save: handleSaveProfile,
      discard: handleDiscardChanges,
      openImagePicker: () => fileInputRef.current?.click(),
      openBannerPicker: () => bannerInputRef.current?.click(),
      changeImage: handleImageChange,
      removeImage: handleRemoveProfileImage,
      changeBanner: handleBannerChange,
    },
    groups: {
      items: groups,
      loading: loadingGroups,
      editingGroupId,
      hasChanges: hasGroupChanges,
      edit: setEditingGroupId,
      change: handleGroupChange,
      finishEditing: handleGroupBlur,
      requestDelete: handleDeleteGroupClick,
      save: handleSaveGroups,
      discard: handleDiscardChanges,
    },
    roles: {
      members: visibleMembers,
      totalMembers: members.length,
      owner: communityOwner,
      loading: loadingMembers,
      searchQuery,
      openDropdownId,
      roleChanges,
      currentUserEmail,
      showOwnerSection,
      hasChanges: hasRoleChanges,
      saving: savingRoles,
      setSearchQuery,
      toggleOwnerSection: () => setShowOwnerSection((isVisible) => !isVisible),
      toggleDropdown: (memberId) => setOpenDropdownId((openId) => (
        openId === memberId ? null : memberId
      )),
      registerDropdown: (memberId, surface, element) => {
        dropdownRefs.current[memberId] = {
          ...dropdownRefs.current[memberId],
          [surface]: element,
        };
      },
      changeRole: handleRoleChange,
      save: handleSaveRoles,
      discard: () => setRoleChanges({}),
    },
    dialogs: {
      deleteCommunity: {
        ref: deleteModalRef,
        isOpen: showDeleteModal,
        isProcessing: deleting,
        open: () => setShowDeleteModal(true),
        close: () => setShowDeleteModal(false),
        confirm: handleDeleteCommunity,
      },
      leaveCommunity: {
        ref: leaveModalRef,
        isOpen: showLeaveModal,
        isProcessing: leaving,
        open: () => setShowLeaveModal(true),
        close: () => setShowLeaveModal(false),
        confirm: handleLeaveCommunity,
      },
      deleteGroup: {
        ref: deleteGroupModalRef,
        isOpen: showDeleteGroupModal && Boolean(groupToDelete),
        isProcessing: deletingGroup,
        target: groupToDelete,
        close: closeDeleteGroupModal,
        confirm: handleConfirmDeleteGroup,
      },
    },
  };
};
