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
    'page.title': 'Adoption Insights',
    'header.title': 'Adoption Insights',
    'header.dateRange.today': 'Hoy',
    'header.dateRange.lastWeek': 'La semana pasada',
    'header.dateRange.lastMonth': 'El mes pasado',
    'header.dateRange.last28Days': 'Últimos 28 días',
    'header.dateRange.lastYear': 'El año pasado',
    'header.dateRange.dateRange': 'Rango de fechas...',
    'header.dateRange.cancel': 'Cancelar',
    'header.dateRange.ok': 'Aceptar',
    'header.dateRange.defaultLabel': 'Últimos 28 días',
    'header.dateRange.title': 'Rango de fechas',
    'header.dateRange.startDate': 'Fecha de inicio',
    'header.dateRange.endDate': 'Fecha de finalización',
    'activeUsers.title': 'Usuarios activos',
    'activeUsers.averagePrefix':
      'El promedio del número máximo de usuarios activos fue de',
    'activeUsers.averageText': '{{count}} por {{period}}',
    'activeUsers.averageSuffix': ' para este período.',
    'activeUsers.hour': 'hora',
    'activeUsers.day': 'día',
    'activeUsers.week': 'semana',
    'activeUsers.month': 'mes',
    'activeUsers.legend.newUsers': 'Nuevos usuarios',
    'activeUsers.legend.returningUsers': 'Usuarios recurrentes',
    'templates.title': 'Plantillas principales',
    'templates.topNTitle': '{{count}} plantillas principales',
    'templates.allTitle': 'Todas las plantillas',
    'catalogEntities.title': 'Entidades principales del catálogo',
    'catalogEntities.topNTitle': '{{count}} entidades principales del catálogo',
    'catalogEntities.allTitle': 'Todas las entidades del catálogo',
    'plugins.title': 'Complementos principales',
    'plugins.topNTitle': '{{count}} complementos principales',
    'plugins.allTitle': 'Todos los complementos',
    'techDocs.title': 'TechDocs principales',
    'techDocs.topNTitle': '{{count}} TechDocs principales',
    'techDocs.allTitle': 'Todos los TechDocs',
    'searches.title': 'Búsquedas principales',
    'searches.totalCount': '{{count}} búsquedas',
    'searches.averagePrefix': 'El recuento promedio de búsquedas fue de',
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
    'users.licensedNotLoggedIn': 'Con licencia (no conectados)',
    'users.ofTotal': 'de {{total}}',
    'users.tooltip':
      'Establezca el número de usuarios con licencia en el archivo app-config.yaml',
    'table.headers.name': 'Nombre',
    'table.headers.kind': 'Tipo',
    'table.headers.lastUsed': 'Último uso',
    'table.headers.views': 'Vistas',
    'table.headers.executions': 'Ejecuciones',
    'table.headers.trend': 'Tendencia',
    'table.headers.entity': 'Entidad',
    'table.pagination.topN': '{{count}} principales',
    'filter.all': 'Todo',
    'filter.selectKind': 'Seleccionar tipo',
    'common.noResults': 'No hay resultados para este rango de fechas.',
    'common.readMore': 'Leer más',
    'common.exportCSV': 'Exportar CSV',
    'common.downloading': 'Descargando...',
    'common.today': 'Hoy',
    'common.yesterday': 'Ayer',
    'common.numberOfSearches': 'Número de búsquedas',
    'common.filteredBy': 'filtrado por',
    'common.invalidDateFormat': 'Formato de fecha no válido',
    'common.csvFilename': 'active_users',
    'permission.title': 'Permisos faltantes',
    'permission.description':
      'Para ver el complemento "Adoption Insights", comuníquese con su administrador para que le otorgue permisos a adoption-insights.events.read.',
  },
});

export default adoptionInsightsTranslationEs;
