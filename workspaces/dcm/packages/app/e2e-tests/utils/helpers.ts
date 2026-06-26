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

let counter = 0;

export const suffix = () => `${Date.now().toString(36).slice(-5)}-${counter++}`;

export const uniquePriority = () => {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return String((buf[0] % 900) + 50);
};

export const kebabToDisplayName = (name: string) =>
  name
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
