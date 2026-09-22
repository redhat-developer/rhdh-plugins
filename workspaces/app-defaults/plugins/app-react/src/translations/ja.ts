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

import { createTranslationMessages } from '@backstage/frontend-plugin-api';
import { appReactTranslationRef } from './ref';

/**
 * @internal
 */
export default createTranslationMessages({
  ref: appReactTranslationRef,
  full: true,
  messages: {
    'pages.Home': 'ホーム',
    'pages.Catalog': 'カタログ',
    'pages.APIs': 'API',
    'pages.Create': '作成',
    'pages.Docs': 'ドキュメント',
    'pages.Learning Paths': 'ラーニングパス',
    'pages.Settings': '設定',
    'pages.Notifications': '通知',
    'pages.Search': '検索',
    'pages.Catalog Graph': 'カタロググラフ',
    'pages.Administration': '管理',
    'pages.RBAC': 'RBAC',
    'pages.Plugins': 'プラグイン',
    'catalog.entityTabGroups.Overview': '概要',
    'catalog.entityTabGroups.Documentation': 'ドキュメント',
    'catalog.entityTabGroups.Development': '開発',
    'catalog.entityTabGroups.Deployment': 'デプロイメント',
    'catalog.entityTabGroups.Operation': '運用',
    'catalog.entityTabGroups.Observability': 'オブザーバビリティ',
    'catalog.entityTabs.Overview': '概要',
    'catalog.entityTabs.Docs': 'ドキュメント',
    'catalog.entityTabs.API': 'API',
    'catalog.entityTabs.Dependencies': '依存関係',
    'catalog.entityTabs.Definition': '定義',
    'catalog.entityTabs.APIs': 'API',
    'catalog.entityTabs.TechDocs': 'TechDocs',
    'catalog.entityTabs.Deployment Lifecycle': 'デプロイメントのライフサイクル',
    'catalog.entityTabs.Deployment Summary': 'デプロイメントの概要',
    'catalog.entityTabs.Pipelines': 'パイプライン',
    'catalog.entityTabs.Pull Requests': 'プルリクエスト',
    'catalog.entityTabs.Bookmarks': 'ブックマーク',
    'catalog.entityTabs.CI/CD': 'CI/CD',
    'catalog.entityTabs.CI/CD Statistics': 'CI/CD統計',
    'catalog.entityTabs.Code Coverage': 'コードカバレッジ',
    'catalog.entityTabs.Feedback': 'フィードバック',
    'catalog.entityTabs.GitHub Actions': 'GitHub Actions',
    'catalog.entityTabs.GitHub Issues': 'GitHub Issues',
    'catalog.entityTabs.CI/CD Security': 'CI/CDセキュリティ',
    'catalog.entityTabs.Build Artifacts': 'ビルドアーティファクト',
    'catalog.entityTabs.Todo': 'ToDo',
    'catalog.entityTabs.Topology': 'トポロジー',
    'catalog.entityTabs.Workflows': 'ワークフロー',
  },
});
