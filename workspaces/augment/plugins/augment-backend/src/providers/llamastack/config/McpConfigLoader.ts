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

import type { Config } from '@backstage/config';
import type { LoggerService } from '@backstage/backend-plugin-api';
import type {
  MCPAuthConfig,
  MCPServerConfig,
  ApprovalFilter,
  ResponsesApiMcpTool,
} from '../../../types';
import { toErrorMessage } from '../../../services/utils';

/**
 * Convert MCPServerConfig's requireApproval to Llama Stack API format
 *
 * KNOWN LIMITATION: Llama Stack's object format for require_approval (with always/never arrays)
 * does NOT work as expected - it requires approval for ALL tools when an object is passed.
 *
 * Until this is fixed in Llama Stack, we only support string values:
 * - "never" - All tools auto-execute (default)
 * - "always" - All tools require user approval
 *
 * The object format config is preserved in app-config.yaml for future use.
 *
 * @param configApproval - The approval config from app-config.yaml
 * @param logger - Logger for warning when object format is used
 * @returns "always" or "never" (object format not supported by Llama Stack)
 */
export function getApiApprovalConfig(
  configApproval: 'always' | 'never' | ApprovalFilter | undefined,
  logger: LoggerService,
): ResponsesApiMcpTool['require_approval'] {
  if (!configApproval) {
    return 'never'; // Default: auto-execute all tools
  }

  if (typeof configApproval === 'string') {
    return configApproval; // 'always' or 'never'
  }

  /**
   * LLAMA STACK API LIMITATION:
   * Object format (always/never arrays) is NOT supported by Llama Stack currently.
   * When an object is passed, Llama Stack incorrectly requires approval for ALL tools.
   *
   * Workaround: Default to 'never' (auto-execute all) when object format is configured.
   * Users who need approval should set requireApproval: "always" for all tools.
   *
   * Llama Stack currently only supports string-valued require_approval
   * ("always" | "never"). Per-tool approval filters (object format) will
   * need Llama Stack to support the `include` / `exclude` filter syntax
   * in `require_approval`. Monitor Llama Stack release notes for this feature.
   */
  logger.warn(
    'Llama Stack does not support per-tool require_approval (object format). ' +
      'Using "never" (auto-execute all). Set requireApproval: "always" to require approval for ALL tools.',
  );
  return 'never';
}

/**
 * Load named MCP auth configurations from app-config.
 *
 * @param config - Backstage config (e.g. RootConfigService)
 * @param logger - Logger for debug/warn messages
 * @returns Map of auth config name to MCPAuthConfig
 */
export function loadMcpAuthConfigs(
  config: Config,
  logger: LoggerService,
): Map<string, MCPAuthConfig> {
  const configs = new Map<string, MCPAuthConfig>();

  try {
    const mcpAuthConfig = config.getOptionalConfig('augment.mcpAuth');
    if (!mcpAuthConfig) {
      return configs;
    }

    const keys = mcpAuthConfig.keys();
    for (const key of keys) {
      const authConfig = mcpAuthConfig.getConfig(key);
      const authType = authConfig.getString('type') as
        | 'oauth'
        | 'serviceAccount';

      if (authType === 'oauth') {
        configs.set(key, {
          type: 'oauth',
          tokenUrl: authConfig.getString('tokenUrl'),
          clientId: authConfig.getString('clientId'),
          clientSecret: authConfig.getString('clientSecret'),
          scopes: authConfig.getOptionalStringArray('scopes'),
        });
        logger.debug(`Loaded OAuth auth config: ${key}`);
      } else if (authType === 'serviceAccount') {
        configs.set(key, {
          type: 'serviceAccount',
          name: authConfig.getString('name'),
          namespace: authConfig.getOptionalString('namespace'),
        });
        logger.debug(`Loaded ServiceAccount auth config: ${key}`);
      }
    }
  } catch (error) {
    const errorMsg = toErrorMessage(error);
    logger.warn(
      `Failed to load MCP auth configurations: ${errorMsg}. MCP servers will not have authentication.`,
    );
  }

  return configs;
}

