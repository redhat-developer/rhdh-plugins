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
import { globalFloatingActionButtonTranslationRef } from './ref';

/**
 * Japanese translation for plugin.global-floating-action-button.
 * @public
 */
const globalFloatingActionButtonTranslationJa = createTranslationMessages({
  ref: globalFloatingActionButtonTranslationRef,
  messages: {
    'fab.create.label': '作成',
    'fab.create.tooltip': 'エンティティーの作成',
    'fab.docs.label': 'ドキュメント',
    'fab.docs.tooltip': 'ドキュメント',
    'fab.apis.label': 'API',
    'fab.apis.tooltip': 'API ドキュメント',
    'fab.github.label': 'GitHub',
    'fab.github.tooltip': 'GitHub リポジトリー',
    'fab.bulkImport.label': '一括インポート',
    'fab.bulkImport.tooltip': '複数のリポジトリーを一括登録する',
    'fab.quay.label': 'Quay',
    'fab.quay.tooltip': 'Quay コンテナーレジストリー',
    'fab.menu.tooltip': 'メニュー',
  },
});

export default globalFloatingActionButtonTranslationJa;
