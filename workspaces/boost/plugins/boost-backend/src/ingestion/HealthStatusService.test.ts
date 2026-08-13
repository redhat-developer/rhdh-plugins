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
import type { SyncAttemptRecord } from '@red-hat-developer-hub/backstage-plugin-boost-common';
import { HealthStatusService } from './HealthStatusService';
import { ErrorClassifier } from './ErrorClassifier';
import type { SyncAttemptsStore } from './SyncAttemptsStore';
import type { ConnectorConfigReader } from './ConnectorConfigReader';
import type { ConnectorCandidate } from './ConnectorConfigReader';

function createMockLogger(): LoggerService {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
}

function makeAttempt(
  overrides: Partial<SyncAttemptRecord> = {},
): SyncAttemptRecord {
  return {
    id: `attempt-${Math.random().toString(36).slice(2, 8)}`,
    connectorId: 'github',
    timestamp: new Date().toISOString(),
    outcome: 'success',
    errorType: null,
    errorMessage: null,
    assetsAdded: 0,
    assetsUpdated: 0,
    assetsRemoved: 0,
    durationMs: 100,
    ...overrides,
  };
}

describe('HealthStatusService', () => {
  describe('deriveStatus', () => {
    it('returns unknown for 0 attempts', () => {
      expect(HealthStatusService.deriveStatus([])).toBe('unknown');
    });

    it('returns healthy for 3 successful attempts', () => {
      const attempts = [
        makeAttempt({ outcome: 'success' }),
        makeAttempt({ outcome: 'success' }),
        makeAttempt({ outcome: 'success' }),
      ];
      expect(HealthStatusService.deriveStatus(attempts)).toBe('healthy');
    });

    it('returns failing for 3 failed attempts', () => {
      const attempts = [
        makeAttempt({ outcome: 'failure' }),
        makeAttempt({ outcome: 'failure' }),
        makeAttempt({ outcome: 'failure' }),
      ];
      expect(HealthStatusService.deriveStatus(attempts)).toBe('failing');
    });

    it('returns degraded for mixed results', () => {
      const attempts = [
        makeAttempt({ outcome: 'success' }),
        makeAttempt({ outcome: 'failure' }),
        makeAttempt({ outcome: 'success' }),
      ];
      expect(HealthStatusService.deriveStatus(attempts)).toBe('degraded');
    });

    it('returns healthy for 1 successful attempt', () => {
      const attempts = [makeAttempt({ outcome: 'success' })];
      expect(HealthStatusService.deriveStatus(attempts)).toBe('healthy');
    });

    it('returns failing for 1 failed attempt', () => {
      const attempts = [makeAttempt({ outcome: 'failure' })];
      expect(HealthStatusService.deriveStatus(attempts)).toBe('failing');
    });

    it('returns degraded for 2 attempts with mixed results', () => {
      const attempts = [
        makeAttempt({ outcome: 'success' }),
        makeAttempt({ outcome: 'failure' }),
      ];
      expect(HealthStatusService.deriveStatus(attempts)).toBe('degraded');
    });

    it('only considers the first 3 attempts', () => {
      const attempts = [
        makeAttempt({ outcome: 'success' }),
        makeAttempt({ outcome: 'success' }),
        makeAttempt({ outcome: 'success' }),
        makeAttempt({ outcome: 'failure' }), // should be ignored
      ];
      expect(HealthStatusService.deriveStatus(attempts)).toBe('healthy');
    });
  });

  describe('getHealthStatuses', () => {
    let service: HealthStatusService;
    let mockRepo: jest.Mocked<
      Pick<
        SyncAttemptsStore,
        | 'getLatestAttemptsForAll'
        | 'getDistinctConnectorIds'
        | 'getLastSuccessfulAttempt'
      >
    >;
    let mockConfigReader: jest.Mocked<
      Pick<ConnectorConfigReader, 'listCandidates'>
    >;

    beforeEach(() => {
      mockRepo = {
        getLatestAttemptsForAll: jest.fn().mockResolvedValue(new Map()),
        getDistinctConnectorIds: jest.fn().mockResolvedValue([]),
        getLastSuccessfulAttempt: jest.fn().mockResolvedValue(null),
      };
      mockConfigReader = {
        listCandidates: jest.fn().mockReturnValue([]),
      };
      service = new HealthStatusService({
        store: mockRepo as unknown as SyncAttemptsStore,
        configReader: mockConfigReader as unknown as ConnectorConfigReader,
        logger: createMockLogger(),
      });
    });

    it('returns empty array when no connectors configured', async () => {
      mockConfigReader.listCandidates.mockReturnValue([]);
      const result = await service.getHealthStatuses();
      expect(result).toEqual([]);
    });

    it('returns health for enabled connectors', async () => {
      const candidates: ConnectorCandidate[] = [
        {
          connectorId: 'github',
          connectorType: 'github',
          startupEnabled: true,
          runtimeEnabled: true,
        },
      ];
      mockConfigReader.listCandidates.mockReturnValue(candidates);
      mockRepo.getLatestAttemptsForAll.mockResolvedValue(
        new Map([['github', []]]),
      );

      const result = await service.getHealthStatuses();
      expect(result).toHaveLength(1);
      expect(result[0].connectorId).toBe('github');
      expect(result[0].status).toBe('unknown');
      expect(result[0].enabled).toBe(true);
    });

    it('excludes disabled connectors by default', async () => {
      const candidates: ConnectorCandidate[] = [
        {
          connectorId: 'github',
          connectorType: 'github',
          startupEnabled: true,
          runtimeEnabled: true,
        },
        {
          connectorId: 'jira',
          connectorType: 'jira',
          startupEnabled: true,
          runtimeEnabled: false,
        },
      ];
      mockConfigReader.listCandidates.mockReturnValue(candidates);
      mockRepo.getLatestAttemptsForAll.mockResolvedValue(
        new Map([['github', []]]),
      );

      const result = await service.getHealthStatuses(false);
      expect(result).toHaveLength(1);
      expect(result[0].connectorId).toBe('github');
    });

    it('includes disabled connectors when includeDisabled=true', async () => {
      const candidates: ConnectorCandidate[] = [
        {
          connectorId: 'github',
          connectorType: 'github',
          startupEnabled: true,
          runtimeEnabled: true,
        },
        {
          connectorId: 'jira',
          connectorType: 'jira',
          startupEnabled: true,
          runtimeEnabled: false,
        },
      ];
      mockConfigReader.listCandidates.mockReturnValue(candidates);
      mockRepo.getLatestAttemptsForAll.mockResolvedValue(
        new Map([
          ['github', []],
          ['jira', []],
        ]),
      );

      const result = await service.getHealthStatuses(true);
      expect(result).toHaveLength(2);
      const jira = result.find(r => r.connectorId === 'jira');
      expect(jira).toBeDefined();
      expect(jira!.enabled).toBe(false);
      expect(jira!.status).toBe('unknown');
    });

    it('builds correct health status with sync history', async () => {
      const candidates: ConnectorCandidate[] = [
        {
          connectorId: 'github',
          connectorType: 'github',
          startupEnabled: true,
          runtimeEnabled: true,
        },
      ];
      mockConfigReader.listCandidates.mockReturnValue(candidates);

      const attempts = [
        makeAttempt({
          connectorId: 'github',
          outcome: 'failure',
          errorType: 'auth',
          errorMessage: '401 Unauthorized',
          timestamp: '2026-08-10T12:00:00Z',
        }),
        makeAttempt({
          connectorId: 'github',
          outcome: 'success',
          timestamp: '2026-08-10T11:00:00Z',
          assetsAdded: 5,
          assetsUpdated: 3,
          assetsRemoved: 1,
        }),
        makeAttempt({
          connectorId: 'github',
          outcome: 'success',
          timestamp: '2026-08-10T10:00:00Z',
        }),
      ];
      mockRepo.getLatestAttemptsForAll.mockResolvedValue(
        new Map([['github', attempts]]),
      );
      mockRepo.getLastSuccessfulAttempt.mockResolvedValue(attempts[1]);

      const result = await service.getHealthStatuses();
      expect(result).toHaveLength(1);
      const gh = result[0];
      expect(gh.status).toBe('degraded');
      expect(gh.lastSyncAttempt).toBe('2026-08-10T12:00:00Z');
      expect(gh.lastSuccessfulSync).toBe('2026-08-10T11:00:00Z');
      expect(gh.errorSummary).not.toBeNull();
      expect(gh.errorSummary!.errorType).toBe('auth');
      expect(gh.errorSummary!.diagnosticGuidance).toContain(
        'service account credentials',
      );
      expect(gh.metrics.assetsAdded).toBe(0); // From latest (failed) attempt
    });

    it('returns null errorSummary when all attempts succeeded', async () => {
      const candidates: ConnectorCandidate[] = [
        {
          connectorId: 'github',
          connectorType: 'github',
          startupEnabled: true,
          runtimeEnabled: true,
        },
      ];
      mockConfigReader.listCandidates.mockReturnValue(candidates);

      const attempts = [
        makeAttempt({
          connectorId: 'github',
          outcome: 'success',
          assetsAdded: 10,
          assetsUpdated: 5,
          assetsRemoved: 2,
        }),
      ];
      mockRepo.getLatestAttemptsForAll.mockResolvedValue(
        new Map([['github', attempts]]),
      );
      mockRepo.getLastSuccessfulAttempt.mockResolvedValue(attempts[0]);

      const result = await service.getHealthStatuses();
      expect(result[0].errorSummary).toBeNull();
      expect(result[0].metrics.assetsAdded).toBe(10);
    });

    it('includes errorSummary for degraded when latest attempt succeeded', async () => {
      const candidates: ConnectorCandidate[] = [
        {
          connectorId: 'github',
          connectorType: 'github',
          startupEnabled: true,
          runtimeEnabled: true,
        },
      ];
      mockConfigReader.listCandidates.mockReturnValue(candidates);

      const attempts = [
        makeAttempt({
          connectorId: 'github',
          outcome: 'success',
          timestamp: '2026-08-10T12:00:00Z',
          assetsAdded: 2,
        }),
        makeAttempt({
          connectorId: 'github',
          outcome: 'failure',
          errorType: 'network',
          errorMessage: 'ECONNREFUSED',
          timestamp: '2026-08-10T11:00:00Z',
        }),
        makeAttempt({
          connectorId: 'github',
          outcome: 'success',
          timestamp: '2026-08-10T10:00:00Z',
        }),
      ];
      mockRepo.getLatestAttemptsForAll.mockResolvedValue(
        new Map([['github', attempts]]),
      );
      mockRepo.getLastSuccessfulAttempt.mockResolvedValue(attempts[0]);

      const result = await service.getHealthStatuses();
      expect(result[0].status).toBe('degraded');
      expect(result[0].errorSummary).not.toBeNull();
      expect(result[0].errorSummary!.errorType).toBe('network');
      expect(result[0].errorSummary!.errorMessage).toBe('ECONNREFUSED');
      expect(result[0].errorSummary!.diagnosticGuidance).toContain(
        'Network connectivity',
      );
    });

    it('uses last successful sync outside the status window', async () => {
      const candidates: ConnectorCandidate[] = [
        {
          connectorId: 'github',
          connectorType: 'github',
          startupEnabled: true,
          runtimeEnabled: true,
        },
      ];
      mockConfigReader.listCandidates.mockReturnValue(candidates);

      const recentFailures = [
        makeAttempt({
          connectorId: 'github',
          outcome: 'failure',
          errorType: 'auth',
          errorMessage: '401 Unauthorized',
          timestamp: '2026-08-10T14:00:00Z',
        }),
        makeAttempt({
          connectorId: 'github',
          outcome: 'failure',
          errorType: 'auth',
          errorMessage: '401 Unauthorized',
          timestamp: '2026-08-10T13:00:00Z',
        }),
        makeAttempt({
          connectorId: 'github',
          outcome: 'failure',
          errorType: 'auth',
          errorMessage: '401 Unauthorized',
          timestamp: '2026-08-10T12:00:00Z',
        }),
      ];
      const olderSuccess = makeAttempt({
        connectorId: 'github',
        outcome: 'success',
        timestamp: '2026-08-09T10:00:00Z',
      });

      mockRepo.getLatestAttemptsForAll.mockResolvedValue(
        new Map([['github', recentFailures]]),
      );
      mockRepo.getLastSuccessfulAttempt.mockResolvedValue(olderSuccess);

      const result = await service.getHealthStatuses();
      expect(result[0].status).toBe('failing');
      expect(result[0].lastSuccessfulSync).toBe('2026-08-09T10:00:00Z');
    });

    it('prefers stored errorType over reclassification from message alone', async () => {
      const candidates: ConnectorCandidate[] = [
        {
          connectorId: 'github',
          connectorType: 'github',
          startupEnabled: true,
          runtimeEnabled: true,
        },
      ];
      mockConfigReader.listCandidates.mockReturnValue(candidates);

      // Ambiguous message that could reclassify differently; stored type wins.
      const attempts = [
        makeAttempt({
          connectorId: 'github',
          outcome: 'failure',
          errorType: 'auth',
          errorMessage: 'Request failed for upstream service',
          timestamp: '2026-08-10T14:00:00Z',
        }),
      ];
      mockRepo.getLatestAttemptsForAll.mockResolvedValue(
        new Map([['github', attempts]]),
      );

      const result = await service.getHealthStatuses();
      expect(result[0].errorSummary).not.toBeNull();
      expect(result[0].errorSummary!.errorType).toBe('auth');
      expect(result[0].errorSummary!.errorMessage).toBe(
        'Request failed for upstream service',
      );
      expect(result[0].errorSummary!.diagnosticGuidance).toBe(
        ErrorClassifier.guidanceFor('auth'),
      );
    });
  });
});
