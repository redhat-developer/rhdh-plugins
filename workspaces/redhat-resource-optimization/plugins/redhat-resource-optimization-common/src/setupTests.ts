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

import '@testing-library/jest-dom';
// eslint-disable-next-line no-restricted-imports
import { TextEncoder } from 'util';
// eslint-disable-next-line no-restricted-imports
import { BroadcastChannel } from 'worker_threads';
// eslint-disable-next-line no-restricted-imports
import { TransformStream } from 'stream/web';

// Also used in browser-based APIs for hashing.
Object.defineProperty(global.self, 'TextEncoder', {
  value: TextEncoder,
});

Object.defineProperty(global.self, 'BroadcastChannel', {
  value: BroadcastChannel,
});

Object.defineProperty(global.self, 'TransformStream', {
  value: TransformStream,
});
