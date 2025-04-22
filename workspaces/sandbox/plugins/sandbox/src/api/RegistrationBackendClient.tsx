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

/// <reference path="../../@types/index.d.ts" />
import { ConfigApi } from '@backstage/core-plugin-api';
import { isValidCountryCode, isValidPhoneNumber } from '../utils/phone-utils';
import { CommonResponse, SignupData } from '../types';
import { SecureFetchApi } from './SecureFetchClient';

export type RegistrationBackendClientOptions = {
  configApi: ConfigApi;
  secureFetchApi: SecureFetchApi;
};

export interface RegistrationService {
  getRecaptchaAPIKey(): string;
  getSignUpData(): Promise<SignupData | undefined>;
  signup(): Promise<void>;
  initiatePhoneVerification(
    countryCode: string,
    phoneNumber: string,
  ): Promise<void>;
  completePhoneVerification(code: string): Promise<void>;
  verifyActivationCode(code: string): Promise<void>;
}

export class RegistrationBackendClient implements RegistrationService {
  private readonly configApi: ConfigApi;
  private readonly secureFetchApi: SecureFetchApi;

  constructor(options: RegistrationBackendClientOptions) {
    this.configApi = options.configApi;
    this.secureFetchApi = options.secureFetchApi;
  }

  private readonly signupAPI = (): string => {
    const signupAPI = this.configApi.getString('sandbox.signupAPI');
    return `${signupAPI}/signup`;
  };

  getRecaptchaAPIKey = (): string => {
    return (
      this.configApi.getOptionalString('sandbox.recaptcha.siteKey') ??
      'test-api-key'
    );
  };

  getSignUpData = async (): Promise<SignupData | undefined> => {
    const signupURL = await this.signupAPI();
    const response = await this.secureFetchApi.fetch(signupURL, {
      method: 'GET',
    });
    if (!response.ok) {
      if (response.status === 404) {
        return undefined;
      }
      throw new Error(
        `Unexpected status code: ${response.status} ${response.statusText}`,
      );
    }
    return response.json();
  };

  getRecaptchaToken = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const apiKey = this.getRecaptchaAPIKey();
      let timeout = false;
      const captchaTimeout = setTimeout(() => {
        timeout = true;
        reject(new Error('Recaptcha timeout.'));
      }, 10000);
      if (grecaptcha?.enterprise) {
        grecaptcha.enterprise.ready(async () => {
          if (!timeout) {
            clearTimeout(captchaTimeout);
            try {
              resolve(
                await grecaptcha.enterprise.execute(apiKey, {
                  action: 'SIGNUP',
                }),
              );
            } catch (e) {
              reject(new Error('Recaptcha failure.'));
            }
          }
        });
      } else {
        reject(new Error('Recaptcha failure.'));
      }
    });
  };

  signup = async (): Promise<void> => {
    let token = '';
    try {
      token = await this.getRecaptchaToken();
    } catch (err) {
      throw new Error(`Error getting recaptcha token: ${err}`);
    }
    const signupURL = await this.signupAPI();
    await this.secureFetchApi.fetch(signupURL, {
      method: 'POST',
      headers: {
        'Recaptcha-Token': token,
      },
      body: null,
    });
  };

  initiatePhoneVerification = async (
    countryCode: string,
    phoneNumber: string,
  ): Promise<void> => {
    const verificationURL = `${await this.signupAPI()}/verification`;
    if (!isValidCountryCode(countryCode)) {
      throw new Error('Invalid country code.');
    }
    if (!isValidPhoneNumber(phoneNumber)) {
      throw new Error('Invalid phone number.');
    }
    const response = await this.secureFetchApi.fetch(verificationURL, {
      method: 'PUT',
      body: JSON.stringify({
        country_code: countryCode,
        phone_number: phoneNumber,
      }),
    });

    if (!response.ok) {
      const error: CommonResponse = await response.json();
      throw new Error(error?.message);
    }
  };

  completePhoneVerification = async (code: string): Promise<void> => {
    const verificationURL = `${await this.signupAPI()}/verification`;
    const response = await this.secureFetchApi.fetch(
      `${verificationURL}/${code}`,
      {
        method: 'GET',
      },
    );

    if (!response.ok) {
      const error: CommonResponse = await response.json();
      throw new Error(error?.message);
    }
  };

  verifyActivationCode = async (code: string): Promise<void> => {
    const verificationURL = `${await this.signupAPI()}/verification/activation-code`;
    const response = await this.secureFetchApi.fetch(verificationURL, {
      method: 'POST',
      body: JSON.stringify({
        code: code,
      }),
    });

    if (!response.ok) {
      const error: CommonResponse = await response.json();
      throw new Error(error?.message);
    }
  };
}
