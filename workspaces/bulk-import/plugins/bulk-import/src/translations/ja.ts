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

import { bulkImportTranslationRef } from './ref';

/**
 * Japanese translation for plugin.bulk-import.
 * @public
 */
const bulkImportTranslationJa = createTranslationMessages({
  ref: bulkImportTranslationRef,
  messages: {
    'addRepositories.addSelected': '選択した項目の追加',
    'addRepositories.allRepositoriesAdded':
      'すべてのリポジトリーが追加されました',
    'addRepositories.approvalTool.description':
      'PR 作成用のソース管理ツールを選択してください',
    'addRepositories.approvalTool.github': 'GitHub',
    'addRepositories.approvalTool.gitlab': 'GitLab',
    'addRepositories.approvalTool.title': 'ソース管理ツール',
    'addRepositories.approvalTool.tooltip':
      'インポートには承認が必要です。プルリクエストが承認されると、リポジトリーがカタログページにインポートされます。',
    'addRepositories.clearSearch': '検索のクリア',
    'addRepositories.editPullRequest': 'プルリクエストの編集',
    'addRepositories.generateCatalogInfo': 'catalog-info.yaml の生成',
    'addRepositories.noRepositoriesFound': 'リポジトリーが見つかりません',
    'addRepositories.noSelection': 'なし',
    'addRepositories.preview': 'プレビュー',
    'addRepositories.repositoryType.group': 'グループ',
    'addRepositories.repositoryType.organization': '組織',
    'addRepositories.repositoryType.project': 'プロジェクト',
    'addRepositories.repositoryType.repository': 'リポジトリー',
    'addRepositories.repositoryType.title': 'リポジトリーの種類',
    'addRepositories.searchPlaceholder': '検索',
    'addRepositories.selectRepositories': 'リポジトリーの選択',
    'addRepositories.selectedCount': '{{count}} 件を選択済み',
    'addRepositories.selectedLabel': '選択済み',
    'addRepositories.selectedProjects': 'プロジェクト',
    'addRepositories.selectedRepositories': 'リポジトリー',
    'catalogInfo.status.generating': '生成中',
    'common.add': '追加',
    'common.cancel': 'キャンセル',
    'common.close': '閉じる',
    'common.delete': '削除',
    'common.documentation': 'ドキュメント',
    'common.edit': '編集',
    'common.filter': 'フィルター',
    'common.import': 'インポート',
    'common.remove': '削除',
    'common.save': '保存',
    'common.select': '選択',
    'common.update': '更新',
    'common.view': '表示',
    'errors.addIntegrationsToConfig':
      'この問題を解決するには、Backstage の設定ファイル (app-config.yaml) に統合が追加されていることを確認してください。',
    'errors.catalogEntityConflict':
      'カタログエンティティーの競合のため、新しい PR を作成できませんでした。',
    'errors.catalogInfoExists':
      'catalog-info.yaml がリポジトリーにすでに存在するため、新しい PR は作成されません。ただし、エンティティーはカタログページに登録されます。',
    'errors.codeOwnersNotFound':
      'リポジトリーに CODEOWNERS ファイルがありません。新しい PR を作成するには、CODEOWNERS ファイルを追加してください。',
    'errors.errorOccurred': 'エラーが発生しました',
    'errors.failedToCreatePullRequest': 'プルリクエストの作成に失敗しました',
    'errors.noIntegrationsConfigured':
      'GitHub または GitLab との統合が設定されていません。一括インポート機能を使用するには、少なくとも 1 つの統合を追加してください。',
    'errors.prErrorPermissions':
      '権限が不十分なため、新しい PR を作成できませんでした。管理者に問い合わせてください。',
    'errors.repoEmpty':
      'リポジトリーが空のため、新しい PR を作成できませんでした。最初のコミットをリポジトリーにプッシュしてください。',
    'forms.footer.createPullRequest': 'プルリクエストの作成',
    'forms.footer.createPullRequests': 'プルリクエストの作成',
    'forms.footer.createServiceNowTicket': 'ServiceNow チケットの作成',
    'forms.footer.createServiceNowTickets': 'ServiceNow チケットの作成',
    'forms.footer.importTooltip':
      'インポート用に Catalog-info.yaml ファイルを生成する必要があります。',
    'forms.footer.pullRequestTooltip':
      'プルリクエストを作成する前に、Catalog-info.yaml ファイルを生成する必要があります',
    'forms.footer.selectRepositoryTooltip':
      'インポートするリポジトリーを選択してください。',
    'forms.footer.serviceNowTooltip':
      'ServiceNow チケットを作成する前に、Catalog-info.yaml ファイルを生成する必要があります',
    'importActions.errorFetchingData': 'データの取得中にエラーが発生しました',
    'importActions.loading': '読み込み中...',
    'importActions.noActions':
      'このリポジトリーに対するインポート操作が見つかりません。',
    'page.addRepositoriesSubtitle':
      '4 ステップで Red Hat Developer Hub にリポジトリーを追加',
    'page.addRepositoriesTitle': 'リポジトリーの追加',
    'page.importEntitiesSubtitle': 'Red Hat Developer Hub へのインポート',
    'page.importEntitiesTitle': 'エンティティーのインポート',
    'page.subtitle': 'Red Hat Developer Hub へのエンティティーのインポート',
    'page.title': '一括インポート',
    'page.typeLink': '一括インポート',
    'permissions.addRepositoriesMessage':
      'リポジトリーを追加するには、管理者に連絡して `bulk.import` 権限を付与してもらうよう依頼してください。',
    'permissions.title': '権限が必要',
    'permissions.viewRepositoriesMessage':
      '追加されたリポジトリーを表示するには、管理者に連絡して `bulk.import` 権限を付与してもらうよう依頼してください。',
    'previewFile.closeDrawer': 'ドロワーを閉じる',
    'previewFile.failedToCreatePR': 'PR の作成に失敗しました',
    'previewFile.failedToFetchPR':
      'プルリクエストの取得に失敗しました。以下に新しい YAML が生成されました。',
    'previewFile.invalidEntityYaml':
      'プルリクエスト内のエンティティー YAML が無効です (ファイルが空であるか、apiVersion、kind、または metadata.name がありません)。以下に新しい YAML が生成されました。',
    'previewFile.keyValuePlaceholder': 'key1: value2; key2: value2',
    'previewFile.prCreationUnsuccessful':
      '一部のリポジトリーで PR の作成に失敗しました。理由を確認するには、`編集` をクリックしてください。',
    'previewFile.preview': 'プレビュー',
    'previewFile.previewFile': 'ファイルのプレビュー',
    'previewFile.previewFiles': 'ファイルのプレビュー',
    'previewFile.pullRequest.annotations': 'アノテーション',
    'previewFile.pullRequest.bodyLabel': '{{tool}} のボディー',
    'previewFile.pullRequest.bodyPlaceholder': '説明文 (Markdown 対応)',
    'previewFile.pullRequest.codeOwnersWarning':
      '警告: ターゲットのロケーションに CODEOWNERS ファイルが見つからない場合、失敗する可能性があります。',
    'previewFile.pullRequest.componentNameLabel':
      '作成するコンポーネントの名前',
    'previewFile.pullRequest.componentNamePlaceholder': 'コンポーネント名',
    'previewFile.pullRequest.details': '{{tool}} の詳細',
    'previewFile.pullRequest.entityConfiguration': 'エンティティー設定',
    'previewFile.pullRequest.entityOwnerHelper':
      'リストから所有者を選択するか、グループまたはユーザーへの参照を入力してください',
    'previewFile.pullRequest.entityOwnerLabel': 'エンティティー所有者',
    'previewFile.pullRequest.entityOwnerPlaceholder': 'グループとユーザー',
    'previewFile.pullRequest.labels': 'ラベル',
    'previewFile.pullRequest.loadingText':
      'グループとユーザーを読み込んでいます',
    'previewFile.pullRequest.mergeRequest': 'マージリクエスト',
    'previewFile.pullRequest.previewEntities': 'エンティティーのプレビュー',
    'previewFile.pullRequest.serviceNowTicket': 'ServiceNow チケット',
    'previewFile.pullRequest.spec': '仕様',
    'previewFile.pullRequest.title': 'プルリクエスト',
    'previewFile.pullRequest.titleLabel': '{{tool}} のタイトル',
    'previewFile.pullRequest.titlePlaceholder':
      'Backstage カタログエンティティー記述子ファイルの追加',
    'previewFile.pullRequest.useCodeOwnersFile':
      'エンティティー所有者として *CODEOWNERS* ファイルを使用する',
    'previewFile.pullRequestPendingApproval':
      '[{{pullRequestText}}]({{pullRequestUrl}}) は承認待ちです',
    'previewFile.pullRequestText': 'プルリクエスト',
    'previewFile.useSemicolonSeparator':
      'セミコロンを使用して {{label}} を区切ってください',
    'previewFile.viewRepository': 'リポジトリーの表示',
    'repositories.addedRepositories': '追加されたリポジトリー',
    'repositories.addedRepositoriesCount': '追加されたリポジトリー ({{count}})',
    'repositories.cannotRemoveRepositoryUrl':
      'リポジトリー URL がないため、リポジトリーを削除できません。',
    'repositories.deleteRepository': 'リポジトリーの削除',
    'repositories.editCatalogInfoTooltip':
      'catalog-info.yaml プルリクエストを編集する',
    'repositories.errorOccured': 'エラーが発生しました',
    'repositories.errorOccuredWhileFetching':
      'プルリクエストの取得中にエラーが発生しました',
    'repositories.failedToCreatePullRequest':
      'プルリクエストの作成に失敗しました',
    'repositories.import': 'インポート',
    'repositories.importedEntities': 'インポートされたエンティティー',
    'repositories.importedEntitiesCount':
      'インポートされたエンティティー ({{count}})',
    'repositories.noProjectsFound':
      'インポート可能なプロジェクトがありません。',
    'repositories.noRecordsFound': 'インポート可能なリポジトリーがありません。',
    'repositories.pr': 'PR',
    'repositories.refresh': '更新',
    'repositories.removeRepositoryQuestion':
      '{{repoName}} {{repositoryText}} を削除しますか?',
    'repositories.removeRepositoryWarning':
      'リポジトリーを削除すると、関連するすべての情報がカタログページから消去されます。',
    'repositories.removeRepositoryWarningGitlab':
      '削除すると、関連するすべての情報がカタログページから消去されます。',
    'repositories.removeRepositoryWarningOrchestrator':
      'リポジトリーと関連するオーケストレーターワークフロー情報を削除します。',
    'repositories.removeRepositoryWarningScaffolder':
      'リポジトリーを削除すると、関連するすべての scaffolder タスク情報も削除されます。',
    'repositories.removeTooltipDisabled':
      'このリポジトリーは app-config ファイルに追加されています。削除するにはファイルを直接変更してください',
    'repositories.removeTooltipRepositoryOrchestrator':
      'リポジトリーと関連するオーケストレーターワークフロー情報を削除します',
    'repositories.removeTooltipRepositoryScaffolder':
      'リポジトリーと関連する scaffolder タスク情報を削除します',
    'repositories.removing': '削除中...',
    'repositories.repositoryText': 'リポジトリー',
    'repositories.unableToRemoveRepository':
      'リポジトリーを削除できません。{{error}}',
    'repositories.viewCatalogInfoTooltip':
      'catalog-info.yaml ファイルを表示する',
    'sidebar.bulkImport': '一括インポート',
    'status.added': '追加済み',
    'status.alreadyImported': 'インポート済み',
    'status.failedCreatingPR': 'PR の作成に失敗しました',
    'status.imported': 'インポート',
    'status.missingConfigurations': '設定の不足',
    'status.pullRequestRejected': 'プルリクエストが拒否されました',
    'status.readyToImport': 'インポート準備完了',
    'status.waitingForApproval': '承認待ち',
    'status.waitingForPullRequestToStart': 'プルリクエスト開始待ち',
    'steps.chooseApprovalTool':
      'プルリクエスト作成用のソース管理ツールを選択する',
    'steps.chooseItems': 'インポートする項目を選択する',
    'steps.chooseRepositories': 'インポートする項目を選択する',
    'steps.editPullRequest': 'プル/マージリクエストの詳細を表示する',
    'steps.generateCatalogInfo':
      '選択した各項目の catalog-info.yaml ファイルを生成する',
    'steps.generateCatalogInfoItems':
      '選択した各項目の catalog-info.yaml ファイルを生成する',
    'steps.trackStatus': '承認ステータスを追跡する',
    'table.headers.actions': 'アクション',
    'table.headers.catalogInfoYaml': 'catalog-info.yaml',
    'table.headers.group': 'グループ',
    'table.headers.lastUpdated': '最終更新',
    'table.headers.name': '名前',
    'table.headers.organization': '組織',
    'table.headers.organizationGroup': '組織/グループ',
    'table.headers.repoUrl': 'Git リポジトリー URL',
    'table.headers.status': 'ステータス',
    'table.headers.taskStatus': 'タスクのステータス',
    'table.headers.url': 'URL',
    'table.pagination.rows10': '10 行',
    'table.pagination.rows100': '100 行',
    'table.pagination.rows20': '20 行',
    'table.pagination.rows5': '5 行',
    'table.pagination.rows50': '50 行',
    'tasks.taskCancelled': 'キャンセル済み',
    'tasks.taskCompleted': '完了済み',
    'tasks.taskFailed': '失敗',
    'tasks.taskId': 'タスク ID',
    'tasks.taskLink': 'タスクのリンク',
    'tasks.taskOpen': '開',
    'tasks.taskProcessing': '処理中',
    'tasks.taskSkipped': 'スキップ済み',
    'tasks.tasksFor': '{{importJobStatusId}} のタスク',
    'tasks.viewTask': 'タスクの表示',
    'time.daysAgo': '{{count}} 日前',
    'time.hoursAgo': '{{count}} 時間前',
    'time.minutesAgo': '{{count}} 分前',
    'time.secondsAgo': '{{count}} 秒前',
    'validation.componentNameInvalid':
      '"{{value}}" は無効です。[a-zA-Z0-9] から成り、[-_.] のいずれかで区切られた一連の文字列 (合計最大 63 文字) が必要です。カタログファイル形式の詳細は、https://github.com/backstage/backstage/blob/master/docs/architecture-decisions/adr002-default-catalog-file-format.md を参照してください',
    'validation.componentNameRequired': 'コンポーネント名は必須です',
    'validation.descriptionRequired': '{{approvalTool}} の説明は必須です',
    'validation.entityOwnerRequired': 'エンティティー所有者は必須です',
    'validation.keyValuePairFormat':
      '各エントリーは、コロンで区切ったキーと値の形で指定する必要があります。',
    'validation.titleRequired': '{{approvalTool}} のタイトルは必須です',
    'workflows.viewWorkflow': 'ワークフローの表示',
    'workflows.workflowAborted': '中止',
    'workflows.workflowActive': 'アクティブ',
    'workflows.workflowCompleted': '完了済み',
    'workflows.workflowError': 'エラー',
    'workflows.workflowFetchError': 'ワークフロー取得エラー',
    'workflows.workflowId': 'ワークフロー ID',
    'workflows.workflowLink': 'ワークフローのリンク',
    'workflows.workflowPending': '保留中',
    'workflows.workflowSuspended': '一時停止中',
    'workflows.workflowsFor': '{{importJobStatusId}} のワークフロー',
  },
});

export default bulkImportTranslationJa;
