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
import type { SyncAttemptsRepository } from './SyncAttemptsRepository';
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
        SyncAttemptsRepository,
        'getLatestAttemptsForAll' | 'getDistinctConnectorIds'
      >
    >;
    let mockConfigReader: jest.Mocked<
      Pick<ConnectorConfigReader, 'listCandidates'>
    >;

    beforeEach(() => {
      mockRepo = {
        getLatestAttemptsForAll: jest.fn().mockResolvedValue(new Map()),
        getDistinctConnectorIds: jest.fn().mockResolvedValue([]),
      };
      mockConfigReader = {
        listCandidates: jest.fn().mockReturnValue([]),
      };
      service = new HealthStatusService({
        repository: mockRepo as unknown as SyncAttemptsRepository,
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

      const result = await service.getHealthStatuses();
      expect(result).toHaveLength(1);
      const gh = result[0];
      expect(gh.status).toBe('degraded');
      expect(gh.lastSyncAttempt).toBe('2026-08-10T12:00:00Z');
      expect(gh.lastSuccessfulSync).toBe('2026-08-10T11:00:00Z');
      expect(gh.errorSummary).not.toBeNull();
      expect(gh.errorSummary!.errorType).toBe('auth');
      expect(gh.metrics.assetsAdded).toBe(0); // From latest (failed) attempt
    });

    it('returns null errorSummary when last attempt succeeded', async () => {
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

      const result = await service.getHealthStatuses();
      expect(result[0].errorSummary).toBeNull();
      expect(result[0].metrics.assetsAdded).toBe(10);
    });
  });
});
