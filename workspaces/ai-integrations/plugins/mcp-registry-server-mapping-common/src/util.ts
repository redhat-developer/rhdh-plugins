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

const SERVER_DETAIL_KEYS = new Set([
  '$schema',
  'name',
  'title',
  'description',
  'version',
  'websiteUrl',
  'repository',
  'remotes',
  'icons',
  'packages',
  '_meta',
]);

const REPOSITORY_KEYS = new Set(['url', 'source', 'id', 'subfolder']);

const ICON_KEYS = new Set(['src', 'mimeType', 'sizes', 'theme']);

const ICON_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/svg+xml',
  'image/webp',
]);

const PACKAGE_KEYS = new Set([
  'registryType',
  'identifier',
  'transport',
  'version',
  'registryBaseUrl',
  'runtimeHint',
  'fileSha256',
  'environmentVariables',
  'packageArguments',
  'runtimeArguments',
]);

const INPUT_KEYS = new Set([
  'choices',
  'default',
  'description',
  'format',
  'isRequired',
  'isSecret',
  'placeholder',
  'value',
  'variables',
]);

const KEY_VALUE_INPUT_KEYS = new Set([...INPUT_KEYS, 'name']);

const POSITIONAL_ARGUMENT_KEYS = new Set([
  ...INPUT_KEYS,
  'type',
  'isRepeated',
  'valueHint',
]);

const NAMED_ARGUMENT_KEYS = new Set([
  ...INPUT_KEYS,
  'type',
  'name',
  'isRepeated',
]);

const STDIO_TRANSPORT_KEYS = new Set(['type']);

const HTTP_LIKE_TRANSPORT_KEYS = new Set(['type', 'url', 'headers']);

const REMOTE_KEYS = new Set(['type', 'url', 'headers', 'variables']);

const INPUT_FORMATS = new Set(['string', 'number', 'boolean', 'filepath']);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertNoUnknownKeys(
  obj: Record<string, unknown>,
  allowed: Set<string>,
  objectDotPath: string,
): void {
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) {
      throw new TypeError(
        `MCP Registry server.json has unknown field ${JSON.stringify(
          key,
        )} at "${formatObjectDotPath(objectDotPath)}"`,
      );
    }
  }
}

function assertString(
  value: unknown,
  fieldName: string,
  objectDotPath: string,
): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeError(
      `MCP Registry server.json requires ${fieldName} to be a string at ` +
        `"${formatObjectDotPath(objectDotPath)}" (received ${typeof value})`,
    );
  }
}

function assertOptionalString(
  obj: Record<string, unknown>,
  fieldName: string,
  objectDotPath: string,
): void {
  if (!Object.hasOwn(obj, fieldName)) {
    return;
  }
  const value = obj[fieldName];
  // Explicit undefined from Partial spreads is treated as absent
  if (value === undefined) {
    return;
  }
  assertString(value, fieldName, objectDotPath);
}

function assertOptionalBoolean(
  obj: Record<string, unknown>,
  fieldName: string,
  objectDotPath: string,
): void {
  if (!Object.hasOwn(obj, fieldName)) {
    return;
  }
  const value = obj[fieldName];
  if (value === undefined) {
    return;
  }
  if (typeof value !== 'boolean') {
    throw new TypeError(
      `MCP Registry server.json requires ${fieldName} to be a boolean at ` +
        `"${formatObjectDotPath(objectDotPath)}" (received ${typeof value})`,
    );
  }
}

