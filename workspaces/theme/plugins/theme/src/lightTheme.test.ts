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
import { customLightTheme } from './lightTheme';

describe('customLightTheme', () => {
  it('should return the correct defaults for light mode', () => {
    expect(customLightTheme()).toEqual({
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
        background: '#222427',
        indicator: '#0066CC',
        color: '#ffffff',
        selectedColor: '#ffffff',
        navItem: {
          hoverBackground: '#3c3f42',
        },
        submenu: {
          background: '#222427',
        },
      },
      pinSidebarButton: {
        background: '#BDBDBD',
        icon: '#181818',
      },
      primary: {
        main: '#0066CC',
      },
      secondary: {
        main: '#0066CC',
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

      text: {
        primary: '#151515',
        secondary: '#757575',
      },
      rhdh: {
        general: {
          disabledBackground: '#D2D2D2',
          disabled: '#6A6E73',
          formControlBackgroundColor: '#FFF',
          mainSectionBackgroundColor: '#FFF',
          headerBottomBorderColor: '#C7C7C7',
          cardBackgroundColor: '#FFF',
          sidebarBackgroundColor: '#212427',
          sidebarItemSelectedBackgroundColor: '#4F5255',
          cardBorderColor: '#C7C7C7',
          tableTitleColor: '#181818',
          tableSubtitleColor: '#616161',
          tableColumnTitleColor: '#151515',
          tableRowHover: '#F5F5F5',
          tableBorderColor: '#E0E0E0',
          tableBackgroundColor: '#FFF',
          tabsBottomBorderColor: '#D2D2D2',
          contrastText: '#FFF',
        },
        primary: {
          main: '#0066CC',
          focusVisibleBorder: '#0066CC',
        },
        secondary: {
          main: '#0066CC',
          focusVisibleBorder: '#0066CC',
        },
        cards: {
          headerTextColor: '#151515',
          headerBackgroundColor: '#FFF',
          headerBackgroundImage: 'none',
        },
      },
    });
  });
});
