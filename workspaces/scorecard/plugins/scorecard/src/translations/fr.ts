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
    'metric.weightedStatusScoreCenterTooltipMaxLabel': 'Score maximal possible',
    'metric.weightedStatusScoreCenterTooltipTotalLabel': 'Score total',
    'metric.weightedStatusScoreCenterTooltipBreakdownRow_one':
      '{{status}}: {{count}} entity, score: {{score}}',
    'metric.weightedStatusScoreCenterTooltipBreakdownRow_other':
      '{{status}}: {{count}} entities, score: {{score}}',
    'metric.weightedStatusScoreLegendTooltipEntitiesEach_one':
      'Entité {{count}}, chaque {{score}}',
    'metric.weightedStatusScoreLegendTooltipEntitiesEach_other':
      '{{count}} entités, chacune {{score}}',
    'metric.weightedStatusScoreLegendTooltipRowTotal': 'Score total {{total}}',
    'metric.drillDownCalculationFailures':
      'Une ou plusieurs entités ont rencontré une erreur lors du calcul de cette métrique.',
    'metric.filecheck.description':
      'Vérifie si le fichier {{name}} existe dans le référentiel.',
    'metric.filecheck.title': 'Vérification du fichier : {{name}}',
    'metric.github.openPRs.description':
      "Nombre actuel de demandes d'extraction ouvertes pour un référentiel GitHub donné.",
    'metric.github.openPRs.title': 'GitHub pull requests ouvertes',
    'metric.homepageEntityCalculationHealth':
      '{{healthy}} / {{total}} entités sans erreurs de calcul de métrique',
    'metric.homepageEntityHealthRatio': '{{healthy}}/{{total}} entités',
    'metric.jira.openIssues.description':
      'Ce document met en évidence le nombre de problèmes critiques et bloquants actuellement ouverts dans Jira.',
    'metric.jira.openIssues.title': 'Tickets de blocage ouverts Jira',
    'metric.lastUpdated': 'Dernière mise à jour : {{timestamp}}',
    'metric.lastUpdatedNotAvailable': 'Dernière mise à jour : Non disponible',
    'metric.someEntitiesNotReportingValues':
      'Certaines entités ne communiquent pas les valeurs relatives à cet indicateur.',
    'metric.sonarqube.codeCoverage.description':
      'Pourcentage global de couverture de code dans SonarQube.',
    'metric.sonarqube.codeCoverage.title': 'Couverture de code SonarQube',
    'metric.sonarqube.codeDuplications.description':
      'Pourcentage de lignes dupliquées dans SonarQube.',
    'metric.sonarqube.codeDuplications.title': 'Duplications de code SonarQube',
    'metric.sonarqube.maintainabilityIssues.description':
      "Nombre d'anomalies de code ouvert dans SonarQube.",
    'metric.sonarqube.maintainabilityIssues.title':
      'Problèmes de maintenabilité de SonarQube',
    'metric.sonarqube.maintainabilityRating.description':
      'Évaluation de la maintenabilité de SonarQube.',
    'metric.sonarqube.maintainabilityRating.title':
      'Évaluation de la maintenabilité de SonarQube',
    'metric.sonarqube.openIssues.description':
      'Nombre de problèmes ouverts (OUVERTS, CONFIRMÉS, RÉOUVERTS) dans SonarQube.',
    'metric.sonarqube.openIssues.title': 'Problèmes ouverts de SonarQube',
    'metric.sonarqube.qualityGate.description':
      'Si le projet réussit le contrôle qualité SonarQube.',
    'metric.sonarqube.qualityGate.title': 'État du seuil de qualité SonarQube',
    'metric.sonarqube.reliabilityIssues.description':
      'Nombre de bogues ouverts dans SonarQube.',
    'metric.sonarqube.reliabilityIssues.title':
      'Problèmes de fiabilité de SonarQube',
    'metric.sonarqube.reliabilityRating.description':
      'Évaluation de la fiabilité de SonarQube.',
    'metric.sonarqube.reliabilityRating.title':
      'Évaluation de la fiabilité de SonarQube',
    'metric.sonarqube.securityHotspots.description':
      'Nombre de points chauds de sécurité à examiner dans SonarQube.',
    'metric.sonarqube.securityHotspots.title':
      "Points d'accès de sécurité SonarQube",
    'metric.sonarqube.securityIssues.description':
      'Nombre de failles de sécurité ouvertes dans SonarQube.',
    'metric.sonarqube.securityIssues.title':
      'Problèmes de sécurité de SonarQube',
    'metric.sonarqube.securityRating.description':
      'Évaluation de sécurité de SonarQube.',
    'metric.sonarqube.securityRating.title':
      'Évaluation de sécurité de SonarQube',
    'metric.sonarqube.securityReviewRating.description':
      'Évaluation de la sécurité de SonarQube.',
    'metric.sonarqube.securityReviewRating.title':
      'Évaluation de la sécurité de SonarQube',
    'metricGroupCard.menuAriaLabel': "Plus d'options",
    'metricGroupCard.viewDataSources': 'Voir les sources',
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
