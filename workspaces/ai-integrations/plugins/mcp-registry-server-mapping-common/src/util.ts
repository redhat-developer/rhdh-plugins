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

import type { McpServerDocument } from './types';

/** Format a dot-separated object path for error messages, using `<root>` when empty. */
function formatObjectDotPath(objectDotPath: string): string {
  return objectDotPath.length > 0 ? objectDotPath : '<root>';
}

/**
 * Require that `doc.$schema` identifies an MCP Registry server.json
 * document (absolute URL whose basename is `server.schema.json`).
 *
 * Call at the entry of every public function that accepts
 * {@link McpServerDocument}.
 */
export function assertServerJsonSchema(doc: McpServerDocument): void {
  const { $schema } = doc;
  if (typeof $schema !== 'string') {
    throw new TypeError(
      'MCP Registry server.json requires $schema to be a string whose URL ' +
        'basename is "server.schema.json"',
    );
  }

  const trimmed = $schema.trim();
  if (trimmed.length === 0) {
    throw new TypeError(
      'MCP Registry server.json requires $schema to be a non-empty string ' +
        'whose URL basename is "server.schema.json"',
    );
  }

  let basename: string;
  try {
    const pathname = new URL(trimmed).pathname;
    basename = pathname.split('/').filter(Boolean).at(-1) ?? '';
  } catch {
    throw new TypeError(
      'MCP Registry server.json requires $schema to be an absolute URL ' +
        `whose basename is "server.schema.json" (received ${JSON.stringify(
          $schema,
        )})`,
    );
  }

  if (basename !== 'server.schema.json') {
    throw new TypeError(
      'MCP Registry server.json requires $schema URL basename to be ' +
        `"server.schema.json" (received ${JSON.stringify(basename)})`,
    );
  }
}

/**
 * Require that a present object property is a boolean.
 *
 * @internal
 */
export function requireBooleanProperty(
  obj: Record<string, unknown>,
  propertyName: string,
  objectDotPath: string,
): boolean {
  if (!Object.hasOwn(obj, propertyName)) {
    throw new Error(
      `Missing required boolean property "${propertyName}" at "${formatObjectDotPath(
        objectDotPath,
      )}"`,
    );
  }
  const value = obj[propertyName];
  if (typeof value !== 'boolean') {
    throw new TypeError(
      `${propertyName} must be a boolean at "${formatObjectDotPath(
        objectDotPath,
      )}" (received ${typeof value})`,
    );
  }
  return value;
}
