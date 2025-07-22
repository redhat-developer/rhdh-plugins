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

import { applySelectorArray } from './applySelector';
import { JsonObject } from '@backstage/types';

describe('applySelectorArray', () => {
  const sampleData: JsonObject = {
    stringValue: 'test',
    arrayValue: ['item1', 'item2', 'item3'],
    objectValue: {
      nestedArray: ['nested1', 'nested2'],
      nestedString: 'nestedValue',
    },
    mixedArray: ['string1', 123, 'string2'],
    emptyArray: [],
    nullValue: null,
    undefinedValue: undefined,
    booleanValue: true,
    numberValue: 42,
    warehouse: {
      drinks: [{ name: 'coffee' }, { name: 'tea' }, { name: 'juice' }],
    },
  };

  it('returns string array when selector evaluates to string array', async () => {
    const cases = [
      {
        selector: 'arrayValue',
        expected: ['item1', 'item2', 'item3'],
      },
      {
        selector: 'objectValue.nestedArray',
        expected: ['nested1', 'nested2'],
      },
      {
        selector: 'emptyArray',
        expected: [],
      },
    ];

    await Promise.all(
      cases.map(c =>
        expect(
          applySelectorArray(sampleData, c.selector),
        ).resolves.toStrictEqual(c.expected),
      ),
    );
  });

  it('returns single item array when createArrayIfNeeded is true and selector evaluates to string', async () => {
    const cases = [
      {
        selector: 'stringValue',
        expected: ['test'],
      },
      {
        selector: 'objectValue.nestedString',
        expected: ['nestedValue'],
      },
    ];

    await Promise.all(
      cases.map(c =>
        expect(
          applySelectorArray(sampleData, c.selector, true),
        ).resolves.toStrictEqual(c.expected),
      ),
    );
  });

  it('returns empty array when emptyArrayIfNeeded is true and selector evaluates to null/undefined', async () => {
    const cases = [
      {
        selector: 'nullValue',
        expected: [],
      },
      {
        selector: 'undefinedValue',
        expected: [],
      },
      {
        selector: 'nonExistentProperty',
        expected: [],
      },
    ];

    await Promise.all(
      cases.map(c =>
        expect(
          applySelectorArray(sampleData, c.selector, false, true),
        ).resolves.toStrictEqual(c.expected),
      ),
    );
  });

  it('handles complex JSONata selectors', async () => {
    const cases = [
      {
        selector: 'warehouse.drinks.name',
        expected: ['coffee', 'tea', 'juice'],
      },
      {
        selector: 'warehouse.drinks[name="coffee"].name',
        expected: ['coffee'],
        createArrayIfNeeded: true,
      },
      {
        selector: 'arrayValue[0]',
        expected: ['item1'],
        createArrayIfNeeded: true,
      },
    ];

    await Promise.all(
      cases.map(c =>
        expect(
          applySelectorArray(sampleData, c.selector, c.createArrayIfNeeded),
        ).resolves.toStrictEqual(c.expected),
      ),
    );
  });

  it('throws error when selector evaluates to non-string array without createArrayIfNeeded', async () => {
    const cases = [
      {
        selector: 'stringValue',
        throws:
          'Unexpected result of "stringValue" selector, expected string[] type. Value "test"',
      },
      {
        selector: 'numberValue',
        throws:
          'Unexpected result of "numberValue" selector, expected string[] type. Value 42',
      },
      {
        selector: 'booleanValue',
        throws:
          'Unexpected result of "booleanValue" selector, expected string[] type. Value true',
      },
      {
        selector: 'objectValue',
        throws:
          'Unexpected result of "objectValue" selector, expected string[] type. Value {"nestedArray":["nested1","nested2"],"nestedString":"nestedValue"}',
      },
    ];

    await Promise.all(
      cases.map(c =>
        expect(applySelectorArray(sampleData, c.selector)).rejects.toThrow(
          c.throws,
        ),
      ),
    );
  });

  it('throws error when selector evaluates to mixed array', async () => {
    const cases = [
      {
        selector: 'mixedArray',
        throws:
          'Unexpected result of "mixedArray" selector, expected string[] type. Value ["string1",123,"string2"]',
      },
    ];

    await Promise.all(
      cases.map(c =>
        expect(applySelectorArray(sampleData, c.selector)).rejects.toThrow(
          c.throws,
        ),
      ),
    );
  });

  it('throws error when selector evaluates to null/undefined without emptyArrayIfNeeded', async () => {
    const cases = [
      {
        selector: 'nullValue',
        throws:
          'Unexpected result of "nullValue" selector, expected string[] type. Value null',
      },
      {
        selector: 'undefinedValue',
        throws:
          'Unexpected result of "undefinedValue" selector, expected string[] type. Value undefined',
      },
      {
        selector: 'nonExistentProperty',
        throws:
          'Unexpected result of "nonExistentProperty" selector, expected string[] type. Value undefined',
      },
    ];

    await Promise.all(
      cases.map(c =>
        expect(applySelectorArray(sampleData, c.selector)).rejects.toThrow(
          c.throws,
        ),
      ),
    );
  });

  it('handles combination of createArrayIfNeeded and emptyArrayIfNeeded flags', async () => {
    // When both flags are true, emptyArrayIfNeeded takes precedence for null/undefined values
    await expect(
      applySelectorArray(sampleData, 'nullValue', true, true),
    ).resolves.toStrictEqual([]);

    await expect(
      applySelectorArray(sampleData, 'undefinedValue', true, true),
    ).resolves.toStrictEqual([]);

    // When createArrayIfNeeded is true and emptyArrayIfNeeded is false, string values are converted to arrays
    await expect(
      applySelectorArray(sampleData, 'stringValue', true, false),
    ).resolves.toStrictEqual(['test']);
  });

  it('handles empty data object', async () => {
    const emptyData: JsonObject = {};

    await expect(
      applySelectorArray(emptyData, 'nonExistent', false, true),
    ).resolves.toStrictEqual([]);

    await expect(applySelectorArray(emptyData, 'nonExistent')).rejects.toThrow(
      'Unexpected result of "nonExistent" selector, expected string[] type. Value undefined',
    );
  });

  it('handles deeply nested selectors', async () => {
    const deepData: JsonObject = {
      level1: {
        level2: {
          level3: {
            items: ['deep1', 'deep2', 'deep3'],
          },
        },
      },
    };

    await expect(
      applySelectorArray(deepData, 'level1.level2.level3.items'),
    ).resolves.toStrictEqual(['deep1', 'deep2', 'deep3']);
  });
});

describe('applySelectorArray - complex queries', () => {
  it('handles complex queries', async () => {
    const data = [
      {
        metadata: {
          kind: 'user',
          name: 'foo',
          namespace: 'default',
        },
      },
      {
        metadata: {
          kind: 'GROUP',
          name: 'mygroup',
          namespace: 'anothernamespace',
        },
      },
    ];

    const selector =
      "$map($,function($v) {$lowercase($v.metadata.kind) & ':' & $v.metadata.namespace & '/' & $v.metadata.name})";

    await expect(applySelectorArray(data, selector)).resolves.toStrictEqual([
      'user:default/foo',
      'group:anothernamespace/mygroup',
    ]);
  });
});
