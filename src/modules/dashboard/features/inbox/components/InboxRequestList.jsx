import InboxRequestItem from './InboxRequestItem';

const InboxLoadingState = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="flex items-center gap-4 bg-white rounded-lg p-4 shadow-sm animate-pulse"
      >
        <div className="w-12 h-12 rounded-full bg-gray-300" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-gray-300 rounded" />
          <div className="h-3 w-1/2 bg-gray-200 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="w-16 h-8 bg-gray-300 rounded" />
          <div className="w-16 h-8 bg-gray-300 rounded" />
        </div>
      </div>
    ))}
  </div>
);

const InboxEmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <svg
      className="w-16 h-16 text-gray-300 mb-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
    <p className="text-gray-500 text-sm font-medium">No requests</p>
    <p className="text-gray-400 text-xs mt-1">
      You don&apos;t have any pending requests
    </p>
  </div>
);

const InboxRequestList = ({
  error,
  loading,
  onAccept,
  onReject,
  processingRequest,
  requests,
}) => {
  if (loading) return <InboxLoadingState />;

  if (error) {
    return (
      <div className="text-center text-red-500 py-12 text-sm">
        {error}
      </div>
    );
  }

  if (requests.length === 0) return <InboxEmptyState />;

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <InboxRequestItem
          key={request.id}
          request={request}
          processingRequest={processingRequest}
          onAccept={onAccept}
          onReject={onReject}
        />
      ))}
    </div>
  );
};

export default InboxRequestList;
