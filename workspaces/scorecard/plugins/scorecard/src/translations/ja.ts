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
    'common.loading': '読み込み中',
    'dataSourcesDialog.title': '{{title}} ソース',
    'dataSourcesDialog.close': '閉じる',
    'dataSourcesDialog.unknownPlugin': '不明',
    'dataSourcesDialog.statusTooltip':
      '値 {{value}} はしきい値 {{status}} {{expression}} に一致します',
    'dataSourcesDialog.columns.plugin': 'PLUGIN',
    'dataSourcesDialog.columns.check': 'チェック',
    'dataSourcesDialog.columns.value': '値',
    'dataSourcesDialog.columns.status': 'ステータス',
    'dataSourcesDialog.columns.lastSynced': '最終同期',
    'emptyState.altText': 'スコアカードなし',
    'emptyState.button': 'ドキュメントの表示',
    'emptyState.description':
      'スコアカードを使用すると、コンポーネントの健全性を一目で監視できます。まず、セットアップ手順に関するドキュメントを参照してください。',
    'emptyState.title': 'スコアカードはまだ追加されていません',
    'entitiesPage.entitiesTable.footer.allRows': 'すべての行',
    'entitiesPage.entitiesTable.footer.of': '/',
    'entitiesPage.entitiesTable.footer.rows_one': '{{count}} 行',
    'entitiesPage.entitiesTable.footer.rows_other': '{{count}} 行',
    'entitiesPage.entitiesTable.header.entity': 'エンティティー',
    'entitiesPage.entitiesTable.header.kind': '種類',
    'entitiesPage.entitiesTable.header.lastUpdated': '最終更新',
    'entitiesPage.entitiesTable.header.owner': '所有者',
    'entitiesPage.entitiesTable.header.status': 'ステータス',
    'entitiesPage.entitiesTable.header.value': '値',
    'entitiesPage.entitiesTable.title': 'エンティティー',
    'entitiesPage.entitiesTable.titleWithCount': 'エンティティー ({{count}})',
    'entitiesPage.entitiesTable.unavailable': '利用不可',
    'entitiesPage.metricProviderNotRegistered':
      'ID が {{metricId}} のメトリクスプロバイダーは登録されていません。',
    'entitiesPage.missingPermission':
      'スコアカードのメトリクスを表示するには、必要な権限を管理者に付与してもらう必要があります。',
    'entitiesPage.noDataFound':
      'ここにデータを表示するには、このメトリクスに関連する値がエンティティーによって報告されていることを確認してください。',
    'entitiesPage.unknownMetric': '不明なメトリクス',
    'errors.authenticationError': '認証エラー',
    'errors.authenticationErrorMessage':
      'データを表示するには、ログインしてください。',
    'errors.entityMissingProperties':
      'スコアカードの検索に必要なプロパティーがエンティティーにありません',
    'errors.fetchError':
      'スコアカードの取得中にエラーが発生しました: {{error}}',
    'errors.invalidApiResponse': 'スコアカード API からの応答形式が無効です',
    'errors.invalidThresholds': '無効なしきい値',
    'errors.metricDataUnavailable': 'メトリクスデータがありません',
    'errors.missingAggregationId':
      'スコアカードの設定が正しくありません。集計 ID (またはメトリクス ID) プロパティーが指定されていません。',
    'errors.missingPermission': '権限がありません',
    'errors.missingPermissionMessage':
      'スコアカードのメトリクスを表示するには、必要な権限を管理者に付与してもらう必要があります。',
    'errors.noDataFound': 'データが見つかりません',
    'errors.noDataFoundMessage':
      'ここにデータを表示するには、このメトリクスに関連する値がエンティティーによって報告されていることを確認してください。',
    'errors.unsupportedAggregationType':
      'このスコアカードは、このバージョンのプラグインでサポートされていない集計タイプを使用しています。',
    'errors.userNotFoundInCatalogMessage':
      'カタログにユーザーエンティティーが見つかりません。',
    'metric.weightedStatusScoreCenterTooltipMaxLabel': '最高スコア',
    'metric.weightedStatusScoreCenterTooltipTotalLabel': '合計スコア',
    'metric.weightedStatusScoreCenterTooltipBreakdownRow_one':
      '{{status}}: {{count}} entity, score: {{score}}',
    'metric.weightedStatusScoreCenterTooltipBreakdownRow_other':
      '{{status}}: {{count}} entities, score: {{score}}',
    'metric.weightedStatusScoreLegendTooltipEntitiesEach_one':
      '{{count}} 個のエンティティー、各 {{score}}',
    'metric.weightedStatusScoreLegendTooltipEntitiesEach_other':
      '{{count}} 個のエンティティー、各 {{score}}',
    'metric.weightedStatusScoreLegendTooltipRowTotal': '合計スコア {{total}}',
    'metric.drillDownCalculationFailures':
      'このメトリクスの計算中に 1 つ以上のエンティティーが失敗しました。',
    'metric.filecheck.description':
      'リポジトリー内に {{name}} ファイルが存在するかどうかを確認します。',
    'metric.filecheck.title': 'ファイルチェック: {{name}}',
    'metric.github.openPRs.description':
      '特定の GitHub リポジトリーにおけるオープン状態のプルリクエストの数。',
    'metric.github.openPRs.title': 'GitHub のオープン状態の PR',
    'metric.homepageEntityCalculationHealth':
      'メトリクス計算エラーのないエンティティー: {{healthy}} / {{total}}',
    'metric.homepageEntityHealthRatio': '{{healthy}}/{{total}} エンティティー',
    'metric.jira.openIssues.description':
      'Jira で現在オープン状態になっている、重大かつ進行を妨げている課題の数を明示します。',
    'metric.jira.openIssues.title':
      'Jira のオープン状態の進行を妨げているチケット',
    'metric.lastUpdated': '最終更新: {{timestamp}}',
    'metric.lastUpdatedNotAvailable': '最終更新: 利用不可',
    'metric.someEntitiesNotReportingValues':
      'このメトリクスに関連する値を報告していないエンティティーがあります。',
    'metric.sonarqube.codeCoverage.description':
      'SonarQube におけるコードカバレッジ全体の割合。',
    'metric.sonarqube.codeCoverage.title': 'SonarQube のコードカバレッジ',
    'metric.sonarqube.codeDuplications.description':
      'SonarQube の重複行の割合。',
    'metric.sonarqube.codeDuplications.title': 'SonarQube のコード重複',
    'metric.sonarqube.maintainabilityIssues.description':
      'SonarQube におけるオープン状態のコードスメルの数。',
    'metric.sonarqube.maintainabilityIssues.title':
      'SonarQube の保守性に関する問題',
    'metric.sonarqube.maintainabilityRating.description':
      'SonarQube の保守性評価。',
    'metric.sonarqube.maintainabilityRating.title': 'SonarQube の保守性評価',
    'metric.sonarqube.openIssues.description':
      'SonarQube におけるオープン状態のイシュー (OPEN、CONFIRMED、REOPENED) の数。',
    'metric.sonarqube.openIssues.title': 'SonarQube のオープン状態のイシュー',
    'metric.sonarqube.qualityGate.description':
      'プロジェクトが SonarQube の品質基準を合格しているかどうか。',
    'metric.sonarqube.qualityGate.title': 'SonarQube の品質基準ステータス',
    'metric.sonarqube.reliabilityIssues.description':
      'SonarQube におけるオープン状態のバグの数。',
    'metric.sonarqube.reliabilityIssues.title':
      'SonarQube の信頼性に関する問題',
    'metric.sonarqube.reliabilityRating.description':
      'SonarQube の信頼性評価。',
    'metric.sonarqube.reliabilityRating.title': 'SonarQube の信頼性評価',
    'metric.sonarqube.securityHotspots.description':
      'SonarQube で確認すべきセキュリティーホットスポットの数。',
    'metric.sonarqube.securityHotspots.title':
      'SonarQube のセキュリティーホットスポット',
    'metric.sonarqube.securityIssues.description':
      'SonarQube におけるオープン状態のセキュリティー脆弱性の数。',
    'metric.sonarqube.securityIssues.title':
      'SonarQube のセキュリティーに関する問題',
    'metric.sonarqube.securityRating.description':
      'SonarQube のセキュリティー評価。',
    'metric.sonarqube.securityRating.title': 'SonarQube セキュリティー評価',
    'metric.sonarqube.securityReviewRating.description':
      'SonarQube のセキュリティーレビュー評価。',
    'metric.sonarqube.securityReviewRating.title':
      'SonarQube のセキュリティーレビュー評価',
    'metricGroupCard.menuAriaLabel': 'その他のオプション',
    'metricGroupCard.viewDataSources': 'ソースを表示',
    'notFound.altText': 'ページが見つかりません',
    'notFound.contactSupport': 'サポートにお問い合わせください',
    'notFound.description':
      'このリポジトリーの docs ディレクトリーのルートに {{indexFile}} ファイルを追加することをお試しください。',
    'notFound.goBack': '戻る',
    'notFound.readMore': '続きを読む',
    'notFound.title': '404 該当するページが見つかりませんでした',
    'permissionRequired.altText': '権限が必要',
    'permissionRequired.button': '続きを読む',
    'permissionRequired.description':
      'スコアカードプラグインを表示するには、管理者に連絡して {{permission}} 権限を付与してもらうよう依頼してください。',
    'permissionRequired.title': '権限がありません',
    'thresholds.entities_one': '{{count}} 個のエンティティー',
    'thresholds.entities_other': '{{count}} 個のエンティティー',
    'thresholds.error': 'エラー',
    'thresholds.exist': '存在する',
    'thresholds.missing': 'なし',
    'thresholds.noEntities': '{{category}} 状態のエンティティーはありません',
    'thresholds.success': '成功',
    'thresholds.warning': '警告',
  },
});

export default scorecardTranslationJa;
