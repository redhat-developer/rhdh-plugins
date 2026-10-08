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
import { appDefaultsTranslationRef } from './ref';

/**
 * @internal
 */
export default createTranslationMessages({
  ref: appDefaultsTranslationRef,
  messages: {
    'catalog.emptyState.title': 'Keine Katalogelemente verfügbar',
    'catalog.emptyState.description':
      'Es sind noch keine Katalog-Entitys vorhanden, oder Sie haben keine Berechtigung, welche anzuzeigen. Sie werden hier angezeigt, sobald sie registriert sind und Sie Zugriff darauf haben.',
    'catalog.emptyState.importButtonTitle': 'Komponente registrieren',
    'catalogGraph.emptyState.title': 'Keine Katalogelemente verfügbar',
    'catalogGraph.emptyState.description':
      'Es sind noch keine Katalog-Entitys vorhanden, oder Sie haben keine Berechtigung, welche anzuzeigen. Die Kataloggrafik wird hier angezeigt, sobald sie registriert sind und Sie Zugriff darauf haben.',
    'catalogGraph.emptyState.importButtonTitle': 'Komponente registrieren',
    'scaffolder.emptyState.title': 'Keine Vorlagen verfügbar',
    'scaffolder.emptyState.description':
      'Es sind noch keine Softwarevorlagen vorhanden, oder Sie haben keine Berechtigung, welche anzuzeigen. Sie werden hier angezeigt, sobald sie registriert sind und Sie Zugriff darauf haben.',
    'scaffolder.emptyState.importButtonTitle': 'Vorlage registrieren',
    'apiDocs.emptyState.title': 'Keine APIs verfügbar',
    'apiDocs.emptyState.description':
      'Es gibt noch keine APIs, oder Sie haben keine Berechtigung, welche anzuzeigen. Sie werden hier angezeigt, sobald sie registriert sind und Sie Zugriff darauf haben.',
    'apiDocs.emptyState.importButtonTitle': 'API registrieren',
    'docs.emptyState.title': 'Keine Dokumentation verfügbar',
    'docs.emptyState.description':
      'Es sind noch keine Entitys dokumentiert, oder Sie haben keine Berechtigung, welche anzuzeigen. Die Dokumentation wird hier angezeigt, sobald Entitys mit TechDocs-Annotationen registriert sind und Sie Zugriff darauf haben.',
    'docs.emptyState.importButtonTitle': 'Komponente registrieren',
    'learningPaths.title': 'Lernpfade',
    'learningPaths.error.title': 'Daten konnten nicht abgerufen werden.',
    'learningPaths.error.unknownError': 'Unbekannter Fehler',
  },
});
