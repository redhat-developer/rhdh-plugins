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

export type ServerStatus =
  | 'tokenRequired'
  | 'disabled'
  | 'ok'
  | 'failed'
  | 'unknown';

export type CredentialMode = 'organization' | 'personal';

export type McpServerDisplayInput = {
  enabled: boolean;
  status: 'connected' | 'error' | 'unknown';
  hasToken: boolean;
};

export const formatApiError = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === 'object') {
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
    if ('error' in error) {
      return formatApiError((error as { error: unknown }).error);
    }
  }
  return '';
};

export const getDisplayStatus = (
  server: McpServerDisplayInput,
): ServerStatus => {
  if (!server.hasToken) return 'tokenRequired';
  if (!server.enabled) return 'disabled';
  if (server.status === 'error') return 'failed';
  if (server.status === 'connected') return 'ok';
  return 'unknown';
};

export const isEnabledToggleUnavailable = (
  displayStatus: ServerStatus,
): boolean => displayStatus === 'failed' || displayStatus === 'tokenRequired';

export const getEnabledToggleChecked = (
  server: McpServerDisplayInput,
  displayStatus: ServerStatus,
): boolean =>
  isEnabledToggleUnavailable(displayStatus) ? false : server.enabled;

export const getInitialCredentialMode = (server: {
  hasUserToken: boolean;
  hasOrgToken: boolean;
}): CredentialMode => {
  if (server.hasUserToken) {
    return 'personal';
  }
  if (server.hasOrgToken) {
    return 'organization';
  }
  return 'personal';
};

export const getModalEffectiveHasToken = ({
  hasOrgToken,
  credentialMode,
  tokenInputValue,
  hasSavedPersonalTokenInModal,
}: {
  hasOrgToken: boolean;
  credentialMode: CredentialMode;
  tokenInputValue: string;
  hasSavedPersonalTokenInModal: boolean;
}): boolean => {
  if (credentialMode === 'organization') {
    return hasOrgToken;
  }
  return tokenInputValue.trim().length > 0 || hasSavedPersonalTokenInModal;
};

export const getModalVerifiedHasToken = ({
  hasOrgToken,
  credentialMode,
  hasSavedPersonalTokenInModal,
}: {
  hasOrgToken: boolean;
  credentialMode: CredentialMode;
  hasSavedPersonalTokenInModal: boolean;
}): boolean => {
  if (credentialMode === 'organization') {
    return hasOrgToken;
  }
  return hasSavedPersonalTokenInModal;
};

export const getModalDisplayHasToken = ({
  modalVerifiedHasToken,
  modalEnabled,
  serverHasToken,
}: {
  modalVerifiedHasToken: boolean;
  modalEnabled: boolean;
  serverHasToken: boolean;
}): boolean => modalVerifiedHasToken || (!modalEnabled && serverHasToken);

export const hasModalUnsavedChanges = ({
  tokenInputValue,
  initialTokenInputValue,
  modalEnabled,
  serverEnabled,
  credentialMode,
  initialCredentialMode,
}: {
  tokenInputValue: string;
  initialTokenInputValue: string;
  modalEnabled: boolean;
  serverEnabled: boolean;
  credentialMode?: CredentialMode;
  initialCredentialMode?: CredentialMode;
}): boolean =>
  tokenInputValue !== initialTokenInputValue ||
  modalEnabled !== serverEnabled ||
  (credentialMode !== undefined &&
    initialCredentialMode !== undefined &&
    credentialMode !== initialCredentialMode);

export type TokenValidationState = 'idle' | 'validating' | 'success' | 'error';

export const isSaveTokenDisabled = ({
  tokenInputValue,
  initialTokenInputValue,
  modalEnabled,
  serverEnabled,
  credentialMode,
  initialCredentialMode,
  hasOrgToken,
  hasSavedPersonalTokenInModal,
  tokenValidationState = 'idle',
}: {
  tokenInputValue: string;
  initialTokenInputValue: string;
  modalEnabled: boolean;
  serverEnabled: boolean;
  credentialMode: CredentialMode;
  initialCredentialMode: CredentialMode;
  hasOrgToken: boolean;
  hasSavedPersonalTokenInModal: boolean;
  tokenValidationState?: TokenValidationState;
}): boolean => {
  if (
    tokenValidationState === 'error' &&
    tokenInputValue === initialTokenInputValue
  ) {
    return true;
  }

  if (
    !hasModalUnsavedChanges({
      tokenInputValue,
      initialTokenInputValue,
      modalEnabled,
      serverEnabled,
      credentialMode,
      initialCredentialMode,
    })
  ) {
    return true;
  }

  if (credentialMode === 'personal') {
    return !getModalEffectiveHasToken({
      hasOrgToken,
      credentialMode,
      tokenInputValue,
      hasSavedPersonalTokenInModal,
    });
  }

  return false;
};

export type McpServerModalInput = McpServerDisplayInput & {
  hasUserToken?: boolean;
};

export const hasModalEnabledStateChange = ({
  server,
  modalEnabled,
}: {
  server?: McpServerModalInput;
  modalEnabled: boolean;
}): boolean => Boolean(server && modalEnabled !== server.enabled);

export const getModalDisplayStatus = (
  server: McpServerDisplayInput,
  modalEnabled: boolean,
): ServerStatus => getDisplayStatus({ ...server, enabled: modalEnabled });

export type ModalEnabledDescriptionKey =
  | 'mcp.settings.modal.enabledDescription'
  | 'mcp.settings.modal.enabledDescriptionOff'
  | 'mcp.settings.modal.enabledDescriptionTokenRequired';

export const getModalEnabledDescriptionKey = (
  isChecked: boolean,
  displayStatus: ServerStatus,
): ModalEnabledDescriptionKey => {
  if (isChecked) {
    return 'mcp.settings.modal.enabledDescription';
  }
  if (displayStatus === 'tokenRequired') {
    return 'mcp.settings.modal.enabledDescriptionTokenRequired';
  }
  return 'mcp.settings.modal.enabledDescriptionOff';
};

export const isModalEnabledChecked = ({
  displayStatus,
  modalEnabled,
}: {
  displayStatus: ServerStatus;
  modalEnabled: boolean;
}): boolean =>
  isEnabledToggleUnavailable(displayStatus) ? false : modalEnabled;
