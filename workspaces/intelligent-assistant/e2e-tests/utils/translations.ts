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

// These translation files are not exported by the package, so relative imports are necessary for e2e tests
/* eslint-disable @backstage/no-relative-monorepo-imports */
import { intelligentAssistantMessages } from '../../plugins/intelligent-assistant/src/translations/ref';
import lightspeedTranslationDe from '../../plugins/intelligent-assistant/src/translations/de.js';
import lightspeedTranslationFr from '../../plugins/intelligent-assistant/src/translations/fr.js';
import lightspeedTranslationEs from '../../plugins/intelligent-assistant/src/translations/es.js';
import lightspeedTranslationIt from '../../plugins/intelligent-assistant/src/translations/it.js';
import lightspeedTranslationJa from '../../plugins/intelligent-assistant/src/translations/ja.js';
/* eslint-enable @backstage/no-relative-monorepo-imports */

export type LightspeedMessages = typeof intelligentAssistantMessages;

export function getTranslations(locale: string) {
  switch (locale) {
    case 'en':
      return intelligentAssistantMessages;
    case 'fr':
      return lightspeedTranslationFr.messages;
    case 'de':
      return lightspeedTranslationDe.messages;
    case 'es':
      return lightspeedTranslationEs.messages;
    case 'it':
      return lightspeedTranslationIt.messages;
    case 'ja':
      return lightspeedTranslationJa.messages;
    default:
      return intelligentAssistantMessages;
  }
}

export function evaluateMessage(message: string, value: string) {
  const startIndex = message.indexOf('{{');
  if (startIndex === -1) {
    return message;
  }
  const endIndex = message.indexOf('}}', startIndex + 2);
  if (endIndex === -1) {
    return message;
  }
  return (
    message.substring(0, startIndex) + value + message.substring(endIndex + 2)
  );
}

/** Renders `mcp.settings.selectedCount` for assertions (matches i18n placeholder order per locale). */
export function formatMcpSelectedCount(
  t: LightspeedMessages,
  selectedCount: number,
  totalCount: number,
): string {
  return t['mcp.settings.selectedCount']
    .replace(/\{\{selectedCount\}\}/g, String(selectedCount))
    .replace(/\{\{totalCount\}\}/g, String(totalCount));
}

/** Status cell detail for a connected server tool count (singular vs plural). */
export function formatMcpToolCountStatus(
  t: LightspeedMessages,
  toolCount: number,
): string {
  const key =
    toolCount === 1
      ? 'mcp.settings.status.oneTool'
      : 'mcp.settings.status.manyTools';
  return t[key].replace(/\{\{count\}\}/g, String(toolCount));
}
