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
import { InputError } from '@backstage/errors';
import type {
  DevSpacesCreateWorkspaceRequest,
  DevSpacesCreateWorkspaceResponse,
  DevSpacesHealthResponse,
  DevSpacesWorkspace,
  DevSpacesListWorkspacesResponse,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { AdminConfigService } from './AdminConfigService';

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;
const RETRYABLE_STATUS_CODES = new Set([502, 503, 504]);

export interface DevSpacesServiceOptions {
  logger: LoggerService;
  adminConfig: AdminConfigService;
  getAuthToken?: () => Promise<string>;
}

export class DevSpacesService {
  private readonly logger: LoggerService;
  private readonly adminConfig: AdminConfigService;
  private readonly getAuthToken?: () => Promise<string>;

  constructor(opts: DevSpacesServiceOptions) {
    this.logger = opts.logger;
    this.adminConfig = opts.adminConfig;
    this.getAuthToken = opts.getAuthToken;
  }

  async healthCheck(): Promise<DevSpacesHealthResponse> {
    const start = Date.now();
    const apiUrl = await this.getApiUrl();

    if (!apiUrl) {
      return {
        ok: false,
        configured: false,
        message:
          'Dev Spaces API URL is not configured. Set it in Administration → Dev Spaces.',
      };
    }

    try {
      const token = await this.resolveToken();
      const resp = await this.fetchWithTimeout(`${apiUrl}/workspaces`, {
        method: 'GET',
        headers: this.headers(token),
      });
      const elapsed = Date.now() - start;

      if (resp.ok || resp.status === 401 || resp.status === 403) {
        return {
          ok: resp.ok,
          configured: true,
          message: resp.ok
            ? 'Connected to Dev Spaces API'
            : `Dev Spaces API returned ${resp.status} — check your authentication token`,
          apiUrl,
          responseTimeMs: elapsed,
        };
      }

      return {
        ok: false,
        configured: true,
        message: `Dev Spaces API returned ${resp.status}`,
        apiUrl,
        responseTimeMs: elapsed,
      };
    } catch (err) {
      const elapsed = Date.now() - start;
      const msg = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        configured: true,
        message: `Cannot reach Dev Spaces API: ${msg}`,
        apiUrl,
        responseTimeMs: elapsed,
      };
    }
  }

  async createWorkspace(
    req: DevSpacesCreateWorkspaceRequest,
  ): Promise<DevSpacesCreateWorkspaceResponse> {
    const apiUrl = await this.requireApiUrl();
    const token = await this.resolveToken();
    const targetUrl = `${apiUrl}/workspaces/intellij`;

    this.logger.info(`Creating Dev Spaces workspace in ${req.namespace}`);

    const resp = await this.fetchWithRetry(targetUrl, {
      method: 'POST',
      headers: this.headers(token),
      body: JSON.stringify({
        namespace: req.namespace,
        git_repo: req.git_repo,
        memory_limit: req.memory_limit || '8Gi',
        cpu_limit: req.cpu_limit || '2000m',
      }),
    });

    return this.parseResponse<DevSpacesCreateWorkspaceResponse>(
      resp,
      'create workspace',
    );
  }

  async listWorkspaces(
    namespace: string,
  ): Promise<DevSpacesListWorkspacesResponse> {
    const apiUrl = await this.requireApiUrl();
    const token = await this.resolveToken();
    const targetUrl = `${apiUrl}/workspaces?namespace=${encodeURIComponent(namespace)}`;

    const resp = await this.fetchWithRetry(targetUrl, {
      method: 'GET',
      headers: this.headers(token),
    });

    if (!resp.ok) {
      const detail = await this.extractError(resp);
      this.logger.error(`List workspaces failed (${resp.status}): ${detail}`);
      throw new Error(detail);
    }

    const body = await resp.json();
    const workspaces: DevSpacesWorkspace[] = Array.isArray(body)
      ? body
      : ((body as { workspaces?: DevSpacesWorkspace[] }).workspaces ?? []);

    return { workspaces, namespace };
  }

  async getWorkspace(
    namespace: string,
    name: string,
  ): Promise<DevSpacesWorkspace> {
    const apiUrl = await this.requireApiUrl();
    const token = await this.resolveToken();
    const targetUrl = `${apiUrl}/workspaces/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`;

    const resp = await this.fetchWithRetry(targetUrl, {
      method: 'GET',
      headers: this.headers(token),
    });

    return this.parseResponse<DevSpacesWorkspace>(resp, 'get workspace');
  }

  async stopWorkspace(namespace: string, name: string): Promise<void> {
    const apiUrl = await this.requireApiUrl();
    const token = await this.resolveToken();
    const targetUrl = `${apiUrl}/workspaces/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/stop`;

    this.logger.info(`Stopping workspace ${name} in ${namespace}`);

    const resp = await this.fetchWithTimeout(targetUrl, {
      method: 'PATCH',
      headers: this.headers(token),
    });

    if (!resp.ok) {
      const detail = await this.extractError(resp);
      this.logger.error(`Stop workspace failed (${resp.status}): ${detail}`);
      throw new Error(detail);
    }
  }

  async deleteWorkspace(namespace: string, name: string): Promise<void> {
    const apiUrl = await this.requireApiUrl();
    const token = await this.resolveToken();
    const targetUrl = `${apiUrl}/workspaces/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`;

    this.logger.info(`Deleting workspace ${name} in ${namespace}`);

    const resp = await this.fetchWithTimeout(targetUrl, {
      method: 'DELETE',
      headers: this.headers(token),
    });

    if (!resp.ok && resp.status !== 404) {
      const detail = await this.extractError(resp);
      this.logger.error(`Delete workspace failed (${resp.status}): ${detail}`);
      throw new Error(detail);
    }
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private async getApiUrl(): Promise<string | undefined> {
    const raw = (await this.adminConfig.get('devSpacesApiUrl')) as
      | string
      | undefined;
    return raw && typeof raw === 'string' ? raw.replace(/\/+$/, '') : undefined;
  }

  private async requireApiUrl(): Promise<string> {
    const url = await this.getApiUrl();
    if (!url) {
      throw new InputError(
        'Dev Spaces API URL is not configured. Set it in Administration → Dev Spaces.',
      );
    }
    return url;
  }

  private async resolveToken(): Promise<string> {
    const adminToken = (await this.adminConfig.get('devSpacesToken')) as
      | string
      | undefined;

    if (adminToken && typeof adminToken === 'string' && adminToken.trim()) {
      return adminToken.trim();
    }

    if (this.getAuthToken) {
      return this.getAuthToken();
    }

    throw new InputError(
      'Dev Spaces authentication is not configured. Either set an OpenShift token ' +
        'in Administration → Dev Spaces, or ensure the Kagenti provider is active.',
    );
  }

  private headers(token: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  private async fetchWithRetry(
    url: string,
    init: RequestInit,
  ): Promise<Response> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const resp = await this.fetchWithTimeout(url, init);
        if (
          !RETRYABLE_STATUS_CODES.has(resp.status) ||
          attempt === MAX_RETRIES
        ) {
          return resp;
        }
        this.logger.warn(
          `Dev Spaces API returned ${resp.status}, retrying (${attempt + 1}/${MAX_RETRIES})`,
        );
      } catch (err) {
        lastError = err;
        if (attempt === MAX_RETRIES) break;
        this.logger.warn(
          `Dev Spaces request failed, retrying (${attempt + 1}/${MAX_RETRIES}): ${err}`,
        );
      }
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
    }

    throw lastError ?? new Error('Dev Spaces request failed after retries');
  }

  private async parseResponse<T>(
    resp: Response,
    operation: string,
  ): Promise<T> {
    const body = await resp.text();
    const contentType = resp.headers.get('content-type') ?? '';

    if (!resp.ok) {
      const detail = contentType.includes('json')
        ? ((JSON.parse(body) as Record<string, unknown>)?.detail ?? body)
        : body;
      const msg = typeof detail === 'string' ? detail : JSON.stringify(detail);
      this.logger.error(
        `Dev Spaces ${operation} failed (${resp.status}): ${msg}`,
      );
      throw new Error(msg);
    }

    return contentType.includes('json') ? JSON.parse(body) : body;
  }

  private async extractError(resp: Response): Promise<string> {
    try {
      const body = await resp.text();
      const contentType = resp.headers.get('content-type') ?? '';
      if (contentType.includes('json')) {
        const parsed = JSON.parse(body) as Record<string, unknown>;
        return (parsed.detail as string) ?? (parsed.message as string) ?? body;
      }
      return body || `HTTP ${resp.status}`;
    } catch {
      return `HTTP ${resp.status}`;
    }
  }
}
