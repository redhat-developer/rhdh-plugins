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
import { useAllClustersFailed } from '../useAllClustersFailed';
import { ClusterError } from '@red-hat-developer-hub/backstage-plugin-konflux-common';

describe('useAllClustersFailed', () => {
  const mockClusterError: ClusterError = {
    cluster: 'cluster1',
    namespace: 'namespace1',
    message: 'Test error',
  };

  it('should return true when loaded, no data, and has errors', () => {
    const { result } = renderHook(() =>
      useAllClustersFailed(true, [], [mockClusterError]),
    );

    expect(result.current).toBe(true);
  });

  it('should return true when loaded, undefined data, and has errors', () => {
    const { result } = renderHook(() =>
      useAllClustersFailed(true, undefined, [mockClusterError]),
    );

    expect(result.current).toBe(true);
  });

  it('should return false when not loaded', () => {
    const { result } = renderHook(() =>
      useAllClustersFailed(false, [], [mockClusterError]),
    );

    expect(result.current).toBe(false);
  });

  it('should return false when loaded but has data', () => {
    const { result } = renderHook(() =>
      useAllClustersFailed(true, [{ id: 1 }], [mockClusterError]),
    );

    expect(result.current).toBe(false);
  });

  it('should return false when loaded, no data, but no errors', () => {
    const { result } = renderHook(() => useAllClustersFailed(true, [], []));

    expect(result.current).toBe(false);
  });

  it('should return false when loaded, no data, but undefined errors', () => {
    const { result } = renderHook(() =>
      useAllClustersFailed(true, [], undefined),
    );

    expect(result.current).toBe(false);
  });

  it('should return false when loaded, has data, and has errors', () => {
    const { result } = renderHook(() =>
      useAllClustersFailed(true, [{ id: 1 }, { id: 2 }], [mockClusterError]),
    );

    expect(result.current).toBe(false);
  });

  it('should return true with multiple errors', () => {
    const errors: ClusterError[] = [
      mockClusterError,
      {
        cluster: 'cluster2',
        namespace: 'namespace2',
        message: 'Another error',
      },
    ];

    const { result } = renderHook(() => useAllClustersFailed(true, [], errors));

    expect(result.current).toBe(true);
  });

  it('should memoize result and only recompute when dependencies change', () => {
    const { result, rerender } = renderHook(
      ({ loaded, data, errors }) => useAllClustersFailed(loaded, data, errors),
      {
        initialProps: {
          loaded: true,
          data: [],
          errors: [mockClusterError],
        },
      },
    );

    expect(result.current).toBe(true);

    // Rerender with same values - should return same result
    rerender({
      loaded: true,
      data: [],
      errors: [mockClusterError],
    });

    expect(result.current).toBe(true);

    // Change loaded to false - should return false
    rerender({
      loaded: false,
      data: [],
      errors: [mockClusterError],
    });

    expect(result.current).toBe(false);
  });

  it('should handle empty data array', () => {
    const { result } = renderHook(() =>
      useAllClustersFailed(true, [], [mockClusterError]),
    );

    expect(result.current).toBe(true);
  });

  it('should handle data with length 0', () => {
    const { result } = renderHook(() =>
      useAllClustersFailed(true, [], [mockClusterError]),
    );

    expect(result.current).toBe(true);
  });
});
