import { forwardRef, useId } from 'react';

const ConfirmationModal = forwardRef(function ConfirmationModal({
  isOpen,
  title,
  description,
  onClose,
  onConfirm,
  isProcessing = false,
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  processingLabel = 'Working...',
}, ref) {
  const titleId = useId();
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-[#282828]/50 flex items-center justify-center z-50"
      role="presentation"
    >
      <div
        ref={ref}
        className="bg-[#282828] rounded-xl p-8 max-w-md w-full mx-4 relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-1 disabled:opacity-50"
          title="Close"
          aria-label="Close confirmation dialog"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <h2 id={titleId} className="text-2xl font-bold text-white mb-4">
          {title}
        </h2>
        <div className="text-white text-sm mb-6">{description}</div>

        <div className="flex items-center gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? processingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
});

export default ConfirmationModal;
