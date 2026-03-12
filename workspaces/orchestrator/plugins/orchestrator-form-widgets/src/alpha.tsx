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
  ApiBlueprint,
  createApiFactory,
  createFrontendPlugin,
} from '@backstage/frontend-plugin-api';
import { orchestratorFormApiRef } from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';
import { FormWidgetsApi } from './FormWidgetsApi';

const orchestratorFormApi = ApiBlueprint.make({
  params: defineParams =>
    defineParams(
      createApiFactory({
        api: orchestratorFormApiRef,
        deps: {},
        factory: () => new FormWidgetsApi(),
      }),
    ),
});

/**
 *
 * @alpha
 * Orchestrator Form Widgets plugin for the new frontend system.
 * Provides default RJSF widgets (SchemaUpdater, ActiveTextInput, etc.) for the Workflow Execution form.
 *
 */
export default createFrontendPlugin({
  pluginId: 'orchestrator-form-widgets',
  extensions: [orchestratorFormApi],
});
