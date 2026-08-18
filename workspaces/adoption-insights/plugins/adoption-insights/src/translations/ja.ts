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
    'activeUsers.averagePrefix': '平均ピークアクティブユーザー数は',
    'activeUsers.averageSuffix': ' でした (対象期間中)。',
    'activeUsers.averageText': '{{period}} あたり {{count}}',
    'activeUsers.day': '日',
    'activeUsers.hour': '時間',
    'activeUsers.legend.newUsers': '新規ユーザー',
    'activeUsers.legend.returningUsers': 'リピートユーザー',
    'activeUsers.month': '月',
    'activeUsers.title': 'アクティブユーザー',
    'activeUsers.week': '週',
    'catalogEntities.allTitle': 'すべてのカタログエンティティー',
    'catalogEntities.title': '上位のカタログエンティティー',
    'catalogEntities.topNTitle': '上位 {{count}} 件のカタログエンティティー',
    'common.csvFilename': 'active_users',
    'common.downloading': 'ダウンロード中...',
    'common.exportCSV': 'CSV エクスポート',
    'common.filteredBy': 'フィルタリング条件',
    'common.invalidDateFormat': '無効な日付形式',
    'common.loading': '読み込み中',
    'common.noResults': 'この日付範囲の結果はありません。',
    'common.numberOfSearches': '検索数',
    'common.readMore': '続きを読む',
    'common.today': '今日',
    'common.yesterday': '昨日',
    'filter.all': 'すべて',
    'filter.selectKind': '種類の選択',
    'header.dateRange.cancel': 'キャンセル',
    'header.dateRange.dateRange': '日付範囲...',
    'header.dateRange.defaultLabel': '過去 28 日間',
    'header.dateRange.endDate': '終了日',
    'header.dateRange.last28Days': '過去 28 日間',
    'header.dateRange.lastMonth': '先月',
    'header.dateRange.lastWeek': '先週',
    'header.dateRange.lastYear': '去年',
    'header.dateRange.ok': 'OK',
    'header.dateRange.startDate': '開始日',
    'header.dateRange.title': '日付範囲',
    'header.dateRange.today': '今日',
    'header.title': 'Adoption Insights',
    'page.title': 'Adoption Insights',
    'permission.description':
      '"Adoption Insights" プラグインを表示するには、管理者に連絡して adoption-insights.events.read 権限を付与してもらうよう依頼してください。',
    'permission.title': '権限の不足',
    'plugins.allTitle': 'すべてのプラグイン',
    'plugins.title': '上位のプラグイン',
    'plugins.topNTitle': '上位 {{count}} 件のプラグイン',
    'searches.averagePrefix': '平均検索回数は',
    'searches.averageSuffix': ' でした (対象期間中)。',
    'searches.averageText': '{{period}} あたり {{count}}',
    'searches.day': '日',
    'searches.hour': '時間',
    'searches.month': '月',
    'searches.title': '上位の検索',
    'searches.totalCount': '{{count}} 件の検索',
    'searches.week': '週',
    'table.headers.entity': 'エンティティー',
    'table.headers.executions': '実行回数',
    'table.headers.kind': '種類',
    'table.headers.lastUsed': '最終使用',
    'table.headers.name': '名前',
    'table.headers.trend': 'トレンド',
    'table.headers.views': '表示回数',
    'table.pagination.topN': '上位 {{count}} 件',
    'techDocs.allTitle': 'すべての TechDocs',
    'techDocs.title': '上位の TechDocs',
    'techDocs.topNTitle': '上位 {{count}} 件の TechDocs',
    'templates.allTitle': 'すべてのテンプレート',
    'templates.title': '上位のテンプレート',
    'templates.topNTitle': '上位 {{count}} 件のテンプレート',
    'users.haveLoggedIn': 'ログイン済み',
    'users.licensed': 'ライセンス保有',
    'users.licensedNotLoggedIn': 'ライセンス保有 (ログインなし)',
    'users.loggedInUsers': 'ログイン済みユーザー',
    'users.ofTotal': '/ {{total}}',
    'users.title': '総ユーザー数',
    'users.tooltip': 'ライセンスユーザー数は app-config.yaml で設定します',
  },
});

export default adoptionInsightsTranslationJa;
