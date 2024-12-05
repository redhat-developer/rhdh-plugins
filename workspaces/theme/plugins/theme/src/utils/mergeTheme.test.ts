/*
 * Copyright 2024 The Backstage Authors
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
import { UnifiedThemeOptions } from '@backstage/theme';
import { mergeUnifiedThemeOptions } from './mergeTheme';

type TestValue = string | string[] | null;

interface TestValues {
  value?: TestValue;
  anotherValue?: TestValue;
  deeper?: {
    value?: TestValue;
    anotherValue?: TestValue;
  } | null;
}

interface TestCase {
  name: string;
  // Allow us to test that the merge works in a generic way
  default: TestValues;
  customized: TestValues;
  expected: TestValues;
}

const testCases: TestCase[] = [
  // Simple cases
  {
    name: 'No data',
    default: {},
    customized: {},
    expected: {},
  },
  {
    name: 'Keep default',
    default: { value: 'default value' },
    customized: {},
    expected: { value: 'default value' },
  },
  {
    name: 'Use customization',
    default: {},
    customized: { value: 'custom value' },
    expected: { value: 'custom value' },
  },
  {
    name: 'Override default with customization',
    default: { value: 'default value' },
    customized: { value: 'custom value' },
    expected: { value: 'custom value' },
  },
  // Mixing
  {
    name: 'Mixing default and customization',
    default: { value: 'default value' },
    customized: { anotherValue: 'custom value' },
    expected: { value: 'default value', anotherValue: 'custom value' },
  },
  // Go deeper
  {
    name: 'Deeper without data',
    default: { deeper: {} },
    customized: { deeper: {} },
    expected: { deeper: {} },
  },
  {
    name: 'Deeper keep default',
    default: {
      value: 'default value',
      deeper: { value: 'deeper default value' },
    },
    customized: {},
    expected: {
      value: 'default value',
      deeper: { value: 'deeper default value' },
    },
  },
  {
    name: 'Deeper use customization',
    default: {},
    customized: {
      value: 'custom value',
      deeper: { value: 'deeper custom value' },
    },
    expected: {
      value: 'custom value',
      deeper: { value: 'deeper custom value' },
    },
  },
  {
    name: 'Deeper override default with customization',
    default: {
      value: 'default value',
      deeper: { value: 'deeper default value' },
    },
    customized: {
      value: 'custom value',
      deeper: { value: 'deeper custom value' },
    },
    expected: {
      value: 'custom value',
      deeper: { value: 'deeper custom value' },
    },
  },
  {
    name: 'Deeper mixing default and customization',
    default: {
      value: 'default value',
      deeper: {
        value: 'deeper default value',
      },
    },
    customized: {
      anotherValue: 'custom value',
      deeper: {
        anotherValue: 'deeper custom value',
      },
    },
    expected: {
      value: 'default value',
      anotherValue: 'custom value',
      deeper: {
        value: 'deeper default value',
        anotherValue: 'deeper custom value',
      },
    },
  },
  // Null and undefined
  {
    name: 'Null values overrides the default',
    default: { value: 'default value' },
    customized: { value: null },
    expected: { value: null },
  },
  {
    name: 'Null value overrides an object as well',
    default: { deeper: { value: 'default value' } },
    customized: { deeper: null },
    expected: { deeper: null },
  },
  {
    name: 'Missing values keep the default',
    default: { value: 'default value' },
    customized: {},
    expected: { value: 'default value' },
  },
  {
    name: 'Undefined values keep the default',
    default: { value: 'default value' },
    customized: { value: undefined },
    expected: { value: 'default value' },
  },
  // Arrays
  {
    name: 'Default arrays are kept as well',
    default: { value: ['a'] },
    customized: {},
    expected: { value: ['a'] },
  },
  {
    name: 'Deeper default arrays are kept as well',
    default: { deeper: { value: ['a'] } },
    customized: {},
    expected: { deeper: { value: ['a'] } },
  },
  {
    name: 'Custom arrays are used as well',
    default: {},
    customized: { value: ['a'] },
    expected: { value: ['a'] },
  },
  {
    name: 'Deeper default arrays are kept as well',
    default: {},
    customized: { deeper: { value: ['a'] } },
    expected: { deeper: { value: ['a'] } },
  },
  {
    name: 'Arrays are overridden, not merged',
    default: { value: ['a', 'b'] },
    customized: { value: ['c', 'd'] },
    expected: { value: ['c', 'd'] },
  },
  {
    name: 'Deeper arrays are also overridden, not merged',
    default: { deeper: { value: ['a', 'b'] } },
    customized: { deeper: { value: ['c', 'd'] } },
    expected: { deeper: { value: ['c', 'd'] } },
  },
];

describe('mergeThemeConfig', () => {
  testCases.forEach(testCase => {
    // eslint-disable-next-line jest/valid-title
    it(testCase.name, () => {
      const actual = mergeUnifiedThemeOptions(
        testCase.default as UnifiedThemeOptions,
        testCase.customized as UnifiedThemeOptions,
      );
      expect(actual).toEqual(testCase.expected);
    });
  });
});
