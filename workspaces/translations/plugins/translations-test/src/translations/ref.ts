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

import { createTranslationRef } from '@backstage/core-plugin-api/alpha';

/**
 * @public
 */
export const translationsTestMessages = {
  page: {
    title: 'Translations Test Plugin',
    subtitle:
      'A plugin to test translations functionality and i18next features',
  },
  essentials: {
    key: 'value of key',
    look: {
      deep: 'value of look deep',
    },
  },
  interpolation: {
    key: '{{what}} is {{how}}',
    nested: {
      key: '{{what}} is {{how.value}}',
    },
    complex: {
      message: 'Here is a {{link}}.',
      linkText: 'link',
    },
  },
  formatting: {
    intlNumber: 'Some {{val, number}}',
    intlNumberWithOptions: 'Some {{val, number(minimumFractionDigits: 2)}}',
    intlDateTime: 'On the {{val, datetime}}',
    intlRelativeTime: 'Lorem {{val, relativetime}}',
    intlRelativeTimeWithOptions: 'Lorem {{val, relativetime(quarter)}}',
    intlRelativeTimeWithOptionsExplicit:
      'Lorem {{val, relativetime(range: quarter; style: narrow;)}}',
  },
  // not fully supported in backstage
  plurals: {
    key_zero: 'zero',
    key_one: 'one',
    key_two: 'two',
    key_few: 'few',
    key_many: 'many',
    key_other: 'other',
    keyWithCount_one: '{{count}} item',
    keyWithCount_other: '{{count}} items',
  },
  context: {
    friend: 'A friend',
    friend_male: 'A boyfriend',
    friend_female: 'A girlfriend',
  },
  // not working in backstage
  objects: {
    tree: {
      res: 'added {{something}}',
    },
  },
  // not working in backstage
  arrays: {
    array: ['a', 'b', 'c'] as any as string,
  },
};

/**
 * @public
 */
export const translationsTestTranslationRef = createTranslationRef({
  id: 'plugin.translations-test',
  messages: translationsTestMessages,
});
