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
import { E164Number } from 'libphonenumber-js/types.cjs';
import { Country, getCountryCallingCode } from 'react-phone-number-input';
import Dialog from '@mui/material/Dialog';
import { useApi } from '@backstage/core-plugin-api';
import { registerApiRef } from '../../api';
import {
  PhoneNumberStep,
  VerificationCodeStep,
} from './PhoneVerificationSteps';
import { useSandboxContext } from '../../hooks/useSandboxContext';
import { errorMessage } from '../../utils/common';

type PhoneVerificationModalProps = {
  modalOpen: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const PhoneVerificationModal: React.FC<PhoneVerificationModalProps> = ({
  modalOpen,
  setOpen,
}) => {
  const registerApi = useApi(registerApiRef);
  const [enterOTP, setEnterOTP] = useState<boolean>(false);
  const { refetchUserData } = useSandboxContext();
  const [phoneNumber, setPhoneNumber] = useState<E164Number | undefined>();
  const [country, setCountry] = useState<Country>('ES');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);

  const [loading, setLoading] = useState<boolean>(false);
  const [codeResent, setCodeResent] = useState<boolean>(false);
  const [phoneSubmitError, setPhoneSubmitError] = React.useState<
    string | undefined
  >();
  const [verificationCodeError, setVerificationCodeError] = React.useState<
    string | undefined
  >();

  const handleClose = () => {
    setCountry('ES');
    setPhoneNumber(undefined);
    setOtp(['', '', '', '', '', '']);
    setOpen(false);
    setEnterOTP(false);
    setPhoneSubmitError(undefined);
    setVerificationCodeError(undefined);
    setCodeResent(false);
  };

  const handlePhoneNumberSubmit = async () => {
    const countryCallingCode = `+${getCountryCallingCode(country)}`;
    const phoneWithoutCountryCode = (phoneNumber as string)?.replace(
      countryCallingCode,
      '',
    );
    try {
      setPhoneSubmitError(undefined);
      setLoading(true);
      await registerApi.initiatePhoneVerification(
        countryCallingCode,
        phoneWithoutCountryCode,
      );

      setEnterOTP(true);
    } catch (e) {
      setPhoneSubmitError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrialClick = async () => {
    try {
      setVerificationCodeError(undefined);
      setLoading(true);
      await registerApi.completePhoneVerification(otp.join(''));
      await refetchUserData();
      handleClose();
    } catch (e) {
      setVerificationCodeError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleEditPhoneNumber = () => {
    setPhoneNumber(undefined);
    setEnterOTP(false);
    setOtp(['', '', '', '', '', '']);
  };

  const handleResendCode = async () => {
    if (codeResent) return;

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

  return (
    <Dialog open={modalOpen} onClose={handleClose}>
      {!enterOTP ? (
        <PhoneNumberStep
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          setCountry={setCountry}
          country={country}
          handleClose={handleClose}
          handlePhoneNumberSubmit={handlePhoneNumberSubmit}
          loading={loading}
          error={phoneSubmitError}
        />
      ) : (
        <VerificationCodeStep
          otp={otp}
          setOtp={setOtp}
          handleResendCode={handleResendCode}
          codeResent={codeResent}
          phoneNumber={phoneNumber}
          handleEditPhoneNumber={handleEditPhoneNumber}
          handleStartTrialClick={handleStartTrialClick}
          handleClose={handleClose}
          loading={loading}
          error={verificationCodeError}
        />
      )}
    </Dialog>
  );
};

export default PhoneVerificationModal;
