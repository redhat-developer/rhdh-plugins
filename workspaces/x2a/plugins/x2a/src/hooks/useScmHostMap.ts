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
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import {
  buildScmHostMap,
  ScmProviderName,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

/**
 * Reads the Backstage `integrations:` config and returns a host-to-provider map.
 *
 * This enables SCM provider detection for hosts on custom domains
 * (e.g. self-hosted GitHub Enterprise, GitLab, Bitbucket Cloud).
 */
export function useScmHostMap(): Map<string, ScmProviderName> {
  const config = useApi(configApiRef);
  return useMemo(() => buildScmHostMap(config), [config]);
}
