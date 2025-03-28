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

import { getCookie, setCookie } from '../cookie-utils';

describe('Cookie Utils', () => {
  let documentCookie: string;

  // Mock document.cookie getter and setter
  beforeEach(() => {
    documentCookie = '';
    Object.defineProperty(document, 'cookie', {
      get: () => documentCookie,
      set: (value: string) => {
        documentCookie = value;
      },
      configurable: true,
    });
  });

  describe('getCookie', () => {
    it('should return empty string when cookie does not exist', () => {
      expect(getCookie('nonexistent')).toBe('');
    });

    it('should return cookie value when cookie exists', () => {
      documentCookie = 'testCookie=testValue';
      expect(getCookie('testCookie')).toBe('testValue');
    });

    it('should return correct cookie value when multiple cookies exist', () => {
      documentCookie = 'cookie1=value1; testCookie=targetValue; cookie3=value3';
      expect(getCookie('testCookie')).toBe('targetValue');
    });
  });

  describe('setCookie', () => {
    it('should set cookie with default expiration (365 days)', () => {
      const mockDate = new Date('2024-01-01');
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      setCookie('testCookie', 'testValue');

      expect(documentCookie).toContain('testCookie=testValue');
      expect(documentCookie).toContain('expires=');
      expect(documentCookie).toContain('path=/');

      jest.useRealTimers();
    });

    it('should set cookie with custom expiration days', () => {
      const mockDate = new Date('2024-01-01');
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      setCookie('testCookie', 'testValue', 7);

      const sevenDaysLater = new Date('2024-01-08').toUTCString();
      expect(documentCookie).toContain(`expires=${sevenDaysLater}`);

      jest.useRealTimers();
    });

    it('should override existing cookie with same name', () => {
      setCookie('testCookie', 'originalValue');
      expect(getCookie('testCookie')).toBe('originalValue');

      setCookie('testCookie', 'newValue');
      expect(getCookie('testCookie')).toBe('newValue');
    });
  });
});
