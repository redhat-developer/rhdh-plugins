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

import { createElement, type ReactNode } from 'react';

import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { TestApiProvider } from '@backstage/test-utils';

import { renderHook, waitFor } from '@testing-library/react';

import { useEntityFilterItems } from './useEntityFilterItems';

jest.mock('@backstage/plugin-catalog-react', () => {
  const actual = jest.requireActual('@backstage/plugin-catalog-react');
  return {
    ...actual,
    entityPresentationSnapshot: jest.fn(
      (entity: { metadata: { name: string; title?: string } }) => ({
        primaryTitle: entity.metadata.title ?? entity.metadata.name,
      }),
    ),
  };
});

describe('useEntityFilterItems', () => {
  const getEntities = jest.fn();

  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(TestApiProvider, {
      apis: [[catalogApiRef, { getEntities }]],
      children,
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty items when disabled', async () => {
    const { result } = renderHook(
      () => useEntityFilterItems({ enabled: false }),
      { wrapper },
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.items).toEqual([]);
    expect(getEntities).not.toHaveBeenCalled();
  });

  it('maps and sorts catalog entities into select items', async () => {
    getEntities.mockResolvedValue({
      items: [
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'User',
          metadata: {
            name: 'zoe',
            namespace: 'default',
            title: 'Zoe',
          },
        },
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'alpha',
          },
        },
      ],
    });

    const { result } = renderHook(
      () => useEntityFilterItems({ enabled: true }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getEntities).toHaveBeenCalledWith({
      filter: { kind: ['Component', 'User'] },
      fields: [
        'metadata.name',
        'kind',
        'metadata.namespace',
        'metadata.title',
        'spec.profile.displayName',
      ],
    });
    expect(result.current.items).toEqual([
      { label: 'alpha', value: 'component:default/alpha' },
      { label: 'Zoe', value: 'user:default/zoe' },
    ]);
  });

  it('returns empty items when catalog request fails', async () => {
    const kinds = ['Group'];
    getEntities.mockRejectedValue(new Error('catalog unavailable'));

    const { result } = renderHook(() => useEntityFilterItems({ kinds }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getEntities).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: { kind: kinds },
      }),
    );
    expect(result.current.items).toEqual([]);
  });

  it('ignores late responses after unmount', async () => {
    let resolveEntities: (value: { items: unknown[] }) => void = () => {};
    getEntities.mockReturnValue(
      new Promise(resolve => {
        resolveEntities = resolve;
      }),
    );

    const { result, unmount } = renderHook(() => useEntityFilterItems(), {
      wrapper,
    });

    expect(result.current.loading).toBe(true);
    unmount();

    resolveEntities({
      items: [
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'User',
          metadata: { name: 'late', namespace: 'default' },
        },
      ],
    });

    // Allow the postponed promise to settle without updating unmounted state.
    await Promise.resolve();
    expect(result.current.items).toEqual([]);
  });
});
