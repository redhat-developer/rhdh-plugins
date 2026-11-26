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

import { customDarkTheme, darkThemeOverrides } from './darkTheme';

describe('customDarkTheme', () => {
  it('should return the correct defaults for dark mode', () => {
    expect(customDarkTheme()).toEqual({
      banner: {
        closeButtonColor: '#FFFFFF',
        error: '#E22134',
        info: '#2E77D0',
        link: '#000000',
        text: '#FFFFFF',
        warning: '#FF9800',
      },
      border: '#E6E6E6',
      bursts: {
        backgroundColor: {
          default: '#7C3699',
        },
        fontColor: '#FEFEFE',
        gradient: {
          linear: 'linear-gradient(-137deg, #4BB8A5 0%, #187656 100%)',
        },
        slackChannelText: '#ddd',
      },
      errorBackground: '#FFEBEE',
      errorText: '#CA001B',
      gold: '#FFD600',
      highlight: '#FFFBCC',
      infoBackground: '#ebf5ff',
      infoText: '#004e8a',
      link: '#9CC9FF',
      linkHover: '#82BAFD',
      mode: 'dark',
      pinSidebarButton: {
        background: '#BDBDBD',
        icon: '#404040',
      },
      status: {
        aborted: '#9E9E9E',
        error: '#F84C55',
        ok: '#71CF88',
        pending: '#FEF071',
        running: '#3488E3',
        warning: '#FFB84D',
      },
      tabbar: {
        indicator: '#9BF0E1',
      },
      textContrast: '#FFFFFF',
      textSubtle: '#CCCCCC',
      textVerySubtle: '#727272',
      type: 'dark',
      warningBackground: '#F59B23',
      warningText: '#000000',

      ...darkThemeOverrides,
    });
  });
});
