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

// Message objects are not re-exported from the plugin package; load the same modules as the UI.
/* eslint-disable @backstage/no-relative-monorepo-imports */
import { lightspeedMessages } from '../../plugins/lightspeed/src/translations/ref';
import lightspeedTranslationDe from '../../plugins/lightspeed/src/translations/de';
import lightspeedTranslationEs from '../../plugins/lightspeed/src/translations/es';
import lightspeedTranslationFr from '../../plugins/lightspeed/src/translations/fr';
import lightspeedTranslationIt from '../../plugins/lightspeed/src/translations/it';
import lightspeedTranslationJa from '../../plugins/lightspeed/src/translations/ja';
/* eslint-enable @backstage/no-relative-monorepo-imports */

export type LightspeedMessages = typeof lightspeedMessages;

/** Locale messages from `plugins/lightspeed/src/translations` (same source as the running app). */
export function getTranslations(locale: string): LightspeedMessages {
  const lang = locale.split('-')[0]?.toLowerCase() ?? 'en';
  switch (lang) {
    case 'de':
      return lightspeedTranslationDe.messages;
    case 'es':
      return lightspeedTranslationEs.messages;
    case 'fr':
      return lightspeedTranslationFr.messages;
    case 'it':
      return lightspeedTranslationIt.messages;
    case 'ja':
      return lightspeedTranslationJa.messages;
    default:
      return lightspeedMessages;
  }
}
