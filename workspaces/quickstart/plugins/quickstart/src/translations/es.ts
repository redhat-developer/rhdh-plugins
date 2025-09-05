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
import { quickstartTranslationRef } from './ref';

const quickstartTranslationEs = createTranslationMessages({
  ref: quickstartTranslationRef,
  messages: {
    'header.title': 'Comencemos con el Hub del Desarrollador',
    'header.subtitle': 'Te guiaremos a través de algunos pasos rápidos',
    'button.quickstart': 'Inicio rápido',
    'footer.progress': '{{progress}}% de progreso',
    'footer.notStarted': 'No iniciado',
    'footer.hide': 'Ocultar',
    'content.emptyState.title':
      'El contenido de inicio rápido no está disponible para tu rol.',
    'item.expandAriaLabel': 'Expandir detalles de {{title}}',
    'item.collapseAriaLabel': 'Contraer detalles de {{title}}',
    'item.expandButtonAriaLabel': 'Expandir elemento',
    'item.collapseButtonAriaLabel': 'Contraer elemento',
    'button.openQuickstartGuide': 'Abrir guía de inicio rápido',
    'button.closeDrawer': 'Cerrar cajón',
    'dev.pageTitle': 'Página de prueba del plugin Quickstart',
    'dev.pageDescription':
      'Esta es una página de prueba para el plugin Quickstart. Use los botones de abajo para interactuar con el cajón de inicio rápido.',
    'dev.drawerControls': 'Controles del cajón',
    'dev.currentState': 'Estado actual del cajón: {{state}}',
    'dev.stateOpen': 'Abierto',
    'dev.stateClosed': 'Cerrado',
    'dev.instructions': 'Instrucciones',
    'dev.step1':
      '1. Haga clic en "Abrir guía de inicio rápido" para abrir el cajón',
    'dev.step2': '2. Navegue a través de los pasos de inicio rápido',
    'dev.step3': '3. Pruebe el seguimiento del progreso completando pasos',
    'dev.step4':
      '4. El cajón puede cerrarse usando el botón de cerrar o los controles propios del cajón',
    'dev.step5': '5. El progreso se guarda automáticamente en localStorage',
  },
});

export default quickstartTranslationEs;
