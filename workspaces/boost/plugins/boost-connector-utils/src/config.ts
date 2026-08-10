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
 * Safely read an optional string from a Backstage Config object.
 *
 * `ConfigReader.getOptionalString()` throws `TypeError` for empty-string
 * values from env var substitution like `${VAR:-}`, rather than returning
 * `undefined`. Catch that case and treat it as absent.
 *
 * @param config - Backstage Config (or Config subtree).
 * @param key - Config key relative to `config`.
 * @returns The string value, or `undefined` when missing or empty.
 *
 * @public
 */
export function safeGetOptionalString(
  config: Config,
  key: string,
): string | undefined {
  try {
    return config.getOptionalString(key);
  } catch {
    // ConfigReader throws TypeError for empty-string values
    // from env var substitution like ${VAR:-}
    return undefined;
  }
}

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
 * fields are non-empty when present and that the endpoint URL is a
 * valid HTTPS URL. Prefer backing credentials with
 * `{ $env: "ENV_VAR_NAME" }` mounted from K8s Secrets — Backstage
 * resolves `$env` at config-load time, so this function cannot
 * distinguish plaintext from resolved secret values.
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
  // Validate credential fields are non-empty when present
  for (const field of options.credentialFields) {
    validateCredentialField(connectorConfig, field);
  }

  // Validate endpoint URL if specified
  if (options.endpointField) {
    validateEndpointField(connectorConfig, options.endpointField);
  }
}

/**
 * Validate that a credential field is non-empty when present.
 *
 * Backstage resolves `$env` references at config-load time, so
 * runtime code only sees the resolved string value.  We validate
 * that the value is present and non-empty; the deployer is expected
 * to back credential fields with `{ $env: "ENV_VAR_NAME" }` mounted
 * from K8s Secrets.
 *
 * @internal
 */
function validateCredentialField(config: Config, field: string): void {
  // If the field is not present at all, skip validation — it may be optional
  if (!config.has(field)) {
    return;
  }

  const invalidCredentialError = () =>
    new Error(
      `Credential field '${field}' is invalid. ` +
        `Use { $env: "ENV_VAR_NAME" } backed by mounted K8s Secrets. ` +
        `Example: ${field}: { $env: "${toEnvVarName(field)}" }`,
    );

  // Backstage's ConfigReader.getOptionalString() throws on empty
  // strings and object values, so we catch and re-throw with a
  // descriptive message pointing the deployer to $env usage.
  let value: string | undefined;
  try {
    value = config.getOptionalString(field);
  } catch {
    throw invalidCredentialError();
  }

  if (value !== undefined && value.trim() === '') {
    throw invalidCredentialError();
  }
}

/**
 * Validate that an endpoint URL field contains a valid HTTPS URL.
 *
 * Unlike soft optional reads via {@link safeGetOptionalString}, a present
 * but empty or wrong-typed value fails startup validation so misconfigured
 * connectors do not silently skip the check.
 *
 * @internal
 */
function validateEndpointField(config: Config, field: string): void {
  // If the field is not present at all, skip validation — it may be optional
  if (!config.has(field)) {
    return;
  }

  const invalidEndpointError = (detail: string) =>
    new Error(
      `Invalid ${field}: ${detail}. Must be a valid HTTPS URL. ` +
        `Example: https://registry.internal.example.com`,
    );

  // ConfigReader throws on empty strings and non-string values; rethrow as
  // a descriptive startup error rather than treating them as "absent".
  let value: string | undefined;
  try {
    value = config.getOptionalString(field);
  } catch {
    throw invalidEndpointError(
      'value is empty or not a string (check env substitution and YAML type)',
    );
  }

  if (value === undefined || value.trim() === '') {
    throw invalidEndpointError('value is empty');
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
