const handleAvatarError = (event) => {
  event.currentTarget.style.display = 'none';
  const fallback = event.currentTarget.nextElementSibling;
  if (fallback) fallback.style.display = 'flex';
};

const RequestAvatar = ({ request }) => (
  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
    {request.avatar ? (
      <img
        src={request.avatar}
        alt={request.requester}
        className="w-full h-full object-cover"
        onError={handleAvatarError}
      />
    ) : null}
    <div
      className="w-full h-full bg-gray-300 flex items-center justify-center"
      style={{ display: request.avatar ? 'none' : 'flex' }}
    >
      <span className="text-xs font-semibold text-gray-600">
        {request.requester?.charAt(0) || 'U'}
      </span>
    </div>
  </div>
);

const RequestDescription = ({ request }) => (
  <div className="flex-1 min-w-0">
    <div className="text-sm font-semibold text-gray-800 leading-tight">
      {request.type === 'friend' ? (
        <span>{request.requester} wants to be your friend</span>
      ) : (
        <>
          {request.name}
          <span className="text-xs font-normal text-gray-500 ml-1">
            ({request.type})
          </span>
        </>
      )}
    </div>
    {request.type !== 'friend' && (
      <div className="text-xs text-gray-600 mt-1">
        {request.requester}
      </div>
    )}
  </div>
);

const RequestActions = ({
  isProcessing,
  onAccept,
  onReject,
  requestId,
}) => (
  <div className="flex gap-1.5 md:gap-2 flex-shrink-0">
    <button
      type="button"
      onClick={() => onReject(requestId)}
      disabled={isProcessing}
      className="px-2.5 md:px-4 py-1.5 md:py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-md transition-colors"
    >
      {isProcessing ? 'Processing...' : 'Reject'}
    </button>
    <button
      type="button"
      onClick={() => onAccept(requestId)}
      disabled={isProcessing}
      className="px-2.5 md:px-4 py-1.5 md:py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-md transition-colors"
    >
      {isProcessing ? 'Processing...' : 'Accept'}
    </button>
  </div>
);

const InboxRequestItem = ({
  onAccept,
  onReject,
  processingRequest,
  request,
}) => (
  <div className="flex items-center gap-3 md:gap-4 bg-white rounded-lg p-3 md:p-4 shadow-sm">
    <RequestAvatar request={request} />
    <RequestDescription request={request} />
    <RequestActions
      isProcessing={processingRequest === request.id}
      onAccept={onAccept}
      onReject={onReject}
      requestId={request.id}
    />
  </div>
);

export default InboxRequestItem;
