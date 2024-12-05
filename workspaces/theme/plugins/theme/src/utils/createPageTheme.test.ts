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
import { ThemeConfigPageTheme } from '../types';
import { createPageTheme } from './createPageTheme';

interface TestCase {
  name: string;
  config: ThemeConfigPageTheme;
  expected: PageTheme;
}

const testCases: TestCase[] = [
  // Automatically remove the background if no data is provided
  {
    name: 'No data',
    config: {},
    expected: {
      colors: ['transparent'],
      shape: 'none',
      backgroundImage:
        'none,  linear-gradient(90deg, transparent, transparent)',
      fontColor: '#FFFFFF',
    },
  },

  // Simple cases
  {
    name: 'Just one color',
    config: {
      backgroundColor: ['#ff0000'],
    },
    expected: {
      colors: ['#ff0000'],
      shape: 'none',
      backgroundImage: 'none,  linear-gradient(90deg, #ff0000, #ff0000)',
      fontColor: '#FFFFFF',
    },
  },
  {
    name: 'Two color gradient',
    config: {
      colors: ['#ff0000', '#00ff00'],
    },
    expected: {
      colors: ['#ff0000', '#00ff00'],
      shape: 'none',
      backgroundImage: 'none,  linear-gradient(90deg, #ff0000, #00ff00)',
      fontColor: '#FFFFFF',
    },
  },
  {
    name: 'Three color gradient',
    config: {
      colors: ['#ff0000', '#00ff00', '#0000ff'],
    },
    expected: {
      colors: ['#ff0000', '#00ff00', '#0000ff'],
      shape: 'none',
      backgroundImage:
        'none,  linear-gradient(90deg, #ff0000, #00ff00, #0000ff)',
      fontColor: '#FFFFFF',
    },
  },

  // Shapes
  {
    name: 'Just one color with round shape',
    config: {
      colors: ['#ff0000'],
      shape: 'round',
    },
    expected: {
      colors: ['#ff0000'],
      shape: shapes.round,
      backgroundImage: `${shapes.round},  linear-gradient(90deg, #ff0000, #ff0000)`,
      fontColor: '#FFFFFF',
    },
  },
  {
    name: 'Two color gradient with wave shape',
    config: {
      colors: ['#ff0000', '#00ff00'],
      shape: 'wave',
    },
    expected: {
      colors: ['#ff0000', '#00ff00'],
      shape: shapes.wave,
      backgroundImage: `${shapes.wave},  linear-gradient(90deg, #ff0000, #00ff00)`,
      fontColor: '#FFFFFF',
    },
  },
  {
    name: 'Three color gradient with wave2 shape',
    config: {
      colors: ['#ff0000', '#00ff00', '#0000ff'],
      shape: 'wave2',
    },
    expected: {
      colors: ['#ff0000', '#00ff00', '#0000ff'],
      shape: shapes.wave2,
      backgroundImage: `${shapes.wave2},  linear-gradient(90deg, #ff0000, #00ff00, #0000ff)`,
      fontColor: '#FFFFFF',
    },
  },

  // Background images with data:
  {
    name: 'Background image with data:...',
    config: {
      backgroundImage: 'data:...',
    },
    expected: {
      colors: ['transparent'],
      shape: 'url("data:...")',
      backgroundImage:
        'url("data:..."),  linear-gradient(90deg, transparent, transparent)',
      fontColor: '#FFFFFF',
    },
  },
  {
    name: 'Background image with url(data:...)',
    config: {
      backgroundImage: 'url(data:...)',
    },
    expected: {
      colors: ['transparent'],
      shape: 'url(data:...)',
      backgroundImage:
        'url(data:...),  linear-gradient(90deg, transparent, transparent)',
      fontColor: '#FFFFFF',
    },
  },

  // Background images with https://
  {
    name: 'Background image with https://example.com/image.png',
    config: {
      backgroundImage: 'https://example.com/image.png',
    },
    expected: {
      colors: ['transparent'],
      shape: 'url("https://example.com/image.png")',
      backgroundImage:
        'url("https://example.com/image.png"),  linear-gradient(90deg, transparent, transparent)',
      fontColor: '#FFFFFF',
    },
  },
  {
    name: 'Background image with url(https://example.com/image.png)',
    config: {
      backgroundImage: 'url(https://example.com/image.png)',
    },
    expected: {
      colors: ['transparent'],
      shape: 'url(https://example.com/image.png)',
      backgroundImage:
        'url(https://example.com/image.png),  linear-gradient(90deg, transparent, transparent)',
      fontColor: '#FFFFFF',
    },
  },

  // Background images with /static/image.png
  {
    name: 'Background image with /static/image.png',
    config: {
      backgroundImage: '/static/image.png',
    },
    expected: {
      colors: ['transparent'],
      shape: 'url("/static/image.png")',
      backgroundImage:
        'url("/static/image.png"),  linear-gradient(90deg, transparent, transparent)',
      fontColor: '#FFFFFF',
    },
  },
  {
    name: 'Background image with url(/static/image.png)',
    config: {
      backgroundImage: 'url(/static/image.png)',
    },
    expected: {
      colors: ['transparent'],
      shape: 'url(/static/image.png)',
      backgroundImage:
        'url(/static/image.png),  linear-gradient(90deg, transparent, transparent)',
      fontColor: '#FFFFFF',
    },
  },

  // Background images with <svg>...</svg>
  {
    name: 'Background image with <svg>...</svg>',
    config: {
      backgroundImage: '<svg>...</svg>',
    },
    expected: {
      colors: ['transparent'],
      shape: 'url("data:image/svg+xml,%3Csvg%3E...%3C%2Fsvg%3E")',
      backgroundImage:
        'url("data:image/svg+xml,%3Csvg%3E...%3C%2Fsvg%3E"),  linear-gradient(90deg, transparent, transparent)',
      fontColor: '#FFFFFF',
    },
  },
];

describe('createPageTheme', () => {
  testCases.forEach(testCase => {
    // eslint-disable-next-line jest/valid-title
    it(testCase.name, () => {
      const actual = createPageTheme(testCase.config as PageTheme);
      expect(actual).toEqual(testCase.expected);
    });
  });
});
