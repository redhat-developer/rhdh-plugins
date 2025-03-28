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
import { createApiRef } from '@backstage/core-plugin-api';
import { RegistrationService } from './RegistrationBackendClient';
import { KubeAPIService } from './KubeBackendClient';
import { AAPService } from './AAPBackendClient';

export * from './RegistrationBackendClient';
export * from './KubeBackendClient';
export * from './AAPBackendClient';

export const registerApiRef = createApiRef<RegistrationService>({
  id: 'plugin.sandbox.registration.api-ref',
});

export const kubeApiRef = createApiRef<KubeAPIService>({
  id: 'plugin.sandbox.kube.api-ref',
});

export const aapApiRef = createApiRef<AAPService>({
  id: 'plugin.sandbox.aap.api-ref',
});
