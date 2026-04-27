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
  createPermissionRule,
  type PermissionRule,
} from '@backstage/plugin-permission-node';
import { z } from 'zod/v3';
import {
  VisibleDefaultWidget,
  RESOURCE_TYPE_HOMEPAGE_DEFAULT_WIDGET,
} from '@red-hat-developer-hub/backstage-plugin-homepage-common';
import { homepageDefaultWidgetPermissionResourceRef } from './resource';

export type HomepageDefaultWidgetFilter = {
  key: string;
  values: Array<string> | undefined;
};

type HasWidgetIdParams = { widgetIds?: string[] | undefined };

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
  apply: (widget: VisibleDefaultWidget, { widgetIds }: HasWidgetIdParams) => {
    return widgetIds && widgetIds.length > 0
      ? widgetIds.includes(widget.id)
      : true;
  },
  toQuery: ({ widgetIds }: HasWidgetIdParams) => ({
    key: 'widgetId',
    values: widgetIds,
  }),
} as any) as unknown as PermissionRule<
  VisibleDefaultWidget,
  HomepageDefaultWidgetFilter,
  typeof RESOURCE_TYPE_HOMEPAGE_DEFAULT_WIDGET,
  HasWidgetIdParams
>;

export const rules = { hasWidgetId };
