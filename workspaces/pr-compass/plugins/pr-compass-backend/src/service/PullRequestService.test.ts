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
import { ConfigReader } from '@backstage/config';
import {
  PullRequestBadges,
  SourceErrorCodes,
  type PullRequest,
} from '@red-hat-developer-hub/backstage-plugin-pr-compass-common';
import { PullRequestProvider } from '@red-hat-developer-hub/backstage-plugin-pr-compass-node';
import { pr } from '../../__fixtures__';
import { createMockPullRequestProvider } from '../../__fixtures__/mockPullRequestProvider';
import { PullRequestProvidersRegistry } from '../providers/PullRequestProvidersRegistry';
import { PullRequestService } from './PullRequestService';
import { SourceResolver } from './SourceResolver';

const options = { filters: {}, page: 1, pageSize: 20 };

describe('PullRequestService', () => {
  let service: PullRequestService;
  let registry: PullRequestProvidersRegistry;
  let github: jest.Mocked<PullRequestProvider>;
  let gitlab: jest.Mocked<PullRequestProvider>;
  let logger: ReturnType<typeof mockServices.logger.mock>;

  beforeEach(() => {
    registry = new PullRequestProvidersRegistry();
    github = createMockPullRequestProvider('github');
    gitlab = createMockPullRequestProvider('gitlab');
    registry.register(github);
    registry.register(gitlab);
    const sourceResolver = SourceResolver.fromConfig(new ConfigReader({}), {
      providersRegistry: registry,
    });
    logger = mockServices.logger.mock();
    service = new PullRequestService({
      sourceResolver,
      providersRegistry: registry,
      logger,
      maxPullRequests: 100,
    });
  });

  it('sorts pull requests from all sources before paging', async () => {
    github.listPullRequests.mockResolvedValue({
      items: [
        pr({ number: 4, badge: PullRequestBadges.MergeReady }),
        pr({
          number: 1,
          badge: PullRequestBadges.NeedsReview,
          updatedAt: '2026-01-01T00:00:00Z',
        }),
      ],
      truncated: false,
    });
    gitlab.listPullRequests.mockResolvedValue({
      items: [
        pr({
          number: 3,
          provider: 'gitlab',
          badge: PullRequestBadges.InProgress,
        }),
        pr({
          number: 2,
          provider: 'gitlab',
          badge: PullRequestBadges.NeedsReview,
          updatedAt: '2026-01-01T00:00:00Z',
        }),
      ],
      truncated: true,
    });

    const result = await service.list({
      ...options,
      page: 2,
      pageSize: 2,
      scmTokens: {
        'github:github.com': 'github-token',
        'gitlab:gitlab.com': 'gitlab-token',
      },
    });

    expect(result.items.map(item => item.id)).toEqual([
      'gitlab.com/acme/repo#3',
      'github.com/acme/repo#4',
    ]);
    expect(result).toMatchObject({
      page: 2,
      pageSize: 2,
      total: 4,
      sources: [
        { sourceId: 'github:github.com', truncated: false },
        { sourceId: 'gitlab:gitlab.com', truncated: true },
      ],
    });
  });

  it.each([
    [1, 2, ['github.com/acme/repo#1', 'github.com/acme/repo#2']],
    [2, 2, ['github.com/acme/repo#3', 'github.com/acme/repo#4']],
    [2, 3, ['github.com/acme/repo#4']],
    [99, 2, []],
  ])('returns page %i with page size %i', async (page, pageSize, ids) => {
    github.listPullRequests.mockResolvedValue({
      items: Array.from({ length: 4 }, (_, i) =>
        pr({
          number: i + 1,
          badge: PullRequestBadges.InProgress,
          updatedAt: `2026-01-0${4 - i}T00:00:00Z`,
        }),
      ),
      truncated: false,
    });

    const result = await service.list({
      ...options,
      page,
      pageSize,
      scmTokens: {
        'github:github.com': 'github-token',
        'gitlab:gitlab.com': 'gitlab-token',
      },
    });

    expect(result.items.map(item => item.id)).toEqual(ids);
    expect(result).toMatchObject({ page, pageSize, total: 4 });
  });

  it('reports a missing SCM session when no token is supplied', async () => {
    const result = await service.list({ ...options, scmTokens: {} });

    expect(result.sources).toEqual([
      {
        sourceId: 'github:github.com',
        error: SourceErrorCodes.SCM_SESSION_REQUIRED,
      },
      {
        sourceId: 'gitlab:gitlab.com',
        error: SourceErrorCodes.SCM_SESSION_REQUIRED,
      },
    ]);
    expect(github.listPullRequests).not.toHaveBeenCalled();
    expect(gitlab.listPullRequests).not.toHaveBeenCalled();
  });

  it('ignores unknown source tokens and reports each missing session', async () => {
    const result = await service.list({
      ...options,
      scmTokens: { 'github:unknown.example': 'token' },
    });

    expect(result.sources).toEqual([
      {
        sourceId: 'github:github.com',
        error: SourceErrorCodes.SCM_SESSION_REQUIRED,
      },
      {
        sourceId: 'gitlab:gitlab.com',
        error: SourceErrorCodes.SCM_SESSION_REQUIRED,
      },
    ]);
    expect(github.listPullRequests).not.toHaveBeenCalled();
    expect(gitlab.listPullRequests).not.toHaveBeenCalled();
  });

  it('reports a missing session alongside a successful source', async () => {
    const result = await service.list({
      ...options,
      scmTokens: {
        'github:github.com': 'github-token',
        'github:unknown.example': 'unknown-token',
      },
    });

    expect(result.sources).toEqual([
      { sourceId: 'github:github.com', truncated: false },
      {
        sourceId: 'gitlab:gitlab.com',
        error: SourceErrorCodes.SCM_SESSION_REQUIRED,
      },
    ]);
    expect(github.listPullRequests).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'github.com',
        token: 'github-token',
      }),
    );
    expect(gitlab.listPullRequests).not.toHaveBeenCalled();
  });

  it('returns no source statuses when no providers are registered', async () => {
    const emptyRegistry = new PullRequestProvidersRegistry();
    const sourceResolver = SourceResolver.fromConfig(new ConfigReader({}), {
      providersRegistry: emptyRegistry,
    });
    service = new PullRequestService({
      sourceResolver,
      providersRegistry: emptyRegistry,
      logger,
      maxPullRequests: 100,
    });
    const tokenMaps: Record<string, string>[] = [
      {},
      { 'github:github.com': 'github-token' },
    ];
    for (const scmTokens of tokenMaps) {
      const result = await service.list({ ...options, scmTokens });
      expect(result.sources).toEqual([]);
    }
  });

  it('skips discovered sources without a provider', async () => {
    jest.spyOn(registry, 'getProvider').mockReturnValue(undefined);
    const result = await service.list({
      ...options,
      scmTokens: { 'github:github.com': 'github-token' },
    });
    expect(result.sources).toEqual([]);
    expect(github.listPullRequests).not.toHaveBeenCalled();
    expect(gitlab.listPullRequests).not.toHaveBeenCalled();
  });

  it('drops malformed pull requests from a provider', async () => {
    github.listPullRequests.mockResolvedValue({
      items: [
        pr({ number: 1 }),
        pr({
          number: 2,
          updatedAt: '2026-01-02T00:00:00+02:00',
        }),
        {
          ...pr({ number: 3 }),
          badge: 'ghu_secret',
        } as unknown as PullRequest,
        {
          ...pr({ number: 4 }),
          badge: 'ghu_secret',
        } as unknown as PullRequest,
      ],
      truncated: false,
    });
    gitlab.listPullRequests.mockResolvedValue({ items: [], truncated: false });

    const result = await service.list({
      ...options,
      scmTokens: {
        'github:github.com': 'github-token',
        'gitlab:gitlab.com': 'gitlab-token',
      },
    });

    expect(result.total).toBe(1);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      "Discarded 3 invalid pull request(s) from source 'github:github.com'",
    );
    expect(logger.warn.mock.calls[0][0]).not.toContain('ghu_secret');
  });

  it('reports a provider failure alongside another source success', async () => {
    const error = new Error('fetch failed');
    gitlab.listPullRequests.mockRejectedValue(error);

    const result = await service.list({
      ...options,
      scmTokens: {
        'github:github.com': 'github-token',
        'gitlab:gitlab.com': 'gitlab-token',
      },
    });

    expect(result.sources).toEqual(
      expect.arrayContaining([
        { sourceId: 'github:github.com', truncated: false },
        { sourceId: 'gitlab:gitlab.com', error: SourceErrorCodes.FETCH_FAILED },
      ]),
    );
    expect(github.listPullRequests).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'github.com',
        token: 'github-token',
      }),
    );
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      `Failed to list pull requests from source 'gitlab:gitlab.com': ${error}`,
    );
  });
});
