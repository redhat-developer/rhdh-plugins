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
 * WITHOUT WARRANTIES OR CONDITIONS OF THE License, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import assert from 'assert';
import type { RouterOptions } from '../models/RouterOptions';
import { DEFAULT_SSO_BASE_URL } from './constant';

const TOKEN_CACHE_KEY = 'dcm_sso_access_token';

export const getTokenFromApi = async (
  options: RouterOptions,
): Promise<string> => {
  const { logger, config, cache } = options;

  const now = Date.now();

  const cachedToken = (await cache.get(TOKEN_CACHE_KEY)) as
    | { token: string; expiresAt: number }
    | undefined;

  if (cachedToken) {
    const timeUntilExpirySeconds = Math.floor(
      (cachedToken.expiresAt - now) / 1000,
    );
    logger.info(
      `Cache check: Token expires in ${timeUntilExpirySeconds}s, needs >60s to be valid`,
    );
  } else {
    logger.info('Cache check: No cached token exists');
  }

  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    logger.info('Using cached access token');
    return cachedToken.token;
  }

  assert(typeof config !== 'undefined', 'Config is undefined');

  logger.info('Requesting new access token');

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
    throw new Error(response.statusText);
  }

  const json = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };
  const accessToken = json.access_token;
  const expiresAt = Date.now() + json.expires_in * 1000;

  await cache.set(
    TOKEN_CACHE_KEY,
    { token: accessToken, expiresAt },
    { ttl: json.expires_in * 1000 },
  );

  logger.info(`Token cached, expires in ${json.expires_in} seconds`);
  return accessToken;
};
