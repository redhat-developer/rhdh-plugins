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
import { ConfigReader } from '@backstage/config';
import { ConnectorConfigReader } from './ConnectorConfigReader';

function createMockLogger(): LoggerService {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
}

describe('ConnectorConfigReader', () => {
  it('discovers startup-enabled known providers', () => {
    const config = new ConfigReader({
      'ai-catalog': {
        providers: {
          github: { enabled: true },
          gitlab: {},
          jira: { enabled: true },
        },
      },
    });

    const reader = new ConnectorConfigReader({
      config,
      logger: createMockLogger(),
    });
    const candidates = reader.listCandidates();

    expect(candidates).toHaveLength(3);
    expect(candidates.map(c => c.connectorId).sort()).toEqual([
      'github',
      'gitlab',
      'jira',
    ]);
    expect(candidates.every(c => c.startupEnabled)).toBe(true);
    expect(candidates.every(c => c.runtimeEnabled)).toBe(true);
  });

  it('excludes startup-disabled providers', () => {
    const config = new ConfigReader({
      'ai-catalog': {
        providers: {
          github: { enabled: false },
          jira: { enabled: true },
        },
      },
    });

    const reader = new ConnectorConfigReader({
      config,
      logger: createMockLogger(),
    });
    const candidates = reader.listCandidates();

    expect(candidates).toHaveLength(1);
    expect(candidates[0].connectorId).toBe('jira');
  });

  it('honors boost.connectors.<id>.enabled for runtimeEnabled', () => {
    const config = new ConfigReader({
      'ai-catalog': {
        providers: {
          github: { enabled: true },
          jira: { enabled: true },
        },
      },
      boost: {
        connectors: {
          github: { enabled: false },
          jira: { enabled: true },
        },
      },
    });

    const reader = new ConnectorConfigReader({
      config,
      logger: createMockLogger(),
    });
    const candidates = reader.listCandidates();

    const github = candidates.find(c => c.connectorId === 'github');
    const jira = candidates.find(c => c.connectorId === 'jira');
    expect(github?.runtimeEnabled).toBe(false);
    expect(jira?.runtimeEnabled).toBe(true);
  });

  it('excludes boost-only IDs without a provider block', () => {
    const config = new ConfigReader({
      'ai-catalog': {
        providers: {
          github: { enabled: true },
        },
      },
      boost: {
        connectors: {
          github: { enabled: true },
          orphanConnector: { enabled: true },
        },
      },
    });

    const reader = new ConnectorConfigReader({
      config,
      logger: createMockLogger(),
    });
    const candidates = reader.listCandidates();

    expect(candidates).toHaveLength(1);
    expect(candidates[0].connectorId).toBe('github');
    expect(
      candidates.find(c => c.connectorId === 'orphanConnector'),
    ).toBeUndefined();
  });
});
