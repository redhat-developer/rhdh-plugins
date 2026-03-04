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

import type { LoggerService } from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import {
  DefaultGithubCredentialsProvider,
  ScmIntegrations,
} from '@backstage/integration';
import { Octokit } from '@octokit/rest';

interface GitHubDependabotAlert {
  number: number;
  description: string;
  created_at: string;
  state: string;
  security_advisory: {
    severity: string;
  };
}

export type DependabotAlert = GitHubDependabotAlert;

const PER_PAGE = 100;
export class DependabotClient {
  private readonly integrations: ScmIntegrations;
  private readonly logger: LoggerService;

  constructor(config: Config, logger: LoggerService) {
    this.integrations = ScmIntegrations.fromConfig(config);
    this.logger = logger.child({ component: 'DependabotClient' });
  }

  private async getOctokit(url: string): Promise<Octokit> {
    const githubIntegration = this.integrations.github.byUrl(url);
    if (!githubIntegration) {
      throw new Error(`Missing GitHub integration for '${url}'`);
    }

    const baseUrl = githubIntegration.config.apiBaseUrl;
    if (!baseUrl) {
      throw new Error(`Missing GitHub API base URL for '${url}'`);
    }

    const credentialsProvider =
      DefaultGithubCredentialsProvider.fromIntegrations(this.integrations);

    const { token, headers } = await credentialsProvider.getCredentials({
      url,
    });

    if (!token) {
      throw new Error(`Missing GitHub token for '${url}'`);
    }

    return new Octokit({
      auth: token,
      baseUrl: baseUrl.replace(/\/$/, ''),
    });
  }
  /**
   * @param url - The URL of the repository.
   * @param repository - The repository owner and name.
   * @param severity - The severity of the alerts to fetch.
   * @returns All alerts for the given repository and severity.
   */
  async getAlerts(
    url: string,
    repository: { owner: string; repo: string },
    severity: 'critical' | 'high' | 'medium' | 'low',
  ): Promise<DependabotAlert[]> {
    this.logger.debug(
      `Fetching Dependabot ${severity} alerts for ${repository.owner}/${repository.repo}`,
    );
    try {
      const octokit = await this.getOctokit(url);

      const allAlerts = (await octokit.paginate(
        'GET /repos/{owner}/{repo}/dependabot/alerts',
        {
          owner: repository.owner,
          repo: repository.repo,
          state: 'open',
          severity,
          per_page: PER_PAGE,
        },
      )) as unknown as DependabotAlert[];

      this.logger.info(
        `Fetched ${allAlerts.length} Dependabot ${severity} alert(s) for ${repository.owner}/${repository.repo}`,
      );
      return allAlerts;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to fetch Dependabot ${severity} alerts for ${repository.owner}/${repository.repo}: ${message}`,
        error,
      );
      throw error;
    }
  }
}
