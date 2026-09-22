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
import { appDefaultsTranslationRef } from './ref';

/**
 * @internal
 */
export default createTranslationMessages({
  ref: appDefaultsTranslationRef,
  messages: {
    'catalog.emptyState.title': '利用可能なカタログ項目はありません',
    'catalog.emptyState.description':
      'カタログエンティティーがまだ存在しないか、表示権限がありません。登録が完了し、アクセス権が付与されると、ここに表示されます。',
    'catalog.emptyState.importButtonTitle': 'コンポーネントを登録',
    'catalogGraph.emptyState.title': '利用可能なカタログ項目はありません',
    'catalogGraph.emptyState.description':
      'カタログエンティティーがまだ存在しないか、表示権限がありません。登録が完了し、アクセス権が付与されると、カタロググラフがここに表示されます。',
    'catalogGraph.emptyState.importButtonTitle': 'コンポーネントを登録',
    'scaffolder.emptyState.title': '利用できるテンプレートがありません',
    'scaffolder.emptyState.description':
      'ソフトウェアテンプレートがまだ存在しないか、表示権限がありません。登録が完了し、アクセス権が付与されると、ここに表示されます。',
    'scaffolder.emptyState.importButtonTitle': 'テンプレートを登録',
    'apiDocs.emptyState.title': '利用可能な API はありません',
    'apiDocs.emptyState.description':
      'API がまだ存在しないか、表示権限がありません。登録が完了し、アクセス権が付与されると、ここに表示されます。',
    'apiDocs.emptyState.importButtonTitle': 'API を登録',
    'docs.emptyState.title': '利用可能なドキュメントがありません',
    'docs.emptyState.description':
      'ドキュメント化されたエンティティーがまだ存在しないか、表示権限がありません。TechDocs のアノテーションが付いたエンティティーが登録され、アクセス権が付与されると、ここにドキュメントが表示されます。',
    'docs.emptyState.importButtonTitle': 'コンポーネントを登録',
    'learningPaths.title': 'ラーニングパス',
    'learningPaths.error.title': 'データを取得できませんでした。',
    'learningPaths.error.unknownError': '不明なエラー',
  },
});
