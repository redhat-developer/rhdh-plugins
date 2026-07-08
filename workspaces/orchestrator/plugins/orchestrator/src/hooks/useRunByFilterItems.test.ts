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

import { orchestratorApiRef } from '../api';
import {
  collectDistinctInitiatorEntities,
  useRunByFilterItems,
} from './useRunByFilterItems';

describe('collectDistinctInitiatorEntities', () => {
  it('returns unique initiators from instances and additional values', () => {
    expect(
      collectDistinctInitiatorEntities(
        [
          { initiatorEntity: 'user:development/guest' },
          { initiatorEntity: 'user:development/guest' },
          { initiatorEntity: 'user:default/alice' },
        ],
        ['user:default/bob'],
      ),
    ).toEqual([
      'user:development/guest',
      'user:default/alice',
      'user:default/bob',
    ]);
  });
});

describe('useRunByFilterItems', () => {
  const listInstances = jest.fn();
  const getEntitiesByRefs = jest.fn();

  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(TestApiProvider, {
      apis: [
        [orchestratorApiRef, { listInstances }],
        [catalogApiRef, { getEntitiesByRefs }],
      ],
      children,
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads run-by options from workflow instances', async () => {
    listInstances.mockResolvedValue({
      data: {
        items: [
          { initiatorEntity: 'user:development/guest' },
          { initiatorEntity: 'user:default/alice' },
        ],
      },
    });
    getEntitiesByRefs.mockResolvedValue({
      items: [
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'User',
          metadata: {
            name: 'guest',
            namespace: 'development',
            title: 'Guest User',
          },
        },
        undefined,
      ],
    });

    const { result } = renderHook(
      () => useRunByFilterItems({ enabled: true }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(listInstances).toHaveBeenCalledWith(
      expect.objectContaining({ pageSize: 500, offset: 0 }),
      undefined,
    );
    expect(getEntitiesByRefs).toHaveBeenCalledWith({
      entityRefs: ['user:development/guest', 'user:default/alice'],
      fields: expect.any(Array),
    });
    expect(result.current.items).toEqual([
      { label: 'alice', value: 'user:default/alice' },
      { label: 'Guest User', value: 'user:development/guest' },
    ]);
  });

  it('returns empty items when disabled', async () => {
    const { result } = renderHook(
      () => useRunByFilterItems({ enabled: false }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(listInstances).not.toHaveBeenCalled();
    expect(result.current.items).toEqual([]);
  });
});
