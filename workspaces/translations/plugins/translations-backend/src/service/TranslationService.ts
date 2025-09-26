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
import { LoggerService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import fs from 'fs';
import path from 'path';

import {
  deepMergeTranslations,
  filterLocales,
  isValidJSONTranslation,
} from '../utils';

export interface TranslationFileStats {
  filesProcessed: number;
  filesNotFound: number;
  filesInvalid: number;
}

export interface TranslationResult {
  translations: Record<string, any>;
  stats: {
    totalFilesProcessed: number;
    totalFilesNotFound: number;
    totalFilesInvalid: number;
  };
}

/**
 * Service for managing translation files and processing
 */
export class TranslationService {
  private cachedTranslations: Record<string, any> | null = null;
  private readonly overridesFiles: string[];
  private readonly configuredLocales: string[];

  constructor(
    private readonly config: Config,
    private readonly logger: LoggerService,
  ) {
    this.overridesFiles =
      this.config.getOptionalStringArray('i18n.overrides') ?? [];
    this.configuredLocales = this.config.getOptionalStringArray(
      'i18n.locales',
    ) ?? ['en'];
  }

  /**
   * Finds the topmost folder with the given name by searching up the directory tree
   * Similar to the approach used in marketplace plugin
   */
  private findTopmostFolder(
    folderName: string,
    startPath = process.cwd(),
  ): string | null {
    let currentPath = path.resolve(startPath);
    let topmostFoundPath: string | null = null;

    while (currentPath !== path.parse(currentPath).root) {
      const targetFolderPath = path.join(currentPath, folderName);
      if (
        fs.existsSync(targetFolderPath) &&
        fs.statSync(targetFolderPath).isDirectory()
      ) {
        topmostFoundPath = targetFolderPath;
      }
      currentPath = path.dirname(currentPath);
    }
    const targetFolderPath = path.join(currentPath, folderName);

    if (
      fs.existsSync(targetFolderPath) &&
      fs.statSync(targetFolderPath).isDirectory()
    ) {
      topmostFoundPath = targetFolderPath;
    }

    return topmostFoundPath;
  }

  /**
   * Resolves the internal translations directory path
   * Uses dynamic folder search to find the topmost 'translations' folder
   */
  private resolveInternalTranslationsDirectory(): string | null {
    // First try to find 'src/translations' in the topmost directory structure
    const srcTranslationsPath = this.findTopmostFolder('src');
    if (srcTranslationsPath) {
      const translationsPath = path.join(srcTranslationsPath, 'translations');
      if (
        fs.existsSync(translationsPath) &&
        fs.statSync(translationsPath).isDirectory()
      ) {
        this.logger.info(
          `Found internal translations directory: ${translationsPath}`,
        );
        return translationsPath;
      }
    }

    // Fallback: look for 'translations' folder directly
    const translationsPath = this.findTopmostFolder('translations');
    if (translationsPath) {
      this.logger.info(
        `Found internal translations directory: ${translationsPath}`,
      );
      return translationsPath;
    }

    this.logger.debug(
      'No internal translations directory found in any expected location',
    );
    return null;
  }

  /**
   * Scans a directory for JSON translation files
   */
  private scanDirectoryForTranslationFiles(directoryPath: string): string[] {
    try {
      if (!fs.existsSync(directoryPath)) {
        this.logger.warn(
          `Internal translation directory not found: ${directoryPath}`,
        );
        return [];
      }

      const files = fs.readdirSync(directoryPath);
      const jsonFiles = files
        .filter(file => file.endsWith('.json'))
        .map(file => path.join(directoryPath, file));

      if (jsonFiles.length > 0) {
        this.logger.info(
          `Found ${jsonFiles.length} translation files in internal directory: ${directoryPath}`,
        );
      }

      return jsonFiles;
    } catch (error) {
      this.logger.warn(
        `Failed to scan internal directory ${directoryPath}: ${error}`,
      );
      return [];
    }
  }

  /**
   * Processes translation files and merges them into the target object
   */
  private processTranslationFiles(
    files: string[],
    mergedTranslations: Record<string, any>,
    source: string,
  ): TranslationFileStats {
    let filesProcessed = 0;
    let filesNotFound = 0;
    let filesInvalid = 0;

    for (const file of files) {
      try {
        if (!fs.existsSync(file)) {
          this.logger.warn(`Translation file not found: ${file} (${source})`);
          filesNotFound++;
          continue;
        }

        const raw = fs.readFileSync(file, 'utf8');
        const json = JSON.parse(raw);
        if (!isValidJSONTranslation(json)) {
          this.logger.warn(
            `Invalid JSON translation file format: ${file} (${source})`,
          );
          filesInvalid++;
          continue;
        }

        deepMergeTranslations(mergedTranslations, json);
        this.logger.debug(`Processed translation file: ${file} (${source})`);
        filesProcessed++;
      } catch (parseError) {
        this.logger.warn(
          `Failed to parse JSON from file: ${file} (${source}) - ${parseError}`,
        );
        filesInvalid++;
      }
    }

    return { filesProcessed, filesNotFound, filesInvalid };
  }

  /**
   * Gets all translations, processing both internal directory and config overrides
   */
  async getTranslations(): Promise<TranslationResult> {
    if (this.cachedTranslations) {
      return {
        translations: this.cachedTranslations,
        stats: {
          totalFilesProcessed: 0,
          totalFilesNotFound: 0,
          totalFilesInvalid: 0,
        },
      };
    }

    const mergedTranslations: Record<string, any> = {};
    let totalFilesProcessed = 0;
    let totalFilesNotFound = 0;
    let totalFilesInvalid = 0;

    // Step 1: Process internal directory files first (auto-detected)
    let internalFiles: string[] = [];
    const internalDirectory = this.resolveInternalTranslationsDirectory();
    if (internalDirectory) {
      internalFiles = this.scanDirectoryForTranslationFiles(internalDirectory);
      if (internalFiles.length > 0) {
        const internalStats = this.processTranslationFiles(
          internalFiles,
          mergedTranslations,
          'internal directory',
        );
        totalFilesProcessed += internalStats.filesProcessed;
        totalFilesNotFound += internalStats.filesNotFound;
        totalFilesInvalid += internalStats.filesInvalid;
      }
    }

    // Step 2: Process config override files (these will override internal files)
    if (this.overridesFiles.length > 0) {
      const overrideStats = this.processTranslationFiles(
        this.overridesFiles,
        mergedTranslations,
        'config overrides',
      );
      totalFilesProcessed += overrideStats.filesProcessed;
      totalFilesNotFound += overrideStats.filesNotFound;
      totalFilesInvalid += overrideStats.filesInvalid;
    }

    // Determine if we have any files configured
    const totalFilesConfigured =
      internalFiles.length + this.overridesFiles.length;

    // If no files were configured, return empty response
    if (totalFilesConfigured === 0) {
      this.logger.info(
        'No translation files found (neither auto-detected internal directory nor config overrides)',
      );
      this.cachedTranslations = {};
      return {
        translations: {},
        stats: {
          totalFilesProcessed: 0,
          totalFilesNotFound: 0,
          totalFilesInvalid: 0,
        },
      };
    }

    // If files were configured but none were found, throw error
    if (totalFilesNotFound === totalFilesConfigured) {
      this.logger.warn('All configured translation files were not found');
      throw new Error('All configured translation files were not found');
    }

    // If files were found but none contained valid translations, throw error
    if (totalFilesProcessed === 0) {
      this.logger.warn(
        'No valid translation files found in the provided files',
      );
      throw new Error('No valid translation files found in the provided files');
    }

    // Filter translations by configured locales
    this.cachedTranslations = filterLocales(
      mergedTranslations,
      this.configuredLocales,
    );

    // Log summary
    this.logger.info(
      `Translation processing complete: ${totalFilesProcessed} files processed, ${totalFilesNotFound} files not found, ${totalFilesInvalid} files invalid`,
    );

    return {
      translations: this.cachedTranslations,
      stats: {
        totalFilesProcessed,
        totalFilesNotFound,
        totalFilesInvalid,
      },
    };
  }

  /**
   * Clears the cached translations (useful for testing or when files change)
   */
  clearCache(): void {
    this.cachedTranslations = null;
  }
}
