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
    'emptyState.button': 'ドキュメントの表示',
    'emptyState.altText': 'スコアカードなし',
    'permissionRequired.title': '権限がありません',
    'permissionRequired.description':
      'スコアカードプラグインを表示するには、管理者に連絡して {{permission}} 権限を付与してもらうよう依頼してください。',
    'permissionRequired.button': 'さらに表示する',
    'permissionRequired.altText': '権限が必要',
    'errors.entityMissingProperties':
      'スコアカードの検索に必要なプロパティーがエンティティーにありません',
    'errors.invalidApiResponse': 'スコアカード API からの応答形式が無効です',
    'errors.fetchError':
      'スコアカードの取得中にエラーが発生しました: {{error}}',
    'errors.metricDataUnavailable': 'メトリクスデータがありません',
    'errors.invalidThresholds': '無効なしきい値',
    'errors.missingPermission': '権限がありません',
    'errors.missingPermissionMessage':
      'スコアカードのメトリクスを表示するには、管理者に権限を付与してもらうよう依頼してください。',
    'errors.userNotFoundInCatalogMessage':
      'ユーザーエンティティーがカタログに見つかりません',
    'metric.github.open_prs.title': 'GitHub のオープン状態の PR',
    'metric.github.open_prs.description':
      '特定の GitHub リポジトリーにおけるオープン状態のプルリクエストの数。',
    'metric.jira.open_issues.title':
      'Jira のオープン状態の進行を妨げているチケット',
    'metric.jira.open_issues.description':
      'Jira で現在オープン状態になっている、重大かつ進行を妨げている課題の数を明示します。',
    'thresholds.success': '成功',
    'thresholds.warning': '警告',
    'thresholds.error': 'エラー',
    'thresholds.noEntities': '{{category}} 状態のエンティティーがありません',
    'thresholds.entities_one': '{{count}} エンティティー',
    'thresholds.entities_other': '{{count}} エンティティー',
  },
});

export default scorecardTranslationJa;
