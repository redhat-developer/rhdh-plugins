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
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';

import { useTranslation } from '../hooks/useTranslation';

export const DeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      variant={ModalVariant.small}
      isOpen={isOpen}
      onClose={onClose}
      ouiaId="DeleteModal"
      aria-labelledby="delete-modal"
      aria-describedby="delete-modal-confiramtion"
    >
      <ModalHeader title={t('conversation.history.confirm.title')} />
      <ModalBody id="delete-modal-body-confirmation">
        {t('conversation.history.confirm.message')}
      </ModalBody>
      <ModalFooter>
        <Button key="confirm" variant="danger" onClick={onConfirm}>
          {t('conversation.history.confirm.delete')}
        </Button>
        <Button key="cancel" variant="link" onClick={onClose}>
          {t('common.cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
