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
import { useBranding } from './useBranding';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

const mockAppConfig = (appConfig: Config) => {
  (useApi as jest.Mock).mockReturnValue(
    new MockConfigApi(appConfig as unknown as JsonObject),
  );
};

describe('useBranding', () => {
  it('returns undefined if the config contains no branding', () => {
    mockAppConfig({
      app: {},
    });
    const { result } = renderHook(() => useBranding());
    expect(result.current).toBeUndefined();
  });

  it('returns the branding without theme', () => {
    mockAppConfig({
      app: {
        branding: {},
      },
    });
    const { result } = renderHook(() => useBranding());
    expect(result.current).toEqual({});
  });

  it('returns the branding with theme', () => {
    mockAppConfig({
      app: {
        branding: {
          theme: {
            emptyTheme: {},
            anotherTheme: {
              palette: {
                divider: 'red',
              },
            },
          },
        },
      },
    });
    const { result } = renderHook(() => useBranding());
    expect(result.current).toEqual({
      theme: {
        emptyTheme: {},
        anotherTheme: {
          palette: {
            divider: 'red',
          },
        },
      },
    });
  });
});
