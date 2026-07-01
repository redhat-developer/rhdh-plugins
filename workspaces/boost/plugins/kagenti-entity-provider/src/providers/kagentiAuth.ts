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

import { Buffer } from 'node:buffer';

/**
 * Configuration for Keycloak service-account authentication.
 *
 * @internal
 */
export interface KeycloakAuthConfig {
  /** Keycloak token endpoint URL. */
  tokenEndpoint: string;
  /** OAuth2 client ID. */
  clientId: string;
  /** OAuth2 client secret. */
  clientSecret: string;
}

/**
 * Client for acquiring OAuth2 tokens via Keycloak Client Credentials Grant.
 *
 * Caches tokens and proactively refreshes them before expiry using a
 * configurable buffer (default: 60 seconds).
 *
 * Uses `node:buffer` for base64 encoding (not `btoa` which may not
 * be available in older Node.js versions).
 *
 * @internal
 */
export class KeycloakAuthClient {
  private readonly config: KeycloakAuthConfig;
  private readonly expiryBufferSeconds: number;
  private cachedToken: string | undefined;
  private tokenExpiresAt: number = 0;

  constructor(config: KeycloakAuthConfig, expiryBufferSeconds?: number) {
    this.config = config;
    this.expiryBufferSeconds = expiryBufferSeconds ?? 60;
  }

  /**
   * Get a valid bearer token, fetching a fresh one if the cached
   * token is expired or about to expire.
   */
  async getBearerToken(): Promise<string> {
    const now = Date.now() / 1000;
    if (this.cachedToken && now < this.tokenExpiresAt) {
      return this.cachedToken;
    }

    const credentials = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`,
    ).toString('base64');

    const response = await fetch(this.config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(
        `Keycloak token request failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
    };

    if (!data.access_token) {
      throw new Error('Keycloak token response missing access_token');
    }

    this.cachedToken = data.access_token;
    const expiresIn = data.expires_in ?? 300;
    this.tokenExpiresAt =
      now + Math.max(0, expiresIn - this.expiryBufferSeconds);

    return this.cachedToken;
  }
}
