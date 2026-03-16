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
import type { LoggerService } from '@backstage/backend-plugin-api';
import { ResponsesApiClient } from './ResponsesApiClient';
import type { LlamaStackConfig } from '../../types';

/**
 * The subset of LlamaStackConfig that determines HTTP client identity.
 * A change in any of these fields requires a new ResponsesApiClient.
 */
interface ClientIdentity {
  baseUrl: string;
  token?: string;
  skipTlsVerify?: boolean;
}

/**
 * Manages the lifecycle of ResponsesApiClient instances.
 *
 * The client is re-created lazily when the connection-relevant config
 * fields (baseUrl, token, skipTlsVerify) change. Other config fields
 * (model, vectorStoreIds, etc.) do NOT require a new client because
 * they are passed per-request in the API body.
 *
 * Thread-safety: JavaScript is single-threaded, so no locking is needed.
 * The manager simply compares the current identity with the last-used
 * identity and creates a new client if they differ.
 */
export class ClientManager {
  private readonly logger: LoggerService;
  private client: ResponsesApiClient | null = null;
  private currentIdentity: ClientIdentity | null = null;

  /** Server version string (e.g. "0.5.2"), fetched lazily on first client creation. */
  private _serverVersion: string | undefined;

  constructor(logger: LoggerService) {
    this.logger = logger;
  }

  /** Server version detected at connect time. `undefined` if not yet probed. */
  get serverVersion(): string | undefined {
    return this._serverVersion;
  }

  /**
   * Get a ResponsesApiClient for the given config.
   *
   * Returns the cached client if the connection-relevant fields
   * haven't changed; otherwise creates a fresh one.
   */
  getClient(config: LlamaStackConfig): ResponsesApiClient {
    const identity = this.extractIdentity(config);

    if (this.client && this.identityMatches(identity)) {
      return this.client;
    }

    if (this.client) {
      this.logger.info(
        `ResponsesApiClient identity changed (baseUrl: ${identity.baseUrl}), creating new client`,
      );
    }

    this.client = new ResponsesApiClient(config, this.logger);
    this.currentIdentity = identity;
    return this.client;
  }

  /**
   * Returns the cached client without checking identity.
   * Throws if no client has been created yet.
   *
   * Useful for services that need the client synchronously
   * (e.g. ConversationClientAccessor.getClient).
   */
  getExistingClient(): ResponsesApiClient {
    if (!this.client) {
      throw new Error(
        'ClientManager has no client. Call getClient(config) first.',
      );
    }
    return this.client;
  }

  /**
   * Test whether a client has been created.
   */
  hasClient(): boolean {
    return this.client !== null;
  }

  /**
   * Force-drop the cached client. The next getClient() call will
   * create a fresh instance regardless of identity.
   */
  invalidate(): void {
    this.client = null;
    this.currentIdentity = null;
  }

  /**
   * Probe the server version via `/v1/version`.
   * Non-blocking: failures are logged and swallowed.
   */
  async probeServerVersion(client: ResponsesApiClient): Promise<void> {
    try {
      const resp = await client.request<{ version?: string }>('/v1/version', {
        method: 'GET',
      });
      if (resp?.version) {
        this._serverVersion = resp.version;
        this.logger.info(`Inference server version: ${resp.version}`);
      }
    } catch {
      this.logger.debug('Could not probe server version (non-fatal)');
    }
  }

  private extractIdentity(config: LlamaStackConfig): ClientIdentity {
    return {
      baseUrl: config.baseUrl,
      token: config.token,
      skipTlsVerify: config.skipTlsVerify,
    };
  }

  private identityMatches(identity: ClientIdentity): boolean {
    if (!this.currentIdentity) return false;
    return (
      this.currentIdentity.baseUrl === identity.baseUrl &&
      this.currentIdentity.token === identity.token &&
      this.currentIdentity.skipTlsVerify === identity.skipTlsVerify
    );
  }
}
