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

import express from 'express';
import request from 'supertest';
import { mockServices } from '@backstage/backend-test-utils';

import {
  createRouter,
  extractStrings,
  buildClusterProjectPermissions,
} from './router';
import type { BasicPermission } from '@backstage/plugin-permission-common';

describe('extractStrings', () => {
  it('returns values from a fulfilled result', () => {
    const result: PromiseSettledResult<{
      data?: { name: string; alias?: string }[];
    }> = {
      status: 'fulfilled',
      value: {
        data: [
          { name: 'a', alias: 'x' },
          { name: 'b' },
          { name: 'c', alias: 'y' },
        ],
      },
    };
    const out = extractStrings(result, item => item.alias);
    expect(out).toEqual(new Set(['x', 'y']));
  });

  it('returns empty set for rejected result', () => {
    const result: PromiseSettledResult<{ data?: unknown[] }> = {
      status: 'rejected',
      reason: new Error('fail'),
    };
    expect(extractStrings(result, () => 'x')).toEqual(new Set());
  });

  it('returns empty set when data is undefined', () => {
    const result: PromiseSettledResult<{ data?: unknown[] }> = {
      status: 'fulfilled',
      value: {},
    };
    expect(extractStrings(result, () => 'x')).toEqual(new Set());
  });

  it('deduplicates values', () => {
    const result: PromiseSettledResult<{ data?: { v: string }[] }> = {
      status: 'fulfilled',
      value: { data: [{ v: 'a' }, { v: 'a' }, { v: 'b' }] },
    };
    expect(extractStrings(result, i => i.v)).toEqual(new Set(['a', 'b']));
  });

  it('skips falsy values from accessor', () => {
    const result: PromiseSettledResult<{
      data?: { v: string | undefined }[];
    }> = {
      status: 'fulfilled',
      value: { data: [{ v: undefined }, { v: '' }, { v: 'ok' }] },
    };
    expect(extractStrings(result, i => i.v)).toEqual(new Set(['ok']));
  });
});

describe('buildClusterProjectPermissions', () => {
  const mockClusterFn = (c: string) =>
    ({ name: `ros/${c}`, type: 'basic', attributes: {} } as BasicPermission);
  const mockProjectFn = (c: string, p: string) =>
    ({
      name: `ros/${c}/${p}`,
      type: 'basic',
      attributes: {},
    } as BasicPermission);

  it('builds cluster + cluster/project combinations', () => {
    const perms = buildClusterProjectPermissions(
      new Set(['c1', 'c2']),
      new Set(['p1']),
      mockClusterFn,
      mockProjectFn,
    );
    expect(perms.map(p => p.name)).toEqual([
      'ros/c1',
      'ros/c1/p1',
      'ros/c2',
      'ros/c2/p1',
    ]);
  });

  it('returns only cluster perms when projects is empty', () => {
    const perms = buildClusterProjectPermissions(
      new Set(['c1']),
      new Set(),
      mockClusterFn,
      mockProjectFn,
    );
    expect(perms.map(p => p.name)).toEqual(['ros/c1']);
  });

  it('returns empty array when clusters is empty', () => {
    const perms = buildClusterProjectPermissions(
      new Set(),
      new Set(['p1']),
      mockClusterFn,
      mockProjectFn,
    );
    expect(perms).toEqual([]);
  });
});

describe('createRouter', () => {
  let app: express.Express;

  beforeAll(async () => {
    const router = await createRouter({
      logger: mockServices.rootLogger(),
      httpAuth: mockServices.httpAuth(),
      permissions: mockServices.permissions.mock(),
      cache: mockServices.cache.mock(),
      discovery: mockServices.discovery(),
      auth: mockServices.auth(),
      userInfo: mockServices.userInfo(),
      optimizationApi: {
        getRecommendationList: jest.fn(),
        getRecommendationById: jest.fn(),
      },
      costManagementApi: {
        getCostManagementReport: jest.fn(),
        downloadCostManagementReport: jest.fn(),
        searchOpenShiftProjects: jest.fn(),
        searchOpenShiftClusters: jest.fn(),
        searchOpenShiftNodes: jest.fn(),
        getOpenShiftTags: jest.fn(),
        getOpenShiftTagValues: jest.fn(),
      },
    });
    app = express().use(router);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /health', () => {
    it('returns ok', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });
});
