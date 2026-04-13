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

import { Button, Typography } from '@material-ui/core';
import { DcmFormDialog } from './DcmFormDialog';

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  resourceName: string;
  resourceLabel?: string;
}>;

/**
 * Generic delete-confirmation dialog reused across all DCM resource tabs.
 */
export function DcmDeleteDialog({
  open,
  onClose,
  onConfirm,
  resourceName,
  resourceLabel = 'item',
}: Props) {
  return (
    <DcmFormDialog
      open={open}
      onClose={onClose}
      title={`Delete ${resourceLabel}`}
      actions={
        <>
          <Button variant="contained" color="secondary" onClick={onConfirm}>
            Delete
          </Button>
          <Button variant="outlined" color="primary" onClick={onClose}>
            Cancel
          </Button>
        </>
      }
    >
      <Typography variant="body1">
        Are you sure you want to delete <strong>{resourceName}</strong>? This
        action cannot be undone.
      </Typography>
    </DcmFormDialog>
  );
}
