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

import path from 'node:path';

// Simplified paths for translations-cli
// Note: resolveOwn is not currently used, but kept for potential future use
export const paths = {
  targetDir: process.cwd(),
  resolveOwn: (relativePath: string) => {
    // Use process.cwd() as base since we're typically running from the package root
    // This avoids issues with import.meta.url in API report generation
    return path.resolve(process.cwd(), relativePath);
  },
};
