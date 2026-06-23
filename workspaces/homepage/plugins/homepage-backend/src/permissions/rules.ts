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

import { createPermissionRule } from '@backstage/plugin-permission-node';
import { z } from 'zod/v3';
import { DefaultWidgetNode } from '@red-hat-developer-hub/backstage-plugin-homepage-common';

import { homepageDefaultWidgetPermissionResourceRef } from './resource';

export type HomepageDefaultWidgetFilter = {
  key: string;
  values: Array<string> | undefined;
};

const hasWidgetId = createPermissionRule({
  name: 'HAS_WIDGET_ID',
  description:
    'Should allow users to access homepage widgets with specified widget IDs',
  resourceRef: homepageDefaultWidgetPermissionResourceRef,
  paramsSchema: z.object({
    widgetIds: z
      .string()
      .array()
      .optional()
      .describe('List of widget IDs to match on'),
  }),
  apply: (defaultWidget: DefaultWidgetNode, { widgetIds }) => {
    if (!widgetIds || widgetIds.length === 0 || !defaultWidget.id) return false;
    return widgetIds.includes(defaultWidget.id);
  },
  toQuery: ({ widgetIds }) => {
    return {
      key: 'widgetId',
      values: widgetIds,
    };
  },
});

const hasTag = createPermissionRule({
  name: 'HAS_TAG',
  description:
    'Should allow users to access homepage widgets with specified tags',
  resourceRef: homepageDefaultWidgetPermissionResourceRef,
  paramsSchema: z.object({
    tags: z.string().array().optional().describe('List of tags to match on'),
  }),
  apply: (defaultWidget: DefaultWidgetNode, { tags }) => {
    if (!tags || tags.length === 0) return true;
    if (!defaultWidget.tags || defaultWidget.tags.length === 0) return false;
    return tags.some(tag => defaultWidget.tags!.includes(tag));
  },
  toQuery: ({ tags }) => ({
    key: 'tag',
    values: tags,
  }),
});

export const rules = { hasWidgetId, hasTag };
