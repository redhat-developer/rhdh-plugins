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
} from './schemas/deploymentsSchemas';

export class GithubDeploymentWorkflowRunsCollector
  implements
    Collector<
      (typeof GithubDeploymentWorkflowRunsCollector)['inputSchema'],
      (typeof GithubDeploymentWorkflowRunsCollector)['outputSchema']
    >
{
  static readonly inputSchema = z.object({
    workflowName: z.string().min(1),
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
  ): GithubDeploymentWorkflowRunsCollector {
    return new GithubDeploymentWorkflowRunsCollector(
      new GithubClient(config, options.logger),
    );
  }

  getCollectorId(): string {
    return 'github:deploymentWorkflowRuns';
  }

  getCollectorDescription(): string {
    return 'Collects deployments from GitHub Actions.';
  }

  getInputSchema() {
    return GithubDeploymentWorkflowRunsCollector.inputSchema;
  }

  getOutputSchema() {
    return GithubDeploymentWorkflowRunsCollector.outputSchema;
  }

  async collect(options: {
    entity: Entity;
    input: z.infer<
      (typeof GithubDeploymentWorkflowRunsCollector)['inputSchema']
    >;
  }): Promise<
    z.infer<(typeof GithubDeploymentWorkflowRunsCollector)['outputSchema']>
  > {
    const repository = getRepositoryInformationFromEntity(options.entity);
    const { target } = getEntitySourceLocation(options.entity);
    const from = new Date(options.input.from);
    const to = new Date(options.input.to);

    const workflowRuns = await this.client.getWorkflowRuns(
      target,
      repository,
      options.input.workflowName,
      from,
      to,
    );

    return {
      deployments: workflowRuns.map(workflowRun => ({
        id: String(workflowRun.id),
        commitSha: workflowRun.sha,
        createdAt: workflowRun.createdAt,
        result: mapResultFromGithubConclusion(workflowRun.conclusion),
      })),
    };
  }
}

function mapResultFromGithubConclusion(
  conclusion: string | null,
): DeploymentResult {
  if (!conclusion) {
    return '';
  }

  const normalizedConclusion = conclusion.toLowerCase();
  if (normalizedConclusion === 'success') {
    return 'success';
  }
  if (
    ['failure', 'cancelled', 'timed_out', 'action_required'].includes(
      normalizedConclusion,
    )
  ) {
    return 'failure';
  }

  return '';
}
