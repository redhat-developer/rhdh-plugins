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
  coreServices,
  createServiceFactory,
  createServiceRef,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { Expand } from '@backstage/types';
import type { CoreV1Api, V1Pod, V1PodList } from '@kubernetes/client-node';
import { makeK8sClient } from './makeK8sClient';

export class KubeService {
  readonly #logger: LoggerService;
  readonly #k8sApi: CoreV1Api;

  static async create(options: { logger: LoggerService }) {
    const service = new KubeService(options.logger);
    await service.initialize();
    return service;
  }

  private constructor(logger: LoggerService) {
    this.#logger = logger;
    this.#k8sApi = null as any; // Initialized in initialize()
  }

  private async initialize() {
    (this.#k8sApi as any) = await makeK8sClient(this.#logger);
  }

  // To test it
  async getPods(): Promise<{ items: V1Pod[] }> {
    this.#logger.info('getPods called');

    const res: V1PodList = await this.#k8sApi.listNamespacedPod({
      namespace: 'default',
    });

    return { items: res.items };
  }
}

export const kubeServiceRef = createServiceRef<Expand<KubeService>>({
  id: 'x2a-kubernetes',
  defaultFactory: async service =>
    createServiceFactory({
      service,
      deps: {
        logger: coreServices.logger,
      },
      async factory(deps) {
        return KubeService.create({
          ...deps,
        });
      },
    }),
});
