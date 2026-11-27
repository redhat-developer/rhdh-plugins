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
  extractHost,
  type ScmProviderName,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

/**
 * Host (with a non-default port), lowercased. Accepts a bare host or a URL,
 * so the auth provider's `audience` (`https://gitlab.example.com`) can be
 * copied as is, and a default port (`:443`) is dropped.
 */
export const normalizeHost = (host: string | undefined) => {
  const trimmed = host?.trim();
  if (!trimmed) return undefined;
  return (extractHost(trimmed) ?? trimmed).toLocaleLowerCase('en-US');
};

/**
 * The host each SCM OAuth provider is registered against, from
 * `x2a.scm.authHosts`.
 *
 * Backstage auth providers are configured per provider type, so the token
 * they issue is only valid for one host. There is deliberately no default for
 * any provider: an unset key means no host of that type may be sent a token.
 * Bitbucket Cloud has a single valid host, `bitbucket.org`; set
 * `x2a.scm.authHosts.bitbucket` to it to offer and authenticate Bitbucket.
 * Any other value does not match and leaves it hidden.
 */
export function useScmAuthHosts() {
  const config = useApi(configApiRef);
  return useMemo(() => {
    const authHosts: Record<ScmProviderName, string | undefined> = {
      github: normalizeHost(
        config.getOptionalString('x2a.scm.authHosts.github'),
      ),
      gitlab: normalizeHost(
        config.getOptionalString('x2a.scm.authHosts.gitlab'),
      ),
      bitbucket: normalizeHost(
        config.getOptionalString('x2a.scm.authHosts.bitbucket'),
      ),
    };
    return {
      /** Host the provider's token may be used for, if configured. */
      authHostFor: (provider: ScmProviderName) => authHosts[provider],
      /** Whether the provider's token may be sent to `host`. */
      isAuthHost: (host: string | undefined, provider: ScmProviderName) => {
        const expected = authHosts[provider];
        return !!expected && normalizeHost(host) === expected;
      },
    };
  }, [config]);
}
