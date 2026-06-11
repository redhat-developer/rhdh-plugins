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

const protocol = 'http';

const dcmTranslationJa: TranslationMessages<
  'plugin.dcm',
  Record<string, string>
> = createTranslationMessages({
  ref: dcmTranslationRef,
  messages: {
    'page.title': '\u30c7\u30fc\u30bf\u30bb\u30f3\u30bf\u30fc',
    'page.tabs.providers': '\u30d7\u30ed\u30d0\u30a4\u30c0\u30fc',
    'page.tabs.policies': '\u30dd\u30ea\u30b7\u30fc',
    'page.tabs.serviceTypes': '\u30b5\u30fc\u30d3\u30b9\u30bf\u30a4\u30d7',
    'page.tabs.catalogItems':
      '\u30ab\u30bf\u30ed\u30b0\u30a2\u30a4\u30c6\u30e0',
    'page.tabs.instances': '\u30a4\u30f3\u30b9\u30bf\u30f3\u30b9',
    'page.tabs.resources': '\u30ea\u30bd\u30fc\u30b9',
    'common.retry': '\u518d\u8a66\u884c',
    'common.refresh': '\u66f4\u65b0',
    'common.search': '\u691c\u7d22',
    'common.clearSearch': '\u691c\u7d22\u3092\u30af\u30ea\u30a2',
    'common.edit': '\u7de8\u96c6',
    'common.delete': '\u524a\u9664',
    'common.actions': '\u30a2\u30af\u30b7\u30e7\u30f3',
    'common.cancel': '\u30ad\u30e3\u30f3\u30bb\u30eb',
    'common.save': '\u4fdd\u5b58',
    'common.saving': '\u4fdd\u5b58\u4e2d\u2026',
    'common.close': '\u9589\u3058\u308b',
    'common.rows': '\u884c',
    'deleteDialog.title': '{{resourceLabel}}\u3092\u524a\u9664',
    'deleteDialog.confirmButton': '\u524a\u9664',
    'deleteDialog.cancelButton': '\u30ad\u30e3\u30f3\u30bb\u30eb',
    'deleteDialog.bodyBefore': '',
    'deleteDialog.bodyAfter':
      '\u3092\u524a\u9664\u3057\u307e\u3059\u304b\uff1f\u3053\u306e\u64cd\u4f5c\u306f\u5143\u306b\u623b\u305b\u307e\u305b\u3093\u3002',
    'providers.emptyTitle':
      '\u767b\u9332\u6e08\u307f\u30d7\u30ed\u30d0\u30a4\u30c0\u30fc\u306a\u3057',
    'providers.emptyDescription':
      'DCM\u304c\u5916\u90e8\u30a4\u30f3\u30d5\u30e9\u30b9\u30c8\u30e9\u30af\u30c1\u30e3\u3067\u30ea\u30bd\u30fc\u30b9\u3092\u30d7\u30ed\u30d3\u30b8\u30e7\u30cb\u30f3\u30b0\u3067\u304d\u308b\u3088\u3046\u306b\u30b5\u30fc\u30d3\u30b9\u30d7\u30ed\u30d0\u30a4\u30c0\u30fc\u3092\u767b\u9332\u3057\u3066\u304f\u3060\u3055\u3044\u3002',
    'providers.registerButton': '\u767b\u9332',
    'providers.entityLabel': '\u30d7\u30ed\u30d0\u30a4\u30c0\u30fc',
    'providers.registerDialogTitle':
      '\u30d7\u30ed\u30d0\u30a4\u30c0\u30fc\u3092\u767b\u9332',
    'providers.editDialogTitle':
      '\u30d7\u30ed\u30d0\u30a4\u30c0\u30fc\u3092\u7de8\u96c6',
    'providers.saveButton': '\u4fdd\u5b58',
    'providers.createSuccess':
      '\u30d7\u30ed\u30d0\u30a4\u30c0\u30fc\u3092\u6b63\u5e38\u306b\u767b\u9332\u3057\u307e\u3057\u305f\u3002',
    'providers.updateSuccess':
      '\u30d7\u30ed\u30d0\u30a4\u30c0\u30fc\u3092\u6b63\u5e38\u306b\u66f4\u65b0\u3057\u307e\u3057\u305f\u3002',
    'providers.deleteSuccess':
      '\u30d7\u30ed\u30d0\u30a4\u30c0\u30fc\u3092\u6b63\u5e38\u306b\u524a\u9664\u3057\u307e\u3057\u305f\u3002',
    'providers.deleteLabel': '\u30d7\u30ed\u30d0\u30a4\u30c0\u30fc',
    'providers.columns.displayName': '\u8868\u793a\u540d',
    'providers.columns.name': '\u540d\u524d',
    'providers.columns.endpoint': '\u30a8\u30f3\u30c9\u30dd\u30a4\u30f3\u30c8',
    'providers.columns.serviceType':
      '\u30b5\u30fc\u30d3\u30b9\u30bf\u30a4\u30d7',
    'providers.columns.operations':
      '\u30aa\u30da\u30ec\u30fc\u30b7\u30e7\u30f3',
    'providers.columns.status': '\u30b9\u30c6\u30fc\u30bf\u30b9',
    'providers.form.nameLabel': '\u540d\u524d *',
    'providers.form.namePlaceholder': '\u4f8b: my-k8s-provider',
    'providers.form.nameHelper':
      '\u4e00\u610f\u306e\u30b9\u30e9\u30b0\u2014\u5c0f\u6587\u5b57\u3001\u6570\u5b57\u3001\u30cf\u30a4\u30d5\u30f3\u306e\u307f\u4f7f\u7528\u53ef\u80fd',
    'providers.form.nameHelperEditMode':
      '\u30d7\u30ed\u30d0\u30a4\u30c0\u30fc\u540d\u306f\u4f5c\u6210\u5f8c\u306b\u5909\u66f4\u3067\u304d\u307e\u305b\u3093',
    'providers.form.endpointLabel':
      '\u30a8\u30f3\u30c9\u30dd\u30a4\u30f3\u30c8 *',
    'providers.form.endpointPlaceholder': 'https://api.example.com',
    'providers.form.endpointHelper':
      '\u30d7\u30ed\u30d0\u30a4\u30c0\u30fc API \u306e\u5b8c\u5168\u306a URL',
    'providers.form.serviceTypeLabel':
      '\u30b5\u30fc\u30d3\u30b9\u30bf\u30a4\u30d7 *',
    'providers.form.serviceTypeEmpty':
      '\u5229\u7528\u53ef\u80fd\u306a\u30b5\u30fc\u30d3\u30b9\u30bf\u30a4\u30d7\u306a\u3057',
    'providers.form.serviceTypeSelect':
      '\u30b5\u30fc\u30d3\u30b9\u30bf\u30a4\u30d7\u3092\u9078\u629e\u2026',
    'providers.form.serviceTypeHelperNoTypes':
      '\u307e\u305a\u30b5\u30fc\u30d3\u30b9\u30bf\u30a4\u30d7\u30bf\u30d6\u3067\u30b5\u30fc\u30d3\u30b9\u30bf\u30a4\u30d7\u3092\u4f5c\u6210\u3057\u3066\u304f\u3060\u3055\u3044',
    'providers.form.serviceTypeHelperDefault':
      '\u767b\u9332\u30b5\u30fc\u30d3\u30b9\u30bf\u30a4\u30d7\u304b\u3089\u9078\u629e',
    'providers.form.schemaVersionLabel':
      '\u30b9\u30ad\u30fc\u30de\u30d0\u30fc\u30b8\u30e7\u30f3 *',
    'providers.form.schemaVersionHelper': '\u4f8b: v1, v1alpha1, v2beta2',
    'providers.form.operationsLabel':
      '\u30aa\u30da\u30ec\u30fc\u30b7\u30e7\u30f3',
    'providers.form.operationsHelper':
      '\u3053\u306e\u30d7\u30ed\u30d0\u30a4\u30c0\u30fc\u304c\u30b5\u30dd\u30fc\u30c8\u3059\u308b\u30aa\u30da\u30ec\u30fc\u30b7\u30e7\u30f3\u3092\u9078\u629e',
    'policies.emptyTitle': '\u30dd\u30ea\u30b7\u30fc\u306a\u3057',
    'policies.emptyDescription':
      'DCM \u30ea\u30bd\u30fc\u30b9\u306b\u5bfe\u3059\u308b\u30ac\u30d0\u30ca\u30f3\u30b9\u30eb\u30fc\u30eb\u3092\u5f37\u5236\u3059\u308b OPA Rego \u30dd\u30ea\u30b7\u30fc\u3092\u4f5c\u6210\u3057\u3066\u304f\u3060\u3055\u3044\u3002',
    'policies.createButton': '\u4f5c\u6210',
    'policies.entityLabel': '\u30dd\u30ea\u30b7\u30fc',
    'policies.createDialogTitle': '\u30dd\u30ea\u30b7\u30fc\u3092\u4f5c\u6210',
    'policies.editDialogTitle': '\u30dd\u30ea\u30b7\u30fc\u3092\u7de8\u96c6',
    'policies.saveButton': '\u4fdd\u5b58',
    'policies.createSuccess':
      '\u30dd\u30ea\u30b7\u30fc\u3092\u6b63\u5e38\u306b\u4f5c\u6210\u3057\u307e\u3057\u305f\u3002',
    'policies.updateSuccess':
      '\u30dd\u30ea\u30b7\u30fc\u3092\u6b63\u5e38\u306b\u66f4\u65b0\u3057\u307e\u3057\u305f\u3002',
    'policies.deleteSuccess':
      '\u30dd\u30ea\u30b7\u30fc\u3092\u6b63\u5e38\u306b\u524a\u9664\u3057\u307e\u3057\u305f\u3002',
    'policies.deleteLabel': '\u30dd\u30ea\u30b7\u30fc',
    'policies.enabledYes': '\u306f\u3044',
    'policies.enabledNo': '\u3044\u3044\u3048',
    'policies.toggleDisable':
      '\u30dd\u30ea\u30b7\u30fc\u3092\u7121\u52b9\u5316',
    'policies.toggleEnable': '\u30dd\u30ea\u30b7\u30fc\u3092\u6709\u52b9\u5316',
    'policies.toggleDisableAria': '\u7121\u52b9\u5316',
    'policies.toggleEnableAria': '\u6709\u52b9\u5316',
    'policies.columns.displayName': '\u8868\u793a\u540d',
    'policies.columns.type': '\u30bf\u30a4\u30d7',
    'policies.columns.priority': '\u512a\u5148\u5ea6',
    'policies.columns.enabled': '\u6709\u52b9',
    'policies.columns.description': '\u8a73\u7d30',
    'policies.form.displayNameLabel': '\u8868\u793a\u540d *',
    'policies.form.displayNameHelper':
      '\u3053\u306e\u30dd\u30ea\u30b7\u30fc\u306e\u8aad\u307f\u3084\u3059\u3044\u540d\u524d',
    'policies.form.descriptionLabel': '\u8aac\u660e',
    'policies.form.descriptionHelper':
      '\u4efb\u610f \u2014 \u3053\u306e\u30dd\u30ea\u30b7\u30fc\u306e\u76ee\u7684\u3092\u8aac\u660e\u3057\u3066\u304f\u3060\u3055\u3044',
    'policies.form.policyTypeLabel':
      '\u30dd\u30ea\u30b7\u30fc\u30bf\u30a4\u30d7 *',
    'policies.form.policyTypeGlobal':
      'GLOBAL \u2014 \u3059\u3079\u3066\u306e\u30ea\u30af\u30a8\u30b9\u30c8\u306b\u9069\u7528',
    'policies.form.policyTypeUser':
      'USER \u2014 \u30e6\u30fc\u30b6\u30fc\u3054\u3068\u306b\u9069\u7528',
    'policies.form.priorityLabel': '\u512a\u5148\u5ea6 *',
    'policies.form.priorityHelper':
      '1\uff08\u6700\u9ad8\uff09\u2013 1000\uff08\u6700\u4f4e\uff09\u3001\u30c7\u30d5\u30a9\u30eb\u30c8 500',
    'policies.form.regoCodeLabel': 'Rego \u30b3\u30fc\u30c9 *',
    'policies.form.regoCodeHelper':
      'Placement Manager \u306b\u3088\u308a\u8a55\u4fa1\u3055\u308c\u308b OPA Rego \u30dd\u30ea\u30b7\u30fc\u3002',
    'policies.form.regoCodePlaceholder': 'package dcm.placement',
    'policies.form.enabledLabel': '\u6709\u52b9',
    'serviceTypes.emptyTitle':
      '\u30b5\u30fc\u30d3\u30b9\u30bf\u30a4\u30d7\u306a\u3057',
    'serviceTypes.emptyDescription':
      '\u30b5\u30fc\u30d3\u30b9\u30bf\u30a4\u30d7\u306f\u30ab\u30bf\u30ed\u30b0\u30a2\u30a4\u30c6\u30e0\u306e\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u30b9\u30ad\u30fc\u30de\u3092\u5b9a\u7fa9\u3057\u307e\u3059\u3002',
    'serviceTypes.cardTitle':
      '\u30b5\u30fc\u30d3\u30b9\u30bf\u30a4\u30d7 ({{count}})',
    'serviceTypes.columns.serviceType':
      '\u30b5\u30fc\u30d3\u30b9\u30bf\u30a4\u30d7',
    'serviceTypes.columns.apiVersion': 'API \u30d0\u30fc\u30b8\u30e7\u30f3',
    'serviceTypes.columns.path': '\u30d1\u30b9',
    'serviceTypes.columns.created': '\u4f5c\u6210\u65e5',
    'catalogItems.emptyTitle':
      '\u30ab\u30bf\u30ed\u30b0\u30a2\u30a4\u30c6\u30e0\u306a\u3057',
    'catalogItems.emptyDescription':
      '\u30ab\u30bf\u30ed\u30b0\u30a2\u30a4\u30c6\u30e0\u306f\u958b\u767a\u8005\u304c\u30d7\u30ed\u30d3\u30b8\u30e7\u30cb\u30f3\u30b0\u3067\u304d\u308b\u30b5\u30fc\u30d3\u30b9\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u3067\u3059\u3002',
    'catalogItems.createButton': '\u4f5c\u6210',
    'catalogItems.entityLabel':
      '\u30ab\u30bf\u30ed\u30b0\u30a2\u30a4\u30c6\u30e0',
    'catalogItems.createDrawerTitle':
      '\u30ab\u30bf\u30ed\u30b0\u30a2\u30a4\u30c6\u30e0\u3092\u4f5c\u6210',
    'catalogItems.editDrawerTitle':
      '\u30ab\u30bf\u30ed\u30b0\u30a2\u30a4\u30c6\u30e0\u3092\u7de8\u96c6',
    'catalogItems.saveButton': '\u4fdd\u5b58',
    'catalogItems.createSuccess':
      '\u30ab\u30bf\u30ed\u30b0\u30a2\u30a4\u30c6\u30e0\u3092\u6b63\u5e38\u306b\u4f5c\u6210\u3057\u307e\u3057\u305f\u3002',
    'catalogItems.updateSuccess':
      '\u30ab\u30bf\u30ed\u30b0\u30a2\u30a4\u30c6\u30e0\u3092\u6b63\u5e38\u306b\u66f4\u65b0\u3057\u307e\u3057\u305f\u3002',
    'catalogItems.deleteSuccess':
      '\u30ab\u30bf\u30ed\u30b0\u30a2\u30a4\u30c6\u30e0\u3092\u6b63\u5e38\u306b\u524a\u9664\u3057\u307e\u3057\u305f\u3002',
    'catalogItems.deleteLabel':
      '\u30ab\u30bf\u30ed\u30b0\u30a2\u30a4\u30c6\u30e0',
    'catalogItems.columns.displayName': '\u8868\u793a\u540d',
    'catalogItems.columns.apiVersion': 'API \u30d0\u30fc\u30b8\u30e7\u30f3',
    'catalogItems.columns.serviceType':
      '\u30b5\u30fc\u30d3\u30b9\u30bf\u30a4\u30d7',
    'catalogItems.columns.fields': '\u30d5\u30a3\u30fc\u30eb\u30c9',
    'catalogItems.columns.created': '\u4f5c\u6210\u65e5',
    'catalogItems.fieldCount_one': '1 \u30d5\u30a3\u30fc\u30eb\u30c9',
    'catalogItems.fieldCount_other': '{{count}} \u30d5\u30a3\u30fc\u30eb\u30c9',
    'catalogItems.form.importButton':
      '\u30d5\u30a1\u30a4\u30eb\u304b\u3089\u30a4\u30f3\u30dd\u30fc\u30c8',
    'catalogItems.form.importTooltip':
      'JSON \u307e\u305f\u306f YAML \u30ab\u30bf\u30ed\u30b0\u30a2\u30a4\u30c6\u30e0\u5b9a\u7fa9\u304b\u3089\u30d5\u30a9\u30fc\u30e0\u3092\u5165\u529b',
    'catalogItems.form.importError':
      '\u30d5\u30a1\u30a4\u30eb\u306e\u30a4\u30f3\u30dd\u30fc\u30c8\u306b\u5931\u6557\u3057\u307e\u3057\u305f \u2014 \u6709\u52b9\u306a JSON \u307e\u305f\u306f YAML \u3067\u3042\u308b\u3053\u3068\u3092\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002',
    'catalogItems.form.displayNameLabel': '\u8868\u793a\u540d *',
    'catalogItems.form.displayNameHelper':
      '\u3053\u306e\u30ab\u30bf\u30ed\u30b0\u30a2\u30a4\u30c6\u30e0\u306e\u8aad\u307f\u3084\u3059\u3044\u540d\u524d\uff0863 \u6587\u5b57\u4ee5\u5185\uff09',
    'catalogItems.form.apiVersionLabel': 'API \u30d0\u30fc\u30b8\u30e7\u30f3 *',
    'catalogItems.form.apiVersionHelper':
      'v<\u6570\u5b57>[alpha|beta][\u6570\u5b57] \u306e\u30d1\u30bf\u30fc\u30f3\u306b\u5f93\u3046\u3053\u3068\u2014\u4f8b: v1, v1alpha1',
    'catalogItems.form.serviceTypeLabel':
      '\u30b5\u30fc\u30d3\u30b9\u30bf\u30a4\u30d7 *',
    'catalogItems.form.serviceTypeHelperEdit':
      '\u30b5\u30fc\u30d3\u30b9\u30bf\u30a4\u30d7\u306f\u4f5c\u6210\u5f8c\u306b\u5909\u66f4\u3067\u304d\u307e\u305b\u3093',
    'catalogItems.form.serviceTypeHelperNoTypes':
      '\u5229\u7528\u53ef\u80fd\u306a\u30b5\u30fc\u30d3\u30b9\u30bf\u30a4\u30d7\u306a\u3057 \u2014 \u307e\u305a\u30b5\u30fc\u30d3\u30b9\u30bf\u30a4\u30d7\u30bf\u30d6\u3067\u4f5c\u6210\u3057\u3066\u304f\u3060\u3055\u3044',
    'catalogItems.form.serviceTypeHelperDefault':
      '\u3053\u306e\u30a2\u30a4\u30c6\u30e0\u306e\u30d9\u30fc\u30b9\u3068\u306a\u308b\u30b5\u30fc\u30d3\u30b9\u30bf\u30a4\u30d7\u3092\u9078\u629e',
    'catalogItems.form.fieldsLabel': '\u30d5\u30a3\u30fc\u30eb\u30c9 *',
    'catalogItems.form.fieldsCaption':
      '(\u5c11\u306a\u304f\u3068\u3082 1 \u3064\u5fc5\u8981)',
    'catalogItems.form.fieldsErrorEmpty':
      '\u30d1\u30b9\u304c\u7a7a\u3067\u306a\u3044\u30d5\u30a3\u30fc\u30eb\u30c9\u3092\u5c11\u306a\u304f\u3068\u3082 1 \u3064\u8ffd\u52a0\u3057\u3066\u304f\u3060\u3055\u3044\u3002',
    'catalogItems.form.fieldAddButton':
      '\u30d5\u30a3\u30fc\u30eb\u30c9\u3092\u8ffd\u52a0',
    'catalogItems.form.fieldAddTooltip':
      '\u65b0\u3057\u3044\u30d5\u30a3\u30fc\u30eb\u30c9\u3092\u8ffd\u52a0\u3059\u308b\u524d\u306b\u6700\u5f8c\u306e\u30d5\u30a3\u30fc\u30eb\u30c9\u306e\u30d1\u30b9\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044',
    'catalogItems.form.fieldPathLabel': '\u30d1\u30b9 *',
    'catalogItems.form.fieldPathHelper': '\u4f8b: config.replicas',
    'catalogItems.form.fieldDisplayNameLabel': '\u8868\u793a\u540d',
    'catalogItems.form.fieldEditableLabel': '\u7de8\u96c6\u53ef\u80fd',
    'catalogItems.form.fieldDefaultValueLabel':
      '\u30c7\u30d5\u30a9\u30eb\u30c8\u5024',
    'catalogItems.form.fieldDefaultValueHelper':
      '\u4efb\u610f\u306e JSON \u5024 \u2014 \u4f8b: 42, "\u3053\u3093\u306b\u3061\u306f", true, [1,2]',
    'catalogItems.form.fieldRemoveAriaLabel':
      '\u30d5\u30a3\u30fc\u30eb\u30c9\u3092\u524a\u9664',
    'catalogItems.form.schemaLabel':
      '\u30d0\u30ea\u30c7\u30fc\u30b7\u30e7\u30f3\u30b9\u30ad\u30fc\u30de',
    'catalogItems.form.schemaEditButton': 'JSON \u3092\u7de8\u96c6',
    'catalogItems.form.schemaAddButton': 'JSON \u3092\u8ffd\u52a0',
    'catalogItems.form.schemaDialogTitle':
      '\u30d0\u30ea\u30c7\u30fc\u30b7\u30e7\u30f3\u30b9\u30ad\u30fc\u30de',
    'catalogItems.form.schemaDialogHelper':
      'JSON \u30b9\u30ad\u30fc\u30de\u30aa\u30d6\u30b8\u30a7\u30af\u30c8 \u2014 \u4f8b: {"type":"integer","minimum":0}',
    'catalogItems.form.schemaDialogCancel': '\u30ad\u30e3\u30f3\u30bb\u30eb',
    'catalogItems.form.schemaDialogApply': '\u9069\u7528',
    'catalogItems.form.schemaMustBeObject':
      'JSON \u30aa\u30d6\u30b8\u30a7\u30af\u30c8\u3067\u306a\u3051\u308c\u3070\u306a\u308a\u307e\u305b\u3093\uff08\u914d\u5217\u307e\u305f\u306f\u30d7\u30ea\u30df\u30c6\u30a3\u30d6\u306f\u4e0d\u53ef\uff09',
    'catalogItems.form.schemaInvalidJson':
      '\u7121\u52b9\u306a JSON \u69cb\u6587',
    'instances.emptyTitle':
      '\u30d7\u30ed\u30d3\u30b8\u30e7\u30cb\u30f3\u30b0\u6e08\u307f\u30a4\u30f3\u30b9\u30bf\u30f3\u30b9\u306a\u3057',
    'instances.emptyDescription':
      '\u30ab\u30bf\u30ed\u30b0\u30a2\u30a4\u30c6\u30e0\u30a4\u30f3\u30b9\u30bf\u30f3\u30b9\u306f\u30d7\u30ed\u30d3\u30b8\u30e7\u30cb\u30f3\u30b0\u3055\u308c\u305f\u30b5\u30fc\u30d3\u30b9\u3092\u8868\u3057\u307e\u3059\u3002',
    'instances.createButton': '\u4f5c\u6210',
    'instances.entityLabel':
      '\u30ab\u30bf\u30ed\u30b0\u30a2\u30a4\u30c6\u30e0\u30a4\u30f3\u30b9\u30bf\u30f3\u30b9',
    'instances.createDialogTitle':
      '\u30ab\u30bf\u30ed\u30b0\u30a2\u30a4\u30c6\u30e0\u30a4\u30f3\u30b9\u30bf\u30f3\u30b9\u3092\u4f5c\u6210',
    'instances.rehydrateSuccess':
      '\u30ab\u30bf\u30ed\u30b0\u30a2\u30a4\u30c6\u30e0\u30a4\u30f3\u30b9\u30bf\u30f3\u30b9\u3092\u6b63\u5e38\u306b\u30ea\u30cf\u30a4\u30c9\u30ec\u30fc\u30c8\u3057\u307e\u3057\u305f\u3002',
    'instances.deleteLabel': '\u30a4\u30f3\u30b9\u30bf\u30f3\u30b9',
    'instances.rehydrateTooltip': '\u30ea\u30cf\u30a4\u30c9\u30ec\u30fc\u30c8',
    'instances.rehydrateAriaLabel':
      '\u30a4\u30f3\u30b9\u30bf\u30f3\u30b9\u3092\u30ea\u30cf\u30a4\u30c9\u30ec\u30fc\u30c8',
    'instances.deleteTooltip': '\u524a\u9664',
    'instances.deleteAriaLabel':
      '\u30a4\u30f3\u30b9\u30bf\u30f3\u30b9\u3092\u524a\u9664',
    'instances.rehydrateDialogTitle':
      '\u30a4\u30f3\u30b9\u30bf\u30f3\u30b9\u3092\u30ea\u30cf\u30a4\u30c9\u30ec\u30fc\u30c8\u3057\u307e\u3059\u304b\uff1f',
    'instances.rehydrateDialogBody':
      '{{instanceName}}\u3092\u30ea\u30cf\u30a4\u30c9\u30ec\u30fc\u30c8\u3059\u308b\u3068\u30ea\u30bd\u30fc\u30b9\u304c\u518d\u30d7\u30ed\u30d3\u30b8\u30e7\u30cb\u30f3\u30b0\u3055\u308c\u3001\u65b0\u3057\u3044\u30ea\u30bd\u30fc\u30b9 ID \u304c\u5272\u308a\u5f53\u3066\u3089\u308c\u308b\u5834\u5408\u304c\u3042\u308a\u307e\u3059\u3002\u3053\u306e\u64cd\u4f5c\u306f\u5143\u306b\u623b\u305b\u307e\u305b\u3093\u3002',
    'instances.rehydrateDialogFallbackName':
      '\u3053\u306e\u30a4\u30f3\u30b9\u30bf\u30f3\u30b9',
    'instances.rehydrateDialogCancel': '\u30ad\u30e3\u30f3\u30bb\u30eb',
    'instances.rehydrateDialogConfirm':
      '\u30ea\u30cf\u30a4\u30c9\u30ec\u30fc\u30c8',
    'instances.columns.displayName': '\u8868\u793a\u540d',
    'instances.columns.catalogItem':
      '\u30ab\u30bf\u30ed\u30b0\u30a2\u30a4\u30c6\u30e0',
    'instances.columns.resourceId': '\u30ea\u30bd\u30fc\u30b9 ID',
    'instances.columns.apiVersion': 'API \u30d0\u30fc\u30b8\u30e7\u30f3',
    'instances.columns.created': '\u4f5c\u6210\u65e5',
    'instances.form.displayNameLabel': '\u8868\u793a\u540d *',
    'instances.form.displayNameHelper':
      '\u3053\u306e\u30d7\u30ed\u30d3\u30b8\u30e7\u30cb\u30f3\u30b0\u6e08\u307f\u30a4\u30f3\u30b9\u30bf\u30f3\u30b9\u306e\u8aad\u307f\u3084\u3059\u3044\u540d\u524d\uff0863 \u6587\u5b57\u4ee5\u5185\uff09',
    'instances.form.catalogItemLabel':
      '\u30ab\u30bf\u30ed\u30b0\u30a2\u30a4\u30c6\u30e0 *',
    'instances.form.catalogItemSelect':
      '\u30ab\u30bf\u30ed\u30b0\u30a2\u30a4\u30c6\u30e0\u3092\u9078\u629e\u2026',
    'instances.form.catalogItemHelperNoItems':
      '\u5229\u7528\u53ef\u80fd\u306a\u30ab\u30bf\u30ed\u30b0\u30a2\u30a4\u30c6\u30e0\u306a\u3057 \u2014 \u307e\u305a\u30ab\u30bf\u30ed\u30b0\u30a2\u30a4\u30c6\u30e0\u30bf\u30d6\u3067\u4f5c\u6210\u3057\u3066\u304f\u3060\u3055\u3044',
    'instances.form.catalogItemHelperDefault':
      '\u30a4\u30f3\u30b9\u30bf\u30f3\u30b9\u3092\u30d7\u30ed\u30d3\u30b8\u30e7\u30cb\u30f3\u30b0\u3059\u308b\u30ab\u30bf\u30ed\u30b0\u30a2\u30a4\u30c6\u30e0\u3092\u9078\u629e',
    'instances.form.apiVersionLabel': 'API \u30d0\u30fc\u30b8\u30e7\u30f3 *',
    'instances.form.apiVersionHelper':
      'v<\u6570\u5b57>[alpha|beta][\u6570\u5b57] \u306e\u30d1\u30bf\u30fc\u30f3\u306b\u5f93\u3046\u3053\u3068\u2014\u4f8b: v1, v1alpha1',
    'instances.form.fieldValuesSection': '\u30d5\u30a3\u30fc\u30eb\u30c9\u5024',
    'instances.form.fieldValuesSectionHint':
      '(\u3053\u306e\u30ab\u30bf\u30ed\u30b0\u30a2\u30a4\u30c6\u30e0\u3067\u5b9a\u7fa9\u3055\u308c\u305f\u7de8\u96c6\u53ef\u80fd\u30d5\u30a3\u30fc\u30eb\u30c9)',
    'instances.form.noEditableFields':
      '\u3053\u306e\u30ab\u30bf\u30ed\u30b0\u30a2\u30a4\u30c6\u30e0\u306b\u306f\u7de8\u96c6\u53ef\u80fd\u306a\u30d5\u30a3\u30fc\u30eb\u30c9\u304c\u3042\u308a\u307e\u305b\u3093\u3002',
    'resources.emptyTitle':
      '\u30ea\u30bd\u30fc\u30b9\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093',
    'resources.emptyDescription':
      'DCM \u3067\u30d7\u30ed\u30d3\u30b8\u30e7\u30cb\u30f3\u30b0\u3055\u308c\u305f\u30b5\u30fc\u30d3\u30b9\u30bf\u30a4\u30d7\u30a4\u30f3\u30b9\u30bf\u30f3\u30b9\u304c\u3053\u3053\u306b\u8868\u793a\u3055\u308c\u307e\u3059\u3002',
    'resources.cardTitle': '\u30ea\u30bd\u30fc\u30b9 ({{count}})',
    'resources.columns.id': 'ID',
    'resources.columns.serviceType':
      '\u30b5\u30fc\u30d3\u30b9\u30bf\u30a4\u30d7',
    'resources.columns.provider': '\u30d7\u30ed\u30d0\u30a4\u30c0\u30fc',
    'resources.columns.status': '\u30b9\u30c6\u30fc\u30bf\u30b9',
    'resources.columns.created': '\u4f5c\u6210\u65e5',
    'copyButton.copy': '\u30b3\u30d4\u30fc',
    'copyButton.copied': '\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f\uff01',
    'copyButton.failed': '\u30b3\u30d4\u30fc\u5931\u6557',
    'copyButton.ariaLabel':
      '\u30af\u30ea\u30c3\u30d7\u30dc\u30fc\u30c9\u306b\u30b3\u30d4\u30fc',
    'validation.provider.nameRequired':
      '\u540d\u524d\u306f\u5fc5\u9808\u3067\u3059',
    'validation.provider.namePattern':
      '\u5c0f\u6587\u5b57\u3001\u6570\u5b57\u3001\u30cf\u30a4\u30d5\u30f3\u306e\u307f\u4f7f\u7528\u3067\u304d\u307e\u3059\uff08\u6587\u5b57\u3067\u59cb\u307e\u308b\u5fc5\u8981\u304c\u3042\u308a\u307e\u3059\uff09',
    'validation.provider.endpointRequired':
      '\u30a8\u30f3\u30c9\u30dd\u30a4\u30f3\u30c8\u306f\u5fc5\u9808\u3067\u3059',
    'validation.provider.endpointPattern': `${protocol}:// \u307e\u305f\u306f https:// \u3067\u59cb\u307e\u308b\u5fc5\u8981\u304c\u3042\u308a\u307e\u3059\uff08\u4f8b: https://my-service:8081/api\uff09`,
    'validation.provider.serviceTypeRequired':
      '\u30b5\u30fc\u30d3\u30b9\u30bf\u30a4\u30d7\u306f\u5fc5\u9808\u3067\u3059',
    'validation.provider.serviceTypeMin':
      '\u30ea\u30b9\u30c8\u304b\u3089\u30b5\u30fc\u30d3\u30b9\u30bf\u30a4\u30d7\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044',
    'validation.provider.schemaVersionRequired':
      '\u30b9\u30ad\u30fc\u30de\u30d0\u30fc\u30b8\u30e7\u30f3\u306f\u5fc5\u9808\u3067\u3059',
    'validation.provider.schemaVersionPattern':
      'v<\u6570\u5b57>[alpha|beta][<\u6570\u5b57>] \u306e\u5f62\u5f0f\u306b\u5f93\u3063\u3066\u304f\u3060\u3055\u3044 \u2014 \u4f8b: v1, v1alpha1, v2beta2',
    'validation.policy.displayNameRequired':
      '\u8868\u793a\u540d\u306f\u5fc5\u9808\u3067\u3059',
    'validation.policy.displayNameEmpty':
      '\u8868\u793a\u540d\u306f\u7a7a\u306b\u3067\u304d\u307e\u305b\u3093',
    'validation.policy.displayNameMax':
      '\u8868\u793a\u540d\u306f255\u6587\u5b57\u4ee5\u5185\u3067\u3042\u308b\u5fc5\u8981\u304c\u3042\u308a\u307e\u3059',
    'validation.policy.descriptionMax':
      '\u8aac\u660e\u306f255\u6587\u5b57\u4ee5\u5185\u3067\u3042\u308b\u5fc5\u8981\u304c\u3042\u308a\u307e\u3059',
    'validation.policy.policyTypeRequired':
      '\u30dd\u30ea\u30b7\u30fc\u30bf\u30a4\u30d7\u306f\u5fc5\u9808\u3067\u3059',
    'validation.policy.policyTypeOneOf':
      'GLOBAL \u307e\u305f\u306f USER \u3067\u3042\u308b\u5fc5\u8981\u304c\u3042\u308a\u307e\u3059',
    'validation.policy.priorityType':
      '\u512a\u5148\u5ea6\u306f\u6570\u5b57\u3067\u3042\u308b\u5fc5\u8981\u304c\u3042\u308a\u307e\u3059',
    'validation.policy.priorityRequired':
      '\u512a\u5148\u5ea6\u306f\u5fc5\u9808\u3067\u3059',
    'validation.policy.priorityInteger':
      '\u512a\u5148\u5ea6\u306f\u6574\u6570\u3067\u3042\u308b\u5fc5\u8981\u304c\u3042\u308a\u307e\u3059',
    'validation.policy.priorityMin':
      '\u512a\u5148\u5ea6\u306f1\u4ee5\u4e0a\u3067\u3042\u308b\u5fc5\u8981\u304c\u3042\u308a\u307e\u3059',
    'validation.policy.priorityMax':
      '\u512a\u5148\u5ea6\u306f1000\u4ee5\u4e0b\u3067\u3042\u308b\u5fc5\u8981\u304c\u3042\u308a\u307e\u3059',
    'validation.policy.regoCodeRequired':
      'Rego\u30b3\u30fc\u30c9\u306f\u5fc5\u9808\u3067\u3059',
    'validation.policy.regoCodeEmpty':
      'Rego\u30b3\u30fc\u30c9\u306f\u7a7a\u306b\u3067\u304d\u307e\u305b\u3093',
    'validation.policy.regoCodePackage':
      '\u30d1\u30c3\u30b1\u30fc\u30b8\u5ba3\u8a00\u304c\u5fc5\u8981\u3067\u3059 \u2014 \u4f8b: "package dcm.placement"',
    'validation.catalogItem.displayNameRequired':
      '\u8868\u793a\u540d\u306f\u5fc5\u9808\u3067\u3059',
    'validation.catalogItem.displayNameEmpty':
      '\u8868\u793a\u540d\u306f\u7a7a\u306b\u3067\u304d\u307e\u305b\u3093',
    'validation.catalogItem.displayNameMax':
      '\u8868\u793a\u540d\u306f63\u6587\u5b57\u4ee5\u5185\u3067\u3042\u308b\u5fc5\u8981\u304c\u3042\u308a\u307e\u3059',
    'validation.catalogItem.apiVersionRequired':
      'API\u30d0\u30fc\u30b8\u30e7\u30f3\u306f\u5fc5\u9808\u3067\u3059',
    'validation.catalogItem.apiVersionPattern':
      'v<\u6570\u5b57>[alpha|beta][<\u6570\u5b57>] \u306e\u5f62\u5f0f\u306b\u5f93\u3063\u3066\u304f\u3060\u3055\u3044 \u2014 \u4f8b: v1, v1alpha1',
    'validation.catalogItem.serviceTypeRequired':
      '\u30b5\u30fc\u30d3\u30b9\u30bf\u30a4\u30d7\u306f\u5fc5\u9808\u3067\u3059',
    'validation.catalogItem.duplicatePath':
      '\u30d1\u30b9\u304c\u91cd\u8907\u3057\u3066\u3044\u307e\u3059 \u2014 \u30d1\u30b9\u306f\u4e00\u610f\u3067\u3042\u308b\u5fc5\u8981\u304c\u3042\u308a\u307e\u3059',
    'validation.catalogItem.invalidJson':
      '\u7121\u52b9\u306aJSON\u3067\u3059 \u2014 \u69cb\u6587\u3092\u4fee\u6b63\u3059\u308b\u304b\u3001\u5358\u7d14\u306a\u6587\u5b57\u5217\u5024\u3092\u4f7f\u7528\u3057\u3066\u304f\u3060\u3055\u3044',
    'validation.catalogItem.schemaMustBeObject':
      'JSON\u30aa\u30d6\u30b8\u30a7\u30af\u30c8\u3067\u3042\u308b\u5fc5\u8981\u304c\u3042\u308a\u307e\u3059 \u2014 \u4f8b: {"type":"integer"}',
    'validation.catalogItem.schemaMinMaxConflict':
      '\u6700\u5c0f\u5024 ({{min}}) \u306f\u6700\u5927\u5024 ({{max}}) \u3092\u8d85\u3048\u3066\u306f\u306a\u308a\u307e\u305b\u3093',
    'validation.catalogItem.defaultBelowMin':
      '\u30c7\u30d5\u30a9\u30eb\u30c8\u5024 ({{value}}) \u306f\u30b9\u30ad\u30fc\u30de\u306e\u6700\u5c0f\u5024 ({{min}}) \u3092\u4e0b\u56de\u3063\u3066\u3044\u307e\u3059',
    'validation.catalogItem.defaultAboveMax':
      '\u30c7\u30d5\u30a9\u30eb\u30c8\u5024 ({{value}}) \u306f\u30b9\u30ad\u30fc\u30de\u306e\u6700\u5927\u5024 ({{max}}) \u3092\u8d85\u3048\u3066\u3044\u307e\u3059',
    'validation.catalogItem.schemaInvalidJson':
      '\u7121\u52b9\u306aJSON\u69cb\u6587\u3067\u3059',
    'validation.instance.displayNameRequired':
      '\u8868\u793a\u540d\u306f\u5fc5\u9808\u3067\u3059',
    'validation.instance.displayNameEmpty':
      '\u8868\u793a\u540d\u306f\u7a7a\u306b\u3067\u304d\u307e\u305b\u3093',
    'validation.instance.displayNameMax':
      '\u8868\u793a\u540d\u306f63\u6587\u5b57\u4ee5\u5185\u3067\u3042\u308b\u5fc5\u8981\u304c\u3042\u308a\u307e\u3059',
    'validation.instance.catalogItemRequired':
      '\u30ab\u30bf\u30ed\u30b0\u30a2\u30a4\u30c6\u30e0\u306f\u5fc5\u9808\u3067\u3059',
    'validation.instance.apiVersionRequired':
      'API\u30d0\u30fc\u30b8\u30e7\u30f3\u306f\u5fc5\u9808\u3067\u3059',
    'validation.instance.apiVersionPattern':
      'v<\u6570\u5b57>[alpha|beta][<\u6570\u5b57>] \u306e\u5f62\u5f0f\u306b\u5f93\u3063\u3066\u304f\u3060\u3055\u3044 \u2014 \u4f8b: v1, v1alpha1',
    'validation.instance.fieldRequired':
      '\u3053\u306e\u30d5\u30a3\u30fc\u30eb\u30c9\u306f\u5fc5\u9808\u3067\u3059',
    'validation.instance.fieldMustBeNumber':
      '\u6709\u52b9\u306a\u6570\u5b57\u3067\u3042\u308b\u5fc5\u8981\u304c\u3042\u308a\u307e\u3059',
    'validation.instance.fieldMin':
      '\u5c11\u306a\u304f\u3068\u3082 {{min}} \u3067\u3042\u308b\u5fc5\u8981\u304c\u3042\u308a\u307e\u3059',
    'validation.instance.fieldMax':
      '\u6700\u5927\u3067\u3082 {{max}} \u3067\u3042\u308b\u5fc5\u8981\u304c\u3042\u308a\u307e\u3059',
  },
});

export default dcmTranslationJa;
