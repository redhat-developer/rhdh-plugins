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

/**
 * Find the project root by walking up the directory tree
 * Prefers .i18n.config.json at git root, otherwise uses the first one found
 */
function findProjectRoot(): string {
  // First, find git root
  let currentDir = process.cwd();
  const root = path.parse(currentDir).root;
  let gitRoot: string | null = null;

  while (currentDir !== root) {
    const gitDir = path.join(currentDir, '.git');
    if (fs.existsSync(gitDir)) {
      gitRoot = currentDir;
      break;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  // If we found a git root, check for config there first
  if (gitRoot) {
    const gitRootConfig = path.join(gitRoot, '.i18n.config.json');
    if (fs.existsSync(gitRootConfig)) {
      return gitRoot;
    }
  }

  // Otherwise, walk up from current directory looking for any .i18n.config.json
  currentDir = process.cwd();
  while (currentDir !== root) {
    const configFile = path.join(currentDir, '.i18n.config.json');
    if (fs.existsSync(configFile)) {
      return currentDir;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  // Fallback: use git root if found, otherwise current directory
  return gitRoot || process.cwd();
}

// Simplified paths for translations-cli
// Note: resolveOwn is not currently used, but kept for potential future use
export const paths = {
  targetDir: findProjectRoot(),
  resolveOwn: (relativePath: string) => {
    // Use project root as base
    return path.resolve(findProjectRoot(), relativePath);
  },
};
