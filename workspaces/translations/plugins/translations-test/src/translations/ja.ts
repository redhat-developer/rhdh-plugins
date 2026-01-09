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

import { createTranslationMessages } from '@backstage/core-plugin-api/alpha';
import { translationsTestTranslationRef } from './ref';

/**
 * Japanese translation for plugin.translations-test.
 * @public
 */
const quickstartTranslationJa = createTranslationMessages({
  ref: translationsTestTranslationRef,
  messages: {
    'page.title': '翻訳テストプラグイン',
    'page.subtitle': '翻訳機能と i18next 機能をテストするためのプラグイン',
    'essentials.key': 'キーの値',
    'essentials.look.deep': '深い階層の参照の値',
    'interpolation.key': '{{what}} は {{how}} です',
    'interpolation.nested.key': '{{what}} は {{how.value}} です',
    'interpolation.complex.message': 'ここに {{link}} があります。',
    'interpolation.complex.linkText': 'リンク',
    'formatting.intlNumber': 'いくつかの {{val, number}}',
    'formatting.intlNumberWithOptions':
      'いくつかの {{val, number(minimumFractionDigits: 2)}}',
    'formatting.intlDateTime': '{{val, datetime}} に',
    'formatting.intlRelativeTime': 'Lorem {{val, relativetime}}',
    'formatting.intlRelativeTimeWithOptions':
      'Lorem {{val, relativetime(quarter)}}',
    'formatting.intlRelativeTimeWithOptionsExplicit':
      'Lorem {{val, relativetime(range: quarter; style: narrow;)}}',
    'plurals.key_zero': 'ゼロ',
    'plurals.key_one': '1',
    'plurals.key_two': '2',
    'plurals.key_few': '少数',
    'plurals.key_many': '多数',
    'plurals.key_other': 'その他',
    'plurals.keyWithCount_one': '{{count}} 件の項目',
    'plurals.keyWithCount_other': '{{count}} 件の項目',
    'context.friend': '友達',
    'context.friend_male': '彼氏',
    'context.friend_female': '彼女',
    'objects.tree.res': '{{something}} を追加しました',
  },
});

export default quickstartTranslationJa;
