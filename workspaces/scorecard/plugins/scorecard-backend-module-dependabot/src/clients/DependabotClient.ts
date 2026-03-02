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

/** Parse Link header and return the URL for rel="next", or null. */
function getNextPageUrl(linkHeader: string | null): string | null {
  if (!linkHeader || !linkHeader.includes('rel="next"')) {
    return null;
  }
  const nextPattern = /<([^>]+)>;\s*rel="next"/i;
  const match = linkHeader.match(nextPattern);
  return match ? match[1] : null;
}

export class DependabotClient {
  private readonly integrations: ScmIntegrations;
  private readonly logger: LoggerService;

  constructor(config: Config, logger: LoggerService) {
    this.integrations = ScmIntegrations.fromConfig(config);
    this.logger = logger.child({ component: 'DependabotClient' });
  }

  private async getRequestConfig(url: string): Promise<{
    baseUrl: string;
    headers: Record<string, string>;
  }> {
    const githubIntegration = this.integrations.github.byUrl(url);
    if (!githubIntegration) {
      throw new Error(`Missing GitHub integration for '${url}'`);
    }

    const credentialsProvider =
      DefaultGithubCredentialsProvider.fromIntegrations(this.integrations);

    const { headers } = await credentialsProvider.getCredentials({
      url,
    });

    const baseUrl =
      githubIntegration.config.apiBaseUrl ?? 'https://api.github.com';
    return {
      baseUrl: baseUrl.replace(/\/$/, ''),
      headers: headers as Record<string, string>,
    };
  }

  async getCriticalAlerts(
    url: string,
    repository: { owner: string; repo: string },
  ): Promise<DependabotAlert[]> {
    return this.getAlerts(url, repository, 'critical');
  }

  async getHighAlerts(
    url: string,
    repository: { owner: string; repo: string },
  ): Promise<DependabotAlert[]> {
    return this.getAlerts(url, repository, 'high');
  }

  async getMediumAlerts(
    url: string,
    repository: { owner: string; repo: string },
  ): Promise<DependabotAlert[]> {
    return this.getAlerts(url, repository, 'medium');
  }

  async getLowAlerts(
    url: string,
    repository: { owner: string; repo: string },
  ): Promise<DependabotAlert[]> {
    return this.getAlerts(url, repository, 'low');
  }

  /**
   * @param url - The URL of the repository.
   * @param repository - The repository owner and name.
   * @param severity - The severity of the alerts to fetch.
   * @returns All alerts for the given repository and severity.
   */
  private async getAlerts(
    url: string,
    repository: { owner: string; repo: string },
    severity: 'critical' | 'high' | 'medium' | 'low',
  ): Promise<DependabotAlert[]> {
    this.logger.info(
      `Fetching Dependabot ${severity} alerts for ${repository.owner}/${repository.repo}`,
    );
    try {
      const { baseUrl, headers } = await this.getRequestConfig(url);

      const basePath = `${baseUrl}/repos/${repository.owner}/${repository.repo}/dependabot/alerts`;
      let queryUrl:
        | string
        | null = `${basePath}?state=open&severity=${severity}&per_page=${PER_PAGE}`;
      const allAlerts: GitHubDependabotAlert[] = [];

      do {
        const response = await fetch(queryUrl, { headers });

        if (!response.ok) {
          const body = await response.text();
          throw new Error(
            `GitHub API error ${queryUrl}: ${response.status} - ${response.statusText} - ${body}`,
          );
        }

        const alerts = (await response.json()) as GitHubDependabotAlert[];
        allAlerts.push(...alerts);

        queryUrl = getNextPageUrl(response.headers.get('link'));
      } while (queryUrl);

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
