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

import { TestApiProvider } from '@backstage/test-utils';

import { renderHook, waitFor } from '@testing-library/react';

import { orchestratorApiRef } from '../api';
import {
  ALL_WORKFLOW_OVERVIEWS_CACHE_KEY,
  getWorkflowOverviewsCacheKey,
  isEntityScopedWorkflowOverviews,
  ORCHESTRATOR_WORKFLOW_OVERVIEWS_CACHE_KEY,
  useWorkflowOverviews,
  useWorkflowsCount,
} from './useWorkflowsCount';

describe('workflow overview helpers', () => {
  it('detects entity-scoped workflow overview requests', () => {
    expect(
      isEntityScopedWorkflowOverviews({
        workflowsArray: ['wf-1'],
        targetEntity: 'component:default/my-component',
      }),
    ).toBe(true);
    expect(isEntityScopedWorkflowOverviews({})).toBe(false);
  });

  it('builds cache keys for paginated and entity-scoped requests', () => {
    expect(getWorkflowOverviewsCacheKey({ page: 1, pageSize: 20 })).toBe(
      'orchestrator-workflow-overviews:1:20',
    );
    expect(
      getWorkflowOverviewsCacheKey({
        workflowsArray: ['wf-1'],
        targetEntity: 'component:default/my-component',
      }),
    ).toBe('orchestrator-workflow-overviews:component:default/my-component');
    expect(getWorkflowOverviewsCacheKey()).toBe(
      ORCHESTRATOR_WORKFLOW_OVERVIEWS_CACHE_KEY,
    );
    expect(ALL_WORKFLOW_OVERVIEWS_CACHE_KEY).toBe(
      `${ORCHESTRATOR_WORKFLOW_OVERVIEWS_CACHE_KEY}:all`,
    );
  });
});

describe('useWorkflowOverviews', () => {
  const listWorkflowOverviews = jest.fn();
  const getWorkflowsOverviewForEntity = jest.fn();

  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(TestApiProvider, {
      apis: [
        [
          orchestratorApiRef,
          { listWorkflowOverviews, getWorkflowsOverviewForEntity },
        ],
      ],
      children,
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requests paginated workflow overviews for the global list', async () => {
    listWorkflowOverviews.mockResolvedValue({
      data: {
        overviews: Array.from({ length: 21 }, (_, index) => ({
          workflowId: `workflow-${index}`,
        })),
      },
    });

    const { result } = renderHook(
      () => useWorkflowOverviews({ page: 0, pageSize: 20 }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(listWorkflowOverviews).toHaveBeenCalledWith({
      pageSize: 21,
      offset: 0,
      orderBy: 'name',
      orderDirection: 'ASC',
    });
    expect(result.current.isPaginated).toBe(true);
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.overviews).toHaveLength(21);
  });

  it('requests all workflow overviews without pagination for total count', async () => {
    listWorkflowOverviews.mockResolvedValue({
      data: {
        overviews: Array.from({ length: 56 }, (_, index) => ({
          workflowId: `workflow-${index}`,
        })),
      },
    });

    const { result } = renderHook(() => useWorkflowOverviews(), { wrapper });

    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(listWorkflowOverviews).toHaveBeenCalledWith();
    expect(result.current.count).toBe(56);
    expect(result.current.isPaginated).toBe(false);
  });

  it('requests all entity-scoped workflow overviews without pagination', async () => {
    getWorkflowsOverviewForEntity.mockResolvedValue({
      data: {
        overviews: [{ workflowId: 'workflow-1' }],
      },
    });

    const { result } = renderHook(
      () =>
        useWorkflowOverviews({
          workflowsArray: ['workflow-1'],
          targetEntity: 'component:default/my-component',
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(getWorkflowsOverviewForEntity).toHaveBeenCalledWith(
      'component:default/my-component',
      ['workflow-1'],
    );
    expect(listWorkflowOverviews).not.toHaveBeenCalled();
    expect(result.current.isPaginated).toBe(false);
    expect(result.current.count).toBe(1);
  });
});

describe('useWorkflowsCount', () => {
  const listWorkflowOverviews = jest.fn();
  const getWorkflowsOverviewForEntity = jest.fn();

  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(TestApiProvider, {
      apis: [
        [
          orchestratorApiRef,
          { listWorkflowOverviews, getWorkflowsOverviewForEntity },
        ],
      ],
      children,
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the overview count from unpaginated overviews', async () => {
    getWorkflowsOverviewForEntity.mockResolvedValue({
      data: {
        overviews: [{ workflowId: 'a' }, { workflowId: 'b' }],
      },
    });

    // Entity-scoped key avoids colliding with the persisted global SWR cache.
    const { result } = renderHook(
      () =>
        useWorkflowsCount({
          workflowsArray: ['a', 'b'],
          targetEntity: 'component:default/count-test',
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current).toBe(2));
  });
});
