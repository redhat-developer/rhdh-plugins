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
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Helper function to create safe test paths
 * @param testDir - The test directory path
 * @param filenames - Array of filenames to create paths for
 * @returns Array of safe test file paths
 */
export const createSafeTestPaths = (testDir: string, filenames: string[]) => {
  return filenames.map(filename => join(testDir, filename));
};

/**
 * Creates a safe, isolated test directory with a unique name
 * @param prefix - Optional prefix for the test directory name
 * @returns Path to the created test directory
 */
export const createSafeTestDir = (
  directory = 'backstage-translations-test',
) => {
  return join(tmpdir(), directory);
};

/**
 * Common test directory cleanup function
 * @param testDir - The test directory to clean up
 */
export const cleanupTestDir = (testDir: string) => {
  try {
    const fs = require('fs');
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  } catch (error) {
    // Ignore cleanup errors in tests
  }
};

/**
 * Common mock implementation for fs.existsSync that excludes src/translations folders
 * @param safeTestPaths - Array of safe test paths to include
 * @returns Mock implementation function
 */
export const createExistsSyncMock = (safeTestPaths: string[]) => {
  return (path: string) => {
    // Don't find any 'src' or 'translations' folders
    if (
      path.endsWith('/src') ||
      path.endsWith('\\src') ||
      path.endsWith('/translations') ||
      path.endsWith('\\translations')
    ) {
      return false;
    }
    // Find the override files using safe test paths
    return safeTestPaths.includes(path);
  };
};

/**
 * Common mock implementation for fs.readFileSync with standard translation content
 * @param safeTestPaths - Array of safe test paths
 * @returns Mock implementation function
 */
export const createReadFileSyncMock = (safeTestPaths: string[]) => {
  return (filePath: string) => {
    if (filePath === safeTestPaths[0]) {
      return JSON.stringify({ plugin: { en: { hello: 'world' } } });
    }
    if (filePath === safeTestPaths[1]) {
      return JSON.stringify({ plugin: { de: { hello: 'welt' } } });
    }
    return '{}';
  };
};

/**
 * Common mock implementation for fs.readFileSync with invalid JSON
 * @param safeTestPaths - Array of safe test paths
 * @returns Mock implementation function
 */
export const createInvalidReadFileSyncMock = (safeTestPaths: string[]) => {
  return (filePath: string) => {
    if (filePath === safeTestPaths[0]) {
      return 'invalid json';
    }
    if (filePath === safeTestPaths[1]) {
      return JSON.stringify({ plugin: { de: { hello: 'welt' } } });
    }
    return '{}';
  };
};

/**
 * Common mock implementation for fs.readFileSync that throws errors
 * @returns Mock implementation function that throws
 */
export const createThrowingReadFileSyncMock = () => {
  return () => {
    throw new Error('boom');
  };
};

/**
 * Common mock implementation for fs.readFileSync with single file content
 * @param safeTestPaths - Array of safe test paths
 * @returns Mock implementation function
 */
export const createSingleFileReadFileSyncMock = (safeTestPaths: string[]) => {
  return (filePath: string) => {
    if (filePath === safeTestPaths[0]) {
      return JSON.stringify({ plugin: { en: { hello: 'world' } } });
    }
    return '{}';
  };
};

/**
 * Common mock implementation for fs.existsSync that only finds specific paths
 * @param paths - Array of paths to find
 * @returns Mock implementation function
 */
export const createSpecificExistsSyncMock = (paths: string[]) => {
  return (path: string) => {
    return paths.includes(path);
  };
};
