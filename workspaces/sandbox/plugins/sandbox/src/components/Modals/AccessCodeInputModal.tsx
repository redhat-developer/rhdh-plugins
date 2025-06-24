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
import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import ErrorIcon from '@mui/icons-material/Error';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Stack from '@mui/material/Stack';
import { useApi } from '@backstage/core-plugin-api';
import { registerApiRef } from '../../api';
import { useSandboxContext } from '../../hooks/useSandboxContext';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { errorMessage } from '../../utils/common';

type AccessCodeInputModalProps = {
  modalOpen: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const AccessCodeInputModal: React.FC<AccessCodeInputModalProps> = ({
  modalOpen,
  setOpen,
}) => {
  const theme = useTheme();
  const registerApi = useApi(registerApiRef);
  const { refetchUserData } = useSandboxContext();
  const [loading, setLoading] = useState<boolean>(false);
  const [accessCode, setAccessCode] = useState<string[]>(['', '', '', '', '']);
  const [accessCodeError, setAccessCodeError] = React.useState<
    string | undefined
  >();
  const inputRefs = useRef<any>([]);

  useEffect(() => {
    if (modalOpen) {
      // Focus on the first input field when modal opens
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen]);

  const handleClose = () => {
    setOpen(false);
    setAccessCode(['', '', '', '', '']);
    setAccessCodeError(undefined);
  };

  const handleChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = event.target.value;

    // Only allow alphanumeric characters
    if (value && !/^[A-Za-z0-9]$/.test(value)) return;

    const newAccessCode = [...accessCode];
    newAccessCode[index] = value;
    setAccessCode(newAccessCode);

    // Move focus to next input
    if (value && index < accessCode.length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle Backspace: Move focus to previous box if empty
  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'Backspace' && !accessCode[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleStartTrialClick = async () => {
    try {
      setAccessCodeError(undefined);
      setLoading(true);
      await registerApi.verifyActivationCode(accessCode.join(''));
      refetchUserData();
      handleClose();
    } catch (e) {
      setAccessCodeError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={modalOpen} onClose={handleClose} fullWidth>
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
        <Stack
          direction="row"
          spacing={2}
          sx={{
            mt: 2,
            marginRight: 20,
            backgroundColor: theme.palette.mode === 'dark' ? '#47494b' : '#fff',
          }}
        >
          {accessCode.map((digit, index) => (
            <TextField
              key={index}
              value={digit}
              onChange={e => handleChange(index, e)}
              onKeyDown={e =>
                handleKeyDown(index, e as React.KeyboardEvent<HTMLInputElement>)
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
        {accessCodeError && (
          <Typography
            color="error"
            style={{ fontSize: '16px', fontWeight: 400, marginTop: '16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ErrorIcon color="error" style={{ fontSize: '16px' }} />
              {accessCodeError}
            </div>
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'flex-start', padding: '24px' }}>
        <Button
          variant="contained"
          type="submit"
          onClick={handleStartTrialClick}
          disabled={accessCode.some(digit => !digit) || loading}
          endIcon={
            loading && <CircularProgress size={20} sx={{ color: '#AFAFAF' }} />
          }
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

export default AccessCodeInputModal;
