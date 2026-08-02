import ConfirmationModal from '../../../../../shared/components/ConfirmationModal';
import { useCommunitySettings } from '../hooks/useCommunitySettings';

const CommunitySettingsModals = () => {
  const { dialogs } = useCommunitySettings();
  const deleteGroupDescription = dialogs.deleteGroup.target
    ? `Are you sure you want to delete the group "${dialogs.deleteGroup.target.group.name}"? This action cannot be undone.`
    : '';

  return (
    <>
      <ConfirmationModal
        ref={dialogs.deleteCommunity.ref}
        isOpen={dialogs.deleteCommunity.isOpen}
        title="Delete community"
        description="Deleting this community will remove all its data. Make sure you really want to continue."
        onClose={dialogs.deleteCommunity.close}
        onConfirm={dialogs.deleteCommunity.confirm}
        isProcessing={dialogs.deleteCommunity.isProcessing}
        confirmLabel="Delete"
        processingLabel="Deleting..."
      />

      <ConfirmationModal
        ref={dialogs.leaveCommunity.ref}
        isOpen={dialogs.leaveCommunity.isOpen}
        title="Leave community"
        description="Are you sure you want to leave this community? You will lose access to all channels and conversations."
        onClose={dialogs.leaveCommunity.close}
        onConfirm={dialogs.leaveCommunity.confirm}
        isProcessing={dialogs.leaveCommunity.isProcessing}
        confirmLabel="Leave"
        processingLabel="Leaving..."
      />

      <ConfirmationModal
        ref={dialogs.deleteGroup.ref}
        isOpen={dialogs.deleteGroup.isOpen}
        title="Delete group"
        description={deleteGroupDescription}
        onClose={dialogs.deleteGroup.close}
        onConfirm={dialogs.deleteGroup.confirm}
        isProcessing={dialogs.deleteGroup.isProcessing}
        confirmLabel="Delete"
        processingLabel="Deleting..."
      />
    </>
  );
};

export default CommunitySettingsModals;
