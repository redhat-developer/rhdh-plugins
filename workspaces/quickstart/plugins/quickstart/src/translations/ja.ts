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
import { quickstartTranslationRef } from './ref';

/**
 * Japanese translation for plugin.quickstart.
 * @public
 */
const quickstartTranslationJa = createTranslationMessages({
  ref: quickstartTranslationRef,
  messages: {
    'header.title': 'Developer Hub を使い始めましょう',
    'header.subtitle': 'いくつかの簡単なステップをご案内します',
    'steps.setupAuthentication.title': '認証の設定',
    'steps.setupAuthentication.description':
      '不正アクセスからアカウントを保護するために、セキュアなログイン認証情報を設定します。',
    'steps.setupAuthentication.ctaTitle': '詳細',
    'steps.configureRbac.title': 'RBAC の設定',
    'steps.configureRbac.description':
      'ロールと権限を割り当てて、リソースを表示、作成、または編集できるユーザーを制御し、セキュアで効率的なコラボレーションを実現できます。',
    'steps.configureRbac.ctaTitle': 'アクセスの管理',
    'steps.configureGit.title': 'Git の設定',
    'steps.configureGit.description':
      'GitHub などの Git プロバイダーを接続して、コードの管理、ワークフローの自動化、プラットフォーム機能との統合を行います。',
    'steps.configureGit.ctaTitle': '詳細',
    'steps.managePlugins.title': 'プラグインの管理',
    'steps.managePlugins.description':
      '拡張機能を閲覧してインストールし、機能を追加したり、外部ツールと接続したり、エクスペリエンスをカスタマイズしたりできます。',
    'steps.managePlugins.ctaTitle': 'プラグインの探索',
    'steps.importApplication.title': 'アプリケーションのインポート',
    'steps.importApplication.description':
      '既存のコードやサービスをカタログにインポートして整理し、開発者ポータルからアクセスできます。',
    'steps.importApplication.ctaTitle': 'インポート',
    'steps.learnAboutCatalog.title': 'カタログについて学ぶ',
    'steps.learnAboutCatalog.description':
      'すべてのソフトウェアコンポーネント、サービス、API を探索し、その所有者やドキュメントを確認できます。',
    'steps.learnAboutCatalog.ctaTitle': 'カタログの表示',
    'steps.exploreSelfServiceTemplates.title':
      'セルフサービステンプレートを探索する',
    'steps.exploreSelfServiceTemplates.description':
      'セルフサービステンプレートを使用して、新しいプロジェクト、サービス、またはドキュメントをすばやく設定できます。',
    'steps.exploreSelfServiceTemplates.ctaTitle': 'テンプレートの探索',
    'steps.findAllLearningPaths.title': 'すべてのラーニングパスを見る',
    'steps.findAllLearningPaths.description':
      'ラーニングパスを利用してカスタマイズした e ラーニングをワークフローに統合し、オンボーディングの加速、スキルギャップの解消、ベストプラクティスの浸透を実現できます。',
    'steps.findAllLearningPaths.ctaTitle': 'ラーニングパスの表示',
    'button.quickstart': 'クイックスタート',
    'button.openQuickstartGuide': 'クイックスタートガイドを開く',
    'button.closeDrawer': 'ドロワーを閉じる',
    'button.gotIt': '了解しました!',
    'footer.progress': '進捗 {{progress}}%',
    'footer.notStarted': '開始されていません',
    'footer.hide': '非表示',
    'content.emptyState.title':
      '現在のロールではクイックスタートコンテンツを利用できません。',
    'item.expandAriaLabel': '{{title}} の詳細を展開',
    'item.collapseAriaLabel': '{{title}} の詳細を折りたたむ',
    'item.expandButtonAriaLabel': '項目を展開',
    'item.collapseButtonAriaLabel': '項目を折りたたむ',
    'dev.pageTitle': 'クイックスタートプラグインのテストページ',
    'dev.pageDescription':
      'これはクイックスタートプラグインのテストページです。以下のボタンを使用し、クイックスタートドロワーを操作してください。',
    'dev.drawerControls': 'ドロワーのコントロール',
    'dev.currentState': '現在のドロワーの状態: {{state}}',
    'dev.stateOpen': '開',
    'dev.stateClosed': '閉',
    'dev.instructions': '手順',
    'dev.step1':
      '1."クイックスタートガイドを開く" をクリックしてドロワーを開きます',
    'dev.step2': '2.クイックスタートのステップを順に進めます',
    'dev.step3': '3.ステップを完了して進捗の追跡をテストします',
    'dev.step4':
      '4.閉じるボタンまたはドロワー自体のコントロールを使用して、ドロワーを閉じることができます',
    'dev.step5': '5.進捗が自動的に localStorage に保存されます',
  },
});

export default quickstartTranslationJa;
