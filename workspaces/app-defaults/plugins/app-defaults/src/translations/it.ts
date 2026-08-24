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
export const it = createTranslationMessages({
  ref: translationRef,
  messages: {
    'catalog.emptyState.title': 'Nessun elemento trovato nel catalogo',
    'catalog.emptyState.description':
      'Gli elementi appariranno qui una volta registrati nel catalogo.',
    'catalog.emptyState.action': 'Registra un componente',
    'catalogGraph.emptyState.title': 'Nessun elemento trovato nel catalogo',
    'catalogGraph.emptyState.description':
      'Il grafo del catalogo apparirà qui una volta che le entità saranno registrate nel catalogo.',
    'catalogGraph.emptyState.action': 'Vai al catalogo',
    'scaffolder.emptyState.title': 'Nessun modello disponibile',
    'scaffolder.emptyState.description':
      'I modelli software appariranno qui una volta registrati nel catalogo.',
    'scaffolder.emptyState.action': 'Registra un modello',
    'apiDocs.emptyState.title': 'Nessuna API disponibile',
    'apiDocs.emptyState.description':
      'Le definizioni API appariranno qui una volta registrate nel catalogo.',
    'apiDocs.emptyState.action': "Registra un'API",
    'docs.emptyState.title': 'Nessuna documentazione disponibile',
    'docs.emptyState.description':
      'La documentazione apparirà qui una volta che le entità con annotazioni TechDocs saranno registrate.',
    'docs.emptyState.action': 'Scopri di più',
  },
});
