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
import { Document, isMap, isSeq, type YAMLMap } from 'yaml';
import { ConfigFormatError } from '../errors/ConfigFormatError';
import type { JsonValue } from '@backstage/types';

export function validateConfigurationFormat(
  doc: Document,
): asserts doc is Document & {
  contents: YAMLMap<string, JsonValue>;
} {
  const plugins = doc.get('plugins');

  if (!isSeq(plugins))
    throw new ConfigFormatError(
      "Failed to load 'extensions.installation.saveToSingleFile.file'. Invalid installation configuration, 'plugins' field must be a list",
    );
  for (const item of plugins.items) {
    validatePackageFormat(item);
  }
}

export function validatePackageFormat(
  item: unknown,
): asserts item is YAMLMap<string, JsonValue> {
  if (!isMap(item)) {
    throw new ConfigFormatError(
      "Invalid installation configuration, each package item in the 'plugins' list must be a map",
    );
  }

  const packageName = item.get('package');
  if (typeof packageName !== 'string' || packageName.trim() === '') {
    throw new ConfigFormatError(
      "Invalid installation configuration, 'package' field in each package item must be a non-empty string",
    );
  }

  const disabled = item.get('disabled');
  if (disabled && typeof disabled !== 'boolean') {
    throw new ConfigFormatError(
      "Invalid installation configuration, optional 'disabled' field in each package item must be a boolean",
    );
  }

  const pluginConfig = item.get('pluginConfig');
  if (pluginConfig && !isMap(pluginConfig)) {
    throw new ConfigFormatError(
      "Invalid installation configuration, optional 'pluginConfig' field in each package item must be a map",
    );
  }
}
