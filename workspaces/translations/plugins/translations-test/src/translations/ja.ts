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
 * Japanese translation for translations-test.
 * @public
 */
const quickstartTranslationJa = createTranslationMessages({
  ref: translationsTestTranslationRef,
  messages: {
    'page.title': '翻訳テストプラグイン',
    'page.subtitle': '翻訳機能と i18next の機能をテストするためのプラグイン',
    'essentials.key': 'キーの値',
    'essentials.look.deep': 'look deep の値',
    'interpolation.key': '{{what}} は {{how}} です',
    'interpolation.nested.key': '{{what}} は {{how.value}} です',
    'interpolation.complex.message': 'こちらが {{link}} です。',
    'interpolation.complex.linkText': 'リンク',
    'formatting.intlNumber': '一部の {{val, number}}',
    'formatting.intlNumberWithOptions': '一部の {{val, number(minimumFractionDigits: 2)}}',
    'formatting.intlDateTime': '{{val, datetime}} 時点',
    'formatting.intlRelativeTime': 'Lorem {{val, relativetime}}',
    'formatting.intlRelativeTimeWithOptions':
      'Lorem {{val, relativetime(quarter)}}',
    'formatting.intlRelativeTimeWithOptionsExplicit':
      'Lorem {{val, relativetime(range: quarter; style: narrow;)}}',
    'plurals.key_zero': '0 件',
    'plurals.key_one': '1 件',
    'plurals.key_two': '2 件',
    'plurals.key_few': '数件',
    'plurals.key_many': '多数',
    'plurals.key_other': 'その他',
    'plurals.keyWithCount_one': '{{count}} 個の項目',
    'plurals.keyWithCount_other': '{{count}} 個の項目',
    'context.friend': '友人',
    'context.friend_male': 'ボーイフレンド',
    'context.friend_female': 'ガールフレンド',
    'objects.tree.res': '{{something}} を追加しました',
  },
});

export default quickstartTranslationJa;
