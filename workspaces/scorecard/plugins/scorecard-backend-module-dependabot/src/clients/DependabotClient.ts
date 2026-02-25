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

export interface DependabotAlert {
  number: number;
  state: string;
  createdAt: string;
  severity: string | null;
}

export class DependabotClient {
  private readonly integrations: ScmIntegrations;
  private readonly logger: LoggerService;

  constructor(config: Config, logger: LoggerService) {
    this.integrations = ScmIntegrations.fromConfig(config);
    this.logger = logger.child({ component: 'DependabotClient' });
  }

  private async getOctokitClient(url: string): Promise<typeof graphql> {
    const githubIntegration = this.integrations.github.byUrl(url);
    if (!githubIntegration) {
      throw new Error(`Missing GitHub integration for '${url}'`);
    }

    const credentialsProvider =
      DefaultGithubCredentialsProvider.fromIntegrations(this.integrations);

    const { headers } = await credentialsProvider.getCredentials({
      url,
    });

    const { graphql } = await import('@octokit/graphql');
    return graphql.defaults({
      headers,
      baseUrl: githubIntegration.config.apiBaseUrl,
    });
  }

  async getDependabotAlerts(
    url: string,
    repository: { owner: string; repo: string },
  ): Promise<DependabotAlert[]> {
    this.logger.info(
      `Fetching Dependabot alerts for ${repository.owner}/${repository.repo}`,
    );
    try {
      const octokit = await this.getOctokitClient(url);

      const query = `
      query getDependabotAlerts($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          vulnerabilityAlerts(first: 100, states: [OPEN]) {
            nodes {
              number
              state
              createdAt
              securityAdvisory {
                severity
              }
            }
          }
        }
      }
    `;

      const response = await octokit<{
        repository: {
          vulnerabilityAlerts: {
            nodes: Array<{
              number: number;
              state: string;
              createdAt: string;
              securityAdvisory: { severity: string } | null;
            }>;
          };
        };
      }>(query, {
        owner: repository.owner,
        repo: repository.repo,
      });

      this.logger.info('Dependabot alerts response', { response });

      const nodes = response.repository.vulnerabilityAlerts.nodes ?? [];
      this.logger.info(
        `Fetched ${nodes.length} Dependabot alert(s) for ${repository.owner}/${repository.repo}`,
      );
      return nodes.map(node => ({
        number: node.number,
        state: node.state,
        createdAt: node.createdAt,
        severity: node.securityAdvisory?.severity ?? null,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to fetch Dependabot alerts for ${repository.owner}/${repository.repo}: ${message}`,
        error,
      );
      throw error;
    }
  }
}
