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
    'page.tabs.allRuns': 'Tous les parcours',
    'page.tabs.workflowDetails': 'Détails du flux de travail',
    'page.tabs.workflowRuns': "Le flux de travail s'exécute",
    'table.title.workflows': 'Flux de travail',
    'table.title.allRuns': 'Toutes les exécutions ({{count}})',
    'table.actions.run': 'Exécuter',
    'table.actions.runAsEvent': 'Organiser un événement',
    'table.actions.viewRuns': 'Afficher les parcours',
    'table.actions.viewInputSchema': "Schéma d'entrée du schéma de vue",
    'table.status.running': 'En cours d’exécution',
    'table.status.failed': 'Ayant échoué',
    'table.status.completed': 'Terminé',
    'table.status.aborted': 'Avorté',
    'table.status.pending': 'En attente',
    'table.status.active': 'Actif',
    'table.filters.status': 'Statut',
    'table.filters.started': 'Démarré',
    'table.filters.startedOptions.today': "Aujourd'hui",
    'table.filters.startedOptions.yesterday': 'Hier',
    'table.filters.startedOptions.last7days': 'Les 7 derniers jours',
    'table.filters.startedOptions.thisMonth': 'Ce mois-ci',
    'workflow.details': 'Détails',
    'workflow.definition': 'Définition du flux de travail',
    'workflow.progress': 'Avancement du flux de travail',
    'workflow.status.available': 'Disponible',
    'workflow.status.unavailable': 'Non disponible',
    'workflow.fields.workflow': 'Flux de travail',
    'workflow.fields.workflowStatus': 'État du flux de travail',
    'workflow.fields.runStatus': "État d'exécution",
    'workflow.fields.duration': 'Durée',
    'workflow.fields.description': 'Description',
    'workflow.fields.started': 'Démarré',
    'workflow.fields.workflowId': "ID d'exécution",
    'workflow.fields.workflowIdCopied':
      "L'identifiant de l'exécution a été copié dans le presse-papiers.",
    'workflow.fields.version': 'Version',
    'workflow.errors.retriggerFailed': 'Échec du redéclenchement : {{reason}}',
    'workflow.errors.abortFailedWithReason': "L'abandon a échoué : {{reason}}",
    'run.title': 'Exécuter le flux de travail',
    'run.pageTitle': '{{processName}} exécuter',
    'run.variables': "Variables d'exécution",
    'run.inputs': 'Entrées',
    'run.results': 'Résultats',
    'run.logs.viewLogs': 'Afficher les journaux',
    'run.logs.title': "journaux d'exécution",
    'run.logs.noLogsAvailable':
      "Aucun journal n'est disponible pour cette exécution de workflow.",
    'run.abort.title': "Interrompre l'exécution du flux de travail ?",
    'run.abort.button': 'Avorter',
    'run.abort.warning':
      "L'interruption de la procédure mettra immédiatement fin à toutes les étapes en cours et en attente. Tout travail en cours sera perdu.",
    'run.abort.completed.title': 'Exécution terminée',
    'run.abort.completed.message':
      "Il n'est pas possible d'interrompre l'exécution car elle est déjà terminée.",
    'run.status.completed': 'Exécution terminée',
    'run.status.failed': "L'exécution a échoué {{time}}",
    'run.status.completedWithMessage':
      'Exécution terminée {{time}} avec le message',
    'run.status.failedAt': "L'exécution a échoué {{time}}",
    'run.viewVariables': 'Afficher les variables',
    'run.suggestedNextWorkflow': 'Flux de travail suivant suggéré',
    'run.suggestedNextWorkflows': 'Flux de travail suivants suggérés',
    'tooltips.completed': 'Terminé',
    'tooltips.active': 'Actif',
    'tooltips.aborted': 'Avorté',
    'tooltips.suspended': 'Suspendu',
    'tooltips.pending': 'En attente',
    'tooltips.workflowDown':
      "Le flux de travail est actuellement indisponible ou en état d'erreur.",
    'tooltips.userNotAuthorizedAbort':
      "L'utilisateur n'est pas autorisé à interrompre le flux de travail.",
    'tooltips.userNotAuthorizedExecute':
      "L'utilisateur n'est pas autorisé à exécuter le flux de travail.",
    'messages.noDataAvailable': 'Pas de données disponibles',
    'messages.noVariablesFound':
      'Aucune variable trouvée pour cette exécution.',
    'messages.noInputSchemaWorkflow':
      "Aucun schéma d'entrée n'est défini pour ce flux de travail.",
    'messages.workflowInstanceNoInputs':
      "L'instance de flux de travail ne comporte aucune entrée.",
    'messages.missingJsonSchema.title':
      'Schéma JSON manquant pour le formulaire de saisie',
    'messages.missingJsonSchema.message':
      'Ce flux de travail ne possède pas de schéma JSON défini pour la validation des entrées. Vous pouvez toujours exécuter le flux de travail, mais la validation des entrées sera limitée.',
    'reviewStep.hiddenFieldsNote':
      'Certains paramètres sont masqués sur cette page.',
    'reviewStep.showHiddenParameters': 'Afficher les paramètres cachés',
    'common.close': 'Fermer',
    'common.cancel': 'Annuler',
    'common.execute': 'Exécuter',
    'common.details': 'Détails',
    'common.links': 'Liens',
    'common.values': 'Valeurs',
    'common.back': 'Précédent',
    'common.run': 'Exécuter',
    'common.next': 'Suivant',
    'common.review': 'Vérifier',
    'common.unavailable': '---',
    'common.goBack': 'Retour',
    'permissions.accessDenied': 'Accès refusé',
    'permissions.accessDeniedDescription':
      "Vous n'êtes pas autorisé à visualiser l'exécution de ce flux de travail.",
    'permissions.requiredPermission': 'Autorisation requise',
    'permissions.contactAdmin':
      'Veuillez contacter votre administrateur pour demander les autorisations nécessaires.',
    'permissions.missingOwnership':
      "Cette exécution de flux de travail ne comporte pas d'informations de propriété enregistrées.",
    'permissions.notYourRun':
      'Cette exécution de flux de travail a été initiée par un autre utilisateur.',
    'duration.aFewSeconds': 'quelques secondes',
    'duration.aSecond': 'une seconde',
    'duration.seconds': '{{count}} secondes',
    'duration.aMinute': 'une minute',
    'duration.minutes': '{{count}} minutes',
    'duration.anHour': 'une heure',
    'duration.hours': '{{count}} heures',
    'duration.aDay': 'une journée',
    'duration.days': '{{count}} jours',
    'duration.aMonth': 'un mois',
    'duration.months': '{{count}} mois',
    'duration.aYear': 'une année',
    'duration.years': '{{count}} années',
    'alerts.duplicateWorkflowIds.message':
      'Plusieurs flux de travail avec le même identifiant ont été détectés. Veuillez vous assurer que des identifiants uniques sont utilisés dans les différentes versions.',
    'alerts.duplicateWorkflowIds.learnMore': 'En savoir plus',
    'stepperObjectField.error':
      "Le champ d'objet Stepper n'est pas pris en charge pour les schémas ne contenant pas de propriétés.",
    'formDecorator.error':
      'Le décorateur de formulaire doit fournir des données de contexte.',
    'aria.close': 'fermer',
  },
});

export default orchestratorTranslationFr;
