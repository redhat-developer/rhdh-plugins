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
import express from 'express';
import { createRouter } from '../service/router';

/**
 * Creates a mock implementation for existsSync that excludes src/translations directories
 */
export const createExcludeSrcTranslationsMock = () => {
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
    // Don't find any files by default
    return false;
  };
};

/**
 * Creates a mock implementation for existsSync that includes src/translations directories
 * This is used in tests that need to simulate finding internal translation directories
 */
export const createIncludeSrcTranslationsMock = () => {
  return (path: string) => {
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
  };
};

/**
 * Creates a router and sets up the express app for testing
 */
export const setupTestRouter = async (mockConfig: any, mockServices: any) => {
  const router = await createRouter({
    logger: mockServices.logger.mock(),
    config: mockConfig,
  });

  const app = express();
  app.use('/', router);
  return app;
};

/**
 * Creates a router with a custom logger and sets up the express app for testing
 */
export const setupTestRouterWithLogger = async (
  mockConfig: any,
  mockLogger: any,
) => {
  const router = await createRouter({
    logger: mockLogger,
    config: mockConfig,
  });

  const app = express();
  app.use('/', router);
  return app;
};
