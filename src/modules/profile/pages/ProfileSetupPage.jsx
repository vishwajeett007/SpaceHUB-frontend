import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadProfileImage as uploadProfileImageApi, updateProfile } from '../../../shared/services/API';
import { useAuth } from '../../../shared/contexts/AuthContextContext';
import { showToast } from '../../../shared/services/toast';

const presetAvatarUrls = [
  '/avatars/avatar-1.png',
  '/avatars/avatar-2.png',
  '/avatars/avatar-3.png',
  '/avatars/avatar-4.png',
  '/avatars/avatar-5.png',
  '/avatars/avatar-6.png',
  '/avatars/avatar-7.png',
  '/avatars/avatar-8.png',
];

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2MB

const AvatarPlaceholder = ({ src, size = 'lg' }) => {
  const sizeClasses = {
    sm: {
      container: 'w-32 h-32',
      inner: 'w-24 h-24',
    },
    md: {
      container: 'w-44 h-44',
      inner: 'w-32 h-32',
    },
    lg: {
      container: 'w-56 h-56',
      inner: 'w-40 h-40',
    },
  };

  const { container, inner } = sizeClasses[size] || sizeClasses.lg;

  return (
    <div className={`${container} rounded-full bg-white shadow-inner flex items-center justify-center overflow-hidden`}>
    {src ? (
      <img src={src} alt="avatar" className="w-full h-full object-cover" />
    ) : (
        <div className={`${inner} rounded-full bg-gray-200`} />
    )}
  </div>
);
};

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth() || {};
  const fileInputRef = useRef(null);
  const [username, setUsername] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const defaultAvatarUrl = presetAvatarUrls[0];
  const [uploadPreview, setUploadPreview] = useState(defaultAvatarUrl);
  const [uploadFile, setUploadFile] = useState(null);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(defaultAvatarUrl);
  // interests removed per design
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dateOfBirthError, setDateOfBirthError] = useState('');
  const [usernameError, setUsernameError] = useState('');

  const onPickFile = () => fileInputRef.current?.click();

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      const errorMessage = 'Image must be 2MB or smaller';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      e.target.value = '';
      return;
    }
    setUploadFile(file);
    const url = URL.createObjectURL(file);
    setUploadPreview(url);
    setSelectedAvatarUrl('');
    setError(''); // Clear any previous errors
  };

  const handleRemoveUploadedImage = () => {
    if (uploadPreview && uploadPreview.startsWith('blob:')) {
      URL.revokeObjectURL(uploadPreview);
    }
    setUploadFile(null);
    setUploadPreview(defaultAvatarUrl);
    setSelectedAvatarUrl(defaultAvatarUrl);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSelectPresetAvatar = (url) => {
    setSelectedAvatarUrl(url);
    setUploadFile(null);
    setUploadPreview(url);
  };



  const containsEmoji = (value) => {
    if (!value) return false;
    const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{27BF}]/u;
    return emojiRegex.test(value);
  };

  const validateUsername = (value) => {
    const val = (value || '').trim();
    if (!val) {
      setUsernameError('');
      return true;
    }
    if (val.length > 30) {
      setUsernameError('Username cannot exceed 30 characters');
      return false;
    }
    if (containsEmoji(val)) {
      setUsernameError('Username cannot contain emoji');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const validateDateOfBirth = (dateValue) => {
    if (!dateValue) {
      setDateOfBirthError('');
      return true;
    }
    
    const selectedDate = new Date(dateValue);
    const today = new Date();
    const twoYearsAgo = new Date();
    const hundredYearsAgo = new Date();
    twoYearsAgo.setFullYear(today.getFullYear() - 2);
    hundredYearsAgo.setFullYear(today.getFullYear() - 100);
    
    // Reset time to compare only dates
    selectedDate.setHours(0, 0, 0, 0);
    twoYearsAgo.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    hundredYearsAgo.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
      setDateOfBirthError('Date of birth cannot be in the future');
      return false;
    }
    
    if (selectedDate > twoYearsAgo) {
      setDateOfBirthError('Date of birth must be at least 2 years ago');
      return false;
    }

    if (selectedDate < hundredYearsAgo) {
      setDateOfBirthError('Invalid date');
      return false;
    }
    
    setDateOfBirthError('');
    return true;
  };

  const handleDateOfBirthChange = (e) => {
    const value = e.target.value;
    setDateOfBirth(value);
    validateDateOfBirth(value);
  };

  const uploadAvatar = async ({ file: fileOverride, avatarUrl: avatarUrlOverride } = {}) => {
    const effectiveFile = fileOverride ?? uploadFile;
    const effectiveAvatarUrl = avatarUrlOverride ?? selectedAvatarUrl;

    if (effectiveFile) {
      await uploadProfileImageApi({ imageFile: effectiveFile });
      return;
    }

    if (effectiveAvatarUrl) {
      const res = await fetch(effectiveAvatarUrl);
      const blob = await res.blob();
      if (blob.size > MAX_UPLOAD_BYTES) {
        throw new Error('Selected avatar exceeds 2MB limit');
      }
      const fileFromBlob = new File([blob], 'avatar.png', { type: blob.type || 'image/png' });
      await uploadProfileImageApi({ imageFile: fileFromBlob });
    }
  };

  const setUserName = async (nameOverride, dobOverride) => {
    const sanitizedUsername = (nameOverride ?? username)?.trim();
    const sanitizedDob = dobOverride ?? dateOfBirth;
    await updateProfile({
      username: sanitizedUsername,
      dateOfBirth: sanitizedDob || null
    });
  };

  const handleConfirm = async () => {
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    if (!validateUsername(username)) {
      setError(usernameError || 'Invalid username');
      return;
    }
    
    if (dateOfBirth && !validateDateOfBirth(dateOfBirth)) {
      setError(dateOfBirthError || 'Please enter a valid date of birth');
      return;
    }
    
    setError('');
    setSaving(true);
    try {
      if (uploadFile || selectedAvatarUrl) await uploadAvatar();
      const trimmedUsername = username.trim();
      await setUserName(trimmedUsername, dateOfBirth);
      const sessionUserRaw = sessionStorage.getItem('userData');
      let sessionUser = {};
      try {
        sessionUser = sessionUserRaw ? JSON.parse(sessionUserRaw) : {};
      } catch {
        sessionUser = {};
      }

      const updatedUser = {
        ...sessionUser,
        username: trimmedUsername,
        ...(selectedAvatarUrl ? { avatarUrl: selectedAvatarUrl } : {}),
      };

      sessionStorage.setItem('userData', JSON.stringify(updatedUser));
      localStorage.setItem('profileSetupRequired', 'false');
      updateUser?.(updatedUser);
      navigate('/dashboard');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 md:bg-transparent">
      <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />

      <div className="md:hidden min-h-screen px-6 py-6">
        <div className="max-w-sm mx-auto h-full flex flex-col">
          <div className="mt-6">
            <h1 className="text-3xl font-semibold text-gray-800">
              Set-up your <span className="font-bold text-gray-900">Profile</span>
            </h1>
          </div>

          <div className="mt-8 flex flex-col flex-1">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <AvatarPlaceholder src={uploadPreview} size="md" />
                {uploadFile && (
                  <button
                    type="button"
                    onClick={handleRemoveUploadedImage}
                    className="absolute -right-1 -top-1 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer z-10"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                {!uploadFile && (
                  <button
                    type="button"
                    onClick={onPickFile}
                    className="absolute -right-1 -top-1 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer z-10"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-4">
                {presetAvatarUrls.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => onSelectPresetAvatar(url)}
                    className={`w-14 h-14 rounded-full overflow-hidden border-2 transition ${
                      selectedAvatarUrl === url ? 'border-blue-500 shadow' : 'border-transparent shadow-sm'
                    } focus:outline-none focus:ring-2 focus:ring-blue-400`}
                    aria-label="Select preset avatar"
                  >
                    <img src={url} alt="avatar option" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <button
                onClick={onPickFile}
                className="px-6 py-3 rounded-full bg-white text-gray-700 font-medium shadow border border-gray-200 hover:border-gray-300"
              >
                Upload your Own
              </button>
            </div>

            {error && (
              <p className="mt-6 text-sm text-red-600 text-center">{error}</p>
            )}

            <div className="mt-8 space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-base font-semibold text-gray-800">Username</label>
                <input
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    validateUsername(e.target.value);
                  }}
                  placeholder="Enter username"
                  maxLength={30}
                  className={`h-12 w-full rounded-2xl border bg-white px-4 text-base placeholder:text-gray-400 ${usernameError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {usernameError && <p className="text-sm text-red-600">{usernameError}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-base font-semibold text-gray-800">Date of birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={handleDateOfBirthChange}
                  max={(() => {
                    const twoYearsAgo = new Date();
                    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
                    return twoYearsAgo.toISOString().split('T')[0];
                  })()}
                  min={(() => {
                    const hundredYearsAgo = new Date();
                    hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100);
                    return hundredYearsAgo.toISOString().split('T')[0];
                  })()}
                  className={`h-12 w-full rounded-2xl border bg-white px-4 text-base ${
                    dateOfBirthError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {dateOfBirthError && (
                  <p className="text-sm text-red-600">{dateOfBirthError}</p>
                )}
              </div>
            </div>

            <div className="mt-auto pt-10">
              <button
                onClick={handleConfirm}
                disabled={saving}
                className="h-12 w-full rounded-full bg-blue-600 text-white text-base font-semibold shadow disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="hidden md:flex min-h-screen items-center justify-center p-6"
        style={{
          backgroundImage: "url('/profileBg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
      <div className="w-full max-w-6xl bg-white/95 backdrop-blur rounded-2xl shadow border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6 bg-gray-100 border-b">
          <h1 className="text-2xl font-semibold">Set-up your <span className="font-bold">Profile</span></h1>
          <div className="flex items-center gap-2">
            <button onClick={handleConfirm} disabled={saving} className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60">{saving ? 'Saving...' : 'Confirm'}</button>
          </div>
        </div>
        {error && (
          <div className="px-6 pt-4 text-sm text-red-600">{error}</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="p-6 md:p-8 bg-gray-100 border-r">
            <div className="flex flex-col items-center gap-6">
              <AvatarPlaceholder src={uploadPreview} />
              <div className="grid grid-cols-5 gap-4">
                {presetAvatarUrls.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => onSelectPresetAvatar(url)}
                    className={`w-12 h-12 rounded-full overflow-hidden border ${selectedAvatarUrl === url ? 'border-indigo-500' : 'border-transparent'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    aria-label="Select preset avatar"
                  >
                    <img src={url} alt="avatar option" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <button onClick={onPickFile} className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800">Upload your profile</button>
            </div>
          </div>
          <div className="p-6 md:p-8 bg-gray-100">
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input value={username} onChange={(e) => { setUsername(e.target.value); validateUsername(e.target.value); }} placeholder="Enter username" maxLength={30} className={`w-full h-10 rounded-md border px-3 bg-white ${usernameError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                {usernameError && <p className="mt-1 text-sm text-red-600">{usernameError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date of birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={handleDateOfBirthChange}
                  max={(() => {
                    const twoYearsAgo = new Date();
                    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
                    return twoYearsAgo.toISOString().split('T')[0];
                  })()}
                  min={(() => {
                    const hundredYearsAgo = new Date();
                    hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100);
                    return hundredYearsAgo.toISOString().split('T')[0];
                  })()}
                  className={`w-full h-10 rounded-md border px-3 bg-white ${
                    dateOfBirthError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {dateOfBirthError && (
                  <p className="mt-1 text-sm text-red-600">{dateOfBirthError}</p>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupPage;

