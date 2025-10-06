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

import { Content, Header, Page } from '@backstage/core-components';
import { identityApiRef, useApi } from '@backstage/core-plugin-api';

import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import { QueryClientProvider } from '@tanstack/react-query';

import { useAllModels } from '../hooks/useAllModels';
import { useLightspeedViewPermission } from '../hooks/useLightspeedViewPermission';
import { useTopicRestrictionStatus } from '../hooks/useQuestionValidation';
import { useTranslation } from '../hooks/useTranslation';
import queryClient from '../utils/queryClient';
import FileAttachmentContextProvider from './AttachmentContext';
import { LightspeedChat } from './LightSpeedChat';
import PermissionRequiredState from './PermissionRequiredState';

const useStyles = makeStyles(() =>
  createStyles({
    container: {
      padding: '0px',
    },
  }),
);

const THEME_DARK = 'dark';
const THEME_DARK_CLASS = 'pf-v6-theme-dark';

const LightspeedPageInner = () => {
  const classes = useStyles();
  const { t } = useTranslation();
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

  const {
    data: topicRestrictionEnabled,
    isLoading: questionValidationLoading,
  } = useTopicRestrictionStatus();

  const modelsItems = useMemo(
    () =>
      models
        ? models.map(m => ({
            label: m.provider_resource_id,
            value: m.provider_resource_id,
            provider: m.provider_id,
          }))
        : [],
    [models],
  );

  useEffect(() => {
    const htmlTagElement = document.documentElement;
    if (type === THEME_DARK) {
      htmlTagElement.classList.add(THEME_DARK_CLASS);
    } else {
      htmlTagElement.classList.remove(THEME_DARK_CLASS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  useEffect(() => {
    if (modelsItems.length > 0) {
      setSelectedModel(modelsItems[0].value);
      setSelectedProvider(modelsItems[0].provider);
    }
  }, [modelsItems]);

  if (loading || questionValidationLoading) {
    return null;
  }

  return (
    <Page themeId="tool">
      <Header
        title={t('page.title')}
        style={{ display: 'none' }}
        pageTitleOverride={t('page.title')}
      />
      <Content className={classes.container}>
        {!hasViewAccess ? (
          <PermissionRequiredState />
        ) : (
          <FileAttachmentContextProvider>
            <LightspeedChat
              selectedModel={selectedModel}
              selectedProvider={selectedProvider}
              topicRestrictionEnabled={topicRestrictionEnabled ?? false}
              handleSelectedModel={item => {
                setSelectedModel(item);
                setSelectedProvider(
                  modelsItems.find((m: any) => m.value === item)?.provider ||
                    '',
                );
              }}
              models={modelsItems}
              userName={profile?.displayName}
              avatar={profile?.picture}
              profileLoading={profileLoading}
            />
          </FileAttachmentContextProvider>
        )}
      </Content>
    </Page>
  );
};

export const LightspeedPage = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LightspeedPageInner />
    </QueryClientProvider>
  );
};
