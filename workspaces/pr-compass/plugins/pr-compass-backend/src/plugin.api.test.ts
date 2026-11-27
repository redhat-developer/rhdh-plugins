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

import { createBackendModule } from '@backstage/backend-plugin-api';
import {
  mockCredentials,
  mockServices,
  startTestBackend,
} from '@backstage/backend-test-utils';
import { SourceErrorCodes } from '@red-hat-developer-hub/backstage-plugin-pr-compass-common';
import { prCompassProvidersExtensionPoint } from '@red-hat-developer-hub/backstage-plugin-pr-compass-node';
import type { Server } from 'http';
import request from 'supertest';
import { mockGithubPullRequestProvider } from '../__fixtures__/mockPullRequestProvider';
import { prCompassPlugin } from './plugin';
import { SCM_TOKENS_HEADER } from './validation';

const testPrProviderModule = createBackendModule({
  pluginId: 'pr-compass',
  moduleId: 'test-pr-provider',
  register(reg) {
    reg.registerInit({
      deps: { providers: prCompassProvidersExtensionPoint },
      async init({ providers }) {
        providers.addPullRequestProvider(mockGithubPullRequestProvider);
      },
    });
  },
});

describe('prCompassPlugin (startTestBackend)', () => {
  let server: Server;

  beforeAll(async () => {
    ({ server } = await startTestBackend({
      features: [
        prCompassPlugin,
        testPrProviderModule,
        mockServices.rootConfig.factory({
          data: {
            integrations: {
              github: [{ host: 'github.com', token: 'ghu_x' }],
              gitlab: [{ host: 'gitlab.com', token: 'ghu_x' }],
            },
            prCompass: { maxPullRequests: 7 },
          },
        }),
      ],
    }));
  });

  beforeEach(() => {
    mockGithubPullRequestProvider.listPullRequests.mockClear();
  });

  afterAll(() => {
    server?.close();
  });

  describe('GET /api/pr-compass/health', () => {
    it('returns the health status without authentication', async () => {
      const res = await request(server).get('/api/pr-compass/health');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /api/pr-compass/pull-requests', () => {
    it('serves a PR ranked page through a registered provider', async () => {
      const res = await request(server)
        .get('/api/pr-compass/pull-requests')
        .set('authorization', mockCredentials.user.header())
        .set(
          SCM_TOKENS_HEADER,
          JSON.stringify({ 'github:github.com': 'ghu_x' }),
        );

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(4);
      expect(res.body.items[0].id).toBe('github.com/acme/platform#841');
    });

    it('applies the configured `prCompass.maxPullRequests` cap', async () => {
      await request(server)
        .get('/api/pr-compass/pull-requests')
        .set('authorization', mockCredentials.user.header())
        .set(
          SCM_TOKENS_HEADER,
          JSON.stringify({ 'github:github.com': 'ghu_x' }),
        );

      expect(
        mockGithubPullRequestProvider.listPullRequests.mock.calls[0][0],
      ).toMatchObject({
        limit: 7,
        token: 'ghu_x',
      });
    });

    it('returns `SCM_SESSION_REQUIRED` when no token is sent', async () => {
      const res = await request(server)
        .get('/api/pr-compass/pull-requests')
        .set('authorization', mockCredentials.user.header());

      expect(res.status).toBe(200);
      expect(res.body.items).toEqual([]);
      expect(res.body.sources).toEqual([
        {
          sourceId: 'github:github.com',
          error: SourceErrorCodes.SCM_SESSION_REQUIRED,
        },
      ]);
      expect(
        mockGithubPullRequestProvider.listPullRequests,
      ).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/pr-compass/sources', () => {
    it('lists only sources that have both an integration and a PR provider', async () => {
      const res = await request(server)
        .get('/api/pr-compass/sources')
        .set('authorization', mockCredentials.user.header());

      // gitlab.com has an integration but no provider is registered, so it is absent.
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
  });
});
