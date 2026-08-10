import React, { useRef, useState, useEffect } from 'react';

const CreateGroup = ({
  onBack,
  onConfirm,
  title = 'Create a group',
  subtitle = 'Start your own group and bring people together. Share ideas, interests, and good vibes in one place.',
  nameLabel = 'Group name',
  placeholder = 'Enter group name',
  confirmText = 'Confirm',
  initialName = '',
  initialImageFile = null,
  onChange,
  iconSrc = null,
}) => {
  const [groupName, setGroupName] = useState(initialName || '');
  const [preview, setPreview] = useState('');
  const [imageFile, setImageFile] = useState(initialImageFile || null);
  const [touchedName, setTouchedName] = useState(false);
  const [touchedImage, setTouchedImage] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialName) setGroupName(initialName);
  }, [initialName]);

  useEffect(() => {
    const f = imageFile || initialImageFile;
    if (f instanceof File || f instanceof Blob) {
      const url = URL.createObjectURL(f);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    if (!f) setPreview('');
  }, [imageFile, initialImageFile]);

  const onPickFile = () => fileInputRef.current?.click();
  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    onChange?.({ name: groupName, imageFile: f });
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setImageFile(null);
    setPreview('');
    onChange?.({ name: groupName, imageFile: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getCharacterCount = (text) => {
    return text.length;
  };

  const containsEmoji = (value) => {
    if (!value) return false;
    const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{27BF}]/u;
    return emojiRegex.test(value);
  };

  const handleNameChange = (e) => {
    const value = e.target.value;

    if (value.length > 30) {
      return;
    }

    if (containsEmoji(value)) {
      return;
    }

    setGroupName(value);
    onChange?.({ name: value, imageFile });
  };

  const handleConfirm = () => {
    const isNameValid = !!groupName.trim() && groupName.length <= 30 && !containsEmoji(groupName);
    const isImageValid = !!imageFile;
    setTouchedName(true);
    setTouchedImage(true);
    if (!isNameValid || !isImageValid) return;
    onConfirm?.({ groupName, imageFile });
  };

  const characterCount = getCharacterCount(groupName);
  const showNameError = touchedName && !groupName.trim();
  const showCharacterLimitError = characterCount > 30;
  const showEmojiError = touchedName && containsEmoji(groupName);
  const showImageError = touchedImage && !imageFile;

  return (
    <div className="relative w-full max-w-[750px] h-[680px] rounded-2xl overflow-hidden mx-auto my-0">
      <div className="bg-white py-3 px-2 sm:px-5 h-full">
        <div className="bg-[#282828] rounded-2xl h-full text-white p-3 sm:p-6 flex flex-col">
          <div className="flex-1 flex flex-col justify-center items-center">
            <h2 className="text-2xl sm:text-4xl font-semibold text-center">{title}</h2>
            <p className="mt-2 sm:mt-4 text-gray-300 max-w-2xl text-center text-base sm:text-lg">{subtitle}</p>
            <div className="mt-5 sm:mt-8 flex justify-center w-full">
          <div className="relative">
                <button onClick={onPickFile} className="w-24 h-24 sm:w-40 sm:h-40 rounded-full border-2 border-white/80 flex flex-col items-center justify-center text-lg font-medium transition">
              {preview ? (
                <img src={preview} alt="preview" className="w-full h-full object-cover rounded-full" />
              ) : (
                <>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-[42px] sm:h-[42px]">
                    <path d="M4 7h4l2-2h4l2 2h4v12H4V7z" stroke="white" strokeWidth="1.5"/>
                    <circle cx="12" cy="13" r="3" fill="white"/>
                  </svg>
                      <span className="mt-2 text-sm sm:text-base">Upload</span>
                </>
              )}
            </button>
                <button
                  onClick={preview ? handleRemoveImage : onPickFile}
                  className="absolute -right-0 -top-0 mt-2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-lg sm:text-xl hover:bg-indigo-700 transition-colors cursor-pointer"
                  type="button"
                >
                  {preview ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="sm:w-5 sm:h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    '+'
                  )}
                </button>
            <input ref={fileInputRef} onChange={onFileChange} type="file" accept="image/*" className="hidden" />
                {showImageError && (
                  <p className="absolute left-1/2 -bottom-7 -translate-x-1/2 text-sm text-red-400 whitespace-nowrap">Image is required.</p>
                )}
          </div>
        </div>
            <div className="mt-6 sm:mt-10 w-full">
              <label className="block text-lg sm:text-2xl font-semibold mb-2 sm:mb-3">{nameLabel}</label>
              <div className={`bg-white text-gray-900 rounded-xl flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 ${showNameError ? 'ring-2 ring-red-400' : ''}`}>
                {iconSrc ? (
                  <img src={iconSrc} alt="" aria-hidden="true" className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-[22px] sm:h-[22px]">
                    <path d="M16 14c2.21 0 4 1.79 4 4v1H12v-1c0-2.21 1.79-4 4-4Z" fill="#111827"/>
                    <path d="M8 14c2.21 0 4 1.79 4 4v1H0v-1c0-2.21 1.79-4 4-4Z" fill="#111827"/>
                    <circle cx="16" cy="8" r="3" fill="#111827"/>
                    <circle cx="8" cy="8" r="3" fill="#111827"/>
                  </svg>
                )}
            <input
              value={groupName}
                  onChange={handleNameChange}
                  onBlur={() => setTouchedName(true)}
              placeholder={placeholder}
                  className="flex-1 outline-none text-base sm:text-lg bg-transparent min-w-0"
                  maxLength={30}
              />
              </div>
              <div className="flex items-center justify-between mt-1">
                {showNameError && (
                  <p className="text-sm text-red-400">{nameLabel} is required.</p>
                )}
                {showCharacterLimitError && (
                  <p className="text-sm text-red-400 ml-auto">Maximum 30 characters allowed.</p>
                )}
                {showEmojiError && !showCharacterLimitError && (
                  <p className="text-sm text-red-400 ml-auto">Emojis are not allowed.</p>
                )}
                {!showNameError && !showCharacterLimitError && !showEmojiError && (
                  <p className="text-sm text-gray-400 ml-auto">{characterCount}/30 characters</p>
                )}
              </div>
          </div>
        </div>
          <div className="flex items-center justify-between mt-6 sm:mt-8">
            <button onClick={onBack} className="text-white/90 hover:text-white text-base sm:text-lg">Back</button>
            <button onClick={handleConfirm} className="px-4 sm:px-5 py-2 rounded-xl bg-indigo-100 text-gray-900 font-semibold text-base sm:text-lg">{confirmText}</button>
        </div>
      </div>
              </div>
    </div>
  );
};

export default CreateGroup;

