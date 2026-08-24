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

import { createTranslationMessages } from '@backstage/frontend-plugin-api';
import { translationRef } from './ref';

/**
 * @internal
 */
export const ja = createTranslationMessages({
  ref: translationRef,
  messages: {
    'catalog.emptyState.title': 'カタログアイテムが見つかりません',
    'catalog.emptyState.description':
      'カタログに登録されると、ここにアイテムが表示されます。',
    'catalog.emptyState.action': 'コンポーネントを登録',
    'catalogGraph.emptyState.title': 'カタログアイテムが見つかりません',
    'catalogGraph.emptyState.description':
      'カタログにエンティティが登録されると、ここにカタロググラフが表示されます。',
    'catalogGraph.emptyState.action': 'カタログへ移動',
    'scaffolder.emptyState.title': 'テンプレートがありません',
    'scaffolder.emptyState.description':
      'カタログに登録されると、ここにソフトウェアテンプレートが表示されます。',
    'scaffolder.emptyState.action': 'テンプレートを登録',
    'apiDocs.emptyState.title': 'API がありません',
    'apiDocs.emptyState.description':
      'カタログに登録されると、ここに API 定義が表示されます。',
    'apiDocs.emptyState.action': 'API を登録',
    'docs.emptyState.title': 'ドキュメントがありません',
    'docs.emptyState.description':
      'TechDocs アノテーションを持つエンティティが登録されると、ここにドキュメントが表示されます。',
    'docs.emptyState.action': '詳細を見る',
  },
});
