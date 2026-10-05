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
import { aiCatalogTranslationRef } from './ref';

/**
 * es translation for plugin.ai-catalog.
 * @public
 */
const aiCatalogTranslationEs = createTranslationMessages({
  ref: aiCatalogTranslationRef,
  messages: {
    'catalog.page.title': 'Catálogo de IA',
    'catalog.toolbar.allPrefix': 'Todos',
    'catalog.toolbar.search': 'Buscar',
    'catalog.toolbar.viewGrid': 'Vista de tarjetas',
    'catalog.toolbar.viewTable': 'Vista de tabla',
    'catalog.toolbar.filters': 'Filtros',
    'catalog.filter.title': 'Filtros',
    'catalog.filter.all': 'Todos',
    'catalog.filter.type': 'Tipo',
    'catalog.filter.provider': 'Proveedor',
    'catalog.filter.owner': 'Propietario',
    'catalog.filter.tag': 'Etiqueta',
    'catalog.filter.clearAll': 'Borrar todo',
    'catalog.card.assetDetailsTitle': 'Detalles del recurso de IA',
    'catalog.card.descriptionLabel': 'Descripción',
    'catalog.card.viewDetails': 'Ver detalles de {{title}}',
    'catalog.card.tagsLabel': 'Etiquetas',
    'catalog.card.providerLabel': 'Proveedor',
    'catalog.card.usageTitle': 'Uso',
    'catalog.card.versionLabel': 'Versión',
    'catalog.card.usageDownloadZip': 'Descargar ZIP',
    'catalog.card.usageViewSource': 'Ver código fuente',
    'catalog.card.serverTypeLabel': 'Tipo de servidor',
    'catalog.card.apiKeyLabel': 'Clave de API requerida',
    'catalog.card.defaultModelLabel': 'Modelo predeterminado',
    'catalog.card.rationaleLabel': 'Justificación',
    'catalog.card.disciplinesLabel': 'Disciplinas',
    'catalog.card.categoriesLabel': 'Categorías',
    'catalog.card.relatedAgentsLabel': 'Agentes relacionados',
    'catalog.card.ruleCategoryLabel': 'Categoría de regla',
    'catalog.card.toolsLabel': 'Herramientas',
    'catalog.card.remotesLabel': 'Puntos de acceso remotos',
    'catalog.card.definitionLabel': 'Definición',
    'catalog.card.modelsTitle': 'Modelos',
    'catalog.card.modelTitle': 'Modelo',
    'catalog.card.viewModels': 'Ver todos los modelos',
    'catalog.card.modelsDialogTitle': 'Modelos disponibles',
    'catalog.card.modelSearch': 'Buscar modelos',
    'catalog.card.noModelsMatch': 'Ningún modelo coincide con su búsqueda.',
    'catalog.card.instructionsTitle': 'Instrucciones del agente',
    'catalog.card.handoffDescriptionTitle': 'Descripción de transferencia',
    'catalog.card.handoffTargetsTitle': 'Destinos de transferencia',
    'catalog.card.ragEnabledLabel': 'RAG habilitado',
    'catalog.card.yes': 'Sí',
    'catalog.card.no': 'No',
    'catalog.table.name': 'Nombre',
    'catalog.table.type': 'Tipo',
    'catalog.table.owner': 'Propietario',
    'catalog.table.provider': 'Proveedor',
    'catalog.table.description': 'Descripción',
    'catalog.empty.title': 'No hay recursos de IA disponibles',
    'catalog.empty.description':
      'Los recursos de IA aparecen aquí después de ser publicados o sincronizados desde su catálogo. En la primera carga, esto puede tardar un momento.',
    'catalog.empty.refresh': 'Actualizar',
    'catalog.empty.learnMore': 'Cómo publicar',
    'catalog.emptyFiltered.title':
      'Ningún recurso de IA coincide con sus filtros',
    'catalog.emptyFiltered.description':
      'Intente ajustar sus criterios de búsqueda o filtro para encontrar lo que busca.',
    'catalog.emptyFiltered.clearFilters': 'Borrar filtros',
    'catalog.error.title': 'Error al cargar los recursos de IA',
    'catalog.error.description':
      'Hubo un problema al conectar con el catálogo. Verifique su conexión de red e intente nuevamente.',
    'catalog.error.retry': 'Reintentar',
    'nav.aiCatalog': 'Catálogo de IA',
  },
});

export default aiCatalogTranslationEs;
