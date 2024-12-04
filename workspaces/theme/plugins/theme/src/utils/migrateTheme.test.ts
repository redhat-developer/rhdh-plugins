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
import { BackstagePaletteAdditions } from '@backstage/theme';
import { ThemeConfig } from '../types';
import {
  migrateThemeConfig,
  DeprecatedRHDH10to12ThemeColors,
} from './migrateTheme';

interface TestCase {
  name: string;
  config: ThemeConfig & Partial<DeprecatedRHDH10to12ThemeColors>;
  expected: ThemeConfig;
}

const testCases: TestCase[] = [
  {
    name: 'No data',
    config: {},
    expected: {
      palette: {},
    },
  },

  // Migrate primaryColor
  {
    name: 'Use old primary color if defined',
    config: {
      primaryColor: '#ff0000',
    },
    expected: {
      palette: {
        primary: {
          main: '#ff0000',
        },
      },
    },
  },
  {
    name: 'Prefer palette primary color if defined',
    config: {
      primaryColor: '#ff0000',
      palette: {
        primary: {
          main: '#00ff00',
        },
      },
    },
    expected: {
      palette: {
        primary: {
          main: '#00ff00',
        },
      },
    },
  },
  {
    name: 'Merge palette primary color if defined',
    config: {
      primaryColor: '#ff0000',
      palette: {
        primary: {
          main: '',
          dark: '#0000ff',
        },
      },
    },
    expected: {
      palette: {
        primary: {
          main: '#ff0000',
          dark: '#0000ff',
        },
      },
    },
  },

  // Migrate headerColor1 and headerColor2
  {
    name: 'Use old headerColor1 if defined',
    config: {
      headerColor1: '#ff0000',
    },
    expected: {
      palette: {},
      defaultPageTheme: 'home',
      pageTheme: {
        home: {
          backgroundColor: '#ff0000',
        },
      },
    },
  },
  {
    name: 'Use old headerColor1 and headerColor2 if defined',
    config: {
      headerColor1: '#ff0000',
      headerColor2: '#00ff00',
    },
    expected: {
      palette: {},
      defaultPageTheme: 'home',
      pageTheme: {
        home: {
          backgroundColor: ['#ff0000', '#00ff00'],
        },
      },
    },
  },
  {
    name: 'Ignore headerColor1 or headerColor2 if pageTheme is defined',
    config: {
      headerColor1: '#ff0000',
      headerColor2: '#00ff00',
      pageTheme: {
        home: {
          backgroundColor: '#0000ff',
        },
      },
    },
    expected: {
      palette: {},
      pageTheme: {
        home: {
          backgroundColor: '#0000ff',
        },
      },
    },
  },
  {
    name: 'Pass pageThemes',
    config: {
      pageTheme: {
        default: {
          fontColor: '#000000',
          backgroundColor: '#ff0000',
        },
        gradient: {
          fontColor: '#000000',
          backgroundColor: ['#00ff00', '#0000ff'],
        },
      },
    },
    expected: {
      palette: {},
      pageTheme: {
        default: {
          fontColor: '#000000',
          backgroundColor: '#ff0000',
        },
        gradient: {
          fontColor: '#000000',
          backgroundColor: ['#00ff00', '#0000ff'],
        },
      },
    },
  },
  {
    name: 'Pass options as well',
    config: {
      options: {
        components: 'backstage',
      },
    },
    expected: {
      palette: {},
      options: {
        components: 'backstage',
      },
    },
  },

  // Migrate navigationIndicatorColor
  {
    name: 'Use old navigation indicator color if defined',
    config: {
      navigationIndicatorColor: '#ff0000',
    },
    expected: {
      palette: {
        navigation: {
          // background: '',
          indicator: '#ff0000',
          // color: '',
          // selectedColor: "",
        } as BackstagePaletteAdditions['navigation'],
      },
    },
  },
  // {
  //   name: "Prefer palette primary color if defined",
  //   config: {
  //     primaryColor: "#ff0000",
  //     palette: {
  //       primary: {
  //         main: "#00ff00",
  //       },
  //     },
  //   },
  //   expected: {
  //     palette: {
  //       primary: {
  //         main: "#00ff00",
  //       },
  //     },
  //   },
  // },
  // {
  //   name: "Merge palette primary color if defined",
  //   config: {
  //     primaryColor: "#ff0000",
  //     palette: {
  //       primary: {
  //         dark: "#0000ff",
  //       },
  //     },
  //   },
  //   expected: {
  //     palette: {
  //       primary: {
  //         main: "#ff0000",
  //         dark: "#0000ff",
  //       },
  //     },
  //   },
  // },
];

describe('migrateThemeConfig', () => {
  testCases.forEach(testCase => {
    // eslint-disable-next-line jest/valid-title
    it(testCase.name, () => {
      const actual = migrateThemeConfig(testCase.config);
      expect(actual).toEqual(testCase.expected);
    });
  });
});
