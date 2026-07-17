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
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';

import {
  formatApiError,
  getDisplayDetail,
  getInitialCredentialMode,
  getModalDisplayHasToken,
  getModalDisplayStatus,
  isModalEnabledChecked as getModalEnabledChecked,
  getModalVerifiedHasToken,
  isSaveTokenDisabled as getSaveTokenDisabled,
  isEnabledToggleUnavailable,
  type CredentialMode,
  type McpConfigureServer,
  type ServerStatus,
  type TokenValidationState,
} from '../components/mcpServersDisplayUtils';
import { useTranslation } from './useTranslation';

const SAVED_TOKEN_MASK = '********************';

export type McpToolInfo = {
  name: string;
  description?: string;
};

export type McpServerValidationResult = {
  status: 'connected' | 'error' | 'unknown';
  toolCount: number;
  validation?: {
    error?: unknown;
    tools?: McpToolInfo[];
  };
};

export type McpCredentialsValidationResult = {
  valid: boolean;
  error?: unknown;
  toolCount: number;
  tools?: McpToolInfo[];
};

export type UseMcpConfigureModalOptions = {
  servers: McpConfigureServer[];
  canManageMcp: boolean;
  isSaving: Record<string, boolean>;
  patchServer: (
    serverName: string,
    body: { enabled?: boolean; token?: string | null },
  ) => Promise<void>;
  validateServer: (serverName: string) => Promise<McpServerValidationResult>;
  validateCredentials: (
    url: string,
    token: string,
  ) => Promise<McpCredentialsValidationResult>;
  fetchServerValidation: (
    serverName: string,
  ) => Promise<McpServerValidationResult>;
};

/**
 * Owns all state, handlers and derived display data for the MCP "configure
 * server" modal. Rendering (JSX/styles) lives in `McpConfigureServerModal`.
 */
