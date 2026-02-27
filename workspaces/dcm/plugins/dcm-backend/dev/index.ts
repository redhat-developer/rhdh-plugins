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

// TEMPLATE NOTE:
// This is the development setup for your plugin that wires up a
// minimal backend that can use both real and mocked plugins and services.
//
// Start up the backend by running `yarn start` in the package directory.
// Once it's up and running, try out the following requests:
//
// Create a new todo item, standalone or for the sample component:
//
//   curl http://localhost:7007/api/dcm/todos -H 'Content-Type: application/json' -d '{"title": "My Todo"}'
//   curl http://localhost:7007/api/dcm/todos -H 'Content-Type: application/json' -d '{"title": "My Todo", "entityRef": "component:default/sample"}'
//
// List TODOs:
//
//   curl http://localhost:7007/api/dcm/todos
//
// Explicitly make an unauthenticated request, or with service auth:
//
//   curl http://localhost:7007/api/dcm/todos -H 'Authorization: Bearer mock-none-token'
//   curl http://localhost:7007/api/dcm/todos -H 'Authorization: Bearer mock-service-token'

const backend = createBackend();

backend.add(mockServices.auth.factory());
backend.add(mockServices.httpAuth.factory());

backend.add(
  catalogServiceMock.factory({
    entities: [
      {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'DCM-EXAMPLE',
          title: 'DCM Example Component',
        },
        spec: {
          type: 'service',
        },
      },
    ],
  }),
);

backend.add(import('../src'));

backend.start();
