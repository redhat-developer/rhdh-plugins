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

import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import chalk from 'chalk';

interface TranslationData {
  [pluginName: string]: {
    en: {
      [key: string]: string;
    };
  };
}

/**
 * Find the correct import path for translation ref
 */
function findRefImportPath(translationDir: string): string {
  // Check common patterns in order of preference
  if (fs.existsSync(path.join(translationDir, 'ref.ts'))) {
    return './ref';
  }
  if (fs.existsSync(path.join(translationDir, 'translations.ts'))) {
    return './translations';
  }
  // Default fallback
  return './ref';
}

/**
 * Extract ref import name, import path, and variable name from existing translation file
 */
function extractRefInfo(filePath: string): {
  refImportName: string;
  refImportPath: string;
  variableName: string;
} | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract ref import: import { xxxTranslationRef } from './ref' or from '@backstage/...'
    // Match both local and external imports
    const refImportMatch = content.match(
      /import\s*{\s*(\w+TranslationRef)\s*}\s*from\s*['"]([^'"]+)['"]/,
    );
    if (!refImportMatch) {
      return null;
    }
    const refImportName = refImportMatch[1];
    let refImportPath = refImportMatch[2];

    // If it's a local import (starts with ./), verify the file exists
    // If not, try to find the correct path
    if (refImportPath.startsWith('./')) {
      const translationDir = path.dirname(filePath);
      const expectedFile = path.join(
        translationDir,
        `${refImportPath.replace('./', '')}.ts`,
      );
      if (!fs.existsSync(expectedFile)) {
        // Try to find the correct import path
        refImportPath = findRefImportPath(translationDir);
      }
    }

    // Extract variable name: const xxxTranslationIt = ... or const de = ...
    // Try full pattern first
    let variableMatch = content.match(
      /const\s+(\w+Translation(?:It|Ja|De|Fr|Es))\s*=/,
    );

    // If not found, try simple pattern (like const de = ...)
    if (!variableMatch) {
      variableMatch = content.match(
        /const\s+([a-z]+)\s*=\s*createTranslationMessages/,
      );
    }

    if (!variableMatch) {
      return null;
    }
    const variableName = variableMatch[1];

    return { refImportName, refImportPath, variableName };
  } catch {
    return null;
  }
}

/**
 * Map plugin names to their Backstage package imports (for rhdh repo)
 */
function getPluginPackageImport(pluginName: string): string | null {
  const pluginPackageMap: Record<string, string> = {
    search: '@backstage/plugin-search/alpha',
    'user-settings': '@backstage/plugin-user-settings/alpha',
    scaffolder: '@backstage/plugin-scaffolder/alpha',
    'core-components': '@backstage/core-components/alpha',
    'catalog-import': '@backstage/plugin-catalog-import/alpha',
    catalog: '@backstage/plugin-catalog-react/alpha',
  };

  return pluginPackageMap[pluginName] || null;
}

/**
 * Sanitize plugin name to create valid JavaScript identifier
 * Handles dots, dashes, and other invalid characters
 */
function sanitizePluginName(pluginName: string): string {
  // If plugin name contains dots (e.g., "plugin.argocd"), extract the last part
  // Otherwise, convert dashes to camelCase
  if (pluginName.includes('.')) {
    const parts = pluginName.split('.');
    // Use the last part (e.g., "argocd" from "plugin.argocd")
    return parts[parts.length - 1];
  }

  // Convert dashes to camelCase (e.g., "user-settings" -> "userSettings")
  return pluginName
    .split('-')
    .map((word, i) =>
      i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join('');
}

/**
 * Infer ref import name, import path, and variable name from plugin name
 */
function inferRefInfo(
  pluginName: string,
  lang: string,
  repoType: string,
  translationDir?: string,
): {
  refImportName: string;
  refImportPath: string;
  variableName: string;
} {
  // Sanitize plugin name to create valid identifier
  const sanitized = sanitizePluginName(pluginName);

  const refImportName = `${sanitized}TranslationRef`;
  const langCapitalized = lang.charAt(0).toUpperCase() + lang.slice(1);
  const variableName = `${sanitized}Translation${langCapitalized}`;

  // Determine import path
  let refImportPath = './ref';

  // For rhdh repo, try to use external package imports
  if (repoType === 'rhdh') {
    const packageImport = getPluginPackageImport(pluginName);
    if (packageImport) {
      refImportPath = packageImport;
    }
  } else if (translationDir) {
    // For other repos, check what file exists
    refImportPath = findRefImportPath(translationDir);
  }

  return { refImportName, refImportPath, variableName };
}

/**
 * Detect repository type based on structure
 */
function detectRepoType(
  repoRoot: string,
): 'rhdh-plugins' | 'community-plugins' | 'rhdh' | 'backstage' | 'unknown' {
  const workspacesDir = path.join(repoRoot, 'workspaces');
  const packagesDir = path.join(repoRoot, 'packages');
  const pluginsDir = path.join(repoRoot, 'plugins');

  if (fs.existsSync(workspacesDir)) {
    // Check if it's rhdh-plugins or community-plugins
    // Both have workspaces, but we can check the repo name or other indicators
    const repoName = path.basename(repoRoot);
    if (repoName === 'community-plugins') {
      return 'community-plugins';
    }
    // Default to rhdh-plugins if workspaces exist
    return 'rhdh-plugins';
  }

  if (fs.existsSync(packagesDir)) {
    // Check if it's rhdh repo (has packages/app structure)
    const appDir = path.join(packagesDir, 'app');
    if (fs.existsSync(appDir)) {
      return 'rhdh';
    }
  }

  // Check if it's backstage repo (has plugins/ directory at root)
  if (fs.existsSync(pluginsDir)) {
    const repoName = path.basename(repoRoot);
    if (repoName === 'backstage') {
      return 'backstage';
    }
  }

  return 'unknown';
}

/**
 * Find plugin translation directory in workspace-based repos (rhdh-plugins, community-plugins)
 */
function findPluginInWorkspaces(
  pluginName: string,
  repoRoot: string,
): string | null {
  const workspacesDir = path.join(repoRoot, 'workspaces');
  if (!fs.existsSync(workspacesDir)) {
    return null;
  }

  // Strip "plugin." prefix if present (e.g., "plugin.adoption-insights" -> "adoption-insights")
  const cleanPluginName = pluginName.replace(/^plugin\./, '');

  const workspaceDirs = fs.readdirSync(workspacesDir);
  for (const workspace of workspaceDirs) {
    const pluginsDir = path.join(
      workspacesDir,
      workspace,
      'plugins',
      cleanPluginName,
      'src',
      'translations',
    );

    if (fs.existsSync(pluginsDir)) {
      return pluginsDir;
    }
  }

  return null;
}

/**
 * Find plugin translation directory in rhdh repo structure
 * Intelligently searches for existing reference files to determine the correct path
 */
function findPluginInRhdh(pluginName: string, repoRoot: string): string | null {
  // Search for existing reference files (ref.ts or translations.ts) to determine the correct path
  // This ensures we deploy to where the reference files were originally extracted

  // Possible locations to search:
  const searchPaths = [
    // Standard location: packages/app/src/translations/{plugin}/
    path.join(repoRoot, 'packages', 'app', 'src', 'translations', pluginName),
    // Alternative location: packages/app/src/components/{plugin}/translations/
    path.join(
      repoRoot,
      'packages',
      'app',
      'src',
      'components',
      pluginName,
      'translations',
    ),
  ];

  // Search for existing reference files in each location
  for (const searchPath of searchPaths) {
    if (fs.existsSync(searchPath)) {
      // Check if reference files exist (ref.ts or translations.ts)
      const refFile = path.join(searchPath, 'ref.ts');
      const translationsFile = path.join(searchPath, 'translations.ts');

      if (fs.existsSync(refFile) || fs.existsSync(translationsFile)) {
        return searchPath;
      }
    }
  }

  // If no existing reference files found, try to find any translation directory
  // that contains language files (e.g., fr.ts, it.ts) for this plugin
  const appSrcDir = path.join(repoRoot, 'packages', 'app', 'src');
  if (fs.existsSync(appSrcDir)) {
    // Search recursively for translation directories containing language files
    const findTranslationDir = (dir: string, depth = 0): string | null => {
      if (depth > 3) return null; // Limit search depth

      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isDirectory()) {
            const subDir = path.join(dir, entry.name);
            // Check if this directory contains language files (e.g., fr.ts, it.ts)
            const langFiles = fs
              .readdirSync(subDir)
              .filter(f =>
                /^(fr|it|ja|de|es|ko|zh|pt|ru|ar|hi|nl|pl|sv)\.ts$/.test(f),
              );

            if (langFiles.length > 0) {
              // Check if this directory also has ref.ts or translations.ts
              const refFile = path.join(subDir, 'ref.ts');
              const translationsFile = path.join(subDir, 'translations.ts');
              if (fs.existsSync(refFile) || fs.existsSync(translationsFile)) {
                // Verify this is for the correct plugin by checking import statements
                const sampleLangFile = path.join(subDir, langFiles[0]);
                try {
                  const content = fs.readFileSync(sampleLangFile, 'utf-8');
                  // Check if the file imports from this plugin (e.g., catalogTranslationRef)
                  const pluginRefPattern = new RegExp(
                    `(?:${pluginName}|${pluginName.replace(
                      /-/g,
                      '',
                    )})TranslationRef`,
                    'i',
                  );
                  if (pluginRefPattern.test(content)) {
                    return subDir;
                  }
                } catch {
                  // Continue searching
                }
              }
            }

            // Recursively search subdirectories
            const found = findTranslationDir(subDir, depth + 1);
            if (found) return found;
          }
        }
      } catch {
        // Continue searching
      }

      return null;
    };

    const foundDir = findTranslationDir(appSrcDir);
    if (foundDir) {
      return foundDir;
    }
  }

  // Fallback: Create directory in standard location if parent exists
  const standardPluginDir = path.join(
    repoRoot,
    'packages',
    'app',
    'src',
    'translations',
    pluginName,
  );

  const translationsDir = path.join(
    repoRoot,
    'packages',
    'app',
    'src',
    'translations',
  );

  if (fs.existsSync(translationsDir)) {
    fs.ensureDirSync(standardPluginDir);
    return standardPluginDir;
  }

  return null;
}

