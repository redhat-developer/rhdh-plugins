/*
 * Copyright The Backstage Authors
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

import { getAllThemes } from '@red-hat-developer-hub/backstage-plugin-theme';

import {
  marketplacePlugin,
  MarketplaceRouter,
  MarketplaceTabbedPage,
} from '../src/plugin';

createDevApp()
  .registerPlugin(marketplacePlugin)
  .addThemes(getAllThemes())
  .addPage({
    element: <MarketplaceRouter />,
    title: 'MP Router',
    path: '/marketplace',
  })
  .addPage({
    element: <MarketplaceTabbedPage />,
    title: 'MP TabbedPage',
    path: '/marketplace-tabbed-page',
  })
  .render();
