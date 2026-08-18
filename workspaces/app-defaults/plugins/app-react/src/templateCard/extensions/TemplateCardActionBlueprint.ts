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

import { ComponentType } from 'react';
import { createExtensionBlueprint } from '@backstage/frontend-plugin-api';

import { templateCardActionDataRef } from './templateCardActionDataRef';
import type { TemplateCardActionProps } from '../types';

/**
 * Blueprint for plugins to customize the primary action on the scaffolder
 * template card.
 *
 * The `component` receives `{ template, onSelected, canCreateTask }` as props
 * and should render a button or similar control. Use this to add conditional
 * enable/disable logic, tooltips, or custom styling.
 *
 * @example
 * ```
 * const myAction = TemplateCardActionBlueprint.make({
 *   name: 'my-custom-action',
 *   params: {
 *     component: ({ template, onSelected, canCreateTask }) => (
 *       <Tooltip title={canCreateTask ? 'Create' : 'No permission'}>
 *         <span>
 *           <Button disabled={!canCreateTask} onClick={onSelected}>
 *             Choose
 *           </Button>
 *         </span>
 *       </Tooltip>
 *     ),
 *   },
 * });
 * ```
 *
 * @alpha
 */
export const TemplateCardActionBlueprint = createExtensionBlueprint({
  kind: 'template-card-action',
  attachTo: {
    id: 'component:app/scaffolder-template-card',
    input: 'action',
  },
  output: [templateCardActionDataRef],
  dataRefs: {
    action: templateCardActionDataRef,
  },
  *factory(params: { component: ComponentType<TemplateCardActionProps> }) {
    yield templateCardActionDataRef({
      component: params.component,
    });
  },
});
