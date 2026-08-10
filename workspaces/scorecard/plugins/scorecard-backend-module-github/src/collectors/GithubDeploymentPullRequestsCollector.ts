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

import type { Entity } from '@backstage/catalog-model';
import { getEntitySourceLocation } from '@backstage/catalog-model';
import type { LoggerService } from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import type { Collector } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { z } from 'zod';
import { GithubClient } from '../github/GithubClient';
import { getRepositoryInformationFromEntity } from '../github/utils';

export class GithubDeploymentPullRequestsCollector
  implements
    Collector<
      (typeof GithubDeploymentPullRequestsCollector)['inputSchema'],
      (typeof GithubDeploymentPullRequestsCollector)['outputSchema']
    >
{
  static readonly inputSchema = z.object({
    baseCommitSha: z.string().min(1),
    headCommitSha: z.string().min(1),
  });
  static readonly outputSchema = z.object({
    pullRequests: z.array(
      z.object({
        id: z.string().min(1),
        firstCommitAt: z.string().datetime(),
      }),
    ),
  });

  private readonly client: GithubClient;
  private readonly logger: LoggerService;

  private constructor(client: GithubClient, logger: LoggerService) {
    this.client = client;
    this.logger = logger;
  }

  static fromConfig(
    config: Config,
    options: { logger: LoggerService },
  ): GithubDeploymentPullRequestsCollector {
    return new GithubDeploymentPullRequestsCollector(
      new GithubClient(config, options.logger),
      options.logger,
    );
  }

  getCollectorId(): string {
    return 'github:deploymentPullRequests';
  }

  getCollectorDescription(): string {
    return 'Collects pull requests linked to deployments.';
  }

  getInputSchema() {
    return GithubDeploymentPullRequestsCollector.inputSchema;
  }

  getOutputSchema() {
    return GithubDeploymentPullRequestsCollector.outputSchema;
  }

  async collect(options: {
    entity: Entity;
    input: z.infer<
      (typeof GithubDeploymentPullRequestsCollector)['inputSchema']
    >;
  }): Promise<
    z.infer<(typeof GithubDeploymentPullRequestsCollector)['outputSchema']>
  > {
    const repository = getRepositoryInformationFromEntity(options.entity);
    const { target } = getEntitySourceLocation(options.entity);

    const commitShas = await this.client.getCommitShasBetween(
      target,
      repository,
      options.input.baseCommitSha,
      options.input.headCommitSha,
    );

    const pullRequestsBySha = await this.client.getCommitsPullRequests(
      target,
      repository,
      commitShas,
    );

    const pullRequestsById = new Map<
      string,
      { id: string; firstCommitAt: string }
    >();
    for (const [commitSha, commitPullRequests] of pullRequestsBySha) {
      for (const pullRequest of commitPullRequests) {
        const pullRequestId = String(pullRequest.number);
        if (pullRequestsById.has(pullRequestId)) {
          continue;
        }
        if (!pullRequest.firstCommitAt) {
          this.logger.warn(
            `Skipping pull request ${pullRequestId} for commit ${commitSha} due to missing firstCommitAt`,
          );
          continue;
        }

        pullRequestsById.set(pullRequestId, {
          id: pullRequestId,
          firstCommitAt: pullRequest.firstCommitAt,
        });
      }
    }

    return {
      pullRequests: Array.from(pullRequestsById.values()),
    };
  }
}
