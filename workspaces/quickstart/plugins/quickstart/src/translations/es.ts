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
    'steps.setupAuthentication.title': 'Configurar autenticación',
    'steps.setupAuthentication.description':
      'Configure credenciales de inicio de sesión seguras para proteger su cuenta del acceso no autorizado.',
    'steps.setupAuthentication.ctaTitle': 'Aprender más',
    'steps.configureRbac.title': 'Configurar RBAC',
    'steps.configureRbac.description':
      'Asigne roles y permisos para controlar quién puede ver, crear o editar recursos, asegurando una colaboración segura y eficiente.',
    'steps.configureRbac.ctaTitle': 'Gestionar acceso',
    'steps.configureGit.title': 'Configurar Git',
    'steps.configureGit.description':
      'Conecte sus proveedores de Git, como GitHub, para gestionar código, automatizar flujos de trabajo e integrar con características de la plataforma.',
    'steps.configureGit.ctaTitle': 'Aprender más',
    'steps.managePlugins.title': 'Gestionar plugins',
    'steps.managePlugins.description':
      'Explore e instale extensiones para agregar características, conectar con herramientas externas y personalizar su experiencia.',
    'steps.managePlugins.ctaTitle': 'Explorar plugins',
    'steps.importApplication.title': 'Importar aplicación',
    'steps.importApplication.description':
      'Importe su código y servicios existentes al catálogo para organizarlos y acceder a ellos a través de su portal de desarrollador.',
    'steps.importApplication.ctaTitle': 'Importar',
    'steps.learnAboutCatalog.title': 'Aprender sobre el Catálogo',
    'steps.learnAboutCatalog.description':
      'Descubra todos los componentes de software, servicios y APIs, y vea sus propietarios y documentación.',
    'steps.learnAboutCatalog.ctaTitle': 'Ver catálogo',
    'steps.exploreSelfServiceTemplates.title':
      'Explorar plantillas de autoservicio',
    'steps.exploreSelfServiceTemplates.description':
      'Use nuestras plantillas de autoservicio para configurar rápidamente nuevos proyectos, servicios o documentación.',
    'steps.exploreSelfServiceTemplates.ctaTitle': 'Explorar plantillas',
    'steps.findAllLearningPaths.title':
      'Encontrar todas las rutas de aprendizaje',
    'steps.findAllLearningPaths.description':
      'Integre e-learning personalizado en sus flujos de trabajo con rutas de aprendizaje para acelerar la incorporación, cerrar brechas de habilidades y promover mejores prácticas.',
    'steps.findAllLearningPaths.ctaTitle': 'Ver rutas de aprendizaje',
    'button.quickstart': 'Inicio rápido',
    'button.gotIt': '¡Entendido!',
    'footer.progress': '{{progress}}% de progreso',
    'footer.notStarted': 'No iniciado',
    'footer.hide': 'Ocultar',
    'footer.progressBarLabel': 'Progreso de inicio rápido',
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
