/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  Alert,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '@patternfly/react-core';

import { useDeleteConversation } from '../hooks';
import { useTranslation } from '../hooks/useTranslation';

export const DeleteModal = ({
  isOpen,
  conversationId,
  chatName,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  conversationId: string;
  chatName?: string;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  const { t } = useTranslation();
  const {
    mutateAsync: deleteConversation,
    isError,
    error,
    isPending,
  } = useDeleteConversation();

  const handleDeleteConversation = async () => {
    try {
      await deleteConversation({
        conversation_id: conversationId,
        invalidateCache: false,
      });
      onConfirm();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(e);
    }
  };

  return (
    <Modal
      variant="small"
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="delete-modal"
      aria-describedby="delete-modal-confirmation"
    >
      <ModalHeader
        title={t('conversation.delete.confirm.title' as any, {
          chatName: chatName || '',
        })}
        labelId="delete-modal"
        descriptorId="delete-modal-confirmation"
      />
      <ModalBody id="delete-modal-confirmation">
        {t('conversation.delete.confirm.message')}
        {isError && (
          <Alert
            variant="danger"
            isInline
            title={String(error)}
            className="pf-v6-u-mt-md"
          />
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          variant="danger"
          onClick={handleDeleteConversation}
          isDisabled={isPending}
        >
          {t('conversation.delete.confirm.action')}
        </Button>
        <Button variant="link" onClick={onClose}>
          {t('common.cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
