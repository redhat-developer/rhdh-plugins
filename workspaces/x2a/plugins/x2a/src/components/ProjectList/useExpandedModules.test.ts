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

const mockModulesGet = jest.fn();
const mockClientService = { projectsProjectIdModulesGet: mockModulesGet };
jest.mock('../../ClientService', () => ({
  useClientService: () => mockClientService,
}));

import { renderHook, act } from '@testing-library/react';
import { POLLING_INTERVAL_MS } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { useExpandedModules } from './ProjectTable';

function makeJsonResponse(data: unknown) {
  return { json: async () => data };
}

/**
 * Flush all pending microtasks and React state updates. Required because
 * usePolledFetch's inner fetchData() is async and resolves across multiple
 * microtask ticks before updating state.
 */
async function flushAsync() {
  await act(async () => {});
}

describe('useExpandedModules', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockModulesGet.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns empty state when no IDs are expanded', async () => {
    const { result } = renderHook(() => useExpandedModules([]));
    await flushAsync();

    expect(result.current.modulesState).toEqual({});
    expect(mockModulesGet).not.toHaveBeenCalled();
  });

  it('fetches modules for expanded project IDs', async () => {
    const modulesA = [{ id: 'mod-a', name: 'Module A' }];
    const modulesB = [{ id: 'mod-b', name: 'Module B' }];

    mockModulesGet.mockImplementation(
      (args: { path: { projectId: string } }) => {
        if (args.path.projectId === 'proj-a') {
          return Promise.resolve(makeJsonResponse(modulesA));
        }
        return Promise.resolve(makeJsonResponse(modulesB));
      },
    );

    const { result } = renderHook(() =>
      useExpandedModules(['proj-a', 'proj-b']),
    );
    await flushAsync();

    expect(result.current.modulesState['proj-a']?.modules).toEqual(modulesA);
    expect(result.current.modulesState['proj-b']?.modules).toEqual(modulesB);
    expect(result.current.modulesState['proj-a']?.loading).toBe(false);
    expect(result.current.modulesState['proj-b']?.loading).toBe(false);
    expect(result.current.modulesState['proj-a']?.error).toBeUndefined();
    expect(result.current.modulesState['proj-b']?.error).toBeUndefined();
  });

  it('isolates per-project errors via Promise.allSettled', async () => {
    const modulesA = [{ id: 'mod-a', name: 'Module A' }];

    mockModulesGet.mockImplementation(
      (args: { path: { projectId: string } }) => {
        if (args.path.projectId === 'proj-a') {
          return Promise.resolve(makeJsonResponse(modulesA));
        }
        return Promise.reject(new Error('proj-b fetch failed'));
      },
    );

    const { result } = renderHook(() =>
      useExpandedModules(['proj-a', 'proj-b']),
    );
    await flushAsync();

    expect(result.current.modulesState['proj-a']?.modules).toEqual(modulesA);
    expect(result.current.modulesState['proj-a']?.error).toBeUndefined();
    expect(result.current.modulesState['proj-b']?.error?.message).toBe(
      'proj-b fetch failed',
    );
    expect(result.current.modulesState['proj-b']?.modules).toBeUndefined();
  });

  it('wraps non-Error rejection reasons into Error objects', async () => {
    mockModulesGet.mockRejectedValue('string-reason');

    const { result } = renderHook(() => useExpandedModules(['proj-x']));
    await flushAsync();

    expect(result.current.modulesState['proj-x']?.error).toBeDefined();
    expect(result.current.modulesState['proj-x']?.error?.message).toBe(
      'string-reason',
    );
  });

  it('polls for updated module data after POLLING_INTERVAL_MS', async () => {
    const modules = [{ id: 'mod-a', name: 'Module A' }];
    mockModulesGet.mockResolvedValue(makeJsonResponse(modules));

    const { result } = renderHook(() => useExpandedModules(['proj-a']));
    await flushAsync();

    expect(result.current.modulesState['proj-a']?.modules).toEqual(modules);
    expect(mockModulesGet).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(POLLING_INTERVAL_MS);
    });

    expect(mockModulesGet).toHaveBeenCalledTimes(2);
  });

  it('refetchModules restarts polling without loading indicator', async () => {
    const modules1 = [{ id: 'mod-a', name: 'Module A' }];
    const modules2 = [{ id: 'mod-a', name: 'Module A Updated' }];

    mockModulesGet
      .mockResolvedValueOnce(makeJsonResponse(modules1))
      .mockResolvedValue(makeJsonResponse(modules2));

    const { result } = renderHook(() => useExpandedModules(['proj-a']));
    await flushAsync();

    expect(result.current.modulesState['proj-a']?.modules).toEqual(modules1);

    await act(async () => {
      result.current.refetchModules();
    });
    await flushAsync();

    expect(result.current.modulesState['proj-a']?.modules).toEqual(modules2);
  });

  it('re-fetches when expanded IDs change', async () => {
    const modulesA = [{ id: 'mod-a', name: 'Module A' }];
    const modulesC = [{ id: 'mod-c', name: 'Module C' }];

    mockModulesGet.mockImplementation(
      (args: { path: { projectId: string } }) => {
        if (args.path.projectId === 'proj-a') {
          return Promise.resolve(makeJsonResponse(modulesA));
        }
        return Promise.resolve(makeJsonResponse(modulesC));
      },
    );

    const { result, rerender } = renderHook(
      (props: { ids: string[] }) => useExpandedModules(props.ids),
      { initialProps: { ids: ['proj-a'] } },
    );
    await flushAsync();

    expect(result.current.modulesState['proj-a']?.modules).toEqual(modulesA);

    rerender({ ids: ['proj-a', 'proj-c'] });
    await flushAsync();

    expect(result.current.modulesState['proj-c']?.modules).toEqual(modulesC);
  });

  it('recovers after all fetches fail on next successful poll', async () => {
    mockModulesGet.mockRejectedValueOnce(new Error('down'));

    const { result } = renderHook(() => useExpandedModules(['proj-a']));
    await flushAsync();

    expect(result.current.modulesState['proj-a']?.error?.message).toBe('down');

    const modules = [{ id: 'mod-a', name: 'Module A' }];
    mockModulesGet.mockResolvedValue(makeJsonResponse(modules));

    // Backoff after 1 error: POLLING_INTERVAL_MS * 2
    await act(async () => {
      jest.advanceTimersByTime(POLLING_INTERVAL_MS * 2);
    });

    expect(result.current.modulesState['proj-a']?.modules).toEqual(modules);
    expect(result.current.modulesState['proj-a']?.error).toBeUndefined();
  });
});
