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

// Mock fetch
global.fetch = jest.fn();

// Mock validateURLForSSRF
jest.mock('./documentHelpers', () => ({
  ...jest.requireActual('./documentHelpers'),
  validateURLForSSRF: jest.fn().mockResolvedValue(undefined),
  isValidURL: jest.fn((url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }),
  isValidFileType: jest.fn((type: string) => {
    const supportedTypes = [
      'md',
      'txt',
      'pdf',
      'json',
      'yaml',
      'yml',
      'log',
      'url',
    ];
    const normalizedType = type.toLowerCase().replace(/^\./, '');
    return supportedTypes.includes(normalizedType);
  }),
  stripHtmlTags: jest.fn((html: string) => {
    // Simple mock that removes HTML tags
    // NOSONAR - This regex pattern is safe; negated character class [^>]* is not vulnerable to ReDoS
    return html.replace(/<[^>]*>/g, '').trim();
  }),
}));

// Helper function to create a mock ReadableStream from a string
function createMockReadableStream(content: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const encodedContent = encoder.encode(content);

  return new ReadableStream({
    start(controller) {
      controller.enqueue(encodedContent);
      controller.close();
    },
  });
}

describe('fileParser', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
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

  describe('parseFile - URL Type', () => {
    const { validateURLForSSRF, stripHtmlTags } = require('./documentHelpers');

    beforeEach(() => {
      validateURLForSSRF.mockClear();
      validateURLForSSRF.mockResolvedValue(undefined);
    });

    it('should fetch and parse HTML content from URL', async () => {
      const htmlContent = '<html><body><p>Test content</p></body></html>';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/html' }),
        body: createMockReadableStream(htmlContent),
      } as any);

      stripHtmlTags.mockReturnValue('Test content');

      const result = await parseFile(
        Buffer.from(''),
        'https://example.com',
        'url',
      );

      expect(validateURLForSSRF).toHaveBeenCalledWith('https://example.com');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'RHDH-AI-Notebooks-Bot/1.0',
          }),
        }),
      );
      expect(result.content).toBe('Test content');
      expect(result.metadata.url).toBe('https://example.com');
      expect(result.metadata.fileType).toBe('url');
    });

    it('should fetch plain text content from URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        body: createMockReadableStream('Plain text response'),
      } as any);

      const result = await parseFile(
        Buffer.from(''),
        'https://example.com/file.txt',
        'url',
      );

      expect(result.content).toBe('Plain text response');
    });

    it('should fetch markdown content from URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/markdown' }),
        body: createMockReadableStream('# Markdown Title'),
      } as any);

      const result = await parseFile(
        Buffer.from(''),
        'https://example.com/readme.md',
        'url',
      );

      expect(result.content).toBe('# Markdown Title');
    });

    it('should fetch and validate JSON content from URL', async () => {
      const jsonContent = '{"key": "value"}';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        body: createMockReadableStream(jsonContent),
      } as any);

      const result = await parseFile(
        Buffer.from(''),
        'https://api.example.com/data',
        'url',
      );

      expect(result.content).toBe(jsonContent);
    });

    it('should throw error for invalid JSON from URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        body: createMockReadableStream('invalid json'),
      } as any);

      await expect(
        parseFile(Buffer.from(''), 'https://api.example.com/bad', 'url'),
      ).rejects.toThrow(/Error fetching URL/);
    });

    it('should handle unknown content types as text', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/octet-stream' }),
        body: createMockReadableStream('Unknown content'),
      } as any);

      const result = await parseFile(
        Buffer.from(''),
        'https://example.com/file',
        'url',
      );

      expect(result.content).toBe('Unknown content');
    });

    it('should throw error for invalid URL format', async () => {
      await expect(
        parseFile(Buffer.from(''), 'not-a-url', 'url'),
      ).rejects.toThrow('Invalid URL format: not-a-url');
    });

    it('should throw error when SSRF validation fails', async () => {
      validateURLForSSRF.mockRejectedValueOnce(
        new InputError('Access to private IP is not allowed'),
      );

      await expect(
        parseFile(Buffer.from(''), 'http://192.168.1.1', 'url'),
      ).rejects.toThrow('Access to private IP is not allowed');
    });

    it('should throw error for HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as any);

      await expect(
        parseFile(Buffer.from(''), 'https://example.com/missing', 'url'),
      ).rejects.toThrow(/Failed to fetch URL: 404 Not Found/);
    });

    it('should throw error for 500 server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as any);

      await expect(
        parseFile(Buffer.from(''), 'https://example.com/error', 'url'),
      ).rejects.toThrow(/Failed to fetch URL: 500 Internal Server Error/);
    });

    it('should throw error when fetch fails (network error)', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        parseFile(Buffer.from(''), 'https://example.com', 'url'),
      ).rejects.toThrow(/Error fetching URL: Network error/);
    });

    it('should throw error for empty content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/html' }),
        body: createMockReadableStream('   '),
      } as any);

      stripHtmlTags.mockReturnValue('');

      await expect(
        parseFile(Buffer.from(''), 'https://example.com', 'url'),
      ).rejects.toThrow(/No content extracted from URL/);
    });

    it('should use hostname as filename when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        body: createMockReadableStream('Content'),
      } as any);

      const result = await parseFile(
        Buffer.from(''),
        'https://example.com/path',
        'url',
      );

      expect(result.metadata.fileName).toBe('https://example.com/path');
    });

    it('should have 30 second timeout', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        body: createMockReadableStream('Content'),
      } as any);

      await parseFile(Buffer.from(''), 'https://example.com', 'url');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          signal: expect.any(Object),
        }),
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

    it('should include URL in metadata for URL type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        body: createMockReadableStream('Content'),
      } as any);

      const result = await parseFile(
        Buffer.from(''),
        'https://example.com',
        'url',
      );

      expect(result.metadata.url).toBe('https://example.com');
    });
  });
});
