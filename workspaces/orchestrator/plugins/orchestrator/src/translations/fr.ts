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

import { orchestratorTranslationRef } from './ref';

/**
 * fr translation for plugin.orchestrator.
 * @public
 */
const orchestratorTranslationFr = createTranslationMessages({
  ref: orchestratorTranslationRef,
  messages: {
    'page.title': 'Orchestrateur de flux de travail',
    'page.tabs.workflows': 'Flux de travail',
    'page.tabs.allRuns': 'Toutes les exécutions',
    'page.tabs.workflowDetails': 'Détails du flux de travail',
    'page.tabs.workflowRuns': "Le flux de travail s'exécute",
    'table.title.workflows': 'Flux de travail',
    'table.title.allRuns': 'Toutes les courses ({{count}})',
    'table.title.allWorkflowRuns': 'Exécutions du workflow ({{count}})',
    'table.headers.name': 'Nom',
    'table.headers.runStatus': "État d'exécution",
    'table.headers.started': 'Commencé',
    'table.headers.status': 'Statut',
    'table.headers.workflowStatus': 'Statut du flux de travail',
    'table.headers.duration': 'Durée',
    'table.headers.description': 'Description',
    'table.headers.lastRun': 'Dernière course',
    'table.headers.lastRunStatus': 'Statut de la dernière exécution',
    'table.headers.workflowName': 'Nom du flux de travail',
    'table.actions.run': 'Exécution',
    'table.actions.viewRuns': 'Voir les exécutions',
    'table.actions.viewInputSchema': "Afficher le schéma d'entrée",
    'table.status.running': "En cours d'exécution",
    'table.status.failed': 'Échoué',
    'table.status.completed': 'Complété',
    'table.status.aborted': 'Avorté',
    'table.status.pending': 'En attente',
    'table.status.active': 'Actif',
    'table.filters.status': 'Statut',
    'table.filters.started': 'Commencé',
    'table.filters.startedOptions.today': "Aujourd'hui",
    'table.filters.startedOptions.yesterday': 'Hier',
    'table.filters.startedOptions.last7days': 'Les 7 derniers jours',
    'table.filters.startedOptions.thisMonth': 'Ce mois-ci',
    'workflow.details': 'Détails',
    'workflow.definition': 'Définition du flux de travail',
    'workflow.progress': 'Progression du flux de travail',
    'workflow.status.available': 'Disponible',
    'workflow.status.unavailable': 'Non disponible',
    'workflow.fields.workflow': 'Flux de travail',
    'workflow.fields.workflowStatus': 'Statut du flux de travail',
    'workflow.fields.runStatus': "État d'exécution",
    'workflow.fields.duration': 'Durée',
    'workflow.fields.description': 'Description',
    'workflow.fields.started': 'Commencé',
    'workflow.fields.workflowId': "ID d'exécution",
    'workflow.fields.workflowIdCopied':
      "ID d'exécution copié dans le presse-papiers",
    'workflow.errors.retriggerFailed': 'Échec du re-déclenchement : {{reason}}',
    'workflow.errors.abortFailed':
      "Échec de l'abandon : l'exécution a déjà été terminée.",
    'workflow.errors.abortFailedWithReason': "Échec de l'abandon : {{reason}}",
    'workflow.errors.failedToLoadDetails':
      "Échec du chargement des détails de l'ID de workflow : {{id}}",
    'workflow.messages.areYouSureYouWantToRunThisWorkflow':
      'Êtes-vous sûr de vouloir exécuter ce workflow ?',
    'workflow.messages.userNotAuthorizedExecute':
      "L'utilisateur n'est pas autorisé à exécuter le workflow.",
    'workflow.messages.workflowDown':
      "Le flux de travail est actuellement en panne ou dans un état d'erreur. L'exécuter maintenant peut échouer ou produire des résultats inattendus.",
    'workflow.buttons.run': 'Exécution',
    'workflow.buttons.runWorkflow': 'Exécuter le flux de travail',
    'workflow.buttons.runAgain': 'Courir à nouveau',
    'workflow.buttons.running': "En cours d'exécution",
    'workflow.buttons.fromFailurePoint': 'Du point de défaillance',
    'workflow.buttons.runFailedAgain': "L'exécution a échoué à nouveau",
    'run.title': 'Exécuter le flux de travail',
    'run.pageTitle': '{{processName}} exécuter',
    'run.variables': "Variables d'exécution",
    'run.inputs': 'Entrées',
    'run.results': 'Résultats',
    'run.logs.viewLogs': 'Voir les journaux',
    'run.logs.title': "Journaux d'exécution",
    'run.logs.noLogsAvailable':
      'Aucun journal disponible pour cette exécution de workflow.',
    'run.abort.title': "Abandonner l'exécution du workflow ?",
    'run.abort.button': 'Avorter',
    'run.abort.warning':
      "L'abandon arrêtera immédiatement toutes les étapes en cours et en attente. Tout travail en cours sera perdu.",
    'run.abort.completed.title': 'Exécution terminée',
    'run.abort.completed.message':
      "Il n'est pas possible d'interrompre l'exécution car elle est déjà terminée.",
    'run.status.completed': 'Exécution terminée',
    'run.status.failed': "L'exécution a échoué {{time}}",
    'run.status.failedAt': "L'exécution a échoué {{time}}",
    'run.status.aborted': "L'exécution a été interrompue",
    'run.status.completedWithMessage':
      'Exécution terminée {{time}} avec message',
    'run.status.completedAt': 'Exécution terminée {{time}}',
    'run.status.running':
      "Le flux de travail est en cours d'exécution. Démarré {{time}}",
    'run.status.runningWaitingAtNode':
      "Le workflow est en cours d'exécution – en attente au nœud {{node}} depuis {{formattedTime}}",
    'run.status.workflowIsRunning':
      "Le flux de travail est en cours d'exécution. Démarré {{time}}",
    'run.status.noAdditionalInfo':
      "Le flux de travail n'a fourni aucune information supplémentaire sur le statut.",
    'run.status.resultsWillBeDisplayedHereOnceTheRunIsComplete':
      "Les résultats seront affichés ici une fois l'exécution terminée.",
    'run.retrigger': 'Re-déclencher',
    'run.viewVariables': 'Afficher les variables',
    'run.suggestedNextWorkflow': 'Prochain flux de travail suggéré',
    'run.suggestedNextWorkflows': 'Prochains flux de travail suggérés',
    'tooltips.completed': 'Complété',
    'tooltips.active': 'Actif',
    'tooltips.aborted': 'Avorté',
    'tooltips.suspended': 'Suspendu',
    'tooltips.pending': 'En attente',
    'tooltips.workflowDown':
      "Le flux de travail est actuellement interrompu ou dans un état d'erreur",
    'tooltips.userNotAuthorizedAbort':
      "l'utilisateur n'est pas autorisé à interrompre le flux de travail",
    'tooltips.userNotAuthorizedExecute':
      'utilisateur non autorisé à exécuter le workflow',
    'messages.noDataAvailable': 'Aucune donnée disponible',
    'messages.noVariablesFound':
      'Aucune variable trouvée pour cette exécution.',
    'messages.noInputSchemaWorkflow':
      "Aucun schéma d'entrée n'est défini pour ce workflow.",
    'messages.workflowInstanceNoInputs':
      "L'instance de workflow n'a aucune entrée",
    'messages.missingJsonSchema.title':
      'Schéma JSON manquant pour le formulaire de saisie',
    'messages.missingJsonSchema.message':
      "Ce workflow n'a pas de schéma JSON défini pour la validation des entrées. Vous pouvez toujours exécuter le workflow, mais la validation des entrées sera limitée.",
    'messages.additionalDetailsAboutThisErrorAreNotAvailable':
      'Des détails supplémentaires sur cette erreur ne sont pas disponibles',
    'common.close': 'Fermer',
    'common.cancel': 'Annuler',
    'common.execute': 'Exécuter',
    'common.details': 'Détails',
    'common.links': 'Links',
    'common.values': 'Valeurs',
    'common.back': 'Retour',
    'common.run': 'Exécution',
    'common.next': 'Suivant',
    'common.review': 'Revue',
    'common.unavailable': '---',
    'common.goBack': 'Retour',
    'permissions.accessDenied': 'Accès refusé',
    'permissions.accessDeniedDescription':
      "Vous n'avez pas la permission de visualiser cette exécution de workflow.",
    'permissions.requiredPermission': 'Permission requise',
    'permissions.contactAdmin':
      'Veuillez contacter votre administrateur pour demander les permissions nécessaires.',
    'permissions.missingOwnership':
      "Cette exécution de workflow n'a pas d'informations de propriété enregistrées.",
    'permissions.notYourRun':
      'Cette exécution de workflow a été initiée par un autre utilisateur.',
    'duration.aFewSeconds': 'quelques secondes',
    'duration.aSecond': 'une seconde',
    'duration.seconds': '{{count}} secondes',
    'duration.aMinute': 'une minute',
    'duration.minutes': '{{count}} minutes',
    'duration.anHour': 'une heure',
    'duration.hours': '{{count}} heures',
    'duration.aDay': 'un jour',
    'duration.days': '{{count}} jours',
    'duration.aMonth': 'un mois',
    'duration.months': '{{count}} mois',
    'duration.aYear': 'un an',
    'duration.years': '{{count}} ans',
    'stepperObjectField.error':
      "Le champ d'objet Stepper n'est pas pris en charge pour les schémas qui ne contiennent pas de propriétés",
    'formDecorator.error':
      'Le décorateur de formulaire doit fournir des données contextuelles.',
    'aria.close': 'fermer',
  },
});

export default orchestratorTranslationFr;
