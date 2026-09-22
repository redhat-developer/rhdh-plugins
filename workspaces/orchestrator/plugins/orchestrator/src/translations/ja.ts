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
    'alerts.duplicateWorkflowIds.learnMore': '詳細',
    'alerts.duplicateWorkflowIds.message':
      '同じ ID を持つ複数のワークフローが検出されました。各バージョンに必ず一意の ID を使用してください。',
    'aria.close': '閉じる',
    'common.back': '戻る',
    'common.cancel': 'キャンセル',
    'common.close': '閉じる',
    'common.details': '詳細',
    'common.execute': '実行',
    'common.goBack': '戻る',
    'common.links': 'リンク',
    'common.next': '次へ',
    'common.review': 'レビュー',
    'common.run': '実行',
    'common.unavailable': '---',
    'common.values': '値',
    'duration.aDay': '1 日',
    'duration.aFewSeconds': '数秒',
    'duration.aMinute': '1 分',
    'duration.aMonth': '1 カ月',
    'duration.aSecond': '1 秒',
    'duration.aYear': '1 年',
    'duration.anHour': '1 時間',
    'duration.days': '{{count}} 日',
    'duration.hours': '{{count}} 時間',
    'duration.minutes': '{{count}} 分',
    'duration.months': '{{count}} カ月',
    'duration.seconds': '{{count}} 秒',
    'duration.years': '{{count}} 年',
    'emptyState.illustrationAlt': 'ワークフローまたは実行結果のイラストはありません',
    'emptyState.runs.description': 'ワークフローの実行結果は、ワークフローが実行されるとここに表示されます。',
    'emptyState.runs.runWorkflow': 'ワークフローを実行する',
    'emptyState.runs.title': 'まだ実行されていません',
    'emptyState.workflows.description': '開始するには、新しいワークフローを追加します。',
    'emptyState.workflows.title': 'ワークフローはまだ追加されていません',
    'emptyState.workflows.viewDocumentation': 'ドキュメントの表示',
    'formDecorator.error':
      'フォームデコレーターはコンテキストデータを提供する必要があります。',
    'messages.additionalDetailsAboutThisErrorAreNotAvailable':
      'このエラーに関する追加情報はありません',
    'messages.missingJsonSchema.message':
      'このワークフローには、入力検証用に定義された JSON スキーマがありません。ワークフローの実行は可能ですが、入力の検証は限定的になります。',
    'messages.missingJsonSchema.title':
      '入力フォームの JSON スキーマがありません',
    'messages.noDataAvailable': '利用可能なデータはありません',
    'messages.noInputSchemaWorkflow':
      'このワークフローには入力スキーマが定義されていません。',
    'messages.noVariablesFound': 'この実行の変数が見つかりません。',
    'messages.workflowInstanceNoInputs':
      'このワークフローインスタンスには入力がありません',
    'page.tabs.allRuns': 'すべての実行',
    'page.tabs.workflowDetails': 'ワークフロー詳細',
    'page.tabs.workflowRuns': 'ワークフロー実行',
    'page.tabs.workflows': 'ワークフロー',
    'page.title': 'ワークフローオーケストレーター',
    'permissions.accessDenied': 'アクセス拒否',
    'permissions.accessDeniedDescription':
      'このワークフローの実行結果を表示する権限がありません。',
    'permissions.contactAdmin':
      '管理者に連絡して必要な権限を要求してください。',
    'permissions.missingOwnership':
      'このワークフロー実行には、所有者情報が記録されていません。',
    'permissions.notYourRun':
      'このワークフロー実行は、別のユーザーによって開始されました。',
    'permissions.requiredPermission': '必要な権限',
    'reviewStep.hiddenFieldsNote':
      'このページでは一部のパラメーターが非表示になっています。',
    'reviewStep.showHiddenParameters': '非表示のパラメーターの表示',
    'run.abort.button': '中止',
    'run.abort.completed.message':
      '実行はすでに完了しているため、中止することはできません。',
    'run.abort.completed.title': '実行完了',
    'run.abort.title': 'ワークフローの実行を中止しますか?',
    'run.abort.warning':
      '中止すると、進行中および保留中のすべてのステップが直ちに停止されます。進行中の作業がすべて失われます。',
    'run.inputs': '入力',
    'run.logs.noLogsAvailable':
      'このワークフロー実行に関するログは利用できません。',
    'run.logs.title': '{{processName}} ワークフローログ',
    'run.logs.viewLogs': 'ログの表示',
    'run.messages.eventTriggered':
      'このワークフローをトリガーするイベントが送信されました。実行が開始すると表示されます。',
    'run.pageTitle': '{{processName}} の実行',
    'run.results': '結果',
    'run.retrigger': '再トリガー',
    'run.status.aborted': '実行は {{time}} 前に中止されました。',
    'run.status.abortedWithoutTime': '実行が中断されました。',
    'run.status.completed': '実行完了',
    'run.status.completedAt': '実行は {{time}} に完了しました',
    'run.status.completedWithMessage': '実行は {{time}} メッセージを伴って完了しました',
    'run.status.failed': '実行は {{time}} に失敗しました',
    'run.status.failedAt': '実行は {{time}} に失敗しました',
    'run.status.noAdditionalInfo':
      'このワークフローにはステータスに関する追加情報はありません。',
    'run.status.resultsWillBeDisplayedHereOnceTheRunIsComplete':
      '実行が完了すると、結果がここに表示されます。',
    'run.status.running': 'ワークフローは実行中です。{{time}} に開始しました',
    'run.status.runningWaitingAtNode':
      'ワークフローは実行中です - ノード {{node}} で {{formattedTime}} から待機しています',
    'run.status.workflowIsRunning': 'ワークフローは実行中です。{{time}} に開始しました',
    'run.suggestedNextWorkflow': '推奨される次のワークフロー',
    'run.suggestedNextWorkflows': '推奨される次のワークフロー',
    'run.title': 'ワークフローの実行',
    'run.variables': '実行変数',
    'run.viewVariables': '変数の表示',
    'stepperObjectField.error':
      'ステッパーオブジェクトフィールドは、プロパティーを含まないスキーマではサポートされていません',
    'table.actions.run': '実行',
    'table.actions.runAsEvent': 'イベントとして実行',
    'table.actions.viewInputSchema': '入力スキーマの表示',
    'table.actions.viewRuns': '実行の表示',
    'table.actions.viewRunVariables': '実行変数を表示する',
    'table.filters.started': '開始済み',
    'table.filters.entity': 'エンティティー',
    'table.filters.runBy': '実行者',
    'table.filters.startedOptions.last7days': '過去 7 日間',
    'table.filters.startedOptions.thisMonth': '今月',
    'table.filters.startedOptions.today': '今日',
    'table.filters.startedOptions.yesterday': '昨日',
    'table.filters.status': 'ステータス',
    'table.filters.placeholder': 'フィルター',
    'table.filters.clearAll': 'すべてクリア',
    'table.headers.description': '説明',
    'table.headers.duration': '期間',
    'table.headers.lastRun': '最終実行',
    'table.headers.lastRunStatus': '最終実行のステータス',
    'table.headers.runsLastMonth': '実行数 (先月)',
    'table.headers.successRatio': '成功率',
    'table.headers.name': '名前',
    'table.headers.runStatus': '実行ステータス',
    'table.headers.started': '開始済み',
    'table.headers.status': 'ステータス',
    'table.headers.version': 'バージョン',
    'table.headers.entity': 'エンティティー',
    'table.headers.runBy': '実行者',
    'table.headers.workflowName': 'ワークフロー名',
    'table.headers.workflowStatus': 'ワークフローステータス',
    'table.status.aborted': '中止',
    'table.status.active': 'アクティブ',
    'table.status.completed': '完了済み',
    'table.status.failed': '失敗',
    'table.status.pending': '保留中',
    'table.status.running': '実行中',
    'table.title.allRuns': 'すべての実行 ({{count}})',
    'table.title.allWorkflowRuns': 'ワークフロー実行 ({{count}})',
    'table.title.workflows': 'ワークフロー ({{count}})',
    'tooltips.aborted': '中止',
    'tooltips.active': 'アクティブ',
    'tooltips.completed': '完了済み',
    'tooltips.pending': '保留中',
    'tooltips.suspended': '一時停止中',
    'tooltips.userNotAuthorizedAbort':
      'ユーザーにワークフローの中止権限がありません',
    'tooltips.userNotAuthorizedExecute':
      'ユーザーにワークフローの実行権限がありません',
    'tooltips.workflowDown': 'ワークフローは現在停止しているかエラー状態です',
    'workflow.buttons.entireWorkflow': 'ワークフロー全体',
    'workflow.buttons.fromFailurePoint': '失敗箇所から',
    'workflow.buttons.run': '実行',
    'workflow.buttons.runAgain': '再実行',
    'workflow.buttons.runAsEvent': 'イベントとして実行',
    'workflow.buttons.runFailedAgain': '実行が再び失敗しました',
    'workflow.buttons.runWorkflow': 'ワークフローの実行',
    'workflow.buttons.running': '実行中...',
    'workflow.definition': 'ワークフロー定義',
    'workflow.inputSchema': '入力スキーマ',
    'workflow.inputSchemaDescription': 'このワークフローに必要なデータフィールドと検証ルールを定義します。',
    'workflow.successRatio': '成功率',
    'workflow.successRatioDescription': 'このワークフローにおける、完了した実行数と失敗した実行数の割合。',
    'workflow.runSuccess': '実行成功',
    'workflow.ofTotal': '{{totalCount}} 件中',
    'workflow.statsSuccess': '成功',
    'workflow.statsFailed': '失敗',
    'workflow.details': '詳細',
    'workflow.errors.abortFailed':
      '中止に失敗しました: すでに実行が完了しています。',
    'workflow.errors.abortFailedWithReason': '中止に失敗しました: {{reason}}',
    'workflow.errors.failedToLoadDetails':
      'ワークフロー ID: {{id}} の詳細の読み込みに失敗しました',
    'workflow.errors.retriggerFailed': '再トリガーに失敗しました: {{reason}}',
    'workflow.fields.description': '説明',
    'workflow.fields.duration': '期間',
    'workflow.fields.averageDuration': '平均期間',
    'workflow.fields.entity': 'エンティティー',
    'workflow.fields.runStatus': '実行ステータス',
    'workflow.fields.started': '開始済み',
    'workflow.fields.runBy': '実行者',
    'workflow.fields.version': 'バージョン',
    'workflow.fields.workflow': 'ワークフロー',
    'workflow.fields.workflowId': '実行 ID',
    'workflow.fields.workflowIdCopy': '実行 ID をコピーする',
    'workflow.fields.workflowIdCopied':
      '実行 ID がクリップボードにコピーされました',
    'workflow.fields.workflowStatus': 'ワークフローステータス',
    'workflow.messages.areYouSureYouWantToRunThisWorkflow':
      'このワークフローを実行してもよろしいですか?',
    'workflow.messages.userNotAuthorizedExecute':
      'ユーザーにワークフローの実行権限がありません。',
    'workflow.messages.workflowDown':
      'ワークフローは現在停止しているかエラー状態です。今実行すると、失敗や予期しない結果が生じる可能性があります。',
    'workflow.progress': 'ワークフロー進捗',
    'workflow.status.available': '利用可能',
    'workflow.status.unavailable': '利用不可',
    'workflow.unavailable.title': '利用できないワークフロー',
    'workflow.unavailable.runTooltip': '利用できないワークフロー',
    'workflow.unavailable.requestFailed': '{{url}} への HTTP GET リクエストが失敗しました。',
    'workflow.unavailable.statusCodeLine': 'ステータスコード: {{statusCode}}',
    'workflow.unavailable.statusTextLine': 'ステータステキスト: {{reason}}',
    'samlSso.title': 'GitHub SAML SSO セッションの有効期限が切れました',
    'samlSso.reauthorizeButton': 'SSO を再認可する',
    'samlSso.body': 'GitHub SAML SSO セッションの有効期限が切れました。組織のリソースにアクセスするには、アクティブな SAML セッションが必要です。',
    'samlSso.reauthorizeHint': '組織のアイデンティティプロバイダーで再認証を行うには、「SSO を再認可する」をクリックします。',
    'samlSso.fallbackHint': 'SAML セッションを再確立するには、設定 > 認証プロバイダーから一度サインアウトし、再度サインインしてください。',
  },
});

export default orchestratorTranslationJa;
