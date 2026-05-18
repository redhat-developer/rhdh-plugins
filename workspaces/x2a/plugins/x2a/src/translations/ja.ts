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
import { x2aPluginTranslationRef } from './ref';

/**
 * Japanese translation for plugin.x2a.
 * @public
 */
const x2aPluginTranslationJa = createTranslationMessages({
  ref: x2aPluginTranslationRef,
  messages: {
    'sidebar.x2a.title': 'Conversion Hub',
    'page.title': 'Conversion Hub',
    'page.subtitle':
      '既存の自動化を実稼働環境に対応した Ansible Playbook に非同期で変換する作業を開始し、その進捗を追跡します。',
    'projectPage.title': 'プロジェクト',
    'projectPage.deleteProject': '削除',
    'projectPage.actionsTooltip': 'クリックしてプロジェクト操作メニューを開く',
    'projectPage.deleteError': 'プロジェクトの削除に失敗しました',
    'projectPage.deleteConfirm.title': 'プロジェクト {{name}} を削除しますか?',
    'projectModulesCard.title': 'モジュール ({{count}})',
    'projectModulesCard.published': '公開済み',
    'initPhaseCard.title': '検出フェーズ',
    'modulePage.title': 'モジュールの詳細',
    'modulePage.artifacts.title': 'レビュー対象のアーティファクト',
    'modulePage.artifacts.migration_plan': 'プロジェクト全体の移行計画',
    'modulePage.artifacts.module_migration_plan': '分析に基づくモジュール計画',
    'modulePage.artifacts.migrated_sources': '移行済みソース',
    'modulePage.artifacts.ansible_project': 'AAP プロジェクト',
    'modulePage.artifacts.description':
      'これらのアーティファクトは変換プロセスによって生成されたものであり、レビューに使用できます。',
    'modulePage.phases.title': '移行フェーズ',
    'modulePage.phases.id': 'ID',
    'modulePage.phases.duration': '期間',
    'modulePage.phases.k8sJobName': 'Kubernetes ジョブ名',
    'modulePage.phases.startedAt': '開始日時',
    'modulePage.phases.status': 'ステータス',
    'modulePage.phases.errorDetails': 'エラーの詳細',
    'modulePage.phases.statuses.notStarted': '開始前',
    'modulePage.phases.statuses.pending': '保留中',
    'modulePage.phases.statuses.running': '実行中',
    'modulePage.phases.statuses.success': '成功',
    'modulePage.phases.statuses.error': 'エラー',
    'modulePage.phases.statuses.cancelled': 'キャンセル済み',
    'modulePage.phases.resyncMigrationPlanInstructions':
      '移行計画と一致するようにモジュールリストを再同期してください。',
    'modulePage.phases.reanalyzeInstructions':
      'モジュール移行計画はすでに存在します。プロジェクト全体の移行計画が更新された場合は、変更を反映するために分析を再トリガーしてください。',
    'modulePage.phases.analyzeInstructions':
      '分析を実行する前に、まずプロジェクト全体の移行計画を確認してください。その内容に基づいてモジュールの分析が実行されます。',
    'modulePage.phases.migrateInstructions':
      '移行を実行する前に、モジュール移行計画を確認してください。移行プロセスでは、計画に基づいてソースコードを Ansible に変換します。',
    'modulePage.phases.remigrateInstructions':
      '移行済みソースはすでに存在しています。移行を再トリガーして、変換済みの Ansible コードを再作成してください。',
    'modulePage.phases.rerunMigrate': '移行済みソースの再作成',
    'modulePage.phases.publishInstructions':
      '公開する前に、移行済みソースを確認してください。公開プロセスを実行すると、変換済みのコードがターゲットリポジトリーにコミットされます。',
    'modulePage.phases.republishInstructions':
      'このモジュールはすでに公開されています。ターゲットリポジトリーを更新するために、公開を再トリガーしてください。',
    'modulePage.phases.rerunPublish': 'ターゲットリポジトリーへの再公開',
    'modulePage.phases.cancel': 'キャンセル',
    'modulePage.phases.runError': 'モジュールのフェーズを実行できませんでした',
    'modulePage.phases.cancelError':
      'モジュールのフェーズをキャンセルできませんでした',
    'modulePage.phases.commitId': '最終コミット ID',
    'modulePage.phases.viewLog': 'ログを表示する',
    'modulePage.phases.hideLog': 'ログを非表示にする',
    'modulePage.phases.noLogsAvailable': 'ログはまだ利用できません...',
    'modulePage.phases.logWaitingForStream':
      'クラスターからのログ出力を待っています...',
    'modulePage.phases.telemetry.title': 'テレメトリー',
    'modulePage.phases.telemetry.noTelemetryAvailable':
      'テレメトリーデータは利用できません',
    'modulePage.phases.telemetry.agentName': 'エージェント名',
    'modulePage.phases.telemetry.duration': '期間',
    'modulePage.phases.telemetry.inputTokens': '入力トークン',
    'modulePage.phases.telemetry.outputTokens': '出力トークン',
    'modulePage.phases.telemetry.toolCalls': 'ツール呼び出し回数',
    'table.columns.name': '名前',
    'table.columns.status': 'ステータス',
    'table.columns.statusSortDisabledTooltip':
      'プロジェクト数が {{threshold}} を超えている場合、ステータスによる並べ替えは利用できません',
    'table.columns.targetRepo': 'ターゲットリポジトリー',
    'table.columns.createdAt': '作成日時',
    'table.actions.deleteProject': 'プロジェクトの削除',
    'table.actions.retriggerInit': 'プロジェクト初期化フェーズの再トリガー',
    'table.actions.expandAll': 'すべての行を展開する',
    'table.actions.collapseAll': 'すべての行を折りたたむ',
    'table.actions.expandRow': '行を展開する',
    'table.actions.collapseRow': '行を折りたたむ',
    'table.projectsCount': 'プロジェクト ({{count}})',
    'common.newProject': '新しいプロジェクト',
    'emptyPage.noConversionInitiatedYet': '変換はまだ開始されていません',
    'emptyPage.noConversionInitiatedYetDescription':
      '既存の自動化を実稼働環境対応の Ansible に変換する作業を開始し、その進捗を追跡します',
    'emptyPage.startFirstConversion': '最初の変換の開始',
    'emptyPage.notAllowedTitle': 'アクセス拒否',
    'emptyPage.notAllowedDescription':
      '変換プロジェクトへのアクセスが許可されていません。',
    'bulkRun.projectAction': 'すべてのモジュールの実行',
    'bulkRun.globalAction': 'すべて実行',
    'bulkRun.projectPageAction': 'すべて実行',
    'bulkRun.projectConfirm.title':
      '"{{name}}" プロジェクト内のすべてのモジュールを実行しますか?',
    'bulkRun.cancel': 'キャンセル',
    'bulkRun.errorProject':
      'プロジェクト "{{name}}" のモジュールの実行に失敗しました',
    'artifact.types.migration_plan': 'プロジェクト移行計画',
    'artifact.types.module_migration_plan': 'モジュール移行計画',
    'artifact.types.migrated_sources': '移行済みソース',
    'artifact.types.project_metadata': 'プロジェクトメタデータ',
    'artifact.types.ansible_project': 'AAP プロジェクト',
    'time.duration.daysAndHours': '{{days}} 日 {{hours}} 時間',
    'time.duration.daysOnly': '{{days}} 日',
    'time.duration.hoursAndMinutes': '{{hours}} 時間 {{minutes}} 分',
    'time.duration.hoursOnly': '{{hours}} 時間',
    'time.duration.minutesAndSeconds': '{{minutes}} 分 {{seconds}} 秒',
    'time.duration.secondsOnly': '{{seconds}} 秒',
    'time.ago.daysAndHours': '{{days}} 日 {{hours}} 時間前',
    'time.ago.daysOnly': '{{days}} 日前',
    'time.ago.hoursAndMinutes': '{{hours}} 時間 {{minutes}} 分前',
    'time.ago.hoursOnly': '{{hours}} 時間前',
    'time.ago.minutes': '{{minutes}} 分前',
    'time.ago.lessThanMinute': '1 分未満前',
    'time.jobTiming.noStartTime': '-',
    'time.jobTiming.running': '{{duration}} の間実行中',
    empty: '-',
  },
});

export default x2aPluginTranslationJa;
