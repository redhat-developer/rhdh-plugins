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

import { mockErrorHandler, mockServices } from '@backstage/backend-test-utils';
import { ConfigReader } from '@backstage/config';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import {
  PullRequestBadges,
  SourceErrorCodes,
  type PullRequest,
} from '@red-hat-developer-hub/backstage-plugin-pr-compass-common';
import {
  PullRequestProviderError,
  type PullRequestProvider,
} from '@red-hat-developer-hub/backstage-plugin-pr-compass-node';
import express from 'express';
import request from 'supertest';
import { createMockPullRequestProvider } from '../../__fixtures__/mockPullRequestProvider';
import { pr } from '../../__fixtures__';
import { PullRequestProvidersRegistry } from '../providers/PullRequestProvidersRegistry';
import { PullRequestService } from './PullRequestService';
import { createRouter } from './router';
import { SCM_TOKENS_HEADER, SCM_TOKENS_MAX_BYTES } from '../validation';
import { SourceResolver } from './SourceResolver';

const GITHUB_TOKENS = JSON.stringify({ 'github:github.com': 'dummy_token' });
const PAGING_PULL_REQUESTS = Array.from({ length: 5 }, (_, i) =>
  pr({
    number: i + 1,
    badge: PullRequestBadges.InProgress,
    updatedAt: `2026-01-0${5 - i}T00:00:00Z`,
  }),
);

