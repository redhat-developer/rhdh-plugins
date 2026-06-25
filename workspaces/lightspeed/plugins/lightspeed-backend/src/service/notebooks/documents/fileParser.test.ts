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

import { InputError } from '@backstage/errors';

import * as pdfjsLib from 'pdfjs-dist';

import { parseFile } from './fileParser';

// Mock pdfjs-dist
jest.mock('pdfjs-dist');

describe('fileParser', () => {
  const mockGetDocument = pdfjsLib.getDocument as jest.MockedFunction<
    typeof pdfjsLib.getDocument
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseFile - Text Files (md, txt, log)', () => {
    it('should parse markdown files', async () => {
      const buffer = Buffer.from('# Heading\n\nParagraph');
      const result = await parseFile(buffer, 'test.md', 'md');

      expect(result.content).toBe('# Heading\n\nParagraph');
      expect(result.metadata.fileName).toBe('test.md');
      expect(result.metadata.fileType).toBe('md');
      expect(result.metadata.parseTimestamp).toBeDefined();
    });

    it('should parse text files', async () => {
      const buffer = Buffer.from('Plain text content');
      const result = await parseFile(buffer, 'test.txt', 'txt');

      expect(result.content).toBe('Plain text content');
      expect(result.metadata.fileName).toBe('test.txt');
      expect(result.metadata.fileType).toBe('txt');
    });

    it('should parse log files', async () => {
      const logContent =
        '[2024-01-01] ERROR: Something went wrong\n[2024-01-01] INFO: Process started';
      const buffer = Buffer.from(logContent);
      const result = await parseFile(buffer, 'app.log', 'log');

      expect(result.content).toBe(logContent);
      expect(result.metadata.fileType).toBe('log');
    });

    it('should handle empty text files', async () => {
      const buffer = Buffer.from('');
      const result = await parseFile(buffer, 'empty.txt', 'txt');

      expect(result.content).toBe('');
      expect(result.metadata.fileName).toBe('empty.txt');
    });

    it('should handle files with special characters', async () => {
      const buffer = Buffer.from('Content with émojis 🎉 and spëcial chars');
      const result = await parseFile(buffer, 'special.txt', 'txt');

      expect(result.content).toBe('Content with émojis 🎉 and spëcial chars');
    });

    it('should preserve line breaks', async () => {
      const buffer = Buffer.from('Line 1\nLine 2\r\nLine 3');
      const result = await parseFile(buffer, 'lines.txt', 'txt');

      expect(result.content).toBe('Line 1\nLine 2\r\nLine 3');
    });
  });

  describe('parseFile - JSON Files', () => {
    it('should parse valid JSON', async () => {
      const jsonContent = JSON.stringify({ key: 'value', number: 42 }, null, 2);
      const buffer = Buffer.from(jsonContent);
      const result = await parseFile(buffer, 'data.json', 'json');

      expect(result.content).toBe(jsonContent);
      expect(result.metadata.fileName).toBe('data.json');
      expect(result.metadata.fileType).toBe('json');
    });

    it('should parse compact JSON', async () => {
      const jsonContent = '{"key":"value","array":[1,2,3]}';
      const buffer = Buffer.from(jsonContent);
      const result = await parseFile(buffer, 'compact.json', 'json');

      expect(result.content).toBe(jsonContent);
    });

    it('should parse nested JSON', async () => {
      const jsonContent = JSON.stringify({
        nested: { deep: { value: 'test' } },
        array: [{ id: 1 }, { id: 2 }],
      });
      const buffer = Buffer.from(jsonContent);
      const result = await parseFile(buffer, 'nested.json', 'json');

      expect(result.content).toBe(jsonContent);
    });

    it('should throw error for invalid JSON', async () => {
      const buffer = Buffer.from('{ invalid json }');
      await expect(parseFile(buffer, 'bad.json', 'json')).rejects.toThrow(
        InputError,
      );
      await expect(parseFile(buffer, 'bad.json', 'json')).rejects.toThrow(
        /Invalid JSON file/,
      );
    });

    it('should throw error for malformed JSON', async () => {
      const buffer = Buffer.from('{"key": "value",}'); // Trailing comma
      await expect(parseFile(buffer, 'bad.json', 'json')).rejects.toThrow(
        InputError,
      );
    });

    it('should throw error for incomplete JSON', async () => {
      const buffer = Buffer.from('{"key": "value"'); // Missing closing brace
      await expect(parseFile(buffer, 'bad.json', 'json')).rejects.toThrow(
        InputError,
      );
    });

    it('should handle empty JSON object', async () => {
      const buffer = Buffer.from('{}');
      const result = await parseFile(buffer, 'empty.json', 'json');
      expect(result.content).toBe('{}');
    });

    it('should handle empty JSON array', async () => {
      const buffer = Buffer.from('[]');
      const result = await parseFile(buffer, 'empty.json', 'json');
      expect(result.content).toBe('[]');
    });
  });

  describe('parseFile - YAML Files', () => {
    it('should parse valid YAML', async () => {
      const yamlContent = `
key: value
number: 42
array:
  - item1
  - item2
`;
      const buffer = Buffer.from(yamlContent);
      const result = await parseFile(buffer, 'config.yaml', 'yaml');

      expect(result.content).toBe(yamlContent);
      expect(result.metadata.fileName).toBe('config.yaml');
      expect(result.metadata.fileType).toBe('yaml');
    });

    it('should parse .yml extension', async () => {
      const yamlContent = 'key: value';
      const buffer = Buffer.from(yamlContent);
      const result = await parseFile(buffer, 'config.yml', 'yml');

      expect(result.content).toBe(yamlContent);
      expect(result.metadata.fileType).toBe('yml');
    });

    it('should preserve YAML comments', async () => {
      const yamlContent = `
# This is a comment
key: value # inline comment
`;
      const buffer = Buffer.from(yamlContent);
      const result = await parseFile(buffer, 'config.yaml', 'yaml');

      expect(result.content).toBe(yamlContent);
    });

    it('should handle nested YAML structures', async () => {
      const yamlContent = `
parent:
  child:
    grandchild: value
  array:
    - item1
    - item2
`;
      const buffer = Buffer.from(yamlContent);
      const result = await parseFile(buffer, 'nested.yaml', 'yaml');

      expect(result.content).toBe(yamlContent);
    });

    it('should throw error for invalid YAML', async () => {
      const buffer = Buffer.from('key: [unclosed\n  array');
      await expect(parseFile(buffer, 'bad.yaml', 'yaml')).rejects.toThrow(
        InputError,
      );
      await expect(parseFile(buffer, 'bad.yaml', 'yaml')).rejects.toThrow(
        /Invalid YAML file/,
      );
    });

    it('should throw error for malformed YAML', async () => {
      const buffer = Buffer.from('key: [unclosed');
      await expect(parseFile(buffer, 'bad.yaml', 'yaml')).rejects.toThrow(
        InputError,
      );
    });

    it('should handle empty YAML', async () => {
      const buffer = Buffer.from('');
      const result = await parseFile(buffer, 'empty.yaml', 'yaml');
      expect(result.content).toBe('');
    });

    it('should handle YAML with special characters', async () => {
      const yamlContent = `
message: "Hello, world! 🎉"
special: "Line 1\nLine 2"
`;
      const buffer = Buffer.from(yamlContent);
      const result = await parseFile(buffer, 'special.yaml', 'yaml');

      expect(result.content).toBe(yamlContent);
    });
  });

  describe('parseFile - PDF Files', () => {
    it('should parse valid PDF with single page', async () => {
      const mockPage = {
        getTextContent: jest.fn().mockResolvedValue({
          items: [
            { str: 'Hello' },
            { str: 'World' },
            { str: 'PDF' },
            { str: 'Content' },
          ],
        }),
      };

      const mockPdf = {
        numPages: 1,
        getPage: jest.fn().mockResolvedValue(mockPage),
      };

      mockGetDocument.mockReturnValue({
        promise: Promise.resolve(mockPdf as any),
      } as any);

      const buffer = Buffer.from('fake pdf data');
      const result = await parseFile(buffer, 'test.pdf', 'pdf');

      expect(result.content).toContain('--- Page 1 ---');
      expect(result.content).toContain('Hello World PDF Content');
      expect(result.metadata.fileName).toBe('test.pdf');
      expect(result.metadata.fileType).toBe('pdf');
      expect(result.metadata.pageCount).toBe(1);
    });

    it('should parse multi-page PDF', async () => {
      const mockPage1 = {
        getTextContent: jest.fn().mockResolvedValue({
          items: [{ str: 'Page 1 content' }],
        }),
      };

      const mockPage2 = {
        getTextContent: jest.fn().mockResolvedValue({
          items: [{ str: 'Page 2 content' }],
        }),
      };

      const mockPdf = {
        numPages: 2,
        getPage: jest
          .fn()
          .mockResolvedValueOnce(mockPage1)
          .mockResolvedValueOnce(mockPage2),
      };

      mockGetDocument.mockReturnValue({
        promise: Promise.resolve(mockPdf as any),
      } as any);

      const buffer = Buffer.from('fake pdf data');
      const result = await parseFile(buffer, 'multi.pdf', 'pdf');

      expect(result.content).toContain('--- Page 1 ---');
      expect(result.content).toContain('Page 1 content');
      expect(result.content).toContain('--- Page 2 ---');
      expect(result.content).toContain('Page 2 content');
      expect(result.metadata.pageCount).toBe(2);
    });

    it('should handle PDF with empty pages', async () => {
      const mockPage1 = {
        getTextContent: jest.fn().mockResolvedValue({
          items: [{ str: 'Content' }],
        }),
      };

      const mockPage2 = {
        getTextContent: jest.fn().mockResolvedValue({
          items: [],
        }),
      };

      const mockPdf = {
        numPages: 2,
        getPage: jest
          .fn()
          .mockResolvedValueOnce(mockPage1)
          .mockResolvedValueOnce(mockPage2),
      };

      mockGetDocument.mockReturnValue({
        promise: Promise.resolve(mockPdf as any),
      } as any);

      const buffer = Buffer.from('fake pdf data');
      const result = await parseFile(buffer, 'test.pdf', 'pdf');

      expect(result.content).toContain('--- Page 1 ---');
      expect(result.content).toContain('Content');
      expect(result.content).not.toContain('--- Page 2 ---');
    });

    it('should filter out empty text items', async () => {
      const mockPage = {
        getTextContent: jest.fn().mockResolvedValue({
          items: [
            { str: 'Valid' },
            { str: '   ' }, // Whitespace only
            { str: '' }, // Empty
            { str: 'Text' },
          ],
        }),
      };

      const mockPdf = {
        numPages: 1,
        getPage: jest.fn().mockResolvedValue(mockPage),
      };

      mockGetDocument.mockReturnValue({
        promise: Promise.resolve(mockPdf as any),
      } as any);

      const buffer = Buffer.from('fake pdf data');
      const result = await parseFile(buffer, 'test.pdf', 'pdf');

      expect(result.content).toContain('Valid Text');
      expect(
        result.content.split(' ').filter(s => s.trim() === '').length,
      ).toBe(0);
    });

    it('should handle items without str property', async () => {
      const mockPage = {
        getTextContent: jest.fn().mockResolvedValue({
          items: [
            { str: 'Valid' },
            { notStr: 'Invalid' }, // Missing str property
            { str: 'Text' },
          ],
        }),
      };

      const mockPdf = {
        numPages: 1,
        getPage: jest.fn().mockResolvedValue(mockPage),
      };

      mockGetDocument.mockReturnValue({
        promise: Promise.resolve(mockPdf as any),
      } as any);

      const buffer = Buffer.from('fake pdf data');
      const result = await parseFile(buffer, 'test.pdf', 'pdf');

      expect(result.content).toContain('Valid Text');
      expect(result.content).not.toContain('Invalid');
    });

    it('should throw error for corrupted PDF', async () => {
      mockGetDocument.mockReturnValue({
        promise: Promise.reject(new Error('Invalid PDF structure')),
      } as any);

      const buffer = Buffer.from('corrupted pdf data');
      await expect(parseFile(buffer, 'corrupt.pdf', 'pdf')).rejects.toThrow(
        /Error parsing PDF/,
      );
    });

    it('should throw error when PDF loading fails', async () => {
      mockGetDocument.mockReturnValue({
        promise: Promise.reject(new Error('Failed to load PDF')),
      } as any);

      const buffer = Buffer.from('bad data');
      await expect(parseFile(buffer, 'bad.pdf', 'pdf')).rejects.toThrow(
        /Error parsing PDF/,
      );
    });
  });

  describe('parseFile - Unsupported Types', () => {
    it('should throw error for unsupported file type', async () => {
      const buffer = Buffer.from('content');
      await expect(parseFile(buffer, 'file.exe', 'exe')).rejects.toThrow(
        InputError,
      );
      await expect(parseFile(buffer, 'file.exe', 'exe')).rejects.toThrow(
        /Unsupported file type: exe/,
      );
    });

    it('should throw error for empty file type', async () => {
      const buffer = Buffer.from('content');
      await expect(parseFile(buffer, 'file', '')).rejects.toThrow(InputError);
    });

    it('should throw error for unknown extensions', async () => {
      const buffer = Buffer.from('content');
      await expect(parseFile(buffer, 'file.xyz', 'xyz')).rejects.toThrow(
        InputError,
      );
    });
  });

  describe('parseFile - File Type Normalization', () => {
    it('should normalize file type to lowercase', async () => {
      const buffer = Buffer.from('Content');
      const result = await parseFile(buffer, 'TEST.TXT', 'TXT');

      expect(result.metadata.fileType).toBe('TXT');
    });

    it('should handle file type with leading dot', async () => {
      const buffer = Buffer.from('Content');
      const result = await parseFile(buffer, 'test.txt', '.txt');

      expect(result.content).toBe('Content');
    });

    it('should treat md, txt, and log the same way', async () => {
      const buffer = Buffer.from('Same content');

      const mdResult = await parseFile(buffer, 'file.md', 'md');
      const txtResult = await parseFile(buffer, 'file.txt', 'txt');
      const logResult = await parseFile(buffer, 'file.log', 'log');

      expect(mdResult.content).toBe('Same content');
      expect(txtResult.content).toBe('Same content');
      expect(logResult.content).toBe('Same content');
    });

    it('should treat yaml and yml the same way', async () => {
      const buffer = Buffer.from('key: value');

      const yamlResult = await parseFile(buffer, 'file.yaml', 'yaml');
      const ymlResult = await parseFile(buffer, 'file.yml', 'yml');

      expect(yamlResult.content).toBe(ymlResult.content);
    });
  });

  describe('parseFile - Metadata', () => {
    it('should include parseTimestamp in metadata', async () => {
      const buffer = Buffer.from('Content');
      const beforeTime = new Date().toISOString();
      const result = await parseFile(buffer, 'test.txt', 'txt');
      const afterTime = new Date().toISOString();

      expect(result.metadata.parseTimestamp).toBeDefined();
      expect(result.metadata.parseTimestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
      expect(result.metadata.parseTimestamp >= beforeTime).toBe(true);
      expect(result.metadata.parseTimestamp <= afterTime).toBe(true);
    });

    it('should include correct fileName in metadata', async () => {
      const buffer = Buffer.from('Content');
      const result = await parseFile(buffer, 'my-file.txt', 'txt');

      expect(result.metadata.fileName).toBe('my-file.txt');
    });

    it('should include correct fileType in metadata', async () => {
      const buffer = Buffer.from('{"key": "value"}');
      const result = await parseFile(buffer, 'test.json', 'json');

      expect(result.metadata.fileType).toBe('json');
    });

    it('should include pageCount for PDF files', async () => {
      const mockPage = {
        getTextContent: jest.fn().mockResolvedValue({
          items: [{ str: 'Content' }],
        }),
      };

      const mockPdf = {
        numPages: 5,
        getPage: jest.fn().mockResolvedValue(mockPage),
      };

      mockGetDocument.mockReturnValue({
        promise: Promise.resolve(mockPdf as any),
      } as any);

      const buffer = Buffer.from('pdf data');
      const result = await parseFile(buffer, 'test.pdf', 'pdf');

      expect(result.metadata.pageCount).toBe(5);
    });

    it('should not include pageCount for non-PDF files', async () => {
      const buffer = Buffer.from('Content');
      const result = await parseFile(buffer, 'test.txt', 'txt');

      expect(result.metadata.pageCount).toBeUndefined();
    });
  });
});
