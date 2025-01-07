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
import { useApi } from '@backstage/core-plugin-api';
import { MockConfigApi } from '@backstage/test-utils';
import { JsonObject } from '@backstage/types';
import { Config } from '../types';
import { useThemeConfig } from './useThemeConfig';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

const mockAppConfig = (appConfig: Config) => {
  (useApi as jest.Mock).mockReturnValue(
    new MockConfigApi(appConfig as unknown as JsonObject),
  );
};

describe('useThemeConfig', () => {
  it('returns an empty config if the config contains no branding', () => {
    mockAppConfig({
      app: {},
    });
    const { result } = renderHook(() => useThemeConfig('someTheme'));
    expect(result.current).toEqual({
      mode: 'light',
    });
  });

  it('returns an empty config if branding contains no theme', () => {
    mockAppConfig({
      app: {
        branding: {},
      },
    });
    const { result } = renderHook(() => useThemeConfig('someTheme'));
    expect(result.current).toEqual({
      mode: 'light',
    });
  });

  it('returns the theme config when it is defined', () => {
    mockAppConfig({
      app: {
        branding: {
          theme: {
            lightTheme: {},
            darkTheme: {},
            emptyTheme: {},
            anotherTheme: {
              mode: 'dark',
              palette: {
                divider: 'red',
              },
            },
          },
        },
      },
    });

    const { result: lightTheme } = renderHook(() =>
      useThemeConfig('lightTheme'),
    );
    expect(lightTheme.current).toEqual({
      mode: 'light',
    });

    const { result: darkTheme } = renderHook(() => useThemeConfig('darkTheme'));
    expect(darkTheme.current).toEqual({
      mode: 'dark',
    });

    const { result: emptyTheme } = renderHook(() =>
      useThemeConfig('emptyTheme'),
    );
    expect(emptyTheme.current).toEqual({
      mode: 'light',
    });

    const { result: anotherTheme } = renderHook(() =>
      useThemeConfig('anotherTheme'),
    );
    expect(anotherTheme.current).toEqual({
      mode: 'dark',
      palette: {
        divider: 'red',
      },
    });

    const { result: notFoundTheme } = renderHook(() =>
      useThemeConfig('notFoundTheme'),
    );
    expect(notFoundTheme.current).toEqual({
      mode: 'light',
    });
  });
});
