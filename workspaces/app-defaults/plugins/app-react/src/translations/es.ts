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

import { createTranslationMessages } from '@backstage/frontend-plugin-api';
import { appReactTranslationRef } from './ref';

/**
 * @internal
 */
export default createTranslationMessages({
  ref: appReactTranslationRef,
  full: true,
  messages: {
    'catalog.entityTabGroups.Overview': 'Resumen',
    'catalog.entityTabGroups.Documentation': 'Documentación',
    'catalog.entityTabGroups.Development': 'Desarrollo',
    'catalog.entityTabGroups.Deployment': 'Despliegue',
    'catalog.entityTabGroups.Operation': 'Operación',
    'catalog.entityTabGroups.Observability': 'Observabilidad',
    'catalog.entityTabs.Overview': 'Resumen',
    'catalog.entityTabs.Docs': 'Documentación',
    'catalog.entityTabs.API': 'API',
    'catalog.entityTabs.Dependencies': 'Dependencias',
    'catalog.entityTabs.Definition': 'Definición',
    'catalog.entityTabs.APIs': 'APIs',
    'catalog.entityTabs.TechDocs': 'TechDocs',
    'catalog.entityTabs.Deployment Lifecycle': 'Ciclo de vida del despliegue',
    'catalog.entityTabs.Deployment Summary': 'Resumen del despliegue',
    'catalog.entityTabs.Pipelines': 'Pipelines',
    'catalog.entityTabs.Pull Requests': 'Pull Requests',
    'catalog.entityTabs.Bookmarks': 'Marcadores',
    'catalog.entityTabs.CI/CD': 'CI/CD',
    'catalog.entityTabs.CI/CD Statistics': 'Estadísticas de CI/CD',
    'catalog.entityTabs.Code Coverage': 'Cobertura de código',
    'catalog.entityTabs.Feedback': 'Comentarios',
    'catalog.entityTabs.GitHub Actions': 'GitHub Actions',
    'catalog.entityTabs.GitHub Issues': 'GitHub Issues',
    'catalog.entityTabs.CI/CD Security': 'Seguridad de CI/CD',
    'catalog.entityTabs.Build Artifacts': 'Artefactos de compilación',
    'catalog.entityTabs.Todo': 'Tareas pendientes',
    'catalog.entityTabs.Topology': 'Topología',
    'catalog.entityTabs.Workflows': 'Workflows',
  },
});