/**
 * Get the target repository root for deployment
 * For backstage and community-plugins, deploy to rhdh/translations
 * For other repos, deploy to their own structure
 */
function getTargetRepoRoot(repoRoot: string, repoType: string): string {
  // For backstage and community-plugins repos, deploy to rhdh/translations
  if (repoType === 'backstage' || repoType === 'community-plugins') {
    // Try to find rhdh repo - check common locations
    const possibleRhdhPaths = [
      path.join(path.dirname(repoRoot), 'rhdh'),
      // Fallback: Try environment variable or common development location
      process.env.RHDH_REPO_PATH || path.join(os.homedir(), 'redhat', 'rhdh'),
    ];

    for (const rhdhPath of possibleRhdhPaths) {
      if (fs.existsSync(rhdhPath)) {
        return rhdhPath;
      }
    }

    // If rhdh repo not found, warn but continue with current repo
    console.warn(
      chalk.yellow(
        `⚠️  RHDH repo not found. Deploying to translations directory in current location.`,
      ),
    );
  }

  return repoRoot;
}

/**
 * Get the community-plugins repository root
 * Tries to find community-plugins repo in common locations
 */
function getCommunityPluginsRepoRoot(repoRoot: string): string | null {
  // Try to find community-plugins repo - check common locations
  const possiblePaths = [
    path.join(path.dirname(repoRoot), 'community-plugins'),
    // Fallback: Try environment variable or common development location
    process.env.COMMUNITY_PLUGINS_REPO_PATH ||
      path.join(os.homedir(), 'redhat', 'community-plugins'),
  ];

  for (const communityPluginsPath of possiblePaths) {
    if (fs.existsSync(communityPluginsPath)) {
      // Verify it's actually a community-plugins repo by checking for workspaces directory
      const workspacesDir = path.join(communityPluginsPath, 'workspaces');
      if (fs.existsSync(workspacesDir)) {
        return communityPluginsPath;
      }
    }
  }

  return null;
}

/**
 * Check if a plugin is Red Hat owned by checking package.json for "author": "Red Hat"
 */
export function isRedHatOwnedPlugin(
  pluginName: string,
  communityPluginsRoot: string,
): boolean {
  if (!communityPluginsRoot) {
    return false;
  }

  // Strip "plugin." prefix if present
  const cleanPluginName = pluginName.replace(/^plugin\./, '');

  const workspacesDir = path.join(communityPluginsRoot, 'workspaces');
  if (!fs.existsSync(workspacesDir)) {
    return false;
  }

  const workspaceDirs = fs.readdirSync(workspacesDir);
  for (const workspace of workspaceDirs) {
    const pluginDir = path.join(
      workspacesDir,
      workspace,
      'plugins',
      cleanPluginName,
    );

    if (fs.existsSync(pluginDir)) {
      // Check package.json for "author": "Red Hat"
      const packageJsonPath = path.join(pluginDir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = fs.readJsonSync(packageJsonPath);
          if (packageJson.author === 'Red Hat') {
            return true;
          }
        } catch {
          // If package.json can't be read, continue searching
        }
      }
    }
  }

  return false;
}

/**
 * Find plugin translation directory (supports multiple repo structures)
 */
