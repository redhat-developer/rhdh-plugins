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
import { aiExperienceMessages } from '../../../../plugins/ai-experience/src/translations/ref';
import aiExperienceTranslationDe from '../../../../plugins/ai-experience/src/translations/de';
import aiExperienceTranslationFr from '../../../../plugins/ai-experience/src/translations/fr';
import aiExperienceTranslationEs from '../../../../plugins/ai-experience/src/translations/es';
import aiExperienceTranslationIt from '../../../../plugins/ai-experience/src/translations/it';
import aiExperienceTranslationJa from '../../../../plugins/ai-experience/src/translations/ja';
/* eslint-enable @backstage/no-relative-monorepo-imports */

export type AiExperienceMessages = typeof aiExperienceMessages;

function transform(messages: typeof aiExperienceTranslationDe.messages) {
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(messages)) {
    const path = key.split('.');
    let current = result;

    for (let index = 0; index < path.length; index++) {
      const segment = path[index];
      if (index === path.length - 1) {
        current[segment] = messages[key];
        break;
      }

      if (!current[segment]) {
        current[segment] = {};
      }
      current = current[segment] as Record<string, unknown>;
    }
  }

  return result as AiExperienceMessages;
}

export function getTranslations(locale: string) {
  const languageCode = locale.split('-')[0].toLowerCase();

  switch (languageCode) {
    case 'en':
      return aiExperienceMessages;
    case 'de':
      return transform(aiExperienceTranslationDe.messages);
    case 'fr':
      return transform(aiExperienceTranslationFr.messages);
    case 'es':
      return transform(aiExperienceTranslationEs.messages);
    case 'it':
      return transform(aiExperienceTranslationIt.messages);
    case 'ja':
      return transform(aiExperienceTranslationJa.messages);
    default:
      return aiExperienceMessages;
  }
}
