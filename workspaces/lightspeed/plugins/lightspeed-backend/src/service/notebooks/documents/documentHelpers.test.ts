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

import { DEFAULT_MAX_FILE_SIZE_MB } from '../../constant';
import {
  isValidFileSize,
  isValidFileType,
  parseFileContent,
} from './documentHelpers';

describe('documentHelpers', () => {
  const logger = mockServices.logger.mock();

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isValidFileSize', () => {
    const MB = 1024 * 1024;

    it('should return true for files under the preset limit', () => {
      expect(isValidFileSize(0)).toBe(true);
      expect(isValidFileSize(1024)).toBe(true);
      expect(isValidFileSize(MB)).toBe(true);
      expect(isValidFileSize(10 * MB)).toBe(true);
      expect(isValidFileSize(19 * MB)).toBe(true);
    });

    it('should return true for files exactly the preset limit', () => {
      expect(isValidFileSize(DEFAULT_MAX_FILE_SIZE_MB)).toBe(true);
    });

    it('should return false for files over the preset limit', () => {
      expect(isValidFileSize(DEFAULT_MAX_FILE_SIZE_MB + 1)).toBe(false);
      expect(isValidFileSize(DEFAULT_MAX_FILE_SIZE_MB * 1.5)).toBe(false);
    });
  });

  describe('isValidFileType', () => {
    it('should return true for supported file types', () => {
      expect(isValidFileType('md')).toBe(true);
      expect(isValidFileType('txt')).toBe(true);
      expect(isValidFileType('pdf')).toBe(true);
      expect(isValidFileType('json')).toBe(true);
      expect(isValidFileType('yaml')).toBe(true);
      expect(isValidFileType('yml')).toBe(true);
      expect(isValidFileType('log')).toBe(true);
    });

    it('should handle file types with leading dots', () => {
      expect(isValidFileType('.md')).toBe(true);
      expect(isValidFileType('.txt')).toBe(true);
      expect(isValidFileType('.pdf')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(isValidFileType('MD')).toBe(true);
      expect(isValidFileType('TXT')).toBe(true);
      expect(isValidFileType('PDF')).toBe(true);
      expect(isValidFileType('JSON')).toBe(true);
      expect(isValidFileType('YAML')).toBe(true);
      expect(isValidFileType('.PDF')).toBe(true);
      expect(isValidFileType('.YAML')).toBe(true);
    });

    it('should return false for unsupported file types', () => {
      expect(isValidFileType('exe')).toBe(false);
      expect(isValidFileType('zip')).toBe(false);
      expect(isValidFileType('doc')).toBe(false);
      expect(isValidFileType('docx')).toBe(false);
      expect(isValidFileType('xls')).toBe(false);
      expect(isValidFileType('mp4')).toBe(false);
      expect(isValidFileType('jpg')).toBe(false);
    });

    it('should return false for empty or invalid input', () => {
      expect(isValidFileType('')).toBe(false);
      expect(isValidFileType('.')).toBe(false);
    });
  });

  describe('parseFileContent', () => {
    it('should throw error when no file uploaded for non-URL type', async () => {
      await expect(parseFileContent(logger, 'txt', undefined)).rejects.toThrow(
        'No file uploaded',
      );
    });

    it('should throw error when file size exceeds limit', async () => {
      const largeFile = {
        buffer: Buffer.from('test'),
        originalname: 'large.txt',
        size: 21 * 1024 * 1024, // 21MB
      } as Express.Multer.File;

      await expect(parseFileContent(logger, 'txt', largeFile)).rejects.toThrow(
        `File size exceeds ${DEFAULT_MAX_FILE_SIZE_MB / 1024 / 1024}MB limit`,
      );
    });

    it('should parse valid file successfully', async () => {
      const file = {
        buffer: Buffer.from('test content'),
        originalname: 'test.txt',
        size: 1024,
      } as Express.Multer.File;

      const result = await parseFileContent(logger, 'txt', file);

      expect(result.content).toBe('test content');
      expect(result.metadata.fileName).toBe('test.txt');
      expect(result.metadata.fileType).toBe('txt');
    });
  });
});
