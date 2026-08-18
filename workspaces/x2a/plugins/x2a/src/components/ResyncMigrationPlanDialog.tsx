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
  CircularProgress,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@material-ui/core';
import { useTranslation } from '../hooks/useTranslation';

export type ResyncMigrationPlanDialogProps = {
  open: boolean;
  projectName: string;
  isRunning: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export const ResyncMigrationPlanDialog = ({
  open,
  projectName,
  isRunning,
  onConfirm,
  onClose,
}: ResyncMigrationPlanDialogProps) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="resync-plan-modal-title"
      aria-describedby="resync-plan-modal-description"
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id="resync-plan-modal-title">
        {t('resyncMigrationPlan.confirm.title' as any, { name: projectName })}
      </DialogTitle>
      <DialogContent>
        <Typography
          id="resync-plan-modal-description"
          variant="body1"
          gutterBottom
        >
          {t('resyncMigrationPlan.confirm.message' as any, {})}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t('resyncMigrationPlan.confirm.warning' as any, {})}
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          color="primary"
          onClick={onConfirm}
          disabled={isRunning}
          startIcon={
            isRunning ? <CircularProgress size={16} color="inherit" /> : null
          }
        >
          {t('resyncMigrationPlan.confirm.confirmButton' as any, {})}
        </Button>
        <Button variant="outlined" onClick={onClose} disabled={isRunning}>
          {t('bulkRun.cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
