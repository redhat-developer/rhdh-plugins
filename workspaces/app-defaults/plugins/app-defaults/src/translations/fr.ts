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
export const fr = createTranslationMessages({
  ref: translationRef,
  messages: {
    'catalog.emptyState.title': 'Aucun élément trouvé dans le catalogue',
    'catalog.emptyState.description':
      'Les éléments apparaîtront ici une fois enregistrés dans le catalogue.',
    'catalog.emptyState.action': 'Enregistrer un composant',
    'catalogGraph.emptyState.title': 'Aucun élément trouvé dans le catalogue',
    'catalogGraph.emptyState.description':
      'Le graphe du catalogue apparaîtra ici une fois que des entités seront enregistrées dans le catalogue.',
    'catalogGraph.emptyState.action': 'Aller au catalogue',
    'scaffolder.emptyState.title': 'Aucun modèle disponible',
    'scaffolder.emptyState.description':
      'Les modèles de logiciels apparaîtront ici une fois enregistrés dans le catalogue.',
    'scaffolder.emptyState.action': 'Enregistrer un modèle',
    'apiDocs.emptyState.title': 'Aucune API disponible',
    'apiDocs.emptyState.description':
      "Les définitions d'API apparaîtront ici une fois enregistrées dans le catalogue.",
    'apiDocs.emptyState.action': 'Enregistrer une API',
    'docs.emptyState.title': 'Aucune documentation disponible',
    'docs.emptyState.description':
      'La documentation apparaîtra ici une fois que des entités avec des annotations TechDocs seront enregistrées.',
    'docs.emptyState.action': 'En savoir plus',
  },
});