function findPluginTranslationDir(
  pluginName: string,
  repoRoot: string,
  repoType: string,
): string | null {
  // For backstage and community-plugins, check if repoRoot is actually a community-plugins repo
  // (has workspaces directory) - if so, deploy to workspace, otherwise deploy to rhdh/translations
  if (repoType === 'backstage' || repoType === 'community-plugins') {
    // Check if repoRoot is actually a community-plugins repo (has workspaces directory)
    const workspacesDir = path.join(repoRoot, 'workspaces');
    if (fs.existsSync(workspacesDir)) {
      // This is a community-plugins repo, deploy to workspace
      return findPluginInWorkspaces(pluginName, repoRoot);
    }

    // Otherwise, deploy to rhdh/translations/{plugin}/
    const targetRoot = getTargetRepoRoot(repoRoot, repoType);
    const translationsDir = path.join(targetRoot, 'translations');

    // Deploy to rhdh/translations/{plugin}/
    const pluginDir = path.join(translationsDir, pluginName);
    if (!fs.existsSync(pluginDir)) {
      // Create directory if it doesn't exist
      fs.ensureDirSync(pluginDir);
    }
    return pluginDir;
  }

  if (repoType === 'rhdh-plugins') {
    // Deploy to workspace-specific paths
    return findPluginInWorkspaces(pluginName, repoRoot);
  }

  if (repoType === 'rhdh') {
    // For rhdh repo, check if it's the "rhdh" plugin (RHDH-specific keys)
    // or a regular plugin override
    if (pluginName === 'rhdh') {
      // RHDH-specific keys go to packages/app/src/translations/rhdh/
      const rhdhDir = path.join(
        repoRoot,
        'packages',
        'app',
        'src',
        'translations',
        'rhdh',
      );
      if (!fs.existsSync(rhdhDir)) {
        fs.ensureDirSync(rhdhDir);
      }
      return rhdhDir;
    }
    // Regular plugin overrides go to packages/app/src/translations/{plugin}/
    return findPluginInRhdh(pluginName, repoRoot);
  }

  return null;
}

/**
 * Extract copyright header from an existing file
 */
function extractCopyrightHeader(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    // Match copyright header block (from /* to */)
    const headerMatch = content.match(/\/\*[\s\S]*?\*\//);
    if (headerMatch) {
      return headerMatch[0];
    }
  } catch {
    // If file can't be read, return null
  }
  return null;
}

/**
 * Get copyright header for a plugin translation file
 * Tries to extract from existing files, falls back to default Backstage copyright
 */
function getCopyrightHeader(translationDir: string): string {
  // Try to extract from ref.ts first
  const refFile = path.join(translationDir, 'ref.ts');
  let header = extractCopyrightHeader(refFile);

  if (header) {
    return header;
  }

  // Try to extract from any existing language file
  if (fs.existsSync(translationDir)) {
    const langFiles = fs
      .readdirSync(translationDir)
      .filter(
        f =>
          f.endsWith('.ts') &&
          !f.includes('ref') &&
          !f.includes('translations') &&
          !f.includes('index'),
      );

    for (const langFile of langFiles) {
      const langFilePath = path.join(translationDir, langFile);
      header = extractCopyrightHeader(langFilePath);
      if (header) {
        return header;
      }
    }
  }

  // Default to Backstage copyright if no existing file found
  return `/*
 * Copyright 2024 The Backstage Authors
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
 */`;
}

/**
 * Generate TypeScript translation file content
 */
