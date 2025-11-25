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

import { validateUserEmailForImpersonation } from '../validation';

describe('validation', () => {
  describe('validateUserEmailForImpersonation', () => {
    describe('when authProvider is not impersonationHeaders', () => {
      it('should return email when provided', () => {
        const result = validateUserEmailForImpersonation(
          'user@example.com',
          'serviceAccount',
        );
        expect(result).toBe('user@example.com');
      });

      it('should return empty string when email is undefined', () => {
        const result = validateUserEmailForImpersonation(
          undefined,
          'serviceAccount',
        );
        expect(result).toBe('');
      });

      it('should return empty string when email is empty', () => {
        const result = validateUserEmailForImpersonation('', 'serviceAccount');
        expect(result).toBe('');
      });

      it('should return email even if invalid format', () => {
        const result = validateUserEmailForImpersonation(
          'invalid-email',
          'serviceAccount',
        );
        expect(result).toBe('invalid-email');
      });

      it('should return email when authProvider is undefined', () => {
        const result = validateUserEmailForImpersonation(
          'user@example.com',
          undefined,
        );
        expect(result).toBe('user@example.com');
      });

      it('should return empty string when both email and authProvider are undefined', () => {
        const result = validateUserEmailForImpersonation(undefined, undefined);
        expect(result).toBe('');
      });
    });

    describe('when authProvider is impersonationHeaders', () => {
      it('should return trimmed email for valid email', () => {
        const result = validateUserEmailForImpersonation(
          '  user@example.com  ',
          'impersonationHeaders',
        );
        expect(result).toBe('user@example.com');
      });

      it('should return email without trimming when no whitespace', () => {
        const result = validateUserEmailForImpersonation(
          'user@example.com',
          'impersonationHeaders',
        );
        expect(result).toBe('user@example.com');
      });

      it.each([
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user_name@example.co.uk',
        'user123@example-domain.com',
        'user@subdomain.example.com',
        'user@example.io',
      ])('should accept valid email format: %s', email => {
        expect(() => {
          validateUserEmailForImpersonation(email, 'impersonationHeaders');
        }).not.toThrow();
        expect(
          validateUserEmailForImpersonation(email, 'impersonationHeaders'),
        ).toBe(email);
      });

      it('should throw error when email is undefined', () => {
        expect(() => {
          validateUserEmailForImpersonation(undefined, 'impersonationHeaders');
        }).toThrow(
          'User email is required for impersonation but was not found in user entity',
        );
      });

      it('should throw error when email is empty string', () => {
        expect(() => {
          validateUserEmailForImpersonation('', 'impersonationHeaders');
        }).toThrow(
          'User email is required for impersonation but was not found in user entity',
        );
      });

      it('should throw error when email is only whitespace', () => {
        expect(() => {
          validateUserEmailForImpersonation('   ', 'impersonationHeaders');
        }).toThrow(
          'User email is required for impersonation but was not found in user entity',
        );
      });

      it('should throw error for email without @ symbol', () => {
        expect(() => {
          validateUserEmailForImpersonation(
            'userexample.com',
            'impersonationHeaders',
          );
        }).toThrow('Invalid email format: userexample.com');
      });

      it('should throw error for email without domain', () => {
        expect(() => {
          validateUserEmailForImpersonation('user@', 'impersonationHeaders');
        }).toThrow('Invalid email format: user@');
      });

      it('should throw error for email without local part', () => {
        expect(() => {
          validateUserEmailForImpersonation(
            '@example.com',
            'impersonationHeaders',
          );
        }).toThrow('Invalid email format: @example.com');
      });

      it('should throw error for email without TLD', () => {
        expect(() => {
          validateUserEmailForImpersonation(
            'user@example',
            'impersonationHeaders',
          );
        }).toThrow('Invalid email format: user@example');
      });

      it('should throw error for email with spaces', () => {
        expect(() => {
          validateUserEmailForImpersonation(
            'user @example.com',
            'impersonationHeaders',
          );
        }).toThrow('Invalid email format: user @example.com');
      });

      it('should throw error for email with multiple @ symbols', () => {
        expect(() => {
          validateUserEmailForImpersonation(
            'user@example@com',
            'impersonationHeaders',
          );
        }).toThrow('Invalid email format: user@example@com');
      });

      it('should trim whitespace before validating format', () => {
        expect(() => {
          validateUserEmailForImpersonation(
            '  invalid-email  ',
            'impersonationHeaders',
          );
        }).toThrow('Invalid email format: invalid-email');
      });

      it('should handle email with special characters in local part', () => {
        const result = validateUserEmailForImpersonation(
          'user.name+tag@example.com',
          'impersonationHeaders',
        );
        expect(result).toBe('user.name+tag@example.com');
      });

      it('should handle email with hyphens in domain', () => {
        const result = validateUserEmailForImpersonation(
          'user@example-domain.com',
          'impersonationHeaders',
        );
        expect(result).toBe('user@example-domain.com');
      });

      it('should handle email with subdomain', () => {
        const result = validateUserEmailForImpersonation(
          'user@subdomain.example.com',
          'impersonationHeaders',
        );
        expect(result).toBe('user@subdomain.example.com');
      });

      it('should handle email with numbers', () => {
        const result = validateUserEmailForImpersonation(
          'user123@example123.com',
          'impersonationHeaders',
        );
        expect(result).toBe('user123@example123.com');
      });

      it('should handle email with multiple dots in domain', () => {
        const result = validateUserEmailForImpersonation(
          'user@example.co.uk',
          'impersonationHeaders',
        );
        expect(result).toBe('user@example.co.uk');
      });

      it('should handle email with underscore in local part', () => {
        const result = validateUserEmailForImpersonation(
          'user_name@example.com',
          'impersonationHeaders',
        );
        expect(result).toBe('user_name@example.com');
      });
    });
  });
});
