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
    'catalog.emptyState.title': 'Nessun elemento disponibile nel catalogo',
    'catalog.emptyState.description':
      'Non ci sono ancora entità nel catalogo, oppure non hai il permesso di visualizzarne alcuna. Appariranno qui una volta registrate e quando avrai accesso.',
    'catalog.emptyState.action': 'Registra un componente',
    'catalogGraph.emptyState.title': 'Nessun elemento disponibile nel catalogo',
    'catalogGraph.emptyState.description':
      'Non ci sono ancora entità nel catalogo, oppure non hai il permesso di visualizzarne alcuna. Il grafo del catalogo apparirà qui una volta registrate e quando avrai accesso.',
    'catalogGraph.emptyState.action': 'Vai al catalogo',
    'scaffolder.emptyState.title': 'Nessun modello disponibile',
    'scaffolder.emptyState.description':
      'Non ci sono ancora modelli software, oppure non hai il permesso di visualizzarne alcuno. Appariranno qui una volta registrati e quando avrai accesso.',
    'scaffolder.emptyState.action': 'Registra un modello',
    'apiDocs.emptyState.title': 'Nessuna API disponibile',
    'apiDocs.emptyState.description':
      'Non ci sono ancora API, oppure non hai il permesso di visualizzarne alcuna. Appariranno qui una volta registrate e quando avrai accesso.',
    'apiDocs.emptyState.action': "Registra un'API",
    'docs.emptyState.title': 'Nessuna documentazione disponibile',
    'docs.emptyState.description':
      'Non ci sono ancora entità documentate, oppure non hai il permesso di visualizzarne alcuna. La documentazione apparirà qui una volta registrate entità con annotazioni TechDocs e quando avrai accesso.',
    'docs.emptyState.action': 'Scopri di più',
  },
});
