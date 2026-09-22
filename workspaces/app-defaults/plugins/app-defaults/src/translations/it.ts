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
    'catalog.emptyState.title': 'Nessun elemento del catalogo disponibile',
    'catalog.emptyState.description':
      "Non sono ancora presenti entità del catalogo, oppure non disponi dell'autorizzazione per visualizzarle. Una volta registrate e dopo aver ottenuto l'accesso, appariranno qui.",
    'catalog.emptyState.importButtonTitle': 'Registra un componente',
    'catalogGraph.emptyState.title': 'Nessun elemento del catalogo disponibile',
    'catalogGraph.emptyState.description':
      "Non sono ancora presenti entità del catalogo, oppure non disponi dell'autorizzazione per visualizzarle. Il grafico del catalogo apparirà qui una volta che saranno registrate e avrai accesso.",
    'catalogGraph.emptyState.importButtonTitle': 'Registra un componente',
    'scaffolder.emptyState.title': 'Nessun modello disponibile',
    'scaffolder.emptyState.description':
      "Non sono ancora disponibili modelli software, oppure non disponi dell'autorizzazione per visualizzarli. Una volta registrati e dopo aver ottenuto l'accesso, appariranno qui.",
    'scaffolder.emptyState.importButtonTitle': 'Registra un modello',
    'apiDocs.emptyState.title': 'Nessuna API disponibile',
    'apiDocs.emptyState.description':
      "Non sono ancora disponibili API, oppure non disponi dell'autorizzazione per visualizzarle. Una volta registrate e dopo aver ottenuto l'accesso, appariranno qui.",
    'apiDocs.emptyState.importButtonTitle': "Registra un'API",
    'docs.emptyState.title': 'Nessuna documentazione disponibile',
    'docs.emptyState.description':
      "Non sono ancora presenti entità documentate, oppure non disponi dell'autorizzazione per visualizzarle. La documentazione apparirà qui una volta che le entità con annotazioni TechDocs saranno registrate e avrai accesso.",
    'docs.emptyState.importButtonTitle': 'Registra un componente',
    'menuItem.learningPaths': 'Learning Path',
    'learningPaths.title': 'Learning Path',
    'learningPaths.error.title': 'Impossibile estrarre i dati.',
    'learningPaths.error.unknownError': 'Errore sconosciuto',
  },
});
