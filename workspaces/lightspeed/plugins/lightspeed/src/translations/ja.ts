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

import { lightspeedTranslationRef } from './ref';

/**
 * Japanese translation for plugin.lightspeed.
 * @public
 */
const lightspeedTranslationJa = createTranslationMessages({
  ref: lightspeedTranslationRef,
  messages: {
    'aria.chatHistoryMenu': 'チャット履歴メニュー',
    'aria.chatbotSelector': 'チャットボットセレクター',
    'aria.close': 'チャットボットを閉じる',
    'aria.closeDrawerPanel': 'ドロワーパネルを閉じる',
    'aria.important': '重要',
    'aria.options.label': 'オプション',
    'aria.resize': 'サイズ変更',
    'aria.scroll.down': '一番下に戻る',
    'aria.scroll.up': '一番上に戻る',
    'aria.search.placeholder': '検索',
    'aria.searchPreviousConversations': '以前の会話の検索',
    'attach.menu.description': 'JSON、YAML、または TXT ファイルを添付',
    'attach.menu.title': '添付',
    'button.newChat': '新しいチャット',
    'chatbox.emptyState.noPinnedChats': 'チャットを固定して上部に表示',
    'chatbox.emptyState.noRecentChats': '最近のチャットがありません',
    'chatbox.emptyState.noResults.body':
      '検索クエリーを調整して再試行してください。スペルを確認するか、より一般的な用語をお試しください。',
    'chatbox.emptyState.noResults.title': '結果が見つかりません',
    'chatbox.fileUpload.failed': 'ファイルのアップロードに失敗しました',
    'chatbox.fileUpload.infoText':
      'サポートされているファイルの種類は、.txt、.yaml、.json です。最大ファイルサイズは 25 MB です。',
    'chatbox.header.title': 'Developer Hub インテリジェントアシスタント',
    'chatbox.message.placeholder': 'メッセージを送信',
    'chatbox.provider.other': 'その他',
    'chatbox.search.placeholder': '検索',
    'chatbox.welcome.description': '今日は何をお手伝いしましょうか?',
    'chatbox.welcome.greeting': 'こんにちは、{{userName}}',
    'common.cancel': 'キャンセル',
    'common.close': '閉じる',
    'common.loading': '読み込み中',
    'common.noSearchResults': '検索に一致する結果がありません',
    'common.readMore': 'さらに表示する',
    'common.retry': '再試行',
    'conversation.addToPinnedChats': '固定',
    'conversation.announcement.responseStopped': '応答を停止しました。',
    'conversation.announcement.userMessage':
      'ユーザーからのメッセージ: {{prompt}}。ボットからのメッセージを読み込んでいます。',
    'conversation.category.pinnedChats': '固定チャット',
    'conversation.category.recent': 'チャット',
    'conversation.delete': '削除',
    'conversation.delete.confirm.action': '削除',
    'conversation.delete.confirm.message':
      'このチャットはここに表示されなくなります。アクティビティ からのプロンプト、回答、フィードバックなど、関連アクティビティーも削除されます。',
    'conversation.delete.confirm.title': '"{{chatName}}" を削除しますか?',
    'conversation.removeFromPinnedChats': '固定解除',
    'conversation.rename': '名前の変更',
    'conversation.rename.confirm.action': '名前の変更',
    'conversation.rename.confirm.title': 'チャットの名前を変更しますか?',
    'conversation.rename.placeholder': 'チャット名',
    'disclaimer.withValidation':
      'この機能は AI テクノロジーを使用します。入力内容に個人情報やその他の機密情報を含めないでください。やり取りの内容は、Red Hat の製品やサービスを改善するために使用される場合があります。',
    'disclaimer.withoutValidation':
      'この機能は AI テクノロジーを使用します。入力内容に個人情報やその他の機密情報を含めないでください。やり取りの内容は、Red Hat の製品やサービスを改善するために使用される場合があります。',
    'error.context.fileAttachment':
      'useFileAttachmentContext が FileAttachmentContextProvider 内に収まっている必要があります',
    'feedback.completion.body':
      'ご回答を受け取りました。ご意見をお聞かせいただきありがとうございました!',
    'feedback.completion.title': 'フィードバックを送信しました',
    'feedback.form.submitWord': '送信',
    'feedback.form.textAreaPlaceholder':
      'その他ご意見をお聞かせください (任意)',
    'feedback.form.title': 'なぜこの評価を選んだのですか?',
    'feedback.quickResponses.negative.didntAnswer':
      '質問に対する答えが得られなかった',
    'feedback.quickResponses.negative.hardToUnderstand': 'わかりにくい',
    'feedback.quickResponses.negative.notHelpful': '役に立たない',
    'feedback.quickResponses.positive.easyToUnderstand': 'わかりやすい',
    'feedback.quickResponses.positive.helpful': '情報が役に立つ',
    'feedback.quickResponses.positive.resolvedIssue': '問題が解決した',
    'feedback.tooltips.badResponse': '回答内容が悪い',
    'feedback.tooltips.copied': 'コピー済み',
    'feedback.tooltips.copy': 'コピー',
    'feedback.tooltips.goodResponse': '回答内容が良い',
    'feedback.tooltips.listen': '聞き取り',
    'feedback.tooltips.listening': '聞き取り中',
    'file.upload.error.alreadyExists': 'ファイルがすでに存在します。',
    'file.upload.error.fileTooLarge':
      'ファイルサイズが大きすぎます。ファイルサイズが 25 MB 未満であることを確認してください。',
    'file.upload.error.multipleFiles': '複数のファイルをアップロードしました。',
    'file.upload.error.readFailed':
      'ファイルの読み取りに失敗しました: {{errorMessage}}',
    'file.upload.error.unsupportedType':
      'サポートされていないファイルタイプです。サポートされているタイプは、.txt、.yaml、.json です。',
    'footer.accuracy.label':
      'AI によって生成されたコンテンツは、使用する前に必ず確認してください。',
    'icon.lightspeed.alt': 'インテリジェントアシスタントアイコン',
    'icon.permissionRequired.alt': '権限不足アイコン',
    'lcore.loadError.description':
      'インテリジェントアシスタントバックエンドがモデル一覧を返しませんでした。サービスが実行中で到達可能か確認してから、もう一度お試しください。',
    'lcore.loadError.title': 'モデルを読み込めませんでした',
    'lcore.notConfigured.backendDocs':
      'インテリジェントアシスタントバックエンドのセットアップ',
    'lcore.notConfigured.description':
      'インテリジェントアシスタントを使用するには登録済みの LLM が必要です。セットアップを完了するには、組織のプラットフォーム管理者にお問い合わせください。',
    'lcore.notConfigured.developerLightspeedDocs':
      'Developer Hub Intelligent Assistant を構成中',
    'lcore.notConfigured.title': 'LLM に接続して始める',
    'mcp.settings.closeAriaLabel': 'MCP 設定を閉じる',
    'mcp.settings.closeConfigureModalAriaLabel': '設定モーダルを閉じる',
    'mcp.settings.configureServerTitle': '{{serverName}} サーバーを設定',
    'mcp.settings.edit': '編集',
    'mcp.settings.editServerAriaLabel': '{{serverName}} を編集',
    'mcp.settings.enabled': '有効',
    'mcp.settings.enterToken': 'トークンを入力してください',
    'mcp.settings.loading': 'MCP サーバーを読み込み中...',
    'mcp.settings.modalDescription':
      '認証情報は保存時に暗号化され、あなたのプロファイルに限定されます。インテリジェントアシスタントはあなたの権限で動作します。',
    'mcp.settings.name': '名前',
    'mcp.settings.noneAvailable': '利用可能な MCP サーバーはありません。',
    'mcp.settings.personalAccessToken': '個人アクセストークン',
    'mcp.settings.readOnlyAccess':
      'MCP サーバーへのアクセスは読み取り専用です。',
    'mcp.settings.removePersonalToken': '個人トークンを削除',
    'mcp.settings.savedToken': '保存済みトークン',
    'mcp.settings.selectedCount':
      '{{totalCount}} 件中 {{selectedCount}} 件を選択',
    'mcp.settings.status': 'ステータス',
    'mcp.settings.status.disabled': '無効',
    'mcp.settings.status.failed': '失敗',
    'mcp.settings.status.manyTools': '{{count}} 件のツール',
    'mcp.settings.status.oneTool': '{{count}} 件のツール',
    'mcp.settings.status.tokenRequired': 'トークンが必要',
    'mcp.settings.status.unknown': '不明',
    'mcp.settings.tableAriaLabel': 'MCP サーバーの表',
    'mcp.settings.title': 'MCP サーバー',
    'mcp.settings.toggleServerAriaLabel': '{{serverName}} を切り替える',
    'mcp.settings.token.clearAriaLabel': 'トークン入力をクリア',
    'mcp.settings.token.connectionSuccessful': '接続に成功しました',
    'mcp.settings.token.invalidCredentials':
      '認証情報が無効です。サーバー URL とトークンを確認してください。',
    'mcp.settings.token.savingAndValidating': 'トークンを保存して検証中...',
    'mcp.settings.token.urlUnavailableForValidation':
      'サーバー URL が利用できないため、トークンを検証できません。',
    'mcp.settings.token.validating': 'トークンを検証中...',
    'mcp.settings.token.validationFailed':
      '検証に失敗しました。サーバー URL とトークンを確認してください。',
    'mcp.settings.usingAdminCredential':
      '管理者が提供した認証情報を使用しています。アカウント用に上書きするには個人トークンを入力してください。',
    'menu.newConversation': '新しいチャット',
    'message.options.label': 'オプション',
    'modelSelector.disabled.tooltip':
      '各チャットセッションは1つのモデルのみをサポートしています。モデルを切り替えるには、新しいチャットを開いてください。',
    'modal.cancel': 'キャンセル',
    'modal.close': '閉じる',
    'modal.edit': '編集',
    'modal.save': '保存',
    'modal.title.edit': '添付ファイルの編集',
    'modal.title.preview': '添付ファイルのプレビュー',
    'notebook.document.delete': '削除',
    'notebook.document.delete.action': '削除',
    'notebook.document.delete.description':
      'このノートブックから <documentName/> を削除してもよろしいですか？この操作は元に戻せません。',
    'notebook.document.delete.success':
      '「{{documentName}}」が正常に削除されました。',
    'notebook.document.delete.title': 'リソースを削除しますか？',
    'notebook.overwrite.modal.action': '上書き',
    'notebook.overwrite.modal.description':
      '以下のファイルはこのノートブックに既に存在します。新しいバージョンで上書きしますか？',
    'notebook.overwrite.modal.title': 'ファイルを上書きしますか？',
    'notebook.upload.error.fileTooLarge':
      'アップロードエラー: ファイルサイズが 25 MB の制限を超えています。',
    'notebook.upload.error.tooManyFiles':
      'アップロードエラー: 最大 {{max}} ファイルまで許可されています。',
    'notebook.upload.error.unsupportedType':
      'アップロードエラー: サポートされていないファイル形式が見つかりました。サポートされているファイル形式のみをアップロードしてください。',
    'notebook.upload.failed': '「{{fileName}}」のアップロードに失敗しました。',
    'notebook.upload.modal.addButton': '追加 ({{count}})',
    'notebook.upload.modal.browseButton': 'アップロード',
    'notebook.upload.modal.dragDropTitle': 'ここにファイルをドラッグ&ドロップ',
    'notebook.upload.modal.infoText':
      '対応ファイル形式: .md, .txt, .pdf, .json, .yaml, .log',
    'notebook.upload.modal.removeFile': '{{fileName}} を削除',
    'notebook.upload.modal.selectedFiles':
      '{{max}} 件中 {{count}} 件のファイルを選択',
    'notebook.upload.modal.separator': 'または',
    'notebook.upload.modal.title': 'ノートブックにドキュメントを追加',
    'notebook.view.close': 'ノートブックを閉じる',
    'notebook.view.documents.add': '追加',
    'notebook.view.documents.count': '{{count}} 件のドキュメント',
    'notebook.view.documents.maxReached':
      '最大10個のドキュメントが許可されています。新しいドキュメントをアップロードするには、ドキュメントを削除してください。',
    'notebook.view.documents.uploading': 'ドキュメントをアップロード中',
    'notebook.view.input.disabledTooltip':
      'チャットを開始するには、少なくとも1つのロード済みリソースを選択してください',
    'notebook.view.input.placeholder': 'ドキュメントについて質問する...',
    'notebook.view.sidebar.collapse': 'サイドバーを折りたたむ',
    'notebook.view.sidebar.expand': 'サイドバーを展開する',
    'notebook.view.sidebar.resize': 'サイドバーのサイズを変更する',
    'notebook.view.title': '無題のノートブック',
    'notebook.view.upload.action': 'リソースをアップロード',
    'notebook.view.processing.description':
      'ファイルをインデックスしています。処理が完了すると質問を開始できます。',
    'notebook.view.processing.heading': 'リソースを処理中...',
    'notebook.view.upload.heading':
      'リソースをアップロードして開始してください',
    'notebooks.actions.delete': '削除',
    'notebooks.actions.rename': '名前の変更',
    'notebooks.card.openAria': 'ノートブック {{name}} を開く',
    'notebooks.delete.action': '削除',
    'notebooks.delete.message':
      'このノートブックはここに表示されなくなります。アクティビティに関連するプロンプト、応答、フィードバックも削除されます。',
    'notebooks.delete.title': '{{name}} を削除しますか?',
    'notebooks.delete.toast': 'ノートブックを削除しました！',
    'notebooks.documents': 'ドキュメント',
    'notebooks.empty.action': '新しいノートブックを作成',
    'notebooks.empty.description':
      '新しいノートブックを作成してソースを整理し、AI による洞察を生成します。',
    'notebooks.empty.title': '作成されたノートブックはありません',
    'notebooks.prompts.accessIssue.title': 'アクセスの問題を解決してください',
    'notebooks.prompts.coreConcepts.title': 'コアコンセプトは何ですか？',
    'notebooks.prompts.vulnerabilities.title': '重大な脆弱性を表示してください',
    'notebooks.rename.action': '送信',
    'notebooks.rename.description':
      'このノートブックの新しい名前を入力し、送信をクリックして続行してください。',
    'notebooks.rename.label': '新しい名前',
    'notebooks.rename.placeholder': '新しい名前',
    'notebooks.rename.title': '{{name}} の名前を変更しますか?',
    'notebooks.title': 'マイノートブック',
    'notebooks.updated.days': '{{days}}日前に更新',
    'notebooks.updated.on': '更新日',
    'notebooks.updated.today': '今日更新',
    'notebooks.updated.yesterday': '1日前に更新',
    'page.subtitle': 'AI 搭載開発アシスタント',
    'page.title': 'インテリジェントアシスタント',
    'permission.notebooks.goBack': '戻る',
    'permission.required.description':
      '<subject/> を表示するには、管理者に連絡して <permissions/> 権限を付与してもらうよう依頼してください。',
    'permission.required.title': '権限の不足',
    'permission.subject.notebooks': 'インテリジェントアシスタントノートブック',
    'permission.subject.plugin': 'インテリジェントアシスタントプラグイン',
    'prompts.codeOptimization.message':
      'コードを最適化してパフォーマンスを向上させるための一般的な方法を提案してくれませんか?',
    'prompts.codeOptimization.title': 'コードの最適化を提案する',
    'prompts.codeReadability.message':
      'コードの可読性と保守性を高めるための手法を提案してくれませんか?',
    'prompts.codeReadability.title': 'コードの可読性に関するヘルプを利用する',
    'prompts.debugging.message':
      'アプリケーションがデータベースに接続しようとするとエラーが発生します。問題の特定を手伝ってくれませんか?',
    'prompts.debugging.title': 'デバッグに関するヘルプを利用する',
    'prompts.developmentConcept.message':
      'マイクロサービスアーキテクチャーの仕組みと、モノリシックな設計と比べた利点について説明してくれませんか?',
    'prompts.developmentConcept.title': '開発コンセプトを説明する',
    'prompts.documentation.message':
      'Web アプリケーションでの OAuth 2.0 認証の実装に関するドキュメントを要約してくれませんか?',
    'prompts.documentation.title': 'ドキュメントの要約',
    'prompts.eventDriven.message':
      'イベント駆動型アーキテクチャーとは何か、またそれをソフトウェア開発でどのようなときに使用すると有益かを説明してくれませんか?',
    'prompts.eventDriven.title': 'イベント駆動型アーキテクチャーを理解する',
    'prompts.gitWorkflows.message':
      '既存の作業内容を失うことなく、別のブランチのコードに変更を加えたいです。Git を使用してこれを行うにはどうすればよいですか?',
    'prompts.gitWorkflows.title': 'Git を使用したワークフロー',
    'prompts.openshift.message':
      'コンテナー化されたアプリケーション用に OpenShift で新しいデプロイメントを作成する手順を説明してくれませんか?',
    'prompts.openshift.title': 'OpenShift デプロイメントの作成',
    'prompts.rhdh.message':
      'ソフトウェアカタログの探索やサービスの追加など、開発者が Developer Hub を利用する際にまず何をすべきか教えてくれませんか?',
    'prompts.rhdh.title': 'Red Hat Developer Hub を使い始める',
    'prompts.sortingAlgorithms.message':
      'クイックソートとマージソートのアルゴリズムの違いと、それぞれの使用タイミングについて説明してくれませんか?',
    'prompts.sortingAlgorithms.title':
      'ソートのアルゴリズムをわかりやすく説明する',
    'prompts.tekton.message':
      'Tekton パイプラインを使用してアプリケーションのデプロイを自動化するのを手伝ってくれませんか?',
    'prompts.tekton.title': 'Tekton を使用したデプロイ',
    'prompts.testingStrategies.message':
      '堅牢でエラーのないアプリケーションを構築するための一般的なテスト方法をいくつか提案してくれませんか?',
    'prompts.testingStrategies.title': 'テスト方法を提案する',
    'reasoning.thinking': '思考を表示',
    'settings.displayMode.docked': 'ウィンドウにドッキング',
    'settings.displayMode.fullscreen': 'フルスクリーン',
    'settings.displayMode.label': '表示モード',
    'settings.displayMode.overlay': 'オーバーレイ',
    'settings.mcp.badge': '新規',
    'settings.mcp.label': 'MCP 設定',
    'settings.pinned.disable': 'チャットの固定の無効化',
    'settings.pinned.disabled.description': 'チャットの固定は現在無効です',
    'settings.pinned.enable': 'チャットの固定の有効化',
    'settings.pinned.enabled.description': 'チャットの固定は現在有効です',
    'sort.alphabeticalAsc': '名前（A-Z）',
    'sort.alphabeticalDesc': '名前（Z-A）',
    'sort.label': '会話を並べ替え',
    'sort.newest': '日付（新しい順）',
    'sort.oldest': '日付（古い順）',
    'tabs.ariaLabel': 'インテリジェントアシスタントのビュー',
    'tabs.chat': 'チャット',
    'tabs.notebooks': 'ノートブック',
    'tabs.notebooks.devPreview': '開発者プレビュー',
    'tabs.notebooks.empty': 'ノートブックの内容はここに表示されます。',
    'toolCall.copyResponse': '応答をコピー',
    'toolCall.executing': 'ツールを実行中...',
    'toolCall.executionTime': '実行時間: ',
    'toolCall.header': 'ツールの応答: {{toolName}}',
    'toolCall.loading': 'ツールを実行中...',
    'toolCall.mcpServer': 'MCP サーバー',
    'toolCall.parameters': 'パラメーター',
    'toolCall.response': '応答',
    'toolCall.showLess': '表示を減らす',
    'toolCall.showMore': 'さらに表示',
    'toolCall.summary': '応答の概要は次のとおりです',
    'toolCall.thinking': '{{seconds}} 秒間考えました',
    'tooltip.attach': '割り当て',
    'tooltip.backToBottom': '一番下に戻る',
    'tooltip.backToTop': '一番上に戻る',
    'tooltip.chatHistoryMenu': 'チャット履歴メニュー',
    'tooltip.close': '閉じる',
    'tooltip.collapseHistoryPanel': 'チャット履歴を折りたたむ',
    'tooltip.expandHistoryPanel': 'チャット履歴を展開',
    'tooltip.fab.close': 'インテリジェントアシスタントを閉じる',
    'tooltip.fab.open': 'インテリジェントアシスタントを開く',
    'tooltip.microphone.active': '聞き取りを停止',
    'tooltip.microphone.inactive': 'マイクを使用する',
    'tooltip.quickNewChat': '新しいチャット',
    'tooltip.responseRecorded': '回答が記録されました',
    'tooltip.send': '送信',
    'user.guest': 'ゲスト',
    'user.loading': '...',
  },
});

export default lightspeedTranslationJa;
