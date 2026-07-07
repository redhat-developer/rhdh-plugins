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
  formatApiError,
  getDisplayStatus,
  getEnabledToggleChecked,
  isEnabledToggleUnavailable,
  isModalEnabledChecked,
  isSaveTokenDisabled,
} from '../mcpServersDisplayUtils';

describe('mcpServersDisplayUtils', () => {
  describe('formatApiError', () => {
    it('returns strings as-is', () => {
      expect(formatApiError('Token required')).toBe('Token required');
    });

    it('returns Error message', () => {
      expect(formatApiError(new Error('Validation failed'))).toBe(
        'Validation failed',
      );
    });

    it('extracts nested message objects', () => {
      expect(formatApiError({ message: 'Invalid token' })).toBe(
        'Invalid token',
      );
    });

    it('extracts nested error fields', () => {
      expect(formatApiError({ error: 'Connection refused' })).toBe(
        'Connection refused',
      );
    });

    it('returns empty string for unknown values', () => {
      expect(formatApiError({ code: 500 })).toBe('');
    });
  });

  describe('getDisplayStatus', () => {
    it('returns tokenRequired when no token is saved', () => {
      expect(
        getDisplayStatus({
          hasToken: false,
          enabled: true,
          status: 'connected',
        }),
      ).toBe('tokenRequired');
    });

    it('returns disabled when server is disabled', () => {
      expect(
        getDisplayStatus({
          hasToken: true,
          enabled: false,
          status: 'connected',
        }),
      ).toBe('disabled');
    });

    it('returns failed when validation status is error', () => {
      expect(
        getDisplayStatus({
          hasToken: true,
          enabled: true,
          status: 'error',
        }),
      ).toBe('failed');
    });

    it('returns ok when connected with token and enabled', () => {
      expect(
        getDisplayStatus({
          hasToken: true,
          enabled: true,
          status: 'connected',
        }),
      ).toBe('ok');
    });
  });

  describe('getEnabledToggleChecked', () => {
    it('shows off when token is required even if enabled in settings', () => {
      expect(
        getEnabledToggleChecked(
          { hasToken: false, enabled: true, status: 'unknown' },
          'tokenRequired',
        ),
      ).toBe(false);
    });

    it('shows off when validation failed even if enabled in settings', () => {
      expect(
        getEnabledToggleChecked(
          { hasToken: true, enabled: true, status: 'error' },
          'failed',
        ),
      ).toBe(false);
    });

    it('reflects enabled state when server is available', () => {
      expect(
        getEnabledToggleChecked(
          { hasToken: true, enabled: true, status: 'connected' },
          'ok',
        ),
      ).toBe(true);
    });
  });

  describe('isEnabledToggleUnavailable', () => {
    it('returns true for tokenRequired and failed statuses', () => {
      expect(isEnabledToggleUnavailable('tokenRequired')).toBe(true);
      expect(isEnabledToggleUnavailable('failed')).toBe(true);
    });

    it('returns false for ok and disabled statuses', () => {
      expect(isEnabledToggleUnavailable('ok')).toBe(false);
      expect(isEnabledToggleUnavailable('disabled')).toBe(false);
    });
  });

  describe('isModalEnabledChecked', () => {
    it('shows off in modal when token is required', () => {
      expect(
        isModalEnabledChecked({
          displayStatus: 'tokenRequired',
          modalEnabled: true,
        }),
      ).toBe(false);
    });

    it('uses modalEnabled when server is available', () => {
      expect(
        isModalEnabledChecked({
          displayStatus: 'ok',
          modalEnabled: false,
        }),
      ).toBe(false);
    });
  });

  describe('isSaveTokenDisabled', () => {
    const savedTokenMask = '********************';

    it('disables save for unchanged masked token', () => {
      expect(
        isSaveTokenDisabled({
          hasSavedTokenInModal: true,
          tokenInputValue: savedTokenMask,
          savedTokenMask,
          isUpdatingModalStatus: false,
        }),
      ).toBe(true);
    });

    it('disables save for empty token input', () => {
      expect(
        isSaveTokenDisabled({
          hasSavedTokenInModal: false,
          tokenInputValue: '',
          savedTokenMask,
          isUpdatingModalStatus: false,
        }),
      ).toBe(true);
    });

    it('disables save while status is updating', () => {
      expect(
        isSaveTokenDisabled({
          hasSavedTokenInModal: false,
          tokenInputValue: 'new-token',
          savedTokenMask,
          isUpdatingModalStatus: true,
        }),
      ).toBe(true);
    });

    it('enables save when user entered a new token', () => {
      expect(
        isSaveTokenDisabled({
          hasSavedTokenInModal: false,
          tokenInputValue: 'new-token',
          savedTokenMask,
          isUpdatingModalStatus: false,
        }),
      ).toBe(false);
    });
  });
});