function generateTranslationFile(
  pluginName: string,
  lang: string,
  messages: { [key: string]: string },
  refImportName: string,
  refImportPath: string,
  variableName: string,
  translationDir?: string,
): string {
  let langName: string;
  if (lang === 'it') {
    langName = 'Italian';
  } else if (lang === 'ja') {
    langName = 'Japanese';
  } else {
    langName = lang;
  }

  const messagesContent = Object.entries(messages)
    .map(([key, value]) => {
      // Escape single quotes and backslashes in values
      const escapedValue = value
        .replaceAll(/\\/g, '\\\\')
        .replaceAll(/'/g, "\\'")
        .replaceAll(/\n/g, '\\n');
      return `    '${key}': '${escapedValue}',`;
    })
    .join('\n');

  // Get copyright header from existing files or use default
  const copyrightHeader = translationDir
    ? getCopyrightHeader(translationDir)
    : `/*
 * Copyright 2024 The Backstage Authors
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
 */`;

  return `${copyrightHeader}

import { createTranslationMessages } from '@backstage/core-plugin-api/alpha';
import { ${refImportName} } from '${refImportPath}';

/**
 * ${langName} translation for ${pluginName}.
 * @public
 */
const ${variableName} = createTranslationMessages({
  ref: ${refImportName},
  messages: {
${messagesContent}
  },
});

export default ${variableName};
`;
}

/**
 * Auto-detect downloaded translation files
 */
function detectDownloadedFiles(
  downloadDir: string,
  repoType: string,
): Record<string, string> {
  const files: Record<string, string> = {};

  if (!fs.existsSync(downloadDir)) {
    return files;
  }

  // List all JSON files in download directory
  const allFiles = fs.readdirSync(downloadDir).filter(f => f.endsWith('.json'));

  // Supported patterns:
  // 1. New sprint-based: {repo}-{sprint}-{lang}(-C).json (e.g., rhdh-s3285-it-C.json)
  // 2. Date-based: {repo}-{date}-{lang}(-C).json (e.g., backstage-2026-01-08-fr-C.json)
  // 3. Old reference pattern: {repo}-reference-{date}-{lang}(-C).json (backward compatibility)
  // The -C suffix is added by TMS and is optional in matching

  for (const file of allFiles) {
    // Language codes: it, ja, fr, de, es, and other common codes
    const langCodes = '(it|ja|fr|de|es|ko|zh|pt|ru|ar|hi|nl|pl|sv)';

    // Try new sprint-based pattern first: {repo}-{sprint}-{lang}(-C).json
    // Sprint format: s followed by numbers (e.g., s3285)
    // Examples: rhdh-s3285-it-C.json, rhdh-s3285-it.json
    let match = file.match(
      new RegExp(`^([a-z-]+)-(s\\d+)-${langCodes}(?:-C)?\\.json$`, 'i'),
    );

    // If no match, try date-based pattern: {repo}-{date}-{lang}(-C).json
    if (!match) {
      match = file.match(
        new RegExp(
          `^([a-z-]+)-(\\d{4}-\\d{2}-\\d{2})-${langCodes}(?:-C)?\\.json$`,
          'i',
        ),
      );
    }

    // If still no match, try old reference pattern: {repo}-reference-{date}-{lang}(-C).json
    // (for backward compatibility)
    if (!match) {
      match = file.match(
        new RegExp(
          `^([a-z-]+)-reference-(\\d{4}-\\d{2}-\\d{2})-${langCodes}(?:-C)?\\.json$`,
          'i',
        ),
      );
    }

    if (match) {
      const fileRepo = match[1];
      // For sprint pattern: match[2] is sprint (e.g., s3285), match[3] is lang
      // For date pattern: match[2] is date (e.g., 2026-01-08), match[3] is lang
      // For old reference pattern: match[2] is date, match[3] is lang
      // All patterns have lang at index 3
      const lang = match[3];

      // Only include files that match the current repo
      // Support both old repo names and new ones (e.g., "backstage" for backstage repo)
      // Note: backstage and community-plugins files are deployed to rhdh/translations
      // So when running from rhdh repo, also accept backstage and community-plugins files
      if (
        (repoType === 'rhdh-plugins' && fileRepo === 'rhdh-plugins') ||
        (repoType === 'community-plugins' &&
          fileRepo === 'community-plugins') ||
        (repoType === 'rhdh' && fileRepo === 'rhdh') ||
        (repoType === 'backstage' && fileRepo === 'backstage') ||
        // Allow backstage and community-plugins files when running from rhdh repo
        // (since they deploy to rhdh/translations)
        (repoType === 'rhdh' &&
          (fileRepo === 'backstage' || fileRepo === 'community-plugins'))
      ) {
        // Store the original filename for reading, but use clean name for display
        // The clean name removes -C suffix and -reference for cleaner naming
        // Example: community-plugins-reference-2025-12-05-fr-C.json
        //   -> clean: community-plugins-2025-12-05-fr.json
        //   -> original: community-plugins-reference-2025-12-05-fr-C.json (for reading)
        files[lang] = file; // Store original filename for reading
      }
    }
  }

  return files;
}

/**
 * Determine target file path for translation file
 * Intelligently determines the filename pattern based on existing files
 */
function determineTargetFile(
  pluginName: string,
  lang: string,
  repoType: string,
  translationDir: string,
): string {
  // For backstage and community-plugins:
  // - If deploying to rhdh/translations/{plugin}/: use {lang}.ts format
  // - If deploying to community-plugins workspace: use {lang}.ts format
  // Both cases use the same {lang}.ts format
  if (repoType === 'backstage' || repoType === 'community-plugins') {
    return path.join(translationDir, `${lang}.ts`);
  }

  // For rhdh repo
  if (repoType === 'rhdh') {
    // For "rhdh" plugin (RHDH-specific keys), use {lang}.ts
    if (pluginName === 'rhdh') {
      return path.join(translationDir, `${lang}.ts`);
    }

    // For plugin overrides, check existing files to determine the naming pattern
    // Look for existing language files in the translation directory
    if (fs.existsSync(translationDir)) {
      const existingFiles = fs
        .readdirSync(translationDir)
        .filter(
          f =>
            f.endsWith('.ts') &&
            !f.includes('ref') &&
            !f.includes('translations'),
        );

      // Check if any existing file uses {plugin}-{lang}.ts pattern
      const pluginLangPattern = new RegExp(`^${pluginName}-[a-z]{2}\\.ts$`);
      const pluginLangFile = existingFiles.find(f => pluginLangPattern.test(f));
      if (pluginLangFile) {
        // Use the same pattern: {plugin}-{lang}.ts
        return path.join(translationDir, `${pluginName}-${lang}.ts`);
      }

      // Check if any existing file uses {lang}.ts pattern
      const langPattern = /^[a-z]{2}\.ts$/;
      const langFile = existingFiles.find(f => langPattern.test(f));
      if (langFile) {
        // Use the same pattern: {lang}.ts
        return path.join(translationDir, `${lang}.ts`);
      }
    }

    // Default: try {plugin}-{lang}.ts first, then {lang}.ts
    const pluginLangFile = path.join(
      translationDir,
      `${pluginName}-${lang}.ts`,
    );
    const langFile = path.join(translationDir, `${lang}.ts`);

    if (fs.existsSync(pluginLangFile)) {
      return pluginLangFile;
    }
    if (fs.existsSync(langFile)) {
      return langFile;
    }
    // Default to {plugin}-{lang}.ts for new plugin override files
    return pluginLangFile;
  }

  // For rhdh-plugins, use {lang}.ts in workspace plugin directories
  return path.join(translationDir, `${lang}.ts`);
}

/**
 * Get list of other language files in the translation directory
 */
function getOtherLanguageFiles(
  lang: string,
  repoType: string,
  pluginName: string,
  translationDir: string,
): string[] {
  const otherLangs = ['it', 'ja', 'de', 'fr', 'es', 'en'].filter(
    l => l !== lang,
  );

  if (repoType === 'rhdh') {
    return otherLangs.flatMap(l => {
      const pluginLangFile = path.join(translationDir, `${pluginName}-${l}.ts`);
      const langFile = path.join(translationDir, `${l}.ts`);
      const files: string[] = [];
      if (fs.existsSync(pluginLangFile)) files.push(pluginLangFile);
      if (fs.existsSync(langFile)) files.push(langFile);
      return files;
    });
  }

  return otherLangs
    .map(l => path.join(translationDir, `${l}.ts`))
    .filter(f => fs.existsSync(f));
}

/**
 * Transform variable name for target language
 */
function transformVariableName(variableName: string, lang: string): string {
  const langCapitalized = lang.charAt(0).toUpperCase() + lang.slice(1);

  if (variableName.match(/Translation(It|Ja|De|Fr|Es)$/)) {
    return variableName.replaceAll(
      /Translation(It|Ja|De|Fr|Es)$/g,
      `Translation${langCapitalized}`,
    );
  }

  return lang;
}

/**
 * Verify and fix import path if needed
 */
function verifyImportPath(
  refInfo: { refImportPath: string },
  translationDir: string,
): void {
  if (!refInfo.refImportPath.startsWith('./')) {
    return;
  }

  const expectedFile = path.join(
    translationDir,
    `${refInfo.refImportPath.replace('./', '')}.ts`,
  );

  if (!fs.existsSync(expectedFile)) {
    refInfo.refImportPath = findRefImportPath(translationDir);
  }
}

/**
 * Extract ref info from other language files
 */
function extractRefInfoFromOtherFiles(
  otherLangFiles: string[],
  repoType: string,
  lang: string,
  translationDir: string,
): {
  refImportName: string;
  refImportPath: string;
  variableName: string;
} | null {
  for (const otherFile of otherLangFiles) {
    const otherRefInfo = extractRefInfo(otherFile);
    if (!otherRefInfo) {
      continue;
    }

    verifyImportPath(otherRefInfo, translationDir);

    // Prioritize external package imports for rhdh
    const isExternalImport = !otherRefInfo.refImportPath.startsWith('./');
    const shouldUseForRhdh = repoType === 'rhdh' && isExternalImport;
    const shouldUseForOthers = repoType !== 'rhdh' || !isExternalImport;

    if (shouldUseForRhdh || shouldUseForOthers) {
      return {
        refImportName: otherRefInfo.refImportName,
        refImportPath: otherRefInfo.refImportPath,
        variableName: transformVariableName(otherRefInfo.variableName, lang),
      };
    }
  }

  return null;
}

/**
 * Extract ref info directly from ref.ts file
 */
function extractRefInfoFromRefFile(translationDir: string): {
  refImportName: string;
  refImportPath: string;
} | null {
  const refFile = path.join(translationDir, 'ref.ts');
  if (!fs.existsSync(refFile)) {
    return null;
  }

  try {
    const content = fs.readFileSync(refFile, 'utf-8');
    // Match: export const xxxTranslationRef = createTranslationRef
    const refExportMatch = content.match(
      /export\s+const\s+(\w+TranslationRef)\s*=/,
    );
    if (refExportMatch) {
      return {
        refImportName: refExportMatch[1],
        refImportPath: './ref',
      };
    }
  } catch {
    // If file can't be read, return null
  }
  return null;
}

/**
 * Get ref info for a plugin translation file
 */
function getRefInfoForPlugin(
  pluginName: string,
  lang: string,
  repoType: string,
  translationDir: string,
  targetFile: string,
  exists: boolean,
): {
  refImportName: string;
  refImportPath: string;
  variableName: string;
} {
  const otherLangFiles = getOtherLanguageFiles(
    lang,
    repoType,
    pluginName,
    translationDir,
  );

  // Try to extract from other language files first
  const refInfoFromOthers = extractRefInfoFromOtherFiles(
    otherLangFiles,
    repoType,
    lang,
    translationDir,
  );

  if (refInfoFromOthers) {
    return refInfoFromOthers;
  }

  // Try existing file
  if (exists) {
    const existingRefInfo = extractRefInfo(targetFile);
    if (existingRefInfo) {
      return existingRefInfo;
    }
  }

  // Try any other language file as fallback
  const anyOtherFile = otherLangFiles.find(f => fs.existsSync(f));
  if (anyOtherFile) {
    const otherRefInfo = extractRefInfo(anyOtherFile);
    if (otherRefInfo) {
      verifyImportPath(otherRefInfo, translationDir);
      return {
        refImportName: otherRefInfo.refImportName,
        refImportPath: otherRefInfo.refImportPath,
        variableName: transformVariableName(otherRefInfo.variableName, lang),
      };
    }
  }

  // Try to extract directly from ref.ts file
  const refInfoFromRef = extractRefInfoFromRefFile(translationDir);
  if (refInfoFromRef) {
    const langCapitalized = lang.charAt(0).toUpperCase() + lang.slice(1);
    // Extract base name from ref import (e.g., "argocd" from "argocdTranslationRef")
    const baseName = refInfoFromRef.refImportName.replace('TranslationRef', '');
    const variableName = `${baseName}Translation${langCapitalized}`;
    return {
      refImportName: refInfoFromRef.refImportName,
      refImportPath: refInfoFromRef.refImportPath,
      variableName,
    };
  }

  // Last resort: infer from plugin name
  return inferRefInfo(pluginName, lang, repoType, translationDir);
}

/**
 * Process translation for a single plugin
 */
function processPluginTranslation(
  pluginName: string,
  translations: { [key: string]: string },
  lang: string,
  repoType: string,
  repoRoot: string,
): { updated: boolean; created: boolean } | null {
  const translationDir = findPluginTranslationDir(
    pluginName,
    repoRoot,
    repoType,
  );

  if (!translationDir) {
    console.warn(
      chalk.yellow(`    ⚠️  Plugin "${pluginName}" not found, skipping...`),
    );
    return null;
  }

  console.log(chalk.gray(`    📦 Plugin: ${pluginName} → ${translationDir}`));

  const targetFile = determineTargetFile(
    pluginName,
    lang,
    repoType,
    translationDir,
  );
  const exists = fs.existsSync(targetFile);

  const refInfo = getRefInfoForPlugin(
    pluginName,
    lang,
    repoType,
    translationDir,
    targetFile,
    exists,
  );

  // Filter translations to only include keys that exist in the reference file
  // This prevents TypeScript errors from invalid keys
  const refFile = path.join(translationDir, 'ref.ts');
  let filteredTranslations = translations;
  let filteredCount = 0;

  if (fs.existsSync(refFile)) {
    const refKeys = extractKeysFromRefFile(refFile);
    if (refKeys.size > 0) {
      const validKeys = new Set(refKeys);
      const originalCount = Object.keys(translations).length;

      filteredTranslations = Object.fromEntries(
        Object.entries(translations).filter(([key]) => validKeys.has(key)),
      );

      filteredCount = originalCount - Object.keys(filteredTranslations).length;

      if (filteredCount > 0) {
        const invalidKeys = Object.keys(translations).filter(
          key => !validKeys.has(key),
        );
        console.warn(
          chalk.yellow(
            `    ⚠️  Filtered out ${filteredCount} invalid key(s) not in ref.ts: ${invalidKeys
              .slice(0, 3)
              .join(', ')}${invalidKeys.length > 3 ? '...' : ''}`,
          ),
        );
      }
    }
  }

  const content = generateTranslationFile(
    pluginName,
    lang,
    filteredTranslations,
    refInfo.refImportName,
    refInfo.refImportPath,
    refInfo.variableName,
    translationDir,
  );

  fs.writeFileSync(targetFile, content, 'utf-8');

  const relativePath = path.relative(repoRoot, targetFile);
  const keyCount = Object.keys(filteredTranslations).length;

  if (exists) {
    console.log(
      chalk.green(`    ✅ Updated: ${relativePath} (${keyCount} keys)`),
    );
    return { updated: true, created: false };
  }

  console.log(
    chalk.green(`    ✨ Created: ${relativePath} (${keyCount} keys)`),
  );
  return { updated: false, created: true };
}

/**
 * Process all plugin translations for a language
 */
function processLanguageTranslations(
  data: TranslationData,
  lang: string,
  repoType: string,
  repoRoot: string,
  communityPluginsRoot?: string | null,
): { updated: number; created: number } {
  let updated = 0;
  let created = 0;

  for (const [pluginName, pluginData] of Object.entries(data)) {
    // Use the language-specific translations (fr, it, ja, etc.)
    // The translation file structure from Memsource is: { plugin: { "en": { key: value } } }
    // Note: Memsource uses "en" as the key even for target languages (fr, it, ja, etc.)
    // The actual target language is determined from the filename (e.g., backstage-2026-01-08-fr.json)
    // We need to replace "en" with the target language key in the data structure
    const pluginDataObj = pluginData as Record<string, Record<string, string>>;

    // Try target language key first (in case some files already have the correct structure)
    let translations = pluginDataObj[lang] || {};

    // If not found, use "en" key (Memsource standard - "en" contains the target language translations)
    if (Object.keys(translations).length === 0 && pluginDataObj.en) {
      // Replace "en" key with target language key in the data structure
      // This ensures the JSON structure has the correct language key for processing
      pluginDataObj[lang] = pluginDataObj.en;
      translations = pluginDataObj[lang];
    }

    if (Object.keys(translations).length === 0) {
      continue;
    }

    // For backstage files: Do NOT deploy TS files, only copy JSON (already done)
    // For community-plugins files: Do NOT deploy TS files to rhdh/translations/{plugin}/
    // Only deploy TS files for Red Hat owned plugins to community-plugins workspaces
    if (repoType === 'backstage') {
      // Backstage files: Only copy JSON, no TS file deployment
      continue;
    }

    if (repoType === 'community-plugins') {
      // Community-plugins files: Only deploy TS files for Red Hat owned plugins to community-plugins workspaces
      // Do NOT deploy to rhdh/translations/{plugin}/
      if (
        communityPluginsRoot &&
        isRedHatOwnedPlugin(pluginName, communityPluginsRoot)
      ) {
        console.log(
          chalk.cyan(
            `    🔴 Red Hat owned plugin detected: ${pluginName} → deploying to community-plugins`,
          ),
        );

        // Deploy to community-plugins workspace only
        const communityPluginsResult = processPluginTranslation(
          pluginName,
          translations,
          lang,
          'community-plugins',
          communityPluginsRoot,
        );

        if (communityPluginsResult) {
          if (communityPluginsResult.updated) updated++;
          if (communityPluginsResult.created) created++;
        }
      }
      // Skip TS file deployment to rhdh/translations/{plugin}/ for community-plugins files
      continue;
    }

    // For other repo types (rhdh-plugins, rhdh), deploy TS files normally
    const result = processPluginTranslation(
      pluginName,
      translations,
      lang,
      repoType,
      repoRoot,
    );

    if (result) {
      if (result.updated) updated++;
      if (result.created) created++;
    }
  }

  return { updated, created };
}

/**
 * Extract translation keys from a TypeScript translation file
 * Language files use flat dot notation: 'key.name': 'value'
 */
function extractKeysFromTranslationFile(filePath: string): Set<string> {
  const keys = new Set<string>();
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Find the messages object in createTranslationMessages
    const messagesMatch = content.match(/messages:\s*\{([\s\S]*?)\}\s*\}\)/);
    if (messagesMatch) {
      const messagesContent = messagesMatch[1];
      // Match keys in messages object: 'key.name': 'value',
      // Look for pattern: 'quoted.key': 'value' or "quoted.key": "value"
      const keyPattern = /['"]([^'"]+)['"]\s*:\s*['"]/g;
      let match = keyPattern.exec(messagesContent);
      while (match !== null) {
        keys.add(match[1]);
        match = keyPattern.exec(messagesContent);
      }
    }
  } catch (error) {
    // If file doesn't exist or can't be read, return empty set
  }
  return keys;
}

