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
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  Flex,
  Text,
} from '@backstage/ui';

import { useTranslation } from '../../hooks/useTranslation';
import styles from './UnsavedChangesDialog.module.css';

export type UnsavedChangesDialogProps = {
  open: boolean;
  onCancel: () => void;
  onConfirmDiscard: () => void;
};

/**
 * Close confirmation when the builder session is dirty.
 * Export ZIP is shown to match the prototype; wiring is out of scope for now.
 */
export const UnsavedChangesDialog = ({
  open,
  onCancel,
  onConfirmDiscard,
}: UnsavedChangesDialogProps) => {
  const { t } = useTranslation();

  if (!open) {
    return null;
  }

  return (
    <Dialog
      isOpen
      onOpenChange={isOpen => {
        if (!isOpen) {
          onCancel();
        }
      }}
      width="min(520px, calc(100vw - 32px))"
      data-testid="unsaved-changes-dialog"
    >
      <DialogHeader>{t('builder.unsavedChanges.title')}</DialogHeader>
      <DialogBody>
        <Alert
          status="warning"
          icon
          title={t('builder.unsavedChanges.warning')}
          className={styles.warningAlert}
        />
        <Text variant="body-small" weight="regular" color="secondary">
          {t('builder.unsavedChanges.confirm')}
        </Text>
      </DialogBody>
      <DialogFooter>
        <Flex
          style={{ width: '100%' }}
          align="center"
          justify="between"
          gap="2"
        >
          <Button
            variant="secondary"
            // Export ZIP is out of scope for this story; button kept for UI parity.
            isDisabled
            data-testid="unsaved-changes-export-zip"
          >
            {t('builder.unsavedChanges.exportZip')}
          </Button>
          <Flex gap="2">
            <Button
              variant="secondary"
              onClick={onCancel}
              data-testid="unsaved-changes-cancel"
            >
              {t('builder.unsavedChanges.keepEditing')}
            </Button>
            <Button
              variant="primary"
              onClick={onConfirmDiscard}
              data-testid="unsaved-changes-discard"
            >
              {t('builder.unsavedChanges.discard')}
            </Button>
          </Flex>
        </Flex>
      </DialogFooter>
    </Dialog>
  );
};
