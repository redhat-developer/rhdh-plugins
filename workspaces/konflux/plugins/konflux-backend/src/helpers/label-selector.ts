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
  SubcomponentClusterConfig,
  Filters,
  PipelineRunLabel,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';

/**
 * Helper: Build label selector for filtering resources
 */
export const buildLabelSelector = (
  resource: string,
  combination: SubcomponentClusterConfig,
  filters?: Filters,
): string | undefined => {
  const resourcesWithLabels = ['pipelineruns', 'releases'];
  if (!resourcesWithLabels.includes(resource)) {
    return undefined;
  }

  const labelSelectors: string[] = [];

  // Add application filter
  if (
    combination.applications?.length &&
    combination.applications?.length > 0
  ) {
    if (combination.applications.length === 1) {
      labelSelectors.push(
        `${PipelineRunLabel.APPLICATION}=${combination.applications[0]}`,
      );
    } else {
      labelSelectors.push(
        `${PipelineRunLabel.APPLICATION} in (${combination.applications.join(
          ',',
        )})`,
      );
    }
  }

  // Add component filter if provided
  if (filters?.component) {
    labelSelectors.push(`${PipelineRunLabel.COMPONENT}=${filters.component}`);
  }

  return labelSelectors.length > 0 ? labelSelectors.join(',') : undefined;
};
