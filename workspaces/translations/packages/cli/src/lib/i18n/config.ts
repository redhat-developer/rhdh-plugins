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
import os from 'node:os';
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
  backstageRepoPath?: string;
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
 * Merge directory configuration from config to merged options
 */
function mergeDirectoryConfig(
  config: I18nConfig,
  options: Record<string, string | boolean | undefined>,
  merged: MergedOptions,
): void {
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
}

/**
 * Check if this is a Memsource setup based on environment and config
 */
function isMemsourceSetup(config: I18nConfig): boolean {
  return (
    Boolean(process.env.MEMSOURCE_URL) ||
    Boolean(process.env.MEMSOURCE_USERNAME) ||
    Boolean(config.tms?.url?.includes('memsource'))
  );
}

/**
 * Generate or retrieve TMS token from config
 */
async function getTmsToken(
  config: I18nConfig,
  options: Record<string, string | boolean | undefined>,
): Promise<string | undefined> {
  let token = config.auth?.tms?.token;

  const shouldGenerateToken =
    !token &&
    Boolean(config.auth?.tms?.username) &&
    Boolean(config.auth?.tms?.password) &&
    !options.tmsToken;

  if (shouldGenerateToken && isMemsourceSetup(config)) {
    token = await generateMemsourceToken(
      config.auth!.tms!.username!,
      config.auth!.tms!.password!,
    );
  }

  return token && !options.tmsToken ? token : undefined;
}

/**
 * Merge authentication configuration from config to merged options
 */
async function mergeAuthConfig(
  config: I18nConfig,
  options: Record<string, string | boolean | undefined>,
  merged: MergedOptions,
): Promise<void> {
  const token = await getTmsToken(config, options);
  if (token) {
    merged.tmsToken = token;
  }

  if (config.auth?.tms?.username && !options.tmsUsername) {
    merged.tmsUsername = config.auth.tms.username;
  }
  if (config.auth?.tms?.password && !options.tmsPassword) {
    merged.tmsPassword = config.auth.tms.password;
  }
}

/**
 * Merge TMS configuration from config to merged options
 */
function mergeTmsConfig(
  config: I18nConfig,
  options: Record<string, string | boolean | undefined>,
  merged: MergedOptions,
): void {
  if (config.tms?.url && !options.tmsUrl) {
    merged.tmsUrl = config.tms.url;
  }
  if (config.tms?.projectId && !options.projectId) {
    merged.projectId = config.tms.projectId;
  }
}

/**
 * Merge language and format configuration from config to merged options
 */
function mergeLanguageAndFormatConfig(
  config: I18nConfig,
  options: Record<string, string | boolean | undefined>,
  merged: MergedOptions,
): void {
  if (config.languages && !options.languages && !options.targetLanguages) {
    const languagesStr = config.languages.join(',');
    merged.languages = languagesStr;
    merged.targetLanguages = languagesStr;
  }
  if (config.format && !options.format) {
    merged.format = config.format;
  }
}

/**
 * Merge pattern configuration from config to merged options
 */
function mergePatternConfig(
  config: I18nConfig,
  options: Record<string, string | boolean | undefined>,
  merged: MergedOptions,
): void {
  if (config.patterns?.include && !options.includePattern) {
    merged.includePattern = config.patterns.include;
  }
  if (config.patterns?.exclude && !options.excludePattern) {
    merged.excludePattern = config.patterns.exclude;
  }
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

  mergeDirectoryConfig(config, options, merged);
  mergeTmsConfig(config, options, merged);
  await mergeAuthConfig(config, options, merged);
  mergeLanguageAndFormatConfig(config, options, merged);
  mergePatternConfig(config, options, merged);

  // Command options override config
  return { ...merged, ...options };
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
