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

import { createTranslationRef } from '@backstage/core-plugin-api/alpha';

/**
 * Messages object containing all English translations.
 * Keys are flattened (dot-notation) to produce a deterministic key order
 * in the API report across different build environments.
 * @public
 */
export const x2aPluginMessages = {
  'artifact.types.migrated_sources': 'Migrated Sources',
  'artifact.types.migration_plan': 'Project Migration Plan',
  'artifact.types.module_migration_plan': 'Module Migration Plan',
  'artifact.types.project_metadata': 'Project Metadata',
  'common.newProject': 'New Project',
  'module.actions.runNextPhase': 'Run Next Phase',
  'module.artifacts': 'Artifacts',
  'module.finishedAt': 'Finished At',
  'module.lastPhase': 'Last Phase',
  'module.name': 'Name',
  'module.phases.analyze': 'Analyze',
  'module.phases.init': 'Init',
  'module.phases.migrate': 'Migrate',
  'module.phases.none': '-',
  'module.phases.publish': 'Publish',
  'module.sourcePath': 'Source Path',
  'module.startedAt': 'Started At',
  'module.status': 'Status',
  'module.statuses.error': 'Error',
  'module.statuses.none': '-',
  'module.statuses.pending': 'Pending',
  'module.statuses.running': 'Running',
  'module.statuses.success': 'Success',
  'module.summary.error': 'Error',
  'module.summary.finished': 'Finished',
  'module.summary.pending': 'Pending',
  'module.summary.running': 'Running',
  'module.summary.total': 'Total',
  'module.summary.waiting': 'Waiting',
  'page.devTitle': 'Conversion Hub',
  'page.subtitle':
    'Initiate and track the asynchronous conversions of Chef files into production-ready Ansible Playbooks.',
  'page.title': 'Conversion Hub',
  'project.abbreviation': 'Abbreviation',
  'project.createdBy': 'Created By',
  'project.description': 'Description',
  'project.id': 'ID',
  'project.statuses.completed': 'Completed',
  'project.statuses.created': 'Created',
  'project.statuses.failed': 'Failed',
  'project.statuses.initialized': 'Initialized',
  'project.statuses.initializing': 'Initializing',
  'project.statuses.inProgress': 'In progress',
  'project.statuses.none': '-',
  'sidebar.x2a.title': 'Conversion Hub',
  'table.actions.deleteProject': 'Delete project',
  'table.columns.abbreviation': 'Abbreviation',
  'table.columns.createdAt': 'Created At',
  'table.columns.description': 'Description',
  'table.columns.name': 'Name',
  'table.columns.sourceRepo': 'Source Repository',
  'table.columns.status': 'Status',
  'table.columns.targetRepo': 'Target Repository',
  'table.detailPanel': 'TODO: Details of {{name}} project',
  'table.projectsCount': 'Projects ({{count}})',
  'wizard.back': 'Back',
  'wizard.cancel': 'Cancel',
  'wizard.next': 'Next',
};

/**
 * Reference translation for the x2a plugin.
 * Defines all the translation keys used in the plugin.
 * @public
 */
export const x2aPluginTranslationRef = createTranslationRef({
  id: 'plugin.x2a',
  messages: x2aPluginMessages,
});
