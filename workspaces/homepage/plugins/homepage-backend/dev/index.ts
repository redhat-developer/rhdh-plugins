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
import { createBackend } from '@backstage/backend-defaults';
import { mockServices } from '@backstage/backend-test-utils';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';

// Start up the backend by running `yarn start` in the package directory.
// Once it's up and running, try out the following requests:
//
//   curl http://localhost:7007/api/homepage/default-widgets
//
// Explicitly make an unauthenticated request (returns 401):
//
//   curl -i http://localhost:7007/api/homepage/default-widgets \
//     -H 'Authorization: Bearer mock-none-token'

const backend = createBackend();

// Mocked auth lets curl hit the endpoint without real tokens.
backend.add(mockServices.auth.factory());
backend.add(mockServices.httpAuth.factory());

// Provide the default cards config with the customizable flag and rich metadata.
backend.add(
  mockServices.rootConfig.factory({
    data: {
      homepage: {
        defaultWidgets: [
          {
            id: 'onboarding',
            title: 'Get Started',
            description: 'Helpful links to get you started',
            priority: 200,
            layouts: {
              xl: { w: 12, h: 6 },
              lg: { w: 12, h: 6 },
            },
          },
          {
            id: 'entities',
            title: 'Your Entities',
            priority: 100,
            if: {
              groups: ['group:default/developers', 'group:default/platform'],
            },
            layouts: {
              xl: { w: 12, h: 7 },
              lg: { w: 12, h: 7 },
            },
          },
          {
            label: 'Admin tools',
            if: { permissions: ['homepage.admin.read'] },
            children: [
              {
                id: 'user-management',
                title: 'User Management',
                priority: 300,
              },
              {
                id: 'audit-log',
                if: { users: ['user:default/alice'] },
              },
            ],
          },
          {
            id: 'mock-user-welcome',
            label: 'Welcome',
            if: { users: ['user:default/mock'] },
          },
        ],
      },
    },
  }),
);

// The mocked user `user:default/mock` is a member of `group:default/developers`.
backend.add(
  catalogServiceMock.factory({
    entities: [
      {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'User',
        metadata: { name: 'mock', namespace: 'default' },
        spec: { profile: {}, memberOf: ['developers'] },
        relations: [
          { type: 'memberOf', targetRef: 'group:default/developers' },
        ],
      },
    ],
  }),
);

backend.add(import('../src'));

backend.start();
