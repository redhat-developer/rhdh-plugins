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

import { useMemo } from 'react';
import {
  ReleaseCondition,
  ReleaseResource,
  runStatus,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';

export const getReleaseStatus = (release: ReleaseResource | null) => {
  if (!release?.status?.conditions) {
    return runStatus.Unknown;
  }

  const releasedCondition = release.status.conditions?.find(
    c => c.type === ReleaseCondition.Released,
  );

  if (!releasedCondition) {
    return runStatus.Unknown;
  }

  const succeeded =
    releasedCondition.status === 'True' &&
    releasedCondition.reason === 'Succeeded';
  if (succeeded) {
    return runStatus.Succeeded;
  }
  const progressing = releasedCondition.reason === 'Progressing';
  if (progressing) {
    return runStatus['In Progress'];
  }

  const failed =
    releasedCondition.reason === 'Failed' &&
    releasedCondition.status === 'False';
  if (failed) {
    return runStatus.Failed;
  }

  return runStatus.Pending;
};

export const useReleaseStatus = (release: ReleaseResource | null) => {
  return useMemo(() => getReleaseStatus(release), [release]);
};
