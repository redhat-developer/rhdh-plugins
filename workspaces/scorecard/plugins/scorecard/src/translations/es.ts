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
import { scorecardTranslationRef } from './ref';

/**
 * es translation for plugin.scorecard.
 * @public
 */
const scorecardTranslationEs = createTranslationMessages({
  ref: scorecardTranslationRef,
  messages: {
    'emptyState.title': 'Aún no se agregaron tarjetas de puntuación',
    'emptyState.description':
      'Las tarjetas de puntuación ayudan a monitorear el estado del componente de un vistazo. Para comenzar, explore la documentación para obtener pautas de configuración.',
    'emptyState.altText': 'No hay tarjetas de puntuación',
    'permissionRequired.title': 'Permiso faltante',
    'permissionRequired.description':
      'Para ver el complemento de tarjetas de puntuación, comuníquese con su administrador para que le otorgue el permiso {{permission}}.',
    'permissionRequired.altText': 'Permiso requerido',
    'errors.entityMissingProperties':
      'Entidad a la que le faltan las propiedades requeridas para la búsqueda en la tarjeta de puntuación',
    'errors.invalidApiResponse':
      'Formato de respuesta no válido de la API de la tarjeta de puntuación',
    'errors.fetchError':
      'Error al extraer las tarjetas de puntuación: {{error}}',
    'errors.invalidThresholds': 'Umbrales no válidos',
    'errors.missingPermission': 'Permiso faltante',
    'errors.missingPermissionMessage':
      'Para ver las métricas de la tarjeta de puntuación, su administrador debe otorgarle el permiso requerido.',
  },
});

export default scorecardTranslationEs;
