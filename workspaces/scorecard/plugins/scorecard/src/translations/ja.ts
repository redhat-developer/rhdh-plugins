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
import { scorecardTranslationRef } from './ref';

/**
 * Japanese translation for plugin.scorecard.
 * @public
 */
const scorecardTranslationJa = createTranslationMessages({
  ref: scorecardTranslationRef,
  messages: {
    'emptyState.title': 'スコアカードはまだ追加されていません',
    'emptyState.description':
      'スコアカードを使用すると、コンポーネントの健全性を一目で監視できます。まず、セットアップ手順に関するドキュメントを参照してください。',
    'emptyState.altText': 'スコアカードなし',
    'notFound.title': '404 該当するページが見つかりませんでした',
    'notFound.description':
      'このリポジトリーの docs ディレクトリーのルートに {{indexFile}} ファイルを追加することをお試しください。',
    'notFound.goBack': '戻る',
    'notFound.contactSupport': 'サポートにお問い合わせください',
    'notFound.altText': 'ページが見つかりません',
    'permissionRequired.title': '権限がありません',
    'permissionRequired.description':
      'スコアカードプラグインを表示するには、管理者に連絡して {{permission}} 権限を付与してもらうよう依頼してください。',
    'permissionRequired.altText': '権限が必要',
    'common.loading': '読み込み中',
    'errors.entityMissingProperties':
      'スコアカードの検索に必要なプロパティーがエンティティーにありません',
    'errors.missingAggregationId':
      'スコアカードの設定が正しくありません。集計 ID (またはメトリクス ID) プロパティーが指定されていません。',
    'errors.invalidApiResponse': 'スコアカード API からの応答形式が無効です',
    'errors.fetchError':
      'スコアカードの取得中にエラーが発生しました: {{error}}',
    'errors.invalidThresholds': '無効なしきい値',
    'errors.missingPermission': '権限がありません',
    'errors.noDataFound': 'データが見つかりません',
    'errors.authenticationError': '認証エラー',
    'errors.missingPermissionMessage':
      'スコアカードのメトリクスを表示するには、必要な権限を管理者に付与してもらう必要があります。',
    'thresholds.success': '成功',
    'thresholds.warning': '警告',
    'thresholds.error': 'エラー',
    'thresholds.exist': '存在する',
    'thresholds.missing': 'なし',
    'thresholds.noEntities': '{{category}} 状態のエンティティーはありません',
    'thresholds.entities_one': '{{count}} 個のエンティティー',
    'thresholds.entities_other': '{{count}} 個のエンティティー',
    'entitiesPage.unknownMetric': '不明なメトリクス',
    'entitiesPage.noDataFound':
      'ここにデータを表示するには、このメトリクスに関連する値がエンティティーによって報告されていることを確認してください。',
  },
});

export default scorecardTranslationJa;
