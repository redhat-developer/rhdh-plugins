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
import { DiscoveryApi } from '@backstage/plugin-permission-common';

import {
  Configuration,
  DefaultApi,
  ExecuteWorkflowRequestDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import {
  OrchestratorWorkflowDao,
  RepositoryDao,
} from '../../../database/repositoryDao';
import { Components, ImportRequest } from '../../../generated/openapi';
import { HandlerResponse } from '../handlers';

export type CreateWorkflowImportJobsArgs = {
  orchestratorWorkflowId: string;
  discovery: DiscoveryApi;
  baseOrchestratorAPIUrl?: string;
  token?: string;
  requestBody: ImportRequest[];
  orchestratorWorkflowDao: OrchestratorWorkflowDao;
  repositoryDao: RepositoryDao;
};

export async function createWorkflowImportJobs(
  args: CreateWorkflowImportJobsArgs,
): Promise<
  HandlerResponse<Components.Schemas.Import[] | { errors: string[] }>
> {
  const {
    orchestratorWorkflowId,
    discovery,
    baseOrchestratorAPIUrl,
    token,
    requestBody,
    orchestratorWorkflowDao,
    repositoryDao,
  } = args;

  if (requestBody.length === 0) {
    return {
      statusCode: 400,
      responseBody: [],
    };
  }

  const result: Components.Schemas.Import[] = [];
  const baseUrl = await discovery.getBaseUrl('orchestrator');
  const config = new Configuration();

  // Initialize the client
  const url = baseOrchestratorAPIUrl
    ? baseOrchestratorAPIUrl
    : `${baseUrl}/v2/workflows/instances`;
  const orchestratorApi = new DefaultApi(config, url);

  for (const repo of requestBody) {
    if (!repo.repository.url) {
      continue;
    }

    try {
      const requestDTO: ExecuteWorkflowRequestDTO = {
        inputData: {
          repositoryUrl: repo.repository.url,
        },
      };

      // Execute a workflow
      const wfResult = await orchestratorApi.executeWorkflow(
        orchestratorWorkflowId,
        requestDTO,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      await repositoryDao.insertRepository(
        repo.repository.url,
        wfResult.data.id,
        repo.approvalTool ?? 'GIT',
      );

      await orchestratorWorkflowDao.insertWorkflow(
        wfResult.data.id,
        repo.repository.url,
      );
      result.push({
        repository: repo.repository,
        workflow: { workflowId: wfResult.data.id },
      });
    } catch (error: any) {
      result.push({
        repository: repo.repository,
        errors: [error.message],
      });
    }
  }

  if (result.some(r => r.errors)) {
    return {
      statusCode: 202,
      responseBody: { errors: result.flatMap(r => r.errors || []) },
    };
  }

  return {
    statusCode: 202,
    responseBody: result,
  };
}
