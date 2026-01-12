/*
 * Copyright The Backstage Authors
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
  createPermissionResourceRef,
  createPermissionRule,
} from '@backstage/plugin-permission-node';
import { z } from 'zod';
import {
  ExtensionsPlugin,
  RESOURCE_TYPE_EXTENSIONS_PLUGIN,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';

export type ExtentionFilter = {
  key: string;
  values: Array<string> | undefined;
};

export type ExtentionFilters =
  | { anyOf: ExtentionFilters[] }
  | { allOf: ExtentionFilters[] }
  | { not: ExtentionFilters }
  | ExtentionFilter;

export const extensionsPermissionResourceRef = createPermissionResourceRef<
  ExtensionsPlugin,
  ExtentionFilter
>().with({
  pluginId: 'extensions',
  resourceType: RESOURCE_TYPE_EXTENSIONS_PLUGIN,
});

export type ExtensionParams = {
  annotation: string;
  value?: string;
  pluginNames?: string[];
};

const hasPluginName = createPermissionRule({
  name: 'HAS_NAME',
  description: 'Should allow users to install the plugin with specified name',
  resourceRef: extensionsPermissionResourceRef,

  paramsSchema: z.object({
    pluginNames: z
      .string()
      .array()
      .optional()
      .describe('List of plugin names or titles to match on'),
  }),
  apply: (plugin: ExtensionsPlugin, { pluginNames }) => {
    return pluginNames && pluginNames.length > 0
      ? pluginNames?.some(
          name =>
            name.toLowerCase() === plugin.metadata.title?.toLowerCase() ||
            name.toLowerCase() === plugin.metadata.name.toLowerCase(),
        )
      : true;
  },
  toQuery: ({ pluginNames }) => ({ key: 'name', values: pluginNames }),
});

const hasAnnotation = createPermissionRule({
  name: 'HAS_ANNOTATION',
  description:
    'Should allow users to install the plugin with specified annotation',
  resourceRef: extensionsPermissionResourceRef,
  paramsSchema: z.object({
    annotation: z.string().describe('Name of the annotation to match on'),
    value: z
      .string()
      .optional()
      .describe('Value of the annotation to match on'),
  }),
  apply: (plugin: ExtensionsPlugin, params: ExtensionParams) =>
    !!plugin.metadata.annotations?.hasOwnProperty(params.annotation) &&
    (params.value === undefined
      ? true
      : plugin.metadata.annotations?.[params.annotation] === params.value),
  toQuery: ({ annotation, value }) => ({
    key: annotation,
    values: value ? [value] : undefined,
  }),
});

export const rules = { hasPluginName, hasAnnotation };
