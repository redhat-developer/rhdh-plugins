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

import { Button, CircularProgress, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { DcmFormDialog } from './DcmFormDialog';
import { Trans } from './Trans';
import { useTranslation } from '../hooks/useTranslation';

const useStyles = makeStyles(theme => ({
  deleteButton: {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
    '&:hover': { backgroundColor: theme.palette.error.dark },
    '&.Mui-disabled': { opacity: 0.6 },
  },
}));

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  resourceName: string;
  resourceLabel?: string;
  /** When set, renders an error banner inside the dialog. */
  error?: string | null;
  /** When true, disables both buttons and shows a spinner on Delete. */
  isSubmitting?: boolean;
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
  error,
  isSubmitting = false,
}: Props) {
  const classes = useStyles();
  const { t } = useTranslation();
  return (
    <DcmFormDialog
      open={open}
      onClose={onClose}
      title={(t as any)('deleteDialog.title', { resourceLabel })}
      error={error}
      submitting={isSubmitting}
      actions={
        <>
          <Button
            variant="contained"
            className={classes.deleteButton}
            disabled={isSubmitting}
            onClick={onConfirm}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : undefined
            }
          >
            {t('deleteDialog.confirmButton')}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            disabled={isSubmitting}
            onClick={onClose}
          >
            {t('deleteDialog.cancelButton')}
          </Button>
        </>
      }
    >
      <Typography variant="body1">
        <Trans
          message="deleteDialog.body"
          values={{ resourceName: <strong>{resourceName}</strong> }}
        />
      </Typography>
    </DcmFormDialog>
  );
}
