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
import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Visibility, VisibilityOff, ContentCopy } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import Box from '@mui/material/Box';

const username = 'admin';
const password = 'password';

type AnsibleLaunchInfoModalProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const AnsibleLaunchInfoModal: React.FC<AnsibleLaunchInfoModalProps> = ({
  open,
  setOpen,
}) => {
  const theme = useTheme();
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleStartAnsible = () => {
    setOpen(false);
  };

  const handleTogglePassword = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth>
      <DialogTitle
        variant="h5"
        sx={{ fontWeight: 700, padding: '32px 24px 0 24px' }}
      >
        Provisioning complete!
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
      </IconButton>
      <DialogContent sx={{ padding: '6px 24px' }}>
        <DialogContentText
          id="alert-dialog-description"
          color="textSecondary"
          style={{
            fontSize: '16px',
            fontWeight: 400,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          Log in using these credentials:
        </DialogContentText>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            width: '300px',
            backgroundColor: theme.palette.mode === 'dark' ? '#47494b' : '#fff',
          }}
        >
          <InputLabel
            style={{
              fontSize: '16px',
              marginTop: '10px',
              fontWeight: 400,
            }}
          >
            Username:
          </InputLabel>

          <TextField
            variant="filled"
            fullWidth
            value={username}
            InputProps={{
              disableUnderline: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() =>
                      window.navigator.clipboard.writeText(username)
                    }
                  >
                    <ContentCopy />
                  </IconButton>
                </InputAdornment>
              ),
              // Vertically centers the text
              sx: {
                paddingY: '4px',
                '& .v5-MuiInputBase-input': {
                  paddingY: '10px',
                },
              },
            }}
          />

          <InputLabel
            margin="dense"
            style={{
              fontSize: '16px',
              marginTop: '10px',
              fontWeight: 400,
            }}
          >
            Password:
          </InputLabel>

          <TextField
            variant="filled"
            value={password}
            fullWidth
            type={showPassword ? 'text' : 'password'}
            InputProps={{
              disableUnderline: true,
              endAdornment: (
                <InputAdornment position="end">
                  <Box display="flex" gap={1}>
                    <IconButton onClick={handleTogglePassword}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                    <IconButton
                      onClick={() =>
                        window.navigator.clipboard.writeText(password)
                      }
                    >
                      <ContentCopy />
                    </IconButton>
                  </Box>
                </InputAdornment>
              ),
              // Vertically centers the text
              sx: {
                paddingY: '4px',
                '& .v5-MuiInputBase-input': {
                  paddingY: '10px',
                },
              },
            }}
          />
        </div>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'flex-start', padding: '24px' }}>
        <Button
          variant="contained"
          endIcon={<OpenInNewIcon />}
          onClick={handleStartAnsible}
        >
          Go to Ansible Automation Platform
        </Button>
      </DialogActions>
    </Dialog>
  );
};
