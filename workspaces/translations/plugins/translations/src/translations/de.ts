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

const translationsTranslationDe = createTranslationMessages({
  ref: translationsPluginTranslationRef,
  messages: {
    // CRITICAL: Use flat dot notation, not nested objects
    'page.title': 'Übersetzungen',
    'page.subtitle': 'Geladene Übersetzungen verwalten und anzeigen',
    'table.title': 'Geladene Übersetzungen ({{count}})',
    'table.headers.refId': 'Ref-ID',
    'table.headers.key': 'Schlüssel',
    'table.options.pageSize': 'Elemente pro Seite',
    'table.options.pageSizeOptions': '{{count}} Elemente anzeigen',
    'export.title': 'Übersetzungen',
    'export.downloadButton': 'Standard-Übersetzungen herunterladen (Englisch)',
    'export.filename': 'übersetzungen-{{timestamp}}.json',
    'common.loading': 'Wird geladen...',
    'common.error': 'Ein Fehler ist aufgetreten',
    'common.noData': 'Keine Daten verfügbar',
    'common.refresh': 'Aktualisieren',
    'language.displayFormat': '{{displayName}} ({{code}})',
  },
});

export default translationsTranslationDe;
