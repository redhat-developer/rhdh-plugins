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
import { aiExperienceTranslationRef } from './ref';

/**
 * Japanese translation for plugin.ai-experience.
 * @public
 */
const aiExperienceTranslationJa = createTranslationMessages({
  ref: aiExperienceTranslationRef,
  messages: {
    'accessibility.aiIllustration': 'AI のイラスト',
    'accessibility.aiModelsIllustration': 'AI モデルのイラスト',
    'accessibility.close': '閉じる',
    'common.guest': 'ゲスト',
    'common.latest': '最新',
    'common.more': 'その他',
    'common.template': 'テンプレート',
    'common.viewMore': 'さらに表示',
    'greeting.goodAfternoon': 'こんにちは',
    'greeting.goodEvening': 'こんばんは',
    'greeting.goodMorning': 'おはようございます',
    'learn.explore.cta': 'カタログに移動',
    'learn.explore.description':
      'AI モデル、サーバー、テンプレートを探索しましょう。',
    'learn.explore.title': '探索',
    'learn.getStarted.cta': 'Tech Docs に移動',
    'learn.getStarted.description':
      'Red Hat Developer Hub について学習しましょう。',
    'learn.getStarted.title': 'スタート',
    'learn.learn.cta': 'ラーニングパスに移動',
    'learn.learn.description':
      'AI 分野の新しいスキルを探索して習得しましょう。',
    'learn.learn.title': '学習',
    'modal.cancel': 'キャンセル',
    'modal.close': '閉じる',
    'modal.edit': '編集',
    'modal.save': '保存',
    'modal.title.edit': '添付ファイルの編集',
    'modal.title.preview': '添付ファイルのプレビュー',
    'news.fetchingRssFeed': 'RSS フィードを取得しています',
    'news.noContentAvailable': '利用可能なコンテンツがありません',
    'news.noContentDescription':
      '該当する RSS フィードからコンテンツを取得できなかったようです。URL を再確認してください。プラグインの設定ファイルを更新して別のソースに切り替えることもできます。',
    'news.noRssContent': 'RSS コンテンツなし',
    'news.pageTitle': 'AI ニュース',
    'page.subtitle': 'AI モデル、サーバー、ニュース、学習リソースの探索',
    'page.title': 'AI エクスペリエンス',
    'sections.discoverModels':
      '組織内で利用可能な AI モデルおよびサービスを探す',
    'sections.exploreAiModels': 'AI モデルの探索',
    'sections.exploreAiTemplates': 'AI テンプレートの探索',
    'sections.viewAllModels': '{{count}} 個のモデルをすべて表示する',
    'sections.viewAllTemplates': '{{count}} 個のテンプレートをすべて表示する',
  },
});

export default aiExperienceTranslationJa;
