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
import { scorecardTranslationRef } from './ref';

/**
 * fr translation for plugin.scorecard.
 * @public
 */
const scorecardTranslationFr = createTranslationMessages({
  ref: scorecardTranslationRef,
  messages: {
    'common.loading': 'Chargement',
    'dataSourcesDialog.title': '{{title}} sources',
    'dataSourcesDialog.close': 'Fermer',
    'dataSourcesDialog.unknownPlugin': 'Inconnu',
    'dataSourcesDialog.statusTooltip':
      'Valeur {{value}} correspond au seuil {{status}} {{expression}}',
    'dataSourcesDialog.columns.plugin': 'PLUGIN',
    'dataSourcesDialog.columns.check': 'VÉRIFICATION',
    'dataSourcesDialog.columns.value': 'VALEUR',
    'dataSourcesDialog.columns.status': 'STATUT',
    'dataSourcesDialog.columns.lastSynced': 'DERNIÈRE SYNCHRONISATION',
    'emptyState.altText': 'Pas de tableaux de score',
    'emptyState.button': 'Afficher la documentation',
    'emptyState.description':
      "Les tableaux de bord vous permettent de surveiller l'état des composants en un coup d'œil. Pour commencer, consultez notre documentation pour obtenir des instructions d'installation.",
    'emptyState.title': 'Aucune fiche de score ajoutée pour le moment',
    'entitiesPage.entitiesTable.footer.allRows': 'Toutes les lignes',
    'entitiesPage.entitiesTable.footer.of': 'sur',
    'entitiesPage.entitiesTable.footer.rows_one': '{{count}} ligne',
    'entitiesPage.entitiesTable.footer.rows_other': '{{count}} lignes',
    'entitiesPage.entitiesTable.header.entity': 'Entité',
    'entitiesPage.entitiesTable.header.kind': 'Type',
    'entitiesPage.entitiesTable.header.lastUpdated': 'Dernière mise à jour',
    'entitiesPage.entitiesTable.header.owner': 'Propriétaire',
    'entitiesPage.entitiesTable.header.status': 'Statut',
    'entitiesPage.entitiesTable.header.value': 'Valeur',
    'entitiesPage.entitiesTable.title': 'Entités',
    'entitiesPage.entitiesTable.titleWithCount': 'Entités ({{count}})',
    'entitiesPage.entitiesTable.unavailable': 'Non disponible',
    'entitiesPage.metricProviderNotRegistered':
      "Le fournisseur de métriques avec l'ID {{metricId}} n'est pas enregistré.",
    'entitiesPage.missingPermission':
      "Pour consulter les indicateurs du tableau de bord, votre administrateur doit vous accorder l'autorisation requise.",
    'entitiesPage.noDataFound':
      'Pour que vos données apparaissent ici, vérifiez que vos entités communiquent bien des valeurs relatives à cette métrique.',
    'entitiesPage.unknownMetric': 'Métrique inconnue',
    'errors.authenticationError': 'Erreur d’authentification',
    'errors.authenticationErrorMessage':
      'Veuillez vous connecter pour consulter vos données.',
    'errors.entityMissingProperties':
      'Entité ne possédant pas les propriétés requises pour la recherche dans le tableau de bord.',
    'errors.fetchError':
      'Erreur lors de la récupération des fiches de score : {{error}}',
    'errors.invalidApiResponse':
      "Format de réponse invalide de l'API de scorecard",
    'errors.invalidThresholds': 'Seuils invalides',
    'errors.metricDataUnavailable': 'Données métriques indisponibles',
    'errors.missingAggregationId':
      "Tableau de bord mal configuré, l'identifiant d'agrégation (ou l'identifiant de la métrique) n'est pas fourni.",
    'errors.missingPermission': 'Autorisation manquante',
    'errors.missingPermissionMessage':
      "Pour consulter les indicateurs du tableau de bord, votre administrateur doit vous accorder l'autorisation requise.",
    'errors.noDataFound': 'Aucune donnée trouvée',
    'errors.noDataFoundMessage':
      'Pour que vos données apparaissent ici, vérifiez que vos entités communiquent bien des valeurs relatives à cette métrique.',
    'errors.unsupportedAggregationType':
      "Ce tableau de bord utilise un type d'agrégation qui n'est pas pris en charge par cette version du plugin.",
    'errors.userNotFoundInCatalogMessage':
      'Entité utilisateur introuvable dans le catalogue.',
    'metricGroupCard.menuAriaLabel': "Plus d'options",
    'metricGroupCard.viewDataSources': 'Voir les sources',
    'metric.averageCenterTooltipMaxLabel': 'Score maximal possible',
    'metric.averageCenterTooltipTotalLabel': 'Score total',
    'metric.averageCenterTooltipBreakdownRow_one':
      '{{status}}: {{count}} entity, score: {{score}}',
    'metric.averageCenterTooltipBreakdownRow_other':
      '{{status}}: {{count}} entities, score: {{score}}',
    'metric.averageLegendTooltipEntitiesEach_one':
      'Entité {{count}}, chaque {{score}}',
    'metric.averageLegendTooltipEntitiesEach_other':
      '{{count}} entités, chacune {{score}}',
    'metric.averageLegendTooltipRowTotal': 'Score total {{total}}',
    'metric.drillDownCalculationFailures':
      'Une ou plusieurs entités ont rencontré une erreur lors du calcul de cette métrique.',
    'metric.filecheck.description':
      'Vérifie si le fichier {{name}} existe dans le référentiel.',
    'metric.filecheck.title': 'Vérification du fichier : {{name}}',
    'metric.github.open_prs.description':
      "Nombre actuel de demandes d'extraction ouvertes pour un référentiel GitHub donné.",
    'metric.github.open_prs.title': 'GitHub pull requests ouvertes',
    'metric.homepageEntityCalculationHealth':
      '{{healthy}} / {{total}} entités sans erreurs de calcul de métrique',
    'metric.homepageEntityHealthRatio': '{{healthy}}/{{total}} entités',
    'metric.jira.open_issues.description':
      'Ce document met en évidence le nombre de problèmes critiques et bloquants actuellement ouverts dans Jira.',
    'metric.jira.open_issues.title': 'Tickets de blocage ouverts Jira',
    'metric.lastUpdated': 'Dernière mise à jour : {{timestamp}}',
    'metric.lastUpdatedNotAvailable': 'Dernière mise à jour : Non disponible',
    'metric.someEntitiesNotReportingValues':
      'Certaines entités ne communiquent pas les valeurs relatives à cet indicateur.',
    'metric.sonarqube.code_coverage.description':
      'Pourcentage global de couverture de code dans SonarQube.',
    'metric.sonarqube.code_coverage.title': 'Couverture de code SonarQube',
    'metric.sonarqube.code_duplications.description':
      'Pourcentage de lignes dupliquées dans SonarQube.',
    'metric.sonarqube.code_duplications.title':
      'Duplications de code SonarQube',
    'metric.sonarqube.maintainability_issues.description':
      "Nombre d'anomalies de code ouvert dans SonarQube.",
    'metric.sonarqube.maintainability_issues.title':
      'Problèmes de maintenabilité de SonarQube',
    'metric.sonarqube.maintainability_rating.description':
      'Évaluation de la maintenabilité de SonarQube.',
    'metric.sonarqube.maintainability_rating.title':
      'Évaluation de la maintenabilité de SonarQube',
    'metric.sonarqube.open_issues.description':
      'Nombre de problèmes ouverts (OUVERTS, CONFIRMÉS, RÉOUVERTS) dans SonarQube.',
    'metric.sonarqube.open_issues.title': 'Problèmes ouverts de SonarQube',
    'metric.sonarqube.quality_gate.description':
      'Si le projet réussit le contrôle qualité SonarQube.',
    'metric.sonarqube.quality_gate.title': 'État du seuil de qualité SonarQube',
    'metric.sonarqube.reliability_issues.description':
      'Nombre de bogues ouverts dans SonarQube.',
    'metric.sonarqube.reliability_issues.title':
      'Problèmes de fiabilité de SonarQube',
    'metric.sonarqube.reliability_rating.description':
      'Évaluation de la fiabilité de SonarQube.',
    'metric.sonarqube.reliability_rating.title':
      'Évaluation de la fiabilité de SonarQube',
    'metric.sonarqube.security_hotspots.description':
      'Nombre de points chauds de sécurité à examiner dans SonarQube.',
    'metric.sonarqube.security_hotspots.title':
      "Points d'accès de sécurité SonarQube",
    'metric.sonarqube.security_issues.description':
      'Nombre de failles de sécurité ouvertes dans SonarQube.',
    'metric.sonarqube.security_issues.title':
      'Problèmes de sécurité de SonarQube',
    'metric.sonarqube.security_rating.description':
      'Évaluation de sécurité de SonarQube.',
    'metric.sonarqube.security_rating.title':
      'Évaluation de sécurité de SonarQube',
    'metric.sonarqube.security_review_rating.description':
      'Évaluation de la sécurité de SonarQube.',
    'metric.sonarqube.security_review_rating.title':
      'Évaluation de la sécurité de SonarQube',
    'notFound.altText': 'Page introuvable',
    'notFound.contactSupport': "Contactez l'assistance",
    'notFound.description':
      "Essayez d'ajouter un fichier {{indexFile}} à la racine du répertoire docs de ce référentiel.",
    'notFound.goBack': 'Retour',
    'notFound.readMore': 'En savoir plus',
    'notFound.title': "Nous n'avons pas pu trouver cette page.",
    'permissionRequired.altText': 'Autorisation requise',
    'permissionRequired.button': 'En savoir plus',
    'permissionRequired.description':
      "Pour afficher le plugin Scorecard, contactez votre administrateur pour lui accorder l'autorisation {{permission}}.",
    'permissionRequired.title': 'Autorisation manquante',
    'thresholds.entities_one': 'entité {{count}}',
    'thresholds.entities_other': '{{count}} entités',
    'thresholds.error': 'Erreur',
    'thresholds.exist': 'Exister',
    'thresholds.missing': 'Manquant',
    'thresholds.noEntities': "Aucune entité dans l'état {{category}}",
    'thresholds.success': 'Succès',
    'thresholds.warning': 'Avertissement',
  },
});

export default scorecardTranslationFr;
