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

import type { ConfigApi, OAuthApi } from '@backstage/core-plugin-api';
import { ScmAuth } from '@backstage/integration-react';

/**
 * OAuth APIs and config used to build the merged `scmAuthApiRef` implementation.
 *
 * @alpha
 */
export type ScmAuthFactoryDeps = {
  github: OAuthApi;
  gitlab: OAuthApi;
  azure: OAuthApi;
  bitbucket: OAuthApi;
  configApi: ConfigApi;
};

/**
 * Builds a merged `ScmAuth` (from `@backstage/integration-react`) from platform
 * OAuth APIs and `integrations.*` host entries, matching classic RHDH app scmAuth
 * wiring.
 *
 * @alpha
 */
export function mergeScmAuthFromDeps(deps: ScmAuthFactoryDeps) {
  const { github, gitlab, azure, bitbucket, configApi } = deps;

  const providers = [
    { key: 'github' as const, ref: github, factory: ScmAuth.forGithub },
    { key: 'gitlab' as const, ref: gitlab, factory: ScmAuth.forGitlab },
    { key: 'azure' as const, ref: azure, factory: ScmAuth.forAzure },
    {
      key: 'bitbucket' as const,
      ref: bitbucket,
      factory: ScmAuth.forBitbucket,
    },
  ];

  const scmAuths = providers.flatMap(({ key, ref, factory }) => {
    const configs = configApi.getOptionalConfigArray(`integrations.${key}`);
    if (!configs?.length) {
      return [factory(ref)];
    }
    return configs.map(c => factory(ref, { host: c.getString('host') }));
  });

  return ScmAuth.merge(...scmAuths);
}
