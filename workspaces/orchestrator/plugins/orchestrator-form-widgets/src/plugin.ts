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
import { createApiFactory, createPlugin } from '@backstage/core-plugin-api';
import { orchestratorFormApiRef } from '@redhat/backstage-plugin-orchestrator-form-api';
import { FormWidgetsApi } from './FormWidgetsApi';

/**
 * @public
 * Form API factory for the orchestratorFormWidgetsPlugin.
 */
export const orchestratorFormApiFactory = createApiFactory({
  api: orchestratorFormApiRef,
  deps: {},
  factory() {
    return new FormWidgetsApi();
  },
});

/**
 * @public
 * Orchestrator Frontend Plugin providing decorator with default RJSF widgets for the Workflow Execution page.
 */
export const orchestratorFormWidgetsPlugin = createPlugin({
  id: 'orchestrator-form-widgets',
  routes: {},
  apis: [orchestratorFormApiFactory],
});
