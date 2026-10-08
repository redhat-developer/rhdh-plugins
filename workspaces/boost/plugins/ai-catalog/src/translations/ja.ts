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
import { aiCatalogTranslationRef } from './ref';

/**
 * ja translation for plugin.ai-catalog.
 * @public
 */
const aiCatalogTranslationJa = createTranslationMessages({
  ref: aiCatalogTranslationRef,
  messages: {
    'catalog.page.title': 'AIカタログ',
    'catalog.toolbar.allPrefix': 'すべて',
    'catalog.toolbar.search': '検索',
    'catalog.toolbar.viewGrid': 'カードビュー',
    'catalog.toolbar.viewTable': 'テーブルビュー',
    'catalog.toolbar.filters': 'フィルター',
    'catalog.filter.title': 'フィルター',
    'catalog.filter.all': 'すべて',
    'catalog.filter.type': 'タイプ',
    'catalog.filter.provider': 'プロバイダー',
    'catalog.filter.owner': 'オーナー',
    'catalog.filter.tag': 'タグ',
    'catalog.filter.clearAll': 'すべてクリア',
    'catalog.card.assetDetailsTitle': 'AIアセットの詳細',
    'catalog.card.descriptionLabel': '説明',
    'catalog.card.viewDetails': '{{title}} の詳細を表示',
    'catalog.card.tagsLabel': 'タグ',
    'catalog.card.providerLabel': 'プロバイダー',
    'catalog.card.usageTitle': '使用方法',
    'catalog.card.versionLabel': 'バージョン',
    'catalog.card.usageDownloadZip': 'ZIPをダウンロード',
    'catalog.card.usageViewSource': 'ソースを表示',
    'catalog.card.serverTypeLabel': 'サーバータイプ',
    'catalog.card.apiKeyLabel': 'APIキーが必要',
    'catalog.card.defaultModelLabel': 'デフォルトモデル',
    'catalog.card.rationaleLabel': '根拠',
    'catalog.card.disciplinesLabel': '分野',
    'catalog.card.categoriesLabel': 'カテゴリー',
    'catalog.card.relatedAgentsLabel': '関連エージェント',
    'catalog.card.ruleCategoryLabel': 'ルールカテゴリー',
    'catalog.card.toolsLabel': 'ツール',
    'catalog.card.remotesLabel': 'リモートエンドポイント',
    'catalog.card.definitionLabel': '定義',
    'catalog.card.modelsTitle': 'モデル',
    'catalog.card.modelTitle': 'モデル',
    'catalog.card.viewModels': 'すべてのモデルを表示',
    'catalog.card.modelsDialogTitle': '利用可能なモデル',
    'catalog.card.modelSearch': 'モデルを検索',
    'catalog.card.noModelsMatch': '検索に一致するモデルはありません。',
    'catalog.card.instructionsTitle': 'エージェントの指示',
    'catalog.card.handoffDescriptionTitle': 'ハンドオフの説明',
    'catalog.card.handoffTargetsTitle': 'ハンドオフ先',
    'catalog.card.ragEnabledLabel': 'RAG有効',
    'catalog.card.yes': 'はい',
    'catalog.card.no': 'いいえ',
    'catalog.table.name': '名前',
    'catalog.table.type': 'タイプ',
    'catalog.table.owner': 'オーナー',
    'catalog.table.provider': 'プロバイダー',
    'catalog.table.description': '説明',
    'catalog.empty.title': '利用可能なAIアセットはありません',
    'catalog.empty.description':
      'AIアセットは、カタログから公開または同期された後にここに表示されます。初回の読み込みには少し時間がかかる場合があります。',
    'catalog.empty.refresh': '更新',
    'catalog.empty.learnMore': '公開方法を学ぶ',
    'catalog.emptyFiltered.title': 'フィルターに一致するAIアセットはありません',
    'catalog.emptyFiltered.description':
      '検索条件やフィルター条件を調整して、お探しのものを見つけてください。',
    'catalog.emptyFiltered.clearFilters': 'フィルターをクリア',
    'catalog.error.title': 'AIアセットの読み込みに失敗しました',
    'catalog.error.description':
      'カタログへの接続中に問題が発生しました。ネットワーク接続を確認して、もう一度お試しください。',
    'catalog.error.retry': '再試行',
    'nav.aiCatalog': 'AIカタログ',
  },
});

export default aiCatalogTranslationJa;
