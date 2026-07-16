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

import { buiTokensToCSS } from './buiTokensToCSS';

describe('buiTokensToCSS', () => {
  it('returns an empty object for empty tokens', () => {
    expect(buiTokensToCSS({})).toEqual({});
  });

  it('maps a single token to the correct CSS custom property with', () => {
    const result = buiTokensToCSS({ primary: '#ff0000' });
    expect(result).toEqual({
      '--bui-bg-solid': '#ff0000',
    });
  });

  it('maps all tokens to the expected CSS custom properties', () => {
    const result = buiTokensToCSS({
      primary: '#1',
      warning: '#2',
      error: '#3',
      success: '#4',
      info: '#5',
      fontFamily: 'Arial',
      fontFamilyMonospace: 'Courier',
      borderColor: '#6',
      backgroundColor: '#7',
      foregroundPrimary: '#8',
      foregroundSecondary: '#9',
      foregroundDisabled: '#a',
      focusRing: '#b',
      shadow: '0 1px 2px #c',
    });

    expect(result).toEqual({
      '--bui-bg-solid': '#1',
      '--bui-fg-warning': '#2',
      '--bui-fg-danger': '#3',
      '--bui-fg-success': '#4',
      '--bui-fg-info': '#5',
      '--bui-font-regular': 'Arial',
      '--bui-font-monospace': 'Courier',
      '--bui-border-1': '#6',
      '--bui-bg-neutral-1': '#7',
      '--bui-fg-primary': '#8',
      '--bui-fg-secondary': '#9',
      '--bui-fg-disabled': '#a',
      '--bui-ring': '#b',
      '--bui-shadow': '0 1px 2px #c',
    });
  });

  it('produces no duplicate CSS property keys', () => {
    const result = buiTokensToCSS({
      primary: '#1',
      warning: '#2',
      error: '#3',
      success: '#4',
      info: '#5',
      fontFamily: 'Arial',
      fontFamilyMonospace: 'Courier',
      borderColor: '#6',
      backgroundColor: '#7',
      foregroundPrimary: '#8',
      foregroundSecondary: '#9',
      foregroundDisabled: '#a',
      focusRing: '#b',
      shadow: '#c',
    });
    const keys = Object.keys(result);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('skips undefined token values', () => {
    const result = buiTokensToCSS({
      primary: '#ff0000',
      warning: undefined,
      error: undefined,
    });
    expect(result).toEqual({
      '--bui-bg-solid': '#ff0000',
    });
  });
});
