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
  pagination: {
    rows5: '5 rows',
    rows10: '10 rows',
    rows20: '20 rows',
    rows50: '50 rows',
    rows100: '100 rows',
    noRecordsFound: 'No records found',
  },
  repositories: {
    addedRepositories: 'Added repositories',
    importedEntities: 'Imported entities',
    addedRepositoriesCount: 'Added repositories ({{count}})',
    importedEntitiesCount: 'Imported entities ({{count}})',
    noRecordsFound: 'No records found',
    refresh: 'Refresh',
    import: 'Import',
    add: 'Add',
    remove: 'Remove',
    cancel: 'Cancel',
    removing: 'Removing...',
    close: 'Close',
    delete: 'Delete',
    deleteRepository: 'Delete Repository',
    removeRepositoryQuestion: 'Remove {{repoName}} {{repositoryText}}?',
    repositoryText: 'repository',
    removeRepositoryWarning:
      'Removing {{action}} erases all associated information from the Catalog page.',
    removeAction: 'a repository',
    removeActionGitlab: 'it will',
    cannotRemoveRepositoryUrl:
      'Cannot remove repository as the repository URL is missing.',
    unableToRemoveRepository: 'Unable to remove repository. {{error}}',
    removeTooltip: 'Remove',
    removeTooltipDisabled:
      'This repository added to the app-config file. To remove it modify the file directly',
    errorOccuredWhileFetching: 'Error occured while fetching the pull request',
    failedToCreatePullRequest: 'Failed to create pull request',
    errorOccured: 'Error occured',
    update: 'Update',
    view: 'View',
    editCatalogInfoTooltip: 'Edit catalog-info.yaml pull request',
    viewCatalogInfoTooltip: 'View catalog-info.yaml file',
    waitingForApproval: 'Waiting for approval',
    pr: 'PR',
  },
  status: {
    alreadyImported: 'Already imported',
    added: 'Added',
    waitingForApproval: 'Waiting for Approval',
    imported: 'Imported',
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
    codeOwnersNotFound: 'No CODEOWNERS file found in the repository',
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
    chooseApprovalTool: 'Choose approval tool (GitHub/GitLab) for PR creation',
    chooseRepositories: 'Choose repositories you want to add',
    chooseItems: 'Choose which items you want to import',
    generateCatalogInfo:
      'Generate a catalog-info.yaml file for each repository',
    generateCatalogInfoItems:
      'Generate a catalog-info.yaml file for each selected item',
    editPullRequest: 'Edit the pull request details if needed',
    trackStatus: 'Track the approval status',
  },
  addRepositories: {
    approvalTool: {
      title: 'Approval tool',
      description: 'Choose approval tool for PR creation',
      tooltip:
        'Importing requires approval. After the pull/merge request is approved, the repositories/projects will be imported to the Catalog page.',
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
    cancel: 'Cancel',
    add: 'Add',
    addSelected: 'Add selected',
    generateCatalogInfo: 'Generate catalog-info.yaml',
    editPullRequest: 'Edit pull request',
    preview: 'Preview',
    close: 'Close',
    save: 'Save',
    delete: 'Delete',
    sync: 'Sync',
    edit: 'Edit',
    refresh: 'Refresh',
    back: 'Back',
    next: 'Next',
    submit: 'Submit',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
  },
  catalogInfo: {
    status: {
      generating: 'Generating',
      notGenerated: 'Not Generated',
      added: 'Added',
      pending: 'Pending',
      failed: 'Failed',
      prOpened: 'PR opened',
      waitingForApproval: 'Waiting for approval',
      approved: 'Approved',
    },
    actions: {
      edit: 'Edit catalog-info.yaml',
      delete: 'Remove repository',
      sync: 'Sync repository',
      view: 'View catalog-info.yaml',
      createPr: 'Create pull request',
    },
  },
  pullRequest: {
    createTitle: 'Create Pull Request',
    editTitle: 'Edit Pull Request',
    descriptionLabel: 'Description',
    branch: 'Branch',
    targetBranch: 'Target branch',
    sourceBranch: 'Source branch',
    defaultBranch: 'Default branch',
    prTitle: 'Pull request title',
    prDescription: 'Pull request description',
    createPr: 'Create PR',
    updatePr: 'Update PR',
    viewPr: 'View PR',
    waitingForPr: 'Waiting for PR',
  },
  delete: {
    title: 'Remove repository?',
    message:
      'Are you sure you want to remove this repository from the catalog?',
    repositoryName: 'Repository: {{name}}',
    confirm: 'Remove',
    cancel: 'Cancel',
    success: 'Repository removed successfully',
    error: 'Failed to remove repository',
  },
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
    retry: 'Retry',
    refresh: 'Refresh',
    search: 'Search',
    filter: 'Filter',
    clear: 'Clear',
    apply: 'Apply',
    reset: 'Reset',
    export: 'Export',
    import: 'Import',
    download: 'Download',
    upload: 'Upload',
    create: 'Create',
    update: 'Update',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    open: 'Open',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    remove: 'Remove',
    add: 'Add',
    select: 'Select',
    selectAll: 'Select all',
    deselectAll: 'Deselect all',
    none: 'None',
    all: 'All',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    done: 'Done',
    finish: 'Finish',
    continue: 'Continue',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    send: 'Send',
    copy: 'Copy',
    paste: 'Paste',
    cut: 'Cut',
    undo: 'Undo',
    redo: 'Redo',
  },
  time: {
    daysAgo: '{{count}} day(s) ago',
    hoursAgo: '{{count}} hour(s) ago',
    minutesAgo: '{{count}} minute(s) ago',
    secondsAgo: '{{count}} second(s) ago',
  },
  notifications: {
    repositoryAdded: 'Repository added successfully',
    repositoryUpdated: 'Repository updated successfully',
    repositoryDeleted: 'Repository deleted successfully',
    catalogInfoUpdated: 'Catalog info updated successfully',
    pullRequestCreated: 'Pull request created successfully',
    pullRequestUpdated: 'Pull request updated successfully',
    syncCompleted: 'Sync completed successfully',
    operationFailed: 'Operation failed',
    unexpectedError: 'An unexpected error occurred',
    networkError: 'Network error. Please check your connection.',
    permissionDenied: 'Permission denied',
    notFound: 'Resource not found',
    timeout: 'Request timeout. Please try again.',
  },
  buttons: {
    select: 'Select',
    cancel: 'Cancel',
    create: 'Create',
    edit: 'Edit',
    view: 'View',
    none: 'None',
    import: 'Import',
    save: 'Save',
    close: 'Close',
  },
  previewFile: {
    edit: 'Edit',
    readyToImport: 'Ready to import',
    previewFile: 'Preview file',
    previewFiles: 'Preview files',
    failedToCreatePR: 'Failed to create PR',
    prCreationUnsuccessful:
      'PR creation was unsuccessful for some repositories. Click on `Edit` to see the reason.',
    failedToFetchPR:
      'Failed to fetch the pull request. A new YAML has been generated below.',
    invalidEntityYaml:
      'The entity YAML in your pull request is invalid (empty file or missing apiVersion, kind, or metadata.name). A new YAML has been generated below.',
    pullRequestPendingApprovalPrefix: 'The',
    pullRequestPendingApprovalSuffix: 'is pending approval',
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
      useCodeOwnersFile: 'Use CODEOWNERS file as Entity Owner',
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
      serviceNowTooltip:
        'Catalog-info.yaml files must be generated before creating a ServiceNow ticket',
      importTooltip:
        'The Catalog-info.yaml files need to be generated for import.',
      pullRequestTooltip:
        'Catalog-info.yaml files must be generated before creating a pull request',
    },
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
