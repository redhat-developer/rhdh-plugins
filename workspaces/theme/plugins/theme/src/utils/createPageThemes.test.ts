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
import { PageTheme, shapes } from '@backstage/theme';
import { ThemeConfig } from '../types';
import { createPageThemes } from './createPageThemes';

interface TestCase {
  name: string;
  config: ThemeConfig;
  expected: Record<string, PageTheme> | undefined;
}

const testCases: TestCase[] = [
  // Not specific
  {
    name: 'No config',
    config: {},
    expected: undefined,
  },
  {
    name: 'Empty page theme',
    config: {
      pageTheme: {},
    },
    expected: undefined,
  },

  // One default page theme
  {
    name: 'One page theme',
    config: {
      pageTheme: {
        home: {
          colors: ['#ff0000'],
        },
      },
    },
    expected: {
      home: {
        colors: ['#ff0000'],
        shape: 'none',
        backgroundImage: 'none,  linear-gradient(90deg, #ff0000, #ff0000)',
        fontColor: '#FFFFFF',
      },
    },
  },

  // Two page themes
  {
    name: 'Two page themes',
    config: {
      pageTheme: {
        home: {
          colors: ['#ff0000'],
        },
        apis: {
          colors: ['#ff0000'],
          shape: 'wave',
        },
      },
    },
    expected: {
      home: {
        colors: ['#ff0000'],
        shape: 'none',
        backgroundImage: 'none,  linear-gradient(90deg, #ff0000, #ff0000)',
        fontColor: '#FFFFFF',
      },
      apis: {
        colors: ['#ff0000'],
        shape: shapes.wave,
        backgroundImage: `${shapes.wave},  linear-gradient(90deg, #ff0000, #ff0000)`,
        fontColor: '#FFFFFF',
      },
    },
  },
];

describe('createPageThemes', () => {
  testCases.forEach(testCase => {
    // eslint-disable-next-line jest/valid-title
    it(testCase.name, () => {
      const actual = createPageThemes(testCase.config);
      expect(actual).toEqual(testCase.expected);
    });
  });
});