/**
 * Extract keys from reference file by parsing the nested messages object
 * Ref files use nested structure: { page: { title: 'value' } }
 * We need to flatten to dot notation: 'page.title'
 */
function extractKeysFromRefFile(refFilePath: string): Set<string> {
  const keys = new Set<string>();
  try {
    const content = fs.readFileSync(refFilePath, 'utf-8');
    // Find the messages object: export const xxxMessages = { ... }
    const messagesMatch = content.match(
      /export\s+const\s+\w+Messages\s*=\s*\{([\s\S]*?)\};/,
    );
    if (!messagesMatch) {
      return keys;
    }

    const messagesContent = messagesMatch[1];

    // Recursively extract nested keys and flatten to dot notation
    const extractNestedKeys = (
      nestedContent: string,
      prefix = '',
      depth = 0,
      maxDepth = 10,
    ): void => {
      if (depth > maxDepth) {
        return; // Prevent infinite recursion
      }

      // Helper: Check if character is whitespace (without regex)
      const isWhitespace = (char: string): boolean => {
        return char === ' ' || char === '\t' || char === '\n' || char === '\r';
      };

      // Helper: Check if character is valid identifier start (without regex)
      const isIdentifierStart = (char: string): boolean => {
        return (
          (char >= 'a' && char <= 'z') ||
          (char >= 'A' && char <= 'Z') ||
          char === '_' ||
          char === '$'
        );
      };

      // Helper: Check if character is valid identifier part (without regex)
      const isIdentifierPart = (char: string): boolean => {
        return isIdentifierStart(char) || (char >= '0' && char <= '9');
      };

      // Helper: Skip whitespace characters and return new index
      const skipWhitespace = (text: string, startIndex: number): number => {
        let idx = startIndex;
        while (idx < text.length && isWhitespace(text[idx])) {
          idx++;
        }
        return idx;
      };

      // Helper: Find matching closing brace for nested object
      const findMatchingBrace = (
        textContent: string,
        startIndex: number,
      ): string | null => {
        const valueStart = textContent.indexOf('{', startIndex);
        if (valueStart === -1) {
          return null;
        }

        let braceCount = 0;
        for (let i = valueStart; i < textContent.length; i++) {
          if (textContent[i] === '{') braceCount++;
          if (textContent[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              return textContent.substring(valueStart, i + 1);
            }
          }
        }
        return null;
      };

      // Validate input length to prevent DoS attacks
      // Limit total content to 1MB to prevent memory exhaustion
      const MAX_CONTENT_LENGTH = 1024 * 1024; // 1MB
      if (nestedContent.length > MAX_CONTENT_LENGTH) {
        console.warn(
          `Content too large (${nestedContent.length} chars), skipping extraction`,
        );
        return;
      }

      // Linear parser: Extract key-value pairs without regex to avoid backtracking
      // True O(n) complexity using simple string operations
      const allMatches: Array<{
        key: string;
        value: string;
        index: number;
        endIndex: number;
      }> = [];

      const parseKeyValuePairs = (textToParse: string): void => {
        let i = 0;
        const MAX_VALUE_LENGTH = 5000;
        const MAX_KEY_LENGTH = 500;

        while (i < textToParse.length) {
          // Skip whitespace (no regex - uses character comparison)
          i = skipWhitespace(textToParse, i);
          if (i >= textToParse.length) break;

          const keyStart = i;
          let key = '';
          let keyEnd = i;

          // Parse key: either identifier or quoted string
          if (textToParse[i] === "'" || textToParse[i] === '"') {
            // Quoted key
            const quote = textToParse[i];
            i++; // Skip opening quote
            const keyStartInner = i;
            while (i < textToParse.length && textToParse[i] !== quote) {
              if (i - keyStartInner > MAX_KEY_LENGTH) break;
              i++;
            }
            if (i < textToParse.length && textToParse[i] === quote) {
              key = textToParse.substring(keyStartInner, i);
              i++; // Skip closing quote
              keyEnd = i;
            } else {
              // Invalid quoted key, skip
              i++;
              continue;
            }
          } else if (isIdentifierStart(textToParse[i])) {
            // Identifier key (no regex - uses character comparison)
            const keyStartInner = i;
            while (i < textToParse.length && isIdentifierPart(textToParse[i])) {
              if (i - keyStartInner > MAX_KEY_LENGTH) break;
              i++;
            }
            key = textToParse.substring(keyStartInner, i);
            keyEnd = i;
          } else {
            // Not a valid key start, skip this character
            i++;
            continue;
          }

          // Skip whitespace after key (no regex)
          i = skipWhitespace(textToParse, i);

          // Look for colon
          if (i >= textToParse.length || textToParse[i] !== ':') {
            i = keyEnd + 1;
            continue;
          }
          i++; // Skip colon

          // Skip whitespace after colon (no regex)
          i = skipWhitespace(textToParse, i);

          // Parse value: find next delimiter (comma, closing brace, or newline)
          const valueStart = i;
          let valueEnd = i;
          let foundDelimiter = false;

          while (i < textToParse.length && !foundDelimiter) {
            if (i - valueStart > MAX_VALUE_LENGTH) {
              // Value too long, skip this pair
              break;
            }

            const char = textToParse[i];
            if (char === ',' || char === '}' || char === '\n') {
              valueEnd = i;
              foundDelimiter = true;
            } else {
              i++;
            }
          }

          if (foundDelimiter && valueEnd > valueStart) {
            const value = textToParse.substring(valueStart, valueEnd).trim();
            if (value.length > 0) {
              allMatches.push({
                key,
                value,
                index: keyStart,
                endIndex: valueEnd + 1,
              });
            }
            i = valueEnd + 1;
          } else {
            // No delimiter found or value too long, skip
            i = keyEnd + 1;
          }
        }
      };

      parseKeyValuePairs(nestedContent);

      // Sort by index to process in order
      allMatches.sort((a, b) => a.index - b.index);

      // Process each match
      for (const matchData of allMatches) {
        const fullKey = prefix ? `${prefix}.${matchData.key}` : matchData.key;

        if (matchData.value.startsWith('{')) {
          const nestedSubContent = findMatchingBrace(
            nestedContent,
            matchData.index,
          );
          if (nestedSubContent) {
            extractNestedKeys(nestedSubContent, fullKey, depth + 1, maxDepth);
          }
        } else if (
          matchData.value.length > 0 &&
          (matchData.value[0] === "'" || matchData.value[0] === '"')
        ) {
          keys.add(fullKey);
        }
      }
    };

    extractNestedKeys(messagesContent);
  } catch (error) {
    // If file doesn't exist or can't be read, return empty set
  }
  return keys;
}

