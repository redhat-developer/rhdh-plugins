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
export const defaultThemePalette = (mode: string) => {
  if (mode === 'dark') {
    return {
      general: {
        disabledBackground: '#444548',
        disabled: '#AAABAC',
        formControlBackgroundColor: '#36373A',
        mainSectionBackgroundColor: '#0f1214',
        cardBackgroundColor: '#212427',
        focusVisibleBorder: '#ADD6FF',
        sideBarBackgroundColor: '#1b1d21',
        cardSubtitleColor: '#FFF',
        cardBorderColor: '#444548',
      },
      primary: {
        main: '#1FA7F8', // text button color, button background color
        containedButtonBackground: '#0066CC', // contained button background color
        textHover: '#73BCF7', // text button hover color
        contrastText: '#FFF', // contained button text color
        dark: '#004080', // contained button hover background color
      },
      secondary: {
        main: '#B2A3FF',
        containedButtonBackground: '#8476D1',
        textHover: '#CBC1FF',
        contrastText: '#FFF',
        dark: '#6753AC',
      },
    };
  }
  return {
    general: {
      disabledBackground: '#D2D2D2',
      disabled: '#6A6E73',
      focusVisibleBorder: '#0066CC',
      formControlBackgroundColor: '#FFF',
      mainSectionBackgroundColor: '#f0f0f0',
      cardBackgroundColor: '#FFF',
      sideBarBackgroundColor: '#212427',
      cardSubtitleColor: '#000',
      cardBorderColor: '#EBEBEB',
    },
    primary: {
      main: '#0066CC',
      containedButtonBackground: '#0066CC',
      mainHover: '#004080',
      contrastText: '#FFF',
      dark: '#004080',
    },
    secondary: {
      main: '#8476D1',
      containedButtonBackground: '#8476D1',
      mainHover: '#6753AC',
      contrastText: '#FFF',
      dark: '#6753AC',
    },
  };
};
