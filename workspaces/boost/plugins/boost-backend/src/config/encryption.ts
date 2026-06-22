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

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Derives a 32-byte encryption key from a secret string.
 * Uses SHA-256 to normalize any-length secret to a fixed key size.
 *
 * @internal
 */
function deriveKey(secret: string): Buffer {
  // Use dynamic import-style for crypto to keep it synchronous
  const { createHash } = require('crypto');
  return createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 *
 * The output format is: `base64(iv + ciphertext + authTag)`
 *
 * @param plaintext - The value to encrypt.
 * @param secret - The encryption secret (will be derived to a 256-bit key).
 * @returns The encrypted value as a base64-encoded string.
 *
 * @public
 */
export function encryptValue(plaintext: string, secret: string): string {
  const key = deriveKey(secret);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Pack: iv + ciphertext + authTag
  const packed = Buffer.concat([iv, encrypted, authTag]);
  return packed.toString('base64');
}

/**
 * Decrypts a value that was encrypted with {@link encryptValue}.
 *
 * @param encrypted - The base64-encoded encrypted value.
 * @param secret - The same encryption secret used for encryption.
 * @returns The decrypted plaintext string.
 * @throws Error if decryption fails (wrong key, tampered data, etc.)
 *
 * @public
 */
export function decryptValue(encrypted: string, secret: string): string {
  const key = deriveKey(secret);
  const packed = Buffer.from(encrypted, 'base64');

  const iv = packed.subarray(0, IV_LENGTH);
  const authTag = packed.subarray(packed.length - AUTH_TAG_LENGTH);
  const ciphertext = packed.subarray(
    IV_LENGTH,
    packed.length - AUTH_TAG_LENGTH,
  );

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}
