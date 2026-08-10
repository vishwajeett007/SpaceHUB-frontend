import React from 'react';

const CreateMenu = ({ onBack, onFriends, onClubs, onJoin }) => {
  return (
  <div className="relative w-full max-w-full sm:max-w-[750px] rounded-2xl overflow-hidden min-h-[550px] sm:h-[680px] mx-auto">

      <div className="bg-white px-2 py-2 sm:p-4 rounded-t-2xl">
        <div className="bg-[#282828] text-white px-2 py-3 sm:p-5 mt-4 rounded-2xl">
          <div className="flex flex-col items-center mb-4 sm:mb-6 md:hidden">
            <div className="w-16 h-16 rounded-full bg-[#1E2635] flex items-center justify-center mb-4">
              <div className="relative w-6 h-6" aria-hidden="true">
                <span className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[3px] rounded-full bg-white" />
                <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full bg-white" />
              </div>
            </div>
            <h2 className="text-lg sm:text-2xl font-semibold">Create/join</h2>
          </div>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="hidden md:block text-lg sm:text-2xl font-semibold">Create</h2>
            <button onClick={onBack} className="text-white/90 hover:text-white text-base sm:text-lg">Back</button>
          </div>
          <div className="mt-3 sm:mt-4 flex flex-col gap-2 sm:space-y-4">
            <button onClick={onFriends} className="w-full bg-white text-gray-900 rounded-xl px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-2 sm:gap-3 shadow-sm hover:shadow transition text-base sm:text-lg">
              <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gray-200 flex items-center justify-center">
                <img src="/icons/user-friends.svg" alt="Friends" className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
              <span className="font-semibold">For me and my Friends</span>
            </button>
            <button onClick={onClubs} className="w-full bg-white text-gray-900 rounded-xl px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-2 sm:gap-3 shadow-sm hover:shadow transition text-base sm:text-lg">
              <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gray-200 flex items-center justify-center">
                <img src="/icons/community.svg" alt="Community" className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
              <span className="font-semibold">For clubs and community</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-b-2xl px-2 sm:p-5">
  <div className="rounded-2xl border-3 border-black px-2 py-3 sm:p-6 flex flex-col items-center text-center w-full">
          <p className="text-base sm:text-lg font-medium mb-2 sm:mb-3">Have an invite link?</p>
          <button onClick={onJoin} className="w-full px-2 py-2 sm:px-5 sm:py-3 rounded-xl bg-purple-600 text-white text-base sm:text-lg font-semibold hover:bg-purple-700 transition">Join a group or a community</button>
        </div>
      </div>
    </div>
  );
};

export default CreateMenu;

