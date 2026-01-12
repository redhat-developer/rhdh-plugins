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

const orchestratorTranslationFr = createTranslationMessages({
  ref: orchestratorTranslationRef,
  messages: {
    'page.title': 'Orchestrateur de Workflows',
    'page.tabs.workflows': 'Workflows',
    'page.tabs.allRuns': 'Toutes les exécutions',
    'page.tabs.workflowDetails': 'Détails du workflow',
    'page.tabs.workflowRuns': 'Exécutions de workflow',
    'table.title.workflows': 'Workflows',
    'table.title.allRuns': 'Toutes les exécutions ({{count}})',
    'table.title.allWorkflowRuns': 'Exécutions de workflow ({{count}})',
    'table.headers.name': 'Nom',
    'table.headers.runStatus': "Statut d'exécution",
    'table.headers.started': 'Démarré',
    'table.headers.status': 'Statut',
    'table.headers.lastRun': 'Dernière exécution',
    'table.headers.lastRunStatus': 'Statut de la dernière exécution',
    'table.headers.workflowStatus': 'Statut du workflow',
    'table.headers.duration': 'Durée',
    'table.headers.description': 'Description',
    'table.headers.workflowName': 'Nom du workflow',
    'table.actions.run': 'Exécuter',
    'table.actions.viewRuns': 'Voir les exécutions',
    'table.actions.viewInputSchema': "Voir le schéma d'entrée",
    'table.status.running': 'En cours',
    'table.status.failed': 'Échoué',
    'table.status.completed': 'Terminé',
    'table.status.aborted': 'Interrompu',
    'table.status.pending': 'En attente',
    'table.status.active': 'Actif',
    'table.filters.status': 'Statut',
    'table.filters.started': 'Démarré',
    'table.filters.startedOptions.today': "Aujourd'hui",
    'table.filters.startedOptions.yesterday': 'Hier',
    'table.filters.startedOptions.last7days': 'Les 7 derniers jours',
    'table.filters.startedOptions.thisMonth': 'Ce mois',
    'workflow.details': 'Détails',
    'workflow.definition': 'Définition du workflow',
    'workflow.progress': 'Progression du workflow',
    'workflow.status.available': 'Disponible',
    'workflow.status.unavailable': 'Indisponible',
    'workflow.fields.workflow': 'Workflow',
    'workflow.fields.workflowStatus': 'Statut du workflow',
    'workflow.fields.runStatus': "Statut d'exécution",
    'workflow.fields.duration': 'Durée',
    'workflow.fields.description': 'Description',
    'workflow.fields.started': 'Démarré',
    'workflow.errors.retriggerFailed': 'Redéclenchement échoué: {{reason}}',
    'workflow.fields.workflowId': "ID d'exécution",
    'workflow.fields.workflowIdCopied':
      "ID d'exécution copié dans le presse-papiers",
    'workflow.errors.abortFailed':
      "Interruption échouée: L'exécution a déjà été terminée.",
    'workflow.errors.abortFailedWithReason': 'Interruption échouée: {{reason}}',
    'workflow.errors.failedToLoadDetails':
      "Impossible de charger les détails pour l'ID du workflow: {{id}}",
    'workflow.messages.areYouSureYouWantToRunThisWorkflow':
      'Voulez-vous vraiment exécuter ce workflow ?',
    'workflow.buttons.run': 'Exécuter',
    'workflow.buttons.runWorkflow': 'Exécuter le workflow',
    'workflow.buttons.runAgain': 'Exécuter à nouveau',
    'workflow.buttons.running': 'En cours...',
    'workflow.buttons.fromFailurePoint': 'À partir du point de défaillance',
    'workflow.buttons.runFailedAgain': 'Redéclenchement échoué',
    'run.title': 'Exécuter le workflow',
    'run.pageTitle': '{{processName}} exécution',
    'run.variables': "Variables d'exécution",
    'run.inputs': 'Entrées',
    'run.results': 'Résultats',
    'run.logs.viewLogs': 'Voir les journaux',
    'run.logs.title': "Journaux d'exécution",
    'run.logs.noLogsAvailable':
      'Aucun journal disponible pour cette exécution de workflow.',
    'run.abort.title': "Interrompre l'exécution du workflow ?",
    'run.abort.button': 'Interrompre',
    'run.abort.warning':
      "L'interruption arrêtera immédiatement toutes les étapes en cours et en attente. Tout travail en cours sera perdu.",
    'run.abort.completed.title': 'Exécution terminée',
    'run.abort.completed.message':
      "Il n'est pas possible d'interrompre l'exécution car elle a déjà été terminée.",
    'run.status.completed': 'Exécution terminée',
    'run.status.failed': "L'exécution a échoué {{time}}",
    'run.status.aborted': "L'exécution a été interrompue",
    'run.status.completedWithMessage':
      'Exécution terminée {{time}} avec message',
    'run.status.completedAt': 'Exécution terminée {{time}}',
    'run.status.running':
      "Le workflow est en cours d'exécution. Démarré {{time}}",
    'run.status.runningWaitingAtNode':
      "Le workflow est en cours d'exécution - en attente au nœud {{node}} depuis {{formattedTime}}",
    'run.status.workflowIsRunning':
      "Le workflow est en cours d'exécution. Démarré {{time}}",
    'run.status.noAdditionalInfo':
      "Le workflow n'a pas fourni d'informations supplémentaires sur le statut.",
    'run.status.resultsWillBeDisplayedHereOnceTheRunIsComplete':
      "Les résultats seront affichés ici une fois que l'exécution sera terminée.",
    'run.retrigger': 'Redéclencher',
    'run.viewVariables': 'Voir les variables',
    'run.suggestedNextWorkflow': 'Workflow suggéré suivant',
    'run.suggestedNextWorkflows': 'Workflows suggérés suivants',
    'tooltips.completed': 'Terminé',
    'tooltips.active': 'Actif',
    'tooltips.aborted': 'Interrompu',
    'tooltips.suspended': 'Suspendu',
    'tooltips.pending': 'En attente',
    'tooltips.workflowDown':
      "Le workflow est actuellement indisponible ou dans un état d'erreur",
    'tooltips.userNotAuthorizedAbort':
      'utilisateur non autorisé à interrompre le workflow',
    'tooltips.userNotAuthorizedExecute':
      'utilisateur non autorisé à exécuter le workflow',
    'messages.noDataAvailable': 'Aucune donnée disponible',
    'messages.noVariablesFound':
      'Aucune variable trouvée pour cette exécution.',
    'messages.noInputSchemaWorkflow':
      "Aucun schéma d'entrée n'est défini pour ce workflow.",
    'messages.workflowInstanceNoInputs':
      "L'instance de workflow n'a pas d'entrées",
    'messages.missingJsonSchema.title':
      "Schéma JSON manquant pour le formulaire d'entrée",
    'messages.missingJsonSchema.message':
      "Ce workflow n'a pas de schéma JSON défini pour la validation des entrées. Vous pouvez toujours exécuter le workflow, mais la validation des entrées sera limitée.",
    'messages.additionalDetailsAboutThisErrorAreNotAvailable':
      "Aucune information supplémentaire sur cet erreur n'est disponible",
    'reviewStep.hiddenFieldsNote':
      "Certains champs sont masqués sur cette page mais seront inclus dans la demande d'exécution du workflow.",
    'common.close': 'Fermer',
    'common.cancel': 'Annuler',
    'common.execute': 'Exécuter',
    'common.details': 'Détails',
    'common.links': 'Liens',
    'common.values': 'Valeurs',
    'common.unavailable': '---',
    'common.back': 'Retour',
    'common.run': 'Exécuter',
    'common.next': 'Suivant',
    'common.review': 'Réviser',
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
      "Le champ de l'objet du stepper n'est pas compatible avec les schémas qui ne contiennent pas de propriétés",
    'formDecorator.error':
      'Le décorateur de formulaire doit fournir des données de contexte.',
    'aria.close': 'fermer',
  },
});

export default orchestratorTranslationFr;
