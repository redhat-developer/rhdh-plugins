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
import { useReleaseStatus, getReleaseStatus } from '../useReleaseStatus';
import {
  ReleaseResource,
  ReleaseCondition,
  runStatus,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';

describe('useReleaseStatus', () => {
  const createMockRelease = (
    conditions?: Array<{
      type?: ReleaseCondition;
      reason?: string;
      status?: string;
      message?: string;
    }>,
  ): ReleaseResource => ({
    kind: 'Release',
    apiVersion: 'v1',
    metadata: {
      name: 'test-release',
      namespace: 'default',
    },
    subcomponent: { name: 'sub1' },
    cluster: { name: 'cluster1' },
    status: conditions
      ? {
          conditions,
        }
      : undefined,
  });

  it('should return Unknown when release is null', () => {
    const result = getReleaseStatus(null);
    expect(result).toBe(runStatus.Unknown);
  });

  it('should return Unknown when release has no status', () => {
    const release = createMockRelease();
    const result = getReleaseStatus(release);
    expect(result).toBe(runStatus.Unknown);
  });

  it('should return Unknown when release has no conditions', () => {
    const release = createMockRelease([]);
    const result = getReleaseStatus(release);
    expect(result).toBe(runStatus.Unknown);
  });

  it('should return Unknown when no Released condition exists', () => {
    const release = createMockRelease([
      {
        type: ReleaseCondition.Processed,
        reason: 'Processed',
        status: 'True',
      },
      {
        type: ReleaseCondition.Validated,
        reason: 'Validated',
        status: 'True',
      },
    ]);
    const result = getReleaseStatus(release);
    expect(result).toBe(runStatus.Unknown);
  });

  it('should return Succeeded when Released condition is True with Succeeded reason', () => {
    const release = createMockRelease([
      {
        type: ReleaseCondition.Released,
        reason: 'Succeeded',
        status: 'True',
      },
    ]);
    const result = getReleaseStatus(release);
    expect(result).toBe(runStatus.Succeeded);
  });

  it('should return In Progress when Released condition reason is Progressing', () => {
    const release = createMockRelease([
      {
        type: ReleaseCondition.Released,
        reason: 'Progressing',
        status: 'True',
      },
    ]);
    const result = getReleaseStatus(release);
    expect(result).toBe(runStatus['In Progress']);
  });

  it('should return Failed when Released condition reason is Failed and status is False', () => {
    const release = createMockRelease([
      {
        type: ReleaseCondition.Released,
        reason: 'Failed',
        status: 'False',
      },
    ]);
    const result = getReleaseStatus(release);
    expect(result).toBe(runStatus.Failed);
  });

  it('should return Pending when Released condition exists but does not match any known state', () => {
    const release = createMockRelease([
      {
        type: ReleaseCondition.Released,
        reason: 'UnknownReason',
        status: 'Unknown',
      },
    ]);
    const result = getReleaseStatus(release);
    expect(result).toBe(runStatus.Pending);
  });

  it('should return Pending when Released condition has Succeeded reason but status is not True', () => {
    const release = createMockRelease([
      {
        type: ReleaseCondition.Released,
        reason: 'Succeeded',
        status: 'False',
      },
    ]);
    const result = getReleaseStatus(release);
    expect(result).toBe(runStatus.Pending);
  });

  it('should return Pending when Released condition has Failed reason but status is not False', () => {
    const release = createMockRelease([
      {
        type: ReleaseCondition.Released,
        reason: 'Failed',
        status: 'True',
      },
    ]);
    const result = getReleaseStatus(release);
    expect(result).toBe(runStatus.Pending);
  });

  it('should find Released condition among multiple conditions', () => {
    const release = createMockRelease([
      {
        type: ReleaseCondition.Processed,
        reason: 'Processed',
        status: 'True',
      },
      {
        type: ReleaseCondition.Released,
        reason: 'Succeeded',
        status: 'True',
      },
      {
        type: ReleaseCondition.Validated,
        reason: 'Validated',
        status: 'True',
      },
    ]);
    const result = getReleaseStatus(release);
    expect(result).toBe(runStatus.Succeeded);
  });

  it('should return Succeeded when release has Succeeded condition', () => {
    const release = createMockRelease([
      {
        type: ReleaseCondition.Released,
        reason: 'Succeeded',
        status: 'True',
      },
    ]);
    const { result } = renderHook(() => useReleaseStatus(release));
    expect(result.current).toBe(runStatus.Succeeded);
  });

  it('should memoize result when release object reference does not change', () => {
    const release = createMockRelease([
      {
        type: ReleaseCondition.Released,
        reason: 'Succeeded',
        status: 'True',
      },
    ]);
    const { result, rerender } = renderHook(() => useReleaseStatus(release));

    const firstResult = result.current;
    expect(firstResult).toBe(runStatus.Succeeded);

    // Rerender with same release object
    rerender();
    expect(result.current).toBe(firstResult);
  });

  it('should recalculate when release object reference changes', () => {
    const release1 = createMockRelease([
      {
        type: ReleaseCondition.Released,
        reason: 'Succeeded',
        status: 'True',
      },
    ]);
    const release2 = createMockRelease([
      {
        type: ReleaseCondition.Released,
        reason: 'Failed',
        status: 'False',
      },
    ]);

    const { result, rerender } = renderHook(
      ({ release }) => useReleaseStatus(release),
      {
        initialProps: { release: release1 },
      },
    );

    expect(result.current).toBe(runStatus.Succeeded);

    rerender({ release: release2 });
    expect(result.current).toBe(runStatus.Failed);
  });

  it('should recalculate when release status changes', () => {
    const release = createMockRelease([
      {
        type: ReleaseCondition.Released,
        reason: 'Progressing',
        status: 'True',
      },
    ]);

    const { result, rerender } = renderHook(
      ({ release: hookRelease }) => useReleaseStatus(hookRelease),
      {
        initialProps: { release },
      },
    );

    expect(result.current).toBe(runStatus['In Progress']);

    // Update the release condition
    const updatedRelease = createMockRelease([
      {
        type: ReleaseCondition.Released,
        reason: 'Succeeded',
        status: 'True',
      },
    ]);

    rerender({ release: updatedRelease });
    expect(result.current).toBe(runStatus.Succeeded);
  });
});
