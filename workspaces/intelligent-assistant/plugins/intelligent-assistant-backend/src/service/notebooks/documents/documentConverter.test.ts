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

import { extractText } from 'unpdf';

import { convertToMarkdown } from './documentConverter';

jest.mock('unpdf', () => ({
  extractText: jest.fn(),
}));

const mockExtractText = extractText as jest.Mock;

describe('convertToMarkdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('plaintext passthrough', () => {
    it.each(['json', 'yaml', 'yml', 'log'])(
      'should return raw text for %s files',
      async fileType => {
        const content = `sample ${fileType} content`;
        const buffer = Buffer.from(content);

        const result = await convertToMarkdown(
          buffer,
          `test.${fileType}`,
          fileType,
        );

        expect(result).toBe(content);
        expect(mockExtractText).not.toHaveBeenCalled();
      },
    );

    it('should handle uppercase plaintext file type', async () => {
      const buffer = Buffer.from('{"key": "value"}');

      const result = await convertToMarkdown(buffer, 'data.JSON', 'JSON');

      expect(result).toBe('{"key": "value"}');
      expect(mockExtractText).not.toHaveBeenCalled();
    });

    it('should handle empty buffer for plaintext', async () => {
      const result = await convertToMarkdown(
        Buffer.from(''),
        'empty.json',
        'json',
      );

      expect(result).toBe('');
    });

    it('should preserve special characters in plaintext', async () => {
      const content = 'Content with émojis 🎉 and spëcial chars';
      const buffer = Buffer.from(content);

      const result = await convertToMarkdown(buffer, 'special.log', 'log');

      expect(result).toBe(content);
    });

    it('should not normalize whitespace for plaintext', async () => {
      const content = '\n{\r\n  "a": 1\r\n\n\n\n}\n';

      const result = await convertToMarkdown(
        Buffer.from(content),
        'data.json',
        'json',
      );

      expect(result).toBe(content);
    });
  });

  describe('text files', () => {
    it.each(['txt', 'md'])(
      'should return text for %s files without calling unpdf',
      async fileType => {
        const result = await convertToMarkdown(
          Buffer.from('# Heading\n\nParagraph'),
          `notes.${fileType}`,
          fileType,
        );

        expect(result).toBe('# Heading\n\nParagraph');
        expect(mockExtractText).not.toHaveBeenCalled();
      },
    );

    it('should normalize CRLF and CR line endings', async () => {
      const result = await convertToMarkdown(
        Buffer.from('a\r\nb\rc\n'),
        'readme.txt',
        'txt',
      );

      expect(result).toBe('a\nb\nc');
    });

    it('should trim and collapse runs of blank lines', async () => {
      const result = await convertToMarkdown(
        Buffer.from('\n\n  # Title\n\n\n\n\nBody  \n\n\n'),
        'notes.md',
        'md',
      );

      expect(result).toBe('# Title\n\nBody');
    });

    it('should strip a UTF-8 byte order mark', async () => {
      const result = await convertToMarkdown(
        Buffer.from('\uFEFFText with BOM\n'),
        'bom.txt',
        'txt',
      );

      expect(result).toBe('Text with BOM');
    });

    it.each([
      ['empty', ''],
      ['whitespace-only', '  \n\n\t\r\n'],
    ])('should throw InputError for %s text files', async (_label, content) => {
      await expect(
        convertToMarkdown(Buffer.from(content), 'empty.txt', 'txt'),
      ).rejects.toThrow(InputError);
      await expect(
        convertToMarkdown(Buffer.from(content), 'empty.txt', 'txt'),
      ).rejects.toThrow(/no output/i);
    });
  });

  describe('pdf files', () => {
    it('should extract text from pdf files via unpdf', async () => {
      mockExtractText.mockResolvedValue({
        totalPages: 1,
        text: 'Extracted text',
      });

      const result = await convertToMarkdown(
        Buffer.from('%PDF-1.7'),
        'doc.pdf',
        'pdf',
      );

      expect(result).toBe('Extracted text');
      expect(mockExtractText).toHaveBeenCalledWith(expect.any(Uint8Array), {
        mergePages: true,
      });
    });

    it('should normalize extracted text', async () => {
      mockExtractText.mockResolvedValue({
        totalPages: 2,
        text: '\nPage one\r\n\n\n\nPage two\n\n',
      });

      const result = await convertToMarkdown(
        Buffer.from('%PDF-1.7'),
        'doc.pdf',
        'pdf',
      );

      expect(result).toBe('Page one\n\nPage two');
    });

    it('should throw InputError when no text is extracted', async () => {
      mockExtractText.mockResolvedValue({ totalPages: 1, text: '  \n' });

      await expect(
        convertToMarkdown(Buffer.from('%PDF-1.7'), 'scanned.pdf', 'pdf'),
      ).rejects.toThrow(InputError);
      await expect(
        convertToMarkdown(Buffer.from('%PDF-1.7'), 'scanned.pdf', 'pdf'),
      ).rejects.toThrow(/no output/i);
    });

    it('should wrap extraction failures in InputError without echoing file content', async () => {
      const content = '%PDF-1.4 secret file content';
      mockExtractText.mockRejectedValue(new Error('Invalid PDF structure.'));

      const error = await convertToMarkdown(
        Buffer.from(content),
        'broken.pdf',
        'pdf',
      ).catch(e => e);

      expect(error).toBeInstanceOf(InputError);
      expect(error.message).toMatch(
        /Failed to extract text from broken\.pdf.*Invalid PDF structure/,
      );
      expect(error.message).not.toContain(content);
    });
  });

  describe('extension mismatch', () => {
    it('should throw InputError when file extension does not match declared type', async () => {
      await expect(
        convertToMarkdown(Buffer.from('data'), 'file.pdf', 'txt'),
      ).rejects.toThrow(InputError);
      await expect(
        convertToMarkdown(Buffer.from('data'), 'file.pdf', 'txt'),
      ).rejects.toThrow(/does not match/);
    });

    it('should throw on case-insensitive mismatch', async () => {
      await expect(
        convertToMarkdown(Buffer.from('data'), 'file.PDF', 'txt'),
      ).rejects.toThrow(/does not match/);
    });

    it('should accept when extension matches declared type', async () => {
      mockExtractText.mockResolvedValue({ totalPages: 1, text: 'ok' });

      const result = await convertToMarkdown(
        Buffer.from('data'),
        'file.pdf',
        'pdf',
      );

      expect(result).toBe('ok');
    });

    it.each([
      ['config.yml', 'yaml'],
      ['config.yaml', 'yml'],
    ])(
      'should treat .yml and .yaml as equivalent (%s as %s)',
      async (name, fileType) => {
        const content = 'key: value';

        const result = await convertToMarkdown(
          Buffer.from(content),
          name,
          fileType,
        );

        expect(result).toBe(content);
        expect(mockExtractText).not.toHaveBeenCalled();
      },
    );

    it('should accept filename without extension', async () => {
      const result = await convertToMarkdown(
        Buffer.from('data'),
        'Makefile',
        'txt',
      );

      expect(result).toBe('data');
    });
  });
});
