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

import { CallbackToken } from './CallbackToken';

describe('CallbackToken', () => {
  describe('from', () => {
    it('accepts a valid 64-char lowercase hex string', () => {
      const hex = 'a'.repeat(64);
      const token = CallbackToken.from(hex);
      expect(token.value).toBe(hex);
    });

    it('rejects strings shorter than 64 characters', () => {
      expect(() => CallbackToken.from('abcdef')).toThrow(
        'Invalid callback token: must be a 64-character hex string',
      );
    });

    it('rejects strings longer than 64 characters', () => {
      expect(() => CallbackToken.from('a'.repeat(65))).toThrow(
        'Invalid callback token: must be a 64-character hex string',
      );
    });

    it('rejects uppercase hex characters', () => {
      expect(() => CallbackToken.from('A'.repeat(64))).toThrow(
        'Invalid callback token: must be a 64-character hex string',
      );
    });

    it('rejects non-hex characters', () => {
      expect(() => CallbackToken.from('g'.repeat(64))).toThrow(
        'Invalid callback token: must be a 64-character hex string',
      );
    });

    it('rejects empty string', () => {
      expect(() => CallbackToken.from('')).toThrow(
        'Invalid callback token: must be a 64-character hex string',
      );
    });
  });

  describe('generate', () => {
    it('returns a valid CallbackToken', () => {
      const token = CallbackToken.generate();
      expect(token.value).toMatch(/^[a-f0-9]{64}$/);
    });

    it('returns different tokens each call', () => {
      const token1 = CallbackToken.generate();
      const token2 = CallbackToken.generate();
      expect(token1.value).not.toBe(token2.value);
    });
  });

  describe('sign', () => {
    it('produces a deterministic HMAC-SHA256 hex signature', () => {
      const token = CallbackToken.from('a'.repeat(64));
      const payload = Buffer.from('{"status":"success"}', 'utf-8');

      const sig1 = token.sign(payload);
      const sig2 = token.sign(payload);

      expect(sig1).toBe(sig2);
      expect(sig1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('produces different signatures for different payloads', () => {
      const token = CallbackToken.from('a'.repeat(64));

      const sig1 = token.sign(Buffer.from('payload1', 'utf-8'));
      const sig2 = token.sign(Buffer.from('payload2', 'utf-8'));

      expect(sig1).not.toBe(sig2);
    });
  });

  describe('validateSignature', () => {
    const token = CallbackToken.from('b'.repeat(64));
    const payload = Buffer.from(
      JSON.stringify({ status: 'success', jobId: 'abc-123' }),
      'utf-8',
    );

    it('returns true for a valid signature', () => {
      const signature = token.sign(payload);
      expect(token.validateSignature(payload, signature)).toBe(true);
    });

    it('returns false for an invalid signature', () => {
      const signature = token.sign(payload);
      const tampered = `${signature.slice(0, -2)}ff`;
      expect(token.validateSignature(payload, tampered)).toBe(false);
    });

    it('returns false for an empty signature', () => {
      expect(token.validateSignature(payload, '')).toBe(false);
    });

    it('returns false for a null signature', () => {
      expect(token.validateSignature(payload, null as any)).toBe(false);
    });

    it('returns false for a tampered payload', () => {
      const signature = token.sign(payload);
      const tampered = Buffer.from(
        JSON.stringify({ status: 'error', jobId: 'abc-123' }),
        'utf-8',
      );
      expect(token.validateSignature(tampered, signature)).toBe(false);
    });

    it('returns false for a signature with length mismatch', () => {
      expect(token.validateSignature(payload, 'abc123')).toBe(false);
    });
  });

  describe('equals', () => {
    it('returns true for tokens with the same value', () => {
      const hex = 'c'.repeat(64);
      const token1 = CallbackToken.from(hex);
      const token2 = CallbackToken.from(hex);
      expect(token1.equals(token2)).toBe(true);
    });

    it('returns false for tokens with different values', () => {
      const token1 = CallbackToken.from('a'.repeat(64));
      const token2 = CallbackToken.from('b'.repeat(64));
      expect(token1.equals(token2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('returns the hex value', () => {
      const hex = 'd'.repeat(64);
      const token = CallbackToken.from(hex);
      expect(token.toString()).toBe(hex);
    });
  });
});
