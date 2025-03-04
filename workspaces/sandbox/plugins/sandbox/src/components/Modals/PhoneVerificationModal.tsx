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
import React, { ForwardedRef, forwardRef, useState } from 'react';
import { E164Number } from 'libphonenumber-js/types.cjs';
import {
  default as RPNInput,
  Country,
  getCountryCallingCode,
} from 'react-phone-number-input';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import InputAdornment from '@mui/material/InputAdornment';

const FLAG_FETCH_URL =
  'https://purecatamphetamine.github.io/country-flag-icons/3x2';

type CountrySelectFieldProps = {
  disabled?: boolean;
  value: Country;
  onChange: (value: Country) => void;
  options: { label: string; value: Country }[];
};

type PhoneVerificationModalProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showOtpModal: React.Dispatch<React.SetStateAction<boolean>>;
  phoneNumber: E164Number | undefined;
  setPhoneNumber: React.Dispatch<React.SetStateAction<E164Number | undefined>>;
};

export const PhoneVerificationModal: React.FC<PhoneVerificationModalProps> = ({
  open,
  setOpen,
  showOtpModal,
  phoneNumber,
  setPhoneNumber,
}) => {
  const theme = useTheme();
  const [countryCode, setCountryCode] = useState<Country>('ES');

  const handlePhoneVerificationSubmit = () => {
    setOpen(false);
    showOtpModal(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCountryCode('ES');
    setPhoneNumber(undefined);
  };

  const PhoneInputField = forwardRef(function PhoneInputField(
    props: TextFieldProps,
    ref: ForwardedRef<React.ComponentType<TextFieldProps>>,
  ) {
    return (
      <TextField
        inputRef={ref}
        {...props}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Typography color="textPrimary" style={{ fontSize: '16px' }}>
                +{getCountryCallingCode(countryCode)}
              </Typography>
            </InputAdornment>
          ),
        }}
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
      setCountryCode(event.target.value as Country);
    };
    return (
      <Select
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
            <img
              src={`${FLAG_FETCH_URL}/${countryCode}.svg`}
              alt={countryCode}
              width="30"
              height="20"
            />
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
    <Dialog open={open} onClose={handleClose} maxWidth="md">
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

      <DialogContent sx={{ padding: '6px 24px' }}>
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
            backgroundColor: theme.palette.mode === 'dark' ? '#47494b' : '#fff',
          }}
        >
          <RPNInput
            required
            defaultCountry="ES"
            label="Phone number"
            placeholder="(000) 000 0000"
            value={phoneNumber}
            onChange={setPhoneNumber}
            inputComponent={PhoneInputField}
            countrySelectComponent={CountrySelectField}
          />
        </div>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'flex-start', padding: '24px' }}>
        <Button
          variant="contained"
          onClick={handlePhoneVerificationSubmit}
          type="submit"
          disabled={!phoneNumber}
        >
          Send code
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
