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

import type {
  KagentiAgentCard,
  KagentiAgentSummary,
  KagentiMigratableAgent,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';

export function makeKagentiAgentSummary(
  overrides: Partial<KagentiAgentSummary> = {},
): KagentiAgentSummary {
  return {
    name: 'alpha-agent',
    namespace: 'team-a',
    description: 'First agent description',
    status: 'ready',
    labels: {},
    ...overrides,
  };
}

export function makeKagentiAgentCard(
  overrides: Partial<KagentiAgentCard> = {},
): KagentiAgentCard {
  return {
    name: 'Card Name',
    version: '1.0.0',
    url: 'https://agent.example/ws',
    streaming: true,
    skills: [],
    ...overrides,
  };
}

export function makeMigratableAgent(
  overrides: Partial<KagentiMigratableAgent> = {},
): KagentiMigratableAgent {
  return {
    name: 'legacy-agent',
    namespace: 'team-a',
    status: 'Ready',
    has_deployment: false,
    labels: {},
    ...overrides,
  };
}
