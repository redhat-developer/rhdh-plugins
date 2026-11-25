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

import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { TestApiProvider } from '@backstage/test-utils';
import {
  appTreeApiRef,
  type AppTreeApi,
} from '@backstage/frontend-plugin-api';
import { useApp } from '@backstage/core-plugin-api';

import { useIsSettingsAvailable } from './useIsSettingsAvailable';

jest.mock('@backstage/core-plugin-api', () => {
  const actual = jest.requireActual('@backstage/core-plugin-api');
  return {
    ...actual,
    useApp: jest.fn(),
  };
});

const mockUseApp = jest.mocked(useApp);

describe('useIsSettingsAvailable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApp.mockReturnValue({
      getPlugins: () => [],
      getSystemIcon: () => () => null,
      getSystemIcons: () => ({}),
      getComponents: () => ({} as any),
    });
  });

  it('returns true when an enabled user-settings node exists in appTreeApi', () => {
    const mockAppTreeApi: AppTreeApi = {
      getNodesByRoutePath: () => ({ nodes: [] }),
      getTree: () => ({
        tree: {
          nodes: new Map([
            [
              'page:user-settings',
              {
                spec: {
                  id: 'page:user-settings',
                  disabled: false,
                  plugin: { id: 'user-settings' } as any,
                } as any,
              } as any,
            ],
          ]),
          root: {} as any,
          orphans: [],
        },
      }),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <TestApiProvider apis={[[appTreeApiRef, mockAppTreeApi]]}>
        {children}
      </TestApiProvider>
    );

    const { result } = renderHook(() => useIsSettingsAvailable(), {
      wrapper,
    });
    expect(result.current).toBe(true);
  });

  it('returns false when a user-settings node is disabled in appTreeApi', () => {
    const mockAppTreeApi: AppTreeApi = {
      getNodesByRoutePath: () => ({ nodes: [] }),
      getTree: () => ({
        tree: {
          nodes: new Map([
            [
              'page:user-settings',
              {
                spec: {
                  id: 'page:user-settings',
                  disabled: true,
                  plugin: { id: 'user-settings' } as any,
                } as any,
              } as any,
            ],
          ]),
          root: {} as any,
          orphans: [],
        },
      }),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <TestApiProvider apis={[[appTreeApiRef, mockAppTreeApi]]}>
        {children}
      </TestApiProvider>
    );

    const { result } = renderHook(() => useIsSettingsAvailable(), {
      wrapper,
    });
    expect(result.current).toBe(false);
  });

  it('returns false when no user-settings nodes exist', () => {
    const mockAppTreeApi: AppTreeApi = {
      getNodesByRoutePath: () => ({ nodes: [] }),
      getTree: () => ({
        tree: {
          nodes: new Map([
            [
              'page:catalog',
              {
                spec: {
                  id: 'page:catalog',
                  disabled: false,
                  plugin: { id: 'catalog' } as any,
                } as any,
              } as any,
            ],
          ]),
          root: {} as any,
          orphans: [],
        },
      }),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <TestApiProvider apis={[[appTreeApiRef, mockAppTreeApi]]}>
        {children}
      </TestApiProvider>
    );

    const { result } = renderHook(() => useIsSettingsAvailable(), {
      wrapper,
    });
    expect(result.current).toBe(false);
  });

  it('falls back to useApp when appTreeApi has no matching node', () => {
    mockUseApp.mockReturnValue({
      getPlugins: () => [{ getId: () => 'user-settings' } as any],
      getSystemIcon: () => () => null,
      getSystemIcons: () => ({}),
      getComponents: () => ({} as any),
    });

    const { result } = renderHook(() => useIsSettingsAvailable());
    expect(result.current).toBe(true);
  });
});
