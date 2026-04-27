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
    // Empty state translations
    'emptyState.title': 'Non è stata ancora aggiunta alcuna scheda punteggio',
    'emptyState.description':
      "Le schede punteggio aiutano a monitorare a colpo d'occhio l'integrità dei componenti. Per iniziare, consultare la documentazione per le linee guida di configurazione.",
    'emptyState.button': 'Visualizza la documentazione',
    'emptyState.altText': 'Nessuna scheda punteggio',

    // Permission required translations
    'permissionRequired.title': 'Autorizzazione mancante',
    'permissionRequired.description':
      "Per visualizzare il plugin Scorecard, contattare l'amministratore per richiedere l'autorizzazione {{permission}}.",
    'permissionRequired.button': 'Per saperne di più',
    'permissionRequired.altText': 'Autorizzazione richiesta',

    // Not found state
    'notFound.title': '404 Pagina non trovata',
    'notFound.description':
      'Prova ad aggiungere un file {{indexFile}} nella root della directory docs di questo repository.',
    'notFound.readMore': 'Scopri di più',
    'notFound.goBack': 'Indietro',
    'notFound.contactSupport': 'Contatta il supporto',
    'notFound.altText': 'Pagina non trovata',

    // Error messages
    'errors.entityMissingProperties':
      'Entità priva delle proprietà richieste per la ricerca nella scheda punteggio',
    'errors.missingAggregationId':
      'La scheda di valutazione non è configurata correttamente; la proprietà ID aggregazione (o ID metrica) non è stata specificata',
    'errors.invalidApiResponse':
      "Formato di risposta non valido dall'API della scheda punteggio",
    'errors.fetchError':
      'Errore durante il recupero delle schede punteggio: {{error}}',
    'errors.metricDataUnavailable': 'Dati metrici non disponibili',
    'errors.invalidThresholds': 'Soglie non valide',
    'errors.missingPermission': 'Autorizzazione mancante',
    'errors.noDataFound': 'Nessun dato trovato',
    'errors.authenticationError': 'Errore di autenticazione',
    'errors.missingPermissionMessage':
      "Per visualizzare le metriche della scheda punteggio, il tuo amministratore deve concedere l'autorizzazione richiesta.",
    'errors.userNotFoundInCatalogMessage':
      'Entità utente non trovata nel catalogo.',
    'errors.noDataFoundMessage':
      'Per visualizzare i tuoi dati qui, verifica che le tue entità stiano riportando valori relativi a questa metrica.',
    'errors.unsupportedAggregationType':
      'Questa scorecard utilizza un tipo di aggregazione non supportato da questa versione del plugin.',
    'errors.authenticationErrorMessage':
      'Effettua il login per visualizzare i tuoi dati.',

    // Metric translations
    'metric.github.open_prs.title': 'Richieste pull aperte su GitHub',
    'metric.github.open_prs.description':
      'Conteggio attuale delle richieste pull aperte per uno specifico repository GitHub.',
    'metric.jira.open_issues.title': 'Ticket di blocco Jira aperti',
    'metric.jira.open_issues.description':
      'Evidenzia il numero di problemi critici e di blocco attualmente aperti in Jira.',
    'metric.lastUpdated': 'Ultimo aggiornamento: {{timestamp}}',
    'metric.lastUpdatedNotAvailable': 'Ultimo aggiornamento: Non disponibile',
    'metric.someEntitiesNotReportingValues':
      'Alcune entità non stanno riportando valori relativi a questa metrica.',
    'metric.averageCenterTooltipTotalLabel': 'Punteggio totale',
    'metric.averageCenterTooltipMaxLabel': 'Punteggio massimo possibile',
    'metric.averageLegendTooltipEntitiesEach_one':
      '{{count}} entità, ciascuna {{score}}',
    'metric.averageLegendTooltipEntitiesEach_other':
      '{{count}} entità, ciascuna {{score}}',
    'metric.averageLegendTooltipRowTotal': 'Punteggio totale {{total}}',

    // Threshold translations
    'thresholds.success': 'Attività riuscita',
    'thresholds.warning': 'Avviso',
    'thresholds.error': 'Errore',
    'thresholds.noEntities': 'Nessuna entità con stato {{category}}',
    'thresholds.entities_one': '{{count}} entità',
    'thresholds.entities_other': '{{count}} entità',

    // Entities page translations
    'entitiesPage.unknownMetric': 'Metrica sconosciuta',
    'entitiesPage.noDataFound':
      'Per visualizzare i tuoi dati qui, verifica che le tue entità stiano riportando valori relativi a questa metrica.',
    'entitiesPage.missingPermission':
      "Per visualizzare le metriche della scheda punteggio, il tuo amministratore deve concedere l'autorizzazione richiesta.",
    'entitiesPage.metricProviderNotRegistered':
      'Provider di metrica con ID {{metricId}} non registrato.',
    'entitiesPage.entitiesTable.title': 'Entità',
    'entitiesPage.entitiesTable.unavailable': 'Non disponibile',
    'entitiesPage.entitiesTable.titleWithCount': 'Entità ({{count}})',
    'entitiesPage.entitiesTable.header.status': 'Stato',
    'entitiesPage.entitiesTable.header.value': 'Valore',
    'entitiesPage.entitiesTable.header.entity': 'Entità',
    'entitiesPage.entitiesTable.header.owner': 'Proprietario',
    'entitiesPage.entitiesTable.header.kind': 'Tipo',
    'entitiesPage.entitiesTable.header.lastUpdated': 'Ultimo aggiornamento',
    'entitiesPage.entitiesTable.footer.allRows': 'Tutte le righe',
    'entitiesPage.entitiesTable.footer.rows_one': '{{count}} riga',
    'entitiesPage.entitiesTable.footer.rows_other': '{{count}} righe',
    'entitiesPage.entitiesTable.footer.of': 'di',
  },
});

export default scorecardTranslationIt;
