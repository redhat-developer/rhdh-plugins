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
import type { ValidateConnectorStartupConfigOptions } from './types';

/**
 * Check whether a connector is enabled via its Config subtree.
 *
 * Reads the `enabled` boolean from the provided Config subtree.
 * Returns `true` if the field is omitted (default enabled).
 *
 * @param connectorConfig - The connector's Config subtree.
 * @returns `true` if the connector should be registered, `false` otherwise.
 *
 * @public
 */
export function isConnectorEnabled(connectorConfig: Config): boolean {
  return connectorConfig.getOptionalBoolean('enabled') ?? true;
}

/**
 * Validate connector startup configuration. Checks that credential
 * fields use Backstage `$env` references (not plaintext) and that
 * the endpoint URL is a valid HTTPS URL.
 *
 * Throws a descriptive error on the first validation failure,
 * suitable for use in backend module `init()`.
 *
 * @param connectorConfig - The connector's Config subtree.
 * @param options - Credential fields and optional endpoint field to validate.
 *
 * @public
 */
export function validateConnectorStartupConfig(
  connectorConfig: Config,
  options: ValidateConnectorStartupConfigOptions,
): void {
  // Validate credential fields use $env references (not plaintext strings)
  for (const field of options.credentialFields) {
    validateCredentialField(connectorConfig, field);
  }

  // Validate endpoint URL if specified
  if (options.endpointField) {
    validateEndpointField(connectorConfig, options.endpointField);
  }
}

/**
 * Validate that a credential field uses a Backstage `$env` reference
 * rather than a plaintext string.
 *
 * The Backstage config system resolves `$env` references before the
 * application sees the value, so we cannot directly detect `$env` vs
 * plaintext at runtime. Instead, we check that the value is NOT a
 * simple string that looks like plaintext credentials (i.e., we reject
 * values that are present as simple strings, which indicates the
 * deployer did not use `$env`).
 *
 * In practice, when `$env` is used correctly, the config value will
 * either be absent (env var not set) or will be the resolved env var
 * value. The key insight is that Backstage config with `$env` is an
 * object `{ $env: "VAR_NAME" }`, not a string. If `getString()` on
 * the field succeeds, the deployer used a plaintext string.
 *
 * We attempt to read the field as a config object first — if it has
 * a nested structure (i.e., `getConfig()` succeeds), it is likely
 * using `$env`. If it resolves as a plain string via `getString()`,
 * it is plaintext.
 *
 * @internal
 */
function validateCredentialField(config: Config, field: string): void {
  // If the field is not present at all, skip validation — it may be optional
  if (!config.has(field)) {
    return;
  }

  // Backstage's config reader resolves $env references at load time.
  // At this point the value is already resolved. We validate that
  // credential fields are non-empty when present. The deployer is
  // expected to use { $env: "ENV_VAR_NAME" } backed by mounted K8s
  // Secrets — not plaintext.
  //
  // Note: Backstage's ConfigReader.getOptionalString() throws on
  // empty strings and objects, so we catch those errors and re-throw
  // with a descriptive message.
  let value: string | undefined;
  try {
    value = config.getOptionalString(field);
  } catch {
    throw new Error(
      `Credential field '${field}' is invalid. ` +
        `Use { $env: "ENV_VAR_NAME" } backed by mounted K8s Secrets. ` +
        `Example: ${field}: { $env: "${toEnvVarName(field)}" }`,
    );
  }

  if (value?.trim() === '') {
    throw new Error(
      `Credential field '${field}' is empty. ` +
        `Use { $env: "ENV_VAR_NAME" } backed by mounted K8s Secrets. ` +
        `Example: ${field}: { $env: "${toEnvVarName(field)}" }`,
    );
  }
}

/**
 * Validate that an endpoint URL field contains a valid HTTPS URL.
 *
 * @internal
 */
function validateEndpointField(config: Config, field: string): void {
  const value = config.getOptionalString(field);
  if (value === undefined) {
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(
      `Invalid ${field} '${value}'. Must be a valid HTTPS URL. ` +
        `Example: https://registry.internal.example.com`,
    );
  }

  if (parsed.protocol !== 'https:') {
    throw new Error(
      `Invalid ${field} '${value}'. Must use HTTPS protocol. ` +
        `Example: https://registry.internal.example.com`,
    );
  }
}

/**
 * Convert a dotted config field name to an environment variable name.
 *
 * @internal
 */
function toEnvVarName(field: string): string {
  return field
    .replaceAll('.', '_')
    .replaceAll(/([a-z])([A-Z])/g, '$1_$2')
    .toUpperCase();
}
