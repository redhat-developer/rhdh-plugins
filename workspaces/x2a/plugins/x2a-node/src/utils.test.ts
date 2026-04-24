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

import type { BackstageCredentials } from '@backstage/backend-plugin-api';
import type { Job } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import {
  SYSTEM_USER_REF,
  isUserCredentials,
  getUserRef,
  getGroupsOfUser,
  reconcileJobStatus,
  generateCallbackToken,
  removeSensitiveFromJob,
  type UnsecureJob,
} from './utils';
import type { ReconcileJobDeps } from './services';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function userCredentials(ref = 'user:default/alice'): BackstageCredentials {
  return { principal: { userEntityRef: ref } } as BackstageCredentials;
}

function serviceCredentials(): BackstageCredentials {
  return {
    principal: { subject: 'external:mcp-clients' },
  } as BackstageCredentials;
}

function baseJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 'job-1',
    projectId: 'proj-1',
    status: 'pending',
    phase: 'init',
    k8sJobName: 'k8s-job-1',
    createdAt: new Date(),
    ...overrides,
  } as Job;
}

function mockDeps(overrides: Partial<ReconcileJobDeps> = {}): ReconcileJobDeps {
  return {
    kubeService: {
      getJobStatus: jest.fn().mockResolvedValue({ status: 'pending' }),
      getJobLogs: jest.fn().mockResolvedValue('some logs'),
      createJob: jest.fn(),
      deleteJob: jest.fn(),
    },
    x2aDatabase: {
      updateJob: jest.fn().mockImplementation(async update => ({
        ...baseJob(),
        ...update,
      })),
    } as any,
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      child: jest.fn(),
    } as any,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// isUserCredentials
// ---------------------------------------------------------------------------

describe('isUserCredentials', () => {
  it('returns true for user credentials', () => {
    expect(isUserCredentials(userCredentials())).toBe(true);
  });

  it('returns false for service credentials', () => {
    expect(isUserCredentials(serviceCredentials())).toBe(false);
  });

  it('returns false when principal has no userEntityRef', () => {
    const creds = { principal: {} } as BackstageCredentials;
    expect(isUserCredentials(creds)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getUserRef
// ---------------------------------------------------------------------------

describe('getUserRef', () => {
  it('returns the userEntityRef for user credentials', () => {
    expect(getUserRef(userCredentials('user:default/bob'))).toBe(
      'user:default/bob',
    );
  });

  it('returns SYSTEM_USER_REF for service credentials', () => {
    expect(getUserRef(serviceCredentials())).toBe(SYSTEM_USER_REF);
  });

  it('returns SYSTEM_USER_REF when principal has no userEntityRef', () => {
    const creds = { principal: {} } as BackstageCredentials;
    expect(getUserRef(creds)).toBe(SYSTEM_USER_REF);
  });
});

// ---------------------------------------------------------------------------
// getGroupsOfUser
// ---------------------------------------------------------------------------

describe('getGroupsOfUser', () => {
  it('returns group refs from MEMBER_OF relations', async () => {
    const catalog = {
      getEntityByRef: jest.fn().mockResolvedValue({
        kind: 'User',
        metadata: { name: 'alice', namespace: 'default' },
        apiVersion: 'backstage.io/v1alpha1',
        spec: {},
        relations: [
          { type: 'memberOf', targetRef: 'group:default/team-a' },
          { type: 'memberOf', targetRef: 'group:default/team-b' },
          { type: 'ownedBy', targetRef: 'group:default/team-c' },
        ],
      }),
    } as any;

    const groups = await getGroupsOfUser('user:default/alice', {
      catalog,
      credentials: userCredentials(),
    });

    expect(groups).toEqual(['group:default/team-a', 'group:default/team-b']);
  });

  it('returns empty array when entity has no relations', async () => {
    const catalog = {
      getEntityByRef: jest.fn().mockResolvedValue({
        kind: 'User',
        metadata: { name: 'alice' },
        apiVersion: 'backstage.io/v1alpha1',
        spec: {},
      }),
    } as any;

    const groups = await getGroupsOfUser('user:default/alice', {
      catalog,
      credentials: userCredentials(),
    });

    expect(groups).toEqual([]);
  });

  it('returns empty array when entity is not found', async () => {
    const catalog = {
      getEntityByRef: jest.fn().mockResolvedValue(undefined),
    } as any;

    const groups = await getGroupsOfUser('user:default/ghost', {
      catalog,
      credentials: userCredentials(),
    });

    expect(groups).toEqual([]);
  });

  it('returns empty array on catalog error', async () => {
    const catalog = {
      getEntityByRef: jest.fn().mockRejectedValue(new Error('boom')),
    } as any;

    const groups = await getGroupsOfUser('user:default/alice', {
      catalog,
      credentials: userCredentials(),
    });

    expect(groups).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// removeSensitiveFromJob
// ---------------------------------------------------------------------------

describe('removeSensitiveFromJob', () => {
  it('returns undefined when job is undefined', () => {
    expect(removeSensitiveFromJob(undefined)).toBeUndefined();
  });

  it('returns undefined when job is null', () => {
    expect(removeSensitiveFromJob(null as any)).toBeUndefined();
  });

  it('removes callbackToken from job', () => {
    const job: UnsecureJob = {
      id: 'job-1',
      projectId: 'proj-1',
      moduleId: 'module-1',
      phase: 'init' as const,
      status: 'pending' as const,
      callbackToken: 'secret-token',
      startedAt: new Date(),
      k8sJobName: 'job-1',
    };
    const result = removeSensitiveFromJob(job);
    expect(result).toBeDefined();
    expect(result).not.toHaveProperty('callbackToken');
    expect(result).toMatchObject({
      id: 'job-1',
      projectId: 'proj-1',
      phase: 'init',
      status: 'pending',
    });
  });

  it('returns job unchanged when it has no callbackToken', () => {
    const job = {
      id: 'job-1',
      projectId: 'proj-1',
      moduleId: 'module-1',
      phase: 'analyze' as const,
      status: 'success' as const,
      startedAt: new Date(),
      k8sJobName: 'job-1',
    };
    const result = removeSensitiveFromJob(job);
    expect(result).toEqual(job);
  });

  it('does not mutate the original job object', () => {
    const job = {
      id: 'job-1',
      callbackToken: 'secret',
      startedAt: new Date(),
      k8sJobName: 'job-1',
    } as UnsecureJob;
    const result = removeSensitiveFromJob(job);
    expect(job).toHaveProperty('callbackToken', 'secret');
    expect(result).not.toHaveProperty('callbackToken');
  });
});

// ---------------------------------------------------------------------------
// reconcileJobStatus
// ---------------------------------------------------------------------------

describe('reconcileJobStatus', () => {
  it('returns the job unchanged when status is already completed', async () => {
    const job = baseJob({ status: 'success' });
    const deps = mockDeps();

    const result = await reconcileJobStatus(job, deps);

    expect(result).toBe(job);
    expect(deps.kubeService.getJobStatus).not.toHaveBeenCalled();
  });

  it('returns the job unchanged when status is error', async () => {
    const job = baseJob({ status: 'error' });
    const deps = mockDeps();

    const result = await reconcileJobStatus(job, deps);

    expect(result).toBe(job);
  });

  it('returns the job unchanged when k8sJobName is missing', async () => {
    const job = baseJob({ k8sJobName: undefined });
    const deps = mockDeps();

    const result = await reconcileJobStatus(job, deps);

    expect(result).toBe(job);
  });

  it('updates DB when K8s reports success', async () => {
    const job = baseJob({ status: 'running' });
    const deps = mockDeps();
    (deps.kubeService.getJobStatus as jest.Mock).mockResolvedValue({
      status: 'success',
    });

    const result = await reconcileJobStatus(job, deps);

    expect(deps.x2aDatabase.updateJob).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'job-1',
        status: 'success',
        finishedAt: expect.any(Date),
        log: 'some logs',
      }),
    );
    expect(result.status).toBe('success');
  });

  it('updates DB when K8s reports error', async () => {
    const job = baseJob({ status: 'pending' });
    const deps = mockDeps();
    (deps.kubeService.getJobStatus as jest.Mock).mockResolvedValue({
      status: 'error',
    });

    const result = await reconcileJobStatus(job, deps);

    expect(deps.x2aDatabase.updateJob).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'job-1',
        status: 'error',
      }),
    );
    expect(result.status).toBe('error');
  });

  it('handles log-fetch failure gracefully', async () => {
    const job = baseJob({ status: 'running' });
    const deps = mockDeps();
    (deps.kubeService.getJobStatus as jest.Mock).mockResolvedValue({
      status: 'success',
    });
    (deps.kubeService.getJobLogs as jest.Mock).mockRejectedValue(
      new Error('logs unavailable'),
    );

    const result = await reconcileJobStatus(job, deps);

    expect(deps.logger.warn).toHaveBeenCalled();
    expect(deps.x2aDatabase.updateJob).toHaveBeenCalledWith(
      expect.objectContaining({
        log: null,
      }),
    );
    expect(result.status).toBe('success');
  });

  it('returns original job when K8s status is still pending', async () => {
    const job = baseJob({ status: 'pending' });
    const deps = mockDeps();
    (deps.kubeService.getJobStatus as jest.Mock).mockResolvedValue({
      status: 'pending',
    });

    const result = await reconcileJobStatus(job, deps);

    expect(result).toBe(job);
    expect(deps.x2aDatabase.updateJob).not.toHaveBeenCalled();
  });

  it('returns original job when updateJob returns undefined', async () => {
    const job = baseJob({ status: 'running' });
    const deps = mockDeps();
    (deps.kubeService.getJobStatus as jest.Mock).mockResolvedValue({
      status: 'success',
    });
    (deps.x2aDatabase.updateJob as jest.Mock).mockResolvedValue(undefined);

    const result = await reconcileJobStatus(job, deps);

    expect(result).toBe(job);
  });
});

// ---------------------------------------------------------------------------
// generateCallbackToken
// ---------------------------------------------------------------------------

describe('generateCallbackToken', () => {
  it('returns a 64-character hex string (256 bits)', () => {
    const token = generateCallbackToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces distinct values on successive calls', () => {
    const a = generateCallbackToken();
    const b = generateCallbackToken();
    expect(a).not.toBe(b);
  });
});
