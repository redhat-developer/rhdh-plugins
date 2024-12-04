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
import { getDefaultThemeConfig } from './backstage';

// This test will fail when backstage theme is updated.
//
// It is used to ensure that the theme is not broken when it is updated.
// It also helps to make it easier to check backstage theme colors.
//
// To fix the test, update the expected values to match the latest theme.

describe('backstage', () => {
  describe('getDefaultThemeConfig', () => {
    it('should return the correct defaults for light mode', () => {
      expect(getDefaultThemeConfig('light')).toEqual({
        variant: 'backstage',
        mode: 'light',
        palette: {
          background: {
            default: '#F8F8F8',
            paper: '#FFFFFF',
          },
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
          link: '#0A6EBE',
          linkHover: '#2196F3',
          mode: 'light',
          navigation: {
            background: '#171717',
            color: '#b5b5b5',
            indicator: '#9BF0E1',
            navItem: {
              hoverBackground: '#404040',
            },
            selectedColor: '#FFF',
            submenu: {
              background: '#404040',
            },
          },
          pinSidebarButton: {
            background: '#BDBDBD',
            icon: '#181818',
          },
          primary: {
            main: '#1F5493',
          },
          status: {
            aborted: '#757575',
            error: '#E22134',
            ok: '#1DB954',
            pending: '#FFED51',
            running: '#1F5493',
            warning: '#FF9800',
          },
          tabbar: {
            indicator: '#9BF0E1',
          },
          textContrast: '#000000',
          textSubtle: '#6E6E6E',
          textVerySubtle: '#DDD',
          type: 'light',
          warningBackground: '#F59B23',
          warningText: '#000000',
        },
      });
    });

    it('should return the correct defaults for dark mode', () => {
      expect(getDefaultThemeConfig('dark')).toEqual({
        variant: 'backstage',
        mode: 'dark',
        palette: {
          background: {
            default: '#333333',
            paper: '#424242',
          },
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
          navigation: {
            background: '#424242',
            color: '#b5b5b5',
            indicator: '#9BF0E1',
            navItem: {
              hoverBackground: '#404040',
            },
            selectedColor: '#FFF',
            submenu: {
              background: '#404040',
            },
          },
          pinSidebarButton: {
            background: '#BDBDBD',
            icon: '#404040',
          },
          primary: {
            dark: '#82BAFD',
            main: '#9CC9FF',
          },
          secondary: {
            main: '#FF88B2',
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
        },
      });
    });
  });
});
