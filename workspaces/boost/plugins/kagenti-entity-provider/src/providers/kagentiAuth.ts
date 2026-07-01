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

/**
 * Keycloak client-credentials auth configuration for the Kagenti API.
 *
 * @internal
 */
export interface KagentiAuthConfig {
  /** Keycloak token endpoint URL. */
  tokenEndpoint: string;
  /** OAuth2 client ID. */
  clientId: string;
  /** OAuth2 client secret. */
  clientSecret: string;
}

// Entity providers are independently deployable as RHDH dynamic plugins,
// so they cannot depend on boost-backend-module-kagenti's KeycloakTokenCache.
// This self-contained auth client avoids coupling entity providers to the
// full boost backend module dependency tree.

/**
 * Keycloak client-credentials auth client with instance-level token caching.
 *
 * @internal
 */
export class KagentiAuthClient {
  private cachedToken: string | undefined;
  private tokenExpiry = 0;
  private pendingRefresh: Promise<string> | undefined;

  constructor(private readonly auth: KagentiAuthConfig) {}

  async getBearerToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.tokenExpiry) {
      return this.cachedToken;
    }

    if (this.pendingRefresh) {
      return this.pendingRefresh;
    }

    this.pendingRefresh = this.refreshToken();
    try {
      return await this.pendingRefresh;
    } finally {
      this.pendingRefresh = undefined;
    }
  }

  private async refreshToken(): Promise<string> {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.auth.clientId,
      client_secret: this.auth.clientSecret,
    });

    const response = await fetch(this.auth.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(
        `Keycloak token request failed: ${response.status} ${response.statusText}`,
      );
    }

    const json = (await response.json()) as Record<string, unknown>;
    const token = json.access_token;
    if (typeof token !== 'string' || token.length === 0) {
      throw new Error('Keycloak token response missing or empty access_token');
    }

    this.cachedToken = token;
    const expiresIn =
      typeof json.expires_in === 'number' ? json.expires_in : 300;
    // Refresh 30s before expiry
    this.tokenExpiry = Date.now() + (expiresIn - 30) * 1000;
    return this.cachedToken;
  }
}
