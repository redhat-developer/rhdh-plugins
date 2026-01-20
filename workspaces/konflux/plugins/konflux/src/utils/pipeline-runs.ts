/* eslint-disable no-nested-ternary */
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
  K8sResourceCommonWithClusterInfo,
  PipelineRunLabel,
  PipelineRunResource,
  runStatus,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';

export type Condition = {
  type: string;
  status: string;
  reason?: string;
  message?: string;
  binding?: string;
  lastTransitionTime?: string;
};

export enum SucceedConditionReason {
  PipelineRunStopped = 'StoppedRunFinally',
  PipelineRunCancelled = 'CancelledRunFinally',
  TaskRunCancelled = 'TaskRunCancelled',
  Cancelled = 'Cancelled',
  PipelineRunStopping = 'PipelineRunStopping',
  PipelineRunPending = 'PipelineRunPending',
  TaskRunStopping = 'TaskRunStopping',
  CreateContainerConfigError = 'CreateContainerConfigError',
  ExceededNodeResources = 'ExceededNodeResources',
  ExceededResourceQuota = 'ExceededResourceQuota',
  ConditionCheckFailed = 'ConditionCheckFailed',
}

export enum PipelineRunType {
  BUILD = 'build',
  RELEASE = 'release',
  TEST = 'test',
  TENANT = 'tenant',
  MANAGED = 'managed',
  FINAL = 'final',
}

export enum PipelineRunEventType {
  PUSH = 'push',
  GITLAB_PUSH = 'Push',
  PULL = 'pull_request',
  INCOMING = 'incoming',
  RETEST = 'retest-all-comment',
}

export enum PipelineRunEventTypeLabel {
  push = 'Push',
  pull_request = 'Pull Request',
  incoming = 'Incoming',
  'retest-all-comment' = 'Retest All Comment',
}

export type Commit = K8sResourceCommonWithClusterInfo & {
  metadata: {
    name: string;
    uid: string;
  };
  sha: string;
  shaURL: string;
  displayName?: string;
  user?: string;
  components: string[];
  repoName?: string;
  repoURL?: string;
  repoOrg?: string;
  gitProvider?: string;
  branch: string;
  creationTime?: string;
  pipelineRuns: PipelineRunResource[];
  application?: string;
  shaTitle?: string;
  isPullRequest: boolean;
  pullRequestNumber?: string;
  eventType?: keyof typeof PipelineRunEventTypeLabel;
};

export const conditionsRunStatus = (
  conditions: Condition[],
  specStatus?: string,
): runStatus => {
  if (!conditions?.length) {
    return runStatus.Pending;
  }

  const cancelledCondition = conditions.find(c => c.reason === 'Cancelled');
  const stoppingCondition = conditions.find(
    c => c.reason === 'StoppedRunningFinally',
  );
  const succeedCondition = conditions.find(c => c.type === 'Succeeded');

  if (!succeedCondition?.status) {
    return runStatus.Pending;
  }

  let status: runStatus;
  if (succeedCondition.status === 'True') {
    status = runStatus.Succeeded;
  } else if (succeedCondition.status === 'False') {
    status = runStatus.Failed;
  } else {
    status = runStatus.Running;
  }

  if (
    (specStatus === SucceedConditionReason.PipelineRunCancelled &&
      !cancelledCondition) ||
    (specStatus === SucceedConditionReason.PipelineRunStopped &&
      stoppingCondition)
  ) {
    return runStatus.Cancelling;
  }

  if (!succeedCondition.reason || succeedCondition.reason === status) {
    return status;
  }

  switch (succeedCondition.reason) {
    case SucceedConditionReason.PipelineRunStopped:
    case SucceedConditionReason.PipelineRunCancelled:
    case SucceedConditionReason.TaskRunCancelled:
    case SucceedConditionReason.Cancelled:
      return runStatus.Cancelled;
    case SucceedConditionReason.PipelineRunStopping:
    case SucceedConditionReason.TaskRunStopping:
      return runStatus.Failed;
    case SucceedConditionReason.CreateContainerConfigError:
    case SucceedConditionReason.ExceededNodeResources:
    case SucceedConditionReason.ExceededResourceQuota:
    case SucceedConditionReason.PipelineRunPending:
      return runStatus.Pending;
    case SucceedConditionReason.ConditionCheckFailed:
      return runStatus.Skipped;
    default:
      return status;
  }
};

export const pipelineRunStatus = (
  pipelineRun: PipelineRunResource,
): runStatus =>
  conditionsRunStatus(
    pipelineRun?.status?.conditions as Condition[],
    pipelineRun?.spec?.status as string | undefined,
  );

export const stripQueryStringParams = (url: string | undefined) => {
  if (!url) return undefined;

  const { origin, pathname } = new URL(url);
  return `${origin}${pathname}`;
};

export const getSourceUrl = (
  pipelineRun: PipelineRunResource,
): string | undefined => {
  if (!pipelineRun) {
    return undefined;
  }

  const repoFromBuildServiceAnnotation =
    pipelineRun.metadata?.annotations?.[
      PipelineRunLabel.BUILD_SERVICE_REPO_ANNOTATION
    ];
  const repoFromPACAnnotation =
    pipelineRun.metadata?.annotations?.[
      PipelineRunLabel.COMMIT_FULL_REPO_URL_ANNOTATION
    ];

  return stripQueryStringParams(
    repoFromPACAnnotation || repoFromBuildServiceAnnotation,
  );
};

/**
 * Format hours unit for duration string
 */
function formatHours(hours: number, long: boolean): string {
  if (long) {
    return hours === 1 ? `${hours} hour` : `${hours} hours`;
  }
  return `${hours} h`;
}

/**
 * Format minutes unit for duration string
 */
function formatMinutes(minutes: number, long: boolean): string {
  if (long) {
    return minutes === 1 ? `${minutes} minute` : `${minutes} minutes`;
  }
  return `${minutes} m`;
}

/**
 * Format seconds unit for duration string
 */
function formatSeconds(seconds: number, long: boolean): string {
  if (long) {
    return seconds === 1 ? `${seconds} second` : `${seconds} seconds`;
  }
  return `${seconds} s`;
}

/**
 * Convert seconds to hours, minutes, and seconds
 */
function convertSecondsToTimeUnits(totalSeconds: number): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  let sec = Math.round(totalSeconds);
  let min = 0;
  let hr = 0;

  if (sec >= 60) {
    min = Math.floor(sec / 60);
    sec %= 60;
  }
  if (min >= 60) {
    hr = Math.floor(min / 60);
    min %= 60;
  }

  return { hours: hr, minutes: min, seconds: sec };
}

export const getDuration = (seconds: number, long?: boolean): string => {
  if (!seconds || seconds <= 0) {
    return 'less than a second';
  }

  const { hours, minutes, seconds: sec } = convertSecondsToTimeUnits(seconds);
  const parts: string[] = [];

  if (hours > 0) {
    parts.push(formatHours(hours, !!long));
  }
  if (minutes > 0) {
    parts.push(formatMinutes(minutes, !!long));
  }
  if (sec > 0) {
    parts.push(formatSeconds(sec, !!long));
  }

  return parts.join(' ');
};

export const calculateDuration = (
  startTime: string | number,
  endTime?: string | number,
) => {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const durationInSeconds = (end - start) / 1000;
  return getDuration(durationInSeconds, true);
};
