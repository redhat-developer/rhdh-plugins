/*
 * Copyright 2024 The Backstage Authors
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
import React from 'react';
import { useAsync } from 'react-use';

import { Content, Page } from '@backstage/core-components';
import { identityApiRef, useApi } from '@backstage/core-plugin-api';

import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import { Alert, AlertTitle } from '@material-ui/lab';
import { QueryClientProvider } from '@tanstack/react-query';

import { useAllModels } from '../hooks/useAllModels';
import { useLightspeedViewPermission } from '../hooks/useLightspeedViewPermission';
import queryClient from '../utils/queryClient';
import { LightspeedChat } from './LightSpeedChat';

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
  const {
    palette: { type },
  } = useTheme();

  const identityApi = useApi(identityApiRef);

  const { data: models } = useAllModels();
  const { allowed: hasViewAccess, loading } = useLightspeedViewPermission();

  const { value: profile, loading: profileLoading } = useAsync(
    async () => await identityApi.getProfileInfo(),
  );

  const [selectedModel, setSelectedModel] = React.useState('');

  const modelsItems = React.useMemo(
    () => (models ? models.map(m => ({ label: m.id, value: m.id })) : []),
    [models],
  );

  React.useEffect(() => {
    const htmlTagElement = document.documentElement;
    if (type === THEME_DARK) {
      htmlTagElement.classList.add(THEME_DARK_CLASS);
    } else {
      htmlTagElement.classList.remove(THEME_DARK_CLASS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  React.useEffect(() => {
    if (modelsItems.length > 0) setSelectedModel(modelsItems[0].value);
  }, [modelsItems]);

  if (loading) {
    return null;
  }
  return (
    <Page themeId="tool">
      <Content className={classes.container}>
        {!hasViewAccess ? (
          <Alert severity="warning" data-testid="no-permission-alert">
            <AlertTitle>Permission required</AlertTitle>
            To view lightspeed plugin, contact your administrator to give you
            the `lightspeed.conversations.read` and
            `lightspeed.conversations.create` permission.
          </Alert>
        ) : (
          <LightspeedChat
            selectedModel={selectedModel}
            handleSelectedModel={item => {
              setSelectedModel(item);
            }}
            models={modelsItems}
            userName={profile?.displayName}
            avatar={profile?.picture}
            profileLoading={profileLoading}
          />
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
