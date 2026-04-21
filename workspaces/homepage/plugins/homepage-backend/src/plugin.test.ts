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
import {
  mockCredentials,
  mockServices,
  startTestBackend,
} from '@backstage/backend-test-utils';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import request from 'supertest';
import { homepagePlugin } from './plugin';

const userRef = mockCredentials.user().principal.userEntityRef;

const userEntityWithGroups = (groups: string[]) => ({
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: {
    name: userRef.split('/')[1],
    namespace: 'default',
  },
  spec: {
    profile: {},
    memberOf: groups.map(g => g.replace(/^group:default\//, '')),
  },
  relations: groups.map(targetRef => ({
    type: 'memberOf',
    targetRef,
  })),
});

describe('homepagePlugin', () => {
  it('returns the visible default cards for the current user', async () => {
    const { server } = await startTestBackend({
      features: [
        homepagePlugin,
        mockServices.rootConfig.factory({
          data: {
            homepage: {
              defaultCards: [
                { id: 'onboarding', title: 'Get Started', priority: 200 },
                {
                  id: 'dev-only',
                  visibility: { groups: ['group:default/developers'] },
                },
                {
                  id: 'admin-only',
                  visibility: { groups: ['group:default/admins'] },
                },
                {
                  label: 'Platform section',
                  visibility: {
                    permissions: ['homepage.platform.read'],
                  },
                  children: [{ id: 'platform-inner' }],
                },
              ],
            },
          },
        }),
        catalogServiceMock.factory({
          entities: [userEntityWithGroups(['group:default/developers'])],
        }),
        mockServices.permissions.mock({
          authorize: async requests =>
            requests.map(() => ({ result: AuthorizeResult.DENY })),
        }).factory,
      ],
    });

    const res = await request(server).get('/api/homepage/default-cards');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      customizable: false,
      items: [
        { id: 'onboarding', title: 'Get Started', priority: 200 },
        { id: 'dev-only' },
      ],
    });
  });

  it('includes cards gated by an allowed permission', async () => {
    const { server } = await startTestBackend({
      features: [
        homepagePlugin,
        mockServices.rootConfig.factory({
          data: {
            homepage: {
              defaultCards: [
                { id: 'public' },
                {
                  label: 'Platform section',
                  visibility: {
                    permissions: ['homepage.platform.read'],
                  },
                  children: [
                    {
                      id: 'platform-inner',
                      layouts: { xl: { w: 12, h: 5 } },
                    },
                  ],
                },
              ],
            },
          },
        }),
        catalogServiceMock.factory({ entities: [userEntityWithGroups([])] }),
        mockServices.permissions.mock({
          authorize: async requests =>
            requests.map(() => ({ result: AuthorizeResult.ALLOW })),
        }).factory,
      ],
    });

    const res = await request(server).get('/api/homepage/default-cards');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      customizable: false,
      items: [
        { id: 'public' },
        { id: 'platform-inner', layouts: { xl: { w: 12, h: 5 } } },
      ],
    });
  });

  it('returns customizable flag from config', async () => {
    const { server } = await startTestBackend({
      features: [
        homepagePlugin,
        mockServices.rootConfig.factory({
          data: {
            homepage: {
              customizable: true,
              defaultCards: [{ id: 'a' }],
            },
          },
        }),
      ],
    });

    const res = await request(server).get('/api/homepage/default-cards');

    expect(res.status).toBe(200);
    expect(res.body.customizable).toBe(true);
  });

  it('returns an empty list when no default cards are configured', async () => {
    const { server } = await startTestBackend({
      features: [homepagePlugin],
    });

    const res = await request(server).get('/api/homepage/default-cards');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ customizable: false, items: [] });
  });

  it('rejects unauthenticated requests', async () => {
    const { server } = await startTestBackend({
      features: [homepagePlugin],
    });

    const res = await request(server)
      .get('/api/homepage/default-cards')
      .set('Authorization', mockCredentials.none.header());

    expect(res.status).toBe(401);
  });
});
