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
import * as fs from 'fs';
import {
  MIN_TOKEN_LIFETIME_S,
  TOKEN_EXPIRY_BUFFER_S,
  DEFAULT_TOKEN_EXPIRATION_S,
} from '../../../constants';
import { toErrorMessage } from '../../../services/utils';
import type {
  OAuthClientConfig,
  MCPServerServiceAccountConfig,
} from '../../../types';

export interface TokenCacheEntry {
  token: string;
  expiresAt: number;
}

export type FetchWithTlsControlFn = (
  url: string,
  options: { method: string; headers: Record<string, string>; body: string },
) => Promise<{
  ok: boolean;
  status: number;
  text: () => Promise<string>;
  json: () => Promise<unknown>;
}>;

export async function fetchOAuthClientCredentials(
  url: string,
  clientId: string,
  clientSecret: string,
  scopes: string[],
  fetchFn: FetchWithTlsControlFn,
): Promise<{ token: string; expiresIn: number }> {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: scopes.join(' '),
  });

  const response = await fetchFn(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OAuth token request failed: HTTP ${response.status}${
        errorText ? ` - ${errorText}` : ''
      }`,
    );
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in?: number;
  };
  const token = data.access_token;
  const expiresIn = data.expires_in || MIN_TOKEN_LIFETIME_S;
  return { token, expiresIn };
}

export async function fetchOAuthToken(
  serverId: string,
  oauth: OAuthClientConfig,
  oauthTokenCache: Map<string, TokenCacheEntry>,
  fetchFn: FetchWithTlsControlFn,
  evictExpiredEntries: (cache: Map<string, TokenCacheEntry>) => void,
  logger: LoggerService,
): Promise<string | null> {
  try {
    logger.info(`Fetching OAuth token for MCP server ${serverId}`);

    const scopes = oauth.scopes || ['openid'];
    const result = await fetchOAuthClientCredentials(
      oauth.tokenUrl,
      oauth.clientId,
      oauth.clientSecret,
      scopes,
      fetchFn,
    );

    const { token, expiresIn } = result;
    evictExpiredEntries(oauthTokenCache);
    oauthTokenCache.set(serverId, {
      token,
      expiresAt: Date.now() + (expiresIn - TOKEN_EXPIRY_BUFFER_S) * 1000,
    });

    logger.info(
      `OAuth token obtained for ${serverId}, expires in ${expiresIn}s`,
    );
    return token;
  } catch (error) {
    logger.error(
      `Failed to fetch OAuth token for ${serverId}: ${toErrorMessage(error)}`,
    );
    return null;
  }
}

export async function fetchServiceAccountToken(
  serverId: string,
  saConfig: MCPServerServiceAccountConfig,
  serviceAccountTokenCache: Map<string, TokenCacheEntry>,
  evictExpiredEntries: (cache: Map<string, TokenCacheEntry>) => void,
  logger: LoggerService,
): Promise<string | null> {
  const cacheKey = `${saConfig.namespace || 'default'}/${saConfig.name}`;
  const cached = serviceAccountTokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    logger.debug(`Using cached ServiceAccount token for ${serverId}`);
    return cached.token;
  }

  try {
    const inClusterTokenPath =
      '/var/run/secrets/kubernetes.io/serviceaccount/token';

    if (fs.existsSync(inClusterTokenPath)) {
      const namespaceFile =
        '/var/run/secrets/kubernetes.io/serviceaccount/namespace';
      const podNamespace = fs.existsSync(namespaceFile)
        ? (await fs.promises.readFile(namespaceFile, 'utf8')).trim()
        : 'default';

      const requestedNamespace = saConfig.namespace || podNamespace;

      logger.info(
        `Getting ServiceAccount token for ${requestedNamespace}/${saConfig.name}`,
      );

      const k8sHost = process.env.KUBERNETES_SERVICE_HOST;
      const k8sPort = process.env.KUBERNETES_SERVICE_PORT;

      if (k8sHost && k8sPort) {
        const podToken = (
          await fs.promises.readFile(inClusterTokenPath, 'utf8')
        ).trim();

        const tokenRequestUrl = `https://${k8sHost}:${k8sPort}/api/v1/namespaces/${requestedNamespace}/serviceaccounts/${saConfig.name}/token`;

        const tokenRequest = {
          apiVersion: 'authentication.k8s.io/v1',
          kind: 'TokenRequest',
          spec: {
            audiences: ['mcp-server'],
            expirationSeconds: DEFAULT_TOKEN_EXPIRATION_S,
          },
        };

        const response = await fetch(tokenRequestUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${podToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tokenRequest),
          signal: AbortSignal.timeout(15_000),
        });

        if (!response.ok) {
          const errorText = await response.text();
          logger.error(
            `Failed to create token for ServiceAccount ${requestedNamespace}/${saConfig.name}: ${response.status} ${errorText}`,
          );
          return null;
        }

        const data = (await response.json()) as {
          status: { token: string; expirationTimestamp: string };
        };
        const token = data.status.token;

        const expiresAt =
          new Date(data.status.expirationTimestamp).getTime() -
          TOKEN_EXPIRY_BUFFER_S * 1000;
        evictExpiredEntries(serviceAccountTokenCache);
        serviceAccountTokenCache.set(cacheKey, { token, expiresAt });

        logger.info(
          `ServiceAccount token obtained for ${requestedNamespace}/${saConfig.name}`,
        );
        return token;
      }
    }

    logger.warn(
      `Cannot get ServiceAccount token for ${serverId}: not running in-cluster`,
    );
    return null;
  } catch (error) {
    logger.error(
      `Failed to get ServiceAccount token for ${serverId}: ${toErrorMessage(
        error,
      )}`,
    );
    return null;
  }
}
