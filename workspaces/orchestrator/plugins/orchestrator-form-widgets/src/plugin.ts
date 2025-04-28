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
import {
  configApiRef,
  createApiFactory,
  createPlugin,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { orchestratorFormApiRef } from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';
import { FormWidgetsApi } from './FormWidgetsApi';

export const formApiFactory = createApiFactory({
  api: orchestratorFormApiRef,
  deps: { configApi: configApiRef, fetchApi: fetchApiRef },
  factory(_options) {
    return new FormWidgetsApi();
  },
});

export const orchestratorFormWidgetsPlugin = createPlugin({
  id: 'orchestrator-form-widgets',
  routes: {},
  apis: [formApiFactory],
});
