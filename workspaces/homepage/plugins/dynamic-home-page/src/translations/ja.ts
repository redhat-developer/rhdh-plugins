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
import { homepageTranslationRef } from './ref';

/**
 * Japanese translation for plugin.dynamic-home-page.
 * @public
 */
const homepageTranslationJa = createTranslationMessages({
  ref: homepageTranslationRef,
  messages: {
    'header.welcome': 'おかえりなさい!',
    'header.welcomePersonalized': 'おかえりなさい、{{name}}!',
    'header.local': 'ローカル',
    'homePage.empty':
      'ホームページカード (マウントポイント) が設定されていないか見つかりません。',
    'search.placeholder': '検索',
    'quickAccess.title': 'クイックアクセス',
    'quickAccess.fetchError': 'データを取得できませんでした。',
    'quickAccess.error': '不明なエラー',
    'featuredDocs.learnMore': ' 詳細',
    'templates.title': 'テンプレートの探索',
    'templates.fetchError': 'データを取得できませんでした。',
    'templates.error': '不明なエラー',
    'templates.empty': 'テンプレートはまだ追加されていません',
    'templates.emptyDescription':
      'テンプレートが追加されると、利用状況に合わせてカスタマイズされた関連コンテンツがこのスペースに表示されます。',
    'templates.register': 'テンプレートの登録',
    'templates.viewAll': '{{count}} 個のテンプレートをすべて表示する',
    'onboarding.greeting.goodMorning': 'おはようございます',
    'onboarding.greeting.goodAfternoon': 'こんにちは',
    'onboarding.greeting.goodEvening': 'こんばんは',
    'onboarding.guest': 'ゲスト',
    'onboarding.getStarted.title': 'スタート',
    'onboarding.getStarted.description':
      'Red Hat Developer Hub について学習しましょう。',
    'onboarding.getStarted.buttonText': 'ドキュメントを読む',
    'onboarding.getStarted.ariaLabel':
      'ドキュメントを読む (新しいタブで開きます)',
    'onboarding.explore.title': '探索',
    'onboarding.explore.description':
      'コンポーネント、API、テンプレートを探索しましょう。',
    'onboarding.explore.buttonText': 'カタログに移動',
    'onboarding.explore.ariaLabel': 'カタログに移動',
    'onboarding.learn.title': '学習',
    'onboarding.learn.description': '新しいスキルを探索して習得しましょう。',
    'onboarding.learn.buttonText': 'ラーニングパスに移動',
    'onboarding.learn.ariaLabel': 'ラーニングパスに移動',
    'entities.title': 'ソフトウェアカタログの探索',
    'entities.fetchError': 'データを取得できませんでした。',
    'entities.error': '不明なエラー',
    'entities.description':
      '組織内で利用可能なシステム、コンポーネント、リソース、API を閲覧します。',
    'entities.close': '閉じる',
    'entities.empty': 'ソフトウェアカタログはまだ追加されていません',
    'entities.emptyDescription':
      'ソフトウェアカタログが追加されると、利用状況に合わせてカスタマイズされた関連コンテンツがこのスペースに表示されます。',
    'entities.register': 'コンポーネントの登録',
    'entities.viewAll': '{{count}} 個のカタログエンティティーをすべて表示する',
  },
});

export default homepageTranslationJa;
