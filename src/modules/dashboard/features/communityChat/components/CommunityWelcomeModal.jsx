const CommunityWelcomeModal = ({
  onClose,
  onInvite,
  onStartConversation,
  roomTitle,
}) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
    <div className="bg-[#282828] text-white rounded-xl p-6 w-[min(90%,560px)] shadow-2xl">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-semibold">Welcome</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-white/80 hover:text-white"
          title="Close"
        >
          ✕
        </button>
      </div>
      <h2 className="text-2xl font-bold text-center">Welcome to</h2>
      <p className="mt-1 text-lg font-semibold text-center">{roomTitle}</p>
      <div className="mt-6 space-y-3 text-gray-900">
        <button
          type="button"
          onClick={onInvite}
          className="w-full bg-white rounded-md px-4 py-3 flex items-center justify-between"
        >
          <span>Invite your friends</span>
          <span>›</span>
        </button>
        <button
          type="button"
          onClick={onStartConversation}
          className="w-full bg-white rounded-md px-4 py-3 flex items-center justify-between"
        >
          <span>Send hey to start the convo!</span>
          <span>›</span>
        </button>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md"
        >
          Got it
        </button>
      </div>
    </div>
  </div>
);

export default CommunityWelcomeModal;
