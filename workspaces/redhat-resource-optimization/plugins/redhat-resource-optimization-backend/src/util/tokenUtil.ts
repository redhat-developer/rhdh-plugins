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

// Cache key for token storage
const TOKEN_CACHE_KEY = 'sso_access_token';

/**
 * Requests an access token from Red Hat SSO using costManagement config.
 * Shared by the token route and getTokenFromApi (cached).
 */
export const requestTokenFromSso = async (
  options: RouterOptions,
): Promise<{ accessToken: string; expiresAt: number }> => {
  const { logger, config } = options;

  assert(typeof config !== 'undefined', 'Config is undefined');

  logger.info('Requesting new access token');

  const ssoBaseUrl =
    config.getOptionalString('costManagement.ssoBaseUrl') ??
    DEFAULT_SSO_BASE_URL;
  const params = {
    tokenUrl: `${ssoBaseUrl}/auth/realms/redhat-external/protocol/openid-connect/token`,
    clientId: config.getString('costManagement.clientId'),
    clientSecret: config.getString('costManagement.clientSecret'),
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

  if (!rhSsoResponse.ok) {
    throw new Error(rhSsoResponse.statusText);
  }

  const { access_token, expires_in } = await rhSsoResponse.json();
  return {
    accessToken: access_token,
    expiresAt: Date.now() + expires_in * 1000,
  };
};

export const getTokenFromApi = async (options: RouterOptions) => {
  const { logger, cache } = options;

  const now = Date.now();

  // Try to get cached token from cache service
  const cachedToken = (await cache.get(TOKEN_CACHE_KEY)) as
    | { token: string; expiresAt: number }
    | undefined;

  // Debug logging
  if (cachedToken) {
    const timeUntilExpiry = cachedToken.expiresAt - now;
    const timeUntilExpirySeconds = Math.floor(timeUntilExpiry / 1000);
    logger.info(
      `Cache check: Token expires in ${timeUntilExpirySeconds}s, needs >60s to be valid`,
    );
  } else {
    logger.info('Cache check: No cached token exists');
  }

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    logger.info('Using cached access token');
    return cachedToken.token;
  }

  const { accessToken: token, expiresAt } = await requestTokenFromSso(options);

  // Cache token with expiry using cache service
  await cache.set(
    TOKEN_CACHE_KEY,
    {
      token,
      expiresAt,
    },
    {
      ttl: expiresAt - Date.now(), // TTL in milliseconds
    },
  );

  logger.info(`Token cached, expires at ${new Date(expiresAt).toISOString()}`);
  return token;
};
