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

import '@backstage/cli/asset-types';

import ReactDOM from 'react-dom/client';

import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import searchPlugin from '@backstage/plugin-search/alpha';
import userSettingsPlugin from '@backstage/plugin-user-settings/alpha';

import orchestratorFormWidgetsPlugin from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-widgets/alpha';

import orchestratorPlugin, {
  orchestratorTranslationsModule,
} from '../src/alpha';
import { devNavModule } from './nav';

const App = createApp({
  features: [
    orchestratorTranslationsModule,
    devNavModule,
    searchPlugin,
    catalogPlugin,
    orchestratorPlugin,
    userSettingsPlugin,
    orchestratorFormWidgetsPlugin,
  ],
});

ReactDOM.createRoot(document.getElementById('root')!).render(App.createRoot());
