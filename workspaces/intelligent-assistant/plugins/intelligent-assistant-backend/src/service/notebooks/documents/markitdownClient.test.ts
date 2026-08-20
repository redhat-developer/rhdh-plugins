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

import { convertToMarkdown } from './markitdownClient';

jest.mock('markitdown-ts', () => {
  const convertBuffer = jest.fn();
  return {
    MarkItDown: jest.fn(() => ({ convertBuffer })),
    __mockConvertBuffer: convertBuffer,
  };
});

function getMockConvertBuffer(): jest.Mock {
  return require('markitdown-ts').__mockConvertBuffer;
}

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
        expect(getMockConvertBuffer()).not.toHaveBeenCalled();
      },
    );

    it('should handle uppercase plaintext file type', async () => {
      const buffer = Buffer.from('{"key": "value"}');

      const result = await convertToMarkdown(buffer, 'data.JSON', 'JSON');

      expect(result).toBe('{"key": "value"}');
      expect(getMockConvertBuffer()).not.toHaveBeenCalled();
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
  });

  describe('markitdown conversion', () => {
    it('should convert non-plaintext files via markitdown', async () => {
      getMockConvertBuffer().mockResolvedValue({
        markdown: '# Converted Content',
      });

      const result = await convertToMarkdown(
        Buffer.from('binary data'),
        'doc.pdf',
        'pdf',
      );

      expect(result).toBe('# Converted Content');
      expect(getMockConvertBuffer()).toHaveBeenCalledWith(expect.any(Buffer), {
        file_extension: '.pdf',
      });
    });

    it('should convert txt files via markitdown', async () => {
      getMockConvertBuffer().mockResolvedValue({
        markdown: 'plain text content',
      });

      const result = await convertToMarkdown(
        Buffer.from('plain text content'),
        'readme.txt',
        'txt',
      );

      expect(result).toBe('plain text content');
      expect(getMockConvertBuffer()).toHaveBeenCalled();
    });

    it('should convert md files via markitdown', async () => {
      getMockConvertBuffer().mockResolvedValue({
        markdown: '# Heading\n\nParagraph',
      });

      const result = await convertToMarkdown(
        Buffer.from('# Heading\n\nParagraph'),
        'notes.md',
        'md',
      );

      expect(result).toBe('# Heading\n\nParagraph');
    });

    it('should throw InputError when conversion produces no output', async () => {
      getMockConvertBuffer().mockResolvedValue({ markdown: '' });

      await expect(
        convertToMarkdown(Buffer.from('data'), 'bad.pdf', 'pdf'),
      ).rejects.toThrow(InputError);
      await expect(
        convertToMarkdown(Buffer.from('data'), 'bad.pdf', 'pdf'),
      ).rejects.toThrow(/no output/i);
    });

    it('should throw InputError when conversion returns null result', async () => {
      getMockConvertBuffer().mockResolvedValue(null);

      await expect(
        convertToMarkdown(Buffer.from('data'), 'bad.pdf', 'pdf'),
      ).rejects.toThrow(InputError);
    });

    it('should throw InputError when markdown field is undefined', async () => {
      getMockConvertBuffer().mockResolvedValue({});

      await expect(
        convertToMarkdown(Buffer.from('data'), 'bad.pdf', 'pdf'),
      ).rejects.toThrow(InputError);
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
      getMockConvertBuffer().mockResolvedValue({ markdown: 'ok' });

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
        expect(getMockConvertBuffer()).not.toHaveBeenCalled();
      },
    );

    it('should accept filename without extension', async () => {
      getMockConvertBuffer().mockResolvedValue({ markdown: 'ok' });

      const result = await convertToMarkdown(
        Buffer.from('data'),
        'Makefile',
        'txt',
      );

      expect(result).toBe('ok');
    });
  });
});
