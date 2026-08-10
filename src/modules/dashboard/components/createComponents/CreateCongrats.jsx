import React from 'react';

const CreateCongrats = ({ onDone, entityTitle = 'Group', subtitle }) => {
  return (
    <div className="relative w-full max-w-[750px] h-[680px] rounded-2xl overflow-hidden mx-auto my-0">
      <div className="bg-white py-3 px-2 sm:px-5 h-full">
        <div className="bg-[#282828] text-white p-4 sm:p-10 flex flex-col justify-center items-center text-center h-full rounded-2xl">
          <div className="mb-6 sm:mb-8">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-[84px] sm:h-[84px] mx-auto">
              <path d="M3 14l7-7 7 7-7 7-7-7z" fill="white" opacity="0"/>
              <path d="M8 15l8-8 1.5 1.5-8 8L8 15z" fill="white"/>
              <path d="M18 7l2 2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M15 4l1.5 1.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M20 12l-1.5 1.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="text-2xl sm:text-4xl font-semibold">Congratulations</h2>
          <p className="mt-2 sm:mt-3 text-gray-300 text-base sm:text-lg">{subtitle || `You have created your ${entityTitle}!`}</p>
          <button onClick={onDone} className="mt-6 sm:mt-8 px-4 sm:px-6 py-3 rounded-xl bg-indigo-100 text-gray-900 font-semibold text-base sm:text-lg">Done</button>
        </div>
      </div>
    </div>
  );
};

export default CreateCongrats;

