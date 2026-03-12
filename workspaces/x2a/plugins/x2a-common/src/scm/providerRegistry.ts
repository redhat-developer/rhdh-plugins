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

import { ScmProvider, ScmProviderName } from './ScmProvider';
import { extractHostname } from './extractHostname';
import { githubProvider, gitlabProvider, bitbucketProvider } from './providers';

/**
 * Ordered list of providers checked by URL. First match wins.
 * GitLab is excluded from URL-based matching because it serves as the catch-all fallback.
 */
const providers: ScmProvider[] = [bitbucketProvider, githubProvider];

const fallbackProvider: ScmProvider = gitlabProvider;

const allProviders: ScmProvider[] = [...providers, fallbackProvider];

/**
 * Detects the ScmProvider for a given repository URL.
 *
 * When a `hostProviderMap` is supplied (built from the Backstage `integrations:` config
 * via {@link buildScmHostMap}), the hostname of the URL is looked up in the map first.
 * This enables detection of providers on custom domains (e.g. self-hosted GitHub Enterprise).
 *
 * Falls back to URL-based heuristics, then to the GitLab provider for unknown hosts.
 *
 * @param repoUrl - The repository URL to resolve
 * @param hostProviderMap - Optional host-to-provider mapping from config
 *
 * @public
 */
export function resolveScmProvider(
  repoUrl: string,
  hostProviderMap?: Map<string, ScmProviderName>,
): ScmProvider {
  if (hostProviderMap) {
    const host = extractHostname(repoUrl);
    if (host) {
      const name = hostProviderMap.get(host);
      if (name) {
        return resolveScmProviderByName(name);
      }
    }
  }

  return providers.find(p => p.matches(repoUrl)) ?? fallbackProvider;
}

/**
 * Returns the ScmProvider by its name. Throws for unknown names.
 *
 * @public
 */
export function resolveScmProviderByName(name: ScmProviderName): ScmProvider {
  const found = allProviders.find(p => p.name === name);
  if (!found) {
    throw new Error(`Unknown SCM provider: ${name}`);
  }
  return found;
}
