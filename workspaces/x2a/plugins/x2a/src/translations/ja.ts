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
    'artifact.types.ansible_project': 'AAP プロジェクト',
    'artifact.types.migrated_sources': '移行済みソース',
    'artifact.types.migration_plan': 'プロジェクト移行計画',
    'artifact.types.module_migration_plan': 'モジュール移行計画',
    'artifact.types.project_metadata': 'プロジェクトメタデータ',
    'bulkRun.cancel': 'キャンセル',
    'bulkRun.confirm': 'すべて実行',
    'bulkRun.errorGlobal': '一括操作の実行に失敗しました',
    'bulkRun.errorModuleStart':
      'モジュール "{{moduleName}}" のフェーズ "{{phase}}" の開始に失敗しました',
    'bulkRun.errorProject':
      'プロジェクト "{{name}}" のモジュールの実行に失敗しました',
    'bulkRun.globalAction': 'すべて実行',
    'bulkRun.globalConfirm.message':
      'これにより、書き込み権限を持つ (現在のページに表示されていないプロジェクトも含む) すべてのプロジェクトにある、対象となるすべてのモジュールに対して、次の移行フェーズがトリガーされます。この操作を実行する前に、ターゲットリポジトリー内の必要なアーティファクトがすべてレビュー済みであることを確認してください。',
    'bulkRun.globalConfirm.messageInitRetrigger':
      '一部のプロジェクトが初期化フェーズを再実行できる状態です。それらの検出フェーズも再トリガーされます。',
    'bulkRun.globalConfirm.noInitEligible':
      '現在、初期化フェーズを再実行できるプロジェクトはありません。',
    'bulkRun.globalConfirm.title':
      '対象となるすべてのプロジェクトとモジュールを実行しますか?',
    'bulkRun.globalConfirm.userPromptLabel':
      '初期化再トリガーのユーザープロンプト (任意)',
    'bulkRun.globalConfirm.userPromptPlaceholder':
      'プロジェクトの初期化フェーズを再トリガーする必要がある場合は、このプロンプトを使用して変換をカスタマイズします…',
    'bulkRun.projectAction': 'すべてのモジュールの実行',
    'bulkRun.projectConfirm.message':
      'これにより、現在の状態で実行可能なこのプロジェクト内のすべてのモジュールに対して、次の移行フェーズがトリガーされます。この操作を実行する前に、ターゲットリポジトリー内の必要なアーティファクトがすべてレビュー済みであることを確認してください。対象外のモジュールはスキップされます。',
    'bulkRun.projectConfirm.title':
      '"{{name}}" プロジェクト内のすべてのモジュールを実行しますか?',
    'bulkRun.projectPageAction': 'すべて実行',
    'bulkRun.projectPageConfirm.message':
      'これにより、現在の状態で実行可能なこのプロジェクト内のすべてのモジュールに対して、次の移行フェーズがトリガーされます。この操作を実行する前に、ターゲットリポジトリー内の必要なアーティファクトがすべてレビュー済みであることを確認してください。対象外のモジュールはスキップされます。',
    'bulkRun.projectPageConfirm.title':
      '"{{name}}" 内のすべてのモジュールを実行しますか?',
    'common.newProject': '新しいプロジェクト',
    'editProjectDialog.cancel': 'Cancel',
    'editProjectDialog.nameRequired': 'Name is required',
    'editProjectDialog.ownerChangeConfirm': 'Transfer ownership',
    'editProjectDialog.ownerChangeWarning':
      'Changing the owner may cause you to lose access to this project if your permissions do not cover the new owner. An administrator can restore access if needed.',
    'editProjectDialog.ownerChangeWarningTitle': 'Confirm ownership transfer',
    'editProjectDialog.ownerFormatHint':
      'Must be a Backstage entity reference, e.g. user:default/name or group:default/team',
    'editProjectDialog.title': 'Edit project',
    'editProjectDialog.update': 'Update',
    'editProjectDialog.updateError': 'Failed to update project',
    empty: '-',
    'emptyPage.noConversionInitiatedYet': '変換はまだ開始されていません',
    'emptyPage.noConversionInitiatedYetDescription':
      '既存の自動化を実稼働環境対応の Ansible に変換する作業を開始し、その進捗を追跡します',
    'emptyPage.notAllowedDescription':
      '変換プロジェクトへのアクセスが許可されていません。',
    'emptyPage.notAllowedTitle': 'アクセス拒否',
    'emptyPage.startFirstConversion': '最初の変換の開始',
    'initPhaseCard.title': '検出フェーズ',
    'module.actions.cancelPhase': '{{phase}} フェーズのキャンセル',
    'module.actions.cancelPhaseError':
      'モジュールのフェーズをキャンセルできませんでした',
    'module.actions.runNextPhase': '次の {{phase}} フェーズの実行',
    'module.actions.runNextPhaseError':
      'モジュールの次のフェーズを実行できませんでした',
    'module.artifacts': 'アーティファクト',
    'module.currentPhase': '現在のフェーズ',
    'module.lastUpdate': '最終更新',
    'module.name': '名前',
    'module.notStarted': '開始前',
    'module.phases.analyze': '分析',
    'module.phases.init': '初期化',
    'module.phases.migrate': '移行',
    'module.phases.none': '-',
    'module.phases.publish': '公開',
    'module.sourcePath': 'ソースパス',
    'module.status': 'ステータス',
    'module.statuses.cancelled': 'キャンセル済み',
    'module.statuses.error': 'エラー',
    'module.statuses.none': '-',
    'module.statuses.pending': '保留中',
    'module.statuses.running': '実行中',
    'module.statuses.success': '成功',
    'module.summary.cancelled': 'キャンセル済み',
    'module.summary.error': 'エラー',
    'module.summary.finished': '終了',
    'module.summary.pending': '保留中',
    'module.summary.running': '実行中',
    'module.summary.toReview_one':
      'レビュー対象のアーティファクトがあるモジュール: {{count}} 個',
    'module.summary.toReview_other':
      'レビュー対象のアーティファクトがあるモジュール: {{count}} 個',
    'module.summary.total': '合計',
    'module.summary.waiting': '待機中',
    'modulePage.artifacts.ansible_project': 'AAP プロジェクト',
    'modulePage.artifacts.description':
      'これらのアーティファクトは変換プロセスによって生成されたものであり、レビューに使用できます。',
    'modulePage.artifacts.migrated_sources': '移行済みソース',
    'modulePage.artifacts.migration_plan': 'プロジェクト全体の移行計画',
    'modulePage.artifacts.module_migration_plan': '分析に基づくモジュール計画',
    'modulePage.artifacts.title': 'レビュー対象のアーティファクト',
    'modulePage.phases.analyzeInstructions':
      '分析を実行する前に、まずプロジェクト全体の移行計画を確認してください。その内容に基づいてモジュールの分析が実行されます。',
    'modulePage.phases.cancel': 'キャンセル',
    'modulePage.phases.cancelError':
      'モジュールのフェーズをキャンセルできませんでした',
    'modulePage.phases.commitId': '最終コミット ID',
    'modulePage.phases.duration': '期間',
    'modulePage.phases.errorDetails': 'エラーの詳細',
    'modulePage.phases.hideLog': 'ログを非表示にする',
    'modulePage.phases.id': 'ID',
    'modulePage.phases.k8sJobName': 'Kubernetes ジョブ名',
    'modulePage.phases.logWaitingForStream':
      'クラスターからのログ出力を待っています...',
    'modulePage.phases.migrateInstructions':
      '移行を実行する前に、モジュール移行計画を確認してください。移行プロセスでは、計画に基づいてソースコードを Ansible に変換します。',
    'modulePage.phases.noLogsAvailable': 'ログはまだ利用できません...',
    'modulePage.phases.publishInstructions':
      '公開する前に、移行済みソースを確認してください。公開プロセスを実行すると、変換済みのコードがターゲットリポジトリーにコミットされます。',
    'modulePage.phases.reanalyzeInstructions':
      'モジュール移行計画はすでに存在します。プロジェクト全体の移行計画が更新された場合は、変更を反映するために分析を再トリガーしてください。',
    'modulePage.phases.remigrateInstructions':
      '移行済みソースはすでに存在しています。移行を再トリガーして、変換済みの Ansible コードを再作成してください。',
    'modulePage.phases.republishInstructions':
      'このモジュールはすでに公開されています。ターゲットリポジトリーを更新するために、公開を再トリガーしてください。',
    'modulePage.phases.rerunAnalyze': 'モジュール移行計画の再作成',
    'modulePage.phases.rerunMigrate': '移行済みソースの再作成',
    'modulePage.phases.rerunPublish': 'ターゲットリポジトリーへの再公開',
    'modulePage.phases.resyncMigrationPlanInstructions':
      '移行計画と一致するようにモジュールリストを再同期してください。',
    'modulePage.phases.runAnalyze': 'モジュール移行計画の作成',
    'modulePage.phases.runError': 'モジュールのフェーズを実行できませんでした',
    'modulePage.phases.runMigrate': 'モジュールソースの移行',
    'modulePage.phases.runPublish': 'ターゲットリポジトリーへの公開',
    'modulePage.phases.startedAt': '開始日時',
    'modulePage.phases.status': 'ステータス',
    'modulePage.phases.statuses.cancelled': 'キャンセル済み',
    'modulePage.phases.statuses.error': 'エラー',
    'modulePage.phases.statuses.notStarted': '開始前',
    'modulePage.phases.statuses.pending': '保留中',
    'modulePage.phases.statuses.running': '実行中',
    'modulePage.phases.statuses.success': '成功',
    'modulePage.phases.telemetry.agentName': 'エージェント名',
    'modulePage.phases.telemetry.duration': '期間',
    'modulePage.phases.telemetry.inputTokens': '入力トークン',
    'modulePage.phases.telemetry.noTelemetryAvailable':
      'テレメトリーデータは利用できません',
    'modulePage.phases.telemetry.outputTokens': '出力トークン',
    'modulePage.phases.telemetry.title': 'テレメトリー',
    'modulePage.phases.telemetry.toolCalls': 'ツール呼び出し回数',
    'modulePage.phases.title': '移行フェーズ',
    'modulePage.phases.viewLog': 'ログを表示する',
    'modulePage.title': 'モジュールの詳細',
    'page.subtitle':
      '既存の自動化を実稼働環境に対応した Ansible Playbook に非同期で変換する作業を開始し、その進捗を追跡します。',
    'page.title': 'Conversion Hub',
    'project.description': '説明',
    'project.dirName': 'Directory Name',
    'project.id': 'ID',
    'project.noModules': 'モジュールがまだ見つかりません...',
    'project.ownedBy': 'Owned By',
    'project.statuses.completed': '完了済み',
    'project.statuses.created': '作成済み',
    'project.statuses.failed': '失敗',
    'project.statuses.inProgress': '進行中',
    'project.statuses.initialized': '初期化済み',
    'project.statuses.initializing': '初期化中',
    'project.statuses.none': '-',
    'projectDetailsCard.description': '説明',
    'projectDetailsCard.dirName': 'Directory Name',
    'projectDetailsCard.edit': 'Edit',
    'projectDetailsCard.name': '名前',
    'projectDetailsCard.ownedBy': 'Owned By',
    'projectDetailsCard.sourceRepo': 'ソースリポジトリー',
    'projectDetailsCard.status': 'ステータス',
    'projectDetailsCard.targetRepo': 'ターゲットリポジトリー',
    'projectDetailsCard.title': 'プロジェクトの詳細',
    'projectModulesCard.noModules': 'モジュールがまだ見つかりません...',
    'projectModulesCard.published': '公開済み',
    'projectModulesCard.title': 'モジュール ({{count}})',
    'projectModulesCard.toReview': 'レビュー',
    'projectPage.actionsTooltip': 'クリックしてプロジェクト操作メニューを開く',
    'projectPage.deleteConfirm.cancel': 'キャンセル',
    'projectPage.deleteConfirm.confirm': '削除',
    'projectPage.deleteConfirm.message':
      'このプロジェクトとそのすべてのモジュールおよびジョブが完全に削除されます。この操作は元に戻せません。ターゲットリポジトリーに保存されているアーティファクトは保持されます。',
    'projectPage.deleteConfirm.title': 'プロジェクト {{name}} を削除しますか?',
    'projectPage.deleteError': 'プロジェクトの削除に失敗しました',
    'projectPage.deleteProject': '削除',
    'projectPage.title': 'プロジェクト',
    'projectTable.deleteError': 'プロジェクトの削除に失敗しました',
    'retriggerInit.confirm.confirmButton': '再トリガー',
    'retriggerInit.confirm.message':
      'これにより、プロジェクトの検出フェーズが再トリガーされ、新しい初期化ジョブが開始されます。以前の初期化結果はすべて置き換えられます。',
    'retriggerInit.confirm.title':
      '"{{name}}" の初期化フェーズを再トリガーしますか?',
    'retriggerInit.confirm.userPromptLabel': 'ユーザープロンプト (任意)',
    'retriggerInit.confirm.userPromptPlaceholder':
      '変換に関する追加の指示を記載してください…',
    'retriggerInit.error':
      'プロジェクト "{{name}}" の初期化の再トリガーに失敗しました',
    'retriggerInit.errorStart': 'プロジェクト初期化の開始に失敗しました',
    'retriggerInit.firstTrigger.confirmButton': '初期化フェーズのトリガー',
    'retriggerInit.firstTrigger.message':
      '確定すると、このプロジェクトの検出フェーズが開始されます。ソースおよびターゲット SCM のトークンの入力を求められる場合があります。',
    'retriggerInit.firstTrigger.title':
      '"{{name}}" の初期化フェーズをトリガーしますか?',
    'retriggerInit.firstTrigger.userPromptLabel': 'ユーザープロンプト (任意)',
    'retriggerInit.firstTrigger.userPromptPlaceholder':
      '変換に関する追加の指示を記載してください…',
    'rulesPage.addRule': 'Add Rule',
    'rulesPage.deleteConfirm.cancel': 'Cancel',
    'rulesPage.deleteConfirm.confirm': 'Delete',
    'rulesPage.deleteConfirm.deleteError': 'Failed to delete rule',
    'rulesPage.deleteConfirm.message':
      'This rule will be permanently deleted. Existing projects that already accepted this rule will not be affected.',
    'rulesPage.deleteConfirm.title': 'Delete rule "{{title}}"?',
    'rulesPage.dialog.cancel': 'Cancel',
    'rulesPage.dialog.createError': 'Failed to create rule',
    'rulesPage.dialog.createTitle': 'Create Rule',
    'rulesPage.dialog.descriptionField': 'Description',
    'rulesPage.dialog.editTitle': 'Edit Rule',
    'rulesPage.dialog.requiredField': 'Required for all projects',
    'rulesPage.dialog.save': 'Save',
    'rulesPage.dialog.titleField': 'Title',
    'rulesPage.dialog.updateError': 'Failed to update rule',
    'rulesPage.manageRules': 'Manage Rules',
    'rulesPage.notAllowed': 'You do not have permission to manage rules.',
    'rulesPage.subtitle':
      'Manage rules that projects must accept at creation time.',
    'rulesPage.table.createdAt': 'Created',
    'rulesPage.table.deleteRule': 'Delete rule',
    'rulesPage.table.description': 'Description',
    'rulesPage.table.editRule': 'Edit rule',
    'rulesPage.table.id': 'ID',
    'rulesPage.table.noRules': 'No rules defined yet.',
    'rulesPage.table.optional': 'Optional',
    'rulesPage.table.required': 'Required',
    'rulesPage.table.title': 'Title',
    'rulesPage.title': 'Conversion Rules',
    'scaffolder.rulesAcceptance.fetchError': 'Failed to fetch rules',
    'scaffolder.rulesAcceptance.loadingRules': 'Loading rules...',
    'scaffolder.rulesAcceptance.noRulesConfigured': 'No rules configured.',
    'scaffolder.rulesAcceptance.required': 'required',
    'sidebar.x2a.title': 'Conversion Hub',
    'table.actions.collapseAll': 'すべての行を折りたたむ',
    'table.actions.collapseRow': '行を折りたたむ',
    'table.actions.deleteProject': 'プロジェクトの削除',
    'table.actions.expandAll': 'すべての行を展開する',
    'table.actions.expandRow': '行を展開する',
    'table.actions.retriggerInit': 'プロジェクト初期化フェーズの再トリガー',
    'table.columns.createdAt': '作成日時',
    'table.columns.name': '名前',
    'table.columns.sourceRepo': 'ソースリポジトリー',
    'table.columns.status': 'ステータス',
    'table.columns.statusSortDisabledTooltip':
      'プロジェクト数が {{threshold}} を超えている場合、ステータスによる並べ替えは利用できません',
    'table.columns.targetRepo': 'ターゲットリポジトリー',
    'table.projectsCount': 'プロジェクト ({{count}})',
    'time.ago.daysAndHours': '{{days}} 日 {{hours}} 時間前',
    'time.ago.daysOnly': '{{days}} 日前',
    'time.ago.hoursAndMinutes': '{{hours}} 時間 {{minutes}} 分前',
    'time.ago.hoursOnly': '{{hours}} 時間前',
    'time.ago.lessThanMinute': '1 分未満前',
    'time.ago.minutes': '{{minutes}} 分前',
    'time.duration.daysAndHours': '{{days}} 日 {{hours}} 時間',
    'time.duration.daysOnly': '{{days}} 日',
    'time.duration.hoursAndMinutes': '{{hours}} 時間 {{minutes}} 分',
    'time.duration.hoursOnly': '{{hours}} 時間',
    'time.duration.minutesAndSeconds': '{{minutes}} 分 {{seconds}} 秒',
    'time.duration.secondsOnly': '{{seconds}} 秒',
    'time.jobTiming.finished': '完了: {{timeAgo}} (所要時間: {{duration}})',
    'time.jobTiming.noStartTime': '-',
    'time.jobTiming.running': '{{duration}} の間実行中',
  },
});

export default x2aPluginTranslationJa;
