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
import { configApiRef, useApi } from '@backstage/core-plugin-api';

type ApprovalToolConfig = {
  githubConfigured: boolean;
  gitlabConfigured: boolean;
  numberOfApprovalTools: number;
};

export function useNumberOfApprovalTools(): ApprovalToolConfig {
  const config = useApi(configApiRef);

  const githubIntegrations =
    config.getOptionalConfigArray('integrations.github') ?? [];
  const gitlabIntegrations =
    config.getOptionalConfigArray('integrations.gitlab') ?? [];

  const isGitHubConfigured = githubIntegrations.length > 0;
  const isGitLabConfigured = gitlabIntegrations.length > 0;

  return {
    githubConfigured: isGitHubConfigured,
    gitlabConfigured: isGitLabConfigured,
    numberOfApprovalTools:
      Number(isGitHubConfigured) + Number(isGitLabConfigured),
  };
}

export function useGitlabConfigured(): boolean {
  return useNumberOfApprovalTools().gitlabConfigured;
}
