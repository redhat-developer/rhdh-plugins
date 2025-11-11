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
import { Attachment, FileContent, SupportedFileType } from '../types';

export const isSupportedFileType = (file: File) => {
  const isJson = file.type === SupportedFileType.JSON;
  const isYaml =
    file.type === SupportedFileType.YAML ||
    file.name.endsWith('.yaml') ||
    file.name.endsWith('.yml');
  const isText = file.type === SupportedFileType.TEXT;

  return isJson || isYaml || isText;
};

export const readFileAsText = (file: File): Promise<string | null> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

export const sanitizeFileType = (fileContent: FileContent): string => {
  switch (fileContent.type) {
    case SupportedFileType.YAML:
      return 'application/yaml';
    default:
      return fileContent.type;
  }
};

export const getAttachments = (fileContents: FileContent[]): Attachment[] =>
  fileContents.map(file => ({
    attachment_type: 'api object',
    content_type: sanitizeFileType(file),
    content: fileContents.find(f => f.name === file.name)?.content || '',
  }));
