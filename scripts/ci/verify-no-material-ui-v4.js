#!/usr/bin/env node
/*
 * Verifies that no workspace package.json declares a direct @material-ui/*
 * dependency outside the temporary migration allowlist.
 *
 * Lockfiles are not scanned because many workspaces still resolve Material UI
 * v4 transitively through Backstage dependencies. Once upstream removes those
 * transitive packages, lockfile validation can be added here.
 *
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

import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ALTERNATIVE_MESSAGE =
  'Material UI v4 (@material-ui/*) is deprecated. Use @mui/* (MUI v5), Backstage UI (@backstage/ui), or Canon design system instead.';

const IGNORED_PATH_SEGMENTS = new Set([
  'node_modules',
  'dist',
  'dist-dynamic',
  // Local dynamic-plugin install roots created during rhdh-local development.
  'dynamic-plugins-root',
]);

const repoRoot = join(import.meta.dirname, '..', '..');
const allowlistPath = join(
  import.meta.dirname,
  'material-ui-v4-allowlist.json',
);

async function loadAllowlist() {
  const content = await readFile(allowlistPath, 'utf8');
  const parsed = JSON.parse(content);
  return new Set(parsed.allowedPackageJsonPaths);
}

async function walkPackageJsonFiles(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORED_PATH_SEGMENTS.has(entry.name)) {
      continue;
    }

    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await walkPackageJsonFiles(fullPath, files);
      continue;
    }

    if (entry.isFile() && entry.name === 'package.json') {
      files.push(fullPath);
    }
  }

  return files;
}

function collectDependencies(packageJson) {
  return {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
    ...packageJson.peerDependencies,
    ...packageJson.optionalDependencies,
  };
}

async function checkPackageJsonFiles(allowlist) {
  const workspacesDir = join(repoRoot, 'workspaces');
  const packageJsonFiles = await walkPackageJsonFiles(workspacesDir);
  const violations = [];

  for (const absolutePath of packageJsonFiles) {
    const relativePath = relative(repoRoot, absolutePath).replaceAll('\\', '/');
    const content = await readFile(absolutePath, 'utf8');
    const packageJson = JSON.parse(content);
    const dependencies = collectDependencies(packageJson);

    const materialUiDependencies = Object.keys(dependencies).filter(name =>
      name.startsWith('@material-ui/'),
    );

    if (materialUiDependencies.length === 0) {
      continue;
    }

    if (allowlist.has(relativePath)) {
      continue;
    }

    for (const dependency of materialUiDependencies) {
      violations.push({
        type: 'package.json',
        path: relativePath,
        dependency,
        message: `Forbidden dependency "${dependency}" in ${relativePath}. ${ALTERNATIVE_MESSAGE}`,
      });
    }
  }

  return violations;
}

async function main() {
  const allowlist = await loadAllowlist();
  const violations = await checkPackageJsonFiles(allowlist);

  if (violations.length === 0) {
    console.log(
      'No forbidden Material UI v4 (@material-ui/*) dependencies found.',
    );
    return;
  }

  console.error(
    `Found ${violations.length} forbidden Material UI v4 (@material-ui/*) reference(s):\n`,
  );

  for (const violation of violations) {
    console.error(`- [${violation.type}] ${violation.message}`);
  }

  console.error(
    '\nIf a package is still migrating, add its package.json path to scripts/ci/material-ui-v4-allowlist.json temporarily.',
  );

  process.exit(1);
}

await main();
