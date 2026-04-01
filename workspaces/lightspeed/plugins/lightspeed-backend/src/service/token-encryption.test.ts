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

      const decrypted = encryptor.decrypt(encrypted);
      expect(decrypted).toBe(input);
    });

    it('produces different ciphertext for the same plaintext', () => {
      const encryptor = createTokenEncryptor(config, mockLogger);
      const input = 'same-val';
      const enc1 = encryptor.encrypt(input);
      const enc2 = encryptor.encrypt(input);

      expect(enc1).not.toBe(enc2);
      expect(encryptor.decrypt(enc1)).toBe(input);
      expect(encryptor.decrypt(enc2)).toBe(input);
    });

    it('returns null when decrypting a non-prefixed string (plaintext legacy)', () => {
      const encryptor = createTokenEncryptor(config, mockLogger);
      expect(encryptor.decrypt('plain-text')).toBeNull();
    });

    it('handles empty string', () => {
      const encryptor = createTokenEncryptor(config, mockLogger);
      const encrypted = encryptor.encrypt('');
      expect(encryptor.decrypt(encrypted)).toBe('');
    });

    it('handles unicode values', () => {
      const encryptor = createTokenEncryptor(config, mockLogger);
      const input = 'caf\u00e9-\u00fcber';
      const encrypted = encryptor.encrypt(input);
      expect(encryptor.decrypt(encrypted)).toBe(input);
    });

    it('throws on tampered ciphertext', () => {
      const encryptor = createTokenEncryptor(config, mockLogger);
      const encrypted = encryptor.encrypt('hello');
      const tampered = `${encrypted.slice(0, -2)}XX`;
      expect(() => encryptor.decrypt(tampered)).toThrow();
    });

    it('cannot decrypt with a different key', () => {
      const encryptor1 = createTokenEncryptor(config, mockLogger);
      const config2 = new ConfigReader({
        backend: {
          auth: { keys: [{ secret: 'EXAMPLE-alt-EXAMPLE-alt-EXAMPLE!' }] }, // notsecret
        },
      });
      const encryptor2 = createTokenEncryptor(config2, mockLogger);

      const encrypted = encryptor1.encrypt('hello');
      expect(() => encryptor2.decrypt(encrypted)).toThrow();
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
      expect(encryptor.decrypt(input)).toBe(input);
    });

    it('returns null when encountering an encrypted value (no key to decrypt)', () => {
      const encryptor = createTokenEncryptor(config, mockLogger);
      expect(encryptor.decrypt('enc:somedata')).toBeNull();
    });
  });
});
