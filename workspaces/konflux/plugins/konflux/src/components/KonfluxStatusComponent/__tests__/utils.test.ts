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

import {
  getLatestPLRs,
  getClassNameFromRunStatus,
  getGeneralStatus,
} from '../utils';
import {
  PipelineRunResource,
  ReleaseResource,
  PipelineRunLabel,
  runStatus,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { LatestPipelineRunByType } from '../types';
import { pipelineRunStatus } from '../../../utils/pipeline-runs';
import { getReleaseStatus } from '../../../hooks/useReleaseStatus';

// Mock the dependencies
jest.mock('../../../utils/pipeline-runs', () => ({
  ...jest.requireActual('../../../utils/pipeline-runs'),
  pipelineRunStatus: jest.fn(),
}));

jest.mock('../../../hooks/useReleaseStatus', () => ({
  ...jest.requireActual('../../../hooks/useReleaseStatus'),
  getReleaseStatus: jest.fn(),
}));

const mockPipelineRunStatus = pipelineRunStatus as jest.MockedFunction<
  typeof pipelineRunStatus
>;
const mockGetReleaseStatus = getReleaseStatus as jest.MockedFunction<
  typeof getReleaseStatus
>;

describe('utils', () => {
  const createMockPipelineRun = (
    name: string,
    type: string,
    subcomponent: string,
    creationTimestamp: string,
  ): PipelineRunResource => ({
    kind: 'PipelineRun',
    apiVersion: 'v1',
    metadata: {
      name,
      namespace: 'default',
      creationTimestamp,
      labels: {
        [PipelineRunLabel.PIPELINE_TYPE]: type,
      },
    },
    subcomponent: { name: subcomponent },
    cluster: { name: 'cluster1' },
  });

  const createMockRelease = (
    name: string,
    subcomponent: string,
    creationTimestamp: string,
  ): ReleaseResource => ({
    kind: 'Release',
    apiVersion: 'v1',
    metadata: {
      name,
      namespace: 'default',
      creationTimestamp,
    },
    subcomponent: { name: subcomponent },
    cluster: { name: 'cluster1' },
    application: 'app1',
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLatestPLRs', () => {
    it('should return null for all types when plrs and releases are undefined', () => {
      const result = getLatestPLRs('test-subcomponent', undefined, undefined);

      expect(result).toEqual({
        test: null,
        build: null,
        release: null,
      });
    });

    it('should return null for all types when plrs and releases are empty arrays', () => {
      const result = getLatestPLRs('test-subcomponent', [], []);

      expect(result).toEqual({
        test: null,
        build: null,
        release: null,
      });
    });

    it('should return null when no resources match the subcomponent', () => {
      const plrs = [
        createMockPipelineRun(
          'plr1',
          'build',
          'other-subcomponent',
          '2024-01-01T00:00:00Z',
        ),
      ];
      const releases = [
        createMockRelease(
          'release1',
          'other-subcomponent',
          '2024-01-01T00:00:00Z',
        ),
      ];

      const result = getLatestPLRs('test-subcomponent', plrs, releases);

      expect(result).toEqual({
        test: null,
        build: null,
        release: null,
      });
    });

    it('should filter pipeline runs by subcomponent name', () => {
      const plrs = [
        createMockPipelineRun(
          'plr1',
          'build',
          'test-subcomponent',
          '2024-01-01T00:00:00Z',
        ),
        createMockPipelineRun(
          'plr2',
          'build',
          'other-subcomponent',
          '2024-01-01T00:00:00Z',
        ),
      ];

      const result = getLatestPLRs('test-subcomponent', plrs, []);

      expect(result.build).not.toBeNull();
      expect(result.build?.metadata?.name).toBe('plr1');
      expect(result.test).toBeNull();
      expect(result.release).toBeNull();
    });

    it('should filter releases by subcomponent name', () => {
      const releases = [
        createMockRelease(
          'release1',
          'test-subcomponent',
          '2024-01-01T00:00:00Z',
        ),
        createMockRelease(
          'release2',
          'other-subcomponent',
          '2024-01-01T00:00:00Z',
        ),
      ];

      const result = getLatestPLRs('test-subcomponent', [], releases);

      expect(result.release).not.toBeNull();
      expect(result.release?.metadata?.name).toBe('release1');
      expect(result.build).toBeNull();
      expect(result.test).toBeNull();
    });

    it('should filter build and test pipeline runs by type', () => {
      const plrs = [
        createMockPipelineRun(
          'build1',
          'build',
          'test-subcomponent',
          '2024-01-01T00:00:00Z',
        ),
        createMockPipelineRun(
          'test1',
          'test',
          'test-subcomponent',
          '2024-01-01T00:00:00Z',
        ),
        createMockPipelineRun(
          'other1',
          'other',
          'test-subcomponent',
          '2024-01-01T00:00:00Z',
        ),
      ];

      const result = getLatestPLRs('test-subcomponent', plrs, []);

      expect(result.build).not.toBeNull();
      expect(result.build?.metadata?.name).toBe('build1');
      expect(result.test).not.toBeNull();
      expect(result.test?.metadata?.name).toBe('test1');
      expect(result.release).toBeNull();
    });

    it('should sort pipeline runs by creation timestamp and return the latest', () => {
      const plrs = [
        createMockPipelineRun(
          'build1',
          'build',
          'test-subcomponent',
          '2024-01-01T00:00:00Z',
        ),
        createMockPipelineRun(
          'build2',
          'build',
          'test-subcomponent',
          '2024-01-03T00:00:00Z',
        ),
        createMockPipelineRun(
          'build3',
          'build',
          'test-subcomponent',
          '2024-01-02T00:00:00Z',
        ),
      ];

      const result = getLatestPLRs('test-subcomponent', plrs, []);

      expect(result.build).not.toBeNull();
      expect(result.build?.metadata?.name).toBe('build2');
      expect(result.build?.metadata?.creationTimestamp).toBe(
        '2024-01-03T00:00:00Z',
      );
    });

    it('should sort releases by creation timestamp and return the latest', () => {
      const releases = [
        createMockRelease(
          'release1',
          'test-subcomponent',
          '2024-01-01T00:00:00Z',
        ),
        createMockRelease(
          'release2',
          'test-subcomponent',
          '2024-01-03T00:00:00Z',
        ),
        createMockRelease(
          'release3',
          'test-subcomponent',
          '2024-01-02T00:00:00Z',
        ),
      ];

      const result = getLatestPLRs('test-subcomponent', [], releases);

      expect(result.release).not.toBeNull();
      expect(result.release?.metadata?.name).toBe('release2');
      expect(result.release?.metadata?.creationTimestamp).toBe(
        '2024-01-03T00:00:00Z',
      );
    });

    it('should handle pipeline runs with missing creation timestamp', () => {
      const plr1 = createMockPipelineRun(
        'build1',
        'build',
        'test-subcomponent',
        '2024-01-01T00:00:00Z',
      );
      const plr2 = createMockPipelineRun(
        'build2',
        'build',
        'test-subcomponent',
        '2024-01-02T00:00:00Z',
      );
      delete plr1.metadata?.creationTimestamp;

      const result = getLatestPLRs('test-subcomponent', [plr1, plr2], []);

      // Should still return a result (behavior may vary based on sort)
      expect(result.build).not.toBeNull();
    });

    it('should return latest for each type independently', () => {
      const plrs = [
        createMockPipelineRun(
          'build1',
          'build',
          'test-subcomponent',
          '2024-01-01T00:00:00Z',
        ),
        createMockPipelineRun(
          'build2',
          'build',
          'test-subcomponent',
          '2024-01-03T00:00:00Z',
        ),
        createMockPipelineRun(
          'test1',
          'test',
          'test-subcomponent',
          '2024-01-02T00:00:00Z',
        ),
        createMockPipelineRun(
          'test2',
          'test',
          'test-subcomponent',
          '2024-01-04T00:00:00Z',
        ),
      ];
      const releases = [
        createMockRelease(
          'release1',
          'test-subcomponent',
          '2024-01-05T00:00:00Z',
        ),
      ];

      const result = getLatestPLRs('test-subcomponent', plrs, releases);

      expect(result.build?.metadata?.name).toBe('build2');
      expect(result.test?.metadata?.name).toBe('test2');
      expect(result.release?.metadata?.name).toBe('release1');
    });
  });

  describe('getClassNameFromRunStatus', () => {
    it('should return status-error for Failed status', () => {
      expect(getClassNameFromRunStatus(runStatus.Failed)).toBe('status-error');
    });

    it('should return status-error for FailedToStart status', () => {
      expect(getClassNameFromRunStatus(runStatus.FailedToStart)).toBe(
        'status-error',
      );
    });

    it('should return status-error for TestFailed status', () => {
      expect(getClassNameFromRunStatus(runStatus.TestFailed)).toBe(
        'status-error',
      );
    });

    it('should return status-success for Succeeded status', () => {
      expect(getClassNameFromRunStatus(runStatus.Succeeded)).toBe(
        'status-success',
      );
    });

    it('should return status-warning for Cancelled status', () => {
      expect(getClassNameFromRunStatus(runStatus.Cancelled)).toBe(
        'status-warning',
      );
    });

    it('should return status-warning for Cancelling status', () => {
      expect(getClassNameFromRunStatus(runStatus.Cancelling)).toBe(
        'status-warning',
      );
    });

    it('should return status-unknown for Pending status', () => {
      expect(getClassNameFromRunStatus(runStatus.Pending)).toBe(
        'status-unknown',
      );
    });

    it('should return status-unknown for Running status', () => {
      expect(getClassNameFromRunStatus(runStatus.Running)).toBe(
        'status-unknown',
      );
    });

    it('should return status-unknown for Unknown status', () => {
      expect(getClassNameFromRunStatus(runStatus.Unknown)).toBe(
        'status-unknown',
      );
    });
  });

  describe('getGeneralStatus', () => {
    const createMockLatestPipelineRunByType = (
      build: PipelineRunResource | null = null,
      test: PipelineRunResource | null = null,
      release: ReleaseResource | null = null,
    ): LatestPipelineRunByType => ({
      build,
      test,
      release,
    });

    beforeEach(() => {
      mockPipelineRunStatus.mockReturnValue(runStatus.Succeeded);
      mockGetReleaseStatus.mockReturnValue(runStatus.Succeeded);
    });

    it('should return status-error when any status is Failed', () => {
      const buildPLR = createMockPipelineRun(
        'build1',
        'build',
        'subcomp',
        '2024-01-01T00:00:00Z',
      );
      mockPipelineRunStatus.mockReturnValue(runStatus.Failed);

      const latestPipelineRunByType =
        createMockLatestPipelineRunByType(buildPLR);

      const result = getGeneralStatus(latestPipelineRunByType);

      expect(result).toBe('status-error');
    });

    it('should return status-error when any status is FailedToStart', () => {
      const testPLR = createMockPipelineRun(
        'test1',
        'test',
        'subcomp',
        '2024-01-01T00:00:00Z',
      );
      mockPipelineRunStatus.mockReturnValue(runStatus.FailedToStart);

      const latestPipelineRunByType = createMockLatestPipelineRunByType(
        null,
        testPLR,
      );

      const result = getGeneralStatus(latestPipelineRunByType);

      expect(result).toBe('status-error');
    });

    it('should return status-success when all statuses are Succeeded', () => {
      const buildPLR = createMockPipelineRun(
        'build1',
        'build',
        'subcomp',
        '2024-01-01T00:00:00Z',
      );
      const testPLR = createMockPipelineRun(
        'test1',
        'test',
        'subcomp',
        '2024-01-01T00:00:00Z',
      );
      const release = createMockRelease(
        'release1',
        'subcomp',
        '2024-01-01T00:00:00Z',
      );

      mockPipelineRunStatus.mockReturnValue(runStatus.Succeeded);
      mockGetReleaseStatus.mockReturnValue(runStatus.Succeeded);

      const latestPipelineRunByType = createMockLatestPipelineRunByType(
        buildPLR,
        testPLR,
        release,
      );

      const result = getGeneralStatus(latestPipelineRunByType);

      expect(result).toBe('status-success');
    });

    it('should return status-success when only existing statuses are Succeeded', () => {
      const buildPLR = createMockPipelineRun(
        'build1',
        'build',
        'subcomp',
        '2024-01-01T00:00:00Z',
      );
      mockPipelineRunStatus.mockReturnValue(runStatus.Succeeded);

      const latestPipelineRunByType = createMockLatestPipelineRunByType(
        buildPLR,
        null,
        null,
      );

      const result = getGeneralStatus(latestPipelineRunByType);

      expect(result).toBe('status-success');
    });

    it('should return status-warning when any status is Cancelled', () => {
      const buildPLR = createMockPipelineRun(
        'build1',
        'build',
        'subcomp',
        '2024-01-01T00:00:00Z',
      );
      mockPipelineRunStatus.mockReturnValue(runStatus.Cancelled);

      const latestPipelineRunByType =
        createMockLatestPipelineRunByType(buildPLR);

      const result = getGeneralStatus(latestPipelineRunByType);

      expect(result).toBe('status-warning');
    });

    it('should return status-warning when any status is Cancelling', () => {
      const testPLR = createMockPipelineRun(
        'test1',
        'test',
        'subcomp',
        '2024-01-01T00:00:00Z',
      );
      mockPipelineRunStatus.mockReturnValue(runStatus.Cancelling);

      const latestPipelineRunByType = createMockLatestPipelineRunByType(
        null,
        testPLR,
      );

      const result = getGeneralStatus(latestPipelineRunByType);

      expect(result).toBe('status-warning');
    });

    it('should return status-unknown for Pending status', () => {
      const buildPLR = createMockPipelineRun(
        'build1',
        'build',
        'subcomp',
        '2024-01-01T00:00:00Z',
      );
      mockPipelineRunStatus.mockReturnValue(runStatus.Pending);

      const latestPipelineRunByType =
        createMockLatestPipelineRunByType(buildPLR);

      const result = getGeneralStatus(latestPipelineRunByType);

      expect(result).toBe('status-unknown');
    });

    it('should return status-unknown when all are null', () => {
      const latestPipelineRunByType = createMockLatestPipelineRunByType(
        null,
        null,
        null,
      );

      const result = getGeneralStatus(latestPipelineRunByType);

      // When all are null, should return pending/unknown status
      expect(result).toBe('status-unknown');
    });

    it('should prioritize Failed over Succeeded', () => {
      const buildPLR = createMockPipelineRun(
        'build1',
        'build',
        'subcomp',
        '2024-01-01T00:00:00Z',
      );
      const testPLR = createMockPipelineRun(
        'test1',
        'test',
        'subcomp',
        '2024-01-01T00:00:00Z',
      );

      mockPipelineRunStatus
        .mockReturnValueOnce(runStatus.Failed) // build
        .mockReturnValueOnce(runStatus.Succeeded); // test

      const latestPipelineRunByType = createMockLatestPipelineRunByType(
        buildPLR,
        testPLR,
      );

      const result = getGeneralStatus(latestPipelineRunByType);

      expect(result).toBe('status-error');
    });

    it('should prioritize Failed over Cancelled', () => {
      const buildPLR = createMockPipelineRun(
        'build1',
        'build',
        'subcomp',
        '2024-01-01T00:00:00Z',
      );
      const testPLR = createMockPipelineRun(
        'test1',
        'test',
        'subcomp',
        '2024-01-01T00:00:00Z',
      );

      mockPipelineRunStatus
        .mockReturnValueOnce(runStatus.Failed) // build
        .mockReturnValueOnce(runStatus.Cancelled); // test

      const latestPipelineRunByType = createMockLatestPipelineRunByType(
        buildPLR,
        testPLR,
      );

      const result = getGeneralStatus(latestPipelineRunByType);

      expect(result).toBe('status-error');
    });

    it('should call pipelineRunStatus for build and test pipeline runs', () => {
      const buildPLR = createMockPipelineRun(
        'build1',
        'build',
        'subcomp',
        '2024-01-01T00:00:00Z',
      );
      const testPLR = createMockPipelineRun(
        'test1',
        'test',
        'subcomp',
        '2024-01-01T00:00:00Z',
      );

      const latestPipelineRunByType = createMockLatestPipelineRunByType(
        buildPLR,
        testPLR,
      );

      getGeneralStatus(latestPipelineRunByType);

      expect(mockPipelineRunStatus).toHaveBeenCalledTimes(2);
      expect(mockPipelineRunStatus).toHaveBeenCalledWith(buildPLR);
      expect(mockPipelineRunStatus).toHaveBeenCalledWith(testPLR);
    });

    it('should call getReleaseStatus for release', () => {
      const release = createMockRelease(
        'release1',
        'subcomp',
        '2024-01-01T00:00:00Z',
      );

      const latestPipelineRunByType = createMockLatestPipelineRunByType(
        null,
        null,
        release,
      );

      getGeneralStatus(latestPipelineRunByType);

      expect(mockGetReleaseStatus).toHaveBeenCalledTimes(1);
      expect(mockGetReleaseStatus).toHaveBeenCalledWith(release);
    });
  });
});
