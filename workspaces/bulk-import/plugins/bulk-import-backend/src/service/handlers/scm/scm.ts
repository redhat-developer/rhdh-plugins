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
import { ScmIntegrations } from '@backstage/integration';

import type { Paths } from '../../../generated/openapi';
import type { HandlerResponse } from '../handlers';

export async function findAllSCMHosts(
  config: Config,
): Promise<HandlerResponse<Paths.FindAllSCMHosts.Responses.$200>> {
  const integrations = ScmIntegrations.fromConfig(config);
  const githubHosts = integrations.github
    .list()
    .map(i => `https://${i.config.host}`);
  const gitlabHosts = integrations.gitlab
    .list()
    .map(i => i.config.baseUrl.replace(/\/$/, ''));
  return {
    statusCode: 200,
    responseBody: { github: githubHosts, gitlab: gitlabHosts },
  };
}
