/*
 * Copyright The Backstage Authors
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

import { Pair, parseDocument, Scalar, YAMLSeq, stringify } from 'yaml';
import { JsonObject } from '@backstage/types';
import { MarketplacePluginInstallStatus } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { TranslationFunction } from '@backstage/core-plugin-api/alpha';
import { marketplaceTranslationRef } from './translations';
import { PluginPermissions, Permission } from './types';

export enum ExtensionsStatus {
  INSTALLATION_DISABLED_IN_PRODUCTION = 'INSTALLATION_DISABLED_IN_PRODUCTION',
  INSTALLATION_DISABLED = 'INSTALLATION_DISABLED',
  FILE_CONFIG_VALUE_MISSING = 'FILE_CONFIG_VALUE_MISSING',
  FILE_NOT_EXISTS = 'FILE_NOT_EXISTS',
  INVALID_CONFIG = 'INVALID_CONFIG',
  UNKNOWN = 'UNKNOWN',
}

export const DYNAMIC_PLUGIN_CONFIG_YAML = `plugins:
  - package: ./dynamic-plugins/dist/red-hat-developer-hub-backstage-plugin-bulk-import-backend-dynamic
    disabled: false
  - package: ./dynamic-plugins/dist/red-hat-developer-hub-backstage-plugin-bulk-import
    disabled: true`;

export const EXTENSIONS_CONFIG_YAML = `extensions:
  installation:
    enabled: true
    saveToSingleFile:
      file: /<path-to>/dynamic-plugins.yaml`;

const getExtensionsConfigLine = (str: string) =>
  EXTENSIONS_CONFIG_YAML.split('\n').findIndex(line => line.includes(str));

const generateFileConfigLineNumbers = () => {
  const line = getExtensionsConfigLine(`saveToSingleFile:`) + 1;
  return Array.from(Array(line).keys(), i => i + line);
};

const generateFilePathLineNumbers = () => {
  const line = getExtensionsConfigLine(`file:`) + 1;
  return Array.from(Array(line).keys(), i => i + line);
};

export const generateExtensionsEnableLineNumbers = () => {
  const line = getExtensionsConfigLine(`extensions:`);
  return Array.from(Array(line + 3).keys(), i => i + (line + 1));
};

export const getExampleAsMarkdown = (content: string | JsonObject) => {
  if (!content) {
    return '';
  }
  if (typeof content === 'string') {
    return `\`\`\`yaml\n${content}\n\`\`\``;
  }
  if (Object.entries(content).length === 0) {
    return '';
  }
  const yamlString = stringify(content);
  return `\`\`\`yaml\n${yamlString}\n\`\`\``;
};

export const applyContent = (
  editorContent: string,
  packageName: string,
  otherPackageNames: { [key: string]: string },
  newContent: string | JsonObject,
) => {
  if (!editorContent) {
    return null;
  }
  const content = parseDocument(editorContent);
  const plugins = content.get('plugins');

  if (plugins instanceof YAMLSeq && Array.isArray(plugins?.items)) {
    (plugins?.items || []).forEach((plugin: any) => {
      if (plugin instanceof Object) {
        const pluginPackage = plugin.items?.find((i: Pair<Scalar, Scalar>) => {
          return (
            i.key.value === 'package' &&
            i.value?.value === otherPackageNames[`${packageName}`]
          );
        });
        if (pluginPackage) {
          if (typeof newContent === 'string') {
            plugin.set('pluginConfig', parseDocument(newContent));
          } else {
            plugin.set('pluginConfig', newContent);
          }
        }
      }
    });
  }
  return content.toString();
};

export const getErrorMessage = (
  reason: ExtensionsStatus,
  message: string,
  t: TranslationFunction<typeof marketplaceTranslationRef.T>,
) => {
  if (reason === ExtensionsStatus.FILE_CONFIG_VALUE_MISSING) {
    return {
      title: t('errors.missingConfigFile'),
      message: t('errors.missingConfigMessage' as any, { message }),
      highlightedLineNumbers: generateFileConfigLineNumbers(),
    };
  }
  if (reason === ExtensionsStatus.INVALID_CONFIG) {
    return {
      title: t('errors.invalidConfigFile'),
      message: t('errors.invalidConfigMessage' as any, { message }),
    };
  }

  if (reason === ExtensionsStatus.FILE_NOT_EXISTS) {
    return {
      title: t('errors.fileNotExists'),
      message: t('errors.fileNotExistsMessage' as any, { message }),
      highlightedLineNumbers: generateFilePathLineNumbers(),
    };
  }
  if (reason === ExtensionsStatus.UNKNOWN) {
    return {
      title: t('errors.unknownError'),
      message,
    };
  }
  return { title: '', message: '' };
};

export const getPluginActionTooltipMessage = (
  isProductionEnvironment: boolean,
  permissions: PluginPermissions | null,
  t: TranslationFunction<typeof marketplaceTranslationRef.T>,
  extensionsDisabled?: boolean,
) => {
  if (isProductionEnvironment) {
    return t('tooltips.productionDisabled');
  }
  if (extensionsDisabled) {
    return t('tooltips.extensionsDisabled');
  }
  if (
    permissions &&
    permissions.read !== Permission.ALLOW &&
    permissions.write !== Permission.ALLOW
  ) {
    return t('tooltips.noPermissions');
  }

  return '';
};

export const isPluginInstalled = (
  pluginInstallStatus: MarketplacePluginInstallStatus | undefined,
) => {
  if (!pluginInstallStatus) {
    return false;
  }
  return (
    pluginInstallStatus === MarketplacePluginInstallStatus.Installed ||
    pluginInstallStatus === MarketplacePluginInstallStatus.UpdateAvailable ||
    pluginInstallStatus === MarketplacePluginInstallStatus.PartiallyInstalled ||
    pluginInstallStatus === MarketplacePluginInstallStatus.Disabled
  );
};

export interface CategoryTagDisplayOptions {
  maxLength?: number;
}

export const getCategoryTagDisplayInfo = (
  categoryName: string,
  options: CategoryTagDisplayOptions = {},
) => {
  const { maxLength = 25 } = options;

  const shouldTruncate = categoryName.length > maxLength;
  const displayName = shouldTruncate
    ? `${categoryName.substring(0, maxLength)}...`
    : categoryName;

  return {
    displayName,
    tooltipTitle: shouldTruncate ? categoryName : '',
    shouldShowTooltip: shouldTruncate,
  };
};
