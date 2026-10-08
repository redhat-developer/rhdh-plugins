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

import { createExtensionTester } from '@backstage/frontend-test-utils';

import {
  AiCatalogFilterBlueprint,
  filterDefinitionDataRef,
} from './AiCatalogFilterBlueprint';

const baseParams = {
  urlParam: 'custom',
  label: 'Custom',
  getOptions: jest.fn(() => [{ id: 'a', label: 'A' }]),
  matchEntity: jest.fn(() => true),
};

describe('AiCatalogFilterBlueprint', () => {
  it('yields FilterDefinition with all provided fields', () => {
    const extension = AiCatalogFilterBlueprint.make({
      name: 'test',
      params: {
        ...baseParams,
        labelKey: 'catalog.filter.custom',
        priority: 200,
      },
    });

    const tester = createExtensionTester(extension);
    const def = tester.get(filterDefinitionDataRef);

    expect(def.urlParam).toBe('custom');
    expect(def.label).toBe('Custom');
    expect(def.labelKey).toBe('catalog.filter.custom');
    expect(def.getOptions).toBe(baseParams.getOptions);
    expect(def.matchEntity).toBe(baseParams.matchEntity);
    expect(def.priority).toBe(200);
  });

  it('defaults priority to 100 when omitted', () => {
    const extension = AiCatalogFilterBlueprint.make({
      name: 'test',
      params: baseParams,
    });

    const tester = createExtensionTester(extension);
    const def = tester.get(filterDefinitionDataRef);

    expect(def.priority).toBe(100);
  });

  it.each(['q', 'view', 'page', 'pageSize'])(
    'throws for reserved urlParam "%s"',
    reserved => {
      const extension = AiCatalogFilterBlueprint.make({
        name: 'bad',
        params: { ...baseParams, urlParam: reserved },
      });

      expect(() =>
        createExtensionTester(extension).get(filterDefinitionDataRef),
      ).toThrow(`urlParam '${reserved}' is reserved`);
    },
  );

  it('does not throw for non-reserved urlParam', () => {
    const extension = AiCatalogFilterBlueprint.make({
      name: 'ok',
      params: { ...baseParams, urlParam: 'lifecycle' },
    });

    expect(() => createExtensionTester(extension)).not.toThrow();
  });
});

describe('filterDefinitionDataRef', () => {
  it('has the correct id', () => {
    expect(filterDefinitionDataRef.id).toBe('ai-catalog-filter.definition');
  });
});
