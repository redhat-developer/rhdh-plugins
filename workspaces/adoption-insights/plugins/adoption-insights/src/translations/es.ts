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
 * es translation for plugin.adoption-insights.
 * @public
 */
const adoptionInsightsTranslationEs = createTranslationMessages({
  ref: adoptionInsightsTranslationRef,
  messages: {
    'activeUsers.averagePrefix':
      'El promedio del número máximo de usuarios activos fue de',
    'activeUsers.averageSuffix': ' para este período.',
    'activeUsers.averageText': '{{count}} por {{period}}',
    'activeUsers.day': 'día',
    'activeUsers.hour': 'hora',
    'activeUsers.legend.newUsers': 'Nuevos usuarios',
    'activeUsers.legend.returningUsers': 'Usuarios recurrentes',
    'activeUsers.month': 'mes',
    'activeUsers.title': 'Usuarios activos',
    'activeUsers.week': 'semana',
    'catalogEntities.allTitle': 'Todas las entidades del catálogo',
    'catalogEntities.title': 'Entidades principales del catálogo',
    'catalogEntities.topNTitle': '{{count}} entidades principales del catálogo',
    'common.csvFilename': 'active_users',
    'common.downloading': 'Descargando...',
    'common.exportCSV': 'Exportar CSV',
    'common.filteredBy': 'filtrado por',
    'common.invalidDateFormat': 'Formato de fecha no válido',
    'common.loading': 'Cargando',
    'common.noResults': 'No hay resultados para este rango de fechas.',
    'common.numberOfSearches': 'Número de búsquedas',
    'common.readMore': 'Leer más',
    'common.today': 'Hoy',
    'common.yesterday': 'Ayer',
    'filter.all': 'Todo',
    'filter.selectKind': 'Seleccionar tipo',
    'header.dateRange.cancel': 'Cancelar',
    'header.dateRange.dateRange': 'Rango de fechas...',
    'header.dateRange.defaultLabel': 'Últimos 28 días',
    'header.dateRange.endDate': 'Fecha de finalización',
    'header.dateRange.last28Days': 'Últimos 28 días',
    'header.dateRange.lastMonth': 'El mes pasado',
    'header.dateRange.lastWeek': 'La semana pasada',
    'header.dateRange.lastYear': 'El año pasado',
    'header.dateRange.ok': 'Aceptar',
    'header.dateRange.startDate': 'Fecha de inicio',
    'header.dateRange.title': 'Rango de fechas',
    'header.dateRange.today': 'Hoy',
    'header.title': 'Adoption Insights',
    'page.title': 'Adoption Insights',
    'permission.description':
      'Para ver el complemento "Adoption Insights", comuníquese con su administrador para que le otorgue permisos a adoption-insights.events.read.',
    'permission.title': 'Permisos faltantes',
    'plugins.allTitle': 'Todos los complementos',
    'plugins.title': 'Complementos principales',
    'plugins.topNTitle': '{{count}} complementos principales',
    'searches.averagePrefix': 'El recuento promedio de búsquedas fue de',
    'searches.averageSuffix': ' para este período.',
    'searches.averageText': '{{count}} por {{period}}',
    'searches.day': 'día',
    'searches.hour': 'hora',
    'searches.month': 'mes',
    'searches.title': 'Búsquedas principales',
    'searches.totalCount': '{{count}} búsquedas',
    'searches.week': 'semana',
    'table.headers.entity': 'Entidad',
    'table.headers.executions': 'Ejecuciones',
    'table.headers.estTimeSaved': 'Tiempo estimado ahorrado',
    'table.headers.kind': 'Tipo',
    'table.headers.lastUsed': 'Último uso',
    'table.headers.name': 'Nombre',
    'table.headers.trend': 'Tendencia',
    'table.headers.views': 'Vistas',
    'table.pagination.topN': '{{count}} principales',
    'techDocs.allTitle': 'Todos los TechDocs',
    'techDocs.title': 'TechDocs principales',
    'techDocs.topNTitle': '{{count}} TechDocs principales',
    'templates.allTitle': 'Todas las plantillas',
    'templates.title': 'Plantillas principales',
    'templates.topNTitle': '{{count}} plantillas principales',
    'users.haveLoggedIn': 'han iniciado sesión',
    'users.licensed': 'Con licencia',
    'users.licensedNotLoggedIn': 'Con licencia (no conectados)',
    'users.loggedInUsers': 'Usuarios conectados',
    'users.ofTotal': 'de {{total}}',
    'users.title': 'Número total de usuarios',
    'users.tooltip':
      'Establezca el número de usuarios con licencia en app-config.yaml',
  },
});

export default adoptionInsightsTranslationEs;
