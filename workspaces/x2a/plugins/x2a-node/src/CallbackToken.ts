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

const HEX_64_PATTERN = /^[a-f0-9]{64}$/;

/** @public */
export class CallbackToken {
  readonly value: string;

  private constructor(value: string) {
    if (!HEX_64_PATTERN.test(value)) {
      throw new Error(
        'Invalid callback token: must be a 64-character hex string',
      );
    }
    this.value = value;
  }

  static from(raw: string): CallbackToken {
    return new CallbackToken(raw);
  }

  static generate(): CallbackToken {
    const hex = crypto.randomBytes(32).toString('hex');
    return new CallbackToken(hex);
  }

  sign(rawBody: Buffer): string {
    const hmac = crypto.createHmac('sha256', this.value);
    hmac.update(rawBody);
    return hmac.digest('hex');
  }

  validateSignature(rawBody: Buffer, providedSignature: string): boolean {
    if (!providedSignature) {
      return false;
    }

    const expectedSignature = this.sign(rawBody);

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

  equals(other: CallbackToken): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
