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
  ApiRef,
  BackstageIdentityApi,
  createApiRef,
  OAuthApi,
  OpenIdConnectApi,
  ProfileInfoApi,
  SessionApi,
} from '@backstage/core-plugin-api';
import { RegistrationService } from './RegistrationBackendClient';
import { KubeAPIService } from './KubeBackendClient';
import { AAPService } from './AnsibleBackendClient';
import { SecureFetchApi } from './SecureFetchClient';

export * from './SecureFetchClient';
export * from './RegistrationBackendClient';
export * from './KubeBackendClient';
export * from './AnsibleBackendClient';

export const keycloakApiRef: ApiRef<
  OpenIdConnectApi &
    ProfileInfoApi &
    BackstageIdentityApi &
    SessionApi &
    OAuthApi
> = createApiRef({
  id: 'plugin.sandbox.keycloak.api-ref',
});

export const secureFetchApiRef = createApiRef<SecureFetchApi>({
  id: 'plugin.sandbox.secure-fetch.api-ref',
});

export const registerApiRef = createApiRef<RegistrationService>({
  id: 'plugin.sandbox.registration.api-ref',
});

export const kubeApiRef = createApiRef<KubeAPIService>({
  id: 'plugin.sandbox.kube.api-ref',
});

export const aapApiRef = createApiRef<AAPService>({
  id: 'plugin.sandbox.aap.api-ref',
});
