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

import { createFrontendModule } from '@backstage/frontend-plugin-api';

import { TemplateCardActionBlueprint } from '@red-hat-developer-hub/backstage-plugin-app-react/alpha';

import { OrchestratorTemplateCardChooseButton } from '../components/templateCard/OrchestratorTemplateCardChooseButton';

const orchestratorTemplateCardAction = TemplateCardActionBlueprint.make({
  name: 'orchestrator-choose',
  params: {
    component: OrchestratorTemplateCardChooseButton,
  },
});

/**
 * Registers orchestrator-specific Choose button behavior on scaffolder
 * template cards when app-defaults provides the extensible TemplateCard.
 *
 * @public
 */
export const orchestratorTemplateCardModule = createFrontendModule({
  pluginId: 'app',
  extensions: [orchestratorTemplateCardAction],
});
