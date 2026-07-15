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
  compareMcpServers,
  formatApiError,
  getDisplayStatus,
  getEnabledToggleChecked,
  getInitialCredentialMode,
  getModalDisplayHasToken,
  getModalDisplayStatus,
  getModalEffectiveHasToken,
  getModalEnabledDescriptionKey,
  getModalVerifiedHasToken,
  getStatusSortRank,
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

  describe('getInitialCredentialMode', () => {
    it('returns personal when user token is saved', () => {
      expect(
        getInitialCredentialMode({ hasUserToken: true, hasOrgToken: true }),
      ).toBe('personal');
    });

    it('returns organization when only org token exists', () => {
      expect(
        getInitialCredentialMode({ hasUserToken: false, hasOrgToken: true }),
      ).toBe('organization');
    });

    it('returns personal when no org token exists', () => {
      expect(
        getInitialCredentialMode({ hasUserToken: false, hasOrgToken: false }),
      ).toBe('personal');
    });
  });

  describe('getModalEffectiveHasToken', () => {
    it('returns true for organization mode when org token exists', () => {
      expect(
        getModalEffectiveHasToken({
          hasOrgToken: true,
          credentialMode: 'organization',
          tokenInputValue: '',
          hasSavedPersonalTokenInModal: false,
        }),
      ).toBe(true);
    });

    it('returns true for personal mode with saved token', () => {
      expect(
        getModalEffectiveHasToken({
          hasOrgToken: true,
          credentialMode: 'personal',
          tokenInputValue: '',
          hasSavedPersonalTokenInModal: true,
        }),
      ).toBe(true);
    });

    it('returns false for personal mode without token', () => {
      expect(
        getModalEffectiveHasToken({
          hasOrgToken: true,
          credentialMode: 'personal',
          tokenInputValue: '',
          hasSavedPersonalTokenInModal: false,
        }),
      ).toBe(false);
    });
  });

  describe('getModalDisplayHasToken', () => {
    it('uses server token when disabled and draft personal mode has no token', () => {
      expect(
        getModalDisplayHasToken({
          modalVerifiedHasToken: false,
          modalEnabled: false,
          serverHasToken: true,
        }),
      ).toBe(true);
    });

    it('does not use server token when enabled without verified personal token', () => {
      expect(
        getModalDisplayHasToken({
          modalVerifiedHasToken: false,
          modalEnabled: true,
          serverHasToken: true,
        }),
      ).toBe(false);
    });
  });

  describe('getModalVerifiedHasToken', () => {
    it('returns true for organization mode when org token exists', () => {
      expect(
        getModalVerifiedHasToken({
          hasOrgToken: true,
          credentialMode: 'organization',
          hasSavedPersonalTokenInModal: false,
        }),
      ).toBe(true);
    });

    it('returns false for personal mode with only draft input', () => {
      expect(
        getModalVerifiedHasToken({
          hasOrgToken: true,
          credentialMode: 'personal',
          hasSavedPersonalTokenInModal: false,
        }),
      ).toBe(false);
    });

    it('returns true for personal mode with saved token', () => {
      expect(
        getModalVerifiedHasToken({
          hasOrgToken: true,
          credentialMode: 'personal',
          hasSavedPersonalTokenInModal: true,
        }),
      ).toBe(true);
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

    it('returns true when credential mode changed', () => {
      expect(
        hasModalUnsavedChanges({
          tokenInputValue: '',
          initialTokenInputValue: '',
          modalEnabled: true,
          serverEnabled: true,
          credentialMode: 'organization',
          initialCredentialMode: 'personal',
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
    const baseArgs = {
      tokenInputValue: savedTokenMask,
      initialTokenInputValue: savedTokenMask,
      modalEnabled: true,
      serverEnabled: true,
      credentialMode: 'personal' as const,
      initialCredentialMode: 'personal' as const,
      hasOrgToken: true,
      hasSavedPersonalTokenInModal: true,
    };

    it('disables save when nothing changed', () => {
      expect(isSaveTokenDisabled(baseArgs)).toBe(true);
    });

    it('enables save when credential mode changed to organization', () => {
      expect(
        isSaveTokenDisabled({
          ...baseArgs,
          tokenInputValue: '',
          hasSavedPersonalTokenInModal: false,
          credentialMode: 'organization',
        }),
      ).toBe(false);
    });

    it('disables save for personal mode without token', () => {
      expect(
        isSaveTokenDisabled({
          ...baseArgs,
          tokenInputValue: '',
          initialTokenInputValue: '',
          hasSavedPersonalTokenInModal: false,
          credentialMode: 'personal',
          initialCredentialMode: 'organization',
        }),
      ).toBe(true);
    });

    it('enables save when only enabled state changed', () => {
      expect(
        isSaveTokenDisabled({
          ...baseArgs,
          modalEnabled: false,
        }),
      ).toBe(false);
    });

    it('disables save when token input matches baseline after failed attempt', () => {
      expect(
        isSaveTokenDisabled({
          ...baseArgs,
          tokenInputValue: 'bad-token',
          initialTokenInputValue: 'bad-token',
          hasSavedPersonalTokenInModal: false,
        }),
      ).toBe(true);
    });

    it('enables save after personal token was removed', () => {
      expect(
        isSaveTokenDisabled({
          ...baseArgs,
          tokenInputValue: '',
          initialTokenInputValue: '',
          modalEnabled: false,
          serverEnabled: false,
          hasSavedPersonalTokenInModal: false,
          hasRemovedPersonalToken: true,
        }),
      ).toBe(false);
    });

    it('disables save after failed validation until token input changes', () => {
      expect(
        isSaveTokenDisabled({
          ...baseArgs,
          tokenInputValue: 'bad-token',
          initialTokenInputValue: 'bad-token',
          hasSavedPersonalTokenInModal: false,
          credentialMode: 'personal',
          initialCredentialMode: 'organization',
          tokenValidationState: 'error',
        }),
      ).toBe(true);
    });

    it('enables save when only enabled state changed on DCR servers', () => {
      expect(
        isSaveTokenDisabled({
          ...baseArgs,
          modalEnabled: false,
          hasOrgToken: false,
          hasSavedPersonalTokenInModal: false,
          tokenInputValue: '',
          initialTokenInputValue: '',
          isDcrServer: true,
        }),
      ).toBe(false);
    });

    it('enables save when token input changed', () => {
      expect(
        isSaveTokenDisabled({
          ...baseArgs,
          tokenInputValue: 'new-token',
          initialTokenInputValue: '',
          hasSavedPersonalTokenInModal: false,
        }),
      ).toBe(false);
    });
  });

  describe('compareMcpServers', () => {
    const server = (
      name: string,
      overrides: {
        hasToken?: boolean;
        enabled?: boolean;
        status?: 'connected' | 'error' | 'unknown';
        toolCount?: number;
      } = {},
    ) => ({
      name,
      hasToken: true,
      enabled: true,
      status: 'connected' as const,
      toolCount: 0,
      ...overrides,
    });

    it('sorts by name ascending', () => {
      expect(
        compareMcpServers(server('beta'), server('alpha'), 'name', true),
      ).toBeGreaterThan(0);
    });

    it('sorts by name descending', () => {
      expect(
        compareMcpServers(server('alpha'), server('beta'), 'name', false),
      ).toBeGreaterThan(0);
    });

    it('sorts by status rank ascending with name tie-breaker', () => {
      const connected = server('beta', { status: 'connected' });
      const failed = server('alpha', { status: 'error' });
      expect(compareMcpServers(connected, failed, 'status', true)).toBeLessThan(
        0,
      );
      expect(
        compareMcpServers(failed, connected, 'status', true),
      ).toBeGreaterThan(0);
    });

    it('sorts connected servers by tool count when status rank matches', () => {
      const fewerTools = server('beta', { toolCount: 1 });
      const moreTools = server('alpha', { toolCount: 5 });
      expect(
        compareMcpServers(fewerTools, moreTools, 'status', true),
      ).toBeLessThan(0);
    });
  });

  describe('getStatusSortRank', () => {
    it('orders healthy statuses before error states', () => {
      expect(getStatusSortRank('ok')).toBeLessThan(getStatusSortRank('failed'));
      expect(getStatusSortRank('tokenRequired')).toBeLessThan(
        getStatusSortRank('failed'),
      );
    });
  });
});
