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
import React from 'react';

import { Page, Content, Header } from '@backstage/core-components';
import { createDevApp } from '@backstage/dev-utils';

import Grid from '@mui/material/Grid';

import {
  applicationProviderTestPlugin,
  TestPage,
  TestProviderOne,
  TestProviderTwo,
  TestCardOne,
  TestCardTwo,
} from '../src/plugin';

createDevApp()
  .registerPlugin(applicationProviderTestPlugin)
  .addPage({
    element: (
      <TestProviderOne>
        <TestProviderTwo>
          <TestPage />
        </TestProviderTwo>
      </TestProviderOne>
    ),
    title: 'TestPage',
    path: '/test-page',
  })
  .addPage({
    element: (
      <TestProviderOne>
        <TestProviderTwo>
          <Page themeId="test">
            <Header title="Test cards" />
            <Content>
              <Grid container spacing={2}>
                <Grid item sm={6}>
                  <TestCardOne />
                </Grid>
                <Grid item sm={6}>
                  <TestCardOne />
                </Grid>
                <Grid item sm={6}>
                  <TestCardTwo />
                </Grid>
                <Grid item sm={6}>
                  <TestCardTwo />
                </Grid>
              </Grid>
            </Content>
          </Page>
        </TestProviderTwo>
      </TestProviderOne>
    ),
    title: 'TestCards',
    path: '/test-cards',
  })
  .render();
