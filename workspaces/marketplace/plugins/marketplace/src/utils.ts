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
        const pluginPackage = plugin.items?.find(
          (i: Pair<Scalar, Scalar>) =>
            i.key.value === 'package' && i.value?.value === packageName,
        );
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
