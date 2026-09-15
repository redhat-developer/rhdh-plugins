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
export default createTranslationMessages({
  ref: translationRef,
  messages: {
    'catalog.emptyState.title': 'Keine Katalogeinträge verfügbar',
    'catalog.emptyState.description':
      'Es gibt noch keine Katalogeinträge oder Sie haben keine Berechtigung, welche anzuzeigen. Sie erscheinen hier, sobald sie registriert sind und Sie Zugriff haben.',
    'catalog.emptyState.action': 'Komponente registrieren',
    'catalogGraph.emptyState.title': 'Keine Katalogeinträge verfügbar',
    'catalogGraph.emptyState.description':
      'Es gibt noch keine Katalogeinträge oder Sie haben keine Berechtigung, welche anzuzeigen. Der Kataloggraph erscheint hier, sobald sie registriert sind und Sie Zugriff haben.',
    'catalogGraph.emptyState.action': 'Zum Katalog',
    'scaffolder.emptyState.title': 'Keine Vorlagen verfügbar',
    'scaffolder.emptyState.description':
      'Es gibt noch keine Software-Vorlagen oder Sie haben keine Berechtigung, welche anzuzeigen. Sie erscheinen hier, sobald sie registriert sind und Sie Zugriff haben.',
    'scaffolder.emptyState.action': 'Vorlage registrieren',
    'apiDocs.emptyState.title': 'Keine APIs verfügbar',
    'apiDocs.emptyState.description':
      'Es gibt noch keine APIs oder Sie haben keine Berechtigung, welche anzuzeigen. Sie erscheinen hier, sobald sie registriert sind und Sie Zugriff haben.',
    'apiDocs.emptyState.action': 'API registrieren',
    'docs.emptyState.title': 'Keine Dokumentation verfügbar',
    'docs.emptyState.description':
      'Es gibt noch keine dokumentierten Einträge oder Sie haben keine Berechtigung, welche anzuzeigen. Dokumentation erscheint hier, sobald Einträge mit TechDocs-Annotationen registriert sind und Sie Zugriff haben.',
    'docs.emptyState.action': 'Mehr erfahren',
  },
});
