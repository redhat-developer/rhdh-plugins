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
import { createDevApp } from '@backstage/dev-utils';

import { Page, Header, TabbedLayout } from '@backstage/core-components/index';

import { analyticsModuleTestUtilsPlugin } from '../src/plugin';

createDevApp()
  .registerPlugin(analyticsModuleTestUtilsPlugin)
  .addPage({
    element: (
      <Page themeId="home">
        <Header title="Test page" />
        <TabbedLayout>
          <TabbedLayout.Route path="/one" title="First tab">
            <p>First tab content</p>
          </TabbedLayout.Route>
          <TabbedLayout.Route path="/two" title="Second tab">
            <p>Second tab content</p>
          </TabbedLayout.Route>
          <TabbedLayout.Route path="/three" title="Third tab">
            <p>Third tab content</p>
          </TabbedLayout.Route>
        </TabbedLayout>
      </Page>
    ),
    title: 'Test Page',
    path: '/test-page',
  })
  .render();
