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
import React, { useEffect, useRef } from 'react';
import { E164Number, parsePhoneNumber } from 'libphonenumber-js/min';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import ErrorIcon from '@mui/icons-material/Error';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CircularProgress from '@mui/material/CircularProgress';
import { isValidOTP } from '../../../utils/phone-utils';

type VerificationCodeProps = {
  otp: string[];
  setOtp: React.Dispatch<React.SetStateAction<string[]>>;
  handleResendCode: () => void;
  codeResent: boolean;
  phoneNumber: E164Number | undefined;
  handleEditPhoneNumber: () => void;
  handleStartTrialClick: () => void;
  handleClose: () => void;
  loading?: boolean;
  error?: string;
};

export const VerificationCodeStep: React.FC<VerificationCodeProps> = ({
  otp,
  setOtp,
  handleResendCode,
  codeResent,
  phoneNumber,
  handleEditPhoneNumber,
  handleStartTrialClick,
  handleClose,
  loading,
  error,
}) => {
  const theme = useTheme();

  const inputRefs = useRef<any>([]);

  useEffect(() => {
    // Focus on the first input box when modal opens
    if (!otp[0]) {
      // Focus on the first input box when modal opens
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window.open]);

  const handleChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = event.target.value;
    if (!isValidOTP(value)) return;

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

  const createPhoneString = (phone: E164Number | undefined) => {
    if (!phone) return '';
    try {
      const parsedPhoneNumber = parsePhoneNumber(phone);
      return `+${parsedPhoneNumber.countryCallingCode} ${parsedPhoneNumber.nationalNumber}`;
    } catch {
      return '';
    }
  };

  return (
    <>
      <DialogTitle
        variant="h5"
        sx={{ fontWeight: 700, padding: '32px 24px 0 24px' }}
      >
        Enter the verification code
      </DialogTitle>
      <IconButton
        data-testid="close-opt-button"
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
          data-testid="sent-message-dialog"
          id="alert-dialog-description"
          color="textPrimary"
          style={{
            fontSize: '16px',
            fontWeight: 400,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          We've sent a verification code to {createPhoneString(phoneNumber)}.{' '}
          <IconButton onClick={handleEditPhoneNumber} color="primary">
            <EditIcon />
          </IconButton>
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
                data-testid="opt-inputs"
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

        <Typography
          data-testid="resend-code-link"
          variant="body2"
          color="primary"
          sx={{
            mt: 2,
            cursor: 'pointer',
            justifyContent: 'left',
            fontSize: '16px',
            fontWeight: 400,
          }}
          onClick={() => {
            handleResendCode();
            inputRefs.current[0]?.focus();
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            {codeResent ? (
              <>
                Resent successful
                <CheckCircleIcon color="primary" style={{ fontSize: '16px' }} />
              </>
            ) : (
              'Resend code'
            )}
          </div>
        </Typography>

        {error && (
          <Typography
            color="error"
            style={{ fontSize: '16px', fontWeight: 400, marginTop: '16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ErrorIcon color="error" style={{ fontSize: '16px' }} />
              {error}
            </div>
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'flex-start', padding: '24px' }}>
        <Button
          data-testid="submit-opt-button"
          variant="contained"
          type="submit"
          onClick={handleStartTrialClick}
          disabled={otp.some(digit => !digit) || loading}
          endIcon={
            loading && <CircularProgress size={20} sx={{ color: '#AFAFAF' }} />
          }
        >
          Start trial
        </Button>
        <Button
          data-testid="close-opt-button"
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
    </>
  );
};

export default VerificationCodeStep;
