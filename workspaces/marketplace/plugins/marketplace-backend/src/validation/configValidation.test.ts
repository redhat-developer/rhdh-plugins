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
} from './configValidation';

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
      "Failed to load 'extensions.installation.saveToSingleFile.file'. Invalid installation configuration, 'plugins' field must be a list",
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
      error: "'package' field in each package item must be a non-empty string",
    },
    {
      testCase: "'package' is an empty string",
      yaml: `
        package: ""
      `,
      error: "'package' field in each package item must be a non-empty string",
    },
    {
      testCase: "'disabled' is not a boolean",
      yaml: `
        package: package1
        disabled: "not a boolean"
      `,
      error: "optional 'disabled' field in each package item must be a boolean",
    },
    {
      testCase: "'pluginConfig' is not a map",
      yaml: `
        package: package1
        pluginConfig: "not a map"
      `,
      error: "optional 'pluginConfig' field in each package item must be a map",
    },
  ];

  invalidYAMLs.forEach(({ testCase, yaml, error }) => {
    it(`should throw if ${testCase}`, () => {
      expect(() => validatePackageFormat(parseDocument(yaml).contents)).toThrow(
        `Invalid installation configuration, ${error}`,
      );
    });
  });
});
