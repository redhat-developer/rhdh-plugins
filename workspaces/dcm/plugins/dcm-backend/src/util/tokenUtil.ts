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
 * WITHOUT WARRANTIES OR CONDITIONS OF THE LICENSE, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { RouterOptions } from '../models/RouterOptions';
import { DEFAULT_SSO_BASE_URL } from './constant';

const TOKEN_CACHE_KEY = 'dcm_sso_access_token';

export interface TokenResult {
  accessToken: string;
  expiresAt: number;
}

export const getTokenFromApi = async (
  options: RouterOptions,
): Promise<TokenResult> => {
  const { logger, config, cache } = options;

  const now = Date.now();

  const cachedToken = (await cache.get(TOKEN_CACHE_KEY)) as
    | TokenResult
    | undefined;

  if (cachedToken) {
    const timeUntilExpirySeconds = Math.floor(
      (cachedToken.expiresAt - now) / 1000,
    );
    logger.debug(
      `DCM token cache: expires in ${timeUntilExpirySeconds}s, needs >60s to be valid`,
    );
  } else {
    logger.debug('DCM token cache: no cached token exists');
  }

  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    logger.debug('DCM token cache: reusing cached access token');
    return cachedToken;
  }

  logger.info('DCM token: requesting new access token from SSO');

  const ssoBaseUrl =
    config.getOptionalString('dcm.ssoBaseUrl') ?? DEFAULT_SSO_BASE_URL;
  const clientId = config.getString('dcm.clientId');
  const clientSecret = config.getString('dcm.clientSecret');

  const tokenUrl = `${ssoBaseUrl}/auth/realms/redhat-external/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'api.console',
    grant_type: 'client_credentials',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `SSO token request failed (${response.status} ${response.statusText}): ${errorBody}`,
    );
  }

  const json = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };
  const accessToken = json.access_token;
  const expiresAt = Date.now() + json.expires_in * 1000;

  const tokenResult: TokenResult = { accessToken, expiresAt };

  // Cast to `any` because the Backstage CacheService expects JsonValue but the
  // token object is retrieved back with a type assertion, making this safe.
  await cache.set(TOKEN_CACHE_KEY, tokenResult as any, {
    ttl: json.expires_in * 1000,
  });

  logger.info(`DCM token: cached new token, expires in ${json.expires_in}s`);
  return tokenResult;
};
