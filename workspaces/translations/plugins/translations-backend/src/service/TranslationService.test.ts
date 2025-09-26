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
import { mockServices } from '@backstage/backend-test-utils';
import { join } from 'path';
import fs from 'fs';

import { TranslationService } from './TranslationService';
import {
  createSafeTestPaths,
  createSafeTestDir,
  cleanupTestDir,
  createExistsSyncMock,
  createReadFileSyncMock,
  createThrowingReadFileSyncMock,
} from '../test-utils/testHelpers';
import { createExcludeSrcTranslationsMock } from '../test-utils/sharedTestHelpers';

jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    readdirSync: jest.fn(),
    statSync: jest.fn(),
  };
});

describe('TranslationService', () => {
  let service: TranslationService;
  let mockConfig: any;
  let mockLogger: any;
  let testDir: string;
  let safeTestPaths: string[];

  beforeEach(() => {
    jest.resetAllMocks();
    // Create a safe, isolated test directory
    testDir = createSafeTestDir();
    safeTestPaths = createSafeTestPaths(testDir, ['en.json', 'de.json']);

    mockConfig = mockServices.rootConfig({
      data: {
        i18n: {
          locales: ['en', 'de'],
          overrides: safeTestPaths,
        },
      },
    });
    mockLogger = mockServices.logger.mock();
    service = new TranslationService(mockConfig, mockLogger);
  });

  afterEach(() => {
    // Clean up test directory if it exists
    cleanupTestDir(testDir);
  });

  describe('getTranslations', () => {
    it('should return merged translations when multiple files exist', async () => {
      (fs.existsSync as jest.Mock).mockImplementation(
        createExistsSyncMock(safeTestPaths),
      );
      (fs.readFileSync as jest.Mock).mockImplementation(
        createReadFileSyncMock(safeTestPaths),
      );

      const result = await service.getTranslations();

      expect(result.translations).toEqual({
        plugin: {
          en: { hello: 'world' },
          de: { hello: 'welt' },
        },
      });
      expect(result.stats.totalFilesProcessed).toBe(2);
      expect(result.stats.totalFilesNotFound).toBe(0);
      expect(result.stats.totalFilesInvalid).toBe(0);
    });

    it('should throw error if no valid files exist', async () => {
      (fs.existsSync as jest.Mock).mockImplementation(
        createExcludeSrcTranslationsMock(),
      );

      await expect(service.getTranslations()).rejects.toThrow(
        'All configured translation files were not found',
      );
    });

    it('should skip invalid JSON files', async () => {
      (fs.existsSync as jest.Mock).mockImplementation(
        createExistsSyncMock(safeTestPaths),
      );
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({ notAPluginKey: 'just a string' }),
      );

      await expect(service.getTranslations()).rejects.toThrow(
        'No valid translation files found in the provided files',
      );
    });

    it('should throw error when JSON parsing fails for all files', async () => {
      (fs.existsSync as jest.Mock).mockImplementation(
        createExistsSyncMock(safeTestPaths),
      );
      (fs.readFileSync as jest.Mock).mockImplementation(
        createThrowingReadFileSyncMock(),
      );

      await expect(service.getTranslations()).rejects.toThrow(
        'No valid translation files found in the provided files',
      );
    });

    it('should filter out translations not in configured locales', async () => {
      mockConfig = mockServices.rootConfig({
        data: {
          i18n: {
            overrides: safeTestPaths,
            locales: ['en'],
          },
        },
      });
      service = new TranslationService(mockConfig, mockLogger);

      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        // Use shared helper for path checking
        const excludeHelper = createExcludeSrcTranslationsMock();
        if (excludeHelper(path)) {
          return false;
        }
        // Find the override files
        return safeTestPaths.includes(path);
      });

      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath === safeTestPaths[0]) {
          return JSON.stringify({ plugin: { en: { hello: 'world' } } });
        }
        if (filePath === safeTestPaths[1]) {
          return JSON.stringify({ plugin: { de: { hello: 'welt' } } });
        }
        return '{}';
      });

      const result = await service.getTranslations();

      expect(result.translations).toEqual({
        plugin: {
          en: { hello: 'world' },
        },
      });
    });

    it('should return empty object if locales in the override translations are not configured in app-config', async () => {
      mockConfig = mockServices.rootConfig({
        data: {
          i18n: {
            overrides: [safeTestPaths[1]],
            locales: ['en'],
          },
        },
      });
      service = new TranslationService(mockConfig, mockLogger);

      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        // Use shared helper for path checking
        const excludeHelper = createExcludeSrcTranslationsMock();
        if (excludeHelper(path)) {
          return false;
        }
        // Find the override files
        return path === safeTestPaths[1];
      });

      (fs.readFileSync as jest.Mock).mockImplementation(_filePath =>
        JSON.stringify({ plugin: { de: { hello: 'welt' } } }),
      );

      const result = await service.getTranslations();

      expect(result.translations).toEqual({});
    });

    it('should process internal directory files when auto-detected', async () => {
      mockConfig = mockServices.rootConfig({
        data: {
          i18n: {
            locales: ['en', 'de'],
            overrides: [],
          },
        },
      });
      service = new TranslationService(mockConfig, mockLogger);

      // Mock directory scanning - simulate finding src/translations structure
      (fs.readdirSync as jest.Mock).mockReturnValue(['en.json', 'de.json']);
      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        // Mock the directory traversal finding 'src' folder
        if (path.endsWith('/src') || path.endsWith('\\src')) {
          return true;
        }
        // Mock the translations folder inside src
        if (
          path.endsWith('/src/translations') ||
          path.endsWith('\\src\\translations')
        ) {
          return true;
        }
        return path.endsWith('.json');
      });
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true });

      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('/src/translations/en.json')) {
          return JSON.stringify({
            plugin: { en: { hello: 'internal world' } },
          });
        }
        if (filePath.includes('/src/translations/de.json')) {
          return JSON.stringify({ plugin: { de: { hello: 'internal welt' } } });
        }
        return '{}';
      });

      const result = await service.getTranslations();

      expect(result.translations).toEqual({
        plugin: {
          en: { hello: 'internal world' },
          de: { hello: 'internal welt' },
        },
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringMatching(
          /Found internal translations directory: .*\/src\/translations/,
        ),
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringMatching(
          /Found 2 translation files in internal directory: .*\/src\/translations/,
        ),
      );
    });

    it('should merge internal directory files first, then config overrides', async () => {
      mockConfig = mockServices.rootConfig({
        data: {
          i18n: {
            locales: ['en'],
            overrides: [join(testDir, 'override.json')],
          },
        },
      });
      service = new TranslationService(mockConfig, mockLogger);

      // Mock directory scanning
      (fs.readdirSync as jest.Mock).mockReturnValue(['en.json']);
      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        // Mock the directory traversal finding 'src' folder
        if (path.endsWith('/src') || path.endsWith('\\src')) {
          return true;
        }
        // Mock the translations folder inside src
        if (
          path.endsWith('/src/translations') ||
          path.endsWith('\\src\\translations')
        ) {
          return true;
        }
        // Mock override files and JSON files
        return (
          path === join(testDir, 'override.json') || path.endsWith('.json')
        );
      });
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true });

      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('/src/translations/en.json')) {
          return JSON.stringify({
            plugin: {
              en: {
                hello: 'internal world',
                goodbye: 'internal bye',
              },
            },
          });
        }
        if (filePath.includes(join(testDir, 'override.json'))) {
          return JSON.stringify({
            plugin: {
              en: {
                hello: 'override world',
                welcome: 'override welcome',
              },
            },
          });
        }
        return '{}';
      });

      const result = await service.getTranslations();

      expect(result.translations).toEqual({
        plugin: {
          en: {
            hello: 'override world', // overridden
            goodbye: 'internal bye', // from internal
            welcome: 'override welcome', // from override
          },
        },
      });
    });

    it('should handle internal directory not found gracefully', async () => {
      mockConfig = mockServices.rootConfig({
        data: {
          i18n: {
            locales: ['en'],
            overrides: [join(testDir, 'override.json')],
          },
        },
      });
      service = new TranslationService(mockConfig, mockLogger);

      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        // Don't find any 'src' or 'translations' folders, only override files
        return path === join(testDir, 'override.json');
      });

      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({ plugin: { en: { hello: 'override world' } } }),
      );

      const result = await service.getTranslations();

      expect(result.translations).toEqual({
        plugin: {
          en: { hello: 'override world' },
        },
      });
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'No internal translations directory found in any expected location',
      );
    });

    it('should handle internal directory scan errors gracefully', async () => {
      mockConfig = mockServices.rootConfig({
        data: {
          i18n: {
            locales: ['en'],
            overrides: [],
          },
        },
      });
      service = new TranslationService(mockConfig, mockLogger);

      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        // Mock finding 'src' folder
        if (path.endsWith('/src') || path.endsWith('\\src')) {
          return true;
        }
        // Mock the translations folder inside src
        if (
          path.endsWith('/src/translations') ||
          path.endsWith('\\src\\translations')
        ) {
          return true;
        }
        return false;
      });
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true });
      (fs.readdirSync as jest.Mock).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = await service.getTranslations();

      expect(result.translations).toEqual({});
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringMatching(
          /Failed to scan internal directory .*\/src\/translations: Error: Permission denied/,
        ),
      );
    });

    it('should work with only internal directory and no overrides', async () => {
      mockConfig = mockServices.rootConfig({
        data: {
          i18n: {
            locales: ['en'],
            overrides: [],
          },
        },
      });
      service = new TranslationService(mockConfig, mockLogger);

      (fs.readdirSync as jest.Mock).mockReturnValue(['en.json']);
      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        // Mock the directory traversal finding 'src' folder
        if (path.endsWith('/src') || path.endsWith('\\src')) {
          return true;
        }
        // Mock the translations folder inside src
        if (
          path.endsWith('/src/translations') ||
          path.endsWith('\\src\\translations')
        ) {
          return true;
        }
        // Mock JSON files
        return path.endsWith('.json');
      });
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true });

      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({ plugin: { en: { hello: 'internal world' } } }),
      );

      const result = await service.getTranslations();

      expect(result.translations).toEqual({
        plugin: {
          en: { hello: 'internal world' },
        },
      });
    });
  });

  describe('clearCache', () => {
    it('should clear the cached translations', async () => {
      // First call to populate cache
      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        if (path.endsWith('/src') || path.endsWith('\\src')) {
          return true;
        }
        if (
          path.endsWith('/src/translations') ||
          path.endsWith('\\src\\translations')
        ) {
          return true;
        }
        return path.endsWith('.json');
      });
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true });
      (fs.readdirSync as jest.Mock).mockReturnValue(['en.json']);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({ plugin: { en: { hello: 'world' } } }),
      );

      const result1 = await service.getTranslations();
      expect(result1.translations).toEqual({
        plugin: { en: { hello: 'world' } },
      });

      service.clearCache();

      const result2 = await service.getTranslations();
      expect(result2.translations).toEqual({
        plugin: { en: { hello: 'world' } },
      });
    });
  });
});
