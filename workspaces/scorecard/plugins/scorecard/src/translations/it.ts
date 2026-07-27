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
    'common.loading': 'Caricamento',
    'dataSourcesDialog.title': '{{title}} sorgenti',
    'dataSourcesDialog.close': 'Chiudere',
    'dataSourcesDialog.unknownPlugin': 'Sconosciuto',
    'dataSourcesDialog.statusTooltip':
      'Valore {{value}} corrisponde alla soglia {{status}} {{expression}}',
    'dataSourcesDialog.columns.plugin': 'PLUGIN',
    'dataSourcesDialog.columns.check': 'VERIFICA',
    'dataSourcesDialog.columns.value': 'VALORE',
    'dataSourcesDialog.columns.status': 'STATO',
    'dataSourcesDialog.columns.lastSynced': 'ULTIMA SINCRONIZZAZIONE',
    'emptyState.altText': 'Nessuna scorecard',
    'emptyState.button': 'Visualizza documentazione',
    'emptyState.description':
      'Le scorecard permettono di valutare rapidamente lo stato di salute dei componenti. Per iniziare, consulta la nostra documentazione per le linee guida di configurazione.',
    'emptyState.title': 'Non è stata ancora aggiunta alcuna scorecard',
    'entitiesPage.entitiesTable.footer.allRows': 'Tutte le righe',
    'entitiesPage.entitiesTable.footer.of': 'di',
    'entitiesPage.entitiesTable.footer.rows_one': '{{count}} riga',
    'entitiesPage.entitiesTable.footer.rows_other': '{{count}} righe',
    'entitiesPage.entitiesTable.header.entity': 'Entità',
    'entitiesPage.entitiesTable.header.kind': 'Tipo',
    'entitiesPage.entitiesTable.header.lastUpdated': 'Ultimo aggiornamento',
    'entitiesPage.entitiesTable.header.owner': 'Proprietario',
    'entitiesPage.entitiesTable.header.status': 'Stato',
    'entitiesPage.entitiesTable.header.value': 'Valore',
    'entitiesPage.entitiesTable.title': 'Entità',
    'entitiesPage.entitiesTable.titleWithCount': 'Entità ({{count}})',
    'entitiesPage.entitiesTable.unavailable': 'Non disponibile',
    'entitiesPage.metricProviderNotRegistered':
      'Il fornitore di metriche con ID {{metricId}} non è registrato.',
    'entitiesPage.missingPermission':
      "Per visualizzare le metriche della scorecard, l'amministratore deve concederti l'autorizzazione obbligatoria.",
    'entitiesPage.noDataFound':
      'Per visualizzare i tuoi dati qui, verifica che le tue entità stiano segnalando valori relativi a questa metrica.',
    'entitiesPage.unknownMetric': 'Metrica sconosciuta',
    'errors.authenticationError': 'Errore di autenticazione',
    'errors.authenticationErrorMessage':
      "Effettua l'accesso per visualizzare i tuoi dati.",
    'errors.entityMissingProperties':
      "L'entità non possiede le proprietà obbligatorie per la ricerca della scorecard",
    'errors.fetchError':
      "Errore durante l'estrazione delle scorecard: {{error}}",
    'errors.invalidApiResponse':
      "Formato di risposta non valido dall'API della scorecard",
    'errors.invalidThresholds': 'Soglie non valide',
    'errors.metricDataUnavailable': 'Dati metrici non disponibili',
    'errors.missingAggregationId':
      'La scorecard non è configurata correttamente, la proprietà ID di aggregazione (o ID metrica) non è fornita',
    'errors.missingPermission': 'Autorizzazione mancante',
    'errors.missingPermissionMessage':
      "Per visualizzare le metriche della scorecard, l'amministratore deve concederti l'autorizzazione obbligatoria.",
    'errors.noDataFound': 'Nessun dato trovato',
    'errors.noDataFoundMessage':
      'Per visualizzare i tuoi dati qui, verifica che le tue entità stiano segnalando valori relativi a questa metrica.',
    'errors.unsupportedAggregationType':
      'Questa scorecard utilizza un tipo di aggregazione non supportato da questa versione del plugin.',
    'errors.userNotFoundInCatalogMessage':
      'Entità utente non trovata nel catalogo.',
    'metric.weightedStatusScoreCenterTooltipMaxLabel':
      'Punteggio massimo possibile',
    'metric.weightedStatusScoreCenterTooltipTotalLabel': 'Punteggio totale',
    'metric.weightedStatusScoreCenterTooltipBreakdownRow_one':
      '{{status}}: {{count}} entity, score: {{score}}',
    'metric.weightedStatusScoreCenterTooltipBreakdownRow_other':
      '{{status}}: {{count}} entities, score: {{score}}',
    'metric.weightedStatusScoreLegendTooltipEntitiesEach_one':
      '{{count}} entità, ciascuna {{score}}',
    'metric.weightedStatusScoreLegendTooltipEntitiesEach_other':
      '{{count}} entità, ciascuna {{score}}',
    'metric.weightedStatusScoreLegendTooltipRowTotal':
      'Punteggio totale {{total}}',
    'metric.drillDownCalculationFailures':
      'Si è verificato un errore durante il calcolo di questa metrica da parte di una o più entità.',
    'metric.filecheck.description':
      'Verifica se il file {{name}} esiste nel repository.',
    'metric.filecheck.title': 'Verifica del file: {{name}}',
    'metric.github.openPRs.description':
      'Numero attuale di richiesta pull aperte per un determinato repository di GitHub.',
    'metric.github.openPRs.title': 'RP aperte su GitHub',
    'metric.homepageEntityCalculationHealth':
      '{{healthy}} / {{total}} entità senza errori di calcolo della metrica',
    'metric.homepageEntityHealthRatio': '{{healthy}}/{{total}} entità',
    'metric.jira.openIssues.description':
      'Evidenzia il numero di problemi critici e bloccanti attualmente aperti in Jira.',
    'metric.jira.openIssues.title': 'Ticket di blocco aperti in Jira',
    'metric.lastUpdated': 'Ultimo aggiornamento: {{timestamp}}',
    'metric.lastUpdatedNotAvailable': 'Ultimo aggiornamento: non disponibile',
    'metric.someEntitiesNotReportingValues':
      'Alcune entità non comunicano i valori relativi a questa metrica.',
    'metric.sonarqube.codeCoverage.description':
      'Percentuale complessiva di copertura codice in SonarQube.',
    'metric.sonarqube.codeCoverage.title': 'Copertura codice in SonarQube',
    'metric.sonarqube.codeDuplications.description':
      'Percentuale di linee duplicate in SonarQube.',
    'metric.sonarqube.codeDuplications.title':
      'Duplicazioni del codice in SonarQube',
    'metric.sonarqube.maintainabilityIssues.description':
      'Numero di code smell non risolti in SonarQube.',
    'metric.sonarqube.maintainabilityIssues.title':
      'Problemi di manutenibilità di SonarQube',
    'metric.sonarqube.maintainabilityRating.description':
      'Valutazione di manutenibilità di SonarQube.',
    'metric.sonarqube.maintainabilityRating.title':
      'Valutazione di manutenibilità di SonarQube',
    'metric.sonarqube.openIssues.description':
      'Numero dei problemi aperti (APERTI, CONFERMATI, RIAPERTI) in SonarQube.',
    'metric.sonarqube.openIssues.title': 'Problemi aperti in SonarQube',
    'metric.sonarqube.qualityGate.description':
      'Se il progetto supera il quality gate di SonarQube.',
    'metric.sonarqube.qualityGate.title': 'Stato del Quality Gate di SonarQube',
    'metric.sonarqube.reliabilityIssues.description':
      'Numero di bug aperti in SonarQube.',
    'metric.sonarqube.reliabilityIssues.title':
      'Problemi di affidabilità di SonarQube',
    'metric.sonarqube.reliabilityRating.description':
      'Valutazione di affidabilità di SonarQube.',
    'metric.sonarqube.reliabilityRating.title':
      'Valutazione di affidabilità di SonarQube',
    'metric.sonarqube.securityHotspots.description':
      'Numero di hotspot di sicurezza da rivedere in SonarQube.',
    'metric.sonarqube.securityHotspots.title':
      'Hotspot di sicurezza di SonarQube',
    'metric.sonarqube.securityIssues.description':
      'Numero di vulnerabilità di sicurezza aperte in SonarQube.',
    'metric.sonarqube.securityIssues.title':
      'Problemi di sicurezza di SonarQube',
    'metric.sonarqube.securityRating.description':
      'Valutazione di sicurezza di SonarQube.',
    'metric.sonarqube.securityRating.title':
      'Valutazione di sicurezza di SonarQube',
    'metric.sonarqube.securityReviewRating.description':
      'Valutazione di sicurezza di SonarQube.',
    'metric.sonarqube.securityReviewRating.title':
      'Valutazione di sicurezza di SonarQube',
    'metricGroupCard.menuAriaLabel': 'Altre opzioni',
    'metricGroupCard.viewDataSources': 'Visualizza sorgenti',
    'notFound.altText': 'Pagina non trovata',
    'notFound.contactSupport': 'Contatta il supporto',
    'notFound.description':
      'Prova ad aggiungere un file {{indexFile}} nella root della directory dei documenti di questo repository.',
    'notFound.goBack': 'Torna indietro',
    'notFound.readMore': 'Leggi altri contenuti',
    'notFound.title': '404 Pagina non trovata',
    'permissionRequired.altText': 'Autorizzazione obbligatoria',
    'permissionRequired.button': 'Leggi altri contenuti',
    'permissionRequired.description':
      "Per visualizzare il plugin Scorecard, contatta il tuo amministratore per concedere l'autorizzazione {{permission}}.",
    'permissionRequired.title': 'Autorizzazione mancante',
    'thresholds.entities_one': '{{count}} entità',
    'thresholds.entities_other': '{{count}} entità',
    'thresholds.error': 'Errore',
    'thresholds.exist': 'Esiste',
    'thresholds.missing': 'Mancante',
    'thresholds.noEntities': 'Nessuna entità nello stato {{category}}',
    'thresholds.success': 'Successo',
    'thresholds.warning': 'Avviso',
  },
});

export default scorecardTranslationIt;
