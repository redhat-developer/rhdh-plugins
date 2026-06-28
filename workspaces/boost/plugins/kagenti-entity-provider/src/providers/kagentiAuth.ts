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

import type { KagentiAuthConfig } from '../types';

let cachedToken: string | undefined;
let tokenExpiry = 0;

export async function getKagentiBearerToken(
  auth: KagentiAuthConfig,
): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: auth.clientId,
    client_secret: auth.clientSecret,
  });

  const response = await fetch(auth.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(
      `Keycloak token request failed: ${response.status} ${response.statusText}`,
    );
  }

  const json = (await response.json()) as {
    access_token: string;
    expires_in?: number;
  };
  cachedToken = json.access_token;
  // Refresh 30s before expiry
  tokenExpiry = Date.now() + ((json.expires_in ?? 300) - 30) * 1000;
  return cachedToken;
}
