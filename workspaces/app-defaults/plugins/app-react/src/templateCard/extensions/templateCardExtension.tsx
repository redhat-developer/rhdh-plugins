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
  createExtension,
  createExtensionInput,
  createFrontendModule,
} from '@backstage/frontend-plugin-api';
import { SwappableComponentBlueprint } from '@backstage/plugin-app-react';
import { TemplateCard as TemplateCardRef } from '@backstage/plugin-scaffolder-react/alpha';

import { templateCardActionDataRef } from './templateCardActionDataRef';
import { templateCardBadgeDataRef } from './templateCardBadgeDataRef';

/**
 * Extension that replaces the default scaffolder TemplateCard and accepts
 * contributions from other plugins:
 * - `action` input: custom action button replacement (via {@link TemplateCardActionBlueprint})
 * - `badges` input: badge components rendered in the card body (via {@link TemplateCardBadgeBlueprint})
 *
 * @public
 */
export const templateCardExtension = createExtension({
  kind: 'component',
  name: 'scaffolder-template-card',
  attachTo: { id: 'api:app/swappable-components', input: 'components' },
  inputs: {
    action: createExtensionInput([templateCardActionDataRef]),
    badges: createExtensionInput([templateCardBadgeDataRef]),
  },
  output: [SwappableComponentBlueprint.dataRefs.component],
  factory({ inputs }) {
    const actionOverride =
      inputs.action.length > 0
        ? inputs.action[0].get(templateCardActionDataRef).component
        : undefined;
    const badges = inputs.badges.map(b => b.get(templateCardBadgeDataRef));
    return [
      SwappableComponentBlueprint.dataRefs.component({
        ref: TemplateCardRef.ref,
        loader: async () => {
          const { TemplateCard } = await import('../components/TemplateCard');
          return ((props: Record<string, unknown>) => (
            <TemplateCard
              {...(props as any)}
              actionOverride={actionOverride}
              badges={badges}
            />
          )) as (props: {}) => JSX.Element | null;
        },
      }),
    ];
  },
});

/**
 * Frontend module that provides the extensible scaffolder template card.
 *
 * @public
 */
export const templateCardModule = createFrontendModule({
  pluginId: 'app',
  extensions: [templateCardExtension],
});
