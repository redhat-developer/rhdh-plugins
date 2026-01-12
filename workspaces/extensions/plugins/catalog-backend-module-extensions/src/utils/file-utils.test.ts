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
import glob from 'glob';
import yaml from 'js-yaml';
import { findTopmostFolder, readYamlFiles } from './file-utils';

jest.mock('fs');
jest.mock('glob');
jest.mock('js-yaml');

describe('findTopmostFolder', () => {
  const mockExistsSync = fs.existsSync as jest.Mock;
  const mockStatSync = fs.statSync as jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return the topmost occurrence of the folder', () => {
    const folderName = 'targetFolder';
    const startPath = '/Users/test/dynamic-plugins/dist/src';

    mockExistsSync.mockImplementation(folderPath => {
      return [
        '/Users/test/targetFolder',
        '/Users/test/dynamic-plugins/dist/targetFolder',
      ].includes(folderPath);
    });

    mockStatSync.mockImplementation(() => ({ isDirectory: () => true }));

    const result = findTopmostFolder(folderName, startPath);
    expect(result).toBe('/Users/test/targetFolder');
  });

  it('should return the folder if it exists at only one level', () => {
    const folderName = 'targetFolder';
    const startPath = '/Users/test/dynamic-plugins/dist/src';

    mockExistsSync.mockImplementation(
      folderPath =>
        folderPath === '/Users/test/dynamic-plugins/dist/targetFolder',
    );
    mockStatSync.mockImplementation(() => ({ isDirectory: () => true }));

    const result = findTopmostFolder(folderName, startPath);
    expect(result).toBe('/Users/test/dynamic-plugins/dist/targetFolder');
  });

  it('should return null if the folder does not exist', () => {
    const folderName = 'missingFolder';
    const startPath =
      '/Users/test/dynamic-plugins/dist/catalog-backend-module-test';

    mockExistsSync.mockReturnValue(false);

    const result = findTopmostFolder(folderName, startPath);
    expect(result).toBeNull();
  });

  it('should return root if the folder is at the root level', () => {
    const folderName = 'rootFolder';
    const startPath =
      '/Users/test/dynamic-plugins/dist/catalog-backend-module-test';

    mockExistsSync.mockImplementation(
      folderPath => folderPath === '/rootFolder',
    );
    mockStatSync.mockImplementation(() => ({ isDirectory: () => true }));

    const result = findTopmostFolder(folderName, startPath);
    expect(result).toBe('/rootFolder');
  });

  it('should warn when the folder is not found', () => {
    console.warn = jest.fn();
    const folderName = 'notFoundFolder';
    const startPath = '/Users/test/project/src';

    mockExistsSync.mockReturnValue(false);

    const result = findTopmostFolder(folderName, startPath);
    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      `Folder "notFoundFolder" not found in any parent directory`,
    );
  });
});

describe('readYamlFiles', () => {
  const mockGlobSync = glob.sync as unknown as jest.Mock;
  const mockReadFileSync = fs.readFileSync as jest.Mock;
  const mockYamlLoad = yaml.load as jest.Mock;
  const folderPath = '/path/to/yaml';

  beforeEach(() => jest.resetAllMocks());

  it('shouldparses YAML files correctly', () => {
    mockGlobSync.mockReturnValue(['file1.yaml', 'file2.yml']);
    mockReadFileSync
      .mockReturnValueOnce(
        `
kind: Plugin
name: test-plugin
`,
      )
      .mockReturnValueOnce(
        `
kind: Package
name: test-package`,
      );

    mockYamlLoad
      .mockReturnValueOnce({ kind: 'Plugin', name: 'test-plugin' })
      .mockReturnValueOnce({ kind: 'Package', name: 'test-package' });

    expect(readYamlFiles(folderPath)).toEqual([
      {
        filePath: 'file1.yaml',
        content: { kind: 'Plugin', name: 'test-plugin' },
      },
      {
        filePath: 'file2.yml',
        content: { kind: 'Package', name: 'test-package' },
      },
    ]);
  });

  it('handles YAML parsing errors', () => {
    mockGlobSync.mockReturnValue(['file1.yaml']);
    mockReadFileSync.mockReturnValue('invalid yaml');
    mockYamlLoad.mockImplementation(() => {
      throw new Error('YAML Error');
    });

    console.error = jest.fn();
    expect(readYamlFiles(folderPath)).toEqual([]);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Error parsing YAML file'),
      expect.any(Error),
    );
  });

  it('returns an empty array when no files are found', () => {
    mockGlobSync.mockReturnValue([]);
    expect(readYamlFiles(folderPath)).toEqual([]);
  });
});
