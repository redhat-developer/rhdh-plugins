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

import path from 'path';
import os from 'os';
import { commandExists, safeExecSyncOrThrow } from '../utils/exec';

import fs from 'fs-extra';

import { paths } from '../paths';

/**
 * Project-specific configuration (can be committed to git)
 */
export interface I18nProjectConfig {
  tms?: {
    url?: string;
    projectId?: string;
  };
  directories?: {
    sourceDir?: string;
    outputDir?: string;
    localesDir?: string;
  };
  languages?: string[];
  format?: 'json' | 'po';
  patterns?: {
    include?: string;
    exclude?: string;
  };
}

/**
 * Personal authentication configuration (should NOT be committed)
 */
export interface I18nAuthConfig {
  tms?: {
    username?: string;
    password?: string;
    token?: string;
  };
}

/**
 * Combined configuration interface
 */
export interface I18nConfig extends I18nProjectConfig {
  auth?: I18nAuthConfig;
}

/**
 * Merged options type - represents all possible command option values
 */
export type MergedOptions = Record<string, string | boolean | undefined>;

const PROJECT_CONFIG_FILE_NAME = '.i18n.config.json';
const AUTH_CONFIG_FILE_NAME = '.i18n.auth.json';
const CONFIG_ENV_PREFIX = 'I18N_';

/**
 * Load project-specific configuration from project root
 */
export async function loadProjectConfig(): Promise<I18nProjectConfig> {
  const config: I18nProjectConfig = {};

  // Try to load from project config file (can be committed)
  const configPath = path.join(paths.targetDir, PROJECT_CONFIG_FILE_NAME);
  if (await fs.pathExists(configPath)) {
    try {
      const fileConfig = await fs.readJson(configPath);
      Object.assign(config, fileConfig);
    } catch (error) {
      console.warn(
        `Warning: Could not read project config file ${configPath}: ${error}`,
      );
    }
  }

  return config;
}

/**
 * Load personal authentication configuration from home directory
 */
export async function loadAuthConfig(): Promise<I18nAuthConfig> {
  const config: I18nAuthConfig = {};

  // Try to load from personal auth file (should NOT be committed)
  const authPath = path.join(os.homedir(), AUTH_CONFIG_FILE_NAME);
  if (await fs.pathExists(authPath)) {
    try {
      const authConfig = await fs.readJson(authPath);
      Object.assign(config, authConfig);
    } catch (error) {
      console.warn(
        `Warning: Could not read auth config file ${authPath}: ${error}`,
      );
    }
  }

  return config;
}

/**
 * Load i18n configuration from both project and personal auth files, plus environment variables
 */
