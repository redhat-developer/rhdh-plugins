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
  full: true,
  messages: {
    // Empty state translations
    'emptyState.title': 'スコアカードはまだ追加されていません',
    'emptyState.description':
      'スコアカードを使用すると、コンポーネントの健全性を一目で監視できます。まず、セットアップ手順に関するドキュメントを参照してください。',
    'emptyState.button': 'ドキュメントの表示',
    'emptyState.altText': 'スコアカードなし',

    // Permission required translations
    'permissionRequired.title': '権限がありません',
    'permissionRequired.description':
      'スコアカードプラグインを表示するには、管理者に連絡して {{permission}} 権限を付与してもらうよう依頼してください。',
    'permissionRequired.button': 'さらに表示する',
    'permissionRequired.altText': '権限が必要',

    // Common UI
    'common.loading': '読み込み中',

    // Not found state
    'notFound.title': '404 ページが見つかりません',
    'notFound.description':
      'このリポジトリの docs ディレクトリのルートに {{indexFile}} ファイルを追加してみてください。',
    'notFound.readMore': '詳細を見る',
    'notFound.goBack': '戻る',
    'notFound.contactSupport': 'サポートに連絡',
    'notFound.altText': 'ページが見つかりません',

    // Error messages
    'errors.entityMissingProperties':
      'スコアカードの検索に必要なプロパティーがエンティティーにありません',
    'errors.missingAggregationId':
      'スコアカードの構成に誤りがあります。集計ID（またはメトリックID）のプロパティが指定されていません',
    'errors.invalidApiResponse': 'スコアカード API からの応答形式が無効です',
    'errors.fetchError':
      'スコアカードの取得中にエラーが発生しました: {{error}}',
    'errors.metricDataUnavailable': 'メトリクスデータがありません',
    'errors.invalidThresholds': '無効なしきい値',
    'errors.missingPermission': '権限がありません',
    'errors.noDataFound': 'データが見つかりませんでした',
    'errors.authenticationError': '認証エラー',
    'errors.missingPermissionMessage':
      'スコアカードのメトリクスを表示するには、管理者に権限を付与してもらうよう依頼してください。',
    'errors.userNotFoundInCatalogMessage':
      'ユーザーエンティティーがカタログに見つかりません',
    'errors.noDataFoundMessage':
      'ここでデータを確認するには、エンティティがこの指標に関連する値を報告していることを確認してください。',
    'errors.unsupportedAggregationType':
      'このスコアカードの集計タイプは、使用中のプラグインのバージョンではサポートされていません。',
    'errors.authenticationErrorMessage':
      'データを確認するにはサインインしてください。',

    // Metric translations
    'metric.github.open_prs.title': 'GitHub のオープン状態の PR',
    'metric.github.open_prs.description':
      '特定の GitHub リポジトリーにおけるオープン状態のプルリクエストの数。',
    'metric.jira.open_issues.title':
      'Jira のオープン状態の進行を妨げているチケット',
    'metric.jira.open_issues.description':
      'Jira で現在オープン状態になっている、重大かつ進行を妨げている課題の数を明示します。',
    'metric.sonarqube.quality_gate.title':
      'SonarQube クオリティゲートのステータス',
    'metric.sonarqube.quality_gate.description':
      'プロジェクトが SonarQube のクオリティゲートに合格しているかどうか。',
    'metric.sonarqube.open_issues.title': 'SonarQube のオープンな課題',
    'metric.sonarqube.open_issues.description':
      'SonarQube におけるオープンな課題 (OPEN、CONFIRMED、REOPENED) の数。',
    'metric.sonarqube.security_rating.title': 'SonarQube セキュリティ評価',
    'metric.sonarqube.security_rating.description':
      'SonarQube のセキュリティ評価。',
    'metric.sonarqube.security_issues.title':
      'SonarQube のセキュリティ上の課題',
    'metric.sonarqube.security_issues.description':
      'SonarQube におけるオープンなセキュリティ脆弱性の数。',
    'metric.sonarqube.security_review_rating.title':
      'SonarQube セキュリティレビュー評価',
    'metric.sonarqube.security_review_rating.description':
      'SonarQube のセキュリティレビュー評価。',
    'metric.sonarqube.security_hotspots.title':
      'SonarQube セキュリティホットスポット',
    'metric.sonarqube.security_hotspots.description':
      'SonarQube でレビューが必要なセキュリティホットスポットの数。',
    'metric.sonarqube.reliability_rating.title': 'SonarQube 信頼性評価',
    'metric.sonarqube.reliability_rating.description':
      'SonarQube の信頼性評価。',
    'metric.sonarqube.reliability_issues.title':
      'SonarQube の信頼性に関する課題',
    'metric.sonarqube.reliability_issues.description':
      'SonarQube におけるオープンなバグの数。',
    'metric.sonarqube.maintainability_rating.title': 'SonarQube 保守性評価',
    'metric.sonarqube.maintainability_rating.description':
      'SonarQube の保守性評価。',
    'metric.sonarqube.maintainability_issues.title':
      'SonarQube の保守性に関する課題',
    'metric.sonarqube.maintainability_issues.description':
      'SonarQube におけるオープンなコードスメルの数。',
    'metric.sonarqube.code_coverage.title': 'SonarQube コードカバレッジ',
    'metric.sonarqube.code_coverage.description':
      'SonarQube における全体のコードカバレッジの割合。',
    'metric.sonarqube.code_duplications.title': 'SonarQube コードの重複',
    'metric.sonarqube.code_duplications.description':
      'SonarQube における重複した行の割合。',
    'metric.filecheck.title': 'ファイル確認: {{name}}',
    'metric.filecheck.description':
      'リポジトリーに {{name}} ファイルが存在するかを確認します。',
    'metric.lastUpdated': '最終更新日: {{timestamp}}',
    'metric.lastUpdatedNotAvailable': '最終更新日: 利用不可',
    'metric.someEntitiesNotReportingValues':
      'エンティティーがこの指標に関連する値を報告していません。',
    'metric.averageCenterTooltipTotalLabel': '合計スコア',
    'metric.averageCenterTooltipMaxLabel': '最大可能スコア',
    'metric.averageCenterTooltipBreakdownRow_one':
      '{{status}}: {{count}} 件、スコア {{score}}',
    'metric.averageCenterTooltipBreakdownRow_other':
      '{{status}}: {{count}} 件、スコア {{score}}',
    'metric.averageLegendTooltipEntitiesEach_one':
      '{{count}} 件のエンティティー、各 {{score}}',
    'metric.averageLegendTooltipEntitiesEach_other':
      '{{count}} 件のエンティティー、各 {{score}}',
    'metric.averageLegendTooltipRowTotal': '合計スコア {{total}}',
    'metric.drillDownCalculationFailures':
      '1 件以上のエンティティーでこの指標の計算に失敗しました。',
    'metric.homepageEntityHealthRatio': '{{healthy}}/{{total}} エンティティー',
    'metric.homepageEntityCalculationHealth':
      '指標の計算エラーがないエンティティー {{healthy}} / {{total}}',

    // Threshold translations
    'thresholds.success': '成功',
    'thresholds.warning': '警告',
    'thresholds.error': 'エラー',
    'thresholds.exist': '存在',
    'thresholds.missing': '欠落',
    'thresholds.noEntities': '{{category}} 状態のエンティティーがありません',
    'thresholds.entities_one': '{{count}} エンティティー',
    'thresholds.entities_other': '{{count}} エンティティー',

    // Entities page translations
    'entitiesPage.unknownMetric': '不明なメトリクス',
    'entitiesPage.noDataFound':
      'ここでデータを確認するには、エンティティがこの指標に関連する値を報告していることを確認してください。',
    'entitiesPage.missingPermission':
      'スコアカードのメトリクスを表示するには、管理者に権限を付与してもらうよう依頼してください。',
    'entitiesPage.metricProviderNotRegistered':
      'ID {{metricId}} のメトリクスプロバイダーが登録されていません。',
    'entitiesPage.entitiesTable.title': 'エンティティー',
    'entitiesPage.entitiesTable.unavailable': '利用不可',
    'entitiesPage.entitiesTable.titleWithCount': 'エンティティー ({{count}})',
    'entitiesPage.entitiesTable.header.status': '状態',
    'entitiesPage.entitiesTable.header.value': '値',
    'entitiesPage.entitiesTable.header.entity': 'エンティティー',
    'entitiesPage.entitiesTable.header.owner': '所有者',
    'entitiesPage.entitiesTable.header.kind': '種類',
    'entitiesPage.entitiesTable.header.lastUpdated': '最終更新日',
    'entitiesPage.entitiesTable.footer.allRows': 'すべての行',
    'entitiesPage.entitiesTable.footer.rows_one': '{{count}} 行',
    'entitiesPage.entitiesTable.footer.rows_other': '{{count}} 行',
    'entitiesPage.entitiesTable.footer.of': 'の',
  },
});

export default scorecardTranslationJa;
