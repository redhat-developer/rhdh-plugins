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
  getApplicationFromResource,
  matchesApplicationPattern,
  ReleaseResource,
  SubcomponentClusterConfig,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { safeToSorted } from '../../../utils/array';

export const getLatestRelease = (
  {
    subcomponent,
    cluster,
    namespace,
  }: { subcomponent: string; cluster: string; namespace: string },
  subcomponentConfigs: SubcomponentClusterConfig[],
  releases?: ReleaseResource[],
): ReleaseResource | null => {
  if (!releases) return null;

  // filter configs for this subcomponent+cluster+namespace combination
  const matchingConfigs = subcomponentConfigs.filter(
    config =>
      config.subcomponent === subcomponent &&
      config.cluster === cluster &&
      config.namespace === namespace,
  );

  // get all application patterns from matching configs
  const appPatterns = matchingConfigs.flatMap(
    config => config.applications ?? [],
  );
  const fetchesAll = appPatterns.length === 0 || appPatterns.includes('*');

  const filteredReleases = releases.filter(release => {
    const applicationName = getApplicationFromResource(release) || '';
    const matchesApp =
      fetchesAll || matchesApplicationPattern(applicationName, appPatterns);
    return (
      release.subcomponent?.name === subcomponent &&
      matchesApp &&
      release.cluster.name === cluster &&
      release.metadata?.namespace === namespace
    );
  });

  if (!filteredReleases?.length) return null;

  const compareFn = (a: ReleaseResource, b: ReleaseResource) =>
    new Date(b.metadata?.creationTimestamp || '').getTime() -
    new Date(a.metadata?.creationTimestamp || '').getTime();

  const sortedReleases = safeToSorted(filteredReleases, compareFn);

  if (!sortedReleases?.length) return null;

  return sortedReleases[0];
};
