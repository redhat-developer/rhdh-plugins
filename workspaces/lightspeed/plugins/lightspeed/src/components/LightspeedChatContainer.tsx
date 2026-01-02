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

import { useEffect, useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import { identityApiRef, useApi } from '@backstage/core-plugin-api';

import { useTheme } from '@material-ui/core/styles';
import { QueryClientProvider } from '@tanstack/react-query';

import { useAllModels } from '../hooks/useAllModels';
import { useLightspeedViewPermission } from '../hooks/useLightspeedViewPermission';
import { useTopicRestrictionStatus } from '../hooks/useQuestionValidation';
import queryClient from '../utils/queryClient';
import FileAttachmentContextProvider from './AttachmentContext';
import { LightspeedChat } from './LightSpeedChat';
import PermissionRequiredState from './PermissionRequiredState';

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

  const { data: models } = useAllModels();

  const { allowed: hasViewAccess, loading } = useLightspeedViewPermission();

  const { value: profile, loading: profileLoading } = useAsync(
    async () => await identityApi.getProfileInfo(),
  );

  const [selectedModel, setSelectedModel] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');

  const { data: topicRestrictionEnabled } = useTopicRestrictionStatus();

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

  // Handle dark theme class on document
  useEffect(() => {
    const htmlTagElement = document.documentElement;
    if (type === THEME_DARK) {
      htmlTagElement.classList.add(THEME_DARK_CLASS);
    } else {
      htmlTagElement.classList.remove(THEME_DARK_CLASS);
    }
  }, [type]);

  // Load last selected model from localStorage
  useEffect(() => {
    if (modelsItems.length > 0) {
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
    }
  }, [modelsItems]);

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

  if (loading) {
    return null;
  }

  if (!hasViewAccess) {
    return <PermissionRequiredState />;
  }

  return (
    <FileAttachmentContextProvider>
      <LightspeedChat
        selectedModel={selectedModel}
        selectedProvider={selectedProvider}
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
    <QueryClientProvider client={queryClient}>
      <LightspeedChatContainerInner />
    </QueryClientProvider>
  );
};
