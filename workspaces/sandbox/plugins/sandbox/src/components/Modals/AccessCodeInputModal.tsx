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
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { Context } from '../SandboxCatalog/SandboxCatalogPage';

type AccessCodeInputModalProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const AccessCodeInputModal: React.FC<AccessCodeInputModalProps> = ({
  open,
  setOpen,
}) => {
  const theme = useTheme();
  const [, setButtonClicked] = useContext(Context);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<any>([]);

  useEffect(() => {
    if (open) {
      // Focus on the first input box when modal opens
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [open]);

  const handleChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = event.target.value;
    if (!/^[a-zA-Z0-9]*$/.test(value)) return; // Allow only alphanumeric characters

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move focus to next input
    if (value && index < otp.length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle Backspace: Move focus to previous box if empty
  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleClose = () => {
    setOpen(false);
    setOtp(['', '', '', '', '', '']);
  };

  const handleStartTrialClick = () => {
    setOpen(false);
    setOtp(['', '', '', '', '', '']);
    setButtonClicked(true);
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle
        variant="h5"
        sx={{ fontWeight: 700, padding: '32px 24px 0 24px' }}
      >
        Enter the access code
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
          color="textPrimary"
          style={{
            fontSize: '16px',
            fontWeight: 400,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          If you have an access code, enter it now.
        </DialogContentText>
        <div
          style={{
            backgroundColor: theme.palette.mode === 'dark' ? '#47494b' : '#fff',
          }}
        >
          <Stack direction="row" spacing={2} sx={{ mt: 2, marginRight: 20 }}>
            {otp.map((digit, index) => (
              <TextField
                key={index}
                value={digit}
                onChange={e => handleChange(index, e)}
                onKeyDown={e =>
                  handleKeyDown(
                    index,
                    e as React.KeyboardEvent<HTMLInputElement>,
                  )
                }
                inputRef={el => (inputRefs.current[index] = el)}
                variant="outlined"
                inputProps={{
                  maxLength: 1,
                  style: { textAlign: 'center', fontWeight: 400 },
                }}
              />
            ))}
          </Stack>
        </div>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'flex-start', padding: '24px' }}>
        <Button
          variant="contained"
          type="submit"
          onClick={handleStartTrialClick}
          disabled={otp.some(digit => !digit)}
        >
          Start trial
        </Button>
        <Button
          variant="outlined"
          onClick={handleClose}
          sx={{
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
