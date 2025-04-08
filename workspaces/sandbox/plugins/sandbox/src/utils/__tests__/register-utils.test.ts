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
import { signupDataToStatus } from '../register-utils';
import { SignupData } from '../../types';

describe('register-utils', () => {
  describe('signupDataToStatus', () => {
    it('should return "new" when signupData is undefined', () => {
      expect(signupDataToStatus(undefined)).toBe('new');
    });

    it('should return "ready" when status.ready is true', () => {
      const signupData: SignupData = {
        name: 'Test User',
        compliantUsername: 'testuser',
        username: 'testuser',
        givenName: 'Test',
        familyName: 'User',
        company: 'Test Company',
        status: {
          ready: true,
          verificationRequired: false,
          reason: '',
        },
      };
      expect(signupDataToStatus(signupData)).toBe('ready');
    });

    it('should return "verify" when not ready and verification is required', () => {
      const signupData: SignupData = {
        name: 'Test User',
        compliantUsername: 'testuser',
        username: 'testuser',
        givenName: 'Test',
        familyName: 'User',
        company: 'Test Company',
        status: {
          ready: false,
          verificationRequired: true,
          reason: '',
        },
      };
      expect(signupDataToStatus(signupData)).toBe('verify');
    });

    it('should return "provisioning" when not ready and reason is Provisioning', () => {
      const signupData: SignupData = {
        name: 'Test User',
        compliantUsername: 'testuser',
        username: 'testuser',
        givenName: 'Test',
        familyName: 'User',
        company: 'Test Company',
        status: {
          ready: false,
          verificationRequired: false,
          reason: 'Provisioning',
        },
      };
      expect(signupDataToStatus(signupData)).toBe('provisioning');
    });

    it('should return "pending-approval" for unknown states', () => {
      const signupData: SignupData = {
        name: 'Test User',
        compliantUsername: 'testuser',
        username: 'testuser',
        givenName: 'Test',
        company: 'Test Company',
        familyName: 'User',
        status: {
          ready: false,
          verificationRequired: false,
          reason: 'SomeOtherReason',
        },
      };
      expect(signupDataToStatus(signupData)).toBe('pending-approval');
    });
  });
});
