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
  createApiRef,
  type ApiRef,
  type BackstageIdentityApi,
  type OAuthApi,
  type OpenIdConnectApi,
  type ProfileInfoApi,
  type SessionApi,
} from '@backstage/core-plugin-api';

/**
 * Combined surface for custom RHDH auth APIs backed by `OAuth2` in the app module.
 *
 * @alpha
 */
export type CustomAuthApiRefType = OAuthApi &
  OpenIdConnectApi &
  ProfileInfoApi &
  BackstageIdentityApi &
  SessionApi;

/**
 * OIDC auth API for the RHDH multi-provider sign-in page.
 *
 * @alpha
 */
export const oidcAuthApiRef: ApiRef<CustomAuthApiRefType> = createApiRef({
  id: 'internal.auth.oidc',
});

/**
 * Auth0 auth API for the RHDH multi-provider sign-in page.
 *
 * @alpha
 */
export const auth0AuthApiRef: ApiRef<CustomAuthApiRefType> = createApiRef({
  id: 'internal.auth.auth0',
});

/**
 * SAML auth API for the RHDH multi-provider sign-in page.
 *
 * @alpha
 */
export const samlAuthApiRef: ApiRef<CustomAuthApiRefType> = createApiRef({
  id: 'internal.auth.saml',
});

/**
 * Keycloak auth API for the RHDH multi-provider sign-in page.
 *
 * @alpha
 */
export const keycloakAuthApiRef: ApiRef<CustomAuthApiRefType> = createApiRef({
  id: 'internal.auth.keycloak',
});

/**
 * PingFederate auth API for the RHDH multi-provider sign-in page.
 *
 * @alpha
 */
export const pingfederateAuthApiRef: ApiRef<CustomAuthApiRefType> =
  createApiRef({
    id: 'internal.auth.pingfederate',
  });
