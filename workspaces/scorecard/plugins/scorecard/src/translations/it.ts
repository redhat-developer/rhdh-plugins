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
 * Italian translation for plugin.scorecard.
 * @public
 */
const scorecardTranslationIt = createTranslationMessages({
  ref: scorecardTranslationRef,
  messages: {
    'emptyState.title': 'Non è stata ancora aggiunta alcuna scheda punteggio',
    'emptyState.description':
      "Le schede punteggio aiutano a monitorare a colpo d'occhio l'integrità dei componenti. Per iniziare, consultare la documentazione per le linee guida di configurazione.",
    'emptyState.button': 'Visualizza la documentazione',
    'emptyState.altText': 'Nessuna scheda punteggio',
    'permissionRequired.title': 'Autorizzazione mancante',
    'permissionRequired.description':
      "Per visualizzare il plugin Scorecard, contattare l'amministratore per richiedere l'autorizzazione {{permission}}.",
    'permissionRequired.button': 'Per saperne di più',
    'permissionRequired.altText': 'Autorizzazione richiesta',
    'errors.entityMissingProperties':
      'Entità priva delle proprietà richieste per la ricerca nella scheda punteggio',
    'errors.invalidApiResponse':
      "Formato di risposta non valido dall'API della scheda punteggio",
    'errors.fetchError':
      'Errore durante il recupero delle schede punteggio: {{error}}',
    'errors.metricDataUnavailable': 'Dati metrici non disponibili',
    'errors.invalidThresholds': 'Soglie non valide',
    'errors.missingPermission': 'Autorizzazione mancante',
    'errors.missingPermissionMessage':
      "Per visualizzare le metriche della scheda punteggio, il tuo amministratore deve concedere l'autorizzazione richiesta.",
    'errors.userNotFoundInCatalogMessage':
      'Entità utente non trovata nel catalogo',
    'metric.github.open_prs.title': 'Richieste pull aperte su GitHub',
    'metric.github.open_prs.description':
      'Conteggio attuale delle richieste pull aperte per uno specifico repository GitHub.',
    'metric.jira.open_issues.title': 'Ticket di blocco Jira aperti',
    'metric.jira.open_issues.description':
      'Evidenzia il numero di problemi critici e di blocco attualmente aperti in Jira.',
    'thresholds.success': 'Attività riuscita',
    'thresholds.warning': 'Avviso',
    'thresholds.error': 'Errore',
  },
});

export default scorecardTranslationIt;
