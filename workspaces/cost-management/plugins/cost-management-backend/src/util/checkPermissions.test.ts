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

import type { Request } from 'express';
import { mockCredentials, mockServices } from '@backstage/backend-test-utils';
import {
  AuthorizePermissionRequest,
  AuthorizePermissionResponse,
  AuthorizeResult,
  createPermission,
} from '@backstage/plugin-permission-common';
import {
  authorizeInBatches,
  filterAuthorizedClustersAndProjects,
} from './checkPermissions';

const credentials = mockCredentials.user();
/** Minimal Express request; MockHttpAuthService reads headers.authorization */
const mockRequest = { headers: {} } as Request;

function makeRequests(count: number): AuthorizePermissionRequest[] {
  return Array.from({ length: count }, (_, i) => ({
    permission: createPermission({
      name: `cost/cluster/project-${i}`,
      attributes: { action: 'read' },
    }),
  }));
}

function denyAll(
  requests: AuthorizePermissionRequest[],
): AuthorizePermissionResponse[] {
  return requests.map(() => ({ result: AuthorizeResult.DENY }));
}

describe('authorizeInBatches', () => {
  it('returns empty array for empty requests without calling authorize', async () => {
    const permissions = mockServices.permissions.mock();

    const result = await authorizeInBatches(permissions, [], credentials, 100);

    expect(result).toEqual([]);
    expect(permissions.authorize).not.toHaveBeenCalled();
  });

  it('uses a single authorize call when requests fit in one batch', async () => {
    const requests = makeRequests(3);
    const decisions = denyAll(requests);
    const permissions = mockServices.permissions.mock();
    permissions.authorize.mockResolvedValue(decisions);

    const result = await authorizeInBatches(
      permissions,
      requests,
      credentials,
      100,
    );

    expect(permissions.authorize).toHaveBeenCalledTimes(1);
    expect(permissions.authorize).toHaveBeenCalledWith(requests, {
      credentials,
    });
    expect(result).toEqual(decisions);
  });

  it('chunks requests and concatenates decisions in order', async () => {
    const requests = makeRequests(5);
    const permissions = mockServices.permissions.mock();
    permissions.authorize.mockImplementation(
      async (chunk: AuthorizePermissionRequest[]) =>
        chunk.map(() => ({ result: AuthorizeResult.ALLOW })),
    );

    const result = await authorizeInBatches(
      permissions,
      requests,
      credentials,
      2,
    );

    expect(permissions.authorize).toHaveBeenCalledTimes(3);
    expect(permissions.authorize.mock.calls[0]).toEqual([
      requests.slice(0, 2),
      { credentials },
    ]);
    expect(permissions.authorize.mock.calls[1]).toEqual([
      requests.slice(2, 4),
      { credentials },
    ]);
    expect(permissions.authorize.mock.calls[2]).toEqual([
      requests.slice(4, 5),
      { credentials },
    ]);
    expect(result).toEqual(
      requests.map(() => ({ result: AuthorizeResult.ALLOW })),
    );
  });

  it('uses the default batch size of 100', async () => {
    const requests = makeRequests(101);
    const permissions = mockServices.permissions.mock();
    permissions.authorize.mockImplementation(async chunk => denyAll(chunk));

    await authorizeInBatches(permissions, requests, credentials);

    expect(permissions.authorize).toHaveBeenCalledTimes(2);
    expect(permissions.authorize.mock.calls[0][0]).toHaveLength(100);
    expect(permissions.authorize.mock.calls[1][0]).toHaveLength(1);
  });
});

