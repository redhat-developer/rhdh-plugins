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
import { renderHook, act, waitFor } from '@testing-library/react';
import { POLLING_INTERVAL_MS } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { usePolledFetch } from './usePolledFetch';

describe('usePolledFetch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts in loading state and resolves with data', async () => {
    const fetchFn = jest.fn().mockResolvedValue({ id: 1 });

    const { result } = renderHook(() => usePolledFetch(fetchFn, []));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeUndefined();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ id: 1 });
    expect(result.current.error).toBeUndefined();
  });

  it('sets error when fetchFn rejects', async () => {
    const fetchFn = jest.fn().mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => usePolledFetch(fetchFn, []));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error?.message).toBe('fail');
    expect(result.current.data).toBeUndefined();
  });

  it('wraps non-Error throws into Error', async () => {
    const fetchFn = jest.fn().mockRejectedValue('string-error');

    const { result } = renderHook(() => usePolledFetch(fetchFn, []));

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    expect(result.current.error?.message).toBe('string-error');
  });

  it('polls at POLLING_INTERVAL_MS', async () => {
    const fetchFn = jest.fn().mockResolvedValue({ id: 1 });

    renderHook(() => usePolledFetch(fetchFn, []));

    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    jest.advanceTimersByTime(POLLING_INTERVAL_MS);

    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });

    jest.advanceTimersByTime(POLLING_INTERVAL_MS);

    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledTimes(3);
    });
  });

  it('does not show loading during polling', async () => {
    const fetchFn = jest.fn().mockResolvedValue({ id: 1 });

    const { result } = renderHook(() => usePolledFetch(fetchFn, []));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    jest.advanceTimersByTime(POLLING_INTERVAL_MS);

    expect(result.current.loading).toBe(false);
    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });
    expect(result.current.loading).toBe(false);
  });

  it('preserves referential identity when polled data is unchanged', async () => {
    const fetchFn = jest.fn().mockResolvedValue({ id: 1 });

    const { result } = renderHook(() => usePolledFetch(fetchFn, []));

    await waitFor(() => {
      expect(result.current.data).toEqual({ id: 1 });
    });

    const firstData = result.current.data;

    jest.advanceTimersByTime(POLLING_INTERVAL_MS);
    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });

    expect(result.current.data).toBe(firstData);
  });

  it('updates data when polled result differs', async () => {
    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValue({ id: 2 });

    const { result } = renderHook(() => usePolledFetch(fetchFn, []));

    await waitFor(() => {
      expect(result.current.data).toEqual({ id: 1 });
    });

    jest.advanceTimersByTime(POLLING_INTERVAL_MS);

    await waitFor(() => {
      expect(result.current.data).toEqual({ id: 2 });
    });
  });

  it('recovers from error on next successful poll', async () => {
    const fetchFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValue({ id: 1 });

    const { result } = renderHook(() => usePolledFetch(fetchFn, []));

    await waitFor(() => {
      expect(result.current.error?.message).toBe('temporary');
    });

    // After first error, backoff = POLLING_INTERVAL_MS * 2^1
    jest.advanceTimersByTime(POLLING_INTERVAL_MS * 2);

    await waitFor(() => {
      expect(result.current.error).toBeUndefined();
    });
    expect(result.current.data).toEqual({ id: 1 });
  });

  it('aborts fetch on unmount and does not update state', async () => {
    let resolve: (v: unknown) => void;
    const fetchFn = jest.fn().mockReturnValue(
      new Promise(r => {
        resolve = r;
      }),
    );

    const { result, unmount } = renderHook(() => usePolledFetch(fetchFn, []));

    expect(result.current.loading).toBe(true);

    unmount();

    // Resolve after unmount – should not throw or update state
    await act(async () => {
      resolve!({ id: 1 });
    });

    // If we got here without errors, the abort guard worked
    expect(result.current.data).toBeUndefined();
  });

  it('clears timeout on unmount', async () => {
    const fetchFn = jest.fn().mockResolvedValue({ id: 1 });

    const { unmount } = renderHook(() => usePolledFetch(fetchFn, []));

    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    unmount();

    jest.advanceTimersByTime(POLLING_INTERVAL_MS * 5);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('resets loading to true when deps change', async () => {
    const fetchFn = jest.fn().mockResolvedValue({ id: 1 });
    let page = 0;

    const { result, rerender } = renderHook(() =>
      usePolledFetch(fetchFn, [page]),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    page = 1;
    rerender();

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('clears error when deps change', async () => {
    const fetchFn = jest.fn().mockRejectedValue(new Error('fail'));
    let page = 0;

    const { result, rerender } = renderHook(() =>
      usePolledFetch(fetchFn, [page]),
    );

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    fetchFn.mockResolvedValue({ id: 1 });
    page = 1;
    rerender();

    expect(result.current.error).toBeUndefined();
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.data).toEqual({ id: 1 });
  });

  it('refetch() does not show loading', async () => {
    const fetchFn = jest.fn().mockResolvedValue({ id: 1 });

    const { result } = renderHook(() => usePolledFetch(fetchFn, []));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    fetchFn.mockResolvedValue({ id: 2 });

    act(() => {
      result.current.refetch();
    });

    expect(result.current.loading).toBe(false);

    await waitFor(() => {
      expect(result.current.data).toEqual({ id: 2 });
    });
  });

  it('restarts polling cycle on refetch', async () => {
    const fetchFn = jest.fn().mockResolvedValue({ id: 1 });

    const { result } = renderHook(() => usePolledFetch(fetchFn, []));

    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });
  });

  it('uses initialData and skips initial loading', async () => {
    const fetchFn = jest.fn().mockResolvedValue({ id: 2 });

    const { result } = renderHook(() =>
      usePolledFetch(fetchFn, [], { initialData: { id: 1 } }),
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual({ id: 1 });

    await waitFor(() => {
      expect(result.current.data).toEqual({ id: 2 });
    });
  });

  it('continues polling after an error with backoff', async () => {
    const fetchFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('err1'))
      .mockRejectedValueOnce(new Error('err2'))
      .mockResolvedValue({ id: 1 });

    const { result } = renderHook(() => usePolledFetch(fetchFn, []));

    await waitFor(() => {
      expect(result.current.error?.message).toBe('err1');
    });

    await act(async () => {
      jest.advanceTimersByTime(POLLING_INTERVAL_MS * 2);
    });

    await waitFor(() => {
      expect(result.current.error?.message).toBe('err2');
    });

    await act(async () => {
      jest.advanceTimersByTime(POLLING_INTERVAL_MS * 4);
    });

    await waitFor(() => {
      expect(result.current.error).toBeUndefined();
      expect(result.current.data).toEqual({ id: 1 });
    });
  });

  it('resets backoff to normal interval after recovery', async () => {
    const fetchFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('err'))
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValue({ id: 2 });

    const { result } = renderHook(() => usePolledFetch(fetchFn, []));

    await waitFor(() => {
      expect(result.current.error?.message).toBe('err');
    });

    // Advance past backoff (POLLING_INTERVAL_MS * 2) for recovery
    await act(async () => {
      jest.advanceTimersByTime(POLLING_INTERVAL_MS * 2);
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ id: 1 });
      expect(result.current.error).toBeUndefined();
    });

    // After recovery, next poll fires at normal POLLING_INTERVAL_MS
    await act(async () => {
      jest.advanceTimersByTime(POLLING_INTERVAL_MS);
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ id: 2 });
    });
  });

  it('does not retry before backoff interval elapses', async () => {
    const fetchFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('err'))
      .mockResolvedValue({ id: 1 });

    const { result } = renderHook(() => usePolledFetch(fetchFn, []));

    await waitFor(() => {
      expect(result.current.error?.message).toBe('err');
    });

    // Advancing by normal interval (less than backoff) should NOT trigger retry
    await act(async () => {
      jest.advanceTimersByTime(POLLING_INTERVAL_MS);
    });

    expect(result.current.error?.message).toBe('err');
    expect(result.current.data).toBeUndefined();
  });
});
