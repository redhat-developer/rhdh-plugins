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

import { mockServices } from '@backstage/backend-test-utils';
import { emitAuditLog, resolveActor } from './auditLog';
import type { RouterOptions } from '../models/RouterOptions';

describe('auditLog', () => {
  const createOptions = (): RouterOptions => ({
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

  describe('emitAuditLog', () => {
    it('emits a structured audit log entry with all fields', () => {
      const options = createOptions();
      const logSpy = jest.spyOn(options.logger, 'info');

      emitAuditLog(options, {
        actor: 'user:default/testuser',
        action: 'data_access',
        resource: 'recommendations/openshift',
        decision: 'ALLOW',
        filters: { clusters: ['demo'], projects: ['thanos'] },
      });

      expect(logSpy).toHaveBeenCalledTimes(1);
      const logMessage = logSpy.mock.calls[0][0];
      const parsed = JSON.parse(logMessage);

      expect(parsed.audit).toBe(true);
      expect(parsed.actor).toBe('user:default/testuser');
      expect(parsed.action).toBe('data_access');
      expect(parsed.resource).toBe('recommendations/openshift');
      expect(parsed.decision).toBe('ALLOW');
      expect(parsed.filters).toEqual({
        clusters: ['demo'],
        projects: ['thanos'],
      });
    });

    it('includes meta fields when provided', () => {
      const options = createOptions();
      const logSpy = jest.spyOn(options.logger, 'info');

      emitAuditLog(options, {
        actor: 'user:default/admin',
        action: 'apply_recommendation',
        resource: '/apply-recommendation/patch-k8s-resource',
        decision: 'ALLOW',
        meta: {
          workflowId: 'patch-k8s-resource',
          cluster: 'demolab',
          outcome: 'success',
        },
      });

      const parsed = JSON.parse(logSpy.mock.calls[0][0]);
      expect(parsed.meta.workflowId).toBe('patch-k8s-resource');
      expect(parsed.meta.cluster).toBe('demolab');
      expect(parsed.meta.outcome).toBe('success');
    });
  });

  describe('resolveActor', () => {
    it('returns a user entity ref from httpAuth credentials', async () => {
      const options = createOptions();
      const mockReq = { headers: {} } as any;

      const actor = await resolveActor(mockReq, options);
      expect(typeof actor).toBe('string');
      expect(actor.length).toBeGreaterThan(0);
    });

    it('returns unknown when user info resolution fails', async () => {
      const options = createOptions();
      jest
        .spyOn(options.userInfo, 'getUserInfo')
        .mockRejectedValueOnce(new Error('no user'));
      const mockReq = { headers: {} } as any;

      const actor = await resolveActor(mockReq, options);
      expect(actor).toBe('unknown');
    });
  });
});
