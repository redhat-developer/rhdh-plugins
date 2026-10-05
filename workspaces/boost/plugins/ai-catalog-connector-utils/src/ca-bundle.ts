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

import { readFileSync } from 'node:fs';
import { Agent as HttpsAgent } from 'node:https';
import type { Config } from '@backstage/config';
import type { LoggerService } from '@backstage/backend-plugin-api';
import { safeGetOptionalString } from './config';

const PEM_HEADER = '-----BEGIN CERTIFICATE-----';
const PEM_FOOTER = '-----END CERTIFICATE-----';

/**
 * Load a CA bundle from the connector's Config subtree.
 *
 * Reads the CA from either `tls.caFile` (file path) or
 * `tls.caSecret.$env` (environment variable containing PEM content)
 * within the provided Config subtree. When both are set, `tls.caFile`
 * takes precedence and a WARN is logged that `tls.caSecret` is ignored.
 *
 * @param connectorConfig - The connector's Config subtree containing
 *   the `tls` block.
 * @param logger - Backstage LoggerService for structured logging.
 * @returns A Buffer containing the PEM-encoded CA certificate(s),
 *   or `undefined` if no CA is configured or an error occurs.
 *
 * @public
 */
export function loadCaBundle(
  connectorConfig: Config,
  logger: LoggerService,
): Buffer | undefined {
  const tlsConfig = connectorConfig.getOptionalConfig('tls');
  if (!tlsConfig) {
    // No tls block configured — use system CA bundle
    return undefined;
  }

  const caFile = safeGetOptionalString(tlsConfig, 'caFile');
  const caSecret = safeGetOptionalString(tlsConfig, 'caSecret');

  // Option 1: tls.caFile — takes precedence over tls.caSecret
  if (caFile) {
    if (caSecret) {
      logger.warn(
        'Both tls.caFile and tls.caSecret are set; using tls.caFile and ignoring tls.caSecret',
        { caFile },
      );
    }
    return loadCaFromFile(caFile, logger);
  }

  // Option 2: tls.caSecret.$env — read PEM from environment variable
  if (caSecret) {
    return loadCaFromEnvValue(caSecret, logger);
  }

  return undefined;
}

/**
 * Read a CA bundle from a file path.
 *
 * @internal
 */
function loadCaFromFile(
  filePath: string,
  logger: LoggerService,
): Buffer | undefined {
  try {
    const content = readFileSync(filePath);
    if (!isValidPem(content)) {
      logger.error('CA file does not contain valid PEM data', {
        caFile: filePath,
      });
      return undefined;
    }
    return content;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      logger.warn('CA file not found', { caFile: filePath });
    } else {
      logger.error('Failed to read CA file', {
        caFile: filePath,
        errorMessage: err.message,
      });
    }
    return undefined;
  }
}

/**
 * Parse PEM content from a resolved environment variable value.
 *
 * @internal
 */
function loadCaFromEnvValue(
  pemContent: string,
  logger: LoggerService,
): Buffer | undefined {
  if (!pemContent.trim()) {
    logger.warn('CA secret environment variable is empty');
    return undefined;
  }

  const buf = Buffer.from(pemContent, 'utf-8');
  if (!isValidPem(buf)) {
    logger.error('CA secret does not contain valid PEM data');
    return undefined;
  }
  return buf;
}

/**
 * Check whether a buffer contains at least one complete PEM certificate
 * block (matching BEGIN/END markers and equal block counts).
 *
 * @internal
 */
function isValidPem(content: Buffer): boolean {
  const text = content.toString('utf-8');
  if (!text.includes(PEM_HEADER) || !text.includes(PEM_FOOTER)) {
    return false;
  }
  const beginCount = text.split(PEM_HEADER).length - 1;
  const endCount = text.split(PEM_FOOTER).length - 1;
  return beginCount > 0 && beginCount === endCount;
}

/**
 * Create an `https.Agent` configured with a custom CA bundle.
 *
 * When `caBundle` is provided, Node replaces the default Mozilla CA
 * store with that bundle. Concatenate PEMs if both public and private
 * CAs must be trusted.
 *
 * @param caBundle - A Buffer containing PEM-encoded CA certificates,
 *   or `undefined` to use the system default.
 * @returns An `https.Agent` with the custom CA, or `undefined` if
 *   no CA bundle was provided.
 *
 * @public
 */
export function createHttpsAgent(caBundle?: Buffer): HttpsAgent | undefined {
  if (!caBundle) {
    return undefined;
  }
  return new HttpsAgent({ ca: caBundle, rejectUnauthorized: true });
}
