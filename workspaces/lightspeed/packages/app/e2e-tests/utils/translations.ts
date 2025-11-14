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
import { lightspeedMessages } from '../../../../plugins/lightspeed/src/translations/ref';
import lightspeedTranslationDe from '../../../../plugins/lightspeed/src/translations/de.js';
import lightspeedTranslationFr from '../../../../plugins/lightspeed/src/translations/fr.js';
import lightspeedTranslationEs from '../../../../plugins/lightspeed/src/translations/es.js';
/* eslint-enable @backstage/no-relative-monorepo-imports */

export type LightspeedMessages = typeof lightspeedMessages;

export function getTranslations(locale: string) {
  switch (locale) {
    case 'en':
      return lightspeedMessages;
    case 'fr':
      return lightspeedTranslationFr.messages;
    case 'de':
      return lightspeedTranslationDe.messages;
    case 'es':
      return lightspeedTranslationEs.messages;
    default:
      return lightspeedMessages;
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
