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
import type { Entity } from '@backstage/catalog-model';
import { getEntitySourceLocation } from '@backstage/catalog-model';
import type { Config } from '@backstage/config';
import type { Collector } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { z } from 'zod';
import { GithubClient } from '../github/GithubClient';
import { getRepositoryInformationFromEntity } from '../github/utils';
import {
  DeploymentResult,
  deploymentsSchema,
} from './schemas/deploymentSchemas';

export class GithubDeploymentsCollector
  implements
    Collector<
      (typeof GithubDeploymentsCollector)['inputSchema'],
      (typeof GithubDeploymentsCollector)['outputSchema']
    >
{
  static readonly inputSchema = z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  });
  static readonly outputSchema = deploymentsSchema;

  private readonly client: GithubClient;

  private constructor(client: GithubClient) {
    this.client = client;
  }

  static fromConfig(
    config: Config,
    options: { logger: LoggerService },
  ): GithubDeploymentsCollector {
    return new GithubDeploymentsCollector(
      new GithubClient(config, options.logger),
    );
  }

  getCollectorId(): string {
    return 'github:deployments';
  }

  getCollectorDescription(): string {
    return 'Collects GitHub deployments.';
  }

  getInputSchema() {
    return GithubDeploymentsCollector.inputSchema;
  }

  getOutputSchema() {
    return GithubDeploymentsCollector.outputSchema;
  }

  async collect(options: {
    entity: Entity;
    input: z.infer<(typeof GithubDeploymentsCollector)['inputSchema']>;
  }): Promise<z.infer<(typeof GithubDeploymentsCollector)['outputSchema']>> {
    const repository = getRepositoryInformationFromEntity(options.entity);
    const { target } = getEntitySourceLocation(options.entity);
    const from = new Date(options.input.from);
    const to = new Date(options.input.to);

    const deployments = await this.client.getDeployments(
      target,
      repository,
      from,
      to,
    );

    return {
      deployments: deployments.map(deployment => ({
        id: String(deployment.id),
        commitSha: deployment.sha,
        environment: deployment.environment ?? undefined,
        createdAt: deployment.createdAt,
        result: mapResultFromGithubStatus(deployment.status),
      })),
    };
  }
}

function mapResultFromGithubStatus(status: string | null): DeploymentResult {
  if (!status) {
    return '';
  }
  const normalizedStatus = status.toLowerCase();
  if (normalizedStatus === 'success') {
    return 'success';
  }
  if (['failure', 'error'].includes(normalizedStatus)) {
    return 'failure';
  }
  return '';
}