describe('createRouter', () => {
  let app: express.Express;
  let provider: jest.Mocked<PullRequestProvider>;
  let permissions: ReturnType<typeof mockServices.permissions.mock>;
  let config: ConfigReader;

  beforeEach(async () => {
    const registry = new PullRequestProvidersRegistry();
    provider = createMockPullRequestProvider('github');
    registry.register(provider);
    config = new ConfigReader({
      integrations: { github: [{ host: 'github.com', token: 'unused' }] },
    });
    const sourceResolver = SourceResolver.fromConfig(config, {
      providersRegistry: registry,
    });
    const logger = mockServices.logger.mock();
    permissions = mockServices.permissions.mock();
    permissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);

    const router = await createRouter({
      pullRequestService: new PullRequestService({
        sourceResolver,
        providersRegistry: registry,
        logger,
        maxPullRequests: 100,
      }),
      sourceResolver,
      httpAuth: mockServices.httpAuth(),
      permissions,
    });
    app = express();
    app.use(router);
    app.use(mockErrorHandler());
  });

  describe('GET /pull-requests', () => {
    it('returns a ranked page with per-source status', async () => {
      provider.listPullRequests.mockResolvedValue({
        items: [
          pr({ number: 3, badge: PullRequestBadges.MergeReady }),
          pr({ number: 1, badge: PullRequestBadges.NeedsReview }),
          pr({ number: 2, badge: PullRequestBadges.InProgress }),
        ],
        truncated: false,
      });

      const res = await request(app)
        .get('/pull-requests')
        .set(SCM_TOKENS_HEADER, GITHUB_TOKENS);

      expect(res.status).toBe(200);
      expect(res.body.items.map((p: PullRequest) => p.id)).toEqual([
        'github.com/acme/repo#1',
        'github.com/acme/repo#2',
        'github.com/acme/repo#3',
      ]);
      expect(res.body).toMatchObject({
        page: 1,
        pageSize: 20,
        total: 3,
        sources: [{ sourceId: 'github:github.com', truncated: false }],
      });
    });

    it('passes the token and filters to the provider', async () => {
      await request(app)
        .get('/pull-requests?badge=NeedsReview')
        .set(SCM_TOKENS_HEADER, GITHUB_TOKENS);

      expect(provider.listPullRequests.mock.calls).toEqual([
        [
          expect.objectContaining({
            host: 'github.com',
            token: 'dummy_token',
            filters: { badge: PullRequestBadges.NeedsReview },
            limit: 100,
          }),
        ],
      ]);
    });

    it('reports a missing SCM session', async () => {
      const res = await request(app).get('/pull-requests');

      expect(res.status).toBe(200);
      expect(res.body.items).toEqual([]);
      expect(res.body.sources).toEqual([
        {
          sourceId: 'github:github.com',
          error: SourceErrorCodes.SCM_SESSION_REQUIRED,
        },
      ]);
      expect(provider.listPullRequests).not.toHaveBeenCalled();
    });

    it('ignores tokens for unknown sources', async () => {
      const res = await request(app)
        .get('/pull-requests')
        .set(
          SCM_TOKENS_HEADER,
          JSON.stringify({ 'github:evil.example': 'stolen' }),
        );

      expect(res.status).toBe(200);
      expect(res.body.sources).toEqual([
        {
          sourceId: 'github:github.com',
          error: SourceErrorCodes.SCM_SESSION_REQUIRED,
        },
      ]);
      expect(provider.listPullRequests).not.toHaveBeenCalled();
    });

    it('reports a source error when a provider fails', async () => {
      provider.listPullRequests.mockRejectedValue(
        new Error('the provider is on fire'),
      );

      const res = await request(app)
        .get('/pull-requests')
        .set(SCM_TOKENS_HEADER, GITHUB_TOKENS);

      expect(res.status).toBe(200);
      expect(res.body.sources).toEqual([
        {
          sourceId: 'github:github.com',
          error: SourceErrorCodes.FETCH_FAILED,
        },
      ]);
    });

    it('reports a source error when a provider fails with PullRequestProviderError', async () => {
      provider.listPullRequests.mockRejectedValue(
        new PullRequestProviderError(
          SourceErrorCodes.RATE_LIMITED,
          'upstream request included dummy_token',
        ),
      );

      const res = await request(app)
        .get('/pull-requests')
        .set(SCM_TOKENS_HEADER, GITHUB_TOKENS);

      expect(res.status).toBe(200);
      expect(res.body.sources).toEqual([
        { sourceId: 'github:github.com', error: SourceErrorCodes.RATE_LIMITED },
      ]);
      expect(JSON.stringify(res.body)).not.toContain('dummy_token');
    });

    it('reports truncation per source', async () => {
      provider.listPullRequests.mockResolvedValue({
        items: [],
        truncated: true,
      });

      const res = await request(app)
        .get('/pull-requests')
        .set(SCM_TOKENS_HEADER, GITHUB_TOKENS);

      expect(res.body.sources).toEqual([
        { sourceId: 'github:github.com', truncated: true },
      ]);
    });

    it('pages the pull requests', async () => {
      provider.listPullRequests.mockResolvedValue({
        items: PAGING_PULL_REQUESTS,
        truncated: false,
      });

      const res = await request(app)
        .get('/pull-requests?page=2&pageSize=2')
        .set(SCM_TOKENS_HEADER, GITHUB_TOKENS);

      expect(res.body.items.map((p: PullRequest) => p.id)).toEqual([
        'github.com/acme/repo#3',
        'github.com/acme/repo#4',
      ]);
      expect(res.body).toMatchObject({ page: 2, pageSize: 2, total: 5 });
    });

    it('rejects an invalid query', async () => {
      const res = await request(app)
        .get('/pull-requests?page=0')
        .set(SCM_TOKENS_HEADER, GITHUB_TOKENS);

      expect(res.status).toBe(400);
    });

    it('denies user without the read permission', async () => {
      permissions.authorize.mockResolvedValue([
        { result: AuthorizeResult.DENY },
      ]);

      const res = await request(app)
        .get('/pull-requests')
        .set(SCM_TOKENS_HEADER, GITHUB_TOKENS);

      expect(res.status).toBe(403);
    });

    it('rejects a malformed token header', async () => {
      const res = await request(app)
        .get('/pull-requests')
        .set(SCM_TOKENS_HEADER, 'nonsense');

      expect(res.status).toBe(400);
    });

    it('rejects an oversized token header', async () => {
      const res = await request(app)
        .get('/pull-requests')
        .set(SCM_TOKENS_HEADER, 'x'.repeat(SCM_TOKENS_MAX_BYTES + 1));

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain(
        `must not exceed ${SCM_TOKENS_MAX_BYTES} bytes`,
      );
      expect(provider.listPullRequests).not.toHaveBeenCalled();
    });
  });

  describe('GET /sources', () => {
    it('lists available sources', async () => {
      const res = await request(app).get('/sources');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        sources: [
          {
            id: 'github:github.com',
            type: 'github',
            host: 'github.com',
            title: 'github.com',
            baseUrl: 'https://github.com',
          },
        ],
      });
    });

    it('returns no sources without a provider', async () => {
      const registry = new PullRequestProvidersRegistry();
      const sourceResolver = SourceResolver.fromConfig(config, {
        providersRegistry: registry,
      });
      const logger = mockServices.logger.mock();
      const router = await createRouter({
        pullRequestService: new PullRequestService({
          sourceResolver,
          providersRegistry: registry,
          logger,
          maxPullRequests: 100,
        }),
        sourceResolver,
        httpAuth: mockServices.httpAuth(),
        permissions,
      });
      app = express();
      app.use(router);
      app.use(mockErrorHandler());

      const res = await request(app).get('/sources');

      expect(res.body).toEqual({ sources: [] });
    });
  });
});
