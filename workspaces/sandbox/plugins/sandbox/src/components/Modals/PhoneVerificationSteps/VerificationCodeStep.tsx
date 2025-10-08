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
import { Product } from '../../SandboxCatalog/productData';
import { signupDataToStatus } from '../../../utils/register-utils';
import { productsURLMapping } from '../../../hooks/useProductURLs';
import { errorMessage } from '../../../utils/common';
import { useSandboxContext } from '../../../hooks/useSandboxContext';
import { Country, getCountryCallingCode } from 'react-phone-number-input';
import { useApi } from '@backstage/core-plugin-api';
import { registerApiRef } from '../../../api';
import { useTrackAnalytics } from '../../../utils/eddl-utils';

type VerificationCodeProps = {
  id: Product;
  otp: string[];
  setOtp: React.Dispatch<React.SetStateAction<string[]>>;
  country: Country | undefined;
  phoneNumber: E164Number | undefined;
  handleEditPhoneNumber: () => void;
  handleClose: () => void;
  setAnsibleCredsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setRefetchingUserData: React.Dispatch<React.SetStateAction<boolean>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  loading?: boolean;
};

export const VerificationCodeStep: React.FC<VerificationCodeProps> = ({
  id,
  otp,
  setOtp,
  country,
  phoneNumber,
  handleEditPhoneNumber,
  setAnsibleCredsModalOpen,
  setRefetchingUserData,
  handleClose,
  loading,
  setLoading,
}) => {
  const theme = useTheme();
  const trackAnalytics = useTrackAnalytics();

  const inputRefs = useRef<any>([]);
  const { refetchUserData, handleAAPInstance } = useSandboxContext();
  const [verificationCodeError, setVerificationCodeError] = React.useState<
    string | undefined
  >();
  const [codeResent, setCodeResent] = useState<boolean>(false);
  const registerApi = useApi(registerApiRef);

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

  const handleResendCode = async () => {
    if (codeResent || !country) return;

    const countryCallingCode = `+${getCountryCallingCode(country)}`;
    setOtp(['', '', '', '', '', '']);
    try {
      setVerificationCodeError(undefined);
      setLoading(true);
      await registerApi.initiatePhoneVerification(
        countryCallingCode,
        (phoneNumber as string)?.replace(countryCallingCode, ''),
      );
      setCodeResent(true);
    } catch (e) {
      setVerificationCodeError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrialClick = async (pdt: Product) => {
    try {
      setVerificationCodeError(undefined);
      setLoading(true);
      await registerApi.completePhoneVerification(otp.join(''));
      const maxAttempts = 60;
      const retryInterval = 1000; // 1 second

      // Poll until user is found or max attempts reached
      let urlToOpen = '';
      let userReady = false;
      for (let i = 0; i < maxAttempts; i++) {
        setRefetchingUserData(true);
        await new Promise(resolve => setTimeout(resolve, retryInterval));

        // Fetch the latest user data and check if user is found
        const userData = await refetchUserData();
        if (userData) {
          const userStatus = signupDataToStatus(userData);
          userReady = userStatus === 'ready';

          const verificationRequired = userStatus === 'verify';
          // if verification is required we can stop fetching the data
          if (verificationRequired) {
            break;
          }

          // if user is ready we can stop fetching the data
          if (userReady) {
            // if namespace is not defined we can continue fetching the data
            if (!userData?.defaultUserNamespace) {
              // eslint-disable-next-line
              console.error(
                'user is ready but default namespace is not defined yet...',
              );
              continue;
            }
            const productURLs = productsURLMapping(userData);
            // find the link to open if any
            urlToOpen = productURLs.find(pu => pu.id === id)?.url || '';
            // User has signed up and the trial is ready and user selects the AAP Trial
            if (pdt === Product.AAP) {
              handleAAPInstance(userData.defaultUserNamespace as string);
              setAnsibleCredsModalOpen(true);
            } else if (urlToOpen) {
              window.open(urlToOpen, '_blank');
            }
            break;
          }
        }
      }
      handleClose();
    } catch (error) {
      setVerificationCodeError(errorMessage(error));
    } finally {
      setLoading(false);
      setRefetchingUserData(false);
    }
  };

  // Handle Start Trial click for analytics tracking
  const handleStartTrialClickWithTracking = async (
    event: React.MouseEvent<HTMLButtonElement>,
    pdt: Product,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    await trackAnalytics(
      'Start Trial',
      'Verification',
      window.location.href,
      undefined,
      'cta',
    );
    handleStartTrialClick(pdt);
  };

  // Handle Resend Code click for analytics tracking
  const handleResendCodeClickWithTracking = async (
    event: React.MouseEvent<HTMLElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    await trackAnalytics(
      'Resend Code',
      'Verification',
      window.location.href,
      undefined,
      'cta',
    );
    handleResendCode();
  };

  // Handle Cancel click for analytics tracking
  const handleCancelVerificationClick = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    await trackAnalytics(
      'Cancel Verification',
      'Verification',
      window.location.href,
      undefined,
      'cta',
    );
    handleClose();
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
      <DialogContent
        sx={{ padding: '6px 24px', backgroundColor: 'transparent !important' }}
      >
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
        <Stack
          direction="row"
          spacing={2}
          sx={{
            mt: 2,
            marginRight: 20,
            backgroundColor: 'transparent !important',
          }}
        >
          {otp.map((digit, index) => (
            <TextField
              key={index}
              data-testid="opt-inputs"
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
        <Typography
          data-testid="resend-code-link"
          component="div"
          variant="body2"
          color="primary"
          sx={{
            mt: 2,
            cursor: 'pointer',
            justifyContent: 'left',
            fontSize: '16px',
            fontWeight: 400,
            backgroundColor: 'transparent !important',
          }}
          onClick={event => {
            handleResendCodeClickWithTracking(event);
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

        {verificationCodeError && (
          <Typography
            color="error"
            style={{ fontSize: '16px', fontWeight: 400, marginTop: '16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ErrorIcon color="error" style={{ fontSize: '16px' }} />
              {verificationCodeError}
            </div>
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'flex-start', padding: '24px' }}>
        <Button
          data-testid="submit-opt-button"
          variant="contained"
          type="submit"
          onClick={event => handleStartTrialClickWithTracking(event, id)}
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
          onClick={handleCancelVerificationClick}
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
