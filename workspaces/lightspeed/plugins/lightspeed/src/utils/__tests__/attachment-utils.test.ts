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
import { FileContent } from '../../types';
import {
  getAttachments,
  isSupportedFileType,
  readFileAsText,
} from '../attachment-utils';

describe('isSupportedFileType', () => {
  it('should return true for JSON file by type', () => {
    const file = new File(['{}'], 'test.json', { type: 'application/json' });
    expect(isSupportedFileType(file)).toBe(true);
  });

  it('should return true for YAML file by type', () => {
    const file = new File(['key: value'], 'test.yaml', {
      type: 'application/x-yaml',
    });
    expect(isSupportedFileType(file)).toBe(true);
  });

  it('should return true for YAML file by extension .yaml', () => {
    const file = new File(['key: value'], 'test.yaml', {
      type: 'unknown/type',
    });
    expect(isSupportedFileType(file)).toBe(true);
  });

  it('should return true for YAML file by extension .yml', () => {
    const file = new File(['key: value'], 'test.yml', { type: 'unknown/type' });
    expect(isSupportedFileType(file)).toBe(true);
  });

  it('should return true for plain text file', () => {
    const file = new File(['hello world'], 'test.txt', { type: 'text/plain' });
    expect(isSupportedFileType(file)).toBe(true);
  });

  it('should return false for unsupported file type', () => {
    const file = new File(['<html></html>'], 'test.html', {
      type: 'text/html',
    });
    expect(isSupportedFileType(file)).toBe(false);
  });
});

describe('readFileAsText', () => {
  const file = new File(['Hello World'], 'hello.txt', { type: 'text/plain' });

  let mockFileReader: Partial<FileReader>;

  beforeEach(() => {
    mockFileReader = {
      error: null,
      readAsText: jest.fn(),
      onload: null,
      onerror: null,
      result: 'Hello World',
    };

    global.FileReader = jest.fn(() => mockFileReader as FileReader) as any;
  });

  it('should resolve with file content', async () => {
    const promise = readFileAsText(file);

    (mockFileReader as FileReader).onload?.({} as ProgressEvent<FileReader>);

    await expect(promise).resolves.toBe('Hello World');
  });

  it('should reject on file read error', async () => {
    const error = new Error('File Read error');
    (mockFileReader as any).error = error as DOMException;

    const promise = readFileAsText(file);

    (mockFileReader as FileReader).onerror?.({} as ProgressEvent<FileReader>);

    await expect(promise).rejects.toThrow('File Read error');
  });
});

describe('getAttachments', () => {
  it('should return an array of attachments', () => {
    const fileContents: FileContent[] = [
      {
        name: 'file1.json',
        type: 'application/json',
        content: '{"key": "value"}',
      },
      { name: 'file2.yaml', type: 'application/x-yaml', content: 'key: value' },
      {
        name: 'file3.yaml',
        type: 'application/x-yaml',
        content: undefined as any,
      },
    ];

    const attachments = getAttachments(fileContents);

    expect(attachments).toEqual([
      {
        attachment_type: 'api object',
        content_type: 'application/json',
        content: '{"key": "value"}',
      },
      {
        attachment_type: 'api object',
        content_type: 'application/yaml',
        content: 'key: value',
      },
      {
        attachment_type: 'api object',
        content_type: 'application/yaml',
        content: '',
      },
    ]);
  });
});
