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
  AuthToken,
  Configuration,
  DefaultApi,
  ExecuteWorkflowRequestDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import {
  OrchestratorWorkflowDao,
  RepositoryDao,
} from '../../../database/repositoryDao';
import { Components, ImportRequest } from '../../../generated/openapi';
import { GithubApiService } from '../../../github';
import { GitlabApiService } from '../../../gitlab';
import { HandlerResponse } from '../handlers';
import { sortImports } from './bulkImports';

export type CreateWorkflowImportJobsArgs = {
  orchestratorWorkflowId: string;
  discovery: DiscoveryApi;
  token?: string;
  requestBody: ImportRequest[];
  orchestratorWorkflowDao: OrchestratorWorkflowDao;
  orchestratorRepositoryDao: RepositoryDao<'orchestrator_repositories'>;
  githubApiService: GithubApiService;
  gitlabApiService: GitlabApiService;
};

export async function createWorkflowImportJobs(
  args: CreateWorkflowImportJobsArgs,
): Promise<HandlerResponse<Components.Schemas.Import[]>> {
  const {
    orchestratorWorkflowId,
    discovery,
    token,
    requestBody,
    orchestratorWorkflowDao,
    orchestratorRepositoryDao,
    githubApiService,
    gitlabApiService,
  } = args;

  if (requestBody.length === 0) {
    return {
      statusCode: 400,
      responseBody: [],
    };
  }

  const result: Components.Schemas.Import[] = [];
  const baseUrl = await discovery.getBaseUrl('orchestrator');
  const apiConfig = new Configuration();

  // Initialize the client
  const orchestratorApi = new DefaultApi(apiConfig, baseUrl);

  for (const repo of requestBody) {
    if (!repo.repository.url) {
      continue;
    }

    let workflowStatus: Components.Schemas.WorkflowImportStatus | undefined;
    try {
      const approvalTool = repo.approvalTool ?? 'GIT';

      const authTokens: AuthToken[] = [];
      if (approvalTool === 'GIT') {
        const creds = await githubApiService.getCredentials(
          repo.repository.url,
        );
        authTokens.push({ token: creds?.token, provider: 'github' });
      }
      if (approvalTool === 'GITLAB') {
        const creds = await gitlabApiService.getCredentials(
          repo.repository.url,
        );
        authTokens.push({ token: creds?.token, provider: 'gitlab' });
      }

      const requestDTO: ExecuteWorkflowRequestDTO = {
        inputData: {
          owner: repo.repository.organization,
          repo: repo.repository.name,
          baseBranch: repo.repository.defaultBranch,
          targetBranch: `bulk-import-orchestrator`,
          approvalTool: approvalTool,
        },
        authTokens,
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

      const repositoryId = await orchestratorRepositoryDao.insertRepository(
        repo.repository.url,
        wfResult.data.id,
        approvalTool,
      );
      await orchestratorWorkflowDao.insertWorkflow(
        wfResult.data.id,
        repositoryId,
      );

      const response = await orchestratorApi.getInstanceById(wfResult.data.id, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      workflowStatus =
        `WORKFLOW_${(response.data.state as string)?.toLocaleUpperCase()}` as Components.Schemas.WorkflowImportStatus;

      result.push({
        repository: repo.repository,
        workflow: { workflowId: wfResult.data.id },
        status: workflowStatus,
      });
    } catch (error: any) {
      result.push({
        repository: repo.repository,
        status: workflowStatus ?? 'WORKFLOW_ABORTED',
        errors: [(error as Error).message],
      });
    }
  }

  sortImports(result);

  return {
    statusCode: 202,
    responseBody: result,
  };
}
