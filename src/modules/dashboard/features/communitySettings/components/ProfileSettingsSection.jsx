import { useCommunitySettings } from '../hooks/useCommunitySettings';

const EditIcon = ({ size, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const ProfileImageEditor = ({ mobile }) => {
  const { community, profile } = useCommunitySettings();
  const hasImage = profile.profileImagePreview || (community.imageUrl && !community.imageError);

  return (
    <div className="mb-4">
      <h3 className={`${mobile ? 'text-sm text-gray-800 mb-3' : 'text-lg text-white mb-2'} font-semibold`}>
        Profile
      </h3>
      <div className={mobile ? 'mb-2' : 'flex items-center gap-4'}>
        <div className={`relative rounded-xl overflow-hidden flex-shrink-0 ${
          mobile ? 'w-24 h-24 bg-gray-200' : 'w-20 h-20 bg-zinc-400'
        }`}>
          {profile.profileImagePreview ? (
            <img src={profile.profileImagePreview} alt="Preview" className="w-full h-full object-cover" />
          ) : community.imageUrl && !community.imageError ? (
            <img
              src={community.imageUrl}
              alt={community.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={community.markImageError}
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${mobile ? 'bg-gray-200' : 'bg-zinc-400'}`}>
              <div className={`${mobile ? 'text-3xl text-gray-400' : 'text-2xl text-gray-800'} font-bold`}>
                {community.title.charAt(0).toUpperCase()}
              </div>
            </div>
          )}

          {hasImage && mobile && (
            <button
              onClick={profile.openImagePicker}
              className="absolute right-2 bottom-2 w-6 h-6 rounded-full bg-white hover:bg-gray-100 text-gray-600 flex items-center justify-center transition-colors cursor-pointer z-10 shadow-md"
              type="button"
            >
              <EditIcon size={14} />
            </button>
          )}

          {hasImage && !mobile && (
            <button
              onClick={profile.removeImage}
              className="absolute -right-1 -top-1 w-7 h-7 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-700 flex items-center justify-center transition-colors cursor-pointer z-10"
              type="button"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {!mobile && (
          <button
            onClick={profile.openImagePicker}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-semibold transition-colors text-sm"
          >
            {profile.profileImageFile ? 'Change image' : 'Upload image'}
          </button>
        )}
      </div>
      <input
        ref={profile.fileInputRef}
        type="file"
        accept="image/*"
        onChange={profile.changeImage}
        className="hidden"
      />
    </div>
  );
};

const CommunityNameEditor = ({ mobile }) => {
  const { profile } = useCommunitySettings();

  return (
    <div className={mobile ? 'mb-3 hidden' : 'mb-4'}>
      <label className={`block font-medium ${mobile ? 'text-gray-800 text-xs mb-1' : 'text-white text-sm mb-2'}`}>
        Community name
      </label>
      <div className="relative">
        <input
          type="text"
          value={profile.communityName}
          onChange={(event) => profile.changeName(event.target.value)}
          className={mobile
            ? `w-full bg-gray-50 border border-gray-300 text-gray-800 px-3 py-2 rounded-lg outline-none placeholder:text-gray-400 pr-8 text-sm ${profile.communityNameError ? 'ring-1 ring-red-500 border-red-500' : 'focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500'}`
            : `w-full bg-gray-700 text-white px-4 py-2.5 rounded-md outline-none placeholder:text-gray-400 pr-10 ${profile.communityNameError ? 'ring-1 ring-red-500' : ''}`}
          placeholder="Enter community name"
          maxLength={30}
        />
        <div className={`absolute top-1/2 -translate-y-1/2 ${mobile ? 'right-2' : 'right-3'}`}>
          <EditIcon size={mobile ? 14 : 16} className="text-gray-400" />
        </div>
      </div>
      {profile.communityNameError ? (
        <p className={`${mobile ? 'text-red-500 text-xs mt-0.5' : 'text-red-400 text-sm mt-1'}`}>
          {profile.communityNameError}
        </p>
      ) : (
        <p className={`${mobile ? 'text-gray-500 text-xs mt-0.5' : 'text-gray-400 text-xs mt-1'}`}>
          {profile.communityName.length}/30{mobile ? '' : ' characters'}
        </p>
      )}
    </div>
  );
};

const BannerEditor = ({ mobile }) => {
  const { community, profile } = useCommunitySettings();

  return (
    <div className={mobile ? 'mb-3' : 'mb-4'}>
      <label className={`block font-medium ${mobile ? 'text-gray-800 text-xs mb-1' : 'text-white text-sm mb-2'}`}>
        Banner
      </label>
      <div className={`overflow-hidden ${mobile ? 'rounded-lg bg-gray-100 mb-2 border border-gray-200' : 'rounded-xl bg-gray-700 mb-2'}`}>
        {profile.bannerImagePreview ? (
          <img
            src={profile.bannerImagePreview}
            alt="Banner Preview"
            className={`w-full object-cover ${mobile ? 'h-24' : 'h-32'}`}
          />
        ) : community.bannerUrl && !community.bannerError ? (
          <img
            src={community.bannerUrl}
            alt="Banner"
            className={`w-full object-cover ${mobile ? 'h-24' : 'h-32'}`}
            referrerPolicy="no-referrer"
            onError={community.markBannerError}
          />
        ) : (
          <div className={`w-full flex items-center justify-center ${mobile ? 'h-24 bg-gray-100' : 'h-32 bg-gray-700'}`}>
            <span className={`${mobile ? 'text-gray-400 text-xs' : 'text-gray-500 text-sm'}`}>
              {mobile ? 'No banner' : 'No banner image'}
            </span>
          </div>
        )}
      </div>
      <button
        onClick={profile.openBannerPicker}
        className={mobile
          ? 'bg-gray-800 hover:bg-gray-900 text-white px-4 py-1.5 rounded-lg font-semibold transition-colors w-full text-xs'
          : 'bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-semibold transition-colors'}
      >
        {profile.bannerImageFile
          ? 'Change banner'
          : mobile ? 'Upload' : 'Upload your own'}
      </button>
      <input
        ref={profile.bannerInputRef}
        type="file"
        accept="image/*"
        onChange={profile.changeBanner}
        className="hidden"
      />
    </div>
  );
};

const DescriptionEditor = ({ mobile }) => {
  const { profile } = useCommunitySettings();

  return (
    <div className={mobile ? 'mb-3' : 'flex-1'}>
      <label className={`block font-medium ${mobile ? 'text-gray-800 text-xs mb-1' : 'text-white text-sm mb-2'}`}>
        Description
      </label>
      <textarea
        value={profile.description}
        onChange={(event) => profile.setDescription(event.target.value)}
        className={mobile
          ? 'w-full bg-gray-50 border border-gray-300 text-gray-800 px-3 py-2 rounded-lg outline-none placeholder:text-gray-400 resize-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm'
          : 'w-full bg-gray-700 text-white px-4 py-2.5 rounded-md outline-none placeholder:text-gray-400 resize-none'}
        rows={mobile ? 2 : 3}
        placeholder={mobile
          ? 'A curious mind who enjoys coding, design, Tech and community-driven projects...'
          : 'Enter community description'}
        maxLength={80}
      />
      {mobile && <p className="text-gray-500 text-xs mt-0.5">{profile.description.length}/80</p>}
    </div>
  );
};

const ProfileFields = ({ mobile }) => (
  <>
    <ProfileImageEditor mobile={mobile} />
    <CommunityNameEditor mobile={mobile} />
    <BannerEditor mobile={mobile} />
    <DescriptionEditor mobile={mobile} />
  </>
);

export const MobileProfileSettingsSection = () => (
  <div className="flex-1 p-3 overflow-hidden">
    <div className="bg-white rounded-xl shadow-md p-4 h-full flex flex-col">
      <div className="mb-4">
        <div className="bg-[#282828] text-white px-4 py-2 rounded-md inline-block">
          <span className="text-sm font-medium">Community Profile</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ProfileFields mobile />
      </div>
    </div>
  </div>
);

export const DesktopProfileSettingsSection = () => {
  const { navigation, profile } = useCommunitySettings();

  return (
    <div className="p-6 h-full flex flex-col min-h-0" style={{ height: '100%' }}>
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-3xl font-bold text-white">Community profile</h2>
        <div className="flex items-center gap-3">
          <button onClick={navigation.goBack} className="px-4 py-2 text-gray-300 hover:text-white transition-colors">
            Back
          </button>
          <button
            onClick={profile.save}
            disabled={!profile.hasChanges || profile.saving}
            className={`px-6 py-2 rounded-md font-semibold transition-colors ${
              profile.hasChanges && !profile.saving
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {profile.saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-start overflow-y-auto min-h-0 scrollbar-hide">
        <ProfileFields mobile={false} />
      </div>
    </div>
  );
};
