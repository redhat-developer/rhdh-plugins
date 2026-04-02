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

import { ConfigReader } from '@backstage/config';

import { createTokenEncryptor } from './token-encryption';

const mockLogger =
  /** @type {import('@backstage/backend-plugin-api').LoggerService} */ {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };

describe('createTokenEncryptor', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('with backend.auth.keys configured', () => {
    const config = new ConfigReader({
      backend: {
        auth: {
          keys: [{ secret: 'EXAMPLE-key-EXAMPLE-key-EXAMPLE!' }], // notsecret
        },
      },
    });

    it('creates an enabled encryptor', () => {
      const encryptor = createTokenEncryptor(config, mockLogger);
      expect(encryptor.enabled).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Token encryption enabled'),
      );
    });

    it('encrypts and decrypts a round-trip', () => {
      const encryptor = createTokenEncryptor(config, mockLogger);
      const input = 'EXAMPLE-value'; // notsecret
      const encrypted = encryptor.encrypt(input);

      expect(encrypted).not.toBe(input);
      expect(encrypted.startsWith('enc:')).toBe(true);

      const result = encryptor.decrypt(encrypted);
      expect(result.plaintext).toBe(input);
      expect(result.needsReEncrypt).toBe(false);
    });

    it('produces different ciphertext for the same plaintext', () => {
      const encryptor = createTokenEncryptor(config, mockLogger);
      const input = 'same-val';
      const enc1 = encryptor.encrypt(input);
      const enc2 = encryptor.encrypt(input);

      expect(enc1).not.toBe(enc2);
      expect(encryptor.decrypt(enc1).plaintext).toBe(input);
      expect(encryptor.decrypt(enc2).plaintext).toBe(input);
    });

    it('returns legacy plaintext as-is and signals re-encryption needed', () => {
      const encryptor = createTokenEncryptor(config, mockLogger);
      const result = encryptor.decrypt('plain-text');
      expect(result.plaintext).toBe('plain-text');
      expect(result.needsReEncrypt).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('legacy plaintext token'),
      );
    });

    it('handles empty string', () => {
      const encryptor = createTokenEncryptor(config, mockLogger);
      const encrypted = encryptor.encrypt('');
      expect(encryptor.decrypt(encrypted).plaintext).toBe('');
    });

    it('handles unicode values', () => {
      const encryptor = createTokenEncryptor(config, mockLogger);
      const input = 'caf\u00e9-\u00fcber';
      const encrypted = encryptor.encrypt(input);
      expect(encryptor.decrypt(encrypted).plaintext).toBe(input);
    });

    it('returns null for corrupted ciphertext instead of throwing', () => {
      const encryptor = createTokenEncryptor(config, mockLogger);
      const encrypted = encryptor.encrypt('hello');
      const tampered = `${encrypted.slice(0, -2)}XX`;
      const result = encryptor.decrypt(tampered);
      expect(result.plaintext).toBeNull();
      expect(result.needsReEncrypt).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to decrypt token'),
      );
    });
  });

  describe('key rotation', () => {
    const oldSecret = 'EXAMPLE-old-EXAMPLE-old-EXAMPLE!'; // notsecret
    const newSecret = 'EXAMPLE-new-EXAMPLE-new-EXAMPLE!'; // notsecret

    it('decrypts tokens encrypted with an older key and signals re-encryption', () => {
      const oldEncryptor = createTokenEncryptor(
        new ConfigReader({
          backend: { auth: { keys: [{ secret: oldSecret }] } },
        }),
        mockLogger,
      );
      const encrypted = oldEncryptor.encrypt('hello');

      const rotatedEncryptor = createTokenEncryptor(
        new ConfigReader({
          backend: {
            auth: {
              keys: [{ secret: newSecret }, { secret: oldSecret }],
            },
          },
        }),
        mockLogger,
      );
      const result = rotatedEncryptor.decrypt(encrypted);
      expect(result.plaintext).toBe('hello');
      expect(result.needsReEncrypt).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('non-primary key at index 1'),
      );
    });

    it('encrypts with the primary (first) key', () => {
      const rotatedEncryptor = createTokenEncryptor(
        new ConfigReader({
          backend: {
            auth: {
              keys: [{ secret: newSecret }, { secret: oldSecret }],
            },
          },
        }),
        mockLogger,
      );
      const encrypted = rotatedEncryptor.encrypt('hello');

      const newOnlyEncryptor = createTokenEncryptor(
        new ConfigReader({
          backend: { auth: { keys: [{ secret: newSecret }] } },
        }),
        mockLogger,
      );
      const result = newOnlyEncryptor.decrypt(encrypted);
      expect(result.plaintext).toBe('hello');
      expect(result.needsReEncrypt).toBe(false);
    });

    it('returns null when no key can decrypt', () => {
      const encryptor = createTokenEncryptor(
        new ConfigReader({
          backend: { auth: { keys: [{ secret: oldSecret }] } },
        }),
        mockLogger,
      );
      const encrypted = encryptor.encrypt('hello');

      const wrongEncryptor = createTokenEncryptor(
        new ConfigReader({
          backend: { auth: { keys: [{ secret: newSecret }] } },
        }),
        mockLogger,
      );
      const result = wrongEncryptor.decrypt(encrypted);
      expect(result.plaintext).toBeNull();
      expect(result.needsReEncrypt).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to decrypt token with any configured key',
        ),
      );
    });
  });

  describe('without backend.auth.keys (plaintext fallback)', () => {
    const config = new ConfigReader({});

    it('creates a disabled encryptor', () => {
      const encryptor = createTokenEncryptor(config, mockLogger);
      expect(encryptor.enabled).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Token encryption disabled'),
      );
    });

    it('passes through plaintext unchanged', () => {
      const encryptor = createTokenEncryptor(config, mockLogger);
      const input = 'plain-val';
      expect(encryptor.encrypt(input)).toBe(input);
      const result = encryptor.decrypt(input);
      expect(result.plaintext).toBe(input);
      expect(result.needsReEncrypt).toBe(false);
    });

    it('returns null when encountering an encrypted value (no key to decrypt)', () => {
      const encryptor = createTokenEncryptor(config, mockLogger);
      const result = encryptor.decrypt('enc:somedata');
      expect(result.plaintext).toBeNull();
      expect(result.needsReEncrypt).toBe(false);
    });
  });
});
