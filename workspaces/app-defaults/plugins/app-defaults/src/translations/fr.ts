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
    'catalog.emptyState.title': 'Aucun élément disponible dans le catalogue',
    'catalog.emptyState.description':
      "Il n'y a pas encore d'entités dans le catalogue, ou vous n'avez pas la permission d'en voir. Elles apparaîtront ici une fois enregistrées et que vous y aurez accès.",
    'catalog.emptyState.action': 'Enregistrer un composant',
    'catalogGraph.emptyState.title':
      'Aucun élément disponible dans le catalogue',
    'catalogGraph.emptyState.description':
      "Il n'y a pas encore d'entités dans le catalogue, ou vous n'avez pas la permission d'en voir. Le graphe du catalogue apparaîtra ici une fois qu'elles seront enregistrées et que vous y aurez accès.",
    'catalogGraph.emptyState.action': 'Aller au catalogue',
    'scaffolder.emptyState.title': 'Aucun modèle disponible',
    'scaffolder.emptyState.description':
      "Il n'y a pas encore de modèles de logiciels, ou vous n'avez pas la permission d'en voir. Ils apparaîtront ici une fois enregistrés et que vous y aurez accès.",
    'scaffolder.emptyState.action': 'Enregistrer un modèle',
    'apiDocs.emptyState.title': 'Aucune API disponible',
    'apiDocs.emptyState.description':
      "Il n'y a pas encore d'API, ou vous n'avez pas la permission d'en voir. Elles apparaîtront ici une fois enregistrées et que vous y aurez accès.",
    'apiDocs.emptyState.action': 'Enregistrer une API',
    'docs.emptyState.title': 'Aucune documentation disponible',
    'docs.emptyState.description':
      "Il n'y a pas encore d'entités documentées, ou vous n'avez pas la permission d'en voir. La documentation apparaîtra ici une fois que des entités avec des annotations TechDocs seront enregistrées et que vous y aurez accès.",
    'docs.emptyState.action': 'En savoir plus',
  },
});
