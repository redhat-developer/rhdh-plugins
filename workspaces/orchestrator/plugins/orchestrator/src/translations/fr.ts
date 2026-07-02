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
    'alerts.duplicateWorkflowIds.learnMore': 'En savoir plus',
    'alerts.duplicateWorkflowIds.message':
      'Plusieurs flux de travail avec le même identifiant ont été détectés. Veuillez vous assurer que des identifiants uniques sont utilisés dans les différentes versions.',
    'aria.close': 'fermer',
    'common.back': 'Précédent',
    'common.cancel': 'Annuler',
    'common.close': 'Fermer',
    'common.details': 'Détails',
    'common.execute': 'Exécuter',
    'common.goBack': 'Retour',
    'common.links': 'Liens',
    'common.next': 'Suivant',
    'common.review': 'Vérifier',
    'common.run': 'Exécuter',
    'common.unavailable': '---',
    'common.values': 'Valeurs',
    'duration.aDay': 'une journée',
    'duration.aFewSeconds': 'quelques secondes',
    'duration.aMinute': 'une minute',
    'duration.aMonth': 'un mois',
    'duration.aSecond': 'une seconde',
    'duration.aYear': 'une année',
    'duration.anHour': 'une heure',
    'duration.days': '{{count}} jours',
    'duration.hours': '{{count}} heures',
    'duration.minutes': '{{count}} minutes',
    'duration.months': '{{count}} mois',
    'duration.seconds': '{{count}} secondes',
    'duration.years': '{{count}} années',
    'emptyState.illustrationAlt':
      'Illustration sans flux de travail ni exécutions',
    'emptyState.runs.description':
      'Les exécutions de flux de travail apparaîtront ici une fois les flux exécutés.',
    'emptyState.runs.runWorkflow': 'Exécuter un flux de travail',
    'emptyState.runs.title': 'Aucune exécution pour le moment',
    'emptyState.workflows.description':
      'Pour commencer, ajoutez un nouveau flux de travail.',
    'emptyState.workflows.title': 'Aucun flux de travail ajouté pour le moment',
    'emptyState.workflows.viewDocumentation': 'Voir la documentation',
    'formDecorator.error':
      'Le décorateur de formulaire doit fournir des données de contexte.',
    'messages.additionalDetailsAboutThisErrorAreNotAvailable':
      'Des détails supplémentaires concernant cette erreur ne sont pas disponibles.',
    'messages.missingJsonSchema.message':
      'Ce flux de travail ne possède pas de schéma JSON défini pour la validation des entrées. Vous pouvez toujours exécuter le flux de travail, mais la validation des entrées sera limitée.',
    'messages.missingJsonSchema.title':
      'Schéma JSON manquant pour le formulaire de saisie',
    'messages.noDataAvailable': 'Pas de données disponibles',
    'messages.noInputSchemaWorkflow':
      "Aucun schéma d'entrée n'est défini pour ce flux de travail.",
    'messages.noVariablesFound':
      'Aucune variable trouvée pour cette exécution.',
    'messages.workflowInstanceNoInputs':
      "L'instance de flux de travail ne comporte aucune entrée.",
    'page.tabs.allRuns': 'Tous les parcours',
    'page.tabs.workflowDetails': 'Détails du flux de travail',
    'page.tabs.workflowRuns': "Le flux de travail s'exécute",
    'page.tabs.workflows': 'Flux de travail',
    'page.title': 'Orchestrateur de flux de travail',
    'permissions.accessDenied': 'Accès refusé',
    'permissions.accessDeniedDescription':
      "Vous n'êtes pas autorisé à visualiser l'exécution de ce flux de travail.",
    'permissions.contactAdmin':
      'Veuillez contacter votre administrateur pour demander les autorisations nécessaires.',
    'permissions.missingOwnership':
      "Cette exécution de flux de travail ne comporte pas d'informations de propriété enregistrées.",
    'permissions.notYourRun':
      'Cette exécution de flux de travail a été initiée par un autre utilisateur.',
    'permissions.requiredPermission': 'Autorisation requise',
    'reviewStep.hiddenFieldsNote':
      'Certains paramètres sont masqués sur cette page.',
    'reviewStep.showHiddenParameters': 'Afficher les paramètres cachés',
    'run.abort.button': 'Avorter',
    'run.abort.completed.message':
      "Il n'est pas possible d'interrompre l'exécution car elle est déjà terminée.",
    'run.abort.completed.title': 'Exécution terminée',
    'run.abort.title': "Interrompre l'exécution du flux de travail ?",
    'run.abort.warning':
      "L'interruption de la procédure mettra immédiatement fin à toutes les étapes en cours et en attente. Tout travail en cours sera perdu.",
    'run.inputs': 'Entrées',
    'run.logs.noLogsAvailable':
      "Aucun journal n'est disponible pour cette exécution de workflow.",
    'run.logs.title': 'Journaux du workflow {{processName}}',
    'run.logs.viewLogs': 'Afficher les journaux',
    'run.messages.eventTriggered':
      'Un événement a été envoyé pour déclencher ce flux de travail. Il apparaîtra une fois la course commencée.',
    'run.pageTitle': '{{processName}} exécuter',
    'run.results': 'Résultats',
    'run.retrigger': 'Redéclenchement',
    'run.status.aborted': "L'exécution a été interrompue il y a {{time}}.",
    'run.status.abortedWithoutTime': "L'exécution a été interrompue.",
    'run.status.completed': 'Exécution terminée',
    'run.status.completedAt': 'Exécution terminée {{time}}',
    'run.status.completedWithMessage':
      'Exécution terminée {{time}} avec le message',
    'run.status.failed': "L'exécution a échoué {{time}}",
    'run.status.failedAt': "L'exécution a échoué {{time}}",
    'run.status.noAdditionalInfo':
      "Le flux de travail n'a fourni aucune information supplémentaire concernant l'état.",
    'run.status.resultsWillBeDisplayedHereOnceTheRunIsComplete':
      "Les résultats s'afficheront ici une fois l'exécution terminée.",
    'run.status.running':
      "Le flux de travail est en cours d'exécution. Débuté le {{time}}",
    'run.status.runningWaitingAtNode':
      "Le flux de travail est en cours d'exécution - en attente sur le nœud {{node}} depuis {{formattedTime}}",
    'run.status.workflowIsRunning':
      "Le flux de travail est en cours d'exécution. Débuté le {{time}}",
    'run.suggestedNextWorkflow': 'Flux de travail suivant suggéré',
    'run.suggestedNextWorkflows': 'Flux de travail suivants suggérés',
    'run.title': 'Exécuter le flux de travail',
    'run.variables': "Variables d'exécution",
    'run.viewVariables': 'Afficher les variables',
    'stepperObjectField.error':
      "Le champ d'objet Stepper n'est pas pris en charge pour les schémas ne contenant pas de propriétés.",
    'table.actions.run': 'Exécuter',
    'table.actions.runAsEvent': 'Organiser un événement',
    'table.actions.viewInputSchema': "Schéma d'entrée du schéma de vue",
    'table.actions.viewRuns': 'Afficher les parcours',
    'table.actions.viewRunVariables': "Afficher les variables d'exécution",
    'table.filters.started': 'Démarré',
    'table.filters.entity': 'Entité',
    'table.filters.runBy': 'Exécuté par',
    'table.filters.startedOptions.last7days': 'Les 7 derniers jours',
    'table.filters.startedOptions.thisMonth': 'Ce mois-ci',
    'table.filters.startedOptions.today': "Aujourd'hui",
    'table.filters.startedOptions.yesterday': 'Hier',
    'table.filters.status': 'Statut',
    'table.filters.placeholder': 'Filtrer',
    'table.filters.clearAll': 'Tout effacer',
    'table.headers.description': 'Description',
    'table.headers.duration': 'Durée',
    'table.headers.lastRun': 'Dernière exécution',
    'table.headers.lastRunStatus': 'Statut de la dernière exécution',
    'table.headers.runsLastMonth': 'Exécutions (dernier mois)',
    'table.headers.successRatio': 'Taux de réussite',
    'table.headers.name': 'Nom',
    'table.headers.runStatus': "État d'exécution",
    'table.headers.started': 'Démarré',
    'table.headers.status': 'Statut',
    'table.headers.version': 'Version',
    'table.headers.entity': 'Entité',
    'table.headers.runBy': 'Exécuté par',
    'table.headers.workflowName': 'Nom du flux de travail',
    'table.headers.workflowStatus': 'État du flux de travail',
    'table.status.aborted': 'Avorté',
    'table.status.active': 'Actif',
    'table.status.completed': 'Terminé',
    'table.status.failed': 'Ayant échoué',
    'table.status.pending': 'En attente',
    'table.status.running': 'En cours d’exécution',
    'table.title.allRuns': 'Toutes les exécutions ({{count}})',
    'table.title.allWorkflowRuns': 'Exécutions du flux de travail ({{count}})',
    'table.title.workflows': 'Flux de travail ({{count}})',
    'tooltips.aborted': 'Avorté',
    'tooltips.active': 'Actif',
    'tooltips.completed': 'Terminé',
    'tooltips.pending': 'En attente',
    'tooltips.suspended': 'Suspendu',
    'tooltips.userNotAuthorizedAbort':
      "L'utilisateur n'est pas autorisé à interrompre le flux de travail.",
    'tooltips.userNotAuthorizedExecute':
      "L'utilisateur n'est pas autorisé à exécuter le flux de travail.",
    'tooltips.retriggerNotSupportedForAborted':
      "Le redéclenchement à partir du point d'interruption n'est pas pris en charge. Utilisez Flux de travail entier pour démarrer une nouvelle exécution avec les mêmes entrées.",
    'tooltips.workflowDown':
      "Le flux de travail est actuellement indisponible ou en état d'erreur.",
    'workflow.buttons.entireWorkflow': 'Flux de travail entier',
    'workflow.buttons.fromAbortedPoint': "À partir du point d'interruption",
    'workflow.buttons.fromFailurePoint': 'À partir du point de défaillance',
    'workflow.buttons.run': 'Exécuter',
    'workflow.buttons.runAgain': 'Exécuter à nouveau',
    'workflow.buttons.runAsEvent': 'Organiser un événement',
    'workflow.buttons.runFailedAgain': "L'exécution a de nouveau échoué.",
    'workflow.buttons.runWorkflow': 'Exécuter le flux de travail',
    'workflow.buttons.running': "En cours d'exécution...",
    'workflow.definition': 'Définition du flux de travail',
    'workflow.inputSchema': "Schéma d'entrée",
    'workflow.inputSchemaDescription':
      'Définit les champs de données requis et la validation pour ce flux de travail.',
    'workflow.successRatio': 'Taux de réussite',
    'workflow.successRatioDescription':
      'Part des exécutions réussies par rapport aux exécutions échouées pour ce flux de travail.',
    'workflow.runSuccess': 'Réussite des exécutions',
    'workflow.ofTotal': 'sur {{totalCount}}',
    'workflow.statsSuccess': 'Réussite',
    'workflow.statsFailed': 'Échec',
    'workflow.details': 'Détails',
    'workflow.errors.abortFailed':
      "L'annulation a échoué : l'exécution est déjà terminée.",
    'workflow.errors.abortFailedWithReason': "L'abandon a échoué : {{reason}}",
    'workflow.errors.failedToLoadDetails':
      "Impossible de charger les détails pour l'ID du flux de travail : {{id}}",
    'workflow.errors.retriggerFailed': 'Échec du redéclenchement : {{reason}}',
    'workflow.fields.description': 'Description',
    'workflow.fields.duration': 'Durée',
    'workflow.fields.averageDuration': 'Durée moyenne',
    'workflow.fields.entity': 'Entité',
    'workflow.fields.runStatus': "État d'exécution",
    'workflow.fields.started': 'Démarré',
    'workflow.fields.runBy': 'Exécuté par',
    'workflow.fields.version': 'Version',
    'workflow.fields.workflow': 'Flux de travail',
    'workflow.fields.workflowId': "ID d'exécution",
    'workflow.fields.workflowIdCopied':
      "L'identifiant de l'exécution a été copié dans le presse-papiers.",
    'workflow.fields.workflowStatus': 'État du flux de travail',
    'workflow.messages.areYouSureYouWantToRunThisWorkflow':
      'Êtes-vous sûr de vouloir exécuter ce flux de travail ?',
    'workflow.messages.userNotAuthorizedExecute':
      'Utilisateur non autorisé à exécuter le flux de travail.',
    'workflow.messages.workflowDown':
      "Le flux de travail est actuellement interrompu ou en état d'erreur. Son exécution maintenant peut échouer ou produire des résultats inattendus.",
    'workflow.progress': 'Avancement du flux de travail',
    'workflow.status.available': 'Disponible',
    'workflow.status.unavailable': 'Indisponible',
    'workflow.unavailable.title': 'Flux de travail indisponible',
    'workflow.unavailable.runTooltip': 'Flux de travail indisponible',
    'workflow.unavailable.requestFailed':
      'La requête HTTP GET vers {{url}} a échoué.',
    'workflow.unavailable.statusCodeLine': 'Code de statut : {{statusCode}}',
    'workflow.unavailable.statusTextLine': 'Texte de statut : {{reason}}',
    'samlSso.title': 'Session GitHub SAML SSO expirée',
    'samlSso.reauthorizeButton': 'Réautoriser SSO',
    'samlSso.body':
      'Votre session GitHub SAML SSO a expiré. Votre organisation nécessite une session SAML active pour accéder à ses ressources.',
    'samlSso.reauthorizeHint':
      "Cliquez sur 'Réautoriser SSO' pour vous réauthentifier auprès du fournisseur d'identité de votre organisation.",
    'samlSso.fallbackHint':
      "Veuillez vous déconnecter et vous reconnecter depuis Paramètres > Fournisseurs d'authentification pour rétablir votre session SAML.",
  },
});

export default orchestratorTranslationFr;
