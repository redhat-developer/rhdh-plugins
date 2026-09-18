#!/usr/bin/env node
/*
 * Verifies that migrated workspaces do not declare or import Material UI v4
 * (@material-ui/*) outside the temporary migration allowlist.
 *
 * Policy: scripts/ci/material-ui-v4-policy.json (migrated workspace scope)
 *
 * Checks:
 * - package.json direct dependencies across all workspaces
 * - source imports in workspaces listed in material-ui-v4-policy.json
 *
 * Lockfiles are not scanned because many workspaces still resolve Material UI
 * v4 transitively through Backstage dependencies.
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

import { access, readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ALTERNATIVE_MESSAGE =
  'Material UI v4 (@material-ui/*) is deprecated. Use @mui/* (MUI v5), Backstage UI (@backstage/ui), or Canon design system instead.';

const IGNORED_PATH_SEGMENTS = new Set([
  'node_modules',
  'dist',
  'dist-dynamic',
  'dist-types',
  // Local dynamic-plugin install roots created during rhdh-local development.
  'dynamic-plugins-root',
]);

const SOURCE_FILE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

const MATERIAL_UI_V4_IMPORT_PATTERN =
  /(?:from|import|require)\s*(?:\(\s*)?['"]@material-ui\//;

const repoRoot = join(import.meta.dirname, '..', '..');
const policyPath = join(import.meta.dirname, 'material-ui-v4-policy.json');

async function loadPolicy() {
  const content = await readFile(policyPath, 'utf8');
  const parsed = JSON.parse(content);
  const migratedWorkspaces = parsed.migratedWorkspaces ?? [];

  return {
    migratedWorkspaces,
    packageJsonPaths: new Set(parsed.allowedPackageJsonPaths ?? []),
    sourcePathPrefixes: parsed.allowedSourcePathPrefixes ?? [],
  };
}

function isIgnoredPath(fullPath) {
  return fullPath
    .split(/[/\\]/)
    .some(segment => IGNORED_PATH_SEGMENTS.has(segment));
}

function isAllowlistedSourcePath(relativePath, sourcePathPrefixes) {
  return sourcePathPrefixes.some(prefix => relativePath.startsWith(prefix));
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function getMigratedWorkspaceDirs(migratedWorkspaces) {
  const workspacesDir = join(repoRoot, 'workspaces');
  return migratedWorkspaces.map(name => join(workspacesDir, name));
}

async function checkMigratedWorkspaceDrift(migratedWorkspaces) {
  const workspacesDir = join(repoRoot, 'workspaces');
  const violations = [];

  for (const workspaceName of migratedWorkspaces) {
    const workspaceDir = join(workspacesDir, workspaceName);

    if (!(await fileExists(workspaceDir))) {
      violations.push({
        type: 'policy',
        path: `workspaces/${workspaceName}`,
        message: `migratedWorkspaces entry "${workspaceName}" has no workspaces/${workspaceName} directory.`,
      });
      continue;
    }

    const eslintSharedConfigPath = join(
      workspaceDir,
      'eslint.frontend-shared.cjs',
    );

    if (!(await fileExists(eslintSharedConfigPath))) {
      violations.push({
        type: 'policy',
        path: `workspaces/${workspaceName}/eslint.frontend-shared.cjs`,
        message: `migratedWorkspaces entry "${workspaceName}" is missing eslint.frontend-shared.cjs.`,
      });
    }
  }

  return violations;
}

async function walkFiles(dir, predicate, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORED_PATH_SEGMENTS.has(entry.name)) {
      continue;
    }

    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await walkFiles(fullPath, predicate, files);
      continue;
    }

    if (entry.isFile() && predicate(fullPath)) {
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

async function checkPackageJsonFiles(policy) {
  const workspacesDir = join(repoRoot, 'workspaces');
  const packageJsonFiles = await walkFiles(workspacesDir, path =>
    path.endsWith('package.json'),
  );
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

    if (policy.packageJsonPaths.has(relativePath)) {
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

async function checkSourceFiles(policy) {
  const enforcedWorkspaceDirs = getMigratedWorkspaceDirs(
    policy.migratedWorkspaces,
  );
  const violations = [];

  for (const workspaceDir of enforcedWorkspaceDirs) {
    if (!(await fileExists(workspaceDir))) {
      continue;
    }

    const sourceFiles = await walkFiles(workspaceDir, path => {
      if (isIgnoredPath(path)) {
        return false;
      }

      const extension = path.slice(path.lastIndexOf('.'));
      return SOURCE_FILE_EXTENSIONS.has(extension);
    });

    for (const absolutePath of sourceFiles) {
      const relativePath = relative(repoRoot, absolutePath).replaceAll(
        '\\',
        '/',
      );

      if (isAllowlistedSourcePath(relativePath, policy.sourcePathPrefixes)) {
        continue;
      }

      const content = await readFile(absolutePath, 'utf8');
      if (!MATERIAL_UI_V4_IMPORT_PATTERN.test(content)) {
        continue;
      }

      violations.push({
        type: 'source',
        path: relativePath,
        message: `Forbidden @material-ui/* import in ${relativePath}. ${ALTERNATIVE_MESSAGE}`,
      });
    }
  }

  return violations;
}

async function main() {
  const policy = await loadPolicy();

  const violations = [
    ...(await checkMigratedWorkspaceDrift(policy.migratedWorkspaces)),
    ...(await checkPackageJsonFiles(policy)),
    ...(await checkSourceFiles(policy)),
  ];

  if (violations.length === 0) {
    console.log(
      'No forbidden Material UI v4 (@material-ui/*) dependencies or imports found.',
    );
    return;
  }

  console.error(
    `Found ${violations.length} Material UI v4 policy or package reference(s):\n`,
  );

  for (const violation of violations) {
    console.error(`- [${violation.type}] ${violation.message}`);
  }

  console.error(
    '\nIf a package is still migrating, update scripts/ci/material-ui-v4-policy.json temporarily.',
  );

  process.exit(1);
}

try {
  await main();
} catch (error) {
  console.error(error.stack);
  process.exit(1);
}
