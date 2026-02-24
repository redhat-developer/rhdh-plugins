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
import { homepageMessages } from '../../../../plugins/dynamic-home-page/src/translations/ref.js';
import homepageTranslationDe from '../../../../plugins/dynamic-home-page/src/translations/de.js';
import homepageTranslationFr from '../../../../plugins/dynamic-home-page/src/translations/fr.js';
import homepageTranslationEs from '../../../../plugins/dynamic-home-page/src/translations/es.js';
import homepageTranslationIt from '../../../../plugins/dynamic-home-page/src/translations/it.js';
import homepageTranslationJa from '../../../../plugins/dynamic-home-page/src/translations/ja.js';
/* eslint-enable @backstage/no-relative-monorepo-imports */

export type HomepageMessages = typeof homepageMessages;

function transform(messages: typeof homepageTranslationDe.messages) {
  const result = Object.keys(messages).reduce((res, key) => {
    const path = key.split('.');
    const lastIndex = path.length - 1;
    path.reduce((acc, currentPath, i) => {
      acc[currentPath] =
        lastIndex === i ? messages[key] : acc[currentPath] || {};
      return acc[currentPath];
    }, res);
    return res;
  }, {});

  return result as HomepageMessages;
}

export function getTranslations(locale: string) {
  switch (locale) {
    case 'en':
      return homepageMessages;
    case 'fr':
      return transform(homepageTranslationFr.messages);
    case 'de':
      return transform(homepageTranslationDe.messages);
    case 'es':
      return transform(homepageTranslationEs.messages);
    case 'it':
      return transform(homepageTranslationIt.messages);
    case 'ja':
      return transform(homepageTranslationJa.messages);
    default:
      return homepageMessages;
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
