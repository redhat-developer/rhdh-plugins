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

import { OptionValues } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';

import { commandExists, safeExecSyncOrThrow } from '../lib/utils/exec';

// Get __dirname equivalent in ES modules
// eslint-disable-next-line no-restricted-syntax
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-restricted-syntax
const __dirname = path.dirname(__filename);

/**
 * Deploy translations using the TypeScript deployment script
 */
async function deployWithTypeScriptScript(
  sourceDir: string,
  repoRoot: string,
): Promise<void> {
  // Find the deployment script
  // Try multiple possible locations
  const possibleScriptPaths = [
    // From built location (dist/commands -> dist -> scripts)
    // eslint-disable-next-line no-restricted-syntax
    path.resolve(__dirname, '../../scripts/deploy-translations.ts'),
    // From source location (src/commands -> src -> scripts)
    // eslint-disable-next-line no-restricted-syntax
    path.resolve(__dirname, '../../../scripts/deploy-translations.ts'),
    // From repo root
    path.resolve(
      repoRoot,
      'workspaces/translations/packages/cli/scripts/deploy-translations.ts',
    ),
  ];

  let scriptPath: string | null = null;
  for (const possiblePath of possibleScriptPaths) {
    if (await fs.pathExists(possiblePath)) {
      scriptPath = possiblePath;
      break;
    }
  }

  if (!scriptPath) {
    throw new Error(
      `Deployment script not found. Tried: ${possibleScriptPaths.join(', ')}`,
    );
  }

  // Use tsx to run the TypeScript script
  if (!commandExists('tsx')) {
    throw new Error(
      'tsx not found. Please install it: npm install -g tsx, or yarn add -D tsx',
    );
  }

  // Run the script with tsx
  // Note: scriptPath and sourceDir are validated paths, safe to use
  safeExecSyncOrThrow('tsx', [scriptPath, sourceDir], {
    stdio: 'inherit',
    cwd: repoRoot,
    env: { ...process.env },
  });
}

export async function deployCommand(opts: OptionValues): Promise<void> {
  console.log(
    chalk.blue(
      '🚀 Deploying translated strings to application language files...',
    ),
  );

  const { sourceDir = 'i18n/downloads' } = opts as {
    sourceDir?: string;
  };

  try {
    const sourceDirStr = String(sourceDir || 'i18n/downloads');
    const repoRoot = process.cwd();

    if (!(await fs.pathExists(sourceDirStr))) {
      throw new Error(`Source directory not found: ${sourceDirStr}`);
    }

    // Check if there are any JSON files in the source directory
    const files = await fs.readdir(sourceDirStr);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    if (jsonFiles.length === 0) {
      console.log(
        chalk.yellow(`⚠️  No translation JSON files found in ${sourceDirStr}`),
      );
      console.log(
        chalk.gray(
          '   Make sure you have downloaded translations first using:',
        ),
      );
      console.log(chalk.gray('   translations-cli i18n download'));
      return;
    }

    console.log(
      chalk.yellow(
        `📁 Found ${jsonFiles.length} translation file(s) to deploy`,
      ),
    );

    // Deploy using TypeScript script
    await deployWithTypeScriptScript(sourceDirStr, repoRoot);

    console.log(chalk.green(`✅ Deployment completed successfully!`));
  } catch (error: any) {
    console.error(chalk.red('❌ Error deploying translations:'), error.message);
    throw error;
  }
}
