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

const translationsTranslationFr = createTranslationMessages({
  ref: translationsPluginTranslationRef,
  messages: {
    'common.error': "Une erreur s'est produite",
    'common.loading': 'Chargement en cours...',
    'common.noData': 'Aucune donnée disponible',
    'common.refresh': 'Rafraîchir',
    'export.downloadButton': 'Télécharger les traductions par défaut (anglais)',
    'export.filename': 'traductions-{{timestamp}}.json',
    'export.title': 'Traductions',
    'language.displayFormat': '{{displayName}} ({{code}})',
    'page.subtitle': 'Gérer et afficher les traductions chargées',
    'page.title': 'Traductions',
    'table.headers.key': 'Clé',
    'table.headers.refId': 'ID de réf',
    'table.options.pageSize': 'Articles par page',
    'table.options.pageSizeOptions': 'Afficher {{count}} éléments',
    'table.title': 'Traductions chargées ({{count}})',
  },
});

export default translationsTranslationFr;
