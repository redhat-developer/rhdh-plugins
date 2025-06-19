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
import { errorMessage } from '../../utils/common';
import { Product } from '../SandboxCatalog/productData';

type PhoneVerificationModalProps = {
  id: Product;
  modalOpen: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setAnsibleCredsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setRefetchingUserData: React.Dispatch<React.SetStateAction<boolean>>;
};

export const PhoneVerificationModal: React.FC<PhoneVerificationModalProps> = ({
  id,
  modalOpen,
  setOpen,
  setAnsibleCredsModalOpen,
  setRefetchingUserData,
}) => {
  const registerApi = useApi(registerApiRef);
  const [enterOTP, setEnterOTP] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<E164Number | undefined>();
  const [country, setCountry] = useState<Country>('ES');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);

  const [loading, setLoading] = useState<boolean>(false);
  const [phoneSubmitError, setPhoneSubmitError] = React.useState<
    string | undefined
  >();

  const handleClose = () => {
    setCountry('ES');
    setPhoneNumber(undefined);
    setOtp(['', '', '', '', '', '']);
    setOpen(false);
    setEnterOTP(false);
    setPhoneSubmitError(undefined);
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

  const handleEditPhoneNumber = () => {
    setPhoneNumber(undefined);
    setEnterOTP(false);
    setOtp(['', '', '', '', '', '']);
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
          id={id}
          otp={otp}
          setOtp={setOtp}
          phoneNumber={phoneNumber}
          handleEditPhoneNumber={handleEditPhoneNumber}
          setAnsibleCredsModalOpen={setAnsibleCredsModalOpen}
          setRefetchingUserData={setRefetchingUserData}
          handleClose={handleClose}
          loading={loading}
          setLoading={setLoading}
          country={country}
        />
      )}
    </Dialog>
  );
};

export default PhoneVerificationModal;
