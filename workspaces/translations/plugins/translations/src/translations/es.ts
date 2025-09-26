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

const translationsTranslationEs = createTranslationMessages({
  ref: translationsPluginTranslationRef,
  messages: {
    // CRITICAL: Use flat dot notation, not nested objects
    'page.title': 'Traducciones',
    'page.subtitle': 'Gestionar y ver traducciones cargadas',
    'table.title': 'Traducciones cargadas ({{count}})',
    'table.headers.refId': 'ID de referencia',
    'table.headers.key': 'Clave',
    'table.options.pageSize': 'Elementos por página',
    'table.options.pageSizeOptions': 'Mostrar {{count}} elementos',
    'export.title': 'Traducciones',
    'export.downloadButton': 'Descargar traducciones por defecto (Inglés)',
    'export.filename': 'traducciones-{{timestamp}}.json',
    'common.loading': 'Cargando...',
    'common.error': 'Ocurrió un error',
    'common.noData': 'No hay datos disponibles',
    'common.refresh': 'Actualizar',
    'language.displayFormat': '{{displayName}} ({{code}})',
  },
});

export default translationsTranslationEs;
