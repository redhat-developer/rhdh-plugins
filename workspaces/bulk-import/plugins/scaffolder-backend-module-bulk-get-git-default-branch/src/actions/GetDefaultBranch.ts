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
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { ScmIntegrations } from '@backstage/integration';
import { z } from 'zod';
import { Octokit } from '@octokit/rest';
import { GithubIntegration } from '@backstage/integration';
import { parseQueryGitUrl } from './utils';
import gitUrlParse from 'git-url-parse';

export const createGetDefaultBranchAction = (options: {
  integrations: ScmIntegrations;
}) => {
  const { integrations } = options;

  return createTemplateAction({
    id: 'git:get-default-repository-branch',
    description: 'Gets the default branch of a repository.',
    schema: {
      input: () =>
        z.object({
          repoUrl: z.string({
            description: 'A URL to the repository',
          }),
        }),
      output: () =>
        z.object({
          defaultBranch: z
            .string()
            .describe('The default branch of the repository'),
        }),
    },
    async handler(ctx) {
      const { repoUrl } = ctx.input;

      let owner: string;
      let repo: string;
      let gitUrl: string;
      if (repoUrl.startsWith('https://')) {
        // Full GitHub URL – e.g. https://github.com/org/repo
        const result = gitUrlParse(repoUrl);
        repo = result.name;
        owner = result.owner;
        gitUrl = repoUrl;
      } else if (repoUrl.startsWith('github.com')) {
        let baseUrl: string;
        // Query‑string style – e.g. github.com?owner=org&repo=my-repo
        ({ owner, repo, baseUrl } = parseQueryGitUrl(repoUrl));
        gitUrl = `https://${baseUrl}/${owner}/${repo}`;
      } else {
        throw new Error(`Unable to parse url ${repoUrl}`);
      }

      const integration = integrations.byUrl(gitUrl);
      if (!integration) {
        throw new Error(`No integration found for location ${repoUrl}`);
      }

      const octokit = new Octokit({
        auth: (integration as GithubIntegration).config.token!,
      });

      const { data } = await octokit.repos.get({
        owner,
        repo,
      });

      console.log('===== ', data.default_branch);

      ctx.output('defaultBranch', data.default_branch);
    },
  });
};
