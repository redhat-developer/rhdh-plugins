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
export const orchestratorMessages = {
  page: {
    title: 'Workflow Orchestrator',
    tabs: {
      workflows: 'Workflows',
      allRuns: 'All runs',
      workflowDetails: 'Workflow details',
      workflowRuns: 'Workflow runs',
    },
  },
  table: {
    title: {
      workflows: 'Workflows ({{count}})',
      allRuns: 'All runs ({{count}})',
      allWorkflowRuns: 'Workflow runs ({{count}})',
    },
    headers: {
      name: 'Name',
      runStatus: 'Run Status',
      started: 'Started',
      status: 'Status',
      workflowStatus: 'Workflow Status',
      duration: 'Duration',
      description: 'Description',
      lastRun: 'Last run',
      lastRunStatus: 'Last run status',
      runsLastMonth: 'Runs (last month)',
      successRatio: 'Success ratio',
      workflowName: 'Workflow name',
      version: 'Version',
      entity: 'Entity',
      runBy: 'Run by',
    },
    actions: {
      run: 'Run',
      runAsEvent: 'Run as Event',
      viewRuns: 'View runs',
      viewInputSchema: 'View input schema',
      viewRunVariables: 'View run variables',
    },
    status: {
      running: 'Running',
      failed: 'Failed',
      completed: 'Completed',
      aborted: 'Aborted',
      pending: 'Pending',
      active: 'Active',
    },
    filters: {
      status: 'Status',
      started: 'Started',
      entity: 'Entity',
      runBy: 'Run by',
      placeholder: 'Filter',
      clearAll: 'Clear all',
      startedOptions: {
        today: 'Today',
        yesterday: 'Yesterday',
        last7days: 'Last 7 days',
        thisMonth: 'This month',
      },
    },
  },
  workflow: {
    details: 'Details',
    definition: 'Workflow definition',
    inputSchema: 'Input schema',
    inputSchemaDescription:
      'Defines required data fields and validation for this workflow.',
    successRatio: 'Success ratio',
    successRatioDescription:
      'Share of completed runs versus failed runs for this workflow.',
    runSuccess: 'Run success',
    ofTotal: 'of {{totalCount}}',
    statsSuccess: 'Success',
    statsFailed: 'Failed',
    progress: 'Workflow progress',
    status: {
      available: 'Available',
      unavailable: 'Unavailable',
    },
    unavailable: {
      title: 'Unavailable workflow',
      runTooltip: 'Unavailable workflow',
      requestFailed: 'HTTP GET request to {{url}} failed.',
      statusCodeLine: 'Status Code: {{statusCode}}',
      statusTextLine: 'Status Text: {{reason}}',
    },
    fields: {
      entity: 'Entity',
      workflow: 'Workflow',
      workflowStatus: 'Workflow Status',
      runStatus: 'Run status',
      duration: 'Duration',
      averageDuration: 'Average duration',
      description: 'Description',
      started: 'Started',
      runBy: 'Run by',
      workflowId: 'Run ID',
      workflowIdCopied: 'Run ID copied to clipboard',
      version: 'Version',
    },
    errors: {
      retriggerFailed: 'Retrigger failed: {{reason}}',
      abortFailed: 'Abort failed: Run has already been completed.',
      abortFailedWithReason: 'Abort failed: {{reason}}',
      failedToLoadDetails: 'Failed to load details for the workflow ID: {{id}}',
    },
    messages: {
      areYouSureYouWantToRunThisWorkflow:
        'Are you sure you want to run this workflow?',
      userNotAuthorizedExecute: 'User not authorized to execute workflow.',
      workflowDown:
        'The workflow is currently down or in an error state. Running it now may fail or produce unexpected results.',
    },
    buttons: {
      run: 'Run',
      runAsEvent: 'Run as Event',
      runWorkflow: 'Run workflow',
      runAgain: 'Run again',
      running: 'Running...',
      entireWorkflow: 'Entire workflow',
      fromFailurePoint: 'From failure point',
      fromAbortedPoint: 'From aborted point',
      runFailedAgain: 'Run failed again',
    },
  },
  run: {
    title: 'Run workflow',
    pageTitle: '{{processName}} run',
    variables: 'Run Variables',
    inputs: 'Inputs',
    results: 'Results',
    logs: {
      viewLogs: 'View logs',
      title: '{{processName}} workflow logs',
      noLogsAvailable: 'No logs available for this workflow run.',
    },
    abort: {
      title: 'Abort workflow run?',
      button: 'Abort',
      warning:
        'Aborting will stop all in-progress and pending steps immediately. Any work in progress will be lost.',
      completed: {
        title: 'Run completed',
        message:
          'It is not possible to abort the run as it has already been completed.',
      },
    },
    status: {
      completed: 'Run completed',
      failed: 'Run has failed {{time}}',
      aborted: 'Run was aborted {{time}} ago.',
      abortedWithoutTime: 'Run was aborted.',
      completedWithMessage: 'Run completed {{time}} with message',
      failedAt: 'Run has failed {{time}}',
      completedAt: 'Run completed {{time}}',
      running: 'Workflow is running. Started {{time}}',
      runningWaitingAtNode:
        'Workflow is running - waiting at node {{node}} since {{formattedTime}}',
      workflowIsRunning: 'Workflow is running. Started {{time}}',
      noAdditionalInfo:
        'The workflow provided no additional info about the status.',
      resultsWillBeDisplayedHereOnceTheRunIsComplete:
        'Results will be displayed here once the run is complete.',
    },
    messages: {
      eventTriggered:
        'An event was sent to trigger this workflow. It will appear once the run starts.',
    },
    retrigger: 'Retrigger',
    viewVariables: 'View variables',
    suggestedNextWorkflow: 'Suggested next workflow',
    suggestedNextWorkflows: 'Suggested next workflows',
  },
  tooltips: {
    completed: 'Completed',
    active: 'Active',
    aborted: 'Aborted',
    suspended: 'Suspended',
    pending: 'Pending',
    workflowDown: 'Workflow is currently down or in an error state',
    userNotAuthorizedAbort: 'user not authorized to abort workflow',
    userNotAuthorizedExecute: 'user not authorized to execute workflow',
    retriggerNotSupportedForAborted:
      'Retrigger from the abort point is not supported. Use Entire workflow to start a new run with the same inputs.',
  },
  messages: {
    noDataAvailable: 'No data available',
    noVariablesFound: 'No variables found for this run.',
    noInputSchemaWorkflow: 'No input schema is defined for this workflow.',
    workflowInstanceNoInputs: 'The workflow instance has no inputs',
    missingJsonSchema: {
      title: 'Missing JSON Schema for Input Form',
      message:
        'This workflow does not have a JSON schema defined for input validation. You can still execute the workflow, but input validation will be limited.',
    },
    additionalDetailsAboutThisErrorAreNotAvailable:
      'Additional details about this error are not available',
  },
  reviewStep: {
    hiddenFieldsNote: 'Some parameters are hidden on this page.',
    showHiddenParameters: 'Show hidden parameters',
  },
  common: {
    close: 'Close',
    cancel: 'Cancel',
    execute: 'Execute',
    details: 'Details',
    links: 'Links',
    values: 'Values',
    back: 'Back',
    run: 'Run',
    next: 'Next',
    review: 'Review',
    unavailable: '---',
    goBack: 'Go back',
  },
  permissions: {
    accessDenied: 'Access Denied',
    accessDeniedDescription:
      'You do not have permission to view this workflow run.',
    requiredPermission: 'Required permission',
    contactAdmin:
      'Please contact your administrator to request the necessary permissions.',
    missingOwnership:
      'This workflow run does not have ownership information recorded.',
    notYourRun: 'This workflow run was initiated by another user.',
  },
  duration: {
    aFewSeconds: 'a few seconds',
    aSecond: 'a second',
    seconds: '{{count}} seconds',
    aMinute: 'a minute',
    minutes: '{{count}} minutes',
    anHour: 'an hour',
    hours: '{{count}} hours',
    aDay: 'a day',
    days: '{{count}} days',
    aMonth: 'a month',
    months: '{{count}} months',
    aYear: 'a year',
    years: '{{count}} years',
  },
  alerts: {
    duplicateWorkflowIds: {
      message:
        'Multiple workflows with the same ID detected. Please ensure unique IDs are used across different versions.',
      learnMore: 'Learn more',
    },
  },
  emptyState: {
    illustrationAlt: 'No workflows or runs illustration',
    workflows: {
      title: 'No workflows added yet',
      description: 'To get started, add a new workflow.',
      viewDocumentation: 'View documentation',
    },
    runs: {
      title: 'No runs yet',
      description:
        'Workflow runs will appear here once workflows have been executed.',
      runWorkflow: 'Run a workflow',
    },
  },
  stepperObjectField: {
    error:
      "Stepper object field is not supported for schema that doesn't contain properties",
  },
  formDecorator: {
    error: 'Form decorator must provide context data.',
  },
  samlSso: {
    title: 'GitHub SAML SSO Session Expired',
    reauthorizeButton: 'Re-authorize SSO',
    body: 'Your GitHub SAML SSO session has expired. Your organization requires an active SAML session to access its resources.',
    reauthorizeHint:
      "Click 'Re-authorize SSO' to re-authenticate with your organization's identity provider.",
    fallbackHint:
      'Please sign out and sign back in from Settings > Auth Providers to re-establish your SAML session.',
  },
  aria: {
    close: 'close',
  },
};

/**
 * Translation reference for the Orchestrator plugin.
 * Use with `useTranslationRef(orchestratorTranslationRef)` to get the `t` function for plugin messages.
 *
 * @public
 */
export const orchestratorTranslationRef = createTranslationRef({
  id: 'plugin.orchestrator',
  messages: orchestratorMessages,
});
