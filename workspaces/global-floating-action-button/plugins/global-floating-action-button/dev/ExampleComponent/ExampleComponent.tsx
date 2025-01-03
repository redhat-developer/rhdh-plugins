/*
 * Copyright 2025 The Backstage Authors
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
import AddIcon from '@mui/icons-material/Add';
import GitIcon from '@mui/icons-material/GitHub';
import MenuIcon from '@mui/icons-material/Menu';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

import {
  InfoCard,
  Header,
  Page,
  Content,
  ContentHeader,
  HeaderLabel,
  SupportButton,
} from '@backstage/core-components';
import { ExampleFetchComponent } from './ExampleFetchComponent';
import { GlobalFloatingActionButton } from '../../src/components/GlobalFloatingActionButton';

export const ExampleComponent = () => (
  <Page themeId="tool">
    <Header
      title="Welcome to global-floating-action-button!"
      subtitle="Optional subtitle"
    >
      <HeaderLabel label="Owner" value="Team X" />
      <HeaderLabel label="Lifecycle" value="Alpha" />
    </Header>
    <Content>
      <ContentHeader title="Plugin title">
        <SupportButton>A description of your plugin goes here.</SupportButton>
      </ContentHeader>
      <Grid container spacing={3} direction="column">
        <Grid item>
          <InfoCard title="Information card">
            <Typography variant="body1">
              All content should be wrapped in a card like this.
            </Typography>
          </InfoCard>
        </Grid>
        <Grid item>
          <ExampleFetchComponent />
        </Grid>
      </Grid>
      <GlobalFloatingActionButton
        floatingButtons={[
          {
            color: 'success',
            icon: <GitIcon />,
            label: 'Git repo',
            showLabel: true,
            to: 'https://github.com/xyz',
            toolTip: 'Git',
          },

          {
            color: 'info',
            label: 'Quay',
            to: 'https://quay.io',
            toolTip: 'Quay',
            icon: '<svg viewBox="0 0 250 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><path d="M200.134 0l55.555 117.514-55.555 117.518h-47.295l55.555-117.518L152.84 0h47.295zM110.08 99.836l20.056-38.092-2.29-8.868L102.847 0H55.552l48.647 102.898 5.881-3.062zm17.766 74.433l-17.333-39.034-6.314-3.101-48.647 102.898h47.295l25-52.88v-7.883z" fill="#40B4E5"/><path d="M152.842 235.032L97.287 117.514 152.842 0h47.295l-55.555 117.514 55.555 117.518h-47.295zm-97.287 0L0 117.514 55.555 0h47.296L47.295 117.514l55.556 117.518H55.555z" fill="#003764"/></svg>',
          },
          {
            color: 'success',
            icon: <AddIcon />,
            label: 'Add',
            toolTip: 'Add',
            to: '/test-global-floating-action',
            position: 'BOTTOM_CENTER',
            priority: 100,
          },
          {
            color: 'success',
            label: 'Menu',
            toolTip: 'Menu',
            to: 'https://github.com/xyz',
            position: 'BOTTOM_CENTER',
            priority: 200,
            visibleOnPaths: ['/test-global-floating-action'],
          },
          {
            color: 'success',
            icon: <MenuIcon />,
            label: 'Menu',
            toolTip: 'Menu',
            to: 'https://github.com/xyz',
            priority: 200,
            excludeOnPaths: ['/test-global-floating-action'],
          },
        ]}
      />
    </Content>
  </Page>
);