/**
 * Validate that all translation files have matching keys with the reference file
 */
function validateTranslationKeys(
  _repoType: string,
  repoRoot: string,
): { hasErrors: boolean; errors: string[] } {
  const errors: string[] = [];
  const supportedLangs = ['fr', 'it', 'ja', 'de', 'es'];

  // Find all plugin translation directories
  const workspacesDir = path.join(repoRoot, 'workspaces');
  if (!fs.existsSync(workspacesDir)) {
    return { hasErrors: false, errors: [] };
  }

  const workspaceDirs = fs.readdirSync(workspacesDir);

  for (const workspace of workspaceDirs) {
    const pluginsDir = path.join(workspacesDir, workspace, 'plugins');
    if (!fs.existsSync(pluginsDir)) {
      continue;
    }

    const pluginDirs = fs.readdirSync(pluginsDir);
    for (const plugin of pluginDirs) {
      const translationDir = path.join(
        pluginsDir,
        plugin,
        'src',
        'translations',
      );
      if (!fs.existsSync(translationDir)) {
        continue;
      }

      const refFile = path.join(translationDir, 'ref.ts');
      if (!fs.existsSync(refFile)) {
        continue;
      }

      // Extract keys from reference file
      const refKeys = extractKeysFromRefFile(refFile);
      if (refKeys.size === 0) {
        // Skip if we can't extract keys (might be using a different format)
        continue;
      }

      // Check each language file
      for (const lang of supportedLangs) {
        const langFile = path.join(translationDir, `${lang}.ts`);
        if (!fs.existsSync(langFile)) {
          continue;
        }

        const langKeys = extractKeysFromTranslationFile(langFile);

        // Find missing keys
        const missingKeys = Array.from(refKeys).filter(
          key => !langKeys.has(key),
        );
        if (missingKeys.length > 0) {
          errors.push(
            `❌ ${workspace}/plugins/${plugin}/src/translations/${lang}.ts is missing ${
              missingKeys.length
            } key(s): ${missingKeys.slice(0, 5).join(', ')}${
              missingKeys.length > 5 ? '...' : ''
            }`,
          );
        }

        // Find extra keys (keys in lang file but not in ref)
        const extraKeys = Array.from(langKeys).filter(key => !refKeys.has(key));
        if (extraKeys.length > 0) {
          errors.push(
            `⚠️  ${workspace}/plugins/${plugin}/src/translations/${lang}.ts has ${
              extraKeys.length
            } extra key(s) not in ref: ${extraKeys.slice(0, 5).join(', ')}${
              extraKeys.length > 5 ? '...' : ''
            }`,
          );
        }
      }
    }
  }

  return { hasErrors: errors.length > 0, errors };
}

