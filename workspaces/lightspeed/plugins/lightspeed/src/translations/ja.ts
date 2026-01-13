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
    'page.title': 'Lightspeed',
    'page.subtitle': 'AI 搭載開発アシスタント',
    'prompts.codeReadability.title': 'コードの可読性に関するヘルプを利用する',
    'prompts.codeReadability.message':
      'コードの可読性と保守性を高めるための手法を提案してくれませんか?',
    'prompts.debugging.title': 'デバッグに関するヘルプを利用する',
    'prompts.debugging.message':
      'アプリケーションがデータベースに接続しようとするとエラーが発生します。問題の特定を手伝ってくれませんか?',
    'prompts.developmentConcept.title': '開発コンセプトを説明する',
    'prompts.developmentConcept.message':
      'マイクロサービスアーキテクチャーの仕組みと、モノリシックな設計と比べた利点について説明してくれませんか?',
    'prompts.codeOptimization.title': 'コードの最適化を提案する',
    'prompts.codeOptimization.message':
      'コードを最適化してパフォーマンスを向上させるための一般的な方法を提案してくれませんか?',
    'prompts.documentation.title': 'ドキュメントの要約',
    'prompts.documentation.message':
      'Web アプリケーションでの OAuth 2.0 認証の実装に関するドキュメントを要約してくれませんか?',
    'prompts.gitWorkflows.title': 'Git を使用したワークフロー',
    'prompts.gitWorkflows.message':
      '既存の作業内容を失うことなく、別のブランチのコードに変更を加えたいです。Git を使用してこれを行うにはどうすればよいですか?',
    'prompts.testingStrategies.title': 'テスト方法を提案する',
    'prompts.testingStrategies.message':
      '堅牢でエラーのないアプリケーションを構築するための一般的なテスト方法をいくつか提案してくれませんか?',
    'prompts.sortingAlgorithms.title':
      'ソートのアルゴリズムをわかりやすく説明する',
    'prompts.sortingAlgorithms.message':
      'クイックソートとマージソートのアルゴリズムの違いと、それぞれの使用タイミングについて説明してくれませんか?',
    'prompts.eventDriven.title': 'イベント駆動型アーキテクチャーを理解する',
    'prompts.eventDriven.message':
      'イベント駆動型アーキテクチャーとは何か、またそれをソフトウェア開発でどのようなときに使用すると有益かを説明してくれませんか?',
    'prompts.tekton.title': 'Tekton を使用したデプロイ',
    'prompts.tekton.message':
      'Tekton パイプラインを使用してアプリケーションのデプロイを自動化するのを手伝ってくれませんか?',
    'prompts.openshift.title': 'OpenShift デプロイメントの作成',
    'prompts.openshift.message':
      'コンテナー化されたアプリケーション用に OpenShift で新しいデプロイメントを作成する手順を説明してくれませんか?',
    'prompts.rhdh.title': 'Red Hat Developer Hub を使い始める',
    'prompts.rhdh.message':
      'ソフトウェアカタログの探索やサービスの追加など、開発者が Developer Hub を利用する際にまず何をすべきか教えてくれませんか?',
    'conversation.delete.confirm.title': 'チャットを削除しますか?',
    'conversation.delete.confirm.message':
      'このチャットはここに表示されなくなります。Lightspeed Activity からのプロンプト、回答、フィードバックなど、関連アクティビティーも削除されます。',
    'conversation.delete.confirm.action': '削除',
    'conversation.rename.confirm.title': 'チャットの名前を変更しますか?',
    'conversation.rename.confirm.action': '名前の変更',
    'conversation.rename.placeholder': 'チャット名',
    'conversation.action.error': 'エラーが発生しました: {{error}}',
    'permission.required.title': '権限の不足',
    'permission.required.description':
      'lightspeed プラグインを表示するには、管理者に連絡して <b>lightspeed.chat.read</b> および <b>lightspeed.chat.create</b> 権限を付与してもらうよう依頼してください。',
    'disclaimer.withValidation':
      'この機能は AI テクノロジーを使用します。入力内容に個人情報やその他の機密情報を含めないでください。やり取りの内容は、Red Hat の製品やサービスを改善するために使用される場合があります。',
    'disclaimer.withoutValidation':
      'この機能は AI テクノロジーを使用します。入力内容に個人情報やその他の機密情報を含めないでください。やり取りの内容は、Red Hat の製品やサービスを改善するために使用される場合があります。',
    'footer.accuracy.label':
      'AI によって生成されたコンテンツは、使用する前に必ず確認してください。',
    'footer.accuracy.popover.title': '正確性の確認',
    'footer.accuracy.popover.description':
      'Developer Lightspeed は正確性を期すよう努めておりますが、誤りが生じる可能性は常にあります。特に意思決定や行動に関わる重要な情報については、信頼できる情報源でその情報を確認することを推奨します。',
    'footer.accuracy.popover.image.alt': '脚注ポップオーバーのサンプル画像',
    'footer.accuracy.popover.cta.label': '了解しました',
    'footer.accuracy.popover.link.label': '詳細',
    'common.cancel': 'キャンセル',
    'common.close': '閉じる',
    'common.readMore': 'さらに表示する',
    'common.noSearchResults': '検索に一致する結果がありません',
    'menu.newConversation': '新しいチャット',
    'chatbox.header.title': 'Developer Lightspeed',
    'chatbox.search.placeholder': '検索',
    'chatbox.provider.other': 'その他',
    'chatbox.emptyState.noPinnedChats': '固定したチャットがありません',
    'chatbox.emptyState.noRecentChats': '最近のチャットがありません',
    'chatbox.emptyState.noResults.title': '結果が見つかりません',
    'chatbox.emptyState.noResults.body':
      '検索クエリーを調整して再試行してください。スペルを確認するか、より一般的な用語をお試しください。',
    'chatbox.welcome.greeting': 'こんにちは、{{userName}}',
    'chatbox.welcome.description': '今日は何をお手伝いしましょうか?',
    'chatbox.message.placeholder':
      'メッセージを送信し、必要に応じて JSON、YAML、または TXT ファイルをアップロードします...',
    'chatbox.fileUpload.failed': 'ファイルのアップロードに失敗しました',
    'chatbox.fileUpload.infoText':
      'サポートされているファイルの種類は、.txt、.yaml、.json です。最大ファイルサイズは 25 MB です。',
    'aria.chatbotSelector': 'チャットボットセレクター',
    'aria.important': '重要',
    'aria.chatHistoryMenu': 'チャット履歴メニュー',
    'aria.closeDrawerPanel': 'ドロワーパネルを閉じる',
    'aria.search.placeholder': '検索',
    'aria.searchPreviousConversations': '以前の会話の検索',
    'aria.resize': 'サイズ変更',
    'aria.options.label': 'オプション',
    'aria.scroll.down': '一番下に戻る',
    'aria.scroll.up': '一番上に戻る',
    'aria.settings.label': 'チャットボットのオプション',
    'modal.edit': '編集',
    'modal.save': '保存',
    'modal.close': '閉じる',
    'modal.cancel': 'キャンセル',
    'conversation.delete': '削除',
    'conversation.rename': '名前の変更',
    'conversation.addToPinnedChats': '固定',
    'conversation.removeFromPinnedChats': '固定解除',
    'conversation.announcement.userMessage':
      'ユーザーからのメッセージ: {{prompt}}。ボットからのメッセージを読み込んでいます。',
    'user.guest': 'ゲスト',
    'user.loading': '...',
    'tooltip.attach': '割り当て',
    'tooltip.send': '送信',
    'tooltip.microphone.active': '聞き取りを停止',
    'tooltip.microphone.inactive': 'マイクを使用する',
    'button.newChat': '新しいチャット',
    'tooltip.chatHistoryMenu': 'チャット履歴メニュー',
    'tooltip.responseRecorded': '回答が記録されました',
    'tooltip.backToTop': '一番上に戻る',
    'tooltip.backToBottom': '一番下に戻る',
    'tooltip.settings': 'チャットボットのオプション',
    'modal.title.preview': '添付ファイルのプレビュー',
    'modal.title.edit': '添付ファイルの編集',
    'icon.lightspeed.alt': 'lightspeed アイコン',
    'icon.permissionRequired.alt': '権限不足アイコン',
    'message.options.label': 'オプション',
    'file.upload.error.alreadyExists': 'ファイルがすでに存在します。',
    'file.upload.error.multipleFiles': '複数のファイルをアップロードしました。',
    'file.upload.error.unsupportedType':
      'サポートされていないファイルタイプです。サポートされているタイプは、.txt、.yaml、.json です。',
    'file.upload.error.fileTooLarge':
      'ファイルサイズが大きすぎます。ファイルサイズが 25 MB 未満であることを確認してください。',
    'file.upload.error.readFailed':
      'ファイルの読み取りに失敗しました: {{errorMessage}}',
    'error.context.fileAttachment':
      'useFileAttachmentContext が FileAttachmentContextProvider 内に収まっている必要があります',
    'feedback.form.title': 'なぜこの評価を選んだのですか?',
    'feedback.form.textAreaPlaceholder':
      'その他ご意見をお聞かせください (任意)',
    'feedback.form.submitWord': '送信',
    'feedback.tooltips.goodResponse': '回答内容が良い',
    'feedback.tooltips.badResponse': '回答内容が悪い',
    'feedback.tooltips.copied': 'コピー済み',
    'feedback.tooltips.copy': 'コピー',
    'feedback.tooltips.listening': '聞き取り中',
    'feedback.tooltips.listen': '聞き取り',
    'feedback.quickResponses.positive.helpful': '情報が役に立つ',
    'feedback.quickResponses.positive.easyToUnderstand': 'わかりやすい',
    'feedback.quickResponses.positive.resolvedIssue': '問題が解決した',
    'feedback.quickResponses.negative.didntAnswer':
      '質問に対する答えが得られなかった',
    'feedback.quickResponses.negative.hardToUnderstand': 'わかりにくい',
    'feedback.quickResponses.negative.notHelpful': '役に立たない',
    'feedback.completion.title': 'フィードバックを送信しました',
    'feedback.completion.body':
      'ご回答を受け取りました。ご意見をお聞かせいただきありがとうございました!',
    'conversation.category.pinnedChats': '固定',
    'conversation.category.recent': '最近',
    'settings.pinned.enable': 'チャットの固定の有効化',
    'settings.pinned.disable': 'チャットの固定の無効化',
    'settings.pinned.enabled.description': 'チャットの固定は現在有効です',
    'settings.pinned.disabled.description': 'チャットの固定は現在無効です',
  },
});

export default lightspeedTranslationJa;
