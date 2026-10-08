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

import { runFileUploads } from '../notebook-upload-runner';

const createFile = (name: string) =>
  new File(['content'], name, { type: 'text/plain' });

describe('runFileUploads', () => {
  const sessionId = 'test-session';
  const files = [createFile('a.txt'), createFile('b.txt')];

  it('should call onUploading with all files', () => {
    const mutation = {
      mutateAsync: jest.fn().mockResolvedValue({ document_id: 'doc-1' }),
    };
    const onUploading = jest.fn();

    runFileUploads(mutation, sessionId, files, { onUploading });

    expect(onUploading).toHaveBeenCalledWith(files);
  });

  it('should call mutateAsync for each file with sessionId', () => {
    const mutation = {
      mutateAsync: jest.fn().mockResolvedValue({ document_id: 'doc-1' }),
    };

    runFileUploads(mutation, sessionId, files, {});

    expect(mutation.mutateAsync).toHaveBeenCalledTimes(2);
    expect(mutation.mutateAsync).toHaveBeenCalledWith({
      sessionId,
      file: files[0],
    });
    expect(mutation.mutateAsync).toHaveBeenCalledWith({
      sessionId,
      file: files[1],
    });
  });

  it('should call onStarted with fileName and documentId on success', async () => {
    const mutation = {
      mutateAsync: jest
        .fn()
        .mockResolvedValueOnce({ document_id: 'doc-a' })
        .mockResolvedValueOnce({ document_id: 'doc-b' }),
    };
    const onStarted = jest.fn();

    runFileUploads(mutation, sessionId, files, { onStarted });

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(onStarted).toHaveBeenCalledTimes(2);
    expect(onStarted).toHaveBeenCalledWith({
      fileName: 'a.txt',
      documentId: 'doc-a',
    });
    expect(onStarted).toHaveBeenCalledWith({
      fileName: 'b.txt',
      documentId: 'doc-b',
    });
  });

  it('should call onFailed with fileName on error', async () => {
    const mutation = {
      mutateAsync: jest
        .fn()
        .mockResolvedValueOnce({ document_id: 'doc-a' })
        .mockRejectedValueOnce(new Error('upload failed')),
    };
    const onFailed = jest.fn();

    runFileUploads(mutation, sessionId, files, { onFailed });

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(onFailed).toHaveBeenCalledTimes(1);
    expect(onFailed).toHaveBeenCalledWith('b.txt');
  });

  it('should work with no callbacks provided', () => {
    const mutation = {
      mutateAsync: jest.fn().mockResolvedValue({ document_id: 'doc-1' }),
    };

    expect(() => runFileUploads(mutation, sessionId, files, {})).not.toThrow();
    expect(mutation.mutateAsync).toHaveBeenCalledTimes(2);
  });
});
