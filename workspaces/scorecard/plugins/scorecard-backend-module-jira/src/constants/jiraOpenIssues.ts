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

/**
 * Jira open issues thresholds configuration path
 * @public
 */
export const THRESHOLDS_CONFIG_PATH =
  'scorecard.plugins.jira.open_issues.thresholds' as const;

/**
 * Jira integration configuration path
 * @public
 */
export const JIRA_CONFIG_PATH = 'jira' as const;

/**
 * Jira open issues options configuration path
 * @public
 */
export const JIRA_OPTIONS_PATH =
  'scorecard.plugins.jira.open_issues.options' as const;

export const DATA_CENTER_API_VERSION = 2 as const;

export const CLOUD_API_VERSION = 3 as const;

export const JIRA_MANDATORY_FILTER =
  'type = Bug AND resolution = Unresolved' as const;
