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

import { KubeService } from './KubeService';

describe('KubeService', () => {
  let kubeService: KubeService;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // mock referenced services for the KubeService for tests
    kubeService = await KubeService.create({
      // use logger: mockServices.logger.mock() to silence the logger
      logger: console as any,
    });
  });

  // This is a real test, connecting to a real Kubernetes cluster.
  // Make sure you have ~/.kube/config set up and a cluster available before running this test
  it.skip('can connect to Kubernetes cluster', async () => {
    await expect(kubeService.getPods()).resolves.not.toThrow();
  });
});
