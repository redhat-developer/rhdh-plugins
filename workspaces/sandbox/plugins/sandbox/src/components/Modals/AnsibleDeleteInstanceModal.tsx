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
import React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import WarningIcon from '@mui/icons-material/Warning';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';

type AnsibleDeleteInstanceModalProps = {
  modalOpen: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleAnsibleDeleteInstance: () => void;
};

export const AnsibleDeleteInstanceModal: React.FC<
  AnsibleDeleteInstanceModalProps
> = ({ modalOpen, setOpen, handleAnsibleDeleteInstance }) => {
  const theme = useTheme();

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog open={modalOpen} onClose={handleClose} fullWidth>
      <DialogTitle
        variant="h3"
        sx={{ fontWeight: 700, padding: '32px 24px 0 24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <WarningIcon
            sx={{
              color: theme.palette.warning.main,
              fontSize: 28,
            }}
          />
          <div style={{ width: '30rem' }}>Delete instance?</div>
        </div>
      </DialogTitle>
      <IconButton
        aria-label="close"
        onClick={handleClose}
        sx={{
          position: 'absolute',
          right: 16,
          top: 24,
          color: theme.palette.grey[500],
        }}
      >
        <CloseIcon />
      </IconButton>{' '}
      <DialogContent sx={{ padding: '6px 24px' }}>
        <Typography
          variant="body1"
          sx={{ mr: 2, my: 0.5, fontSize: '16px', fontWeight: 420 }}
        >
          Your AAP instance will be deleted. Consider backing up your work
          before continuing.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'flex-start', pl: 3 }}>
        <Button
          variant="contained"
          onClick={handleAnsibleDeleteInstance}
          sx={{
            textTransform: 'none',
            marginTop: theme.spacing(2),
            marginBottom: theme.spacing(2),
          }}
        >
          Delete instance
        </Button>
        <Button
          variant="outlined"
          onClick={handleClose}
          sx={{
            textTransform: 'none',
            marginTop: theme.spacing(2),
            marginBottom: theme.spacing(2),
            border: `1px solid ${theme.palette.primary.main}`,
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.04)',
              borderColor: '#1976d2',
            },
          }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AnsibleDeleteInstanceModal;
