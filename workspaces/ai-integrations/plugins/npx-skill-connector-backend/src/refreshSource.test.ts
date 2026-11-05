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
import { createLoadingSnapshot } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import type { SkillSnapshot } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import type { NpxSourceConfig } from './services/types';

// jest.mock factories run before variable declarations, so use inline jest.fn()
jest.mock('./services/discoverIndex', () => ({
  discoverIndex: jest.fn(),
}));

jest.mock('./services/processArtifacts', () => ({
  processArtifacts: jest.fn(),
}));

// Import after mocks are set up
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { refreshSource } = require('./plugin');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { discoverIndex } = require('./services/discoverIndex');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { processArtifacts } = require('./services/processArtifacts');

/** Minimal mock logger. */
function createMockLogger(): LoggerService {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  } as unknown as LoggerService;
}

/** Default source config for tests. */
const source: NpxSourceConfig = {
  id: 'test-source',
  indexUrl: 'https://skills.example.com/index.json',
  schedule: {
    frequency: { minutes: 10 },
    timeout: { minutes: 10 },
    initialDelay: { seconds: 0 },
    scope: 'local',
  },
};

describe('refreshSource', () => {
  let snapshots: Map<string, SkillSnapshot>;
  let logger: LoggerService;

  beforeEach(() => {
    snapshots = new Map();
    snapshots.set(
      source.id,
      createLoadingSnapshot({ id: source.id, type: 'npx' }),
    );
    logger = createMockLogger();
    jest.clearAllMocks();
  });

  it('publishes a failed snapshot on total discovery failure', async () => {
    discoverIndex.mockResolvedValue({
      entries: [],
      failedKeys: [],
      complete: false,
    });

    await refreshSource(source, snapshots, logger);

    const snapshot = snapshots.get(source.id)!;
    expect(snapshot.status).toBe('failed');
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Discovery failed'),
    );
    // processArtifacts should not be called when discovery fails completely
    expect(processArtifacts).not.toHaveBeenCalled();
  });

  it('publishes a partial snapshot with failed keys from both phases', async () => {
    discoverIndex.mockResolvedValue({
      entries: [
        {
          name: 'good-skill',
          type: 'skill-md',
          url: 'https://skills.example.com/good/SKILL.md',
          digest: 'sha256:abc123',
        },
      ],
      failedKeys: ['discovery-fail'],
      complete: false,
    });

    processArtifacts.mockResolvedValue({
      records: [
        {
          key: 'good-skill',
          name: 'Good Skill',
          sourceUri: 'https://skills.example.com/good/SKILL.md',
          digest: 'sha256:abc123',
          extensions: { npx: { type: 'skill-md' } },
        },
      ],
      failedKeys: ['artifact-fail'],
    });

    await refreshSource(source, snapshots, logger);

    const snapshot = snapshots.get(source.id)!;
    expect(snapshot.status).toBe('partial');
    expect(snapshot.skills).toHaveLength(1);
    expect(snapshot.failedSkillKeys).toEqual(
      expect.arrayContaining(['discovery-fail', 'artifact-fail']),
    );
  });

  it('publishes a ready snapshot on full success', async () => {
    discoverIndex.mockResolvedValue({
      entries: [
        {
          name: 'my-skill',
          type: 'skill-md',
          url: 'https://skills.example.com/my/SKILL.md',
          digest: 'sha256:abc123',
        },
      ],
      failedKeys: [],
      complete: true,
    });

    processArtifacts.mockResolvedValue({
      records: [
        {
          key: 'my-skill',
          name: 'My Skill',
          sourceUri: 'https://skills.example.com/my/SKILL.md',
          digest: 'sha256:abc123',
          extensions: { npx: { type: 'skill-md' } },
        },
      ],
      failedKeys: [],
    });

    await refreshSource(source, snapshots, logger);

    const snapshot = snapshots.get(source.id)!;
    expect(snapshot.status).toBe('ready');
    expect(snapshot.skills).toHaveLength(1);
    expect(snapshot.failedSkillKeys).toEqual([]);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Refresh complete'),
    );
  });

  it('publishes a failed snapshot when discoverIndex throws', async () => {
    discoverIndex.mockRejectedValue(new Error('Network timeout'));

    await refreshSource(source, snapshots, logger);

    const snapshot = snapshots.get(source.id)!;
    expect(snapshot.status).toBe('failed');
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Unexpected error'),
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Network timeout'),
    );
  });

  it('publishes a failed snapshot when processArtifacts throws', async () => {
    discoverIndex.mockResolvedValue({
      entries: [
        {
          name: 'some-skill',
          type: 'skill-md',
          url: 'https://skills.example.com/some/SKILL.md',
          digest: 'sha256:abc123',
        },
      ],
      failedKeys: [],
      complete: true,
    });

    processArtifacts.mockRejectedValue(
      new TypeError('Cannot read properties of undefined'),
    );

    await refreshSource(source, snapshots, logger);

    const snapshot = snapshots.get(source.id)!;
    expect(snapshot.status).toBe('failed');
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Unexpected error'),
    );
  });

  it('publishes a failed snapshot for discovery with failed keys but no entries', async () => {
    discoverIndex.mockResolvedValue({
      entries: [],
      failedKeys: ['bad-entry-1', 'bad-entry-2'],
      complete: false,
    });

    await refreshSource(source, snapshots, logger);

    const snapshot = snapshots.get(source.id)!;
    // Zero entries with incomplete discovery is always a failure,
    // even when failed keys are present
    expect(snapshot.status).toBe('failed');
    expect(processArtifacts).not.toHaveBeenCalled();
  });
});
