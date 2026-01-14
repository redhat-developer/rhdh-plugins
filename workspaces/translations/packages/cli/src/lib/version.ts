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

import fs from 'fs-extra';

function findVersion(): string {
  try {
    // Try to find package.json in multiple possible locations
    // Use process.cwd() and known package structure to avoid import.meta.url issues
    const possiblePaths = [
      // From package root (most common case)
      path.resolve(process.cwd(), 'package.json'),
      // From workspace root if running from translations workspace
      path.resolve(process.cwd(), '..', '..', 'package.json'),
      // From repo root if running from monorepo root
      path.resolve(
        process.cwd(),
        'workspaces/translations/packages/cli/package.json',
      ),
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
