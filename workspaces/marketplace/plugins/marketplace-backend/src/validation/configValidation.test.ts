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
import { parseDocument } from 'yaml';
import {
  validateConfigurationFormat,
  validatePackageFormat,
  validatePluginFormat,
} from './configValidation';
import { ConfigFormatError } from '../errors/ConfigFormatError';

describe('validateConfigurationFormat', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should validate correct configuration', () => {
    const doc = parseDocument(`
      plugins:
        - package: package1
        - package: package2
          disabled: false
          integrity: dummyabcd
          pluginConfig:
            key: value
    `);
    expect(() => validateConfigurationFormat(doc)).not.toThrow();
  });

  it("should throw if 'plugins' is not a sequence", () => {
    const doc = parseDocument(`
      plugins:
        key: value
    `);
    expect(() => validateConfigurationFormat(doc)).toThrow(
      new ConfigFormatError(
        "Invalid installation configuration, 'plugins' field must be a list",
      ),
    );
  });
});

describe('validatePackageFormat', () => {
  const validYAMLs = [
    {
      testCase: 'correct package',
      yaml: `
        package: package1
        disabled: true
        pluginConfig:
          key: value
          key2:
            subkey:
              value
      `,
    },
    {
      testCase: "missing 'disabled' and 'pluginConfig'",
      yaml: `
        package: package1
      `,
    },
  ];

  validYAMLs.forEach(({ testCase, yaml }) => {
    it(`should validate ${testCase}`, () => {
      expect(() =>
        validatePackageFormat(parseDocument(yaml).contents),
      ).not.toThrow();
    });
  });

  const invalidYAMLs = [
    {
      testCase: "'package' is missing",
      yaml: `
        disabled: false
      `,
      error: "'package' field in package item must be a non-empty string",
    },
    {
      testCase: "'package' is an empty string",
      yaml: `
        package: ""
      `,
      error: "'package' field in package item must be a non-empty string",
    },
    {
      testCase: "'disabled' is not a boolean",
      yaml: `
        package: package1
        disabled: "not a boolean"
      `,
      error: "optional 'disabled' field in package item must be a boolean",
    },
    {
      testCase: "'integrity' is not a string",
      yaml: `
        package: package1
        integrity: []
      `,
      error:
        "optional 'integrity' field in package item must be a non-empty string",
    },
    {
      testCase: "'pluginConfig' is not a map",
      yaml: `
        package: package1
        pluginConfig: "not a map"
      `,
      error: "optional 'pluginConfig' field in package item must be a map",
    },
    {
      testCase: "'packageName' differs",
      yaml: `
        package: package1
        disabled: false
      `,
      error:
        "'package' field value in package item differs from 'different-package'",
      packageName: 'different-package',
    },
  ];

  invalidYAMLs.forEach(({ testCase, yaml, error, packageName }) => {
    it(`should throw if ${testCase}`, () => {
      expect(() =>
        validatePackageFormat(parseDocument(yaml).contents, packageName),
      ).toThrow(
        new ConfigFormatError(`Invalid installation configuration, ${error}`),
      );
    });
  });
});

describe('validatePluginFormat', () => {
  const pluginPackages = new Set(['package1', 'package2']);

  it('should validate correct plugin configuration', () => {
    const doc = parseDocument(`
      - package: package1
      - package: package2
        disabled: false
        pluginConfig:
          key: value
    `);
    expect(() => validatePluginFormat(doc, pluginPackages)).not.toThrow();
  });

  it('should throw if plugin is not a sequence', () => {
    const doc = parseDocument(`
      package: package1
    `);
    expect(() => validatePluginFormat(doc, pluginPackages)).toThrow(
      new ConfigFormatError(
        'Invalid installation configuration, plugin packages must be a list',
      ),
    );
  });

  it('should throw if package is not part of the plugin', () => {
    const doc = parseDocument(`
      - package: package-from-different-plugin
    `);
    expect(() => validatePluginFormat(doc, pluginPackages)).toThrow(
      new ConfigFormatError(
        "Invalid configuration, package 'package-from-different-plugin' is not part of plugin configuration",
      ),
    );
  });
});
