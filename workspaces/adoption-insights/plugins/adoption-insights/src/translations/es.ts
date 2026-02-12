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
import { adoptionInsightsTranslationRef } from './ref';

/**
 * Spanish translation for Adoption Insights.
 * @alpha
 */
const adoptionInsightsTranslationEs = createTranslationMessages({
  ref: adoptionInsightsTranslationRef,
  messages: {
    'page.title': 'Adoption Insights',
    'header.title': 'Adoption Insights',
    'header.dateRange.today': 'Hoy',
    'header.dateRange.lastWeek': 'Semana pasada',
    'header.dateRange.lastMonth': 'Mes pasado',
    'header.dateRange.last28Days': 'Últimos 28 días',
    'header.dateRange.lastYear': 'Año pasado',
    'header.dateRange.dateRange': 'Rango de fechas...',
    'header.dateRange.cancel': 'Cancelar',
    'header.dateRange.ok': 'OK',
    'header.dateRange.defaultLabel': 'Últimos 28 días',
    'header.dateRange.title': 'Rango de fechas',
    'header.dateRange.startDate': 'Fecha de inicio',
    'header.dateRange.endDate': 'Fecha de fin',
    'activeUsers.title': 'Usuarios Activos',
    'activeUsers.averagePrefix': 'El promedio de usuarios activos máximos fue',
    'activeUsers.averageText': '{{count}} por {{period}}',
    'activeUsers.averageSuffix': ' para este período.',
    'activeUsers.hour': 'hora',
    'activeUsers.day': 'día',
    'activeUsers.week': 'semana',
    'activeUsers.month': 'mes',
    'activeUsers.legend.newUsers': 'Nuevos usuarios',
    'activeUsers.legend.returningUsers': 'Usuarios recurrentes',
    'templates.title': 'Top plantillas',
    'templates.topNTitle': 'Top {{count}} plantillas',
    'templates.allTitle': 'Todas las plantillas',
    'catalogEntities.title': 'Top entidades del catálogo',
    'catalogEntities.topNTitle': 'Top {{count}} entidades del catálogo',
    'catalogEntities.allTitle': 'Todas las entidades del catálogo',
    'plugins.title': 'Top plugins',
    'plugins.topNTitle': 'Top {{count}} plugins',
    'plugins.allTitle': 'Todos los plugins',
    'techDocs.title': 'Top TechDocs',
    'techDocs.topNTitle': 'Top {{count}} TechDocs',
    'techDocs.allTitle': 'Todos los TechDocs',
    'searches.title': 'Top búsquedas',
    'searches.totalCount': '{{count}} búsquedas',
    'searches.averagePrefix': 'El promedio de búsquedas fue',
    'searches.averageText': '{{count}} por {{period}}',
    'searches.averageSuffix': ' para este período.',
    'searches.hour': 'hora',
    'searches.day': 'día',
    'searches.week': 'semana',
    'searches.month': 'mes',
    'users.title': 'Número total de usuarios',
    'users.haveLoggedIn': 'han iniciado sesión',
    'users.loggedInUsers': 'Usuarios conectados',
    'users.licensed': 'Con licencia',
    'users.licensedNotLoggedIn': 'Con licencia (sin conexión)',
    'users.ofTotal': 'de {{total}}',
    'users.tooltip':
      'Establece el número de usuarios con licencia en el archivo app-config.yaml',
    'table.headers.name': 'Nombre',
    'table.headers.kind': 'Tipo',
    'table.headers.lastUsed': 'Último uso',
    'table.headers.views': 'Visualizaciones',
    'table.headers.executions': 'Ejecuciones',
    'table.headers.trend': 'Tendencia',
    'table.headers.entity': 'Entidad',
    'table.pagination.topN': 'Top {{count}}',
    'filter.all': 'Todos',
    'filter.selectKind': 'Seleccionar tipo',
    'common.noResults': 'No hay resultados para este rango de fechas.',
    'common.readMore': 'Leer más',
    'common.exportCSV': 'Exportar CSV',
    'common.downloading': 'Descargando...',
    'common.today': 'Hoy',
    'common.yesterday': 'Ayer',
    'common.numberOfSearches': 'Número de búsquedas',
    'common.filteredBy': 'filtrado por',
    'common.invalidDateFormat': 'Formato de fecha inválido',
    'common.csvFilename': 'usuarios_activos',
    'permission.title': 'Permisos faltantes',
    'permission.description':
      'Para ver el plugin "Adoption Insights", contacta a tu administrador para obtener los permisos adoption-insights.events.read.',
  },
});

export default adoptionInsightsTranslationEs;
