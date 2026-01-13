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

/**
 * fr translation for plugin.translations.
 * @public
 */
const translationsTranslationFr = createTranslationMessages({
  ref: translationsPluginTranslationRef,
  messages: {
    'page.title': 'Traductions',
    'page.subtitle': 'Gérer et afficher les traductions chargées',
    'table.title': 'Traductions chargées ({{count}})',
    'table.headers.refId': 'ID de réf',
    'table.headers.key': 'Clé',
    'table.options.pageSize': 'Articles par page',
    'table.options.pageSizeOptions': 'Afficher {{count}} éléments',
    'export.title': 'Traductions',
    'export.downloadButton': 'Télécharger les traductions par défaut (anglais)',
    'export.filename': 'traductions-{{timestamp}}.json',
    'common.loading': 'Chargement en cours...',
    'common.error': "Une erreur s'est produite",
    'common.noData': 'Aucune donnée disponible',
    'common.refresh': 'Rafraîchir',
    'language.displayFormat': '{{displayName}} ({{code}})',
  },
});

export default translationsTranslationFr;
