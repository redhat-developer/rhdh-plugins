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

import { randomBytes } from 'crypto';
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

const DW_API_GROUP = 'workspace.devfile.io';
const DW_API_VERSION = 'v1alpha2';
const DW_RESOURCE = 'devworkspaces';
const DW_BASE_PATH = `/apis/${DW_API_GROUP}/${DW_API_VERSION}`;

const DEFAULT_DEVSPACES_NAMESPACE = 'admin-devspaces';
const NAME_SUFFIX_LENGTH = 4;
const MAX_K8S_NAME_LENGTH = 63;

// ---------------------------------------------------------------------------
// Kubernetes DevWorkspace resource shape (subset we use)
// ---------------------------------------------------------------------------

interface KubeDevWorkspaceMeta {
  name: string;
  namespace: string;
  uid?: string;
  creationTimestamp?: string;
}

interface KubeDevWorkspaceContainer {
  name: string;
  memoryLimit?: string;
  memoryRequest?: string;
  cpuLimit?: string;
  cpuRequest?: string;
}

interface KubeDevWorkspaceSpec {
  started?: boolean;
  routingClass?: string;
  template?: {
    projects?: Array<{
      name: string;
      git?: { remotes?: Record<string, string> };
    }>;
    components?: Array<{
      name: string;
      container?: KubeDevWorkspaceContainer;
    }>;
  };
}

interface KubeDevWorkspaceStatus {
  phase?: string;
  devworkspaceId?: string;
  mainUrl?: string;
  message?: string;
}

interface KubeDevWorkspace {
  apiVersion: string;
  kind: string;
  metadata: KubeDevWorkspaceMeta;
  spec?: KubeDevWorkspaceSpec;
  status?: KubeDevWorkspaceStatus;
}

interface KubeDevWorkspaceList {
  items: KubeDevWorkspace[];
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

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

  // ── Health ──────────────────────────────────────────────────────────────

