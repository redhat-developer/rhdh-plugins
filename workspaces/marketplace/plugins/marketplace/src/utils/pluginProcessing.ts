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

import { DynamicPluginInfo } from '../api';

// Helper function to convert package name to readable display name
export const getReadableName = (packageName: string): string => {
  // Remove common prefixes and convert to readable format
  const readableName = packageName
    .replace(/^@Red Hat Developer Hub\/Backstage Plugin\s*/, '') // Red Hat plugins (display names)
    .replace(/^@red-hat-developer-hub\/backstage-plugin-/, '') // Red Hat plugins (package names)
    .replace(/^red-hat-developer-hub-backstage-plugin-/, '') // Red Hat kebab-case
    .replace(/^@backstage-community\/plugin-/, '') // Community plugins
    .replace(/^backstage-community-plugin-/, '') // Community plugins alt
    .replace(/^@backstage\/plugin-/, '') // Official Backstage plugins
    .replace(/^backstage-plugin-/, '') // Generic backstage plugins
    .replace(/-dynamic$/, '') // Remove -dynamic suffix
    .replace(/-backend$/, '') // Remove -backend suffix
    .replace(/-frontend$/, '') // Remove -frontend suffix
    .replace(/^[\s-]+/, '') // Remove leading spaces or dashes
    .replace(/-/g, ' ') // Convert remaining dashes to spaces
    .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word

  return readableName;
};

// Helper function to extract base plugin name (without frontend/backend suffix)
export const getBasePluginName = (packageName: string): string => {
  const baseName = packageName
    .replace(/^@Red Hat Developer Hub\/Backstage Plugin\s*/, '') // Red Hat plugins (display names)
    .replace(/^@red-hat-developer-hub\/backstage-plugin-/, '') // Red Hat plugins (package names)
    .replace(/^red-hat-developer-hub-backstage-plugin-/, '') // Red Hat kebab-case
    .replace(/^@backstage-community\/plugin-/, '') // Community plugins
    .replace(/^backstage-community-plugin-/, '') // Community plugins alt
    .replace(/^@backstage\/plugin-/, '') // Official Backstage plugins
    .replace(/^backstage-plugin-/, '') // Generic backstage plugins
    .replace(/-dynamic$/, '') // Remove -dynamic suffix
    .replace(/-frontend$/, '') // Remove -frontend suffix
    .replace(/-backend$/, '') // Remove -backend suffix
    .replace(/^[\s-]+/, '') // Remove leading spaces or dashes
    .toLowerCase() // Normalize to lowercase for consistent comparison
    .replace(/\s+/g, '-'); // Convert spaces back to dashes for base name

  return baseName;
};

// Process plugins to create single rows with readable names
export const processPluginsForDisplay = (
  plugins: DynamicPluginInfo[],
): DynamicPluginInfo[] => {
  const pluginMap = new Map<string, DynamicPluginInfo>();

  plugins.forEach(plugin => {
    const basePluginName = getBasePluginName(plugin.name);
    const existingPlugin = pluginMap.get(basePluginName);

    if (
      !existingPlugin ||
      (plugin.role === 'frontend-plugin' &&
        existingPlugin.role !== 'frontend-plugin')
    ) {
      // First occurrence of this plugin OR prefer frontend over backend
      pluginMap.set(basePluginName, {
        ...plugin,
        name: getReadableName(plugin.name),
      });
    }
    // If both are frontend or both are backend, keep the first one
  });

  return Array.from(pluginMap.values());
};

// Get the count of unique plugins (after deduplication)
export const getUniquePluginsCount = (plugins: DynamicPluginInfo[]): number => {
  return processPluginsForDisplay(plugins).length;
};
