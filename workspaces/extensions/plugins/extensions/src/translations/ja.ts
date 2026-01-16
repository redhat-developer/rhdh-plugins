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
import { extensionsTranslationRef } from './ref';

/**
 * Japanese translation for plugin.extensions.
 * @public
 */
const extensionsTranslationJa = createTranslationMessages({
  ref: extensionsTranslationRef,
  messages: {
    'header.title': '拡張機能',
    'header.extensions': '拡張機能',
    'header.catalog': 'カタログ',
    'header.installedPackages': 'インストール済みパッケージ',
    'header.installedPackagesWithCount':
      'インストール済みパッケージ ({{count}})',
    'header.pluginsPage': 'プラグイン',
    'header.packagesPage': 'パッケージ',
    'header.collectionsPage': 'コレクション',
    'button.install': 'インストール',
    'button.uninstall': 'アンインストール',
    'button.enable': '有効にする',
    'button.disable': '無効にする',
    'button.update': '更新',
    'button.save': '保存',
    'button.close': '閉じる',
    'button.viewAll': 'すべてのプラグインの表示',
    'button.viewDocumentation': 'ドキュメントの表示',
    'button.viewInstalledPlugins':
      'インストール済みプラグインの表示 ({{count}})',
    'button.restart': '再起動が必要です',
    'status.notInstalled': 'インストールされていません',
    'status.installed': 'インストール済み',
    'status.disabled': '無効',
    'status.partiallyInstalled': '部分的にインストール済み',
    'status.updateAvailable': '更新が利用可能',
    'role.backend': 'バックエンド',
    'role.backendModule': 'バックエンドモジュール',
    'role.frontend': 'フロントエンド',
    'emptyState.noPluginsFound': 'プラグインが見つかりません',
    'emptyState.mustEnableBackend':
      'Extensions バックエンドプラグインを有効にする必要があります',
    'emptyState.noPluginsDescription':
      'プラグインの読み込み中にエラーが発生しました。解決するには、設定を確認するか、プラグインのドキュメントを確認してください。利用可能な他のプラグインを探すこともできます。',
    'emptyState.configureBackend':
      "'@red-hat-developer-hub/backstage-plugin-extensions-backend' プラグインを設定してください。",
    'alert.productionDisabled':
      '実稼働環境ではプラグインのインストールが無効になっています。',
    'alert.installationDisabled':
      'プラグインのインストールが無効になっています。',
    'alert.missingDynamicArtifact':
      'このパッケージを管理できません。アクションを有効にするには、必要な **spec.dynamicArtifact** を持つカタログエンティティーを追加する必要があります。',
    'alert.missingDynamicArtifactTitle': 'パッケージを変更できません',
    'alert.missingDynamicArtifactForPlugin':
      'このプラグインを管理できません。アクションを有効にするには、必要な **spec.dynamicArtifact** を持つカタログエンティティーを、関連するすべてのパッケージに追加する必要があります。',
    'alert.missingDynamicArtifactTitlePlugin': 'プラグインを変更できません',
    'alert.extensionsExample':
      'これを有効にするには、dynamic-plugins 設定ファイルで拡張機能設定を追加または変更してください。',
    'alert.singlePluginRestart':
      '**{{pluginName}}** プラグインが、インストール、更新、有効化、または無効化を完了するために、バックエンドシステムの再起動を必要としています。',
    'alert.multiplePluginRestart':
      '**{{count}}** 個のプラグインが、インストール、更新、有効化、または無効化を完了するために、バックエンドシステムの再起動を必要としています。',
    'alert.singlePackageRestart':
      '**{{packageName}}** パッケージが、インストール、更新、有効化、または無効化を完了するために、バックエンドシステムの再起動を必要としています。',
    'alert.multiplePackageRestart':
      '**{{count}}** 個のパッケージが、インストール、更新、有効化、または無効化を完了するために、バックエンドシステムの再起動を必要としています。',
    'alert.restartRequired':
      '{{count}} 個のプラグインがインストールされています',
    'alert.backendRestartRequired': 'バックエンドの再起動が必要です',
    'alert.viewPlugins': 'プラグインの表示',
    'alert.viewPackages': 'パッケージの表示',
    'search.placeholder': '検索',
    'search.clear': '検索のクリア',
    'search.filter': 'フィルター',
    'search.clearFilter': 'フィルターのクリア',
    'search.category': 'カテゴリー',
    'search.author': '作成者',
    'search.supportType': 'サポートタイプ',
    'search.noResults': '検索条件に一致するプラグインがありません',
    'search.filterBy': 'フィルター',
    'search.clearFilters': 'フィルターをクリア',
    'search.noResultsFound':
      '結果が見つかりません。フィルターを調整してもう一度お試しください。',
    'common.links': 'リンク',
    'common.by': ' by ',
    'common.comma': ',',
    'common.noDescriptionAvailable': '説明がありません',
    'common.readMore': 'さらに表示する',
    'common.close': '閉じる',
    'common.apply': '適用',
    'common.couldNotApplyYaml': 'YAML を適用できませんでした: {{error}}',
    'dialog.backendRestartRequired': 'バックエンドの再起動が必要です',
    'dialog.packageRestartMessage':
      'パッケージの変更を完了するために、バックエンドシステムを再起動してください。',
    'dialog.pluginRestartMessage':
      'プラグインの変更を完了するために、バックエンドシステムを再起動してください。',
    'plugin.description': '説明',
    'plugin.documentation': 'ドキュメント',
    'plugin.repository': 'リポジトリー',
    'plugin.license': 'ライセンス',
    'plugin.version': 'バージョン',
    'plugin.author': '作成者',
    'plugin.authors': '作成者',
    'plugin.tags': 'タグ',
    'plugin.dependencies': '依存関係',
    'plugin.configuration': '設定',
    'plugin.installation': 'インストール',
    'package.name': 'パッケージ名:',
    'package.version': 'バージョン:',
    'package.dynamicPluginPath': '動的プラグインのパス:',
    'package.backstageRole': 'Backstage の役割:',
    'package.supportedVersions': 'サポートされているバージョン:',
    'package.author': '作成者:',
    'package.support': 'サポート:',
    'package.lifecycle': 'ライフサイクル:',
    'package.highlights': 'ハイライト',
    'package.about': '概要',
    'package.notFound': 'パッケージ {{namespace}}/{{name}} が見つかりません!',
    'package.notAvailable': 'パッケージ {{name}} は利用できません',
    'package.ensureCatalogEntity':
      'このパッケージのカタログエンティティーが存在することを確認してください。',
    'table.packageName': 'パッケージ名',
    'table.version': 'バージョン',
    'table.role': '役割',
    'table.supportedVersion': 'サポートされているバージョン',
    'table.status': 'ステータス',
    'table.name': '名前',
    'table.action': 'アクション',
    'table.description': '説明',
    'table.versions': 'バージョン',
    'table.plugins': 'プラグイン',
    'table.packages': 'パッケージ',
    'table.pluginsCount': 'プラグイン ({{count}})',
    'table.packagesCount': 'パッケージ ({{count}})',
    'table.pluginsTable': 'プラグインテーブル',
    'installedPackages.table.title': 'インストール済みパッケージ ({{count}})',
    'installedPackages.table.searchPlaceholder': '検索',
    'installedPackages.table.columns.name': '名前',
    'installedPackages.table.columns.packageName': 'npm パッケージ名',
    'installedPackages.table.columns.role': '役割',
    'installedPackages.table.columns.version': 'バージョン',
    'installedPackages.table.columns.actions': 'アクション',
    'installedPackages.table.tooltips.packageProductionDisabled':
      'パッケージは実稼働環境では管理できません。',
    'installedPackages.table.tooltips.installationDisabled':
      'プラグインのインストールが無効になっているため、パッケージを管理できません。これを有効にするには、dynamic-plugins 設定ファイルで拡張機能設定を追加または変更してください。',
    'installedPackages.table.tooltips.enableActions':
      'アクションを有効にするには、このパッケージのカタログエンティティーを追加してください',
    'installedPackages.table.tooltips.noDownloadPermissions':
      '設定をダウンロードする権限がありません。管理者に連絡し、アクセス権を要求またはサポートを依頼してください。',
    'installedPackages.table.tooltips.noEditPermissions':
      '設定を編集する権限がありません。管理者に連絡し、アクセス権を要求またはサポートを依頼してください。',
    'installedPackages.table.tooltips.noTogglePermissions':
      'パッケージを有効化または無効化する権限がありません。管理者に連絡し、アクセス権を要求またはサポートを依頼してください。',
    'installedPackages.table.tooltips.editPackage': 'パッケージ設定を編集する',
    'installedPackages.table.tooltips.downloadPackage':
      'パッケージ設定をダウンロードする',
    'installedPackages.table.tooltips.enablePackage': 'パッケージを有効にする',
    'installedPackages.table.tooltips.disablePackage': 'パッケージを無効にする',
    'installedPackages.table.emptyMessages.noResults':
      '結果が見つかりません。別の検索語句を試してください。',
    'installedPackages.table.emptyMessages.noRecords':
      '表示するレコードがありません',
    'actions.install': 'インストール',
    'actions.view': '表示',
    'actions.edit': '編集',
    'actions.enable': '有効にする',
    'actions.disable': '無効にする',
    'actions.actions': 'アクション',
    'actions.editConfiguration': '編集',
    'actions.pluginConfigurations': 'プラグインの設定',
    'actions.packageConfiguration': 'パッケージの設定',
    'actions.pluginCurrentlyEnabled': 'プラグインは現在有効です',
    'actions.pluginCurrentlyDisabled': 'プラグインは現在無効です',
    'actions.packageCurrentlyEnabled': 'パッケージは現在有効です',
    'actions.packageCurrentlyDisabled': 'パッケージは現在無効です',
    'actions.installTitle': '{{displayName}} のインストール',
    'actions.editTitle': '{{displayName}} 設定の編集',
    'metadata.by': ' by ',
    'metadata.comma': ',',
    'metadata.pluginNotFound': 'プラグイン {{name}} が見つかりません!',
    'metadata.pluginNotAvailable': 'プラグイン {{name}} は利用できません',
    'metadata.ensureCatalogEntityPlugin':
      'このプラグインのカタログエンティティーが存在することを確認してください。',
    'metadata.highlights': 'ハイライト',
    'metadata.about': '概要',
    'metadata.publisher': 'パブリッシャー',
    'metadata.supportProvider': 'サポートプロバイダー',
    'metadata.entryName': 'エントリー名',
    'metadata.bySomeone': '提供元不明',
    'metadata.category': 'カテゴリー',
    'metadata.versions': 'バージョン',
    'metadata.backstageCompatibility': 'Backstage 互換バージョン',
    'supportTypes.certifiedBy': '{{value}} により認定済み ({{count}})',
    'supportTypes.verifiedBy': '{{value}} により検証済み ({{count}})',
    'supportTypes.customPlugins': 'カスタムプラグイン ({{count}})',
    'collection.kubernetes': 'Kubernetes',
    'collection.monitoring': 'モニタリング',
    'collection.security': 'セキュリティー',
    'collection.viewMore': '詳細の表示',
    'collection.pluginCount': '{{count}} 個のプラグイン',
    'collection.featured.title': '注目のプラグイン',
    'collection.featured.description':
      'ほとんどのユーザーに推奨される注目の厳選プラグイン集',
    'install.title': 'プラグインのインストール',
    'install.configurationRequired': '必要な設定',
    'install.optional': '任意',
    'install.required': '必須',
    'install.selectPackages': 'インストールするパッケージの選択',
    'install.allPackages': 'すべてのパッケージ',
    'install.customConfiguration': 'カスタム設定',
    'install.installProgress': 'インストール...',
    'install.success': 'プラグインが正常にインストールされました',
    'install.error': 'プラグインのインストールに失敗しました',
    'install.installFrontend': 'フロントエンドプラグインのインストール',
    'install.installBackend': 'バックエンドプラグインのインストール',
    'install.installTemplates': 'ソフトウェアテンプレートのインストール',
    'install.installationInstructions': 'インストール手順',
    'install.download': 'ダウンロード',
    'install.examples': '例',
    'install.cancel': 'キャンセル',
    'install.reset': 'リセット',
    'install.pluginTabs': 'プラグインタブ',
    'install.settingUpPlugin': 'プラグインのセットアップ',
    'install.aboutPlugin': 'プラグインについて',
    'install.pluginUpdated': 'プラグインが更新されました',
    'install.pluginInstalled': 'プラグインがインストールされました',
    'install.instructions': '手順',
    'install.editInstructions': '編集手順',
    'install.back': '戻る',
    'install.packageUpdated': 'パッケージが更新されました',
    'install.packageEnabled': 'パッケージは有効です',
    'install.packageDisabled': 'パッケージは無効です',
    'install.pluginEnabled': 'プラグインは有効です',
    'install.pluginDisabled': 'プラグインは無効です',
    'install.errors.missingPluginsList':
      "無効なエディターコンテンツ: 'plugins' リストがありません",
    'install.errors.missingPackageItem':
      '無効なエディターコンテンツ: パッケージ項目がありません',
    'install.errors.missingPackageField':
      "無効なエディターコンテンツ: 項目に 'package' フィールドがありません",
    'install.errors.failedToSave': '保存に失敗しました',
    loading: '読み込み中...',
    error: 'エラーが発生しました',
    retry: '再試行',
    'errors.missingConfigFile': '設定ファイルが見つかりません',
    'errors.missingConfigMessage':
      '{{メッセージ}}。このツールを有効にする場合は、app-config.yaml に設定を追加する必要があります。以下の例のように app-config.yaml ファイルを編集してください:',
    'errors.invalidConfigFile': '無効な設定ファイル',
    'errors.invalidConfigMessage':
      "'extensions.installation.saveToSingleFile.file' の読み込みに失敗しました。{{message}}。このツールを有効にする場合は、有効なインストール設定を提供してください。以下の例のように dynamic-plugins.yaml ファイルを編集してください:",
    'errors.fileNotExists':
      '設定ファイルが正しくないか、スペルミスがあるか、存在しません',
    'errors.fileNotExistsMessage':
      '{{メッセージ}}。このツールを有効にする場合は、以下の例に示すように、app-config.yaml で指定されているファイル名を再確認してください:',
    'errors.unknownError': '設定ファイルの読み取り中にエラーが発生しました。',
    'tooltips.productionDisabled':
      '実稼働環境ではプラグインのインストールが無効になっています。',
    'tooltips.extensionsDisabled':
      'プラグインのインストールが無効になっています。これを有効にするには、dynamic-plugins 設定ファイルで拡張機能設定を追加または変更してください。',
    'tooltips.noPermissions':
      'プラグインをインストールする権限またはその設定を表示する権限がありません。管理者に連絡し、アクセス権を要求またはサポートを依頼してください。',
    'tooltips.missingDynamicArtifact':
      'この {{type}} を管理できません。アクションを有効にするには、必要な spec.dynamicArtifact を持つカタログエンティティーを追加する必要があります。',
    'aria.openPlugin': 'プラグイン {{name}} を開く',
    'aria.closeDialog': 'ダイアログを閉じる',
    'aria.expandSection': 'セクションを展開',
    'aria.collapseSection': 'セクションを折りたたむ',
    'aria.sortBy': '{{field}} でソート',
    'aria.filterBy': '{{field}} でフィルタリング',
    'badges.certified': '認定済み',
    'badges.certifiedBy': '{{provider}} により認定済み',
    'badges.verified': '検証済み',
    'badges.verifiedBy': '{{provider}} により検証済み',
    'badges.customPlugin': 'カスタムプラグイン',
    'badges.stableAndSecured': '安定および {{provider}} により保護',
    'badges.generallyAvailable': '一般提供 (GA)',
    'badges.gaAndSupportedBy':
      '一般提供 (GA) および {{provider}} のサポート対象',
    'badges.gaAndSupported': '一般提供 (GA) およびサポート対象',
    'badges.productionReadyBy':
      '実稼働環境に対応および {{provider}} のサポート対象',
    'badges.productionReady': '実稼働環境に対応およびサポート対象',
    'badges.communityPlugin': 'コミュニティープラグイン',
    'badges.openSourceNoSupport': 'オープンソースプラグイン、公式サポートなし',
    'badges.techPreview': 'テクノロジープレビュー (TP)',
    'badges.pluginInDevelopment': 'まだ開発中のプラグイン',
    'badges.devPreview': '開発者プレビュー (DP)',
    'badges.earlyStageExperimental': '初期段階の実験的なプラグイン',
    'badges.addedByAdmin': '管理者によって追加されたプラグイン',
  },
});

export default extensionsTranslationJa;
