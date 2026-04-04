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

import * as https from 'https';
import * as http from 'http';
import type { LoggerService } from '@backstage/backend-plugin-api';
import type { KeycloakTokenResponse } from './types';

const DEFAULT_TOKEN_EXPIRY_BUFFER_SECONDS = 60;
const MIN_TOKEN_LIFETIME_SECONDS = 10;
const TOKEN_REQUEST_TIMEOUT_MS = 15_000;

export interface KeycloakTokenManagerOptions {
  tokenEndpoint: string;
  clientId: string;
  clientSecret: string;
  logger: LoggerService;
  skipTlsVerify?: boolean;
  tokenExpiryBufferSeconds?: number;
}

export class KeycloakTokenManager {
  private readonly tokenEndpoint: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly logger: LoggerService;
  private readonly skipTlsVerify: boolean;
  private readonly tokenExpiryBufferSeconds: number;

  private cachedToken: string | undefined;
  private expiresAt = 0;
  private pendingRequest: Promise<string> | undefined;
  private generation = 0;

  constructor(options: KeycloakTokenManagerOptions) {
    this.tokenEndpoint = options.tokenEndpoint;
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.logger = options.logger;
    this.skipTlsVerify = options.skipTlsVerify ?? false;
    this.tokenExpiryBufferSeconds =
      options.tokenExpiryBufferSeconds ?? DEFAULT_TOKEN_EXPIRY_BUFFER_SECONDS;
  }

  async getToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.expiresAt) {
      return this.cachedToken;
    }

    if (this.pendingRequest) {
      return this.pendingRequest;
    }

    this.pendingRequest = this.acquireToken().finally(() => {
      this.pendingRequest = undefined;
    });

    return this.pendingRequest;
  }

  clearCache(): void {
    this.generation++;
    this.cachedToken = undefined;
    this.expiresAt = 0;
    this.pendingRequest = undefined;
  }

  private async acquireToken(): Promise<string> {
    const startGen = this.generation;
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    }).toString();

    const url = new URL(this.tokenEndpoint);
    const isHttps = url.protocol === 'https:';
    const transport = isHttps ? https : http;

    const requestOptions: https.RequestOptions = {
      method: 'POST',
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: TOKEN_REQUEST_TIMEOUT_MS,
      ...(isHttps && this.skipTlsVerify ? { rejectUnauthorized: false } : {}),
    };

    return new Promise<string>((resolve, reject) => {
      const req = transport.request(requestOptions, res => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf-8');
          if (!res.statusCode || res.statusCode >= 400) {
            this.logger.error(
              `Keycloak token request failed: status ${res.statusCode}`,
            );
            reject(
              new Error(
                `Keycloak token request failed with status ${res.statusCode}`,
              ),
            );
            return;
          }

          try {
            const parsed: KeycloakTokenResponse = JSON.parse(raw);

            if (this.generation !== startGen) {
              resolve(parsed.access_token);
              return;
            }

            this.cachedToken = parsed.access_token;

            const effectiveLifetime = Math.max(
              parsed.expires_in - this.tokenExpiryBufferSeconds,
              MIN_TOKEN_LIFETIME_SECONDS,
            );
            this.expiresAt = Date.now() + effectiveLifetime * 1000;

            if (parsed.expires_in <= this.tokenExpiryBufferSeconds) {
              this.logger.warn(
                `Keycloak token expires_in (${parsed.expires_in}s) is <= buffer (${this.tokenExpiryBufferSeconds}s); using minimum lifetime of ${MIN_TOKEN_LIFETIME_SECONDS}s`,
              );
            } else {
              this.logger.debug(
                `Acquired Keycloak token, expires in ${parsed.expires_in}s`,
              );
            }
            resolve(parsed.access_token);
          } catch {
            reject(new Error('Failed to parse Keycloak token response'));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        this.logger.error(
          `Keycloak token request timed out after ${TOKEN_REQUEST_TIMEOUT_MS}ms`,
        );
        reject(
          new Error(
            `Keycloak token request timed out after ${TOKEN_REQUEST_TIMEOUT_MS}ms`,
          ),
        );
      });

      req.on('error', err => {
        this.logger.error(`Keycloak token request error: ${err.message}`);
        reject(err);
      });

      req.write(body);
      req.end();
    });
  }
}
