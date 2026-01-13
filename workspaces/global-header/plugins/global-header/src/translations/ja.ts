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
import { globalHeaderTranslationRef } from './ref';

/**
 * Japanese translation for plugin.global-header.
 * @public
 */
const globalHeaderTranslationJa = createTranslationMessages({
  ref: globalHeaderTranslationRef,
  messages: {
    'help.tooltip': 'ヘルプ',
    'help.noSupportLinks': 'サポートリンクがありません',
    'help.noSupportLinksSubtitle':
      '管理者がサポートリンクを設定する必要があります。',
    'help.quickStart': 'クイックスタート',
    'help.supportTitle': 'サポート',
    'profile.picture': 'プロファイル写真',
    'profile.settings': '設定',
    'profile.myProfile': 'マイプロファイル',
    'profile.signOut': 'サインアウト',
    'search.placeholder': '検索...',
    'search.noResults': '結果が見つかりません',
    'search.errorFetching': '結果の取得中にエラーが発生しました',
    'applicationLauncher.tooltip': 'アプリケーションランチャー',
    'applicationLauncher.noLinksTitle':
      'アプリケーションリンクが設定されていません',
    'applicationLauncher.noLinksSubtitle':
      'ここからすばやくアクセスできるように、動的プラグイン設定でアプリケーションリンクを設定してください。',
    'applicationLauncher.developerHub': 'Developer Hub',
    'applicationLauncher.rhdhLocal': 'RHDH Local',
    'applicationLauncher.sections.documentation': 'ドキュメント',
    'applicationLauncher.sections.developerTools': '開発者ツール',
    'starred.title': 'スター付き項目',
    'starred.removeTooltip': 'リストから削除',
    'starred.noItemsTitle': 'スター付き項目はまだありません',
    'starred.noItemsSubtitle':
      'エンティティーの名前の横にある星のアイコンをクリックすると、すぐにアクセスできるように、ここに保存されます。',
    'notifications.title': '通知',
    'notifications.unsupportedDismissOption':
      '終了オプション "{{option}}" はサポートされていません。現在サポートされているのは、"none"、"session"、または "localstorage" です!',
    'create.title': 'セルフサービス',
    'create.registerComponent.title': 'コンポーネントの登録',
    'create.registerComponent.subtitle': 'カタログページへのインポート',
    'create.templates.sectionTitle': 'テンプレートの使用',
    'create.templates.allTemplates': 'すべてのテンプレート',
    'create.templates.errorFetching':
      'テンプレートの取得中にエラーが発生しました',
    'create.templates.noTemplatesAvailable':
      '利用できるテンプレートがありません',
  },
});

export default globalHeaderTranslationJa;
