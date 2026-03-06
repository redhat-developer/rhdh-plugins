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

import type { RequestHandler } from 'express';
import type { GetTokenResponse } from '../models/GetTokenResponse';
import type { RouterOptions } from '../models/RouterOptions';
import { DEFAULT_SSO_BASE_URL } from '../util/constant';
import assert from 'assert';

export const getToken =
  (options: RouterOptions): RequestHandler =>
  async (_, response) => {
    const { logger, config } = options;

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

    const rhSsoResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (rhSsoResponse.ok) {
      const json = (await rhSsoResponse.json()) as {
        access_token: string;
        expires_in: number;
      };
      const bodyRes: GetTokenResponse = {
        accessToken: json.access_token,
        expiresAt: Date.now() + json.expires_in * 1000,
      };
      response.json(bodyRes);
    } else {
      throw new Error(rhSsoResponse.statusText);
    }
  };
