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

import type { Entity } from '@backstage/catalog-model';
import { EntityCardBlueprint } from '@backstage/plugin-catalog-react/alpha';
import { isAiAsset } from '@red-hat-developer-hub/backstage-plugin-boost-common';

import { getSpecField } from '../utils/entityFields';

const isAgentAsset = (entity: Entity) =>
  isAiAsset(entity) && getSpecField(entity, 'type')?.toLowerCase() === 'agent';

export const assetDetailsCard = EntityCardBlueprint.make({
  name: 'ai-asset-details',
  params: {
    filter: isAiAsset,
    loader: () =>
      import('../components/catalog/entity/AssetDetails/AssetDetailsCard').then(
        m => <m.AssetDetailsCard />,
      ),
  },
});

export const agentInstructionsCard = EntityCardBlueprint.make({
  name: 'agent-instructions',
  params: {
    filter: isAgentAsset,
    loader: () =>
      import('../components/catalog/entity/AgentInstructionsCard').then(m => (
        <m.AgentInstructionsCard />
      )),
  },
});

export const usageCard = EntityCardBlueprint.make({
  name: 'usage',
  params: {
    filter: isAiAsset,
    loader: () =>
      import('../components/catalog/entity/UsageCard').then(m => (
        <m.UsageCard />
      )),
  },
});

export const entityCardExtensions = [
  assetDetailsCard,
  agentInstructionsCard,
  usageCard,
];
