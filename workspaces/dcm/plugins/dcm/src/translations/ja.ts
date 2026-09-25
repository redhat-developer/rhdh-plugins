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

import {
  createTranslationMessages,
  type TranslationMessages,
} from '@backstage/core-plugin-api/alpha';
import { dcmTranslationRef } from './ref';

const dcmTranslationJa: TranslationMessages<
  'plugin.dcm',
  Record<string, string>
> = createTranslationMessages({
  ref: dcmTranslationRef,
  messages: {
    'page.title': 'データセンター',
    'page.tabs.agents': 'エージェント',
    'page.tabs.policies': 'ポリシー',
    'page.tabs.serviceTypes': 'サービスタイプ',
    'page.tabs.catalogItems': 'カタログ項目',
    'page.tabs.instances': 'インスタンス',
    'page.tabs.resources': 'リソース',
    'common.retry': '再試行',
    'common.refresh': '更新',
    'common.search': '検索',
    'common.clearSearch': '検索のクリア',
    'common.edit': '編集',
    'common.delete': '削除',
    'common.actions': 'アクション',
    'common.cancel': 'キャンセル',
    'common.save': '保存',
    'common.saving': '保存中…',
    'common.close': '閉じる',
    'common.rows': '行',
    'common.previousPage': '前へ',
    'common.nextPage': '次へ',
    'common.next': '次へ',
    'common.back': '戻る',
    'common.loadingMore': 'さらに読み込み中…',
    'deleteDialog.title': '{{resourceLabel}} を削除する',
    'deleteDialog.confirmButton': '削除',
    'deleteDialog.cancelButton': 'キャンセル',
    'deleteDialog.body':
      '{{resourceName}} を削除してもよろしいですか?この操作は元に戻せません。',
    'agents.emptyTitle': '登録されたエージェントはありません',
    'agents.emptyDescription':
      '環境エージェントはコントロールプレーンに登録され、定期的なハートビートを送信します。DCM が外部環境上のワークロードを管理できるようにするには、エージェントを登録します。',
    'agents.registerButton': '登録する',
    'agents.entityLabel': 'エージェント',
    'agents.registerDialogTitle': 'エージェントを登録する',
    'agents.createSuccess': 'エージェントが正常に登録されました。',
    'agents.columns.name': '名前',
    'agents.columns.environment': '環境',
    'agents.columns.serviceTypes': 'サービスタイプ',
    'agents.columns.cost': 'コスト',
    'agents.columns.topic': 'トピック',
    'agents.columns.health': '健全性',
    'agents.columns.lastHeartbeat': '最後のハートビート',
    'agents.filter.healthLabel': '健全性ステータス',
    'agents.filter.healthAll': 'すべて',
    'agents.filter.healthReady': '準備完了',
    'agents.filter.healthCongested': '混雑中',
    'agents.filter.healthUnavailable': '利用不可',
    'agents.form.nameLabel': '名前 *',
    'agents.form.namePlaceholder': '例: env-agent-west-1',
    'agents.form.nameHelper':
      '固有のスラッグ識別子 ― 小文字、数字、ハイフンのみ',
    'agents.form.environmentLabel': '環境 *',
    'agents.form.environmentPlaceholder': '例: production',
    'agents.form.environmentHelper': 'エージェントの環境ラベル',
    'agents.form.serviceTypesLabel': 'サービスタイプ *',
    'agents.form.serviceTypesHelper':
      'このエージェントが提供できるサービスタイプ',
    'agents.form.costLabel': 'コスト *',
    'agents.form.costHelper': '配置決定に使用される相対コスト重み',
    'agents.form.topicNameLabel': 'トピック名 *',
    'agents.form.topicNamePlaceholder': '例: dcm.agent.env-agent-west-1',
    'agents.form.topicNameHelper':
      'NATS トピック名 — dcm.agent で始まる必要があります。',
    'policies.emptyTitle': '定義されているポリシーはありません',
    'policies.emptyDescription':
      'DCM リソースにガバナンスルールを適用するための OPA Rego ポリシーを作成します。ポリシーのスコープは、グローバルにまたはユーザーごとに指定できます。',
    'policies.createButton': '作成',
    'policies.entityLabel': 'ポリシー',
    'policies.createDialogTitle': 'ポリシーを作成する',
    'policies.editDialogTitle': 'ポリシーを編集する',
    'policies.saveButton': '保存',
    'policies.createSuccess': 'ポリシーが正常に作成されました。',
    'policies.updateSuccess': 'ポリシーが正常に更新されました。',
    'policies.deleteSuccess': 'ポリシーが正常に削除されました。',
    'policies.deleteLabel': 'ポリシー',
    'policies.enabledYes': 'Yes',
    'policies.enabledNo': 'No',
    'policies.toggleDisable': 'ポリシーを無効にする',
    'policies.toggleEnable': 'ポリシーを有効にする',
    'policies.toggleDisableAria': '無効化',
    'policies.toggleEnableAria': '有効化',
    'policies.columns.displayName': '表示名',
    'policies.columns.type': 'タイプ',
    'policies.columns.priority': '優先度',
    'policies.columns.enabled': '有効化済み',
    'policies.columns.description': '説明',
    'policies.form.displayNameLabel': '表示名 *',
    'policies.form.displayNameHelper': 'このポリシーの人間可読名',
    'policies.form.descriptionLabel': '説明',
    'policies.form.descriptionHelper': '任意 — このポリシーの目的を説明します',
    'policies.form.policyTypeLabel': 'ポリシータイプ *',
    'policies.form.policyTypeGlobal':
      'GLOBAL — すべてのリクエストに適用されます',
    'policies.form.policyTypeUser': 'USER — ユーザーごとに適用されます',
    'policies.form.priorityLabel': '優先度 *',
    'policies.form.priorityHelper':
      '1 (最優先) – 1000 (最低)、デフォルトは 500 — ポリシータイプごとに一意である必要があります',
    'policies.form.regoCodeLabel': 'Rego コード *',
    'policies.form.regoCodeHelper':
      'Placement Manager によって評価される OPA Rego ポリシー。',
    'policies.form.regoCodePlaceholder': 'package dcm.placement',
    'policies.form.enabledLabel': '有効化済み',
    'serviceTypes.emptyTitle': '定義されているサービスタイプはありません',
    'serviceTypes.emptyDescription':
      'サービスタイプは、カタログ項目のテンプレートスキーマを定義します。',
    'serviceTypes.cardTitle': 'サービスタイプ ({{count}})',
    'serviceTypes.columns.serviceType': 'サービスタイプ',
    'serviceTypes.columns.apiVersion': 'API バージョン',
    'serviceTypes.columns.path': 'パス',
    'serviceTypes.columns.created': '作成済み',
    'catalogItems.emptyTitle': '定義されているカタログ項目はありません',
    'catalogItems.emptyDescription':
      'カタログ項目とは、開発者がプロビジョニングできるサービステンプレートのことです。各カタログ項目は、1 つ以上のサービスタイプを参照し、カスタマイズ可能なフィールドを定義します。',
    'catalogItems.createButton': '作成',
    'catalogItems.entityLabel': 'カタログ項目',
    'catalogItems.createDrawerTitle': 'カタログ項目を作成する',
    'catalogItems.editDrawerTitle': 'カタログ項目を編集する',
    'catalogItems.saveButton': '保存',
    'catalogItems.createSuccess': 'カタログ項目が正常に作成されました。',
    'catalogItems.updateSuccess': 'カタログ項目が正常に更新されました。',
    'catalogItems.deleteSuccess': 'カタログ項目が正常に削除されました。',
    'catalogItems.deleteLabel': 'カタログ項目',
    'catalogItems.columns.displayName': '表示名',
    'catalogItems.columns.apiVersion': 'API バージョン',
    'catalogItems.columns.resources': 'リソース',
    'catalogItems.columns.fields': 'フィールド',
    'catalogItems.columns.created': '作成済み',
    'catalogItems.fieldCount_one': '1 つのフィールド',
    'catalogItems.fieldCount_other': '{{count}} 個のフィールド',
    'catalogItems.resourceCount_one': '1 つのリソース',
    'catalogItems.resourceCount_other': '{{count}} 個のリソース',
    'catalogItems.form.importButton': 'ファイルからインポートする',
    'catalogItems.form.importTooltip':
      'JSON または YAML カタログ項目の定義からフォームに入力します',
    'catalogItems.form.importError':
      'ファイルのインポートに失敗しました — 有効な JSON または YAML 形式であることを確認してください。',
    'catalogItems.form.displayNameLabel': '表示名 *',
    'catalogItems.form.displayNameHelper':
      'このカタログ項目の人間可読名 (最大 63 文字)',
    'catalogItems.form.apiVersionLabel': 'API バージョン *',
    'catalogItems.form.apiVersionHelper':
      'パターン v<number>[alpha|beta][number] に従う必要があります — 例: v1、v1alpha1',
    'catalogItems.form.serviceTypeLabel': 'サービスタイプ *',
    'catalogItems.form.serviceTypeHelperEdit':
      'サービスタイプは作成後に変更できません',
    'catalogItems.form.serviceTypeHelperNoTypes':
      '利用可能なサービスタイプがありません — サービスタイプタブで作成してください',
    'catalogItems.form.serviceTypeHelperDefault':
      'このリソースの基となるサービスタイプを選択します',
    'catalogItems.form.fieldsLabel': 'フィールド *',
    'catalogItems.form.fieldsCaption': '(少なくとも 1 つ必須)',
    'catalogItems.form.fieldsErrorEmpty':
      'パスが空でないフィールドを少なくとも 1 つ追加します。',
    'catalogItems.form.fieldAddButton': 'フィールドを追加する',
    'catalogItems.form.fieldAddTooltip':
      '新しいフィールドを追加する前に、直前のフィールドのパスを入力します',
    'catalogItems.form.fieldPathLabel': 'パス *',
    'catalogItems.form.fieldPathHelper': '例: config.replicas',
    'catalogItems.form.fieldDisplayNameLabel': '表示名',
    'catalogItems.form.fieldEditableLabel': '編集可能',
    'catalogItems.form.fieldDefaultValueLabel': 'デフォルト値',
    'catalogItems.form.fieldDefaultValueHelper':
      '任意の JSON 値 — 例: 42、"hello"、true、[1,2]',
    'catalogItems.form.fieldRemoveAriaLabel': 'フィールドを削除する',
    'catalogItems.form.schemaLabel': '検証スキーマ',
    'catalogItems.form.schemaEditButton': 'JSON の編集',
    'catalogItems.form.schemaAddButton': 'JSON を追加する',
    'catalogItems.form.schemaDialogTitle': '検証スキーマ',
    'catalogItems.form.schemaDialogHelper':
      'JSON スキーマオブジェクト — 例: {"type":"integer","minimum":0}',
    'catalogItems.form.schemaDialogCancel': 'キャンセル',
    'catalogItems.form.schemaDialogApply': '適用',
    'catalogItems.form.schemaMustBeObject':
      '配列やプリミティブ型ではなく、JSON オブジェクトである必要があります',
    'catalogItems.form.schemaInvalidJson': '無効な JSON 構文',
    'catalogItems.wizard.tabOverview': '概要',
    'catalogItems.wizard.tabApi': 'API',
    'catalogItems.wizard.tabResources': 'リソース',
    'catalogItems.wizard.resourcesDescription':
      '1 つ以上のリソースを追加します。各リソースはサービスタイプを参照し、独自のフィールド設定を定義します。',
    'catalogItems.wizard.resourcesRequired':
      '少なくとも 1 つのリソースが必要です。',
    'catalogItems.wizard.addResourceButton': 'リソースを追加する',
    'catalogItems.wizard.removeResource': 'リソースを削除する',
    'catalogItems.wizard.unnamedResource': '(名前なし)',
    'catalogItems.wizard.resourceNameLabel': 'リソース名 *',
    'catalogItems.wizard.resourceNameHelper':
      'このカタログ項目内の一意の識別子 — 例: app、ordersDb',
    'catalogItems.wizard.requiresResourcesLabel': 'リソースが必要',
    'catalogItems.wizard.requiresResourcesHelper':
      'このリソースの前にプロビジョニングする必要のある他のリソースを選択します',
    'catalogItems.wizard.apiVersionImmutable':
      'API バージョンは作成後に変更できません',
    'instances.emptyTitle': 'プロビジョニングされたインスタンスはありません',
    'instances.emptyDescription':
      'カタログ項目インスタンスは、プロビジョニングされたサービスを表します。カタログ項目からインスタンスを作成し、登録済みの環境エージェント上でサービスをプロビジョニングします。',
    'instances.createButton': '作成',
    'instances.entityLabel': 'カタログ項目インスタンス',
    'instances.createDialogTitle': 'カタログ項目インスタンスを作成する',
    'instances.rehydrateSuccess':
      'カタログ項目インスタンスが正常にリハイドレートされました。',
    'instances.deleteLabel': 'インスタンス',
    'instances.rehydrateTooltip': 'リハイドレーション',
    'instances.rehydrateAriaLabel': 'インスタンスをリハイドレートする',
    'instances.deleteTooltip': '削除',
    'instances.deleteAriaLabel': 'インスタンスを削除する',
    'instances.rehydrateDialogTitle': 'インスタンスをリハイドレートしますか?',
    'instances.rehydrateDialogBody':
      '{{instanceName}} をリハイドレートすると、リソースが再プロビジョニングされ、新しいリソース ID が割り当てられる場合があります。この操作は元に戻せません。',
    'instances.rehydrateDialogFallbackName': 'このインスタンス',
    'instances.rehydrateDialogCancel': 'キャンセル',
    'instances.rehydrateDialogConfirm': 'リハイドレーション',
    'instances.columns.displayName': '表示名',
    'instances.columns.catalogItem': 'カタログ項目',
    'instances.columns.resourceIds': 'リソース ID',
    'instances.columns.apiVersion': 'API バージョン',
    'instances.columns.created': '作成済み',
    'instances.form.displayNameLabel': '表示名 *',
    'instances.form.displayNameHelper':
      'このプロビジョニングされたインスタンスの人間可読名 (最大 63 文字)',
    'instances.form.catalogItemLabel': 'カタログ項目 *',
    'instances.form.catalogItemSelect': 'カタログ項目を選択します…',
    'instances.form.catalogItemHelperNoItems':
      '利用可能なカタログ項目はありません — カタログ項目タブから作成してください',
    'instances.form.catalogItemHelperDefault':
      'インスタンスをプロビジョニングするカタログ項目を選択します',
    'instances.form.apiVersionLabel': 'API バージョン *',
    'instances.form.apiVersionHelper':
      'パターン v<number>[alpha|beta][number] に従う必要があります — 例: v1、v1alpha1',
    'instances.form.fieldValuesSection': 'フィールド値',
    'instances.form.fieldValuesSectionHint':
      '(このカタログ項目で定義された編集可能なフィールド)',
    'instances.form.noEditableFields':
      'このリソースには編集可能なフィールドがありません。',
    'instances.wizard.tabOverview': '概要',
    'resources.emptyTitle': 'リソースが見つかりません',
    'resources.emptyDescription':
      'DCM を通じてプロビジョニングされたサービスタイプのインスタンスはここに表示されます。',
    'resources.cardTitle': 'リソース ({{count}})',
    'resources.columns.id': 'ID',
    'resources.columns.serviceType': 'サービスタイプ',
    'resources.columns.provider': 'プロバイダー',
    'resources.columns.status': 'ステータス',
    'resources.columns.created': '作成済み',
    'copyButton.copy': 'コピー',
    'copyButton.copied': 'コピーしました!',
    'copyButton.failed': 'コピーに失敗しました',
    'copyButton.ariaLabel': 'クリップボードにコピーする',
    'validation.agent.nameRequired': '名前は必須です',
    'validation.agent.namePattern':
      '使用できるのは小文字の英字、数字、ハイフンのみです (先頭は英字である必要があります)',
    'validation.agent.environmentRequired': '環境は必須です',
    'validation.agent.serviceTypesRequired':
      '少なくとも 1 つのサービスタイプが必要です',
    'validation.agent.costRequired': 'コストは必須です',
    'validation.agent.topicNameRequired': 'トピック名は必須です',
    'validation.agent.topicNamePattern':
      'トピック名は dcm.agent で始まる必要があります。',
    'validation.policy.displayNameRequired': '表示名は必須です',
    'validation.policy.displayNameEmpty': '表示名は空にできません',
    'validation.policy.displayNameMax': '表示名は最大 255 文字までです',
    'validation.policy.descriptionMax': '説明文は最大 255 文字までです',
    'validation.policy.policyTypeRequired': 'ポリシータイプは必須です',
    'validation.policy.policyTypeOneOf':
      'GLOBAL または USER である必要があります',
    'validation.policy.priorityType': '優先度は数値である必要があります',
    'validation.policy.priorityRequired': '優先度は必須です',
    'validation.policy.priorityInteger': '優先度は整数である必要があります',
    'validation.policy.priorityMin':
      '優先度は少なくとも 1 である必要があります',
    'validation.policy.priorityMax':
      '優先度は最大 1000 までである必要があります',
    'validation.policy.regoCodeRequired': 'Rego コードは必須です',
    'validation.policy.regoCodeEmpty': 'Rego コードは空にできません',
    'validation.policy.regoCodePackage':
      'パッケージ宣言を含める必要があります — 例: "package dcm.placement"',
    'validation.catalogItem.displayNameRequired': '表示名は必須です',
    'validation.catalogItem.displayNameEmpty': '表示名は空にできません',
    'validation.catalogItem.displayNameMax': '表示名は最大 63 文字までです',
    'validation.catalogItem.apiVersionRequired': 'API バージョンは必須です',
    'validation.catalogItem.apiVersionPattern':
      'パターン v<number>[alpha|beta][number] に従う必要があります — 例: v1、v1alpha1',
    'validation.catalogItem.serviceTypeRequired': 'サービスタイプは必須です',
    'validation.catalogItem.resourceNameRequired': 'リソース名は必須です',
    'validation.catalogItem.resourceNameDuplicate':
      'リソース名はカタログ項目内で一意である必要があります',
    'validation.catalogItem.resourceNamePattern':
      '使用できるのは英字、数字、ハイフン、アンダースコアのみです (先頭は英字である必要があります)',
    'validation.catalogItem.requiresResourcesCycle':
      '循環依存関係が検出されました — このリソースは間接的に自身を要求しています',
    'validation.catalogItem.resourcesRequired':
      '少なくとも 1 つのリソースが必要です',
    'validation.catalogItem.duplicatePath':
      '重複するパス — パスは一意である必要があります',
    'validation.catalogItem.invalidJson':
      '無効な JSON — 構文を修正するか、プレーンな文字列値を使用します',
    'validation.catalogItem.schemaMustBeObject':
      'JSON オブジェクトである必要があります — 例: {"type":"integer"}',
    'validation.catalogItem.schemaMinMaxConflict':
      '最小値 ({{min}}) は最大値 ({{max}}) を超えることはできません',
    'validation.catalogItem.defaultBelowMin':
      'デフォルト値 ({{value}}) はスキーマの最小値 ({{min}}) を下回っています',
    'validation.catalogItem.defaultAboveMax':
      'デフォルト値 ({{value}}) がスキーマの最大値 ({{max}}) を超えています',
    'validation.catalogItem.schemaInvalidJson': '無効な JSON 構文',
    'validation.instance.displayNameRequired': '表示名は必須です',
    'validation.instance.displayNameEmpty': '表示名は空にできません',
    'validation.instance.displayNameMax': '表示名は最大 63 文字までです',
    'validation.instance.catalogItemRequired': 'カタログ項目は必須です',
    'validation.instance.apiVersionRequired': 'API バージョンは必須です',
    'validation.instance.apiVersionPattern':
      'パターン v<number>[alpha|beta][number] に従う必要があります — 例: v1、v1alpha1',
    'validation.instance.fieldRequired': 'このフィールドは必須です',
    'validation.instance.fieldMustBeNumber': '有効な数字である必要があります',
    'validation.instance.fieldMin': '最低でも {{min}} である必要があります',
    'validation.instance.fieldMax': '最大でも {{max}} である必要があります',
  },
});

export default dcmTranslationJa;
