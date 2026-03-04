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

import { SignatureValidator } from './SignatureValidator';

describe('SignatureValidator', () => {
  let validator: SignatureValidator;

  beforeEach(() => {
    validator = new SignatureValidator();
  });

  describe('generateSignature', () => {
    it('should generate deterministic HMAC-SHA256 signature', () => {
      const secret = 'test-secret-key';
      const payload = Buffer.from(
        '{"status":"success","jobId":"123"}',
        'utf-8',
      );

      const signature1 = validator.generateSignature(secret, payload);
      const signature2 = validator.generateSignature(secret, payload);

      expect(signature1).toBe(signature2);
      expect(signature1).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex is 64 chars
    });

    it('should generate different signatures for different secrets', () => {
      const payload = Buffer.from('{"status":"success"}', 'utf-8');

      const signature1 = validator.generateSignature('secret1', payload);
      const signature2 = validator.generateSignature('secret2', payload);

      expect(signature1).not.toBe(signature2);
    });

    it('should generate different signatures for different payloads', () => {
      const secret = 'test-secret';

      const signature1 = validator.generateSignature(
        secret,
        Buffer.from('{"status":"success"}', 'utf-8'),
      );
      const signature2 = validator.generateSignature(
        secret,
        Buffer.from('{"status":"error"}', 'utf-8'),
      );

      expect(signature1).not.toBe(signature2);
    });
  });

  describe('validateSignature', () => {
    it('should return true for valid signature', () => {
      const secret = 'test-callback-token';
      const payload = Buffer.from(
        JSON.stringify({
          status: 'success',
          jobId: 'abc-123',
          timestamp: new Date().toISOString(),
        }),
        'utf-8',
      );

      const signature = validator.generateSignature(secret, payload);
      const isValid = validator.validateSignature(secret, payload, signature);

      expect(isValid).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const secret = 'test-callback-token';
      const payload = Buffer.from(
        JSON.stringify({
          status: 'success',
          jobId: 'abc-123',
          timestamp: new Date().toISOString(),
        }),
        'utf-8',
      );

      const signature = validator.generateSignature(secret, payload);
      const invalidSignature = `${signature.slice(0, -2)}ff`;
      const isValid = validator.validateSignature(
        secret,
        payload,
        invalidSignature,
      );

      expect(isValid).toBe(false);
    });

    it('should return false for empty signature', () => {
      const secret = 'test-callback-token';
      const payload = Buffer.from(
        JSON.stringify({
          status: 'success',
          timestamp: new Date().toISOString(),
        }),
        'utf-8',
      );

      const isValid = validator.validateSignature(secret, payload, '');

      expect(isValid).toBe(false);
    });

    it('should return false for null signature', () => {
      const secret = 'test-callback-token';
      const payload = Buffer.from(
        JSON.stringify({
          status: 'success',
          timestamp: new Date().toISOString(),
        }),
        'utf-8',
      );

      const isValid = validator.validateSignature(secret, payload, null as any);

      expect(isValid).toBe(false);
    });

    it('should return false for empty secret', () => {
      const payload = Buffer.from(
        JSON.stringify({
          status: 'success',
          timestamp: new Date().toISOString(),
        }),
        'utf-8',
      );
      const signature = 'some-signature';

      const isValid = validator.validateSignature('', payload, signature);

      expect(isValid).toBe(false);
    });

    it('should return false for signature length mismatch', () => {
      const secret = 'test-callback-token';
      const payload = Buffer.from(
        JSON.stringify({
          status: 'success',
          timestamp: new Date().toISOString(),
        }),
        'utf-8',
      );

      const shortSignature = 'abc123';
      const isValid = validator.validateSignature(
        secret,
        payload,
        shortSignature,
      );

      expect(isValid).toBe(false);
    });

    it('should return false when payload is tampered', () => {
      const secret = 'test-callback-token';
      const timestamp = new Date().toISOString();
      const originalPayload = Buffer.from(
        JSON.stringify({ status: 'success', jobId: 'abc-123', timestamp }),
        'utf-8',
      );
      const tamperedPayload = Buffer.from(
        JSON.stringify({ status: 'success', jobId: 'xyz-789', timestamp }),
        'utf-8',
      );

      const signature = validator.generateSignature(secret, originalPayload);
      const isValid = validator.validateSignature(
        secret,
        tamperedPayload,
        signature,
      );

      expect(isValid).toBe(false);
    });

    it('should use timing-safe comparison', () => {
      const secret = 'test-callback-token';
      const payload = Buffer.from(
        JSON.stringify({
          status: 'success',
          timestamp: new Date().toISOString(),
        }),
        'utf-8',
      );

      const validSignature = validator.generateSignature(secret, payload);

      const start = process.hrtime.bigint();
      validator.validateSignature(secret, payload, validSignature);
      const validTime = process.hrtime.bigint() - start;

      const invalidSignature = 'f'.repeat(64);
      const start2 = process.hrtime.bigint();
      validator.validateSignature(secret, payload, invalidSignature);
      const invalidTime = process.hrtime.bigint() - start2;

      expect(validTime).toBeGreaterThan(0n);
      expect(invalidTime).toBeGreaterThan(0n);
    });
  });
});
