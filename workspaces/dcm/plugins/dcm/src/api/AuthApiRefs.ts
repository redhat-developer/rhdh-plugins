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
  createApiFactory,
  createApiRef,
  type ApiFactory,
  type ApiRef,
  type OAuthApi,
  type OpenIdConnectApi,
} from '@backstage/core-plugin-api';

/** RHDH's OIDC API, provided by the host application. */
export const oidcAuthApiRef: ApiRef<OAuthApi & OpenIdConnectApi> = createApiRef<
  OAuthApi & OpenIdConnectApi
>({
  id: 'internal.auth.oidc',
});

/**
 * Fallback OIDC API for standalone and development apps with DCM auth disabled.
 *
 * @public
 */
export const dcmAuthDisabledOidcApiFactory: ApiFactory<
  OAuthApi & OpenIdConnectApi,
  OAuthApi & OpenIdConnectApi,
  {}
> = createApiFactory({
  api: oidcAuthApiRef,
  deps: {},
  factory: () =>
    ({
      getAccessToken: () =>
        Promise.reject(
          new Error(
            'DCM authentication is enabled, but the host does not provide internal.auth.oidc.',
          ),
        ),
    } as OAuthApi & OpenIdConnectApi),
});
