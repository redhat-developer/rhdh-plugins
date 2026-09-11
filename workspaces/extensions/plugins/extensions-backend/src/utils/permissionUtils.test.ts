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
  PermissionCondition,
  PermissionCriteria,
  PermissionRuleParams,
} from '@backstage/plugin-permission-common';
import {
  ExtensionsKind,
  ExtensionsPlugin,
  RESOURCE_TYPE_EXTENSIONS_PLUGIN,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';

import { matches } from './permissionUtils';

type Filters = PermissionCriteria<
  PermissionCondition<string, PermissionRuleParams>
>;

const CERTIFIED_ANNOTATION = 'extensions.backstage.io/certified';

const plugin: ExtensionsPlugin = {
  apiVersion: 'extensions.backstage.io/v1alpha1',
  kind: ExtensionsKind.Plugin,
  metadata: {
    name: 'tekton',
    title: 'Pipelines with Tekton',
    annotations: {
      [CERTIFIED_ANNOTATION]: 'true',
    },
  },
};

const condition = (
  rule: string,
  params?: PermissionRuleParams,
): PermissionCondition<string, PermissionRuleParams> => ({
  rule,
  resourceType: RESOURCE_TYPE_EXTENSIONS_PLUGIN,
  params,
});

const hasName = (pluginNames?: string[]) =>
  condition('HAS_NAME', { pluginNames });

const hasAnnotation = (annotation: string, value?: string) =>
  condition(
    'HAS_ANNOTATION',
    value === undefined ? { annotation } : { annotation, value },
  );

describe('matches', () => {
  it.each([
    {
      description: 'no filters',
      target: plugin,
      filters: undefined,
      expected: true,
    },
    {
      description: 'plugin undefined with a filter',
      target: undefined,
      filters: hasName(['tekton']),
      expected: false,
    },
    {
      description: 'HAS_NAME matching metadata.name',
      target: plugin,
      filters: hasName(['tekton']),
      expected: true,
    },
    {
      description: 'HAS_NAME matching metadata.title (case-insensitive)',
      target: plugin,
      filters: hasName(['pipelines with tekton']),
      expected: true,
    },
    {
      description: 'HAS_NAME with empty pluginNames',
      target: plugin,
      filters: hasName([]),
      expected: true,
    },
    {
      description: 'HAS_NAME with absent pluginNames',
      target: plugin,
      filters: hasName(undefined),
      expected: true,
    },
    {
      description: 'HAS_NAME mismatch',
      target: plugin,
      filters: hasName(['other-plugin']),
      expected: false,
    },
    {
      description: 'HAS_ANNOTATION key present without value',
      target: plugin,
      filters: hasAnnotation(CERTIFIED_ANNOTATION),
      expected: true,
    },
    {
      description: 'HAS_ANNOTATION key with matching value',
      target: plugin,
      filters: hasAnnotation(CERTIFIED_ANNOTATION, 'true'),
      expected: true,
    },
    {
      description: 'HAS_ANNOTATION wrong value',
      target: plugin,
      filters: hasAnnotation(CERTIFIED_ANNOTATION, 'false'),
      expected: false,
    },
    {
      description: 'HAS_ANNOTATION missing key',
      target: plugin,
      filters: hasAnnotation('extensions.backstage.io/missing'),
      expected: false,
    },
    {
      description: 'allOf both true',
      target: plugin,
      filters: {
        allOf: [hasName(['tekton']), hasAnnotation(CERTIFIED_ANNOTATION)],
      },
      expected: true,
    },
    {
      description: 'allOf one false',
      target: plugin,
      filters: {
        allOf: [hasName(['tekton']), hasName(['other-plugin'])],
      },
      expected: false,
    },
    {
      description: 'anyOf one true',
      target: plugin,
      filters: {
        anyOf: [hasName(['other-plugin']), hasName(['tekton'])],
      },
      expected: true,
    },
    {
      description: 'not inverts a matching rule',
      target: plugin,
      filters: { not: hasName(['tekton']) },
      expected: false,
    },
    {
      description: 'unknown rule name',
      target: plugin,
      filters: condition('UNKNOWN_RULE', { pluginNames: ['tekton'] }),
      expected: false,
    },
    {
      description: 'nested allOf / anyOf / not',
      target: plugin,
      filters: {
        allOf: [
          hasName(['tekton']),
          {
            anyOf: [
              hasAnnotation(CERTIFIED_ANNOTATION, 'false'),
              {
                not: hasAnnotation('extensions.backstage.io/missing'),
              },
            ],
          },
        ],
      },
      expected: true,
    },
  ])('$description', ({ target, filters, expected }) => {
    expect(matches(target, filters as Filters | undefined)).toBe(expected);
  });
});
