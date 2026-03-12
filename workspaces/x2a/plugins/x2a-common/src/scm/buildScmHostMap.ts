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

import { Config } from '@backstage/config';
import { ScmProviderName } from './ScmProvider';
import { extractHostname } from './extractHostname';

/**
 * Mapping from Backstage `integrations:` config keys to x2a SCM provider names.
 */
const integrationKeyToProvider: ReadonlyArray<
  [configKey: string, provider: ScmProviderName]
> = [
  ['github', 'github'],
  ['gitlab', 'gitlab'],
  ['bitbucketCloud', 'bitbucket'],
  ['bitbucket', 'bitbucket'],
];

/**
 * Builds a host-to-provider mapping from the Backstage `integrations:` config section.
 *
 * This allows provider detection for SCM hosts on custom domains
 * (e.g. self-hosted GitHub Enterprise, GitLab, or Bitbucket).
 *
 * @example
 * ```yaml
 * integrations:
 *   github:
 *     - host: github.mycompany.com
 *   gitlab:
 *     - host: gitlab.internal.io
 * ```
 *
 * @param config - Backstage root config
 * @returns Map from hostname to ScmProviderName
 *
 * @public
 */
export function buildScmHostMap(config: Config): Map<string, ScmProviderName> {
  const map = new Map<string, ScmProviderName>();

  for (const [configKey, providerName] of integrationKeyToProvider) {
    const entries = config.getOptionalConfigArray(`integrations.${configKey}`);
    if (entries) {
      for (const entry of entries) {
        const raw = entry.getOptionalString('host');
        const host = raw ? extractHostname(raw) : undefined;
        if (host && !map.has(host)) {
          map.set(host, providerName);
        }
      }
    }
  }

  return map;
}
