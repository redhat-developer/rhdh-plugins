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

import { PipelineRunLabel } from './pipeline-runs';
import { K8sResourceCommonWithClusterInfo } from './types';

/**
 * Extracts the application name from a Kubernetes resource.
 *
 * @public
 */
export const getApplicationFromResource = (
  resource: K8sResourceCommonWithClusterInfo | undefined | null,
): string | undefined => {
  if (!resource) {
    return undefined;
  }

  if (resource.kind === 'Application') {
    return resource.metadata?.name;
  }

  if (resource.kind === 'PipelineRun' || resource.kind === 'Release') {
    return (
      resource.metadata?.labels?.[PipelineRunLabel.APPLICATION] ||
      (resource.spec?.application as string | undefined)
    );
  }

  return resource.spec?.application as string | undefined;
};
