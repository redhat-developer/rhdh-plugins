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

import { customDarkTheme } from './darkTheme';

describe('customDarkTheme', () => {
  it('should return the correct defaults for dark mode', () => {
    expect(customDarkTheme()).toEqual({
      background: {
        default: '#333333',
        paper: '#1b1d21',
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
        background: '#0f1214',
        indicator: '#0066CC',
        color: '#ffffff',
        selectedColor: '#ffffff',
        navItem: {
          hoverBackground: '#3c3f42',
        },
        submenu: {
          background: '#0f1214',
        },
      },
      pinSidebarButton: {
        background: '#BDBDBD',
        icon: '#404040',
      },
      primary: {
        main: '#1FA7F8',
      },
      secondary: {
        main: '#1FA7F8',
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

      rhdh: {
        general: {
          disabled: '#AAABAC',
          disabledBackground: '#444548',

          paperBackgroundImage: 'none',
          paperBorderColor: '#A3A3A3',

          popoverBoxShadow:
            '0 0.25rem 0.5rem 0rem rgba(3, 3, 3, 0.48), 0 0 0.25rem 0 rgba(3, 3, 3, 0.24)',

          cardBackgroundColor: '#1b1d21',
          cardBorderColor: '#A3A3A3',

          headerBottomBorderColor: '#A3A3A3',
          mainSectionBackgroundColor: '#0f1214',
          formControlBackgroundColor: '#36373A',

          sidebarBackgroundColor: '#1b1d21',
          sidebarItemSelectedBackgroundColor: '#4F5255',

          tableTitleColor: '#E0E0E0',
          tableSubtitleColor: '#E0E0E0',
          tableColumnTitleColor: '#E0E0E0',
          tableRowHover: '#0f1214',
          tableBorderColor: '#515151',
          tableBackgroundColor: '#1b1d21',
          tabsDisabledBackgroundColor: '#444548',
          tabsBottomBorderColor: '#444548',

          contrastText: '#FFF',

          appBarBackgroundColor: '#1b1d21',
          appBarBackgroundImage: 'none',
        },
        primary: {
          main: '#1FA7F8',
          focusVisibleBorder: '#ADD6FF',
        },
        secondary: {
          main: '#1FA7F8',
          focusVisibleBorder: '#ADD6FF',
        },
        cards: {
          headerTextColor: '#FFF',
          headerBackgroundColor: '#0f1214',
          headerBackgroundImage: 'none',
        },
      },
    });
  });
});
