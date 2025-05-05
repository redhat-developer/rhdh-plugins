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

import { renderHook } from '@testing-library/react-hooks';
import { useThemeOptions } from './useThemeOptions';

describe('useThemeOptions', () => {
  it('returns rhdh theming options for an empty theme config', () => {
    const { result } = renderHook(() => useThemeOptions({}));
    expect(result.current).toEqual({
      palette: expect.any(Object),
      fontFamily:
        'RedHatText, "Helvetica Neue", -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      typography: expect.any(Object),
      defaultPageTheme: 'default',
      pageTheme: {
        default: {
          backgroundImage: 'none,  linear-gradient(90deg, #ffffff, #ffffff)',
          colors: ['#ffffff'],
          fontColor: '#000000',
          shape: 'none',
        },
      },
      components: expect.any(Object),
    });
  });

  it('returns rhdh theming options for variant rhdh', () => {
    const { result } = renderHook(() =>
      useThemeOptions({
        mode: 'dark',
        variant: 'rhdh',
      }),
    );
    expect(result.current).toEqual({
      palette: expect.any(Object),
      fontFamily:
        'RedHatText, "Helvetica Neue", -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      typography: expect.any(Object),
      defaultPageTheme: 'default',
      pageTheme: {
        default: {
          backgroundImage: 'none,  linear-gradient(90deg, #292929, #292929)',
          colors: ['#292929'],
          fontColor: '#ffffff',
          shape: 'none',
        },
      },
      components: expect.any(Object),
    });
  });

  it('returns backstage theming options for backstage variant', () => {
    const { result } = renderHook(() =>
      useThemeOptions({
        mode: 'dark',
        variant: 'backstage',
      }),
    );
    expect(result.current).toEqual({
      palette: expect.any(Object),
      fontFamily: undefined,
      htmlFontSize: undefined,
      typography: undefined,
      defaultPageTheme: undefined,
      pageTheme: undefined,
    });
  });
});
