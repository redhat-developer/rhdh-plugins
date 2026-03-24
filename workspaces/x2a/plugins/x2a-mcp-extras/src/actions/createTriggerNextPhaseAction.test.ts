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
import { mockCredentials, mockServices } from '@backstage/backend-test-utils';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { NotAllowedError, NotFoundError } from '@backstage/errors';

import { buildMocks, MOCK_PROJECT } from './__testUtils__';

describe('x2a-trigger-next-phase MCP tool', () => {
  it('creates an init job for a project using config tokens', async () => {
    const { getAction, x2aDatabase, kubeService } = buildMocks();

    x2aDatabase.getProject.mockResolvedValue(MOCK_PROJECT);
    x2aDatabase.listJobsForProject.mockResolvedValue([]);
    x2aDatabase.createJob.mockResolvedValue({
      id: 'job-001',
      projectId: 'proj-001',
      phase: 'init',
      status: 'pending',
    });

    const action = getAction('x2a-trigger-next-phase');
    const result = await action({
      input: { projectId: 'proj-001' },
      credentials: mockCredentials.user(),
      logger: mockServices.logger.mock(),
    });

    expect(result).toEqual({
      output: {
        status: 'pending',
        jobId: 'job-001',
      },
    });

    expect(x2aDatabase.createJob).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj-001',
        phase: 'init',
        status: 'pending',
      }),
    );

    expect(kubeService.createJob).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj-001',
        phase: 'init',
        sourceRepo: expect.objectContaining({
          url: MOCK_PROJECT.sourceRepoUrl,
          token: 'src-token-from-config',
        }),
        targetRepo: expect.objectContaining({
          url: MOCK_PROJECT.targetRepoUrl,
          token: 'tgt-token-from-config',
        }),
      }),
    );

    expect(x2aDatabase.updateJob).toHaveBeenCalledWith({
      id: 'job-001',
      k8sJobName: 'x2a-init-abc123',
    });
  });

  it('prefers explicit tokens over config tokens', async () => {
    const { getAction, x2aDatabase, kubeService } = buildMocks();

    x2aDatabase.getProject.mockResolvedValue(MOCK_PROJECT);
    x2aDatabase.listJobsForProject.mockResolvedValue([]);
    x2aDatabase.createJob.mockResolvedValue({
      id: 'job-002',
      projectId: 'proj-001',
      phase: 'init',
      status: 'pending',
    });

    const action = getAction('x2a-trigger-next-phase');
    await action({
      input: {
        projectId: 'proj-001',
        sourceRepoAuthToken: 'my-src-token',
        targetRepoAuthToken: 'my-tgt-token',
      },
      credentials: mockCredentials.user(),
      logger: mockServices.logger.mock(),
    });

    expect(kubeService.createJob).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceRepo: expect.objectContaining({ token: 'my-src-token' }),
        targetRepo: expect.objectContaining({ token: 'my-tgt-token' }),
      }),
    );
  });

  it('passes userPrompt to kubeService', async () => {
    const { getAction, x2aDatabase, kubeService } = buildMocks();

    x2aDatabase.getProject.mockResolvedValue(MOCK_PROJECT);
    x2aDatabase.listJobsForProject.mockResolvedValue([]);
    x2aDatabase.createJob.mockResolvedValue({
      id: 'job-003',
      projectId: 'proj-001',
      phase: 'init',
      status: 'pending',
    });

    const action = getAction('x2a-trigger-next-phase');
    await action({
      input: {
        projectId: 'proj-001',
        userPrompt: 'Focus on security patches',
      },
      credentials: mockCredentials.user(),
      logger: mockServices.logger.mock(),
    });

    expect(kubeService.createJob).toHaveBeenCalledWith(
      expect.objectContaining({
        userPrompt: 'Focus on security patches',
      }),
    );
  });

  it('passes aapCredentials to kubeService', async () => {
    const { getAction, x2aDatabase, kubeService } = buildMocks();

    x2aDatabase.getProject.mockResolvedValue(MOCK_PROJECT);
    x2aDatabase.listJobsForProject.mockResolvedValue([]);
    x2aDatabase.createJob.mockResolvedValue({
      id: 'job-004',
      projectId: 'proj-001',
      phase: 'init',
      status: 'pending',
    });

    const aap = {
      url: 'https://aap.example.com',
      orgName: 'myorg',
      oauthToken: 'aap-tok',
    };

    const action = getAction('x2a-trigger-next-phase');
    await action({
      input: { projectId: 'proj-001', aapCredentials: aap },
      credentials: mockCredentials.user(),
      logger: mockServices.logger.mock(),
    });

    expect(kubeService.createJob).toHaveBeenCalledWith(
      expect.objectContaining({ aapCredentials: aap }),
    );
  });

  it('throws NotFoundError when project does not exist', async () => {
    const { getAction, x2aDatabase } = buildMocks();
    x2aDatabase.getProject.mockResolvedValue(undefined);

    const action = getAction('x2a-trigger-next-phase');
    await expect(
      action({
        input: { projectId: 'nonexistent' },
        credentials: mockCredentials.user(),
        logger: mockServices.logger.mock(),
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws ConflictError when an init job is already running', async () => {
    const { getAction, x2aDatabase, kubeService } = buildMocks();

    x2aDatabase.getProject.mockResolvedValue(MOCK_PROJECT);
    x2aDatabase.listJobsForProject.mockResolvedValue([
      {
        id: 'existing-job',
        projectId: 'proj-001',
        phase: 'init',
        status: 'running',
        k8sJobName: 'x2a-init-existing',
      },
    ]);
    kubeService.getJobStatus.mockResolvedValue({ status: 'running' });

    const action = getAction('x2a-trigger-next-phase');
    await expect(
      action({
        input: { projectId: 'proj-001' },
        credentials: mockCredentials.user(),
        logger: mockServices.logger.mock(),
      }),
    ).rejects.toThrow(/already running/);
  });

  it('proceeds when prior init jobs have completed after reconciliation', async () => {
    const { getAction, x2aDatabase, kubeService } = buildMocks();

    x2aDatabase.getProject.mockResolvedValue(MOCK_PROJECT);
    x2aDatabase.listJobsForProject.mockResolvedValue([
      {
        id: 'old-job',
        projectId: 'proj-001',
        phase: 'init',
        status: 'pending',
        k8sJobName: 'x2a-init-old',
      },
    ]);
    kubeService.getJobStatus.mockResolvedValue({ status: 'success' });
    kubeService.getJobLogs.mockResolvedValue('done');
    x2aDatabase.updateJob.mockResolvedValue({
      id: 'old-job',
      status: 'success',
      phase: 'init',
    });
    x2aDatabase.createJob.mockResolvedValue({
      id: 'job-new',
      projectId: 'proj-001',
      phase: 'init',
      status: 'pending',
    });

    const action = getAction('x2a-trigger-next-phase');
    const result = await action({
      input: { projectId: 'proj-001' },
      credentials: mockCredentials.user(),
      logger: mockServices.logger.mock(),
    });

    expect(result.output.jobId).toBe('job-new');
  });

  it('uses discovery baseUrl for callback when callbackBaseUrl is not configured', async () => {
    const { getAction, x2aDatabase, kubeService, discovery } = buildMocks();

    x2aDatabase.getProject.mockResolvedValue(MOCK_PROJECT);
    x2aDatabase.listJobsForProject.mockResolvedValue([]);
    x2aDatabase.createJob.mockResolvedValue({
      id: 'job-cb',
      projectId: 'proj-001',
      phase: 'init',
      status: 'pending',
    });

    const action = getAction('x2a-trigger-next-phase');
    await action({
      input: { projectId: 'proj-001' },
      credentials: mockCredentials.user(),
      logger: mockServices.logger.mock(),
    });

    expect(discovery.getBaseUrl).toHaveBeenCalledWith('x2a');
    expect(kubeService.createJob).toHaveBeenCalledWith(
      expect.objectContaining({
        callbackUrl:
          'http://localhost:7007/api/x2a/projects/proj-001/collectArtifacts',
      }),
    );
  });

  it('rejects an unauthorised user', async () => {
    const { getAction, permissionsSvc } = buildMocks();
    permissionsSvc.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);

    const action = getAction('x2a-trigger-next-phase');
    await expect(
      action({
        input: { projectId: 'proj-001' },
        credentials: mockCredentials.user(),
        logger: mockServices.logger.mock(),
      }),
    ).rejects.toThrow(NotAllowedError);
  });

  it('throws InputError when source token is missing from both input and config', async () => {
    const noTokenConfig = mockServices.rootConfig({ data: { x2a: {} } });
    const { getAction, x2aDatabase } = buildMocks({
      config: noTokenConfig,
    });

    x2aDatabase.getProject.mockResolvedValue(MOCK_PROJECT);

    const action = getAction('x2a-trigger-next-phase');
    await expect(
      action({
        input: { projectId: 'proj-001' },
        credentials: mockCredentials.user(),
        logger: mockServices.logger.mock(),
      }),
    ).rejects.toThrow(/[Ss]ource repository token/);
  });

  it('throws InputError when target token is missing from both input and config', async () => {
    const srcOnlyConfig = mockServices.rootConfig({
      data: {
        x2a: { git: { sourceRepo: { token: 'only-src' } } },
      },
    });
    const { getAction, x2aDatabase } = buildMocks({
      config: srcOnlyConfig,
    });

    x2aDatabase.getProject.mockResolvedValue(MOCK_PROJECT);

    const action = getAction('x2a-trigger-next-phase');
    await expect(
      action({
        input: { projectId: 'proj-001' },
        credentials: mockCredentials.user(),
        logger: mockServices.logger.mock(),
      }),
    ).rejects.toThrow(/[Tt]arget repository token/);
  });
});
