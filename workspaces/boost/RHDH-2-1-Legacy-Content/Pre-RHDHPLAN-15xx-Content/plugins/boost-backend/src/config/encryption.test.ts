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

import { encryptValue, decryptValue } from './encryption';

describe('encryption', () => {
  const secret = 'test-encryption-secret-key';

  it('encrypts and decrypts a value roundtrip', () => {
    const plaintext = 'my-secret-token';
    const encrypted = encryptValue(plaintext, secret);
    const decrypted = decryptValue(encrypted, secret);
    expect(decrypted).toBe(plaintext);
  });

  it('produces different ciphertext for the same plaintext (random IV)', () => {
    const plaintext = 'my-secret-token';
    const encrypted1 = encryptValue(plaintext, secret);
    const encrypted2 = encryptValue(plaintext, secret);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it('handles empty string', () => {
    const encrypted = encryptValue('', secret);
    const decrypted = decryptValue(encrypted, secret);
    expect(decrypted).toBe('');
  });

  it('handles unicode strings', () => {
    const plaintext = 'hello world! \u2603 snowman';
    const encrypted = encryptValue(plaintext, secret);
    const decrypted = decryptValue(encrypted, secret);
    expect(decrypted).toBe(plaintext);
  });

  it('fails to decrypt with wrong secret', () => {
    const encrypted = encryptValue('my-secret', secret);
    expect(() => decryptValue(encrypted, 'wrong-secret')).toThrow();
  });

  it('fails to decrypt tampered data', () => {
    const encrypted = encryptValue('my-secret', secret);
    // Tamper with the base64 content
    const tampered = `${encrypted.slice(0, -4)}XXXX`;
    expect(() => decryptValue(tampered, secret)).toThrow();
  });
});
