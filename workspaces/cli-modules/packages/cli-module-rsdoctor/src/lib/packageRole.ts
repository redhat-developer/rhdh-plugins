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
import fs from 'node:fs';
import path from 'node:path';
import { targetPaths } from '@backstage/cli-common';

/** Reads the Backstage role of the package in the current directory. */
export function readPackageRole(): string | undefined {
  const packageJsonPath = path.resolve(targetPaths.dir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.backstage?.role;
}

const FRONTEND_ROLES = [
  'frontend',
  'frontend-plugin',
  'frontend-plugin-module',
  'web-library',
];

/** Fails unless the current package is one the Backstage CLI bundles with Rspack. */
export function assertFrontendRole(command: string): string {
  const role = readPackageRole();
  if (!role || !FRONTEND_ROLES.includes(role)) {
    throw new Error(
      `${command} only supports frontend packages (roles ${FRONTEND_ROLES.join(
        ', ',
      )}), but the package in ${targetPaths.dir} has role '${role ?? 'none'}'`,
    );
  }
  return role;
}
