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
  PipelineRunLabel,
  PipelineRunResource,
  ReleaseResource,
  runStatus,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { getReleaseStatus } from '../../hooks/useReleaseStatus';
import { pipelineRunStatus } from '../../utils/pipeline-runs';
import { LatestPipelineRunByType } from './types';
import { safeToSorted } from '../../utils/array';

const compareDate = (
  resourceA: PipelineRunResource | ReleaseResource,
  resourceB: PipelineRunResource | ReleaseResource,
): number =>
  new Date(resourceB.metadata?.creationTimestamp || '').getTime() -
  new Date(resourceA.metadata?.creationTimestamp || '').getTime();

export const getLatestPLRs = (
  subcomponentName: string,
  plrs: PipelineRunResource[] | undefined,
  releases: ReleaseResource[] | undefined,
): LatestPipelineRunByType => {
  if (!plrs && !releases) return { test: null, build: null, release: null };

  const filteredPLRs = plrs?.filter(
    plr => plr.subcomponent.name === subcomponentName,
  );

  const filteredReleases = releases?.filter(
    plr => plr.subcomponent.name === subcomponentName,
  );

  if (!filteredPLRs?.length && !filteredReleases?.length) {
    return { test: null, build: null, release: null };
  }

  const testPLRs = filteredPLRs?.filter(
    plr => plr.metadata?.labels?.[PipelineRunLabel.PIPELINE_TYPE] === 'test',
  );
  const buildPLRs = filteredPLRs?.filter(
    plr => plr.metadata?.labels?.[PipelineRunLabel.PIPELINE_TYPE] === 'build',
  );

  const sortedTestPLRs = safeToSorted(testPLRs, compareDate);
  const sortedBuildPLRs = safeToSorted(buildPLRs, compareDate);
  const sortedReleasePLRs = safeToSorted(filteredReleases, compareDate);

  return {
    test: sortedTestPLRs?.[0] || null,
    build: sortedBuildPLRs?.[0] || null,
    release: sortedReleasePLRs?.[0] || null,
  };
};

export const getClassNameFromRunStatus = (status: runStatus): string => {
  switch (status) {
    case runStatus.Failed:
    case runStatus.FailedToStart:
    case runStatus.TestFailed: {
      return 'status-error';
    }
    case runStatus.Succeeded: {
      return 'status-success';
    }
    case runStatus.Cancelled:
    case runStatus.Cancelling: {
      return 'status-warning';
    }
    default: {
      return 'status-unknown';
    }
  }
};

export const getGeneralStatus = (
  latestPipelineRunByType: LatestPipelineRunByType,
): string => {
  let status = runStatus.Pending;
  const buildStatus = latestPipelineRunByType.build
    ? pipelineRunStatus(latestPipelineRunByType.build)
    : null;
  const testStatus = latestPipelineRunByType.test
    ? pipelineRunStatus(latestPipelineRunByType.test)
    : null;
  const releaseStatus = latestPipelineRunByType.release
    ? getReleaseStatus(latestPipelineRunByType.release)
    : null;

  const allStatuses = [buildStatus, testStatus, releaseStatus];
  const existingStatuses = allStatuses.filter(s => !!s);

  if (existingStatuses.length === 0) {
    return getClassNameFromRunStatus(runStatus.Pending);
  }

  if (
    allStatuses.some(
      s =>
        s === runStatus.Failed ||
        s === runStatus.FailedToStart ||
        s === runStatus.TestFailed,
    )
  ) {
    status = runStatus.Failed;
    return getClassNameFromRunStatus(status);
  }

  if (existingStatuses.every(s => s === runStatus.Succeeded)) {
    status = runStatus.Succeeded;
    return getClassNameFromRunStatus(status);
  }

  if (
    allStatuses.some(
      s => s === runStatus.Cancelled || s === runStatus.Cancelling,
    )
  ) {
    status = runStatus.Cancelled;
    return getClassNameFromRunStatus(status);
  }

  return getClassNameFromRunStatus(status);
};
