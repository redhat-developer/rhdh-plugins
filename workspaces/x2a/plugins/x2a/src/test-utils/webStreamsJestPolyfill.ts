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
/* Test env: polyfill Web Streams in Jest when globals are missing. */
/* eslint-disable no-restricted-imports */
import { TextDecoder, TextEncoder } from 'node:util';
import { ReadableStream } from 'node:stream/web';
/* eslint-enable no-restricted-imports */

if ((globalThis as { TextDecoder?: unknown }).TextDecoder === undefined) {
  (globalThis as { TextDecoder: unknown }).TextDecoder = TextDecoder;
}
if ((globalThis as { TextEncoder?: unknown }).TextEncoder === undefined) {
  (globalThis as { TextEncoder: unknown }).TextEncoder = TextEncoder;
}
if ((globalThis as { ReadableStream?: unknown }).ReadableStream === undefined) {
  (globalThis as { ReadableStream: unknown }).ReadableStream = ReadableStream;
}
