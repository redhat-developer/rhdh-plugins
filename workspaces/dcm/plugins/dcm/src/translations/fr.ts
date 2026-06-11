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

const dcmTranslationFr: TranslationMessages<
  'plugin.dcm',
  Record<string, string>
> = createTranslationMessages({
  ref: dcmTranslationRef,
  messages: {
    'page.title': 'Centre de donn\u00e9es',
    'page.tabs.providers': 'Fournisseurs',
    'page.tabs.policies': 'Politiques',
    'page.tabs.serviceTypes': 'Types de service',
    'page.tabs.catalogItems': '\u00c9l\u00e9ments du catalogue',
    'page.tabs.instances': 'Instances',
    'page.tabs.resources': 'Ressources',
    'common.retry': 'R\u00e9essayer',
    'common.refresh': 'Actualiser',
    'common.search': 'Rechercher',
    'common.clearSearch': 'Effacer la recherche',
    'common.edit': 'Modifier',
    'common.delete': 'Supprimer',
    'common.actions': 'Actions',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.saving': 'Enregistrement\u2026',
    'common.close': 'Fermer',
    'common.rows': 'lignes',
    'common.emDash': '\u2014',
    'deleteDialog.title': 'Supprimer {{resourceLabel}}',
    'deleteDialog.confirmButton': 'Supprimer',
    'deleteDialog.cancelButton': 'Annuler',
    'deleteDialog.body':
      '\u00cates-vous s\u00fbr de vouloir supprimer {{resourceName}}\u00a0? Cette action est irr\u00e9versible.',
    'providers.emptyTitle': 'Aucun fournisseur enregistr\u00e9',
    'providers.emptyDescription':
      'Enregistrez un fournisseur de services pour permettre \u00e0 DCM de provisionner des ressources sur une infrastructure externe (p.\u00a0ex. OpenShift, AWS).',
    'providers.registerButton': 'Enregistrer',
    'providers.entityLabel': 'Fournisseurs',
    'providers.registerDialogTitle': 'Enregistrer un fournisseur',
    'providers.editDialogTitle': 'Modifier le fournisseur',
    'providers.saveButton': 'Enregistrer',
    'providers.createSuccess': 'Fournisseur enregistr\u00e9 avec succ\u00e8s.',
    'providers.updateSuccess': 'Fournisseur mis \u00e0 jour avec succ\u00e8s.',
    'providers.deleteSuccess': 'Fournisseur supprim\u00e9 avec succ\u00e8s.',
    'providers.deleteLabel': 'fournisseur',
    'providers.columns.displayName': 'Nom affich\u00e9',
    'providers.columns.name': 'Nom',
    'providers.columns.endpoint': 'Point de terminaison',
    'providers.columns.serviceType': 'Type de service',
    'providers.columns.operations': 'Op\u00e9rations',
    'providers.columns.status': '\u00c9tat',
    'providers.form.nameLabel': 'Nom *',
    'providers.form.namePlaceholder': 'p.\u00a0ex. mon-fournisseur-k8s',
    'providers.form.nameHelper':
      'Identifiant unique \u2014 uniquement lettres minuscules, chiffres et tirets',
    'providers.form.nameHelperEditMode':
      'Le nom du fournisseur ne peut pas \u00eatre modifi\u00e9 apr\u00e8s la cr\u00e9ation',
    'providers.form.endpointLabel': 'Point de terminaison *',
    'providers.form.endpointPlaceholder': 'https://api.exemple.com',
    'providers.form.endpointHelper':
      'URL compl\u00e8te de l\u2019API du fournisseur (p.\u00a0ex. https://api.exemple.com)',
    'providers.form.serviceTypeLabel': 'Type de service *',
    'providers.form.serviceTypeEmpty': 'Aucun type de service disponible',
    'providers.form.serviceTypeSelect':
      'S\u00e9lectionnez un type de service\u2026',
    'providers.form.serviceTypeHelperNoTypes':
      'Cr\u00e9ez d\u2019abord un type de service dans l\u2019onglet Types de service',
    'providers.form.serviceTypeHelperDefault':
      'S\u00e9lectionner parmi les types de service enregistr\u00e9s',
    'providers.form.schemaVersionLabel': 'Version du sch\u00e9ma *',
    'providers.form.schemaVersionHelper':
      'p.\u00a0ex. v1, v1alpha1, v2beta2 \u2014 uniquement v<nombre>[alpha|beta][nombre]',
    'providers.form.operationsLabel': 'Op\u00e9rations',
    'providers.form.operationsHelper':
      'S\u00e9lectionner les op\u00e9rations prises en charge par ce fournisseur',
    'policies.emptyTitle': 'Aucune politique d\u00e9finie',
    'policies.emptyDescription':
      'Cr\u00e9ez des politiques OPA Rego pour appliquer des r\u00e8gles de gouvernance sur les ressources DCM.',
    'policies.createButton': 'Cr\u00e9er',
    'policies.entityLabel': 'Politiques',
    'policies.createDialogTitle': 'Cr\u00e9er une politique',
    'policies.editDialogTitle': 'Modifier la politique',
    'policies.saveButton': 'Enregistrer',
    'policies.createSuccess': 'Politique cr\u00e9\u00e9e avec succ\u00e8s.',
    'policies.updateSuccess': 'Politique mise \u00e0 jour avec succ\u00e8s.',
    'policies.deleteSuccess': 'Politique supprim\u00e9e avec succ\u00e8s.',
    'policies.deleteLabel': 'politique',
    'policies.enabledYes': 'Oui',
    'policies.enabledNo': 'Non',
    'policies.toggleDisable': 'D\u00e9sactiver la politique',
    'policies.toggleEnable': 'Activer la politique',
    'policies.toggleDisableAria': 'D\u00e9sactiver',
    'policies.toggleEnableAria': 'Activer',
    'policies.columns.displayName': 'Nom affich\u00e9',
    'policies.columns.type': 'Type',
    'policies.columns.priority': 'Priorit\u00e9',
    'policies.columns.enabled': 'Activ\u00e9e',
    'policies.columns.description': 'Description',
    'policies.form.displayNameLabel': 'Nom affich\u00e9 *',
    'policies.form.displayNameHelper': 'Nom lisible pour cette politique',
    'policies.form.descriptionLabel': 'Description',
    'policies.form.descriptionHelper':
      'Optionnel \u2014 d\u00e9crivez l\u2019objectif de cette politique',
    'policies.form.policyTypeLabel': 'Type de politique *',
    'policies.form.policyTypeGlobal':
      'GLOBAL \u2014 s\u2019applique \u00e0 toutes les requ\u00eates',
    'policies.form.policyTypeUser':
      'USER \u2014 s\u2019applique par utilisateur',
    'policies.form.priorityLabel': 'Priorit\u00e9 *',
    'policies.form.priorityHelper':
      '1 (la plus haute) \u2013 1000 (la plus basse), d\u00e9faut 500',
    'policies.form.regoCodeLabel': 'Code Rego *',
    'policies.form.regoCodeHelper':
      'Politique OPA Rego \u00e9valu\u00e9e par le Gestionnaire de placement.',
    'policies.form.regoCodePlaceholder': 'package dcm.placement',
    'policies.form.enabledLabel': 'Activ\u00e9e',
    'serviceTypes.emptyTitle': 'Aucun type de service d\u00e9fini',
    'serviceTypes.emptyDescription':
      'Les types de service d\u00e9finissent le sch\u00e9ma de mod\u00e8le pour les \u00e9l\u00e9ments du catalogue.',
    'serviceTypes.cardTitle': 'Types de service ({{count}})',
    'serviceTypes.columns.serviceType': 'Type de service',
    'serviceTypes.columns.apiVersion': 'Version API',
    'serviceTypes.columns.path': 'Chemin',
    'serviceTypes.columns.created': 'Cr\u00e9\u00e9',
    'catalogItems.emptyTitle':
      'Aucun \u00e9l\u00e9ment du catalogue d\u00e9fini',
    'catalogItems.emptyDescription':
      'Les \u00e9l\u00e9ments du catalogue sont des mod\u00e8les de service que les d\u00e9veloppeurs peuvent provisionner.',
    'catalogItems.createButton': 'Cr\u00e9er',
    'catalogItems.entityLabel': '\u00c9l\u00e9ments du catalogue',
    'catalogItems.createDrawerTitle':
      'Cr\u00e9er un \u00e9l\u00e9ment du catalogue',
    'catalogItems.editDrawerTitle':
      'Modifier l\u2019\u00e9l\u00e9ment du catalogue',
    'catalogItems.saveButton': 'Enregistrer',
    'catalogItems.createSuccess':
      '\u00c9l\u00e9ment du catalogue cr\u00e9\u00e9 avec succ\u00e8s.',
    'catalogItems.updateSuccess':
      '\u00c9l\u00e9ment du catalogue mis \u00e0 jour avec succ\u00e8s.',
    'catalogItems.deleteSuccess':
      '\u00c9l\u00e9ment du catalogue supprim\u00e9 avec succ\u00e8s.',
    'catalogItems.deleteLabel': '\u00e9l\u00e9ment du catalogue',
    'catalogItems.columns.displayName': 'Nom affich\u00e9',
    'catalogItems.columns.apiVersion': 'Version API',
    'catalogItems.columns.serviceType': 'Type de service',
    'catalogItems.columns.fields': 'Champs',
    'catalogItems.columns.created': 'Cr\u00e9\u00e9',
    'catalogItems.fieldCount.one': '1 champ',
    'catalogItems.fieldCount.other': '{{count}} champs',
    'catalogItems.form.importButton': 'Importer depuis un fichier',
    'catalogItems.form.importTooltip':
      'Remplir le formulaire depuis une d\u00e9finition JSON ou YAML',
    'catalogItems.form.importError':
      '\u00c9chec de l\u2019importation \u2014 v\u00e9rifiez que le fichier est un JSON ou YAML valide.',
    'catalogItems.form.displayNameLabel': 'Nom affich\u00e9 *',
    'catalogItems.form.displayNameHelper':
      'Nom lisible pour cet \u00e9l\u00e9ment du catalogue (max. 63 caract\u00e8res)',
    'catalogItems.form.apiVersionLabel': 'Version API *',
    'catalogItems.form.apiVersionHelper':
      'Doit suivre le sch\u00e9ma v<nombre>[alpha|beta][nombre] \u2014 p.\u00a0ex. v1, v1alpha1',
    'catalogItems.form.serviceTypeLabel': 'Type de service *',
    'catalogItems.form.serviceTypeHelperEdit':
      'Le type de service ne peut pas \u00eatre modifi\u00e9 apr\u00e8s la cr\u00e9ation',
    'catalogItems.form.serviceTypeHelperNoTypes':
      'Aucun type de service disponible \u2014 cr\u00e9ez-en un dans l\u2019onglet Types de service',
    'catalogItems.form.serviceTypeHelperDefault':
      'S\u00e9lectionnez le type de service sur lequel cet \u00e9l\u00e9ment est bas\u00e9',
    'catalogItems.form.fieldsLabel': 'Champs *',
    'catalogItems.form.fieldsCaption': '(au moins un requis)',
    'catalogItems.form.fieldsErrorEmpty':
      'Ajoutez au moins un champ avec un chemin non vide.',
    'catalogItems.form.fieldAddButton': 'Ajouter un champ',
    'catalogItems.form.fieldAddTooltip':
      'Remplissez le chemin du dernier champ avant d\u2019en ajouter un nouveau',
    'catalogItems.form.fieldPathLabel': 'Chemin *',
    'catalogItems.form.fieldPathHelper': 'p.\u00a0ex. config.replicas',
    'catalogItems.form.fieldDisplayNameLabel': 'Nom affich\u00e9',
    'catalogItems.form.fieldEditableLabel': 'Modifiable',
    'catalogItems.form.fieldDefaultValueLabel': 'Valeur par d\u00e9faut',
    'catalogItems.form.fieldDefaultValueHelper':
      'Toute valeur JSON \u2014 p.\u00a0ex. 42, "bonjour", true, [1,2]',
    'catalogItems.form.fieldRemoveAriaLabel': 'Supprimer le champ',
    'catalogItems.form.schemaLabel': 'Sch\u00e9ma de validation',
    'catalogItems.form.schemaEditButton': 'Modifier JSON',
    'catalogItems.form.schemaAddButton': 'Ajouter JSON',
    'catalogItems.form.schemaDialogTitle': 'Sch\u00e9ma de validation',
    'catalogItems.form.schemaDialogHelper':
      'Objet JSON Schema \u2014 p.\u00a0ex. {"type":"integer","minimum":0}',
    'catalogItems.form.schemaDialogCancel': 'Annuler',
    'catalogItems.form.schemaDialogApply': 'Appliquer',
    'catalogItems.form.schemaMustBeObject':
      'Doit \u00eatre un objet JSON, pas un tableau ni une valeur primitive',
    'catalogItems.form.schemaInvalidJson': 'Syntaxe JSON invalide',
    'instances.emptyTitle': 'Aucune instance provisionn\u00e9e',
    'instances.emptyDescription':
      'Les instances d\u2019\u00e9l\u00e9ments du catalogue repr\u00e9sentent des services provisonn\u00e9s.',
    'instances.createButton': 'Cr\u00e9er',
    'instances.entityLabel': 'Instances d\u2019\u00e9l\u00e9ments du catalogue',
    'instances.createDialogTitle':
      'Cr\u00e9er une instance d\u2019\u00e9l\u00e9ment du catalogue',
    'instances.rehydrateSuccess':
      'Instance d\u2019\u00e9l\u00e9ment du catalogue r\u00e9hydrat\u00e9e avec succ\u00e8s.',
    'instances.deleteLabel': 'instance',
    'instances.rehydrateTooltip': 'R\u00e9hydrater',
    'instances.rehydrateAriaLabel': 'R\u00e9hydrater l\u2019instance',
    'instances.deleteTooltip': 'Supprimer',
    'instances.deleteAriaLabel': 'Supprimer l\u2019instance',
    'instances.rehydrateDialogTitle': 'R\u00e9hydrater l\u2019instance\u00a0?',
    'instances.rehydrateDialogBody':
      'La r\u00e9hydratation de {{instanceName}} r\u00e9provisionnera la ressource et peut lui attribuer un nouvel identifiant. Cette action est irr\u00e9versible.',
    'instances.rehydrateDialogFallbackName': 'cette instance',
    'instances.rehydrateDialogCancel': 'Annuler',
    'instances.rehydrateDialogConfirm': 'R\u00e9hydrater',
    'instances.columns.displayName': 'Nom affich\u00e9',
    'instances.columns.catalogItem': '\u00c9l\u00e9ment du catalogue',
    'instances.columns.resourceId': 'ID de ressource',
    'instances.columns.apiVersion': 'Version API',
    'instances.columns.created': 'Cr\u00e9\u00e9',
    'instances.form.displayNameLabel': 'Nom affich\u00e9 *',
    'instances.form.displayNameHelper':
      'Nom lisible pour cette instance provisonn\u00e9e (max. 63 caract\u00e8res)',
    'instances.form.catalogItemLabel': '\u00c9l\u00e9ment du catalogue *',
    'instances.form.catalogItemSelect':
      'S\u00e9lectionnez un \u00e9l\u00e9ment du catalogue\u2026',
    'instances.form.catalogItemHelperNoItems':
      'Aucun \u00e9l\u00e9ment du catalogue disponible \u2014 cr\u00e9ez-en un dans l\u2019onglet \u00c9l\u00e9ments du catalogue',
    'instances.form.catalogItemHelperDefault':
      'Choisissez l\u2019\u00e9l\u00e9ment du catalogue \u00e0 provisionner',
    'instances.form.apiVersionLabel': 'Version API *',
    'instances.form.apiVersionHelper':
      'Doit suivre le sch\u00e9ma v<nombre>[alpha|beta][nombre] \u2014 p.\u00a0ex. v1, v1alpha1',
    'instances.form.fieldValuesSection': 'Valeurs des champs',
    'instances.form.fieldValuesSectionHint':
      '(champs modifiables d\u00e9finis par cet \u00e9l\u00e9ment du catalogue)',
    'instances.form.noEditableFields':
      'Cet \u00e9l\u00e9ment du catalogue n\u2019a pas de champs modifiables.',
    'resources.emptyTitle': 'Aucune ressource trouv\u00e9e',
    'resources.emptyDescription':
      'Les instances de types de service provisonn\u00e9es via DCM appara\u00eetront ici.',
    'resources.cardTitle': 'Ressources ({{count}})',
    'resources.columns.id': 'ID',
    'resources.columns.serviceType': 'Type de service',
    'resources.columns.provider': 'Fournisseur',
    'resources.columns.status': '\u00c9tat',
    'resources.columns.created': 'Cr\u00e9\u00e9',
    'copyButton.copy': 'Copier',
    'copyButton.copied': 'Copi\u00e9\u00a0!',
    'copyButton.failed': '\u00c9chec de la copie',
    'copyButton.ariaLabel': 'Copier dans le presse-papiers',
  },
});

export default dcmTranslationFr;
