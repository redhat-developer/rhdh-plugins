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

import { type Entity } from '@backstage/catalog-model';
import {
  type CatalogApi,
  catalogApiRef,
} from '@backstage/plugin-catalog-react';
import { TestApiProvider } from '@backstage/test-utils';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode, createElement } from 'react';

import { useAiAssets } from './useAiAssets';

const aiSkill: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'test-skill',
    namespace: 'default',
    description: 'A test skill for code review',
    tags: ['security', 'quality'],
  },
  spec: { type: 'skill', lifecycle: 'production', owner: 'team-ai' },
};

const aiAgent: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'test-agent',
    namespace: 'default',
    description: 'A test agent',
    tags: ['agent'],
  },
  spec: { type: 'ai-agent', lifecycle: 'experimental', owner: 'team-ml' },
};

const nonAiComponent: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: { name: 'web-service', namespace: 'default', tags: [] },
  spec: { type: 'service', lifecycle: 'production', owner: 'team-web' },
};

const mockCatalogApi: Pick<jest.Mocked<CatalogApi>, 'getEntities'> = {
  getEntities: jest.fn(),
};

function wrapper({ children }: { children: ReactNode }) {
  return createElement(
    TestApiProvider,
    {
      apis: [[catalogApiRef, mockCatalogApi as unknown as CatalogApi]],
      children,
    } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  );
}

describe('useAiAssets', () => {
  beforeEach(() => {
    mockCatalogApi.getEntities.mockReset();
  });

  it('returns loading true initially', () => {
    mockCatalogApi.getEntities.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useAiAssets(), { wrapper });
    expect(result.current.loading).toBe(true);
    expect(result.current.entities).toEqual([]);
  });

  it('fetches and filters AI asset entities', async () => {
    mockCatalogApi.getEntities.mockResolvedValue({
      items: [aiSkill, aiAgent, nonAiComponent],
    });

    const { result } = renderHook(() => useAiAssets(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.entities).toHaveLength(2);
    expect(result.current.entities.map(e => e.metadata.name)).toEqual([
      'test-agent',
      'test-skill',
    ]);
  });

  it('filters by search term (name, description, tags)', async () => {
    mockCatalogApi.getEntities.mockResolvedValue({
      items: [aiSkill, aiAgent],
    });

    const { result } = renderHook(
      () => useAiAssets({ search: 'code review' }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.entities).toHaveLength(1);
    expect(result.current.entities[0].metadata.name).toBe('test-skill');
  });

  it('filters by tags', async () => {
    mockCatalogApi.getEntities.mockResolvedValue({
      items: [aiSkill, aiAgent],
    });

    const { result } = renderHook(() => useAiAssets({ tags: ['agent'] }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.entities).toHaveLength(1);
    expect(result.current.entities[0].metadata.name).toBe('test-agent');
  });

  it('filters by category (spec.type)', async () => {
    mockCatalogApi.getEntities.mockResolvedValue({
      items: [aiSkill, aiAgent],
    });

    const { result } = renderHook(() => useAiAssets({ category: ['skill'] }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.entities).toHaveLength(1);
    expect(result.current.entities[0].metadata.name).toBe('test-skill');
  });

  it('sets error on fetch failure', async () => {
    mockCatalogApi.getEntities.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAiAssets(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe('Network error');
    expect(result.current.entities).toEqual([]);
  });

  it('does not refetch when only client-side filters change', async () => {
    mockCatalogApi.getEntities.mockResolvedValue({
      items: [aiSkill, aiAgent],
    });

    const { result, rerender } = renderHook(
      ({ filters }) => useAiAssets(filters),
      { wrapper, initialProps: { filters: {} } },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockCatalogApi.getEntities).toHaveBeenCalledTimes(1);

    rerender({ filters: { search: 'skill' } });

    expect(mockCatalogApi.getEntities).toHaveBeenCalledTimes(1);
    expect(result.current.entities).toHaveLength(1);
  });
});
