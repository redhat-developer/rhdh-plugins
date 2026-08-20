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

import { createExtensionBlueprint } from '@backstage/frontend-plugin-api';

import { templateCardBadgeDataRef } from './templateCardBadgeDataRef';
import type { TemplateCardBadgeData } from '../types';

/**
 * Blueprint for plugins to contribute badges to the scaffolder template card.
 *
 * The `component` receives `{ template }` as a prop and renders inline
 * in the card body between the description and the tags/links section.
 * Multiple plugins can contribute badges — they all render together.
 *
 * @example
 * ```
 * const timeSavedBadge = TemplateCardBadgeBlueprint.make({
 *   name: 'time-saved',
 *   params: {
 *     component: ({ template }) => (
 *       <Chip label={`Saves ${template.metadata.annotations?.['time-saved']} min`} />
 *     ),
 *   },
 * });
 * ```
 *
 * @alpha
 */
export const TemplateCardBadgeBlueprint = createExtensionBlueprint({
  kind: 'template-card-badge',
  attachTo: {
    id: 'component:app/scaffolder-template-card',
    input: 'badges',
  },
  output: [templateCardBadgeDataRef],
  dataRefs: {
    badge: templateCardBadgeDataRef,
  },
  *factory(params: TemplateCardBadgeData) {
    yield templateCardBadgeDataRef({
      component: params.component,
      priority: params.priority,
    });
  },
});