export async function loadI18nConfig(): Promise<I18nConfig> {
  const config: I18nConfig = {};

  // Load project-specific configuration
  const projectConfig = await loadProjectConfig();
  Object.assign(config, projectConfig);

  // Load personal authentication configuration
  const authConfig = await loadAuthConfig();
  if (Object.keys(authConfig).length > 0) {
    config.auth = authConfig;
  }

  // Override with environment variables (project settings)
  // Support both I18N_TMS_* and MEMSOURCE_* (for backward compatibility)
  const tmsUrl =
    process.env[`${CONFIG_ENV_PREFIX}TMS_URL`] || process.env.MEMSOURCE_URL;
  if (tmsUrl) {
    config.tms = config.tms || {};
    config.tms.url = tmsUrl;
  }
  if (process.env[`${CONFIG_ENV_PREFIX}TMS_PROJECT_ID`]) {
    config.tms = config.tms || {};
    config.tms.projectId = process.env[`${CONFIG_ENV_PREFIX}TMS_PROJECT_ID`];
  }

  // Override with environment variables (authentication)
  // Support both I18N_TMS_* and MEMSOURCE_* (for backward compatibility)
  const tmsToken =
    process.env[`${CONFIG_ENV_PREFIX}TMS_TOKEN`] || process.env.MEMSOURCE_TOKEN;
  if (tmsToken) {
    config.auth = config.auth || {};
    config.auth.tms = config.auth.tms || {};
    config.auth.tms.token = tmsToken;
  }
  const tmsUsername =
    process.env[`${CONFIG_ENV_PREFIX}TMS_USERNAME`] ||
    process.env.MEMSOURCE_USERNAME;
  if (tmsUsername) {
    config.auth = config.auth || {};
    config.auth.tms = config.auth.tms || {};
    config.auth.tms.username = tmsUsername;
  }
  const tmsPassword =
    process.env[`${CONFIG_ENV_PREFIX}TMS_PASSWORD`] ||
    process.env.MEMSOURCE_PASSWORD;
  if (tmsPassword) {
    config.auth = config.auth || {};
    config.auth.tms = config.auth.tms || {};
    config.auth.tms.password = tmsPassword;
  }
  const languagesEnv = process.env[`${CONFIG_ENV_PREFIX}LANGUAGES`];
  if (languagesEnv) {
    config.languages = languagesEnv.split(',').map(l => l.trim());
  }
  if (process.env[`${CONFIG_ENV_PREFIX}FORMAT`]) {
    config.format = process.env[`${CONFIG_ENV_PREFIX}FORMAT`] as 'json' | 'po';
  }
  if (process.env[`${CONFIG_ENV_PREFIX}SOURCE_DIR`]) {
    config.directories = config.directories || {};
    config.directories.sourceDir =
      process.env[`${CONFIG_ENV_PREFIX}SOURCE_DIR`];
  }
  if (process.env[`${CONFIG_ENV_PREFIX}OUTPUT_DIR`]) {
    config.directories = config.directories || {};
    config.directories.outputDir =
      process.env[`${CONFIG_ENV_PREFIX}OUTPUT_DIR`];
  }
  if (process.env[`${CONFIG_ENV_PREFIX}LOCALES_DIR`]) {
    config.directories = config.directories || {};
    config.directories.localesDir =
      process.env[`${CONFIG_ENV_PREFIX}LOCALES_DIR`];
  }

  return config;
}

/**
 * Merge command options with config, command options take precedence
 * This function is async because it may need to generate a token using memsource CLI
 */
export async function mergeConfigWithOptions(
  config: I18nConfig,
  options: Record<string, string | boolean | undefined>,
): Promise<MergedOptions> {
  const merged: MergedOptions = {};

  // Apply config defaults
  if (config.directories?.sourceDir && !options.sourceDir) {
    merged.sourceDir = config.directories.sourceDir;
  }
  if (config.directories?.outputDir && !options.outputDir) {
    merged.outputDir = config.directories.outputDir;
  }
  if (
    config.directories?.localesDir &&
    !options.targetDir &&
    !options.localesDir
  ) {
    merged.targetDir = config.directories.localesDir;
    merged.localesDir = config.directories.localesDir;
  }
  if (config.tms?.url && !options.tmsUrl) {
    merged.tmsUrl = config.tms.url;
  }

  // Get token from auth config (personal only, not in project config)
  // Priority: environment variable > config file > generate from username/password
  // Note: If user sources .memsourcerc, MEMSOURCE_TOKEN will be in environment and used first
  let token = config.auth?.tms?.token;

  // Only generate token if:
  // 1. Token is not already set
  // 2. Username and password are available
  // 3. Not provided via command-line option
  // 4. Memsource CLI is likely available (user is using memsource workflow)
  if (
    !token &&
    config.auth?.tms?.username &&
    config.auth?.tms?.password &&
    !options.tmsToken
  ) {
    // Check if this looks like a Memsource setup (has MEMSOURCE_URL or username suggests memsource)
    const isMemsourceSetup =
      process.env.MEMSOURCE_URL ||
      process.env.MEMSOURCE_USERNAME ||
      config.tms?.url?.includes('memsource');

    if (isMemsourceSetup) {
      // For Memsource, prefer using .memsourcerc workflow
      // Only generate if memsource CLI is available and token generation is needed
      token = await generateMemsourceToken(
        config.auth.tms.username,
        config.auth.tms.password,
      );
    }
  }

  if (token && !options.tmsToken) {
    merged.tmsToken = token;
  }

  // Get username/password from auth config
  if (config.auth?.tms?.username && !options.tmsUsername) {
    merged.tmsUsername = config.auth.tms.username;
  }
  if (config.auth?.tms?.password && !options.tmsPassword) {
    merged.tmsPassword = config.auth.tms.password;
  }
  if (config.tms?.projectId && !options.projectId) {
    merged.projectId = config.tms.projectId;
  }
  if (config.languages && !options.languages && !options.targetLanguages) {
    merged.languages = config.languages.join(',');
    merged.targetLanguages = config.languages.join(',');
  }
  if (config.format && !options.format) {
    merged.format = config.format;
  }
  if (config.patterns?.include && !options.includePattern) {
    merged.includePattern = config.patterns.include;
  }
  if (config.patterns?.exclude && !options.excludePattern) {
    merged.excludePattern = config.patterns.exclude;
  }

  // Command options override config
  // Ensure we always return a Promise (async function always returns Promise)
  const result = { ...merged, ...options };
  return Promise.resolve(result);
}