describe('filterAuthorizedClustersAndProjects', () => {
  function setupAuth(
    authorizeImpl: (
      requests: AuthorizePermissionRequest[],
    ) => Promise<AuthorizePermissionResponse[]>,
  ) {
    const httpAuth = mockServices.httpAuth({
      defaultCredentials: credentials,
    });
    const permissions = mockServices.permissions.mock();
    permissions.authorize.mockImplementation(authorizeImpl);
    return { httpAuth, permissions };
  }

  it('returns empty result when cluster map is empty', async () => {
    const { httpAuth, permissions } = setupAuth(async () => []);

    const result = await filterAuthorizedClustersAndProjects(
      mockRequest,
      permissions,
      httpAuth,
      {},
      ['america'],
      'cost',
    );

    expect(result).toEqual({
      authorizedClusterIds: [],
      authorizedClusterProjects: [],
    });
    expect(permissions.authorize).not.toHaveBeenCalled();
  });

  it('grants full cluster access without project checks when cluster permission allows', async () => {
    const { httpAuth, permissions } = setupAuth(async requests =>
      requests.map(req => ({
        result:
          req.permission.name === 'cost/Openshift on Azure'
            ? AuthorizeResult.ALLOW
            : AuthorizeResult.DENY,
      })),
    );

    const result = await filterAuthorizedClustersAndProjects(
      mockRequest,
      permissions,
      httpAuth,
      {
        'Openshift on Azure': 'uuid-azure',
        demolab: 'uuid-demo',
      },
      ['america', 'kube-system'],
      'cost',
    );

    // Cluster-level authorize once; project checks only for demolab (2 projects)
    expect(permissions.authorize).toHaveBeenCalledTimes(2);
    expect(permissions.authorize.mock.calls[0][0]).toHaveLength(2);
    expect(permissions.authorize.mock.calls[0][1]).toEqual({ credentials });
    expect(permissions.authorize.mock.calls[1][0]).toHaveLength(2);
    expect(permissions.authorize.mock.calls[1][1]).toEqual({ credentials });
    expect(result.authorizedClusterIds).toEqual(['Openshift on Azure']);
    expect(result.authorizedClusterProjects).toEqual([]);
  });

  it('chunks project-level authorize calls for large cluster×project products', async () => {
    const projects = Array.from({ length: 150 }, (_, i) => `project-${i}`);
    const { httpAuth, permissions } = setupAuth(async requests =>
      requests.map(req => ({
        result:
          req.permission.name === 'cost/demolab/project-0'
            ? AuthorizeResult.ALLOW
            : AuthorizeResult.DENY,
      })),
    );

    const result = await filterAuthorizedClustersAndProjects(
      mockRequest,
      permissions,
      httpAuth,
      { demolab: 'uuid-demo' },
      projects,
      'cost',
    );

    // 1 cluster authorize + 2 project batches (100 + 50) with default batch size
    expect(permissions.authorize).toHaveBeenCalledTimes(3);
    expect(permissions.authorize.mock.calls[0][0]).toHaveLength(1);
    expect(permissions.authorize.mock.calls[1][0]).toHaveLength(100);
    expect(permissions.authorize.mock.calls[2][0]).toHaveLength(50);
    expect(result.authorizedClusterIds).toEqual(['demolab']);
    expect(result.authorizedClusterProjects).toEqual([
      { cluster: 'demolab', project: 'project-0' },
    ]);
  });

  it('uses cluster alias for cost project grants and uuid for ros', async () => {
    const costAuth = setupAuth(async requests =>
      requests.map(req => ({
        result:
          req.permission.name === 'cost/Openshift on Azure/kube-system'
            ? AuthorizeResult.ALLOW
            : AuthorizeResult.DENY,
      })),
    );

    const costResult = await filterAuthorizedClustersAndProjects(
      mockRequest,
      costAuth.permissions,
      costAuth.httpAuth,
      { 'Openshift on Azure': 'uuid-azure' },
      ['kube-system'],
      'cost',
    );

    expect(costResult.authorizedClusterIds).toEqual(['Openshift on Azure']);
    expect(costResult.authorizedClusterProjects).toEqual([
      { cluster: 'Openshift on Azure', project: 'kube-system' },
    ]);

    const rosAuth = setupAuth(async requests =>
      requests.map(req => ({
        result:
          req.permission.name === 'ros/Openshift on Azure/kube-system'
            ? AuthorizeResult.ALLOW
            : AuthorizeResult.DENY,
      })),
    );

    const rosResult = await filterAuthorizedClustersAndProjects(
      mockRequest,
      rosAuth.permissions,
      rosAuth.httpAuth,
      { 'Openshift on Azure': 'uuid-azure' },
      ['kube-system'],
      'ros',
    );

    expect(rosResult.authorizedClusterIds).toEqual(['uuid-azure']);
    expect(rosResult.authorizedClusterProjects).toEqual([
      { cluster: 'uuid-azure', project: 'kube-system' },
    ]);
  });
});
