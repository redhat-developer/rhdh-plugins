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

const INTERNAL_URL_PATTERN =
  /https?:\/\/[^\s]+\.svc(\.cluster\.local)?(:\d+)?[^\s]*/;
const RAW_URL_TEST_PATTERN = /https?:\/\/[^\s]+/;

function buildUserFriendlyError(error: string, label: string): string {
  if (/connection refused|ECONNREFUSED/i.test(error)) {
    return `MCP server "${label}" is temporarily unreachable (connection refused). Check that the server is running and accessible.`;
  }
  if (/timeout|ETIMEDOUT/i.test(error)) {
    return `MCP server "${label}" timed out. The server may be overloaded or unreachable.`;
  }
  if (/502/i.test(error)) {
    return `MCP server "${label}" returned an error (502). The server may be down or misconfigured.`;
  }
  if (/401|unauthorized/i.test(error)) {
    return `MCP server "${label}" rejected the request (unauthorized). Check the server's authentication configuration.`;
  }
  if (/403|forbidden/i.test(error)) {
    return `MCP server "${label}" denied access (forbidden). Check permissions and credentials.`;
  }
  return `MCP server "${label}" encountered an error. Contact your administrator if the issue persists.`;
}

export function sanitizeMcpError(error: string, serverLabel?: string): string {
  if (INTERNAL_URL_PATTERN.test(error)) {
    const label = serverLabel || 'MCP server';
    return buildUserFriendlyError(error, label);
  }

  if (RAW_URL_TEST_PATTERN.test(error)) {
    const label = serverLabel || 'MCP server';
    return buildUserFriendlyError(error, label);
  }

  return error;
}

export function extractErrorString(
  error: string | { message?: string },
): string {
  if (typeof error === 'string') return error;
  return error.message ?? '';
}