/**
 * Create a default project config file template (can be committed)
 */
export async function createDefaultConfigFile(): Promise<void> {
  const configPath = path.join(paths.targetDir, PROJECT_CONFIG_FILE_NAME);
  const defaultConfig: I18nProjectConfig = {
    tms: {
      url: '',
      projectId: '',
    },
    directories: {
      sourceDir: 'src',
      outputDir: 'i18n',
      localesDir: 'src/locales',
    },
    languages: [],
    format: 'json',
    patterns: {
      include: '**/*.{ts,tsx,js,jsx}',
      exclude:
        '**/node_modules/**,**/dist/**,**/build/**,**/*.test.ts,**/*.spec.ts',
    },
  };

  await fs.writeJson(configPath, defaultConfig, { spaces: 2 });
  console.log(`Created project config file: ${configPath}`);
  console.log(`   This file can be committed to git.`);
}

/**
 * Create a default auth config file template (should NOT be committed)
 */
export async function createDefaultAuthFile(): Promise<void> {
  const authPath = path.join(os.homedir(), AUTH_CONFIG_FILE_NAME);
  const defaultAuth: I18nAuthConfig = {
    tms: {
      username: '',
      password: '',
      token: '',
    },
  };

  await fs.writeJson(authPath, defaultAuth, { spaces: 2, mode: 0o600 }); // Secure file permissions
  console.log(`Created personal auth config file: ${authPath}`);
  console.log(`   ⚠️  This file should NOT be committed to git.`);
  console.log(
    `   ⚠️  This file contains sensitive credentials - keep it secure.`,
  );
  console.log(`   Add ${AUTH_CONFIG_FILE_NAME} to your global .gitignore.`);
}

/**
 * Generate Memsource token using memsource CLI
 * This replicates the functionality: memsource auth login --user-name $USERNAME --password "$PASSWORD" -c token -f value
 *
 * Note: This is a fallback. The preferred workflow is to source ~/.memsourcerc which sets MEMSOURCE_TOKEN
 */
async function generateMemsourceToken(
  username: string,
  password: string,
): Promise<string | undefined> {
  try {
    // Check if memsource CLI is available
    if (!commandExists('memsource')) {
      return undefined;
    }

    // Generate token using memsource CLI
    // Note: Password is passed as argument, but it's from user input during setup
    const token = safeExecSyncOrThrow(
      'memsource',
      [
        'auth',
        'login',
        '--user-name',
        username,
        '--password',
        password,
        '-c',
        'token',
        '-f',
        'value',
      ],
      {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        maxBuffer: 1024 * 1024,
      },
    ).trim();

    if (token && token.length > 0) {
      return token;
    }
  } catch {
    // memsource CLI not available or authentication failed
    // This is expected if user hasn't set up memsource CLI or virtual environment
    // The workflow should use .memsourcerc file instead
  }

  return undefined;
}
