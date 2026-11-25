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

import { useIsCatalogAvailable } from './useIsCatalogAvailable';

describe('useIsCatalogAvailable', () => {
  it('returns true when an enabled page:catalog/entity node exists in appTreeApi', () => {
    const mockAppTreeApi: AppTreeApi = {
      getNodesByRoutePath: () => ({ nodes: [] }),
      getTree: () => ({
        tree: {
          nodes: new Map([
            [
              'page:catalog/entity',
              {
                spec: {
                  id: 'page:catalog/entity',
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

    const { result } = renderHook(() => useIsCatalogAvailable(), {
      wrapper,
    });
    expect(result.current).toBe(true);
  });

  it('returns false when satellite modules like catalog-graph or api-docs exist with pluginId catalog but no page:catalog/entity', () => {
    const mockAppTreeApi: AppTreeApi = {
      getNodesByRoutePath: () => ({ nodes: [] }),
      getTree: () => ({
        tree: {
          nodes: new Map([
            [
              'page:catalog/catalog-graph',
              {
                spec: {
                  id: 'page:catalog/catalog-graph',
                  disabled: false,
                  plugin: { id: 'catalog' } as any,
                } as any,
              } as any,
            ],
            [
              'api:catalog',
              {
                spec: {
                  id: 'api:catalog',
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

    const { result } = renderHook(() => useIsCatalogAvailable(), {
      wrapper,
    });
    expect(result.current).toBe(false);
  });

  it('returns false when page:catalog/entity is disabled in appTreeApi', () => {
    const mockAppTreeApi: AppTreeApi = {
      getNodesByRoutePath: () => ({ nodes: [] }),
      getTree: () => ({
        tree: {
          nodes: new Map([
            [
              'page:catalog/entity',
              {
                spec: {
                  id: 'page:catalog/entity',
                  disabled: true,
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

    const { result } = renderHook(() => useIsCatalogAvailable(), {
      wrapper,
    });
    expect(result.current).toBe(false);
  });
});
