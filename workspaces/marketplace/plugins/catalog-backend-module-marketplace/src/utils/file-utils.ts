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
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import yaml from 'js-yaml';
import { Entity } from '@backstage/catalog-model';
import { JsonFileData } from '../types';

export const findTopmostFolder = (
  folderName: string,
  startPath = process.cwd(),
): string | null => {
  let currentPath = path.resolve(startPath);
  let topmostFoundPath: string | null = null;

  while (currentPath !== path.parse(currentPath).root) {
    const targetFolderPath = path.join(currentPath, folderName);
    if (
      fs.existsSync(targetFolderPath) &&
      fs.statSync(targetFolderPath).isDirectory()
    ) {
      topmostFoundPath = targetFolderPath;
    }
    currentPath = path.dirname(currentPath);
  }
  const targetFolderPath = path.join(currentPath, folderName);

  if (
    fs.existsSync(targetFolderPath) &&
    fs.statSync(targetFolderPath).isDirectory()
  ) {
    topmostFoundPath = targetFolderPath;
  }

  if (!topmostFoundPath) {
    console.warn(`Folder "${folderName}" not found in any parent directory`);
  }

  return topmostFoundPath;
};

export const readYamlFiles = <T extends Entity>(
  folderPath: string,
): JsonFileData<T>[] => {
  const yamlFiles = glob.sync(path.join(folderPath, '**/*.@(yaml|yml)'));
  const jsonFiles: JsonFileData<T>[] = [];

  yamlFiles.forEach(filePath => {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const jsonData = yaml.load(fileContent);
      jsonFiles.push({ filePath, content: jsonData as unknown as T });
    } catch (error) {
      console.error(`Error parsing YAML file: ${filePath}`, error);
    }
  });

  return jsonFiles;
};
