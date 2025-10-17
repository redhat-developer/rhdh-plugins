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
import React, { ForwardedRef, forwardRef } from 'react';
import { E164Number } from 'libphonenumber-js/types.cjs';
import { default as RPNInput, Country } from 'react-phone-number-input';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ErrorIcon from '@mui/icons-material/Error';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

import CircularProgress from '@mui/material/CircularProgress';
import { useTrackAnalytics } from '../../../utils/eddl-utils';

const FLAG_FETCH_URL =
  'https://catamphetamine.github.io/country-flag-icons/3x2';

type CountrySelectFieldProps = {
  value: Country | undefined;
  onChange: (value: Country) => void;
  options: { label: string; value: Country }[];
};

type PhoneNumberFormProps = {
  phoneNumber: E164Number | undefined;
  setPhoneNumber: React.Dispatch<React.SetStateAction<E164Number | undefined>>;
  setCountry: React.Dispatch<React.SetStateAction<Country | undefined>>;
  country: Country | undefined;
  handleClose: () => void;
  handlePhoneNumberSubmit: () => void;
  loading?: boolean;
  error?: string;
};

export const PhoneNumberStep: React.FC<PhoneNumberFormProps> = ({
  phoneNumber,
  setPhoneNumber,
  setCountry,
  country,
  handleClose,
  handlePhoneNumberSubmit,
  loading,
  error,
}) => {
  const theme = useTheme();
  const trackAnalytics = useTrackAnalytics();

  // Handle Send Code click for analytics tracking
  const handleSendCodeClick = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    await trackAnalytics(
      'Send Code',
      'Verification',
      window.location.href,
      undefined,
      'cta',
    );
    handlePhoneNumberSubmit();
  };

  // Handle Cancel click for analytics tracking
  const handleCancelClick = async (
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

  const PhoneInputField = forwardRef(function PhoneInputField(
    props: TextFieldProps,
    ref: ForwardedRef<React.ComponentType<TextFieldProps>>,
  ) {
    return (
      <TextField
        data-testid="tel-input"
        inputRef={ref}
        error={!!error}
        {...props}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
      />
    );
  });

  const CountrySelectField = ({
    value,
    onChange,
    options,
  }: CountrySelectFieldProps) => {
    const handleSelect = (event: SelectChangeEvent<Country>) => {
      onChange(event.target.value as Country);
      setCountry(event.target.value as Country);
    };
    return (
      <Select
        data-testid="country-code-select"
        value={value}
        MenuProps={{
          anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
          transformOrigin: { vertical: 'top', horizontal: 'left' },
          PaperProps: { sx: { maxHeight: 268 } },
        }}
        sx={{ width: 80, marginRight: 1 }}
        onChange={handleSelect}
        renderValue={() => (
          <Box display="flex" alignItems="center">
            {value ? (
              <img
                src={`${FLAG_FETCH_URL}/${value}.svg`}
                alt={value}
                width="30"
                height="20"
              />
            ) : (
              <Box width="30" height="20" />
            )}
          </Box>
        )}
      >
        {options
          .filter(x => x.value)
          .map(option => (
            <MenuItem value={option.value} key={option.value}>
              <img
                src={`${FLAG_FETCH_URL}/${option.value}.svg`}
                alt={option.label}
                width="30"
                height="20"
                style={{ marginRight: 10 }}
              />
              <Typography
                color="textPrimary"
                style={{ fontSize: '16px', fontWeight: 400 }}
              >
                {option.label}
              </Typography>
            </MenuItem>
          ))}
      </Select>
    );
  };

  return (
    <>
      <DialogTitle
        variant="h5"
        sx={{ fontWeight: 700, padding: '32px 24px 16px 24px' }}
      >
        Let's verify you
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

      <DialogContent
        sx={{ padding: '6px 24px', backgroundColor: 'transparent !important' }}
      >
        <DialogContentText
          id="alert-dialog-description"
          color="textPrimary"
          style={{ fontSize: '16px', fontWeight: 400 }}
        >
          Enter your phone number and we'll send you a text message with a
          verification code.
        </DialogContentText>
        <div
          style={{
            marginTop: '24px',
            display: 'flex',
            backgroundColor: 'transparent',
          }}
        >
          <RPNInput
            required
            country={country}
            label="Phone number"
            value={phoneNumber}
            onChange={setPhoneNumber}
            inputComponent={PhoneInputField}
            countrySelectComponent={CountrySelectField}
          />
        </div>
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
          data-testid="submit-phone-button"
          variant="contained"
          onClick={handleSendCodeClick}
          type="submit"
          disabled={!phoneNumber || loading}
          endIcon={
            loading && <CircularProgress size={20} sx={{ color: '#AFAFAF' }} />
          }
        >
          Send code
        </Button>
        <Button
          data-testid="close-phone-button"
          variant="outlined"
          onClick={handleCancelClick}
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

export default PhoneNumberStep;
