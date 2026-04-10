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

/**
 * es translation for plugin.quickstart.
 * @public
 */
const quickstartTranslationEs = createTranslationMessages({
  ref: quickstartTranslationRef,
  messages: {
    'header.title': 'Empecemos con Developer Hub',
    'header.subtitle': 'Aquí le explicamos algunos pasos rápidos',
    'steps.setupAuthentication.title': 'Configuración de la autenticación',
    'steps.setupAuthentication.description':
      'Configure credenciales de inicio de sesión seguras para proteger su cuenta de accesos no autorizados.',
    'steps.setupAuthentication.ctaTitle': 'Aprenda más',
    'steps.configureRbac.title': 'Configuración de RBAC',
    'steps.configureRbac.description':
      'Asigne roles y permisos para controlar quién puede ver, crear o modificar recursos, lo que garantiza una colaboración segura y eficiente.',
    'steps.configureRbac.ctaTitle': 'Administrar acceso',
    'steps.configureGit.title': 'Configuración de Git',
    'steps.configureGit.description':
      'Conecte sus proveedores de Git, como GitHub, para gestionar el código, automatizar flujos de trabajo e integrarlos en las funcionalidades de la plataforma.',
    'steps.configureGit.ctaTitle': 'Aprenda más',
    'steps.managePlugins.title': 'Gestión de complementos',
    'steps.managePlugins.description':
      'Explore e instale extensiones para agregar funcionalidades, conectarse con herramientas externas y personalizar su experiencia.',
    'steps.managePlugins.ctaTitle': 'Explorar complementos',
    'steps.importApplication.title': 'Aplicación de importación',
    'steps.importApplication.description':
      'Importe su código y servicios existentes al catálogo para organizarlos y acceder a ellos a través de su portal para desarrolladores.',
    'steps.importApplication.ctaTitle': 'Importar',
    'steps.learnAboutCatalog.title': 'Información sobre el Catálogo',
    'steps.learnAboutCatalog.description':
      'Descubra todos los componentes de software, servicios y API, y vea sus propietarios y documentación.',
    'steps.learnAboutCatalog.ctaTitle': 'Ver Catálogo',
    'steps.exploreSelfServiceTemplates.title':
      'Información sobre plantillas de autoservicio',
    'steps.exploreSelfServiceTemplates.description':
      'Utilice nuestras plantillas de autoservicio para configurar rápidamente nuevos proyectos, servicios o documentación.',
    'steps.exploreSelfServiceTemplates.ctaTitle': 'Explorar plantillas',
    'steps.findAllLearningPaths.title': 'Acceso a las rutas de aprendizaje',
    'steps.findAllLearningPaths.description':
      'Integre aprendizaje en línea personalizado en sus flujos de trabajo con rutas de aprendizaje, a fin de agilizar el proceso de incorporación, reducir brechas de habilidades y promover prácticas recomendadas.',
    'steps.findAllLearningPaths.ctaTitle': 'Ver rutas de aprendizaje',
    'button.quickstart': 'Inicio rápido',
    'button.openQuickstartGuide': 'Abrir la Guía de inicio rápido',
    'button.closeDrawer': 'Cerrar panel',
    'button.gotIt': '¡Entendido!',
    'snackbar.helpPrompt':
      '¿Necesita ayuda? Visite la Guía de inicio rápido haciendo clic en el icono (?) del encabezado.',
    'footer.progress': 'Progreso del {{progress}} %',
    'footer.notStarted': 'No iniciado',
    'footer.hide': 'Ocultar',
    'content.emptyState.title':
      'El contenido de inicio rápido no está disponible para su rol.',
    'item.expandAriaLabel': 'Expandir detalles de {{title}}',
    'item.collapseAriaLabel': 'Contraer detalles de {{title}}',
    'item.expandButtonAriaLabel': 'Expandir elemento',
    'item.collapseButtonAriaLabel': 'Contraer elemento',
    'dev.pageTitle': 'Página de prueba del complemento de inicio rápido',
    'dev.pageDescription':
      'Esta es una página de prueba para el complemento de inicio rápido. Utilice los botones a continuación para interactuar con el panel de inicio rápido.',
    'dev.drawerControls': 'Controles del panel',
    'dev.currentState': 'Estado actual del panel: {{state}}',
    'dev.stateOpen': 'Abierto',
    'dev.stateClosed': 'Cerrado',
    'dev.instructions': 'Instrucciones',
    'dev.step1':
      '1. Haga clic en "Abrir guía de inicio rápido" para abrir el panel',
    'dev.step2': '2. Navegue por los pasos de inicio rápido',
    'dev.step3': '3. Realice los pasos para probar el seguimiento del progreso',
    'dev.step4':
      '4. El panel se puede cerrar con el botón de cierre o los propios controles del panel',
    'dev.step5':
      '5. El progreso se guarda automáticamente en el almacenamiento local',
  },
});

export default quickstartTranslationEs;
