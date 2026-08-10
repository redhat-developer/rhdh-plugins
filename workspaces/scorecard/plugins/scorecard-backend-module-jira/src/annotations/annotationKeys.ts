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

import type { JiraFilterAnnotations } from './types';

export enum ScorecardJiraAnnotations {
  PROJECT_KEY = 'jira/project-key',
  COMPONENT = 'jira/component',
  LABEL = 'jira/label',
  TEAM = 'jira/team',
  CUSTOM_FILTER = 'jira/custom-filter',
}

/**
 * Annotations used by the `jira:incidents` collector.
 * `INCIDENT_PROJECT_KEY` falls back to {@link ScorecardJiraAnnotations.PROJECT_KEY}.
 * Component, label, team, and custom-filter are incident-specific (no fallback).
 * `INCIDENT_ISSUE_TYPE` overrides app-config
 * `scorecard.plugins.jira.collectors.incidents.options.issueType`
 * when set; otherwise the app-config value or default `Incident` is used.
 */
export enum ScorecardJiraIncidentAnnotations {
  INCIDENT_PROJECT_KEY = 'jira/incident-project-key',
  INCIDENT_COMPONENT = 'jira/incident-component',
  INCIDENT_LABEL = 'jira/incident-label',
  INCIDENT_TEAM = 'jira/incident-team',
  INCIDENT_CUSTOM_FILTER = 'jira/incident-custom-filter',
  INCIDENT_ISSUE_TYPE = 'jira/incident-issue-type',
}

/**
 * Maps open-issues JQL filter slots to {@link ScorecardJiraAnnotations}.
 */
export const OPEN_ISSUES_FILTER_ANNOTATIONS: JiraFilterAnnotations = {
  project: ScorecardJiraAnnotations.PROJECT_KEY,
  component: ScorecardJiraAnnotations.COMPONENT,
  label: ScorecardJiraAnnotations.LABEL,
  team: ScorecardJiraAnnotations.TEAM,
  customFilter: ScorecardJiraAnnotations.CUSTOM_FILTER,
};

/**
 * Maps incident JQL filter slots to {@link ScorecardJiraIncidentAnnotations}
 * (except {@link ScorecardJiraIncidentAnnotations.INCIDENT_ISSUE_TYPE}, which
 * is resolved by incident JQL).
 */
export const INCIDENT_FILTER_ANNOTATIONS: JiraFilterAnnotations = {
  project: ScorecardJiraIncidentAnnotations.INCIDENT_PROJECT_KEY,
  component: ScorecardJiraIncidentAnnotations.INCIDENT_COMPONENT,
  label: ScorecardJiraIncidentAnnotations.INCIDENT_LABEL,
  team: ScorecardJiraIncidentAnnotations.INCIDENT_TEAM,
  customFilter: ScorecardJiraIncidentAnnotations.INCIDENT_CUSTOM_FILTER,
};
