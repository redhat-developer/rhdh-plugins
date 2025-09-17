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
import { homepageTranslationRef } from './ref';

/**
 * Spanish translation for Homepage.
 * @public
 */
const homepageTranslationEs = createTranslationMessages({
  ref: homepageTranslationRef,
  messages: {
    'header.welcome': '¡Bienvenido de vuelta!',
    'header.welcomePersonalized': '¡Bienvenido de vuelta, {{name}}!',
    'header.local': 'Local',
    'homePage.empty':
      'No se configuraron o encontraron tarjetas de página de inicio (puntos de montaje).',
    'search.placeholder': 'Buscar',
    'quickAccess.title': 'Acceso rápido',
    'quickAccess.fetchError': 'No se pudieron obtener los datos.',
    'quickAccess.error': 'Error desconocido',
    'featuredDocs.learnMore': ' Saber más',
    'templates.title': 'Explorar plantillas',
    'templates.fetchError': 'No se pudieron obtener los datos.',
    'templates.error': 'Error desconocido',
    'templates.empty': 'Aún no se han añadido plantillas',
    'templates.emptyDescription':
      'Una vez que se agreguen plantillas, este espacio mostrará contenido relevante adaptado a tu experiencia.',
    'templates.register': 'Registrar una plantilla',
    'templates.viewAll': 'Ver todas las {{count}} plantillas',
    'onboarding.greeting.goodMorning': 'Buenos días',
    'onboarding.greeting.goodAfternoon': 'Buenas tardes',
    'onboarding.greeting.goodEvening': 'Buenas noches',
    'onboarding.guest': 'Invitado',
    'onboarding.getStarted.title': 'Comenzar',
    'onboarding.getStarted.description': 'Aprende sobre Red Hat Developer Hub.',
    'onboarding.getStarted.buttonText': 'Leer documentación',
    'onboarding.getStarted.ariaLabel':
      'Leer documentación (se abre en una nueva pestaña)',
    'onboarding.explore.title': 'Explorar',
    'onboarding.explore.description': 'Explora componentes, APIs y plantillas.',
    'onboarding.explore.buttonText': 'Ir al catálogo',
    'onboarding.explore.ariaLabel': 'Ir al catálogo',
    'onboarding.learn.title': 'Aprender',
    'onboarding.learn.description': 'Explora y desarrolla nuevas habilidades.',
    'onboarding.learn.buttonText': 'Ir a rutas de aprendizaje',
    'onboarding.learn.ariaLabel': 'Ir a rutas de aprendizaje',
    'entities.title': 'Explora tu catálogo de software',
    'entities.fetchError': 'No se pudieron obtener los datos.',
    'entities.error': 'Error desconocido',
    'entities.description':
      'Explora los sistemas, componentes, recursos y APIs disponibles en tu organización.',
    'entities.close': 'cerrar',
    'entities.empty': 'Aún no se ha añadido catálogo de software',
    'entities.emptyDescription':
      'Una vez que se agreguen catálogos de software, este espacio mostrará contenido relevante adaptado a tu experiencia.',
    'entities.register': 'Registrar un componente',
    'entities.viewAll': 'Ver todas las {{count}} entidades del catálogo',
  },
});

export default homepageTranslationEs;
