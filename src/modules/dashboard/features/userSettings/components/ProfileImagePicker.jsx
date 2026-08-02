import { CloseIcon, PlusIcon } from './UserSettingsIcons';

const ImageActionIcon = ({ hasPendingImage, isMobile }) => (
  hasPendingImage
    ? (
      <CloseIcon
        className={isMobile ? 'w-3.5 h-3.5 text-white' : ''}
        size={14}
      />
    )
    : (
      <PlusIcon
        className={isMobile ? 'w-3.5 h-3.5 text-white' : ''}
        size={14}
      />
    )
);

const MobileProfileImagePicker = ({ profileImage }) => (
  <div className="flex flex-col items-center mb-4">
    <div className="relative mb-3">
      <button
        type="button"
        onClick={profileImage.openFilePicker}
        className="relative focus:outline-none"
        aria-label="Choose a profile photo"
      >
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
          <img
            src={profileImage.imageUrl}
            alt="avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </button>
      <button
        type="button"
        onClick={profileImage.hasPendingImage
          ? profileImage.removeSelectedImage
          : profileImage.openFilePicker}
        className="absolute -right-0 -top-0 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white hover:bg-blue-600 transition-colors cursor-pointer"
        aria-label={profileImage.hasPendingImage ? 'Remove selected photo' : 'Choose a profile photo'}
      >
        <ImageActionIcon hasPendingImage={profileImage.hasPendingImage} isMobile />
      </button>
    </div>
    <button
      type="button"
      onClick={profileImage.openFilePicker}
      className="bg-gray-700 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
    >
      Upload
    </button>
  </div>
);

const DesktopProfileImagePicker = ({ profileImage }) => (
  <div className="mb-6">
    <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-600">
      <img
        src={profileImage.imageUrl}
        alt="avatar"
        className="w-full h-full object-cover"
      />
      <button
        type="button"
        onClick={profileImage.hasPendingImage
          ? profileImage.removeSelectedImage
          : profileImage.openFilePicker}
        className="absolute -right-1 -top-1 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors cursor-pointer z-10"
        aria-label={profileImage.hasPendingImage ? 'Remove selected photo' : 'Choose a profile photo'}
      >
        <ImageActionIcon hasPendingImage={profileImage.hasPendingImage} />
      </button>
    </div>
    <div className="mt-3">
      <button
        type="button"
        onClick={profileImage.openFilePicker}
        className="inline-block cursor-pointer bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-md text-sm"
      >
        Upload new photo
      </button>
    </div>
  </div>
);

const ProfileImagePicker = ({ profileImage, isMobile = false }) => (
  isMobile
    ? <MobileProfileImagePicker profileImage={profileImage} />
    : <DesktopProfileImagePicker profileImage={profileImage} />
);

export default ProfileImagePicker;
