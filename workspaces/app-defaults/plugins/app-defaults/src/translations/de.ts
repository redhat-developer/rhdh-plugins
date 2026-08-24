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

import { createTranslationMessages } from '@backstage/frontend-plugin-api';
import { translationRef } from './ref';

/**
 * @internal
 */
export const de = createTranslationMessages({
  ref: translationRef,
  messages: {
    'catalog.emptyState.title': 'Keine Katalogeinträge gefunden',
    'catalog.emptyState.description':
      'Einträge werden hier angezeigt, sobald sie im Katalog registriert sind.',
    'catalog.emptyState.action': 'Komponente registrieren',
    'catalogGraph.emptyState.title': 'Keine Katalogeinträge gefunden',
    'catalogGraph.emptyState.description':
      'Der Kataloggraph wird hier angezeigt, sobald Entitäten im Katalog registriert sind.',
    'catalogGraph.emptyState.action': 'Zum Katalog',
    'scaffolder.emptyState.title': 'Keine Vorlagen verfügbar',
    'scaffolder.emptyState.description':
      'Software-Vorlagen werden hier angezeigt, sobald sie im Katalog registriert sind.',
    'scaffolder.emptyState.action': 'Vorlage registrieren',
    'apiDocs.emptyState.title': 'Keine APIs verfügbar',
    'apiDocs.emptyState.description':
      'API-Definitionen werden hier angezeigt, sobald sie im Katalog registriert sind.',
    'apiDocs.emptyState.action': 'API registrieren',
    'docs.emptyState.title': 'Keine Dokumentation verfügbar',
    'docs.emptyState.description':
      'Dokumentation wird hier angezeigt, sobald Entitäten mit TechDocs-Annotationen registriert sind.',
    'docs.emptyState.action': 'Mehr erfahren',
  },
});
