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
export default createTranslationMessages({
  ref: translationRef,
  messages: {
    'catalog.emptyState.title': 'カタログアイテムがありません',
    'catalog.emptyState.description':
      'カタログエンティティがまだ存在しないか、閲覧する権限がありません。登録され、アクセス権を得ると、ここに表示されます。',
    'catalog.emptyState.action': 'コンポーネントを登録',
    'catalogGraph.emptyState.title': 'カタログアイテムがありません',
    'catalogGraph.emptyState.description':
      'カタログエンティティがまだ存在しないか、閲覧する権限がありません。登録され、アクセス権を得ると、ここにカタロググラフが表示されます。',
    'catalogGraph.emptyState.action': 'カタログへ移動',
    'scaffolder.emptyState.title': 'テンプレートがありません',
    'scaffolder.emptyState.description':
      'ソフトウェアテンプレートがまだ存在しないか、閲覧する権限がありません。登録され、アクセス権を得ると、ここに表示されます。',
    'scaffolder.emptyState.action': 'テンプレートを登録',
    'apiDocs.emptyState.title': 'API がありません',
    'apiDocs.emptyState.description':
      'API がまだ存在しないか、閲覧する権限がありません。登録され、アクセス権を得ると、ここに表示されます。',
    'apiDocs.emptyState.action': 'API を登録',
    'docs.emptyState.title': 'ドキュメントがありません',
    'docs.emptyState.description':
      'ドキュメント化されたエンティティがまだ存在しないか、閲覧する権限がありません。TechDocs アノテーションを持つエンティティが登録され、アクセス権を得ると、ここにドキュメントが表示されます。',
    'docs.emptyState.action': '詳細を見る',
  },
});
