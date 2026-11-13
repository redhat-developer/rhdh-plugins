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
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAsync } from 'react-use';

import { identityApiRef, useApi } from '@backstage/core-plugin-api';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { QueryClientProvider } from '@tanstack/react-query';

import { useAllModels } from '../hooks/useAllModels';
import { useIaChatPermission } from '../hooks/useIaChatPermission';
import { useIaNotebooksPermission } from '../hooks/useIaNotebooksPermission';
import { useTopicRestrictionStatus } from '../hooks/useQuestionValidation';
import {
  areChatPatternflyStylesLoaded,
  loadChatPatternflyStyles,
} from '../loadChatPatternflyStyles';
import queryClient from '../utils/queryClient';
import FileAttachmentContextProvider from './AttachmentContext';
import { ChatLoadingFallback } from './ChatLoadingFallback';
import { LightspeedChat } from './LightSpeedChat';
import {
  LcoreNotConfiguredEmptyState,
  LightspeedChatModelsLoading,
  ModelsLoadErrorEmptyState,
} from './LightspeedChatModelsState';

/** Fill LightspeedPage / drawer so loading states don't collapse the page well. */
const chatContainerRootSx = {
  display: 'flex',
  flexDirection: 'column' as const,
  flex: '1 1 auto',
  alignSelf: 'stretch',
  width: '100%',
  minWidth: 0,
  minHeight: '100%',
  height: '100%',
  // Ensure the chatbot child can flex-fill the page route.
  '& > *': {
    flex: '1 1 auto',
    minHeight: 0,
  },
};
const fillPageWell = (node: ReactNode) => (
  <Box sx={chatContainerRootSx}>{node}</Box>
);

const THEME_DARK = 'dark';
const THEME_DARK_CLASS = 'pf-v6-theme-dark';
const LAST_SELECTED_MODEL_KEY = 'lastSelectedModel';

/**
 * Inner component that contains all the Lightspeed chat rendering logic
 */
const LightspeedChatContainerInner = () => {
  const {
    palette: { mode },
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
              supportsVision: m.supportsVision,
            }))
        : [],
    [models],
  );

  useLayoutEffect(() => {
    const htmlTagElement = document.documentElement;
    if (mode === THEME_DARK) {
      htmlTagElement.classList.add(THEME_DARK_CLASS);
    } else {
      htmlTagElement.classList.remove(THEME_DARK_CLASS);
    }
  }, [mode]);

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
    return fillPageWell(<LightspeedChatModelsLoading />);
  }

  if (!hasPluginAccess) {
    return null;
  }

  if (hasChatAccess && modelsLoading) {
    return fillPageWell(<LightspeedChatModelsLoading />);
  }

  // TanStack Query can keep the last successful `data` while `isError` is true after a
  // failed refetch. Prefer showing chat when we still have LLM rows; only use the full-page
  // error state when there is nothing usable to render.
  if (hasChatAccess && modelsError && modelsItems.length === 0) {
    return fillPageWell(
      <ModelsLoadErrorEmptyState onRetry={() => refetchModels()} />,
    );
  }

  if (hasChatAccess && modelsItems.length === 0) {
    return fillPageWell(<LcoreNotConfiguredEmptyState />);
  }

  const resolvedSelectedModel = selectedModel || modelsItems[0]?.value || '';
  const resolvedSelectedProvider =
    selectedProvider || modelsItems[0]?.provider || '';

  return fillPageWell(
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
    </FileAttachmentContextProvider>,
  );
};

/**
 * @public
 */
export const LightspeedChatContainer = () => {
  // Overlay/docked already loaded PF CSS; start ready so remount into
  // fullscreen does not flash ChatLoadingFallback (RHDHBUGS-3925 follow-up).
  const [stylesReady, setStylesReady] = useState(areChatPatternflyStylesLoaded);

  useEffect(() => {
    if (stylesReady) {
      return undefined;
    }
    let cancelled = false;
    loadChatPatternflyStyles().then(() => {
      if (!cancelled) {
        setStylesReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [stylesReady]);

  if (!stylesReady) {
    return fillPageWell(<ChatLoadingFallback />);
  }

  return (
    <QueryClientProvider client={queryClient}>
      <LightspeedChatContainerInner />
    </QueryClientProvider>
  );
};
