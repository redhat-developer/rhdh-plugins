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
  ExtensionsKind,
  ExtensionsPlugin,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';

import { rules } from './rules';

type HasPluginNameParams = { pluginNames?: string[] };
type HasAnnotationParams = { annotation: string; value?: string };
type QueryFilter = { key: string; values: string[] | undefined };

// createPermissionRule is asserted in rules.ts, which collapses params to undefined.
const applyHasName = rules.hasPluginName.apply as unknown as (
  resource: ExtensionsPlugin,
  params: HasPluginNameParams,
) => boolean;
const toQueryHasName = rules.hasPluginName.toQuery as unknown as (
  params: HasPluginNameParams,
) => QueryFilter;
const applyHasAnnotation = rules.hasAnnotation.apply as unknown as (
  resource: ExtensionsPlugin,
  params: HasAnnotationParams,
) => boolean;
const toQueryHasAnnotation = rules.hasAnnotation.toQuery as unknown as (
  params: HasAnnotationParams,
) => QueryFilter;

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

describe('rules.hasPluginName', () => {
  it('has permission rule name HAS_NAME', () => {
    expect(rules.hasPluginName.name).toEqual('HAS_NAME');
  });

  it.each([
    {
      description: 'matches metadata.name',
      pluginNames: ['tekton'],
      expected: true,
    },
    {
      description: 'matches metadata.title case-insensitively',
      pluginNames: ['PIPELINES WITH TEKTON'],
      expected: true,
    },
    {
      description: 'returns true when pluginNames is empty',
      pluginNames: [] as string[],
      expected: true,
    },
    {
      description: 'returns true when pluginNames is absent',
      pluginNames: undefined,
      expected: true,
    },
    {
      description: 'does not match a different name',
      pluginNames: ['other-plugin'],
      expected: false,
    },
  ])('$description', ({ pluginNames, expected }) => {
    expect(applyHasName(plugin, { pluginNames })).toBe(expected);
  });

  it('toQuery maps pluginNames onto the name key', () => {
    expect(toQueryHasName({ pluginNames: ['tekton'] })).toEqual({
      key: 'name',
      values: ['tekton'],
    });
  });
});

describe('rules.hasAnnotation', () => {
  it('has permission rule name HAS_ANNOTATION', () => {
    expect(rules.hasAnnotation.name).toEqual('HAS_ANNOTATION');
  });

  it.each([
    {
      description:
        'matches when the annotation key is present and value is omitted',
      params: { annotation: CERTIFIED_ANNOTATION },
      expected: true,
    },
    {
      description: 'matches when the annotation value matches',
      params: { annotation: CERTIFIED_ANNOTATION, value: 'true' },
      expected: true,
    },
    {
      description: 'does not match a different annotation value',
      params: { annotation: CERTIFIED_ANNOTATION, value: 'false' },
      expected: false,
    },
    {
      description: 'does not match a missing annotation key',
      params: { annotation: 'extensions.backstage.io/missing' },
      expected: false,
    },
  ])('$description', ({ params, expected }) => {
    expect(applyHasAnnotation(plugin, params)).toBe(expected);
  });

  it('toQuery includes the value when provided', () => {
    expect(
      toQueryHasAnnotation({
        annotation: CERTIFIED_ANNOTATION,
        value: 'true',
      }),
    ).toEqual({
      key: CERTIFIED_ANNOTATION,
      values: ['true'],
    });
  });

  it('toQuery omits values when the annotation value is absent', () => {
    expect(toQueryHasAnnotation({ annotation: CERTIFIED_ANNOTATION })).toEqual({
      key: CERTIFIED_ANNOTATION,
      values: undefined,
    });
  });
});
