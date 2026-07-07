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

export const isSaveTokenDisabled = ({
  hasSavedTokenInModal,
  tokenInputValue,
  savedTokenMask,
  isUpdatingModalStatus,
}: {
  hasSavedTokenInModal: boolean;
  tokenInputValue: string;
  savedTokenMask: string;
  isUpdatingModalStatus: boolean;
}): boolean => {
  const isTokenInputUnchanged =
    hasSavedTokenInModal && tokenInputValue === savedTokenMask;
  const isTokenInputEmpty = tokenInputValue.trim() === '';
  return isTokenInputUnchanged || isTokenInputEmpty || isUpdatingModalStatus;
};

export const isModalEnabledChecked = ({
  displayStatus,
  modalEnabled,
}: {
  displayStatus: ServerStatus;
  modalEnabled: boolean;
}): boolean =>
  isEnabledToggleUnavailable(displayStatus) ? false : modalEnabled;
