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

import { ReactNode } from 'react';

import { renderHook } from '@testing-library/react';
import { TestApiProvider, MockConfigApi } from '@backstage/test-utils';
import { configApiRef } from '@backstage/core-plugin-api';

import {
  useCatalogSourceConfig,
  getCatalogSourceLabel,
} from './useCatalogSourceConfig';

const createWrapper =
  (configData: Record<string, any>) =>
  ({ children }: { children: ReactNode }) => (
    <TestApiProvider
      apis={[[configApiRef, new MockConfigApi(configData as any)]]}
    >
      {children}
    </TestApiProvider>
  );

describe('useCatalogSourceConfig', () => {
  it('returns empty object when no catalogSources config exists', () => {
    const { result } = renderHook(() => useCatalogSourceConfig(), {
      wrapper: createWrapper({}),
    });

    expect(result.current).toEqual({});
  });

  it('returns parsed catalog sources from config', () => {
    const { result } = renderHook(() => useCatalogSourceConfig(), {
      wrapper: createWrapper({
        extensions: {
          catalogSources: {
            primary: {
              label: 'Red Hat',
              description: 'Plugins provided and supported by Red Hat',
              badge: 'Red Hat',
            },
            community: {
              label: 'Community',
              description: 'Community-maintained plugins',
            },
          },
        },
      }),
    });

    expect(result.current).toEqual({
      primary: {
        label: 'Red Hat',
        description: 'Plugins provided and supported by Red Hat',
        badge: 'Red Hat',
      },
      community: {
        label: 'Community',
        description: 'Community-maintained plugins',
        badge: undefined,
      },
    });
  });

  it('handles sources with only required label field', () => {
    const { result } = renderHook(() => useCatalogSourceConfig(), {
      wrapper: createWrapper({
        extensions: {
          catalogSources: {
            internal: {
              label: 'Internal',
            },
          },
        },
      }),
    });

    expect(result.current).toEqual({
      internal: {
        label: 'Internal',
        description: undefined,
        badge: undefined,
      },
    });
  });
});

describe('getCatalogSourceLabel', () => {
  const sources = {
    primary: { label: 'Red Hat', description: 'Red Hat plugins' },
    community: { label: 'Community' },
  };

  it('returns configured label for known source', () => {
    expect(getCatalogSourceLabel('primary', sources)).toBe('Red Hat');
  });

  it('returns raw key for unconfigured source', () => {
    expect(getCatalogSourceLabel('unknown-source', sources)).toBe(
      'unknown-source',
    );
  });
});
