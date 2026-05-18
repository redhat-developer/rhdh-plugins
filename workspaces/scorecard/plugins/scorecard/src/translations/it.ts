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
    'emptyState.title': 'Non è stata ancora aggiunta alcuna scorecard',
    'emptyState.description': 'Le scorecard permettono di valutare rapidamente lo stato di salute dei componenti. Per iniziare, consulta la nostra documentazione per le linee guida di configurazione.',
    'emptyState.altText': 'Nessuna scorecard',
    'notFound.title': '404 Pagina non trovata',
    'notFound.description': 'Prova ad aggiungere un file {{indexFile}} nella root della directory dei documenti di questo repository.',
    'notFound.goBack': 'Torna indietro',
    'notFound.contactSupport': 'Contatta il supporto',
    'notFound.altText': 'Pagina non trovata',
    'permissionRequired.title': 'Autorizzazione mancante',
    'permissionRequired.description': 'Per visualizzare il plugin Scorecard, contatta il tuo amministratore per concedere l\'autorizzazione {{permission}}.',
    'permissionRequired.altText': 'Autorizzazione obbligatoria',
    'common.loading': 'Caricamento',
    'errors.entityMissingProperties': 'L\'entità non possiede le proprietà obbligatorie per la ricerca della scorecard',
    'errors.missingAggregationId': 'La scorecard non è configurata correttamente, la proprietà ID di aggregazione (o ID metrica) non è fornita',
    'errors.invalidApiResponse': 'Formato di risposta non valido dall\'API della scorecard',
    'errors.fetchError': 'Errore durante l\'estrazione delle scorecard: {{error}}',
    'errors.invalidThresholds': 'Soglie non valide',
    'errors.missingPermission': 'Autorizzazione mancante',
    'errors.noDataFound': 'Nessun dato trovato',
    'errors.authenticationError': 'Errore di autenticazione',
    'errors.missingPermissionMessage': 'Per visualizzare le metriche della scorecard, l\'amministratore deve concederti l\'autorizzazione obbligatoria.',
    'thresholds.success': 'Successo',
    'thresholds.warning': 'Avviso',
    'thresholds.error': 'Errore',
    'thresholds.exist': 'Esiste',
    'thresholds.missing': 'Mancante',
    'thresholds.noEntities': 'Nessuna entità nello stato {{category}}',
    'thresholds.entities_one': '{{count}} entità',
    'thresholds.entities_other': '{{count}} entità',
    'entitiesPage.unknownMetric': 'Metrica sconosciuta',
    'entitiesPage.noDataFound': 'Per visualizzare i tuoi dati qui, verifica che le tue entità stiano segnalando valori relativi a questa metrica.',
  },
});

export default scorecardTranslationIt;
