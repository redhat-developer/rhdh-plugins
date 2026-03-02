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
import { translationsPluginTranslationRef } from './ref';

/**
 * Japanese translation for translations.
 * @public
 */
const translationsTranslationJa = createTranslationMessages({
  ref: translationsPluginTranslationRef,
  messages: {
    'page.title': '翻訳',
    'page.subtitle': '読み込まれた翻訳の管理および表示',
    'table.title': '読み込まれた翻訳 ({{count}})',
    'table.headers.refId': '参照 ID',
    'table.headers.key': 'キー',
    'table.options.pageSize': '1 ページの項目数',
    'table.options.pageSizeOptions': '{{count}} 件の項目を表示',
    'export.title': '翻訳',
    'export.downloadButton': 'デフォルトの翻訳のダウンロード (英語)',
    'export.filename': 'translations-{{timestamp}}.json',
    'common.loading': '読み込み中...',
    'common.error': 'エラーが発生しました',
    'common.noData': '利用可能なデータはありません',
    'common.refresh': '更新',
    'language.displayFormat': '{{displayName}} ({{code}})',
  },
});

export default translationsTranslationJa;
