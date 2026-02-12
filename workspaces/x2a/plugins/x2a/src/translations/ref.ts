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
 * This is our single source of truth for translations.
 * @public
 */
export const x2aPluginMessages = {
  sidebar: {
    x2a: {
      title: 'Conversion Hub',
    },
  },
  page: {
    title: 'Conversion Hub',
    subtitle:
      'Initiate and track the asynchronous conversions of Chef files into production-ready Ansible Playbooks.',
    devTitle: 'Conversion Hub',
  },
  table: {
    columns: {
      name: 'Name',
      abbreviation: 'Abbreviation',
      status: 'Status',
      description: 'Description',
      sourceRepo: 'Source Repository',
      targetRepo: 'Target Repository',
      createdAt: 'Created At',
    },
    actions: {
      deleteProject: 'Delete project',
    },
    detailPanel: 'TODO: Details of {{name}} project',
    projectsCount: 'Projects ({{count}})',
  },
  project: {
    description: 'Description',
    id: 'ID',
    abbreviation: 'Abbreviation',
    createdBy: 'Created By',
    statuses: {
      none: '-',
      created: 'Created',
      initializing: 'Initializing',
      initialized: 'Initialized',
      inProgress: 'In progress',
      completed: 'Completed',
      failed: 'Failed',
    },
  },
  common: {
    newProject: 'New Project',
  },
  wizard: {
    cancel: 'Cancel',
    back: 'Back',
    next: 'Next',
  },
  module: {
    phases: {
      init: 'Init',
      none: '-',
      analyze: 'Analyze',
      migrate: 'Migrate',
      publish: 'Publish',
    },
    summary: {
      total: 'Total',
      finished: 'Finished',
      waiting: 'Waiting',
      pending: 'Pending',
      running: 'Running',
      error: 'Error',
    },
    actions: {
      runNextPhase: 'Run Next Phase',
    },
    lastPhase: 'Last Phase',
    name: 'Name',
    status: 'Status',
    sourcePath: 'Source Path',
    artifacts: 'Artifacts',
    startedAt: 'Started At',
    finishedAt: 'Finished At',
    statuses: {
      none: '-',
      pending: 'Pending',
      running: 'Running',
      success: 'Success',
      error: 'Error',
    },
  },
  artifact: {
    types: {
      migration_plan: 'Project Migration Plan',
      module_migration_plan: 'Module Migration Plan',
      migrated_sources: 'Migrated Sources',
      project_metadata: 'Project Metadata',
    },
  },
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
