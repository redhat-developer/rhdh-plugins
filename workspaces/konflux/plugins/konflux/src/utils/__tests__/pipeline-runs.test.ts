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
  conditionsRunStatus,
  pipelineRunStatus,
  stripQueryStringParams,
  getSourceUrl,
  getDuration,
  calculateDuration,
  SucceedConditionReason,
  Condition,
} from '../pipeline-runs';
import {
  PipelineRunResource,
  PipelineRunLabel,
  runStatus,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';

describe('pipeline-runs', () => {
  const createMockPipelineRun = (
    overrides?: Partial<PipelineRunResource>,
  ): PipelineRunResource => ({
    kind: 'PipelineRun',
    apiVersion: 'v1',
    apiGroup: 'tekton.dev',
    metadata: {
      name: 'test-plr',
      namespace: 'default',
      labels: {},
      annotations: {},
    },
    subcomponent: { name: 'sub1' },
    cluster: { name: 'cluster1' },
    ...overrides,
  });

  const createMockCondition = (overrides?: Partial<Condition>): Condition => ({
    type: 'Succeeded',
    status: 'True',
    ...overrides,
  });

  describe('conditionsRunStatus', () => {
    it('should return Pending when conditions array is empty', () => {
      expect(conditionsRunStatus([])).toBe(runStatus.Pending);
    });

    it('should return Pending when conditions is null or undefined', () => {
      expect(conditionsRunStatus(null as any)).toBe(runStatus.Pending);
      expect(conditionsRunStatus(undefined as any)).toBe(runStatus.Pending);
    });

    it('should return Pending when no Succeeded condition exists', () => {
      const conditions: Condition[] = [
        createMockCondition({ type: 'Ready', status: 'True' }),
      ];
      expect(conditionsRunStatus(conditions)).toBe(runStatus.Pending);
    });

    it('should return Pending when Succeeded condition has no status', () => {
      const conditions: Condition[] = [
        createMockCondition({ type: 'Succeeded', status: undefined }),
      ];
      expect(conditionsRunStatus(conditions)).toBe(runStatus.Pending);
    });

    it('should return Succeeded when Succeeded condition status is True', () => {
      const conditions: Condition[] = [
        createMockCondition({ type: 'Succeeded', status: 'True' }),
      ];
      expect(conditionsRunStatus(conditions)).toBe(runStatus.Succeeded);
    });

    it('should return Failed when Succeeded condition status is False', () => {
      const conditions: Condition[] = [
        createMockCondition({ type: 'Succeeded', status: 'False' }),
      ];
      expect(conditionsRunStatus(conditions)).toBe(runStatus.Failed);
    });

    it('should return Running when Succeeded condition status is Unknown', () => {
      const conditions: Condition[] = [
        createMockCondition({ type: 'Succeeded', status: 'Unknown' }),
      ];
      expect(conditionsRunStatus(conditions)).toBe(runStatus.Running);
    });

    it('should return Cancelled when reason is PipelineRunStopped', () => {
      const conditions: Condition[] = [
        createMockCondition({
          type: 'Succeeded',
          status: 'False',
          reason: SucceedConditionReason.PipelineRunStopped,
        }),
      ];
      expect(conditionsRunStatus(conditions)).toBe(runStatus.Cancelled);
    });

    it('should return Cancelled when reason is PipelineRunCancelled', () => {
      const conditions: Condition[] = [
        createMockCondition({
          type: 'Succeeded',
          status: 'False',
          reason: SucceedConditionReason.PipelineRunCancelled,
        }),
      ];
      expect(conditionsRunStatus(conditions)).toBe(runStatus.Cancelled);
    });

    it('should return Cancelled when reason is TaskRunCancelled', () => {
      const conditions: Condition[] = [
        createMockCondition({
          type: 'Succeeded',
          status: 'False',
          reason: SucceedConditionReason.TaskRunCancelled,
        }),
      ];
      expect(conditionsRunStatus(conditions)).toBe(runStatus.Cancelled);
    });

    it('should return Cancelled when reason is Cancelled', () => {
      const conditions: Condition[] = [
        createMockCondition({
          type: 'Succeeded',
          status: 'False',
          reason: SucceedConditionReason.Cancelled,
        }),
      ];
      expect(conditionsRunStatus(conditions)).toBe(runStatus.Cancelled);
    });

    it('should return Failed when reason is PipelineRunStopping', () => {
      const conditions: Condition[] = [
        createMockCondition({
          type: 'Succeeded',
          status: 'False',
          reason: SucceedConditionReason.PipelineRunStopping,
        }),
      ];
      expect(conditionsRunStatus(conditions)).toBe(runStatus.Failed);
    });

    it('should return Failed when reason is TaskRunStopping', () => {
      const conditions: Condition[] = [
        createMockCondition({
          type: 'Succeeded',
          status: 'False',
          reason: SucceedConditionReason.TaskRunStopping,
        }),
      ];
      expect(conditionsRunStatus(conditions)).toBe(runStatus.Failed);
    });

    it('should return Pending when reason is CreateContainerConfigError', () => {
      const conditions: Condition[] = [
        createMockCondition({
          type: 'Succeeded',
          status: 'False',
          reason: SucceedConditionReason.CreateContainerConfigError,
        }),
      ];
      expect(conditionsRunStatus(conditions)).toBe(runStatus.Pending);
    });

    it('should return Pending when reason is ExceededNodeResources', () => {
      const conditions: Condition[] = [
        createMockCondition({
          type: 'Succeeded',
          status: 'False',
          reason: SucceedConditionReason.ExceededNodeResources,
        }),
      ];
      expect(conditionsRunStatus(conditions)).toBe(runStatus.Pending);
    });

    it('should return Pending when reason is ExceededResourceQuota', () => {
      const conditions: Condition[] = [
        createMockCondition({
          type: 'Succeeded',
          status: 'False',
          reason: SucceedConditionReason.ExceededResourceQuota,
        }),
      ];
      expect(conditionsRunStatus(conditions)).toBe(runStatus.Pending);
    });

    it('should return Pending when reason is PipelineRunPending', () => {
      const conditions: Condition[] = [
        createMockCondition({
          type: 'Succeeded',
          status: 'False',
          reason: SucceedConditionReason.PipelineRunPending,
        }),
      ];
      expect(conditionsRunStatus(conditions)).toBe(runStatus.Pending);
    });

    it('should return Skipped when reason is ConditionCheckFailed', () => {
      const conditions: Condition[] = [
        createMockCondition({
          type: 'Succeeded',
          status: 'False',
          reason: SucceedConditionReason.ConditionCheckFailed,
        }),
      ];
      expect(conditionsRunStatus(conditions)).toBe(runStatus.Skipped);
    });

    it('should return Cancelling when specStatus is PipelineRunCancelled and no cancelled condition', () => {
      const conditions: Condition[] = [
        createMockCondition({ type: 'Succeeded', status: 'True' }),
      ];
      expect(
        conditionsRunStatus(
          conditions,
          SucceedConditionReason.PipelineRunCancelled,
        ),
      ).toBe(runStatus.Cancelling);
    });

    it('should return Cancelling when specStatus is PipelineRunStopped and stopping condition exists', () => {
      const conditions: Condition[] = [
        createMockCondition({
          type: 'Succeeded',
          status: 'True',
          reason: 'StoppedRunningFinally',
        }),
      ];
      expect(
        conditionsRunStatus(
          conditions,
          SucceedConditionReason.PipelineRunStopped,
        ),
      ).toBe(runStatus.Cancelling);
    });

    it('should return status when reason matches status', () => {
      const conditions: Condition[] = [
        createMockCondition({
          type: 'Succeeded',
          status: 'True',
          reason: runStatus.Succeeded,
        }),
      ];
      expect(conditionsRunStatus(conditions)).toBe(runStatus.Succeeded);
    });

    it('should return default status for unknown reason', () => {
      const conditions: Condition[] = [
        createMockCondition({
          type: 'Succeeded',
          status: 'True',
          reason: 'UnknownReason',
        }),
      ];
      expect(conditionsRunStatus(conditions)).toBe(runStatus.Succeeded);
    });
  });

  describe('pipelineRunStatus', () => {
    it('should return status from conditions', () => {
      const plr = createMockPipelineRun({
        status: {
          conditions: [
            createMockCondition({ type: 'Succeeded', status: 'True' }),
          ],
        },
      });
      expect(pipelineRunStatus(plr)).toBe(runStatus.Succeeded);
    });

    it('should pass spec.status to conditionsRunStatus', () => {
      const plr = createMockPipelineRun({
        spec: {
          status: SucceedConditionReason.PipelineRunCancelled,
        },
        status: {
          conditions: [
            createMockCondition({ type: 'Succeeded', status: 'True' }),
          ],
        },
      });
      expect(pipelineRunStatus(plr)).toBe(runStatus.Cancelling);
    });

    it('should handle missing status', () => {
      const plr = createMockPipelineRun();
      expect(pipelineRunStatus(plr)).toBe(runStatus.Pending);
    });

    it('should handle missing conditions', () => {
      const plr = createMockPipelineRun({
        status: {},
      });
      expect(pipelineRunStatus(plr)).toBe(runStatus.Pending);
    });

    it('should handle null pipelineRun', () => {
      expect(pipelineRunStatus(null as any)).toBe(runStatus.Pending);
    });
  });

  describe('stripQueryStringParams', () => {
    it('should return undefined when url is undefined', () => {
      expect(stripQueryStringParams(undefined)).toBeUndefined();
    });

    it('should strip query parameters from URL', () => {
      const url = 'https://example.com/path?param1=value1&param2=value2';
      expect(stripQueryStringParams(url)).toBe('https://example.com/path');
    });

    it('should return URL without query params when no query params exist', () => {
      const url = 'https://example.com/path';
      expect(stripQueryStringParams(url)).toBe('https://example.com/path');
    });

    it('should handle URLs with hash fragments', () => {
      const url = 'https://example.com/path?param=value#fragment';
      expect(stripQueryStringParams(url)).toBe('https://example.com/path');
    });

    it('should handle URLs with multiple path segments', () => {
      const url = 'https://example.com/path/to/resource?param=value';
      expect(stripQueryStringParams(url)).toBe(
        'https://example.com/path/to/resource',
      );
    });
  });

  describe('getSourceUrl', () => {
    it('should return undefined when pipelineRun is null', () => {
      expect(getSourceUrl(null as any)).toBeUndefined();
    });

    it('should return undefined when pipelineRun is undefined', () => {
      expect(getSourceUrl(undefined as any)).toBeUndefined();
    });

    it('should return repo URL from COMMIT_FULL_REPO_URL_ANNOTATION', () => {
      const plr = createMockPipelineRun({
        metadata: {
          annotations: {
            [PipelineRunLabel.COMMIT_FULL_REPO_URL_ANNOTATION]:
              'https://github.com/org/repo?ref=main',
          },
        },
      });
      expect(getSourceUrl(plr)).toBe('https://github.com/org/repo');
    });

    it('should return repo URL from BUILD_SERVICE_REPO_ANNOTATION when COMMIT_FULL_REPO_URL_ANNOTATION is missing', () => {
      const plr = createMockPipelineRun({
        metadata: {
          annotations: {
            [PipelineRunLabel.BUILD_SERVICE_REPO_ANNOTATION]:
              'https://github.com/org/repo?ref=main',
          },
        },
      });
      expect(getSourceUrl(plr)).toBe('https://github.com/org/repo');
    });

    it('should prioritize COMMIT_FULL_REPO_URL_ANNOTATION over BUILD_SERVICE_REPO_ANNOTATION', () => {
      const plr = createMockPipelineRun({
        metadata: {
          annotations: {
            [PipelineRunLabel.COMMIT_FULL_REPO_URL_ANNOTATION]:
              'https://github.com/org/repo1',
            [PipelineRunLabel.BUILD_SERVICE_REPO_ANNOTATION]:
              'https://github.com/org/repo2',
          },
        },
      });
      expect(getSourceUrl(plr)).toBe('https://github.com/org/repo1');
    });

    it('should return undefined when no repo annotations exist', () => {
      const plr = createMockPipelineRun();
      expect(getSourceUrl(plr)).toBeUndefined();
    });

    it('should strip query parameters from annotation URLs', () => {
      const plr = createMockPipelineRun({
        metadata: {
          annotations: {
            [PipelineRunLabel.COMMIT_FULL_REPO_URL_ANNOTATION]:
              'https://github.com/org/repo?token=abc123&ref=main',
          },
        },
      });
      expect(getSourceUrl(plr)).toBe('https://github.com/org/repo');
    });
  });

  describe('getDuration', () => {
    it('should return "less than a second" for zero seconds', () => {
      expect(getDuration(0)).toBe('less than a second');
    });

    it('should return "less than a second" for negative seconds', () => {
      expect(getDuration(-1)).toBe('less than a second');
    });

    it('should round small positive values to 1 second', () => {
      expect(getDuration(0.5)).toBe('1 s');
    });

    it('should format seconds correctly', () => {
      expect(getDuration(30)).toBe('30 s');
    });

    it('should format minutes correctly', () => {
      expect(getDuration(120)).toBe('2 m');
    });

    it('should format hours correctly', () => {
      expect(getDuration(3600)).toBe('1 h');
    });

    it('should format hours and minutes correctly', () => {
      expect(getDuration(3660)).toBe('1 h 1 m');
    });

    it('should format hours, minutes, and seconds correctly', () => {
      expect(getDuration(3665)).toBe('1 h 1 m 5 s');
    });

    it('should format long duration correctly', () => {
      expect(getDuration(3665, true)).toBe('1 hour 1 minute 5 seconds');
    });

    it('should use singular forms in long format', () => {
      expect(getDuration(3601, true)).toBe('1 hour 1 second');
      expect(getDuration(61, true)).toBe('1 minute 1 second');
    });

    it('should round seconds', () => {
      expect(getDuration(30.7)).toBe('31 s');
      expect(getDuration(30.3)).toBe('30 s');
    });

    it('should handle large durations', () => {
      expect(getDuration(86400)).toBe('24 h');
      expect(getDuration(86400, true)).toBe('24 hours');
    });

    it('should handle minutes without seconds', () => {
      expect(getDuration(120)).toBe('2 m');
      expect(getDuration(120, true)).toBe('2 minutes');
    });

    it('should handle hours without minutes or seconds', () => {
      expect(getDuration(7200)).toBe('2 h');
      expect(getDuration(7200, true)).toBe('2 hours');
    });
  });

  describe('calculateDuration', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should calculate duration between two timestamps', () => {
      const startTime = '2024-01-01T00:00:00Z';
      const endTime = '2024-01-01T00:01:30Z';
      expect(calculateDuration(startTime, endTime)).toBe('1 minute 30 seconds');
    });

    it('should use current time when endTime is not provided', () => {
      const startTime = new Date('2024-01-01T00:00:00Z');
      jest.setSystemTime(new Date('2024-01-01T00:01:00Z'));
      expect(calculateDuration(startTime.getTime())).toBe('1 minute');
    });

    it('should handle string timestamps', () => {
      const startTime = '2024-01-01T00:00:00Z';
      const endTime = '2024-01-01T01:00:00Z';
      expect(calculateDuration(startTime, endTime)).toBe('1 hour');
    });

    it('should handle numeric timestamps', () => {
      const startTime = new Date('2024-01-01T00:00:00Z').getTime();
      const endTime = new Date('2024-01-01T00:00:30Z').getTime();
      expect(calculateDuration(startTime, endTime)).toBe('30 seconds');
    });

    it('should handle zero duration', () => {
      const startTime = '2024-01-01T00:00:00Z';
      const endTime = '2024-01-01T00:00:00Z';
      expect(calculateDuration(startTime, endTime)).toBe('less than a second');
    });

    it('should handle very short durations', () => {
      const startTime = new Date('2024-01-01T00:00:00Z').getTime();
      const endTime = new Date('2024-01-01T00:00:00.5Z').getTime();
      // 0.5 seconds rounds to 1 second
      expect(calculateDuration(startTime, endTime)).toBe('1 second');
    });
  });
});
