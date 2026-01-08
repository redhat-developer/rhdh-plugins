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

import assert from 'assert';
import { RouterOptions } from '../models/RouterOptions';
import { DEFAULT_SSO_BASE_URL } from './constant';

export const getTokenFromApi = async (options: RouterOptions) => {
  const { logger, config } = options;
  let accessToken = '';

  assert(typeof config !== 'undefined', 'Config is undefined');

  logger.info('Requesting new access token');

  const ssoBaseUrl =
    config.getOptionalString('resourceOptimization.ssoBaseUrl') ??
    DEFAULT_SSO_BASE_URL;
  const params = {
    tokenUrl: `${ssoBaseUrl}/auth/realms/redhat-external/protocol/openid-connect/token`,
    clientId: config.getString('resourceOptimization.clientId'),
    clientSecret: config.getString('resourceOptimization.clientSecret'),
    scope: 'api.console',
    grantType: 'client_credentials',
  } as const;

  const rhSsoResponse = await fetch(params.tokenUrl, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(
      Object.entries({
        client_id: params.clientId,
        client_secret: params.clientSecret,
        scope: params.scope,
        grant_type: params.grantType,
      }).map(([k, v]) => [encodeURIComponent(k), encodeURIComponent(v)]),
    ),
    method: 'POST',
  });

  if (rhSsoResponse.ok) {
    const { access_token } = await rhSsoResponse.json();
    accessToken = access_token;
  } else {
    throw new Error(rhSsoResponse.statusText);
  }

  return accessToken;
};
