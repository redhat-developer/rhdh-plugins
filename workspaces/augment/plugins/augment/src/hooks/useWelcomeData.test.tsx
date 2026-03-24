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
import { renderHook, waitFor } from '@testing-library/react';
import { useWelcomeData } from './useWelcomeData';
import { createApiTestWrapper } from '../test-utils/renderWithApi';
import type { AugmentApi } from '../api';

jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  debugError: jest.fn(),
}));

const mockWorkflows = [{ id: 'w1', name: 'Workflow 1', steps: [] }];
const mockQuickActions = [
  { id: 'qa1', label: 'Quick 1', prompt: 'Do something' },
];
const mockPromptGroups = [{ id: 'pg1', title: 'Prompt Group 1', cards: [] }];

describe('useWelcomeData', () => {
  it('returns empty arrays initially', () => {
    const api = {
      getWorkflows: jest.fn(() => new Promise(() => {})),
      getQuickActions: jest.fn(() => new Promise(() => {})),
      getPromptGroups: jest.fn(() => new Promise(() => {})),
    };

    const { result } = renderHook(() => useWelcomeData(), {
      wrapper: createApiTestWrapper(api as Partial<AugmentApi>),
    });

    expect(result.current.workflows).toEqual([]);
    expect(result.current.quickActions).toEqual([]);
    expect(result.current.promptGroups).toEqual([]);
  });

  it('populates workflows, quickActions, promptGroups after successful API calls', async () => {
    const api = {
      getWorkflows: jest.fn().mockResolvedValue(mockWorkflows),
      getQuickActions: jest.fn().mockResolvedValue(mockQuickActions),
      getPromptGroups: jest.fn().mockResolvedValue(mockPromptGroups),
    };

    const { result } = renderHook(() => useWelcomeData(), {
      wrapper: createApiTestWrapper(api as Partial<AugmentApi>),
    });

    await waitFor(() => {
      expect(result.current.workflows).toEqual(mockWorkflows);
    });

    expect(result.current.quickActions).toEqual(mockQuickActions);
    expect(result.current.promptGroups).toEqual(mockPromptGroups);
    expect(api.getWorkflows).toHaveBeenCalled();
    expect(api.getQuickActions).toHaveBeenCalled();
    expect(api.getPromptGroups).toHaveBeenCalled();
  });

  it('handles partial failures (one Promise.allSettled rejection while others succeed)', async () => {
    const api = {
      getWorkflows: jest.fn().mockResolvedValue(mockWorkflows),
      getQuickActions: jest.fn().mockRejectedValue(new Error('QA failed')),
      getPromptGroups: jest.fn().mockResolvedValue(mockPromptGroups),
    };

    const { result } = renderHook(() => useWelcomeData(), {
      wrapper: createApiTestWrapper(api as Partial<AugmentApi>),
    });

    await waitFor(() => {
      expect(result.current.workflows).toEqual(mockWorkflows);
    });

    expect(result.current.quickActions).toEqual([]);
    expect(result.current.promptGroups).toEqual(mockPromptGroups);
  });

  it('does not setState after unmount (mount guard)', async () => {
    let resolveWorkflows: (value: unknown) => void;
    const workflowsPromise = new Promise(resolve => {
      resolveWorkflows = resolve;
    });
    const api = {
      getWorkflows: jest.fn().mockReturnValue(workflowsPromise),
      getQuickActions: jest.fn().mockResolvedValue(mockQuickActions),
      getPromptGroups: jest.fn().mockResolvedValue(mockPromptGroups),
    };

    const { unmount } = renderHook(() => useWelcomeData(), {
      wrapper: createApiTestWrapper(api as Partial<AugmentApi>),
    });

    unmount();
    resolveWorkflows!(mockWorkflows);

    await Promise.resolve();
    await Promise.resolve();

    expect(api.getWorkflows).toHaveBeenCalled();
  });
});