function parseRequireApproval(
  serverConfig: Config,
  logger: LoggerService,
): MCPServerConfig['requireApproval'] {
  try {
    const approvalConfigObj = serverConfig.getOptionalConfig('requireApproval');
    if (approvalConfigObj) {
      const alwaysTools = approvalConfigObj.getOptionalStringArray('always');
      const neverTools = approvalConfigObj.getOptionalStringArray('never');
      if (alwaysTools || neverTools) {
        logger.info(
          `MCP server requireApproval parsed: always=${JSON.stringify(alwaysTools)}, never=${JSON.stringify(neverTools)}`,
        );
        return { always: alwaysTools, never: neverTools };
      }
    }
  } catch {
    logger.debug(
      'MCP server config parse failed, falling through to string parsing',
    );
  }

  try {
    const approvalString = serverConfig.getOptionalString('requireApproval');
    if (approvalString) {
      logger.info(`MCP server requireApproval: ${approvalString}`);
      return approvalString as 'always' | 'never';
    }
  } catch (e) {
    logger.warn(`Failed to parse requireApproval config: ${e}`);
  }

  return undefined;
}

function parseServerAuth(
  serverConfig: Config,
  server: MCPServerConfig,
  logger: LoggerService,
): void {
  const authRef = serverConfig.getOptionalString('authRef');
  if (authRef) {
    server.authRef = authRef;
    logger.info(`MCP server ${server.id} using auth config: ${authRef}`);
  }

  const oauthConfig = serverConfig.getOptionalConfig('oauth');
  if (oauthConfig) {
    server.oauth = {
      tokenUrl: oauthConfig.getString('tokenUrl'),
      clientId: oauthConfig.getString('clientId'),
      clientSecret: oauthConfig.getString('clientSecret'),
      scopes: oauthConfig.getOptionalStringArray('scopes'),
    };
    logger.info(
      `MCP server ${server.id} configured with inline OAuth (client: ${server.oauth.clientId})`,
    );
  }

  const saConfig = serverConfig.getOptionalConfig('serviceAccount');
  if (saConfig) {
    server.serviceAccount = {
      name: saConfig.getString('name'),
      namespace: saConfig.getOptionalString('namespace'),
    };
    logger.info(
      `MCP server ${server.id} configured with ServiceAccount: ${
        server.serviceAccount.namespace || 'default'
      }/${server.serviceAccount.name}`,
    );
  }
}

/**
 * Load MCP server configurations from app-config.
 *
 * @param config - Backstage config (e.g. RootConfigService)
 * @param logger - Logger for info/warn messages
 * @param _authConfigs - Optional map of named auth configs (reserved for future validation)
 * @returns Array of MCPServerConfig for streamable-http and sse servers
 */
export function loadMcpServerConfigs(
  config: Config,
  logger: LoggerService,
  _authConfigs?: Map<string, MCPAuthConfig>,
): MCPServerConfig[] {
  const servers: MCPServerConfig[] = [];

  try {
    const mcpServersConfig =
      config.getOptionalConfigArray('augment.mcpServers');
    if (!mcpServersConfig) {
      return servers;
    }

    for (const serverConfig of mcpServersConfig) {
      const type = serverConfig.getString('type') as 'streamable-http' | 'sse';

      if (type !== 'streamable-http' && type !== 'sse') {
        logger.warn(
          `MCP server ${serverConfig.getString('id')} has unsupported type ${type} - only streamable-http and sse work with Responses API`,
        );
        continue;
      }

      const server: MCPServerConfig = {
        id: serverConfig.getString('id'),
        name: serverConfig.getString('name'),
        type,
        url: serverConfig.getString('url'),
        headers: serverConfig.getOptional('headers') as
          | Record<string, string>
          | undefined,
        allowedTools: serverConfig.getOptionalStringArray('allowedTools'),
      };

      parseServerAuth(serverConfig, server, logger);

      const requireApproval = parseRequireApproval(serverConfig, logger);
      if (requireApproval) {
        server.requireApproval = requireApproval;
        logger.info(
          `MCP server ${server.id} HITL config: ${JSON.stringify(requireApproval)}`,
        );
      }

      servers.push(server);
    }
  } catch (error) {
    const errorMsg = toErrorMessage(error);
    logger.warn(
      `Failed to load MCP server configurations: ${errorMsg}. MCP tools will not be available.`,
    );
  }

  return servers;
}
