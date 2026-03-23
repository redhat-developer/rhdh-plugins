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

import { useCallback, useEffect, useRef } from 'react';
import {
  CircularProgress,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@material-ui/core';
import { useTranslation } from '../hooks/useTranslation';

export type BulkRunConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  isRunning: boolean;
  onConfirm: () => void;
  onClose: () => void;
  idPostfix: string;
  confirmLabel?: string;
  children?: React.ReactNode;
};

export const BulkRunConfirmDialog = ({
  open,
  title,
  message,
  isRunning,
  idPostfix,
  onConfirm,
  onClose,
  confirmLabel,
  children,
}: BulkRunConfirmDialogProps) => {
  const { t } = useTranslation();
  const titleId = `bulk-run-modal-title-${idPostfix}`;
  const descriptionId = `bulk-run-modal-description-${idPostfix}`;

  const confirmingRef = useRef(false);

  useEffect(() => {
    if (!open || !isRunning) {
      confirmingRef.current = false;
    }
  }, [open, isRunning]);

  const handleConfirm = useCallback(() => {
    // Potential fast double-click protection
    if (confirmingRef.current) return;
    confirmingRef.current = true;

    onConfirm();
  }, [onConfirm]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent id={descriptionId}>
        <Typography variant="body1">{message}</Typography>
        {children}
      </DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          color="primary"
          onClick={handleConfirm}
          disabled={isRunning}
          startIcon={
            isRunning ? <CircularProgress size={16} color="inherit" /> : null
          }
        >
          {confirmLabel ?? t('bulkRun.confirm')}
        </Button>
        <Button variant="outlined" onClick={onClose} disabled={isRunning}>
          {t('bulkRun.cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
