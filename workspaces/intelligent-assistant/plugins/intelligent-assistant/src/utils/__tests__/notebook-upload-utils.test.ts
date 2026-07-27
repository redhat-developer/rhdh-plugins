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

import { NOTEBOOK_MAX_FILE_SIZE_BYTES, NOTEBOOK_MAX_FILES } from '../../const';
import {
  getNotebookAcceptedFileTypes,
  validateFileCount,
  validateFiles,
  validateFileSize,
  validateFileType,
} from '../notebook-upload-utils';

const createFile = (name: string, size: number = 100): File =>
  new File([new ArrayBuffer(size)], name);

describe('validateFileType', () => {
  it.each(['.txt', '.log', '.md', '.pdf', '.json', '.yaml', '.yml'])(
    'should accept %s files',
    ext => {
      const file = createFile(`test${ext}`);
      expect(validateFileType(file)).toBe(true);
    },
  );

  it.each(['.exe', '.zip', '.mp4', '.jpg', '.html', '.csv'])(
    'should reject %s files',
    ext => {
      const file = createFile(`test${ext}`);
      expect(validateFileType(file)).toBe(false);
    },
  );

  it('should be case-insensitive for extensions', () => {
    expect(validateFileType(createFile('test.PDF'))).toBe(true);
    expect(validateFileType(createFile('test.Yaml'))).toBe(true);
  });

  it('should reject files with no extension', () => {
    expect(validateFileType(createFile('Makefile'))).toBe(false);
  });
});

describe('validateFileSize', () => {
  it('should accept files under the size limit', () => {
    const file = createFile('small.txt', 1024);
    expect(validateFileSize(file)).toBe(true);
  });

  it('should accept files at exactly the size limit', () => {
    const file = createFile('exact.txt', NOTEBOOK_MAX_FILE_SIZE_BYTES);
    expect(validateFileSize(file)).toBe(true);
  });

  it('should reject files over the size limit', () => {
    const file = createFile('large.txt', NOTEBOOK_MAX_FILE_SIZE_BYTES + 1);
    expect(validateFileSize(file)).toBe(false);
  });
});

describe('validateFileCount', () => {
  it('should accept when total is within limit', () => {
    expect(validateFileCount(5, 3)).toBe(true);
  });

  it('should accept when total is exactly the limit', () => {
    expect(validateFileCount(NOTEBOOK_MAX_FILES - 1, 1)).toBe(true);
  });

  it('should reject when total exceeds limit', () => {
    expect(validateFileCount(NOTEBOOK_MAX_FILES, 1)).toBe(false);
  });

  it('should reject when existing count already exceeds limit', () => {
    expect(validateFileCount(NOTEBOOK_MAX_FILES + 1, 0)).toBe(false);
  });
});

describe('validateFiles', () => {
  it('should return all valid files when everything passes', () => {
    const files = [createFile('a.txt'), createFile('b.json')];
    const result = validateFiles(files);
    expect(result.valid).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
  });

  it('should filter out unsupported file types', () => {
    const files = [createFile('a.txt'), createFile('b.exe')];
    const result = validateFiles(files);
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0].name).toBe('a.txt');
    expect(result.errors).toContain('notebook.upload.error.unsupportedType');
  });

  it('should filter out oversized files', () => {
    const files = [
      createFile('ok.txt', 100),
      createFile('big.pdf', NOTEBOOK_MAX_FILE_SIZE_BYTES + 1),
    ];
    const result = validateFiles(files);
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0].name).toBe('ok.txt');
    expect(result.errors).toContain('notebook.upload.error.fileTooLarge');
  });

  it('should reject all files when count exceeds limit', () => {
    const files = [createFile('a.txt')];
    const result = validateFiles(files, NOTEBOOK_MAX_FILES);
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toContain('notebook.upload.error.tooManyFiles');
  });

  it('should report both unsupported type and oversized errors', () => {
    const files = [
      createFile('bad.exe', 100),
      createFile('big.txt', NOTEBOOK_MAX_FILE_SIZE_BYTES + 1),
    ];
    const result = validateFiles(files);
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toContain('notebook.upload.error.unsupportedType');
    expect(result.errors).toContain('notebook.upload.error.fileTooLarge');
  });

  it('should use existingCount of 0 by default', () => {
    const files = Array.from({ length: NOTEBOOK_MAX_FILES }, (_, i) =>
      createFile(`file${i}.txt`),
    );
    const result = validateFiles(files);
    expect(result.valid).toHaveLength(NOTEBOOK_MAX_FILES);
    expect(result.errors).toHaveLength(0);
  });
});

describe('getNotebookAcceptedFileTypes', () => {
  it('should return a record of MIME types to extension arrays', () => {
    const accepted = getNotebookAcceptedFileTypes();
    expect(accepted).toHaveProperty('text/plain');
    expect(accepted).toHaveProperty('application/pdf');
    expect(accepted['text/plain']).toContain('.txt');
  });
});
