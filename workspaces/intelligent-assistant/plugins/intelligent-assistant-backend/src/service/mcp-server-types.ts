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

/** Database row for the lightspeed_mcp_user_settings table. */
export interface McpUserSettingsRow {
  id: string;
  server_name: string;
  user_entity_ref: string;
  enabled: boolean;
  token: string | null;
  status: McpServerStatus;
  tool_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * @public
 */
export type McpServerStatus = 'connected' | 'error' | 'unknown';

/**
 * Authentication mode for MCP servers.
 * @public
 */
export type McpServerAuth = 'dcr';

/**
 * Public-facing response for an MCP server with user settings merged.
 * @public
 */
export interface McpServerResponse {
  name: string;
  url?: string;
  enabled: boolean;
  status: McpServerStatus;
  toolCount: number;
  hasToken: boolean;
  hasUserToken: boolean;
  /** True when app-config defines a default token for this server. */
  hasOrgToken: boolean;
  /** Authentication mode — `'dcr'` means tokens are minted automatically. */
  auth?: McpServerAuth;
}

/**
 * @public
 */
export interface McpToolInfo {
  name: string;
  description: string;
}

/**
 * @public
 */
export interface McpValidationResult {
  valid: boolean;
  toolCount: number;
  tools: McpToolInfo[];
  error?: string;
}
