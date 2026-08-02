import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../../shared/contexts/AuthContextContext';
import {
  deleteAccount,
  getProfileSummary,
  setUsername as apiSetUsername,
  updateProfile,
  uploadProfileImage,
} from '../../../../../shared/services/API';
import { showToast } from '../../../../../shared/services/toast';
import {
  DEFAULT_AVATAR_URL,
  findUploadedAvatarUrl,
  getAvatarUrl,
  mergeProfileSummary,
  readSessionUser,
  resolveSettingsUser,
  USERNAME_MAX_LENGTH,
} from '../utils/userSettings';

const getErrorMessage = (error, fallbackMessage) => (
  error instanceof Error && error.message ? error.message : fallbackMessage
);

export const useUserSettingsController = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const initialUser = useMemo(() => resolveSettingsUser(user), [user]);

  const [username, setUsernameState] = useState(initialUser.username);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);

  const usernameTooLong = username.length > USERNAME_MAX_LENGTH;

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const setUsername = useCallback((value) => {
    if (value.length <= USERNAME_MAX_LENGTH) setUsernameState(value);
  }, []);

  const toggleOldPasswordVisibility = useCallback(() => {
    setShowOldPassword((isVisible) => !isVisible);
  }, []);

  const toggleNewPasswordVisibility = useCallback(() => {
    setShowNewPassword((isVisible) => !isVisible);
  }, []);

  const handleImageChange = useCallback((event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }

    // Allow selecting the same file again after it has been removed.
    event.target.value = '';
  }, []);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const removeSelectedImage = useCallback(() => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const goToDashboard = useCallback(() => navigate('/dashboard'), [navigate]);
  const goBack = useCallback(() => navigate(-1), [navigate]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  const openDeleteDialog = useCallback(() => setShowDeleteDialog(true), []);

  const closeDeleteDialog = useCallback(() => {
    setShowDeleteDialog(false);
    setDeletePassword('');
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    if (!deletePassword.trim()) {
      showToast('Please enter your current password', 'error');
      return;
    }
    if (deleting) return;

    try {
      setDeleting(true);
      await deleteAccount({
        email: initialUser.email,
        currentPassword: deletePassword,
      });

      sessionStorage.clear();
      logout();
      navigate('/');
      showToast('Account deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete account:', error);
      showToast(
        getErrorMessage(error, 'Failed to delete account. Please check your password.'),
        'error',
      );
    } finally {
      setDeleting(false);
      setDeletePassword('');
    }
  }, [deletePassword, deleting, initialUser.email, logout, navigate]);

  const handleSave = useCallback(async () => {
    if (saving) return;
    if (usernameTooLong) {
      showToast(`Username must be ${USERNAME_MAX_LENGTH} characters or fewer`, 'error');
      return;
    }

    const trimmedOldPassword = oldPassword.trim();
    const trimmedNewPassword = newPassword.trim();
    const isPasswordChangeRequested = Boolean(trimmedOldPassword && trimmedNewPassword);
    const isUsernameChanged = username !== (initialUser.username || '');
    const isImageChanged = Boolean(selectedImage);
    const operations = [];

    try {
      setSaving(true);

      if (isPasswordChangeRequested) {
        await updateProfile({
          email: initialUser.email,
          currentPassword: trimmedOldPassword,
          newPassword: trimmedNewPassword,
        });
        setOldPassword('');
        setNewPassword('');
      }

      if (isUsernameChanged && username.trim()) {
        operations.push(apiSetUsername({
          email: initialUser.email,
          username: username.trim(),
        }));
      }

      if (isImageChanged) {
        operations.push(uploadProfileImage({
          imageFile: selectedImage,
          email: initialUser.email,
        }));
      }

      if (operations.length > 0) {
        const results = await Promise.all(operations);
        let nextUser = { ...initialUser, ...readSessionUser() };

        if (isUsernameChanged && username.trim()) {
          nextUser.username = username.trim();
        }

        if (isImageChanged) {
          let refreshedAvatarUrl = null;

          try {
            const profileSummary = await getProfileSummary(initialUser.email);
            if (profileSummary) {
              nextUser = mergeProfileSummary(nextUser, profileSummary);
              refreshedAvatarUrl = getAvatarUrl(profileSummary);
            }
          } catch (profileError) {
            console.error('Failed to fetch profile summary:', profileError);
          }

          if (!refreshedAvatarUrl) {
            const uploadedAvatarUrl = findUploadedAvatarUrl(results);
            if (uploadedAvatarUrl) nextUser.avatarUrl = uploadedAvatarUrl;
          }
        }

        sessionStorage.setItem('userData', JSON.stringify(nextUser));
        updateUser?.(nextUser);
      }

      if (operations.length > 0 || isPasswordChangeRequested) {
        showToast('Changes saved', 'success');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      showToast(getErrorMessage(error, 'Failed to save settings'), 'error');
    } finally {
      setSaving(false);
    }
  }, [
    initialUser,
    newPassword,
    oldPassword,
    saving,
    selectedImage,
    updateUser,
    username,
    usernameTooLong,
  ]);

  return {
    account: {
      email: initialUser.email,
      username,
      oldPassword,
      newPassword,
      showOldPassword,
      showNewPassword,
      usernameTooLong,
      setUsername,
      setOldPassword,
      setNewPassword,
      toggleOldPasswordVisibility,
      toggleNewPasswordVisibility,
    },
    profileImage: {
      imageUrl: previewUrl || initialUser.avatarUrl || DEFAULT_AVATAR_URL,
      hasPendingImage: Boolean(previewUrl),
      fileInputRef,
      handleImageChange,
      openFilePicker,
      removeSelectedImage,
    },
    deleteDialog: {
      isOpen: showDeleteDialog,
      password: deletePassword,
      isDeleting: deleting,
      setPassword: setDeletePassword,
      open: openDeleteDialog,
      close: closeDeleteDialog,
      confirm: handleDeleteAccount,
    },
    actions: {
      isSaving: saving,
      save: handleSave,
      logout: handleLogout,
      goBack,
      goToDashboard,
    },
  };
};
