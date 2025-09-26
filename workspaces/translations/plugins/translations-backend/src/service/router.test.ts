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

import express from 'express';
import request from 'supertest';
import { join } from 'path';

import fs from 'fs';

import {
  createSafeTestPaths,
  createSafeTestDir,
  cleanupTestDir,
  createExistsSyncMock,
  createReadFileSyncMock,
  createThrowingReadFileSyncMock,
} from '../test-utils/testHelpers';
import {
  createExcludeSrcTranslationsMock,
  setupTestRouter,
  setupTestRouterWithLogger,
} from '../test-utils/sharedTestHelpers';

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

describe('createRouter', () => {
  let app: express.Express;
  let mockConfig: any;
  let testDir: string;
  let safeTestPaths: string[];

  beforeEach(async () => {
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

    // Mock the directory traversal to not find any 'src' or 'translations' folders
    // This ensures existing tests work as before
    (fs.existsSync as jest.Mock).mockImplementation(
      createExcludeSrcTranslationsMock(),
    );

    app = await setupTestRouter(mockConfig, mockServices);
  });

  afterEach(() => {
    jest.resetAllMocks();
    // Clean up test directory if it exists
    cleanupTestDir(testDir);
  });

  it('should return merged translations when multiple files exist', async () => {
    (fs.existsSync as jest.Mock).mockImplementation(
      createExistsSyncMock(safeTestPaths),
    );
    (fs.readFileSync as jest.Mock).mockImplementation(
      createReadFileSyncMock(safeTestPaths),
    );

    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      plugin: {
        en: { hello: 'world' },
        de: { hello: 'welt' },
      },
    });
  });

  it('should return 404 if no valid files exist', async () => {
    (fs.existsSync as jest.Mock).mockImplementation(
      createExcludeSrcTranslationsMock(),
    );

    const res = await request(app).get('/');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe(
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

    const res = await request(app).get('/');

    expect(res.status).toBe(404);
    expect(res.body.error).toContain(
      'No valid translation files found in the provided files',
    );
  });

  it('should return 404 when JSON parsing fails for all files', async () => {
    (fs.existsSync as jest.Mock).mockImplementation(
      createExistsSyncMock(safeTestPaths),
    );
    (fs.readFileSync as jest.Mock).mockImplementation(
      createThrowingReadFileSyncMock(),
    );

    const res = await request(app).get('/');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe(
      'No valid translation files found in the provided files',
    );
  });

  it('should return 500 when there is an unexpected error', async () => {
    // Mock fs.existsSync to throw an error (simulating filesystem error)
    (fs.existsSync as jest.Mock).mockImplementation(() => {
      throw new Error('Filesystem error');
    });

    const res = await request(app).get('/');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to process translation files');
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

    // Mock the directory traversal to not find any 'src' or 'translations' folders
    (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
      // Use shared helper for path checking
      const excludeHelper = createExcludeSrcTranslationsMock();
      if (excludeHelper(path)) {
        return false;
      }
      // Find the override files using safe test paths
      return safeTestPaths.includes(path);
    });

    app = await setupTestRouter(mockConfig, mockServices);

    (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath === safeTestPaths[0]) {
        return JSON.stringify({ plugin: { en: { hello: 'world' } } });
      }
      if (filePath === safeTestPaths[1]) {
        return JSON.stringify({ plugin: { de: { hello: 'welt' } } });
      }
      return '{}';
    });

    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      plugin: {
        en: { hello: 'world' },
      },
    });
  });

  describe('error handling scenarios', () => {
    it('should return empty object when no files are configured', async () => {
      mockConfig = mockServices.rootConfig({
        data: {
          i18n: {
            locales: ['en', 'de'],
            overrides: [],
          },
        },
      });

      const mockLogger = mockServices.logger.mock();
      app = await setupTestRouterWithLogger(mockConfig, mockLogger);

      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({});
      expect(mockLogger.info).toHaveBeenCalledWith(
        'No translation files found (neither auto-detected internal directory nor config overrides)',
      );
    });

    it('should return 404 when all configured files are not found', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const mockLogger = mockServices.logger.mock();
      app = await setupTestRouterWithLogger(mockConfig, mockLogger);

      const res = await request(app).get('/');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe(
        'All configured translation files were not found',
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Translation file not found: ${safeTestPaths[0]} (config overrides)`,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Translation file not found: ${safeTestPaths[1]} (config overrides)`,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'All configured translation files were not found',
      );
    });

    it('should return 404 when files are found but none contain valid translations', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        // Use shared helper for path checking
        const excludeHelper = createExcludeSrcTranslationsMock();
        if (excludeHelper(path)) {
          return false;
        }
        // Find the override files
        return safeTestPaths.includes(path);
      });
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({ notAPluginKey: 'just a string' }),
      );

      const mockLogger = mockServices.logger.mock();
      app = await setupTestRouterWithLogger(mockConfig, mockLogger);

      const res = await request(app).get('/');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe(
        'No valid translation files found in the provided files',
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Invalid JSON translation file format: ${safeTestPaths[0]} (config overrides)`,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Invalid JSON translation file format: ${safeTestPaths[1]} (config overrides)`,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'No valid translation files found in the provided files',
      );
    });

    it('should handle mixed scenarios with some files found and some invalid', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        return filePath === safeTestPaths[0];
      });

      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath === safeTestPaths[0]) {
          return JSON.stringify({ plugin: { en: { hello: 'world' } } });
        }
        return '{}';
      });

      const mockLogger = mockServices.logger.mock();
      app = await setupTestRouterWithLogger(mockConfig, mockLogger);

      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        plugin: {
          en: { hello: 'world' },
        },
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Translation file not found: ${safeTestPaths[1]} (config overrides)`,
      );
    });

    it('should handle JSON parsing errors gracefully', async () => {
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
          return 'invalid json content';
        }
        if (filePath === safeTestPaths[1]) {
          return JSON.stringify({ plugin: { de: { hello: 'welt' } } });
        }
        return '{}';
      });

      const mockLogger = mockServices.logger.mock();
      app = await setupTestRouterWithLogger(mockConfig, mockLogger);

      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        plugin: {
          de: { hello: 'welt' },
        },
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(
            `Failed to parse JSON from file: ${safeTestPaths[0].replace(
              /[.*+?^${}()|[\]\\]/g,
              '\\$&',
            )}`,
          ),
        ),
      );
    });

    it('should return 404 when files exist but JSON parsing fails for all files', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        // Use shared helper for path checking
        const excludeHelper = createExcludeSrcTranslationsMock();
        if (excludeHelper(path)) {
          return false;
        }
        // Find the override files
        return safeTestPaths.includes(path);
      });
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid JSON');
      });

      const mockLogger = mockServices.logger.mock();
      app = await setupTestRouterWithLogger(mockConfig, mockLogger);

      const res = await request(app).get('/');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe(
        'No valid translation files found in the provided files',
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(
            `Failed to parse JSON from file: ${safeTestPaths[0].replace(
              /[.*+?^${}()|[\]\\]/g,
              '\\$&',
            )}`,
          ),
        ),
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(
            `Failed to parse JSON from file: ${safeTestPaths[1].replace(
              /[.*+?^${}()|[\]\\]/g,
              '\\$&',
            )}`,
          ),
        ),
      );
    });

    it('should handle single file configuration correctly', async () => {
      mockConfig = mockServices.rootConfig({
        data: {
          i18n: {
            locales: ['en'],
            overrides: [join(testDir, 'single.json')],
          },
        },
      });

      // Mock the directory traversal to not find any 'src' or 'translations' folders
      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        // Use shared helper for path checking
        const excludeHelper = createExcludeSrcTranslationsMock();
        if (excludeHelper(path)) {
          return false;
        }
        // Find the override files
        return path === join(testDir, 'single.json');
      });

      app = await setupTestRouter(mockConfig, mockServices);

      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({ plugin: { en: { hello: 'world' } } }),
      );

      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        plugin: {
          en: { hello: 'world' },
        },
      });
    });

    it('should return 404 when single file is not found', async () => {
      mockConfig = mockServices.rootConfig({
        data: {
          i18n: {
            locales: ['en'],
            overrides: [join(testDir, 'single.json')],
          },
        },
      });

      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const mockLogger = mockServices.logger.mock();
      app = await setupTestRouterWithLogger(mockConfig, mockLogger);

      const res = await request(app).get('/');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe(
        'All configured translation files were not found',
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Translation file not found: ${join(
          testDir,
          'single.json',
        )} (config overrides)`,
      );
    });
  });

  describe('internal directory functionality', () => {
    beforeEach(() => {
      // Reset mocks
      jest.resetAllMocks();
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

      const mockLogger = mockServices.logger.mock();
      app = await setupTestRouterWithLogger(mockConfig, mockLogger);

      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      // Override should take precedence over internal
      expect(res.body).toEqual({
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

      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        // Don't find any 'src' or 'translations' folders, only override files
        return path === join(testDir, 'override.json');
      });

      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({ plugin: { en: { hello: 'override world' } } }),
      );

      const mockLogger = mockServices.logger.mock();
      app = await setupTestRouterWithLogger(mockConfig, mockLogger);

      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
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

      const mockLogger = mockServices.logger.mock();
      app = await setupTestRouterWithLogger(mockConfig, mockLogger);

      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({});
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

      const mockLogger = mockServices.logger.mock();
      app = await setupTestRouterWithLogger(mockConfig, mockLogger);

      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        plugin: {
          en: { hello: 'internal world' },
        },
      });
    });
  });
});
