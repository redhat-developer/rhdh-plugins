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

/**
 * New Frontend System plugin standalone (yarn start / yarn start:fe-plugin).
 * Legacy createDevApp: yarn start:legacy
 */

import '@backstage/cli/asset-types';

import ReactDOM from 'react-dom/client';
import { createApp } from '@backstage/frontend-defaults';

import costManagementPlugin from '../src/alpha';

const DEFAULT_PATH = '/cost-management/optimizations';

const app = createApp({
  features: [costManagementPlugin],
});

if (typeof window !== 'undefined' && window.location.pathname === '/') {
  window.location.pathname = DEFAULT_PATH;
}

ReactDOM.createRoot(document.getElementById('root')!).render(app.createRoot());
