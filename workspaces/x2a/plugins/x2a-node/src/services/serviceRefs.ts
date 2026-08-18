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

import { createServiceRef } from '@backstage/backend-plugin-api';

import type { X2ADatabaseServiceApi } from './X2ADatabaseService';
import type { KubeServiceApi } from './kubeServiceApi';

// Service ref IDs -- keep in sync with x2a-backend's refs.
// See serviceRefSync.test.ts in x2a-backend for the guard test.

/** @public */
export const X2A_DATABASE_SERVICE_ID = 'x2a-database';

/** @public */
export const KUBE_SERVICE_ID = 'x2a-kubernetes';

/*
 * Canonical service refs - the ONLY refs all x2a plugins should use.
 *
 * These refs have no defaultFactory. The backend app must register the
 * matching factories (exported by x2a-backend) via backend.add(...).
 */

/**
 * Service ref for the X2A database service (root-scoped).
 *
 * The factory is exported by `x2a-backend` as `x2aDatabaseServiceFactory`
 * and must be registered in the backend app.
 *
 * @public
 */
export const x2aDatabaseServiceRef = createServiceRef<X2ADatabaseServiceApi>({
  id: X2A_DATABASE_SERVICE_ID,
  scope: 'root',
});

/**
 * Service ref for the X2A Kubernetes service.
 *
 * The factory is exported by `x2a-backend` as `kubeServiceFactory`
 * and must be registered in the backend app.
 *
 * @public
 */
export const kubeServiceRef = createServiceRef<KubeServiceApi>({
  id: KUBE_SERVICE_ID,
});
