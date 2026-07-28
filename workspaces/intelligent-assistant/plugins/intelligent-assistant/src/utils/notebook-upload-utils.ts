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

import {
  NOTEBOOK_ALLOWED_EXTENSIONS,
  NOTEBOOK_MAX_FILE_SIZE_BYTES,
  NOTEBOOK_MAX_FILES,
} from '../const';

const getAllowedExtensions = (): string[] =>
  Object.values(NOTEBOOK_ALLOWED_EXTENSIONS).flat();

const getFileExtension = (fileName: string): string => {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot >= 0 ? fileName.slice(lastDot).toLowerCase() : '';
};

export type FileValidationResult = {
  valid: File[];
  errors: string[];
};

export const validateFileType = (file: File): boolean => {
  const ext = getFileExtension(file.name);
  return getAllowedExtensions().includes(ext);
};

export const validateFileSize = (file: File): boolean =>
  file.size <= NOTEBOOK_MAX_FILE_SIZE_BYTES;

export const validateFileCount = (
  existingCount: number,
  newCount: number,
): boolean => existingCount + newCount <= NOTEBOOK_MAX_FILES;

export const validateFiles = (
  files: File[],
  existingCount: number = 0,
): FileValidationResult => {
  const errors: string[] = [];
  const valid: File[] = [];

  if (!validateFileCount(existingCount, files.length)) {
    errors.push('notebook.upload.error.tooManyFiles');
    return { valid: [], errors };
  }

  const oversizedFiles: string[] = [];
  const unsupportedFiles: string[] = [];

  for (const file of files) {
    let isValid = true;

    if (!validateFileType(file)) {
      unsupportedFiles.push(file.name);
      isValid = false;
    }

    if (!validateFileSize(file)) {
      oversizedFiles.push(file.name);
      isValid = false;
    }

    if (isValid) {
      valid.push(file);
    }
  }

  if (unsupportedFiles.length > 0) {
    errors.push('notebook.upload.error.unsupportedType');
  }

  if (oversizedFiles.length > 0) {
    errors.push('notebook.upload.error.fileTooLarge');
  }

  return { valid, errors };
};

export const getNotebookAcceptedFileTypes = (): Record<string, string[]> =>
  NOTEBOOK_ALLOWED_EXTENSIONS;
