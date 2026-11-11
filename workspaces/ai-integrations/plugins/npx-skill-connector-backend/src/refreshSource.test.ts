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
import { createMockLogger, testSource as source } from './testUtils';

// jest.mock factories run before variable declarations, so use inline jest.fn()
jest.mock('./services/discoverIndex', () => ({
  discoverIndex: jest.fn(),
}));

jest.mock('./services/processArtifacts', () => ({
  processArtifacts: jest.fn(),
}));

// Import after mocks are set up
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { refreshSource } = require('./services/refreshSource');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { discoverIndex } = require('./services/discoverIndex');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { processArtifacts } = require('./services/processArtifacts');

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

  afterEach(() => jest.restoreAllMocks());

  it('publishes a failed snapshot on total discovery failure', async () => {
    discoverIndex.mockResolvedValue({
      entries: [],
      failedKeys: [],
      hasUsablePage: false,
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
      hasUsablePage: true,
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
      hasUsablePage: true,
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
      hasUsablePage: true,
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

  it('publishes a partial snapshot with known failures and no valid entries', async () => {
    discoverIndex.mockResolvedValue({
      entries: [],
      failedKeys: ['bad-entry-1', 'bad-entry-2'],
      hasUsablePage: true,
      complete: false,
    });
    processArtifacts.mockResolvedValue({ records: [], failedKeys: [] });

    await refreshSource(source, snapshots, logger);

    const snapshot = snapshots.get(source.id)!;
    expect(snapshot.status).toBe('partial');
    expect(snapshot.skills).toEqual([]);
    expect(snapshot.failedSkillKeys).toEqual(['bad-entry-1', 'bad-entry-2']);
  });

  it('publishes a partial snapshot when a later page fails without known keys', async () => {
    discoverIndex.mockResolvedValue({
      entries: [],
      failedKeys: [],
      hasUsablePage: true,
      complete: false,
    });
    processArtifacts.mockResolvedValue({ records: [], failedKeys: [] });

    await refreshSource(source, snapshots, logger);

    expect(snapshots.get(source.id)).toMatchObject({
      status: 'partial',
      skills: [],
      failedSkillKeys: [],
    });
  });

  it('publishes a ready snapshot for a complete empty index', async () => {
    discoverIndex.mockResolvedValue({
      entries: [],
      failedKeys: [],
      hasUsablePage: true,
      complete: true,
    });
    processArtifacts.mockResolvedValue({ records: [], failedKeys: [] });

    await refreshSource(source, snapshots, logger);

    expect(snapshots.get(source.id)).toMatchObject({
      status: 'ready',
      skills: [],
      failedSkillKeys: [],
    });
  });

  it('shares the five-minute deadline across both phases', async () => {
    const deadline = new AbortController();
    const timeoutSpy = jest
      .spyOn(AbortSignal, 'timeout')
      .mockReturnValue(deadline.signal);
    discoverIndex.mockResolvedValue({
      entries: [],
      failedKeys: [],
      hasUsablePage: true,
      complete: true,
    });
    processArtifacts.mockImplementation(async () => {
      deadline.abort();
      return { records: [], failedKeys: [] };
    });

    await refreshSource(source, snapshots, logger);

    expect(timeoutSpy).toHaveBeenCalledWith(5 * 60 * 1_000);
    expect(processArtifacts.mock.calls[0][3]).toBe(
      discoverIndex.mock.calls[0][2],
    );
    expect(snapshots.get(source.id)?.status).toBe('partial');
  });
});
