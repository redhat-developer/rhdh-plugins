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
import { fileURLToPath } from 'url';

import fs from 'fs-extra';

function findVersion(): string {
  try {
    // Try to find package.json relative to this file
    // When built, this will be in dist/lib/version.js
    // When running from bin, we need to go up to the repo root
    const __filename = fileURLToPath(import.meta.url);
    // eslint-disable-next-line no-restricted-syntax
    const __dirname = path.dirname(__filename);

    // Try multiple possible locations
    const possiblePaths = [
      // eslint-disable-next-line no-restricted-syntax
      path.resolve(__dirname, '..', '..', 'package.json'), // dist/lib -> dist -> repo root
      // eslint-disable-next-line no-restricted-syntax
      path.resolve(__dirname, '..', '..', '..', 'package.json'), // dist/lib -> dist -> repo root (alternative)
      path.resolve(process.cwd(), 'package.json'), // Current working directory
    ];

    for (const pkgPath of possiblePaths) {
      if (fs.existsSync(pkgPath)) {
        const pkgContent = fs.readFileSync(pkgPath, 'utf8');
        return JSON.parse(pkgContent).version;
      }
    }

    // Fallback version if package.json not found
    return '0.1.0';
  } catch {
    // Fallback version on error
    return '0.1.0';
  }
}

export const version = findVersion();