export const useMcpConfigureModal = ({
  servers,
  canManageMcp,
  isSaving,
  patchServer,
  validateServer,
  validateCredentials,
  fetchServerValidation,
}: UseMcpConfigureModalOptions) => {
  const { t } = useTranslation();
  const [editingServerId, setEditingServerId] = useState<string | null>(null);
  const [tokenInputValue, setTokenInputValue] = useState('');
  const [initialTokenInputValue, setInitialTokenInputValue] = useState('');
  const [hasSavedTokenInModal, setHasSavedTokenInModal] = useState(false);
  const [modalCredentialMode, setModalCredentialMode] =
    useState<CredentialMode>('personal');
  const [initialCredentialMode, setInitialCredentialMode] =
    useState<CredentialMode>('personal');
  const [tokenValidationState, setTokenValidationState] =
    useState<TokenValidationState>('idle');
  const [tokenValidationMessage, setTokenValidationMessage] = useState('');
  const [modalEnabled, setModalEnabled] = useState(true);
  const [modalTools, setModalTools] = useState<string[]>([]);
  const [isLoadingModalTools, setIsLoadingModalTools] = useState(false);
  const [modalToolsError, setModalToolsError] = useState<string | null>(null);
  const [canRemovePersonalToken, setCanRemovePersonalToken] = useState(false);
  const [isUpdatingModalStatus, setIsUpdatingModalStatus] = useState(false);
  const [hasRemovedPersonalToken, setHasRemovedPersonalToken] = useState(false);

  const editingServer = useMemo(
    () => servers.find(server => server.id === editingServerId),
    [servers, editingServerId],
  );

  const close = useCallback(() => {
    setEditingServerId(null);
    setTokenInputValue('');
    setInitialTokenInputValue('');
    setHasSavedTokenInModal(false);
    setModalCredentialMode('personal');
    setInitialCredentialMode('personal');
    setTokenValidationState('idle');
    setTokenValidationMessage('');
    setModalEnabled(true);
    setModalTools([]);
    setIsLoadingModalTools(false);
    setModalToolsError(null);
    setCanRemovePersonalToken(false);
    setIsUpdatingModalStatus(false);
    setHasRemovedPersonalToken(false);
  }, []);

  const open = useCallback(
    (server: McpConfigureServer) => {
      setEditingServerId(server.id);
      const credentialMode = getInitialCredentialMode(server);
      const hasSavedPersonalToken = server.hasUserToken;
      setModalCredentialMode(credentialMode);
      setInitialCredentialMode(credentialMode);
      setHasSavedTokenInModal(hasSavedPersonalToken);
      setCanRemovePersonalToken(server.hasUserToken && !server.hasOrgToken);
      const initialToken = hasSavedPersonalToken ? SAVED_TOKEN_MASK : '';
      setInitialTokenInputValue(initialToken);
      setTokenInputValue(initialToken);
      setModalEnabled(server.enabled);
      setModalTools([]);
      setModalToolsError(null);
      setIsUpdatingModalStatus(false);
      setHasRemovedPersonalToken(false);
      if (server.status === 'error' && server.validationError) {
        setTokenValidationState('error');
        setTokenValidationMessage(
          formatApiError(server.validationError) ||
            t('mcp.settings.token.validationFailed'),
        );
      } else {
        setTokenValidationState('idle');
        setTokenValidationMessage('');
      }
    },
    [t],
  );

  useEffect(() => {
    if (!editingServer) {
      return undefined;
    }

    if (!editingServer.hasToken) {
      setModalTools([]);
      setModalToolsError(null);
      setIsLoadingModalTools(false);
      return undefined;
    }

    let cancelled = false;
    setIsLoadingModalTools(true);
    setModalToolsError(null);

    void fetchServerValidation(editingServer.name)
      .then(data => {
        if (cancelled) {
          return;
        }
        const tools = data.validation?.tools?.map(tool => tool.name) ?? [];
        setModalTools(tools);
        if (data.status === 'error') {
          setModalToolsError(
            formatApiError(data.validation?.error) ||
              t('mcp.settings.token.validationFailed'),
          );
        } else {
          setModalToolsError(null);
        }
      })
      .catch(e => {
        if (cancelled) {
          return;
        }
        setModalTools([]);
        setModalToolsError(
          e instanceof Error
            ? e.message
            : t('mcp.settings.modal.toolsLoadFailed'),
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingModalTools(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [editingServer, fetchServerValidation, t]);

  const onTokenInputChange = useCallback(
    (value: string) => {
      if (hasSavedTokenInModal && value !== SAVED_TOKEN_MASK) {
        setHasSavedTokenInModal(false);
      }
      setTokenInputValue(value);
      setTokenValidationState('idle');
      setTokenValidationMessage('');
    },
    [hasSavedTokenInModal],
  );

  const onCredentialModeChange = useCallback(
    (mode: CredentialMode) => {
      if (mode === modalCredentialMode) {
        return;
      }
      setModalCredentialMode(mode);
      setTokenValidationState('idle');
      setTokenValidationMessage('');

      if (mode === 'organization') {
        setHasSavedTokenInModal(false);
        setTokenInputValue('');
        return;
      }

      if (editingServer?.hasUserToken) {
        setHasSavedTokenInModal(true);
        setTokenInputValue(SAVED_TOKEN_MASK);
        setInitialTokenInputValue(SAVED_TOKEN_MASK);
        return;
      }

      setHasSavedTokenInModal(false);
      setTokenInputValue('');
      setInitialTokenInputValue('');
    },
    [modalCredentialMode, editingServer],
  );

  const clearTokenInput = useCallback(() => {
    if (hasSavedTokenInModal) {
      setHasSavedTokenInModal(false);
    }
    setTokenInputValue('');
    setTokenValidationState('idle');
    setTokenValidationMessage('');
  }, [hasSavedTokenInModal]);

  const showCredentialRadios = Boolean(
    editingServer?.hasOrgToken && editingServer.auth !== 'dcr',
  );
  const showPersonalTokenField =
    editingServer?.auth !== 'dcr' &&
    (!showCredentialRadios || modalCredentialMode === 'personal');

  let tokenInputValidated: 'success' | 'error' | undefined;
  if (tokenValidationState === 'success') {
    tokenInputValidated = 'success';
  } else if (tokenValidationState === 'error') {
    tokenInputValidated = 'error';
  }

  let tokenHelperVariant: 'success' | 'error' | 'default' = 'default';
  if (tokenValidationState === 'success') {
    tokenHelperVariant = 'success';
  } else if (tokenValidationState === 'error') {
    tokenHelperVariant = 'error';
  }

  const showTokenHelperText =
    !hasSavedTokenInModal || tokenValidationState !== 'idle';

  const tokenHelperText =
    tokenValidationMessage || t('mcp.settings.enterToken');

  const configureModalTitle = t('mcp.settings.configureServerTitle' as any, {
    serverName: editingServer?.name ?? '',
  });

  const isConfigureModalSaving = Boolean(isSaving[editingServer?.name ?? '']);
  const isSaveTokenButtonDisabled = getSaveTokenDisabled({
    tokenInputValue,
    initialTokenInputValue,
    modalEnabled,
    serverEnabled: editingServer?.enabled ?? true,
    credentialMode: modalCredentialMode,
    initialCredentialMode,
    hasOrgToken: editingServer?.hasOrgToken ?? false,
    hasSavedPersonalTokenInModal: hasSavedTokenInModal,
    tokenValidationState,
    hasRemovedPersonalToken,
    isDcrServer: editingServer?.auth === 'dcr',
  });

  const removePersonalToken = useCallback(async () => {
    if (
      !editingServer ||
      !canManageMcp ||
      isUpdatingModalStatus ||
      editingServer.hasOrgToken
    ) {
      return;
    }

    setIsUpdatingModalStatus(true);
    setTokenInputValue('');
    setTokenValidationState('idle');
    setTokenValidationMessage('');
    setModalTools([]);
    setModalToolsError(null);
    setIsLoadingModalTools(false);

    try {
      await patchServer(editingServer.name, { token: null, enabled: false });
      setHasSavedTokenInModal(false);
      setInitialTokenInputValue('');
      setModalEnabled(false);
      setHasRemovedPersonalToken(true);
    } catch {
      const server = servers.find(item => item.id === editingServerId);
      if (server?.hasUserToken) {
        setHasSavedTokenInModal(true);
        setCanRemovePersonalToken(true);
        setTokenInputValue(SAVED_TOKEN_MASK);
      }
      setHasRemovedPersonalToken(false);
    } finally {
      setIsUpdatingModalStatus(false);
    }
  }, [
    canManageMcp,
    editingServer,
    editingServerId,
    isUpdatingModalStatus,
    patchServer,
    servers,
  ]);

  const save = useCallback(async () => {
    if (!editingServer || !canManageMcp) return;

    const hasCredentialModeChange =
      modalCredentialMode !== initialCredentialMode;
    const hasTokenInputChange = tokenInputValue !== initialTokenInputValue;
    const hasEnabledInputChange = modalEnabled !== editingServer.enabled;

    if (
      !hasCredentialModeChange &&
      !hasTokenInputChange &&
      !hasEnabledInputChange
    ) {
      close();
      return;
    }

    if (
      modalCredentialMode === 'organization' &&
      (hasCredentialModeChange || hasEnabledInputChange)
    ) {
      setTokenValidationState('validating');
      setTokenValidationMessage(t('mcp.settings.token.savingAndValidating'));
      try {
        await patchServer(editingServer.name, {
          token: null,
          enabled: modalEnabled,
        });
        const validationResult = await validateServer(editingServer.name);
        if (validationResult.status === 'error') {
          setTokenValidationState('error');
          setTokenValidationMessage(
            formatApiError(validationResult.validation?.error) ||
              t('mcp.settings.token.validationFailed'),
          );
          return;
        }
        close();
      } catch (e) {
        setTokenValidationState('error');
        setTokenValidationMessage(
          e instanceof Error
            ? e.message
            : `Failed to update ${editingServer.name} settings`,
        );
      }
      return;
    }

    if (!hasTokenInputChange && hasEnabledInputChange) {
      await patchServer(editingServer.name, { enabled: modalEnabled });
      close();
      return;
    }

    const markFailedTokenAttempt = () => {
      setInitialTokenInputValue(tokenInputValue);
    };

    const token = tokenInputValue.trim();
    const hasToken = token.length > 0;

    setTokenValidationState('validating');
    setTokenValidationMessage(t('mcp.settings.token.validating'));

    try {
      if (hasToken) {
        if (!editingServer.url) {
          setTokenValidationState('error');
          setTokenValidationMessage(
            t('mcp.settings.token.urlUnavailableForValidation'),
          );
          markFailedTokenAttempt();
          return;
        }

        const credentialValidation = await validateCredentials(
          editingServer.url,
          token,
        );
        if (!credentialValidation.valid) {
          setTokenValidationState('error');
          setTokenValidationMessage(
            formatApiError(credentialValidation.error) ||
              t('mcp.settings.token.invalidCredentials'),
          );
          markFailedTokenAttempt();
          return;
        }
        setModalTools(credentialValidation.tools?.map(tool => tool.name) ?? []);
      }

      setTokenValidationMessage(t('mcp.settings.token.savingAndValidating'));
      await patchServer(editingServer.name, {
        enabled: modalEnabled,
        token: hasToken ? token : null,
      });
      const validationResult = await validateServer(editingServer.name);
      if (validationResult.status === 'error') {
        setTokenValidationState('error');
        setTokenValidationMessage(
          formatApiError(validationResult.validation?.error) ||
            t('mcp.settings.token.validationFailed'),
        );
        markFailedTokenAttempt();
        return;
      }
      if (hasToken && validationResult.status === 'connected') {
        await patchServer(editingServer.name, { enabled: true });
        setModalEnabled(true);
      }
      setTokenValidationState('success');
      setTokenValidationMessage(t('mcp.settings.token.connectionSuccessful'));
      close();
    } catch (e) {
      setTokenValidationState('error');
      setTokenValidationMessage(
        e instanceof Error
          ? e.message
          : `Failed to update ${editingServer.name} token`,
      );
      markFailedTokenAttempt();
    }
  }, [
    canManageMcp,
    close,
    editingServer,
    initialCredentialMode,
    initialTokenInputValue,
    modalCredentialMode,
    modalEnabled,
    patchServer,
    t,
    tokenInputValue,
    validateCredentials,
    validateServer,
  ]);

  const onModalEnabledChange = useCallback(
    (_event: FormEvent, checked: boolean) => {
      if (!editingServer || !canManageMcp) {
        return;
      }
      setModalEnabled(checked);
    },
    [editingServer, canManageMcp],
  );

  const modalVerifiedHasToken = editingServer
    ? editingServer.auth === 'dcr' ||
      getModalVerifiedHasToken({
        hasOrgToken: editingServer.hasOrgToken,
        credentialMode: modalCredentialMode,
        hasSavedPersonalTokenInModal: hasSavedTokenInModal,
      })
    : false;

  const modalDisplayStatus: ServerStatus = editingServer
    ? getModalDisplayStatus(
        {
          ...editingServer,
          hasToken: getModalDisplayHasToken({
            modalVerifiedHasToken,
            modalEnabled,
            serverHasToken: editingServer.hasToken,
          }),
        },
        modalEnabled,
      )
    : 'unknown';

  const isModalEnabledToggleDisabled =
    !canManageMcp ||
    !editingServer ||
    isUpdatingModalStatus ||
    isEnabledToggleUnavailable(modalDisplayStatus) ||
    Boolean(isSaving[editingServer?.name ?? '']);

  const isModalEnabledChecked = getModalEnabledChecked({
    displayStatus: modalDisplayStatus,
    modalEnabled,
  });

  const modalStatusDetail = editingServer
    ? getDisplayDetail(editingServer, modalDisplayStatus, t)
    : '';

  const modalToolCount = modalTools.length || editingServer?.toolCount || 0;

  const modalEnabledDescription = (() => {
    if (isModalEnabledChecked) {
      return t('mcp.settings.modal.enabledDescription');
    }
    if (modalDisplayStatus === 'tokenRequired') {
      return t('mcp.settings.modal.enabledDescriptionTokenRequired');
    }
    return t('mcp.settings.modal.enabledDescriptionOff');
  })();

  const modalStatusText = (() => {
    if (isUpdatingModalStatus) {
      return t('mcp.settings.modal.loadingStatus');
    }
    if (isLoadingModalTools) {
      return t('mcp.settings.modal.fetchingStatus');
    }
    if (modalDisplayStatus === 'disabled') {
      return t('mcp.settings.status.disabled');
    }
    if (modalDisplayStatus === 'tokenRequired') {
      return t('mcp.settings.status.tokenRequired');
    }
    if (modalDisplayStatus === 'ok' && modalTools.length > 0) {
      if (modalTools.length === 1) {
        return t('mcp.settings.status.oneTool' as any, {
          count: String(modalTools.length),
        });
      }
      return t('mcp.settings.status.manyTools' as any, {
        count: String(modalTools.length),
      });
    }
    if (modalToolsError) {
      return modalToolsError;
    }
    return modalStatusDetail;
  })();

  const modalToolsEmptyText =
    modalToolsError ?? t('mcp.settings.modal.noToolsAvailable');

  return {
    isOpen: Boolean(editingServer),
    editingServer,
    open,
    close,
    save,
    removePersonalToken,
    canManageMcp,
    configureModalTitle,
    isConfigureModalSaving,
    isSaveTokenButtonDisabled,
    isUpdatingModalStatus,
    tokenInputValue,
    onTokenInputChange,
    clearTokenInput,
    tokenInputValidated,
    tokenValidationState,
    tokenHelperVariant,
    showTokenHelperText,
    tokenHelperText,
    modalCredentialMode,
    onCredentialModeChange,
    showCredentialRadios,
    showPersonalTokenField,
    onModalEnabledChange,
    isModalEnabledChecked,
    isModalEnabledToggleDisabled,
    modalDisplayStatus,
    modalStatusDetail,
    modalStatusText,
    modalTools,
    modalToolCount,
    isLoadingModalTools,
    modalToolsError,
    modalToolsEmptyText,
    modalVerifiedHasToken,
    modalEnabledDescription,
    canRemovePersonalToken,
    hasSavedTokenInModal,
    hasRemovedPersonalToken,
  };
};

export type UseMcpConfigureModalResult = ReturnType<
  typeof useMcpConfigureModal
>;
