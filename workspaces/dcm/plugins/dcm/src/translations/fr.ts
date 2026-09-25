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
    'page.title': 'Centre de données',
    'page.tabs.agents': 'Agents',
    'page.tabs.policies': 'Stratégies',
    'page.tabs.serviceTypes': 'Types de services',
    'page.tabs.catalogItems': 'Éléments du catalogue',
    'page.tabs.instances': 'Instances',
    'page.tabs.resources': 'Ressources',
    'common.retry': 'Réessayer',
    'common.refresh': 'Actualiser',
    'common.search': 'Recherche',
    'common.clearSearch': 'Effacer la recherche',
    'common.edit': 'Modifier',
    'common.delete': 'Supprimer',
    'common.actions': 'Actions',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.saving': 'Enregistrement',
    'common.close': 'Fermer',
    'common.rows': 'rangées',
    'common.previousPage': 'Précédent',
    'common.nextPage': 'Suivant',
    'common.next': 'Suivant',
    'common.back': 'Précédent',
    'common.loadingMore': 'Chargement en cours…',
    'deleteDialog.title': 'Supprimer {{resourceLabel}}',
    'deleteDialog.confirmButton': 'Supprimer',
    'deleteDialog.cancelButton': 'Annuler',
    'deleteDialog.body':
      'Êtes-vous sûr de vouloir supprimer {{resourceName}} ? Cette action est irréversible.',
    'agents.emptyTitle': 'Aucun agent enregistré',
    'agents.emptyDescription':
      "Les agents environnementaux s'enregistrent auprès du plan de contrôle et envoient des signaux de présence périodiques. Enregistrez un agent pour permettre à DCM de gérer les charges de travail sur des environnements externes.",
    'agents.registerButton': 'Registre',
    'agents.entityLabel': 'Agents',
    'agents.registerDialogTitle': 'Agent enregistré',
    'agents.createSuccess': 'Agent enregistré',
    'agents.columns.name': 'Nom',
    'agents.columns.environment': 'Environnement',
    'agents.columns.serviceTypes': 'Types de services',
    'agents.columns.cost': 'Coût',
    'agents.columns.topic': 'Rubrique',
    'agents.columns.health': 'État de fonctionnement',
    'agents.columns.lastHeartbeat': 'Dernière interrogation',
    'agents.filter.healthLabel': 'État de fonctionnement',
    'agents.filter.healthAll': 'Tous',
    'agents.filter.healthReady': 'Prêt',
    'agents.filter.healthCongested': 'Congestionné',
    'agents.filter.healthUnavailable': 'Non disponible',
    'agents.form.nameLabel': 'Nom *',
    'agents.form.namePlaceholder': 'par ex env-agent-west-1',
    'agents.form.nameHelper':
      'Identifiant unique (slug) — uniquement des lettres minuscules, des chiffres et des tirets',
    'agents.form.environmentLabel': 'Environnement *',
    'agents.form.environmentPlaceholder': 'par exemple la production',
    'agents.form.environmentHelper': "Étiquette environnementale pour l'agent",
    'agents.form.serviceTypesLabel': 'Types de services *',
    'agents.form.serviceTypesHelper':
      'Types de services que cet agent peut fournir',
    'agents.form.costLabel': 'Coût *',
    'agents.form.costHelper':
      'Pondération relative des coûts utilisée pour les décisions de placement',
    'agents.form.topicNameLabel': 'Nom du sujet *',
    'agents.form.topicNamePlaceholder':
      'par exemple dcm.agent.env-agent-ouest-1',
    'agents.form.topicNameHelper':
      'Nom du sujet NATS — doit commencer par dcm.agent.',
    'policies.emptyTitle': 'Aucune politique définie',
    'policies.emptyDescription':
      'Créez des politiques OPA Rego pour appliquer les règles de gouvernance aux ressources DCM. Les politiques peuvent être définies globalement ou par utilisateur.',
    'policies.createButton': 'Créer',
    'policies.entityLabel': 'Stratégies',
    'policies.createDialogTitle': 'Créer une stratégie',
    'policies.editDialogTitle': 'Modifier la stratégie',
    'policies.saveButton': 'Enregistrer',
    'policies.createSuccess': 'Politique créée.',
    'policies.updateSuccess': 'Politique mise à jour.',
    'policies.deleteSuccess': 'Politique supprimée.',
    'policies.deleteLabel': 'stratégie',
    'policies.enabledYes': 'Oui',
    'policies.enabledNo': 'Non',
    'policies.toggleDisable': 'Désactiver la politique',
    'policies.toggleEnable': 'Activer la politique',
    'policies.toggleDisableAria': 'Désactiver',
    'policies.toggleEnableAria': 'Activer',
    'policies.columns.displayName': 'Nom complet',
    'policies.columns.type': 'Type',
    'policies.columns.priority': 'Priorité',
    'policies.columns.enabled': 'Activé',
    'policies.columns.description': 'Description',
    'policies.form.displayNameLabel': "Nom d'affichage *",
    'policies.form.displayNameHelper':
      'Nom compréhensible par un humain pour cette politique',
    'policies.form.descriptionLabel': 'Description',
    'policies.form.descriptionHelper':
      "Facultatif — décrivez l'objectif de cette politique",
    'policies.form.policyTypeLabel': 'Type de police *',
    'policies.form.policyTypeGlobal':
      "GLOBAL — s'applique à toutes les demandes",
    'policies.form.policyTypeUser': "UTILISATEUR — s'applique par utilisateur",
    'policies.form.priorityLabel': 'Priorité *',
    'policies.form.priorityHelper':
      '1 (valeur maximale) – 1000 (valeur minimale), valeur par défaut 500 — doit être unique pour chaque type de police',
    'policies.form.regoCodeLabel': "Code d'immatriculation *",
    'policies.form.regoCodeHelper':
      "Politique d'inscription OPA évaluée par le responsable des placements.",
    'policies.form.regoCodePlaceholder': 'paquet dcm.placement',
    'policies.form.enabledLabel': 'Activé',
    'serviceTypes.emptyTitle': 'Aucun type de service défini',
    'serviceTypes.emptyDescription':
      'Les types de services définissent le schéma de modèle pour les éléments du catalogue.',
    'serviceTypes.cardTitle': 'Types de services ({{count}})',
    'serviceTypes.columns.serviceType': 'Type de service',
    'serviceTypes.columns.apiVersion': 'Version de l’API',
    'serviceTypes.columns.path': 'Chemin',
    'serviceTypes.columns.created': 'Créé',
    'catalogItems.emptyTitle': 'Aucun article de catalogue défini',
    'catalogItems.emptyDescription':
      'Les éléments du catalogue sont des modèles de service que les développeurs peuvent provisionner. Chaque élément du catalogue fait référence à un ou plusieurs types de services et définit les champs disponibles pour la personnalisation.',
    'catalogItems.createButton': 'Créer',
    'catalogItems.entityLabel': 'Éléments du catalogue',
    'catalogItems.createDrawerTitle': 'Créer un article de catalogue',
    'catalogItems.editDrawerTitle': "Modifier l'article du catalogue",
    'catalogItems.saveButton': 'Enregistrer',
    'catalogItems.createSuccess': 'Article de catalogue créé avec succès.',
    'catalogItems.updateSuccess':
      'Article du catalogue mis à jour avec succès.',
    'catalogItems.deleteSuccess': 'Article du catalogue supprimé avec succès.',
    'catalogItems.deleteLabel': 'article de catalogue',
    'catalogItems.columns.displayName': 'Nom complet',
    'catalogItems.columns.apiVersion': 'Version de l’API',
    'catalogItems.columns.resources': 'Ressources',
    'catalogItems.columns.fields': 'Champs',
    'catalogItems.columns.created': 'Créé',
    'catalogItems.fieldCount_one': '1 champ',
    'catalogItems.fieldCount_other': 'champs {{count}}',
    'catalogItems.resourceCount_one': '1 ressource',
    'catalogItems.resourceCount_other': '{{count}} ressources',
    'catalogItems.form.importButton': 'Importer depuis un fichier',
    'catalogItems.form.importTooltip':
      "Remplissez le formulaire à partir d'une définition d'élément de catalogue JSON ou YAML",
    'catalogItems.form.importError':
      "Échec de l'importation du fichier — vérifiez qu'il s'agit d'un fichier JSON ou YAML valide.",
    'catalogItems.form.displayNameLabel': "Nom d'affichage *",
    'catalogItems.form.displayNameHelper':
      'Nom lisible par un humain pour cet article de catalogue (63 caractères maximum)',
    'catalogItems.form.apiVersionLabel': "Version de l'API *",
    'catalogItems.form.apiVersionHelper':
      'Doit suivre le modèle v<number> [alpha|beta][nombre] — par exemple v1, v1alpha1',
    'catalogItems.form.serviceTypeLabel': 'Type de service *',
    'catalogItems.form.serviceTypeHelperEdit':
      'Le type de service ne peut pas être modifié après sa création.',
    'catalogItems.form.serviceTypeHelperNoTypes':
      'Aucun type de service disponible — créez-en un dans l’onglet Types de services',
    'catalogItems.form.serviceTypeHelperDefault':
      'Sélectionnez le type de service sur lequel cette ressource est basée.',
    'catalogItems.form.fieldsLabel': 'Champs *',
    'catalogItems.form.fieldsCaption': '(au moins un requis)',
    'catalogItems.form.fieldsErrorEmpty':
      'Ajoutez au moins un champ avec un chemin non vide.',
    'catalogItems.form.fieldAddButton': 'Ajouter un champ',
    'catalogItems.form.fieldAddTooltip':
      "Renseignez le chemin du dernier champ avant d'en ajouter un nouveau.",
    'catalogItems.form.fieldPathLabel': 'Chemin *',
    'catalogItems.form.fieldPathHelper': 'par ex config.replicas',
    'catalogItems.form.fieldDisplayNameLabel': 'Nom complet',
    'catalogItems.form.fieldEditableLabel': 'Modifiable',
    'catalogItems.form.fieldDefaultValueLabel': 'Valeur par défaut',
    'catalogItems.form.fieldDefaultValueHelper':
      'Toute valeur JSON — par ex 42, "hello", true, [1,2]',
    'catalogItems.form.fieldRemoveAriaLabel': 'Supprimer le champ',
    'catalogItems.form.schemaLabel': 'Schéma de validation',
    'catalogItems.form.schemaEditButton': 'Modifier le JSON',
    'catalogItems.form.schemaAddButton': 'Ajouter du JSON',
    'catalogItems.form.schemaDialogTitle': 'Schéma de validation',
    'catalogItems.form.schemaDialogHelper':
      'Objet JSON Schema — par exemple {"type":"integer","minimum":0}',
    'catalogItems.form.schemaDialogCancel': 'Annuler',
    'catalogItems.form.schemaDialogApply': 'Appliquer',
    'catalogItems.form.schemaMustBeObject':
      'Doit être un objet JSON, et non un tableau ou un type primitif.',
    'catalogItems.form.schemaInvalidJson': 'Syntaxe JSON invalide',
    'catalogItems.wizard.tabOverview': 'Vue d’ensemble',
    'catalogItems.wizard.tabApi': 'API',
    'catalogItems.wizard.tabResources': 'Ressources',
    'catalogItems.wizard.resourcesDescription':
      'Ajoutez une ou plusieurs ressources. Chaque ressource fait référence à un type de service et définit ses propres configurations de champs.',
    'catalogItems.wizard.resourcesRequired':
      'Au moins une ressource est requise.',
    'catalogItems.wizard.addResourceButton': 'Ajouter une ressource',
    'catalogItems.wizard.removeResource': 'Supprimer la ressource',
    'catalogItems.wizard.unnamedResource': '(anonyme)',
    'catalogItems.wizard.resourceNameLabel': 'Nom de la ressource *',
    'catalogItems.wizard.resourceNameHelper':
      'Identifiant unique au sein de cet élément de catalogue (par ex, app, ordersDb).',
    'catalogItems.wizard.requiresResourcesLabel': 'Nécessite des ressources',
    'catalogItems.wizard.requiresResourcesHelper':
      'Sélectionnez les autres ressources qui doivent être provisionnées avant celle-ci.',
    'catalogItems.wizard.apiVersionImmutable':
      "La version de l'API ne peut pas être modifiée après sa création.",
    'instances.emptyTitle': 'Aucune instance provisionnée',
    'instances.emptyDescription':
      "Les instances d'éléments de catalogue représentent des services provisionnés. Créez une instance à partir d'un élément de catalogue pour provisionner un service sur un agent d'environnement enregistré.",
    'instances.createButton': 'Créer',
    'instances.entityLabel': "instances d'éléments de catalogue",
    'instances.createDialogTitle': "Créer une instance d'élément de catalogue",
    'instances.rehydrateSuccess':
      "L'instance de l'élément de catalogue a été réhydratée.",
    'instances.deleteLabel': 'instance',
    'instances.rehydrateTooltip': 'Réhydrater',
    'instances.rehydrateAriaLabel': 'instance de réhydratation',
    'instances.deleteTooltip': 'Supprimer',
    'instances.deleteAriaLabel': "Supprimer l'instance",
    'instances.rehydrateDialogTitle': "Réhydrater l'instance ?",
    'instances.rehydrateDialogBody':
      'La réhydratation de {{instanceName}} permettra de reprovisionner la ressource et pourra lui attribuer un nouvel ID de ressource. Cette action est irréversible.',
    'instances.rehydrateDialogFallbackName': 'cette instance',
    'instances.rehydrateDialogCancel': 'Annuler',
    'instances.rehydrateDialogConfirm': 'Réhydrater',
    'instances.columns.displayName': 'Nom complet',
    'instances.columns.catalogItem': 'Article du catalogue',
    'instances.columns.resourceIds': 'Identifiants de ressources',
    'instances.columns.apiVersion': 'Version de l’API',
    'instances.columns.created': 'Créé',
    'instances.form.displayNameLabel': "Nom d'affichage *",
    'instances.form.displayNameHelper':
      'Nom lisible par un humain pour cette instance provisionnée (63 caractères maximum)',
    'instances.form.catalogItemLabel': 'Article du catalogue *',
    'instances.form.catalogItemSelect': 'Sélectionnez un article du catalogue…',
    'instances.form.catalogItemHelperNoItems':
      'Aucun article de catalogue disponible — créez-en un dans l’onglet Articles de catalogue',
    'instances.form.catalogItemHelperDefault':
      "Choisissez l'élément du catalogue pour provisionner une instance à partir de",
    'instances.form.apiVersionLabel': "Version de l'API *",
    'instances.form.apiVersionHelper':
      'Doit suivre le modèle v<number> [alpha|beta][nombre] — par exemple v1, v1alpha1',
    'instances.form.fieldValuesSection': 'Valeurs du champ',
    'instances.form.fieldValuesSectionHint':
      '(champs modifiables définis par cet élément de catalogue)',
    'instances.form.noEditableFields':
      'Cette ressource ne comporte aucun champ modifiable.',
    'instances.wizard.tabOverview': 'Vue d’ensemble',
    'resources.emptyTitle': 'Aucune ressource trouvée',
    'resources.emptyDescription':
      'Les instances de type de service provisionnées via DCM apparaîtront ici.',
    'resources.cardTitle': 'Ressources ({{count}})',
    'resources.columns.id': 'ID',
    'resources.columns.serviceType': 'Type de service',
    'resources.columns.provider': 'Fournisseur',
    'resources.columns.status': 'Statut',
    'resources.columns.created': 'Créé',
    'copyButton.copy': 'Copier',
    'copyButton.copied': 'Copié',
    'copyButton.failed': 'Échec de la copie',
    'copyButton.ariaLabel': 'Copier dans le Presse-papiers',
    'validation.agent.nameRequired': 'Le nom est requis.',
    'validation.agent.namePattern':
      "Seules les lettres minuscules, les chiffres et les traits d'union sont autorisés (doit commencer par une lettre).",
    'validation.agent.environmentRequired': "L'environnement est requis",
    'validation.agent.serviceTypesRequired':
      'Au moins un type de service est requis',
    'validation.agent.costRequired': 'Des frais sont requis',
    'validation.agent.topicNameRequired': 'Le nom du sujet est requis.',
    'validation.agent.topicNamePattern':
      'Le nom du sujet doit commencer par dcm.agent.',
    'validation.policy.displayNameRequired':
      "Le nom d'affichage est obligatoire.",
    'validation.policy.displayNameEmpty':
      "Le nom d'affichage ne peut pas être vide.",
    'validation.policy.displayNameMax':
      "Le nom d'affichage ne doit pas dépasser 255 caractères.",
    'validation.policy.descriptionMax':
      'La description ne doit pas dépasser 255 caractères.',
    'validation.policy.policyTypeRequired': 'Le type de police est requis.',
    'validation.policy.policyTypeOneOf': 'Doit être GLOBAL ou UTILISATEUR',
    'validation.policy.priorityType': 'La priorité doit être un nombre',
    'validation.policy.priorityRequired': 'La priorité est requise',
    'validation.policy.priorityInteger':
      'La priorité doit être un nombre entier.',
    'validation.policy.priorityMin': 'La priorité doit être au moins de 1',
    'validation.policy.priorityMax':
      'La priorité doit être au maximum de 1000.',
    'validation.policy.regoCodeRequired':
      "Le code d'immatriculation est requis.",
    'validation.policy.regoCodeEmpty':
      "Le code d'immatriculation ne peut pas être vide.",
    'validation.policy.regoCodePackage':
      'Doit contenir une déclaration de package — par exemple « package dcm.placement »',
    'validation.catalogItem.displayNameRequired':
      "Le nom d'affichage est obligatoire.",
    'validation.catalogItem.displayNameEmpty':
      "Le nom d'affichage ne peut pas être vide.",
    'validation.catalogItem.displayNameMax':
      "Le nom d'affichage ne doit pas dépasser 63 caractères.",
    'validation.catalogItem.apiVersionRequired':
      "La version de l'API est requise.",
    'validation.catalogItem.apiVersionPattern':
      'Doit suivre le modèle v<number>[alpha|beta][nombre] — par exemple v1, v1alpha1',
    'validation.catalogItem.serviceTypeRequired':
      'Le type de service est requis.',
    'validation.catalogItem.resourceNameRequired':
      'Le nom de la ressource est requis.',
    'validation.catalogItem.resourceNameDuplicate':
      "Le nom de la ressource doit être unique au sein de l'élément du catalogue.",
    'validation.catalogItem.resourceNamePattern':
      "Seules les lettres, les chiffres, les traits d'union et les tirets bas sont autorisés (doit commencer par une lettre).",
    'validation.catalogItem.requiresResourcesCycle':
      "Dépendance circulaire détectée — cette ressource dépend indirectement d'elle-même",
    'validation.catalogItem.resourcesRequired':
      'Au moins une ressource est nécessaire',
    'validation.catalogItem.duplicatePath':
      'Chemin dupliqué — les chemins doivent être uniques',
    'validation.catalogItem.invalidJson':
      'JSON invalide — corrigez la syntaxe ou utilisez une simple chaîne de caractères.',
    'validation.catalogItem.schemaMustBeObject':
      'Doit être un objet JSON — par exemple {"type":"integer"}',
    'validation.catalogItem.schemaMinMaxConflict':
      'La valeur minimale ({{min}}) ne doit pas dépasser la valeur maximale ({{max}}).',
    'validation.catalogItem.defaultBelowMin':
      'La valeur par défaut ({{value}}) est inférieure à la valeur minimale du schéma ({{min}}).',
    'validation.catalogItem.defaultAboveMax':
      'La valeur par défaut ({{value}}) dépasse la valeur maximale du schéma ({{max}})',
    'validation.catalogItem.schemaInvalidJson': 'Syntaxe JSON invalide',
    'validation.instance.displayNameRequired':
      "Le nom d'affichage est obligatoire.",
    'validation.instance.displayNameEmpty':
      "Le nom d'affichage ne peut pas être vide.",
    'validation.instance.displayNameMax':
      "Le nom d'affichage ne doit pas dépasser 63 caractères.",
    'validation.instance.catalogItemRequired':
      "L'article du catalogue est requis.",
    'validation.instance.apiVersionRequired':
      "La version de l'API est requise.",
    'validation.instance.apiVersionPattern':
      'Doit suivre le modèle v<number>[alpha|beta][nombre] — par exemple v1, v1alpha1',
    'validation.instance.fieldRequired': 'Ce champ est obligatoire',
    'validation.instance.fieldMustBeNumber': 'Doit être un numéro valide',
    'validation.instance.fieldMin': 'Doit être au moins {{min}}',
    'validation.instance.fieldMax': 'Doit être au maximum {{max}}',
  },
});

export default dcmTranslationFr;