/**
 * Deploy translations from downloaded JSON files
 */
export async function deployTranslations(
  downloadDir: string,
  repoRoot: string,
): Promise<void> {
  console.log(chalk.blue('🚀 Deploying translations...\n'));

  const repoType = detectRepoType(repoRoot);
  console.log(chalk.cyan(`📦 Detected repository: ${repoType}\n`));

  if (repoType === 'unknown') {
    throw new Error(
      'Could not detect repository type. Expected: rhdh-plugins, community-plugins, rhdh, or backstage',
    );
  }

  const repoFiles = detectDownloadedFiles(downloadDir, repoType);

  if (Object.keys(repoFiles).length === 0) {
    console.warn(
      chalk.yellow(
        `⚠️  No translation files found for ${repoType} in ${downloadDir}`,
      ),
    );
    console.warn(
      chalk.gray(
        `   Expected files like: ${repoType}-*-{lang}.json or ${repoType}-*-{lang}-C.json`,
      ),
    );
    return;
  }

  console.log(
    chalk.cyan(
      `📁 Found ${
        Object.keys(repoFiles).length
      } translation file(s) for ${repoType}`,
    ),
  );

  let totalUpdated = 0;
  let totalCreated = 0;

  for (const [lang, originalFilename] of Object.entries(repoFiles)) {
    // Use the original filename to read the file (it may have -C suffix and -reference)
    const filepath = path.join(downloadDir, originalFilename);

    if (!fs.existsSync(filepath)) {
      console.warn(chalk.yellow(`  ⚠️  File not found: ${originalFilename}`));
      continue;
    }

    // Generate clean filename for display (remove -C suffix and -reference)
    let displayFilename = originalFilename;
    displayFilename = displayFilename.replace(/-C\.json$/, '.json');
    displayFilename = displayFilename.replace(/-reference-/, '-');

    // Detect file repo from filename (backstage, community-plugins, etc.)
    // If running from rhdh repo but file is backstage/community-plugins, use that repo type for deployment
    let effectiveRepoType = repoType;
    const fileRepoMatch = originalFilename.match(
      /^(backstage|community-plugins|rhdh-plugins|rhdh)-/,
    );
    if (fileRepoMatch && repoType === 'rhdh') {
      const fileRepo = fileRepoMatch[1];
      if (fileRepo === 'backstage' || fileRepo === 'community-plugins') {
        // These files deploy to rhdh/translations, so use their repo type for deployment logic
        effectiveRepoType = fileRepo as 'backstage' | 'community-plugins';
      }
    }

    // Validate and parse JSON file
    let data: TranslationData;
    try {
      const fileContent = fs.readFileSync(filepath, 'utf-8');
      data = JSON.parse(fileContent);
    } catch (error: any) {
      console.error(
        chalk.red(`\n❌ Error parsing JSON file: ${displayFilename}`),
      );
      console.error(
        chalk.red(
          `   ${
            error instanceof Error ? error.message : 'Invalid JSON format'
          }`,
        ),
      );
      console.error(
        chalk.yellow(
          `   Skipping this file. Please check the file and try again.`,
        ),
      );
      continue;
    }

    // Validate that data is an object
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      console.error(
        chalk.red(`\n❌ Invalid JSON structure in file: ${displayFilename}`),
      );
      console.error(
        chalk.red(`   Expected a JSON object, got: ${typeof data}`),
      );
      continue;
    }

    console.log(chalk.cyan(`\n  🌍 Language: ${lang.toUpperCase()}`));
    console.log(chalk.gray(`  📄 Processing: ${displayFilename}`));

    // Copy JSON file to rhdh_root/translations/ for backstage repos only
    // Note: community-plugins JSON files are NOT copied to rhdh_root/translations/
    let communityPluginsRoot: string | null = null;
    if (effectiveRepoType === 'backstage') {
      const targetRoot = getTargetRepoRoot(repoRoot, effectiveRepoType);
      const translationsDir = path.join(targetRoot, 'translations');

      if (fs.existsSync(translationsDir)) {
        // Extract timestamp from filename (date or sprint)
        let timestamp = '';
        const dateMatch = displayFilename.match(/(\d{4}-\d{2}-\d{2})/);
        const sprintMatch = displayFilename.match(/(s\d+)/);

        if (dateMatch) {
          timestamp = dateMatch[1];
        } else if (sprintMatch) {
          timestamp = sprintMatch[1];
        } else {
          // Fallback: use current date
          timestamp = new Date().toISOString().split('T')[0];
        }

        // Generate clean filename: <repo_name>-<timestamp>-<locale>.json
        const cleanFilename = `${effectiveRepoType}-${timestamp}-${lang}.json`;
        const targetJsonPath = path.join(translationsDir, cleanFilename);

        // Only copy if source and target are different (avoid copying file to itself)
        if (filepath !== targetJsonPath) {
          // Read the JSON data
          const jsonData = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

          // Update JSON: Replace "en" key with target language key for each plugin
          const updatedData: Record<
            string,
            Record<string, Record<string, string>>
          > = {};
          for (const [pluginName, pluginData] of Object.entries(jsonData)) {
            const pluginDataObj = pluginData as Record<
              string,
              Record<string, string>
            >;
            updatedData[pluginName] = {};

            // If "en" key exists, replace it with target language key
            if (pluginDataObj.en) {
              updatedData[pluginName][lang] = pluginDataObj.en;
            } else if (pluginDataObj[lang]) {
              // If target language key already exists, keep it
              updatedData[pluginName][lang] = pluginDataObj[lang];
            } else {
              // If neither exists, keep the original structure
              updatedData[pluginName] = pluginDataObj;
            }
          }

          // Write updated JSON to target location
          fs.writeFileSync(
            targetJsonPath,
            JSON.stringify(updatedData, null, 2),
            'utf-8',
          );
          console.log(
            chalk.green(
              `  📋 Copied and updated JSON to: ${path.relative(
                repoRoot,
                targetJsonPath,
              )} (replaced "en" with "${lang}")`,
            ),
          );
        } else {
          // File is already in target location, but we still need to update it
          const jsonData = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

          // Update JSON: Replace "en" key with target language key for each plugin
          const updatedData: Record<
            string,
            Record<string, Record<string, string>>
          > = {};
          let needsUpdate = false;

          for (const [pluginName, pluginData] of Object.entries(jsonData)) {
            const pluginDataObj = pluginData as Record<
              string,
              Record<string, string>
            >;
            updatedData[pluginName] = {};

            // If "en" key exists, replace it with target language key
            if (pluginDataObj.en) {
              updatedData[pluginName][lang] = pluginDataObj.en;
              needsUpdate = true;
            } else if (pluginDataObj[lang]) {
              // If target language key already exists, keep it
              updatedData[pluginName][lang] = pluginDataObj[lang];
            } else {
              // If neither exists, keep the original structure
              updatedData[pluginName] = pluginDataObj;
            }
          }

          if (needsUpdate) {
            fs.writeFileSync(
              targetJsonPath,
              JSON.stringify(updatedData, null, 2),
              'utf-8',
            );
            console.log(
              chalk.green(
                `  📋 Updated JSON file: ${path.relative(
                  repoRoot,
                  targetJsonPath,
                )} (replaced "en" with "${lang}")`,
              ),
            );
          } else {
            console.log(
              chalk.gray(
                `  📋 JSON already in target location: ${path.relative(
                  repoRoot,
                  targetJsonPath,
                )}`,
              ),
            );
          }
        }
      }
    }

    // Find community-plugins repo for Red Hat owned plugins deployment
    // Only when running from rhdh repo and processing community-plugins files
    if (repoType === 'rhdh' && effectiveRepoType === 'community-plugins') {
      communityPluginsRoot = getCommunityPluginsRepoRoot(repoRoot);
      if (communityPluginsRoot) {
        console.log(
          chalk.gray(
            `  📦 Community-plugins repo found: ${communityPluginsRoot}`,
          ),
        );
      }
    }

    const { updated, created } = processLanguageTranslations(
      data,
      lang,
      effectiveRepoType,
      repoRoot,
      communityPluginsRoot,
    );

    totalUpdated += updated;
    totalCreated += created;
  }

  console.log(chalk.blue(`\n\n📊 Summary:`));
  console.log(chalk.green(`  ✅ Updated: ${totalUpdated} files`));
  console.log(chalk.green(`  ✨ Created: ${totalCreated} files`));

  // Validate translation keys after deployment
  console.log(chalk.blue(`\n🔍 Validating translation keys...`));
  const validationResults = validateTranslationKeys(repoType, repoRoot);

  if (validationResults.hasErrors) {
    console.log(chalk.red(`\n❌ Validation found issues:`));
    validationResults.errors.forEach(error => {
      console.log(chalk.red(`  ${error}`));
    });
    console.log(
      chalk.yellow(
        `\n⚠️  Please review and fix the missing keys before committing.`,
      ),
    );
  } else {
    console.log(chalk.green(`\n✅ All translation files have matching keys!`));
  }

  console.log(chalk.blue(`\n🎉 Deployment complete!`));
}