  async healthCheck(): Promise<DevSpacesHealthResponse> {
    const start = Date.now();
    const apiUrl = await this.getApiUrl();

    if (!apiUrl) {
      return {
        ok: false,
        configured: false,
        message:
          'OpenShift API URL is not configured. Set it in Administration → Dev Spaces.',
      };
    }

    try {
      const token = await this.resolveToken();
      const ns = await this.resolveNamespace();
      const url = `${this.dwUrl(apiUrl, ns)}?limit=1`;
      const resp = await this.fetchWithRetry(url, {
        method: 'GET',
        headers: this.jsonHeaders(token),
      });
      const elapsed = Date.now() - start;

      if (resp.ok) {
        return {
          ok: true,
          configured: true,
          message: 'Connected to Dev Spaces API',
          apiUrl,
          responseTimeMs: elapsed,
        };
      }

      return {
        ok: false,
        configured: true,
        message:
          resp.status === 401 || resp.status === 403
            ? `Kubernetes API returned ${resp.status} — check your OpenShift token`
            : `Kubernetes API returned ${resp.status}`,
        apiUrl,
        responseTimeMs: elapsed,
      };
    } catch (err) {
      const elapsed = Date.now() - start;
      const msg = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        configured: true,
        message: `Cannot reach Kubernetes API: ${msg}`,
        apiUrl,
        responseTimeMs: elapsed,
      };
    }
  }

  // ── Create ─────────────────────────────────────────────────────────────

  async createWorkspace(
    req: DevSpacesCreateWorkspaceRequest,
  ): Promise<DevSpacesCreateWorkspaceResponse> {
    const apiUrl = await this.requireApiUrl();
    const token = await this.resolveToken();
    const ns = await this.resolveNamespace(req.namespace);
    const repoName = this.repoNameFromUrl(req.git_repo);
    const suffix = randomBytes(NAME_SUFFIX_LENGTH)
      .toString('hex')
      .slice(0, NAME_SUFFIX_LENGTH);
    const workspaceName = this.sanitizeName(`${repoName}-${suffix}`);

    this.logger.info(
      `Creating DevWorkspace ${workspaceName} in ${ns} from ${req.git_repo}`,
    );

    const components: Array<{
      name: string;
      container: KubeDevWorkspaceContainer;
    }> = [];
    if (req.memory_limit || req.cpu_limit) {
      components.push({
        name: 'dev-tools',
        container: {
          name: 'dev-tools',
          ...(req.memory_limit && { memoryLimit: req.memory_limit }),
          ...(req.cpu_limit && { cpuLimit: req.cpu_limit }),
        },
      });
    }

    const devworkspace: KubeDevWorkspace = {
      apiVersion: `${DW_API_GROUP}/${DW_API_VERSION}`,
      kind: 'DevWorkspace',
      metadata: { name: workspaceName, namespace: ns },
      spec: {
        started: true,
        routingClass: 'che',
        template: {
          projects: [
            {
              name: repoName,
              git: { remotes: { origin: req.git_repo } },
            },
          ],
          ...(components.length > 0 && { components }),
        },
      },
    };

    const url = this.dwUrl(apiUrl, ns);
    const resp = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: this.jsonHeaders(token),
      body: JSON.stringify(devworkspace),
    });

    if (!resp.ok) {
      const detail = await this.extractK8sError(resp);
      this.logger.error(
        `Create DevWorkspace failed (${resp.status}): ${detail}`,
      );
      throw new Error(detail);
    }

    const created = (await resp.json()) as KubeDevWorkspace;
    return this.toCreateResponse(created);
  }

  // ── List ───────────────────────────────────────────────────────────────

  async listWorkspaces(
    namespace: string,
  ): Promise<DevSpacesListWorkspacesResponse> {
    const apiUrl = await this.requireApiUrl();
    const token = await this.resolveToken();
    const ns = await this.resolveNamespace(namespace);
    const url = this.dwUrl(apiUrl, ns);

    const resp = await this.fetchWithRetry(url, {
      method: 'GET',
      headers: this.jsonHeaders(token),
    });

    if (!resp.ok) {
      const detail = await this.extractK8sError(resp);
      this.logger.error(
        `List DevWorkspaces failed (${resp.status}): ${detail}`,
      );
      throw new Error(detail);
    }

    const body = (await resp.json()) as KubeDevWorkspaceList;
    const workspaces = (body.items ?? []).map(dw => this.toWorkspace(dw));
    return { workspaces, namespace: ns };
  }

  // ── Get ────────────────────────────────────────────────────────────────

  async getWorkspace(
    namespace: string,
    name: string,
  ): Promise<DevSpacesWorkspace> {
    const apiUrl = await this.requireApiUrl();
    const token = await this.resolveToken();
    const url = this.dwUrl(apiUrl, namespace, name);

    const resp = await this.fetchWithRetry(url, {
      method: 'GET',
      headers: this.jsonHeaders(token),
    });

    if (!resp.ok) {
      const detail = await this.extractK8sError(resp);
      throw new Error(detail);
    }

    return this.toWorkspace((await resp.json()) as KubeDevWorkspace);
  }

  // ── Stop ───────────────────────────────────────────────────────────────

  async stopWorkspace(namespace: string, name: string): Promise<void> {
    const apiUrl = await this.requireApiUrl();
    const token = await this.resolveToken();
    const url = this.dwUrl(apiUrl, namespace, name);

    this.logger.info(`Stopping DevWorkspace ${name} in ${namespace}`);

    const resp = await this.fetchWithRetry(url, {
      method: 'PATCH',
      headers: this.patchHeaders(token),
      body: JSON.stringify({ spec: { started: false } }),
    });

    if (!resp.ok) {
      const detail = await this.extractK8sError(resp);
      this.logger.error(`Stop DevWorkspace failed (${resp.status}): ${detail}`);
      throw new Error(detail);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────

  async deleteWorkspace(namespace: string, name: string): Promise<void> {
    const apiUrl = await this.requireApiUrl();
    const token = await this.resolveToken();
    const url = this.dwUrl(apiUrl, namespace, name);

    this.logger.info(`Deleting DevWorkspace ${name} in ${namespace}`);

    const resp = await this.fetchWithRetry(url, {
      method: 'DELETE',
      headers: this.jsonHeaders(token),
    });

    if (!resp.ok && resp.status !== 404) {
      const detail = await this.extractK8sError(resp);
      this.logger.error(
        `Delete DevWorkspace failed (${resp.status}): ${detail}`,
      );
      throw new Error(detail);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Internal helpers
  // ═══════════════════════════════════════════════════════════════════════

  private dwUrl(apiUrl: string, namespace: string, name?: string): string {
    const base = `${apiUrl}${DW_BASE_PATH}/namespaces/${encodeURIComponent(namespace)}/${DW_RESOURCE}`;
    return name ? `${base}/${encodeURIComponent(name)}` : base;
  }

  private toWorkspace(dw: KubeDevWorkspace): DevSpacesWorkspace {
    const project = dw.spec?.template?.projects?.[0];
    return {
      name: dw.metadata.name,
      namespace: dw.metadata.namespace,
      phase: dw.status?.phase ?? 'Unknown',
      url: dw.status?.mainUrl,
      created_at: dw.metadata.creationTimestamp,
      git_repo: project?.git?.remotes?.origin,
    };
  }

  private toCreateResponse(
    dw: KubeDevWorkspace,
  ): DevSpacesCreateWorkspaceResponse {
    return {
      name: dw.metadata.name,
      namespace: dw.metadata.namespace,
      phase: dw.status?.phase ?? 'Starting',
      message: dw.status?.message,
      url: dw.status?.mainUrl,
      created_at: dw.metadata.creationTimestamp,
    };
  }

  private repoNameFromUrl(gitUrl: string): string {
    const last = gitUrl.replace(/\/+$/, '').split('/').pop() ?? 'workspace';
    return last.replace(/\.git$/i, '');
  }

  private sanitizeName(raw: string): string {
    return (
      raw
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, MAX_K8S_NAME_LENGTH) || 'workspace'
    );
  }

  // ── Config & auth ──────────────────────────────────────────────────────

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
        'OpenShift API URL is not configured. Set it in Administration → Dev Spaces.',
      );
    }
    return url;
  }

  /**
   * Resolve the Kubernetes namespace for DevWorkspace resources.
   * Uses the admin-configured `devSpacesNamespace`, falling back to
   * the provided hint or the default `admin-devspaces`.
   */
  private async resolveNamespace(hint?: string): Promise<string> {
    const configured = (await this.adminConfig.get('devSpacesNamespace')) as
      | string
      | undefined;
    if (configured && typeof configured === 'string' && configured.trim()) {
      return configured.trim();
    }
    if (hint && hint.endsWith('-devspaces')) {
      return hint;
    }
    return hint ? `${hint}-devspaces` : DEFAULT_DEVSPACES_NAMESPACE;
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

  private jsonHeaders(token: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  private patchHeaders(token: string): Record<string, string> {
    return {
      'Content-Type': 'application/merge-patch+json',
      Authorization: `Bearer ${token}`,
    };
  }

  // ── HTTP helpers ───────────────────────────────────────────────────────

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
          `K8s API returned ${resp.status}, retrying (${attempt + 1}/${MAX_RETRIES})`,
        );
      } catch (err) {
        lastError = err;
        if (attempt === MAX_RETRIES) break;
        this.logger.warn(
          `K8s request failed, retrying (${attempt + 1}/${MAX_RETRIES}): ${err}`,
        );
      }
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
    }

    throw lastError ?? new Error('Kubernetes API request failed after retries');
  }

  private async extractK8sError(resp: Response): Promise<string> {
    try {
      const body = await resp.text();
      const contentType = resp.headers.get('content-type') ?? '';
      if (contentType.includes('json')) {
        const parsed = JSON.parse(body) as Record<string, unknown>;
        return (parsed.message as string) ?? (parsed.reason as string) ?? body;
      }
      return body || `HTTP ${resp.status}`;
    } catch {
      return `HTTP ${resp.status}`;
    }
  }
}
