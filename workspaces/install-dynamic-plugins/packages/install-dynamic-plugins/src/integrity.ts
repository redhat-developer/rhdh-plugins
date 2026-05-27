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
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { InstallException } from './errors.js';
import { RECOGNIZED_ALGORITHMS, type Algorithm } from './types.js';

/**
 * Verify an NPM package archive matches the declared SRI-style integrity string.
 *
 * Uses streaming `createHash` so large archives never load into memory — safe
 * for the tight init-container memory budgets on OpenShift.
 */
export async function verifyIntegrity(
  pkg: string,
  archive: string,
  integrity: string,
): Promise<void> {
  const dash = integrity.indexOf('-');
  if (dash === -1) {
    throw new InstallException(
      `Package integrity for ${pkg} must be a string of the form <algorithm>-<hash>`,
    );
  }
  const algo = integrity.slice(0, dash);
  const expected = integrity.slice(dash + 1);

  if (!isRecognizedAlgorithm(algo)) {
    throw new InstallException(
      `${pkg}: Provided Package integrity algorithm ${algo} is not supported, ` +
        `please use one of following algorithms ${RECOGNIZED_ALGORITHMS.join(', ')} instead`,
    );
  }
  if (!isValidBase64(expected)) {
    throw new InstallException(
      `${pkg}: Provided Package integrity hash ${expected} is not a valid base64 encoding`,
    );
  }

  const hash = createHash(algo);
  await pipeline(createReadStream(archive), hash);
  const actual = hash.digest('base64');

  if (actual !== expected) {
    throw new InstallException(
      `${pkg}: integrity check failed — got ${algo}-${actual}, expected ${integrity}`,
    );
  }
}

function isRecognizedAlgorithm(value: string): value is Algorithm {
  return (RECOGNIZED_ALGORITHMS as readonly string[]).includes(value);
}

/**
 * Validate a base64 string without regex (avoids Sonar ReDoS flags and is
 * genuinely linear-time). Accepts the standard base64 alphabet plus up to two
 * trailing `=` padding characters; requires the round-trip encoding to match
 * so malformed padding is rejected.
 */
function isValidBase64(value: string): boolean {
  if (value.length === 0) return false;
  if (!isBase64Shape(value)) return false;
  try {
    const buf = Buffer.from(value, 'base64');
    return (
      stripTrailingEquals(buf.toString('base64')) === stripTrailingEquals(value)
    );
  } catch {
    return false;
  }
}

const EQUALS = 0x3d;

function isBase64Shape(value: string): boolean {
  let paddingCount = 0;
  for (let i = 0; i < value.length; i++) {
    const c = value.codePointAt(i) ?? 0;
    if (c === EQUALS) {
      paddingCount++;
      if (paddingCount > 2) return false;
      continue;
    }
    // Padding, once started, must run to the end of the string.
    if (paddingCount > 0) return false;
    if (!isBase64Char(c)) return false;
  }
  return true;
}

function isBase64Char(c: number): boolean {
  return (
    (c >= 0x41 && c <= 0x5a) || // A-Z
    (c >= 0x61 && c <= 0x7a) || // a-z
    (c >= 0x30 && c <= 0x39) || // 0-9
    c === 0x2b || // +
    c === 0x2f // /
  );
}

function stripTrailingEquals(s: string): string {
  let end = s.length;
  while (end > 0 && s.codePointAt(end - 1) === EQUALS) end--;
  return s.slice(0, end);
}
