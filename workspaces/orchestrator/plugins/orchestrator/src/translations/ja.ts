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

import { orchestratorTranslationRef } from './ref';

/**
 * Japanese translation for plugin.orchestrator.
 * @public
 */
const orchestratorTranslationJa = createTranslationMessages({
  ref: orchestratorTranslationRef,
  messages: {
    'page.title': 'ワークフローオーケストレーター',
    'page.tabs.workflows': 'ワークフロー',
    'page.tabs.allRuns': 'すべての実行',
    'page.tabs.workflowDetails': 'ワークフロー詳細',
    'page.tabs.workflowRuns': 'ワークフロー実行',
    'table.title.workflows': 'ワークフロー',
    'table.title.allRuns': 'すべての実行 ({{count}})',
    'table.title.allWorkflowRuns': 'ワークフロー実行 ({{count}})',
    'table.headers.name': '名前',
    'table.headers.runStatus': '実行ステータス',
    'table.headers.started': '開始済み',
    'table.headers.status': 'ステータス',
    'table.headers.workflowStatus': 'ワークフローステータス',
    'table.headers.duration': '期間',
    'table.headers.description': '説明',
    'table.headers.lastRun': '最終実行',
    'table.headers.lastRunStatus': '最終実行のステータス',
    'table.headers.workflowName': 'ワークフロー名',
    'table.actions.run': '実行',
    'table.actions.viewRuns': '実行の表示',
    'table.actions.viewInputSchema': '入力スキーマの表示',
    'table.status.running': '実行中',
    'table.status.failed': '失敗',
    'table.status.completed': '完了済み',
    'table.status.aborted': '中止',
    'table.status.pending': '保留中',
    'table.status.active': 'アクティブ',
    'table.filters.status': 'ステータス',
    'table.filters.started': '開始済み',
    'table.filters.startedOptions.today': '今日',
    'table.filters.startedOptions.yesterday': '昨日',
    'table.filters.startedOptions.last7days': '過去 7 日間',
    'table.filters.startedOptions.thisMonth': '今月',
    'workflow.details': '詳細',
    'workflow.definition': 'ワークフロー定義',
    'workflow.progress': 'ワークフロー進捗',
    'workflow.status.available': '利用可能',
    'workflow.status.unavailable': '利用不可',
    'workflow.fields.workflow': 'ワークフロー',
    'workflow.fields.workflowStatus': 'ワークフローステータス',
    'workflow.fields.runStatus': '実行ステータス',
    'workflow.fields.duration': '期間',
    'workflow.fields.description': '説明',
    'workflow.fields.started': '開始済み',
    'workflow.fields.workflowId': '実行 ID',
    'workflow.fields.workflowIdCopied':
      '実行 ID がクリップボードにコピーされました',
    'workflow.errors.retriggerFailed': '再トリガーに失敗しました: {{reason}}',
    'workflow.errors.abortFailed':
      '中止に失敗しました: すでに実行が完了しています。',
    'workflow.errors.abortFailedWithReason': '中止に失敗しました: {{reason}}',
    'workflow.errors.failedToLoadDetails':
      'ワークフロー ID: {{id}} の詳細の読み込みに失敗しました',
    'workflow.messages.areYouSureYouWantToRunThisWorkflow':
      'このワークフローを実行してもよろしいですか?',
    'workflow.messages.userNotAuthorizedExecute':
      'ユーザーにワークフローの実行権限がありません。',
    'workflow.messages.workflowDown':
      'ワークフローは現在停止しているかエラー状態です。今実行すると、失敗や予期しない結果が生じる可能性があります。',
    'workflow.buttons.run': '実行',
    'workflow.buttons.runWorkflow': 'ワークフローの実行',
    'workflow.buttons.runAgain': '再実行',
    'workflow.buttons.running': '実行中...',
    'workflow.buttons.fromFailurePoint': '失敗箇所から',
    'workflow.buttons.runFailedAgain': '実行が再び失敗しました',
    'run.title': 'ワークフローの実行',
    'run.pageTitle': '{{processName}} の実行',
    'run.variables': '実行変数',
    'run.inputs': '入力',
    'run.results': '結果',
    'run.abort.title': 'ワークフローの実行を中止しますか?',
    'run.abort.button': '中止',
    'run.abort.warning':
      '中止すると、進行中および保留中のすべてのステップが直ちに停止されます。進行中の作業がすべて失われます。',
    'run.abort.completed.title': '実行完了',
    'run.abort.completed.message':
      '実行はすでに完了しているため、中止することはできません。',
    'run.status.completed': '実行は完了しました',
    'run.status.failed': '実行は {{time}} に失敗しました',
    'run.status.aborted': '実行は中止されました',
    'run.status.completedWithMessage':
      '実行は {{time}} に完了しました。メッセージ:',
    'run.status.failedAt': '実行は {{time}} に失敗しました',
    'run.status.completedAt': '実行は {{time}} に完了しました',
    'run.status.running': 'ワークフローは実行中です。{{time}} に開始',
    'run.status.runningWaitingAtNode':
      'ワークフローは実行中です - ノード {{node}} で {{formattedTime}} から待機しています',
    'run.status.workflowIsRunning': 'ワークフローは実行中です。{{time}} に開始',
    'run.status.noAdditionalInfo':
      'このワークフローにはステータスに関する追加情報はありません。',
    'run.status.resultsWillBeDisplayedHereOnceTheRunIsComplete':
      '実行が完了すると、結果がここに表示されます。',
    'run.retrigger': '再トリガー',
    'run.viewVariables': '変数の表示',
    'run.suggestedNextWorkflow': '推奨される次のワークフロー',
    'run.suggestedNextWorkflows': '推奨される次のワークフロー',
    'tooltips.completed': '完了済み',
    'tooltips.active': 'アクティブ',
    'tooltips.aborted': '中止',
    'tooltips.suspended': '一時停止中',
    'tooltips.pending': '保留中',
    'tooltips.workflowDown': 'ワークフローは現在停止しているかエラー状態です',
    'tooltips.userNotAuthorizedAbort':
      'ユーザーにワークフローの中止権限がありません',
    'tooltips.userNotAuthorizedExecute':
      'ユーザーにワークフローの実行権限がありません',
    'messages.noDataAvailable': '利用可能なデータはありません',
    'messages.noVariablesFound': 'この実行の変数が見つかりません。',
    'messages.noInputSchemaWorkflow':
      'このワークフローには入力スキーマが定義されていません。',
    'messages.workflowInstanceNoInputs':
      'このワークフローインスタンスには入力がありません',
    'messages.missingJsonSchema.title':
      '入力フォームの JSON スキーマがありません',
    'messages.missingJsonSchema.message':
      'このワークフローには、入力検証用に定義された JSON スキーマがありません。ワークフローの実行は可能ですが、入力の検証は限定的になります。',
    'messages.additionalDetailsAboutThisErrorAreNotAvailable':
      'このエラーに関する追加情報はありません',
    'common.close': '閉じる',
    'common.cancel': 'キャンセル',
    'common.execute': '実行',
    'common.details': '詳細',
    'common.links': 'リンク',
    'common.values': '値',
    'common.back': '戻る',
    'common.run': '実行',
    'common.next': '次へ',
    'common.review': '確認',
    'common.unavailable': '---',
    'stepperObjectField.error':
      'ステッパーオブジェクトフィールドは、プロパティーを含まないスキーマではサポートされていません',
    'formDecorator.error':
      'フォームデコレーターはコンテキストデータを提供する必要があります。',
    'aria.close': '閉じる',
  },
});

export default orchestratorTranslationJa;
