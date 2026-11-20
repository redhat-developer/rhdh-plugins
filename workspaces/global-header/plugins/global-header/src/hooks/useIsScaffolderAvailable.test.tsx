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
import { appTreeApiRef, type AppTreeApi } from '@backstage/frontend-plugin-api';
import { useApp } from '@backstage/core-plugin-api';

import { useIsScaffolderAvailable } from './useIsScaffolderAvailable';

jest.mock('@backstage/core-plugin-api', () => {
  const actual = jest.requireActual('@backstage/core-plugin-api');
  return {
    ...actual,
    useApp: jest.fn(),
  };
});

const mockUseApp = jest.mocked(useApp);

describe('useIsScaffolderAvailable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApp.mockReturnValue({
      getPlugins: () => [],
      getSystemIcon: () => () => null,
      getSystemIcons: () => ({}),
      getComponents: () => ({} as any),
    });
  });

  it('returns true when an enabled scaffolder node exists in appTreeApi', () => {
    const mockAppTreeApi: AppTreeApi = {
      getNodesByRoutePath: () => ({ nodes: [] }),
      getTree: () => ({
        tree: {
          nodes: new Map([
            [
              'page:scaffolder',
              {
                spec: {
                  id: 'page:scaffolder',
                  disabled: false,
                  plugin: { id: 'scaffolder' } as any,
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

    const { result } = renderHook(() => useIsScaffolderAvailable(), {
      wrapper,
    });
    expect(result.current).toBe(true);
  });

  it('returns false when a scaffolder node is disabled in appTreeApi', () => {
    const mockAppTreeApi: AppTreeApi = {
      getNodesByRoutePath: () => ({ nodes: [] }),
      getTree: () => ({
        tree: {
          nodes: new Map([
            [
              'page:scaffolder',
              {
                spec: {
                  id: 'page:scaffolder',
                  disabled: true,
                  plugin: { id: 'scaffolder' } as any,
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

    const { result } = renderHook(() => useIsScaffolderAvailable(), {
      wrapper,
    });
    expect(result.current).toBe(false);
  });

  it('returns false when appTreeApi has other nodes but no scaffolder plugin', () => {
    const mockAppTreeApi: AppTreeApi = {
      getNodesByRoutePath: () => ({ nodes: [] }),
      getTree: () => ({
        tree: {
          nodes: new Map([
            [
              'component:app/scaffolder-template-card',
              {
                spec: {
                  id: 'component:app/scaffolder-template-card',
                  disabled: false,
                  plugin: { id: 'app' } as any,
                } as any,
              } as any,
            ],
            [
              'page:home',
              {
                spec: {
                  id: 'page:home',
                  disabled: false,
                  plugin: { id: 'home' } as any,
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

    const { result } = renderHook(() => useIsScaffolderAvailable(), {
      wrapper,
    });
    expect(result.current).toBe(false);
  });

  it('falls back to app.getPlugins() when appTreeApi is not present', () => {
    mockUseApp.mockReturnValue({
      getPlugins: () => [{ getId: () => 'scaffolder' } as any],
      getSystemIcon: () => () => null,
      getSystemIcons: () => ({}),
      getComponents: () => ({} as any),
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <TestApiProvider apis={[]}>{children}</TestApiProvider>
    );

    const { result } = renderHook(() => useIsScaffolderAvailable(), {
      wrapper,
    });
    expect(result.current).toBe(true);
  });

  it('returns false when neither appTreeApi nor app.getPlugins() have scaffolder', () => {
    mockUseApp.mockReturnValue({
      getPlugins: () => [{ getId: () => 'catalog' } as any],
      getSystemIcon: () => () => null,
      getSystemIcons: () => ({}),
      getComponents: () => ({} as any),
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <TestApiProvider apis={[]}>{children}</TestApiProvider>
    );

    const { result } = renderHook(() => useIsScaffolderAvailable(), {
      wrapper,
    });
    expect(result.current).toBe(false);
  });
});
