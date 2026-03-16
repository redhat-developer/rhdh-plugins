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

import crypto from 'node:crypto';

/**
 * HMAC-SHA256 signature validator for securing callback endpoints
 */
export class SignatureValidator {
  /**
   * Generate HMAC-SHA256 signature from raw body bytes
   * @param secret - The secret key (callbackToken)
   * @param rawBody - Raw body buffer
   * @returns Hex-encoded HMAC signature
   */
  generateSignature(secret: string, rawBody: Buffer): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody);
    return hmac.digest('hex');
  }

  /**
   * Validate HMAC-SHA256 signature using timing-safe comparison
   * @param secret - The secret key (callbackToken)
   * @param rawBody - Raw body buffer
   * @param providedSignature - The signature to validate
   * @returns true if signature is valid, false otherwise
   */
  validateSignature(
    secret: string,
    rawBody: Buffer,
    providedSignature: string,
  ): boolean {
    if (!providedSignature || !secret) {
      return false;
    }

    const expectedSignature = this.generateSignature(secret, rawBody);

    if (expectedSignature.length !== providedSignature.length) {
      return false;
    }

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const providedBuffer = Buffer.from(providedSignature, 'hex');

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  }
}
