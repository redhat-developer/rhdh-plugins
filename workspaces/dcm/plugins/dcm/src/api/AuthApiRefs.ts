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
import type { DcmOidcTokenProvider } from '@red-hat-developer-hub/backstage-plugin-dcm-common';

/** Provides the optional access-token provider used by DCM API clients. @public */
export type DcmAuthApi = {
  getAccessToken?: DcmOidcTokenProvider;
};

/** DCM's auth API, provided by the host application. @public */
export const dcmAuthApiRef: ApiRef<DcmAuthApi> = createApiRef<DcmAuthApi>({
  id: 'plugin.dcm.auth',
});

const oidcAuthApiRef: ApiRef<OAuthApi & OpenIdConnectApi> = createApiRef<
  OAuthApi & OpenIdConnectApi
>({
  id: 'internal.auth.oidc',
});

/**
 * DCM auth API factory for standalone and development apps with DCM auth disabled.
 *
 * @public
 */
export const dcmAuthDisabledApiFactory: ApiFactory<DcmAuthApi, DcmAuthApi, {}> =
  createApiFactory({
    api: dcmAuthApiRef,
    deps: {},
    factory: () => ({}),
  });

/**
 * DCM auth API factory that adapts the host application's OIDC API.
 *
 * @public
 */
export const dcmOidcAuthApiFactory: ApiFactory<
  DcmAuthApi,
  DcmAuthApi,
  { oidcAuthApi: OAuthApi & OpenIdConnectApi }
> = createApiFactory({
  api: dcmAuthApiRef,
  deps: { oidcAuthApi: oidcAuthApiRef },
  factory: ({ oidcAuthApi }) => ({
    getAccessToken: oidcAuthApi.getAccessToken.bind(oidcAuthApi),
  }),
});
