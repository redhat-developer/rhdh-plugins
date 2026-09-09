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

import '@patternfly/react-core/dist/styles/base-no-reset.css';
import '@patternfly/chatbot/dist/css/main.css';

import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import { identityApiRef, useApi } from '@backstage/core-plugin-api';

import {
  StylesProvider as StylesProviderV4,
  useTheme,
} from '@material-ui/core/styles';
import { StylesProvider } from '@mui/styles';
import { QueryClientProvider } from '@tanstack/react-query';

import { useAllModels } from '../hooks/useAllModels';
import { useIaChatPermission } from '../hooks/useIaChatPermission';
import { useIaNotebooksPermission } from '../hooks/useIaNotebooksPermission';
import { useTopicRestrictionStatus } from '../hooks/useQuestionValidation';
import {
  generateClassName,
  generateClassNameV4,
} from '../utils/generateClassName';
import queryClient from '../utils/queryClient';
import FileAttachmentContextProvider from './AttachmentContext';
import { LightspeedChat } from './LightSpeedChat';
import {
  LcoreNotConfiguredEmptyState,
  LightspeedChatModelsLoading,
  ModelsLoadErrorEmptyState,
} from './LightspeedChatModelsState';

const THEME_DARK = 'dark';
const THEME_DARK_CLASS = 'pf-v6-theme-dark';
const LAST_SELECTED_MODEL_KEY = 'lastSelectedModel';

/**
 * Inner component that contains all the Lightspeed chat rendering logic
 */
const LightspeedChatContainerInner = () => {
  const {
    palette: { type },
  } = useTheme();

  const identityApi = useApi(identityApiRef);

  const { allowed: hasChatAccess, loading: chatPermissionLoading } =
    useIaChatPermission();

  const { allowed: hasNotebooksAccess, loading: notebooksPermissionLoading } =
    useIaNotebooksPermission();

  const permissionsLoading =
    chatPermissionLoading || notebooksPermissionLoading;
  const hasPluginAccess = hasChatAccess || hasNotebooksAccess;

  const {
    data: models,
    isLoading: modelsLoading,
    isError: modelsError,
    refetch: refetchModels,
  } = useAllModels(hasChatAccess);

  const { value: profile, loading: profileLoading } = useAsync(
    async () => await identityApi.getProfileInfo(),
  );

  const [selectedModel, setSelectedModel] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');

  const { data: topicRestrictionEnabled } =
    useTopicRestrictionStatus(hasChatAccess);

  const modelsItems = useMemo(
    () =>
      models
        ? models
            .filter(model => model.model_type === 'llm')
            .map(m => ({
              label: m.provider_resource_id,
              value: m.provider_resource_id,
              provider: m.provider_id,
            }))
        : [],
    [models],
  );

  useLayoutEffect(() => {
    const htmlTagElement = document.documentElement;
    if (type === THEME_DARK) {
      htmlTagElement.classList.add(THEME_DARK_CLASS);
    } else {
      htmlTagElement.classList.remove(THEME_DARK_CLASS);
    }
  }, [type]);

  // Load last selected model from localStorage
  useEffect(() => {
    if (!hasChatAccess || modelsItems.length === 0) {
      return;
    }

    try {
      const storedData = localStorage.getItem(LAST_SELECTED_MODEL_KEY);
      const parsedData = storedData ? JSON.parse(storedData) : null;

      const storedModel = parsedData?.model
        ? modelsItems.find(m => m.value === parsedData.model)
        : null;

      if (storedModel) {
        setSelectedModel(storedModel.value);
        setSelectedProvider(storedModel.provider);
      } else {
        setSelectedModel(modelsItems[0].value);
        setSelectedProvider(modelsItems[0].provider);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        'Error loading last selected model from localStorage:',
        error,
      );
      setSelectedModel(modelsItems[0].value);
      setSelectedProvider(modelsItems[0].provider);
    }
  }, [hasChatAccess, modelsItems]);

  // Save selected model to localStorage
  useEffect(() => {
    if (selectedModel && selectedProvider) {
      try {
        localStorage.setItem(
          LAST_SELECTED_MODEL_KEY,
          JSON.stringify({
            model: selectedModel,
            provider: selectedProvider,
          }),
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(
          'Error saving last selected model to localStorage:',
          error,
        );
      }
    }
  }, [selectedModel, selectedProvider]);

  if (permissionsLoading) {
    // Never return null inside the overlay modal: PatternFly's focus-trap requires at least
    // one tabbable node (e.g. after removing the modal close button). Locale switches can
    // briefly re-enter this loading state.
    return <LightspeedChatModelsLoading />;
  }

  if (!hasPluginAccess) {
    return null;
  }

  if (hasChatAccess && modelsLoading) {
    return <LightspeedChatModelsLoading />;
  }

  // TanStack Query can keep the last successful `data` while `isError` is true after a
  // failed refetch. Prefer showing chat when we still have LLM rows; only use the full-page
  // error state when there is nothing usable to render.
  if (hasChatAccess && modelsError && modelsItems.length === 0) {
    return <ModelsLoadErrorEmptyState onRetry={() => refetchModels()} />;
  }

  if (hasChatAccess && modelsItems.length === 0) {
    return <LcoreNotConfiguredEmptyState />;
  }

  const resolvedSelectedModel = selectedModel || modelsItems[0]?.value || '';
  const resolvedSelectedProvider =
    selectedProvider || modelsItems[0]?.provider || '';

  return (
    <FileAttachmentContextProvider>
      <LightspeedChat
        selectedModel={resolvedSelectedModel}
        selectedProvider={resolvedSelectedProvider}
        topicRestrictionEnabled={topicRestrictionEnabled ?? false}
        handleSelectedModel={item => {
          setSelectedModel(item);
          setSelectedProvider(
            modelsItems.find((m: any) => m.value === item)?.provider || '',
          );
        }}
        models={modelsItems}
        userName={profile?.displayName}
        avatar={profile?.picture}
        profileLoading={profileLoading}
      />
    </FileAttachmentContextProvider>
  );
};

/**
 * @public
 */
export const LightspeedChatContainer = () => {
  return (
    <StylesProvider generateClassName={generateClassName}>
      <StylesProviderV4 generateClassName={generateClassNameV4}>
        <QueryClientProvider client={queryClient}>
          <LightspeedChatContainerInner />
        </QueryClientProvider>
      </StylesProviderV4>
    </StylesProvider>
  );
};