function assertServerSchemaUri($schema: unknown): void {
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

function assertInput(
  value: unknown,
  objectDotPath: string,
  allowedKeys: Set<string> = INPUT_KEYS,
): asserts value is Record<string, unknown> {
  if (!isPlainObject(value)) {
    throw new TypeError(
      `MCP Registry server.json requires an object at "${formatObjectDotPath(
        objectDotPath,
      )}" (received ${Array.isArray(value) ? 'array' : typeof value})`,
    );
  }
  assertNoUnknownKeys(value, allowedKeys, objectDotPath);
  assertOptionalString(value, 'default', objectDotPath);
  assertOptionalString(value, 'description', objectDotPath);
  assertOptionalString(value, 'placeholder', objectDotPath);
  assertOptionalString(value, 'value', objectDotPath);
  assertOptionalBoolean(value, 'isRequired', objectDotPath);
  assertOptionalBoolean(value, 'isSecret', objectDotPath);

  if (Object.hasOwn(value, 'format')) {
    assertString(value.format, 'format', objectDotPath);
    if (!INPUT_FORMATS.has(value.format)) {
      throw new TypeError(
        `MCP Registry server.json requires format to be one of ` +
          `${[...INPUT_FORMATS].join(', ')} at "${formatObjectDotPath(
            objectDotPath,
          )}" (received ${JSON.stringify(value.format)})`,
      );
    }
  }

  if (Object.hasOwn(value, 'choices')) {
    if (
      !Array.isArray(value.choices) ||
      value.choices.some(item => typeof item !== 'string')
    ) {
      throw new TypeError(
        `MCP Registry server.json requires choices to be a string[] at ` +
          `"${formatObjectDotPath(objectDotPath)}"`,
      );
    }
  }

  if (Object.hasOwn(value, 'variables')) {
    if (!isPlainObject(value.variables)) {
      throw new TypeError(
        `MCP Registry server.json requires variables to be an object at ` +
          `"${formatObjectDotPath(objectDotPath)}"`,
      );
    }
    for (const [key, nested] of Object.entries(value.variables)) {
      assertInput(nested, `${objectDotPath}.variables.${key}`);
    }
  }
}

function assertKeyValueInput(value: unknown, objectDotPath: string): void {
  assertInput(value, objectDotPath, KEY_VALUE_INPUT_KEYS);
  if (!Object.hasOwn(value as object, 'name')) {
    throw new TypeError(
      `MCP Registry server.json requires name at "${formatObjectDotPath(
        objectDotPath,
      )}"`,
    );
  }
  assertString((value as Record<string, unknown>).name, 'name', objectDotPath);
}

function assertArgument(value: unknown, objectDotPath: string): void {
  if (!isPlainObject(value)) {
    throw new TypeError(
      `MCP Registry server.json requires an argument object at ` +
        `"${formatObjectDotPath(objectDotPath)}"`,
    );
  }
  assertString(value.type, 'type', objectDotPath);
  if (value.type === 'positional') {
    assertNoUnknownKeys(value, POSITIONAL_ARGUMENT_KEYS, objectDotPath);
    assertInput(value, objectDotPath, POSITIONAL_ARGUMENT_KEYS);
    assertOptionalBoolean(value, 'isRepeated', objectDotPath);
    assertOptionalString(value, 'valueHint', objectDotPath);
    return;
  }
  if (value.type === 'named') {
    assertNoUnknownKeys(value, NAMED_ARGUMENT_KEYS, objectDotPath);
    assertInput(value, objectDotPath, NAMED_ARGUMENT_KEYS);
    if (!Object.hasOwn(value, 'name')) {
      throw new TypeError(
        `MCP Registry server.json requires name at "${formatObjectDotPath(
          objectDotPath,
        )}"`,
      );
    }
    assertString(value.name, 'name', objectDotPath);
    assertOptionalBoolean(value, 'isRepeated', objectDotPath);
    return;
  }
  throw new TypeError(
    `MCP Registry server.json requires argument type "positional" or ` +
      `"named" at "${formatObjectDotPath(objectDotPath)}" (received ` +
      `${JSON.stringify(value.type)})`,
  );
}

function assertHeaders(value: unknown, objectDotPath: string): void {
  if (!Array.isArray(value)) {
    throw new TypeError(
      `MCP Registry server.json requires headers to be an array at ` +
        `"${formatObjectDotPath(objectDotPath)}"`,
    );
  }
  value.forEach((header, index) => {
    assertKeyValueInput(header, `${objectDotPath}.${index}`);
  });
}

function assertLocalTransport(value: unknown, objectDotPath: string): void {
  if (!isPlainObject(value)) {
    throw new TypeError(
      `MCP Registry server.json requires transport to be an object at ` +
        `"${formatObjectDotPath(objectDotPath)}"`,
    );
  }
  assertString(value.type, 'type', objectDotPath);
  if (value.type === 'stdio') {
    assertNoUnknownKeys(value, STDIO_TRANSPORT_KEYS, objectDotPath);
    return;
  }
  if (value.type === 'streamable-http' || value.type === 'sse') {
    assertNoUnknownKeys(value, HTTP_LIKE_TRANSPORT_KEYS, objectDotPath);
    if (!Object.hasOwn(value, 'url')) {
      throw new TypeError(
        `MCP Registry server.json requires url at "${formatObjectDotPath(
          objectDotPath,
        )}"`,
      );
    }
    assertString(value.url, 'url', objectDotPath);
    if (Object.hasOwn(value, 'headers')) {
      assertHeaders(value.headers, `${objectDotPath}.headers`);
    }
    return;
  }
  throw new TypeError(
    `MCP Registry server.json requires transport type "stdio", ` +
      `"streamable-http", or "sse" at "${formatObjectDotPath(
        objectDotPath,
      )}" (received ${JSON.stringify(value.type)})`,
  );
}

function assertRemote(value: unknown, objectDotPath: string): void {
  if (!isPlainObject(value)) {
    throw new TypeError(
      `MCP Registry server.json requires remotes entries to be objects at ` +
        `"${formatObjectDotPath(objectDotPath)}"`,
    );
  }
  assertNoUnknownKeys(value, REMOTE_KEYS, objectDotPath);
  assertString(value.type, 'type', objectDotPath);
  if (value.type !== 'streamable-http' && value.type !== 'sse') {
    throw new TypeError(
      `MCP Registry server.json requires remotes[].type to be ` +
        `"streamable-http" or "sse" at "${formatObjectDotPath(
          objectDotPath,
        )}" (received ${JSON.stringify(value.type)})`,
    );
  }
  if (!Object.hasOwn(value, 'url')) {
    throw new TypeError(
      `MCP Registry server.json requires url at "${formatObjectDotPath(
        objectDotPath,
      )}"`,
    );
  }
  assertString(value.url, 'url', objectDotPath);
  if (Object.hasOwn(value, 'headers')) {
    assertHeaders(value.headers, `${objectDotPath}.headers`);
  }
  if (Object.hasOwn(value, 'variables')) {
    if (!isPlainObject(value.variables)) {
      throw new TypeError(
        `MCP Registry server.json requires variables to be an object at ` +
          `"${formatObjectDotPath(objectDotPath)}"`,
      );
    }
    for (const [key, nested] of Object.entries(value.variables)) {
      assertInput(nested, `${objectDotPath}.variables.${key}`);
    }
  }
}

function assertRepository(value: unknown, objectDotPath: string): void {
  if (!isPlainObject(value)) {
    throw new TypeError(
      `MCP Registry server.json requires repository to be an object at ` +
        `"${formatObjectDotPath(objectDotPath)}"`,
    );
  }
  assertNoUnknownKeys(value, REPOSITORY_KEYS, objectDotPath);
  if (!Object.hasOwn(value, 'url') || !Object.hasOwn(value, 'source')) {
    throw new TypeError(
      `MCP Registry server.json requires repository.url and ` +
        `repository.source at "${formatObjectDotPath(objectDotPath)}"`,
    );
  }
  assertString(value.url, 'url', objectDotPath);
  assertString(value.source, 'source', objectDotPath);
  assertOptionalString(value, 'id', objectDotPath);
  assertOptionalString(value, 'subfolder', objectDotPath);
}

function assertIcon(value: unknown, objectDotPath: string): void {
  if (!isPlainObject(value)) {
    throw new TypeError(
      `MCP Registry server.json requires icons entries to be objects at ` +
        `"${formatObjectDotPath(objectDotPath)}"`,
    );
  }
  assertNoUnknownKeys(value, ICON_KEYS, objectDotPath);
  if (!Object.hasOwn(value, 'src')) {
    throw new TypeError(
      `MCP Registry server.json requires src at "${formatObjectDotPath(
        objectDotPath,
      )}"`,
    );
  }
  assertString(value.src, 'src', objectDotPath);
  if (Object.hasOwn(value, 'mimeType')) {
    assertString(value.mimeType, 'mimeType', objectDotPath);
    if (!ICON_MIME_TYPES.has(value.mimeType)) {
      throw new TypeError(
        `MCP Registry server.json requires mimeType to be one of ` +
          `${[...ICON_MIME_TYPES].join(', ')} at "${formatObjectDotPath(
            objectDotPath,
          )}" (received ${JSON.stringify(value.mimeType)})`,
      );
    }
  }
  if (Object.hasOwn(value, 'theme')) {
    assertString(value.theme, 'theme', objectDotPath);
    if (value.theme !== 'light' && value.theme !== 'dark') {
      throw new TypeError(
        `MCP Registry server.json requires theme to be "light" or "dark" ` +
          `at "${formatObjectDotPath(objectDotPath)}" (received ` +
          `${JSON.stringify(value.theme)})`,
      );
    }
  }
  if (Object.hasOwn(value, 'sizes')) {
    if (
      !Array.isArray(value.sizes) ||
      value.sizes.some(item => typeof item !== 'string')
    ) {
      throw new TypeError(
        `MCP Registry server.json requires sizes to be a string[] at ` +
          `"${formatObjectDotPath(objectDotPath)}"`,
      );
    }
  }
}

function assertPackage(value: unknown, objectDotPath: string): void {
  if (!isPlainObject(value)) {
    throw new TypeError(
      `MCP Registry server.json requires packages entries to be objects at ` +
        `"${formatObjectDotPath(objectDotPath)}"`,
    );
  }
  assertNoUnknownKeys(value, PACKAGE_KEYS, objectDotPath);
  for (const required of ['registryType', 'identifier', 'transport'] as const) {
    if (!Object.hasOwn(value, required)) {
      throw new TypeError(
        `MCP Registry server.json requires ${required} at ` +
          `"${formatObjectDotPath(objectDotPath)}"`,
      );
    }
  }
  assertString(value.registryType, 'registryType', objectDotPath);
  assertString(value.identifier, 'identifier', objectDotPath);
  assertLocalTransport(value.transport, `${objectDotPath}.transport`);
  assertOptionalString(value, 'version', objectDotPath);
  assertOptionalString(value, 'registryBaseUrl', objectDotPath);
  assertOptionalString(value, 'runtimeHint', objectDotPath);
  assertOptionalString(value, 'fileSha256', objectDotPath);

  if (Object.hasOwn(value, 'environmentVariables')) {
    if (!Array.isArray(value.environmentVariables)) {
      throw new TypeError(
        `MCP Registry server.json requires environmentVariables to be an ` +
          `array at "${formatObjectDotPath(objectDotPath)}"`,
      );
    }
    value.environmentVariables.forEach((entry, index) => {
      assertKeyValueInput(
        entry,
        `${objectDotPath}.environmentVariables.${index}`,
      );
    });
  }

  for (const argField of ['packageArguments', 'runtimeArguments'] as const) {
    if (!Object.hasOwn(value, argField)) {
      continue;
    }
    const args = value[argField];
    if (!Array.isArray(args)) {
      throw new TypeError(
        `MCP Registry server.json requires ${argField} to be an array at ` +
          `"${formatObjectDotPath(objectDotPath)}"`,
      );
    }
    args.forEach((entry, index) => {
      assertArgument(entry, `${objectDotPath}.${argField}.${index}`);
    });
  }
}

/**
 * Require that `doc` is a structurally valid {@link McpServerDocument}:
 * only ServerDetail fields, correctly typed, with `$schema` identifying
 * an MCP Registry `server.schema.json` document.
 *
 * Call at the entry of every public function that accepts
 * {@link McpServerDocument}.
 */
export function assertServerJsonSchema(
  doc: unknown,
): asserts doc is McpServerDocument {
  if (!isPlainObject(doc)) {
    throw new TypeError(
      'MCP Registry server.json requires a plain object document ' +
        `(received ${Array.isArray(doc) ? 'array' : typeof doc})`,
    );
  }

  assertNoUnknownKeys(doc, SERVER_DETAIL_KEYS, '');

  if (!Object.hasOwn(doc, '$schema')) {
    throw new TypeError(
      'MCP Registry server.json requires $schema to be a string whose URL ' +
        'basename is "server.schema.json"',
    );
  }
  assertServerSchemaUri(doc.$schema);

  for (const required of ['name', 'description', 'version'] as const) {
    if (!Object.hasOwn(doc, required)) {
      throw new TypeError(
        `MCP Registry server.json requires ${required} at "<root>"`,
      );
    }
    assertString(doc[required], required, '');
  }

  assertOptionalString(doc, 'title', '');
  assertOptionalString(doc, 'websiteUrl', '');

  if (doc.repository !== undefined && doc.repository !== null) {
    assertRepository(doc.repository, 'repository');
  }

  if (doc.remotes !== undefined && doc.remotes !== null) {
    if (!Array.isArray(doc.remotes)) {
      throw new TypeError(
        'MCP Registry server.json requires remotes to be an array at "<root>"',
      );
    }
    doc.remotes.forEach((remote, index) => {
      assertRemote(remote, `remotes.${index}`);
    });
  }

  if (doc.icons !== undefined && doc.icons !== null) {
    if (!Array.isArray(doc.icons)) {
      throw new TypeError(
        'MCP Registry server.json requires icons to be an array at "<root>"',
      );
    }
    doc.icons.forEach((icon, index) => {
      assertIcon(icon, `icons.${index}`);
    });
  }

  if (doc.packages !== undefined && doc.packages !== null) {
    if (!Array.isArray(doc.packages)) {
      throw new TypeError(
        'MCP Registry server.json requires packages to be an array at "<root>"',
      );
    }
    doc.packages.forEach((pkg, index) => {
      assertPackage(pkg, `packages.${index}`);
    });
  }

  if (doc._meta !== undefined && doc._meta !== null) {
    if (!isPlainObject(doc._meta)) {
      throw new TypeError(
        'MCP Registry server.json requires _meta to be an object at "<root>"',
      );
    }
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
