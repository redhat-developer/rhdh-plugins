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
    'page.title': '一括インポート',
    'page.subtitle': 'Red Hat Developer Hub へのエンティティーのインポート',
    'page.addRepositoriesTitle': 'リポジトリーの追加',
    'page.importEntitiesTitle': 'エンティティーのインポート',
    'page.addRepositoriesSubtitle':
      '4 ステップで Red Hat Developer Hub にリポジトリーを追加',
    'page.importEntitiesSubtitle': 'Red Hat Developer Hub へのインポート',
    'page.typeLink': '一括インポート',
    'sidebar.bulkImport': '一括インポート',
    'permissions.title': '権限が必要',
    'permissions.addRepositoriesMessage':
      'リポジトリーを追加するには、管理者に連絡して `bulk.import` 権限を付与してもらうよう依頼してください。',
    'status.alreadyImported': 'インポート済み',
    'status.added': '追加済み',
    'status.waitingForApproval': '承認待ち',
    'status.imported': 'インポート',
    'status.readyToImport': 'インポート準備完了',
    'status.waitingForPullRequestToStart': 'プルリクエスト開始待ち',
    'status.missingConfigurations': '設定の不足',
    'status.failedCreatingPR': 'PR の作成に失敗しました',
    'status.pullRequestRejected': 'プルリクエストが拒否されました',
    'errors.prErrorPermissions':
      '権限が不十分なため、新しい PR を作成できませんでした。管理者に問い合わせてください。',
    'errors.catalogInfoExists':
      'catalog-info.yaml がリポジトリーにすでに存在するため、新しい PR は作成されません。ただし、エンティティーはカタログページに登録されます。',
    'table.headers.name': '名前',
    'table.headers.url': 'URL',
    'table.headers.repoUrl': 'Git リポジトリー URL',
    'table.headers.organization': '組織',
    'table.headers.organizationGroup': '組織/グループ',
    'table.headers.group': 'グループ',
    'table.headers.status': 'ステータス',
    'table.headers.taskStatus': 'タスクのステータス',
    'table.headers.lastUpdated': '最終更新',
    'table.headers.actions': 'アクション',
    'table.headers.catalogInfoYaml': 'catalog-info.yaml',
    'table.pagination.rows5': '5 行',
    'table.pagination.rows10': '10 行',
    'table.pagination.rows20': '20 行',
    'table.pagination.rows50': '50 行',
    'table.pagination.rows100': '100 行',
    'steps.chooseApprovalTool':
      'プルリクエスト作成用のソース管理ツールを選択する',
    'steps.chooseRepositories': 'インポートする項目を選択する',
    'steps.chooseItems': 'インポートする項目を選択する',
    'steps.generateCatalogInfo':
      '選択した各項目の catalog-info.yaml ファイルを生成する',
    'steps.generateCatalogInfoItems':
      '選択した各項目の catalog-info.yaml ファイルを生成する',
    'steps.editPullRequest': 'プル/マージリクエストの詳細を表示する',
    'steps.trackStatus': '承認ステータスを追跡する',
    'addRepositories.approvalTool.title': 'ソース管理ツール',
    'addRepositories.approvalTool.description':
      'PR 作成用のソース管理ツールを選択してください',
    'addRepositories.approvalTool.tooltip':
      'インポートには承認が必要です。プルリクエストが承認されると、リポジトリーがカタログページにインポートされます。',
    'addRepositories.approvalTool.gitlab': 'GitLab',
    'addRepositories.repositoryType.title': 'リポジトリーの種類',
    'addRepositories.repositoryType.repository': 'リポジトリー',
    'addRepositories.repositoryType.organization': '組織',
    'addRepositories.repositoryType.project': 'プロジェクト',
    'addRepositories.repositoryType.group': 'グループ',
    'addRepositories.searchPlaceholder': '検索',
    'addRepositories.clearSearch': '検索のクリア',
    'addRepositories.noRepositoriesFound': 'リポジトリーが見つかりません',
    'addRepositories.allRepositoriesAdded':
      'すべてのリポジトリーが追加されました',
    'addRepositories.noSelection': 'なし',
    'addRepositories.selectRepositories': 'リポジトリーの選択',
    'addRepositories.selectedRepositories': 'リポジトリー',
    'addRepositories.selectedProjects': 'プロジェクト',
    'addRepositories.selectedLabel': '選択済み',
    'addRepositories.selectedCount': '{{count}} 件を選択済み',
    'addRepositories.addSelected': '選択した項目の追加',
    'addRepositories.generateCatalogInfo': 'catalog-info.yaml の生成',
    'addRepositories.editPullRequest': 'プルリクエストの編集',
    'addRepositories.preview': 'プレビュー',
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
    'time.daysAgo': '{{count}} 日前',
    'time.hoursAgo': '{{count}} 時間前',
    'time.minutesAgo': '{{count}} 分前',
    'time.secondsAgo': '{{count}} 秒前',
    'previewFile.previewFile': 'ファイルのプレビュー',
    'previewFile.previewFiles': 'ファイルのプレビュー',
    'previewFile.failedToCreatePR': 'PR の作成に失敗しました',
    'previewFile.prCreationUnsuccessful':
      '一部のリポジトリーで PR の作成に失敗しました。理由を確認するには、`編集` をクリックしてください。',
    'previewFile.failedToFetchPR':
      'プルリクエストの取得に失敗しました。以下に新しい YAML が生成されました。',
    'previewFile.invalidEntityYaml':
      'プルリクエスト内のエンティティー YAML が無効です (ファイルが空であるか、apiVersion、kind、または metadata.name がありません)。以下に新しい YAML が生成されました。',
    'previewFile.pullRequestText': 'プルリクエスト',
    'previewFile.viewRepository': 'リポジトリーの表示',
    'previewFile.closeDrawer': 'ドロワーを閉じる',
    'previewFile.keyValuePlaceholder': 'key1: value2; key2: value2',
    'previewFile.useSemicolonSeparator':
      'セミコロンを使用して {{label}} を区切ってください',
    'previewFile.pullRequest.title': 'プルリクエスト',
    'previewFile.pullRequest.mergeRequest': 'マージリクエスト',
    'previewFile.pullRequest.serviceNowTicket': 'ServiceNow チケット',
    'previewFile.pullRequest.details': '{{tool}} の詳細',
    'previewFile.pullRequest.titleLabel': '{{tool}} のタイトル',
    'previewFile.pullRequest.bodyLabel': '{{tool}} のボディー',
    'previewFile.pullRequest.titlePlaceholder':
      'Backstage カタログエンティティー記述子ファイルの追加',
    'previewFile.pullRequest.bodyPlaceholder': '説明文 (Markdown 対応)',
    'previewFile.pullRequest.entityConfiguration': 'エンティティー設定',
    'previewFile.pullRequest.componentNameLabel':
      '作成するコンポーネントの名前',
    'previewFile.pullRequest.componentNamePlaceholder': 'コンポーネント名',
    'previewFile.pullRequest.entityOwnerLabel': 'エンティティー所有者',
    'previewFile.pullRequest.entityOwnerPlaceholder': 'グループとユーザー',
    'previewFile.pullRequest.entityOwnerHelper':
      'リストから所有者を選択するか、グループまたはユーザーへの参照を入力してください',
    'previewFile.pullRequest.loadingText':
      'グループとユーザーを読み込んでいます',
    'previewFile.pullRequest.previewEntities': 'エンティティーのプレビュー',
    'previewFile.pullRequest.annotations': 'アノテーション',
    'previewFile.pullRequest.labels': 'ラベル',
    'previewFile.pullRequest.spec': '仕様',
    'previewFile.pullRequest.useCodeOwnersFile':
      'エンティティー所有者として *CODEOWNERS* ファイルを使用する',
    'previewFile.pullRequest.codeOwnersWarning':
      '警告: ターゲットのロケーションに CODEOWNERS ファイルが見つからない場合、失敗する可能性があります。',
    'forms.footer.createServiceNowTicket': 'ServiceNow チケットの作成',
    'forms.footer.createServiceNowTickets': 'ServiceNow チケットの作成',
    'forms.footer.createPullRequest': 'プルリクエストの作成',
    'forms.footer.createPullRequests': 'プルリクエストの作成',
    'forms.footer.selectRepositoryTooltip':
      'インポートするリポジトリーを選択してください。',
    'forms.footer.serviceNowTooltip':
      'ServiceNow チケットを作成する前に、Catalog-info.yaml ファイルを生成する必要があります',
    'forms.footer.importTooltip':
      'インポート用に Catalog-info.yaml ファイルを生成する必要があります。',
    'forms.footer.pullRequestTooltip':
      'プルリクエストを作成する前に、Catalog-info.yaml ファイルを生成する必要があります',
    'tasks.tasksFor': '{{importJobStatusId}} のタスク',
    'tasks.taskLink': 'タスクのリンク',
    'tasks.viewTask': 'タスクの表示',
    'tasks.taskCancelled': 'キャンセル済み',
    'tasks.taskCompleted': '完了済み',
    'tasks.taskFailed': '失敗',
    'tasks.taskOpen': '開',
    'tasks.taskProcessing': '処理中',
    'tasks.taskSkipped': 'スキップ済み',
    'workflows.workflowsFor': '{{importJobStatusId}} のワークフロー',
    'workflows.workflowLink': 'ワークフローのリンク',
    'workflows.viewWorkflow': 'ワークフローの表示',
    'workflows.workflowPending': '保留中',
    'workflows.workflowActive': 'アクティブ',
    'workflows.workflowCompleted': '完了済み',
    'workflows.workflowAborted': '中止',
    'workflows.workflowError': 'エラー',
    'workflows.workflowFetchError': 'ワークフロー取得エラー',
    'workflows.workflowSuspended': '一時停止中',
    'importActions.loading': '読み込み中...',
    'importActions.errorFetchingData': 'データの取得中にエラーが発生しました',
    'importActions.noActions':
      'このリポジトリーに対するインポート操作が見つかりません。',
  },
});

export default bulkImportTranslationJa;
