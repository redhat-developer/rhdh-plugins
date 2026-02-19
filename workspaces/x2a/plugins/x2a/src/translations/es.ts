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
import { x2aPluginTranslationRef } from './ref';

/**
 * Spanish translation for the x2a plugin.
 * @public
 */
const x2aPluginTranslationEs = createTranslationMessages({
  ref: x2aPluginTranslationRef,
  messages: {
    'sidebar.x2a.title': 'Hub de conversión',
    'page.title': 'Hub de conversión',
    'page.subtitle':
      'Inicie y realice el seguimiento de las conversiones asíncronas de archivos Chef a playbooks Ansible listos para producción.',
    'page.devTitle': 'Hub de conversión',
    'table.columns.name': 'Nombre',
    'table.columns.abbreviation': 'Abreviatura',
    'table.columns.status': 'Estado',
    'table.columns.description': 'Descripción',
    'table.columns.sourceRepo': 'Repositorio de origen',
    'table.columns.targetRepo': 'Repositorio de destino',
    'table.columns.createdAt': 'Creado el',
    'table.actions.deleteProject': 'Eliminar proyecto',
    'table.detailPanel': 'TODO: Detalles del proyecto {{name}}',
    'table.projectsCount': 'Proyectos ({{count}})',
    'project.description': 'Descripción',
    'project.id': 'ID',
    'project.abbreviation': 'Abreviatura',
    'project.createdBy': 'Creado por',
    'project.statuses.none': '-',
    'project.statuses.created': 'Creado',
    'project.statuses.initializing': 'Inicializando',
    'project.statuses.initialized': 'Inicializado',
    'project.statuses.inProgress': 'En curso',
    'project.statuses.completed': 'Completado',
    'project.statuses.failed': 'Fallido',
    'common.newProject': 'Nuevo proyecto',
    'wizard.cancel': 'Cancelar',
    'wizard.back': 'Atrás',
    'wizard.next': 'Siguiente',
    'module.phases.init': 'Inicio',
    'module.phases.none': '-',
    'module.phases.analyze': 'Analizar',
    'module.phases.migrate': 'Migrar',
    'module.phases.publish': 'Publicar',
    'module.summary.total': 'Total',
    'module.summary.finished': 'Finalizado',
    'module.summary.waiting': 'En espera',
    'module.summary.pending': 'Pendiente',
    'module.summary.running': 'En ejecución',
    'module.summary.error': 'Error',
    'module.summary.toReview': 'para revisar',
    'module.actions.runNextPhase': 'Ejecutar siguiente fase',
    'module.currentPhase': 'Fase actual',
    'module.lastUpdate': 'Última actualización',
    'module.notStarted': 'No iniciado',
    'module.lastPhase': 'Última fase',
    'module.name': 'Nombre',
    'module.status': 'Estado',
    'module.sourcePath': 'Ruta de origen',
    'module.artifacts': 'Artefactos',
    'module.startedAt': 'Iniciado el',
    'module.finishedAt': 'Finalizado el',
    'artifact.types.migration_plan': 'Plan de migración',
    'artifact.types.module_migration_plan': 'Plan del módulo',
    'module.statuses.none': '-',
    'module.statuses.pending': 'Pendiente',
    'module.statuses.running': 'En ejecución',
    'module.statuses.success': 'Éxito',
    'module.statuses.error': 'Error',
    'artifact.types.migrated_sources': 'Fuentes migradas',
    'artifact.types.project_metadata': 'Metadatos del proyecto',
    'modulePage.title': 'Detalles del módulo',
    'modulePage.artifacts.title': 'Artefactos',
    'modulePage.artifacts.migration_plan':
      'Plan de migración general del proyecto',
    'modulePage.artifacts.module_migration_plan':
      'Plan del módulo por análisis',
    'modulePage.artifacts.migrated_sources': 'Fuentes migradas',
    'modulePage.artifacts.description':
      'Estos artefactos son generados por el proceso de conversión y están disponibles para revisión.',
    'modulePage.phases.id': 'ID',
    'modulePage.phases.duration': 'Duración',
    'modulePage.phases.k8sJobName': 'Nombre del trabajo de Kubernetes',
    'modulePage.phases.startedAt': 'Iniciado el',
    'modulePage.phases.status': 'Estado',
    'modulePage.phases.errorDetails': 'Detalles del error',
    'modulePage.phases.reanalyzeInstructions':
      'El plan de migración del módulo ya existe. Si el plan de migración general del proyecto se ha actualizado, vuelva a ejecutar el análisis para reflejar los cambios.',
    'modulePage.phases.rerunAnalyze': 'Recrear el plan de migración del módulo',
    'modulePage.phases.analyzeInstructions':
      'Antes de ejecutar el análisis, revise primero el plan de migración general del proyecto; su contenido guiará el análisis del módulo.',
    'modulePage.phases.runAnalyze': 'Crear plan de migración del módulo',
    'modulePage.phases.migrateInstructions':
      'Antes de ejecutar la migración, revise el plan de migración del módulo. El proceso de migración convertirá el código Chef a Ansible basado en el plan.',
    'modulePage.phases.runMigrate': 'Migrar fuentes del módulo',
    'modulePage.phases.remigrateInstructions':
      'Las fuentes migradas ya existen. Vuelva a ejecutar la migración para recrear el código Ansible convertido.',
    'modulePage.phases.rerunMigrate': 'Recrear fuentes migradas',
    'modulePage.phases.publishInstructions':
      'Antes de publicar, revise las fuentes migradas. El proceso de publicación confirmará el código convertido en el repositorio de destino.',
    'modulePage.phases.runPublish': 'Publicar en el repositorio de destino',
    'modulePage.phases.republishInstructions':
      'El módulo ya ha sido publicado. Vuelva a ejecutar la publicación para actualizar el repositorio de destino.',
    'modulePage.phases.rerunPublish':
      'Volver a publicar en el repositorio de destino',
    'modulePage.phases.commitId': 'Ultimo ID de commit',
    'modulePage.phases.viewLog': 'Ver registro',
    'modulePage.phases.hideLog': 'Ocultar registro',
  },
});

export default x2aPluginTranslationEs;
