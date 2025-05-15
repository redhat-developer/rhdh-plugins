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
  it('should validate correct package', () => {
    const doc = parseDocument(`
        package: package1
        disabled: true
        pluginConfig:
          key: value
          key2:
            subkey:
              value
    `);
    expect(() => validatePackageFormat(doc.contents)).not.toThrow();
  });

  it("should validate missing 'disabled' and 'pluginConfig'", () => {
    const doc = parseDocument(`
      package: package1
    `);
    expect(() => validatePackageFormat(doc.contents)).not.toThrow();
  });

  it("should throw if 'package' is missing from package", () => {
    const doc = parseDocument(`
      disabled: false
    `);
    expect(() => validatePackageFormat(doc.contents)).toThrow(
      "Invalid installation configuration, 'package' field in each package item must be a non-empty string",
    );
  });

  it("should throw if 'package' is an empty string", () => {
    const doc = parseDocument(`
      package: ""
    `);
    expect(() => validatePackageFormat(doc.contents)).toThrow(
      "Invalid installation configuration, 'package' field in each package item must be a non-empty string",
    );
  });

  it("should throw if 'disabled' is not a boolean", () => {
    const doc = parseDocument(`
      package: package1
      disabled: "not a boolean"
    `);
    expect(() => validatePackageFormat(doc.contents)).toThrow(
      "Invalid installation configuration, optional 'disabled' field in each package item must be a boolean",
    );
  });

  it("should throw if 'pluginConfig' is not a map", () => {
    const doc = parseDocument(`
      package: package1
      pluginConfig: "not a map"
    `);
    expect(() => validatePackageFormat(doc.contents)).toThrow(
      "Invalid installation configuration, optional 'pluginConfig' field in each package item must be a map",
    );
  });
});
