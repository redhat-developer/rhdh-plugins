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
import { adoptionInsightsTranslationRef } from './ref';

/**
 * Japanese translation for plugin.adoption-insights.
 * @alpha
 */
const adoptionInsightsTranslationJa = createTranslationMessages({
  ref: adoptionInsightsTranslationRef,
  messages: {
    'page.title': 'Adoption Insights',
    'header.title': 'Adoption Insights',
    'header.dateRange.today': '今日',
    'header.dateRange.lastWeek': '先週',
    'header.dateRange.lastMonth': '先月',
    'header.dateRange.last28Days': '過去 28 日間',
    'header.dateRange.lastYear': '去年',
    'header.dateRange.dateRange': '日付範囲...',
    'header.dateRange.cancel': 'キャンセル',
    'header.dateRange.ok': 'OK',
    'header.dateRange.defaultLabel': '過去 28 日間',
    'header.dateRange.title': '日付範囲',
    'header.dateRange.startDate': '開始日',
    'header.dateRange.endDate': '終了日',
    'activeUsers.title': 'アクティブユーザー',
    'activeUsers.averagePrefix': '平均ピークアクティブユーザー数は',
    'activeUsers.averageText': '{{period}} あたり {{count}}',
    'activeUsers.averageSuffix': ' でした (対象期間中)。',
    'activeUsers.hour': '時間',
    'activeUsers.day': '日',
    'activeUsers.week': '週',
    'activeUsers.month': '月',
    'activeUsers.legend.newUsers': '新規ユーザー',
    'activeUsers.legend.returningUsers': 'リピートユーザー',
    'templates.title': '上位のテンプレート',
    'templates.topNTitle': '上位 {{count}} 件のテンプレート',
    'templates.allTitle': 'すべてのテンプレート',
    'catalogEntities.title': '上位のカタログエンティティー',
    'catalogEntities.topNTitle': '上位 {{count}} 件のカタログエンティティー',
    'catalogEntities.allTitle': 'すべてのカタログエンティティー',
    'plugins.title': '上位のプラグイン',
    'plugins.topNTitle': '上位 {{count}} 件のプラグイン',
    'plugins.allTitle': 'すべてのプラグイン',
    'techDocs.title': '上位の TechDocs',
    'techDocs.topNTitle': '上位 {{count}} 件の TechDocs',
    'techDocs.allTitle': 'すべての TechDocs',
    'searches.title': '上位の検索',
    'searches.totalCount': '{{count}} 件の検索',
    'searches.averagePrefix': '平均検索回数は',
    'searches.averageText': '{{period}} あたり {{count}}',
    'searches.averageSuffix': ' でした (対象期間中)。',
    'searches.hour': '時間',
    'searches.day': '日',
    'searches.week': '週',
    'searches.month': '月',
    'users.title': '総ユーザー数',
    'users.haveLoggedIn': 'ログイン済み',
    'users.loggedInUsers': 'ログイン済みユーザー',
    'users.licensed': 'ライセンス保有',
    'users.licensedNotLoggedIn': 'ライセンス保有 (ログインなし)',
    'users.ofTotal': '{{total}} 中',
    'users.tooltip': 'ライセンスユーザー数は app-config.yaml で設定します',
    'table.headers.name': '名前',
    'table.headers.kind': '種類',
    'table.headers.lastUsed': '最終使用',
    'table.headers.views': '表示回数',
    'table.headers.executions': '実行回数',
    'table.headers.trend': 'トレンド',
    'table.headers.entity': 'エンティティー',
    'table.pagination.topN': '上位 {{count}} 件',
    'filter.all': 'すべて',
    'filter.selectKind': '種類の選択',
    'common.noResults': 'この日付範囲の結果はありません。',
    'common.readMore': 'さらに表示する',
    'common.exportCSV': 'CSV エクスポート',
    'common.downloading': 'ダウンロード中...',
    'common.today': '今日',
    'common.yesterday': '昨日',
    'common.numberOfSearches': '検索数',
    'common.filteredBy': 'フィルタリング条件',
    'common.invalidDateFormat': '無効な日付形式',
    'common.csvFilename': 'active_users',
    'permission.title': '権限の不足',
    'permission.description':
      '"Adoption Insights" プラグインを表示するには、管理者に連絡して adoption-insights.events.read 権限を付与してもらうよう依頼してください。',
  },
});

export default adoptionInsightsTranslationJa;
