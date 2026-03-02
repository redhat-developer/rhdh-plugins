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
import { translationsPluginTranslationRef } from './ref';

/**
 * Italian translation for translations.
 * @public
 */
const translationsTranslationIt = createTranslationMessages({
  ref: translationsPluginTranslationRef,
  messages: {
    'page.title': 'Traduzioni',
    'page.subtitle': 'Gestione e visualizzazione delle traduzioni caricate',
    'table.title': 'Traduzioni caricate ({{count}})',
    'table.headers.refId': 'ID di riferimento',
    'table.headers.key': 'Chiave',
    'table.options.pageSize': 'Elementi per pagina',
    'table.options.pageSizeOptions': 'Mostra {{count}} elementi',
    'export.title': 'Traduzioni',
    'export.downloadButton': 'Scarica le traduzioni predefinite (italiano)',
    'export.filename': 'translations-{{timestamp}}.json',
    'common.loading': 'Caricamento...',
    'common.error': 'Si è verificato un errore',
    'common.noData': 'Nessun dato disponibile',
    'common.refresh': 'Aggiorna',
    'language.displayFormat': '{{displayName}} ({{code}})',
  },
});

export default translationsTranslationIt;
