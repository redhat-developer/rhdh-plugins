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
import { boostMessages } from '../../plugins/boost/src/translations/ref.js';
import boostTranslationDe from '../../plugins/boost/src/translations/de.js';
import boostTranslationEs from '../../plugins/boost/src/translations/es.js';
import boostTranslationFr from '../../plugins/boost/src/translations/fr.js';
import boostTranslationIt from '../../plugins/boost/src/translations/it.js';
import boostTranslationJa from '../../plugins/boost/src/translations/ja.js';
/* eslint-enable @backstage/no-relative-monorepo-imports */

export type BoostMessages = typeof boostMessages;

function transformFlatMessagesIntoTree(flatMessages: Record<string, string>) {
  const messages = {} as Record<string, any>;
  for (const key of Object.keys(flatMessages)) {
    const path = key.split('.');
    let current = messages;
    for (let i = 0; i < path.length - 1; i++) {
      current[path[i]] = current[path[i]] || {};
      current = current[path[i]] as Record<string, any>;
    }
    current[path[path.length - 1]] =
      flatMessages[key as keyof typeof flatMessages];
  }
  return messages as BoostMessages;
}

export function getTranslations(locale: string): BoostMessages {
  switch (locale) {
    case 'en':
      return boostMessages;
    case 'de':
      return transformFlatMessagesIntoTree(boostTranslationDe.messages);
    case 'es':
      return transformFlatMessagesIntoTree(boostTranslationEs.messages);
    case 'fr':
      return transformFlatMessagesIntoTree(boostTranslationFr.messages);
    case 'it':
      return transformFlatMessagesIntoTree(boostTranslationIt.messages);
    case 'ja':
      return transformFlatMessagesIntoTree(boostTranslationJa.messages);
    default:
      return boostMessages;
  }
}
