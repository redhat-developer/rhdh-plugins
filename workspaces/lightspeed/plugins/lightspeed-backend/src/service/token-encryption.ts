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

export interface TokenEncryptor {
  encrypt(plaintext: string): string;
  decrypt(stored: string): string | null;
  readonly enabled: boolean;
}

function deriveKey(secret: string): Buffer {
  return createHash('sha256').update(secret).digest();
}

class AesGcmEncryptor implements TokenEncryptor {
  readonly enabled = true;
  private readonly key: Buffer;

  constructor(secret: string) {
    this.key = deriveKey(secret);
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv, {
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

  decrypt(stored: string): string | null {
    if (!stored.startsWith(ENCRYPTED_PREFIX)) {
      return null;
    }
    const combined = Buffer.from(
      stored.slice(ENCRYPTED_PREFIX.length),
      'base64',
    );
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, this.key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');
  }
}

class PlaintextPassthrough implements TokenEncryptor {
  readonly enabled = false;

  encrypt(plaintext: string): string {
    return plaintext;
  }

  decrypt(stored: string): string | null {
    if (stored.startsWith(ENCRYPTED_PREFIX)) {
      return null;
    }
    return stored;
  }
}

export function createTokenEncryptor(
  config: Config,
  logger: LoggerService,
): TokenEncryptor {
  const keys = config.getOptionalConfigArray('backend.auth.keys');
  const secret = keys?.[0]?.getOptionalString('secret');

  if (secret) {
    logger.info(
      'Token encryption enabled — MCP user tokens will be encrypted at rest using backend.auth.keys',
    );
    return new AesGcmEncryptor(secret);
  }

  logger.warn(
    'Token encryption disabled — backend.auth.keys not configured. ' +
      'MCP user tokens will be stored as plaintext. ' +
      'Configure backend.auth.keys for production deployments.',
  );
  return new PlaintextPassthrough();
}
