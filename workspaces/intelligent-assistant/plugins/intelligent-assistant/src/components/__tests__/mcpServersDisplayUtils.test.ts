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
  getModalDisplayStatus,
  getModalEnabledDescriptionKey,
  hasModalEnabledStateChange,
  hasModalUnsavedChanges,
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

  describe('getModalDisplayStatus', () => {
    const server = {
      hasToken: true,
      enabled: true,
      status: 'connected' as const,
    };

    it('returns disabled when modal toggle is off', () => {
      expect(getModalDisplayStatus(server, false)).toBe('disabled');
    });

    it('returns ok when modal toggle is on and server is connected', () => {
      expect(getModalDisplayStatus(server, true)).toBe('ok');
    });
  });

  describe('getModalEnabledDescriptionKey', () => {
    it('returns active description when enabled', () => {
      expect(getModalEnabledDescriptionKey(true, 'ok')).toBe(
        'mcp.settings.modal.enabledDescription',
      );
    });

    it('returns token-required description when token is missing', () => {
      expect(getModalEnabledDescriptionKey(false, 'tokenRequired')).toBe(
        'mcp.settings.modal.enabledDescriptionTokenRequired',
      );
    });

    it('returns user-disabled description when server has a token', () => {
      expect(getModalEnabledDescriptionKey(false, 'disabled')).toBe(
        'mcp.settings.modal.enabledDescriptionOff',
      );
    });
  });

  describe('hasModalEnabledStateChange', () => {
    const server = {
      hasToken: true,
      hasUserToken: false,
      enabled: false,
      status: 'connected' as const,
    };

    it('returns true when enabled state changed', () => {
      expect(
        hasModalEnabledStateChange({
          server,
          modalEnabled: true,
        }),
      ).toBe(true);
    });

    it('returns false when enabled state is unchanged', () => {
      expect(
        hasModalEnabledStateChange({
          server,
          modalEnabled: false,
        }),
      ).toBe(false);
    });
  });

  describe('hasModalUnsavedChanges', () => {
    const savedTokenMask = '********************';

    it('returns true when token input changed', () => {
      expect(
        hasModalUnsavedChanges({
          tokenInputValue: 'new-token',
          initialTokenInputValue: '',
          modalEnabled: true,
          serverEnabled: true,
        }),
      ).toBe(true);
    });

    it('returns true when enabled state changed', () => {
      expect(
        hasModalUnsavedChanges({
          tokenInputValue: savedTokenMask,
          initialTokenInputValue: savedTokenMask,
          modalEnabled: false,
          serverEnabled: true,
        }),
      ).toBe(true);
    });

    it('returns false when nothing changed', () => {
      expect(
        hasModalUnsavedChanges({
          tokenInputValue: savedTokenMask,
          initialTokenInputValue: savedTokenMask,
          modalEnabled: true,
          serverEnabled: true,
        }),
      ).toBe(false);
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

    it('disables save when nothing changed', () => {
      expect(
        isSaveTokenDisabled({
          tokenInputValue: savedTokenMask,
          initialTokenInputValue: savedTokenMask,
          modalEnabled: true,
          serverEnabled: true,
          isUpdatingModalStatus: false,
        }),
      ).toBe(true);
    });

    it('enables save after personal token was removed', () => {
      expect(
        isSaveTokenDisabled({
          tokenInputValue: '',
          initialTokenInputValue: '',
          modalEnabled: false,
          serverEnabled: false,
          isUpdatingModalStatus: false,
          hasRemovedPersonalToken: true,
        }),
      ).toBe(false);
    });

    it('disables save while status is updating even with changes', () => {
      expect(
        isSaveTokenDisabled({
          tokenInputValue: 'new-token',
          initialTokenInputValue: '',
          modalEnabled: true,
          serverEnabled: true,
          isUpdatingModalStatus: true,
        }),
      ).toBe(true);
    });

    it('enables save when only enabled state changed', () => {
      expect(
        isSaveTokenDisabled({
          tokenInputValue: savedTokenMask,
          initialTokenInputValue: savedTokenMask,
          modalEnabled: false,
          serverEnabled: true,
          isUpdatingModalStatus: false,
        }),
      ).toBe(false);
    });

    it('enables save when token input changed', () => {
      expect(
        isSaveTokenDisabled({
          tokenInputValue: 'new-token',
          initialTokenInputValue: '',
          modalEnabled: true,
          serverEnabled: true,
          isUpdatingModalStatus: false,
        }),
      ).toBe(false);
    });
  });
});
