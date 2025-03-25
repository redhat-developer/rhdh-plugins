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
import {
  isValidCountryCode,
  isValidPhoneNumber,
  isValidOTP,
} from '../phone-utils';

describe('phone-utils', () => {
  describe('isValidCountryCode', () => {
    it('should return true for valid country codes', () => {
      expect(isValidCountryCode('+1')).toBe(true);
      expect(isValidCountryCode('91')).toBe(true);
      expect(isValidCountryCode('+44')).toBe(true);
      expect(isValidCountryCode('86')).toBe(true);
    });

    it('should return false for invalid country codes', () => {
      expect(isValidCountryCode('+')).toBe(false);
      expect(isValidCountryCode('abc')).toBe(false);
      expect(isValidCountryCode('+ab')).toBe(false);
      expect(isValidCountryCode('++1')).toBe(false);
      expect(isValidCountryCode('')).toBe(false);
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should return true for valid phone numbers', () => {
      expect(isValidPhoneNumber('1234567890')).toBe(true);
      expect(isValidPhoneNumber('(123) 456-7890')).toBe(true);
      expect(isValidPhoneNumber('123-456-7890')).toBe(true);
      expect(isValidPhoneNumber('123.456.7890')).toBe(true);
      expect(isValidPhoneNumber('123 456 7890')).toBe(true);
    });

    it('should return false for invalid phone numbers', () => {
      expect(isValidPhoneNumber('abc')).toBe(false);
      expect(isValidPhoneNumber('123-abc-7890')).toBe(false);
      expect(isValidPhoneNumber('')).toBe(false);
      expect(isValidPhoneNumber('++1234567890')).toBe(false);
    });
  });

  describe('isValidOTP', () => {
    it('should return true for valid OTP strings', () => {
      expect(isValidOTP('123456')).toBe(true);
      expect(isValidOTP('ABCDEF')).toBe(true);
      expect(isValidOTP('abc123')).toBe(true);
      expect(isValidOTP('')).toBe(true);
    });

    it('should return false for invalid OTP strings', () => {
      expect(isValidOTP('123-456')).toBe(false);
      expect(isValidOTP('ABC DEF')).toBe(false);
      expect(isValidOTP('abc@123')).toBe(false);
      expect(isValidOTP('#special')).toBe(false);
    });
  });
});
