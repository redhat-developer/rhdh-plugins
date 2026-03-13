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

export const DeleteProjectDialog = ({
  onClose,
  onConfirm,
  open,
  isDeleting,
  projectName,
}: {
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  isDeleting: boolean;
  projectName: string;
}) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="delete-project-modal-title"
      aria-describedby="delete-project-modal-description"
    >
      <DialogTitle id="delete-project-modal-title">
        {t('projectPage.deleteConfirm.title' as any, { name: projectName })}
      </DialogTitle>
      <DialogContent id="delete-project-modal-description">
        <Typography variant="body1">
          {t('projectPage.deleteConfirm.message')}
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          color="secondary"
          onClick={onConfirm}
          disabled={isDeleting}
          startIcon={
            isDeleting ? <CircularProgress size={16} color="inherit" /> : null
          }
        >
          {t('projectPage.deleteConfirm.confirm')}
        </Button>
        <Button variant="outlined" onClick={onClose} disabled={isDeleting}>
          {t('projectPage.deleteConfirm.cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
