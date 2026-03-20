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
 * Strip the backend tool namespace prefix from a tool name.
 *
 * In backend execution mode, tool names are prefixed as
 * `{serverId}__{toolName}` (e.g. `ocp-mcp__list_pods`).
 * This function removes that prefix for display to users.
 *
 * @param name - The potentially prefixed tool name
 * @param serverLabel - The MCP server label (e.g. `ocp-mcp`)
 * @returns The clean tool name without the namespace prefix
 */
export function stripToolPrefix(name: string, serverLabel?: string): string {
  if (!serverLabel) return name;
  const asIs = `${serverLabel}__`;
  if (name.startsWith(asIs)) return name.slice(asIs.length);
  const normalized = `${serverLabel.replace(/-/g, '_')}__`;
  return name.startsWith(normalized) ? name.slice(normalized.length) : name;
}
