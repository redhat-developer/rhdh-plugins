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

import { useTranslation } from '../hooks/useTranslation';

type DeleteSavedPromptModalProps = {
  isOpen: boolean;
  promptName?: string;
  isDeleting: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export const DeleteSavedPromptModal = ({
  isOpen,
  promptName,
  isDeleting,
  error,
  onClose,
  onConfirm,
}: DeleteSavedPromptModalProps) => {
  const { t } = useTranslation();

  return (
    <Modal
      variant="small"
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="delete-saved-prompt-modal"
      aria-describedby="delete-saved-prompt-modal-confirmation"
    >
      <ModalHeader
        title={t('savedPrompts.delete.confirm.title' as any, {
          name: promptName || '',
        })}
        labelId="delete-saved-prompt-modal"
        descriptorId="delete-saved-prompt-modal-confirmation"
      />
      <ModalBody id="delete-saved-prompt-modal-confirmation">
        {t('savedPrompts.delete.confirm.message')}
        {error && (
          <Alert
            variant="danger"
            isInline
            title={error}
            className="pf-v6-u-mt-md"
          />
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          variant="danger"
          onClick={onConfirm}
          isDisabled={isDeleting}
          isLoading={isDeleting}
        >
          {t('savedPrompts.delete.confirm.action')}
        </Button>
        <Button variant="link" onClick={onClose} isDisabled={isDeleting}>
          {t('common.cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
