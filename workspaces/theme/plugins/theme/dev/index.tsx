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

import { Header, Page, Content, InfoCard } from '@backstage/core-components';
import { UserSettingsThemeToggle } from '@backstage/plugin-user-settings';

import { createDevApp } from '@backstage/dev-utils';

import Grid from '@mui/material/Grid';

import { getAllThemes } from '../src';

createDevApp()
  .addThemes(getAllThemes())
  .addPage({
    element: (
      <Page themeId="tool">
        <Header title="Theme Test Page">
          <UserSettingsThemeToggle />
        </Header>
        <Content>
          <Grid container>
            <Grid item sm={3}>
              <InfoCard title="InfoCard" />
            </Grid>
            <Grid item sm={3}>
              <InfoCard title="InfoCard" />
            </Grid>
            <Grid item sm={3}>
              <InfoCard title="InfoCard" />
            </Grid>
            <Grid item sm={3}>
              <InfoCard title="InfoCard" />
            </Grid>
          </Grid>
        </Content>
      </Page>
    ),
    title: 'Test page',
    path: '/',
  })
  .render();
