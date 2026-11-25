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
import type { Config } from '@backstage/config';

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ENCRYPTED_PREFIX = 'enc:';

/** Preferred dedicated config for MCP user-token encryption at rest. */
const DEDICATED_KEYS_PATH = 'intelligent-assistant.mcp.tokenEncryption.keys';
/** Legacy Backstage S2S keys — kept as a compatibility fallback. */
const LEGACY_KEYS_PATH = 'backend.auth.keys';

export interface DecryptResult {
  plaintext: string | null;
  needsReEncrypt: boolean;
}

export interface TokenEncryptor {
  encrypt(plaintext: string): string;
  decrypt(stored: string): DecryptResult;
  readonly enabled: boolean;
}

function deriveKey(secret: string): Buffer {
  return createHash('sha256').update(secret).digest();
}

function decryptWithKey(key: Buffer, stored: string): string {
  const combined = Buffer.from(stored.slice(ENCRYPTED_PREFIX.length), 'base64');
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    'utf8',
  );
}

function readKeySecrets(config: Config, path: string): string[] | undefined {
  const keys = config.getOptionalConfigArray(path);
  if (!keys?.length) {
    return undefined;
  }
  const secrets = keys
    .map(k => k.getOptionalString('secret'))
    .filter((s): s is string => !!s);
  return secrets.length > 0 ? secrets : undefined;
}

/**
 * Whether plaintext MCP token storage is allowed when no encryption keys are
 * configured. Explicit `allowPlaintext` wins; otherwise production
 * (`NODE_ENV === 'production'`) fails closed and other environments allow
 * plaintext for local/dev convenience.
 */
export function isPlaintextTokenStorageAllowed(config: Config): boolean {
  const explicit = config.getOptionalBoolean(
    'intelligent-assistant.mcp.tokenEncryption.allowPlaintext',
  );
  if (explicit !== undefined) {
    return explicit;
  }
  return process.env.NODE_ENV !== 'production';
}

class AesGcmEncryptor implements TokenEncryptor {
  readonly enabled = true;
  private readonly primaryKey: Buffer;
  private readonly allKeys: Buffer[];
  private readonly logger: LoggerService;

  constructor(secrets: string[], logger: LoggerService) {
    this.primaryKey = deriveKey(secrets[0]);
    this.allKeys = secrets.map(deriveKey);
    this.logger = logger;
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.primaryKey, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    const combined = Buffer.concat([iv, authTag, encrypted]);
    return `${ENCRYPTED_PREFIX}${combined.toString('base64')}`;
  }

  decrypt(stored: string): DecryptResult {
    if (!stored.startsWith(ENCRYPTED_PREFIX)) {
      this.logger.warn(
        'Found legacy plaintext token in database — it will be re-encrypted with the current key',
      );
      return { plaintext: stored, needsReEncrypt: true };
    }
    for (let i = 0; i < this.allKeys.length; i++) {
      try {
        const plaintext = decryptWithKey(this.allKeys[i], stored);
        if (i > 0) {
          this.logger.info(
            `Decrypted token using non-primary key at index ${i} — it will be re-encrypted with the primary key`,
          );
        }
        return { plaintext, needsReEncrypt: i > 0 };
      } catch {
        // Try the next key
      }
    }
    this.logger.error(
      'Failed to decrypt token with any configured key — token will be treated as missing',
    );
    return { plaintext: null, needsReEncrypt: false };
  }
}

class PlaintextPassthrough implements TokenEncryptor {
  readonly enabled = false;

  encrypt(plaintext: string): string {
    return plaintext;
  }

  decrypt(stored: string): DecryptResult {
    if (stored.startsWith(ENCRYPTED_PREFIX)) {
      return { plaintext: null, needsReEncrypt: false };
    }
    return { plaintext: stored, needsReEncrypt: false };
  }
}

export function createTokenEncryptor(
  config: Config,
  logger: LoggerService,
): TokenEncryptor {
  const dedicatedSecrets = readKeySecrets(config, DEDICATED_KEYS_PATH);
  const legacySecrets = readKeySecrets(config, LEGACY_KEYS_PATH);
  const secrets = dedicatedSecrets ?? legacySecrets;
  let source: string | undefined;
  if (dedicatedSecrets) {
    source = DEDICATED_KEYS_PATH;
  } else if (legacySecrets) {
    source = LEGACY_KEYS_PATH;
  }

  if (secrets && source) {
    logger.info(
      `Token encryption enabled — MCP user tokens will be encrypted at rest using ${source} (${secrets.length} key(s) configured)`,
    );
    return new AesGcmEncryptor(secrets, logger);
  }

  if (!isPlaintextTokenStorageAllowed(config)) {
    throw new Error(
      'MCP user token encryption is required: configure ' +
        `${DEDICATED_KEYS_PATH} (preferred) or ${LEGACY_KEYS_PATH}, ` +
        'or set intelligent-assistant.mcp.tokenEncryption.allowPlaintext: true ' +
        'to explicitly permit plaintext storage.',
    );
  }

  logger.warn(
    'Token encryption disabled — no encryption keys configured ' +
      `(tried ${DEDICATED_KEYS_PATH}, then ${LEGACY_KEYS_PATH}). ` +
      'MCP user tokens will be stored as plaintext. ' +
      `Configure ${DEDICATED_KEYS_PATH} (preferred) or ${LEGACY_KEYS_PATH} for production deployments.`,
  );
  return new PlaintextPassthrough();
}
