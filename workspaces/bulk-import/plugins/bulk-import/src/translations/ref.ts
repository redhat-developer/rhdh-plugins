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

// CRITICAL: Export messages separately for testing
export const bulkImportMessages = {
  page: {
    title: 'Bulk import',
    subtitle: 'Import entities to Red Hat Developer Hub',
    addRepositoriesTitle: 'Add repositories',
    importEntitiesTitle: 'Import entities',
    addRepositoriesSubtitle:
      'Add repositories to Red Hat Developer Hub in 4 steps',
    importEntitiesSubtitle: 'Import to Red Hat Developer Hub',
    typeLink: 'Bulk import',
  },
  sidebar: {
    bulkImport: 'Bulk import',
  },
  permissions: {
    title: 'Permission required',
    addRepositoriesMessage:
      'To add repositories, contact your administrator to give you the `bulk.import` permission.',
    viewRepositoriesMessage:
      'To view the added repositories, contact your administrator to give you the `bulk.import` permission.',
  },
  repositories: {
    addedRepositories: 'Added repositories',
    importedEntities: 'Imported entities',
    addedRepositoriesCount: 'Added repositories ({{count}})',
    importedEntitiesCount: 'Imported entities ({{count}})',
    noRecordsFound: 'No repositories available to import.',
    noProjectsFound: 'No projects available to import.',
    refresh: 'Refresh',
    import: 'Import',
    removing: 'Removing...',
    deleteRepository: 'Delete Repository',
    removeRepositoryQuestion: 'Remove {{repoName}} {{repositoryText}}?',
    repositoryText: 'repository',
    removeRepositoryWarningScaffolder:
      'Removing a repository will also remove all associated scaffolder task info.',
    removeRepositoryWarning:
      'Removing a repository erases all associated information from the Catalog page.',
    removeRepositoryWarningGitlab:
      'Removing it will erase all associated information from the Catalog page.',
    cannotRemoveRepositoryUrl:
      'Cannot remove repository as the repository URL is missing.',
    unableToRemoveRepository: 'Unable to remove repository. {{error}}',
    removeTooltipDisabled:
      'This repository added to the app-config file. To remove it modify the file directly',
    removeTooltipRepositoryScaffolder:
      'Delete repository and associated scaffolder task info',
    errorOccuredWhileFetching: 'Error occured while fetching the pull request',
    failedToCreatePullRequest: 'Failed to create pull request',
    errorOccured: 'Error occured',
    editCatalogInfoTooltip: 'Edit catalog-info.yaml pull request',
    viewCatalogInfoTooltip: 'View catalog-info.yaml file',
    pr: 'PR',
  },
  status: {
    alreadyImported: 'Already imported',
    added: 'Added',
    waitingForApproval: 'Waiting for approval',
    imported: 'Imported',
    readyToImport: 'Ready to import',
    waitingForPullRequestToStart: 'Waiting for pull request to start',
    missingConfigurations: 'Missing configurations',
    failedCreatingPR: 'Failed to create PR',
    pullRequestRejected: 'Pull request rejected',
  },
  errors: {
    prErrorPermissions:
      "Couldn't create a new PR due to insufficient permissions. Contact your administrator.",
    catalogInfoExists:
      'Since catalog-info.yaml already exists in the repository, no new PR will be created. However, the entity will still be registered in the catalog page.',
    catalogEntityConflict:
      "Couldn't create a new PR because of catalog entity conflict.",
    repoEmpty:
      "Couldn't create a new PR because the repository is empty. Push an initial commit to the repository.",
    codeOwnersNotFound:
      'CODEOWNERS file is missing from the repository. Add a CODEOWNERS file to create a new PR.',
    errorOccurred: 'Error occurred',
    failedToCreatePullRequest: 'Failed to create pull request',
  },
  validation: {
    componentNameInvalid:
      '"{{value}}" is not valid; expected a string that is sequences of [a-zA-Z0-9] separated by any of [-_.], at most 63 characters in total. To learn more about catalog file format, visit: https://github.com/backstage/backstage/blob/master/docs/architecture-decisions/adr002-default-catalog-file-format.md',
    componentNameRequired: 'Component name is required',
    entityOwnerRequired: 'Entity Owner is required',
    titleRequired: '{{approvalTool}} title is required',
    descriptionRequired: '{{approvalTool}} description is required',
    keyValuePairFormat:
      'Each entry must have a key and a value separated by a colon.',
  },
  table: {
    headers: {
      name: 'Name',
      url: 'URL',
      repoUrl: 'Repo URL',
      organization: 'Organization',
      organizationGroup: 'Organization/group',
      group: 'Group',
      status: 'Status',
      lastUpdated: 'Last updated',
      actions: 'Actions',
      catalogInfoYaml: 'catalog-info.yaml',
    },
    pagination: {
      rows5: '5 rows',
      rows10: '10 rows',
      rows20: '20 rows',
      rows50: '50 rows',
      rows100: '100 rows',
    },
  },
  steps: {
    chooseApprovalTool:
      'Choose a source control tool for pull request creation',
    chooseRepositories: 'Choose repositories you want to add',
    chooseItems: 'Choose which items you want to import',
    generateCatalogInfo:
      'Generate a catalog-info.yaml file for each repository',
    generateCatalogInfoItems:
      'Generate a catalog-info.yaml file for each selected item',
    editPullRequest: 'View the pull request details',
    trackStatus: 'Track the approval status',
  },
  addRepositories: {
    approvalTool: {
      title: 'Source control tool',
      description: 'Choose source control tool for PR creation',
      tooltip:
        'Importing requires approval. After the pull request is approved, the repositories will be imported to the Catalog page.',
      github: 'GitHub',
      gitlab: 'GitLab',
    },
    repositoryType: {
      title: 'Repository type',
      repository: 'Repository',
      organization: 'Organization',
      project: 'Project',
      group: 'Group',
    },
    searchPlaceholder: 'Search',
    clearSearch: 'clear search',
    noRepositoriesFound: 'No repositories found',
    allRepositoriesAdded: 'All repositories are added',
    noSelection: 'None',
    selectRepositories: 'Select repositories',
    selectedRepositories: 'repositories',
    selectedProjects: 'projects',
    selectedLabel: 'Selected',
    selectedCount: '{{count}} selected',
    addSelected: 'Add selected',
    generateCatalogInfo: 'Generate catalog-info.yaml',
    editPullRequest: 'Edit pull request',
    preview: 'Preview',
  },
  catalogInfo: {
    status: {
      generating: 'Generating',
      notGenerated: 'Not Generated',
    },
  },
  common: {
    add: 'Add',
    cancel: 'Cancel',
    close: 'Close',
    delete: 'Delete',
    edit: 'Edit',
    filter: 'Filter',
    import: 'Import',
    remove: 'Remove',
    save: 'Save',
    select: 'Select',
    update: 'Update',
    view: 'View',
  },
  time: {
    daysAgo: '{{count}} day(s) ago',
    hoursAgo: '{{count}} hour(s) ago',
    minutesAgo: '{{count}} minute(s) ago',
    secondsAgo: '{{count}} second(s) ago',
  },
  previewFile: {
    previewFile: 'Preview file',
    previewFiles: 'Preview files',
    failedToCreatePR: 'Failed to create PR',
    prCreationUnsuccessful:
      'PR creation was unsuccessful for some repositories. Click on `Edit` to see the reason.',
    failedToFetchPR:
      'Failed to fetch the pull request. A new YAML has been generated below.',
    invalidEntityYaml:
      'The entity YAML in your pull request is invalid (empty file or missing apiVersion, kind, or metadata.name). A new YAML has been generated below.',
    pullRequestPendingApproval:
      'The [{{pullRequestText}}]({{pullRequestUrl}}) is pending approval',
    pullRequestText: 'pull request',
    viewRepository: 'View repository',
    closeDrawer: 'Close the drawer',
    keyValuePlaceholder: 'key1: value2; key2: value2',
    useSemicolonSeparator: 'Use semicolon to separate {{label}}',
    preview: 'Preview',
    pullRequest: {
      title: 'Pull request',
      mergeRequest: 'Merge request',
      serviceNowTicket: 'ServiceNow ticket',
      details: '{{tool}} details',
      titleLabel: '{{tool}} title',
      bodyLabel: '{{tool}} body',
      titlePlaceholder: 'Add Backstage catalog entity descriptor files',
      bodyPlaceholder: 'A describing text with Markdown support',
      entityConfiguration: 'Entity configuration',
      componentNameLabel: 'Name of the created component',
      componentNamePlaceholder: 'Component Name',
      entityOwnerLabel: 'Entity owner',
      entityOwnerPlaceholder: 'groups and users',
      entityOwnerHelper:
        'Select an owner from the list or enter a reference to a Group or a User',
      loadingText: 'Loading groups and users',
      previewEntities: 'Preview entities',
      annotations: 'Annotations',
      labels: 'Labels',
      spec: 'Spec',
      useCodeOwnersFile: 'Use *CODEOWNERS* file as Entity Owner',
      codeOwnersWarning:
        'WARNING: This may fail if no CODEOWNERS file is found at the target location.',
    },
  },
  forms: {
    footer: {
      createServiceNowTicket: 'Create ServiceNow ticket',
      createServiceNowTickets: 'Create ServiceNow tickets',
      createPullRequest: 'Create pull request',
      createPullRequests: 'Create pull requests',
      selectRepositoryTooltip: 'Select a repository to import.',
      serviceNowTooltip:
        'Catalog-info.yaml files must be generated before creating a ServiceNow ticket',
      importTooltip:
        'The Catalog-info.yaml files need to be generated for import.',
      pullRequestTooltip:
        'Catalog-info.yaml files must be generated before creating a pull request',
    },
  },
  tasks: {
    tasksFor: 'Tasks for {{importJobStatusId}}',
    taskId: 'Task ID',
    taskLink: 'Task Link',
    viewTask: 'View task',
    loading: 'Loading...',
    errorFetchingData: 'Error fetching data',
    taskCancelled: 'Task cancelled',
    taskCompleted: 'Task completed',
    taskFailed: 'Failed to create PR',
    taskOpen: 'Waiting for pull request to start',
    taskProcessing: 'Task processing',
    taskSkipped: 'Task skipped',
  },
};

/**
 * Translation reference for bulk import plugin
 * @public
 */
export const bulkImportTranslationRef = createTranslationRef({
  id: 'plugin.bulk-import',
  messages: bulkImportMessages,
});
